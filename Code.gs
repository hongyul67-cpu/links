/****************************************************************
 *  통합 결과 수집 백엔드  (result-collector + 필기CBT + 3D프린터)
 *
 *  ★ 이 파일이 유일한 정본입니다. (다른 저장소의 사본은 2026-07 정리됨)
 *    - 위치: links 저장소 / Code.gs
 *    - 교사 배포용 안내(복사 버튼): https://hongyul67-cpu.github.io/links/guide.html
 *      guide.html 이 이 파일을 직접 읽어오므로, 여기만 고치면 안내에 자동 반영됩니다.
 *    - 사본을 다시 만들지 마세요. 내용이 갈라져 옛 버전이 배포되는 문제가 있었습니다.
 *
 *  스프레드시트 1개에 이 스크립트 1개만 배포하면,
 *  세 종류의 학습도구가 모두 이 /exec URL "하나"로 데이터를 보냅니다.
 *  (각 도구 코드는 전혀 바꾸지 않아도 됩니다 — 요청을 자동으로 구분해요.)
 *
 *  ── 배포 ─────────────────────────────────────────────
 *   1) 구글 스프레드시트 만들기 → 확장 프로그램 > Apps Script
 *   2) 이 코드 전체를 붙여넣고 저장
 *   3) 배포 > 새 배포 > 유형: 웹 앱
 *        실행 계정: 나 / 액세스 권한: 모든 사용자
 *   4) 나오는 /exec URL 을 아래 세 곳에 그대로 사용:
 *        · result-collector 도구(기초학력·도면읽기 등) → 공유링크의 ?rc= 값
 *        · 필기 CBT      → config.js 의 syncUrl
 *        · 3D프린터      → config.js 의 SYNC_URL
 *
 *  ── 자동 생성 탭 ────────────────────────────────────
 *    · (도구이름 탭)     : result-collector 제출 로그(기초학력·도면읽기 종합시험 …)
 *    · 학생현황 / 응시기록 : 필기 CBT (이어하기 + 회차기록)
 *    · progress          : 3D프린터 (이어하기)
 ****************************************************************/

var RC_SECRET = '';   // result-collector 암호(선택). 비우면 검사 안 함.

/* 이 코드의 판 번호. 선생님이 자기 /exec 주소를 브라우저에 그냥 열면
   "최신인지 옛 버전인지" 한눈에 보이게 하려고 둔다.
   → Code.gs 를 고칠 때마다 날짜를 올릴 것. guide.html 이 이 값을 읽어 비교한다. */
var CODE_VERSION = '2026-08-29';

/* ===================== 라우팅 ===================== */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.action === 'save')   return cbtSaveState(d);   // 필기 CBT 진도저장
    if (d.action === 'result') return cbtSaveResult(d);  // 필기 CBT 회차결과
    if (d.tool !== undefined)  return rcAppend(d);        // result-collector 제출
    return tdpSave(d);                                   // 3D프린터 진도저장
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'load') return out(cbtLoadState(p.cls, p.name), p.callback); // CBT 이어하기
  if (p.action === 'get')  return out(tdpGet(p.cls, p.name), p.callback);       // 3D 이어하기
  if (p.action === 'save') { tdpSave(p); return out({ ok: true }, p.callback); } // 3D GET 저장
  if (p.action === 'version' || p.callback) {
    return out({ ok: true, version: CODE_VERSION, rubric: true }, p.callback);
  }
  return statusPage();   // 주소를 그냥 열었을 때 — 사람이 읽는 확인 화면
}

/* 선생님이 자기 /exec 주소를 브라우저 주소창에 붙여넣고 열면 나오는 화면.
   "붙여넣기 → 저장 → 새 버전 배포" 를 제대로 했는지 이 화면 하나로 확인한다.
   (옛 버전이 배포돼 있으면 이 화면 대신 {"ok":true,"msg":"..."} 같은 글자만 보인다.) */
