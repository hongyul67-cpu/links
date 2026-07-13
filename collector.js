/*!
 * result-collector — 범용 결과 제출 위젯
 *
 * 아무 학습도구 HTML에 아래 한 줄만 넣으면 됩니다:
 *
 *   <script src="https://hongyul67-cpu.github.io/links/collector.js"
 *           data-endpoint="https://script.google.com/macros/s/여기붙이기/exec"
 *           data-tool="자동화설비 필기"
 *           data-classes="1,2,3,4,5"
 *           data-max-num="40"></script>
 *
 * 그리고 채점이 끝나는 지점에서 한 번 호출:
 *
 *   ResultCollector.open({
 *     score: 85,            // 점수(선택)
 *     correct: 17,          // 맞은 개수(선택)
 *     total: 20,            // 총 문항(선택)
 *     wrong: [3, 7, 12],    // 오답 번호 배열(선택)
 *     durationSec: 240      // 소요 시간 초(선택)
 *   });
 *
 * → 학생에게 [반 선택 + 번호] 입력창이 뜨고, 제출하면 구글 시트에 저장됩니다.
 *
 * data-* 속성 설명:
 *   data-endpoint  (필수) Apps Script 웹앱 URL
 *   data-tool      (권장) 시트 탭 이름. 없으면 문서 제목 사용
 *   data-classes   (선택) 반 목록. 기본 "1,2,3,4,5,6,7,8,9,10"
 *   data-max-num   (선택) 번호 최대값. 기본 40
 *   data-secret    (선택) Code.gs의 SECRET과 같은 값(암호 쓸 때만)
 *   data-name      (선택) "1"이면 이름 입력칸을 보여줌
 *   data-grade     (선택) "1"이면 학년 입력칸을 보여줌
 *   data-dept      (선택) "1"이면 학과 입력칸을 보여줌
 */
