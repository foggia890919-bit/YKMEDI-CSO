/* =========================================================
   YKMEDI 명함관리 (Business Cards)
   - 명함 앞/뒤 촬영 + Tesseract.js OCR 자동인식
   - 소통 메모 / 만난 행사 기록
   - Supabase(business_cards) 저장, 미연결/오류 시 IndexedDB 로컬 저장
   - Google Apps Script 웹훅으로 구글시트 주소록 실시간 연동
   ========================================================= */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDateTime(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d)) return String(iso || '');
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  var toastEl = $('toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------- supabase ---------- */
  var sb = null;
  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_KEY) {
    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
  }

  /* ---------- local store (IndexedDB) ---------- */
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('ykmedi-cards', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('cards', { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  var localRepo = {
    list: function () {
      return idb().then(function (db) {
        return new Promise(function (res, rej) {
          var rq = db.transaction('cards', 'readonly').objectStore('cards').getAll();
          rq.onsuccess = function () { res(rq.result || []); };
          rq.onerror = function () { rej(rq.error); };
        });
      });
    },
    save: function (card) {
      return idb().then(function (db) {
        return new Promise(function (res, rej) {
          var t = db.transaction('cards', 'readwrite');
          t.objectStore('cards').put(card);
          t.oncomplete = function () { res(card); };
          t.onerror = function () { rej(t.error); };
        });
      });
    },
    remove: function (id) {
      return idb().then(function (db) {
        return new Promise(function (res) {
          var t = db.transaction('cards', 'readwrite');
          t.objectStore('cards').delete(id);
          t.oncomplete = function () { res(true); };
        });
      });
    },
    uploadImage: function (id, side, blob) {
      return new Promise(function (res, rej) {
        var r = new FileReader();
        r.onload = function () { res(r.result); }; // dataURL
        r.onerror = function () { rej(r.error); };
        r.readAsDataURL(blob);
      });
    }
  };

  var sbRepo = {
    list: function () {
      return sb.from('business_cards').select('*').order('created_at', { ascending: false })
        .then(function (res) { if (res.error) throw res.error; return res.data || []; });
    },
    save: function (card) {
      var row = Object.assign({}, card);
      delete row._local;
      row.updated_at = new Date().toISOString();
      return sb.from('business_cards').upsert(row).then(function (res) {
        if (res.error) throw res.error; return card;
      });
    },
    remove: function (id) {
      return sb.from('business_cards').delete().eq('id', id).then(function (res) {
        if (res.error) throw res.error; return true;
      });
    },
    uploadImage: function (id, side, blob) {
      var path = 'cards/' + id + '-' + side + '-' + Date.now() + '.jpg';
      return sb.storage.from('assets').upload(path, blob, { upsert: true, cacheControl: '3600', contentType: 'image/jpeg' })
        .then(function (res) {
          if (res.error) throw res.error;
          return sb.storage.from('assets').getPublicUrl(path).data.publicUrl;
        });
    }
  };

  function isMissingTable(err) {
    var m = String(err && (err.message || err.code) || '');
    return m.indexOf('business_cards') !== -1 || m.indexOf('42P01') !== -1 || (err && err.code === '42P01');
  }

  /* ---------- state ---------- */
  var state = {
    cards: [],
    editingId: null,
    shots: { front: newShot(), back: newShot() },
    ocrText: '',
    settings: { sheetUrl: '' },
    tableMissing: false
  };
  function newShot() { return { blob: null, url: '', dirty: false }; }

  var SETTINGS_KEY = 'ykmedi.cards.settings.v1';
  function loadSettings() {
    try { Object.assign(state.settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
    if (sb) {
      sb.from('configs').upsert({ key: 'cards_settings', value: state.settings, updated_at: new Date().toISOString() })
        .then(function () {}, function () {});
    }
  }
  function pullSettings() {
    if (!sb) return Promise.resolve();
    return sb.from('configs').select('value').eq('key', 'cards_settings').maybeSingle()
      .then(function (res) {
        if (!res.error && res.data && res.data.value && res.data.value.sheetUrl && !state.settings.sheetUrl) {
          state.settings.sheetUrl = res.data.value.sheetUrl;
          try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
        }
      }).catch(function () {});
  }

  /* =========================================================
     이미지 압축 (긴 변 1600px, JPEG 0.85)
     ========================================================= */
  function compressImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var MAX = 1600;
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, MAX / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        cv.toBlob(function (blob) {
          if (blob) res(blob); else rej(new Error('이미지 변환 실패'));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('이미지를 읽을 수 없습니다')); };
      img.src = url;
    });
  }
  function dataURLtoBlob(dataUrl) {
    var parts = dataUrl.split(','), mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    var bin = atob(parts[1]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /* =========================================================
     사진 슬롯 (앞/뒤)
     ========================================================= */
  function bindShot(side) {
    var box = $('shot-' + side);
    var input = box.querySelector('input[type=file]');
    var ph = box.querySelector('.shot__ph');
    var xBtn = box.querySelector('.shot__x');

    function render() {
      var s = state.shots[side];
      var old = box.querySelector('img');
      if (old) old.remove();
      if (s.url) {
        var img = document.createElement('img');
        img.src = s.url;
        img.alt = side === 'front' ? '명함 앞면' : '명함 뒷면';
        img.addEventListener('click', function () { openViewer(s.url); });
        box.insertBefore(img, xBtn);
        box.classList.add('has-img');
        ph.style.display = 'none';
      } else {
        box.classList.remove('has-img');
        ph.style.display = '';
      }
      updateOcrButton();
    }
    state.shots[side]._render = render;

    ph.addEventListener('click', function () { input.click(); });
    xBtn.addEventListener('click', function () {
      state.shots[side] = newShot();
      state.shots[side]._render = render;
      render();
    });
    input.addEventListener('change', function () {
      var f = input.files[0];
      input.value = '';
      if (!f) return;
      compressImage(f).then(function (blob) {
        var s = state.shots[side];
        s.blob = blob; s.dirty = true;
        if (s.url && s.url.indexOf('blob:') === 0) URL.revokeObjectURL(s.url);
        s.url = URL.createObjectURL(blob);
        render();
      }).catch(function (err) { toast('사진 처리 실패: ' + err.message); });
    });
    render();
  }

  function setShot(side, url) {
    var render = state.shots[side]._render;
    state.shots[side] = newShot();
    state.shots[side].url = url || '';
    state.shots[side]._render = render;
    render();
  }

  var viewer = $('viewer');
  function openViewer(url) {
    viewer.querySelector('img').src = url;
    viewer.classList.add('show');
  }
  viewer.addEventListener('click', function () { viewer.classList.remove('show'); });

  /* =========================================================
     OCR (Tesseract.js kor+eng)
     ========================================================= */
  var ocrWorker = null;
  var ocrRunning = false;
  var ocrProgressHandler = null;

  function updateOcrButton() {
    var has = !!(state.shots.front.url || state.shots.back.url);
    $('ocr-btn').disabled = !has || ocrRunning;
    if (!ocrRunning) {
      $('ocr-status').textContent = has
        ? '준비 완료 — 버튼을 누르면 글자를 인식합니다.'
        : '명함 사진을 먼저 등록해 주세요.';
    }
  }

  function getWorker() {
    if (ocrWorker) return Promise.resolve(ocrWorker);
    return Tesseract.createWorker('kor+eng', 1, {
      logger: function (m) { if (ocrProgressHandler) ocrProgressHandler(m); }
    }).then(function (w) { ocrWorker = w; return w; });
  }

  function runOcr() {
    if (ocrRunning) return;
    var jobs = [];
    if (state.shots.front.url) jobs.push(['앞면', state.shots.front.blob || state.shots.front.url]);
    if (state.shots.back.url) jobs.push(['뒷면', state.shots.back.blob || state.shots.back.url]);
    if (!jobs.length) return;

    ocrRunning = true;
    $('ocr-btn').disabled = true;
    var bar = $('ocr-bar'), fill = bar.querySelector('i');
    bar.style.display = 'block'; fill.style.width = '2%';
    var stEl = $('ocr-status');
    stEl.textContent = '인식 엔진 준비 중... (첫 실행은 시간이 걸립니다)';

    var done = 0, texts = [];
    function setProgress(p) { fill.style.width = Math.round(p * 100) + '%'; }

    function step() {
      if (done >= jobs.length) {
        ocrRunning = false;
        bar.style.display = 'none';
        var full = texts.join('\n');
        state.ocrText = full;
        var parsed = parseCardText(full);
        var filled = applyParsed(parsed);
        stEl.textContent = '인식 완료 — 자동으로 채운 내용을 꼭 확인해 주세요.';
        updateOcrButton();
        toast(filled ? '자동인식 완료! 내용을 확인해 주세요.' : '글자를 인식했지만 항목을 찾지 못했습니다. 직접 입력해 주세요.');
        return;
      }
      var label = jobs[done][0], src = jobs[done][1];
      ocrProgressHandler = function (m) {
        if (m.status === 'recognizing text') {
          setProgress((done + m.progress) / jobs.length);
          stEl.textContent = label + ' 인식 중... ' + Math.round(m.progress * 100) + '%';
        }
      };
      getWorker().then(function (w) {
        stEl.textContent = label + ' 인식 중...';
        return w.recognize(src);
      }).then(function (res) {
        texts.push(res && res.data ? res.data.text : '');
        done++; step();
      }).catch(function (err) {
        ocrRunning = false;
        bar.style.display = 'none';
        stEl.textContent = '인식 실패: ' + (err.message || err);
        updateOcrButton();
      });
    }
    step();
  }

  /* =========================================================
     한국 명함 텍스트 파싱
     ========================================================= */
  var TITLE_RE = /(대표이사|부회장|회장|부사장|사장|전무이사|상무이사|전무|상무|이사장|이사|감사|본부장|사업부장|총괄|실장|국장|부장|차장|과장|대리|주임|사원|팀장|파트장|그룹장|지점장|지사장|센터장|소장|부원장|원장|약국장|약사|한약사|전문의|의사|교수|연구소장|수석연구원|책임연구원|선임연구원|연구원|수석|책임|선임|매니저|컨설턴트|프로|CEO|CTO|CFO|COO|CMO|President|Director|Manager)/;
  var CO_RE = /(주식회사|\(주\)|㈜|\(유\)|\(재\)|\(사\)|Co\.\s?,?\s?Ltd|Corp\b|Inc\b|Ltd\b|Company|컴퍼니|그룹|홀딩스|병원|의료원|의원|클리닉|약국|팜\b|파마|제약|바이오|메디칼|메디컬|메디\b|헬스케어|생명과학|연구소|유통|상사|무역|시스템|솔루션|네트웍스|네트워크|Pharm|Medical|Bio|Health)/i;
  var ADDR_RE = /(특별시|광역시|특별자치|[가-힣]{1,8}(?:시|군|구)\s?[가-힣]|[가-힣0-9]+(?:로|길)\s?\d|\d+\s?층|\d+\s?호|빌딩|타워)/;
  var DEPT_RE = /([가-힣A-Za-z0-9]{2,14}(?:팀|본부|사업부|부문|파트|지점|지사|센터|영업소|연구소|실))(?![가-힣])/;
  var EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  var URL_RE = /(https?:\/\/[^\s]+|www\.[^\s,]+|[a-z0-9][a-z0-9-]{1,30}\.(?:com|co\.kr|or\.kr|kr|net|org|io)(?:\/[^\s]*)?)/i;
  var PHONE_RE = /(?:\+?82[-.\s]?)?0?\d{1,2}[-.\s)]?\d{3,4}[-.\s]?\d{4}/g;

  function normalizePhone(raw) {
    var d = raw.replace(/[^\d]/g, '');
    if (d.indexOf('82') === 0) d = '0' + d.slice(2);
    if (d.length === 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    if (d.length === 10) {
      if (d.indexOf('02') === 0) return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6);
      return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    }
    if (d.length === 9 && d.indexOf('02') === 0) return d.slice(0, 2) + '-' + d.slice(2, 5) + '-' + d.slice(5);
    return raw.trim();
  }

  function parseCardText(text) {
    var out = { name: '', company: '', department: '', title: '', mobile: '', phone: '', fax: '', email: '', website: '', address: '' };
    if (!text) return out;

    var lines = text.split(/\r?\n/).map(function (l) {
      return l.replace(/[|©®™_]{1,}/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }).filter(function (l) { return l.length > 0; });

    var em = text.match(EMAIL_RE);
    if (em) out.email = em[0].toLowerCase();

    // 전화번호 분류 (라벨 우선, 없으면 국번으로 판단)
    lines.forEach(function (line) {
      var m, re = new RegExp(PHONE_RE.source, 'g');
      while ((m = re.exec(line)) !== null) {
        var num = normalizePhone(m[0]);
        var digits = num.replace(/[^\d]/g, '');
        if (digits.length < 9) continue;
        var label = line.slice(0, m.index).toUpperCase();
        var type;
        if (/FAX|팩스|(^|[^A-Z])F[\s.:]*$/.test(label)) type = 'fax';
        else if (/MOBILE|휴대|핸드폰|H\.?P|C\.?P|(^|[^A-Z])M[\s.:]*$/.test(label)) type = 'mobile';
        else if (/TEL|전화|(^|[^A-Z])T[\s.:]*$/.test(label)) type = digits.indexOf('010') === 0 ? 'mobile' : 'phone';
        else type = digits.indexOf('010') === 0 ? 'mobile' : 'phone';
        if (!out[type]) out[type] = num;
      }
    });

    lines.forEach(function (line) {
      var noEmail = line.replace(EMAIL_RE, ' ');

      if (!out.website) {
        var um = noEmail.match(URL_RE);
        if (um && !/(시|구|동|로|길)\s?\d/.test(line)) out.website = um[0].replace(/[,.]$/, '');
      }
      if (!out.company && CO_RE.test(line) && !ADDR_RE.test(line) && line.length <= 40 && !EMAIL_RE.test(line)) {
        out.company = line;
      }
      if (!out.title) {
        var tm = line.match(TITLE_RE);
        if (tm && line.length <= 30) out.title = tm[0];
      }
      if (!out.department && line !== out.company) {
        var dm = line.match(DEPT_RE);
        if (dm && !ADDR_RE.test(line)) out.department = dm[1];
      }
      if (ADDR_RE.test(line) && line.length >= 10 && !EMAIL_RE.test(line)) {
        if (line.length > out.address.length) out.address = line.replace(/^(주소|ADD(RESS)?)\s*[:.]?\s*/i, '');
      }
    });

    // 이름: 직함/라벨 제거 후 한글 2~4자 단독 라인 (회사/주소 라인 제외)
    for (var i = 0; i < lines.length && !out.name; i++) {
      var l = lines[i];
      if (l === out.company || ADDR_RE.test(l) || EMAIL_RE.test(l) || /\d{3,}/.test(l)) continue;
      var cleaned = l.replace(TITLE_RE, ' ').replace(/[A-Za-z().,/·|]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (/^[가-힣](\s?[가-힣]){1,3}$/.test(cleaned)) {
        var candidate = cleaned.replace(/\s/g, '');
        if (candidate.length >= 2 && candidate.length <= 4 && !CO_RE.test(candidate) && !TITLE_RE.test(candidate)) {
          out.name = candidate;
        }
      }
    }
    // 영문 이름 fallback
    if (!out.name) {
      for (var j = 0; j < lines.length; j++) {
        var lm = lines[j].match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})$/);
        if (lm) { out.name = lm[1]; break; }
      }
    }
    return out;
  }

  var FIELD_IDS = { name: 'c-name', company: 'c-company', department: 'c-department', title: 'c-title', mobile: 'c-mobile', phone: 'c-phone', fax: 'c-fax', email: 'c-email', website: 'c-website', address: 'c-address' };

  function applyParsed(parsed) {
    var filled = 0;
    Object.keys(FIELD_IDS).forEach(function (k) {
      var el = $(FIELD_IDS[k]);
      if (parsed[k] && !el.value.trim()) { el.value = parsed[k]; filled++; }
    });
    return filled;
  }

  /* =========================================================
     저장 / 폼
     ========================================================= */
  function readForm() {
    var card = {};
    Object.keys(FIELD_IDS).forEach(function (k) { card[k] = $(FIELD_IDS[k]).value.trim(); });
    card.met_event = $('c-met-event').value.trim();
    card.met_date = $('c-met-date').value;
    card.memo = $('c-memo').value.trim();
    return card;
  }

  function clearForm() {
    Object.keys(FIELD_IDS).forEach(function (k) { $(FIELD_IDS[k]).value = ''; });
    $('c-memo').value = '';
    $('c-met-date').value = todayStr();
    // 같은 행사에서 연속 등록이 많으므로 행사명은 유지
    setShot('front', '');
    setShot('back', '');
    state.editingId = null;
    state.ocrText = '';
    $('edit-banner').style.display = 'none';
    $('delete-btn').style.display = 'none';
    $('save-btn').textContent = '저장하기';
    $('save-note').textContent = '';
  }

  function loadCardIntoForm(card) {
    clearForm();
    Object.keys(FIELD_IDS).forEach(function (k) { $(FIELD_IDS[k]).value = card[k] || ''; });
    $('c-met-event').value = card.met_event || '';
    $('c-met-date').value = card.met_date || '';
    $('c-memo').value = card.memo || '';
    setShot('front', card.front_url || '');
    setShot('back', card.back_url || '');
    state.editingId = card.id;
    state.ocrText = card.ocr_text || '';
    $('edit-banner').style.display = 'flex';
    $('delete-btn').style.display = '';
    $('save-btn').textContent = '수정 저장';
    $('save-note').textContent = '등록일: ' + fmtDateTime(card.created_at) + (card._local ? ' · 이 기기에만 저장됨' : '');
    switchTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveCard() {
    var form = readForm();
    if (!form.name && !form.company && !state.shots.front.url) {
      toast('이름, 회사명 또는 명함 사진 중 하나는 필요합니다.');
      return;
    }
    var btn = $('save-btn');
    btn.disabled = true; btn.textContent = '저장 중...';

    var existing = state.editingId ? findCard(state.editingId) : null;
    var fallbackMsg = '';
    var card = Object.assign({}, existing || {}, form);
    card.id = state.editingId || uuid();
    card.created_at = (existing && existing.created_at) || new Date().toISOString();
    if (state.ocrText) card.ocr_text = state.ocrText;

    var useLocal = !sb || state.tableMissing || (existing && existing._local);
    var repo = useLocal ? localRepo : sbRepo;
    var imgRepo = useLocal ? localRepo : sbRepo;

    // 변경된 사진 업로드
    var ups = ['front', 'back'].map(function (side) {
      var s = state.shots[side];
      if (s.dirty && s.blob) {
        return imgRepo.uploadImage(card.id, side, s.blob).then(function (url) { card[side + '_url'] = url; });
      }
      card[side + '_url'] = s.url && s.url.indexOf('blob:') !== 0 ? s.url : (card[side + '_url'] || '');
      if (!s.url) card[side + '_url'] = '';
      return Promise.resolve();
    });

    Promise.all(ups).then(function () {
      if (useLocal) card._local = true;
      return repo.save(card);
    }).catch(function (err) {
      // 서버 저장 실패 → 로컬로 폴백 (박람회 현장 데이터 유실 방지)
      if (!useLocal) {
        if (isMissingTable(err)) state.tableMissing = true;
        return Promise.all(['front', 'back'].map(function (side) {
          var s = state.shots[side];
          if (s.dirty && s.blob) return localRepo.uploadImage(card.id, side, s.blob).then(function (u) { card[side + '_url'] = u; });
          return Promise.resolve();
        })).then(function () {
          card._local = true;
          return localRepo.save(card).then(function () {
            fallbackMsg = state.tableMissing
              ? '서버 테이블이 없어 이 기기에 저장했습니다. 설정 탭에서 SQL을 실행해 주세요.'
              : '서버 연결 실패 — 이 기기에 임시 저장했습니다.';
            return card;
          });
        });
      }
      throw err;
    }).then(function () {
      upsertLocalState(card);
      sheetUpsert(card); // 비동기, 실패해도 저장은 유지
      btn.disabled = false;
      var wasEdit = !!state.editingId;
      clearForm();
      renderList();
      toast(fallbackMsg || (wasEdit ? '명함이 수정되었습니다.' : '명함이 저장되었습니다.'));
      switchTab('list');
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = state.editingId ? '수정 저장' : '저장하기';
      toast('저장 실패: ' + (err.message || err));
    });
  }

  function deleteCard() {
    if (!state.editingId) return;
    if (!confirm('이 명함을 삭제할까요? 되돌릴 수 없습니다.')) return;
    var id = state.editingId;
    var card = findCard(id);
    var repo = (card && card._local) ? localRepo : (sb ? sbRepo : localRepo);
    repo.remove(id).then(function () {
      state.cards = state.cards.filter(function (c) { return c.id !== id; });
      sheetDelete(id);
      clearForm();
      renderList();
      toast('명함이 삭제되었습니다.');
      switchTab('list');
    }).catch(function (err) { toast('삭제 실패: ' + (err.message || err)); });
  }

  function findCard(id) {
    for (var i = 0; i < state.cards.length; i++) if (state.cards[i].id === id) return state.cards[i];
    return null;
  }
  function upsertLocalState(card) {
    var i = state.cards.findIndex(function (c) { return c.id === card.id; });
    if (i === -1) state.cards.unshift(card); else state.cards[i] = card;
    state.cards.sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  }

  /* =========================================================
     목록
     ========================================================= */
  function renderList() {
    var q = $('search').value.trim().toLowerCase();
    var ev = $('filter-event').value;
    var list = state.cards.filter(function (c) {
      if (ev && (c.met_event || '') !== ev) return false;
      if (!q) return true;
      var hay = [c.name, c.company, c.department, c.title, c.mobile, c.phone, c.email, c.memo, c.met_event].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    $('tab-cnt').textContent = state.cards.length;
    $('list-empty').style.display = state.cards.length ? 'none' : '';
    var host = $('cardlist');
    host.innerHTML = list.map(function (c) {
      var thumb = c.front_url
        ? '<span class="citem__thumb"><img src="' + esc(c.front_url) + '" alt="" loading="lazy"></span>'
        : '<span class="citem__thumb">' + esc((c.name || c.company || '?').charAt(0)) + '</span>';
      var chips = [];
      if (c.met_event) chips.push('<span class="chip ev">' + esc(c.met_event) + '</span>');
      if (c.memo) chips.push('<span class="chip memo">메모</span>');
      if (c._local) chips.push('<span class="chip">이 기기</span>');
      if (c.met_date) chips.push('<span class="chip">' + esc(c.met_date) + '</span>');
      return '<div class="citem" data-id="' + esc(c.id) + '">' + thumb +
        '<div class="citem__body">' +
          '<div class="citem__name">' + esc(c.name || '(이름 없음)') + (c.title ? '<span class="t">' + esc(c.title) + '</span>' : '') + '</div>' +
          '<div class="citem__co">' + esc([c.company, c.department].filter(Boolean).join(' · ') || c.email || c.mobile || '') + '</div>' +
          (chips.length ? '<div class="citem__meta">' + chips.join('') + '</div>' : '') +
        '</div></div>';
    }).join('');
    if (!list.length && state.cards.length) {
      host.innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    }
    renderEventOptions();
  }

  function renderEventOptions() {
    var events = [];
    state.cards.forEach(function (c) {
      if (c.met_event && events.indexOf(c.met_event) === -1) events.push(c.met_event);
    });
    var sel = $('filter-event');
    var cur = sel.value;
    sel.innerHTML = '<option value="">전체 행사</option>' + events.map(function (e) {
      return '<option value="' + esc(e) + '">' + esc(e) + '</option>';
    }).join('');
    sel.value = cur && events.indexOf(cur) !== -1 ? cur : '';
    $('event-list').innerHTML = events.map(function (e) { return '<option value="' + esc(e) + '">'; }).join('');
  }

  $('cardlist').addEventListener('click', function (e) {
    var item = e.target.closest('.citem');
    if (!item) return;
    var card = findCard(item.getAttribute('data-id'));
    if (card) loadCardIntoForm(card);
  });
  $('search').addEventListener('input', renderList);
  $('filter-event').addEventListener('change', renderList);

  /* =========================================================
     구글시트 연동
     ========================================================= */
  function sheetCardPayload(c) {
    return {
      id: c.id, created_at: fmtDateTime(c.created_at),
      name: c.name || '', company: c.company || '', department: c.department || '', title: c.title || '',
      mobile: c.mobile || '', phone: c.phone || '', fax: c.fax || '', email: c.email || '',
      website: c.website || '', address: c.address || '',
      met_event: c.met_event || '', met_date: c.met_date || '', memo: c.memo || '',
      front_url: looksLikeUrl(c.front_url) ? c.front_url : '',
      back_url: looksLikeUrl(c.back_url) ? c.back_url : ''
    };
  }
  function looksLikeUrl(u) { return !!u && /^https?:\/\//.test(u); }

  function sheetPost(payload) {
    var url = state.settings.sheetUrl;
    if (!url) return Promise.resolve('off');
    var body = JSON.stringify(payload);
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) return 'ok'; throw new Error((j && j.error) || '시트 응답 오류'); })
      .catch(function (err) {
        if (err instanceof TypeError) {
          // CORS 응답 차단 → 전송만 하고 응답은 포기
          return fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body })
            .then(function () { return 'sent'; });
        }
        throw err;
      });
  }

  function sheetUpsert(card) {
    sheetPost({ action: 'upsert', card: sheetCardPayload(card) })
      .then(function (r) { if (r !== 'off') console.log('[sheet] upsert', r); })
      .catch(function (err) { toast('구글시트 전송 실패: ' + (err.message || err)); });
  }
  function sheetDelete(id) {
    sheetPost({ action: 'delete', id: id }).catch(function () {});
  }

  function renderSheetStatus() {
    var el = $('sheet-status');
    if (state.settings.sheetUrl) {
      el.textContent = '연동됨 — 저장 시 자동으로 시트에 반영됩니다.';
      el.classList.add('on');
    } else {
      el.textContent = '연동 안 됨';
      el.classList.remove('on');
    }
    $('sheet-url').value = state.settings.sheetUrl || '';
  }

  $('sheet-save').addEventListener('click', function () {
    var url = $('sheet-url').value.trim();
    if (url && !/^https:\/\/script\.google\.com\/.+\/exec/.test(url)) {
      if (!confirm('일반적인 Apps Script 웹앱 URL(…/exec) 형식이 아닙니다. 그래도 저장할까요?')) return;
    }
    state.settings.sheetUrl = url;
    saveSettings();
    renderSheetStatus();
    toast(url ? '구글시트 연동이 저장되었습니다.' : '구글시트 연동이 해제되었습니다.');
  });

  $('sheet-test').addEventListener('click', function () {
    var url = $('sheet-url').value.trim() || state.settings.sheetUrl;
    if (!url) { toast('먼저 웹앱 URL을 입력해 주세요.'); return; }
    toast('연결 확인 중...');
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      toast(j && j.ok ? '✅ 연결 성공!' : '응답이 올바르지 않습니다. 배포 설정을 확인하세요.');
    }).catch(function () {
      fetch(url, { mode: 'no-cors' }).then(function () {
        toast('요청은 전송됩니다. (브라우저 정책상 응답 확인 불가 — 시트에서 직접 확인해 보세요)');
      }).catch(function () { toast('연결 실패: URL을 확인해 주세요.'); });
    });
  });

  $('sheet-syncall').addEventListener('click', function () {
    if (!state.settings.sheetUrl) { toast('먼저 구글시트 연동을 저장해 주세요.'); return; }
    if (!state.cards.length) { toast('동기화할 명함이 없습니다.'); return; }
    if (!confirm('시트의 기존 내용을 지우고 전체 명함 ' + state.cards.length + '건으로 다시 채웁니다. 진행할까요?')) return;
    toast('전체 동기화 중...');
    sheetPost({ action: 'syncAll', cards: state.cards.map(sheetCardPayload) })
      .then(function (r) { toast(r === 'sent' ? '동기화 요청 완료 — 시트를 확인해 주세요.' : '✅ 전체 동기화 완료!'); })
      .catch(function (err) { toast('동기화 실패: ' + (err.message || err)); });
  });

  /* =========================================================
     CSV 내보내기 (엑셀 주소록 양식)
     ========================================================= */
  $('csv-btn').addEventListener('click', function () {
    if (!state.cards.length) { toast('내보낼 명함이 없습니다.'); return; }
    var headers = ['등록일', '이름', '회사', '부서', '직함', '휴대폰', '전화', '팩스', '이메일', '홈페이지', '주소', '만난 행사/장소', '만난 날짜', '메모', '명함(앞)', '명함(뒤)'];
    function cell(v) {
      v = String(v == null ? '' : v);
      return '"' + v.replace(/"/g, '""') + '"';
    }
    var rows = state.cards.map(function (c) {
      var p = sheetCardPayload(c);
      return [p.created_at, p.name, p.company, p.department, p.title, p.mobile, p.phone, p.fax, p.email, p.website, p.address, p.met_event, p.met_date, p.memo, p.front_url, p.back_url].map(cell).join(',');
    });
    var csv = '\ufeff' + headers.map(cell).join(',') + '\r\n' + rows.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '명함주소록_' + todayStr().replace(/-/g, '') + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
    toast('CSV 다운로드를 시작했습니다.');
  });

  /* ---------- 코드 복사 ---------- */
  function bindCopy(viewId, srcId, btnId, name) {
    var code = $(srcId).textContent.trim();
    $(viewId).value = code;
    $(btnId).addEventListener('click', function () {
      (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject())
        .then(function () { toast(name + ' 복사 완료!'); })
        .catch(function () {
          $(viewId).select();
          document.execCommand('copy');
          toast(name + ' 복사 완료!');
        });
    });
  }
  bindCopy('gs-code-view', 'gs-code', 'gs-copy', 'Apps Script 코드');
  bindCopy('sql-code-view', 'sql-code', 'sql-copy', 'SQL');

  /* =========================================================
     탭 / 인증 / 초기화
     ========================================================= */
  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === name); });
    document.querySelectorAll('.panel-view').forEach(function (v) { v.classList.remove('active'); });
    $('view-' + name).classList.add('active');
  }
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { switchTab(t.dataset.tab); });
  });

  $('ocr-btn').addEventListener('click', runOcr);
  $('save-btn').addEventListener('click', saveCard);
  $('delete-btn').addEventListener('click', deleteCard);
  $('clear-btn').addEventListener('click', function () {
    if (confirm('입력한 내용을 지울까요?')) { clearForm(); }
  });
  $('edit-cancel').addEventListener('click', clearForm);

  function loadCards() {
    var jobs = [localRepo.list().catch(function () { return []; })];
    if (sb && !state.tableMissing) {
      jobs.push(sbRepo.list().catch(function (err) {
        if (isMissingTable(err)) {
          state.tableMissing = true;
          $('backend-desc').innerHTML = '⚠️ <b>business_cards 테이블이 아직 없습니다.</b> Supabase → SQL Editor에서 아래 SQL을 한 번 실행해 주세요. 그 전까지는 이 기기에만 저장됩니다.';
        }
        return [];
      }));
    }
    return Promise.all(jobs).then(function (results) {
      var local = results[0].map(function (c) { c._local = true; return c; });
      var remote = results[1] || [];
      state.cards = remote.concat(local);
      state.cards.sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
      renderList();
    });
  }

  function showApp(user) {
    $('login-screen').style.display = 'none';
    $('app-body').style.display = '';
    $('user-who').textContent = (user && user.email) || '';
    $('logout-btn').style.display = user && user.email !== '(로컬 모드)' ? '' : 'none';
    $('c-met-date').value = todayStr();
    pullSettings().then(function () { renderSheetStatus(); });
    renderSheetStatus();
    loadCards();
  }
  function showLogin() {
    $('login-screen').style.display = 'flex';
    $('app-body').style.display = 'none';
    $('logout-btn').style.display = 'none';
  }

  loadSettings();
  bindShot('front');
  bindShot('back');

  var loginForm = $('login-form');
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!sb) return;
    var btn = $('login-btn'), errEl = $('login-err');
    errEl.textContent = '';
    btn.disabled = true; btn.textContent = '로그인 중...';
    sb.auth.signInWithPassword({ email: $('login-email').value.trim(), password: $('login-pw').value })
      .then(function (res) {
        btn.disabled = false; btn.textContent = '로그인';
        if (res.error) { errEl.textContent = '로그인 실패: 이메일/비밀번호를 확인하세요.'; return; }
        showApp(res.data.user);
      })
      .catch(function () { btn.disabled = false; btn.textContent = '로그인'; errEl.textContent = '로그인 오류가 발생했습니다.'; });
  });
  $('logout-btn').addEventListener('click', function () {
    if (sb) sb.auth.signOut().then(showLogin); else showLogin();
  });

  if (sb) {
    sb.auth.getUser().then(function (res) {
      if (res && res.data && res.data.user) showApp(res.data.user); else showLogin();
    }).catch(showLogin);
  } else {
    // 백엔드 미설정: 로컬 모드로 동작
    showApp({ email: '(로컬 모드)' });
  }

  // 콘솔 디버깅/테스트용
  window.YKCards = { parseCardText: parseCardText, normalizePhone: normalizePhone };
})();
