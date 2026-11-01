"""
Test Multi-Agent Orchestrator Pipeline and SQLite Persistence
"""

import pytest
from backend.app.engine.orchestrator import MultiAgentOrchestrator
from backend.app.db.database import get_db

def test_full_orchestration_run():
    import uuid
    orchestrator = MultiAgentOrchestrator(seed=42)
    incident_id = f"INV-ORCH-TEST-{uuid.uuid4().hex[:6]}"

    result = orchestrator.run_investigation(scenario_id="dhcp-starvation", incident_id=incident_id)

    assert result["incident_id"] == incident_id
    assert result["investigation"].status == "resolved"
    assert result["investigation"].affectedCount == 6
    assert len(result["messages"]) == 5
    assert len(result["agent_executions"]) == 5
    assert result["report"].confidenceLevel >= 0.85

    # Check persistence in SQLite
    with get_db() as conn:
        inv_row = conn.execute("SELECT * FROM investigations WHERE incident_id = ?", (incident_id,)).fetchone()
        assert inv_row is not None
        assert inv_row["affected_count"] == 6

        msg_rows = conn.execute("SELECT * FROM agent_messages WHERE incident_id = ?", (incident_id,)).fetchall()
        assert len(msg_rows) == 5

        events_rows = conn.execute("SELECT * FROM investigation_events WHERE incident_id = ?", (incident_id,)).fetchall()
        assert len(events_rows) >= 10

        rep_row = conn.execute("SELECT * FROM diagnostic_reports WHERE incident_id = ?", (incident_id,)).fetchone()
        assert rep_row is not None
        assert "DHCP" in rep_row["title"]
