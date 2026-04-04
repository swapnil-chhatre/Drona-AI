from langchain_core.messages import AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from dataclasses import dataclass

from services.llm_service import LLMService


class AgentService:

    # We use a dataclass here, but Pydantic models are also supported.
    @dataclass
    class ResponseFormat:
        """Response schema for the agent."""
        # Any interesting information about the weather if available
        city: str | None = None
        weather_conditions: str | None = None

    def __init__(self):
        llm = LLMService.get()
        
        self.agent = create_agent(model=llm, tools=[self._get_weather()], response_format=ToolStrategy(self.ResponseFormat))
        self.grounded_agent = create_agent(model=llm, tools=[{"google_search": {}}]) 

        

    def _get_weather(self):
        @tool
        def get_weather(city: str, current_weather: str) -> str:
            """Get weather for a given city."""
            return f"The weather in {city} is {current_weather} !"
        return get_weather

    async def get_weather(self, user_message: str):
        response : AIMessage = self.grounded_agent.invoke( {"messages":[{"role":"user", "content":user_message}]})['messages'][-1]
        return str(response.content)

