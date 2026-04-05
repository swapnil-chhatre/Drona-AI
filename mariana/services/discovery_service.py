import json
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_tavily import TavilySearch
from langchain.agents.structured_output import ToolStrategy
from models.requests import DiscoverRequest


from models.resource import ResourceList
from services.llm_service import LLMService
from services.rag_service import RagService

class DiscoveryService:

    def __init__(self) -> None:
        self.rag = RagService()
        self.llm = LLMService.get()
        
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
                    f"document_id: {d.id}\n"          # ← PGVector chunk ID
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
            Use specific queries like 'Year 10 NSW History WWI primary sources'."""
            results = tavily.invoke(query)
            return json.dumps(results)
       

        self.agent = create_agent(
            model=self.llm,
            tools=[search_web_resources, search_teacher_documents],
            system_prompt=self._build_system_prompt(),
            response_format=ToolStrategy(ResourceList)
        )

    def _build_system_prompt(self) -> str:
        return """You are an expert educational resource finder for Australian K-12 teachers.
Your job is to find high-quality, curriculum-aligned resources for the given grade, subject,
state, and topic. Always search BOTH web and teacher documents.

- Web results → set source_type to "web", include the real URL and domain
- Teacher document results (marked TEACHER_DOCUMENT) → you MUST include these as 
  resources with source_type set to "teacher_upload", url set to null, 
  domain set to "teacher_upload", and use the filename as the title.
  Do NOT skip teacher documents. Every TEACHER_DOCUMENT result must appear 
  in your final resource list.

When evaluating resources:
- Prefer .edu.au, abc.net.au, australiancurriculum.edu.au, and government sources
- Flag any resource with potential bias, outdated content, or inappropriate reading level
- Check curriculum alignment against Australian state standards
- Consider Australian context — prefer resources with local examples, First Nations
  perspectives where relevant, and Australian historical/cultural references

Always run at least 7-10 different search queries to get broad coverage.
Return structured results with honest quality assessments."""


    def search(self, request: DiscoverRequest) -> ResourceList:
        location_specific_query = (
            f"Find educational resources for {request.grade} {request.subject} "
            f"students in {request.state}, Australia. Topic: {request.topic}. "
            f"Focus on Australian curriculum alignment and age-appropriate content."
        )
        general_query = (
            f"Find educational resources for {request.grade} in {request.subject} "
            f"Topic: {request.topic}. "
            f"Focus on age-appropriate content. "
            f"Find resources which build a students understanding from first principles."
        )
        combined_query = location_specific_query + " " + general_query
        result : ResourceList = self.agent.invoke({"messages": [HumanMessage(content=combined_query)]})["structured_response"]
        return result