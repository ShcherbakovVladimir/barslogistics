import React, { useMemo, useState } from 'react';
import {
  TelegramSettings, CloudSettings, TelemetrySettings, ThirdPartyCarrier, CarrierSettingsUpdate, CarrierAuthType, MailSettings,
} from '../../types';
import { ApiService } from '../../services/api';
import { useI18n } from '../../i18n';
import { Save, TestTube, Settings2, Satellite, Mail } from 'lucide-react';
import { SearchableSelect } from '../UI/SearchableSelect';
import { adminDropdownSelectProps } from '../Admin/adminDropdown';

const inputClass = 'admin-field admin-form-field w-full rounded-xl p-2.5 text-xs min-h-[2.75rem] sm:min-h-0';
const labelClass = 'admin-form-label';

interface TelegramSettingsFormProps {
  settings: TelegramSettings;
  onSave: (s: TelegramSettings) => Promise<void>;
}

export const TelegramSettingsForm: React.FC<TelegramSettingsFormProps> = ({ settings, onSave }) => {
  const { t } = useI18n();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await onSave(form);
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
      await ApiService.testTelegram(form.default_chat_id);
      setMsg(t('integrations.testOk'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    }
  };

  return (
    <div className="admin-form-divider space-y-3">
      <h4 className="admin-form-heading">
        <Settings2 aria-hidden />
        {t('integrations.adminSettings')}
      </h4>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
        {t('integrations.enabled')}
      </label>

      <div>
        <label className={labelClass}>{t('integrations.botToken')}</label>
        <input className={inputClass} value={form.bot_token} onChange={e => setForm({ ...form, bot_token: e.target.value })} placeholder="123456:ABC..." />
      </div>

      <div>
        <label className={labelClass}>{t('integrations.telegramChatId')}</label>
        <input className={inputClass} value={form.default_chat_id} onChange={e => setForm({ ...form, default_chat_id: e.target.value })} />
      </div>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.alert_on_delay} onChange={e => setForm({ ...form, alert_on_delay: e.target.checked })} />
        {t('integrations.alertOnDelay')}
      </label>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.alert_on_status_change} onChange={e => setForm({ ...form, alert_on_status_change: e.target.checked })} />
        {t('integrations.alertOnStatusChange')}
      </label>

      <div className="admin-form-actions flex gap-2">
        <button onClick={handleSave} disabled={saving} className="admin-form-actions-btn admin-form-actions-btn--primary">
          <Save className="w-3.5 h-3.5" /> {t('integrations.saveSettings')}
        </button>
        <button onClick={handleTest} className="admin-form-actions-btn admin-form-actions-btn--secondary">
          <TestTube className="w-3.5 h-3.5" /> {t('integrations.testConnection')}
        </button>
      </div>
      {msg ? <p className="admin-form-msg">{msg}</p> : null}
    </div>
  );
};

interface CloudSettingsFormProps {
  settings: CloudSettings;
  onSave: (s: CloudSettings) => Promise<void>;
}

