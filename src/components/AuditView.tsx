import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTimeBR } from '../utils/formatters';
import { ShieldCheck, Search, ShieldAlert, Target, ShoppingBag, Users, Clock, Filter, Activity } from 'lucide-react';

export const AuditView: React.FC = () => {
  const { auditLogs, currentUser } = useApp();
  const isAdmin = currentUser.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-blue-800 mx-auto" />
        <h2 className="text-lg font-bold">Acesso Restrito</h2>
        <p className="text-xs text-slate-500">Apenas Administradores podem visualizar os Logs e Trilha de Auditoria do sistema.</p>
      </div>
    );
  }

  // Filter logs by selected entity category and search term
  const filteredLogs = auditLogs.filter((log) => {
    // Entity filter
    if (selectedEntity !== 'all') {
      if (selectedEntity === 'goals' && log.entity !== 'goals') return false;
      if (selectedEntity === 'sales' && log.entity !== 'sales') return false;
      if (selectedEntity === 'users' && log.entity !== 'users') return false;
    }

    // Search term filter
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      log.ip.includes(q)
    );
  });

  const goalsLogsCount = auditLogs.filter((l) => l.entity === 'goals').length;
  const salesLogsCount = auditLogs.filter((l) => l.entity === 'sales').length;
  const usersLogsCount = auditLogs.filter((l) => l.entity === 'users').length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Auditoria & Trilha de Registros
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                {auditLogs.length} Registros Gravados
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Histórico automático e auditável de alterações em Metas, Vendas, Usuários e Configurações por administradores.
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por usuário, IP, ação ou detalhe..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Category Tabs & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSelectedEntity('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEntity === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Todos os Logs ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setSelectedEntity('goals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEntity === 'goals'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 Alterações de Metas ({goalsLogsCount})</span>
          </button>

          <button
            onClick={() => setSelectedEntity('sales')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEntity === 'sales'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>🛒 Registros de Vendas ({salesLogsCount})</span>
          </button>

          <button
            onClick={() => setSelectedEntity('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEntity === 'users'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👥 Usuários & Acessos ({usersLogsCount})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Exibindo <strong>{filteredLogs.length}</strong> registro(s)</span>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Usuário / Responsável</th>
                <th className="p-3.5 text-center">Ação</th>
                <th className="p-3.5">Módulo</th>
                <th className="p-3.5">Detalhes da Alteração</th>
                <th className="p-3.5 text-right">Origem / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-medium text-slate-700 dark:text-slate-300">
              {filteredLogs.map((log) => {
                let entityBadge = (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase">
                    {log.entity}
                  </span>
                );

                if (log.entity === 'goals') {
                  entityBadge = (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase flex items-center gap-1 w-fit">
                      <Target className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      Metas
                    </span>
                  );
                } else if (log.entity === 'sales') {
                  entityBadge = (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase flex items-center gap-1 w-fit">
                      <ShoppingBag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      Vendas
                    </span>
                  );
                } else if (log.entity === 'users') {
                  entityBadge = (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-950 uppercase flex items-center gap-1 w-fit">
                      <Users className="w-3 h-3 text-blue-900 dark:text-blue-400" />
                      Usuários
                    </span>
                  );
                }

                let actionBadge = (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase">
                    {log.action}
                  </span>
                );

                if (log.action === 'CREATE') {
                  actionBadge = (
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                      Criação
                    </span>
                  );
                } else if (log.action === 'DELETE') {
                  actionBadge = (
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 uppercase">
                      Exclusão
                    </span>
                  );
                } else if (log.action === 'UPDATE') {
                  actionBadge = (
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-300 uppercase">
                      Edição
                    </span>
                  );
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTimeBR(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">{actionBadge}</td>
                    <td className="p-3.5 whitespace-nowrap">{entityBadge}</td>
                    <td className="p-3.5 text-slate-800 dark:text-slate-200 font-semibold">{log.details}</td>
                    <td className="p-3.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {log.ip}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-normal">
                    Nenhum registro de auditoria encontrado para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

