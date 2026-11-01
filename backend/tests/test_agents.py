"""
Test Suite for the 5 Specialized Autonomous Agents
"""

import pytest
from backend.app.engine.synthetic import SyntheticNetworkEngine
from backend.app.agents.population_observer import PopulationObserverAgent
from backend.app.agents.counterfactual import CounterfactualAgent
from backend.app.agents.topology_investigator import TopologyInvestigatorAgent
from backend.app.agents.fault_investigator import FaultInvestigatorAgent
from backend.app.agents.adjudicator import AdjudicatorAgent

@pytest.fixture
def dhcp_scenario_data():
    engine = SyntheticNetworkEngine(seed=42)
    return engine.generate_scenario_data("dhcp-starvation")

def test_agent_1_population_observer(dhcp_scenario_data):
    scenario, devices, nodes, edges, _ = dhcp_scenario_data
    agent = PopulationObserverAgent()

    msg, out = agent.execute("INV-TEST-01", {"devices": devices})

    assert msg.schema_version == "1.0.0"
    assert msg.sender == "Population Observer"
    assert msg.recipient == "Counterfactual Agent"
    assert msg.message_type == "cohort_discovery"
    assert out["affected_count"] == 6
    assert out["aggregate_health_pct"] == 98.8
    assert len(out["affected_devices"]) == 6

def test_agent_2_counterfactual(dhcp_scenario_data):
    scenario, devices, nodes, edges, _ = dhcp_scenario_data
    pop_agent = PopulationObserverAgent()
    _, pop_out = pop_agent.execute("INV-TEST-02", {"devices": devices})

    ctf_agent = CounterfactualAgent()
    msg, out = ctf_agent.execute("INV-TEST-02", pop_out)

    assert msg.schema_version == "1.0.0"
    assert msg.sender == "Counterfactual Agent"
    assert msg.recipient == "Topology Investigator"
    assert "metrics_comparison" in out
    comp = out["metrics_comparison"]
    assert comp["unassigned_dhcp_count"]["affected"] == 6
    assert comp["unassigned_dhcp_count"]["healthy_twin"] == 0

def test_agent_3_topology_investigator(dhcp_scenario_data):
    scenario, devices, nodes, edges, _ = dhcp_scenario_data
    pop_agent = PopulationObserverAgent()
    _, pop_out = pop_agent.execute("INV-TEST-03", {"devices": devices})

    top_agent = TopologyInvestigatorAgent()
    context = {
        "nodes": nodes,
        "edges": edges,
        "affected_devices": pop_out["affected_devices"]
    }
    msg, out = top_agent.execute("INV-TEST-03", context)

    assert msg.schema_version == "1.0.0"
    assert msg.sender == "Topology Investigator"
    assert msg.recipient == "Fault Investigator"
    assert "AP-ENG-04" in out["shared_dependency"]

def test_agent_4_fault_investigator(dhcp_scenario_data):
    scenario, devices, nodes, edges, _ = dhcp_scenario_data
    pop_agent = PopulationObserverAgent()
    _, pop_out = pop_agent.execute("INV-TEST-04", {"devices": devices})

    ctf_agent = CounterfactualAgent()
    _, ctf_out = ctf_agent.execute("INV-TEST-04", pop_out)

    top_agent = TopologyInvestigatorAgent()
    _, top_out = top_agent.execute("INV-TEST-04", {
        "nodes": nodes,
        "edges": edges,
        "affected_devices": pop_out["affected_devices"]
    })

    flt_agent = FaultInvestigatorAgent()
    context = {
        "affected_devices": pop_out["affected_devices"],
        "metrics_comparison": ctf_out["metrics_comparison"],
        "shared_dependency": top_out["shared_dependency"]
    }
    msg, out = flt_agent.execute("INV-TEST-04", context)

    assert msg.schema_version == "1.0.0"
    assert msg.sender == "Fault Investigator"
    assert msg.recipient == "Adjudicator"
    assert len(out["hypotheses"]) >= 4
    leading = out["leading_hypothesis"]
    assert "DHCP" in leading.title
    assert leading.probability >= 0.90

def test_agent_5_adjudicator(dhcp_scenario_data):
    scenario, devices, nodes, edges, _ = dhcp_scenario_data
    pop_agent = PopulationObserverAgent()
    _, pop_out = pop_agent.execute("INV-TEST-05", {"devices": devices})

    ctf_agent = CounterfactualAgent()
    _, ctf_out = ctf_agent.execute("INV-TEST-05", pop_out)

    top_agent = TopologyInvestigatorAgent()
    _, top_out = top_agent.execute("INV-TEST-05", {
        "nodes": nodes,
        "edges": edges,
        "affected_devices": pop_out["affected_devices"]
    })

    flt_agent = FaultInvestigatorAgent()
    _, flt_out = flt_agent.execute("INV-TEST-05", {
        "affected_devices": pop_out["affected_devices"],
        "metrics_comparison": ctf_out["metrics_comparison"],
        "shared_dependency": top_out["shared_dependency"]
    })

    adj_agent = AdjudicatorAgent()
    context = {
        "affected_devices": pop_out["affected_devices"],
        "hypotheses": flt_out["hypotheses"],
        "leading_hypothesis": flt_out["leading_hypothesis"],
        "shared_dependency": top_out["shared_dependency"],
        "zone": scenario.affectedZone,
        "aggregate_health_pct": scenario.aggregateHealthPct,
        "differential_findings": ctf_out["differential_findings"]
    }
    msg, out = adj_agent.execute("INV-TEST-05", context)

    assert msg.schema_version == "1.0.0"
    assert msg.sender == "Adjudicator"
    assert msg.recipient == "Population Observer"
    report = out["report"]
    assert report.confidence_level >= 0.85
    assert "DHCP" in report.root_cause_analysis
    assert len(report.recommended_actions) >= 2
