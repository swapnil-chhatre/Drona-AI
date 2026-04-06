# services/discovery_service.py
import json
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_tavily import TavilySearch
from langchain.agents.structured_output import ToolStrategy

from models.requests import DiscoverRequest
from models.resource import ResourceList
from services.llm_service import LLMService
from services.rag_service import RagService
from services.prompt_service import PromptService
from services.curriculum_service import CurriculumService


class DiscoveryService:

    def __init__(self) -> None:
        self.rag        = RagService()
        self.llm        = LLMService.get()
        self.curriculum = CurriculumService()

        tavily = TavilySearch(max_results=15, topic="general")

        @tool
        def search_teacher_documents(query: str) -> str:
            """Search documents that the teacher has previously uploaded."""
            docs = self.rag.retrieve(query)
            if not docs:
                return "No teacher documents found."
            results = []
            for d in docs:
                results.append(
                    f"TEACHER_DOCUMENT\n"
                    f"document_id: {d.metadata.get('document_id')}\n"
                    f"filename: {d.metadata.get('filename', 'Unknown')}\n"
                    f"source_type: teacher_upload\n"
                    f"url: null\n"
                    f"domain: teacher_upload\n"
                    f"content: {d.page_content}"
                )
            return "\n\n---\n\n".join(results)

        @tool
        def search_web_resources(query: str) -> str:
            """Search the web for educational resources, articles, and materials.
            Use specific queries like 'Year 8 Science cells biological systems Australia'."""
            results = tavily.invoke(query)
            return json.dumps(results)

        self.agent = create_agent(
            model=self.llm,
            tools=[search_web_resources, search_teacher_documents],
            system_prompt=self._build_system_prompt(),
            response_format=ToolStrategy(ResourceList),
        )

    def _build_system_prompt(self) -> str:
        return PromptService.discovery_system_prompt()

    def search(self, request: DiscoverRequest) -> ResourceList:
        # ── 1. Pull matched curriculum outcomes ────────────────────────────
        curriculum_outcomes = self.curriculum.get_outcomes(
            subject=request.subject,
            grade=request.grade,
            topic=request.topic,
        )
        curriculum_block = self.curriculum.get_context_block(
            subject=request.subject,
            grade=request.grade,
            topic=request.topic,
        )

        # ── 2. Build search queries enriched with ACARA codes ──────────────
        codes_str = ", ".join(o.code for o in curriculum_outcomes[:5])

        location_query = (
            f"Find educational resources for {request.grade} {request.subject} "
            f"students in {request.state}, Australia. "
            f"Topic: {request.topic}. "
            f"ACARA outcomes: {codes_str}. "
            f"Focus on Australian curriculum alignment and age-appropriate content."
        )
        general_query = (
            f"Find educational resources for {request.grade} {request.subject}. "
            f"Topic: {request.topic}. "
            f"Build understanding from first principles. Age-appropriate content."
        )
        scootle_query = (
            f"Search Scootle and Australian education resources for "
            f"{request.grade} {request.subject} {request.topic} "
            f"ACARA codes {codes_str}."
        )

        # ── 3. Inject curriculum context into the message ──────────────────
        full_message = f"""
{location_query}

{general_query}

{scootle_query}

--- CURRICULUM CONTEXT ---
{curriculum_block if curriculum_block else "No specific outcomes matched — find broadly relevant resources."}
--------------------------

When rating curriculum_alignment for each resource, check it against the 
ACARA outcomes listed above. A resource that directly addresses one of the 
descriptor statements above should be rated "high".
"""

        # ── 4. Run the agent ────────────────────────────────────────────────
        result: ResourceList = self.agent.invoke(
            {"messages": [HumanMessage(content=full_message)]}
        )["structured_response"]

        # ── 5. Attach curriculum outcomes to the result ────────────────────
        # The agent fills resources[] — we bolt on curriculum_outcomes[]
        # so the frontend gets both in one response.
        result.curriculum_outcomes = curriculum_outcomes

        return result