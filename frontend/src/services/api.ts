/**
 * UNSEEN API Service Layer
 * Interoperable client connecting frontend UI with FastAPI multi-agent backend
 */

import { 
  Scenario, 
  Investigation, 
  DiagnosticReport, 
  AgentMessage, 
  EvidenceItem, 
  CompetingHypothesis,
  AgentInfo,
  NetworkNodeData
} from '../types';

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  timestamp?: string;
  agents_ready: number;
  db_status: string;
}

export interface InvestigationEvent {
  id: number;
  incident_id: string;
  timestamp: string;
  event_type: string;
  agent_name: string;
  description: string;
  payload?: any;
}

const API_BASE = 'http://localhost:8000';

export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRemoteScenarios(): Promise<Scenario[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/scenarios`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const rawList = await res.json();
    return rawList.map((r: any): Scenario => ({
      id: r.id,
      name: r.name,
      badge: r.badge || 'Benchmark',
      category: r.category || 'General',
      description: r.description,
      monitoredDevices: r.monitoredDevices ?? r.monitored_devices ?? 500,
      healthyDevices: r.healthyDevices ?? r.healthy_devices ?? 494,
      affectedDevices: r.affectedDevices ?? r.affected_devices ?? 6,
      aggregateHealthPct: r.aggregateHealthPct ?? r.aggregate_health_pct ?? 98.8,
      affectedZone: r.affectedZone ?? r.affected_zone ?? 'Campus Wide',
      suspectedFault: r.suspectedFault ?? r.suspected_fault ?? 'Under Investigation',
      confidenceScore: r.confidenceScore ?? r.confidence_score ?? 0.9,
      symptoms: r.symptoms || [],
      recommendedFix: r.recommendedFix ?? r.recommended_fix ?? 'No fix specified'
    }));
  } catch {
    return null;
  }
}

export async function fetchRemoteTopology(scenarioId: string = 'dhcp-starvation'): Promise<{ nodes: any[]; edges: any[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/topology?scenario_id=${encodeURIComponent(scenarioId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRemoteInvestigations(): Promise<Investigation[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const rawList = await res.json();
    return rawList.map((r: any): Investigation => ({
      id: r.id,
      scenarioId: r.scenarioId ?? r.scenario_id,
      title: r.title,
      zone: r.zone,
      affectedCount: r.affectedCount ?? r.affected_count ?? 0,
      healthyCount: r.healthyCount ?? r.healthy_count ?? 0,
      monitoredCount: r.monitoredCount ?? r.monitored_count ?? 500,
      aggregateHealthPct: r.aggregateHealthPct ?? r.aggregate_health_pct ?? 100,
      suspectedFault: r.suspectedFault ?? r.suspected_fault ?? 'Under Investigation',
      confidence: r.confidence ?? 0.0,
      status: r.status ?? 'investigating',
      timestamp: r.timestamp ?? '',
      leadAgent: r.leadAgent ?? r.lead_agent ?? 'Adjudicator',
      summary: r.summary ?? '',
      primaryDependency: r.primaryDependency ?? r.primary_dependency ?? '',
      symptoms: r.symptoms ?? [],
      affectedSubnet: r.affectedSubnet ?? r.affected_subnet ?? ''
    }));
  } catch {
    return null;
  }
}

export async function triggerBackendInvestigation(scenarioId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchInvestigationEvents(incidentId: string): Promise<InvestigationEvent[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations/${incidentId}/events`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchInvestigationMessages(incidentId: string): Promise<AgentMessage[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations/${incidentId}/messages`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const rawList = await res.json();
    return rawList.map((m: any): AgentMessage => ({
      id: m.message_id || m.id,
      fromAgent: m.sender || m.fromAgent,
      toAgent: m.recipient || m.toAgent,
      type: m.message_type || m.type,
      timestamp: m.timestamp,
      topic: m.topic,
      payload: m.payload || {},
      verdict: m.verdict
    }));
  } catch {
    return null;
  }
}

export async function fetchInvestigationReport(incidentId: string): Promise<DiagnosticReport | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations/${incidentId}/report`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const r = await res.json();
    return {
      id: r.id,
      incidentId: r.incidentId ?? r.incident_id,
      title: r.title,
      createdAt: r.createdAt ?? r.created_at,
      leadAdjudicator: r.leadAdjudicator ?? r.lead_adjudicator,
      confidenceLevel: r.confidenceLevel ?? r.confidence_level,
      severity: r.severity,
      zone: r.zone,
      executiveSummary: r.executiveSummary ?? r.executive_summary,
      rootCauseAnalysis: r.rootCauseAnalysis ?? r.root_cause_analysis,
      counterfactualDelta: r.counterfactualDelta ?? r.counterfactual_delta,
      telemetryEvidenceCount: r.telemetryEvidenceCount ?? r.telemetry_evidence_count,
      recommendedActions: (r.recommendedActions ?? r.recommended_actions ?? []).map((a: any) => ({
        action: a.action,
        urgency: a.urgency,
        estimatedResolution: a.estimatedResolution ?? a.estimated_resolution,
        targetSystem: a.targetSystem ?? a.target_system
      })),
      agentTranscriptsCount: r.agentTranscriptsCount ?? r.agent_transcripts_count ?? 5,
      verdict: r.verdict
    };
  } catch {
    return null;
  }
}

