/* =========================================================================
 * 다니랜드 - 활쏘기
 *
 * 다니가 왼쪽에 서서 활을 들고 있고, 오른쪽에서는 나뭇가지에 줄로 매달린 사과(🍎)가 위아래로 오르락내리락합니다.
 * 화살은 늘 활 높이로 곧장 오른쪽으로 날아가므로 조준은 없고 **타이밍**만 봅니다 — 사과가 화살 높이에 올 때를
 * 헤아려 쏘는 놀이입니다 (사용자가 '타이밍만' 을 고름, 2026-09-29). 판 아무 데나 누르거나 🏹 쏘기 단추,
 * 컴퓨터에서는 스페이스·엔터. 화살은 한 번에 한 발만 날아갑니다 (마구 눌러 맞히지 못하게).
 * 빗나간 화살은 오른쪽 짚단에 꽂혀 남습니다 — 벌이 아니라 어디로 갔는지 보여 주는 것입니다.
 *
 * 단계마다 맞힐 사과 수(levelGoal)와 화살 수(levelArrows)가 정해져 있고, 다 맞히면 다음 단계, 화살을 다 쓰면 그 판이
 * 끝납니다 (다른 놀이의 하트 자리에 화살통을 둡니다). 갈수록 사과가 빨라지고(2단계), 둘·셋으로 늘고(3·5단계),
 * 작아지고(4단계~), 오르내리는 폭이 제각각이 되고(4단계~) 가다가 방향을 바꿉니다(5단계~).
 * **사과가 오르내리는 폭에는 늘 활 높이가 들어 있어야 합니다** — 안 그러면 절대 못 맞히는 사과가 됩니다 (rollApple).
 *
 * 2단계부터 가끔 황금 사과가 작고 빠르게 내려왔다가 잠시 뒤 올라가 버립니다. 맞히면 ⭐ 셋 + 화살 두 개.
 *
 * 기록은 낚시와 같이 '몇 단계까지 갔는가' (daniland.best.archery.level) 이고, 시작 화면에서
 * 그 단계까지 중에 시작할 단계를 고릅니다. ⭐ 는 한 판에서 맞힌 사과 수입니다 (황금 사과는 셋).
 *
 * 좌표는 전부 화면 비율입니다 (가로는 놀이판 너비의 0~1, 세로는 높이의 0~1). 그릴 때만 px 로 바꿉니다.
 * ========================================================================= */

