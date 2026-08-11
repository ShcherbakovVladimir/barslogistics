import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, MapPin, RefreshCw, Save, TestTube } from 'lucide-react';
import type { GeocodingSettings, KladrLocalImportStatus } from '../../types';
import { ApiService } from '../../services/api';
import { useI18n } from '../../i18n';
import { SearchableSelect } from '../UI/SearchableSelect';

const inputClass = 'admin-field geocoding-admin-field w-full rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[2.75rem] sm:min-h-0';
const labelClass = 'block text-slate-300 font-semibold mb-1 text-xs';

interface GeocodingAdminPanelProps {
  settings: GeocodingSettings | null;
  onSaveSettings: (settings: GeocodingSettings) => Promise<GeocodingSettings>;
}

export const GeocodingAdminPanel: React.FC<GeocodingAdminPanelProps> = ({ settings, onSaveSettings }) => {
  const { t, localeTag } = useI18n();
  const [form, setForm] = useState<GeocodingSettings | null>(settings);
  const [status, setStatus] = useState<KladrLocalImportStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await ApiService.getKladrLocalStatus();
      setStatus(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const timer = setInterval(() => {
      if (status?.in_progress || form?.local_db_import_in_progress) void refreshStatus();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshStatus, status?.in_progress, form?.local_db_import_in_progress]);

  const kladrProviderOptions = useMemo(
    () => [
      { value: 'auto', label: t('integrations.kladrProviderAuto') },
      { value: 'local_db', label: t('integrations.kladrProviderLocal') },
      { value: 'external_api', label: t('integrations.kladrProviderApi') },
    ],
    [t],
  );

  const kladrPlanOptions = useMemo(
    () => [
      { value: 'free', label: t('integrations.kladrPlanFree') },
      { value: 'paid', label: t('integrations.kladrPlanPaid') },
    ],
    [t],
  );

  const dropdownProps = {
    searchable: false as const,
    panelClassName: 'geocoding-admin-dropdown-panel',
    listClassName: 'geocoding-admin-dropdown-list shipment-events-scroll',
  };

  if (!form) {
    return <p className="text-xs text-slate-400">…</p>;
  }

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const saved = await onSaveSettings(form);
      setForm(saved);
      setMsg(t('integrations.settingsSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setMsg('');
    try {
      const result = await ApiService.testGeocoding();
      setMsg(result.message);
      await refreshStatus();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    }
  };

  const handleImport = async () => {
    setMsg('');
    try {
      const result = await ApiService.importKladrLocal();
      setMsg(result.message);
      await refreshStatus();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    }
  };

  const counts = status ?? {
    in_progress: form.local_db_import_in_progress ?? false,
    settlement_count: form.local_db_settlement_count ?? 0,
    street_count: form.local_db_street_count ?? 0,
    building_count: form.local_db_building_count ?? 0,
    last_import_at: form.local_db_last_import_at,
    last_error: form.local_db_last_error,
    archive_url: form.local_db_source_url,
  };

  return (
    <div className="geocoding-admin-panel space-y-6 max-w-3xl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            {t('integrations.geocodingTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t('integrations.geocodingHint')}</p>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
          {t('integrations.enabled')}
        </label>

        <div>
          <label className={labelClass}>{t('integrations.kladrProvider')}</label>
          <SearchableSelect
            {...dropdownProps}
            value={form.kladr_provider}
            onChange={value => setForm({ ...form, kladr_provider: value as GeocodingSettings['kladr_provider'] })}
            options={kladrProviderOptions}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={form.kladr_fallback_api}
            onChange={e => setForm({ ...form, kladr_fallback_api: e.target.checked })}
          />
          {t('integrations.kladrFallbackApi')}
        </label>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-white">{t('integrations.kladrLocalDb')}</h4>
        <p className="text-xs text-slate-400">{t('integrations.kladrLocalDbHint')}</p>

        <div>
          <label className={labelClass}>{t('integrations.kladrArchiveUrl')}</label>
          <input
            className={inputClass}
            value={form.local_db_source_url}
            onChange={e => setForm({ ...form, local_db_source_url: e.target.value })}
          />
        </div>

        <div className="admin-geocoding-stats grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-500">{t('integrations.kladrSettlements')}</div>
            <div className="text-white font-bold mt-1">{counts.settlement_count.toLocaleString(localeTag)}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-500">{t('integrations.kladrStreets')}</div>
            <div className="text-white font-bold mt-1">{counts.street_count.toLocaleString(localeTag)}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-500">{t('integrations.kladrBuildings')}</div>
            <div className="text-white font-bold mt-1">{counts.building_count.toLocaleString(localeTag)}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-500">{t('integrations.kladrLastImport')}</div>
            <div className="text-white font-bold mt-1 text-[10px]">
              {counts.last_import_at ? new Date(counts.last_import_at).toLocaleString(localeTag) : '—'}
            </div>
          </div>
        </div>

        {counts.in_progress && (
          <p className="text-xs text-amber-400">{t('integrations.kladrImportRunning')}</p>
        )}
        {counts.last_error && (
          <p className="text-xs text-red-400">{counts.last_error}</p>
        )}

        <div className="admin-form-actions flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={counts.in_progress}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {t('integrations.kladrDownloadImport')}
          </button>
          <button
            type="button"
            onClick={() => void refreshStatus()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('integrations.refreshStatus')}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-white">{t('integrations.kladrExternalApi')}</h4>

        <div>
          <label className={labelClass}>{t('integrations.kladrApiPlan')}</label>
          <SearchableSelect
            {...dropdownProps}
            value={form.kladr_api_plan}
            onChange={value => setForm({ ...form, kladr_api_plan: value as 'free' | 'paid' })}
            options={kladrPlanOptions}
          />
        </div>

        <div>
          <label className={labelClass}>{t('integrations.kladrApiUrl')}</label>
          <input
            className={inputClass}
            value={form.kladr_api_url}
            onChange={e => setForm({ ...form, kladr_api_url: e.target.value })}
            placeholder="http://kladr-api.com/api.php"
          />
        </div>

        <div>
          <label className={labelClass}>{t('integrations.kladrApiToken')}</label>
          <input
            className={inputClass}
            value={form.kladr_api_token}
            onChange={e => setForm({ ...form, kladr_api_token: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>{t('integrations.kladrApiKey')}</label>
          <input
            className={inputClass}
            value={form.kladr_api_key}
            onChange={e => setForm({ ...form, kladr_api_key: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-white">{t('integrations.geocodingServices')}</h4>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={form.nominatim_enabled}
            onChange={e => setForm({ ...form, nominatim_enabled: e.target.checked })}
          />
          {t('integrations.nominatimEnabled')}
        </label>

        <div>
          <label className={labelClass}>{t('integrations.nominatimBaseUrl')}</label>
          <input
            className={inputClass}
            value={form.nominatim_base_url}
            onChange={e => setForm({ ...form, nominatim_base_url: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={form.station_lookup_enabled}
            onChange={e => setForm({ ...form, station_lookup_enabled: e.target.checked })}
          />
          {t('integrations.stationLookupEnabled')}
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={form.known_places_enabled}
            onChange={e => setForm({ ...form, known_places_enabled: e.target.checked })}
          />
          {t('integrations.knownPlacesEnabled')}
        </label>
      </div>

      <div className="admin-form-actions flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          {t('integrations.saveSettings')}
        </button>
        <button
          type="button"
          onClick={handleTest}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <TestTube className="w-3.5 h-3.5" />
          {t('integrations.testConnection')}
        </button>
      </div>

      {form.last_test_at && (
        <p className="text-[11px] text-slate-500">
          {t('integrations.lastTest')}: {new Date(form.last_test_at).toLocaleString(localeTag)}
          {form.last_test_message ? ` — ${form.last_test_message}` : ''}
        </p>
      )}
      {msg && <p className="text-xs text-slate-400">{msg}</p>}
    </div>
  );
};
