import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  PeriodFilter,
  DateRange,
  Task,
} from '../types';
import {
  initialProducts,
  initialSales,
  initialGoals,
  initialSettings,
} from '../data/initialData';
import { getTodayString } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';
import {
  rowToUser,
  rowToCompany,
  companyToRow,
  rowToMarketplace,
  marketplaceToRow,
  rowToProduct,
  productToRow,
  rowToSale,
  saleToRow,
  rowToGoal,
  goalToRow,
  rowToNotification,
  notificationToRow,
  rowToAuditLog,
  auditLogToRow,
  rowToSettings,
  settingsToRow,
  rowToTask,
  taskToRow,
} from '../lib/db';

type ActionResult = { success: boolean; message?: string };

const GUEST_USER: User = {
  id: '',
  name: '',
  email: '',
  role: 'user',
  assignedMarketplaces: [],
  assignedCompanies: [],
  status: 'active',
};

interface AppContextType {
  currentUser: User;
  users: User[];
  companies: CompanyCNPJ[];
  marketplaces: Marketplace[];
  products: Product[];
  sales: SaleItem[];
  goals: Goal[];
  tasks: Task[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  isLoadingData: boolean;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Filters
  periodFilter: PeriodFilter;
  setPeriodFilter: (filter: PeriodFilter) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedMarketplaceFilter: string;
  setSelectedMarketplaceFilter: (id: string) => void;
  selectedCompanyFilter: string;
  setSelectedCompanyFilter: (id: string) => void;
  historyUserFilter: string;
  setHistoryUserFilter: (userId: string) => void;

  // Actions
  addSale: (sale: Omit<SaleItem, 'id' | 'createdAt' | 'createdByUserId' | 'createdByName' | 'status'>) => void;
  addSalesBatch: (items: Array<Omit<SaleItem, 'id' | 'createdAt' | 'createdByUserId' | 'createdByName' | 'status'>>) => void;
  updateSale: (sale: SaleItem) => void;
  deleteSale: (id: string) => void;
  submitSaleForApproval: (id: string) => void;
  approveSale: (id: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  addCompany: (company: Omit<CompanyCNPJ, 'id'>) => void;
  updateCompany: (company: CompanyCNPJ) => void;
  deleteCompany: (id: string) => void;

  addMarketplace: (marketplace: Omit<Marketplace, 'id'>) => void;
  updateMarketplace: (marketplace: Marketplace) => void;
  deleteMarketplace: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'createdByName' | 'status'>) => Promise<Task>;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  deleteTask: (id: string) => void;

  addUser: (user: Omit<User, 'id'> & { password: string }) => Promise<ActionResult>;
  updateUser: (user: User & { password?: string }) => Promise<ActionResult>;
  deleteUser: (id: string) => Promise<ActionResult>;

  updateSettings: (settings: Partial<SystemSettings>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  sendReminderNotification: (targetUserId: string, targetUserName: string) => void;

  importSalesData: (importedSales: Partial<SaleItem>[]) => void;
  playSaleSound: () => void;

  // Production data management
  clearSampleData: () => void;
  restoreSampleData: () => void;

  // Authentication & Session
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<ActionResult>;
  logout: () => void;
  getAccessToken: () => Promise<string>;

  // Last event trigger for live operational board / TV
  lastSaleTimestamp: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<CompanyCNPJ[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Filters
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getTodayString(),
    endDate: getTodayString(),
  });
  const [selectedMarketplaceFilter, setSelectedMarketplaceFilter] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [historyUserFilter, setHistoryUserFilter] = useState<string>('');

  const [lastSaleTimestamp, setLastSaleTimestamp] = useState<number>(Date.now());

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  const loadProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return rowToUser(data);
  };

