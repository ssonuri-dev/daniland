/* =========================================================================
 * 다니랜드 - 태양계 (까만 우주에서 행성이 태양을 도는 3D 화면)
 *
 * 다니랜드에서 처음으로 까만 화면입니다. 별·태양·행성·고리를 전부 캔버스에 직접 그립니다 —
 * 라이브러리(three.js 같은 것)를 쓰지 않습니다. 이 저장소는 의존성이 하나도 없는 것이 원칙이고,
 * 그래야 인터넷 없이 file:// 로 열어도 그대로 돌아갑니다.
 *
 * 3D 는 어떻게 하나
 *   행성은 태양을 중심으로 한 **XZ 평면**(y = 0)의 원 위에 있습니다. 그 점을 화면에 찍기까지
 *   project() 가 세 걸음을 밟습니다 — (1) y축으로 yaw 만큼 돌리고 (2) x축으로 pitch 만큼 눕히고
 *   (3) 눈에서 CAM_D 만큼 떨어뜨려 놓고 원근(가까우면 크게)으로 납작하게 만듭니다.
 *   pitch 가 90도면 위에서 내려다본 모습, 0도에 가까우면 옆에서 본 모습(궤도가 일직선)입니다.
 *   그릴 때는 깊이가 먼 것부터 그려서 앞의 것이 뒤의 것을 덮게 합니다 (화가 알고리즘).
 *   토성 고리는 행성보다 뒤쪽 반을 먼저, 앞쪽 반을 나중에 그려서 고리가 행성을 감싸 보입니다.
 *
 * 크기와 거리는 진짜 비율이 아닙니다 (js/planets.js 의 주석 참고)
 *   진짜대로 그리면 해왕성이 수성보다 77배 멀어 한 화면에 안 들어오고, 수성은 1픽셀이 됩니다.
 *   그래서 궤도는 차례대로 고르게 놓고(화성과 목성 사이만 넓게 — 실제로 거기 소행성대가 있습니다),
 *   크기는 실제 반지름을 0.3 제곱으로 눌러서 씁니다. 큰 차례(목성 > 토성 > … > 수성)는 그대로입니다.
 *   진짜 거리와 크기는 행성 페이지(planet.html)의 칩과 이야기 카드에 적어 두었습니다.
 *   도는 빠르기는 실제 공전 주기의 세제곱근이라, '먼 행성일수록 느리다'는 것은 진짜와 같습니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   look : 구경하기   - 돌아다니다 행성을 누르면 그 행성 페이지(planet.html)로 갑니다 (점수 없음)
 *   find : 행성 찾기  - 다니가 말하는 행성을 우주에서 찾아 누릅니다 (행성 여덟 개 전부)
 *   quiz : 퀴즈       - 태양계 문제에 보기 넉 장으로 답합니다 (js/planets.js 의 SPACE_QUIZ)
 *
 * 기록 키는 daniland.best.space(카드의 ⭐)·daniland.best.space.<act>,
 * 마지막에 고른 놀이는 daniland.spaceAct, 빠르기는 daniland.spaceSpeed,
 * 들어가 본 행성은 daniland.space.seen 입니다 (구경하기의 👀 n/10).
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
  var SCENE_R = 8.9;     // 해왕성 궤도까지 (화면에 맞출 때 씁니다)
  var MOON_ORBIT = 0.52; // 달이 지구에서 떨어진 거리
  var STAR_R = 46;       // 별을 박아 둔 공의 반지름 (행성보다 훨씬 밖)
  var STAR_N = 420;

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

  /* ---------- 몸 만들기 (태양 · 행성 여덟 · 달) ---------- */

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

  // 궤도 — 차례대로 고르게. 화성(3)과 목성(4) 사이만 넓습니다 (거기 소행성대가 있습니다).
  function orbitRadius(i) {
    return 2.25 + i * 0.79 + (i >= 4 ? 0.58 : 0);
  }

  var bodies = [];   // 그리는 차례와 상관없이, 만들어 둔 목록
  var sun = null;
  var earth = null;
  var moon = null;

  (function buildBodies() {
    var s = byId('sun');
    sun = { data: s, orbit: 0, R: drawRadius(s.radiusKm), angle: 0, spin: 0, center: null };
    bodies.push(sun);

    for (var i = 0; i < ORDER.length; i++) {
      var d = byId(ORDER[i]);
      if (!d) continue;
      var b = {
        data: d,
        orbit: orbitRadius(i),
        R: drawRadius(d.radiusKm),
        angle: i * 2.35 + 0.7,     // 처음에 한 줄로 서지 않게 흩어 놓습니다
        spin: i * 1.1,
        center: null               // null 이면 태양을 돕니다
      };
      bodies.push(b);
      if (d.id === 'earth') earth = b;
    }

    var m = byId('moon');
    if (m && earth) {
      moon = { data: m, orbit: MOON_ORBIT, R: drawRadius(m.radiusKm) * 0.75, angle: 1.2, spin: 0, center: earth };
      bodies.push(moon);
    }
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
        s: Math.random() < 0.08 ? 1.7 : 1,
        c: Math.random() < 0.12 ? (Math.random() < 0.5 ? '#ffd9c0' : '#cfe0ff') : '#ffffff'
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
    // 위에서 내려다봐도 해왕성 궤도가 들어오는 크기 (가로가 아주 넓은 화면은 세로에 맞춥니다)
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
    mark: null,         // 캔버스에 잠깐 그리는 ⭕ ❌ { id, ok, until }
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

  /* ---------- 그리기 ---------- */

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

    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b === sun) { b.spin += dt * 0.15; continue; }
      if (b === moon) { b.angle += dt * base * 4.5; continue; }   // 달은 빠르게 지구를 돕니다
      // 먼 행성일수록 느립니다 — 실제 공전 주기의 세제곱근 (케플러 법칙과 같은 결)
      b.angle += dt * base / Math.pow(b.data.years, 1 / 3);
      b.spin += dt * 0.9;
    }
  }

  // 몸의 3D 자리
  function worldPos(b) {
    if (b === sun) return { x: 0, y: 0, z: 0 };
    var c = b.center ? worldPos(b.center) : { x: 0, y: 0, z: 0 };
    return {
      x: c.x + b.orbit * Math.cos(b.angle),
      y: 0,
      z: c.z + b.orbit * Math.sin(b.angle)
    };
  }

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

    // 깊이가 먼 것부터 그립니다 (앞의 것이 뒤의 것을 덮게)
    var list = [];
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      var w = worldPos(b);
      var p = project(w.x, w.y, w.z);
      b.p = p;
      b.pr = p ? Math.max(1.5, b.R * p.s) : 0;
      if (p) list.push(b);
    }
    list.sort(function (a, c) { return c.p.d - a.p.d; });

    for (var j = 0; j < list.length; j++) drawBody(list[j]);
    for (var k = 0; k < list.length; k++) drawLabel(list[k]);
    drawMark();
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
    var seg = 96;
    ctx.lineWidth = 1;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b === sun || b === moon) continue;
      // 정답 궤도를 늘 밝혀 두면 그 고리만 따라가면 돼서 놀이가 안 됩니다 —
      // 한 번 틀린 뒤에만 '이 길 위에 있어' 하고 도와줍니다.
      var hint = (state.act === 'find' && state.hint && state.target === b);
      ctx.strokeStyle = hint ? 'rgba(255,207,92,0.55)' : 'rgba(150,180,255,0.20)';

      ctx.beginPath();
      var started = false;
      for (var k = 0; k <= seg; k++) {
        var a = (k / seg) * Math.PI * 2;
        var p = project(b.orbit * Math.cos(a), 0, b.orbit * Math.sin(a));
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }

  function drawBody(b) {
    var p = b.p, r = b.pr;
    if (b === sun) return drawSun(p, r);

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

    if (d.bands || d.spot) {
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
    var w = worldPos(b);

    for (var r = 0; r < d.ring.length; r++) {
      var band = d.ring[r];
      var mid = (band[0] + band[1]) / 2 * b.R;
      var thick = (band[1] - band[0]) * b.R;
      var seg = 96;
      var pts = [];
      var keep = [];

      for (var i = 0; i <= seg; i++) {
        var a = (i / seg) * Math.PI * 2;
        var p = project(w.x + mid * Math.cos(a), 0, w.z + mid * Math.sin(a));
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

  function drawLabel(b) {
    var p = b.p, r = b.pr;
    if (p.x < -60 || p.x > W + 60 || p.y < -40 || p.y > H + 40) return;

    // 달은 지구에 바짝 붙어 있어서, 떨어져 보일 만큼 커졌을 때만 이름을 붙입니다
    if (b === moon && b.p && earth.p) {
      var gx = b.p.x - earth.p.x, gy = b.p.y - earth.p.y;
      if (Math.sqrt(gx * gx + gy * gy) < 34) return;
    }

    var name = b.data.name;
    if (state.act === 'look' && isSeen(b.data.id)) name = '✓ ' + name;

    ctx.font = '700 ' + (W < 480 ? 11 : 13) + 'px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(name, p.x + 1, p.y + r + 6);
    ctx.fillStyle = (b === sun) ? '#ffd98a' : 'rgba(226,236,255,0.92)';
    ctx.fillText(name, p.x, p.y + r + 5);
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

  function setZoom(z) { view.zoom = clamp(z, 0.55, 4.5); }

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
    return bestGap <= 26 ? best : null;
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

  function buildModeRow() {
    el.modeRow.innerHTML = '';

    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
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

  // 구경하기는 점수가 없고, 들어가 본 행성 수를 보여 줍니다
  function bestText(act) {
    if (act === 'look') {
      return state.seen.length ? '👀 ' + state.seen.length + '/' + bodies.length : '';
    }
    var best = UI.readBest(BEST_KEY + '.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
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

  // '행성 찾기' 는 행성 여덟 개만 냅니다 — 태양은 별이고 달은 위성이니까요
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
    setZoom(Math.min(view.zoom, zoomFor(b.orbit)));
    var useHint = Math.random() < 0.4 && b.data.hint;
    var name = b.data.name;
    var ask = useHint ? b.data.hint + ' 어느 행성일까요?' : josa(name, '을', '를') + ' 찾아 보세요.';

    setLabel((useHint ? b.data.hint : name + ' 찾기') + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
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
      return { text: c, right: i === 0 };
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
