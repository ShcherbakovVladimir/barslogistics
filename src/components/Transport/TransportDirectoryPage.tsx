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
        className={`transport-directory-modal app-modal-sheet modal-panel ${maxWidthClass} ${isDragging ? 'is-sheet-dragging' : ''}`}
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

interface TransportActionsProps {
  asset: TransportAsset;
  t: (key: string, params?: Record<string, string | number>) => string;
  onEdit: (a: TransportAsset) => void;
  onDelete: (a: TransportAsset) => void;
}

const TransportActions: React.FC<TransportActionsProps> = ({
  asset,
  t,
  onEdit,
  onDelete,
}) => (
  <div className="transport-directory-row-actions">
    <button
      type="button"
      className="transport-directory-row-icon-btn transport-directory-row-icon-btn--edit"
      title={t('transport.edit')}
      aria-label={t('transport.edit')}
      onClick={() => onEdit(asset)}
    >
      <Pencil className="w-4 h-4" />
    </button>
    <button
      type="button"
      className="transport-directory-row-icon-btn transport-directory-row-icon-btn--delete"
      title={t('transport.delete')}
      aria-label={t('transport.delete')}
      onClick={() => onDelete(asset)}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

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

  const statusBadge = (a: TransportAsset) => (
    <span className={`transport-directory-status-badge ${
      a.is_active !== false
        ? 'transport-directory-status-badge--active'
        : 'transport-directory-status-badge--inactive'
    }`}>
      {a.is_active !== false ? t('transport.active') : t('transport.inactive')}
    </span>
  );

  return (
    <div className="transport-directory-page">
      <div className="transport-directory-toolbar shipments-list-toolbar">
        <div className="transport-directory-toolbar-top">
          <div className="shipments-list-toolbar-head">
            <span className="shipments-list-toolbar-icon" aria-hidden>
              <Truck />
            </span>
            <div className="shipments-list-toolbar-text">
              <h2 className="shipments-list-title">
                <span className="truncate">{t('transport.title')}</span>
              </h2>
              <p className="shipments-list-subtitle">{t('transport.subtitle')}</p>
            </div>
          </div>
          <div className="transport-directory-toolbar-actions">
            <button
              type="button"
              onClick={() => void refresh()}
              className="transport-directory-toolbar-btn transport-directory-toolbar-btn--refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('transport.refresh')}
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="transport-directory-toolbar-btn transport-directory-toolbar-btn--add"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('transport.add')}
            </button>
          </div>
        </div>

        <div className="transport-directory-filters-grid shipments-list-filters-grid">
          <div className="transport-directory-search shipments-list-search">
            <Search aria-hidden />
            <input
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
            className="transport-directory-filter-select transport-directory-filter-select--purpose shipments-list-filter"
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
            className="transport-directory-filter-select transport-directory-filter-select--category shipments-list-filter"
            panelClassName="transport-directory-dropdown-panel shipments-list-dropdown-panel"
          />
          <label className="transport-directory-inactive-toggle">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
            />
            {t('transport.showInactive')}
          </label>
        </div>
      </div>

      {error && !modalOpen && !deleteTarget && (
        <div className="transport-directory-alert">{error}</div>
      )}

      <div className="transport-directory-results-bar">
        {t('transport.results', { count: displayList.length })}
      </div>

      <div className="transport-directory-table-panel">
        <div className="transport-directory-table-head-bar">
          {t('transport.results', { count: displayList.length })}
        </div>
        <div className="transport-directory-table-desktop responsive-table-wrap">
          <table className="transport-directory-table">
            <thead>
              <tr>
                <th>{t('transport.colName')}</th>
                <th className="transport-directory-col-type">{t('transport.colType')}</th>
                <th className="transport-directory-col-purpose">{t('transport.colPurpose')}</th>
                <th className="transport-directory-col-numbers">{t('transport.colNumbers')}</th>
                <th className="transport-directory-col-site">{t('transport.colSite')}</th>
                <th className="transport-directory-col-status">{t('transport.colStatus')}</th>
                <th className="transport-directory-col-actions">{t('transport.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="transport-directory-table-empty">{t('transport.empty')}</td>
                </tr>
              ) : (
                displayList.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="transport-directory-cell-name">{a.name}</div>
                      <div className="transport-directory-cell-meta">
                        {[a.brand, a.model].filter(Boolean).join(' ') || '—'}
                        {a.has_photo ? ` · ${t('transport.hasPhoto')}` : ''}
                      </div>
                    </td>
                    <td className="transport-directory-col-type transport-directory-cell-type">
                      {t(`transport.types.${a.type_key}`)}
                    </td>
                    <td className="transport-directory-col-purpose transport-directory-cell-purpose">
                      {t(`transport.purposes.${a.purpose}`)}
                    </td>
                    <td className="transport-directory-col-numbers transport-directory-cell-numbers">
                      {[a.vehicle_number, a.inventory_number, a.vin].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="transport-directory-col-site transport-directory-cell-site">
                      {a.site_id ? factoryMap.get(a.site_id)?.name || a.site_id : '—'}
                    </td>
                    <td className="transport-directory-col-status">{statusBadge(a)}</td>
                    <td className="transport-directory-col-actions">
                      <TransportActions asset={a} t={t} onEdit={openEdit} onDelete={setDeleteTarget} />
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
            <header className="modal-panel-header app-modal-sheet-header">
              <div className="transport-directory-modal-head">
                <h3 className="transport-directory-modal-title">
                  {editing ? t('transport.editTitle') : t('transport.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="transport-directory-modal-close-btn"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="modal-panel-body modal-scrollbar flex-1 min-h-0 overflow-y-auto">
              {error && <p className="transport-directory-form-error">{error}</p>}

              <div className="transport-directory-form-grid">
                <label className="transport-directory-form-field transport-directory-form-field--wide">
                  <span className="transport-directory-form-label">{t('transport.fieldName')}</span>
                  <input className="transport-directory-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>

                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldPurpose')}</span>
                  <div className="transport-directory-form-select">
                    <SearchableSelect
                      value={form.purpose}
                      onChange={v => setForm({ ...form, purpose: v as TransportPurpose })}
                      options={TRANSPORT_PURPOSES.map(p => ({ value: p, label: t(`transport.purposes.${p}`) }))}
                      searchable={false}
                      panelClassName="transport-directory-dropdown-panel map-filter-dropdown-panel"
                    />
                  </div>
                </label>

                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldCategory')}</span>
                  <div className="transport-directory-form-select">
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
                </label>

                <label className="transport-directory-form-field transport-directory-form-field--wide">
                  <span className="transport-directory-form-label">{t('transport.fieldType')}</span>
                  <div className="transport-directory-form-select">
                    <SearchableSelect
                      value={form.type_key}
                      onChange={v => setForm({ ...form, type_key: v, brand: '', model: '' })}
                      options={typeOptions.length ? typeOptions : TRANSPORT_TYPES.map(tp => ({ value: tp.key, label: t(`transport.types.${tp.key}`) }))}
                      panelClassName="transport-directory-dropdown-panel map-filter-dropdown-panel"
                    />
                  </div>
                </label>

                {popularOptions.length > 0 && (
                  <label className="transport-directory-form-field transport-directory-form-field--wide">
                    <span className="transport-directory-form-label">{t('transport.popularModel')}</span>
                    <div className="transport-directory-form-select">
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
                  </label>
                )}

                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldBrand')}</span>
                  <input className="transport-directory-field" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldModel')}</span>
                  <input className="transport-directory-field" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldYear')}</span>
                  <input className="transport-directory-field" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} inputMode="numeric" />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldSort')}</span>
                  <input className="transport-directory-field" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} inputMode="numeric" />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldVehicleNumber')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldTrailerNumber')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.trailer_number} onChange={e => setForm({ ...form, trailer_number: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldContainerNumber')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.container_number} onChange={e => setForm({ ...form, container_number: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldInventoryNumber')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.inventory_number} onChange={e => setForm({ ...form, inventory_number: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldVin')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldChassis')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.chassis_number} onChange={e => setForm({ ...form, chassis_number: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldEngine')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.engine_number} onChange={e => setForm({ ...form, engine_number: e.target.value })} />
                </label>
                <label className="transport-directory-form-field">
                  <span className="transport-directory-form-label">{t('transport.fieldWaybill')}</span>
                  <input className="transport-directory-field transport-directory-field--mono" value={form.waybill_number} onChange={e => setForm({ ...form, waybill_number: e.target.value })} />
                </label>
                <label className="transport-directory-form-field transport-directory-form-field--wide">
                  <span className="transport-directory-form-label">{t('transport.fieldDriver')}</span>
                  <input className="transport-directory-field" value={form.driver_info} onChange={e => setForm({ ...form, driver_info: e.target.value })} />
                </label>
                <label className="transport-directory-form-field transport-directory-form-field--wide">
                  <span className="transport-directory-form-label">{t('transport.fieldSite')}</span>
                  <div className="transport-directory-form-select">
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
                </label>
                <label className="transport-directory-form-field transport-directory-form-field--wide">
                  <span className="transport-directory-form-label">{t('transport.fieldDescription')}</span>
                  <textarea
                    className="transport-directory-field transport-directory-field--textarea"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </label>
                <label className="transport-directory-form-field transport-directory-form-field--wide">
                  <span className="transport-directory-form-label">{t('transport.fieldSpecs')}</span>
                  <textarea
                    className="transport-directory-field transport-directory-field--textarea"
                    value={form.specs_note}
                    onChange={e => setForm({ ...form, specs_note: e.target.value })}
                    placeholder={t('transport.specsPlaceholder')}
                  />
                </label>
                <label className="transport-directory-form-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  />
                  {t('transport.active')}
                </label>
              </div>

              {editing && (
                <div className="transport-directory-photo">
                  <div className="transport-directory-photo-label">{t('transport.photo')}</div>
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="transport-directory-photo-img" />
                  ) : (
                    <p className="transport-directory-photo-empty">{t('transport.noPhoto')}</p>
                  )}
                  <div className="transport-directory-photo-actions">
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="transport-directory-photo-input"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) void handlePhotoUpload(f);
                      }}
                    />
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={() => photoRef.current?.click()}
                      className="transport-directory-photo-btn transport-directory-photo-btn--upload"
                    >
                      {photoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      {t('transport.photoUpload')}
                    </button>
                    {editing.has_photo && (
                      <button
                        type="button"
                        disabled={photoBusy}
                        onClick={() => void handlePhotoRemove()}
                        className="transport-directory-photo-btn transport-directory-photo-btn--remove"
                      >
                        {t('transport.photoRemove')}
                      </button>
                    )}
                  </div>
                  <p className="transport-directory-photo-hint">{t('transport.photoHint')}</p>
                </div>
              )}
            </div>

            <footer className="transport-directory-form-modal-footer modal-panel-footer">
              <button
                type="button"
                className="transport-directory-form-cancel"
                onClick={() => setModalOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="transport-directory-form-submit"
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
          <header className="modal-panel-header app-modal-sheet-header">
            <h3 className="transport-directory-modal-title">{t('transport.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body">
            <p className="transport-directory-modal-text">
              {t('transport.deleteConfirm', { name: deleteTarget.name })}
            </p>
            <p className="transport-directory-modal-hint">{t('transport.deleteHint')}</p>
          </div>
          <footer className="transport-directory-form-modal-footer modal-panel-footer">
            <button
              type="button"
              className="transport-directory-form-cancel"
              onClick={() => setDeleteTarget(null)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="transport-directory-form-delete"
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
