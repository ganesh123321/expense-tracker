import asyncio
from app.db.database import AsyncSessionLocal, engine, Base
from app.models.user import User
from app.models.transaction import Transaction
from datetime import date
from sqlalchemy import select

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Create user if not exists
        user = User(email="test@example.com", hashed_password="pwd", full_name="Test")
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Add transaction
        trans = Transaction(
            user_id=user.id,
            text="Test",
            amount=100.0,
            category="Food",
            date=date.today()
        )
        db.add(trans)
        await db.flush()
        await db.refresh(trans)
        await db.commit()
        
        print("Transaction added:", trans.id)

if __name__ == "__main__":
    asyncio.run(main())
