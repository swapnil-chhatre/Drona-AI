# models/resource.py
from pydantic import BaseModel, Field
from typing import Literal

class Resource(BaseModel):
    title: str
    url: str | None = None
    summary: str
    source_type: Literal["web", "teacher_upload"]
    curriculum_alignment: Literal["exemplary", "high", "medium", "low", "minimal"]
    bias_risk: Literal["low", "medium", "flag"]
    reading_level: str
    domain: str | None = None
    follow_up_questions: list[str]
    document_id: str | None = None

class CurriculumOutcome(BaseModel):
    code: str
    description: str
    scootle_url: str
    strand: str
    sub_strand: str

class ResourceList(BaseModel):
    resources: list[Resource] = Field(min_length=10, description="At least 10 unique resources must be returned.")
    curriculum_outcomes: list[CurriculumOutcome]  # Scootle cards for frontend
    search_queries_used: list[str]
    total_found: int
