import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Search, Truck, X } from 'lucide-react';
import type { Factory, SupplyLink } from '../../types';
import { useI18n } from '../../i18n';
import { buildMapSearchSuggestions, type MapSearchSuggestion } from '../../utils/mapSearchSuggestions';

interface MapSearchBoxProps {
  viewMode: 'sites' | 'shipments';
  query: string;
  onQueryChange: (query: string) => void;
  factories: Factory[];
  supplyLinks: SupplyLink[];
  factoryMap: Map<string, Factory>;
  onSelectFactory: (factory: Factory) => void;
  onSelectShipment: (shipment: SupplyLink) => void;
  autoFocus?: boolean;
  className?: string;
}

export function MapSearchBox({
  viewMode,
  query,
  onQueryChange,
  factories,
  supplyLinks,
  factoryMap,
  onSelectFactory,
  onSelectShipment,
  autoFocus = false,
  className = '',
}: MapSearchBoxProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(
    () => buildMapSearchSuggestions(query, viewMode, factories, supplyLinks, factoryMap),
    [query, viewMode, factories, supplyLinks, factoryMap],
  );

  const showDropdown = open && query.trim().length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, suggestions.length]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [autoFocus]);

  const pickSuggestion = useCallback((item: MapSearchSuggestion) => {
    if (item.type === 'factory') {
      onSelectFactory(item.factory);
      onQueryChange(item.factory.name);
    } else {
      onSelectShipment(item.shipment);
      onQueryChange(item.label);
    }
    setOpen(false);
  }, [onQueryChange, onSelectFactory, onSelectShipment]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`map-search-box pointer-events-auto relative w-full ${className}`.trim()}>
      <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 shadow-xl text-white w-full">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          placeholder={viewMode === 'sites' ? t('map.searchSitesPlaceholder') : t('map.searchShipmentsPlaceholder')}
          value={query}
          onChange={e => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              setOpen(false);
            }}
            className="text-slate-400 hover:text-white shrink-0"
            aria-label={t('mapFilter.reset')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          className="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/98 backdrop-blur-md shadow-xl py-1 scrollbar-thin"
          role="listbox"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500">{t('map.searchNoResults')}</li>
          ) : (
            suggestions.map((item, idx) => (
              <li key={`${item.type}-${item.id}`} role="option" aria-selected={idx === activeIndex}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pickSuggestion(item)}
                  className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors ${
                    idx === activeIndex ? 'bg-indigo-600/20' : 'hover:bg-slate-800'
                  }`}
                >
                  {item.type === 'factory' ? (
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs text-white truncate">{item.label}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{item.sublabel}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
