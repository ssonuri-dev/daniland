/* =========================================================================
 * 다니랜드 - 부수기
 *
 * 판에 나타난 말랑말랑 젤리 괴물을 쳐서 터뜨립니다 (뿌요뿌요 같은 덩어리에 눈·입).
 * 괴물은 그림 파일이 아니라 css 로 그립니다 — 이모지는 깨질 때 모양을 못 바꾸지만,
 * 직접 그리면 몸이 찌부러졌다가 젤리 방울로 튀는 것까지 보여 줄 수 있습니다.
 * 카메라 앞에서 손을 휘두르거나(손 모드), 그냥 눌러도 됩니다.
 *
 * ⭐ 한 번 치면 깨집니다. 대신 많이 나옵니다.
 * 처음에는 두세 번씩 쳐야 깨지게 만들었는데 '빡세다' 는 반응이라 (2026-09-27)
 * 체력을 없애고 개수를 늘렸습니다. 재미는 '깨지는 순간' 에서 나오므로 그 순간을
 * 크게 만듭니다 — 몸이 찌부러지며 젤리 방울이 사방으로 튀고, '뽁!' 글자와
 * 충격파, 판이 한 번 흔들리고, 선물이 튀어 오릅니다. 이어서 깨면 'n연속!' 이 뜨고 소리가 한 음씩 올라갑니다.
 *
 * 손 모드에서 power(움직임의 세기)는 깨지느냐가 아니라 파편이 얼마나 멀리
 * 튀느냐에만 씁니다 — 세게 휘두르면 더 시원하게 부서집니다.
 *
 * 단계·하트·시작 단계 고르기는 풍선 터뜨리기(js/balloon.js)와 같은 얼개입니다.
 * ========================================================================= */

