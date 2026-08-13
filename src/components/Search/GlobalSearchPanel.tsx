import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2, Container, LayoutGrid, MapPin, Package, Search, Truck, UserCircle, X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import {
  buildGlobalSearchResults,
  groupGlobalSearchResults,
  type GlobalSearchNavItem,
  type GlobalSearchResult,
} from '../../utils/globalSearch';
import type {
  Factory,
  KanbanBoard,
  Product,
  SalesManager,
  SupplyLink,
  ThirdPartyCarrier,
  TransportAsset,
  User,
} from '../../types';

export interface GlobalSearchPanelProps {
  open: boolean;
  onClose: () => void;
  user: User;
  navItems: GlobalSearchNavItem[];
  factories: Factory[];
  supplyLinks: SupplyLink[];
  products: Product[];
  transportAssets?: TransportAsset[];
  carriers: ThirdPartyCarrier[];
  salesManagers: SalesManager[];
  onSelectTab: (tab: string) => void;
  onSelectFactory: (factory: Factory) => void;
  onSelectShipment: (shipment: SupplyLink) => void;
  onSelectBoard: (boardId: string) => void;
}

const GROUP_LABEL_KEYS: Record<GlobalSearchResult['type'], string> = {
  nav: 'globalSearch.groupNav',
  factory: 'globalSearch.groupFactories',
  shipment: 'globalSearch.groupShipments',
  product: 'globalSearch.groupProducts',
  transport: 'globalSearch.groupTransport',
  carrier: 'globalSearch.groupCarriers',
  manager: 'globalSearch.groupManagers',
  board: 'globalSearch.groupBoards',
};

function ResultIcon({ type }: { type: GlobalSearchResult['type'] }) {
  const iconClass = `global-search-result-icon global-search-result-icon--${type}`;
  switch (type) {
    case 'nav':
      return <MapPin className={iconClass} aria-hidden />;
    case 'factory':
      return <Building2 className={iconClass} aria-hidden />;
    case 'shipment':
      return <Truck className={iconClass} aria-hidden />;
    case 'product':
      return <Package className={iconClass} aria-hidden />;
    case 'transport':
      return <Truck className={iconClass} aria-hidden />;
    case 'carrier':
      return <Container className={iconClass} aria-hidden />;
    case 'manager':
      return <UserCircle className={iconClass} aria-hidden />;
    case 'board':
      return <LayoutGrid className={iconClass} aria-hidden />;
    default:
      return null;
  }
}

export const GlobalSearchPanel: React.FC<GlobalSearchPanelProps> = ({
  open,
  onClose,
  user,
  navItems,
  factories,
  supplyLinks,
  products,
  transportAssets = [],
  carriers,
  salesManagers,
  onSelectTab,
  onSelectFactory,
  onSelectShipment,
  onSelectBoard,
}) => {
  const { t, locale } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(-1);
    void ApiService.getKanbanBoards()
      .then(data => setBoards(data.boards))
      .catch(() => setBoards([]));
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const flatResults = useMemo(
    () => buildGlobalSearchResults(query, {
      user,
      factories,
      supplyLinks,
      products,
      transportAssets,
      carriers,
      salesManagers,
      boards,
      navItems,
      locale,
    }),
    [query, user, factories, supplyLinks, products, transportAssets, carriers, salesManagers, boards, navItems, locale],
  );

  const grouped = useMemo(() => groupGlobalSearchResults(flatResults), [flatResults]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, flatResults.length]);

  const pickResult = useCallback((item: GlobalSearchResult) => {
    switch (item.type) {
      case 'nav':
        if (item.tab) onSelectTab(item.tab);
        break;
      case 'factory':
        if (item.factory) onSelectFactory(item.factory);
        break;
      case 'shipment':
        if (item.shipment) onSelectShipment(item.shipment);
        break;
      case 'product':
      case 'carrier':
      case 'manager':
        if (item.tab) onSelectTab(item.tab);
        break;
      case 'board':
        if (item.boardId) onSelectBoard(item.boardId);
        break;
      default:
        break;
    }
    onClose();
  }, [onClose, onSelectBoard, onSelectFactory, onSelectShipment, onSelectTab]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? flatResults.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      pickResult(flatResults[activeIndex]);
    }
  };

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div className="global-search-root" role="presentation">
      <button type="button" className="global-search-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div
        className="global-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('globalSearch.title')}
      >
        <div className="global-search-input-wrap">
          <Search className="global-search-input-icon" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t('globalSearch.placeholder')}
            className="global-search-input"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="global-search-close" onClick={onClose} aria-label={t('common.close')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="global-search-results scroll-area">
          {query.trim().length === 0 ? (
            <p className="global-search-hint">{t('globalSearch.hint')}</p>
          ) : flatResults.length === 0 ? (
            <p className="global-search-empty">{t('globalSearch.noResults')}</p>
          ) : (
            grouped.map(group => (
              <section key={group.type} className="global-search-group">
                <h3 className="global-search-group-title">{t(GROUP_LABEL_KEYS[group.type])}</h3>
                <ul className="global-search-group-list">
                  {group.items.map(item => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          className={`global-search-item${idx === activeIndex ? ' is-active' : ''}`}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => pickResult(item)}
                        >
                          <ResultIcon type={item.type} />
                          <span className="min-w-0 text-left">
                            <span className="global-search-item-label">{item.label}</span>
                            {item.sublabel ? (
                              <span className="global-search-item-sublabel">{item.sublabel}</span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
