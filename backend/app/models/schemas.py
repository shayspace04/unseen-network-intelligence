"""
UNSEEN Pydantic Schemas - Shared Data Models and Inter-Agent Communication Contract
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional, Literal
import datetime

class GroundTruth(BaseModel):
    """
    STRICTLY ISOLATED GROUND TRUTH
    Agents NEVER receive direct access to this model.
    Used exclusively for synthetic injection and evaluation benchmarking.
    """
    scenario_id: str
    primary_fault_category: str
    injected_root_cause: str
    affected_device_ids: List[str]
    affected_node_id: str
    secondary_fault_category: Optional[str] = None
    secondary_root_cause: Optional[str] = None
    rationale: str

class DeviceTelemetry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    deviceId: str = Field(..., alias="device_id")
    deviceType: Optional[Literal['student_laptop', 'lab_workstation', 'iot_sensor', 'faculty_pc', 'mobile', 'switch', 'router', 'network_device']] = Field(default='network_device', alias="device_type")
    ipAddress: Optional[str] = Field(default=None, alias="ip_address")
    macAddress: Optional[str] = Field(default=None, alias="mac_address")
    vlan: Optional[str] = None
    connectedAP: Optional[str] = Field(default=None, alias="connected_ap")
    connectedSwitch: Optional[str] = Field(default=None, alias="connected_switch")
    latencyMs: float = Field(..., alias="latency_ms")
    packetLossPct: float = Field(..., alias="packet_loss_pct")
    dhcpLeaseState: Optional[Literal['valid', 'expired', 'unassigned', 'nack']] = Field(default=None, alias="dhcp_lease_state")
    dnsResolutionMs: Optional[float] = Field(default=None, alias="dns_resolution_ms")
    signalStrengthDbm: Optional[float] = Field(default=None, alias="signal_strength_dbm")
    jitterMs: Optional[float] = Field(default=0.5, alias="jitter_ms")
    interfaceErrors: Optional[int] = Field(default=0, alias="interface_errors")
    status: Literal['healthy', 'warning', 'fault', 'critical']
    lastSeen: str = Field(..., alias="last_seen")

    # Organizer-specific fields (STRICT CONSTRAINT: unprovided fields remain None, NOT zero)
    cpuUtilizationPct: Optional[float] = Field(default=None, alias="cpu_utilization_pct")
    linkUtilizationPct: Optional[float] = Field(default=None, alias="link_utilization_pct")
    egressQueueDrops: Optional[int] = Field(default=None, alias="egress_queue_drops")
    sourceFormat: Optional[str] = Field(default="canonical", alias="source_format")
    rawPayload: Optional[Dict[str, Any]] = Field(default=None, alias="raw_payload")
    isStale: bool = Field(default=False, alias="is_stale")
    staleSeconds: Optional[float] = Field(default=None, alias="stale_seconds")

class OrganizerMetrics(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    cpu_utilization_pct: float
    link_utilization_pct: float
    packet_loss_pct: float
    latency_ms: float
    queue_drops: int
    interface_errors: int

class OrganizerTelemetryRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    timestamp: str
    device_id: str
    metrics: OrganizerMetrics
    status: Literal['Healthy', 'Warning', 'Critical', 'healthy', 'warning', 'critical']

class NetworkNodeDetails(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    model: Optional[str] = None
    firmware: Optional[str] = None
    uptime: Optional[str] = None
    cpuLoad: Optional[str] = Field(None, alias="cpu_load")
    memoryLoad: Optional[str] = Field(None, alias="memory_load")
    alarms: List[str] = Field(default_factory=list)

class NetworkNodeData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    label: str
    type: Literal['router', 'switch', 'access-point', 'vlan', 'device']
    status: Literal['healthy', 'warning', 'fault']
    zone: str
    ip: str
    throughput: str
    packetLoss: str = Field(..., alias="packet_loss")
    connectedDevices: Optional[int] = Field(None, alias="connected_devices")
    affectedCount: Optional[int] = Field(None, alias="affected_count")
    details: Optional[NetworkNodeDetails] = None

class NetworkNode(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    type: str = "networkNode"
    position: Dict[str, float]
    data: NetworkNodeData

class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True
    style: Optional[Dict[str, Any]] = None

class Scenario(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    name: str
    badge: str
    category: str
    description: str
    monitoredDevices: int = Field(..., alias="monitored_devices")
    healthyDevices: int = Field(..., alias="healthy_devices")
    affectedDevices: int = Field(..., alias="affected_devices")
    aggregateHealthPct: float = Field(..., alias="aggregate_health_pct")
    affectedZone: str = Field(..., alias="affected_zone")
    suspectedFault: str = Field(..., alias="suspected_fault")
    confidenceScore: float = Field(..., alias="confidence_score")
    symptoms: List[str]
    recommendedFix: str = Field(..., alias="recommended_fix")

class AgentMessage(BaseModel):
    """
    Inter-Agent Versioned JSON Communication Contract (schema_version = 1.0.0)
    """
    model_config = ConfigDict(populate_by_name=True)

    schema_version: str = "1.0.0"
    message_id: str
    incident_id: str
    sender: str
    recipient: str
    message_type: Literal[
        'cohort_discovery',
        'counterfactual_analysis',
        'topology_dependency',
        'fault_evaluation',
        'adjudication_verdict',
        'hypothesis',
        'telemetry_challenge',
        'topology_query',
        'counterfactual_proof',
        'adjudication'
    ]
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S.%f")[:-3])
    topic: str
    payload: Dict[str, Any]
    evidence_references: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    verdict: Optional[Literal['supported', 'refuted', 'pending', 'inconclusive']] = None

class InvestigationEvent(BaseModel):
    id: Optional[int] = None
    incident_id: str
    timestamp: str
    event_type: str
    agent_name: str
    description: str
    payload: Optional[Dict[str, Any]] = None

class AgentInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    name: str
    role: str
    responsibility: str
    status: Literal['active', 'analyzing', 'debating', 'verified', 'idle']
    latestFinding: str = Field(..., alias="latest_finding")
    lastActive: str = Field(..., alias="last_active")
    confidenceScore: float = Field(..., alias="confidence_score")
    iconName: Literal['Eye', 'GitCompare', 'Network', 'AlertTriangle', 'ShieldCheck'] = Field(..., alias="icon_name")
    agentTag: str = Field(..., alias="agent_tag")
    processedItems: int = Field(default=0, alias="processed_items")

class EvidenceItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    category: Literal['supporting', 'contradicting']
    metric: str
    observation: str
    comparisonNote: str = Field(..., alias="comparison_note")
    impactWeight: str = Field(..., alias="impact_weight")
    sourceAgent: str = Field(..., alias="source_agent")
    timestamp: str

class CompetingHypothesis(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    title: str
    proposedBy: str = Field(..., alias="proposed_by")
    probability: float
    status: Literal['leading', 'refuted', 'evaluating']
    supportingArgs: List[str] = Field(..., alias="supporting_args")
    counterArgs: List[str] = Field(..., alias="counter_args")
    adjudicationNote: str = Field(..., alias="adjudication_note")

class RecommendedAction(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    action: str
    urgency: Literal['immediate', 'scheduled', 'preventative']
    estimatedResolution: str = Field(..., alias="estimated_resolution")
    targetSystem: str = Field(..., alias="target_system")

class DiagnosticReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    incidentId: str = Field(..., alias="incident_id")
    title: str
    createdAt: str = Field(..., alias="created_at")
    leadAdjudicator: str = Field(..., alias="lead_adjudicator")
    confidenceLevel: float = Field(..., alias="confidence_level")
    severity: Literal['Critical', 'Major', 'Moderate', 'Low']
    zone: str
    executiveSummary: str = Field(..., alias="executive_summary")
    rootCauseAnalysis: str = Field(..., alias="root_cause_analysis")
    counterfactualDelta: str = Field(..., alias="counterfactual_delta")
    telemetryEvidenceCount: int = Field(..., alias="telemetry_evidence_count")
    recommendedActions: List[RecommendedAction] = Field(..., alias="recommended_actions")
    agentTranscriptsCount: int = Field(..., alias="agent_transcripts_count")
    verdict: Optional[str] = None

    @property
    def root_cause_analysis(self) -> str:
        return self.rootCauseAnalysis

    @property
    def recommended_actions(self) -> List[RecommendedAction]:
        return self.recommendedActions

    @property
    def confidence_level(self) -> float:
        return self.confidenceLevel

    @property
    def incident_id(self) -> str:
        return self.incidentId

    @property
    def executive_summary(self) -> str:
        return self.executiveSummary

    @property
    def counterfactual_delta(self) -> str:
        return self.counterfactualDelta

class Investigation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    scenarioId: Optional[str] = Field(default=None, alias="scenario_id")
    title: str
    zone: str
    affectedCount: int = Field(..., alias="affected_count")
    healthyCount: int = Field(..., alias="healthy_count")
    monitoredCount: int = Field(..., alias="monitored_count")
    aggregateHealthPct: float = Field(..., alias="aggregate_health_pct")
    suspectedFault: str = Field(..., alias="suspected_fault")
    confidence: float
    status: Literal['active', 'resolved', 'investigating']
    timestamp: str
    leadAgent: str = Field(..., alias="lead_agent")
    summary: str
    primaryDependency: str = Field(..., alias="primary_dependency")
    symptoms: List[str]
    affectedSubnet: str = Field(..., alias="affected_subnet")

    @property
    def affected_count(self) -> int:
        return self.affectedCount

    @property
    def healthy_count(self) -> int:
        return self.healthyCount
