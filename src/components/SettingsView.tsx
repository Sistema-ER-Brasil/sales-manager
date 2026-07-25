import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Volume2, VolumeX, Database, Key, Trash2, RotateCcw, ShieldCheck, LogOut } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentUser, sales, clearSampleData, restoreSampleData, logout } = useApp();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [dataActionMessage, setDataActionMessage] = useState('');

  const handleClear = () => {
    clearSampleData();
    setShowConfirmClear(false);
    setDataActionMessage('Base zerada com sucesso! O sistema está pronto para receber suas vendas reais.');
    setTimeout(() => setDataActionMessage(''), 4000);
  };

  const handleRestore = () => {
    restoreSampleData();
    setShowConfirmRestore(false);
    setDataActionMessage('Dados de demonstração restaurados.');
    setTimeout(() => setDataActionMessage(''), 4000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Configurações Gerais & Banco de Dados
          </h2>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[11px] rounded-full flex items-center gap-1">
          <Database className="w-3.5 h-3.5" /> Supabase Online
        </span>
      </div>

      {dataActionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl font-bold text-xs animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{dataActionMessage}</span>
        </div>
      )}

      {/* Sound Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">Sons & Notificações Operacionais</h3>
          <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
            <div className="flex items-center gap-2">
              {settings.soundEffectsEnabled ? <Volume2 className="w-5 h-5 text-emerald-500" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              <div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Efeitos Sonoros de Vendas</div>
                <div className="text-[11px] text-slate-500">Reproduzir áudio quando uma nova venda for lançada</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffectsEnabled}
              onChange={(e) => updateSettings({ soundEffectsEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>

        {/* Real Production Data & Base Management */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Modo de Produção & Dados Reais</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Atualmente existem <strong className="text-blue-600 dark:text-blue-400">{sales.length} registros</strong> de vendas salvos no banco.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl space-y-2">
              <div className="font-bold text-xs text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" /> Zerar Base para Dados Reais
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Remove os registros fictícios/demonstrativos para você operar 100% com dados reais da sua empresa.
              </p>
              {showConfirmClear ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg cursor-pointer"
                  >
                    Confirmar Zerar Dados
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Zerar Registros Fictícios
                </button>
              )}
            </div>

            <div className="p-4 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl space-y-2">
              <div className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600" /> Restaurar Dados de Demonstração
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                Recarrega a base inicial de dados fictícios para testes e simulação de relatórios.
              </p>
              {showConfirmRestore ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRestore}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg cursor-pointer"
                  >
                    Confirmar Restauração
                  </button>
                  <button
                    onClick={() => setShowConfirmRestore(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmRestore(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Restaurar Demonstração
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Environment Variables Documentation */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-800" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Variáveis de Ambiente do Sistema</h3>
          </div>
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-2 overflow-x-auto border border-slate-800">
            <div className="text-slate-400 font-sans font-bold mb-1">Arquivo `.env.local` / `.env.example` ativo:</div>
            <div className="text-emerald-400">GEMINI_API_KEY="SUA_CHAVE_GEMINI_API"</div>
            <div className="text-blue-400">VITE_SUPABASE_URL="https://seu-projeto.supabase.co"</div>
            <div className="text-blue-400">VITE_SUPABASE_ANON_KEY="sua-chave-anon"</div>
            <div className="text-rose-400">SUPABASE_SERVICE_ROLE_KEY="apenas-no-servidor"</div>
          </div>
        </div>

        {/* System Info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-800 dark:text-slate-200">Informações da Sessão Ativa</div>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair do Sistema
            </button>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
            <div>Usuário Conectado: <strong>{currentUser.name} ({currentUser.email})</strong></div>
            <div>Nível de Acesso: <strong className="uppercase">{currentUser.role}</strong></div>
            <div>Banco de Dados: <strong>Supabase Postgres (Ativo & Sincronizado)</strong></div>
            <div>Ambiente: <strong>Vercel Full-Stack</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
