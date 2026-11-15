"""
Database initialization for MEDINTEL AI.
Initializes medintel.db and seeds the 4 target disease categories.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DB_PATH = PROJECT_ROOT / "medintel.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from backend.app.models.entities import Base, ClinicalCaseRecord

def init_db():
    print(f"Initializing database at: {DB_PATH}")
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully!")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
