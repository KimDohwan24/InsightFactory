import pandas as pd
import numpy as np
import os
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import f1_score
from lightgbm import LGBMClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.impute import SimpleImputer
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

# Convert strings to numeric
for col in ['LINE', 'PRODUCT_CODE']:
    if col in X.columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

lgbm_train_f1, lgbm_val_f1 = [], []
lr_train_f1, lr_val_f1 = [], []

TOP_K = 30
print(f"\nStarting 5-Fold CV (Selecting Top {TOP_K} features per fold)...")

for fold, (train_idx, val_idx) in enumerate(kf.split(X, y)):
    X_train, y_train = X.iloc[train_idx].copy(), y.iloc[train_idx].copy()
    X_val, y_val = X.iloc[val_idx].copy(), y.iloc[val_idx].copy()
    
    # Drop zero-variance columns (prevent data leakage)
    nunique = X_train.nunique(dropna=False)
    cols_to_keep = nunique[nunique > 1].index
    X_train = X_train[cols_to_keep]
    X_val = X_val[cols_to_keep]
    
    # Impute missing values
    imputer = SimpleImputer(strategy='median')
    X_train_cols = X_train.columns
    X_train = pd.DataFrame(imputer.fit_transform(X_train), columns=X_train_cols)
    X_val = pd.DataFrame(imputer.transform(X_val), columns=X_train_cols)


    
    # 1. Preliminary Feature Selection using LightGBM
    fs_model = LGBMClassifier(random_state=42, n_jobs=-1, max_depth=5, n_estimators=50, verbose=-1)
    fs_model.fit(X_train, y_train)
    
    importances = fs_model.feature_importances_
    top_k_indices = np.argsort(importances)[::-1][:TOP_K]
    top_k_features = X_train.columns[top_k_indices]
    
    X_train_sel = X_train[top_k_features]
    X_val_sel = X_val[top_k_features]
    
    lgbm = LGBMClassifier(
        random_state=42, n_jobs=-1, verbose=-1,
        max_depth=4, num_leaves=10, min_child_samples=20,
        learning_rate=0.05, n_estimators=100,
        subsample=0.8, subsample_freq=1, colsample_bytree=0.8, class_weight='balanced'
    )
    lgbm.fit(X_train_sel, y_train)
    
    lgbm_train_f1.append(f1_score(y_train, lgbm.predict(X_train_sel), average='macro'))
    lgbm_val_f1.append(f1_score(y_val, lgbm.predict(X_val_sel), average='macro'))
    
    # 3. Train Logistic Regression with L1 Penalty (Lasso-like)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_sel)
    X_val_scaled = scaler.transform(X_val_sel)
    
    lr = LogisticRegression(penalty='l1', solver='saga', class_weight='balanced', C=0.1, random_state=42, max_iter=500)
    lr.fit(X_train_scaled, y_train)
    
    lr_train_f1.append(f1_score(y_train, lr.predict(X_train_scaled), average='macro'))
    lr_val_f1.append(f1_score(y_val, lr.predict(X_val_scaled), average='macro'))

print("\n=== 5-Fold Cross Validation Results ===")
print(f"[LightGBM (Top {TOP_K})] Train F1: {np.mean(lgbm_train_f1):.4f} | Val F1: {np.mean(lgbm_val_f1):.4f}")
print(f"[Logistic Regression L1] Train F1: {np.mean(lr_train_f1):.4f} | Val F1: {np.mean(lr_val_f1):.4f}")
