/**
 * =========================================================
 * 폰드림 문의 접수 백엔드 (Google Apps Script)
 * ---------------------------------------------------------
 * 기능:
 *  1. 홈페이지 문의 폼 → 구글 시트에 자동 저장
 *  2. 사장님(관리자)에게 문자(SMS) 자동 발송  — 알리고 or 솔라피
 *  3. (선택) 고객에게 접수완료 카카오 알림톡/문자 자동 발송
 *
 * 설치 방법은 backend/README.md 를 따라 하세요. (10분 소요)
 * =========================================================
 */

const CONFIG = {
  // ── 시트 설정 ─────────────────────────────────────────
  SHEET_NAME: "문의목록",

  // ── 관리자 알림 받을 번호 (사장님 휴대폰) ─────────────
  ADMIN_PHONE: "01000000000",

  // ── 발신번호 (통신사에 사전 등록된 번호여야 함) ───────
  SENDER_PHONE: "01000000000",

  // ── 문자 발송 업체 선택: "aligo" 또는 "solapi" ────────
  SMS_PROVIDER: "aligo",

  // [알리고 smartsms.aligo.in] — 가입 후 발급
  ALIGO_API_KEY: "",
  ALIGO_USER_ID: "",

  // [솔라피 solapi.com] — 가입 후 발급
  SOLAPI_API_KEY: "",
  SOLAPI_API_SECRET: "",

  // ── 카카오 알림톡 (솔라피 카카오채널 연동 시) ─────────
  // 비워두면 알림톡 대신 고객에게도 SMS로 발송됩니다.
  KAKAO_PF_ID: "",        // 솔라피에 등록한 카카오채널 pfId
  KAKAO_TEMPLATE_ID: "",  // 승인받은 알림톡 템플릿 ID

  // ── 고객에게 접수완료 자동응답 발송 여부 ──────────────
  SEND_CUSTOMER_REPLY: true,

  // ── 관리자페이지(admin.html) 조회용 비밀 토큰 (아무 문자열) ──
  ADMIN_TOKEN: "바꿔주세요-임의의-긴-문자열",
};

/* ───────────────────────── 문의 접수 (POST) ───────────────────────── */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1) 시트에 저장
    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      data.name || "",
      data.phone || "",
      data.model || "",
      data.currentCarrier || "",
      data.joinType || "",
      data.contactMethod || "",
      data.message || "",
      data.page || "",
      "신규", // 처리상태
    ]);

    // 2) 관리자에게 문자 알림
    const adminMsg =
      "[홈페이지 문의]\n" +
      "이름: " + data.name + "\n" +
      "연락처: " + data.phone + "\n" +
      "기종: " + (data.model || "-") + "\n" +
      "유형: " + (data.joinType || "-") + " / " + (data.currentCarrier || "-") + "\n" +
      "상담: " + (data.contactMethod || "-") +
      (data.message ? "\n내용: " + truncate_(data.message, 60) : "");
    sendSms_(CONFIG.ADMIN_PHONE, adminMsg);

    // 3) 고객에게 접수완료 알림 (알림톡 우선, 미설정 시 SMS)
    if (CONFIG.SEND_CUSTOMER_REPLY && data.phone) {
      const customerPhone = String(data.phone).replace(/[^0-9]/g, "");
      const customerMsg =
        "[폰드림] " + data.name + "님, 문의가 정상 접수되었습니다.\n" +
        "영업시간 내 " + (data.contactMethod || "전화") + "로 빠르게 연락드리겠습니다. 감사합니다!";
      if (CONFIG.KAKAO_PF_ID && CONFIG.KAKAO_TEMPLATE_ID) {
        sendKakaoAlimtalk_(customerPhone, { name: data.name, method: data.contactMethod || "전화" }, customerMsg);
      } else {
        sendSms_(customerPhone, customerMsg);
      }
    }

    return json_({ ok: true });
  } catch (err) {
    Logger.log(err);
    return json_({ ok: false, error: String(err) });
  }
}

