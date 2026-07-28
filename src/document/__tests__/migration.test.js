const {
  resolveTemplateContract,
  getSemanticSections,
  getVisibleFields,
  getLeafColumns,
  getColumnDepth,
  getTableCellKey,
  getFieldValueKey,
  getDynamicRowsKey,
  isTableSection
} = require('../templateContract');
const {
  buildDocumentFromLegacy,
  needsMigration,
  deriveFieldGrids,
  splitGridColumns,
  widthTokenForColumns,
  columnsForWidthToken
} = require('../migrate');
const { normalizeDocument, assertSupportedDocumentVersion, GRID_COLUMNS } = require('../documentModel');
const { ptToMm } = require('../units');
const fixtures = require('../__fixtures__/templates');

describe('legacy detection', () => {
  it('treats a stored v1 template as needing migration', () => {
    expect(needsMigration(fixtures.simpleForm())).toBe(true);
  });

  it('leaves an already-migrated template alone', () => {
    const contract = resolveTemplateContract(fixtures.simpleForm());
    expect(needsMigration(contract.template)).toBe(false);
  });

  it('re-migrates a document that has blocks but the wrong version', () => {
    const template = fixtures.simpleForm();
    template.document = { version: 1, page: {}, grid: {}, blocks: [{ id: 'a', type: 'text' }] };
    expect(needsMigration(template)).toBe(true);
  });
});

describe('v1 → v2 conversion', () => {
  it('is deterministic: the same template always produces the same document', () => {
    const a = buildDocumentFromLegacy(fixtures.multiSectionForm());
    const b = buildDocumentFromLegacy(fixtures.multiSectionForm());
    expect(JSON.stringify(b)).toEqual(JSON.stringify(a));
  });

  it('derives stable block ids from section ids', () => {
    const documentValue = buildDocumentFromLegacy(fixtures.multiSectionForm());
    const ids = documentValue.blocks.filter((block) => block.type === 'section').map((block) => block.id);
    expect(ids).toEqual(['blk_section_section_a', 'blk_section_section_b', 'blk_section_section_hidden']);
  });

  it('keeps every section id and field key untouched', () => {
    const template = fixtures.groupedTableForm();
    const before = template.sections.map((section) => ({
      id: section.id,
      fields: section.fields.map((field) => field.key),
      columns: getLeafColumns(section.advancedLayout.table.columns).map((column) => column.id)
    }));

    const contract = resolveTemplateContract(template);
    const after = contract.sections.map((section) => ({
      id: section.id,
      fields: section.fields.map((field) => field.key),
      columns: getLeafColumns(section.advancedLayout.table.columns).map((column) => column.id)
    }));

    expect(after).toEqual(before);
  });

  it('honours layout.sectionOrder when building the flow', () => {
    const template = fixtures.multiSectionForm();
    template.layout.sectionOrder = ['section_b', 'section_hidden', 'section_a'];
    const documentValue = buildDocumentFromLegacy(template);
    const order = documentValue.blocks
      .filter((block) => block.type === 'section')
      .sort((a, b) => a.row - b.row)
      .map((block) => block.refId);
    expect(order).toEqual(['section_b', 'section_hidden', 'section_a']);
  });

  it('mirrors section visibility onto its block', () => {
    const documentValue = buildDocumentFromLegacy(fixtures.multiSectionForm());
    const hidden = documentValue.blocks.find((block) => block.refId === 'section_hidden');
    expect(hidden.hidden).toBe(true);
  });

  it('converts legacy point margins to millimetres', () => {
    const template = fixtures.simpleForm();
    template.layout.margins = { top: 50, right: 50, bottom: 50, left: 50 };
    const documentValue = buildDocumentFromLegacy(template);
    expect(documentValue.page.margins.top).toBeCloseTo(ptToMm(50), 6);
    expect(documentValue.page.margins.top).toBeCloseTo(17.64, 2);
  });

  it('omits blocks the template disabled', () => {
    const template = fixtures.simpleForm();
    template.pdfStyle.header.enabled = false;
    template.pdfStyle.metadata.enabled = false;
    template.pdfStyle.signature.enabled = false;
    template.pdfStyle.footer.enabled = false;

    const documentValue = buildDocumentFromLegacy(template);
    const types = documentValue.blocks.map((block) => block.type);
    expect(types).not.toContain('header');
    expect(types).not.toContain('metadata');
    expect(types).not.toContain('signature');
    expect(types).not.toContain('footer');
    expect(types).toContain('section');
  });

  it('recreates the legacy watermark as an editable overlay', () => {
    const template = fixtures.simpleForm();
    template.pdfStyle.branding.watermarkUrl = 'https://example.com/wm.png';
    template.pdfStyle.branding.watermarkOpacity = 12;
    const documentValue = buildDocumentFromLegacy(template);
    const watermark = documentValue.blocks.find((block) => block.type === 'watermark');
    expect(watermark.placement).toBe('overlay');
    expect(watermark.props.url).toBe('https://example.com/wm.png');
    expect(watermark.props.opacity).toBe(12);
  });
});

