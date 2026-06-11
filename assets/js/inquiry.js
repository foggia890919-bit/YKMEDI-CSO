/* =========================================================
   문의 폼 — Google Apps Script 백엔드로 전송
   (저장: 구글시트 / 알림: 문자(SMS)·카카오 알림톡 자동 발송)
   설정 방법: backend/README.md 참고
   ========================================================= */

function initInquiryForm(formEl) {
  const msgEl = formEl.querySelector(".form__msg");

  // URL 파라미터로 기종 미리 선택 (상세페이지 → 구매신청 연동)
  const params = new URLSearchParams(location.search);
  const preModel = params.get("model");
  if (preModel) {
    const sel = formEl.querySelector('[name="model"]');
    if (sel) {
      [...sel.options].forEach((o) => { if (o.value === preModel) sel.value = preModel; });
    }
  }

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.className = "form__msg";

    const fd = new FormData(formEl);
    const data = Object.fromEntries(fd.entries());

    // 유효성 검사
    if (!data.name || !data.name.trim()) return showMsg("err", "성함을 입력해 주세요.");
    const phoneDigits = (data.phone || "").replace(/[^0-9]/g, "");
    if (phoneDigits.length < 10) return showMsg("err", "연락처를 정확히 입력해 주세요.");
    if (!formEl.querySelector('[name="agree"]').checked)
      return showMsg("err", "개인정보 수집·이용에 동의해 주세요.");

    data.phone = phoneDigits.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    data.page = location.pathname + location.search;
    data.userAgent = navigator.userAgent;
    data.submittedAt = new Date().toISOString();

    const btn = formEl.querySelector(".form__submit");
    btn.disabled = true;
    btn.textContent = "접수 중...";

    try {
      if (!SITE_CONFIG.inquiryEndpoint) {
        // 백엔드 미연결 시: 로컬 저장으로 데모 동작 (admin.html에서 확인 가능)
        const saved = JSON.parse(localStorage.getItem("inquiries") || "[]");
        saved.unshift(data);
        localStorage.setItem("inquiries", JSON.stringify(saved));
        console.warn("[문의] inquiryEndpoint가 설정되지 않아 localStorage에만 저장되었습니다. backend/README.md를 참고해 연동하세요.");
      } else {
        // Content-Type을 text/plain으로 보내면 CORS preflight 없이 Apps Script가 수신 가능
        const res = await fetch(SITE_CONFIG.inquiryEndpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) throw new Error(json.error || "전송 실패");
      }

      trackLead(); // 메타/구글 광고 전환 이벤트
      formEl.reset();
      showMsg("ok", "✅ 문의가 접수되었습니다! 영업시간 내 빠르게 연락드리겠습니다.");
    } catch (err) {
      console.error(err);
      showMsg("err", "전송에 실패했습니다. 잠시 후 다시 시도하시거나 전화/카톡으로 문의해 주세요.");
    } finally {
      btn.disabled = false;
      btn.textContent = "상담 신청하기";
    }
  });

  function showMsg(type, text) {
    msgEl.textContent = text;
    msgEl.className = "form__msg is-" + (type === "ok" ? "ok" : "err");
    return false;
  }
}

/* 문의 폼 HTML 생성 (index.html / goods.html 공용) */
function inquiryFormHtml() {
  const modelOptions = PHONES.map((p) => `<option value="${p.name} ${p.storage}">${p.name} (${p.storage})</option>`).join("");
  return `
  <form class="form" id="inquiry-form" novalidate>
    <div class="form__row">
      <div class="form__group">
        <label>성함 <span class="req">*</span></label>
        <input type="text" name="name" placeholder="홍길동" autocomplete="name">
      </div>
      <div class="form__group">
        <label>연락처 <span class="req">*</span></label>
        <input type="tel" name="phone" placeholder="010-1234-5678" autocomplete="tel" inputmode="numeric">
      </div>
    </div>
    <div class="form__row">
      <div class="form__group">
        <label>희망 기종</label>
        <select name="model">
          <option value="">선택해 주세요</option>
          ${modelOptions}
          <option value="기타/상담 후 결정">기타 / 상담 후 결정</option>
        </select>
      </div>
      <div class="form__group">
        <label>현재 통신사</label>
        <select name="currentCarrier">
          <option value="">선택해 주세요</option>
          <option>SKT</option><option>KT</option><option>LG U+</option><option>알뜰폰</option>
        </select>
      </div>
    </div>
    <div class="form__group">
      <label>가입 유형</label>
      <div class="form__chips">
        <label class="chip"><input type="radio" name="joinType" value="번호이동" checked><span>번호이동</span></label>
        <label class="chip"><input type="radio" name="joinType" value="기기변경"><span>기기변경</span></label>
        <label class="chip"><input type="radio" name="joinType" value="신규가입"><span>신규가입</span></label>
        <label class="chip"><input type="radio" name="joinType" value="잘 모르겠어요"><span>잘 모르겠어요</span></label>
      </div>
    </div>
    <div class="form__group">
      <label>상담 방법</label>
      <div class="form__chips">
        <label class="chip"><input type="radio" name="contactMethod" value="전화" checked><span>📞 전화</span></label>
        <label class="chip"><input type="radio" name="contactMethod" value="문자"><span>💬 문자</span></label>
        <label class="chip"><input type="radio" name="contactMethod" value="카카오톡"><span>🟡 카카오톡</span></label>
      </div>
    </div>
    <div class="form__group">
      <label>문의 내용</label>
      <textarea name="message" placeholder="궁금하신 점을 자유롭게 남겨주세요. (예: 위약금이 남아있는데 갈아탈 수 있을까요?)"></textarea>
    </div>
    <label class="form__agree">
      <input type="checkbox" name="agree">
      <span>[필수] 개인정보 수집·이용에 동의합니다. 수집 항목: 성함, 연락처, 문의 내용 / 이용 목적: 상담 및 안내 연락 / 보유 기간: 상담 완료 후 1년</span>
    </label>
    <button type="submit" class="btn btn--blue form__submit">상담 신청하기</button>
    <div class="form__msg"></div>
  </form>`;
}
