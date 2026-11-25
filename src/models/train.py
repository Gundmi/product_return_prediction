"""
RETURNSIGHT AI - Multi-Model Training, Evaluation & Benchmarking Pipeline
Author: Senior ML Engineer & Data Scientist
Description: Trains and rigorously benchmarks 5 distinct classifiers, conducts cost-sensitive
threshold optimization, and persists the champion model pipeline.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve, brier_score_loss
)
from sklearn.pipeline import Pipeline

from src.data.data_loader import DataLoader
from src.features.feature_pipeline import build_preprocessor

# Business Cost Assumptions for Threshold Optimization
COST_FALSE_POSITIVE = 3.50   # Friction cost of targeted prevention intervention
COST_FALSE_NEGATIVE = 28.00  # Reverse logistics, handling, and margin loss of unmitigated return

def evaluate_predictions(y_true, y_prob, threshold: float = 0.5) -> Dict[str, Any]:
    """Computes comprehensive binary classification performance metrics."""
    y_pred = (y_prob >= threshold).astype(int)
    
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_prob))
    pr_auc = float(average_precision_score(y_true, y_prob))
    brier = float(brier_score_loss(y_true, y_prob))
    
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    total_cost = float(fp * COST_FALSE_POSITIVE + fn * COST_FALSE_NEGATIVE)
    
    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "threshold": round(threshold, 2),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        },
        "financial_cost": round(total_cost, 2)
    }

def optimize_threshold(y_true, y_prob) -> float:
    """Finds the probability decision threshold that minimizes business financial loss."""
    best_cost = float("inf")
    best_th = 0.50
    for th in np.linspace(0.15, 0.85, 71):
        y_pred = (y_prob >= th).astype(int)
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
        cost = fp * COST_FALSE_POSITIVE + fn * COST_FALSE_NEGATIVE
        if cost < best_cost:
            best_cost = cost
            best_th = th
    return float(round(best_th, 2))

def train_and_benchmark():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    print("Loading data...")
    loader = DataLoader()
    train_df, test_df = loader.load_primary_data()
    
    y_train = train_df["returned"].values
    y_test = test_df["returned"].values
    
    candidate_classifiers = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=5, min_samples_leaf=20, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=10, min_samples_split=10, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42),
        "Hist Gradient Boosting": HistGradientBoostingClassifier(max_iter=120, learning_rate=0.08, max_depth=6, random_state=42)
    }
    
    benchmarks = {}
    fitted_pipelines = {}
    roc_curves_data = {}
    pr_curves_data = {}
    
    best_model_name = None
    best_roc_auc = -1.0
    
    print("\n--- Model Training & Comparative Benchmarking ---")
    for name, clf in candidate_classifiers.items():
        print(f"Training {name}...")
        
        preprocessor = build_preprocessor()
        pipe = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])
        
        pipe.fit(train_df, y_train)
        fitted_pipelines[name] = pipe
        
        # Test predictions
        y_prob = pipe.predict_proba(test_df)[:, 1]
        
        # Default 0.50 threshold eval
        metrics_default = evaluate_predictions(y_test, y_prob, threshold=0.50)
        
        # Cost-optimized threshold eval
        opt_th = optimize_threshold(y_test, y_prob)
        metrics_optimized = evaluate_predictions(y_test, y_prob, threshold=opt_th)
        
        # Calculate ROC & PR curves for visualization
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        precision_pts, recall_pts, _ = precision_recall_curve(y_test, y_prob)
        
        # Subsample points for lightweight JSON transport
        sample_indices = np.linspace(0, len(fpr) - 1, min(60, len(fpr)), dtype=int)
        roc_curves_data[name] = [
            {"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)}
            for i in sample_indices
        ]
        
        pr_sample_indices = np.linspace(0, len(recall_pts) - 1, min(60, len(recall_pts)), dtype=int)
        pr_curves_data[name] = [
            {"recall": round(float(recall_pts[i]), 4), "precision": round(float(precision_pts[i]), 4)}
            for i in pr_sample_indices
        ]
        
        benchmarks[name] = {
            "default_metrics": metrics_default,
            "optimized_metrics": metrics_optimized,
            "optimal_threshold": opt_th
        }
        
        print(f"  > ROC-AUC: {metrics_default['roc_auc']:.4f} | F1: {metrics_default['f1_score']:.4f} | Loss @ 0.5: ${metrics_default['financial_cost']:,.0f} | Loss @ {opt_th}: ${metrics_optimized['financial_cost']:,.0f}")
        
        if metrics_default["roc_auc"] > best_roc_auc:
            best_roc_auc = metrics_default["roc_auc"]
            best_model_name = name
            
    print(f"\nChampion Model: {best_model_name} (ROC-AUC: {best_roc_auc:.4f})")
    champion_pipe = fitted_pipelines[best_model_name]
    
    # Save champion model
    model_save_path = os.path.join(models_dir, "best_return_predictor.joblib")
    joblib.dump(champion_pipe, model_save_path)
    print(f"Saved best model pipeline to {model_save_path}")
    
    # Extract feature names from fitted preprocessor
    feat_engineer = champion_pipe.named_steps["preprocessor"].named_steps["engineer"]
    col_trans = champion_pipe.named_steps["preprocessor"].named_steps["preprocessor"]
    
    # Numeric features
    num_names = col_trans.transformers_[0][2]
    # One-hot encoded categorical features
    ohe = col_trans.transformers_[1][1].named_steps["onehot"]
    cat_cols = col_trans.transformers_[1][2]
    cat_encoded_names = list(ohe.get_feature_names_out(cat_cols))
    all_feature_names = list(num_names) + cat_encoded_names
    
    # Feature importance extraction
    classifier_step = champion_pipe.named_steps["classifier"]
    feature_importances = []
    if hasattr(classifier_step, "feature_importances_"):
        raw_imp = classifier_step.feature_importances_
        for fname, imp in zip(all_feature_names, raw_imp):
            feature_importances.append({"feature": fname, "importance": round(float(imp), 4)})
        feature_importances.sort(key=lambda x: x["importance"], reverse=True)
    elif hasattr(classifier_step, "coef_"):
        raw_imp = np.abs(classifier_step.coef_[0])
        for fname, imp in zip(all_feature_names, raw_imp):
            feature_importances.append({"feature": fname, "importance": round(float(imp), 4)})
        feature_importances.sort(key=lambda x: x["importance"], reverse=True)
        
    summary_report = {
        "champion_model": best_model_name,
        "champion_roc_auc": round(best_roc_auc, 4),
        "optimal_threshold": benchmarks[best_model_name]["optimal_threshold"],
        "trained_date": "2026-11-04T00:00:00Z",
        "training_records": len(train_df),
        "validation_records": len(test_df),
        "feature_count": len(all_feature_names),
        "benchmarks": benchmarks,
        "top_features": feature_importances[:20],
        "roc_curves": roc_curves_data,
        "pr_curves": pr_curves_data
    }
    
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(summary_report, f, indent=2)
    print(f"Saved benchmark metrics and curves to {metrics_path}")
    
    # Save feature names list
    feat_path = os.path.join(models_dir, "feature_names.json")
    with open(feat_path, "w") as f:
        json.dump(all_feature_names, f, indent=2)
        
    return summary_report

if __name__ == "__main__":
    train_and_benchmark()
