"""
UNSEEN FastAPI Routes - Endpoints for scenarios, investigations, topology, agent events, and reports.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os

from ..db.database import get_db
from ..models.schemas import (
    Scenario, 
    Investigation, 
    DiagnosticReport, 
    AgentMessage, 
    InvestigationEvent,
    EvidenceItem,
    CompetingHypothesis,
    AgentInfo
)
from ..engine.orchestrator import MultiAgentOrchestrator
from ..engine.telemetry_ingestion import OrganizerTelemetryAdapter, TelemetryIngestionError
from ..models.diagnostic_contract import DIAGNOSTIC_REPORT_JSON_SCHEMA, validate_diagnostic_contract_json, ReportValidationError

router = APIRouter(prefix="/api")
orchestrator = MultiAgentOrchestrator()

class CreateInvestigationRequest(BaseModel):
    scenario_id: str = "dhcp-starvation"

@router.get("/health")
def get_health():
    """Health status and multi-agent engine availability."""
    return {
        "status": "operational",
        "service": "unseen-backend",
        "version": "1.0.0",
        "agents_ready": 5,
        "db_status": "connected (sqlite)"
    }

@router.get("/scenarios", response_model=List[Scenario])
def get_scenarios():
    """Returns available simulation scenarios."""
    scenarios_list = [
        "dhcp-starvation",
        "wifi-degradation",
        "shared-link-congestion",
        "dns-resolver-silent-drop",
        "multiple-simultaneous-faults",
        "healthy-baseline",
        "ethernet-interface-fault"
    ]
    results: List[Scenario] = []
    for s_id in scenarios_list:
        sc, _, _, _, _ = orchestrator.synthetic_engine.generate_scenario_data(s_id)
        results.append(sc)
    return results

@router.get("/scenarios/{scenario_id}", response_model=Scenario)
def get_scenario_by_id(scenario_id: str):
    sc, _, _, _, _ = orchestrator.synthetic_engine.generate_scenario_data(scenario_id)
    return sc

@router.get("/topology")
def get_topology(scenario_id: str = Query("dhcp-starvation")):
    """Returns React Flow nodes and edges for the specified scenario."""
    _, _, nodes, edges, _ = orchestrator.synthetic_engine.generate_scenario_data(scenario_id)
    return {
        "scenario_id": scenario_id,
        "nodes": [n.model_dump(by_alias=True) for n in nodes],
        "edges": [e.model_dump() for e in edges]
    }

@router.get("/investigations", response_model=List[Investigation])
def get_investigations():
    """Returns all investigations from SQLite database."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM investigations ORDER BY timestamp DESC").fetchall()
        results = []
        for r in rows:
            results.append(Investigation(
                id=r["incident_id"],
                scenario_id=r["scenario_id"],
                title=r["title"],
                zone=r["zone"],
                affected_count=r["affected_count"],
                healthy_count=r["healthy_count"],
                monitored_count=r["monitored_count"],
                aggregate_health_pct=r["aggregate_health_pct"],
                suspected_fault=r["suspected_fault"],
                confidence=r["confidence"],
                status=r["status"],
                timestamp=r["timestamp"],
                lead_agent=r["lead_agent"],
                summary=r["summary"],
                primary_dependency=r["primary_dependency"],
                symptoms=json.loads(r["symptoms_json"]),
                affected_subnet=r["affected_subnet"]
            ))
        return results

@router.post("/investigations")
def create_investigation(req: CreateInvestigationRequest, background_tasks: BackgroundTasks):
    """
    Triggers an actual multi-agent investigation on the specified scenario.
    """
    # Execute investigation pipeline
    result = orchestrator.run_investigation(scenario_id=req.scenario_id)
    return {
        "incident_id": result["incident_id"],
        "scenario_id": req.scenario_id,
        "status": "completed",
        "investigation": result["investigation"].model_dump(by_alias=True),
        "report_id": result["report"].id,
        "confidence": result["report"].confidenceLevel
    }

