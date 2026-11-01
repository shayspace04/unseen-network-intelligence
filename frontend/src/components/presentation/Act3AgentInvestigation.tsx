import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ArrowLeft,
  Eye, 
  GitCompare, 
  Network, 
  AlertTriangle, 
  ShieldCheck,
  Code2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

interface Act3Props {
  onNext: () => void;
  onPrev: () => void;
}

export const Act3AgentInvestigation: React.FC<Act3Props> = ({ onNext, onPrev }) => {
  const { agentCards, agentMessages, activeInvestigation, activeScenario } = useScenario();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Playback timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStep((prev) => {
          if (prev < 4) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Fallback structures if messages or cards are loading
  const agentSteps = [
    {
      index: 0,
      id: 'agent-pop',
      tag: 'AGENT-POP-01',
      name: 'Population Observer',
      role: 'Micro-Cohort Isolation & Slicing',
      icon: Eye,
      iconColor: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      messageReceived: `Raw Campus Telemetry Ingest: 500 connected endpoints across 4 VLANs. Global reported health: ${activeScenario.aggregateHealthPct}%. Requesting anomaly scan.`,
      evidenceExamined: 'Scanned DHCP lease states, ping response latencies, ARP binding tables, and BSSID associations across all campus access tiers.',
      findingProduced: `Isolated anomalous micro-cohort of ${activeScenario.affectedDevices} devices in ${activeScenario.affectedZone} with 100% lease binding timeout and APIPA fallback. Remaining 494 devices normal.`,
      targetAgent: 'Counterfactual Agent & Topology Investigator',
      rawMsgIndex: 0
    },
    {
      index: 1,
      id: 'agent-ctf',
      tag: 'AGENT-CTF-02',
      name: 'Counterfactual Agent',
      role: 'Twin-Cohort Differential Analysis',
      icon: GitCompare,
      iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
      messageReceived: `Cohort handover from Population Observer: ${activeScenario.affectedDevices} failing client MACs. Requesting twin-cohort control matching.`,
      evidenceExamined: 'Matched the failing devices with healthy twin peers connected to the same switch tier and adjacent APs under identical RF propagation conditions.',
      findingProduced: 'Physical RF signal strength is nearly identical (-54 dBm vs -52 dBm), decisively falsifying distance/attenuation. Definitive divergence confirmed strictly in DHCP binding.',
      targetAgent: 'Fault Investigator',
      rawMsgIndex: 1
    },
    {
      index: 2,
      id: 'agent-top',
      tag: 'AGENT-TOP-03',
      name: 'Topology Investigator',
      role: 'NetworkX DAG Dependency Traversal',
      icon: Network,
      iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      messageReceived: `Cohort handover from Population Observer: Tracing physical and logical upstream tree for ${activeScenario.affectedDevices} failing stations.`,
      evidenceExamined: 'Traversed hierarchical campus DAG from client stations through edge switches, distribution routers, and core gateway. Computed Lowest Common Ancestor (LCA).',
      findingProduced: `Convergence point isolated at ${activeInvestigation?.primaryDependency || 'AP-ENG-04 on SW-ENG-EDGE-02'}. Devices outside this specific branch operate without degradation.`,
      targetAgent: 'Fault Investigator',
      rawMsgIndex: 2
    },
    {
      index: 3,
      id: 'agent-flt',
      tag: 'AGENT-FLT-04',
      name: 'Fault Investigator',
      role: 'Hypothesis Adjudication & Falsification',
      icon: AlertTriangle,
      iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      messageReceived: 'Handover from Counterfactual (RF Normal, IPAM Drop) and Topology (Edge Convergence). Evaluating 5 competing failure hypotheses.',
      evidenceExamined: 'Tested 5 hypotheses: 1) DHCP Scope Exhaustion, 2) Wi-Fi Co-Channel Contention, 3) Uplink Bufferbloat, 4) DNS Anycast Drop, 5) Multi-Fault Cascade.',
      findingProduced: `Falsified RF attenuation and switch failure. Established '${activeInvestigation?.suspectedFault || 'DHCP Pool Scope Exhaustion'}' as leading hypothesis with empirical backing.`,
      targetAgent: 'Adjudicator',
      rawMsgIndex: 3
    },
    {
      index: 4,
      id: 'agent-adj',
      tag: 'AGENT-ADJ-05',
      name: 'Adjudicator',
      role: 'Consensus Adjudication & Prescriptive Action',
      icon: ShieldCheck,
      iconColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      messageReceived: 'Ranked hypothesis handover from Fault Investigator with supporting telemetry from Agents 1–3. Requesting final adjudication verdict.',
      evidenceExamined: 'Cross-correlated orthogonal telemetry domains (L2 RF, L3 IPAM, L4 Transport). Applied sample coverage factor and verified absence of stale data.',
      findingProduced: `Adjudication finalized: ${(activeInvestigation ? activeInvestigation.confidence * 100 : 98).toFixed(0)}% confidence in confirmed root cause. Formulated 3 prioritized remedial actions.`,
      targetAgent: 'Final Diagnostic Report',
      rawMsgIndex: 4
    }
  ];

  const current = agentSteps[activeStep];
  const matchingCard = agentCards[activeStep] || null;
  const matchingMsg = agentMessages[current.rawMsgIndex] || agentMessages[0] || null;
  const dynamicFinding = matchingCard?.latestFinding || current.findingProduced;
  const dynamicName = matchingCard?.name || current.name;
  const dynamicRole = matchingCard?.role || current.role;

  const handleCopyJson = () => {
    if (!matchingMsg) return;
    navigator.clipboard.writeText(JSON.stringify(matchingMsg.payload || matchingMsg, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CurrentIcon = current.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Narrative Eyebrow */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Act 3: Autonomous Agent Collaboration</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Five Specialized Agents in Coordinated Communication
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          UNSEEN's multi-agent squad communicates through validated Pydantic message contracts, handing off verified findings in a strictly causal pipeline.
        </p>
      </div>

      {/* Playback Control Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {isPlaying ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>REPLAY PLAYING (3.5s auto-step)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>RECORDED PLAYBACK (PAUSED • Manual Navigation)</span>
            </span>
          )}
          <span className="text-xs font-mono text-slate-400">
            • Incident: <strong className="text-blue-400">{activeInvestigation?.id || 'INV-2026-DHCP'}</strong>
          </span>
        </div>

        {/* Stepper Buttons & Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setIsPlaying(false); setActiveStep(prev => Math.max(0, prev - 1)); }}
            disabled={activeStep === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous Agent Step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-md active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Replay</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto Play (3.5s)</span>
              </>
            )}
          </button>

          <button
            onClick={() => { setIsPlaying(false); setActiveStep(prev => Math.min(4, prev + 1)); }}
            disabled={activeStep === 4}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next Agent Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Agent Step Indicator */}
      <div className="grid grid-cols-5 gap-2">
        {agentSteps.map((step) => {
          const StepIcon = step.icon;
          const isActive = activeStep === step.index;
          const isPassed = activeStep > step.index;

          return (
            <button
              key={step.id}
              onClick={() => { setIsPlaying(false); setActiveStep(step.index); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive 
                  ? 'bg-slate-800 border-blue-500 shadow-glow-sm' 
                  : isPassed
                  ? 'bg-slate-900/60 border-slate-700/60 opacity-80'
                  : 'bg-slate-900/40 border-slate-800 opacity-50 hover:opacity-80'
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1.5">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-blue-500 text-white' : isPassed ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {step.index + 1}
                </span>
                <span className="text-[10px] font-mono text-slate-400 truncate">{step.tag}</span>
              </div>
              <div className="text-xs font-bold text-white truncate">{step.name}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Agent Detailed View Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        {/* Agent Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl border ${current.iconColor}`}>
              <CurrentIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{current.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {current.tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{current.role}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Pipeline Stage</span>
            <span className="text-xs font-mono font-bold text-blue-400">Step {current.index + 1} of 5</span>
          </div>
        </div>

        {/* 4 Stage Sections: Message In -> Evidence -> Finding -> Handover Out */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Section 1: Input Received */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Input Message Received</span>
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">{current.messageReceived}</p>
          </div>

          {/* Section 2: Evidence Examined */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Evidence Examined</span>
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">{current.evidenceExamined}</p>
          </div>

          {/* Section 3: Finding Produced */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Finding Produced</span>
            </span>
            <p className="text-emerald-200 leading-relaxed font-sans font-medium">{dynamicFinding}</p>
          </div>

          {/* Section 4: Handover Destination */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Downstream Handover Target</span>
            </span>
            <p className="text-purple-200 leading-relaxed font-sans font-medium">{current.targetAgent}</p>
          </div>
        </div>

        {/* Expandable Actual Persisted JSON Message */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
          <button
            onClick={() => setIsJsonExpanded(!isJsonExpanded)}
            className="w-full px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Persisted Inter-Agent JSON Contract ({current.tag})</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-500">
              <span>{isJsonExpanded ? 'Hide Payload' : 'Inspect JSON'}</span>
              {isJsonExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isJsonExpanded && (
            <div className="p-4 border-t border-slate-800 relative animate-in slide-in-from-top-2 duration-150">
              <div className="absolute top-3 right-3">
                <button
                  onClick={handleCopyJson}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto p-2 bg-slate-950 rounded-lg max-h-60 leading-relaxed">
                {JSON.stringify(matchingMsg?.payload || {
                  incident_id: activeInvestigation?.id,
                  agent: current.name,
                  finding: current.findingProduced,
                  evidence_verified: true
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={onPrev}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Act 2: The Population</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          <span>Examine Counterfactual Evidence</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