function statusPage() {
  var name = '';
  try { name = ss().getName(); } catch (e) {}
  var html =
    '<!doctype html><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font-family:system-ui,\'Malgun Gothic\',sans-serif;max-width:460px;margin:40px auto;' +
    'padding:26px;border-radius:16px;background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d;line-height:1.7">' +
    '<div style="font-size:44px;line-height:1">✅</div>' +
    '<h2 style="margin:6px 0 4px;font-size:20px">최신 코드가 배포되어 있어요</h2>' +
    '<p style="margin:0 0 16px;color:#3f6212;font-size:14px">이 주소를 학생 링크 만들 때 쓰시면 됩니다.</p>' +
    '<table style="width:100%;font-size:14px;border-collapse:collapse">' +
    '<tr><td style="padding:5px 0;color:#4d7c0f">판 번호</td><td style="text-align:right;font-weight:700">' + CODE_VERSION + '</td></tr>' +
    (name ? '<tr><td style="padding:5px 0;color:#4d7c0f">연결된 시트</td><td style="text-align:right;font-weight:700">' + name + '</td></tr>' : '') +
    '<tr><td style="padding:5px 0;color:#4d7c0f">생기부·루브릭 칸</td><td style="text-align:right;font-weight:700">준비됨</td></tr>' +
    '</table>' +
    '<p style="margin:16px 0 0;font-size:12.5px;color:#4d7c0f">' +
    '이 화면이 아니라 <b>{"ok":true …}</b> 같은 글자만 보이면 <b>옛 코드</b>가 배포된 것입니다 — 안내대로 다시 붙여넣고 <b>새 버전</b>으로 배포해 주세요.</p>' +
    '</div>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('결과수집 연결 확인')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ===================== 공통 유틸 ===================== */
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function keyOf(cls, name) { return (String(cls || '').trim()) + ' / ' + (String(name || '').trim()); }
function numOf(v) { var n = Number(v); return isNaN(n) ? '' : n; }

function sheetOf(name, headers) {
  var s = ss(), sh = s.getSheetByName(name);
  if (!sh) {
    sh = s.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}
function findRow(sh, k) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var col = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (col[i][0] === k) return i + 2;
  return -1;
}

/* ===================== ① result-collector ===================== */

/* 시트에 없는 열을 헤더 뒤에 만들어 준다.
   sheetOf 는 탭이 "처음 생길 때"만 헤더를 쓰기 때문에, 도구가 새 열(예: [평가] 선의 종류)을
   보내오면 이 함수가 없으면 값이 조용히 사라진다. */
function ensureHeaders(sh, names) {
  var lastCol = sh.getLastColumn();
  var head = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var add = [];
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (n && head.indexOf(n) < 0 && add.indexOf(n) < 0) add.push(n);
  }
  if (add.length) {
    sh.getRange(1, head.length + 1, 1, add.length).setValues([add]).setFontWeight('bold');
    head = head.concat(add);
  }
  return head;
}

/* {열이름: 값} 으로 받아 헤더 순서에 맞춰 한 줄 추가한다.
   값을 순서대로 밀어 넣으면 도구마다 열이 다를 때 자리가 어긋난다. */
function appendByHeader(sh, obj) {
  var keys = [];
  for (var k in obj) if (obj.hasOwnProperty(k)) keys.push(k);
  var head = ensureHeaders(sh, keys);
  var row = [];
  for (var i = 0; i < head.length; i++) {
    var v = obj[head[i]];
    row.push(v === undefined || v === null ? '' : v);
  }
  sh.appendRow(row);
}

