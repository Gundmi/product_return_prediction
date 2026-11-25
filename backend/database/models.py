"""
RETURNSIGHT AI - Relational Database Schema & ORM Models
Author: Senior Software Architect
Description: Defines Orders, Predictions, Alerts, and Model Registry tables.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from backend.database.db import Base

class OrderEntity(Base):
    __tablename__ = "orders"

    order_id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), index=True)
    order_date = Column(String(32))
    customer_age = Column(Integer)
    product_price = Column(Float)
    discount_percent = Column(Float)
    product_rating = Column(Float)
    past_purchase_count = Column(Integer)
    past_return_rate = Column(Float)
    delivery_delay_days = Column(Integer)
    session_length_minutes = Column(Float)
    num_product_views = Column(Integer)
    device_type = Column(String(32))
    product_category = Column(String(64))
    shipping_method = Column(String(64))
    payment_method = Column(String(64))
    used_coupon = Column(Integer)
    actual_returned = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictionEntity(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), index=True)
    predicted_probability = Column(Float, nullable=False)
    risk_category = Column(String(32), nullable=False)
    decision_threshold = Column(Float, default=0.35)
    model_version = Column(String(64), default="v1.0.0-enterprise")
    top_factor_1 = Column(String(128))
    top_factor_2 = Column(String(128))
    explanation_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class AlertEntity(Base):
    __tablename__ = "business_alerts"

    id = Column(String(32), primary_key=True)
    severity = Column(String(16))  # CRITICAL, HIGH, MEDIUM, INFO
    category = Column(String(64))
    title = Column(String(255))
    description = Column(Text)
    action_recommended = Column(Text)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelMetadataEntity(Base):
    __tablename__ = "model_registry"

    version = Column(String(64), primary_key=True)
    algorithm = Column(String(128))
    validation_roc_auc = Column(Float)
    validation_f1 = Column(Float)
    optimal_threshold = Column(Float)
    trained_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
