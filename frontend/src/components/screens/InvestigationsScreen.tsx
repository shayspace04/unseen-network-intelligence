import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';
import { Badge } from '../common/Badge';
import { Investigation } from '../../types';
import { InvestigationDetailModal } from '../investigation/InvestigationDetailModal';

export const InvestigationsScreen: React.FC = () => {
  const { 
    investigations, 
    selectedInvestigationId, 
    setSelectedInvestigationId,
    setActiveScreen,
    filterStatus,
    setFilterStatus,
    isBackendConnected
  } = useScenario();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalInvestigation, setModalInvestigation] = useState<Investigation | null>(null);

  const filteredInvestigations = investigations.filter((inv) => {
    const matchesFilter = filterStatus === 'all' || inv.status === filterStatus;
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.suspectedFault.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenDetail = (inv: Investigation) => {
    setModalInvestigation(inv);
    setSelectedInvestigationId(inv.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search + Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, zone, suspected fault, or subnet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterStatus === 'all' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Incidents ({investigations.length})
          </button>
          <button
            onClick={() => setFilterStatus('investigating')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterStatus === 'investigating' 
                ? 'bg-white text-amber-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Investigating
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterStatus === 'active' 
                ? 'bg-white text-rose-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Faults
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterStatus === 'resolved' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {!isBackendConnected && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Offline Fallback Mode:</strong> The investigations below are static mock records. Start backend on port 8000 for live investigations.</span>
          </div>
          <span className="font-mono text-[10px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-800">SIMULATED FALLBACK</span>
        </div>
      )}

      {/* Investigations Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Affected Zone</th>
                <th className="py-3 px-4">Affected / Monitored</th>
                <th className="py-3 px-4">Suspected Root Cause</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvestigations.map((inv) => (
                <tr 
                  key={inv.id} 
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => handleOpenDetail(inv)}
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 group-hover:underline">
                    {inv.id}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-900 max-w-[200px]">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{inv.zone}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-rose-600">{inv.affectedCount} nodes</span>
                    <span className="text-slate-400 text-[11px] block">of {inv.monitoredCount} ({inv.aggregateHealthPct}% global)</span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 max-w-[240px]">
                    <span className="font-medium text-slate-900 block truncate">{inv.suspectedFault}</span>
                    <span className="text-[11px] text-slate-500 font-mono block truncate">{inv.primaryDependency}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full" 
                          style={{ width: `${inv.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {(inv.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge 
                      variant={inv.status === 'investigating' ? 'warning' : inv.status === 'active' ? 'fault' : 'healthy'}
                      dot
                    >
                      {inv.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {inv.timestamp}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(inv);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Review</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInvestigations.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-mono">
                    No investigations match current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Details Modal */}
      <InvestigationDetailModal
        investigation={modalInvestigation}
        isOpen={!!modalInvestigation}
        onClose={() => setModalInvestigation(null)}
        onNavigateEvidence={() => setActiveScreen('evidence')}
        onNavigateReport={() => setActiveScreen('reports')}
      />
    </div>
  );
};
