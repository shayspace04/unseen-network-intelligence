import React from 'react';
import { 
  X, 
  Bot, 
  MapPin, 
  Users, 
  AlertOctagon, 
  ShieldCheck, 
  Layers, 
  FileText,
  Clock,
  Network
} from 'lucide-react';
import { Investigation } from '../../types';
import { Badge } from '../common/Badge';

interface InvestigationDetailModalProps {
  investigation: Investigation | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateEvidence: () => void;
  onNavigateReport: () => void;
}

export const InvestigationDetailModal: React.FC<InvestigationDetailModalProps> = ({
  investigation,
  isOpen,
  onClose,
  onNavigateEvidence,
  onNavigateReport,
}) => {
  if (!isOpen || !investigation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-soft-lg border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              {investigation.id}
            </span>
            <Badge 
              variant={investigation.status === 'investigating' ? 'warning' : investigation.status === 'active' ? 'fault' : 'healthy'}
            >
              {investigation.status.toUpperCase()}
            </Badge>
            <span className="text-xs text-slate-500 font-mono flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{investigation.timestamp}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {investigation.title}
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {investigation.summary}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Affected Cohort</span>
              <span className="text-lg font-bold text-rose-600 font-mono">
                {investigation.affectedCount} devices
              </span>
              <span className="text-[10px] text-slate-500 block">of {investigation.monitoredCount} monitored</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Aggregate Health</span>
              <span className="text-lg font-bold text-emerald-600 font-mono">
                {investigation.aggregateHealthPct}%
              </span>
              <span className="text-[10px] text-slate-500 block">apparent healthy</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Fault Confidence</span>
              <span className="text-lg font-bold text-blue-600 font-mono">
                {(investigation.confidence * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 block">Adjudicator score</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Lead Agent</span>
              <span className="text-xs font-semibold text-slate-800 block truncate mt-1">
                {investigation.leadAgent}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Multi-Agent Squad</span>
            </div>
          </div>

          {/* Topological Dependency */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
              <Network className="w-4 h-4 text-blue-600" />
              <span>Isolated Dependency & Affected Scope</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Primary Dependency:</span>
                <span className="font-mono text-slate-900 font-medium">{investigation.primaryDependency}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Affected Subnet:</span>
                <span className="font-mono text-slate-900 font-medium">{investigation.affectedSubnet}</span>
              </div>
            </div>
          </div>

          {/* Observable Symptoms */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500">
              Observed Telemetry Symptoms
            </h4>
            <div className="space-y-1.5">
              {investigation.symptoms.map((symptom, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{symptom}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onNavigateEvidence();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspect Evidence Room</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateReport();
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Synthesized Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
