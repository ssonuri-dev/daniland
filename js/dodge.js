/* =========================================================================
 * 다니랜드 - 장애물 피하기
 *
 * 길이 위에서 아래로 흘러오고, 다니는 화면 아래쪽에 서서 좌우로만 움직입니다.
 * 내려오는 장애물(🪨 🌵 🐌 …)을 피해 깃발 🏁 까지 가면 다음 단계, 단계가 올라갈수록
 * 길이 더 빨리 흐르고 장애물이 더 촘촘해집니다. 간식(🦴 🍎 …)을 먹으면 ⭐ 하나.
 *
 * 하트 ❤️ 세 개로 시작해 부딪힐 때마다 하나씩 사라지고(잠깐 깜빡이는 동안은 안 다칩니다),
 * 다 없어지면 그 판이 끝납니다.
 *
 * 기록은 '얼마나 멀리 달렸나(m)' 입니다 — 단계를 넘어가도 계속 쌓이는 거리라 지난 판과 견주기 쉽습니다
 * (놀이판 높이 하나가 METER_PER_H 미터, 1단계 끝이 80m 남짓). 이 기기에서 한 판들 중 잘한 순서로
 * RANK_SIZE 개를 순위표(daniland.rank.dodge)에 남겨 시작 화면과 결과 화면에 보여 주고,
 * 카드의 ⭐ 는 그중 1등(daniland.best.dodge.m)입니다. 시작 단계 고르기는 풍선 터뜨리기처럼
 * '몇 단계까지 갔는가'(daniland.best.dodge.level)를 따로 봅니다.
 *
 * 움직이기: 길에 손가락을 대면 다니가 그쪽으로 달려가고, 아래 ◀ ▶ 단추를 누르고 있어도 됩니다.
 * 컴퓨터에서는 화살표 키.
 *
 * 길은 다섯 줄(LANES)로 나눠 장애물을 놓습니다. 매 줄마다 '안전한 줄' 하나를 정해 두고
 * 그 줄은 비워 두며, 안전한 줄은 한 번에 한 칸씩만 옆으로 옮깁니다 — 그래서 어느 단계든
 * 옆으로 한 칸씩만 움직여 끝까지 갈 수 있는 길이 반드시 있습니다.
 *
 * 좌표는 전부 화면 비율입니다 (가로는 길 너비의 0~1, 세로·거리는 놀이판 높이 배수).
 * 화면이 돌아가도 놀이가 깨지지 않게 그릴 때만 px 로 바꿉니다.
 * ========================================================================= */

