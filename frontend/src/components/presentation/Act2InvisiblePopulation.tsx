import React from 'react';
import { 
  Network, 
  Layers, 
  Wifi, 
  Laptop, 
  Server, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  MapPin
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

interface Act2Props {
  onNext: () => void;
  onPrev: () => void;
}

export const Act2InvisiblePopulation: React.FC<Act2Props> = ({ onNext, onPrev }) => {
  const { activeScenario, activeInvestigation } = useScenario();

  const affectedCount = activeInvestigation?.affectedCount ?? activeScenario.affectedDevices ?? 6;
  const healthyCount = activeInvestigation?.healthyCount ?? activeScenario.healthyDevices ?? 494;
  const isDhcp = activeScenario.id === 'dhcp-starvation';
  const isMulti = activeScenario.id === 'multiple-simultaneous-faults';
  const isBaseline = activeScenario.id === 'healthy-baseline';
  const zoneName = activeInvestigation?.zone || activeScenario.affectedZone;
  const dependencyName = activeInvestigation?.primaryDependency || (isMulti ? 'Dual APs (AP-ENG-04 & AP-SCI-08)' : 'Wi-Fi 6 AP (AP-ENG-04)');
  const subnetName = activeInvestigation?.affectedSubnet || (isMulti ? 'VLAN-110' : 'VLAN-142 (10.142.0.0/24)');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Narrative Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-wider">
          <Network className="w-3.5 h-3.5" />
          <span>Act 2: The Invisible Population</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Isolating the Micro-Cohort and Shared Dependencies
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Instead of averaging, UNSEEN's Population Observer slices the network into dimensional clusters, identifying the exact boundary where failures concentrate.
        </p>
      </div>

      {/* Main Split: Topology Choke Point & Shared Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topology Traversal Card (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Topological Blast Radius & Path Traversal
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Choke Point Isolated
              </span>
            </div>

            {/* Hierarchical Topology Diagram */}
            <div className="space-y-3 font-mono text-xs">
              {/* Core Router */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="p-2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Server className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Campus Core Gateway (R-CAMPUS-01)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">100% HEALTHY</span>
                  </div>
                  <p className="text-[11px] text-slate-400">10.0.0.1 • Cisco Catalyst 9600 • Core Aggregation Tier</p>
                </div>
              </div>

              {/* Downward Connector */}
              <div className="pl-6 border-l-2 border-slate-700 py-1 ml-4 text-[10px] text-slate-500">
                10G Fiber Link (Nominal Latency 0.4ms)
              </div>

              {/* Distribution Switch */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="p-2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Eng Distribution (SW-ENG-CORE-02)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">180/186 Online</span>
                  </div>
                  <p className="text-[11px] text-slate-400">10.140.0.2 • Aruba CX 8325 • VLAN-142 Ingress</p>
                </div>
              </div>

              {/* Downward Connector */}
              <div className="pl-6 border-l-2 border-slate-700 py-1 ml-4 text-[10px] text-slate-500">
                Trunk Port Te1/0/4 (1 Gbps PoE+)
              </div>

              {/* Edge AP (The choke point) */}
              <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/50 shadow-md">
                <div className="p-2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <Wifi className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300">
                      {dependencyName}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                      COMMON DEPENDENCY
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 mt-0.5">
                    {zoneName} • Lowest Common Ancestor
                  </p>
                </div>
              </div>

              {/* Downward Connector */}
              <div className="pl-6 border-l-2 border-rose-500/40 py-1 ml-4 text-[10px] text-rose-400 font-semibold">
                802.11ax RF Link (-54 dBm Signal Strength)
              </div>

              {/* Failing Endpoints */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-rose-900/30 border border-rose-500/30">
                <div className="p-2 rounded bg-rose-500/20 text-rose-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-200">{affectedCount} Client Devices</span>
                    <span className="text-[10px] text-rose-400 font-mono">
                      {affectedCount > 0 ? 'ANOMALOUS TELEMETRY' : 'NOMINAL'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {affectedCount > 0 ? `${affectedCount} endpoints in ${zoneName} isolated by Population Observer` : 'All endpoints operating nominally'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Graph LCA Algorithm: <strong className="text-slate-200">NetworkX DAG Traversal</strong></span>
            <span className="text-blue-400 font-mono">Convergence Depth: 3 hops</span>
          </div>
        </div>

        {/* Common Attributes & Twin Comparison (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Shared Attributes Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Shared Network Attributes</span>
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">VLAN / Subnet</span>
                <span className="text-white font-bold">{subnetName}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Physical Zone</span>
                <span className="text-white font-bold">{zoneName}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Common Dependency</span>
                <span className="text-rose-400 font-bold">{dependencyName}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Edge Switch</span>
                <span className="text-white font-bold">SW-ENG-EDGE-02</span>
              </div>
              <div className="p-2.5 rounded bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Address State</span>
                <span className="text-rose-400 font-bold">
                  {isDhcp ? '169.254.x.x (APIPA Unbound)' : (isBaseline ? 'Valid (DHCP Assigned)' : 'Service Degraded')}
                </span>
              </div>
            </div>
          </div>

          {/* Healthy Comparison Population Card */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 shadow-lg space-y-3">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Healthy Comparison Population ({healthyCount} Nodes)</span>
            </h4>
            <p className="text-xs text-slate-300">
              Devices attached to adjacent APs on the same floor (<strong className="text-white">AP-ENG-03</strong>, <strong className="text-white">AP-ENG-05</strong>) and existing leases on AP-ENG-04 operate nominally:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/20 text-center">
                <span className="text-slate-400 block text-[10px]">Signal Strength</span>
                <span className="text-emerald-400 font-bold">-52 dBm (Nominal)</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/20 text-center">
                <span className="text-slate-400 block text-[10px]">Ping Latency</span>
                <span className="text-emerald-400 font-bold">4.1 ms (Low)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Key Deduction: Physical wireless RF transmission is intact. The failure is confined strictly to Layer 3 address assignment.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrev}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Act 1: Dashboard</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          <span>Dispatch the Multi-Agent Squad</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
