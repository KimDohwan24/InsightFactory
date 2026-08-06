import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
import joblib
import warnings
import os
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder
from sklearn.impute import SimpleImputer

warnings.filterwarnings('ignore')

# 1. 데이터 불러오기
print("Loading data...")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

train_df = pd.read_csv(os.path.join(DATA_DIR, 'train.csv'))
test_df = pd.read_csv(os.path.join(DATA_DIR, 'test.csv'))
submission = pd.read_csv(os.path.join(DATA_DIR, 'sample_submission.csv'))

# 2. X, y 분리 및 불필요한 변수 제거
y_train = train_df['Y_Class']
drop_cols = ['PRODUCT_ID', 'TIMESTAMP', 'Y_Class', 'Y_Quality']
X_train = train_df.drop(columns=drop_cols)
X_test = test_df.drop(columns=['PRODUCT_ID', 'TIMESTAMP'])

print(f"Initial X_train shape: {X_train.shape}")
print(f"Initial X_test shape: {X_test.shape}")

# 'LINE', 'PRODUCT_CODE' 변수 처리는 파이프라인에서 진행합니다.
cat_cols = ['LINE', 'PRODUCT_CODE']

# pipeline에 넣기 위해 임시로 encoding
X_train_temp = X_train.copy()
for col in cat_cols:
    X_train_temp[col] = X_train_temp[col].astype(str)
    unique_vals = X_train_temp[col].unique()
    val_map = {val: i for i, val in enumerate(unique_vals)}
    X_train_temp[col] = X_train_temp[col].map(val_map).fillna(-1)

# 4. 결측치 및 분산 처리
print("Handling missing values and zero variance...")

# 100% 결측치인 컬럼 찾기
all_nan_cols = X_train.columns[X_train.isnull().all()]
X_train_temp.drop(columns=all_nan_cols, inplace=True)

# 결측치를 0으로 채우기 (임시)
X_train_temp.fillna(0, inplace=True)

# 분산이 0인 컬럼 찾기
zero_var_cols = []
for col in X_train_temp.columns:
    if X_train_temp[col].std() == 0:
        zero_var_cols.append(col)

valid_cols = [c for c in X_train.columns if c not in all_nan_cols and c not in zero_var_cols]
selected_cat_cols = [c for c in cat_cols if c in valid_cols]
selected_num_cols = [c for c in valid_cols if c not in cat_cols]

print(f"Final valid features count: {len(valid_cols)}")

# 5. 모델 학습 및 평가 (Random Forest)
print("Evaluating model with Cross Validation...")
# class_weight='balanced'를 통해 데이터 불균형 문제 완화 (Macro F1 최적화)
rf_model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced', n_jobs=-1)

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), selected_cat_cols),
        ('num', SimpleImputer(strategy='constant', fill_value=0), selected_num_cols)
    ],
    remainder='drop'
)

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', rf_model)
])

# 교차 검증을 통한 Macro F1 Score 평가
# cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='f1_macro')
# print(f"5-Fold CV Macro F1 Score: {cv_scores.mean():.4f} (± {cv_scores.std():.4f})")

print("\nTraining final model on full train data...")
pipeline.fit(X_train, y_train)

# 6. 예측 및 제출 파일 생성
print("Predicting test data...")
preds = pipeline.predict(X_test)

submission['Y_Class'] = preds
os.makedirs(DATA_DIR, exist_ok=True)
submission_path = os.path.join(DATA_DIR, 'submission_rf_final.csv')
submission.to_csv(submission_path, index=False)
print(f"Saved submission to {submission_path}")

# 7. 모델을 파일로 저장
os.makedirs(MODEL_DIR, exist_ok=True)
model_path = os.path.join(MODEL_DIR, 'random_forest_model.joblib')
joblib.dump(pipeline, model_path)
print(f"Model saved to {model_path}")
print("Done!")
