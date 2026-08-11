export type FactoryType = 'gok' | 'port' | 'steel_mill' | 'slag_dump' | 'coal_mine';

/** External enterprise relationship status (TZ §5) */
export type EnterpriseStatus = 'active' | 'paused' | 'inactive' | 'never';

export type FlowType = 'shipment' | 'purchase' | 'internal';

export type PeriodGranularity = 'year' | 'quarter' | 'month' | 'week';

export interface PeriodFilterState {
  mode: 'preset' | 'range';
  granularity: PeriodGranularity;
  year?: number;
  value?: number;
  rangeStart?: string;
  rangeEnd?: string;
}

export interface Factory {
  id: string;
  name: string;
  type: FactoryType;
  latitude: number;
  longitude: number;
  region: string;
  country: string;
  is_ours: boolean;
  description: string;
  holding: string;
  enterprise_status?: EnterpriseStatus;
  code?: string;
  address?: string;
  kladr_id?: string;
  geocode_source?: string;
  is_active?: boolean;
  sort_order?: number;
  edit_count?: number;
}

export interface SiteCategoryInfo {
  id: FactoryType;
  name_ru: string;
  name_en: string;
  sort_order: number;
}

export interface SiteCsvImportResult {
  category: FactoryType;
  imported: number;
  updated: number;
  merged: number;
  skipped: number;
  errors: string[];
}

export interface SiteDuplicateEntry {
  id: string;
  name: string;
  type: FactoryType;
  edit_count: number;
  link_refs: number;
  is_ours: boolean;
}

export interface SiteDuplicateGroup {
  canonical_key: string;
  sites: SiteDuplicateEntry[];
}

export interface SiteDuplicatesReport {
  groups: SiteDuplicateGroup[];
  total_groups: number;
  total_duplicate_rows: number;
}

export interface SiteImportPreviewItem {
  csv_id: string;
  name: string;
  action: 'insert' | 'update' | 'merge';
  existing_id?: string;
  existing_name?: string;
}

export interface SiteImportPreviewResult {
  category: FactoryType;
  would_insert: number;
  would_update: number;
  would_merge: number;
  items: SiteImportPreviewItem[];
  errors: string[];
}

export interface SiteMergeDuplicatesResult {
  merged_groups: number;
  deactivated: number;
  aliases: number;
}

export type CargoStatus = 'en_route' | 'delayed' | 'arrived' | 'loading' | 'alert';

export type TransportMode = 'road' | 'rail' | 'sea' | 'air' | 'multimodal';

export type ShipmentDocumentType =
  | 'waybill'
  | 'cmr'
  | 'invoice'
  | 'packing_list'
  | 'customs'
  | 'certificate'
  | 'photo'
  | 'other';

export const SHIPMENT_DOCUMENT_TYPES: ShipmentDocumentType[] = [
  'waybill',
  'cmr',
  'invoice',
  'packing_list',
  'customs',
  'certificate',
  'photo',
  'other',
];

export const TRANSPORT_MODES: TransportMode[] = [
  'road',
  'rail',
  'sea',
  'air',
  'multimodal',
];

export interface ShipmentDocument {
  id: string;
  shipment_id: string;
  uploaded_by: string;
  uploaded_by_name: string;
  doc_type: ShipmentDocumentType;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  note: string;
  created_at: string;
}

export interface SupplyLink {
  id: string;
  origin_id: string;
  destination_id: string;
  cargo_type: string;
  product_id?: string;
  flow_type?: FlowType;
  volume: number;
  unit: string;
  source: 'own' | 'rzd';
  period: string;
  shipment_date?: string;
  amount?: number;
  manager_id?: string;
  manager_name?: string;
  sales_manager_id?: string;
  created_by?: string;
  site_id?: string;
  // Dynamic live tracking data
  status?: CargoStatus;
  current_lat?: number;
  current_lng?: number;
  speed_kmh?: number;
  progress_pct?: number; // 0 - 100
  eta?: string;
  carrier_name?: string;
  carrier_id?: string;
  driver_info?: string;
  delay_reason?: string;
  last_updated?: string;
  eta_at?: string;
  external_tracking_id?: string;
  tracker_id?: string;
  // Logistics / transport details
  transport_mode?: TransportMode;
  vehicle_number?: string;
  trailer_number?: string;
  container_number?: string;
  seal_number?: string;
  waybill_number?: string;
  planned_departure_at?: string;
  planned_arrival_at?: string;
  actual_departure_at?: string;
  actual_arrival_at?: string;
  logistics_notes?: string;
}

