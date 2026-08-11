import React, { useMemo, useState } from 'react';
import { BookOpen, Search, MapPin, Eye, Building2, Pencil } from 'lucide-react';
import type { Factory, FactoryType } from '../../types';
import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n/types';
import { SITE_CATEGORIES, getSiteCategoryLabel } from '../../constants/siteCategories';
import { SearchableSelect } from '../UI/SearchableSelect';
import { VirtualList } from '../UI/VirtualList';
import { SiteDirectoryFormModal } from './SiteDirectoryFormModal';
import { HorizontalScrollChips } from '../UI/HorizontalScrollChips';

interface SiteDirectoryPageProps {
  factories: Factory[];
  onViewDetails: (factory: Factory) => void;
  onShowOnMap: (factory: Factory) => void;
  canEdit?: boolean;
  onSitesChanged?: () => Promise<void>;
}

type ContourFilter = 'all' | 'inner' | 'outer';

const typeBadgeStyles: Record<FactoryType, string> = {
  gok: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  port: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  steel_mill: 'bg-red-500/10 text-red-400 border-red-500/30',
  slag_dump: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  coal_mine: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

interface SiteActionsProps {
  site: Factory;
  canEdit: boolean;
  variant: 'table' | 'card';
  t: (key: string) => string;
  onEdit: (site: Factory) => void;
  onShowOnMap: (site: Factory) => void;
  onViewDetails: (site: Factory) => void;
}

const SiteActions: React.FC<SiteActionsProps> = ({
  site,
  canEdit,
  variant,
  t,
  onEdit,
  onShowOnMap,
  onViewDetails,
}) => {
  if (variant === 'card') {
    return (
      <div className="site-directory-card-actions">
        <button
          type="button"
          onClick={() => onViewDetails(site)}
          className="site-directory-card-action site-directory-card-action--details"
        >
          <Eye className="w-4 h-4 shrink-0" />
          {t('siteDirectory.viewDetails')}
        </button>
        <button
          type="button"
          onClick={() => onShowOnMap(site)}
          className="site-directory-card-action site-directory-card-action--map"
        >
          <MapPin className="w-4 h-4 shrink-0 text-indigo-400" />
          {t('siteDirectory.showOnMap')}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(site)}
            className="site-directory-card-action site-directory-card-action--edit"
          >
            <Pencil className="w-4 h-4 shrink-0" />
            {t('siteDirectory.admin.edit')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit(site)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white text-[11px] font-semibold border border-amber-500/30"
          title={t('siteDirectory.admin.edit')}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('siteDirectory.admin.edit')}</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => onShowOnMap(site)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-[11px] font-semibold"
        title={t('siteDirectory.showOnMap')}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('siteDirectory.showOnMap')}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewDetails(site)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-semibold border border-slate-700"
        title={t('siteDirectory.viewDetails')}
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('siteDirectory.viewDetails')}</span>
      </button>
    </div>
  );
};

interface SiteCardProps {
  site: Factory;
  locale: Locale;
  canEdit: boolean;
  t: (key: string) => string;
  onEdit: (site: Factory) => void;
  onShowOnMap: (site: Factory) => void;
  onViewDetails: (site: Factory) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({
  site,
  locale,
  canEdit,
  t,
  onEdit,
  onShowOnMap,
  onViewDetails,
}) => (
  <article
    className="site-directory-card"
    onClick={() => onViewDetails(site)}
    role="button"
    tabIndex={0}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onViewDetails(site);
      }
    }}
  >
    <div className="site-directory-card-header">
      <span className="site-directory-card-id">{site.id}</span>
      <span
        className={`site-directory-card-contour ${
          site.is_ours ? 'site-directory-card-contour--inner' : 'site-directory-card-contour--outer'
        }`}
      >
        {site.is_ours ? t('siteDirectory.contourInner') : t('siteDirectory.contourOuter')}
      </span>
    </div>

    <div className="site-directory-card-name">
      <Building2 className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
      <span className="truncate">{site.name}</span>
      {site.is_ours && (
        <span className="site-directory-card-ours">{t('common.ours')}</span>
      )}
    </div>

    {site.holding && (
      <div className="site-directory-card-holding">{site.holding}</div>
    )}

    <div className="site-directory-card-meta">
      <span className={`site-directory-card-category ${typeBadgeStyles[site.type]}`}>
        {getSiteCategoryLabel(site.type, locale)}
      </span>
      {(site.region || site.country) && (
        <span className="site-directory-card-region">
          {[site.region, site.country].filter(Boolean).join(', ')}
        </span>
      )}
    </div>

    <div onClick={e => e.stopPropagation()}>
      <SiteActions
        site={site}
        canEdit={canEdit}
        variant="card"
        t={t}
        onEdit={onEdit}
        onShowOnMap={onShowOnMap}
        onViewDetails={onViewDetails}
      />
    </div>
  </article>
);

