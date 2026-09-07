"""
MEDINTEL AI — Motor & Cognitive Screening API Router
Endpoints for persisting real behavioral sessions, retrieving trial streams, and aggregate research statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime

from backend.app.database.session import get_db
from backend.app.models.entities import (
    MotorScreeningSession,
    MotorScreeningTrial,
    MotorScreeningMetric
)
from backend.app.schemas.motor import (
    SessionCreate,
    SessionResponse,
    SessionDetailResponse
)

router = APIRouter()

@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def save_motor_session(payload: SessionCreate, db: Session = Depends(get_db)):
    """
    Persists a real behavioral screening session, trials, and derived metrics.
    All persisted data originates strictly from browser monotonic performance timing.
    """
    try:
        # Check if session with this reference already exists
        existing_session = db.query(MotorScreeningSession).filter(
            MotorScreeningSession.session_reference == payload.session_reference
        ).first()

        if existing_session:
            session_obj = existing_session
            session_obj.end_time = payload.end_time or datetime.utcnow()
            session_obj.duration_sec = payload.duration_sec
            session_obj.overall_quality = payload.overall_quality
            session_obj.completion_status = payload.completion_status
        else:
            session_obj = MotorScreeningSession(
                session_reference=payload.session_reference,
                start_time=payload.start_time or datetime.utcnow(),
                end_time=payload.end_time,
                duration_sec=payload.duration_sec,
                device_tier=payload.device_tier,
                input_sensor=payload.input_sensor,
                viewport_width=payload.viewport_width,
                viewport_height=payload.viewport_height,
                user_agent=payload.user_agent,
                overall_quality=payload.overall_quality,
                completion_status=payload.completion_status
            )
            db.add(session_obj)
            db.flush()

        # Add Trials
        saved_trials_count = 0
        if payload.trials:
            for t in payload.trials:
                trial_obj = MotorScreeningTrial(
                    session_id=session_obj.id,
                    test_type=t.test_type,
                    trial_number=t.trial_number,
                    is_practice=1 if t.is_practice else 0,
                    status=t.status,
                    stimulus_timestamp=t.stimulus_timestamp,
                    response_timestamp=t.response_timestamp,
                    reaction_time_ms=t.reaction_time_ms,
                    inter_tap_interval_ms=t.inter_tap_interval_ms,
                    path_id=t.path_id,
                    path_efficiency_pct=t.path_efficiency_pct,
                    mean_deviation_px=t.mean_deviation_px,
                    coordinates_data=t.coordinates_data,
                    input_type=t.input_type
                )
                db.add(trial_obj)
                saved_trials_count += 1

        # Add / Replace Metrics
        saved_metrics_count = 0
        if payload.metrics:
            for m in payload.metrics:
                # Remove existing metric of same test_type for this session if updating
                db.query(MotorScreeningMetric).filter(
                    MotorScreeningMetric.session_id == session_obj.id,
                    MotorScreeningMetric.test_type == m.test_type
                ).delete()

                metric_obj = MotorScreeningMetric(
                    session_id=session_obj.id,
                    test_type=m.test_type,
                    derived_metrics=m.derived_metrics,
                    quality_status=m.quality_status
                )
                db.add(metric_obj)
                saved_metrics_count += 1

        db.commit()
        db.refresh(session_obj)

        return {
            "status": "SAVED_TO_EXPERIMENT_REGISTRY",
            "session_id": session_obj.id,
            "session_reference": session_obj.session_reference,
            "saved_trials": saved_trials_count,
            "saved_metrics": saved_metrics_count,
            "timestamp": session_obj.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist motor screening session: {str(e)}"
        )

@router.get("/sessions", response_model=List[SessionResponse])
async def list_motor_sessions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Lists completed motor screening sessions with trial counts.
    """
    sessions = db.query(MotorScreeningSession).order_by(
        MotorScreeningSession.created_at.desc()
    ).offset(skip).limit(limit).all()

    response = []
    for s in sessions:
        trials_cnt = len(s.trials)
        metrics_cnt = len(s.metrics)
        response.append(SessionResponse(
            id=s.id,
            session_reference=s.session_reference,
            start_time=s.start_time,
            end_time=s.end_time,
            duration_sec=s.duration_sec,
            device_tier=s.device_tier,
            input_sensor=s.input_sensor,
            overall_quality=s.overall_quality,
            completion_status=s.completion_status,
            trials_count=trials_cnt,
            metrics_count=metrics_cnt,
            created_at=s.created_at
        ))
    return response

