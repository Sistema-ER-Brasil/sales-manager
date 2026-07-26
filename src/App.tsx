import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OperationsTVPanel } from './components/OperationsTVPanel';
import { SalesEntryForm } from './components/SalesEntryForm';
import { CadastrosView } from './components/CadastrosView';
import { GoalsView } from './components/GoalsView';
import { ReportsView } from './components/ReportsView';
import { RankingsView } from './components/RankingsView';
import { ImportView } from './components/ImportView';
import { UserSalesStatusView } from './components/UserSalesStatusView';
import { SettingsView } from './components/SettingsView';
import { FloatingSalesStatusWidget } from './components/FloatingSalesStatusWidget';
import { AuthModal } from './components/AuthModal';

function MainApp() {
  const { activeTab, setActiveTab, isAuthenticated } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If not authenticated (logged out), show full screen login screen
  if (!isAuthenticated) {
    return <AuthModal isOpen={true} onClose={() => {}} isFullScreen={true} />;
  }

  // Operations TV Panel takes full screen if selected
  if (activeTab === 'operations') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Floating top bar back to dashboard */}
        <div className="fixed top-3 left-3 z-50">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-3 py-1.5 bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold shadow-lg backdrop-blur-md transition-colors"
          >
             Sair do Modo TV
          </button>
        </div>
        <OperationsTVPanel />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} setIsAuthModalOpen={setIsAuthModalOpen} />

        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'entry' && <SalesEntryForm />}
          {activeTab === 'cadastros' && <CadastrosView />}
          {activeTab === 'goals' && <GoalsView />}
          {activeTab === 'status-lancamento' && <UserSalesStatusView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'rankings' && <RankingsView />}
          {activeTab === 'import' && <ImportView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Floating Sales Status Badge (Canto Esquerdo) */}
      <FloatingSalesStatusWidget />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