export type UserRole = 'admin' | 'key_person' | 'manager' | 'site_manager' | 'local_employee';

/** Product catalog item (TZ §2.3) */
export interface Product {
  id: string;
  name_ru: string;
  name_en: string;
  sort_order?: number;
  is_active?: boolean;
}

export type ProductInput = Pick<Product, 'id' | 'name_ru' | 'name_en'> & {
  sort_order?: number;
  is_active?: boolean;
};

/** Sales manager from directory (linked to shipments) */
export interface SalesManager {
  id: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  position: string;
  full_name: string;
  sort_order?: number;
  is_active?: boolean;
}

export type SalesManagerInput = Pick<SalesManager, 'id' | 'last_name' | 'first_name' | 'middle_name' | 'position'> & {
  sort_order?: number;
  is_active?: boolean;
};

export type AccountStatus = 'active' | 'pending' | 'rejected';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  telegram_chat_id?: string;
  notifications_enabled: boolean;
  site_id?: string;
  assigned_site_ids?: string[];
  email_verified?: boolean;
  account_status?: AccountStatus;
}

export const USER_ROLES: UserRole[] = ['admin', 'key_person', 'manager', 'site_manager', 'local_employee'];

export interface UserCreateInput {
  username: string;
  name: string;
  role: UserRole;
  email: string;
  password: string;
  telegram_chat_id?: string;
  notifications_enabled?: boolean;
  site_id?: string;
  assigned_site_ids?: string[];
}

export interface UserUpdateInput {
  username?: string;
  name?: string;
  role?: UserRole;
  email?: string;
  password?: string;
  telegram_chat_id?: string;
  notifications_enabled?: boolean;
  site_id?: string | null;
  assigned_site_ids?: string[];
}

export interface AggregatedRoute {
  id: string;
  origin_id: string;
  destination_id: string;
  shipments: SupplyLink[];
  shipment_count: number;
  total_volume: number;
  total_amount: number;
  unit: string;
  cargo_type: string;
  product_id: string;
  flow_type: FlowType;
  status?: CargoStatus;
  source: 'own' | 'rzd';
  latest_shipment_id: string;
  latest_shipment_date?: string;
}

export interface ShipmentInput {
  origin_id: string;
  destination_id: string;
  product_id: string;
  flow_type: FlowType;
  volume: number;
  unit?: string;
  shipment_date: string;
  status: CargoStatus;
  amount?: number;
  counterparty_name?: string;
  site_id?: string;
  source?: 'own' | 'rzd';
}

export interface ShipmentChangeLog {
  id: string;
  shipment_id: string;
  user_id: string;
  username: string;
  action: 'create' | 'update' | 'delete';
  changes: string;
  timestamp: string;
}

export type ShipmentEventType = 'status_change' | 'comment' | 'delay' | 'early' | 'eta_update';
export type ShipmentTimingKind = 'on_time' | 'delay' | 'early';
export type ShipmentEventSource = 'manual' | 'system' | 'telemetry' | 'carrier';

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  event_type: ShipmentEventType;
  old_status?: CargoStatus;
  new_status?: CargoStatus;
  timing_kind?: ShipmentTimingKind;
  delay_reason?: string;
  delay_hours?: number;
  early_hours?: number;
  comment?: string;
  eta_before?: string;
  eta_after?: string;
  origin_id?: string;
  destination_id?: string;
  product_id?: string;
  user_id: string;
  username: string;
  source: ShipmentEventSource;
  created_at: string;
}

export interface ShipmentEventInput {
  event_type: ShipmentEventType;
  new_status?: CargoStatus;
  timing_kind?: ShipmentTimingKind;
  delay_reason?: string;
  delay_hours?: number;
  early_hours?: number;
  comment?: string;
  eta_after?: string;
  origin_id?: string;
  destination_id?: string;
  product_id?: string;
}

export const CARGO_STATUSES: CargoStatus[] = ['en_route', 'delayed', 'arrived', 'loading', 'alert'];

export interface EventLog {
  id: string;
  timestamp: string;
  user_id: string;
  username: string;
  role: UserRole;
  action: string;
  category: 'auth' | 'route' | 'factory' | 'system' | 'sync' | 'backup' | 'export' | 'import';
  details: string;
  ip_address?: string;
}

