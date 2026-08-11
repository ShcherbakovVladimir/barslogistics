/**
 * Re-geocode imported counterparties (cp_imp_*) using KLADR + station + Nominatim.
 *
 *   npm run regeocode:import-counterparties
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';

function bootstrapEnv(): boolean {
  if (process.env.DATABASE_URL) return true;
  for (const path of [join(process.cwd(), '.env'), '/opt/barslogistics/.env']) {
    if (!existsSync(path)) continue;
    loadDotenv({ path });
    if (process.env.DATABASE_URL) return true;
  }
  return false;
}

if (!bootstrapEnv()) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const { initDatabase, closeDatabase, pool } = await import('../server/db.js');
  const { geocodeRussianAddress } = await import('../server/geocoding/ruAddressGeocoder.js');

  await initDatabase();

  const { rows } = await pool.query<{
    id: string;
    name: string;
    address: string | null;
    region: string | null;
  }>(
    `SELECT id, name, address, region FROM factories
     WHERE id LIKE 'cp_imp_%' AND is_ours = FALSE
     ORDER BY name`,
  );

  console.log(`Re-geocoding ${rows.length} imported counterparties…`);
  let updated = 0;

  for (const row of rows) {
    const address = (row.address || row.name || '').trim();
    if (!address) continue;

    const geo = await geocodeRussianAddress(address, {
      regionHint: row.region || undefined,
      label: row.name,
    });

    await pool.query(
      `UPDATE factories SET
         latitude = $2, longitude = $3, region = COALESCE(NULLIF($4, ''), region),
         address = COALESCE(NULLIF($5, ''), address),
         kladr_id = COALESCE(NULLIF($6, ''), kladr_id),
         geocode_source = $7, type = 'port', updated_at = NOW()
       WHERE id = $1`,
      [
        row.id,
        geo.latitude,
        geo.longitude,
        geo.region || row.region || '',
        geo.normalized_address || address,
        geo.kladr_id || '',
        geo.geocode_source,
      ],
    );

    updated++;
    console.log(
      `  ${row.name}: ${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)} (${geo.geocode_source})`,
    );
  }

  await closeDatabase();
  console.log(`Done. Updated ${updated} counterparties.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
