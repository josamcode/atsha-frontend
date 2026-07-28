import React, { useState } from 'react';
import {
  FaEye, FaEyeSlash, FaLock, FaLockOpen, FaChevronDown, FaChevronRight, FaTrash
} from 'react-icons/fa';

import { BLOCK_LABELS, BLOCK_ICONS } from '../paletteItems';

/**
 * Document outline.
 *
 * A tree beats the old per-section tab strip for navigating a document, and it is
 * the accessible route to every reorder operation: each row is a real button, the
 * move controls are real buttons, and drag-to-reorder is an enhancement on top
 * rather than the only way to do it.
 */
const LayersPanel = ({
  language,
  document: documentValue,
  sections,
  selection,
  overflowBlockIds,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onDelete,
  onReorder
}) => {
  const isArabic = language === 'ar';
  const [expanded, setExpanded] = useState(() => new Set());
  const [dragBlockId, setDragBlockId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const sectionsById = new Map((sections || []).map((section) => [section.id, section]));

  const blockName = (block) => {
    if (block.type === 'section') {
      const section = sectionsById.get(block.refId);
      const label = isArabic ? section?.label?.ar : section?.label?.en;
      return label || (isArabic ? 'قسم بدون عنوان' : 'Untitled section');
    }
    if (block.type === 'text') {
      const content = isArabic ? block.props?.content?.ar : block.props?.content?.en;
      if (content) return content.slice(0, 34);
    }
    const label = BLOCK_LABELS[block.type];
    return isArabic ? label.ar : label.en;
  };

  const groups = [
    {
      id: 'pageHeader',
      label: isArabic ? 'أعلى كل صفحة' : 'On every page (top)',
      blocks: documentValue.blocks.filter((block) => block.placement === 'pageHeader')
    },
    {
      id: 'flow',
      label: isArabic ? 'محتوى المستند' : 'Document flow',
      blocks: documentValue.blocks
        .filter((block) => block.placement === 'flow')
        .sort((a, b) => (a.row - b.row) || (a.x - b.x))
    },
    {
      id: 'pageFooter',
      label: isArabic ? 'أسفل كل صفحة' : 'On every page (bottom)',
      blocks: documentValue.blocks.filter((block) => block.placement === 'pageFooter')
    },
    {
      id: 'overlay',
      label: isArabic ? 'عناصر عائمة' : 'Floating layer',
      blocks: documentValue.blocks.filter((block) => block.placement === 'overlay')
    }
  ].filter((group) => group.blocks.length > 0);

  const toggleExpanded = (blockId) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const renderBlock = (block, group) => {
    const Icon = BLOCK_ICONS[block.type];
    const section = block.type === 'section' ? sectionsById.get(block.refId) : null;
    const isSelected = selection.kind === 'block' && selection.blockId === block.id;
    const canExpand = Boolean(section && section.fields.length > 0);
    const isExpanded = expanded.has(block.id);
    const hasOverflow = overflowBlockIds.has(block.id);

    return (
      <React.Fragment key={block.id}>
        {dropTarget?.blockId === block.id && dropTarget.position === 'before' && (
          <div className="tb-layer__dropline" />
        )}

        {/*
          A plain row of real buttons rather than a listbox `option`: an option
          may not contain interactive content, and every action here (select,
          reorder, hide, lock, delete) has to be reachable with the keyboard.
        */}
        <div
          className={`tb-layer${block.hidden ? ' tb-layer--hidden' : ''}`}
          draggable={group.id === 'flow' && !block.locked}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', block.id);
            setDragBlockId(block.id);
          }}
          onDragEnd={() => { setDragBlockId(null); setDropTarget(null); }}
          onDragOver={(event) => {
            if (!dragBlockId || dragBlockId === block.id || group.id !== 'flow') return;
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
            setDropTarget({ blockId: block.id, position });
          }}
          onDrop={(event) => {
            if (!dragBlockId || !dropTarget) return;
            event.preventDefault();
            onReorder(dragBlockId, dropTarget.blockId, dropTarget.position);
            setDragBlockId(null);
            setDropTarget(null);
          }}
          title={hasOverflow
            ? (isArabic ? 'هذا العنصر يتجاوز حدود الصفحة' : 'This block overflows the page')
            : undefined}
        >
          {canExpand ? (
            <button
              type="button"
              className="tb-layer__action"
              onClick={() => toggleExpanded(block.id)}
              aria-expanded={isExpanded}
              aria-label={isExpanded
                ? (isArabic ? 'طيّ الحقول' : 'Collapse fields')
                : (isArabic ? 'عرض الحقول' : 'Expand fields')}
            >
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          ) : (
            <span style={{ width: 24, flex: 'none' }} aria-hidden="true" />
          )}

          <button
            type="button"
            className="tb-layer__name"
            aria-current={isSelected ? 'true' : undefined}
            style={{
              border: 'none',
              background: 'transparent',
              font: 'inherit',
              color: 'inherit',
              textAlign: 'start',
              cursor: 'pointer',
              padding: 0
            }}
            onClick={() => onSelect({ kind: 'block', blockId: block.id, sectionId: block.refId || null })}
          >
            <Icon aria-hidden="true" style={{ flex: 'none', opacity: 0.65, marginInlineEnd: 6 }} />
            {blockName(block)}
            {hasOverflow && <span style={{ color: '#ea580c', marginInlineStart: 6 }} aria-hidden="true">!</span>}
          </button>

          {group.id === 'flow' && (
            <>
              <button
                type="button"
                className="tb-layer__action"
                onClick={() => onReorder(block.id, null, 'up')}
                aria-label={isArabic ? 'تحريك لأعلى' : 'Move up'}
              >
                ↑
              </button>
              <button
                type="button"
                className="tb-layer__action"
                onClick={() => onReorder(block.id, null, 'down')}
                aria-label={isArabic ? 'تحريك لأسفل' : 'Move down'}
              >
                ↓
              </button>
            </>
          )}

          <button
            type="button"
            className="tb-layer__action"
            onClick={() => onToggleHidden(block.id)}
            aria-label={block.hidden
              ? (isArabic ? 'إظهار' : 'Show')
              : (isArabic ? 'إخفاء' : 'Hide')}
          >
            {block.hidden ? <FaEyeSlash /> : <FaEye />}
          </button>
          <button
            type="button"
            className="tb-layer__action"
            onClick={() => onToggleLocked(block.id)}
            aria-label={block.locked
              ? (isArabic ? 'إلغاء القفل' : 'Unlock')
              : (isArabic ? 'قفل' : 'Lock')}
          >
            {block.locked ? <FaLock /> : <FaLockOpen />}
          </button>
          <button
            type="button"
            className="tb-layer__action"
            onClick={() => onDelete(block.id)}
            aria-label={isArabic ? 'حذف' : 'Delete'}
          >
            <FaTrash />
          </button>
        </div>

        {dropTarget?.blockId === block.id && dropTarget.position === 'after' && (
          <div className="tb-layer__dropline" />
        )}

        {canExpand && isExpanded && section.fields.map((field) => {
          const fieldSelected = selection.kind === 'field'
            && selection.sectionId === section.id
            && selection.fieldKey === field.key;
          return (
            <button
              key={field.key}
              type="button"
              className={`tb-layer tb-layer--child${field.visible === false ? ' tb-layer--hidden' : ''}`}
              aria-current={fieldSelected ? 'true' : undefined}
              onClick={() => onSelect({
                kind: 'field', blockId: block.id, sectionId: section.id, fieldKey: field.key
              })}
            >
              <span className="tb-layer__name">
                {(isArabic ? field.label?.ar : field.label?.en)
                  || (isArabic ? 'حقل بدون اسم' : 'Untitled field')}
              </span>
              <span className="tb-chip">{field.type}</span>
            </button>
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <nav aria-label={isArabic ? 'هيكل المستند' : 'Document structure'}>
      <button
        type="button"
        className="tb-layer"
        aria-current={selection.kind === 'document' ? 'true' : undefined}
        onClick={() => onSelect({ kind: 'document' })}
        style={{ fontWeight: 700 }}
      >
        <span className="tb-layer__name">
          {isArabic ? 'المستند والصفحة' : 'Document & page'}
        </span>
      </button>

      {groups.map((group) => (
        <section key={group.id} style={{ marginTop: 14 }} aria-label={group.label}>
          <div className="tb-eyebrow" style={{ marginBottom: 6 }}>{group.label}</div>
          {group.blocks.map((block) => renderBlock(block, group))}
        </section>
      ))}
    </nav>
  );
};

export default LayersPanel;
