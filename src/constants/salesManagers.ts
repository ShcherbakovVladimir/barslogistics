import type { SalesManager } from '../types';

export function activeSalesManagers(managers: SalesManager[]): SalesManager[] {
  return managers.filter(m => m.is_active !== false);
}

export function salesManagerLabel(manager: SalesManager): string {
  return manager.full_name || [manager.last_name, manager.first_name, manager.middle_name].filter(Boolean).join(' ');
}
