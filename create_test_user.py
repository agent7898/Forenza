import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from passlib.context import CryptContext

DATABASE_URL = "postgresql+asyncpg://postgres.fheyzfbclowanxzowhuo:Chiru8790879@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test():
    engine = create_async_engine(DATABASE_URL, connect_args={"statement_cache_size": 0})
    pwd = pwd_context.hash("password123")
    async with engine.connect() as conn:
        await conn.execute(text("""
            INSERT INTO users (email, hashed_password, role, is_active)
            VALUES ('test@example.com', :pwd, 'officer', true)
            ON CONFLICT (email) DO UPDATE SET hashed_password = EXCLUDED.hashed_password
        """), {"pwd": pwd})
        await conn.commit()
        print("Test user test@example.com created with password 'password123'")

asyncio.run(test())
