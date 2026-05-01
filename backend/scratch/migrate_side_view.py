import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.fheyzfbclowanxzowhuo:Chiru8790879@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

async def add_col():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS side_image_url VARCHAR(2048)"))
    print("Column 'side_image_url' added successfully.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_col())
