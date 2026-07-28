const {
  builderReducer,
  createInitialState,
  SAVE_STATES,
  createSection,
  findColumn
} = require('../builderReducer');
const fixtures = require('../../../../document/__fixtures__/templates');
const { GRID_COLUMNS } = require('../../../../document/documentModel');

const init = (template = fixtures.simpleForm()) => createInitialState(template);
const run = (state, actions) => actions.reduce(builderReducer, state);
const blocksOf = (state) => state.template.document.blocks;
const flowOf = (state) => blocksOf(state)
  .filter((block) => block.placement === 'flow')
  .sort((a, b) => (a.row - b.row) || (a.x - b.x));
const sectionBlock = (state, sectionId) => blocksOf(state).find((block) => block.refId === sectionId);

describe('initial state', () => {
  it('migrates a legacy template on open without touching its ids', () => {
    const template = fixtures.multiSectionForm();
    const state = init(template);

    expect(state.migratedOnOpen).toBe(true);
    expect(state.template.document.version).toBe(2);
    expect(state.template.sections.map((section) => section.id))
      .toEqual(['section_a', 'section_b', 'section_hidden']);
    expect(state.template.sections[0].fields.map((field) => field.key)).toEqual(['a1', 'a2']);
  });

  it('starts clean with no history', () => {
    const state = init();
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
    expect(state.saveState).toBe(SAVE_STATES.IDLE);
  });

  it('surfaces an unsupported document version instead of rendering it', () => {
    const template = fixtures.simpleForm();
    template.document = { version: 7, page: {}, grid: {}, blocks: [] };
    const state = init(template);
    expect(state.contractError).toBeTruthy();
    expect(state.contractError.code).toBe('unsupported_document_version');
  });
});

describe('adding blocks', () => {
  it('adds a component at the end of the flow', () => {
    const state = run(init(), [{ type: 'ADD_BLOCK', blockType: 'divider' }]);
    const flow = flowOf(state);
    expect(flow[flow.length - 1].type).toBe('divider');
    expect(state.saveState).toBe(SAVE_STATES.DIRTY);
  });

  it('adds a section together with its semantic section record', () => {
    const before = init();
    const state = run(before, [{ type: 'ADD_BLOCK', blockType: 'section' }]);
    expect(state.template.sections).toHaveLength(before.template.sections.length + 1);
    const added = state.template.sections[state.template.sections.length - 1];
    expect(sectionBlock(state, added.id)).toBeTruthy();
  });

  it('refuses a second header, footer or watermark', () => {
    const state = init();
    const before = blocksOf(state).filter((block) => block.type === 'header').length;
    const next = run(state, [{ type: 'ADD_BLOCK', blockType: 'header' }]);
    expect(blocksOf(next).filter((block) => block.type === 'header')).toHaveLength(before);
    expect(next).toBe(state);
  });

  it('drops a block into a specific row and column', () => {
    const state = run(init(), [{ type: 'ADD_BLOCK', blockType: 'qr', row: 0, x: 6, w: 6 }]);
    const qr = blocksOf(state).find((block) => block.type === 'qr');
    expect(qr.x).toBe(6);
    expect(qr.w).toBe(6);
  });
});

