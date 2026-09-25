/* =========================================================================
 * 다니랜드 - 부수기
 *
 * 판에 나타난 얼음·항아리·상자·바위를 쳐서 깹니다.
 * 카메라 앞에서 손을 휘두르거나(손 모드), 그냥 눌러도 됩니다.
 *
 * ⭐ 이 놀이의 핵심은 '세게 쳐야 깨진다' 입니다.
 * js/hand.js 가 돌려주는 power(움직임의 세기)를 그대로 씁니다 — 살살 지나가면
 * 금만 가고, 세게 휘둘러야 한 칸이 깎입니다. 이 둘을 같게 만들면 카메라를 쓸
 * 이유가 없어집니다 (누르기와 똑같아집니다).
 *
 * 다만 살살 쳐도 반 칸은 깎입니다 — 힘이 약한 날 아무것도 못 깨고 끝나면
 * 배울 것이 없습니다 (실패를 벌하지 않기).
 *
 * 단계·하트·시작 단계 고르기는 풍선 터뜨리기(js/balloon.js)와 같은 얼개입니다.
 * ========================================================================= */

(function () {
  var LIVES = 5;

  // 깰 것 — 뒤로 갈수록 단단합니다 (hp 가 곧 세게 쳐야 하는 횟수).
  var THINGS = [
    { art: '🧊', hp: 2 },
    { art: '🏺', hp: 3 },
    { art: '🎁', hp: 3 },
    { art: '🪨', hp: 4 }
  ];

  // 깨면 안에서 튀어나오는 것 (무엇이 나올지 모르는 것이 다시 하게 만듭니다)
  var PRIZES = ['🍬', '🌟', '🦋', '🐤', '💎', '🍓', '🌸', '🐞', '🍀', '🎀'];

  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!'];

  function levelCount(n) { return 8 + 2 * (n - 1); }                     // 그 단계에 나오는 개수
  function levelLife(n) { return Math.max(2.6, 6.0 - 0.55 * (n - 1)); }  // 사라지기까지 초
  function levelGap(n) { return Math.max(650, 1800 - 170 * (n - 1)); }   // 다음 것까지 ms
  function levelKinds(n) { return Math.min(THINGS.length, 1 + Math.floor(n / 2)); }  // 몇 가지가 나오나

  /* 손으로 칠 때 ---------------------------------------------------------
   * STRONG 은 아이의 팔 힘·카메라 밝기에 따라 달라집니다. 태블릿에서 너무
   * 안 깨지면 이 한 줄만 낮추세요 (0.35 쯤). 다른 데는 건드릴 것이 없습니다.
   * -------------------------------------------------------------------- */
  var STRONG = 0.5;       // 이보다 세게 치면 한 칸
  var WEAK_DMG = 0.5;     // 살살 친 것은 반 칸
  var HIT_PAD = 6;        // 물건에서 이만큼 벗어나도 맞은 것으로
  var HIT_GAP = 260;      // 같은 물건을 다시 칠 수 있기까지 ms
                          // (한 번 휘두른 것이 프레임마다 여러 번 세지지 않게 막습니다)

  var HURRY = 1200;       // 사라지기 이만큼 전부터 깜빡입니다

  var BEST_KEY = 'daniland.best.smash.level';
  var START_KEY = 'daniland.smashStart';
  var MODE_KEY = 'daniland.smashMode';

  var el = {
    field: document.getElementById('field'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    levelChip: document.getElementById('levelChip'),
    lives: document.getElementById('lives'),
    banner: document.getElementById('banner'),
    backBtn: document.getElementById('backBtn'),

    cam: document.getElementById('cam'),
    handCursor: document.getElementById('handCursor'),
    modePick: document.getElementById('modePick'),
    modeRow: document.getElementById('modeRow'),
    camNote: document.getElementById('camNote'),

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
    mode: UI.loadValue(MODE_KEY) === 'hand' ? 'hand' : 'tap',
    startLevel: parseInt(UI.loadValue(START_KEY), 10) || 1,
    level: 1,
    count: 0,     // 이 단계에 나올 개수
    spawned: 0,
    settled: 0,   // 깨졌거나 사라진 개수
    broken: 0,    // 한 판 통틀어 깬 개수 (⭐)
    lives: LIVES,
    running: false
  };

  var alive = [];         // 지금 판에 있는 것 { el, hp, max, done, last, dieAt, hurried }
  var timer = null;       // 다음 것 내놓기
  var bannerTimer = null;
  var lifeRaf = 0;        // 사라질 때를 보는 시계
  var handOn = false;

  buildModeRow();
  buildStartRow();
  fit();

  el.startBtn.addEventListener('click', function () {
    if (window.SFX) SFX.unlock();

    // 손 모드는 카메라가 열린 뒤에 시작합니다 — 거절하면 누르기로 돌아갑니다.
    if (state.mode === 'hand') { openCamThenStart(); return; }

    el.startOverlay.hidden = true;
    startRun();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startRun();
  });

  bindGo(el.backBtn, 'subject.html?name=' + encodeURIComponent('놀이'));
  bindGo(el.startHome, 'subject.html?name=' + encodeURIComponent('놀이'));
  bindGo(el.endHome, 'subject.html?name=' + encodeURIComponent('놀이'));

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      stopHand();
      window.location.href = href;
    });
  }

  /* ---------- 손으로 부수기 (카메라) ----------
   * 풍선 터뜨리기와 같은 얼개입니다. 다른 점은 power 를 쓴다는 것뿐 —
   * 거기서는 닿기만 하면 터지고, 여기서는 얼마나 세게 쳤는지가 셈에 들어갑니다.
   * -------------------------------------------------------------------- */

  function buildModeRow() {
    var can = !!(window.Hand && Hand.supported());

    // 카메라가 없는 기기는 물을 것도 없습니다.
    if (!can) state.mode = 'tap';
    el.modePick.hidden = !can;
    el.modeRow.hidden = !can;
    if (!can) return;

    el.modeRow.innerHTML = '';

    [['tap', '👆 눌러서'], ['hand', '🖐 손으로']].forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (m[0] === state.mode ? ' on' : '');
      b.textContent = m[1];

      b.addEventListener('click', function () {
        state.mode = m[0];
        UI.saveValue(MODE_KEY, m[0]);
        if (window.SFX) SFX.tap();
        note(m[0] === 'hand' ? '태블릿을 세워 놓고, 카메라 앞에서 손을 세게 휘둘러요!' : '');

        Array.prototype.forEach.call(el.modeRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });

      el.modeRow.appendChild(b);
    });
  }

  function note(text) {
    el.camNote.textContent = text || '';
    el.camNote.hidden = !text;
  }

  function openCamThenStart() {
    el.startBtn.disabled = true;
    note('카메라를 켜는 중이에요…');

    Hand.start(el.cam).then(function () {
      el.startBtn.disabled = false;
      note('');

      el.field.classList.add('hand-on');
      el.cam.hidden = false;
      el.handCursor.hidden = false;
      Hand.follow(el.handCursor, el.field, hit);
      handOn = true;

      el.startOverlay.hidden = true;
      startRun();
    }, function () {
      // 권한을 거절했거나 카메라가 없는 경우 — 놀이는 계속할 수 있어야 합니다.
      el.startBtn.disabled = false;
      state.mode = 'tap';
      UI.saveValue(MODE_KEY, 'tap');
      buildModeRow();
      note('카메라를 못 열었어요. 눌러서 부숴요!');
    });
  }

  function stopHand() {
    if (!handOn) return;

    handOn = false;
    Hand.stop();

    el.field.classList.remove('hand-on');
    el.cam.hidden = true;
    el.handCursor.hidden = true;
  }

  // 손이 닿은 자리(화면 좌표) — 그 자리에 있는 것 하나만 칩니다.
  function hit(px, py, power) {
    if (!state.running) return;

    for (var i = 0; i < alive.length; i++) {
      var t = alive[i];
      if (t.done) continue;

      var r = t.el.getBoundingClientRect();

      if (px >= r.left - HIT_PAD && px <= r.right + HIT_PAD
        && py >= r.top - HIT_PAD && py <= r.bottom + HIT_PAD) {
        hitThing(t, power);
        return;
      }
    }
  }

  /* ---------- 한 판 ---------- */

  function startRun() {
    clearTimeout(timer);
    clearTimeout(bannerTimer);
    hideBanner();

    state.level = state.startLevel;
    state.broken = 0;
    state.lives = LIVES;

    updateScore();
    updateLives();
    startLevel(state.level);
  }

  function startLevel(n) {
    clearThings();

    state.count = levelCount(n);
    state.spawned = 0;
    state.settled = 0;
    state.running = true;

    el.levelChip.textContent = n + '단계';
    el.bar.style.width = '0%';
    fit();

    if (!lifeRaf) lifeRaf = requestAnimationFrame(watch);
    spawnNext();
  }

  function spawnNext() {
    if (!state.running || state.spawned >= state.count) return;

    state.spawned += 1;
    makeThing();

    if (state.spawned < state.count) {
      timer = setTimeout(spawnNext, levelGap(state.level));
    }
  }

  /* ---------- 물건 하나 ---------- */

  function makeThing() {
    var kind = THINGS[UI.randInt(0, levelKinds(state.level) - 1)];
    var size = thingSize();
    var spot = findSpot(size);

    var box = document.createElement('div');
    box.className = 'thing';
    box.style.left = spot.x + 'px';
    box.style.top = spot.y + 'px';
    box.style.width = size + 'px';
    box.style.height = size + 'px';
    box.style.fontSize = Math.round(size * 0.62) + 'px';

    var art = document.createElement('div');
    art.className = 'art';
    art.textContent = kind.art;

    // 금 — 깨질수록 한 줄씩 늘어납니다 (.c1 / .c2 는 .thing 에 붙습니다).
    var crack = document.createElement('div');
    crack.className = 'crack';
    crack.appendChild(document.createElement('i'));
    crack.appendChild(document.createElement('i'));

    box.appendChild(art);
    box.appendChild(crack);

    var thing = {
      el: box,
      hp: kind.hp,
      max: kind.hp,
      done: false,
      last: 0,
      dieAt: Date.now() + levelLife(state.level) * 1000,
      hurried: false
    };

    // 누르기는 늘 세게 친 것으로 칩니다 (손가락에는 세기가 없습니다).
    box.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      hitThing(thing, 1);
    });

    alive.push(thing);
    el.field.appendChild(box);
  }

  // 손으로 겨누는 과녁이라 풍선보다 큽니다 — 판이 넓으면 같이 커집니다.
  // (작게 두면 손이 스쳐 지나가 버립니다. 폰에서도 76px 아래로는 안 갑니다.)
  function thingSize() {
    return Math.max(76, Math.min(132, Math.round(el.field.clientWidth * 0.17)));
  }

  // 겹치지 않는 자리를 찾습니다 (못 찾으면 그냥 아무 데나 — 판이 꽉 찬 것입니다).
  function findSpot(size) {
    var w = Math.max(size, el.field.clientWidth - size - 8);
    var h = Math.max(size, el.field.clientHeight - size - 8);

    for (var n = 0; n < 14; n++) {
      var x = UI.randInt(8, w);
      var y = UI.randInt(8, h);
      if (far(x, y, size)) return { x: x, y: y };
    }

    return { x: UI.randInt(8, w), y: UI.randInt(8, h) };
  }

  function far(x, y, size) {
    for (var i = 0; i < alive.length; i++) {
      if (alive[i].done) continue;

      var o = alive[i].el;
      if (Math.abs(x - o.offsetLeft) < size * 0.95
        && Math.abs(y - o.offsetTop) < size * 0.95) return false;
    }

    return true;
  }

  /* ---------- 치기 ---------- */

  function hitThing(thing, power) {
    if (!state.running || thing.done) return;

    // 한 번 휘두른 손이 프레임마다 여러 번 세지지 않게 잠깐 막아 둡니다.
    var now = Date.now();
    if (now - thing.last < HIT_GAP) return;
    thing.last = now;

    thing.hp -= power >= STRONG ? 1 : WEAK_DMG;

    // 맞은 것이 눈에 띄게 한 번 흔들어 줍니다.
    thing.el.classList.remove('shake');
    void thing.el.offsetWidth;
    thing.el.classList.add('shake');

    var cracks = Math.floor(thing.max - thing.hp);
    thing.el.classList.toggle('c1', cracks >= 1);
    thing.el.classList.toggle('c2', cracks >= 2);

    if (thing.hp <= 0) { breakThing(thing); return; }
    if (window.SFX) SFX.tap();
  }

  function breakThing(thing) {
    if (settle(thing)) return;

    if (window.SFX) SFX.pop();
    UI.confettiAt(thing.el);

    state.broken += 1;
    updateScore();

    // 안에서 선물이 튀어나옵니다.
    var prize = document.createElement('div');
    prize.className = 'prize';
    prize.textContent = PRIZES[UI.randInt(0, PRIZES.length - 1)];
    thing.el.appendChild(prize);

    thing.el.classList.add('broken');
    setTimeout(function () { thing.el.remove(); }, 800);

    step();
  }

  // 못 깨고 사라진 것 — 하트가 하나 없어집니다.
  function missThing(thing) {
    if (settle(thing)) return;

    thing.el.classList.add('away');
    setTimeout(function () { thing.el.remove(); }, 320);

    if (!state.running) return;

    state.lives -= 1;
    updateLives();
    if (window.SFX) SFX.wrong();

    if (state.lives <= 0) { gameOver(); return; }
    step();
  }

  // 한 물건은 깨지거나 사라지거나 둘 중 하나만 — 두 번 세지 않게 막습니다.
  function settle(thing) {
    if (thing.done) return true;
    thing.done = true;

    var i = alive.indexOf(thing);
    if (i >= 0) alive.splice(i, 1);

    return false;
  }

  // 물건 하나가 정리될 때마다 — 이 단계가 다 끝나면 다음 단계로.
  function step() {
    state.settled += 1;
    el.bar.style.width = Math.round((state.settled / state.count) * 100) + '%';
    if (state.settled >= state.count) levelUp();
  }

  /* ---------- 사라질 때를 보는 시계 ---------- */

  function watch() {
    lifeRaf = requestAnimationFrame(watch);
    if (!state.running) return;

    var now = Date.now();

    // missThing 이 alive 에서 빼므로 뒤에서부터 봅니다.
    for (var i = alive.length - 1; i >= 0; i--) {
      var t = alive[i];

      if (now >= t.dieAt) { missThing(t); continue; }

      if (!t.hurried && now >= t.dieAt - HURRY) {
        t.hurried = true;
        t.el.classList.add('hurry');
      }
    }
  }

  // 물건만 걷어 냅니다 — 카메라 화면과 커서는 판 안에 그대로 있어야 합니다.
  function clearThings() {
    alive.length = 0;

    var old = el.field.querySelectorAll('.thing');
    for (var i = 0; i < old.length; i++) old[i].remove();
  }

  /* ---------- 단계와 끝 ---------- */

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
    clearThings();

    // 최고 기록은 '몇 단계까지 갔는가' 로 남깁니다 (풍선 터뜨리기와 같습니다).
    var prev = UI.readBest(BEST_KEY);
    var isBest = !prev || state.level > prev.stars;
    UI.saveBest(BEST_KEY, state.level, state.level);

    buildStartRow();

    el.endStars.textContent = '🧊 ' + state.level + '단계';
    el.endTitle.textContent = isBest ? '새 최고 기록! 🏆' : PRAISE[UI.randInt(0, PRAISE.length - 1)];
    el.endText.textContent = (state.startLevel > 1 ? state.startLevel + '단계에서 시작해서 ' : '')
      + state.level + '단계까지 갔어요. ' + state.broken + '개를 깼어요!';
    el.endOverlay.hidden = false;
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

  /* ---------- 자잘한 것 ---------- */

  function updateScore() { el.score.textContent = '⭐ ' + state.broken; }

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
   * 놀이판이 스크롤 없이 한 화면에 들어오게 합니다
   * (풍선 터뜨리기의 fit() 과 같은 규칙).
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

  window.addEventListener('pagehide', stopHand);
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });
})();
