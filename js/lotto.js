/* =========================================================================
 * 다니랜드 - 다니 로또
 *
 * 다니가 '로또 게임을 만들고 싶다' 고 해서 같이 구상한 놀이입니다 (2026-11-15).
 * 1~45 판에서 공 여섯 개를 고르고, 추첨기 통 안에서 공 마흔다섯 개가 튀며 섞이다가 하나씩 관을 타고 굴러 나옵니다.
 *
 * 정해 둔 것들 (사용자·다니와 정함):
 *   - **진짜 로또 그대로** — 공 45개, 여섯 개 고르기, 보너스 공, 등수 규칙도 진짜와 같습니다.
 *     그래서 1등은 814만 번에 한 번, 5등도 57번에 한 번쯤입니다. 쉽게 하려고 공을 줄이거나 몰래 당첨을 섞지 마세요 —
 *     '진짜는 이렇게 어렵다' 를 기록장의 숫자로 보는 것까지가 이 놀이입니다.
 *   - **돈은 안 나옵니다** — 상금 대신 등수와 트로피만. 다섯 살에게 돈 따먹기로 읽히지 않게.
 *   - **당첨 화면이 곧 증명서**입니다 — 서버가 없으니 화면 자체를 들고 가서 엄마 아빠한테 보여 줍니다.
 *     그래서 단추를 누르기 전에는 안 닫히고, 날짜·시각과 두 줄의 번호가 다 적혀 있습니다.
 *     기록장(daniland.lotto.wins)에도 남겨서 나중에 같은 기기에서 볼 수 있습니다.
 *   - 꽝은 벌하지 않습니다 — 몇 개 맞았는지와 '하나만 더 맞으면 5등' 만 알려 줍니다.
 *
 * 추첨기는 캔버스에 직접 그리고 물리도 직접 셉니다 (라이브러리 없음). 좌표는 **통 반지름을 1 로 둔 단위**이고
 * 통 가운데가 (0, 0) 입니다 — 화면 크기가 바뀌어도 공 자리가 그대로입니다. 그릴 때만 px 로 바꿉니다(toPx).
 * 나오는 공은 미리 정해 두지 않고 **통 위 구멍에 제일 가까이 튀어 오른 공**입니다 — 정말로 굴러 나온 공이 당첨 번호입니다.
 * ========================================================================= */