describe('moving and resizing', () => {
  it('moves a block to another row', () => {
    const state = init(fixtures.multiSectionForm());
    const block = sectionBlock(state, 'section_b');
    const next = run(state, [{ type: 'MOVE_BLOCK', blockId: block.id, row: 0, x: 0 }]);
    const moved = blocksOf(next).find((item) => item.id === block.id);
    expect(moved.row).toBe(0);
  });

  it('never lets a block leave the printable grid', () => {
    const state = init();
    const block = flowOf(state)[0];
    const next = run(state, [{ type: 'MOVE_BLOCK', blockId: block.id, row: 0, x: 999 }]);
    const moved = blocksOf(next).find((item) => item.id === block.id);
    expect(moved.x).toBeGreaterThanOrEqual(0);
    expect(moved.x + moved.w).toBeLessThanOrEqual(GRID_COLUMNS);
  });

  it('places a block on a new row instead of overlapping an occupied span', () => {
    let state = init(fixtures.multiSectionForm());
    const a = sectionBlock(state, 'section_a');
    const b = sectionBlock(state, 'section_b');

    // Shrink both so they *could* sit side by side, then aim B at A's span.
    state = run(state, [
      { type: 'RESIZE_BLOCK', blockId: a.id, w: 12 },
      { type: 'RESIZE_BLOCK', blockId: b.id, w: 12 }
    ]);
    const rowOfA = blocksOf(state).find((item) => item.id === a.id).row;
    state = run(state, [{ type: 'MOVE_BLOCK', blockId: b.id, row: rowOfA, x: 0 }]);

    const movedA = blocksOf(state).find((item) => item.id === a.id);
    const movedB = blocksOf(state).find((item) => item.id === b.id);
    const overlaps = movedA.row === movedB.row
      && movedA.x < movedB.x + movedB.w
      && movedB.x < movedA.x + movedA.w;
    expect(overlaps).toBe(false);
  });

  it('allows two blocks to share a row when the spans do not collide', () => {
    let state = init(fixtures.multiSectionForm());
    const a = sectionBlock(state, 'section_a');
    const b = sectionBlock(state, 'section_b');
    state = run(state, [
      { type: 'RESIZE_BLOCK', blockId: a.id, w: 12 },
      { type: 'RESIZE_BLOCK', blockId: b.id, w: 12 }
    ]);
    const rowOfA = blocksOf(state).find((item) => item.id === a.id).row;
    state = run(state, [{ type: 'MOVE_BLOCK', blockId: b.id, row: rowOfA, x: 12 }]);

    const movedA = blocksOf(state).find((item) => item.id === a.id);
    const movedB = blocksOf(state).find((item) => item.id === b.id);
    expect(movedB.row).toBe(movedA.row);
    expect(movedB.x).toBe(12);
  });

  it('resizes a fixed-height block', () => {
    let state = run(init(), [{ type: 'ADD_BLOCK', blockType: 'spacer' }]);
    const spacer = blocksOf(state).find((block) => block.type === 'spacer');
    state = run(state, [{ type: 'RESIZE_BLOCK', blockId: spacer.id, heightMm: 25 }]);
    expect(blocksOf(state).find((block) => block.id === spacer.id).heightMm).toBe(25);
  });

  it('refuses to move or resize a locked block', () => {
    let state = init();
    const block = flowOf(state)[0];
    state = run(state, [{ type: 'UPDATE_BLOCK', blockId: block.id, patch: { locked: true } }]);
    const before = blocksOf(state).find((item) => item.id === block.id);
    const next = run(state, [
      { type: 'MOVE_BLOCK', blockId: block.id, row: 9, x: 3 },
      { type: 'RESIZE_BLOCK', blockId: block.id, w: 6 }
    ]);
    const after = blocksOf(next).find((item) => item.id === block.id);
    expect(after.row).toBe(before.row);
    expect(after.w).toBe(before.w);
  });
});

describe('overlay blocks', () => {
  it('moves and resizes a free-positioned block in millimetres', () => {
    let state = run(init(), [{
      type: 'ADD_BLOCK', blockType: 'stamp', placement: 'overlay'
    }]);
    const stamp = blocksOf(state).find((block) => block.type === 'stamp');
    state = run(state, [
      { type: 'MOVE_OVERLAY', blockId: stamp.id, xMm: 120, yMm: 210 },
      { type: 'RESIZE_OVERLAY', blockId: stamp.id, wMm: 55, hMm: 55 }
    ]);
    const moved = blocksOf(state).find((block) => block.id === stamp.id);
    expect(moved.overlay.xMm).toBe(120);
    expect(moved.overlay.yMm).toBe(210);
    expect(moved.overlay.wMm).toBe(55);
  });
});

describe('reordering', () => {
  it('swaps two rows', () => {
    const state = init(fixtures.multiSectionForm());
    const b = sectionBlock(state, 'section_b');
    const next = run(state, [{ type: 'REORDER_BLOCK', blockId: b.id, direction: 'up' }]);
    const order = flowOf(next).filter((block) => block.type === 'section').map((block) => block.refId);
    expect(order.indexOf('section_b')).toBeLessThan(order.indexOf('section_a'));
  });

  it('keeps layout.sectionOrder in step with the visual order', () => {
    const state = init(fixtures.multiSectionForm());
    const b = sectionBlock(state, 'section_b');
    const next = run(state, [{ type: 'REORDER_BLOCK', blockId: b.id, direction: 'up' }]);
    expect(next.template.layout.sectionOrder[0]).toBe('section_b');
    expect(next.template.sections[0].id).toBe('section_b');
    expect(next.template.sections[0].order).toBe(0);
  });
});

