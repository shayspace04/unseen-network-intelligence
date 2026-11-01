export type NavScreen = 
  | 'overview' 
  | 'investigations' 
  | 'topology' 
  | 'agents' 
  | 'evidence' 
  | 'reports' 
  | 'scenario-lab';

export type HealthStatus = 'healthy' | 'warning' | 'fault' | 'critical';

export interface DeviceTelemetry {
  deviceId: string;
  deviceType?: 'student_laptop' | 'lab_workstation' | 'iot_sensor' | 'faculty_pc' | 'mobile' | 'switch' | 'router' | 'network_device';
  ipAddress?: string;
  macAddress?: string;
  vlan?: string;
  connectedAP?: string;
  connectedSwitch?: string;
  latencyMs: number;
  packetLossPct: number;
  dhcpLeaseState?: 'valid' | 'expired' | 'unassigned' | 'nack';
  dnsResolutionMs?: number;
  signalStrengthDbm?: number;
  jitterMs?: number;
  interfaceErrors?: number;
  status: HealthStatus;
  lastSeen: string;
  // Organizer specific fields
  cpuUtilizationPct?: number;
  linkUtilizationPct?: number;
  egressQueueDrops?: number;
  sourceFormat?: string;
  rawPayload?: Record<string, any>;
  isStale?: boolean;
  staleSeconds?: number;
}

export interface NetworkNodeData {
  id: string;
  label: string;
  type: 'router' | 'switch' | 'access-point' | 'vlan' | 'device';
  status: HealthStatus;
  zone: string;
  ip: string;
  throughput: string;
  packetLoss: string;
  connectedDevices?: number;
  affectedCount?: number;
  details?: {
    model?: string;
    firmware?: string;
    uptime?: string;
    cpuLoad?: string;
    memoryLoad?: string;
    alarms?: string[];
  };
}

export interface Investigation {
  id: string;
  scenarioId?: string;
  title: string;
  zone: string;
  affectedCount: number;
  healthyCount: number;
  monitoredCount: number;
  aggregateHealthPct: number;
  suspectedFault: string;
  confidence: number;
  status: 'active' | 'resolved' | 'investigating';
  timestamp: string;
  leadAgent: string;
  summary: string;
  primaryDependency: string;
  symptoms: string[];
  affectedSubnet: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  status: 'active' | 'analyzing' | 'debating' | 'verified' | 'idle';
  latestFinding: string;
  lastActive: string;
  confidenceScore: number;
  iconName: 'Eye' | 'GitCompare' | 'Network' | 'AlertTriangle' | 'ShieldCheck';
  agentTag: string;
  processedItems: number;
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: 'hypothesis' | 'telemetry_challenge' | 'topology_query' | 'counterfactual_proof' | 'adjudication';
  timestamp: string;
  topic: string;
  payload: Record<string, any>;
  verdict?: 'supported' | 'refuted' | 'pending';
}

export interface EvidenceItem {
  id: string;
  category: 'supporting' | 'contradicting';
  metric: string;
  observation: string;
  comparisonNote: string;
  impactWeight: string;
  sourceAgent: string;
  timestamp: string;
}

export interface CompetingHypothesis {
  id: string;
  title: string;
  proposedBy: string;
  probability: number;
  status: 'leading' | 'refuted' | 'evaluating';
  supportingArgs: string[];
  counterArgs: string[];
  adjudicationNote: string;
}

export interface DiagnosticReport {
  id: string;
  incidentId: string;
  title: string;
  createdAt: string;
  leadAdjudicator: string;
  confidenceLevel: number;
  severity: 'Critical' | 'Major' | 'Moderate' | 'Low';
  zone: string;
  executiveSummary: string;
  rootCauseAnalysis: string;
  counterfactualDelta: string;
  telemetryEvidenceCount: number;
  recommendedActions: Array<{
    action: string;
    urgency: 'immediate' | 'scheduled' | 'preventative';
    estimatedResolution: string;
    targetSystem: string;
  }>;
  agentTranscriptsCount: number;
  verdict?: string;
}

export interface Scenario {
  id: string;
  name: string;
  badge: string;
  category: string;
  description: string;
  monitoredDevices: number;
  healthyDevices: number;
  affectedDevices: number;
  aggregateHealthPct: number;
  affectedZone: string;
  suspectedFault: string;
  confidenceScore: number;
  symptoms: string[];
  recommendedFix: string;
}
