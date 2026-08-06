import pandas as pd
import numpy as np
import os
import joblib
import warnings
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder
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

for col in ['LINE', 'PRODUCT_CODE']:
    if col in X.columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

# Drop zero-variance columns
nunique = X.nunique(dropna=False)
X = X.drop(columns=nunique[nunique <= 1].index)
print(f"Shape after dropping zero-variance features: {X.shape}")

# 2. Extract Top 300 Features
print("Selecting Top 300 Features...")
fs_model = LGBMClassifier(random_state=42, n_jobs=-1, max_depth=5, n_estimators=50, verbose=-1)
fs_model.fit(X, y)
importances = fs_model.feature_importances_
top_k_indices = np.argsort(importances)[::-1][:300]
top_300_features = X.columns[top_k_indices]
X_sel = X[top_300_features]
print(f"Features selected: {X_sel.shape[1]}")

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
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-3, 10.0, log=True),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-3, 10.0, log=True)
    }
    
    kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    val_scores = []
    
    for train_idx, val_idx in kf.split(X_sel, y):
        X_train, y_train = X_sel.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X_sel.iloc[val_idx], y.iloc[val_idx]
        
        lgbm = LGBMClassifier(**params)
        lgbm.fit(X_train, y_train)
        
        preds = lgbm.predict(X_val)
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
best_params = study.best_params
best_params['random_state'] = 42
best_params['n_jobs'] = -1
best_params['verbose'] = -1
best_params['class_weight'] = 'balanced'

final_model = LGBMClassifier(**best_params)
final_model.fit(X_sel, y)

os.makedirs(MODEL_DIR, exist_ok=True)
model_path = os.path.join(MODEL_DIR, 'lgbm_optuna_best.joblib')
joblib.dump({'model': final_model, 'features': top_300_features.tolist(), 'params': best_params}, model_path)
print(f"Final Model saved to {model_path}")
