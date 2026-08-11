import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { Factory, FactoryType } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { SITE_CATEGORIES, getSiteCategoryLabel } from '../../constants/siteCategories';
import {
  emptySiteDirectoryForm,
  formToFactory,
  siteToForm,
  type SiteDirectoryFormState,
} from './siteDirectoryForm';
import { SearchableSelect } from '../UI/SearchableSelect';
import { KladrAddressInput } from '../UI/KladrAddressInput';
import type { KladrSuggestion } from '../../types';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';

interface SiteDirectoryFormModalProps {
  mode: 'create' | 'edit';
  site: Factory | null;
  defaultType?: FactoryType;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const fieldClass =
  'w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white min-h-[2.75rem]';

export const SiteDirectoryFormModal: React.FC<SiteDirectoryFormModalProps> = ({
  mode,
  site,
  defaultType = 'gok',
  onClose,
  onSaved,
}) => {
  const { t, locale } = useI18n();
  const [form, setForm] = useState<SiteDirectoryFormState>(() =>
    mode === 'edit' && site ? siteToForm(site) : emptySiteDirectoryForm(defaultType),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && site) {
      setForm(siteToForm(site));
    } else if (mode === 'create') {
      setForm(emptySiteDirectoryForm(defaultType));
    }
    setError('');
  }, [mode, site?.id, site?.type, site?.name, site?.edit_count, defaultType]);

  const applyKladrAddress = async (item: KladrSuggestion) => {
    setForm(f => ({
      ...f,
      address: item.normalizedAddress,
      region: item.region || f.region,
      kladr_id: item.id,
    }));
    try {
      const geo = await ApiService.geocodeAddress(item.normalizedAddress, item.region);
      setForm(f => ({
        ...f,
        latitude: String(geo.latitude),
        longitude: String(geo.longitude),
        kladr_id: geo.kladr_id || item.id,
      }));
    } catch {
      /* keep address/region from KLADR */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = formToFactory(form, defaultType);
      if (mode === 'create') {
        await ApiService.createFactory(payload);
      } else if (site) {
        await ApiService.updateFactory(site.id, { ...payload, id: site.id });
      } else {
        return;
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('siteDirectory.admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

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
        className={`site-directory-form-modal app-modal-sheet modal-panel shipment-events-panel bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <form onSubmit={handleSubmit} className="site-directory-form-modal-form flex flex-col flex-1 min-h-0">
        <header className="modal-panel-header app-modal-sheet-header">
          <AppBottomSheetHandle
            onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
            isDragging={isDragging}
          />
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-bold text-base text-white min-w-0 break-words">
              {mode === 'create' ? t('siteDirectory.admin.add') : t('siteDirectory.admin.edit')}
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="modal-panel-body modal-scrollbar space-y-3">
          {error && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
              {error}
            </div>
          )}

          <div className="site-directory-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-slate-400 font-medium">{t('siteDirectory.colName')}</span>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-slate-400 font-medium">{t('siteDirectory.admin.colType')}</span>
              <SearchableSelect
                value={form.type}
                onChange={v => setForm({ ...form, type: v as FactoryType })}
                options={SITE_CATEGORIES.map(c => ({
                  value: c.id,
                  label: getSiteCategoryLabel(c.id, locale),
                }))}
                searchable
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-slate-400 font-medium">{t('siteDirectory.admin.colCode')}</span>
              <input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-slate-400 font-medium">{t('factories.latitude')}</span>
              <input
                required
                value={form.latitude}
                onChange={e => setForm({ ...form, latitude: e.target.value })}
                className={`${fieldClass} font-mono`}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-slate-400 font-medium">{t('factories.longitude')}</span>
              <input
                required
                value={form.longitude}
                onChange={e => setForm({ ...form, longitude: e.target.value })}
                className={`${fieldClass} font-mono`}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-slate-400 font-medium">{t('factories.region')}</span>
              <KladrAddressInput
                mode="region"
                value={form.region}
                onChange={v => setForm({ ...form, region: v })}
                onSelect={item => setForm(f => ({ ...f, region: item.region || item.name }))}
                inputClassName={fieldClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-slate-400 font-medium">{t('factories.country')}</span>
              <input
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-slate-400 font-medium">{t('siteDirectory.admin.colAddress')}</span>
              <KladrAddressInput
                value={form.address}
                onChange={v => setForm({ ...form, address: v })}
                onSelect={applyKladrAddress}
                inputClassName={fieldClass}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-slate-400 font-medium">{t('factories.holdingField')}</span>
              <input
                value={form.holding}
                onChange={e => setForm({ ...form, holding: e.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-slate-400 font-medium">{t('factories.description')}</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className={`${fieldClass} min-h-[4.5rem] resize-y`}
              />
            </label>
            <label className="flex items-center gap-2.5 text-slate-300 sm:col-span-2 min-h-[2.75rem]">
              <input type="checkbox" checked={form.is_ours} onChange={e => setForm({ ...form, is_ours: e.target.checked })} />
              {t('common.oursObject')}
            </label>
            <label className="flex items-center gap-2.5 text-slate-300 sm:col-span-2 min-h-[2.75rem]">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              {t('siteDirectory.admin.active')}
            </label>
          </div>
        </div>

        <footer className="modal-panel-footer site-directory-form-modal-footer">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="site-directory-form-cancel px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="site-directory-form-submit flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? t('admin.users.saving') : t('admin.users.save')}
            </button>
          </div>
        </footer>
        </form>
      </div>
    </div>
  );
};
