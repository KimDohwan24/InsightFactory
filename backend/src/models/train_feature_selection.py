import pandas as pd
import os
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
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

# Convert strings to numeric
for col in ['LINE', 'PRODUCT_CODE']:
    if col in X.columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

print(f"Initial shape: {X.shape}")

# 2. Feature Selection: Remove zero-variance columns (only 1 unique value or all NaNs)
print("Removing zero-variance features...")
nunique = X.nunique(dropna=False)
cols_to_drop = nunique[nunique <= 1].index
X = X.drop(columns=cols_to_drop)
print(f"Shape after dropping zero-variance features: {X.shape}")

# Train-Validation Split
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Feature Selection: LightGBM Importance
print("Training preliminary model for Feature Selection...")
lgbm_fs = LGBMClassifier(random_state=42, n_jobs=-1, verbose=-1, max_depth=5, n_estimators=100)
lgbm_fs.fit(X_train, y_train)

# Get feature importances
importances = lgbm_fs.feature_importances_
# Select features that have importance > 0
important_features = X_train.columns[importances > 0]
print(f"Selected {len(important_features)} important features out of {X_train.shape[1]}")

X_train_sel = X_train[important_features]
X_val_sel = X_val[important_features]

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
    colsample_bytree=0.8,     
    class_weight='balanced'   
)
lgbm_clf.fit(X_train_sel, y_train)

lgbm_pred_val = lgbm_clf.predict(X_val_sel)
lgbm_pred_train = lgbm_clf.predict(X_train_sel)

lgbm_f1_val = f1_score(y_val, lgbm_pred_val, average='macro')
lgbm_f1_train = f1_score(y_train, lgbm_pred_train, average='macro')

print(f"LightGBM Selected Features Macro F1 (Train): {lgbm_f1_train:.4f}")
print(f"LightGBM Selected Features Macro F1 (Val): {lgbm_f1_val:.4f}")

# Save model and selected features
os.makedirs(MODEL_DIR, exist_ok=True)
model_path = os.path.join(MODEL_DIR, 'lgbm_fs_baseline.joblib')
joblib.dump({'model': lgbm_clf, 'features': important_features.tolist()}, model_path)
print(f"Model saved to {model_path}")
