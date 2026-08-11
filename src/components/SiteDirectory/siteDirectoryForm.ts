import type { Factory, FactoryType } from '../../types';

export type SiteDirectoryFormState = {
  id: string;
  name: string;
  type: FactoryType;
  latitude: string;
  longitude: string;
  region: string;
  country: string;
  holding: string;
  description: string;
  code: string;
  address: string;
  kladr_id: string;
  is_ours: boolean;
  is_active: boolean;
  sort_order: string;
};

export function emptySiteDirectoryForm(type: FactoryType = 'gok'): SiteDirectoryFormState {
  return {
    id: '',
    name: '',
    type,
    latitude: '55.16',
    longitude: '61.40',
    region: '',
    country: 'РФ',
    holding: '',
    description: '',
    code: '',
    address: '',
    kladr_id: '',
    is_ours: false,
    is_active: true,
    sort_order: '0',
  };
}

export function siteToForm(site: Factory): SiteDirectoryFormState {
  return {
    id: site.id,
    name: site.name,
    type: site.type,
    latitude: String(site.latitude),
    longitude: String(site.longitude),
    region: site.region,
    country: site.country,
    holding: site.holding || '',
    description: site.description || '',
    code: site.code || '',
    address: site.address || '',
    kladr_id: site.kladr_id || '',
    is_ours: site.is_ours,
    is_active: site.is_active !== false,
    sort_order: String(site.sort_order ?? 0),
  };
}

export function formToFactory(form: SiteDirectoryFormState, fallbackType: FactoryType): Factory {
  return {
    id: form.id || `site_${fallbackType}_${Date.now()}`,
    name: form.name.trim(),
    type: form.type,
    latitude: parseFloat(form.latitude) || 0,
    longitude: parseFloat(form.longitude) || 0,
    region: form.region.trim(),
    country: form.country.trim(),
    holding: form.holding.trim(),
    description: form.description.trim(),
    code: form.code.trim(),
    address: form.address.trim(),
    kladr_id: form.kladr_id.trim() || undefined,
    is_ours: form.is_ours,
    is_active: form.is_active,
    sort_order: parseInt(form.sort_order, 10) || 0,
  };
}
