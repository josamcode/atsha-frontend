/**
 * Regression cover for the defects found in the independent review of the
 * redesign. Each test names the failure it prevents.
 */

const { layoutDocument, resolveColumnWidths } = require('../layoutEngine');
const { resolveTemplateContract, getSemanticSections } = require('../templateContract');
const { buildDocumentFromLegacy, repairSections, blockIdForSection } = require('../migrate');
const { createBlock, normalizeDocument } = require('../documentModel');
const { wrapText, measureText } = require('../textMetrics');
const fixtures = require('../__fixtures__/templates');

describe('malformed legacy data', () => {
  it('keeps both sections when two share an id', () => {
    const template = fixtures.simpleForm();
    const first = { ...template.sections[0], id: 'dupe', label: { en: 'FIRST', ar: 'أول' } };
    const second = {
      ...template.sections[0],
      id: 'dupe',
      label: { en: 'SECOND', ar: 'ثاني' },
      fields: [{ ...template.sections[0].fields[0], key: 'only_in_second' }]
    };
    template.sections = [first, second];
    template.layout.sectionOrder = ['dupe', 'dupe'];

    const contract = resolveTemplateContract(template);

    expect(contract.sections).toHaveLength(2);
    expect(contract.sections.map((section) => section.label.en)).toEqual(['FIRST', 'SECOND']);
    // Each section gets its own block, so neither is shadowed by the other.
    const sectionBlocks = contract.document.blocks.filter((block) => block.type === 'section');
    expect(sectionBlocks).toHaveLength(2);
    expect(new Set(sectionBlocks.map((block) => block.id)).size).toBe(2);
    // The second section's field is not lost.
    const keys = contract.sections.flatMap((section) => section.fields.map((field) => field.key));
    expect(keys).toContain('only_in_second');
  });

  it('gives an id-less section one so it becomes visible and savable', () => {
    const template = fixtures.simpleForm();
    template.sections = [
      null,
      { label: { en: 'No id', ar: 'بلا معرف' }, fields: [] },
      template.sections[0]
    ];
    template.layout.sectionOrder = [];

    const contract = resolveTemplateContract(template);

    expect(contract.sections).toHaveLength(2);
    expect(contract.sections.every((section) => Boolean(section.id))).toBe(true);
    // Every section is reachable from the document.
    contract.sections.forEach((section) => {
      expect(contract.document.blocks.some((block) => block.refId === section.id)).toBe(true);
    });
  });

  it('never renames an existing section id', () => {
    const template = fixtures.multiSectionForm();
    const before = template.sections.map((section) => section.id);
    const contract = resolveTemplateContract(template);
    expect(contract.sections.map((section) => section.id)).toEqual(before);
  });

  it('repairSections drops non-objects without reordering the rest', () => {
    const repaired = repairSections([null, { id: 'a' }, undefined, 'nope', { id: 'b' }]);
    expect(repaired.map((section) => section.id)).toEqual(['a', 'b']);
  });

  it('derives a distinct block id per duplicate occurrence', () => {
    expect(blockIdForSection('x', 0)).toBe('blk_section_x');
    expect(blockIdForSection('x', 1)).toBe('blk_section_x__1');
  });

  it('lays out a template whose sections are all malformed without throwing', () => {
    const template = fixtures.simpleForm();
    template.sections = [null, undefined];
    template.layout.sectionOrder = ['ghost'];
    const contract = resolveTemplateContract(template);
    const result = layoutDocument({ contract, language: 'en', mode: 'preview' });
    expect(result.ok).toBe(true);
    expect(result.pageCount).toBe(1);
  });
});

describe('pagination safety', () => {
  it('stops at the page ceiling and says so instead of running away', () => {
    const contract = resolveTemplateContract(fixtures.simpleForm());
    const maxRow = contract.document.blocks
      .filter((block) => block.placement === 'flow')
      .reduce((max, block) => Math.max(max, block.row), 0);

    // 450 blocks that each demand their own page — more than the engine allows.
    for (let index = 0; index < 450; index += 1) {
      contract.document.blocks.push(createBlock('text', {
        id: `blk_forced_${index}`,
        placement: 'flow',
        row: maxRow + 1 + index,
        x: 0,
        w: 24,
        breakBefore: true,
        props: { content: { en: `Page ${index}`, ar: `صفحة ${index}` }, fontSize: 11 }
      }));
    }

    const started = Date.now();
    const result = layoutDocument({ contract, language: 'en', mode: 'print' });
    const elapsed = Date.now() - started;

    expect(result.ok).toBe(true);
    expect(result.pageCount).toBe(400);
    expect(result.overflows.some((item) => item.kind === 'page-limit-reached')).toBe(true);
    expect(elapsed).toBeLessThan(8000);
  });

  it('paginates a 400-page document in reasonable time', () => {
    const template = fixtures.tableForm();
    template.sections[0].advancedLayout.table.numberOfRows = 500;
    template.layout.margins = { top: 260, right: 20, bottom: 260, left: 20 };

    const started = Date.now();
    const result = layoutDocument({
      contract: resolveTemplateContract(template),
      language: 'en',
      mode: 'print'
    });
    const elapsed = Date.now() - started;

    expect(result.ok).toBe(true);
    expect(result.pageCount).toBeGreaterThan(10);
    // Furniture is measured per page SHAPE, not per page; this was 2.4s before.
    expect(elapsed).toBeLessThan(2000);
  });

  it('does not print a blank sheet for a trailing page break', () => {
    const contract = resolveTemplateContract(fixtures.simpleForm());
    const maxRow = contract.document.blocks
      .filter((block) => block.placement === 'flow')
      .reduce((max, block) => Math.max(max, block.row), 0);
    contract.document.blocks.push(createBlock('pageBreak', {
      id: 'blk_trailing_break', placement: 'flow', row: maxRow + 1, x: 0, w: 24
    }));

    const result = layoutDocument({ contract, language: 'en', mode: 'print' });
    expect(result.pageCount).toBe(1);
  });

  it('still honours a page break that has content after it', () => {
    const contract = resolveTemplateContract(fixtures.multiSectionForm());
    const target = contract.document.blocks.find((block) => block.refId === 'section_b');
    contract.document.blocks.forEach((block) => {
      if (block.placement === 'flow' && block.row >= target.row) block.row += 1;
    });
    contract.document.blocks.push(createBlock('pageBreak', {
      id: 'blk_break', placement: 'flow', row: target.row - 1, x: 0, w: 24
    }));

    const result = layoutDocument({ contract, language: 'en', mode: 'print' });
    expect(result.pageCount).toBe(2);
  });

  it('reserves enough footer height for four-digit page numbers', () => {
    // The footer is measured before the page count is known; the probe must not
    // under-reserve, or the footer would overlap content on long documents.
    const template = fixtures.multiPageForm();
    template.pdfStyle.footer.showPageNumbers = true;
    const result = layoutDocument({
      contract: resolveTemplateContract(template),
      language: 'en',
      mode: 'print'
    });

    const { geometry } = result;
    const bottomLimit = geometry.contentYPt + geometry.contentHeightPt + 0.5;
    result.pages.forEach((page) => {
      page.primitives.forEach((primitive) => {
        if (primitive.k === 'text') {
          expect(primitive.y).toBeLessThanOrEqual(bottomLimit);
        }
      });
    });
  });
});

