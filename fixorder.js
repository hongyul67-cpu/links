/* ══════════════════════════════════════════════════════════════
   fixorder.js — 수업용 「모두 같은 문제」

   붙이는 법:  <script src="https://hongyul67-cpu.github.io/links/fixorder.js"></script>
               (다른 공용 스크립트보다 먼저, 되도록 <head> 나 <body> 첫머리에)

   ▸ 왜 있나
     문제풀이 도구는 대부분 문제은행에서 무작위로 뽑고 보기 순서도 섞는다.
     혼자 복습할 때는 그게 맞지만, 수업 중에는 학생마다 다른 문제가 나와서
     "3번 문제 2번 보기 보세요" 가 통하지 않는다.

   ▸ 어떻게 하나
     주소에 ?fix=1 이 있으면 Math.random 을 「시드 고정 난수」로 바꾼다.
     도구들은 저마다 shuffle() 안에서 Math.random 을 부르므로,
     도구 코드를 한 줄도 고치지 않아도 모든 기기가 같은 순서를 받는다.

   ▸ 시드
     ?fix=1        → 그날 날짜(YYYYMMDD) + 도구 주소.
                     같은 날에는 모두 같은 문제, 다음 수업에는 자동으로 다른 문제.
     ?fix=<숫자>   → 그 숫자를 그대로 시드로 쓴다(반별로 다르게 주고 싶을 때).
     ?fix 가 없으면 → 아무것도 하지 않는다. 지금까지와 똑같이 무작위.

   ▸ 날짜는 기기의 로컬 날짜다
     자정을 넘겨 푸는 학생이 있으면 그 학생만 다른 문제를 받는다.
     그럴 일이 있는 수업이면 ?fix=<숫자> 로 값을 직접 주면 된다.

   ▸ 연출용 난수도 함께 고정된다
     파티클·흔들림 같은 것도 매번 같은 모양이 된다. 보기에 문제는 없다.

   ▸ window.FixOrder
     .on      — 지금 고정 상태인가
     .seed    — 쓰고 있는 시드
     .reshuffle() — 같은 페이지에서 다음 판부터 다른 순서를 쓰고 싶을 때
     .off()   — 원래 Math.random 으로 되돌린다
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  if (global.FixOrder) return;                    /* 두 번 붙어도 한 번만 */

  var NATIVE = Math.random;                       /* 원래 것을 보관 */

  function param() {
    try {
      return new URLSearchParams(location.search).get('fix');
    } catch (e) {
      return null;
    }
  }

  /* 문자열 → 32비트 정수 (같은 글자면 늘 같은 값) */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function todayKey() {
    var d = new Date();
    return '' + d.getFullYear() +
      ('0' + (d.getMonth() + 1)).slice(-2) +
      ('0' + d.getDate()).slice(-2);
  }

  /* mulberry32 — 짧고 고른 시드 난수. 같은 시드면 늘 같은 수열이 나온다. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var API = {
    on: false,
    seed: 0,
    reshuffle: function () {
      if (!API.on) return;
      API.seed = (API.seed + 0x9E3779B9) >>> 0;
      Math.random = mulberry32(API.seed);
    },
    off: function () {
      Math.random = NATIVE;
      API.on = false;
    }
  };

  /* 그냥 "켜기"를 뜻하는 값들. 허브가 붙이는 것은 fix=1 이다. */
  var ON = { '1': 1, 'on': 1, 'yes': 1, 'true': 1 };

  var v = param();
  if (v !== null && v !== '' && v !== '0') {
    var seed;
    if (ON[String(v).toLowerCase()]) {
      /* 날짜 + 도구 주소. 같은 날엔 모두 같은 문제, 다음 수업엔 자동으로 다른 문제.
         주소를 섞는 이유 — 같은 날 여러 도구를 써도 도구마다 다른 순서가 되게. */
      seed = hash(todayKey() + '|' + location.host + location.pathname);
    } else if (/^\d+$/.test(v)) {
      seed = parseInt(v, 10) >>> 0;      /* 값을 직접 준 경우 (반별로 다르게 줄 때) */
    } else {
      seed = hash(String(v));            /* 글자를 준 경우도 시드로 받아 준다 */
    }
    API.seed = seed >>> 0;
    Math.random = mulberry32(API.seed);
    API.on = true;
  }

  global.FixOrder = API;
})(window);
