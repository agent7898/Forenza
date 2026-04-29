from db.database import SessionLocal
from db.models import User
from sqlalchemy import select
import uuid


async def get_user_by_email(email: str):
    async with SessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()


async def get_user_by_id(user_id: str):
    async with SessionLocal() as session:
        result = await session.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        return result.scalar_one_or_none()


async def create_user(email: str, hashed_password: str, role: str = "officer"):
    async with SessionLocal() as session:
        user = User(email=email, hashed_password=hashed_password, role=role)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user