/**
 * Template Builder editor state.
 *
 * Design notes that matter for correctness:
 *
 *  - One reducer owns the whole document. Every mutation is an explicit command,
 *    which is what makes undo/redo, draft recovery and tests possible; the old
 *    builder scattered nested `setFormData` calls across 20 handlers.
 *  - History stores SNAPSHOTS BY REFERENCE. Reducers never mutate, so unchanged
 *    branches are shared between snapshots and a 40-section template costs almost
 *    nothing per history entry.
 *  - A pointer gesture (drag, resize) is wrapped in BEGIN_GESTURE / END_GESTURE.
 *    Intermediate commands do not push history, so one completed drag is exactly
 *    one undo step no matter how many pointermove events fired.
 *  - `sections` stay the semantic source of truth (ids and field keys are what
 *    every historical submission is keyed by) and `document.blocks` is the visual
 *    layer that references them. `syncDerived` keeps the legacy mirrors
 *    (`layout.sectionOrder`, `section.order`, `field.order`, `field.width`) in
 *    step so nothing that reads the old shape breaks.
 */

const {
  GRID_COLUMNS,
  createBlock,
  createId,
  normalizeDocument,
  SINGLETON_BLOCK_TYPES,
  FIXED_HEIGHT_BLOCK_TYPES
} = require('../../../document/documentModel');
const { widthTokenForColumns } = require('../../../document/migrate');
const { resolveTemplateContract, compareFieldsByReadingOrder } = require('../../../document/templateContract');

const HISTORY_LIMIT = 100;

