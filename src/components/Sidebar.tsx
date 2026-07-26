import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Building2,
  Target,
  BarChart3,
  Trophy,
  Upload,
  ListChecks,
  Settings,
  UserCheck,
  Store,
  Boxes,
  LogOut,
} from 'lucide-react';
import { getPermissions, Permissions } from '../lib/permissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useApp();
  const perms = getPermissions(currentUser.role);
  const isAdmin = perms.registerSalesUnrestricted;

  const menuGroups = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'rankings', label: 'Ranking', icon: Trophy },
        { id: 'goals', label: 'Metas', icon: Target },
      ],
    },
    {
      title: 'Gestão Operacional',
      items: [
        { id: 'entry', label: 'Registrar Vendas', icon: PlusCircle, require: 'registerSales' as keyof Permissions },
        { id: 'reports', label: 'Relatórios & Matriz', icon: BarChart3 },
        { id: 'status-lancamento', label: 'Status Lançamento', icon: UserCheck, badge: 'NOVO', badgeColor: 'bg-blue-500 text-white', require: 'viewTeamStatus' as keyof Permissions },
        { id: 'tasks', label: 'Tarefas', icon: ListChecks, badge: 'NOVO', badgeColor: 'bg-blue-500 text-white' },
      ],
    },
    {
      title: 'Administração & Dados',
      items: [
        { id: 'import', label: 'Importação', icon: Upload },
        { id: 'cadastros', label: 'Cadastros (CNPJs & Mkt)', icon: Building2, require: 'manageCadastros' as keyof Permissions },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 z-40 border-r border-slate-800 transition-all select-none shrink-0">
      {/* Brand Header */}
      <div className="p-3 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-xs shadow-blue-500/20 shrink-0">
          MS
        </div>
        <div className="truncate">
          <h2 className="font-bold text-xs text-white tracking-tight leading-none">Marketplace</h2>
          <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Sales Manager</span>
        </div>
      </div>

      {/* Current User Restricted Access Banner */}
      {!isAdmin && (
        <div className="mx-2.5 my-2 p-2 bg-blue-950/60 border border-blue-800/40 rounded-md text-[11px]">
          <div className="text-blue-300 font-semibold flex items-center gap-1 mb-0.5 text-[10px]">
            <Store className="w-3 h-3 text-blue-400" />
            <span>Mercados Liberados:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentUser.assignedMarketplaces.map((m) => (
              <span key={m} className="bg-blue-900/80 text-blue-200 text-[9px] px-1 py-0.2 rounded uppercase font-bold">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="px-2.5 text-[9px] uppercase tracking-wider font-extrabold text-slate-500 my-1">
              {group.title}
            </div>

            {group.items.map((item) => {
              if (item.require && !perms[item.require]) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-2.5 border-t border-slate-800 space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/50 text-blue-300 rounded-md text-[11px] font-bold transition-all cursor-pointer"
          title="Encerrar sessão e sair do sistema"
        >
          <LogOut className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Sair do Sistema</span>
        </button>

        <div className="text-[10px] text-slate-500 flex flex-col gap-1 pt-1">
          <span className="text-blue-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-ping"></span>
            Conectado
          </span>
          <span className="truncate">Desenvolvido Por Alisson Cordeiro</span>
        </div>
      </div>
    </aside>
  );
};
