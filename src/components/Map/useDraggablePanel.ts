import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { isMobileLayout } from '../../utils/deviceLayout';

function isTouchPrimaryDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

interface PanelPosition {
  x: number;
  y: number;
}

interface UseDraggablePanelOptions {
  containerRef: RefObject<HTMLElement | null>;
  storageKey: string;
  defaultPosition: PanelPosition;
}

function readStoredPosition(storageKey: string): PanelPosition | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PanelPosition;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function clampPosition(
  x: number,
  y: number,
  container: HTMLElement,
  panel: HTMLElement,
): PanelPosition {
  const maxX = Math.max(0, container.clientWidth - panel.offsetWidth);
  const maxY = Math.max(0, container.clientHeight - panel.offsetHeight);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

export function useDraggablePanel({
  containerRef,
  storageKey,
  defaultPosition,
}: UseDraggablePanelOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef<PanelPosition | null>(readStoredPosition(storageKey));

  const [position, setPosition] = useState<PanelPosition | null>(() => positionRef.current);
  const [isDragging, setIsDragging] = useState(false);
  const isFloating = position !== null;

  const persistPosition = useCallback((next: PanelPosition | null) => {
    positionRef.current = next;
    setPosition(next);
    if (next) {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const dock = useCallback(() => {
    persistPosition(null);
  }, [persistPosition]);

  const onDragHandlePointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || !containerRef.current || !panelRef.current) return;
    if (isMobileLayout() || isTouchPrimaryDevice()) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const container = containerRef.current;
    const panel = panelRef.current;
    const containerRect = container.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    const current = positionRef.current ?? {
      x: panelRect.left - containerRect.left,
      y: panelRect.top - containerRect.top,
    };

    if (!positionRef.current) {
      persistPosition(current);
    }

    dragOffsetRef.current = {
      x: e.clientX - panelRect.left,
      y: e.clientY - panelRect.top,
    };
    setIsDragging(true);
  }, [containerRef, persistPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: globalThis.PointerEvent) => {
      if (!containerRef.current || !panelRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const rawX = e.clientX - containerRect.left - dragOffsetRef.current.x;
      const rawY = e.clientY - containerRect.top - dragOffsetRef.current.y;
      const next = clampPosition(rawX, rawY, containerRef.current, panelRef.current);
      positionRef.current = next;
      setPosition(next);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      if (positionRef.current) {
        localStorage.setItem(storageKey, JSON.stringify(positionRef.current));
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [containerRef, isDragging, storageKey]);

  useEffect(() => {
    if (!containerRef.current || !panelRef.current || !position) return;

    const clampCurrent = () => {
      if (!containerRef.current || !panelRef.current || !positionRef.current) return;
      const next = clampPosition(
        positionRef.current.x,
        positionRef.current.y,
        containerRef.current,
        panelRef.current,
      );
      persistPosition(next);
    };

    const observer = new ResizeObserver(clampCurrent);
    observer.observe(containerRef.current);
    observer.observe(panelRef.current);
    clampCurrent();

    return () => observer.disconnect();
  }, [containerRef, persistPosition, position]);

  const panelStyle: CSSProperties = {
    position: 'absolute',
    left: position?.x ?? defaultPosition.x,
    top: position?.y ?? defaultPosition.y,
    zIndex: isDragging ? 40 : 30,
    touchAction: 'none',
  };

  return {
    panelRef,
    panelStyle,
    isFloating,
    isDragging,
    dock,
    onDragHandlePointerDown,
  };
}
