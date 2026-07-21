/* ══════════════════════════════════════════════════════════════
   fx.js — 학습도구 공용 연출 레이어
     FX.ok(el)          맞혔을 때: 파티클 + 펀치 + 소리 + 콤보
     FX.no(el)          틀렸을 때: 흔들림 + 붉은 플래시 + 소리 (콤보 끊김)
     FX.burst(el,opt)   파티클만
     FX.punch(el)       살짝 커졌다 돌아오기
     FX.shake(el)       흔들기
     FX.flash(color)    화면 전체 플래시
     FX.combo()         현재 콤보 수
     FX.score()         현재 점수
     FX.banner(o)       단계 클리어 배너 {title,sub,stars,btn,onClose}
     FX.countUp(el,to)  숫자 카운트업
     FX.hud(el)         점수·콤보 HUD를 el 안에 만든다
     FX.reset()         점수·콤보 초기화
     FX.sound(name)     'ok'|'no'|'combo'|'clear'|'up'
   소리는 교실을 생각해 기본 꺼짐. 오른쪽 아래 토글로 켠다.

   붙이는 법 — collector.js 와 똑같이 한 줄:
     <script src="https://hongyul67-cpu.github.io/links/fx.js"></script>

   ⚠️ 이 파일이 원본(canonical)이다. drone-master 저장소에도 같은 파일이 있으니
      고칠 때 두 곳 다 올릴 것.
   ══════════════════════════════════════════════════════════════ */
