import psycopg2
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.discover import router as discover_router
from api.generate import router as generate_router
from api.upload import router as upload_router
from api.suggestions import router as suggestions_router
from dotenv import load_dotenv

load_dotenv()

# Suppress LangChain / Tavily Search warning
os.environ.setdefault("USER_AGENT", "Drona-AI-FastAPI")

DATABASE_URL = os.getenv("DATABASE_URL")
connection = psycopg2.connect(DATABASE_URL)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(discover_router)
app.include_router(generate_router)
app.include_router(upload_router)
app.include_router(suggestions_router)
