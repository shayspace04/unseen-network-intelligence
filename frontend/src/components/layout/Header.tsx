import React from 'react';
import { 
  Play, 
  RefreshCw, 
  FlaskConical, 
  HelpCircle,
  AlertCircle,
  Tv
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';
import { SCENARIOS } from '../../data/mockData';

export const Header: React.FC = () => {
  const { 
    activeScreen, 
    scenarios,
    activeScenario, 
    selectScenario, 
    triggerInvestigationRun, 
    isRunningInvestigation,
    isBackendConnected,
    setIsPresentationOpen
  } = useScenario();

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'overview': return 'Executive Network Intelligence';
      case 'investigations': return 'Active Incident Investigations';
      case 'topology': return 'Interactive Network Topology';
      case 'agents': return 'Agent Command Centre & Communication Mesh';
      case 'evidence': return 'Adjudication Evidence Room';
      case 'reports': return 'Synthesized Diagnostic Reports';
      case 'scenario-lab': return 'Simulation Scenario Laboratory';
      default: return 'Network Intelligence';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-soft-sm sticky top-0 z-20">
      {/* Left: Screen Title & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-600 font-semibold">UNSEEN INTELLIGENCE</span>
            <span className="text-slate-500 font-bold">/</span>
            <span className="text-xs font-medium text-slate-800 capitalize font-mono">{activeScreen}</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight leading-tight m-0">
            {getScreenTitle()}
          </h1>
        </div>
      </div>

      {/* Right Controls: Scenario Switcher + Prominent Action */}
      <div className="flex items-center space-x-3">
        {/* Scenario Quick Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-500 font-medium">Scenario:</span>
          <select 
            value={activeScenario.id}
            onChange={(e) => selectScenario(e.target.value)}
            className="bg-transparent font-medium text-slate-800 border-none outline-none cursor-pointer focus:ring-0 text-xs pr-1"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.affectedDevices > 0 ? `${s.affectedDevices} affected` : 'Nominal'})
              </option>
            ))}
          </select>
        </div>

        {/* Backend Connectivity Status */}
        {isBackendConnected ? (
          <div className="hidden md:flex items-center space-x-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>Live SQLite Backend</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-1.5 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-[11px] font-mono">
            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Offline Fallback (Mock)</span>
          </div>
        )}

        {/* Demo Data Indicator */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[11px] font-mono" title="Deterministic benchmark network simulation (Seed 42)">
          <FlaskConical className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Simulated Telemetry</span>
        </div>

        {/* Product Landing Page Link */}
        <button
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="inline-flex items-center space-x-1.5 px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-medium text-xs transition-all shadow-sm active:scale-95 shrink-0"
          title="View Public Product Landing Page"
        >
          <span className="w-2 h-2 rounded-full bg-[#ff4d00]" />
          <span>Landing</span>
        </button>

        {/* Presentation Mode Toggle */}
        <button
          onClick={() => setIsPresentationOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-medium text-xs transition-all shadow-sm active:scale-95 shrink-0"
          title="Launch Guided Presentation Mode for Judges"
        >
          <Tv className="w-3.5 h-3.5 text-indigo-600" />
          <span>Presentation Mode</span>
        </button>

        {/* Prominent New Investigation Action Button */}
        <button
          onClick={() => triggerInvestigationRun()}
          disabled={isRunningInvestigation}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
        >
          {isRunningInvestigation ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Agents Dispatched...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>New Investigation</span>
            </>
          )}
        </button>

        <a 
          href="#docs" 
          onClick={(e) => { e.preventDefault(); alert("UNSEEN Network Intelligence Platform v1.0\nDesigned for 24-hr multi-agent network fault adjudication."); }}
          className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="System Help & Architecture"
        >
          <HelpCircle className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
