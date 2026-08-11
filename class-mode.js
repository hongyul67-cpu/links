/*!
 * class-mode.js — 학습도구를 "수업용 화면"으로 바꿔 주는 공용 스크립트
 * 사용법:  <script src="https://hongyul67-cpu.github.io/links/class-mode.js"></script>
 *
 * 켜는 방법 3가지
 *   ① 우하단 🎓 버튼   ② 주소 뒤 ?class=1   ③ F9 키
 *
 * 수업모드에서 하는 일
 *   - 글씨·그림을 확 키우고 설명문·푸터·제출버튼 같은 군더더기를 숨김 (뒷자리에서도 보이게)
 *   - ← → · Space · PageUp/PageDown 으로 넘김 (프레젠터 리모컨 그대로 호환)
 *   - 진행이 2단계: [발문 보여주기] → (교사가 키) → [정답·해설 공개] → (키) → [다음]
 *   - 점수·연속·채점 문구를 숨겨 "다 같이 손들고 답하는" 분위기로
 *   - 타이머(T), 확대/축소(+/-), 탭 이동(1~9)
 *
 * 도구를 고치지 않아도 동작합니다(.wrap / .tab / .choice / .explain 구조를 자동 인식).
 * 필요하면 도구 쪽에서 window.CLASSMODE = { root:'.wrap', ... } 로 덮어쓸 수 있습니다.
 */
