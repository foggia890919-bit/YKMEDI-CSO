/* =========================================================
   공통 스크립트 — 헤더/푸터/플로팅 렌더링, 시세표, 후기, FAQ
   ========================================================= */

const won = (n) => n.toLocaleString("ko-KR") + "원";

/* ---------- 자동 갱신 데이터 병합 ----------
   GitHub Actions가 매일 갱신하는 auto-data.js(AUTO_DATA)를 PHONES에 덮어씁니다.
   → 시세표/상세/비교/차트 등 모든 페이지가 자동으로 최신 값을 사용 */
(function applyAutoData() {
  if (typeof AUTO_DATA === "undefined" || !AUTO_DATA.generatedAt) return;
  PHONES.forEach((p) => {
    const o = AUTO_DATA.official[p.id];
    if (o) Object.keys(o).forEach((c) => { if (typeof o[c] === "number") (p.official = p.official || {})[c] = o[c]; });
    const s = AUTO_DATA.support[p.id];
    if (s) Object.keys(s).forEach((c) => {
      if (p.support[c]) {
        if (typeof s[c].mnp === "number") p.support[c].mnp = s[c].mnp;
        if (typeof s[c].chg === "number") p.support[c].chg = s[c].chg;
      }
    });
  });
})();

/* ---------- 지원금 계산 (공시지원금 + 번쩍할인 분리) ----------
   - 공시지원금: 통신사 공식 지원금. 요금제 월액에 비례해 변동 (최고 요금제 기준 official 값에서 스케일링)
   - 번쩍할인: 매장 추가 지원금. 가입유형(번호이동/기기변경)에 따라 다르며 요금제와 무관
   - data.js의 support[통신사][유형] = '유지조건 요금제' 기준 (공시 + 번쩍) 합계 */
function requiredPlanOf(phone) {
  const m = phone.plan.match(/([\d,]+)원/);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}
function officialAt(phone, carrier, planMonthly) {
  // 1순위: 자동 수집된 요금제 구간별 공시지원금 (정확값)
  if (typeof AUTO_DATA !== "undefined" && AUTO_DATA.officialByPlan[phone.id]?.[carrier]?.length) {
    const tiers = AUTO_DATA.officialByPlan[phone.id][carrier]; // [[요금제월액, 지원금], ...] 오름차순
    let amt = tiers[0][1];
    for (const [pm, v] of tiers) if (planMonthly >= pm) amt = v;
    return amt;
  }
  // 2순위: 최고 요금제 기준 공시에서 요금제 월액 비례 추정
  const maxOfficial = (phone.official && phone.official[carrier]) || 0;
  const maxPlan = PLANS[carrier][0].monthly;
  const scaled = Math.round((maxOfficial * Math.min(planMonthly, maxPlan)) / maxPlan / 1000) * 1000;
  return Math.min(scaled, maxOfficial);
}
function flashOf(phone, carrier, join) {
  // 시세표 합계(유지조건 요금제 기준)에서 공시를 뺀 나머지가 번쩍할인
  return Math.max(phone.support[carrier][join] - officialAt(phone, carrier, requiredPlanOf(phone)), 0);
}
function totalSupportAt(phone, carrier, join, planMonthly) {
  return officialAt(phone, carrier, planMonthly) + flashOf(phone, carrier, join);
}

/* 실구매가 계산: 음수면 차비(페이백) 지급 */
function finalPrice(phone, carrier, joinType) {
  return phone.price - phone.support[carrier][joinType];
}
function finalPriceHtml(v) {
  if (v <= 0) return `<span class="pt-final pt-final--free">0원 + 차비 ${won(-v)}</span>`;
  return `<span class="pt-final">${won(v)}</span>`;
}

