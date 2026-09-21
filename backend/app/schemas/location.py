from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class LocationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