export const CloudSettingsForm: React.FC<CloudSettingsFormProps> = ({ settings, onSave }) => {
  const { t } = useI18n();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const cloudProviderOptions = useMemo(
    () => [
      { value: 's3', label: t('integrations.cloudProviderS3') },
      { value: 'yandex', label: t('integrations.cloudProviderYandex') },
      { value: 'gdrive', label: t('integrations.cloudProviderGdrive') },
    ],
    [t],
  );

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await onSave(form);
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
      const m = await ApiService.testCloud();
      setMsg(m);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    }
  };

  return (
    <div className="admin-form-panel admin-form-divider space-y-3">
      <h4 className="admin-form-heading">
        <Settings2 aria-hidden />
        {t('integrations.adminSettings')}
      </h4>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
        {t('integrations.enabled')}
      </label>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.auto_upload_on_backup} onChange={e => setForm({ ...form, auto_upload_on_backup: e.target.checked })} />
        {t('integrations.autoUploadBackup')}
      </label>

      <div>
        <label className={labelClass}>{t('integrations.cloudProvider')}</label>
        <SearchableSelect
          {...adminDropdownSelectProps}
          value={form.provider}
          onChange={value => setForm({ ...form, provider: value as CloudSettings['provider'] })}
          options={cloudProviderOptions}
        />
      </div>

      {form.provider === 's3' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={labelClass}>{t('integrations.fieldEndpoint')}</label><input className={inputClass} value={form.s3?.endpoint || ''} onChange={e => setForm({ ...form, s3: { ...form.s3!, endpoint: e.target.value } })} placeholder="https://s3.amazonaws.com" /></div>
          <div><label className={labelClass}>{t('integrations.fieldBucket')}</label><input className={inputClass} value={form.s3?.bucket || ''} onChange={e => setForm({ ...form, s3: { ...form.s3!, bucket: e.target.value } })} /></div>
          <div><label className={labelClass}>{t('integrations.fieldRegion')}</label><input className={inputClass} value={form.s3?.region || ''} onChange={e => setForm({ ...form, s3: { ...form.s3!, region: e.target.value } })} /></div>
          <div><label className={labelClass}>{t('integrations.fieldPrefix')}</label><input className={inputClass} value={form.s3?.prefix || ''} onChange={e => setForm({ ...form, s3: { ...form.s3!, prefix: e.target.value } })} /></div>
          <div><label className={labelClass}>{t('integrations.fieldAccessKey')}</label><input className={inputClass} value={form.s3?.access_key_id || ''} onChange={e => setForm({ ...form, s3: { ...form.s3!, access_key_id: e.target.value } })} /></div>
          <div><label className={labelClass}>{t('integrations.fieldSecretKey')}</label><input type="password" className={inputClass} value={form.s3?.secret_access_key || ''} onChange={e => setForm({ ...form, s3: { ...form.s3!, secret_access_key: e.target.value } })} /></div>
        </div>
      )}

      {form.provider === 'yandex' && (
        <div className="space-y-3">
          <div><label className={labelClass}>{t('integrations.fieldOauthToken')}</label><input type="password" className={inputClass} value={form.yandex?.oauth_token || ''} onChange={e => setForm({ ...form, yandex: { ...form.yandex!, oauth_token: e.target.value } })} /></div>
          <div><label className={labelClass}>{t('integrations.folderPath')}</label><input className={inputClass} value={form.yandex?.folder_path || ''} onChange={e => setForm({ ...form, yandex: { ...form.yandex!, folder_path: e.target.value } })} /></div>
        </div>
      )}

      {form.provider === 'gdrive' && (
        <div className="space-y-3">
          <div><label className={labelClass}>{t('integrations.fieldAccessToken')}</label><input type="password" className={inputClass} value={form.gdrive?.access_token || ''} onChange={e => setForm({ ...form, gdrive: { ...form.gdrive!, access_token: e.target.value } })} /></div>
          <div><label className={labelClass}>{t('integrations.fieldFolderId')}</label><input className={inputClass} value={form.gdrive?.folder_id || ''} onChange={e => setForm({ ...form, gdrive: { ...form.gdrive!, folder_id: e.target.value } })} /></div>
        </div>
      )}

      {form.last_upload_at ? (
        <p className="admin-form-msg--muted">{t('integrations.lastUpload')}: {new Date(form.last_upload_at).toLocaleString()}</p>
      ) : null}
      {form.last_error ? <p className="admin-form-msg--error">{form.last_error}</p> : null}

      <div className="admin-form-actions">
        <button type="button" onClick={handleSave} disabled={saving} className="admin-form-actions-btn admin-form-actions-btn--primary">
          <Save aria-hidden /> {t('integrations.saveSettings')}
        </button>
        <button type="button" onClick={handleTest} className="admin-form-actions-btn admin-form-actions-btn--secondary">
          <TestTube aria-hidden /> {t('integrations.testConnection')}
        </button>
      </div>
      {msg ? <p className="admin-form-msg">{msg}</p> : null}
    </div>
  );
};

interface TelemetrySettingsFormProps {
  settings: TelemetrySettings;
  onSave: (s: TelemetrySettings) => Promise<void>;
}

