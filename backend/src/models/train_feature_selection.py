import pandas as pd
import os
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import f1_score
from lightgbm import LGBMClassifier
import warnings

warnings.filterwarnings('ignore')

# 1. Load Data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

train_path = os.path.join(DATA_DIR, 'train.csv')
print("Loading data...")
train = pd.read_csv(train_path)

drop_cols = ['PRODUCT_ID', 'TIMESTAMP', 'Y_Class', 'Y_Quality']
X = train.drop(columns=[col for col in drop_cols if col in train.columns])
y = train['Y_Class']

# Train-Validation Split
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# We still need to encode categories for the preliminary feature selection model
cat_cols = [c for c in ['LINE', 'PRODUCT_CODE'] if c in X_train.columns]
X_train_encoded = X_train.copy()
X_val_encoded = X_val.copy()
for col in cat_cols:
    X_train_encoded[col] = X_train_encoded[col].astype(str)
    X_val_encoded[col] = X_val_encoded[col].astype(str)
    # Very basic encoding just for the fs model
    unique_vals = X_train_encoded[col].unique()
    val_map = {val: i for i, val in enumerate(unique_vals)}
    X_train_encoded[col] = X_train_encoded[col].map(val_map).fillna(-1)
    X_val_encoded[col] = X_val_encoded[col].map(val_map).fillna(-1)

# Drop zero-variance columns (prevent data leakage by checking on train only)
print("Removing zero-variance features...")
nunique = X_train_encoded.nunique(dropna=False)
cols_to_drop = nunique[nunique <= 1].index
X_train_encoded = X_train_encoded.drop(columns=cols_to_drop)
X_val_encoded = X_val_encoded.drop(columns=cols_to_drop)
print(f"Shape after dropping zero-variance features: {X_train_encoded.shape}")

print("Training preliminary model for Feature Selection...")
lgbm_fs = LGBMClassifier(random_state=42, n_jobs=-1, verbose=-1, max_depth=5, n_estimators=100)
lgbm_fs.fit(X_train_encoded, y_train)

# Get feature importances
importances = lgbm_fs.feature_importances_
important_features = X_train_encoded.columns[importances > 0]
print(f"Selected {len(important_features)} important features out of {X_train_encoded.shape[1]}")

# 4. Final Model Training
print("\n--- Final Regularized Model ---")
lgbm_clf = LGBMClassifier(
    random_state=42, 
    n_jobs=-1, 
    verbose=-1,
    max_depth=5,              
    num_leaves=20,            
    min_child_samples=30,     
    learning_rate=0.05,       
    n_estimators=150,         
    subsample=0.8,            
    subsample_freq=1,
    colsample_bytree=0.8,     
    class_weight='balanced'   
)

# Pipeline Preprocessing using ColumnTransformer to keep only selected features
selected_cat_cols = [c for c in cat_cols if c in important_features]
selected_num_cols = [c for c in important_features if c not in cat_cols]

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), selected_cat_cols),
        ('num', 'passthrough', selected_num_cols)
    ],
    remainder='drop'
)

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', lgbm_clf)
])

pipeline.fit(X_train, y_train)

lgbm_pred_val = pipeline.predict(X_val)
lgbm_pred_train = pipeline.predict(X_train)

lgbm_f1_val = f1_score(y_val, lgbm_pred_val, average='macro')
lgbm_f1_train = f1_score(y_train, lgbm_pred_train, average='macro')

print(f"LightGBM Selected Features Macro F1 (Train): {lgbm_f1_train:.4f}")
print(f"LightGBM Selected Features Macro F1 (Val): {lgbm_f1_val:.4f}")

# Save model and selected features (features are encoded in the pipeline contract)
os.makedirs(MODEL_DIR, exist_ok=True)
model_path = os.path.join(MODEL_DIR, 'lgbm_fs_baseline.joblib')
joblib.dump(pipeline, model_path)
print(f"Model saved to {model_path}")