(function () {
  var COUNT = 45;
  var PICK = 6;

  // 진짜 로또 공 색 — 십의 자리마다
  var COLORS = ['#fbc400', '#69c8f2', '#ff7272', '#aaaaaa', '#b0d840'];

  var RANKS = {
    1: { icon: '👑', title: '1등 당첨!', sub: '여섯 개가 다 맞았어요!', say: '와아! 1등 당첨! 여섯 개가 다 맞았어요!' },
    2: { icon: '🏆', title: '2등 당첨!', sub: '다섯 개에 보너스 공까지 맞았어요!', say: '우와! 2등 당첨! 보너스 공까지 맞았어요!' },
    3: { icon: '🥇', title: '3등 당첨!', sub: '다섯 개가 맞았어요!', say: '우와! 3등 당첨! 다섯 개가 맞았어요!' },
    4: { icon: '🎖️', title: '4등 당첨!', sub: '네 개가 맞았어요!', say: '4등 당첨! 네 개가 맞았어요!' },
    5: { icon: '🎁', title: '5등 당첨!', sub: '세 개가 맞았어요!', say: '5등 당첨! 세 개가 맞았어요!' }
  };

  // 추첨기 (통 반지름 = 1)
  var BALL_R = 0.1;
  var G = 3;              // 아래로 끄는 힘
  var KICK = 3;           // 아래쪽 공이 1초에 바람에 차여 솟구치는 횟수
  var KICK_V = [1.4, 3.5]; // 솟구치는 빠르기 (3.5 이면 통 꼭대기까지 닿습니다)
  var KICK_Y = 0.25;      // 이보다 아래에 있는 공에 바람이 닿습니다
  var MAX_V = 3.6;
  var HOLE_Y = -1;        // 통 꼭대기 구멍
  var TOP_Y = -1.32;      // 관이 꺾이는 높이
  var TUBE_X = 1.42;      // 관이 내려가는 자리
  var TRAY_Y = 0.92;      // 공이 멈추는 받침
  var BOUNDS = { x0: -1.12, x1: 1.66, y0: -1.52, y1: 1.4 };

  var MIX_FIRST = 2.6;    // 처음 섞는 시간 (초)
  var MIX_EACH = 2.3;     // 공이 받침에 닿고 다음 공이 나오기까지
  var MIX_BONUS = 3.0;    // 여섯 개 다음 보너스 공까지 (안내가 뜨는 동안)
  var TRAVEL = 1.5;       // 구멍에서 받침까지 굴러가는 시간

  var MINE_KEY = 'daniland.lotto.mine';
  var STATS_KEY = 'daniland.lotto.stats';   // { plays, ranks: [1등, 2등, 3등, 4등, 5등] }
  var WINS_KEY = 'daniland.lotto.wins';     // [{ t, rank, mine, drawn, bonus }] 새것이 앞, 100개까지
  var WINS_MAX = 100;

  var el = {
    backBtn: document.getElementById('backBtn'),
    bookBtn: document.getElementById('bookBtn'),
    mineRow: document.getElementById('mineRow'),
    pickView: document.getElementById('pickView'),
    grid: document.getElementById('grid'),
    pickHint: document.getElementById('pickHint'),
    autoBtn: document.getElementById('autoBtn'),
    clearBtn: document.getElementById('clearBtn'),
    goBtn: document.getElementById('goBtn'),
    drawView: document.getElementById('drawView'),
    drawnRow: document.getElementById('drawnRow'),
    field: document.getElementById('field'),
    canvas: document.getElementById('canvas'),
    banner: document.getElementById('banner'),

    startOverlay: document.getElementById('startOverlay'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),

    missOverlay: document.getElementById('missOverlay'),
    missTitle: document.getElementById('missTitle'),
    missText: document.getElementById('missText'),
    missMine: document.getElementById('missMine'),
    missDrawn: document.getElementById('missDrawn'),
    missCount: document.getElementById('missCount'),
    missAgain: document.getElementById('missAgain'),
    missHome: document.getElementById('missHome'),

    winOverlay: document.getElementById('winOverlay'),
    winIcon: document.getElementById('winIcon'),
    winTitle: document.getElementById('winTitle'),
    winSub: document.getElementById('winSub'),
    winMine: document.getElementById('winMine'),
    winDrawn: document.getElementById('winDrawn'),
    winWhen: document.getElementById('winWhen'),
    winAgain: document.getElementById('winAgain'),
    winBook: document.getElementById('winBook'),

    bookOverlay: document.getElementById('bookOverlay'),
    bookPlays: document.getElementById('bookPlays'),
    bookCounts: document.getElementById('bookCounts'),
    bookList: document.getElementById('bookList'),
    bookClose: document.getElementById('bookClose')
  };

  var ctx = el.canvas.getContext('2d');
  var BACK = Catalog.backHref('lotto.html');

  var state = {
    phase: 'pick',     // pick · draw · done
    mine: loadMine(),
    balls: [],         // { n, x, y, vx, vy, rot, inDrum, path, travel }
    drawn: [],         // 나온 차례대로
    bonus: 0,
    moving: null,      // 관을 타고 굴러가는 공
    tray: null,        // 받침에 멈춘 공 (다음 공이 오면 비킴)
    t: 0,
    nextAt: 0,
    W: 0, H: 0, R: 0, ox: 0, oy: 0
  };

  var frame = null;
  var lastT = 0;
  var bannerTimer = null;
  var confettiTimer = null;
  var finishTimer = null;

  buildGrid();
  renderMine();

  /* ---------- 단추 ---------- */

  el.startBtn.addEventListener('click', function () {
    unlock();
    el.startOverlay.hidden = true;
  });

  el.autoBtn.addEventListener('click', function () {
    unlock();
    var all = [];
    for (var i = 1; i <= COUNT; i++) all.push(i);
    state.mine = UI.shuffle(all).slice(0, PICK).sort(byNum);
    saveMine();
    renderMine(true);
    if (window.SFX) SFX.correct();
  });

  el.clearBtn.addEventListener('click', function () {
    state.mine = [];
    saveMine();
    renderMine();
    if (window.SFX) SFX.tap();
  });

  el.goBtn.addEventListener('click', function () {
    unlock();
    if (state.mine.length < PICK) {
      if (window.SFX) SFX.wrong();
      speak('공을 여섯 개 골라요. 이제 ' + (PICK - state.mine.length) + '개 더!');
      shake(el.mineRow);
      return;
    }
    startDraw();
  });

  el.bookBtn.addEventListener('click', function () {
    if (state.phase === 'draw') return;   // 추첨 중에는 열지 않습니다 (공이 굴러가는 걸 놓칩니다)
    openBook();
  });
  el.winBook.addEventListener('click', openBook);
  el.bookClose.addEventListener('click', function () { el.bookOverlay.hidden = true; });

  el.missAgain.addEventListener('click', again);
  el.winAgain.addEventListener('click', again);

  [el.backBtn, el.startHome, el.missHome].forEach(function (btn) {
    btn.addEventListener('click', leave);
  });

  window.addEventListener('resize', function () { if (state.phase !== 'pick') fit(); });
  window.addEventListener('pagehide', stopAll);

  function unlock() {
    if (window.SFX) SFX.unlock();
    if (window.TTS) TTS.unlock();
  }

  function leave() {
    stopAll();
    window.location.href = BACK;
  }

  function stopAll() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    clearTimeout(finishTimer);
    stopConfetti();
    if (window.TTS) TTS.cancel();
  }

  /* ---------- 번호 고르기 ---------- */

  function byNum(a, b) { return a - b; }

  function colorClass(n) {
    return 'c' + Math.min(5, Math.ceil(n / 10));
  }

  function colorOf(n) {
    return COLORS[Math.min(5, Math.ceil(n / 10)) - 1];
  }

  function buildGrid() {
    for (var n = 1; n <= COUNT; n++) {
      var b = document.createElement('button');
      b.className = 'lotto-num ' + colorClass(n);
      b.textContent = n;
      b.setAttribute('data-n', n);
      b.addEventListener('click', onPick);
      el.grid.appendChild(b);
    }
  }

  function onPick(e) {
    unlock();
    var n = parseInt(e.currentTarget.getAttribute('data-n'), 10);
    var at = state.mine.indexOf(n);

    if (at >= 0) {
      state.mine.splice(at, 1);
      if (window.SFX) SFX.tap();
    } else if (state.mine.length >= PICK) {
      if (window.SFX) SFX.wrong();
      speak('여섯 개를 다 골랐어요. 바꾸려면 고른 공을 한 번 더 눌러요.');
      shake(el.mineRow);
      return;
    } else {
      state.mine.push(n);
      state.mine.sort(byNum);
      if (window.SFX) SFX.pop();
      speak(n + '번');
    }

    saveMine();
    renderMine(false, n);
  }

  // 고른 공이 위 칸에 줄 서고, 판의 공에도 색이 칠해집니다.
  function renderMine(popAll, popN) {
    fillRow(el.mineRow, state.mine, PICK, function (span, n) {
      if (popAll || n === popN) span.classList.add('pop');
    });

    var buttons = el.grid.children;
    for (var i = 0; i < buttons.length; i++) {
      var n = parseInt(buttons[i].getAttribute('data-n'), 10);
      buttons[i].classList.toggle('on', state.mine.indexOf(n) >= 0);
    }

    var left = PICK - state.mine.length;
    el.pickHint.textContent = left > 0
      ? '공 여섯 개를 골라요 · ' + state.mine.length + ' / ' + PICK
      : '다 골랐어요! 추첨하기를 눌러요';
    el.goBtn.classList.toggle('off', left > 0);
  }

  // 공 줄 하나 — size 칸을 채우고 모자라면 빈 칸. each(span, n) 으로 표시를 더 붙입니다.
  function fillRow(row, nums, size, each) {
    row.innerHTML = '';
    for (var i = 0; i < size; i++) {
      var span = ballEl(nums[i]);
      if (nums[i] && each) each(span, nums[i], i);
      row.appendChild(span);
    }
  }

  function ballEl(n) {
    var span = document.createElement('span');
    if (n) {
      span.className = 'lball ' + colorClass(n);
      span.textContent = n;
    } else {
      span.className = 'lball empty';
    }
    return span;
  }

  function plusEl() {
    var s = document.createElement('span');
    s.className = 'lotto-plus';
    s.textContent = '+';
    return s;
  }

  function shake(node) {
    node.classList.remove('shake');
    void node.offsetWidth;
    node.classList.add('shake');
  }

  function loadMine() {
    try {
      var v = JSON.parse(UI.loadValue(MINE_KEY) || '[]');
      if (!Array.isArray(v)) return [];
      return v.filter(function (n, i) {
        return n >= 1 && n <= COUNT && v.indexOf(n) === i;
      }).slice(0, PICK).sort(byNum);
    } catch (e) {
      return [];
    }
  }

  function saveMine() {
    UI.saveValue(MINE_KEY, JSON.stringify(state.mine));
  }

  /* ---------- 추첨 ---------- */

  function startDraw() {
    state.phase = 'draw';
    state.drawn = [];
    state.bonus = 0;
    state.moving = null;
    state.tray = null;
    state.t = 0;
    state.nextAt = MIX_FIRST;

    el.pickView.hidden = true;
    el.drawView.hidden = false;
    el.bookBtn.classList.add('off');
    renderDrawn();
    renderMine();
    window.scrollTo(0, 0);
    fit();

    // 공 마흔다섯 개를 통 바닥에 쌓아 두고 시작합니다 (바람이 불면 솟구칩니다)
    state.balls = [];
    for (var n = 1; n <= COUNT; n++) {
      var a = Math.random() * Math.PI;
      var d = Math.random() * 0.75;
      state.balls.push({
        n: n,
        x: Math.cos(a) * d,
        y: Math.sin(a) * d * 0.9 + 0.05,
        vx: 0, vy: 0,
        rot: Math.random() * 6.28,
        inDrum: true
      });
    }

    if (window.SFX) SFX.finish();
    speak('공을 섞어요!');

    lastT = performance.now();
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    var dt = Math.min(0.033, (now - lastT) / 1000);
    lastT = now;
    state.t += dt;

    // 두 걸음으로 나눠야 빠른 공이 서로 뚫고 지나가지 않습니다
    step(dt / 2);
    step(dt / 2);

    if (state.moving) roll(dt);
    else if (state.phase === 'draw' && state.t >= state.nextAt && needMore()) takeBall();

    draw();
  }

  function needMore() {
    return state.drawn.length < PICK || !state.bonus;
  }

  function step(dt) {
    var balls = state.balls;
    var i, j, b;

    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      if (!b.inDrum) continue;
      b.vy += G * dt;
      // 바닥에서 바람이 불어 공을 하나씩 툭툭 차올립니다 — 늘 미는 힘으로 하면 공이 한 띠로 떠서 멈춰 있습니다
      if (b.y > KICK_Y && Math.random() < KICK * dt) {
        b.vy = -(KICK_V[0] + Math.random() * (KICK_V[1] - KICK_V[0]));
        b.vx += (Math.random() - 0.5) * 2.4;
      }
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (sp > MAX_V) { b.vx *= MAX_V / sp; b.vy *= MAX_V / sp; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vx * dt / BALL_R;
    }

    // 공끼리 부딪히기
    var two = BALL_R * 2;
    for (i = 0; i < balls.length; i++) {
      var p = balls[i];
      if (!p.inDrum) continue;
      for (j = i + 1; j < balls.length; j++) {
        var q = balls[j];
        if (!q.inDrum) continue;
        var dx = q.x - p.x, dy = q.y - p.y;
        var d2 = dx * dx + dy * dy;
        if (d2 >= two * two || d2 === 0) continue;
        var d = Math.sqrt(d2);
        var nx = dx / d, ny = dy / d;
        var push = (two - d) / 2;
        p.x -= nx * push; p.y -= ny * push;
        q.x += nx * push; q.y += ny * push;
        var rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
        if (rv < 0) {
          var imp = -1.85 * rv / 2;
          p.vx -= imp * nx; p.vy -= imp * ny;
          q.vx += imp * nx; q.vy += imp * ny;
        }
      }
    }

    // 통 벽
    var lim = 1 - BALL_R - 0.03;
    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      if (!b.inDrum) continue;
      var dd = Math.sqrt(b.x * b.x + b.y * b.y);
      if (dd <= lim) continue;
      var wx = b.x / dd, wy = b.y / dd;
      b.x = wx * lim; b.y = wy * lim;
      var vn = b.vx * wx + b.vy * wy;
      if (vn > 0) { b.vx -= 1.75 * vn * wx; b.vy -= 1.75 * vn * wy; }
    }
  }

  // 통 꼭대기 구멍에 제일 가까이 튀어 오른 공이 빨려 나갑니다.
  function takeBall() {
    var best = null, bestD = Infinity;
    state.balls.forEach(function (b) {
      if (!b.inDrum) return;
      var d = b.x * b.x + (b.y - HOLE_Y) * (b.y - HOLE_Y);
      if (d < bestD) { bestD = d; best = b; }
    });
    if (!best) return;

    best.inDrum = false;
    best.travel = 0;
    best.path = [
      { x: best.x, y: best.y },
      { x: 0, y: HOLE_Y - 0.02 },
      { x: 0, y: TOP_Y },
      { x: TUBE_X, y: TOP_Y },
      { x: TUBE_X, y: TRAY_Y }
    ];
    best.len = pathLength(best.path);
    state.moving = best;
    if (window.SFX) SFX.tap();
  }

  function pathLength(path) {
    var len = 0;
    for (var i = 1; i < path.length; i++) {
      len += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    }
    return len;
  }

  function roll(dt) {
    var b = state.moving;
    b.travel = Math.min(1, b.travel + dt / TRAVEL);
    var e = b.travel < 0.5 ? 2 * b.travel * b.travel : 1 - Math.pow(-2 * b.travel + 2, 2) / 2;
    var at = pointOn(b.path, b.len * e);
    b.rot += Math.hypot(at.x - b.x, at.y - b.y) / BALL_R;
    b.x = at.x;
    b.y = at.y;
    if (b.travel >= 1) land(b);
  }

  function pointOn(path, dist) {
    for (var i = 1; i < path.length; i++) {
      var a = path[i - 1], c = path[i];
      var seg = Math.hypot(c.x - a.x, c.y - a.y);
      if (dist <= seg || i === path.length - 1) {
        var k = seg ? Math.min(1, dist / seg) : 1;
        return { x: a.x + (c.x - a.x) * k, y: a.y + (c.y - a.y) * k };
      }
      dist -= seg;
    }
    return path[path.length - 1];
  }

  // 공이 받침에 닿았습니다 — 당첨 번호 칸에 들어가고 이름을 읽어 줍니다.
  function land(b) {
    state.moving = null;
    state.tray = b;

    var isBonus = state.drawn.length >= PICK;
    if (isBonus) state.bonus = b.n;
    else state.drawn.push(b.n);

    var hit = state.mine.indexOf(b.n) >= 0;
    renderDrawn(b.n);
    renderMine();

    var word = isBonus ? '보너스 공, ' + b.n + '번!' : b.n + '번!';
    if (hit) {
      if (window.SFX) SFX.correct();
      speak(word + (isBonus ? ' 보너스 공이 맞았어요!' : ' 맞았어요!'));
      UI.confettiAt(markOf(el.mineRow, b.n) || el.mineRow);
    } else {
      if (window.SFX) SFX.pop();
      speak(word);
    }

    if (isBonus) {
      state.phase = 'done';
      finishTimer = setTimeout(finish, 2600);
    } else if (state.drawn.length === PICK) {
      state.nextAt = state.t + MIX_BONUS;
      setTimeout(function () { showBanner('보너스 공! ✨'); speak('이제 보너스 공!'); }, 1300);
    } else {
      state.nextAt = state.t + MIX_EACH;
    }
  }

  function markOf(row, n) {
    var kids = row.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].textContent === String(n)) return kids[i];
    }
    return null;
  }

  // 당첨 번호 칸 — 나온 차례대로 여섯 칸 + 보너스 칸. 내 번호와 같은 공은 반짝입니다.
  function renderDrawn(popN) {
    fillRow(el.drawnRow, state.drawn, PICK, function (span, n) {
      if (state.mine.indexOf(n) >= 0) span.classList.add('hit');
      if (n === popN) span.classList.add('pop');
    });
    el.drawnRow.appendChild(plusEl());
    var bonus = ballEl(state.bonus);
    bonus.classList.add('bonus');
    if (state.bonus && state.mine.indexOf(state.bonus) >= 0) bonus.classList.add('hit');
    if (state.bonus && state.bonus === popN) bonus.classList.add('pop');
    el.drawnRow.appendChild(bonus);

    // 위의 내 번호 줄에도 반짝임을 붙입니다 (renderMine 이 다시 그린 뒤)
    setTimeout(markMine, 0);
  }

  function markMine() {
    var kids = el.mineRow.children;
    for (var i = 0; i < kids.length; i++) {
      var n = parseInt(kids[i].textContent, 10);
      if (!n) continue;
      kids[i].classList.toggle('hit', state.drawn.indexOf(n) >= 0);
      kids[i].classList.toggle('bonus-hit', n === state.bonus);
    }
  }

  /* ---------- 결과 ---------- */

  function rankOf(match, bonusHit) {
    if (match === 6) return 1;
    if (match === 5 && bonusHit) return 2;
    if (match === 5) return 3;
    if (match === 4) return 4;
    if (match === 3) return 5;
    return 0;
  }

  function finish() {
    var match = state.drawn.filter(function (n) { return state.mine.indexOf(n) >= 0; }).length;
    var bonusHit = state.mine.indexOf(state.bonus) >= 0;
    var rank = rankOf(match, bonusHit);
    var record = {
      t: Date.now(),
      rank: rank,
      mine: state.mine.slice(),
      drawn: state.drawn.slice().sort(byNum),
      bonus: state.bonus
    };

    var stats = loadStats();
    stats.plays++;
    if (rank) stats.ranks[rank - 1]++;
    saveJSON(STATS_KEY, stats);

    if (rank) {
      var wins = loadWins();
      wins.unshift(record);
      saveJSON(WINS_KEY, wins.slice(0, WINS_MAX));
      showWin(record);
    } else {
      showMiss(record, match, stats.plays);
    }
  }

  function showWin(r) {
    var info = RANKS[r.rank];
    el.winOverlay.className = 'overlay lotto-win r' + r.rank;
    el.winIcon.textContent = info.icon;
    el.winTitle.textContent = info.title;
    el.winSub.textContent = info.sub;
    resultRows(r, el.winMine, el.winDrawn);
    el.winWhen.textContent = whenText(r.t);
    el.winOverlay.hidden = false;
    el.winOverlay.scrollTop = 0;

    if (window.SFX) {
      SFX.finish();
      setTimeout(SFX.finish, 700);
      if (r.rank <= 2) setTimeout(SFX.finish, 1400);
    }
    speak(info.say + ' 엄마 아빠한테 보여 주세요!');
    startConfetti(r.rank);
  }

  function showMiss(r, match, plays) {
    el.missTitle.textContent = match === 2 ? '아깝다!' : '이번엔 꽝!';
    el.missText.textContent = match === 2
      ? '두 개 맞았어요. 하나만 더 맞으면 5등이었어요!'
      : (match === 1 ? '한 개 맞았어요.' : '하나도 안 맞았어요.') + ' 세 개 맞으면 5등이에요!';
    resultRows(r, el.missMine, el.missDrawn);
    el.missCount.textContent = '지금까지 ' + plays + '번 뽑았어요';
    el.missOverlay.hidden = false;
    if (window.SFX) SFX.wrong();
    speak(el.missTitle.textContent + ' ' + el.missText.textContent);
  }

  // 결과 화면의 두 줄 — 내 번호(맞은 것 반짝)와 당첨 번호(작은 수부터 + 보너스)
  function resultRows(r, mineRow, drawnRow) {
    fillRow(mineRow, r.mine, PICK, function (span, n) {
      if (r.drawn.indexOf(n) >= 0) span.classList.add('hit');
      else if (n === r.bonus) span.classList.add('hit', 'bonus-hit');
    });
    fillRow(drawnRow, r.drawn, PICK, function (span, n) {
      if (r.mine.indexOf(n) >= 0) span.classList.add('hit');
    });
    drawnRow.appendChild(plusEl());
    var bonus = ballEl(r.bonus);
    bonus.classList.add('bonus');
    if (r.mine.indexOf(r.bonus) >= 0) bonus.classList.add('hit');
    drawnRow.appendChild(bonus);
  }

  function whenText(t) {
    var d = new Date(t);
    var h = d.getHours();
    var ampm = h < 12 ? '오전' : '오후';
    var h12 = h % 12 || 12;
    var m = d.getMinutes();
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' +
      ampm + ' ' + h12 + '시' + (m ? ' ' + m + '분' : '');
  }

  // 당첨 화면에서 폭죽이 계속 터집니다 — 높은 등수일수록 자주
  function startConfetti(rank) {
    stopConfetti();
    var every = [0, 220, 320, 450, 650, 800][rank];
    var until = Date.now() + (rank <= 2 ? 30000 : 15000);
    confettiTimer = setInterval(function () {
      if (Date.now() > until || el.winOverlay.hidden) { stopConfetti(); return; }
      var x = 30 + Math.random() * (window.innerWidth - 60);
      var y = 40 + Math.random() * (window.innerHeight * 0.6);
      UI.confettiAt({ getBoundingClientRect: function () { return { left: x, top: y, width: 0, height: 0 }; } });
    }, every);
  }

  function stopConfetti() {
    clearInterval(confettiTimer);
    confettiTimer = null;
  }

  // 또 하기 — 번호는 그대로 두고(진짜 로또처럼 같은 번호로 또 해도 되고) 판으로 돌아갑니다.
  function again() {
    stopAll();
    el.winOverlay.hidden = true;
    el.missOverlay.hidden = true;
    el.bookOverlay.hidden = true;
    state.phase = 'pick';
    state.drawn = [];
    state.bonus = 0;
    el.drawView.hidden = true;
    el.pickView.hidden = false;
    el.bookBtn.classList.remove('off');
    renderMine();
    window.scrollTo(0, 0);
  }

  /* ---------- 당첨 기록장 ---------- */

  function openBook() {
    var stats = loadStats();
    var wins = loadWins();

    el.bookPlays.textContent = stats.plays
      ? '지금까지 ' + stats.plays + '번 뽑았어요'
      : '아직 한 번도 안 뽑았어요';

    el.bookCounts.innerHTML = '';
    for (var r = 1; r <= 5; r++) {
      var chip = document.createElement('span');
      chip.className = 'book-count' + (stats.ranks[r - 1] ? ' got' : '');
      chip.textContent = RANKS[r].icon + ' ' + r + '등 ' + stats.ranks[r - 1] + '번';
      el.bookCounts.appendChild(chip);
    }

    el.bookList.innerHTML = '';
    if (!wins.length) {
      var empty = document.createElement('li');
      empty.className = 'book-empty';
      empty.textContent = '아직 당첨된 적이 없어요. 행운을 빌어요! 🍀';
      el.bookList.appendChild(empty);
    }
    wins.forEach(function (w) {
      var li = document.createElement('li');
      li.className = 'book-item r' + w.rank;
      var head = document.createElement('div');
      head.className = 'book-head';
      head.textContent = RANKS[w.rank].icon + ' ' + w.rank + '등';
      var when = document.createElement('span');
      when.className = 'when';
      when.textContent = whenText(w.t);
      head.appendChild(when);
      var mine = document.createElement('div');
      mine.className = 'lotto-row';
      var drawn = document.createElement('div');
      drawn.className = 'lotto-row';
      resultRows(w, mine, drawn);
      li.appendChild(head);
      li.appendChild(mine);
      li.appendChild(drawn);
      el.bookList.appendChild(li);
    });

    el.bookOverlay.hidden = false;
    el.bookOverlay.scrollTop = 0;
  }

  function loadStats() {
    try {
      var v = JSON.parse(UI.loadValue(STATS_KEY) || 'null');
      if (v && typeof v.plays === 'number' && Array.isArray(v.ranks) && v.ranks.length === 5) return v;
    } catch (e) { /* 무시 */ }
    return { plays: 0, ranks: [0, 0, 0, 0, 0] };
  }

  function loadWins() {
    try {
      var v = JSON.parse(UI.loadValue(WINS_KEY) || '[]');
      return Array.isArray(v) ? v.filter(function (w) { return w && RANKS[w.rank] && w.mine && w.drawn; }) : [];
    } catch (e) {
      return [];
    }
  }

  function saveJSON(key, value) {
    UI.saveValue(key, JSON.stringify(value));
  }

  /* ---------- 소리 · 안내 ---------- */

  function speak(text) {
    if (!text || !window.TTS || !TTS.supported) return;
    TTS.speak(text, 'ko-KR', {});
  }

  function showBanner(text) {
    el.banner.textContent = text;
    el.banner.hidden = false;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.banner.hidden = true; }, 1600);
  }

  /* ---------- 그리기 ---------- */

  // 놀이판 크기 — 화면 아래까지 채우되 너무 길쭉하지 않게
  function fit() {
    var W = el.field.clientWidth;
    if (!W) return;
    var top = el.field.getBoundingClientRect().top;
    var H = Math.round(window.innerHeight - top - 16);
    H = Math.max(260, Math.min(H, Math.round(W * 1.05)));

    var dpr = window.devicePixelRatio || 1;
    el.canvas.width = Math.round(W * dpr);
    el.canvas.height = Math.round(H * dpr);
    el.canvas.style.width = W + 'px';
    el.canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var bw = BOUNDS.x1 - BOUNDS.x0;
    var bh = BOUNDS.y1 - BOUNDS.y0;
    state.W = W;
    state.H = H;
    state.R = Math.min(W / bw, H / bh) * 0.97;
    state.ox = W / 2 - (BOUNDS.x0 + BOUNDS.x1) / 2 * state.R;
    state.oy = H / 2 - (BOUNDS.y0 + BOUNDS.y1) / 2 * state.R;
    draw();
  }

  function px(x) { return state.ox + x * state.R; }
  function py(y) { return state.oy + y * state.R; }

  function draw() {
    var R = state.R;
    if (!R) return;
    ctx.clearRect(0, 0, state.W, state.H);

    var cx = px(0), cy = py(0);
    var br = BALL_R * R;

    // 받침대
    ctx.fillStyle = '#ffb3c6';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.42, cy + R * 0.9);
    ctx.lineTo(cx + R * 0.42, cy + R * 0.9);
    ctx.lineTo(cx + R * 0.62, cy + R * 1.34);
    ctx.lineTo(cx - R * 0.62, cy + R * 1.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff8fab';
    roundRect(cx - R * 0.72, cy + R * 1.28, R * 1.44, R * 0.1, R * 0.05);
    ctx.fill();

    // 관 (구멍 → 위 → 오른쪽 → 아래 받침)
    var tube = [[0, HOLE_Y + 0.02], [0, TOP_Y], [TUBE_X, TOP_Y], [TUBE_X, TRAY_Y + BALL_R]];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokePath(tube, br * 2.7, 'rgba(120, 170, 220, 0.55)');
    strokePath(tube, br * 2.3, 'rgba(235, 246, 255, 0.95)');

    // 받침 컵
    ctx.fillStyle = '#ffcf5c';
    ctx.beginPath();
    ctx.ellipse(px(TUBE_X), py(TRAY_Y) + br * 1.05, br * 1.7, br * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 통 — 투명한 유리
    ctx.fillStyle = 'rgba(214, 236, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 바람 나오는 곳
    ctx.fillStyle = 'rgba(120, 170, 220, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.86, R * 0.32, R * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    state.balls.forEach(function (b) {
      if (b.inDrum) drawBall(px(b.x), py(b.y), br, b.n, b.rot);
    });

    // 유리 테두리와 반짝임 (공 위에)
    ctx.lineWidth = Math.max(3, R * 0.03);
    ctx.strokeStyle = 'rgba(94, 150, 210, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(4, R * 0.05);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.88, Math.PI * 1.08, Math.PI * 1.38);
    ctx.stroke();

    // 받침에 멈춘 공 · 굴러가는 공 (관 위에)
    if (state.tray && state.tray !== state.moving) {
      drawBall(px(state.tray.x), py(state.tray.y), br * 1.25, state.tray.n, 0);
    }
    if (state.moving) {
      var m = state.moving;
      drawBall(px(m.x), py(m.y), br * (1 + 0.25 * m.travel), m.n, m.rot);
    }
  }

  function strokePath(points, width, color) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    points.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(px(p[0]), py(p[1]));
      else ctx.lineTo(px(p[0]), py(p[1]));
    });
    ctx.stroke();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBall(x, y, r, n, rot) {
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, colorOf(n));
    g.addColorStop(1, shade(colorOf(n)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // 숫자는 공과 같이 굴러갑니다 (흰 동그라미 위에)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#40323a';
    ctx.font = '800 ' + Math.round(r * 0.78) + 'px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), 0, r * 0.04);
    ctx.restore();
  }

  // 공의 그늘진 쪽 색 — 조금 어둡게
  function shade(hex) {
    var v = parseInt(hex.slice(1), 16);
    var r = Math.round(((v >> 16) & 255) * 0.72);
    var g = Math.round(((v >> 8) & 255) * 0.72);
    var b = Math.round((v & 255) * 0.72);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
})();
