from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(20), nullable=False, default="Medium")
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    assigned_staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(30), nullable=False, default="Pending")
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="complaints")
    assigned_staff = relationship("User", foreign_keys=[assigned_staff_id])
    department = relationship("Department", back_populates="complaints")
    location = relationship("Location", back_populates="complaints")
    updates = relationship(
        "ComplaintUpdate",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="ComplaintUpdate.created_at.desc()"
    )
