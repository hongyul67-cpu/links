/* ══════════════════════════════════════════════════════════════
   rank.js — 학습도구 공용 계급(티어) · 랭크 포인트 위젯
   붙이는 법:  <script src="https://hongyul67-cpu.github.io/links/rank.js"
                       data-tool="도구이름"></script>
   쓰는 법:
     Rank.card()                  → 홈에 넣을 계급 카드 HTML
     Rank.badge()                 → 작은 배지 HTML (상단바 등)
     Rank.award(점수0~100, {mode:'게임이름'}) → RP 정산. 결과 객체 반환
     Rank.resultBox(결과)         → 결과화면용 RP 연출 HTML
     Rank.history()               → 최근 기록 배열
     Rank.reset()                 → 초기화
   저장은 localStorage(도구별로 분리). 서버 없이 동작합니다.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TOOL = (document.currentScript && document.currentScript.dataset.tool) || document.title || 'tool';
  var KEY = 'rank_v1_' + TOOL;

  /* ── 티어 정의 ─────────────────────────────────────────────
     min = 이 티어가 시작되는 RP. div = 세부 계급 수(로마숫자). */
  var TIERS = [
    { key:'iron',     name:'아이언',     icon:'🪨', c:'#8d949e', c2:'#5c626b', min:0,    div:3 },
    { key:'bronze',   name:'브론즈',     icon:'🥉', c:'#c98b5e', c2:'#8a5a35', min:200,  div:3 },
    { key:'silver',   name:'실버',       icon:'🥈', c:'#c3ced9', c2:'#8c98a4', min:500,  div:3 },
    { key:'gold',     name:'골드',       icon:'🥇', c:'#ffd166', c2:'#c79a2c', min:900,  div:4 },
    { key:'plat',     name:'플래티넘',   icon:'💠', c:'#57e0c8', c2:'#22a08c', min:1400, div:4 },
    { key:'dia',      name:'다이아몬드', icon:'💎', c:'#7cc6ff', c2:'#3b7fd6', min:2000, div:4 },
    { key:'master',   name:'마스터',     icon:'👑', c:'#c79bff', c2:'#8b5cf6', min:2700, div:1 }
  ];
  var ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
  var MAXRP = 3200;

  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    return {
      rp: d.rp || 0, streak: d.streak || 0, bestStreak: d.bestStreak || 0,
      plays: d.plays || 0, bestRp: d.bestRp || 0, log: d.log || []
    };
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  /* rp → 티어 정보 */
  function tierOf(rp) {
    rp = Math.max(0, Math.min(MAXRP, rp));
    var i = 0;
    for (var k = 0; k < TIERS.length; k++) if (rp >= TIERS[k].min) i = k;
    var t = TIERS[i];
    var next = TIERS[i + 1];
    var span = (next ? next.min : MAXRP) - t.min;
    var into = rp - t.min;
    var step = span / t.div;
    var d = t.div > 1 ? Math.min(t.div, Math.floor(into / step) + 1) : 0;   // 1..div (낮을수록 아래)
    // 표기는 Ⅳ(낮음) → Ⅰ(높음) 순서가 익숙하므로 뒤집는다
    var label = t.div > 1 ? ROMAN[t.div - d + 1] : '';
    var subMin = t.min + (d - 1) * step, subMax = t.min + d * step;
    if (t.div === 1) { subMin = t.min; subMax = MAXRP; }
    return {
      key: t.key, name: t.name, icon: t.icon, c: t.c, c2: t.c2,
      div: label, full: t.name + (label ? ' ' + label : ''),
      idx: i, sub: d, subMin: Math.round(subMin), subMax: Math.round(subMax),
      pct: Math.max(0, Math.min(100, Math.round((rp - subMin) / (subMax - subMin) * 100))),
      nextName: next ? next.name : null, nextAt: next ? next.min : null
    };
  }

  /* 점수(0~100) → RP 증감 */
  function calcGain(score, st) {
    var g = Math.round((score - 55) * 0.8);          // 55점이 본전
    if (score >= 100) g += 12;                        // 퍼펙트 보너스
    if (score >= 60) {
      var s = st.streak + 1;
      if (s >= 3) g += Math.min(15, (s - 2) * 5);     // 3연승부터 보너스
    } else {
      g = Math.max(g, -22);                           // 하락 상한
      var t = tierOf(st.rp);
      if (t.idx === 0) g = Math.max(g, -6);           // 아이언 보호
      else if (t.idx === 1) g = Math.max(g, -12);
    }
    return g;
  }

  var Rank = {
    tool: TOOL,
    tiers: TIERS,
    get: function () {
      var d = load(); var t = tierOf(d.rp);
      return { rp: d.rp, tier: t, streak: d.streak, bestStreak: d.bestStreak, plays: d.plays, bestRp: d.bestRp };
    },
    history: function () { return load().log; },
    reset: function () { save({ rp: 0, streak: 0, bestStreak: 0, plays: 0, bestRp: 0, log: [] }); },

    /* 점수 정산. score = 0~100 */
    award: function (score, meta) {
      meta = meta || {};
      var d = load();
      var before = d.rp, tBefore = tierOf(before);
      var gain = calcGain(score, d);
      d.rp = Math.max(0, Math.min(MAXRP, d.rp + gain));
      d.streak = score >= 60 ? d.streak + 1 : 0;
      if (d.streak > d.bestStreak) d.bestStreak = d.streak;
      d.plays += 1;
      if (d.rp > d.bestRp) d.bestRp = d.rp;
      d.log.unshift({ s: score, g: gain, m: meta.mode || '', t: Date.now() });
      d.log = d.log.slice(0, 30);
      save(d);
      var tAfter = tierOf(d.rp);
      return {
        gain: gain, before: before, after: d.rp,
        tierBefore: tBefore, tierAfter: tAfter,
        promoted: tAfter.idx > tBefore.idx || (tAfter.idx === tBefore.idx && tAfter.sub > tBefore.sub),
        demoted: tAfter.idx < tBefore.idx || (tAfter.idx === tBefore.idx && tAfter.sub < tBefore.sub),
        tierUp: tAfter.idx > tBefore.idx,
        streak: d.streak, score: score
      };
    },

    /* ── 렌더 조각 ── */
    badge: function (rk) {
      var r = rk || this.get(), t = r.tier;
      return '<span class="rk-badge" style="--rc:' + t.c + ';--rc2:' + t.c2 + '">' +
        '<i>' + t.icon + '</i><b>' + t.full + '</b><u>' + r.rp + ' RP</u></span>';
    },
    bar: function (rk) {
      var r = rk || this.get(), t = r.tier;
      return '<div class="rk-bar" style="--rc:' + t.c + ';--rc2:' + t.c2 + '">' +
        '<i style="width:' + t.pct + '%"></i></div>' +
        '<div class="rk-sub">' + (t.nextName
          ? (t.subMax - r.rp) + ' RP 더 모으면 <b>' + (t.sub < 99 ? nextLabel(t) : t.nextName) + '</b>'
          : '최고 계급입니다') + '</div>';
    },
    card: function (rk) {
      var r = rk || this.get(), t = r.tier;
      return '<div class="rk-card" style="--rc:' + t.c + ';--rc2:' + t.c2 + '">' +
        '<div class="rk-top"><div class="rk-em">' + t.icon + '</div>' +
          '<div class="rk-nm"><b>' + t.full + '</b><span>' + r.rp + ' RP' +
            (r.streak >= 2 ? ' · 🔥 ' + r.streak + '연승' : '') + '</span></div>' +
          '<div class="rk-mini">' + (r.plays ? r.plays + '판' : '첫 판') + '</div></div>' +
        this.bar(r) +
        '<div class="rk-ladder">' + TIERS.map(function (x, i) {
          return '<span class="' + (i === t.idx ? 'on' : (i < t.idx ? 'past' : '')) + '" title="' + x.name + '">' + x.icon + '</span>';
        }).join('') + '</div></div>';
    },
    /* 결과 화면용 — award() 결과를 넣으면 RP 변화를 보여준다 */
    resultBox: function (res) {
      var up = res.gain >= 0;
      var t = res.tierAfter;
      var head = res.tierUp ? '<div class="rk-promo">🎉 <b>' + t.name + '</b> 승급!</div>'
               : res.promoted ? '<div class="rk-promo">⬆ <b>' + t.full + '</b> 승급!</div>'
               : res.demoted ? '<div class="rk-demo">⬇ ' + t.full + '로 내려갔습니다</div>' : '';
      return '<div class="rk-res" style="--rc:' + t.c + ';--rc2:' + t.c2 + '">' + head +
        '<div class="rk-gain ' + (up ? 'up' : 'dn') + '">' + (up ? '+' : '') + res.gain + ' RP</div>' +
        '<div class="rk-line">' + res.before + ' → <b>' + res.after + ' RP</b>' +
          (res.streak >= 2 ? ' · 🔥 ' + res.streak + '연승' : '') + '</div>' +
        this.card(this.get()) + '</div>';
    }
  };
  function nextLabel(t) {
    if (t.sub >= t.div) return t.nextName;             // 이 티어 최상위 → 다음 티어
    var next = ROMAN[t.div - (t.sub + 1) + 1];
    return t.name + (next ? ' ' + next : '');
  }

  /* ── 스타일 ── */
  var css = document.createElement('style');
  css.textContent = [
    '.rk-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;',
    ' background:linear-gradient(180deg,color-mix(in srgb,var(--rc) 22%,transparent),transparent);',
    ' border:1px solid color-mix(in srgb,var(--rc) 55%,transparent);font-size:12.5px;white-space:nowrap}',
    '.rk-badge i{font-style:normal;font-size:14px}',
    '.rk-badge b{color:var(--rc);font-weight:800}',
    '.rk-badge u{text-decoration:none;opacity:.72;font-size:11.5px}',
    '.rk-card{border:1px solid color-mix(in srgb,var(--rc) 40%,transparent);border-radius:14px;padding:12px 13px;',
    ' background:linear-gradient(160deg,color-mix(in srgb,var(--rc) 13%,transparent),transparent 62%)}',
    '.rk-top{display:flex;align-items:center;gap:11px}',
    '.rk-em{width:44px;height:44px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;',
    ' font-size:24px;background:linear-gradient(160deg,var(--rc),var(--rc2));',
    ' box-shadow:0 4px 16px color-mix(in srgb,var(--rc) 40%,transparent)}',
    '.rk-nm{flex:1;line-height:1.35;min-width:0}',
    '.rk-nm b{display:block;font-size:16.5px;font-weight:900;color:var(--rc);letter-spacing:-.3px}',
    '.rk-nm span{font-size:12px;opacity:.72}',
    '.rk-mini{font-size:11.5px;opacity:.55;white-space:nowrap}',
    '.rk-bar{height:8px;border-radius:99px;overflow:hidden;margin:11px 0 5px;',
    ' background:color-mix(in srgb,var(--rc) 16%,transparent);border:1px solid color-mix(in srgb,var(--rc) 30%,transparent)}',
    '.rk-bar>i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--rc2),var(--rc));transition:width .7s cubic-bezier(.3,1,.4,1)}',
    '.rk-sub{font-size:11.5px;opacity:.65}.rk-sub b{color:var(--rc)}',
    '.rk-ladder{display:flex;gap:4px;justify-content:space-between;margin-top:9px}',
    '.rk-ladder span{font-size:15px;opacity:.22;filter:grayscale(1);transition:.2s}',
    '.rk-ladder span.past{opacity:.5;filter:grayscale(.4)}',
    '.rk-ladder span.on{opacity:1;filter:none;transform:scale(1.28)}',
    '.rk-res{text-align:center}',
    '.rk-gain{font-size:30px;font-weight:900;letter-spacing:-1px;margin:2px 0}',
    '.rk-gain.up{color:#3ad995}.rk-gain.dn{color:#ff5f6d}',
    '.rk-line{font-size:13px;opacity:.75;margin-bottom:11px}',
    '.rk-promo{font-size:15px;font-weight:900;color:var(--rc);margin-bottom:4px}',
    '.rk-demo{font-size:13.5px;font-weight:800;color:#ff9aa2;margin-bottom:4px}',
    '@media (max-width:560px){.rk-nm b{font-size:15px}.rk-em{width:40px;height:40px;font-size:21px}}'
  ].join('');
  document.head.appendChild(css);

  window.Rank = Rank;
})();
