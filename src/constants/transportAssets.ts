/** Transport / construction equipment catalog for the directory. */

export type TransportPurpose = 'shipment' | 'site' | 'both';

export type TransportCategory =
  | 'road'
  | 'rail'
  | 'lifting'
  | 'earthmoving'
  | 'loading'
  | 'concrete'
  | 'roadworks'
  | 'special';

export interface TransportTypeDef {
  key: string;
  category: TransportCategory;
}

export interface TransportPopularModel {
  brand: string;
  model: string;
}

export const TRANSPORT_PURPOSES: TransportPurpose[] = ['shipment', 'site', 'both'];

export const TRANSPORT_CATEGORIES: TransportCategory[] = [
  'road',
  'rail',
  'lifting',
  'earthmoving',
  'loading',
  'concrete',
  'roadworks',
  'special',
];

export const TRANSPORT_TYPES: TransportTypeDef[] = [
  // Road / logistics
  { key: 'truck', category: 'road' },
  { key: 'dump_truck', category: 'road' },
  { key: 'tractor_unit', category: 'road' },
  { key: 'semitrailer', category: 'road' },
  { key: 'van', category: 'road' },
  { key: 'tank_truck', category: 'road' },
  { key: 'lowboy', category: 'road' },
  { key: 'pickup', category: 'road' },
  // Rail
  { key: 'wagon_gondola', category: 'rail' },
  { key: 'wagon_flat', category: 'rail' },
  { key: 'wagon_covered', category: 'rail' },
  { key: 'wagon_tank', category: 'rail' },
  { key: 'wagon_hopper', category: 'rail' },
  { key: 'locomotive', category: 'rail' },
  // Lifting / cranes
  { key: 'crane_truck', category: 'lifting' },
  { key: 'crane_tower', category: 'lifting' },
  { key: 'crane_crawler', category: 'lifting' },
  { key: 'crane_portal', category: 'lifting' },
  { key: 'crane_mobile', category: 'lifting' },
  { key: 'aerial_platform', category: 'lifting' },
  // Earthmoving
  { key: 'bulldozer', category: 'earthmoving' },
  { key: 'excavator', category: 'earthmoving' },
  { key: 'excavator_mini', category: 'earthmoving' },
  { key: 'grader', category: 'earthmoving' },
  { key: 'scraper', category: 'earthmoving' },
  { key: 'trencher', category: 'earthmoving' },
  // Loading
  { key: 'loader_wheel', category: 'loading' },
  { key: 'loader_front', category: 'loading' },
  { key: 'forklift', category: 'loading' },
  { key: 'telehandler', category: 'loading' },
  { key: 'skid_steer', category: 'loading' },
  // Concrete
  { key: 'concrete_mixer', category: 'concrete' },
  { key: 'concrete_pump', category: 'concrete' },
  { key: 'concrete_placer', category: 'concrete' },
  // Road works
  { key: 'roller', category: 'roadworks' },
  { key: 'asphalt_paver', category: 'roadworks' },
  { key: 'milling_machine', category: 'roadworks' },
  // Special
  { key: 'generator', category: 'special' },
  { key: 'compressor', category: 'special' },
  { key: 'welding_unit', category: 'special' },
  { key: 'pile_driver', category: 'special' },
  { key: 'drilling_rig', category: 'special' },
  { key: 'other', category: 'special' },
];

