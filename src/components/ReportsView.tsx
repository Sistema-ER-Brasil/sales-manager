import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { filterSalesByPeriodAndFilters, getPeriodDateRange } from '../utils/filterUtils';
import { formatCurrency, formatNumber, formatDateBR } from '../utils/formatters';
import { exportToExcel, exportSalesToPDF, exportToCSV, exportMatrixToJpeg } from '../utils/exportUtils';
import { BarChart3, FileSpreadsheet, FileText, Image as ImageIcon, Building2, ShoppingBag, Package, User, Table as TableIcon, Download, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, companies, marketplaces, products, users, periodFilter, setPeriodFilter, dateRange, setDateRange } = useApp();

  const [groupBy, setGroupBy] = useState<'marketplace' | 'company' | 'product' | 'user'>('marketplace');
  const [isExportingJpg, setIsExportingJpg] = useState(false);

  const filteredSales = filterSalesByPeriodAndFilters(sales, periodFilter, dateRange, 'ALL', 'ALL');

  // Matrix calculation
  const matrixData = marketplaces.map((m) => {
    const row: any = {
      marketplaceId: m.id,
      marketplaceName: m.name,
      color: m.color || '#3b82f6',
      totalQty: 0,
      totalVal: 0,
    };

    companies.forEach((c) => {
      const cSales = filteredSales.filter(
        (s) =>
          (s.marketplaceId === m.id || s.marketplaceId === m.slug) &&
          (s.companyId === c.code || s.companyId === c.id)
      );
      const qty = cSales.reduce((acc, s) => acc + s.quantity, 0);
      const val = cSales.reduce((acc, s) => acc + s.totalValue, 0);

      row[`${c.code}_qty`] = qty;
      row[`${c.code}_val`] = val;

      row.totalQty += qty;
      row.totalVal += val;
    });

    return row;
  });

  const matrixTotalQty = matrixData.reduce((acc, r) => acc + r.totalQty, 0);
  const matrixTotalRev = matrixData.reduce((acc, r) => acc + r.totalVal, 0);

  const { start: periodStart, end: periodEnd } = getPeriodDateRange(periodFilter, dateRange);
  const currentPeriodLabel =
    periodStart === periodEnd ? formatDateBR(periodStart) : `${formatDateBR(periodStart)} até ${formatDateBR(periodEnd)}`;

  const handleExportMatrixJpeg = async () => {
    setIsExportingJpg(true);
    try {
      await exportMatrixToJpeg({
        companies,
        matrixData,
        matrixTotalQty,
        matrixTotalRev,
        periodLabel: currentPeriodLabel,
        filename: `matriz_vendas_plataforma_cnpj_${periodFilter.toLowerCase()}`,
      });
    } catch (err) {
      console.error('Erro ao gerar JPG da matriz:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Grouping logic
  let reportRows: Array<{ name: string; orders: number; quantity: number; revenue: number; ticket: number }> = [];

  if (groupBy === 'marketplace') {
    reportRows = marketplaces.map((m) => {
      const mSales = filteredSales.filter((s) => s.marketplaceId === m.id);
      const revenue = mSales.reduce((acc, s) => acc + s.totalValue, 0);
      const quantity = mSales.reduce((acc, s) => acc + s.quantity, 0);
      const orders = quantity;
      return {
        name: m.name,
        orders,
        quantity,
        revenue,
        ticket: orders > 0 ? revenue / orders : 0,
      };
    });
  } else if (groupBy === 'company') {
    reportRows = companies.map((c) => {
      const cSales = filteredSales.filter((s) => s.companyId === c.code || s.companyId === c.id);
      const revenue = cSales.reduce((acc, s) => acc + s.totalValue, 0);
      const quantity = cSales.reduce((acc, s) => acc + s.quantity, 0);
      const orders = quantity;
      return {
        name: `CNPJ ${c.code} (${c.name})`,
        orders,
        quantity,
        revenue,
        ticket: orders > 0 ? revenue / orders : 0,
      };
    });
  } else if (groupBy === 'product') {
    const prodMap: Record<string, { name: string; orders: number; quantity: number; revenue: number }> = {};
    filteredSales.forEach((s) => {
      const key = s.productName || 'Outros';
      if (!prodMap[key]) prodMap[key] = { name: key, orders: 0, quantity: 0, revenue: 0 };
      prodMap[key].orders += s.quantity;
      prodMap[key].quantity += s.quantity;
      prodMap[key].revenue += s.totalValue;
    });

    reportRows = Object.values(prodMap).map((p) => ({
      ...p,
      ticket: p.orders > 0 ? p.revenue / p.orders : 0,
    }));
  } else if (groupBy === 'user') {
    reportRows = users.map((u) => {
      const uSales = filteredSales.filter((s) => s.createdByUserId === u.id || s.createdByName === u.name);
      const revenue = uSales.reduce((acc, s) => acc + s.totalValue, 0);
      const quantity = uSales.reduce((acc, s) => acc + s.quantity, 0);
      const orders = quantity;
      return {
        name: `${u.name} (${u.role})`,
        orders,
        quantity,
        revenue,
        ticket: orders > 0 ? revenue / orders : 0,
      };
    });
  }

  reportRows.sort((a, b) => b.revenue - a.revenue);

  const totalRev = reportRows.reduce((acc, r) => acc + r.revenue, 0);
  const totalQty = reportRows.reduce((acc, r) => acc + r.quantity, 0);
  const totalOrd = reportRows.reduce((acc, r) => acc + r.orders, 0);

  const handleExportExcel = () => {
    const data = reportRows.map((r) => ({
      'Agrupamento': r.name,
      'Pedidos': r.orders,
      'Quantidade un': r.quantity,
      'Receita Total R$': r.revenue,
      'Ticket Médio R$': r.ticket,
    }));
    exportToExcel(`relatorio_vendas_${groupBy}`, 'Relatório', data);
  };

  const handleExportPDF = () => {
    const headers = ['Agrupamento', 'Pedidos', 'Qtde', 'Receita R$', 'Ticket Médio R$'];
    const rows = reportRows.map((r) => [
      r.name,
      r.orders,
      `${r.quantity} un`,
      formatCurrency(r.revenue),
      formatCurrency(r.ticket),
    ]);
    exportSalesToPDF(`Relatório Consolidado de Vendas (${groupBy.toUpperCase()})`, headers, rows, `relatorio_${groupBy}`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Relatórios Executivos & Consolidação
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleExportExcel} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={handleExportPDF} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handleExportMatrixJpeg}
              disabled={isExportingJpg}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Baixar Matriz Consolidada em Imagem JPG"
            >
              {isExportingJpg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>{isExportingJpg ? 'Gerando...' : 'Matriz JPG'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Group By selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'marketplace', label: 'Por Marketplace', icon: ShoppingBag },
              { id: 'company', label: 'Por CNPJ', icon: Building2 },
              { id: 'product', label: 'Por Produto', icon: Package },
              { id: 'user', label: 'Por Usuário', icon: User },
            ].map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  onClick={() => setGroupBy(g.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    groupBy === g.id ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>

          {/* Period filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="this_week">Esta Semana</option>
            <option value="weekend">Fim de Semana (Sex a Dom)</option>
            <option value="last_7_days">Últimos 7 dias</option>
            <option value="last_30_days">Últimos 30 dias</option>
            <option value="this_month">Este Mês</option>
            <option value="this_year">Ano</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {/* Custom Date Range Picker */}
        {periodFilter === 'custom' && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-2 py-1 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
            <span className="text-[10px] text-slate-400">até</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-2 py-1 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>
        )}
      </div>

      {/* REPORT TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                <th className="p-3">Agrupamento ({groupBy.toUpperCase()})</th>
                <th className="p-3 text-center">Lançado</th>
                <th className="p-3 text-center">Número de Pedidos</th>
                <th className="p-3 text-right">Faturamento Total (R$)</th>
                <th className="p-3 text-right">Ticket Médio (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{row.name}</td>
                  <td className="p-3 text-center font-bold">{row.orders}</td>
                  <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">{row.quantity} un</td>
                  <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">{formatCurrency(row.revenue)}</td>
                  <td className="p-3 text-right font-medium text-slate-500">{formatCurrency(row.ticket)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <td className="p-3 uppercase">TOTALIZADOR GERAL</td>
                <td className="p-3 text-center">{totalOrd}</td>
                <td className="p-3 text-center">{totalQty} un</td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(totalRev)}</td>
                <td className="p-3 text-right text-slate-500">{formatCurrency(totalOrd > 0 ? totalRev / totalOrd : 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SPREADSHEET MATRIX TABLE (Plataforma vs CNPJs ER2, MD, Orange, TTP, SOEHT) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Matriz Consolidada de Vendas (Plataforma x CNPJ)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Consolidação executiva de volume e faturamento por canal e CNPJ do grupo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Valores em R$ / Qtde</span>
            <button
              onClick={handleExportMatrixJpeg}
              disabled={isExportingJpg}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isExportingJpg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>{isExportingJpg ? 'Gerando JPG...' : 'Baixar Matriz JPG'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3 rounded-tl-xl">Plataforma</th>
                {companies.map((c) => (
                  <th key={c.code} className="p-3 text-center border-l border-slate-800">
                    <div>{c.code}</div>
                    <div className="text-[9px] text-slate-400 font-normal">Qtde | R$</div>
                  </th>
                ))}
                <th className="p-3 text-right border-l border-slate-800 rounded-tr-xl bg-blue-950 text-blue-200">
                  Total Geral
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matrixData.map((row) => (
                <tr
                  key={row.marketplaceId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.marketplaceName}
                  </td>

                  {companies.map((c) => {
                    const q = row[`${c.code}_qty`] || 0;
                    const v = row[`${c.code}_val`] || 0;
                    const isLinked = (c.marketplaceIds || []).includes(row.marketplaceId);
                    return (
                      <td
                        key={c.code}
                        className={`p-3 text-center border-l border-slate-100 dark:border-slate-800/50 font-medium ${
                          !isLinked ? 'bg-slate-50/80 dark:bg-slate-800/40' : ''
                        }`}
                      >
                        {q > 0 ? (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 mr-1">{q} un</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(v)}</span>
                          </div>
                        ) : isLinked ? (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 mr-1">0 un</span>
                            <span className="text-slate-400 dark:text-slate-500">{formatCurrency(0)}</span>
                          </div>
                        ) : (
                          <span
                            className="text-slate-300 dark:text-slate-600"
                            title={`${row.marketplaceName} não está vinculado ao CNPJ ${c.code} (Configurações → Cadastros)`}
                          >
                            — não vinculado
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="p-3 text-right font-extrabold border-l border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30 text-blue-600 dark:text-blue-400">
                    <div>{row.totalQty} un</div>
                    <div className="text-xs">{formatCurrency(row.totalVal)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals Row */}
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-700">
                <td className="p-3 uppercase">TOTAL GERAL</td>
                {companies.map((c) => {
                  const cTotVal = matrixData.reduce((acc, r) => acc + (r[`${c.code}_val`] || 0), 0);
                  const cTotQty = matrixData.reduce((acc, r) => acc + (r[`${c.code}_qty`] || 0), 0);
                  return (
                    <td key={c.code} className="p-3 text-center border-l border-slate-200 dark:border-slate-700">
                      <div>{cTotQty} un</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">{formatCurrency(cTotVal)}</div>
                    </td>
                  );
                })}
                <td className="p-3 text-right border-l border-slate-200 dark:border-slate-700 bg-blue-600 text-white text-sm">
                  <div>{matrixTotalQty} un</div>
                  <div>{formatCurrency(matrixTotalRev)}</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MARKETPLACE COVERAGE / GAPS PER CNPJ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Marketplaces Não Configurados por CNPJ
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Canais ainda não vinculados a cada CNPJ. Configure em Configurações → Cadastros.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3 rounded-tl-xl">CNPJ</th>
                <th className="p-3 border-l border-slate-800">Marketplaces Configurados</th>
                <th className="p-3 border-l border-slate-800 rounded-tr-xl">Marketplaces Faltantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {companies.map((c) => {
                const activeMarketplaces = marketplaces.filter((m) => m.status === 'active');
                const configuredIds = new Set(c.marketplaceIds || []);
                const configured = activeMarketplaces.filter((m) => configuredIds.has(m.id));
                const missing = activeMarketplaces.filter((m) => !configuredIds.has(m.id));
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors align-top">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{c.code}</td>
                    <td className="p-3 border-l border-slate-100 dark:border-slate-800/50">
                      {configured.length === 0 ? (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {configured.map((m) => (
                            <span key={m.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white flex items-center gap-1" style={{ backgroundColor: m.color }}>
                              <CheckCircle2 className="w-2.5 h-2.5" /> {m.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-l border-slate-100 dark:border-slate-800/50">
                      {missing.length === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Completo — todos configurados</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {missing.map((m) => (
                            <span key={m.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
