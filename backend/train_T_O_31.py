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

def train_T_O_31_ensemble_with_fs():
    print("1. Loading T_O_31 data...")
    train_path = 'dataset/T_O_31/train_T_O_31.csv'
    
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
    
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    max_features = X.shape[1]
    
    print("3. Running Optuna Tuning for LightGBM (30 trials, w/ Fold-Internal Feature Selection)...")
    def objective_lgbm(trial):
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 50, 150),
            'max_depth': trial.suggest_int('max_depth', 3, 7),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1, log=True),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'random_state': 42,
            'verbose': -1
        }
        w0 = trial.suggest_float('weight0', 1.0, 15.0)
        w2 = trial.suggest_float('weight2', 1.0, 15.0)
        cw = {0: w0, 1: 1.0, 2: w2}
        
        top_k = trial.suggest_int('top_k', 30, max_features)
        
        oof_preds = np.zeros(len(X))
        for train_idx, val_idx in skf.split(X, y):
            X_tr, y_tr = X.iloc[train_idx], y.iloc[train_idx]
            X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
            
            # Baseline to get feature importance (Data Leakage Prevention)
            base_model = LGBMClassifier(random_state=42, verbose=-1, class_weight=cw)
            base_model.fit(X_tr, y_tr)
            
            top_idx = np.argsort(base_model.feature_importances_)[::-1][:top_k]
            top_cols = X_tr.columns[top_idx]
            
            model = LGBMClassifier(**params, class_weight=cw)
            model.fit(X_tr[top_cols], y_tr)
            oof_preds[val_idx] = model.predict(X_val[top_cols])
            
        return f1_score(y, oof_preds, average='macro')

    study_lgbm = optuna.create_study(direction='maximize')
    study_lgbm.optimize(objective_lgbm, n_trials=30)
    best_lgbm_params = study_lgbm.best_params
    lgbm_w0 = best_lgbm_params.pop('weight0')
    lgbm_w2 = best_lgbm_params.pop('weight2')
    lgbm_cw = {0: lgbm_w0, 1: 1.0, 2: lgbm_w2}
    lgbm_top_k = best_lgbm_params.pop('top_k')
    best_lgbm_params.update({'random_state': 42, 'verbose': -1})
    
    print(f"LGBM Best top_k: {lgbm_top_k}")
    
    print("4. Running Optuna Tuning for CatBoost (30 trials, w/ Fold-Internal Feature Selection)...")
    def objective_cb(trial):
        params = {
            'iterations': trial.suggest_int('iterations', 50, 150),
            'depth': trial.suggest_int('depth', 3, 7),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1, log=True),
            'random_seed': 42,
            'verbose': 0
        }
        w0 = trial.suggest_float('weight0', 1.0, 15.0)
        w2 = trial.suggest_float('weight2', 1.0, 15.0)
        cw = [w0, 1.0, w2]
        
        top_k = trial.suggest_int('top_k', 30, max_features)
        
        oof_preds = np.zeros(len(X))
        for train_idx, val_idx in skf.split(X, y):
            X_tr, y_tr = X.iloc[train_idx], y.iloc[train_idx]
            X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
            
            base_model = CatBoostClassifier(iterations=50, random_seed=42, verbose=0, class_weights=cw)
            base_model.fit(X_tr, y_tr)
            
            top_idx = np.argsort(base_model.feature_importances_)[::-1][:top_k]
            top_cols = X_tr.columns[top_idx]
            
            model = CatBoostClassifier(**params, class_weights=cw)
            model.fit(X_tr[top_cols], y_tr)
            oof_preds[val_idx] = model.predict(X_val[top_cols]).flatten()
            
        return f1_score(y, oof_preds, average='macro')

    study_cb = optuna.create_study(direction='maximize')
    study_cb.optimize(objective_cb, n_trials=30)
    best_cb_params = study_cb.best_params
    cb_w0 = best_cb_params.pop('weight0')
    cb_w2 = best_cb_params.pop('weight2')
    cb_cw = [cb_w0, 1.0, cb_w2]
    cb_top_k = best_cb_params.pop('top_k')
    best_cb_params.update({'random_seed': 42, 'verbose': 0})
    
    print(f"CatBoost Best top_k: {cb_top_k}")
    
    print("5. Evaluating Soft Voting Ensemble (OOF) and Threshold Tuning...")
    lgbm_oof_proba = np.zeros((len(X), 3))
    cb_oof_proba = np.zeros((len(X), 3))
    
    for train_idx, val_idx in skf.split(X, y):
        X_tr, y_tr = X.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
        
        # --- LightGBM ---
        base_lgbm = LGBMClassifier(random_state=42, verbose=-1, class_weight=lgbm_cw)
        base_lgbm.fit(X_tr, y_tr)
        top_idx_lgbm = np.argsort(base_lgbm.feature_importances_)[::-1][:lgbm_top_k]
        top_cols_lgbm = X_tr.columns[top_idx_lgbm]
        
        model_lgbm = LGBMClassifier(**best_lgbm_params, class_weight=lgbm_cw)
        model_lgbm.fit(X_tr[top_cols_lgbm], y_tr)
        lgbm_oof_proba[val_idx] = model_lgbm.predict_proba(X_val[top_cols_lgbm])
        
        # --- CatBoost ---
        base_cb = CatBoostClassifier(iterations=50, random_seed=42, verbose=0, class_weights=cb_cw)
        base_cb.fit(X_tr, y_tr)
        top_idx_cb = np.argsort(base_cb.feature_importances_)[::-1][:cb_top_k]
        top_cols_cb = X_tr.columns[top_idx_cb]
        
        model_cb = CatBoostClassifier(**best_cb_params, class_weights=cb_cw)
        model_cb.fit(X_tr[top_cols_cb], y_tr)
        cb_oof_proba[val_idx] = model_cb.predict_proba(X_val[top_cols_cb])
        
    ensemble_proba = (lgbm_oof_proba + cb_oof_proba) / 2.0
    
    def objective_threshold(trial):
        thr0 = trial.suggest_float('thr0', 0.1, 0.9)
        thr2 = trial.suggest_float('thr2', 0.1, 0.9)
        
        preds = np.ones(len(y))
        for i in range(len(y)):
            if ensemble_proba[i, 0] > thr0:
                preds[i] = 0
            elif ensemble_proba[i, 2] > thr2:
                preds[i] = 2
            else:
                preds[i] = 1
        return f1_score(y, preds, average='macro')
        
    study_thr = optuna.create_study(direction='maximize')
    study_thr.optimize(objective_threshold, n_trials=100)
    best_thr = study_thr.best_params
    print(f"Best Thresholds: {best_thr}")
    
    ensemble_preds = np.ones(len(y))
    for i in range(len(y)):
        if ensemble_proba[i, 0] > best_thr['thr0']:
            ensemble_preds[i] = 0
        elif ensemble_proba[i, 2] > best_thr['thr2']:
            ensemble_preds[i] = 2
        else:
            ensemble_preds[i] = 1
    
    final_f1 = f1_score(y, ensemble_preds, average='macro')
    final_acc = accuracy_score(y, ensemble_preds)
    
    print(f"=== T_O_31 Ensemble (w/ Feature Selection + Threshold Tuning) Validation Results ===")
    print(f"Macro F1 Score: {final_f1:.4f}")
    print(f"Accuracy:       {final_acc:.4f}")
    print(f"==================================================================================")
    
    print("6. Training Final Models on full dataset and saving...")
    # Get final top_k features on ALL data
    base_lgbm = LGBMClassifier(random_state=42, verbose=-1, class_weight=lgbm_cw)
    base_lgbm.fit(X, y)
    final_top_cols_lgbm = X.columns[np.argsort(base_lgbm.feature_importances_)[::-1][:lgbm_top_k]]
    
    base_cb = CatBoostClassifier(iterations=50, random_seed=42, verbose=0, class_weights=cb_cw)
    base_cb.fit(X, y)
    final_top_cols_cb = X.columns[np.argsort(base_cb.feature_importances_)[::-1][:cb_top_k]]
    
    final_lgbm = LGBMClassifier(**best_lgbm_params, class_weight=lgbm_cw)
    final_lgbm.fit(X[final_top_cols_lgbm], y)
    
    final_cb = CatBoostClassifier(**best_cb_params, class_weights=cb_cw)
    final_cb.fit(X[final_top_cols_cb], y)
    
    lgbm_path = 'dataset/T_O_31/model_T_O_31_lgbm.joblib'
    cb_path = 'dataset/T_O_31/model_T_O_31_cb.joblib'
    features_lgbm_path = 'dataset/T_O_31/features_T_O_31_lgbm.joblib'
    features_cb_path = 'dataset/T_O_31/features_T_O_31_cb.joblib'
    thr_path = 'dataset/T_O_31/thresholds_T_O_31.joblib'
    
    joblib.dump(final_lgbm, lgbm_path)
    joblib.dump(final_cb, cb_path)
    joblib.dump(final_top_cols_lgbm.tolist(), features_lgbm_path)
    joblib.dump(final_top_cols_cb.tolist(), features_cb_path)
    joblib.dump(best_thr, thr_path)
    
    print("All done!")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    train_T_O_31_ensemble_with_fs()
