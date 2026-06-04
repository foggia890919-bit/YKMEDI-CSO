/* =========================================================
   MEDILINE PARTNERS — admin console
   Manages the entry popup + scroll sections via MedStore.
   ========================================================= */
(function () {
  'use strict';
  var Store = window.MedStore;

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  // save a config to Supabase (cache already updated by caller)
  function saveToDb(key, value, okMsg) {
    if (!Store.hasBackend || !Store.hasBackend()) { toast('저장됨(로컬). 백엔드 미연결.'); return Promise.resolve(); }
    toast('저장 중...');
    return Store.push(key, value).then(function () { toast(okMsg); }).catch(function (err) { toast('저장 실패: ' + (err.message || err)); });
  }
  function safeExt(name, def) {
    var e = (String(name).split('.').pop() || def).toLowerCase().replace(/[^a-z0-9]/g, '');
    return e || def;
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
      document.querySelectorAll('.panel-view').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      document.getElementById('view-' + t.dataset.tab).classList.add('active');
    });
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* =====================================================
     POPUP MANAGEMENT
     ===================================================== */
  var P = {
    enabled: document.getElementById('p-enabled'),
    eyebrow: document.getElementById('p-eyebrow'),
    title:   document.getElementById('p-title'),
    body:    document.getElementById('p-body'),
    imageUrl:document.getElementById('p-image'),
    btnText: document.getElementById('p-btntext'),
    btnAction: document.getElementById('p-btnaction'),
    btnUrl:  document.getElementById('p-btnurl')
  };

  function loadPopup() {
    var p = Store.getPopup();
    P.enabled.checked = !!p.enabled;
    P.eyebrow.value = p.eyebrow || '';
    P.title.value = p.title || '';
    P.body.value = p.body || '';
    P.imageUrl.value = p.imageUrl || '';
    P.btnText.value = p.btnText || '';
    P.btnAction.value = p.btnAction || 'order';
    P.btnUrl.value = p.btnUrl || '';
    syncPopupUrlVisibility();
    renderPopupPreview();
  }
  function gatherPopup() {
    return {
      enabled: P.enabled.checked,
      eyebrow: P.eyebrow.value.trim(),
      title: P.title.value.trim(),
      body: P.body.value.trim(),
      imageUrl: P.imageUrl.value.trim(),
      btnText: P.btnText.value.trim(),
      btnAction: P.btnAction.value,
      btnUrl: P.btnUrl.value.trim()
    };
  }
  function syncPopupUrlVisibility() {
    document.getElementById('p-btnurl-row').style.display = (P.btnAction.value === 'url') ? '' : 'none';
  }
  function renderPopupPreview() {
    var c = gatherPopup();
    var host = document.getElementById('popup-preview');
    if (!c.enabled) { host.innerHTML = '<div class="prev-off">팝업이 꺼져 있습니다.</div>'; return; }
    host.innerHTML =
      '<div class="pp-card">' +
        (c.imageUrl ? '<img class="pp-img" src="' + esc(c.imageUrl) + '" alt="" onerror="this.style.display=\'none\'">' : '') +
        '<div class="pp-body">' +
          (c.eyebrow ? '<p class="pp-eyebrow">' + esc(c.eyebrow) + '</p>' : '') +
          '<h4 class="pp-title">' + esc(c.title || '제목') + '</h4>' +
          (c.body ? '<p class="pp-text">' + esc(c.body) + '</p>' : '') +
          (c.btnText && c.btnAction !== 'none' ? '<div class="pp-cta">' + esc(c.btnText) + '</div>' : '') +
        '</div>' +
        '<div class="pp-foot"><span>오늘 하루 보지 않기</span><span>닫기</span></div>' +
      '</div>';
  }
  Object.keys(P).forEach(function (k) {
    P[k].addEventListener('input', function () { syncPopupUrlVisibility(); renderPopupPreview(); });
    P[k].addEventListener('change', function () { syncPopupUrlVisibility(); renderPopupPreview(); });
  });
  document.getElementById('p-save').addEventListener('click', function () {
    var cfg = gatherPopup();
    Store.setPopup(cfg);
    saveToDb('popup', cfg, '팝업 설정이 저장되었습니다.');
  });
  document.getElementById('p-reset').addEventListener('click', function () {
    if (!confirm('팝업을 기본값으로 되돌릴까요?')) return;
    Store.resetPopup(); loadPopup(); toast('기본값으로 복원했습니다.');
  });

  /* =====================================================
     SECTION (PAGE) MANAGEMENT
     ===================================================== */
  var sections = Store.getSections();
  var ACTIONS = [
    { v: 'kakao',   t: '카카오톡 보내기' },
    { v: 'partner', t: '파트너등록 안내' },
    { v: 'url',     t: '외부 링크(URL)' },
    { v: 'none',    t: '버튼 없음' }
  ];
  function actionOptions(sel) {
    return ACTIONS.map(function (a) {
      return '<option value="' + a.v + '"' + (a.v === sel ? ' selected' : '') + '>' + a.t + '</option>';
    }).join('');
  }
  function ctaEditor(idx, n, cta) {
    cta = cta || { label: '', action: 'none', url: '', style: 'glass' };
    return '' +
    '<div class="cta-grid">' +
      '<div class="f"><label>버튼' + n + ' 텍스트</label><input data-i="' + idx + '" data-cta="' + n + '" data-k="label" value="' + esc(cta.label) + '" placeholder="예: 무료 상담 신청"></div>' +
      '<div class="f"><label>동작</label><select data-i="' + idx + '" data-cta="' + n + '" data-k="action">' + actionOptions(cta.action) + '</select></div>' +
      '<div class="f"><label>스타일</label><select data-i="' + idx + '" data-cta="' + n + '" data-k="style">' +
        '<option value="primary"' + (cta.style === 'primary' ? ' selected' : '') + '>강조(Primary)</option>' +
        '<option value="glass"' + (cta.style !== 'primary' ? ' selected' : '') + '>투명(Glass)</option>' +
      '</select></div>' +
      '<div class="f cta-url" style="' + (cta.action === 'url' ? '' : 'display:none') + '"><label>URL</label><input data-i="' + idx + '" data-cta="' + n + '" data-k="url" value="' + esc(cta.url) + '" placeholder="https://"></div>' +
    '</div>';
  }
  function sectionCard(s, idx, total) {
    return '' +
    '<div class="sec-card" data-card="' + idx + '">' +
      '<div class="sec-head">' +
        '<span class="sec-num">' + ('0' + (idx + 1)).slice(-2) + '</span>' +
        '<div class="sec-tools">' +
          '<button class="icon-btn" data-move="up" data-i="' + idx + '"' + (idx === 0 ? ' disabled' : '') + ' title="위로">↑</button>' +
          '<button class="icon-btn" data-move="down" data-i="' + idx + '"' + (idx === total - 1 ? ' disabled' : '') + ' title="아래로">↓</button>' +
          '<button class="icon-btn danger" data-del="' + idx + '" title="삭제">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="f"><label>상단 라벨 (Eyebrow)</label><input data-i="' + idx + '" data-k="eyebrow" value="' + esc(s.eyebrow) + '" placeholder="예: 제약 CSO 전문 파트너"></div>' +
      '<div class="f"><label>제목 <span class="hint">줄바꿈=엔터,  강조=[[단어]]</span></label><textarea data-i="' + idx + '" data-k="title" rows="2" placeholder="예: 당신의 영업 가치를\n[[억대 연봉]]으로">' + esc(s.title) + '</textarea></div>' +
      '<div class="f"><label>본문</label><textarea data-i="' + idx + '" data-k="sub" rows="2" placeholder="설명 문구">' + esc(s.sub) + '</textarea></div>' +
      '<div class="f"><label>리스트 항목 <span class="hint">한 줄에 하나씩 · 비워두면 미표시</span></label><textarea data-i="' + idx + '" data-k="list" rows="4" placeholder="예: 자체 프로모션을 통한 경쟁력 있는 요율">' + esc((s.list || []).join('\n')) + '</textarea></div>' +
      ctaEditor(idx, 1, s.cta1) +
      ctaEditor(idx, 2, s.cta2) +
    '</div>';
  }
  function renderSections() {
    var host = document.getElementById('sections-list');
    host.innerHTML = sections.map(function (s, i) { return sectionCard(s, i, sections.length); }).join('');
  }
  // delegated input/change -> update model
  document.getElementById('sections-list').addEventListener('input', onSecChange);
  document.getElementById('sections-list').addEventListener('change', onSecChange);
  function onSecChange(e) {
    var el = e.target;
    var i = el.getAttribute('data-i');
    if (i == null) return;
    i = +i;
    var k = el.getAttribute('data-k');
    var ctaN = el.getAttribute('data-cta');
    if (ctaN) {
      var key = ctaN === '1' ? 'cta1' : 'cta2';
      if (!sections[i][key]) sections[i][key] = { label: '', action: 'none', url: '', style: 'glass' };
      sections[i][key][k] = el.value;
      if (k === 'action') {
        // toggle URL row visibility within this cta-grid
        var grid = el.closest('.cta-grid');
        var urlF = grid && grid.querySelector('.cta-url');
        if (urlF) urlF.style.display = (el.value === 'url') ? '' : 'none';
      }
    } else if (k === 'list') {
      sections[i].list = el.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    } else {
      sections[i][k] = el.value;
    }
  }
  // delegated clicks (move / delete)
  document.getElementById('sections-list').addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (del) {
      var di = +del.getAttribute('data-del');
      if (confirm('이 섹션을 삭제할까요?')) { sections.splice(di, 1); renderSections(); }
      return;
    }
    var mv = e.target.closest('[data-move]');
    if (mv) {
      var mi = +mv.getAttribute('data-i');
      var dir = mv.getAttribute('data-move');
      var to = dir === 'up' ? mi - 1 : mi + 1;
      if (to < 0 || to >= sections.length) return;
      var tmp = sections[mi]; sections[mi] = sections[to]; sections[to] = tmp;
      renderSections();
    }
  });
  document.getElementById('s-add').addEventListener('click', function () {
    sections.push({ eyebrow: '', title: '새 섹션 제목', sub: '', cta1: { label: '', action: 'none', url: '', style: 'glass' }, cta2: { label: '', action: 'none', url: '', style: 'glass' } });
    renderSections();
    var host = document.getElementById('sections-list');
    host.lastElementChild.scrollIntoView ? host.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' }) : 0;
  });
  document.getElementById('s-save').addEventListener('click', function () {
    Store.setSections(sections);
    saveToDb('sections', sections, '페이지 섹션이 저장되었습니다.');
  });
  document.getElementById('s-reset').addEventListener('click', function () {
    if (!confirm('섹션을 기본값으로 되돌릴까요? 저장한 내용이 사라집니다.')) return;
    Store.resetSections(); sections = Store.getSections(); renderSections(); toast('기본값으로 복원했습니다.');
  });

  /* =====================================================
     LINKS & FILES MANAGEMENT
     ===================================================== */
  var LINK_FIELDS = ['kakaoChannel', 'kakaoChat', 'blog', 'kmd', 'promo', 'videoUrl'];
  function loadLinks() {
    var l = Store.getLinks();
    LINK_FIELDS.forEach(function (k) {
      var el = document.getElementById('lk-' + k);
      if (el) el.value = l[k] || '';
    });
    document.getElementById('lk-excel-name').textContent = l.excelName ? ('현재 파일: ' + l.excelName) : '등록된 파일 없음';
    document.getElementById('lk-video-name').textContent = l.videoName ? ('현재 파일: ' + l.videoName) : '등록된 파일 없음';
  }
  function saveLinks(extra) {
    var l = Store.getLinks();
    LINK_FIELDS.forEach(function (k) {
      var el = document.getElementById('lk-' + k);
      if (el) l[k] = el.value.trim();
    });
    if (extra) Object.assign(l, extra);
    Store.setLinks(l);
    return l;
  }
  var lkSave = document.getElementById('lk-save');
  if (lkSave) lkSave.addEventListener('click', function () { var l = saveLinks(); saveToDb('links', l, '링크가 저장되었습니다.'); });

  // excel upload -> Supabase Storage -> public URL
  var excelInput = document.getElementById('lk-excel');
  if (excelInput) excelInput.addEventListener('change', function () {
    var f = excelInput.files[0]; if (!f) return;
    if (!Store.hasBackend || !Store.hasBackend()) { alert('백엔드 미연결 상태입니다.'); return; }
    var nameEl = document.getElementById('lk-excel-name');
    nameEl.textContent = '업로드 중...';
    Store.uploadFile('excel/rate-' + Date.now() + '.' + safeExt(f.name, 'xlsx'), f).then(function (url) {
      var l = saveLinks({ excelName: f.name, excelUrl: url, excelData: '' });
      nameEl.textContent = '현재 파일: ' + f.name;
      return Store.push('links', l);
    }).then(function () { toast('요율표 엑셀이 업로드되었습니다.'); })
      .catch(function (err) { nameEl.textContent = '업로드 실패'; toast('업로드 실패: ' + (err.message || err)); });
  });
  var excelDel = document.getElementById('lk-excel-del');
  if (excelDel) excelDel.addEventListener('click', function () {
    var l = saveLinks({ excelName: '', excelUrl: '', excelData: '' });
    document.getElementById('lk-excel-name').textContent = '등록된 파일 없음';
    saveToDb('links', l, '엑셀 파일을 삭제했습니다.');
  });

  // video upload -> Supabase Storage -> public URL
  var videoInput = document.getElementById('lk-video');
  if (videoInput) videoInput.addEventListener('change', function () {
    var f = videoInput.files[0]; if (!f) return;
    if (!Store.hasBackend || !Store.hasBackend()) { alert('백엔드 미연결 상태입니다.'); return; }
    if (f.size > 50 * 1024 * 1024) { alert('영상이 너무 큽니다(50MB 이하 권장). 짧게 자르거나 압축해 주세요.'); return; }
    var nameEl = document.getElementById('lk-video-name');
    nameEl.textContent = '업로드 중... (용량에 따라 시간이 걸립니다)';
    Store.uploadFile('video/bg-' + Date.now() + '.' + safeExt(f.name, 'mp4'), f).then(function (url) {
      var l = saveLinks({ videoName: f.name, videoUrl: url });
      nameEl.textContent = '현재 파일: ' + f.name;
      return Store.push('links', l);
    }).then(function () { toast('배경 영상이 업로드되었습니다. 사이트에서 확인하세요.'); })
      .catch(function (err) { nameEl.textContent = '업로드 실패'; toast('업로드 실패: ' + (err.message || err)); });
  });
  var videoDel = document.getElementById('lk-video-del');
  if (videoDel) videoDel.addEventListener('click', function () {
    var l = saveLinks({ videoName: '', videoUrl: '' });
    document.getElementById('lk-video-name').textContent = '등록된 파일 없음';
    saveToDb('links', l, '배경 영상을 삭제했습니다. (기본 영상으로 복귀)');
  });

  /* =====================================================
     AUTH GATE + INIT
     ===================================================== */
  function renderAll() {
    sections = Store.getSections();
    loadPopup();
    renderSections();
    loadLinks();
  }
  function showConsole(user) {
    var ls = document.getElementById('login-screen'); if (ls) ls.style.display = 'none';
    var am = document.getElementById('admin-body'); if (am) am.style.display = '';
    var who = document.getElementById('admin-who'); if (who) who.textContent = (user && user.email) || '';
    var lo = document.getElementById('logout-btn'); if (lo) lo.style.display = '';
    (Store.pull ? Store.pull() : Promise.resolve()).then(renderAll, renderAll);
  }
  function showLogin() {
    var ls = document.getElementById('login-screen'); if (ls) ls.style.display = '';
    var am = document.getElementById('admin-body'); if (am) am.style.display = 'none';
    var lo = document.getElementById('logout-btn'); if (lo) lo.style.display = 'none';
  }
  var loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('login-email').value.trim();
    var pw = document.getElementById('login-pw').value;
    var btn = document.getElementById('login-btn');
    var errEl = document.getElementById('login-err'); errEl.textContent = '';
    btn.disabled = true; btn.textContent = '로그인 중...';
    Store.signIn(email, pw).then(function (res) {
      btn.disabled = false; btn.textContent = '로그인';
      if (res.error) { errEl.textContent = '로그인 실패: 이메일/비밀번호를 확인하세요.'; return; }
      showConsole(res.data.user);
    }).catch(function () { btn.disabled = false; btn.textContent = '로그인'; errEl.textContent = '로그인 오류가 발생했습니다.'; });
  });
  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', function () { Store.signOut().then(showLogin); });

  if (Store.hasBackend && Store.hasBackend()) {
    Store.currentUser().then(function (res) {
      if (res && res.data && res.data.user) showConsole(res.data.user); else showLogin();
    }).catch(showLogin);
  } else {
    showConsole({ email: '(로컬 모드)' });
  }
})();
