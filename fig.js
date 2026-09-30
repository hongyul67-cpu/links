/* ══════════════════════════════════════════════════════════════
   fig.js — 공용 그림 도우미  v1 (2026-09-30)
   https://hongyul67-cpu.github.io/links/fig.js

   배우기 카드 · 수업 슬라이드 · 해설에 넣는 SVG 그림을 **같은 모양**으로 그린다.
   50개 도구가 함께 쓰는 파일이다 — **이미 있는 함수의 동작을 바꾸지 않는다.**
   새 기능은 새 함수 · 새 옵션으로 붙이고, 아래 「고친 이력」에 적는다.
   도구 저장소에 사본을 두지 않는다(board.js 사본 사고). 항상 이 주소로 부른다.

   ▸ 붙이는 법 (도구의 index.html)
       <script src="https://hongyul67-cpu.github.io/links/fig.js"></script>
       <script src="figs.js"></script>            ← 그 도구의 그림 모음
     슬라이드(lesson.js)에서도 쓰려면 lesson.js 보다 **먼저** 불러 둔다.

   ▸ 그림 모음(figs.js) 모양
       var FIGS = {
         fdm: { cap:'FDM — 녹인 필라멘트를 한 층씩 쌓는다',
                draw: function(){ var F = FIG; return F.svg(480, 300, F.box(…) + F.t(…)); } },
         …
       };
     draw 는 처음 쓸 때 한 번만 불리고 결과를 기억해 둔다.

   ▸ 쓰는 법
       FIG.figure('fdm')              → <figure> HTML (그림 + 캡션, 누르면 크게)
       FIG.figure('fdm',{labels:false}) → 정답이 되는 이름표(ans:true)를 가린 그림 — 문제·게임용
       FIG.gallery(['fdm','sla'])     → 그림 여러 장을 격자로
       FIG.svgOf('fdm')               → SVG 문자열만 — 수업 슬라이드의 svg: 칸에
       FIG.cap('fdm')                 → 캡션 글자
       FIG.zoom('fdm')                → 화면 가득 크게 보기
       <div data-fig="fdm"></div> + FIG.mount()  → 빈 칸을 찾아 그림을 채운다

   ▸ 그리기 함수 — 모두 SVG 문자열을 돌려준다. 좌표는 viewBox 기준.
       FIG.svg(w,h,body,{title})       종이(흰 바탕)까지 포함한 <svg>. 폭 440~520 권장
       FIG.t(x,y,'글자',{size,b,c,a,ans,halo})  a: 's'|'m'|'e' · 줄바꿈은 \n · ans:true = 정답 이름표
       FIG.line(x1,y1,x2,y2,{c,w,dash})  dash: 'hidden'(숨은선) | 'center'(중심선) | '4 3'
       FIG.path(d,{c,w,fill,dash})     FIG.poly([[x,y],…],{close,…})
       FIG.box(x,y,w,h,{fill,c,w,r,label,size,lc,b})
       FIG.circle(cx,cy,r,{fill,c,w,label,…})
       FIG.arrow(x1,y1,x2,y2,{c,w,head,both,flow})   flow:true = 흐르는 점선(움직임)
       FIG.route([[x,y],…],{…})        꺾인 화살표
       FIG.dim(x1,y1,x2,y2,'30',{off,side})   치수선(양쪽 화살표 + 치수 글자, off 만큼 띄우면 치수보조선까지)
       FIG.callout(px,py,tx,ty,'이름',{c,a,ans})  지시선 이름표 — 점에서 글자까지
       FIG.hatch(x,y,w,h,{gap,c})      45° 해칭
       FIG.num(x,y,n,{c})              번호 동그라미 ①②③
       FIG.g(body,{x,y,s,r})           묶어서 옮기기·키우기·돌리기
       FIG.C                           팔레트 (아래)

   ▸ 규격 요약 (자세한 것은 작업지시-그림.md 3장 · links/CONVENTIONS.md 7장)
       · 그림 안에 흰 종이 바탕이 들어간다 → 어두운 화면·전자칠판에서도 그대로 보인다
       · 글자 16 이 기본(폰 390 폭에서 약 11px). 한 그림에 이름표 8개 이하
       · 선: 외형 2.2 · 보조 1.4 · 치수/지시선 1
       · 강조색은 한 그림에 3개 이하

   고친 이력
     v1 2026-09-30  처음 만듦 (그림00 · 시범 3dprinter-master)
   ══════════════════════════════════════════════════════════════ */
