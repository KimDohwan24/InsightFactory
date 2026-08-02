# InsightFactory

InsightFactory는 데이터를 기반으로 불량품을 분류하고, 인사이트를 제공하는 종합 솔루션입니다.

## 📂 프로젝트 구조 (Architecture)

본 프로젝트는 백엔드(Python/FastAPI)와 프론트엔드(C# .NET)가 분리된 구조로 설계되었습니다.

- `backend/`: 머신러닝 파이프라인(전처리, 튜닝, 학습 등)과 예측 API를 제공하는 FastAPI 서버 코드
- `frontend/`: 백엔드 API와 통신하여 결과를 시각적으로 보여주는 C# .NET 기반 클라이언트(App) 대시보드
- `docs/`: 프로젝트 관련 문서 보관
- `.agents/`: AI 에이전트를 위한 룰 및 스킬 정의

## 🚀 백엔드 주요 기능
- **머신러닝 앙상블**: LightGBM, XGBoost, CatBoost 및 SMOTE 기법을 결합하여 데이터 불균형 문제를 극복하고 F1 Score를 극대화(0.73+)했습니다.
- **Optuna 하이퍼파라미터 및 임계값 튜닝**: 모델의 파라미터뿐 아니라 예측 결과의 가중치와 임계값을 동적으로 튜닝하는 알고리즘이 적용되어 있습니다.

## ⚙️ 시작하기
백엔드 환경 구성:
```bash
cd backend
pip install -r requirements.txt
```
