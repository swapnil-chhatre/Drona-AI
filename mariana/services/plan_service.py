import asyncio
import json
from pathlib import Path
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from models.study_plan import StudyPlan
from models.requests import GenerateRequest
from langchain_community.document_loaders import WebBaseLoader

from config import TEST_MODE
from services.llm_service import LLMService
from services.rag_service import RagService
from services.prompt_service import PromptService
from services.curriculum_service import CurriculumService

_FIXTURE_PATH_STUDY_PLAN = Path(__file__).parent.parent / "data" / "fixtures" / "generate_response.md"
_FIXTURE_PATH_QUIZ_PLAN = Path(__file__).parent.parent / "data" / "fixtures" / "quiz_generate_response.md"
_FIXTURE_PATH_ACTIVITIES = Path(__file__).parent.parent / "data" / "fixtures" / "activities_generate_response.md"
_FIXTURE_PATH_KEYWORDS = Path(__file__).parent.parent / "data" / "fixtures" / "keywords_generate_response.md"

_CHUNK_SIZE = 40  # characters per streamed chunk in test mode


FOLLOW_UP_CHIPS = [
    "Generate a quiz",
    "Simplify for struggling students",
    "Add First Nations perspectives",
    "Create a differentiated version",
    "Generate discussion questions",
    "Make a rubric",
]

