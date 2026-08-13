import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MapPin } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import type { KladrSuggestion } from '../../types';

interface KladrAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: KladrSuggestion) => void;
  mode?: 'address' | 'region';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  panelClassName?: string;
  dropdownZIndex?: number;
  dropdownPlacement?: 'below' | 'above';
  /** Only query KLADR after the user types in the field (ignore programmatic value). */
  requireUserInput?: boolean;
  /** Narrow suggestions to this region ( Oblast / krai name ). */
  regionHint?: string;
  disabled?: boolean;
}

export const KladrAddressInput: React.FC<KladrAddressInputProps> = ({
  value,
  onChange,
  onSelect,
  mode = 'address',
  placeholder,
  className = '',
  inputClassName = '',
  panelClassName = '',
  dropdownZIndex = 10000,
  dropdownPlacement = 'below',
  requireUserInput = false,
  regionHint,
  disabled = false,
}) => {
  const { t } = useI18n();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<KladrSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelRect, setPanelRect] = useState<{ top: number; left: number; width: number; placement: 'below' | 'above' } | null>(null);
  const requestSeq = useRef(0);
  const userInputRef = useRef(false);
  const skipSearchRef = useRef(false);

  const handleInputChange = (nextValue: string) => {
    userInputRef.current = true;
    onChange(nextValue);
  };

  const updatePanelRect = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPanelRect({
      top: dropdownPlacement === 'above' ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      placement: dropdownPlacement,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelRect();
    const onScrollOrResize = () => updatePanelRect();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, suggestions.length, dropdownPlacement]);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (requireUserInput && !userInputRef.current) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const seq = ++requestSeq.current;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await ApiService.suggestKladr(trimmed, {
          limit: 10,
          kind: mode,
          region: regionHint,
        });
        if (seq !== requestSeq.current) return;
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      } catch {
        if (seq !== requestSeq.current) return;
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, mode, regionHint, requireUserInput]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(listboxId);
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, listboxId]);

  const pick = (item: KladrSuggestion) => {
    const nextValue = mode === 'region'
      ? (item.region || item.name)
      : item.normalizedAddress;
    skipSearchRef.current = true;
    userInputRef.current = false;
    onChange(nextValue);
    onSelect?.(item);
    setOpen(false);
    setSuggestions([]);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) pick(selected);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const panel = open && panelRect && createPortal(
    <div
      id={listboxId}
      className={`modal-dropdown-panel kladr-suggest-panel ${panelClassName}`.trim()}
      style={{
        position: 'fixed',
        top: panelRect.top,
        left: panelRect.left,
        width: panelRect.width,
        zIndex: dropdownZIndex,
        transform: panelRect.placement === 'above' ? 'translateY(-100%)' : undefined,
      }}
      role="listbox"
    >
      <div className="modal-dropdown-list shipment-events-scroll kladr-suggest-list">
        {loading && suggestions.length === 0 ? (
          <div className="modal-dropdown-empty flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t('kladr.loading')}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="modal-dropdown-empty">{t('kladr.noResults')}</div>
        ) : suggestions.map((item, idx) => {
          const label = mode === 'region'
            ? (item.region || item.normalizedAddress || item.name)
            : item.normalizedAddress;
          const sub = mode === 'address' && item.region ? item.region : undefined;
          return (
            <button
              key={item.id}
              type="button"
              className={`modal-dropdown-option kladr-suggest-option ${idx === activeIndex ? 'is-active' : ''}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => pick(item)}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <span className="kladr-suggest-option-text">
                <span className="truncate block">{label}</span>
                {sub && <span className="kladr-suggest-option-sub truncate block">{sub}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );

  return (
    <div ref={rootRef} className={`kladr-suggest ${className}`}>
      <div className="kladr-suggest-input-wrap">
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          name={`${listboxId}-input`}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder || (mode === 'region' ? t('kladr.regionPlaceholder') : t('kladr.addressPlaceholder'))}
          className={inputClassName}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length) setOpen(true);
          }}
          onKeyDown={onInputKeyDown}
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="kladr-suggest-icon kladr-suggest-spinner animate-spin" />
        ) : (
          <MapPin className="kladr-suggest-icon" />
        )}
      </div>
      {panel}
    </div>
  );
};
