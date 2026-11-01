import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Wifi, 
  Server, 
  ArrowRight,
  HelpCircle,
  Activity
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

interface Act1Props {
  onNext: () => void;
}

export const Act1GreenDashboard: React.FC<Act1Props> = ({ onNext }) => {
  const { activeScenario, activeInvestigation } = useScenario();

  const monitoredCount = activeInvestigation?.monitoredCount || activeScenario.monitoredDevices || 500;
  const aggregateHealth = activeInvestigation?.aggregateHealthPct || activeScenario.aggregateHealthPct || 98.8;
  const healthyCount = activeInvestigation?.healthyCount || activeScenario.healthyDevices || 494;
  const affectedCount = activeInvestigation?.affectedCount ?? activeScenario.affectedDevices ?? 6;
  const affectedPct = monitoredCount > 0 ? ((affectedCount / monitoredCount) * 100).toFixed(1) : '0.0';
  const zoneName = activeInvestigation?.zone || activeScenario.affectedZone || 'Campus';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Narrative Eyebrow */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" />
          <span>Act 1: The Aggregate Illusion</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {affectedCount > 0 
            ? `"The network reports that everything is fine. But ${affectedCount === 6 ? 'six' : affectedCount} devices disagree."`
            : `"The network reports that everything is fine. And telemetry confirms nominal health."`}
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Because an average cannot tell the whole story. Traditional network operations centers rely on aggregate fleet health percentages that systematically bury micro-cohort failures.
        </p>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Fleet */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Total Monitored Fleet</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-white font-mono">{monitoredCount}</div>
            <p className="text-xs text-slate-400 mt-1">Campus-wide connected endpoints</p>
          </div>
          <div className="text-[11px] font-mono text-slate-500 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Sampling: Active (60s)</span>
            <span className="text-emerald-400 font-semibold">100% Monitored</span>
          </div>
        </div>

        {/* Global Network Health */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-emerald-400">Global Reported Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">{aggregateHealth}%</div>
            <p className="text-xs text-slate-300 mt-1">Dashboard Status: <strong className="text-emerald-400">NOMINAL (Green)</strong></p>
          </div>
          <div className="text-[11px] font-mono text-emerald-300/80 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>SLA Standard: &gt; 95.0%</span>
            <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">SLA PASSED</span>
          </div>
        </div>

        {/* Healthy Population */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Healthy Endpoints</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-white font-mono">{healthyCount}</div>
            <p className="text-xs text-slate-400 mt-1">Operating with normal L2-L7 telemetry</p>
          </div>
          <div className="text-[11px] font-mono text-slate-500 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Mean Ping Latency</span>
            <span className="text-slate-300 font-semibold font-mono">3.8 ms</span>
          </div>
        </div>

        {/* Affected Devices */}
        <div className="bg-slate-900/90 border border-rose-500/50 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-rose-400">The Invisible Population</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-rose-400 font-mono">{affectedCount} <span className="text-sm font-normal text-slate-400">({affectedPct}%)</span></div>
            <p className="text-xs text-rose-300/90 mt-1 font-medium">Experiencing complete connectivity failure</p>
          </div>
          <div className="text-[11px] font-mono text-rose-300/80 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Failure Mode</span>
            <span className="bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">Masked by Average</span>
          </div>
        </div>
      </div>

      {/* Aggregate Trap Visual Comparison */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Why Traditional Monitoring Misses This Failure</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standard network dashboards set alert thresholds at 5% or 10% fleet degradation. A localized failure of {affectedCount} endpoints represents only {affectedPct}% of the fleet.
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-400 hidden sm:block">
            <span>Incident ID: </span>
            <strong className="text-blue-400">{activeInvestigation?.id || 'INV-2026-DHCP'}</strong>
          </div>
        </div>

        {/* Population Proportion Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{healthyCount} Healthy Campus Endpoints ({aggregateHealth}%)</span>
            </span>
            <span className="text-rose-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>{affectedCount} Failing Endpoints ({affectedPct}%)</span>
            </span>
          </div>
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex p-0.5">
            <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${aggregateHealth}%` }} />
            <div className="h-full bg-rose-500 rounded-r-full animate-pulse" style={{ width: `${affectedPct}%` }} />
          </div>
        </div>

        {/* Real-world Impact Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300">
            <div className="font-bold text-emerald-400 mb-1 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>The Executive View (NOC Dashboard)</span>
            </div>
            Green lights across the board. Mean ping latency is 3.8ms. SLA report generates green checks for the university CIO. No tickets automatically escalated.
          </div>

          <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs text-slate-300">
            <div className="font-bold text-rose-400 mb-1 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>The Human Reality ({zoneName})</span>
            </div>
            {affectedCount > 0 ? (
              `${affectedCount} client device(s) in ${zoneName} are experiencing connectivity failure (${activeInvestigation?.suspectedFault || activeScenario.suspectedFault}). To them, the campus network is broken.`
            ) : (
              'All monitored endpoints across all campus zones maintain active connections and nominal telemetry.'
            )}
          </div>
        </div>
      </div>

      {/* Call to Action to Act 2 */}
      <div className="flex items-center justify-end pt-2">
        <button
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          <span>Examine the Invisible Population</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
