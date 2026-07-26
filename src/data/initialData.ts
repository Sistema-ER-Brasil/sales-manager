import { CompanyCNPJ, Marketplace, User, Product, SaleItem, Goal, NotificationItem, AuditLog, SystemSettings } from '../types';

export const initialCompanies: CompanyCNPJ[] = [
  { id: 'ER2', code: 'ER2', name: 'ER2 Distribuidora E-commerce LTDA', cnpj: '12.345.678/0001-90', status: 'active', badgeColor: 'bg-blue-600 text-white' },
  { id: 'MD', code: 'MD', name: 'MD Comércio Eletrônico EIRELI', cnpj: '23.456.789/0001-01', status: 'active', badgeColor: 'bg-blue-600 text-white' },
  { id: 'Orange', code: 'Orange', name: 'Orange Digital Store LTDA', cnpj: '34.567.890/0001-12', status: 'active', badgeColor: 'bg-blue-900 text-white' },
  { id: 'TTP', code: 'TTP', name: 'TTP Vendas Online LTDA', cnpj: '45.678.901/0001-23', status: 'active', badgeColor: 'bg-blue-600 text-white' },
  { id: 'SOEHT', code: 'SOEHT', name: 'SOEHT Import & Export E-commerce', cnpj: '56.789.012/0001-34', status: 'active', badgeColor: 'bg-blue-600 text-white' },
];

export const initialMarketplaces: Marketplace[] = [
  { id: 'shopee', name: 'Shopee', slug: 'shopee', color: '#EE4D2D', iconName: 'ShoppingBag', status: 'active' },
  { id: 'mercadolivre', name: 'Mercado Livre', slug: 'mercadolivre', color: '#FFE600', iconName: 'ShoppingCart', status: 'active' },
  { id: 'amazon', name: 'Amazon', slug: 'amazon', color: '#FF9900', iconName: 'Box', status: 'active' },
  { id: 'magalu', name: 'Magalu', slug: 'magalu', color: '#0086FF', iconName: 'Store', status: 'active' },
  { id: 'site', name: 'Site Próprio', slug: 'site', color: '#10B981', iconName: 'Globe', status: 'active' },
  { id: 'shein', name: 'Shein', slug: 'shein', color: '#000000', iconName: 'Tag', status: 'active' },
  { id: 'tiktok', name: 'TikTok Shop', slug: 'tiktok', color: '#FE2C55', iconName: 'Video', status: 'active' },
  { id: 'americanas', name: 'Americanas', slug: 'americanas', color: '#E60014', iconName: 'Building', status: 'active' },
  { id: 'magazineluiza', name: 'Magazine Luiza', slug: 'magazineluiza', color: '#00A1FF', iconName: 'Store', status: 'active' },
  { id: 'casasbahia', name: 'Casas Bahia', slug: 'casasbahia', color: '#002A5C', iconName: 'Home', status: 'active' },
  { id: 'madeiramadeira', name: 'Madeira Madeira', slug: 'madeiramadeira', color: '#FF6200', iconName: 'Layers', status: 'active' },
];

