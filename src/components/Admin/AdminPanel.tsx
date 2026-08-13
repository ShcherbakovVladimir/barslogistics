import React, { useState, useEffect, useMemo } from 'react';
import {
  ThirdPartyCarrier, User, BackupItem, IntegrationSettingsResponse, CarrierSettingsUpdate,
} from '../../types';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAdminSection, type AdminSection } from '../../store/adminSlice';
import { saveAdminScrollBeforeSectionChange, useAdminScroll } from '../../hooks/useAdminScroll';
import {
  Shield, Truck, Satellite, Send, Cloud, Database, Users, Terminal,
  RefreshCw, Copy, LayoutDashboard, Map, BookOpen, MapPin, Mail, LifeBuoy, Bug,
} from 'lucide-react';
import { MapDataImportPanel } from './MapDataImportPanel';
import { GeocodingAdminPanel } from './GeocodingAdminPanel';
import { UserManager } from './UserManager';
import { SupportTicketsAdmin } from './SupportTicketsAdmin';
import { ErrorLogsAdmin } from './ErrorLogsAdmin';
import { SiteDirectoryAdmin } from './SiteDirectoryAdmin';
import {
  TelegramSettingsForm, CloudSettingsForm, CarrierConfigForm, TelemetrySettingsForm, MailSettingsForm,
} from '../Integrations/IntegrationAdminForms';
import { BackupManager } from '../Backups/BackupManager';

export type { AdminSection } from '../../store/adminSlice';

interface AdminPanelProps {
  carriers: ThirdPartyCarrier[];
  backups: BackupItem[];
  users: User[];
  integrationSettings: IntegrationSettingsResponse | null;
  onSyncCarrier: (id: string) => void;
  onSendTelegram: (message: string, chatId?: string) => void;
  onSaveTelegramSettings: (settings: IntegrationSettingsResponse['telegram']) => Promise<void>;
  onSaveMailSettings: (settings: IntegrationSettingsResponse['mail']) => Promise<void>;
  onSaveCloudSettings: (settings: IntegrationSettingsResponse['cloud']) => Promise<void>;
  onSaveTelemetrySettings: (settings: IntegrationSettingsResponse['telemetry']) => Promise<void>;
  onSaveCarrierSettings: (id: string, data: CarrierSettingsUpdate) => Promise<void>;
  onCreateBackup: () => Promise<void>;
  onRefreshBackups: () => void;
  onSaveMapDataSettings: (settings: IntegrationSettingsResponse['mapData']) => Promise<IntegrationSettingsResponse['mapData']>;
  onSaveGeocodingSettings: (settings: IntegrationSettingsResponse['geocoding']) => Promise<IntegrationSettingsResponse['geocoding']>;
  onMapDataImported: () => Promise<void>;
  currentUserId: string;
  onRefreshUsers: () => Promise<void>;
  onSitesChanged: () => Promise<void>;
  factoriesCount: number;
  focusSupportTicketId?: string | null;
  onFocusSupportTicketConsumed?: () => void;
}

const CARRIER_I18N_KEYS: Record<string, string> = {
  c_rzd: 'rzd',
  c_dellin: 'dellin',
  c_fesco: 'fesco',
  c_pgk: 'pgk',
};

const SECTIONS: { id: AdminSection; icon: React.ElementType }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'carriers', icon: Truck },
  { id: 'telemetry', icon: Satellite },
  { id: 'telegram', icon: Send },
  { id: 'mail', icon: Mail },
  { id: 'cloud', icon: Cloud },
  { id: 'backups', icon: Database },
  { id: 'users', icon: Users },
  { id: 'support', icon: LifeBuoy },
  { id: 'errors', icon: Bug },
  { id: 'sites', icon: BookOpen },
  { id: 'data', icon: Map },
  { id: 'geocoding', icon: MapPin },
  { id: 'api', icon: Terminal },
];