/* ─────────────────── 문의 목록 조회 (GET, admin.html용) ─────────────────── */
function doGet(e) {
  const p = e.parameter || {};
  if (p.token !== CONFIG.ADMIN_TOKEN) return json_({ ok: false, error: "unauthorized" });

  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const header = rows.shift();
  const list = rows.reverse().slice(0, Number(p.limit) || 100).map(function (r) {
    const o = {};
    header.forEach(function (h, i) { o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
  return json_({ ok: true, list: list });
}

/* ───────────────────────── 시트 헬퍼 ───────────────────────── */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(["접수일시", "이름", "연락처", "희망기종", "현재통신사", "가입유형", "상담방법", "문의내용", "유입페이지", "처리상태"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* ───────────────────────── SMS 발송 ───────────────────────── */
function sendSms_(to, text) {
  to = String(to).replace(/[^0-9]/g, "");
  if (!to) return;
  if (CONFIG.SMS_PROVIDER === "aligo") return sendSmsAligo_(to, text);
  if (CONFIG.SMS_PROVIDER === "solapi") return sendSmsSolapi_(to, text);
  Logger.log("SMS_PROVIDER 미설정 — 발송 생략: " + text);
}

/* 알리고 (https://smartsms.aligo.in) — 가장 간단, 건당 SMS 8원대 */
function sendSmsAligo_(to, text) {
  if (!CONFIG.ALIGO_API_KEY) return Logger.log("알리고 API키 미설정");
  const res = UrlFetchApp.fetch("https://apis.aligo.in/send/", {
    method: "post",
    payload: {
      key: CONFIG.ALIGO_API_KEY,
      user_id: CONFIG.ALIGO_USER_ID,
      sender: CONFIG.SENDER_PHONE,
      receiver: to,
      msg: text,
      msg_type: text.length > 45 ? "LMS" : "SMS",
      title: "[폰드림] 문의 알림",
    },
    muteHttpExceptions: true,
  });
  Logger.log("aligo: " + res.getContentText());
}

/* 솔라피 (https://solapi.com) — 알림톡까지 한 곳에서 처리 가능 */
function sendSmsSolapi_(to, text) {
  if (!CONFIG.SOLAPI_API_KEY) return Logger.log("솔라피 API키 미설정");
  const res = UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: solapiAuth_() },
    payload: JSON.stringify({
      message: { to: to, from: CONFIG.SENDER_PHONE, text: text },
    }),
    muteHttpExceptions: true,
  });
  Logger.log("solapi: " + res.getContentText());
}

/* 솔라피 카카오 알림톡 — 템플릿 변수는 승인받은 템플릿에 맞게 수정하세요 */
function sendKakaoAlimtalk_(to, vars, fallbackText) {
  const res = UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: solapiAuth_() },
    payload: JSON.stringify({
      message: {
        to: to,
        from: CONFIG.SENDER_PHONE,
        text: fallbackText, // 알림톡 실패 시 문자로 대체 발송
        kakaoOptions: {
          pfId: CONFIG.KAKAO_PF_ID,
          templateId: CONFIG.KAKAO_TEMPLATE_ID,
          variables: { "#{이름}": vars.name, "#{상담방법}": vars.method },
        },
      },
    }),
    muteHttpExceptions: true,
  });
  Logger.log("alimtalk: " + res.getContentText());
}

/* 솔라피 HMAC 인증 헤더 */
function solapiAuth_() {
  const dateTime = new Date().toISOString();
  const salt = Utilities.getUuid();
  const sig = Utilities.computeHmacSha256Signature(dateTime + salt, CONFIG.SOLAPI_API_SECRET)
    .map(function (b) { return ("0" + (b & 0xff).toString(16)).slice(-2); })
    .join("");
  return "HMAC-SHA256 apiKey=" + CONFIG.SOLAPI_API_KEY + ", date=" + dateTime + ", salt=" + salt + ", signature=" + sig;
}

/* ───────────────────────── 유틸 ───────────────────────── */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function truncate_(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

/* 발송 테스트용 — Apps Script 편집기에서 직접 실행해 보세요 */
function testSms() {
  sendSms_(CONFIG.ADMIN_PHONE, "[폰드림] 문자 발송 테스트입니다.");
}
