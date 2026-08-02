---
name: github_flow
description: 이 스킬은 Git/GitHub를 사용할 때 브랜치를 생성하고, 커밋 메시지 컨벤션을 지키며 작업을 수행하도록 돕는 가이드입니다.
---

# GitHub Flow Skill

이 스킬은 프로젝트 내에서 버전 관리를 수행할 때 호출됩니다.

## 1. GitHub 협업 및 버전 관리 전략 (Git Flow)
* **브랜치 전략 (GitHub Flow 변형)**:
  * `main`: 언제든 배포 가능한 프로덕션 환경의 브랜치.
  * `develop`: 다음 출시를 위해 개발하는 기능들이 모이는 브랜치.
  * `feature/*`: 새로운 기능 개발 (예: `feature/eda`, `feature/lgbm-model`, `feature/streamlit-ui`).
  * `fix/*`: 버그 수정.
* **커밋 메시지 컨벤션 (Karma 컨벤션 적용)**:
  * `feat:` 새로운 기능 추가 (예: `feat: Optuna 튜닝 파이프라인 추가`)
  * `fix:` 버그 수정
  * `docs:` 문서 수정 (README 등)
  * `style:` 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
  * `refactor:` 코드 리팩토링
  * `test:` 테스트 코드, 리팩토링 테스트 코드 추가
  * `chore:` 빌드 업무 수정, 패키지 매니저 수정 (.gitignore 수정 등)
* **PR (Pull Request)**: `feature` 브랜치에서 작업이 끝나면 `develop`으로 PR을 올려 리뷰 후 병합하는 것을 원칙으로 합니다.

## 2. 작업 지침
1. **상태 확인**: 항상 `git status`를 확인하여 현재 브랜치와 변경된 파일을 파악하세요.
2. **브랜치 생성**: 새로운 작업을 시작할 때는 `git checkout -b feature/기능명` 형식으로 브랜치를 생성하세요.
3. **커밋 메시지 작성**: 위에 정의된 커밋 메시지 컨벤션을 따르세요.
   - 예: `git commit -m "feat: 데이터 전처리 함수 추가"`
4. **Push 전 주의사항**: `backend/dataset/` 폴더나 대용량 파일(.csv, .pkl 등)이 스테이징되지 않았는지 반드시 확인하세요. `.gitignore`가 올바르게 작동하는지 체크합니다.
