/* =========================================================================
 * 다니랜드 - 뜰까 가라앉을까 (float.html)
 *
 * 물통 하나에 물건을 떨어뜨려 뜨는지 가라앉는지 봅니다. 핵심은
 * **크기·무게가 아니라 '같은 크기의 물보다 가벼운가'(밀도)** 라는 것이라,
 * 큰 통나무·수박은 뜨고 작은 나사·포도는 가라앉는 짝을 일부러 넣었습니다.
 *
 * 물건마다 rho(물을 1 로 본 밀도)를 적어 두고, 뜨는 것은 **rho / 물의 밀도 만큼 잠깁니다**
 * (얼음 0.92 는 거의 다, 탁구공은 살짝만). 그림이 이 비율로 정해지니 rho 는 진짜 값에 맞추세요.
 * 물기·속 모양에 따라 뜨기도 가라앉기도 하는 것(토마토·블루베리·젖는 스펀지)은 정답이 둘이라 뺐습니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   guess : 맞혀 보기 - 먼저 뜰지 가라앉을지 고르고 떨어뜨려 봅니다 (열 문제, ⭐)
 *   salt  : 소금물    - 가라앉은 달걀이 소금을 넣을수록 떠오릅니다 (점수 없음)
 *   boat  : 찰흙 배   - 같은 찰흙인데 덩어리는 가라앉고 배 모양은 떠요. 구슬을 몇 개까지 실을까? (점수 없음)
 *
 * 기록 키는 daniland.best.float(카드의 ⭐)·daniland.best.float.guess, 마지막 놀이는 daniland.floatAct.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var ROUNDS = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '꼬마 과학자!'];

  var BEST_KEY = 'daniland.best.float';
  var ACT_KEY = 'daniland.floatAct';

  var ACTS = [
    { id: 'guess', name: '맞혀 보기', icon: '🤔', desc: '뜰까 가라앉을까? 먼저 맞혀 보고 물에 넣어 봐요' },
    { id: 'salt',  name: '소금물',   icon: '🧂', desc: '가라앉은 달걀이 소금을 넣으면 어떻게 될까요?' },
    { id: 'boat',  name: '찰흙 배',  icon: '🛶', desc: '같은 찰흙인데 모양을 바꾸면? 구슬을 몇 개까지 실을까요?' }
  ];

  /* rho: 물(1)과 견준 밀도 · size: 그림 크기(1 이 보통) · why: 맞혀 본 뒤 읽어 주는 말 */
  var ITEMS = [
    { e: '🍎', n: '사과', rho: 0.85, size: 1, why: '사과 속에는 공기가 조금 들어 있어서 같은 크기의 물보다 가벼워요.' },
    { e: '🍉', n: '수박', rho: 0.93, size: 1.5, why: '이렇게 크고 무거워도 떠요! 같은 크기의 물보다는 가볍거든요.' },
    { e: '🍌', n: '바나나', rho: 0.95, size: 1, why: '바나나는 같은 크기의 물보다 조금 가벼워서 떠요.' },
    { e: '🍊', n: '귤', rho: 0.85, size: 0.9, why: '귤 껍질에는 작은 공기 방이 잔뜩 있어서 구명조끼처럼 귤을 띄워요.' },
    { e: '🥥', n: '코코넛', rho: 0.9, size: 1.1, why: '코코넛은 바다를 둥둥 떠다니다가 다른 섬에 닿아 싹을 틔우기도 해요.' },
    { e: '🧊', n: '얼음', rho: 0.92, size: 1, why: '얼음은 물보다 아주 조금 가벼워요. 그래서 뜨지만 거의 다 물속에 잠겨요.' },
    { e: '🪵', n: '큰 통나무', rho: 0.6, size: 1.6, why: '크고 무거워도 떠요! 나무는 같은 크기의 물보다 가볍거든요.' },
    { e: '✏️', n: '연필', rho: 0.65, size: 0.9, why: '연필은 거의 나무라서 물에 떠요.' },
    { e: '🦆', n: '고무 오리', rho: 0.3, size: 1, why: '속이 비어서 공기가 가득해요. 그래서 아주 가볍게 떠요.' },
    { e: '🏓', n: '탁구공', rho: 0.08, size: 0.7, why: '속이 텅 빈 공이라 아주 가벼워요. 물에 살짝만 잠겨요.' },
    { e: '🍇', n: '포도', rho: 1.08, size: 0.9, why: '포도 알은 작아도 같은 크기의 물보다 무거워서 가라앉아요.' },
    { e: '🍊', n: '껍질 깐 귤', rho: 1.05, size: 0.8, peeled: true, why: '껍질을 벗기면 공기 구명조끼가 없어져서 가라앉아요!' },
    { e: '🥔', n: '감자', rho: 1.08, size: 0.95, why: '감자는 같은 크기의 물보다 조금 무거워서 가라앉아요.' },
    { e: '🥕', n: '당근', rho: 1.04, size: 1, why: '당근은 같은 크기의 물보다 조금 무거워서 가라앉아요.' },
    { e: '🥚', n: '달걀', rho: 1.08, size: 0.85, why: '싱싱한 달걀은 물보다 조금 무거워서 가라앉아요. 소금물에서는 어떨까요?' },
    { e: '🔩', n: '작은 나사', rho: 7.8, size: 0.5, why: '이렇게 작아도 가라앉아요. 쇠는 같은 크기의 물보다 여덟 배쯤 무거워요.' },
    { e: '🪙', n: '동전', rho: 8.9, size: 0.6, why: '동전은 금속이라 같은 크기의 물보다 훨씬 무거워요.' },
    { e: '🔑', n: '열쇠', rho: 8.5, size: 0.7, why: '열쇠는 금속이라 가라앉아요.' },
    { e: '🪨', n: '돌멩이', rho: 2.6, size: 0.9, why: '돌은 같은 크기의 물보다 두 배 넘게 무거워요.' },
    { e: '🔮', n: '유리구슬', rho: 2.5, size: 0.7, why: '유리는 같은 크기의 물보다 무거워서 가라앉아요.' }
  ];

  // 소금물 놀이에 넣어 볼 것 — 셋 다 맹물에서는 가라앉고 소금물에서는 떠요
  var SALT_THINGS = [
    { e: '🥚', n: '달걀', rho: 1.08, size: 0.95 },
    { e: '🥔', n: '감자', rho: 1.1, size: 1 },
    { e: '🍇', n: '포도', rho: 1.06, size: 0.85 }
  ];
  var SALT_STEP = 0.02;      // 소금 한 숟가락에 물이 얼마나 무거워지나
  var SALT_MAX = 10;         // 그 뒤로는 더 녹지 않습니다 (진짜 소금물도 1.2 쯤에서 더 안 녹아요)

  // 찰흙 배 — 같은 찰흙(밀도 1.6, 부피 1)으로 만든 세 모양. room 은 배가 밀어낼 수 있는 물의 부피.
  var CLAY_RHO = 1.6, CLAY_V = 1, MARBLE = 0.2;
  var SHAPES = [
    { id: 'lump', e: '🟤', n: '덩어리', room: CLAY_V },
    { id: 'narrow', e: '🛶', n: '좁은 배', room: 3, w: 1.1 },
    { id: 'wide', e: '🚢', n: '넓은 배', room: 6, w: 2.2 }
  ];

  var el = {
    stage: document.getElementById('stage'),
    canvas: document.getElementById('canvas'),
    say: document.getElementById('say'),
    ctrl: document.getElementById('ctrl'),
    label: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    backBtn: document.getElementById('backBtn'),
    voiceBtn: document.getElementById('voiceBtn'),

    startOverlay: document.getElementById('startOverlay'),
    modeRow: document.getElementById('modeRow'),
    modeDesc: document.getElementById('modeDesc'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endModes: document.getElementById('endModes'),
    endHome: document.getElementById('endHome')
  };

  var ctx = el.canvas.getContext('2d');

  /* ---------- 상태 ---------- */

  var state = {
    act: UI.loadValue(ACT_KEY) || 'guess',
    playing: false,
    rhoW: 1,             // 물의 밀도 (소금을 넣으면 커집니다)
    salt: 0,             // 넣은 소금 숟가락
    body: null,          // 물통 안의 물건 하나
    deck: [],
    round: 0,
    stars: 0,
    locked: false,
    guess: null,
    shape: 'narrow',
    marbles: 0,
    record: {},          // 배 모양마다 가라앉기 전 실었던 구슬 수
    prompt: ''
  };

  if (!findAct(state.act)) state.act = 'guess';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  /* ---------- 물통 ---------- */

  var W = 0, H = 0, S = 80, dpr = 1;
  var tank = { l: 0, r: 0, top: 0, surf: 0, bot: 0 };
  var pageEl = document.querySelector('.sci-page');

  function fit() {
    if (pageEl) pageEl.style.height = (document.documentElement.clientHeight || window.innerHeight) + 'px';
    var w = el.stage.clientWidth, h = el.stage.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h;
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.width = w + 'px';
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.max(44, Math.min(120, w / 6, h / 4));
    var tw = Math.min(w * 0.86, S * 9);
    tank.l = (w - tw) / 2;
    tank.r = tank.l + tw;
    tank.top = h * 0.3;
    tank.surf = h * 0.42;
    tank.bot = h * 0.95;
    if (state.body) settleNow(state.body);
  }

  /* ---------- 물건 하나의 움직임 ----------
   * 뜨는 것은 '잠긴 몫 = 물건 밀도 ÷ 물 밀도' 가 되는 높이에서 멈추고(통통 튀다가),
   * 가라앉는 것은 물속에서 천천히 내려가 바닥에 닿습니다. */

  function makeBody(o) {
    return {
      e: o.e, n: o.n, rho: o.rho, size: o.size || 1, peeled: o.peeled,
      kind: o.kind || 'emoji',
      y: 0, vy: 0, falling: false, splashed: false, t: 0
    };
  }

  function bodyH(b) {
    if (b.kind === 'boat') return S * 0.62;
    if (b.kind === 'lump') return S * 0.7;
    return S * b.size * 0.9;
  }

  // 지금 이 물건의 밀도 — 배는 찰흙 + 실은 구슬을 배 부피로 나눕니다
  function rhoOf(b) {
    if (b.kind === 'boat') return (CLAY_RHO * CLAY_V + state.marbles * MARBLE) / shapeOf(state.shape).room;
    return b.rho;
  }

  function floats(b) {
    if (b.kind === 'boat' && b.sunk) return false;
    return rhoOf(b) < state.rhoW;
  }

  function eqY(b) {
    var h = bodyH(b);
    if (floats(b)) return tank.surf + (rhoOf(b) / state.rhoW) * h - h / 2;
    return tank.bot - h / 2 - 4;
  }

  function hold(b) {
    b.y = Math.max(bodyH(b) / 2 + 6, tank.surf - S * 1.25);
    b.vy = 0;
    b.falling = false;
    b.splashed = false;
    b.t = 0;
  }

  // 화면 크기가 바뀌었을 때 — 기다리는 것은 다시 들어 올리고, 자리 잡은 것은 새 자리로.
  // 떨어지는 중인 것은 그대로 둡니다 (단추 줄이 바뀔 때마다 불려서, 건드리면 떨어지는 모습이 사라집니다)
  function settleNow(b) {
    if (!b.falling) { hold(b); return; }
    if (!b.settled) return;
    b.y = eqY(b);
    b.vy = 0;
  }

  function release(b) {
    b.falling = true;
    b.settled = false;
    b.t = 0;
  }

  var ripples = [], drops = [], grains = [];

  function stepBody(b, dt) {
    if (!b.falling) return;
    b.t += dt;
    var h = bodyH(b);
    var bottomEdge = b.y + h / 2;
    var eq = eqY(b);

    if (bottomEdge < tank.surf) {
      b.vy += 1500 * dt;                       // 공기 중에서는 그냥 떨어집니다
    } else if (floats(b)) {
      if (!b.splashed) splash(b);
      var a = 40 * (eq - b.y) - 7 * b.vy;      // 물이 밀어 올리는 힘 + 물의 끈적임
      b.vy += a * dt;
      if (b.vy < -240) b.vy = -240;            // 바닥에서 떠오를 때 너무 튀어 오르지 않게
    } else {
      if (!b.splashed) splash(b);
      var over = Math.min(rhoOf(b) / state.rhoW - 1, 3);
      var vt = 30 + over * 110;               // 무거울수록 빨리 가라앉습니다
      b.vy += (vt - b.vy) * Math.min(1, 4 * dt);
    }
    b.y += b.vy * dt;

    var floor = tank.bot - h / 2 - 4;
    if (b.y > floor) { b.y = floor; b.vy = 0; }

    if (!b.settled && b.t > 0.8 && Math.abs(b.vy) < 6 && Math.abs(b.y - eq) < 3) {
      b.settled = true;
      if (b.onSettle) { var f = b.onSettle; b.onSettle = null; f(); }
    }
  }

  function splash(b) {
    b.splashed = true;
    var x = W / 2;
    ripples.push({ x: x, r: S * 0.3, a: 0.8 });
    ripples.push({ x: x, r: S * 0.1, a: 0.8, d: 0.15 });
    var n = 10;
    for (var i = 0; i < n; i++) {
      drops.push({ x: x + (Math.random() - 0.5) * S * 0.6, y: tank.surf,
                   vx: (Math.random() - 0.5) * 260, vy: -150 - Math.random() * 260, life: 1 });
    }
    if (window.SFX) SFX.splash();
  }

  var clock = 0, last = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    clock += dt;
    if (state.body) stepBody(state.body, dt);

    ripples.forEach(function (r) {
      if (r.d > 0) { r.d -= dt; return; }
      r.r += dt * S * 1.6; r.a -= dt * 0.7;
    });
    ripples = ripples.filter(function (r) { return r.a > 0; });
    drops.forEach(function (d) { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; });
    drops = drops.filter(function (d) { return d.life > 0 && d.y < tank.surf + 4; });
    grains.forEach(function (g) {
      g.y += g.v * dt;
      if (g.y > tank.surf) g.a -= dt * 0.9;    // 물에 닿으면 녹아 사라집니다
    });
    grains = grains.filter(function (g) { return g.a > 0 && g.y < tank.bot; });
    draw();
  }

  /* ---------- 그리기 ---------- */

  function draw() {
    if (!W) return;
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#f1f8ff');
    bg.addColorStop(1, '#e3f0fb');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 책상
    ctx.fillStyle = '#e7d3b4';
    ctx.fillRect(0, tank.bot, W, H - tank.bot);

    // 물통 안 벽
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(tank.l, tank.top, tank.r - tank.l, tank.bot - tank.top);

    // 녹지 않고 쌓인 소금
    if (state.act === 'salt' && state.salt > SALT_MAX) {
      var pile = Math.min(S * 0.25, (state.salt - SALT_MAX) * 4);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(W / 2 + S * 1.4, tank.bot, S * 0.8, pile, 0, Math.PI, 0);
      ctx.fill();
    }

    if (state.body) drawBody(state.body);

    // 물 — 물건 위에 반투명하게 덮어서 잠긴 부분이 물빛으로 보이게 합니다
    var salty = Math.min(1, state.salt / SALT_MAX);
    var wg = ctx.createLinearGradient(0, tank.surf, 0, tank.bot);
    wg.addColorStop(0, 'rgba(' + Math.round(90 + salty * 40) + ',170,235,0.42)');
    wg.addColorStop(1, 'rgba(' + Math.round(40 + salty * 40) + ',120,210,0.55)');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(tank.l, tank.bot);
    ctx.lineTo(tank.l, tank.surf);
    for (var x = tank.l; x <= tank.r; x += 8) {
      ctx.lineTo(x, tank.surf + Math.sin(x * 0.04 + clock * 2.2) * 1.6);
    }
    ctx.lineTo(tank.r, tank.bot);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x2 = tank.l; x2 <= tank.r; x2 += 8) {
      var yy = tank.surf + Math.sin(x2 * 0.04 + clock * 2.2) * 1.6;
      if (x2 === tank.l) ctx.moveTo(x2, yy); else ctx.lineTo(x2, yy);
    }
    ctx.stroke();

    ripples.forEach(function (r) {
      if (r.d > 0) return;
      ctx.strokeStyle = 'rgba(255,255,255,' + r.a.toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(r.x, tank.surf, r.r, r.r * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(110,180,240,0.85)';
    drops.forEach(function (d) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffffff';
    grains.forEach(function (g) {
      ctx.globalAlpha = Math.max(0, g.a);
      ctx.fillRect(g.x, g.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    // 떠 있는 배는 안이 비어 있어야 합니다 — 물 덮개가 배 안까지 칠해서 물이 찬 것처럼 보이니
    // 배 안쪽을 공기 색으로 다시 칠하고 배를 한 번 더 그립니다
    if (state.body && state.body.kind === 'boat' && !state.body.sunk) drawBoat(state.body, true);

    // 물통 유리
    ctx.strokeStyle = 'rgba(120,150,180,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tank.l, tank.top);
    ctx.lineTo(tank.l, tank.bot);
    ctx.lineTo(tank.r, tank.bot);
    ctx.lineTo(tank.r, tank.top);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tank.l + 10, tank.top + 12);
    ctx.lineTo(tank.l + 10, tank.bot - 16);
    ctx.stroke();

    if (state.act === 'salt') drawSaltMeter();
  }

  var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  function drawBody(b) {
    if (b.kind === 'boat') return drawBoat(b);
    if (b.kind === 'lump') return drawLump(b);
    var size = S * b.size;
    var x = W / 2;
    // 떠 있을 때 조금씩 흔들립니다
    var tilt = b.settled && floats(b) ? Math.sin(clock * 1.4) * 0.05 : 0;
    ctx.save();
    ctx.translate(x, b.y);
    ctx.rotate(tilt);
    ctx.font = Math.round(size) + 'px ' + EMOJI_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (b.peeled) ctx.globalAlpha = 0.75;
    ctx.fillText(b.e, 0, 0);
    ctx.globalAlpha = 1;
    // 껍질 깐 귤 — 껍질 없는 속살이 보이게 흰 줄무늬를 얹습니다
    if (b.peeled) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1.5, size * 0.03);
      for (var i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size * 0.09, -size * 0.3);
        ctx.quadraticCurveTo(i * size * 0.16, 0, i * size * 0.09, size * 0.32);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (!b.falling) {
      ctx.fillStyle = 'rgba(64,50,58,0.85)';
      ctx.font = 'bold ' + Math.round(Math.max(14, S * 0.22)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(b.n, x, b.y + size * 0.48);
    }
  }

  function drawLump(b) {
    var r = bodyH(b) / 2;
    var g = ctx.createRadialGradient(W / 2 - r * 0.3, b.y - r * 0.3, r * 0.1, W / 2, b.y, r);
    g.addColorStop(0, '#c98a5a');
    g.addColorStop(1, '#8a5530');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(W / 2, b.y, r * 1.15, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 찰흙 배 — U 자 모양 그릇. 안에 구슬이 바닥부터 쌓이고, 가라앉으면 안에 물이 찹니다
  function drawBoat(b, front) {
    var sh = shapeOf(state.shape);
    var h = bodyH(b);
    var w = S * sh.w;
    var x0 = W / 2 - w / 2, top = b.y - h / 2, bot = b.y + h / 2;
    var wall = Math.max(5, S * 0.08);
    var tilt = b.settled && floats(b) ? Math.sin(clock * 1.3) * 0.03 : 0;

    ctx.save();
    ctx.translate(W / 2, b.y);
    ctx.rotate(tilt);
    ctx.translate(-W / 2, -b.y);

    if (front) {
      ctx.fillStyle = '#f4f8fd';
      ctx.beginPath();
      ctx.moveTo(x0 + wall * 0.5, top);
      ctx.lineTo(x0 + w * 0.08 + wall * 0.4, bot - wall);
      ctx.lineTo(x0 + w * 0.92 - wall * 0.4, bot - wall);
      ctx.lineTo(x0 + w - wall * 0.5, top);
      ctx.closePath();
      ctx.fill();
    }

    // 구슬 — 배 바닥부터 줄을 지어 쌓입니다
    var mr = Math.max(4, S * 0.07);
    var inner = w - wall * 2 - w * 0.12;
    var per = Math.max(1, Math.floor(inner / (mr * 2.1)));
    for (var i = 0; i < state.marbles; i++) {
      var row = Math.floor(i / per), col = i % per;
      var mx = W / 2 - (per - 1) * mr * 1.05 + col * mr * 2.1 + (row % 2) * mr * 0.5;
      var my = bot - wall - mr - row * mr * 1.8;
      var mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 1, mx, my, mr);
      mg.addColorStop(0, '#ffffff');
      mg.addColorStop(1, ['#7fb8ff', '#ff9bb8', '#8fe0a0', '#ffd36a'][i % 4]);
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    if (b.sunk) {
      ctx.fillStyle = 'rgba(70,150,225,0.45)';
      ctx.fillRect(x0 + wall + w * 0.06, top + h * 0.1, w - wall * 2 - w * 0.12, h * 0.9 - wall);
    }

    ctx.strokeStyle = '#9a6136';
    ctx.lineWidth = wall;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, top);
    ctx.lineTo(x0 + w * 0.08, bot - wall / 2);
    ctx.lineTo(x0 + w * 0.92, bot - wall / 2);
    ctx.lineTo(x0 + w, top);
    ctx.stroke();
    ctx.restore();

    if (!b.falling) {
      ctx.fillStyle = 'rgba(64,50,58,0.85)';
      ctx.font = 'bold ' + Math.round(Math.max(14, S * 0.22)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(sh.n, W / 2, bot + 6);
    }
  }

  function drawSaltMeter() {
    var x = tank.r - 8, y = tank.top - 8;
    ctx.font = 'bold ' + Math.round(Math.max(13, S * 0.2)) + 'px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(64,50,58,0.8)';
    ctx.fillText('🧂 ' + Math.min(state.salt, SALT_MAX) + '숟가락' + (state.salt > SALT_MAX ? ' (더 안 녹아요)' : ''), x, y);
  }

  /* ---------- 🤔 맞혀 보기 ---------- */

  function startGuess() {
    var up = UI.shuffle(ITEMS.filter(function (i) { return i.rho < 1; }));
    var down = UI.shuffle(ITEMS.filter(function (i) { return i.rho >= 1; }));
    state.deck = UI.shuffle(up.slice(0, ROUNDS / 2).concat(down.slice(0, ROUNDS / 2)));
    // 귤과 껍질 깐 귤이 같이 뽑히면 껍질 있는 귤을 먼저 — 견줘 봐야 놀라우니까요
    var a = indexOfName('귤'), b = indexOfName('껍질 깐 귤');
    if (a > b && b >= 0) { var t = state.deck[a]; state.deck[a] = state.deck[b]; state.deck[b] = t; }
    state.round = 0;
    state.stars = 0;
    state.rhoW = 1;
    state.salt = 0;
    nextGuess();
  }

  function indexOfName(n) {
    for (var i = 0; i < state.deck.length; i++) if (state.deck[i].n === n) return i;
    return -1;
  }

  function nextGuess() {
    if (state.round >= state.deck.length) return finish();
    state.locked = false;
    var o = state.deck[state.round];
    state.body = makeBody(o);
    hold(state.body);
    hideSay();
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    buildCtrl([
      { text: '🛟 뜬다', big: true, fn: function (b) { pickGuess(true, b); } },
      { text: '⬇️ 가라앉는다', big: true, fn: function (b) { pickGuess(false, b); } }
    ]);
    var ask = josa(o.n, '은', '는') + ' 물에 뜰까요, 가라앉을까요?';
    setLabel(o.e + ' ' + ask + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
    state.prompt = ask;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function pickGuess(up, btn) {
    if (state.locked) return;
    state.locked = true;
    state.guess = up;
    if (window.SFX) SFX.tap();
    if (window.TTS) TTS.cancel();
    btn.classList.add('picked');
    Array.prototype.forEach.call(el.ctrl.children, function (b) { b.disabled = (b !== btn); });
    var body = state.body;
    release(body);
    body.onSettle = function () { guessResult(body); };
  }

  function guessResult(b) {
    if (b !== state.body) return;
    var up = floats(b);
    var right = (up === state.guess);
    if (right) {
      state.stars += 1;
      if (window.SFX) SFX.correct();
      UI.confettiAt(el.stage);
    }
    updateScore();
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    var o = state.deck[state.round - 1];
    showSay((right ? '⭕ ' : '') + (up ? '🛟 떴어요!' : '⬇️ 가라앉았어요.'));
    var text = (right ? '맞았어요! ' : '') + o.why;
    setLabel(text);
    state.prompt = text;
    el.speakBtn.hidden = true;
    speak((up ? '떴어요! ' : '가라앉았어요. ') + text, function () { setTimeout(nextGuess, 800); });
  }

  /* ---------- 🧂 소금물 ---------- */

  var saltThing = 0, saltFloated = false;

  function startSalt() {
    state.rhoW = 1;
    state.salt = 0;
    saltFloated = false;
    putSaltThing(0);
    buildCtrl([
      { text: '🧂 소금 넣기', go: true, fn: addSalt },
      { text: SALT_THINGS[0].e + ' ' + SALT_THINGS[0].n, fn: function () { putSaltThing(0); } },
      { text: SALT_THINGS[1].e + ' ' + SALT_THINGS[1].n, fn: function () { putSaltThing(1); } },
      { text: SALT_THINGS[2].e + ' ' + SALT_THINGS[2].n, fn: function () { putSaltThing(2); } },
      { text: '💧 맹물로', fn: freshWater }
    ]);
    el.bar.style.width = '0%';
    var s = '맹물에 달걀을 넣었더니 가라앉았어요. 소금을 넣으면 어떻게 될까요?';
    setLabel('🥚 ' + s);
    state.prompt = s;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function putSaltThing(i) {
    saltThing = i;
    var b = makeBody(SALT_THINGS[i]);
    state.body = b;
    hold(b);
    release(b);
    saltFloated = floats(b);
    hideSay();
    if (window.SFX) SFX.tap();
  }

  function addSalt() {
    state.salt += 1;
    for (var i = 0; i < 26; i++) {
      grains.push({ x: W / 2 + S * 1.4 + (Math.random() - 0.5) * S * 0.5,
                    y: tank.top - S * 0.3 - Math.random() * S * 0.4,
                    v: 220 + Math.random() * 120, a: 1 });
    }
    if (window.SFX) SFX.tap();

    if (state.salt > SALT_MAX) {
      var full = '소금이 더는 녹지 않고 바닥에 쌓여요. 물이 녹일 수 있는 소금에는 끝이 있어요.';
      showSay('🧂 더는 안 녹아요');
      if (state.salt === SALT_MAX + 1) { setLabel(full); state.prompt = full; speak(full); }
      return;
    }
    state.rhoW = 1 + state.salt * SALT_STEP;
    el.bar.style.width = Math.round((state.salt / SALT_MAX) * 100) + '%';
    var b = state.body;
    b.settled = false;
    b.falling = true;
    b.t = 0.5;

    if (floats(b) && !saltFloated) {
      saltFloated = true;
      if (window.SFX) SFX.correct();
      UI.confettiAt(el.stage);
      var t = '떠올랐어요! 소금이 녹은 물은 같은 크기의 맹물보다 무거워서 ' + josa(SALT_THINGS[saltThing].n, '을', '를') +
              ' 더 세게 밀어 올려요. 아주 짠 바다 사해에서는 사람도 둥둥 떠요.';
      showSay('⭕ 떠올랐어요!');
      setLabel(t);
      state.prompt = t;
      speak(t);
    } else if (!floats(b)) {
      showSay('🧂 ' + state.salt + '숟가락… 아직 가라앉아 있어요');
    }
  }

  function freshWater() {
    state.salt = 0;
    state.rhoW = 1;
    grains = [];
    el.bar.style.width = '0%';
    putSaltThing(saltThing);
  }

  /* ---------- 🛶 찰흙 배 ---------- */

  function shapeOf(id) {
    for (var i = 0; i < SHAPES.length; i++) if (SHAPES[i].id === id) return SHAPES[i];
    return SHAPES[1];
  }

  function startBoat() {
    state.rhoW = 1;
    state.salt = 0;
    state.record = {};
    buildBoatCtrl();
    makeShape('lump');
  }

  function buildBoatCtrl() {
    var list = SHAPES.map(function (sh) {
      return { text: sh.e + ' ' + sh.n, on: state.shape === sh.id, fn: function () { makeShape(sh.id); } };
    });
    list.push({ text: '🔮 구슬 하나 더', go: true, fn: addMarble, off: state.shape === 'lump' });
    buildCtrl(list);
  }

  function makeShape(id) {
    state.shape = id;
    state.marbles = 0;
    var b = makeBody({ kind: id === 'lump' ? 'lump' : 'boat', n: shapeOf(id).n, rho: CLAY_RHO });
    state.body = b;
    hold(b);
    release(b);
    buildBoatCtrl();
    hideSay();
    if (window.SFX) SFX.tap();

    var text;
    if (id === 'lump') text = '찰흙을 동그랗게 뭉쳐서 넣었어요. 찰흙은 같은 크기의 물보다 무거워서 가라앉아요. 이 찰흙을 배 모양으로 펴면 어떨까요?';
    else text = '똑같은 찰흙을 넓게 펴서 배 모양으로 만들었어요. 이번엔 뜰까요? 뜨면 구슬을 하나씩 실어 봐요.';
    b.onSettle = function () {
      if (id === 'lump') return;
      var t = '떴어요! 배 모양은 물을 많이 밀어내서, 밀어낸 물만큼 위로 떠받쳐 줘요. 쇠로 만든 큰 배가 뜨는 것도 같은 까닭이에요.';
      showSay('🛟 떴어요!');
      setLabel(t);
      state.prompt = t;
      speak(t);
    };
    setLabel(shapeOf(id).e + ' ' + text);
    state.prompt = text;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = '0%';
    setTimeout(function () { speak(state.prompt); }, 250);
    updateScore();
  }

  function addMarble() {
    var b = state.body;
    if (!b || b.kind !== 'boat' || b.sunk || !b.falling) return;
    state.marbles += 1;
    if (window.SFX) SFX.tap();
    b.settled = false;
    b.t = 0.5;
    b.onSettle = null;
    el.bar.style.width = Math.min(100, Math.round(state.marbles / 25 * 100)) + '%';
    updateScore();

    if (rhoOf(b) >= state.rhoW) {
      // 배가 밀어낼 수 있는 물보다 무거워졌습니다 — 물이 넘쳐 들어와 가라앉아요
      b.sunk = true;
      var held = state.marbles - 1;
      state.record[state.shape] = held;
      if (window.SFX) SFX.splash();
      var other = (state.shape === 'narrow') ? state.record.wide : state.record.narrow;
      var t = '꼬르륵! 구슬 ' + held + '개까지는 떴어요. 배가 밀어낸 물보다 무거워지면 가라앉아요. ' +
              (state.shape === 'narrow'
                ? (other != null ? '넓은 배는 ' + other + '개였지요.' : '넓은 배로 만들면 몇 개까지 실을 수 있을까요?')
                : '넓은 배는 물을 더 많이 밀어내서 더 많이 실을 수 있어요.');
      showSay('⬇️ 구슬 ' + held + '개까지 떴어요');
      setLabel(t);
      state.prompt = t;
      speak(t);
      buildBoatCtrl();
      Array.prototype.forEach.call(el.ctrl.children, function (x) { if (x.textContent.indexOf('구슬') >= 0) x.disabled = true; });
      return;
    }
    showSay('🔮 ' + state.marbles + '개');
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    state.stars = 0;
    state.body = null;
    ripples = []; drops = []; grains = [];
    el.bar.style.width = '0%';
    el.speakBtn.hidden = true;
    hideSay();
    fit();
    updateScore();
    if (state.act === 'guess') return startGuess();
    if (state.act === 'salt') return startSalt();
    startBoat();
  }

  function finish() {
    state.playing = false;
    var total = state.deck.length;
    el.bar.style.width = '100%';
    UI.saveBest(BEST_KEY + '.' + state.act, state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);
    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  function buildCtrl(list) {
    el.ctrl.innerHTML = '';
    list.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'chip' + (o.big ? ' big' : '') + (o.go ? ' go' : '') + (o.on ? ' on' : '');
      b.textContent = o.text;
      if (o.off) b.disabled = true;
      b.addEventListener('click', function () { o.fn(b); });
      el.ctrl.appendChild(b);
    });
    setTimeout(fit, 0);
  }

  function showSay(text) { el.say.textContent = text; el.say.hidden = false; }
  function hideSay() { el.say.hidden = true; }
  function setLabel(text) { el.label.textContent = text; }

  function updateScore() {
    if (state.act === 'guess') el.score.textContent = '⭐ ' + state.stars;
    else if (state.act === 'boat') el.score.textContent = '🔮 ' + state.marbles;
    else el.score.textContent = '🧂';
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + ((a.id === state.act) ? ' on' : '');
      var best = (a.id === 'guess') ? UI.readBest(BEST_KEY + '.guess') : null;
      b.innerHTML = '<span class="mi">' + a.icon + '</span>' +
                    '<span class="mn">' + a.name + '</span>' +
                    '<span class="mb">' + (best ? ('⭐ ' + best.stars + '/' + best.total) : '') + '</span>';
      b.addEventListener('click', function () {
        state.act = a.id;
        UI.saveValue(ACT_KEY, a.id);
        Array.prototype.forEach.call(el.modeRow.children, function (x) { x.classList.toggle('on', x === b); });
        el.modeDesc.textContent = a.desc;
      });
      el.modeRow.appendChild(b);
    });
    el.modeDesc.textContent = findAct(state.act).desc;
  }

  buildModeRow();

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '뜰까 가라앉을까 놀이예요.'; } });
  });

  var back = Catalog.backHref('float.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  /* ---------- 소리 ---------- */

  function josa(word, a, b) {
    var ch = word.charCodeAt(word.length - 1);
    if (ch < 0xAC00 || ch > 0xD7A3) return word + b;
    return word + (((ch - 0xAC00) % 28) ? a : b);
  }

  var speakSeq = 0;

  function speak(text, then) {
    var seq = ++speakSeq;
    var called = false;
    function once() {
      if (called) return;
      called = true;
      if (seq !== speakSeq) return;
      el.speakBtn.classList.remove('speaking');
      if (then) then();
    }
    if (!text || !window.TTS || !TTS.supported) {
      setTimeout(once, Math.min(12000, 900 + (text || '').length * 90));
      return;
    }
    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }

  /* ---------- 시작 ---------- */

  window.addEventListener('resize', fit);
  // 이야기 판·단추 줄이 나타나고 사라지면 그림 칸 높이가 바뀝니다 — 그때마다 다시 잽니다
  if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(el.stage);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  fit();
  state.body = makeBody(ITEMS[0]);
  hold(state.body);
  updateScore();
  setLabel('🛟 뜰까? 가라앉을까?');
  requestAnimationFrame(frame);
})();
