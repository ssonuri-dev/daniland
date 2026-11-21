/* =========================================================================
 * 다니랜드 - 우주 쓰레기 (debris.html)
 *
 * 아이가 '우주 쓰레기는 뭐야?' 를 물어서 만든 화면입니다 (2026-11-20). 이 아이는 '설명은 싫고 그림으로'
 * 보는 것을 좋아해서 글은 이름표와 한두 문장뿐이고, 캔버스 한 장에 지구와 그 둘레를 도는 것들을 그립니다
 * (라이브러리 없음 — 태양계·낮과 밤과 같은 규칙).
 *
 * 진짜인 것
 *   - **높이의 비율**: 지구 반지름 6371km 에 대해 낮은 궤도(400~2000km)·GPS(20200km)·정지 궤도(35786km)를 그대로.
 *     그래서 쓰레기가 지구에 껍질처럼 붙어 있고(대부분 낮은 궤도), 정지 궤도는 멀리 고리로 보입니다.
 *   - **도는 빠르기의 비율**: 케플러 법칙(주기 ∝ 거리^1.5) — 낮은 것은 빨리(진짜 1시간 반), 정지 궤도는 느리게(하루).
 *   - 로켓 몸통 일부는 길쭉한 길(정지 궤도로 가는 길, GTO)을 돕니다. 낮은 궤도엔 일하는 위성(초록)도 많습니다.
 *   - 청소: 그물로 잡고(RemoveDEBRIS 위성이 2018년 실제로 시험) 끌어내리면 공기에 부딪혀 불타 없어집니다.
 * 진짜가 아닌 것
 *   - 점의 개수 (진짜는 사과보다 큰 것만 수만 개 — 그대로 찍으면 지구가 안 보입니다), 점·그림의 크기.
 *   - 청소하기의 청소 위성은 화면 구석에 서 있습니다 (진짜는 같이 궤도를 돕니다).
 *
 * 놀이 3가지
 *   look  : 구경하기 - 점을 누르면 무엇인지, 얼마나 높이 있는지. 가까이/멀리, 쓰레기만 보기
 *   clean : 청소하기 - 회색 쓰레기 열 개를 눌러 그물로 잡아요. 초록 불이 깜빡이는 일하는 위성은 잡으면 안 돼요
 *   quiz  : 퀴즈     - 보기 넉 장, QUIZ 에서 열 문제 (아이가 청해서 2026-11-21 더함). 위 그림은 문제마다 가까이/멀리
 *
 * 기록 키는 daniland.best.debris(카드의 ⭐)·daniland.best.debris.clean·.quiz, 마지막에 고른 놀이는 daniland.debrisAct.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.debris';
  var ACT_KEY = 'daniland.debrisAct';
  var GOAL = 10;
  var PRAISE = ['참 잘했어요!', '우주가 깨끗해졌어요!', '최고예요!', '청소 박사!'];

  var RE = 6371;                 // 지구 반지름 (km)
  var GEO = 42164;               // 정지 궤도 반지름 (지구 중심에서, km)
  var EL = 22 * Math.PI / 180;   // 내려다보는 각
  var SIN_EL = Math.sin(EL), COS_EL = Math.cos(EL);
  var TWO_PI = Math.PI * 2;

  var ACTS = [
    { id: 'look',  name: '구경하기', icon: '👀', desc: '지구 둘레를 도는 것들을 눌러 봐요' },
    { id: 'clean', name: '청소하기', icon: '🧹', desc: '회색 쓰레기를 그물로 잡아요 — 일하는 위성은 빼고요' },
    { id: 'quiz',  name: '퀴즈',     icon: '❓', desc: '우주 쓰레기 문제 열 개' }
  ];

  // 퀴즈 — 첫 보기가 정답(섞어서 냅니다). view 는 위 그림을 가까이(near)/멀리(far) 볼지.
  // 사실은 정확하게: 낮은 궤도는 1초에 7.5km 쯤(소총 총알의 여덟 배쯤), 10cm 넘는 것 수만 개·1cm 넘는 것 백만 개 넘게(ESA),
  // 우주정거장은 실제로 쓰레기를 비켜 가고, 2009년 이리듐-코스모스 충돌처럼 부딪히면 조각이 늘어나며,
  // 다 쓴 정지 위성은 더 높은 '무덤 궤도' 로 비켜 갑니다.
  var QUIZ = [
    { q: '우주 쓰레기는 무엇일까요?', view: 'near',
      why: '고장 난 위성, 다 쓴 로켓, 부서진 조각이 우주 쓰레기예요.',
      choices: ['🛰️ 고장 난 위성', '☄️ 별똥별', '🌙 달', '⭐ 별'] },
    { q: '우주 쓰레기는 어디에 가장 많을까요?', view: 'far',
      why: '지구 바로 위 낮은 곳에 가장 많아요. 위성을 그곳에 가장 많이 보내서요.',
      choices: ['🌍 지구 바로 위', '🌙 달 옆', '☀️ 해 옆', '🪐 토성 옆'] },
    { q: '청소할 때 잡으면 안 되는 것은 무엇일까요?', view: 'near',
      why: '우주정거장이에요. 우주비행사가 살고 있어요. 일하는 위성도 잡으면 안 돼요.',
      choices: ['👩‍🚀 우주정거장', '🔩 부서진 조각', '🚀 다 쓴 로켓', '🛰️ 고장 난 위성'] },
    { q: '낮은 곳의 우주 쓰레기는 얼마나 빨리 돌까요?', view: 'near',
      why: '1초에 7킬로미터가 넘어요. 총알보다 훨씬 빨라요.',
      choices: ['🚀 총알보다 빨리', '🚗 자동차만큼', '🚶 걷는 만큼', '🛑 안 움직여요'] },
    { q: '작은 조각이 위성에 부딪히면 어떻게 될까요?', view: 'near',
      why: '너무 빨라서 작은 조각도 구멍을 내요. 그래서 우주정거장은 쓰레기가 오면 살짝 비켜 가요.',
      choices: ['💥 구멍이 나요', '🎈 통 튕겨 나가요', '😴 아무 일도 없어요', '🍬 딱 달라붙어요'] },
    { q: '쓰레기끼리 부딪히면 어떻게 될까요?', view: 'near',
      why: '산산조각이 나서 쓰레기가 더 많아져요. 그래서 빨리 치워야 해요.',
      choices: ['🧩 조각이 더 많아져요', '🤝 하나로 붙어요', '✨ 사라져요', '🛑 멈춰요'] },
    { q: '우주 쓰레기를 어떻게 치울까요?', view: 'near',
      why: '그물이나 로봇 팔로 잡아서 아래로 끌어내려요.',
      choices: ['🕸️ 그물로 잡아요', '🧹 빗자루로 쓸어요', '💨 바람으로 날려요', '🧽 걸레로 닦아요'] },
    { q: '끌어내린 쓰레기는 어떻게 될까요?', view: 'near',
      why: '아주 빨라서 앞의 공기가 꽉 눌려 뜨거워지고, 불타 없어져요.',
      choices: ['🔥 공기 속에서 불타요', '❄️ 꽁꽁 얼어요', '🎈 둥둥 떠다녀요', '🌱 땅에서 자라요'] },
    { q: '아주 높은 곳의 쓰레기는 언제 떨어질까요?', view: 'far',
      why: '높은 곳엔 공기가 거의 없어서 몇백 년, 몇천 년도 돌아요. 낮은 곳의 것만 조금씩 내려와 불타요.',
      choices: ['⏳ 아주아주 오래 돌아요', '⚡ 내일 떨어져요', '☀️ 해로 날아가요', '🌙 달에 떨어져요'] },
    { q: '사과보다 큰 우주 쓰레기는 몇 개쯤 될까요?', view: 'far',
      why: '수만 개예요. 더 작은 조각은 백만 개가 넘어요.',
      choices: ['🔢 수만 개', '✋ 다섯 개', '🔟 열 개', '💯 백 개'] },
    { q: '쓰레기를 덜 만들려면 어떻게 할까요?', view: 'far',
      why: '일이 끝난 위성은 스스로 내려와 불타거나, 아무도 안 쓰는 아주 높은 곳으로 비켜 가요.',
      choices: ['👋 다 쓴 위성은 스스로 비켜요', '🎯 위성끼리 부딪혀요', '🚀 로켓을 더 버려요', '🙈 그냥 두어요'] }
  ];
  var QUIZ_ROUNDS = 10;

  // 무엇인지 — 이름표와 읽어 주는 말
  var KINDS = {
    deadsat: { name: '고장 난 인공위성', icon: '🛰️', junk: true },
    rocket:  { name: '다 쓴 로켓',       icon: '🚀', junk: true },
    piece:   { name: '부서진 조각',      icon: '🔩', junk: true },
    sat:     { name: '일하는 인공위성',  icon: '🛰️', junk: false },
    gps:     { name: '길 찾기 위성',     icon: '🧭', junk: false },
    geo:     { name: '날씨·방송 위성',   icon: '📡', junk: false },
    iss:     { name: '우주정거장',       icon: '👩‍🚀', junk: false }
  };

  var el = {
    page: document.querySelector('.earth-page'),
    cards: document.getElementById('cards'),
    sky: document.getElementById('sky'),
    canvas: document.getElementById('canvas'),
    hint: document.getElementById('skyHint'),
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

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    playing: false,
    objs: [],
    yaw: 0,
    zoom: 0,            // 0 = 멀리(정지 궤도까지), 1 = 가까이(낮은 궤도) — 사이를 부드럽게
    zoomTarget: 0,
    junkOnly: false,
    selected: null,
    simRate: 12,        // 1초에 몇 분 (진짜 시간)
    caught: 0,
    stars: 0,
    firstTry: true,
    net: null,
    told: false,
    prompt: '',
    touched: false,
    deck: [],
    round: 0,
    locked: false
  };
  if (!findAct(state.act)) state.act = 'look';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  /* ---------- 궤도 ---------- */

  function rand(a, b) { return a + Math.random() * (b - a); }
  function deg(d) { return d * Math.PI / 180; }

  // 주기(분) — 케플러 법칙. 지구 바로 위를 도는 것이 84.5분
  function period(a) { return 84.49 * Math.pow(a / RE, 1.5); }

  function makeObj(kind, a, e, inc) {
    return {
      kind: kind, a: a, e: e || 0, i: inc, O: rand(0, TWO_PI), w: rand(0, TWO_PI),
      M: rand(0, TWO_PI), spin: rand(0, TWO_PI), spinRate: rand(-0.8, 0.8),
      state: 'fly', trail: [], t: 0, flash: 0
    };
  }

  function pos(o) {
    var E = o.M;
    if (o.e) for (var k = 0; k < 6; k++) E = E - (E - o.e * Math.sin(E) - o.M) / (1 - o.e * Math.cos(E));
    var xo = o.a * (Math.cos(E) - o.e), yo = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
    var cw = Math.cos(o.w), sw = Math.sin(o.w);
    var x1 = xo * cw - yo * sw, y1 = xo * sw + yo * cw;
    var y2 = y1 * Math.cos(o.i), z2 = y1 * Math.sin(o.i);
    var cO = Math.cos(o.O), sO = Math.sin(o.O);
    return { x: x1 * cO - y2 * sO, y: x1 * sO + y2 * cO, z: z2 };
  }

  // 점의 비율은 대강 진짜를 따릅니다 — 낮은 궤도가 가장 많고(쓰레기는 750~1000km, 일하는 위성은 550km 근처),
  // GPS 는 55도 기울어진 20200km, 정지 궤도는 적도 위 고리(고장 난 것은 조금씩 기울어짐), 로켓 몸통 일부는 길쭉한 길.
  function buildSky() {
    var list = [], n;
    for (n = 0; n < 380; n++) {
      var r = Math.random();
      var kind = r < 0.62 ? 'piece' : (r < 0.82 ? 'deadsat' : 'rocket');
      var alt = (Math.random() < 0.7) ? rand(650, 1100) : rand(350, 2000);
      list.push(makeObj(kind, RE + alt, 0, deg(Math.random() < 0.55 ? rand(70, 100) : rand(20, 70))));
    }
    for (n = 0; n < 150; n++) list.push(makeObj('sat', RE + rand(500, 600), 0, deg(Math.random() < 0.75 ? 53 : 97.6)));
    for (n = 0; n < 24; n++) list.push(makeObj('gps', 26560, 0, deg(55)));
    for (n = 0; n < 10; n++) list.push(makeObj('deadsat', rand(25000, 28000), 0, deg(rand(50, 65))));
    for (n = 0; n < 34; n++) list.push(makeObj('geo', GEO, 0, deg(rand(0, 0.5))));
    for (n = 0; n < 36; n++) list.push(makeObj(Math.random() < 0.7 ? 'deadsat' : 'rocket', GEO + rand(-200, 400), 0, deg(rand(0, 15))));
    for (n = 0; n < 30; n++) {
      // 정지 궤도로 올려 주고 남은 로켓 — 낮은 끝 300km, 높은 끝 35786km
      var rp = RE + 300, ra = GEO;
      list.push(makeObj('rocket', (rp + ra) / 2, (ra - rp) / (ra + rp), deg(rand(0, 28))));
    }
    var iss = makeObj('iss', RE + 420, 0, deg(51.6));
    list.push(iss);
    return list;
  }

  // 청소하기 — 낮은 궤도만, 쓰레기 열 개 + 일하는 위성 여섯 + 우주정거장
  function buildClean() {
    var list = [], n;
    var kinds = ['deadsat', 'rocket', 'piece', 'deadsat', 'rocket', 'piece', 'deadsat', 'rocket', 'piece', 'piece'];
    for (n = 0; n < GOAL; n++) list.push(makeObj(kinds[n], RE + rand(650, 1500), 0, deg(rand(25, 100))));
    for (n = 0; n < 6; n++) list.push(makeObj('sat', RE + rand(500, 1300), 0, deg(rand(30, 98))));
    list.push(makeObj('iss', RE + 420, 0, deg(51.6)));
    return list;
  }

  /* ---------- 캔버스 ---------- */

  var W = 0, H = 0, dpr = 1;

  function fit() {
    if (el.page) el.page.style.height = (document.documentElement.clientHeight || window.innerHeight) + 'px';
    var w = el.sky.clientWidth, h = el.sky.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h;
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.width = w + 'px';
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 화면 한 칸이 몇 km 인가 — 멀리: 정지 궤도까지, 가까이: 지구 둘레 2200km 까지
  function scale() {
    var far = GEO * 1.04, near = RE + 2100;
    var fitR = far + (near - far) * state.zoom;
    // 멀리서는 고리가 납작해서 세로를 넉넉히 쓰고, 가까이서는 기울어진 길이 위아래로도 뻗어서 덜 씁니다
    return Math.min(W * 0.47, H * (0.62 - 0.17 * state.zoom)) / fitR;
  }

  function center() { return { x: W / 2, y: H / 2 + (state.act === 'clean' ? -10 : 6) }; }

  function project(p, k, c) {
    var cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
    var X = p.x * cy - p.y * sy;
    var Y = p.x * sy + p.y * cy;            // 화면 안쪽
    var up = Y * SIN_EL + p.z * COS_EL;
    var d = -Y * COS_EL + p.z * SIN_EL;     // + 면 보는 사람 쪽
    var hidden = d < 0 && (X * X + up * up) < RE * RE;
    return { x: c.x + X * k, y: c.y - up * k, d: d, hidden: hidden };
  }

  var bgStars = (function () {
    var out = [];
    for (var i = 0; i < 160; i++) out.push({ x: Math.random(), y: Math.random(), a: 0.15 + Math.random() * 0.6, s: Math.random() < 0.1 ? 2 : 1, tw: Math.random() * 6 });
    return out;
  })();

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    advance(dt);
    draw();
  }

  function advance(dt) {
    state.yaw += dt * 0.04;
    state.zoom += (state.zoomTarget - state.zoom) * Math.min(1, dt * 4);
    var minutes = state.simRate * dt;
    state.objs.forEach(function (o) {
      if (o.state === 'gone') return;
      o.M = (o.M + TWO_PI * minutes / period(o.a)) % TWO_PI;
      o.spin += o.spinRate * dt;
      if (o.flash > 0) o.flash -= dt;
      if (o.state === 'fall') {
        // 그물에 걸린 쓰레기 — 점점 내려와서(빨라지며) 공기에 닿으면 불탑니다
        o.t += dt;
        o.a = Math.max(RE + 90, o.a - dt * 380);
        if (o.a <= RE + 95) { o.state = 'burn'; o.t = 0; }
      } else if (o.state === 'burn') {
        o.t += dt;
        o.a = Math.max(RE + 20, o.a - dt * 60);
        if (o.t > 1.4) o.state = 'gone';
      }
    });
    if (state.net) {
      state.net.t += dt / 0.6;
      if (state.net.t >= 1) {
        var o = state.net.target;
        o.state = 'fall';
        o.t = 0;
        state.net = null;
      }
    }
  }

  function draw() {
    if (!W) return;
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < bgStars.length; i++) {
      var s = bgStars[i];
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(clock * 1.5 + s.tw));
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    if (!state.objs.length) return;

    var k = scale(), c = center();
    var big = state.act === 'clean';
    var items = [];
    state.objs.forEach(function (o) {
      if (o.state === 'gone') return;
      if (state.junkOnly && !KINDS[o.kind].junk) return;
      var q = project(pos(o), k, c);
      o.sx = q.x; o.sy = q.y; o.hidden = q.hidden;
      items.push({ o: o, q: q });
    });

    if (!big) drawRings(k, c);

    // 지구 뒤쪽 → 지구 → 앞쪽
    items.forEach(function (it) { if (it.q.d < 0) drawObj(it.o, it.q, big); });
    drawEarth(c, RE * k);
    items.forEach(function (it) { if (it.q.d >= 0) drawObj(it.o, it.q, big); });

    if (state.selected && state.selected.state !== 'gone') drawTag(state.selected);
    if (big) { drawCleaner(); drawNet(); }
    else drawLegend();
  }

  // 멀리서 볼 때 길 이름 — 정지 궤도 고리와 GPS 높이
  function drawRings(k, c) {
    if (state.zoom > 0.5) return;
    ctx.globalAlpha = 1 - state.zoom * 2;
    ctx.strokeStyle = 'rgba(150,170,255,0.22)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, GEO * k, GEO * k * SIN_EL, 0, 0, TWO_PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#8f9cc8';
    ctx.font = '700 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('정지 궤도 (높이 36000km)', c.x, c.y + GEO * k * SIN_EL + 6);
    ctx.globalAlpha = 1;
  }

  function drawEarth(c, R) {
    var glow = ctx.createRadialGradient(c.x, c.y, R * 0.9, c.x, c.y, R * 1.25);
    glow.addColorStop(0, 'rgba(110,180,255,0.45)');
    glow.addColorStop(1, 'rgba(110,180,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(c.x, c.y, R * 1.25, 0, TWO_PI);
    ctx.fill();
    var g = ctx.createRadialGradient(c.x - R * 0.35, c.y - R * 0.35, R * 0.1, c.x, c.y, R);
    g.addColorStop(0, '#7fd0ff');
    g.addColorStop(0.55, '#2f7fd6');
    g.addColorStop(1, '#123d7a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, R, 0, TWO_PI);
    ctx.fill();
    // 땅 몇 조각 — 지구가 도는 것처럼 yaw 를 따라 옆으로 흐릅니다
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, R, 0, TWO_PI);
    ctx.clip();
    ctx.fillStyle = 'rgba(90,170,90,0.55)';
    var lands = [[0.2, -0.3, 0.35, 0.22], [1.6, 0.2, 0.3, 0.35], [3.0, -0.1, 0.4, 0.25], [4.4, 0.35, 0.25, 0.2], [5.3, -0.45, 0.3, 0.15]];
    lands.forEach(function (L) {
      var lon = L[0] + state.yaw * 3;
      var x = Math.sin(lon);
      if (Math.cos(lon) < -0.1) return;
      ctx.beginPath();
      ctx.ellipse(c.x + x * R * 0.85, c.y + L[1] * R, L[2] * R * Math.max(0.2, Math.cos(lon)), L[3] * R, 0, 0, TWO_PI);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - R * 0.93, R * 0.35, R * 0.1, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  function drawObj(o, q, big) {
    var kd = KINDS[o.kind];
    if (o.state === 'burn') return drawBurn(o, q, big);
    if (o.state === 'fall') {
      o.trail.push({ x: q.x, y: q.y });
      if (o.trail.length > 14) o.trail.shift();
    }
    if (q.hidden) return;
    var near = q.d >= 0;
    if (!big) {
      // 멀리서는 점 — 회색 쓰레기, 초록 일하는 위성, 우주정거장은 조금 크게
      var r = o.kind === 'iss' ? 3.5 : (kd.junk ? 1.6 : 1.8);
      ctx.globalAlpha = near ? 1 : 0.55;
      ctx.fillStyle = kd.junk ? '#c9c4bb' : (o.kind === 'iss' ? '#ffffff' : '#6dff9c');
      ctx.beginPath();
      ctx.arc(q.x, q.y, r + state.zoom * 0.8, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    var s = o.kind === 'iss' ? 44 : 28;
    ctx.save();
    ctx.translate(q.x, q.y);
    if (o.flash > 0 && Math.floor(o.flash * 8) % 2 === 0) {
      ctx.fillStyle = 'rgba(109,255,156,0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, 0, TWO_PI);
      ctx.fill();
    }
    if (o.kind === 'iss') drawISS(s);
    else if (o.kind === 'sat') drawSat(s, true);
    else {
      ctx.rotate(o.spin);
      if (o.kind === 'deadsat') drawSat(s, false);
      else if (o.kind === 'rocket') drawRocket(s);
      else drawPiece(s);
    }
    ctx.restore();
    if (o.state === 'fall') drawWrap(q.x, q.y, s);
  }

  function drawSat(s, working) {
    var b = s * 0.36;
    ctx.fillStyle = working ? '#dfe6ef' : '#8d8a86';
    ctx.fillRect(-b / 2, -b / 2, b, b);
    var pw = s * 0.42, ph = s * 0.26;
    ctx.fillStyle = working ? '#3a6fd8' : '#4c4f57';
    ctx.fillRect(-b / 2 - pw, -ph / 2, pw - 2, ph);
    ctx.fillRect(b / 2 + 2, -ph / 2, pw - 2, ph);
    ctx.strokeStyle = working ? 'rgba(200,220,255,0.6)' : 'rgba(150,150,150,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 1; i < 3; i++) {
      ctx.moveTo(-b / 2 - pw + pw * i / 3, -ph / 2); ctx.lineTo(-b / 2 - pw + pw * i / 3, ph / 2);
      ctx.moveTo(b / 2 + 2 + pw * i / 3, -ph / 2); ctx.lineTo(b / 2 + 2 + pw * i / 3, ph / 2);
    }
    ctx.stroke();
    if (working) {
      // 초록 불 — 깜빡깜빡 '나는 일하는 중'
      var on = Math.sin(clock * 6) > -0.2;
      ctx.fillStyle = on ? '#6dff9c' : '#1f5a33';
      ctx.beginPath();
      ctx.arc(0, -b / 2 - 3, 3.2, 0, TWO_PI);
      ctx.fill();
    } else {
      // 고장 — 판 하나가 꺾이고 금이 감
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-b / 2 + 2, -b / 2 + 3);
      ctx.lineTo(0, 0);
      ctx.lineTo(-2, b / 2 - 1);
      ctx.stroke();
    }
  }

  function drawRocket(s) {
    var w = s * 0.32, h = s * 0.95;
    ctx.fillStyle = '#d8d4cc';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + w / 2);
    ctx.quadraticCurveTo(-w / 2, -h / 2, 0, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + w / 2);
    ctx.lineTo(w / 2, h / 2 - 4);
    ctx.lineTo(-w / 2, h / 2 - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7d7a75';
    ctx.fillRect(-w / 2, -h * 0.1, w, h * 0.12);
    ctx.fillStyle = '#5d5a55';
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, h / 2 - 4);
    ctx.lineTo(w * 0.35, h / 2 - 4);
    ctx.lineTo(w * 0.5, h / 2 + 3);
    ctx.lineTo(-w * 0.5, h / 2 + 3);
    ctx.closePath();
    ctx.fill();
  }

  function drawPiece(s) {
    var r = s * 0.34;
    ctx.fillStyle = '#a8a39b';
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.3);
    ctx.lineTo(-r * 0.2, -r);
    ctx.lineTo(r * 0.9, -r * 0.5);
    ctx.lineTo(r * 0.6, r * 0.4);
    ctx.lineTo(r * 0.9, r * 0.9);
    ctx.lineTo(-r * 0.4, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6b665f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawISS(s) {
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, 0);
    ctx.lineTo(s * 0.55, 0);
    ctx.stroke();
    ctx.fillStyle = '#c9a43a';
    [-0.5, -0.32, 0.32, 0.5].forEach(function (x) {
      ctx.fillRect(s * x - s * 0.06, -s * 0.36, s * 0.12, s * 0.3);
      ctx.fillRect(s * x - s * 0.06, s * 0.06, s * 0.12, s * 0.3);
    });
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(-s * 0.16, -s * 0.07, s * 0.32, s * 0.14);
    ctx.fillStyle = '#6dff9c';
    ctx.beginPath();
    ctx.arc(0, -s * 0.12, 3, 0, TWO_PI);
    ctx.fill();
  }

  // 그물에 싸인 모습
  function drawWrap(x, y, s) {
    ctx.strokeStyle = 'rgba(255,230,120,0.9)';
    ctx.lineWidth = 1.2;
    var r = s * 0.55;
    ctx.beginPath();
    for (var i = -2; i <= 2; i++) {
      ctx.moveTo(x - r, y + i * r / 2.5); ctx.lineTo(x + r, y + i * r / 2.5);
      ctx.moveTo(x + i * r / 2.5, y - r); ctx.lineTo(x + i * r / 2.5, y + r);
    }
    ctx.stroke();
  }

  // 불타는 모습 — 별똥별처럼 꼬리
  function drawBurn(o, q, big) {
    o.trail.push({ x: q.x, y: q.y });
    if (o.trail.length > 18) o.trail.shift();
    var fade = Math.max(0, 1 - o.t / 1.4);
    for (var i = 1; i < o.trail.length; i++) {
      var a = i / o.trail.length;
      ctx.strokeStyle = 'rgba(255,' + Math.round(120 + 100 * a) + ',60,' + (a * fade) + ')';
      ctx.lineWidth = (big ? 7 : 3) * a;
      ctx.beginPath();
      ctx.moveTo(o.trail[i - 1].x, o.trail[i - 1].y);
      ctx.lineTo(o.trail[i].x, o.trail[i].y);
      ctx.stroke();
    }
    if (q.hidden) return;
    var g = ctx.createRadialGradient(q.x, q.y, 1, q.x, q.y, big ? 16 : 6);
    g.addColorStop(0, 'rgba(255,250,210,' + fade + ')');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(q.x, q.y, big ? 16 : 6, 0, TWO_PI);
    ctx.fill();
  }

  function drawTag(o) {
    if (o.hidden) return;
    var kd = KINDS[o.kind];
    ctx.strokeStyle = '#ffe36e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(o.sx, o.sy, 10, 0, TWO_PI);
    ctx.stroke();
    var alt = Math.round((Math.sqrt(sq(pos(o))) - RE) / 10) * 10;
    var text = kd.icon + ' ' + kd.name + ' · 높이 ' + alt.toLocaleString('ko-KR') + 'km';
    ctx.font = '800 14px "Nanum Gothic", sans-serif';
    var tw = ctx.measureText(text).width;
    var x = Math.max(8, Math.min(W - tw - 18, o.sx - tw / 2 - 5));
    var y = o.sy - 40 < 6 ? o.sy + 16 : o.sy - 40;
    ctx.fillStyle = 'rgba(8,10,28,0.88)';
    roundRect(x, y, tw + 12, 26, 9);
    ctx.fill();
    ctx.strokeStyle = kd.junk ? 'rgba(220,215,205,0.6)' : 'rgba(109,255,156,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 6, y + 13);
  }

  function sq(p) { return p.x * p.x + p.y * p.y + p.z * p.z; }

  function drawLegend() {
    ctx.font = '700 13px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var y = H - 18;
    var x = 12;
    [['#c9c4bb', '쓰레기'], ['#6dff9c', '일하는 위성'], ['#ffffff', '우주정거장']].forEach(function (L) {
      if (state.junkOnly && L[1] !== '쓰레기') return;
      ctx.fillStyle = L[0];
      ctx.beginPath();
      ctx.arc(x + 4, y, 4, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = '#c9d2f5';
      ctx.fillText(L[1], x + 12, y);
      x += ctx.measureText(L[1]).width + 30;
    });
    ctx.fillStyle = 'rgba(160,170,210,0.65)';
    ctx.font = '700 11px "Nanum Gothic", sans-serif';
    // 좁으면 범례와 부딪쳐서 한 줄 위로
    var narrow = W < 560;
    ctx.textAlign = narrow ? 'left' : 'right';
    ctx.fillText('점은 진짜보다 훨씬 적게 그렸어요', narrow ? 12 : W - 10, narrow ? y - 20 : y);
  }

  // 청소 위성 — 화면 왼쪽 아래
  function cleanerPos() { return { x: Math.min(70, W * 0.14), y: H - 46 }; }

  function drawCleaner() {
    var p = cleanerPos();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(-13, -13, 26, 26);
    ctx.fillStyle = '#ff8a3d';
    ctx.fillRect(-40, -8, 24, 16);
    ctx.fillRect(16, -8, 24, 16);
    ctx.fillStyle = '#5a3a10';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧹', 0, 1);
    ctx.restore();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('청소 위성', p.x, p.y + 18);
  }

  function drawNet() {
    var n = state.net;
    if (!n) return;
    var a = cleanerPos(), b = { x: n.target.sx, y: n.target.sy };
    var t = Math.min(1, n.t);
    var x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    ctx.strokeStyle = 'rgba(255,230,120,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawWrap(x, y, 14 + 16 * t);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- 누르기 ---------- */

  function pick(x, y, radius) {
    var best = null, bd = radius * radius;
    state.objs.forEach(function (o) {
      if (o.state !== 'fly' || o.hidden || o.sx === undefined) return;
      if (state.junkOnly && !KINDS[o.kind].junk) return;
      var dx = o.sx - x, dy = o.sy - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = o; }
    });
    return best;
  }

  el.canvas.addEventListener('pointerdown', function (e) {
    if (!state.playing || state.act === 'quiz') return;   // 퀴즈의 위 그림은 보기만
    var b = el.canvas.getBoundingClientRect();
    var x = e.clientX - b.left, y = e.clientY - b.top;
    if (!state.touched) { state.touched = true; el.hint.hidden = true; }
    if (state.act === 'look') {
      var o = pick(x, y, 26);
      state.selected = o;
      if (o) {
        if (window.SFX) SFX.tap();
        var kd = KINDS[o.kind];
        state.prompt = kd.name + '이에요.';
        if (o.kind === 'iss') state.prompt = '우주정거장이에요. 우주비행사가 살아요.';
        speak(state.prompt);
      }
      return;
    }
    if (state.net) return;
    var t = pick(x, y, 36);
    if (!t) return;
    if (KINDS[t.kind].junk) return throwNet(t);
    // 일하는 위성 — 벌주지 않고 알려 주기만
    state.firstTry = false;
    t.flash = 1.2;
    if (window.SFX) SFX.wrong();
    state.prompt = t.kind === 'iss' ? '이건 우주정거장이에요. 우주비행사가 살아요!' : '이건 일하는 위성이에요. 초록 불이 깜빡이죠?';
    speak(state.prompt);
  });

  function throwNet(o) {
    if (window.SFX) SFX.correct();
    o.state = 'caught';
    state.net = { target: o, t: 0 };
    state.caught += 1;
    if (state.firstTry) { state.stars += 1; el.score.textContent = '⭐ ' + state.stars; }
    state.firstTry = true;
    el.bar.style.width = Math.round(state.caught / GOAL * 100) + '%';
    setLabel('🧹 ' + state.caught + ' / ' + GOAL);
    if (!state.told) {
      state.told = true;
      state.prompt = '잡았다! 쓰레기가 내려가서 불타 없어져요.';
      speak(state.prompt);
    }
    if (state.caught >= GOAL) setTimeout(finishClean, 3200);
  }

  function finishClean() {
    if (!state.playing || state.act !== 'clean') return;
    state.playing = false;
    UI.saveBest(BEST_KEY + '.clean', state.stars, GOAL);
    UI.saveBest(BEST_KEY, state.stars, GOAL);
    el.endStars.textContent = UI.starLine(state.stars, GOAL);
    el.endTitle.textContent = state.stars === GOAL ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : '잘했어요!';
    el.endText.textContent = '쓰레기 ' + GOAL + '개를 다 치웠어요! 일하는 위성은 그대로 일해요.';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    el.cards.hidden = true;
    el.cards.innerHTML = '';
    el.sky.classList.toggle('small-sky', state.act === 'quiz');
    state.selected = null;
    state.net = null;
    state.caught = 0;
    state.stars = 0;
    state.firstTry = true;
    state.told = false;
    el.bar.style.width = '0%';
    el.endOverlay.hidden = true;
    fit();
    if (state.act === 'look') return startLook();
    if (state.act === 'quiz') return startQuiz();
    startClean();
  }

  /* ---------- ❓ 퀴즈 ---------- */

  function startQuiz() {
    state.objs = buildSky();
    state.simRate = 12;
    state.junkOnly = false;
    state.zoom = state.zoomTarget = 0;
    el.ctrl.hidden = true;
    el.ctrl.innerHTML = '';
    el.hint.hidden = true;
    el.cards.hidden = false;
    el.score.textContent = '⭐ 0';
    state.round = 0;
    state.deck = UI.shuffle(QUIZ.slice()).slice(0, QUIZ_ROUNDS);
    nextRound();
  }

  function askQuiz(q) {
    state.zoomTarget = q.view === 'far' ? 0 : 1;
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
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
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
    el.endTitle.textContent = state.stars === total ? '우주 쓰레기 박사!' : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  function startLook() {
    state.objs = buildSky();
    state.simRate = 12;
    state.zoom = state.zoomTarget = 0;
    state.junkOnly = false;
    el.score.textContent = '🛰️';
    el.ctrl.innerHTML = '';
    addCtrl('🔍 가까이', function (b) {
      state.zoomTarget = state.zoomTarget ? 0 : 1;
      b.textContent = state.zoomTarget ? '🌐 멀리' : '🔍 가까이';
    });
    addCtrl('🗑️ 쓰레기만', function (b) {
      state.junkOnly = !state.junkOnly;
      b.classList.toggle('on', state.junkOnly);
      if (state.selected && state.junkOnly && !KINDS[state.selected.kind].junk) state.selected = null;
    });
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 점을 눌러 보세요';
    el.hint.hidden = state.touched;
    setLabel('🌍 지구 둘레를 도는 것들');
    state.prompt = '지구 둘레에 쓰레기가 빙글빙글 돌아요. 회색은 쓰레기, 초록은 일하는 위성이에요.';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function startClean() {
    state.objs = buildClean();
    state.simRate = 3.2;            // 낮은 궤도 한 바퀴가 30초쯤 — 아이 손이 따라갈 만큼
    state.zoom = state.zoomTarget = 1;
    state.junkOnly = false;
    el.score.textContent = '⭐ 0';
    el.ctrl.hidden = true;
    el.ctrl.innerHTML = '';
    el.hint.textContent = '👉 회색 쓰레기를 눌러요';
    el.hint.hidden = false;
    state.touched = false;
    setLabel('🧹 0 / ' + GOAL);
    state.prompt = '회색 쓰레기를 눌러서 그물로 잡아요. 초록 불이 깜빡이는 건 일하는 위성이에요.';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function addCtrl(text, fn) {
    var b = document.createElement('button');
    b.className = 'chip';
    b.textContent = text;
    b.addEventListener('click', function () {
      if (window.SFX) SFX.tap();
      fn(b);
    });
    el.ctrl.appendChild(b);
  }

  function setLabel(text) { el.label.textContent = text; }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
      var best = a.id === 'look' ? null : UI.readBest(BEST_KEY + '.' + a.id);
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
    el.cards.hidden = true;
    el.sky.classList.remove('small-sky');
    buildModeRow();
    el.startOverlay.hidden = false;
  });
  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '지구 둘레에 쓰레기가 돌아요.'; } });
  });

  var back = Catalog.backHref('debris.html');
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
  state.objs = buildSky();          // 시작 화면 뒤에서도 돕니다
  setLabel('지구 둘레를 도는 것들');
  requestAnimationFrame(frame);
})();
