"""
UNSEEN Synthetic Network Data Engine
Generates realistic, deterministic campus network telemetry, topology graphs, and benchmark scenarios.
Maintains STRICT isolation between ground truth and observable telemetry.
"""

import random
import datetime
from typing import List, Dict, Any, Tuple
from ..models.schemas import (
    Scenario, 
    DeviceTelemetry, 
    NetworkNode, 
    NetworkEdge, 
    NetworkNodeData, 
    NetworkNodeDetails,
    GroundTruth
)

def _generate_mac(seed_num: int) -> str:
    rnd = random.Random(seed_num)
    return ":".join(f"{rnd.randint(0, 255):02X}" for _ in range(6))

class SyntheticNetworkEngine:
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)

    def generate_scenario_data(self, scenario_id: str) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Generates deterministic telemetry, topology, and isolated ground truth for a given scenario.
        """
        generators = {
            "dhcp-starvation": self._gen_dhcp_starvation,
            "wifi-degradation": self._gen_wifi_degradation,
            "shared-link-congestion": self._gen_shared_link_congestion,
            "dns-resolver-silent-drop": self._gen_dns_resolver_drop,
            "multiple-simultaneous-faults": self._gen_multi_fault,
            "healthy-baseline": self._gen_healthy_baseline,
            "ethernet-interface-fault": self._gen_ethernet_fault,
        }

        if scenario_id not in generators:
            scenario_id = "dhcp-starvation"

        return generators[scenario_id]()

    def _gen_dhcp_starvation(self) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Scenario 1: Localized DHCP Pool Exhaustion (Engineering Wing B)
        Symptom label: "Engineering Wing B — IP Lease Timeouts & Localized Connectivity Drops"
        """
        rng = random.Random(self.seed + 101)
        total_devices = 500
        affected_count = 6
        healthy_count = total_devices - affected_count

        scenario = Scenario(
            id="dhcp-starvation",
            name="Engineering Wing B - Intermittent IP Lease Timeouts",
            badge="Primary Benchmark",
            category="IPAM / L2-L3",
            description="500 campus devices connected. Aggregate health registers at 98.8%, but 6 student devices in Engineering Wing B fail to complete IP binding upon renewal.",
            monitored_devices=total_devices,
            healthy_devices=healthy_count,
            affected_devices=affected_count,
            aggregate_health_pct=98.8,
            affected_zone="Engineering Wing B - 2nd Floor",
            suspected_fault="Symptom: DHCPDISCOVER timeouts on VLAN-142 with APIPA fallback",
            confidence_score=0.94,
            symptoms=[
                "Clients receive 0.0.0.0 or 169.254.x.x (APIPA) after 4 consecutive DHCPDISCOVER broadcasts",
                "Adjacent clients with existing leases show nominal 4.1ms latency on AP-ENG-04",
                "Aggregate campus latency normal at 4.2ms, masking the localized failure"
            ],
            recommended_fix="Reclaim expired DHCP leases, increase VLAN-142 lease scope from /24 to /23, and quarantine rogue lease-exhausting MAC."
        )

        ground_truth = GroundTruth(
            scenario_id="dhcp-starvation",
            primary_fault_category="DHCP",
            injected_root_cause="DHCP pool exhaustion on VLAN-142 (/24 scope full: 254/254 active leases)",
            affected_device_ids=[f"DEV-ENG-{81 + i:03d}" for i in range(affected_count)],
            affected_node_id="ap-eng-04",
            rationale="A rogue device requested multiple unique leases via MAC address rotation, filling the final 14 pool slots. Clients entering the renewal window receive no DHCPOFFER frames."
        )

        devices: List[DeviceTelemetry] = []

        # 6 Affected devices
        for i in range(affected_count):
            dev_id = f"DEV-ENG-{81 + i:03d}"
            devices.append(DeviceTelemetry(
                device_id=dev_id,
                device_type="student_laptop" if i < 4 else "lab_workstation",
                ip_address=f"169.254.81.{12 + i} (APIPA)",
                mac_address=_generate_mac(self.seed + 1000 + i),
                vlan="VLAN-142",
                connected_ap="AP-ENG-04",
                connected_switch="SW-ENG-EDGE-02",
                latency_ms=0.0,
                packet_loss_pct=100.0,
                dhcp_lease_state="unassigned",
                dns_resolution_ms=0.0,
                signal_strength_dbm=-54.0 + rng.uniform(-2, 2),
                jitter_ms=0.0,
                interface_errors=0,
                status="fault",
                last_seen="10s ago"
            ))

        # 494 Healthy devices (sample representative spread)
        for i in range(healthy_count):
            dev_id = f"DEV-HLT-{i + 1:04d}"
            is_same_ap = (i < 24)
            devices.append(DeviceTelemetry(
                device_id=dev_id,
                device_type=rng.choice(["student_laptop", "lab_workstation", "iot_sensor", "faculty_pc", "mobile"]),
                ip_address=f"10.142.0.{10 + (i % 230)}" if is_same_ap else f"10.120.{i % 10}.{10 + (i % 240)}",
                mac_address=_generate_mac(self.seed + 5000 + i),
                vlan="VLAN-142" if is_same_ap else "VLAN-120",
                connected_ap="AP-ENG-04" if is_same_ap else f"AP-SCI-{8 + (i % 6):02d}",
                connected_switch="SW-ENG-EDGE-02" if is_same_ap else "SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(3.2, 5.4), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(8.0, 15.0), 1),
                signal_strength_dbm=round(rng.uniform(-58.0, -48.0), 1),
                jitter_ms=round(rng.uniform(0.2, 0.8), 2),
                interface_errors=0,
                status="healthy",
                last_seen="Just now"
            ))

        nodes, edges = self._build_base_topology("dhcp-starvation", affected_ap="ap-eng-04", affected_vlan="vlan-142", affected_count=6)
        return scenario, devices, nodes, edges, ground_truth

    def _gen_wifi_degradation(self) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Scenario 2: Asymmetric Wi-Fi Co-Channel Contention (Science Complex Lab 401)
        Symptom label: "Science Complex Lab 401 — RF Frame Retries & Throughput Collapse"
        """
        rng = random.Random(self.seed + 202)
        total_devices = 620
        affected_count = 8
        healthy_count = total_devices - affected_count

        scenario = Scenario(
            id="wifi-degradation",
            name="Science Complex Lab 401 - Wi-Fi Retries & Frame Loss",
            badge="RF Anomaly",
            category="802.11 / Physical RF",
            description="620 campus devices monitored. Global health reads 98.7%, but 8 workstations in Science Complex Lab 401 suffer 28% frame retries and severe packet drops.",
            monitored_devices=total_devices,
            healthy_devices=healthy_count,
            affected_devices=affected_count,
            aggregate_health_pct=98.7,
            affected_zone="Science Complex - Lab 401",
            suspected_fault="Symptom: High 802.11 beacon retransmissions and CRC drops on AP-SCI-12",
            confidence_score=0.89,
            symptoms=[
                "Layer 2 beacon retransmissions spike to 28.4% on 5.180 GHz (Ch 36)",
                "TCP handshake latency exceeds 320ms for connected clients",
                "Adjacent AP-SCI-11 on Channel 44 operates with 0.0% packet drop"
            ],
            recommended_fix="Shift AP-SCI-12 to DFS Channel 52 and reduce channel width from 80MHz to 40MHz."
        )

        ground_truth = GroundTruth(
            scenario_id="wifi-degradation",
            primary_fault_category="Wi-Fi",
            injected_root_cause="Co-Channel Contention / Unmanaged High-Power 80MHz Hotspot clashing with AP-SCI-12",
            affected_device_ids=[f"DEV-SCI-{101 + i:03d}" for i in range(affected_count)],
            affected_node_id="ap-sci-12",
            rationale="An unmanaged mobile hotspot transmitting on 5.180 GHz (Ch 36) caused hidden node contention and a 28% MAC-layer frame retry rate on AP-SCI-12."
        )

        devices: List[DeviceTelemetry] = []

        for i in range(affected_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-SCI-{101 + i:03d}",
                device_type="lab_workstation" if i < 5 else "student_laptop",
                ip_address=f"10.120.4.{20 + i}",
                mac_address=_generate_mac(self.seed + 2000 + i),
                vlan="VLAN-120",
                connected_ap="AP-SCI-12",
                connected_switch="SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(280.0, 390.0), 1),
                packet_loss_pct=round(rng.uniform(22.0, 34.0), 1),
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(120.0, 240.0), 1),
                signal_strength_dbm=round(rng.uniform(-78.0, -72.0), 1),
                jitter_ms=round(rng.uniform(42.0, 68.0), 1),
                interface_errors=184 + i * 22,
                status="fault",
                last_seen="15s ago"
            ))

        for i in range(healthy_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-SCI-HLT-{i + 1:04d}",
                device_type=rng.choice(["student_laptop", "lab_workstation", "iot_sensor", "mobile"]),
                ip_address=f"10.120.{(i % 6) + 1}.{10 + (i % 240)}",
                mac_address=_generate_mac(self.seed + 6000 + i),
                vlan="VLAN-120",
                connected_ap="AP-SCI-08" if i % 2 == 0 else "AP-SCI-11",
                connected_switch="SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(3.5, 6.2), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(8.0, 16.0), 1),
                signal_strength_dbm=round(rng.uniform(-56.0, -48.0), 1),
                jitter_ms=round(rng.uniform(0.3, 1.1), 2),
                interface_errors=0,
                status="healthy",
                last_seen="Just now"
            ))

        nodes, edges = self._build_base_topology("wifi-degradation", affected_ap="ap-sci-12", affected_vlan=None, affected_count=8)
        return scenario, devices, nodes, edges, ground_truth

    def _gen_shared_link_congestion(self) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Scenario 3: Shared Uplink Microburst Bufferbloat (North Residence Hall)
        Symptom label: "North Residence Hall — Microburst Latency & Jitter Spikes"
        """
        rng = random.Random(self.seed + 303)
        total_devices = 850
        affected_count = 12
        healthy_count = total_devices - affected_count

        scenario = Scenario(
            id="shared-link-congestion",
            name="North Residence Hall - Egress Buffer Drops & Latency Jitter",
            badge="Switching / QoS",
            category="L2 Switching",
            description="850 devices monitored. Core network reads 98.5% uptime, but 12 endpoints on Dormitory Switch SW-DORM-03 experience tail latency exceeding 480ms during microburst periods.",
            monitored_devices=total_devices,
            healthy_devices=healthy_count,
            affected_devices=affected_count,
            aggregate_health_pct=98.5,
            affected_zone="North Residence Hall - Block C",
            suspected_fault="Symptom: Periodic tail latency jumps and egress queue packet discards",
            confidence_score=0.92,
            symptoms=[
                "Egress queue drop counters escalating on interface Te1/0/4 (Switch SW-DORM-03)",
                "Average latency 5ms jumps abruptly to 480ms under 200ms burst windows",
                "Neighboring switch SW-DORM-02 operates without packet loss"
            ],
            recommended_fix="Reconfigure Weighted Random Early Detection (WRED) thresholds and enable pause-frame flow control on Te1/0/4."
        )

        ground_truth = GroundTruth(
            scenario_id="shared-link-congestion",
            primary_fault_category="Congestion",
            injected_root_cause="Shared Uplink Microburst Bufferbloat on SW-DORM-03 port Te1/0/4",
            affected_device_ids=[f"DEV-DORM-{201 + i:03d}" for i in range(affected_count)],
            affected_node_id="dist-sw-eng",
            rationale="Periodic 10Gbps egress bursts exceed the switch shallow packet buffer, causing microsecond-level packet discards not visible to 60-second SNMP polling."
        )

        devices: List[DeviceTelemetry] = []

        for i in range(affected_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-DORM-{201 + i:03d}",
                device_type="lab_workstation" if i % 2 == 0 else "student_laptop",
                ip_address=f"10.180.2.{50 + i}",
                mac_address=_generate_mac(self.seed + 3000 + i),
                vlan="VLAN-180",
                connected_ap="AP-ENG-04",
                connected_switch="SW-ENG-EDGE-02",
                latency_ms=round(rng.uniform(380.0, 520.0), 1),
                packet_loss_pct=round(rng.uniform(8.5, 14.5), 1),
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(45.0, 95.0), 1),
                signal_strength_dbm=-52.0,
                jitter_ms=round(rng.uniform(85.0, 140.0), 1),
                interface_errors=89 + i * 14,
                status="fault",
                last_seen="Just now"
            ))

        for i in range(healthy_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-DORM-HLT-{i + 1:04d}",
                device_type=rng.choice(["student_laptop", "mobile", "iot_sensor"]),
                ip_address=f"10.180.{(i % 4) + 1}.{10 + (i % 240)}",
                mac_address=_generate_mac(self.seed + 7000 + i),
                vlan="VLAN-180",
                connected_ap="AP-SCI-08",
                connected_switch="SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(4.0, 7.5), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(9.0, 18.0), 1),
                signal_strength_dbm=-54.0,
                jitter_ms=round(rng.uniform(0.4, 1.2), 2),
                interface_errors=0,
                status="healthy",
                last_seen="Just now"
            ))

        nodes, edges = self._build_base_topology("shared-link-congestion", affected_ap="ap-eng-04", affected_vlan=None, affected_count=12)
        return scenario, devices, nodes, edges, ground_truth

    def _gen_dns_resolver_drop(self) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Scenario 4: Secondary DNS Anycast Silent Drop (Medical Research Wing)
        Symptom label: "Medical Research Wing — Name Resolution Drops & Application Stalls"
        """
        rng = random.Random(self.seed + 404)
        total_devices = 420
        affected_count = 9
        healthy_count = total_devices - affected_count

        scenario = Scenario(
            id="dns-resolver-silent-drop",
            name="Medical Research Wing - Intermittent DNS Resolution Drops",
            badge="Services / L7",
            category="DNS / Transport",
            description="420 devices monitored. Overall campus latency reads 4.0ms, but 9 pathology imaging tablets experience UDP packet discard when querying secondary resolver 10.10.0.53.",
            monitored_devices=total_devices,
            healthy_devices=healthy_count,
            affected_devices=affected_count,
            aggregate_health_pct=97.8,
            affected_zone="Medical Research Wing - Pathology Imaging",
            suspected_fault="Symptom: UDP/53 DNS query timeout with 100% loss after 15-minute lease",
            confidence_score=0.95,
            symptoms=[
                "DNS queries to 10.10.0.53 timeout after 4000ms threshold",
                "Direct IP HTTP connections function normally with 0% packet loss",
                "TCP fallback query succeeds but creates application stalls"
            ],
            recommended_fix="Withdraw asymmetric BGP Anycast route announcement from R-MED-02."
        )

        ground_truth = GroundTruth(
            scenario_id="dns-resolver-silent-drop",
            primary_fault_category="DNS",
            injected_root_cause="Asymmetric Anycast return route causing secondary DNS server 10.10.0.53 packet drop",
            affected_device_ids=[f"DEV-MED-{301 + i:03d}" for i in range(affected_count)],
            affected_node_id="dist-sw-sci",
            rationale="A stale Anycast BGP route directed UDP return packets to an inactive core interface, resulting in silent timeouts for devices configured with secondary DNS resolver."
        )

        devices: List[DeviceTelemetry] = []

        for i in range(affected_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-MED-{301 + i:03d}",
                device_type="iot_sensor" if i < 6 else "lab_workstation",
                ip_address=f"10.10.8.{15 + i}",
                mac_address=_generate_mac(self.seed + 4000 + i),
                vlan="VLAN-110",
                connected_ap="AP-SCI-08",
                connected_switch="SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(3.8, 5.2), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=4000.0,
                signal_strength_dbm=-50.0,
                jitter_ms=0.5,
                interface_errors=0,
                status="fault",
                last_seen="20s ago"
            ))

        for i in range(healthy_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-MED-HLT-{i + 1:04d}",
                device_type=rng.choice(["student_laptop", "lab_workstation", "mobile"]),
                ip_address=f"10.10.{(i % 4) + 1}.{10 + (i % 240)}",
                mac_address=_generate_mac(self.seed + 8000 + i),
                vlan="VLAN-110",
                connected_ap="AP-SCI-12",
                connected_switch="SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(3.4, 5.0), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(7.0, 14.0), 1),
                signal_strength_dbm=-52.0,
                jitter_ms=round(rng.uniform(0.2, 0.7), 2),
                interface_errors=0,
                status="healthy",
                last_seen="Just now"
            ))

        nodes, edges = self._build_base_topology("dns-resolver-silent-drop", affected_ap="ap-sci-08", affected_vlan=None, affected_count=9)
        return scenario, devices, nodes, edges, ground_truth

    def _gen_multi_fault(self) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Scenario 5: Multi-Fault Cascading Incident (Engineering & Computing Labs)
        Symptom label: "Engineering & Computing Labs — Gateway Conflicts & Interface Jitter"
        """
        rng = random.Random(self.seed + 505)
        total_devices = 520
        affected_count = 18
        healthy_count = total_devices - affected_count

        scenario = Scenario(
            id="multiple-simultaneous-faults",
            name="Engineering & Computing Labs - Dual Telemetry Anomalies",
            badge="Complex Fault",
            category="Cascade (L2 + L3)",
            description="520 monitored devices across two wings. Global average reads 96.5%, but 18 devices display bimodal failure signatures: rogue default gateway announcements and optical transceiver CRC errors.",
            monitored_devices=total_devices,
            healthy_devices=healthy_count,
            affected_devices=affected_count,
            aggregate_health_pct=96.5,
            affected_zone="Engineering & Computing Labs",
            suspected_fault="Symptom: Correlated rogue gateway responses and optical frame errors",
            confidence_score=0.86,
            symptoms=[
                "Dual fault signatures: conflicting default gateways (10.110.1.1 vs 10.110.1.254)",
                "Optical RX power on Core Link 2 below -22 dBm sensitivity threshold",
                "Bimodal latency distribution in affected cohort (2ms vs 310ms)"
            ],
            recommended_fix="Activate DHCP Snooping with Option 82 and replace faulty SFP+ transceiver on Core Link 2."
        )

        ground_truth = GroundTruth(
            scenario_id="multiple-simultaneous-faults",
            primary_fault_category="DHCP",
            injected_root_cause="Rogue DHCP Server offering conflicting default gateway 10.110.1.254",
            affected_device_ids=[f"DEV-MULTI-{401 + i:03d}" for i in range(affected_count)],
            affected_node_id="edge-sw-eng-02",
            secondary_fault_category="Interface",
            secondary_root_cause="Transceiver Optical Degradation on SW-ENG-CORE-02 Link 2",
            rationale="Two simultaneous independent faults: 10 devices hijacked by rogue gateway and 8 devices dropped by optical SFP transceiver frame corruption."
        )

        devices: List[DeviceTelemetry] = []

        for i in range(affected_count):
            is_rogue_gw = (i < 10)
            devices.append(DeviceTelemetry(
                device_id=f"DEV-MULTI-{401 + i:03d}",
                device_type="student_laptop" if is_rogue_gw else "lab_workstation",
                ip_address=f"10.110.1.{30 + i}",
                mac_address=_generate_mac(self.seed + 5000 + i),
                vlan="VLAN-110",
                connected_ap="AP-ENG-04" if is_rogue_gw else "AP-SCI-08",
                connected_switch="SW-ENG-EDGE-02" if is_rogue_gw else "SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(180.0, 340.0) if is_rogue_gw else rng.uniform(40.0, 95.0), 1),
                packet_loss_pct=round(rng.uniform(40.0, 80.0) if is_rogue_gw else rng.uniform(15.0, 30.0), 1),
                dhcp_lease_state="valid" if is_rogue_gw else "expired",
                dns_resolution_ms=round(rng.uniform(150.0, 320.0), 1),
                signal_strength_dbm=-54.0,
                jitter_ms=round(rng.uniform(25.0, 60.0), 1),
                interface_errors=312 if not is_rogue_gw else 12,
                status="fault",
                last_seen="1m ago"
            ))

        for i in range(healthy_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-MULTI-HLT-{i + 1:04d}",
                device_type=rng.choice(["student_laptop", "lab_workstation", "iot_sensor"]),
                ip_address=f"10.110.{(i % 4) + 1}.{10 + (i % 240)}",
                mac_address=_generate_mac(self.seed + 9000 + i),
                vlan="VLAN-110",
                connected_ap="AP-SCI-12",
                connected_switch="SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(3.6, 5.4), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(8.0, 15.0), 1),
                signal_strength_dbm=-52.0,
                jitter_ms=round(rng.uniform(0.3, 0.8), 2),
                interface_errors=0,
                status="healthy",
                last_seen="Just now"
            ))

        nodes, edges = self._build_base_topology("multiple-simultaneous-faults", affected_ap="ap-eng-04", affected_vlan=None, affected_count=18)
        return scenario, devices, nodes, edges, ground_truth

    def _gen_healthy_baseline(self) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Scenario 6: Nominal Baseline (Clean Network)
        Symptom label: "Campus Wide — Nominal Operations Baseline"
        """
        rng = random.Random(self.seed + 606)
        total_devices = 500
        affected_count = 0
        healthy_count = total_devices

        scenario = Scenario(
            id="healthy-baseline",
            name="Campus Wide - Nominal Baseline Operations",
            badge="Control Group",
            category="Healthy Benchmark",
            description="500 devices across campus operating within nominal parameters. 100% uptime with nominal jitter and zero lease exhaustion.",
            monitored_devices=total_devices,
            healthy_devices=healthy_count,
            affected_devices=affected_count,
            aggregate_health_pct=100.0,
            affected_zone="Campus Wide (All Zones)",
            suspected_fault="Nominal: All telemetry indicators within SLA boundaries",
            confidence_score=0.98,
            symptoms=[
                "Campus-wide mean latency: 3.8ms (Jitter: 0.4ms)",
                "DHCP scope utilization across all VLANs: 64.2%",
                "Zero packet drops or interface CRC errors recorded"
            ],
            recommended_fix="No remedial action necessary. Baseline recorded."
        )

        ground_truth = GroundTruth(
            scenario_id="healthy-baseline",
            primary_fault_category="None",
            injected_root_cause="None — Nominal Network Health",
            affected_device_ids=[],
            affected_node_id="core-router",
            rationale="Control group testing whether the multi-agent engine correctly abstains or confirms nominal performance without false alarms."
        )

        devices: List[DeviceTelemetry] = []

        for i in range(total_devices):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-BASE-{i + 1:04d}",
                device_type=rng.choice(["student_laptop", "lab_workstation", "iot_sensor", "faculty_pc", "mobile"]),
                ip_address=f"10.140.{(i % 8) + 1}.{10 + (i % 240)}",
                mac_address=_generate_mac(self.seed + 10000 + i),
                vlan=f"VLAN-{100 + (i % 4) * 10}",
                connected_ap=f"AP-{rng.choice(['ENG-04', 'SCI-08', 'SCI-12'])}",
                connected_switch="SW-ENG-EDGE-02" if i % 2 == 0 else "SW-SCI-DIST-01",
                latency_ms=round(rng.uniform(3.1, 4.8), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(7.0, 13.0), 1),
                signal_strength_dbm=round(rng.uniform(-56.0, -48.0), 1),
                jitter_ms=round(rng.uniform(0.2, 0.6), 2),
                interface_errors=0,
                status="healthy",
                last_seen="Just now"
            ))

        nodes, edges = self._build_base_topology("healthy-baseline", affected_ap=None, affected_vlan=None, affected_count=0)
        return scenario, devices, nodes, edges, ground_truth

    def _gen_ethernet_fault(self) -> Tuple[Scenario, List[DeviceTelemetry], List[NetworkNode], List[NetworkEdge], GroundTruth]:
        """
        Scenario 7: Physical Ethernet Interface Fault & CRC Errors (Data Center Compute Pod)
        Symptom label: "Data Center Compute Pod — Physical Ethernet CRC Errors & Link Instability"
        """
        rng = random.Random(self.seed + 707)
        total_devices = 540
        affected_count = 10
        healthy_count = total_devices - affected_count

        scenario = Scenario(
            id="ethernet-interface-fault",
            name="Data Center Compute Pod - Physical Interface Degradation & CRC Errors",
            badge="Physical L1/L2",
            category="Ethernet / PHY",
            description="540 compute nodes monitored. Global health reads 98.1%, but 10 compute nodes connected to SW-ENG-EDGE-02 suffer physical link frame corruption with rising interface CRC error counters and 21% packet loss.",
            monitored_devices=total_devices,
            healthy_devices=healthy_count,
            affected_devices=affected_count,
            aggregate_health_pct=98.1,
            affected_zone="Data Center Compute Pod 3",
            suspected_fault="Symptom: Escalating interface CRC errors, frame alignment drops, and link flapping on SW-ENG-EDGE-02",
            confidence_score=0.94,
            symptoms=[
                "Interface error counters spiking: 380+ CRC/FCS frame errors per 60s sampling epoch",
                "Downlink packet loss 21.4% with physical link instability, while round-trip latency remains low (14ms)",
                "Adjacent ports on same switch SW-ENG-EDGE-02 report 0 interface errors and 0% loss"
            ],
            recommended_fix="Replace degraded Cat6A / SFP+ patch cable on SW-ENG-EDGE-02 Port 8; clean optical ferrule and reseat transceiver."
        )

        ground_truth = GroundTruth(
            scenario_id="ethernet-interface-fault",
            primary_fault_category="Interface",
            injected_root_cause="Physical Ethernet Layer Degradation: Damaged SFP+ / Cat6A Patch Cable on SW-ENG-EDGE-02 Port 8 generating CRC frame corruption",
            affected_device_ids=[f"DEV-ETH-{501 + i:03d}" for i in range(affected_count)],
            affected_node_id="edge-sw-eng-02",
            rationale="Physical layer degradation causes frame check sequence (FCS) CRC errors and intermittent link carrier loss without bufferbloat or IPAM misconfiguration."
        )

        devices: List[DeviceTelemetry] = []

        for i in range(affected_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-ETH-{501 + i:03d}",
                device_type="lab_workstation",
                ip_address=f"10.140.3.{40 + i}",
                mac_address=_generate_mac(self.seed + 7500 + i),
                vlan="VLAN-140",
                connected_ap="None (Wired)",
                connected_switch="SW-ENG-EDGE-02",
                latency_ms=round(rng.uniform(12.0, 24.0), 1),
                packet_loss_pct=round(rng.uniform(18.0, 26.0), 1),
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(9.0, 15.0), 1),
                signal_strength_dbm=-45.0,
                jitter_ms=round(rng.uniform(2.0, 4.5), 1),
                interface_errors=380 + i * 25,
                status="fault",
                last_seen="10s ago"
            ))

        for i in range(healthy_count):
            devices.append(DeviceTelemetry(
                device_id=f"DEV-ETH-HLT-{i + 1:04d}",
                device_type=rng.choice(["student_laptop", "lab_workstation", "iot_sensor"]),
                ip_address=f"10.140.{(i % 6) + 1}.{10 + (i % 240)}",
                mac_address=_generate_mac(self.seed + 8500 + i),
                vlan="VLAN-140",
                connected_ap="None (Wired)" if i % 2 == 0 else "AP-ENG-04",
                connected_switch="SW-ENG-EDGE-02",
                latency_ms=round(rng.uniform(3.2, 5.0), 1),
                packet_loss_pct=0.0,
                dhcp_lease_state="valid",
                dns_resolution_ms=round(rng.uniform(7.0, 12.0), 1),
                signal_strength_dbm=-48.0,
                jitter_ms=round(rng.uniform(0.2, 0.7), 2),
                interface_errors=0,
                status="healthy",
                last_seen="Just now"
            ))

        nodes, edges = self._build_base_topology("ethernet-interface-fault", affected_ap="ap-eng-04", affected_vlan="vlan-142", affected_count=10)
        return scenario, devices, nodes, edges, ground_truth

    def _build_base_topology(self, scenario_id: str, affected_ap: Optional[str], affected_vlan: Optional[str], affected_count: int) -> Tuple[List[NetworkNode], List[NetworkEdge]]:
        """
        Builds topology nodes and edges with deterministic positions and React Flow attributes.
        """
        is_clean = (affected_count == 0)

        nodes = [
            NetworkNode(
                id="core-router",
                position={"x": 380, "y": 30},
                data=NetworkNodeData(
                    id="core-router",
                    label="Campus Core Gateway (R-CAMPUS-01)",
                    type="router",
                    status="healthy",
                    zone="Data Center 1",
                    ip="10.0.0.1",
                    throughput="14.2 Gbps",
                    packet_loss="0.001%",
                    connected_devices=500,
                    details=NetworkNodeDetails(
                        model="Cisco Catalyst 9600 Core",
                        firmware="IOS-XE 17.9.4",
                        uptime="284 days",
                        cpu_load="14%",
                        memory_load="38%",
                        alarms=[]
                    )
                )
            ),
            NetworkNode(
                id="dist-sw-eng",
                position={"x": 160, "y": 150},
                data=NetworkNodeData(
                    id="dist-sw-eng",
                    label="Eng Distribution (SW-ENG-CORE-02)",
                    type="switch",
                    status="warning" if not is_clean and affected_ap == "ap-eng-04" else "healthy",
                    zone="Engineering Quad",
                    ip="10.140.0.2",
                    throughput="2.4 Gbps",
                    packet_loss="0.02%",
                    connected_devices=180,
                    affected_count=affected_count if affected_ap == "ap-eng-04" else 0,
                    details=NetworkNodeDetails(
                        model="Aruba CX 8325 32-port 40G",
                        firmware="AOS-CX 10.12",
                        uptime="142 days",
                        cpu_load="28%",
                        memory_load="44%",
                        alarms=["DHCP Scope capacity alert"] if affected_vlan == "vlan-142" else []
                    )
                )
            ),
            NetworkNode(
                id="dist-sw-sci",
                position={"x": 600, "y": 150},
                data=NetworkNodeData(
                    id="dist-sw-sci",
                    label="Science Distribution (SW-SCI-CORE-01)",
                    type="switch",
                    status="healthy",
                    zone="Science Complex",
                    ip="10.120.0.2",
                    throughput="3.1 Gbps",
                    packet_loss="0.00%",
                    connected_devices=320,
                    details=NetworkNodeDetails(
                        model="Aruba CX 8325 32-port 40G",
                        firmware="AOS-CX 10.12",
                        uptime="96 days",
                        cpu_load="19%",
                        memory_load="36%",
                        alarms=[]
                    )
                )
            ),
            NetworkNode(
                id="edge-sw-eng-02",
                position={"x": 60, "y": 280},
                data=NetworkNodeData(
                    id="edge-sw-eng-02",
                    label="Edge Switch (SW-ENG-EDGE-02)",
                    type="switch",
                    status="warning" if not is_clean and affected_ap == "ap-eng-04" else "healthy",
                    zone="Engineering Wing B",
                    ip="10.142.0.2",
                    throughput="680 Mbps",
                    packet_loss="0.05%",
                    connected_devices=48,
                    affected_count=affected_count if affected_ap == "ap-eng-04" else 0,
                    details=NetworkNodeDetails(
                        model="Catalyst 9300 48-port PoE+",
                        firmware="IOS-XE 17.6",
                        uptime="81 days",
                        cpu_load="22%",
                        memory_load="41%",
                        alarms=["Port Gi1/0/14 telemetry anomaly"] if not is_clean and affected_ap == "ap-eng-04" else []
                    )
                )
            ),
            NetworkNode(
                id="ap-eng-04",
                position={"x": 60, "y": 400},
                data=NetworkNodeData(
                    id="ap-eng-04",
                    label="Wi-Fi 6 AP (AP-ENG-04)",
                    type="access-point",
                    status="fault" if not is_clean and affected_ap == "ap-eng-04" else "healthy",
                    zone="Engineering Wing B — 2nd Floor",
                    ip="10.142.0.45",
                    throughput="142 Mbps",
                    packet_loss="12.4%" if not is_clean and affected_ap == "ap-eng-04" else "0.01%",
                    connected_devices=24,
                    affected_count=affected_count if affected_ap == "ap-eng-04" else 0,
                    details=NetworkNodeDetails(
                        model="Cisco Catalyst 9130AX Series",
                        firmware="Capwap 17.9",
                        uptime="45 days",
                        cpu_load="31%",
                        memory_load="52%",
                        alarms=["APIPA Fallback detected on client stations"] if not is_clean and affected_ap == "ap-eng-04" else []
                    )
                )
            ),
            NetworkNode(
                id="ap-sci-08",
                position={"x": 520, "y": 280},
                data=NetworkNodeData(
                    id="ap-sci-08",
                    label="Wi-Fi 6 AP (AP-SCI-08)",
                    type="access-point",
                    status="fault" if not is_clean and affected_ap == "ap-sci-08" else "healthy",
                    zone="Science Complex — 1st Floor",
                    ip="10.120.1.18",
                    throughput="210 Mbps",
                    packet_loss="0.00%",
                    connected_devices=32,
                    details=NetworkNodeDetails(
                        model="Cisco Catalyst 9130AX Series",
                        firmware="Capwap 17.9",
                        uptime="96 days",
                        cpu_load="18%",
                        memory_load="42%",
                        alarms=[]
                    )
                )
            ),
            NetworkNode(
                id="ap-sci-12",
                position={"x": 700, "y": 280},
                data=NetworkNodeData(
                    id="ap-sci-12",
                    label="Wi-Fi 6 AP (AP-SCI-12)",
                    type="access-point",
                    status="fault" if not is_clean and affected_ap == "ap-sci-12" else "healthy",
                    zone="Science Complex — Lab 401",
                    ip="10.120.4.22",
                    throughput="45 Mbps" if not is_clean and affected_ap == "ap-sci-12" else "180 Mbps",
                    packet_loss="28.4%" if not is_clean and affected_ap == "ap-sci-12" else "0.01%",
                    connected_devices=28,
                    affected_count=affected_count if affected_ap == "ap-sci-12" else 0,
                    details=NetworkNodeDetails(
                        model="Cisco Catalyst 9130AX Series",
                        firmware="Capwap 17.9",
                        uptime="96 days",
                        cpu_load="29%",
                        memory_load="46%",
                        alarms=["High 802.11 beacon retries"] if not is_clean and affected_ap == "ap-sci-12" else []
                    )
                )
            ),
            NetworkNode(
                id="vlan-142",
                position={"x": 260, "y": 280},
                data=NetworkNodeData(
                    id="vlan-142",
                    label="VLAN 142 (Eng Student Pool /24)",
                    type="vlan",
                    status="fault" if affected_vlan == "vlan-142" else "healthy",
                    zone="Engineering Segment",
                    ip="10.142.0.0/24",
                    throughput="412 Mbps",
                    packet_loss="2.8%" if affected_vlan == "vlan-142" else "0.00%",
                    connected_devices=254,
                    affected_count=affected_count if affected_vlan == "vlan-142" else 0,
                    details=NetworkNodeDetails(
                        model="Virtual Subnet Definition",
                        firmware="L3 SVI",
                        uptime="Continuous",
                        alarms=["Scope capacity 100%: 254/254 active leases"] if affected_vlan == "vlan-142" else []
                    )
                )
            ),
            NetworkNode(
                id="dev-eng-failing",
                position={"x": 60, "y": 530},
                data=NetworkNodeData(
                    id="dev-eng-failing",
                    label=f"{affected_count} Affected Client Devices" if not is_clean else "0 Failing Devices",
                    type="device",
                    status="fault" if not is_clean else "healthy",
                    zone="Engineering Wing B — Room 204" if affected_ap == "ap-eng-04" else "Science Complex",
                    ip="169.254.81.x (APIPA)" if scenario_id == "dhcp-starvation" else "Degraded Connection",
                    throughput="0 Kbps" if not is_clean else "100 Mbps",
                    packet_loss="100.0%" if scenario_id == "dhcp-starvation" else "28.0%" if not is_clean else "0.0%",
                    affected_count=affected_count,
                    details=NetworkNodeDetails(
                        model="Mixed Student Laptops / Workstations",
                        uptime="Disconnected" if not is_clean else "Online",
                        alarms=["High localized failure rate"] if not is_clean else []
                    )
                )
            ),
            NetworkNode(
                id="dev-eng-healthy",
                position={"x": 260, "y": 450},
                data=NetworkNodeData(
                    id="dev-eng-healthy",
                    label="Healthy Campus Endpoints",
                    type="device",
                    status="healthy",
                    zone="Campus Wide",
                    ip="10.142.0.x / 10.120.x.x",
                    throughput="12.8 Gbps",
                    packet_loss="0.00%",
                    connected_devices=500 - affected_count,
                    details=NetworkNodeDetails(
                        model="Mixed Endpoints (Laptops, Tablets, IoT)",
                        uptime="Online",
                        alarms=[]
                    )
                )
            )
        ]

        edges = [
            NetworkEdge(id="e-core-disteng", source="core-router", target="dist-sw-eng", animated=True, style={"stroke": "#64748B", "strokeWidth": 2}),
            NetworkEdge(id="e-core-distsci", source="core-router", target="dist-sw-sci", animated=True, style={"stroke": "#64748B", "strokeWidth": 2}),
            NetworkEdge(id="e-disteng-edge02", source="dist-sw-eng", target="edge-sw-eng-02", animated=True, style={"stroke": "#F59E0B" if affected_ap == "ap-eng-04" else "#64748B", "strokeWidth": 2}),
            NetworkEdge(id="e-disteng-vlan142", source="dist-sw-eng", target="vlan-142", animated=True, style={"stroke": "#EF4444" if affected_vlan == "vlan-142" else "#10B981", "strokeWidth": 2}),
            NetworkEdge(id="e-edge02-ap04", source="edge-sw-eng-02", target="ap-eng-04", animated=True, style={"stroke": "#EF4444" if affected_ap == "ap-eng-04" else "#10B981", "strokeWidth": 2}),
            NetworkEdge(id="e-ap04-devfailing", source="ap-eng-04", target="dev-eng-failing", animated=True, style={"stroke": "#EF4444" if affected_ap == "ap-eng-04" else "#10B981", "strokeWidth": 2, "strokeDasharray": "4 4"}),
            NetworkEdge(id="e-distsci-ap08", source="dist-sw-sci", target="ap-sci-08", animated=True, style={"stroke": "#EF4444" if affected_ap == "ap-sci-08" else "#10B981", "strokeWidth": 2}),
            NetworkEdge(id="e-distsci-ap12", source="dist-sw-sci", target="ap-sci-12", animated=True, style={"stroke": "#EF4444" if affected_ap == "ap-sci-12" else "#10B981", "strokeWidth": 2}),
            NetworkEdge(id="e-disteng-devhealthy", source="dist-sw-eng", target="dev-eng-healthy", animated=False, style={"stroke": "#10B981", "strokeWidth": 1.5})
        ]

        return nodes, edges
