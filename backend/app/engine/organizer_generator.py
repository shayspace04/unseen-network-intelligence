"""
Official NetCoop AI Hackathon Telemetry Generator (Reference Implementation)
Generates switch and network telemetry records matching organizer schema.
Updated with timezone-aware UTC datetime generation.
"""

import json
import random
import datetime
from typing import Dict, Any, Optional, List, Literal

FaultType = Literal["normal", "latency_spike", "hardware_failure"]

def generate_telemetry_record(
    device_id: str = "SW_CAMPUS_1",
    fault_type: FaultType = "normal",
    timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates an individual organizer-compliant telemetry record.
    Uses timezone-aware UTC datetime (replacing deprecated datetime.utcnow()).
    """
    if timestamp is None:
        # Timezone-aware ISO-8601 UTC timestamp
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if fault_type == "normal":
        cpu = round(random.uniform(8.0, 24.0), 1)
        link = round(random.uniform(12.0, 38.0), 1)
        packet_loss = 0.0
        latency = round(random.uniform(2.5, 6.8), 2)
        queue_drops = 0
        interface_errors = 0
        status = "Healthy"
    elif fault_type == "latency_spike":
        cpu = round(random.uniform(35.0, 55.0), 1)
        link = round(random.uniform(60.0, 82.0), 1)
        packet_loss = round(random.uniform(4.0, 9.5), 2)
        latency = round(random.uniform(320.0, 580.0), 2)
        queue_drops = random.randint(250, 850)
        interface_errors = random.randint(5, 25)
        status = "Warning"
    elif fault_type == "hardware_failure":
        cpu = 99.9
        link = 100.0
        packet_loss = round(random.uniform(20.0, 32.0), 2)
        latency = round(random.uniform(700.0, 1050.0), 2)
        queue_drops = random.randint(8000, 16000)
        interface_errors = random.randint(200, 450)
        status = "Critical"
    else:
        raise ValueError(f"Unsupported fault_type: {fault_type}. Must be normal, latency_spike, or hardware_failure.")

    return {
        "timestamp": timestamp,
        "device_id": device_id,
        "metrics": {
            "cpu_utilization_pct": cpu,
            "link_utilization_pct": link,
            "packet_loss_pct": packet_loss,
            "latency_ms": latency,
            "queue_drops": queue_drops,
            "interface_errors": interface_errors
        },
        "status": status
    }

def generate_telemetry_batch(
    devices: Optional[List[str]] = None,
    fault_type: FaultType = "normal",
    count: int = 5
) -> List[Dict[str, Any]]:
    """Generates a batch array of telemetry records."""
    if not devices:
        devices = [f"SW_CAMPUS_{i}" for i in range(1, count + 1)]
    return [generate_telemetry_record(device_id=dev, fault_type=fault_type) for dev in devices]

def generate_telemetry_jsonl(records: List[Dict[str, Any]]) -> str:
    """Encodes telemetry records into newline-delimited JSON Lines (jsonl)."""
    return "\n".join(json.dumps(r) for r in records)

if __name__ == "__main__":
    record = generate_telemetry_record(device_id="SW_CAMPUS_1", fault_type="hardware_failure")
    print(json.dumps(record, indent=2))
