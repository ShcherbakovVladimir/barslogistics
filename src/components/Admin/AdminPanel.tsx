import React, { useState, useEffect } from 'react';
import {
  ThirdPartyCarrier, User, BackupItem, IntegrationSettingsResponse, CarrierSettingsUpdate,
} from '../../types';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAdminSection, type AdminSection } from '../../store/adminSlice';
import { saveAdminScrollBeforeSectionChange, useAdminScroll } from '../../hooks/useAdminScroll';
import {
  Shield, Truck, Satellite, Send, Cloud, Database, Users, Terminal,
  RefreshCw, Copy, LayoutDashboard, Map, BookOpen, MapPin, Mail, LifeBuoy,
} from 'lucide-react';
import { MapDataImportPanel } from './MapDataImportPanel';
import { GeocodingAdminPanel } from './GeocodingAdminPanel';
import { UserManager } from './UserManager';
import { SupportTicketsAdmin } from './SupportTicketsAdmin';
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
  { id: 'sites', icon: BookOpen },
  { id: 'data', icon: Map },
  { id: 'geocoding', icon: MapPin },
  { id: 'api', icon: Terminal },
];

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

  useEffect(() => {
    setTelegramMsg(t('integrations.telegramDefaultMsg'));
  }, [t]);

  useEffect(() => {
    if (integrationSettings?.telegram.default_chat_id) {
      setTelegramChatId(integrationSettings.telegram.default_chat_id);
    }
  }, [integrationSettings]);

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

    const cards = [
      {
        label: t('admin.overview.telemetry'),
        value: tel?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: tel?.last_sync_at
          ? `${new Date(tel.last_sync_at).toLocaleString(localeTag)} · ${tel.last_updated_count ?? 0}`
          : t('admin.neverSynced'),
        color: tel?.enabled ? 'text-cyan-400' : 'text-slate-400',
      },
      {
        label: t('admin.overview.carriers'),
        value: `${connectedCarriers}/${carriers.length}`,
        detail: t('admin.overview.carriersDetail'),
        color: 'text-indigo-400',
      },
      {
        label: t('admin.overview.telegram'),
        value: tg?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: tg?.default_chat_id || '—',
        color: tg?.enabled ? 'text-blue-400' : 'text-slate-400',
      },
      {
        label: t('admin.overview.cloud'),
        value: cloud?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: cloud?.provider?.toUpperCase() || '—',
        color: cloud?.enabled ? 'text-emerald-400' : 'text-slate-400',
      },
      {
        label: t('admin.overview.geocoding'),
        value: geo?.enabled ? t('admin.statusActive') : t('admin.statusInactive'),
        detail: geo?.local_db_settlement_count
          ? `${geo.local_db_settlement_count.toLocaleString(localeTag)} ${t('integrations.kladrSettlements').toLowerCase()}`
          : geo?.kladr_provider === 'external_api'
            ? t('integrations.kladrProviderApi')
            : '—',
        color: geo?.enabled ? 'text-indigo-400' : 'text-slate-400',
      },
      {
        label: t('admin.overview.backups'),
        value: String(backups.length),
        detail: backups[0]
          ? new Date(backups[0].created_at).toLocaleString(localeTag)
          : t('admin.noBackups'),
        color: 'text-amber-400',
      },
      {
        label: t('admin.overview.users'),
        value: String(users.length),
        detail: t('admin.overview.usersDetail'),
        color: 'text-purple-400',
      },
    ];

    return (
      <div className="admin-overview space-y-4">
        <p className="admin-overview-hint text-xs text-slate-400">{t('admin.overviewHint')}</p>
        <div className="admin-overview-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {cards.map(card => (
            <div key={card.label} className="admin-overview-card bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">{card.label}</div>
              <div className={`text-lg font-bold mt-1 ${card.color}`}>{card.value}</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCarriers = () => (
    <div className="admin-carriers-grid grid grid-cols-1 md:grid-cols-2 gap-4">
      {carriers.map(c => (
        <div key={c.id} className="admin-carrier-card bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{getCarrierName(c.id)}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              c.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
              c.enabled === false ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' :
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {(c.status === 'error' ? 'ERROR' : c.enabled === false ? 'OFF' : c.status).toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">{c.api_endpoint || '—'}</p>
          <div className="flex justify-between text-xs text-slate-300">
            <span>{t('integrations.activeShipments', { count: c.active_shipments_count })}</span>
            <span className="text-slate-500">{c.last_sync_status}</span>
          </div>
          {c.last_error && <p className="text-[10px] text-red-400">{c.last_error}</p>}
          <CarrierConfigForm carrier={c} onSave={onSaveCarrierSettings} />
          <button
            onClick={() => onSyncCarrier(c.id)}
            className="admin-carrier-sync-btn w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('integrations.syncNow')}
          </button>
        </div>
      ))}
    </div>
  );

  const renderTelegram = () => (
    <div className="admin-telegram max-w-2xl space-y-4">
      <div className="admin-section-card bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
        <h3 className="font-bold text-white">{t('integrations.telegramTitle')}</h3>
        <div>
          <label className="block text-slate-300 font-semibold mb-1 text-xs">{t('integrations.telegramChatId')}</label>
          <input className="admin-field w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono min-h-[2.75rem] sm:min-h-0" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} />
        </div>
        <div>
          <label className="block text-slate-300 font-semibold mb-1 text-xs">{t('integrations.telegramMessage')}</label>
          <textarea rows={3} className="admin-field w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white min-h-[2.75rem]" value={telegramMsg} onChange={e => setTelegramMsg(e.target.value)} />
        </div>
        <button onClick={() => onSendTelegram(telegramMsg, telegramChatId)} className="admin-form-actions-btn px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 min-h-[2.75rem] sm:min-h-0 w-full sm:w-auto">
          <Send className="w-4 h-4" />
          {t('integrations.telegramSendTest')}
        </button>
      </div>
      {integrationSettings && (
        <div className="admin-section-card bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <TelegramSettingsForm settings={integrationSettings.telegram} onSave={onSaveTelegramSettings} />
        </div>
      )}
    </div>
  );

  const renderMail = () => (
    <div className="admin-mail max-w-3xl">
      {integrationSettings?.mail && (
        <div className="admin-section-card bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <MailSettingsForm settings={integrationSettings.mail} onSave={onSaveMailSettings} />
        </div>
      )}
    </div>
  );

  const renderCloud = () => (
    <div className="admin-cloud max-w-3xl">
      {integrationSettings && (
        <div className="admin-section-card bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <CloudSettingsForm settings={integrationSettings.cloud} onSave={onSaveCloudSettings} />
        </div>
      )}
    </div>
  );

  const renderTelemetry = () => (
    <div className="admin-telemetry max-w-3xl space-y-4">
      <div className="admin-section-card admin-api-snippet bg-slate-900 border border-slate-800 p-5 rounded-2xl font-mono text-xs text-slate-300 space-y-2">
        <div className="text-cyan-400 font-bold">POST /api/telemetry/webhook</div>
        <div>{t('integrations.telemetryWebhookHeader')}: X-Telemetry-Secret</div>
        <button onClick={() => handleCopy(telemetryWebhookSnippet)} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          <Copy className="w-3 h-3" /> {copiedSnippet ? t('integrations.copied') : t('integrations.copyCurl')}
        </button>
      </div>
      {integrationSettings && (
        <div className="admin-section-card bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <TelemetrySettingsForm settings={integrationSettings.telemetry} onSave={onSaveTelemetrySettings} />
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <UserManager users={users} currentUserId={currentUserId} onRefresh={onRefreshUsers} />
  );

  const renderApi = () => (
    <div className="admin-api space-y-4 max-w-4xl">
      <div className="admin-section-card admin-api-snippet bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
          <span className="text-indigo-400 font-bold">PUT /api/supply-links/{'{id}'}/status</span>
          <button onClick={() => handleCopy(curlSnippet)} className="text-slate-400 hover:text-white flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            {copiedSnippet ? t('integrations.copied') : t('integrations.copyCurl')}
          </button>
        </div>
        <pre className="text-slate-300 whitespace-pre-wrap overflow-x-auto">{curlSnippet}</pre>
      </div>
      <div className="admin-api-grid grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {[
          { method: 'GET /api/factories', desc: t('integrations.factoriesApiDesc', { factories: factoriesCount }), color: 'text-emerald-400' },
          { method: 'ws://host/ws?token=<JWT>', desc: t('integrations.wsApiDesc'), color: 'text-blue-400' },
          { method: 'POST /api/telemetry/push', desc: t('integrations.telemetryPushDesc'), color: 'text-cyan-400' },
          { method: 'POST /api/telemetry/webhook', desc: t('integrations.telemetrySubtitle'), color: 'text-purple-400' },
          { method: 'POST /api/map-data/import', desc: t('integrations.mapDataApiCurlDesc'), color: 'text-emerald-400' },
          { method: 'GET /api/carriers', desc: t('carriers.externalIntegrationSubtitle'), color: 'text-teal-400' },
          { method: 'GET /api/carriers/{id}/integration', desc: t('carriers.integrationHint'), color: 'text-cyan-400' },
          { method: 'GET /api/integrations/external', desc: t('carriers.externalIntegrationTitle'), color: 'text-sky-400' },
          { method: 'POST /api/integrations/carriers/sync', desc: t('integrations.syncNow'), color: 'text-indigo-400' },
          { method: 'POST /api/backups/create', desc: t('admin.api.backups'), color: 'text-amber-400' },
          { method: 'GET /api/integrations/settings', desc: t('admin.api.settings'), color: 'text-indigo-400' },
        ].map(item => (
          <div key={item.method} className="admin-api-endpoint-card p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className={`font-bold mb-1 ${item.color}`}>{item.method}</div>
            <div className="text-slate-400">{item.desc}</div>
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
    <div className="admin-panel p-3 sm:p-4 lg:p-6 bg-slate-950 min-h-full text-slate-100">
      <div className="admin-panel-layout flex flex-col lg:flex-row gap-4 lg:gap-6">
        <aside className="admin-sidebar lg:w-56 shrink-0 flex flex-col gap-3 lg:gap-4">
          <div className="admin-sidebar-header bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{t('admin.title')}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">{t('admin.subtitle')}</p>
          </div>
          <nav className="admin-nav flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {SECTIONS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSectionChange(id)}
                className={`admin-nav-btn flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[2.75rem] lg:min-h-0 ${
                  section === id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 lg:border-0'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="admin-nav-btn-label">{t(`admin.sections.${id}`)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="admin-content flex-1 min-w-0 lg:pt-1">
          {section !== 'backups' && (
            <h3 className="admin-section-title text-base font-bold text-white mb-4 sm:mb-5">{t(`admin.sections.${section}`)}</h3>
          )}
          <div className="admin-section-body">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};