export async function fetchInvestigationEvidence(incidentId: string): Promise<{ evidence: EvidenceItem[]; hypotheses: CompetingHypothesis[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations/${incidentId}/evidence`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      evidence: (data.evidence || []).map((e: any): EvidenceItem => ({
        id: e.id,
        category: e.category,
        metric: e.metric,
        observation: e.observation,
        comparisonNote: e.comparisonNote ?? e.comparison_note ?? '',
        impactWeight: e.impactWeight ?? e.impact_weight ?? 'Medium',
        sourceAgent: e.sourceAgent ?? e.source_agent ?? 'Fault Investigator',
        timestamp: e.timestamp
      })),
      hypotheses: (data.hypotheses || []).map((h: any): CompetingHypothesis => ({
        id: h.id,
        title: h.title,
        proposedBy: h.proposedBy ?? h.proposed_by ?? 'Fault Investigator',
        probability: h.probability ?? 0.5,
        status: h.status ?? 'evaluating',
        supportingArgs: h.supportingArgs ?? h.supporting_args ?? [],
        counterArgs: h.counterArgs ?? h.counter_args ?? [],
        adjudicationNote: h.adjudicationNote ?? h.adjudication_note ?? ''
      }))
    };
  } catch {
    return null;
  }
}

export async function fetchInvestigationAgents(incidentId: string): Promise<AgentInfo[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations/${incidentId}/agents`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRemoteReports(): Promise<DiagnosticReport[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const rawList = await res.json();
    return rawList.map((r: any): DiagnosticReport => ({
      id: r.id,
      incidentId: r.incidentId ?? r.incident_id,
      title: r.title,
      createdAt: r.createdAt ?? r.created_at,
      leadAdjudicator: r.leadAdjudicator ?? r.lead_adjudicator,
      confidenceLevel: r.confidenceLevel ?? r.confidence_level,
      severity: r.severity,
      zone: r.zone,
      executiveSummary: r.executiveSummary ?? r.executive_summary,
      rootCauseAnalysis: r.rootCauseAnalysis ?? r.root_cause_analysis,
      counterfactualDelta: r.counterfactualDelta ?? r.counterfactual_delta,
      telemetryEvidenceCount: r.telemetryEvidenceCount ?? r.telemetry_evidence_count,
      recommendedActions: r.recommendedActions ?? r.recommended_actions ?? [],
      agentTranscriptsCount: r.agentTranscriptsCount ?? r.agent_transcripts_count,
      verdict: r.verdict
    }));
  } catch {
    return null;
  }
}

export async function fetchInvestigationContract(incidentId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/investigations/${incidentId}/contract`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOrganizerFixtures(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/organizer/fixtures`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function previewOrganizerTelemetry(rawInput: any): Promise<{ success: boolean; metadata: any; preview: any[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/organizer/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: rawInput }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Ingestion validation failed');
    }
    return await res.json();
  } catch (err: any) {
    throw err;
  }
}

export async function investigateOrganizerTelemetry(rawInput: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/organizer/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: rawInput }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Organizer investigation failed');
    }
    return await res.json();
  } catch (err: any) {
    throw err;
  }
}
