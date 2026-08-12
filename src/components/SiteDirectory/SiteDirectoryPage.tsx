import React, { useMemo, useState } from 'react';
import { BookOpen, Search, MapPin, Eye, Building2, Pencil } from 'lucide-react';
import type { Factory, FactoryType, TransportAsset } from '../../types';
import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n/types';
import { SITE_CATEGORIES, getSiteCategoryLabel } from '../../constants/siteCategories';
import { SearchableSelect } from '../UI/SearchableSelect';
import { VirtualList } from '../UI/VirtualList';
import { SiteDirectoryFormModal } from './SiteDirectoryFormModal';
import { HorizontalScrollChips } from '../UI/HorizontalScrollChips';

interface SiteDirectoryPageProps {
  factories: Factory[];
  transportAssets?: TransportAsset[];
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
          <Eye aria-hidden />
          {t('siteDirectory.viewDetails')}
        </button>
        <button
          type="button"
          onClick={() => onShowOnMap(site)}
          className="site-directory-card-action site-directory-card-action--map"
        >
          <MapPin aria-hidden />
          {t('siteDirectory.showOnMap')}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(site)}
            className="site-directory-card-action site-directory-card-action--edit"
          >
            <Pencil aria-hidden />
            {t('siteDirectory.admin.edit')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="site-directory-row-actions">
      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit(site)}
          className="site-directory-row-icon-btn site-directory-row-icon-btn--edit"
          title={t('siteDirectory.admin.edit')}
          aria-label={t('siteDirectory.admin.edit')}
        >
          <Pencil aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={() => onShowOnMap(site)}
        className="site-directory-row-icon-btn site-directory-row-icon-btn--map"
        title={t('siteDirectory.showOnMap')}
        aria-label={t('siteDirectory.showOnMap')}
      >
        <MapPin aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onViewDetails(site)}
        className="site-directory-row-icon-btn site-directory-row-icon-btn--details"
        title={t('siteDirectory.viewDetails')}
        aria-label={t('siteDirectory.viewDetails')}
      >
        <Eye aria-hidden />
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
      <Building2 className="site-directory-card-name-icon" aria-hidden />
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
  transportAssets = [],
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
    <div className="site-directory-table-virtual-row" role="row">
      <div className="site-directory-cell site-directory-cell-id" role="cell">{site.id}</div>
      <div className="site-directory-cell site-directory-cell-name" role="cell">
        <Building2 aria-hidden />
        <span>{site.name}</span>
      </div>
      <div className="site-directory-cell site-directory-cell-category" role="cell">
        <span className={`site-directory-type-badge ${typeBadgeStyles[site.type]}`}>
          {getSiteCategoryLabel(site.type, locale)}
        </span>
      </div>
      <div className="site-directory-cell site-directory-cell-contour" role="cell">
        <span
          className={`site-directory-contour-badge ${
            site.is_ours ? 'site-directory-contour-badge--inner' : 'site-directory-contour-badge--outer'
          }`}
        >
          {site.is_ours ? t('siteDirectory.contourInner') : t('siteDirectory.contourOuter')}
        </span>
      </div>
      <div className="site-directory-cell site-directory-cell-region" role="cell">
        {site.region}{site.country ? `, ${site.country}` : ''}
      </div>
      <div className="site-directory-cell site-directory-cell-actions" role="cell">
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
    <div className="site-directory-page">
      <div className="site-directory-toolbar shipments-list-toolbar">
        <div className="shipments-list-toolbar-head">
          <span className="shipments-list-toolbar-icon" aria-hidden>
            <BookOpen />
          </span>
          <div className="shipments-list-toolbar-text">
            <h2 className="shipments-list-title">
              <span className="truncate">{t('siteDirectory.title')}</span>
            </h2>
            <p className="shipments-list-subtitle">{t('siteDirectory.subtitle')}</p>
          </div>
        </div>

        <div className="site-directory-filter-block">
          <div className="site-directory-filter-label">{t('mapFilter.contours')}</div>
          <HorizontalScrollChips>
            <button
              type="button"
              onClick={() => setActiveContour('all')}
              className={`site-directory-chip${activeContour === 'all' ? ' is-active' : ''}`}
            >
              {t('siteDirectory.allContours')}
              <span>{factories.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveContour('inner')}
              className={`site-directory-chip site-directory-chip--inner${activeContour === 'inner' ? ' is-active' : ''}`}
            >
              {t('siteDirectory.contourInner')}
              <span>{innerCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveContour('outer')}
              className={`site-directory-chip site-directory-chip--outer${activeContour === 'outer' ? ' is-active' : ''}`}
            >
              {t('siteDirectory.contourOuter')}
              <span>{outerCount}</span>
            </button>
          </HorizontalScrollChips>
        </div>

        <div className="site-directory-filter-block">
          <div className="site-directory-filter-label">{t('siteDirectory.colCategory')}</div>
          <HorizontalScrollChips>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`site-directory-chip${activeCategory === 'all' ? ' is-active' : ''}`}
            >
              {t('siteDirectory.allCategories')}
              <span>{contourScoped.length}</span>
            </button>
            {SITE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`site-directory-chip site-directory-chip--type${activeCategory === cat.id ? ' is-active' : ''} ${typeBadgeStyles[cat.id]}`}
              >
                {getSiteCategoryLabel(cat.id, locale)}
                <span>{countsByType[cat.id] || 0}</span>
              </button>
            ))}
          </HorizontalScrollChips>
        </div>

        <div className="site-directory-filters-grid shipments-list-filters-grid">
          <div className="site-directory-search shipments-list-search">
            <Search aria-hidden />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('siteDirectory.searchPlaceholder')}
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

      <div className="site-directory-results-bar">
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

      <div className="site-directory-table-desktop">
        <div className="site-directory-table-head-bar">
          {t('siteDirectory.results', { count: filtered.length })}
        </div>
        <div className="site-directory-table-scroll">
          <div className="site-directory-table-header site-directory-table-virtual-row" role="row">
            <div className="site-directory-cell site-directory-cell-id" role="columnheader">
              {t('siteDirectory.colId')}
            </div>
            <div className="site-directory-cell site-directory-cell-name" role="columnheader">
              {t('siteDirectory.colName')}
            </div>
            <div className="site-directory-cell site-directory-cell-category" role="columnheader">
              {t('siteDirectory.colCategory')}
            </div>
            <div className="site-directory-cell site-directory-cell-contour" role="columnheader">
              {t('siteDirectory.colContour')}
            </div>
            <div className="site-directory-cell site-directory-cell-region" role="columnheader">
              {t('siteDirectory.colRegion')}
            </div>
            <div className="site-directory-cell site-directory-cell-actions" role="columnheader">
              {t('siteDirectory.colActions')}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="site-directory-empty site-directory-empty--table">{t('siteDirectory.empty')}</div>
          ) : (
            <VirtualList
              items={filtered}
              estimateSize={48}
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
          transportAssets={transportAssets.filter(
            a => a.site_id === editingSite.id && a.is_active !== false,
          )}
          onClose={() => setEditingSite(null)}
          onSaved={onSitesChanged}
        />
      )}
    </div>
  );
};
