import pandas as pd
import numpy as np
import warnings
import optuna
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier
from catboost import CatBoostClassifier
from imblearn.over_sampling import SMOTE
import joblib
import time

warnings.filterwarnings('ignore')
optuna.logging.set_verbosity(optuna.logging.WARNING)

def process_timestamp(df):
    df['TIMESTAMP'] = pd.to_datetime(df['TIMESTAMP'])
    df['Month'] = df['TIMESTAMP'].dt.month
    df['Day'] = df['TIMESTAMP'].dt.day
    df['Hour'] = df['TIMESTAMP'].dt.hour
    df['Minute'] = df['TIMESTAMP'].dt.minute
    return df.drop(columns=['TIMESTAMP'])

print("1. Loading data & Basic Preprocessing...")
train_df = pd.read_csv('dataset/train.csv')
test_df = pd.read_csv('dataset/test.csv')
submission = pd.read_csv('dataset/sample_submission.csv')

train_df = process_timestamp(train_df)
test_df = process_timestamp(test_df)

y_train = train_df['Y_Class']
drop_cols = ['PRODUCT_ID', 'Y_Class', 'Y_Quality']
X_train = train_df.drop(columns=drop_cols)
X_test = test_df.drop(columns=['PRODUCT_ID'])

cat_cols = ['LINE', 'PRODUCT_CODE']
for col in cat_cols:
    le = LabelEncoder()
    le.fit(pd.concat([X_train[col], X_test[col]]))
    X_train[col] = le.transform(X_train[col])
    X_test[col] = le.transform(X_test[col])

all_nan_cols = X_train.columns[X_train.isnull().all()]
X_train.drop(columns=all_nan_cols, inplace=True)
X_test.drop(columns=all_nan_cols, inplace=True)

X_train.fillna(-1, inplace=True)
X_test.fillna(-1, inplace=True)

zero_var_cols = [col for col in X_train.columns if X_train[col].std() == 0]
X_train.drop(columns=zero_var_cols, inplace=True)
X_test.drop(columns=zero_var_cols, inplace=True)

print("2. Feature Selection: Extracting Top 200 Features...")
fs_model = LGBMClassifier(n_estimators=100, random_state=42, class_weight='balanced', verbose=-1)
fs_model.fit(X_train, y_train)

importances = fs_model.feature_importances_
indices = np.argsort(importances)[::-1]
top_200_features = X_train.columns[indices][:200]

X_train_reduced = X_train[top_200_features]
X_test_reduced = X_test[top_200_features]

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

def tune_hyperparameters(model_type, n_trials=30):
    def objective(trial):
        if model_type == 'lgbm':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 300),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'random_state': 42,
                'verbose': -1
            }
            model_class = LGBMClassifier
        elif model_type == 'xgb':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 300),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'random_state': 42,
                'eval_metric': 'mlogloss'
            }
            model_class = XGBClassifier
        elif model_type == 'cat':
            params = {
                'iterations': trial.suggest_int('iterations', 100, 300),
                'depth': trial.suggest_int('depth', 4, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
                'l2_leaf_reg': trial.suggest_float('l2_leaf_reg', 1, 10),
                'random_state': 42,
                'verbose': False
            }
            model_class = CatBoostClassifier

        oof_preds = np.zeros(len(X_train_reduced))
        for train_idx, val_idx in skf.split(X_train_reduced, y_train):
            X_tr, y_tr = X_train_reduced.iloc[train_idx], y_train.iloc[train_idx]
            X_val, y_val = X_train_reduced.iloc[val_idx], y_train.iloc[val_idx]
            
            smote = SMOTE(random_state=42)
            X_tr_smote, y_tr_smote = smote.fit_resample(X_tr, y_tr)
            
            model = model_class(**params)
            model.fit(X_tr_smote, y_tr_smote)
            preds = model.predict(X_val)
            if preds.ndim > 1:
                preds = preds.flatten()
            oof_preds[val_idx] = preds
            
        return f1_score(y_train, oof_preds, average='macro')
    
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials)
    return study.best_params

print("\n3. Optuna Tuning: LightGBM (30 trials)")
best_lgbm_params = tune_hyperparameters('lgbm', n_trials=30)
print(f"Best LGBM Params: {best_lgbm_params}")

