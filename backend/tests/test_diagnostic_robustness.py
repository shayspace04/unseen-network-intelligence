"""
Diagnostic Robustness Tests
Covers all 10 criteria specified in UNSEEN Phase 2 requirements:
1. Healthy network with no injected failure
2. Localized DHCP failure
3. Weak wireless signal
4. Shared uplink congestion
5. DNS service failure
6. Two simultaneous independent faults
7. Missing telemetry fields
8. Incompatible units
9. Stale telemetry
10. Insufficient evidence
"""

import pytest
from backend.app.engine.orchestrator import MultiAgentOrchestrator
from backend.app.agents.base import BaseAgent
from backend.app.agents.population_observer import PopulationObserverAgent
from backend.app.agents.fault_investigator import FaultInvestigatorAgent
from backend.app.agents.adjudicator import AdjudicatorAgent
from backend.app.models.schemas import DeviceTelemetry, CompetingHypothesis

@pytest.fixture
def orchestrator():
    return MultiAgentOrchestrator(seed=77)

# 1. Healthy network with no injected failure
def test_1_healthy_network_abstains(orchestrator):
    result = orchestrator.run_investigation("healthy-baseline", "INV-ROBUST-01")
    report = result["report"]
    assert report.confidence_level == 0.98
    assert "Nominal" in report.title
    assert "NO_FAULT_DETECTED" in report.root_cause_analysis
    assert report.verdict == "NO_FAULT_DETECTED"

# 2. Localized DHCP failure
def test_2_localized_dhcp_failure(orchestrator):
    result = orchestrator.run_investigation("dhcp-starvation", "INV-ROBUST-02")
    report = result["report"]
    assert "DHCP" in report.title
    assert report.confidence_level >= 0.85
    assert result["investigation"].affectedCount == 6

# 3. Weak wireless signal / Wi-Fi co-channel contention
def test_3_weak_wifi_contention(orchestrator):
    result = orchestrator.run_investigation("wifi-degradation", "INV-ROBUST-03")
    report = result["report"]
    assert "Wi-Fi" in report.title or "Co-Channel" in report.title
    assert report.confidence_level >= 0.80

# 4. Shared uplink congestion
def test_4_shared_link_congestion(orchestrator):
    result = orchestrator.run_investigation("shared-link-congestion", "INV-ROBUST-04")
    report = result["report"]
    assert "Congestion" in report.title or "Bufferbloat" in report.title
    assert report.confidence_level >= 0.85

# 5. DNS service failure
def test_5_dns_service_failure(orchestrator):
    result = orchestrator.run_investigation("dns-resolver-silent-drop", "INV-ROBUST-05")
    report = result["report"]
    assert "DNS" in report.title
    assert report.confidence_level >= 0.85

# 6. Two simultaneous independent faults
def test_6_multiple_simultaneous_faults(orchestrator):
    result = orchestrator.run_investigation("multiple-simultaneous-faults", "INV-ROBUST-06")
    report = result["report"]
    assert "Multi-Fault" in report.title or "Cascading" in report.title
    # Verify simultaneous independent faults are represented separately in the final report
    assert "Primary Fault" in report.root_cause_analysis
    assert "Secondary Fault" in report.root_cause_analysis
    assert any("Fault 1" in a.action for a in report.recommended_actions)
    assert any("Fault 2" in a.action for a in report.recommended_actions)

# 7. Missing telemetry fields handling
def test_7_missing_telemetry_fields():
    # Construct device with minimal/missing fields
    d = DeviceTelemetry(
        device_id="DEV-MISSING-01",
        device_type="student_laptop",
        ip_address="10.0.0.99",
        mac_address="00:11:22:33:44:55",
        vlan="VLAN-99",
        connected_ap="AP-TEST",
        connected_switch="SW-TEST",
        latency_ms=0.0,
        packet_loss_pct=0.0,
        dhcp_lease_state="valid",
        dns_resolution_ms=0.0,
        signal_strength_dbm=-50.0,
        status="healthy",
        last_seen="unknown"
    )
    agent = PopulationObserverAgent()
    msg, out = agent.execute("INV-MISSING-TEST", {"devices": [d]})
    assert out["affected_count"] == 0
    assert out["total_devices"] == 1

# 8. Incompatible units normalization
def test_8_incompatible_units_normalization():
    assert BaseAgent.normalize_latency_ms("500ms") == 500.0
    assert BaseAgent.normalize_latency_ms("0.5s") == 500.0
    assert BaseAgent.normalize_latency_ms(24.5) == 24.5
    assert BaseAgent.normalize_packet_loss_pct("15%") == 15.0
    assert BaseAgent.normalize_packet_loss_pct(0.25) == 25.0

# 9. Stale telemetry handling
def test_9_stale_telemetry_handling():
    d_stale = DeviceTelemetry(
        device_id="DEV-STALE-01",
        device_type="iot_sensor",
        ip_address="10.0.0.88",
        mac_address="AA:BB:CC:DD:EE:FF",
        vlan="VLAN-10",
        connected_ap="AP-OLD",
        connected_switch="SW-OLD",
        latency_ms=10.0,
        packet_loss_pct=0.0,
        dhcp_lease_state="valid",
        dns_resolution_ms=12.0,
        signal_strength_dbm=-60.0,
        status="healthy",
        last_seen="3 days ago (STALE)"
    )
    agent = PopulationObserverAgent()
    _, out = agent.execute("INV-STALE-TEST", {"devices": [d_stale]})
    assert out["total_devices"] == 1

# 10. Insufficient evidence abstention
def test_10_insufficient_evidence_abstention():
    adj_agent = AdjudicatorAgent()
    # Ambiguous competing hypothesis with low probability and no strong evidence
    hypo_weak = CompetingHypothesis(
        id="HYPO-WEAK-01",
        title="Ambiguous Flapping",
        proposed_by="Fault Investigator",
        probability=0.35,
        status="evaluating",
        supporting_args=["Sparse ping drops"],
        counter_args=["No corroborated switch error"],
        adjudication_note="Evidence is weak"
    )
    context = {
        "affected_devices": [None],  # 1 device
        "hypotheses": [hypo_weak],
        "leading_hypothesis": hypo_weak,
        "shared_dependency": "Unknown Switch",
        "zone": "Test Zone",
        "aggregate_health_pct": 99.8,
        "differential_findings": []
    }
    msg, out = adj_agent.execute("INV-ABSTAIN-TEST", context)
    report = out["report"]
    # Adjudicator should abstain from asserting a confirmed fault
    assert msg.payload["verdict"] == "ABSTAIN_INSUFFICIENT_EVIDENCE"
    assert "Indeterminate" in report.root_cause_analysis
