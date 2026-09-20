/* =========================================================================
 * 다니랜드 - 낚시
 *
 * 다니가 배를 타고 물 위에 떠 있고, 물속에서는 물고기(🐟 🐠 🐡 …)가 좌우로 헤엄칩니다.
 * 배를 좌우로 몰아 자리를 잡고 🎣 를 누르면 바늘이 내려가고, 물고기에 닿으면 걸려서 올라옵니다.
 * 바늘이 내려가는 동안에도 배를 움직일 수 있어서(줄이 배를 따라옵니다) 물고기를 쫓아갈 수 있고,
 * 내려가는 중에 🎣 를 다시 누르면 그냥 올라옵니다.
 *
 * 한 단계에 정해진 수(levelGoal)만큼 잡으면 다음 단계 — 갈수록 물고기가 빨라지고, 2단계부터 쓰레기(🥫 👢 …),
 * 3단계부터 작은 물고기가 섞입니다. 쓰레기를 건져 올리면 하트 ❤️ 가 하나 사라지고(세 개), 다 없어지면 그 판이 끝납니다.
 * 빈 바늘로 올라오는 것은 아무 벌이 없습니다 (놓친 것을 벌하지 않습니다).
 *
 * 움직이기: 아래 ◀ ▶ 단추를 누르고 있거나, 물에 손가락을 대고 끌면 배가 그쪽으로 갑니다.
 * 물을 톡 치면(끌지 않고) 🎣 와 같습니다. 컴퓨터에서는 화살표 키 · 스페이스.
 *
 * 기록은 풍선 터뜨리기와 같이 '몇 단계까지 갔는가' (daniland.best.fish.level) 이고, 시작 화면에서
 * 그 단계까지 중에 시작할 단계를 고릅니다. ⭐ 는 한 판에서 잡은 물고기 수입니다.
 *
 * 좌표는 전부 화면 비율입니다 (가로는 놀이판 너비의 0~1, 세로는 높이의 0~1). 그릴 때만 px 로 바꿉니다.
 * ========================================================================= */

