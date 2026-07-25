import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Sun,
  Moon,
  User,
  ShieldCheck,
  Check,
  Trash2,
  X,
  LogOut,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import { formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { ChangePasswordModal } from './ChangePasswordModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAuthModalOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, setIsAuthModalOpen }) => {
  const { currentUser, logout, settings, updateSettings, notifications, markNotificationRead, clearAllNotifications } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="px-3 sm:px-5 py-2 flex items-center justify-between">
        {/* Left: Page Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 capitalize tracking-tight">
            {activeTab === 'dashboard' && 'Dashboard Principal & Executivo'}
            {activeTab === 'operations' && 'Painel de Operações (Expedição / TV)'}
            {activeTab === 'entry' && 'Lançamento de Vendas'}
            {activeTab === 'history' && 'Histórico de Vendas'}
            {activeTab === 'cadastros' && 'Cadastro de CNPJs & Marketplaces'}
            {activeTab === 'goals' && 'Gestão de Metas'}
            {activeTab === 'status-lancamento' && 'Status de Lançamento por Usuário'}
            {activeTab === 'reports' && 'Relatórios & Matriz Consolidada'}
            {activeTab === 'rankings' && 'Rankings de Desempenho'}
            {activeTab === 'import' && 'Importação de Dados'}
            {activeTab === 'audit' && 'Trilha de Auditoria & Logs'}
            {activeTab === 'users' && 'Gestão de Usuários e Permissões'}
            {activeTab === 'settings' && 'Configurações do Sistema'}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Alternar Tema Claro / Escuro"
          >
            {settings.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Notificações em Tempo Real</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Limpar
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">Nenhuma notificação recente.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                          !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTimeBR(n.createdAt)}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-1.5">{n.message}</p>
                        {!n.read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> Marcar como lida
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Quick Login Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {currentUser.name}
                  {currentUser.role === 'admin' && (
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {currentUser.role === 'admin' ? 'Acesso Total' : `${currentUser.assignedMarketplaces.length} Mktplaces`}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Trocar Minha Senha
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 font-extrabold hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" /> Sair do Sistema (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};
