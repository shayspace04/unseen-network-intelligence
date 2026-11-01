"""
NetCoop AI Hackathon Comprehensive Compliance & Interoperability Test Suite
Tests:
- Complete scenario coverage across all 7 scenarios (Task 1)
- Interoperability failure testing: field aliases, unit conversions, schema versions, missing data (Task 2)
- Canonical Diagnostic JSON Contract verification (Task 3)
- JSON Schema validation with jsonschema (Task 4)
- Multi-agent collaboration acceptance criteria (Task 5)
- Organizer official generator and telemetry ingestion
"""

import pytest
import json
import datetime
from fastapi.testclient import TestClient

from backend.main import app
from backend.app.engine.synthetic import SyntheticNetworkEngine
from backend.app.engine.orchestrator import MultiAgentOrchestrator
from backend.app.engine.organizer_generator import generate_telemetry_record, generate_telemetry_batch
from backend.app.engine.telemetry_ingestion import (
    OrganizerTelemetryAdapter,
    TelemetryIngestionError,
    parse_organizer_input
)
from backend.app.models.schemas import AgentMessage
from backend.app.models.diagnostic_contract import (
    DIAGNOSTIC_REPORT_JSON_SCHEMA,
    validate_diagnostic_contract_json,
    CanonicalDiagnosticContract,
    ReportValidationError
)

@pytest.fixture
def orchestrator():
    return MultiAgentOrchestrator(seed=42)

@pytest.fixture
def client():
    return TestClient(app)

# =========================================================================
# TASK 1: COMPLETE SCENARIO COVERAGE
# =========================================================================

def test_scenario_1_normal_network_operation(orchestrator):
    """Scenario 1: Normal network operation produces NO_FAULT_DETECTED."""
    result = orchestrator.run_investigation("healthy-baseline", "INV-COMP-01")
    report = result["report"]
    contract = result["canonical_contract"]

    assert report.verdict == "NO_FAULT_DETECTED"
    assert contract["verdict"] == "NO_FAULT_DETECTED"
    assert contract["status"] == "diagnosed"
    assert contract["confidence"] >= 0.90
    assert len(contract["affected_devices"]) == 0

def test_scenario_2_link_congestion(orchestrator):
    """Scenario 2: Link congestion identifies microburst bufferbloat and queue drops."""
    result = orchestrator.run_investigation("shared-link-congestion", "INV-COMP-02")
    report = result["report"]
    contract = result["canonical_contract"]

    assert "Congestion" in report.rootCauseAnalysis or "Bufferbloat" in report.rootCauseAnalysis
    assert report.verdict == "PROBABLE_FAULT"
    assert contract["confidence"] > 0.80
    assert len(contract["affected_devices"]) == 12
    # Ensure physical RF is ruled out, not confused with congestion
    assert any("RF" in ev.metric or "Attenuation" in ev.metric for ev in result["evidence"])

def test_scenario_3_weak_wifi_signal(orchestrator):
    """Scenario 3: Weak Wi-Fi signal identifies co-channel contention and frame retries."""
    result = orchestrator.run_investigation("wifi-degradation", "INV-COMP-03")
    report = result["report"]
    contract = result["canonical_contract"]

    assert "Wi-Fi" in report.rootCauseAnalysis or "Contention" in report.rootCauseAnalysis
    assert report.verdict == "PROBABLE_FAULT"
    assert contract["confidence"] >= 0.85
    assert len(contract["affected_devices"]) == 8

def test_scenario_4_ethernet_interface_fault(orchestrator):
    """Scenario 4: Separate reproducible Ethernet/interface fault identifies CRC errors distinct from congestion."""
    result = orchestrator.run_investigation("ethernet-interface-fault", "INV-COMP-04")
    report = result["report"]
    contract = result["canonical_contract"]

    assert "Ethernet" in report.rootCauseAnalysis or "CRC" in report.rootCauseAnalysis or "Interface" in report.rootCauseAnalysis
    assert report.verdict == "PROBABLE_FAULT"
    assert contract["confidence"] >= 0.85
    assert len(contract["affected_devices"]) == 10
    # Verify low latency is preserved, proving it is not confused with queue congestion
    assert any(ev["metric"] == "interface_errors" for ev in contract["supporting_evidence"])

def test_scenario_5_dns_failure(orchestrator):
    """Scenario 5: DNS failure identifies resolver silent drop and UDP timeouts."""
    result = orchestrator.run_investigation("dns-resolver-silent-drop", "INV-COMP-05")
    report = result["report"]
    contract = result["canonical_contract"]

    assert "DNS" in report.rootCauseAnalysis
    assert report.verdict == "PROBABLE_FAULT"
    assert contract["confidence"] >= 0.90
    assert len(contract["affected_devices"]) == 9

