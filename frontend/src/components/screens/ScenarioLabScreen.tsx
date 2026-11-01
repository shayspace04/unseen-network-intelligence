import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  Server, 
  Layers, 
  Globe, 
  Zap, 
  ArrowRight,
  RefreshCw,
  Info,
  Cable,
  Upload,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { SCENARIOS } from '../../data/mockData';
import { useScenario } from '../../context/ScenarioContext';
import { Badge } from '../common/Badge';
import { Scenario } from '../../types';
import { previewOrganizerTelemetry, investigateOrganizerTelemetry } from '../../services/api';

const ORGANIZER_PRESETS = {
  hardware_failure: `{
  "timestamp": "2026-10-14T07:05:49.619791Z",
  "device_id": "SW_CAMPUS_4",
  "metrics": {
    "cpu_utilization_pct": 99.9,
    "link_utilization_pct": 100.0,
    "packet_loss_pct": 28.51,
    "latency_ms": 926.46,
    "queue_drops": 13416,
    "interface_errors": 382
  },
  "status": "Critical"
}`,
  latency_spike: `{
  "timestamp": "2026-11-01T08:00:00.000000Z",
  "device_id": "SW_CAMPUS_2",
  "metrics": {
    "cpu_utilization_pct": 42.0,
    "link_utilization_pct": 65.5,
    "packet_loss_pct": 6.8,
    "latency_ms": 420.5,
    "queue_drops": 480,
    "interface_errors": 15
  },
  "status": "Warning"
}`,
  normal: `{
  "timestamp": "2026-11-01T08:00:00.000000Z",
  "device_id": "SW_CAMPUS_1",
  "metrics": {
    "cpu_utilization_pct": 14.2,
    "link_utilization_pct": 22.5,
    "packet_loss_pct": 0.0,
    "latency_ms": 4.1,
    "queue_drops": 0,
    "interface_errors": 0
  },
  "status": "Healthy"
}`,
  interop_aliases: `{
  "timestamp": "2026-11-01T08:00:00.000000Z",
  "device_id": "SW_CAMPUS_3",
  "metrics": {
    "cpu_utilization": 88.5,
    "link_utilization": 94.0,
    "packet_loss": 18.2,
    "latency_seconds": 0.725,
    "egress_queue_drops": 7450,
    "crc_errors": 210
  },
  "status": "Warning"
}`
};

