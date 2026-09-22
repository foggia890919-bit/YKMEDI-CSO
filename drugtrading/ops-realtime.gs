/**
 * YK CSO · 통계제출현황 → 영업포털 실시간 연동 (Google Apps Script)
 *
 * 붙이는 곳: 원본 「통계제출현황」 스프레드시트 → 확장 프로그램 → Apps Script → 이 코드 붙여넣기
 * 1) 아래 PORTAL_URL / SECRET 을 채운다 (SECRET = Vercel 환경변수 CRON_SECRET 값)
 * 2) 함수 목록에서 setup 을 한 번 실행 (권한 허용) → 「편집 시」 트리거가 설치된다
 * 3) 이후 직원이 필터링 탭(TABS)의 셀을 고치면 45초 뒤 한 번 포털을 불러 사본 복사 + 거래가능유무 반영
 *    (연속 편집은 한 번으로 묶이고, 포털 쪽도 60초 안 재호출은 건너뛴다 → 구글 읽기 한도 안전)
 */
var PORTAL_URL = "https://yk-marketing.vercel.app/api/cron/ops-copy?src=edit";
var SECRET = "여기에_CRON_SECRET";
var TABS = ["필터링", "★필터링(81신규건)"]; // 포털 설정 CSO_OPS_FILTER_TABS 와 같게
var DELAY_SEC = 45;

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "onSheetEdit") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("onSheetEdit").forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  SpreadsheetApp.getActive().toast("실시간 연동 트리거 설치 완료", "YK CSO", 5);
}

function norm(s) { return String(s || "").replace(/\s/g, "").replace(/[★☆]/g, "").replace(/（/g, "(").replace(/）/g, ")").toLowerCase(); }

function onSheetEdit(e) {
  try {
    var name = e && e.range ? e.range.getSheet().getName() : "";
    var hit = TABS.some(function (t) { return norm(t) === norm(name) || norm(name).indexOf(norm(t)) !== -1; });
    if (!hit) return;
    var cache = CacheService.getScriptCache();
    if (cache.get("pending")) return; // 이미 예약됨 → 이번 편집은 같은 호출에 묶인다
    cache.put("pending", "1", DELAY_SEC + 30);
    ScriptApp.newTrigger("pushToPortal").timeBased().after(DELAY_SEC * 1000).create();
  } catch (err) { console.error(err); }
}

function pushToPortal() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "pushToPortal") ScriptApp.deleteTrigger(t); });
  CacheService.getScriptCache().remove("pending");
  var res = UrlFetchApp.fetch(PORTAL_URL, { method: "get", headers: { Authorization: "Bearer " + SECRET }, muteHttpExceptions: true, followRedirects: true });
  var code = res.getResponseCode(), body = res.getContentText();
  console.log("portal " + code + " " + body.slice(0, 300));
  if (code !== 200) SpreadsheetApp.getActive().toast("포털 반영 실패 (" + code + ")", "YK CSO", 8);
}

/** 수동 확인용: 지금 바로 한 번 보내기 */
function pushNow() { pushToPortal(); }
