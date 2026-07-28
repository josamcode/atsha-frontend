import React, { useMemo } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

import './documentRenderer.css';

const { ptToMm } = require('../../document/units');

/**
 * Canonical browser renderer.
 *
 * It draws the draw primitives produced by `document/layoutEngine` and nothing
 * else — the very same primitives `backend/utils/pdfGenerator.js` executes with
 * PDFKit. Coordinates are emitted in millimetres so the printed page and the
 * exported PDF are physically identical, and zoom is a CSS transform so it can
 * never change a stored coordinate.
 */

/** Font stack chosen to sit close to the PDF's embedded faces. */
const DOCUMENT_FONT_STACK = '"Noto Sans Arabic", "Noto Naskh Arabic", Tajawal, "Helvetica Neue", Helvetica, Arial, sans-serif';

const mm = (pt) => `${ptToMm(pt).toFixed(4)}mm`;

const Rect = ({ p }) => {
  const style = {
    left: mm(p.x),
    top: mm(p.y),
    width: mm(p.w),
    height: mm(p.h),
    borderRadius: p.radius ? mm(p.radius) : undefined
  };
  if (p.fill) {
    style.backgroundColor = p.fill;
  }
  if (p.stroke) {
    const width = Math.max(0.25, p.strokeWidth || 1);
    style.border = `${mm(width)} ${p.dash ? 'dashed' : 'solid'} ${p.stroke}`;
    // Borders must not grow the box: the engine already accounted for the width.
    style.boxSizing = 'border-box';
  }
  if (p.rotation) {
    style.transform = `rotate(${p.rotation}deg)`;
  }
  return <div className="doc-primitive" style={style} />;
};

const Line = ({ p }) => {
  const horizontal = Math.abs(p.y2 - p.y1) < 0.01;
  const width = Math.max(0.25, p.width || 1);
  const style = horizontal
    ? {
      left: mm(Math.min(p.x1, p.x2)),
      top: mm(p.y1 - width / 2),
      width: mm(Math.abs(p.x2 - p.x1)),
      height: mm(width),
      backgroundColor: p.dash ? 'transparent' : p.stroke,
      borderTop: p.dash ? `${mm(width)} dashed ${p.stroke}` : undefined
    }
    : {
      left: mm(p.x1 - width / 2),
      top: mm(Math.min(p.y1, p.y2)),
      width: mm(width),
      height: mm(Math.abs(p.y2 - p.y1)),
      backgroundColor: p.dash ? 'transparent' : p.stroke,
      borderLeft: p.dash ? `${mm(width)} dashed ${p.stroke}` : undefined
    };
  return <div className="doc-primitive" style={style} />;
};

const Text = ({ p }) => {
  // Centre the glyph box inside the engine's line box — the PDF executor applies
  // exactly the same offset, so baselines agree between the two renderers.
  const baselineOffset = Math.max(0, (p.lineHeight - p.fontSize) / 2);
  return p.lines.map((line, index) => (
    line === '' ? null : (
      <div
        key={index}
        className="doc-text"
        dir={p.rtl ? 'rtl' : 'ltr'}
        style={{
          left: mm(p.x),
          top: mm(p.y + index * p.lineHeight + baselineOffset),
          width: mm(p.w),
          height: mm(p.fontSize),
          fontFamily: DOCUMENT_FONT_STACK,
          fontSize: `${p.fontSize}pt`,
          lineHeight: 1,
          fontWeight: p.bold ? 700 : 400,
          color: p.color,
          textAlign: p.align,
          unicodeBidi: 'plaintext'
        }}
      >
        {line}
      </div>
    )
  ));
};

const Image = ({ p }) => {
  const style = {
    left: mm(p.x),
    top: mm(p.y),
    width: mm(p.w),
    height: mm(p.h),
    borderRadius: p.radius ? mm(p.radius) : undefined,
    opacity: p.opacity === undefined ? 1 : p.opacity,
    overflow: 'hidden',
    backgroundColor: p.backgroundColor || undefined,
    boxSizing: 'border-box'
  };
  if (p.borderWidth > 0) {
    style.border = `${mm(p.borderWidth)} solid ${p.borderColor || '#d1d5db'}`;
  }
  if (p.rotation) {
    style.transform = `rotate(${p.rotation}deg)`;
  }
  return (
    <div className="doc-primitive" style={style}>
      <img
        className="doc-image"
        src={p.src}
        alt=""
        crossOrigin="anonymous"
        style={{ width: '100%', height: '100%', objectFit: p.fit || 'contain' }}
      />
    </div>
  );
};

