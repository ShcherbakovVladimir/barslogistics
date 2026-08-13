import type { EnterpriseStatus, Factory, FactoryType, SiteCsvImportResult } from "../src/types.js";
import { extractRegionFromAddress } from "../src/utils/factoryRegionTree.js";
import { pool } from "./db.js";
import { upsertFactoryFromDirectory } from "./repositories.js";

const FACTORY_TYPES = new Set<FactoryType>(["gok", "port", "steel_mill", "slag_dump", "coal_mine"]);

const SKIP_NAMES = new Set(["портов нет", "нет"]);

/** Manual fixes for rows with known bad/missing coordinates */
const COORD_OVERRIDES: Record<string, { latitude: number; longitude: number }> = {
  "сергинский порт": { latitude: 62.5665, longitude: 65.5833 },
};

const MONTH_DECIMAL: Record<string, string> = {
  янв: "1",
  фев: "2",
  мар: "3",
  апр: "4",
  май: "5",
  июн: "6",
  июл: "7",
  авг: "8",
  сен: "9",
  окт: "10",
  ноя: "11",
  дек: "12",
};

const HEADER_ALIASES: Record<string, string> = {
  "№": "sort_order",
  id: "id",
  идентификатор: "id",
  name: "name",
  название: "name",
  наименование: "name",
  компания: "company",
  объект: "name",
  latitude: "latitude",
  lat: "latitude",
  широта: "latitude",
  longitude: "longitude",
  lng: "longitude",
  lon: "longitude",
  долгота: "longitude",
  region: "region",
  регион: "region",
  country: "country",
  страна: "country",
  holding: "holding",
  холдинг: "holding",
  компания_холдинг: "holding",
  description: "description",
  описание: "description",
  "что производит": "product",
  "что возят через них": "cargo",
  производство: "production",
  сырье: "raw_materials",
  сырьё: "raw_materials",
  экспорт: "export_info",
  импорт: "import_info",
  "тип угля": "coal_type",
  "кто покупает": "buyers",
  "тип отхода": "waste_type",
  статус: "status",
  address: "address",
  адрес: "address",
  code: "code",
  код: "code",
  sort_order: "sort_order",
};

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function detectDelimiter(line: string): string {
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function cleanCell(value: string | undefined): string {
  if (!value) return "";
  const v = value.trim();
  if (v === "—" || v === "–" || v === "-") return "";
  return v;
}

function fixCoordinateString(value: string): string {
  let v = value.trim().replace(/^~+/, "");
  v = v.replace(/\(прибл\.?\)/gi, "");
  v = v.replace(
    /\.(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)$/i,
    (_, m: string) => `.${MONTH_DECIMAL[m.toLowerCase()] ?? m}`
  );
  return v.trim();
}

function parseCoordinate(value: string | undefined): number | null {
  const cleaned = cleanCell(value);
  if (!cleaned) return null;
  const fixed = fixCoordinateString(cleaned);
  const match = fixed.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const n = Number(match[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseLatitude(value: string | undefined): number | null {
  const n = parseCoordinate(value);
  if (n == null || n < -90 || n > 90) return null;
  return n;
}

function parseLongitude(value: string | undefined): number | null {
  const n = parseCoordinate(value);
  if (n == null || n < -180 || n > 180) return null;
  return n;
}

function mapEnterpriseStatus(value: string | undefined): EnterpriseStatus {
  const v = cleanCell(value).toLowerCase();
  if (v.includes("актив")) return "active";
  if (v.includes("пауз") || v.includes("приостанов")) return "paused";
  if (v.includes("неактив") || v.includes("закрыт")) return "inactive";
  if (v.includes("никогда")) return "never";
  return "never";
}

function extractRegion(address: string): string {
  return extractRegionFromAddress(address);
}

function joinParts(parts: Array<[string, string | undefined]>): string {
  return parts
    .map(([label, val]) => {
      const v = cleanCell(val);
      return v ? `${label}: ${v}` : "";
    })
    .filter(Boolean)
    .join(" | ");
}

function buildDescription(category: FactoryType, row: Record<string, string>): string {
  switch (category) {
    case "gok":
      return cleanCell(row.product) || cleanCell(row.description);
    case "port":
      return cleanCell(row.cargo) || cleanCell(row.description);
    case "steel_mill":
      return joinParts([
        ["Производство", row.production],
        ["Сырьё", row.raw_materials],
        ["Экспорт", row.export_info],
        ["Импорт", row.import_info],
      ]);
    case "coal_mine":
      return joinParts([
        ["Тип угля", row.coal_type],
        ["Покупатели", row.buyers],
      ]);
    case "slag_dump":
      return cleanCell(row.waste_type) || cleanCell(row.description);
    default:
      return cleanCell(row.description);
  }
}

function resolveHolding(category: FactoryType, row: Record<string, string>): string {
  if (category === "coal_mine") return cleanCell(row.holding);
  return cleanCell(row.holding);
}

function mapHeader(header: string, category: FactoryType): string {
  const key = normalizeHeader(header);
  if (category === "slag_dump" && key === "компания") return "name";
  if (category === "coal_mine" && key === "компания") return "holding";
  return HEADER_ALIASES[key] || key;
}

function makeSiteId(category: FactoryType, sortOrder: number): string {
  return `${category}_${sortOrder}`;
}

function shouldSkipRow(name: string, lat: number | null, lng: number | null): boolean {
  const key = name.trim().toLowerCase();
  if (SKIP_NAMES.has(key)) return true;
  if (key.startsWith("портов нет")) return true;
  return lat == null && lng == null;
}

export function parseSitesCsv(csvText: string, category: FactoryType): { factories: Factory[]; errors: string[]; skipped: number } {
  if (!FACTORY_TYPES.has(category)) {
    return { factories: [], errors: [`Invalid category: ${category}`], skipped: 0 };
  }

  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { factories: [], errors: ["CSV file is empty"], skipped: 0 };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    return { factories: [], errors: ["CSV file is empty"], skipped: 0 };
  }

  const delimiter = detectDelimiter(headerLine);
  const headers = parseCsvLine(headerLine, delimiter).map(h => mapHeader(h, category));

  const factories: Factory[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });

    const name = cleanCell(row.name);
    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      continue;
    }

    let latitude = parseLatitude(row.latitude);
    let longitude = parseLongitude(row.longitude);

    const override = COORD_OVERRIDES[name.toLowerCase()];
    if (override) {
      latitude = override.latitude;
      longitude = override.longitude;
    }

    if (shouldSkipRow(name, latitude, longitude)) {
      skipped++;
      continue;
    }

    if (latitude == null || longitude == null) {
      errors.push(`Row ${i + 1} (${name}): invalid coordinates (${row.latitude || "—"}, ${row.longitude || "—"})`);
      continue;
    }

    const address = cleanCell(row.address);
    const sortOrder = Math.round(parseCoordinate(row.sort_order) ?? i);
    const holding = resolveHolding(category, row);
    const siteId = cleanCell(row.id) || makeSiteId(category, sortOrder);

    factories.push({
      id: siteId,
      name,
      type: category,
      latitude,
      longitude,
      region: cleanCell(row.region) || extractRegion(address),
      country: cleanCell(row.country) || "РФ",
      is_ours: false,
      description: buildDescription(category, row),
      holding,
      code: String(sortOrder),
      address,
      enterprise_status: mapEnterpriseStatus(row.status),
      is_active: true,
      sort_order: sortOrder,
    });
  }

  return { factories, errors, skipped };
}

export async function importSitesCsv(
  csvText: string,
  category: FactoryType,
  mode: "merge" | "replace" = "merge"
): Promise<SiteCsvImportResult> {
  const { factories, errors, skipped: parseSkipped } = parseSitesCsv(csvText, category);
  let imported = 0;
  let updated = 0;
  let merged = 0;
  let skipped = parseSkipped;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (mode === "replace") {
      await client.query(
        `UPDATE factories SET is_active = FALSE, updated_at = NOW()
         WHERE type = $1 AND id NOT IN (
           SELECT DISTINCT origin_id FROM supply_links
           UNION SELECT DISTINCT destination_id FROM supply_links
         )`,
        [category]
      );
    }

    for (const factory of factories) {
      try {
        const result = await upsertFactoryFromDirectory(client, factory);
        if (result === "inserted") imported++;
        else if (result === "updated") updated++;
        else if (result === "merged") merged++;
        else skipped++;
      } catch (e) {
        errors.push(`${factory.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return { category, imported, updated, merged, skipped, errors };
}