function rcAppend(d) {
  if (RC_SECRET && d.secret !== RC_SECRET) return out({ ok: false, error: 'unauthorized' });
  var toolName = String(d.tool || '기타').slice(0, 60);
  // 도구가 labels를 보내면 그 용어로 공통 열 이름을 만듦 (예: 블록뷰 → 정답수=완료 개수)
  var L = d.labels || {};
  var H = {
    time: '제출시각', cls: '반', num: '번호', name: '이름', grade: '학년', dept: '학과',
    mode: '활동(파트)',
    score: L.score || '점수', correct: L.correct || '정답수',
    total: L.total || '총문항', rate: L.rate || '정답률(%)', wrong: L.wrong || '틀린 문제'
  };
  var base = [H.time, H.cls, H.num, H.name, H.grade, H.dept, H.mode,
              H.score, H.correct, H.total, H.rate, H.wrong,
              '소요(초)', '도전 횟수', '계급', '기기',
              '평가요소', '성취수준', '수준 근거',
              '활동 키워드(생기부용)', '세특 문장(초안)',
              '관찰 포인트(수업에서 확인)', '관찰 메모(교사 입력)',
              '자기평가(학생)', '자기기록(학생)', '자기평가 비교', '재도전', '도구코드'];
  var sh = sheetOf(toolName, base);
  ensureHeaders(sh, base);        // 예전에 만들어진 탭에도 새 열을 만들어 준다

  var correct = numOf(d.correct), total = numOf(d.total);
  var rate = (total !== '' && total > 0) ? Math.round((correct / total) * 100) : '';

  var row = {};
  row[H.time]    = new Date();
  row[H.cls]     = d.cls || '';
  row[H.num]     = d.num || '';
  row[H.name]    = d.name || '';
  row[H.grade]   = d.grade || '';
  row[H.dept]    = d.dept || '';
  row[H.mode]    = String(d.mode || '').slice(0, 80);
  row[H.score]   = d.score === undefined ? '' : d.score;
  row[H.correct] = correct;
  row[H.total]   = total;
  row[H.rate]    = rate;
  row[H.wrong]   = Array.isArray(d.wrong) ? d.wrong.join(' / ') : (d.wrong || '');
  row['소요(초)']  = d.durationSec === undefined ? '' : d.durationSec;
  row['도전 횟수'] = d.retry === undefined ? '' : d.retry;
  row['계급']      = String(d.tier || '');
  row['기기']      = String(d.ua || '').slice(0, 60);
  row['평가요소']  = String(d.criteria || '').slice(0, 200);
  row['성취수준']  = String(d.level || '').slice(0, 40);
  row['수준 근거'] = String(d.evidence || '').slice(0, 200);
  row['활동 키워드(생기부용)'] = String(d.keywords || '').slice(0, 300);
  row['세특 문장(초안)']       = String(d.draft || '').slice(0, 500);
  // 세특은 관찰 기록이다. 제출 기록은 초안까지이고, 교사가 수업에서 본 것을 옆 칸에 적어 확정한다.
  row['관찰 포인트(수업에서 확인)'] = String(d.observe || '').slice(0, 300);
  row['관찰 메모(교사 입력)']       = '';
  // 자기평가 — 학생이 스스로 매긴 수준과, 판정과의 차이(일치 / 높게 봄 / 낮게 봄)
  row['자기평가(학생)'] = String(d.self || '').slice(0, 10);
  row['자기기록(학생)'] = String(d.selfNote || '').slice(0, 100);   // 참고용 — 세특에 그대로 옮기지 말 것
  row['자기평가 비교']  = String(d.selfGap || '').slice(0, 20);
  row['재도전']         = String(d.retryNote || '').slice(0, 20);
  row['도구코드']  = String(d.code || '').slice(0, 40);

  // 도구별 평가 열 — 루브릭의 평가요소마다 "[평가] 이름" 열이 생기고 수준(상/중/하)이 들어간다.
  // 교과마다 열이 달라지는 곳이 여기다. 도구가 늘어나도 이 코드는 고치지 않는다.
  var cols = d.cols || {};
  for (var k in cols) if (cols.hasOwnProperty(k)) row[String(k).slice(0, 60)] = cols[k];

  appendByHeader(sh, row);
  return out({ ok: true });
}