export const ScenarioLabScreen: React.FC = () => {
  const { 
    scenarios,
    activeScenario, 
    selectScenario, 
    triggerInvestigationRun, 
    isRunningInvestigation 
  } = useScenario();

  const [organizerInput, setOrganizerInput] = useState<string>(ORGANIZER_PRESETS.hardware_failure);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [investigateResult, setInvestigateResult] = useState<any>(null);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isInvestigatingOrg, setIsInvestigatingOrg] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'dhcp-starvation': return <Layers className="w-5 h-5 text-amber-600" />;
      case 'wifi-degradation': return <Wifi className="w-5 h-5 text-indigo-600" />;
      case 'shared-link-congestion': return <Server className="w-5 h-5 text-purple-600" />;
      case 'dns-resolver-silent-drop': return <Globe className="w-5 h-5 text-rose-600" />;
      case 'multiple-simultaneous-faults': return <Zap className="w-5 h-5 text-rose-700" />;
      case 'healthy-baseline': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'ethernet-interface-fault': return <Cable className="w-5 h-5 text-cyan-600" />;
      default: return <FlaskConical className="w-5 h-5 text-blue-600" />;
    }
  };

  const handlePreview = async () => {
    setIsIngesting(true);
    setValidationError(null);
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(organizerInput.trim());
      } catch {
        // Test if jsonl
        parsed = organizerInput.trim();
      }
      const res = await previewOrganizerTelemetry(parsed);
      setPreviewResult(res);
    } catch (err: any) {
      setValidationError(err.message || 'Validation failed');
      setPreviewResult(null);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleInvestigateOrganizer = async () => {
    setIsInvestigatingOrg(true);
    setValidationError(null);
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(organizerInput.trim());
      } catch {
        parsed = organizerInput.trim();
      }
      const res = await investigateOrganizerTelemetry(parsed);
      setInvestigateResult(res);
    } catch (err: any) {
      setValidationError(err.message || 'Investigation failed');
    } finally {
      setIsInvestigatingOrg(false);
    }
  };

  const copyContractJSON = () => {
    if (investigateResult?.canonical_contract) {
      navigator.clipboard.writeText(JSON.stringify(investigateResult.canonical_contract, null, 2));
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-mono uppercase font-semibold text-slate-500">Testbed & Simulation Bench</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Network Telemetry Simulation Scenarios
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Switch scenarios to inject controlled telemetry anomalies. Observe how the 5-agent squad identifies invisible cohorts without threshold alerting.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => triggerInvestigationRun(activeScenario.id)}
            disabled={isRunningInvestigation}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isRunningInvestigation ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Agent Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Investigation on Active Scenario</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario: Scenario) => {
          const isActive = activeScenario.id === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`bg-white border rounded-xl p-5 shadow-soft-sm flex flex-col justify-between transition-all ${
                isActive 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-soft-md bg-blue-50/10' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    {getScenarioIcon(scenario.id)}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Badge variant={isActive ? 'healthy' : 'outline'} size="sm">
                      {isActive ? 'CURRENTLY ACTIVE' : scenario.badge}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{scenario.name}</h3>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{scenario.category}</span>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {scenario.description}
                </p>

                {/* Metrics Box */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monitored</span>
                    <span className="font-bold text-slate-900">{scenario.monitoredDevices}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Global Health</span>
                    <span className="font-bold text-emerald-600">{scenario.aggregateHealthPct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Failing Cohort</span>
                    <span className={`font-bold ${scenario.affectedDevices > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {scenario.affectedDevices} nodes
                    </span>
                  </div>
                </div>

                {/* Observable Symptoms */}
                <div className="mt-4 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 block">
                    Telemetry Signature
                  </span>
                  {scenario.symptoms.slice(0, 2).map((symptom, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                      <span className="truncate">{symptom}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center space-x-2">
                <button
                  onClick={() => selectScenario(scenario.id)}
                  disabled={isActive}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  }`}
                >
                  {isActive ? 'Active Baseline' : 'Select Scenario'}
                </button>

                <button
                  onClick={() => triggerInvestigationRun(scenario.id)}
                  disabled={isRunningInvestigation}
                  className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
                  title="Run Multi-Agent Investigation on this scenario"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Investigate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* NetCoop AI Organizer Telemetry Ingestion & Interoperability Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-mono uppercase font-semibold text-slate-500">Official NetCoop AI Hackathon Adapter</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Organizer Telemetry Ingestion & Interoperability Bench
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Directly ingest external organizer telemetry (single record, batch array, or JSON Lines). Normalized into UNSEEN without fabricating unsupplied topology or RF fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Presets:</span>
            <button
              onClick={() => {
                setOrganizerInput(ORGANIZER_PRESETS.hardware_failure);
                setPreviewResult(null);
                setInvestigateResult(null);
                setValidationError(null);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium transition-colors"
            >
              Hardware Failure (Official)
            </button>
            <button
              onClick={() => {
                setOrganizerInput(ORGANIZER_PRESETS.latency_spike);
                setPreviewResult(null);
                setInvestigateResult(null);
                setValidationError(null);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-medium transition-colors"
            >
              Latency Spike
            </button>
            <button
              onClick={() => {
                setOrganizerInput(ORGANIZER_PRESETS.normal);
                setPreviewResult(null);
                setInvestigateResult(null);
                setValidationError(null);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium transition-colors"
            >
              Normal Switch
            </button>
            <button
              onClick={() => {
                setOrganizerInput(ORGANIZER_PRESETS.interop_aliases);
                setPreviewResult(null);
                setInvestigateResult(null);
                setValidationError(null);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium transition-colors"
            >
              Field & Unit Aliases
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>Raw Organizer Telemetry Payload (JSON / JSONL)</span>
              </span>
              <span className="text-[11px] text-slate-400">Strict Schema Isolation</span>
            </div>

            <textarea
              value={organizerInput}
              onChange={(e) => setOrganizerInput(e.target.value)}
              rows={12}
              className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 leading-relaxed resize-none shadow-inner"
              placeholder="Paste JSON or JSON Lines here..."
            />

            <div className="flex items-center space-x-3 pt-1">
              <button
                onClick={handlePreview}
                disabled={isIngesting || isInvestigatingOrg}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-300 flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Validate & Preview Ingestion</span>
              </button>

              <button
                onClick={handleInvestigateOrganizer}
                disabled={isIngesting || isInvestigatingOrg}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {isInvestigatingOrg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Run 5-Agent Investigation</span>
              </button>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Ingestion Interoperability Error</span>
                  <span className="text-[11px] font-mono">{validationError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Preview & Diagnostic Report Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-Agent Adjudication & Contract Output</span>
              </span>
              {previewResult && (
                <span className="text-[11px] text-indigo-600 font-semibold">
                  {previewResult.metadata?.valid_records_normalized} Record(s) Normalized
                </span>
              )}
            </div>

            {investigateResult ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 shadow-inner font-mono text-xs max-h-[380px] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Verdict</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {investigateResult.canonical_contract?.verdict || investigateResult.report?.verdict}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Confidence</span>
                    <span className="font-bold text-indigo-600 text-sm">
                      {Math.round((investigateResult.canonical_contract?.confidence || investigateResult.report?.confidenceLevel) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Diagnosed Root Cause</span>
                  <p className="text-slate-800 font-sans text-xs bg-white p-2.5 rounded border border-slate-200">
                    {investigateResult.canonical_contract?.suspected_root_cause || investigateResult.report?.title}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 uppercase">Canonical Diagnostic JSON Contract</span>
                    <button
                      onClick={copyContractJSON}
                      className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      {copiedContract ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedContract ? 'Copied!' : 'Copy Contract'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded text-[11px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(investigateResult.canonical_contract, null, 2)}
                  </pre>
                </div>
              </div>
            ) : previewResult ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700">Normalized Telemetry Preview</span>
                  {previewResult.metadata?.stale_records_count > 0 ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Historical Incident (&gt;300s TTL)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Fresh Telemetry (&lt;300s)</span>
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-1 px-2">Device</th>
                        <th className="py-1 px-2">Status</th>
                        <th className="py-1 px-2">CPU%</th>
                        <th className="py-1 px-2">Loss%</th>
                        <th className="py-1 px-2">Lat (ms)</th>
                        <th className="py-1 px-2">Q Drops</th>
                        <th className="py-1 px-2">CRC Err</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.preview?.map((d: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 text-slate-800">
                          <td className="py-1 px-2 font-semibold">{d.deviceId}</td>
                          <td className="py-1 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              d.status === 'critical' ? 'bg-rose-100 text-rose-800' :
                              d.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-1 px-2">{d.cpuUtilizationPct ?? 'N/A'}%</td>
                          <td className="py-1 px-2">{d.packetLossPct}%</td>
                          <td className="py-1 px-2">{d.latencyMs}</td>
                          <td className="py-1 px-2">{d.egressQueueDrops ?? 0}</td>
                          <td className="py-1 px-2">{d.interfaceErrors ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-900 space-y-1">
                  <div className="flex items-center space-x-1 font-semibold">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Strict Ground-Truth Isolation & Missing Field Policy:</span>
                  </div>
                  <p className="text-[10px] text-blue-800 leading-normal">
                    Throughput, AP, VLAN, and RF signal strength are preserved as <code>None/null</code> (not zeroed or fabricated).
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[280px] border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <FileCode className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-medium text-slate-600">Awaiting Ingestion Action</span>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Select a preset or paste telemetry JSON, then click "Validate & Preview Ingestion" or "Run 5-Agent Investigation".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
