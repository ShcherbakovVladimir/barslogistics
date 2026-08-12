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
    return popularModelsForType(form.type_key).map((m, i) => ({
      value: `${m.brand}|||${m.model}`,
      label: m.model ? `${m.brand} ${m.model}` : m.brand,
      key: `${i}`,
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
    'w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/60';
  const labelClass = 'block text-[10px] uppercase tracking-wide text-slate-400 mb-1';

  return (
    <div className="product-catalog-page p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span className="truncate">{t('transport.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t('transport.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('transport.refresh')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('transport.add')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className={`${fieldClass} pl-8`}
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
          className="w-44"
        />
        <SearchableSelect
          value={categoryFilter}
          onChange={v => setCategoryFilter(v as 'all' | TransportCategory)}
          options={[
            { value: 'all', label: t('transport.filterAllCategories') },
            ...TRANSPORT_CATEGORIES.map(c => ({ value: c, label: t(`transport.categories.${c}`) })),
          ]}
          searchable={false}
          className="w-48"
        />
        <label className="inline-flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="rounded border-slate-600"
          />
          {t('transport.showInactive')}
        </label>
      </div>

      <p className="text-[11px] text-slate-500">{t('transport.results', { count: displayList.length })}</p>
      {error && !modalOpen && <p className="text-xs text-rose-400">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/80 text-slate-400">
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
                <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-800/40">
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
                    {a.is_active !== false ? t('transport.active') : t('transport.inactive')}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 inline-flex"
                      title={t('transport.edit')}
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 inline-flex"
                      title={t('transport.delete')}
                      onClick={() => setDeleteTarget(a)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="w-full sm:max-w-3xl max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
              <h3 className="font-bold text-white">
                {editing ? t('transport.editTitle') : t('transport.addTitle')}
              </h3>
              <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {error && <p className="text-xs text-rose-400">{error}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('transport.fieldName')}</label>
                  <input className={fieldClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>

                <div>
                  <label className={labelClass}>{t('transport.fieldPurpose')}</label>
                  <SearchableSelect
                    value={form.purpose}
                    onChange={v => setForm({ ...form, purpose: v as TransportPurpose })}
                    options={TRANSPORT_PURPOSES.map(p => ({ value: p, label: t(`transport.purposes.${p}`) }))}
                    searchable={false}
                  />
                </div>
                <div>
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
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('transport.fieldType')}</label>
                  <SearchableSelect
                    value={form.type_key}
                    onChange={v => setForm({ ...form, type_key: v, brand: '', model: '' })}
                    options={typeOptions.length ? typeOptions : TRANSPORT_TYPES.map(tp => ({ value: tp.key, label: t(`transport.types.${tp.key}`) }))}
                  />
                </div>

                {popularOptions.length > 0 && (
                  <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('transport.fieldSite')}</label>
                  <SearchableSelect
                    value={form.site_id}
                    onChange={v => setForm({ ...form, site_id: v })}
                    options={siteOptions}
                    allowEmpty
                    emptyLabel={t('transport.siteUnset')}
                    placeholder={t('transport.siteUnset')}
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
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
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
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{t('transport.photo')}</div>
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="max-h-40 rounded-lg border border-slate-700 object-contain bg-slate-950" />
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50"
                    >
                      {photoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      {t('transport.photoUpload')}
                    </button>
                    {editing.has_photo && (
                      <button
                        type="button"
                        disabled={photoBusy}
                        onClick={() => void handlePhotoRemove()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        {t('transport.photoRemove')}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">{t('transport.photoHint')}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setModalOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-3">
            <h3 className="font-bold text-white">{t('transport.deleteTitle')}</h3>
            <p className="text-sm text-slate-300">
              {t('transport.deleteConfirm', { name: deleteTarget.name })}
            </p>
            <p className="text-xs text-slate-500">{t('transport.deleteHint')}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300"
                onClick={() => setDeleteTarget(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                onClick={() => void handleDelete()}
              >
                {t('transport.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
