# UNSEEN — Sample Data & Benchmark Test Fixtures

> **Reproducible Test Datasets for the NetCoop AI Hackathon**  
> *Includes organizer reference telemetry, benchmark network failure scenarios, and inter-agent protocol stress tests.*

---

## Directory Organization

```
sample-data/
├── organizer/                          # Official NetCoop AI Telemetry Generator outputs
│   ├── normal.json                     # Nominal baseline telemetry (Healthy)
│   ├── latency_spike.json              # Link congestion & buffer queue warning (Warning)
│   └── hardware_failure.json           # Transceiver / interface failure (Critical)
│
├── scenarios/                          # Benchmark Scenarios (Ground-Truth Isolated)
│   ├── normal_network.json             # 1,000 devices; 0 affected; NO_FAULT_DETECTED
│   ├── link_congestion.json            # 850 devices; 14 affected; queue drops
│   ├── weak_wifi.json                  # 620 devices; 12 affected; RSSI < -82 dBm
│   ├── ethernet_interface_fault.json   # 540 devices; 10 affected; CRC alignment errors
│   ├── dns_failure.json                # 780 devices; 15 affected; UDP 53 silent drop
│   ├── dhcp_failure.json               # 120 devices; 14 affected; expired leases, APIPA
│   ├── simultaneous_faults.json        # 900 devices; 16 affected; 2 orthogonal faults
│   └── insufficient_evidence.json      # 350 devices; 2 affected; ABSTAIN_INSUFFICIENT_EVIDENCE
│
└── interoperability/                   # Negative & Edge Case Protocol Tests
    ├── incompatible_field_names.json   # Non-standard keys (legacy NMS format)
    ├── incompatible_units.json         # Strings in numeric fields ("99.9%", "750ms")
    ├── unsupported_schema_version.json # Schema v2.5.0 rejected by v1.0.0 validator
    ├── missing_message_fields.json     # Truncated agent message envelope
    └── malformed_telemetry.json        # Invalid types and malformed timestamp
```

---

## 1. Official Organizer Telemetry Fixtures (`organizer/`)

Generated using the NetCoop AI reference generator ([`backend/app/engine/organizer_generator.py`](file:///c:/Users/SHAYEL/OneDrive/Documents/unseen-network-intelligence/backend/app/engine/organizer_generator.py)).

### Ingesting via API
To test ingestion of organizer telemetry records:

```powershell
# Ingest single organizer record
Invoke-RestMethod -Uri "http://localhost:8000/api/telemetry/organizer" `
  -Method POST `
  -InFile "sample-data/organizer/hardware_failure.json" `
  -ContentType "application/json"
```

### Ingesting via Python
```python
import json
from backend.app.engine.telemetry_ingestion import ingest_organizer_telemetry

with open("sample-data/organizer/latency_spike.json") as f:
    record = json.load(f)

device_telemetry = ingest_organizer_telemetry(record)
print(f"Device: {device_telemetry.deviceId}, Latency: {device_telemetry.latencyMs}ms")
```

---

## 2. Benchmark Fault Scenarios (`scenarios/`)

These fixtures define the expected input parameters, affected cohorts, and adjudicator verdicts across all 8 benchmark scenarios.

### Running an Investigation via API
```powershell
# Launch investigation on DHCP Scope Exhaustion scenario
Invoke-RestMethod -Uri "http://localhost:8000/api/investigate/dhcp-starvation" `
  -Method POST

# Retrieve canonical NetCoop AI Diagnostic Report
Invoke-RestMethod -Uri "http://localhost:8000/api/reports/diagnostic-contract/dhcp-starvation" `
  -Method GET
```

---

## 3. Protocol & Interoperability Fixtures (`interoperability/`)

These fixtures test the resilience of UNSEEN's schema validators and error boundaries.

### Validating Protocol Rejection
```powershell
# Test schema version rejection
python -c "
import json
from backend.app.engine.orchestrator import MultiAgentOrchestrator
from backend.app.models.schemas import AgentMessage

with open('sample-data/interoperability/unsupported_schema_version.json') as f:
    data = json.load(f)

orch = MultiAgentOrchestrator()
msg = AgentMessage(**data)
is_valid, error = orch.validate_agent_message(msg)
print('Validation Passed:', is_valid, '| Error:', error)
"
```
Output:
`Validation Passed: False | Error: Unsupported schema version: 2.5.0. Expected 1.0.0`
