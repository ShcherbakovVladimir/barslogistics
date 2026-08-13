import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapDataSettings, MapDataImportMode, MapDataImportResult } from '../../types';
import { ApiService } from '../../services/api';
import { useI18n } from '../../i18n';
import { Upload, Download, RefreshCw, Save, Copy, Database } from 'lucide-react';
import { SearchableSelect } from '../UI/SearchableSelect';
import { adminDropdownSelectProps } from './adminDropdown';

const inputClass = 'admin-field admin-form-field map-data-field w-full rounded-xl p-2.5 text-xs min-h-[2.75rem] sm:min-h-0';
const labelClass = 'admin-form-label';

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
      <div className="admin-form-msg--muted text-sm">{t('integrations.settingsError')}</div>
    );
  }

  return (
    <div className="admin-map-data admin-form-panel space-y-6 max-w-3xl">
      <div className="admin-section-card space-y-4">
        <div>
          <h3 className="admin-form-heading">
            <Upload />
            {t('integrations.mapDataJsonImport')}
          </h3>
          <p className="admin-form-hint mt-1">{t('integrations.mapDataJsonHint')}</p>
        </div>

        <div className="admin-form-actions">
          <label className="admin-form-actions-btn admin-form-actions-btn--file">
            {t('integrations.mapDataSelectFile')}
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
          </label>
          <button type="button" onClick={handleDownloadTemplate} className="admin-form-actions-btn admin-form-actions-btn--secondary">
            <Download />
            {t('integrations.mapDataDownloadTemplate')}
          </button>
        </div>

        {selectedFile ? (
          <p className="admin-form-msg font-mono">{selectedFile}</p>
        ) : null}

        <div className="flex flex-wrap gap-3 text-xs">
          <label className="admin-form-check">
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'merge'}
              onChange={() => setImportMode('merge')}
            />
            {t('integrations.mapDataModeMerge')}
          </label>
          <label className="admin-form-check">
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
          <p className="admin-alert admin-alert--warn">{t('integrations.mapDataReplaceWarning')}</p>
        )}

        <button
          onClick={handleImportFile}
          disabled={importing || !selectedFile}
          className="admin-form-actions-btn admin-form-actions-btn--save"
        >
          <Database className="w-4 h-4" />
          {importing ? t('integrations.mapDataImporting') : t('integrations.mapDataImportBtn')}
        </button>
      </div>

      <div className="admin-section-card space-y-4">
        <div>
          <h3 className="admin-form-heading">{t('integrations.mapDataApiTitle')}</h3>
          <p className="admin-form-hint mt-1">{t('integrations.mapDataSubtitle')}</p>
        </div>

        <label className="admin-form-check">
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

        {form.last_sync_at ? (
          <p className="admin-form-msg">
            {t('integrations.mapDataLastSync')}: {new Date(form.last_sync_at).toLocaleString(localeTag)}
            {form.last_factories_count != null && ` · ${form.last_factories_count} / ${form.last_links_count}`}
          </p>
        ) : null}
        {form.last_error ? (
          <p className="admin-form-msg admin-form-msg--error">{form.last_error}</p>
        ) : null}

        <div className="admin-form-actions">
          <button type="button" onClick={handleSaveSettings} disabled={saving} className="admin-form-actions-btn admin-form-actions-btn--primary">
            <Save />
            {t('integrations.saveSettings')}
          </button>
          <button
            type="button"
            onClick={handleSyncApi}
            disabled={syncing || !form.enabled}
            className="admin-form-actions-btn admin-form-actions-btn--secondary"
          >
            <RefreshCw className={syncing ? 'animate-spin' : ''} />
            {syncing ? t('integrations.mapDataSyncing') : t('integrations.mapDataSyncNow')}
          </button>
        </div>
      </div>

      <div className="admin-section-card admin-api-snippet">
        <div className="admin-api-snippet-head">
          <span className="admin-api-snippet-title">{t('integrations.mapDataApiCurl')}</span>
          <button type="button" onClick={handleCopy} className="admin-api-copy-btn">
            <Copy />
            {copied ? t('integrations.copied') : t('integrations.copyCurl')}
          </button>
        </div>
        <p className="admin-api-endpoint-desc mb-2">{t('integrations.mapDataApiCurlDesc')}</p>
        <pre>{curlSnippet}</pre>
      </div>

      {message ? <p className="admin-alert admin-alert--success">{message}</p> : null}
      {errors.length > 0 && (
        <ul className="admin-form-error-list">
          {errors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      )}
    </div>
  );
};
