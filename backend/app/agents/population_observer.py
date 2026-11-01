"""
UNSEEN Agent 1: Population Observer (AGENT-POP-01)
Discovers micro-cohorts experiencing network failure when aggregate metrics remain green.
"""

from typing import List, Dict, Any, Tuple
from collections import Counter
from .base import BaseAgent
from ..models.schemas import DeviceTelemetry, AgentMessage

class PopulationObserverAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="agent-pop-observer",
            name="Population Observer",
            role="Anomaly & Cluster Discovery",
            responsibility="Identifies anomalous micro-populations suffering network degradation while overall aggregate metrics report healthy averages.",
            agent_tag="AGENT-POP-01"
        )

    def execute(self, incident_id: str, context: Dict[str, Any]) -> Tuple[AgentMessage, Dict[str, Any]]:
        devices: List[DeviceTelemetry] = context.get("devices", [])
        total = len(devices)

        if total == 0:
            msg = self.create_message(
                incident_id=incident_id,
                recipient="Counterfactual Agent",
                message_type="cohort_discovery",
                topic="Empty Fleet Telemetry",
                payload={"error": "No devices available for monitoring"},
                limitations=["Telemetry feed offline or unpopulated"],
                verdict="inconclusive"
            )
            return msg, {"affected_devices": [], "healthy_devices": [], "clusters": {}}

        affected_devices: List[DeviceTelemetry] = []
        healthy_devices: List[DeviceTelemetry] = []

        for d in devices:
            loss = self.normalize_packet_loss_pct(d.packetLossPct) if d.packetLossPct is not None else 0.0
            lat = self.normalize_latency_ms(d.latencyMs) if d.latencyMs is not None else 0.0
            dns_time = self.normalize_latency_ms(d.dnsResolutionMs) if d.dnsResolutionMs is not None else 0.0
            cpu = d.cpuUtilizationPct if d.cpuUtilizationPct is not None else 0.0
            q_drops = d.egressQueueDrops if d.egressQueueDrops is not None else 0
            if_errs = d.interfaceErrors if d.interfaceErrors is not None else 0

            is_degraded = (
                loss >= 15.0 or
                lat >= 200.0 or
                d.dhcpLeaseState in ("unassigned", "nack") or
                dns_time >= 2000.0 or
                d.status in ("fault", "critical", "warning") or
                cpu >= 90.0 or
                q_drops > 100 or
                if_errs > 50
            )

            if is_degraded:
                affected_devices.append(d)
            else:
                healthy_devices.append(d)

        affected_count = len(affected_devices)
        healthy_count = len(healthy_devices)
        aggregate_health_pct = round((healthy_count / total) * 100.0, 1)

        # Cluster breakdown by AP, switch, and VLAN (ignoring unprovided fields)
        ap_counts = Counter(d.connectedAP for d in affected_devices if d.connectedAP)
        switch_counts = Counter(d.connectedSwitch for d in affected_devices if d.connectedSwitch)
        vlan_counts = Counter(d.vlan for d in affected_devices if d.vlan)

        # Detect minority failure hidden by aggregate
        is_hidden_minority = (0 < affected_count <= 25 and aggregate_health_pct >= 96.0)

        symptom_notes = []
        if any(d.dhcpLeaseState in ("unassigned", "nack") for d in affected_devices):
            symptom_notes.append("IP negotiation timeouts / APIPA unassigned addresses")
        if any((d.packetLossPct or 0) > 20.0 for d in affected_devices):
            symptom_notes.append("High packet discard rate")
        if any(d.dnsResolutionMs is not None and d.dnsResolutionMs >= 2000.0 for d in affected_devices):
            symptom_notes.append("DNS query resolution drop")
        if any((d.latencyMs or 0) > 250.0 for d in affected_devices):
            symptom_notes.append("Tail latency spike")
        if any((d.cpuUtilizationPct or 0) >= 90.0 for d in affected_devices):
            symptom_notes.append("Severe switch CPU resource exhaustion (control plane lockup)")
        if any((d.egressQueueDrops or 0) > 5000 for d in affected_devices):
            symptom_notes.append("Critical egress buffer queue depletion")
        if any((d.interfaceErrors or 0) > 100 for d in affected_devices):
            symptom_notes.append("High physical interface framing / CRC errors")

        finding_str = (
            f"Isolated anomalous cohort of {affected_count} devices ({((affected_count/total)*100):.1f}% of fleet) "
            f"while aggregate health reads {aggregate_health_pct}% apparent green."
            if affected_count > 0 else "All 500 devices operating within nominal parameters (100.0% healthy baseline)."
        )

        payload = {
            "total_monitored": total,
            "affected_count": affected_count,
            "healthy_count": healthy_count,
            "aggregate_health_pct": aggregate_health_pct,
            "is_hidden_minority": is_hidden_minority,
            "affected_device_ids": [d.deviceId for d in affected_devices],
            "sample_healthy_ids": [d.deviceId for d in healthy_devices[:10]],
            "cluster_breakdown": {
                "top_access_points": dict(ap_counts.most_common(3)),
                "top_switches": dict(switch_counts.most_common(3)),
                "top_vlans": dict(vlan_counts.most_common(3))
            },
            "observed_symptoms": symptom_notes or ["Nominal Baseline Telemetry"]
        }

        msg = self.create_message(
            incident_id=incident_id,
            recipient="Counterfactual Agent",
            message_type="cohort_discovery",
            topic="Anomalous Micro-Population Discovered" if affected_count > 0 else "Nominal Baseline Confirmed",
            payload=payload,
            evidence_references=[f"TELEMETRY-COHORT-{affected_count}-NODES"],
            limitations=[
                "Sampling frequency: 60s window",
                "Telemetry does not inspect encrypted application payloads"
            ],
            verdict="supported"
        )

        output_context = {
            "affected_devices": affected_devices,
            "healthy_devices": healthy_devices,
            "clusters": payload["cluster_breakdown"],
            "aggregate_health_pct": aggregate_health_pct,
            "affected_count": affected_count,
            "total_devices": total,
            "latest_finding": finding_str
        }

        return msg, output_context