describe('field grid derivation', () => {
  it('maps legacy width tokens onto the 24-column grid', () => {
    expect(columnsForWidthToken('full')).toBe(24);
    expect(columnsForWidthToken('half')).toBe(12);
    expect(columnsForWidthToken('third')).toBe(8);
    expect(columnsForWidthToken('quarter')).toBe(6);
    expect(columnsForWidthToken('two-thirds')).toBe(16);
    expect(columnsForWidthToken('three-quarters')).toBe(18);
  });

  it('round-trips a span back to the nearest token', () => {
    expect(widthTokenForColumns(24)).toBe('full');
    expect(widthTokenForColumns(12)).toBe('half');
    expect(widthTokenForColumns(6)).toBe('quarter');
  });

  it('packs simple-layout fields into rows without overflowing 24 columns', () => {
    const grids = deriveFieldGrids(fixtures.simpleForm().sections[0]);
    expect(grids).toEqual([
      { x: 0, w: 12, row: 0 },
      { x: 12, w: 12, row: 0 },
      { x: 0, w: 24, row: 1 }
    ]);
  });

  it('reproduces a legacy 2fr/1fr/1fr column layout exactly', () => {
    const spans = splitGridColumns(3, ['2fr', '1fr', '1fr']);
    expect(spans).toEqual([12, 6, 6]);
    expect(spans.reduce((a, b) => a + b, 0)).toBe(GRID_COLUMNS);
  });

  it('always fills exactly 24 columns for any legacy configuration', () => {
    [
      [2, undefined], [3, undefined], [4, undefined], [5, undefined], [7, undefined],
      [2, ['60%', '40%']], [3, ['160px', '1fr', '1fr']], [4, ['1fr', '2fr', '1fr', '3fr']]
    ].forEach(([count, widths]) => {
      const spans = splitGridColumns(count, widths);
      expect(spans.reduce((a, b) => a + b, 0)).toBe(GRID_COLUMNS);
      expect(spans.every((span) => span >= 1)).toBe(true);
    });
  });

  it('lays out a legacy grid section across its declared columns', () => {
    const contract = resolveTemplateContract(fixtures.columnsForm());
    const grid = contract.sections.find((section) => section.id === 'section_grid');
    expect(grid.fields[0].grid).toEqual({ x: 0, w: 6, row: 0 });
    expect(grid.fields[4].grid.row).toBe(1);
  });

  it('never rewrites a grid the author already set', () => {
    const template = fixtures.simpleForm();
    template.sections[0].fields[0].grid = { x: 6, w: 10, row: 3 };
    const contract = resolveTemplateContract(template);
    expect(contract.sections[0].fields[0].grid).toEqual({ x: 6, w: 10, row: 3 });
  });
});

describe('contract resolution', () => {
  it('rejects an unsupported future document version with an actionable message', () => {
    const template = fixtures.simpleForm();
    template.document = { version: 5, page: {}, grid: {}, blocks: [] };
    const contract = resolveTemplateContract(template);
    expect(contract.ok).toBe(false);
    expect(contract.error.code).toBe('unsupported_document_version');
    expect(contract.error.message).toMatch(/newer version/i);
    expect(contract.error.messageAr).toMatch(/أحدث/);
  });

  it('accepts a missing version (legacy) and the current one', () => {
    expect(assertSupportedDocumentVersion(undefined).ok).toBe(true);
    expect(assertSupportedDocumentVersion({ version: 2 }).ok).toBe(true);
    expect(assertSupportedDocumentVersion({ version: 3 }).ok).toBe(false);
  });

  it('adds a block for a section written by an older client', () => {
    const contract = resolveTemplateContract(fixtures.simpleForm());
    const withExtra = {
      ...contract.template,
      sections: [
        ...contract.template.sections,
        { ...fixtures.sectionBase('section_late', 'Late', 'متأخر'), fields: [] }
      ]
    };
    const second = resolveTemplateContract(withExtra);
    expect(second.document.blocks.some((block) => block.refId === 'section_late')).toBe(true);
  });

  it('drops a block whose section was deleted by an older client', () => {
    const contract = resolveTemplateContract(fixtures.multiSectionForm());
    const withoutSection = {
      ...contract.template,
      sections: contract.template.sections.filter((section) => section.id !== 'section_b')
    };
    const second = resolveTemplateContract(withoutSection);
    expect(second.document.blocks.some((block) => block.refId === 'section_b')).toBe(false);
  });

  it('is idempotent — re-resolving changes nothing', () => {
    const first = resolveTemplateContract(fixtures.groupedTableForm());
    const second = resolveTemplateContract(first.template);
    expect(JSON.stringify(second.document)).toEqual(JSON.stringify(first.document));
    expect(JSON.stringify(second.sections)).toEqual(JSON.stringify(first.sections));
  });
});

