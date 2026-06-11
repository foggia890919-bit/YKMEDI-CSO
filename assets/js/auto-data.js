/* =========================================================
   자동 갱신 데이터 — 이 파일은 GitHub Actions가 매일 덮어씁니다.
   직접 수정하지 마세요. (수동 시세 관리는 data.js에서)
   설정 방법: docs/시세자동화-가이드.md
   - official: 기종별·통신사별 최고 요금제 기준 공시지원금 덮어쓰기
   - officialByPlan: 요금제 구간별 공시지원금 [[요금제월액, 지원금], ...]
   - support: 기종별·통신사별 총지원금(유지조건 기준) 덮어쓰기 { mnp, chg }
   ========================================================= */
const AUTO_DATA = {
  generatedAt: null,   // 마지막 자동 갱신 시각 (null이면 data.js 수동값 사용)
  source: null,        // "sheet" | "datagov"
  official: {},
  officialByPlan: {},
  support: {},
};
