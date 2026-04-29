from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

settings = get_settings()

# statement_cache_size=0 is required when connecting via Supabase pgbouncer
# in transaction/statement pool mode — otherwise asyncpg raises
# DuplicatePreparedStatementError on reconnect.
engine = create_async_engine(
    settings["DATABASE_URL"],
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,
    connect_args={"statement_cache_size": 0, "server_settings": {"jit": "off"}},
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