const SAVE_STATES = {
  IDLE: 'idle',
  DIRTY: 'dirty',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error'
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const clone = (value) => JSON.parse(JSON.stringify(value));

/* ------------------------------------------------------------------------- */
/* Derived-data synchronisation                                               */
/* ------------------------------------------------------------------------- */

/**
 * Re-derive everything that must stay consistent after a mutation: block row
 * compaction (via `normalizeDocument`), reading-order field indices, legacy
 * width tokens, `layout.sectionOrder`/`section.order` mirrors, the legacy point
 * margins and block↔section visibility.
 *
 * `structural: false` skips the section/field rebuild for commands that can only
 * change properties (a colour, a label, a page margin). That keeps typing cheap:
 * a 160-field template would otherwise re-create every section and field object
 * on every keystroke.
 */
const syncDerived = (template, options = {}) => {
  const structural = options.structural !== false;
  const documentValue = normalizeDocument(template.document);

  if (!structural) {
    return {
      ...template,
      document: documentValue,
      layoutVersion: documentValue.version,
      layout: {
        ...(template.layout || {}),
        sectionOrder: (template.sections || []).map((section) => section.id),
        pageSize: documentValue.page.size,
        orientation: documentValue.page.orientation,
        margins: {
          top: Math.round((documentValue.page.margins.top * 72) / 25.4),
          right: Math.round((documentValue.page.margins.right * 72) / 25.4),
          bottom: Math.round((documentValue.page.margins.bottom * 72) / 25.4),
          left: Math.round((documentValue.page.margins.left * 72) / 25.4)
        }
      }
    };
  }

  const flowBlocks = documentValue.blocks
    .filter((block) => block.placement === 'flow')
    .sort((a, b) => (a.row - b.row) || (a.x - b.x));

  const sectionBlocks = flowBlocks.filter((block) => block.type === 'section' && block.refId);

  // Consume each section once per block so a template that (through hand-edited
  // data) carries two sections with the same id keeps both instead of collapsing
  // them and losing one section's fields.
  const pending = new Map();
  (template.sections || []).forEach((section) => {
    const queue = pending.get(section.id) || [];
    queue.push(section);
    pending.set(section.id, queue);
  });

  const orderedSections = [];
  const hiddenBySection = new Map();
  sectionBlocks.forEach((block) => {
    const queue = pending.get(block.refId);
    if (queue && queue.length > 0) {
      const section = queue.shift();
      orderedSections.push(section);
      hiddenBySection.set(section, block.hidden);
    }
  });
  // Anything no block referenced is appended rather than dropped.
  (template.sections || []).forEach((section) => {
    if (!orderedSections.includes(section)) {
      orderedSections.push(section);
    }
  });

  const sections = orderedSections.map((section, sectionIndex) => {
    const fields = [...(section.fields || [])]
      .sort(compareFieldsByReadingOrder)
      .map((field, fieldIndex) => {
        const x = clamp(Math.round(field.grid?.x ?? 0), 0, GRID_COLUMNS - 1);
        const w = clamp(Math.round(field.grid?.w ?? GRID_COLUMNS), 1, GRID_COLUMNS - x);
        return {
          ...field,
          order: fieldIndex,
          grid: { x, w, row: Math.max(0, Math.round(field.grid?.row ?? fieldIndex)) },
          width: widthTokenForColumns(w)
        };
      });

    // Compact field rows so a deleted row never leaves a gap.
    const rows = [...new Set(fields.map((field) => field.grid.row))].sort((a, b) => a - b);
    const rowIndex = new Map(rows.map((row, index) => [row, index]));
    const compacted = fields.map((field) => ({
      ...field,
      grid: { ...field.grid, row: rowIndex.get(field.grid.row) }
    }));

    const hidden = hiddenBySection.get(section);
    return {
      ...section,
      order: sectionIndex,
      visible: hidden === undefined ? section.visible !== false : !hidden,
      fields: compacted
    };
  });

  return {
    ...template,
    sections,
    document: documentValue,
    layoutVersion: documentValue.version,
    layout: {
      ...(template.layout || {}),
      sectionOrder: sections.map((section) => section.id),
      pageSize: documentValue.page.size,
      orientation: documentValue.page.orientation,
      // Keep the legacy point-based margins in step for any consumer that has
      // not been moved onto `document.page.margins` yet.
      margins: {
        top: Math.round((documentValue.page.margins.top * 72) / 25.4),
        right: Math.round((documentValue.page.margins.right * 72) / 25.4),
        bottom: Math.round((documentValue.page.margins.bottom * 72) / 25.4),
        left: Math.round((documentValue.page.margins.left * 72) / 25.4)
      }
    }
  };
};

/* ------------------------------------------------------------------------- */
/* Block helpers                                                              */
/* ------------------------------------------------------------------------- */

const flowRows = (documentValue) => {
  const map = new Map();
  documentValue.blocks
    .filter((block) => block.placement === 'flow')
    .forEach((block) => {
      if (!map.has(block.row)) map.set(block.row, []);
      map.get(block.row).push(block);
    });
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
};

/** Free horizontal span in a row, so a move can never overlap a sibling. */
const fitsInRow = (documentValue, row, x, w, ignoreId) => {
  const occupants = documentValue.blocks.filter(
    (block) => block.placement === 'flow' && block.row === row && block.id !== ignoreId
  );
  const end = x + w;
  if (x < 0 || end > GRID_COLUMNS) return false;
  return occupants.every((block) => end <= block.x || x >= block.x + block.w);
};

/**
 * Snap a proposed placement to something legal: clamp inside the page grid, and
 * if the row is occupied at that span, push the block onto a new row rather than
 * silently overlapping.
 */
const resolvePlacement = (documentValue, block, requestedRow, requestedX, requestedW) => {
  const numberOr = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  const w = clamp(Math.round(numberOr(requestedW, numberOr(block.w, GRID_COLUMNS))), 1, GRID_COLUMNS);
  const x = clamp(Math.round(numberOr(requestedX, numberOr(block.x, 0))), 0, GRID_COLUMNS - w);
  const row = Math.max(0, Math.round(numberOr(requestedRow, numberOr(block.row, 0))));

  if (fitsInRow(documentValue, row, x, w, block.id)) {
    return { row, x, w, insertRow: false };
  }
  return { row, x, w, insertRow: true };
};

const withInsertedRow = (blocks, atRow) => blocks.map((block) => (
  block.placement === 'flow' && block.row >= atRow
    ? { ...block, row: block.row + 1 }
    : block
));

const replaceBlock = (documentValue, blockId, updater) => ({
  ...documentValue,
  blocks: documentValue.blocks.map((block) => (block.id === blockId ? updater(block) : block))
});

/* ------------------------------------------------------------------------- */
/* Section / field helpers                                                    */
/* ------------------------------------------------------------------------- */

const createSection = (overrides = {}) => ({
  id: createId('section'),
  label: { en: 'New section', ar: 'قسم جديد' },
  fields: [],
  order: 0,
  visible: true,
  sectionType: 'normal',
  pdfStyle: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    padding: 12,
    marginTop: 0,
    marginBottom: 16,
    showBorder: true,
    showBackground: false
  },
  advancedLayout: {
    layoutType: 'simple',
    table: {
      enabled: false,
      columns: [],
      dynamicRows: false,
      rowSource: '',
      numberOfRows: 6,
      showHeader: true,
      showBorders: true,
      borderStyle: 'solid',
      borderColor: '#d1d5db',
      borderWidth: 1,
      stripedRows: false,
      headerStyle: { backgroundColor: '#f3f4f6', textColor: '#111827', fontSize: 12, bold: true },
      cellStyle: { backgroundColor: '#ffffff', textColor: '#111827', fontSize: 11 }
    },
    columns: { enabled: false, columnCount: 2, columnGap: 20, columnWidths: [], equalWidths: true },
    grid: { enabled: false, rows: 1, columns: 2, gap: 12, template: '' },
    spacing: { sectionSpacing: 16, fieldSpacing: 10, lineSpacing: 1.35 },
    sizing: { width: '100%', maxWidth: '100%', minWidth: 'auto', height: 'auto', maxHeight: 'auto', minHeight: 'auto' },
    padding: { top: 12, right: 12, bottom: 12, left: 12 },
    margins: { top: 0, right: 0, bottom: 16, left: 0 },
    styling: {
      titleColor: '#111827', titleFontSize: 14, showTitle: true,
      backgroundColor: '#ffffff', textColor: '#111827', borderColor: '#d1d5db'
    }
  },
  ...overrides
});

