from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import register, login, logout, me
from db.database import engine
from db.models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (no-op if they already exist)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Dispose connection pool on shutdown
    await engine.dispose()


app = FastAPI(
    title="Auth Microservice",
    description="JWT authentication for the Forensic Facial Reconstruction System",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the main backend (port 8000) and any local dev origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all auth routes
app.include_router(register.router)
app.include_router(login.router)
app.include_router(logout.router)
app.include_router(me.router)


@app.get("/")
def root():
    return {"message": "Auth service running", "docs": "/docs"}