import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { filterSalesByPeriodAndFilters } from '../utils/filterUtils';
import { formatCurrency, formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { exportSalesToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import { SaleItem } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { getPermissions } from '../lib/permissions';
import {
  History,
  Search,
  Download,
  Filter,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  X,
  Info,
  Send,
  CheckCircle2,
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const {
    sales,
    companies,
    marketplaces,
    users,
    currentUser,
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
    updateSale,
    deleteSale,
    submitSaleForApproval,
    approveSale,
  } = useApp();

  const perms = getPermissions(currentUser.role);
  const isAdmin = perms.approveSales; // can approve/delete/see everyone's sales

  const [searchTerm, setSearchTerm] = useState('');
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  const [viewingAuditSale, setViewingAuditSale] = useState<SaleItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: 'submit' | 'delete'; sale: SaleItem } | null
  >(null);

  // Filtered sales
  let filtered = filterSalesByPeriodAndFilters(
    sales,
    periodFilter,
    dateRange,
    selectedMarketplaceFilter,
    selectedCompanyFilter
  );

  // Filter to a specific seller (e.g. navigated here from "Ver vendas de X")
  const filteredUserName = historyUserFilter ? users.find((u) => u.id === historyUserFilter)?.name : null;
  if (historyUserFilter) {
    filtered = filtered.filter((s) => s.createdByUserId === historyUserFilter);
  }

  // User permission check
  if (!isAdmin) {
    filtered = filtered.filter((s) =>
      currentUser.assignedMarketplaces.includes(s.marketplaceId)
    );
  }

  // Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.productName.toLowerCase().includes(term) ||
        s.createdByName.toLowerCase().includes(term) ||
        s.companyId.toLowerCase().includes(term) ||
        s.marketplaceId.toLowerCase().includes(term) ||
        (s.notes && s.notes.toLowerCase().includes(term))
    );
  }

  // Handle Export
  const handleExportExcel = () => {
    const exportData = filtered.map((s) => ({
      ID: s.id,
      Data: formatDateBR(s.date),
      Marketplace: s.marketplaceId.toUpperCase(),
      CNPJ: s.companyId,
      Produto: s.productName,
      Quantidade: s.quantity,
      'Valor Total R$': s.totalValue,
      'Valor Médio R$': s.avgValue,
      LançadoPor: s.createdByName,
      CriadoEm: formatDateTimeBR(s.createdAt),
      Observações: s.notes || '',
    }));
    exportToExcel('historico_vendas_marketplace', 'Vendas', exportData);
  };

  const handleExportCSV = () => {
    const exportData = filtered.map((s) => ({
      ID: s.id,
      Data: formatDateBR(s.date),
      Marketplace: s.marketplaceId.toUpperCase(),
      CNPJ: s.companyId,
      Produto: s.productName,
      Quantidade: s.quantity,
      'Valor Total R$': s.totalValue,
      'Valor Médio R$': s.avgValue,
      LançadoPor: s.createdByName,
      CriadoEm: formatDateTimeBR(s.createdAt),
    }));
    exportToCSV('historico_vendas_marketplace', exportData);
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Marketplace', 'CNPJ', 'Produto', 'Qtde', 'Total R$', 'Lançado Por'];
    const rows = filtered.map((s) => [
      formatDateBR(s.date),
      s.marketplaceId.toUpperCase(),
      s.companyId,
      s.productName,
      `${s.quantity} un`,
      formatCurrency(s.totalValue),
      s.createdByName,
    ]);
    exportSalesToPDF('Histórico de Vendas de Marketplaces', headers, rows, 'historico_vendas');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Histórico Completo de Vendas
            </h2>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por produto, usuário..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Period filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="this_week">Esta Semana</option>
            <option value="last_7_days">Últimos 7 dias</option>
            <option value="last_30_days">Últimos 30 dias</option>
            <option value="this_month">Este Mês</option>
            <option value="this_year">Ano</option>
            <option value="custom">Personalizado</option>
          </select>

          {/* Marketplace Filter */}
          <select
            value={selectedMarketplaceFilter}
            onChange={(e) => setSelectedMarketplaceFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos Marketplaces</option>
            {marketplaces.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* CNPJ Filter */}
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos CNPJs</option>
            {companies.map((c) => (
              <option key={c.id} value={c.code}>CNPJ {c.code}</option>
            ))}
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

        {filteredUserName && (
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              Filtrando por vendedor: {filteredUserName}
              <button onClick={() => setHistoryUserFilter('')} className="hover:text-blue-950 dark:hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* SALES HISTORY TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase">
            Total de {filtered.length} vendas encontradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                <th className="p-3">Data</th>
                <th className="p-3">Marketplace</th>
                <th className="p-3">CNPJ</th>
                <th className="p-3">Produto</th>
                <th className="p-3 text-center">Qtde</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3 text-right">Valor Médio</th>
                <th className="p-3">Lançado por</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Nenhum registro de venda encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => {
                  const isOwner = sale.createdByUserId === currentUser.id;
                  const canEdit = sale.status === 'draft' && (isAdmin || isOwner);
                  const canSubmit = sale.status === 'draft' && (isAdmin || isOwner);
                  const canApprove = isAdmin && sale.status === 'submitted';

                  return (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {formatDateBR(sale.date)}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 uppercase">
                      {sale.marketplaceId}
                    </td>
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                      {sale.companyId}
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {sale.productName}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-slate-100">
                      {sale.quantity} un
                    </td>
                    <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(sale.totalValue)}
                    </td>
                    <td className="p-3 text-right font-medium text-slate-500">
                      {formatCurrency(sale.avgValue)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {sale.createdByName}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase whitespace-nowrap ${
                          sale.status === 'approved'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : sale.status === 'submitted'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {sale.status === 'approved' ? 'Aprovado' : sale.status === 'submitted' ? 'Aguardando Aprovação' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingAuditSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Detalhes de Auditoria"
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => setEditingSale(sale)}
                            className="p-1.5 text-slate-500 hover:text-blue-900"
                            title="Editar Registro"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canSubmit && (
                          <button
                            onClick={() => setConfirmAction({ type: 'submit', sale })}
                            className="p-1.5 text-slate-500 hover:text-blue-600"
                            title="Enviar para Aprovação"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {canApprove && (
                          <button
                            onClick={() => approveSale(sale.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600"
                            title="Aprovar Venda"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setConfirmAction({ type: 'delete', sale })}
                            className="p-1.5 text-slate-500 hover:text-blue-600"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Editar Venda ({editingSale.id})</h3>
              <button onClick={() => setEditingSale(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Produto</label>
                <input
                  type="text"
                  value={editingSale.productName}
                  onChange={(e) => setEditingSale({ ...editingSale, productName: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Data da Venda</label>
                <input
                  type="date"
                  value={editingSale.date}
                  onChange={(e) => setEditingSale({ ...editingSale, date: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={editingSale.quantity}
                    onChange={(e) => {
                      const q = parseInt(e.target.value) || 1;
                      const avg = q > 0 ? editingSale.totalValue / q : 0;
                      setEditingSale({ ...editingSale, quantity: q, avgValue: avg });
                    }}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.totalValue}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      const avg = editingSale.quantity > 0 ? v / editingSale.quantity : 0;
                      setEditingSale({ ...editingSale, totalValue: v, avgValue: avg });
                    }}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setEditingSale(null)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
              <button
                onClick={() => {
                  updateSale(editingSale);
                  setEditingSale(null);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT DETAILS MODAL */}
      {viewingAuditSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Detalhes de Auditoria da Venda</h3>
              <button onClick={() => setViewingAuditSale(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-2">
              <div><strong>ID Registro:</strong> {viewingAuditSale.id}</div>
              <div><strong>Data da Venda:</strong> {formatDateBR(viewingAuditSale.date)}</div>
              <div><strong>Canal:</strong> {viewingAuditSale.marketplaceId.toUpperCase()}</div>
              <div><strong>Empresa CNPJ:</strong> {viewingAuditSale.companyId}</div>
              <div><strong>Lançado Por:</strong> {viewingAuditSale.createdByName}</div>
              <div><strong>Data/Hora do Registro:</strong> {formatDateTimeBR(viewingAuditSale.createdAt)}</div>
              <div><strong>Observações:</strong> {viewingAuditSale.notes || 'Nenhuma'}</div>
            </div>

            <button onClick={() => setViewingAuditSale(null)} className="w-full py-2 bg-slate-800 text-white font-bold rounded-lg">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM ACTION DIALOG */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={confirmAction?.type === 'submit' ? 'Enviar para Aprovação' : 'Excluir Registro de Venda'}
        message={
          confirmAction?.type === 'submit'
            ? 'Enviar esta venda para aprovação do administrador? Depois de enviada, você não conseguirá mais editá-la.'
            : 'Tem certeza que deseja excluir este registro de venda? Esta ação não pode ser desfeita.'
        }
        confirmLabel={confirmAction?.type === 'submit' ? 'Enviar' : 'Excluir'}
        variant={confirmAction?.type === 'delete' ? 'danger' : 'default'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === 'submit') submitSaleForApproval(confirmAction.sale.id);
          if (confirmAction.type === 'delete') deleteSale(confirmAction.sale.id);
          setConfirmAction(null);
        }}
      />
    </div>
  );
};
