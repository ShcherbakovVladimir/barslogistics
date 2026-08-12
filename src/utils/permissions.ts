import type { Factory, SupplyLink, User, UserRole } from '../types';

export const ROLE_LEVEL: Record<UserRole, number> = {
  local_employee: 1,
  site_manager: 2,
  manager: 3,
  key_person: 4,
  admin: 5,
};

/** Legacy role aliases from older deployments */
export function normalizeRole(role: string): UserRole {
  const map: Record<string, UserRole> = {
    viewer: 'local_employee',
    analyst: 'key_person',
    dispatcher: 'manager',
    local_employee: 'local_employee',
    site_manager: 'site_manager',
    manager: 'manager',
    key_person: 'key_person',
    admin: 'admin',
  };
  return map[role] ?? 'local_employee';
}

export function canSeeGlobalFinancials(role: UserRole): boolean {
  return role === 'admin' || role === 'key_person';
}

export function canSeeSiteFinancials(role: UserRole): boolean {
  return role === 'site_manager';
}

export function canUploadData(role: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'site_manager';
}

export function hasFullMapAccess(role: UserRole): boolean {
  return role === 'admin' || role === 'key_person' || role === 'manager';
}

export function canEditShipmentStatus(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canManageShipmentEvents(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

/** Mirror of server/shipmentEvents.canCreateShipmentEvent */
export function canCreateShipmentEvent(user: User, link: SupplyLink): boolean {
  if (user.role === 'admin' || user.role === 'manager') return true;
  if (user.role === 'site_manager') return isShipmentInUserScope(link, user);
  return false;
}

export function canCreateAnyShipmentEvent(user: User): boolean {
  if (user.role === 'admin' || user.role === 'manager') return true;
  if (user.role === 'site_manager') return getUserSiteIds(user).length > 0;
  return false;
}

export function canViewShipmentEvents(role: UserRole): boolean {
  return role === 'admin' || role === 'key_person' || role === 'manager' || role === 'site_manager';
}

export function canEditSiteDirectory(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canManageProducts(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canManageTransport(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canManageCarriers(role: UserRole): boolean {
  return role === 'admin';
}

export function canManageSalesManagers(role: UserRole): boolean {
  return role === 'admin';
}

export function canImportRzdAnalytics(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canAccessRzdAnalytics(role: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'key_person';
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function canAccessLogs(role: UserRole): boolean {
  return role === 'admin' || role === 'key_person' || role === 'manager';
}

export function canExport(role: UserRole): boolean {
  return role !== 'local_employee';
}

export function getUserSiteIds(user: User): string[] {
  if (user.assigned_site_ids?.length) return user.assigned_site_ids;
  if (user.site_id) return [user.site_id];
  return [];
}

export function isShipmentInUserScope(
  link: SupplyLink,
  user: User,
): boolean {
  if (hasFullMapAccess(user.role)) return true;
  const siteIds = new Set(getUserSiteIds(user));
  if (siteIds.size === 0) return false;
  return siteIds.has(link.origin_id) || siteIds.has(link.destination_id) || (link.site_id != null && siteIds.has(link.site_id));
}

export function isFactoryInUserScope(factory: Factory, user: User, linkedFactoryIds?: Set<string>): boolean {
  if (hasFullMapAccess(user.role)) return true;
  const siteIds = new Set(getUserSiteIds(user));
  if (siteIds.has(factory.id)) return true;
  if (linkedFactoryIds?.has(factory.id)) return true;
  return false;
}

export function canSeeDealAmount(user: User, link: SupplyLink): boolean {
  if (canSeeGlobalFinancials(user.role)) return true;
  if (user.role === 'site_manager' && isShipmentInUserScope(link, user)) return true;
  if (user.role === 'manager' && link.created_by === user.id) return true;
  return false;
}

export function maskSupplyLinkFinancials(link: SupplyLink, user: User): SupplyLink {
  if (canSeeDealAmount(user, link)) return link;
  const { amount: _a, ...rest } = link;
  return { ...rest, amount: undefined };
}
