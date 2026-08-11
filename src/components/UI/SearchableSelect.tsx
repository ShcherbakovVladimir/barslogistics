import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useI18n } from '../../i18n';
import { getAppViewportRect } from '../../utils/viewport';

export interface SearchableSelectOption {
  value: string;
  label: string;
  keywords?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  panelClassName?: string;
  listClassName?: string;
  triggerClassName?: string;
  /** Render dropdown inside the component (for scrollable filter panels on mobile). */
  inlinePanel?: boolean;
}

const PANEL_GAP = 6;
const VIEWPORT_PAD = 8;
const SEARCH_WRAP_HEIGHT = 52;
const MIN_LIST_HEIGHT = 88;
const PREFERRED_LIST_HEIGHT = 224;

interface DropdownPanelLayout {
  left: number;
  width: number;
  top: number;
  maxHeight: number;
  listMaxHeight: number;
  placement: 'below' | 'above';
}

function computeDropdownPanelLayout(
  trigger: DOMRect,
  searchable: boolean,
): DropdownPanelLayout {
  const { top: vTop, left: vLeft, width: vWidth, height: vHeight } = getAppViewportRect();
  const vBottom = vTop + vHeight;

  const pad = VIEWPORT_PAD;
  const maxPanelWidth = vWidth - pad * 2;
  let width = Math.min(trigger.width, maxPanelWidth);
  let left = trigger.left;
  if (left + width > vLeft + vWidth - pad) {
    left = vLeft + vWidth - pad - width;
  }
  left = Math.max(vLeft + pad, left);

  const searchH = searchable ? SEARCH_WRAP_HEIGHT : 0;
  const spaceBelow = vBottom - pad - trigger.bottom - PANEL_GAP;
  const spaceAbove = trigger.top - PANEL_GAP - (vTop + pad);
  const openBelow = spaceBelow >= spaceAbove || spaceBelow >= MIN_LIST_HEIGHT + searchH;
  const placement: 'below' | 'above' = openBelow ? 'below' : 'above';
  const available = openBelow ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(
    searchH + MIN_LIST_HEIGHT,
    Math.min(searchH + PREFERRED_LIST_HEIGHT, Math.max(available, searchH + MIN_LIST_HEIGHT)),
  );
  const listMaxHeight = Math.max(MIN_LIST_HEIGHT, maxHeight - searchH);

  let top = openBelow
    ? trigger.bottom + PANEL_GAP
    : trigger.top - PANEL_GAP - maxHeight;

  top = Math.max(vTop + pad, Math.min(top, vBottom - pad - maxHeight));

  return {
    left,
    width,
    top,
    maxHeight,
    listMaxHeight,
    placement,
  };
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled = false,
  searchable = true,
  allowEmpty = false,
  emptyLabel,
  className = '',
  panelClassName = '',
  listClassName = '',
  triggerClassName = '',
  inlinePanel = false,
}) => {
  const { t } = useI18n();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [panelLayout, setPanelLayout] = useState<DropdownPanelLayout | null>(null);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(o => {
      const hay = `${o.label} ${o.keywords || ''} ${o.value}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query, searchable]);

  const updatePanelLayout = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelLayout(computeDropdownPanelLayout(rect, searchable));
  }, [searchable]);

  useLayoutEffect(() => {
    if (!open || inlinePanel) return;
    updatePanelLayout();
    const onScrollOrResize = () => updatePanelLayout();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.visualViewport?.addEventListener('resize', onScrollOrResize);
    window.visualViewport?.addEventListener('scroll', onScrollOrResize);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.visualViewport?.removeEventListener('resize', onScrollOrResize);
      window.visualViewport?.removeEventListener('scroll', onScrollOrResize);
    };
  }, [open, inlinePanel, updatePanelLayout]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(listboxId);
      if (panel?.contains(target)) return;
      setOpen(false);
      setQuery('');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, listboxId]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const panelBody = (
    <>
      {searchable && (
        <div className="modal-dropdown-search-wrap">
          <Search className="modal-dropdown-search-icon" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder || t('searchableSelect.searchPlaceholder')}
            className="modal-dropdown-search"
            onKeyDown={e => e.stopPropagation()}
          />
        </div>
      )}

      <div
        className={`modal-dropdown-list shipment-events-scroll ${listClassName}`.trim()}
        style={inlinePanel ? undefined : { maxHeight: panelLayout?.listMaxHeight }}
      >
        {allowEmpty && (
          <button
            type="button"
            className={`modal-dropdown-option ${value === '' ? 'is-selected' : ''}`}
            onClick={() => pick('')}
            role="option"
            aria-selected={value === ''}
          >
            <span className="truncate">{emptyLabel || t('searchableSelect.select')}</span>
            {value === '' && <Check className="modal-dropdown-check" />}
          </button>
        )}

        {filtered.length === 0 ? (
          <div className="modal-dropdown-empty">{t('searchableSelect.noResults')}</div>
        ) : filtered.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`modal-dropdown-option ${opt.value === value ? 'is-selected' : ''}`}
            onClick={() => pick(opt.value)}
            role="option"
            aria-selected={opt.value === value}
          >
            <span className="truncate">{opt.label}</span>
            {opt.value === value && <Check className="modal-dropdown-check" />}
          </button>
        ))}
      </div>
    </>
  );

  const inlinePanelNode = open && inlinePanel && (
    <div
      id={listboxId}
      className={`modal-dropdown-panel modal-dropdown-panel--inline ${panelClassName}`.trim()}
      role="listbox"
    >
      {panelBody}
    </div>
  );

  const portaledPanelNode = open && !inlinePanel && panelLayout && createPortal(
    <div
      id={listboxId}
      className={`modal-dropdown-panel is-viewport-clamped ${panelClassName}`.trim()}
      data-dropdown-placement={panelLayout.placement}
      style={{
        position: 'fixed',
        top: panelLayout.top,
        left: panelLayout.left,
        width: panelLayout.width,
        maxHeight: panelLayout.maxHeight,
        zIndex: 10000,
      }}
      role="listbox"
    >
      {panelBody}
    </div>,
    document.body,
  );

  return (
    <div ref={rootRef} className={`modal-dropdown ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`modal-dropdown-trigger ${triggerClassName} ${open ? 'is-open' : ''}`.trim()}
        onClick={() => {
          if (disabled) return;
          setOpen(v => !v);
          if (open) setQuery('');
        }}
      >
        <span className={`truncate ${selected || (allowEmpty && value === '') ? '' : 'modal-dropdown-placeholder'}`}>
          {selected?.label || (allowEmpty && value === '' ? (emptyLabel || t('searchableSelect.select')) : null) || placeholder || t('searchableSelect.select')}
        </span>
        <ChevronDown className={`modal-dropdown-chevron ${open ? 'is-open' : ''}`} />
      </button>
      {inlinePanelNode}
      {portaledPanelNode}
    </div>
  );
};