const createField = (overrides = {}) => ({
  key: createId('field'),
  label: { en: 'New field', ar: 'حقل جديد' },
  type: 'text',
  defaultValue: { en: '', ar: '' },
  placeholder: { en: '', ar: '' },
  options: [],
  required: false,
  order: 0,
  width: 'half',
  grid: { x: 0, w: 12, row: 0 },
  visible: true,
  pdfDisplay: { showLabel: true, showValue: true, fontSize: 10, bold: false, alignment: 'left' },
  layout: {
    width: 'auto', height: 'auto',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    alignment: 'left', lineSpacing: 1.3, fontSize: 10,
    imageWidth: 220, imageHeight: 160, objectFit: 'cover',
    borderRadius: 8, borderWidth: 0, borderColor: '#d1d5db',
    backgroundColor: '#f8fafc', shadow: false
  },
  ...overrides
});

const createColumn = (overrides = {}) => ({
  id: createId('col'),
  label: { en: 'New column', ar: 'عمود جديد' },
  fieldKey: '',
  fieldType: 'text',
  width: 'auto',
  alignment: 'left',
  children: [],
  headerStyle: { backgroundColor: '#f3f4f6', textColor: '#111827', fontSize: 12, bold: true },
  ...overrides
});

const mapSection = (template, sectionId, updater) => ({
  ...template,
  sections: template.sections.map((section) => (section.id === sectionId ? updater(section) : section))
});

const mapField = (template, sectionId, fieldKey, updater) => mapSection(template, sectionId, (section) => ({
  ...section,
  fields: section.fields.map((field) => (field.key === fieldKey ? updater(field) : field))
}));

const mapColumns = (columns, columnId, updater) => (columns || []).map((column) => {
  if (column.id === columnId) {
    return updater(column);
  }
  if (Array.isArray(column.children) && column.children.length > 0) {
    return { ...column, children: mapColumns(column.children, columnId, updater) };
  }
  return column;
});

const removeColumn = (columns, columnId) => (columns || [])
  .filter((column) => column.id !== columnId)
  .map((column) => (Array.isArray(column.children) && column.children.length > 0
    ? { ...column, children: removeColumn(column.children, columnId) }
    : column));

const findColumn = (columns, columnId) => {
  for (const column of (columns || [])) {
    if (column.id === columnId) return column;
    const nested = findColumn(column.children, columnId);
    if (nested) return nested;
  }
  return null;
};

/** Deep clone a subtree with fresh ids so duplicates never collide. */
const reidentifyColumn = (column) => ({
  ...clone(column),
  id: createId('col'),
  children: (column.children || []).map(reidentifyColumn)
});

const reidentifySection = (section) => {
  const id = createId('section');
  return {
    ...clone(section),
    id,
    fields: (section.fields || []).map((field) => ({ ...clone(field), key: createId('field') })),
    advancedLayout: {
      ...clone(section.advancedLayout),
      table: {
        ...clone(section.advancedLayout?.table || {}),
        columns: (section.advancedLayout?.table?.columns || []).map(reidentifyColumn)
      }
    }
  };
};

/* ------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* ------------------------------------------------------------------------- */

const createInitialState = (template) => {
  const contract = resolveTemplateContract(template || {});
  const base = contract.ok
    ? syncDerived(contract.template)
    : syncDerived({ ...(template || {}), sections: [], document: undefined });

  return {
    template: base,
    contractError: contract.ok ? null : contract.error,
    migratedOnOpen: Boolean(contract.migrated),
    selection: { kind: 'document' },
    past: [],
    future: [],
    gestureBase: null,
    clipboard: null,
    saveState: SAVE_STATES.IDLE,
    saveError: null,
    lastSavedAt: null,
    savedSnapshot: base,
    savingSnapshot: null,
    coalesceKey: null
  };
};

const pushHistory = (state, previousTemplate) => ({
  past: [...state.past, previousTemplate].slice(-HISTORY_LIMIT),
  future: []
});

/**
 * Commands that can change block order, section order, field placement or the
 * set of sections. Anything else only edits properties, so the (comparatively
 * expensive) re-derivation of every section and field can be skipped.
 */
const STRUCTURAL_COMMANDS = new Set([
  'ADD_BLOCK', 'MOVE_BLOCK', 'RESIZE_BLOCK', 'DELETE_BLOCK', 'DUPLICATE_BLOCK', 'REORDER_BLOCK',
  'ADD_FIELD', 'DELETE_FIELD', 'DUPLICATE_FIELD', 'MOVE_FIELD', 'RESIZE_FIELD',
  'UPDATE_BLOCK', 'PASTE'
]);

