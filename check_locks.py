import asyncio
import asyncpg

DATABASE_URL = "postgresql://postgres.fheyzfbclowanxzowhuo:Chiru8790879@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

async def check():
    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch("""
        SELECT pid, state, wait_event_type, wait_event, query
        FROM pg_stat_activity
        WHERE wait_event IS NOT NULL AND pid <> pg_backend_pid();
    """)
    for r in rows:
        print(dict(r))
    await conn.close()

asyncio.run(check())