class PlanService:
    def __init__(self):
        """Initializes LLM and RAG services."""
        self.curriculum = CurriculumService()
        if not TEST_MODE:
            self.llm = LLMService.get(temperature=0.4)
            self.rag = RagService()

    def _build_curriculum_context(self, request: GenerateRequest) -> str:
        """Builds a curriculum context block from passed outcomes or re-derives from syllabus."""
        if request.curriculum_outcomes:
            lines = [
                f"AUSTRALIAN CURRICULUM OUTCOMES FOR {request.subject.upper()} {request.grade.upper()}",
                f"Topic: {request.topic}",
                "Map learning objectives to these ACARA content descriptors:\n",
            ]
            for o in request.curriculum_outcomes:
                lines.append(f"[{o.code}] {o.sub_strand}: {o.description}")
                lines.append(f"  Scootle: {o.scootle_url}")
            return "\n".join(lines)
        # Fallback: re-derive from syllabus if frontend didn't send outcomes
        return self.curriculum.get_context_block(
            subject=request.subject,
            grade=request.grade,
            topic=request.topic,
        )

    async def generate(self, request: GenerateRequest) -> StudyPlan:
        """Orchestrates content fetching and invokes LLM to generate the study plan."""

        # Step 1 — fetch web content for selected web resources
        web_content = await self._fetch_web_content(request.selected_web_urls)

        # Step 2 — RAG only the selected teacher documents  
        doc_content = await self._fetch_doc_content(
            topic=request.topic,
            document_ids=request.selected_document_ids
        )

        # Step 3 — single LLM call with everything
        return await self._generate_plan(request, web_content, doc_content)

    async def _generate_plan(
        self,
        request: GenerateRequest,
        web_content: str,
        doc_content: str
    ) -> StudyPlan:
        """Constructs prompt with gathered content and generates the study plan."""

        resources_text = "\n".join([
            f"- [{r.title}]({r.url or 'teacher upload'}): {r.summary}"
            for r in request.selected_resources
        ])

        prompt = PromptService.plan_generation_prompt(
            grade=request.grade,
            subject=request.subject,
            state=request.state,
            topic=request.topic,
            additional_context=request.additional_context or "None provided",
            resources_text=resources_text,
            web_content=web_content or "None available.",
            doc_content=doc_content or "None selected.",
            curriculum_context=self._build_curriculum_context(request),
            timeline_weeks=request.timeline_weeks,
            first_nation_perspective=request.first_nation,
        )

        response = self.llm.invoke(prompt)

        # TODO: Worth checking on getting the plan duration from the user

        return StudyPlan(
            markdown=response.text,
            title=f"{request.grade} {request.subject} — {request.topic}",
            estimated_duration=f"{request.timeline_weeks} weeks",
            follow_up_chips=FOLLOW_UP_CHIPS,
        )
    
    async def stream_generate(self, request: GenerateRequest):
        """Yields markdown tokens as they are generated."""
        if TEST_MODE:
            async for chunk in self._fixture_stream():
                yield chunk
            return

        web_content = await self._fetch_web_content(request.selected_web_urls)
        doc_content = await self._fetch_doc_content(
            topic=request.topic,
            document_ids=request.selected_document_ids
        )

        resources_text = "\n".join([
            f"- [{r.title}]({r.url or 'teacher upload'}): {r.summary}"
            for r in request.selected_resources
        ])

        prompt = PromptService.plan_generation_prompt(
            grade=request.grade,
            subject=request.subject,
            state=request.state,
            topic=request.topic,
            additional_context=request.additional_context or "None provided",
            resources_text=resources_text,
            web_content=web_content or "None available.",
            doc_content=doc_content or "None selected.",
            curriculum_context=self._build_curriculum_context(request),
            first_nation_perspective=request.first_nation,
        )

        # Stream tokens directly from the LLM and collect for fixture saving
        collected: list[str] = []
        async for chunk in self.llm.astream(prompt):
            if chunk.text:
                collected.append(chunk.text)
                yield chunk.text

        # Write the full response to the fixture file for use in TEST_MODE
        _FIXTURE_PATH_STUDY_PLAN.write_text("".join(collected), encoding="utf-8")

    async def stream_quiz(self, request: GenerateRequest):
        """Yields quiz markdown tokens as they are generated."""
        if TEST_MODE:
            async for chunk in self._fixture_stream(type="quiz"):
                yield chunk
            return

        web_content = await self._fetch_web_content(request.selected_web_urls)
        doc_content = await self._fetch_doc_content(
            topic=request.topic,
            document_ids=request.selected_document_ids
        )

        resources_text = "\n".join([
            f"- [{r.title}]({r.url or 'teacher upload'}): {r.summary}"
            for r in request.selected_resources
        ])

        prompt = PromptService.quiz_generation_prompt(
            grade=request.grade,
            subject=request.subject,
            state=request.state,
            topic=request.topic,
            additional_context=request.additional_context or "None provided",
            resources_text=resources_text,
            web_content=web_content or "None available.",
            doc_content=doc_content or "None selected.",
            curriculum_context=self._build_curriculum_context(request),
            level=request.level,
            first_nation_perspective=request.first_nation,
        )

        # Stream tokens directly from the LLM and collect for fixture saving
        collected: list[str] = []
        async for chunk in self.llm.astream(prompt):
            if chunk.text:
                collected.append(chunk.text)
                yield chunk.text

        # Write the full response to the fixture file for use in TEST_MODE
        _FIXTURE_PATH_QUIZ_PLAN.write_text("".join(collected), encoding="utf-8")

    async def stream_activities(self, request: GenerateRequest):
        """Yields activities markdown tokens as they are generated."""
        if TEST_MODE:
            async for chunk in self._fixture_stream(type="activities"):
                yield chunk
            return

        web_content = await self._fetch_web_content(request.selected_web_urls)
        doc_content = await self._fetch_doc_content(
            topic=request.topic,
            document_ids=request.selected_document_ids
        )

        resources_text = "\n".join([
            f"- [{r.title}]({r.url or 'teacher upload'}): {r.summary}"
            for r in request.selected_resources
        ])

        prompt = PromptService.activities_generation_prompt(
            grade=request.grade,
            subject=request.subject,
            state=request.state,
            topic=request.topic,
            additional_context=request.additional_context or "None provided",
            resources_text=resources_text,
            web_content=web_content or "None available.",
            doc_content=doc_content or "None selected.",
            curriculum_context=self._build_curriculum_context(request),
            level=request.level,
            first_nation_perspective=request.first_nation,
        )

        # Stream tokens directly from the LLM and collect for fixture saving
        collected: list[str] = []
        async for chunk in self.llm.astream(prompt):
            if chunk.text:
                collected.append(chunk.text)
                yield chunk.text

        # Write the full response to the fixture file for use in TEST_MODE
        _FIXTURE_PATH_ACTIVITIES.write_text("".join(collected), encoding="utf-8")

    async def stream_keywords(self, request: GenerateRequest):
        """Yields keywords markdown tokens as they are generated."""
        if TEST_MODE:
            async for chunk in self._fixture_stream(type="keywords"):
                yield chunk
            return

        web_content = await self._fetch_web_content(request.selected_web_urls)
        doc_content = await self._fetch_doc_content(
            topic=request.topic,
            document_ids=request.selected_document_ids
        )

        resources_text = "\n".join([
            f"- [{r.title}]({r.url or 'teacher upload'}): {r.summary}"
            for r in request.selected_resources
        ])

        prompt = PromptService.keywords_generation_prompt(
            grade=request.grade,
            subject=request.subject,
            state=request.state,
            topic=request.topic,
            additional_context=request.additional_context or "None provided",
            resources_text=resources_text,
            web_content=web_content or "None available.",
            doc_content=doc_content or "None selected.",
            curriculum_context=self._build_curriculum_context(request),
            first_nation_perspective=request.first_nation,
        )

        # Stream tokens directly from the LLM and collect for fixture saving
        collected: list[str] = []
        async for chunk in self.llm.astream(prompt):
            if chunk.text:
                collected.append(chunk.text)
                yield chunk.text

        # Write the full response to the fixture file for use in TEST_MODE
        _FIXTURE_PATH_KEYWORDS.write_text("".join(collected), encoding="utf-8")

    async def _fixture_stream(self, type="study_plan"):
        """Streams the saved markdown fixture in small chunks to simulate LLM output."""
        content = ""
        if type == "study_plan":
            content = _FIXTURE_PATH_STUDY_PLAN.read_text(encoding="utf-8")
        elif type == "quiz":
            content = _FIXTURE_PATH_QUIZ_PLAN.read_text(encoding="utf-8")
        elif type == "activities":
            content = _FIXTURE_PATH_ACTIVITIES.read_text(encoding="utf-8")
        elif type == "keywords":
            content = _FIXTURE_PATH_KEYWORDS.read_text(encoding="utf-8")

        for i in range(0, len(content), _CHUNK_SIZE):
            yield content[i : i + _CHUNK_SIZE]
            await asyncio.sleep(0.02)  # light delay so the frontend sees real streaming

    async def _fetch_web_content(self, urls: list[str]) -> str:
        """Scrapes text content from the provided web URLs."""
        if not urls:
            return ""
        
        sections = []
        for url in urls:
            try:
                pages = WebBaseLoader(url).load()
                if pages:
                    sections.append(
                        f"SOURCE: {url}\n\n"
                        + pages[0].page_content.strip()[:2000]
                    )
            except Exception as e:
                print(f"⚠️ Failed to load {url}: {e}")
        
        return "\n\n---\n\n".join(sections)
    
    async def _fetch_doc_content(self, topic: str, document_ids: list[str]) -> str:
        """Retrieves text content from specified teacher documents via RAG."""
        if not document_ids:
            return ""

        docs = self.rag.retrieve_by_ids(
            query=topic,
            document_ids=document_ids
        )

        return "\n\n---\n\n".join([
            f"DOCUMENT: {d.metadata.get('filename')}\n\n{d.page_content}"
            for d in docs
        ])