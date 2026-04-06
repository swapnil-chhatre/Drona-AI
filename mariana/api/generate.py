import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.requests import GenerateRequest
from models.study_plan import StudyPlan
from services.plan_service import PlanService

router = APIRouter(prefix="/api", tags=["generate"])
plan_service = PlanService()

@router.post("/generate/stream")
async def generate_stream(request: GenerateRequest):
    """Streams the study plan markdown token by token via SSE."""
    async def event_generator():
        async for chunk in plan_service.stream_generate(request):
            data = json.dumps({"token": chunk})
            yield f"data: {data}\n\n"
        # Signal completion
        yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

# Keep non-streaming as fallback
@router.post("/generate", response_model=StudyPlan)
async def generate(request: GenerateRequest) -> StudyPlan:
    return await plan_service.generate(request)