@router.get("/investigations/{incident_id}", response_model=Investigation)
def get_investigation_by_id(incident_id: str):
    with get_db() as conn:
        r = conn.execute("SELECT * FROM investigations WHERE incident_id = ?", (incident_id,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Investigation not found")
        return Investigation(
            id=r["incident_id"],
            scenario_id=r["scenario_id"],
            title=r["title"],
            zone=r["zone"],
            affected_count=r["affected_count"],
            healthy_count=r["healthy_count"],
            monitored_count=r["monitored_count"],
            aggregate_health_pct=r["aggregate_health_pct"],
            suspected_fault=r["suspected_fault"],
            confidence=r["confidence"],
            status=r["status"],
            timestamp=r["timestamp"],
            lead_agent=r["lead_agent"],
            summary=r["summary"],
            primary_dependency=r["primary_dependency"],
            symptoms=json.loads(r["symptoms_json"]),
            affected_subnet=r["affected_subnet"]
        )

@router.get("/investigations/{incident_id}/events", response_model=List[InvestigationEvent])
def get_investigation_events(incident_id: str):
    """Returns execution events logged by the agents."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM investigation_events WHERE incident_id = ? ORDER BY id ASC", (incident_id,)).fetchall()
        return [
            InvestigationEvent(
                id=r["id"],
                incident_id=r["incident_id"],
                timestamp=r["timestamp"],
                event_type=r["event_type"],
                agent_name=r["agent_name"],
                description=r["description"],
                payload=json.loads(r["payload_json"]) if r["payload_json"] else None
            )
            for r in rows
        ]

@router.get("/investigations/{incident_id}/messages", response_model=List[AgentMessage])
def get_investigation_messages(incident_id: str):
    """Returns actual inter-agent JSON messages exchanged during investigation."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM agent_messages WHERE incident_id = ? ORDER BY timestamp ASC", (incident_id,)).fetchall()
        return [
            AgentMessage(
                schema_version=r["schema_version"],
                message_id=r["message_id"],
                incident_id=r["incident_id"],
                sender=r["sender"],
                recipient=r["recipient"],
                message_type=r["message_type"],
                timestamp=r["timestamp"],
                topic=r["topic"],
                payload=json.loads(r["payload_json"]),
                evidence_references=json.loads(r["evidence_references_json"]),
                limitations=json.loads(r["limitations_json"]),
                verdict=r["verdict"]
            )
            for r in rows
        ]

@router.get("/investigations/{incident_id}/report", response_model=DiagnosticReport)
def get_investigation_report(incident_id: str):
    """Returns the synthesized Diagnostic Report for the incident."""
    with get_db() as conn:
        r = conn.execute("SELECT * FROM diagnostic_reports WHERE incident_id = ?", (incident_id,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Diagnostic report not found for this incident")
        return DiagnosticReport(
            id=r["id"],
            incident_id=r["incident_id"],
            title=r["title"],
            created_at=r["created_at"],
            lead_adjudicator=r["lead_adjudicator"],
            confidence_level=r["confidence_level"],
            severity=r["severity"],
            zone=r["zone"],
            executive_summary=r["executive_summary"],
            root_cause_analysis=r["root_cause_analysis"],
            counterfactual_delta=r["counterfactual_delta"],
            telemetry_evidence_count=r["telemetry_evidence_count"],
            recommended_actions=json.loads(r["recommended_actions_json"]),
            agent_transcripts_count=r["agent_transcripts_count"],
            verdict=r["verdict"] if "verdict" in r.keys() else None
        )

@router.get("/reports", response_model=List[DiagnosticReport])
def get_all_reports():
    """Returns all persisted diagnostic reports from SQLite."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM diagnostic_reports ORDER BY id DESC").fetchall()
        results = []
        for r in rows:
            results.append(DiagnosticReport(
                id=r["id"],
                incident_id=r["incident_id"],
                title=r["title"],
                created_at=r["created_at"],
                lead_adjudicator=r["lead_adjudicator"],
                confidence_level=r["confidence_level"],
                severity=r["severity"],
                zone=r["zone"],
                executive_summary=r["executive_summary"],
                root_cause_analysis=r["root_cause_analysis"],
                counterfactual_delta=r["counterfactual_delta"],
                telemetry_evidence_count=r["telemetry_evidence_count"],
                recommended_actions=json.loads(r["recommended_actions_json"]),
                agent_transcripts_count=r["agent_transcripts_count"],
                verdict=r["verdict"] if "verdict" in r.keys() else None
            ))
        return results

@router.get("/investigations/{incident_id}/evidence")
def get_investigation_evidence(incident_id: str):
    """Returns supporting/contradicting evidence items and competing hypotheses."""
    with get_db() as conn:
        ev_rows = conn.execute("SELECT * FROM evidence_items WHERE incident_id = ?", (incident_id,)).fetchall()
        hypo_rows = conn.execute("SELECT * FROM competing_hypotheses WHERE incident_id = ? ORDER BY probability DESC", (incident_id,)).fetchall()
        
        evidence = [
            EvidenceItem(
                id=r["id"],
                category=r["category"],
                metric=r["metric"],
                observation=r["observation"],
                comparison_note=r["comparison_note"],
                impact_weight=r["impact_weight"],
                source_agent=r["source_agent"],
                timestamp=r["timestamp"]
            ).model_dump(by_alias=True)
            for r in ev_rows
        ]

        hypotheses = [
            CompetingHypothesis(
                id=r["id"],
                title=r["title"],
                proposed_by=r["proposed_by"],
                probability=r["probability"],
                status=r["status"],
                supporting_args=json.loads(r["supporting_args_json"]),
                counter_args=json.loads(r["counter_args_json"]),
                adjudication_note=r["adjudication_note"]
            ).model_dump(by_alias=True)
            for r in hypo_rows
        ]

        return {
            "evidence": evidence,
            "hypotheses": hypotheses
        }

@router.get("/investigations/{incident_id}/agents")
def get_investigation_agents(incident_id: str):
    """Returns status and findings of the 5 agents for this investigation."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM agent_executions WHERE incident_id = ? ORDER BY execution_order ASC", (incident_id,)).fetchall()
        
        icon_map = {
            "Population Observer": "Eye",
            "Counterfactual Agent": "GitCompare",
            "Topology Investigator": "Network",
            "Fault Investigator": "AlertTriangle",
            "Adjudicator": "ShieldCheck"
        }

        results = []
        for r in rows:
            results.append({
                "id": f"agent-{r['id']}",
                "name": r["agent_name"],
                "role": r["role"],
                "responsibility": r["responsibility"],
                "status": r["status"],
                "latestFinding": r["latest_finding"],
                "lastActive": "Just now",
                "confidenceScore": r["confidence_score"],
                "iconName": icon_map.get(r["agent_name"], "Bot"),
                "agentTag": r["agent_tag"],
                "processedItems": r["processed_items"]
            })
        return results

@router.get("/investigations/{incident_id}/contract")
def get_investigation_contract(incident_id: str):
    """
    Returns the Canonical NetCoop AI Diagnostic JSON Contract for an investigation.
    Validates report against DIAGNOSTIC_REPORT_JSON_SCHEMA.
    """
    with get_db() as conn:
        row = conn.execute("SELECT * FROM diagnostic_reports WHERE incident_id = ?", (incident_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Diagnostic report not found for incident {incident_id}")
        
        # Prefer persisted canonical contract JSON
        raw_contract = row["canonical_contract_json"] if "canonical_contract_json" in row.keys() else None
        if raw_contract:
            try:
                contract_obj = json.loads(raw_contract)
                is_valid, err = validate_diagnostic_contract_json(contract_obj)
                if not is_valid:
                    raise HTTPException(status_code=500, detail=f"Persisted contract failed schema validation: {err}")
                return contract_obj
            except json.JSONDecodeError:
                pass
        
        # Otherwise synthesize canonical contract from diagnostic report
        remedial_raw = json.loads(row["recommended_actions_json"]) if row["recommended_actions_json"] else []
        remedial_strings = [
            item["action"] if isinstance(item, dict) and "action" in item else str(item)
            for item in remedial_raw
        ]
        remedial_details = [
            item for item in remedial_raw if isinstance(item, dict)
        ]
        contract_obj = {
            "incident_id": row["incident_id"],
            "status": "diagnosed" if row["verdict"] != "ABSTAIN_INSUFFICIENT_EVIDENCE" else "abstained",
            "suspected_root_cause": row["title"].replace("Adjudication Report: ", "").replace("Adjudication Abstention: ", ""),
            "confidence": float(row["confidence_level"]),
            "affected_devices": [],
            "supporting_evidence": [
                {
                    "metric": "confidence_level",
                    "value": float(row["confidence_level"]),
                    "interpretation": row["executive_summary"]
                }
            ],
            "alternative_causes": [],
            "alternative_cause_details": [],
            "recommended_actions": remedial_strings,
            "recommended_action_details": remedial_details,
            "evidence_sources": [
                "Population Observer (AGENT-POP-01)",
                "Counterfactual Agent (AGENT-CTF-02)",
                "Topology Investigator (AGENT-TOP-03)",
                "Fault Investigator (AGENT-FLT-04)",
                "Adjudicator (AGENT-ADJ-05)"
            ],
            "limitations": [
                "Assumes static physical topology during sampling epoch",
                "Remediation actions require network engineer authorization before deployment"
            ],
            "verdict": row["verdict"] or "PROBABLE_FAULT",
            "created_at": row["created_at"]
        }
        is_valid, err = validate_diagnostic_contract_json(contract_obj)
        if not is_valid:
            raise HTTPException(status_code=500, detail=f"Synthesized contract failed schema validation: {err}")
        return contract_obj

@router.get("/reports/{report_id}/contract")
def get_report_contract(report_id: str):
    """Returns canonical diagnostic contract by report ID."""
    with get_db() as conn:
        row = conn.execute("SELECT incident_id FROM diagnostic_reports WHERE id = ?", (report_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Diagnostic report {report_id} not found")
        return get_investigation_contract(row["incident_id"])

@router.get("/reports/schema")
def get_diagnostic_report_schema():
    """Returns the documented JSON Schema for diagnostic reports."""
    return DIAGNOSTIC_REPORT_JSON_SCHEMA

@router.get("/organizer/fixtures")
def get_organizer_fixtures():
    """Returns available NetCoop organizer telemetry fixtures."""
    fixtures_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fixtures", "organizer")
    results = {}
    if os.path.exists(fixtures_dir):
        for fname in os.listdir(fixtures_dir):
            if fname.endswith(".json"):
                fpath = os.path.join(fixtures_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        results[fname.replace(".json", "")] = json.load(f)
                except Exception:
                    pass
    return results

@router.post("/organizer/ingest")
def ingest_organizer_telemetry(payload: Dict[str, Any]):
    """
    Ingests and previews external organizer telemetry without launching investigation.
    Validates structure, enforces field bounds, checks freshness, and highlights unprovided fields.
    """
    raw_data = payload.get("data") or payload
    try:
        devices, metadata = OrganizerTelemetryAdapter.parse_and_normalize(raw_data)
        return {
            "success": True,
            "metadata": metadata,
            "preview": [d.model_dump(by_alias=True) for d in devices]
        }
    except TelemetryIngestionError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal ingestion error: {str(exc)}")

@router.post("/organizer/investigate")
def investigate_organizer_telemetry(payload: Dict[str, Any]):
    """
    Runs complete 5-agent investigation pipeline on organizer telemetry.
    Validates report against JSON Schema and returns both full state and canonical contract.
    """
    raw_data = payload.get("data") or payload
    try:
        result = orchestrator.run_organizer_investigation(raw_data)
        return {
            "incident_id": result["incident_id"],
            "status": "completed",
            "report": result["report"].model_dump(by_alias=True),
            "canonical_contract": result["canonical_contract"],
            "investigation": result["investigation"].model_dump(by_alias=True),
            "messages_count": len(result["messages"]),
            "evidence_count": len(result["evidence"]),
            "hypotheses_count": len(result["hypotheses"]),
            "ingestion_metadata": result.get("ingestion_metadata", {})
        }
    except TelemetryIngestionError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except ReportValidationError as r_err:
        raise HTTPException(status_code=500, detail=f"Report schema validation failed: {str(r_err)}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to investigate organizer telemetry: {str(exc)}")
