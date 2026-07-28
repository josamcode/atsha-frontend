import React from 'react';

import { PALETTE_GROUPS } from '../paletteItems';

/**
 * Component palette.
 *
 * Every item supports BOTH interaction models on purpose:
 *  - drag onto the canvas for direct placement, and
 *  - activate with click / Enter / Space to append it to the document.
 *
 * The second path is what makes the builder usable with a keyboard alone and on
 * touch devices, where HTML5 drag-and-drop is not available.
 */
const ComponentPalette = ({ language, existingTypes, onAdd, onDragStart, onDragEnd }) => {
  const isArabic = language === 'ar';
  const text = (value) => (isArabic ? value.ar : value.en);

  return (
    <div className="tb-palette">
      {PALETTE_GROUPS.map((group) => (
        <section className="tb-palette__group" key={group.id}>
          <div className="tb-eyebrow tb-palette__groupLabel">{text(group.label)}</div>

          {group.items.map((item) => {
            const key = `${item.type}:${item.variant || 'default'}`;
            const disabled = Boolean(item.singleton) && existingTypes.has(item.type);

            return (
              <button
                key={key}
                type="button"
                className="tb-palette__item"
                disabled={disabled}
                draggable={!disabled}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy';
                  // A payload is set for completeness; the drag source is tracked
                  // in React state because dataTransfer.getData() is unreadable
                  // during dragover in every browser.
                  event.dataTransfer.setData('text/plain', key);
                  onDragStart(item);
                }}
                onDragEnd={onDragEnd}
                onClick={() => !disabled && onAdd(item)}
                title={disabled
                  ? (isArabic ? 'يمكن إضافة عنصر واحد فقط من هذا النوع' : 'Only one of these can be added')
                  : text(item.hint)}
                aria-label={`${text(item.label)} — ${text(item.hint)}`}
              >
                <span className="tb-palette__icon" aria-hidden="true">
                  <item.icon />
                </span>
                <span>
                  <span className="tb-palette__label">{text(item.label)}</span>
                  <span className="tb-palette__hint">
                    {disabled
                      ? (isArabic ? 'مضاف بالفعل' : 'Already in the document')
                      : text(item.hint)}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
};

export default ComponentPalette;
