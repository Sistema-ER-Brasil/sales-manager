import { UserRole } from '../types';

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
}

const MATRIX: Record<UserRole, Permissions> = {
  admin: {
    registerSales: true,
    registerSalesUnrestricted: true,
    approveSales: true,
    manageGoals: true,
    viewTeamStatus: true,
    viewAudit: true,
    manageUsers: true,
    manageCadastros: true,
    technicalSettings: true,
  },
  diretor: {
    registerSales: true,
    registerSalesUnrestricted: true,
    approveSales: true,
    manageGoals: true,
    viewTeamStatus: true,
    viewAudit: true,
    manageUsers: true,
    manageCadastros: true,
    technicalSettings: false,
  },
  gerente: {
    registerSales: true,
    registerSalesUnrestricted: true,
    approveSales: true,
    manageGoals: true,
    viewTeamStatus: true,
    viewAudit: false,
    manageUsers: false,
    manageCadastros: false,
    technicalSettings: false,
  },
  analista: {
    registerSales: false,
    registerSalesUnrestricted: false,
    approveSales: false,
    manageGoals: false,
    viewTeamStatus: true,
    viewAudit: true,
    manageUsers: false,
    manageCadastros: false,
    technicalSettings: false,
  },
  user: {
    registerSales: true,
    registerSalesUnrestricted: false,
    approveSales: false,
    manageGoals: false,
    viewTeamStatus: false,
    viewAudit: false,
    manageUsers: false,
    manageCadastros: false,
    technicalSettings: false,
  },
};

export function getPermissions(role: UserRole): Permissions {
  return MATRIX[role] || MATRIX.user;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  diretor: 'Diretor',
  gerente: 'Gerente',
  analista: 'Analista',
  user: 'Usuário',
};