export const TRANSPORT_POPULAR_MODELS: Record<string, TransportPopularModel[]> = {
  truck: [
    { brand: 'КАМАЗ', model: '65115' },
    { brand: 'КАМАЗ', model: '6520' },
    { brand: 'МАЗ', model: '6312' },
    { brand: 'Volvo', model: 'FH16' },
    { brand: 'Scania', model: 'R500' },
    { brand: 'Mercedes-Benz', model: 'Actros' },
  ],
  dump_truck: [
    { brand: 'КАМАЗ', model: '65201' },
    { brand: 'МАЗ', model: '6501' },
    { brand: 'Howo', model: 'Sinotruk' },
    { brand: 'Shacman', model: 'X3000' },
    { brand: 'Volvo', model: 'FMX' },
  ],
  tractor_unit: [
    { brand: 'КАМАЗ', model: '5490' },
    { brand: 'МАЗ', model: '5440' },
    { brand: 'Volvo', model: 'FH' },
    { brand: 'Scania', model: 'S500' },
    { brand: 'MAN', model: 'TGX' },
  ],
  crane_truck: [
    { brand: 'Ивановец', model: 'КС-45717' },
    { brand: 'Галичанин', model: 'КС-55713' },
    { brand: 'Клинцы', model: 'КС-55713-1В' },
    { brand: 'Liebherr', model: 'LTF 1045' },
    { brand: 'XCMG', model: 'QY25K5' },
  ],
  crane_tower: [
    { brand: 'Potain', model: 'MDT 389' },
    { brand: 'Liebherr', model: '280 EC-H' },
    { brand: 'Zoomlion', model: 'WA6017' },
    { brand: 'КБ', model: '403А' },
    { brand: 'Liebherr', model: '132 EC-B' },
  ],
  crane_crawler: [
    { brand: 'Liebherr', model: 'LR 1100' },
    { brand: 'Sany', model: 'SCC1000A' },
    { brand: 'XCMG', model: 'XGC85' },
  ],
  bulldozer: [
    { brand: 'ЧТЗ', model: 'Б10М' },
    { brand: 'ЧЕТРА', model: 'Т-11' },
    { brand: 'Caterpillar', model: 'D6' },
    { brand: 'Caterpillar', model: 'D9' },
    { brand: 'Komatsu', model: 'D65EX' },
    { brand: 'Shantui', model: 'SD16' },
  ],
  excavator: [
    { brand: 'Caterpillar', model: '320D' },
    { brand: 'Komatsu', model: 'PC200' },
    { brand: 'Hitachi', model: 'ZX200' },
    { brand: 'Hyundai', model: 'R220LC' },
    { brand: 'JCB', model: 'JS220' },
    { brand: 'ТВЭКС', model: 'ЕГ-332' },
  ],
  excavator_mini: [
    { brand: 'Kubota', model: 'KX080' },
    { brand: 'JCB', model: '8026 CTS' },
    { brand: 'Caterpillar', model: '303.5' },
    { brand: 'Bobcat', model: 'E50' },
  ],
  loader_wheel: [
    { brand: 'Амкодор', model: '342С' },
    { brand: 'ТО-18Б', model: 'ПТК' },
    { brand: 'Caterpillar', model: '950M' },
    { brand: 'Komatsu', model: 'WA380' },
    { brand: 'Volvo', model: 'L120H' },
  ],
  forklift: [
    { brand: 'Toyota', model: '8FG25' },
    { brand: 'Hyster', model: 'H2.5FT' },
    { brand: 'Still', model: 'RX60' },
    { brand: 'ТЦМ', model: 'FG15T' },
  ],
  concrete_mixer: [
    { brand: 'ТЗА', model: '58147А' },
    { brand: 'КАМАЗ', model: 'АБС-7' },
    { brand: 'Liebherr', model: 'HTM 904' },
  ],
  concrete_pump: [
    { brand: 'Putzmeister', model: 'M36-4' },
    { brand: 'Schwing', model: 'S36X' },
    { brand: 'Zoomlion', model: '37X-5RZ' },
  ],
  grader: [
    { brand: 'ДЗ-98', model: 'В' },
    { brand: 'Caterpillar', model: '140M' },
    { brand: 'John Deere', model: '672G' },
  ],
  roller: [
    { brand: 'Ду-47Б', model: '' },
    { brand: 'Bomag', model: 'BW 213' },
    { brand: 'Hamm', model: 'HD 120' },
    { brand: 'Dynapac', model: 'CA2500' },
  ],
  wagon_gondola: [
    { brand: 'УВЗ', model: '12-132' },
    { brand: 'Алтайвагон', model: '12-196-01' },
  ],
  wagon_flat: [
    { brand: 'УВЗ', model: '13-198' },
    { brand: 'ТВЗ', model: '13-401' },
  ],
  locomotive: [
    { brand: 'ТЭМ18ДМ', model: '' },
    { brand: 'ЧМЭ3', model: '' },
    { brand: '2ТЭ116У', model: '' },
  ],
};

export function transportTypesByCategory(category: TransportCategory): TransportTypeDef[] {
  return TRANSPORT_TYPES.filter(t => t.category === category);
}

export function popularModelsForType(typeKey: string): TransportPopularModel[] {
  return TRANSPORT_POPULAR_MODELS[typeKey] || [];
}

export function findTransportType(typeKey: string): TransportTypeDef | undefined {
  return TRANSPORT_TYPES.find(t => t.key === typeKey);
}