// Seed reference only — real users are created via Supabase Auth (see UsersView / api/admin/users).
export const initialUsers: User[] = [
  {
    id: 'usr_admin',
    name: 'Administrador Geral',
    email: 'ecommerce@erdobrasil.com.br',
    role: 'admin',
    assignedMarketplaces: ['shopee', 'mercadolivre', 'amazon', 'magalu', 'site', 'shein', 'tiktok', 'americanas', 'casasbahia', 'madeiramadeira'],
    assignedCompanies: ['ER2', 'MD', 'Orange', 'TTP', 'SOEHT'],
    status: 'active',
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prod_1',
    sku: 'FONE-TWS-PRO',
    code: 'COD-101',
    ean: '7891234567890',
    name: 'Fone de Ouvido Bluetooth TWS Noise Cancelling',
    category: 'Eletrônicos',
    brand: 'TechSound',
    supplier: 'Distribuidora Global',
    price: 149.90,
    avgPrice: 139.90,
    cost: 55.00,
    status: 'active',
    createdAt: '2026-01-10',
  },
  {
    id: 'prod_2',
    sku: 'SMART-WATCH-ULTRA',
    code: 'COD-102',
    ean: '7891234567891',
    name: 'Smartwatch Sport Fit AMOLED GPS Impermeável',
    category: 'Relógios & Acessórios',
    brand: 'PulseTech',
    supplier: 'Importadora Express',
    price: 289.00,
    avgPrice: 269.90,
    cost: 110.00,
    status: 'active',
    createdAt: '2026-01-15',
  },
  {
    id: 'prod_3',
    sku: 'KIT-ORG-COZINHA',
    code: 'COD-103',
    ean: '7891234567892',
    name: 'Kit Organizador de Cozinha Hermético 6 Peças',
    category: 'Utilidades Domésticas',
    brand: 'HomeFlex',
    supplier: 'Plásticos Brasil',
    price: 89.90,
    avgPrice: 84.90,
    cost: 28.00,
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 'prod_4',
    sku: 'CABO-USBC-TURBO',
    code: 'COD-104',
    ean: '7891234567893',
    name: 'Cabo USB-C Turbo 65W Trançado de Nylon 2m',
    category: 'Acessórios Celular',
    brand: 'PowerCharge',
    supplier: 'Distribuidora Global',
    price: 39.90,
    avgPrice: 34.90,
    cost: 9.50,
    status: 'active',
    createdAt: '2026-02-10',
  },
  {
    id: 'prod_5',
    sku: 'LUM-LED-SENS-MOV',
    code: 'COD-105',
    ean: '7891234567894',
    name: 'Luminária LED Recarregável com Sensor de Presença',
    category: 'Iluminação & Decoração',
    brand: 'Lumina',
    supplier: 'Importadora Express',
    price: 49.90,
    avgPrice: 45.00,
    cost: 14.20,
    status: 'active',
    createdAt: '2026-03-05',
  },
  {
    id: 'prod_6',
    sku: 'MOCHILA-EXEC-IMPERM',
    code: 'COD-106',
    ean: '7891234567895',
    name: 'Mochila Executiva Impermeável com Entradas USB',
    category: 'Bolsas & Malas',
    brand: 'UrbanGear',
    supplier: 'Textil Import',
    price: 179.90,
    avgPrice: 169.00,
    cost: 62.00,
    status: 'active',
    createdAt: '2026-03-12',
  },
  {
    id: 'prod_7',
    sku: 'SUPORTE-NOTE-ALUM',
    code: 'COD-107',
    ean: '7891234567896',
    name: 'Suporte Ergonômico de Alumínio Dobrável para Notebook',
    category: 'Informática',
    brand: 'ErgoTech',
    supplier: 'Metalúrgica Brasil',
    price: 79.90,
    avgPrice: 74.90,
    cost: 22.00,
    status: 'active',
    createdAt: '2026-04-01',
  },
  {
    id: 'prod_8',
    sku: 'MAQ-CORTE-CABELO',
    code: 'COD-108',
    ean: '7891234567897',
    name: 'Máquina de Cortar Cabelo e Barba Sem Fio Vintage',
    category: 'Beleza & Cuidados',
    brand: 'BarberPro',
    supplier: 'Importadora Express',
    price: 69.90,
    avgPrice: 65.00,
    cost: 19.50,
    status: 'active',
    createdAt: '2026-04-20',
  }
];

export const initialGoals: Goal[] = [
  { id: 'goal_1', title: 'Meta Diária Shopee', type: 'marketplace', targetId: 'shopee', targetName: 'Shopee', period: 'daily', targetValue: 3500.00, targetQuantity: 80 },
  { id: 'goal_2', title: 'Meta Diária Mercado Livre', type: 'marketplace', targetId: 'mercadolivre', targetName: 'Mercado Livre', period: 'daily', targetValue: 4500.00, targetQuantity: 60 },
  { id: 'goal_3', title: 'Meta Diária Amazon', type: 'marketplace', targetId: 'amazon', targetName: 'Amazon', period: 'daily', targetValue: 2500.00, targetQuantity: 30 },
  { id: 'goal_4', title: 'Meta Geral do Grupo ER2', type: 'company', targetId: 'ER2', targetName: 'CNPJ ER2', period: 'daily', targetValue: 5000.00, targetQuantity: 70 },
  { id: 'goal_5', title: 'Meta Diária Total Expedição', type: 'company', targetId: 'ALL', targetName: 'Total do Dia (Todos CNPJs)', period: 'daily', targetValue: 12000.00, targetQuantity: 250 },
];