describe('delete, duplicate, copy and paste', () => {
  it('deletes a section block and its section together', () => {
    const state = init(fixtures.multiSectionForm());
    const block = sectionBlock(state, 'section_a');
    const next = run(state, [{ type: 'DELETE_BLOCK', blockId: block.id }]);
    expect(next.template.sections.some((section) => section.id === 'section_a')).toBe(false);
    expect(blocksOf(next).some((item) => item.id === block.id)).toBe(false);
  });

  it('duplicates a section with brand-new ids so values never collide', () => {
    const state = init(fixtures.multiSectionForm());
    const block = sectionBlock(state, 'section_a');
    const next = run(state, [{ type: 'DUPLICATE_BLOCK', blockId: block.id }]);

    expect(next.template.sections).toHaveLength(4);
    const ids = next.template.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);

    const copy = next.template.sections.find((section) => section.label.en.includes('(Copy)'));
    expect(copy.id).not.toBe('section_a');
    expect(copy.fields.map((field) => field.key)).not.toEqual(['a1', 'a2']);
  });

  it('pastes a copied block as an independent component', () => {
    let state = init(fixtures.multiSectionForm());
    const block = sectionBlock(state, 'section_a');
    const section = state.template.sections.find((item) => item.id === 'section_a');

    state = builderReducer(state, { type: 'COPY', payload: { block, section } });
    expect(state.clipboard).toBeTruthy();

    state = builderReducer(state, { type: 'PASTE', payload: state.clipboard });
    expect(state.template.sections).toHaveLength(4);
    const ids = state.template.sections.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('fields', () => {
  it('adds, moves and resizes a field inside the section grid', () => {
    let state = init();
    const sectionId = state.template.sections[0].id;

    state = run(state, [{ type: 'ADD_FIELD', sectionId }]);
    const section = state.template.sections[0];
    const added = section.fields[section.fields.length - 1];

    state = run(state, [
      { type: 'MOVE_FIELD', sectionId, fieldKey: added.key, row: 0, x: 12 },
      { type: 'RESIZE_FIELD', sectionId, fieldKey: added.key, w: 6 }
    ]);

    const moved = state.template.sections[0].fields.find((field) => field.key === added.key);
    expect(moved.grid.w).toBe(6);
    expect(moved.grid.x).toBe(12);
  });

  it('keeps the legacy width token in sync with the grid span', () => {
    let state = init();
    const sectionId = state.template.sections[0].id;
    // `notes` is the only field on its row, so it can be resized freely.
    const fieldKey = 'notes';
    const widthOf = () => state.template.sections[0].fields.find((f) => f.key === fieldKey).width;

    expect(widthOf()).toBe('full');

    state = run(state, [{ type: 'RESIZE_FIELD', sectionId, fieldKey, w: 6 }]);
    expect(widthOf()).toBe('quarter');

    state = run(state, [{ type: 'RESIZE_FIELD', sectionId, fieldKey, w: 24 }]);
    expect(widthOf()).toBe('full');
  });

  it('refuses a resize that would overlap the next field in the row', () => {
    const state = init();
    const sectionId = state.template.sections[0].id;
    const fieldKey = state.template.sections[0].fields[0].key; // half-width, shares its row
    const next = run(state, [{ type: 'RESIZE_FIELD', sectionId, fieldKey, w: 24 }]);
    expect(next).toBe(state);
  });

  it('renumbers field order to reading order after a move', () => {
    let state = init(fixtures.multiSectionForm());
    const sectionId = 'section_b';
    const fields = state.template.sections.find((s) => s.id === sectionId).fields;
    const last = fields[fields.length - 1];

    state = run(state, [{ type: 'MOVE_FIELD', sectionId, fieldKey: last.key, row: 0, x: 0 }]);
    const updated = state.template.sections.find((s) => s.id === sectionId);
    expect(updated.fields[0].key).toBe(last.key);
    expect(updated.fields.map((field) => field.order)).toEqual([0, 1, 2]);
  });

  it('never overlaps two fields in one row', () => {
    let state = init(fixtures.multiSectionForm());
    const sectionId = 'section_b';
    const fields = state.template.sections.find((s) => s.id === sectionId).fields;

    state = run(state, [{ type: 'MOVE_FIELD', sectionId, fieldKey: fields[2].key, row: 0, x: 0 }]);
    const updated = state.template.sections.find((s) => s.id === sectionId);
    const byRow = new Map();
    updated.fields.forEach((field) => {
      const list = byRow.get(field.grid.row) || [];
      list.push(field);
      byRow.set(field.grid.row, list);
    });
    byRow.forEach((rowFields) => {
      rowFields.sort((a, b) => a.grid.x - b.grid.x).forEach((field, index, all) => {
        if (index === 0) return;
        expect(field.grid.x).toBeGreaterThanOrEqual(all[index - 1].grid.x + all[index - 1].grid.w);
      });
    });
  });

  it('duplicates and deletes fields', () => {
    let state = init();
    const sectionId = state.template.sections[0].id;
    const fieldKey = state.template.sections[0].fields[0].key;

    state = run(state, [{ type: 'DUPLICATE_FIELD', sectionId, fieldKey }]);
    expect(state.template.sections[0].fields).toHaveLength(4);

    state = run(state, [{ type: 'DELETE_FIELD', sectionId, fieldKey }]);
    expect(state.template.sections[0].fields.some((field) => field.key === fieldKey)).toBe(false);
  });
});

describe('table columns', () => {
  it('adds, splits and merges grouped columns', () => {
    let state = init(fixtures.tableForm());
    const sectionId = 'section_items';

    state = run(state, [{ type: 'ADD_COLUMN', sectionId }]);
    let columns = state.template.sections[0].advancedLayout.table.columns;
    expect(columns).toHaveLength(4);

    const target = columns[0];
    state = run(state, [{ type: 'SPLIT_COLUMN', sectionId, columnId: target.id }]);
    columns = state.template.sections[0].advancedLayout.table.columns;
    expect(columns[0].children).toHaveLength(2);

    state = run(state, [{ type: 'MERGE_COLUMN', sectionId, columnId: target.id }]);
    columns = state.template.sections[0].advancedLayout.table.columns;
    expect(columns[0].children).toHaveLength(0);
  });

  it('updates a nested column', () => {
    let state = init(fixtures.groupedTableForm());
    const sectionId = 'section_grouped';
    state = run(state, [{
      type: 'UPDATE_COLUMN', sectionId, columnId: 'col_morning_in', patch: { width: '30%' }
    }]);
    const column = findColumn(state.template.sections[0].advancedLayout.table.columns, 'col_morning_in');
    expect(column.width).toBe('30%');
  });

  it('deletes a nested column without touching its siblings', () => {
    let state = init(fixtures.groupedTableForm());
    state = run(state, [{ type: 'DELETE_COLUMN', sectionId: 'section_grouped', columnId: 'col_morning_out' }]);
    const columns = state.template.sections[0].advancedLayout.table.columns;
    expect(findColumn(columns, 'col_morning_out')).toBeNull();
    expect(findColumn(columns, 'col_morning_in')).toBeTruthy();
  });
});

describe('undo and redo', () => {
  it('undoes and redoes every document mutation', () => {
    const base = init();
    const withBlock = run(base, [{ type: 'ADD_BLOCK', blockType: 'divider' }]);
    expect(flowOf(withBlock).some((b) => b.type === 'divider')).toBe(true);

    const undone = builderReducer(withBlock, { type: 'UNDO' });
    expect(flowOf(undone).some((b) => b.type === 'divider')).toBe(false);

    const redone = builderReducer(undone, { type: 'REDO' });
    expect(flowOf(redone).some((b) => b.type === 'divider')).toBe(true);
  });

  it('records exactly one history entry for a whole drag gesture', () => {
    let state = init(fixtures.multiSectionForm());
    const block = sectionBlock(state, 'section_b');
    const historyBefore = state.past.length;

    state = builderReducer(state, { type: 'BEGIN_GESTURE' });
    for (let step = 0; step < 25; step += 1) {
      state = builderReducer(state, { type: 'MOVE_BLOCK', blockId: block.id, row: 0, x: step % 12 });
    }
    state = builderReducer(state, { type: 'END_GESTURE' });

    expect(state.past.length).toBe(historyBefore + 1);

    const undone = builderReducer(state, { type: 'UNDO' });
    expect(blocksOf(undone).find((item) => item.id === block.id).x)
      .toBe(blocksOf(init(fixtures.multiSectionForm())).find((item) => item.refId === 'section_b').x);
  });

  it('does not record history for a gesture that changed nothing', () => {
    let state = init();
    const historyBefore = state.past.length;
    state = builderReducer(state, { type: 'BEGIN_GESTURE' });
    state = builderReducer(state, { type: 'END_GESTURE' });
    expect(state.past.length).toBe(historyBefore);
  });

  it('cancels an in-flight gesture back to its starting point', () => {
    let state = init(fixtures.multiSectionForm());
    const block = sectionBlock(state, 'section_b');
    const originalRow = block.row;

    state = builderReducer(state, { type: 'BEGIN_GESTURE' });
    state = builderReducer(state, { type: 'MOVE_BLOCK', blockId: block.id, row: 0, x: 0 });
    state = builderReducer(state, { type: 'CANCEL_GESTURE' });

    expect(blocksOf(state).find((item) => item.id === block.id).row).toBe(originalRow);
  });

  it('clears the redo stack once a new command is issued', () => {
    let state = run(init(), [{ type: 'ADD_BLOCK', blockType: 'divider' }]);
    state = builderReducer(state, { type: 'UNDO' });
    expect(state.future).toHaveLength(1);
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'spacer' });
    expect(state.future).toHaveLength(0);
  });

  it('caps history growth', () => {
    let state = init();
    for (let index = 0; index < 150; index += 1) {
      state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });
    }
    expect(state.past.length).toBeLessThanOrEqual(100);
  });
});