export const SiteDirectoryPage: React.FC<SiteDirectoryPageProps> = ({
  factories,
  onViewDetails,
  onShowOnMap,
  canEdit = false,
  onSitesChanged,
}) => {
  const { t, locale } = useI18n();
  const [activeContour, setActiveContour] = useState<ContourFilter>('all');
  const [activeCategory, setActiveCategory] = useState<FactoryType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [editingSite, setEditingSite] = useState<Factory | null>(null);

  const innerCount = useMemo(() => factories.filter(f => f.is_ours).length, [factories]);
  const outerCount = useMemo(() => factories.filter(f => !f.is_ours).length, [factories]);

  const contourScoped = useMemo(() => {
    if (activeContour === 'inner') return factories.filter(f => f.is_ours);
    if (activeContour === 'outer') return factories.filter(f => !f.is_ours);
    return factories;
  }, [factories, activeContour]);

  const countries = useMemo(
    () => Array.from(new Set(contourScoped.map(f => f.country).filter(Boolean))).sort(),
    [contourScoped],
  );

  const countryFilterOptions = useMemo(
    () => [
      { value: 'all', label: t('factoryFilter.allCountries') },
      ...countries.map(c => ({ value: c, label: c })),
    ],
    [countries, t],
  );

  const countsByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of contourScoped) map[f.type] = (map[f.type] || 0) + 1;
    return map;
  }, [contourScoped]);

  const filtered = useMemo(() => {
    return contourScoped.filter(f => {
      if (activeCategory !== 'all' && f.type !== activeCategory) return false;
      if (country !== 'all' && f.country !== country) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [f.id, f.name, f.region, f.holding, f.code, f.address, f.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contourScoped, activeCategory, country, search]);

  const innerFiltered = useMemo(() => filtered.filter(f => f.is_ours), [filtered]);
  const outerFiltered = useMemo(() => filtered.filter(f => !f.is_ours), [filtered]);

  const handleEdit = (site: Factory) => setEditingSite(site);

  const cardProps = {
    locale,
    canEdit,
    t,
    onEdit: handleEdit,
    onShowOnMap,
    onViewDetails,
  };

  const renderSiteVirtualRow = (site: Factory) => (
    <div className="site-directory-table-virtual-row border-t border-slate-800 hover:bg-slate-800/50 transition-colors grid text-sm" role="row">
      <div className="p-3 font-mono text-[11px] text-indigo-300 whitespace-nowrap" role="cell">{site.id}</div>
      <div className="p-3" role="cell">
        <div className="font-medium text-white flex items-center gap-2 flex-wrap">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {site.name}
        </div>
      </div>
      <div className="p-3 hidden md:block" role="cell">
        <span className={`text-[10px] px-2 py-0.5 rounded border ${typeBadgeStyles[site.type]}`}>
          {getSiteCategoryLabel(site.type, locale)}
        </span>
      </div>
      <div className="p-3 hidden lg:block" role="cell">
        <span className={`text-[10px] px-2 py-0.5 rounded border ${
          site.is_ours
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          {site.is_ours ? t('siteDirectory.contourInner') : t('siteDirectory.contourOuter')}
        </span>
      </div>
      <div className="p-3 hidden xl:block text-slate-400 text-xs" role="cell">
        {site.region}{site.country ? `, ${site.country}` : ''}
      </div>
      <div className="p-3 text-right" role="cell">
        <SiteActions
          site={site}
          canEdit={canEdit}
          variant="table"
          t={t}
          onEdit={handleEdit}
          onShowOnMap={onShowOnMap}
          onViewDetails={onViewDetails}
        />
      </div>
    </div>
  );

  return (
    <div className="site-directory-page p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-950 min-h-full text-slate-100">
      <div className="site-directory-toolbar shipments-list-toolbar bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="truncate">{t('siteDirectory.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t('siteDirectory.subtitle')}</p>
        </div>

        <div className="site-directory-filter-block space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('mapFilter.contours')}
          </div>
          <HorizontalScrollChips>
            <button
              type="button"
              onClick={() => setActiveContour('all')}
              className={`site-directory-chip px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeContour === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {t('siteDirectory.allContours')} ({factories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveContour('inner')}
              className={`site-directory-chip px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeContour === 'inner'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:opacity-90'
              }`}
            >
              {t('siteDirectory.contourInner')} ({innerCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveContour('outer')}
              className={`site-directory-chip px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeContour === 'outer'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:opacity-90'
              }`}
            >
              {t('siteDirectory.contourOuter')} ({outerCount})
            </button>
          </HorizontalScrollChips>
        </div>

        <div className="site-directory-filter-block space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('siteDirectory.colCategory')}
          </div>
          <HorizontalScrollChips>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`site-directory-chip px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {t('siteDirectory.allCategories')} ({contourScoped.length})
            </button>
            {SITE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`site-directory-chip px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : `${typeBadgeStyles[cat.id]} hover:opacity-90`
                }`}
              >
                {getSiteCategoryLabel(cat.id, locale)} ({countsByType[cat.id] || 0})
              </button>
            ))}
          </HorizontalScrollChips>
        </div>

        <div className="site-directory-filters-grid shipments-list-filters-grid">
          <div className="site-directory-search shipments-list-search flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('siteDirectory.searchPlaceholder')}
              className="bg-transparent text-sm text-white w-full min-w-0 outline-none placeholder-slate-500"
            />
          </div>
          <div className="site-directory-country-filter shipments-list-filter">
            <SearchableSelect
              value={country}
              onChange={setCountry}
              options={countryFilterOptions}
              searchable={countries.length > 6}
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>
        </div>
      </div>

      <div className="site-directory-results-bar text-xs text-slate-400 px-1">
        {t('siteDirectory.results', { count: filtered.length })}
      </div>

      <div className="site-directory-cards-mobile">
        {filtered.length === 0 ? (
          <div className="site-directory-empty">{t('siteDirectory.empty')}</div>
        ) : (
          <VirtualList
            items={filtered}
            estimateSize={140}
            className="site-directory-virtual-list-mobile"
            aria-label={t('siteDirectory.title')}
            getKey={(site) => site.id}
            renderItem={(site) => <SiteCard site={site} {...cardProps} />}
          />
        )}
      </div>

      <div className="site-directory-table-desktop bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400">
          {t('siteDirectory.results', { count: filtered.length })}
        </div>
        <div className="overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">{t('siteDirectory.colId')}</th>
                <th className="text-left p-3">{t('siteDirectory.colName')}</th>
                <th className="text-left p-3 hidden md:table-cell">{t('siteDirectory.colCategory')}</th>
                <th className="text-left p-3 hidden lg:table-cell">{t('siteDirectory.colContour')}</th>
                <th className="text-left p-3 hidden xl:table-cell">{t('siteDirectory.colRegion')}</th>
                <th className="text-right p-3">{t('siteDirectory.colActions')}</th>
              </tr>
            </thead>
          </table>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">{t('siteDirectory.empty')}</div>
          ) : (
            <VirtualList
              items={filtered}
              estimateSize={56}
              className="site-directory-virtual-list-desktop"
              aria-label={t('siteDirectory.title')}
              getKey={(site) => site.id}
              renderItem={(site) => renderSiteVirtualRow(site)}
            />
          )}
        </div>
      </div>

      {editingSite && onSitesChanged && (
        <SiteDirectoryFormModal
          mode="edit"
          site={editingSite}
          defaultType={editingSite.type}
          onClose={() => setEditingSite(null)}
          onSaved={onSitesChanged}
        />
      )}
    </div>
  );
};
