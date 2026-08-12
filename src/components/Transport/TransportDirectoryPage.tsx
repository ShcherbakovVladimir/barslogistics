import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useI18n } from '../../i18n';
import { SearchableSelect } from '../UI/SearchableSelect';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import {
  TRANSPORT_CATEGORIES,
  TRANSPORT_PURPOSES,
  TRANSPORT_TYPES,
  popularModelsForType,
  transportTypesByCategory,
  type TransportCategory,
  type TransportPurpose,
} from '../../constants/transportAssets';
import type { Factory, TransportAsset, TransportAssetInput } from '../../types';

interface TransportDirectoryPageProps {
  assets: TransportAsset[];
  factories: Factory[];
  onAssetsChanged: () => Promise<void>;
}

interface TransportModalShellProps {
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}

const TransportModalShell: React.FC<TransportModalShellProps> = ({
  onClose,
  maxWidthClass = 'max-w-3xl',
  children,
}) => {
  const {
    sheetRef,
    sheetStyle,
    isDragging,
    dragEnabled,
    onHandlePointerDown,
  } = useAppBottomSheet(onClose);

  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`transport-directory-modal app-modal-sheet modal-panel bg-slate-900 border border-slate-700 rounded-2xl w-full ${maxWidthClass} shadow-2xl text-slate-100 flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <AppBottomSheetHandle
          onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
          isDragging={isDragging}
        />
        {children}
      </div>
    </div>
  );
};

type FormState = {
  name: string;
  purpose: TransportPurpose;
  category: TransportCategory;
  type_key: string;
  brand: string;
  model: string;
  year: string;
  vehicle_number: string;
  trailer_number: string;
  container_number: string;
  vin: string;
  chassis_number: string;
  engine_number: string;
  inventory_number: string;
  waybill_number: string;
  driver_info: string;
  description: string;
  specs_note: string;
  site_id: string;
  sort_order: string;
  is_active: boolean;
};

function emptyForm(): FormState {
  return {
    name: '',
    purpose: 'both',
    category: 'road',
    type_key: 'truck',
    brand: '',
    model: '',
    year: '',
    vehicle_number: '',
    trailer_number: '',
    container_number: '',
    vin: '',
    chassis_number: '',
    engine_number: '',
    inventory_number: '',
    waybill_number: '',
    driver_info: '',
    description: '',
    specs_note: '',
    site_id: '',
    sort_order: '0',
    is_active: true,
  };
}

function assetToForm(a: TransportAsset): FormState {
  return {
    name: a.name,
    purpose: a.purpose,
    category: (a.category as TransportCategory) || 'road',
    type_key: a.type_key,
    brand: a.brand || '',
    model: a.model || '',
    year: a.year != null ? String(a.year) : '',
    vehicle_number: a.vehicle_number || '',
    trailer_number: a.trailer_number || '',
    container_number: a.container_number || '',
    vin: a.vin || '',
    chassis_number: a.chassis_number || '',
    engine_number: a.engine_number || '',
    inventory_number: a.inventory_number || '',
    waybill_number: a.waybill_number || '',
    driver_info: a.driver_info || '',
    description: a.description || '',
    specs_note: a.specs_note || '',
    site_id: a.site_id || '',
    sort_order: String(a.sort_order ?? 0),
    is_active: a.is_active !== false,
  };
}

function formToInput(form: FormState): TransportAssetInput {
  const yearNum = form.year.trim() ? Number(form.year) : null;
  return {
    name: form.name.trim(),
    purpose: form.purpose,
    category: form.category,
    type_key: form.type_key,
    brand: form.brand.trim() || undefined,
    model: form.model.trim() || undefined,
    year: yearNum != null && Number.isFinite(yearNum) ? yearNum : null,
    vehicle_number: form.vehicle_number.trim() || undefined,
    trailer_number: form.trailer_number.trim() || undefined,
    container_number: form.container_number.trim() || undefined,
    vin: form.vin.trim() || undefined,
    chassis_number: form.chassis_number.trim() || undefined,
    engine_number: form.engine_number.trim() || undefined,
    inventory_number: form.inventory_number.trim() || undefined,
    waybill_number: form.waybill_number.trim() || undefined,
    driver_info: form.driver_info.trim() || undefined,
    description: form.description.trim() || undefined,
    specs_note: form.specs_note.trim() || undefined,
    site_id: form.site_id.trim() || null,
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
  };
}

export const TransportDirectoryPage: React.FC<TransportDirectoryPageProps> = ({
  assets,
  factories,
  onAssetsChanged,
}) => {
  const { t } = useI18n();
  const photoRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState<'all' | TransportPurpose>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TransportCategory>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransportAsset | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransportAsset | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const factoryMap = useMemo(() => new Map(factories.map(f => [f.id, f])), [factories]);

  const displayList = useMemo(() => {
    const base = showInactive ? assets : assets.filter(a => a.is_active !== false);
    const q = search.trim().toLowerCase();
    return base.filter(a => {
      if (purposeFilter !== 'all' && a.purpose !== purposeFilter && a.purpose !== 'both') return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = [
        a.name,
        a.brand,
        a.model,
        a.vehicle_number,
        a.inventory_number,
        a.vin,
        a.type_key,
        a.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [assets, search, showInactive, purposeFilter, categoryFilter]);

  const typeOptions = useMemo(() => {
    const list = transportTypesByCategory(form.category);
    return list.map(tp => ({
      value: tp.key,
      label: t(`transport.types.${tp.key}`),
    }));
  }, [form.category, t]);

  const popularOptions = useMemo(() => {
    return popularModelsForType(form.type_key).map((m) => ({
      value: `${m.brand}|||${m.model}`,
      label: m.model ? `${m.brand} ${m.model}` : m.brand,
    }));
  }, [form.type_key]);

  const siteOptions = useMemo(
    () =>
      factories
        .filter(f => f.is_active !== false)
        .map(f => ({ value: f.id, label: f.name })),
    [factories],
  );

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await onAssetsChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadDataFailed'));
    }
  }, [onAssetsChanged, t]);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    const load = async () => {
      if (!editing?.has_photo) {
        setPhotoUrl(null);
        return;
      }
      try {
        const url = await ApiService.fetchTransportPhotoObjectUrl(editing.id, editing.photo_version);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setPhotoUrl(url);
      } catch {
        if (!cancelled) setPhotoUrl(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [editing?.id, editing?.has_photo, editing?.photo_version]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (a: TransportAsset) => {
    setEditing(a);
    setForm(assetToForm(a));
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.type_key) {
      setError(t('transport.validationRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = formToInput(form);
      if (editing) {
        await ApiService.updateTransportAsset(editing.id, input);
        await onAssetsChanged();
        setModalOpen(false);
      } else {
        const created = await ApiService.createTransportAsset(input);
        await onAssetsChanged();
        setEditing(created);
        setForm(assetToForm(created));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('transport.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    try {
      const result = await ApiService.deleteTransportAsset(deleteTarget.id);
      await onAssetsChanged();
      setDeleteTarget(null);
      if (result.soft) setError(t('transport.softDeleted'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('transport.deleteFailed'));
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!editing) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const updated = await ApiService.uploadTransportPhoto(editing.id, file);
      setEditing(updated);
      await onAssetsChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('transport.photoFailed'));
    } finally {
      setPhotoBusy(false);
      if (photoRef.current) photoRef.current.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    if (!editing) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const updated = await ApiService.deleteTransportPhoto(editing.id);
      setEditing(updated);
      await onAssetsChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('transport.photoFailed'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const fieldClass =
    'transport-directory-field w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 min-h-[2.75rem]';
  const labelClass = 'block text-[10px] uppercase tracking-wide text-slate-400 mb-1';

  return (
    <div className="transport-directory-page product-catalog-page p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-950 min-h-full text-slate-100">
      <div className="transport-directory-toolbar shipments-list-toolbar bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="truncate">{t('transport.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('transport.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="transport-directory-toolbar-btn px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('transport.refresh')}
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="transport-directory-toolbar-btn px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('transport.add')}
            </button>
          </div>
        </div>

        <div className="transport-directory-filters-grid flex flex-wrap items-center gap-2">
          <div className="transport-directory-search relative flex-1 min-w-[180px] max-w-md flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-h-[2.75rem]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              className="bg-transparent text-sm text-white w-full min-w-0 outline-none placeholder:text-slate-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('transport.searchPlaceholder')}
            />
          </div>
          <SearchableSelect
            value={purposeFilter}
            onChange={v => setPurposeFilter(v as 'all' | TransportPurpose)}
            options={[
              { value: 'all', label: t('transport.filterAllPurposes') },
              ...TRANSPORT_PURPOSES.map(p => ({ value: p, label: t(`transport.purposes.${p}`) })),
            ]}
            searchable={false}
            className="transport-directory-filter-select w-44"
            panelClassName="transport-directory-dropdown-panel shipments-list-dropdown-panel"
          />
          <SearchableSelect
            value={categoryFilter}
            onChange={v => setCategoryFilter(v as 'all' | TransportCategory)}
            options={[
              { value: 'all', label: t('transport.filterAllCategories') },
              ...TRANSPORT_CATEGORIES.map(c => ({ value: c, label: t(`transport.categories.${c}`) })),
            ]}
            searchable={false}
            className="transport-directory-filter-select w-48"
            panelClassName="transport-directory-dropdown-panel shipments-list-dropdown-panel"
          />
          <label className="inline-flex items-center gap-2 text-xs text-slate-400 cursor-pointer min-h-[2.75rem] px-1">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="rounded border-slate-600"
            />
            {t('transport.showInactive')}
          </label>
        </div>

        <p className="text-xs text-slate-500">{t('transport.results', { count: displayList.length })}</p>
      </div>

      {error && !modalOpen && !deleteTarget && (
        <div className="transport-directory-alert text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="transport-directory-table-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm min-w-[28rem]">
            <thead className="transport-directory-thead bg-slate-950/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left p-3">{t('transport.colName')}</th>
                <th className="text-left p-3 hidden sm:table-cell">{t('transport.colType')}</th>
                <th className="text-left p-3 hidden md:table-cell">{t('transport.colPurpose')}</th>
                <th className="text-left p-3 hidden lg:table-cell">{t('transport.colNumbers')}</th>
                <th className="text-left p-3 hidden xl:table-cell">{t('transport.colSite')}</th>
                <th className="text-left p-3 hidden sm:table-cell">{t('transport.colStatus')}</th>
                <th className="text-right p-3">{t('transport.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">{t('transport.empty')}</td>
                </tr>
              ) : (
                displayList.map(a => (
                  <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-semibold text-white">{a.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {[a.brand, a.model].filter(Boolean).join(' ') || '—'}
                        {a.has_photo ? ` · ${t('transport.hasPhoto')}` : ''}
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-slate-300">
                      {t(`transport.types.${a.type_key}`)}
                    </td>
                    <td className="p-3 hidden md:table-cell text-slate-400">
                      {t(`transport.purposes.${a.purpose}`)}
                    </td>
                    <td className="p-3 hidden lg:table-cell font-mono text-[10px] text-slate-400">
                      {[a.vehicle_number, a.inventory_number, a.vin].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-slate-400">
                      {a.site_id ? factoryMap.get(a.site_id)?.name || a.site_id : '—'}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span
                        className={`inline-flex text-[10px] px-2 py-0.5 rounded border ${
                          a.is_active !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {a.is_active !== false ? t('transport.active') : t('transport.inactive')}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 inline-flex"
                        title={t('transport.edit')}
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 inline-flex"
                        title={t('transport.delete')}
                        onClick={() => setDeleteTarget(a)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <TransportModalShell onClose={() => setModalOpen(false)}>
          <div className="transport-directory-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-white break-words">
                  {editing ? t('transport.editTitle') : t('transport.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="modal-panel-body modal-scrollbar px-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('transport.fieldName')}</label>
                  <input className={fieldClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>

                <div className="transport-directory-select">
                  <label className={labelClass}>{t('transport.fieldPurpose')}</label>
                  <SearchableSelect
                    value={form.purpose}
                    onChange={v => setForm({ ...form, purpose: v as TransportPurpose })}
                    options={TRANSPORT_PURPOSES.map(p => ({ value: p, label: t(`transport.purposes.${p}`) }))}
                    searchable={false}
                    panelClassName="transport-directory-dropdown-panel map-filter-dropdown-panel"
                  />
                </div>
                <div className="transport-directory-select">
                  <label className={labelClass}>{t('transport.fieldCategory')}</label>
                  <SearchableSelect
                    value={form.category}
                    onChange={v => {
                      const category = v as TransportCategory;
                      const first = transportTypesByCategory(category)[0]?.key || 'other';
                      setForm({ ...form, category, type_key: first, brand: '', model: '' });
                    }}
                    options={TRANSPORT_CATEGORIES.map(c => ({ value: c, label: t(`transport.categories.${c}`) }))}
                    searchable={false}
                    panelClassName="transport-directory-dropdown-panel map-filter-dropdown-panel"
                  />
                </div>
                <div className="sm:col-span-2 transport-directory-select">
                  <label className={labelClass}>{t('transport.fieldType')}</label>
                  <SearchableSelect
                    value={form.type_key}
                    onChange={v => setForm({ ...form, type_key: v, brand: '', model: '' })}
                    options={typeOptions.length ? typeOptions : TRANSPORT_TYPES.map(tp => ({ value: tp.key, label: t(`transport.types.${tp.key}`) }))}
                    panelClassName="transport-directory-dropdown-panel map-filter-dropdown-panel"
                  />
                </div>

                {popularOptions.length > 0 && (
                  <div className="sm:col-span-2 transport-directory-select">
                    <label className={labelClass}>{t('transport.popularModel')}</label>
                    <SearchableSelect
                      value=""
                      onChange={v => {
                        if (!v) return;
                        const [brand, model] = v.split('|||');
                        setForm(prev => ({
                          ...prev,
                          brand: brand || '',
                          model: model || '',
                          name: prev.name.trim() || [brand, model].filter(Boolean).join(' '),
                        }));
                      }}
                      options={popularOptions}
                      allowEmpty
                      emptyLabel={t('transport.popularModelHint')}
                      placeholder={t('transport.popularModelHint')}
                      panelClassName="transport-directory-dropdown-panel map-filter-dropdown-panel"
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>{t('transport.fieldBrand')}</label>
                  <input className={fieldClass} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldModel')}</label>
                  <input className={fieldClass} value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldYear')}</label>
                  <input className={fieldClass} value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} inputMode="numeric" />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldSort')}</label>
                  <input className={fieldClass} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} inputMode="numeric" />
                </div>

                <div>
                  <label className={labelClass}>{t('transport.fieldVehicleNumber')}</label>
                  <input className={fieldClass} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldTrailerNumber')}</label>
                  <input className={fieldClass} value={form.trailer_number} onChange={e => setForm({ ...form, trailer_number: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldContainerNumber')}</label>
                  <input className={fieldClass} value={form.container_number} onChange={e => setForm({ ...form, container_number: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldInventoryNumber')}</label>
                  <input className={fieldClass} value={form.inventory_number} onChange={e => setForm({ ...form, inventory_number: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldVin')}</label>
                  <input className={fieldClass} value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldChassis')}</label>
                  <input className={fieldClass} value={form.chassis_number} onChange={e => setForm({ ...form, chassis_number: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldEngine')}</label>
                  <input className={fieldClass} value={form.engine_number} onChange={e => setForm({ ...form, engine_number: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('transport.fieldWaybill')}</label>
                  <input className={fieldClass} value={form.waybill_number} onChange={e => setForm({ ...form, waybill_number: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('transport.fieldDriver')}</label>
                  <input className={fieldClass} value={form.driver_info} onChange={e => setForm({ ...form, driver_info: e.target.value })} />
                </div>
                <div className="sm:col-span-2 transport-directory-select">
                  <label className={labelClass}>{t('transport.fieldSite')}</label>
                  <SearchableSelect
                    value={form.site_id}
                    onChange={v => setForm({ ...form, site_id: v })}
                    options={siteOptions}
                    allowEmpty
                    emptyLabel={t('transport.siteUnset')}
                    placeholder={t('transport.siteUnset')}
                    panelClassName="transport-directory-dropdown-panel map-filter-dropdown-panel"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('transport.fieldDescription')}</label>
                  <textarea
                    className={`${fieldClass} min-h-[72px]`}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('transport.fieldSpecs')}</label>
                  <textarea
                    className={`${fieldClass} min-h-[72px]`}
                    value={form.specs_note}
                    onChange={e => setForm({ ...form, specs_note: e.target.value })}
                    placeholder={t('transport.specsPlaceholder')}
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer min-h-[2.75rem]">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-slate-600"
                  />
                  {t('transport.active')}
                </label>
              </div>

              {editing && (
                <div className="transport-directory-photo rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{t('transport.photo')}</div>
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="transport-directory-photo-img max-h-40 rounded-lg border border-slate-700 object-contain bg-slate-900" />
                  ) : (
                    <p className="text-xs text-slate-500">{t('transport.noPhoto')}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) void handlePhotoUpload(f);
                      }}
                    />
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={() => photoRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
                    >
                      {photoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      {t('transport.photoUpload')}
                    </button>
                    {editing.has_photo && (
                      <button
                        type="button"
                        disabled={photoBusy}
                        onClick={() => void handlePhotoRemove()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
                      >
                        {t('transport.photoRemove')}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">{t('transport.photoHint')}</p>
                </div>
              )}
            </div>

            <footer className="transport-directory-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                className="px-3 py-2 text-xs text-slate-400 min-h-[2.75rem] sm:min-h-0"
                onClick={() => setModalOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {t('common.save')}
              </button>
            </footer>
          </div>
        </TransportModalShell>
      )}

      {deleteTarget && (
        <TransportModalShell onClose={() => setDeleteTarget(null)} maxWidthClass="max-w-sm">
          <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
            <h3 className="font-bold text-white">{t('transport.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body px-4 pb-2 space-y-2">
            <p className="text-sm text-slate-400">
              {t('transport.deleteConfirm', { name: deleteTarget.name })}
            </p>
            <p className="text-xs text-slate-500">{t('transport.deleteHint')}</p>
          </div>
          <footer className="transport-directory-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              className="px-3 py-2 text-xs text-slate-400 min-h-[2.75rem] sm:min-h-0"
              onClick={() => setDeleteTarget(null)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold min-h-[2.75rem] sm:min-h-0"
              onClick={() => void handleDelete()}
            >
              {t('transport.delete')}
            </button>
          </footer>
        </TransportModalShell>
      )}
    </div>
  );
};
