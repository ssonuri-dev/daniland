/* =========================================================================
 * 다니랜드 - 한살이 (life.html)
 *
 * 별의 일생과 같은 뼈대입니다 — 생물을 고르면 알(씨)에서 어른까지 한 걸음씩 흘러가고,
 * 걸음마다 그림이 스르르 바뀝니다. 사진·그림 파일 없이 **모두 캔버스에 직접 그립니다**
 * (`drawArt()` — 무대 배경 `drawScene()` 위에 그 단계 그림). 같은 함수가 순서 맞추기 카드의
 * 작은 그림과 시작 화면 단추 그림도 그립니다.
 *
 * 강낭콩은 그림이 하나('bean')이고 g(0~5)가 스르르 따라가서 뿌리가 뻗고 줄기가 올라오는 것이 보입니다.
 * 다른 생물은 앞 그림이 흐려지며 새 그림이 겹쳐 나옵니다(`fade`).
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   grow  : 지켜보기   - 생물 하나의 한살이가 한 걸음씩 흘러갑니다 (점수 없음, 👀 n/5)
 *   order : 순서 맞추기 - 한 생물의 단계를 차례대로 누릅니다 (생물 다섯 = 다섯 판)
 *   quiz  : 퀴즈       - 보기 넉 장 (js/life-cycles.js 의 LIFE_QUIZ)
 *
 * 기록 키는 daniland.best.life(카드의 ⭐)·daniland.best.life.<act>,
 * 마지막 놀이·생물은 daniland.lifeAct · daniland.lifeKind, 끝까지 본 생물은 daniland.life.seen.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var QUIZ_ROUNDS = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '꼬마 과학자!'];

  var BEST_KEY = 'daniland.best.life';
  var ACT_KEY = 'daniland.lifeAct';
  var KIND_KEY = 'daniland.lifeKind';
  var SEEN_KEY = 'daniland.life.seen';

  var CYCLES = window.LIFE_CYCLES || [];

  var ACTS = [
    { id: 'grow',  name: '지켜보기',   icon: '👀', desc: '알이나 씨에서 어른이 될 때까지 지켜봐요' },
    { id: 'order', name: '순서 맞추기', icon: '🔢', desc: '자라는 차례대로 그림을 눌러요' },
    { id: 'quiz',  name: '퀴즈',        icon: '❓', desc: '한살이에 대해 물어봐요' }
  ];

  var el = {
    stage: document.getElementById('stage'),
    canvas: document.getElementById('canvas'),
    steps: document.getElementById('steps'),
    story: document.getElementById('story'),
    storyTitle: document.getElementById('storyTitle'),
    storyText: document.getElementById('storyText'),
    nextBtn: document.getElementById('nextBtn'),
    label: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    backBtn: document.getElementById('backBtn'),
    voiceBtn: document.getElementById('voiceBtn'),

    startOverlay: document.getElementById('startOverlay'),
    modeRow: document.getElementById('modeRow'),
    modeDesc: document.getElementById('modeDesc'),
    kindHint: document.getElementById('kindHint'),
    kindRow: document.getElementById('kindRow'),
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
    act: UI.loadValue(ACT_KEY) || 'grow',
    kind: UI.loadValue(KIND_KEY) || 'butterfly',
    cycle: null,
    step: 0,
    playing: false,
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    deck: [],
    need: 0,
    prompt: '',
    seen: loadSeen()
  };

  if (!findAct(state.act)) state.act = 'grow';
  if (!findCycle(state.kind)) state.kind = 'butterfly';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  function findCycle(id) {
    for (var i = 0; i < CYCLES.length; i++) if (CYCLES[i].id === id) return CYCLES[i];
    return null;
  }

  function loadSeen() {
    try {
      var v = JSON.parse(UI.loadValue(SEEN_KEY) || '[]');
      return (v && v.length) ? v : [];
    } catch (e) { return []; }
  }

  function isSeen(id) {
    for (var i = 0; i < state.seen.length; i++) if (state.seen[i] === id) return true;
    return false;
  }

  function markSeen(id) {
    if (isSeen(id)) return;
    state.seen.push(id);
    UI.saveValue(SEEN_KEY, JSON.stringify(state.seen));
  }

  /* ---------- 캔버스 ---------- */

  var W = 0, H = 0, dpr = 1;
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
  }

  // 지금 그리는 것 — 장면, 그림, 앞 그림(흐려지는 중), 강낭콩 자람(g)
  var view = { scene: 'leaf', art: 'bf-egg', prev: null, fade: 1, g: 0, gTarget: 0, age: 0 };

  function showArt(scene, stage) {
    if (view.scene !== scene) { view.prev = null; view.fade = 1; view.g = stage.g || 0; }
    else if (view.art !== stage.art) { view.prev = view.art; view.fade = 0; }
    view.scene = scene;
    if (view.art !== stage.art) view.age = 0;
    view.art = stage.art;
    view.gTarget = stage.g || 0;
  }

  var clock = 0, last = 0;

  function frame(now) {
    requestAnimationFrame(frame);   // 맨 앞에서 예약 — 한 장 그리다 탈이 나도 멈추지 않게
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    clock += dt;
    view.age += dt;
    view.fade = Math.min(1, view.fade + dt / 0.9);
    // 강낭콩은 2초쯤에 걸쳐 따라 자랍니다
    view.g += (view.gTarget - view.g) * Math.min(1, dt * 1.6);
    if (!W) return;
    drawScene(ctx, W, H, view.scene, clock);
    if (view.prev && view.fade < 1) {
      ctx.globalAlpha = 1 - view.fade;
      drawArt(ctx, W, H, view.prev, clock, view.g, 9);
    }
    ctx.globalAlpha = view.prev ? view.fade : 1;
    drawArt(ctx, W, H, view.art, clock, view.g, view.age);
    ctx.globalAlpha = 1;
  }

  /* =========================================================================
   * 그림 — c 는 그릴 캔버스, w·h 는 그 크기, t 는 흐르는 시간(초), g 는 강낭콩 자람(0~5),
   * age 는 그 그림이 나온 지 얼마나 됐나(날개 펴기처럼 한 번만 일어나는 움직임에 씁니다).
   * 크기는 모두 u = min(w, h) 에 견줘 잡아서 큰 무대와 작은 카드에 똑같이 그려집니다.
   * ========================================================================= */

  function drawScene(c, w, h, scene, t) {
    var u = Math.min(w, h);
    var g;
    if (scene === 'leaf') {
      g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#e6f6ff');
      g.addColorStop(1, '#f4fbe8');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      // 큰 배춧잎
      c.save();
      c.translate(w * 0.5, h * 0.66);
      c.rotate(-0.12);
      var rx = Math.min(w * 0.48, u * 0.95), ry = Math.min(h * 0.36, u * 0.42);
      g = c.createRadialGradient(0, 0, ry * 0.2, 0, 0, rx);
      g.addColorStop(0, '#a8dc84');
      g.addColorStop(1, '#6cb85a');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(235,250,215,0.9)';
      c.lineWidth = Math.max(2, u * 0.012);
      c.beginPath();
      c.moveTo(-rx * 0.95, 0);
      c.lineTo(rx * 0.95, 0);
      c.stroke();
      c.lineWidth = Math.max(1, u * 0.005);
      for (var i = -3; i <= 3; i++) {
        if (!i) continue;
        var x = i * rx * 0.24;
        c.beginPath();
        c.moveTo(x, 0); c.quadraticCurveTo(x + rx * 0.08, -ry * 0.4, x + rx * 0.2, -ry * 0.85);
        c.moveTo(x, 0); c.quadraticCurveTo(x + rx * 0.08, ry * 0.4, x + rx * 0.2, ry * 0.85);
        c.stroke();
      }
      c.restore();
    } else if (scene === 'pond') {
      var water = h * 0.42;
      g = c.createLinearGradient(0, 0, 0, water);
      g.addColorStop(0, '#dff3ff');
      g.addColorStop(1, '#f2fbff');
      c.fillStyle = g;
      c.fillRect(0, 0, w, water);
      c.fillStyle = '#9fd67f';
      c.fillRect(0, water - u * 0.03, w, u * 0.03);
      g = c.createLinearGradient(0, water, 0, h);
      g.addColorStop(0, '#8fcdf0');
      g.addColorStop(1, '#4f98c9');
      c.fillStyle = g;
      c.fillRect(0, water, w, h - water);
      c.fillStyle = '#7a6a4a';
      c.fillRect(0, h - u * 0.04, w, u * 0.04);
      // 물풀
      c.strokeStyle = '#4f9a54';
      c.lineWidth = Math.max(2, u * 0.012);
      [0.08, 0.13, 0.9, 0.95].forEach(function (k, i) {
        var x = w * k;
        c.beginPath();
        c.moveTo(x, h);
        c.quadraticCurveTo(x + Math.sin(t * 0.8 + i) * u * 0.03, h - u * 0.3, x + u * 0.02, water - u * 0.2);
        c.stroke();
      });
      // 물결
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = 2;
      c.beginPath();
      for (var x2 = 0; x2 <= w; x2 += 8) {
        var y2 = water + Math.sin(x2 * 0.05 + t * 2) * 1.5;
        if (!x2) c.moveTo(x2, y2); else c.lineTo(x2, y2);
      }
      c.stroke();
    } else if (scene === 'nest') {
      g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fff6e2');
      g.addColorStop(1, '#ffe3b3');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#e9c27f';
      c.fillRect(0, h * 0.86, w, h * 0.14);
      // 지푸라기 둥지
      var nx = w * 0.5, ny = h * 0.84, nr = Math.min(w * 0.4, u * 0.55);
      c.fillStyle = '#c99a4e';
      c.beginPath();
      c.ellipse(nx, ny, nr, nr * 0.24, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#e8c27a';
      c.lineWidth = Math.max(1.5, u * 0.007);
      for (var k = 0; k < 26; k++) {
        var a = (k / 26) * Math.PI * 2;
        c.beginPath();
        c.moveTo(nx + Math.cos(a) * nr * 0.6, ny + Math.sin(a) * nr * 0.14);
        c.lineTo(nx + Math.cos(a + 0.5) * nr * 1.0, ny + Math.sin(a + 0.5) * nr * 0.24);
        c.stroke();
      }
    } else {
      // 흙 — 땅 위는 하늘, 땅 밑은 잘라 본 흙 속
      var ground = h * 0.56;
      g = c.createLinearGradient(0, 0, 0, ground);
      g.addColorStop(0, '#d8f0ff');
      g.addColorStop(1, '#f3fbff');
      c.fillStyle = g;
      c.fillRect(0, 0, w, ground);
      c.fillStyle = '#ffd45a';
      c.beginPath();
      c.arc(w * 0.86, h * 0.13, u * 0.07, 0, Math.PI * 2);
      c.fill();
      g = c.createLinearGradient(0, ground, 0, h);
      g.addColorStop(0, '#a8774a');
      g.addColorStop(1, '#7a5233');
      c.fillStyle = g;
      c.fillRect(0, ground, w, h - ground);
      c.fillStyle = '#6fb34f';
      c.fillRect(0, ground - u * 0.015, w, u * 0.02);
      c.fillStyle = 'rgba(60,35,20,0.25)';
      for (var d = 0; d < 40; d++) {
        var sx = ((d * 97) % 100) / 100 * w, sy = ground + (((d * 53) % 100) / 100) * (h - ground);
        c.fillRect(sx, sy, 3, 2);
      }
    }
  }

  function drawArt(c, w, h, art, t, g, age) {
    var u = Math.min(w, h);
    switch (art) {
      case 'bf-egg': return bfEgg(c, w, h, u, t);
      case 'bf-baby': return bfBaby(c, w, h, u, t);
      case 'bf-larva': return caterpillar(c, w * 0.5, h * 0.62, u * 0.5, t, 1);
      case 'bf-pupa': return bfPupa(c, w, h, u, t);
      case 'bf-adult': return bfAdult(c, w, h, u, t, age);
      case 'fr-egg': return frEgg(c, w, h, u, t);
      case 'fr-tadpole': return tadpole(c, w * 0.5 + Math.sin(t * 0.7) * u * 0.12, h * 0.7, u * 0.13, t, 0);
      case 'fr-hind': return tadpole(c, w * 0.5 + Math.sin(t * 0.7) * u * 0.1, h * 0.7, u * 0.16, t, 1);
      case 'fr-front': return tadpole(c, w * 0.5 + Math.sin(t * 0.6) * u * 0.08, h * 0.62, u * 0.18, t, 2);
      case 'fr-froglet': return frogOnPad(c, w, h, u, t, 0.5, 0.75);
      case 'fr-adult': return frogOnPad(c, w, h, u, t, 0, 1);
      case 'ch-egg': return chEgg(c, w, h, u, t);
      case 'ch-hatch': return chHatch(c, w, h, u, t);
      case 'ch-chick': return chChick(c, w, h, u, t);
      case 'ch-young': return chicken(c, w * 0.5, h * 0.62, u * 0.34, t, 'young');
      case 'ch-adult': return chAdult(c, w, h, u, t);
      case 'bean': return bean(c, w, h, u, t, g);
      case 'df-egg': return dfEgg(c, w, h, u, t);
      case 'df-nymph': return nymph(c, w * 0.5 + Math.sin(t * 0.4) * u * 0.08, h * 0.88, u * 0.26, t, 0);
      case 'df-big': return nymph(c, w * 0.5 + Math.sin(t * 0.4) * u * 0.06, h * 0.86, u * 0.36, t, 1);
      case 'df-emerge': return dfEmerge(c, w, h, u, t, age);
      case 'df-adult': return dragonfly(c, w * 0.5 + Math.sin(t * 0.6) * u * 0.15, h * 0.24 + Math.cos(t * 0.9) * u * 0.04, u * 0.42, t, 1, '#e0442f');
    }
  }

  /* ---------- 🦋 배추흰나비 ---------- */

  function magnifier(c, x, y, r, tx, ty, inside) {
    c.strokeStyle = '#8a6a4a';
    c.lineWidth = Math.max(4, r * 0.12);
    c.lineCap = 'round';
    c.beginPath();
    var a = Math.atan2(ty - y, tx - x);
    c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    c.lineTo(x + Math.cos(a) * (r + r * 0.55), y + Math.sin(a) * (r + r * 0.55));
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.clip();
    inside();
    c.restore();
    c.strokeStyle = '#5b6b7a';
    c.lineWidth = Math.max(3, r * 0.08);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
  }

  function bfEggShape(c, x, y, s, broken) {
    c.fillStyle = '#ffd84a';
    c.beginPath();
    c.ellipse(x, y, s * 0.42, s, 0, broken ? Math.PI * 0.1 : 0, broken ? Math.PI * 0.9 : Math.PI * 2);
    if (broken) c.lineTo(x - s * 0.3, y + s * 0.1);
    c.fill();
    c.strokeStyle = 'rgba(190,140,20,0.7)';
    c.lineWidth = Math.max(1, s * 0.05);
    for (var i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(x + i * s * 0.18, y - (broken ? -s * 0.1 : s * 0.85));
      c.lineTo(x + i * s * 0.18, y + s * 0.85);
      c.stroke();
    }
  }

  function bfEgg(c, w, h, u, t) {
    var ex = w * 0.5, ey = h * 0.66;
    bfEggShape(c, ex, ey, Math.max(2, u * 0.012));
    magnifier(c, w * 0.5 + u * 0.22, h * 0.3, u * 0.2, ex, ey, function () {
      bfEggShape(c, w * 0.5 + u * 0.22, h * 0.3 + u * 0.01, u * 0.13);
    });
  }

  function bfBaby(c, w, h, u, t) {
    var ex = w * 0.5, ey = h * 0.66;
    c.fillStyle = '#5aa63e';
    c.fillRect(ex - u * 0.01, ey - 1, u * 0.02, 3);
    var mx = w * 0.5 + u * 0.22, my = h * 0.3;
    magnifier(c, mx, my, u * 0.2, ex, ey, function () {
      c.fillStyle = '#b6df8f';
      c.fillRect(mx - u * 0.2, my + u * 0.08, u * 0.4, u * 0.2);
      bfEggShape(c, mx - u * 0.1, my + u * 0.0, u * 0.08, true);
      caterpillar(c, mx + u * 0.04, my + u * 0.07, u * 0.16, t, 0.6);
    });
  }

  // 애벌레 — 동그란 마디가 이어진 초록 몸. 자벌레처럼 가운데가 들썩이며 기어갑니다
  function caterpillar(c, x, y, len, t, fat) {
    var n = 11;
    var r = len / (n - 1) * 0.78 * (0.9 + (fat || 1) * 0.1);   // 마디끼리 겹쳐 통통하게
    var crawl = Math.sin(t * 2.4);
    for (var i = 0; i < n; i++) {
      var k = i / (n - 1);
      var px = x - len / 2 + k * len * (0.95 + crawl * 0.03);
      var lift = Math.sin(k * Math.PI) * Math.max(0, crawl) * r * 0.8;
      var py = y - lift;
      c.fillStyle = (i === n - 1) ? '#4f9a33' : '#78c24f';
      c.beginPath();
      c.arc(px, py, r * (i === n - 1 ? 1.08 : 1), 0, Math.PI * 2);
      c.fill();
      if (i < n - 1) {
        c.fillStyle = '#e8e15a';
        c.beginPath();
        c.arc(px, py + r * 0.35, r * 0.18, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#5a9a3a';
        c.fillRect(px - r * 0.5, py + r * 0.8, r * 0.18, r * 0.35);
      }
    }
    var hx = x + len / 2 * (0.95 + crawl * 0.03), hy = y;
    c.fillStyle = '#222';
    c.beginPath();
    c.arc(hx + r * 0.35, hy - r * 0.2, r * 0.18, 0, Math.PI * 2);
    c.fill();
  }

  function bfPupa(c, w, h, u, t) {
    // 배추 줄기에 실로 묶여 붙은 번데기
    var sx = w * 0.42;
    c.strokeStyle = '#7fae4f';
    c.lineWidth = u * 0.06;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx, h * 0.98);
    c.quadraticCurveTo(sx - u * 0.03, h * 0.5, sx + u * 0.02, h * 0.05);
    c.stroke();
    var px = sx + u * 0.12, py = h * 0.48, L = u * 0.3;
    c.save();
    c.translate(px, py);
    c.rotate(0.12);
    var g = c.createLinearGradient(-L * 0.25, 0, L * 0.25, 0);
    g.addColorStop(0, '#9fbf62');
    g.addColorStop(1, '#c7d98a');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -L * 0.55);
    c.quadraticCurveTo(L * 0.3, -L * 0.25, L * 0.18, L * 0.05);
    c.quadraticCurveTo(L * 0.22, L * 0.3, 0, L * 0.5);
    c.quadraticCurveTo(-L * 0.25, L * 0.25, -L * 0.15, -L * 0.05);
    c.quadraticCurveTo(-L * 0.2, -L * 0.3, 0, -L * 0.55);
    c.fill();
    c.strokeStyle = 'rgba(90,110,50,0.6)';
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
    // 허리에 맨 실
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = Math.max(1.5, u * 0.006);
    c.beginPath();
    c.moveTo(sx + u * 0.02, py - u * 0.02);
    c.quadraticCurveTo(px + u * 0.12, py - u * 0.06, sx + u * 0.02, py + u * 0.02);
    c.stroke();
    // 꼬리 끝을 붙인 실
    c.beginPath();
    c.moveTo(px - u * 0.0, py + L * 0.5);
    c.lineTo(sx + u * 0.02, py + L * 0.55);
    c.stroke();
  }

  function butterfly(c, x, y, s, t, open) {
    var flap = 0.25 + 0.75 * Math.abs(Math.cos(t * 7)) * open + (1 - open) * 0.2;
    c.save();
    c.translate(x, y);
    [-1, 1].forEach(function (side) {
      c.save();
      c.scale(side * flap, 1);
      // 앞날개
      c.fillStyle = '#fbfbf2';
      c.strokeStyle = '#b9b9a8';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, -s * 0.05);
      c.quadraticCurveTo(s * 0.35, -s * 0.6, s * 0.62, -s * 0.38);
      c.quadraticCurveTo(s * 0.6, -s * 0.05, s * 0.05, 0);
      c.closePath();
      c.fill(); c.stroke();
      // 앞날개 끝의 까만 무늬와 점 둘
      c.fillStyle = '#3a3a3a';
      c.beginPath();
      c.moveTo(s * 0.45, -s * 0.5);
      c.quadraticCurveTo(s * 0.62, -s * 0.48, s * 0.62, -s * 0.36);
      c.lineTo(s * 0.5, -s * 0.38);
      c.closePath();
      c.fill();
      c.beginPath(); c.arc(s * 0.36, -s * 0.24, s * 0.04, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(s * 0.3, -s * 0.1, s * 0.035, 0, Math.PI * 2); c.fill();
      // 뒷날개
      c.fillStyle = '#f7f6e6';
      c.beginPath();
      c.moveTo(s * 0.03, s * 0.02);
      c.quadraticCurveTo(s * 0.45, -s * 0.02, s * 0.4, s * 0.25);
      c.quadraticCurveTo(s * 0.25, s * 0.42, s * 0.03, s * 0.2);
      c.closePath();
      c.fill(); c.stroke();
      c.restore();
    });
    c.fillStyle = '#2b2b2b';
    c.beginPath();
    c.ellipse(0, 0, s * 0.045, s * 0.26, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2b2b2b';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -s * 0.24); c.quadraticCurveTo(-s * 0.05, -s * 0.4, -s * 0.12, -s * 0.44);
    c.moveTo(0, -s * 0.24); c.quadraticCurveTo(s * 0.05, -s * 0.4, s * 0.12, -s * 0.44);
    c.stroke();
    c.restore();
  }

  function flower(c, x, y, s, color) {
    c.strokeStyle = '#5ea844';
    c.lineWidth = Math.max(2, s * 0.08);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + s * 3);
    c.stroke();
    c.fillStyle = color;
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2 + Math.PI / 4;
      c.beginPath();
      c.ellipse(x + Math.cos(a) * s * 0.45, y + Math.sin(a) * s * 0.45, s * 0.42, s * 0.32, a, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#f0a020';
    c.beginPath();
    c.arc(x, y, s * 0.22, 0, Math.PI * 2);
    c.fill();
  }

  function bfAdult(c, w, h, u, t, age) {
    // 노란 배추꽃 위를 팔랑팔랑. 처음 1.5초는 날개를 펴는 중이라 덜 펄럭입니다
    flower(c, w * 0.3, h * 0.62, u * 0.07, '#ffe04a');
    flower(c, w * 0.72, h * 0.7, u * 0.06, '#ffe04a');
    var open = Math.min(1, (age || 9) / 1.5);
    butterfly(c, w * 0.5 + Math.sin(t * 0.7) * u * 0.14, h * 0.36 + Math.sin(t * 1.3) * u * 0.05, u * 0.42, t, open);
  }

  /* ---------- 🐸 개구리 ---------- */

  function frEgg(c, w, h, u, t) {
    var cx = w * 0.5, cy = h * 0.7;
    var r = u * 0.034;
    for (var i = 0; i < 30; i++) {
      var a = i * 2.39996;
      var d = Math.sqrt(i) * r * 1.5;
      var x = cx + Math.cos(a) * d * 1.4 + Math.sin(t * 0.8) * 2;
      var y = cy + Math.sin(a) * d * 0.9;
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = '#2a2a2a';
      c.beginPath();
      c.arc(x, y, r * 0.33, 0, Math.PI * 2);
      c.fill();
    }
  }

  // 올챙이 — legs: 0 없음 · 1 뒷다리 · 2 뒷다리와 앞다리. 꼬리를 흔들며 헤엄칩니다
  function tadpole(c, x, y, s, t, legs) {
    var dir = Math.cos(t * 0.7) >= 0 ? 1 : -1;
    c.save();
    c.translate(x, y);
    c.scale(dir, 1);
    // 꼬리
    c.fillStyle = 'rgba(80,65,50,0.75)';
    c.beginPath();
    c.moveTo(-s * 0.35, -s * 0.18);
    for (var i = 0; i <= 10; i++) {
      var k = i / 10;
      c.lineTo(-s * 0.35 - k * s * 1.4, Math.sin(t * 9 - k * 4) * s * 0.18 * k - s * 0.18 * (1 - k));
    }
    for (var j = 10; j >= 0; j--) {
      var k2 = j / 10;
      c.lineTo(-s * 0.35 - k2 * s * 1.4, Math.sin(t * 9 - k2 * 4) * s * 0.18 * k2 + s * 0.18 * (1 - k2));
    }
    c.closePath();
    c.fill();
    // 다리
    c.strokeStyle = '#4a3b2b';
    c.lineWidth = Math.max(2, s * 0.09);
    c.lineCap = 'round';
    if (legs >= 1) {
      c.beginPath();
      c.moveTo(-s * 0.3, s * 0.2); c.lineTo(-s * 0.55, s * 0.5); c.lineTo(-s * 0.3, s * 0.62);
      c.moveTo(-s * 0.3, -s * 0.2); c.lineTo(-s * 0.55, -s * 0.5); c.lineTo(-s * 0.3, -s * 0.62);
      c.stroke();
    }
    if (legs >= 2) {
      c.beginPath();
      c.moveTo(s * 0.2, s * 0.28); c.lineTo(s * 0.35, s * 0.5);
      c.moveTo(s * 0.2, -s * 0.28); c.lineTo(s * 0.35, -s * 0.5);
      c.stroke();
    }
    // 몸
    c.fillStyle = legs >= 2 ? '#5d6b3a' : '#4a3b2b';
    c.beginPath();
    c.ellipse(0, 0, s * 0.5, s * 0.38, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(s * 0.26, -s * 0.14, s * 0.09, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(s * 0.29, -s * 0.14, s * 0.045, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function lilyPad(c, x, y, r) {
    c.fillStyle = '#5daa4e';
    c.beginPath();
    c.moveTo(x, y);
    c.ellipse(x, y, r, r * 0.3, 0, 0.25, Math.PI * 2 - 0.05);
    c.closePath();
    c.fill();
  }

  // 개구리 — 옆에서 본 앉은 모습. tail 이 있으면 꼬리가 남아 있습니다
  function frog(c, x, y, s, t, tail) {
    if (tail > 0) {
      c.fillStyle = '#6a8a3a';
      c.beginPath();
      c.moveTo(x - s * 0.4, y - s * 0.1);
      c.lineTo(x - s * 0.4 - s * tail, y + s * 0.02);
      c.lineTo(x - s * 0.4, y + s * 0.12);
      c.closePath();
      c.fill();
    }
    // 뒷다리
    c.fillStyle = '#4f9a3c';
    c.beginPath();
    c.ellipse(x - s * 0.22, y + s * 0.12, s * 0.32, s * 0.17, -0.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(x - s * 0.05, y + s * 0.3, s * 0.3, s * 0.07, 0, 0, Math.PI * 2);
    c.fill();
    // 몸
    var g = c.createRadialGradient(x, y - s * 0.15, s * 0.05, x, y, s * 0.55);
    g.addColorStop(0, '#8fd36a');
    g.addColorStop(1, '#4f9a3c');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, s * 0.5, s * 0.33, -0.25, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f2f6c8';
    c.beginPath();
    c.ellipse(x + s * 0.18, y + s * 0.12, s * 0.25, s * 0.14, -0.3, 0, Math.PI * 2);
    c.fill();
    // 앞다리
    c.strokeStyle = '#4f9a3c';
    c.lineWidth = Math.max(2, s * 0.08);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x + s * 0.28, y + s * 0.1);
    c.lineTo(x + s * 0.34, y + s * 0.32);
    c.stroke();
    // 눈
    c.fillStyle = '#8fd36a';
    c.beginPath();
    c.arc(x + s * 0.28, y - s * 0.3, s * 0.12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x + s * 0.3, y - s * 0.31, s * 0.08, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(x + s * 0.32, y - s * 0.31, s * 0.045, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2f5a24';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x + s * 0.48, y - s * 0.08);
    c.quadraticCurveTo(x + s * 0.3, y - s * 0.02, x + s * 0.2, y - s * 0.1);
    c.stroke();
  }

  function frogOnPad(c, w, h, u, t, tail, size) {
    var water = h * 0.42;
    var px = w * 0.5, py = water + u * 0.01;
    lilyPad(c, px, py, u * 0.3);
    var s = u * 0.34 * size;
    var fx = px, fy = py - s * 0.32;
    frog(c, fx, fy, s, t, tail);
    if (tail) return;
    // 파리 한 마리와 혀 — 3초마다 낼름
    var flyX = fx + s * 1.25 + Math.sin(t * 3) * u * 0.02, flyY = fy - s * 0.55 + Math.cos(t * 4) * u * 0.02;
    var ph = (t % 3) / 3;
    if (ph < 0.1) {
      var k = ph < 0.05 ? ph / 0.05 : (0.1 - ph) / 0.05;
      c.strokeStyle = '#e8708a';
      c.lineWidth = Math.max(2, s * 0.04);
      c.beginPath();
      c.moveTo(fx + s * 0.45, fy - s * 0.08);
      c.lineTo(fx + s * 0.45 + (flyX - fx - s * 0.45) * k, fy - s * 0.08 + (flyY - fy + s * 0.08) * k);
      c.stroke();
    } else {
      c.fillStyle = '#333';
      c.beginPath();
      c.arc(flyX, flyY, Math.max(2, u * 0.012), 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(200,220,255,0.8)';
      c.beginPath();
      c.ellipse(flyX - 2, flyY - 4, Math.max(2, u * 0.012), Math.max(1, u * 0.006), -0.5, 0, Math.PI * 2);
      c.fill();
    }
  }

  /* ---------- 🐔 닭 ---------- */

  function egg(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    var g = c.createRadialGradient(-s * 0.3, -s * 0.4, s * 0.1, 0, 0, s * 1.1);
    g.addColorStop(0, '#fffdf6');
    g.addColorStop(1, '#ecd6b0');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, 0, s * 0.75, s, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function chEgg(c, w, h, u, t) {
    var y = h * 0.78;
    var warm = c.createRadialGradient(w * 0.5, y, 0, w * 0.5, y, u * 0.5);
    warm.addColorStop(0, 'rgba(255,170,80,' + (0.25 + 0.1 * Math.sin(t * 2)).toFixed(2) + ')');
    warm.addColorStop(1, 'rgba(255,170,80,0)');
    c.fillStyle = warm;
    c.fillRect(0, 0, w, h);
    // 알을 품고 앉은 엄마 닭 — 알은 그 앞으로 빼꼼 보이게 나중에 그립니다
    chicken(c, w * 0.5, y - u * 0.15, u * 0.34, t, 'hen', true);
    egg(c, w * 0.5 - u * 0.15, y + u * 0.02, u * 0.08, -0.2);
    egg(c, w * 0.5 + u * 0.15, y + u * 0.02, u * 0.08, 0.2);
    egg(c, w * 0.5, y + u * 0.04, u * 0.09, 0);
  }

  function chHatch(c, w, h, u, t) {
    var x = w * 0.5, y = h * 0.72, s = u * 0.18;
    var wob = (Math.sin(t * 3) > 0.6) ? Math.sin(t * 30) * 0.08 : 0;
    egg(c, x, y, s, wob);
    c.save();
    c.translate(x, y);
    c.rotate(wob);
    // 금과 구멍, 그 사이로 내민 부리
    c.strokeStyle = '#8a6a4a';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath();
    c.moveTo(-s * 0.65, -s * 0.25);
    for (var i = 1; i <= 8; i++) c.lineTo(-s * 0.65 + i * s * 0.16, -s * 0.25 + ((i % 2) ? -s * 0.12 : s * 0.05));
    c.stroke();
    c.fillStyle = '#3a2a1a';
    c.beginPath();
    c.arc(s * 0.2, -s * 0.33, s * 0.15, 0, Math.PI * 2);
    c.fill();
    var poke = Math.max(0, Math.sin(t * 3));
    c.fillStyle = '#f0a030';
    c.beginPath();
    c.moveTo(s * 0.12, -s * 0.36);
    c.lineTo(s * (0.38 + poke * 0.12), -s * 0.34);
    c.lineTo(s * 0.12, -s * 0.26);
    c.closePath();
    c.fill();
    c.restore();
  }

  // 병아리 — 노란 솜털 공
  function chick(c, x, y, s, t) {
    var hop = Math.max(0, Math.sin(t * 4)) * s * 0.12;
    y -= hop;
    c.strokeStyle = '#f0a030';
    c.lineWidth = Math.max(2, s * 0.06);
    c.beginPath();
    c.moveTo(x - s * 0.15, y + s * 0.45); c.lineTo(x - s * 0.15, y + s * 0.62 + hop);
    c.moveTo(x + s * 0.12, y + s * 0.45); c.lineTo(x + s * 0.12, y + s * 0.62 + hop);
    c.stroke();
    c.fillStyle = '#ffd93a';
    c.beginPath();
    c.ellipse(x, y + s * 0.15, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(x + s * 0.32, y - s * 0.28, s * 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f4c21e';
    c.beginPath();
    c.ellipse(x - s * 0.05, y + s * 0.12, s * 0.25, s * 0.16, -0.4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f08a20';
    c.beginPath();
    c.moveTo(x + s * 0.58, y - s * 0.32);
    c.lineTo(x + s * 0.76, y - s * 0.26);
    c.lineTo(x + s * 0.58, y - s * 0.2);
    c.closePath();
    c.fill();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(x + s * 0.42, y - s * 0.34, s * 0.05, 0, Math.PI * 2);
    c.fill();
  }

  function chChick(c, w, h, u, t) {
    // 깨진 껍데기 반쪽 둘
    c.fillStyle = '#f5e6c8';
    c.beginPath();
    c.ellipse(w * 0.5 - u * 0.3, h * 0.82, u * 0.09, u * 0.06, 0.3, 0, Math.PI);
    c.fill();
    c.beginPath();
    c.ellipse(w * 0.5 + u * 0.3, h * 0.82, u * 0.08, u * 0.055, -0.3, 0, Math.PI);
    c.fill();
    chick(c, w * 0.5, h * 0.64, u * 0.26, t);
    // 모이
    c.fillStyle = '#d9a640';
    for (var i = 0; i < 6; i++) c.fillRect(w * 0.5 + u * (0.2 + i * 0.03), h * 0.86 + (i % 2) * 3, 3, 3);
  }

  // 닭 — kind: 'young' 중닭(흰 깃털 사이 노란 솜털, 작은 볏) · 'hen' 암탉
  function chicken(c, x, y, s, t, kind, sitting) {
    var peck = sitting ? 0 : Math.max(0, Math.sin(t * 1.6)) * 0.25;
    var body = kind === 'hen' ? '#b8642c' : '#f4efe2';
    // 다리
    if (!sitting) {
      c.strokeStyle = '#e0a030';
      c.lineWidth = Math.max(2, s * 0.05);
      c.beginPath();
      c.moveTo(x - s * 0.05, y + s * 0.35); c.lineTo(x - s * 0.08, y + s * 0.65);
      c.moveTo(x + s * 0.12, y + s * 0.35); c.lineTo(x + s * 0.14, y + s * 0.65);
      c.stroke();
    }
    // 꼬리 깃
    c.fillStyle = kind === 'hen' ? '#7a3a16' : '#e8e2d0';
    c.beginPath();
    c.moveTo(x - s * 0.4, y - s * 0.05);
    c.lineTo(x - s * 0.72, y - s * 0.45);
    c.lineTo(x - s * 0.6, y + s * 0.1);
    c.closePath();
    c.fill();
    // 몸
    c.fillStyle = body;
    c.beginPath();
    c.ellipse(x, y + s * 0.05, s * 0.52, s * 0.36, 0, 0, Math.PI * 2);
    c.fill();
    if (kind === 'young') {
      c.fillStyle = 'rgba(255,217,58,0.7)';
      c.beginPath(); c.arc(x - s * 0.1, y + s * 0.15, s * 0.12, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + s * 0.15, y - s * 0.1, s * 0.09, 0, Math.PI * 2); c.fill();
    }
    // 날개
    c.fillStyle = kind === 'hen' ? '#8f4a1c' : '#e6dfcc';
    c.beginPath();
    c.ellipse(x - s * 0.05, y + s * 0.05, s * 0.28, s * 0.16, -0.2, 0, Math.PI * 2);
    c.fill();
    // 머리 (모이 쪼기)
    c.save();
    c.translate(x + s * 0.38, y - s * 0.2);
    c.rotate(peck);
    c.fillStyle = body;
    c.beginPath();
    c.ellipse(0, -s * 0.05, s * 0.14, s * 0.28, 0.2, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(s * 0.06, -s * 0.28, s * 0.15, 0, Math.PI * 2);
    c.fill();
    // 볏 · 턱볏
    c.fillStyle = '#e8332a';
    var comb = kind === 'young' ? 0.45 : 1;
    for (var i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(s * (-0.02 + i * 0.07), -s * (0.42 + 0.02 * comb), s * 0.05 * comb, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.ellipse(s * 0.17, -s * 0.16, s * 0.035 * (comb + 0.3), s * 0.06 * comb, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f0a020';
    c.beginPath();
    c.moveTo(s * 0.18, -s * 0.31);
    c.lineTo(s * 0.32, -s * 0.26);
    c.lineTo(s * 0.18, -s * 0.21);
    c.closePath();
    c.fill();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(s * 0.1, -s * 0.3, s * 0.03, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function chAdult(c, w, h, u, t) {
    chicken(c, w * 0.45, h * 0.58, u * 0.44, t, 'hen');
    egg(c, w * 0.5 + u * 0.32, h * 0.8, u * 0.06, 0.3);
  }

  /* ---------- 🌱 강낭콩 — g 하나로 자랍니다 ---------- */

  function lerpTable(table, g) {
    var i = Math.max(0, Math.min(table.length - 2, Math.floor(g)));
    var k = Math.max(0, Math.min(1, g - i));
    return table[i] + (table[i + 1] - table[i]) * k;
  }

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  function heartLeaf(c, x, y, s, ang) {
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.fillStyle = '#5fb547';
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(s * 0.5, -s * 0.2, s * 0.9, s * 0.3, s * 1.1, 0);
    c.bezierCurveTo(s * 0.9, -s * 0.3, s * 0.5, s * 0.2, 0, 0);
    c.bezierCurveTo(s * 0.4, -s * 0.45, s * 0.95, -s * 0.35, s * 1.1, 0);
    c.bezierCurveTo(s * 0.95, s * 0.35, s * 0.4, s * 0.45, 0, 0);
    c.fill();
    c.strokeStyle = 'rgba(230,250,210,0.8)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(s * 1.05, 0);
    c.stroke();
    c.restore();
  }

  function beanSeed(c, x, y, s, rot, color) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = color || '#a8323a';
    c.beginPath();
    c.moveTo(-s, 0);
    c.bezierCurveTo(-s, -s * 0.75, s, -s * 0.75, s, 0);
    c.bezierCurveTo(s, s * 0.6, s * 0.2, s * 0.6, 0, s * 0.3);
    c.bezierCurveTo(-s * 0.2, s * 0.6, -s, s * 0.6, -s, 0);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.ellipse(-s * 0.3, -s * 0.2, s * 0.3, s * 0.12, -0.3, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function bean(c, w, h, u, t, g) {
    var ground = h * 0.56;
    var x = w * 0.5;
    var seedY = ground + u * 0.1;
    var sway = Math.sin(t * 1.2) * u * 0.006 * clamp01(g - 2);

    // 뿌리 — 씨에서 아래로. 곁뿌리는 떡잎이 나올 무렵부터
    var rootLen = lerpTable([0, 0.14, 0.22, 0.27, 0.3, 0.32], g) * u;
    if (rootLen > 1) {
      c.strokeStyle = '#f3ead8';
      c.lineWidth = Math.max(2, u * 0.012);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x, seedY);
      c.quadraticCurveTo(x - u * 0.02, seedY + rootLen * 0.5, x + u * 0.01, seedY + rootLen);
      c.stroke();
      var side = clamp01(g - 1.3);
      c.lineWidth = Math.max(1, u * 0.005);
      for (var i = 1; i <= 4; i++) {
        var ry = seedY + rootLen * (0.2 + i * 0.17);
        var rl = u * 0.08 * side * (1 - i * 0.12);
        c.beginPath();
        c.moveTo(x, ry); c.quadraticCurveTo(x - rl * 0.5, ry + rl * 0.2, x - rl, ry + rl * 0.5);
        c.moveTo(x, ry); c.quadraticCurveTo(x + rl * 0.5, ry + rl * 0.2, x + rl, ry + rl * 0.5);
        c.stroke();
      }
    }

    // 줄기 — 떡잎을 끌고 땅 위로
    var stemH = lerpTable([0, 0, 0.16, 0.26, 0.38, 0.42], g) * u;
    var topY = ground - stemH;
    if (g > 1.2) {
      c.strokeStyle = '#6ab04c';
      c.lineWidth = Math.max(2, u * 0.016);
      c.beginPath();
      c.moveTo(x, seedY);
      c.quadraticCurveTo(x + sway, (seedY + topY) / 2, x + sway, topY);
      c.stroke();
    }

    // 씨 / 떡잎 — 씨가 쪼개져 떡잎 두 장이 되고, 본잎이 자라면 쪼그라들어 떨어집니다
    var up = clamp01((g - 1.4) / 0.6);
    var cotY = seedY + (topY - seedY) * up;
    var shrink = 1 - clamp01((g - 3) / 1) * 0.55;
    var gone = clamp01((g - 3.8) / 0.4);
    if (up <= 0) {
      beanSeed(c, x, seedY, u * 0.07 * (1 + clamp01(g) * 0.15), 0.2);
      if (g > 0.6) {
        c.strokeStyle = 'rgba(60,30,20,0.6)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x - u * 0.04, seedY - u * 0.02);
        c.lineTo(x + u * 0.03, seedY + u * 0.01);
        c.stroke();
      }
    } else if (gone < 1) {
      var open = up;
      var col = g > 3.2 ? '#c8c25a' : '#9cc95a';
      c.globalAlpha *= (1 - gone);
      beanSeed(c, x + sway - u * 0.05 * open, cotY, u * 0.06 * shrink, -0.5 * open - 0.2, col);
      beanSeed(c, x + sway + u * 0.05 * open, cotY, u * 0.06 * shrink, 0.5 * open + 0.2 + Math.PI, col);
      c.globalAlpha /= (1 - gone) || 1;
    }

    // 본잎 — 한 쌍, 그다음 위로 더
    var leaf1 = clamp01((g - 2.4) / 0.6);
    if (leaf1 > 0) {
      var ly = topY + u * 0.01;
      heartLeaf(c, x + sway, ly, u * 0.12 * leaf1, -2.5);
      heartLeaf(c, x + sway, ly, u * 0.12 * leaf1, -0.64);
    }
    var leaf2 = clamp01((g - 3.3) / 0.7);
    if (leaf2 > 0) {
      var ly2 = topY + stemH * 0.4;
      heartLeaf(c, x + sway * 0.6, ly2, u * 0.13 * leaf2, -2.9);
      heartLeaf(c, x + sway * 0.6, ly2, u * 0.13 * leaf2, -0.25);
    }

    // 꽃 — 잎겨드랑이에 작은 꽃, 꼬투리가 자라면 시듭니다
    var fl = clamp01((g - 3.5) / 0.5) * (1 - clamp01((g - 4.5) / 0.4));
    var spots = [[-0.07, 0.55], [0.08, 0.35], [-0.05, 0.2]];
    if (fl > 0) {
      spots.forEach(function (p) {
        var fx = x + p[0] * u + sway, fy = topY + stemH * p[1];
        c.fillStyle = 'rgba(245,182,208,' + fl.toFixed(2) + ')';
        c.beginPath(); c.arc(fx, fy, u * 0.025, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,' + fl.toFixed(2) + ')';
        c.beginPath(); c.arc(fx + u * 0.012, fy - u * 0.008, u * 0.014, 0, Math.PI * 2); c.fill();
      });
    }

    // 꼬투리 — 가늘고 긴 초록 꼬투리가 아래로 늘어지고, 안의 콩이 볼록볼록 비칩니다
    var pod = clamp01((g - 4.3) / 0.7);
    if (pod > 0) {
      spots.forEach(function (p) {
        var px = x + p[0] * u + sway, py = topY + stemH * p[1];
        var L = u * 0.17 * pod, Wd = u * 0.028 * (0.5 + pod * 0.5);
        var side = p[0] < 0 ? -1 : 1;
        c.save();
        c.translate(px, py);
        c.rotate(side * 0.18);
        c.fillStyle = '#8fd05a';
        c.strokeStyle = '#5a9a3a';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-Wd * 0.3, 0);
        c.quadraticCurveTo(-Wd * 1.1, L * 0.5, side * Wd * 0.6, L * 1.02);
        c.quadraticCurveTo(Wd * 1.1, L * 0.5, Wd * 0.3, 0);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = 'rgba(200,240,160,0.9)';
        for (var j = 0; j < 4; j++) {
          c.beginPath();
          c.ellipse(side * Wd * 0.1 * j, L * (0.2 + j * 0.2), Wd * 0.55, Wd * 0.75, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      });
    }
  }

  /* ---------- 잠자리 ---------- */

  // 잠자리 — 위에서 본 모습. wing 0 이면 구겨진 작은 날개, 1 이면 활짝
  function dragonfly(c, x, y, s, t, wing, color) {
    c.save();
    c.translate(x, y);
    var buzz = wing >= 1 ? Math.sin(t * 40) * 0.08 : 0;
    var span = s * (0.25 + 0.75 * wing);
    [[-1, -0.12], [1, -0.12], [-1, 0.02], [1, 0.02]].forEach(function (p, i) {
      c.save();
      c.translate(0, s * p[1]);
      c.rotate(p[0] * (i < 2 ? -0.12 : 0.1) + buzz * p[0]);
      c.fillStyle = 'rgba(220,235,255,0.55)';
      c.strokeStyle = 'rgba(120,140,170,0.8)';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(p[0] * span * 0.5, 0, span * 0.5, s * 0.075 * (0.6 + 0.4 * wing), 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    });
    // 꼬리(배)
    c.fillStyle = color;
    c.fillRect(-s * 0.025, s * 0.02, s * 0.05, s * 0.6);
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = 1;
    for (var k = 1; k < 8; k++) {
      c.beginPath();
      c.moveTo(-s * 0.025, s * (0.02 + k * 0.075));
      c.lineTo(s * 0.025, s * (0.02 + k * 0.075));
      c.stroke();
    }
    // 가슴과 머리, 큰 겹눈
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(0, -s * 0.06, s * 0.06, s * 0.1, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#7a3a2a';
    c.beginPath(); c.arc(-s * 0.045, -s * 0.18, s * 0.05, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.045, -s * 0.18, s * 0.05, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function dfEgg(c, w, h, u, t) {
    var water = h * 0.42;
    var x = w * 0.5;
    // 꼬리를 물에 톡톡 — 1.6초마다 내려왔다 올라갑니다
    var dip = Math.max(0, Math.sin(t * 4)) * u * 0.05;
    c.save();
    c.translate(x, water - u * 0.25 + dip);
    c.rotate(0.15);
    c.translate(-x, -(water - u * 0.25 + dip));
    dragonfly(c, x, water - u * 0.25 + dip, u * 0.36, t, 1, '#e0442f');
    c.restore();
    var ph = (t * 4 / (Math.PI * 2)) % 1;
    c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - ph)).toFixed(2) + ')';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x + u * 0.03, water, u * (0.03 + ph * 0.12), u * (0.008 + ph * 0.025), 0, 0, Math.PI * 2);
    c.stroke();
    // 물속으로 가라앉는 작은 알들
    c.fillStyle = '#f3e3a0';
    for (var i = 0; i < 9; i++) {
      var k = ((t * 0.15 + i / 9) % 1);
      c.beginPath();
      c.arc(x + u * 0.03 + Math.sin(i * 3.1) * u * 0.06, water + k * (h - water - u * 0.06), Math.max(1.5, u * 0.008), 0, Math.PI * 2);
      c.fill();
    }
  }

  // 잠자리 애벌레(수채) — 옆에서 본 모습. pads 가 있으면 등에 날개 싹
  function nymph(c, x, y, s, t, pads) {
    c.save();
    c.translate(x, y);
    var step = Math.sin(t * 3) * s * 0.03;
    c.strokeStyle = '#6a5034';
    c.lineWidth = Math.max(1.5, s * 0.025);
    c.lineCap = 'round';
    for (var i = 0; i < 3; i++) {
      var lx = -s * 0.05 + i * s * 0.12;
      c.beginPath();
      c.moveTo(lx, -s * 0.02);
      c.lineTo(lx + s * 0.06 + (i % 2 ? step : -step), s * 0.08);
      c.lineTo(lx + s * 0.1 + (i % 2 ? step : -step), s * 0.1);
      c.stroke();
    }
    // 배 (마디)
    c.fillStyle = '#8a6a44';
    c.beginPath();
    c.ellipse(-s * 0.3, -s * 0.06, s * 0.3, s * 0.08, 0.05, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(60,40,20,0.4)';
    c.lineWidth = 1;
    for (var k = 1; k < 6; k++) {
      c.beginPath();
      c.moveTo(-s * 0.05 - k * s * 0.09, -s * 0.13);
      c.lineTo(-s * 0.05 - k * s * 0.09, s * 0.01);
      c.stroke();
    }
    // 가슴·머리
    c.fillStyle = '#7a5a38';
    c.beginPath();
    c.ellipse(s * 0.08, -s * 0.07, s * 0.12, s * 0.08, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(s * 0.24, -s * 0.07, s * 0.07, s * 0.07, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3a2a1a';
    c.beginPath();
    c.arc(s * 0.27, -s * 0.1, s * 0.035, 0, Math.PI * 2);
    c.fill();
    if (pads) {
      c.fillStyle = '#5e4a30';
      c.beginPath();
      c.ellipse(-s * 0.06, -s * 0.15, s * 0.14, s * 0.035, 0.1, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  function dfEmerge(c, w, h, u, t, age) {
    var water = h * 0.42;
    var sx = w * 0.5;
    c.strokeStyle = '#6aa84f';
    c.lineWidth = u * 0.03;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx, h);
    c.lineTo(sx + u * 0.02, h * 0.05);
    c.stroke();
    // 줄기에 매달린 빈 허물 (세로로)
    c.save();
    c.translate(sx + u * 0.04, water - u * 0.12);
    c.rotate(-Math.PI / 2);
    c.globalAlpha *= 0.85;
    nymph(c, 0, 0, u * 0.34, 0, 1);
    c.restore();
    // 막 나온 잠자리 — 날개가 4초에 걸쳐 펴집니다
    var wing = Math.min(1, ((age === undefined ? 9 : age) - 0.5) / 4);
    wing = Math.max(0.05, wing);
    c.save();
    c.translate(sx + u * 0.12, water - u * 0.3);
    c.rotate(0.25);
    dragonfly(c, 0, 0, u * 0.36, 0, wing * 0.999, '#b8d48a');
    c.restore();
  }

  /* ---------- 작은 그림 (카드·단추) ---------- */

  function thumb(scene, stage, px) {
    var cv = document.createElement('canvas');
    var r = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(px * r);
    cv.height = Math.round(px * r);
    var c = cv.getContext('2d');
    c.setTransform(r, 0, 0, r, 0, 0);
    c.save();
    c.beginPath();
    c.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
    c.clip();
    try {
      drawScene(c, px, px, scene, 1.3);
      drawArt(c, px, px, stage.art, 1.3, stage.g || 0, 9);
    } catch (e) { /* 그림 하나가 탈 나도 카드는 남깁니다 */ }
    c.restore();
    return cv;
  }

  /* ---------- 👀 지켜보기 ---------- */

  function startGrow() {
    state.cycle = findCycle(state.kind);
    state.step = 0;
    el.story.hidden = false;
    el.steps.hidden = false;
    el.cards.hidden = true;
    el.stage.classList.remove('small');
    buildSteps();
    updateScore();
    fit();
    showStep(0);
  }

  function buildSteps() {
    el.steps.innerHTML = '';
    state.cycle.steps.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'step-chip';
      b.innerHTML = '<span class="sc-art">' + (i + 1) + '</span><span class="sc-name">' + s.name + '</span>';
      b.addEventListener('click', function () { showStep(i); });
      el.steps.appendChild(b);
    });
  }

  function showStep(i) {
    state.step = i;
    var cy = state.cycle;
    var s = cy.steps[i];
    var lastStep = (i === cy.steps.length - 1);

    showArt(cy.scene, s);

    Array.prototype.forEach.call(el.steps.children, function (c, k) {
      c.classList.toggle('on', k === i);
      c.classList.toggle('done', k < i);
    });

    el.storyTitle.textContent = s.title;
    el.storyText.textContent = s.text;
    el.nextBtn.textContent = lastStep ? '끝 🎉' : '다음 ▶';
    el.bar.style.width = Math.round(((i + 1) / cy.steps.length) * 100) + '%';
    setLabel((cy.icon ? cy.icon + ' ' : '') + cy.name + ' · ' + s.name + ' (' + (i + 1) + '/' + cy.steps.length + ')');

    state.prompt = s.title + '. ' + s.text;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);

    // 다 읽으면 저절로 다음 — 목소리가 없는 기기에서도 글자 수만큼은 머뭅니다 (별의 일생과 같은 규칙)
    var startedAt = Date.now();
    var dwell = 2500 + state.prompt.length * 40;
    speak(state.prompt, function () {
      if (state.act !== 'grow' || state.step !== i || !state.playing) return;
      var wait = Math.max(1400, dwell - (Date.now() - startedAt));
      setTimeout(function () {
        if (state.step !== i || !state.playing) return;
        if (lastStep) finishGrow(); else showStep(i + 1);
      }, wait);
    });
  }

  el.nextBtn.addEventListener('click', function () {
    if (state.act !== 'grow' || !state.playing) return;
    if (window.SFX) SFX.tap();
    if (state.step >= state.cycle.steps.length - 1) return finishGrow();
    showStep(state.step + 1);
  });

  function finishGrow() {
    state.playing = false;
    markSeen(state.cycle.id);
    updateScore();
    if (window.SFX) SFX.finish();
    if (window.TTS) TTS.cancel();
    el.endTitle.textContent = state.cycle.name + '의 한살이를 다 봤어요!';
    el.endStars.textContent = '';
    el.endText.textContent = state.cycle.end + ' (👀 ' + state.seen.length + '/' + CYCLES.length + ')';
    el.endOverlay.hidden = false;
    speak(state.cycle.end);
  }

  /* ---------- 🔢 순서 맞추기 ---------- */

  function askOrder(cy) {
    state.cycle = cy;
    state.need = 0;
    el.story.hidden = true;
    el.steps.hidden = true;
    el.cards.hidden = false;
    el.stage.classList.remove('small');
    el.cards.className = 'cards sci-cards';
    el.cards.innerHTML = '';

    var seq = cy.steps;
    var mixed = UI.shuffle(seq.map(function (s, i) { return { s: s, i: i }; }));
    var px = (window.innerWidth < 600) ? 56 : 76;

    mixed.forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.appendChild(thumb(cy.scene, m.s, px));
      var l = document.createElement('div');
      l.className = 'lbl';
      l.textContent = m.s.name;
      b.appendChild(l);
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('done')) return;
        if (m.i !== state.need) return orderMissed(b, seq[state.need]);
        orderHit(b, m.s);
      });
      el.cards.appendChild(b);
    });

    showArt(cy.scene, seq[0]);
    view.art = '';           // 처음에는 빈 무대 — 맞힐 때마다 그 그림이 나옵니다
    setLabel((cy.icon ? cy.icon + ' ' : '') + cy.name + '의 한살이를 차례대로 눌러요 (' + (state.round + 1) + '/' + state.deck.length + ')');
    setTimeout(fit, 0);
    beginQuestion(josa(cy.name, '이', '가') + ' 자라는 차례대로 눌러 보세요.');
  }

  function orderHit(card, s) {
    if (window.SFX) SFX.correct();
    card.classList.add('done');
    UI.addMark(card, String(state.need + 1));
    showArt(state.cycle.scene, s);
    state.need += 1;
    var n = state.cycle.steps.length;

    if (state.need < n) {
      el.bar.style.width = Math.round(((state.round + state.need / n) / state.deck.length) * 100) + '%';
      return;
    }

    state.locked = true;
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    var why = state.cycle.end;
    setLabel('⭕ ' + state.cycle.name);
    state.prompt = why;
    el.speakBtn.hidden = true;
    speak(why, function () { setTimeout(nextRound, 400); });
  }

  function orderMissed(card, want) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    setTimeout(function () { card.classList.remove('wrong'); }, 450);
    var why = '아직이에요. 다음은 ' + josa(want.name, '이', '가') + ' 올 차례예요.';
    speak(why, function () { setTimeout(function () { speak(state.prompt); }, 150); });
  }

  /* ---------- ❓ 퀴즈 ---------- */

  function askQuiz(q) {
    el.story.hidden = true;
    el.steps.hidden = true;
    el.cards.hidden = false;
    el.stage.classList.add('small');
    el.cards.className = 'cards sci-cards ans-cards';
    el.cards.innerHTML = '';

    var cy = findCycle(q.c);
    if (cy && cy.steps[q.s]) showArt(cy.scene, cy.steps[q.s]);

    var options = q.choices.map(function (c, i) { return { text: c, right: (i === 0) }; });
    UI.shuffle(options);

    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = '<div class="text">' + o.text + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return quizMissed(b);
        quizCorrect(b, q);
      });
      el.cards.appendChild(b);
    });

    setLabel(q.q + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
    setTimeout(fit, 0);
    beginQuestion(q.q);
  }

  function quizCorrect(card, q) {
    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    setLabel(q.why);
    state.prompt = q.why;
    el.speakBtn.hidden = true;
    speak(q.why, function () { setTimeout(nextRound, 400); });
  }

  function quizMissed(card) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
    speak('아니에요. 다시 골라 봐요.', function () {
      setTimeout(function () { speak(state.prompt); }, 150);
    });
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    state.round = 0;
    state.stars = 0;
    state.locked = false;
    state.prompt = '';
    el.bar.style.width = '0%';
    el.speakBtn.hidden = true;
    el.cards.innerHTML = '';

    if (state.act === 'grow') return startGrow();

    state.deck = (state.act === 'order')
      ? UI.shuffle(CYCLES.slice())
      : UI.shuffle((window.LIFE_QUIZ || []).slice()).slice(0, QUIZ_ROUNDS);
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= state.deck.length) return finish();
    state.firstTry = true;
    state.locked = false;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    if (state.act === 'order') askOrder(state.deck[state.round]);
    else askQuiz(state.deck[state.round]);
  }

  function finish() {
    state.locked = true;
    state.playing = false;
    el.bar.style.width = '100%';
    var total = state.deck.length;
    UI.saveBest(BEST_KEY + '.' + state.act, state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);
    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  function beginQuestion(spoken) {
    state.prompt = spoken;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function setLabel(text) { el.label.textContent = text; }

  function updateScore() {
    if (state.act === 'grow') el.score.textContent = '👀 ' + state.seen.length + '/' + CYCLES.length;
    else el.score.textContent = '⭐ ' + state.stars;
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + ((a.id === state.act) ? ' on' : '');
      b.innerHTML = '<span class="mi">' + a.icon + '</span>' +
                    '<span class="mn">' + a.name + '</span>' +
                    '<span class="mb">' + bestText(a.id) + '</span>';
      b.addEventListener('click', function () {
        state.act = a.id;
        UI.saveValue(ACT_KEY, a.id);
        Array.prototype.forEach.call(el.modeRow.children, function (x) { x.classList.toggle('on', x === b); });
        showAct();
      });
      el.modeRow.appendChild(b);
    });
    showAct();
  }

  // 생물 단추 — 이모지 대신 그 생물의 다 자란 모습을 작게 그립니다 (잠자리 이모지가 없어서요)
  function buildKindRow() {
    el.kindRow.innerHTML = '';
    CYCLES.forEach(function (cy) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + ((cy.id === state.kind) ? ' on' : '');
      var art = thumb(cy.scene, cy.steps[cy.steps.length - 1], 48);
      art.className = 'mi-art';
      b.appendChild(art);
      var n = document.createElement('span');
      n.className = 'mn';
      n.textContent = cy.name;
      b.appendChild(n);
      var m = document.createElement('span');
      m.className = 'mb';
      m.textContent = cy.sub + (isSeen(cy.id) ? ' ✓' : '');
      b.appendChild(m);
      b.addEventListener('click', function () {
        state.kind = cy.id;
        UI.saveValue(KIND_KEY, cy.id);
        Array.prototype.forEach.call(el.kindRow.children, function (x) { x.classList.toggle('on', x === b); });
      });
      el.kindRow.appendChild(b);
    });
  }

  function bestText(act) {
    if (act === 'grow') return state.seen.length ? ('👀 ' + state.seen.length + '/' + CYCLES.length) : '';
    var best = UI.readBest(BEST_KEY + '.' + act);
    return best ? ('⭐ ' + best.stars + '/' + best.total) : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
    var grow = (state.act === 'grow');
    el.kindHint.hidden = !grow;
    el.kindRow.hidden = !grow;
  }

  buildModeRow();
  buildKindRow();

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

  // 다 보고 나면 '다른 놀이 고르기' 는 시작 화면으로 — 다른 생물을 바로 고를 수 있게
  el.endModes.addEventListener('click', function () {
    if (window.TTS) TTS.cancel();
    el.endOverlay.hidden = true;
    buildModeRow();
    buildKindRow();
    el.startOverlay.hidden = false;
  });

  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '한살이를 알아봐요.'; } });
  });

  var back = Catalog.backHref('life.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
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
      setTimeout(once, Math.min(16000, 900 + (text || '').length * 110));
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
  var first = findCycle(state.kind) || CYCLES[0];
  showArt(first.scene, first.steps[first.steps.length - 1]);
  el.story.hidden = true;
  el.steps.hidden = true;
  updateScore();
  setLabel('🐛 알에서 어른까지');
  requestAnimationFrame(frame);
})();
