"""
UNSEEN Organizer Telemetry Adapter
Ingests, validates, and normalizes external telemetry records produced by
the NetCoop AI Hackathon official telemetry generator into UNSEEN's canonical data model.
"""

import json
import re
import datetime
from typing import Dict, Any, List, Tuple, Union, Optional
from ..models.schemas import DeviceTelemetry, OrganizerTelemetryRecord

# Time-To-Live for fresh telemetry (5 minutes / 300 seconds)
TELEMETRY_FRESHNESS_TTL_SECONDS = 300.0

CANONICAL_UNPROVIDED_FIELDS = [
    "connected_ap",
    "connected_switch",
    "vlan",
    "signal_strength_dbm",
    "dhcp_lease_state",
    "dns_resolution_ms",
    "throughput",
    "bandwidth",
    "memory_utilization",
    "topology_graph"
]

class TelemetryIngestionError(Exception):
    """Raised when organizer telemetry cannot be parsed or fails validation."""
    pass

class OrganizerTelemetryAdapter:
    """
    Adapter responsible for parsing single records, batch lists, JSON arrays,
    and JSON Lines (jsonl), enforcing bounds validation, evaluating freshness,
    and normalizing into UNSEEN DeviceTelemetry while preserving strict ground-truth isolation
    and refraining from fabricating unprovided network fields.
    """

    @classmethod
    def parse_and_normalize(
        cls,
        raw_input: Union[str, dict, list],
        current_time: Optional[datetime.datetime] = None
    ) -> Tuple[List[DeviceTelemetry], Dict[str, Any]]:
        """
        Parses raw input and normalizes it into DeviceTelemetry records.
        Returns: (normalized_devices, metadata_dict)
        """
        if current_time is None:
            current_time = datetime.datetime.now(datetime.timezone.utc)

        raw_records, detected_format = cls._extract_records(raw_input)
        if not raw_records:
            raise TelemetryIngestionError("No valid telemetry records found in input.")

        normalized_devices: List[DeviceTelemetry] = []
        validation_errors: List[str] = []
        stale_count = 0

        for idx, rec in enumerate(raw_records):
            try:
                device, is_stale = cls._normalize_single_record(rec, idx, current_time)
                normalized_devices.append(device)
                if is_stale:
                    stale_count += 1
            except Exception as e:
                validation_errors.append(f"Record #{idx + 1} ({rec.get('device_id', 'unknown')}): {str(e)}")

        if not normalized_devices and validation_errors:
            raise TelemetryIngestionError(f"Validation failed for all records: {'; '.join(validation_errors)}")

        metadata = {
            "source_format": "organizer_netcoop",
            "detected_input_format": detected_format,
            "total_records_received": len(raw_records),
            "valid_records_normalized": len(normalized_devices),
            "stale_records_count": stale_count,
            "validation_errors": validation_errors,
            "unprovided_fields_preserved_as_null": CANONICAL_UNPROVIDED_FIELDS,
            "raw_payload_preserved": raw_records
        }

        return normalized_devices, metadata

    @classmethod
    def _extract_records(cls, raw_input: Union[str, dict, list]) -> Tuple[List[Dict[str, Any]], str]:
        """Extracts list of dictionary records and detects input format."""
        if isinstance(raw_input, dict):
            return [raw_input], "single_object"

        if isinstance(raw_input, list):
            # List of dicts
            return [r for r in raw_input if isinstance(r, dict)], "json_array"

        if isinstance(raw_input, str):
            trimmed = raw_input.strip()
            if not trimmed:
                raise TelemetryIngestionError("Empty telemetry input string.")

            # Try parsing as standard JSON (object or array)
            try:
                parsed = json.loads(trimmed)
                if isinstance(parsed, dict):
                    return [parsed], "single_json_string"
                elif isinstance(parsed, list):
                    return [r for r in parsed if isinstance(r, dict)], "json_array_string"
            except json.JSONDecodeError:
                pass

            # Try parsing as JSON Lines (jsonl)
            lines = [l.strip() for l in trimmed.splitlines() if l.strip()]
            jsonl_records = []
            for line_no, line in enumerate(lines, 1):
                try:
                    line_data = json.loads(line)
                    if isinstance(line_data, dict):
                        jsonl_records.append(line_data)
                except json.JSONDecodeError as err:
                    raise TelemetryIngestionError(f"Malformed JSON on line {line_no}: {str(err)}")

            if jsonl_records:
                return jsonl_records, "jsonl_string"

            raise TelemetryIngestionError("Input could not be parsed as valid JSON or JSON Lines.")

        raise TelemetryIngestionError(f"Unsupported input type: {type(raw_input).__name__}")

    @classmethod
    def _normalize_single_record(
        cls,
        rec: Dict[str, Any],
        index: int,
        current_time: datetime.datetime
    ) -> Tuple[DeviceTelemetry, bool]:
        """Validates and maps a single organizer dictionary into canonical DeviceTelemetry."""
        # 1. Device ID validation
        device_id = rec.get("device_id")
        if not device_id or not isinstance(device_id, str):
            raise TelemetryIngestionError("Missing or invalid 'device_id'. Must be a non-empty string.")

        # 2. Timestamp validation and freshness evaluation
        timestamp_str = rec.get("timestamp")
        if not timestamp_str or not isinstance(timestamp_str, str):
            raise TelemetryIngestionError(f"Device '{device_id}' missing or invalid 'timestamp'.")

        record_dt, is_stale, stale_seconds = cls._evaluate_freshness(timestamp_str, current_time)

        # 3. Status validation and normalization
        raw_status = rec.get("status")
        if not raw_status or not isinstance(raw_status, str):
            raise TelemetryIngestionError(f"Device '{device_id}' missing or invalid 'status'.")

        status_lower = raw_status.strip().lower()
        if status_lower in ("healthy", "normal"):
            canonical_status = "healthy"
        elif status_lower in ("warning", "degraded"):
            canonical_status = "warning"
        elif status_lower in ("critical", "fault", "hardware_failure"):
            canonical_status = "critical"
        else:
            raise TelemetryIngestionError(
                f"Device '{device_id}' has unrecognized status '{raw_status}'. "
                f"Must be Healthy, Warning, or Critical."
            )

        # 4. Metrics dictionary validation and Interoperability Field Normalization (Task 2)
        metrics = rec.get("metrics")
        if not metrics or not isinstance(metrics, dict):
            raise TelemetryIngestionError(f"Device '{device_id}' missing 'metrics' dictionary.")

        # Task 2A: Normalize incompatible field names when meaning is unambiguous
        # Queue Drops: queue_drops vs egress_queue_drops vs buffer_drops
        raw_q_drops = None
        for q_alias in ["queue_drops", "egress_queue_drops", "buffer_drops"]:
            if q_alias in metrics and metrics[q_alias] is not None:
                raw_q_drops = metrics[q_alias]
                break

        # CPU: cpu_utilization_pct vs cpu_utilization vs cpu_load_pct
        raw_cpu = None
        for cpu_alias in ["cpu_utilization_pct", "cpu_utilization", "cpu_load_pct"]:
            if cpu_alias in metrics and metrics[cpu_alias] is not None:
                raw_cpu = metrics[cpu_alias]
                break

        # Link: link_utilization_pct vs link_utilization
        raw_link = None
        for link_alias in ["link_utilization_pct", "link_utilization"]:
            if link_alias in metrics and metrics[link_alias] is not None:
                raw_link = metrics[link_alias]
                break

        # Packet Loss: packet_loss_pct vs packet_loss
        raw_loss = None
        for loss_alias in ["packet_loss_pct", "packet_loss"]:
            if loss_alias in metrics and metrics[loss_alias] is not None:
                raw_loss = metrics[loss_alias]
                break

        # Interface Errors: interface_errors vs crc_errors vs errors
        raw_if_errors = None
        for if_alias in ["interface_errors", "crc_errors", "errors"]:
            if if_alias in metrics and metrics[if_alias] is not None:
                raw_if_errors = metrics[if_alias]
                break

        # Task 2B: Incompatible unit normalization for latency (seconds vs milliseconds)
        raw_lat = None
        is_latency_in_seconds = False
        if "latency_seconds" in metrics and metrics["latency_seconds"] is not None:
            raw_lat = metrics["latency_seconds"]
            is_latency_in_seconds = True
        elif "latency_s" in metrics and metrics["latency_s"] is not None:
            raw_lat = metrics["latency_s"]
            is_latency_in_seconds = True
        elif "latency_ms" in metrics and metrics["latency_ms"] is not None:
            raw_lat = metrics["latency_ms"]
        elif "latency" in metrics and metrics["latency"] is not None:
            raw_lat = metrics["latency"]
            # If latency value is explicitly fractional < 2.0 with a unit note, or standard ms
            val = float(raw_lat)
            if 0.0 < val <= 2.0 and "second" in str(rec.get("unit", "")).lower():
                is_latency_in_seconds = True

        # Task 2E: Reject missing mandatory telemetry metrics (do not invent missing data)
        missing_required = []
        if raw_cpu is None:
            missing_required.append("cpu_utilization_pct")
        if raw_link is None:
            missing_required.append("link_utilization_pct")
        if raw_loss is None:
            missing_required.append("packet_loss_pct")
        if raw_lat is None:
            missing_required.append("latency_ms")
        if raw_q_drops is None:
            missing_required.append("queue_drops")
        if raw_if_errors is None:
            missing_required.append("interface_errors")

        if missing_required:
            raise TelemetryIngestionError(
                f"Device '{device_id}' missing mandatory telemetry metrics: {', '.join(missing_required)}. "
                f"Missing telemetry cannot be fabricated (STRICT CONSTRAINT)."
            )

        # Convert and normalize units
        try:
            cpu_pct = float(raw_cpu)
            link_pct = float(raw_link)
            loss_pct = float(raw_loss)
            lat_ms = float(raw_lat) * 1000.0 if is_latency_in_seconds else float(raw_lat)
            q_drops = int(raw_q_drops)
            if_errors = int(raw_if_errors)
        except (ValueError, TypeError) as conv_err:
            raise TelemetryIngestionError(f"Device '{device_id}' metric value type error: {str(conv_err)}")

        # Task 2B: Numerical bounds validation
        if not (0.0 <= cpu_pct <= 100.0):
            raise TelemetryIngestionError(f"Device '{device_id}' cpu_utilization_pct ({cpu_pct}) must be in [0, 100].")
        if not (0.0 <= link_pct <= 100.0):
            raise TelemetryIngestionError(f"Device '{device_id}' link_utilization_pct ({link_pct}) must be in [0, 100].")
        if not (0.0 <= loss_pct <= 100.0):
            raise TelemetryIngestionError(f"Device '{device_id}' packet_loss_pct ({loss_pct}) must be in [0, 100].")
        if lat_ms < 0.0:
            raise TelemetryIngestionError(f"Device '{device_id}' latency_ms ({lat_ms}) cannot be negative.")
        if q_drops < 0:
            raise TelemetryIngestionError(f"Device '{device_id}' queue_drops ({q_drops}) cannot be negative.")
        if if_errors < 0:
            raise TelemetryIngestionError(f"Device '{device_id}' interface_errors ({if_errors}) cannot be negative.")

        # 5. STRICT CONSTRAINT: Do NOT invent measurements not provided in organizer schema
        # throughput, bandwidth, memory, RSSI, AP, VLAN, and topology remain None (null)
        canonical_telemetry = DeviceTelemetry(
            device_id=device_id,
            device_type="switch" if "SW" in device_id.upper() else "network_device",
            ip_address=None,
            mac_address=None,
            vlan=None,
            connected_ap=None,
            connected_switch=None,
            latency_ms=lat_ms,
            packet_loss_pct=loss_pct,
            dhcp_lease_state=None,
            dns_resolution_ms=None,
            signal_strength_dbm=None,
            jitter_ms=0.5,
            interface_errors=if_errors,
            status=canonical_status,
            last_seen=timestamp_str,
            # Organizer extensions
            cpu_utilization_pct=cpu_pct,
            link_utilization_pct=link_pct,
            egress_queue_drops=q_drops,
            source_format="organizer_netcoop",
            raw_payload=rec,
            is_stale=is_stale,
            stale_seconds=stale_seconds
        )

        return canonical_telemetry, is_stale

    @classmethod
    def _evaluate_freshness(
        cls,
        timestamp_str: str,
        current_time: datetime.datetime
    ) -> Tuple[datetime.datetime, bool, float]:
        """Parses ISO timestamp and evaluates staleness against TTL."""
        try:
            # Normalize ISO string with trailing Z
            clean_ts = timestamp_str.replace("Z", "+00:00")
            parsed_dt = datetime.datetime.fromisoformat(clean_ts)
            if parsed_dt.tzinfo is None:
                parsed_dt = parsed_dt.replace(tzinfo=datetime.timezone.utc)
        except Exception:
            # Fallback for unparseable timestamp: treat as stale
            return current_time, True, 999999.0

        age_seconds = (current_time - parsed_dt).total_seconds()
        is_stale = age_seconds > TELEMETRY_FRESHNESS_TTL_SECONDS
        return parsed_dt, is_stale, max(0.0, age_seconds)

def parse_organizer_input(
    raw_input: Union[str, dict, list]
) -> Tuple[List[DeviceTelemetry], Dict[str, Any]]:
    """Helper functional wrapper for OrganizerTelemetryAdapter."""
    return OrganizerTelemetryAdapter.parse_and_normalize(raw_input)
