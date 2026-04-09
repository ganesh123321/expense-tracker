from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.transaction import Transaction

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Transaction).where(Transaction.user_id == current_user.id))
    transactions = result.scalars().all()
    return transactions

@router.post("/", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    transaction_in: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    transaction = Transaction(
        user_id=current_user.id,
        text=transaction_in.text,
        amount=transaction_in.amount,
        category=transaction_in.category,
        date=transaction_in.date
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)
    return transaction

@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == current_user.id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    await db.delete(transaction)
    await db.flush()