@router.get("/sessions/{session_ref_or_id}", response_model=SessionDetailResponse)
async def get_motor_session_detail(session_ref_or_id: str, db: Session = Depends(get_db)):
    """
    Retrieves detailed trial and metrics records for a given screening session.
    """
    query = db.query(MotorScreeningSession)
    if session_ref_or_id.isdigit():
        session_obj = query.filter(MotorScreeningSession.id == int(session_ref_or_id)).first()
    else:
        session_obj = query.filter(MotorScreeningSession.session_reference == session_ref_or_id).first()

    if not session_obj:
        raise HTTPException(status_code=404, detail="Motor screening session not found")

    return session_obj

@router.get("/stats")
async def get_motor_aggregate_stats(db: Session = Depends(get_db)):
    """
    Computes real aggregate research distributions across all completed sessions.
    Returns 'insufficient_data' if fewer than 2 completed sessions exist.
    """
    sessions_count = db.query(MotorScreeningSession).count()
    if sessions_count < 2:
        return {
            "total_sessions": sessions_count,
            "insufficient_data": True,
            "message": "INSUFFICIENT SESSIONS FOR AGGREGATE ANALYSIS (Minimum 2 required)"
        }

    # Reaction Time Aggregate Stats
    rt_trials = db.query(MotorScreeningTrial.reaction_time_ms).filter(
        MotorScreeningTrial.test_type == "reaction-time",
        MotorScreeningTrial.is_practice == 0,
        MotorScreeningTrial.status == "VALID",
        MotorScreeningTrial.reaction_time_ms.isnot(None)
    ).all()
    rt_values = [r[0] for r in rt_trials if r[0] is not None]

    # Motor Stability Aggregate Stats
    ms_trials = db.query(
        MotorScreeningTrial.path_efficiency_pct,
        MotorScreeningTrial.mean_deviation_px
    ).filter(
        MotorScreeningTrial.test_type == "motor-stability",
        MotorScreeningTrial.is_practice == 0,
        MotorScreeningTrial.status == "VALID"
    ).all()
    eff_values = [m[0] for m in ms_trials if m[0] is not None]
    dev_values = [m[1] for m in ms_trials if m[1] is not None]

    # Finger Tap Aggregate Stats
    ft_trials = db.query(MotorScreeningTrial.inter_tap_interval_ms).filter(
        MotorScreeningTrial.test_type == "finger-tap",
        MotorScreeningTrial.is_practice == 0,
        MotorScreeningTrial.inter_tap_interval_ms.isnot(None),
        MotorScreeningTrial.inter_tap_interval_ms >= 35
    ).all()
    iti_values = [f[0] for f in ft_trials if f[0] is not None]

    # Quality breakdown
    quality_counts = db.query(
        MotorScreeningSession.overall_quality,
        func.count(MotorScreeningSession.id)
    ).group_by(MotorScreeningSession.overall_quality).all()

    return {
        "total_sessions": sessions_count,
        "insufficient_data": False,
        "reaction_time": {
            "count": len(rt_values),
            "mean_ms": round(sum(rt_values) / len(rt_values), 1) if rt_values else None,
            "min_ms": min(rt_values) if rt_values else None,
            "max_ms": max(rt_values) if rt_values else None
        },
        "motor_stability": {
            "count": len(eff_values),
            "mean_efficiency_pct": round(sum(eff_values) / len(eff_values), 1) if eff_values else None,
            "mean_deviation_px": round(sum(dev_values) / len(dev_values), 1) if dev_values else None
        },
        "finger_tap": {
            "count": len(iti_values),
            "mean_iti_ms": round(sum(iti_values) / len(iti_values), 1) if iti_values else None
        },
        "quality_distribution": {q[0]: q[1] for q in quality_counts}
    }
