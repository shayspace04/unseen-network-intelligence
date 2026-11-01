"""
UNSEEN Network Intelligence Platform - Backend API Engine
"Because an average cannot tell the whole story."
"""

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

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
