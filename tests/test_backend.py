"""
RETURNSIGHT AI - Comprehensive Test Suite
Author: Senior QA & Test Automation Architect
Description: Unit, integration, and endpoint tests for data pipelines, feature engineering,
model inference, SHAP explainers, database operations, and REST API route handlers.
"""

import pytest
import numpy as np
import pandas as pd

from src.data.data_loader import DataLoader
from src.features.feature_pipeline import build_preprocessor
from backend.services.prediction_service import prediction_service
from backend.schemas.prediction_schema import OrderInput, SimulationRequest
from backend.routes.api import (
    get_health, get_dashboard_overview, get_return_analytics,
    get_category_analytics, get_customer_segments, get_financial_impact,
    get_sustainability_impact, predict_return_risk, simulate_scenario,
    get_model_metrics, get_global_explanations, get_business_alerts, get_data_quality
)

# --- 1. DATA PIPELINE TESTS ---

def test_data_loading():
    loader = DataLoader()
    train_df, test_df = loader.load_primary_data()
    assert not train_df.empty, "train.csv should not be empty"
    assert not test_df.empty, "test.csv should not be empty"
    assert "returned" in train_df.columns, "target 'returned' must be in train dataset"
    assert "returned" in test_df.columns, "target 'returned' must be in test dataset"

def test_supplementary_data_loading():
    loader = DataLoader()
    supp_df = loader.load_supplementary_data()
    assert not supp_df.empty, "supplementary_returns.csv should not be empty"
    assert "Return_Cost" in supp_df.columns
    assert "CO2_Emissions" in supp_df.columns

# --- 2. FEATURE ENGINEERING & PREPROCESSING TESTS ---

def test_feature_pipeline_transformation():
    loader = DataLoader()
    train_df, _ = loader.load_primary_data()
    pipeline = build_preprocessor()
    X_trans = pipeline.fit_transform(train_df.head(50))
    assert X_trans.shape[0] == 50, "Transformed rows must match input batch size"
    assert X_trans.shape[1] > 20, "Engineered features should expand representation"
    assert not np.isnan(X_trans).any(), "Preprocessed matrix must have zero NaN values"

# --- 3. MODEL INFERENCE & SERVICE TESTS ---

def test_model_pipeline_loaded():
    assert prediction_service.pipeline is not None, "Champion model pipeline must be loaded"

def test_single_prediction_valid():
    order = OrderInput(
        order_id="TEST-001",
        customer_age=28,
        product_price=89.0,
        discount_percent=35.0,
        product_rating=3.1,
        past_purchase_count=2,
        past_return_rate=0.38,
        delivery_delay_days=3,
        session_length_minutes=6.5,
        num_product_views=12,
        device_type="Mobile App",
        product_category="Apparel",
        shipping_method="Standard",
        payment_method="Cash on Delivery",
        used_coupon=1
    )
    resp = prediction_service.predict_single(order)
    assert 0.0 <= resp.return_probability <= 1.0, "Probability must be bounded between 0 and 1"
    assert resp.risk_category in ["Low Risk", "Medium Risk", "High Risk"]
    assert len(resp.top_factors) > 0, "SHAP top factors must be populated"
    assert len(resp.recommendations) > 0, "Preventive recommendations must be provided"

def test_simulation_scenario():
    base = OrderInput(
        order_id="TEST-SIM-001",
        product_category="Apparel",
        discount_percent=50.0,
        delivery_delay_days=4,
        product_rating=2.8
    )
    req = SimulationRequest(
        base_order=base,
        simulated_discount_percent=15.0,
        simulated_delivery_delay_days=0,
        simulated_product_rating=4.5
    )
    sim_res = prediction_service.simulate(req)
    assert sim_res.simulated_probability < sim_res.original_probability, "Mitigating delay and discount should lower return probability"
    assert sim_res.risk_direction == "REDUCED"
    assert sim_res.estimated_cost_avoidance_usd >= 0.0

# --- 4. FASTAPI ROUTE HANDLER TESTS ---

def test_route_health():
    res = get_health()
    assert res["status"] == "healthy"
    assert res["model_loaded"] is True

def test_route_dashboard_overview():
    res = get_dashboard_overview()
    assert "kpis" in res
    assert "total_orders" in res["kpis"]
    assert res["kpis"]["total_orders"] > 0
    assert "monthly_trend" in res

def test_route_return_analytics():
    res = get_return_analytics()
    assert "return_reasons" in res
    assert "delay_impact" in res
    assert "discount_impact" in res

def test_route_category_analytics():
    res = get_category_analytics()
    assert "categories" in res
    assert len(res["categories"]) > 0

def test_route_customer_segments():
    res = get_customer_segments()
    assert "profiles" in res
    assert len(res["profiles"]) == 5

def test_route_financial_impact():
    res = get_financial_impact()
    assert "total_logistics_cost" in res
    assert res["total_logistics_cost"] > 0

def test_route_sustainability_impact():
    res = get_sustainability_impact()
    assert "total_co2_kg" in res
    assert res["total_co2_kg"] > 0

def test_route_predict():
    order = OrderInput(
        order_id="API-TEST-99",
        customer_age=30,
        product_price=50.0,
        discount_percent=10.0,
        product_rating=4.5,
        past_purchase_count=5,
        past_return_rate=0.15,
        delivery_delay_days=0,
        session_length_minutes=15.0,
        num_product_views=4,
        device_type="Desktop Web",
        product_category="Electronics",
        shipping_method="Express",
        payment_method="Credit Card",
        used_coupon=0
    )
    res = predict_return_risk(order)
    assert res.return_probability >= 0.0
    assert res.risk_category in ["Low Risk", "Medium Risk", "High Risk"]

def test_route_model_metrics():
    res = get_model_metrics()
    assert "champion_model" in res
    assert "benchmarks" in res

def test_route_alerts():
    res = get_business_alerts()
    assert "alerts" in res
    assert len(res["alerts"]) > 0

def test_route_data_quality():
    res = get_data_quality()
    assert res["schema_integrity"] == "PASS"
    assert "train" in res["datasets"]
