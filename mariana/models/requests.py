from pydantic import BaseModel
from models.resource import Resource, CurriculumOutcome


class DiscoverRequest(BaseModel):
    grade: str                # e.g. "Year 10"
    subject: str              # e.g. "History"
    state: str                # e.g. "NSW"
    topic: str                # e.g. "World War I causes"
    first_nation: bool = False # e.g. "false"

class GenerateRequest(BaseModel):
    grade: str
    subject: str
    state: str
    topic: str
    first_nation: bool = False
    selected_resources: list[Resource]
    curriculum_outcomes: list[CurriculumOutcome] = []
    additional_context: str = ""
    timeline_weeks: int = 2
    level: str = "Beginner"  # e.g. "Beginner", "Intermediate", "Advanced"

    @property
    def selected_web_urls(self) -> list[str]:
        return [r.url for r in self.selected_resources
                if r.source_type == "web" and r.url is not None]

    @property
    def selected_document_ids(self) -> list[str]:
        return [r.document_id for r in self.selected_resources
                if r.source_type == "teacher_upload" and r.document_id is not None]