// Helper to generate seed sales
function generateInitialSales(): SaleItem[] {
  const today = '2026-07-22';
  const yesterday = '2026-07-21';
  const day3 = '2026-07-20';
  const day4 = '2026-07-19';
  const day5 = '2026-07-18';
  const day6 = '2026-07-17';
  const day7 = '2026-07-16';

  const companies = ['ER2', 'MD', 'Orange', 'TTP', 'SOEHT'];
  const mktList = [
    { id: 'shopee', name: 'Shopee' },
    { id: 'mercadolivre', name: 'Mercado Livre' },
    { id: 'amazon', name: 'Amazon' },
    { id: 'magalu', name: 'Magalu' },
    { id: 'site', name: 'Site Próprio' },
    { id: 'shein', name: 'Shein' },
    { id: 'tiktok', name: 'TikTok Shop' },
    { id: 'americanas', name: 'Americanas' },
  ];

  const sales: SaleItem[] = [];
  let count = 1;

  // Generate sales for today (22/07/2026)
  const todayEntries = [
    { mkt: 'shopee', cmp: 'ER2', prod: 'Fone de Ouvido Bluetooth TWS', qty: 15, val: 2098.50, user: 'João Silva' },
    { mkt: 'shopee', cmp: 'MD', prod: 'Cabo USB-C Turbo 65W', qty: 32, val: 1116.80, user: 'João Silva' },
    { mkt: 'shopee', cmp: 'Orange', prod: 'Kit Organizador de Cozinha', qty: 18, val: 1528.20, user: 'João Silva' },
    { mkt: 'shopee', cmp: 'TTP', prod: 'Luminária LED Recarregável', qty: 12, val: 540.00, user: 'João Silva' },
    { mkt: 'shopee', cmp: 'SOEHT', prod: 'Suporte Ergonômico Alumínio', qty: 8, val: 599.20, user: 'João Silva' },

    { mkt: 'mercadolivre', cmp: 'ER2', prod: 'Smartwatch Sport Fit AMOLED', qty: 12, val: 3238.80, user: 'Pedro Santos' },
    { mkt: 'mercadolivre', cmp: 'MD', prod: 'Mochila Executiva Impermeável', qty: 9, val: 1521.00, user: 'Pedro Santos' },
    { mkt: 'mercadolivre', cmp: 'Orange', prod: 'Fone de Ouvido Bluetooth TWS', qty: 14, val: 1958.60, user: 'Pedro Santos' },
    { mkt: 'mercadolivre', cmp: 'TTP', prod: 'Máquina de Cortar Cabelo', qty: 11, val: 715.00, user: 'Pedro Santos' },
    { mkt: 'mercadolivre', cmp: 'SOEHT', prod: 'Kit Organizador Cozinha', qty: 16, val: 1358.40, user: 'Pedro Santos' },

    { mkt: 'amazon', cmp: 'ER2', prod: 'Smartwatch Sport Fit AMOLED', qty: 6, val: 1619.40, user: 'João Silva' },
    { mkt: 'amazon', cmp: 'MD', prod: 'Suporte Ergonômico Alumínio', qty: 10, val: 749.00, user: 'João Silva' },
    { mkt: 'amazon', cmp: 'Orange', prod: 'Mochila Executiva Impermeável', qty: 5, val: 845.00, user: 'João Silva' },
    { mkt: 'amazon', cmp: 'TTP', prod: 'Fone de Ouvido Bluetooth TWS', qty: 7, val: 979.30, user: 'João Silva' },

    { mkt: 'magalu', cmp: 'ER2', prod: 'Kit Organizador Cozinha', qty: 9, val: 764.10, user: 'Pedro Santos' },
    { mkt: 'magalu', cmp: 'MD', prod: 'Luminária LED Recarregável', qty: 14, val: 630.00, user: 'Pedro Santos' },
    { mkt: 'magalu', cmp: 'TTP', prod: 'Cabo USB-C Turbo 65W', qty: 22, val: 767.80, user: 'Pedro Santos' },

    { mkt: 'shein', cmp: 'ER2', prod: 'Mochila Executiva Impermeável', qty: 8, val: 1352.00, user: 'Maria Oliveira' },
    { mkt: 'shein', cmp: 'SOEHT', prod: 'Luminária LED Recarregável', qty: 19, val: 855.00, user: 'Maria Oliveira' },

    { mkt: 'site', cmp: 'ER2', prod: 'Smartwatch Sport Fit AMOLED', qty: 4, val: 1079.60, user: 'Maria Oliveira' },
    { mkt: 'site', cmp: 'MD', prod: 'Fone de Ouvido Bluetooth TWS', qty: 6, val: 839.40, user: 'Maria Oliveira' },

    { mkt: 'tiktok', cmp: 'Orange', prod: 'Máquina de Cortar Cabelo', qty: 15, val: 975.00, user: 'Maria Oliveira' },
    { mkt: 'tiktok', cmp: 'SOEHT', prod: 'Cabo USB-C Turbo 65W', qty: 28, val: 977.20, user: 'Maria Oliveira' },
  ];

  todayEntries.forEach((e) => {
    sales.push({
      id: `sale_${count++}`,
      date: today,
      marketplaceId: e.mkt,
      companyId: e.cmp,
      productName: e.prod,
      quantity: e.qty,
      totalValue: e.val,
      avgValue: Number((e.val / e.qty).toFixed(2)),
      notes: 'Lançamento do dia',
      createdByUserId: 'usr_admin',
      createdByName: e.user,
      createdAt: `${today}T${String(8 + (count % 10)).padStart(2, '0')}:30:00.000Z`,
      status: 'approved',
    });
  });

  // Historical dates (20/07/2026 - prompt example: 223 pedidos, R$ 9.628,68)
  const historicalDates = [yesterday, day3, day4, day5, day6, day7];
  historicalDates.forEach((dateStr, dIdx) => {
    companies.forEach((cmp) => {
      mktList.slice(0, 5).forEach((mkt) => {
        const qty = Math.floor(5 + Math.random() * 20);
        const unitVal = 35 + Math.random() * 120;
        const total = Math.round(qty * unitVal * 100) / 100;
        sales.push({
          id: `sale_${count++}`,
          date: dateStr,
          marketplaceId: mkt.id,
          companyId: cmp,
          productName: `Produto Multimarcas Lote ${dIdx + 1}`,
          quantity: qty,
          totalValue: total,
          avgValue: Number((total / qty).toFixed(2)),
          notes: 'Histórico de vendas sync',
          createdByUserId: 'usr_admin',
          createdByName: 'Administrador Geral',
          createdAt: `${dateStr}T14:20:00.000Z`,
          status: 'approved',
        });
      });
    });
  });

  return sales;
}

