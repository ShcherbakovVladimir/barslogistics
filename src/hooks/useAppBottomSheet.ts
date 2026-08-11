import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { isMobileLayout } from '../utils/deviceLayout';

const DISMISS_THRESHOLD_PX = 96;

function applyDragOffset(raw: number): number {
  if (raw < 0) return raw * 0.28;
  return raw;
}

export function useAppBottomSheet(onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startClientYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const offsetRef = useRef(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const enabled = isMobileLayout();

  const onHandlePointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || isClosing || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    startClientYRef.current = e.clientY;
    startOffsetRef.current = offsetRef.current;
    setIsDragging(true);
  }, [enabled, isClosing]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      const delta = e.clientY - startClientYRef.current;
      const next = applyDragOffset(startOffsetRef.current + delta);
      offsetRef.current = next;
      setOffsetY(next);
    };

    const finish = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      pointerIdRef.current = null;
      setIsDragging(false);

      const sheetHeight = sheetRef.current?.offsetHeight ?? 480;
      const threshold = Math.min(DISMISS_THRESHOLD_PX, sheetHeight * 0.18);

      if (offsetRef.current > threshold) {
        setIsClosing(true);
        offsetRef.current = sheetHeight;
        setOffsetY(sheetHeight);
        return;
      }

      offsetRef.current = 0;
      setOffsetY(0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isClosing) return;
    const timer = window.setTimeout(onClose, 240);
    return () => window.clearTimeout(timer);
  }, [isClosing, onClose]);

  const sheetStyle: CSSProperties | undefined = enabled && (isDragging || offsetY !== 0 || isClosing)
    ? {
        transform: `translateY(${offsetY}px)`,
        transition: isDragging ? 'none' : 'transform 0.24s cubic-bezier(0.32, 0.72, 0, 1)',
        animation: 'none',
      }
    : undefined;

  return {
    sheetRef,
    sheetStyle,
    isDragging,
    isClosing,
    dragEnabled: enabled,
    onHandlePointerDown,
  };
}
