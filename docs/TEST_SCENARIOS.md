# UNSEEN — Test Scenarios & Ground Truth Benchmarks

> **Comprehensive Network Fault Evaluation Suite**  
> *Satisfies Priority 1 (Interoperability) and Priority 2 (Diagnostic Accuracy) of the NetCoop AI Judging Rubric.*

---

## 1. Scenario Master Matrix

UNSEEN provides a total of 10 fully reproducible test scenarios: 7 synthetic network benchmarks with strict ground-truth isolation, 2 organizer-format telemetry test fixtures, and 1 interoperability/malformed protocol test case.

| ID | Scenario Name | Injected Fault Category | Hidden Injected Cause | Affected Choke Point | Injected Cohort | Expected Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Normal Operation** (`healthy-baseline`) | `none` | Nominal network operation | Core Gateway (`core-router`) | 0 / 1000 devices | `NO_FAULT_DETECTED` (Nominal) |
| **02** | **Link Congestion** (`shared-link-congestion`) | `congestion` | Shared link saturation / egress buffer drops | Dist Switch (`dist-sw-eng`) | 14 / 850 devices | `PROBABLE_FAULT` (Link Congestion) |
| **03** | **Weak Wi-Fi Signal** (`wifi-degradation`) | `wifi_rf` | RF interference & signal degradation (RSSI < -82 dBm) | Access Point (`ap-sci-12`) | 12 / 620 devices | `PROBABLE_FAULT` (Wi-Fi Degradation) |
| **04** | **Ethernet / Interface Degradation** (`ethernet-interface-fault`) | `interface_fault` | Physical Layer 1/2 CRC error bursts & link instability | Edge Switch (`edge-sw-eng-02`) | 10 / 540 devices | `PROBABLE_FAULT` (Ethernet Fault) |
| **05** | **DNS Silent Failure** (`dns-resolver-silent-drop`) | `dns` | Recursive resolver drop & lookup timeouts (>2500ms) | Dist Switch (`dist-sw-sci`) | 15 / 780 devices | `PROBABLE_FAULT` (DNS Resolver Failure) |
| **06** | **DHCP Scope Starvation** (`dhcp-starvation`) | `dhcp` | DHCP pool exhaustion on VLAN 142 (APIPA fallbacks) | Access Point (`ap-eng-04`) | 14 / 120 devices | `PROBABLE_FAULT` (DHCP Starvation) |
| **07** | **Simultaneous Independent Faults** (`multiple-simultaneous-faults`) | `multi_fault` | Independent Wi-Fi RF drop AND Switch interface errors | Multi (`edge-sw-eng-02` + `ap-sci-08`) | 16 / 900 devices | `PROBABLE_FAULT` (Multi-Fault Identified) |
| **08** | **Organizer Latency Spike** (`organizer_latency_spike`) | `congestion` | High link saturation (100%) and 750ms latency | Campus Switch (`SW_CAMPUS_1`) | Single switch | `PROBABLE_FAULT` (Link Saturation) |
| **09** | **Organizer Hardware Failure** (`organizer_hardware_failure`) | `hardware_failure` | Severe packet loss (22.5%) and 250 interface errors | Campus Switch (`SW_CAMPUS_1`) | Single switch | `PROBABLE_FAULT` (Hardware / Interface Failure) |
| **10** | **Malformed Protocol Rejection** (`malformed_protocol`) | `interop_fault` | Protocol schema version mismatch (`v2.0.0` vs `v1.0.0`) | N/A (Orchestrator) | 0 devices | `REJECTED` (`interoperability_failure`) |

---

## 2. Detailed Scenario Specifications

### Scenario 01: Normal Network Operation (`healthy-baseline`)
- **Fleet Size**: 1,000 active endpoints.
- **Aggregate Metrics**: Packet loss 0.02%, Latency 4.1 ms, Jitter 0.3 ms, DHCP valid 100%.
- **Agent Behavior**: AG-01 detects no anomalous micro-cohort above statistical noise. AG-02 verifies that peer differentials are near zero. AG-05 issues verdict `NO_FAULT_DETECTED` with status `diagnosed` and zero false positives.

