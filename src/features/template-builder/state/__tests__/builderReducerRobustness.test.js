/**
 * Regression cover for the editor-state defects found in the independent review.
 */

const { builderReducer, createInitialState, SAVE_STATES } = require('../builderReducer');
const fixtures = require('../../../../document/__fixtures__/templates');

const init = (template = fixtures.simpleForm()) => createInitialState(template);
const blocksOf = (state) => state.template.document.blocks;
const flowCount = (state, type) => blocksOf(state).filter((block) => block.type === type).length;

describe('abandoned gestures', () => {
  it('a gesture that never ends does not silently stop recording history', () => {
    let state = init();

    state = builderReducer(state, { type: 'BEGIN_GESTURE' });
    const block = blocksOf(state).find((item) => item.placement === 'flow');
    state = builderReducer(state, { type: 'MOVE_BLOCK', blockId: block.id, row: 0, x: 0, fromBase: true });

    // The canvas unmounts mid-drag: the pointer-up never arrives.
    state = builderReducer(state, { type: 'ABANDON_GESTURE' });
    expect(state.gestureBase).toBeNull();

    // History must work again straight away.
    const historyBefore = state.past.length;
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });
    expect(state.past.length).toBe(historyBefore + 1);

    const undone = builderReducer(state, { type: 'UNDO' });
    expect(flowCount(undone, 'divider')).toBe(0);
  });

  it('abandoning keeps the work the user already saw', () => {
    let state = init(fixtures.multiSectionForm());
    const block = blocksOf(state).find((item) => item.refId === 'section_b');

    state = builderReducer(state, { type: 'BEGIN_GESTURE' });
    state = builderReducer(state, { type: 'MOVE_BLOCK', blockId: block.id, row: 0, x: 0, fromBase: true });
    const movedRow = blocksOf(state).find((item) => item.id === block.id).row;

    state = builderReducer(state, { type: 'ABANDON_GESTURE' });
    expect(blocksOf(state).find((item) => item.id === block.id).row).toBe(movedRow);
    // …and it is undoable as one step.
    const undone = builderReducer(state, { type: 'UNDO' });
    expect(blocksOf(undone).find((item) => item.id === block.id).row).not.toBe(movedRow);
  });

  it('abandoning a gesture that changed nothing records nothing', () => {
    let state = init();
    const before = state.past.length;
    state = builderReducer(state, { type: 'BEGIN_GESTURE' });
    state = builderReducer(state, { type: 'ABANDON_GESTURE' });
    expect(state.past.length).toBe(before);
    expect(state.gestureBase).toBeNull();
  });
});

describe('save races', () => {
  it('an edit made while a save is in flight stays unsaved', () => {
    let state = init();
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });

    state = builderReducer(state, { type: 'SAVE_START' });
    // The user keeps working while the request is on the wire.
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'spacer' });
    state = builderReducer(state, { type: 'SAVE_SUCCESS', at: 1 });

    expect(state.saveState).toBe(SAVE_STATES.DIRTY);
    expect(flowCount(state, 'spacer')).toBe(1);
    // The snapshot recorded as saved is what was actually sent.
    expect(state.savedSnapshot.document.blocks.some((block) => block.type === 'spacer')).toBe(false);
  });

  it('reports saved when nothing changed during the request', () => {
    let state = init();
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });
    state = builderReducer(state, { type: 'SAVE_START' });
    state = builderReducer(state, { type: 'SAVE_SUCCESS', at: 2 });

    expect(state.saveState).toBe(SAVE_STATES.SAVED);
    expect(state.lastSavedAt).toBe(2);
  });

  it('a failed save clears the in-flight snapshot', () => {
    let state = init();
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });
    state = builderReducer(state, { type: 'SAVE_START' });
    state = builderReducer(state, { type: 'SAVE_FAILURE', error: 'nope' });
    expect(state.savingSnapshot).toBeNull();
    expect(state.saveState).toBe(SAVE_STATES.ERROR);
  });
});

