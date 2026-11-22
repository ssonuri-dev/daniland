/* =========================================================================
 * 다니랜드 - 우주정거장의 하루 (iss.html)
 *
 * 우주정거장 안에서 먹고·자고·씻고·운동하는 모습과 '둥둥 뜨는' 까닭을 그림으로 보여 주는 화면입니다 (2026-11-22).
 * 사진 없이 캔버스(라이브러리 없음)에 정거장 안을 그리고 이모지 소품을 띄웁니다. 글은 이름표·한두 문장.
 *
 * 놀이 3가지
 *   day   : 하루 구경   - 먹기·자기·씻기·화장실·운동·창밖 보기 단추를 누르면 그 장면이 나와요
 *   float : 둥둥 놀이   - 사과·공·물방울 등을 끌어 던져요. '🌍 지구라면' 을 켜면 툭 떨어집니다 (견줘 보기)
 *   quiz  : 퀴즈        - 열 문제 (보기 넉 장, 첫 보기가 정답)
 *
 * 진짜인 것
 *   - **둥둥 뜨는 까닭은 '중력이 없어서' 가 아닙니다.** 400km 높이에도 지구가 끄는 힘은 땅의 90% 쯤 그대로이고, 정거장과
 *     사람이 다 같이 지구 둘레로 계속 떨어지고 있어서(자유 낙하) 뜹니다 — 로켓 쏘기(orbit.html)에서 본 그대로. 흔한 말이라고
 *     '무중력이라서' 로 바꾸지 마세요.
 *   - 90분에 한 바퀴라 하루 해돋이가 16번쯤 · 1초에 7.7km · 물·땀·오줌을 걸러 다시 씀 · 침낭은 벽에 묶음 ·
 *     부스러기 때문에 빵 대신 토르티야 · 근육·뼈가 약해지지 않게 하루 2시간쯤 운동 · 화장실은 바람으로 빨아들임.
 * 진짜가 아닌 것
 *   - 정거장 안 그림·크기, 창밖 해돋이의 빠르기(진짜 90분을 몇 초로).
 *
 * 기록 키는 daniland.best.iss(카드의 ⭐)·daniland.best.iss.quiz, 마지막에 고른 놀이는 daniland.issAct.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.iss';
  var ACT_KEY = 'daniland.issAct';
  var TWO_PI = Math.PI * 2;
  var QUIZ_ROUNDS = 10;

  var ACTS = [
    { id: 'day',   name: '하루 구경', icon: '🏠', desc: '먹고, 자고, 씻고 — 우주에서는 어떻게 할까?' },
    { id: 'float', name: '둥둥 놀이', icon: '🎈', desc: '물건을 끌어 던져 봐요. 지구라면?' },
    { id: 'quiz',  name: '퀴즈',      icon: '❓', desc: '우주정거장 열 문제' }
  ];

  var SCENES = [
    { id: 'eat',    name: '먹기',     icon: '🍽️',
      say: '음식이 둥둥 떠요. 빵가루가 떠다니면 위험해서 빵 대신 얇은 토르티야를 먹어요. 주스는 동그란 방울이 돼요.' },
    { id: 'sleep',  name: '자기',     icon: '😴',
      say: '벽에 묶은 침낭 속에서 자요. 떠 있으니까 서서 자도, 누워 자도 똑같아요.' },
    { id: 'wash',   name: '씻기',     icon: '🧼',
      say: '샤워기가 없어요. 물이 방울로 떠다녀서, 젖은 수건으로 닦고 헹구지 않는 샴푸를 써요.' },
    { id: 'toilet', name: '화장실',   icon: '🚽',
      say: '화장실은 진공청소기처럼 바람으로 빨아들여요. 오줌은 깨끗하게 걸러서 다시 마시는 물이 돼요.' },
    { id: 'gym',    name: '운동',     icon: '🏃',
      say: '떠 있으면 다리를 안 써서 근육과 뼈가 약해져요. 그래서 끈으로 몸을 묶고 하루에 2시간쯤 달려요.' },
    { id: 'window', name: '창밖 보기', icon: '🌍',
      say: '창밖에 지구가 보여요. 90분마다 한 바퀴 돌아서, 하루에 해돋이를 16번쯤 봐요.' }
  ];

  var QUIZ = [
    { q: '우주정거장 안에서는 왜 둥둥 뜰까요?',
      choices: ['🔄 정거장이랑 다 같이 계속 떨어지고 있어서', '🚫 중력이 하나도 없어서', '🎈 몸이 풍선처럼 가벼워져서', '🧲 자석이 끌어 올려서'],
      why: '정거장 높이에도 지구가 끌어당기는 힘이 거의 그대로 있어요. 정거장과 사람이 다 같이 계속 떨어지면서 지구 둘레를 돌아서 둥둥 떠요.' },
    { q: '우주에서는 빵 대신 무엇을 많이 먹을까요?',
      choices: ['🌮 얇은 토르티야', '🥖 바게트', '🥐 크루아상', '🍞 식빵'],
      why: '빵가루가 둥둥 떠다니면 기계나 눈에 들어갈 수 있어서, 부스러기가 적은 토르티야를 먹어요.' },
    { q: '우주정거장에서 물을 쏟으면 어떻게 될까요?',
      choices: ['💧 동그란 물방울이 되어 떠다녀요', '🌊 바닥에 쏟아져요', '❄️ 바로 얼어요', '💨 바로 사라져요'],
      why: '물이 떨어지지 않고 동그랗게 뭉쳐서 둥둥 떠다녀요.' },
    { q: '우주정거장에서는 잠을 어떻게 잘까요?',
      choices: ['🛌 벽에 묶은 침낭 속에서', '🛏️ 푹신한 침대에 누워서', '🪑 의자에 앉아서', '🚫 잠을 안 자요'],
      why: '둥둥 떠다니지 않게 벽에 묶은 침낭 속에서 자요.' },
    { q: '우주비행사는 왜 매일 운동을 할까요?',
      choices: ['💪 근육과 뼈가 약해지지 않게', '🍔 배가 고프려고', '🏆 시합에 나가려고', '😴 졸려서'],
      why: '떠 있으면 다리를 거의 안 써서 근육과 뼈가 약해져요. 그래서 하루에 2시간쯤 운동해요.' },
    { q: '우주정거장에서는 하루에 해돋이를 몇 번쯤 볼까요?',
      choices: ['🌅 16번쯤', '☀️ 1번', '🌗 2번', '🚫 한 번도 못 봐요'],
      why: '90분마다 지구를 한 바퀴 돌아서, 하루에 해가 16번쯤 떠요.' },
    { q: '우주정거장은 얼마나 높이 있을까요?',
      choices: ['🚀 400km쯤', '✈️ 10km쯤', '🏔️ 1km쯤', '🌙 달만큼'],
      why: '땅에서 400킬로미터쯤 위, 공기가 거의 없는 곳이에요. 비행기보다 40배쯤 높아요.' },
    { q: '우주정거장의 화장실은 어떻게 쓸까요?',
      choices: ['🌀 바람으로 빨아들여요', '🚽 집이랑 똑같이 물을 내려요', '🌍 지구에 와서 가요', '🚫 화장실이 없어요'],
      why: '물이 둥둥 뜨니까, 진공청소기처럼 바람으로 빨아들여요.' },
    { q: '우주정거장에서 마시는 물은 어디서 날까요?',
      choices: ['♻️ 땀과 오줌까지 깨끗하게 걸러 다시 써요', '🌧️ 비를 받아요', '🏞️ 우주 강에서 떠요', '🧊 별에서 얼음을 캐요'],
      why: '물이 아주 귀해서, 땀과 오줌도 기계로 깨끗하게 걸러 다시 마셔요.' },
    { q: '우주정거장은 얼마나 빨리 돌까요?',
      choices: ['⚡ 1초에 8km쯤', '🚗 자동차만큼', '✈️ 비행기만큼', '🐢 거북이만큼'],
      why: '1초에 8킬로미터쯤, 총알보다 열 배쯤 빨라요. 그래서 안 떨어지고 지구 둘레를 돌아요.' },
    { q: '우주에서 샤워는 어떻게 할까요?',
      choices: ['🧽 젖은 수건으로 닦아요', '🚿 집처럼 샤워기로 해요', '🏊 수영장에 들어가요', '🚫 한 번도 안 씻어요'],
      why: '물이 방울로 떠다녀서 샤워기를 못 써요. 젖은 수건으로 닦고, 헹구지 않는 샴푸를 써요.' }
  ];

  // 둥둥 놀이의 물건 — r 은 크기(그림 반지름 px 기준값)
  var THINGS = [
    { icon: '🍎', r: 22 }, { icon: '⚽', r: 24 }, { icon: 'drop', r: 20 }, { icon: '✏️', r: 20 },
    { icon: '🧸', r: 26 }, { icon: '🌮', r: 22 }, { icon: '🎧', r: 20 }
  ];

  var el = {
    page: document.querySelector('.earth-page'),
    sky: document.getElementById('sky'),
    canvas: document.getElementById('canvas'),
    hint: document.getElementById('skyHint'),
    ctrl: document.getElementById('ctrl'),
    cards: document.getElementById('cards'),
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

  var state = {
    act: UI.loadValue(ACT_KEY) || 'day',
    playing: false,
    scene: 'eat',
    sceneT: 0,
    seen: {},
    objs: [],          // 둥둥 놀이 { x, y, vx, vy, r, icon, rot, vr }
    gravity: false,
    grab: null,        // { o, dx, dy, hist: [[x, y, t]] }
    sunrises: 0,
    deck: [],
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    prompt: ''
  };
  if (!findAct(state.act)) state.act = 'day';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }
  function findScene(id) {
    for (var i = 0; i < SCENES.length; i++) if (SCENES[i].id === id) return SCENES[i];
    return null;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---------- 캔버스 ---------- */

  var W = 0, H = 0, dpr = 1;

  function fit() {
    if (el.page) el.page.style.height = (document.documentElement.clientHeight || window.innerHeight) + 'px';
    var w = el.sky.clientWidth, h = el.sky.clientHeight;
    if (!w || !h) return;
    var oldW = W, oldH = H;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h;
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.width = w + 'px';
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (oldW && oldH) state.objs.forEach(function (o) { o.x *= W / oldW; o.y *= H / oldH; });
  }

  function unit() { return clamp(Math.min(W, H) / 380, 0.7, 1.6); }

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    state.sceneT += dt;
    if (state.act === 'float') advanceFloat(dt);
    if (W) draw();
  }

  /* ---------- 둥둥 놀이 ---------- */

  function makeObjs() {
    var u = unit();
    state.objs = THINGS.map(function (t, i) {
      var a = i / THINGS.length * TWO_PI;
      return { icon: t.icon, r: t.r * u, x: W * (0.2 + 0.6 * Math.random()), y: H * (0.25 + 0.5 * Math.random()),
               vx: Math.cos(a) * 25, vy: Math.sin(a) * 25, rot: Math.random() * TWO_PI, vr: (Math.random() - 0.5) * 1.2, wob: Math.random() * 6 };
    });
    state.objs.push({ icon: '👩‍🚀', r: 46 * u, x: W * 0.5, y: H * 0.5, vx: 12, vy: -8, rot: 0, vr: 0.25, wob: 0, big: true });
  }

  function advanceFloat(dt) {
    var g = state.gravity ? 1500 * unit() : 0;
    var floor = H - 14;
    state.objs.forEach(function (o) {
      if (state.grab && state.grab.o === o) return;
      o.vy += g * dt;
      o.x += o.vx * dt; o.y += o.vy * dt;
      o.rot += o.vr * dt;
      o.wob += dt;
      var e = state.gravity ? 0.45 : 0.85;
      if (o.x < o.r + 10) { o.x = o.r + 10; o.vx = Math.abs(o.vx) * e; }
      if (o.x > W - o.r - 10) { o.x = W - o.r - 10; o.vx = -Math.abs(o.vx) * e; }
      if (o.y < o.r + 10) { o.y = o.r + 10; o.vy = Math.abs(o.vy) * e; }
      if (o.y > floor - o.r) {
        o.y = floor - o.r;
        o.vy = -Math.abs(o.vy) * e;
        if (state.gravity) {
          o.vx *= Math.pow(0.05, dt);       // 바닥에서 미끄러지다 멈춤
          o.vr *= Math.pow(0.05, dt);
          if (Math.abs(o.vy) < 40) o.vy = 0;
        }
      }
    });
  }

  function grabAt(x, y) {
    var best = null, bd = Infinity;
    state.objs.forEach(function (o) {
      var d = Math.hypot(o.x - x, o.y - y);
      if (d < o.r + 22 && d < bd) { bd = d; best = o; }
    });
    return best;
  }

  /* ---------- 그리기 ---------- */

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (state.act === 'day' && state.scene === 'window') return drawWindow();
    drawModule();
    if (state.act === 'day') drawScene();
    else if (state.act === 'float') drawFloat();
    else drawQuizArt();
  }

  // 정거장 안 — 하얀 벽판·손잡이·짐 가방·화면
  function drawModule() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#c9cfd8');
    g.addColorStop(0.5, '#e7ebf1');
    g.addColorStop(1, '#b8bfca');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // 둥근 통 안쪽 느낌 — 위아래 어둡게
    ctx.fillStyle = 'rgba(60,70,90,0.18)';
    ctx.fillRect(0, 0, W, H * 0.08);
    ctx.fillRect(0, H * 0.92, W, H * 0.08);
    // 벽판
    ctx.strokeStyle = 'rgba(90,100,120,0.25)';
    ctx.lineWidth = 1;
    var pw = Math.max(70, W / 7);
    for (var x = 0; x < W + pw; x += pw) {
      ctx.strokeRect(x + 4, H * 0.1, pw - 8, H * 0.35);
      ctx.strokeRect(x + 4, H * 0.5, pw - 8, H * 0.38);
    }
    // 노란 손잡이
    ctx.strokeStyle = '#e0b43a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (var i = 0; i < W / pw; i++) {
      var hx = i * pw + pw * 0.3;
      ctx.beginPath(); ctx.moveTo(hx, H * 0.47); ctx.lineTo(hx + pw * 0.4, H * 0.47); ctx.stroke();
    }
    // 짐 가방·화면 몇 개
    var bags = [[0.06, 0.13, '#f2f2f2'], [0.78, 0.55, '#dfe8f5'], [0.88, 0.14, '#f5efe0']];
    bags.forEach(function (b) {
      ctx.fillStyle = b[2];
      ctx.strokeStyle = 'rgba(90,100,120,0.4)';
      ctx.lineWidth = 1.5;
      roundRect(W * b[0], H * b[1], pw * 0.7, H * 0.18, 6); ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = '#1c2840';
    roundRect(W * 0.62, H * 0.16, pw * 0.75, H * 0.14, 4); ctx.fill();
    ctx.fillStyle = '#4fc3f7';
    ctx.fillRect(W * 0.62 + 6, H * 0.16 + 6, pw * 0.75 - 12, 4);
    ctx.fillRect(W * 0.62 + 6, H * 0.16 + 14, pw * 0.4, 4);
  }

  function emoji(ch, x, y, size, rot) {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.font = Math.round(size) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  function drop(x, y, r, t) {
    var k = 1 + 0.12 * Math.sin(t * 6);
    ctx.save();
    ctx.translate(x, y);
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(230,248,255,0.95)');
    g.addColorStop(1, 'rgba(70,160,230,0.75)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r * k, r / k, 0, 0, TWO_PI); ctx.fill();
    ctx.restore();
  }

  function bob(seed, amp) { return Math.sin(clock * 0.9 + seed) * amp; }

  function drawScene() {
    var u = unit(), cx = W / 2, cy = H / 2, s = state.scene, t = state.sceneT;
    if (s === 'eat') {
      emoji('👩‍🚀', cx - 40 * u, cy + bob(0, 8), 96 * u, Math.sin(clock * 0.4) * 0.15);
      emoji('🌮', cx + 70 * u + bob(1, 10), cy - 50 * u + bob(2, 8), 40 * u, clock * 0.5);
      emoji('🍎', cx + 120 * u + bob(3, 12), cy + 30 * u, 36 * u, -clock * 0.3);
      drop(cx + 40 * u + bob(4, 14), cy + 70 * u + bob(5, 6), 16 * u, t);
      ctx.fillStyle = '#ffa53a';
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(cx + 130 * u + bob(6, 10), cy - 70 * u + bob(7, 8), 12 * u * (1 + 0.1 * Math.sin(t * 7)), 0, TWO_PI); ctx.fill();
      ctx.globalAlpha = 1;
      tag('주스 방울', cx + 130 * u + bob(6, 10), cy - 92 * u + bob(7, 8));
    } else if (s === 'sleep') {
      // 벽에 묶은 침낭 — 서 있는 모양
      var bw = 90 * u, bh = 200 * u, bx = cx - bw / 2, by = cy - bh / 2;
      ctx.fillStyle = '#5c7cfa';
      roundRect(bx, by, bw, bh, 30 * u); ctx.fill();
      ctx.strokeStyle = '#3b5bdb';
      ctx.lineWidth = 3;
      roundRect(bx, by, bw, bh, 30 * u); ctx.stroke();
      ctx.strokeStyle = '#e0b43a';
      ctx.lineWidth = 4;
      [0.3, 0.7].forEach(function (k) {
        ctx.beginPath(); ctx.moveTo(bx - 14 * u, by + bh * k); ctx.lineTo(bx + bw + 14 * u, by + bh * k); ctx.stroke();
      });
      emoji('😴', cx, by + 34 * u, 50 * u);
      var zt = (t % 2) / 2;
      ctx.globalAlpha = 1 - zt;
      emoji('💤', cx + 50 * u + zt * 30 * u, by + 10 * u - zt * 40 * u, 28 * u);
      ctx.globalAlpha = 1;
      tag('벽에 묶은 침낭', cx, by + bh + 16 * u);
    } else if (s === 'wash') {
      emoji('👩‍🚀', cx - 30 * u, cy + bob(0, 6), 96 * u);
      emoji('🧽', cx + 50 * u, cy - 20 * u + bob(1, 6), 40 * u, Math.sin(t * 4) * 0.3);
      emoji('🧴', cx + 110 * u + bob(2, 8), cy + 50 * u, 36 * u, clock * 0.2);
      for (var i = 0; i < 5; i++) drop(cx - 110 * u + i * 40 * u + bob(i, 10), cy - 90 * u + bob(i + 3, 12), (6 + i % 3 * 3) * u, t + i);
      tag('젖은 수건으로 닦아요', cx, cy + 90 * u);
    } else if (s === 'toilet') {
      // 빨아들이는 관과 바람
      ctx.fillStyle = '#8d99ae';
      roundRect(cx - 30 * u, cy - 10 * u, 60 * u, 110 * u, 10 * u); ctx.fill();
      ctx.fillStyle = '#edf2f4';
      ctx.beginPath(); ctx.ellipse(cx, cy - 10 * u, 46 * u, 16 * u, 0, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = '#2b2d42';
      ctx.beginPath(); ctx.ellipse(cx, cy - 10 * u, 26 * u, 8 * u, 0, 0, TWO_PI); ctx.fill();
      ctx.strokeStyle = 'rgba(80,140,220,0.7)';
      ctx.lineWidth = 3;
      for (var k = 0; k < 4; k++) {
        var p = ((t * 0.9 + k / 4) % 1);
        var ry = cy - 120 * u + p * 100 * u;
        ctx.globalAlpha = p;
        ctx.beginPath(); ctx.arc(cx, ry, (40 - p * 26) * u, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      emoji('♻️', cx + 100 * u, cy + 40 * u, 40 * u);
      emoji('💧', cx + 150 * u, cy + 40 * u, 32 * u);
      tag('슝 — 바람으로 빨아들여요', cx, cy + 120 * u);
    } else if (s === 'gym') {
      // 달리기 판과 끈
      var tw = 200 * u, ty = cy + 80 * u;
      ctx.fillStyle = '#495057';
      roundRect(cx - tw / 2, ty, tw, 18 * u, 8 * u); ctx.fill();
      ctx.strokeStyle = '#adb5bd';
      ctx.lineWidth = 2;
      for (var m = 0; m < 8; m++) {
        var mx = cx - tw / 2 + ((m * 25 * u - t * 120 * u) % tw + tw) % tw;
        ctx.beginPath(); ctx.moveTo(mx, ty + 3); ctx.lineTo(mx, ty + 15 * u); ctx.stroke();
      }
      var py = cy + Math.abs(Math.sin(t * 8)) * -8 * u;
      emoji('🏃', cx, py, 100 * u);
      ctx.strokeStyle = '#e8590c';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 20 * u, py - 10 * u); ctx.lineTo(cx - 80 * u, ty + 9 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 20 * u, py - 10 * u); ctx.lineTo(cx + 80 * u, ty + 9 * u); ctx.stroke();
      tag('끈으로 몸을 당겨 붙여요', cx, ty + 40 * u);
    }
  }

  // 창밖 — 둥근 창 아래로 지구, 낮과 밤이 빠르게 바뀝니다 (90분을 9초로)
  function drawWindow() {
    ctx.fillStyle = '#8a929e';
    ctx.fillRect(0, 0, W, H);
    var u = unit(), cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
    var period = 9, ph = (state.sceneT % period) / period;       // 0 해돋이
    var count = Math.floor(state.sceneT / period) + 1;
    var day = Math.sin(ph * TWO_PI) > -0.15;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TWO_PI); ctx.clip();
    ctx.fillStyle = '#02030a';
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    // 지구 — 창 아래쪽 큰 둥근 땅
    var er = R * 2.2, ex = cx, ey = cy + er + R * 0.05;
    var light = clamp(Math.sin(ph * TWO_PI) * 1.4 + 0.3, 0, 1);
    var eg = ctx.createRadialGradient(ex, ey - er, er * 0.2, ex, ey, er);
    eg.addColorStop(0, 'rgb(' + Math.round(40 + 60 * light) + ',' + Math.round(70 + 110 * light) + ',' + Math.round(120 + 120 * light) + ')');
    eg.addColorStop(1, '#061027');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, TWO_PI); ctx.fill();
    // 구름 — 흘러감
    ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.55 * light) + ')';
    for (var i = 0; i < 9; i++) {
      var x = cx - R + ((i * 97 + state.sceneT * 40) % (R * 2.4)) - R * 0.2;
      var y = cy + R * 0.25 + (i % 3) * R * 0.18;
      ctx.beginPath(); ctx.ellipse(x, y, R * 0.16, R * 0.05, 0, 0, TWO_PI); ctx.fill();
    }
    // 밤에는 도시 불빛
    if (light < 0.4) {
      ctx.fillStyle = 'rgba(255,210,120,' + (0.8 * (0.4 - light) / 0.4) + ')';
      for (var j = 0; j < 30; j++) {
        var lx = cx - R + ((j * 53 + state.sceneT * 40) % (R * 2)), ly = cy + R * 0.2 + (j * 37 % 60) / 60 * R * 0.6;
        ctx.fillRect(lx, ly, 2, 2);
      }
    }
    // 공기 띠와 해
    ctx.strokeStyle = 'rgba(110,180,255,' + (0.3 + 0.5 * light) + ')';
    ctx.lineWidth = 6 * u;
    ctx.beginPath(); ctx.arc(ex, ey, er + 3 * u, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    var sunA = ph * TWO_PI;
    var sx = cx + Math.cos(Math.PI - sunA) * R * 0.85, sy = cy - R * 0.02 - Math.sin(sunA) * R * 0.6;
    if (Math.sin(sunA) > -0.15) {
      var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.25);
      sg.addColorStop(0, 'rgba(255,255,240,1)');
      sg.addColorStop(0.2, 'rgba(255,230,150,0.9)');
      sg.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(sx, sy, R * 0.25, 0, TWO_PI); ctx.fill();
    }
    ctx.restore();
    // 창틀
    ctx.strokeStyle = '#5c6470';
    ctx.lineWidth = 14 * u;
    ctx.beginPath(); ctx.arc(cx, cy, R + 7 * u, 0, TWO_PI); ctx.stroke();
    ctx.strokeStyle = '#c3c9d2';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R + 15 * u, 0, TWO_PI); ctx.stroke();
    tag('🌅 해돋이 ' + count + '번째', cx, cy + R + 24 * u);
    if (count > state.sunrises) state.sunrises = count;
    if (!day) tag('🌃 밤', cx, cy - R - 20 * u);
  }

  function drawFloat() {
    state.objs.forEach(function (o) {
      if (o.icon === 'drop') return drop(o.x, o.y, o.r * 0.8, o.wob);
      emoji(o.icon, o.x, o.y, o.r * 2, o.rot);
    });
    if (state.gravity) {
      ctx.fillStyle = 'rgba(90,60,30,0.35)';
      ctx.fillRect(0, H - 14, W, 14);
    }
  }

  function drawQuizArt() {
    var u = unit();
    emoji('👩‍🚀', W / 2, H / 2 + bob(0, 6), Math.min(H * 0.6, 110 * u), Math.sin(clock * 0.5) * 0.2);
    drop(W / 2 + 90 * u + bob(1, 10), H / 2 - 30 * u + bob(2, 8), 12 * u, clock);
    emoji('🍎', W / 2 - 100 * u + bob(3, 10), H / 2 - 20 * u + bob(4, 8), 30 * u, clock * 0.4);
  }

  function tag(text, x, y) {
    ctx.font = '800 15px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width + 20;
    x = clamp(x, w / 2 + 4, W - w / 2 - 4);
    ctx.fillStyle = 'rgba(20,28,48,0.78)';
    roundRect(x - w / 2, y - 14, w, 28, 9);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y + 1);
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

  /* ---------- 누르기·끌기 ---------- */

  function pos(e) {
    var r = el.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() / 1000 };
  }

  el.canvas.addEventListener('pointerdown', function (e) {
    if (!state.playing || state.act !== 'float') return;
    var p = pos(e), o = grabAt(p.x, p.y);
    el.hint.hidden = true;
    if (!o) return;
    state.grab = { o: o, dx: o.x - p.x, dy: o.y - p.y, hist: [p] };
    o.vx = o.vy = 0;
    try { el.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 없어도 됨 */ }
    if (window.SFX) SFX.tap();
  });
  el.canvas.addEventListener('pointermove', function (e) {
    var g = state.grab;
    if (!g) return;
    var p = pos(e);
    g.o.x = clamp(p.x + g.dx, g.o.r, W - g.o.r);
    g.o.y = clamp(p.y + g.dy, g.o.r, H - g.o.r);
    g.hist.push(p);
    if (g.hist.length > 6) g.hist.shift();
  });
  function release() {
    var g = state.grab;
    if (!g) return;
    state.grab = null;
    var a = g.hist[0], b = g.hist[g.hist.length - 1], dt = Math.max(b.t - a.t, 0.016);
    g.o.vx = clamp((b.x - a.x) / dt, -1600, 1600);
    g.o.vy = clamp((b.y - a.y) / dt, -1600, 1600);
    g.o.vr = (Math.random() - 0.5) * 3;
  }
  el.canvas.addEventListener('pointerup', release);
  el.canvas.addEventListener('pointercancel', release);

  /* ---------- 놀이 ---------- */

  function startDay() {
    el.score.textContent = '🏠';
    state.seen = {};
    el.ctrl.innerHTML = '';
    SCENES.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'chip scene-chip';
      b.dataset.id = s.id;
      b.textContent = s.icon + ' ' + s.name;
      b.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        showScene(s);
      });
      el.ctrl.appendChild(b);
    });
    el.ctrl.hidden = false;
    el.hint.hidden = true;
    showScene(SCENES[0], true);
  }

  function showScene(s, first) {
    state.scene = s.id;
    state.sceneT = 0;
    state.seen[s.id] = true;
    var n = Object.keys(state.seen).length;
    el.score.textContent = '👀 ' + n + '/' + SCENES.length;
    Array.prototype.forEach.call(el.ctrl.children, function (b) {
      b.classList.toggle('on', b.dataset.id === s.id);
      if (state.seen[b.dataset.id]) b.classList.add('done');
    });
    setLabel(s.icon + ' ' + s.name);
    state.prompt = (first ? '우주정거장 안이에요. 모두 둥둥 떠 있어요. ' : '') + s.say;
    speak(state.prompt);
  }

  function startFloat() {
    el.score.textContent = '🎈';
    state.gravity = false;
    makeObjs();
    el.ctrl.innerHTML = '';
    var gBtn = document.createElement('button');
    gBtn.className = 'chip';
    gBtn.textContent = '🌍 지구라면?';
    gBtn.addEventListener('click', function () {
      if (window.SFX) SFX.tap();
      state.gravity = !state.gravity;
      el.hint.hidden = true;
      gBtn.classList.toggle('on', state.gravity);
      gBtn.textContent = state.gravity ? '🛰️ 다시 우주로' : '🌍 지구라면?';
      if (!state.gravity) state.objs.forEach(function (o) { o.vx += (Math.random() - 0.5) * 60; o.vy = -60 - Math.random() * 80; });
      say(state.gravity ? '지구라면 모두 툭 떨어져요.' : '정거장 안에서는 다시 둥둥! 정거장이랑 다 같이 떨어지고 있어서 그래요.');
    });
    el.ctrl.appendChild(gBtn);
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 물건을 끌어서 던져 보세요';
    el.hint.hidden = false;
    setLabel('🎈 둥둥 놀이');
    state.prompt = '물건을 끌어서 던져 보세요. 우주정거장 안에서는 어떻게 움직일까요?';
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function startQuiz() {
    el.ctrl.hidden = true;
    el.ctrl.innerHTML = '';
    el.hint.hidden = true;
    el.cards.hidden = false;
    el.sky.classList.add('small-sky', 'fill-sky');
    el.score.textContent = '⭐ 0';
    state.round = 0;
    state.deck = UI.shuffle(QUIZ.slice()).slice(0, QUIZ_ROUNDS);
    setTimeout(fit, 0);
    nextRound();
  }

  function askQuiz(q) {
    el.cards.className = 'cards star-cards ans-cards';
    el.cards.innerHTML = '';
    var options = q.choices.map(function (c, i) { return { text: c, right: i === 0 }; });
    UI.shuffle(options);
    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice space-card';
      b.innerHTML = '<div class="text">' + o.text + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return quizMissed(b);
        quizCorrect(b, q);
      });
      el.cards.appendChild(b);
    });
    setLabel(q.q + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
    state.prompt = q.q;
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function quizCorrect(card, q) {
    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; el.score.textContent = '⭐ ' + state.stars; }
    state.round += 1;
    el.bar.style.width = Math.round(state.round / state.deck.length * 100) + '%';
    setLabel(q.why);
    state.prompt = q.why;
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

  function nextRound() {
    if (!state.playing || state.act !== 'quiz') return;
    if (state.round >= state.deck.length) return finishQuiz();
    state.firstTry = true;
    state.locked = false;
    askQuiz(state.deck[state.round]);
  }

  function finishQuiz() {
    state.locked = true;
    state.playing = false;
    var total = state.deck.length;
    UI.saveBest(BEST_KEY + '.quiz', state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);
    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = state.stars === total ? '우주비행사 박사!' : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  /* ---------- 놀이 진행 ---------- */

  function say(text) {
    state.prompt = text;
    setLabel(text);
    speak(text);
  }

  function setLabel(text) { el.label.textContent = text; }

  function startGame() {
    state.playing = true;
    state.objs = [];
    state.grab = null;
    state.stars = 0;
    state.firstTry = true;
    state.locked = false;
    el.bar.style.width = '0%';
    el.endOverlay.hidden = true;
    el.cards.hidden = true;
    el.cards.innerHTML = '';
    el.sky.classList.remove('small-sky', 'fill-sky');
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    fit();
    if (state.act === 'day') return startDay();
    if (state.act === 'float') return startFloat();
    startQuiz();
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
      var best = a.id === 'quiz' ? UI.readBest(BEST_KEY + '.quiz') : null;
      b.innerHTML = '<span class="mi">' + a.icon + '</span><span class="mn">' + a.name + '</span>' +
                    '<span class="mb">' + (best ? '⭐ ' + best.stars + '/' + best.total : '') + '</span>';
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

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    startGame();
  });
  el.againBtn.addEventListener('click', function () { startGame(); });
  el.endModes.addEventListener('click', function () {
    if (window.TTS) TTS.cancel();
    el.endOverlay.hidden = true;
    state.playing = false;
    el.ctrl.hidden = true;
    el.cards.hidden = true;
    el.sky.classList.remove('small-sky', 'fill-sky');
    buildModeRow();
    el.startOverlay.hidden = false;
  });
  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '우주정거장 안이에요.'; } });
  });

  var back = Catalog.backHref('iss.html');
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

  var speakSeq = 0;
  function speak(text, then) {
    var seq = ++speakSeq, called = false;
    function once() {
      if (called) return;
      called = true;
      if (seq !== speakSeq) return;
      el.speakBtn.classList.remove('speaking');
      if (then) then();
    }
    if (!text || !window.TTS || !TTS.supported) { setTimeout(once, 900 + (text || '').length * 110); return; }
    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }

  /* ---------- 시작 ---------- */

  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(el.sky);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  buildModeRow();
  fit();
  setLabel('👩‍🚀 우주정거장의 하루');
  requestAnimationFrame(frame);
})();
