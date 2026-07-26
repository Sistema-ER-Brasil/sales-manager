import {
  User,
  CompanyCNPJ,
  Marketplace,
  Product,
  SaleItem,
  Goal,
  NotificationItem,
  AuditLog,
  SystemSettings,
} from '../types';

// ---- Supabase row shapes (snake_case) <-> app types (camelCase) ----

// Company assignments are packed into the same `assigned_marketplaces` text[]
// column using a "cnpj:" prefix, avoiding a schema migration (no separate
// assigned_companies column exists in the DB). See packAssignments below.
const CNPJ_PREFIX = 'cnpj:';

export function rowToUser(row: any): User {
  const rawAssignments: string[] = row.assigned_marketplaces || [];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    assignedMarketplaces: rawAssignments.filter((a) => !a.startsWith(CNPJ_PREFIX)),
    assignedCompanies: rawAssignments
      .filter((a) => a.startsWith(CNPJ_PREFIX))
      .map((a) => a.slice(CNPJ_PREFIX.length)),
    avatar: row.avatar || undefined,
    status: row.status,
  };
}

export function packAssignments(assignedMarketplaces: string[], assignedCompanies: string[]): string[] {
  return [...assignedMarketplaces, ...assignedCompanies.map((c) => `${CNPJ_PREFIX}${c}`)];
}

export function rowToCompany(row: any): CompanyCNPJ {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    cnpj: row.cnpj,
    status: row.status,
    badgeColor: row.badge_color,
  };
}

export function companyToRow(c: Partial<CompanyCNPJ>) {
  const row: any = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.code !== undefined) row.code = c.code;
  if (c.name !== undefined) row.name = c.name;
  if (c.cnpj !== undefined) row.cnpj = c.cnpj;
  if (c.status !== undefined) row.status = c.status;
  if (c.badgeColor !== undefined) row.badge_color = c.badgeColor;
  return row;
}

export function rowToMarketplace(row: any): Marketplace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    iconName: row.icon_name,
    status: row.status,
  };
}

export function marketplaceToRow(m: Partial<Marketplace>) {
  const row: any = {};
  if (m.id !== undefined) row.id = m.id;
  if (m.name !== undefined) row.name = m.name;
  if (m.slug !== undefined) row.slug = m.slug;
  if (m.color !== undefined) row.color = m.color;
  if (m.iconName !== undefined) row.icon_name = m.iconName;
  if (m.status !== undefined) row.status = m.status;
  return row;
}

export function rowToProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    code: row.code || '',
    ean: row.ean || '',
    name: row.name,
    category: row.category || '',
    brand: row.brand || '',
    supplier: row.supplier || '',
    price: Number(row.price) || 0,
    avgPrice: Number(row.avg_price) || 0,
    cost: Number(row.cost) || 0,
    marketplaceId: row.marketplace_id || undefined,
    image: row.image || undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function productToRow(p: Partial<Product>) {
  const row: any = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.sku !== undefined) row.sku = p.sku;
  if (p.code !== undefined) row.code = p.code;
  if (p.ean !== undefined) row.ean = p.ean;
  if (p.name !== undefined) row.name = p.name;
  if (p.category !== undefined) row.category = p.category;
  if (p.brand !== undefined) row.brand = p.brand;
  if (p.supplier !== undefined) row.supplier = p.supplier;
  if (p.price !== undefined) row.price = p.price;
  if (p.avgPrice !== undefined) row.avg_price = p.avgPrice;
  if (p.cost !== undefined) row.cost = p.cost;
  if (p.marketplaceId !== undefined) row.marketplace_id = p.marketplaceId;
  if (p.image !== undefined) row.image = p.image;
  if (p.status !== undefined) row.status = p.status;
  if (p.createdAt !== undefined) row.created_at = p.createdAt;
  return row;
}