print("\n4. Optuna Tuning: XGBoost (30 trials)")
best_xgb_params = tune_hyperparameters('xgb', n_trials=30)
print(f"Best XGB Params: {best_xgb_params}")

print("\n5. Optuna Tuning: CatBoost (30 trials)")
best_cat_params = tune_hyperparameters('cat', n_trials=30)
print(f"Best Cat Params: {best_cat_params}")

best_lgbm_params['random_state'] = 42
best_lgbm_params['verbose'] = -1
best_xgb_params['random_state'] = 42
best_xgb_params['eval_metric'] = 'mlogloss'
best_cat_params['random_state'] = 42
best_cat_params['verbose'] = False

def get_oof_and_test_probs(model_class, params, X, y, X_test):
    oof_probs = np.zeros((len(X), 3))
    test_probs = np.zeros((len(X_test), 3))
    
    for train_idx, val_idx in skf.split(X, y):
        X_tr, y_tr = X.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
        
        smote = SMOTE(random_state=42)
        X_tr_smote, y_tr_smote = smote.fit_resample(X_tr, y_tr)
        
        model = model_class(**params)
        model.fit(X_tr_smote, y_tr_smote)
        
        oof_probs[val_idx] = model.predict_proba(X_val)
        test_probs += model.predict_proba(X_test) / skf.n_splits
        
    return oof_probs, test_probs

print("\n6. Generating OOF and Test Probabilities...")
oof_lgbm, test_lgbm = get_oof_and_test_probs(LGBMClassifier, best_lgbm_params, X_train_reduced, y_train, X_test_reduced)
oof_xgb, test_xgb = get_oof_and_test_probs(XGBClassifier, best_xgb_params, X_train_reduced, y_train, X_test_reduced)
oof_cat, test_cat = get_oof_and_test_probs(CatBoostClassifier, best_cat_params, X_train_reduced, y_train, X_test_reduced)

print("\n7. Optuna Tuning: Ensemble Weights & Class Thresholds (200 trials)")
def ensemble_objective(trial):
    w_lgbm = trial.suggest_float('w_lgbm', 0.0, 1.0)
    w_xgb = trial.suggest_float('w_xgb', 0.0, 1.0)
    w_cat = trial.suggest_float('w_cat', 0.0, 1.0)
    
    t0 = trial.suggest_float('t0', 0.1, 1.0)
    t1 = trial.suggest_float('t1', 0.1, 1.0)
    t2 = trial.suggest_float('t2', 0.1, 1.0)
    
    blended_oof = (w_lgbm * oof_lgbm + w_xgb * oof_xgb + w_cat * oof_cat)
    
    adj_oof = np.zeros_like(blended_oof)
    adj_oof[:, 0] = blended_oof[:, 0] / t0
    adj_oof[:, 1] = blended_oof[:, 1] / t1
    adj_oof[:, 2] = blended_oof[:, 2] / t2
    
    preds = np.argmax(adj_oof, axis=1)
    return f1_score(y_train, preds, average='macro')

ensemble_study = optuna.create_study(direction='maximize')
ensemble_study.optimize(ensemble_objective, n_trials=200)

best_ensemble_params = ensemble_study.best_params
print(f"Best Ensemble F1 Score: {ensemble_study.best_value:.4f}")
print(f"Best Weights & Thresholds: {best_ensemble_params}")

print("\n8. Final Test Prediction & Submission")
w_lgbm = best_ensemble_params['w_lgbm']
w_xgb = best_ensemble_params['w_xgb']
w_cat = best_ensemble_params['w_cat']
t0 = best_ensemble_params['t0']
t1 = best_ensemble_params['t1']
t2 = best_ensemble_params['t2']

blended_test = (w_lgbm * test_lgbm + w_xgb * test_xgb + w_cat * test_cat)
adj_test = np.zeros_like(blended_test)
adj_test[:, 0] = blended_test[:, 0] / t0
adj_test[:, 1] = blended_test[:, 1] / t1
adj_test[:, 2] = blended_test[:, 2] / t2

final_preds = np.argmax(adj_test, axis=1)
submission['Y_Class'] = final_preds
submission.to_csv('dataset/submission_advanced_optuna.csv', index=False)
print("Saved final submission to dataset/submission_advanced_optuna.csv")
print("Done!")
