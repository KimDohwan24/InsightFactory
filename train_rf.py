import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
import joblib
import warnings
warnings.filterwarnings('ignore')

# 1. 데이터 불러오기
print("Loading data...")
train_df = pd.read_csv('dataset/train.csv')
test_df = pd.read_csv('dataset/test.csv')
submission = pd.read_csv('dataset/sample_submission.csv')

# 2. X, y 분리 및 불필요한 변수 제거
y_train = train_df['Y_Class']
drop_cols = ['PRODUCT_ID', 'TIMESTAMP', 'Y_Class', 'Y_Quality']
X_train = train_df.drop(columns=drop_cols)
X_test = test_df.drop(columns=['PRODUCT_ID', 'TIMESTAMP'])

print(f"Initial X_train shape: {X_train.shape}")
print(f"Initial X_test shape: {X_test.shape}")

# 3. 범주형 변수 Label Encoding
# 'LINE', 'PRODUCT_CODE' 변수 처리
cat_cols = ['LINE', 'PRODUCT_CODE']
for col in cat_cols:
    le = LabelEncoder()
    # train, test 데이터를 모두 합쳐서 피팅하여 라벨이 누락되지 않도록 함 (안전을 위해)
    le.fit(pd.concat([X_train[col], X_test[col]]))
    X_train[col] = le.transform(X_train[col])
    X_test[col] = le.transform(X_test[col])

# 4. 결측치 및 분산 처리
print("Handling missing values and zero variance...")

# 100% 결측치인 컬럼 찾기
all_nan_cols = X_train.columns[X_train.isnull().all()]
X_train.drop(columns=all_nan_cols, inplace=True)
X_test.drop(columns=all_nan_cols, inplace=True)

# 결측치를 0으로 채우기 (랜덤포레스트는 0을 하나의 값/패턴으로 인식 가능)
X_train.fillna(0, inplace=True)
X_test.fillna(0, inplace=True)

# 분산이 0인(단일 값만 가지는) 컬럼 찾기
# std == 0 인 컬럼 식별
zero_var_cols = []
for col in X_train.columns:
    if X_train[col].std() == 0:
        zero_var_cols.append(col)

X_train.drop(columns=zero_var_cols, inplace=True)
X_test.drop(columns=zero_var_cols, inplace=True)

print(f"Final X_train shape after dropping NaN/ZeroVar cols: {X_train.shape}")
print(f"Final X_test shape after dropping NaN/ZeroVar cols: {X_test.shape}")

# 5. 모델 학습 및 평가 (Random Forest)
print("Evaluating model with Cross Validation...")
# class_weight='balanced'를 통해 데이터 불균형 문제 완화 (Macro F1 최적화)
rf_model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced', n_jobs=-1)

# 교차 검증을 통한 Macro F1 Score 평가
cv_scores = cross_val_score(rf_model, X_train, y_train, cv=5, scoring='f1_macro')
print(f"5-Fold CV Macro F1 Score: {cv_scores.mean():.4f} (± {cv_scores.std():.4f})")

print("\nTraining final model on full train data...")
rf_model.fit(X_train, y_train)

# Feature Importance 간단 출력
importances = rf_model.feature_importances_
indices = np.argsort(importances)[::-1]
print("Top 10 Important Features:")
for i in range(10):
    print(f"{i+1}. Feature: {X_train.columns[indices[i]]} (Score: {importances[indices[i]]:.4f})")

# 6. 예측 및 제출 파일 생성
print("Predicting test data...")
preds = rf_model.predict(X_test)

submission['Y_Class'] = preds
submission.to_csv('dataset/submission_rf_final.csv', index=False)
print("Saved submission to dataset/submission_rf_final.csv")

# 7. 모델을 파일로 저장
joblib.dump(rf_model, 'random_forest_model.pkl')
print("Model saved to random_forest_model.pkl")
print("Done!")