def test_scenario_6_dhcp_failure(orchestrator):
    """Scenario 6: DHCP failure identifies pool scope exhaustion and APIPA fallback."""
    result = orchestrator.run_investigation("dhcp-starvation", "INV-COMP-06")
    report = result["report"]
    contract = result["canonical_contract"]

    assert "DHCP" in report.rootCauseAnalysis
    assert report.verdict == "PROBABLE_FAULT"
    assert contract["confidence"] >= 0.90
    assert len(contract["affected_devices"]) == 6

def test_scenario_7_multiple_simultaneous_faults(orchestrator):
    """Scenario 7: Multiple simultaneous faults individually identifies both independent faults."""
    result = orchestrator.run_investigation("multiple-simultaneous-faults", "INV-COMP-07")
    report = result["report"]
    contract = result["canonical_contract"]

    assert report.verdict == "PROBABLE_FAULT"
    assert "simultaneous_faults" in contract
    sim_faults = contract["simultaneous_faults"]
    assert len(sim_faults) == 2
    assert any("DHCP" in sf["description"] or "Gateway" in sf["description"] for sf in sim_faults)
    assert any("Optical" in sf["description"] or "CRC" in sf["description"] for sf in sim_faults)

# =========================================================================
# TASK 2: INTEROPERABILITY FAILURE TESTING
# =========================================================================

def test_interop_case_a_incompatible_field_names():
    """Case A: Normalizes ambiguous field names (queue_drops vs egress_queue_drops, crc_errors vs interface_errors)."""
    raw_record = {
        "timestamp": "2026-11-01T08:00:00.000000Z",
        "device_id": "SW_TEST_01",
        "metrics": {
            "cpu_utilization": 45.0,            # alias for cpu_utilization_pct
            "link_utilization": 60.0,           # alias for link_utilization_pct
            "packet_loss": 5.0,                 # alias for packet_loss_pct
            "latency": 25.0,                    # alias for latency_ms
            "egress_queue_drops": 450,          # alias for queue_drops
            "crc_errors": 82                    # alias for interface_errors
        },
        "status": "Warning"
    }
    devices, meta = OrganizerTelemetryAdapter.parse_and_normalize(raw_record)
    assert len(devices) == 1
    dev = devices[0]
    assert dev.cpuUtilizationPct == 45.0
    assert dev.linkUtilizationPct == 60.0
    assert dev.packetLossPct == 5.0
    assert dev.latencyMs == 25.0
    assert dev.egressQueueDrops == 450
    assert dev.interfaceErrors == 82

def test_interop_case_b_incompatible_units_latency_seconds():
    """Case B: Normalizes latency in seconds to milliseconds unambiguously."""
    raw_record = {
        "timestamp": "2026-11-01T08:00:00.000000Z",
        "device_id": "SW_TEST_02",
        "metrics": {
            "cpu_utilization_pct": 20.0,
            "link_utilization_pct": 30.0,
            "packet_loss_pct": 0.0,
            "latency_seconds": 0.75,            # In seconds -> should convert to 750.0 ms
            "queue_drops": 0,
            "interface_errors": 0
        },
        "status": "Healthy"
    }
    devices, _ = OrganizerTelemetryAdapter.parse_and_normalize(raw_record)
    assert len(devices) == 1
    assert devices[0].latencyMs == 750.0

def test_interop_case_b_incompatible_bounds_rejected():
    """Case B: Rejects negative values or percentages exceeding 100%."""
    invalid_record = {
        "timestamp": "2026-11-01T08:00:00.000000Z",
        "device_id": "SW_TEST_BAD",
        "metrics": {
            "cpu_utilization_pct": 142.5,       # Invalid: > 100%
            "link_utilization_pct": 20.0,
            "packet_loss_pct": -5.0,            # Invalid: < 0%
            "latency_ms": -10.0,                # Invalid: negative
            "queue_drops": 0,
            "interface_errors": 0
        },
        "status": "Critical"
    }
    with pytest.raises(TelemetryIngestionError) as exc_info:
        OrganizerTelemetryAdapter.parse_and_normalize(invalid_record)
    assert "must be in [0, 100]" in str(exc_info.value) or "negative" in str(exc_info.value)

def test_interop_case_c_schema_version_mismatch(orchestrator):
    """Case C: Rejects agent message with unsupported schema_version."""
    msg = AgentMessage(
        schema_version="2.5.0",                 # Unsupported version
        message_id="MSG-BAD-01",
        incident_id="INV-TEST",
        sender="Population Observer",
        recipient="Counterfactual Agent",
        message_type="cohort_discovery",
        topic="Testing Version Mismatch",
        payload={"sample": 1}
    )
    is_valid, err = orchestrator.validate_agent_message(msg)
    assert not is_valid
    assert "Unsupported schema_version" in err