export function rowToSale(row: any): SaleItem {
  return {
    id: row.id,
    date: row.date,
    marketplaceId: row.marketplace_id,
    companyId: row.company_id,
    productId: row.product_id || undefined,
    productSku: row.product_sku || undefined,
    productName: row.product_name,
    quantity: Number(row.quantity),
    totalValue: Number(row.total_value),
    avgValue: Number(row.avg_value),
    notes: row.notes || undefined,
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

export function saleToRow(s: Partial<SaleItem>) {
  const row: any = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.date !== undefined) row.date = s.date;
  if (s.marketplaceId !== undefined) row.marketplace_id = s.marketplaceId;
  if (s.companyId !== undefined) row.company_id = s.companyId;
  if (s.productId !== undefined) row.product_id = s.productId;
  if (s.productSku !== undefined) row.product_sku = s.productSku;
  if (s.productName !== undefined) row.product_name = s.productName;
  if (s.quantity !== undefined) row.quantity = s.quantity;
  if (s.totalValue !== undefined) row.total_value = s.totalValue;
  if (s.avgValue !== undefined) row.avg_value = s.avgValue;
  if (s.notes !== undefined) row.notes = s.notes;
  if (s.createdByUserId !== undefined) row.created_by_user_id = s.createdByUserId;
  if (s.createdByName !== undefined) row.created_by_name = s.createdByName;
  if (s.createdAt !== undefined) row.created_at = s.createdAt;
  return row;
}

export function rowToGoal(row: any): Goal {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    targetId: row.target_id,
    companyId: row.company_id || undefined,
    marketplaceId: row.marketplace_id || undefined,
    targetName: row.target_name,
    period: row.period,
    metricType: row.metric_type || undefined,
    targetValue: Number(row.target_value) || 0,
    targetQuantity: row.target_quantity !== null ? Number(row.target_quantity) : undefined,
    date: row.date || undefined,
    month: row.month || undefined,
  };
}

export function goalToRow(g: Partial<Goal>) {
  const row: any = {};
  if (g.id !== undefined) row.id = g.id;
  if (g.title !== undefined) row.title = g.title;
  if (g.type !== undefined) row.type = g.type;
  if (g.targetId !== undefined) row.target_id = g.targetId;
  if (g.companyId !== undefined) row.company_id = g.companyId;
  if (g.marketplaceId !== undefined) row.marketplace_id = g.marketplaceId;
  if (g.targetName !== undefined) row.target_name = g.targetName;
  if (g.period !== undefined) row.period = g.period;
  if (g.metricType !== undefined) row.metric_type = g.metricType;
  if (g.targetValue !== undefined) row.target_value = g.targetValue;
  if (g.targetQuantity !== undefined) row.target_quantity = g.targetQuantity;
  if (g.date !== undefined) row.date = g.date;
  if (g.month !== undefined) row.month = g.month;
  return row;
}

export function rowToNotification(row: any): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}

export function notificationToRow(n: Partial<NotificationItem>) {
  const row: any = {};
  if (n.id !== undefined) row.id = n.id;
  if (n.type !== undefined) row.type = n.type;
  if (n.title !== undefined) row.title = n.title;
  if (n.message !== undefined) row.message = n.message;
  if (n.read !== undefined) row.read = n.read;
  if (n.createdAt !== undefined) row.created_at = n.createdAt;
  return row;
}

export function rowToAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    entity: row.entity,
    details: row.details,
    ip: row.ip || '',
    timestamp: row.timestamp,
  };
}

export function auditLogToRow(a: Partial<AuditLog>) {
  const row: any = {};
  if (a.id !== undefined) row.id = a.id;
  if (a.userId !== undefined) row.user_id = a.userId;
  if (a.userName !== undefined) row.user_name = a.userName;
  if (a.action !== undefined) row.action = a.action;
  if (a.entity !== undefined) row.entity = a.entity;
  if (a.details !== undefined) row.details = a.details;
  if (a.ip !== undefined) row.ip = a.ip;
  if (a.timestamp !== undefined) row.timestamp = a.timestamp;
  return row;
}

export function rowToSettings(row: any): SystemSettings {
  return {
    theme: row.theme,
    companyName: row.company_name,
    logoUrl: row.logo_url || undefined,
    autoRefreshSecs: row.auto_refresh_secs,
    soundEffectsEnabled: row.sound_effects_enabled,
  };
}

export function settingsToRow(s: Partial<SystemSettings>) {
  const row: any = {};
  if (s.theme !== undefined) row.theme = s.theme;
  if (s.companyName !== undefined) row.company_name = s.companyName;
  if (s.logoUrl !== undefined) row.logo_url = s.logoUrl;
  if (s.autoRefreshSecs !== undefined) row.auto_refresh_secs = s.autoRefreshSecs;
  if (s.soundEffectsEnabled !== undefined) row.sound_effects_enabled = s.soundEffectsEnabled;
  return row;
}
