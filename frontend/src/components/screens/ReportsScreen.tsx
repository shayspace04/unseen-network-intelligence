import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  ArrowUpRight, 
  ShieldCheck, 
  Calendar, 
  Download, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { DIAGNOSTIC_REPORTS } from '../../data/mockData';
import { DiagnosticReport } from '../../types';
import { Badge } from '../common/Badge';
import { ReportViewerModal } from '../reports/ReportViewerModal';
import { useScenario } from '../../context/ScenarioContext';
import { fetchRemoteReports } from '../../services/api';

export const ReportsScreen: React.FC = () => {
  const { selectedReportId, setSelectedReportId, activeReport: contextReport, isBackendConnected } = useScenario();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalReport, setModalReport] = useState<DiagnosticReport | null>(null);
  const [remoteReports, setRemoteReports] = useState<DiagnosticReport[]>([]);

  useEffect(() => {
    fetchRemoteReports().then((data) => {
      if (data && data.length > 0) {
        setRemoteReports(data);
      }
    });
  }, []);

  const allReports = remoteReports.length > 0
    ? remoteReports
    : (contextReport && !DIAGNOSTIC_REPORTS.some(r => r.id === contextReport.id)
        ? [contextReport, ...DIAGNOSTIC_REPORTS]
        : DIAGNOSTIC_REPORTS);

  const filteredReports = allReports.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenReport = (report: DiagnosticReport) => {
    setModalReport(report);
    setSelectedReportId(report.id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by ID, keyword, or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing {filteredReports.length} of {DIAGNOSTIC_REPORTS.length} synthesized reports
        </div>
      </div>

      {!isBackendConnected && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Offline Fallback Mode:</strong> The reports below are static mock documents. Connect to FastAPI backend on port 8000 for live adjudicated reports.</span>
          </div>
          <span className="font-mono text-[10px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-800">SIMULATED FALLBACK</span>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            onClick={() => handleOpenReport(report)}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    {report.id}
                  </span>
                  <Badge variant={report.severity === 'Critical' ? 'fault' : 'warning'}>
                    {report.severity}
                  </Badge>
                  {report.verdict && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {report.verdict}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{report.createdAt.split(' ')[0]}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {report.title}
              </h3>

              <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-500 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Confidence: <strong className="text-slate-800">{(report.confidenceLevel * 100).toFixed(0)}%</strong></span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenReport(report);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs flex items-center space-x-1 transition-colors"
              >
                <span>Read Full Report</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Viewer Modal */}
      <ReportViewerModal
        report={modalReport}
        isOpen={!!modalReport}
        onClose={() => setModalReport(null)}
      />
    </div>
  );
};