/** Commands that mutate the document and therefore participate in history. */
const DOCUMENT_COMMANDS = new Set([
  'ADD_BLOCK', 'MOVE_BLOCK', 'RESIZE_BLOCK', 'UPDATE_BLOCK', 'DELETE_BLOCK', 'DUPLICATE_BLOCK',
  'REORDER_BLOCK', 'MOVE_OVERLAY', 'RESIZE_OVERLAY',
  'ADD_FIELD', 'UPDATE_FIELD', 'DELETE_FIELD', 'DUPLICATE_FIELD', 'MOVE_FIELD', 'RESIZE_FIELD',
  'ADD_COLUMN', 'UPDATE_COLUMN', 'DELETE_COLUMN', 'MOVE_COLUMN', 'SPLIT_COLUMN', 'MERGE_COLUMN',
  'UPDATE_SECTION', 'UPDATE_PAGE', 'UPDATE_GRID', 'UPDATE_META', 'UPDATE_PDF_STYLE',
  'PASTE', 'APPLY_THEME'
]);

const applyCommand = (template, action) => {
  const documentValue = template.document;

  switch (action.type) {
    case 'ADD_BLOCK': {
      const { blockType, row, x, w, props, refId, placement } = action;
      if (SINGLETON_BLOCK_TYPES.includes(blockType)
        && documentValue.blocks.some((block) => block.type === blockType)) {
        return template;
      }

      let next = template;
      let blocks = documentValue.blocks;
      let targetRow = row;

      const block = createBlock(blockType, {
        ...(action.block || {}),
        id: action.id || undefined,
        placement: placement || undefined,
        refId: refId || null,
        props: props || {},
        w: w || undefined
      });

      if (block.placement === 'flow') {
        const maxRow = blocks
          .filter((item) => item.placement === 'flow')
          .reduce((max, item) => Math.max(max, item.row), -1);
        targetRow = Number.isFinite(row) ? Math.max(0, Math.round(row)) : maxRow + 1;

        const placementResult = resolvePlacement(documentValue, block, targetRow, x ?? 0, block.w);
        if (placementResult.insertRow) {
          blocks = withInsertedRow(blocks, placementResult.row);
        }
        block.row = placementResult.row;
        block.x = placementResult.x;
        block.w = placementResult.w;
      }

      if (block.placement === 'overlay' && action.block?.overlay) {
        // Offset a pasted floating element so it does not hide under the original.
        block.overlay = {
          ...block.overlay,
          xMm: block.overlay.xMm + 5,
          yMm: block.overlay.yMm + 5
        };
      }

      if (blockType === 'section') {
        const section = action.section || createSection();
        block.refId = section.id;
        next = { ...template, sections: [...template.sections, section] };
      }

      return {
        ...next,
        document: { ...documentValue, blocks: [...blocks, block] }
      };
    }

    case 'MOVE_BLOCK': {
      const block = documentValue.blocks.find((item) => item.id === action.blockId);
      if (!block || block.locked || block.placement !== 'flow') return template;

      const placementResult = resolvePlacement(documentValue, block, action.row, action.x, block.w);
      let blocks = documentValue.blocks;
      // `insertRow` from the caller means "drop BETWEEN rows"; the resolver adds
      // its own when the requested span would have overlapped a sibling.
      if (placementResult.insertRow || action.insertRow) {
        blocks = withInsertedRow(blocks, placementResult.row);
      }
      return {
        ...template,
        document: {
          ...documentValue,
          blocks: blocks.map((item) => (item.id === block.id
            ? { ...item, row: placementResult.row, x: placementResult.x }
            : item))
        }
      };
    }

    case 'RESIZE_BLOCK': {
      const block = documentValue.blocks.find((item) => item.id === action.blockId);
      if (!block || block.locked) return template;

      const patch = {};
      if (action.w !== undefined) {
        const w = clamp(Math.round(action.w), 1, GRID_COLUMNS - block.x);
        if (fitsInRow(documentValue, block.row, block.x, w, block.id)) {
          patch.w = w;
        }
      }
      if (action.heightMm !== undefined && FIXED_HEIGHT_BLOCK_TYPES.includes(block.type)) {
        patch.heightMm = clamp(action.heightMm, 3, 1000);
      }
      if (action.minHeightMm !== undefined) {
        patch.minHeightMm = clamp(action.minHeightMm, 0, 1000);
      }
      if (Object.keys(patch).length === 0) return template;

      return { ...template, document: replaceBlock(documentValue, block.id, (item) => ({ ...item, ...patch })) };
    }

    case 'MOVE_OVERLAY': {
      const block = documentValue.blocks.find((item) => item.id === action.blockId);
      if (!block || block.locked || block.placement !== 'overlay') return template;
      return {
        ...template,
        document: replaceBlock(documentValue, block.id, (item) => ({
          ...item,
          overlay: { ...item.overlay, xMm: action.xMm, yMm: action.yMm }
        }))
      };
    }

    case 'RESIZE_OVERLAY': {
      const block = documentValue.blocks.find((item) => item.id === action.blockId);
      if (!block || block.locked || block.placement !== 'overlay') return template;
      return {
        ...template,
        document: replaceBlock(documentValue, block.id, (item) => ({
          ...item,
          overlay: {
            ...item.overlay,
            wMm: Math.max(5, action.wMm),
            hMm: Math.max(5, action.hMm)
          }
        }))
      };
    }

    case 'UPDATE_BLOCK': {
      const block = documentValue.blocks.find((item) => item.id === action.blockId);
      if (!block) return template;
      const patch = action.patch || {};
      const nextBlock = {
        ...block,
        ...patch,
        props: patch.props ? { ...block.props, ...patch.props } : block.props,
        overlay: patch.overlay ? { ...block.overlay, ...patch.overlay } : block.overlay
      };
      return { ...template, document: replaceBlock(documentValue, block.id, () => nextBlock) };
    }

    case 'REORDER_BLOCK': {
      const rows = flowRows(documentValue);
      const index = rows.findIndex(([, blocks]) => blocks.some((block) => block.id === action.blockId));
      if (index < 0) return template;
      const target = action.direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= rows.length) return template;

      const [rowA] = rows[index];
      const [rowB] = rows[target];
      return {
        ...template,
        document: {
          ...documentValue,
          blocks: documentValue.blocks.map((block) => {
            if (block.placement !== 'flow') return block;
            if (block.row === rowA) return { ...block, row: rowB };
            if (block.row === rowB) return { ...block, row: rowA };
            return block;
          })
        }
      };
    }

    case 'DELETE_BLOCK': {
      const block = documentValue.blocks.find((item) => item.id === action.blockId);
      if (!block || block.locked) return template;
      return {
        ...template,
        sections: block.type === 'section'
          ? template.sections.filter((section) => section.id !== block.refId)
          : template.sections,
        document: { ...documentValue, blocks: documentValue.blocks.filter((item) => item.id !== block.id) }
      };
    }

    case 'DUPLICATE_BLOCK': {
      const block = documentValue.blocks.find((item) => item.id === action.blockId);
      if (!block || SINGLETON_BLOCK_TYPES.includes(block.type)) return template;

      const copy = { ...clone(block), id: createId('blk') };
      let sections = template.sections;

      if (block.type === 'section') {
        const source = template.sections.find((section) => section.id === block.refId);
        if (!source) return template;
        const duplicated = reidentifySection(source);
        duplicated.label = {
          en: `${source.label?.en || ''} (Copy)`.trim(),
          ar: `${source.label?.ar || ''} (نسخة)`.trim()
        };
        copy.refId = duplicated.id;
        sections = [...template.sections, duplicated];
      }

      const blocks = block.placement === 'flow'
        ? withInsertedRow(documentValue.blocks, block.row + 1)
        : documentValue.blocks;
      if (block.placement === 'flow') {
        copy.row = block.row + 1;
        copy.x = 0;
      } else if (copy.overlay) {
        copy.overlay = { ...copy.overlay, xMm: copy.overlay.xMm + 5, yMm: copy.overlay.yMm + 5 };
      }

      return { ...template, sections, document: { ...documentValue, blocks: [...blocks, copy] } };
    }

    case 'PASTE': {
      const payload = action.payload;
      if (!payload?.block) return template;
      const source = payload.block;
      // Everything that makes the copy look like the original travels with it —
      // height, overlay placement, lock/hide and the pagination hints.
      return applyCommand(template, {
        type: 'ADD_BLOCK',
        id: action.id,
        blockType: source.type,
        placement: source.placement,
        props: clone(source.props || {}),
        w: source.w,
        row: action.row,
        x: action.x,
        block: {
          heightMm: source.heightMm,
          minHeightMm: source.minHeightMm,
          keepTogether: source.keepTogether,
          breakBefore: source.breakBefore,
          hidden: source.hidden,
          locked: false,
          repeat: source.repeat,
          overlay: source.overlay ? clone(source.overlay) : null
        },
        section: payload.section ? reidentifySection(payload.section) : undefined
      });
    }

    case 'UPDATE_SECTION':
      return mapSection(template, action.sectionId, (section) => ({
        ...section,
        ...action.patch,
        pdfStyle: action.patch.pdfStyle ? { ...section.pdfStyle, ...action.patch.pdfStyle } : section.pdfStyle,
        advancedLayout: action.patch.advancedLayout
          ? {
            ...section.advancedLayout,
            ...action.patch.advancedLayout,
            table: action.patch.advancedLayout.table
              ? { ...section.advancedLayout.table, ...action.patch.advancedLayout.table }
              : section.advancedLayout.table,
            styling: action.patch.advancedLayout.styling
              ? { ...section.advancedLayout.styling, ...action.patch.advancedLayout.styling }
              : section.advancedLayout.styling,
            spacing: action.patch.advancedLayout.spacing
              ? { ...section.advancedLayout.spacing, ...action.patch.advancedLayout.spacing }
              : section.advancedLayout.spacing
          }
          : section.advancedLayout
      }));

    case 'ADD_FIELD': {
      const section = template.sections.find((item) => item.id === action.sectionId);
      if (!section) return template;
      const maxRow = section.fields.reduce((max, field) => Math.max(max, field.grid?.row ?? 0), -1);
      const field = createField({
        ...(action.field || {}),
        grid: action.field?.grid || { x: 0, w: 12, row: maxRow + 1 }
      });
      return mapSection(template, action.sectionId, (item) => ({ ...item, fields: [...item.fields, field] }));
    }

    case 'UPDATE_FIELD':
      return mapField(template, action.sectionId, action.fieldKey, (field) => ({
        ...field,
        ...action.patch,
        label: action.patch.label ? { ...field.label, ...action.patch.label } : field.label,
        defaultValue: action.patch.defaultValue ? { ...field.defaultValue, ...action.patch.defaultValue } : field.defaultValue,
        placeholder: action.patch.placeholder ? { ...field.placeholder, ...action.patch.placeholder } : field.placeholder,
        pdfDisplay: action.patch.pdfDisplay ? { ...field.pdfDisplay, ...action.patch.pdfDisplay } : field.pdfDisplay,
        layout: action.patch.layout ? { ...field.layout, ...action.patch.layout } : field.layout
      }));

    case 'MOVE_FIELD': {
      const section = template.sections.find((item) => item.id === action.sectionId);
      if (!section) return template;
      const moving = section.fields.find((field) => field.key === action.fieldKey);
      if (!moving) return template;

      const w = moving.grid?.w ?? GRID_COLUMNS;
      const x = clamp(Math.round(action.x ?? moving.grid.x), 0, GRID_COLUMNS - w);
      const row = Math.max(0, Math.round(action.row ?? moving.grid.row));

      const collides = section.fields.some((field) => field.key !== moving.key
        && (field.grid?.row ?? 0) === row
        && x < (field.grid?.x ?? 0) + (field.grid?.w ?? 0)
        && x + w > (field.grid?.x ?? 0));

      const fields = collides
        ? section.fields.map((field) => (field.grid?.row ?? 0) >= row && field.key !== moving.key
          ? { ...field, grid: { ...field.grid, row: (field.grid?.row ?? 0) + 1 } }
          : field)
        : section.fields;

      return mapSection(template, action.sectionId, (item) => ({
        ...item,
        fields: fields.map((field) => (field.key === moving.key
          ? { ...field, grid: { x, w, row } }
          : field))
      }));
    }

    case 'RESIZE_FIELD': {
      const section = template.sections.find((item) => item.id === action.sectionId);
      if (!section) return template;
      const target = section.fields.find((field) => field.key === action.fieldKey);
      if (!target) return template;

      const x = target.grid?.x ?? 0;
      const w = clamp(Math.round(action.w), 1, GRID_COLUMNS - x);
      const collides = section.fields.some((field) => field.key !== target.key
        && (field.grid?.row ?? 0) === (target.grid?.row ?? 0)
        && x < (field.grid?.x ?? 0) + (field.grid?.w ?? 0)
        && x + w > (field.grid?.x ?? 0));
      if (collides) return template;

      return mapField(template, action.sectionId, action.fieldKey, (field) => ({
        ...field,
        grid: { ...field.grid, w }
      }));
    }

    case 'DELETE_FIELD':
      return mapSection(template, action.sectionId, (section) => ({
        ...section,
        fields: section.fields.filter((field) => field.key !== action.fieldKey)
      }));

    case 'DUPLICATE_FIELD': {
      const section = template.sections.find((item) => item.id === action.sectionId);
      if (!section) return template;
      const source = section.fields.find((field) => field.key === action.fieldKey);
      if (!source) return template;

      const copy = {
        ...clone(source),
        key: createId('field'),
        label: {
          en: `${source.label?.en || ''} (Copy)`.trim(),
          ar: `${source.label?.ar || ''} (نسخة)`.trim()
        },
        grid: { ...source.grid, row: (source.grid?.row ?? 0) + 1, x: 0 }
      };

      return mapSection(template, action.sectionId, (item) => ({
        ...item,
        fields: [
          ...item.fields.map((field) => ((field.grid?.row ?? 0) > (source.grid?.row ?? 0)
            ? { ...field, grid: { ...field.grid, row: (field.grid?.row ?? 0) + 1 } }
            : field)),
          copy
        ]
      }));
    }

    case 'ADD_COLUMN':
      return mapSection(template, action.sectionId, (section) => ({
        ...section,
        advancedLayout: {
          ...section.advancedLayout,
          layoutType: 'table',
          table: {
            ...section.advancedLayout.table,
            enabled: true,
            columns: action.parentId
              ? mapColumns(section.advancedLayout.table.columns, action.parentId, (column) => ({
                ...column,
                children: [...(column.children || []), createColumn(action.column)]
              }))
              : [...(section.advancedLayout.table.columns || []), createColumn(action.column)]
          }
        }
      }));

    case 'UPDATE_COLUMN':
      return mapSection(template, action.sectionId, (section) => ({
        ...section,
        advancedLayout: {
          ...section.advancedLayout,
          table: {
            ...section.advancedLayout.table,
            columns: mapColumns(section.advancedLayout.table.columns, action.columnId, (column) => ({
              ...column,
              ...action.patch,
              label: action.patch.label ? { ...column.label, ...action.patch.label } : column.label,
              headerStyle: action.patch.headerStyle
                ? { ...column.headerStyle, ...action.patch.headerStyle }
                : column.headerStyle
            }))
          }
        }
      }));

    case 'DELETE_COLUMN':
      return mapSection(template, action.sectionId, (section) => ({
        ...section,
        advancedLayout: {
          ...section.advancedLayout,
          table: {
            ...section.advancedLayout.table,
            columns: removeColumn(section.advancedLayout.table.columns, action.columnId)
          }
        }
      }));

    case 'MOVE_COLUMN':
      return mapSection(template, action.sectionId, (section) => {
        const columns = [...(section.advancedLayout.table.columns || [])];
        const index = columns.findIndex((column) => column.id === action.columnId);
        if (index < 0) return section;
        const target = action.direction === 'start' ? index - 1 : index + 1;
        if (target < 0 || target >= columns.length) return section;
        const [moved] = columns.splice(index, 1);
        columns.splice(target, 0, moved);
        return {
          ...section,
          advancedLayout: {
            ...section.advancedLayout,
            table: { ...section.advancedLayout.table, columns }
          }
        };
      });

    case 'SPLIT_COLUMN':
      return mapSection(template, action.sectionId, (section) => ({
        ...section,
        advancedLayout: {
          ...section.advancedLayout,
          table: {
            ...section.advancedLayout.table,
            columns: mapColumns(section.advancedLayout.table.columns, action.columnId, (column) => ({
              ...column,
              children: [
                createColumn({ label: { en: 'Sub 1', ar: 'فرعي ١' } }),
                createColumn({ label: { en: 'Sub 2', ar: 'فرعي ٢' } })
              ]
            }))
          }
        }
      }));

    case 'MERGE_COLUMN':
      return mapSection(template, action.sectionId, (section) => ({
        ...section,
        advancedLayout: {
          ...section.advancedLayout,
          table: {
            ...section.advancedLayout.table,
            columns: mapColumns(section.advancedLayout.table.columns, action.columnId, (column) => ({
              ...column,
              children: []
            }))
          }
        }
      }));

    case 'UPDATE_PAGE':
      return {
        ...template,
        document: {
          ...documentValue,
          page: {
            ...documentValue.page,
            ...action.patch,
            margins: action.patch.margins
              ? { ...documentValue.page.margins, ...action.patch.margins }
              : documentValue.page.margins
          }
        }
      };

    case 'UPDATE_GRID':
      return {
        ...template,
        document: { ...documentValue, grid: { ...documentValue.grid, ...action.patch } }
      };

    case 'UPDATE_META':
      return { ...template, ...action.patch };

    case 'UPDATE_PDF_STYLE': {
      const merge = (base, patch) => Object.keys(patch).reduce((acc, key) => {
        const value = patch[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          acc[key] = merge(base?.[key] || {}, value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, { ...(base || {}) });

      return { ...template, pdfStyle: merge(template.pdfStyle || {}, action.patch) };
    }

    case 'APPLY_THEME':
      return {
        ...template,
        pdfStyle: {
          ...template.pdfStyle,
          colors: { ...template.pdfStyle?.colors, ...action.theme.colors },
          header: { ...template.pdfStyle?.header, ...action.theme.header },
          footer: { ...template.pdfStyle?.footer, ...action.theme.footer },
          branding: {
            ...template.pdfStyle?.branding,
            primaryColor: action.theme.colors?.primary || template.pdfStyle?.branding?.primaryColor,
            secondaryColor: action.theme.colors?.secondary || template.pdfStyle?.branding?.secondaryColor
          }
        }
      };

    default:
      return template;
  }
};

const builderReducer = (state, action) => {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.template);

    case 'SELECT':
      return { ...state, selection: action.selection || { kind: 'document' } };

    case 'BEGIN_GESTURE':
      return { ...state, gestureBase: state.gestureBase || state.template, coalesceKey: null };

    case 'END_GESTURE': {
      if (!state.gestureBase) return state;
      if (state.gestureBase === state.template) {
        return { ...state, gestureBase: null };
      }
      return {
        ...state,
        ...pushHistory(state, state.gestureBase),
        gestureBase: null,
        saveState: SAVE_STATES.DIRTY
      };
    }

    case 'CANCEL_GESTURE': {
      if (!state.gestureBase) return state;
      return { ...state, template: state.gestureBase, gestureBase: null };
    }

    /**
     * Safety valve for a gesture whose pointer-up never arrived — the canvas
     * unmounting mid-drag, for example. Dropping the base (rather than rolling
     * back to it) keeps whatever the user has already seen on screen and, most
     * importantly, stops `gestureBase` from silently suppressing every later
     * history entry.
     */
    case 'ABANDON_GESTURE': {
      if (!state.gestureBase) return state;
      if (state.gestureBase === state.template) {
        return { ...state, gestureBase: null };
      }
      return {
        ...state,
        ...pushHistory(state, state.gestureBase),
        gestureBase: null,
        saveState: SAVE_STATES.DIRTY
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        template: previous,
        past: state.past.slice(0, -1),
        future: [state.template, ...state.future].slice(0, HISTORY_LIMIT),
        saveState: previous === state.savedSnapshot ? SAVE_STATES.SAVED : SAVE_STATES.DIRTY
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        template: next,
        past: [...state.past, state.template].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        saveState: next === state.savedSnapshot ? SAVE_STATES.SAVED : SAVE_STATES.DIRTY
      };
    }

    case 'COPY':
      return { ...state, clipboard: action.payload };

    case 'SAVE_START':
      // Remember exactly what is being sent. Anything typed while the request is
      // in flight must stay "unsaved" — the previous version marked the *current*
      // template as saved and then deleted the local draft with it.
      return {
        ...state,
        saveState: SAVE_STATES.SAVING,
        saveError: null,
        savingSnapshot: state.template
      };

    case 'SAVE_SUCCESS': {
      const persisted = state.savingSnapshot || state.template;
      const stillClean = persisted === state.template;
      return {
        ...state,
        saveState: stillClean ? SAVE_STATES.SAVED : SAVE_STATES.DIRTY,
        saveError: null,
        lastSavedAt: action.at || Date.now(),
        savedSnapshot: persisted,
        savingSnapshot: null
      };
    }

    case 'SAVE_FAILURE':
      return {
        ...state,
        saveState: SAVE_STATES.ERROR,
        saveError: action.error || 'Save failed',
        savingSnapshot: null
      };

    case 'RESTORE_DRAFT': {
      const restored = syncDerived(resolveTemplateContract(action.template).template);
      return {
        ...state,
        template: restored,
        past: [],
        future: [],
        gestureBase: null,
        saveState: SAVE_STATES.DIRTY,
        selection: { kind: 'document' }
      };
    }

    default: {
      if (!DOCUMENT_COMMANDS.has(action.type)) {
        return state;
      }

      /**
       * During a pointer gesture, `fromBase` commands are applied to the state
       * the gesture STARTED from rather than to the previous frame. Without it a
       * drag would compose its own intermediate results — 40 pointermove events
       * would insert 40 rows instead of expressing one move — and the preview
       * would drift away from where the pointer actually is.
       */
      const source = (state.gestureBase && action.fromBase) ? state.gestureBase : state.template;
      const mutated = applyCommand(source, action);
      if (mutated === source) {
        return state;
      }

      const nextTemplate = syncDerived(mutated, { structural: STRUCTURAL_COMMANDS.has(action.type) });
      const inGesture = Boolean(state.gestureBase);

      if (inGesture) {
        return {
          ...state,
          template: nextTemplate,
          selection: action.select || state.selection,
          saveState: SAVE_STATES.DIRTY
        };
      }

      /**
       * Typing must not fill the undo stack one character at a time. Commands
       * that carry a `coalesce` key replace the previous history entry when the
       * key is unchanged, so a whole edit of one field is a single undo step; any
       * other command clears the key and the next keystroke starts a new one.
       */
      const coalesceKey = action.coalesce || null;
      const canCoalesce = Boolean(coalesceKey)
        && coalesceKey === state.coalesceKey
        && state.past.length > 0;

      return {
        ...state,
        template: nextTemplate,
        past: canCoalesce ? state.past : [...state.past, state.template].slice(-HISTORY_LIMIT),
        future: [],
        coalesceKey,
        selection: action.select || state.selection,
        saveState: SAVE_STATES.DIRTY
      };
    }
  }
};

export {
  HISTORY_LIMIT,
  SAVE_STATES,
  builderReducer,
  createInitialState,
  syncDerived,
  createSection,
  createField,
  createColumn,
  reidentifySection,
  reidentifyColumn,
  findColumn,
  flowRows,
  fitsInRow,
  resolvePlacement
};
