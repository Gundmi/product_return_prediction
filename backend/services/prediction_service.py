"""
RETURNSIGHT AI - Prediction & Simulation Service
Author: Senior ML Engineer
Description: Interfaces with trained ML model pipelines, SHAP explainers, and database models.
"""

import os
import json
from datetime import datetime
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any

from backend.schemas.prediction_schema import (
    OrderInput, PredictionResponse, FactorAttribution,
    PreventiveRecommendation, SimulationRequest, SimulationResponse
)
from src.explainability.shap_explainer import ReturnSightExplainer

class PredictionService:
    def __init__(self):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        model_path = os.path.join(base_dir, "models", "best_return_predictor.joblib")
        if os.path.exists(model_path):
            self.pipeline = joblib.load(model_path)
        else:
            self.pipeline = None
            
        self.explainer = ReturnSightExplainer(model_pipeline=self.pipeline)
        self.decision_threshold = 0.35  # Cost-optimized business threshold
        self.model_version = "v1.0.0-logistic-tuned"

    def predict_single(self, order: OrderInput, db=None) -> PredictionResponse:
        order_dict = order.model_dump()
        df = pd.DataFrame([order_dict])
        
        if self.pipeline is not None:
            prob = float(self.pipeline.predict_proba(df)[0, 1])
        else:
            # Fallback baseline
            prob = 0.27
            
        prob = round(prob, 4)
        
        if prob >= 0.45:
            risk_category = "High Risk"
        elif prob >= 0.25:
            risk_category = "Medium Risk"
        else:
            risk_category = "Low Risk"
            
        is_return = 1 if prob >= self.decision_threshold else 0
        
        # Explainability
        explanation = self.explainer.explain_order(order_dict, prob)
        
        factors = [
            FactorAttribution(**f) for f in explanation["top_risk_drivers"]
        ]
        recs = [
            PreventiveRecommendation(**r) for r in explanation["preventive_recommendations"]
        ]
        
        # Optional DB persistence
        resolved_order_id = order.order_id
        if not resolved_order_id or resolved_order_id == "ORD-PRED-SAMPLE":
            resolved_order_id = f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S%f')[:18]}"

        if db is not None and hasattr(db, "add"):
            from backend.database.models import OrderEntity, PredictionEntity
            try:
                existing_order = db.query(OrderEntity).filter(OrderEntity.order_id == resolved_order_id).first()
                if not existing_order:
                    order_record = OrderEntity(
                        order_id=resolved_order_id,
                        customer_id=order.customer_id or "CUST-ECOM",
                        order_date=datetime.utcnow().strftime("%Y-%m-%d"),
                        customer_age=order.customer_age,
                        product_price=order.product_price,
                        discount_percent=order.discount_percent,
                        product_rating=order.product_rating,
                        past_purchase_count=order.past_purchase_count,
                        past_return_rate=order.past_return_rate,
                        delivery_delay_days=order.delivery_delay_days,
                        session_length_minutes=order.session_length_minutes,
                        num_product_views=order.num_product_views,
                        device_type=order.device_type,
                        product_category=order.product_category,
                        shipping_method=order.shipping_method,
                        payment_method=order.payment_method,
                        used_coupon=order.used_coupon,
                    )
                    db.add(order_record)

                pred_record = PredictionEntity(
                    order_id=resolved_order_id,
                    predicted_probability=prob,
                    risk_category=risk_category,
                    decision_threshold=self.decision_threshold,
                    model_version=self.model_version,
                    top_factor_1=factors[0].feature if factors else "N/A",
                    top_factor_2=factors[1].feature if len(factors) > 1 else "N/A",
                    explanation_json=json.dumps(explanation)
                )
                db.add(pred_record)
                db.commit()
            except Exception as e:
                if hasattr(db, "rollback"):
                    db.rollback()
                
        return PredictionResponse(
            order_id=resolved_order_id,
            return_probability=prob,
            risk_category=risk_category,
            decision_threshold=self.decision_threshold,
            is_predicted_return=is_return,
            model_version=self.model_version,
            timestamp=datetime.utcnow().isoformat() + "Z",
            top_factors=factors,
            recommendations=recs,
            explanation_disclaimer=explanation["disclaimer"]
        )

    def simulate(self, req: SimulationRequest) -> SimulationResponse:
        """Simulates what-if scenarios by altering controllable business variables."""
        # Baseline prediction
        base_resp = self.predict_single(req.base_order)
        base_prob = base_resp.return_probability
        
        # Create altered order
        sim_data = req.base_order.model_dump()
        if req.simulated_discount_percent is not None:
            sim_data["discount_percent"] = req.simulated_discount_percent
        if req.simulated_delivery_delay_days is not None:
            sim_data["delivery_delay_days"] = req.simulated_delivery_delay_days
        if req.simulated_product_rating is not None:
            sim_data["product_rating"] = req.simulated_product_rating
        if req.simulated_shipping_method is not None:
            sim_data["shipping_method"] = req.simulated_shipping_method
            
        sim_order = OrderInput(**sim_data)
        sim_resp = self.predict_single(sim_order)
        sim_prob = sim_resp.return_probability
        
        delta = round(sim_prob - base_prob, 4)
        if delta < -0.01:
            direction = "REDUCED"
            rec_text = f"Simulated changes mitigate return risk by {abs(delta)*100:.1f} percentage points. Recommended for operational adoption."
        elif delta > 0.01:
            direction = "INCREASED"
            rec_text = f"Warning: Simulated scenario increases return probability by {delta*100:.1f} percentage points."
        else:
            direction = "UNCHANGED"
            rec_text = "Simulated modifications show negligible shift in predicted return likelihood."
            
        # Estimated cost avoidance: average return cost ($24.50) * delta
        cost_avoidance = round(max(0.0, -delta * 24.50 * 10), 2)  # Per 10-order cohort
        
        return SimulationResponse(
            original_probability=base_prob,
            original_risk_category=base_resp.risk_category,
            simulated_probability=sim_prob,
            simulated_risk_category=sim_resp.risk_category,
            probability_delta=delta,
            risk_direction=direction,
            estimated_cost_avoidance_usd=cost_avoidance,
            recommendation=rec_text
        )

prediction_service = PredictionService()
