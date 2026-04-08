# services/discovery_service.py
import json
from pathlib import Path
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_tavily import TavilySearch
from langchain.agents.structured_output import ToolStrategy

from config import TEST_MODE
from models.requests import DiscoverRequest
from models.resource import ResourceList
from services.llm_service import LLMService
from services.rag_service import RagService
from services.prompt_service import PromptService
from services.curriculum_service import CurriculumService

_FIXTURE_PATH = Path(__file__).parent.parent / "data" / "fixtures" / "discover_response.json"


class DiscoveryService:

    def __init__(self) -> None:
        """Initializes RAG, LLM, Tavily search, and sets up the LangChain agent."""
        self.curriculum = CurriculumService()

        if not TEST_MODE:
            self.rag    = RagService()
            self.llm    = LLMService.get()
            self.tavily = TavilySearch(max_results=15, topic="general")
            self.agent  = create_agent(
                model=self.llm,
                tools=self._get_tools(),
                system_prompt=self._build_system_prompt(),
                response_format=ToolStrategy(ResourceList),
            )

    def _get_tools(self) -> list:
        """Defines the tools available to the discovery agent."""
        
        @tool
        def search_teacher_documents(query: str) -> str:
            """Search documents that the teacher has previously uploaded."""
            return self._search_teacher_documents_logic(query)

        @tool
        def search_web_resources(query: str) -> str:
            """Search the web for educational resources, articles, and materials.
            Use specific queries like 'Year 8 Science cells biological systems Australia'."""
            return self._search_web_resources_logic(query)

        return [search_web_resources, search_teacher_documents]

    def _search_teacher_documents_logic(self, query: str) -> str:
        """Encapsulates the logic for searching teacher-uploaded documents."""
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

    def _search_web_resources_logic(self, query: str) -> str:
        """Encapsulates the logic for searching web resources."""
        results = self.tavily.invoke(query)
        return json.dumps(results)

    def _build_system_prompt(self) -> str:
        """Returns the system prompt instructing the agent on resource criteria."""
        return PromptService.discovery_system_prompt()

    def search(self, request: DiscoverRequest) -> ResourceList:
        """Combines request details into queries and invokes the agent to find resources."""
        if TEST_MODE:
            return self._fixture_response(request)

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

        first_nations_query = ""
        first_nations_instruction = ""
        if request.first_nation:
            first_nations_query = (
                f"Find educational resources that specifically incorporate Australian Aboriginal and Torres Strait Islander "
                f"histories, cultures, and perspectives for {request.grade} {request.subject} topic: {request.topic}. "
                f"Look for authentic First Nations voices and stories."
            )
            first_nations_instruction = """
--- FIRST NATIONS PERSPECTIVE REQUESTED ---
The teacher has requested a focus on First Nations perspectives. 
Prioritize finding and including resources that feature Australian Aboriginal and Torres Strait Islander 
histories, cultures, or knowledge systems related to this topic. Where applicable.
-------------------------------------------
"""

        # ── 3. Inject curriculum context into the message ──────────────────
        full_message = f"""
{location_query}

{general_query}

{scootle_query}

{first_nations_query}

{first_nations_instruction}

--- CURRICULUM CONTEXT ---
{curriculum_block if curriculum_block else "No specific outcomes matched — find broadly relevant resources."}
--------------------------

When rating curriculum_alignment for each resource, check it against the
ACARA outcomes listed above using this 5-level scale:
- "exemplary"  — directly and comprehensively addresses one or more descriptor statements
- "high"       — directly covers the topic with clear curriculum links
- "medium"     — covers the topic generally but lacks specific curriculum alignment
- "low"        — tangentially related; useful supplementary material
- "minimal"    — barely relevant; only include if no better option exists
"""

        # ── 4. Run the agent ────────────────────────────────────────────────
        result: ResourceList = self.agent.invoke(
            {"messages": [HumanMessage(content=full_message)]}
        )["structured_response"]

        # ── 5. Sort resources by curriculum alignment (best first) ────────
        _alignment_order = {"exemplary": 0, "high": 1, "medium": 2, "low": 3, "minimal": 4}
        result.resources.sort(key=lambda r: _alignment_order.get(r.curriculum_alignment, 99))

        # ── 6. Attach curriculum outcomes to the result ────────────────────
        result.curriculum_outcomes = curriculum_outcomes

        # ── 7. Save the result to a JSON file ──────────────────────────────
        # Pydantic v2 uses model_dump_json()
        json_data = result.model_dump_json(indent=4) 
        
        # If you are on an older version of Pydantic (v1), use .json() instead:
        # json_data = result.json(indent=4)

        if TEST_MODE:
            with open(_FIXTURE_PATH, "w") as f:
                f.write(json_data)

        return result

    def _fixture_response(self, request: DiscoverRequest) -> ResourceList:
        """Returns the saved fixture instead of calling the LLM/Tavily."""
        data = json.loads(_FIXTURE_PATH.read_text(encoding="utf-8"))
        result = ResourceList(**data)
        # Still attach live curriculum outcomes so the chips render correctly
        result.curriculum_outcomes = self.curriculum.get_outcomes(
            subject=request.subject,
            grade=request.grade,
            topic=request.topic,
        )
        return result
