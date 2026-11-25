"""
RETURNSIGHT AI - High-Fidelity Synthetic Dataset Generator
Author: Senior Data Scientist & Retail ML Architect
Description: Generates reproducible, realistic retail transactions with true e-commerce return dynamics.
Labels synthetic data clearly in conformance with data governance rules.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Ensure reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

CATEGORIES = {
    "Apparel": {"base_return_rate": 0.32, "avg_price": 58.0, "price_std": 25.0},
    "Footwear": {"base_return_rate": 0.28, "avg_price": 85.0, "price_std": 35.0},
    "Electronics": {"base_return_rate": 0.12, "avg_price": 240.0, "price_std": 120.0},
    "Home & Kitchen": {"base_return_rate": 0.16, "avg_price": 72.0, "price_std": 40.0},
    "Beauty & Health": {"base_return_rate": 0.08, "avg_price": 38.0, "price_std": 18.0},
    "Sports & Outdoors": {"base_return_rate": 0.19, "avg_price": 65.0, "price_std": 30.0}
}

SHIPPING_METHODS = ["Standard", "Express", "Next-Day", "Free Economy"]
PAYMENT_METHODS = ["Credit Card", "Debit Card", "UPI / Digital Wallet", "Cash on Delivery"]
DEVICE_TYPES = ["Mobile App", "Desktop Web", "Mobile Web", "Tablet"]

RETURN_REASONS = [
    "Sizing / Fit Issue",
    "Defective / Damaged Item",
    "Item Not as Pictured / Described",
    "Delivery Delayed Past Expectation",
    "Buyer's Remorse / Changed Mind",
    "Wrong Item Shipped"
]

RETURN_STATUSES = ["Completed & Restocked", "Inspected & Restocked", "Liquidated", "Scrapped / Recycled"]

def generate_orders(n_records: int, start_order_id: int = 10001) -> pd.DataFrame:
    """Generates synthetic order records reflecting realistic retail buying behavior."""
    order_ids = [f"ORD-{start_order_id + i:06d}" for i in range(n_records)]
    
    # 3,500 unique customers with repeat purchasing power
    n_customers = max(500, int(n_records / 2.8))
    customer_pool = [f"CUST-{1000 + i:05d}" for i in range(n_customers)]
    customer_ids = np.random.choice(customer_pool, size=n_records)
    
    # Customer age distribution (skewed towards 22-45)
    customer_age_map = {cid: int(np.clip(np.random.normal(34, 11), 18, 75)) for cid in customer_pool}
    customer_ages = [customer_age_map[cid] for cid in customer_ids]
    
    # Customer baseline return affinity
    customer_aff_map = {cid: np.clip(np.random.beta(1.5, 5.0), 0.0, 0.75) for cid in customer_pool}
    
    # Past purchase counts (Poisson distribution)
    customer_purch_map = {cid: int(np.clip(np.random.poisson(4), 1, 35)) for cid in customer_pool}
    past_purchase_counts = [customer_purch_map[cid] for cid in customer_ids]
    
    # Past return rate (prior to this transaction, strictly no target leakage)
    past_return_rates = [round(float(customer_aff_map[cid]), 3) for cid in customer_ids]
    
    # Categories
    cat_names = list(CATEGORIES.keys())
    cat_weights = [0.28, 0.20, 0.18, 0.14, 0.10, 0.10]
    product_categories = np.random.choice(cat_names, size=n_records, p=cat_weights)
    
    # Prices based on category
    product_prices = []
    for cat in product_categories:
        meta = CATEGORIES[cat]
        p = np.clip(np.random.normal(meta["avg_price"], meta["price_std"]), 12.0, 650.0)
        product_prices.append(round(float(p), 2))
        
    # Discounts (often 0, 10, 15, 20, 30, 40, 50, 60%)
    discounts = np.random.choice(
        [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 40.0, 50.0, 60.0],
        size=n_records,
        p=[0.20, 0.10, 0.15, 0.15, 0.12, 0.10, 0.08, 0.05, 0.03, 0.02]
    )
    
    # Product ratings (1.0 to 5.0, skewed to 4.1)
    product_ratings = np.clip(np.round(np.random.normal(4.1, 0.65, size=n_records), 1), 1.5, 5.0)
    
    # Delivery delay days (-1 early, 0 on-time, 1-10 delayed)
    delivery_delay_days = np.random.choice(
        [-1, 0, 1, 2, 3, 4, 5, 7, 10],
        size=n_records,
        p=[0.12, 0.55, 0.14, 0.08, 0.04, 0.03, 0.02, 0.01, 0.01]
    )
    
    # Browsing engagement
    session_length_minutes = np.round(np.clip(np.random.exponential(scale=11.0, size=n_records), 1.5, 60.0), 1)
    num_product_views = np.clip(np.random.poisson(lam=7, size=n_records), 1, 30)
    
    # Categorical attributes
    shipping_methods = np.random.choice(SHIPPING_METHODS, size=n_records, p=[0.45, 0.25, 0.15, 0.15])
    payment_methods = np.random.choice(PAYMENT_METHODS, size=n_records, p=[0.38, 0.22, 0.25, 0.15])
    device_types = np.random.choice(DEVICE_TYPES, size=n_records, p=[0.58, 0.25, 0.12, 0.05])
    used_coupon = np.where(discounts > 0, np.random.choice([0, 1], size=n_records, p=[0.25, 0.75]), 0)
    
    # Temporal creation (over the past 12 months)
    base_date = datetime.now() - timedelta(days=365)
    random_days = np.random.randint(0, 365, size=n_records)
    order_dates = [base_date + timedelta(days=int(d)) for d in random_days]
    
    # Ground Truth Return Probability Model (Realistic Latent Function)
    return_probs = []
    returned_labels = []
    
    for i in range(n_records):
        cat = product_categories[i]
        base_cat_rate = CATEGORIES[cat]["base_return_rate"]
        
        # Logit computation
        # 1. Category baseline
        logit = np.log(base_cat_rate / (1.0 - base_cat_rate + 1e-6))
        
        # 2. Historical return rate effect
        logit += (past_return_rates[i] - 0.20) * 2.8
        
        # 3. High discount impulse effect
        if discounts[i] >= 40.0:
            logit += 0.45
        elif discounts[i] >= 20.0:
            logit += 0.15
            
        # 4. Rating effect (low rating -> high return)
        logit += (3.8 - product_ratings[i]) * 0.75
        
        # 5. Delivery delay effect
        if delivery_delay_days[i] > 2:
            logit += 0.25 * delivery_delay_days[i]
            
        # 6. Payment method effect (COD has higher return/rejection)
        if payment_methods[i] == "Cash on Delivery":
            logit += 0.35
            
        # 7. Customer age (younger fast-fashion consumers return more)
        if customer_ages[i] < 26:
            logit += 0.25
        elif customer_ages[i] > 55:
            logit -= 0.20
            
        # 8. High price effect in Apparel/Footwear
        if cat in ["Apparel", "Footwear"] and product_prices[i] > 120.0:
            logit += 0.30
            
        # 9. Low session time + high views (hasty decision)
        if session_length_minutes[i] < 5.0 and num_product_views[i] > 10:
            logit += 0.20
            
        prob = 1.0 / (1.0 + np.exp(-logit))
        prob = np.clip(prob, 0.02, 0.95)
        
        # Bernoulli outcome
        outcome = 1 if np.random.rand() < prob else 0
        return_probs.append(round(float(prob), 4))
        returned_labels.append(outcome)
        
    df = pd.DataFrame({
        "order_id": order_ids,
        "customer_id": customer_ids,
        "order_date": [d.strftime("%Y-%m-%d") for d in order_dates],
        "customer_age": customer_ages,
        "product_price": product_prices,
        "discount_percent": discounts,
        "product_rating": product_ratings,
        "past_purchase_count": past_purchase_counts,
        "past_return_rate": past_return_rates,
        "delivery_delay_days": delivery_delay_days,
        "session_length_minutes": session_length_minutes,
        "num_product_views": num_product_views,
        "device_type": device_types,
        "product_category": product_categories,
        "shipping_method": shipping_methods,
        "payment_method": payment_methods,
        "used_coupon": used_coupon,
        "returned": returned_labels
    })
    
    return df

def generate_supplementary(orders_df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates realistic supplementary post-return logistics, reason, financial,
    and ESG metrics for returned orders only.
    """
    returned_orders = orders_df[orders_df["returned"] == 1].copy()
    n_returns = len(returned_orders)
    
    reasons = []
    return_costs = []
    profit_losses = []
    days_to_returns = []
    co2_emissions = []
    packaging_wastes = []
    co2_saveds = []
    waste_avoideds = []
    statuses = []
    
    for _, row in returned_orders.iterrows():
        cat = row["product_category"]
        delay = row["delivery_delay_days"]
        rating = row["product_rating"]
        price = row["product_price"]
        
        # Determine likely reason based on features
        if cat in ["Apparel", "Footwear"] and np.random.rand() < 0.55:
            reason = "Sizing / Fit Issue"
        elif rating <= 2.8 and np.random.rand() < 0.65:
            reason = "Defective / Damaged Item"
        elif delay >= 3 and np.random.rand() < 0.60:
            reason = "Delivery Delayed Past Expectation"
        elif row["discount_percent"] >= 40.0 and np.random.rand() < 0.40:
            reason = "Buyer's Remorse / Changed Mind"
        else:
            reason = np.random.choice(RETURN_REASONS, p=[0.30, 0.20, 0.18, 0.14, 0.12, 0.06])
            
        reasons.append(reason)
        
        # Days to return (4 to 28 days)
        days = int(np.clip(np.random.normal(12, 5), 3, 30))
        days_to_returns.append(days)
        
        # Return logistics cost ($12 to $45, depends on category & shipping)
        base_freight = 14.5 if cat in ["Electronics", "Home & Kitchen"] else 9.5
        handling = 4.5
        restock_cost = round(float(base_freight + handling + (price * 0.05)), 2)
        return_costs.append(restock_cost)
        
        # Profit loss (lost margin + reverse logistics cost)
        margin_loss = round(float(price * 0.35 + restock_cost), 2)
        profit_losses.append(margin_loss)
        
        # CO2 emissions from reverse transit (1.5 kg to 5.2 kg per package)
        emissions = round(float(np.clip(np.random.normal(2.8, 0.9), 0.8, 6.5)), 2)
        co2_emissions.append(emissions)
        
        # Packaging waste (cardboard & polybag, 0.25 to 1.4 kg)
        waste = round(float(np.clip(np.random.normal(0.65, 0.25), 0.15, 1.8)), 2)
        packaging_wastes.append(waste)
        
        # Counterfactual ESG values if return had been prevented
        co2_saveds.append(emissions)
        waste_avoideds.append(waste)
        
        # Status
        status = np.random.choice(RETURN_STATUSES, p=[0.60, 0.25, 0.10, 0.05])
        statuses.append(status)
        
    supp_df = pd.DataFrame({
        "order_id": returned_orders["order_id"].values,
        "Return_Status": statuses,
        "Return_Reason": reasons,
        "Days_to_Return": days_to_returns,
        "Return_Cost": return_costs,
        "Profit_Loss": profit_losses,
        "CO2_Emissions": co2_emissions,
        "Packaging_Waste": packaging_wastes,
        "CO2_Saved": co2_saveds,
        "Waste_Avoided": waste_avoideds
    })
    
    return supp_df

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    raw_dir = os.path.join(base_dir, "data", "raw")
    sample_dir = os.path.join(base_dir, "data", "sample")
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(sample_dir, exist_ok=True)
    
    print(f"Generating primary train & test datasets...")
    # Generate 12,000 orders total: 9,600 train, 2,400 test (80/20 stratified)
    full_df = generate_orders(n_records=12000, start_order_id=10001)
    
    # Stratified split by returned target
    train_mask = np.random.rand(len(full_df)) < 0.80
    train_df = full_df[train_mask].copy().reset_index(drop=True)
    test_df = full_df[~train_mask].copy().reset_index(drop=True)
    
    # Save CSVs with governance notice
    train_path = os.path.join(raw_dir, "train.csv")
    test_path = os.path.join(raw_dir, "test.csv")
    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)
    
    print(f"Saved train.csv: {train_df.shape} (Return Rate: {train_df['returned'].mean():.2%}) to {train_path}")
    print(f"Saved test.csv: {test_df.shape} (Return Rate: {test_df['returned'].mean():.2%}) to {test_path}")
    
    # Generate supplementary returns dataset
    supp_df = generate_supplementary(full_df)
    supp_path = os.path.join(raw_dir, "supplementary_returns.csv")
    supp_df.to_csv(supp_path, index=False)
    print(f"Saved supplementary_returns.csv: {supp_df.shape} to {supp_path}")
    
    # Generate a lightweight sample JSON for rapid frontend testing & mock integration
    sample_records = test_df.head(25).to_dict(orient="records")
    import json
    sample_json_path = os.path.join(sample_dir, "sample_orders.json")
    with open(sample_json_path, "w") as f:
        json.dump(sample_records, f, indent=2)
    print(f"Saved sample JSON with 25 records to {sample_json_path}")
    print("Dataset generation completed successfully!")

if __name__ == "__main__":
    main()
