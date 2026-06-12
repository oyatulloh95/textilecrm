from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

import models
import schemas
from database import engine, get_db, Base

# Create tables on startup (demo-level; production would use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TextileCRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=schemas.HealthOut, tags=["system"])
def health_check():
    """Used by the AWS ALB target group health checks."""
    return {"status": "ok", "service": "textilecrm-backend"}


# ===================== CUSTOMERS =====================
@app.get("/customers", response_model=List[schemas.CustomerOut], tags=["customers"])
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()


@app.post("/customers", response_model=schemas.CustomerOut, status_code=201, tags=["customers"])
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@app.get("/customers/{customer_id}", response_model=schemas.CustomerOut, tags=["customers"])
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.put("/customers/{customer_id}", response_model=schemas.CustomerOut, tags=["customers"])
def update_customer(customer_id: int, payload: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in payload.model_dump().items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer


@app.delete("/customers/{customer_id}", status_code=204, tags=["customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return None


# ===================== PRODUCTS =====================
@app.get("/products", response_model=List[schemas.ProductOut], tags=["products"])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@app.post("/products", response_model=schemas.ProductOut, status_code=201, tags=["products"])
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Product).filter(models.Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.get("/products/{product_id}", response_model=schemas.ProductOut, tags=["products"])
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/products/{product_id}", response_model=schemas.ProductOut, tags=["products"])
def update_product(product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in payload.model_dump().items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@app.delete("/products/{product_id}", status_code=204, tags=["products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None


# ===================== ORDERS =====================
@app.get("/orders", response_model=List[schemas.OrderOut], tags=["orders"])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()


@app.post("/orders", response_model=schemas.OrderOut, status_code=201, tags=["orders"])
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    total = sum(item.quantity * item.unit_price for item in payload.items)
    order = models.Order(customer_id=payload.customer_id, status=payload.status, total_amount=total)
    db.add(order)
    db.flush()  # get order.id before adding items

    for item in payload.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock_qty < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.id}")
        product.stock_qty -= item.quantity

        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)
    return order


@app.get("/orders/{order_id}", response_model=schemas.OrderOut, tags=["orders"])
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.put("/orders/{order_id}", response_model=schemas.OrderOut, tags=["orders"])
def update_order_status(order_id: int, payload: schemas.OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@app.delete("/orders/{order_id}", status_code=204, tags=["orders"])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return None


# ===================== DASHBOARD (for load-test demo) =====================
@app.get("/dashboard/summary", tags=["dashboard"])
def dashboard_summary(db: Session = Depends(get_db)):
    customers_count = db.query(func.count(models.Customer.id)).scalar()
    products_count = db.query(func.count(models.Product.id)).scalar()
    orders_count = db.query(func.count(models.Order.id)).scalar()
    revenue = db.query(func.coalesce(func.sum(models.Order.total_amount), 0)).scalar()
    return {
        "customers": customers_count,
        "products": products_count,
        "orders": orders_count,
        "revenue": float(revenue),
    }
