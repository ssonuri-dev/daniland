/* =========================================================================
 * 다니랜드 - 대기권 (atmosphere.html)
 *
 * 우주 쓰레기를 본 아이가 '왜 내려오면 불타?' 를 궁금해해서 만든 화면입니다 (2026-11-21).
 * 이 아이는 '설명은 싫고 그림으로' 라서 글은 이름표와 한두 문장뿐이고, 캔버스 한 장에 그립니다
 * (라이브러리 없음 — 우주 과목의 다른 화면과 같은 규칙).
 *
 * 놀이 3가지
 *   up    : 올라가 보기 - 땅에서 우주정거장까지 세로 하늘. 구름·비행기·오존층·별똥별·오로라를 누르거나 🚀 를 타고 올라가요
 *   burn  : 왜 불탈까   - 별똥별·우주 쓰레기·우주선을 떨어뜨려 봐요. 🔍 돋보기 안에서 앞의 공기가 꽉 눌려 뜨거워지는 것이 보여요
 *   where : 어디에 있을까 - 하늘 그림에서 그것이 있는 높이를 눌러요 (아홉 문제)
 *
 * 진짜인 것
 *   - 높이: 대류권 0~12km · 성층권 12~50 · 중간권 50~85 · 열권 그 위 (중위도 표준), 우주의 시작 100km(카르만 선),
 *     비행기 10~12km, 에베레스트 8849m, 오존층 15~35km, 날씨 풍선은 30km 쯤에서 터짐, 별똥별 70~110km, 오로라 100~300km,
 *     우주정거장 400km 쯤.
 *   - 공기의 짙기는 5.5km 마다 반으로 (아래 점의 짙기 — exp(-h/7.6)). 그래서 점이 땅 가까이에만 몰려 있습니다.
 *   - **불타는 까닭은 '문질러서(마찰)' 가 아니라 '앞의 공기가 꽉 눌려서(압축)' 입니다.** 너무 빨라서 공기가 비켜 갈 틈이 없이
 *     앞에 쌓여 눌리고, 눌린 공기가 수천 도가 됩니다. 그 뜨거움은 대강 (공기의 짙기) × (빠르기)³ 에 따라가서 `glowOf()` 가
 *     그 식을 그대로 씁니다 — 그래서 별똥별(1초에 20km)은 높은 데서 금방 다 타고, 우주선·쓰레기(1초에 8km)는 더 낮은 곳
 *     (80~45km)에서 달아오르다 느려지면 식습니다. 우주선은 앞쪽 방패만 뜨거워지고, 큰 쓰레기는 조각이 바다까지 오기도 합니다.
 * 진짜가 아닌 것
 *   - 올라가 보기·어디에 있을까의 높이 칸은 √(높이) 비율입니다 (그대로면 구름·비행기가 바닥 1cm 안에 몰립니다 — km 눈금이 있습니다).
 *   - 떨어지는 빠르기는 화면에서 보이게 늦추고(별똥별) 당겼습니다(낙하산). 그림 크기도 진짜가 아닙니다.
 *
 * 기록 키는 daniland.best.air(카드의 ⭐)·daniland.best.air.where, 마지막에 고른 놀이는 daniland.airAct.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.air';
  var ACT_KEY = 'daniland.airAct';
  var PRAISE = ['참 잘했어요!', '하늘 박사!', '최고예요!', '다 맞혔어요!'];
  var TWO_PI = Math.PI * 2;

  var TOP_KM = 470;     // 올라가 보기·어디에 있을까의 맨 위 높이
  var BURN_TOP = 140;   // 왜 불탈까의 맨 위 높이
  var TOL = 18;         // 어디에 있을까에서 봐주는 픽셀

  var ACTS = [
    { id: 'up',    name: '올라가 보기',   icon: '🚀', desc: '땅에서 우주까지 — 눌러 보거나 로켓을 타요' },
    { id: 'burn',  name: '왜 불탈까',     icon: '🔥', desc: '하늘에서 떨어뜨려 보고, 돋보기로 공기를 봐요' },
    { id: 'where', name: '어디에 있을까', icon: '📍', desc: '그것이 있는 높이를 눌러요' }
  ];

  // 하늘의 것들 — h 는 그리는 높이(km), lo~hi 는 어디에 있을까에서 맞는 범위, x 는 가로 자리(화면 폭의 몫)
  var THINGS = [
    { id: 'cloud',   icon: '☁️', name: '구름',          h: 2,    lo: 0.5, hi: 12,  x: 0.46, alt: '1~12km',
      say: '구름이에요. 비와 눈이 여기서 내려요.', q: '구름은 어디에 있을까요?' },
    { id: 'everest', icon: '🏔️', name: '에베레스트산',  h: 8.85, lo: 7.5, hi: 10,  x: 0.19, alt: '8.8km',
      say: '세상에서 가장 높은 산 꼭대기예요. 공기가 적어서 숨쉬기 힘들어요.', q: '에베레스트산 꼭대기는 어디일까요?' },
    { id: 'plane',   icon: '✈️', name: '비행기',        h: 11,   lo: 9,   hi: 13,  x: 0.76, alt: '10~12km',
      say: '비행기는 구름보다 높이 날아요.', q: '비행기는 어디쯤 날까요?' },
    { id: 'ozone',   icon: '🛡️', name: '오존층',        h: 25,   lo: 15,  hi: 35,  x: 0.62, alt: '15~35km',
      say: '오존층이에요. 해의 나쁜 빛을 막아 줘요.', q: '오존층은 어디에 있을까요?' },
    { id: 'balloon', icon: '🎈', name: '날씨 풍선',     h: 33,   lo: 27,  hi: 38,  x: 0.33, alt: '30km쯤에서 펑',
      say: '날씨를 재는 풍선이에요. 올라갈수록 커지다가 펑 터져요.', q: '날씨 풍선은 어디쯤에서 터질까요?' },
    { id: 'meteor',  icon: '🌠', name: '별똥별',        h: 90,   lo: 70,  hi: 115, x: 0.27, alt: '70~110km',
      say: '별똥별이 타는 곳이에요. 우주에서 온 작은 돌이 여기서 불타요.', q: '별똥별은 어디서 탈까요?' },
    { id: 'space',   icon: '🚀', name: '여기부터 우주', h: 100,  lo: 95,  hi: 106, x: 0.62, alt: '100km',
      say: '여기부터 우주예요. 높이 100킬로미터.', q: '어디부터 우주일까요?' },
    { id: 'aurora',  icon: '🌌', name: '오로라',        h: 170,  lo: 100, hi: 320, x: 0.8,  alt: '100~300km',
      say: '오로라예요. 해에서 날아온 알갱이가 공기에 부딪혀 빛나요.', q: '오로라는 어디서 빛날까요?' },
    { id: 'iss',     icon: '🛰️', name: '우주정거장',    h: 415,  lo: 395, hi: 440, x: 0.5,  alt: '400km',
      say: '우주정거장이에요. 여기에도 공기가 아주 조금 있어서, 가끔 밀어 올려 줘야 해요.', q: '우주정거장은 어디에 있을까요?' }
  ];
  var GOAL = THINGS.length;

  // 공기 층 — 중위도 표준 높이
  var LAYERS = [
    { name: '대류권', lo: 0,  hi: 12 },
    { name: '성층권', lo: 12, hi: 50 },
    { name: '중간권', lo: 50, hi: 85 },
    { name: '열권',   lo: 85, hi: 600 }
  ];

  // 떨어뜨릴 것 — v 는 진짜 빠르기(1초에 km)
  var DROPS = {
    meteor:  { name: '별똥별',    icon: '☄️',
      say: '별똥별은 작은 돌이에요. 너무 빨라서 앞의 공기가 꽉 눌리고, 눌린 공기가 아주 뜨거워져서 다 타 버려요.' },
    debris:  { name: '우주 쓰레기', icon: '🛰️',
      say: '우주 쓰레기도 내려오면서 불타요. 아주 큰 것은 다 못 타고 조각이 바다에 떨어지기도 해요.' },
    capsule: { name: '우주선',    icon: '👩‍🚀',
      say: '우주선 아래에는 뜨거움을 막는 방패가 있어요. 느려지면 낙하산을 펴고 바다에 내려요.' }
  };

  var el = {
    page: document.querySelector('.earth-page'),
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
    act: UI.loadValue(ACT_KEY) || 'up',
    playing: false,
    selected: null,
    ride: null,         // 🚀 올라가기 { f } — f 는 칸의 몫(0~1)
    drops: [],          // 떨어지는 것들
    fx: [],             // 물보라·먼지
    lens: true,         // 🔍 돋보기
    follow: null,       // 돋보기가 보는 것
    order: [],          // 어디에 있을까 — 문제 차례
    qi: 0,
    solved: {},
    wrong: 0,
    marks: [],
    stars: 0,
    firstTry: true,
    busy: false,
    prompt: '',
    touched: false
  };
  if (!findAct(state.act)) state.act = 'up';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }
  function findThing(id) {
    for (var i = 0; i < THINGS.length; i++) if (THINGS[i].id === id) return THINGS[i];
    return null;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

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
    lensParts = null;
  }

  // 하늘 칸 — 위아래 끝과 땅
  function col() { return { top: 22, bot: H - 40 }; }

  // 올라가 보기·어디에 있을까: √ 높이 칸
  function yOf(h) { var c = col(); return c.bot - Math.sqrt(Math.max(0, h) / TOP_KM) * (c.bot - c.top); }
  function hOf(y) { var c = col(); var f = (c.bot - y) / (c.bot - c.top); return f <= 0 ? 0 : TOP_KM * f * f; }
  // 왜 불탈까: 곧은 높이 칸
  function yB(h) { var c = col(); return c.bot - h / BURN_TOP * (c.bot - c.top); }
  function pxPerKm() { var c = col(); return (c.bot - c.top) / BURN_TOP; }

  var bgStars = (function () {
    var out = [];
    for (var i = 0; i < 140; i++) out.push({ x: Math.random(), y: Math.random(), a: 0.2 + Math.random() * 0.6, s: Math.random() < 0.1 ? 2 : 1, tw: Math.random() * 6 });
    return out;
  })();

  // 공기 알갱이 — 화면 위 짙기가 진짜 공기의 짙기(5.5km 마다 반)를 따릅니다
  var airDots = (function () {
    var out = [];
    for (var i = 0; i < 900; i++) out.push({ x: Math.random(), f: Math.random() * 0.4, k: Math.random() });
    return out;
  })();

  // 하늘 빛 — 높이에 따라 파랑에서 까망으로
  var SKY = [[0, [143, 211, 255]], [5, [95, 180, 240]], [12, [47, 127, 208]], [25, [22, 63, 134]], [45, [11, 26, 69]], [80, [6, 10, 34]], [130, [4, 5, 12]]];
  function skyColor(h) {
    for (var i = 1; i < SKY.length; i++) {
      if (h <= SKY[i][0]) {
        var a = SKY[i - 1], b = SKY[i], t = (h - a[0]) / (b[0] - a[0]);
        return 'rgb(' + Math.round(a[1][0] + (b[1][0] - a[1][0]) * t) + ',' + Math.round(a[1][1] + (b[1][1] - a[1][1]) * t) + ',' + Math.round(a[1][2] + (b[1][2] - a[1][2]) * t) + ')';
      }
    }
    return 'rgb(4,5,12)';
  }

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    advance(dt);
    draw();
  }

  /* ---------- 움직임 ---------- */

  // 뜨거움 — (공기의 짙기) × (빠르기)³ 를 0~1 로. 공기의 짙기는 높이 7.2km 마다 e 분의 1
  function glowOf(h, v) {
    var q = Math.exp(-h / 7.2) * v * v * v;
    if (q <= 0) return 0;
    return clamp((Math.log(q) / Math.LN10 + 3) / 1.4, 0, 1);
  }

  // 우주 쓰레기·우주선의 진짜 빠르기 — 75km 까지는 거의 그대로(1초에 7.8km), 공기가 짙어지면 확 느려집니다
  function reentrySpeed(h) { return 7.8 * clamp((h - 40) / 35, 0.03, 1); }

  function advance(dt) {
    if (state.ride) advanceRide(dt);
    THINGS.forEach(function (t) { if (t.flash > 0) t.flash -= dt; });
    if (state.act === 'burn' || state.drops.length) advanceDrops(dt);
    state.fx = state.fx.filter(function (f) { f.t += dt; return f.t < 1.6; });
    advanceLens(dt);
  }

  function advanceRide(dt) {
    var r = state.ride;
    var end = Math.sqrt(findThing('iss').h / TOP_KM);
    var before = TOP_KM * r.f * r.f;
    r.f = Math.min(end, r.f + dt / 15);
    var now = TOP_KM * r.f * r.f;
    THINGS.forEach(function (t) {
      if (t.h > before && t.h <= now && t.id !== 'iss') {
        t.flash = 1.6;
        speak(t.name);
      }
    });
    if (r.f >= end) {
      state.ride = null;
      var iss = findThing('iss');
      state.selected = iss;
      iss.flash = 1.6;
      if (window.SFX) SFX.correct();
      state.prompt = '우주정거장에 왔어요! 높이 400킬로미터.';
      speak(state.prompt);
    }
  }

  function makeDrop(kind) {
    var k = pxPerKm();
    if (kind === 'meteor') return { kind: kind, x: W * rand(0.1, 0.22), h: BURN_TOP + 4, v: 20, m: 1, g: 0, trail: [], ang: 0 };
    return { kind: kind, x: W * 0.04, h: 122, v: 7.8, m: 1, g: 0, heat: 0, trail: [], spin: 0, ang: 0, chute: false, k: k };
  }

  function advanceDrops(dt) {
    var k = pxPerKm();
    var born = [];
    state.drops.forEach(function (d) {
      if (d.gone) { d.fade = (d.fade || 0) + dt; return; }
      var ox = d.x, oy = yB(d.h);
      if (d.kind === 'meteor') {
        // 별똥별 — 빠르기가 거의 안 줄고 높은 데서 다 탑니다 (화면에서는 진짜보다 훨씬 천천히)
        var dh = 10 * dt;
        d.h -= dh;
        d.x += dh * k / Math.tan(52 * Math.PI / 180);
        d.g = glowOf(d.h, d.v);
        d.m -= 1.1 * d.g * d.g * dt;
        if (d.m <= 0.03) { d.gone = true; d.fade = 0; sparks(d, 10); }
      } else {
        d.v = d.chute ? 0.008 : reentrySpeed(d.h);
        var vf = d.v / 7.8;
        var sd = d.chute ? 1.4 : (d.h > 40 ? 4 + 5 * vf : 7);
        d.h -= sd * dt;
        if (d.x < W * 0.9) d.x += (W * 0.06 * vf + (d.dx || 0)) * dt;
        d.g = d.chute ? 0 : glowOf(d.h, d.v);
        d.heat += d.g * dt;
        d.spin += dt * (d.kind === 'capsule' ? 0 : 1.6);
        if (d.kind === 'debris') {
          if (d.heat > 0.9) {
            // 쪼개짐 — 작은 조각 셋은 다 타고, 큰 덩어리 하나는 남아서 바다까지
            d.gone = true; d.fade = 0; d.quiet = true;
            for (var i = 0; i < 4; i++) {
              var survive = i === 0;
              born.push({ kind: survive ? 'chunk' : 'piece', x: d.x, h: d.h, v: d.v, m: survive ? 0.7 : 0.6, g: d.g, heat: 0, trail: [],
                          spin: rand(0, 6), dx: (i - 1.5) * W * 0.012, burn: survive ? 0.04 : 0.45 });
            }
            sparks(d, 14);
            if (state.follow === d) state.follow = null;
          }
        } else if (d.kind === 'piece' || d.kind === 'chunk') {
          d.m -= d.burn * d.g * d.g * dt * 2;
          if (d.m <= 0.05) { d.gone = true; d.fade = 0; sparks(d, 6); }
        } else if (d.kind === 'capsule') {
          if (!d.chute && d.h < 10) { d.chute = true; if (state.follow === d && window.SFX) SFX.tap(); }
        }
        if (d.h <= 0 && !d.gone) {
          d.gone = true; d.fade = 0; d.landed = true;
          state.fx.push({ kind: d.x > W * 0.5 ? 'splash' : 'dust', x: d.x, y: yB(0), t: 0 });
        }
      }
      var ny = yB(d.h);
      if (Math.abs(d.x - ox) + Math.abs(ny - oy) > 0.01) d.ang = Math.atan2(ny - oy, d.x - ox);
      d.trail.push({ x: d.x, y: ny, g: d.g });
      if (d.trail.length > 40) d.trail.shift();
    });
    state.drops = state.drops.concat(born).filter(function (d) { return !d.gone || d.fade < 1.2; });
    // 돋보기는 날고 있는 것 중 가장 뜨거운 것을 봅니다 (뜨거운 게 없으면 마지막에 떨어뜨린 것)
    var best = null;
    state.drops.forEach(function (d) { if (!d.gone && d.g > 0.05 && (!best || d.g > best.g)) best = d; });
    if (best) state.follow = best;
    else if (state.follow && state.follow.gone) {
      state.follow = null;
      state.drops.forEach(function (d) { if (!d.gone) state.follow = d; });
    }
  }

  function sparks(d, n) {
    for (var i = 0; i < n; i++) state.fx.push({ kind: 'spark', x: d.x, y: yB(d.h), vx: rand(-40, 40), vy: rand(-40, 40), t: rand(0, 0.5) });
  }

  /* ---------- 돋보기 — 앞의 공기 ---------- */

  var lensParts = null;
  var LENS_BODY = { x: -0.95, r: 0.6 };   // 떨어지는 것의 앞머리 (돋보기 안 좌표, 반지름 1)

  function lensState() {
    var d = state.follow;
    if (!d || d.gone) return { g: 0, sp: 0.15, kind: null };
    return { g: d.g, sp: Math.min(1, d.v / 8), kind: d.kind };
  }

  function newPart(start) {
    var y0 = rand(0.06, 0.92) * (Math.random() < 0.5 ? -1 : 1);
    return { x: start ? rand(-1.1, 1.1) : rand(1.05, 1.3), y0: y0, y: y0, packed: false, th: 0, rad: 0 };
  }

  function advanceLens(dt) {
    if (state.act !== 'burn') return;
    if (!lensParts) { lensParts = []; for (var i = 0; i < 80; i++) lensParts.push(newPart(true)); }
    var ls = lensState();
    var hot = ls.g > 0.12;
    var U = 0.5 + 1.8 * ls.sp;
    var R = LENS_BODY.r, cx = LENS_BODY.x;
    var Rs = R + 0.08 + 0.2 * (1 - ls.g);    // 뜨거울수록 눌린 공기 층이 얇고 촘촘합니다
    lensParts.forEach(function (p, i) {
      if (p.packed) {
        if (!hot) { p.packed = false; p.x = cx + Math.cos(p.th) * p.rad; p.y0 = p.y; return; }
        // 눌린 공기 — 앞머리를 따라 아주 느리게 옆으로 밀려남 (그래서 앞에 쌓입니다)
        p.th += (p.th >= 0 ? 1 : -1) * (0.25 + 0.5 * Math.abs(p.th)) * dt;
        p.x = cx + Math.cos(p.th) * p.rad;
        p.y = Math.sin(p.th) * p.rad;
        if (Math.abs(p.th) > 1.9) lensParts[i] = newPart(false);
        return;
      }
      p.x -= U * dt;
      var rx = p.x - cx;
      if (hot) {
        p.y = p.y0;
        if (rx * rx + p.y * p.y <= Rs * Rs && rx > 0) {
          p.packed = true;
          p.rad = R + rand(0.02, Rs - R);
          p.th = Math.atan2(p.y, rx);
        }
      } else {
        // 느릴 때 — 공기가 옆으로 비켜 흐름 (둥근 기둥 둘레의 흐름 ψ = y(1 - R²/r²))
        var y = p.y0;
        for (var it = 0; it < 6; it++) {
          var r2 = rx * rx + y * y;
          if (r2 <= R * R * 1.02) r2 = R * R * 1.02;
          y = p.y0 / (1 - R * R / r2);
          if (Math.abs(y) > 1.2) { y = (y > 0 ? 1.2 : -1.2); break; }
        }
        p.y = y;
      }
      if (p.x < -1.15) lensParts[i] = newPart(false);
    });
  }

  function lensBox() {
    var r = clamp(Math.min(W, H) * 0.17, 56, 104);
    return { x: W - r - 12, y: r + 14, r: r };
  }

  function heatColor(g, a) {
    // 빨강 → 주황 → 노란 흰빛
    var r = 255, gg = Math.round(60 + 190 * g), b = Math.round(30 + 170 * Math.max(0, g - 0.6) / 0.4);
    return 'rgba(' + r + ',' + gg + ',' + b + ',' + a + ')';
  }

  function drawLens() {
    if (!state.lens || !lensParts) return;
    var L = lensBox(), ls = lensState();
    var hot = ls.g > 0.12;
    ctx.save();
    ctx.beginPath();
    ctx.arc(L.x, L.y, L.r, 0, TWO_PI);
    ctx.fillStyle = '#0b1638';
    ctx.fill();
    ctx.clip();
    // 앞머리
    var bx = L.x + LENS_BODY.x * L.r, br = LENS_BODY.r * L.r;
    ctx.fillStyle = ls.kind === 'capsule' ? '#3a3330' : (ls.kind === 'meteor' ? '#6f6256' : '#8d8a86');
    ctx.beginPath();
    ctx.arc(bx, L.y, br, 0, TWO_PI);
    ctx.fill();
    if (ls.g > 0.02) {
      var gl = ctx.createRadialGradient(bx + br * 0.6, L.y, br * 0.2, bx + br, L.y, br * 1.1);
      gl.addColorStop(0, heatColor(ls.g, 0.95 * ls.g));
      gl.addColorStop(1, heatColor(ls.g, 0));
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(bx + br * 0.7, L.y, br * 1.1, 0, TWO_PI);
      ctx.fill();
    }
    lensParts.forEach(function (p) {
      var rx = p.x - LENS_BODY.x;
      if (!p.packed && rx * rx + p.y * p.y < LENS_BODY.r * LENS_BODY.r) return;   // 몸 안에는 안 그림
      var x = L.x + p.x * L.r, y = L.y + p.y * L.r;
      ctx.fillStyle = p.packed ? heatColor(ls.g, 1) : 'rgba(170,215,255,0.85)';
      ctx.beginPath();
      ctx.arc(x, y, p.packed ? 2.6 : 2.1, 0, TWO_PI);
      ctx.fill();
    });
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(L.x, L.y, L.r, 0, TWO_PI);
    ctx.stroke();
    // 손잡이
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(200,170,120,0.9)';
    ctx.beginPath();
    ctx.moveTo(L.x - L.r * 0.72, L.y + L.r * 0.72);
    ctx.lineTo(L.x - L.r * 1.02, L.y + L.r * 1.02);
    ctx.stroke();
    ctx.font = '800 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = hot ? '#ffd08a' : '#bfe3ff';
    var text = hot ? '🔥 공기가 꽉 눌려요' : (ls.kind ? '💨 공기가 비켜 가요' : '🔍 돋보기');
    ctx.fillText(text, L.x, L.y + L.r + 6);
  }

  /* ---------- 그리기 ---------- */

  function draw() {
    if (!W) return;
    if (state.act === 'burn' && (state.playing || state.drops.length)) drawBurnScene();
    else drawColumn();
  }

  function drawStars(fromY) {
    for (var i = 0; i < bgStars.length; i++) {
      var s = bgStars[i];
      var y = s.y * fromY;
      var fade = clamp((fromY - y) / (fromY * 0.5), 0, 1);
      ctx.globalAlpha = s.a * fade * (0.65 + 0.35 * Math.sin(clock * 1.5 + s.tw));
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x * W, y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  // 올라가 보기 · 어디에 있을까 — √ 높이의 세로 하늘
  function drawColumn() {
    var c = col();
    var g = ctx.createLinearGradient(0, c.bot, 0, c.top);
    [0, 1, 3, 6, 12, 25, 45, 80, 130].forEach(function (h) {
      g.addColorStop(clamp((c.bot - yOf(h)) / (c.bot - c.top), 0, 1), skyColor(h));
    });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawStars(yOf(35));

    // 공기 알갱이 — 위로 갈수록 드뭅니다
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    airDots.forEach(function (d) {
      var h = TOP_KM * d.f * d.f;
      if (d.k > Math.exp(-h / 7.6)) return;
      var y = c.bot - d.f * (c.bot - c.top);
      ctx.fillRect(d.x * W, y, 1.6, 1.6);
    });

    var quiz = state.act === 'where' && state.playing;
    var show = function (id) { return !quiz || state.solved[id]; };

    // 오존층 띠 · 오로라 커튼 (그림이라 먼저)
    if (show('ozone')) {
      ctx.fillStyle = 'rgba(190,140,255,0.13)';
      ctx.fillRect(0, yOf(35), W, yOf(15) - yOf(35));
    }
    if (show('aurora')) drawAurora();
    if (quiz && state.wrong >= 2) {
      // 두 번 틀리면 맞는 높이를 살짝 밝혀 줍니다
      var t = THINGS[state.order[state.qi]];
      ctx.fillStyle = 'rgba(255,227,110,' + (0.16 + 0.08 * Math.sin(clock * 5)) + ')';
      ctx.fillRect(0, yOf(t.hi) - 6, W, yOf(t.lo) - yOf(t.hi) + 12);
    }

    // 층 경계와 이름
    ctx.font = '800 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    LAYERS.forEach(function (Lr, i) {
      if (i) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yOf(Lr.lo)); ctx.lineTo(W, yOf(Lr.lo));
        ctx.stroke();
      }
      var top = Math.min(Lr.hi, TOP_KM);
      var ym = (yOf(Lr.lo) + yOf(top)) / 2;
      ctx.fillStyle = 'rgba(230,240,255,0.55)';
      ctx.fillText(Lr.name, W - 8, ym);
    });

    // 우주의 시작 — 점선
    if (show('space')) {
      ctx.strokeStyle = 'rgba(255,227,110,0.7)';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, yOf(100)); ctx.lineTo(W, yOf(100));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 공기 반 — 점선
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.36, yOf(5.5)); ctx.lineTo(W * 0.64, yOf(5.5));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 10px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('이 아래에 공기의 반', W * 0.36 + 2, yOf(5.5) - 1);

    drawRuler();
    drawGround();
    if (show('everest')) drawMountain();

    THINGS.forEach(function (t) { if (show(t.id) && t.id !== 'everest') drawThing(t); });
    if (show('everest')) drawThingLabel(findThing('everest'), W * 0.19, yOf(8.85) - 4, true);

    if (state.ride) drawRocket();
    state.marks.forEach(function (m) {
      ctx.strokeStyle = 'rgba(255,120,120,' + Math.max(0, 1 - m.t / 2.5) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(m.x - 8, m.y - 8); ctx.lineTo(m.x + 8, m.y + 8);
      ctx.moveTo(m.x + 8, m.y - 8); ctx.lineTo(m.x - 8, m.y + 8);
      ctx.stroke();
      m.t += 1 / 60;
    });
    if (state.selected && !quiz) drawTag(state.selected);
  }

  function drawRuler() {
    ctx.font = '700 11px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    [0, 10, 50, 100, 200, 400].forEach(function (h) {
      var y = yOf(h);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(6, y);
      ctx.stroke();
      if (!h) return;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(h + 'km', 8, y);
    });
  }

  function drawGround() {
    var c = col();
    ctx.fillStyle = '#4f9a4a';
    ctx.fillRect(0, c.bot, W * 0.55, H - c.bot);
    ctx.fillStyle = '#2f73c9';
    ctx.fillRect(W * 0.55, c.bot, W * 0.45, H - c.bot);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (var x = W * 0.58; x < W; x += 26) ctx.fillRect(x + Math.sin(clock + x) * 3, c.bot + 10, 12, 2);
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏠', W * 0.43, c.bot + 14);
    ctx.fillText('🌳', W * 0.48, c.bot + 13);
  }

  function drawMountain() {
    var c = col(), px = W * 0.19, py = yOf(8.85);
    ctx.fillStyle = '#6b7186';
    ctx.beginPath();
    ctx.moveTo(W * 0.03, c.bot);
    ctx.lineTo(W * 0.12, yOf(5));
    ctx.lineTo(px, py);
    ctx.lineTo(W * 0.26, yOf(6.5));
    ctx.lineTo(W * 0.35, c.bot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2f6ff';
    ctx.beginPath();
    var sy = yOf(7.6);
    ctx.moveTo(px, py);
    ctx.lineTo(px + (W * 0.26 - px) * (sy - py) / (yOf(6.5) - py), sy);
    ctx.lineTo(px - (px - W * 0.12) * (sy - py) / (yOf(5) - py), sy);
    ctx.closePath();
    ctx.fill();
  }

  function drawAurora() {
    var x0 = W * 0.7, x1 = W * 0.88, yt = yOf(320), yb = yOf(100);
    var g = ctx.createLinearGradient(0, yb, 0, yt);
    g.addColorStop(0, 'rgba(90,255,150,0.55)');
    g.addColorStop(0.55, 'rgba(90,255,150,0.25)');
    g.addColorStop(1, 'rgba(255,80,140,0.18)');
    ctx.fillStyle = g;
    ctx.beginPath();
    var n = 14;
    for (var i = 0; i <= n; i++) {
      var x = x0 + (x1 - x0) * i / n;
      var y = yb + Math.sin(clock * 1.3 + i * 0.8) * 4;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    for (i = n; i >= 0; i--) {
      x = x0 + (x1 - x0) * i / n + Math.sin(clock + i) * 3;
      ctx.lineTo(x, yt + Math.sin(clock * 0.9 + i) * 8);
    }
    ctx.closePath();
    ctx.fill();
  }

  function thingPos(t) {
    if (t.id === 'everest') return { x: W * 0.19, y: yOf(t.h) };
    return { x: W * t.x, y: yOf(t.h) };
  }

  function drawThing(t) {
    var p = thingPos(t);
    var big = t.flash > 0 ? 1 + 0.25 * Math.sin(t.flash * 8) : 1;
    if (t.id === 'meteor') {
      // 불타는 꼬리
      ctx.strokeStyle = 'rgba(255,200,120,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - 26, p.y - 16);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5 * big, 0, TWO_PI);
      ctx.fill();
      drawThingLabel(t, p.x, p.y + 6, false);
      return;
    }
    if (t.id === 'space') {
      drawThingLabel(t, p.x, p.y - 3, true, '✨ ');
      return;
    }
    if (t.id === 'iss') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(big, big);
      drawISS(34);
      ctx.restore();
      drawThingLabel(t, p.x, p.y + 14, false);
      return;
    }
    ctx.font = Math.round(24 * big) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.icon, p.x, p.y);
    drawThingLabel(t, p.x, p.y + 14, false);
  }

  function drawThingLabel(t, x, y, above, pre) {
    ctx.font = '800 11px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = above ? 'bottom' : 'top';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,20,0.55)';
    var text = (pre || '') + t.name;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = t.flash > 0 ? '#ffe36e' : '#ffffff';
    ctx.fillText(text, x, y);
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
  }

  function drawRocket() {
    var c = col();
    var x = W * 0.5 + 22, y = c.bot - state.ride.f * (c.bot - c.top);
    ctx.save();
    ctx.translate(x, y);
    var fl = 10 + Math.random() * 8;
    ctx.fillStyle = 'rgba(255,170,60,0.9)';
    ctx.beginPath();
    ctx.moveTo(-5, 12); ctx.lineTo(0, 12 + fl); ctx.lineTo(5, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath();
    ctx.moveTo(-6, 12); ctx.lineTo(-6, -6); ctx.quadraticCurveTo(0, -20, 6, -6); ctx.lineTo(6, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e04848';
    ctx.fillRect(-9, 5, 3, 8); ctx.fillRect(6, 5, 3, 8);
    ctx.fillStyle = '#4aa3ff';
    ctx.beginPath(); ctx.arc(0, -3, 2.5, 0, TWO_PI); ctx.fill();
    ctx.restore();
    var h = TOP_KM * state.ride.f * state.ride.f;
    ctx.font = '800 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe36e';
    ctx.fillText((h < 10 ? h.toFixed(1) : Math.round(h)) + 'km', x + 12, y);
  }

  function drawTag(t) {
    var p = thingPos(t);
    var text = t.icon + ' ' + t.name + ' · 높이 ' + t.alt;
    ctx.font = '800 14px "Nanum Gothic", sans-serif';
    var tw = ctx.measureText(text).width;
    var x = clamp(p.x - tw / 2 - 6, 8, W - tw - 20);
    var y = p.y - 52 < 4 ? p.y + 30 : p.y - 52;
    ctx.fillStyle = 'rgba(8,10,28,0.88)';
    roundRect(x, y, tw + 12, 26, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,227,110,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 6, y + 13);
  }

  // 왜 불탈까 — 0~140km 곧은 높이
  function drawBurnScene() {
    var c = col();
    var g = ctx.createLinearGradient(0, c.bot, 0, c.top);
    [0, 5, 12, 25, 45, 80, 130].forEach(function (h) { g.addColorStop(clamp(h / BURN_TOP, 0, 1), skyColor(h)); });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawStars(yB(60));

    ctx.font = '800 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    LAYERS.forEach(function (Lr, i) {
      if (i) {
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yB(Lr.lo)); ctx.lineTo(W, yB(Lr.lo));
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(230,240,255,0.5)';
      ctx.fillText(Lr.name, 46, (yB(Lr.lo) + yB(Math.min(Lr.hi, BURN_TOP))) / 2);
    });
    ctx.strokeStyle = 'rgba(255,227,110,0.6)';
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(0, yB(100)); ctx.lineTo(W, yB(100));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,227,110,0.85)';
    ctx.textBaseline = 'bottom';
    ctx.fillText('여기부터 우주', 46, yB(100) - 2);

    ctx.font = '700 11px "Nanum Gothic", sans-serif';
    ctx.textBaseline = 'middle';
    [20, 40, 60, 80, 100, 120].forEach(function (h) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(0, yB(h)); ctx.lineTo(6, yB(h)); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(h + 'km', 8, yB(h));
    });
    drawGround();

    state.drops.forEach(drawDrop);
    state.fx.forEach(drawFx);
    if (state.follow && !state.follow.gone) drawSpeed(state.follow);
    drawLens();
    ctx.fillStyle = 'rgba(200,210,240,0.6)';
    ctx.font = '700 10px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('떨어지는 빠르기와 크기는 진짜와 달라요', W - 8, col().bot - 4);
  }

  function dropSize(d) {
    if (d.kind === 'meteor') return 4 + 7 * Math.sqrt(Math.max(0, d.m));
    if (d.kind === 'debris') return 30;
    if (d.kind === 'capsule') return 24;
    if (d.kind === 'chunk') return 6 + 9 * Math.sqrt(Math.max(0, d.m));
    return 4 + 8 * Math.sqrt(Math.max(0, d.m));
  }

  function drawDrop(d) {
    var fade = d.gone ? Math.max(0, 1 - d.fade / 1.2) : 1;
    // 꼬리 — 뜨거운 만큼 밝게
    for (var i = 1; i < d.trail.length; i++) {
      var a = d.trail[i], b = d.trail[i - 1];
      var k = i / d.trail.length;
      if (a.g < 0.02) continue;
      ctx.strokeStyle = heatColor(a.g, k * a.g * 0.9 * fade);
      ctx.lineWidth = (d.kind === 'meteor' ? 5 : 8) * k * (0.4 + a.g);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y); ctx.lineTo(a.x, a.y);
      ctx.stroke();
    }
    if (d.gone) return;
    var x = d.x, y = yB(d.h), s = dropSize(d);
    // 달아오른 빛
    if (d.g > 0.02) {
      var gr = s * (1 + 1.5 * d.g);
      var gl = ctx.createRadialGradient(x, y, 1, x, y, gr);
      gl.addColorStop(0, heatColor(d.g, 0.7 * d.g));
      gl.addColorStop(1, heatColor(d.g, 0));
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(x, y, gr, 0, TWO_PI); ctx.fill();
      // 앞에 눌린 공기 — 가는 쪽 앞에 활 모양
      var fx = x + Math.cos(d.ang) * s * 0.7, fy = y + Math.sin(d.ang) * s * 0.7;
      ctx.strokeStyle = heatColor(d.g, 0.95);
      ctx.lineWidth = 2 + 4 * d.g;
      ctx.beginPath();
      ctx.arc(fx - Math.cos(d.ang) * s * 0.5, fy - Math.sin(d.ang) * s * 0.5, s * 0.85, d.ang - 1.1, d.ang + 1.1);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(x, y);
    if (d.kind === 'capsule') drawCapsule(d, s);
    else if (d.kind === 'debris') { ctx.rotate(d.spin); drawRocketBody(s); }
    else { ctx.rotate(d.spin || d.ang); drawRock(s, d.kind === 'chunk' ? '#77736c' : (d.kind === 'piece' ? '#a8a39b' : '#7a6a5a')); }
    ctx.restore();
  }

  function drawRock(s, color) {
    var r = s;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.3);
    ctx.lineTo(-r * 0.2, -r);
    ctx.lineTo(r * 0.9, -r * 0.5);
    ctx.lineTo(r * 0.7, r * 0.5);
    ctx.lineTo(r * 0.1, r * 0.95);
    ctx.lineTo(-r * 0.7, r * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  function drawRocketBody(s) {
    var w = s * 0.32, h = s * 0.95;
    ctx.fillStyle = '#d8d4cc';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + w / 2);
    ctx.quadraticCurveTo(-w / 2, -h / 2, 0, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + w / 2);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7d7a75';
    ctx.fillRect(-w / 2, -h * 0.1, w, h * 0.12);
  }

  // 우주선 — 둥근 방패가 앞(가는 쪽)을 봅니다. 낙하산을 펴면 바로 섭니다
  function drawCapsule(d, s) {
    var ang = d.chute ? Math.PI / 2 : d.ang;
    if (d.chute) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(-s * 1.1, -s * 2.1);
      ctx.moveTo(s * 0.3, -s * 0.3); ctx.lineTo(s * 1.1, -s * 2.1);
      ctx.stroke();
      ctx.fillStyle = '#ff8a3d';
      ctx.beginPath();
      ctx.arc(0, -s * 2.1, s * 1.15, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -s * 2.1, s * 1.15, Math.PI * 1.33, Math.PI * 1.67);
      ctx.lineTo(0, -s * 2.1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.rotate(ang);
    // 몸통(원뿔) — 뒤쪽(-x)으로 좁아짐
    ctx.fillStyle = '#e8e8ee';
    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.6);
    ctx.lineTo(-s * 0.55, -s * 0.25);
    ctx.lineTo(-s * 0.55, s * 0.25);
    ctx.lineTo(s * 0.35, s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4aa3ff';
    ctx.beginPath(); ctx.arc(-s * 0.05, 0, s * 0.12, 0, TWO_PI); ctx.fill();
    // 방패 — 탄 만큼 검게
    var ch = clamp(d.heat / 1.5, 0, 1);
    ctx.fillStyle = 'rgb(' + Math.round(140 - 90 * ch) + ',' + Math.round(110 - 70 * ch) + ',' + Math.round(80 - 50 * ch) + ')';
    ctx.beginPath();
    ctx.ellipse(s * 0.4, 0, s * 0.18, s * 0.64, 0, 0, TWO_PI);
    ctx.fill();
    if (d.g > 0.05) {
      ctx.fillStyle = heatColor(d.g, 0.9);
      ctx.beginPath();
      ctx.ellipse(s * 0.47, 0, s * 0.1, s * 0.58, 0, 0, TWO_PI);
      ctx.fill();
    }
  }

  function drawFx(f) {
    var a = Math.max(0, 1 - f.t / 1.6);
    if (f.kind === 'spark') {
      ctx.fillStyle = heatColor(0.8, a);
      ctx.fillRect(f.x + f.vx * f.t, f.y + f.vy * f.t + 20 * f.t * f.t, 2.5, 2.5);
    } else if (f.kind === 'splash') {
      ctx.strokeStyle = 'rgba(255,255,255,' + a + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y + 4, 8 + 30 * f.t, 3 + 8 * f.t, 0, 0, TWO_PI);
      ctx.stroke();
      ctx.fillStyle = 'rgba(220,240,255,' + a + ')';
      for (var i = -2; i <= 2; i++) ctx.fillRect(f.x + i * 6, f.y - 18 * Math.sin(Math.min(1, f.t * 2) * Math.PI) * (1 - Math.abs(i) * 0.25), 3, 3);
    } else {
      ctx.fillStyle = 'rgba(200,180,140,' + a * 0.6 + ')';
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, 6 + 24 * f.t, 4 + 8 * f.t, 0, 0, TWO_PI);
      ctx.fill();
    }
  }

  function drawSpeed(d) {
    var text;
    if (d.v >= 1) text = '1초에 ' + (d.v >= 10 ? Math.round(d.v) : d.v.toFixed(1)) + 'km';
    else text = '1초에 ' + Math.max(1, Math.round(d.v * 1000 / (d.v > 0.05 ? 10 : 1)) * (d.v > 0.05 ? 10 : 1)) + 'm';
    var x = d.x, y = yB(d.h) - dropSize(d) - (d.chute ? 60 : 14);
    ctx.font = '800 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,20,0.6)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = d.g > 0.12 ? '#ffd08a' : '#ffffff';
    ctx.fillText(text, x, y);
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

  el.canvas.addEventListener('pointerdown', function (e) {
    if (!state.playing) return;
    var b = el.canvas.getBoundingClientRect();
    var x = e.clientX - b.left, y = e.clientY - b.top;
    if (!state.touched) { state.touched = true; el.hint.hidden = true; }
    if (state.act === 'up') return tapUp(x, y);
    if (state.act === 'where') return tapWhere(x, y);
  });

  function tapUp(x, y) {
    var best = null, bd = 36 * 36;
    THINGS.forEach(function (t) {
      var p = thingPos(t);
      var dx = p.x - x, dy = p.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = t; }
    });
    if (!best) {
      // 띠 모양인 것 — 오존층·오로라는 띠 아무 데나
      var h = hOf(y);
      if (h >= 15 && h <= 35) best = findThing('ozone');
      else if (h >= 100 && h <= 320 && x > W * 0.68 && x < W * 0.9) best = findThing('aurora');
    }
    if (!best) return;
    state.selected = best;
    best.flash = 1.2;
    if (window.SFX) SFX.tap();
    state.prompt = best.say;
    speak(best.say);
  }

  function tapWhere(x, y) {
    if (state.busy || y > col().bot + 4) return;
    var t = THINGS[state.order[state.qi]];
    var yHi = yOf(t.hi) - TOL, yLo = yOf(t.lo) + TOL;
    if (y >= yHi && y <= yLo) {
      state.busy = true;
      state.solved[t.id] = true;
      t.flash = 1.6;
      if (window.SFX) SFX.correct();
      if (state.firstTry) { state.stars += 1; el.score.textContent = '⭐ ' + state.stars; }
      el.bar.style.width = Math.round((state.qi + 1) / GOAL * 100) + '%';
      state.prompt = '맞아요! ' + t.say;
      speak(state.prompt, function () {
        state.qi += 1;
        if (state.qi >= GOAL) finishWhere();
        else askWhere();
      });
      return;
    }
    state.firstTry = false;
    state.wrong += 1;
    state.marks.push({ x: x, y: y, t: 0 });
    if (state.marks.length > 3) state.marks.shift();
    if (window.SFX) SFX.wrong();
    speak(y > yLo ? '조금 더 위예요.' : '조금 더 아래예요.');
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    state.selected = null;
    state.ride = null;
    state.drops = [];
    state.fx = [];
    state.follow = null;
    state.marks = [];
    state.stars = 0;
    state.firstTry = true;
    state.busy = false;
    el.bar.style.width = '0%';
    el.endOverlay.hidden = true;
    el.ctrl.innerHTML = '';
    fit();
    if (state.act === 'up') return startUp();
    if (state.act === 'burn') return startBurn();
    startWhere();
  }

  function startUp() {
    el.score.textContent = '🌤️';
    addCtrl('🚀 올라가 보기', function () {
      state.ride = { f: 0 };
      state.selected = null;
      if (window.TTS) TTS.cancel();
    });
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 하늘의 것들을 눌러 보세요';
    el.hint.hidden = state.touched;
    setLabel('🌤️ 땅에서 우주까지');
    state.prompt = '지구는 공기 이불을 덮고 있어요. 위로 갈수록 공기가 적어지고, 하늘이 까매져요.';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function startBurn() {
    el.score.textContent = '🔥';
    ['meteor', 'debris', 'capsule'].forEach(function (k) {
      var D = DROPS[k];
      addCtrl(D.icon + ' ' + D.name, function () {
        var flying = state.drops.filter(function (d) { return !d.gone; }).length;
        if (flying >= 4) return;
        var d = makeDrop(k);
        state.drops.push(d);
        state.follow = d;
        state.touched = true;
        el.hint.hidden = true;
        state.prompt = D.say;
        speak(D.say);
      });
    });
    addCtrl('🔍 돋보기', function (b) {
      state.lens = !state.lens;
      b.classList.toggle('on', state.lens);
    });
    el.ctrl.lastChild.classList.toggle('on', state.lens);
    el.ctrl.hidden = false;
    el.hint.textContent = '👇 아래 단추로 떨어뜨려 보세요';
    el.hint.hidden = false;
    state.touched = false;
    setLabel('🔥 왜 불탈까?');
    state.prompt = '하늘 높이에서 무언가 떨어지면 어떻게 될까요? 단추를 눌러 떨어뜨려 봐요.';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function startWhere() {
    state.order = UI.shuffle(THINGS.map(function (t, i) { return i; }));
    state.qi = 0;
    state.solved = {};
    el.score.textContent = '⭐ 0';
    el.ctrl.hidden = true;
    el.hint.textContent = '👉 하늘에서 그 높이를 눌러요';
    el.hint.hidden = false;
    state.touched = false;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    askWhere();
  }

  function askWhere() {
    var t = THINGS[state.order[state.qi]];
    state.busy = false;
    state.firstTry = true;
    state.wrong = 0;
    state.marks = [];
    setLabel(t.icon + ' ' + t.q + '  (' + (state.qi + 1) + '/' + GOAL + ')');
    state.prompt = t.q;
    setTimeout(function () { speak(t.q); }, 250);
  }

  function finishWhere() {
    if (!state.playing || state.act !== 'where') return;
    state.playing = false;
    UI.saveBest(BEST_KEY + '.where', state.stars, GOAL);
    UI.saveBest(BEST_KEY, state.stars, GOAL);
    el.endStars.textContent = UI.starLine(state.stars, GOAL);
    el.endTitle.textContent = state.stars === GOAL ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : '잘했어요!';
    el.endText.textContent = '하늘의 ' + GOAL + '가지를 다 찾았어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
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
      var best = a.id === 'where' ? UI.readBest(BEST_KEY + '.where') : null;
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
    state.drops = [];
    el.ctrl.hidden = true;
    buildModeRow();
    el.startOverlay.hidden = false;
  });
  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '지구는 공기 이불을 덮고 있어요.'; } });
  });

  var back = Catalog.backHref('atmosphere.html');
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
  setLabel('땅에서 우주까지');
  requestAnimationFrame(frame);
})();
