import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Router, 
  Layers, 
  Wifi, 
  Laptop, 
  Server
} from 'lucide-react';
import { NetworkNodeData } from '../../types';
import { cn } from '../../utils/cn';

export const NetworkCustomNode = memo(({ data, selected }: any) => {
  const nodeData = data as NetworkNodeData;

  const getIcon = () => {
    switch (nodeData.type) {
      case 'router':
        return <Router className="w-4 h-4" />;
      case 'switch':
        return <Server className="w-4 h-4" />;
      case 'access-point':
        return <Wifi className="w-4 h-4" />;
      case 'vlan':
        return <Layers className="w-4 h-4" />;
      case 'device':
        return <Laptop className="w-4 h-4" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const statusStyles = {
    healthy: {
      border: 'border-emerald-300 hover:border-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBox: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      ring: 'ring-emerald-500/20',
      indicator: 'bg-emerald-500',
    },
    warning: {
      border: 'border-amber-300 hover:border-amber-400',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBox: 'bg-amber-50 text-amber-600 border-amber-200',
      ring: 'ring-amber-500/20',
      indicator: 'bg-amber-500',
    },
    fault: {
      border: 'border-rose-400 hover:border-rose-500 shadow-glow-fault',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBox: 'bg-rose-50 text-rose-600 border-rose-200',
      ring: 'ring-rose-500/30',
      indicator: 'bg-rose-500 animate-pulse',
    },
    critical: {
      border: 'border-rose-500 hover:border-rose-600 shadow-glow-fault',
      badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      iconBox: 'bg-rose-100 text-rose-700 border-rose-300',
      ring: 'ring-rose-600/40',
      indicator: 'bg-rose-600 animate-ping',
    },
  };

  const currentStatus = statusStyles[nodeData.status] || statusStyles.healthy;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border-2 p-3 min-w-[210px] shadow-soft-sm transition-all text-slate-800 cursor-pointer',
        currentStatus.border,
        selected && 'ring-4 ring-blue-500/30 border-blue-600 shadow-soft-md'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />

      {/* Header: Type icon + Status Indicator */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className={cn('p-1.5 rounded-lg border', currentStatus.iconBox)}>
            {getIcon()}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-600 tracking-wide block">
              {nodeData.type}
            </span>
            <span className="text-xs font-semibold text-slate-900 block truncate max-w-[130px]">
              {nodeData.label}
            </span>
          </div>
        </div>

        <span className={cn('w-2 h-2 rounded-full shrink-0', currentStatus.indicator)} />
      </div>

      {/* IP & Zone info */}
      <div className="space-y-1 text-[11px] font-mono text-slate-600">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">IP:</span>
          <span className="font-semibold text-slate-800 truncate max-w-[120px]">{nodeData.ip}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Loss:</span>
          <span className={cn(
            'font-bold',
            nodeData.packetLoss === '0.00%' || nodeData.packetLoss === '0.001%'
              ? 'text-emerald-700'
              : parseFloat(nodeData.packetLoss) > 5
              ? 'text-rose-700'
              : 'text-amber-700'
          )}>
            {nodeData.packetLoss}
          </span>
        </div>
      </div>

      {/* Affected Badge if fault/warning */}
      {nodeData.affectedCount && nodeData.affectedCount > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-rose-800 uppercase">Affected</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono text-[10px]">
            {nodeData.affectedCount} nodes
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
});

NetworkCustomNode.displayName = 'NetworkCustomNode';