(function () {
  var LIVES = 5;

  // 괴물 — 색·얼굴·머리 장식만 다릅니다 (모두 한 번에 터집니다).
  //   c 몸 색, l 밝은 색(방울·반짝이), face 는 two(두 눈)·one(외눈)·happy(^^),
  //   top 은 머리 위 장식(horns 뿔 · ears 귀 · antenna 더듬이 · '' 없음)
  var MONSTERS = [
    { c: '#ff5b6e', l: '#ffb3bc', face: 'two',   top: 'horns' },
    { c: '#4cd07d', l: '#b6f2cb', face: 'one',   top: 'antenna' },
    { c: '#4aa8ff', l: '#bfe0ff', face: 'happy', top: '' },
    { c: '#ffc93f', l: '#fff0b8', face: 'two',   top: 'ears' },
    { c: '#b27cff', l: '#e2ccff', face: 'one',   top: 'horns' },
    { c: '#ff8fd0', l: '#ffd6ee', face: 'happy', top: 'ears' },
    { c: '#ff9f43', l: '#ffd7ae', face: 'two',   top: 'antenna' },
    { c: '#2ec4b6', l: '#aef0e8', face: 'two',   top: '' }
  ];

  // 터질 때 뜨는 소리 글자
  var POPS = ['뽁!', '퐁!', '뿅!', '팡!'];

  // 깨면 안에서 튀어나오는 것 (무엇이 나올지 모르는 것이 다시 하게 만듭니다)
  var PRIZES = ['🍬', '🌟', '🦋', '🐤', '💎', '🍓', '🌸', '🐞', '🍀', '🎀', '🍭', '👑'];

  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!'];

  function levelCount(n) { return 16 + 4 * (n - 1); }                    // 그 단계에 나오는 개수
  function levelLife(n) { return Math.max(2.4, 4.2 - 0.3 * (n - 1)); }   // 사라지기까지 초
  function levelGap(n) { return Math.max(380, 950 - 80 * (n - 1)); }     // 다음 것까지 ms
  // 판에 한꺼번에 떠 있는 것은 대략 life ÷ gap — 1단계 4개쯤, 8단계 6개쯤입니다.

  var HIT_PAD = 6;        // 물건에서 이만큼 벗어나도 맞은 것으로
  var HURRY = 1100;       // 사라지기 이만큼 전부터 깜빡입니다
  var COMBO_GAP = 900;    // 이 안에 또 깨면 연속으로 칩니다 (ms)

  var DROPS = 12;         // 튀는 젤리 방울 개수

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
    combo: 0,     // 지금 몇 연속인가
    bestCombo: 0, // 이 판에서 제일 긴 연속
    lastBreak: 0,
    lives: LIVES,
    running: false
  };

  var alive = [];         // 지금 판에 있는 것 { el, kind, size, done, dieAt, hurried }
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
   * 풍선 터뜨리기와 같은 얼개입니다. 한 번 휘두른 손이 지나간 자리의 것은
   * 모두 깨집니다 — 쓸어 깨는 것이 이 놀이의 재미라 하나만 고르지 않습니다.
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
        note(m[0] === 'hand' ? '태블릿을 세워 놓고, 카메라 앞에서 손을 휘둘러 깨요!' : '');

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

  // 손이 닿은 자리(화면 좌표) — 그 자리에 있는 것을 모두 깹니다.
  function hit(px, py, power) {
    if (!state.running) return;

    // breakThing 이 alive 에서 빼므로 뒤에서부터 봅니다.
    for (var i = alive.length - 1; i >= 0; i--) {
      var t = alive[i];
      if (t.done) continue;

      var r = t.el.getBoundingClientRect();

      if (px >= r.left - HIT_PAD && px <= r.right + HIT_PAD
        && py >= r.top - HIT_PAD && py <= r.bottom + HIT_PAD) {
        breakThing(t, power);
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
    state.combo = 0;
    state.bestCombo = 0;
    state.lastBreak = 0;
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
    var kind = MONSTERS[UI.randInt(0, MONSTERS.length - 1)];
    var size = thingSize();
    var spot = findSpot(size);

    var box = document.createElement('div');
    box.className = 'thing';
    box.style.left = spot.x + 'px';
    box.style.top = spot.y + 'px';
    box.style.width = size + 'px';
    box.style.height = size + 'px';
    box.appendChild(monsterEl(kind));

    var thing = {
      el: box,
      kind: kind,
      size: size,
      done: false,
      dieAt: Date.now() + levelLife(state.level) * 1000,
      hurried: false
    };

    // 누르기는 늘 세게 친 것으로 칩니다 (손가락에는 세기가 없습니다).
    box.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      breakThing(thing, 1);
    });

    alive.push(thing);
    el.field.appendChild(box);
  }

  // 젤리 괴물 하나 — 몸·반짝이·머리 장식·눈·입. 크기는 모두 % 라 과녁 크기를 따라갑니다.
  function monsterEl(kind) {
    var body = document.createElement('div');
    body.className = 'slime face-' + kind.face + (kind.top ? ' top-' + kind.top : '');
    body.style.setProperty('--c', kind.c);
    body.style.setProperty('--l', kind.l);
    // 다 같이 들썩이면 기계 같아서 박자를 조금씩 어긋냅니다.
    body.style.animationDelay = (-Math.random() * 1.2).toFixed(2) + 's';

    var parts = ['shine', 'deco l', 'deco r', 'mouth'];
    if (kind.face === 'one') parts.push('eye big');
    else parts.push('eye l', 'eye r');

    parts.forEach(function (name) {
      var p = document.createElement('i');
      p.className = name;
      body.appendChild(p);
    });

    return body;
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

  /* ---------- 깨기 ---------- */

  function breakThing(thing, power) {
    if (!state.running || settle(thing)) return;

    // 연속 — 앞의 것을 깬 지 COMBO_GAP 안이면 이어서 셉니다.
    var now = Date.now();
    state.combo = now - state.lastBreak <= COMBO_GAP ? state.combo + 1 : 1;
    state.lastBreak = now;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;

    state.broken += 1;
    updateScore();

    if (window.SFX) SFX.smash(state.combo);

    var cx = thing.el.offsetLeft + thing.size / 2;
    var cy = thing.el.offsetTop + thing.size / 2;

    shatter(thing, cx, cy, power);
    if (state.combo >= 2) comboText(cx, cy - thing.size * 1.05, state.combo);
    jolt();

    // 물건은 곧바로 치웁니다 — 남은 것은 파편과 선물이 맡습니다.
    thing.el.classList.add('broken');
    setTimeout(function () { thing.el.remove(); }, 180);

    step();
  }

  /* 부서지는 모습 ---------------------------------------------------------
   * 젤리 방울·'뽁!'·충격파 고리·선물을 판에 직접 붙입니다 (물건은 곧 지워지므로
   * 그 안에 두면 같이 사라집니다). 모두 애니메이션이 끝나면 스스로 지웁니다.
   * -------------------------------------------------------------------- */

  function shatter(thing, cx, cy, power) {
    var size = thing.size;
    // 세게 휘두를수록 멀리 튑니다 (누르기는 1).
    var reach = size * (0.9 + 0.8 * Math.min(1, Math.max(0.2, power)));

    for (var i = 0; i < DROPS; i++) {
      var angle = (Math.PI * 2 * i) / DROPS + (Math.random() - 0.5) * 0.5;
      var dist = reach * (0.6 + Math.random() * 0.6);
      var piece = Math.round(size * (0.1 + Math.random() * 0.12));

      var s = document.createElement('div');
      s.className = 'drop';
      s.style.left = (cx - piece / 2) + 'px';
      s.style.top = (cy - piece / 2) + 'px';
      s.style.width = piece + 'px';
      s.style.height = piece + 'px';
      s.style.background = i % 3 ? thing.kind.c : thing.kind.l;
      s.style.setProperty('--dx', Math.round(Math.cos(angle) * dist) + 'px');
      s.style.setProperty('--dy', Math.round(Math.sin(angle) * dist) + 'px');
      // 떨어지는 만큼 — 위로 튄 것도 결국 아래로 떨어집니다.
      s.style.setProperty('--fall', Math.round(size * (0.5 + Math.random() * 0.5)) + 'px');
      s.style.animationDuration = (0.55 + Math.random() * 0.25) + 's';

      addFx(s, 900);
    }

    var boom = document.createElement('div');
    boom.className = 'boom';
    boom.textContent = POPS[UI.randInt(0, POPS.length - 1)];
    // 글자는 위로, 선물은 가운데에서 — 같은 자리면 서로 가려 둘 다 안 읽힙니다.
    place(boom, cx, cy - size * 0.45, size * 1.4);
    boom.style.fontSize = Math.round(size * 0.42) + 'px';
    boom.style.color = thing.kind.c;
    addFx(boom, 500);

    var ring = document.createElement('div');
    ring.className = 'ring';
    place(ring, cx, cy, size * 1.1);
    ring.style.borderColor = thing.kind.l;
    addFx(ring, 500);

    var prize = document.createElement('div');
    prize.className = 'prize';
    prize.textContent = PRIZES[UI.randInt(0, PRIZES.length - 1)];
    place(prize, cx, cy, size);
    prize.style.fontSize = Math.round(size * 0.6) + 'px';
    addFx(prize, 1150);
  }

  // 'n연속!' — 이어서 깰수록 글자가 커집니다.
  function comboText(x, y, n) {
    var t = document.createElement('div');
    t.className = 'combo';
    t.textContent = n + '연속!';
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    t.style.fontSize = Math.min(64, 26 + n * 4) + 'px';
    addFx(t, 900);
  }

  // 판을 한 번 흔듭니다 (연달아 깨면 처음부터 다시 흔듭니다).
  function jolt() {
    el.field.classList.remove('jolt');
    void el.field.offsetWidth;
    el.field.classList.add('jolt');
  }

  function place(node, cx, cy, box) {
    node.style.left = (cx - box / 2) + 'px';
    node.style.top = (cy - box / 2) + 'px';
    node.style.width = box + 'px';
    node.style.height = box + 'px';
  }

  function addFx(node, life) {
    el.field.appendChild(node);
    setTimeout(function () { node.remove(); }, life);
  }

  // 못 깨고 사라진 것 — 하트가 하나 없어집니다.
  function missThing(thing) {
    if (settle(thing)) return;

    thing.el.classList.add('away');
    setTimeout(function () { thing.el.remove(); }, 320);

    if (!state.running) return;

    state.combo = 0;
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

    el.endStars.textContent = '👾 ' + state.level + '단계';
    el.endTitle.textContent = isBest ? '새 최고 기록! 🏆' : PRAISE[UI.randInt(0, PRAISE.length - 1)];
    el.endText.textContent = (state.startLevel > 1 ? state.startLevel + '단계에서 시작해서 ' : '')
      + state.level + '단계까지 갔어요. ' + state.broken + '개를 깼어요!'
      + (state.bestCombo >= 2 ? ' 한 번에 ' + state.bestCombo + '연속!' : '');
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
