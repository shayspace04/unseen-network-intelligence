"""
Test Synthetic Network Data Engine and Ground Truth Isolation
"""

import pytest
from backend.app.engine.synthetic import SyntheticNetworkEngine

def test_ground_truth_isolation():
    engine = SyntheticNetworkEngine(seed=42)
    scenario, devices, nodes, edges, ground_truth = engine.generate_scenario_data("dhcp-starvation")

    # Verify ground truth object is distinct from devices and nodes
    assert ground_truth.primary_fault_category == "DHCP"
    assert "DHCP pool exhaustion" in ground_truth.injected_root_cause
    assert len(ground_truth.affected_device_ids) == 6

    # Verify that devices list contains NO ground truth fields
    for dev in devices:
        dev_dict = dev.model_dump()
        assert "primary_fault_category" not in dev_dict
        assert "injected_root_cause" not in dev_dict
        assert "ground_truth" not in dev_dict

def test_deterministic_seed_reproducibility():
    engine1 = SyntheticNetworkEngine(seed=123)
    engine2 = SyntheticNetworkEngine(seed=123)

    _, dev1, _, _, _ = engine1.generate_scenario_data("dhcp-starvation")
    _, dev2, _, _, _ = engine2.generate_scenario_data("dhcp-starvation")

    assert len(dev1) == len(dev2)
    for d1, d2 in zip(dev1, dev2):
        assert d1.deviceId == d2.deviceId
        assert d1.ipAddress == d2.ipAddress
        assert d1.latencyMs == d2.latencyMs

def test_all_six_scenarios():
    engine = SyntheticNetworkEngine(seed=99)
    scenarios = [
        "dhcp-starvation",
        "wifi-degradation",
        "shared-link-congestion",
        "dns-resolver-silent-drop",
        "multiple-simultaneous-faults",
        "healthy-baseline"
    ]

    for s_id in scenarios:
        scenario, devices, nodes, edges, ground_truth = engine.generate_scenario_data(s_id)
        assert scenario.id == s_id
        assert len(devices) >= 400
        assert len(nodes) >= 5
        assert len(edges) >= 4
        assert ground_truth.scenario_id == s_id

def test_symptom_labels_do_not_reveal_injected_root_cause():
    engine = SyntheticNetworkEngine(seed=42)
    scenario, _, _, _, _ = engine.generate_scenario_data("dhcp-starvation")
    # Verify the user-facing name describes the observed symptom rather than direct diagnosis
    assert "Intermittent IP Lease Timeouts" in scenario.name
