import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Volume2, VolumeX, Database, Key, Trash2, RotateCcw, ShieldCheck, LogOut, Camera, Loader2, KeyRound, Check } from 'lucide-react';
import { uploadLogoImage } from '../lib/upload';
import { ChangePasswordModal } from './ChangePasswordModal';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentUser, updateUser, getAccessToken, sales, clearSampleData, restoreSampleData, logout } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [dataActionMessage, setDataActionMessage] = useState('');

  // Self-service profile state (non-admin view)
  const [profileName, setProfileName] = useState(currentUser.name);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSavedMsg, setNameSavedMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError('');
    const result = await uploadLogoImage(file, `avatars/${currentUser.id}`, getAccessToken);
    setAvatarUploading(false);
    if (result.error) {
      setAvatarError(result.error);
      return;
    }
    await updateUser({ ...currentUser, avatar: result.url });
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || profileName.trim() === currentUser.name) return;
    setNameSaving(true);
    const result = await updateUser({ ...currentUser, name: profileName.trim() });
    setNameSaving(false);
    if (result.success) {
      setNameSavedMsg('Nome atualizado!');
      setTimeout(() => setNameSavedMsg(''), 3000);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Meu Perfil
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{avatarUploading ? 'Enviando...' : 'Trocar Foto'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </label>
              {avatarError && <p className="text-blue-600 text-[11px] font-semibold mt-1">{avatarError}</p>}
            </div>
          </div>

          {/* Name */}
          <form onSubmit={handleSaveName} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="flex-1 p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={nameSaving || !profileName.trim() || profileName.trim() === currentUser.name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors"
              >
                {nameSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {nameSavedMsg && (
              <p className="text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {nameSavedMsg}
              </p>
            )}
            <p className="text-[11px] text-slate-400">{currentUser.email}</p>
          </form>

          {/* Password */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setChangePasswordModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> Alterar Minha Senha
            </button>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={logout}
              className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair do Sistema
            </button>
          </div>
        </div>

        <ChangePasswordModal
          isOpen={changePasswordModalOpen}
          onClose={() => setChangePasswordModalOpen(false)}
          targetUser={null}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Configurações Gerais & Banco de Dados
          </h2>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-[11px] rounded-full flex items-center gap-1">
          <Database className="w-3.5 h-3.5" /> Supabase Online
        </span>
      </div>

      {dataActionMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-2xl font-bold text-xs animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>{dataActionMessage}</span>
        </div>
      )}

      {/* Sound Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">Sons & Notificações Operacionais</h3>
          <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
            <div className="flex items-center gap-2">
              {settings.soundEffectsEnabled ? <Volume2 className="w-5 h-5 text-blue-500" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
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
            <div className="p-4 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl space-y-2">
              <div className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-blue-600" /> Zerar Base para Dados Reais
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                Remove os registros fictícios/demonstrativos para você operar 100% com dados reais da sua empresa.
              </p>
              {showConfirmClear ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg cursor-pointer"
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
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
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
            <div className="text-blue-400">GEMINI_API_KEY="SUA_CHAVE_GEMINI_API"</div>
            <div className="text-blue-400">VITE_SUPABASE_URL="https://seu-projeto.supabase.co"</div>
            <div className="text-blue-400">VITE_SUPABASE_ANON_KEY="sua-chave-anon"</div>
            <div className="text-blue-400">SUPABASE_SERVICE_ROLE_KEY="apenas-no-servidor"</div>
          </div>
        </div>

        {/* System Info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-800 dark:text-slate-200">Informações da Sessão Ativa</div>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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
