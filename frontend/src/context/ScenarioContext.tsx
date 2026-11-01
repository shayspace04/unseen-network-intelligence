import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  NavScreen, 
  Scenario, 
  Investigation, 
  AgentMessage, 
  EvidenceItem, 
  CompetingHypothesis, 
  DiagnosticReport,
  AgentInfo 
} from '../types';
import { 
  SCENARIOS, 
  INITIAL_INVESTIGATIONS, 
  AGENT_MESSAGES, 
  SUPPORTING_EVIDENCE, 
  CONTRADICTING_EVIDENCE,
  COMPETING_HYPOTHESES,
  DIAGNOSTIC_REPORTS,
  AGENTS
} from '../data/mockData';
import { 
  fetchRemoteScenarios, 
  fetchRemoteInvestigations, 
  triggerBackendInvestigation,
  fetchInvestigationMessages,
  fetchInvestigationEvidence,
  fetchInvestigationReport,
  fetchInvestigationEvents,
  fetchInvestigationAgents,
  InvestigationEvent
} from '../services/api';

interface ScenarioContextType {
  activeScreen: NavScreen;
  setActiveScreen: (screen: NavScreen) => void;
  scenarios: Scenario[];
  activeScenario: Scenario;
  selectScenario: (scenarioId: string) => void | Promise<void>;
  investigations: Investigation[];
  selectedInvestigationId: string | null;
  setSelectedInvestigationId: (id: string | null) => void;
  activeInvestigation: Investigation | null;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  activeReport: DiagnosticReport | null;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isRunningInvestigation: boolean;
  triggerInvestigationRun: (scenarioId?: string) => Promise<void>;
  filterStatus: 'all' | 'active' | 'investigating' | 'resolved';
  setFilterStatus: (status: 'all' | 'active' | 'investigating' | 'resolved') => void;
  agentMessages: AgentMessage[];
  evidenceItems: EvidenceItem[];
  competingHypotheses: CompetingHypothesis[];
  agentEvents: InvestigationEvent[];
  agentCards: AgentInfo[];
  isBackendConnected: boolean;
  isPresentationOpen: boolean;
  setIsPresentationOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export const ScenarioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<NavScreen>('overview');
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [investigations, setInvestigations] = useState<Investigation[]>(INITIAL_INVESTIGATIONS);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isRunningInvestigation, setIsRunningInvestigation] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'investigating' | 'resolved'>('all');

  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>(AGENT_MESSAGES);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([...SUPPORTING_EVIDENCE, ...CONTRADICTING_EVIDENCE]);
  const [competingHypotheses, setCompetingHypotheses] = useState<CompetingHypothesis[]>(COMPETING_HYPOTHESES);
  const [activeReport, setActiveReport] = useState<DiagnosticReport | null>(DIAGNOSTIC_REPORTS[0] || null);
  const [agentEvents, setAgentEvents] = useState<InvestigationEvent[]>([]);
  const [agentCards, setAgentCards] = useState<AgentInfo[]>(AGENTS);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);

  // Load scenarios and investigations from backend on mount
  const refreshData = async () => {
    try {
      const [remoteScenarios, remoteInvs] = await Promise.all([
        fetchRemoteScenarios(),
        fetchRemoteInvestigations()
      ]);

      if (remoteScenarios && remoteScenarios.length > 0) {
        setIsBackendConnected(true);
        setScenarios(remoteScenarios);
        const currentFound = remoteScenarios.find(s => s.id === activeScenario.id);
        if (currentFound) setActiveScenario(currentFound);
      } else {
        setIsBackendConnected(false);
      }

      if (remoteInvs && remoteInvs.length > 0) {
        setInvestigations(remoteInvs);
        if (!selectedInvestigationId || !remoteInvs.some(i => i.id === selectedInvestigationId)) {
          setSelectedInvestigationId(remoteInvs[0].id);
        }
      }
    } catch (err) {
      setIsBackendConnected(false);
      if (!selectedInvestigationId && INITIAL_INVESTIGATIONS[0]?.id) {
        setSelectedInvestigationId(INITIAL_INVESTIGATIONS[0].id);
      }
      console.warn('[UNSEEN] Using local fallback state:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // When selectedInvestigationId changes, fetch messages, evidence, and report from backend
  useEffect(() => {
    if (!selectedInvestigationId) return;

    let isMounted = true;
    const fetchIncidentDetails = async () => {
      try {
        const [msgs, evData, rep, events, agents] = await Promise.all([
          fetchInvestigationMessages(selectedInvestigationId),
          fetchInvestigationEvidence(selectedInvestigationId),
          fetchInvestigationReport(selectedInvestigationId),
          fetchInvestigationEvents(selectedInvestigationId),
          fetchInvestigationAgents(selectedInvestigationId)
        ]);

        if (!isMounted) return;

        if (msgs && msgs.length > 0) {
          setAgentMessages(msgs);
        }
        if (evData && evData.evidence.length > 0) {
          setEvidenceItems(evData.evidence);
        }
        if (evData && evData.hypotheses.length > 0) {
          setCompetingHypotheses(evData.hypotheses);
        }
        if (rep) {
          setActiveReport(rep);
        }
        if (events && events.length > 0) {
          setAgentEvents(events);
        }
        if (agents && agents.length > 0) {
          setAgentCards(agents);
        }
      } catch (err) {
        console.warn('[UNSEEN] Incident details fallback:', err);
      }
    };

    fetchIncidentDetails();
    return () => { isMounted = false; };
  }, [selectedInvestigationId]);

  const selectScenario = async (scenarioId: string) => {
    const found = scenarios.find(s => s.id === scenarioId) || SCENARIOS.find(s => s.id === scenarioId);
    if (found) {
      setActiveScenario(found);
      // Look for an existing investigation matching scenarioId or matching zone
      const matchingInv = investigations.find(i => 
        (i.scenarioId === scenarioId && i.zone === found.affectedZone) ||
        (i.scenarioId === scenarioId && !i.zone.includes("Transient"))
      ) || investigations.find(i => 
        i.scenarioId === scenarioId || 
        (i.zone && found.affectedZone && i.zone.toLowerCase().includes(found.affectedZone.toLowerCase().slice(0, 8)))
      );
      if (matchingInv) {
        setSelectedInvestigationId(matchingInv.id);
      } else if (isBackendConnected) {
        try {
          const runRes = await triggerBackendInvestigation(scenarioId);
          if (runRes && runRes.incident_id) {
            await refreshData();
            setSelectedInvestigationId(runRes.incident_id);
          }
        } catch (e) {
          console.warn('[UNSEEN] Auto-investigation trigger error:', e);
        }
      }
    }
  };

  const triggerInvestigationRun = async (scenarioId?: string) => {
    const targetId = scenarioId || activeScenario.id;
    selectScenario(targetId);
    setIsRunningInvestigation(true);

    try {
      const result = await triggerBackendInvestigation(targetId);

      if (result && result.incident_id) {
        await refreshData();
        setSelectedInvestigationId(result.incident_id);
      } else {
        // Fallback simulation delay
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.warn('[UNSEEN] Investigation run error:', err);
      await new Promise(r => setTimeout(r, 800));
    } finally {
      setIsRunningInvestigation(false);
      setActiveScreen('agents');
    }
  };

  const activeInvestigation = investigations.find(i => i.id === selectedInvestigationId) || investigations[0] || null;

  return (
    <ScenarioContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        scenarios,
        activeScenario,
        selectScenario,
        investigations,
        selectedInvestigationId,
        setSelectedInvestigationId,
        activeInvestigation,
        selectedReportId,
        setSelectedReportId,
        activeReport,
        selectedNodeId,
        setSelectedNodeId,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isRunningInvestigation,
        triggerInvestigationRun,
        filterStatus,
        setFilterStatus,
        agentMessages,
        evidenceItems,
        competingHypotheses,
        agentEvents,
        agentCards,
        isBackendConnected,
        isPresentationOpen,
        setIsPresentationOpen,
        refreshData
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = (): ScenarioContextType => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};