### Scenario 02: Link Congestion (`shared-link-congestion`)
- **Fleet Size**: 850 active endpoints, 14 failing in Dormitory Cluster.
- **Aggregate Metrics**: Packet loss 0.4% across fleet (appears healthy!); affected cohort experiences 24.8% packet loss and 210 ms latency.
- **Agent Behavior**: AG-01 isolates the 14 dorm devices. AG-03 maps upstream traffic to `dist-sw-eng` and confirms buffer queue drops without interface CRC errors. AG-04 refutes hardware failure. AG-05 recommends QoS queue prioritization and traffic shaping.

### Scenario 03: Weak Wi-Fi Signal (`wifi-degradation`)
- **Fleet Size**: 620 active endpoints, 12 failing in Science Quad.
- **Aggregate Metrics**: Packet loss 0.6% across fleet; affected devices report RSSI between -82 dBm and -89 dBm, high retransmissions, but nominal upstream switch health.
- **Agent Behavior**: AG-02 proves that devices on adjacent AP `ap-sci-08` have nominal latency and signal (-52 dBm). AG-03 isolates the choke point to `ap-sci-12`. AG-04 falsifies DHCP/DNS and confirms RF path loss.

### Scenario 04: Ethernet / Interface Fault (`ethernet-interface-fault`)
- **Fleet Size**: 540 active endpoints, 10 failing in Engineering Wing A.
- **Aggregate Metrics**: Rising physical interface errors (CRC count > 420), packet loss 18.4%, but link utilization is low (14.2%).
- **Distinction from Congestion**: Packet loss is accompanied by physical CRC frame drops rather than queue drops. AG-04 explicitly falsifies bandwidth saturation and identifies physical patch cable or SFP transceiver degradation.

### Scenario 05: DNS Failure (`dns-resolver-silent-drop`)
- **Fleet Size**: 780 active endpoints, 15 failing in Medical Center Wing.
- **Aggregate Metrics**: Ping to default gateway is 2.1 ms (ICMP works perfectly!); HTTP/DNS lookups fail with timeout >2500 ms.
- **Agent Behavior**: AG-02 reveals normal Layer-3 routing but 100% failure on UDP port 53. AG-05 identifies silent resolver drop and recommends failover to secondary resolver `10.0.0.54`.

### Scenario 06: DHCP Failure (`dhcp-starvation`)
- **Fleet Size**: 120 active endpoints, 14 failing in Engineering Wing B.
- **Aggregate Metrics**: Fleet health 93.3% (masking total outage for 14 endpoints).
- **Endpoint State**: 100% of affected endpoints report `dhcp_lease_state: "expired"` and APIPA addresses (`169.254.81.x`).
- **Agent Behavior**: AG-01 isolates the micro-cohort. AG-02 proves adjacent Wing A has 0% DHCP failure. AG-03 pinpoints `ap-eng-04` on VLAN 142. AG-05 diagnoses DHCP scope starvation with 0.94 confidence.

### Scenario 07: Multiple Simultaneous Faults (`multiple-simultaneous-faults`)
- **Fleet Size**: 900 active endpoints, 16 failing across two distinct zones.
- **Telemetry Signature**: 8 devices experience high latency and RSSI degradation on `ap-sci-08`, while 8 different devices experience packet loss and interface errors on `edge-sw-eng-02`.
- **Agent Behavior**: AG-01 isolates two orthogonal micro-cohorts. AG-03 identifies two non-overlapping topological choke points. AG-05 delivers a multi-fault report detailing both independent root causes without collapsing them.

---

## 3. Automated Scenario Test Suite

All scenarios are verified via the 43 automated tests in [`backend/tests/`](file:///c:/Users/SHAYEL/OneDrive/Documents/unseen-network-intelligence/backend/tests/):

```powershell
# Run all benchmark tests with verbose output
python -m pytest backend/tests -v

# Run diagnostic accuracy benchmark tests
python -m pytest backend/tests/test_netcoop_compliance.py -v

# Run inter-agent protocol and interoperability tests
python -m pytest backend/tests/test_agent_interop.py -v

# Run canonical diagnostic contract schema validation tests
python -m pytest backend/tests/test_diagnostic_contract.py -v

# Run organizer telemetry ingestion adapter tests
python -m pytest backend/tests/test_telemetry_ingestion.py -v
```