(function(){
"use strict";

var CSS = `
/* 파티클 */
.fx-p{position:fixed;pointer-events:none;z-index:9999;font-size:13px;line-height:1;
  will-change:transform,opacity;animation:fxp .72s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes fxp{
  0%  {transform:translate(-50%,-50%) scale(.35) rotate(0deg);opacity:1}
  70% {opacity:.95}
  100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.05) rotate(var(--rot));opacity:0}
}
/* 펀치 · 흔들림 */
.fx-punch{animation:fxpunch .4s cubic-bezier(.34,1.56,.64,1)}
@keyframes fxpunch{0%{transform:scale(1)}42%{transform:scale(1.12)}100%{transform:scale(1)}}
.fx-shake{animation:fxshake .44s}
@keyframes fxshake{0%,100%{transform:translateX(0)}18%{transform:translateX(-9px)}
  36%{transform:translateX(8px)}54%{transform:translateX(-5px)}72%{transform:translateX(3px)}}
/* 화면 플래시 */
.fx-flash{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:0}
.fx-flash.on{animation:fxflash .5s ease-out}
@keyframes fxflash{0%{opacity:.30}100%{opacity:0}}
/* 콤보 */
.fx-combo{position:fixed;left:50%;top:20%;z-index:9999;pointer-events:none;
  font-family:inherit;font-weight:900;font-size:32px;letter-spacing:-.5px;
  text-shadow:0 5px 22px rgba(0,0,0,.65);animation:fxcombo 1s ease-out forwards}
.fx-combo small{display:block;font-size:13px;font-weight:800;opacity:.85;margin-top:2px}
@keyframes fxcombo{
  0%  {opacity:0;transform:translate(-50%,0) scale(.5) rotate(-9deg)}
  22% {opacity:1;transform:translate(-50%,0) scale(1.22) rotate(4deg)}
  55% {opacity:1;transform:translate(-50%,0) scale(1) rotate(0deg)}
  100%{opacity:0;transform:translate(-50%,-30px) scale(1)}
}
/* HUD */
.fx-hud{display:flex;gap:8px;align-items:stretch}
.fx-hud .hbox{flex:1;background:#0d1a33;border:1px solid #243456;border-radius:12px;
  padding:8px 4px;text-align:center;transition:.2s}
.fx-hud .hbox b{display:block;font-size:19px;font-weight:900;color:#22d3ee;line-height:1.15}
.fx-hud .hbox span{font-size:10.5px;color:#9db0d6;font-weight:700}
.fx-hud .hbox.hot{border-color:#fbbf24;background:#3a2f10}
.fx-hud .hbox.hot b{color:#fbbf24}
/* 클리어 배너 */
.fx-banner{position:fixed;inset:0;z-index:9997;display:none;align-items:center;justify-content:center;
  background:rgba(4,10,22,.74);padding:20px}
.fx-banner.on{display:flex;animation:fxin .28s ease}
@keyframes fxin{from{opacity:0}to{opacity:1}}
.fx-banner .bx{background:linear-gradient(150deg,#13244d,#0c1730);border:1px solid #2f4a80;
  border-radius:22px;padding:26px 24px;max-width:380px;width:100%;text-align:center;
  box-shadow:0 24px 70px rgba(0,0,0,.6);animation:fxpop .45s cubic-bezier(.34,1.5,.64,1)}
@keyframes fxpop{0%{transform:scale(.7) translateY(24px);opacity:0}100%{transform:none;opacity:1}}
.fx-banner .bi{font-size:46px;line-height:1}
.fx-banner .bt{font-size:23px;font-weight:900;margin-top:8px;color:#eaf1ff}
.fx-banner .bs{font-size:13.5px;color:#9db0d6;margin-top:6px;line-height:1.5}
.fx-banner .bstars{font-size:34px;margin-top:12px;letter-spacing:5px}
.fx-banner .bstars i{display:inline-block;font-style:normal;opacity:.22;transform:scale(.7)}
.fx-banner .bstars i.on{opacity:1;color:#fbbf24;transform:scale(1);
  animation:fxstar .5s cubic-bezier(.34,1.6,.64,1) both}
.fx-banner .bstars i.on:nth-child(2){animation-delay:.16s}
.fx-banner .bstars i.on:nth-child(3){animation-delay:.32s}
@keyframes fxstar{0%{transform:scale(0) rotate(-40deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
.fx-banner .bbtn{margin-top:18px;width:100%;border:0;border-radius:13px;padding:13px;
  font-size:15px;font-weight:900;font-family:inherit;cursor:pointer;
  background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff}
.fx-banner .bbtn:active{transform:translateY(1px)}
/* 소리 토글 */
.fx-snd{position:fixed;right:12px;bottom:12px;z-index:9996;border:1px solid #243456;
  background:#111a2e;color:#9db0d6;border-radius:999px;padding:8px 13px;font-size:12.5px;
  font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4)}
.fx-snd.on{color:#34d399;border-color:#34d399}
.fx-snd:active{transform:translateY(1px)}

@media (prefers-reduced-motion: reduce){
  .fx-p{display:none}
  .fx-punch,.fx-shake,.fx-combo,.fx-banner .bx,.fx-banner .bstars i.on{animation:none}
  .fx-flash.on{animation:none}
}
`;

var injected=false;
function inject(){
  if(injected) return; injected=true;
  var s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s);
  var f=document.createElement("div"); f.className="fx-flash"; f.id="fxFlash"; document.body.appendChild(f);
  var b=document.createElement("div"); b.className="fx-banner"; b.id="fxBanner";
  b.innerHTML='<div class="bx"><div class="bi"></div><div class="bt"></div><div class="bs"></div>'
            + '<div class="bstars"><i>★</i><i>★</i><i>★</i></div><button class="bbtn"></button></div>';
  document.body.appendChild(b);
  var t=document.createElement("button"); t.className="fx-snd"; t.id="fxSnd";
  t.addEventListener("click",function(){ setSound(!SOUND) });
  document.body.appendChild(t);
  paintSndBtn();
}

/* ── 소리 (교실을 생각해 기본 꺼짐) ── */
var SOUND=false, actx=null;
try{ SOUND = localStorage.getItem("fx_sound")==="1" }catch(e){}
function setSound(v){
  SOUND=v; try{ localStorage.setItem("fx_sound", v?"1":"0") }catch(e){}
  paintSndBtn(); if(v) sound("ok");
}
function paintSndBtn(){
  var t=document.getElementById("fxSnd"); if(!t) return;
  t.textContent = SOUND ? "🔊 소리 켜짐" : "🔇 소리 꺼짐";
  t.classList.toggle("on",SOUND);
}
function tone(freq,start,dur,type,vol){
  try{
    if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)();
    var o=actx.createOscillator(), g=actx.createGain();
    o.type=type||"sine"; o.frequency.value=freq;
    var t0=actx.currentTime+start;
    g.gain.setValueAtTime(0,t0);
    g.gain.linearRampToValueAtTime(vol||0.13,t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t0); o.stop(t0+dur+0.02);
  }catch(e){}
}
function sound(name){
  if(!SOUND) return;
  if(name==="ok"){ tone(880,0,.11,"triangle"); tone(1320,.07,.13,"triangle"); }
  else if(name==="no"){ tone(180,0,.16,"sawtooth",.09); }
  else if(name==="combo"){ tone(1046,0,.09,"triangle"); tone(1318,.06,.09,"triangle"); tone(1568,.12,.16,"triangle"); }
  else if(name==="clear"){ [523,659,784,1046].forEach(function(f,i){ tone(f,i*.09,.22,"triangle",.12) }); }
  else if(name==="up"){ tone(660,0,.06,"square",.05); }
}

