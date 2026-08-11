import { lookupKladrAddress, requestKladr, getKladrEndpointList } from '../geocoding/kladrClient.js';
import { getKladrLocalStats, runFullKladrImport } from '../geocoding/kladrImport.js';
import { isKladrLocalDbReady } from '../geocoding/kladrLocalDb.js';
import {
  getGeocodingSettings,
  updateGeocodingSettingsState,
} from './settings.js';
import type { GeocodingTestResult, KladrLocalImportStatus } from '../../src/types.js';

let importInProgress = false;

export async function testGeocodingConnection(sampleAddress = 'Рязань, ул Новая 24'): Promise<GeocodingTestResult> {
  const settings = await getGeocodingSettings();
  const localReady = await isKladrLocalDbReady();
  const endpoints = await getKladrEndpointList();

  let ok = false;
  let message = '';

  if (settings.kladr_provider === 'local_db' && localReady) {
    const hit = await lookupKladrAddress(sampleAddress);
    ok = Boolean(hit?.id);
    message = ok
      ? `Локальная база: ${hit!.normalizedAddress}`
      : 'Локальная база не нашла адрес по образцу';
  } else {
    const apiProbe = await requestKladr({
      query: 'Москва',
      contentType: 'city',
      withParent: '1',
      limit: '1',
    });
    ok = Boolean(apiProbe?.result?.length);
    message = ok ? 'Внешний KLADR API отвечает' : 'Внешний KLADR API недоступен';
    if (ok && settings.kladr_provider !== 'local_db') {
      const hit = await lookupKladrAddress(sampleAddress);
      if (hit?.id) message += ` · ${hit.normalizedAddress}`;
    }
  }

  const result: GeocodingTestResult = {
    ok,
    message,
    kladr_provider: settings.kladr_provider,
    local_db_ready: localReady,
    api_endpoints: endpoints,
    sample: ok
      ? await lookupKladrAddress(sampleAddress).then(hit => hit
        ? { address: sampleAddress, kladr_id: hit.id, normalized: hit.normalizedAddress }
        : undefined)
      : undefined,
  };

  await updateGeocodingSettingsState({
    last_test_at: new Date().toISOString(),
    last_test_ok: ok,
    last_test_message: message,
    last_error: ok ? undefined : message,
    local_db_settlement_count: (await getKladrLocalStats()).settlement_count,
    local_db_street_count: (await getKladrLocalStats()).street_count,
    local_db_building_count: (await getKladrLocalStats()).building_count,
  });

  return result;
}

export async function getKladrImportStatus(): Promise<KladrLocalImportStatus> {
  const settings = await getGeocodingSettings();
  const stats = await getKladrLocalStats();
  return {
    in_progress: importInProgress || Boolean(settings.local_db_import_in_progress),
    settlement_count: stats.settlement_count || settings.local_db_settlement_count || 0,
    street_count: stats.street_count || settings.local_db_street_count || 0,
    building_count: stats.building_count || settings.local_db_building_count || 0,
    last_import_at: stats.last_import_at || settings.local_db_last_import_at,
    last_error: settings.local_db_last_error,
    archive_url: stats.archive_url || settings.local_db_source_url,
  };
}

export async function startKladrLocalImport(): Promise<{ started: boolean; message: string }> {
  if (importInProgress) {
    return { started: false, message: 'Импорт уже выполняется' };
  }

  const settings = await getGeocodingSettings();
  importInProgress = true;
  await updateGeocodingSettingsState({
    local_db_import_in_progress: true,
    local_db_last_error: undefined,
  });

  void (async () => {
    try {
      const result = await runFullKladrImport(settings.local_db_source_url);
      await updateGeocodingSettingsState({
        local_db_import_in_progress: false,
        local_db_last_import_at: new Date().toISOString(),
        local_db_settlement_count: result.settlement_count,
        local_db_street_count: result.street_count,
        local_db_building_count: result.building_count,
        local_db_last_error: undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await updateGeocodingSettingsState({
        local_db_import_in_progress: false,
        local_db_last_error: message,
      });
    } finally {
      importInProgress = false;
    }
  })();

  return { started: true, message: 'Скачивание и импорт КЛАДР запущены в фоне' };
}
