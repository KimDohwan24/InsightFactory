# InsightFactory Project Agent Rules (AGENT.md)

이 문서는 InsightFactory 프로젝트(스마트 공장 제품 품질 예측 AI 및 대시보드)를 진행하는 AI 에이전트가 반드시 준수해야 할 기본 가이드라인입니다.

> **💡 [중요] Git 작업 관련 지침**
> 사용자가 "깃에 올려달라", "커밋해라", "버전 관리를 해달라" 등의 Git 관련 작업을 요청할 경우, 에이전트는 독단적으로 판단하지 말고 **반드시 `github_flow` 스킬(.agents/skills/github_flow/SKILL.md)을 먼저 확인하고** 해당 브랜치 생성 전략과 커밋 메시지 컨벤션(Karma)에 맞춰 작업을 진행해야 합니다.

## 1. 코드 및 프로젝트 구조 컨벤션
* **언어 및 프레임워크**: Python 3.10+, Pandas, Scikit-learn, LightGBM, XGBoost, CatBoost, Optuna, FastAPI
* **디렉토리 구조**:
  * `backend/`: FastAPI 및 머신러닝 파이프라인
    * `backend/dataset/`: 원본 및 전처리된 데이터 (Git 제외)
    * `backend/notebooks/`: EDA 및 실험용 주피터 노트북
    * `backend/src/`: 데이터 전처리, 튜닝 및 학습 파이썬 모듈
    * `backend/app/`: FastAPI 웹 서버 라우팅 및 스키마
    * `backend/models/`: 학습 완료된 모델 파일 보관 (Git 제외)
  * `frontend/`: C# .NET 기반 클라이언트 앱 소스코드
* **코딩 스탠다드**:
  * PEP8 규격 준수.
  * 함수와 클래스에는 반드시 Docstring(Google Style)을 작성하여 역할, 파라미터, 반환값을 명시합니다.
  * 타입 힌팅(Type Hinting)을 적극적으로 사용합니다. (예: `def process_data(df: pd.DataFrame) -> pd.DataFrame:`)

## 2. 데이터 분석 및 모델링 규칙
* 데이터 로드 후 결측치 및 타겟 변수 불균형 상태를 항상 먼저 리포팅합니다.
* Random Seed는 항상 42(또는 특정 값)로 고정하여 결과의 재현성(Reproducibility)을 보장합니다.
* 모델 평가는 대회 지표인 **Macro F1 Score**를 최우선으로 합니다.

## 3. UI/UX (웹 대시보드) 원칙
* 대시보드 구축 시 미려하고 현대적인 디자인을 적용합니다.
* 사용자가 직관적으로 불량 원인(SHAP 등)을 파악할 수 있도록 시각화 위주의 컴포넌트를 구성합니다.