/* ── 파티클 ── */
var OK_CHARS=["✦","✧","★","+","●"];
function burst(el,opt){
  opt=opt||{};
  var n=opt.n||10, color=opt.color||"#34d399", chars=opt.chars||OK_CHARS;
  var r=(el&&el.getBoundingClientRect)?el.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0,height:0};
  var cx=r.left+r.width/2, cy=r.top+r.height/2;
  for(var i=0;i<n;i++){
    var s=document.createElement("span");
    s.className="fx-p"; s.textContent=chars[i%chars.length];
    var ang=(Math.PI*2)*(i/n)+(Math.random()-.5)*.5;
    var dist=(opt.dist||58)+Math.random()*34;
    s.style.left=cx+"px"; s.style.top=cy+"px"; s.style.color=color;
    s.style.setProperty("--dx",(Math.cos(ang)*dist).toFixed(1)+"px");
    s.style.setProperty("--dy",(Math.sin(ang)*dist).toFixed(1)+"px");
    s.style.setProperty("--rot",((Math.random()-.5)*220).toFixed(0)+"deg");
    s.style.fontSize=(11+Math.random()*9).toFixed(0)+"px";
    s.style.animationDelay=(Math.random()*.06).toFixed(3)+"s";
    document.body.appendChild(s);
    (function(node){ setTimeout(function(){ node.remove() },900) })(s);
  }
}
function punch(el){ if(!el) return; el.classList.remove("fx-punch"); void el.offsetWidth; el.classList.add("fx-punch");
  setTimeout(function(){ el.classList.remove("fx-punch") },450) }
function shake(el){ if(!el) return; el.classList.remove("fx-shake"); void el.offsetWidth; el.classList.add("fx-shake");
  setTimeout(function(){ el.classList.remove("fx-shake") },480) }
function flash(color){
  var f=document.getElementById("fxFlash"); if(!f) return;
  f.style.background=color||"rgba(251,113,133,.55)";
  f.classList.remove("on"); void f.offsetWidth; f.classList.add("on");
  setTimeout(function(){ f.classList.remove("on") },520);
}

