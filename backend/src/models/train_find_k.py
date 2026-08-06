import pandas as pd
import numpy as np
import os
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import f1_score
from lightgbm import LGBMClassifier
import warnings

warnings.filterwarnings('ignore')

# 1. Load Data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'dataset')

print("Loading data...")
train = pd.read_csv(os.path.join(DATA_DIR, 'train.csv'))

drop_cols = ['PRODUCT_ID', 'TIMESTAMP', 'Y_Class', 'Y_Quality']
X = train.drop(columns=[col for col in drop_cols if col in train.columns])
y = train['Y_Class']

for col in ['LINE', 'PRODUCT_CODE']:
    if col in X.columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

# Drop zero-variance columns
nunique = X.nunique(dropna=False)
X = X.drop(columns=nunique[nunique <= 1].index)
print(f"Shape after dropping zero-variance features: {X.shape}")

# Define feature counts to test
K_LIST = [10, 30, 50, 100, 200, 300, 500]
results = []

kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

print("\nStarting search for optimal number of features...")
for k in K_LIST:
    lgbm_train_f1, lgbm_val_f1 = [], []
    
    for train_idx, val_idx in kf.split(X, y):
        X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
        
        # Feature Selection
        fs_model = LGBMClassifier(random_state=42, n_jobs=-1, max_depth=5, n_estimators=50, verbose=-1)
        fs_model.fit(X_train, y_train)
        
        importances = fs_model.feature_importances_
        top_k_indices = np.argsort(importances)[::-1][:k]
        top_k_features = X_train.columns[top_k_indices]
        
        X_train_sel = X_train[top_k_features]
        X_val_sel = X_val[top_k_features]
        
        # Train Model
        lgbm = LGBMClassifier(
            random_state=42, n_jobs=-1, verbose=-1,
            max_depth=4, num_leaves=10, min_child_samples=20,
            learning_rate=0.05, n_estimators=100,
            subsample=0.8, subsample_freq=1, colsample_bytree=0.8, class_weight='balanced'
        )
        lgbm.fit(X_train_sel, y_train)
        
        lgbm_train_f1.append(f1_score(y_train, lgbm.predict(X_train_sel), average='macro'))
        lgbm_val_f1.append(f1_score(y_val, lgbm.predict(X_val_sel), average='macro'))
        
    avg_train = np.mean(lgbm_train_f1)
    avg_val = np.mean(lgbm_val_f1)
    results.append({'K': k, 'Train_F1': avg_train, 'Val_F1': avg_val})
    print(f"Top {k:>3} Features | Train F1: {avg_train:.4f} | Val F1: {avg_val:.4f}")

# Find best K
best_result = max(results, key=lambda x: x['Val_F1'])
print(f"\n🏆 Best Number of Features: Top {best_result['K']} (Val F1: {best_result['Val_F1']:.4f})")
