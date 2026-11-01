import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  SearchCheck, 
  Network, 
  Bot, 
  Layers, 
  FileText, 
  FlaskConical, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Activity,
  Server
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';
import { NavScreen } from '../../types';
import { cn } from '../../utils/cn';
import { checkBackendHealth } from '../../services/api';

interface NavItem {
  id: NavScreen;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'investigations', label: 'Investigations', icon: SearchCheck, badge: 4 },
  { id: 'topology', label: 'Network Map', icon: Network },
  { id: 'agents', label: 'Agent Activity', icon: Bot, badge: 5 },
  { id: 'evidence', label: 'Evidence Room', icon: Layers },
  { id: 'reports', label: 'Reports', icon: FileText, badge: 2 },
  { id: 'scenario-lab', label: 'Scenario Laboratory', icon: FlaskConical },
];

export const Sidebar: React.FC = () => {
  const { 
    activeScreen, 
    setActiveScreen, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    activeScenario 
  } = useScenario();

  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    checkBackendHealth().then((res) => {
      if (res && res.status === 'operational') {
        setBackendOnline(true);
      }
    });
  }, []);

  return (
    <aside
      className={cn(
        "bg-[#0A1128] text-slate-300 flex flex-col border-r border-[#152248] transition-all duration-300 ease-in-out select-none z-30 shrink-0",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#152248]">
        {!isSidebarCollapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-wider text-base">UNSEEN</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Agentic Intel</span>
            </div>
          </div>
        )}

        {isSidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsSidebarCollapsed(prev => !prev)}
          className={cn(
            "p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors",
            isSidebarCollapsed ? "hidden" : "block"
          )}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tagline Banner (when expanded) */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-3 bg-[#080E20] border-b border-[#152248]/80 text-[11px] text-slate-400 leading-snug">
          <p className="italic font-normal text-slate-300">
            &ldquo;Because an average cannot tell the whole story.&rdquo;
          </p>
          <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-emerald-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active: {activeScenario.name}</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={cn(
                "w-full flex items-center rounded-md px-3 py-2.5 text-xs font-medium transition-all group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-300 hover:bg-[#121E3E] hover:text-white"
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon 
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform group-hover:scale-105", 
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200",
                  !isSidebarCollapsed && "mr-3"
                )} 
              />
              
              {!isSidebarCollapsed && (
                <span className="flex-1 text-left truncate tracking-wide">{item.label}</span>
              )}

              {!isSidebarCollapsed && item.badge && (
                <span
                  className={cn(
                    "ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded",
                    isActive 
                      ? "bg-blue-500 text-white" 
                      : "bg-[#16254E] text-slate-400 group-hover:text-slate-200"
                  )}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip badge for collapsed state */}
              {isSidebarCollapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0A1128]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Collapsed Toggle Button & System Status */}
      <div className="p-3 border-t border-[#152248] space-y-2">
        {isSidebarCollapsed ? (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="w-full py-2 flex justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-2.5 rounded-md bg-[#070D1E] border border-[#152248] text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Agent Core</span>
              </span>
              <span className="text-emerald-400 font-mono text-[10px] font-semibold">5 STANDBY</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Server className={cn("w-3.5 h-3.5", backendOnline ? "text-emerald-400" : "text-blue-400")} />
                <span>Backend Port</span>
              </span>
              <span className={cn("font-mono text-[10px] font-semibold", backendOnline ? "text-emerald-400" : "text-slate-300")}>
                {backendOnline ? ":8000 (ONLINE)" : ":8000 (STANDBY)"}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
