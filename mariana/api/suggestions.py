from fastapi import APIRouter, Query
from pydantic import BaseModel
from data.curriculum_suggestions import CURRICULUM_SUGGESTIONS, GRADES, SUBJECTS

router = APIRouter(prefix="/api", tags=["suggestions"])


class SuggestionsResponse(BaseModel):
    grades: list[str]
    subjects: list[str]
    suggestions: list[str]


@router.get("/suggestions", response_model=SuggestionsResponse)
def get_suggestions(
    grade: str = Query(default="Year 8"),
    subject: str = Query(default="Science"),
) -> SuggestionsResponse:
    """Returns the available grades, subjects, and topic suggestions for a grade/subject pair."""
    suggestions = (
        CURRICULUM_SUGGESTIONS
        .get(grade, {})
        .get(subject, [])
    )
    return SuggestionsResponse(grades=GRADES, subjects=SUBJECTS, suggestions=suggestions)
