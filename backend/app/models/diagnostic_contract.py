"""
UNSEEN Diagnostic Report Contract & JSON Schema Validation
Implements the canonical NetCoop AI Hackathon Diagnostic Report JSON Contract
and provides schema validation using jsonschema.
"""

from typing import List, Dict, Any, Optional, Union, Literal, Tuple
from pydantic import BaseModel, Field, ConfigDict, field_validator
import jsonschema

DIAGNOSTIC_REPORT_JSON_SCHEMA: Dict[str, Any] = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "UNSEEN Diagnostic Report Canonical Contract",
    "description": "NetCoop AI Hackathon required diagnostic JSON report schema",
    "type": "object",
    "required": [
        "incident_id",
        "status",
        "suspected_root_cause",
        "confidence",
        "affected_devices",
        "supporting_evidence",
        "alternative_causes",
        "recommended_actions",
        "evidence_sources",
        "limitations"
    ],
    "properties": {
        "incident_id": {
            "type": "string",
            "description": "Unique identifier of the incident investigation"
        },
        "status": {
            "type": "string",
            "enum": ["diagnosed", "abstained"],
            "description": "Investigation outcome status: diagnosed or abstained"
        },
        "suspected_root_cause": {
            "type": "string",
            "description": "Primary diagnosed failure mode or nominal operations"
        },
        "confidence": {
            "type": "number",
            "minimum": 0.0,
            "maximum": 1.0,
            "description": "Evidence-based confidence score between 0.0 and 1.0"
        },
        "affected_devices": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of device IDs isolated in anomalous cohort"
        },
        "supporting_evidence": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["metric", "value", "interpretation"],
                "properties": {
                    "metric": {"type": "string"},
                    "value": {"type": ["number", "string", "boolean"]},
                    "interpretation": {"type": "string"}
                }
            },
            "description": "Empirical telemetry signals supporting the diagnosis"
        },
        "alternative_causes": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Falsified or competing alternative fault hypotheses"
        },
        "recommended_actions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Targeted remediation actions"
        },
        "alternative_cause_details": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["title", "probability", "status"],
                "properties": {
                    "title": {"type": "string"},
                    "probability": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                    "status": {"type": "string"},
                    "rationale": {"type": "string"}
                }
            },
            "description": "Detailed alternative cause objects preserving probability, status, and rationale"
        },
        "recommended_action_details": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["action", "urgency", "estimated_resolution", "target_system"],
                "properties": {
                    "action": {"type": "string"},
                    "urgency": {"type": "string", "enum": ["immediate", "scheduled", "preventative"]},
                    "estimated_resolution": {"type": "string"},
                    "target_system": {"type": "string"}
                }
            },
            "description": "Detailed remediation action objects preserving urgency, estimated resolution, and target system"
        },
        "evidence_sources": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Names of multi-agent squad members contributing evidence"
        },
        "limitations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Explicit uncertainties, missing parameters, or caveats"
        },
        "verdict": {
            "type": "string",
            "enum": ["PROBABLE_FAULT", "NO_FAULT_DETECTED", "ABSTAIN_INSUFFICIENT_EVIDENCE"],
            "description": "Explicit verdict category"
        },
        "scenario_id": {"type": "string"},
        "confidence_methodology": {"type": "string"},
        "evidence_references": {
            "type": "array",
            "items": {"type": "string"}
        },
        "simultaneous_faults": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["fault_layer", "description", "affected_devices_count"],
                "properties": {
                    "fault_layer": {"type": "string"},
                    "description": {"type": "string"},
                    "affected_devices_count": {"type": "integer"}
                }
            }
        },
        "created_at": {"type": "string"}
    },
    "additionalProperties": True
}

class SupportingEvidenceItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    metric: str
    value: Union[float, int, str, bool]
    interpretation: str

class AlternativeCauseItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    title: str
    probability: float
    status: str
    rationale: str = ""

class RecommendedActionItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    action: str
    urgency: Literal['immediate', 'scheduled', 'preventative']
    estimated_resolution: str = Field(..., alias="estimated_resolution")
    target_system: str = Field(..., alias="target_system")

class SimultaneousFaultItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    fault_layer: str
    description: str
    affected_devices_count: int

class CanonicalDiagnosticContract(BaseModel):
    """
    Pydantic Model adhering strictly to NetCoop AI Hackathon JSON Contract.
    """
    model_config = ConfigDict(populate_by_name=True)

    incident_id: str
    status: Literal['diagnosed', 'abstained']
    suspected_root_cause: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    affected_devices: List[str]
    supporting_evidence: List[SupportingEvidenceItem]
    alternative_causes: List[str]
    recommended_actions: List[str]
    evidence_sources: List[str]
    limitations: List[str]

    # Additional detailed structures preserving rich objects
    alternative_cause_details: List[AlternativeCauseItem] = Field(default_factory=list)
    recommended_action_details: List[RecommendedActionItem] = Field(default_factory=list)

    # Optional / Compatibility Extensions
    verdict: Optional[Literal['PROBABLE_FAULT', 'NO_FAULT_DETECTED', 'ABSTAIN_INSUFFICIENT_EVIDENCE']] = None
    scenario_id: Optional[str] = None
    confidence_methodology: Optional[str] = None
    evidence_references: List[str] = Field(default_factory=list)
    simultaneous_faults: Optional[List[SimultaneousFaultItem]] = None
    created_at: Optional[str] = None

    @field_validator("confidence")
    @classmethod
    def validate_confidence_range(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"Confidence score {v} must be between 0.0 and 1.0")
        return round(v, 2)

    @field_validator("alternative_causes", mode="before")
    @classmethod
    def normalize_alternative_causes(cls, v: Any) -> List[str]:
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if isinstance(item, str):
                result.append(item)
            elif isinstance(item, dict) and "title" in item:
                result.append(str(item["title"]))
            elif hasattr(item, "title"):
                result.append(str(getattr(item, "title")))
            else:
                result.append(str(item))
        return result

    @field_validator("recommended_actions", mode="before")
    @classmethod
    def normalize_recommended_actions(cls, v: Any) -> List[str]:
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if isinstance(item, str):
                result.append(item)
            elif isinstance(item, dict) and "action" in item:
                result.append(str(item["action"]))
            elif hasattr(item, "action"):
                result.append(str(getattr(item, "action")))
            else:
                result.append(str(item))
        return result

class ReportValidationError(Exception):
    """Raised when a diagnostic report fails JSON Schema validation."""
    pass

def validate_diagnostic_contract_json(report_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validates a report dictionary against the documented DIAGNOSTIC_REPORT_JSON_SCHEMA.
    Returns: (is_valid, error_message_if_any)
    """
    try:
        jsonschema.validate(instance=report_data, schema=DIAGNOSTIC_REPORT_JSON_SCHEMA)
        return True, None
    except jsonschema.ValidationError as err:
        return False, f"JSON Schema Validation Error at path '{list(err.path)}': {err.message}"
    except Exception as exc:
        return False, f"Unexpected validation failure: {str(exc)}"
