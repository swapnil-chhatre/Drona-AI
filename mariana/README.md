# Hackathon Project

A RAG-powered app with an Angular frontend and FastAPI backend.

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/)
- [Python 3.11+](https://www.python.org/downloads/)
- [uv](https://astral.sh/uv)

---

## Frontend

```bash
cd everest
npm install
ng serve
```

Runs at `http://localhost:4200`

---

## Backend

```bash
cd mariana
uv sync
uv run fastapi dev app/main.py
```

Runs at `http://localhost:8000`

---

## Running Both

Open two terminals:

```bash
# Terminal 1
cd mariana && uv run fastapi dev app/main.py

# Terminal 2
cd everest && ng serve
```