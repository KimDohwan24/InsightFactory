import pandas as pd
import numpy as np
import optuna
import joblib
import warnings
import os
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score, accuracy_score
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

warnings.filterwarnings('ignore')
optuna.logging.set_verbosity(optuna.logging.WARNING)

def train_A_31_ensemble():
    print("1. Loading A_31 data...")
    train_path = 'dataset/A_31/train_A_31.csv'
    
    if not os.path.exists(train_path):
        print(f"Error: {train_path} not found.")
        return
        
    df = pd.read_csv(train_path)
    
    y = df['Y_Class']
    X = df.drop(columns=['PRODUCT_ID', 'Y_Class', 'Y_Quality', 'PRODUCT_CODE', 'LINE'], errors='ignore')
    
    print("2. Preprocessing...")
    all_nan_cols = X.columns[X.isnull().all()]
    X.drop(columns=all_nan_cols, inplace=True)
    
    numeric_cols = X.select_dtypes(include=[np.number]).columns
    zero_var_cols = [col for col in numeric_cols if X[col].std() == 0]
    X.drop(columns=zero_var_cols, inplace=True)
    
    from sklearn.preprocessing import LabelEncoder
    object_cols = X.select_dtypes(include=['object']).columns
    for col in object_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
    
    print(f"Remaining features: {X.shape[1]}")
    
    print("2.5. Extracting Baseline Feature Importances...")
    base_lgbm = LGBMClassifier(random_state=42)
    base_lgbm.fit(X, y)
    importances = base_lgbm.feature_importances_
    feat_imp = pd.Series(importances, index=X.columns).sort_values(ascending=False)
    sorted_features = feat_imp.index.tolist()
    
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    print("3. Running Optuna Tuning for LightGBM (20 trials, including top_k)...")
    def objective_lgbm(trial):
        top_k = trial.suggest_int('top_k', 50, 300)
        selected_features = sorted_features[:top_k]
        X_sub = X[selected_features]
        
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 50, 150),
            'max_depth': trial.suggest_int('max_depth', 3, 7),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1, log=True),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'random_state': 42,
            'verbose': -1
        }
        w0 = trial.suggest_float('weight0', 1.0, 10.0)
        w2 = trial.suggest_float('weight2', 1.0, 10.0)
        cw = {0: w0, 1: 1.0, 2: w2}
        
        oof_preds = np.zeros(len(X_sub))
        for train_idx, val_idx in skf.split(X_sub, y):
            X_tr, y_tr = X_sub.iloc[train_idx], y.iloc[train_idx]
            X_val, y_val = X_sub.iloc[val_idx], y.iloc[val_idx]
            model = LGBMClassifier(**params, class_weight=cw)
            model.fit(X_tr, y_tr)
            oof_preds[val_idx] = model.predict(X_val)
        return f1_score(y, oof_preds, average='macro')

    study_lgbm = optuna.create_study(direction='maximize')
    study_lgbm.optimize(objective_lgbm, n_trials=20)
    best_lgbm_params = study_lgbm.best_params
    lgbm_w0 = best_lgbm_params.pop('weight0')
    lgbm_w2 = best_lgbm_params.pop('weight2')
    lgbm_top_k = best_lgbm_params.pop('top_k')
    lgbm_cw = {0: lgbm_w0, 1: 1.0, 2: lgbm_w2}
    best_lgbm_params.update({'random_state': 42, 'verbose': -1})
    
    print("4. Running Optuna Tuning for CatBoost (20 trials, including top_k)...")
    def objective_cb(trial):
        top_k = trial.suggest_int('top_k', 50, 300)
        selected_features = sorted_features[:top_k]
        X_sub = X[selected_features]
        
        params = {
            'iterations': trial.suggest_int('iterations', 50, 150),
            'depth': trial.suggest_int('depth', 3, 7),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1, log=True),
            'random_seed': 42,
            'verbose': 0
        }
        w0 = trial.suggest_float('weight0', 1.0, 10.0)
        w2 = trial.suggest_float('weight2', 1.0, 10.0)
        cw = [w0, 1.0, w2]
        
        oof_preds = np.zeros(len(X_sub))
        for train_idx, val_idx in skf.split(X_sub, y):
            X_tr, y_tr = X_sub.iloc[train_idx], y.iloc[train_idx]
            X_val, y_val = X_sub.iloc[val_idx], y.iloc[val_idx]
            model = CatBoostClassifier(**params, class_weights=cw)
            model.fit(X_tr, y_tr)
            oof_preds[val_idx] = model.predict(X_val).flatten()
        return f1_score(y, oof_preds, average='macro')

    study_cb = optuna.create_study(direction='maximize')
    study_cb.optimize(objective_cb, n_trials=20)
    best_cb_params = study_cb.best_params
    cb_w0 = best_cb_params.pop('weight0')
    cb_w2 = best_cb_params.pop('weight2')
    cb_top_k = best_cb_params.pop('top_k')
    cb_cw = [cb_w0, 1.0, cb_w2]
    best_cb_params.update({'random_seed': 42, 'verbose': 0})
    
    print("5. Evaluating Soft Voting Ensemble (OOF)...")
    lgbm_oof_proba = np.zeros((len(X), 3))
    cb_oof_proba = np.zeros((len(X), 3))
    
    X_lgbm = X[sorted_features[:lgbm_top_k]]
    X_cb = X[sorted_features[:cb_top_k]]
    
    for train_idx, val_idx in skf.split(X, y):
        y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]
        
        # LightGBM
        X_tr_lgbm, X_val_lgbm = X_lgbm.iloc[train_idx], X_lgbm.iloc[val_idx]
        model_lgbm = LGBMClassifier(**best_lgbm_params, class_weight=lgbm_cw)
        model_lgbm.fit(X_tr_lgbm, y_tr)
        lgbm_oof_proba[val_idx] = model_lgbm.predict_proba(X_val_lgbm)
        
        # CatBoost
        X_tr_cb, X_val_cb = X_cb.iloc[train_idx], X_cb.iloc[val_idx]
        model_cb = CatBoostClassifier(**best_cb_params, class_weights=cb_cw)
        model_cb.fit(X_tr_cb, y_tr)
        cb_oof_proba[val_idx] = model_cb.predict_proba(X_val_cb)
        
    # Soft Voting
    ensemble_proba = (lgbm_oof_proba + cb_oof_proba) / 2.0
    ensemble_preds = np.argmax(ensemble_proba, axis=1)
    
    final_f1 = f1_score(y, ensemble_preds, average='macro')
    final_acc = accuracy_score(y, ensemble_preds)
    
    print(f"=== A_31 Ensemble (w/ top_k Feature Selection) Validation Results ===")
    print(f"LGBM top_k: {lgbm_top_k}, CB top_k: {cb_top_k}")
    print(f"Macro F1 Score: {final_f1:.4f}")
    print(f"Accuracy:       {final_acc:.4f}")
    print(f"=======================================================================")
    
    print("6. Training Final Models on full dataset and saving...")
    final_lgbm = LGBMClassifier(**best_lgbm_params, class_weight=lgbm_cw)
    final_lgbm.fit(X_lgbm, y)
    
    final_cb = CatBoostClassifier(**best_cb_params, class_weights=cb_cw)
    final_cb.fit(X_cb, y)
    
    lgbm_path = 'dataset/A_31/model_A_31_lgbm.joblib'
    cb_path = 'dataset/A_31/model_A_31_cb.joblib'
    
    # We must save the exact features used by each model for predict.py
    features_lgbm_path = 'dataset/A_31/features_A_31_lgbm.joblib'
    features_cb_path = 'dataset/A_31/features_A_31_cb.joblib'
    
    joblib.dump(final_lgbm, lgbm_path)
    joblib.dump(final_cb, cb_path)
    joblib.dump(X_lgbm.columns.tolist(), features_lgbm_path)
    joblib.dump(X_cb.columns.tolist(), features_cb_path)
    
    print("All done!")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    train_A_31_ensemble()
