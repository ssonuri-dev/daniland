/* =========================================================================
 * 다니랜드 - 태양계 (까만 우주에서 행성이 태양을 도는 3D 화면)
 *
 * 다니랜드에서 처음으로 까만 화면입니다. 별·태양·행성·고리·혜성·소행성대를 전부 캔버스에 직접
 * 그립니다 — 라이브러리(three.js 같은 것)를 쓰지 않습니다. 이 저장소는 의존성이 하나도 없는 것이
 * 원칙이고, 그래야 인터넷 없이 file:// 로 열어도 그대로 돌아갑니다.
 *
 * 3D 는 어떻게 하나
 *   행성은 태양을 중심으로 한 **XZ 평면**(y = 0)의 길 위에 있습니다. 그 점을 화면에 찍기까지
 *   project() 가 세 걸음을 밟습니다 — (1) y축으로 yaw 만큼 돌리고 (2) x축으로 pitch 만큼 눕히고
 *   (3) 눈에서 CAM_D 만큼 떨어뜨려 놓고 원근(가까우면 크게)으로 납작하게 만듭니다.
 *   pitch 가 90도면 위에서 내려다본 모습, 0도에 가까우면 옆에서 본 모습(궤도가 일직선)입니다.
 *   그릴 때는 깊이가 먼 것부터 그려서 앞의 것이 뒤의 것을 덮게 합니다 (화가 알고리즘).
 *   토성 고리는 행성보다 뒤쪽 반을 먼저, 앞쪽 반을 나중에 그려서 고리가 행성을 감싸 보입니다.
 *
 * 길이 동그라미가 아닌 것들 (명왕성 · 핼리 혜성)
 *   js/planets.js 에 e(길쭉한 정도)와 inc(기울기)가 적힌 몸은 타원으로 돕니다. 자리는 케플러
 *   방정식을 뉴턴법으로 풀어서(eccAnomaly) 구하므로 **태양에 가까울 때 빨라지고 멀 때 느려집니다**
 *   — 케플러 제2법칙이 그대로 보입니다. 혜성이 쏜살같이 태양을 스치고 가는 것이 그 때문입니다.
 *   inc 는 그 길을 판에서 기울여 놓습니다 (명왕성이 혼자 삐딱하게 도는 것).
 *
 * 크기와 거리는 진짜 비율이 아닙니다 (js/planets.js 의 주석 참고)
 *   진짜대로 그리면 해왕성이 수성보다 77배 멀어 한 화면에 안 들어오고, 수성은 1픽셀이 됩니다.
 *   그래서 평소에는 궤도를 차례대로 고르게 놓고(화성과 목성 사이만 넓게 — 거기 소행성대가 있습니다),
 *   크기는 실제 반지름을 0.36 제곱으로 눌러서 씁니다. 큰 차례(목성 > 토성 > … > 수성)는 그대로입니다.
 *   **'📏 진짜 거리' 단추를 누르면 진짜 비율로 쭉 늘어납니다** — 안쪽 행성 넷이 태양 옆에 뭉치고
 *   해왕성이 저 멀리 갑니다. 글로 적어 둔 것을 눈으로 보여 주는 단추라 구경하기에서만 나옵니다
 *   (놀이 중에 켜면 행성이 점이 되어 못 누릅니다).
 *   도는 빠르기는 실제 공전 주기의 세제곱근이라, '먼 것일수록 느리다' 는 것은 진짜와 같습니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   look : 구경하기   - 돌아다니다 행성을 누르면 그 행성 페이지(planet.html)로 갑니다 (점수 없음)
 *   find : 행성 찾기  - 다니가 말하는 행성을 우주에서 찾아 누릅니다 (행성 여덟 개 전부)
 *   quiz : 퀴즈       - 태양계 문제에 보기 넉 장으로 답합니다 (js/planets.js 의 SPACE_QUIZ)
 *
 * 기록 키는 daniland.best.space(카드의 ⭐)·daniland.best.space.<act>,
 * 마지막에 고른 놀이는 daniland.spaceAct, 빠르기는 daniland.spaceSpeed,
 * 들어가 본 곳은 daniland.space.seen 입니다 (구경하기의 👀 n/12).
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var QUIZ_ROUNDS = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '우주 박사!'];

  var BEST_KEY = 'daniland.best.space';
  var ACT_KEY = 'daniland.spaceAct';
  var SPEED_KEY = 'daniland.spaceSpeed';
  var SEEN_KEY = 'daniland.space.seen';

  /* ---------- 우주의 크기 (월드 단위) ---------- */

  var CAM_D = 20;        // 눈에서 태양까지 — 작을수록 원근이 세집니다
  var SCENE_R = 9.8;     // 제일 바깥(명왕성이 제일 멀어질 때)까지 — 화면에 맞출 때 씁니다
  var MOON_ORBIT = 0.52; // 달이 지구에서 떨어진 거리
  var STAR_R = 46;       // 별을 박아 둔 공의 반지름 (행성보다 훨씬 밖)
  var STAR_N = 420;

  // 진짜 거리 모드 — 1 AU 가 월드 단위로 얼마인가. 제일 먼 것(명왕성이 제일 멀어질 때 49.3 AU)이
  // 화면에 들어오게 맞췄습니다. 그러면 지구는 0.2, 수성은 0.08 이 되어 태양 옆에 딱 붙습니다 (진짜 그렇습니다).
  var REAL_UNIT = SCENE_R / 49.3;
  var REAL_SIZE = 0.06;  // 그때 몸 크기 배수 — 진짜 비율로는 행성이 다 점이 됩니다
  var MIN_DOT = 2.5;     // 그래도 이만큼(px)은 보이게

  // 소행성대 — 화성과 목성 사이. 평소 자리는 두 궤도 사이, 진짜 거리로는 2.1~3.3 AU.
  var BELT_N = 190;
  var BELT_EVEN = [4.95, 5.65];
  var BELT_AU = [2.1, 3.3];

  var SPEEDS = [
    { id: 'slow',   icon: '🐢', name: '느리게', earth: 28 },   // 지구가 한 바퀴 도는 데 걸리는 초
    { id: 'normal', icon: '🚶', name: '보통',   earth: 14 },
    { id: 'fast',   icon: '🐇', name: '빠르게', earth: 6 }
  ];

  var ACTS = [
    { id: 'look', name: '구경하기',  icon: '🔭', desc: '돌려 보다가 행성을 누르면 그 행성 이야기로 가요' },
    { id: 'find', name: '행성 찾기', icon: '🔍', desc: '다니가 말하는 행성을 우주에서 찾아 눌러요' },
    { id: 'quiz', name: '퀴즈',      icon: '❓', desc: '태양계에 대해 물어봐요' }
  ];

  var ORDER = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  /* 길이 동그라미가 아닌 몸의 '평소 자리' — 진짜 비율이 아니라 보기 좋으라고 정한 값입니다
     (진짜 값은 js/planets.js 의 au · e 이고, 진짜 거리 모드에서 그쪽으로 옮겨 갑니다).
       a : 긴반지름 · e : 길쭉한 정도 · peri : 태양에 제일 가까워지는 쪽을 어디로 둘지 */
  var EVEN = {
    pluto:  { a: 8.80, e: 0.11, peri: 2.1 },   // 제일 가까울 때 7.83 — 해왕성(8.41)보다 안쪽으로 들어옵니다
    halley: { a: 5.40, e: 0.72, peri: 0.6 }    // 수성 안쪽까지 왔다가 해왕성 너머까지 나갑니다
  };

  var el = {
    sky: document.getElementById('sky'),
    canvas: document.getElementById('canvas'),
    hint: document.getElementById('skyHint'),
    label: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    backBtn: document.getElementById('backBtn'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    resetBtn: document.getElementById('resetBtn'),
    realBtn: document.getElementById('realBtn'),
    speedBtn: document.getElementById('speedBtn'),
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

  /* ---------- 몸 만들기 (태양 · 행성 여덟 · 달 · 명왕성 · 혜성) ---------- */

  function byId(id) {
    var list = window.PLANETS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // 그리는 크기 — 실제 반지름(지구 = 1)을 0.36 제곱으로 눌러서 씁니다.
  // 그냥 비율대로 하면 태양이 수성의 285배라 한 화면에 같이 못 놓고, 수성은 1픽셀이 됩니다.
  // 제곱을 더 낮추면 수성이 커지는 대신 '목성이 제일 크다' 가 안 보입니다 (지금은 수성의 3.3배).
  function drawRadius(km) {
    return 0.275 * Math.pow(km / 6371, 0.36);
  }

  // 평소 궤도 — 차례대로 고르게. 화성(3)과 목성(4) 사이만 넓습니다 (거기 소행성대가 있습니다).
  function orbitRadius(i) {
    return 2.25 + i * 0.79 + (i >= 4 ? 0.58 : 0);
  }

  var bodies = [];
  var sun = null;
  var earth = null;
  var moon = null;
  var comet = null;

  (function buildBodies() {
    var s = byId('sun');
    sun = { data: s, a: 0, e: 0, aReal: 0, eReal: 0, peri: 0,
            R: drawRadius(s.radiusKm), angle: 0, spin: 0, center: null };
    bodies.push(sun);

    for (var i = 0; i < ORDER.length; i++) {
      var d = byId(ORDER[i]);
      if (!d) continue;
      var b = {
        data: d,
        a: orbitRadius(i),          // 평소 긴반지름
        e: 0,
        aReal: d.au * REAL_UNIT,    // 진짜 거리로 옮겼을 때
        eReal: 0,                   // 행성 궤도는 거의 동그라미라 그대로 둡니다
        peri: 0,
        R: drawRadius(d.radiusKm),
        angle: i * 2.35 + 0.7,      // 처음에 한 줄로 서지 않게 흩어 놓습니다
        spin: i * 1.1,
        center: null                // null 이면 태양을 돕니다
      };
      bodies.push(b);
      if (d.id === 'earth') earth = b;
    }

    // 달은 진짜 거리(0.0026 AU)로 놓으면 지구 점 안에 파묻혀 사라집니다 — 지구 점 반지름의 1/32 거리예요.
    // 그래서 몸이 작아지는 만큼(REAL_SIZE) 달 궤도도 같이 줄여, 지구 옆에 딱 붙어 보이게 둡니다.
    // 평소 값 그대로 두면 달만 안 줄어들어 지구-태양 거리의 2.6배 밖을 도는 떠돌이가 됩니다.
    var m = byId('moon');
    if (m && earth) {
      moon = { data: m, a: MOON_ORBIT, e: 0, aReal: MOON_ORBIT * REAL_SIZE, eReal: 0, peri: 0,
               R: drawRadius(m.radiusKm) * 0.75, angle: 1.2, spin: 0, center: earth };
      bodies.push(moon);
    }

    // 길이 타원인 것들 — 평소 자리는 EVEN, 진짜 거리로는 데이터의 au · e 를 씁니다
    ['pluto', 'halley'].forEach(function (id) {
      var d = byId(id);
      var ev = EVEN[id];
      if (!d || !ev) return;
      var b = {
        data: d,
        a: ev.a, e: ev.e,
        aReal: d.au * REAL_UNIT, eReal: d.e || 0,
        peri: ev.peri,
        inc: (d.inc || 0) * Math.PI / 180,
        retro: !!d.retro,
        // 혜성 본체는 15km 라 눌러도 안 보입니다 — 점으로라도 보이게 바닥을 둡니다
        R: drawRadius(Math.max(d.radiusKm, 400)),
        angle: (id === 'halley') ? 5.5 : 1.9,   // 혜성은 곧 태양을 스치도록 근일점 조금 앞에서 시작
        spin: 0,
        center: null
      };
      bodies.push(b);
      if (id === 'halley') comet = b;
    });
  })();

  // 소행성대 — 돌 하나가 { t, angle, y, sz }. t 로 평소 자리와 진짜 자리를 함께 정합니다.
  var belt = (function () {
    var out = [];
    for (var i = 0; i < BELT_N; i++) {
      out.push({
        t: Math.random(),
        angle: Math.random() * Math.PI * 2,
        y: (Math.random() - 0.5) * 0.14,     // 띠가 판에서 조금씩 위아래로 흩어져 있습니다
        sz: (Math.random() < 0.15) ? 1.8 : 1.1
      });
    }
    return out;
  })();

  // 별 — 아주 먼 공 위에 흩뿌립니다. 우주가 돌면 별도 같이 돌아서 3D 로 느껴집니다.
  var stars = (function () {
    var out = [];
    for (var i = 0; i < STAR_N; i++) {
      var u = Math.random() * 2 - 1;
      var t = Math.random() * Math.PI * 2;
      var r = Math.sqrt(1 - u * u);
      out.push({
        x: STAR_R * r * Math.cos(t),
        y: STAR_R * u,
        z: STAR_R * r * Math.sin(t),
        a: 0.25 + Math.random() * 0.75,
        s: (Math.random() < 0.08) ? 1.7 : 1,
        c: (Math.random() < 0.12) ? ((Math.random() < 0.5) ? '#ffd9c0' : '#cfe0ff') : '#ffffff'
      });
    }
    return out;
  })();

  /* ---------- 보는 자리 ---------- */

  var START_VIEW = { yaw: 0.55, pitch: 0.95, zoom: 1 };
  var view = { yaw: START_VIEW.yaw, pitch: START_VIEW.pitch, zoom: START_VIEW.zoom };

  var W = 0, H = 0, cx = 0, cy = 0, focalBase = 600, dpr = 1;
  var pageEl = document.querySelector('.space-page');

  function fit() {
    // 폰은 주소창 때문에 100vh 가 실제 화면보다 큽니다 — 잰 높이로 못 박습니다
    if (pageEl) pageEl.style.height = (document.documentElement.clientHeight || window.innerHeight) + 'px';
    var w = el.sky.clientWidth;
    var h = el.sky.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h; cx = w / 2; cy = h / 2;
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.width = w + 'px';
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 위에서 내려다봐도 바깥 궤도가 들어오는 크기 (가로가 아주 넓은 화면은 세로에 맞춥니다)
    focalBase = CAM_D * (Math.min(w, h * 1.3) * 0.46) / SCENE_R;
  }

  // 3D 점 하나를 화면 자리로. 눈 뒤로 넘어간 점은 null.
  function project(x, y, z) {
    var cyaw = Math.cos(view.yaw), syaw = Math.sin(view.yaw);
    var x1 = x * cyaw - z * syaw;
    var z1 = x * syaw + z * cyaw;

    var cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    var y2 = y * cp - z1 * sp;
    var z2 = y * sp + z1 * cp;

    var d = z2 + CAM_D;
    if (d < 1.2) return null;

    var s = (focalBase * view.zoom) / d;
    return { x: cx + x1 * s, y: cy + y2 * s, s: s, d: d };
  }

  /* ---------- 길 위의 자리 ----------
   * 케플러 방정식 E - e·sinE = M 을 뉴턴법으로 풉니다. M(평균 근점 이각)은 시간에 비례해 고르게
   * 늘어나지만 E 는 그렇지 않아서, 태양에 가까울 때 빨라지고 멀 때 느려집니다 (케플러 제2법칙). */

  function eccAnomaly(M, e) {
    M = M % (Math.PI * 2);
    if (M < 0) M += Math.PI * 2;
    var E = (e < 0.8) ? (M + e * Math.sin(M)) : Math.PI;
    for (var i = 0; i < 12; i++) {
      var den = 1 - e * Math.cos(E);
      if (Math.abs(den) < 1e-6) break;
      var d = (E - e * Math.sin(E) - M) / den;
      E -= d;
      if (Math.abs(d) < 1e-7) break;
    }
    return E;
  }

  // E(이심 근점 이각)로 3D 자리 하나. 궤도선을 그릴 때는 E 를 그냥 돌리면 되니까 나눠 두었습니다.
  function posFromE(b, E, a, e) {
    var x = e ? (a * (Math.cos(E) - e)) : (a * Math.cos(E));
    var z = (e ? (a * Math.sqrt(1 - e * e)) : a) * Math.sin(E);
    if (b.retro) z = -z;                      // 거꾸로 도는 것 (핼리 혜성)

    if (b.peri) {                             // 근일점 방향 돌리기
      var cw = Math.cos(b.peri), sw = Math.sin(b.peri);
      var nx = x * cw - z * sw;
      z = x * sw + z * cw;
      x = nx;
    }

    var y = 0;
    if (b.inc) {                              // 판에서 기울이기 (명왕성 · 혜성)
      y = -z * Math.sin(b.inc);
      z = z * Math.cos(b.inc);
    }
    return { x: x, y: y, z: z };
  }

  // 지금 이 몸의 긴반지름·길쭉한 정도 (진짜 거리 모드로 가는 중이면 그 사이 어딘가)
  function curA(b) { return b.a + (b.aReal - b.a) * state.realMix; }
  function curE(b) { return b.e + (b.eReal - b.e) * state.realMix; }

  function worldPos(b) {
    if (b === sun) return { x: 0, y: 0, z: 0 };
    var c = b.center ? worldPos(b.center) : { x: 0, y: 0, z: 0 };
    var a = curA(b), e = curE(b);
    var p = posFromE(b, e ? eccAnomaly(b.angle, e) : b.angle, a, e);
    return { x: c.x + p.x, y: c.y + p.y, z: c.z + p.z };
  }

  /* ---------- 놀이 상태 ---------- */

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    speed: UI.loadValue(SPEED_KEY) || 'normal',
    playing: false,
    round: 0,
    stars: 0,
    prompt: '',
    firstTry: true,
    locked: false,
    deck: [],
    target: null,       // 행성 찾기에서 찾아야 할 몸
    hint: false,        // 한 번 틀리면 그 행성의 궤도를 밝혀 줍니다
    mark: null,         // 캔버스에 잠깐 그리는 ⭕ ❌ { body, ok, until }
    real: false,        // 진짜 거리로 보기 (눌린 상태)
    realMix: 0,         // 실제로 옮겨 간 정도 0~1 (스르르 움직입니다)
    seen: loadSeen()
  };

  if (!findAct(state.act)) state.act = 'look';
  if (!findSpeed(state.speed)) state.speed = 'normal';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  function findSpeed(id) {
    for (var i = 0; i < SPEEDS.length; i++) if (SPEEDS[i].id === id) return SPEEDS[i];
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

  /* ---------- 움직이기 ---------- */

  var last = 0;

  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function step(dt) {
    var sp = findSpeed(state.speed);
    var base = (Math.PI * 2) / sp.earth;     // 지구의 각속도 (라디안/초)
    var i;

    for (i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b === sun) { b.spin += dt * 0.15; continue; }
      if (b === moon) { b.angle += dt * base * 4.5; continue; }   // 달은 빠르게 지구를 돕니다
      // 먼 것일수록 느립니다 — 실제 공전 주기의 세제곱근 (케플러 법칙과 같은 결)
      b.angle += dt * base / Math.pow(b.data.years, 1 / 3);
      b.spin += dt * 0.9;
    }

    // 소행성대도 각자 돕니다 (안쪽이 더 빨라요)
    for (i = 0; i < belt.length; i++) {
      var au = BELT_AU[0] + belt[i].t * (BELT_AU[1] - BELT_AU[0]);
      belt[i].angle += dt * base / Math.sqrt(au);
    }

    // 진짜 거리로 / 보기 좋게 — 스르르 옮겨 갑니다
    var want = state.real ? 1 : 0;
    if (state.realMix !== want) {
      var v = dt / 1.6;
      state.realMix += (want > state.realMix) ? Math.min(v, want - state.realMix)
                                              : -Math.min(v, state.realMix - want);
      if (Math.abs(state.realMix - want) < 0.001) state.realMix = want;
      setZoom(view.zoom);   // 모드에 따라 확대 한계가 달라서 다시 가둬 줍니다
    }
  }

  /* ---------- 그리기 ---------- */

  function draw() {
    if (!W) return;

    // 우주 바탕 — 가운데가 아주 살짝 밝은 남색
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, W, H);
    var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75);
    bg.addColorStop(0, 'rgba(50,60,130,0.22)');
    bg.addColorStop(1, 'rgba(4,5,12,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawStars();
    drawOrbits();
    drawBelt();

    // 깊이가 먼 것부터 그립니다 (앞의 것이 뒤의 것을 덮게)
    var list = [];
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      var w = worldPos(b);
      var p = project(w.x, w.y, w.z);
      b.p = p;
      b.w = w;
      b.pr = p ? Math.max(MIN_DOT, b.R * sizeMix() * p.s) : 0;
      if (p) list.push(b);
    }
    list.sort(function (a, c) { return c.p.d - a.p.d; });

    for (var j = 0; j < list.length; j++) drawBody(list[j]);

    // 이름표는 몸을 다 그린 뒤에, 가까운 것부터 — 겹치면 뒤엣것을 건너뜁니다
    labelBoxes.length = 0;
    for (var k = list.length - 1; k >= 0; k--) drawLabel(list[k]);
    drawBeltLabel();
    drawMark();
  }

  // 진짜 거리 모드로 갈수록 몸이 작아집니다 (진짜 비율에서는 행성이 다 점입니다)
  function sizeMix() {
    return 1 + (REAL_SIZE - 1) * state.realMix;
  }

  function drawStars() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var p = project(s.x, s.y, s.z);
      if (!p || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      ctx.globalAlpha = s.a;
      ctx.fillStyle = s.c;
      ctx.fillRect(p.x, p.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawOrbits() {
    var seg = 110;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b === sun || b === moon) continue;

      // 정답 궤도를 늘 밝혀 두면 그 고리만 따라가면 돼서 놀이가 안 됩니다 —
      // 한 번 틀린 뒤에만 '이 길 위에 있어' 하고 도와줍니다.
      var hint = (state.act === 'find' && state.hint && state.target === b);
      if (hint) ctx.strokeStyle = 'rgba(255,207,92,0.55)';
      else if (b === comet) ctx.strokeStyle = 'rgba(160,215,235,0.16)';
      else ctx.strokeStyle = 'rgba(150,180,255,0.20)';
      if (b === comet) ctx.setLineDash([4, 5]);

      var a = curA(b), e = curE(b);
      ctx.beginPath();
      var started = false;
      for (var k = 0; k <= seg; k++) {
        var q = posFromE(b, (k / seg) * Math.PI * 2, a, e);
        var p = project(q.x, q.y, q.z);
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* 소행성대 — 화성과 목성 사이. 돌 하나하나를 점으로 찍습니다.
     그 사이만 넓게 띄워 둔 이유가 이것입니다 (진짜로 거기 돌밭이 있습니다). */
  function drawBelt() {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#b9ae9e';
    for (var i = 0; i < belt.length; i++) {
      var r = belt[i];
      var rad = BELT_EVEN[0] + r.t * (BELT_EVEN[1] - BELT_EVEN[0]);
      var au = (BELT_AU[0] + r.t * (BELT_AU[1] - BELT_AU[0])) * REAL_UNIT;
      rad = rad + (au - rad) * state.realMix;
      var p = project(rad * Math.cos(r.angle), r.y, rad * Math.sin(r.angle));
      if (!p) continue;
      ctx.fillRect(p.x, p.y, r.sz, r.sz);
    }
    ctx.globalAlpha = 1;
  }

  function drawBody(b) {
    var p = b.p, r = b.pr;
    if (b === sun) return drawSun(p, r);
    if (b === comet) return drawComet(b);

    var d = b.data;
    if (d.ring) drawRing(b, false);

    // 해 쪽이 밝고 반대쪽이 어둡게 — 빛이 오는 쪽(태양의 화면 자리)으로 밝은 곳을 밀어 둡니다
    var sp = sun.p;
    var lx = 0, ly = 0;
    if (sp) {
      var dx = sp.x - p.x, dy = sp.y - p.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      lx = (dx / len) * r * 0.42;
      ly = (dy / len) * r * 0.42;
    }

    var g = ctx.createRadialGradient(p.x + lx, p.y + ly, r * 0.06, p.x, p.y, r * 1.06);
    g.addColorStop(0, d.color[0]);
    g.addColorStop(0.45, d.color[1]);
    g.addColorStop(1, d.color[2]);

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // 점만큼 작아졌으면 무늬는 보이지도 않습니다 (진짜 거리 모드)
    if (r > 7 && (d.bands || d.spot)) {
      ctx.save();
      ctx.clip();
      if (d.bands) {
        for (var i = 0; i < d.bands.length; i++) {
          var bd = d.bands[i];
          ctx.fillStyle = bd[2];
          ctx.fillRect(p.x - r, p.y + bd[0] * r - bd[1] * r / 2, r * 2, bd[1] * r);
        }
      }
      // 대적점 — 행성이 도니까 점도 앞뒤로 돕니다 (뒤로 가면 안 보입니다)
      if (d.spot) {
        var a = b.spin;
        var face = Math.cos(a);
        if (face > 0.02) {
          ctx.globalAlpha = Math.min(1, face * 1.6);
          ctx.fillStyle = d.spot[2];
          ctx.beginPath();
          ctx.ellipse(p.x + Math.sin(a) * r * 0.55, p.y + d.spot[1] * r,
                      r * 0.22 * face, r * 0.14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    }

    if (d.ring) drawRing(b, true);
  }

  /* 고리 — 행성 둘레의 원을 3D 로 돌려 찍고, 행성보다 뒤쪽 반(front=false)과 앞쪽 반(front=true)을
     나눠 그립니다. 그래야 고리가 행성을 감싼 것처럼 보입니다 (뒤쪽 → 행성 → 앞쪽 순서).
     띠 하나가 [안쪽, 바깥쪽, 진하기] 라서 토성은 C·B·A 고리와 그 사이 카시니 간극이 그대로 보입니다.
     옆에서 보면 고리가 선 하나로 납작해지는데, 그것도 진짜 그렇습니다 (두께가 10m 밖에 안 됩니다). */
  function drawRing(b, front) {
    var d = b.data;
    var w = b.w;
    if (b.pr < 4) return;        // 점만큼 작으면 고리를 그려 봐야 뭉개집니다

    for (var r = 0; r < d.ring.length; r++) {
      var band = d.ring[r];
      var mid = (band[0] + band[1]) / 2 * b.R * sizeMix();
      var thick = (band[1] - band[0]) * b.R * sizeMix();
      var seg = 96;
      var pts = [];
      var keep = [];

      for (var i = 0; i <= seg; i++) {
        var a = (i / seg) * Math.PI * 2;
        var p = project(w.x + mid * Math.cos(a), w.y, w.z + mid * Math.sin(a));
        pts.push(p);
        keep.push(!!p && (p.d < b.p.d) === front);
      }

      ctx.strokeStyle = (d.id === 'saturn')
        ? 'rgba(238,224,198,' + band[2] + ')'
        : 'rgba(198,230,240,' + band[2] + ')';
      ctx.lineWidth = Math.max(1, thick * b.p.s);

      // 이어진 토막마다 한 번씩 긋습니다. 앞뒤가 갈리는 자리는 한 점씩 겹쳐 그려야
      // 이음매에 틈이 안 생깁니다.
      var k = 0;
      while (k <= seg) {
        if (!keep[k]) { k++; continue; }
        var j = k;
        while (j + 1 <= seg && keep[j + 1]) j++;
        var from = Math.max(0, k - 1), to = Math.min(seg, j + 1);
        ctx.beginPath();
        var moved = false;
        for (var q = from; q <= to; q++) {
          if (!pts[q]) continue;
          if (!moved) { ctx.moveTo(pts[q].x, pts[q].y); moved = true; }
          else ctx.lineTo(pts[q].x, pts[q].y);
        }
        ctx.stroke();
        k = j + 1;
      }
    }
  }

  function drawSun(p, r) {
    var glow = ctx.createRadialGradient(p.x, p.y, r * 0.75, p.x, p.y, r * 4.2);
    glow.addColorStop(0, 'rgba(255,190,70,0.34)');
    glow.addColorStop(0.35, 'rgba(255,140,40,0.10)');
    glow.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 4.2, 0, Math.PI * 2);
    ctx.fill();

    var g = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
    g.addColorStop(0, '#fffdf2');
    g.addColorStop(0.45, '#ffd34d');
    g.addColorStop(1, '#ff7a18');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* 혜성 — 꼬리는 가는 방향이 아니라 늘 태양 반대쪽입니다 (태양풍이 밀어냅니다).
     태양에 가까울수록 얼음이 많이 녹아 꼬리가 길고 밝습니다. */
  function drawComet(b) {
    var p = b.p;
    var r = Math.max(2, b.pr * 0.8);
    var sp = sun.p;
    if (!sp) return;

    var dx = p.x - sp.x, dy = p.y - sp.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;

    // 지금 태양에서 얼마나 떨어져 있나 (제일 가까울 때를 1로)
    var a = curA(b), e = curE(b);
    var here = Math.sqrt(b.w.x * b.w.x + b.w.y * b.w.y + b.w.z * b.w.z);
    var near = Math.max(0.02, a * (1 - e));
    var q = Math.max(0, Math.min(1, Math.pow(near / Math.max(here, 0.001), 0.7)));

    var tail = (24 + 150 * q) * Math.min(2, view.zoom);
    var tx = p.x + (dx / len) * tail;
    var ty = p.y + (dy / len) * tail;

    var g = ctx.createLinearGradient(p.x, p.y, tx, ty);
    g.addColorStop(0, 'rgba(206,240,255,' + (0.20 + 0.6 * q).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(180,225,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = Math.max(2.5, r * 2.6);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.lineCap = 'butt';

    var head = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
    head.addColorStop(0, 'rgba(255,255,255,0.95)');
    head.addColorStop(0.35, 'rgba(210,240,255,0.45)');
    head.addColorStop(1, 'rgba(180,225,255,0)');
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---------- 이름표 ----------
   * 가까운 것부터 적고, 이미 적은 이름표와 겹치면 건너뜁니다. 그래야 수성이 태양 앞을 지날 때나
   * 달이 지구에 붙어 있을 때 글자가 뭉개지지 않습니다. */

  var labelBoxes = [];

  function labelFont() {
    ctx.font = '700 ' + ((W < 480) ? 11 : 13) + 'px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
  }

  function placeLabel(text, x, y, color) {
    var w = ctx.measureText(text).width;
    var box = { x: x - w / 2 - 3, y: y - 2, w: w + 6, h: 16 };
    for (var i = 0; i < labelBoxes.length; i++) {
      var o = labelBoxes[i];
      if (box.x < o.x + o.w && box.x + box.w > o.x && box.y < o.y + o.h && box.y + box.h > o.y) return;
    }
    labelBoxes.push(box);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(text, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function drawLabel(b) {
    var p = b.p, r = b.pr;
    if (p.x < -60 || p.x > W + 60 || p.y < -40 || p.y > H + 40) return;

    var name = b.data.name;
    if (state.act === 'look' && isSeen(b.data.id)) name = '✓ ' + name;

    labelFont();
    placeLabel(name, p.x, p.y + r + 5, (b === sun) ? '#ffd98a' : 'rgba(226,236,255,0.92)');
  }

  // 소행성대에는 누를 것이 없어서(돌이 너무 작습니다) 이름만 띄워 둡니다
  function drawBeltLabel() {
    var rad = (BELT_EVEN[0] + BELT_EVEN[1]) / 2;
    var au = (BELT_AU[0] + BELT_AU[1]) / 2 * REAL_UNIT;
    rad = rad + (au - rad) * state.realMix;
    var p = project(rad * Math.cos(2.35), 0, rad * Math.sin(2.35));
    if (!p || p.x < 0 || p.x > W || p.y < 0 || p.y > H) return;
    labelFont();
    placeLabel('소행성대', p.x, p.y + 6, 'rgba(198,190,175,0.75)');
  }

  // 맞았다 ⭕ / 아니다 ❌ 를 행성 둘레에 잠깐 그립니다
  function drawMark() {
    if (!state.mark) return;
    if (Date.now() > state.mark.until) { state.mark = null; return; }
    var b = state.mark.body;
    if (!b || !b.p) return;
    ctx.beginPath();
    ctx.arc(b.p.x, b.p.y, b.pr + 12, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = state.mark.ok ? '#6dd47e' : '#ff8fab';
    ctx.stroke();
  }

  /* ---------- 손가락 · 마우스 ---------- */

  var pointers = {};
  var dragged = false;
  var downAt = 0;
  var pinchStart = 0;
  var zoomStart = 1;

  function skyPoint(e) {
    var box = el.canvas.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  el.canvas.addEventListener('pointerdown', function (e) {
    el.canvas.setPointerCapture(e.pointerId);
    pointers[e.pointerId] = skyPoint(e);
    if (countPointers() === 1) { dragged = false; downAt = Date.now(); }
    if (countPointers() === 2) { pinchStart = pinchDist(); zoomStart = view.zoom; }
    hideHint();
  });

  el.canvas.addEventListener('pointermove', function (e) {
    var prev = pointers[e.pointerId];
    if (!prev) return;
    var now = skyPoint(e);
    pointers[e.pointerId] = now;

    if (countPointers() >= 2) {
      var d = pinchDist();
      if (pinchStart > 10 && d > 10) setZoom(zoomStart * (d / pinchStart));
      dragged = true;
      return;
    }

    var dx = now.x - prev.x, dy = now.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
    view.yaw += dx * 0.006;
    view.pitch = clamp(view.pitch + dy * 0.006, 0.05, Math.PI / 2);
  });

  function endPointer(e) {
    var p = pointers[e.pointerId];
    delete pointers[e.pointerId];
    if (countPointers() === 0 && p && !dragged && Date.now() - downAt < 600) tap(p.x, p.y);
    if (countPointers() < 2) pinchStart = 0;
  }

  el.canvas.addEventListener('pointerup', endPointer);
  el.canvas.addEventListener('pointercancel', function (e) { delete pointers[e.pointerId]; });

  el.canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    setZoom(view.zoom * Math.exp(-e.deltaY * 0.0012));
    hideHint();
  }, { passive: false });

  function countPointers() {
    var n = 0;
    for (var k in pointers) if (pointers.hasOwnProperty(k)) n++;
    return n;
  }

  function pinchDist() {
    var a = null, b = null;
    for (var k in pointers) {
      if (!pointers.hasOwnProperty(k)) continue;
      if (!a) a = pointers[k]; else if (!b) b = pointers[k];
    }
    if (!a || !b) return 0;
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // 진짜 거리 모드에서는 안쪽 행성 넷이 태양 옆에 뭉치므로 더 크게 볼 수 있어야 합니다
  function setZoom(z) { view.zoom = clamp(z, 0.55, 4.5 + 10 * state.realMix); }

  /* 궤도 하나가 지금 보는 각도에서 화면에 다 들어오는 최대 배율.
     '행성 찾기' 에서만 씁니다 — 찾으라고 해 놓고 그 행성이 화면 밖에 있으면 안 되니까요.
     구경하기는 줄이지 않습니다 (크게 보는 재미가 먼저고, 밖으로 나가면 끌어서 따라가면 됩니다). */
  function zoomFor(orbitR) {
    var cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    var vy = 0.0001, vx = 0.0001;
    for (var t = 0; t < Math.PI * 2; t += 0.1) {
      var z1 = orbitR * Math.sin(t);
      var x1 = orbitR * Math.cos(t);
      var d = z1 * cp + CAM_D;
      if (d < 1.2) continue;
      vy = Math.max(vy, Math.abs(z1 * sp) / d);
      vx = Math.max(vx, Math.abs(x1) / d);
    }
    return Math.min((H / 2 * 0.86) / (vy * focalBase), (W / 2 * 0.86) / (vx * focalBase));
  }

  function hideHint() {
    if (el.hint && !el.hint.hidden) el.hint.hidden = true;
  }

  // 건드리지 않아도 잠깐 뒤에는 사라집니다 (행성을 가리고 있으면 곤란하니까요)
  var hintTimer = 0;

  function showHintAwhile() {
    if (!el.hint) return;
    el.hint.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(hideHint, 7000);
  }

  el.zoomIn.addEventListener('click', function () { setZoom(view.zoom * 1.3); hideHint(); });
  el.zoomOut.addEventListener('click', function () { setZoom(view.zoom / 1.3); hideHint(); });
  el.resetBtn.addEventListener('click', function () {
    view.yaw = START_VIEW.yaw; view.pitch = START_VIEW.pitch; view.zoom = START_VIEW.zoom;
    hideHint();
  });

  /* 📏 진짜 거리로 보기 — 궤도가 진짜 비율로 쭉 늘어납니다.
     평소 화면이 진짜가 아니라는 걸 글이 아니라 눈으로 보여 주는 단추라 구경하기에서만 씁니다. */
  el.realBtn.addEventListener('click', function () { setReal(!state.real, true); });

  function setReal(on, tell) {
    state.real = !!on;
    el.realBtn.classList.toggle('on', state.real);
    el.realBtn.textContent = state.real ? '📏 보기 좋게' : '📏 진짜 거리';
    if (!tell) { state.realMix = state.real ? 1 : 0; return; }

    hideHint();
    view.zoom = START_VIEW.zoom;
    if (state.real) {
      var say = '진짜 거리로 보면 이래요. 안쪽 행성 넷은 태양 옆에 다닥다닥 붙어 있고, ' +
                '해왕성은 지구보다 서른 배나 멀어요.';
      setLabel('📏 진짜 거리 — 안쪽 행성 넷은 태양 옆에 붙어 있어요');
      state.prompt = say;
      el.speakBtn.hidden = !(window.TTS && TTS.supported);
      speak(say);
    } else {
      setLabel('행성을 누르면 그 행성 이야기로 가요');
      state.prompt = '다시 보기 좋은 자리로 놓았어요.';
      speak(state.prompt);
    }
  }

  // 누른 자리에서 제일 가까운 몸 (손가락이 굵으니 조금 넉넉하게 봅니다)
  function bodyAt(x, y) {
    var best = null, bestGap = 1e9;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (!b.p) continue;
      var dx = b.p.x - x, dy = b.p.y - y;
      var gap = Math.sqrt(dx * dx + dy * dy) - b.pr;
      if (gap < bestGap) { bestGap = gap; best = b; }
    }
    return (bestGap <= 26) ? best : null;
  }

  function tap(x, y) {
    var b = bodyAt(x, y);
    if (!b) return;

    if (state.act === 'look') return goPlanet(b);
    if (state.act !== 'find' || state.locked || !state.playing) return;

    if (b === state.target) return findCorrect(b);
    findMissed(b);
  }

  function goPlanet(b) {
    if (window.SFX) SFX.tap();
    if (window.TTS) TTS.cancel();
    window.location.href = 'planet.html?planet=' + encodeURIComponent(b.data.id);
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildModeRow();
  showSpeed();
  setReal(false, false);

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
        Array.prototype.forEach.call(el.modeRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
        showAct();
      });

      el.modeRow.appendChild(b);
    });

    showAct();
  }

  // 구경하기는 점수가 없고, 들어가 본 곳의 수를 보여 줍니다
  function bestText(act) {
    if (act === 'look') {
      return state.seen.length ? ('👀 ' + state.seen.length + '/' + bodies.length) : '';
    }
    var best = UI.readBest(BEST_KEY + '.' + act);
    return best ? ('⭐ ' + best.stars + '/' + best.total) : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  el.speedBtn.addEventListener('click', function () {
    var i = 0;
    for (var k = 0; k < SPEEDS.length; k++) if (SPEEDS[k].id === state.speed) i = k;
    state.speed = SPEEDS[(i + 1) % SPEEDS.length].id;
    UI.saveValue(SPEED_KEY, state.speed);
    showSpeed();
  });

  function showSpeed() {
    var s = findSpeed(state.speed);
    el.speedBtn.textContent = s.icon + ' ' + s.name;
  }

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
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '태양계를 구경해요.'; } });
  });

  var back = Catalog.backHref('space.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    state.round = 0;
    state.stars = 0;
    state.prompt = '';
    state.locked = false;
    state.target = null;
    state.mark = null;
    el.bar.style.width = '0%';
    el.cards.innerHTML = '';
    el.cards.hidden = (state.act !== 'quiz');
    el.speakBtn.hidden = true;
    // 진짜 거리는 '보여 주기' 라 구경하기에서만 — 놀이 중에 켜면 행성이 점이 되어 못 누릅니다
    el.realBtn.hidden = (state.act !== 'look');
    if (state.act !== 'look') setReal(false, false);
    showHintAwhile();
    fit();

    if (state.act === 'look') {
      updateScore();
      setLabel('행성을 누르면 그 행성 이야기로 가요');
      beginQuestion('여기는 태양계예요. 행성을 눌러 보세요.');
      return;
    }

    if (state.act === 'find') {
      state.deck = UI.shuffle(planetBodies());
    } else {
      state.deck = UI.shuffle((window.SPACE_QUIZ || []).slice()).slice(0, QUIZ_ROUNDS);
    }
    updateScore();
    nextRound();
  }

  // '행성 찾기' 는 행성 여덟 개만 냅니다 — 태양은 별, 달은 위성, 명왕성은 왜소행성, 혜성은 혜성이니까요
  function planetBodies() {
    var out = [];
    for (var i = 0; i < bodies.length; i++) {
      if (bodies[i].data.kind === 'planet') out.push(bodies[i]);
    }
    return out;
  }

  function nextRound() {
    if (state.round >= state.deck.length) return finish();
    state.firstTry = true;
    state.locked = false;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    if (state.act === 'find') askFind(state.deck[state.round]);
    else askQuiz(state.deck[state.round]);
  }

  function beginQuestion(spoken) {
    state.prompt = spoken;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function setLabel(text) { el.label.textContent = text; }

  /* 🔍 행성 찾기 — 이름으로 내기도 하고, 힌트로 내기도 합니다 */
  function askFind(b) {
    state.target = b;
    state.hint = false;
    setZoom(Math.min(view.zoom, zoomFor(curA(b))));
    var useHint = (Math.random() < 0.4) && b.data.hint;
    var name = b.data.name;
    var ask = useHint ? (b.data.hint + ' 어느 행성일까요?') : (josa(name, '을', '를') + ' 찾아 보세요.');

    setLabel((useHint ? b.data.hint : (name + ' 찾기')) + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
    beginQuestion(ask);
  }

  function findCorrect(b) {
    state.locked = true;
    state.mark = { body: b, ok: true, until: Date.now() + 1400 };
    if (window.SFX) SFX.correct();
    confettiAtBody(b);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    var why = josa(b.data.name, '을', '를') + ' 찾았어요! ' + b.data.tagline;
    setLabel('⭕ ' + b.data.name);
    state.prompt = why;
    el.speakBtn.hidden = true;
    speak(why, function () { setTimeout(nextRound, 400); });
  }

  function findMissed(b) {
    state.firstTry = false;
    state.hint = true;
    state.mark = { body: b, ok: false, until: Date.now() + 900 };
    if (window.SFX) SFX.wrong();
    var why = '그건 ' + josa(b.data.name, '이에요', '예요') + '. 다시 찾아 볼까요?';
    setLabel('❌ ' + b.data.name);
    speak(why, function () { setTimeout(function () { speak(state.prompt); }, 150); });
  }

  /* ❓ 퀴즈 — 보기 넉 장 (첫 번째가 정답, 화면에서는 섞습니다) */
  function askQuiz(q) {
    el.cards.innerHTML = '';
    el.cards.hidden = false;

    var options = q.choices.map(function (c, i) {
      return { text: c, right: (i === 0) };
    });
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

  function confettiAtBody(b) {
    if (!b.p) return;
    var box = el.canvas.getBoundingClientRect();
    UI.confettiAt({
      getBoundingClientRect: function () {
        return { left: box.left + b.p.x, top: box.top + b.p.y, width: 0, height: 0 };
      }
    });
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

  function updateScore() {
    if (state.act === 'look') {
      el.score.textContent = '👀 ' + state.seen.length + '/' + bodies.length;
    } else {
      el.score.textContent = '⭐ ' + state.stars;
    }
  }

  /* ---------- 소리 ---------- */

  // 받침이 있으면 앞 것, 없으면 뒤 것 — '목성을' · '지구를'
  function josa(word, a, b) {
    var ch = word.charCodeAt(word.length - 1);
    if (ch < 0xAC00 || ch > 0xD7A3) return word + b;
    return word + (((ch - 0xAC00) % 28) ? a : b);
  }

  // 나라 페이지와 같은 규칙입니다 — 새 말이 시작되면 먼저 하던 말의 then 은 부르지 않습니다
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
      setTimeout(once, 600);
      return;
    }

    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }

  /* ---------- 시작 ---------- */

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  fit();
  updateScore();
  setLabel('행성을 누르면 그 행성 이야기로 가요');
  requestAnimationFrame(frame);
})();
