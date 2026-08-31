/* ══════════════════════════════════════════════════════════════
   reset.js — 학습도구 공용 "기록 초기화" 위젯

   붙이는 법 (</body> 앞 한 줄):
     <script src="https://hongyul67-cpu.github.io/links/reset.js"></script>

   왜 필요한가:
     교실 공용 PC에서 다음 학생이 쓰기 전에 앞 사람 기록을 지워야 합니다.
     도구마다 저장 키 이름이 제각각(plcx_progress_v1 · try_ncs · rank_v1_… )이라
     키를 미리 적어 둘 수 없어서, 열려 있는 저장소를 훑어 분류합니다.

   기본으로 지우지 않는 것:
     · rc_endpoint_v1          교사 구글시트 주소 — 지우면 제출이 선생님께 안 갑니다
     · hub_pw_v1 / hong_pw_v1  잠금 해제 상태 — 지우면 코드를 다시 넣어야 합니다
     둘 다 체크로 직접 켤 수 있고, 켜면 무슨 일이 생기는지 화면에 적혀 있습니다.

   API:
     ToolReset.open()    창 열기
     ToolReset.scan()    무엇이 지워질지 미리 보기 (배열)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.ToolReset) return;                 // 두 번 붙어도 하나만

  /* 교사 설정 — 기본으로 건드리지 않는다 */
  var TEACHER = ['rc_endpoint_v1'];
  var UNLOCK = ['hub_pw_v1', 'hong_pw_v1'];
  /* 내 정보(이름·반·번호) — 다음 학생을 위해 기본으로 지운다 */
  var WHOAMI = ['rc_student'];

  function ls() {
    try { return window.localStorage; } catch (e) { return null; }
  }
  function keys() {
    var s = ls(), out = [];
    if (!s) return out;
    try { for (var i = 0; i < s.length; i++) out.push(s.key(i)); } catch (e) {}
    return out;
  }
  function sizeOf(k) {
    var s = ls();
    try { return (s.getItem(k) || '').length; } catch (e) { return 0; }
  }
  function group(k) {
    if (TEACHER.indexOf(k) > -1) return 'teacher';
    if (UNLOCK.indexOf(k) > -1) return 'unlock';
    if (WHOAMI.indexOf(k) > -1) return 'who';
    if (k.indexOf('rank_v1_') === 0) return 'rank';
    return 'record';
  }

  /* 무엇이 지워질지 — 화면에 그대로 보여 준다 */
  function scan() {
    return keys().map(function (k) {
      return { key: k, group: group(k), bytes: sizeOf(k) };
    }).sort(function (a, b) { return b.bytes - a.bytes; });
  }

  var LABEL = {
    record: '학습 기록 (진도 · 이어하기 · 오답노트)',
    rank: '계급 · 랭크 포인트',
    who: '내 정보 (이름 · 반 · 번호)',
    teacher: '교사 결과수집 주소',
    unlock: '잠금 해제 상태'
  };

  var CSS =
    '.tr-btn{position:fixed;left:14px;bottom:14px;z-index:2147482000;' +
      'background:rgba(8,22,38,.86);color:#cfe3f7;border:1px solid rgba(207,227,247,.28);' +
      'border-radius:999px;padding:7px 13px;font:600 12.5px/1 system-ui,sans-serif;cursor:pointer}' +
    '.tr-btn:hover{border-color:#7fc4ff;color:#eaf4ff}' +
    /* 아이콘만 남긴다 — 글자까지 있으면(116px) 본문 단추를 덮어 못 누르는 자리가 생긴다.
       이름은 title·aria-label 로 남는다. */
    '.tr-btn{padding:7px 10px;font-size:0}' +
    '.tr-btn::before{content:"🧹";font-size:14px}' +
    '.tr-ov{position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.72);' +
      'display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.tr-box{background:#101b2c;color:#e9eefa;border:1px solid #2c3852;border-radius:16px;' +
      'max-width:430px;width:100%;padding:18px;font:14px/1.55 system-ui,sans-serif;' +
      'max-height:86vh;overflow:auto}' +
    '.tr-box h3{margin:0 0 4px;font-size:16px;color:#e9eefa}' +
    '.tr-sub{color:#9aa7c2;font-size:12.5px;margin:0 0 12px}' +
    '.tr-row{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;margin-bottom:6px;' +
      'border:1px solid #2c3852;border-radius:10px;cursor:pointer}' +
    '.tr-row input{width:16px;height:16px;margin-top:2px;flex:0 0 16px;accent-color:#5b8cff}' +
    '.tr-nm{font-weight:700;font-size:13px}' +
    '.tr-de{color:#9aa7c2;font-size:11.5px;margin-top:2px}' +
    '.tr-warn{color:#f0a742}' +
    '.tr-none{color:#9aa7c2;font-size:12.5px;padding:10px 2px}' +
    '.tr-act{display:flex;gap:8px;margin-top:14px}' +
    '.tr-act button{flex:1;border-radius:10px;padding:11px;font-size:13.5px;font-weight:700;' +
      'cursor:pointer;border:1px solid #2c3852;background:#1a2130;color:#e9eefa}' +
    '.tr-act .tr-go{background:#e0574f;border-color:#e0574f;color:#fff}' +
    '.tr-act .tr-go:disabled{opacity:.45;cursor:default}' +
    '.tr-done{color:#38d39f;font-weight:700;text-align:center;padding:6px 0 2px}';

  function style() {
    if (document.getElementById('tr-css')) return;
    var s = document.createElement('style');
    s.id = 'tr-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function open() {
    style();
    var found = scan();
    var have = {};
    found.forEach(function (r) { have[r.group] = (have[r.group] || 0) + 1; });

    var ov = document.createElement('div');
    ov.className = 'tr-ov';

    /* 기본 선택: 학습 기록 · 계급 · 내 정보. 교사 설정과 잠금은 꺼 둔다. */
    var order = ['record', 'rank', 'who', 'unlock', 'teacher'];
    var rows = order.filter(function (g) { return have[g]; }).map(function (g) {
      var on = (g === 'record' || g === 'rank' || g === 'who') ? ' checked' : '';
      var note;
      if (g === 'teacher') {
        note = '<div class="tr-de tr-warn">지우면 제출이 선생님 시트로 가지 않습니다</div>';
      } else if (g === 'unlock') {
        note = '<div class="tr-de tr-warn">지우면 다음에 열 때 코드를 다시 넣어야 합니다</div>';
      } else {
        note = '<div class="tr-de">' + have[g] + '개 항목</div>';
      }
      return '<label class="tr-row"><input type="checkbox" data-g="' + g + '"' + on + '>' +
        '<span><span class="tr-nm">' + LABEL[g] + '</span>' + note + '</span></label>';
    }).join('');

    ov.innerHTML =
      '<div class="tr-box" role="dialog" aria-modal="true">' +
        '<h3>🧹 기록 초기화</h3>' +
        '<p class="tr-sub">이 기기(브라우저)에 저장된 것만 지웁니다. ' +
          '이미 선생님께 제출한 결과는 지워지지 않습니다.</p>' +
        (rows || '<div class="tr-none">지울 기록이 없습니다.</div>') +
        '<div class="tr-act">' +
          '<button type="button" class="tr-cancel">닫기</button>' +
          '<button type="button" class="tr-go"' + (rows ? '' : ' disabled') + '>선택한 기록 지우기</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function close() { ov.remove(); }
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.tr-cancel').onclick = close;
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    var go = ov.querySelector('.tr-go');
    if (go) go.onclick = function () {
      var pick = {};
      Array.prototype.forEach.call(ov.querySelectorAll('input[data-g]'), function (b) {
        if (b.checked) pick[b.getAttribute('data-g')] = 1;
      });
      var del = found.filter(function (r) { return pick[r.group]; });
      if (!del.length) { close(); return; }
      if (!window.confirm(del.length + '개 항목을 지웁니다. 되돌릴 수 없습니다. 계속할까요?')) return;
      var s = ls();
      del.forEach(function (r) { try { s.removeItem(r.key); } catch (e) {} });
      ov.querySelector('.tr-box').innerHTML =
        '<h3>🧹 기록 초기화</h3><div class="tr-done">✔ ' + del.length + '개를 지웠습니다</div>' +
        '<p class="tr-sub" style="text-align:center">화면을 새로 불러옵니다…</p>';
      setTimeout(function () { location.reload(); }, 900);
    };
  }

  /* 버튼 붙이기 — 수업모드에서는 class-mode.js 가 .cm-chrome 을 숨긴다 */
  function mount() {
    if (!ls() || document.querySelector('.tr-btn')) return;
    style();
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tr-btn cm-chrome';
    b.textContent = '🧹 기록 초기화';
    b.setAttribute('aria-label', '기록 초기화');   /* 좁은 화면에서 글자를 숨겨도 읽히도록 */
    b.title = '기록 초기화';
    b.title = '이 기기에 저장된 학습 기록을 지웁니다';
    b.onclick = open;
    document.body.appendChild(b);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.ToolReset = { open: open, scan: scan, mount: mount };
})();
