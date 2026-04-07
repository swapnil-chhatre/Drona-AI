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
        """Initializes weather and generic grounded agents."""
        llm = LLMService.get()
        
        self.agent = create_agent(
            model=llm, 
            tools=[self._get_weather_tool()], 
            response_format=ToolStrategy(self.ResponseFormat)
        )
        self.grounded_agent = create_agent(model=llm, tools=[{"google_search": {}}]) 

    def _get_weather_tool(self):
        """Defines the weather tool for the agent."""
        @tool
        def get_weather(city: str, current_weather: str) -> str:
            """Get weather for a given city."""
            return self._get_weather_logic(city, current_weather)
        return get_weather

    def _get_weather_logic(self, city: str, current_weather: str) -> str:
        """Returns the mock weather string for a given city."""
        return f"The weather in {city} is {current_weather} !"

    async def get_weather(self, user_message: str):
        """Invokes the grounded agent to process a weather-related user message."""
        response : AIMessage = self.grounded_agent.invoke( {"messages":[{"role":"user", "content":user_message}]})['messages'][-1]
        return str(response.content)
