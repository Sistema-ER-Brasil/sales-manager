import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { filterSalesByPeriodAndFilters } from '../utils/filterUtils';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Trophy, Flame, Layers, Building2, ShoppingBag } from 'lucide-react';

export const RankingsView: React.FC = () => {
  const { sales, marketplaces, companies, periodFilter, setPeriodFilter, dateRange, setDateRange } = useApp();

  const [rankBy, setRankBy] = useState<'product' | 'marketplace' | 'company'>('product');

  const filteredSales = filterSalesByPeriodAndFilters(sales, periodFilter, dateRange, 'ALL', 'ALL');

  // Aggregation
  const map: Record<string, { name: string; qty: number; revenue: number; orders: number }> = {};

  filteredSales.forEach((s) => {
    let key = '';
    if (rankBy === 'product') key = s.productName || 'Outros';
    else if (rankBy === 'marketplace') {
      const m = marketplaces.find((item) => item.id === s.marketplaceId);
      key = m ? m.name : s.marketplaceId;
    } else if (rankBy === 'company') {
      key = `CNPJ ${s.companyId}`;
    }

    if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0, orders: 0 };
    map[key].qty += s.quantity;
    map[key].revenue += s.totalValue;
    map[key].orders += s.quantity;
  });

  const rankedList = Object.values(map).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-800" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Rankings de Desempenho
            </h2>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setRankBy('product')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                rankBy === 'product' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Produtos
            </button>
            <button
              onClick={() => setRankBy('marketplace')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                rankBy === 'marketplace' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Marketplaces
            </button>
            <button
              onClick={() => setRankBy('company')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                rankBy === 'company' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              CNPJs
            </button>
          </div>
        </div>

        {/* Period Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {(
            [
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: 'this_week', label: 'Esta Semana' },
              { id: 'last_7_days', label: 'Últimos 7 dias' },
              { id: 'last_30_days', label: 'Últimos 30 dias' },
              { id: 'this_month', label: 'Este Mês' },
              { id: 'this_year', label: 'Ano' },
              { id: 'custom', label: 'Dia / Período Específico' },
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

          {/* Custom Date Range Picker (also covers a single specific day when both dates match) */}
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
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {rankedList.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* #2 Silver */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-center relative overflow-hidden order-2 sm:order-1 border-t-4 border-t-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-extrabold text-xs flex items-center justify-center mx-auto mb-2">
              #2
            </div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">{rankedList[1].name}</h3>
            <div className="text-xl font-black text-slate-900 dark:text-white my-1">{formatCurrency(rankedList[1].revenue)}</div>
            <div className="text-xs text-slate-500">{rankedList[1].qty} un expedidas</div>
          </div>

          {/* #1 Gold */}
          <div className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border-2 border-blue-400 rounded-2xl p-6 shadow-md text-center relative overflow-hidden order-1 sm:order-2">
            <div className="w-10 h-10 rounded-full bg-blue-400 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-400/30">
              #1
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">{rankedList[0].name}</h3>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 my-1">{formatCurrency(rankedList[0].revenue)}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">{rankedList[0].qty} un expedidas</div>
          </div>

          {/* #3 Bronze */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-center relative overflow-hidden order-3 border-t-4 border-t-blue-900">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-extrabold text-xs flex items-center justify-center mx-auto mb-2">
              #3
            </div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">{rankedList[2].name}</h3>
            <div className="text-xl font-black text-slate-900 dark:text-white my-1">{formatCurrency(rankedList[2].revenue)}</div>
            <div className="text-xs text-slate-500">{rankedList[2].qty} un expedidas</div>
          </div>
        </div>
      )}

      {/* FULL RANKING LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                <th className="p-3 w-16 text-center">Posição</th>
                <th className="p-3">Item / Nome</th>
                <th className="p-3 text-center">Pedidos</th>
                <th className="p-3 text-center">Quantidade Total</th>
                <th className="p-3 text-right">Faturamento (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rankedList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-center font-black text-slate-500">
                    #{idx + 1}
                  </td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                  <td className="p-3 text-center font-bold">{item.orders}</td>
                  <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">{item.qty} un</td>
                  <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
