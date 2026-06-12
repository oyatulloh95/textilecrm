from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    company = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(150), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    orders = relationship("Order", back_populates="customer", cascade="all, delete")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    fabric_type = Column(String(100), nullable=True)
    price = Column(Float, nullable=False, default=0)
    stock_qty = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String(30), nullable=False, default="pending")
    total_amount = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
