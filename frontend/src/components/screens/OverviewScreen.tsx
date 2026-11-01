import React from 'react';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  SearchCheck, 
  ArrowUpRight, 
  Layers, 
  Network, 
  Clock, 
  ShieldCheck, 
  AlertOctagon,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { HOURLY_HEALTH_TREND, SAMPLE_AFFECTED_DEVICES } from '../../data/mockData';

export const OverviewScreen: React.FC = () => {
  const { 
    activeScenario, 
    setActiveScreen, 
    setSelectedInvestigationId,
    investigations 
  } = useScenario();

  return (
    <div className="space-y-6 pb-8">
      {/* Fallacy Banner / Central Narrative */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0E1A38] to-[#14234B] text-white rounded-2xl p-6 border border-slate-800 shadow-soft-md relative overflow-hidden">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>THE FALLACY OF THE 98.8% AVERAGE</span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
              Why an aggregate average conceals critical network failure
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Standard network monitoring reports <strong className="text-emerald-400 font-semibold">{activeScenario.aggregateHealthPct}% overall health</strong> across {activeScenario.monitoredDevices} campus nodes. 
              Yet in <span className="text-white font-medium">{activeScenario.affectedZone}</span>, exactly <strong className="text-rose-400 font-semibold">{activeScenario.affectedDevices} devices</strong> have experienced complete connection dropout. 
              UNSEEN leverages specialized multi-agent consensus to uncover and diagnose these silent dropouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveScreen('scenario-lab')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <span>Test Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveScreen('evidence')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View Adjudication Evidence</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monitored Campus Devices"
          value={activeScenario.monitoredDevices}
          subValue="Active endpoints"
          icon={Users}
          trend="+12 this morning"
          trendType="neutral"
        />

        <StatCard
          label="Aggregate Network Health"
          value={`${activeScenario.aggregateHealthPct}%`}
          subValue="SLA target: 98.5%"
          icon={Activity}
          variant="healthy"
          trend="Apparent Green"
          trendType="positive"
        />

        <StatCard
          label="Invisible Affected Cohort"
          value={activeScenario.affectedDevices}
          subValue={`(${((activeScenario.affectedDevices / activeScenario.monitoredDevices) * 100).toFixed(1)}% of fleet)`}
          icon={AlertOctagon}
          variant={activeScenario.affectedDevices > 0 ? "fault" : "healthy"}
          trend={activeScenario.affectedDevices > 0 ? "Localized Outage" : "Optimal"}
          trendType={activeScenario.affectedDevices > 0 ? "negative" : "positive"}
        />

        <StatCard
          label="Active Multi-Agent Cases"
          value={investigations.length}
          subValue="Consensus pipeline"
          icon={SearchCheck}
          variant="warning"
          trend="4 Active Inquiries"
          trendType="neutral"
        />
      </div>

      {/* Main Grid: Health Trend Chart + Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Cols: Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Aggregate Health vs Micro-Cohort Failures (6-Hour Window)
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Visualizing how high global uptime masks localized degradation
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Global Health %</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600">Affected Devices</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_HEALTH_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                <YAxis domain={[96, 100]} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '8px', 
                    border: 'none', 
                    fontSize: '12px', 
                    color: '#FFF' 
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'aggregateHealth' ? `${val}%` : `${val} nodes`,
                    name === 'aggregateHealth' ? 'Global Health' : 'Failing Cohort'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="aggregateHealth" 
                  stroke="#10B981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#healthGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Aggregate metric drop from 99.4% to 98.8% triggers zero P1 alarms in traditional NMS.</span>
            </span>
            <span className="font-mono text-slate-400">Sampling Rate: 60s</span>
          </div>
        </div>

        {/* 1 Col: Affected vs Healthy Devices Quick Comparison */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Twin-Cohort Divergence
              </h3>
              <Badge variant="warning">Delta: 100%</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Counterfactual analysis comparing the isolated cohort against healthy neighbors in {activeScenario.affectedZone}.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-900">Healthy Cohort</span>
                  <span className="text-xs font-mono font-bold text-emerald-800">
                    {activeScenario.healthyDevices} nodes (98.8%)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Active IPv4 bindings with {activeScenario.suspectedFault.includes('DHCP') ? 'valid 10.142.0.x leases' : 'nominal latency'}. Roundtrip ping: 3.8ms.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-rose-900">Affected Cohort</span>
                  <span className="text-xs font-mono font-bold text-rose-800">
                    {activeScenario.affectedDevices} nodes (1.2%)
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Isolated in {activeScenario.affectedZone}. 100% packet drop due to {activeScenario.suspectedFault}.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveScreen('evidence')}
              className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Inspect Counterfactual Matrix</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Row: Network Topology Preview & Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topology Preview Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Topological Blast Radius
                </h3>
              </div>
              <Badge variant="fault">AP-ENG-04 Faulted</Badge>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              All 6 disconnected devices converge on Wi-Fi AP-ENG-04 and VLAN-142 on Edge Switch SW-ENG-EDGE-02.
            </p>

            {/* Visual mini-map graph representation */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-700 bg-white p-2 rounded border border-slate-200">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Campus Core (R-CAMPUS-01)</span>
                </span>
                <span className="text-[11px] text-slate-400">14.2 Gbps</span>
              </div>

              <div className="pl-4 border-l-2 border-slate-200 ml-3 space-y-2 py-1">
                <div className="flex items-center justify-between text-slate-700 bg-white p-2 rounded border border-slate-200">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Eng Dist (SW-ENG-CORE-02)</span>
                  </span>
                  <span className="text-[11px] text-amber-600">Pool 100%</span>
                </div>

                <div className="pl-4 border-l-2 border-amber-300 ml-3 space-y-2 py-1">
                  <div className="flex items-center justify-between text-rose-800 bg-rose-50/60 p-2 rounded border border-rose-200">
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-semibold">AP-ENG-04 (6 APIPA Drops)</span>
                    </span>
                    <span className="text-[11px] font-bold text-rose-700">12.4% Loss</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveScreen('topology')}
              className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Open Interactive React Flow Map</span>
            </button>
          </div>
        </div>

        {/* Recent Investigations List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Active Multi-Agent Investigations
                </h3>
              </div>
              <Badge variant="outline">{investigations.length} Tracked</Badge>
            </div>
            
            <p className="text-xs text-slate-500 mb-3">
              Autonomous agent squads actively triaging and debating fault root-causes.
            </p>

            <div className="divide-y divide-slate-100">
              {investigations.slice(0, 3).map((inv) => (
                <div 
                  key={inv.id} 
                  onClick={() => {
                    setSelectedInvestigationId(inv.id);
                    setActiveScreen('investigations');
                  }}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded cursor-pointer transition-colors group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {inv.id}
                      </span>
                      <Badge 
                        variant={inv.status === 'investigating' ? 'warning' : inv.status === 'active' ? 'fault' : 'healthy'}
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-xs">{inv.title}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-medium text-slate-700 block">
                      {inv.affectedCount} Affected
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(inv.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveScreen('investigations')}
              className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>View All Investigations</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
