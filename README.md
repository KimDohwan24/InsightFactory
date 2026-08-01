# InsightFactory

LG Aimers 스마트 공장 제품 품질 상태 분류 해커톤 기반의 포트폴리오 프로젝트입니다.

## 🚀 프로젝트 목표
- 스마트 공장 센서 데이터를 이용한 제품 품질(정상/불량) 예측 모델 개발
- FastAPI 기반의 AI 백엔드 서버와 C# .NET 기반 프론트엔드(App) 모니터링 대시보드 구축

## 📂 폴더 구조
- `.agents/`: AI 에이전트(Antigravity)를 위한 룰(AGENT.md)과 커스텀 스킬
- `backend/`: FastAPI 및 머신러닝 파이프라인
  - `app/`: FastAPI 라우팅 및 스키마
  - `dataset/`: 원본 및 전처리된 데이터 보관 (Git에 포함되지 않음)
  - `models/`: 학습 완료된 머신러닝 모델(.pkl) 보관 (Git에 포함되지 않음)
  - `notebooks/`: 탐색적 데이터 분석(EDA) 및 실험용 주피터 노트북
  - `src/`: 재사용 가능한 전처리, 튜닝 및 학습 파이썬 스크립트 모듈
- `frontend/`: C# .NET 클라이언트 앱 (대시보드 UI)
- `docs/`: 프로젝트 관련 기획서 및 문서 보관
