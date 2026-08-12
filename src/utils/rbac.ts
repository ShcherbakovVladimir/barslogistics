import { UserRole } from '../types';
import {
  canAccessAdmin,
  canAccessLogs,
  canEditSiteDirectory,
  canExport,
  canManageProducts,
  canManageTransport,
  canManageCarriers,
  canManageSalesManagers,
  canUploadData,
  canAccessRzdAnalytics,
} from './permissions';

export function canAccessTab(tab: string, role: UserRole): boolean {
  if (['map', 'dashboard', 'shipments', 'factories', 'sites', 'carriers', 'managers', 'account'].includes(tab)) return true;
  if (tab === 'products') return canManageProducts(role);
  if (tab === 'transport') return canManageTransport(role);
  if (tab === 'mydata') return canUploadData(role);
  if (tab === 'logs') return canAccessLogs(role);
  if (tab === 'rzd-analytics') return canAccessRzdAnalytics(role);
  if (tab === 'admin') return canAccessAdmin(role);
  return false;
}

export { canExport, canEditSiteDirectory, canManageProducts, canManageTransport, canManageCarriers, canManageSalesManagers };
