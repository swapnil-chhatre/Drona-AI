import os
import psycopg2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.discover import router as discover_router
from api.generate import router as generate_router
from api.upload import router as upload_router
from api.suggestions import router as suggestions_router
from api.pdf import router as pdf_router
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")
connection = psycopg2.connect(DATABASE_URL)

# ALLOWED_ORIGINS env var is a comma-separated list of allowed origins.
# Set it in Railway to your Vercel URL, e.g.:
#   ALLOWED_ORIGINS=https://your-app.vercel.app
# Multiple origins: ALLOWED_ORIGINS=https://your-app.vercel.app,https://staging.vercel.app
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:4200")
allowed_origins = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(discover_router)
app.include_router(generate_router)
app.include_router(upload_router)
app.include_router(suggestions_router)
app.include_router(pdf_router)
