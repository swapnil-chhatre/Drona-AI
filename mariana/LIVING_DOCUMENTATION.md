# Living Documentation

This document explains the flow of the FastAPI application and how functions are connected to each other.

## System Entry Point
- **`main.py`**: Initializes the FastAPI app, connects to the database, sets up CORS middleware, and includes the routers (`discover_router` and `generate_router`).

## API Flow & Services

### 1. Discover Flow (`/api/discover`)
This flow finds educational resources using web search and retrieved teacher documents.

- **`api/discover.py` -> `discover()`**: Handles the GET request. Initializes `DiscoverRequest` and calls `DiscoveryService.search()`.
- **`services/discovery_service.py` -> `search(request)`**: Combines the request into a search query and invokes the LangChain agent.
  - **`search_teacher_documents(query)`** (Agent Tool): Calls `RagService.retrieve(query)` to find uploaded teacher documents.
  - **`search_web_resources(query)`** (Agent Tool): Uses TavilySearch to find web educational resources.
- **`services/rag_service.py` -> `retrieve(query)`**: Retrieves document chunks from the PGVector database.

### 2. Generate Flow (`/api/generate`)
This flow generates a detailed markdown study plan based on selected resources.

- **`api/generate.py` -> `generate(request)`**: Handles the POST request. Calls `PlanService.generate(request)`.
- **`services/plan_service.py` -> `generate(request)`**: Orchestrates the study plan generation by fetching content and invoking the LLM.
  - **`_fetch_web_content(urls)`**: Scrapes the content from the selected web URLs using `WebBaseLoader`.
  - **`_fetch_doc_content(topic, document_ids)`**: Calls `RagService.retrieve_by_ids()` to fetch chunks of the specific teacher documents.
  - **`_generate_plan(request, web_content, doc_content)`**: Constructs the prompt with all content and invokes the LLM (`LLMService`) to generate the final `StudyPlan`.

### 3. Core Services

- **`services/llm_service.py` -> `LLMService.get()`**: Factory function to instantiate the `ChatGoogleGenerativeAI` model.
- **`services/rag_service.py`**:
  - `__init__()`: Connects to PGVector with `GoogleGenerativeAIEmbeddings`.
  - `retrieve(query)`: Fetches top 5 document chunks for a general search.
  - `retrieve_by_ids(query, document_ids)`: Fetches top 5 document chunks filtered by specific document IDs.
- **`services/agent_service.py`**:
  - `__init__()`: Initializes generic agents.
  - `_get_weather()`: Tool to mock weather retrieval.
  - `get_weather(user_message)`: Invokes an agent to fetch the weather.
