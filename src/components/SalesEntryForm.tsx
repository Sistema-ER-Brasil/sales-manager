import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayString, formatCurrency } from '../utils/formatters';
import { PlusCircle, Save, CheckCircle2, ShoppingBag, Layers, AlertCircle, Plus, Trash2, Clock, Store, X } from 'lucide-react';

export const SalesEntryForm: React.FC = () => {
  const { currentUser, marketplaces, companies, sales, addSale, addSalesBatch } = useApp();

  const isAdmin = currentUser.role === 'admin';

  // Filter marketplaces permitted for user
  const availableMarketplaces = marketplaces.filter((m) =>
    isAdmin ? true : currentUser.assignedMarketplaces.includes(m.id) || currentUser.assignedMarketplaces.includes(m.slug)
  );

  // Filter companies (CNPJs) permitted for user
  const availableCompanies = companies.filter((c) =>
    isAdmin ? true : currentUser.assignedCompanies.includes(c.id) || currentUser.assignedCompanies.includes(c.code)
  );

  // User's assigned marketplaces daily status check
  const todayStr = getTodayString();
  const userTodaySales = sales.filter((s) => {
    const isToday = s.date === todayStr;
    const isUser = s.createdByUserId === currentUser.id || s.createdByName === currentUser.name;
    return isToday && isUser;
  });

  const marketplaceFillingStatus = availableMarketplaces.map((m) => {
    const mSales = userTodaySales.filter((s) => s.marketplaceId === m.id || s.marketplaceId === m.slug);
    const isFilled = mSales.length > 0;
    const totalVal = mSales.reduce((acc, s) => acc + s.totalValue, 0);
    return {
      marketplace: m,
      isFilled,
      salesCount: mSales.length,
      totalVal,
    };
  });

  const pendingMarketplaces = marketplaceFillingStatus.filter((item) => !item.isFilled);
  const isFullyFilled = availableMarketplaces.length > 0 && pendingMarketplaces.length === 0;

  // Single form state
  const [date, setDate] = useState(getTodayString());
  const [marketplaceId, setMarketplaceId] = useState(availableMarketplaces[0]?.id || 'shopee');
  const [companyId, setCompanyId] = useState(availableCompanies[0]?.code || 'ER2');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [totalValue, setTotalValue] = useState(0);
  const [notes, setNotes] = useState('');

  const [entryMode, setEntryMode] = useState<'single' | 'batch'>('single');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);

  // Batch rows state
  const [batchRows, setBatchRows] = useState([
    {
      id: 1,
      date: getTodayString(),
      marketplaceId: availableMarketplaces[0]?.id || 'shopee',
      companyId: availableCompanies[0]?.code || 'ER2',
      productName: '',
      quantity: 1,
      totalValue: 0,
      notes: '',
    },
  ]);

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
  };

  const avgValue = quantity > 0 ? totalValue / quantity : 0;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalValue <= 0) {
      alert('O valor total da venda deve ser maior que R$ 0,00.');
      return;
    }

    addSale({
      date,
      marketplaceId,
      companyId,
      productName: productName || 'Venda Manual',
      quantity,
      totalValue,
      avgValue,
      notes,
    });

    setSuccessMessage(`Venda de R$ ${totalValue.toFixed(2)} lançada com sucesso!`);
    setTimeout(() => setSuccessMessage(''), 3000);

    // Reset form
    setProductName('');
    setQuantity(1);
    setTotalValue(0);
    setNotes('');
    setShowEntryModal(false);
  };

  // Batch Handlers
  const addBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: getTodayString(),
        marketplaceId: availableMarketplaces[0]?.id || 'shopee',
        companyId: availableCompanies[0]?.code || 'ER2',
        productName: '',
        quantity: 1,
        totalValue: 0,
        notes: '',
      },
    ]);
  };

  const removeBatchRow = (id: number) => {
    if (batchRows.length === 1) return;
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateBatchRow = (id: number, field: string, value: any) => {
    setBatchRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter((r) => r.productName && r.totalValue > 0);
    if (validRows.length === 0) {
      alert('Preencha ao menos uma linha válida de venda (Com Produto e Valor > 0).');
      return;
    }

    const items = validRows.map((r) => ({
      date: r.date,
      marketplaceId: r.marketplaceId,
      companyId: r.companyId,
      productName: r.productName,
      quantity: Number(r.quantity),
      totalValue: Number(r.totalValue),
      avgValue: Number(r.quantity) > 0 ? Number(r.totalValue) / Number(r.quantity) : 0,
      notes: r.notes,
    }));

    addSalesBatch(items);
    setSuccessMessage(`${items.length} lançamentos em lote gravados com sucesso!`);
    setTimeout(() => setSuccessMessage(''), 3000);
    setShowEntryModal(false);

    setBatchRows([
      {
        id: Date.now(),
        date: getTodayString(),
        marketplaceId: availableMarketplaces[0]?.id || 'shopee',
        companyId: availableCompanies[0]?.code || 'ER2',
        productName: '',
        quantity: 1,
        totalValue: 0,
        notes: '',
      },
    ]);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      {/* Top Notification */}
      {successMessage && (
        <div className="p-4 bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Daily Filling Status Banner for User */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${isFullyFilled ? 'bg-blue-600' : 'bg-blue-900'}`}>
              {isFullyFilled ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Status de Hoje
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isFullyFilled
                  ? 'Todos os canais lançados. Bom trabalho!'
                  : `${marketplaceFillingStatus.length - pendingMarketplaces.length} de ${marketplaceFillingStatus.length} canais lançados hoje`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isFullyFilled ? 'bg-blue-600' : 'bg-blue-900'}`}
                  style={{
                    width: `${marketplaceFillingStatus.length > 0 ? ((marketplaceFillingStatus.length - pendingMarketplaces.length) / marketplaceFillingStatus.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                {marketplaceFillingStatus.length - pendingMarketplaces.length}/{marketplaceFillingStatus.length}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">{todayStr}</span>
          </div>
        </div>

        {/* Compact channel grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {marketplaceFillingStatus.map((item) => {
            const m = item.marketplace;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMarketplaceId(m.id)}
                title={item.isFilled ? `${m.name} — lançado (${formatCurrency(item.totalVal)})` : `${m.name} — pendente`}
                className={`relative px-2.5 py-2 rounded-xl text-[11px] font-bold text-left transition-all border ${
                  item.isFilled
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-900 hover:bg-blue-100'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block truncate pr-4">{m.name}</span>
                <span
                  className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    item.isFilled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  {item.isFilled && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header & Trigger Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Lançamento Diário de Vendas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registre as vendas diárias por Marketplace e CNPJ. O dashboard atualizará em tempo real.
          </p>
        </div>

        <button
          onClick={() => setShowEntryModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* ENTRY MODAL (Simple + Batch) */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-w-4xl w-full my-8">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setEntryMode('single')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  entryMode === 'single'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Lançamento Simples
              </button>
              <button
                onClick={() => setEntryMode('batch')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  entryMode === 'batch'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Lançamento em Lote (Múltiplos)
              </button>
            </div>
            <button
              onClick={() => setShowEntryModal(false)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

      {/* SINGLE ENTRY FORM */}
      {entryMode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Field 1: Data */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Field 2: Marketplace */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Marketplace Canal *
              </label>
              <select
                required
                value={marketplaceId}
                onChange={(e) => setMarketplaceId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {availableMarketplaces.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: CNPJ */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Empresa / CNPJ *
              </label>
              <select
                required
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {availableCompanies.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 4: Nome / Descrição da Venda */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Descrição / Produto (Opcional)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Venda Diversos / Item Geral"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Field 6: Quantidade Vendida */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Quantidade Vendida *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Field 7: Valor Total */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={totalValue}
                onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Field 8: Valor Médio (Auto calculado) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Valor Médio Unitário (Calculado)
              </label>
              <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold">
                {formatCurrency(avgValue)} / un
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações do pedido, número do lote ou observações da expedição..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Lançamento & Atualizar Dashboard</span>
          </button>
        </form>
      ) : (
        /* BATCH ENTRY FORM */
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Tabela de Lançamento em Lote</span>
            <button
              type="button"
              onClick={addBatchRow}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Adicionar Linha
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="p-2">Data</th>
                  <th className="p-2">Marketplace</th>
                  <th className="p-2">CNPJ</th>
                  <th className="p-2">Produto / Descrição</th>
                  <th className="p-2 w-20">Qtde</th>
                  <th className="p-2 w-28">Valor Total (R$)</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchRows.map((row) => (
                  <tr key={row.id}>
                    <td className="p-1">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateBatchRow(row.id, 'date', e.target.value)}
                        className="w-full p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </td>
                    <td className="p-1">
                      <select
                        value={row.marketplaceId}
                        onChange={(e) => updateBatchRow(row.id, 'marketplaceId', e.target.value)}
                        className="w-full p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {availableMarketplaces.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1">
                      <select
                        value={row.companyId}
                        onChange={(e) => updateBatchRow(row.id, 'companyId', e.target.value)}
                        className="w-full p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {availableCompanies.map((c) => (
                          <option key={c.id} value={c.code}>{c.code}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="Nome do produto"
                        value={row.productName}
                        onChange={(e) => updateBatchRow(row.id, 'productName', e.target.value)}
                        className="w-full p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateBatchRow(row.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.totalValue || ''}
                        onChange={(e) => updateBatchRow(row.id, 'totalValue', parseFloat(e.target.value) || 0)}
                        className="w-full p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeBatchRow(row.id)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Gravar Todos os Lançamentos em Lote</span>
          </button>
        </form>
      )}
        </div>
        </div>
      )}
    </div>
  );
};