(function () {
  'use strict';

  var cur = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var d = (cur && cur.dataset) || {};

  // URL 쿼리에서 교사별 설정을 읽음 (예: tool.html?rc=<교사 exec URL>&cls=1,2,3&max=40)
  // 우선순위: URL 파라미터 > script 태그의 data-* > 기본값
  function qp(name) {
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  }

  var CFG = {
    endpoint: qp('rc') || d.endpoint || '',
    tool: qp('tool') || d.tool || document.title || '학습도구',
    classes: (qp('cls') || d.classes || '1,2,3,4,5,6,7,8,9,10').split(',').map(function (x) { return x.trim(); }).filter(Boolean),
    maxNum: parseInt(qp('max') || d.maxNum || '40', 10),
    secret: qp('sec') || d.secret || '',
    fixCls: qp('fixcls') || d.fixcls || '',   // 반 고정(한 반용 링크). 값이 있으면 반 선택 대신 고정
    askName: (qp('name') || d.name || '') === '1',  // 이름 입력 받을지
    askGrade: (qp('grade') || d.grade || '') === '1',  // 학년 입력 받을지
    askDept: (qp('dept') || d.dept || '') === '1'  // 학과 입력 받을지
  };

  var LS_KEY = 'rc_student';   // 마지막 반/번호 기억

  // ── 스타일 주입 ─────────────────────────────
  var css = '' +
    '.rc-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family:system-ui,"Segoe UI",Roboto,"Malgun Gothic",sans-serif;padding:16px}' +
    '.rc-card{background:#fff;color:#0f172a;width:100%;max-width:360px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:22px;box-sizing:border-box}' +
    '.rc-card h3{margin:0 0 4px;font-size:19px}' +
    '.rc-sub{margin:0 0 16px;font-size:13px;color:#64748b}' +
    '.rc-row{display:flex;gap:10px;margin-bottom:14px}' +
    '.rc-field{flex:1}' +
    '.rc-field label{display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:5px}' +
    '.rc-field select,.rc-field input{width:100%;box-sizing:border-box;padding:11px 10px;font-size:16px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a}' +
    '.rc-field select:focus,.rc-field input:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15)}' +
    '.rc-summary{background:#f1f5f9;border-radius:10px;padding:10px 12px;font-size:13px;color:#334155;margin-bottom:16px;line-height:1.6}' +
    '.rc-btns{display:flex;gap:10px}' +
    '.rc-btn{flex:1;padding:12px;font-size:15px;font-weight:700;border:0;border-radius:10px;cursor:pointer}' +
    '.rc-ok{background:#6366f1;color:#fff}' +
    '.rc-ok:disabled{opacity:.6;cursor:default}' +
    '.rc-cancel{background:#e2e8f0;color:#334155}' +
    '.rc-msg{margin-top:12px;font-size:13px;text-align:center;min-height:18px}' +
    '.rc-msg.err{color:#dc2626}' +
    '.rc-msg.ok{color:#16a34a;font-weight:700}';

  function injectCss() {
    if (document.getElementById('rc-css')) return;
    var st = document.createElement('style');
    st.id = 'rc-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function loadLast() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveLast(o) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {}
  }

  function open(payload) {
    payload = payload || {};
    injectCss();

    var last = loadLast();

    var ov = document.createElement('div');
    ov.className = 'rc-ov';

    // 반: 고정(한 반용) 이면 읽기전용 표시, 아니면 드롭다운(한 학년용)
    var clsField;
    if (CFG.fixCls) {
      clsField = '<div class="rc-field"><label>반</label>' +
        '<input id="rc-cls" type="text" value="' + esc(CFG.fixCls) + '반" readonly ' +
        'data-cls="' + esc(CFG.fixCls) + '" style="background:#f1f5f9;font-weight:700"></div>';
    } else {
      var opts = CFG.classes.map(function (c) {
        var sel = (String(c) === String(last.cls)) ? ' selected' : '';
        return '<option value="' + esc(c) + '"' + sel + '>' + esc(c) + '반</option>';
      }).join('');
      clsField = '<div class="rc-field"><label>반</label><select id="rc-cls">' + opts + '</select></div>';
    }

    // 이름 입력(옵션)
    var nameField = CFG.askName ?
      '<div class="rc-field" style="margin-bottom:14px"><label>이름</label>' +
      '<input id="rc-name" type="text" placeholder="이름" value="' + (last.name ? esc(last.name) : '') + '"></div>' : '';

    // 학년/학과 입력(옵션)
    var gradeDeptFields = [];
    if (CFG.askGrade) gradeDeptFields.push(
      '<div class="rc-field"><label>학년</label>' +
      '<input id="rc-grade" type="text" placeholder="학년" value="' + (last.grade ? esc(last.grade) : '') + '"></div>');
    if (CFG.askDept) gradeDeptFields.push(
      '<div class="rc-field"><label>학과</label>' +
      '<input id="rc-dept" type="text" placeholder="학과" value="' + (last.dept ? esc(last.dept) : '') + '"></div>');
    var gradeDeptRow = gradeDeptFields.length ?
      '<div class="rc-row" style="margin-bottom:14px">' + gradeDeptFields.join('') + '</div>' : '';

    // 결과 요약 미리보기
    var parts = [];
    if (payload.score !== undefined) parts.push('점수 <b>' + esc(payload.score) + '</b>');
    if (payload.correct !== undefined && payload.total !== undefined)
      parts.push('정답 <b>' + esc(payload.correct) + '/' + esc(payload.total) + '</b>');
    if (payload.durationSec !== undefined)
      parts.push('소요 <b>' + Math.round(payload.durationSec) + '초</b>');
    var summary = parts.length ? '<div class="rc-summary">' + parts.join(' · ') + '</div>' : '';

    ov.innerHTML =
      '<div class="rc-card" role="dialog" aria-modal="true">' +
        '<h3>결과 제출</h3>' +
        '<p class="rc-sub">' + esc(CFG.tool) + '</p>' +
        summary +
        nameField +
        gradeDeptRow +
        '<div class="rc-row">' +
          clsField +
          '<div class="rc-field"><label>번호</label>' +
            '<input id="rc-num" type="number" inputmode="numeric" min="1" max="' + CFG.maxNum + '" ' +
            'placeholder="번호" value="' + (last.num ? esc(last.num) : '') + '"></div>' +
        '</div>' +
        '<div class="rc-btns">' +
          '<button class="rc-btn rc-cancel" id="rc-cancel">취소</button>' +
          '<button class="rc-btn rc-ok" id="rc-ok">제출</button>' +
        '</div>' +
        '<div class="rc-msg" id="rc-msg"></div>' +
      '</div>';

    document.body.appendChild(ov);

    var elNum = ov.querySelector('#rc-num');
    var elCls = ov.querySelector('#rc-cls');
    var elName = ov.querySelector('#rc-name');
    var elGrade = ov.querySelector('#rc-grade');
    var elDept = ov.querySelector('#rc-dept');
    var elOk = ov.querySelector('#rc-ok');
    var elMsg = ov.querySelector('#rc-msg');

    setTimeout(function () { (CFG.askName && elName ? elName : elNum).focus(); }, 50);

    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }

    ov.querySelector('#rc-cancel').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

    elOk.addEventListener('click', function () {
      var cls = CFG.fixCls ? CFG.fixCls : elCls.value;
      var numV = (elNum.value || '').trim();
      var nameV = elName ? (elName.value || '').trim() : '';
      var gradeV = elGrade ? (elGrade.value || '').trim() : '';
      var deptV = elDept ? (elDept.value || '').trim() : '';

      if (CFG.askName && !nameV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '이름을 입력하세요.'; elName.focus(); return; }
      if (CFG.askGrade && !gradeV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '학년을 입력하세요.'; elGrade.focus(); return; }
      if (CFG.askDept && !deptV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '학과를 입력하세요.'; elDept.focus(); return; }
      if (!numV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '번호를 입력하세요.'; elNum.focus(); return; }
      if (!CFG.endpoint) { elMsg.className = 'rc-msg err'; elMsg.textContent = '설정 오류: endpoint가 없습니다.'; return; }

      elOk.disabled = true;
      elMsg.className = 'rc-msg';
      elMsg.textContent = '전송 중…';

      var body = {
        tool: CFG.tool,
        cls: cls,
        num: numV,
        name: nameV,
        grade: gradeV,
        dept: deptV,
        score: payload.score,
        correct: payload.correct,
        total: payload.total,
        wrong: payload.wrong,
        durationSec: payload.durationSec,
        ua: navigator.userAgent,
        secret: CFG.secret
      };

      // Content-Type을 text/plain으로 보내 CORS preflight를 피함 (Apps Script 표준 패턴)
      fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json().catch(function () { return { ok: true }; }); })
        .then(function (res) {
          if (res && res.ok === false) throw new Error(res.error || '서버 오류');
          saveLast({ cls: cls, num: numV, name: nameV, grade: gradeV, dept: deptV });
          elMsg.className = 'rc-msg ok';
          elMsg.textContent = '✔ 제출 완료!';
          setTimeout(close, 1200);
        })
        .catch(function (err) {
          elOk.disabled = false;
          elMsg.className = 'rc-msg err';
          elMsg.textContent = '전송 실패: ' + err.message + ' (다시 시도)';
        });
    });
  }

  window.ResultCollector = { open: open, config: CFG };
})();
