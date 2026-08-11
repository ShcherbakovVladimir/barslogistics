import type { FactoryType } from '../types';

export interface SiteCategory {
  id: FactoryType;
  name_ru: string;
  name_en: string;
  sort_order: number;
  csv_filename: string;
}

export const SITE_CATEGORIES: SiteCategory[] = [
  { id: 'gok', name_ru: 'ГОК', name_en: 'GOK', sort_order: 1, csv_filename: 'Барс_ГОК_New.csv' },
  { id: 'port', name_ru: 'Порты', name_en: 'Ports', sort_order: 2, csv_filename: 'Барс_Порты_New.csv' },
  { id: 'steel_mill', name_ru: 'Сталелитейка', name_en: 'Steel mill', sort_order: 3, csv_filename: 'Барс_Сталелитейка_New.csv' },
  { id: 'coal_mine', name_ru: 'Угольные шахты', name_en: 'Coal mines', sort_order: 4, csv_filename: 'Барс_Угольные шахты_New.csv' },
  { id: 'slag_dump', name_ru: 'Шлакоотвалы', name_en: 'Slag dumps', sort_order: 5, csv_filename: 'Барс_Шлакоотвалы_New.csv' },
];

export const SITE_CATEGORY_BY_ID = Object.fromEntries(
  SITE_CATEGORIES.map(c => [c.id, c])
) as Record<FactoryType, SiteCategory>;

export function getSiteCategoryLabel(id: FactoryType, locale: 'ru' | 'en'): string {
  const cat = SITE_CATEGORY_BY_ID[id];
  if (!cat) return id;
  return locale === 'en' ? cat.name_en : cat.name_ru;
}