(function () {
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '명사수!'];

  // 단계별 어려움 — 이 단계에서 맞힐 수, 주는 화살 수, 매달린 사과 수, 오르내리는 빠르기(높이/초), 사과 크기 배수
  function levelGoal(n)   { return Math.min(8, 2 + n); }
  function levelArrows(n) { return levelGoal(n) * 2 + 1; }
  function levelCount(n)  { return n < 3 ? 1 : (n < 5 ? 2 : 3); }
  function levelSpeed(n)  { return Math.min(0.75, 0.22 + 0.07 * (n - 1)); }
  function levelSize(n)   { return n < 4 ? 1 : Math.max(0.65, 1 - 0.1 * (n - 3)); }

  var BRANCH_Y = 0.055;     // 사과가 매달린 나뭇가지 (높이 배수)
  var GROUND_Y = 0.88;      // 풀밭이 시작하는 곳
  var BOW_Y = 0.64;         // 화살이 날아가는 높이
  var TOP = 0.2;            // 사과 가운데가 오르내리는 범위
  var BOTTOM = 0.8;
  var WALL_X = 0.93;        // 오른쪽 짚단 (화살이 꽂히는 곳)
  var APPLE_R = 0.075;      // 사과 반지름 — min(너비 × 이것, 높이 × APPLE_RH) px
  var APPLE_RH = 0.066;
  var ARROW_SPEED = 1.35;   // 화살 빠르기 (너비/초)
  var GOLD_EVERY = [6, 10]; // 황금 사과가 나오는 사이 (초)
  var GOLD_LIFE = 6;        // 황금 사과가 머무는 시간 (초)
  var RESPAWN = 0.7;        // 맞힌 사과 자리에 새 사과가 내려오기까지 (초)

  // 다니 그림 (코디 놀이의 평상복 다니) — 활을 쥔 손 자리와 발끝 (그림 크기 배수)
  var DANI_H = 0.58;        // 그림 높이 (놀이판 높이 배수)
  var HAND_X = 0.76, HAND_Y = 0.64, FEET_Y = 0.975;

  var BEST_KEY = 'daniland.best.archery.level';
  var START_KEY = 'daniland.archeryStart';

  var EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", serif';

  var el = {
    field: document.getElementById('field'),
    canvas: document.getElementById('canvas'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    levelChip: document.getElementById('levelChip'),
    quiver: document.getElementById('quiver'),
    banner: document.getElementById('banner'),
    backBtn: document.getElementById('backBtn'),
    shootBtn: document.getElementById('shootBtn'),

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
  dani.src = 'dress/costume-basic.png';

  var state = {
    startLevel: parseInt(UI.loadValue(START_KEY), 10) || 1,
    level: 1,
    score: 0,         // 한 판 통틀어 ⭐
    hit: 0,           // 한 판 통틀어 맞힌 사과
    levelHit: 0,      // 이 단계에서 맞힌 사과
    arrows: 0,        // 화살통에 남은 화살
    running: false,
    W: 0, H: 0,       // 놀이판 px
    time: 0,
    arrow: null,      // 날아가는 화살 { x } (x 는 화살촉, 너비 배수) — 없으면 null
    draw: 0,          // 시위가 당겨진 정도 0~1 (쏘고 나면 0 에서 다시 차오릅니다)
    apples: [],       // { x, y, dir, speed, lo, hi, size, gold, life, flipT, sway }
    pending: [],      // 새로 내려올 사과 자리 { t, x }
    goldT: 0,         // 다음 황금 사과까지 남은 시간
    stuck: [],        // 짚단에 꽂힌 화살 { y, tilt }
    bits: [],         // 사과 조각 { x, y, vx, vy, r, color, t }
    pops: [],         // 떠오르는 ⭐ { text, x, y, t }
    clouds: [],
    outT: -1          // 화살을 다 쓰고 끝나기까지 남은 시간 (-1 이면 아님)
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
  bindGo(el.backBtn, Catalog.backHref('archery.html'));
  bindGo(el.startHome, Catalog.backHref('archery.html'));
  bindGo(el.endHome, Catalog.backHref('archery.html'));

  function bindGo(btn, href) {
    btn.addEventListener('click', function () { window.location.href = href; });
  }

  /* ---------- 시작 단계 고르기 ----------
   * 낚시와 같은 규칙 — 지금까지 간 최고 단계까지만 (1단계 · 중간 · 최고). */

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

  function buildScenery() {
    state.clouds = [];
    for (var i = 0; i < 3; i++) {
      state.clouds.push({ x: Math.random(), y: 0.13 + i * 0.07, size: 0.08 + Math.random() * 0.04, speed: 0.008 + Math.random() * 0.008 });
    }
  }

  /* ---------- 자리 ---------- */

  // 다니 그림의 크기와 자리 (px) — 손이 활 높이, 그림 왼쪽 빈 곳은 판 밖으로 조금 잘립니다
  function daniBox() {
    var h = DANI_H * state.H;
    var w = h * 0.6;                       // 그림이 600×1000
    var handX = w * (HAND_X - 0.14);
    return { x: handX - w * HAND_X, y: BOW_Y * state.H - h * HAND_Y, w: w, h: h, handX: handX };
  }

  function bowX() { return state.W ? daniBox().handX / state.W : 0.2; }

  // 사과가 매달릴 수 있는 가로 범위 — 활에서 조금 떨어진 곳부터 짚단 앞까지
  function appleRange() {
    var lo = Math.min(0.6, bowX() + 0.2);
    return { lo: lo, hi: WALL_X - 0.08 };
  }

  function appleR(a) {
    return Math.min(state.W * APPLE_R, state.H * APPLE_RH) * a.size;
  }

  // 사과를 몇 개 매달 때 n 번째 자리 (고르게 나누고 조금 흔듭니다)
  function columnX(i, count) {
    var r = appleRange();
    var step = (r.hi - r.lo) / count;
    return r.lo + step * (i + 0.5) + (Math.random() - 0.5) * step * 0.3;
  }

  /* ---------- 한 판 ---------- */

  function startRun() {
    clearTimeout(bannerTimer);
    hideBanner();

    state.level = state.startLevel;
    state.score = 0;
    state.hit = 0;

    updateScore();
    startLevel(state.level);
  }

  function startLevel(n) {
    state.levelHit = 0;
    state.arrows = levelArrows(n);
    state.arrow = null;
    state.draw = 1;
    state.stuck = [];
    state.bits = [];
    state.pops = [];
    state.pending = [];
    state.outT = -1;
    state.goldT = n >= 2 ? rand(GOLD_EVERY[0], GOLD_EVERY[1]) : -1;
    state.running = true;

    state.apples = [];
    var count = levelCount(n);
    for (var i = 0; i < count; i++) {
      var a = rollApple(n, columnX(i, count), false);
      a.y = a.lo + Math.random() * (a.hi - a.lo);    // 처음에는 이미 매달려 있습니다
      state.apples.push(a);
    }

    el.levelChip.textContent = n + '단계';
    el.bar.style.width = '0%';
    updateQuiver();
    fit();

    lastT = 0;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  // 새 사과 — 나뭇가지 위에서 줄을 타고 내려옵니다
  function rollApple(level, x, gold) {
    var lo = TOP, hi = BOTTOM;
    // 4단계부터 오르내리는 폭이 사과마다 다릅니다 — 그래도 활 높이는 꼭 지나가게
    if (level >= 4 && !gold) {
      lo = rand(TOP, BOW_Y - 0.12);
      hi = rand(BOW_Y + 0.06, BOTTOM);
    }
    var speed = levelSpeed(level) * rand(0.8, 1.2);
    if (gold) speed *= 1.6;
    return {
      x: x,
      y: -0.08,
      dir: 1,
      speed: speed,
      lo: lo,
      hi: hi,
      size: gold ? Math.max(0.55, levelSize(level) * 0.7) : levelSize(level),
      gold: gold,
      life: gold ? GOLD_LIFE : -1,
      flipT: level >= 5 ? rand(1.2, 3) : -1,
      sway: Math.random() * Math.PI * 2
    };
  }

  /* ---------- 매 화면 ---------- */

  function tick(t) {
    if (!state.running) return;
    frame = requestAnimationFrame(tick);

    // 탭을 숨겼다 돌아와도 한꺼번에 훌쩍 지나가지 않게 한 번에 최대 50ms 만 갑니다
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;

    update(dt);
    if (state.running) draw();
  }

  function update(dt) {
    state.time += dt;
    state.draw = Math.min(1, state.draw + dt * 4);

    state.clouds.forEach(function (c) {
      c.x += c.speed * dt;
      if (c.x > 1.15) c.x = -0.15;
    });

    // 사과 — 범위 끝에서 되돌아옵니다. 황금 사과는 때가 되면 위로 올라가 사라집니다.
    for (var i = state.apples.length - 1; i >= 0; i--) {
      var a = state.apples[i];
      a.y += a.dir * a.speed * dt;

      if (a.gold && a.life > 0) {
        a.life -= dt;
        if (a.life <= 0) { a.dir = -1; a.lo = -0.3; }
      }
      if (a.gold && a.life <= 0) {
        if (a.y < -0.15) { state.apples.splice(i, 1); state.goldT = rand(GOLD_EVERY[0], GOLD_EVERY[1]); }
        continue;
      }

      if (a.flipT > 0 && a.y > a.lo && a.y < a.hi) {
        a.flipT -= dt;
        if (a.flipT <= 0) { a.dir = -a.dir; a.flipT = rand(1.2, 3); }
      }
      if (a.y <= a.lo && a.dir < 0) a.dir = 1;
      if (a.y >= a.hi && a.dir > 0) a.dir = -1;
    }

    // 맞힌 자리에 새 사과
    for (var p = state.pending.length - 1; p >= 0; p--) {
      state.pending[p].t -= dt;
      if (state.pending[p].t <= 0) {
        state.apples.push(rollApple(state.level, state.pending[p].x, false));
        state.pending.splice(p, 1);
      }
    }

    // 황금 사과
    if (state.goldT > 0) {
      state.goldT -= dt;
      if (state.goldT <= 0) {
        var r = appleRange();
        state.apples.push(rollApple(state.level, rand(r.lo, r.hi), true));
      }
    }

    // 화살 — 한 번에 너무 멀리 가서 사과를 건너뛰지 않게 잘게 나눠 움직입니다
    if (state.arrow) {
      var move = ARROW_SPEED * dt;
      var steps = Math.max(1, Math.ceil(move * state.W / 8));
      for (var s = 0; s < steps && state.arrow; s++) {
        state.arrow.x += move / steps;
        checkHit();
        if (state.arrow && state.arrow.x >= WALL_X + 0.01) stickArrow();
      }
    }

    for (var b = state.bits.length - 1; b >= 0; b--) {
      var bit = state.bits[b];
      bit.t += dt;
      bit.vy += 1.6 * dt;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      if (bit.t > 1.2 || bit.y > GROUND_Y + 0.05) state.bits.splice(b, 1);
    }
    for (var q = state.pops.length - 1; q >= 0; q--) {
      state.pops[q].t += dt;
      if (state.pops[q].t > 1) state.pops.splice(q, 1);
    }

    // 화살을 다 썼는데 모자라면 — 마지막 화살이 꽂히는 것을 잠깐 보여 주고 끝냅니다
    if (state.outT < 0 && !state.arrow && state.arrows <= 0 && state.levelHit < levelGoal(state.level)) state.outT = 0.8;
    if (state.outT > 0) {
      state.outT -= dt;
      if (state.outT <= 0) gameOver();
    }
  }

  // 맞혀도 화살은 멈추지 않고 짚단까지 날아갑니다 — 뒤에 겹친 사과까지 한 발에 둘을 맞힐 수 있습니다 (일부러)
  function checkHit() {
    var ax = state.arrow.x * state.W;
    var ay = BOW_Y * state.H;
    for (var i = 0; i < state.apples.length; i++) {
      var a = state.apples[i];
      var r = appleR(a);
      var dx = ax - a.x * state.W;
      var dy = ay - a.y * state.H;
      if (dx * dx + dy * dy < r * r * 0.9) {
        state.apples.splice(i, 1);
        hitApple(a);
        return;
      }
    }
  }

  function hitApple(a) {
    burstBits(a);
    state.hit += 1;
    state.levelHit += 1;

    if (a.gold) {
      state.score += 3;
      state.arrows += 2;
      state.goldT = rand(GOLD_EVERY[0], GOLD_EVERY[1]);
      state.pops.push({ text: '⭐+3', x: a.x, y: a.y, t: 0 });
      state.pops.push({ text: '🏹+2', x: a.x, y: a.y + 0.08, t: -0.2 });
      if (window.SFX) SFX.correct();
      updateQuiver();
    } else {
      state.score += 1;
      state.pending.push({ t: RESPAWN, x: a.x });
      state.pops.push({ text: '⭐', x: a.x, y: a.y, t: 0 });
      if (window.SFX) SFX.pop();
    }
    updateScore();

    var goal = levelGoal(state.level);
    el.bar.style.width = Math.min(100, Math.round(state.levelHit / goal * 100)) + '%';
    if (state.levelHit >= goal) levelUp();
  }

  // 사과가 쪼개져 튀는 조각 — 빨강(황금이면 노랑) 껍질과 하얀 속살
  function burstBits(a) {
    var skin = a.gold ? '#f5c518' : '#e8322f';
    for (var i = 0; i < 12; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = rand(0.25, 0.6);
      state.bits.push({
        x: a.x, y: a.y,
        vx: Math.cos(ang) * sp * 0.7 + 0.15,     // 화살이 가던 쪽으로 조금 더
        vy: Math.sin(ang) * sp - 0.3,
        r: rand(0.008, 0.016),
        color: i % 3 === 0 ? '#fff6dc' : skin,
        t: 0
      });
    }
  }

  function stickArrow() {
    state.stuck.push({ y: BOW_Y + (Math.random() - 0.5) * 0.01, tilt: (Math.random() - 0.5) * 0.08 });
    if (state.stuck.length > 14) state.stuck.shift();
    state.arrow = null;
    if (window.SFX) SFX.thud();
    updateShootBtn();
  }

  function shoot() {
    if (!state.running || state.arrow || state.arrows <= 0 || state.draw < 0.6) return;
    state.arrows -= 1;
    state.arrow = { x: bowX() + 0.02 };
    state.draw = 0;
    if (window.SFX) SFX.twang();
    updateQuiver();
  }

  function levelUp() {
    state.running = false;
    cancelAnimationFrame(frame);
    draw();

    el.bar.style.width = '100%';
    state.level += 1;
    UI.saveBest(BEST_KEY, state.level, state.level);

    if (window.SFX) SFX.finish();
    confettiAtField();
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
    draw();

    // 최고 기록은 '몇 단계까지 갔는가' 로 남깁니다
    var prev = UI.readBest(BEST_KEY);
    var isBest = !prev || state.level > prev.stars;
    UI.saveBest(BEST_KEY, state.level, state.level);

    buildStartRow();  // 기록이 올랐으면 고를 수 있는 시작 단계도 늘어납니다

    el.endStars.textContent = '🍎 ' + state.level + '단계';
    el.endTitle.textContent = isBest ? '새 최고 기록! 🏆' : PRAISE[UI.randInt(0, PRAISE.length - 1)];
    el.endText.textContent = '화살을 다 썼어요. '
      + (state.startLevel > 1 ? state.startLevel + '단계에서 시작해서 ' : '')
      + state.level + '단계까지 갔어요. 사과 ' + state.hit + '개를 맞혔어요!';
    el.endOverlay.hidden = false;
  }

  function confettiAtField() {
    var r = el.canvas.getBoundingClientRect();
    var dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.left = (r.left + r.width * 0.6) + 'px';
    dot.style.top = (r.top + r.height * 0.4) + 'px';
    dot.style.width = '0';
    dot.style.height = '0';
    document.body.appendChild(dot);
    UI.confettiAt(dot);
    dot.remove();
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.score; }

  // 화살통 — 남은 화살 수 (날아가는 중에는 단추를 살짝 흐리게)
  function updateQuiver() {
    el.quiver.textContent = '🏹 ' + state.arrows;
    el.quiver.classList.toggle('low', state.arrows <= 2);
    updateShootBtn();
  }

  function updateShootBtn() {
    el.shootBtn.classList.toggle('busy', !!state.arrow || state.arrows <= 0);
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

    // 하늘 · 해 · 구름
    var sky = ctx.createLinearGradient(0, 0, 0, H * GROUND_Y);
    sky.addColorStop(0, '#8fd3ff');
    sky.addColorStop(1, '#e6f7ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = emojiFont(Math.min(W, H) * 0.12);
    ctx.fillText('☀️', W * 0.1, H * 0.16);
    state.clouds.forEach(function (c) {
      ctx.font = emojiFont(Math.min(W, H) * c.size * 1.3);
      ctx.fillText('☁️', c.x * W, c.y * H);
    });

    // 풀밭
    ctx.fillStyle = '#9ad86b';
    ctx.fillRect(0, GROUND_Y * H, W, H * (1 - GROUND_Y));
    ctx.fillStyle = '#7cc450';
    ctx.fillRect(0, GROUND_Y * H, W, H * 0.012);

    drawBranch();
    drawWall();

    // 화살 길 — 옅은 점선 (어디로 날아가는지 알려 줍니다)
    var bx = bowX() * W, by = BOW_Y * H;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(bx + arrowLen() * 0.4, by);
    ctx.lineTo(WALL_X * W, by);
    ctx.stroke();
    ctx.restore();

    // 사과와 줄
    state.apples.forEach(drawApple);

    // 꽂힌 화살
    state.stuck.forEach(function (s) {
      drawArrow(WALL_X * W + arrowLen() * 0.18, s.y * H, s.tilt);
    });

    drawArcher();

    if (state.arrow) drawArrow(state.arrow.x * W, by, 0);

    // 사과 조각
    state.bits.forEach(function (b) {
      ctx.globalAlpha = Math.max(0, 1 - b.t / 1.2);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x * W, b.y * H, b.r * Math.min(W, H) * 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 떠오르는 ⭐
    state.pops.forEach(function (p) {
      if (p.t < 0) return;
      ctx.globalAlpha = Math.max(0, 1 - p.t);
      ctx.font = 'bold ' + Math.round(Math.min(W, H) * 0.07) + 'px ' + EMOJI_FONT;
      ctx.fillStyle = '#ff6f91';
      ctx.fillText(p.text, p.x * W, p.y * H - p.t * H * 0.1);
    });
    ctx.globalAlpha = 1;
  }

  function drawBranch() {
    var W = state.W, H = state.H;
    var y = BRANCH_Y * H;
    ctx.strokeStyle = '#8a5a34';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(8, H * 0.022);
    ctx.beginPath();
    ctx.moveTo(appleRange().lo * W - W * 0.12, y - H * 0.02);
    ctx.quadraticCurveTo(W * 0.7, y + H * 0.015, W * 1.02, y - H * 0.01);
    ctx.stroke();

    ctx.font = emojiFont(Math.min(W, H) * 0.07);
    for (var i = 0; i < 7; i++) {
      var lx = appleRange().lo - 0.1 + i * 0.1;
      ctx.fillText(i % 2 ? '🍃' : '🌿', lx * W, y + (i % 2 ? -1 : 1) * H * 0.02);
    }
  }

  // 오른쪽 짚단 — 화살이 꽂히는 곳 (활 높이 둘레에 과녁 무늬)
  function drawWall() {
    var W = state.W, H = state.H;
    var x = WALL_X * W;
    var top = H * 0.28, bottom = GROUND_Y * H;
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(x, top, W - x, bottom - top);
    ctx.strokeStyle = 'rgba(160, 110, 30, 0.45)';
    ctx.lineWidth = 2;
    for (var y = top + 12; y < bottom; y += 16) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(W, y + 4);
      ctx.stroke();
    }
    var cy = BOW_Y * H, rr = (W - x) * 0.9;
    ['#ffffff', '#ff6f91', '#ffffff'].forEach(function (c, i) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(W, cy, rr * (1 - i * 0.3), Math.PI / 2, Math.PI * 1.5);
      ctx.fill();
    });
  }

  function drawApple(a) {
    var W = state.W, H = state.H;
    var r = appleR(a);
    var x = a.x * W + Math.sin(state.time * 2 + a.sway) * r * 0.08;
    var y = a.y * H;

    // 줄
    ctx.strokeStyle = 'rgba(90, 60, 30, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x * W, BRANCH_Y * H);
    ctx.lineTo(x, y - r * 0.85);
    ctx.stroke();

    if (a.gold) {
      // 황금 사과 — 그림 글자로는 없어서 직접 그립니다
      var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, '#fff7c2');
      g.addColorStop(0.5, '#ffd23f');
      g.addColorStop(1, '#d99a00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x - r * 0.28, y, r * 0.72, 0, Math.PI * 2);
      ctx.arc(x + r * 0.28, y, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6b8e23';
      ctx.beginPath();
      ctx.ellipse(x + r * 0.28, y - r * 0.8, r * 0.28, r * 0.12, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = emojiFont(r * 0.8);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(state.time * 8);
      ctx.fillText('✨', x + r * 0.9, y - r * 0.6);
      ctx.fillText('✨', x - r * 0.9, y + r * 0.5);
      ctx.globalAlpha = 1;
    } else {
      ctx.font = emojiFont(r * 2);
      ctx.fillText('🍎', x, y + r * 0.08);
    }
  }

  function arrowLen() { return Math.max(46, Math.min(90, state.W * 0.1)); }

  // 화살 — (x, y) 가 화살촉 끝
  function drawArrow(x, y, tilt) {
    var len = arrowLen();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.strokeStyle = '#8a5a34';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-8, 0);
    ctx.stroke();
    ctx.fillStyle = '#6b6b78';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-11, -5);
    ctx.lineTo(-11, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff6f91';
    ctx.beginPath();
    ctx.moveTo(-len + 12, 0);
    ctx.lineTo(-len - 2, -6);
    ctx.lineTo(-len + 4, 0);
    ctx.lineTo(-len - 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawArcher() {
    var H = state.H;
    var box = daniBox();

    if (dani.complete && dani.naturalWidth) {
      ctx.drawImage(dani, box.x, box.y, box.w, box.h);
    } else {
      ctx.font = emojiFont(box.h * 0.5);
      ctx.fillText('🧒', box.x + box.w * 0.5, box.y + box.h * 0.55);
    }

    // 활 — 손에서 오른쪽으로 휜 나무, 시위는 당겨질수록 뒤로
    var hx = box.handX, hy = BOW_Y * H;
    var R = H * 0.12;
    var cx = hx - R * 0.55;
    var ang = 1.0;
    var ex = cx + R * Math.cos(ang), ey = R * Math.sin(ang);
    var ready = !state.arrow && state.arrows > 0;
    var pull = ready ? state.draw : 0;
    var nx = ex - R * 0.55 * pull;

    ctx.strokeStyle = 'rgba(60, 60, 70, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex, hy - ey);
    ctx.lineTo(nx, hy);
    ctx.lineTo(ex, hy + ey);
    ctx.stroke();

    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth = Math.max(5, H * 0.012);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, hy, R, -ang, ang);
    ctx.stroke();

    // 시위에 걸린 화살
    if (ready) drawArrow(nx + arrowLen(), hy, 0);
  }

  /* ---------- 화면에 맞추기 ---------- */

  function px(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function fit() {
    var top = el.field.getBoundingClientRect().top;
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var wrapEl = document.querySelector('.wrap');
    var ctrl = document.querySelector('.archery-controls');
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

  /* ---------- 손가락 · 단추 · 키보드 ----------
   * 타이밍 놀이라 click 이 아니라 누르는 순간(pointerdown)에 쏩니다. */

  el.canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    shoot();
  });

  el.shootBtn.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    shoot();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      if (state.running) { shoot(); e.preventDefault(); }
    }
  });
})();