export interface KPIStats {
  total_factories: number;
  total_shipments: number;
  total_volume_tons: number;
  active_en_route: number;
  delayed_shipments: number;
  arrived_shipments: number;
  avg_delivery_hours: number;
  volume_by_type: Record<string, number>;
  volume_by_holding: Record<string, number>;
  volume_by_country: Record<string, number>;
  volume_by_source: { own: number; rzd: number };
}

export interface BackupItem {
  id: string;
  created_at: string;
  size_bytes: number;
  type: 'auto' | 'manual';
  filename: string;
  description: string;
  storage_path?: string;
  cloud_uploaded?: boolean;
  cloud_provider?: string;
}

export type MigrationScope = 'bootstrap' | 'schema' | 'data';

export interface MigrationStatusItem {
  file: string;
  scope: MigrationScope;
  applied: boolean;
  applied_at: string | null;
  has_rollback: boolean;
}

export interface MigrationDashboard {
  migrations: MigrationStatusItem[];
  pending_count: number;
  applied_count: number;
  total_count: number;
}

export interface DbMaintenanceInfo {
  tools: {
    pg_dump: boolean;
    psql: boolean;
  };
  migrations: MigrationDashboard;
}

export interface ChatAttachment {
  id: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_username: string;
  body: string;
  attachment?: ChatAttachment | null;
  created_at: string;
  read_at: string | null;
  is_own?: boolean;
}