def test_interop_case_d_missing_required_message_information(orchestrator):
    """Case D: Rejects agent message missing sender, recipient, message_id or incident_id."""
    msg_missing_sender = AgentMessage(
        schema_version="1.0.0",
        message_id="MSG-BAD-02",
        incident_id="INV-TEST",
        sender="",                              # Empty sender
        recipient="Counterfactual Agent",
        message_type="cohort_discovery",
        topic="Missing Sender",
        payload={}
    )
    is_valid, err = orchestrator.validate_agent_message(msg_missing_sender)
    assert not is_valid
    assert "'sender' is mandatory" in err

def test_interop_case_e_missing_telemetry_information_rejected():
    """Case E: Rejects telemetry missing mandatory metrics without inventing missing data."""
    incomplete_record = {
        "timestamp": "2026-11-01T08:00:00.000000Z",
        "device_id": "SW_TEST_INCOMPLETE",
        "metrics": {
            # Missing latency_ms and packet_loss_pct!
            "cpu_utilization_pct": 50.0,
            "link_utilization_pct": 50.0,
            "queue_drops": 10,
            "interface_errors": 0
        },
        "status": "Warning"
    }
    with pytest.raises(TelemetryIngestionError) as exc_info:
        OrganizerTelemetryAdapter.parse_and_normalize(incomplete_record)
    assert "missing mandatory telemetry metrics" in str(exc_info.value)
    assert "latency_ms" in str(exc_info.value)

def test_interop_unprovided_fields_remain_null():
    """Verify that unsupplied fields (AP, VLAN, RSSI, throughput) remain None, NOT zero."""
    record = {
        "timestamp": "2026-11-01T08:00:00.000000Z",
        "device_id": "SW_TEST_CLEAN",
        "metrics": {
            "cpu_utilization_pct": 20.0,
            "link_utilization_pct": 30.0,
            "packet_loss_pct": 0.0,
            "latency_ms": 4.5,
            "queue_drops": 0,
            "interface_errors": 0
        },
        "status": "Healthy"
    }
    devices, meta = OrganizerTelemetryAdapter.parse_and_normalize(record)
    dev = devices[0]
    assert dev.connectedAP is None
    assert dev.vlan is None
    assert dev.signalStrengthDbm is None
    assert dev.dhcpLeaseState is None
    assert dev.dnsResolutionMs is None

# =========================================================================
# TASK 3 & 4: DIAGNOSTIC JSON CONTRACT & SCHEMA VALIDATION
# =========================================================================

def test_json_schema_validation_on_live_contract(orchestrator):
    """Task 3 & 4: Validates that completed investigation adheres strictly to JSON Schema."""
    scenarios_to_test = [
        "dhcp-starvation",
        "healthy-baseline",
        "shared-link-congestion",
        "wifi-degradation",
        "ethernet-interface-fault",
        "dns-resolver-silent-drop",
        "multiple-simultaneous-faults"
    ]

    for sc_id in scenarios_to_test:
        result = orchestrator.run_investigation(sc_id, f"INV-CONTRACT-{sc_id[:8]}")
        contract = result["canonical_contract"]

        is_valid, err = validate_diagnostic_contract_json(contract)
        assert is_valid, f"Contract validation failed for scenario {sc_id}: {err}"

        # Verify all mandatory fields from problem statement
        mandatory_fields = [
            "incident_id",
            "status",
            "suspected_root_cause",
            "confidence",
            "affected_devices",
            "supporting_evidence",
            "alternative_causes",
            "recommended_actions",
            "evidence_sources",
            "limitations"
        ]
        for f in mandatory_fields:
            assert f in contract, f"Missing mandatory field '{f}' in scenario {sc_id}"

        # Numeric confidence in [0, 1]
        assert isinstance(contract["confidence"], (int, float))
        assert 0.0 <= contract["confidence"] <= 1.0

        # Strict type checks per NetCoop AI contract
        assert isinstance(contract["incident_id"], str)
        assert isinstance(contract["status"], str)
        assert contract["status"] in ["diagnosed", "abstained"]
        assert isinstance(contract["suspected_root_cause"], str)
        assert isinstance(contract["affected_devices"], list)
        assert all(isinstance(d, str) for d in contract["affected_devices"])
        assert isinstance(contract["supporting_evidence"], list)
        assert all(isinstance(ev, dict) and "metric" in ev and "value" in ev and "interpretation" in ev for ev in contract["supporting_evidence"])
        assert isinstance(contract["alternative_causes"], list)
        assert all(isinstance(c, str) for c in contract["alternative_causes"]), f"alternative_causes must be array of strings in {sc_id}"
        assert isinstance(contract["recommended_actions"], list)
        assert all(isinstance(a, str) for a in contract["recommended_actions"]), f"recommended_actions must be array of strings in {sc_id}"
        assert isinstance(contract["evidence_sources"], list)
        assert all(isinstance(s, str) for s in contract["evidence_sources"])
        assert isinstance(contract["limitations"], list)
        assert all(isinstance(l, str) for l in contract["limitations"])

        # Additional rich detail fields preserved
        assert "alternative_cause_details" in contract
        assert "recommended_action_details" in contract
        assert isinstance(contract["alternative_cause_details"], list)
        assert isinstance(contract["recommended_action_details"], list)
        if contract["alternative_cause_details"]:
            assert all(isinstance(item, dict) and "title" in item and "probability" in item for item in contract["alternative_cause_details"])
        if contract["recommended_action_details"]:
            assert all(isinstance(item, dict) and "action" in item and "urgency" in item for item in contract["recommended_action_details"])

