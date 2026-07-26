import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Calendar, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingBag, 
  DollarSign,
  Search,
  Store,
  PlusCircle,
  Eye,
  BellRing
} from 'lucide-react';
import { formatCurrency, formatNumber, getTodayString } from '../utils/formatters';

export const UserSalesStatusView: React.FC = () => {
  const {
    users,
    sales,
    marketplaces,
    setActiveTab,
    currentUser,
    setHistoryUserFilter,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DONE' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [reminderSent, setReminderSent] = useState<{ [key: string]: boolean }>({});

  // Filter active users
  const activeUsers = users.filter((u: any) => u.status === 'active' || u.status === undefined);

  // Helper to get sales for a specific user and date
  const getUserSalesForDate = (userId: string, date: string) => {
    return sales.filter((s: any) => {
      // Check date match
      const sameDate = s.date === date;
      // Check user match (by createdByUserId or createdByName)
      const userObj = users.find((u: any) => u.id === userId);
      const sameUser = s.createdByUserId === userId || (userObj && s.createdByName === userObj.name);
      return sameDate && sameUser;
    });
  };

  // Compute status for all active users
  const userStatusData = activeUsers.map((u: any) => {
    const userSales = getUserSalesForDate(u.id, selectedDate);
    const hasLogged = userSales.length > 0;
    const totalAmount = userSales.reduce((acc: number, s: any) => acc + (s.totalValue || 0), 0);
    const totalQty = userSales.reduce((acc: number, s: any) => acc + (s.quantity || 0), 0);
    
    // Last sales entry timestamp/time
    let lastTime = '--:--';
    if (hasLogged) {
      const sorted = [...userSales].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (sorted[0]?.createdAt) {
        try {
          const d = new Date(sorted[0].createdAt);
          lastTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch {
          lastTime = 'Hoje';
        }
      }
    }

    // Marketplaces logged vs assigned
    const loggedMarketplaceIds = Array.from(new Set(userSales.map((s: any) => s.marketplaceId)));
    
    return {
      user: u,
      hasLogged,
      salesCount: userSales.length,
      totalAmount,
      totalQty,
      lastTime,
      loggedMarketplaceIds,
      salesList: userSales,
    };
  });

  // Filtered list
  const filteredUsers = userStatusData.filter((item: any) => {
    if (filterStatus === 'DONE' && !item.hasLogged) return false;
    if (filterStatus === 'PENDING' && item.hasLogged) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = item.user.name.toLowerCase().includes(term);
      const matchEmail = item.user.email.toLowerCase().includes(term);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  // Global counts
  const totalCount = activeUsers.length;
  const loggedCount = userStatusData.filter((d: any) => d.hasLogged).length;
  const pendingCount = totalCount - loggedCount;
  const completionRate = totalCount > 0 ? Math.round((loggedCount / totalCount) * 100) : 0;

  const totalLoggedVolume = userStatusData.reduce((acc: number, d: any) => acc + d.totalAmount, 0);

  const handleSendReminder = (userName: string, userId: string) => {
    setReminderSent((prev) => ({ ...prev, [userId]: true }));
    setTimeout(() => {
      setReminderSent((prev) => ({ ...prev, [userId]: false }));
    }, 4000);
  };

  // If current user is not admin, show their personal daily filling status page
  if (currentUser.role !== 'admin') {
    const userSales = getUserSalesForDate(currentUser.id, selectedDate);
    const hasLogged = userSales.length > 0;
    const totalAmount = userSales.reduce((acc: number, s: any) => acc + (s.totalValue || 0), 0);
    const loggedMarketplaceIds = Array.from(new Set(userSales.map((s: any) => s.marketplaceId)));

    const assigned = currentUser.assignedMarketplaces || [];
    const pendingMarketplaces = assigned.filter((mId: string) => !loggedMarketplaceIds.includes(mId));
    const isAllFilled = assigned.length > 0 && pendingMarketplaces.length === 0;

    return (
      <div className="p-3 sm:p-5 space-y-4 max-w-4xl mx-auto">
        {/* Personal Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                {currentUser.name[0]}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  Meu Status de Lançamento Diário
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acompanhe o preenchimento das suas vendas de hoje nos canais designados.
                </p>
              </div>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Data:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-0.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* User Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isAllFilled
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-950 text-blue-950 dark:text-blue-200 animate-pulse'
            }`}
          >
            <div className="flex items-center gap-3">
              {isAllFilled ? (
                <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-blue-900 dark:text-blue-400 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-sm uppercase">
                  {isAllFilled ? ' Preenchimento Completo' : ` Vendas Pendentes (${pendingMarketplaces.length} canal)`}
                </div>
                <div className="text-xs mt-0.5 opacity-90">
                  {isAllFilled
                    ? 'Todas as vendas do dia foram informadas com sucesso.'
                    : `Ainda faltam lançar as vendas de hoje (${selectedDate}) para: ${pendingMarketplaces.join(', ')}.`}
                </div>
              </div>
            </div>

            {!isAllFilled && (
              <button
                onClick={() => setActiveTab('entry')}
                className="px-3 py-1.5 text-xs font-extrabold bg-blue-900 hover:bg-blue-900 text-white rounded-lg shadow-2xs transition-all shrink-0"
              >
                Lançar Vendas Agora
              </button>
            )}
          </div>

          {/* Channels Grid */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Seus Marketplaces Designados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assigned.map((mId: string) => {
                const mObj = marketplaces.find((m: any) => m.id === mId || m.slug === mId);
                const mSales = userSales.filter((s: any) => s.marketplaceId === mId || s.marketplaceId === mObj?.slug);
                const isLogged = mSales.length > 0;
                const mTotal = mSales.reduce((acc: number, s: any) => acc + (s.totalValue || 0), 0);

                return (
                  <div
                    key={mId}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isLogged
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                        : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-950/50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase">
                        {mObj ? mObj.name : mId}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isLogged ? `${mSales.length} registro(s) • Total: ${formatCurrency(mTotal)}` : 'Pendente de preenchimento hoje'}
                      </div>
                    </div>

                    <div>
                      {isLogged ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase">
                           Lançado
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveTab('entry')}
                          className="text-[10px] font-extrabold px-2 py-1 rounded bg-blue-900 text-white hover:bg-blue-900 uppercase transition-all"
                        >
                          Lançar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                Status de Lançamento por Usuário
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitore em tempo real quais vendedores já registraram as vendas do dia e quais estão pendentes.
              </p>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Data de Análise:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-0.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            {selectedDate === getTodayString() && (
              <span className="text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase">
                Hoje
              </span>
            )}
          </div>
        </div>

        {/* Metrics Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-500">Total Vendedores</div>
            <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {totalCount} <span className="text-xs font-normal text-slate-500">usuários</span>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-900/40">
            <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 flex items-center justify-between">
              <span>Lançaram Venda</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-black text-blue-700 dark:text-blue-400 mt-0.5">
              {loggedCount} <span className="text-xs font-bold">({completionRate}%)</span>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-950/40">
            <div className="text-[10px] font-bold uppercase text-blue-900 dark:text-blue-400 flex items-center justify-between">
              <span>Pendentes / Não Lançaram</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-black text-blue-900 dark:text-blue-400 mt-0.5">
              {pendingCount} <span className="text-xs font-bold">({100 - completionRate}%)</span>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-900/40">
            <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400">
              Volume Faturado Lançado
            </div>
            <div className="text-base font-black text-blue-700 dark:text-blue-400 mt-0.5 truncate">
              {formatCurrency(totalLoggedVolume)}
            </div>
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus('DONE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                filterStatus === 'DONE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Lançaram ({loggedCount})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                filterStatus === 'PENDING'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              <XCircle className="w-3 h-3" /> Pendentes ({pendingCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Buscar por nome do usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 w-52 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Card for Each User */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3.5">
        {filteredUsers.map((item: any) => {
          const u = item.user;
          const isDone = item.hasLogged;

          return (
            <div
              key={u.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-2xs space-y-3 transition-all relative overflow-hidden ${
                isDone
                  ? 'border-blue-200 dark:border-blue-900/50 hover:border-blue-400'
                  : 'border-blue-200 dark:border-blue-950/50 hover:border-blue-400'
              }`}
            >
              {/* Status Indicator Bar on Left */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isDone ? 'bg-blue-500' : 'bg-blue-800'
                }`}
              />

              {/* User Header Info & Badge */}
              <div className="flex items-start justify-between pl-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                      isDone
                        ? 'bg-gradient-to-tr from-blue-600 to-blue-500'
                        : 'bg-gradient-to-tr from-blue-800 to-blue-800'
                    }`}
                  >
                    {u.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{u.name}</h3>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                          u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {u.role === 'admin' ? 'Admin' : 'Vendedor'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{u.email}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Lançado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-950 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/50 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" />
                      Não Lançou
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned Marketplaces list */}
              <div className="pl-1 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Store className="w-3 h-3 text-blue-500" /> Canais Sob Responsabilidade:
                </span>
                <div className="flex flex-wrap gap-1">
                  {u.role === 'admin' ? (
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold italic">
                      Todos os canais liberados
                    </span>
                  ) : u.assignedMarketplaces && u.assignedMarketplaces.length > 0 ? (
                    u.assignedMarketplaces.map((mId: string) => {
                      const mObj = marketplaces.find((m: any) => m.id === mId || m.slug === mId);
                      const isChannelLogged = item.loggedMarketplaceIds.includes(mId);
                      return (
                        <span
                          key={mId}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isChannelLogged
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 text-blue-800 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {mObj ? mObj.name : mId} {isChannelLogged && ''}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-slate-400">Nenhum canal específico</span>
                  )}
                </div>
              </div>

              {/* Data Summary if Logged vs Warning if Pending */}
              {isDone ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-2 text-center ml-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lançado</span>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Registros</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {item.salesCount} vendas ({item.totalQty} un)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Último Reg.</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {item.lastTime}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200/80 dark:border-blue-950/60 text-xs text-blue-950 dark:text-blue-300 flex items-center justify-between ml-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-900 dark:text-blue-400 shrink-0" />
                    <div>
                      <p className="font-bold leading-tight">Nenhuma venda lançada nesta data</p>
                      <p className="text-[10px] text-blue-900 dark:text-blue-400 mt-0.5">
                        Aguardando atualização de faturamento pelo operador.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between pl-1">
                {isDone ? (
                  <button
                    onClick={() => {
                      setHistoryUserFilter(u.id);
                      setActiveTab('history');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver vendas de {u.name.split(' ')[0]}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendReminder(u.name, u.id)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-900 hover:bg-blue-900 text-white flex items-center gap-1 shadow-2xs transition-all"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    {reminderSent[u.id] ? 'Lembrete Enviado!' : 'Notificar Vendedor'}
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('entry')}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                  Lançar Venda
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Matrix by User and Marketplace */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Matriz de Cobertura por Usuário e Marketplace ({selectedDate})
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Cruzamento individual de canais</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-extrabold bg-slate-50 dark:bg-slate-800/50">
                <th className="p-2.5">Vendedor / Operador</th>
                <th className="p-2.5">Status Geral</th>
                <th className="p-2.5">Marketplaces Lançados</th>
                <th className="p-2.5 text-right">Total R$</th>
                <th className="p-2.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {userStatusData.map((d: any) => {
                const u = d.user;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                        {u.name[0]}
                      </span>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-2.5">
                      {d.hasLogged ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                           LANÇADO ({d.salesCount})
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-300">
                           NÃO LANÇOU
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      {d.hasLogged ? (
                        <div className="flex flex-wrap gap-1">
                          {d.loggedMarketplaceIds.map((mId: string) => (
                            <span key={mId} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase">
                              {mId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Nenhum canal registrado</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(d.totalAmount)}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => setActiveTab('entry')}
                        className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100"
                      >
                        Lançar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
