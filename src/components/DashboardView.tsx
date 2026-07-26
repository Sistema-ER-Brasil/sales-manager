import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { filterSalesByPeriodAndFilters } from '../utils/filterUtils';
import { formatCurrency, formatNumber, formatDateBR, getTodayString } from '../utils/formatters';
import { PeriodFilter } from '../types';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
  Store,
  UserCheck,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AiAnalysisModal } from './AiAnalysisModal';

const COLORS = ['#EE4D2D', '#FFE600', '#FF9900', '#0086FF', '#10B981', '#FE2C55', '#E60014', '#FF6200', '#8B5CF6'];

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    sales,
    companies,
    marketplaces,
    users,
    setActiveTab,
    periodFilter,
    setPeriodFilter,
    dateRange,
    setDateRange,
    selectedMarketplaceFilter,
    setSelectedMarketplaceFilter,
    selectedCompanyFilter,
    setSelectedCompanyFilter,
  } = useApp();

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Filtered sales
  const filteredSales = filterSalesByPeriodAndFilters(
    sales,
    periodFilter,
    dateRange,
    selectedMarketplaceFilter,
    selectedCompanyFilter
  );

  // Today sales
  const todaySales = sales.filter((s) => s.date === getTodayString());

  // Metrics
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalValue, 0);
  const totalQuantity = filteredSales.reduce((acc, s) => acc + s.quantity, 0);
  const totalOrders = filteredSales.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const estimatedProfit = totalRevenue * 0.28; // Estimated ~28% margin

  // Yesterday comparison for green/red badges
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const yesterdaySales = sales.filter((s) => s.date === yesterdayStr);
  const yesterdayRevenue = yesterdaySales.reduce((acc, s) => acc + s.totalValue, 0);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalValue, 0);
  const revGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  // Breakdown by CNPJ
  const cnpjMetrics = companies.map((c) => {
    const cSales = filteredSales.filter((s) => s.companyId === c.code || s.companyId === c.id);
    const val = cSales.reduce((acc, s) => acc + s.totalValue, 0);
    const orders = cSales.length;
    const qty = cSales.reduce((acc, s) => acc + s.quantity, 0);
    const ticket = orders > 0 ? val / orders : 0;
    return {
      code: c.code,
      name: c.name,
      value: val,
      orders,
      quantity: qty,
      ticket,
      badgeColor: c.badgeColor,
    };
  });

  // Chart 1: Bar Chart by Marketplace
  const marketplaceChartData = marketplaces
    .map((m) => {
      const mSales = filteredSales.filter((s) => s.marketplaceId === m.id);
      const val = mSales.reduce((acc, s) => acc + s.totalValue, 0);
      return {
        name: m.name,
        value: val,
        color: m.color,
      };
    })
    .filter((d) => d.value > 0);

  // Chart 2: Daily Evolution (Line Chart)
  const salesByDateMap: Record<string, number> = {};
  filteredSales.forEach((s) => {
    salesByDateMap[s.date] = (salesByDateMap[s.date] || 0) + s.totalValue;
  });
  const dailyEvolutionData = Object.keys(salesByDateMap)
    .sort()
    .map((d) => ({
      date: formatDateBR(d),
      faturamento: salesByDateMap[d],
    }));

  // Fetch AI Insights
  const handleGenerateAiInsight = async () => {
    setAiLoading(true);
    setAiModalOpen(true);
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: {
            todayRevenue,
            todayOrders: todaySales.length,
            todayTicket: todaySales.length > 0 ? todayRevenue / todaySales.length : 0,
            cnpjBreakdown: cnpjMetrics.map((c) => ({ code: c.code, val: c.value })),
            marketplaceBreakdown: marketplaceChartData,
          },
        }),
      });
      const data = await response.json();
      setAiInsight(data.insight || 'Análise concluída.');
    } catch (err: any) {
      setAiInsight('Ocorreu um erro ao gerar a análise. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Filtro de Período & Canais
            </span>
          </div>


        </div>

        {/* Period Chips & Dropdowns */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {(
            [
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: 'this_week', label: 'Esta Semana' },
              { id: 'last_7_days', label: 'Últimos 7 dias' },
              { id: 'last_30_days', label: 'Últimos 30 dias' },
              { id: 'this_month', label: 'Este Mês' },
              { id: 'this_year', label: 'Ano' },
              { id: 'custom', label: 'Personalizado' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodFilter(p.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                periodFilter === p.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Custom Date Range Picker */}
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-1.5 ml-auto">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-2 py-0.5 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400">até</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-2 py-0.5 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Dropdown Marketplace Filter */}
          <select
            value={selectedMarketplaceFilter}
            onChange={(e) => setSelectedMarketplaceFilter(e.target.value)}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos Marketplaces</option>
            {marketplaces.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Dropdown CNPJ Filter */}
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos CNPJs</option>
            {companies.map((c) => (
              <option key={c.id} value={c.code}>
                CNPJ {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {/* Card 1: Faturamento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Vendido
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold mt-1">
            {revGrowth >= 0 ? (
              <span className="text-blue-600 dark:text-blue-400 flex items-center">
                <ArrowUpRight className="w-3 h-3" />+{revGrowth.toFixed(1)}% vs ontem
              </span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400 flex items-center">
                <ArrowDownRight className="w-3 h-3" />
                {revGrowth.toFixed(1)}% vs ontem
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Pedidos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pedidos Total
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {formatNumber(totalOrders)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Volume de vendas</div>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ticket Médio
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(avgTicket)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Por pedido</div>
        </div>

        {/* Card 4: Receita Bruta */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Receita
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
            100% faturado
          </div>
        </div>
      </div>



      {/* CARDS POR CNPJ (ER2, MD, Orange, TTP, SOEHT) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Desempenho por CNPJ ({periodFilter.toUpperCase()})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {cnpjMetrics.map((c) => (
            <div
              key={c.code}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-blue-500 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${c.badgeColor}`}>
                  CNPJ {c.code}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">{c.orders} pedidos</span>
              </div>

              <div className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                {formatCurrency(c.value)}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Qtde: <strong className="text-slate-800 dark:text-slate-200">{c.quantity} un</strong></span>
                <span>Ticket: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(c.ticket)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart: Line Chart Daily Evolution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Evolução do Faturamento Diário
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
              <Line type="monotone" dataKey="faturamento" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart Marketplace */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Valor Vendido por Marketplace (R$)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketplaceChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Faturamento R$" radius={[6, 6, 0, 0]}>
                  {marketplaceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Chart Marketplaces % */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Participação de Mercado (%)
            </h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketplaceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {marketplaceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Legend formatter={(value) => <span className="text-xs text-slate-700 dark:text-slate-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      <AiAnalysisModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        insight={aiInsight}
        loading={aiLoading}
        onRefresh={handleGenerateAiInsight}
      />
    </div>
  );
};
