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
 *   data-name      (선택) 이름 입력칸. 기본으로 보여 주며, "0"이면 감춤
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
    // 이름은 항상 받는다 — 누가 냈는지 모르는 제출은 쓸모가 없다.
    // 예전에 나눠 준 링크에는 name=1 이 없어 익명으로 들어오던 문제가 있었다.
    // 꼭 익명으로 받아야 하면 링크에 name=0 (또는 data-name="0")을 붙인다.
    askName: (qp('name') || d.name || '1') !== '0',
    askGrade: (qp('grade') || d.grade || '') === '1',  // 학년 입력 받을지
    askDept: (qp('dept') || d.dept || '') === '1',  // 학과 입력 받을지
    askMemo: false   // (사용 안 함) 학생 직접 입력 대신 아래 autoKeywords로 자동 생성
  };

  /* ── 생기부(세특) 작성용 키워드·문장 자동 생성 ──────────────────
     교사가 세특에 그대로 옮겨 쓸 수 있는 어투(명사형 종결)로 만든다.
     · 도구 이름("○○ 마스터")이 아니라 배운 내용이 드러나게 학습 주제로 바꾼다.
     · 계급·RP·점수 같은 게임 요소는 생기부에 넣지 않는다(교사용 참고 열에만 남는다).
     · 부정적 낙인 대신 성장 관점으로 서술한다.
     도구는 open() 호출 때 mode(활동명), retry(재도전 횟수), extra(교과 역량 키워드)를 넘기면 된다. */

  /* "용접기호 마스터 — 기호 익히기" → "용접기호" 처럼 학습 주제만 남긴다.
     "과목별 학습 · 기계요소" 처럼 앞이 일반어면 뒤(구체적인 단원)를 쓴다. */
  var GENERIC = /^(과목별\s*학습|단원별\s*학습|전체|기본|심화|연습|학습|실습|도전|시험|평가)$/;
  function topicOf(mode) {
    var s = String(mode || '').split('—')[0].trim();          // 앞부분(주제)만
    var parts = s.split('·').map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length > 1 && GENERIC.test(parts[0])) s = parts.slice(1).join(' · ');
    else s = parts.join(' · ');
    return strip(s);
  }
  function strip(s) {
    s = String(s || '').replace(/\s*\(.*\)\s*$/, '').trim();
    /* 도구·평가형식 꼬리표는 세특 문장에 어울리지 않으므로 떼어낸다 */
    s = s.replace(/\s*(마스터|트레이너|연습소|익스플로러|비교기|시뮬레이터|게임|퀴즈|앱|도구|모음|허브)\s*$/g, '').trim();
    s = s.replace(/\s*(CBT|cbt)\s*/g, ' ').trim();
    s = s.replace(/\s*(모의고사|모의평가|테스트|점검|도전|연습|훈련|실습|학습)\s*$/g, '').trim();
    return s.replace(/\s{2,}/g, ' ').trim();
  }

  function autoKeywords(p) {
    var k = [];
    var topic = topicOf(p.mode);
    if (topic) k.push(topic + ' 학습');

    var total = Number(p.total) || 0, correct = Number(p.correct) || 0;
    var rate = total > 0 ? Math.round(correct / total * 100) : null;
    if (rate !== null) {
      if (rate >= 90)      k.push('개념을 정확히 이해하고 적용함');
      else if (rate >= 75) k.push('주요 개념을 이해하고 적용함');
      else if (rate >= 50) k.push('기본 개념을 이해함');
      else                 k.push('개념을 익혀 가는 단계');
    }
    var sec = Number(p.durationSec) || 0;
    if (rate !== null && sec > 0 && total > 0) {
      var perQ = sec / total;
      if (rate >= 80 && perQ <= 12) k.push('과제를 정확하고 신속하게 해결함');
      else if (rate >= 80)          k.push('끝까지 신중하게 확인하며 해결함');
      else if (perQ >= 25)          k.push('시간을 들여 끈기 있게 해결하려 함');
    }
    if (Number(p.retry) >= 2) k.push('반복 학습으로 스스로 보완함');
    if (p.extra) k = k.concat([].concat(p.extra));
    return k.join(' · ');
  }

  function autoDraft(p) {
    var total = Number(p.total) || 0, correct = Number(p.correct) || 0;
    var rate = total > 0 ? Math.round(correct / total * 100) : null;
    var topic = topicOf(p.mode);
    var s = topic ? (topic + ' 학습 활동에 참여하여 ') : '수업 활동에 참여하여 ';
    if (total > 0) s += '제시된 ' + total + '문항 중 ' + correct + '문항을 해결함(정답률 ' + rate + '%). ';
    if (rate !== null) {
      if (rate >= 90)      s += '핵심 개념을 정확히 이해하고 새로운 문제 상황에 적용하는 능력이 뛰어남. ';
      else if (rate >= 75) s += '주요 개념을 이해하고 문제 상황에 적용할 수 있음. ';
      else if (rate >= 50) s += '기본 개념을 이해하였으며, 반복 학습을 통해 적용 능력을 넓혀 가고 있음. ';
      else                 s += '개념을 익혀 가는 단계로, 꾸준한 반복 학습을 통한 정착이 기대됨. ';
    }
    if (Number(p.retry) >= 2) s += '틀린 문항을 스스로 다시 풀어 보며 부족한 부분을 보완하려는 태도가 돋보임. ';
    var sec = Number(p.durationSec) || 0;
    if (rate !== null && sec > 0 && total > 0 && rate >= 80 && (sec / total) <= 12)
      s += '주어진 과제를 정확하고 신속하게 처리함. ';
    return s.trim();
  }

  /* ── 평가 루브릭 (rubric.json) ────────────────────────────────
     도구 저장소 최상위에 rubric.json 이 있으면, 위의 공용 문장 대신
     그 도구의 루브릭으로 수준(상/중/하)을 판정하고 문구를 만든다.
     · 파일이 없으면 조용히 넘어간다 — 루브릭이 없는 도구도 지금 그대로 동작한다.
     · criteria 이름이 그대로 그 도구 시트의 [평가] 열이 된다(교과마다 열이 달라지는 방법).
     자세한 규칙은 WORKPLAN-루브릭.md 3장. */
  var RUBRIC = null, rubricPromise = null;

  function loadRubric() {
    if (rubricPromise) return rubricPromise;
    var url;
    try { url = new URL('rubric.json', location.href).href; }
    catch (e) { rubricPromise = Promise.resolve(null); return rubricPromise; }
    rubricPromise = fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { RUBRIC = j || null; return RUBRIC; })
      .catch(function () { return null; });
    return rubricPromise;
  }

  function rateOf(p) {
    var total = Number(p.total) || 0, correct = Number(p.correct) || 0;
    return total > 0 ? Math.round(correct / total * 100) : null;
  }

  function measureVal(c, p, rate) {
    var m = c.measure || 'rate';
    if (m === 'score')    return p.score === undefined ? null : Number(p.score);
    if (m === 'progress') return p.progress === undefined ? null : Number(p.progress);
    return rate;
  }

  /* levels 는 min 내림차순(상 → 중 → 하). 값이 min 이상인 첫 단계를 쓴다. */
  function levelOf(c, v) {
    var ls = c.levels || [];
    for (var i = 0; i < ls.length; i++) if (v >= (Number(ls[i].min) || 0)) return ls[i];
    return ls.length ? ls[ls.length - 1] : null;
  }

  /* match.mode 가 있으면 그 활동에서 제출했을 때만 적용(부분일치, 배열 가능) */
  function matchesMode(c, p) {
    var m = c.match || {};
    if (!m.mode) return true;
    var mode = String(p.mode || ''), want = [].concat(m.mode);
    for (var i = 0; i < want.length; i++) if (mode.indexOf(want[i]) >= 0) return true;
    return false;
  }

  function judge(rb, p) {
    if (!rb || !rb.criteria || !rb.criteria.length) return null;
    var rate = rateOf(p), hits = [], cols = {};
    rb.criteria.forEach(function (c) {
      if (!matchesMode(c, p)) return;
      var v = measureVal(c, p, rate);
      if (v === null || v === undefined || isNaN(v)) return;
      var L = levelOf(c, v);
      if (!L) return;
      hits.push({ name: c.name, level: L.level, phrase: L.phrase, value: v,
                  observe: L.observe || c.observe || '' });
      cols['[평가] ' + c.name] = L.level;
    });
    if (!hits.length) return null;   // 이 제출에 맞는 평가요소가 없으면 공용 문장으로 되돌아간다

    var proc = [];
    (rb.process || []).forEach(function (q) {
      var w = q.when || {}, total = Number(p.total) || 0, sec = Number(p.durationSec) || 0;
      var perQ = (total > 0 && sec > 0) ? sec / total : null;
      if (w.retry !== undefined && !(Number(p.retry) >= Number(w.retry))) return;
      if (w.rateMin !== undefined && !(rate !== null && rate >= Number(w.rateMin))) return;
      if (w.durationPerQMin !== undefined && !(perQ !== null && perQ >= Number(w.durationPerQMin))) return;
      if (w.durationPerQMax !== undefined && !(perQ !== null && perQ <= Number(w.durationPerQMax))) return;
      if (q.phrase) proc.push(q.phrase);
    });

    /* 교사용 근거 — 숫자는 여기에만 남기고 생기부 문장에는 넣지 않는다 */
    var ev = [];
    if (p.mode) ev.push('활동 ' + p.mode);
    if (rate !== null) ev.push('정답률 ' + rate + '%(' + (Number(p.correct) || 0) + '/' + (Number(p.total) || 0) + ')');
    if (p.score !== undefined) ev.push('점수 ' + p.score);
    if (Number(p.retry) >= 2) ev.push('도전 ' + p.retry + '회');

    var levels = [];
    hits.forEach(function (h) { if (levels.indexOf(h.level) < 0) levels.push(h.level); });

    return {
      code: rb.code || '',
      hits: hits, process: proc, cols: cols,
      names: hits.map(function (h) { return h.name; }).join(' · '),
      level: levels.join('·'),
      evidence: ev.join(' · '),
      /* 세특은 시험 점수가 아니라 교사의 관찰 기록이다.
         제출 기록만으로는 초안까지가 한계이므로, 교사가 수업에서 무엇을 확인하면 되는지를 함께 보낸다. */
      observe: hits.map(function (h) { return h.observe; }).filter(Boolean).join(' · ')
    };
  }

  /* 문장 앞머리 주제 — 루브릭이 판정한 평가요소 이름을 쓴다.
     mode 문자열("도면읽기 선의종류")보다 교과 용어("선의 종류")가 세특에 어울린다. */
  function rubricTopic(rb, J, p) {
    return (J.hits[0] && J.hits[0].name) || topicOf(p.mode) || rb.subject || '';
  }

  function rubricKeywords(rb, J, p) {
    var topic = rubricTopic(rb, J, p);
    var k = [];
    if (topic) k.push(topic + ' 학습');
    J.hits.forEach(function (h) { if (h.phrase) k.push(h.phrase); });
    J.process.forEach(function (s) { k.push(s); });
    if (rb.competencies) k = k.concat([].concat(rb.competencies));
    return k.join(' · ');
  }

  function rubricDraft(rb, J, p) {
    var topic = rubricTopic(rb, J, p);
    var s = topic ? (topic + ' 학습 활동에 참여하여 ') : '수업 활동에 참여하여 ';
    var body = J.hits.map(function (h) { return h.phrase; }).filter(Boolean);
    s += body.join('. ');
    if (body.length) s += '. ';
    if (J.process.length) s += J.process.join('. ') + '. ';
    if (rb.competencies && rb.competencies.length)
      s += [].concat(rb.competencies).join('·') + ' 역량을 기름.';
    return s.replace(/\s{2,}/g, ' ').trim();
  }

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

  /* ── 제출 버튼 붙이기 (모든 학습도구 공용) ────────────────────────
     도구는 채점이 끝난 자리에서 한 줄만 부르면 된다.
       ResultCollector.attach(기준요소, function(){ return {score, correct, total, wrong, durationSec}; },
                              { mode: '종합시험', extra: ['도면 해독'] });
     · 제출 링크(?rc=)가 없어도 버튼은 보이고, 누르면 왜 안 되는지 알려준다.
     · 같은 모드를 몇 번째 푸는지(retry)를 세어 생기부 키워드에 넣는다. */
  var NL = String.fromCharCode(10);

  function hasEndpoint() { return !!CFG.endpoint; }

  function bumpTry(mode) {
    var k = 'rcTry_' + CFG.tool + '_' + (mode || '');
    var n = 0;
    try { n = parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) {}
    n += 1;
    try { localStorage.setItem(k, String(n)); } catch (e) {}
    return n;
  }

  function attach(anchor, getPayload, opts) {
    opts = opts || {};
    if (!anchor || !anchor.parentNode) return null;
    loadRubric();   // 제출 버튼이 보일 때 미리 읽어 둔다(없으면 조용히 넘어감)

    var id = opts.id || 'rcBtn';
    var old = document.getElementById(id);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var btn = document.createElement('button');
    btn.id = id;
    btn.className = opts.className || 'btn';
    btn.style.marginTop = '12px';
    btn.textContent = hasEndpoint() ? '🧑‍🏫 선생님께 결과 제출' : '🧑‍🏫 결과 제출';
    if (!hasEndpoint()) btn.style.opacity = '.65';

    btn.onclick = function () {
      if (!hasEndpoint()) {
        alert([
          '이 링크로는 제출이 되지 않아요.', '',
          '선생님이 나눠 준 제출용 링크(주소 뒤에 ?rc=... 가 붙은 링크)로',
          '들어와야 반·번호를 입력하고 결과를 보낼 수 있습니다.', '',
          '연습은 지금 이대로 계속 하셔도 됩니다.'
        ].join(NL));
        return;
      }
      var p = {};
      try { p = getPayload() || {}; } catch (e) { p = {}; }
      if (opts.mode && !p.mode) p.mode = opts.mode;
      if (opts.extra && !p.extra) p.extra = opts.extra;
      if (p.retry === undefined) p.retry = bumpTry(p.mode);
      if (p.tier === undefined && window.Rank && Rank.get) {
        try { p.tier = Rank.get().tier.full; } catch (e) {}
      }
      open(p);
    };

    if (anchor.after) anchor.after(btn);
    else anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    return btn;
  }

  function open(payload) {
    payload = payload || {};
    injectCss();
    loadRubric();   // attach 를 안 쓰고 open 을 직접 부르는 도구를 위해 여기서도 미리 읽는다

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

    // 결과 요약 미리보기 (labels로 도구별 용어 변경 가능. 예: 정답 → 완료 개수)
    var LB = payload.labels || {};
    var parts = [];
    if (payload.score !== undefined) parts.push(esc(LB.score || '점수') + ' <b>' + esc(payload.score) + '</b>');
    if (payload.correct !== undefined && payload.total !== undefined)
      parts.push(esc(LB.correct || '정답') + ' <b>' + esc(payload.correct) + '/' + esc(payload.total) + '</b>');
    if (payload.durationSec !== undefined)
      parts.push('소요 <b>' + Math.round(payload.durationSec) + '초</b>');
    var summary = parts.length ? '<div class="rc-summary">' + parts.join(' · ') + '</div>' : '';

    var memoField = '';

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
        memoField +
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
    var elMemo = ov.querySelector('#rc-memo');
    var elOk = ov.querySelector('#rc-ok');
    var elMsg = ov.querySelector('#rc-msg');
    if (elMemo) {
      var elCnt = ov.querySelector('#rc-cnt');
      elMemo.addEventListener('input', function () { if (elCnt) elCnt.textContent = elMemo.value.length; });
    }

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
      var memoV = elMemo ? (elMemo.value || '').trim() : '';

      if (CFG.askName && !nameV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '이름을 입력하세요.'; elName.focus(); return; }
      if (CFG.askGrade && !gradeV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '학년을 입력하세요.'; elGrade.focus(); return; }
      if (CFG.askDept && !deptV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '학과를 입력하세요.'; elDept.focus(); return; }
      if (!numV) { elMsg.className = 'rc-msg err'; elMsg.textContent = '번호를 입력하세요.'; elNum.focus(); return; }
      if (!CFG.endpoint) { elMsg.className = 'rc-msg err'; elMsg.textContent = '설정 오류: endpoint가 없습니다.'; return; }

      elOk.disabled = true;
      elMsg.className = 'rc-msg';
      elMsg.textContent = '전송 중…';

      loadRubric().then(function (rb) {
        var J = judge(rb, payload);   // 루브릭이 없거나 이 활동에 맞는 평가요소가 없으면 null

        var body = {
          tool: CFG.tool,
          cls: cls,
          num: numV,
          name: nameV,
          grade: gradeV,
          dept: deptV,
          mode: payload.mode,        // 어느 파트에서 제출했는지 (예: 선의 종류 — 오류 찾기)
          score: payload.score,
          correct: payload.correct,
          total: payload.total,
          wrong: payload.wrong,
          durationSec: payload.durationSec,
          retry: payload.retry,      // 같은 파트를 몇 번째 푸는지
          tier: payload.tier,        // 계급
          labels: payload.labels,   // 공통 열 이름 바꾸기(선택). 탭이 처음 만들어질 때만 반영
          // 루브릭 판정 — 없으면 빈 값이라 시트 열만 비어 있고 나머지는 그대로 동작한다
          code: J ? J.code : (rb && rb.code) || '',   // 구별 코드 (예: jedo.domyeon)
          criteria: J ? J.names : '',                 // 평가요소
          level: J ? J.level : '',                    // 성취수준 (상/중/하)
          evidence: J ? J.evidence : '',              // 수준 근거 (교사용, 숫자는 여기에만)
          observe: J ? J.observe : '',                // 관찰 포인트 (교사가 수업에서 확인할 것)
          cols: J ? J.cols : null,                    // 도구별 [평가] 열 → 수준
          // 생기부(세특) 작성용 — 학생 입력 없이 활동·성취·태도로 자동 생성
          keywords: J ? rubricKeywords(rb, J, payload) : autoKeywords(payload),
          draft: J ? rubricDraft(rb, J, payload) : autoDraft(payload),
          ua: navigator.userAgent,
          secret: CFG.secret
        };

        // Content-Type을 text/plain으로 보내 CORS preflight를 피함 (Apps Script 표준 패턴)
        return fetch(CFG.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body)
        });
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

  /* ── 검증용 미리보기 (제출하지 않고 결과만 본다) ──────────────
     콘솔에서:  ResultCollector.__preview({mode:'종합시험', correct:9, total:10, retry:2})
     → 평가요소·수준·시트에 들어갈 열·세특 문장을 그대로 보여 준다.
     루브릭을 새로 쓴 뒤 상·중·하 세 경우를 이걸로 확인한다(WORKPLAN-루브릭.md 7장). */
  function preview(payload) {
    payload = payload || {};
    return loadRubric().then(function (rb) {
      var J = judge(rb, payload);
      var r = {
        루브릭: rb ? (rb.code || '(code 없음)') + ' / ' + (rb.tool || '') : '없음 (공용 문장 사용)',
        평가요소: J ? J.names : '(해당 없음)',
        성취수준: J ? J.level : '',
        수준근거: J ? J.evidence : '',
        관찰포인트: J ? J.observe : '',
        시트열: J ? J.cols : {},
        키워드: J ? rubricKeywords(rb, J, payload) : autoKeywords(payload),
        세특문장: J ? rubricDraft(rb, J, payload) : autoDraft(payload)
      };
      try { console.log(r); } catch (e) {}
      return r;
    });
  }

  window.ResultCollector = {
    open: open, attach: attach, hasEndpoint: hasEndpoint, bumpTry: bumpTry, config: CFG,
    __preview: preview, __rubric: loadRubric
  };
})();
