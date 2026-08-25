/* =========================================================================
 * 다니랜드 - 효과음
 * 소리 파일 없이 브라우저가 직접 음을 만들어 냅니다.
 * ========================================================================= */

(function () {
  var ctx = null;

  function audio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* 무시 */ } }
    return ctx;
  }

  function tone(freq, delay, duration, type, volume) {
    var ac = audio();
    if (!ac) return;
    var t0 = ac.currentTime + delay;
    var osc = ac.createOscillator();
    var gain = ac.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume || 0.18, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  window.SFX = {
    unlock: function () { audio(); },

    tap: function () {
      tone(520, 0, 0.08, 'triangle', 0.10);
    },

    correct: function () {
      tone(784, 0,    0.16, 'triangle', 0.16); // 솔
      tone(988, 0.10, 0.16, 'triangle', 0.16); // 시
      tone(1319, 0.20, 0.30, 'triangle', 0.16); // 높은 미
    },

    wrong: function () {
      tone(300, 0,    0.14, 'sine', 0.12);
      tone(220, 0.12, 0.22, 'sine', 0.12);
    },

    finish: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(f, i * 0.14, 0.30, 'triangle', 0.16);
      });
    }
  };
})();
