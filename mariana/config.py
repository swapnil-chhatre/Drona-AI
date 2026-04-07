import os
from dotenv import load_dotenv

load_dotenv()

# Set TEST_MODE=true in your .env to bypass all LLM/Tavily calls and
# return saved fixtures from data/fixtures/ instead.
TEST_MODE: bool = os.getenv("TEST_MODE", "false").lower() == "true"
