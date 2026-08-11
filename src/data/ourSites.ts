import type { Factory } from '../types';

/** Внутренний контур — «Наши площадки» (источник: data/sites/Барс_Наши площадки.csv) */
export const OUR_SITES: Factory[] = [
  {
    id: '7dur8DgcU9QQdM3ZKyb0marke',
    name: 'Чусовой',
    type: 'steel_mill',
    latitude: 58.2991,
    longitude: 57.8165,
    region: 'Пермский край',
    country: 'РФ',
    is_ours: true,
    description: 'скрап',
    holding: '',
    address: 'Пермский край, Чусовой, Вильвенская улица, 64Б',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'aQOWlcH4hpZYSUfRL1M0marke',
    name: 'Липецк',
    type: 'steel_mill',
    latitude: 52.549604,
    longitude: 39.598924,
    region: 'Липецкая область',
    country: 'РФ',
    is_ours: true,
    description: 'Скрап, щебенка',
    holding: '',
    address: 'г. Липецк улица чехова, 2а',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'MioQrLLLMc7fgv9s0f10marke',
    name: 'Волжский',
    type: 'steel_mill',
    latitude: 48.81982,
    longitude: 44.841249,
    region: 'Волгоградская область',
    country: 'РФ',
    is_ours: true,
    description: 'скрап',
    holding: '',
    address: 'г. Волжский, 7-я Автодорога д. 28',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'pVk4KrasnOktbr1170marke',
    name: 'Красный октябрь',
    type: 'steel_mill',
    latitude: 48.776444,
    longitude: 44.38318,
    region: 'Волгоградская область',
    country: 'РФ',
    is_ours: true,
    description: 'скрап',
    holding: '',
    address: 'г. Волгоград, ул. Ленина 117',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'zBm5TranzitZhlob0marke',
    name: 'БМЗ Транзит',
    type: 'steel_mill',
    latitude: 52.892256,
    longitude: 30.037822,
    region: 'Жлобин',
    country: 'РФ',
    is_ours: true,
    description: 'скрап',
    holding: '',
    address: 'г. Жлобин',
    is_active: true,
    sort_order: 5,
  },
];

export const OUR_SITE_IDS = new Set(OUR_SITES.map(s => s.id));

export function applyOurSitesToFactories(factories: Factory[]): Factory[] {
  const byId = new Map(factories.map(f => [f.id, { ...f }]));
  for (const site of OUR_SITES) {
    byId.set(site.id, { ...site });
  }
  return [...byId.values()].map(f => ({
    ...f,
    is_ours: OUR_SITE_IDS.has(f.id),
  }));
}