export const TelemetrySettingsForm: React.FC<TelemetrySettingsFormProps> = ({ settings, onSave }) => {
  const { t } = useI18n();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await onSave(form);
      setMsg(t('integrations.settingsSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMsg('');
    try {
      const result = await ApiService.syncTelemetry();
      setMsg(t('integrations.telemetrySyncOk', { count: result.updated }));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="admin-form-divider space-y-3">
      <h4 className="admin-form-heading">
        <Satellite aria-hidden />
        {t('integrations.telemetryTitle')}
      </h4>
      <p className="admin-form-hint">{t('integrations.telemetrySubtitle')}</p>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
        {t('integrations.enabled')}
      </label>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.sync_carriers} onChange={e => setForm({ ...form, sync_carriers: e.target.checked })} />
        {t('integrations.telemetrySyncCarriers')}
      </label>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.webhook_enabled} onChange={e => setForm({ ...form, webhook_enabled: e.target.checked })} />
        {t('integrations.telemetryWebhook')}
      </label>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.allow_jwt_push} onChange={e => setForm({ ...form, allow_jwt_push: e.target.checked })} />
        {t('integrations.telemetryJwtPush')}
      </label>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.calculate_progress} onChange={e => setForm({ ...form, calculate_progress: e.target.checked })} />
        {t('integrations.telemetryCalcProgress')}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t('integrations.telemetryPollInterval')}</label>
          <input type="number" min={10} className={inputClass} value={form.poll_interval_sec} onChange={e => setForm({ ...form, poll_interval_sec: Number(e.target.value) })} />
        </div>
        <div>
          <label className={labelClass}>{t('integrations.telemetryArrivedThreshold')}</label>
          <input type="number" min={80} max={100} className={inputClass} value={form.arrived_threshold_pct} onChange={e => setForm({ ...form, arrived_threshold_pct: Number(e.target.value) })} />
        </div>
        <div>
          <label className={labelClass}>{t('integrations.telemetryWebhookSecret')}</label>
          <input type="password" className={inputClass} value={form.webhook_secret} onChange={e => setForm({ ...form, webhook_secret: e.target.value })} placeholder="secret..." />
        </div>
        <div>
          <label className={labelClass}>{t('integrations.telemetryIdField')}</label>
          <input className={inputClass} value={form.id_field} onChange={e => setForm({ ...form, id_field: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>{t('integrations.telemetryLatField')}</label>
          <input className={inputClass} value={form.lat_field} onChange={e => setForm({ ...form, lat_field: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>{t('integrations.telemetryLngField')}</label>
          <input className={inputClass} value={form.lng_field} onChange={e => setForm({ ...form, lng_field: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>{t('integrations.telemetrySpeedField')}</label>
          <input className={inputClass} value={form.speed_field} onChange={e => setForm({ ...form, speed_field: e.target.value })} />
        </div>
      </div>

      {form.last_sync_at && (
        <p className="admin-form-msg--muted">
          {t('integrations.telemetryLastSync')}: {new Date(form.last_sync_at).toLocaleString()} ({form.last_updated_count ?? 0})
        </p>
      )}
      {form.last_error ? <p className="admin-form-msg--error">{form.last_error}</p> : null}

      <div className="admin-form-actions">
        <button type="button" onClick={handleSave} disabled={saving} className="admin-form-actions-btn admin-form-actions-btn--primary">
          <Save aria-hidden /> {t('integrations.saveSettings')}
        </button>
        <button type="button" onClick={handleSync} disabled={syncing} className="admin-form-actions-btn admin-form-actions-btn--secondary">
          <TestTube aria-hidden /> {syncing ? t('integrations.telemetrySyncing') : t('integrations.telemetrySyncNow')}
        </button>
      </div>
      {msg ? <p className="admin-form-msg">{msg}</p> : null}
    </div>
  );
};

interface CarrierConfigFormProps {
  carrier: ThirdPartyCarrier;
  onSave: (id: string, data: CarrierSettingsUpdate) => Promise<void>;
}

export const CarrierConfigForm: React.FC<CarrierConfigFormProps> = ({ carrier, onSave }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CarrierSettingsUpdate>({
    api_endpoint: carrier.api_endpoint,
    enabled: carrier.enabled ?? true,
    auth_type: carrier.auth_type || 'bearer',
    sync_path: carrier.sync_path || '',
    id_field: carrier.id_field || 'id',
    status_field: carrier.status_field || 'status',
    lat_field: carrier.lat_field || 'lat',
    lng_field: carrier.lng_field || 'lng',
    speed_field: carrier.speed_field || 'speed_kmh',
    api_key: carrier.api_key_set ? '****' : '',
  });
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setMsg('');
    try {
      await onSave(carrier.id, form);
      setMsg(t('integrations.settingsSaved'));
      setOpen(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    }
  };

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="admin-carrier-config-toggle">
        <Settings2 className="w-3 h-3" /> {t('integrations.configure')}
      </button>
      {open && (
        <div className="admin-carrier-config-panel space-y-2 text-xs">
          <label className="admin-form-check">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
            {t('integrations.enabled')}
          </label>
          <div><label className={labelClass}>{t('integrations.fieldApiEndpoint')}</label><input className={inputClass} value={form.api_endpoint || ''} onChange={e => setForm({ ...form, api_endpoint: e.target.value })} /></div>
          <div><label className={labelClass}>{t('integrations.fieldApiKey')}</label><input type="password" className={inputClass} value={form.api_key || ''} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder={carrier.api_key_set ? '****' : ''} /></div>
          <div>
            <label className={labelClass}>{t('integrations.authType')}</label>
            <select className={inputClass} value={form.auth_type} onChange={e => setForm({ ...form, auth_type: e.target.value as CarrierAuthType })}>
              <option value="bearer">{t('integrations.authBearer')}</option>
              <option value="header">{t('integrations.authHeader')}</option>
              <option value="query">{t('integrations.authQuery')}</option>
              <option value="none">{t('integrations.authNone')}</option>
            </select>
          </div>
          <div><label className={labelClass}>{t('integrations.jsonPath')}</label><input className={inputClass} value={form.sync_path || ''} onChange={e => setForm({ ...form, sync_path: e.target.value })} placeholder="data.shipments" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className={labelClass}>{t('integrations.fieldId')}</label><input className={inputClass} value={form.id_field || ''} onChange={e => setForm({ ...form, id_field: e.target.value })} /></div>
            <div><label className={labelClass}>{t('integrations.fieldStatus')}</label><input className={inputClass} value={form.status_field || ''} onChange={e => setForm({ ...form, status_field: e.target.value })} /></div>
            <div><label className={labelClass}>{t('integrations.fieldLat')}</label><input className={inputClass} value={form.lat_field || ''} onChange={e => setForm({ ...form, lat_field: e.target.value })} /></div>
            <div><label className={labelClass}>{t('integrations.fieldLng')}</label><input className={inputClass} value={form.lng_field || ''} onChange={e => setForm({ ...form, lng_field: e.target.value })} /></div>
            <div><label className={labelClass}>{t('integrations.fieldSpeed')}</label><input className={inputClass} value={form.speed_field || ''} onChange={e => setForm({ ...form, speed_field: e.target.value })} /></div>
          </div>
          {carrier.last_error ? <p className="admin-form-msg--error">{carrier.last_error}</p> : null}
        <button type="button" onClick={handleSave} className="admin-form-actions-btn admin-form-actions-btn--primary">{t('integrations.saveSettings')}</button>
          {msg ? <p className="admin-form-msg">{msg}</p> : null}
        </div>
      )}
    </div>
  );
};

interface MailSettingsFormProps {
  settings: MailSettings;
  onSave: (s: MailSettings) => Promise<void>;
}

export const MailSettingsForm: React.FC<MailSettingsFormProps> = ({ settings, onSave }) => {
  const { t } = useI18n();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState(settings.from_address || '');
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await onSave(form);
      setMsg(t('integrations.settingsSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setMsg('');
    const recipient = testTo.trim() || form.from_address.trim();
    if (!recipient) {
      setMsg(t('integrations.mailTestRecipientRequired'));
      return;
    }
    if (form.mode === 'external') {
      if (!form.smtp_host.trim()) {
        setMsg(t('integrations.mailSmtpHostRequired'));
        return;
      }
      if (!form.smtp_user.trim()) {
        setMsg(t('integrations.mailSmtpUserRequired'));
        return;
      }
      if (!form.smtp_password.trim()) {
        setMsg(t('integrations.mailSmtpPasswordRequired'));
        return;
      }
    }
    try {
      await onSave(form);
      await ApiService.testMail(recipient, form);
      setMsg(t('integrations.testOk'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('integrations.settingsError'));
    }
  };

  return (
    <div className="admin-form-panel space-y-3">
      <h4 className="admin-form-heading">
        <Mail aria-hidden />
        {t('integrations.mailTitle')}
      </h4>
      <p className="admin-form-hint">{t('integrations.mailHint')}</p>

      <label className="admin-form-check">
        <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
        {t('integrations.enabled')}
      </label>

      <label className="admin-form-check">
        <input
          type="checkbox"
          checked={form.registration_enabled}
          onChange={e => setForm({ ...form, registration_enabled: e.target.checked })}
        />
        {t('integrations.mailRegistrationEnabled')}
      </label>

      <div>
        <label className={labelClass}>{t('integrations.mailMode')}</label>
        <div className="admin-segment-group">
          <button
            type="button"
            onClick={() => setForm({ ...form, mode: 'builtin' })}
            className={`admin-segment-btn${form.mode === 'builtin' ? ' is-active' : ''}`}
          >
            {t('integrations.mailModeBuiltin')}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, mode: 'external' })}
            className={`admin-segment-btn${form.mode === 'external' ? ' is-active' : ''}`}
          >
            {t('integrations.mailModeExternal')}
          </button>
        </div>
        <p className="admin-form-msg--muted mt-1">
          {form.mode === 'builtin' ? t('integrations.mailModeBuiltinHint') : t('integrations.mailModeExternalHint')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t('integrations.mailFromName')}</label>
          <input className={inputClass} value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>{t('integrations.mailFromAddress')}</label>
          <input className={inputClass} value={form.from_address} onChange={e => setForm({ ...form, from_address: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{t('integrations.mailPublicBaseUrl')}</label>
          <input
            className={inputClass}
            value={form.public_base_url}
            onChange={e => setForm({ ...form, public_base_url: e.target.value })}
            placeholder="https://logistics.example.com"
          />
        </div>
      </div>

      {form.mode === 'builtin' ? (
        <div className="admin-form-subsection">
          <div>
            <label className={labelClass}>{t('integrations.mailBuiltinHostname')}</label>
            <input
              className={inputClass}
              value={form.builtin_hostname}
              onChange={e => setForm({ ...form, builtin_hostname: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>{t('integrations.mailBuiltinPort')}</label>
            <input
              type="number"
              className={inputClass}
              value={form.builtin_port}
              onChange={e => setForm({ ...form, builtin_port: Number(e.target.value) || 2525 })}
            />
          </div>
        </div>
      ) : (
        <div className="admin-form-subsection">
          <div>
            <label className={labelClass}>{t('integrations.mailSmtpHost')}</label>
            <input className={inputClass} value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{t('integrations.mailSmtpPort')}</label>
            <input
              type="number"
              className={inputClass}
              value={form.smtp_port}
              onChange={e => setForm({ ...form, smtp_port: Number(e.target.value) || 587 })}
            />
          </div>
          <div>
            <label className={labelClass}>{t('integrations.mailSmtpUser')}</label>
            <input className={inputClass} value={form.smtp_user} onChange={e => setForm({ ...form, smtp_user: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{t('integrations.mailSmtpPassword')}</label>
            <input
              type="password"
              className={inputClass}
              value={form.smtp_password}
              onChange={e => setForm({ ...form, smtp_password: e.target.value })}
            />
          </div>
          <label className="admin-form-check sm:col-span-2">
            <input
              type="checkbox"
              checked={form.smtp_secure}
              onChange={e => setForm({ ...form, smtp_secure: e.target.checked })}
            />
            {t('integrations.mailSmtpSecure')}
          </label>
          <p className="admin-form-msg--muted sm:col-span-2">{t('integrations.mailSmtpSecureHint')}</p>
        </div>
      )}

      <div>
        <label className={labelClass}>{t('integrations.mailTestTo')}</label>
        <input className={inputClass} value={testTo} onChange={e => setTestTo(e.target.value)} />
      </div>

      {(form.last_error || form.last_sent_at) ? (
        <div className="admin-form-msg--muted space-y-0.5">
          {form.last_sent_at ? <p>{t('integrations.mailLastSent')}: {form.last_sent_at}</p> : null}
          {form.last_error ? <p className="admin-form-msg--error">{t('integrations.mailLastError')}: {form.last_error}</p> : null}
        </div>
      ) : null}

      <div className="admin-form-actions">
        <button type="button" onClick={handleSave} disabled={saving} className="admin-form-actions-btn admin-form-actions-btn--primary">
          <Save aria-hidden /> {t('integrations.saveSettings')}
        </button>
        <button type="button" onClick={handleTest} className="admin-form-actions-btn admin-form-actions-btn--secondary">
          <TestTube aria-hidden /> {t('integrations.testConnection')}
        </button>
      </div>
      {msg ? <p className="admin-form-msg">{msg}</p> : null}
    </div>
  );
};
