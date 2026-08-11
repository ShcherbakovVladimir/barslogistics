import { pool } from "../db.js";
import type { TelegramSettings, CloudSettings, TelemetrySettings, MapDataSettings, GeocodingSettings, MailSettings } from "../../src/types.js";
import {
  DEFAULT_TELEGRAM_SETTINGS,
  DEFAULT_CLOUD_SETTINGS,
  DEFAULT_TELEMETRY_SETTINGS,
  DEFAULT_MAP_DATA_SETTINGS,
  DEFAULT_GEOCODING_SETTINGS,
  DEFAULT_MAIL_SETTINGS,
  maskTelegramSettings,
  maskCloudSettings,
  maskTelemetrySettings,
  maskMapDataSettings,
  maskGeocodingSettings,
  maskMailSettings,
  mergeSecrets,
} from "./helpers.js";
import { invalidateGeocodingSettingsCache } from "../geocoding/kladrConfig.js";

async function getSettings<T>(category: string, defaults: T): Promise<T> {
  const { rows } = await pool.query<{ settings: T }>(
    "SELECT settings FROM integration_settings WHERE category = $1",
    [category]
  );
  if (!rows[0]) return { ...defaults };
  return { ...defaults, ...rows[0].settings };
}

async function saveSettings<T>(category: string, settings: T): Promise<T> {
  await pool.query(
    `INSERT INTO integration_settings (category, settings, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (category) DO UPDATE SET settings = $2::jsonb, updated_at = NOW()`,
    [category, JSON.stringify(settings)]
  );
  return settings;
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  return getSettings("telegram", DEFAULT_TELEGRAM_SETTINGS);
}

export async function getTelegramSettingsMasked(): Promise<TelegramSettings> {
  return maskTelegramSettings(await getTelegramSettings());
}

export async function updateTelegramSettings(partial: Partial<TelegramSettings>): Promise<TelegramSettings> {
  const existing = await getTelegramSettings();
  const merged = mergeSecrets(partial, existing, ["bot_token"]);
  await saveSettings("telegram", merged);
  return maskTelegramSettings(merged);
}

export async function getCloudSettings(): Promise<CloudSettings> {
  return getSettings("cloud", DEFAULT_CLOUD_SETTINGS);
}

export async function getCloudSettingsMasked(): Promise<CloudSettings> {
  return maskCloudSettings(await getCloudSettings());
}

export async function updateCloudSettings(partial: Partial<CloudSettings>): Promise<CloudSettings> {
  const existing = await getCloudSettings();
  const merged: CloudSettings = {
    ...existing,
    ...partial,
    s3: partial.s3
      ? mergeSecrets(partial.s3, existing.s3 || DEFAULT_CLOUD_SETTINGS.s3!, ["access_key_id", "secret_access_key"])
      : existing.s3,
    yandex: partial.yandex
      ? mergeSecrets(partial.yandex, existing.yandex || DEFAULT_CLOUD_SETTINGS.yandex!, ["oauth_token"])
      : existing.yandex,
    gdrive: partial.gdrive
      ? mergeSecrets(partial.gdrive, existing.gdrive || DEFAULT_CLOUD_SETTINGS.gdrive!, ["access_token"])
      : existing.gdrive,
  };
  await saveSettings("cloud", merged);
  return maskCloudSettings(merged);
}

export async function setCloudLastUpload(error?: string) {
  const settings = await getCloudSettings();
  settings.last_upload_at = new Date().toISOString();
  settings.last_error = error || undefined;
  await saveSettings("cloud", settings);
}

export async function getTelemetrySettings(): Promise<TelemetrySettings> {
  return getSettings("telemetry", DEFAULT_TELEMETRY_SETTINGS);
}

export async function getTelemetrySettingsMasked(): Promise<TelemetrySettings> {
  return maskTelemetrySettings(await getTelemetrySettings());
}

export async function updateTelemetrySettings(partial: Partial<TelemetrySettings>): Promise<TelemetrySettings> {
  const existing = await getTelemetrySettings();
  const merged = mergeSecrets(partial, existing, ["webhook_secret"]);
  await saveSettings("telemetry", merged);
  return maskTelemetrySettings(merged);
}

export async function setTelemetrySyncResult(updated: number, error?: string) {
  const settings = await getTelemetrySettings();
  settings.last_sync_at = new Date().toISOString();
  settings.last_updated_count = updated;
  settings.last_error = error || undefined;
  await saveSettings("telemetry", settings);
}

export async function getMapDataSettings(): Promise<MapDataSettings> {
  return getSettings("map_data", DEFAULT_MAP_DATA_SETTINGS);
}

export async function getMapDataSettingsMasked(): Promise<MapDataSettings> {
  return maskMapDataSettings(await getMapDataSettings());
}

export async function updateMapDataSettings(partial: Partial<MapDataSettings>): Promise<MapDataSettings> {
  const existing = await getMapDataSettings();
  const merged = mergeSecrets(partial, existing, ["api_key"]);
  await saveSettings("map_data", merged);
  return maskMapDataSettings(merged);
}

export async function updateMapDataSettingsState(partial: Partial<MapDataSettings>): Promise<void> {
  const existing = await getMapDataSettings();
  await saveSettings("map_data", { ...existing, ...partial });
}

export async function getGeocodingSettings(): Promise<GeocodingSettings> {
  return getSettings("geocoding", DEFAULT_GEOCODING_SETTINGS);
}

export async function getGeocodingSettingsMasked(): Promise<GeocodingSettings> {
  return maskGeocodingSettings(await getGeocodingSettings());
}

export async function updateGeocodingSettings(partial: Partial<GeocodingSettings>): Promise<GeocodingSettings> {
  const existing = await getGeocodingSettings();
  const merged = mergeSecrets(partial, existing, ["kladr_api_token", "kladr_api_key"]);
  await saveSettings("geocoding", merged);
  invalidateGeocodingSettingsCache();
  return maskGeocodingSettings(merged);
}

export async function updateGeocodingSettingsState(partial: Partial<GeocodingSettings>): Promise<void> {
  const existing = await getGeocodingSettings();
  await saveSettings("geocoding", { ...existing, ...partial });
  invalidateGeocodingSettingsCache();
}

export async function getMailSettings(): Promise<MailSettings> {
  return getSettings("mail", DEFAULT_MAIL_SETTINGS);
}

export async function getMailSettingsMasked(): Promise<MailSettings> {
  return maskMailSettings(await getMailSettings());
}

export async function updateMailSettings(partial: Partial<MailSettings>): Promise<MailSettings> {
  const existing = await getMailSettings();
  const merged = mergeSecrets(partial, existing, ["smtp_password"]);
  if (typeof merged.builtin_port === "number") {
    merged.builtin_port = Math.max(1, Math.min(65535, Math.floor(merged.builtin_port)));
  }
  if (typeof merged.smtp_port === "number") {
    merged.smtp_port = Math.max(1, Math.min(65535, Math.floor(merged.smtp_port)));
  }
  await saveSettings("mail", merged);
  return maskMailSettings(merged);
}

export async function updateMailSettingsState(partial: Partial<MailSettings>): Promise<void> {
  const existing = await getMailSettings();
  await saveSettings("mail", { ...existing, ...partial });
}
