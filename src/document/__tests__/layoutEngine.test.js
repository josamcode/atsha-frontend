const { layoutDocument, resolveColumnWidths, parseColumnWidth } = require('../layoutEngine');
const { resolveTemplateContract } = require('../templateContract');
const { buildSampleValues, buildSampleInstance } = require('../sampleData');
const { getPageGeometry, mmToPt } = require('../units');
const fixtures = require('../__fixtures__/templates');

const layoutOf = (template, overrides = {}) => {
  const language = overrides.language || 'en';
  const contract = resolveTemplateContract(template);
  return layoutDocument({
    contract,
    values: overrides.values !== undefined ? overrides.values : buildSampleValues(contract, language),
    formInstance: buildSampleInstance(template, language),
    language,
    mode: overrides.mode || 'preview'
  });
};

describe('layoutDocument — page geometry', () => {
  it('produces exact A4 portrait page dimensions', () => {
    const result = layoutOf(fixtures.simpleForm());
    expect(result.ok).toBe(true);
    expect(result.pages.length).toBeGreaterThan(0);
    // A4 = 210 x 297 mm = 595.276 x 841.890 pt
    expect(result.pages[0].widthPt).toBeCloseTo(595.276, 2);
    expect(result.pages[0].heightPt).toBeCloseTo(841.89, 2);
  });

  it.each([
    ['A4', 'portrait', 595.276, 841.89],
    ['A4', 'landscape', 841.89, 595.276],
    ['Letter', 'portrait', 612.0, 792.0],
    ['Letter', 'landscape', 792.0, 612.0],
    ['Legal', 'portrait', 612.0, 1008.0],
    ['Legal', 'landscape', 1008.0, 612.0]
  ])('honours %s %s', (size, orientation, expectedWidth, expectedHeight) => {
    const template = fixtures.simpleForm();
    template.layout.pageSize = size;
    template.layout.orientation = orientation;
    const result = layoutOf(template);
    expect(result.pages[0].widthPt).toBeCloseTo(expectedWidth, 1);
    expect(result.pages[0].heightPt).toBeCloseTo(expectedHeight, 1);
  });

  it('keeps every painted primitive inside the printable area', () => {
    const result = layoutOf(fixtures.multiSectionForm());
    const { geometry } = result;
    result.pages.forEach((page) => {
      page.primitives.forEach((primitive) => {
        if (primitive.k === 'rect' || primitive.k === 'image' || primitive.k === 'placeholder') {
          expect(primitive.x).toBeGreaterThanOrEqual(-0.01);
          expect(primitive.x + primitive.w).toBeLessThanOrEqual(geometry.widthPt + 0.01);
        }
        if (primitive.k === 'text') {
          expect(primitive.x).toBeGreaterThanOrEqual(-0.01);
          expect(primitive.x + primitive.w).toBeLessThanOrEqual(geometry.widthPt + 0.5);
        }
      });
    });
  });

  it('applies margins from the migrated document (points → millimetres)', () => {
    const template = fixtures.simpleForm();
    template.layout.margins = { top: 72, right: 72, bottom: 72, left: 72 }; // 1 inch
    const result = layoutOf(template);
    expect(result.geometry.marginsMm.top).toBeCloseTo(25.4, 3);
    expect(result.geometry.contentXPt).toBeCloseTo(72, 2);
  });
});

describe('layoutDocument — ordering and visibility', () => {
  it('follows layout.sectionOrder and skips hidden sections', () => {
    const template = fixtures.multiSectionForm();
    template.layout.sectionOrder = ['section_b', 'section_a', 'section_hidden'];
    const result = layoutOf(template);
    const sectionBoxes = result.blockBoxes
      .filter((box) => box.type === 'section')
      .sort((a, b) => (a.pageIndex - b.pageIndex) || (a.y - b.y));
    expect(sectionBoxes.map((box) => box.refId)).toEqual(['section_b', 'section_a']);
  });

  it('never emits a box for a hidden section', () => {
    const result = layoutOf(fixtures.multiSectionForm());
    expect(result.blockBoxes.some((box) => box.refId === 'section_hidden')).toBe(false);
  });
});

