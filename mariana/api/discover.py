from fastapi import APIRouter
from fastapi.responses import JSONResponse
from fastapi import status
from pydantic import BaseModel
from models.requests import DiscoverRequest
from models.resource import ResourceList
from services.agent_service import AgentService
from services.discovery_service import DiscoveryService


router = APIRouter(prefix="/api", tags=["discover"])
agent_service = AgentService()
discovery_service = DiscoveryService()

@router.post("/discover", response_model=ResourceList)
def discover(request: DiscoverRequest) -> ResourceList:
    """Handles POST request to find web and teacher resources via DiscoveryService."""
    return discovery_service.search(request)