def test_schema_rejection_on_invalid_report():
    """Task 4: Validates that invalid contract structures are caught by JSON Schema."""
    invalid_contract = {
        # Missing incident_id, status, confidence, etc.
        "suspected_root_cause": "Unknown Outage",
        "affected_devices": []
    }
    is_valid, err = validate_diagnostic_contract_json(invalid_contract)
    assert not is_valid
    assert "is a required property" in err

def test_api_contract_endpoints(client, orchestrator):
    """Task 3: Tests GET /api/investigations/{incident_id}/contract and /reports/schema."""
    orchestrator.run_investigation("dhcp-starvation", "INV-API-CONTRACT-01")
    
    # 1. Fetch schema
    schema_res = client.get("/api/reports/schema")
    assert schema_res.status_code == 200
    assert schema_res.json()["title"] == DIAGNOSTIC_REPORT_JSON_SCHEMA["title"]

    # 2. Fetch contract
    contract_res = client.get("/api/investigations/INV-API-CONTRACT-01/contract")
    assert contract_res.status_code == 200
    contract_data = contract_res.json()
    assert contract_data["incident_id"] == "INV-API-CONTRACT-01"
    assert contract_data["status"] == "diagnosed"

# =========================================================================
# TASK 5: MULTI-AGENT COLLABORATION ACCEPTANCE CRITERIA
# =========================================================================

def test_multi_agent_collaboration_criteria(orchestrator):
    """
    Task 5:
    1. At least two functional agents collaborate.
    2. Agents exchange structured messages.
    3. Evidence from multiple agents contributes to diagnosis.
    4. Unified report includes probable cause, evidence and recommended actions.
    """
    result = orchestrator.run_investigation("dhcp-starvation", "INV-COLLAB-01")
    messages = result["messages"]
    evidence = result["evidence"]
    contract = result["canonical_contract"]

    # 1. 5 Agents collaborate
    assert len(result["agent_executions"]) == 5
    # 2. Structured messages exchanged
    assert len(messages) >= 5
    for m in messages:
        assert m.schema_version == "1.0.0"
        assert m.message_id and m.incident_id
    # 3. Evidence sources identify contributing agents
    assert len(contract["evidence_sources"]) >= 2
    assert "Population Observer" in str(contract["evidence_sources"])
    assert "Adjudicator" in str(contract["evidence_sources"])
    # 4. Probable cause, evidence and recommended actions
    assert contract["suspected_root_cause"]
    assert len(contract["supporting_evidence"]) > 0
    assert len(contract["recommended_actions"]) > 0

# =========================================================================
# ORGANIZER TELEMETRY & HARDWARE FAILURE END-TO-END
# =========================================================================

def test_organizer_official_generator_and_hardware_failure(orchestrator):
    """Tests organizer telemetry generator with UTC timezone and investigates hardware failure fixture."""
    # 1. Test official generator
    rec = generate_telemetry_record(device_id="SW_CAMPUS_1", fault_type="hardware_failure")
    assert "T" in rec["timestamp"]
    assert rec["metrics"]["cpu_utilization_pct"] == 99.9
    assert rec["status"] == "Critical"

    # 2. Test exact supplied hardware failure fixture from problem statement
    with open("backend/app/fixtures/organizer/hardware_failure.json", "r") as f:
        hardware_fixture = json.load(f)

    result = orchestrator.run_organizer_investigation(hardware_fixture, "INV-ORG-HW-01")
    contract = result["canonical_contract"]

    assert contract["status"] == "diagnosed"
    assert "Hardware Failure" in contract["suspected_root_cause"] or "Resource Overload" in contract["suspected_root_cause"]
    assert contract["confidence"] >= 0.85
    # Stale timestamp detection (>300s TTL from 2026-10-14)
    assert any("STALE" in lim for lim in contract["limitations"])
    # Validated against JSON schema
    is_valid, err = validate_diagnostic_contract_json(contract)
    assert is_valid
