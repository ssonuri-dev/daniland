/* =========================================================================
 * 다니랜드 - 여러 페이지가 함께 쓰는 도우미
 * ========================================================================= */

(function () {
  var CONFETTI = ['⭐', '🎉', '💖', '✨', '🌟', '🐾'];

  // 👩‍🏫 처럼 부호 여러 개가 합쳐진 이모지를 한 글자로 세어 주는 도구
  var segmenter = (window.Intl && Intl.Segmenter)
    ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
    : null;

  window.UI = {

    // 배열 섞기
    shuffle: function (arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },

    // 1 ~ max 사이의 정수
    randInt: function (min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
    },

    // 이모지 개수 세기
    // 👩‍🏫 🧑‍🚒 처럼 부호 여러 개가 합쳐진 이모지도 '한 개' 로 셉니다.
    // (그냥 세면 세 개로 잡혀서 그림이 작게 나옵니다)
    countEmoji: function (text) {
      if (!text) return 0;
      if (segmenter) return Array.from(segmenter.segment(String(text))).length;

      // Intl.Segmenter 가 없는 옛 브라우저용
      var chars = Array.from(String(text));
      var n = 0, joined = false;
      for (var i = 0; i < chars.length; i++) {
        var cp = chars[i].codePointAt(0);
        if (cp === 0xFE0F || cp === 0x20E3) continue;      // 모양·키캡 지정 부호
        if (cp >= 0x1F3FB && cp <= 0x1F3FF) continue;      // 피부색 부호
        if (cp === 0x200D) { joined = true; continue; }    // 이어 붙이는 부호
        if (joined) { joined = false; continue; }          // 이어 붙인 뒷 글자
        n++;
      }
      return n;
    },

    // 이모지 개수에 따라 글자 크기를 줄여 주는 클래스
    sizeClass: function (emoji) {
      var n = UI.countEmoji(emoji);
      if (n >= 9) return 'n-9';
      if (n >= 6) return 'n-6';
      if (n >= 4) return 'n-4';
      if (n >= 2) return 'n-2';
      return '';
    },

    // 주소의 ?이름=값 읽기
    getParam: function (name) {
      var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    },

    // 카드 위에 ⭕ 같은 표시 달기
    addMark: function (card, text) {
      if (card.querySelector('.mark')) return;
      var m = document.createElement('div');
      m.className = 'mark';
      m.textContent = text;
      card.appendChild(m);
    },

    // 정답을 맞혔을 때 터지는 폭죽
    confettiAt: function (card) {
      var box = card.getBoundingClientRect();
      var cx = box.left + box.width / 2;
      var cy = box.top + box.height / 2;

      for (var i = 0; i < 14; i++) {
        var s = document.createElement('div');
        s.className = 'confetti';
        s.textContent = CONFETTI[i % CONFETTI.length];
        s.style.left = cx + 'px';
        s.style.top = cy + 'px';
        s.style.setProperty('--dx', (Math.random() * 260 - 130).toFixed(0) + 'px');
        s.style.setProperty('--dy', (-Math.random() * 200 - 60).toFixed(0) + 'px');
        s.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
        document.body.appendChild(s);
        (function (node) { setTimeout(function () { node.remove(); }, 1100); })(s);
      }
    },

    // ⭐⭐⭐☆☆
    starLine: function (stars, total) {
      var out = '';
      for (var i = 0; i < total; i++) out += (i < stars ? '⭐' : '☆');
      return out;
    },

    /* ---------- 이 기기에 저장하기 ---------- */

    loadValue: function (key) {
      try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
    },

    saveValue: function (key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ }
    },

    // 최고 기록은 더 잘한 경우에만 덮어씁니다.
    saveBest: function (key, stars, total) {
      try {
        var raw = localStorage.getItem(key);
        var prev = raw ? JSON.parse(raw) : null;
        if (!prev || stars > prev.stars) {
          localStorage.setItem(key, JSON.stringify({ stars: stars, total: total }));
        }
      } catch (e) { /* 무시 */ }
    },

    readBest: function (key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return null;
        var v = JSON.parse(raw);
        if (typeof v.stars !== 'number' || typeof v.total !== 'number' || !v.total) return null;
        return v;
      } catch (e) {
        return null;
      }
    }
  };
})();
