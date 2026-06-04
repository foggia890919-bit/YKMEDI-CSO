/* =========================================================
   MedStore — shared config store for the public site + admin.
   Persists to localStorage so the admin page and the live site
   stay in sync (prototype; no backend).
   ========================================================= */
(function (g) {
  'use strict';

  var KEYS = {
    POPUP:    'mediline.popup.v2',
    SECTIONS: 'mediline.sections.v2',
    LINKS:    'mediline.links.v1',
    DISMISS:  'mediline.popup.dismiss'
  };

  var DEFAULT_POPUP = {
    enabled: true,
    eyebrow: 'NOTICE',
    title:   '신규 파트너 모집',
    body:    '영업에만 집중하세요. 나머지는 저희가 합니다.',
    imageUrl: '',
    btnText: '카카오톡 보내기',
    btnAction: 'kakao',     // kakao | rate | promo | url | none
    btnUrl: ''
  };

  // title supports a mini-syntax: newline => line break, [[text]] => gold highlight
  var DEFAULT_SECTIONS = [
    {
      eyebrow: '',
      title:   '안녕하세요,\n와이케이메디 대표 [[김성준]]입니다.',
      sub:     '영업사원 출신으로서, 어떻게 하면 영업사원들이 더 영업에 도움이 될 수 있을지를 항상 고민해 오고 있습니다.\n\n영업활동에 도움이 되도록 제가 직접 최선을 다해 소통하겠습니다.',
      cta1: { label: '카카오톡 보내기', action: 'kakao', url: '', style: 'primary' },
      cta2: { label: '', action: 'none', url: '', style: 'glass' }
    },
    {
      eyebrow: '',
      title:   '와이케이메디만의\n[[특별한 서비스]]',
      sub:     '',
      list: [
        { t: '수수료 안전성 확보', d: '2018년부터 축적된 경험과 노하우로 수수료 안전성의 법률적 구조를 확보했습니다.' },
        { t: '실시간 소통 서비스', d: '의약품 / 의료소모품 / 의료기기 유통 및 빠른 대응을 위한 전담팀을 보유하고 있습니다.' },
        { t: '업계 최초 빠른정산 서비스', d: '통계 제출 후 빠른정산 요청 시 선정산해 드립니다. (선정산 수수료 1% 발생)' },
        { t: '빠른 가집계', d: '통계 제출 후 이미지 자동 인식으로 빠른 정산서를 제공해 자금 운용의 예측성을 높여줍니다.' },
        { t: '업무 자동화', d: '스위칭 품목 제안서 자동 생성, 간편 필터링 요청 등 번거로운 업무를 원클릭으로 제공합니다.' },
        { t: '경쟁력 있는 요율', d: '자체 프로모션을 통해 다산제약 15%, 유니메드 10%, 마더스 8% 등 경쟁력 있는 요율을 제공합니다.' },
        { t: '사업자 · 세무 · 법률 지원', d: '사업자등록 주소지(무료)와 세무 · 법률 등을 지원합니다.' }
      ],
      cta1: { label: '', action: 'none', url: '', style: 'glass' },
      cta2: { label: '', action: 'none', url: '', style: 'glass' }
    },
    {
      eyebrow: '',
      title:   'WHY [[Y.K MEDI]]',
      sub:     '',
      list: [
        '최소한의 비용으로 영업사원 이익 극대화',
        '단순 정산만 하는 업체와 차별화된 맞춤형 영업전략 수립\n(개원컨설팅 다수 — 인테리어 · 금융 · 의료기기 · 마케팅 · 병의원/약국 양수도 · 해외환자 유치 등)',
        'CSO 이외 추가 수익구조 컨설팅 및 제안'
      ],
      chips: ['CSO 실시간 전담팀', '의약품 납품 대행', '병의원 마케팅', '개원컨설팅 지원', '원내품목 대체품 및 수수료확인', '식자재 및 부식'],
      cta1: { label: '', action: 'none', url: '', style: 'glass' },
      cta2: { label: '', action: 'none', url: '', style: 'glass' }
    },
    {
      eyebrow: '',
      title:   '부담없이 편하게\n[[카카오톡]]으로 문의주세요.',
      sub:     '병의원/약국 양수도 플랫폼, 비대면진료 어플, 약국 유통네트워크, 건강기능식품 및 영양제 제조, 의약품 제조, 자사 CSO, 메디컬빌딩 시공, 개원컨설팅, 마케팅 등 여러 비즈니스 모델을 전개 중입니다.\n\n협업 적극 환영합니다. 언제든 부담없이 편하게 카카오톡으로 문의주세요. 내 일이라 생각하고 비즈니스 활동에 도움이 되도록 적극 나서겠습니다.',
      cta1: { label: '영업문의', action: 'kakao', url: '', style: 'primary' },
      cta2: { label: '제휴문의', action: 'kakao', url: '', style: 'primary' }
    }
  ];

  var DEFAULT_LINKS = {
    kakaoChannel: '#',   // 카카오채널 (우측 채널 아이콘)
    kakaoChat:    'https://open.kakao.com/me/ykmedi',   // 오픈채팅 (오픈챇 + 카카오톡 보내기 버튼)
    blog:         '#',   // 블로그
    kmd:          '#',   // KMD 통합검색 (품목요율)
    promo:        'https://www.notion.so/3453ef80ebd58051a346f9e015b27459?source=copy_link', // 프로모션(노션)
    excelName:    '',    // 요율표 엑셀 파일명
    excelData:    '',    // (구) 요율표 엑셀 data URL
    excelUrl:     '',    // 요율표 엑셀 공개 URL (Supabase Storage)
    videoUrl:     '',    // 배경 영상 공개 URL (Supabase Storage)
    videoName:    ''     // 업로드한 배경 영상 파일명
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function read(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  // --- IndexedDB (for large files e.g. background video) ---
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('mediline-files', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('files'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbSet(key, val) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction('files', 'readwrite');
        t.objectStore('files').put(val, key);
        t.oncomplete = function () { res(true); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  function idbGet(key) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction('files', 'readonly');
        var rq = t.objectStore('files').get(key);
        rq.onsuccess = function () { res(rq.result || null); };
        rq.onerror = function () { rej(rq.error); };
      });
    });
  }
  function idbDel(key) {
    return idb().then(function (db) {
      return new Promise(function (res) {
        var t = db.transaction('files', 'readwrite');
        t.objectStore('files').delete(key);
        t.oncomplete = function () { res(true); };
      });
    });
  }

  // ===================== Supabase layer =====================
  // Cache-first: sync getters read localStorage cache (instant render),
  // pull() refreshes from DB, push() writes to DB (admin only).
  var _sb = null;
  function sb() {
    if (_sb) return _sb;
    if (g.supabase && g.SUPABASE_URL && g.SUPABASE_KEY) {
      _sb = g.supabase.createClient(g.SUPABASE_URL, g.SUPABASE_KEY);
    }
    return _sb;
  }
  var CACHE_KEY = { popup: KEYS.POPUP, sections: KEYS.SECTIONS, links: KEYS.LINKS };

  g.MedStore = {
    KEYS: KEYS,
    defaultPopup:    function () { return clone(DEFAULT_POPUP); },
    defaultSections: function () { return clone(DEFAULT_SECTIONS); },

    getPopup: function () { return Object.assign(this.defaultPopup(), read(KEYS.POPUP, {})); },
    setPopup: function (p) { return write(KEYS.POPUP, p); },
    resetPopup: function () { try { localStorage.removeItem(KEYS.POPUP); } catch (e) {} },

    getSections: function () { var s = read(KEYS.SECTIONS, null); return (s && s.length) ? s : this.defaultSections(); },
    setSections: function (s) { return write(KEYS.SECTIONS, s); },
    resetSections: function () { try { localStorage.removeItem(KEYS.SECTIONS); } catch (e) {} },

    defaultLinks: function () { return clone(DEFAULT_LINKS); },
    getLinks: function () { return Object.assign(this.defaultLinks(), read(KEYS.LINKS, {})); },
    setLinks: function (l) { return write(KEYS.LINKS, l); },
    resetLinks: function () { try { localStorage.removeItem(KEYS.LINKS); } catch (e) {} },

    dismissPopupToday:     function () { write(KEYS.DISMISS, new Date().toDateString()); },
    isPopupDismissedToday: function () { return read(KEYS.DISMISS, '') === new Date().toDateString(); },

    idbSet: idbSet, idbGet: idbGet, idbDel: idbDel,

    // ---- Supabase: pull all config into cache ----
    hasBackend: function () { return !!sb(); },
    pull: function () {
      var c = sb();
      if (!c) return Promise.resolve(false);
      return c.from('configs').select('key,value').then(function (res) {
        if (res.error || !res.data) return false;
        res.data.forEach(function (row) {
          if (CACHE_KEY[row.key] && row.value) write(CACHE_KEY[row.key], row.value);
        });
        return true;
      }).catch(function () { return false; });
    },
    // ---- Supabase: write one config (admin, requires login) ----
    push: function (key, value) {
      var c = sb();
      if (!c) return Promise.reject(new Error('백엔드가 연결되지 않았습니다.'));
      return c.from('configs').upsert({ key: key, value: value, updated_at: new Date().toISOString() })
        .then(function (res) {
          if (res.error) throw res.error;
          if (CACHE_KEY[key]) write(CACHE_KEY[key], value);
          return true;
        });
    },
    // ---- auth ----
    signIn: function (email, pw) { var c = sb(); return c ? c.auth.signInWithPassword({ email: email, password: pw }) : Promise.reject(new Error('no backend')); },
    signOut: function () { var c = sb(); return c ? c.auth.signOut() : Promise.resolve(); },
    currentUser: function () { var c = sb(); return c ? c.auth.getUser() : Promise.resolve({ data: { user: null } }); },
    onAuth: function (cb) { var c = sb(); if (c) c.auth.onAuthStateChange(function (_e, s) { cb(s && s.user || null); }); },
    // ---- storage: upload file, return public URL ----
    uploadFile: function (path, file) {
      var c = sb();
      if (!c) return Promise.reject(new Error('no backend'));
      return c.storage.from('assets').upload(path, file, { upsert: true, cacheControl: '3600' })
        .then(function (res) {
          if (res.error) throw res.error;
          return c.storage.from('assets').getPublicUrl(path).data.publicUrl;
        });
    }
  };
})(window);
