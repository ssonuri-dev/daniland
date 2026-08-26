/* =========================================================================
 * 다니랜드 - 실로폰
 *
 * 소리 파일 없이 브라우저가 직접 음을 만들어 냅니다.
 * js/sfx.js 와 방식은 같지만, 실로폰은 '땅' 하고 울리다 잦아드는 소리라
 * 기음에 3배음을 겹치는 전용 소리를 씁니다. (sfx.js 의 tone() 은 밖으로
 * 내보내지 않았고, 효과음용 envelope 라 그대로 쓰면 소리가 밋밋합니다)
 *
 * 손가락·마우스·펜 모두 되고, 쭉 쓸면 지나가는 건반이 차례로 울립니다.
 * ========================================================================= */

(function () {
  // 도 레 미 파 솔 라 시 도 (C4 ~ C5)
  var KEYS = [
    { note: '도', freq: 261.63, color: '#ff3b30' },
    { note: '레', freq: 293.66, color: '#ff9500' },
    { note: '미', freq: 329.63, color: '#ffd60a' },
    { note: '파', freq: 349.23, color: '#34c759' },
    { note: '솔', freq: 392.00, color: '#00c7be' },
    { note: '라', freq: 440.00, color: '#0a84ff' },
    { note: '시', freq: 493.88, color: '#4a5fd8' },
    { note: '도', freq: 523.25, color: '#af52de' }
  ];

  var box = document.getElementById('xylo');
  var bars = [];

  /* ---------- 소리 ---------- */

  var ctx = null;

  function audio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    // 폰에서는 화면을 처음 누를 때까지 소리가 잠겨 있습니다.
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* 무시 */ } }
    return ctx;
  }

  // 소리 한 겹 (기음 · 배음 · 채로 때리는 소리를 각각 이걸로 만듭니다)
  function partial(ac, freq, type, volume, duration) {
    var t0 = ac.currentTime;
    var osc = ac.createOscillator();
    var gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    // 때리는 순간 확 커졌다가 천천히 잦아듭니다.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  function strike(index) {
    var ac = audio();
    if (!ac) return;

    var freq = KEYS[index].freq;
    // 낮은 음일수록 길게 울립니다.
    var ring = 1.15 - index * 0.05;

    partial(ac, freq,       'sine',     0.30,  ring);        // 기음
    partial(ac, freq * 3,   'sine',     0.085, ring * 0.45); // 3배음 — 실로폰 특유의 맑은 울림
    partial(ac, freq * 6.4, 'triangle', 0.030, 0.09);        // 채로 때리는 순간의 '탁'
  }

  /* ---------- 건반 만들기 ---------- */

  KEYS.forEach(function (key, i) {
    var bar = document.createElement('div');
    bar.className = 'xylo-bar';
    bar.dataset.index = i;
    bar.style.background = key.color;
    // 높은 음일수록 짧습니다 (진짜 실로폰처럼)
    bar.style.height = (100 - i * 4.5) + '%';

    var note = document.createElement('div');
    note.className = 'note';
    note.textContent = key.note;
    bar.appendChild(note);

    box.appendChild(bar);
    bars.push(bar);
  });

  function hit(index) {
    var bar = bars[index];
    if (!bar) return;

    strike(index);

    // 연달아 같은 건반을 쳐도 애니메이션이 다시 시작되게 합니다.
    bar.classList.remove('hit');
    void bar.offsetWidth;
    bar.classList.add('hit');
  }

  /* ---------- 손가락·마우스·펜 ---------- */

  // 누르고 있는 손가락마다 '마지막으로 친 건반'을 기억해 두었다가,
  // 다른 건반으로 넘어가는 순간에만 소리를 냅니다. (쓸면 차례로 울림)
  var pressing = {};

  function barAt(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return -1;
    var bar = el.closest ? el.closest('.xylo-bar') : null;
    return bar ? parseInt(bar.dataset.index, 10) : -1;
  }

  box.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    try { box.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }

    var i = barAt(e.clientX, e.clientY);
    pressing[e.pointerId] = i;
    if (i >= 0) hit(i);
  });

  box.addEventListener('pointermove', function (e) {
    if (!(e.pointerId in pressing)) return;

    var i = barAt(e.clientX, e.clientY);
    if (i >= 0 && i !== pressing[e.pointerId]) {
      pressing[e.pointerId] = i;
      hit(i);
    }
  });

  function release(e) { delete pressing[e.pointerId]; }

  box.addEventListener('pointerup', release);
  box.addEventListener('pointercancel', release);

  // PC 에서는 숫자키 1~8 로도 칩니다.
  document.addEventListener('keydown', function (e) {
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= KEYS.length) hit(n - 1);
  });

  document.getElementById('homeBtn').addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  /* ---------- 화면에 맞추기 ----------
   * 건반이 스크롤 없이 한 화면에 들어오도록 높이를 정합니다.
   * (게임 화면의 fitBoard() 와 같은 규칙)
   * -------------------------------------------------------------------- */

  function px(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function outerHeight(node) {
    if (!node || !node.offsetHeight) return 0;
    var cs = getComputedStyle(node);
    return node.offsetHeight + px(cs.marginTop) + px(cs.marginBottom);
  }

  function fit() {
    var top = box.getBoundingClientRect().top;
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var wrapEl = document.querySelector('.wrap');
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var left = screenH - top - outerHeight(document.getElementById('hint')) - bottomPad - 6;

    box.style.height = Math.max(220, left) + 'px';
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });
})();
