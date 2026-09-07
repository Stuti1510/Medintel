"""
MEDINTEL AI — Motor & Cognitive Screening Schemas
Pydantic data models for session persistence, raw trial streams, and aggregate research statistics.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TrialCreate(BaseModel):
    test_type: str
    trial_number: int
    is_practice: bool = False
    status: str = "VALID"
    stimulus_timestamp: Optional[float] = None
    response_timestamp: Optional[float] = None
    reaction_time_ms: Optional[float] = None
    inter_tap_interval_ms: Optional[float] = None
    path_id: Optional[str] = None
    path_efficiency_pct: Optional[float] = None
    mean_deviation_px: Optional[float] = None
    coordinates_data: Optional[List[Dict[str, Any]]] = None
    input_type: Optional[str] = None

class MetricCreate(BaseModel):
    test_type: str
    derived_metrics: Dict[str, Any]
    quality_status: str

class SessionCreate(BaseModel):
    session_reference: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_sec: Optional[float] = None
    device_tier: Optional[str] = None
    input_sensor: Optional[str] = None
    viewport_width: Optional[int] = None
    viewport_height: Optional[int] = None
    user_agent: Optional[str] = None
    overall_quality: str = "INSUFFICIENT DATA"
    completion_status: str = "PARTIAL"
    trials: Optional[List[TrialCreate]] = Field(default_factory=list)
    metrics: Optional[List[MetricCreate]] = Field(default_factory=list)

class TrialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_type: str
    trial_number: int
    is_practice: int
    status: str
    reaction_time_ms: Optional[float] = None
    inter_tap_interval_ms: Optional[float] = None
    path_efficiency_pct: Optional[float] = None
    mean_deviation_px: Optional[float] = None
    input_type: Optional[str] = None

class MetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_type: str
    derived_metrics: Dict[str, Any]
    quality_status: str

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_reference: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_sec: Optional[float] = None
    device_tier: Optional[str] = None
    input_sensor: Optional[str] = None
    overall_quality: str
    completion_status: str
    trials_count: int
    metrics_count: int
    created_at: datetime

class SessionDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_reference: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_sec: Optional[float] = None
    device_tier: Optional[str] = None
    input_sensor: Optional[str] = None
    viewport_width: Optional[int] = None
    viewport_height: Optional[int] = None
    user_agent: Optional[str] = None
    overall_quality: str
    completion_status: str
    created_at: datetime
    trials: List[TrialResponse] = []
    metrics: List[MetricResponse] = []
