from pydantic import BaseModel

class StudyPlan(BaseModel):
    markdown: str
    title: str
    estimated_duration: str
    follow_up_chips: list[str]
