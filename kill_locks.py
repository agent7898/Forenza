import asyncio
import asyncpg

DATABASE_URL = "postgresql://postgres.fheyzfbclowanxzowhuo:Chiru8790879@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

async def fix():
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute("""
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
          AND state IN ('idle in transaction', 'active')
          AND query NOT LIKE '%pg_stat_activity%';
    """)
    print("Locks cleared!")
    await conn.close()

asyncio.run(fix())