/* ===================== ② 필기 CBT ===================== */
function cbtStudents() {
  return sheetOf('학생현황',
    ['학생키', '반', '이름', '정답률(%)', '푼문항', '맞힘', '오답수', 'CBT응시', '마지막접속', '상태(JSON)']);
}
function cbtSaveState(d) {
  var sh = cbtStudents(), k = keyOf(d.cls, d.name);
  var stat = d.stat || { solved: 0, correct: 0, exams: 0 };
  var wrong = d.wrong || [];
  var acc = stat.solved ? Math.round(stat.correct / stat.solved * 100) : 0;
  var stateJson = JSON.stringify({ wrong: wrong, stat: stat });
  var r = findRow(sh, k);
  if (r < 0) {
    sh.appendRow([k, d.cls || '', d.name || '', acc, stat.solved || 0, stat.correct || 0,
      wrong.length, 0, new Date(), stateJson]);
  } else {
    var cbt = sh.getRange(r, 8).getValue() || 0;
    sh.getRange(r, 1, 1, 10).setValues([[k, d.cls || '', d.name || '', acc,
      stat.solved || 0, stat.correct || 0, wrong.length, cbt, new Date(), stateJson]]);
  }
  return out({ ok: true });
}
function cbtSaveResult(d) {
  var log = sheetOf('응시기록', ['시각', '반', '이름', '회차', '점수', '맞힘', '총문항']);
  log.appendRow([new Date(), d.cls || '', d.name || '', d.exam || '', d.score, d.correct, d.total]);
  var sh = cbtStudents(), k = keyOf(d.cls, d.name), r = findRow(sh, k);
  if (r < 0) {
    sh.appendRow([k, d.cls || '', d.name || '', 0, 0, 0, 0, 1, new Date(), '{}']);
  } else {
    var c = sh.getRange(r, 8).getValue() || 0;
    sh.getRange(r, 8).setValue(c + 1);
    sh.getRange(r, 9).setValue(new Date());
  }
  return out({ ok: true });
}
function cbtLoadState(cls, name) {
  var sh = cbtStudents(), k = keyOf(cls, name), r = findRow(sh, k);
  if (r < 0) return { ok: true, found: false };
  var st = {};
  try { st = JSON.parse(sh.getRange(r, 10).getValue() || '{}'); } catch (e) {}
  return { ok: true, found: true, wrong: st.wrong || [], stat: st.stat || null };
}

/* ===================== ③ 3D프린터 ===================== */
var TDP_SHEET = 'progress';
var TDP_HEADERS = ['반', '이름', '점수', '개념익힘', '푼문제', '정답', '오답', '문제진도(%)', '마지막접속', '상태(JSON)'];
function tdpFindRow(sh, cls, name) {
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(cls) && String(data[i][1]) === String(name)) return i + 1;
  }
  return -1;
}
function tdpSave(p) {
  var name = String(p.name || '');
  if (!name) return out({ ok: true, skipped: 'no name' });
  var sh = sheetOf(TDP_SHEET, TDP_HEADERS);
  var cls = String(p.cls || '');
  var row = [cls, name, p.score || 0, p.known || 0, p.seen || 0, p.ok || 0, p.wrong || 0, p.pct || 0, new Date(), p.state || ''];
  var r = tdpFindRow(sh, cls, name);
  if (r > 0) sh.getRange(r, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return out({ ok: true });
}
function tdpGet(cls, name) {
  var sh = sheetOf(TDP_SHEET, TDP_HEADERS);
  var r = tdpFindRow(sh, cls || '', name || '');
  if (r > 0) {
    var v = sh.getRange(r, 1, 1, TDP_HEADERS.length).getValues()[0];
    return { ok: true, found: true, state: v[9] || '', score: v[2] };
  }
  return { ok: true, found: false };
}

/* ===================== 응답(JSON / JSONP) ===================== */
function out(obj, callback) {
  var s = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + s + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}
