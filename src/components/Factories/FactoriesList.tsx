import React, { useState, useMemo } from 'react';
import { Factory, SupplyLink, FactoryType, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { Building2, Search, Plus, MapPin, ArrowUpRight, ShieldCheck, Pencil, LayoutGrid, ListTree } from 'lucide-react';
import { KladrAddressInput } from '../UI/KladrAddressInput';
import { SearchableSelect } from '../UI/SearchableSelect';
import { ApiService } from '../../services/api';
import type { KladrSuggestion } from '../../types';
import { FactoryRegionTreeView, type FactoryRegionLayout } from './FactoryRegionTreeView';
import { FactoriesSchematicMap } from './FactoriesSchematicMap';
import { SiteDirectoryFormModal } from '../SiteDirectory/SiteDirectoryFormModal';
import { buildFactoryRegionTree, type FactorySortKey } from '../../utils/factoryRegionTree';

type FactoriesViewMode = 'schematic' | 'list';

const REGION_LAYOUT_KEY = 'bars-factories-region-layout';

function readStoredRegionLayout(): FactoryRegionLayout {
  try {
    const v = localStorage.getItem(REGION_LAYOUT_KEY);
    if (v === 'list' || v === 'tiles') return v;
  } catch { /* ignore */ }
  return 'tiles';
}
interface FactoriesListProps {
  factories: Factory[];
  supplyLinks: SupplyLink[];
  onSelectFactory: (factory: Factory) => void;
  onAddFactory: (factory: Factory) => void;
  currentUserRole: UserRole;
  canEdit?: boolean;
  onSitesChanged?: () => Promise<void>;
}

const typeBadgeStyles: Record<FactoryType, { color: string; badgeBg: string }> = {
  gok: { color: '#f59e0b', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  port: { color: '#3b82f6', badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  steel_mill: { color: '#ef4444', badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30' },
  slag_dump: { color: '#6b7280', badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  coal_mine: { color: '#8b5cf6', badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
};

export const FactoriesList: React.FC<FactoriesListProps> = ({
  factories,
  supplyLinks,
  onSelectFactory,
  onAddFactory,
  currentUserRole,
  canEdit = false,
  onSitesChanged,
}) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<FactoriesViewMode>('schematic');
  const [regionLayout, setRegionLayout] = useState<FactoryRegionLayout>(readStoredRegionLayout);
  const [selectedSchematicRegionKey, setSelectedSchematicRegionKey] = useState<string | null>(null);
  const [editingSite, setEditingSite] = useState<Factory | null>(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedOwnership] = useState<string>('all');
  const [sortBy, setSortBy] = useState<FactorySortKey>('name_asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  const [newFacName, setNewFacName] = useState('');
  const [newFacType, setNewFacType] = useState<FactoryType>('gok');
  const [newFacLat, setNewFacLat] = useState('55.16');
  const [newFacLng, setNewFacLng] = useState('61.40');
  const [newFacRegion, setNewFacRegion] = useState('');
  const [newFacCountry, setNewFacCountry] = useState('');
  const [newFacAddress, setNewFacAddress] = useState('');
  const [newFacKladrId, setNewFacKladrId] = useState('');
  const [newFacIsOurs, setNewFacIsOurs] = useState(false);
  const [newFacHolding, setNewFacHolding] = useState('');
  const [newFacDesc, setNewFacDesc] = useState('');

  React.useEffect(() => {
    setNewFacRegion(t('factories.defaultRegion'));
    setNewFacCountry(t('common.countryRf'));
  }, [t]);

  const typeLabels = useMemo(() => ({
    gok: t('factoryType.gok'),
    port: t('factoryType.port'),
    steel_mill: t('factoryType.steel_mill_short'),
    slag_dump: t('factoryType.slag_dump'),
    coal_mine: t('factoryType.coal_mine')
  }), [t]);

  const typeFilterOptions = useMemo(() => ([
    { value: 'all', label: t('factoryFilter.allTypes') },
    { value: 'gok', label: t('factoryFilter.gok') },
    { value: 'port', label: t('factoryFilter.port') },
    { value: 'steel_mill', label: t('factoryFilter.steel_mill') },
    { value: 'slag_dump', label: t('factoryFilter.slag_dump') },
    { value: 'coal_mine', label: t('factoryFilter.coal_mine') },
  ]), [t]);

  const countriesList = useMemo(() => Array.from(new Set(factories.map(f => f.country))).sort(), [factories]);

  const countryFilterOptions = useMemo(() => ([
    { value: 'all', label: t('factoryFilter.allCountries') },
    ...countriesList.map(country => ({ value: country, label: country })),
  ]), [countriesList, t]);

  const sortOptions = useMemo(() => ([
    { value: 'name_asc', label: t('factories.sortNameAsc') },
    { value: 'name_desc', label: t('factories.sortNameDesc') },
  ]), [t]);

  const modalTypeOptions = useMemo(() => ([
    { value: 'gok', label: t('factoryType.gok') },
    { value: 'port', label: t('factoryType.port_short') },
    { value: 'steel_mill', label: t('factoryType.steel_mill_modal') },
    { value: 'slag_dump', label: t('factoryType.slag_dump') },
    { value: 'coal_mine', label: t('factoryType.coal_mine') },
  ]), [t]);

  const ownershipOptions = useMemo(() => ([
    { value: 'false', label: t('factories.thirdParty') },
    { value: 'true', label: t('factories.oursOwned') },
  ]), [t]);

  const handleRegionLayoutChange = (layout: FactoryRegionLayout) => {
    setRegionLayout(layout);
    try { localStorage.setItem(REGION_LAYOUT_KEY, layout); } catch { /* ignore */ }
  };

  const modalFieldClass = 'factory-add-modal-input';

  const filteredFactories = useMemo(() => {
    return factories.filter(f => {
      if (selectedType !== 'all' && f.type !== selectedType) return false;
      if (selectedCountry !== 'all' && f.country !== selectedCountry) return false;
      if (selectedOwnership === 'ours' && !f.is_ours) return false;
      if (selectedOwnership === 'third_party' && f.is_ours) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchRegion = f.region.toLowerCase().includes(q);
        const matchHolding = (f.holding || '').toLowerCase().includes(q);
        const matchAddress = (f.address || '').toLowerCase().includes(q);
        if (!matchName && !matchRegion && !matchHolding && !matchAddress) return false;
      }
      return true;
    });
  }, [factories, selectedType, selectedCountry, selectedOwnership, search]);

  const regionTree = useMemo(
    () => buildFactoryRegionTree(filteredFactories, {
      unknownRegion: t('factories.unknownRegion'),
      unknownSettlement: t('factories.unknownSettlement'),
    }, sortBy),
    [filteredFactories, sortBy, t],
  );

  React.useEffect(() => {
    if (!selectedSchematicRegionKey) return;
    if (!regionTree.some(r => r.key === selectedSchematicRegionKey)) {
      setSelectedSchematicRegionKey(null);
    }
  }, [regionTree, selectedSchematicRegionKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName) return;

    const newFactory: Factory = {
      id: `fac_${Date.now()}`,
      name: newFacName,
      type: newFacType,
      latitude: parseFloat(newFacLat) || 55.0,
      longitude: parseFloat(newFacLng) || 60.0,
      region: newFacRegion,
      country: newFacCountry,
      address: newFacAddress.trim() || undefined,
      kladr_id: newFacKladrId.trim() || undefined,
      is_ours: newFacIsOurs,
      holding: newFacHolding,
      description: newFacDesc
    };

    setAddSaving(true);
    setAddError('');
    try {
      await onAddFactory(newFactory);
      setShowAddModal(false);
      setNewFacName('');
      setNewFacAddress('');
      setNewFacKladrId('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : t('admin.users.saveFailed'));
    } finally {
      setAddSaving(false);
    }
  };

  const applyKladrAddress = async (item: KladrSuggestion) => {
    setNewFacAddress(item.normalizedAddress);
    setNewFacKladrId(item.id);
    if (item.region) setNewFacRegion(item.region);
    try {
      const geo = await ApiService.geocodeAddress(item.normalizedAddress, item.region);
      setNewFacLat(String(geo.latitude));
      setNewFacLng(String(geo.longitude));
      if (geo.kladr_id) setNewFacKladrId(geo.kladr_id);
    } catch {
      /* keep KLADR fields */
    }
  };

  const renderFactoryCard = (factory: Factory) => {
    const badge = typeBadgeStyles[factory.type] || typeBadgeStyles.gok;
    const routeCount = supplyLinks.filter(l => l.origin_id === factory.id || l.destination_id === factory.id).length;

    return (
      <article
        key={factory.id}
        onClick={() => onSelectFactory(factory)}
        className="factories-card"
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectFactory(factory);
          }
        }}
      >
        <div className="factories-card-body">
          <div className="factories-card-top">
            <div className="factories-card-title-row">
              <span className="factories-card-dot" style={{ backgroundColor: badge.color }} aria-hidden />
              <h3 className="factories-card-name">{factory.name}</h3>
            </div>
            {factory.is_ours && (
              <span className="factories-card-ours">
                <ShieldCheck aria-hidden /> {t('common.ours')}
              </span>
            )}
          </div>

          <div className="factories-card-meta-row">
            <span className={`factories-card-type ${badge.badgeBg}`}>
              {typeLabels[factory.type]}
            </span>
            <span className="factories-card-region">
              {factory.region}, {factory.country}
            </span>
          </div>

          {factory.holding && (
            <div className="factories-card-holding">
              {t('factories.holdingLabel', { name: factory.holding })}
            </div>
          )}

          {factory.description && (
            <p className="factories-card-desc">{factory.description}</p>
          )}
        </div>

        <div className="factories-card-footer">
          <div className="factories-card-coords">
            <MapPin aria-hidden />
            <span>{factory.latitude.toFixed(2)}, {factory.longitude.toFixed(2)}</span>
          </div>
          <div className="factories-card-actions">
            {canEdit && onSitesChanged && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setEditingSite(factory);
                }}
                className="factories-card-edit"
                title={t('siteDirectory.admin.edit')}
              >
                <Pencil aria-hidden />
              </button>
            )}
            <div className="factories-card-routes">
              {(factory.edit_count ?? 0) > 0 && (
                <span className="factories-card-edits" title={t('factories.editCount', { count: factory.edit_count ?? 0 })}>
                  #{factory.edit_count}
                </span>
              )}
              <span>{t('factories.routesCount', { count: routeCount })}</span>
              <ArrowUpRight aria-hidden />
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="factories-page">
      <div className="factories-list-toolbar shipments-list-toolbar">
        <div className="shipments-list-toolbar-head">
          <span className="shipments-list-toolbar-icon" aria-hidden>
            <Building2 />
          </span>
          <div className="shipments-list-toolbar-text">
            <h2 className="shipments-list-title">
              <span className="truncate">
                {t('factories.title', { filtered: filteredFactories.length, total: factories.length })}
              </span>
            </h2>
            <p className="shipments-list-subtitle">{t('factories.subtitle')}</p>
          </div>
        </div>

        <div className="shipments-list-filters shipments-list-filters-grid">
          <div className="shipments-list-search">
            <Search aria-hidden />
            <input
              type="text"
              placeholder={t('factories.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="shipments-list-filter">
            <SearchableSelect
              value={selectedType}
              onChange={setSelectedType}
              options={typeFilterOptions}
              searchable={false}
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>

          <div className="shipments-list-filter">
            <SearchableSelect
              value={selectedCountry}
              onChange={setSelectedCountry}
              options={countryFilterOptions}
              searchable
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>

          <div className="shipments-list-filter">
            <SearchableSelect
              value={sortBy}
              onChange={v => setSortBy(v as FactorySortKey)}
              options={sortOptions}
              searchable={false}
              panelClassName="shipments-list-dropdown-panel"
              listClassName="shipment-events-scroll"
            />
          </div>

          {currentUserRole === 'admin' && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="factories-add-btn"
            >
              <Plus aria-hidden />
              <span>{t('factories.addButton')}</span>
            </button>
          )}
        </div>

        <div
          className="factories-view-modes"
          role="tablist"
          aria-label={t('mapFilter.viewMode')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'schematic'}
            className={`factories-view-mode-tab${viewMode === 'schematic' ? ' is-active' : ''}`}
            onClick={() => setViewMode('schematic')}
          >
            <LayoutGrid aria-hidden />
            {t('factories.viewSchematic')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            className={`factories-view-mode-tab${viewMode === 'list' ? ' is-active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <ListTree aria-hidden />
            {t('factories.viewList')}
          </button>
        </div>
      </div>

      {viewMode === 'schematic' ? (
        <FactoriesSchematicMap
          tree={regionTree}
          searchQuery={search}
          selectedRegionKey={selectedSchematicRegionKey}
          onSelectRegion={setSelectedSchematicRegionKey}
          renderFactory={renderFactoryCard}
          regionLayout={regionLayout}
          onRegionLayoutChange={handleRegionLayoutChange}
        />
      ) : (
        <FactoryRegionTreeView
          tree={regionTree}
          searchQuery={search}
          renderFactory={renderFactoryCard}
          layout={regionLayout}
          onLayoutChange={handleRegionLayoutChange}
          showLayoutToggle
        />
      )}

      {editingSite && onSitesChanged && (
        <SiteDirectoryFormModal
          mode="edit"
          site={editingSite}
          defaultType={editingSite.type}
          onClose={() => setEditingSite(null)}
          onSaved={onSitesChanged}
        />
      )}

      {showAddModal && (
        <div className="modal-backdrop">
          <form
            onSubmit={handleCreate}
            className="factory-add-modal modal-panel"
          >
            <div className="modal-panel-header factory-add-modal-header">
              <h3 className="factory-add-modal-title">
                <Building2 aria-hidden />
                <span>{t('factories.modalTitle')}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setAddError(''); }}
                className="factory-add-modal-close"
                aria-label={t('common.cancel')}
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="factory-add-modal-error">{addError}</div>
            )}

            <div className="factory-add-modal-grid">
              <div className="factory-add-modal-field factory-add-modal-field--full">
                <label>{t('factories.nameLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('factories.namePlaceholder')}
                  value={newFacName}
                  onChange={e => setNewFacName(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div className="factory-add-modal-field">
                <label>{t('factories.typeLabel')}</label>
                <div className="factory-add-modal-select map-filter-panel">
                  <SearchableSelect
                    value={newFacType}
                    onChange={v => setNewFacType(v as FactoryType)}
                    options={modalTypeOptions}
                    searchable={false}
                    className="w-full"
                    panelClassName="map-filter-dropdown-panel"
                    listClassName="map-filter-period-list"
                  />
                </div>
              </div>

              <div className="factory-add-modal-field">
                <label>{t('factories.ownershipLabel')}</label>
                <div className="factory-add-modal-select map-filter-panel">
                  <SearchableSelect
                    value={newFacIsOurs ? 'true' : 'false'}
                    onChange={v => setNewFacIsOurs(v === 'true')}
                    options={ownershipOptions}
                    searchable={false}
                    className="w-full"
                    panelClassName="map-filter-dropdown-panel"
                    listClassName="map-filter-period-list"
                  />
                </div>
              </div>

              <div className="factory-add-modal-field">
                <label>{t('factories.latitude')}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newFacLat}
                  onChange={e => setNewFacLat(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div className="factory-add-modal-field">
                <label>{t('factories.longitude')}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newFacLng}
                  onChange={e => setNewFacLng(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div className="factory-add-modal-field">
                <label>{t('factories.region')}</label>
                <KladrAddressInput
                  mode="region"
                  value={newFacRegion}
                  onChange={setNewFacRegion}
                  onSelect={item => setNewFacRegion(item.region || item.name)}
                  inputClassName={modalFieldClass}
                />
              </div>

              <div className="factory-add-modal-field">
                <label>{t('factories.country')}</label>
                <input
                  type="text"
                  value={newFacCountry}
                  onChange={e => setNewFacCountry(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div className="factory-add-modal-field factory-add-modal-field--full">
                <label>{t('siteDirectory.admin.colAddress')}</label>
                <KladrAddressInput
                  value={newFacAddress}
                  onChange={setNewFacAddress}
                  onSelect={applyKladrAddress}
                  inputClassName={modalFieldClass}
                />
              </div>

              <div className="factory-add-modal-field factory-add-modal-field--full">
                <label>{t('factories.holdingField')}</label>
                <input
                  type="text"
                  placeholder={t('factories.holdingPlaceholder')}
                  value={newFacHolding}
                  onChange={e => setNewFacHolding(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div className="factory-add-modal-field factory-add-modal-field--full">
                <label>{t('factories.description')}</label>
                <textarea
                  rows={2}
                  placeholder={t('factories.descriptionPlaceholder')}
                  value={newFacDesc}
                  onChange={e => setNewFacDesc(e.target.value)}
                  className={`${modalFieldClass} factory-add-modal-textarea`}
                />
              </div>
            </div>

            <div className="modal-panel-footer factory-add-modal-footer">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setAddError(''); }}
                className="factory-add-modal-cancel"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={addSaving}
                className="factory-add-modal-submit"
              >
                {addSaving ? t('admin.users.saving') : t('factories.save')}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
