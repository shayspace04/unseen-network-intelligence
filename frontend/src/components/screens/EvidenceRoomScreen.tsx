import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  XCircle, 
  GitCompare, 
  ShieldCheck, 
  AlertTriangle, 
  Network, 
  Info
} from 'lucide-react';
import { TWIN_COHORT_COMPARISON } from '../../data/mockData';
import { Badge } from '../common/Badge';
import { useScenario } from '../../context/ScenarioContext';

export const EvidenceRoomScreen: React.FC = () => {
  const { 
    activeScenario, 
    evidenceItems, 
    competingHypotheses, 
    activeInvestigation 
  } = useScenario();

  const [activeTab, setActiveTab] = useState<'matrix' | 'hypotheses' | 'evidence'>('matrix');

  const supporting = evidenceItems.filter(e => e.category === 'supporting');
  const contradicting = evidenceItems.filter(e => e.category === 'contradicting');

  return (
    <div className="space-y-6 pb-12">
      {/* Evidence Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-mono uppercase font-semibold text-slate-500">Adjudication Chamber</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Empirical Evidence & Counterfactual Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Active Case: <strong className="text-slate-800 font-mono">{activeInvestigation?.id || 'INV-CURRENT'}</strong> ({activeScenario.name}). Falsification tests, and differential telemetry.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Twin-Cohort Comparison
          </button>
          <button
            onClick={() => setActiveTab('hypotheses')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'hypotheses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Competing Hypotheses ({competingHypotheses.length})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'evidence' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supporting ({supporting.length}) / Contradicting ({contradicting.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Twin-Cohort Differential Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-soft-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Counterfactual Twin-Cohort Differential Analysis
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Isolating key topological and temporal variables between failing nodes and healthy neighbors
                </p>
              </div>
              <Badge variant="healthy">Cohort Match: Exact Subnet</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Telemetry Dimension</th>
                    <th className="py-3 px-5 text-rose-700 bg-rose-50/50">Affected Cohort ({activeScenario.affectedDevices} devices)</th>
                    <th className="py-3 px-5 text-emerald-700 bg-emerald-50/50">Healthy Twin Cohort ({activeScenario.healthyDevices} devices)</th>
                    <th className="py-3 px-5">Counterfactual Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {TWIN_COHORT_COMPARISON.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-800 font-sans">
                        {row.metric}
                      </td>
                      <td className="py-3.5 px-5 text-rose-700 font-semibold bg-rose-50/30">
                        {row.affectedCohort}
                      </td>
                      <td className="py-3.5 px-5 text-emerald-700 font-semibold bg-emerald-50/30">
                        {row.healthyTwinCohort}
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 font-sans">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {row.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shared Network Dependencies Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Network className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Shared Network Dependencies (Intersection Point)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                The Topology Investigator computed the lowest common ancestor node connecting exclusively the affected endpoints.
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between">
                  <span className="text-slate-500">Convergence Node:</span>
                  <span className="font-bold text-slate-900">{activeInvestigation?.primaryDependency || 'AP-ENG-04 (10.142.0.45)'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between">
                  <span className="text-slate-500">Upstream Switch:</span>
                  <span className="font-bold text-slate-900">SW-ENG-EDGE-02</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between">
                  <span className="text-slate-500">Affected Scope:</span>
                  <span className="font-bold text-rose-600">{activeScenario.affectedZone}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm">
              <div className="flex items-center space-x-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Adjudicator Confidence Scoring
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Bayesian likelihood formulation incorporates empirical telemetry, absence of conflicting signals, and sample size coverage.
              </p>

              <div className="space-y-3">
                {competingHypotheses.slice(0, 3).map((hypo) => (
                  <div key={hypo.id}>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-700 truncate max-w-xs">{hypo.title}</span>
                      <span className={`font-bold ${hypo.status === 'leading' ? 'text-blue-600' : 'text-slate-400'}`}>
                        {hypo.probability.toFixed(2)} Support {hypo.status === 'refuted' ? '(Refuted)' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${hypo.status === 'leading' ? 'bg-blue-600' : 'bg-slate-300'}`} 
                        style={{ width: `${Math.min(100, hypo.probability * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Competing Hypotheses */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-4">
          {competingHypotheses.map((hypo) => (
            <div
              key={hypo.id}
              className={`bg-white border rounded-xl p-5 shadow-soft-sm ${
                hypo.status === 'leading'
                  ? 'border-blue-400 ring-2 ring-blue-500/20'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {hypo.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{hypo.title}</h3>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <Badge 
                    variant={hypo.status === 'leading' ? 'healthy' : 'neutral'}
                    dot
                  >
                    {hypo.status.toUpperCase()}
                  </Badge>
                  <span className="font-mono font-bold text-slate-900" title="Independent relative support score (0.00 - 1.00)">
                    {hypo.probability.toFixed(2)} Relative Support
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block mb-1">
                    Supporting Arguments & Telemetry
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-emerald-900">
                    {hypo.supportingArgs.map((arg, idx) => (
                      <li key={idx}>{arg}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-800 block mb-1">
                    Counter-Arguments & Falsification Tests
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-rose-900">
                    {hypo.counterArgs.map((arg, idx) => (
                      <li key={idx}>{arg}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-slate-800">Adjudicator Verdict:</span>
                <span>{hypo.adjudicationNote}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Supporting vs Contradicting Evidence Details */}
      {activeTab === 'evidence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supporting Evidence Column */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supporting Evidence ({supporting.length})</h3>
                <p className="text-xs text-slate-500 font-mono">Empirical metrics confirming candidate root-cause</p>
              </div>
            </div>

            <div className="space-y-3">
              {supporting.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.metric}</span>
                    <Badge variant="healthy" size="sm">{item.impactWeight}</Badge>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{item.observation}</p>
                  <p className="text-[11px] text-slate-500 font-mono italic">Note: {item.comparisonNote}</p>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Source: {item.sourceAgent}</span>
                    <span>Logged at {item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contradicting Evidence Column */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <XCircle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Contradicting Evidence ({contradicting.length})</h3>
                <p className="text-xs text-slate-500 font-mono">Telemetry ruling out alternative hypotheses</p>
              </div>
            </div>

            <div className="space-y-3">
              {contradicting.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.metric}</span>
                    <Badge variant="fault" size="sm">{item.impactWeight}</Badge>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{item.observation}</p>
                  <p className="text-[11px] text-slate-500 font-mono italic">Refutation: {item.comparisonNote}</p>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Source: {item.sourceAgent}</span>
                    <span>Logged at {item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Limitations Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800">Diagnostic Bounds & Observability Limitations:</span>
          <p>
            UNSEEN operates on observable SNMP polling, NetFlow, and DHCP telemetry. 
            Telemetry intervals below 1000ms may induce jitter artifacts in upstream aggregate counters. 
            All findings are subjected to agent falsification rounds prior to report generation.
          </p>
        </div>
      </div>
    </div>
  );
};
