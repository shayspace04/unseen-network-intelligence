"""
UNSEEN Network Intelligence Platform - Backend API Engine
"Because an average cannot tell the whole story."
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .app.api.routes import router, orchestrator
from .app.db.database import init_db, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes SQLite database and seeds default investigation scenarios on startup."""
    init_db()
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) as c FROM investigations").fetchone()["c"]
        if count == 0:
            print("[UNSEEN] Seeding benchmark scenario investigations into SQLite...")
            for s_id in ["dhcp-starvation", "wifi-degradation", "shared-link-congestion", "dns-resolver-silent-drop"]:
                try:
                    orchestrator.run_investigation(scenario_id=s_id)
                except Exception as e:
                    print(f"[UNSEEN] Seeding error for {s_id}: {e}")
    yield

app = FastAPI(
    title="UNSEEN Agentic Intelligence Engine API",
    description="Agentic network intelligence and fault investigation platform backend",
    version="1.0.0",
    lifespan=lifespan
)

# Configurable CORS origins supporting local dev, custom domains, and Vercel deployments
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

if cors_origins_env:
    for origin in cors_origins_env.split(","):
        cleaned = origin.strip()
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

if "*" in allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    reload_enabled = os.environ.get("ENVIRONMENT", "development").lower() != "production"
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload_enabled)
