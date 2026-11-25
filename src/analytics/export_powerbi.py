"""
RETURNSIGHT AI - Power BI Star Schema Data Exporter
Author: Senior Business Intelligence Consultant & Data Architect
Description: Generates clean, Kimball-standard Star Schema Fact and Dimension tables
for Power BI connectivity, precomputing model predictions and join keys.
"""

import os
import joblib
import pandas as pd
import numpy as np

from src.data.data_loader import DataLoader

def export_powerbi_star_schema():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    export_dir = os.path.join(base_dir, "powerbi", "exports")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(export_dir, exist_ok=True)
    
    loader = DataLoader()
    train_df, test_df = loader.load_primary_data()
    all_orders = pd.concat([train_df, test_df], ignore_index=True)
    supp_df = loader.load_supplementary_data()
    
    # Load champion ML model
    model_path = os.path.join(models_dir, "best_return_predictor.joblib")
    champion_pipe = joblib.load(model_path) if os.path.exists(model_path) else None
    
    print("Generating Power BI Dimension Tables...")
    
    # 1. DimCategory
    categories = sorted(all_orders["product_category"].unique())
    dim_category = pd.DataFrame({
        "CategoryID": range(1, len(categories) + 1),
        "CategoryName": categories,
        "RiskTier": ["High Risk" if c in ["Apparel", "Footwear"] else "Low-Medium Risk" for c in categories]
    })
    cat_id_map = dict(zip(dim_category["CategoryName"], dim_category["CategoryID"]))
    dim_category.to_csv(os.path.join(export_dir, "DimCategory.csv"), index=False)
    
    # 2. DimShipping
    shippings = sorted(all_orders["shipping_method"].unique())
    dim_shipping = pd.DataFrame({
        "ShippingID": range(1, len(shippings) + 1),
        "ShippingMethod": shippings,
        "SLA_TargetDays": [1 if "Next" in s else 2 if "Express" in s else 4 if "Standard" in s else 6 for s in shippings]
    })
    ship_id_map = dict(zip(dim_shipping["ShippingMethod"], dim_shipping["ShippingID"]))
    dim_shipping.to_csv(os.path.join(export_dir, "DimShipping.csv"), index=False)
    
    # 3. DimPayment
    payments = sorted(all_orders["payment_method"].unique())
    dim_payment = pd.DataFrame({
        "PaymentID": range(1, len(payments) + 1),
        "PaymentMethod": payments,
        "IsDoorstepPayment": [1 if "Cash" in p else 0 for p in payments]
    })
    pay_id_map = dict(zip(dim_payment["PaymentMethod"], dim_payment["PaymentID"]))
    dim_payment.to_csv(os.path.join(export_dir, "DimPayment.csv"), index=False)
    
    # 4. DimCustomer (Non-identifying analytical attributes)
    cust_unique = all_orders.groupby("customer_id").agg({
        "customer_age": "first",
        "past_purchase_count": "max",
        "past_return_rate": "mean"
    }).reset_index()
    
    # Age group binning
    def age_group(age):
        if age < 25: return "18-24 (Gen Z)"
        elif age < 35: return "25-34 (Millennials)"
        elif age < 50: return "35-49 (Gen X)"
        else: return "50+ (Boomers)"
        
    cust_unique["AgeGroup"] = cust_unique["customer_age"].apply(age_group)
    
    # Merge customer segment if lookup exists
    lookup_path = os.path.join(models_dir, "customer_cluster_lookup.csv")
    if os.path.exists(lookup_path):
        cluster_df = pd.read_csv(lookup_path)
        cust_unique = pd.merge(cust_unique, cluster_df[["customer_id", "cluster"]], on="customer_id", how="left")
        cust_unique["CustomerSegmentID"] = cust_unique["cluster"].fillna(0).astype(int)
        cust_unique.drop(columns=["cluster"], inplace=True)
    else:
        cust_unique["CustomerSegmentID"] = 0
        
    dim_customer = cust_unique.rename(columns={
        "customer_id": "CustomerID",
        "customer_age": "CustomerAge",
        "past_purchase_count": "PastPurchaseCount",
        "past_return_rate": "PastReturnRate"
    })
    dim_customer.to_csv(os.path.join(export_dir, "DimCustomer.csv"), index=False)
    
    # 5. DimDate
    order_dates = pd.to_datetime(all_orders["order_date"])
    date_range = pd.date_range(start=order_dates.min(), end=order_dates.max(), freq="D")
    dim_date = pd.DataFrame({
        "DateKey": [int(d.strftime("%Y%m%d")) for d in date_range],
        "FullDate": [d.strftime("%Y-%m-%d") for d in date_range],
        "Year": [d.year for d in date_range],
        "Quarter": [f"Q{d.quarter}" for d in date_range],
        "Month": [d.month for d in date_range],
        "MonthName": [d.strftime("%B") for d in date_range],
        "MonthYear": [d.strftime("%b %Y") for d in date_range],
        "DayOfWeek": [d.strftime("%A") for d in date_range],
        "IsWeekend": [1 if d.weekday() >= 5 else 0 for d in date_range]
    })
    dim_date.to_csv(os.path.join(export_dir, "DimDate.csv"), index=False)
    
    print("Generating Power BI Fact Tables...")
    
    # 6. FactOrders
    all_orders["DateKey"] = pd.to_datetime(all_orders["order_date"]).dt.strftime("%Y%m%d").astype(int)
    all_orders["CategoryID"] = all_orders["product_category"].map(cat_id_map)
    all_orders["ShippingID"] = all_orders["shipping_method"].map(ship_id_map)
    all_orders["PaymentID"] = all_orders["payment_method"].map(pay_id_map)
    
    fact_orders = all_orders[[
        "order_id", "DateKey", "customer_id", "CategoryID", "ShippingID", "PaymentID",
        "product_price", "discount_percent", "product_rating", "delivery_delay_days",
        "session_length_minutes", "num_product_views", "used_coupon", "returned"
    ]].rename(columns={
        "order_id": "OrderID",
        "customer_id": "CustomerID",
        "product_price": "ProductPrice",
        "discount_percent": "DiscountPercent",
        "product_rating": "ProductRating",
        "delivery_delay_days": "DeliveryDelayDays",
        "session_length_minutes": "SessionLengthMinutes",
        "num_product_views": "NumProductViews",
        "used_coupon": "UsedCoupon",
        "returned": "ActualReturned"
    })
    fact_orders.to_csv(os.path.join(export_dir, "FactOrders.csv"), index=False)
    
    # 7. FactPredictions (Batch Model Inferences)
    if champion_pipe is not None:
        print("Computing batch predictions for FactPredictions...")
        probs = champion_pipe.predict_proba(all_orders)[:, 1]
    else:
        probs = np.full(len(all_orders), 0.27)
        
    risk_categories = []
    for p in probs:
        if p >= 0.45: risk_categories.append("High Risk")
        elif p >= 0.25: risk_categories.append("Medium Risk")
        else: risk_categories.append("Low Risk")
        
    fact_predictions = pd.DataFrame({
        "OrderID": all_orders["order_id"],
        "PredictedProbability": np.round(probs, 4),
        "RiskCategory": risk_categories,
        "IsPredictedReturn": (probs >= 0.35).astype(int),
        "ModelVersion": "v1.0.0-logistic-tuned"
    })
    fact_predictions.to_csv(os.path.join(export_dir, "FactPredictions.csv"), index=False)
    
    # 8. FactReturns (Only for verified returns)
    if not supp_df.empty:
        fact_returns = supp_df[[
            "order_id", "Return_Status", "Return_Reason", "Days_to_Return"
        ]].rename(columns={
            "order_id": "OrderID",
            "Return_Status": "ReturnStatus",
            "Return_Reason": "ReturnReason",
            "Days_to_Return": "DaysToReturn"
        })
        fact_returns.to_csv(os.path.join(export_dir, "FactReturns.csv"), index=False)
        
        # 9. FactReturnCosts & Sustainability
        fact_costs = supp_df[[
            "order_id", "Return_Cost", "Profit_Loss", "CO2_Emissions", "Packaging_Waste", "CO2_Saved", "Waste_Avoided"
        ]].rename(columns={
            "order_id": "OrderID",
            "Return_Cost": "ReturnCost",
            "Profit_Loss": "NetProfitLoss",
            "CO2_Emissions": "CO2EmissionsKg",
            "Packaging_Waste": "PackagingWasteKg",
            "CO2_Saved": "CO2SavedKg",
            "Waste_Avoided": "WasteAvoidedKg"
        })
        fact_costs.to_csv(os.path.join(export_dir, "FactReturnCosts.csv"), index=False)
        
    print(f"All Power BI Star Schema tables exported successfully to: {export_dir}")

if __name__ == "__main__":
    export_powerbi_star_schema()