(function () {
  var LIVES = 3;

  var FISH = ['🐟', '🐠', '🐡', '🦑', '🐙', '🦐'];
  var TRASH = ['🥫', '👢', '🍾', '🧦', '🥾'];
  var DECOR = ['🌿', '🐚', '🪨', '🌱'];
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '낚시 박사!'];

  // 단계별 어려움 — 이 단계에서 잡을 수, 물고기 빠르기(놀이판 너비/초), 한 번에 헤엄치는 수,
  // 쓰레기가 나올 확률, 작은 물고기가 나올 확률
  function levelGoal(n)   { return Math.min(14, 6 + 2 * (n - 1)); }
  function levelSpeed(n)  { return Math.min(0.42, 0.10 + 0.035 * (n - 1)); }
  function levelCount(n)  { return Math.min(7, 5 + Math.floor((n - 1) / 2)); }
  function levelTrash(n)  { return n < 2 ? 0 : Math.min(0.4, 0.15 + 0.05 * (n - 2)); }
  function levelSmall(n)  { return n < 3 ? 0 : Math.min(0.5, 0.2 + 0.05 * (n - 3)); }

  var SURFACE = 0.26;       // 물 표면 (높이 배수)
  var SEABED = 0.92;        // 바닥 모래가 시작하는 곳
  var FISH_TOP = 0.36;      // 물고기가 다니는 띠
  var FISH_BOTTOM = 0.84;
  var ROWS = 5;             // 그 띠를 몇 줄로 나눠 물고기를 놓나 (겹치지 않게)

  var BOAT_W = 0.34;        // 배 너비 (너비 배수)
  var BOAT_SPEED = 0.9;     // 배 좌우 빠르기 (너비/초)
  var ROD_DX = 0.10;        // 낚싯대 끝 — 배 가운데에서 왼쪽으로 (너비 배수)
  var HOOK_EDGE = 0.06;     // 바늘이 왼쪽 가장자리에서 이만큼은 떨어져 있게 (배가 더 왼쪽으로 못 갑니다)
  var ROD_DY = 0.13;        // 낚싯대 끝 — 물 표면에서 위로 (높이 배수)
  var HOOK_DOWN = 0.5;      // 바늘 내려가는 빠르기 (높이/초)
  var HOOK_UP = 0.6;        // 올라오는 빠르기
  var FISH_SIZE = 0.13;     // 물고기 글자 크기 (너비 배수)
  var SMALL = 0.6;          // 작은 물고기 크기 배수

  var BEST_KEY = 'daniland.best.fish.level';
  var START_KEY = 'daniland.fishStart';

  var EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", serif';

  var el = {
    field: document.getElementById('field'),
    canvas: document.getElementById('canvas'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    levelChip: document.getElementById('levelChip'),
    lives: document.getElementById('lives'),
    banner: document.getElementById('banner'),
    backBtn: document.getElementById('backBtn'),
    leftBtn: document.getElementById('leftBtn'),
    rightBtn: document.getElementById('rightBtn'),
    castBtn: document.getElementById('castBtn'),

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

  var ctx = el.canvas.getContext('2d');

  var dani = new Image();
  dani.src = 'dani.png';

  var state = {
    startLevel: parseInt(UI.loadValue(START_KEY), 10) || 1,
    level: 1,
    lives: LIVES,
    caught: 0,        // 한 판 통틀어 잡은 물고기 (⭐)
    levelCaught: 0,   // 이 단계에서 잡은 물고기
    running: false,
    W: 0, H: 0,       // 놀이판 px
    time: 0,          // 흐른 시간(초) — 물결·구름·물고기 꼬리 흔들기에 씁니다
    x: 0.5,           // 배 자리 (너비 0~1)
    targetX: null,    // 손가락이 가리키는 자리 (없으면 null)
    hold: 0,          // 단추·키로 미는 방향 -1 / 0 / 1
    lean: 0,          // 움직이는 쪽으로 살짝 기울기
    hook: { mode: 'idle', x: 0.5, y: 0, catch: null },   // mode: idle | down | up
    fish: [],         // { emoji, kind: 'fish'|'small'|'trash', x, y0, dir, speed, size, phase }
    bubbles: [],      // 바늘에서 올라오는 공기 방울 { x, y, r, t }
    pops: [],         // 배 위로 떠오르는 ⭐ / 💔 { emoji, x, y, t }
    clouds: [],       // { x, y, size, speed }
    decor: []         // 바닥 장식 { emoji, x, size }
  };

  var frame = null;
  var lastT = 0;
  var bannerTimer = null;

  buildStartRow();
  buildScenery();
  fit();

  el.startBtn.addEventListener('click', function () {
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    fit();
    startRun();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startRun();
  });

  // 맨 위 ← 도, '뒤로' 도 이 놀이가 들어 있는 과목 페이지로 갑니다.
  bindGo(el.backBtn, backHref());
  bindGo(el.startHome, backHref());
  bindGo(el.endHome, backHref());

  function bindGo(btn, href) {
    btn.addEventListener('click', function () { window.location.href = href; });
  }

  function backHref() {
    var pages = window.PAGES || [];
    for (var i = 0; i < pages.length; i++) {
      if ((pages[i].href || '').indexOf('fish.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject, pages[i].group);
      }
    }
    return 'index.html';
  }

  /* ---------- 시작 단계 고르기 ----------
   * 풍선 터뜨리기와 같은 규칙 — 지금까지 간 최고 단계까지만 (1단계 · 중간 · 최고). */

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

  // 구름과 바닥 장식은 한 번만 정해 두고 판이 바뀌어도 그대로 둡니다
  function buildScenery() {
    state.clouds = [];
    for (var i = 0; i < 3; i++) {
      state.clouds.push({ x: Math.random(), y: 0.04 + i * 0.05, size: 0.10 + Math.random() * 0.05, speed: 0.008 + Math.random() * 0.008 });
    }
    state.decor = [];
    for (var d = 0; d < 6; d++) {
      state.decor.push({ emoji: DECOR[d % DECOR.length], x: (d + 0.5) / 6 + (Math.random() - 0.5) * 0.08, size: 0.06 + Math.random() * 0.03 });
    }
  }

  /* ---------- 한 판 ---------- */

  function startRun() {
    clearTimeout(bannerTimer);
    hideBanner();

    state.level = state.startLevel;
    state.caught = 0;
    state.lives = LIVES;

    updateScore();
    updateLives();
    startLevel(state.level);
  }

  function startLevel(n) {
    state.levelCaught = 0;
    state.x = 0.5;
    state.targetX = null;
    state.bubbles = [];
    state.pops = [];
    state.running = true;
    resetHook();

    state.fish = [];
    var count = levelCount(n);
    for (var i = 0; i < count; i++) {
      var f = rollFish(n, i % ROWS);
      f.x = Math.random();        // 처음에는 화면 안 여기저기에서 시작합니다
      state.fish.push(f);
    }

    el.levelChip.textContent = n + '단계';
    el.bar.style.width = '0%';
    updateCast();
    fit();

    lastT = 0;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  function idleHookY() { return SURFACE + 0.025; }

  function resetHook() {
    state.hook.mode = 'idle';
    state.hook.x = state.x - ROD_DX;
    state.hook.y = idleHookY();
    state.hook.catch = null;
  }

  // 새 물고기(또는 쓰레기) 하나 — 화면 밖에서 들어옵니다. row 를 주면 그 줄, 아니면 아무 줄.
  function rollFish(level, row) {
    var trashNow = state.fish.filter(function (f) { return f.kind === 'trash'; }).length;
    var kind = 'fish';
    // 쓰레기는 한 번에 셋 중 하나까지만 — 안 그러면 잡을 것이 없습니다
    if (Math.random() < levelTrash(level) && trashNow < Math.floor(levelCount(level) / 3)) kind = 'trash';
    else if (Math.random() < levelSmall(level)) kind = 'small';

    if (row === undefined || row === null) row = UI.randInt(0, ROWS - 1);
    var band = (FISH_BOTTOM - FISH_TOP) / ROWS;
    var dir = Math.random() < 0.5 ? -1 : 1;
    var speed = levelSpeed(level) * (0.75 + Math.random() * 0.6);
    if (kind === 'small') speed *= 1.25;     // 작은 물고기는 더 빠릅니다
    if (kind === 'trash') speed *= 0.55;     // 쓰레기는 천천히 떠다닙니다

    return {
      emoji: kind === 'trash' ? TRASH[UI.randInt(0, TRASH.length - 1)] : FISH[UI.randInt(0, FISH.length - 1)],
      kind: kind,
      x: dir > 0 ? -0.12 : 1.12,
      y0: FISH_TOP + band * (row + 0.2 + Math.random() * 0.6),
      dir: dir,
      speed: speed,
      size: kind === 'small' ? SMALL : (kind === 'trash' ? 0.8 : 1),
      phase: Math.random() * Math.PI * 2
    };
  }

  function fishY(f) {
    return f.y0 + Math.sin(state.time * 1.6 + f.phase) * 0.012;
  }

  /* ---------- 매 화면 ---------- */

  function tick(t) {
    if (!state.running) return;
    frame = requestAnimationFrame(tick);

    // 탭을 숨겼다 돌아와도 한꺼번에 훌쩍 지나가지 않게 한 번에 최대 50ms 만 갑니다
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;

    update(dt);
    draw();
  }

  function update(dt) {
    state.time += dt;

    // 배 좌우 — 손가락이 가리키는 곳으로, 아니면 단추·키가 미는 쪽으로
    var step = BOAT_SPEED * dt;
    var dir = 0;
    if (state.targetX !== null) {
      var d = state.targetX - state.x;
      if (Math.abs(d) <= step) { state.x = state.targetX; }
      else { state.x += d > 0 ? step : -step; dir = d > 0 ? 1 : -1; }
    } else if (state.hold) {
      state.x += state.hold * step;
      dir = state.hold;
    }
    // 왼쪽은 바늘이 화면 안에 남을 만큼, 오른쪽은 배가 조금 잘려도 바늘이 오른쪽 물고기에 닿을 만큼
    state.x = Math.max(ROD_DX + HOOK_EDGE, Math.min(1 - BOAT_W * 0.25, state.x));
    state.lean += (dir - state.lean) * Math.min(1, dt * 8);

    // 구름
    state.clouds.forEach(function (c) {
      c.x += c.speed * dt;
      if (c.x > 1.15) c.x = -0.15;
    });

    // 물고기 — 반대편으로 나가면 새 물고기로 바꿉니다 (같은 줄에)
    var hook = state.hook;
    for (var i = 0; i < state.fish.length; i++) {
      var f = state.fish[i];
      if (f === hook.catch) continue;
      f.x += f.dir * f.speed * dt;
      if (f.x < -0.15 || f.x > 1.15) state.fish[i] = rollFish(state.level, i % ROWS);
    }

    // 바늘 — 줄은 낚싯대 끝을 조금 늦게 따라옵니다 (배가 움직이면 줄이 비스듬해집니다)
    var tipX = state.x - ROD_DX;
    hook.x += (tipX - hook.x) * Math.min(1, dt * (hook.mode === 'idle' ? 14 : 5));

    if (hook.mode === 'down') {
      hook.y += HOOK_DOWN * dt;
      if (Math.random() < dt * 6) state.bubbles.push({ x: hook.x, y: hook.y, r: 0.004 + Math.random() * 0.004, t: 0 });
      if (hook.y >= SEABED - 0.04) { hook.y = SEABED - 0.04; hook.mode = 'up'; updateCast(); }
      else checkBite();
    } else if (hook.mode === 'up') {
      hook.y -= HOOK_UP * dt;
      if (hook.y <= idleHookY()) land();
    }

    for (var b = state.bubbles.length - 1; b >= 0; b--) {
      var bb = state.bubbles[b];
      bb.t += dt;
      bb.y -= dt * 0.12;
      if (bb.t > 1.6 || bb.y < SURFACE) state.bubbles.splice(b, 1);
    }
    for (var p = state.pops.length - 1; p >= 0; p--) {
      state.pops[p].t += dt;
      if (state.pops[p].t > 0.9) state.pops.splice(p, 1);
    }
  }

  // 내려가는 바늘이 물고기에 닿았나
  function checkBite() {
    var hook = state.hook;
    var W = state.W, H = state.H;
    for (var i = 0; i < state.fish.length; i++) {
      var f = state.fish[i];
      var s = FISH_SIZE * f.size * W / 2;      // 반지름 px
      var dx = (hook.x - f.x) * W;
      var dy = (hook.y - fishY(f)) * H;
      if (Math.abs(dx) < s * 0.8 && Math.abs(dy) < s * 0.55) {
        hook.catch = f;
        hook.mode = 'up';
        if (window.SFX) SFX.tap();
        updateCast();
        return;
      }
    }
  }

  // 바늘이 물 위로 올라왔습니다 — 걸린 것이 있으면 여기서 셉니다
  function land() {
    var hook = state.hook;
    var got = hook.catch;
    var bx = state.x, by = SURFACE - 0.06;
    resetHook();

    if (got) {
      var i = state.fish.indexOf(got);
      if (i >= 0) state.fish[i] = rollFish(state.level, i % ROWS);

      if (got.kind === 'trash') {
        state.pops.push({ emoji: '💔', x: bx, y: by, t: 0 });
        hurt();
        if (!state.running) return;
      } else {
        state.caught += 1;
        state.levelCaught += 1;
        updateScore();
        if (window.SFX) SFX.pop();
        state.pops.push({ emoji: got.emoji, x: bx, y: by, t: 0 });
        state.pops.push({ emoji: '⭐', x: bx + 0.06, y: by - 0.02, t: -0.15 });

        var goal = levelGoal(state.level);
        el.bar.style.width = Math.min(100, Math.round(state.levelCaught / goal * 100)) + '%';
        if (state.levelCaught >= goal) { levelUp(); return; }
      }
    }
    updateCast();
  }

  function hurt() {
    state.lives -= 1;
    updateLives();
    if (window.SFX) SFX.wrong();
    if (state.lives <= 0) gameOver();
  }

  function levelUp() {
    state.running = false;
    cancelAnimationFrame(frame);

    el.bar.style.width = '100%';
    state.level += 1;
    UI.saveBest(BEST_KEY, state.level, state.level);

    if (window.SFX) SFX.finish();
    confettiAtBoat();
    showBanner('🎉 ' + state.level + '단계!');

    bannerTimer = setTimeout(function () {
      hideBanner();
      startLevel(state.level);
    }, 1400);
  }

  function gameOver() {
    state.running = false;
    cancelAnimationFrame(frame);
    clearTimeout(bannerTimer);
    hideBanner();
    state.hold = 0;
    state.targetX = null;
    draw();

    // 최고 기록은 '몇 단계까지 갔는가' 로 남깁니다
    var prev = UI.readBest(BEST_KEY);
    var isBest = !prev || state.level > prev.stars;
    UI.saveBest(BEST_KEY, state.level, state.level);

    buildStartRow();  // 기록이 올랐으면 고를 수 있는 시작 단계도 늘어납니다

    el.endStars.textContent = '🐟 ' + state.level + '단계';
    el.endTitle.textContent = isBest ? '새 최고 기록! 🏆' : PRAISE[UI.randInt(0, PRAISE.length - 1)];
    el.endText.textContent = (state.startLevel > 1 ? state.startLevel + '단계에서 시작해서 ' : '')
      + state.level + '단계까지 갔어요. 물고기 ' + state.caught + '마리를 잡았어요!';
    el.endOverlay.hidden = false;
  }

  // 🎣 — 바늘이 쉬고 있으면 내리고, 내려가는 중이면 올립니다
  function cast() {
    if (!state.running) return;
    var hook = state.hook;
    if (hook.mode === 'idle') {
      hook.mode = 'down';
      if (window.SFX) SFX.splash();
    } else if (hook.mode === 'down') {
      hook.mode = 'up';
    }
    updateCast();
  }

  function updateCast() {
    var mode = state.hook.mode;
    el.castBtn.textContent = mode === 'idle' ? '🎣 내리기' : '🎣 올리기';
    el.castBtn.classList.toggle('busy', mode === 'up');
  }

  // UI.confettiAt 은 요소를 받으므로 배 자리에 잠깐 빈 칸을 놓고 터뜨립니다
  function confettiAtBoat() {
    var r = el.canvas.getBoundingClientRect();
    var dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.left = (r.left + state.x * state.W) + 'px';
    dot.style.top = (r.top + SURFACE * state.H) + 'px';
    dot.style.width = '0';
    dot.style.height = '0';
    document.body.appendChild(dot);
    UI.confettiAt(dot);
    dot.remove();
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.caught; }

  function updateLives() {
    el.lives.innerHTML = '';

    for (var i = 0; i < LIVES; i++) {
      var heart = document.createElement('span');
      heart.textContent = '❤️';
      if (i >= state.lives) heart.className = 'gone';
      el.lives.appendChild(heart);
    }

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

  /* ---------- 그리기 ---------- */

  function emojiFont(px) { return Math.round(px) + 'px ' + EMOJI_FONT; }

  function draw() {
    var W = state.W, H = state.H;
    if (!W || !H) return;
    var sy = SURFACE * H;

    // 하늘 · 해 · 구름
    var sky = ctx.createLinearGradient(0, 0, 0, sy);
    sky.addColorStop(0, '#8fd3ff');
    sky.addColorStop(1, '#dff3ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, sy);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = emojiFont(W * 0.11);
    ctx.fillText('☀️', W * 0.88, H * 0.08);
    state.clouds.forEach(function (c) {
      ctx.font = emojiFont(W * c.size);
      ctx.fillText('☁️', c.x * W, c.y * H);
    });

    // 물
    var sea = ctx.createLinearGradient(0, sy, 0, H);
    sea.addColorStop(0, '#5ec2f5');
    sea.addColorStop(1, '#1b6fb8');
    ctx.fillStyle = sea;
    ctx.fillRect(0, sy, W, H - sy);

    // 바닥 모래와 장식
    var by = SEABED * H;
    ctx.fillStyle = '#e8d59a';
    ctx.beginPath();
    ctx.moveTo(0, by + H * 0.02);
    for (var x = 0; x <= W; x += 20) {
      ctx.lineTo(x, by + Math.sin(x / W * 9) * H * 0.008);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.textBaseline = 'bottom';
    state.decor.forEach(function (d) {
      ctx.font = emojiFont(W * d.size);
      ctx.fillText(d.emoji, d.x * W, by + H * 0.012);
    });
    ctx.textBaseline = 'middle';

    // 물고기 (걸린 것은 바늘에서 그립니다)
    var hook = state.hook;
    for (var i = 0; i < state.fish.length; i++) {
      var f = state.fish[i];
      if (f === hook.catch) continue;
      drawFish(f, f.x * W, fishY(f) * H, f.dir > 0, Math.sin(state.time * 6 + f.phase) * 0.06);
    }

    // 공기 방울
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    for (var b = 0; b < state.bubbles.length; b++) {
      var bb = state.bubbles[b];
      ctx.beginPath();
      ctx.arc(bb.x * W + Math.sin(bb.t * 5) * 3, bb.y * H, bb.r * W * (1 + bb.t * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    }

    drawBoatAndLine();

    // 물 표면 — 배 아랫부분 위로 물결 띠를 덧그려 배가 물에 잠겨 보이게
    ctx.fillStyle = 'rgba(94, 194, 245, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, sy);
    for (var wx = 0; wx <= W; wx += 8) {
      ctx.lineTo(wx, sy + Math.sin(wx / W * 14 + state.time * 2.2) * H * 0.006);
    }
    ctx.lineTo(W, sy + H * 0.035);
    ctx.lineTo(0, sy + H * 0.035);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var lx = 0; lx <= W; lx += 8) {
      var ly = sy + Math.sin(lx / W * 14 + state.time * 2.2) * H * 0.006;
      if (lx === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
    }
    ctx.stroke();

    // 잡은 것이 배 위로 떠오릅니다
    for (var p = 0; p < state.pops.length; p++) {
      var pop = state.pops[p];
      if (pop.t < 0) continue;
      ctx.globalAlpha = 1 - pop.t / 0.9;
      ctx.font = emojiFont(W * 0.09);
      ctx.fillText(pop.emoji, pop.x * W, pop.y * H - pop.t * H * 0.12);
    }
    ctx.globalAlpha = 1;
  }

  // 이모지 물고기는 왼쪽을 보고 있어서 오른쪽으로 갈 때는 뒤집어 그립니다 (쓰레기는 방향이 없어 그대로)
  function drawFish(f, px, py, flip, tilt) {
    var size = FISH_SIZE * f.size * state.W;
    ctx.save();
    ctx.translate(px, py);
    if (flip && f.kind !== 'trash') ctx.scale(-1, 1);
    ctx.rotate(tilt);
    ctx.font = emojiFont(size);
    ctx.fillText(f.emoji, 0, 0);
    ctx.restore();
  }

  function drawBoatAndLine() {
    var W = state.W, H = state.H;
    var sy = SURFACE * H;
    var bx = state.x * W;
    var bw = BOAT_W * W;
    var bh = bw * 0.28;
    var bob = Math.sin(state.time * 2.2 + state.x * 14) * H * 0.006;   // 물결에 맞춰 까딱
    var hook = state.hook;

    var tipX = (state.x - ROD_DX) * W;
    var tipY = (SURFACE - ROD_DY) * H + bob;
    var hx = hook.x * W;
    var hy = hook.y * H;

    ctx.save();
    ctx.translate(bx, sy + bob);
    ctx.rotate(state.lean * 0.05);

    // 배 몸통 — 위가 넓고 아래가 좁은 통
    ctx.fillStyle = '#c96a3c';
    ctx.beginPath();
    ctx.moveTo(-bw / 2, -bh * 0.15);
    ctx.lineTo(bw / 2, -bh * 0.15);
    ctx.quadraticCurveTo(bw * 0.42, bh * 0.75, bw * 0.28, bh * 0.8);
    ctx.lineTo(-bw * 0.28, bh * 0.8);
    ctx.quadraticCurveTo(-bw * 0.42, bh * 0.75, -bw / 2, -bh * 0.15);
    ctx.closePath();
    ctx.fill();
    // 뱃전 줄무늬
    ctx.fillStyle = '#f2b27a';
    ctx.fillRect(-bw / 2, -bh * 0.15, bw, bh * 0.16);
    ctx.fillStyle = '#8e4526';
    ctx.fillRect(-bw / 2, bh * 0.01, bw, bh * 0.06);

    // 다니 — 배 위 오른쪽에 서서 왼쪽(낚싯대 쪽)을 봅니다
    if (dani.complete && dani.naturalWidth) {
      var dw = bw * 0.48;
      var dh = dw * dani.naturalHeight / dani.naturalWidth;
      ctx.drawImage(dani, bw * 0.12 - dw / 2, -bh * 0.15 - dh * 0.92, dw, dh);
    }
    ctx.restore();

    // 낚싯대 — 다니 손에서 왼쪽 위로
    var handX = bx + bw * 0.04, handY = sy + bob - bh * 0.15 - bw * 0.24;
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = Math.max(3, bw * 0.02);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // 줄
    ctx.strokeStyle = 'rgba(40, 40, 60, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(hx, hy - bw * 0.05);
    ctx.stroke();

    // 걸린 것
    if (hook.catch) {
      var f = hook.catch;
      drawFish(f, hx, hy + FISH_SIZE * f.size * W * 0.25, false, Math.sin(state.time * 14) * 0.25 + (f.kind === 'trash' ? 0 : 1.2));
    }

    // 바늘 — J 모양
    var r = Math.max(4, bw * 0.03);
    ctx.strokeStyle = '#3a3a48';
    ctx.lineWidth = Math.max(2, bw * 0.012);
    ctx.beginPath();
    ctx.moveTo(hx, hy - bw * 0.05);
    ctx.lineTo(hx, hy);
    ctx.arc(hx - r, hy, r, 0, Math.PI, false);
    ctx.lineTo(hx - r * 2, hy - r * 0.6);
    ctx.stroke();
  }

  /* ---------- 화면에 맞추기 ----------
   * 놀이판이 아래 단추까지 포함해 스크롤 없이 한 화면에 들어오게 합니다. */

  function px(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function fit() {
    var top = el.field.getBoundingClientRect().top;
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var wrapEl = document.querySelector('.wrap');
    var ctrl = document.querySelector('.fish-controls');
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var ctrlH = ctrl ? ctrl.offsetHeight + px(getComputedStyle(ctrl).marginTop) : 0;

    var H = Math.max(300, Math.floor(screenH - top - ctrlH - bottomPad - 6));
    el.field.style.height = H + 'px';
    var W = el.field.clientWidth;

    state.W = W;
    state.H = H;

    var dpr = window.devicePixelRatio || 1;
    el.canvas.width = Math.round(W * dpr);
    el.canvas.height = Math.round(H * dpr);
    el.canvas.style.width = W + 'px';
    el.canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });
  dani.addEventListener('load', draw);

  /* ---------- 손가락 · 단추 · 키보드 ---------- */

  function pointToX(clientX) {
    var r = el.canvas.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / state.W));
  }

  // 물에 손가락을 대고 끌면 배가 따라오고, 끌지 않고 톡 치면 🎣 입니다
  var touch = { on: false, startX: 0, startT: 0, dragged: false };

  el.canvas.addEventListener('pointerdown', function (e) {
    touch.on = true;
    touch.startX = e.clientX;
    touch.startT = Date.now();
    touch.dragged = false;
    try { el.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    e.preventDefault();
  });

  el.canvas.addEventListener('pointermove', function (e) {
    if (!touch.on) return;
    if (!touch.dragged && Math.abs(e.clientX - touch.startX) > 10) touch.dragged = true;
    if (touch.dragged) state.targetX = pointToX(e.clientX);
    e.preventDefault();
  });

  function letGo(e) {
    if (!touch.on) return;
    touch.on = false;
    state.targetX = null;
    if (e.type === 'pointerup' && !touch.dragged && Date.now() - touch.startT < 400) cast();
  }
  el.canvas.addEventListener('pointerup', letGo);
  el.canvas.addEventListener('pointercancel', letGo);

  // ◀ ▶ 는 누르고 있는 동안 계속 밉니다
  function bindHold(btn, dir) {
    function press(e) {
      state.hold = dir;
      btn.classList.add('down');
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      e.preventDefault();
    }
    function release() {
      if (state.hold === dir) state.hold = 0;
      btn.classList.remove('down');
    }
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
  }
  bindHold(el.leftBtn, -1);
  bindHold(el.rightBtn, 1);

  el.castBtn.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    cast();
  });

  var keys = { ArrowLeft: -1, ArrowRight: 1, a: -1, d: 1 };

  document.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') {
      if (state.running) { cast(); e.preventDefault(); }
      return;
    }
    var dir = keys[e.key];
    if (dir === undefined) return;
    state.hold = dir;
    e.preventDefault();
  });

  document.addEventListener('keyup', function (e) {
    var dir = keys[e.key];
    if (dir === undefined) return;
    if (state.hold === dir) state.hold = 0;
  });
})();
