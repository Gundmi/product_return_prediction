"""
RETURNSIGHT AI - Feature Engineering & Preprocessing Pipeline
Author: Senior Machine Learning Engineer
Description: Builds robust, leak-free feature transformations and Scikit-Learn ColumnTransformer pipeline.
"""

import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

class RetailFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Engineers domain-specific retail features strictly from pre-order / transaction attributes.
    Zero target leakage.
    """
    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        
        # 1. Historical Return Risk Group
        # Handle zero or low history
        if "past_return_rate" in X.columns:
            def categorize_return_risk(rate):
                if rate <= 0.10:
                    return "Low Historical Risk"
                elif rate <= 0.25:
                    return "Moderate Historical Risk"
                elif rate <= 0.40:
                    return "High Historical Risk"
                else:
                    return "Severe Historical Risk"
            X["return_risk_group"] = X["past_return_rate"].apply(categorize_return_risk)
        else:
            X["return_risk_group"] = "Moderate Historical Risk"
            
        # 2. Discount Band
        if "discount_percent" in X.columns:
            def categorize_discount(disc):
                if disc <= 0.0:
                    return "No Discount"
                elif disc <= 15.0:
                    return "Low Discount"
                elif disc <= 30.0:
                    return "Moderate Discount"
                else:
                    return "Heavy Discount"
            X["discount_band"] = X["discount_percent"].apply(categorize_discount)
        else:
            X["discount_band"] = "No Discount"
            
        # 3. Delivery Delay Category
        if "delivery_delay_days" in X.columns:
            def categorize_delay(d):
                if d <= 0:
                    return "On-Time / Early"
                elif d <= 2:
                    return "Minor Delay"
                elif d <= 4:
                    return "Moderate Delay"
                else:
                    return "Critical Delay"
            X["delay_category"] = X["delivery_delay_days"].apply(categorize_delay)
        else:
            X["delay_category"] = "On-Time / Early"
            
        # 4. Customer Engagement Group (Session time per view)
        if "session_length_minutes" in X.columns and "num_product_views" in X.columns:
            # views per minute
            views_per_min = X["num_product_views"] / (X["session_length_minutes"] + 0.1)
            def categorize_engagement(vpm):
                if vpm > 2.5:
                    return "Rapid Impulse Browsing"
                elif vpm > 0.8:
                    return "Active Evaluation"
                else:
                    return "Deliberate Considered"
            X["engagement_type"] = views_per_min.apply(categorize_engagement)
        else:
            X["engagement_type"] = "Active Evaluation"
            
        # 5. Price Band
        if "product_price" in X.columns:
            def categorize_price(price):
                if price <= 40.0:
                    return "Budget (<$40)"
                elif price <= 100.0:
                    return "Mid-Range ($40-$100)"
                elif price <= 250.0:
                    return "Premium ($100-$250)"
                else:
                    return "Luxury (>$250)"
            X["price_tier"] = X["product_price"].apply(categorize_price)
        else:
            X["price_tier"] = "Mid-Range ($40-$100)"
            
        return X

# Feature column definitions
NUMERIC_FEATURES = [
    "customer_age",
    "product_price",
    "discount_percent",
    "product_rating",
    "past_purchase_count",
    "past_return_rate",
    "delivery_delay_days",
    "session_length_minutes",
    "num_product_views",
    "used_coupon"
]

CATEGORICAL_FEATURES = [
    "device_type",
    "product_category",
    "shipping_method",
    "payment_method",
    "return_risk_group",
    "discount_band",
    "delay_category",
    "engagement_type",
    "price_tier"
]

def build_preprocessor() -> Pipeline:
    """Creates a full Scikit-learn ColumnTransformer pipeline for inference & training."""
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    col_preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    
    full_pipeline = Pipeline(steps=[
        ("engineer", RetailFeatureEngineer()),
        ("preprocessor", col_preprocessor)
    ])
    
    return full_pipeline

if __name__ == "__main__":
    from src.data.data_loader import DataLoader
    loader = DataLoader()
    train_df, _ = loader.load_primary_data()
    pipeline = build_preprocessor()
    X_trans = pipeline.fit_transform(train_df)
    print("Preprocessed shape:", X_trans.shape)
    print("Feature pipeline verified successfully!")
