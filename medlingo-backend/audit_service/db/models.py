# audit_service/db/models.py
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    event_type = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(String, nullable=True)