/* ── 점수 · 콤보 ── */
var SCORE=0, COMBO=0, BEST=0, hudEl=null;
function paintHud(){
  if(!hudEl) return;
  var s=hudEl.querySelector(".hs"), c=hudEl.querySelector(".hc"), box=hudEl.querySelector(".hcbox");
  if(s) s.textContent=SCORE;
  if(c) c.textContent=COMBO>0?("x"+COMBO):"–";
  if(box) box.classList.toggle("hot",COMBO>=3);
}
function hud(el){
  inject();
  hudEl=el;
  el.classList.add("fx-hud");
  el.innerHTML='<div class="hbox"><b class="hs">0</b><span>점수</span></div>'
             + '<div class="hbox hcbox"><b class="hc">–</b><span>콤보</span></div>'
             + '<div class="hbox"><b class="hb">0</b><span>최고 콤보</span></div>';
  paintHud();
  return el;
}
function comboBadge(n){
  var d=document.createElement("div");
  d.className="fx-combo";
  d.style.color = n>=7 ? "#fb7185" : (n>=5 ? "#fbbf24" : "#22d3ee");
  d.innerHTML = "COMBO x"+n+"<small>"+(n>=7?"멈추지 마!":(n>=5?"좋아, 계속!":"연속 정답"))+"</small>";
  document.body.appendChild(d);
  setTimeout(function(){ d.remove() },1100);
}
function ok(el,opt){
  opt=opt||{};
  COMBO++; if(COMBO>BEST) BEST=COMBO;
  var gain=(opt.base||10)*(COMBO>=5?3:(COMBO>=3?2:1));
  SCORE+=gain;
  burst(el,{color:opt.color||"#34d399",n:opt.n||10});
  punch(el);
  if(hudEl){
    var b=hudEl.querySelector(".hb"); if(b) b.textContent=BEST;
    countUp(hudEl.querySelector(".hs"), SCORE, 420);
    paintHud();
  }
  if(COMBO>=3 && COMBO%3===0){ comboBadge(COMBO); sound("combo"); }
  else sound("ok");
  return gain;
}
function no(el){
  COMBO=0; paintHud();
  shake(el); flash("rgba(251,113,133,.5)"); sound("no");
}
function countUp(el,to,ms){
  if(!el) return;
  var from=parseInt(el.textContent,10)||0, t0=null, settled=false;
  if(from===to){ el.textContent=to; return }
  ms=ms||500;
  function done(){ if(settled) return; settled=true; el.textContent=to }
  function step(ts){
    if(settled) return;
    if(t0===null) t0=ts;
    var p=Math.min(1,(ts-t0)/ms);
    el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));
    if(p<1) requestAnimationFrame(step); else done();
  }
  requestAnimationFrame(step);
  // 탭이 백그라운드면 rAF가 멈춘다 — 값은 반드시 반영되도록 보정
  setTimeout(done, ms+120);
}

/* ── 클리어 배너 ── */
var starTimer=null;
function banner(o){
  inject();
  o=o||{};
  var b=document.getElementById("fxBanner");
  // 앞 배너가 남긴 별 타이머를 반드시 끈다.
  // (탭이 백그라운드면 setTimeout이 뭉쳐서 나중에 터지는데, 그러면 이전 배너의
  //  별 개수가 지금 배너에 덧칠돼 실수를 했는데도 별 3개가 뜬다.)
  if(starTimer){ clearTimeout(starTimer); starTimer=null; }
  b.querySelector(".bi").textContent=o.icon||"🎉";
  b.querySelector(".bt").textContent=o.title||"단계 완료!";
  b.querySelector(".bs").innerHTML=o.sub||"";
  var stars=b.querySelectorAll(".bstars i");
  var n=(o.stars==null?3:o.stars);
  Array.prototype.forEach.call(stars,function(s){ s.classList.remove("on") });
  b.querySelector(".bstars").style.display = o.stars===false ? "none" : "block";
  void b.offsetWidth;                       // 리플로우로 별 애니메이션을 처음부터 다시
  starTimer=setTimeout(function(){
    starTimer=null;
    Array.prototype.forEach.call(stars,function(s,i){ if(i<n) s.classList.add("on") });
  },60);
  var btn=b.querySelector(".bbtn");
  btn.textContent=o.btn||"계속하기 →";
  btn.onclick=function(){ b.classList.remove("on"); if(o.onClose) o.onClose() };
  b.classList.add("on");
  sound("clear");
}
function starsFor(miss){ return miss===0?3:(miss<=2?2:(miss<=5?1:0)) }

function reset(){ SCORE=0; COMBO=0; BEST=0; paintHud() }

window.FX={
  ok:ok, no:no, burst:burst, punch:punch, shake:shake, flash:flash,
  hud:hud, banner:banner, starsFor:starsFor, countUp:countUp, sound:sound,
  reset:reset, init:inject,
  combo:function(){return COMBO}, best:function(){return BEST}, score:function(){return SCORE}
};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",inject);
else inject();
})();
