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

  const modalFieldClass = 'factory-add-modal-input w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20';

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
      <div
        key={factory.id}
        onClick={() => onSelectFactory(factory)}
        className="factories-card bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-lg transition-all hover:scale-[1.01] cursor-pointer relative group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: badge.color }} />
              <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                {factory.name}
              </h3>
            </div>
            {factory.is_ours && (
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" /> {t('common.ours')}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-lg border font-semibold text-[11px] ${badge.badgeBg}`}>
              {typeLabels[factory.type]}
            </span>
            <span className="text-slate-400 font-medium">
              {factory.region}, {factory.country}
            </span>
          </div>

          {factory.holding && (
            <div className="mt-2 text-xs text-slate-300">
              {t('factories.holdingLabel', { name: factory.holding })}
            </div>
          )}

          {factory.description && (
            <p className="mt-2 text-xs text-slate-400 line-clamp-2 italic">
              {factory.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1 text-[11px] min-w-0">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{factory.latitude.toFixed(2)}, {factory.longitude.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && onSitesChanged && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setEditingSite(factory);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white text-[10px] font-semibold border border-amber-500/30"
                title={t('siteDirectory.admin.edit')}
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            <div className="font-medium text-slate-300 flex items-center gap-2">
              {(factory.edit_count ?? 0) > 0 && (
                <span className="text-[10px] text-slate-500 font-mono" title={t('factories.editCount', { count: factory.edit_count ?? 0 })}>
                  #{factory.edit_count}
                </span>
              )}
              <span>{t('factories.routesCount', { count: routeCount })}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="factories-page p-4 sm:p-6 space-y-6 bg-slate-950 min-h-full text-slate-100">

      <div className="factories-list-toolbar shipments-list-toolbar flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>{t('factories.title', { filtered: filteredFactories.length, total: factories.length })}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('factories.subtitle')}
          </p>
        </div>

        <div className="shipments-list-filters flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-white w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={t('factories.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent focus:outline-none w-full placeholder-slate-500"
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
              className="factories-add-btn flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('factories.addButton')}</span>
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 p-0.5 bg-slate-950">
            <button
              type="button"
              onClick={() => setViewMode('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'schematic'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {t('factories.viewSchematic')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              {t('factories.viewList')}
            </button>
          </div>
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
            className="factory-add-modal modal-panel bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl"
          >
            <div className="modal-panel-header flex items-center justify-between border-b border-slate-800 pb-3 -mt-1">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>{t('factories.modalTitle')}</span>
              </h3>
              <button type="button" onClick={() => { setShowAddModal(false); setAddError(''); }} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">✕</button>
            </div>

            {addError && (
              <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{addError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.nameLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('factories.namePlaceholder')}
                  value={newFacName}
                  onChange={e => setNewFacName(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.typeLabel')}</label>
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.ownershipLabel')}</label>
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.latitude')}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newFacLat}
                  onChange={e => setNewFacLat(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.longitude')}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newFacLng}
                  onChange={e => setNewFacLng(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.region')}</label>
                <KladrAddressInput
                  mode="region"
                  value={newFacRegion}
                  onChange={setNewFacRegion}
                  onSelect={item => setNewFacRegion(item.region || item.name)}
                  inputClassName={modalFieldClass}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.country')}</label>
                <input
                  type="text"
                  value={newFacCountry}
                  onChange={e => setNewFacCountry(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">{t('siteDirectory.admin.colAddress')}</label>
                <KladrAddressInput
                  value={newFacAddress}
                  onChange={setNewFacAddress}
                  onSelect={applyKladrAddress}
                  inputClassName={modalFieldClass}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.holdingField')}</label>
                <input
                  type="text"
                  placeholder={t('factories.holdingPlaceholder')}
                  value={newFacHolding}
                  onChange={e => setNewFacHolding(e.target.value)}
                  className={modalFieldClass}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">{t('factories.description')}</label>
                <textarea
                  rows={2}
                  placeholder={t('factories.descriptionPlaceholder')}
                  value={newFacDesc}
                  onChange={e => setNewFacDesc(e.target.value)}
                  className={`${modalFieldClass} resize-y min-h-[4.5rem]`}
                />
              </div>
            </div>

            <div className="modal-panel-footer flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setAddError(''); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={addSaving}
                className="factory-add-modal-submit px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg"
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
