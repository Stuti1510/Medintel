"""
SQLAlchemy database models for MEDINTEL AI.
Stores clinical analysis records, predictions, quality scores, and modality contributions.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ClinicalCaseRecord(Base):
    __tablename__ = "clinical_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Text input
    narrative = Column(Text, nullable=False)
    
    # Image input & quality assessment
    image_path = Column(String(512), nullable=True)
    quality_score = Column(Float, nullable=True)
    enhancement_method = Column(String(64), nullable=True) # e.g. "none", "clahe", "unet"
    
    # Multimodal gated prediction
    image_weight = Column(Float, nullable=True)   # Gate weight g in [0, 1]
    fused_prediction = Column(String(32), nullable=False) # e.g. "BCC", "ACK", "NEV", "SEK"
    fused_confidence = Column(Float, nullable=False)
    probabilities_json = Column(Text, nullable=False)
    
    # Clinical Safety & Risk flags
    red_flag_alert = Column(String(512), nullable=True)
