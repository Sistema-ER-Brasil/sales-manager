import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayString, formatCurrency } from '../utils/formatters';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ImportView: React.FC = () => {
  const { importSalesData } = useApp();

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        // Normalize data
        const normalized = rawJson.map((row) => ({
          date: row.Data || row.date || getTodayString(),
          marketplaceId: (row.Marketplace || row.marketplace || 'shopee').toString().toLowerCase(),
          companyId: (row.CNPJ || row.company || 'ER2').toString().toUpperCase(),
          productName: row.Produto || row.product || row.Nome || 'Produto Importado Planilha',
          quantity: Number(row.Quantidade || row.quantity || row.Qtde) || 1,
          totalValue: Number(row.Valor || row.totalValue || row.Total) || 100,
          notes: row.Observações || 'Importado via Planilha Excel',
        }));

        setPreviewData(normalized);
      } catch (err) {
        alert('Erro ao ler a planilha. Certifique-se de ser um arquivo .xlsx ou .csv válido.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Simulate ERP Sync (Tiny ERP / IDWorks / Google Sheets)
  const handleSimulateErpSync = (erpName: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const mockErpSales = [
        {
          date: getTodayString(),
          marketplaceId: 'shopee',
          companyId: 'ER2',
          productName: `[${erpName} SYNC] Fone Bluetooth TWS Noise Cancelling`,
          quantity: 20,
          totalValue: 2798.00,
          notes: `Sincronizado automaticamente via API ${erpName}`,
        },
        {
          date: getTodayString(),
          marketplaceId: 'mercadolivre',
          companyId: 'MD',
          productName: `[${erpName} SYNC] Smartwatch Sport Fit AMOLED`,
          quantity: 15,
          totalValue: 4048.50,
          notes: `Sincronizado automaticamente via API ${erpName}`,
        },
        {
          date: getTodayString(),
          marketplaceId: 'amazon',
          companyId: 'Orange',
          productName: `[${erpName} SYNC] Mochila Executiva Impermeável`,
          quantity: 12,
          totalValue: 2038.80,
          notes: `Sincronizado automaticamente via API ${erpName}`,
        },
      ];

      setPreviewData(mockErpSales);
      setIsProcessing(false);
    }, 1200);
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    importSalesData(previewData);
    setSuccessMsg(`${previewData.length} registros de vendas importados com sucesso para a base do sistema!`);
    setPreviewData([]);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Importação Manual de Vendas via Planilha
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Importe dados de vendas em lote através de arquivos Excel (.xlsx) ou CSV preenchidos pelos usuários.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Drag and Drop */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Importar Planilha Excel (.xlsx / .csv)</h3>
            <p className="text-[11px] text-slate-400 my-2">Arraste um arquivo de vendas ou clique para selecionar</p>
            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer inline-block transition-colors">
              Selecionar Arquivo
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Manual Instructions Card */}
          <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Formato Recomendado da Planilha
            </span>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4 pt-1">
              <li><strong>Data:</strong> YYYY-MM-DD ou DD/MM/YYYY</li>
              <li><strong>Marketplace:</strong> shopee, mercadolivre, amazon, etc.</li>
              <li><strong>CNPJ / Empresa:</strong> Código do CNPJ (ex: ER2, MD)</li>
              <li><strong>Quantidade & Valor:</strong> Valores numéricos de vendas</li>
              <li>Inserção 100% manual por planilha ou formulário direto.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PREVIEW TABLE */}
      {previewData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
              Pré-Visualização dos Dados Importados ({previewData.length} registros)
            </span>

            <button
              onClick={handleConfirmImport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirmar & Gravar Vendas
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Marketplace</th>
                  <th className="p-2.5">CNPJ</th>
                  <th className="p-2.5">Produto</th>
                  <th className="p-2.5 text-center">Qtde</th>
                  <th className="p-2.5 text-right">Valor Total</th>
                  <th className="p-2.5">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-medium">{row.date}</td>
                    <td className="p-2.5 font-bold uppercase">{row.marketplaceId}</td>
                    <td className="p-2.5 font-bold text-blue-600">{row.companyId}</td>
                    <td className="p-2.5">{row.productName}</td>
                    <td className="p-2.5 text-center font-bold">{row.quantity} un</td>
                    <td className="p-2.5 text-right font-black text-emerald-600">{formatCurrency(row.totalValue)}</td>
                    <td className="p-2.5 text-slate-400 truncate max-w-xs">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
