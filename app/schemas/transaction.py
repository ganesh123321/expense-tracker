from pydantic import BaseModel
from typing import Optional
from datetime import date

class TransactionBase(BaseModel):
    text: str
    amount: float
    category: str
    date: date

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    text: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[date] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}
