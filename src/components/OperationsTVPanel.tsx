import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, getTodayString } from '../utils/formatters';
import {
  Tv,
  Clock,
  RefreshCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Target,
  Trophy,
  Zap,
  Building2,
  ShoppingBag,
  TrendingUp,
  PackageCheck,
  Flame,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const OperationsTVPanel: React.FC = () => {
  const { sales, companies, marketplaces, products, goals, settings, updateSettings, lastSaleTimestamp } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasNewSalePulse, setHasNewSalePulse] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Trigger pulse animation when a sale occurs
  useEffect(() => {
    setHasNewSalePulse(true);
    setLastRefreshedAt(new Date());
    const timeout = setTimeout(() => setHasNewSalePulse(false), 3000);
    return () => clearTimeout(timeout);
  }, [lastSaleTimestamp]);

  // Today sales
  const todayStr = getTodayString();
  const todaySales = sales.filter((s) => s.date === todayStr);

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalValue, 0);
  const todayOrders = todaySales.length;
  const todayQuantity = todaySales.reduce((acc, s) => acc + s.quantity, 0);
  const todayAvgTicket = todayOrders > 0 ? todayRevenue / todayOrders : 0;

  // Daily Goal (Target R$ 12.000 or total from goals)
  const dailyGoal = goals.find((g) => g.type === 'company' && g.targetId === 'ALL')?.targetValue || 12000;
  const goalAchievedPercent = Math.min(100, Math.round((todayRevenue / dailyGoal) * 100));
  const remainingGoal = Math.max(0, dailyGoal - todayRevenue);

  // Pedidos por CNPJ
  const cnpjBreakdown = companies.map((c) => {
    const cSales = todaySales.filter((s) => s.companyId === c.code || s.companyId === c.id);
    const val = cSales.reduce((acc, s) => acc + s.totalValue, 0);
    const qty = cSales.reduce((acc, s) => acc + s.quantity, 0);
    return {
      code: c.code,
      name: c.name,
      orders: cSales.length,
      val,
      qty,
      badgeColor: c.badgeColor,
    };
  });

  // Pedidos por Marketplace
  const mktBreakdown = marketplaces
    .map((m) => {
      const mSales = todaySales.filter((s) => s.marketplaceId === m.id);
      const val = mSales.reduce((acc, s) => acc + s.totalValue, 0);
      const orders = mSales.length;
      return {
        id: m.id,
        name: m.name,
        color: m.color,
        orders,
        val,
      };
    })
    .filter((m) => m.val > 0)
    .sort((a, b) => b.val - a.val);

  // Top 5 Products Today
  const productSalesMap: Record<string, { name: string; qty: number; val: number }> = {};
  todaySales.forEach((s) => {
    const key = s.productName || 'Outros';
    if (!productSalesMap[key]) {
      productSalesMap[key] = { name: key, qty: 0, val: 0 };
    }
    productSalesMap[key].qty += s.quantity;
    productSalesMap[key].val += s.totalValue;
  });

  const topProductsToday = Object.values(productSalesMap)
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6 font-sans select-none relative overflow-hidden">
      {/* Glow pulse overlay on new sale */}
      {hasNewSalePulse && (
        <div className="absolute inset-0 bg-emerald-500/10 border-4 border-emerald-500 animate-pulse pointer-events-none z-50 transition-all rounded-3xl" />
      )}

      {/* TOP TV HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl backdrop-blur-md">
        {/* Title & Pulse */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white uppercase">PAINEL DE OPERAÇÕES EXPEDIÇÃO</h1>
              {hasNewSalePulse && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-bounce flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-slate-950" /> NOVA VENDA DETECTADA!
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Atualização em Tempo Real</span>
              <span>•</span>
              <span className="text-slate-300 font-mono">
                Última sincronia: {lastRefreshedAt.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Live Clock & Control Buttons */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <div className="text-xl font-extrabold text-emerald-400 font-mono tracking-wider">
              {currentTime.toLocaleTimeString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <button
            onClick={() => updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors"
            title="Sons de Notificação"
          >
            {settings.soundEffectsEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            title="Modo Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* HIGH VISIBILITY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento do Dia */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Faturamento de Hoje</div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight my-1">
            {formatCurrency(todayRevenue)}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
            <span>Ticket Médio: <strong className="text-white">{formatCurrency(todayAvgTicket)}</strong></span>
            <span className="text-emerald-400 font-bold">HOJE</span>
          </div>
        </div>

        {/* Card 2: Total de Pedidos */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-blue-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Pedidos Expedição</div>
          <div className="text-3xl sm:text-4xl font-black text-blue-400 tracking-tight my-1">
            {formatNumber(todayOrders)} <span className="text-lg text-slate-400 font-semibold">pedidos</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
            <span>Volume de un: <strong className="text-white">{formatNumber(todayQuantity)} un</strong></span>
            <span className="text-blue-400 font-bold">EXPEDIÇÃO</span>
          </div>
        </div>

        {/* Card 3: Meta do Dia & % Atingida */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-purple-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden col-span-1 sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-400" />
              Meta de Vendas do Dia
            </span>
            <span className="text-xl font-black text-purple-300">{goalAchievedPercent}% Atingido</span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-800 mb-3">
            <div
              className="bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-md shadow-emerald-500/20"
              style={{ width: `${goalAchievedPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Meta Alvo: <strong className="text-white font-mono">{formatCurrency(dailyGoal)}</strong></span>
            <span>Realizado: <strong className="text-emerald-400 font-mono">{formatCurrency(todayRevenue)}</strong></span>
            <span>Falta: <strong className="text-amber-400 font-mono">{formatCurrency(remainingGoal)}</strong></span>
          </div>
        </div>
      </div>

      {/* PEDIDOS POR CNPJ */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          Volume de Vendas por CNPJ Hoje
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cnpjBreakdown.map((c) => (
            <div key={c.code} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center shadow-lg hover:border-slate-700 transition-all">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${c.badgeColor}`}>
                {c.code}
              </span>
              <div className="text-2xl font-black text-white my-2">{c.orders} <span className="text-xs font-normal text-slate-400">pedidos</span></div>
              <div className="text-xs font-extrabold text-emerald-400 font-mono">{formatCurrency(c.val)}</div>
              <div className="text-[10px] text-slate-400 mt-1">{c.qty} un separadas</div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO COLUMN GRID: MARKETPLACES & RANKING PRODUTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplaces breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Performance por Marketplace Hoje
          </h2>

          <div className="space-y-2.5">
            {mktBreakdown.map((m) => (
              <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: m.color }} />
                  <span className="font-extrabold text-sm text-white">{m.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 font-mono">{formatCurrency(m.val)}</span>
                  <div className="text-[10px] text-slate-400">{m.orders} pedidos</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Products Ranking Today */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top 5 Produtos Mais Vendidos Hoje
          </h2>

          <div className="space-y-2.5">
            {topProductsToday.map((p, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-xs text-white line-clamp-1 max-w-[220px]">{p.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono">{formatCurrency(p.val)}</span>
                  <div className="text-[10px] text-slate-400">{p.qty} un expedidas</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
