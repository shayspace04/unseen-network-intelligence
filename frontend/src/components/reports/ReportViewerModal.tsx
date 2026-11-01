import React from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Server,
  ArrowRight
} from 'lucide-react';
import { DiagnosticReport } from '../../types';
import { Badge } from '../common/Badge';

interface ReportViewerModalProps {
  report: DiagnosticReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-soft-lg border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Actions */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              {report.id}
            </span>
            <Badge variant={report.severity === 'Critical' ? 'fault' : 'warning'}>
              {report.severity.toUpperCase()} SEVERITY
            </Badge>
            {report.verdict && (
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                report.verdict === 'NO_FAULT_DETECTED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : report.verdict === 'ABSTAIN_INSUFFICIENT_EVIDENCE'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                VERDICT: {report.verdict}
              </span>
            )}
            <span className="text-xs text-slate-500 font-mono">Incident: {report.incidentId}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => alert(`Exporting ${report.id} as PDF...`)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="Download Report"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable/Readable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-blue-600 font-bold">
                  UNSEEN MULTI-AGENT ADJUDICATION REPORT
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-1">
                  {report.title}
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Zone: {report.zone} | Generated: {report.createdAt}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Adjudicator Confidence</span>
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {(report.confidenceLevel * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              1. Executive Summary
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {report.executiveSummary}
            </p>
          </div>

          {/* Root Cause Analysis */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              2. Technical Root-Cause Analysis
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {report.rootCauseAnalysis}
            </p>
          </div>

          {/* Counterfactual Delta */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              3. Counterfactual Twin-Cohort Delta
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {report.counterfactualDelta}
            </p>
          </div>

          {/* Remedial Recommendations */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              4. Prescriptive Remediation Actions
            </h3>
            <div className="space-y-2">
              {report.recommendedActions.map((rec, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={rec.urgency === 'immediate' ? 'fault' : 'warning'} 
                        size="sm"
                      >
                        {rec.urgency.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-slate-900">{rec.action}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Target Subsystem: <strong className="text-slate-700">{rec.targetSystem}</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                    <span>ETA: {rec.estimatedResolution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Validated by {report.leadAdjudicator} ({report.agentTranscriptsCount} rounds)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
