import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateBR, getTodayString } from '../utils/formatters';
import { exportElementToJpeg } from '../utils/exportUtils';

export interface LoteCardItem {
  id: string;
  date: string;
  companyLabel: string;
  marketplaceLabel: string;
  marketplaceColor?: string;
  quantity: number;
  totalValue: number;
}

interface LancamentosLoteCardProps {
  items: LoteCardItem[];
}

export const LancamentosLoteCard: React.FC<LancamentosLoteCardProps> = ({ items }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalValue = items.reduce((acc, it) => acc + it.totalValue, 0);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await exportElementToJpeg(cardRef.current, `lancamentos-selecionados-${items.length}-${getTodayString()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Cartão de Lançamentos Selecionados (WhatsApp)
        </h3>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting || items.length === 0}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          title="Baixar cartão de lançamentos em JPG"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
          <span>{isExporting ? 'Gerando...' : 'Baixar JPG'}</span>
        </button>
      </div>

      <div
        ref={cardRef}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 max-w-md mx-auto sm:mx-0"
      >
        <div className="p-5 border-b-2 border-blue-600">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">
            Lançamentos Selecionados
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100">
            {items.length} {items.length === 1 ? 'venda' : 'vendas'}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
          {items.map((it) => (
            <div key={it.id} className="p-3 flex items-center gap-3">
              <div className="w-16 shrink-0 text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                {formatDateBR(it.date)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={it.companyLabel}>
                  {it.companyLabel}
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: it.marketplaceColor || '#2563eb' }}
                  />
                  {it.marketplaceLabel}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                  {it.quantity} un
                </div>
                <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatCurrency(it.totalValue)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 divide-x divide-blue-500/30 bg-blue-50 dark:bg-blue-950/30">
          <div className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">
              Total Quantidade
            </div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
              {totalQuantity} un
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">
              Total Valor
            </div>
            <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
              {formatCurrency(totalValue)}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        A imagem sai em fundo claro, pronta para enviar pelo WhatsApp.
      </p>
    </div>
  );
};