(function () {
  if (window.FIG && window.FIG.version) return;

  var C = {
    ink: '#1f2937', sub: '#6b7280', line: '#9ca3af', paper: '#ffffff', edge: '#e5e7eb',
    blue: '#2563eb', red: '#dc2626', green: '#16a34a', orange: '#ea580c', purple: '#7c3aed',
    blueL: '#dbeafe', redL: '#fee2e2', greenL: '#dcfce7', orangeL: '#ffedd5',
    purpleL: '#ede9fe', yellowL: '#fef9c3', grayL: '#f3f4f6', grayM: '#d1d5db'
  };
  var FONT = "'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif";

  function n(v) { return Math.round(v * 10) / 10; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z]+);)/gi, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attrEsc(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/"/g, '&quot;'); }
  function dashOf(d) {
    if (!d) return '';
    if (d === 'hidden') d = '6 4';
    else if (d === 'center') d = '14 4 2 4';
    else if (d === true) d = '6 4';
    return ' stroke-dasharray="' + d + '"';
  }
  function anchor(a) {
    return a === 'm' || a === 'middle' ? 'middle' : (a === 'e' || a === 'end' ? 'end' : 'start');
  }

  /* ── 종이 ───────────────────────────────────── */
  function svg(w, h, body, o) {
    o = o || {};
    var head = '';
    if (o.title) head = t(16, 30, o.title, { size: 17, b: 1 });
    return '<svg class="fig-svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%" ' +
      'xmlns="http://www.w3.org/2000/svg" role="img" font-family="' + FONT + '"' +
      (o.label ? ' aria-label="' + attrEsc(o.label) + '"' : '') + '>' +
      '<rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="12" fill="' + C.paper +
      '" stroke="' + C.edge + '" stroke-width="2"/>' + head + (body || '') + '</svg>';
  }

  /* ── 글자 ───────────────────────────────────── */
  function t(x, y, s, o) {
    o = o || {};
    var size = o.size || 16, lines = String(s).split('\n');
    var halo = o.halo === false ? '' :
      ' paint-order="stroke" stroke="' + (o.hc || C.paper) + '" stroke-width="' + (o.hw || 4) + '" stroke-linejoin="round"';
    var body;
    if (lines.length === 1) body = esc(s);
    else {
      var lh = size * 1.28, y0 = -(lines.length - 1) * lh / 2 * (o.v === 'top' ? 0 : 1);
      body = lines.map(function (ln, i) {
        return '<tspan x="' + n(x) + '" dy="' + n(i === 0 ? y0 : lh) + '">' + esc(ln) + '</tspan>';
      }).join('');
    }
    var el = '<text x="' + n(x) + '" y="' + n(y) + '" font-size="' + size + '" fill="' + (o.c || C.ink) +
      '" text-anchor="' + anchor(o.a) + '" dominant-baseline="' + (o.base || 'middle') + '"' +
      (o.b ? ' font-weight="700"' : '') + halo + '>' + body + '</text>';
    if (!o.ans) return el;
    /* 정답 이름표: labels:false 일 때 글자 대신 ? 가 보인다 */
    return '<g class="fig-ans">' + el + '</g>' +
      '<text class="fig-q" x="' + n(x) + '" y="' + n(y) + '" font-size="' + size + '" fill="' + C.orange +
      '" font-weight="700" text-anchor="' + anchor(o.a) + '" dominant-baseline="middle">?</text>';
  }

  /* ── 선 · 도형 ──────────────────────────────── */
  function stroke(o, dw) {
    return ' stroke="' + (o.c || C.ink) + '" stroke-width="' + (o.w || dw) + '"' + dashOf(o.dash) +
      ' stroke-linecap="round" stroke-linejoin="round"';
  }
  function line(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) + '"' +
      stroke(o, 2.2) + (o.flow ? ' class="fig-flow"' : '') + '/>';
  }
  function path(d, o) {
    o = o || {};
    return '<path d="' + d + '" fill="' + (o.fill || 'none') + '"' + stroke(o, 2.2) +
      (o.op != null ? ' opacity="' + o.op + '"' : '') + (o.flow ? ' class="fig-flow"' : '') + '/>';
  }
  function poly(pts, o) {
    o = o || {};
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + n(p[0]) + ',' + n(p[1]); }).join(' ') + (o.close ? ' Z' : '');
    return path(d, o);
  }
  function label(cx, cy, o) {
    if (o.label == null || o.label === '') return '';
    return t(cx, cy, o.label, { size: o.size || 16, b: o.b !== 0 && o.b !== false, c: o.lc || C.ink,
      a: 'm', halo: false, ans: o.ans });
  }
  function box(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" rx="' +
      (o.r == null ? 8 : o.r) + '" fill="' + (o.fill || C.grayL) + '"' + stroke(o, 1.6) + '/>' +
      label(x + w / 2, y + h / 2, o);
  }
  function circle(cx, cy, r, o) {
    o = o || {};
    return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" fill="' + (o.fill || C.grayL) + '"' +
      stroke(o, 1.6) + '/>' + label(cx, cy, o);
  }

  /* ── 화살표 (마커 대신 삼각형 — 숨겨진 SVG 의 id 를 참조하다 깨지는 일이 없다) ── */
  function head(x, y, ang, size, c) {
    var a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85, s = size;
    return '<polygon points="' + n(x) + ',' + n(y) + ' ' + n(x + s * Math.cos(a1)) + ',' + n(y + s * Math.sin(a1)) +
      ' ' + n(x + s * Math.cos(a2)) + ',' + n(y + s * Math.sin(a2)) + '" fill="' + c + '"/>';
  }
  function arrow(x1, y1, x2, y2, o) {
    o = o || {};
    var c = o.c || C.ink, hs = o.head || 11, ang = Math.atan2(y2 - y1, x2 - x1);
    var bx = x2 - Math.cos(ang) * hs * 0.7, by = y2 - Math.sin(ang) * hs * 0.7;
    var sx = x1, sy = y1, out = '';
    if (o.both) { sx = x1 + Math.cos(ang) * hs * 0.7; sy = y1 + Math.sin(ang) * hs * 0.7; out += head(x1, y1, ang + Math.PI, hs, c); }
    return line(sx, sy, bx, by, { c: c, w: o.w || 2.2, dash: o.dash, flow: o.flow }) + out + head(x2, y2, ang, hs, c);
  }
  function route(pts, o) {
    o = o || {};
    var last = pts.length - 1, a = pts[last - 1], b = pts[last];
    var c = o.c || C.ink, hs = o.head || 11, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    var cut = pts.slice(0, last).concat([[b[0] - Math.cos(ang) * hs * 0.7, b[1] - Math.sin(ang) * hs * 0.7]]);
    return poly(cut, { c: c, w: o.w || 2.2, dash: o.dash, flow: o.flow }) + head(b[0], b[1], ang, hs, c);
  }

  /* ── 제도용 ─────────────────────────────────── */
  /* 치수선: (x1,y1)-(x2,y2) 사이. off 를 주면 그만큼 띄워 긋고 치수보조선을 그린다(side 로 방향) */
  function dim(x1, y1, x2, y2, txt, o) {
    o = o || {};
    var c = o.c || C.ink, off = o.off || 0, ang = Math.atan2(y2 - y1, x2 - x1);
    var nx = -Math.sin(ang), ny = Math.cos(ang);
    /* 기본은 위(수평선) · 왼쪽(수직선) 으로 띄운다. side:-1 이면 반대쪽 */
    if (ny > 0.01 || (Math.abs(ny) <= 0.01 && nx > 0)) { nx = -nx; ny = -ny; }
    if (o.side === -1) { nx = -nx; ny = -ny; }
    var ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off, out = '';
    if (off) {
      out += line(x1 + nx * 3, y1 + ny * 3, ax + nx * 6, ay + ny * 6, { c: c, w: 1 });
      out += line(x2 + nx * 3, y2 + ny * 3, bx + nx * 6, by + ny * 6, { c: c, w: 1 });
    }
    out += arrow(ax, ay, bx, by, { c: c, w: 1, head: 9, both: true });
    if (txt != null && txt !== '') {
      var mx = (ax + bx) / 2 + nx * 11, my = (ay + by) / 2 + ny * 11, deg = ang * 180 / Math.PI;
      if (deg > 90 || deg <= -90) deg += 180;
      out += '<g transform="rotate(' + n(deg) + ' ' + n(mx) + ' ' + n(my) + ')">' +
        t(mx, my, txt, { size: o.size || 15, c: c, a: 'm', ans: o.ans }) + '</g>';
    }
    return out;
  }
  /* 지시선 이름표: 가리키는 점(px,py) → 글자 자리(tx,ty) */
  function callout(px, py, tx, ty, txt, o) {
    o = o || {};
    var c = o.c || C.sub, a = o.a || (tx >= px ? 's' : 'e'), sh = a === 's' ? 6 : (a === 'e' ? -6 : 0);
    return '<circle cx="' + n(px) + '" cy="' + n(py) + '" r="3" fill="' + c + '"/>' +
      line(px, py, tx, ty, { c: c, w: 1.2 }) +
      t(tx + sh, ty, txt, { size: o.size || 15, c: o.tc || C.ink, a: a, b: o.b, ans: o.ans });
  }
  /* 45° 해칭 — 사각형 안에만 긋는다 */
  function hatch(x, y, w, h, o) {
    o = o || {};
    var g = o.gap || 9, out = '';
    for (var k = g; k < w + h; k += g) {
      var sx = x + Math.max(0, k - h), sy = y + Math.min(h, k), ex = x + Math.min(w, k), ey = y + Math.max(0, k - w);
      out += line(sx, sy, ex, ey, { c: o.c || C.ink, w: o.w || 1 });
    }
    return out;
  }
  function num(x, y, k, o) {
    o = o || {};
    return '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + (o.r || 12) + '" fill="' + (o.c || C.blue) + '"/>' +
      t(x, y + 0.5, k, { size: o.size || 14, c: '#fff', a: 'm', b: 1, halo: false });
  }
  function g(body, o) {
    o = o || {};
    var tr = [];
    if (o.x || o.y) tr.push('translate(' + (o.x || 0) + ' ' + (o.y || 0) + ')');
    if (o.r) tr.push('rotate(' + o.r + ')');
    if (o.s) tr.push('scale(' + o.s + ')');
    return '<g' + (tr.length ? ' transform="' + tr.join(' ') + '"' : '') + (o.op != null ? ' opacity="' + o.op + '"' : '') + '>' + body + '</g>';
  }

  /* ── 그림 모음(FIGS) 읽기 ───────────────────── */
  var cache = {};
  function entry(key) {
    var F = window.FIGS || {}, e = F[key];
    if (!e) return null;
    if (typeof e === 'function') e = { draw: e, cap: '' };
    return e;
  }
  function has(key) { return !!entry(key); }
  function cap(key) { var e = entry(key); return e ? (e.cap || '') : ''; }
  function svgOf(key, o) {
    o = o || {};
    var s;
    if (/^\s*<svg/.test(key)) s = key;
    else {
      if (!(key in cache)) {
        var e = entry(key);
        if (!e) { if (window.console) console.warn('[fig.js] 그림 없음: ' + key); return ''; }
        try { cache[key] = e.draw(); } catch (err) { console.error('[fig.js] ' + key, err); cache[key] = ''; }
      }
      s = cache[key];
    }
    var label = o.cap != null ? o.cap : cap(key);
    if (label && s.indexOf('aria-label=') < 0) s = s.replace('<svg class="fig-svg"', '<svg class="fig-svg" aria-label="' + attrEsc(label) + '"');
    if (o.labels === false) s = s.replace('class="fig-svg"', 'class="fig-svg fig-nolabel"');
    return s;
  }

  /* ── HTML ───────────────────────────────────── */
  function figure(key, o) {
    o = o || {};
    var s = svgOf(key, o); if (!s) return '';
    var c = o.cap != null ? o.cap : cap(key);
    return '<figure class="fig' + (o.cls ? ' ' + o.cls : '') + '" tabindex="0"' +
      (/^\s*</.test(key) ? '' : ' data-fig-key="' + attrEsc(key) + '"') +
      (o.labels === false ? ' data-fig-nolabel="1"' : '') + '>' + s +
      (c ? '<figcaption>' + c + '</figcaption>' : '') + '</figure>';
  }
  function gallery(keys, o) {
    o = o || {};
    var h = keys.filter(has).map(function (k) { return figure(k, o); }).join('');
    return h ? '<div class="fig-gallery' + (o.cls ? ' ' + o.cls : '') + '">' + h + '</div>' : '';
  }
  function mount(root) {
    (root || document).querySelectorAll('[data-fig]').forEach(function (el) {
      if (el.getAttribute('data-fig-done')) return;
      var k = el.getAttribute('data-fig');
      el.innerHTML = figure(k, { labels: el.getAttribute('data-labels') === 'false' ? false : undefined });
      el.setAttribute('data-fig-done', '1');
    });
  }

  /* ── 크게 보기 ──────────────────────────────── */
  function zoom(src, o) {
    o = o || {};
    var s = svgOf(src, o); if (!s) return;
    var c = o.cap != null ? o.cap : (/^\s*</.test(src) ? '' : cap(src));
    close();
    var d = document.createElement('div');
    d.id = 'fig-zoom';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<button type="button" class="fig-x" aria-label="닫기">✕</button>' +
      '<div class="fig-zin">' + s + '</div>' + (c ? '<div class="fig-zcap">' + c + '</div>' : '') +
      '<div class="fig-zhint">아무 곳이나 누르면 닫힙니다</div>';
    d.addEventListener('click', close);
    document.body.appendChild(d);
    document.addEventListener('keydown', onKey);
    var b = d.querySelector('.fig-x'); if (b) b.focus();
  }
  function close() {
    var d = document.getElementById('fig-zoom');
    if (d) d.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('figure.fig');
    if (!f || f.closest('#bp') || f.closest('#fig-zoom') || f.hasAttribute('data-fig-nozoom')) return;
    e.stopPropagation();
    var k = f.getAttribute('data-fig-key'), svgEl = f.querySelector('svg');
    zoom(k || (svgEl ? svgEl.outerHTML : ''), {
      labels: f.getAttribute('data-fig-nolabel') ? false : undefined,
      cap: k ? undefined : ((f.querySelector('figcaption') || {}).innerHTML || '')
    });
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var f = e.target.closest && e.target.closest('figure.fig');
    if (f && !f.closest('#bp')) { e.preventDefault(); f.click(); }
  });

  /* ── 모양 ───────────────────────────────────── */
  var css = [
    'figure.fig{margin:0 auto;padding:0;max-width:560px;cursor:zoom-in;outline:none;border-radius:12px}',
    'figure.fig:focus-visible{box-shadow:0 0 0 3px rgba(37,99,235,.55)}',
    'figure.fig .fig-svg{display:block;width:100%;height:auto;border-radius:12px}',
    'figure.fig figcaption{margin-top:7px;font-size:13.5px;line-height:1.45;text-align:center;opacity:.88;word-break:keep-all}',
    '.fig-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px 14px;align-items:start}',
    /* 격자 칸 안에서 margin:auto 면 그림이 내용 크기로 쪼그라든다 — 칸을 꽉 채운다 */
    '.fig-gallery figure.fig{max-width:none;width:100%;margin:0}',
    '.fig-svg .fig-q{display:none}',
    '.fig-svg.fig-nolabel .fig-ans{display:none}',
    '.fig-svg.fig-nolabel .fig-q{display:inline}',
    '.fig-flow{stroke-dasharray:7 6;animation:figflow 1.1s linear infinite}',
    '@keyframes figflow{to{stroke-dashoffset:-13}}',
    '@media (prefers-reduced-motion:reduce){.fig-flow{animation:none}}',
    '#fig-zoom{position:fixed;inset:0;z-index:99600;background:rgba(9,13,20,.9);display:flex;flex-direction:column;',
    '  align-items:center;justify-content:center;padding:56px 14px 18px;gap:10px;cursor:zoom-out}',
    '#fig-zoom .fig-zin{width:min(96vw,1100px);max-height:calc(100vh - 150px);overflow:auto;-webkit-overflow-scrolling:touch}',
    '#fig-zoom .fig-zin svg{display:block;margin:0 auto;width:100%;height:auto;max-height:calc(100vh - 150px)}',
    /* 폰(세로)에서는 화면 폭이 곧 그림 폭이라 커지지 않는다 — 680px 로 키우고 옆으로 밀어 보게 한다 */
    '@media (max-width:700px){#fig-zoom .fig-zin svg{width:680px;max-width:none;max-height:none}',
    '  #fig-zoom .fig-zhint::before{content:"옆으로 밀어서 보세요 · "}}',
    '#fig-zoom .fig-zcap{color:#f3f6fb;font-size:clamp(14px,1.6vw,20px);text-align:center;max-width:900px;line-height:1.5;word-break:keep-all}',
    '#fig-zoom .fig-zhint{color:#9aa6b8;font-size:12px}',
    '#fig-zoom .fig-x{position:absolute;top:10px;right:12px;width:44px;height:44px;border-radius:50%;border:1px solid #3b4658;',
    '  background:#1b2330;color:#fff;font-size:20px;cursor:pointer}'
  ].join('\n');
  function addCss() {
    if (document.getElementById('fig-css')) return;
    var st = document.createElement('style');
    st.id = 'fig-css'; st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }
  addCss();

  window.FIG = {
    version: 1, C: C,
    svg: svg, t: t, line: line, path: path, poly: poly, box: box, circle: circle,
    arrow: arrow, route: route, dim: dim, callout: callout, hatch: hatch, num: num, g: g,
    has: has, cap: cap, svgOf: svgOf, figure: figure, gallery: gallery, mount: mount,
    zoom: zoom, close: close
  };
})();
