import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, getTodayString, formatDateBR } from '../utils/formatters';
import { Goal } from '../types';
import {
  Target,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  DollarSign,
  Package,
  Building2,
  ShoppingBag,
  Calendar,
  Layers,
  Sparkles,
  Filter,
  Check,
  TrendingUp,
  BellRing,
  AlertTriangle,
  Flame,
  Award,
  Bell,
  History,
  Edit3,
  Search,
  UserCheck,
  ShieldCheck,
  Clock,
  Laptop
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, sales, marketplaces, companies, addGoal, updateGoal, deleteGoal, auditLogs, currentUser, setActiveTab } = useApp();
  const isAdmin = currentUser.role === 'admin';

  const todayStr = getTodayString();

  // Form states for Admin Goal creation
  const [selectedCompany, setSelectedCompany] = useState<string>('ER2');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('shopee');
  const [metricType, setMetricType] = useState<'revenue' | 'quantity'>('revenue');
  const [targetValueInput, setTargetValueInput] = useState<string>('5000');
  const [targetDateInput, setTargetDateInput] = useState<string>(todayStr);
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  // Modal alert state
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Create Goal modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Audit log view/filter state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // Editing Goal state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetValue, setEditTargetValue] = useState('');

  // Filter state for displaying goals list
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'quantity' | 'cnpj_mkt' | 'near_completion'>('all');

  // Filter audit logs specifically for goals entity
  const goalAuditLogs = auditLogs
    .filter((log) => log.entity === 'goals')
    .filter((log) => {
      if (!searchLogQuery.trim()) return true;
      const q = searchLogQuery.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    });

  // Compute stats and high-progress goals
  const goalsWithStats = goals.map((g) => {
    const isQuantityMetric = g.metricType === 'quantity';

    // Filter matching sales
    const matchingSales = sales.filter((s) => {
      // Period / Date filter
      if (g.period === 'daily') {
        if (g.date && s.date !== g.date) return false;
        if (!g.date && s.date !== todayStr) return false;
      } else if (g.period === 'monthly') {
        const targetMonth = g.month || todayStr.substring(0, 7);
        if (!s.date.startsWith(targetMonth)) return false;
      }

      // Company match
      if (g.companyId && g.companyId !== 'ALL') {
        if (s.companyId !== g.companyId) return false;
      } else if (g.type === 'company' && g.targetId !== 'ALL') {
        if (s.companyId !== g.targetId) return false;
      }

      // Marketplace match
      if (g.marketplaceId && g.marketplaceId !== 'ALL') {
        if (s.marketplaceId !== g.marketplaceId) return false;
      } else if (g.type === 'marketplace' && g.targetId !== 'ALL') {
        if (s.marketplaceId !== g.targetId && s.marketplaceId !== g.targetName) return false;
      }

      return true;
    });

    const achievedValue = isQuantityMetric
      ? matchingSales.reduce((acc, s) => acc + s.quantity, 0)
      : matchingSales.reduce((acc, s) => acc + s.totalValue, 0);

    const percent = Math.min(100, Math.round((achievedValue / g.targetValue) * 100));
    const rawPercent = (achievedValue / g.targetValue) * 100;
    const missing = Math.max(0, g.targetValue - achievedValue);

    return {
      goal: g,
      achievedValue,
      percent,
      rawPercent,
      missing,
      isQuantityMetric,
      isNearCompletion: percent >= 90 && percent < 100,
      isCompleted: percent >= 100,
    };
  });

  const nearCompletionGoals = goalsWithStats.filter((gs) => gs.isNearCompletion);
  const completedGoals = goalsWithStats.filter((gs) => gs.isCompleted);
  const totalAlertGoalsCount = nearCompletionGoals.length + completedGoals.length;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const val = parseFloat(targetValueInput) || 0;
    if (val <= 0) return;

    const compObj = companies.find((c) => c.code === selectedCompany || c.id === selectedCompany);
    const mktObj = marketplaces.find((m) => m.id === selectedMarketplace || m.slug === selectedMarketplace);

    const compLabel = selectedCompany === 'ALL' ? 'Todos CNPJs' : compObj?.code || selectedCompany;
    const mktLabel = selectedMarketplace === 'ALL' ? 'Todas Plataformas' : mktObj?.name || selectedMarketplace;

    const autoTitle = customTitle.trim()
      ? customTitle.trim()
      : `Meta ${period === 'daily' ? 'Diária' : 'Mensal'} ${mktLabel} (${compLabel}) - ${metricType === 'revenue' ? 'Faturamento' : 'Volume de Pedidos'}`;

    const newGoal: Omit<Goal, 'id'> = {
      title: autoTitle,
      type: 'cnpj_marketplace',
      targetId: selectedMarketplace,
      companyId: selectedCompany,
      marketplaceId: selectedMarketplace,
      targetName: `${mktLabel} • CNPJ ${compLabel}`,
      period,
      metricType,
      targetValue: val,
      date: period === 'daily' ? targetDateInput : undefined,
      month: period === 'monthly' ? targetDateInput.substring(0, 7) : undefined,
    };

    addGoal(newGoal);

    // Reset, notify and close modal
    setShowSuccessMsg(true);
    setTimeout(() => setShowSuccessMsg(false), 3000);
    setCustomTitle('');
    setShowCreateModal(false);
  };

  const startEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setEditTitle(g.title);
    setEditTargetValue(g.targetValue.toString());
  };

  const handleSaveGoalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !isAdmin) return;

    const val = parseFloat(editTargetValue) || 0;
    if (val <= 0) return;

    const updated: Goal = {
      ...editingGoal,
      title: editTitle.trim() || editingGoal.title,
      targetValue: val,
    };

    updateGoal(updated);
    setEditingGoal(null);
  };

  // Filtered goals display
  const filteredGoalsWithStats = goalsWithStats.filter((gs) => {
    const { goal: g } = gs;
    if (filterType === 'revenue') return g.metricType !== 'quantity';
    if (filterType === 'quantity') return g.metricType === 'quantity';
    if (filterType === 'cnpj_mkt') return g.companyId || g.marketplaceId || g.type === 'cnpj_marketplace';
    if (filterType === 'near_completion') return gs.isNearCompletion || gs.isCompleted;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Gestão & Definição de Metas
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                {goals.length} Metas Cadastradas
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhamento e cadastro de metas financeiras (R$) e volume de pedidos (Unidades) por CNPJ e Marketplace.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Goal Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Meta</span>
            </button>
          )}

          {/* Audit Log Button */}
          <button
            onClick={() => setActiveTab('audit')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>Auditoria & Logs ({auditLogs.filter((l) => l.entity === 'goals').length}) ➔</span>
          </button>

          {/* Active Alerts Button */}
          {totalAlertGoalsCount > 0 && (
            <button
              onClick={() => setShowAlertModal(true)}
              className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-extrabold text-xs rounded-xl shadow-xs shadow-blue-800/20 flex items-center gap-2 transition-all cursor-pointer animate-pulse"
            >
              <BellRing className="w-4 h-4 text-blue-100" />
              <span>{totalAlertGoalsCount} Alertas de Progresso (≥90%)</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl self-start md:self-auto">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Data Atual: <strong>{formatDateBR(todayStr)}</strong></span>
          </div>
        </div>
      </div>

      {/* ALERT BANNER SYSTEM (PROXIMO DE ATINGIR >=90%) */}
      {totalAlertGoalsCount > 0 && (
        <div className="bg-gradient-to-r from-blue-800/10 via-blue-800/10 to-blue-800/5 dark:from-blue-950/40 dark:via-blue-950/30 dark:to-blue-950/20 border border-blue-300 dark:border-blue-950/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2 bg-blue-800 text-white rounded-xl shadow-xs shrink-0">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                  Alerta de Atingimento de Metas
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-950 text-blue-950 dark:text-blue-100">
                  {nearCompletionGoals.length} Quase Lá (≥90%) • {completedGoals.length} Batidas (100%)
                </span>
              </div>
              <p className="text-xs text-blue-950 dark:text-blue-300/90 mt-0.5">
                Você tem metas com alto índice de conclusão que exigem atenção dos administradores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => {
                setFilterType('near_completion');
              }}
              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-900 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all cursor-pointer"
            >
              Filtrar no Grid
            </button>
            <button
              onClick={() => setShowAlertModal(true)}
              className="px-3 py-1.5 text-xs font-extrabold bg-blue-900 hover:bg-blue-900 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ver Detalhes</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE GOAL MODAL (APENAS PARA ADMINISTRADORES) */}
      {isAdmin && showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-5 shadow-2xl space-y-4 max-w-3xl w-full my-8">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Definir Nova Meta por CNPJ & Marketplace
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-950 dark:text-blue-300">
                Painel de Administrador
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CNPJ Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  CNPJ / Empresa
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-slate-100"
                >
                  <option value="ALL">🌐 Todos os CNPJs (Consolidado)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.code}>
                      🏢 {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marketplace Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Marketplace / Plataforma
                </label>
                <select
                  value={selectedMarketplace}
                  onChange={(e) => setSelectedMarketplace(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-slate-100"
                >
                  <option value="ALL">🛒 Todas as Plataformas</option>
                  {marketplaces.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metric Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Tipo de Métrica
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMetricType('revenue')}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                      metricType === 'revenue'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Financeira (R$)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricType('quantity')}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                      metricType === 'quantity'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Pedidos (Un)</span>
                  </button>
                </div>
              </div>

              {/* Target Value Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Valor da Meta ({metricType === 'revenue' ? 'R$' : 'Unidades'})
                </label>
                <input
                  type="number"
                  step={metricType === 'revenue' ? '0.01' : '1'}
                  min="1"
                  required
                  value={targetValueInput}
                  onChange={(e) => setTargetValueInput(e.target.value)}
                  placeholder={metricType === 'revenue' ? 'Ex: 5000.00' : 'Ex: 150'}
                  className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            {/* Second row: Period, Date, Optional Custom Title, Submit Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Período da Meta
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'daily' | 'monthly')}
                  className="w-full p-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-slate-100"
                >
                  <option value="daily">📅 Diária (Dia Específico)</option>
                  <option value="monthly">🗓️ Mensal (Mês Completo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data Alvo ({period === 'daily' ? 'Dia' : 'Mês'})
                </label>
                <input
                  type={period === 'daily' ? 'date' : 'month'}
                  value={targetDateInput}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Deixe em branco p/ gerar automático"
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Meta Diária</span>
                </button>
              </div>
            </div>

            {showSuccessMsg && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Meta gravada e registrada no log de auditoria!</span>
              </div>
            )}
          </form>
        </div>
        </div>
      )}

      {/* FILTER BUTTONS & GOALS LIST HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Filtrar Metas:
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              filterType === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            Todas ({goals.length})
          </button>
          <button
            onClick={() => setFilterType('near_completion')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              filterType === 'near_completion'
                ? 'bg-blue-900 text-white'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-950 hover:bg-blue-100'
            }`}
          >
            🔥 Próximas de Atingir / Batidas ({totalAlertGoalsCount})
          </button>
          <button
            onClick={() => setFilterType('revenue')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              filterType === 'revenue'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            💰 Financeiras (R$)
          </button>
          <button
            onClick={() => setFilterType('quantity')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              filterType === 'quantity'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            📦 Volume de Pedidos (Un)
          </button>
          <button
            onClick={() => setFilterType('cnpj_mkt')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              filterType === 'cnpj_mkt'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            🏢 CNPJ x Marketplace
          </button>
        </div>
      </div>

      {/* GOALS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoalsWithStats.map((gs) => {
          const { goal: g, achievedValue, percent, missing, isQuantityMetric, isNearCompletion, isCompleted } = gs;

          // Find badges info
          const compBadge = g.companyId && g.companyId !== 'ALL' ? g.companyId : g.type === 'company' ? g.targetId : null;

          return (
            <div
              key={g.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs space-y-4 transition-all relative overflow-hidden ${
                isCompleted
                  ? 'border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                  : isNearCompletion
                  ? 'border-blue-400 dark:border-blue-900 ring-2 ring-blue-800/20 shadow-blue-800/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
              }`}
            >
              {/* Alert Ribbon Badge if Near Completion */}
              {isNearCompletion && (
                <div className="bg-gradient-to-r from-blue-800 to-blue-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1 absolute top-0 right-0">
                  <Flame className="w-3 h-3 animate-pulse" />
                  <span>Quase lá! ({percent}%)</span>
                </div>
              )}

              {/* Alert Ribbon Badge if Completed */}
              {isCompleted && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1 absolute top-0 right-0">
                  <Award className="w-3 h-3" />
                  <span>Meta Batida!</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pr-20">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {g.period === 'daily' ? 'Diária' : 'Mensal'}
                  </span>

                  {isQuantityMetric ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                      <Package className="w-3 h-3" /> Pedidos
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Faturamento
                    </span>
                  )}

                  {compBadge && compBadge !== 'ALL' && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      CNPJ {compBadge}
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditGoal(g)}
                      className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                      title="Editar Meta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{g.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>{g.targetName}</span>
                  {g.date && (
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({formatDateBR(g.date)})
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar section */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span
                    className={
                      percent >= 100
                        ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                        : percent >= 90
                        ? 'text-blue-900 dark:text-blue-400 font-extrabold flex items-center gap-1'
                        : 'text-purple-600 dark:text-purple-400'
                    }
                  >
                    {percent >= 90 && percent < 100 && <AlertTriangle className="w-3.5 h-3.5 text-blue-800" />}
                    {percent}% Atingido
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {isQuantityMetric ? (
                      <>
                        <strong>{achievedValue} un</strong> / {g.targetValue} un
                      </>
                    ) : (
                      <>
                        <strong>{formatCurrency(achievedValue)}</strong> / {formatCurrency(g.targetValue)}
                      </>
                    )}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percent >= 100
                        ? 'bg-emerald-500'
                        : percent >= 90
                        ? 'bg-gradient-to-r from-blue-800 to-blue-800 animate-pulse'
                        : 'bg-purple-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Card Footer */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
                <span>
                  Falta:{' '}
                  <strong
                    className={
                      percent >= 90 && percent < 100
                        ? 'text-blue-900 dark:text-blue-400 font-extrabold'
                        : 'text-blue-900 dark:text-blue-400 font-bold'
                    }
                  >
                    {isQuantityMetric ? `${missing} un` : formatCurrency(missing)}
                  </strong>
                </span>

                {percent >= 100 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Meta Batida!
                  </span>
                ) : percent >= 90 ? (
                  <span className="text-blue-900 dark:text-blue-300 font-bold flex items-center gap-1 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-blue-800" /> Apenas {100 - percent}% restante!
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {filteredGoalsWithStats.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs font-medium">
          Nenhuma meta encontrada para os filtros selecionados.
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {editingGoal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Editar Meta do Administrador
                </h3>
              </div>
              <button
                onClick={() => setEditingGoal(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoalEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Meta
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor da Meta ({editingGoal.metricType === 'quantity' ? 'Unidades' : 'R$'})
                </label>
                <input
                  type="number"
                  step={editingGoal.metricType === 'quantity' ? '1' : '0.01'}
                  min="1"
                  required
                  value={editTargetValue}
                  onChange={(e) => setEditTargetValue(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <span>
                  Ao salvar, esta alteração será gravada automaticamente no <strong>Log de Auditoria</strong> com o seu nome (
                  {currentUser.name}) e timestamp atual.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL AUDIT LOG MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Histórico de Auditoria de Metas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rastreamento de todas as modificações realizadas nas metas da plataforma.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {goalAuditLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const formattedDate = isNaN(dateObj.getTime())
                  ? log.timestamp
                  : `${dateObj.toLocaleDateString('pt-BR')} às ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

                return (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          {log.userName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{formattedDate}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{log.details}</p>
                    <div className="text-[10px] text-slate-400 font-mono">IP: {log.ip}</div>
                  </div>
                );
              })}

              {goalAuditLogs.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  Nenhum registro de auditoria encontrado.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN NOTIFICATION / ALERT SYSTEM MODAL */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-400 border border-blue-200 dark:border-blue-950">
                  <BellRing className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Central de Alertas de Metas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Notificações de metas com progresso crítico (≥ 90%) ou batidas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {/* Section: Próximas de Atingir (90-99%) */}
              {nearCompletionGoals.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-950 dark:text-blue-300 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-blue-800" />
                    <span>Próximas de Atingir ({nearCompletionGoals.length})</span>
                  </div>

                  <div className="space-y-2">
                    {nearCompletionGoals.map((gs) => (
                      <div
                        key={gs.goal.id}
                        className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-950/60 rounded-xl space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {gs.goal.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {gs.goal.targetName} {gs.goal.date && `(${formatDateBR(gs.goal.date)})`}
                            </div>
                          </div>
                          <span className="text-xs font-black text-blue-900 dark:text-blue-300 bg-blue-200 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                            {gs.percent}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          <span>
                            Atingido:{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {gs.isQuantityMetric ? `${gs.achievedValue} un` : formatCurrency(gs.achievedValue)}
                            </strong>
                          </span>
                          <span>
                            Falta:{' '}
                            <strong className="text-blue-900 dark:text-blue-400">
                              {gs.isQuantityMetric ? `${gs.missing} un` : formatCurrency(gs.missing)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Metas Batidas (100%) */}
              {completedGoals.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <span>Metas Batidas ({completedGoals.length})</span>
                  </div>

                  <div className="space-y-2">
                    {completedGoals.map((gs) => (
                      <div
                        key={gs.goal.id}
                        className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {gs.goal.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Meta:{' '}
                            {gs.isQuantityMetric
                              ? `${gs.goal.targetValue} un`
                              : formatCurrency(gs.goal.targetValue)}
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-900 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Batida
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalAlertGoalsCount === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhuma meta atingiu o patamar de alerta (≥ 90%) até o momento.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