describe('history coalescing', () => {
  it('typing into one field is a single undo step', () => {
    let state = init();
    const before = state.past.length;
    const sectionId = state.template.sections[0].id;
    const fieldKey = state.template.sections[0].fields[0].key;

    'Employee'.split('').forEach((char, index) => {
      state = builderReducer(state, {
        type: 'UPDATE_FIELD',
        sectionId,
        fieldKey,
        patch: { label: { en: 'Employee'.slice(0, index + 1) } },
        coalesce: `field:${sectionId}:${fieldKey}:label`
      });
    });

    expect(state.past.length).toBe(before + 1);
    expect(state.template.sections[0].fields[0].label.en).toBe('Employee');

    const undone = builderReducer(state, { type: 'UNDO' });
    expect(undone.template.sections[0].fields[0].label.en).toBe('Employee Name');
  });

  it('moving to a different property starts a new undo step', () => {
    let state = init();
    const before = state.past.length;
    state = builderReducer(state, { type: 'UPDATE_META', patch: { title: { en: 'A' } }, coalesce: 'meta:title.en' });
    state = builderReducer(state, { type: 'UPDATE_META', patch: { title: { en: 'AB' } }, coalesce: 'meta:title.en' });
    state = builderReducer(state, { type: 'UPDATE_META', patch: { description: { en: 'D' } }, coalesce: 'meta:description.en' });
    expect(state.past.length).toBe(before + 2);
  });

  it('a structural command always gets its own entry', () => {
    let state = init();
    state = builderReducer(state, { type: 'UPDATE_META', patch: { title: { en: 'A' } }, coalesce: 'meta:title.en' });
    const after = state.past.length;
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'spacer' });
    expect(state.past.length).toBe(after + 2);
  });

  it('typing does not evict the structural history', () => {
    let state = init();
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });

    for (let index = 0; index < 300; index += 1) {
      state = builderReducer(state, {
        type: 'UPDATE_META',
        patch: { title: { en: 'x'.repeat(index + 1) } },
        coalesce: 'meta:title.en'
      });
    }

    // Undo the typing, then the block: both are still reachable, which is the
    // whole point — 300 keystrokes used to evict the structural history.
    let undone = builderReducer(state, { type: 'UNDO' });
    expect(undone.template.title.en).toBe('Simple Form');
    undone = builderReducer(undone, { type: 'UNDO' });
    expect(flowCount(undone, 'divider')).toBe(0);
  });
});

describe('copy and paste fidelity', () => {
  it('carries height, pagination hints and overlay placement', () => {
    let state = init();
    state = builderReducer(state, {
      type: 'ADD_BLOCK', blockType: 'stamp', placement: 'overlay'
    });
    const stamp = blocksOf(state).find((block) => block.type === 'stamp');

    state = builderReducer(state, {
      type: 'MOVE_OVERLAY', blockId: stamp.id, xMm: 100, yMm: 150
    });
    state = builderReducer(state, {
      type: 'RESIZE_OVERLAY', blockId: stamp.id, wMm: 55, hMm: 45
    });
    state = builderReducer(state, {
      type: 'UPDATE_BLOCK', blockId: stamp.id, patch: { keepTogether: true, breakBefore: true }
    });

    const source = blocksOf(state).find((block) => block.id === stamp.id);
    state = builderReducer(state, { type: 'COPY', payload: { block: source, section: null } });
    state = builderReducer(state, { type: 'PASTE', payload: state.clipboard });

    const copies = blocksOf(state).filter((block) => block.type === 'stamp');
    expect(copies).toHaveLength(2);
    const copy = copies.find((block) => block.id !== stamp.id);
    expect(copy.placement).toBe('overlay');
    expect(copy.overlay.wMm).toBe(55);
    expect(copy.overlay.hMm).toBe(45);
    // Offset so it does not hide under the original.
    expect(copy.overlay.xMm).toBe(105);
    expect(copy.keepTogether).toBe(true);
    expect(copy.breakBefore).toBe(true);
  });

  it('never pastes a locked copy the user cannot then move', () => {
    let state = init();
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'spacer' });
    const spacer = blocksOf(state).find((block) => block.type === 'spacer');
    state = builderReducer(state, { type: 'UPDATE_BLOCK', blockId: spacer.id, patch: { locked: true } });

    const source = blocksOf(state).find((block) => block.id === spacer.id);
    state = builderReducer(state, { type: 'COPY', payload: { block: source, section: null } });
    state = builderReducer(state, { type: 'PASTE', payload: state.clipboard });

    const copy = blocksOf(state).filter((block) => block.type === 'spacer').find((block) => block.id !== spacer.id);
    expect(copy.locked).toBe(false);
    expect(copy.heightMm).toBe(source.heightMm);
  });

  it('ignores an empty clipboard', () => {
    const state = init();
    expect(builderReducer(state, { type: 'PASTE', payload: null })).toBe(state);
  });
});

