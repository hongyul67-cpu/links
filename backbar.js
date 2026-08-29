/* ══════════════════════════════════════════════════════════════
   backbar.js — 어느 도구에서든 「뒤로 / 목록으로」 한 번에 나갈 수 있게

   붙이는 법 :  <script src="https://hongyul67-cpu.github.io/links/backbar.js"></script>
                (다른 위젯처럼 한 줄만 넣으면 된다. CSS 도 스스로 넣는다)

   무엇을 하나
     · 화면 왼쪽 아래에 작은 「← 뒤로」 단추를 붙인다.
     · 누르면 상황에 맞게 움직인다.
         ① 도구 안에 자체 홈이 있고 지금 홈이 아니면  → 그 홈으로 (도구가 알려 준 경우)
         ② 앞 화면에서 넘어왔으면                     → 브라우저 뒤로
         ③ 하위 페이지(board.html 등)에 있으면        → 그 도구의 index.html 로
         ④ 돌아갈 곳이 없으면                         → 단추를 아예 숨긴다
     · ?rc= 같은 파라미터는 그대로 물고 간다(결과수집 링크가 끊기지 않게).

   도구가 자체 홈을 알려 주려면 (선택)
       window.BACKBAR_HOME = function(){ go('home'); };      // 홈으로 보내는 함수
       window.BACKBAR_ATHOME = function(){ return 지금홈인가; };  // 지금 홈인지
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__backbar) return;
  window.__backbar = 1;

  var HIDE_ON = /\/(links-master|links)\/(index|master)\.html?$/i;   /* 마스터·허브 자신에는 안 붙인다 */
  if (HIDE_ON.test(location.pathname)) return;

  /* ── 가운데 내용을 화면의 70%까지 넓게 ───────────────────
     기본 폭(760~960px)이 큰 화면에서 너무 좁아 설명이 가운데로 몰려 보였다.
       · 1024px 이상 화면에서만 넓힌다(휴대폰·태블릿 세로는 그대로).
       · 원래 더 넓은 도구는 줄이지 않는다(max-width 대신 min-width 로 바닥만 올림).
       · 수업모드(cm-on)·전자칠판(bd-open/board/teach-open)은 자기 폭이 따로 있으니 건드리지 않는다.
       · 인쇄할 때도 건드리지 않는다(@media screen).
       · 이 도구만 원래 폭으로 두려면 :  window.NO_WIDE = 1;  (이 스크립트보다 먼저)
     ───────────────────────────────────── */
  (function wide() {
    if (window.NO_WIDE) return;
    if (/\/(links|links-master)\//.test(location.pathname)) return;   /* 허브 자신은 그대로 */
    if (document.getElementById('bb-wide')) return;
    var st = document.createElement('style');
    st.id = 'bb-wide';
    st.textContent =
      '@media screen and (min-width:1024px){'
      + 'body:not(.cm-on):not(.bd-open):not(.board):not(.teach-open) .wrap{'
      + 'min-width:min(70vw,1600px);}'
      + '}';
    (document.head || document.documentElement).appendChild(st);
  })();

  /* ── 어디로 갈 수 있는지 판단 ───────────────────────────── */
  function sameSite(u) {
    try { return new URL(u).origin === location.origin; } catch (e) { return false; }
  }
  function fileName() {
    var p = location.pathname.replace(/\/+$/, '');
    return decodeURIComponent(p.slice(p.lastIndexOf('/') + 1) || 'index.html');
  }
  function isIndex() {
    var f = fileName();
    return !f || /^index\.html?$/i.test(f);
  }
  /* 하위 페이지라면 같은 폴더의 index.html 로 (?rc= 등은 그대로 물고 간다) */
  function indexUrl() {
    return 'index.html' + location.search;
  }
  function cameFromSomewhere() {
    return history.length > 1 && (!document.referrer || sameSite(document.referrer));
  }

  function decide() {
    /* ① 도구가 알려 준 자체 홈 */
    if (typeof window.BACKBAR_HOME === 'function') {
      var athome = false;
      try { athome = (typeof window.BACKBAR_ATHOME === 'function') ? !!window.BACKBAR_ATHOME() : false; } catch (e) {}
      if (!athome) return { how: 'home', label: '← 목록으로' };
    }
    /* ② 앞 화면에서 넘어왔다 */
    if (cameFromSomewhere()) return { how: 'back', label: '← 뒤로' };
    /* ③ 하위 페이지 → 그 도구의 첫 화면 */
    if (!isIndex()) return { how: 'index', label: '← 목록으로' };
    /* ④ 갈 곳 없음 */
    return null;
  }

  /* ── 단추 ────────────────────────────────────────────────── */
  var css = ''
    + '#bb-btn{position:fixed;left:10px;bottom:10px;z-index:9997;'
    + 'font:700 13px/1 "Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",system-ui,sans-serif;'
    + 'background:rgba(255,255,255,.94);color:#1b2330;border:1px solid rgba(0,0,0,.18);'
    + 'border-radius:999px;padding:9px 14px;cursor:pointer;'
    + 'box-shadow:0 2px 10px rgba(0,0,0,.16);backdrop-filter:blur(3px);'
    + '-webkit-backdrop-filter:blur(3px);opacity:.82;transition:opacity .12s,transform .12s;}'
    + '#bb-btn:hover{opacity:1;transform:translateY(-1px);}'
    /* 좁은 화면(폰)에서는 화살표만 — 본문 단추를 덮는 넓이를 줄인다 */
    + '@media (max-width:560px){#bb-btn{padding:9px 11px;font-size:0;}'
    + '#bb-btn::before{content:"←";font-size:14px;font-weight:700;}}'
    + '#bb-btn:active{transform:translateY(0);}'
    + '@media print{#bb-btn{display:none!important;}}'
    /* 어두운 화면에서도 읽히게 */
    + '@media (prefers-color-scheme: dark){#bb-btn{background:rgba(28,34,46,.92);color:#eaf0fa;'
    + 'border-color:rgba(255,255,255,.22);}}';

  function paint() {
    var plan = decide();
    var b = document.getElementById('bb-btn');
    if (!plan) { if (b) b.remove(); return; }
    if (!b) {
      if (!document.getElementById('bb-css')) {
        var st = document.createElement('style');
        st.id = 'bb-css'; st.textContent = css;
        document.head.appendChild(st);
      }
      b = document.createElement('button');
      b.id = 'bb-btn'; b.type = 'button';
      b.setAttribute('aria-label', '뒤로 가기');
      b.addEventListener('click', function () {
        var p = decide();
        if (!p) return;
        if (p.how === 'home') { try { window.BACKBAR_HOME(); } catch (e) {} setTimeout(paint, 60); return; }
        if (p.how === 'back') { history.back(); return; }
        location.href = indexUrl();
      });
      document.body.appendChild(b);
    }
    b.textContent = plan.label;
    stack(b);
  }

  /* 왼쪽 아래에 다른 공용 단추(reset.js 의 「기록 초기화」)가 이미 있으면 그 위로 올라간다 */
  function stack(b) {
    var other = document.querySelector('.tr-btn');
    var up = 10;
    if (other && other !== b) {
      var r = other.getBoundingClientRect();
      if (r.height) up = Math.round(window.innerHeight - r.top) + 8;
    }
    b.style.bottom = up + 'px';
  }

  function start() {
    paint();
    /* 도구 안에서 화면이 바뀌면 문구도 따라 바뀌게 — 가볍게 지켜본다 */
    try {
      var mo = new MutationObserver(function () {
        clearTimeout(start._t);
        start._t = setTimeout(paint, 250);
      });
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    } catch (e) {}
    window.addEventListener('popstate', paint);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