/* ---------- 레이아웃 렌더링 ---------- */
function renderLayout(active) {
  const c = SITE_CONFIG;
  const nav = [
    ["price.html", "실시간 시세표"],
    ["compare.html", "최저가비교"],
    ["chart.html", "AI차트"],
    ["internet.html", "인터넷 결합"],
    ["notice.html", "공지·이벤트"],
    ["qna.html", "상품문의"],
    ["guide.html", "구매 가이드"],
    ["reviews.html", "구매후기"],
  ];
  const links = nav
    .map(([href, label]) => `<a href="${href}" class="${active === href ? "is-active" : ""}">${label}</a>`)
    .join("");

  document.getElementById("layout-header").innerHTML = `
    <div class="topbar">
      <div class="container topbar__inner">
        <span>📱 ${c.slogan}</span>
        <div class="topbar__right">
          <span class="hide-m">상담시간 ${c.openHours}</span>
          <a href="tel:${c.phone.replace(/-/g, "")}">☎ ${c.phone}</a>
        </div>
      </div>
    </div>
    <header class="header">
      <div class="container header__inner">
        <a class="brand" href="index.html">
          <span class="brand__mark">P</span>
          <span>${c.brandName}<small>${c.brandNameEn}</small></span>
        </a>
        <nav class="gnb">
          ${links}
          <button class="gnb__search" aria-label="기종 검색" onclick="toggleSearch()">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </button>
          <a href="index.html#inquiry" class="gnb__cta">문의 남기기</a>
        </nav>
        <button class="header__toggle" aria-label="메뉴 열기" onclick="document.querySelector('.mobile-menu').classList.toggle('is-open')">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    <nav class="mobile-menu">
      ${links}
      <a href="index.html#inquiry" class="gnb__cta">문의 남기기</a>
    </nav>
    <div class="search-overlay" id="search-overlay">
      <div class="search-overlay__box">
        <div class="search-overlay__bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa3b5" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="text" id="search-input" placeholder="기종 검색 (예: S26, 아이폰17, 플립)" autocomplete="off">
          <button onclick="toggleSearch()" aria-label="닫기">✕</button>
        </div>
        <div class="search-overlay__results" id="search-results"></div>
      </div>
    </div>`;

  document.getElementById("layout-footer").innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div>
            <div class="footer__brand">${c.brandName} <small style="font-size:11px;letter-spacing:.15em;">${c.brandNameEn}</small></div>
            <div class="footer__links">
              <a href="price.html">실시간 시세표</a>
              <a href="guide.html">구매 가이드</a>
              <a href="reviews.html">구매후기</a>
              <a href="index.html#inquiry">문의하기</a>
            </div>
            <div>
              상호 ${c.companyName} · 대표 ${c.ceo} · 사업자등록번호 ${c.bizNumber}<br>
              통신판매업신고 ${c.salesRegNumber}${c.preOpenNumber ? " · 사전승낙서 " + c.preOpenNumber : ""}<br>
              주소 ${c.address} · 이메일 ${c.email} · 대표전화 ${c.phone}
            </div>
          </div>
          <div>
            <div style="font-weight:800;color:#fff;margin-bottom:10px;">고객센터</div>
            <div style="font-size:22px;font-weight:900;color:#fff;">${c.phone}</div>
            <div>${c.openHours}</div>
            <a href="${c.kakaoChannelUrl}" target="_blank" rel="noopener" class="btn btn--kakao" style="height:44px;margin-top:12px;font-size:14px;">💬 카카오톡 상담</a>
          </div>
        </div>
        <div class="footer__legal">
          ⓒ ${new Date().getFullYear()} ${c.brandName}. All rights reserved.
          시세표의 금액은 통신사 정책에 따라 매일 변동되며, 실제 구매 금액은 상담 시 안내됩니다.
        </div>
      </div>
    </footer>
    <div class="floating">
      <a class="floating__kakao" href="${c.kakaoChannelUrl}" target="_blank" rel="noopener" aria-label="카카오톡 상담">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.26 4.66 6.65l-.95 3.52c-.08.31.27.56.54.38l4.18-2.78c.51.06 1.03.1 1.57.1 5.52 0 10-3.54 10-7.87S17.52 3 12 3z"/></svg>
      </a>
      <a class="floating__call" href="tel:${c.phone.replace(/-/g, "")}" aria-label="전화 상담">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"/></svg>
      </a>
    </div>`;

  injectTracking();
}

/* ---------- 광고 추적 (메타 픽셀 / GA4) ---------- */
function injectTracking() {
  const c = SITE_CONFIG;
  if (c.metaPixelId && !window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", c.metaPixelId);
    fbq("track", "PageView");
  }
  if (c.ga4Id && !window.gtag) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + c.ga4Id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", c.ga4Id);
  }
}

/* 전환 이벤트 (문의 완료 시 호출 → 메타/구글 광고 최적화에 사용) */
function trackLead() {
  if (window.fbq) fbq("track", "Lead");
  if (window.gtag) gtag("event", "generate_lead", { currency: "KRW", value: 0 });
}

/* ---------- 시세표 렌더링 ---------- */
function renderPriceTable(el, opts = {}) {
  const state = { carrier: "SKT", joinType: "mnp", keyword: "", limit: opts.limit || 0 };

  function rows() {
    let list = PHONES;
    if (state.keyword) {
      const k = state.keyword.replace(/\s/g, "").toLowerCase();
      list = list.filter((p) => (p.name + p.storage).replace(/\s/g, "").toLowerCase().includes(k));
    }
    if (state.limit) list = list.filter((p) => p.hot).slice(0, state.limit);
    return list;
  }

  function render() {
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
    const list = rows();
    el.innerHTML = `
      <div class="price-controls">
        <div class="tabs" role="tablist">
          ${CARRIERS.map((c) => `<button class="tab ${state.carrier === c.id ? "is-active" : ""}" data-carrier="${c.id}">${c.name}</button>`).join("")}
        </div>
        <div class="tabs">
          ${JOIN_TYPES.map((j) => `<button class="tab ${state.joinType === j.id ? "is-active" : ""}" data-join="${j.id}">${j.name}</button>`).join("")}
        </div>
        ${opts.search ? `
        <div class="price-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa3b5" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="text" placeholder="기종 검색 (예: S26, 아이폰17)" value="${state.keyword}">
        </div>` : ""}
      </div>
      <div class="price-table-wrap">
        <table class="price-table">
          <thead>
            <tr><th>모델</th><th>출고가</th><th>공시지원금</th><th>⚡ 번쩍할인</th><th>실구매가</th><th>요금제 조건</th><th></th></tr>
          </thead>
          <tbody>
            ${list.map((p) => {
              const official = officialAt(p, state.carrier, requiredPlanOf(p));
              const flash = flashOf(p, state.carrier, state.joinType);
              const v = p.price - official - flash;
              return `<tr>
                <td class="pt-model">${p.name}${p.badge ? `<span class="pt-badge">${p.badge}</span>` : ""}<small>${p.storage}</small></td>
                <td class="pt-release">${won(p.price)}</td>
                <td class="pt-support">-${won(official)}</td>
                <td class="pt-support" style="color:#e8341f;">-${won(flash)}</td>
                <td>${finalPriceHtml(v)}</td>
                <td class="pt-plan">${p.plan}</td>
                <td><a class="pt-btn" href="goods.html?id=${p.id}">상세보기</a></td>
              </tr>`;
            }).join("") || `<tr><td colspan="7" style="text-align:center;color:#9aa3b5;padding:40px;">검색 결과가 없습니다.</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="price-note">
        ※ ${today} 기준 시세이며 통신사 정책에 따라 실시간 변동됩니다. ·
        ※ 실구매가 = 출고가 − 공시지원금 − ⚡번쩍할인(매장 추가지원) ·
        ※ 공시지원금은 표기된 유지조건 요금제 기준이며, 요금제에 따라 달라집니다 (상세에서 확인) ·
        ※ 제휴카드 / 부가서비스 / 기기반납 조건 없음
      </p>`;

    el.querySelectorAll("[data-carrier]").forEach((b) =>
      b.addEventListener("click", () => { state.carrier = b.dataset.carrier; render(); }));
    el.querySelectorAll("[data-join]").forEach((b) =>
      b.addEventListener("click", () => { state.joinType = b.dataset.join; render(); }));
    const input = el.querySelector(".price-search input");
    if (input) {
      input.addEventListener("input", () => { state.keyword = input.value; render(); el.querySelector(".price-search input").focus(); });
      const v = input.value; input.value = ""; input.value = v;
    }
  }
  render();
}

