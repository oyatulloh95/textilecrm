from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ---------- Customer ----------
class CustomerBase(BaseModel):
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Product ----------
class ProductBase(BaseModel):
    name: str
    sku: str
    fabric_type: Optional[str] = None
    price: float
    stock_qty: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Order Items ----------
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    unit_price: float


# ---------- Order ----------
class OrderCreate(BaseModel):
    customer_id: int
    status: str = "pending"
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: str


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    status: str
    total_amount: float
    created_at: datetime
    items: List[OrderItemOut] = []


class HealthOut(BaseModel):
    status: str
    service: str
