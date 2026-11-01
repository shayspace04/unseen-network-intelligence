import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  ExternalLink,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

interface Act5Props {
  onPrev: () => void;
  onExit: () => void;
  onRestart: () => void;
}

export const Act5TheVerdict: React.FC<Act5Props> = ({ onPrev, onExit, onRestart }) => {
  const { activeReport, activeInvestigation, activeScenario, competingHypotheses } = useScenario();

  const [copied, setCopied] = useState<boolean>(false);

  const isBaseline = activeScenario.id === 'healthy-baseline';
  const verdict = activeReport?.verdict || (isBaseline ? 'NO_FAULT_DETECTED' : 'PROBABLE_FAULT');
  const confidence = activeReport ? Math.round(activeReport.confidenceLevel * 100) : 98;
  const isMulti = activeScenario.id === 'multiple-simultaneous-faults';

  // Detailed recommended action objects
  const rawActions = activeReport?.recommendedActions || [
    {
      action: 'Quarantine rogue lease-exhausting MAC via Port-Security ACL',
      urgency: 'immediate',
      estimatedResolution: '< 2 mins',
      estimated_resolution: '< 2 mins',
      targetSystem: 'SW-ENG-EDGE-02',
      target_system: 'SW-ENG-EDGE-02'
    },
    {
      action: 'Expand DHCP dynamic scope from /24 to /23',
      urgency: 'immediate',
      estimatedResolution: '< 5 mins',
      estimated_resolution: '< 5 mins',
      targetSystem: 'Campus IPAM / Kea DHCP',
      target_system: 'Campus IPAM / Kea DHCP'
    }
  ];

  // Construct complete clean JSON object strictly adhering to canonical NetCoop AI contract
  const fullJsonReport = {
    incident_id: activeInvestigation?.id || 'INV-2026-DHCP',
    status: verdict === 'ABSTAIN_INSUFFICIENT_EVIDENCE' ? 'abstained' : 'diagnosed',
    suspected_root_cause: activeReport?.rootCauseAnalysis || 'Exhaustion of VLAN-142 DHCP address pool due to rogue MAC rotation.',
    confidence: activeReport?.confidenceLevel || 0.98,
    affected_devices: Array.from({ length: activeScenario.affectedDevices }, (_, i) => `DEV-ANOM-${String(i + 1).padStart(3, '0')}`),
    supporting_evidence: [
      {
        metric: 'packet_loss_pct',
        value: isBaseline ? 0.0 : 100.0,
        interpretation: isBaseline ? 'Nominal packet delivery' : 'Affected cohort unable to obtain IP lease'
      },
      {
        metric: 'telemetry_deviation',
        value: activeScenario.affectedDevices,
        interpretation: `${activeScenario.affectedDevices} devices isolated in degraded state by Population Observer`
      }
    ],
    alternative_causes: isBaseline ? [] : [
      'Wi-Fi Co-Channel Contention & Frame Retries',
      'Upstream Gateway Link Congestion',
      'DNS Resolver Silent Packet Drops'
    ],
    alternative_cause_details: isBaseline ? [] : [
      { title: 'Wi-Fi Co-Channel Contention & Frame Retries', probability: 0.04, status: 'falsified' },
      { title: 'Upstream Gateway Link Congestion', probability: 0.03, status: 'falsified' },
      { title: 'DNS Resolver Silent Packet Drops', probability: 0.02, status: 'falsified' }
    ],
    recommended_actions: rawActions.map((a: any) => typeof a === 'string' ? a : a.action),
    recommended_action_details: rawActions.map((a: any) => ({
      action: typeof a === 'string' ? a : a.action,
      urgency: a.urgency || 'immediate',
      estimated_resolution: a.estimatedResolution || a.estimated_resolution || '< 5 mins',
      target_system: a.targetSystem || a.target_system || 'Campus Network'
    })),
    evidence_sources: [
      'Population Observer (AGENT-POP-01)',
      'Counterfactual Agent (AGENT-CTF-02)',
      'Topology Investigator (AGENT-TOP-03)',
      'Fault Investigator (AGENT-FLT-04)',
      'Adjudicator (AGENT-ADJ-05)'
    ],
    limitations: [
      'Assumes static physical topology during 60s sampling epoch',
      'Remediation actions require network engineer authorization before deployment'
    ],
    verdict: verdict,
    report_id: activeReport?.id || 'REP-2026-DHCP',
    scenario_id: activeScenario.id,
    severity: activeReport?.severity || 'Major',
    affected_zone: activeReport?.zone || activeScenario.affectedZone,
    monitored_devices: activeScenario.monitoredDevices,
    healthy_devices: activeScenario.healthyDevices,
    executive_summary: activeReport?.executiveSummary || 'Empirical telemetry established that DHCP Pool Scope Exhaustion is the primary root cause.',
    counterfactual_delta: activeReport?.counterfactualDelta || '100% packet loss on affected devices vs 0% on healthy control peers.',
    created_at: activeReport?.createdAt || new Date().toISOString()
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fullJsonReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Narrative Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Act 5: The Consensus Verdict</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Official Adjudicated Diagnostic Report
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Multi-agent consensus finalized. Observable telemetry synthesized into an evidence-backed root cause diagnosis with immediate prescriptive remediation.
        </p>
      </div>

      {/* Main Diagnostic Report Card */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Report Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border ${
                verdict === 'NO_FAULT_DETECTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : verdict === 'ABSTAIN_INSUFFICIENT_EVIDENCE'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                VERDICT: {verdict}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Severity: <strong className="text-rose-400">{activeReport?.severity || 'Major'}</strong>
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mt-2">
              {activeReport?.title || `Adjudication Report: ${activeScenario.name}`}
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Case Incident: <strong className="text-blue-400">{activeInvestigation?.id || 'INV-2026-DHCP'}</strong> • Report: <strong className="text-slate-200">{activeReport?.id || 'REP-2026-DHCP'}</strong>
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
            <span className="text-[10px] font-mono uppercase text-slate-400">Joint Statistical Confidence</span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {confidence}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">Ceiling: 98% (Calibrated)</span>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Summary</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {activeReport?.executiveSummary || 
              `Global network health registered ${activeScenario.aggregateHealthPct}% uptime, masking a complete outage affecting ${activeScenario.affectedDevices} devices in ${activeScenario.affectedZone}. UNSEEN multi-agent squad isolated the cohort, verified counterfactual divergence, traced dependency to AP-ENG-04, and empirically confirmed the root cause with ${confidence}% confidence.`}
          </p>
        </div>

        {/* Dual Sections: Root Cause & Counterfactual Delta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Root Cause Analysis */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
              Probable Root Cause Analysis
            </span>
            <p className="text-xs text-rose-200 leading-relaxed font-sans whitespace-pre-line">
              {activeReport?.rootCauseAnalysis || 
                'Empirical telemetry established that DHCP Pool Scope Exhaustion is the primary root cause. Alternative hypotheses were falsified through counterfactual unit testing and topology traversal.'}
            </p>
          </div>

          {/* Counterfactual Delta */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
              Counterfactual Mathematical Delta
            </span>
            <p className="text-xs text-indigo-200 leading-relaxed font-sans">
              {activeReport?.counterfactualDelta || 
                'Differential analysis confirmed: RF signal strength is nearly identical between cohorts (-54 dBm vs -52 dBm). 100% of affected devices lack valid IP lease while 100% of control peers hold valid leases.'}
            </p>
          </div>
        </div>

        {/* Alternative Explanations Evaluated & Falsified */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Alternative Explanations Evaluated & Falsified</span>
            </span>
            <span className="text-emerald-400 text-[10px] font-semibold">Zero Unresolved Contradictions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            {competingHypotheses.filter(h => h.status === 'refuted').length > 0 ? (
              competingHypotheses.filter(h => h.status === 'refuted').slice(0, 3).map((h, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] truncate" title={h.title}>{h.title}</span>
                  <span className="text-rose-400 font-bold">FALSIFIED</span>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5 line-clamp-2">
                    {h.counterArgs[0] || h.adjudicationNote}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-2 text-slate-400 text-center text-xs">
                {isBaseline 
                  ? 'All candidate failure hypotheses evaluated. Telemetry confirms nominal baseline performance.' 
                  : 'All evaluated alternative failure hypotheses systematically refuted.'}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prescriptive Remediation Action Plan</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Prioritized by Operational Blast Radius
            </span>
          </div>

          <div className="space-y-2">
            {(activeReport?.recommendedActions && activeReport.recommendedActions.length > 0 
              ? activeReport.recommendedActions 
              : rawActions
            ).map((actionItem: any, idx: number) => {
              const urgency = actionItem.urgency || 'immediate';
              const urgencyBadge = 
                urgency === 'immediate' 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : urgency === 'scheduled'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

              return (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-blue-400 shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-white font-sans font-medium">{actionItem.action}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Target System: <strong className="text-slate-300">{actionItem.targetSystem || actionItem.target_system}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    <span className="text-[10px] text-slate-400">
                      ETA: {actionItem.estimatedResolution || actionItem.estimated_resolution}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${urgencyBadge}`}>
                      {urgency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Copyable Final JSON Report Button Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Export machine-readable diagnostic contract to SIEM, ServiceNow, or Incident Management.
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs border border-slate-700 transition-all shadow-md active:scale-95 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Diagnostic JSON Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-400" />
                <span>Copy Full Diagnostic JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrev}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Act 4: The Evidence</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRestart}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replay From Act 1</span>
          </button>

          <button
            onClick={onExit}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
          >
            <span>Exit to Operational Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
