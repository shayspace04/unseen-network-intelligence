"""
UNSEEN Base Agent Architecture
Common interface, message serialization, and telemetry unit normalization.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
import datetime
import uuid
from ..models.schemas import AgentMessage

class BaseAgent(ABC):
    def __init__(self, agent_id: str, name: str, role: str, responsibility: str, agent_tag: str):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.responsibility = responsibility
        self.agent_tag = agent_tag

    def create_message(
        self,
        incident_id: str,
        recipient: str,
        message_type: str,
        topic: str,
        payload: Dict[str, Any],
        evidence_references: Optional[List[str]] = None,
        limitations: Optional[List[str]] = None,
        verdict: Optional[str] = "supported"
    ) -> AgentMessage:
        """
        Creates a versioned, validated AgentMessage adhering to the 1.0.0 contract.
        """
        return AgentMessage(
            schema_version="1.0.0",
            message_id=f"MSG-{uuid.uuid4().hex[:8].upper()}",
            incident_id=incident_id,
            sender=self.name,
            recipient=recipient,
            message_type=message_type,
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S.%f")[:-3],
            topic=topic,
            payload=payload,
            evidence_references=evidence_references or [],
            limitations=limitations or [],
            verdict=verdict
        )

    @staticmethod
    def normalize_latency_ms(val: Any) -> float:
        """
        Normalizes diverse units (e.g. '500ms', '0.5s', 24) to float milliseconds.
        """
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)
        val_str = str(val).strip().lower()
        if val_str.endswith("ms"):
            return float(val_str[:-2])
        if val_str.endswith("s"):
            return float(val_str[:-1]) * 1000.0
        try:
            return float(val_str)
        except ValueError:
            return 0.0

    @staticmethod
    def normalize_packet_loss_pct(val: Any) -> float:
        """
        Normalizes packet loss to a percentage (0.0 - 100.0).
        """
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            # If 0.0 to 1.0 was passed as a fraction, convert to percentage
            if 0.0 < val <= 1.0:
                return float(val * 100.0)
            return float(val)
        val_str = str(val).strip().replace("%", "")
        try:
            v = float(val_str)
            if 0.0 < v <= 1.0:
                return v * 100.0
            return v
        except ValueError:
            return 0.0

    @abstractmethod
    def execute(self, incident_id: str, context: Dict[str, Any]) -> Tuple[AgentMessage, Dict[str, Any]]:
        """
        Executes the agent's specialized task and returns the message and output context.
        """
        pass