describe('save state', () => {
  it('tracks dirty → saving → saved', () => {
    let state = run(init(), [{ type: 'ADD_BLOCK', blockType: 'divider' }]);
    expect(state.saveState).toBe(SAVE_STATES.DIRTY);

    state = builderReducer(state, { type: 'SAVE_START' });
    expect(state.saveState).toBe(SAVE_STATES.SAVING);

    state = builderReducer(state, { type: 'SAVE_SUCCESS', at: 123 });
    expect(state.saveState).toBe(SAVE_STATES.SAVED);
    expect(state.lastSavedAt).toBe(123);
  });

  it('reports a failed save and keeps the work', () => {
    let state = run(init(), [{ type: 'ADD_BLOCK', blockType: 'divider' }]);
    const beforeBlocks = blocksOf(state).length;
    state = builderReducer(state, { type: 'SAVE_START' });
    state = builderReducer(state, { type: 'SAVE_FAILURE', error: 'Network down' });

    expect(state.saveState).toBe(SAVE_STATES.ERROR);
    expect(state.saveError).toBe('Network down');
    expect(blocksOf(state)).toHaveLength(beforeBlocks);
  });

  it('returns to "saved" when undo lands back on the saved snapshot', () => {
    let state = init();
    state = builderReducer(state, { type: 'SAVE_SUCCESS' });
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });
    expect(state.saveState).toBe(SAVE_STATES.DIRTY);
    state = builderReducer(state, { type: 'UNDO' });
    expect(state.saveState).toBe(SAVE_STATES.SAVED);
  });
});