describe('layoutDocument — tables', () => {
  it('renders every declared static row', () => {
    const template = fixtures.tableForm();
    const result = layoutOf(template, { values: {} });
    // 8 declared rows + 1 header unit, all inside one section block.
    const tableRects = result.pages
      .flatMap((page) => page.primitives)
      .filter((primitive) => primitive.k === 'rect' && primitive.stroke);
    expect(tableRects.length).toBeGreaterThanOrEqual(8 * 3);
  });

  it('honours numberOfRows instead of the legacy hard-coded 10', () => {
    const template = fixtures.tableForm();
    template.sections[0].advancedLayout.table.numberOfRows = 3;
    const short = layoutOf(template, { values: {} });
    template.sections[0].advancedLayout.table.numberOfRows = 20;
    const long = layoutOf(template, { values: {} });
    const height = (result) => result.blockBoxes
      .filter((box) => box.refId === 'section_items')
      .reduce((sum, box) => sum + box.h, 0);
    expect(height(long)).toBeGreaterThan(height(short));
  });

  it('lays out grouped headers with two levels and correct spans', () => {
    const result = layoutOf(fixtures.groupedTableForm(), { values: {} });
    const texts = result.pages
      .flatMap((page) => page.primitives)
      .filter((primitive) => primitive.k === 'text')
      .flatMap((primitive) => primitive.lines);
    expect(texts).toEqual(expect.arrayContaining(['Product', 'Morning', 'Evening', 'In', 'Out']));
  });

  it('repeats the table header on continuation pages', () => {
    const result = layoutOf(fixtures.multiPageForm(), { values: {} });
    expect(result.pageCount).toBeGreaterThan(1);
    const headerOccurrences = result.pages.map((page) => page.primitives
      .filter((primitive) => primitive.k === 'text' && primitive.lines.includes('Event')).length);
    const pagesWithTable = headerOccurrences.filter((count) => count > 0);
    expect(pagesWithTable.length).toBeGreaterThan(1);
  });

  it('resolves mixed column width units to exactly the available width', () => {
    const widths = resolveColumnWidths(
      [{ width: '25%' }, { width: '2fr' }, { width: 'auto' }, { width: '60px' }],
      400
    );
    const total = widths.reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(400, 6);
    expect(widths.every((value) => value > 0)).toBe(true);
  });

  it('parses every supported column width token', () => {
    expect(parseColumnWidth('auto')).toEqual({ kind: 'auto', value: 1 });
    expect(parseColumnWidth('2fr')).toEqual({ kind: 'fr', value: 2 });
    expect(parseColumnWidth('30%')).toEqual({ kind: 'percent', value: 30 });
    expect(parseColumnWidth('160px')).toEqual({ kind: 'px', value: 160 });
    expect(parseColumnWidth(undefined)).toEqual({ kind: 'auto', value: 1 });
  });
});

describe('layoutDocument — pagination', () => {
  it('paginates a long document across several pages', () => {
    const result = layoutOf(fixtures.longEnglishForm());
    expect(result.pageCount).toBeGreaterThan(1);
  });

  it('produces the same page structure for Arabic content', () => {
    const result = layoutOf(fixtures.longArabicForm(), { language: 'ar' });
    expect(result.pageCount).toBeGreaterThan(1);
    result.pages.forEach((page) => {
      expect(page.primitives.length).toBeGreaterThan(0);
    });
  });

  it('honours an explicit page break block', () => {
    const template = fixtures.multiSectionForm();

    const before = layoutDocument({
      contract: resolveTemplateContract(template),
      language: 'en',
      mode: 'preview'
    });
    expect(before.pageCount).toBe(1);

    const contract = resolveTemplateContract(template);
    const blocks = contract.document.blocks;
    const targetRow = blocks.find((block) => block.refId === 'section_b').row;
    blocks.forEach((block) => {
      if (block.placement === 'flow' && block.row >= targetRow) {
        block.row += 1;
      }
    });
    blocks.push({
      id: 'blk_break',
      type: 'pageBreak',
      placement: 'flow',
      x: 0,
      w: 24,
      row: targetRow,
      heightMm: null,
      minHeightMm: 0,
      hidden: false,
      locked: false,
      keepTogether: false,
      breakBefore: false,
      repeat: 'all',
      refId: null,
      overlay: null,
      props: {}
    });

    const withBreak = layoutDocument({ contract, language: 'en', mode: 'preview' });
    expect(withBreak.pageCount).toBe(2);
    const sectionB = withBreak.blockBoxes.find((box) => box.refId === 'section_b');
    expect(sectionB.pageIndex).toBe(1);
  });

  it('never places content below the footer band', () => {
    const result = layoutOf(fixtures.longEnglishForm());
    const { geometry } = result;
    const bottomLimit = geometry.contentYPt + geometry.contentHeightPt + 0.5;
    result.pages.forEach((page) => {
      page.primitives.forEach((primitive) => {
        if (primitive.k === 'rect' || primitive.k === 'image') {
          expect(primitive.y + primitive.h).toBeLessThanOrEqual(bottomLimit);
        }
      });
    });
  });
});

