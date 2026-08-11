import type { TelegramSettings, CloudSettings, TelemetrySettings, MapDataSettings, GeocodingSettings, MailSettings } from "../../src/types.js";

export function maskSecret(value?: string): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `****${value.slice(-4)}`;
}

export function maskTelegramSettings(settings: TelegramSettings): TelegramSettings {
  return {
    ...settings,
    bot_token: settings.bot_token ? maskSecret(settings.bot_token) : "",
  };
}

export function maskCloudSettings(settings: CloudSettings): CloudSettings {
  const masked = { ...settings };
  if (masked.s3) {
    masked.s3 = {
      ...masked.s3,
      secret_access_key: maskSecret(masked.s3.secret_access_key),
      access_key_id: maskSecret(masked.s3.access_key_id),
    };
  }
  if (masked.yandex) {
    masked.yandex = {
      ...masked.yandex,
      oauth_token: maskSecret(masked.yandex.oauth_token),
    };
  }
  if (masked.gdrive) {
    masked.gdrive = {
      ...masked.gdrive,
      access_token: maskSecret(masked.gdrive.access_token),
    };
  }
  return masked;
}

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  enabled: false,
  bot_token: "",
  default_chat_id: "",
  alert_on_delay: true,
  alert_on_status_change: false,
};

export const DEFAULT_CLOUD_SETTINGS: CloudSettings = {
  enabled: false,
  provider: "s3",
  auto_upload_on_backup: true,
  s3: {
    bucket: "",
    region: "us-east-1",
    access_key_id: "",
    secret_access_key: "",
    prefix: "barslogistics/backups",
  },
  yandex: {
    oauth_token: "",
    folder_path: "/barslogistics/backups",
  },
  gdrive: {
    access_token: "",
    folder_id: "",
  },
};

export const DEFAULT_TELEMETRY_SETTINGS: TelemetrySettings = {
  enabled: true,
  poll_interval_sec: 30,
  sync_carriers: true,
  webhook_enabled: true,
  webhook_secret: "",
  allow_jwt_push: true,
  calculate_progress: true,
  arrived_threshold_pct: 98,
  lat_field: "lat",
  lng_field: "lng",
  speed_field: "speed_kmh",
  id_field: "id",
};

export const DEFAULT_MAP_DATA_SETTINGS: MapDataSettings = {
  enabled: false,
  api_endpoint: "",
  auth_type: "bearer",
  api_key: "",
  sync_path: "",
  factories_path: "factories",
  supply_links_path: "supply_links",
  default_import_mode: "merge",
};

export const DEFAULT_GEOCODING_SETTINGS: GeocodingSettings = {
  enabled: true,
  kladr_provider: "auto",
  kladr_api_plan: "paid",
  kladr_api_url: "",
  kladr_api_token: "",
  kladr_api_key: "",
  kladr_fallback_api: true,
  nominatim_enabled: true,
  nominatim_base_url: "https://nominatim.openstreetmap.org",
  station_lookup_enabled: true,
  known_places_enabled: true,
  local_db_source_url: "https://fias.nalog.ru/Public/Downloads/Actual/base.arj",
};

export function maskMapDataSettings(settings: MapDataSettings): MapDataSettings {
  return {
    ...settings,
    api_key: settings.api_key ? maskSecret(settings.api_key) : "",
  };
}

export function maskTelemetrySettings(settings: TelemetrySettings): TelemetrySettings {
  return {
    ...settings,
    webhook_secret: settings.webhook_secret ? maskSecret(settings.webhook_secret) : "",
  };
}

export function maskGeocodingSettings(settings: GeocodingSettings): GeocodingSettings {
  return {
    ...settings,
    kladr_api_token: settings.kladr_api_token ? maskSecret(settings.kladr_api_token) : "",
    kladr_api_key: settings.kladr_api_key ? maskSecret(settings.kladr_api_key) : "",
  };
}

export const DEFAULT_MAIL_SETTINGS: MailSettings = {
  enabled: false,
  mode: "builtin",
  registration_enabled: false,
  from_name: "BarsLogistics",
  from_address: "noreply@localhost",
  public_base_url: "",
  builtin_hostname: "localhost",
  builtin_port: 2525,
  smtp_host: "",
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: "",
  smtp_password: "",
};

export function maskMailSettings(settings: MailSettings): MailSettings {
  return {
    ...settings,
    smtp_password: settings.smtp_password ? maskSecret(settings.smtp_password) : "",
  };
}

export function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function mergeSecrets<T extends object>(
  incoming: Partial<T>,
  existing: T,
  secretKeys: (keyof T)[]
): T {
  const merged = { ...existing, ...incoming };
  for (const key of secretKeys) {
    const val = incoming[key];
    if (typeof val === "string" && val.startsWith("****")) {
      merged[key] = existing[key];
    }
  }
  return merged;
}
