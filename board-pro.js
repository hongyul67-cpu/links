/* ══════════════════════════════════════════════════════════════
   board-pro.js — 수업 슬라이드 뷰어 (공용 · 표준 v2)

   ▸ 여기가 원본이다. 저장소로 복사하지 않는다.
     예전에는 저장소마다 사본을 뒀다가 board.js 가 7가지로 갈라졌다.
     이제 도구는 이 주소를 부르기만 한다. 고칠 일이 생기면 여기 하나만 고친다.

       <script src="lesson.js"></script>                                        ← 원고(저장소 것)
       <script src="https://hongyul67-cpu.github.io/links/board-pro.js"></script>  ← 화면(이 파일)
       BoardPro.open({ title:'…', sub:'…', menu:[ … ] });

     **도구 쪽에서 이 파일을 고치지 마세요.** 고쳐야 하면 links 저장소에서 고칩니다.

   ▸ 무엇이 붙어 있나
     펜 · 형광펜 · 지우개 · 선택(판서 끄기) · 색 4종 · 되돌리기 · 판서 지우기 ·
     크게 보기 · 타이머 · 번호 뽑기 · 가리개 · 전체화면 · 나가기.

   ▸ 크게 보기(🔍 · Z 키 · 그림 누르기)
     한 화면에 담느라 줄어든 글자와 그림을 **줄이기 전 크기로 따로 띄운다.**
     슬라이드는 건드리지 않는다 — 덮개만 올라왔다 내려간다.
     안에서 ➕ ➖ 로 85%~350% 까지 더 키울 수 있고, 넘치면 밀어서 본다.
     (수업 뒷자리에서 "글자가 안 보인다"는 말이 여기서 나왔다. 2026-09-21)

   ▸ menu 한 칸의 형식
     { icon:'📊', title:'개념 슬라이드', desc:'설명',
       run:{ kind:'lesson', deck:[슬라이드…] } }        ← 요점→발문→퀴즈→정답
     { …, run:{ kind:'quiz', deck:[{q,o,a,e,img,src}…] } }  ← 문제 한 개씩 크게
     { …, run:{ kind:'blank' } }                        ← 빈 칠판(판서만)

   ▸ 슬라이드 한 장(lesson)
     { u:'단원명', t:'제목', svg:'<svg…>', img:'그림.png', fig:'키', cap:'그림설명',
       pts:['요점','{{빈칸}} 이 있는 요점'], ask:'발문',
       ansq:'퀴즈', anso:['보기'…], ansa:정답번호(0부터), anse:'해설' }
     그림을 직접 만들어야 하면 opts.fig(slide) 로 HTML 을 돌려주면 된다.

   ▸ 퀴즈 보기는 화면에서 섞는다 (2026-09-21)
     원고는 정답이 ②에 몰려 있었다(1,463문항 중 48%). 교실에서 금방 들킨다.
     원고는 그대로 두고 **보여 줄 때만** 섞는다. 같은 문항은 언제 열어도 같은 순서다(내용으로 정한 순서).
     해설·보기가 번호를 말하면(①·2번·위의 것 모두 …) 섞으면 틀리므로 원래 순서대로 둔다.
     특정 장을 섞지 않으려면 슬라이드에 keep:true.

   ▸ 요점 속 {{답}} 은 빈칸이다
     처음에는 글자가 가려져 있고, 그 자리를 눌러야 답이 드러난다.
     빈칸을 눌러도 슬라이드는 넘어가지 않는다.

   ▸ 넘기기는 [◀] [다음] [▶] 단추와 ← → 키만 쓴다.
     화면 아무 데나 눌러서 넘어가는 동작은 넣지 않는다 — 수업 중에 잘못 눌린다.
     (판서 중에는 화면 전체가 그리는 면이라 더더욱 그렇다.)

   ▸ 도구는 넷 중 하나만 켜진다 — 펜 · 형광펜 · 지우개 · 선택
     라디오처럼 고른다. 「선택」이 판서 끄기이고, 열었을 때의 처음 상태다.
     (v1 은 켜져 있는 펜을 한 번 더 눌러야 꺼지는 토글이었는데, 그 규칙을 아무도 몰랐다.)

   ▸ 판서 캔버스(#bp-pad)는 반드시 #bp 안, 도구바 바로 앞에 둔다 — 건드리지 말 것
     v1 은 이것을 document.body 에 붙였다. 그러면 캔버스(z 99040)가 #bp(z 99000)보다
     위에 깔려 **도구바를 통째로 덮는다.** 도구바에 z-index:99060 이 있어도 소용없다 —
     그 값은 #bp 안에서만 쓰이기 때문이다. 그래서 펜을 켜면 형광펜·지우개를 눌러도
     클릭을 캔버스가 먹어 아무것도 안 바뀌었다. 같은 상자 안에 두면 99060 > 99040 이 된다.

   ▸ [다음]은 그 슬라이드가 실제로 가진 단계만 연다
     요점 → (발문) → (퀴즈) → (정답·해설). 발문이나 퀴즈가 없는 원고에서는
     그 단계를 건너뛴다. 예전에는 무조건 3단계여서 눌러도 아무것도 안 열리는
     헛클릭이 생겼다(퀴즈 없이 설명만 넣는 도구에서 특히).

   ▸ 그림 높이는 뷰어가 막는다 (.bp-fig svg{max-height:38vh})
     도구 쪽에 따로 max-height 를 넣지 않아도 된다. 더 좁혀야 하면
     도구에서 `#bp .bp-fig svg{...}` 로 덮어쓰면 그쪽이 이긴다.

   ▸ 버튼 겹침
     도구바는 **한 줄**이다. 폭이 모자라면 #bp-tools 의 뒤쪽 버튼부터 「⋯」 안으로 들어간다.
     왼쪽 #bp-nav([✕ 나가기][◀][다음][▶])는 접히지 않는다 — 폭 390 에서도 나갈 길이 남는다.
     본체 페이지의 떠 있는 위젯(뒤로·기록초기화·계급배지·평가 기준)은 열려 있는 동안 가려 둔다.
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var CSS = [
    '#bp{position:fixed;inset:0;z-index:99000;display:flex;flex-direction:column;',
    '  background:#0b0f16;color:#eef3fb;font-family:"Malgun Gothic","맑은 고딕",system-ui,sans-serif;',
    '  line-height:1.5;-webkit-tap-highlight-color:transparent}',
    '#bp[hidden]{display:none!important}',
    '#bp *{box-sizing:border-box}',
    '#bp button{font-family:inherit;cursor:pointer;border:none;color:inherit}',

    /* ── 머리 ── */
    '#bp-head{display:flex;align-items:center;gap:14px;padding:9px 18px;border-bottom:1px solid #2f3b4f;',
    '  background:#0d131d;flex-shrink:0}',
    '#bp-u{font-size:clamp(11px,1vw,16px);color:#7cc6ff;font-weight:800}',
    '#bp-t{font-size:clamp(17px,2.1vw,34px);font-weight:900;letter-spacing:-.5px;line-height:1.2}',
    '#bp-i{font-size:clamp(12px,1.1vw,20px);color:#93a2ba;font-weight:800;white-space:nowrap}',

    /* ── 본문 ── */
    '#bp-body{flex:1;position:relative;overflow-y:auto;overflow-x:hidden;',
    '  padding:min(2vh,18px) min(2.4vw,30px) min(2vh,18px)}',
    '#bp-in{min-height:100%;display:flex;flex-direction:column;gap:min(1.6vh,15px)}',
    '.bp-fig{background:#0f1a27;border:1px solid #2f3b4f;border-radius:15px;padding:10px 13px;',
    '  display:flex;align-items:center;justify-content:center;min-height:0;flex:1 1 auto;overflow:auto}',
    /* 그림 높이 — vh 로 못 박는다.
       max-height:100% 는 듣지 않는다: 부모(.bp-fig)가 flex 로 늘었다 줄었다 해서
       백분율의 기준이 잡히지 않기 때문이다. 그래서 세로로 긴 SVG 가 700px 까지
       자라 슬라이드를 넘겼고, 도구마다 26~38vh 짜리 땜빵 CSS 를 따로 넣고 있었다.
       (도구 쪽에 더 좁은 값이 있으면 #bp 가 붙어 더 셈이 강하므로 그대로 이긴다.) */
    '.bp-fig svg{max-height:38vh;width:100%;height:auto}',
    '.bp-fig img{max-width:100%;max-height:38vh;object-fit:contain}',
    /* 그림을 <div> 로 한 겹 감싸 넘기는 도구가 많다. 그 div 는 flex 항목이라
       가만두면 쭈그러들고, 안의 SVG 가 기본폭 300px 로 나온다(교실 화면에서 손톱만 하다). */
    '.bp-fig > div{width:100%;min-width:0}',
    '.bp-cap{text-align:center;color:#93a2ba;font-size:clamp(12px,1.1vw,19px);flex-shrink:0}',
    '.bp-pts{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:min(1vh,10px);flex-shrink:0}',
    '.bp-pts li{font-size:clamp(14px,1.4vw,27px);line-height:1.5;background:#161d29;border:1px solid #2f3b4f;',
    '  border-left:5px solid #7cc6ff;border-radius:12px;padding:min(1.2vh,12px) 16px}',
    '.bp-pts b{color:#7cc6ff}',
    '.bp-ask{background:#1b1509;border:1px solid #574316;border-left:5px solid #ffd166;border-radius:14px;',
    '  padding:min(1.5vh,16px) 19px;font-size:clamp(16px,1.6vw,31px);line-height:1.45;color:#f8ecc6;',
    '  font-weight:800;flex-shrink:0}',
    '.bp-q{font-size:clamp(17px,1.7vw,33px);font-weight:800;line-height:1.45;flex-shrink:0}',
    '.bp-opts{display:grid;grid-template-columns:1fr 1fr;gap:min(1.3vh,12px);flex-shrink:0}',
    '.bp-opt{text-align:left;background:#1f2836;border:2px solid #2f3b4f;border-radius:14px;',
    '  padding:min(1.6vh,16px) 17px;font-size:clamp(14px,1.35vw,27px);line-height:1.4;min-height:56px;',
    '  display:flex;align-items:center;gap:11px}',
    '.bp-opt .n{width:1.9em;height:1.9em;flex-shrink:0;border-radius:50%;background:#0f1826;border:1px solid #2f3b4f;',
    '  display:flex;align-items:center;justify-content:center;font-weight:900;color:#93a2ba;font-size:.9em}',
    '.bp-opt.ok{background:rgba(55,214,143,.2);border-color:#37d68f;box-shadow:0 0 0 4px rgba(55,214,143,.18)}',
    '.bp-opt.ok .n{background:#37d68f;color:#04240f;border-color:#37d68f}',
    '.bp-opt.dim{opacity:.38}',
    '.bp-exp{background:#0f1a27;border:1px solid #2f3b4f;border-left:5px solid #7cc6ff;border-radius:12px;',
    '  padding:min(1.4vh,14px) 18px;font-size:clamp(13px,1.2vw,24px);line-height:1.6;color:#cfe0f3;',
    '  flex-shrink:0;overflow-y:auto;max-height:26vh}',
    '.bp-exp b{color:#7cc6ff}',
    '.bp-veil{display:none!important}',
    /* 발문·퀴즈까지 열리면 아래가 길어진다 → 그림과 요점을 줄여 한 화면에 담는다
       (수업 중 스크롤은 흐름을 끊으므로 넘치지 않는 것이 중요하다) */
    '#bp-in.compact .bp-fig{flex:0 1 auto;max-height:34vh}',
    '#bp-in.compact .bp-fig svg{max-height:32vh}',
    '#bp-in.compact .bp-fig img{max-height:32vh}',
    '#bp-in.compact .bp-cap{display:none}',
    '#bp-in.compact .bp-pts li{font-size:clamp(12px,.98vw,18px);padding:min(.65vh,7px) 13px;line-height:1.42}',
    '#bp-in.compact .bp-ask{font-size:clamp(13px,1.25vw,24px);padding:min(1vh,11px) 15px}',
    '#bp-in.compact .bp-q{font-size:clamp(14px,1.4vw,27px)}',
    '#bp-in.compact .bp-opt{min-height:48px;padding:min(1.1vh,12px) 14px;font-size:clamp(12.5px,1.15vw,23px)}',
    '#bp-in.compact .bp-exp{font-size:clamp(12px,1.05vw,21px);padding:min(1vh,11px) 15px;max-height:20vh}',
    /* compact 로도 모자랄 때 한 번 더 조인다 (render 가 재 보고 붙인다) */
    '#bp-in.tight{gap:min(1vh,9px)}',
    '#bp-in.tight .bp-fig{flex:0 1 auto;max-height:26vh}',
    '#bp-in.tight .bp-fig svg{max-height:24vh}',
    '#bp-in.tight .bp-fig img{max-height:24vh}',
    '#bp-in.tight .bp-cap{display:none}',
    '#bp-in.tight .bp-pts{gap:5px}',
    '#bp-in.tight .bp-pts li{font-size:clamp(11px,.86vw,16px);padding:4px 11px;line-height:1.33}',
    '#bp-in.tight .bp-ask{font-size:clamp(12px,1.02vw,20px);padding:5px 13px}',
    '#bp-in.tight .bp-q{font-size:clamp(12.5px,1.12vw,22px)}',
    '#bp-in.tight .bp-opts{gap:6px}',
    '#bp-in.tight .bp-opt{min-height:38px;padding:5px 12px;font-size:clamp(11.5px,.96vw,19px)}',
    '#bp-in.tight .bp-exp{font-size:clamp(11px,.9vw,18px);padding:5px 13px;max-height:16vh}',
    /* tight 로도 모자랄 때만 쓰는 마지막 단계. 여기서야 그림을 크게 줄인다 —
       그 전까지는 글자가 먼저 양보한다(그림이 설명의 대상이라 제일 늦게 줄여야 한다). */
    '#bp-in.tighter{gap:min(.7vh,7px)}',
    '#bp-in.tighter .bp-fig{flex:0 1 auto;max-height:17vh;padding:6px 9px}',
    '#bp-in.tighter .bp-fig svg{max-height:16vh}',
    '#bp-in.tighter .bp-fig img{max-height:16vh}',
    '#bp-in.tighter .bp-pts{gap:4px}',
    '#bp-in.tighter .bp-pts li{font-size:clamp(10.5px,.8vw,15px);padding:3px 10px;line-height:1.3}',
    '#bp-in.tighter .bp-ask{font-size:clamp(11px,.94vw,18px);padding:4px 11px}',
    '#bp-in.tighter .bp-q{font-size:clamp(11.5px,1.02vw,20px)}',
    '#bp-in.tighter .bp-opts{gap:5px}',
    '#bp-in.tighter .bp-opt{min-height:32px;padding:4px 10px;font-size:clamp(10.5px,.88vw,17px)}',
    '#bp-in.tighter .bp-exp{font-size:clamp(10.5px,.84vw,16px);padding:4px 11px;max-height:14vh}',

    /* {{답}} 빈칸 — 누르기 전에는 글자가 안 보인다 */
    '.bp-bl{display:inline-block;min-width:3.4em;padding:0 .35em;margin:0 .12em;border-radius:6px;',
    '  background:#1d3350;border-bottom:2px solid #7fc4ff;color:transparent;cursor:pointer;',
    '  font-weight:800;user-select:none}',
    '.bp-bl:focus{outline:2px solid #7fc4ff;outline-offset:1px}',
    '.bp-bl.on{background:rgba(127,196,255,.16);color:#9fe0ff;border-bottom-color:#9fe0ff;cursor:default}',

    /* ── 판서 ── */
    '#bp-pad{position:fixed;inset:0;z-index:99040;touch-action:none}',
    '#bp-pad.off{pointer-events:none}',
    '#bp-curtain{position:fixed;left:0;right:0;top:0;height:50%;z-index:99050;background:#0b0f16;',
    '  border-bottom:3px solid #7cc6ff;display:none}',
    '#bp-curtain.on{display:block}',

    /* ── 도구바 : 언제나 한 줄. 넘치면 뒤쪽부터 ⋯ 안으로 ── */
    /* 화면에 고정(position:fixed)하면 본문이 이 막대 밑으로 흘러 지나간다 —
       요점 속 빈칸이 도구 단추와 포개져 버린다(폭이 좁을수록 심하다).
       층의 마지막 칸으로 두면 본문은 제 상자 안에서만 구르므로 그럴 일이 없다. */
    '#bp-bar{flex:0 0 auto;z-index:99060;display:flex;gap:7px;align-items:center;',
    '  padding:9px 12px calc(9px + env(safe-area-inset-bottom));background:rgba(9,13,20,.96);',
    '  border-top:1px solid #2f3b4f;flex-wrap:nowrap;overflow:hidden}',
    '#bp-bar[hidden]{display:none!important}',
    '#bp-bar button{min-height:52px;min-width:52px;border-radius:13px;background:#1f2836;border:1px solid #2f3b4f;',
    '  font-size:clamp(13px,1vw,17px);font-weight:800;padding:0 13px;flex-shrink:0}',
    '#bp-bar button.on{background:linear-gradient(180deg,#3b9bff,#2472c8);border-color:transparent;color:#fff}',
    /* 단추 밑에 붙는 짧은 이름 — 「🗑 이게 뭐예요?」 소리가 나와서 붙였다(2026-09-08).
       그림만 있으면 처음 여는 선생님이 무엇인지 알 수가 없다.
       칸이 좁아지면 어차피 「⋯」 안으로 들어가고, 그 안에서도 이름이 함께 보인다. */
    '#bp-bar button i,#bp-pop button i{display:block;font-style:normal;font-weight:700;',
    '  font-size:9.5px;line-height:1.1;margin-top:2px;letter-spacing:-.3px;opacity:.72;',
    '  white-space:nowrap}',
    '#bp-bar button.on i,#bp-pop button.on i{opacity:.95}',
    '#bp-bar #bp-nav button i{display:none}',
    '#bp-bar button.big{flex:0 0 auto;min-width:96px;max-width:min(46vw,230px);',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    '  background:linear-gradient(180deg,#3b9bff,#2472c8);border:0;color:#fff}',
    '#bp-bar button:disabled{opacity:.42;filter:grayscale(.6);cursor:default}',
    /* 나가기 — 다른 단추와 색이 달라야 급할 때 눈에 띈다 */
    '#bp-exit{background:#2a1a1e;border-color:#5e2f38;color:#ffb3bd}',
    '#bp-exit:hover{background:#3a2329}',
    '#bp-nav{display:flex;gap:7px;align-items:center;flex:0 0 auto;width:max-content}',
    /* width:max-content 를 준 이유 — flex-shrink:0 만으로는 이 칸이 제 내용보다
       좁게 잡히는 일이 있었다. 그러면 안의 [◀][다음][▶] 가 칸 밖으로 삐져나와
       옆의 도구 단추와 포개지고, bar 는 넘치지 않은 것으로 보여 ⋯ 로 옮기지도 않는다. */
    '#bp-tools{display:flex;gap:7px;align-items:center;flex:0 0 auto;width:max-content;margin-left:auto}',
    /* 어느 칸도 줄어들면 안 된다. 줄어들면 그 안의 단추들이 상자 밖으로
       삐져나와 옆 칸과 포개지고, 넘친 폭도 잘못 재게 된다.
       모두 제 크기를 지키게 두고, 넘치는 것은 bar 가 잘라 낸다(overflow:hidden).
       그 상태에서 bar.scrollWidth 가 진짜 필요한 폭이 된다. */
    '#bp-bar > *{flex-shrink:0}',
    '.bp-sw{width:40px!important;min-width:40px!important;height:40px;min-height:40px!important;',
    '  border-radius:50%!important;padding:0!important;border:3px solid #0b0f16!important;box-shadow:0 0 0 2px #2f3b4f}',
    '.bp-sw.on{box-shadow:0 0 0 4px #7cc6ff!important}',
    '#bp-more{flex:0 0 auto}',
    '#bp-pop{position:fixed;right:12px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:99070;',
    '  background:#131a26;border:1px solid #2f3b4f;border-radius:16px;padding:10px;display:none;',
    '  gap:7px;flex-wrap:wrap;max-width:min(420px,92vw);box-shadow:0 14px 40px rgba(0,0,0,.55)}',
    '#bp-pop.on{display:flex}',
    '#bp-pop button{min-height:52px;min-width:52px;border-radius:13px;background:#1f2836;border:1px solid #2f3b4f;',
    '  font-size:14px;font-weight:800;padding:0 13px;color:#eef3fb;cursor:pointer;font-family:inherit}',
    '#bp-pop button.on{background:linear-gradient(180deg,#3b9bff,#2472c8);border-color:transparent;color:#fff}',

    /* ── 덮개(타이머·뽑기) ── */
    '.bp-ov{position:fixed;inset:0;z-index:99080;background:rgba(5,8,13,.94);display:none;',
    '  flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:20px}',
    '.bp-ov.on{display:flex}',
    '#bp-tnum{font-size:min(30vw,260px);font-weight:900;letter-spacing:-.04em;font-variant-numeric:tabular-nums;line-height:1}',
    '#bp-pnum{font-size:min(34vw,300px);font-weight:900;line-height:1;color:#ffd166}',
    '.bp-ov .sub{font-size:clamp(15px,1.8vw,30px);color:#93a2ba;font-weight:800;text-align:center}',
    '.bp-ov .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.bp-ov button{min-height:56px;padding:0 22px;border-radius:14px;background:#1f2836;border:1px solid #2f3b4f;',
    '  font-size:clamp(13px,1.1vw,20px);font-weight:800;color:#eef3fb;cursor:pointer;font-family:inherit}',

    /* ── 크게 보기 ──
       fitBody() 는 한 장을 한 화면에 담으려고 글자부터 줄인다(compact→tight→tighter).
       그러다 보면 단계를 다 열은 장은 교실 뒷자리에서 읽힐 크기가 아니게 된다.
       이 덤개는 지금 보이는 내용을 그대로 복사해 줄이기 전 크기로 다시 보여 준다.
       슬라이드 자체는 그대로다 — 닫으면 보던 자리로 돌아온다. */
    '#bp-in .bp-fig{cursor:zoom-in;position:relative}',
    '#bp-in .bp-fig::after{content:"🔍 크게";position:absolute;right:7px;top:6px;',
    '  font-size:11px;font-weight:800;color:#9fd2ff;background:rgba(9,13,20,.78);',
    '  border:1px solid #2f3b4f;border-radius:8px;padding:2px 7px;pointer-events:none}',
    'body.bp-ink #bp-in .bp-fig{cursor:default}',
    'body.bp-ink #bp-in .bp-fig::after{display:none}',
    '#bp-ovz{align-items:stretch;justify-content:flex-start;gap:0;padding:0;background:rgba(5,8,13,.985)}',
    '#bp-ovz .zhead{display:flex;align-items:center;gap:8px;padding:9px 13px;flex-shrink:0;',
    '  background:#0d131d;border-bottom:1px solid #2f3b4f}',
    '#bp-ovz .zttl{flex:1;min-width:0;font-size:clamp(13px,1.3vw,23px);font-weight:900;',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#bp-ovz .zpct{min-width:62px;text-align:center;font-weight:900;color:#93a2ba;',
    '  font-size:clamp(12px,1vw,16px);font-variant-numeric:tabular-nums}',
    '#bp-ovz button{min-height:48px;min-width:48px;padding:0 14px;font-size:clamp(13px,1vw,17px)}',
    '#bp-ovz button:disabled{opacity:.42;cursor:default}',
    /* 밀어서 보는 칸 — 크게 키우면 넘치니 가로·세로 둘 다 굴러야 한다 */
    '#bp-zwrap{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;outline:none;cursor:grab;',
    '  padding:min(2.2vh,18px) min(2.4vw,26px) 30px}',
    /* --bpz 를 높이면 글자는 em 으로, 그림은 폭으로 함께 커진다 */
    '#bp-zin{--bpz:1;display:flex;flex-direction:column;gap:calc(.6em * var(--bpz));',
    '  font-size:calc(clamp(15px,1.5vw,27px) * var(--bpz));line-height:1.55}',
    /* justify-content 를 왼쪽으로 돌려놓는다 — 가운데 정렬(.bp-fig 의 기본값)인 채로
       그림을 키우면 왼쪽으로도 똑같이 삐져나가는데, 그쪽은 굴려서 닿을 수가 없다.
       (200% 에서 그림 왼쪽 194px 이 화면 밖으로 잘려 안 보였다.) */
    '#bp-zin .bp-fig{flex:0 0 auto;max-height:none;overflow:visible;',
    '  align-items:flex-start;justify-content:flex-start}',
    '#bp-zin .bp-fig > *{flex-shrink:0}',
    '#bp-zin .bp-fig svg{max-height:none;width:calc(100% * var(--bpz));height:auto}',
    '#bp-zin .bp-fig img{max-height:none;max-width:none;width:calc(100% * var(--bpz));height:auto}',
    /* 그림을 <div> 로 감싼 도구가 많다 — 안의 svg 가 이미 배율을 먹었으므로 이 칸은 100% 로 둔다 */
    '#bp-zin .bp-fig > div{width:100%;min-width:0}',
    '#bp-zin .bp-cap{font-size:.78em;flex-shrink:0}',
    '#bp-zin .bp-pts{gap:calc(.42em * var(--bpz));flex-shrink:0}',
    '#bp-zin .bp-pts li{font-size:1em;line-height:1.55;padding:.5em .72em}',
    '#bp-zin .bp-ask{font-size:1.06em;padding:.55em .75em}',
    '#bp-zin .bp-q{font-size:1.1em}',
    '#bp-zin .bp-opt{font-size:.95em;min-height:0;padding:.5em .65em}',
    '#bp-zin .bp-exp{font-size:.9em;max-height:none;padding:.6em .8em}',
    '@media (max-width:640px){#bp-zin .bp-opts{grid-template-columns:1fr}}',

    /* ── 메뉴 ── */
    '#bp-menu{position:fixed;inset:0;z-index:99090;overflow-y:auto;padding:26px 20px 40px;',
    '  background:radial-gradient(1200px 700px at 60% -10%,#1a2536,#0a0d13 62%);',
    '  display:none;flex-direction:column;align-items:center;gap:15px}',
    '#bp-menu.on{display:flex}',
    '#bp-menu h1{font-size:clamp(21px,2.8vw,44px);font-weight:900;margin:0;letter-spacing:-1px;text-align:center}',
    '#bp-menu p{color:#93a2ba;font-size:clamp(13px,1.1vw,19px);margin:0;text-align:center;line-height:1.6;max-width:820px}',
    '#bp-grid{display:flex;gap:13px;flex-wrap:wrap;justify-content:center;margin-top:4px;max-width:1100px}',
    '.bp-card{width:min(310px,88vw);background:linear-gradient(180deg,#161d29,#1f2836);border:1px solid #2f3b4f;',
    '  border-radius:18px;padding:17px 19px;text-align:left;color:#eef3fb;font:inherit;cursor:pointer}',
    '.bp-card:hover{border-color:#7cc6ff}',
    '.bp-card.wide{width:min(470px,92vw)}',
    '.bp-card .ic{font-size:34px}',
    '.bp-card .tt{font-size:clamp(15px,1.35vw,22px);font-weight:900;margin-top:7px}',
    '.bp-card .ds{font-size:clamp(12px,1vw,16px);color:#93a2ba;margin-top:6px;line-height:1.5}',
    '#bp-close{margin-top:6px;background:#1f2836;border:1px solid #2f3b4f;border-radius:13px;',
    '  padding:13px 24px;font-size:15px;font-weight:800;color:#eef3fb;cursor:pointer;font-family:inherit}',

    'body.bp-open{overflow:hidden}',
    /* 열려 있는 동안 본체의 떠 있는 위젯을 가린다.
       display:none 으로 지우면 backbar.js 가 「기록 초기화」 높이를 0 으로 재서
       자리를 잃으므로 visibility 로 가린다.
       #rb-btn(📋 평가 기준)은 collector.js 가 z-index 를 21억으로 주기 때문에
       여기서 가리지 않으면 슬라이드 위에 그대로 떠 있다.
       .cm-launch(수업모드)는 이제 안 쓰지만, 남아 있는 도구를 위해 규칙은 둔다.
       🔇 소리(#fxSnd)는 일부러 안 가린다 — 수업 중에 끌 일이 있다. */
    'body.bp-open #bb-btn,',
    'body.bp-open .tr-btn,',
    'body.bp-open .cm-launch,',
    'body.bp-open #rb-btn,',
    'body.bp-open #rk-badge{visibility:hidden!important;pointer-events:none!important}',

    '@media (max-width:640px){',
    '  #bp-bar{gap:5px;padding:7px 9px calc(7px + env(safe-area-inset-bottom))}',
    '  #bp-bar button{min-height:44px;min-width:44px;padding:0 9px;font-size:13px}',
    /* 좁은 폭에서는 #bp-nav 도 줄어들 수 있어야 한다.
       줄어드는 몫은 [다음] 단추 하나가 받는다(overflow:hidden + 말줄임이 걸려 있다).
       나머지 단추는 flex-shrink:0 이라 제 크기를 지키므로 칸 밖으로 삐져나오지 않는다.
       이걸 안 하면 [다음] 글자가 「💭 발문」처럼 길어질 때 폭이 모자라
       [▶] 가 오른쪽 [⋯] 를 11px 파고들었다. */
    '  #bp-nav{width:auto;flex:1 1 auto;min-width:0}',
    '  #bp-bar button.big{flex:1 1 auto;min-width:56px;max-width:none}',
    '  .bp-opts{grid-template-columns:1fr}',
    '  #bp-head{padding:7px 12px}',
    /* 폰 폭에서는 보기 4개가 한 줄씩 쌓여 세로가 길어진다.
       다 연 상태(compact)에서 한 화면에 담기도록 더 조인다. */
    '  #bp-in{gap:7px}',
    '  #bp-in.compact .bp-fig{max-height:22vh;padding:6px 8px}',
    '  #bp-in.compact .bp-fig svg{max-height:20vh}',
    '  #bp-in.compact .bp-fig img{max-height:20vh}',
    '  #bp-in.compact .bp-pts{gap:5px}',
    '  #bp-in.compact .bp-pts li{font-size:11.5px;padding:4px 9px;line-height:1.34}',
    '  #bp-in.compact .bp-ask{font-size:12px;padding:5px 10px}',
    '  #bp-in.compact .bp-q{font-size:13px}',
    '  #bp-in.compact .bp-opts{gap:5px}',
    '  #bp-in.compact .bp-opt{min-height:34px;padding:4px 9px;font-size:12px}',
    '  #bp-in.compact .bp-exp{font-size:11.5px;padding:5px 10px;max-height:13vh}',
    '}'
  ].join('\n');

  /* 도구바 — #bp 안의 마지막 칸으로 들어간다(본문이 밑으로 지나가지 않도록) */
  var BAR_HTML =
    '<div id="bp-bar" hidden>' +
      '<div id="bp-nav">' +
        '<button type="button" id="bp-exit" data-a="exit" title="수업 슬라이드 닫고 도구로 돌아가기">✕ 나가기</button>' +
        '<button type="button" data-a="prev" title="이전 (←)">◀</button>' +
        '<button type="button" class="big" data-a="step">다음</button>' +
        '<button type="button" data-a="next" title="다음 (→)">▶</button>' +
      '</div>' +
      '<div id="bp-tools">' +
        '<button type="button" data-a="zoom" title="크게 보기 (Z)">🔍<i>크게 보기</i></button>' +
        '<button type="button" id="bp-sel"  data-a="sel"  class="on" title="선택 — 판서 끄기 (Esc)">🖱️<i>선택</i></button>' +
        '<button type="button" id="bp-pen"  data-a="pen"  title="펜 (P)">✏️<i>펜</i></button>' +
        '<button type="button" id="bp-hi"   data-a="hi"   title="형광펜">🖍️<i>형광펜</i></button>' +
        '<button type="button" id="bp-er"   data-a="er"   title="지우개">🧽<i>지우개</i></button>' +
        '<button type="button" class="bp-sw on" data-c="#ff4d4f" style="background:#ff4d4f" title="빨강"></button>' +
        '<button type="button" class="bp-sw"    data-c="#ffd166" style="background:#ffd166" title="노랑"></button>' +
        '<button type="button" class="bp-sw"    data-c="#4ade80" style="background:#4ade80" title="초록"></button>' +
        '<button type="button" class="bp-sw"    data-c="#ffffff" style="background:#ffffff" title="흰색"></button>' +
        '<button type="button" data-a="undo" title="되돌리기">↩<i>되돌리기</i></button>' +
        '<button type="button" data-a="clr"  title="판서 지우기 (C)">🗑<i>판서 지움</i></button>' +
        '<button type="button" data-a="timer"   title="타이머">⏱<i>타이머</i></button>' +
        '<button type="button" data-a="pick"    title="번호 뽑기">🎲<i>번호 뽑기</i></button>' +
        '<button type="button" id="bp-cur" data-a="curtain" title="가리개">🪟<i>가리개</i></button>' +
        '<button type="button" data-a="full"    title="전체화면 (F)">⛶<i>전체화면</i></button>' +
        '<button type="button" data-a="home"    title="처음으로">🏠<i>처음으로</i></button>' +
      '</div>' +
      '<button type="button" id="bp-more" data-a="more" title="더보기" hidden>⋯</button>' +
    '</div>';

  /* ═════════ 상태 ═════════ */
  var opts = null, root = null, pad = null, ctx = null;
  var strokes = [], curStroke = null, tool = 'none', color = '#ff4d4f';
  var mode = 'lesson', deck = [], i = 0, step = 0;
  /* 슬라이드마다 판서를 따로 담아 둔다.
     다음 장으로 넘기면 화면은 깨끗해지고, 그 장으로 돌아오면 쓴 것이 다시 나온다.
     지워 버리면 앞 장을 다시 설명할 때 판서를 처음부터 해야 해서 이렇게 한다.
     단계(요점→발문→퀴즈→정답)를 넘기는 것은 같은 장이므로 판서가 그대로 남는다. */
  var inkBySlide = {};
  function keepInk(k) { inkBySlide[k] = strokes; }   /* 떠나는 장의 번호로 담는다 */
  function loadInk() { strokes = inkBySlide[i] || []; redraw(); }
  var built = false;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  /* 요점 한 줄의 {{답}} 을 눌러야 보이는 빈칸으로 바꾼다.
     원고에 태그(<b> 등)가 들어 있으므로 줄 전체를 esc 하지 않는다 —
     빈칸 안의 글자만 esc 한다. */
  function blanks(p) {
    return String(p == null ? '' : p).replace(/\{\{([\s\S]+?)\}\}/g, function (_, a) {
      return '<span class="bp-bl" tabindex="0" role="button" title="눌러서 답 보기">' + esc(a) + '</span>';
    });
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ═════════ 뼈대 ═════════ */
  function build() {
    if (built) return;
    built = true;

    var st = document.createElement('style');
    st.id = 'bp-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    root = document.createElement('div');
    root.id = 'bp';
    root.hidden = true;
    root.innerHTML =
      '<div id="bp-head">' +
        '<div style="flex:1;min-width:0"><div id="bp-u"></div><div id="bp-t"></div></div>' +
        '<div id="bp-i"></div>' +
      '</div>' +
      '<div id="bp-body"><div id="bp-in"></div></div>' +
      BAR_HTML;
    document.body.appendChild(root);

    var extra = document.createElement('div');
    extra.innerHTML =
      '<div id="bp-curtain"></div>' +
      '<canvas id="bp-pad" class="off"></canvas>' +
      '<div id="bp-pop"></div>' +
      '<div class="bp-ov" id="bp-ovt">' +
        '<div id="bp-tnum">3:00</div><div class="sub" id="bp-tsub">남은 시간</div>' +
        '<div class="row">' +
          '<button type="button" data-min="1">1분</button><button type="button" data-min="3">3분</button>' +
          '<button type="button" data-min="5">5분</button><button type="button" data-min="10">10분</button>' +
          '<button type="button" id="bp-ttog">⏸ 멈춤</button>' +
          '<button type="button" data-close="bp-ovt">닫기</button>' +
        '</div>' +
      '</div>' +

      '<div class="bp-ov" id="bp-ovp">' +
        '<div id="bp-pnum">–</div><div class="sub" id="bp-psub">1 ~ 30번</div>' +
        '<div class="row">' +
          '<button type="button" id="bp-pgo">🎲 뽑기</button>' +
          '<button type="button" data-max="20">1~20</button><button type="button" data-max="25">1~25</button>' +
          '<button type="button" data-max="30">1~30</button><button type="button" data-max="35">1~35</button>' +
          '<button type="button" id="bp-preset">기록 초기화</button>' +
          '<button type="button" data-close="bp-ovp">닫기</button>' +
        '</div>' +
        '<div class="sub" id="bp-plog" style="font-size:clamp(12px,1vw,16px)"></div>' +
      '</div>' +

      '<div class="bp-ov" id="bp-ovz">' +
        '<div class="zhead">' +
          '<div class="zttl" id="bp-zttl"></div>' +
          '<button type="button" data-z="-1" title="작게">➖</button>' +
          '<div class="zpct" id="bp-zpct">100%</div>' +
          '<button type="button" data-z="1" title="크게">➕</button>' +
          '<button type="button" data-z="0" title="기본 크기">↺</button>' +
          '<button type="button" data-close="bp-ovz">✕ 닫기</button>' +
        '</div>' +
        /* tabindex — Tab 으로 이 칸에 들어오면 ↓ PageDown 으로도 굴릴 수 있다.
           열 때 자동으로 초점을 주지는 않는다: 그렇게 했더니 휠 굴리기가 통째로
           먹통이 되는 것을 실제로 봤다(2026-09-21 시험). 손가락·휠이 먼저다. */
        '<div id="bp-zwrap" tabindex="0"><div id="bp-zin"></div></div>' +
      '</div>' +

      '<div id="bp-menu"><h1></h1><p></p><div id="bp-grid"></div>' +
        '<button type="button" id="bp-close">← 나가기</button></div>';
    while (extra.firstChild) document.body.appendChild(extra.firstChild);

    /* 판서 캔버스만 #bp 안(도구바 바로 앞)으로 옮긴다.
       body 에 두면 캔버스가 도구바를 덮어 도구를 바꿀 수 없다 — 파일 머리 참고.
       position:fixed 라 flex 배치에는 끼어들지 않는다. */
    root.insertBefore($('bp-pad'), $('bp-bar'));

    pad = $('bp-pad');
    ctx = pad.getContext('2d');
    wire();
  }

  /* ═════════ 판서 ═════════ */
  function fit() {
    var r = window.devicePixelRatio || 1;
    pad.width = innerWidth * r; pad.height = innerHeight * r;
    pad.style.width = innerWidth + 'px'; pad.style.height = innerHeight + 'px';
    ctx.setTransform(r, 0, 0, r, 0, 0);
    redraw();
  }
  function redraw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var k = 0; k < strokes.length; k++) {
      var s = strokes[k];
      if (s.pts.length < 2) continue;
      ctx.globalAlpha = s.hi ? 0.34 : 1;
      ctx.globalCompositeOperation = s.er ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.c; ctx.lineWidth = s.w;
      ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (var j = 1; j < s.pts.length; j++) ctx.lineTo(s.pts[j].x, s.pts[j].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function setTool(t) {
    tool = t;
    pad.classList.toggle('off', t === 'none');
    /* 판서 중에는 화면 전체가 그리는 면이라 그림을 눌러도 「크게 보기」가 안 열린다
       (판서 캔버스가 본문을 덮고 있다). 그러니 안내 딱지도 같이 숨긴다 —
       눌러도 안 되는 딱지가 붙어 있으면 고장난 줄 안다. 도구바 단추는 그대로 쓴다. */
    document.body.classList.toggle('bp-ink', t !== 'none');
    ['bp-sel', 'bp-pen', 'bp-hi', 'bp-er'].forEach(function (id) {
      var b = $(id); if (b) b.classList.toggle('on',
        (id === 'bp-sel' && t === 'none') || (id === 'bp-pen' && t === 'pen') ||
        (id === 'bp-hi'  && t === 'hi')   || (id === 'bp-er'  && t === 'er'));
    });
  }

  /* ═════════ 도구바 — 한 줄로 맞추기 ═════════
     넘치면 뒤쪽 버튼부터 「⋯」 안으로 옮긴다. 그래서 절대 겹치지 않는다. */
  /* 한 칸 안의 단추들이 실제로 차지하는 폭 (칸 자체의 폭은 믿지 않는다) */
  function widthOf(box, gap) {
    var kids = box.children, w = 0;
    for (var k = 0; k < kids.length; k++) w += kids[k].offsetWidth + (k ? gap : 0);
    return w;
  }

  function fitBar() {
    var bar = $('bp-bar'), nav = $('bp-nav'), tools = $('bp-tools'),
        pop = $('bp-pop'), more = $('bp-more');
    if (!bar || bar.hidden) return;

    while (pop.firstChild) tools.appendChild(pop.firstChild);   /* 일단 전부 되돌린다 */
    more.hidden = true;

    /* 칸(#bp-nav·#bp-tools)의 offsetWidth 나 bar.scrollWidth 는 믿을 수 없다 —
       flex 가 칸을 제 내용보다 좁게 잡아 놓고도 넘쳤다고 알려 주지 않는 경우가 있다.
       (실제로 [◀][다음][▶] 가 칸 밖으로 삐져나와 도구 단추와 96% 포개졌다.)
       그래서 단추 하나하나의 폭을 직접 더해서 견준다. 단추는 줄어들지 않으므로
       offsetWidth 가 곧 제 크기다. */
    var cs = getComputedStyle(bar);
    var gap = parseFloat(cs.columnGap || cs.gap) || 7;
    var padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
    var room = bar.clientWidth - padL - padR - widthOf(nav, gap) - gap;

    var guard = 0;
    while (widthOf(tools, gap) > room && tools.lastElementChild && guard++ < 40) {
      if (more.hidden) { more.hidden = false; room -= (more.offsetWidth + gap); }
      pop.insertBefore(tools.lastElementChild, pop.firstChild);
    }
    if (pop.childElementCount === 0) { more.hidden = true; pop.classList.remove('on'); }
  }

  /* 도구바 다시 맞추기.
     rAF 로 미루면 안 된다 — 화면에 안 떠 있는 탭에서는 rAF 가 아예 안 불려서
     버튼이 넘친 채로 굳는다. fitBar 는 어차피 offsetWidth 를 읽어 배치를 강제하므로
     그 자리에서 바로 계산해도 값이 맞다.
     ResizeObserver 가 다시 부르는 것은 막지 않는다(두 번째에는 결과가 같아 멈춘다).
     다만 한 번 도는 도중에 겹쳐 들어오는 것만 막는다. */
  var inFit = false;
  function relayout() {
    if (inFit) return;
    inFit = true;
    try { fitBar(); } finally { inFit = false; }
  }

  /* ═════════ 이어붙이기 ═════════ */
  function wire() {
    pad.addEventListener('pointerdown', function (e) {
      if (tool === 'none') return;
      pad.setPointerCapture(e.pointerId);
      var w = tool === 'er' ? 44 : (tool === 'hi' ? 26 : 5);
      curStroke = { c: color, w: w, hi: tool === 'hi', er: tool === 'er', pts: [{ x: e.clientX, y: e.clientY }] };
      strokes.push(curStroke); redraw();
    });
    pad.addEventListener('pointermove', function (e) {
      if (!curStroke) return;
      var list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (!list || !list.length) list = [e];
      for (var k = 0; k < list.length; k++) curStroke.pts.push({ x: list[k].clientX, y: list[k].clientY });
      redraw();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      pad.addEventListener(t, function () { curStroke = null; });
    });

    /* 도구바·팝업의 모든 단추를 한 곳에서 받는다 (팝업으로 옮겨져도 그대로 동작) */
    function onBar(e) {
      var sw = e.target.closest('.bp-sw');
      if (sw) {
        color = sw.dataset.c;
        Array.prototype.forEach.call(document.querySelectorAll('.bp-sw'), function (x) { x.classList.remove('on'); });
        sw.classList.add('on');
        if (tool === 'none' || tool === 'er') setTool('pen');
        return;
      }
      var b = e.target.closest('[data-a]');
      if (!b) return;
      act(b.dataset.a);
    }
    $('bp-bar').addEventListener('click', onBar);
    $('bp-pop').addEventListener('click', onBar);

    /* 본문 — 빈칸과 그림만 받는다. 빈 곳을 눌러도 넘어가지 않는다.
       그림을 누르면 「크게 보기」가 열린다. 요점 글자는 일부러 뺀다 —
       그 안에 빈칸이 있어 헛클릭이 생기기 때문이다. 전체를 크게 보는 길은
       도구바의 [🔍 크게 보기] 와 Z 키다(펜을 켜 둔 동안에는 판서 캔버스가
       본문을 덮고 있어 그림을 눌러도 안 열린다 — 그때는 도구바를 쓴다). */
    $('bp-body').addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var bl = e.target.closest('.bp-bl');
      if (bl) { bl.classList.add('on'); return; }
      if (e.target.closest('.bp-fig')) zoomOpen();
    });

    /* 크게 보기 창 — 배율 단추와, 복사본 안의 빈칸 */
    $('bp-ovz').addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var z = e.target.closest('[data-z]');
      if (z) { zoomSet(+z.dataset.z === 0 ? ZBASE : zi + (+z.dataset.z)); return; }
      var bl = e.target.closest('.bp-bl');
      if (bl && !bl.classList.contains('on')) {
        bl.classList.add('on');
        /* 복사본에서 열었으면 밑의 슬라이드도 같이 열어 둔다 —
           닫았는데 답이 다시 가려져 있으면 수업이 엉킨다. 순서로 짝짓는다. */
        var zs = $('bp-zin').querySelectorAll('.bp-bl');
        var os = $('bp-in').querySelectorAll('.bp-bl');
        for (var k = 0; k < zs.length; k++)
          if (zs[k] === bl && os[k]) { os[k].classList.add('on'); break; }
      }
    });

    /* 끌어서 밀기 — 크게 키우면 그림이 화면보다 넓어지는데, 마우스 휠에는 가로가 없다.
       손가락(전자칠판)은 브라우저가 알아서 밀어 주므로 마우스일 때만 우리가 민다 —
       둘 다 밀면 두 배로 움직여 멀미가 난다. 6px 넘게 움직여야 밀기로 치므로
       빈칸을 누르는 손은 방해받지 않는다. */
    (function () {
      var wrap = $('bp-zwrap'), on = false, x0 = 0, y0 = 0, sl = 0, st = 0;
      wrap.addEventListener('pointerdown', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        if (e.target.closest && e.target.closest('button,.bp-bl')) return;
        on = true; x0 = e.clientX; y0 = e.clientY; sl = wrap.scrollLeft; st = wrap.scrollTop;
      });
      wrap.addEventListener('pointermove', function (e) {
        if (!on) return;
        var mx = e.clientX - x0, my = e.clientY - y0;
        if (Math.abs(mx) + Math.abs(my) < 6) return;
        wrap.scrollLeft = sl - mx; wrap.scrollTop = st - my;
        wrap.style.cursor = 'grabbing';
        e.preventDefault();
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
        wrap.addEventListener(t, function () { on = false; wrap.style.cursor = ''; });
      });
    })();

    $('bp-grid').addEventListener('click', function (e) {
      var c = e.target.closest('[data-k]');
      if (c) start(+c.dataset.k);
    });
    $('bp-close').addEventListener('click', close);

    /* 덮개 */
    Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (b) {
      b.addEventListener('click', function () { $(b.dataset.close).classList.remove('on'); });
    });
    $('bp-ovt').addEventListener('click', function (e) {
      var b = e.target.closest('[data-min]'); if (b) tmSet(+b.dataset.min);
    });
    $('bp-ttog').addEventListener('click', function () { tmRun(!tmId); });
    $('bp-ovp').addEventListener('click', function (e) {
      var b = e.target.closest('[data-max]');
      if (b) { pkMax = +b.dataset.max; pkUsed = []; pkPaint(); }
    });
    $('bp-pgo').addEventListener('click', pkGo);
    $('bp-preset').addEventListener('click', function () { pkUsed = []; $('bp-pnum').textContent = '–'; pkPaint(); });

    addEventListener('resize', function () { fit(); relayout(); });
    /* 도구바 자체 크기가 바뀔 때도 다시 맞춘다.
       단, fitBar 가 버튼을 옮기면 크기가 또 바뀌어 관찰자가 다시 불린다 —
       무한 반복을 막으려고 rAF 한 번으로 묶는다. */
    if (window.ResizeObserver) new ResizeObserver(relayout).observe($('bp-bar'));

    document.addEventListener('keydown', function (e) {
      if (!root || root.hidden) return;
      if ($('bp-menu').classList.contains('on')) {
        if (e.key === 'Escape') close();
        return;
      }
      /* 크게 보기 창이 열려 있으면 그 창의 키만 받는다 —
         뒤에 가려 있는 슬라이드가 넘어가 버리면 닫았을 때 다른 장이 나온다. */
      if ($('bp-ovz').classList.contains('on')) {
        if (e.key === 'Escape' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); $('bp-ovz').classList.remove('on'); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomSet(zi + 1); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomSet(zi - 1); }
        return;
      }
      /* 빈칸에 초점이 있으면 Enter·스페이스는 빈칸 여는 데 쓴다 */
      var bl = e.target && e.target.closest && e.target.closest('.bp-bl');
      if (bl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); bl.classList.add('on'); return; }
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); act('step-or-next'); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); act('prev'); }
      else if (k === 'f' || k === 'F') { e.preventDefault(); act('full'); }
      else if (k === 'p' || k === 'P') { e.preventDefault(); act('pen'); }
      else if (k === 'c' || k === 'C') { e.preventDefault(); act('clr'); }
      else if (k === 'z' || k === 'Z') { e.preventDefault(); act('zoom'); }
      else if (k === 'Escape') {
        setTool('none');
        Array.prototype.forEach.call(document.querySelectorAll('.bp-ov'), function (o) { o.classList.remove('on'); });
        $('bp-pop').classList.remove('on');
      }
    });
  }

  function act(a) {
    /* 넷은 라디오다. 켜져 있는 것을 다시 눌러도 꺼지지 않는다 —
       끄는 것은 「선택」의 몫이다. 토글이면 무엇이 켜졌는지 알 수가 없었다. */
    if (a === 'sel') setTool('none');
    else if (a === 'pen') setTool('pen');
    else if (a === 'hi') setTool('hi');
    else if (a === 'er') setTool('er');
    else if (a === 'exit') close();
    else if (a === 'undo') { strokes.pop(); redraw(); }
    else if (a === 'clr') { strokes = []; inkBySlide[i] = strokes; redraw(); }
    else if (a === 'prev') go(-1);
    else if (a === 'next') go(1);
    else if (a === 'step') stepUp();
    else if (a === 'step-or-next') { if (step < maxStep()) stepUp(); else go(1); }
    else if (a === 'timer') { $('bp-ovt').classList.add('on'); tmPaint(); }
    else if (a === 'pick') { $('bp-ovp').classList.add('on'); pkPaint(); }
    else if (a === 'zoom') zoomOpen();
    else if (a === 'curtain') {
      var c = $('bp-curtain'); c.classList.toggle('on');
      $('bp-cur').classList.toggle('on', c.classList.contains('on'));
    }
    else if (a === 'full') {
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    }
    else if (a === 'home') menu();
    else if (a === 'more') $('bp-pop').classList.toggle('on');
  }

  /* ═════════ 크게 보기 ═════════
     지금 화면에 보이는 칸을 그대로 복사해 덮개에 올린다.
     복사본이라 슬라이드의 배치·판서는 전혀 건드리지 않는다.
     아직 안 연 단계(.bp-veil)는 안 올린다 — 정답이 먼저 새면 안 된다.
     SVG 안의 id 는 그대로 둔다. <use href="#x"> 는 문서에서 앞서 나오는
     원본을 가리키게 되는데, 둘은 같은 그림이므로 보이는 것은 똑같다. */
  var ZS = [0.85, 1, 1.25, 1.5, 1.8, 2.2, 2.8, 3.5], ZBASE = 1, zi = ZBASE;

  function zoomSet(k) {
    zi = clamp(k, 0, ZS.length - 1);
    $('bp-zin').style.setProperty('--bpz', ZS[zi]);
    $('bp-zpct').textContent = Math.round(ZS[zi] * 100) + '%';
    var bs = $('bp-ovz').querySelectorAll('[data-z]');
    for (var n = 0; n < bs.length; n++) {
      var d = +bs[n].dataset.z;
      bs[n].disabled = (d > 0 && zi >= ZS.length - 1) || (d < 0 && zi <= 0);
    }
  }

  function zoomFill() {
    var zin = $('bp-zin'), src = $('bp-in');
    zin.innerHTML = '';
    Array.prototype.forEach.call(src.children, function (el) {
      if (el.classList.contains('bp-veil')) return;
      zin.appendChild(el.cloneNode(true));
    });
    var u = $('bp-u').textContent, t = $('bp-t').textContent;
    $('bp-zttl').textContent = (u ? u + ' · ' : '') + t;
  }

  function zoomOpen() {
    if (mode === 'blank') return;              /* 빈 칠판은 올릴 내용이 없다 */
    if (!$('bp-in').children.length) return;
    zoomFill();
    $('bp-pop').classList.remove('on');
    $('bp-ovz').classList.add('on');
    $('bp-zwrap').scrollTop = 0; $('bp-zwrap').scrollLeft = 0;
    zoomSet(zi);
  }

  /* ═════════ 타이머 ═════════ */
  var tmLeft = 180, tmId = null;
  function tmPaint() {
    var m = Math.floor(tmLeft / 60), s = tmLeft % 60;
    $('bp-tnum').textContent = m + ':' + String(s).padStart(2, '0');
    $('bp-tnum').style.color = tmLeft <= 10 ? '#ff5f6d' : (tmLeft <= 30 ? '#ffd166' : '#eef3fb');
  }
  function tmSet(min) { tmLeft = min * 60; tmPaint(); tmRun(true); }
  function tmRun(on) {
    if (tmId) { clearInterval(tmId); tmId = null; }
    if (on) {
      tmId = setInterval(function () {
        tmLeft = Math.max(0, tmLeft - 1); tmPaint();
        if (tmLeft === 0) { clearInterval(tmId); tmId = null; $('bp-tsub').textContent = '⏰ 시간 종료'; $('bp-ttog').textContent = '▶ 시작'; }
      }, 1000);
      $('bp-tsub').textContent = '남은 시간';
    }
    $('bp-ttog').textContent = tmId ? '⏸ 멈춤' : '▶ 시작';
  }

  /* ═════════ 번호 뽑기 (한 번 뽑힌 번호는 다시 안 나온다) ═════════ */
  var pkMax = 30, pkUsed = [];
  function pkPaint() {
    $('bp-psub').textContent = '1 ~ ' + pkMax + '번 · 남은 번호 ' + (pkMax - pkUsed.length) + '명';
    $('bp-plog').textContent = pkUsed.length ? ('뽑힌 번호: ' + pkUsed.join(', ')) : '';
  }
  function pkGo() {
    var pool = [];
    for (var n = 1; n <= pkMax; n++) if (pkUsed.indexOf(n) < 0) pool.push(n);
    if (!pool.length) { $('bp-pnum').textContent = '끝'; return; }
    var t = 0;
    var spin = setInterval(function () {
      $('bp-pnum').textContent = pool[Math.floor(Math.random() * pool.length)];
      if (++t > 13) {
        clearInterval(spin);
        var p = pool[Math.floor(Math.random() * pool.length)];
        $('bp-pnum').textContent = p; pkUsed.push(p); pkPaint();
      }
    }, 70);
  }

  /* ═════════ 메뉴 ═════════ */
  function menu() {
    setTool('none');
    $('bp-bar').hidden = true;
    $('bp-pop').classList.remove('on');
    $('bp-curtain').classList.remove('on');
    $('bp-cur').classList.remove('on');
    inkBySlide = {}; strokes = []; redraw();
    /* 메뉴는 위를 덮을 뿐이라 앞 슬라이드가 그대로 뒤에 남는다.
       남겨 두면 그 안의 빈칸·보기가 메뉴 칸과 자리를 다투므로 비운다. */
    $('bp-in').innerHTML = '';
    $('bp-in').className = '';
    $('bp-u').textContent = ''; $('bp-t').textContent = ''; $('bp-i').textContent = '';
    $('bp-menu').classList.add('on');
    relayout();
  }

  function start(k) {
    var m = opts.menu[k]; if (!m) return;
    var run = m.run || {};
    mode = run.kind || 'lesson';
    deck = run.deck || [];
    i = 0; step = 0;
    inkBySlide = {}; strokes = [];
    $('bp-menu').classList.remove('on');
    $('bp-bar').hidden = false;
    fit(); render(); relayout();
  }

  function total() { return mode === 'blank' ? 1 : deck.length; }

  /* 이 슬라이드가 실제로 가진 단계만 돌려준다.
     1 = 발문(ask) · 2 = 퀴즈(ansq) · 3 = 정답·해설(ansq 의 정답 표시 또는 anse)
     예전에는 lesson 이면 무조건 3단계로 세었다. 그래서 발문도 퀴즈도 없이
     요점과 해설만 있는 원고에서는 [다음]을 두 번 눌러야 겨우 해설이 열렸다
     (단추 글자는 「✅ 정답」인 채 아무 일도 안 일어났다).
     퀴즈 없이 설명만 넣는 도구가 실제로 있다 — 그런 원고는 118장이 전부 이랬다. */
  function stages(s) {
    var out = [];
    if (!s) return out;
    if (s.ask) out.push(1);
    if (s.ansq) out.push(2);
    if (s.ansq || s.anse) out.push(3);
    return out;
  }

  /* 퀴즈 보기를 보여 줄 순서 — 원래 번호의 배열. 예: [2,0,3,1] 이면 화면 1번 = 원고 3번.
     난수가 아니라 문항 글자로 정해서, 같은 문항은 수업마다 같은 순서로 나온다. */
  var 번호말함 = /[①②③④⑤]|[1-5]\s*번|보기\s*[1-5]|위의|위 보기|이상 모두/;
  function optOrder(s) {
    var o = s.anso || [], idx = o.map(function (_, k) { return k; });
    if (s.keep || o.length < 3 || 번호말함.test((s.anse || '') + '|' + o.join('|'))) return idx;
    var h = 2166136261, t = (s.ansq || '') + '|' + o.join('|');
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
    for (var k = idx.length - 1; k > 0; k--) {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;            // xorshift — 다음 수
      var j = (h >>> 0) % (k + 1), tmp = idx[k]; idx[k] = idx[j]; idx[j] = tmp;
    }
    return idx;
  }
  /* 지금 단계에서 [다음]이 열게 될 단계. 더 열 것이 없으면 null */
  function nextStage(s) {
    var st = stages(s);
    for (var k = 0; k < st.length; k++) if (st[k] > step) return st[k];
    return null;
  }
  function maxStep() {
    if (mode === 'quiz') return 1;
    if (mode !== 'lesson') return 0;
    var st = stages(deck[i]);
    return st.length ? st[st.length - 1] : 0;
  }

  function figHtml(s) {
    if (opts.fig) { var h = opts.fig(s); if (h) return '<div class="bp-fig">' + h + '</div>'; }
    if (s.svg) return '<div class="bp-fig">' + s.svg + '</div>';
    if (s.img) return '<div class="bp-fig"><img src="' + s.img + '" alt=""></div>';
    return '';
  }

  function render() {
    var inn = $('bp-in');
    if (mode === 'blank') {
      $('bp-u').textContent = ''; $('bp-t').textContent = '빈 칠판'; $('bp-i').textContent = '';
      inn.className = '';
      inn.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;' +
        'color:#26303f;font-size:clamp(17px,1.9vw,32px);font-weight:800">✏️ 펜을 눌러 판서를 시작하세요</div>';
      setBtn('—', true); return;
    }
    var s = deck[i]; if (!s) return;

    if (mode === 'quiz') {
      inn.className = '';
      $('bp-u').textContent = s.src || '';
      $('bp-t').textContent = '문제 ' + (i + 1);
      $('bp-i').textContent = (i + 1) + ' / ' + total();
      inn.innerHTML =
        '<div class="bp-q">' + s.q + '</div>' +
        (s.img ? '<div class="bp-fig"><img src="' + s.img + '" alt=""></div>' : '') +
        '<div class="bp-opts">' + (s.o || []).map(function (o, k) {
          return '<div class="bp-opt ' + (step >= 1 ? (k === s.a ? 'ok' : 'dim') : '') + '">' +
                 '<span class="n">' + (k + 1) + '</span><span>' + o + '</span></div>';
        }).join('') + '</div>' +
        '<div class="bp-exp ' + (step < 1 ? 'bp-veil' : '') + '">' + (s.e || '') + '</div>';
      setBtn(step < 1 ? '✅ 정답 공개' : '✔ 공개됨', step >= 1);
    } else {
      /* 단계를 열었다고 무조건 조이지 않는다.
         예전에는 퀴즈가 열리는 순간 compact 가 붙어 큰 화면에서도 그림이 20vh 로 쭈그러들었다.
         (수업에서 "그림이 너무 작아 안 보인다"는 말이 여기서 나왔다)
         이제는 fitBody() 가 실제로 넘치는지 재 보고 필요한 만큼만 조인다 —
         글자부터 줄이고, 그림은 마지막에 줄인다. */
      inn.className = '';
      $('bp-u').textContent = s.u || '';
      $('bp-t').textContent = s.t || '';
      $('bp-i').textContent = (i + 1) + ' / ' + total();
      inn.innerHTML =
        figHtml(s) +
        (s.cap ? '<div class="bp-cap">' + s.cap + '</div>' : '') +
        '<ul class="bp-pts">' + (s.pts || []).map(function (p) {
          return '<li>' + blanks(p) + '</li>';
        }).join('') + '</ul>' +
        (s.ask ? '<div class="bp-ask ' + (step < 1 ? 'bp-veil' : '') + '">💭 ' + s.ask + '</div>' : '') +
        (s.ansq ? '<div class="' + (step < 2 ? 'bp-veil' : '') + '" style="flex-shrink:0">' +
          '<div class="bp-q" style="margin-bottom:9px">🎯 ' + s.ansq + '</div>' +
          '<div class="bp-opts">' + optOrder(s).map(function (k, n) {
            return '<div class="bp-opt ' + (step >= 3 ? (k === s.ansa ? 'ok' : 'dim') : '') + '">' +
                   '<span class="n">' + (n + 1) + '</span><span>' + s.anso[k] + '</span></div>';
          }).join('') + '</div></div>' : '') +
        (s.anse ? '<div class="bp-exp ' + (step < 3 ? 'bp-veil' : '') + '">' + s.anse + '</div>' : '');
      setBtn(stepLabel(s), nextStage(s) === null);
    }
    fitBody();
    /* 크게 보기 창이 열린 채 단계가 바뀔 수도 있다 — 복사본도 같이 갱신한다 */
    if ($('bp-ovz') && $('bp-ovz').classList.contains('on')) zoomFill();
    $('bp-body').scrollTop = 0;
    /* 도구바는 #bp 안이 아니라 형제다(화면 맨 아래 고정). 문서 전체에서 찾는다.
       버튼이 「⋯」 팝업으로 옮겨가 있을 수도 있으므로 더 그렇다. */
    var pv = barBtn('prev'); if (pv) pv.disabled = (i === 0 && step === 0);
    var nb = barBtn('next'); if (nb) nb.disabled = (i >= total() - 1);
    /* [다음] 단추의 글자가 바뀌면 그 단추의 폭도 바뀐다(「✔ 다 열림」 ↔ 「💭 발문」).
       도구바 자체는 크기가 그대로라 ResizeObserver 가 안 불리므로, 여기서 다시 맞춘다.
       이걸 안 하면 글자가 길어진 순간 왼쪽 칸이 오른쪽 「⋯」 를 파고든다. */
    relayout();
  }

  /* 한 슬라이드 = 한 화면. 그래도 넘치면 글자와 그림을 한 단계씩 더 조인다.
     원고를 고치지 않고 화면 쪽에서 맞추는 것이라, 요점이 5줄인 옛 원고도 담긴다.
     (그 전에는 발문까지 연 상태에서 1366 화면이 85~493px 넘쳐 스크롤이 생겼다.) */
  function fitBody() {
    if (mode !== 'lesson') return;
    var bd = $('bp-body'), inn = $('bp-in');
    if (!bd || !inn) return;
    var over = function () { return bd.scrollHeight - bd.clientHeight; };
    var add = function (c) {
      if (over() > 2 && inn.className.indexOf(c) < 0)
        inn.className = (inn.className + ' ' + c).replace(/^ /, '');
    };
    add('compact');   /* 글자를 줄인다 */
    add('tight');     /* 더 줄인다 */
    add('tighter');   /* 여기서야 그림을 줄인다 */
    /* 그림이 <img> 면 아직 안 실려 높이가 0 으로 재질 수 있다 — 실린 뒤 한 번 더 잰다 */
    var im = inn.querySelectorAll('img');
    for (var k = 0; k < im.length; k++) {
      if (im[k].complete) continue;
      im[k].addEventListener('load', function () {
        inn.className = inn.className.replace(/(compact|tight|tighter)/g, '').trim();
        fitBody();
      }, { once: true });
    }
  }

  /* [다음] 이 실제로 무엇을 여는지 그대로 적는다 — 없는 것을 열겠다고 하면 안 된다 */
  function stepLabel(s) {
    var nx = nextStage(s);
    if (nx === null) return '✔ 다 열림';
    if (nx === 1) return '💭 발문';
    if (nx === 2) return '🎯 퀴즈';
    return '✅ 정답';
  }
  /* 도구바 단추 찾기 — 「⋯」 팝업으로 옮겨져 있을 수 있어 두 곳을 다 본다 */
  function barBtn(a) {
    return document.querySelector('#bp-bar [data-a="' + a + '"]') ||
           document.querySelector('#bp-pop [data-a="' + a + '"]');
  }
  function setBtn(txt, dis) {
    var b = barBtn('step');
    if (!b) return;
    b.textContent = txt; b.disabled = !!dis;
  }
  /* 빈 단계는 건너뛴다 — 눌렀는데 아무것도 안 열리는 일이 없어야 한다 */
  function stepUp() {
    if (mode === 'lesson') {
      var nx = nextStage(deck[i]);
      if (nx === null) return;
      step = nx; render(); return;
    }
    if (step < maxStep()) { step++; render(); }
  }
  function go(d) {
    if (mode === 'blank') return;
    var n = total(); if (!n) return;
    var was = i;
    i = clamp(i + d, 0, n - 1);
    if (i !== was) { keepInk(was); step = 0; loadInk(); }
    else step = 0;
    render();
  }

  /* ═════════ 열고 닫기 ═════════ */
  function open(o) {
    opts = o || {};
    build();
    root.hidden = false;
    document.body.classList.add('bp-open');
    $('bp-menu').querySelector('h1').textContent = opts.title || '📽️ 수업 슬라이드';
    $('bp-menu').querySelector('p').innerHTML = opts.sub || '';
    $('bp-grid').innerHTML = (opts.menu || []).map(function (m, k) {
      return '<button type="button" class="bp-card' + (m.wide ? ' wide' : '') + '" data-k="' + k + '">' +
        (m.icon ? '<div class="ic">' + m.icon + '</div>' : '') +
        '<div class="tt">' + esc(m.title) + '</div>' +
        (m.desc ? '<div class="ds">' + m.desc + '</div>' : '') + '</button>';
    }).join('');
    fit();
    menu();
  }

  function close() {
    if (!root) return;
    if (tmId) { clearInterval(tmId); tmId = null; }
    setTool('none');
    strokes = []; redraw();
    root.hidden = true;
    $('bp-bar').hidden = true;
    $('bp-pop').classList.remove('on');
    $('bp-menu').classList.remove('on');
    $('bp-curtain').classList.remove('on');
    Array.prototype.forEach.call(document.querySelectorAll('.bp-ov'), function (o) { o.classList.remove('on'); });
    document.body.classList.remove('bp-open');
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    if (opts && opts.onClose) opts.onClose();
  }

  global.BoardPro = { open: open, close: close, menu: menu };
})(window);
