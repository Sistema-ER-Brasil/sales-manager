import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayString, formatCurrency } from '../utils/formatters';
import { AlertTriangle, CheckCircle2, ChevronUp, Store, PlusCircle, ArrowRight, UserCheck } from 'lucide-react';

export const FloatingSalesStatusWidget: React.FC = () => {
  const { currentUser, sales, marketplaces, users, setActiveTab, activeTab } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  if (activeTab === 'operations') return null;

  const todayStr = getTodayString();
  const isAdmin = currentUser.role === 'admin';

  if (!isAdmin) {
    const userTodaySales = sales.filter((s) => {
      const isToday = s.date === todayStr;
      const isUser = s.createdByUserId === currentUser.id || s.createdByName === currentUser.name;
      return isToday && isUser;
    });

    const userLoggedMarketplaceIds = Array.from(new Set(userTodaySales.map((s) => s.marketplaceId)));
    const userAssigned = currentUser.assignedMarketplaces || [];

    const marketplaceDetails = userAssigned.map((mId) => {
      const mObj = marketplaces.find((m) => m.id === mId || m.slug === mId);
      const isLogged = userLoggedMarketplaceIds.some((id) => id === mId || (mObj && id === mObj.slug));
      const mSales = userTodaySales.filter((s) => s.marketplaceId === mId || (mObj && s.marketplaceId === mObj.slug));
      const totalVal = mSales.reduce((acc, s) => acc + s.totalValue, 0);

      return {
        id: mId,
        name: mObj ? mObj.name : mId,
        isLogged,
        totalVal,
        salesCount: mSales.length,
      };
    });

    const pendingMarketplaces = marketplaceDetails.filter((m) => !m.isLogged);
    const isFullyFilled = marketplaceDetails.length > 0 && pendingMarketplaces.length === 0;

    return (
      <div className="fixed bottom-5 right-5 z-50 font-sans flex flex-col items-end gap-2">
        {/* Expanded Details Card Popover */}
        {isExpanded && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xl w-72 sm:w-80 space-y-2.5 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                  Status de Hoje ({todayStr})
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1"
              >
                
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {marketplaceDetails.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                    m.isLogged
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-100'
                      : 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-950/60 text-blue-950 dark:text-blue-100'
                  }`}
                >
                  <div>
                    <span className="font-bold block uppercase text-[11px]">{m.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {m.isLogged ? `${m.salesCount} venda(s) • ${formatCurrency(m.totalVal)}` : ' Venda não registrada'}
                    </span>
                  </div>

                  <div>
                    {m.isLogged ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100 uppercase">
                         OK
                      </span>
                    ) : (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-900 text-white uppercase animate-pulse">
                        ⏱ Falta
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1">
              <button
                onClick={() => {
                  setActiveTab('entry');
                  setIsExpanded(false);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                {isFullyFilled ? 'Lançar Mais Vendas' : 'Lançar Vendas Agora'}
              </button>
            </div>
          </div>
        )}

        {/* Small Blinking Square Button */}
        <div className="relative group">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-12 h-12 rounded-xl shadow-xl border flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
              isFullyFilled
                ? 'bg-blue-600 border-blue-400 text-white shadow-blue-600/30'
                : 'bg-blue-800 border-blue-300 text-white shadow-blue-800/40 animate-pulse'
            }`}
            title={isFullyFilled ? 'Vendas do dia preenchidas (Clique para ver detalhes)' : 'Atenção: Vendas pendentes para hoje! Clique para ver'}
          >
            {isFullyFilled ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            )}

            {/* Notification Badge Count */}
            {!isFullyFilled && pendingMarketplaces.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-pulse">
                {pendingMarketplaces.length}
              </span>
            )}
          </button>

          {/* Hover Tooltip */}
          <div className="absolute right-14 bottom-1/2 translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none z-50">
            {isFullyFilled ? (
              <span> Vendas de hoje 100% lançadas</span>
            ) : (
              <span> {pendingMarketplaces.length} canal(is) pendente(s) hoje</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin User
  const activeSellers = users.filter((u) => u.status === 'active' || u.status === undefined);
  const loggedSellersCount = activeSellers.filter((u) => {
    return sales.some(
      (s) => s.date === todayStr && (s.createdByUserId === u.id || s.createdByName === u.name)
    );
  }).length;
  const pendingSellersCount = activeSellers.length - loggedSellersCount;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans flex flex-col items-end gap-2">
      {isExpanded && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xl w-72 sm:w-80 space-y-2.5 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                Lançamentos Hoje ({todayStr})
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1"
            >
              
            </button>
          </div>

          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {loggedSellersCount} de {activeSellers.length} vendedores já enviaram as vendas de hoje.
          </div>

          <button
            onClick={() => {
              setActiveTab('status-lancamento');
              setIsExpanded(false);
            }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            Ver Controle Completo
          </button>
        </div>
      )}

      <div className="relative group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-12 h-12 rounded-xl shadow-xl border flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
            pendingSellersCount === 0
              ? 'bg-blue-600 border-blue-400 text-white shadow-blue-600/30'
              : 'bg-blue-800 border-blue-300 text-white shadow-blue-800/40 animate-pulse'
          }`}
          title="Status de Lançamento dos Vendedores"
        >
          <UserCheck className="w-6 h-6 text-white" />

          {pendingSellersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-pulse">
              {pendingSellersCount}
            </span>
          )}
        </button>

        <div className="absolute right-14 bottom-1/2 translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none z-50">
          <span>{loggedSellersCount}/{activeSellers.length} Vendedores Lançaram Hoje</span>
        </div>
      </div>
    </div>
  );
};
