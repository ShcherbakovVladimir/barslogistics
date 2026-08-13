import { Factory, SupplyLink, EventLog, ErrorLog, ErrorLogFilters, User, BackupItem, ThirdPartyCarrier, IntegrationSettingsResponse, TelegramSettings, CloudSettings, TelemetrySettings, CarrierSettingsUpdate, MapDataSettings, MapDataImportResult, MapDataImportPayload, GeocodingSettings, GeocodingTestResult, KladrLocalImportStatus, KladrSuggestion, AddressGeocodeResult, UserCreateInput, UserUpdateInput, SiteCategoryInfo, SiteDuplicatesReport, SiteMergeDuplicatesResult, ShipmentEvent, ShipmentEventInput, Product, ProductInput, CarrierInput, CarrierIntegrationSpec, RzdAnalyticsSummary, RzdAggregatedRoute, RzdAnalyticsRecord, RzdAnalyticsFilters, RzdImportBatch, RzdImportResult, ShipmentImportBatch, ShipmentImportResult, ShipmentCsvPreviewResult, SalesManager, SalesManagerInput, MailSettings, DbMaintenanceInfo, MigrationDashboard, ChatUserDirectoryEntry, ChatConversationSummary, ChatMessage, NotificationItem, KanbanBoard, KanbanBoardDetail, KanbanBoardType, KanbanClassOfService, KanbanColumn, KanbanSwimlane, KanbanTask, KanbanTaskWorkspace, KanbanTaskMessage, KanbanTaskMilestone, KanbanTaskAttachment, KanbanMilestoneStatus, ShipmentDocument, ShipmentDocumentType, SupportTicket, SupportTicketCategory, SupportTicketStatus, TransportAsset, TransportAssetInput } from '../types';
import { getApiBase, getAuthToken, isPortalEmbed } from '../auth/portalAuth';

const TOKEN_KEY = 'barslogistics_token';

export class ApiService {
  private static locale = 'ru';
  private static onUnauthorized: (() => void) | null = null;
  /** In-memory portal JWT (sessionStorage still used for standalone). */
  private static memoryToken: string | null = null;

  static setLocale(locale: string) {
    this.locale = locale;
  }

  static setOnUnauthorized(handler: () => void) {
    this.onUnauthorized = handler;
  }

  static getApiBase(): string {
    return getApiBase();
  }

  static getToken(): string | null {
    return this.memoryToken || sessionStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string | null) {
    this.memoryToken = token;
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  static async resolveToken(): Promise<string | null> {
    if (isPortalEmbed()) {
      const portalToken = await getAuthToken();
      if (portalToken) {
        this.memoryToken = portalToken;
        return portalToken;
      }
    }
    return this.getToken();
  }

  private static async headers(extra?: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Accept-Language': this.locale,
      Accept: 'application/json',
      ...extra,
    };
    const token = await this.resolveToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private static apiUrl(path: string): string {
    const base = this.getApiBase().replace(/\/$/, '');
    // Call sites still use `/api/...` relative paths via `this.baseUrl`.
    const rest = path.startsWith('/api') ? path.slice('/api'.length) : path.startsWith('/') ? path : `/${path}`;
    return `${base}${rest}`;
  }

  /** Relative API prefix used by method paths (resolved against getApiBase()). */
  private static get baseUrl(): string {
    return '/api';
  }

  private static async request<T>(
    path: string,
    init?: RequestInit,
    options?: { suppressUnauthorized?: boolean },
  ): Promise<T> {
    const url = path.startsWith('http') ? path : this.apiUrl(path);
    const headers = await this.headers(init?.headers as Record<string, string> | undefined);
    const res = await fetch(url, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      if (!isPortalEmbed()) {
        this.setToken(null);
      }
      if (!options?.suppressUnauthorized) {
        this.onUnauthorized?.();
      }
      throw new Error('Unauthorized');
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || `Request failed: ${res.status}`);
    }
    return json;
  }

