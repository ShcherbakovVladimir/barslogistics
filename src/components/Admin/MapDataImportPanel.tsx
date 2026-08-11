import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapDataSettings, MapDataImportMode, MapDataImportResult } from '../../types';
import { ApiService } from '../../services/api';
import { useI18n } from '../../i18n';
import { Upload, Download, RefreshCw, Save, Copy, Database } from 'lucide-react';
import { SearchableSelect } from '../UI/SearchableSelect';
import { adminDropdownSelectProps } from './adminDropdown';

const inputClass = 'admin-field map-data-field w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[2.75rem] sm:min-h-0';
const labelClass = 'block text-slate-300 font-semibold mb-1 text-xs';

interface MapDataImportPanelProps {
  settings: MapDataSettings | null;
  onSaveSettings: (settings: MapDataSettings) => Promise<MapDataSettings>;
  onImported: () => Promise<void>;
}

export const MapDataImportPanel: React.FC<MapDataImportPanelProps> = ({
  settings,
  onSaveSettings,
  onImported,
}) => {
  const { t, localeTag } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<MapDataSettings | null>(settings);
  const [importMode, setImportMode] = useState<MapDataImportMode>('merge');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const authTypeOptions = useMemo(
    () => [
      { value: 'none', label: 'none' },
      { value: 'bearer', label: 'Bearer' },
      { value: 'header', label: 'X-API-Key' },
      { value: 'query', label: 'Query api_key' },
    ],
    [],
  );

  useEffect(() => {
    setForm(settings);
    if (settings?.default_import_mode) {
      setImportMode(settings.default_import_mode);
    }
  }, [settings]);

  const showResult = (result: MapDataImportResult) => {
    setMessage(t('integrations.mapDataImportOk', {
      factories: result.factories_upserted,
      links: result.supply_links_upserted,
    }));
    if (result.factories_skipped > 0) {
      setMessage(prev => `${prev}. ${t('integrations.mapDataFactoriesSkipped', { count: result.factories_skipped })}`);
    }
    const skipped = result.factories_skipped + result.supply_links_skipped;
    if (skipped > 0) {
      setMessage(prev => `${prev}. ${t('integrations.mapDataImportErrors', { count: skipped })}`);
    }
    setErrors(result.errors.slice(0, 8));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file?.name || '');
    setMessage('');
    setErrors([]);
  };

  const handleImportFile = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage('');
    setErrors([]);
    try {
      const text = await file.text();
      const json = JSON.parse(text) as Record<string, unknown>;
      const result = await ApiService.importMapData({ ...json, mode: importMode });
      showResult(result);
      await onImported();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('integrations.settingsError'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedFile('');
    }
  };

  const handleSyncApi = async () => {
    setSyncing(true);
    setMessage('');
    setErrors([]);
    try {
      const result = await ApiService.syncMapDataFromApi(importMode);
      showResult(result);
      await onImported();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('integrations.settingsError'));
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!form) return;
    setSaving(true);
    setMessage('');
    try {
      const saved = await onSaveSettings({ ...form, default_import_mode: importMode });
      setForm(saved);
      setMessage(t('integrations.settingsSaved'));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('integrations.settingsError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = await ApiService.getMapDataTemplate();
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'barslogistics-map-data-example.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('integrations.settingsError'));
    }
  };

  const curlSnippet = `curl -X POST "https://barslogistics.almaz-t.ru/api/map-data/import" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -d '{"mode":"merge","supply_links":[...]}'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!form) {
    return (
      <div className="text-sm text-slate-400">{t('integrations.settingsError')}</div>
    );
  }

  return (
    <div className="admin-map-data admin-form-panel space-y-6 max-w-3xl">
      <div className="admin-section-card bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            {t('integrations.mapDataJsonImport')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t('integrations.mapDataJsonHint')}</p>
        </div>

        <div className="admin-form-actions flex flex-wrap gap-2">
          <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold cursor-pointer">
            {t('integrations.mapDataSelectFile')}
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
          </label>
          <button onClick={handleDownloadTemplate} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            {t('integrations.mapDataDownloadTemplate')}
          </button>
        </div>

        {selectedFile && (
          <p className="text-xs text-slate-300 font-mono">{selectedFile}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'merge'}
              onChange={() => setImportMode('merge')}
            />
            {t('integrations.mapDataModeMerge')}
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
            />
            {t('integrations.mapDataModeReplace')}
          </label>
        </div>

        {importMode === 'replace' && (
          <p className="text-xs text-amber-400/90">{t('integrations.mapDataReplaceWarning')}</p>
        )}

        <button
          onClick={handleImportFile}
          disabled={importing || !selectedFile}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          {importing ? t('integrations.mapDataImporting') : t('integrations.mapDataImportBtn')}
        </button>
      </div>

      <div className="admin-section-card bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white">{t('integrations.mapDataApiTitle')}</h3>
          <p className="text-xs text-slate-400 mt-1">{t('integrations.mapDataSubtitle')}</p>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
          {t('integrations.enabled')}
        </label>

        <div>
          <label className={labelClass}>{t('integrations.mapDataApiEndpoint')}</label>
          <input className={inputClass} value={form.api_endpoint} onChange={e => setForm({ ...form, api_endpoint: e.target.value })} placeholder="https://api.example.com/logistics/map" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('integrations.authType')}</label>
            <SearchableSelect
              {...adminDropdownSelectProps}
              value={form.auth_type}
              onChange={value => setForm({ ...form, auth_type: value as MapDataSettings['auth_type'] })}
              options={authTypeOptions}
            />
          </div>
          <div>
            <label className={labelClass}>API Key</label>
            <input className={inputClass} value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="****" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>{t('integrations.mapDataSyncPath')}</label>
            <input className={inputClass} value={form.sync_path} onChange={e => setForm({ ...form, sync_path: e.target.value })} placeholder="data" />
          </div>
          <div>
            <label className={labelClass}>{t('integrations.mapDataFactoriesPath')}</label>
            <input className={inputClass} value={form.factories_path} onChange={e => setForm({ ...form, factories_path: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{t('integrations.mapDataLinksPath')}</label>
            <input className={inputClass} value={form.supply_links_path} onChange={e => setForm({ ...form, supply_links_path: e.target.value })} />
          </div>
        </div>

        {form.last_sync_at && (
          <p className="text-xs text-slate-400">
            {t('integrations.mapDataLastSync')}: {new Date(form.last_sync_at).toLocaleString(localeTag)}
            {form.last_factories_count != null && ` · ${form.last_factories_count} / ${form.last_links_count}`}
          </p>
        )}
        {form.last_error && (
          <p className="text-xs text-red-400">{form.last_error}</p>
        )}

        <div className="admin-form-actions flex flex-wrap gap-2">
          <button onClick={handleSaveSettings} disabled={saving} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {t('integrations.saveSettings')}
          </button>
          <button
            onClick={handleSyncApi}
            disabled={syncing || !form.enabled}
            className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? t('integrations.mapDataSyncing') : t('integrations.mapDataSyncNow')}
          </button>
        </div>
      </div>

      <div className="admin-section-card admin-api-snippet bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
          <span className="text-indigo-400 font-bold">{t('integrations.mapDataApiCurl')}</span>
          <button onClick={handleCopy} className="text-slate-400 hover:text-white flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            {copied ? t('integrations.copied') : t('integrations.copyCurl')}
          </button>
        </div>
        <p className="text-slate-400 mb-2">{t('integrations.mapDataApiCurlDesc')}</p>
        <pre className="text-slate-300 whitespace-pre-wrap overflow-x-auto">{curlSnippet}</pre>
      </div>

      {message && <p className="text-xs text-emerald-400">{message}</p>}
      {errors.length > 0 && (
        <ul className="text-xs text-amber-400/90 space-y-1 list-disc pl-4">
          {errors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      )}
    </div>
  );
};
