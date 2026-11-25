"""
RETURNSIGHT AI - Pydantic Request & Response Schemas
Author: Senior Software Architect
Description: Strict validation schemas for prediction requests, batch operations,
what-if simulations, and SHAP explanations.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class OrderInput(BaseModel):
    order_id: Optional[str] = Field(default="ORD-PRED-SAMPLE", description="Unique order reference")
    customer_id: Optional[str] = Field(default="CUST-SAMPLE", description="Customer reference")
    customer_age: int = Field(ge=18, le=100, default=32, description="Age of customer")
    product_price: float = Field(ge=1.0, le=5000.0, default=65.0, description="Product retail price in USD")
    discount_percent: float = Field(ge=0.0, le=90.0, default=15.0, description="Promotional discount applied")
    product_rating: float = Field(ge=1.0, le=5.0, default=4.2, description="Product catalog average star rating")
    past_purchase_count: int = Field(ge=0, le=200, default=4, description="Count of past completed orders")
    past_return_rate: float = Field(ge=0.0, le=1.0, default=0.20, description="Customer historical return rate")
    delivery_delay_days: int = Field(ge=-2, le=30, default=0, description="Estimated transit delay past SLA")
    session_length_minutes: float = Field(ge=0.1, le=120.0, default=12.5, description="Browsing session duration")
    num_product_views: int = Field(ge=1, le=100, default=6, description="Number of product pages viewed")
    device_type: str = Field(default="Mobile App", description="Device type: Mobile App, Desktop Web, Mobile Web, Tablet")
    product_category: str = Field(default="Apparel", description="Category: Apparel, Footwear, Electronics, Home & Kitchen, Beauty & Health, Sports & Outdoors")
    shipping_method: str = Field(default="Standard", description="Shipping: Standard, Express, Next-Day, Free Economy")
    payment_method: str = Field(default="Credit Card", description="Payment: Credit Card, Debit Card, UPI / Digital Wallet, Cash on Delivery")
    used_coupon: int = Field(ge=0, le=1, default=1, description="1 if coupon applied, 0 otherwise")

class FactorAttribution(BaseModel):
    feature: str
    feature_key: str
    value: str
    impact: float
    direction: str
    importance: float

class PreventiveRecommendation(BaseModel):
    action_title: str
    priority: str
    department: str
    description: str
    potential_return_reduction: str

class PredictionResponse(BaseModel):
    order_id: str
    return_probability: float
    risk_category: str  # Low Risk, Medium Risk, High Risk
    decision_threshold: float
    is_predicted_return: int
    model_version: str
    timestamp: str
    top_factors: List[FactorAttribution]
    recommendations: List[PreventiveRecommendation]
    explanation_disclaimer: str

class BatchPredictionRequest(BaseModel):
    orders: List[OrderInput]

class BatchPredictionResponse(BaseModel):
    total_processed: int
    high_risk_count: int
    predictions: List[PredictionResponse]

class SimulationRequest(BaseModel):
    base_order: OrderInput
    simulated_discount_percent: Optional[float] = None
    simulated_delivery_delay_days: Optional[int] = None
    simulated_product_rating: Optional[float] = None
    simulated_shipping_method: Optional[str] = None

class SimulationResponse(BaseModel):
    original_probability: float
    original_risk_category: str
    simulated_probability: float
    simulated_risk_category: str
    probability_delta: float
    risk_direction: str  # "REDUCED", "INCREASED", "UNCHANGED"
    estimated_cost_avoidance_usd: float
    recommendation: str