type OverviewValueTone = 'active' | 'inactive' | 'indigo' | 'amber' | 'purple' | 'emerald';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  carriers,
  backups,
  users,
  integrationSettings,
  onSyncCarrier,
  onSendTelegram,
  onSaveTelegramSettings,
  onSaveMailSettings,
  onSaveCloudSettings,
  onSaveTelemetrySettings,
  onSaveCarrierSettings,
  onCreateBackup,
  onRefreshBackups,
  onSaveMapDataSettings,
  onSaveGeocodingSettings,
  onMapDataImported,
  currentUserId,
  onRefreshUsers,
  onSitesChanged,
  factoriesCount,
  focusSupportTicketId,
  onFocusSupportTicketConsumed,
}) => {
  const { t, localeTag } = useI18n();
  const dispatch = useAppDispatch();
  const section = useAppSelector(state => state.admin.section);
  useAdminScroll(section);

  const handleSectionChange = (next: AdminSection) => {
    if (next === section) return;
    saveAdminScrollBeforeSectionChange(section, dispatch);
    dispatch(setAdminSection(next));
  };

  const [telegramMsg, setTelegramMsg] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('@logistics_alerts_bot');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const sectionMeta = useMemo(
    () => SECTIONS.find(s => s.id === section) ?? SECTIONS[0],
    [section],
  );

  useEffect(() => {
    setTelegramMsg(t('integrations.telegramDefaultMsg'));
  }, [t]);

  useEffect(() => {
    if (integrationSettings?.telegram.default_chat_id) {
      setTelegramChatId(integrationSettings.telegram.default_chat_id);
    }
  }, [integrationSettings]);

  if (!sectionMeta) return null;
  const SectionIcon = sectionMeta.icon;

  const getCarrierName = (carrierId: string) => {
    const key = CARRIER_I18N_KEYS[carrierId];
    return key ? t(`integrations.carriers.${key}`) : carriers.find(c => c.id === carrierId)?.name || '';
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const curlSnippet = `curl -X PUT "https://barslogistics.almaz-t.ru/api/supply-links/{id}/status" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -d '{"status": "delayed", "delay_reason": "${t('integrations.curlDelayReason')}"}'`;

  const telemetryWebhookSnippet = `curl -X POST "https://barslogistics.almaz-t.ru/api/telemetry/webhook" \\
  -H "Content-Type: application/json" \\
  -H "X-Telemetry-Secret: <SECRET>" \\
  -d '{"points":[{"shipment_id":"...","lat":55.75,"lng":37.62,"speed_kmh":68}]}'`;

  const renderOverview = () => {
    const tel = integrationSettings?.telemetry;
    const cloud = integrationSettings?.cloud;
    const tg = integrationSettings?.telegram;
    const geo = integrationSettings?.geocoding;
    const connectedCarriers = carriers.filter(c => c.enabled !== false && c.status !== 'error').length;

    const cards: { label: string; value: string; detail: string; tone: OverviewValueTone }[] = [
      {
        label: t('admin.overview.telemetry'),
        value: tel?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: tel?.last_sync_at
          ? `${new Date(tel.last_sync_at).toLocaleString(localeTag)} · ${tel.last_updated_count ?? 0}`
          : t('admin.neverSynced'),
        tone: tel?.enabled ? 'active' : 'inactive',
      },
      {
        label: t('admin.overview.carriers'),
        value: `${connectedCarriers}/${carriers.length}`,
        detail: t('admin.overview.carriersDetail'),
        tone: 'indigo',
      },
      {
        label: t('admin.overview.telegram'),
        value: tg?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: tg?.default_chat_id || '—',
        tone: tg?.enabled ? 'active' : 'inactive',
      },
      {
        label: t('admin.overview.cloud'),
        value: cloud?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: cloud?.provider?.toUpperCase() || '—',
        tone: cloud?.enabled ? 'emerald' : 'inactive',
      },
      {
        label: t('admin.overview.geocoding'),
        value: geo?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: geo?.local_db_settlement_count
          ? `${geo.local_db_settlement_count.toLocaleString(localeTag)} ${t('integrations.kladrSettlements').toLowerCase()}`
          : geo?.kladr_provider === 'external_api'
            ? t('integrations.kladrProviderApi')
            : '—',
        tone: geo?.enabled ? 'indigo' : 'inactive',
      },
      {
        label: t('admin.overview.backups'),
        value: String(backups.length),
        detail: backups[0]
          ? new Date(backups[0].created_at).toLocaleString(localeTag)
          : t('admin.noBackups'),
        tone: 'amber',
      },
      {
        label: t('admin.overview.users'),
        value: String(users.length),
        detail: t('admin.overview.usersDetail'),
        tone: 'purple',
      },
    ];

    return (
      <div className="admin-overview">
        <p className="admin-overview-hint">{t('admin.overviewHint')}</p>
        <div className="admin-overview-grid">
          {cards.map(card => (
            <div key={card.label} className="admin-overview-card">
              <div className="admin-overview-card-label">{card.label}</div>
              <div className={`admin-overview-card-value admin-overview-card-value--${card.tone}`}>{card.value}</div>
              <div className="admin-overview-card-detail">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCarriers = () => (
    <div className="admin-carriers-grid">
      {carriers.map(c => {
        const statusClass =
          c.status === 'error' ? 'admin-carrier-status--error'
          : c.enabled === false ? 'admin-carrier-status--off'
          : 'admin-carrier-status--ok';
        const statusLabel = (c.status === 'error' ? 'ERROR' : c.enabled === false ? 'OFF' : c.status).toUpperCase();

        return (
          <div key={c.id} className="admin-carrier-card">
            <div className="admin-carrier-card-head">
              <h3 className="admin-carrier-card-title">{getCarrierName(c.id)}</h3>
              <span className={`admin-carrier-status ${statusClass}`}>{statusLabel}</span>
            </div>
            <p className="admin-carrier-endpoint">{c.api_endpoint || '—'}</p>
            <div className="admin-carrier-meta">
              <span>{t('integrations.activeShipments', { count: c.active_shipments_count })}</span>
              <span className="admin-carrier-meta-muted">{c.last_sync_status}</span>
            </div>
            {c.last_error ? <p className="admin-carrier-error">{c.last_error}</p> : null}
            <CarrierConfigForm carrier={c} onSave={onSaveCarrierSettings} />
            <button
              type="button"
              onClick={() => onSyncCarrier(c.id)}
              className="admin-carrier-sync-btn"
            >
              <RefreshCw />
              {t('integrations.syncNow')}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderTelegram = () => (
    <div className="admin-telegram admin-form-panel max-w-2xl space-y-4">
      <div className="admin-section-card space-y-3">
        <h3 className="admin-form-heading">
          <Send />
          {t('integrations.telegramTitle')}
        </h3>
        <div>
          <label className="admin-form-label">{t('integrations.telegramChatId')}</label>
          <input className="admin-field admin-form-field font-mono min-h-[2.75rem] sm:min-h-0" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} />
        </div>
        <div>
          <label className="admin-form-label">{t('integrations.telegramMessage')}</label>
          <textarea rows={3} className="admin-field admin-form-field min-h-[2.75rem]" value={telegramMsg} onChange={e => setTelegramMsg(e.target.value)} />
        </div>
        <button type="button" onClick={() => onSendTelegram(telegramMsg, telegramChatId)} className="admin-form-actions-btn admin-form-actions-btn--send w-full sm:w-auto">
          <Send />
          {t('integrations.telegramSendTest')}
        </button>
      </div>
      {integrationSettings ? (
        <div className="admin-section-card">
          <TelegramSettingsForm settings={integrationSettings.telegram} onSave={onSaveTelegramSettings} />
        </div>
      ) : null}
    </div>
  );

  const renderMail = () => (
    <div className="admin-mail admin-form-panel max-w-3xl">
      {integrationSettings?.mail ? (
        <div className="admin-section-card">
          <MailSettingsForm settings={integrationSettings.mail} onSave={onSaveMailSettings} />
        </div>
      ) : null}
    </div>
  );

  const renderCloud = () => (
    <div className="admin-cloud admin-form-panel max-w-3xl">
      {integrationSettings ? (
        <div className="admin-section-card">
          <CloudSettingsForm settings={integrationSettings.cloud} onSave={onSaveCloudSettings} />
        </div>
      ) : null}
    </div>
  );

  const renderTelemetry = () => (
    <div className="admin-telemetry admin-form-panel max-w-3xl space-y-4">
      <div className="admin-section-card admin-api-snippet space-y-2">
        <div className="admin-api-snippet-title admin-api-snippet-title--cyan">POST /api/telemetry/webhook</div>
        <div>{t('integrations.telemetryWebhookHeader')}: X-Telemetry-Secret</div>
        <button type="button" onClick={() => handleCopy(telemetryWebhookSnippet)} className="admin-api-copy-btn">
          <Copy /> {copiedSnippet ? t('integrations.copied') : t('integrations.copyCurl')}
        </button>
      </div>
      {integrationSettings ? (
        <div className="admin-section-card">
          <TelemetrySettingsForm settings={integrationSettings.telemetry} onSave={onSaveTelemetrySettings} />
        </div>
      ) : null}
    </div>
  );

  const renderUsers = () => (
    <UserManager users={users} currentUserId={currentUserId} onRefresh={onRefreshUsers} />
  );

  const renderApi = () => (
    <div className="admin-api space-y-4 max-w-4xl">
      <div className="admin-section-card admin-api-snippet">
        <div className="admin-api-snippet-head">
          <span className="admin-api-snippet-title">PUT /api/supply-links/{'{id}'}/status</span>
          <button type="button" onClick={() => handleCopy(curlSnippet)} className="admin-api-copy-btn">
            <Copy />
            {copiedSnippet ? t('integrations.copied') : t('integrations.copyCurl')}
          </button>
        </div>
        <pre>{curlSnippet}</pre>
      </div>
      <div className="admin-api-grid">
        {([
          { method: 'GET /api/factories', desc: t('integrations.factoriesApiDesc', { factories: factoriesCount }), tone: 'emerald' },
          { method: 'ws://host/ws?token=<JWT>', desc: t('integrations.wsApiDesc'), tone: 'blue' },
          { method: 'POST /api/telemetry/push', desc: t('integrations.telemetryPushDesc'), tone: 'cyan' },
          { method: 'POST /api/telemetry/webhook', desc: t('integrations.telemetrySubtitle'), tone: 'purple' },
          { method: 'POST /api/map-data/import', desc: t('integrations.mapDataApiCurlDesc'), tone: 'emerald' },
          { method: 'GET /api/carriers', desc: t('carriers.externalIntegrationSubtitle'), tone: 'teal' },
          { method: 'GET /api/carriers/{id}/integration', desc: t('carriers.integrationHint'), tone: 'cyan' },
          { method: 'GET /api/integrations/external', desc: t('carriers.externalIntegrationTitle'), tone: 'sky' },
          { method: 'POST /api/integrations/carriers/sync', desc: t('integrations.syncNow'), tone: 'indigo' },
          { method: 'POST /api/backups/create', desc: t('admin.api.backups'), tone: 'amber' },
          { method: 'GET /api/integrations/settings', desc: t('admin.api.settings'), tone: 'indigo' },
        ] as const).map(item => (
          <div key={item.method} className="admin-api-endpoint-card">
            <div className={`admin-api-endpoint-method admin-api-endpoint-method--${item.tone}`}>{item.method}</div>
            <div className="admin-api-endpoint-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSection = () => {
    switch (section) {
      case 'overview': return renderOverview();
      case 'carriers': return renderCarriers();
      case 'telemetry': return renderTelemetry();
      case 'telegram': return renderTelegram();
      case 'mail': return renderMail();
      case 'cloud': return renderCloud();
      case 'backups':
        return (
          <BackupManager
            backups={backups}
            onCreateBackup={onCreateBackup}
            currentUserRole="admin"
            onRefresh={onRefreshBackups}
            embedded
          />
        );
      case 'users': return renderUsers();
      case 'support':
        return (
          <SupportTicketsAdmin
            focusTicketId={focusSupportTicketId}
            onFocusTicketConsumed={onFocusSupportTicketConsumed}
          />
        );
      case 'errors':
        return <ErrorLogsAdmin />;
      case 'sites':
        return <SiteDirectoryAdmin onSitesChanged={onSitesChanged} />;
      case 'data':
        return (
          <MapDataImportPanel
            settings={integrationSettings?.mapData ?? null}
            onSaveSettings={onSaveMapDataSettings}
            onImported={onMapDataImported}
          />
        );
      case 'geocoding':
        return (
          <GeocodingAdminPanel
            settings={integrationSettings?.geocoding ?? null}
            onSaveSettings={onSaveGeocodingSettings}
          />
        );
      case 'api': return renderApi();
      default: return null;
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h2>
              <Shield />
              <span className="truncate">{t('admin.title')}</span>
            </h2>
            <p className="admin-sidebar-subtitle">{t('admin.subtitle')}</p>
          </div>
          <nav className="admin-nav" aria-label={t('admin.title')}>
            {SECTIONS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSectionChange(id)}
                className={`admin-nav-btn${section === id ? ' is-active' : ''}`}
              >
                <Icon aria-hidden />
                <span className="admin-nav-btn-label">{t(`admin.sections.${id}`)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="admin-content">
          <div className="admin-section-chrome shipments-list-toolbar">
            <div className="shipments-list-toolbar-head">
              <span className="shipments-list-toolbar-icon" aria-hidden>
                <SectionIcon />
              </span>
              <div className="shipments-list-toolbar-text">
                <h2 className="shipments-list-title">{t(`admin.sections.${section}`)}</h2>
              </div>
            </div>
          </div>
          <div className="admin-section-body">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};
