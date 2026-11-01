"""
UNSEEN Database Layer - SQLite persistence for multi-agent network intelligence
"""

import sqlite3
import json
import os
from contextlib import contextmanager
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "unseen.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initializes SQLite tables for UNSEEN platform."""
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS scenarios (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            symptom_label TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            monitored_devices INTEGER NOT NULL,
            healthy_devices INTEGER NOT NULL,
            affected_devices INTEGER NOT NULL,
            aggregate_health_pct REAL NOT NULL,
            affected_zone TEXT NOT NULL,
            suspected_fault TEXT NOT NULL,
            confidence_score REAL NOT NULL,
            symptoms_json TEXT NOT NULL,
            recommended_fix TEXT NOT NULL,
            ground_truth_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT NOT NULL,
            scenario_id TEXT NOT NULL,
            device_type TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            mac_address TEXT NOT NULL,
            vlan TEXT NOT NULL,
            connected_ap TEXT NOT NULL,
            connected_switch TEXT NOT NULL,
            latency_ms REAL NOT NULL,
            packet_loss_pct REAL NOT NULL,
            dhcp_lease_state TEXT NOT NULL,
            dns_resolution_ms REAL NOT NULL,
            signal_strength_dbm REAL NOT NULL,
            jitter_ms REAL NOT NULL,
            interface_errors INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL,
            last_seen TEXT NOT NULL,
            PRIMARY KEY (device_id, scenario_id),
            FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS topology_nodes (
            id TEXT NOT NULL,
            scenario_id TEXT NOT NULL,
            label TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            zone TEXT NOT NULL,
            ip TEXT NOT NULL,
            throughput TEXT NOT NULL,
            packet_loss TEXT NOT NULL,
            connected_devices INTEGER,
            affected_count INTEGER,
            details_json TEXT,
            position_x REAL NOT NULL DEFAULT 0,
            position_y REAL NOT NULL DEFAULT 0,
            PRIMARY KEY (id, scenario_id),
            FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS topology_edges (
            id TEXT NOT NULL,
            scenario_id TEXT NOT NULL,
            source TEXT NOT NULL,
            target TEXT NOT NULL,
            animated INTEGER NOT NULL DEFAULT 1,
            style_json TEXT,
            PRIMARY KEY (id, scenario_id),
            FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS investigations (
            incident_id TEXT PRIMARY KEY,
            scenario_id TEXT NOT NULL,
            title TEXT NOT NULL,
            zone TEXT NOT NULL,
            affected_count INTEGER NOT NULL,
            healthy_count INTEGER NOT NULL,
            monitored_count INTEGER NOT NULL,
            aggregate_health_pct REAL NOT NULL,
            suspected_fault TEXT NOT NULL,
            confidence REAL NOT NULL,
            status TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            lead_agent TEXT NOT NULL,
            summary TEXT NOT NULL,
            primary_dependency TEXT NOT NULL,
            symptoms_json TEXT NOT NULL,
            affected_subnet TEXT NOT NULL,
            FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS investigation_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            description TEXT NOT NULL,
            payload_json TEXT,
            FOREIGN KEY (incident_id) REFERENCES investigations(incident_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS agent_messages (
            message_id TEXT PRIMARY KEY,
            schema_version TEXT NOT NULL DEFAULT '1.0.0',
            incident_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            recipient TEXT NOT NULL,
            message_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            topic TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            evidence_references_json TEXT NOT NULL,
            limitations_json TEXT NOT NULL,
            verdict TEXT,
            FOREIGN KEY (incident_id) REFERENCES investigations(incident_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS agent_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            agent_tag TEXT NOT NULL,
            role TEXT NOT NULL,
            responsibility TEXT NOT NULL,
            status TEXT NOT NULL,
            latest_finding TEXT NOT NULL,
            confidence_score REAL NOT NULL,
            processed_items INTEGER NOT NULL DEFAULT 0,
            execution_order INTEGER NOT NULL,
            FOREIGN KEY (incident_id) REFERENCES investigations(incident_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS evidence_items (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL,
            category TEXT NOT NULL,
            metric TEXT NOT NULL,
            observation TEXT NOT NULL,
            comparison_note TEXT NOT NULL,
            impact_weight TEXT NOT NULL,
            source_agent TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (incident_id) REFERENCES investigations(incident_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS competing_hypotheses (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL,
            title TEXT NOT NULL,
            proposed_by TEXT NOT NULL,
            probability REAL NOT NULL,
            status TEXT NOT NULL,
            supporting_args_json TEXT NOT NULL,
            counter_args_json TEXT NOT NULL,
            adjudication_note TEXT NOT NULL,
            FOREIGN KEY (incident_id) REFERENCES investigations(incident_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS diagnostic_reports (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            lead_adjudicator TEXT NOT NULL,
            confidence_level REAL NOT NULL,
            severity TEXT NOT NULL,
            zone TEXT NOT NULL,
            executive_summary TEXT NOT NULL,
            root_cause_analysis TEXT NOT NULL,
            counterfactual_delta TEXT NOT NULL,
            telemetry_evidence_count INTEGER NOT NULL,
            recommended_actions_json TEXT NOT NULL,
            agent_transcripts_count INTEGER NOT NULL,
            verdict TEXT,
            FOREIGN KEY (incident_id) REFERENCES investigations(incident_id) ON DELETE CASCADE
        );
        """)
        # Safe migration for existing SQLite databases
        for col_stmt in [
            "ALTER TABLE diagnostic_reports ADD COLUMN verdict TEXT;",
            "ALTER TABLE diagnostic_reports ADD COLUMN canonical_contract_json TEXT;",
            "ALTER TABLE devices ADD COLUMN cpu_utilization_pct REAL;",
            "ALTER TABLE devices ADD COLUMN link_utilization_pct REAL;",
            "ALTER TABLE devices ADD COLUMN egress_queue_drops INTEGER;",
            "ALTER TABLE devices ADD COLUMN is_stale INTEGER DEFAULT 0;",
            "ALTER TABLE devices ADD COLUMN source_format TEXT DEFAULT 'canonical';",
            "ALTER TABLE devices ADD COLUMN raw_payload_json TEXT;"
        ]:
            try:
                conn.execute(col_stmt)
            except Exception:
                pass