export interface ChatConversationSummary {
  id: string;
  peer_id: string;
  peer_name: string;
  peer_username: string;
  peer_role: UserRole;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface ChatUserDirectoryEntry {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  has_conversation: boolean;
}

export type CarrierAuthType = 'none' | 'bearer' | 'header' | 'query';

export type CarrierCategory = 'own' | 'rzd' | 'other';

export interface ThirdPartyCarrier {
  id: string;
  name: string;
  code: string;
  category: CarrierCategory;
  status: 'connected' | 'syncing' | 'error' | 'disabled';
  last_sync: string;
  active_shipments_count: number;
  api_endpoint: string;
  enabled?: boolean;
  auth_type?: CarrierAuthType;
  sync_path?: string;
  id_field?: string;
  status_field?: string;
  api_key_set?: boolean;
  last_error?: string;
  last_sync_status?: string;
  lat_field?: string;
  lng_field?: string;
  speed_field?: string;
  sort_order?: number;
  is_active?: boolean;
  description?: string;
}

export interface CarrierInput {
  id: string;
  name: string;
  code: string;
  category: CarrierCategory;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  api_endpoint?: string;
  enabled?: boolean;
  auth_type?: CarrierAuthType;
  sync_path?: string;
  id_field?: string;
  status_field?: string;
  lat_field?: string;
  lng_field?: string;
  speed_field?: string;
  api_key?: string;
}

export interface CarrierIntegrationSpec {
  id: string;
  name: string;
  code: string;
  category: CarrierCategory;
  enabled: boolean;
  api_endpoint: string;
  auth_type: CarrierAuthType;
  sync_path: string;
  id_field: string;
  status_field: string;
  lat_field: string;
  lng_field: string;
  speed_field: string;
  pull_sync_url: string;
  telemetry_push_url: string;
  telemetry_webhook_url: string;
  openapi_url: string;
}

export interface TelegramSettings {
  enabled: boolean;
  bot_token: string;
  default_chat_id: string;
  alert_on_delay: boolean;
  alert_on_status_change: boolean;
}

export type MailMode = 'builtin' | 'external';

export interface MailSettings {
  enabled: boolean;
  mode: MailMode;
  registration_enabled: boolean;
  from_name: string;
  from_address: string;
  public_base_url: string;
  builtin_hostname: string;
  builtin_port: number;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  last_error?: string;
  last_sent_at?: string;
}

export interface CloudS3Settings {
  endpoint?: string;
  bucket: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
  prefix?: string;
}

export interface CloudYandexSettings {
  oauth_token: string;
  folder_path: string;
}

export interface CloudGDriveSettings {
  access_token: string;
  folder_id?: string;
}

export interface CloudSettings {
  enabled: boolean;
  provider: 's3' | 'yandex' | 'gdrive';
  auto_upload_on_backup: boolean;
  last_upload_at?: string;
  last_error?: string;
  s3?: CloudS3Settings;
  yandex?: CloudYandexSettings;
  gdrive?: CloudGDriveSettings;
}

export interface TelemetrySettings {
  enabled: boolean;
  poll_interval_sec: number;
  sync_carriers: boolean;
  webhook_enabled: boolean;
  webhook_secret: string;
  allow_jwt_push: boolean;
  calculate_progress: boolean;
  arrived_threshold_pct: number;
  lat_field: string;
  lng_field: string;
  speed_field: string;
  id_field: string;
  last_sync_at?: string;
  last_error?: string;
  last_updated_count?: number;
}

export interface TelemetryPoint {
  shipment_id?: string;
  external_tracking_id?: string;
  tracker_id?: string;
  lat: number;
  lng: number;
  speed_kmh?: number;
  status?: string;
  progress_pct?: number;
}

export interface IntegrationSettingsResponse {
  telegram: TelegramSettings;
  cloud: CloudSettings;
  telemetry: TelemetrySettings;
  mapData: MapDataSettings;
  geocoding: GeocodingSettings;
  mail: MailSettings;
}

export type MapDataImportMode = 'merge' | 'replace';

export interface MapDataImportResult {
  mode: MapDataImportMode;
  factories_upserted: number;
  supply_links_upserted: number;
  factories_skipped: number;
  supply_links_skipped: number;
  errors: string[];
}

export interface MapDataSettings {
  enabled: boolean;
  api_endpoint: string;
  auth_type: CarrierAuthType;
  api_key: string;
  sync_path: string;
  factories_path: string;
  supply_links_path: string;
  default_import_mode: MapDataImportMode;
  last_sync_at?: string;
  last_error?: string;
  last_factories_count?: number;
  last_links_count?: number;
}

export type KladrProviderMode = 'external_api' | 'local_db' | 'auto';

export interface GeocodingSettings {
  enabled: boolean;
  kladr_provider: KladrProviderMode;
  kladr_api_plan: 'free' | 'paid';
  kladr_api_url: string;
  kladr_api_token: string;
  kladr_api_key: string;
  kladr_fallback_api: boolean;
  nominatim_enabled: boolean;
  nominatim_base_url: string;
  station_lookup_enabled: boolean;
  known_places_enabled: boolean;
  local_db_source_url: string;
  local_db_last_import_at?: string;
  local_db_last_error?: string;
  local_db_settlement_count?: number;
  local_db_street_count?: number;
  local_db_building_count?: number;
  local_db_import_in_progress?: boolean;
  last_test_at?: string;
  last_test_ok?: boolean;
  last_test_message?: string;
  last_error?: string;
}

export interface GeocodingTestResult {
  ok: boolean;
  message: string;
  kladr_provider: KladrProviderMode;
  local_db_ready: boolean;
  api_endpoints: string[];
  sample?: { address: string; kladr_id?: string; normalized?: string };
}

export interface KladrLocalImportStatus {
  in_progress: boolean;
  settlement_count: number;
  street_count: number;
  building_count: number;
  last_import_at?: string;
  last_error?: string;
  archive_url?: string;
}

export interface KladrSuggestion {
  id: string;
  name: string;
  typeShort?: string;
  zip?: string | null;
  normalizedAddress: string;
  region?: string;
  contentType?: string;
}

export interface AddressGeocodeResult {
  latitude: number;
  longitude: number;
  kladr_id?: string;
  normalized_address?: string;
  region?: string;
  geocode_source: string;
}

export interface MapDataImportPayload {
  factories?: Factory[];
  supply_links?: SupplyLink[];
  supplyLinks?: SupplyLink[];
  shipments?: SupplyLink[];
  mode?: MapDataImportMode;
}

export interface CarrierSettingsUpdate {
  name?: string;
  code?: string;
  category?: CarrierCategory;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  api_endpoint?: string;
  api_key?: string;
  enabled?: boolean;
  auth_type?: CarrierAuthType;
  sync_path?: string;
  id_field?: string;
  status_field?: string;
  lat_field?: string;
  lng_field?: string;
  speed_field?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  link_id?: string;
  link_type?: string;
  deleted?: boolean;
}

export interface FilterState {
  /** What to show on the map: all matching sites, or shipment routes */
  viewMode: 'sites' | 'shipments';
  searchQuery: string;
  contours: ('outer' | 'inner')[];
  factoryTypes: FactoryType[];
  ourSites: string[];
  flowTypes: FlowType[];
  products: string[];
  carriers: string[];
  managers: string[];
  period: PeriodFilterState;
  compareEnabled: boolean;
  compare?: PeriodFilterState;
  ownership: 'all' | 'ours' | 'third_party';
  sources: ('own' | 'rzd')[];
  statuses: CargoStatus[];
  countries: string[];
  holdings: string[];
  cargoTypes: string[];
}

export interface TelemetryShipmentUpdate {
  id: string;
  current_lat: number;
  current_lng: number;
  progress_pct: number;
  speed_kmh?: number;
  status?: CargoStatus;
}

export interface RzdImportBatch {
  id: string;
  filename: string;
  file_hash: string;
  uploaded_by?: string;
  row_count: number;
  inserted_count: number;
  duplicate_count: number;
  error_count: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface RzdStation {
  id: string;
  esr_code?: string;
  name: string;
  region?: string;
  country?: string;
  railway?: string;
  latitude: number;
  longitude: number;
}

export interface RzdAnalyticsRecord {
  id: string;
  batch_id: string;
  content_hash: string;
  shipment_date: string;
  cargo_code?: string;
  cargo_name: string;
  origin_country?: string;
  origin_region?: string;
  origin_station_name: string;
  origin_station_code?: string;
  origin_railway?: string;
  dest_country?: string;
  dest_region?: string;
  dest_station_name: string;
  shipper?: string;
  consignee?: string;
  volume: number;
  unit: string;
  origin_station_id?: string;
  dest_station_id?: string;
  created_at: string;
}

export interface RzdAggregatedRoute {
  origin_station_id: string;
  dest_station_id: string;
  origin_name: string;
  dest_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  origin_region?: string;
  dest_region?: string;
  cargo_code?: string;
  cargo_name?: string;
  shipment_count: number;
  total_volume: number;
}

export interface RzdAnalyticsSummary {
  record_count: number;
  total_volume: number;
  route_count: number;
  station_count: number;
  batch_count: number;
}

export interface RzdAnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  cargoCode?: string;
  cargoSearch?: string;
  originRegion?: string;
  destRegion?: string;
  shipperSearch?: string;
  consigneeSearch?: string;
}

export interface RzdImportResult {
  batch: RzdImportBatch;
  inserted: number;
  duplicates: number;
  errors: string[];
  skipped_file: boolean;
  message?: string;
}

export interface ShipmentImportBatch {
  id: string;
  filename: string;
  file_hash: string;
  row_count: number;
  inserted_count: number;
  duplicate_count: number;
  skipped_count: number;
  error_count: number;
  status: string;
  created_at: string;
}

export interface ShipmentImportResult {
  batch: ShipmentImportBatch;
  inserted: number;
  duplicates: number;
  skipped: number;
  errors: string[];
  skipped_file?: boolean;
  counterparties_created: number;
  date_from?: string;
  date_to?: string;
}

export interface ShipmentCsvPreviewResult {
  filename: string;
  links: SupplyLink[];
  factories: Factory[];
  errors: string[];
  skipped: number;
  row_count: number;
  date_from?: string;
  date_to?: string;
}

export type CsvPreviewFileEntry = {
  id: string;
  filename: string;
  links: SupplyLink[];
  factories: Factory[];
  errors: string[];
  skipped: number;
  row_count: number;
  date_from?: string;
  date_to?: string;
};

export type KanbanBoardType =
  | 'classic'
  | 'personal'
  | 'team'
  | 'process'
  | 'project'
  | 'swimlanes';

export type KanbanClassOfService =
  | 'expedite'
  | 'fixed_date'
  | 'standard'
  | 'intangible';

export interface KanbanBoard {
  id: string;
  name: string;
  description: string;
  board_type: KanbanBoardType;
  owner_id: string;
  created_at: string;
  updated_at: string;
  member_ids?: string[];
  task_count?: number;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
  wip_limit: number | null;
  created_at: string;
}

export interface KanbanSwimlane {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface KanbanTask {
  id: string;
  board_id: string;
  column_id: string;
  swimlane_id: string | null;
  title: string;
  description: string;
  class_of_service: KanbanClassOfService;
  assignee_id: string | null;
  assignee_name?: string | null;
  creator_id: string;
  creator_name?: string | null;
  due_date: string | null;
  priority: number;
  position: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type KanbanMilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected';

export type SupportTicketCategory = 'bug' | 'question' | 'suggestion' | 'other';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name?: string;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  page_context: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanTaskParticipant {
  user_id: string;
  name: string;
  username: string;
  role: 'assignee' | 'watcher' | 'approver' | 'contributor';
  created_at: string;
}

export interface KanbanTaskMessage {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  body: string;
  milestone_id: string | null;
  attachment_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanTaskMilestone {
  id: string;
  task_id: string;
  title: string;
  description: string;
  position: number;
  status: KanbanMilestoneStatus;
  due_date: string | null;
  created_by: string;
  created_by_name?: string | null;
  approved_by: string | null;
  approved_by_name?: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanTaskAttachment {
  id: string;
  task_id: string;
  message_id: string | null;
  milestone_id: string | null;
  uploaded_by: string;
  uploaded_by_name: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
}

export interface KanbanTaskWorkspace {
  task: KanbanTask;
  participants: KanbanTaskParticipant[];
  messages: KanbanTaskMessage[];
  milestones: KanbanTaskMilestone[];
  attachments: KanbanTaskAttachment[];
}

export interface KanbanBoardDetail extends KanbanBoard {
  columns: KanbanColumn[];
  swimlanes: KanbanSwimlane[];
  tasks: KanbanTask[];
}

export type WebSocketInboundMessage =
  | { type: 'INIT'; message: string }
  | { type: 'LIVE_TELEMETRY_UPDATE'; shipments: TelemetryShipmentUpdate[] }
  | {
      type: 'SHIPMENT_STATUS_UPDATE';
      shipment_id: string;
      status: CargoStatus;
      delay_reason?: string;
      cargo_type?: string;
    }
  | {
      type: 'SHIPMENT_EVENT';
      shipment_id: string;
      event: ShipmentEvent;
      shipment?: SupplyLink;
    }
  | { type: 'CARGO_ARRIVED'; shipment_id: string; cargo_type: string; message: string }
  | { type: 'CARRIER_SYNC'; name: string; message?: string }
  | { type: 'MAP_DATA_IMPORTED'; factories_count: number; supply_links_count: number }
  | { type: 'PRODUCTS_UPDATED' }
  | { type: 'SALES_MANAGERS_UPDATED' }
  | { type: 'CARRIERS_UPDATED' }
  | { type: 'FACTORY_ADDED'; factory: Factory }
  | { type: 'FACTORY_UPDATED'; factory: Factory }
  | { type: 'FACTORY_DELETED'; factoryId: string }
  | { type: 'SITES_IMPORTED'; category: FactoryType; result: SiteCsvImportResult }
  | { type: 'SITES_MERGED'; result: SiteMergeDuplicatesResult }
  | { type: 'RZD_ANALYTICS_IMPORTED'; inserted: number; duplicates: number }
  | {
      type: 'CHAT_MESSAGE';
      conversation_id: string;
      message: ChatMessage;
      participant_ids: string[];
    }
  | {
      type: 'CHAT_READ';
      conversation_id: string;
      reader_id: string;
      participant_ids: string[];
    }
  | {
      type: 'NOTIFICATION_NEW';
      notification: NotificationItem;
    }
  | {
      type: 'NOTIFICATION_UPDATED';
      notification: NotificationItem;
    }
  | {
      type: 'TASK_BOARD_UPDATED';
      board_id: string;
      board: KanbanBoardDetail;
      task?: KanbanTask;
      deleted_task_id?: string;
    }
  | {
      type: 'TASK_UPDATED';
      board_id: string;
      board: KanbanBoardDetail;
      task?: KanbanTask;
      deleted_task_id?: string;
    }
  | {
      type: 'TASK_WORKSPACE_UPDATED';
      board_id: string;
      board: KanbanBoardDetail;
      task_id: string;
      message?: KanbanTaskMessage;
      milestone?: KanbanTaskMilestone;
      attachment?: KanbanTaskAttachment;
      deleted_milestone_id?: string;
      deleted_attachment_id?: string;
    }
  | {
      type: 'TASK_BOARD_DELETED';
      board_id: string;
    };

export function parseWebSocketMessage(raw: unknown): WebSocketInboundMessage | null {
  if (!raw || typeof raw !== 'object' || !('type' in raw)) return null;
  const msg = raw as WebSocketInboundMessage;
  if (typeof msg.type !== 'string') return null;
  return msg;
}
