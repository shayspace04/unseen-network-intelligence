# UNSEEN — Agent Interoperability & Communication Protocol (v1.0.0)

> **Inter-Agent Versioned JSON Communication Contract**  
> *Engineered to satisfy the 30-Point Interoperability Evaluation Criteria for NetCoop AI Hackathon.*

---

## 1. Protocol Specification

All inter-agent communication within UNSEEN is governed by a strict, versioned JSON schema enforced via Pydantic v2. Messages pass between agents through the Central Orchestrator, which validates every envelope against the protocol definition prior to persisting it to SQLite and forwarding it downstream.

### 1.1 Enforced Envelope Schema

Every inter-agent message MUST conform to the following schema (`schema_version: "1.0.0"`):

```json
{
  "schema_version": "1.0.0",
  "message_id": "MSG-2026-0001",
  "incident_id": "INV-2026-ABCD",
  "sender": "Population Observer",
  "recipient": "Counterfactual Twin",
  "message_type": "cohort_discovery",
  "timestamp": "10:35:12.450",
  "topic": "Micro-Cohort Anomaly Detection",
  "payload": {
    "affected_devices": ["DEV-101", "DEV-102"],
    "affected_count": 2,
    "metrics_delta": { "latency_ms": 120.5 }
  },
  "evidence_references": ["EV-001", "EV-002"],
  "limitations": ["Limited to devices reporting in the last 60 seconds"],
  "verdict": "supported"
}
```

### 1.2 Envelope Fields & Validation Rules

| Field | Type | Required | Description / Validation Rules |
| :--- | :--- | :--- | :--- |
| `schema_version` | `string` | **Yes** | Protocol version string. Must be `"1.0.0"`. Messages with unsupported versions are rejected with an interoperability exception. |
| `message_id` | `string` | **Yes** | Globally unique identifier formatted as `MSG-{YYYY}-{HEX}`. |
| `incident_id` | `string` | **Yes** | Scoped incident identifier formatted as `INV-{YYYY}-{HEX}`. Must match active investigation. |
| `sender` | `string` | **Yes** | Canonical agent name of the transmitting agent (e.g., `"Population Observer"`, `"Counterfactual Twin"`). |
| `recipient` | `string` | **Yes** | Canonical agent name of the intended downstream agent or `"Broadcast"`. |
| `message_type` | `enum` | **Yes** | One of: `cohort_discovery`, `counterfactual_analysis`, `topology_dependency`, `fault_evaluation`, `adjudication_verdict`, `hypothesis`, `telemetry_challenge`, `topology_query`, `counterfactual_proof`, `adjudication`. |
| `timestamp` | `string` | **Yes** | High-precision UTC timestamp formatted as `HH:MM:SS.mmm`. |
| `topic` | `string` | **Yes** | Human-readable synopsis of message content. |
| `payload` | `object` | **Yes** | Agent-specific typed dictionary containing domain findings. |
| `evidence_references` | `array[string]` | No | List of unique evidence IDs supporting the message payload. Defaults to `[]`. |
| `limitations` | `array[string]` | No | Known telemetry gaps, stale fields, or sampling limitations. Defaults to `[]`. |
| `verdict` | `enum` | No | Optional intermediate status: `supported`, `refuted`, `pending`, `inconclusive`. |

---

## 2. Interoperability & Error Handling Guarantees

1. **Schema Version Check**: If an incoming message contains `schema_version != "1.0.0"`, the orchestrator logs an `interoperability_failure` event with error `Unsupported schema version: {version}. Expected 1.0.0` and aborts causal propagation.
2. **Missing Field Rejection**: Missing mandatory fields (`message_id`, `incident_id`, `sender`, `recipient`, `message_type`, `payload`) trigger immediate validation failure.
3. **Audit Persistence**: Every valid message is persisted to the `agent_messages` table in SQLite, preserving full provenance, message hierarchy, and timestamps.
4. **Inspectability**: The UNSEEN Console provides an interactive **Agent Activity Inspector** where operators and judges can inspect the raw JSON envelope of every agent turn in real time.

