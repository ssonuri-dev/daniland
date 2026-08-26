/* =========================================================================
 * 다니랜드 - 풍선 터뜨리기
 *
 * 아래에서 올라오는 풍선을 눌러 터뜨립니다.
 * 놓친 풍선은 그냥 하늘로 올라가 사라집니다 — 틀렸다고 혼내지 않습니다.
 *
 * 한 판에 풍선 10개 (게임 화면·수학 놀이와 같은 수).
 * ========================================================================= */

(function () {
  var TOTAL = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 터뜨렸어요!'];

  var COLORS = [
    '#ff3b30', '#ff9500', '#ffd60a', '#34c759',
    '#00c7be', '#0a84ff', '#af52de', '#ff5fa2'
  ];

  var LEVELS = [
    { value: 'slow', text: '천천히<br>🐢', rise: 8.0, gap: 1700 },
    { value: 'fast', text: '보통<br>🐇',   rise: 5.5, gap: 1100 }
  ];

  var BALLOON_W = 76;

  var el = {
    field: document.getElementById('field'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    homeBtn: document.getElementById('homeBtn'),

    startOverlay: document.getElementById('startOverlay'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),
    levelRow: document.getElementById('levelRow'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endHome: document.getElementById('endHome')
  };

  var state = {
    speed: UI.loadValue('daniland.balloonSpeed') || 'slow',
    spawned: 0,   // 지금까지 띄운 풍선 수
    done: 0,      // 터졌거나 날아가 버린 풍선 수
    stars: 0,
    running: false
  };

  var timer = null;

  buildLevelRow();
  fit();

  el.startBtn.addEventListener('click', function () {
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  // 🏠 는 언제나 홈으로, '뒤로' 는 이 놀이가 들어 있는 과목 페이지로 갑니다.
  bindGo(el.homeBtn, 'index.html');
  bindGo(el.startHome, 'subject.html?name=' + encodeURIComponent('놀이'));
  bindGo(el.endHome, 'subject.html?name=' + encodeURIComponent('놀이'));

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () { window.location.href = href; });
  }

  function level() {
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].value === state.speed) return LEVELS[i];
    }
    return LEVELS[0];
  }

  function buildLevelRow() {
    el.levelRow.innerHTML = '';

    LEVELS.forEach(function (lv) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (lv.value === state.speed ? ' on' : '');
      b.innerHTML = lv.text;
      b.addEventListener('click', function () {
        state.speed = lv.value;
        UI.saveValue('daniland.balloonSpeed', lv.value);
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 한 판 ---------- */

  function startGame() {
    clearTimeout(timer);
    el.field.innerHTML = '';

    state.spawned = 0;
    state.done = 0;
    state.stars = 0;
    state.running = true;

    el.bar.style.width = '0%';
    updateScore();
    fit();

    spawnNext();
  }

  function spawnNext() {
    if (!state.running || state.spawned >= TOTAL) return;

    state.spawned += 1;
    makeBalloon();

    if (state.spawned < TOTAL) {
      timer = setTimeout(spawnNext, level().gap);
    }
  }

  function makeBalloon() {
    var lv = level();
    var width = el.field.clientWidth;

    var balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.style.left = UI.randInt(8, Math.max(8, width - BALLOON_W - 8)) + 'px';
    // 화면 아래에서 시작해 위로 완전히 빠져나갈 만큼 올라갑니다.
    balloon.style.setProperty('--rise', (el.field.clientHeight + 300) + 'px');
    balloon.style.animationDuration = lv.rise + 's';

    var sway = document.createElement('div');
    sway.className = 'sway';

    var body = document.createElement('div');
    body.className = 'body';
    body.style.background = COLORS[UI.randInt(0, COLORS.length - 1)];

    var string = document.createElement('div');
    string.className = 'string';

    sway.appendChild(body);
    sway.appendChild(string);
    balloon.appendChild(sway);

    balloon.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      popBalloon(balloon);
    });

    // 위로 다 올라가면(애니메이션 끝) 놓친 것으로 칩니다.
    balloon.addEventListener('animationend', function () { escapeBalloon(balloon); });

    el.field.appendChild(balloon);
  }

  // 한 풍선은 터지거나 날아가거나 둘 중 하나만 — 두 번 세지 않게 막습니다.
  function settle(balloon) {
    if (balloon.dataset.done) return true;
    balloon.dataset.done = '1';
    return false;
  }

  function popBalloon(balloon) {
    if (settle(balloon)) return;

    if (window.SFX) SFX.pop();
    UI.confettiAt(balloon);

    state.stars += 1;
    updateScore();

    balloon.classList.add('popped');
    setTimeout(function () { balloon.remove(); }, 300);

    step();
  }

  function escapeBalloon(balloon) {
    if (settle(balloon)) return;
    balloon.remove();
    step();
  }

  function step() {
    state.done += 1;
    el.bar.style.width = Math.round((state.done / TOTAL) * 100) + '%';
    if (state.done >= TOTAL) finish();
  }

  function finish() {
    state.running = false;
    clearTimeout(timer);

    el.bar.style.width = '100%';
    UI.saveBest('daniland.best.balloon', state.stars, TOTAL);

    el.endStars.textContent = UI.starLine(state.stars, TOTAL);
    el.endTitle.textContent = (state.stars === TOTAL)
      ? PRAISE[UI.randInt(0, PRAISE.length - 1)]
      : '잘했어요!';
    el.endText.textContent = TOTAL + '개 중에 ' + state.stars + '개를 터뜨렸어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }

  /* ---------- 화면에 맞추기 ----------
   * 놀이판이 스크롤 없이 한 화면에 들어오게 합니다.
   * (게임 화면의 fitBoard() 와 같은 규칙)
   * -------------------------------------------------------------------- */

  function px(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function fit() {
    var top = el.field.getBoundingClientRect().top;
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var wrapEl = document.querySelector('.wrap');
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;

    el.field.style.height = Math.max(260, screenH - top - bottomPad - 6) + 'px';
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });
})();
