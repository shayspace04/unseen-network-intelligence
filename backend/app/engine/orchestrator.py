"""
UNSEEN Central Multi-Agent Orchestrator
Coordinates causal execution of the 5 agents, validates message contracts, logs execution events, and persists all state in SQLite.
"""

import json
import datetime
import uuid
from typing import List, Dict, Any, Optional

from ..db.database import get_db, init_db
from ..models.schemas import (
    Scenario, 
    DeviceTelemetry, 
    NetworkNode, 
    NetworkEdge, 
    Investigation, 
    InvestigationEvent, 
    AgentMessage, 
    EvidenceItem, 
    CompetingHypothesis, 
    DiagnosticReport,
    AgentInfo,
    GroundTruth
)
from .synthetic import SyntheticNetworkEngine
from ..agents.population_observer import PopulationObserverAgent
from ..agents.counterfactual import CounterfactualAgent
from ..agents.topology_investigator import TopologyInvestigatorAgent
from ..agents.fault_investigator import FaultInvestigatorAgent
from ..agents.adjudicator import AdjudicatorAgent

class MultiAgentOrchestrator:
    def __init__(self, seed: int = 42):
        self.synthetic_engine = SyntheticNetworkEngine(seed=seed)
        self.agents = [
            PopulationObserverAgent(),
            CounterfactualAgent(),
            TopologyInvestigatorAgent(),
            FaultInvestigatorAgent(),
            AdjudicatorAgent()
        ]
        init_db()

    def run_investigation(self, scenario_id: str, incident_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a complete 5-agent investigation pipeline on a scenario.
        """
        if not incident_id:
            incident_id = f"INV-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"

        # 1. Generate or load synthetic scenario data
        scenario, devices, nodes, edges, ground_truth = self.synthetic_engine.generate_scenario_data(scenario_id)

        # 2. Persist scenario, devices, and topology in SQLite
        self._persist_scenario_and_topology(scenario, devices, nodes, edges, ground_truth)

        # 3. Create initial investigation record
        inv_title = f"{scenario.name} ({scenario.affectedDevices} endpoints affected)" if scenario.affectedDevices > 0 else scenario.name
        initial_inv = Investigation(
            id=incident_id,
            scenario_id=scenario.id,
            title=inv_title,
            zone=scenario.affectedZone,
            affected_count=scenario.affectedDevices,
            healthy_count=scenario.healthyDevices,
            monitored_count=scenario.monitoredDevices,
            aggregate_health_pct=scenario.aggregateHealthPct,
            suspected_fault="Multi-agent triage in progress...",
            confidence=0.0,
            status="investigating",
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            lead_agent="Adjudicator",
            summary=scenario.description,
            primary_dependency="Tracing topology tree...",
            symptoms=scenario.symptoms,
            affected_subnet=scenario.affectedZone
        )
        self._persist_investigation(initial_inv, scenario.id)

        # Log start event
        self._log_event(incident_id, "investigation_started", "Orchestrator", f"Investigation launched on {scenario.name}", {"scenario_id": scenario_id})

        # Shared execution context across agents
        context: Dict[str, Any] = {
            "devices": devices,
            "nodes": nodes,
            "edges": edges,
            "scenario": scenario,
            "zone": scenario.affectedZone,
            "messages": [],
            "evidence_items": [],
            "message_count": 0
        }

        agent_messages: List[AgentMessage] = []
        agent_executions: List[Dict[str, Any]] = []

        # Step 1: Population Observer
        pop_agent = self.agents[0]
        self._log_event(incident_id, "agent_started", pop_agent.name, "Scanning observable fleet telemetry for anomalous micro-cohorts")
        msg_1, out_1 = pop_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_1)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", pop_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_1)
        agent_messages.append(msg_1)
        self._persist_message(msg_1)
        self._log_event(incident_id, "message_sent", pop_agent.name, f"Discovered cohort of {out_1.get('affected_count', 0)} devices", msg_1.payload)
        agent_executions.append({
            "agent_name": pop_agent.name,
            "agent_tag": pop_agent.agent_tag,
            "role": pop_agent.role,
            "responsibility": pop_agent.responsibility,
            "status": "verified" if out_1.get("affected_count", 0) > 0 else "active",
            "latest_finding": out_1.get("latest_finding", ""),
            "confidence_score": 0.98,
            "processed_items": len(devices),
            "order": 1
        })

        # Step 2: Counterfactual Agent
        ctf_agent = self.agents[1]
        self._log_event(incident_id, "agent_started", ctf_agent.name, "Constructing Twin-Cohort comparison between failing and healthy peers")
        msg_2, out_2 = ctf_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_2)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", ctf_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_2)
        agent_messages.append(msg_2)
        self._persist_message(msg_2)
        self._log_event(incident_id, "message_sent", ctf_agent.name, "Differential matrix computed", msg_2.payload)
        agent_executions.append({
            "agent_name": ctf_agent.name,
            "agent_tag": ctf_agent.agent_tag,
            "role": ctf_agent.role,
            "responsibility": ctf_agent.responsibility,
            "status": "verified",
            "latest_finding": out_2.get("latest_finding", ""),
            "confidence_score": 0.95,
            "processed_items": len(context.get("affected_devices", [])) * 2,
            "order": 2
        })

        # Step 3: Topology Investigator
        top_agent = self.agents[2]
        self._log_event(incident_id, "agent_started", top_agent.name, "Traversing NetworkX topology graph to isolate lowest common dependency")
        msg_3, out_3 = top_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_3)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", top_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_3)
        agent_messages.append(msg_3)
        self._persist_message(msg_3)
        self._log_event(incident_id, "message_sent", top_agent.name, f"Convergence identified at {out_3.get('shared_dependency', 'Core')}", msg_3.payload)
        agent_executions.append({
            "agent_name": top_agent.name,
            "agent_tag": top_agent.agent_tag,
            "role": top_agent.role,
            "responsibility": top_agent.responsibility,
            "status": "verified",
            "latest_finding": out_3.get("latest_finding", ""),
            "confidence_score": 0.93,
            "processed_items": len(nodes),
            "order": 3
        })

        # Step 4: Fault Investigator
        flt_agent = self.agents[3]
        self._log_event(incident_id, "agent_started", flt_agent.name, "Falsifying failure modes across physical, transport, and application layers")
        msg_4, out_4 = flt_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_4)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", flt_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_4)
        agent_messages.append(msg_4)
        self._persist_message(msg_4)
        self._log_event(incident_id, "message_sent", flt_agent.name, "Competing hypotheses ranked and evaluated", msg_4.payload)
        agent_executions.append({
            "agent_name": flt_agent.name,
            "agent_tag": flt_agent.agent_tag,
            "role": flt_agent.role,
            "responsibility": flt_agent.responsibility,
            "status": "verified",
            "latest_finding": out_4.get("latest_finding", ""),
            "confidence_score": 0.91,
            "processed_items": len(out_4.get("hypotheses", [])),
            "order": 4
        })

        # Step 5: Adjudicator
        adj_agent = self.agents[4]
        self._log_event(incident_id, "agent_started", adj_agent.name, "Challenging contradictions and synthesizing consensus Diagnostic Report")
        context["message_count"] = len(agent_messages)
        msg_5, out_5 = adj_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_5)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", adj_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_5)
        agent_messages.append(msg_5)
        self._persist_message(msg_5)
        self._log_event(incident_id, "message_sent", adj_agent.name, "Final consensus report generated", msg_5.payload)
        agent_executions.append({
            "agent_name": adj_agent.name,
            "agent_tag": adj_agent.agent_tag,
            "role": adj_agent.role,
            "responsibility": adj_agent.responsibility,
            "status": "verified",
            "latest_finding": out_5.get("latest_finding", ""),
            "confidence_score": out_5.get("confidence_score", 0.94),
            "processed_items": 5,
            "order": 5
        })

        # 4. Persist executions, evidence, hypotheses, and report
        report: DiagnosticReport = out_5["report"]
        evidence_items: List[EvidenceItem] = out_5.get("evidence_items", [])
        hypotheses: List[CompetingHypothesis] = out_4.get("hypotheses", [])
        canonical_contract = out_5.get("canonical_contract")

        self._persist_agent_executions(incident_id, agent_executions)
        self._persist_evidence_items(incident_id, evidence_items)
        self._persist_hypotheses(incident_id, hypotheses)
        self._persist_report(report, canonical_contract)

        # 5. Update final investigation record
        final_inv = Investigation(
            id=incident_id,
            scenario_id=scenario.id,
            title=inv_title,
            zone=scenario.affectedZone,
            affected_count=scenario.affectedDevices,
            healthy_count=scenario.healthyDevices,
            monitored_count=scenario.monitoredDevices,
            aggregate_health_pct=scenario.aggregateHealthPct,
            suspected_fault=report.title.replace("Adjudication Report: ", "").replace(f" in {scenario.affectedZone}", ""),
            confidence=report.confidenceLevel,
            status="resolved",
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            lead_agent="Adjudicator",
            summary=report.executiveSummary,
            primary_dependency=context.get("shared_dependency", "Campus Core"),
            symptoms=scenario.symptoms,
            affected_subnet=scenario.affectedZone
        )
        self._persist_investigation(final_inv, scenario.id)

        self._log_event(incident_id, "investigation_completed", "Adjudicator", f"Investigation {incident_id} finalized with {report.confidenceLevel*100:.0f}% confidence", {"report_id": report.id})

        return {
            "incident_id": incident_id,
            "scenario": scenario,
            "investigation": final_inv,
            "report": report,
            "canonical_contract": canonical_contract,
            "messages": agent_messages,
            "evidence": evidence_items,
            "hypotheses": hypotheses,
            "agent_executions": agent_executions
        }

    def validate_agent_message(self, msg: Any) -> Tuple[bool, Optional[str]]:
        """
        Validates inter-agent message conformance according to Task 2 interoperability requirements.
        Rejects invalid schema versions or missing mandatory identifiers.
        """
        if not getattr(msg, "schema_version", None) or msg.schema_version != "1.0.0":
            return False, f"Unsupported schema_version '{getattr(msg, 'schema_version', None)}'. Inter-agent contract strictly requires '1.0.0'."
        if not getattr(msg, "message_id", None) or not str(msg.message_id).strip():
            return False, "Missing required message information: 'message_id' is mandatory."
        if not getattr(msg, "incident_id", None) or not str(msg.incident_id).strip():
            return False, "Missing required message information: 'incident_id' is mandatory."
        if not getattr(msg, "sender", None) or not str(msg.sender).strip():
            return False, "Missing required message information: 'sender' is mandatory."
        if not getattr(msg, "recipient", None) or not str(msg.recipient).strip():
            return False, "Missing required message information: 'recipient' is mandatory."
        return True, None

    def _persist_scenario_and_topology(self, scenario: Scenario, devices: List[DeviceTelemetry], nodes: List[NetworkNode], edges: List[NetworkEdge], ground_truth: Any):
        with get_db() as conn:
            conn.execute("""
            INSERT INTO scenarios (
                id, name, symptom_label, category, description, monitored_devices, healthy_devices, affected_devices, aggregate_health_pct, affected_zone, suspected_fault, confidence_score, symptoms_json, recommended_fix, ground_truth_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                symptom_label = excluded.symptom_label,
                category = excluded.category,
                description = excluded.description,
                monitored_devices = excluded.monitored_devices,
                healthy_devices = excluded.healthy_devices,
                affected_devices = excluded.affected_devices,
                aggregate_health_pct = excluded.aggregate_health_pct,
                affected_zone = excluded.affected_zone,
                suspected_fault = excluded.suspected_fault,
                confidence_score = excluded.confidence_score,
                symptoms_json = excluded.symptoms_json,
                recommended_fix = excluded.recommended_fix,
                ground_truth_json = excluded.ground_truth_json
            """, (
                scenario.id, scenario.name, scenario.name, scenario.category, scenario.description,
                scenario.monitoredDevices, scenario.healthyDevices, scenario.affectedDevices,
                scenario.aggregateHealthPct, scenario.affectedZone, scenario.suspectedFault,
                scenario.confidenceScore, json.dumps(scenario.symptoms), scenario.recommendedFix,
                json.dumps(ground_truth.model_dump())
            ))

            for d in devices:
                conn.execute("""
                INSERT OR REPLACE INTO devices (
                    device_id, scenario_id, device_type, ip_address, mac_address, vlan, connected_ap, connected_switch, latency_ms, packet_loss_pct, dhcp_lease_state, dns_resolution_ms, signal_strength_dbm, jitter_ms, interface_errors, status, last_seen, cpu_utilization_pct, link_utilization_pct, egress_queue_drops, is_stale, source_format, raw_payload_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    d.deviceId, scenario.id, d.deviceType or "network_device", d.ipAddress or "unassigned", d.macAddress or "unknown", d.vlan or "unassigned",
                    d.connectedAP or "none", d.connectedSwitch or "none", d.latencyMs, d.packetLossPct, d.dhcpLeaseState or "valid",
                    d.dnsResolutionMs or 0.0, d.signalStrengthDbm if d.signalStrengthDbm is not None else -50.0, d.jitterMs or 0.5, d.interfaceErrors or 0, d.status, d.lastSeen,
                    getattr(d, "cpuUtilizationPct", None), getattr(d, "linkUtilizationPct", None), getattr(d, "egressQueueDrops", None),
                    1 if getattr(d, "isStale", False) else 0, getattr(d, "sourceFormat", "canonical"),
                    json.dumps(getattr(d, "rawPayload", {})) if getattr(d, "rawPayload", None) else None
                ))

            for n in nodes:
                conn.execute("""
                INSERT OR REPLACE INTO topology_nodes (
                    id, scenario_id, label, type, status, zone, ip, throughput, packet_loss, connected_devices, affected_count, details_json, position_x, position_y
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    n.id, scenario.id, n.data.label, n.data.type, n.data.status, n.data.zone,
                    n.data.ip, n.data.throughput, n.data.packetLoss, n.data.connectedDevices,
                    n.data.affectedCount, json.dumps(n.data.details.model_dump() if n.data.details else {}),
                    n.position.get("x", 0), n.position.get("y", 0)
                ))

            for e in edges:
                conn.execute("""
                INSERT OR REPLACE INTO topology_edges (
                    id, scenario_id, source, target, animated, style_json
                ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    e.id, scenario.id, e.source, e.target, 1 if e.animated else 0,
                    json.dumps(e.style or {})
                ))

    def _persist_investigation(self, inv: Investigation, scenario_id: str):
        with get_db() as conn:
            conn.execute("""
            INSERT INTO investigations (
                incident_id, scenario_id, title, zone, affected_count, healthy_count, monitored_count, aggregate_health_pct, suspected_fault, confidence, status, timestamp, lead_agent, summary, primary_dependency, symptoms_json, affected_subnet
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(incident_id) DO UPDATE SET
                title = excluded.title,
                zone = excluded.zone,
                affected_count = excluded.affected_count,
                healthy_count = excluded.healthy_count,
                monitored_count = excluded.monitored_count,
                aggregate_health_pct = excluded.aggregate_health_pct,
                suspected_fault = excluded.suspected_fault,
                confidence = excluded.confidence,
                status = excluded.status,
                timestamp = excluded.timestamp,
                lead_agent = excluded.lead_agent,
                summary = excluded.summary,
                primary_dependency = excluded.primary_dependency,
                symptoms_json = excluded.symptoms_json,
                affected_subnet = excluded.affected_subnet
            """, (
                inv.id, scenario_id, inv.title, inv.zone, inv.affectedCount, inv.healthyCount,
                inv.monitoredCount, inv.aggregateHealthPct, inv.suspectedFault, inv.confidence,
                inv.status, inv.timestamp, inv.leadAgent, inv.summary, inv.primaryDependency,
                json.dumps(inv.symptoms), inv.affectedSubnet
            ))

    def _log_event(self, incident_id: str, event_type: str, agent_name: str, description: str, payload: Optional[Dict[str, Any]] = None):
        with get_db() as conn:
            conn.execute("""
            INSERT INTO investigation_events (
                incident_id, timestamp, event_type, agent_name, description, payload_json
            ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                incident_id,
                datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S.%f")[:-3],
                event_type,
                agent_name,
                description,
                json.dumps(payload or {})
            ))

    def _persist_message(self, msg: AgentMessage):
        with get_db() as conn:
            conn.execute("""
            INSERT OR REPLACE INTO agent_messages (
                message_id, schema_version, incident_id, sender, recipient, message_type, timestamp, topic, payload_json, evidence_references_json, limitations_json, verdict
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                msg.message_id, msg.schema_version, msg.incident_id, msg.sender, msg.recipient,
                msg.message_type, msg.timestamp, msg.topic, json.dumps(msg.payload),
                json.dumps(msg.evidence_references), json.dumps(msg.limitations), msg.verdict
            ))

    def _persist_agent_executions(self, incident_id: str, executions: List[Dict[str, Any]]):
        with get_db() as conn:
            for ex in executions:
                conn.execute("""
                INSERT INTO agent_executions (
                    incident_id, agent_name, agent_tag, role, responsibility, status, latest_finding, confidence_score, processed_items, execution_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    incident_id, ex["agent_name"], ex["agent_tag"], ex["role"], ex["responsibility"],
                    ex["status"], ex["latest_finding"], ex["confidence_score"], ex["processed_items"], ex["order"]
                ))

    def _persist_evidence_items(self, incident_id: str, items: List[EvidenceItem]):
        with get_db() as conn:
            for ev in items:
                conn.execute("""
                INSERT OR REPLACE INTO evidence_items (
                    id, incident_id, category, metric, observation, comparison_note, impact_weight, source_agent, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ev.id, incident_id, ev.category, ev.metric, ev.observation,
                    ev.comparisonNote, ev.impactWeight, ev.sourceAgent, ev.timestamp
                ))

    def _persist_hypotheses(self, incident_id: str, hypotheses: List[CompetingHypothesis]):
        with get_db() as conn:
            for h in hypotheses:
                conn.execute("""
                INSERT OR REPLACE INTO competing_hypotheses (
                    id, incident_id, title, proposed_by, probability, status, supporting_args_json, counter_args_json, adjudication_note
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    h.id, incident_id, h.title, h.proposedBy, h.probability, h.status,
                    json.dumps(h.supportingArgs), json.dumps(h.counterArgs), h.adjudicationNote
                ))

    def _persist_report(self, report: DiagnosticReport, canonical_contract: Optional[Dict[str, Any]] = None):
        with get_db() as conn:
            conn.execute("""
            INSERT OR REPLACE INTO diagnostic_reports (
                id, incident_id, title, created_at, lead_adjudicator, confidence_level, severity, zone, executive_summary, root_cause_analysis, counterfactual_delta, telemetry_evidence_count, recommended_actions_json, agent_transcripts_count, verdict, canonical_contract_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report.id, report.incidentId, report.title, report.createdAt, report.leadAdjudicator,
                report.confidenceLevel, report.severity, report.zone, report.executiveSummary,
                report.rootCauseAnalysis, report.counterfactualDelta, report.telemetryEvidenceCount,
                json.dumps([a.model_dump() for a in report.recommendedActions]),
                report.agentTranscriptsCount, getattr(report, "verdict", None),
                json.dumps(canonical_contract) if canonical_contract else None
            ))

    def run_organizer_investigation(self, raw_input: Any, incident_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes multi-agent pipeline on external organizer telemetry.
        Normalizes organizer records, isolates dependencies, ranks hypotheses,
        and generates the canonical NetCoop diagnostic contract report.
        """
        if not incident_id:
            incident_id = f"INV-ORG-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"

        from .telemetry_ingestion import OrganizerTelemetryAdapter
        devices, metadata = OrganizerTelemetryAdapter.parse_and_normalize(raw_input)

        total_devs = len(devices)
        affected_devs = [d for d in devices if d.status in ("critical", "fault", "warning")]
        healthy_devs = [d for d in devices if d.status == "healthy"]
        health_pct = round((len(healthy_devs) / max(total_devs, 1)) * 100.0, 1)

        # Create scenario record for DB constraints
        scenario_id = "organizer-import"
        scenario = Scenario(
            id=scenario_id,
            name="Organizer Telemetry Import (NetCoop AI Benchmark)",
            badge="External Feed",
            category="Switch Fabric / Organizer",
            description=f"Ingested {total_devs} switch telemetry records from organizer generator. Detected input format: {metadata['detected_input_format']}.",
            monitored_devices=total_devs,
            healthy_devices=len(healthy_devs),
            affected_devices=len(affected_devs),
            aggregate_health_pct=health_pct,
            affected_zone="Switch Distribution Tier",
            suspected_fault="Symptom: High CPU, queue drops, and interface errors on monitored switch endpoints",
            confidence_score=0.96 if affected_devs else 0.98,
            symptoms=[
                f"{len(affected_devs)} switch devices reporting degraded/critical health",
                f"Format: {metadata['detected_input_format']} ({metadata['valid_records_normalized']} records normalized)",
                f"Stale records: {metadata['stale_records_count']} (>300s TTL)"
            ],
            recommended_fix="Execute remedial actions identified by multi-agent investigation."
        )

        # Persist scenario stub with isolated ground truth
        self._persist_scenario_and_topology(scenario, devices, [], [], GroundTruth(
            scenario_id=scenario_id,
            primary_fault_category="Organizer",
            injected_root_cause="External Ingestion Evaluation",
            affected_device_ids=[d.deviceId for d in affected_devs],
            affected_node_id="dist-sw-eng",
            rationale="Evaluation of organizer telemetry records against multi-agent diagnostic squad."
        ))

        # Create initial investigation record
        inv_title = f"{scenario.name} ({len(affected_devs)} endpoints affected)" if len(affected_devs) > 0 else scenario.name
        initial_inv = Investigation(
            id=incident_id,
            scenario_id=scenario.id,
            title=inv_title,
            zone=scenario.affectedZone,
            affected_count=len(affected_devs),
            healthy_count=len(healthy_devs),
            monitored_count=total_devs,
            aggregate_health_pct=health_pct,
            suspected_fault="Multi-agent triage in progress...",
            confidence=0.0,
            status="investigating",
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            lead_agent="Adjudicator",
            summary=scenario.description,
            primary_dependency="External Telemetry Stream",
            symptoms=scenario.symptoms,
            affected_subnet=scenario.affectedZone
        )
        self._persist_investigation(initial_inv, scenario.id)

        # Shared execution context across agents
        context: Dict[str, Any] = {
            "devices": devices,
            "nodes": [],
            "edges": [],
            "scenario": scenario,
            "zone": scenario.affectedZone,
            "messages": [],
            "evidence_items": [],
            "message_count": 0
        }

        agent_messages: List[AgentMessage] = []
        agent_executions: List[Dict[str, Any]] = []

        # Step 1: Population Observer
        pop_agent = self.agents[0]
        self._log_event(incident_id, "agent_started", pop_agent.name, "Analyzing organizer fleet telemetry for anomalous switches")
        msg_1, out_1 = pop_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_1)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", pop_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_1)
        agent_messages.append(msg_1)
        self._persist_message(msg_1)
        agent_executions.append({
            "agent_name": pop_agent.name,
            "agent_tag": pop_agent.agent_tag,
            "role": pop_agent.role,
            "responsibility": pop_agent.responsibility,
            "status": "verified" if out_1.get("affected_count", 0) > 0 else "active",
            "latest_finding": out_1.get("latest_finding", ""),
            "confidence_score": 0.98,
            "processed_items": total_devs,
            "order": 1
        })

        # Step 2: Counterfactual Agent
        ctf_agent = self.agents[1]
        msg_2, out_2 = ctf_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_2)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", ctf_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_2)
        agent_messages.append(msg_2)
        self._persist_message(msg_2)
        agent_executions.append({
            "agent_name": ctf_agent.name,
            "agent_tag": ctf_agent.agent_tag,
            "role": ctf_agent.role,
            "responsibility": ctf_agent.responsibility,
            "status": "verified",
            "latest_finding": out_2.get("latest_finding", ""),
            "confidence_score": 0.95,
            "processed_items": len(context.get("affected_devices", [])) * 2,
            "order": 2
        })

        # Step 3: Topology Investigator
        top_agent = self.agents[2]
        msg_3, out_3 = top_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_3)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", top_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_3)
        agent_messages.append(msg_3)
        self._persist_message(msg_3)
        agent_executions.append({
            "agent_name": top_agent.name,
            "agent_tag": top_agent.agent_tag,
            "role": top_agent.role,
            "responsibility": top_agent.responsibility,
            "status": "verified",
            "latest_finding": out_3.get("latest_finding", ""),
            "confidence_score": 0.93,
            "processed_items": 0,
            "order": 3
        })

        # Step 4: Fault Investigator
        flt_agent = self.agents[3]
        msg_4, out_4 = flt_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_4)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", flt_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_4)
        agent_messages.append(msg_4)
        self._persist_message(msg_4)
        agent_executions.append({
            "agent_name": flt_agent.name,
            "agent_tag": flt_agent.agent_tag,
            "role": flt_agent.role,
            "responsibility": flt_agent.responsibility,
            "status": "verified",
            "latest_finding": out_4.get("latest_finding", ""),
            "confidence_score": 0.91,
            "processed_items": len(out_4.get("hypotheses", [])),
            "order": 4
        })

        # Step 5: Adjudicator
        adj_agent = self.agents[4]
        context["message_count"] = len(agent_messages)
        msg_5, out_5 = adj_agent.execute(incident_id, context)
        is_val, val_err = self.validate_agent_message(msg_5)
        if not is_val:
            self._log_event(incident_id, "interoperability_failure", adj_agent.name, f"Message rejected: {val_err}", {"error": val_err})
            raise ValueError(f"Agent message violation: {val_err}")
        context.update(out_5)
        agent_messages.append(msg_5)
        self._persist_message(msg_5)
        agent_executions.append({
            "agent_name": adj_agent.name,
            "agent_tag": adj_agent.agent_tag,
            "role": adj_agent.role,
            "responsibility": adj_agent.responsibility,
            "status": "verified",
            "latest_finding": out_5.get("latest_finding", ""),
            "confidence_score": out_5.get("confidence_score", 0.94),
            "processed_items": 5,
            "order": 5
        })

        report: DiagnosticReport = out_5["report"]
        evidence_items: List[EvidenceItem] = out_5.get("evidence_items", [])
        hypotheses: List[CompetingHypothesis] = out_4.get("hypotheses", [])
        canonical_contract = out_5.get("canonical_contract")

        self._persist_agent_executions(incident_id, agent_executions)
        self._persist_evidence_items(incident_id, evidence_items)
        self._persist_hypotheses(incident_id, hypotheses)
        self._persist_report(report, canonical_contract)

        final_inv = Investigation(
            id=incident_id,
            scenario_id=scenario.id,
            title=inv_title,
            zone=scenario.affectedZone,
            affected_count=len(affected_devs),
            healthy_count=len(healthy_devs),
            monitored_count=total_devs,
            aggregate_health_pct=health_pct,
            suspected_fault=report.title.replace("Adjudication Report: ", "").replace(f" in {scenario.affectedZone}", ""),
            confidence=report.confidenceLevel,
            status="resolved",
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            lead_agent="Adjudicator",
            summary=report.executiveSummary,
            primary_dependency=context.get("shared_dependency", "External Telemetry"),
            symptoms=scenario.symptoms,
            affected_subnet=scenario.affectedZone
        )
        self._persist_investigation(final_inv, scenario.id)

        self._log_event(incident_id, "investigation_completed", "Adjudicator", f"Investigation {incident_id} finalized with {report.confidenceLevel*100:.0f}% confidence", {"report_id": report.id})

        return {
            "incident_id": incident_id,
            "scenario": scenario,
            "investigation": final_inv,
            "report": report,
            "canonical_contract": canonical_contract,
            "messages": agent_messages,
            "evidence": evidence_items,
            "hypotheses": hypotheses,
            "agent_executions": agent_executions,
            "ingestion_metadata": metadata
        }
