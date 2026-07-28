import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DocumentRenderer from '../../document-renderer/DocumentRenderer';
import { BLOCK_LABELS } from '../paletteItems';

const { GRID_COLUMNS, FIXED_HEIGHT_BLOCK_TYPES } = require('../../../document/documentModel');
const { ptToMm } = require('../../../document/units');

/**
 * The editable page canvas.
 *
 * The canvas draws the very same layout the preview and the PDF draw, then puts
 * an interaction layer on top of it. It never computes its own geometry: every
 * selectable box comes from `layout.blockBoxes`, so what you grab is exactly what
 * will print.
 *
 * Interaction model:
 *  - Flow blocks move on a 24-column grid and reorder by row. Snapping is
 *    intrinsic (positions ARE integers), which is what stops a design from
 *    drifting a fraction of a millimetre every time it is touched.
 *  - Overlay blocks (stamp, watermark, floating image/QR) move freely in
 *    millimetres and are clamped to the sheet.
 *  - Pointer movement only updates transient state; a single history entry is
 *    committed on pointer-up. Escape cancels a gesture outright.
 *  - Everything reachable by pointer is reachable by keyboard, and RTL flips the
 *    *visual* direction while the stored coordinate stays logical.
 */

const DRAG_THRESHOLD_PX = 4;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const BuilderCanvas = ({
  layout,
  language,
  zoom,
  selection,
  showGrid,
  showMargins,
  showAlignmentGuides = true,
  paletteDragItem,
  onSelect,
  onCommand,
  onBeginGesture,
  onEndGesture,
  onCancelGesture,
  onAbandonGesture,
  onDropPaletteItem,
  onDuplicate,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  announce
}) => {
  const isArabic = language === 'ar';
  const rtl = isArabic;
  const canvasRef = useRef(null);
  const gestureRef = useRef(null);
  const frameRef = useRef(null);

  const [dropIndicator, setDropIndicator] = useState(null);
  const [measure, setMeasure] = useState(null);
  const [guides, setGuides] = useState([]);
  const [isPanning, setIsPanning] = useState(false);

  const documentValue = layout?.contract?.document;
  const geometry = layout?.geometry;

  const overflowIds = useMemo(
    () => new Set((layout?.overflows || []).map((item) => item.blockId)),
    [layout]
  );

  const blocksById = useMemo(() => {
    const map = new Map();
    (documentValue?.blocks || []).forEach((block) => map.set(block.id, block));
    return map;
  }, [documentValue]);

  /** Millimetres per grid column step, including the gutter. */
  const columnStepMm = useMemo(() => {
    if (!geometry || !documentValue) return 1;
    const contentMm = ptToMm(geometry.contentWidthPt);
    const gutter = documentValue.grid.gutterMm;
    const unit = (contentMm - gutter * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
    return unit + gutter;
  }, [geometry, documentValue]);

  const pageRectFor = useCallback((pageIndex) => {
    const root = canvasRef.current;
    if (!root) return null;
    const element = root.querySelector(`.doc-page[data-page-index="${pageIndex}"]`);
    return element ? element.getBoundingClientRect() : null;
  }, []);

  /* ------------------------------------------------------------ gestures */

  const applyFlowMove = useCallback((gesture, clientX, clientY) => {
    const rect = pageRectFor(gesture.pageIndex);
    if (!rect || !geometry) return;

    const mmPerPx = geometry.widthMm / rect.width;
    const dxMm = (clientX - gesture.startX) * mmPerPx;
    const dxCols = Math.round(dxMm / columnStepMm);
    const logicalDelta = rtl ? -dxCols : dxCols;
    const nextX = clamp(gesture.originX + logicalDelta, 0, GRID_COLUMNS - gesture.originW);

    // Vertical target: hit-test the row bands captured when the drag STARTED.
    // Using the live layout would mean hit-testing frame N+1 against the result
    // of frame N while the command itself applies to the gesture's base — the two
    // numbering spaces diverge as soon as a frame inserts a row, and the block
    // jitters past the pointer.
    const cursorMmY = (clientY - rect.top) * mmPerPx;
    const candidates = gesture.rowBands || [];

    let targetRow = gesture.originRow;
    let insertRow = false;

    if (candidates.length > 0) {
      const first = candidates[0];
      const last = candidates[candidates.length - 1];
      if (cursorMmY < ptToMm(first.y)) {
        targetRow = first.row;
        insertRow = true;
      } else if (cursorMmY > ptToMm(last.y + last.h)) {
        targetRow = last.row + 1;
        insertRow = true;
      } else {
        const hit = candidates.find((box) => cursorMmY >= ptToMm(box.y)
          && cursorMmY <= ptToMm(box.y + box.h));
        if (hit) {
          const topMm = ptToMm(hit.y);
          const heightMm = ptToMm(hit.h);
          const ratio = (cursorMmY - topMm) / Math.max(1, heightMm);
          if (ratio < 0.3) {
            targetRow = hit.row;
            insertRow = true;
          } else if (ratio > 0.7) {
            targetRow = hit.row + 1;
            insertRow = true;
          } else {
            targetRow = hit.row;
            insertRow = false;
          }
        }
      }
    }

    onCommand({
      type: 'MOVE_BLOCK',
      blockId: gesture.blockId,
      row: targetRow,
      x: nextX,
      insertRow,
      fromBase: true
    });

    setMeasure({
      pageIndex: gesture.pageIndex,
      xMm: (clientX - rect.left) * mmPerPx,
      yMm: cursorMmY,
      text: `${isArabic ? 'عمود' : 'Column'} ${nextX + 1}–${nextX + gesture.originW} · ${isArabic ? 'صف' : 'Row'} ${targetRow + 1}`
    });

    // Alignment feedback: highlight any shared logical edge. Suppressed when the
    // author has turned alignment guides off.
    if (!showAlignmentGuides) {
      return;
    }
    const edges = new Set();
    (documentValue.blocks || []).forEach((block) => {
      if (block.placement !== 'flow' || block.id === gesture.blockId) return;
      edges.add(block.x);
      edges.add(block.x + block.w);
    });
    const active = [];
    if (edges.has(nextX)) active.push(nextX);
    if (edges.has(nextX + gesture.originW)) active.push(nextX + gesture.originW);
    setGuides(active.map((column) => ({ pageIndex: gesture.pageIndex, column })));
  }, [
    pageRectFor, geometry, columnStepMm, rtl, onCommand, isArabic, documentValue,
    showAlignmentGuides
  ]);

  const applyFlowResize = useCallback((gesture, clientX, clientY) => {
    const rect = pageRectFor(gesture.pageIndex);
    if (!rect || !geometry) return;

    const mmPerPx = geometry.widthMm / rect.width;
    const dxCols = Math.round(((clientX - gesture.startX) * mmPerPx) / columnStepMm);
    const logicalDelta = rtl ? -dxCols : dxCols;

    if (gesture.edge === 'end') {
      const w = clamp(gesture.originW + logicalDelta, 1, GRID_COLUMNS - gesture.originX);
      onCommand({ type: 'RESIZE_BLOCK', blockId: gesture.blockId, w, fromBase: true });
      setMeasure({
        pageIndex: gesture.pageIndex,
        xMm: (clientX - rect.left) * mmPerPx,
        yMm: (clientY - rect.top) * mmPerPx,
        text: `${w}/${GRID_COLUMNS} ${isArabic ? 'أعمدة' : 'columns'}`
      });
      return;
    }

    if (gesture.edge === 'start') {
      const x = clamp(gesture.originX + logicalDelta, 0, gesture.originX + gesture.originW - 1);
      const w = gesture.originW + (gesture.originX - x);
      onCommand({ type: 'MOVE_BLOCK', blockId: gesture.blockId, row: gesture.originRow, x, fromBase: true });
      onCommand({ type: 'RESIZE_BLOCK', blockId: gesture.blockId, w });
      setMeasure({
        pageIndex: gesture.pageIndex,
        xMm: (clientX - rect.left) * mmPerPx,
        yMm: (clientY - rect.top) * mmPerPx,
        text: `${w}/${GRID_COLUMNS} ${isArabic ? 'أعمدة' : 'columns'}`
      });
      return;
    }

    if (gesture.edge === 'bottom') {
      const dyMm = (clientY - gesture.startY) * mmPerPx;
      const nextHeight = Math.max(3, Math.round((gesture.originHeightMm + dyMm) * 2) / 2);
      onCommand({ type: 'RESIZE_BLOCK', blockId: gesture.blockId, heightMm: nextHeight, fromBase: true });
      setMeasure({
        pageIndex: gesture.pageIndex,
        xMm: (clientX - rect.left) * mmPerPx,
        yMm: (clientY - rect.top) * mmPerPx,
        text: `${nextHeight.toFixed(1)} mm`
      });
    }
  }, [pageRectFor, geometry, columnStepMm, rtl, onCommand, isArabic]);

  const applyOverlayGesture = useCallback((gesture, clientX, clientY) => {
    const rect = pageRectFor(gesture.pageIndex);
    if (!rect || !geometry) return;

    const mmPerPx = geometry.widthMm / rect.width;
    const dxMm = (clientX - gesture.startX) * mmPerPx;
    const dyMm = (clientY - gesture.startY) * mmPerPx;

    if (gesture.mode === 'move') {
      const xMm = clamp(gesture.originXMm + dxMm, 0, geometry.widthMm - gesture.originWMm);
      const yMm = clamp(gesture.originYMm + dyMm, 0, geometry.heightMm - gesture.originHMm);
      onCommand({
        type: 'MOVE_OVERLAY',
        blockId: gesture.blockId,
        xMm: Math.round(xMm * 2) / 2,
        yMm: Math.round(yMm * 2) / 2,
        fromBase: true
      });
      setMeasure({
        pageIndex: gesture.pageIndex,
        xMm: xMm,
        yMm: yMm,
        text: `${xMm.toFixed(0)} , ${yMm.toFixed(0)} mm`
      });
      return;
    }

    // Overlay coordinates are physical and left-anchored — the engine does not
    // mirror them — and the handle sits at the physical bottom-right. So the
    // resize must NOT be flipped for RTL, unlike the column-grid resize.
    const wMm = clamp(gesture.originWMm + dxMm, 5, geometry.widthMm - gesture.originXMm);
    const hMm = clamp(gesture.originHMm + dyMm, 5, geometry.heightMm - gesture.originYMm);
    onCommand({
      type: 'RESIZE_OVERLAY',
      blockId: gesture.blockId,
      wMm: Math.round(wMm * 2) / 2,
      hMm: Math.round(hMm * 2) / 2,
      fromBase: true
    });
    setMeasure({
      pageIndex: gesture.pageIndex,
      xMm: gesture.originXMm,
      yMm: gesture.originYMm,
      text: `${wMm.toFixed(0)} × ${hMm.toFixed(0)} mm`
    });
  }, [pageRectFor, geometry, onCommand]);

  /** Apply a pointer position immediately, bypassing the rAF throttle. */
  const applyGestureAt = useCallback((gesture, clientX, clientY) => {
    if (gesture.placement === 'overlay') {
      applyOverlayGesture(gesture, clientX, clientY);
    } else if (gesture.mode === 'move') {
      applyFlowMove(gesture, clientX, clientY);
    } else {
      applyFlowResize(gesture, clientX, clientY);
    }
  }, [applyOverlayGesture, applyFlowMove, applyFlowResize]);

  const endGesture = useCallback((cancelled) => {
    const gesture = gestureRef.current;
    if (!gesture) {
      // Nothing in flight: do not touch state, otherwise every click anywhere in
      // the app would schedule a canvas re-render through a fresh `[]`.
      return;
    }
    setMeasure(null);
    setGuides([]);

    // A quick drag can finish before its animation frame runs. Flush the last
    // known pointer position synchronously, otherwise the whole gesture is lost
    // and the block silently snaps back.
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      if (!cancelled && gesture.moved && gesture.lastX !== undefined) {
        applyGestureAt(gesture, gesture.lastX, gesture.lastY);
      }
    }

    gestureRef.current = null;

    if (cancelled) {
      onCancelGesture();
      return;
    }
    if (gesture.moved) {
      onEndGesture();
      const block = blocksById.get(gesture.blockId);
      if (block) {
        announce(gesture.mode === 'move'
          ? (isArabic
            ? `تم نقل العنصر إلى الصف ${block.row + 1}، العمود ${block.x + 1}`
            : `Moved to row ${block.row + 1}, column ${block.x + 1}`)
          : (isArabic
            ? `تم تغيير الحجم إلى ${block.w} من ${GRID_COLUMNS} أعمدة`
            : `Resized to ${block.w} of ${GRID_COLUMNS} columns`));
      }
    } else {
      onCancelGesture();
    }
  }, [onCancelGesture, onEndGesture, blocksById, announce, isArabic, applyGestureAt]);

  const handlePointerMove = useCallback((event) => {
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (!gesture.moved) {
      const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (distance < DRAG_THRESHOLD_PX) return;
      gesture.moved = true;
      onBeginGesture();
    }

    // Remember the position even while throttled so pointer-up can flush it.
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;

    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const current = gestureRef.current;
      if (!current || current.lastX === undefined) return;
      applyGestureAt(current, current.lastX, current.lastY);
    });
  }, [onBeginGesture, applyGestureAt]);

  useEffect(() => {
    const move = (event) => handlePointerMove(event);
    const up = () => endGesture(false);
    const key = (event) => {
      if (event.key === 'Escape' && gestureRef.current) {
        // Consume the key so the canvas keydown handler does not ALSO clear the
        // selection — cancelling a drag should not deselect.
        event.preventDefault();
        event.stopPropagation();
        endGesture(true);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', key, true);
    };
  }, [handlePointerMove, endGesture]);

  /**
   * If the canvas disappears mid-drag (preview toggle, viewport crossing the
   * mobile breakpoint, route change) the pointer-up never arrives. Abandoning the
   * gesture releases the reducer's gesture base — leaving it set would silently
   * stop recording history and let the next click roll the document back.
   *
   * The callback is held in a ref so this effect can have an EMPTY dependency
   * list: with the callback itself as a dependency the cleanup would run on
   * every re-render and cancel the drag that had just started.
   */
  const abandonRef = useRef(onAbandonGesture);
  abandonRef.current = onAbandonGesture;
  useEffect(() => () => {
    if (gestureRef.current) {
      gestureRef.current = null;
      abandonRef.current();
    }
  }, []);

  const startGesture = useCallback((event, box, mode, edge) => {
    // Left button only, primary pointer only: a right-click context menu can
    // swallow the pointer-up and leave a block following the bare cursor.
    if (event.button !== 0 || event.isPrimary === false) return;

    const block = blocksById.get(box.blockId);
    if (!block || block.locked) return;
    // Page furniture has no movable geometry; selecting it is the whole gesture.
    if (mode === 'move' && block.placement !== 'flow' && block.placement !== 'overlay') {
      onSelect({ kind: 'block', blockId: block.id, sectionId: block.refId || null });
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    onSelect({ kind: 'block', blockId: block.id, sectionId: block.refId || null });

    gestureRef.current = {
      rowBands: (layout.blockBoxes || [])
        .filter((item) => item.placement === 'flow'
          && item.pageIndex === box.pageIndex
          && item.blockId !== box.blockId)
        .sort((a, b) => a.y - b.y),
      blockId: block.id,
      blockType: block.type,
      placement: block.placement,
      pageIndex: box.pageIndex,
      mode,
      edge,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: block.x,
      originW: block.w,
      originRow: block.row,
      originHeightMm: block.heightMm || block.minHeightMm || ptToMm(box.h),
      originXMm: block.overlay?.xMm ?? 0,
      originYMm: block.overlay?.yMm ?? 0,
      originWMm: block.overlay?.wMm ?? ptToMm(box.w),
      originHMm: block.overlay?.hMm ?? ptToMm(box.h)
    };
  }, [blocksById, onSelect, layout]);

  /* --------------------------------------------------------- palette drop */

  const computeDropTarget = useCallback((event) => {
    if (!geometry || !layout) return null;
    const pageElements = canvasRef.current?.querySelectorAll('.doc-page') || [];
    for (let index = 0; index < pageElements.length; index += 1) {
      const rect = pageElements[index].getBoundingClientRect();
      if (event.clientY >= rect.top && event.clientY <= rect.bottom
        && event.clientX >= rect.left && event.clientX <= rect.right) {
        const pageIndex = Number(pageElements[index].getAttribute('data-page-index'));
        const mmPerPx = geometry.widthMm / rect.width;
        const cursorMmY = (event.clientY - rect.top) * mmPerPx;
        const cursorMmX = (event.clientX - rect.left) * mmPerPx;

        const candidates = (layout.blockBoxes || [])
          .filter((box) => box.placement === 'flow' && box.pageIndex === pageIndex)
          .sort((a, b) => a.y - b.y);

        if (candidates.length === 0) {
          return { pageIndex, row: 0, yMm: ptToMm(geometry.contentYPt), xMm: cursorMmX };
        }
        const last = candidates[candidates.length - 1];
        const hit = candidates.find((box) => cursorMmY <= ptToMm(box.y + box.h / 2));
        if (hit) {
          return { pageIndex, row: hit.row, yMm: ptToMm(hit.y), xMm: cursorMmX };
        }
        return { pageIndex, row: last.row + 1, yMm: ptToMm(last.y + last.h), xMm: cursorMmX };
      }
    }
    return null;
  }, [geometry, layout]);

  const handleDragOver = (event) => {
    if (!paletteDragItem) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDropIndicator(computeDropTarget(event));
  };

  const handleDrop = (event) => {
    if (!paletteDragItem) return;
    event.preventDefault();
    const target = computeDropTarget(event);
    setDropIndicator(null);
    onDropPaletteItem(paletteDragItem, target);
  };

  /* ------------------------------------------------------------ keyboard */

  const handleKeyDown = (event) => {
    const meta = event.ctrlKey || event.metaKey;

    if (meta && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) onRedo(); else onUndo();
      return;
    }
    if (meta && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      onRedo();
      return;
    }
    if (selection.kind !== 'block' || !selection.blockId) {
      return;
    }
    const block = blocksById.get(selection.blockId);
    if (!block) return;

    if (meta && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      onDuplicate(block.id);
      return;
    }
    if (meta && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      onCopy(block.id);
      return;
    }
    if (meta && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      onPaste();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onDelete(block.id);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onSelect({ kind: 'document' });
      return;
    }
    if (block.locked) return;

    const step = event.shiftKey ? 4 : 1;
    const horizontal = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    const vertical = { ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (horizontal === undefined && vertical === undefined) return;

    event.preventDefault();

    if (block.placement === 'overlay') {
      const delta = (event.shiftKey ? 5 : 1);
      // Clamp against the element's own size so an arrow key cannot walk it off
      // the sheet, matching what the pointer path already enforces.
      const width = block.overlay?.wMm ?? 0;
      const height = block.overlay?.hMm ?? 0;
      const xMm = clamp(
        (block.overlay?.xMm ?? 0) + (horizontal || 0) * delta,
        0,
        Math.max(0, geometry.widthMm - width)
      );
      const yMm = clamp(
        (block.overlay?.yMm ?? 0) + (vertical || 0) * delta,
        0,
        Math.max(0, geometry.heightMm - height)
      );
      onCommand({ type: 'MOVE_OVERLAY', blockId: block.id, xMm, yMm });
      announce(isArabic
        ? `العنصر العائم: ${Math.round(xMm)} , ${Math.round(yMm)} مم`
        : `Floating element at ${Math.round(xMm)} , ${Math.round(yMm)} mm`);
      return;
    }

    if (horizontal !== undefined) {
      // Arrow keys move the block the way it LOOKS on screen; the stored value
      // stays logical, so an RTL author is not fighting mirrored coordinates.
      const logical = rtl ? -horizontal : horizontal;
      if (event.altKey) {
        const w = clamp(block.w + logical * step, 1, GRID_COLUMNS - block.x);
        onCommand({ type: 'RESIZE_BLOCK', blockId: block.id, w });
        announce(isArabic
          ? `العرض ${w} من ${GRID_COLUMNS}`
          : `Width ${w} of ${GRID_COLUMNS}`);
      } else {
        const x = clamp(block.x + logical * step, 0, GRID_COLUMNS - block.w);
        onCommand({ type: 'MOVE_BLOCK', blockId: block.id, row: block.row, x });
        announce(isArabic ? `العمود ${x + 1}` : `Column ${x + 1}`);
      }
      return;
    }

    onCommand({ type: 'REORDER_BLOCK', blockId: block.id, direction: vertical < 0 ? 'up' : 'down' });
    announce(vertical < 0
      ? (isArabic ? 'تم التحريك لأعلى' : 'Moved up')
      : (isArabic ? 'تم التحريك لأسفل' : 'Moved down'));
  };

  /* ---------------------------------------------------------- pan support */

  // Space-drag panning. `getModifierState('Space')` is not a thing, so the key
  // state has to be tracked explicitly.
  const spaceHeldRef = useRef(false);
  useEffect(() => {
    const down = (event) => {
      if (event.code === 'Space' && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || '')) {
        spaceHeldRef.current = true;
      }
    };
    const up = (event) => { if (event.code === 'Space') spaceHeldRef.current = false; };
    const blur = () => { spaceHeldRef.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const handleCanvasPointerDown = (event) => {
    if (event.button === 1 || (event.button === 0 && spaceHeldRef.current)) {
      setIsPanning(true);
      const root = canvasRef.current;
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = root.scrollLeft;
      const startTop = root.scrollTop;
      const move = (moveEvent) => {
        root.scrollLeft = startLeft - (moveEvent.clientX - startX);
        root.scrollTop = startTop - (moveEvent.clientY - startY);
      };
      const up = () => {
        setIsPanning(false);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      event.preventDefault();
    }
  };

  /* -------------------------------------------------------------- render */

  const renderPageOverlay = useCallback((page) => {
    const boxes = (layout.blockBoxes || []).filter((box) => box.pageIndex === page.index);
    const pageGuides = guides.filter((guide) => guide.pageIndex === page.index);
    const contentLeftMm = ptToMm(geometry.contentXPt);
    const contentWidthMm = ptToMm(geometry.contentWidthPt);

    return (
      <>
        {boxes.map((box) => {
          const block = blocksById.get(box.blockId);
          if (!block) return null;
          const isSelected = selection.blockId === box.blockId;
          const dragging = gestureRef.current?.blockId === box.blockId;
          const label = BLOCK_LABELS[block.type];
          const resizableWidth = block.placement === 'flow';
          // A watermark's geometry comes from its size percentage and is always
          // page-centred, so offering move/resize handles for it would be a lie.
          const geometryIsAuthored = block.type !== 'watermark';
          const resizableHeight = geometryIsAuthored
            && (FIXED_HEIGHT_BLOCK_TYPES.includes(block.type) || block.placement === 'overlay');
          const movable = geometryIsAuthored
            && (block.placement === 'flow' || block.placement === 'overlay');

          const classes = [
            'tb-blockbox',
            isSelected ? 'tb-blockbox--selected' : '',
            block.locked ? 'tb-blockbox--locked' : '',
            dragging ? 'tb-blockbox--dragging' : '',
            overflowIds.has(block.id) ? 'tb-blockbox--overflow' : ''
          ].filter(Boolean).join(' ');

          return (
            <div
              key={`${box.blockId}-${box.fragment}-${box.pageIndex}`}
              className={classes}
              style={{
                left: `${ptToMm(box.x)}mm`,
                top: `${ptToMm(box.y)}mm`,
                width: `${ptToMm(box.w)}mm`,
                height: `${ptToMm(box.h)}mm`
              }}
              role="button"
              tabIndex={box.fragment === 0 ? 0 : -1}
              aria-label={`${isArabic ? label.ar : label.en}${block.locked ? (isArabic ? ' (مقفل)' : ' (locked)') : ''}`}
              aria-pressed={isSelected}
              onPointerDown={(event) => (movable
                ? startGesture(event, box, 'move')
                : onSelect({ kind: 'block', blockId: block.id, sectionId: block.refId || null }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect({ kind: 'block', blockId: block.id, sectionId: block.refId || null });
                }
              }}
              onDoubleClick={() => onSelect({
                kind: block.type === 'section' ? 'section' : 'block',
                blockId: block.id,
                sectionId: block.refId || null
              })}
            >
              {isSelected && box.fragment === 0 && (
                <span className="tb-blockbox__tag">
                  {isArabic ? label.ar : label.en}
                  {block.locked ? ' 🔒' : ''}
                </span>
              )}

              {isSelected && !block.locked && resizableWidth && (
                <>
                  <span
                    className={`tb-handle tb-handle--${rtl ? 'e' : 'w'}`}
                    onPointerDown={(event) => startGesture(event, box, 'resize', 'start')}
                    role="presentation"
                  />
                  <span
                    className={`tb-handle tb-handle--${rtl ? 'w' : 'e'}`}
                    onPointerDown={(event) => startGesture(event, box, 'resize', 'end')}
                    role="presentation"
                  />
                </>
              )}

              {isSelected && !block.locked && resizableHeight && (
                <span
                  className={block.placement === 'overlay' ? 'tb-handle tb-handle--se' : 'tb-handle tb-handle--s'}
                  onPointerDown={(event) => startGesture(
                    event,
                    box,
                    'resize',
                    block.placement === 'overlay' ? 'corner' : 'bottom'
                  )}
                  role="presentation"
                />
              )}
            </div>
          );
        })}

        {pageGuides.map((guide, index) => {
          const unit = (contentWidthMm - documentValue.grid.gutterMm * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
          const offset = guide.column * (unit + documentValue.grid.gutterMm);
          const leftMm = rtl
            ? contentLeftMm + contentWidthMm - offset
            : contentLeftMm + offset;
          return (
            <div
              key={`guide-${index}`}
              className="tb-guide"
              style={{ left: `${leftMm}mm`, top: 0, width: '1px', height: '100%' }}
            />
          );
        })}

        {dropIndicator?.pageIndex === page.index && (
          <div
            className="tb-dropline"
            style={{
              left: `${contentLeftMm}mm`,
              top: `${dropIndicator.yMm}mm`,
              width: `${contentWidthMm}mm`
            }}
          />
        )}

        {measure?.pageIndex === page.index && (
          <div
            className="tb-measure"
            style={{ left: `${measure.xMm + 4}mm`, top: `${measure.yMm + 4}mm` }}
          >
            {measure.text}
          </div>
        )}
      </>
    );
  }, [
    layout, guides, geometry, blocksById, selection, overflowIds, isArabic, rtl,
    dropIndicator, measure, documentValue, onSelect, startGesture
  ]);

  if (!layout?.ok) {
    return null;
  }

  return (
    <div
      ref={canvasRef}
      className={`tb-canvas${paletteDragItem ? ' tb-canvas--dropping' : ''}`}
      style={{ cursor: isPanning ? 'grabbing' : undefined }}
      tabIndex={0}
      role="application"
      aria-label={isArabic ? 'لوحة تصميم المستند' : 'Document design canvas'}
      onKeyDown={handleKeyDown}
      onPointerDown={handleCanvasPointerDown}
      onDragOver={handleDragOver}
      onDragLeave={() => setDropIndicator(null)}
      onDrop={handleDrop}
      onClick={(event) => {
        if (event.target === canvasRef.current) {
          onSelect({ kind: 'document' });
        }
      }}
    >
      <DocumentRenderer
        layout={layout}
        zoom={zoom}
        mode="edit"
        language={language}
        showMargins={showMargins}
        showGrid={showGrid}
        showPageNumbers
        renderPageOverlay={renderPageOverlay}
      />
    </div>
  );
};

export default BuilderCanvas;