describe('page and theme settings', () => {
  it('changes page size, orientation and every margin', () => {
    let state = init();
    state = run(state, [
      { type: 'UPDATE_PAGE', patch: { size: 'Legal', orientation: 'landscape' } },
      { type: 'UPDATE_PAGE', patch: { margins: { top: 20, right: 18, bottom: 20, left: 18 } } }
    ]);
    expect(state.template.document.page.size).toBe('Legal');
    expect(state.template.document.page.orientation).toBe('landscape');
    expect(state.template.document.page.margins).toEqual({ top: 20, right: 18, bottom: 20, left: 18 });
    // Legacy point mirrors stay in step for older consumers.
    expect(state.template.layout.pageSize).toBe('Legal');
    expect(state.template.layout.margins.left).toBe(51);
  });

  it('deep-merges pdfStyle patches instead of replacing sub-objects', () => {
    const state = run(init(), [{
      type: 'UPDATE_PDF_STYLE', patch: { header: { showSubtitle: true } }
    }]);
    expect(state.template.pdfStyle.header.showSubtitle).toBe(true);
    // Everything else in `header` must survive.
    expect(state.template.pdfStyle.header.showLogo).toBe(true);
    expect(state.template.pdfStyle.header.border.color).toBe('#01c853');
  });
});

describe('draft restore', () => {
  it('restores a draft and marks it unsaved', () => {
    const state = init();
    const draft = { ...fixtures.tableForm() };
    const restored = builderReducer(state, { type: 'RESTORE_DRAFT', template: draft });
    expect(restored.template.sections[0].id).toBe('section_items');
    expect(restored.saveState).toBe(SAVE_STATES.DIRTY);
    expect(restored.past).toHaveLength(0);
  });
});

describe('large templates', () => {
  it('applies 200 commands to a 160-field template quickly', () => {
    let state = init(fixtures.largeForm(40, 4));
    const started = Date.now();
    for (let index = 0; index < 200; index += 1) {
      state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });
    }
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(8000);
    expect(flowOf(state).filter((block) => block.type === 'divider')).toHaveLength(200);
  });
});

describe('section helpers', () => {
  it('creates a section with a stable default shape', () => {
    const section = createSection();
    expect(section.advancedLayout.layoutType).toBe('simple');
    expect(section.advancedLayout.table.numberOfRows).toBe(6);
    expect(section.visible).toBe(true);
  });
});
