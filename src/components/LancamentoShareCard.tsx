import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { exportElementToJpeg } from '../utils/exportUtils';

interface LancamentoShareCardProps {
  companyLabel: string;
  marketplaceLabel: string;
  marketplaceColor?: string;
  date: string;
  quantity: number;
  totalValue: number;
}

export const LancamentoShareCard: React.FC<LancamentoShareCardProps> = ({
  companyLabel,
  marketplaceLabel,
  marketplaceColor,
  date,
  quantity,
  totalValue,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const slug =
        companyLabel
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'lancamento';
      await exportElementToJpeg(cardRef.current, `lancamento-${slug}-${date}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Cartão de Lançamento (WhatsApp)
        </h3>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          title="Baixar cartão de lançamento em JPG"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
          <span>{isExporting ? 'Gerando...' : 'Baixar JPG'}</span>
        </button>
      </div>

      <div
        ref={cardRef}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 max-w-sm mx-auto sm:mx-0"
      >
        <div className="p-5 border-b-2 border-blue-600">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">
            Lançamento de Venda
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 truncate" title={companyLabel}>
            {companyLabel}
          </div>
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: marketplaceColor || '#2563eb' }}
            />
            {marketplaceLabel}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          <div className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Data</div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatDateBR(date)}
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Quantidade</div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
              {quantity} un
            </div>
          </div>
          <div className="p-4 text-center bg-blue-50 dark:bg-blue-950/30">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">
              Valor
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
