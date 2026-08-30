/* =========================================================================
 * 다니랜드 - 풍선 터뜨리기
 *
 * 아래에서 올라오는 풍선을 눌러 터뜨립니다.
 *
 * 한 단계를 끝내면 다음 단계가 열리고, 단계가 올라갈수록 풍선이 많아지고 더 빨리 올라옵니다.
 * 시작 화면에서는 '지금까지 간 최고 단계' 까지 중에 시작할 단계를 고를 수 있습니다
 * (늘 1단계부터 하면 앞부분이 지루하다고 해서 넣었습니다).
 * 놓친 풍선 하나에 하트 한 개가 사라지고, 하트 5개가 다 없어지면 게임 끝입니다.
 * ========================================================================= */

(function () {
  var LIVES = 5;

  // 단계마다 풍선이 3개씩 늘고, 더 빨리 · 더 촘촘하게 올라옵니다.
  var FIRST_COUNT = 12;
  var COUNT_STEP = 3;

  function levelCount(n) { return FIRST_COUNT + COUNT_STEP * (n - 1); }  // 그 단계의 풍선 수
  function levelRise(n) { return Math.max(2.0, 6.0 - 0.75 * (n - 1)); }  // 다 올라가는 데 걸리는 초
  function levelGap(n) { return Math.max(450, 1400 - 160 * (n - 1)); }   // 다음 풍선까지 ms

  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!'];

  var COLORS = [
    '#ff3b30', '#ff9500', '#ffd60a', '#34c759',
    '#00c7be', '#0a84ff', '#af52de', '#ff5fa2'
  ];

  var BALLOON_W = 76;
  // 예전 판(10개 한 판)의 기록과 뜻이 달라 이름을 새로 씁니다.
  var BEST_KEY = 'daniland.best.balloon.level';
  var START_KEY = 'daniland.balloonStart';

  var el = {
    field: document.getElementById('field'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    levelChip: document.getElementById('levelChip'),
    lives: document.getElementById('lives'),
    banner: document.getElementById('banner'),
    homeBtn: document.getElementById('homeBtn'),

    startOverlay: document.getElementById('startOverlay'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),
    startPick: document.getElementById('startPick'),
    levelRow: document.getElementById('levelRow'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endHome: document.getElementById('endHome')
  };

  var state = {
    startLevel: parseInt(UI.loadValue(START_KEY), 10) || 1,  // 시작 화면에서 고른 단계
    level: 1,
    count: 0,     // 이 단계의 풍선 수
    spawned: 0,   // 이 단계에서 지금까지 띄운 풍선 수
    settled: 0,   // 이 단계에서 터졌거나 날아가 버린 풍선 수
    popped: 0,    // 한 판 통틀어 터뜨린 풍선 수 (⭐)
    lives: LIVES,
    running: false
  };

  var timer = null;       // 다음 풍선 띄우기
  var bannerTimer = null; // 단계 안내를 띄워 두는 시간

  buildStartRow();
  fit();

  el.startBtn.addEventListener('click', function () {
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    startRun();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startRun();
  });

  // 🏠 는 언제나 홈으로, '뒤로' 는 이 놀이가 들어 있는 과목 페이지로 갑니다.
  bindGo(el.homeBtn, 'index.html');
  bindGo(el.startHome, 'subject.html?name=' + encodeURIComponent('놀이'));
  bindGo(el.endHome, 'subject.html?name=' + encodeURIComponent('놀이'));

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () { window.location.href = href; });
  }

  /* ---------- 시작 단계 고르기 ----------
   * 지금까지 간 최고 단계까지만 고를 수 있습니다 (1단계 · 중간 · 최고, 최대 세 개).
   * -------------------------------------------------------------------- */

  function startChoices() {
    var best = UI.readBest(BEST_KEY);
    var top = best ? best.stars : 1;
    if (top < 1) top = 1;

    var out = [];
    [1, Math.round((1 + top) / 2), top].forEach(function (n) {
      if (out.indexOf(n) < 0) out.push(n);
    });
    return out;
  }

  function buildStartRow() {
    var choices = startChoices();
    var top = choices[choices.length - 1];

    // 처음 하는 아이는 고를 것이 1단계뿐이라 아예 묻지 않습니다.
    var single = choices.length < 2;
    el.startPick.hidden = single;
    el.levelRow.hidden = single;

    if (choices.indexOf(state.startLevel) < 0) state.startLevel = 1;

    el.levelRow.innerHTML = '';

    choices.forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (n === state.startLevel ? ' on' : '');
      b.textContent = n + '단계' + (n === top && n > 1 ? ' ⭐' : '');

      b.addEventListener('click', function () {
        state.startLevel = n;
        UI.saveValue(START_KEY, String(n));
        if (window.SFX) SFX.tap();

        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });

      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 한 판 ---------- */

  function startRun() {
    clearTimeout(timer);
    clearTimeout(bannerTimer);
    hideBanner();

    state.level = state.startLevel;
    state.popped = 0;
    state.lives = LIVES;

    updateScore();
    updateLives();
    startLevel(state.level);
  }

  function startLevel(n) {
    el.field.innerHTML = '';
    el.field.classList.remove('stopped');

    state.count = levelCount(n);
    state.spawned = 0;
    state.settled = 0;
    state.running = true;

    el.levelChip.textContent = n + '단계';
    el.bar.style.width = '0%';
    fit();

    spawnNext();
  }

  function spawnNext() {
    if (!state.running || state.spawned >= state.count) return;

    state.spawned += 1;
    makeBalloon();

    if (state.spawned < state.count) {
      timer = setTimeout(spawnNext, levelGap(state.level));
    }
  }

  function makeBalloon() {
    var width = el.field.clientWidth;

    var balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.style.left = UI.randInt(8, Math.max(8, width - BALLOON_W - 8)) + 'px';
    // 화면 아래에서 시작해 위로 완전히 빠져나갈 만큼 올라갑니다.
    balloon.style.setProperty('--rise', (el.field.clientHeight + 300) + 'px');
    balloon.style.animationDuration = levelRise(state.level) + 's';

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
    if (!state.running || settle(balloon)) return;

    if (window.SFX) SFX.pop();
    UI.confettiAt(balloon);

    state.popped += 1;
    updateScore();

    balloon.classList.add('popped');
    setTimeout(function () { balloon.remove(); }, 300);

    step();
  }

  // 놓친 풍선 — 하트가 하나 사라지고, 다 없어지면 게임 끝입니다.
  function escapeBalloon(balloon) {
    if (settle(balloon)) return;
    balloon.remove();
    if (!state.running) return;

    state.lives -= 1;
    updateLives();
    if (window.SFX) SFX.wrong();

    if (state.lives <= 0) { gameOver(); return; }
    step();
  }

  // 풍선 하나가 정리될 때마다 — 이 단계가 다 끝나면 다음 단계로.
  function step() {
    state.settled += 1;
    el.bar.style.width = Math.round((state.settled / state.count) * 100) + '%';
    if (state.settled >= state.count) levelUp();
  }

  function levelUp() {
    state.running = false;
    clearTimeout(timer);

    el.bar.style.width = '100%';
    state.level += 1;

    if (window.SFX) SFX.finish();
    showBanner('🎉 ' + state.level + '단계!');

    bannerTimer = setTimeout(function () {
      hideBanner();
      startLevel(state.level);
    }, 1300);
  }

  function gameOver() {
    state.running = false;
    clearTimeout(timer);
    clearTimeout(bannerTimer);
    hideBanner();

    // 아직 떠 있는 풍선은 그 자리에 멈춰 둡니다.
    el.field.classList.add('stopped');

    // 최고 기록은 '몇 단계까지 갔는가' 로 남깁니다.
    var prev = UI.readBest(BEST_KEY);
    var isBest = !prev || state.level > prev.stars;
    UI.saveBest(BEST_KEY, state.level, state.level);

    buildStartRow();  // 기록이 올랐으면 고를 수 있는 시작 단계도 늘어납니다

    el.endStars.textContent = '🎈 ' + state.level + '단계';
    el.endTitle.textContent = isBest ? '새 최고 기록! 🏆' : PRAISE[UI.randInt(0, PRAISE.length - 1)];
    el.endText.textContent = (state.startLevel > 1 ? state.startLevel + '단계에서 시작해서 ' : '')
      + state.level + '단계까지 갔어요. 풍선 ' + state.popped + '개를 터뜨렸어요!';
    el.endOverlay.hidden = false;
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.popped; }

  function updateLives() {
    el.lives.innerHTML = '';

    for (var i = 0; i < LIVES; i++) {
      var heart = document.createElement('span');
      heart.textContent = '❤️';
      if (i >= state.lives) heart.className = 'gone';
      el.lives.appendChild(heart);
    }

    // 하트가 줄어든 것이 눈에 띄도록 한 번 흔들어 줍니다.
    el.lives.classList.remove('hit');
    void el.lives.offsetWidth;
    if (state.lives < LIVES) el.lives.classList.add('hit');
  }

  function showBanner(text) {
    el.banner.textContent = text;
    el.banner.hidden = false;
  }

  function hideBanner() {
    el.banner.hidden = true;
    el.banner.textContent = '';
  }

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