export const initialSales: SaleItem[] = generateInitialSales();

export const initialNotifications: NotificationItem[] = [
  { id: 'notif_1', type: 'record_daily', title: ' Recorde do Dia!', message: 'Marketplace Shopee atingiu R$ 6.882,70 em vendas hoje!', read: false, createdAt: '2026-07-22T09:15:00.000Z' },
  { id: 'notif_2', type: 'goal_reached', title: ' Meta Atingida!', message: 'A meta diária do CNPJ ER2 foi superada com sucesso!', read: false, createdAt: '2026-07-22T08:45:00.000Z' },
  { id: 'notif_3', type: 'sale', title: ' Nova Venda em Lote', message: 'Pedro Santos lançou 12 unidades de Smartwatch no Mercado Livre.', read: true, createdAt: '2026-07-22T08:00:00.000Z' },
];

export const initialAuditLogs: AuditLog[] = [
  { id: 'audit_1', userId: 'usr_admin', userName: 'Administrador Geral', action: 'LOGIN', entity: 'users', details: 'Sessão iniciada no sistema com perfil Administrador', ip: '189.120.45.12', timestamp: '2026-07-22T08:00:00.000Z' },
  { id: 'audit_2', userId: 'usr_joao', userName: 'João Silva', action: 'CREATE', entity: 'sales', details: 'Lançamento de 15 un Fone TWS na Shopee (ER2) - Total: R$ 2.098,50', ip: '189.120.45.15', timestamp: '2026-07-22T08:30:00.000Z' },
  { id: 'audit_3', userId: 'usr_pedro', userName: 'Pedro Santos', action: 'CREATE', entity: 'sales', details: 'Lançamento de 12 un Smartwatch no Mercado Livre (ER2) - Total: R$ 3.238,80', ip: '189.120.45.18', timestamp: '2026-07-22T08:45:00.000Z' },
  { id: 'audit_4', userId: 'usr_admin', userName: 'Administrador Geral', action: 'CREATE', entity: 'goals', details: 'Criou a meta "Meta Diária Shopee (ER2)" [Diária] - Valor Alvo: R$ 5.000,00', ip: '189.120.45.12', timestamp: '2026-07-22T08:50:00.000Z' },
  { id: 'audit_5', userId: 'usr_admin', userName: 'Administrador Geral', action: 'UPDATE', entity: 'goals', details: 'Atualizou a meta "Meta Diária Mercado Livre (MD)" - Novo Valor Alvo: 80 un', ip: '189.120.45.12', timestamp: '2026-07-22T09:10:00.000Z' },
];

export const initialSettings: SystemSettings = {
  theme: 'light',
  companyName: 'ER2 E-commerce Group',
  logoUrl: '',
  autoRefreshSecs: 15,
  soundEffectsEnabled: true,
};