  static async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(this.apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: await this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || 'Login failed');
    }
    this.setToken(json.data.token);
    return json.data;
  }

  /** AD portal login — auto-provisions user via ensurePortalUser (NOT /auth/register). */
  static async loginViaPortal(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(this.apiUrl('/api/auth/portal/login'), {
      method: 'POST',
      headers: await this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || 'Portal login failed');
    }
    this.setToken(json.data.token);
    return json.data;
  }

  /** Validate portal JWT and ensure local user exists (embed / bars-portal plugin). */
  static async syncPortalSession(): Promise<User> {
    const json = await this.request<{ status: string; data: { user: User } }>(
      `${this.baseUrl}/auth/portal/sync`,
      { method: 'POST', body: '{}' },
    );
    return json.data.user;
  }

  private static async publicAuthRequest<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.apiUrl(`/api${path}`), {
      method: 'POST',
      headers: await this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || `Request failed: ${res.status}`);
    }
    return json.data as T;
  }

  static async getRegistrationStatus(): Promise<{ registration_enabled: boolean }> {
    const res = await fetch(this.apiUrl('/api/auth/registration-status'), {
      headers: await this.headers(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { registration_enabled: false };
    return json.data || { registration_enabled: false };
  }

  static async register(input: {
    username: string;
    name: string;
    email: string;
    password: string;
  }): Promise<{ message: string }> {
    return this.publicAuthRequest('/auth/register', input);
  }

  static async confirmEmail(token: string): Promise<{ message: string; account_status?: string }> {
    return this.publicAuthRequest('/auth/confirm-email', { token });
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    return this.publicAuthRequest('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.publicAuthRequest('/auth/reset-password', { token, password });
  }

  static async getMe(): Promise<User | null> {
    try {
      const json = await this.request<{ status: string; data: User }>(
        `${this.baseUrl}/auth/me`,
        undefined,
        { suppressUnauthorized: true },
      );
      return json.data;
    } catch {
      return null;
    }
  }

  static async updateMe(input: {
    name?: string;
    telegram_chat_id?: string | null;
    notifications_enabled?: boolean;
  }): Promise<User> {
    const json = await this.request<{ status: string; data: User }>(`${this.baseUrl}/auth/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async requestMyPasswordReset(): Promise<{ message: string }> {
    const json = await this.request<{ status: string; data: { message: string } }>(
      `${this.baseUrl}/auth/me/request-password-reset`,
      { method: 'POST' },
    );
    return json.data;
  }

  static logout() {
    this.setToken(null);
  }

  static async getFactories(options?: { all?: boolean; page?: number; limit?: number; search?: string }): Promise<Factory[]> {
    const params = new URLSearchParams();
    if (options?.all) params.set('all', 'true');
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.search) params.set('search', options.search);
    const qs = params.toString();
    const json = await this.request<{ status: string; data: Factory[] }>(
      `${this.baseUrl}/factories${qs ? `?${qs}` : ''}`,
    );
    return json.data;
  }

  static async getFactoriesPaginated(options: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Factory[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }> {
    const params = new URLSearchParams();
    params.set('page', String(options.page ?? 1));
    params.set('limit', String(options.limit ?? 50));
    if (options.search) params.set('search', options.search);
    const json = await this.request<{
      status: string;
      data: Factory[];
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`${this.baseUrl}/factories?${params}`);
    return { data: json.data, pagination: json.pagination };
  }

  static async getMapBootstrap(): Promise<{ factories: Factory[]; supplyLinks: SupplyLink[] }> {
    const json = await this.request<{
      status: string;
      data: { factories: Factory[]; supplyLinks: SupplyLink[] };
    }>(`${this.baseUrl}/map/bootstrap`);
    return json.data;
  }

  static async createFactory(factory: Factory): Promise<Factory> {
    const json = await this.request<{ status: string; data: Factory }>(`${this.baseUrl}/factories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factory),
    });
    return json.data;
  }

  static async updateFactory(id: string, factory: Partial<Factory>): Promise<Factory> {
    const json = await this.request<{ status: string; data: Factory }>(`${this.baseUrl}/factories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factory),
    });
    return json.data;
  }

  static async deleteFactory(id: string): Promise<void> {
    await this.request(`${this.baseUrl}/factories/${id}`, { method: 'DELETE' });
  }

  static async getSiteCategories(): Promise<SiteCategoryInfo[]> {
    const json = await this.request<{ status: string; data: SiteCategoryInfo[] }>(`${this.baseUrl}/site-categories`);
    return json.data;
  }

  static async getSitesAdmin(): Promise<Factory[]> {
    const json = await this.request<{ status: string; data: Factory[] }>(`${this.baseUrl}/sites/admin`);
    return json.data;
  }

  static async getSiteDuplicatesReport(): Promise<SiteDuplicatesReport> {
    const json = await this.request<{ status: string; data: SiteDuplicatesReport }>(
      `${this.baseUrl}/sites/duplicates`,
    );
    return json.data;
  }

  static async mergeSiteDuplicates(): Promise<SiteMergeDuplicatesResult> {
    const json = await this.request<{ status: string; data: SiteMergeDuplicatesResult }>(
      `${this.baseUrl}/sites/merge-duplicates`,
      { method: 'POST' },
    );
    return json.data;
  }

  static async getSupplyLinks(options?: { all?: boolean; page?: number; limit?: number; search?: string; status?: string }): Promise<SupplyLink[]> {
    const params = new URLSearchParams();
    if (options?.all) params.set('all', 'true');
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.search) params.set('search', options.search);
    if (options?.status) params.set('status', options.status);
    const qs = params.toString();
    const json = await this.request<{ status: string; data: SupplyLink[] }>(
      `${this.baseUrl}/supply-links${qs ? `?${qs}` : ''}`,
    );
    return json.data;
  }

  static async getSupplyLinksPaginated(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: SupplyLink[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }> {
    const params = new URLSearchParams();
    params.set('page', String(options.page ?? 1));
    params.set('limit', String(options.limit ?? 50));
    if (options.search) params.set('search', options.search);
    if (options.status) params.set('status', options.status);
    const json = await this.request<{
      status: string;
      data: SupplyLink[];
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`${this.baseUrl}/supply-links?${params}`);
    return { data: json.data, pagination: json.pagination };
  }

  static async updateShipmentStatus(id: string, status: string, delayReason?: string): Promise<SupplyLink> {
    const json = await this.request<{ status: string; data: SupplyLink }>(
      `${this.baseUrl}/supply-links/${id}/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, delay_reason: delayReason }),
      }
    );
    return json.data;
  }

  static async updateShipment(id: string, payload: Record<string, unknown>): Promise<SupplyLink> {
    const json = await this.request<{ status: string; data: SupplyLink }>(
      `${this.baseUrl}/supply-links/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    return json.data;
  }

  static async getShipmentEvents(shipmentId: string): Promise<ShipmentEvent[]> {
    const json = await this.request<{ status: string; data: ShipmentEvent[] }>(
      `${this.baseUrl}/shipments/${shipmentId}/events`,
    );
    return json.data;
  }

  static async createShipmentEvent(
    shipmentId: string,
    input: ShipmentEventInput,
  ): Promise<{ event: ShipmentEvent; shipment: SupplyLink }> {
    const json = await this.request<{ status: string; data: { event: ShipmentEvent; shipment: SupplyLink } }>(
      `${this.baseUrl}/shipments/${shipmentId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async getRecentShipmentEvents(limit = 50): Promise<ShipmentEvent[]> {
    const json = await this.request<{ status: string; data: ShipmentEvent[] }>(
      `${this.baseUrl}/shipments/events/recent?limit=${limit}`,
    );
    return json.data;
  }

  static async getShipmentDocuments(shipmentId: string): Promise<ShipmentDocument[]> {
    const json = await this.request<{ status: string; data: ShipmentDocument[] }>(
      `${this.baseUrl}/shipments/${encodeURIComponent(shipmentId)}/documents`,
    );
    return json.data;
  }

  static async uploadShipmentDocument(
    shipmentId: string,
    file: File,
    options?: { doc_type?: ShipmentDocumentType; note?: string },
  ): Promise<ShipmentDocument> {
    const form = new FormData();
    form.append('file', file);
    if (options?.doc_type) form.append('doc_type', options.doc_type);
    if (options?.note) form.append('note', options.note);
    const headers = await this.headers();
    const res = await fetch(
      this.apiUrl(`${this.baseUrl}/shipments/${encodeURIComponent(shipmentId)}/documents`),
      { method: 'POST', headers, body: form },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Upload failed: ${res.status}`);
    return json.data;
  }

  static async downloadShipmentDocument(documentId: string, filename: string): Promise<void> {
    const headers = await this.headers();
    const res = await fetch(
      this.apiUrl(`${this.baseUrl}/shipments/documents/${encodeURIComponent(documentId)}/download`),
      { headers },
    );
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async deleteShipmentDocument(documentId: string): Promise<void> {
    await this.request(`${this.baseUrl}/shipments/documents/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
    });
  }

  static async updateShipmentLogistics(
    shipmentId: string,
    payload: Record<string, unknown>,
  ): Promise<SupplyLink> {
    const json = await this.request<{ status: string; data: SupplyLink }>(
      `${this.baseUrl}/shipments/${encodeURIComponent(shipmentId)}/logistics`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    return json.data;
  }

  static async getLogs(): Promise<EventLog[]> {
    const json = await this.request<{ status: string; data: EventLog[] }>(`${this.baseUrl}/logs`);
    return json.data;
  }

  static async getUsers(): Promise<User[]> {
    const json = await this.request<{ status: string; data: User[] }>(`${this.baseUrl}/users`);
    return json.data;
  }

  static async createUser(input: UserCreateInput): Promise<User> {
    const json = await this.request<{ status: string; data: User }>(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async updateUser(id: string, input: UserUpdateInput): Promise<User> {
    const json = await this.request<{ status: string; data: User }>(`${this.baseUrl}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async deleteUser(id: string): Promise<void> {
    await this.request(`${this.baseUrl}/users/${id}`, { method: 'DELETE' });
  }

  static async approveUser(id: string): Promise<User> {
    const json = await this.request<{ status: string; data: User }>(`${this.baseUrl}/users/${id}/approve`, {
      method: 'POST',
    });
    return json.data;
  }

  static async rejectUser(id: string): Promise<User> {
    const json = await this.request<{ status: string; data: User }>(`${this.baseUrl}/users/${id}/reject`, {
      method: 'POST',
    });
    return json.data;
  }

  static async uploadUserAvatar(id: string, file: File): Promise<User> {
    const form = new FormData();
    form.append('file', file);
    const headers = await this.headers();
    delete headers['Content-Type'];
    const res = await fetch(this.apiUrl(`${this.baseUrl}/users/${id}/avatar`), {
      method: 'POST',
      headers,
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Avatar upload failed');
    return json.data as User;
  }

  static async deleteUserAvatar(id: string): Promise<User> {
    const json = await this.request<{ status: string; data: User }>(`${this.baseUrl}/users/${id}/avatar`, {
      method: 'DELETE',
    });
    return json.data;
  }

  /** Authenticated avatar fetch → object URL for <img>. */
  static async fetchUserAvatarObjectUrl(id: string, version?: string | null): Promise<string | null> {
    const qs = version ? `?v=${encodeURIComponent(version)}` : '';
    const headers = await this.headers();
    delete headers.Accept;
    const res = await fetch(this.apiUrl(`${this.baseUrl}/users/${id}/avatar${qs}`), { headers });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size) return null;
    return URL.createObjectURL(blob);
  }

  static async getBackups(): Promise<BackupItem[]> {
    const json = await this.request<{ status: string; data: BackupItem[] }>(`${this.baseUrl}/backups`);
    return json.data;
  }

  static async createBackup(): Promise<BackupItem> {
    const res = await fetch(this.apiUrl(`${this.baseUrl}/backups/create`), {
      method: 'POST',
      headers: await this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((json as { error?: string }).error || 'Backup failed');
    }
    return (json as { data: BackupItem }).data;
  }

  static async downloadBackup(id: string, filename: string): Promise<void> {
    const res = await fetch(this.apiUrl(`${this.baseUrl}/backups/${id}/download`), {
      headers: await this.headers(),
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async uploadBackupToCloud(id: string): Promise<void> {
    await this.request(`${this.baseUrl}/backups/${id}/upload-cloud`, { method: 'POST' });
  }

  static async restoreBackup(id: string): Promise<void> {
    await this.request(`${this.baseUrl}/backups/${id}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'RESTORE' }),
    });
  }

  static async getDbMaintenance(): Promise<DbMaintenanceInfo> {
    const json = await this.request<{ status: string; data: DbMaintenanceInfo }>(`${this.baseUrl}/db/maintenance`);
    return json.data;
  }

  static async applyPendingMigrations(): Promise<{ applied: string[]; skipped: string[]; migrations: MigrationDashboard }> {
    const json = await this.request<{
      status: string;
      data: { applied: string[]; skipped: string[]; migrations: MigrationDashboard };
    }>(`${this.baseUrl}/db/migrations/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'APPLY' }),
    });
    return json.data;
  }

  static async rollbackLastMigration(): Promise<{ rolled_back: string | null; message: string; migrations: MigrationDashboard }> {
    const json = await this.request<{
      status: string;
      data: { rolled_back: string | null; message: string; migrations: MigrationDashboard };
    }>(`${this.baseUrl}/db/migrations/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'ROLLBACK' }),
    });
    return json.data;
  }

  static async getChatUsers(): Promise<ChatUserDirectoryEntry[]> {
    const json = await this.request<{ status: string; data: ChatUserDirectoryEntry[] }>(
      `${this.baseUrl}/chat/users`,
    );
    return json.data;
  }

  static async getChatConversations(): Promise<ChatConversationSummary[]> {
    const json = await this.request<{ status: string; data: ChatConversationSummary[] }>(
      `${this.baseUrl}/chat/conversations`,
    );
    return json.data;
  }

  static async openChatConversation(peerId: string): Promise<{ conversation_id: string; messages: ChatMessage[] }> {
    const json = await this.request<{
      status: string;
      data: { conversation_id: string; messages: ChatMessage[] };
    }>(`${this.baseUrl}/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peer_id: peerId }),
    });
    return json.data;
  }

  static async getChatMessages(conversationId: string, limit = 50): Promise<ChatMessage[]> {
    const json = await this.request<{ status: string; data: ChatMessage[] }>(
      `${this.baseUrl}/chat/conversations/${conversationId}/messages?limit=${limit}`,
    );
    return json.data;
  }

  static async sendChatMessage(conversationId: string, body: string): Promise<ChatMessage> {
    const json = await this.request<{ status: string; data: ChatMessage }>(
      `${this.baseUrl}/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      },
    );
    return json.data;
  }

  static async sendChatFile(conversationId: string, file: File, body?: string): Promise<ChatMessage> {
    const form = new FormData();
    form.append('file', file);
    if (body) form.append('body', body);
    const headers = await this.headers();
    delete headers['Content-Type'];
    const res = await fetch(this.apiUrl(`${this.baseUrl}/chat/conversations/${conversationId}/attachments`), {
      method: 'POST',
      headers,
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Upload failed');
    return json.data;
  }

  static async markChatRead(conversationId: string): Promise<void> {
    await this.request(`${this.baseUrl}/chat/conversations/${conversationId}/read`, { method: 'POST' });
  }

  static async getNotifications(limit = 80): Promise<{ items: NotificationItem[]; unread: number }> {
    const json = await this.request<{ status: string; data: { items: NotificationItem[]; unread: number } }>(
      `${this.baseUrl}/notifications?limit=${limit}`,
    );
    return json.data;
  }

  static async markNotificationRead(id: string): Promise<NotificationItem> {
    const json = await this.request<{ status: string; data: NotificationItem }>(
      `${this.baseUrl}/notifications/${id}/read`,
      { method: 'POST' },
    );
    return json.data;
  }

  static async markAllNotificationsRead(): Promise<NotificationItem[]> {
    const json = await this.request<{ status: string; data: { items: NotificationItem[] } }>(
      `${this.baseUrl}/notifications/read-all`,
      { method: 'POST' },
    );
    return json.data.items;
  }

  static async deleteNotification(id: string): Promise<NotificationItem> {
    const json = await this.request<{ status: string; data: NotificationItem }>(
      `${this.baseUrl}/notifications/${id}`,
      { method: 'DELETE' },
    );
    return json.data;
  }

  static async clearAllNotifications(): Promise<void> {
    await this.request(`${this.baseUrl}/notifications`, { method: 'DELETE' });
  }

  static async getPushVapidPublicKey(): Promise<string | null> {
    try {
      const json = await this.request<{
        status: string;
        data: { public_key: string | null; enabled?: boolean };
      }>(`${this.baseUrl}/push/vapid-public-key`);
      if (json.data.enabled === false || !json.data.public_key) return null;
      return json.data.public_key;
    } catch {
      return null;
    }
  }

  static async subscribeWebPush(subscription: PushSubscriptionJSON): Promise<void> {
    await this.request(`${this.baseUrl}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  }

  static async unsubscribeWebPush(endpoint?: string): Promise<void> {
    await this.request(`${this.baseUrl}/push/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endpoint ? { endpoint } : {}),
    });
  }

  static async downloadChatAttachment(attachmentId: string, filename: string): Promise<void> {
    const headers = await this.headers();
    const res = await fetch(this.apiUrl(`${this.baseUrl}/chat/attachments/${attachmentId}/download`), { headers });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async getIntegrationSettings(): Promise<IntegrationSettingsResponse | null> {
    try {
      const json = await this.request<{ status: string; data: IntegrationSettingsResponse }>(`${this.baseUrl}/integrations/settings`);
      return json.data;
    } catch {
      return null;
    }
  }

  static async updateTelegramSettings(settings: Partial<TelegramSettings>): Promise<TelegramSettings> {
    const json = await this.request<{ status: string; data: TelegramSettings }>(`${this.baseUrl}/integrations/settings/telegram`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return json.data;
  }

  static async updateMailSettings(settings: Partial<MailSettings>): Promise<MailSettings> {
    const json = await this.request<{ status: string; data: MailSettings }>(`${this.baseUrl}/integrations/settings/mail`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return json.data;
  }

  static async testMail(to?: string, settings?: Partial<MailSettings>): Promise<void> {
    await this.request(`${this.baseUrl}/integrations/mail/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, settings }),
    });
  }

  static async updateCloudSettings(settings: Partial<CloudSettings>): Promise<CloudSettings> {
    const json = await this.request<{ status: string; data: CloudSettings }>(`${this.baseUrl}/integrations/settings/cloud`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return json.data;
  }

  static async updateTelemetrySettings(settings: Partial<TelemetrySettings>): Promise<TelemetrySettings> {
    const json = await this.request<{ status: string; data: TelemetrySettings }>(`${this.baseUrl}/integrations/settings/telemetry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return json.data;
  }

  static async updateMapDataSettings(settings: Partial<MapDataSettings>): Promise<MapDataSettings> {
    const json = await this.request<{ status: string; data: MapDataSettings }>(`${this.baseUrl}/integrations/settings/map-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return json.data;
  }

  static async updateGeocodingSettings(settings: Partial<GeocodingSettings>): Promise<GeocodingSettings> {
    const json = await this.request<{ status: string; data: GeocodingSettings }>(`${this.baseUrl}/integrations/settings/geocoding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return json.data;
  }

  static async testGeocoding(address?: string): Promise<GeocodingTestResult> {
    const json = await this.request<{ status: string; data: GeocodingTestResult }>(`${this.baseUrl}/integrations/geocoding/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address ? { address } : {}),
    });
    return json.data;
  }

  static async getKladrLocalStatus(): Promise<KladrLocalImportStatus> {
    const json = await this.request<{ status: string; data: KladrLocalImportStatus }>(`${this.baseUrl}/integrations/geocoding/local-status`);
    return json.data;
  }

  static async importKladrLocal(): Promise<{ started: boolean; message: string }> {
    const json = await this.request<{ status: string; data: { started: boolean; message: string } }>(`${this.baseUrl}/integrations/geocoding/import-local`, {
      method: 'POST',
    });
    return json.data;
  }

  static async suggestKladr(q: string, options?: { limit?: number; kind?: 'address' | 'region'; region?: string }): Promise<KladrSuggestion[]> {
    const params = new URLSearchParams({ q });
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.kind) params.set('kind', options.kind);
    if (options?.region) params.set('region', options.region);
    const json = await this.request<{ status: string; data: KladrSuggestion[] }>(`${this.baseUrl}/kladr/suggest?${params}`);
    return json.data;
  }

  static async geocodeAddress(address: string, region?: string): Promise<AddressGeocodeResult> {
    const params = new URLSearchParams({ address });
    if (region) params.set('region', region);
    const json = await this.request<{ status: string; data: AddressGeocodeResult }>(`${this.baseUrl}/kladr/geocode?${params}`);
    return json.data;
  }

  static async reverseGeocode(lat: number, lng: number): Promise<AddressGeocodeResult> {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    const json = await this.request<{ status: string; data: AddressGeocodeResult }>(`${this.baseUrl}/kladr/reverse?${params}`);
    return json.data;
  }

  static async getMapDataTemplate(): Promise<Record<string, unknown>> {
    const json = await this.request<{ status: string; data: Record<string, unknown> }>(`${this.baseUrl}/map-data/template`);
    return json.data;
  }

  static async importMapData(payload: MapDataImportPayload): Promise<MapDataImportResult> {
    const json = await this.request<{ status: string; data: MapDataImportResult }>(`${this.baseUrl}/map-data/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.data;
  }

  static async syncMapDataFromApi(mode: 'merge' | 'replace' = 'merge'): Promise<MapDataImportResult> {
    const json = await this.request<{ status: string; data: MapDataImportResult }>(`${this.baseUrl}/integrations/map-data/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return json.data;
  }

  static async syncTelemetry(): Promise<{ updated: number }> {
    const json = await this.request<{ status: string; data: { updated: number } }>(`${this.baseUrl}/integrations/telemetry/sync`, {
      method: 'POST',
    });
    return json.data;
  }

  static async updateCarrierSettings(carrierId: string, settings: CarrierSettingsUpdate): Promise<ThirdPartyCarrier> {
    const json = await this.request<{ status: string; data: ThirdPartyCarrier }>(`${this.baseUrl}/integrations/carriers/${carrierId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return json.data;
  }

  static async testTelegram(chatId?: string): Promise<void> {
    await this.request(`${this.baseUrl}/integrations/telegram/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
    });
  }

  static async testCloud(): Promise<string> {
    const json = await this.request<{ status: string; message: string }>(`${this.baseUrl}/integrations/cloud/test`, { method: 'POST' });
    return json.message;
  }

  static async getCarriers(includeInactive = false): Promise<ThirdPartyCarrier[]> {
    const qs = includeInactive ? '?all=1' : '';
    const json = await this.request<{ status: string; data: ThirdPartyCarrier[] }>(`${this.baseUrl}/carriers${qs}`);
    return json.data;
  }

  static async getCarrierIntegration(carrierId: string): Promise<CarrierIntegrationSpec> {
    const json = await this.request<{ status: string; data: CarrierIntegrationSpec }>(
      `${this.baseUrl}/carriers/${encodeURIComponent(carrierId)}/integration`,
    );
    return json.data;
  }

  static async getExternalIntegrations(): Promise<{
    openapi_url: string;
    auth: string;
    endpoints: { method: string; path: string; description: string }[];
    websocket: string;
  }> {
    const json = await this.request<{ status: string; data: {
      openapi_url: string;
      auth: string;
      endpoints: { method: string; path: string; description: string }[];
      websocket: string;
    } }>(`${this.baseUrl}/integrations/external`);
    return json.data;
  }

  static async createCarrier(input: CarrierInput): Promise<ThirdPartyCarrier> {
    const json = await this.request<{ status: string; data: ThirdPartyCarrier }>(`${this.baseUrl}/carriers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async updateCarrier(id: string, input: Partial<CarrierInput>): Promise<ThirdPartyCarrier> {
    const json = await this.request<{ status: string; data: ThirdPartyCarrier }>(`${this.baseUrl}/carriers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async deleteCarrier(id: string): Promise<{ soft: boolean }> {
    const json = await this.request<{ status: string; soft?: boolean }>(`${this.baseUrl}/carriers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { soft: json.soft ?? false };
  }

  static async syncCarrier(carrierId: string): Promise<ThirdPartyCarrier> {
    const res = await fetch(this.apiUrl(`${this.baseUrl}/integrations/carriers/sync`), {
      method: 'POST',
      headers: await this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ carrier_id: carrierId }),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.error || 'Sync failed') as Error & { data?: ThirdPartyCarrier };
      err.data = json.data;
      throw err;
    }
    return json.data;
  }

  static async sendTelegramNotification(message: string, chatId?: string): Promise<void> {
    await this.request(`${this.baseUrl}/telegram/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chat_id: chatId }),
    });
  }

  static async createShipment(data: Record<string, unknown>): Promise<SupplyLink> {
    const json = await this.request<{ status: string; data: SupplyLink }>(`${this.baseUrl}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return json.data;
  }

  static async getShipmentChangeLogs(): Promise<{ id: string; shipment_id: string; username: string; action: string; changes: string; timestamp: string }[]> {
    const json = await this.request<{ status: string; data: { id: string; shipment_id: string; username: string; action: string; changes: string; timestamp: string }[] }>(`${this.baseUrl}/shipments/change-logs`);
    return json.data;
  }

  static async getProducts(includeInactive = false): Promise<Product[]> {
    const qs = includeInactive ? '?all=1' : '';
    const json = await this.request<{ status: string; data: Product[] }>(`${this.baseUrl}/products${qs}`);
    return json.data;
  }

  static async createProduct(input: ProductInput): Promise<Product> {
    const json = await this.request<{ status: string; data: Product }>(`${this.baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    const json = await this.request<{ status: string; data: Product }>(`${this.baseUrl}/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async deleteProduct(id: string): Promise<{ soft: boolean }> {
    const json = await this.request<{ status: string; soft?: boolean }>(`${this.baseUrl}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { soft: json.soft ?? false };
  }

  static async getTransportAssets(opts?: {
    includeInactive?: boolean;
    purpose?: 'shipment' | 'site' | 'both' | 'all';
    siteId?: string;
  }): Promise<TransportAsset[]> {
    const params = new URLSearchParams();
    if (opts?.includeInactive) params.set('all', '1');
    if (opts?.purpose && opts.purpose !== 'all') params.set('purpose', opts.purpose);
    if (opts?.siteId) params.set('site_id', opts.siteId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const json = await this.request<{ status: string; data: TransportAsset[] }>(
      `${this.baseUrl}/transport-assets${qs}`,
    );
    return json.data;
  }

  static async createTransportAsset(input: TransportAssetInput): Promise<TransportAsset> {
    const json = await this.request<{ status: string; data: TransportAsset }>(
      `${this.baseUrl}/transport-assets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async updateTransportAsset(
    id: string,
    input: Partial<TransportAssetInput>,
  ): Promise<TransportAsset> {
    const json = await this.request<{ status: string; data: TransportAsset }>(
      `${this.baseUrl}/transport-assets/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async deleteTransportAsset(id: string): Promise<{ soft: boolean }> {
    const json = await this.request<{ status: string; soft?: boolean }>(
      `${this.baseUrl}/transport-assets/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    return { soft: json.soft ?? false };
  }

  static async uploadTransportPhoto(id: string, file: File): Promise<TransportAsset> {
    const form = new FormData();
    form.append('file', file);
    const headers = await this.headers();
    delete headers['Content-Type'];
    const res = await fetch(this.apiUrl(`${this.baseUrl}/transport-assets/${encodeURIComponent(id)}/photo`), {
      method: 'POST',
      headers,
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Photo upload failed');
    return json.data as TransportAsset;
  }

  static async deleteTransportPhoto(id: string): Promise<TransportAsset> {
    const json = await this.request<{ status: string; data: TransportAsset }>(
      `${this.baseUrl}/transport-assets/${encodeURIComponent(id)}/photo`,
      { method: 'DELETE' },
    );
    return json.data;
  }

  static async fetchTransportPhotoObjectUrl(id: string, version?: string): Promise<string> {
    const headers = await this.headers();
    const qs = version ? `?v=${encodeURIComponent(version)}` : '';
    const res = await fetch(
      this.apiUrl(`${this.baseUrl}/transport-assets/${encodeURIComponent(id)}/photo${qs}`),
      { headers },
    );
    if (!res.ok) throw new Error('Photo not found');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  static async getSalesManagers(includeInactive = false): Promise<SalesManager[]> {
    const qs = includeInactive ? '?all=1' : '';
    const json = await this.request<{ status: string; data: SalesManager[] }>(`${this.baseUrl}/sales-managers${qs}`);
    return json.data;
  }

  static async createSalesManager(input: SalesManagerInput): Promise<SalesManager> {
    const json = await this.request<{ status: string; data: SalesManager }>(`${this.baseUrl}/sales-managers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async updateSalesManager(id: string, input: Partial<SalesManagerInput>): Promise<SalesManager> {
    const json = await this.request<{ status: string; data: SalesManager }>(`${this.baseUrl}/sales-managers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return json.data;
  }

  static async deleteSalesManager(id: string): Promise<{ soft: boolean }> {
    const json = await this.request<{ status: string; soft?: boolean }>(`${this.baseUrl}/sales-managers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { soft: json.soft ?? false };
  }

  private static rzdQuery(filters: RzdAnalyticsFilters = {}): string {
    const q = new URLSearchParams();
    if (filters.dateFrom) q.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) q.set('dateTo', filters.dateTo);
    if (filters.cargoCode) q.set('cargoCode', filters.cargoCode);
    if (filters.cargoSearch) q.set('cargoSearch', filters.cargoSearch);
    if (filters.originRegion) q.set('originRegion', filters.originRegion);
    if (filters.destRegion) q.set('destRegion', filters.destRegion);
    if (filters.shipperSearch) q.set('shipperSearch', filters.shipperSearch);
    if (filters.consigneeSearch) q.set('consigneeSearch', filters.consigneeSearch);
    const s = q.toString();
    return s ? `?${s}` : '';
  }

  static async getRzdAnalyticsSummary(filters: RzdAnalyticsFilters = {}): Promise<RzdAnalyticsSummary> {
    const json = await this.request<{ status: string; data: RzdAnalyticsSummary }>(
      `${this.baseUrl}/rzd-analytics/summary${this.rzdQuery(filters)}`,
    );
    return json.data;
  }

  static async getRzdAnalyticsRoutes(filters: RzdAnalyticsFilters = {}, limit = 500): Promise<RzdAggregatedRoute[]> {
    const qs = this.rzdQuery(filters);
    const sep = qs ? '&' : '?';
    const json = await this.request<{ status: string; data: RzdAggregatedRoute[] }>(
      `${this.baseUrl}/rzd-analytics/routes${qs}${sep}limit=${limit}`,
    );
    return json.data;
  }

  static async getRzdAnalyticsRecords(
    filters: RzdAnalyticsFilters = {},
    page = 1,
    pageSize = 50,
  ): Promise<{ records: RzdAnalyticsRecord[]; total: number }> {
    const qs = this.rzdQuery(filters);
    const sep = qs ? '&' : '?';
    const json = await this.request<{ status: string; data: RzdAnalyticsRecord[]; total: number }>(
      `${this.baseUrl}/rzd-analytics/records${qs}${sep}page=${page}&pageSize=${pageSize}`,
    );
    return { records: json.data, total: json.total };
  }

  static async getRzdImportBatches(): Promise<RzdImportBatch[]> {
    const json = await this.request<{ status: string; data: RzdImportBatch[] }>(`${this.baseUrl}/rzd-analytics/batches`);
    return json.data;
  }

  static async getRzdFilterOptions(): Promise<{
    cargo_codes: { code: string; name: string; count: number }[];
    origin_regions: string[];
    dest_regions: string[];
  }> {
    const json = await this.request<{ status: string; data: {
      cargo_codes: { code: string; name: string; count: number }[];
      origin_regions: string[];
      dest_regions: string[];
    } }>(`${this.baseUrl}/rzd-analytics/filter-options`);
    return json.data;
  }

  static async getRzdStationDirectoryStats(): Promise<{ total: number; with_esr: number }> {
    const json = await this.request<{ status: string; data: { total: number; with_esr: number } }>(
      `${this.baseUrl}/rzd-analytics/station-directory/stats`,
    );
    return json.data;
  }

  static async importRzdAnalyticsCsv(csv: string, filename: string): Promise<RzdImportResult> {
    const json = await this.request<{ status: string; data: RzdImportResult }>(`${this.baseUrl}/rzd-analytics/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv, filename }),
    });
    return json.data;
  }

  static async importInternalShipmentsCsv(csv: string, filename: string): Promise<ShipmentImportResult> {
    const json = await this.request<{ status: string; data: ShipmentImportResult }>(
      `${this.baseUrl}/shipments/import-csv`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, filename }),
      },
    );
    return json.data;
  }

  static async previewInternalShipmentsCsv(csv: string, filename: string): Promise<ShipmentCsvPreviewResult> {
    const json = await this.request<{ status: string; data: ShipmentCsvPreviewResult }>(
      `${this.baseUrl}/shipments/preview-csv`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, filename }),
      },
    );
    return json.data;
  }

  static async getShipmentImportBatches(): Promise<ShipmentImportBatch[]> {
    const json = await this.request<{ status: string; data: ShipmentImportBatch[] }>(
      `${this.baseUrl}/shipments/import-batches`,
    );
    return json.data;
  }

  static async getKanbanBoards(): Promise<{ boards: KanbanBoard[]; open_assigned: number }> {
    const json = await this.request<{ status: string; data: { boards: KanbanBoard[]; open_assigned: number } }>(
      `${this.baseUrl}/tasks/boards`,
    );
    return json.data;
  }

  static async getKanbanBoard(id: string): Promise<KanbanBoardDetail> {
    const json = await this.request<{ status: string; data: KanbanBoardDetail }>(
      `${this.baseUrl}/tasks/boards/${encodeURIComponent(id)}`,
    );
    return json.data;
  }

  static async createKanbanBoard(input: {
    name: string;
    description?: string;
    board_type: KanbanBoardType;
    member_ids?: string[];
  }): Promise<KanbanBoardDetail> {
    const json = await this.request<{ status: string; data: KanbanBoardDetail }>(
      `${this.baseUrl}/tasks/boards`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async updateKanbanBoard(
    id: string,
    input: { name?: string; description?: string; member_ids?: string[] },
  ): Promise<KanbanBoardDetail> {
    const json = await this.request<{ status: string; data: KanbanBoardDetail }>(
      `${this.baseUrl}/tasks/boards/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async deleteKanbanBoard(id: string): Promise<void> {
    await this.request(`${this.baseUrl}/tasks/boards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  static async createKanbanTask(
    boardId: string,
    input: {
      column_id: string;
      swimlane_id?: string | null;
      title: string;
      description?: string;
      class_of_service?: KanbanClassOfService;
      assignee_id?: string | null;
      due_date?: string | null;
      priority?: number;
    },
  ): Promise<KanbanTask> {
    const json = await this.request<{ status: string; data: KanbanTask }>(
      `${this.baseUrl}/tasks/boards/${encodeURIComponent(boardId)}/tasks`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async updateKanbanTask(
    taskId: string,
    input: Partial<{
      title: string;
      description: string;
      class_of_service: KanbanClassOfService;
      assignee_id: string | null;
      due_date: string | null;
      priority: number;
      swimlane_id: string | null;
    }>,
  ): Promise<KanbanTask> {
    const json = await this.request<{ status: string; data: KanbanTask }>(
      `${this.baseUrl}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async moveKanbanTask(
    taskId: string,
    input: { column_id: string; position: number; swimlane_id?: string | null },
  ): Promise<KanbanTask> {
    const json = await this.request<{ status: string; data: KanbanTask }>(
      `${this.baseUrl}/tasks/${encodeURIComponent(taskId)}/move`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async deleteKanbanTask(taskId: string): Promise<void> {
    await this.request(`${this.baseUrl}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
    });
  }

  static async createKanbanColumn(
    boardId: string,
    input: { name: string; wip_limit?: number | null },
  ): Promise<KanbanColumn> {
    const json = await this.request<{ status: string; data: KanbanColumn }>(
      `${this.baseUrl}/tasks/boards/${encodeURIComponent(boardId)}/columns`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async createKanbanSwimlane(boardId: string, name: string): Promise<KanbanSwimlane> {
    const json = await this.request<{ status: string; data: KanbanSwimlane }>(
      `${this.baseUrl}/tasks/boards/${encodeURIComponent(boardId)}/swimlanes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      },
    );
    return json.data;
  }

  static async getKanbanTaskWorkspace(taskId: string): Promise<KanbanTaskWorkspace> {
    const json = await this.request<{ status: string; data: KanbanTaskWorkspace }>(
      `${this.baseUrl}/tasks/${encodeURIComponent(taskId)}/workspace`,
    );
    return json.data;
  }

  static async postKanbanTaskMessage(
    taskId: string,
    body: string,
    milestoneId?: string | null,
  ): Promise<KanbanTaskMessage> {
    const json = await this.request<{ status: string; data: KanbanTaskMessage }>(
      `${this.baseUrl}/tasks/${encodeURIComponent(taskId)}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, milestone_id: milestoneId ?? null }),
      },
    );
    return json.data;
  }

  static async createKanbanMilestone(
    taskId: string,
    input: { title: string; description?: string; due_date?: string | null },
  ): Promise<KanbanTaskMilestone> {
    const json = await this.request<{ status: string; data: KanbanTaskMilestone }>(
      `${this.baseUrl}/tasks/${encodeURIComponent(taskId)}/milestones`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async updateKanbanMilestone(
    milestoneId: string,
    input: Partial<{
      status: KanbanMilestoneStatus;
      rejection_reason: string | null;
      title: string;
      description: string;
      due_date: string | null;
    }>,
  ): Promise<KanbanTaskMilestone> {
    const json = await this.request<{ status: string; data: KanbanTaskMilestone }>(
      `${this.baseUrl}/tasks/milestones/${encodeURIComponent(milestoneId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async deleteKanbanMilestone(milestoneId: string): Promise<void> {
    await this.request(`${this.baseUrl}/tasks/milestones/${encodeURIComponent(milestoneId)}`, {
      method: 'DELETE',
    });
  }

  static async uploadKanbanTaskAttachment(
    taskId: string,
    file: File,
    options?: { message?: string; milestone_id?: string | null },
  ): Promise<{ attachment: KanbanTaskAttachment; message?: KanbanTaskMessage }> {
    const form = new FormData();
    form.append('file', file);
    if (options?.message) form.append('message', options.message);
    if (options?.milestone_id) form.append('milestone_id', options.milestone_id);
    const headers = await this.headers();
    const res = await fetch(
      this.apiUrl(`${this.baseUrl}/tasks/${encodeURIComponent(taskId)}/attachments`),
      { method: 'POST', headers, body: form },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Upload failed: ${res.status}`);
    return json.data;
  }

  static async downloadKanbanTaskAttachment(attachmentId: string, filename: string): Promise<void> {
    const headers = await this.headers();
    const res = await fetch(
      this.apiUrl(`${this.baseUrl}/tasks/attachments/${encodeURIComponent(attachmentId)}/download`),
      { headers },
    );
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async deleteKanbanTaskAttachment(attachmentId: string): Promise<void> {
    await this.request(`${this.baseUrl}/tasks/attachments/${encodeURIComponent(attachmentId)}`, {
      method: 'DELETE',
    });
  }

  static async getSupportTickets(): Promise<SupportTicket[]> {
    const json = await this.request<{ status: string; data: { tickets: SupportTicket[] } }>(
      `${this.baseUrl}/support/tickets`,
    );
    return json.data.tickets;
  }

  static async createSupportTicket(input: {
    subject: string;
    message: string;
    category: SupportTicketCategory;
    page_context?: string | null;
  }): Promise<SupportTicket> {
    const json = await this.request<{ status: string; data: SupportTicket }>(
      `${this.baseUrl}/support/tickets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async updateSupportTicket(
    id: string,
    input: { status: SupportTicketStatus },
  ): Promise<SupportTicket> {
    const json = await this.request<{ status: string; data: SupportTicket }>(
      `${this.baseUrl}/support/tickets/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return json.data;
  }

  static async getErrorLogs(filters?: ErrorLogFilters): Promise<{ logs: ErrorLog[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.level) params.set('level', filters.level);
    if (filters?.source) params.set('source', filters.source);
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    const json = await this.request<{ status: string; data: { logs: ErrorLog[]; total: number } }>(
      `${this.baseUrl}/error-logs${qs ? `?${qs}` : ''}`,
    );
    return json.data;
  }
}