---

## 3. Representative End-to-End Investigation Message Flow

The following sequence reflects the actual, reproducible message exchange produced during an investigation of the **Engineering Wing B — DHCP Scope Exhaustion** scenario.

### Turn 1: AG-01 (Population Observer) $\rightarrow$ AG-02 (Counterfactual Twin)
```json
{
  "schema_version": "1.0.0",
  "message_id": "MSG-2026-B101",
  "incident_id": "INV-2026-ENG-B",
  "sender": "Population Observer",
  "recipient": "Counterfactual Twin",
  "message_type": "cohort_discovery",
  "timestamp": "10:35:12.102",
  "topic": "Micro-Cohort Anomaly Detection",
  "payload": {
    "affected_devices": [
      "DEV-ENG-B-01", "DEV-ENG-B-02", "DEV-ENG-B-03", "DEV-ENG-B-04",
      "DEV-ENG-B-05", "DEV-ENG-B-06", "DEV-ENG-B-07", "DEV-ENG-B-08"
    ],
    "affected_count": 8,
    "total_monitored": 120,
    "aggregate_fleet_health_pct": 93.3,
    "anomalous_signature": {
      "dhcp_lease_state": "expired",
      "packet_loss_pct": 100.0,
      "latency_ms": 0.0
    },
    "masking_factor": "Aggregate fleet health is 93.3%, masking total localized outage for 8 endpoints."
  },
  "evidence_references": ["EV-POP-001"],
  "limitations": ["Observation window limited to current 30-second telemetry slice."],
  "verdict": "supported"
}
```

### Turn 2: AG-02 (Counterfactual Twin) $\rightarrow$ AG-03 (Topology Pathfinder)
```json
{
  "schema_version": "1.0.0",
  "message_id": "MSG-2026-B102",
  "incident_id": "INV-2026-ENG-B",
  "sender": "Counterfactual Twin",
  "recipient": "Topology Pathfinder",
  "message_type": "counterfactual_analysis",
  "timestamp": "10:35:12.315",
  "topic": "Twin-Cohort Differential Analysis",
  "payload": {
    "affected_cohort_size": 8,
    "healthy_control_size": 8,
    "twin_pairs_evaluated": 8,
    "differential_matrix": {
      "dhcp_expired_rate_delta": "+100.0%",
      "packet_loss_delta": "+100.0%",
      "signal_strength_dbm_delta": "-1.2 dBm (statistically insignificant)",
      "dns_resolution_ms_delta": "N/A (unreachable)"
    },
    "finding": "Identical student laptops in adjacent Wing A share the same wireless SSID with 100% valid DHCP leases and 0% packet loss. Issue is isolated to Wing B network segment."
  },
  "evidence_references": ["EV-CTF-001", "EV-CTF-002"],
  "limitations": ["Control group selected based on matching hardware model and OS version."],
  "verdict": "supported"
}
```

### Turn 3: AG-03 (Topology Pathfinder) $\rightarrow$ AG-04 (Fault Evaluator)
```json
{
  "schema_version": "1.0.0",
  "message_id": "MSG-2026-B103",
  "incident_id": "INV-2026-ENG-B",
  "sender": "Topology Pathfinder",
  "recipient": "Fault Evaluator",
  "message_type": "topology_dependency",
  "timestamp": "10:35:12.540",
  "topic": "Topological Choke Point Isolation",
  "payload": {
    "lowest_common_ancestor": "SW-ACCESS-ENG-B",
    "device_type": "switch",
    "uplink_parent": "SW-DIST-CAMPUS-01",
    "path_depth": 3,
    "sub_tree_convergence": 1.0,
    "affected_downstream_endpoints": 8,
    "unaffected_downstream_endpoints": 0,
    "finding": "All 8 failing endpoints converge upon access switch SW-ACCESS-ENG-B (VLAN 102). Upstream distribution switch SW-DIST-CAMPUS-01 remains healthy."
  },
  "evidence_references": ["EV-TOP-001"],
  "limitations": ["NetworkX topology graph assumes static Layer-2 spanning tree topology."],
  "verdict": "supported"
}
```