describe('degenerate table columns', () => {
  it('lifts unusably narrow columns to a legible minimum', () => {
    const widths = resolveColumnWidths([{ width: '0%' }, { width: '100%' }], 400);
    expect(widths[0]).toBeGreaterThanOrEqual(11.9);
    expect(widths.reduce((sum, value) => sum + value, 0)).toBeCloseTo(400, 4);
  });

  it('keeps columns non-overlapping even with absurd width tokens', () => {
    const widths = resolveColumnWidths(
      [{ width: '0%' }, { width: '0px' }, { width: '0fr' }, { width: '100%' }],
      500
    );
    widths.forEach((width) => expect(width).toBeGreaterThan(0));
    expect(widths.reduce((sum, value) => sum + value, 0)).toBeCloseTo(500, 4);
  });
});

describe('text measurement performance', () => {
  it('wraps a very long unbroken token in linear time', () => {
    const token = 'x'.repeat(60000);
    const started = Date.now();
    const lines = wrapText(token, 200, { fontSize: 10 });
    const elapsed = Date.now() - started;

    expect(lines.length).toBeGreaterThan(1);
    expect(elapsed).toBeLessThan(1500);
  });

  it('still wraps at the right place after the optimisation', () => {
    const lines = wrapText('aaa bbb ccc ddd', measureText('aaa bbb', { fontSize: 10 }) + 0.5, { fontSize: 10 });
    expect(lines[0]).toBe('aaa bbb');
  });

  it('preserves explicit newlines', () => {
    expect(wrapText('one\ntwo', 500, { fontSize: 10 })).toEqual(['one', 'two']);
  });
});

describe('createBlock hardening', () => {
  it('normalises a partial overlay instead of storing undefined millimetres', () => {
    const block = createBlock('image', { placement: 'overlay', overlay: { xMm: 5 } });
    expect(block.overlay.xMm).toBe(5);
    ['yMm', 'wMm', 'hMm', 'rotation', 'opacity'].forEach((key) => {
      expect(Number.isFinite(block.overlay[key])).toBe(true);
    });
  });

  it('ignores an invalid type or placement supplied by a caller', () => {
    const block = createBlock('text', { type: 'nonsense', placement: 'nowhere' });
    expect(block.type).toBe('text');
    expect(block.placement).toBe('flow');
  });
});

describe('section title colour', () => {
  const titleColorOf = (template) => {
    const result = layoutDocument({
      contract: resolveTemplateContract(template),
      language: 'en',
      mode: 'preview'
    });
    const text = result.pages[0].primitives
      .find((primitive) => primitive.k === 'text' && primitive.lines.includes('Basic Details'));
    return text?.color;
  };

  it('uses a readable default over the dark title bar', () => {
    expect(titleColorOf(fixtures.simpleForm())).toBe('#ffffff');
  });

  it('honours an explicit author colour', () => {
    const template = fixtures.simpleForm();
    template.sections[0].advancedLayout.styling.titleColor = '#ff8800';
    expect(titleColorOf(template)).toBe('#ff8800');
  });

  it('treats the historic schema defaults as "auto"', () => {
    const template = fixtures.simpleForm();
    template.sections[0].advancedLayout.styling.titleColor = '#000000';
    expect(titleColorOf(template)).toBe('#ffffff');
  });
});

describe('document normalisation guards', () => {
  it('survives a document whose blocks array is garbage', () => {
    const documentValue = normalizeDocument({ version: 2, blocks: [null, undefined, 42, {}] });
    expect(Array.isArray(documentValue.blocks)).toBe(true);
    documentValue.blocks.forEach((block) => {
      expect(typeof block.id).toBe('string');
      expect(typeof block.type).toBe('string');
    });
  });

  it('builds a document for a template with no sections at all', () => {
    const documentValue = buildDocumentFromLegacy({ layout: {}, pdfStyle: {} });
    expect(documentValue.version).toBe(2);
    expect(documentValue.blocks.length).toBeGreaterThan(0);
  });
});

describe('semantic ordering with malformed data', () => {
  it('returns nothing rather than throwing for a broken contract', () => {
    expect(getSemanticSections({ ok: false })).toEqual([]);
  });
});
