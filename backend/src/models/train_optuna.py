import pandas as pd
import numpy as np
import os
import joblib
import warnings
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import OrdinalEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import f1_score
from lightgbm import LGBMClassifier
import optuna

warnings.filterwarnings('ignore')
optuna.logging.set_verbosity(optuna.logging.WARNING)

# 1. Load Data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

print("Loading data...")
train = pd.read_csv(os.path.join(DATA_DIR, 'train.csv'))

drop_cols = ['PRODUCT_ID', 'TIMESTAMP', 'Y_Class', 'Y_Quality']
X = train.drop(columns=[col for col in drop_cols if col in train.columns])
y = train['Y_Class']

# Categories encoding just for the process
cat_cols = [c for c in ['LINE', 'PRODUCT_CODE'] if c in X.columns]
X_encoded = X.copy()
for col in cat_cols:
    X_encoded[col] = X_encoded[col].astype(str)
    unique_vals = X_encoded[col].unique()
    val_map = {val: i for i, val in enumerate(unique_vals)}
    X_encoded[col] = X_encoded[col].map(val_map).fillna(-1)

# Drop zero-variance columns
nunique = X_encoded.nunique(dropna=False)
cols_to_drop = nunique[nunique <= 1].index
X_encoded = X_encoded.drop(columns=cols_to_drop)
print(f"Shape after dropping zero-variance features: {X_encoded.shape}")

# 3. Optuna Objective
def objective(trial):
    params = {
        'random_state': 42,
        'n_jobs': -1,
        'verbose': -1,
        'class_weight': 'balanced',
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1, log=True),
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'num_leaves': trial.suggest_int('num_leaves', 10, 64),
        'min_child_samples': trial.suggest_int('min_child_samples', 10, 50),
        'subsample_freq': 1,
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-3, 10.0, log=True),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-3, 10.0, log=True)
    }
    
    kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    val_scores = []
    
    for train_idx, val_idx in kf.split(X_encoded, y):
        X_train, y_train = X_encoded.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X_encoded.iloc[val_idx], y.iloc[val_idx]
        
        # Feature Selection inside CV
        fs_model = LGBMClassifier(random_state=42, n_jobs=-1, max_depth=5, n_estimators=50, verbose=-1)
        fs_model.fit(X_train, y_train)
        importances = fs_model.feature_importances_
        top_k_indices = np.argsort(importances)[::-1][:300]
        top_300_features = X_train.columns[top_k_indices]
        
        X_train_sel = X_train[top_300_features]
        X_val_sel = X_val[top_300_features]
        
        lgbm = LGBMClassifier(**params)
        lgbm.fit(X_train_sel, y_train)
        
        preds = lgbm.predict(X_val_sel)
        score = f1_score(y_val, preds, average='macro')
        val_scores.append(score)
        
    return np.mean(val_scores)

# 4. Run Optimization
print("Starting Optuna Hyperparameter Tuning (50 Trials)...")
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=50, show_progress_bar=True)

print("\nBest Trial:")
print(f"  Val F1 Score: {study.best_value:.4f}")
print("  Best Params: ")
for k, v in study.best_params.items():
    print(f"    {k}: {v}")

# 5. Train Final Model with Best Params
print("\nTraining Final Model on entire dataset with Best Params...")

fs_model_final = LGBMClassifier(random_state=42, n_jobs=-1, max_depth=5, n_estimators=50, verbose=-1)
fs_model_final.fit(X_encoded, y)
importances = fs_model_final.feature_importances_
top_k_indices = np.argsort(importances)[::-1][:300]
top_300_features = X_encoded.columns[top_k_indices]
X_sel_final = X_encoded[top_300_features]

best_params = study.best_params
best_params['random_state'] = 42
best_params['n_jobs'] = -1
best_params['verbose'] = -1
best_params['class_weight'] = 'balanced'
best_params['subsample_freq'] = 1

final_model = LGBMClassifier(**best_params)

selected_cat_cols = [c for c in cat_cols if c in top_300_features]
selected_num_cols = [c for c in top_300_features if c not in cat_cols]

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), selected_cat_cols),
        ('num', 'passthrough', selected_num_cols)
    ],
    remainder='drop'
)

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', final_model)
])

pipeline.fit(X, y)

os.makedirs(MODEL_DIR, exist_ok=True)
model_path = os.path.join(MODEL_DIR, 'lgbm_optuna_best.joblib')
joblib.dump(pipeline, model_path)
print(f"Final Model Pipeline saved to {model_path}")