### Turn 4: AG-04 (Fault Evaluator) $\rightarrow$ AG-05 (Adjudicator)
```json
{
  "schema_version": "1.0.0",
  "message_id": "MSG-2026-B104",
  "incident_id": "INV-2026-ENG-B",
  "sender": "Fault Evaluator",
  "recipient": "Adjudicator",
  "message_type": "fault_evaluation",
  "timestamp": "10:35:12.790",
  "topic": "Multi-Hypothesis Falsification Matrix",
  "payload": {
    "leading_hypothesis": {
      "id": "HYP-01",
      "title": "DHCP Scope Exhaustion on VLAN 102",
      "probability": 0.94,
      "status": "leading",
      "supporting_evidence": [
        "100% of affected endpoints exhibit DHCP lease state 'expired'",
        "Clients fail to renew IP addresses within Engineering Wing B"
      ]
    },
    "alternative_hypotheses": [
      {
        "id": "HYP-02",
        "title": "Access Switch Hardware Failure (SW-ACCESS-ENG-B)",
        "probability": 0.04,
        "status": "refuted",
        "refutation_reason": "Switch management interface responds to ICMP echo and reports nominal CPU/memory."
      },
      {
        "id": "HYP-03",
        "title": "Wi-Fi RF Interference / Signal Degradation",
        "probability": 0.02,
        "status": "refuted",
        "refutation_reason": "Signal strength averages -54 dBm, which is well within nominal range (> -70 dBm)."
      }
    ]
  },
  "evidence_references": ["EV-FLT-001", "EV-FLT-002"],
  "limitations": ["DHCP server relay logs not directly queryable via SNMP; inferred from client lease state."],
  "verdict": "supported"
}
```

### Turn 5: AG-05 (Adjudicator) $\rightarrow$ Central Orchestrator
```json
{
  "schema_version": "1.0.0",
  "message_id": "MSG-2026-B105",
  "incident_id": "INV-2026-ENG-B",
  "sender": "Adjudicator",
  "recipient": "Broadcast",
  "message_type": "adjudication_verdict",
  "timestamp": "10:35:13.010",
  "topic": "Diagnostic Consensus Verdict & Remediation",
  "payload": {
    "status": "diagnosed",
    "suspected_root_cause": "DHCP Scope Exhaustion on VLAN 102",
    "confidence": 0.94,
    "affected_devices": [
      "DEV-ENG-B-01", "DEV-ENG-B-02", "DEV-ENG-B-03", "DEV-ENG-B-04",
      "DEV-ENG-B-05", "DEV-ENG-B-06", "DEV-ENG-B-07", "DEV-ENG-B-08"
    ],
    "supporting_evidence": [
      {"metric": "dhcp_lease_state", "value": "expired", "interpretation": "All 8 failing endpoints report expired DHCP lease without renewal."},
      {"metric": "packet_loss_pct", "value": 100.0, "interpretation": "Complete loss of IP routing due to unassigned IP configuration."}
    ],
    "alternative_causes": [
      "Access Switch Hardware Failure (SW-ACCESS-ENG-B)",
      "Wi-Fi RF Interference / Signal Degradation"
    ],
    "recommended_actions": [
      "Expand DHCP pool /24 subnet allocation for VLAN 102 in core DHCP server configuration.",
      "Reduce DHCP lease duration from 24 hours to 2 hours for transient student endpoint pools.",
      "Flush stale inactive leases on DHCP server to immediately recover address capacity."
    ],
    "evidence_sources": ["DeviceTelemetry", "TopologyGraph", "CounterfactualTwin"],
    "limitations": ["DHCP server daemon metrics inferred from client lease state transitions."]
  },
  "evidence_references": ["EV-POP-001", "EV-CTF-001", "EV-TOP-001", "EV-FLT-001"],
  "limitations": ["DHCP server daemon metrics inferred from client lease state transitions."],
  "verdict": "supported"
}
```
