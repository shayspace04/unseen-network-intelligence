import React, { useEffect, useState } from 'react';
import { ScenarioProvider, useScenario } from './context/ScenarioContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewScreen } from './components/screens/OverviewScreen';
import { InvestigationsScreen } from './components/screens/InvestigationsScreen';
import { NetworkMapScreen } from './components/screens/NetworkMapScreen';
import { AgentActivityScreen } from './components/screens/AgentActivityScreen';
import { EvidenceRoomScreen } from './components/screens/EvidenceRoomScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { ScenarioLabScreen } from './components/screens/ScenarioLabScreen';
import { PresentationModal } from './components/presentation/PresentationModal';
import { UnseenLandingPage } from './components/landing/UnseenLandingPage';
import { RefreshCw } from 'lucide-react';

interface MainContentProps {
  onNavigateToLanding: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onNavigateToLanding }) => {
  const { 
    activeScreen, 
    setActiveScreen,
    isRunningInvestigation, 
    isPresentationOpen, 
    setIsPresentationOpen 
  } = useScenario();

  useEffect(() => {
    const handleScreenNav = (e: any) => {
      if (e.detail) {
        setActiveScreen(e.detail);
      }
    };
    window.addEventListener('unseen-navigate-screen', handleScreenNav);
    return () => window.removeEventListener('unseen-navigate-screen', handleScreenNav);
  }, [setActiveScreen]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'overview':
        return <OverviewScreen />;
      case 'investigations':
        return <InvestigationsScreen />;
      case 'topology':
        return <NetworkMapScreen />;
      case 'agents':
        return <AgentActivityScreen />;
      case 'evidence':
        return <EvidenceRoomScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'scenario-lab':
        return <ScenarioLabScreen />;
      default:
        return <OverviewScreen />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-900">
      {/* Dark Navy Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-slate-100/90">
          <div className="max-w-7xl mx-auto">
            {renderScreen()}
          </div>
        </main>
      </div>

      {/* Live Investigation Running Toast / Overlay */}
      {isRunningInvestigation && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A1128] text-white p-4 rounded-xl shadow-soft-lg border border-slate-700 flex items-center space-x-3 animate-in slide-in-from-bottom duration-200">
          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold">UNSEEN Agent Swarm Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300 font-mono">
              Falsifying hypotheses across 5 autonomous agents...
            </p>
          </div>
        </div>
      )}

      {/* Guided Full-Screen Presentation Mode Modal */}
      <PresentationModal 
        isOpen={isPresentationOpen} 
        onClose={() => setIsPresentationOpen(false)} 
      />
    </div>
  );
};

export function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToApp = (screen?: string) => {
    window.history.pushState({}, '', '/app');
    setCurrentPath('/app');
    if (screen) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('unseen-navigate-screen', { detail: screen }));
      }, 50);
    }
  };

  const navigateToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  const isAppRoute = currentPath.startsWith('/app');

  return (
    <ScenarioProvider>
      {isAppRoute ? (
        <MainContent onNavigateToLanding={navigateToLanding} />
      ) : (
        <UnseenLandingPage onNavigateToApp={navigateToApp} />
      )}
    </ScenarioProvider>
  );
}

export default App;
