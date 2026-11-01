import React from 'react';
import { 
  X, 
  Activity, 
  Server, 
  Router, 
  Wifi, 
  Laptop, 
  Layers, 
  AlertOctagon, 
  Cpu, 
  HardDrive, 
  Clock, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { NetworkNodeData } from '../../types';
import { Badge } from '../common/Badge';

interface NodeDetailDrawerProps {
  node: NetworkNodeData | null;
  onClose: () => void;
  onNavigateEvidence: () => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  onNavigateEvidence,
}) => {
  if (!node) return null;

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-soft-lg flex flex-col z-20 overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
              {node.type} NODE DETAILS
            </span>
            <Badge 
              variant={node.status === 'fault' ? 'fault' : node.status === 'warning' ? 'warning' : 'healthy'}
              size="sm"
              dot
            >
              {node.status}
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mt-0.5 truncate max-w-[260px]">
            {node.label}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
        {/* Core Identifiers */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">IP / Subnet:</span>
            <span className="font-semibold text-slate-900">{node.ip}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Physical Zone:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[170px]">{node.zone}</span>
          </div>
          {node.details?.model && (
            <div className="flex justify-between">
              <span className="text-slate-500">Hardware Model:</span>
              <span className="font-medium text-slate-700 truncate max-w-[170px]">{node.details.model}</span>
            </div>
          )}
          {node.details?.uptime && (
            <div className="flex justify-between">
              <span className="text-slate-500">Sys Uptime:</span>
              <span className="text-slate-700">{node.details.uptime}</span>
            </div>
          )}
        </div>

        {/* Real-time Telemetry Metrics */}
        <div>
          <h4 className="text-[11px] font-mono uppercase font-semibold text-slate-500 mb-2">
            Real-Time Interface Telemetry
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-500 block font-mono">Throughput</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{node.throughput}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-500 block font-mono">Packet Loss</span>
              <span className={`text-sm font-bold font-mono ${
                node.packetLoss === '0.00%' || node.packetLoss === '0.001%' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {node.packetLoss}
              </span>
            </div>
            {node.details?.cpuLoad && (
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-500 block font-mono">CPU Utilization</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{node.details.cpuLoad}</span>
              </div>
            )}
            {node.details?.memoryLoad && (
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-500 block font-mono">Memory Load</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{node.details.memoryLoad}</span>
              </div>
            )}
          </div>
        </div>

        {/* Affected Devices Counter if present */}
        {node.affectedCount && node.affectedCount > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-center space-x-2 text-rose-800 font-semibold mb-1">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Cohort Isolation Alarm</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              This node directly terminates traffic for <strong className="font-bold">{node.affectedCount} impacted devices</strong>. 
              The Population Observer isolated this exact hop in the failure tree.
            </p>
          </div>
        )}

        {/* Active Alarms List */}
        <div>
          <h4 className="text-[11px] font-mono uppercase font-semibold text-slate-500 mb-2">
            Active Telemetry Alarms
          </h4>
          {node.details?.alarms && node.details.alarms.length > 0 ? (
            <div className="space-y-1.5">
              {node.details.alarms.map((alarm, idx) => (
                <div key={idx} className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span>{alarm}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-800 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Zero telemetry alarms recorded on this interface.</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <button
          onClick={onNavigateEvidence}
          className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
        >
          <span>Correlate in Evidence Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