describe('property-only edits skip the structural rebuild', () => {
  it('keeps section and field identity across a style change', () => {
    let state = init(fixtures.groupedTableForm());
    const sectionsBefore = state.template.sections;

    state = builderReducer(state, {
      type: 'UPDATE_PDF_STYLE', patch: { colors: { primary: '#123456' } }
    });

    expect(state.template.pdfStyle.colors.primary).toBe('#123456');
    // The same section objects are reused, so memoised renderers stay stable.
    expect(state.template.sections).toBe(sectionsBefore);
  });

  it('still re-derives everything for a structural change', () => {
    let state = init(fixtures.multiSectionForm());
    const block = state.template.document.blocks.find((item) => item.refId === 'section_b');
    state = builderReducer(state, { type: 'REORDER_BLOCK', blockId: block.id, direction: 'up' });
    expect(state.template.sections[0].id).toBe('section_b');
    expect(state.template.layout.sectionOrder[0]).toBe('section_b');
  });

  it('keeps the legacy page mirrors in step even on a property-only edit', () => {
    let state = init();
    state = builderReducer(state, { type: 'UPDATE_PAGE', patch: { size: 'Legal' } });
    expect(state.template.layout.pageSize).toBe('Legal');
  });
});

describe('duplicate section ids survive editing', () => {
  /**
   * Two sections claiming the same id is corrupt data — their value keys already
   * collide, and no read-time repair can un-collide them without renaming an id
   * and orphaning real submissions. What the editor guarantees is that neither
   * section is silently destroyed, which is what used to happen.
   */
  const duplicateTemplate = () => {
    const template = fixtures.simpleForm();
    template.sections = [
      { ...template.sections[0], id: 'dupe', label: { en: 'FIRST', ar: 'أول' } },
      { ...template.sections[0], id: 'dupe', label: { en: 'SECOND', ar: 'ثاني' }, fields: [] }
    ];
    template.layout.sectionOrder = ['dupe', 'dupe'];
    return template;
  };

  it('keeps both sections and both blocks through a reorder', () => {
    let state = createInitialState(duplicateTemplate());
    expect(state.template.sections).toHaveLength(2);
    expect(state.template.sections.map((section) => section.label.en).sort())
      .toEqual(['FIRST', 'SECOND']);

    const blocks = state.template.document.blocks.filter((block) => block.type === 'section');
    expect(blocks).toHaveLength(2);

    state = builderReducer(state, { type: 'REORDER_BLOCK', blockId: blocks[1].id, direction: 'up' });

    expect(state.template.sections).toHaveLength(2);
    expect(state.template.sections.map((section) => section.label.en).sort())
      .toEqual(['FIRST', 'SECOND']);
    expect(state.template.document.blocks.filter((block) => block.type === 'section')).toHaveLength(2);
  });

  it('keeps both through a duplicate and a delete', () => {
    let state = createInitialState(duplicateTemplate());
    const blocks = state.template.document.blocks.filter((block) => block.type === 'section');

    state = builderReducer(state, { type: 'DUPLICATE_BLOCK', blockId: blocks[0].id });
    expect(state.template.sections).toHaveLength(3);

    const copyBlock = state.template.document.blocks
      .filter((block) => block.type === 'section')
      .find((block) => !blocks.some((original) => original.id === block.id));
    state = builderReducer(state, { type: 'DELETE_BLOCK', blockId: copyBlock.id });

    expect(state.template.sections).toHaveLength(2);
    expect(state.template.sections.map((section) => section.label.en).sort())
      .toEqual(['FIRST', 'SECOND']);
  });
});
