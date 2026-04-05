import json
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from models.study_plan import StudyPlan
from models.requests import GenerateRequest
from langchain_community.document_loaders import WebBaseLoader

from services.llm_service import LLMService
from services.rag_service import RagService
from services.prompt_service import PromptService


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
        self.llm = LLMService.get(temperature=0.4)
        self.rag = RagService()

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
            timeline_weeks=request.timeline_weeks
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
            web_content= web_content or "None available.",
            doc_content= doc_content or "None selected.",
        )

        # Stream tokens directly from the LLM — no agent needed
        async for chunk in self.llm.astream(prompt):
            if chunk.text:
                yield chunk.text



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