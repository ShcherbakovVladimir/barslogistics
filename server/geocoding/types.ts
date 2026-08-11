export interface ParsedAddress {
  raw: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  station?: string;
}

export interface KladrMatch {
  id: string;
  name: string;
  typeShort?: string;
  zip?: string | null;
  normalizedAddress: string;
  region?: string;
  contentType?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  kladr_id?: string;
  normalized_address?: string;
  region?: string;
  geocode_source: string;
}
