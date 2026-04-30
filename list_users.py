import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.fheyzfbclowanxzowhuo:Chiru8790879@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

async def test():
    engine = create_async_engine(DATABASE_URL, connect_args={"statement_cache_size": 0})
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT email FROM users"))
        print("Users:", res.fetchall())

asyncio.run(test())