describe('semantic reading order (shared with the fill screen)', () => {
  it('returns visible sections in document order', () => {
    const contract = resolveTemplateContract(fixtures.multiSectionForm());
    expect(getSemanticSections(contract).map((section) => section.id))
      .toEqual(['section_a', 'section_b']);
  });

  it('excludes fields hidden by the author', () => {
    const template = fixtures.multiSectionForm();
    template.sections[0].fields[1].visible = false;
    const contract = resolveTemplateContract(template);
    const section = getSemanticSections(contract)[0];
    expect(getVisibleFields(section).map((field) => field.key)).toEqual(['a1']);
  });

  it('orders fields by grid row then logical column', () => {
    const template = fixtures.multiSectionForm();
    const contract = resolveTemplateContract(template);
    const section = contract.sectionsById.get('section_b');
    section.fields[0].grid = { x: 16, w: 8, row: 0 };
    section.fields[1].grid = { x: 8, w: 8, row: 0 };
    section.fields[2].grid = { x: 0, w: 8, row: 0 };
    expect(getVisibleFields(section).map((field) => field.key)).toEqual(['b3', 'b2', 'b1']);
  });

  it('reports table sections so the fill screen renders row inputs', () => {
    const contract = resolveTemplateContract(fixtures.tableForm());
    expect(isTableSection(contract.sections[0])).toBe(true);
    expect(isTableSection(resolveTemplateContract(fixtures.simpleForm()).sections[0])).toBe(false);
  });
});

describe('value key contract (must never change — historical submissions depend on it)', () => {
  it('keys a field value by sectionId.fieldKey', () => {
    expect(getFieldValueKey('section_a', 'a1')).toBe('section_a.a1');
  });

  it('keys a static table cell by sectionId.row_N.col_ID', () => {
    expect(getTableCellKey('section_items', 2, { id: 'col_item' }, 0))
      .toBe('section_items.row_2.col_col_item');
  });

  it('falls back to a positional column id exactly like the legacy renderer', () => {
    expect(getTableCellKey('s', 0, {}, 3)).toBe('s.row_0.col_col4');
  });

  it('keys dynamic rows by sectionId.rowSource', () => {
    expect(getDynamicRowsKey('section_log', 'entries')).toBe('section_log.entries');
  });
});

describe('grouped columns', () => {
  it('flattens to leaves in visual order', () => {
    const contract = resolveTemplateContract(fixtures.groupedTableForm());
    const columns = contract.sections[0].advancedLayout.table.columns;
    expect(getLeafColumns(columns).map((column) => column.id)).toEqual([
      'col_product', 'col_morning_in', 'col_morning_out', 'col_evening_in', 'col_evening_out'
    ]);
  });

  it('reports header depth', () => {
    const contract = resolveTemplateContract(fixtures.groupedTableForm());
    expect(getColumnDepth(contract.sections[0].advancedLayout.table.columns)).toBe(2);
    const flat = resolveTemplateContract(fixtures.tableForm());
    expect(getColumnDepth(flat.sections[0].advancedLayout.table.columns)).toBe(1);
  });
});

describe('document normalisation', () => {
  it('compacts row numbers without changing side-by-side grouping', () => {
    const documentValue = normalizeDocument({
      version: 2,
      page: {},
      grid: {},
      blocks: [
        { id: 'a', type: 'text', placement: 'flow', row: 10, x: 0, w: 12 },
        { id: 'b', type: 'text', placement: 'flow', row: 10, x: 12, w: 12 },
        { id: 'c', type: 'text', placement: 'flow', row: 40, x: 0, w: 24 }
      ]
    });
    const rows = documentValue.blocks.map((block) => block.row);
    expect(rows).toEqual([0, 0, 1]);
  });

  it('removes duplicate singleton blocks', () => {
    const documentValue = normalizeDocument({
      version: 2,
      page: {},
      grid: {},
      blocks: [
        { id: 'h1', type: 'header', placement: 'pageHeader' },
        { id: 'h2', type: 'header', placement: 'pageHeader' }
      ]
    });
    expect(documentValue.blocks.filter((block) => block.type === 'header')).toHaveLength(1);
  });

  it('clamps a block that claims to start past the last column', () => {
    const documentValue = normalizeDocument({
      version: 2, page: {}, grid: {},
      blocks: [{ id: 'a', type: 'text', placement: 'flow', row: 0, x: 99, w: 99 }]
    });
    const block = documentValue.blocks[0];
    expect(block.x).toBeLessThanOrEqual(GRID_COLUMNS - 1);
    expect(block.x + block.w).toBeLessThanOrEqual(GRID_COLUMNS);
  });
});
