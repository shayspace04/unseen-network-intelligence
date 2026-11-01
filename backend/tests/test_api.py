"""
Test FastAPI Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_get_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["agents_ready"] == 5

def test_get_scenarios(client):
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 6
    assert any(s["id"] == "dhcp-starvation" for s in data)
    assert any(s["id"] == "ethernet-interface-fault" for s in data)

def test_get_topology(client):
    response = client.get("/api/topology?scenario_id=dhcp-starvation")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 5

def test_post_investigations_and_fetch_details(client):
    post_res = client.post("/api/investigations", json={"scenario_id": "wifi-degradation"})
    assert post_res.status_code == 200
    data = post_res.json()
    incident_id = data["incident_id"]

    # Fetch investigation
    inv_res = client.get(f"/api/investigations/{incident_id}")
    assert inv_res.status_code == 200
    inv = inv_res.json()
    assert inv["affected_count"] == 8

    # Fetch events
    events_res = client.get(f"/api/investigations/{incident_id}/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 5

    # Fetch messages
    msg_res = client.get(f"/api/investigations/{incident_id}/messages")
    assert msg_res.status_code == 200
    messages = msg_res.json()
    assert len(messages) == 5

    # Fetch report
    rep_res = client.get(f"/api/investigations/{incident_id}/report")
    assert rep_res.status_code == 200
    rep = rep_res.json()
    assert "Wi-Fi" in rep["title"] or "Co-Channel" in rep["title"]

    # Fetch evidence
    ev_res = client.get(f"/api/investigations/{incident_id}/evidence")
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert len(ev_data["evidence"]) >= 1
    assert len(ev_data["hypotheses"]) >= 1
