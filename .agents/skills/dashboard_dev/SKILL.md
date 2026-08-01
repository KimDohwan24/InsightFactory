---
name: dashboard_dev
description: Streamlit을 활용하여 모델의 결과를 시각화하고 웹 대시보드를 구축하는 가이드입니다.
---

# Dashboard Dev Skill

이 스킬은 사용자가 인터랙티브하게 데이터를 탐색하고 모델의 예측결과를 확인할 수 있는 Streamlit 웹 앱 개발 시 활용됩니다.

## 지침
1. **모듈화**: 기능별로 페이지나 컴포넌트를 분리하세요. (예: `app.py` 메인 파일과 `components/` 폴더 내 개별 뷰)
2. **시각적 완성도**: Streamlit의 `st.columns`, `st.expander`, `st.metric` 등을 적극 활용하여 단순한 차트 나열이 아닌 '제품' 느낌이 나도록 디자인하세요.
3. **사용자 경험 (UX)**: 모델을 추론하는 동안(Loading) 상태를 보여주는 `st.spinner` 등을 사용하고, 불량 판정 시 알림(Warning/Error box)을 명확하게 표시하세요.
4. **XAI 연동**: SHAP 모델 설명력을 대시보드 내에 시각화(`st.pyplot` 등)하여, "왜 이 제품이 기준 미달로 예측되었는지" 직관적으로 설명하세요.
