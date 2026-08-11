import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../i18n';

interface HorizontalScrollChipsProps {
  className?: string;
  children: React.ReactNode;
}

export const HorizontalScrollChips: React.FC<HorizontalScrollChipsProps> = ({
  className = '',
  children,
}) => {
  const { t } = useI18n();
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;

    const overflow = el.scrollWidth > el.clientWidth + 1;
    setHasOverflow(overflow);
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => observer.disconnect();
  }, [updateScrollState, children]);

  const scrollByDirection = (direction: -1 | 1) => {
    const el = rowRef.current;
    if (!el) return;
    const step = Math.max(140, el.clientWidth * 0.55);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div
      className={`horizontal-scroll-chips ${hasOverflow ? 'horizontal-scroll-chips--overflow' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="horizontal-scroll-chips-btn horizontal-scroll-chips-btn--prev"
        onClick={() => scrollByDirection(-1)}
        disabled={!canScrollLeft}
        aria-label={t('common.scrollPrev')}
        aria-hidden={!hasOverflow}
        tabIndex={hasOverflow ? 0 : -1}
      >
        <ChevronLeft className="horizontal-scroll-chips-icon" aria-hidden />
      </button>

      <div
        ref={rowRef}
        className="site-directory-chips-row horizontal-scroll-chips-row flex flex-wrap gap-2"
        onScroll={updateScrollState}
      >
        {children}
      </div>

      <button
        type="button"
        className="horizontal-scroll-chips-btn horizontal-scroll-chips-btn--next"
        onClick={() => scrollByDirection(1)}
        disabled={!canScrollRight}
        aria-label={t('common.scrollNext')}
        aria-hidden={!hasOverflow}
        tabIndex={hasOverflow ? 0 : -1}
      >
        <ChevronRight className="horizontal-scroll-chips-icon" aria-hidden />
      </button>
    </div>
  );
};
