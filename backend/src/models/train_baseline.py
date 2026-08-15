import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import f1_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from lightgbm import LGBMClassifier
import warnings

warnings.filterwarnings('ignore')

# 1. Load Data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

train_path = os.path.join(DATA_DIR, 'train.csv')
train = pd.read_csv(train_path)

# 2. No Preprocessing (Minimum to run)
print("Setting up raw data...")
drop_cols = ['PRODUCT_ID', 'TIMESTAMP', 'Y_Class', 'Y_Quality']
X = train.drop(columns=[col for col in drop_cols if col in train.columns])
y = train['Y_Class']

# Train-Validation Split (Stratified)
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 3. Regularized Baseline Model (LightGBM handles NaN automatically)
print("\n--- Regularized Baseline Model ---")

# Pipeline Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), ['LINE', 'PRODUCT_CODE'])
    ],
    remainder='passthrough'
)

# Applied basic hyperparameters to prevent overfitting
lgbm_clf = LGBMClassifier(
    random_state=42, 
    n_jobs=-1, 
    verbose=-1,
    max_depth=5,              # Limit tree depth (Default: -1)
    num_leaves=20,            # Limit max leaves (Default: 31)
    min_child_samples=30,     # Min samples per leaf (Default: 20)
    learning_rate=0.05,       # Step size (Default: 0.1)
    n_estimators=150,         # Number of trees
    subsample=0.8,            # Row sampling
    subsample_freq=1,         # Required for subsample
    colsample_bytree=0.8,     # Feature sampling
    class_weight='balanced'   # Handle potential class imbalance
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

print(f"Raw LightGBM Baseline Macro F1 (Train): {lgbm_f1_train:.4f}")
print(f"Raw LightGBM Baseline Macro F1 (Val): {lgbm_f1_val:.4f}")

# Save the raw model
os.makedirs(MODEL_DIR, exist_ok=True)
model_path = os.path.join(MODEL_DIR, 'lgbm_raw_baseline.joblib')
joblib.dump(pipeline, model_path)
print(f"Raw Model saved to {model_path}")
