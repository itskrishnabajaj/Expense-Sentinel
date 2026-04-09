import { useRef, useCallback } from 'react';
import React from 'react';

const MOVE_THRESHOLD_SQ = 8 * 8;

export function useTap(handler: () => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (dx * dx + dy * dy > MOVE_THRESHOLD_SQ) {
      movedRef.current = true;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (!startRef.current || movedRef.current) {
      startRef.current = null;
      movedRef.current = false;
      return;
    }
    startRef.current = null;
    movedRef.current = false;
    handlerRef.current();
  }, []);

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
    movedRef.current = false;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
