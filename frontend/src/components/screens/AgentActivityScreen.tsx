import React, { useState } from 'react';
import { 
  Eye, 
  GitCompare, 
  Network, 
  AlertTriangle, 
  ShieldCheck, 
  Bot, 
  Copy, 
  Check, 
  Filter, 
  ArrowRight,
  Terminal,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { AgentInfo, AgentMessage } from '../../types';
import { useScenario } from '../../context/ScenarioContext';

export const AgentActivityScreen: React.FC = () => {
  const { 
    agentCards, 
    agentMessages, 
    agentEvents, 
    activeInvestigation,
    activeScenario,
    isBackendConnected
  } = useScenario();

  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({
    'msg-01': true,
    'msg-04': true,
    'msg-05': true
  });

  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case 'Eye': return <Eye className="w-5 h-5 text-blue-600" />;
      case 'GitCompare': return <GitCompare className="w-5 h-5 text-indigo-600" />;
      case 'Network': return <Network className="w-5 h-5 text-emerald-600" />;
      case 'AlertTriangle': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-purple-600" />;
      default: return <Bot className="w-5 h-5 text-slate-600" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPayloads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyJson = (msg: AgentMessage) => {
    navigator.clipboard.writeText(JSON.stringify(msg.payload, null, 2));
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const filteredMessages = agentMessages.filter(msg => {
    if (selectedAgentFilter === 'all') return true;
    return msg.fromAgent === selectedAgentFilter || msg.toAgent === selectedAgentFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono uppercase font-semibold text-slate-500">Autonomous Squad</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            5 Specialized Autonomous Agents in Coordinated Investigation Mesh
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Active Case: <strong className="text-slate-800 font-mono">{activeInvestigation?.id || 'INV-BENCHMARK'}</strong> ({activeScenario.name}). Agents communicate via structured JSON messages with empirical falsification.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
            Consensus: {activeInvestigation ? `${(activeInvestigation.confidence * 100).toFixed(0)}% Verified` : '94% Verified'}
          </div>
        </div>
      </div>

      {!isBackendConnected && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Offline Fallback Mode:</strong> The messages below are static demo snapshots. Start backend on port 8000 to trace live multi-agent execution events.</span>
          </div>
          <span className="font-mono text-[10px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-800">SIMULATED FALLBACK</span>
        </div>
      )}

      {/* 5 Specialized Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {agentCards.map((agent: AgentInfo) => (
          <div
            key={agent.id}
            className={`bg-white border rounded-xl p-4 shadow-soft-sm flex flex-col justify-between transition-all hover:shadow-soft-md ${
              selectedAgentFilter === agent.name 
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/10' 
                : 'border-slate-200'
            }`}
          >
            <div>
              {/* Agent Head */}
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  {getAgentIcon(agent.iconName)}
                </div>
                <Badge 
                  variant={agent.status === 'verified' ? 'healthy' : agent.status === 'debating' ? 'warning' : 'info'}
                  size="sm"
                  dot
                >
                  {agent.status}
                </Badge>
              </div>

              {/* Agent Titles */}
              <h3 className="text-xs font-bold text-slate-900 font-sans">{agent.name}</h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{agent.agentTag}</p>
              
              <div className="mt-2.5">
                <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 block">Core Role</span>
                <p className="text-[11px] text-slate-600 font-medium leading-snug">{agent.role}</p>
              </div>

              <div className="mt-3">
                <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 block">Latest Discovery</span>
                <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100 mt-1 leading-snug">
                  {agent.latestFinding}
                </p>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-bold text-blue-600">{(agent.confidenceScore * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Events Activity Log if present */}
      {agentEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-2">
          <div className="flex items-center space-x-2 text-slate-700 font-bold mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Live Agent Execution Trace ({agentEvents.length} events logged in SQLite)</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-2">
            {agentEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-200">
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-slate-400">{ev.timestamp}</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{ev.agent_name}</span>
                  <span className="text-slate-700 truncate">{ev.description}</span>
                </div>
                <Badge variant="outline" size="sm">{ev.event_type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Communication Mesh Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-soft-sm overflow-hidden">
        {/* Timeline Header & Filter */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Inter-Agent Message Exchange Timeline (JSON Wire Format 1.0.0)
            </h3>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Filter by Agent:</span>
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium text-xs focus:outline-none"
            >
              <option value="all">All Agents ({agentMessages.length} messages)</option>
              {agentCards.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Feed */}
        <div className="divide-y divide-slate-100 p-6 space-y-4">
          {filteredMessages.map((msg: AgentMessage) => {
            const isExpanded = !!expandedPayloads[msg.id];
            const isCopied = copiedMessageId === msg.id;

            return (
              <div 
                key={msg.id}
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 transition-all hover:bg-slate-50"
              >
                {/* Message Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      {msg.id}
                    </span>
                    <span className="font-semibold text-xs text-slate-900">{msg.fromAgent}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-xs text-slate-700">{msg.toAgent}</span>
                    
                    <Badge variant="outline" size="sm" className="font-mono">
                      {msg.type}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono text-slate-500">
                    <span>{msg.timestamp}</span>
                    <Badge variant={msg.verdict === 'supported' ? 'healthy' : 'warning'} size="sm">
                      {msg.verdict || 'verified'}
                    </Badge>
                  </div>
                </div>

                {/* Topic line */}
                <div className="mb-2 text-xs font-medium text-slate-800 flex items-center space-x-2">
                  <span className="text-slate-400 font-mono">TOPIC:</span>
                  <span>{msg.topic}</span>
                </div>

                {/* Expandable JSON Payload */}
                <div className="mt-2">
                  <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-3 py-1.5 rounded-t-lg text-xs font-mono border-b border-slate-800">
                    <button
                      onClick={() => toggleExpand(msg.id)}
                      className="text-slate-300 hover:text-white flex items-center space-x-1.5 focus:outline-none"
                    >
                      <span>{isExpanded ? '▼ Hide Structured Payload' : '► Show Structured Payload'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyJson(msg)}
                      className="text-slate-400 hover:text-white flex items-center space-x-1 text-[11px] transition-colors"
                      title="Copy JSON Payload"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <pre className="bg-slate-950 text-emerald-400 p-3.5 rounded-b-lg font-mono text-xs overflow-x-auto leading-relaxed border border-t-0 border-slate-800 shadow-inner">
                      {JSON.stringify(msg.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
