export interface Permissions {
  registerSales: boolean; // can access "Registrar Vendas" at all
  registerSalesUnrestricted: boolean; // sees all channels/CNPJs, not just assigned ones
  approveSales: boolean;
  manageGoals: boolean;
  viewTeamStatus: boolean; // "Status Lançamento" team-wide view
  viewAudit: boolean;
  manageUsers: boolean;
  manageCadastros: boolean; // CNPJs & Marketplaces
  technicalSettings: boolean; // env vars / low-level system info
  manageProfiles: boolean; // create/edit/delete access profiles (admin only)
}

const NO_PERMISSIONS: Permissions = {
  registerSales: false,
  registerSalesUnrestricted: false,
  approveSales: false,
  manageGoals: false,
  viewTeamStatus: false,
  viewAudit: false,
  manageUsers: false,
  manageCadastros: false,
  technicalSettings: false,
  manageProfiles: false,
};

// Roles are now data (public.roles table), not a hardcoded matrix. The app
// fetches them once on load and pushes them here via setRolesCache, so the
// many call sites of getPermissions()/getRoleLabel() can stay synchronous.
interface RoleLike {
  id: string;
  label: string;
  permissions: Permissions;
}

let rolesCache: Record<string, RoleLike> = {};

export function setRolesCache(roles: RoleLike[]): void {
  rolesCache = Object.fromEntries(roles.map((r) => [r.id, r]));
}

export function getPermissions(role: string): Permissions {
  return rolesCache[role]?.permissions || NO_PERMISSIONS;
}

export function getRoleLabel(role: string): string {
  return rolesCache[role]?.label || role;
}