(function () {
  var LIVES = 3;
  var LANES = 5;

  var OBSTACLES = ['🪨', '🌵', '🐌', '🚧', '🪵', '🐢', '🍄'];
  var TREATS = ['🦴', '🍖', '🍎', '🍓', '🧁', '🍪'];
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '달리기 박사!'];

  // 단계별 어려움 — 길이 흐르는 빠르기(놀이판 높이/초), 줄 사이 거리(높이 배수), 줄 수, 한 줄의 장애물 수
  function levelSpeed(n) { return Math.min(1.0, 0.35 + 0.05 * (n - 1)); }
  function levelGap(n)   { return Math.max(0.45, 0.85 - 0.05 * (n - 1)); }
  function levelRows(n)  { return 8 + 2 * (n - 1); }
  function levelMaxObs(n) { return n <= 2 ? 1 : (n <= 5 ? 2 : 3); }   // LANES - 2 를 넘기지 마세요

  var DANI_W = 0.2;         // 다니 너비 (길 너비 배수)
  var DANI_Y = 0.85;        // 다니가 서 있는 높이 (놀이판 높이 배수)
  var DANI_SPEED = 1.7;     // 좌우 빠르기 (길 너비/초)
  var OBS_SIZE = 0.17;      // 장애물 글자 크기 (길 너비 배수)
  var GRASS = 0.06;         // 양옆 풀밭 너비 (놀이판 너비 배수)
  var SAFE_TIME = 1.3;      // 부딪힌 뒤 안 다치는 시간(초)
  var FIRST_ROW = -0.4;     // 첫 줄이 놓이는 자리 (화면 위 살짝 바깥)

  var METER_PER_H = 10;     // 놀이판 높이 하나 = 10m (숫자가 너무 크지도 작지도 않게)
  var RANK_SIZE = 5;
  var MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

  var BEST_KEY = 'daniland.best.dodge.level';   // 시작 단계 고르기용 — 몇 단계까지 갔나
  var BEST_M_KEY = 'daniland.best.dodge.m';     // 카드의 ⭐ — 제일 멀리 간 거리
  var RANK_KEY = 'daniland.rank.dodge';         // 순위표 [{ m, level, treats }, …] 먼 순서
  var START_KEY = 'daniland.dodgeStart';

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

    startOverlay: document.getElementById('startOverlay'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),
    startPick: document.getElementById('startPick'),
    levelRow: document.getElementById('levelRow'),
    startRank: document.getElementById('startRank'),
    endRank: document.getElementById('endRank'),

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
    treats: 0,        // 한 판 통틀어 먹은 간식 수 (⭐)
    runDist: 0,       // 이 판에서 앞 단계들까지 다 더한 거리 (높이 배수) — dist 는 이번 단계 것만
    shownM: -1,       // 마지막으로 화면에 적은 m (매 화면 글자를 다시 쓰지 않으려고)
    running: false,
    W: 0, H: 0,       // 놀이판 px
    dist: 0,          // 이 단계에서 지금까지 흐른 거리 (높이 배수)
    finish: 0,        // 깃발 자리 (높이 배수, 음수)
    objects: [],      // { kind: 'obs'|'treat', emoji, lane, wy, done }
    pops: [],         // ⭐ 가 떠오르는 효과 { x, y, t }
    x: 0.5,           // 다니 자리 (길 너비 0~1)
    targetX: null,    // 손가락이 가리키는 자리 (없으면 null)
    hold: 0,          // 단추·키로 미는 방향 -1 / 0 / 1
    safe: 0,          // 부딪힌 뒤 남은 안전 시간(초)
    lean: 0           // 움직이는 방향으로 살짝 기울기 (-1~1)
  };

  var frame = null;     // requestAnimationFrame 손잡이
  var lastT = 0;
  var bannerTimer = null;

  buildStartRow();
  showRank(el.startRank, loadRank(), -1);
  fit();
  draw();

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
      if ((pages[i].href || '').indexOf('dodge.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
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

  /* ---------- 한 판 ---------- */

  function startRun() {
    clearTimeout(bannerTimer);
    hideBanner();

    state.level = state.startLevel;
    state.treats = 0;
    state.runDist = 0;
    state.lives = LIVES;

    updateScore();
    updateLives();
    startLevel(state.level);
  }

  function startLevel(n) {
    buildStage(n);
    state.dist = 0;
    state.x = 0.5;
    state.targetX = null;
    state.safe = 0;
    state.pops = [];
    state.running = true;

    state.shownM = -1;
    updateChip();
    el.bar.style.width = '0%';
    fit();

    lastT = 0;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  // 한 단계의 장애물·간식·깃발 자리를 미리 다 정해 둡니다
  function buildStage(n) {
    var rows = levelRows(n);
    var gap = levelGap(n);
    var maxObs = Math.min(levelMaxObs(n), LANES - 2);
    var safe = UI.randInt(0, LANES - 1);
    var objs = [];
    var wy = FIRST_ROW;
    var lanes = [];
    for (var l = 0; l < LANES; l++) lanes.push(l);

    for (var r = 0; r < rows; r++) {
      // 안전한 줄은 한 칸씩만 옮깁니다 — 그래야 늘 피할 수 있습니다
      safe = Math.max(0, Math.min(LANES - 1, safe + UI.randInt(-1, 1)));

      var count = maxObs === 1 ? 1 : UI.randInt(1, maxObs);
      var pick = UI.shuffle(lanes.filter(function (x) { return x !== safe; })).slice(0, count);
      pick.forEach(function (lane) {
        objs.push({ kind: 'obs', emoji: OBSTACLES[UI.randInt(0, OBSTACLES.length - 1)], lane: lane, wy: wy, done: false });
      });

      // 줄과 줄 사이에 가끔 간식 — 안전한 줄에 두어 먹으러 가다 다치지 않게
      if (Math.random() < 0.45) {
        objs.push({ kind: 'treat', emoji: TREATS[UI.randInt(0, TREATS.length - 1)], lane: safe, wy: wy - gap / 2, done: false });
      }

      wy -= gap;
    }

    state.objects = objs;
    state.finish = wy - 0.3;
  }

  /* ---------- 매 화면 ---------- */

  function tick(t) {
    if (!state.running) return;
    frame = requestAnimationFrame(tick);

    // 탭을 숨겼다 돌아와도 한꺼번에 훌쩍 흐르지 않게 한 번에 최대 50ms 만 갑니다
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;

    update(dt);
    draw();
  }

  function update(dt) {
    var W = state.W, H = state.H;

    // 길이 흐릅니다
    state.dist += levelSpeed(state.level) * dt;
    if (state.safe > 0) state.safe -= dt;

    // 다니 좌우 — 손가락이 가리키는 곳으로, 아니면 단추·키가 미는 쪽으로
    var step = DANI_SPEED * dt;
    var dir = 0;
    if (state.targetX !== null) {
      var d = state.targetX - state.x;
      if (Math.abs(d) <= step) { state.x = state.targetX; }
      else { state.x += d > 0 ? step : -step; dir = d > 0 ? 1 : -1; }
    } else if (state.hold) {
      state.x += state.hold * step;
      dir = state.hold;
    }
    var half = DANI_W / 2;
    state.x = Math.max(half, Math.min(1 - half, state.x));
    state.lean += (dir - state.lean) * Math.min(1, dt * 12);

    // 부딪혔나 · 먹었나
    var roadW = W * (1 - GRASS * 2);
    var dx = W * GRASS + state.x * roadW;
    var dy = DANI_Y * H;
    var dw = roadW * DANI_W, dh = dw * (dani.naturalHeight / (dani.naturalWidth || 1) || 0.91);
    var size = roadW * OBS_SIZE;

    for (var i = 0; i < state.objects.length; i++) {
      var o = state.objects[i];
      if (o.done) continue;
      var sy = (o.wy + state.dist) * H;
      if (sy < dy - H * 0.3) continue;             // 아직 멀리 위에
      if (sy > H + size) { o.done = true; continue; } // 지나갔음
      var ox = laneX(o.lane);
      var pad = o.kind === 'treat' ? 0.5 : 0.32;  // 간식은 후하게, 장애물은 살짝 스쳐도 봐줍니다
      var hit = Math.abs(ox - dx) < size * pad + dw * 0.3 &&
                Math.abs(sy - dy) < size * pad + dh * 0.3;
      if (!hit) continue;

      if (o.kind === 'treat') {
        o.done = true;
        state.treats += 1;
        updateScore();
        if (window.SFX) SFX.pop();
        state.pops.push({ x: ox, y: sy, t: 0 });
      } else if (state.safe <= 0) {
        o.done = true;
        hurt();
        if (!state.running) return;
      }
    }

    for (var p = state.pops.length - 1; p >= 0; p--) {
      state.pops[p].t += dt;
      if (state.pops[p].t > 0.8) state.pops.splice(p, 1);
    }

    // 깃발까지 얼마나 왔나
    var total = DANI_Y - state.finish;
    el.bar.style.width = Math.min(100, Math.round(state.dist / total * 100)) + '%';
    updateChip();
    if (state.dist >= total) {
      state.runDist += total;
      state.dist = total;
      levelUp();
    }
  }

  // 지금까지 달린 거리 (m)
  function meters() {
    return Math.round((state.runDist + state.dist) * METER_PER_H);
  }

  function updateChip() {
    var m = meters();
    if (m === state.shownM) return;
    state.shownM = m;
    el.levelChip.textContent = state.level + '단계 · ' + m + 'm';
  }

  function hurt() {
    state.lives -= 1;
    state.safe = SAFE_TIME;
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
    confettiAtDani();
    showBanner('🏁 ' + state.level + '단계!');

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

    var m = meters();
    var rank = addRank({ m: m, level: state.level, treats: state.treats });

    // 시작 단계 고르기는 '몇 단계까지 갔는가', 카드의 ⭐ 는 '얼마나 멀리' 로 남깁니다
    UI.saveBest(BEST_KEY, state.level, state.level);
    UI.saveBest(BEST_M_KEY, rank.list[0].m, rank.list[0].m);

    buildStartRow();  // 기록이 올랐으면 고를 수 있는 시작 단계도 늘어납니다
    showRank(el.startRank, rank.list, -1);
    showRank(el.endRank, rank.list, rank.index);

    el.endStars.textContent = '🏃 ' + m + 'm';
    el.endTitle.textContent = rank.index === 0 ? '새 최고 기록! 🏆'
      : (rank.index > 0 ? (rank.index + 1) + '등이에요!' : PRAISE[UI.randInt(0, PRAISE.length - 1)]);
    el.endText.textContent = (state.startLevel > 1 ? state.startLevel + '단계에서 시작해서 ' : '')
      + state.level + '단계까지 ' + m + 'm 를 달렸어요. 간식 ' + state.treats + '개!';
    el.endOverlay.hidden = false;
  }

  /* ---------- 순위표 ----------
   * 이 기기에서 한 판들 중 먼 순서로 RANK_SIZE 개. 같은 거리면 먼저 한 판이 위입니다. */

  function loadRank() {
    try {
      var list = JSON.parse(UI.loadValue(RANK_KEY) || '[]');
      return Array.isArray(list) ? list.filter(function (r) { return r && typeof r.m === 'number'; }) : [];
    } catch (e) { return []; }
  }

  // 이번 판을 끼워 넣고, 몇 등인지(순위 밖이면 -1) 돌려줍니다
  function addRank(entry) {
    var list = loadRank();
    var index = list.length;
    for (var i = 0; i < list.length; i++) {
      if (entry.m > list[i].m) { index = i; break; }
    }
    list.splice(index, 0, entry);
    list = list.slice(0, RANK_SIZE);
    UI.saveValue(RANK_KEY, JSON.stringify(list));
    return { list: list, index: index < RANK_SIZE ? index : -1 };
  }

  function showRank(box, list, mine) {
    box.innerHTML = '';
    box.hidden = !list.length;
    list.forEach(function (r, i) {
      var li = document.createElement('li');
      li.className = i === mine ? 'me' : '';
      li.innerHTML = '<span class="medal">' + MEDALS[i] + '</span>' +
                     '<span class="m">' + r.m + 'm</span>' +
                     '<span class="lv">' + r.level + '단계' + (r.treats ? ' · ⭐ ' + r.treats : '') + '</span>' +
                     (i === mine ? '<span class="tag">이번 판</span>' : '');
      box.appendChild(li);
    });
  }

  // UI.confettiAt 은 요소를 받으므로 다니 자리에 잠깐 빈 칸을 놓고 터뜨립니다
  function confettiAtDani() {
    var r = el.canvas.getBoundingClientRect();
    var dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.left = (r.left + daniX()) + 'px';
    dot.style.top = (r.top + DANI_Y * state.H) + 'px';
    dot.style.width = '0';
    dot.style.height = '0';
    document.body.appendChild(dot);
    UI.confettiAt(dot);
    dot.remove();
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.treats; }

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

  function laneX(lane) {
    var roadW = state.W * (1 - GRASS * 2);
    return state.W * GRASS + (lane + 0.5) * roadW / LANES;
  }

  function daniX() {
    return state.W * GRASS + state.x * state.W * (1 - GRASS * 2);
  }

  function draw() {
    var W = state.W, H = state.H;
    if (!W || !H) return;
    var grass = W * GRASS;
    var roadW = W - grass * 2;

    // 풀밭과 길
    ctx.fillStyle = '#a9dc7c';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f5e6c4';
    ctx.fillRect(grass, 0, roadW, H);
    ctx.fillStyle = '#e2cfa3';
    ctx.fillRect(grass, 0, 4, H);
    ctx.fillRect(W - grass - 4, 0, 4, H);

    // 가운데 점선 — 길이 흐르는 만큼 같이 내려옵니다
    var dash = H * 0.12;
    var off = (state.dist * H) % (dash * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(4, roadW * 0.02);
    ctx.setLineDash([dash, dash]);
    ctx.lineDashOffset = -off;
    ctx.beginPath();
    ctx.moveTo(W / 2, -dash * 2);
    ctx.lineTo(W / 2, H + dash * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 깃발 (결승선)
    var fy = (state.finish + state.dist) * H;
    if (state.running || state.objects.length) drawFinish(fy, grass, roadW);

    // 장애물과 간식
    var size = roadW * OBS_SIZE;
    ctx.font = Math.round(size) + 'px ' + EMOJI_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < state.objects.length; i++) {
      var o = state.objects[i];
      if (o.done) continue;
      var sy = (o.wy + state.dist) * H;
      if (sy < -size || sy > H + size) continue;
      ctx.fillText(o.emoji, laneX(o.lane), sy);
    }

    drawDani(roadW);

    // 먹은 간식 자리에서 ⭐ 가 떠오릅니다
    for (var p = 0; p < state.pops.length; p++) {
      var pop = state.pops[p];
      ctx.globalAlpha = 1 - pop.t / 0.8;
      ctx.font = Math.round(size * 0.8) + 'px ' + EMOJI_FONT;
      ctx.fillText('⭐', pop.x, pop.y - pop.t * H * 0.15);
    }
    ctx.globalAlpha = 1;
  }

  function drawFinish(fy, grass, roadW) {
    var H = state.H;
    var h = H * 0.05;
    if (fy + h < 0 || fy - h > H) return;

    // 체크무늬 띠
    var sq = h / 2;
    for (var row = 0; row < 2; row++) {
      for (var cx = grass, k = 0; cx < grass + roadW; cx += sq, k++) {
        ctx.fillStyle = (k + row) % 2 ? '#40323a' : '#ffffff';
        ctx.fillRect(cx, fy - h / 2 + row * sq, Math.min(sq, grass + roadW - cx), sq);
      }
    }

    ctx.font = Math.round(h * 1.6) + 'px ' + EMOJI_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁', grass / 2, fy - h * 0.4);
    ctx.fillText('🏁', state.W - grass / 2, fy - h * 0.4);
  }

  function drawDani(roadW) {
    if (!dani.complete || !dani.naturalWidth) return;
    var w = roadW * DANI_W;
    var h = w * dani.naturalHeight / dani.naturalWidth;
    var x = daniX(), y = DANI_Y * state.H;

    ctx.save();
    // 부딪힌 뒤에는 깜빡입니다
    if (state.safe > 0 && Math.floor(state.safe * 10) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.translate(x, y + h * 0.45);
    ctx.rotate(state.lean * 0.15);
    ctx.drawImage(dani, -w / 2, -h * 0.95, w, h);
    ctx.restore();
  }

  /* ---------- 화면에 맞추기 ----------
   * 놀이판이 ◀ ▶ 단추까지 포함해 스크롤 없이 한 화면에 들어오게 합니다. */

  function px(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function fit() {
    var top = el.field.getBoundingClientRect().top;
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var wrapEl = document.querySelector('.wrap');
    var ctrl = document.querySelector('.dodge-controls');
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

  // 길에 손가락을 대면 다니가 그 가로 자리로 달려갑니다 (떼면 멈춥니다)
  function pointToX(clientX) {
    var r = el.canvas.getBoundingClientRect();
    var roadW = state.W * (1 - GRASS * 2);
    var x = (clientX - r.left - state.W * GRASS) / roadW;
    return Math.max(0, Math.min(1, x));
  }

  var touching = false;

  el.canvas.addEventListener('pointerdown', function (e) {
    touching = true;
    try { el.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    state.targetX = pointToX(e.clientX);
    e.preventDefault();
  });

  el.canvas.addEventListener('pointermove', function (e) {
    if (!touching) return;
    state.targetX = pointToX(e.clientX);
    e.preventDefault();
  });

  function letGo() {
    touching = false;
    state.targetX = null;
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

  var keys = { ArrowLeft: -1, ArrowRight: 1, a: -1, d: 1 };

  document.addEventListener('keydown', function (e) {
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
