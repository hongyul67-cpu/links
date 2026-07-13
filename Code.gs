/****************************************************************
 *  통합 결과 수집 백엔드  (result-collector + 필기CBT + 3D프린터)
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
  return out({ ok: true, msg: 'unified collector alive' }, p.callback);
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
function rcAppend(d) {
  if (RC_SECRET && d.secret !== RC_SECRET) return out({ ok: false, error: 'unauthorized' });
  var toolName = String(d.tool || '기타').slice(0, 60);
  var sh = sheetOf(toolName,
    ['제출시각', '반', '번호', '이름', '학년', '학과', '점수', '정답수', '총문항', '정답률(%)', '오답번호', '소요(초)', '기기']);
  var correct = numOf(d.correct), total = numOf(d.total);
  var rate = (total !== '' && total > 0) ? Math.round((correct / total) * 100) : '';
  sh.appendRow([
    new Date(), d.cls || '', d.num || '', d.name || '', d.grade || '', d.dept || '',
    d.score === undefined ? '' : d.score,
    correct, total, rate,
    Array.isArray(d.wrong) ? d.wrong.join(', ') : (d.wrong || ''),
    d.durationSec === undefined ? '' : d.durationSec,
    String(d.ua || '').slice(0, 60)
  ]);
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
