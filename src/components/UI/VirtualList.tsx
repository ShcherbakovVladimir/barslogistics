import React, { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualListProps<T> {
  items: T[];
  estimateSize: number;
  overscan?: number;
  className?: string;
  role?: string;
  'aria-label'?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  estimateSize,
  overscan = 8,
  className = '',
  role = 'list',
  'aria-label': ariaLabel,
  renderItem,
  getKey,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getKey
      ? (index) => getKey(items[index], index)
      : (index) => index,
  });

  return (
    <div
      ref={parentRef}
      className={`virtual-list-scroll ${className}`.trim()}
      role={role}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div
        className="virtual-list-inner"
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              className="virtual-list-item"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              role="listitem"
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Hook to trap keyboard focus inside a modal/dialog. */
export function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const getFocusable = useCallback((root: HTMLElement): HTMLElement[] => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );
  }, []);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const focusable = getFocusable(containerRef.current);
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;
      const nodes = getFocusable(containerRef.current);
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [active, containerRef, getFocusable]);
}

export const SkipLink: React.FC<{ targetId?: string; label: string }> = ({
  targetId = 'main-content',
  label,
}) => (
  <a href={`#${targetId}`} className="skip-link">
    {label}
  </a>
);

export interface ModalShellProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  describedBy?: string;
}

/** Accessible modal shell with focus trap and aria attributes. */
export const ModalShell: React.FC<ModalShellProps> = ({
  onClose,
  children,
  className = '',
  labelledBy,
  describedBy,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, dialogRef);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={className}
      >
        {children}
      </div>
    </div>
  );
};
