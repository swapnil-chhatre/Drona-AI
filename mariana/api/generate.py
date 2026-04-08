import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.requests import GenerateRequest, FollowUpRequest
from models.study_plan import StudyPlan
from services.plan_service import PlanService

router = APIRouter(prefix="/api", tags=["generate"])
plan_service = PlanService()

@router.post("/generate/stream")
async def generate_stream(request: GenerateRequest):
    """Streams the study plan markdown token by token via SSE."""
    async def event_generator():
        async for chunk in plan_service.stream_generate(request):
            yield f"data: {json.dumps({'token': chunk})}\n\n"
        yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/generate/quiz/stream")
async def generate_quiz_stream(request: GenerateRequest):
    """Streams the quiz markdown token by token via SSE."""
    async def event_generator():
        async for chunk in plan_service.stream_quiz(request):
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

@router.post("/generate/activities/stream")
async def generate_activities_stream(request: GenerateRequest):
    """Streams the activities markdown token by token via SSE."""
    async def event_generator():
        async for chunk in plan_service.stream_activities(request):
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

@router.post("/generate/keywords/stream")
async def generate_keywords_stream(request: GenerateRequest):
    """Streams the keywords markdown token by token via SSE."""
    async def event_generator():
        async for chunk in plan_service.stream_keywords(request):
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


@router.post("/generate/followup/stream")
async def generate_followup_stream(request: FollowUpRequest):
    """Streams a revised study plan, quiz, activities, or keywords based on the selected chip."""
    async def event_generator():
        async for chunk in plan_service.stream_followup(request):
            yield f"data: {json.dumps({'token': chunk})}\n\n"
        yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


