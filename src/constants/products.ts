import type { Product } from '../types';

/** Default seed catalog — used only when DB is empty */
export const DEFAULT_PRODUCT_CATALOG: Product[] = [
  { id: 'slag_met', name_ru: 'Шлаки мет. пр.', name_en: 'Metallurgical slag', sort_order: 1, is_active: true },
  { id: 'slag_blast', name_ru: 'Шлаки домен.', name_en: 'Blast-furnace slag', sort_order: 2, is_active: true },
  { id: 'slag_eaf', name_ru: 'Шлаки электрпеч.', name_en: 'EAF slag', sort_order: 3, is_active: true },
  { id: 'conc_fe', name_ru: 'Концентрат жлру', name_en: 'Iron ore concentrate', sort_order: 4, is_active: true },
  { id: 'ore_fe', name_ru: 'Руда желез. пр.', name_en: 'Iron ore (processed)', sort_order: 5, is_active: true },
  { id: 'ore_fe_dom', name_ru: 'Руда желез. дом.', name_en: 'Iron ore (domestic)', sort_order: 6, is_active: true },
  { id: 'scrap_steel', name_ru: 'Лом чермет пр.', name_en: 'Ferrous scrap (processed)', sort_order: 7, is_active: true },
  { id: 'scrap_steel_dp', name_ru: 'Лом чермет д/п', name_en: 'Ferrous scrap (direct)', sort_order: 8, is_active: true },
  { id: 'scraps', name_ru: 'Скрапы', name_en: 'Scrap', sort_order: 9, is_active: true },
  { id: 'gravel', name_ru: 'Щебенка', name_en: 'Gravel', sort_order: 10, is_active: true },
  { id: 'pig_iron', name_ru: 'Чугун пер. ряд.', name_en: 'Pig iron (regular)', sort_order: 11, is_active: true },
  { id: 'pig_iron_hi', name_ru: 'Чугун пер. выск.', name_en: 'Pig iron (high-grade)', sort_order: 12, is_active: true },
  { id: 'flux_blast', name_ru: 'Присад. домен.', name_en: 'Blast-furnace flux', sort_order: 13, is_active: true },
  { id: 'scale', name_ru: 'Окалина чермет.', name_en: 'Mill scale', sort_order: 14, is_active: true },
  { id: 'sponge_iron', name_ru: 'Железо губчат.', name_en: 'Sponge iron', sort_order: 15, is_active: true },
  { id: 'swarf_steel', name_ru: 'Стружка чмет пр.', name_en: 'Steel swarf', sort_order: 16, is_active: true },
  { id: 'swarf_coil', name_ru: 'Стружка ст. вьюн.', name_en: 'Coil swarf', sort_order: 17, is_active: true },
  { id: 'briquettes', name_ru: 'Огарки желруд.', name_en: 'Iron ore briquettes', sort_order: 18, is_active: true },
  { id: 'briq_steel', name_ru: 'Брикеты ст. стр.', name_en: 'Steel briquettes', sort_order: 19, is_active: true },
  { id: 'hematite', name_ru: 'Гематит', name_en: 'Hematite', sort_order: 20, is_active: true },
];

/** @deprecated use DEFAULT_PRODUCT_CATALOG */
export const PRODUCT_CATALOG = DEFAULT_PRODUCT_CATALOG;

export function activeProducts(catalog: Product[]): Product[] {
  return catalog.filter(p => p.is_active !== false);
}

export function getProductName(id: string, locale: 'ru' | 'en', catalog: Product[] = DEFAULT_PRODUCT_CATALOG): string {
  const p = catalog.find(x => x.id === id);
  if (!p) return id;
  return locale === 'ru' ? p.name_ru : p.name_en;
}

/** Best-effort mapping from free-text cargo_type to catalog id */
export function mapCargoTypeToProductId(cargoType: string, catalog: Product[] = DEFAULT_PRODUCT_CATALOG): string {
  const t = cargoType.toLowerCase();
  if (t.includes('шлак') && t.includes('домен')) return 'slag_blast';
  if (t.includes('шлак') && t.includes('электр')) return 'slag_eaf';
  if (t.includes('шлак')) return 'slag_met';
  if (t.includes('концентрат')) return 'conc_fe';
  if (t.includes('руда') && t.includes('дом')) return 'ore_fe_dom';
  if (t.includes('руда') || t.includes('гематит')) return t.includes('гематит') ? 'hematite' : 'ore_fe';
  if (t.includes('щебен')) return 'gravel';
  if (t.includes('скрап')) return 'scraps';
  if (t.includes('лом') && (t.includes('д/п') || t.includes('дп'))) return 'scrap_steel_dp';
  if (t.includes('лом')) return 'scrap_steel';
  if (t.includes('чугун') && t.includes('выс')) return 'pig_iron_hi';
  if (t.includes('чугун')) return 'pig_iron';
  if (t.includes('присад')) return 'flux_blast';
  if (t.includes('окалин')) return 'scale';
  if (t.includes('губчат')) return 'sponge_iron';
  if (t.includes('стружк') && t.includes('вьюн')) return 'swarf_coil';
  if (t.includes('стружк')) return 'swarf_steel';
  if (t.includes('огарк') || t.includes('брикет')) return t.includes('ст') ? 'briq_steel' : 'briquettes';
  if (t.includes('гематит')) return 'hematite';
  const first = activeProducts(catalog)[0];
  return first?.id ?? 'scrap_steel';
}
