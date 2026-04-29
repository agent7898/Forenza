from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth_proxy, export, generate, history, nlp, refine, sessions
from app.db.database import engine
from app.db.models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup (no-op if they already exist)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="ForensicAI Backend",
    description=(
        "Main backend for the Forensic Facial Reconstruction System. "
        "Proxies auth calls to the auth microservice on :8002, "
        "orchestrates ML service calls on :8001, and manages sessions/audit logs."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [sessions, generate, refine, nlp, export, history, auth_proxy]:
    app.include_router(router.router, prefix="/api")
