export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedMarketplaces: string[]; // marketplace ids or slugs
  avatar?: string;
  status: 'active' | 'inactive';
}

export interface CompanyCNPJ {
  id: string;
  code: string; // e.g. ER2, MD, Orange, TTP, SOEHT
  name: string; // e.g. ER2 Distribuidora LTDA
  cnpj: string; // e.g. 12.345.678/0001-90
  status: 'active' | 'inactive';
  badgeColor: string;
}

export interface Marketplace {
  id: string;
  name: string; // e.g. Shopee, Mercado Livre, Amazon, Magalu, Site Próprio, Shein, TikTok, Americanas
  slug: string;
  color: string;
  iconName: string;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  sku: string;
  code: string;
  ean: string;
  name: string;
  category: string;
  brand: string;
  supplier: string;
  price: number;
  avgPrice: number;
  cost: number;
  marketplaceId?: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface SaleItem {
  id: string;
  date: string; // YYYY-MM-DD
  marketplaceId: string;
  companyId: string; // CNPJ code or ID
  productId?: string;
  productSku?: string;
  productName: string;
  quantity: number;
  totalValue: number;
  avgValue: number; // totalValue / quantity
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string; // ISO string
}

export interface Goal {
  id: string;
  title: string;
  type: 'marketplace' | 'company' | 'user' | 'product' | 'cnpj_marketplace';
  targetId: string; // marketplaceId, companyId, etc.
  companyId?: string; // specific CNPJ (code or id)
  marketplaceId?: string; // specific Marketplace (id or slug)
  targetName: string;
  period: 'daily' | 'monthly';
  metricType?: 'revenue' | 'quantity'; // 'revenue' (R$) or 'quantity' (Volume de Pedidos/Unidades)
  targetValue: number; // Target R$ or Target Units
  targetQuantity?: number;
  date?: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
}

export interface NotificationItem {
  id: string;
  type: 'sale' | 'goal_reached' | 'record_daily' | 'record_monthly' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'IMPORT';
  entity: 'sales' | 'products' | 'users' | 'marketplaces' | 'companies' | 'goals';
  details: string;
  ip: string;
  timestamp: string;
}

export interface SystemSettings {
  theme: 'light' | 'dark';
  companyName: string;
  logoUrl?: string;
  autoRefreshSecs: number;
  soundEffectsEnabled: boolean;
}

export type PeriodFilter = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'this_year'
  | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
