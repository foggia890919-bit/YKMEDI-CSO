/* =========================================================
   MEDILINE PARTNERS — landing interactions
   ========================================================= */
(function () {
  'use strict';

  var Store = window.MedStore;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  // title mini-syntax: \n -> <br>, [[x]] -> <em>x</em>
  function fmtTitle(s) {
    return esc(s).replace(/\n/g, '<br>').replace(/\[\[(.+?)\]\]/g, '<em>$1</em>');
  }
  function fmtBreaks(s) {
    return esc(s).replace(/\n/g, '<br>');
  }
  function openKakao() {
    if (KAKAO_CHANNEL && KAKAO_CHANNEL !== '#') window.open(KAKAO_CHANNEL, '_blank', 'noopener');
    else alert('카카오 채널 링크가 곧 연결됩니다. (관리자에게 링크를 요청하세요)');
  }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  // 외부 링크 / 파일 (관리자에서 설정)
  var LINKS = Store ? Store.getLinks() : {};
  var KAKAO_CHANNEL = LINKS.kakaoChat || '#';

  function openUrl(u) {
    if (u && u !== '#') window.open(u, '_blank', 'noopener');
    else alert('링크가 아직 등록되지 않았습니다. (관리자 → 링크·파일 관리)');
  }
  function downloadExcel() {
    var url = LINKS.excelUrl || LINKS.excelData;
    if (url) {
      var a = document.createElement('a');
      a.href = url; a.download = LINKS.excelName || '요율표.xlsx';
      if (LINKS.excelUrl) a.target = '_blank';
      document.body.appendChild(a); a.click(); a.remove();
    } else alert('요율표 엑셀 파일이 아직 등록되지 않았습니다. (관리자 → 링크·파일 관리)');
  }

  function ctaHtml(cta) {
    if (!cta || !cta.label || cta.action === 'none') return '';
    var cls = cta.style === 'primary' ? 'btn btn-primary' : 'btn btn-glass';
    var attr;
    if (cta.action === 'url') attr = 'data-href="' + esc(cta.url) + '"';
    else if (cta.action === 'kakao') attr = 'data-kakao';
    else attr = 'data-open="' + esc(cta.action) + '"';
    var arrow = cta.style === 'primary' ? ARROW : '';
    return '<button class="' + cls + '" ' + attr + '>' + esc(cta.label) + arrow + '</button>';
  }

  /* ---------- build scroll panels from config ---------- */
  function buildPanels() {
    var host = document.getElementById('panels');
    if (!host || !Store) return;
    var sections = Store.getSections();
    var html = '';
    sections.forEach(function (s, i) {
      var Tag = i === 0 ? 'h1' : 'h2';
      var ctas = ctaHtml(s.cta1) + ctaHtml(s.cta2);
      html += '<section class="panel" data-screen-label="' + ('0' + (i + 1)).slice(-2) + '">'
        + '<div class="panel__inner"><div class="panel__copy">'
        + (s.eyebrow ? '<p class="eyebrow up">' + esc(s.eyebrow) + '</p>' : '')
        + '<' + Tag + ' class="p-title up">' + fmtTitle(s.title) + '</' + Tag + '>'
        + (s.sub ? '<p class="p-sub up">' + fmtBreaks(s.sub) + '</p>' : '')
        + (s.list && s.list.length
            ? '<ol class="p-list">' + s.list.map(function (it, n) {
                var body;
                if (typeof it === 'string') { body = '<span>' + fmtBreaks(it) + '</span>'; }
                else {
                  var inner = '<strong>' + esc(it.t) + '</strong>' + (it.d ? '<i>' + esc(it.d) + '</i>' : '');
                  if (it.cases && it.cases.length) {
                    inner += '<button class="case-toggle" data-case-toggle>사례 보기 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>';
                    inner += '<div class="case-list">' + it.cases.map(function (c) {
                      return '<div class="case"><b>' + esc(c.title) + '</b><p>' + esc(c.body) + '</p><span class="case-res">결과 · ' + esc(c.result) + '</span></div>';
                    }).join('') + '</div>';
                  }
                  if (it.link) {
                    inner += '<button class="case-toggle" data-golink="' + esc(it.link) + '">보러가기 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
                  }
                  body = '<span>' + inner + '</span>';
                }
                return '<li class="up"><b>' + (n + 1) + '</b>' + body + '</li>';
              }).join('') + '</ol>'
            : '')
        + (s.chips && s.chips.length
            ? '<div class="chips up">' + s.chips.map(function (c) {
                return '<button class="chip" data-kakao>' + esc(c) + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>';
              }).join('')
              + '</div>'
            : '')
        + (ctas ? '<div class="actions up">' + ctas + '</div>' : '')
        + '</div></div>'
        + (i === 0 ? '<div class="scroll-cue">SCROLL<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></div>' : '')
        + '</section>';
    });
    host.innerHTML = html;
  }

  /* ---------- reveal panels (transform-only; never hides content) ---------- */
  function setupReveal() {
    var ups = document.querySelectorAll('.up');
    function seeAll() { ups.forEach(function (u) { u.classList.add('seen'); }); }
    if (!('IntersectionObserver' in window)) { seeAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var items = e.target.querySelectorAll('.up');
          items.forEach(function (u, i) { u.style.animationDelay = (i * 0.07) + 's'; u.classList.add('seen'); });
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.panel, .footer').forEach(function (p) { io.observe(p); });
  }

  /* ---------- background video (uploaded file > URL > YouTube) + sound ---------- */
  var VIDEO_ID = 'hIj9VovDYDQ';
  var START = 0;
  var ytPlayer = null;
  var bgVideoEl = null;
  var mode = 'yt';
  var soundOn = true;
  var userToggled = false;

  var soundBtn = document.getElementById('soundBtn');
  function updateSoundBtn() {
    if (!soundBtn) return;
    soundBtn.classList.toggle('muted', !soundOn);
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
  }
  function applyMute(muted) {
    if (mode === 'video' && bgVideoEl) {
      bgVideoEl.muted = muted;
      bgVideoEl.volume = 0.4;
      if (!muted) { var p = bgVideoEl.play(); if (p && p.catch) p.catch(function () {}); }
    } else if (ytPlayer && ytPlayer.mute) {
      if (muted) ytPlayer.mute(); else { ytPlayer.unMute(); ytPlayer.setVolume(40); }
    }
  }
  function firstGesture() {
    if (!userToggled && soundOn) applyMute(false);
    ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click'].forEach(function (ev) {
      window.removeEventListener(ev, firstGesture);
    });
  }
  ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click'].forEach(function (ev) {
    window.addEventListener(ev, firstGesture, { passive: true });
  });
  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      userToggled = true; soundOn = !soundOn; applyMute(!soundOn); updateSoundBtn();
    });
  }

  function useVideoFile(src) {
    mode = 'video';
    var yt = document.getElementById('ytbg'); if (yt) yt.style.display = 'none';
    bgVideoEl = document.createElement('video');
    bgVideoEl.id = 'bgvid';
    bgVideoEl.muted = true; bgVideoEl.defaultMuted = true;
    bgVideoEl.loop = true; bgVideoEl.autoplay = true; bgVideoEl.playsInline = true;
    bgVideoEl.setAttribute('muted', ''); bgVideoEl.setAttribute('autoplay', '');
    bgVideoEl.setAttribute('loop', ''); bgVideoEl.setAttribute('playsinline', '');
    bgVideoEl.setAttribute('preload', 'auto');
    bgVideoEl.src = src;
    var host = document.querySelector('.video-bg');
    if (host) host.appendChild(bgVideoEl);
    function tryPlay() { var p = bgVideoEl.play(); if (p && p.catch) p.catch(function () {}); }
    bgVideoEl.addEventListener('loadeddata', tryPlay);
    bgVideoEl.addEventListener('canplay', tryPlay);
    bgVideoEl.addEventListener('ended', function () { try { bgVideoEl.currentTime = 0; } catch (e) {} tryPlay(); });
    bgVideoEl.addEventListener('pause', function () { if (!document.hidden) setTimeout(tryPlay, 80); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && mode === 'video' && bgVideoEl) tryPlay(); });
    tryPlay();
  }
  function loadYouTube() {
    mode = 'yt';
    function createPlayer() {
      ytPlayer = new YT.Player('ytbg', {
        videoId: VIDEO_ID,
        playerVars: { autoplay: 1, mute: 1, controls: 0, start: START, loop: 1, playlist: VIDEO_ID, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, disablekb: 1, fs: 0 },
        events: {
          onReady: function (e) { e.target.mute(); e.target.playVideo(); startWatchdog(); },
          onStateChange: function (e) {
            if (e.data === YT.PlayerState.ENDED) { ytPlayer.seekTo(START, true); ytPlayer.playVideo(); }
            // if it gets cued/paused before any user gesture, nudge it back to playing
            if ((e.data === YT.PlayerState.CUED || e.data === YT.PlayerState.PAUSED) && !userToggled) {
              try { ytPlayer.mute(); ytPlayer.playVideo(); } catch (x) {}
            }
          }
        }
      });
      window.__ytp = ytPlayer;
    }
    // periodically ensure it's actually playing (covers blocked-autoplay/cued states)
    function startWatchdog() {
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (!ytPlayer || !ytPlayer.getPlayerState) return;
        var st = ytPlayer.getPlayerState();
        if (st !== YT.PlayerState.PLAYING && st !== YT.PlayerState.BUFFERING && !userToggled) {
          try { ytPlayer.mute(); ytPlayer.playVideo(); } catch (x) {}
        }
        if (tries > 20) clearInterval(iv);   // stop after ~20s
      }, 1000);
    }
    if (window.YT && window.YT.Player) { createPlayer(); return; }
    // chain onto any existing callback so we don't clobber it
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (typeof prev === 'function') { try { prev(); } catch (x) {} } createPlayer(); };
    if (!document.getElementById('yt-iframe-api')) {
      var tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }
  function initBackground() {
    if (LINKS.videoUrl) useVideoFile(LINKS.videoUrl); else loadYouTube();
    updateSoundBtn();
  }

  /* ---------- nav scrolled state + back to top ---------- */
  var nav = document.getElementById('nav');
  var toTop = document.getElementById('toTop');
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 40);
    if (toTop) toTop.classList.toggle('is-on', y > 600);
  }, { passive: true });
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- mobile drawer ---------- */
  var drawer = document.getElementById('drawer');
  var navToggle = document.getElementById('navToggle');
  if (navToggle && drawer) navToggle.addEventListener('click', function () { drawer.classList.toggle('is-open'); });

  /* ---------- 요율표 드롭다운 ---------- */
  var rateDD = document.getElementById('rateDD');
  function closeRateDD() { if (rateDD) rateDD.classList.remove('open'); }
  var rateBtn = document.getElementById('rateBtn');
  if (rateBtn && rateDD) {
    rateBtn.addEventListener('click', function (e) { e.stopPropagation(); rateDD.classList.toggle('open'); });
    document.addEventListener('click', function (e) { if (!rateDD.contains(e.target)) closeRateDD(); });
  }

  /* ---------- search overlay ---------- */
  var search = document.getElementById('search');
  var searchInput = document.getElementById('searchInput');
  var searchHint = document.getElementById('searchHint');
  function openSearch() { search.classList.add('is-open'); if (drawer) drawer.classList.remove('is-open'); setTimeout(function () { searchInput && searchInput.focus(); }, 50); }
  function closeSearch() { if (search) search.classList.remove('is-open'); if (searchHint) searchHint.style.display = 'none'; }
  ['openSearch', 'openSearchM'].forEach(function (id) { var b = document.getElementById(id); if (b) b.addEventListener('click', openSearch); });
  var cs = document.getElementById('closeSearch'); if (cs) cs.addEventListener('click', closeSearch);
  var sf = document.getElementById('searchForm');
  if (sf) sf.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = (searchInput.value || '').trim(); if (!q) return;
    searchHint.style.display = 'block';
    searchHint.textContent = '“' + q + '” 검색은 상담을 통해 안내해 드립니다. 원내주문/상담을 이용해 주세요.';
  });

  /* ---------- modals ---------- */
  function openModal(name) {
    var m = document.getElementById('modal-' + name);
    if (!m) return;
    closeSearch(); if (drawer) drawer.classList.remove('is-open');
    m.classList.add('is-open'); document.body.style.overflow = 'hidden';
    var f = m.querySelector('input,select,textarea,button'); setTimeout(function () { f && f.focus(); }, 60);
  }
  function closeModal(m) { m.classList.remove('is-open'); document.body.style.overflow = ''; }
  document.addEventListener('click', function (e) {
    var caseBtn = e.target.closest('[data-case-toggle]');
    if (caseBtn) { var cl = caseBtn.nextElementSibling; if (cl && cl.classList.contains('case-list')) { cl.classList.toggle('open'); caseBtn.classList.toggle('open'); } return; }
    var goBtn = e.target.closest('[data-golink]');
    if (goBtn) { openUrl(goBtn.getAttribute('data-golink')); return; }
    var scrollBtn = e.target.closest('[data-scroll]');
    if (scrollBtn) {
      if (drawer) drawer.classList.remove('is-open');
      closeSearch();
      var target = scrollBtn.getAttribute('data-scroll');
      if (target === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    var openBtn = e.target.closest('[data-open]');
    if (openBtn) { openModal(openBtn.getAttribute('data-open')); return; }
    if (e.target.closest('[data-kakao]')) { openKakao(); return; }
    var promoB = e.target.closest('[data-promo]'); if (promoB) { openUrl(LINKS.promo); return; }
    var kmdB = e.target.closest('[data-kmd]'); if (kmdB) { closeRateDD(); openUrl(LINKS.kmd); return; }
    var excelB = e.target.closest('[data-excel]'); if (excelB) { closeRateDD(); downloadExcel(); return; }
    var hrefBtn = e.target.closest('[data-href]');
    if (hrefBtn) { var u = hrefBtn.getAttribute('data-href'); if (u) window.open(u, '_blank', 'noopener'); return; }
    var closeBtn = e.target.closest('[data-close]');
    if (closeBtn) { var m = closeBtn.closest('.modal'); if (m) closeModal(m); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.modal.is-open');
    if (open) closeModal(open);
    else if (search && search.classList.contains('is-open')) closeSearch();
  });

  /* ---------- lead form ---------- */
  function wireForm() {
    var form = document.getElementById('leadForm');
    var orderModal = document.getElementById('modal-order');
    if (!form || !orderModal) return;
    function setErr(name, on) { var f = form.querySelector('[data-field="' + name + '"]'); if (f) f.classList.toggle('field--error', on); }
    form.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('input', function () { var f = i.closest('.field'); if (f) f.classList.remove('field--error'); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (!form.name.value.trim()) { setErr('name', true); ok = false; }
      if (!/[0-9][0-9\-\s]{6,}/.test(form.phone.value.trim())) { setErr('phone', true); ok = false; }
      if (!form.agree.checked) { ok = false; alert('개인정보 수집·이용에 동의해 주세요.'); }
      if (!ok) return;
      orderModal.querySelector('.modal__box').classList.add('is-sent');
    });
  }

  /* ---------- entry popup ---------- */
  function buildPopup() {
    if (!Store) return;
    var cfg = Store.getPopup();
    if (!cfg.enabled || Store.isPopupDismissedToday()) return;
    var root = document.getElementById('popup-root');
    if (!root) return;
    var actionAttr = cfg.btnAction === 'kakao'
      ? 'data-pop-kakao'
      : (cfg.btnAction === 'url'
          ? 'data-pop-href="' + esc(cfg.btnUrl) + '"'
          : 'data-pop-open="' + esc(cfg.btnAction) + '"');
    var kakaoIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.94 5.33 4.86 6.73-.21.74-.77 2.7-.88 3.12-.14.52.19.51.4.37.16-.11 2.6-1.77 3.66-2.49.64.09 1.3.14 1.96.14 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>';
    var cta = (cfg.btnText && cfg.btnAction !== 'none')
      ? '<button class="popup__cta" ' + actionAttr + '>' + (cfg.btnAction === 'kakao' ? kakaoIcon : '') + esc(cfg.btnText) + '</button>' : '';
    var brand = '<span class="popup__brand"><b>YK</b> 와이케이메디</span>';
    var hasImg = !!cfg.imageUrl;
    root.innerHTML =
      '<div class="popup is-open" id="popup">' +
        '<div class="popup__scrim" data-pop-close></div>' +
        '<div class="popup__card">' +
          '<button class="popup__x" data-pop-close aria-label="닫기">\u2715</button>' +
          (hasImg ? '<div class="popup__hero"><img src="' + esc(cfg.imageUrl) + '" alt="">' + brand + '</div>' : '') +
          '<div class="popup__body' + (hasImg ? '' : ' popup__body--plain') + '">' +
            (hasImg ? '' : brand + '<div style="height:18px"></div>') +
            (cfg.eyebrow ? '<p class="popup__eyebrow">' + esc(cfg.eyebrow) + '</p>' : '') +
            '<h3 class="popup__title">' + esc(cfg.title) + '</h3>' +
            (cfg.body ? '<p class="popup__text">' + esc(cfg.body) + '</p>' : '') +
            cta +
          '</div>' +
          '<div class="popup__foot">' +
            '<label class="popup__today"><input type="checkbox" id="popToday">오늘 하루 보지 않기</label>' +
            '<button class="popup__close" data-pop-close>닫기</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    function closePopup() {
      var t = document.getElementById('popToday');
      if (t && t.checked) Store.dismissPopupToday();
      root.innerHTML = '';
    }
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-pop-close]')) { closePopup(); return; }
      if (e.target.closest('[data-pop-kakao]')) { closePopup(); openKakao(); return; }
      var openB = e.target.closest('[data-pop-open]');
      if (openB) { closePopup(); openModal(openB.getAttribute('data-pop-open')); return; }
      var hrefB = e.target.closest('[data-pop-href]');
      if (hrefB) { var u = hrefB.getAttribute('data-pop-href'); closePopup(); if (u) window.open(u, '_blank', 'noopener'); }
    });
  }

  /* ---------- init (cache-first render, then refresh from Supabase) ---------- */
  function setRailHrefs() {
    var railCh = document.querySelector('.rail__btn--ch');
    if (railCh) railCh.setAttribute('href', LINKS.kakaoChannel && LINKS.kakaoChannel !== '#' ? LINKS.kakaoChannel : (LINKS.kakaoChat || '#'));
    var map = { '.rail__btn--chat': LINKS.kakaoChat, '.rail__btn--blog': LINKS.blog, '.rail__btn--kmd': LINKS.kmd };
    Object.keys(map).forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el && map[sel] && map[sel] !== '#') el.setAttribute('href', map[sel]);
    });
  }
  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    LINKS = Store ? Store.getLinks() : {};
    KAKAO_CHANNEL = LINKS.kakaoChat || '#';
    setRailHrefs();
    buildPanels();
    wireForm();
    setupReveal();
    buildPopup();
    initBackground();
  }
  if (Store && Store.hasBackend && Store.hasBackend()) {
    var t = setTimeout(boot, 1800);  // don't wait forever on slow network
    Store.pull().then(function () { clearTimeout(t); boot(); }).catch(function () { clearTimeout(t); boot(); });
  } else {
    boot();
  }
})();
