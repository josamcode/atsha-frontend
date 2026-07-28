import React from 'react';
import { render, screen } from '@testing-library/react';

import DocumentRenderer from '../DocumentRenderer';

const { layoutDocument } = require('../../../document/layoutEngine');
const { resolveTemplateContract } = require('../../../document/templateContract');
const { buildSampleValues, buildSampleInstance } = require('../../../document/sampleData');
const fixtures = require('../../../document/__fixtures__/templates');

jest.mock('qrcode.react', () => ({
  QRCodeSVG: (props) => <div data-testid="qr-svg" data-value={props.value} />,
  QRCodeCanvas: (props) => <div data-testid="qr-canvas" data-value={props.value} />
}));

const layoutFor = (template, language = 'en', mode = 'preview') => {
  const contract = resolveTemplateContract(template);
  return layoutDocument({
    contract,
    values: buildSampleValues(contract, language),
    formInstance: buildSampleInstance(template, language),
    language,
    mode
  });
};

describe('DocumentRenderer', () => {
  it('renders one physical page element per engine page', () => {
    const layout = layoutFor(fixtures.multiPageForm());
    const { container } = render(<DocumentRenderer layout={layout} />);
    expect(container.querySelectorAll('.doc-page')).toHaveLength(layout.pageCount);
  });

  it('sizes pages in real millimetres, not pixels', () => {
    const layout = layoutFor(fixtures.simpleForm());
    const { container } = render(<DocumentRenderer layout={layout} />);
    const page = container.querySelector('.doc-page');
    expect(page).toHaveStyle({ width: '210mm', height: '297mm' });
  });

  it('follows page size and orientation', () => {
    const template = fixtures.simpleForm();
    template.layout.pageSize = 'Letter';
    template.layout.orientation = 'landscape';
    const { container } = render(<DocumentRenderer layout={layoutFor(template)} />);
    const page = container.querySelector('.doc-page');
    expect(page).toHaveStyle({ width: '279.4mm', height: '215.9mm' });
  });

  it('emits an @page rule so browser printing matches the design', () => {
    const layout = layoutFor(fixtures.simpleForm());
    const { container } = render(<DocumentRenderer layout={layout} />);
    expect(container.querySelector('style').textContent)
      .toContain('@page { size: 210mm 297mm; margin: 0; }');
  });

  it('draws every text line the engine produced', () => {
    const layout = layoutFor(fixtures.groupedTableForm());
    const { container } = render(<DocumentRenderer layout={layout} />);
    const expected = layout.pages
      .flatMap((page) => page.primitives)
      .filter((p) => p.k === 'text')
      .flatMap((p) => p.lines)
      .filter(Boolean).length;
    expect(container.querySelectorAll('.doc-text')).toHaveLength(expected);
  });

  it('positions each text line at the engine coordinate', () => {
    const layout = layoutFor(fixtures.simpleForm());
    const { container } = render(<DocumentRenderer layout={layout} />);
    const first = layout.pages[0].primitives.find((p) => p.k === 'text' && p.lines[0]);
    const node = container.querySelector('.doc-text');
    const expectedLeftMm = (first.x * 25.4) / 72;
    expect(parseFloat(node.style.left)).toBeCloseTo(expectedLeftMm, 3);
  });

  it('marks Arabic text as RTL', () => {
    const { container } = render(<DocumentRenderer layout={layoutFor(fixtures.tableForm(), 'ar')} language="ar" />);
    const texts = [...container.querySelectorAll('.doc-text')];
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.every((node) => node.getAttribute('dir') === 'rtl')).toBe(true);
  });

  it('marks English text as LTR', () => {
    const { container } = render(<DocumentRenderer layout={layoutFor(fixtures.tableForm(), 'en')} />);
    const texts = [...container.querySelectorAll('.doc-text')];
    expect(texts.every((node) => node.getAttribute('dir') === 'ltr')).toBe(true);
  });

  it('renders grouped table headers and body cells', () => {
    const { container } = render(<DocumentRenderer layout={layoutFor(fixtures.groupedTableForm())} />);
    const text = container.textContent;
    ['Product', 'Morning', 'Evening', 'In', 'Out'].forEach((label) => {
      expect(text).toContain(label);
    });
  });

  it('renders images from the engine primitives', () => {
    const layout = layoutFor(fixtures.imageHeavyForm());
    const { container } = render(<DocumentRenderer layout={layout} />);
    const imagePrimitives = layout.pages.flatMap((p) => p.primitives).filter((p) => p.k === 'image');
    expect(container.querySelectorAll('img.doc-image')).toHaveLength(imagePrimitives.length);
  });

  it('uses a canvas QR in print mode so it can be rasterised', () => {
    const template = fixtures.simpleForm();
    template.pdfStyle.footer.showQRCode = true;
    template.pdfStyle.footer.qrCodeValue = 'https://example.com/f/1';

    const preview = render(<DocumentRenderer layout={layoutFor(template)} mode="preview" />);
    expect(preview.getByTestId('qr-svg')).toHaveAttribute('data-value', 'https://example.com/f/1');
    preview.unmount();

    const print = render(<DocumentRenderer layout={layoutFor(template, 'en', 'print')} mode="print" />);
    expect(print.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('shows margin and grid guides only when asked', () => {
    const layout = layoutFor(fixtures.simpleForm());
    const plain = render(<DocumentRenderer layout={layout} />);
    expect(plain.container.querySelector('.doc-page__margins')).toBeNull();
    expect(plain.container.querySelector('.doc-page__grid')).toBeNull();
    plain.unmount();

    const guided = render(<DocumentRenderer layout={layout} showMargins showGrid />);
    expect(guided.container.querySelector('.doc-page__margins')).not.toBeNull();
    expect(guided.container.querySelector('.doc-page__grid')).not.toBeNull();
  });

  it('applies zoom as a transform, never to the stored geometry', () => {
    const layout = layoutFor(fixtures.simpleForm());
    const { container } = render(<DocumentRenderer layout={layout} zoom={0.5} />);
    expect(container.querySelector('.doc-surface')).toHaveStyle({ transform: 'scale(0.5)' });
    // The page itself is still a full physical sheet.
    expect(container.querySelector('.doc-page')).toHaveStyle({ width: '210mm' });
  });

  it('renders placeholders for empty blocks in edit mode only', () => {
    const template = fixtures.simpleForm();
    template.sections[0].fields = [];

    const edit = render(<DocumentRenderer layout={layoutFor(template, 'en', 'edit')} mode="edit" />);
    expect(edit.container.querySelectorAll('.doc-placeholder').length).toBeGreaterThan(0);
    edit.unmount();

    const preview = render(<DocumentRenderer layout={layoutFor(template, 'en', 'preview')} />);
    expect(preview.container.querySelectorAll('.doc-placeholder')).toHaveLength(0);
  });

  it('renders nothing for an unsupported layout version', () => {
    const template = fixtures.simpleForm();
    template.document = { version: 9, page: {}, grid: {}, blocks: [] };
    const contract = resolveTemplateContract(template);
    const layout = layoutDocument({ contract, language: 'en', mode: 'preview' });
    const { container } = render(<DocumentRenderer layout={layout} />);
    expect(container.querySelectorAll('.doc-page')).toHaveLength(0);
  });

  it('lets the editor decorate each page', () => {
    const layout = layoutFor(fixtures.multiPageForm());
    render(
      <DocumentRenderer
        layout={layout}
        renderPageOverlay={(page) => <div data-testid={`overlay-${page.index}`} />}
      />
    );
    expect(screen.getByTestId('overlay-0')).toBeInTheDocument();
    expect(screen.getByTestId(`overlay-${layout.pageCount - 1}`)).toBeInTheDocument();
  });
});
