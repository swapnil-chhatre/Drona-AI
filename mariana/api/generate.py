from fastapi import APIRouter
from models.requests import GenerateRequest
from models.study_plan import StudyPlan
from services.plan_service import PlanService

router = APIRouter(prefix="/api", tags=["generate"])
plan_service = PlanService()

@router.post("/generate", response_model=StudyPlan)
async def generate(request: GenerateRequest) -> StudyPlan:
    return await plan_service.generate(request)