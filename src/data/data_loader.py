"""
RETURNSIGHT AI - Data Loading and Quality Inspection Service
Author: Senior Data Scientist
Description: Loads, inspects, validates, and profile datasets. Generates data dictionary and quality report.
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

class DataLoader:
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            data_dir = os.path.join(base_dir, "data", "raw")
        self.data_dir = data_dir

    def load_primary_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        train_path = os.path.join(self.data_dir, "train.csv")
        test_path = os.path.join(self.data_dir, "test.csv")
        if not os.path.exists(train_path) or not os.path.exists(test_path):
            raise FileNotFoundError(f"Datasets not found in {self.data_dir}. Run generate_dataset.py first.")
        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)
        return train_df, test_df

    def load_supplementary_data(self) -> pd.DataFrame:
        supp_path = os.path.join(self.data_dir, "supplementary_returns.csv")
        if not os.path.exists(supp_path):
            return pd.DataFrame()
        return pd.read_csv(supp_path)

    def inspect_dataset(self, df: pd.DataFrame, dataset_name: str = "Dataset") -> Dict[str, Any]:
        """Generates comprehensive descriptive profile and quality metrics."""
        n_rows, n_cols = df.shape
        missing = df.isnull().sum().to_dict()
        duplicates = int(df.duplicated().sum())
        
        col_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object"]).columns.tolist()
        
        num_summary = {}
        for col in numeric_cols:
            num_summary[col] = {
                "mean": round(float(df[col].mean()), 2),
                "std": round(float(df[col].std()), 2),
                "min": round(float(df[col].min()), 2),
                "q25": round(float(df[col].quantile(0.25)), 2),
                "median": round(float(df[col].median()), 2),
                "q75": round(float(df[col].quantile(0.75)), 2),
                "max": round(float(df[col].max()), 2),
            }
            
        cat_summary = {}
        for col in categorical_cols:
            cat_summary[col] = {
                "n_unique": int(df[col].nunique()),
                "top_value": str(df[col].mode().iloc[0]) if not df[col].empty else "",
                "top_freq": int(df[col].value_counts().iloc[0]) if not df[col].empty else 0
            }
            
        target_dist = {}
        if "returned" in df.columns:
            vc = df["returned"].value_counts(normalize=True).to_dict()
            counts = df["returned"].value_counts().to_dict()
            target_dist = {
                "not_returned_count": int(counts.get(0, 0)),
                "returned_count": int(counts.get(1, 0)),
                "return_rate": round(float(vc.get(1, 0.0)), 4),
                "class_ratio": f"1:{round(float(counts.get(0, 1) / max(1, counts.get(1, 1))), 2)}"
            }
            
        return {
            "name": dataset_name,
            "rows": n_rows,
            "columns": n_cols,
            "column_types": col_types,
            "missing_values": missing,
            "duplicates": duplicates,
            "numeric_summary": num_summary,
            "categorical_summary": cat_summary,
            "target_distribution": target_dist
        }

if __name__ == "__main__":
    loader = DataLoader()
    train, test = loader.load_primary_data()
    supp = loader.load_supplementary_data()
    print("Train inspection:", loader.inspect_dataset(train, "Train Data")["target_distribution"])
    print("Test inspection:", loader.inspect_dataset(test, "Test Data")["target_distribution"])
    print("Supplementary records:", len(supp))