const Qr = ({ p, printable }) => {
  const size = ptToMm(p.size);
  const Component = printable ? QRCodeCanvas : QRCodeSVG;
  return (
    <div
      className="doc-primitive"
      style={{ left: mm(p.x), top: mm(p.y), width: `${size}mm`, height: `${size}mm` }}
    >
      <Component
        value={String(p.value || '')}
        size={Math.max(32, Math.round(size * 3.7795))}
        bgColor={p.background || '#ffffff'}
        fgColor={p.foreground || '#111827'}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

const Placeholder = ({ p, language }) => (
  <div
    className={`doc-placeholder${p.subtle ? ' doc-placeholder--subtle' : ''}`}
    style={{ left: mm(p.x), top: mm(p.y), width: mm(p.w), height: mm(p.h) }}
  >
    {language === 'ar' ? (p.labelAr || p.label) : p.label}
  </div>
);

const Primitive = ({ p, printable, language }) => {
  switch (p.k) {
    case 'rect': return <Rect p={p} />;
    case 'line': return <Line p={p} />;
    case 'text': return <Text p={p} />;
    case 'image': return <Image p={p} />;
    case 'qr': return <Qr p={p} printable={printable} />;
    case 'placeholder': return <Placeholder p={p} language={language} />;
    default: return null;
  }
};

const MemoPage = React.memo(function DocumentPage({
  page,
  geometry,
  mode,
  language,
  showMargins,
  showGrid,
  gridColumns,
  gutterPt,
  pageLabel,
  children
}) {
  const printable = mode === 'print';

  const gridOverlay = useMemo(() => {
    if (!showGrid) return null;
    const unit = (geometry.contentWidthPt - gutterPt * (gridColumns - 1)) / gridColumns;
    return Array.from({ length: gridColumns }, (unused, index) => (
      <div
        key={index}
        style={{
          position: 'absolute',
          left: mm(geometry.contentXPt + index * (unit + gutterPt)),
          top: mm(geometry.contentYPt),
          width: mm(unit),
          height: mm(geometry.contentHeightPt),
          background: index % 2 === 0 ? 'rgba(1, 200, 83, 0.045)' : 'rgba(1, 200, 83, 0.02)'
        }}
      />
    ));
  }, [showGrid, geometry, gridColumns, gutterPt]);

  return (
    <div
      className="doc-page"
      data-page-index={page.index}
      style={{
        width: `${geometry.widthMm}mm`,
        height: `${geometry.heightMm}mm`
      }}
    >
      {showGrid && <div className="doc-page__grid" style={{ inset: 0 }}>{gridOverlay}</div>}

      {showMargins && (
        <div
          className="doc-page__margins"
          style={{
            left: mm(geometry.contentXPt),
            top: mm(geometry.contentYPt),
            width: mm(geometry.contentWidthPt),
            height: mm(geometry.contentHeightPt)
          }}
        />
      )}

      <div className="doc-page__content">
        {page.primitives.map((primitive, index) => (
          <Primitive
            key={`${primitive.k}-${index}`}
            p={primitive}
            printable={printable}
            language={language}
          />
        ))}
      </div>

      {children}

      {pageLabel && <div className="doc-page__number">{pageLabel}</div>}
    </div>
  );
});

/**
 * @param {object} props
 * @param {object} props.layout       result of `layoutDocument`
 * @param {number} [props.zoom]       screen zoom; never affects stored geometry
 * @param {'edit'|'preview'|'print'} [props.mode]
 * @param {boolean} [props.showMargins]
 * @param {boolean} [props.showGrid]
 * @param {function} [props.renderPageOverlay] extra chrome per page (editor only)
 */
const DocumentRenderer = ({
  layout,
  zoom = 1,
  mode = 'preview',
  language = 'en',
  showMargins = false,
  showGrid = false,
  showPageNumbers = false,
  renderPageOverlay,
  surfaceRef,
  className = ''
}) => {
  if (!layout || !layout.ok) {
    return null;
  }

  const { geometry, pages } = layout;
  const gridColumns = layout.contract?.document?.grid?.columns || 24;
  const gutterPt = ((layout.contract?.document?.grid?.gutterMm || 3) * 72) / 25.4;

  return (
    <div
      ref={surfaceRef}
      className={`doc-surface ${className}`.trim()}
      style={{
        transform: zoom === 1 ? undefined : `scale(${zoom})`,
        transformOrigin: 'top center',
        // Keep the scaled surface from leaving a scroll gap behind it.
        marginBottom: zoom < 1 ? `${(zoom - 1) * 100}%` : undefined
      }}
    >
      {/*
        Physical page size for the browser print dialog. Without this the browser
        falls back to its own paper choice and the printed page stops matching
        the builder and the PDF.
      */}
      <style>
        {`@page { size: ${geometry.widthMm}mm ${geometry.heightMm}mm; margin: 0; }`}
      </style>

      {pages.map((page) => (
        <MemoPage
          key={page.index}
          page={page}
          geometry={geometry}
          mode={mode}
          language={language}
          showMargins={showMargins}
          showGrid={showGrid}
          gridColumns={gridColumns}
          gutterPt={gutterPt}
          pageLabel={showPageNumbers ? `${page.index + 1} / ${pages.length}` : null}
        >
          {renderPageOverlay ? renderPageOverlay(page) : null}
        </MemoPage>
      ))}
    </div>
  );
};

export { DOCUMENT_FONT_STACK, mm };
export default DocumentRenderer;