/* ---------- 후기 렌더링 ---------- */
function renderReviews(el, limit = 0) {
  const list = limit ? REVIEWS.slice(0, limit) : REVIEWS;
  el.innerHTML = list.map((r) => `
    <article class="review">
      <div class="review__stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
      <p class="review__text">${r.text}</p>
      <div class="review__meta"><span><strong>${r.name}</strong> · ${r.model}</span><span>${r.date}</span></div>
    </article>`).join("");
}

/* ---------- FAQ 렌더링 ---------- */
function renderFaq(el) {
  el.innerHTML = FAQS.map((f) => `
    <div class="faq__item">
      <button class="faq__q">${f.q}</button>
      <div class="faq__a">${f.a}</div>
    </div>`).join("");
  el.querySelectorAll(".faq__q").forEach((b) =>
    b.addEventListener("click", () => b.parentElement.classList.toggle("is-open")));
}

/* ---------- 헤더 기종 검색 ---------- */
function toggleSearch() {
  const ov = document.getElementById("search-overlay");
  const open = ov.classList.toggle("is-open");
  if (open) {
    const input = document.getElementById("search-input");
    input.value = "";
    renderSearchResults("");
    setTimeout(() => input.focus(), 50);
    if (!input.dataset.bound) {
      input.dataset.bound = "1";
      input.addEventListener("input", () => renderSearchResults(input.value));
      input.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleSearch(); });
      ov.addEventListener("click", (e) => { if (e.target === ov) toggleSearch(); });
    }
  }
}

function renderSearchResults(keyword) {
  const box = document.getElementById("search-results");
  const k = keyword.replace(/\s/g, "").toLowerCase();
  const list = (k ? PHONES.filter((p) => (p.name + p.storage).replace(/\s/g, "").toLowerCase().includes(k)) : PHONES.filter((p) => p.hot)).slice(0, 8);
  box.innerHTML = list.length
    ? list.map((p) => {
        const v = Math.min(...CARRIERS.map((c) => p.price - p.support[c.id].mnp));
        return `<a href="goods.html?id=${p.id}">
          <span>${p.brand === "apple" ? "📱" : "📲"} <b>${p.name}</b> <small>${p.storage}</small></span>
          <span class="sr-price">${v <= 0 ? "0원 + 차비" : won(v)}~</span></a>`;
      }).join("")
    : `<div class="sr-empty">검색 결과가 없습니다. 원하는 기종이 없다면 문의 남겨주세요!</div>`;
}
