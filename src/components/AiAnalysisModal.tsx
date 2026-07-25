import React from 'react';
import { Bot, X, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: string;
  loading: boolean;
  onRefresh: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  insight,
  loading,
  onRefresh,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(insight);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                IA Analista de Vendas de Marketplaces
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">Resumo Executivo Gerado em Tempo Real</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Sintetizando dados de todos os CNPJs e Marketplaces...
              </p>
            </div>
          ) : (
            <div className="prose dark:prose-invert prose-xs max-w-none text-slate-800 dark:text-slate-200 space-y-3 whitespace-pre-wrap leading-relaxed">
              {insight}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            disabled={loading || !insight}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Análise'}
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regerar Análise</span>
          </button>
        </div>
      </div>
    </div>
  );
};