describe('layoutDocument — overflow reporting', () => {
  it('reports a block that cannot fit on a single page instead of clipping silently', () => {
    const template = fixtures.simpleForm();
    template.layout.pageSize = 'A4';
    const contract = resolveTemplateContract(template);
    contract.document.blocks.push({
      id: 'blk_giant',
      type: 'spacer',
      placement: 'flow',
      x: 0,
      w: 24,
      row: 99,
      heightMm: 400,
      minHeightMm: 0,
      hidden: false,
      locked: false,
      keepTogether: true,
      breakBefore: false,
      repeat: 'all',
      refId: null,
      overlay: null,
      props: {}
    });
    const result = layoutDocument({ contract, language: 'en', mode: 'preview' });
    expect(result.overflows.some((item) => item.kind === 'block-taller-than-page')).toBe(true);
  });

  it('reports an overlay pushed outside the sheet', () => {
    const template = fixtures.simpleForm();
    const contract = resolveTemplateContract(template);
    contract.document.blocks.push({
      id: 'blk_stray',
      type: 'image',
      placement: 'overlay',
      x: 0,
      w: 6,
      row: 0,
      heightMm: 30,
      minHeightMm: 0,
      hidden: false,
      locked: false,
      keepTogether: false,
      breakBefore: false,
      repeat: 'all',
      refId: null,
      overlay: { pageScope: 'all', xMm: 190, yMm: 10, wMm: 60, hMm: 40, rotation: 0, opacity: 100 },
      props: { url: 'data:image/png;base64,AAA', fit: 'contain' }
    });
    const result = layoutDocument({ contract, language: 'en', mode: 'preview' });
    expect(result.overflows.some((item) => item.kind === 'overlay-out-of-bounds')).toBe(true);
  });
});

describe('layoutDocument — RTL', () => {
  it('mirrors column positions without changing stored geometry', () => {
    const template = fixtures.columnsForm();
    const ltr = layoutOf(template, { language: 'en' });
    const rtl = layoutOf(template, { language: 'ar' });

    const ltrBox = ltr.blockBoxes.find((box) => box.refId === 'section_columns');
    const rtlBox = rtl.blockBoxes.find((box) => box.refId === 'section_columns');
    // Full-width blocks land at the same x; the mirroring shows up inside them.
    expect(ltrBox.x).toBeCloseTo(rtlBox.x, 3);

    const ltrTexts = ltr.pages[0].primitives.filter((p) => p.k === 'text');
    const rtlTexts = rtl.pages[0].primitives.filter((p) => p.k === 'text');
    expect(rtlTexts.every((p) => p.rtl === true)).toBe(true);
    expect(ltrTexts.every((p) => p.rtl === false)).toBe(true);
  });

  it('places the first grid column on the right in Arabic', () => {
    const template = fixtures.columnsForm();
    const ltr = layoutOf(template, { language: 'en' });
    const rtl = layoutOf(template, { language: 'ar' });
    const firstLabel = (result, text) => result.pages[0].primitives
      .find((p) => p.k === 'text' && p.lines.some((line) => line.includes(text)));
    const ltrWide = firstLabel(ltr, 'Wide Column');
    const rtlWide = firstLabel(rtl, 'عمود عريض');
    expect(ltrWide).toBeTruthy();
    expect(rtlWide).toBeTruthy();
    expect(rtlWide.x).toBeGreaterThan(ltrWide.x);
  });
});

describe('layoutDocument — renderer parity inputs', () => {
  it('is deterministic: the same input yields identical primitives', () => {
    const template = fixtures.groupedTableForm();
    const first = layoutOf(template);
    const second = layoutOf(template);
    expect(JSON.stringify(second.pages)).toEqual(JSON.stringify(first.pages));
  });

  it('emits a selectable box for every visible block', () => {
    const result = layoutOf(fixtures.multiSectionForm(), { mode: 'edit' });
    const blockIds = new Set(result.blockBoxes.map((box) => box.blockId));
    result.contract.document.blocks
      .filter((block) => !block.hidden && block.type !== 'watermark')
      .forEach((block) => {
        expect(blockIds.has(block.id)).toBe(true);
      });
  });

  it('tags every primitive with its owning block', () => {
    const result = layoutOf(fixtures.tableForm(), { mode: 'edit' });
    result.pages.forEach((page) => {
      page.primitives.forEach((primitive) => {
        expect(typeof primitive.blockId).toBe('string');
      });
    });
  });
});

describe('layoutDocument — performance', () => {
  it('lays out a 100+ component template quickly', () => {
    const template = fixtures.largeForm(40, 4); // 40 sections + 160 fields
    const started = Date.now();
    const result = layoutOf(template);
    const elapsed = Date.now() - started;
    expect(result.ok).toBe(true);
    expect(result.pageCount).toBeGreaterThan(1);
    expect(elapsed).toBeLessThan(3000);
  });
});

describe('page geometry helper', () => {
  it('clamps absurd margins so content never disappears', () => {
    const geometry = getPageGeometry({ size: 'A4', orientation: 'portrait', margins: { top: 500, right: 500, bottom: 500, left: 500 } });
    expect(geometry.contentWidthPt).toBeGreaterThan(0);
    expect(geometry.contentHeightPt).toBeGreaterThan(0);
  });

  it('converts millimetres to points exactly', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 9);
  });
});