  const loadAllData = async () => {
    setIsLoadingData(true);
    const [companiesRes, marketplacesRes, productsRes, salesRes, goalsRes, notifRes, auditRes, settingsRes, profilesRes, tasksRes] =
      await Promise.all([
        supabase.from('companies').select('*').order('code'),
        supabase.from('marketplaces').select('*').order('name'),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(2000),
        supabase.from('goals').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(300),
        supabase.from('settings').select('*').eq('id', true).single(),
        supabase.from('profiles').select('*').order('name'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      ]);

    if (companiesRes.data) setCompanies(companiesRes.data.map(rowToCompany));
    if (marketplacesRes.data) setMarketplaces(marketplacesRes.data.map(rowToMarketplace));
    if (productsRes.data) setProducts(productsRes.data.map(rowToProduct));
    if (salesRes.data) setSales(salesRes.data.map(rowToSale));
    if (goalsRes.data) setGoals(goalsRes.data.map(rowToGoal));
    if (notifRes.data) setNotifications(notifRes.data.map(rowToNotification));
    if (auditRes.data) setAuditLogs(auditRes.data.map(rowToAuditLog));
    if (settingsRes.data) setSettings(rowToSettings(settingsRes.data));
    if (profilesRes.data) setUsers(profilesRes.data.map(rowToUser));
    if (tasksRes.data) setTasks(tasksRes.data.map(rowToTask));

    setIsLoadingData(false);
  };

  // Bootstrap session + auth state changes
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session && active) {
        const profile = await loadProfile(session.user.id);
        if (profile && profile.status !== 'inactive') {
          setCurrentUser(profile);
          setIsAuthenticated(true);
        } else {
          await supabase.auth.signOut();
        }
      } else {
        setIsLoadingData(false);
      }
    };
    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setCurrentUser(GUEST_USER);
        setSales([]);
        setGoals([]);
        setNotifications([]);
        setAuditLogs([]);
        setProducts([]);
        setCompanies([]);
        setMarketplaces([]);
        setUsers([]);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await loadProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
          setIsAuthenticated(true);
        }
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load business data once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Realtime sync for sales / goals / notifications (multi-device live updates)
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = rowToSale(payload.new);
          setSales((prev) => (prev.some((s) => s.id === row.id) ? prev : [row, ...prev]));
          setLastSaleTimestamp(Date.now());
        } else if (payload.eventType === 'UPDATE') {
          const row = rowToSale(payload.new);
          setSales((prev) => prev.map((s) => (s.id === row.id ? row : s)));
        } else if (payload.eventType === 'DELETE') {
          setSales((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = rowToGoal(payload.new);
          setGoals((prev) => (prev.some((g) => g.id === row.id) ? prev : [...prev, row]));
        } else if (payload.eventType === 'UPDATE') {
          const row = rowToGoal(payload.new);
          setGoals((prev) => prev.map((g) => (g.id === row.id ? row : g)));
        } else if (payload.eventType === 'DELETE') {
          setGoals((prev) => prev.filter((g) => g.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = rowToNotification(payload.new);
          setNotifications((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = rowToNotification(payload.new);
          setNotifications((prev) => prev.map((n) => (n.id === row.id ? row : n)));
        } else if (payload.eventType === 'DELETE') {
          setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = rowToTask(payload.new);
          setTasks((prev) => (prev.some((t) => t.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = rowToTask(payload.new);
          setTasks((prev) => prev.map((t) => (t.id === row.id ? row : t)));
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // Theme is fixed to light mode (dark mode disabled)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Audio trigger
  const playSaleSound = () => {
    if (!settings.soundEffectsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio context policy fallback
    }
  };

  const addAuditLog = async (action: AuditLog['action'], entity: AuditLog['entity'], details: string) => {
    const user = currentUserRef.current;
    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      action,
      entity,
      details,
      ip: '',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    const { error } = await supabase.from('audit_logs').insert(auditLogToRow(newLog));
    if (error) console.warn('Falha ao gravar log de auditoria:', error.message);
  };

  const login = async (email: string, password?: string): Promise<ActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: password || '' });

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { success: false, message: 'E-mail ou senha incorretos.' };
      }
      return { success: false, message: error.message };
    }
    if (!data.user) {
      return { success: false, message: 'Erro ao efetuar login.' };
    }

    const profile = await loadProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, message: 'Perfil de usuário não encontrado.' };
    }
    if (profile.status === 'inactive') {
      await supabase.auth.signOut();
      return { success: false, message: 'Usuário inativo. Entre em contato com o Administrador.' };
    }

    setCurrentUser(profile);
    setIsAuthenticated(true);
    await addAuditLog('LOGIN', 'users', `Acesso autenticado para ${profile.name} (${profile.role})`);
    return { success: true };
  };

  const logout = () => {
    (async () => {
      await addAuditLog('LOGIN', 'users', `Sessão encerrada por ${currentUserRef.current.name} (Logout completo)`);
      await supabase.auth.signOut();
    })();
  };

  const addSale = (saleData: Omit<SaleItem, 'id' | 'createdAt' | 'createdByUserId' | 'createdByName' | 'status'>) => {
    const id = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSale: SaleItem = {
      ...saleData,
      id,
      createdByUserId: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };

    setSales((prev) => [newSale, ...prev]);
    setLastSaleTimestamp(Date.now());
    playSaleSound();

    addAuditLog(
      'CREATE',
      'sales',
      `Venda de ${saleData.quantity} un de "${saleData.productName}" no CNPJ ${saleData.companyId} (${saleData.marketplaceId}) - Total R$ ${saleData.totalValue.toFixed(2)}`
    );

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type: 'sale',
      title: ' Nova Venda Registrada',
      message: `${currentUser.name} registrou R$ ${saleData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no ${saleData.marketplaceId.toUpperCase()} (${saleData.companyId}).`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);

    (async () => {
      const { error } = await supabase.from('sales').insert(saleToRow(newSale));
      if (error) console.error('Erro ao salvar venda:', error.message);
      await supabase.from('notifications').insert(notificationToRow(newNotif));
    })();
  };

  const addSalesBatch = (items: Array<Omit<SaleItem, 'id' | 'createdAt' | 'createdByUserId' | 'createdByName' | 'status'>>) => {
    const now = new Date().toISOString();
    const newItems: SaleItem[] = items.map((saleData, idx) => ({
      ...saleData,
      id: `sale_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      createdByUserId: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      status: 'draft',
    }));

    setSales((prev) => [...newItems, ...prev]);
    setLastSaleTimestamp(Date.now());
    playSaleSound();

    const totalVal = items.reduce((acc, i) => acc + i.totalValue, 0);
    addAuditLog('CREATE', 'sales', `Lançamento em lote de ${items.length} registros de vendas. Total: R$ ${totalVal.toFixed(2)}`);

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type: 'sale',
      title: ' Lançamento em Lote',
      message: `${items.length} vendas gravadas no valor total de R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      read: false,
      createdAt: now,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    (async () => {
      const { error } = await supabase.from('sales').insert(newItems.map(saleToRow));
      if (error) console.error('Erro ao salvar lote de vendas:', error.message);
      await supabase.from('notifications').insert(notificationToRow(newNotif));
    })();
  };

  const updateSale = (updatedSale: SaleItem) => {
    setSales((prev) => prev.map((s) => (s.id === updatedSale.id ? updatedSale : s)));
    addAuditLog('UPDATE', 'sales', `Venda ${updatedSale.id} editada por ${currentUser.name}`);
    (async () => {
      const { error } = await supabase.from('sales').update(saleToRow(updatedSale)).eq('id', updatedSale.id);
      if (error) console.error('Erro ao atualizar venda:', error.message);
    })();
  };

  const deleteSale = (id: string) => {
    const target = sales.find((s) => s.id === id);
    setSales((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('DELETE', 'sales', `Venda ${id} (${target?.productName || ''}) removida por ${currentUser.name}`);
    (async () => {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) console.error('Erro ao excluir venda:', error.message);
    })();
  };

  const submitSaleForApproval = (id: string) => {
    const target = sales.find((s) => s.id === id);
    if (!target) return;
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'submitted' } : s)));
    addAuditLog('UPDATE', 'sales', `Venda ${id} (${target.productName}) enviada para aprovação por ${currentUser.name}`);

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type: 'sale',
      title: 'Venda Aguardando Aprovação',
      message: `${currentUser.name} enviou uma venda de R$ ${target.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${target.marketplaceId.toUpperCase()}) para aprovação.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);

    (async () => {
      const { error } = await supabase.from('sales').update({ status: 'submitted' }).eq('id', id);
      if (error) console.error('Erro ao enviar venda para aprovação:', error.message);
      await supabase.from('notifications').insert(notificationToRow(newNotif));
    })();
  };

  const approveSale = (id: string) => {
    const target = sales.find((s) => s.id === id);
    if (!target) return;
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)));
    addAuditLog('UPDATE', 'sales', `Venda ${id} (${target.productName}) aprovada por ${currentUser.name}`);
    (async () => {
      const { error } = await supabase.from('sales').update({ status: 'approved' }).eq('id', id);
      if (error) console.error('Erro ao aprovar venda:', error.message);
    })();
  };

  const addProduct = (p: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd: Product = {
      ...p,
      id: `prod_${Date.now()}`,
      createdAt: getTodayString(),
    };
    setProducts((prev) => [newProd, ...prev]);
    addAuditLog('CREATE', 'products', `Produto ${p.sku} - ${p.name} cadastrado`);
    (async () => {
      const { error } = await supabase.from('products').insert(productToRow(newProd));
      if (error) console.error('Erro ao salvar produto:', error.message);
    })();
  };

  const updateProduct = (p: Product) => {
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
    addAuditLog('UPDATE', 'products', `Produto ${p.sku} atualizado`);
    (async () => {
      const { error } = await supabase.from('products').update(productToRow(p)).eq('id', p.id);
      if (error) console.error('Erro ao atualizar produto:', error.message);
    })();
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addAuditLog('DELETE', 'products', `Produto ${target?.sku || id} excluído`);
    (async () => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.error('Erro ao excluir produto:', error.message);
    })();
  };

  const addCompany = (c: Omit<CompanyCNPJ, 'id'>) => {
    const id = c.code || `CMP_${Date.now()}`;
    const newComp: CompanyCNPJ = { ...c, id };
    setCompanies((prev) => [...prev, newComp]);
    addAuditLog('CREATE', 'companies', `CNPJ/Empresa ${c.code} (${c.name}) criada`);
    (async () => {
      const { error } = await supabase.from('companies').insert(companyToRow(newComp));
      if (error) console.error('Erro ao salvar empresa:', error.message);
    })();
  };

  const updateCompany = (c: CompanyCNPJ) => {
    setCompanies((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    addAuditLog('UPDATE', 'companies', `CNPJ ${c.code} atualizado`);
    (async () => {
      const { error } = await supabase.from('companies').update(companyToRow(c)).eq('id', c.id);
      if (error) console.error('Erro ao atualizar empresa:', error.message);
    })();
  };

  const deleteCompany = (id: string) => {
    setCompanies((prev) => prev.filter((item) => item.id !== id));
    addAuditLog('DELETE', 'companies', `CNPJ ${id} removido`);
    (async () => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) console.error('Erro ao excluir empresa:', error.message);
    })();
  };

  const addMarketplace = (m: Omit<Marketplace, 'id'>) => {
    const id = m.slug || `mkt_${Date.now()}`;
    const newMkt: Marketplace = { ...m, id };
    setMarketplaces((prev) => [...prev, newMkt]);
    addAuditLog('CREATE', 'marketplaces', `Marketplace ${m.name} criado`);
    (async () => {
      const { error } = await supabase.from('marketplaces').insert(marketplaceToRow(newMkt));
      if (error) console.error('Erro ao salvar marketplace:', error.message);
    })();
  };

  const updateMarketplace = (m: Marketplace) => {
    setMarketplaces((prev) => prev.map((item) => (item.id === m.id ? m : item)));
    addAuditLog('UPDATE', 'marketplaces', `Marketplace ${m.name} alterado`);
    (async () => {
      const { error } = await supabase.from('marketplaces').update(marketplaceToRow(m)).eq('id', m.id);
      if (error) console.error('Erro ao atualizar marketplace:', error.message);
    })();
  };

  const deleteMarketplace = (id: string) => {
    setMarketplaces((prev) => prev.filter((item) => item.id !== id));
    addAuditLog('DELETE', 'marketplaces', `Marketplace ${id} removido`);
    (async () => {
      const { error } = await supabase.from('marketplaces').delete().eq('id', id);
      if (error) console.error('Erro ao excluir marketplace:', error.message);
    })();
  };

  const addGoal = (g: Omit<Goal, 'id'>) => {
    const newG: Goal = { ...g, id: `goal_${Date.now()}` };
    setGoals((prev) => [...prev, newG]);
    const valText = g.metricType === 'quantity' ? `${g.targetValue} un` : `R$ ${g.targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    addAuditLog('CREATE', 'goals', `Criou a meta "${g.title}" [${g.period === 'daily' ? 'Diária' : 'Mensal'}] - Valor Alvo: ${valText}`);
    (async () => {
      const { error } = await supabase.from('goals').insert(goalToRow(newG));
      if (error) console.error('Erro ao salvar meta:', error.message);
    })();
  };

  const updateGoal = (g: Goal) => {
    setGoals((prev) => prev.map((item) => (item.id === g.id ? g : item)));
    const valText = g.metricType === 'quantity' ? `${g.targetValue} un` : `R$ ${g.targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    addAuditLog('UPDATE', 'goals', `Atualizou a meta "${g.title}" - Novo Valor Alvo: ${valText}`);
    (async () => {
      const { error } = await supabase.from('goals').update(goalToRow(g)).eq('id', g.id);
      if (error) console.error('Erro ao atualizar meta:', error.message);
    })();
  };

  const deleteGoal = (id: string) => {
    const target = goals.find((g) => g.id === id);
    setGoals((prev) => prev.filter((item) => item.id !== id));
    addAuditLog('DELETE', 'goals', `Excluiu a meta "${target?.title || id}" (${target?.targetName || ''})`);
    (async () => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) console.error('Erro ao excluir meta:', error.message);
    })();
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'createdByName' | 'status'>): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    addAuditLog('CREATE', 'tasks', `Tarefa "${taskData.title}" atribuída a ${taskData.assignedToName}`);

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type: 'system',
      title: 'Nova Tarefa Atribuída',
      message: `${currentUser.name} atribuiu a tarefa "${taskData.title}" para você.`,
      read: false,
      createdAt: new Date().toISOString(),
      targetUserId: taskData.assignedTo,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    const { error } = await supabase.from('tasks').insert(taskToRow(newTask));
    if (error) console.error('Erro ao criar tarefa:', error.message);
    await supabase.from('notifications').insert(notificationToRow(newNotif));

    return newTask;
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    addAuditLog('UPDATE', 'tasks', `Tarefa "${target?.title || id}" movida para status "${status}"`);
    (async () => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) console.error('Erro ao atualizar tarefa:', error.message);
    })();
  };

  const deleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    addAuditLog('DELETE', 'tasks', `Tarefa "${target?.title || id}" removida`);
    (async () => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) console.error('Erro ao excluir tarefa:', error.message);
    })();
  };

  const addUser = async (u: Omit<User, 'id'> & { password: string }): Promise<ActionResult> => {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: u.email,
          password: u.password,
          name: u.name,
          role: u.role,
          assignedMarketplaces: u.assignedMarketplaces,
          assignedCompanies: u.assignedCompanies,
        }),
      });
      const json = await res.json();
      if (!json.success) return { success: false, message: json.error || 'Erro ao criar usuário.' };

      const newUser: User = {
        id: json.id,
        name: u.name,
        email: u.email,
        role: u.role,
        assignedMarketplaces: u.assignedMarketplaces,
        assignedCompanies: u.assignedCompanies,
        status: 'active',
      };
      setUsers((prev) => [...prev, newUser]);
      await addAuditLog('CREATE', 'users', `Novo usuário ${u.name} (${u.email}) cadastrado com perfil ${u.role}`);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const updateUser = async (u: User & { password?: string }): Promise<ActionResult> => {
    try {
      const { password, ...profile } = u;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          role: profile.role,
          assigned_marketplaces: profile.assignedMarketplaces,
          assigned_companies: profile.assignedCompanies,
          avatar: profile.avatar || null,
          status: profile.status,
        })
        .eq('id', profile.id);
      if (profileError) return { success: false, message: profileError.message };

      if (password) {
        if (profile.id === currentUser.id) {
          const { error: pwError } = await supabase.auth.updateUser({ password });
          if (pwError) return { success: false, message: pwError.message };
        } else {
          const token = await getAccessToken();
          const res = await fetch(`/api/admin/users/${profile.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ password }),
          });
          const json = await res.json();
          if (!json.success) return { success: false, message: json.error || 'Erro ao redefinir senha.' };
        }
      }

      setUsers((prev) => prev.map((item) => (item.id === profile.id ? profile : item)));
      if (currentUser.id === profile.id) setCurrentUser(profile);
      await addAuditLog('UPDATE', 'users', `Usuário ${profile.name} atualizado`);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const deleteUser = async (id: string): Promise<ActionResult> => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) return { success: false, message: json.error || 'Erro ao excluir usuário.' };

      setUsers((prev) => prev.filter((item) => item.id !== id));
      await addAuditLog('DELETE', 'users', `Usuário ${id} removido`);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const updateSettings = (newSet: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSet }));
    (async () => {
      const { error } = await supabase.from('settings').update(settingsToRow(newSet)).eq('id', true);
      if (error) console.error('Erro ao atualizar configurações:', error.message);
    })();
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    (async () => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) console.error('Erro ao marcar notificação como lida:', error.message);
    })();
  };

  const clearAllNotifications = () => {
    const ids = notifications
      .filter((n) => !n.targetUserId || n.targetUserId === currentUser.id)
      .map((n) => n.id);
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    if (ids.length) {
      (async () => {
        const { error } = await supabase.from('notifications').delete().in('id', ids);
        if (error) console.error('Erro ao limpar notificações:', error.message);
      })();
    }
  };

  const sendReminderNotification = (targetUserId: string, targetUserName: string) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type: 'system',
      title: 'Lembrete de Lançamento de Vendas',
      message: `${currentUser.name} pediu que você lance suas vendas de hoje o quanto antes.`,
      read: false,
      createdAt: new Date().toISOString(),
      targetUserId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addAuditLog('CREATE', 'users', `Lembrete de lançamento enviado para ${targetUserName}`);
    (async () => {
      const { error } = await supabase.from('notifications').insert(notificationToRow(newNotif));
      if (error) console.error('Erro ao enviar lembrete:', error.message);
    })();
  };

  const importSalesData = (importedSales: Partial<SaleItem>[]) => {
    const formatted: SaleItem[] = importedSales.map((s, idx) => ({
      id: `imported_${Date.now()}_${idx}`,
      date: s.date || getTodayString(),
      marketplaceId: s.marketplaceId || 'shopee',
      companyId: s.companyId || 'ER2',
      productId: s.productId,
      productSku: s.productSku,
      productName: s.productName || 'Produto Importado',
      quantity: Number(s.quantity) || 1,
      totalValue: Number(s.totalValue) || 0,
      avgValue: Number(s.quantity) ? Number(s.totalValue) / Number(s.quantity) : Number(s.totalValue) || 0,
      notes: s.notes || 'Importado via planilha/ERP',
      createdByUserId: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'draft' as const,
    }));

    setSales((prev) => [...formatted, ...prev]);
    addAuditLog('IMPORT', 'sales', `Importação de ${formatted.length} registros efetuada com sucesso`);
    playSaleSound();

    (async () => {
      const { error } = await supabase.from('sales').insert(formatted.map(saleToRow));
      if (error) console.error('Erro ao importar vendas:', error.message);
    })();
  };

  const clearSampleData = () => {
    setSales([]);
    setGoals([]);
    addAuditLog('DELETE', 'sales', 'Base de dados zerada para modo de produção com dados reais');
    (async () => {
      await supabase.from('sales').delete().not('id', 'is', null);
      await supabase.from('goals').delete().not('id', 'is', null);
    })();
  };

  const restoreSampleData = () => {
    const seededSales = initialSales.map((s) => ({ ...s, createdByUserId: currentUser.id }));
    setSales(seededSales);
    setGoals(initialGoals);
    setProducts(initialProducts);
    addAuditLog('CREATE', 'sales', 'Dados de exemplo/demonstração restaurados no sistema');
    (async () => {
      await supabase.from('products').upsert(initialProducts.map(productToRow));
      await supabase.from('goals').upsert(initialGoals.map(goalToRow));
      await supabase.from('sales').upsert(seededSales.map(saleToRow));
    })();
  };

  // Only show notifications broadcast to everyone (no target) or targeted at this user
  const visibleNotifications = notifications.filter(
    (n) => !n.targetUserId || n.targetUserId === currentUser.id
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        companies,
        marketplaces,
        products,
        sales,
        goals,
        tasks,
        notifications: visibleNotifications,
        auditLogs,
        settings,
        isLoadingData,
        activeTab,
        setActiveTab,
        periodFilter,
        setPeriodFilter,
        dateRange,
        setDateRange,
        selectedMarketplaceFilter,
        setSelectedMarketplaceFilter,
        selectedCompanyFilter,
        setSelectedCompanyFilter,
        historyUserFilter,
        setHistoryUserFilter,
        addSale,
        addSalesBatch,
        updateSale,
        deleteSale,
        submitSaleForApproval,
        approveSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addCompany,
        updateCompany,
        deleteCompany,
        addMarketplace,
        updateMarketplace,
        deleteMarketplace,
        addGoal,
        updateGoal,
        deleteGoal,
        addTask,
        updateTaskStatus,
        deleteTask,
        addUser,
        updateUser,
        deleteUser,
        updateSettings,
        markNotificationRead,
        clearAllNotifications,
        sendReminderNotification,
        importSalesData,
        playSaleSound,
        clearSampleData,
        restoreSampleData,
        isAuthenticated,
        login,
        logout,
        getAccessToken,
        lastSaleTimestamp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
