# InsightFactory

LG Aimers 스마트 공장 제품 품질 상태 분류 해커톤 기반의 포트폴리오 프로젝트입니다.
데이터를 기반으로 불량품을 분류하고, 인사이트를 제공하는 종합 솔루션입니다.

##  프로젝트 목표 및 주요 성과
- **스마트 공장 품질 예측**: 센서 데이터를 이용한 제품 품질(정상/불량) 예측 모델 개발
- **머신러닝 앙상블 고도화**: LightGBM, XGBoost, CatBoost 및 SMOTE 기법을 결합하여 데이터 불균형 문제를 극복하고 **F1 Score 0.73+** 를 달성했습니다.
- **초정밀 튜닝**: Optuna를 활용한 하이퍼파라미터 튜닝 및 예측 결과의 앙상블 가중치, 임계값(Threshold) 동적 최적화
- **분리형 아키텍처**: FastAPI 기반의 AI 백엔드 서버와 C# .NET 기반 프론트엔드(App) 모니터링 대시보드 구축

## 프로젝트 구조 (Architecture)
본 프로젝트는 백엔드(Python/FastAPI)와 프론트엔드(C# .NET)가 분리된 구조로 설계되었습니다.

- `.agents/`: AI 에이전트(Antigravity)를 위한 룰(AGENT.md)과 커스텀 스킬
- `backend/`: FastAPI 및 머신러닝 파이프라인
  - `app/`: FastAPI 라우팅 및 스키마
  - `dataset/`: 원본 및 전처리된 데이터 보관 (Git에 포함되지 않음)
  - `models/`: 학습 완료된 머신러닝 모델 보관 (Git에 포함되지 않음)
  - `notebooks/`: 탐색적 데이터 분석(EDA) 및 실험용 주피터 노트북
  - `src/`: 재사용 가능한 파이썬 스크립트 모듈
- `frontend/`: C# .NET 클라이언트 앱 (대시보드 UI)
- `docs/`: 프로젝트 관련 문서 보관

## 시작하기 (백엔드)
```bash
cd backend
pip install -r requirements.txt
