import asyncio
import os
import psycopg2
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

_REQUEST_TIMEOUT = 180.0  # seconds

@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    try:
        return await asyncio.wait_for(call_next(request), timeout=_REQUEST_TIMEOUT)
    except asyncio.TimeoutError:
        print(f"⚠️ Request timed out: {request.method} {request.url.path}")
        return JSONResponse({"detail": "Request timed out"}, status_code=504)

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(discover_router)
app.include_router(generate_router)
app.include_router(upload_router)
app.include_router(suggestions_router)
app.include_router(pdf_router)