(function(){
"use strict";
if (window.__CLASS_MODE__) return;
window.__CLASS_MODE__ = true;

var CFG = window.CLASSMODE || {};
var $  = function(s,r){ return (r||document).querySelector(s); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

/* ---------- 요소 찾기 (도구마다 달라도 되도록 휴리스틱) ---------- */
function root(){
  return $(CFG.root || '.wrap') || document.querySelector('body > div') || document.body;
}
function visible(e){
  if(!e) return false;
  if(e.classList && e.classList.contains('hidden')) return false;
  var r = e.getBoundingClientRect();
  return !!(e.offsetParent !== null || r.width || r.height);
}
function live(e){ return visible(e) && !e.disabled; }        // 눌러도 되는 상태인가
function byText(re, sel, needLive){
  return $$(sel || 'button').filter(function(b){
    if(!(needLive ? live(b) : visible(b))) return false;
    return re.test((b.textContent||'').replace(/\s+/g,' ').trim());
  });
}
var FIND = {
  next   : function(){ return byText(/^(다음|계속|▶)|다음\s*(문제|단계|쪽)?\s*→|^→$|이제 테스트/, null, true)[0]; },
  prev   : function(){ return byText(/^(이전|◀)|←\s*이전|^←$/, null, true)[0]; },
  // 제출 버튼은 보기를 고르기 전 '비활성'인 경우가 많아 disabled 여도 찾아야 한다
  submit : function(){ return byText(/^제출$|^정답 확인$|^채점/)[0]; },   // "선생님께 결과 제출" 은 제외
  tabs   : function(){ return $$(CFG.tabs || '.tab').filter(visible); },
  choices: function(){ return $$(CFG.choices || '.choice').filter(visible); },
  explain: function(){ return $$(CFG.explain || '.explain').filter(function(e){
             return !e.classList.contains('hidden'); }); }
};

/* ---------- 스타일 ---------- */
var CSS = ''
+ '.cm-hide{display:none !important}'
+ 'body.cm-on{overflow-x:hidden}'
+ 'body.cm-on .cm-zoom{zoom:var(--cm-z,1.5)}'
+ '@supports not (zoom:1.5){body.cm-on .cm-zoom{transform:scale(var(--cm-z,1.5));transform-origin:top center}}'
+ 'body.cm-on{padding-bottom:96px !important}'
/* 군더더기 숨김 */
+ 'body.cm-on .eyebrow,body.cm-on .subtitle,body.cm-on footer,body.cm-on .guide,'
+ 'body.cm-on #rcBtn,body.cm-on .cm-chrome{display:none !important}'
/* 점수·채점 흔적 숨김 (손드는 퀴즈용) */
+ 'body.cm-quiet .scorebar,body.cm-quiet .toast,body.cm-quiet .pill{display:none !important}'
+ 'body.cm-quiet .choice.wrong{border-color:transparent !important;background:#f4efe0 !important}'
/* 보기 크게 */
+ 'body.cm-on .choice{min-height:64px}'
+ 'body.cm-on .choice .num{font-size:1.05rem !important}'
+ 'body.cm-on .choice .tx{font-size:1.06rem !important}'
/* 정답 공개 전에는 해설을 가림 */
+ 'body.cm-veil .explain{visibility:hidden !important}'
/* 툴바 */
+ '.cm-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;gap:8px;'
+   'align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 12px;'
+   'background:rgba(8,22,38,.96);border-top:1px solid rgba(234,244,255,.18);'
+   "font-family:'Pretendard','Malgun Gothic',sans-serif}"
+ '.cm-bar button{background:transparent;border:1px solid rgba(234,244,255,.3);color:#eaf4ff;'
+   'border-radius:9px;padding:10px 14px;font-size:.9rem;font-weight:800;cursor:pointer;'
+   'min-height:44px;font-family:inherit}'
+ '.cm-bar button:hover{border-color:#ffb454;color:#fff}'
+ '.cm-bar button.on{background:#ffb454;color:#1a1306;border-color:#ffb454}'
+ '.cm-bar .cm-go{background:#ffb454;color:#1a1306;border-color:#ffb454;min-width:180px}'
+ '.cm-bar .cm-sep{width:1px;height:26px;background:rgba(234,244,255,.2)}'
+ '.cm-bar .cm-t{color:#9fc1e0;font-size:.82rem;font-weight:700;letter-spacing:.03em}'
+ '.cm-bar .cm-clock{color:#ffb454;font-size:1.15rem;font-weight:800;min-width:62px;text-align:center;'
+   'font-family:ui-monospace,monospace}'
/* 켜기 버튼 */
+ '.cm-launch{position:fixed;right:14px;bottom:14px;z-index:2147482000;background:rgba(8,22,38,.9);'
+   'color:#ffb454;border:1px solid rgba(255,180,84,.55);border-radius:24px;padding:10px 15px;'
+   'font-size:.85rem;font-weight:800;cursor:pointer;min-height:44px;'
+   "font-family:'Pretendard','Malgun Gothic',sans-serif}"
+ '.cm-launch:hover{background:#ffb454;color:#1a1306}'
/* 안내 배너 */
+ '.cm-help{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483000;'
+   'background:rgba(8,22,38,.95);border:1px solid rgba(255,180,84,.5);border-radius:12px;'
+   'padding:12px 18px;color:#eaf4ff;font-size:.9rem;line-height:1.7;max-width:min(92vw,620px);'
+   "font-family:'Pretendard','Malgun Gothic',sans-serif}"
+ '.cm-help b{color:#ffb454}'
+ '.cm-help kbd{background:#1c4474;border-radius:5px;padding:1px 7px;font-family:ui-monospace,monospace;font-size:.85em}'
/* 정답 스포트라이트 */
+ '.cm-spot{outline:5px solid #5fd86f !important;outline-offset:3px;'
+   'box-shadow:0 0 0 9999px rgba(0,0,0,.28) !important;border-radius:12px;position:relative;z-index:5}'
+ '@media (prefers-reduced-motion:no-preference){.cm-spot{animation:cmPulse .9s ease-out 2}}'
+ '@keyframes cmPulse{0%{outline-color:#5fd86f}50%{outline-color:#a8f0b2}100%{outline-color:#5fd86f}}';

var styleEl = document.createElement('style');
styleEl.textContent = CSS;
document.head.appendChild(styleEl);

/* ---------- 상태 ---------- */
var on = false, quiet = true, zoom = 1.5, phase = 'ask';   // ask → reveal
var timerSec = 0, timerId = null, bar = null, launch = null, helpEl = null;

function chromeNodes(){
  // "🔗 같은 단원의 다른 도구" 같은 링크 패널을 자동으로 찾아 숨긴다
  return $$('.links').map(function(l){ return l.closest('.panel') || l; });
}

/* ---------- 켜기 / 끄기 ---------- */
function enter(){
  if(on) return; on = true;
  document.body.classList.add('cm-on');
  if(quiet) document.body.classList.add('cm-quiet');
  root().classList.add('cm-zoom');
  chromeNodes().forEach(function(n){ n.classList.add('cm-chrome'); });
  autoZoom();
  buildBar();
  if(launch) launch.style.display = 'none';
  showHelp();
  phase = 'ask'; applyVeil();
  fireResize();
}
function exit(){
  if(!on) return; on = false;
  document.body.classList.remove('cm-on','cm-quiet','cm-veil');
  root().classList.remove('cm-zoom');
  chromeNodes().forEach(function(n){ n.classList.remove('cm-chrome'); });
  clearSpot(); stopTimer();
  if(bar){ bar.remove(); bar = null; }
  if(helpEl){ helpEl.remove(); helpEl = null; }
  if(launch) launch.style.display = '';
  fireResize();
}
var _rt1 = null, _rt2 = null, synthetic = false, lastW = window.innerWidth;
function fireResize(){
  // 캔버스를 쓰는 도구들이 다시 그리도록.
  // 우리가 쏜 resize 가 다시 autoZoom 을 부르지 않도록 synthetic 플래그로 막는다(이벤트 폭주 방지).
  clearTimeout(_rt1); clearTimeout(_rt2);
  var ping = function(){
    synthetic = true;
    try { window.dispatchEvent(new Event('resize')); } finally { synthetic = false; }
  };
  _rt1 = setTimeout(ping, 30);
  _rt2 = setTimeout(ping, 260);
}
function autoZoom(){
  var w = window.innerWidth;
  setZoom(w >= 1600 ? 1.85 : w >= 1200 ? 1.6 : w >= 900 ? 1.35 : 1.12);
}
function setZoom(z){
  var v = Math.max(1, Math.min(2.6, Math.round(z*100)/100));
  var changed = (v !== zoom);
  zoom = v;
  document.body.style.setProperty('--cm-z', zoom);
  var lab = bar && bar.querySelector('.cm-zoomlab');
  if(lab) lab.textContent = Math.round(zoom*100) + '%';
  if(changed) fireResize();          // 값이 그대로면 다시 그릴 필요가 없다
}

/* ---------- 정답 가림 / 공개 ---------- */
function applyVeil(){
  document.body.classList.toggle('cm-veil', on && phase === 'ask' && FIND.choices().length > 0);
}
function clearSpot(){
  $$('.cm-spot').forEach(function(e){ e.classList.remove('cm-spot'); });
}
function reveal(){
  var chs = FIND.choices();
  var sub = FIND.submit();
  if(chs.length && sub){
    // 아무도 고르지 않았으면 임의로 하나 골라 채점을 돌린다(점수·문구는 숨겨져 있음)
    var picked = chs.some(function(c){ return c.classList.contains('sel'); });
    if(!picked) chs[0].click();
    sub.click();
  }
  phase = 'reveal';
  document.body.classList.remove('cm-veil');
  setTimeout(function(){
    clearSpot();
    var okEl = $$('.correct').filter(visible)[0] ||
               $$('[class*="correct"]').filter(visible)[0];
    if(okEl) okEl.classList.add('cm-spot');
    setGo();
  }, 60);
}
function advance(){
  var n = FIND.next();
  if(n){ n.click(); }
  else {
    // 다음 버튼이 없으면 탭을 하나 넘긴다(수업 순서대로 진행)
    var tabs = FIND.tabs();
    var i = tabs.findIndex(function(t){ return t.getAttribute('aria-pressed') === 'true'; });
    if(tabs.length && i > -1 && i < tabs.length-1) tabs[i+1].click();
  }
  phase = 'ask'; clearSpot();
  setTimeout(function(){ applyVeil(); setGo(); resetTimer(); }, 80);
}
function go(){          // 한 번 누르면 공개, 다시 누르면 다음
  if(!on) return;
  if(phase === 'ask' && FIND.choices().length && FIND.submit()) reveal();
  else advance();
}
function back(){
  var p = FIND.prev();
  if(p){ p.click(); }
  else {
    var tabs = FIND.tabs();
    var i = tabs.findIndex(function(t){ return t.getAttribute('aria-pressed') === 'true'; });
    if(tabs.length && i > 0) tabs[i-1].click();
  }
  phase = 'ask'; clearSpot();
  setTimeout(function(){ applyVeil(); setGo(); }, 80);
}
function setGo(){
  var b = bar && bar.querySelector('.cm-go');
  if(!b) return;
  var hasQ = FIND.choices().length && FIND.submit();
  b.textContent = (phase === 'ask' && hasQ) ? '정답 공개  ▶' : '다음  ▶';
}

/* ---------- 타이머 ---------- */
function tickLabel(){
  var el = bar && bar.querySelector('.cm-clock');
  if(el) el.textContent = String(Math.floor(timerSec/60)) + ':' + ('0' + (timerSec%60)).slice(-2);
}
function startTimer(){
  stopTimer();
  timerId = setInterval(function(){
    if(timerSec <= 0){ stopTimer(); return; }
    timerSec--; tickLabel();
    if(timerSec === 0){
      var el = bar && bar.querySelector('.cm-clock');
      if(el){ el.style.color = '#ff6b6b'; el.textContent = '0:00'; }
    }
  }, 1000);
  var t = bar && bar.querySelector('.cm-timer'); if(t) t.classList.add('on');
}
function stopTimer(){
  if(timerId){ clearInterval(timerId); timerId = null; }
  var t = bar && bar.querySelector('.cm-timer'); if(t) t.classList.remove('on');
}
function resetTimer(){
  if(!timerId) return;
  timerSec = 30; tickLabel();
  var el = bar && bar.querySelector('.cm-clock'); if(el) el.style.color = '';
}
function toggleTimer(){
  if(timerId){ stopTimer(); }
  else { timerSec = timerSec || 30; tickLabel(); startTimer(); }
}

/* ---------- 툴바 ---------- */
function mk(tag, cls, txt){
  var e = document.createElement(tag);
  if(cls) e.className = cls;
  if(txt != null) e.textContent = txt;
  return e;
}
function buildBar(){
  if(bar) bar.remove();
  bar = mk('div','cm-bar');
  var prev = mk('button', null, '◀ 이전');            prev.onclick = back;
  var goB  = mk('button','cm-go','정답 공개  ▶');      goB.onclick  = go;
  var zin  = mk('button', null, '＋');                 zin.onclick  = function(){ setZoom(zoom + 0.15); };
  var zlab = mk('span','cm-t cm-zoomlab', Math.round(zoom*100) + '%');
  var zout = mk('button', null, '－');                 zout.onclick = function(){ setZoom(zoom - 0.15); };
  var qt   = mk('button','cm-quietbtn', quiet ? '🙈 점수 숨김' : '👀 점수 표시');
  qt.classList.toggle('on', quiet);
  qt.onclick = function(){
    quiet = !quiet;
    document.body.classList.toggle('cm-quiet', quiet);
    qt.textContent = quiet ? '🙈 점수 숨김' : '👀 점수 표시';
    qt.classList.toggle('on', quiet);
  };
  var tm   = mk('button','cm-timer','⏱ 30초');        tm.onclick = toggleTimer;
  var clk  = mk('span','cm-clock','0:30');
  var help = mk('button', null, '⌨ 단축키');           help.onclick = showHelp;
  var out  = mk('button', null, '✕ 수업모드 끄기');     out.onclick = exit;

  [prev, goB, mk('span','cm-sep'), zout, zlab, zin, mk('span','cm-sep'),
   qt, tm, clk, mk('span','cm-sep'), help, out].forEach(function(e){ bar.appendChild(e); });
  document.body.appendChild(bar);
  setGo();
}
function showHelp(){
  if(helpEl) helpEl.remove();
  helpEl = mk('div','cm-help');
  helpEl.innerHTML =
    '🎓 <b>수업모드</b> — <kbd>→</kbd> <kbd>Space</kbd> <kbd>PageDown</kbd> 진행 · '
  + '<kbd>←</kbd> <kbd>PageUp</kbd> 뒤로 · <kbd>+</kbd><kbd>-</kbd> 크기 · '
  + '<kbd>T</kbd> 타이머 · <kbd>1</kbd>~<kbd>9</kbd> 탭 · <kbd>F9</kbd>/<kbd>Esc</kbd> 끄기<br>'
  + '문제 화면에서는 <b>한 번 누르면 정답 공개, 다시 누르면 다음 문제</b>입니다. '
  + '(프레젠터 리모컨 그대로 됩니다)';
  document.body.appendChild(helpEl);
  setTimeout(function(){ if(helpEl){ helpEl.remove(); helpEl = null; } }, 7000);
}

/* ---------- 키보드 ---------- */
document.addEventListener('keydown', function(e){
  if(e.key === 'F9'){ e.preventDefault(); on ? exit() : enter(); return; }
  if(!on) return;
  var t = e.target;
  if(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;   // 입력 중에는 개입하지 않음
  switch(e.key){
    case 'ArrowRight': case ' ': case 'Spacebar': case 'PageDown': case 'ArrowDown':
      e.preventDefault(); go(); break;
    case 'ArrowLeft': case 'PageUp': case 'ArrowUp':
      e.preventDefault(); back(); break;
    case 'Escape': e.preventDefault(); exit(); break;
    case '+': case '=': e.preventDefault(); setZoom(zoom + 0.15); break;
    case '-': case '_': e.preventDefault(); setZoom(zoom - 0.15); break;
    case 't': case 'T': case 'ㅅ': e.preventDefault(); toggleTimer(); break;
    default:
      if(/^[1-9]$/.test(e.key)){
        var tabs = FIND.tabs(), i = parseInt(e.key,10) - 1;
        if(tabs[i]){ e.preventDefault(); tabs[i].click();
          phase='ask'; clearSpot(); setTimeout(function(){ applyVeil(); setGo(); }, 80); }
      }
  }
});
window.addEventListener('resize', function(){
  if(!on || synthetic) return;                 // 우리가 쏜 resize 는 무시
  if(window.innerWidth === lastW) return;      // 실제 창 크기가 바뀐 경우에만
  lastW = window.innerWidth; autoZoom();
});

/* 도구 자체의 버튼(탭·다음 등)을 직접 눌렀을 때도 상태를 다시 맞춘다 */
document.addEventListener('click', function(e){
  if(!on || !bar) return;
  if(e.target.closest && e.target.closest('.cm-bar,.cm-launch')) return;
  setTimeout(function(){
    if(!on) return;
    if(!document.querySelector('.correct')) { phase = 'ask'; clearSpot(); }
    applyVeil(); setGo();
  }, 90);
}, true);

/* ---------- 켜기 버튼 ---------- */
function addLaunch(){
  launch = mk('button','cm-launch','🎓 수업모드');
  launch.title = '수업용 큰 화면으로 전환 (F9)';
  launch.onclick = enter;
  document.body.appendChild(launch);
}

/* ---------- 시작 ---------- */
function boot(){
  addLaunch();
  var q = new URLSearchParams(location.search);
  if(q.get('class') === '1' || q.get('class') === 'on') enter();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

window.ClassMode = { enter: enter, exit: exit, go: go, back: back, setZoom: setZoom,
                     isOn: function(){ return on; } };
})();
