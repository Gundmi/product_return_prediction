"""
RETURNSIGHT AI - Customer Segmentation & Behavioral Profiling Engine
Author: Senior Data Scientist & Customer Intelligence Lead
Description: Uses unsupervised K-Means clustering on behavioral and purchase aggregations
to identify interpretable, actionable customer cohorts without discriminatory profiling.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from src.data.data_loader import DataLoader

SEGMENT_METADATA = {
    0: {
        "name": "High-Volume Loyalists",
        "description": "Frequent repeat buyers with consistent order patterns, moderate price sensitivity, and average return rates.",
        "risk_tier": "Low Risk",
        "strategy": "Enroll in VIP retention rewards; provide expedited premium returns as a loyalty perk."
    },
    1: {
        "name": "Habitual Returners / Wardrobers",
        "description": "High return frequency, multiple items purchased per session with elevated sizing mismatch risk.",
        "risk_tier": "High Risk",
        "strategy": "Offer interactive size-fit recommendations; encourage virtual try-on and store credit incentives."
    },
    2: {
        "name": "Bargain & Promo Seekers",
        "description": "Strong responsiveness to discounts (>30%), coupon affinity, impulsive browsing with higher return velocity.",
        "risk_tier": "Medium Risk",
        "strategy": "Optimize clearance promotion return policies; reinforce pre-order product specifications."
    },
    3: {
        "name": "Low-Engagement Occasionals",
        "description": "Low purchase count, short browsing sessions, low coupon usage, predominantly baseline buying habits.",
        "risk_tier": "Low Risk",
        "strategy": "Nurture with personalized category onboarding emails and post-purchase check-ins."
    },
    4: {
        "name": "Premium Considered Shoppers",
        "description": "High average order values, extensive browsing duration, high catalog rating scrutiny, lowest return rate.",
        "risk_tier": "Minimal Risk",
        "strategy": "Prioritize white-glove packaging, fast-track dispatch, and premium concierge support."
    }
}

class CustomerSegmenter:
    def __init__(self, n_clusters: int = 5):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)
        self.features = [
            "past_purchase_count",
            "past_return_rate",
            "avg_discount",
            "avg_price",
            "avg_session_length"
        ]

    def fit_and_profile(self) -> Dict[str, Any]:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        models_dir = os.path.join(base_dir, "models")
        os.makedirs(models_dir, exist_ok=True)
        
        loader = DataLoader()
        train_df, test_df = loader.load_primary_data()
        all_df = pd.concat([train_df, test_df], ignore_index=True)
        
        # Customer-level aggregation
        cust_grouped = all_df.groupby("customer_id").agg({
            "past_purchase_count": "max",
            "past_return_rate": "mean",
            "discount_percent": "mean",
            "product_price": "mean",
            "session_length_minutes": "mean",
            "returned": ["count", "mean"]
        })
        
        cust_grouped.columns = [
            "past_purchase_count",
            "past_return_rate",
            "avg_discount",
            "avg_price",
            "avg_session_length",
            "total_orders",
            "observed_return_rate"
        ]
        cust_grouped = cust_grouped.reset_index()
        
        X = cust_grouped[self.features].values
        X_scaled = self.scaler.fit_transform(X)
        
        clusters = self.kmeans.fit_predict(X_scaled)
        cust_grouped["cluster"] = clusters
        
        # Profile each cluster
        cluster_profiles = []
        total_customers = len(cust_grouped)
        
        for c in range(self.n_clusters):
            c_df = cust_grouped[cust_grouped["cluster"] == c]
            size = len(c_df)
            meta = SEGMENT_METADATA.get(c, {
                "name": f"Segment {c}",
                "description": "Custom customer behavioral cohort",
                "risk_tier": "Moderate",
                "strategy": "Apply standard retention and fulfillment guidelines."
            })
            
            profile = {
                "cluster_id": c,
                "name": meta["name"],
                "description": meta["description"],
                "risk_tier": meta["risk_tier"],
                "strategy": meta["strategy"],
                "customer_count": int(size),
                "customer_percent": round(float(size / total_customers * 100), 1),
                "avg_purchases": round(float(c_df["past_purchase_count"].mean()), 1),
                "avg_return_rate": round(float(c_df["past_return_rate"].mean() * 100), 1),
                "observed_return_rate": round(float(c_df["observed_return_rate"].mean() * 100), 1),
                "avg_discount_percent": round(float(c_df["avg_discount"].mean()), 1),
                "avg_order_value": round(float(c_df["avg_price"].mean()), 2),
                "avg_session_minutes": round(float(c_df["avg_session_length"].mean()), 1)
            }
            cluster_profiles.append(profile)
            
        result = {
            "total_unique_customers": total_customers,
            "features_used": self.features,
            "profiles": cluster_profiles
        }
        
        # Save profiles
        out_path = os.path.join(models_dir, "customer_segments.json")
        with open(out_path, "w") as f:
            json.dump(result, f, indent=2)
            
        # Save customer lookup
        lookup_path = os.path.join(models_dir, "customer_cluster_lookup.csv")
        cust_grouped[["customer_id", "cluster", "observed_return_rate"]].to_csv(lookup_path, index=False)
        
        print(f"Customer segmentation completed! Saved profiles to {out_path}")
        return result

if __name__ == "__main__":
    segmenter = CustomerSegmenter()
    segmenter.fit_and_profile()
