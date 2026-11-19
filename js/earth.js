/* =========================================================================
 * 다니랜드 - 낮과 밤·계절 (earth.html)
 *
 * '왜 계절이 바뀌나' '왜 겨울엔 해가 늦게 뜨나' 를 눈으로 보는 화면입니다. 캔버스 한 장에
 * 그림 셋을 나란히 그립니다 (라이브러리 없음 — 태양계·별의 일생과 같은 규칙).
 *
 *   ① 해 둘레를 도는 지구 (orbit) : 위에서 비스듬히 내려다본 공전 궤도. 지구의 팽이 막대(자전축)가
 *                                    **어디에 있든 같은 쪽으로 기울어 있는 것**이 핵심입니다.
 *   ② 가까이서 본 지구 (globe)    : 해가 왼쪽에 있도록 옆에서 본 지구. 오른쪽 반이 밤입니다.
 *                                    **노란 줄 = 서울이 하루 동안 지나가는 길(북위 37.6도)** 이고,
 *                                    그 줄이 밝은 쪽에 얼마나 걸쳐 있나가 곧 낮의 길이입니다.
 *                                    겨울에는 줄의 많은 부분이 밤 쪽에 있어 해가 늦게 뜹니다.
 *   ③ 우리 동네 하늘 (sky)        : 남쪽을 보고 선 하늘. 해가 지나가는 길(점선)이 여름엔 높고 길고,
 *                                    겨울엔 낮고 짧습니다. 아래 띠가 하루 24시간 중 낮입니다.
 *
 * 숫자는 진짜입니다 — 서울(북위 37.5665, 동경 126.978) 기준으로 날마다 해의 적위와 균시차를 구해
 * (NOAA 의 근사식) 해 뜨는·지는 시각을 우리나라 시각(KST)으로 냅니다. 대기 굴절(0.833도)까지 넣어서
 * 6월 21일 05:11·19:56, 12월 22일 07:43·17:17 로 천문연구원 값과 1분 안으로 맞습니다.
 * 그림의 지구 기울기도 같은 적위를 씁니다 — 그림과 숫자가 어긋나지 않게.
 * 일부러 진짜가 아닌 것: 궤도는 동그라미(진짜는 거의 동그라미 — 1.7% 찌그러짐), 해·지구 크기와 거리.
 *
 * 놀이 3가지
 *   story   : 이야기   - EARTH_STEPS 를 한 걸음씩 (읽고 나면 저절로 다음, 점수 없음)
 *   explore : 돌려 보기 - 지구·하늘을 옆으로 밀면 시각이, 궤도의 지구를 끌면 날짜가 바뀝니다
 *   quiz    : 퀴즈     - 보기 넉 장 (EARTH_QUIZ 에서 10문제)
 *
 * 기록 키는 daniland.best.earth(카드의 ⭐)·daniland.best.earth.quiz,
 * 마지막에 고른 놀이는 daniland.earthAct, 이야기를 끝까지 본 적 있음은 daniland.earth.read 입니다.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var QUIZ_ROUNDS = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '지구 박사!'];

  var BEST_KEY = 'daniland.best.earth';
  var ACT_KEY = 'daniland.earthAct';
  var READ_KEY = 'daniland.earth.read';

  var STEPS = window.EARTH_STEPS || [];

  var RAD = Math.PI / 180;
  var TILT = 23.44 * RAD;          // 자전축 기울기
  var LAT = 37.5665, LON = 126.978; // 서울
  var AUS_LAT = -33.87, AUS_LON = 151.21; // 시드니
  var SOLSTICE = 172;              // 6월 21일 — 궤도 그림에서 지구가 해의 왼쪽에 오는 날
  var YEAR = 365.25;

  var ACTS = [
    { id: 'story',   name: '이야기',    icon: '📖', desc: '자전·공전·계절을 한 걸음씩 보여 줘요' },
    { id: 'explore', name: '돌려 보기', icon: '🌍', desc: '지구를 밀어 시각을, 해 둘레의 지구를 끌어 날짜를 바꿔요' },
    { id: 'quiz',    name: '퀴즈',      icon: '❓', desc: '낮과 밤, 계절에 대해 물어봐요' }
  ];

  var SEASONS = [
    { id: 'spring', name: '봄',   icon: '🌸', day: 80 },
    { id: 'summer', name: '여름', icon: '☀️', day: 172 },
    { id: 'autumn', name: '가을', icon: '🍂', day: 266 },
    { id: 'winter', name: '겨울', icon: '⛄', day: 356 }
  ];

  var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  var el = {
    page: document.querySelector('.earth-page'),
    sky: document.getElementById('sky'),
    canvas: document.getElementById('canvas'),
    hint: document.getElementById('skyHint'),
    steps: document.getElementById('steps'),
    story: document.getElementById('story'),
    photo: document.getElementById('photo'),
    storyTitle: document.getElementById('storyTitle'),
    storyText: document.getElementById('storyText'),
    nextBtn: document.getElementById('nextBtn'),
    ctrl: document.getElementById('ctrl'),
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

  var now = new Date();

  var state = {
    act: UI.loadValue(ACT_KEY) || 'story',
    playing: false,
    day: dayOfYear(now),            // 1 ~ 365 (소수도 됩니다)
    time: now.getHours() + now.getMinutes() / 60,   // 우리나라 시각 (0 ~ 24)
    dayTarget: null,                // 이 날까지 앞으로 돌아갑니다
    spin: 0,                        // 1초에 몇 시간
    year: 0,                        // 1초에 며칠
    aus: false,
    step: 0,
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    deck: [],
    prompt: '',
    read: UI.loadValue(READ_KEY) === '1',
    touched: false
  };

  if (!findAct(state.act)) state.act = 'story';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  function dayOfYear(d) {
    var n = d.getDate();
    for (var m = 0; m < d.getMonth(); m++) n += MONTH_DAYS[m];
    return Math.min(n, 365);
  }

  function wrapDay(d) {
    d = d % 365;
    if (d < 1) d += 365;
    return d;
  }

  function dateOf(day) {
    var n = Math.floor(wrapDay(day));
    for (var m = 0; m < 12; m++) {
      if (n <= MONTH_DAYS[m]) return { month: m + 1, date: n };
      n -= MONTH_DAYS[m];
    }
    return { month: 12, date: 31 };
  }

  // 우리나라에서 부르는 계절 (3~5월 봄, 6~8월 여름, 9~11월 가을, 12~2월 겨울)
  function seasonOf(month) {
    if (month >= 3 && month <= 5) return SEASONS[0];
    if (month >= 6 && month <= 8) return SEASONS[1];
    if (month >= 9 && month <= 11) return SEASONS[2];
    return SEASONS[3];
  }

  /* ---------- 해의 계산 (NOAA 근사식) ---------- */

  // 그날 해의 적위(라디안)와 균시차(분)
  function solar(day) {
    var g = 2 * Math.PI / 365 * (day - 1);
    var eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) -
                        0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) -
              0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) -
              0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    return { dec: dec, eot: eot };
  }

  // 우리나라 시각 → 그 자리의 시간각(라디안, 한낮 = 0, 오후가 +)
  function hourAngle(time, lon, sun) {
    var solarMin = time * 60 + (lon - 135) * 4 + sun.eot;
    return (solarMin - 720) / 4 * RAD;
  }

  // 해 뜨는·지는 시각 (우리나라 시각, 시간 단위). 대기 굴절과 해의 반지름 0.833도를 넣습니다.
  function sunTimes(day) {
    var sun = solar(day), p = LAT * RAD;
    var c = Math.cos(90.833 * RAD) / (Math.cos(p) * Math.cos(sun.dec)) - Math.tan(p) * Math.tan(sun.dec);
    c = Math.max(-1, Math.min(1, c));
    var ha = Math.acos(c) / RAD;
    var off = (LON - 135) * 4;
    return {
      rise: (720 - 4 * ha - off - sun.eot) / 60,
      set: (720 + 4 * ha - off - sun.eot) / 60,
      noonAlt: 90 - LAT + sun.dec / RAD
    };
  }

  // 그 자리에서 본 해의 높이·방위 (도). 방위는 북쪽 0, 동쪽 90, 남쪽 180.
  function sunPos(H, dec, lat) {
    var p = lat * RAD;
    var alt = Math.asin(Math.sin(p) * Math.sin(dec) + Math.cos(p) * Math.cos(dec) * Math.cos(H));
    var az = Math.atan2(-Math.cos(dec) * Math.sin(H),
                        Math.sin(dec) * Math.cos(p) - Math.cos(dec) * Math.cos(H) * Math.sin(p));
    az = az / RAD;
    if (az < 0) az += 360;
    return { alt: alt / RAD, az: az };
  }

  function clockText(t) {
    t = ((t % 24) + 24) % 24;
    var h = Math.floor(t), m = Math.floor((t - h) * 60 + 0.5);
    if (m === 60) { h += 1; m = 0; }
    h = h % 24;
    var ampm = (h < 12) ? '오전' : '오후';
    var hh = h % 12; if (hh === 0) hh = 12;
    return ampm + ' ' + hh + '시' + (m ? ' ' + m + '분' : '');
  }

  function shortClock(t) {
    var h = Math.floor(t), m = Math.floor((t - h) * 60 + 0.5);
    if (m === 60) { h += 1; m = 0; }
    return h + ':' + (m < 10 ? '0' : '') + m;
  }

  function lengthText(hours) {
    var h = Math.floor(hours), m = Math.round((hours - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    return h + '시간' + (m ? ' ' + m + '분' : '');
  }

  // 공전 궤도 위의 각 (6월 21일에 해의 왼쪽 = π, 시계 반대로 돕니다)
  function orbitAngle(day) {
    return Math.PI + 2 * Math.PI * (day - SOLSTICE) / YEAR;
  }

  /* ---------- 캔버스 ---------- */

  var W = 0, H = 0, dpr = 1;
  var rects = {};

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
    layout();
  }

  // 그림 셋의 자리. 가로가 넉넉하면 왼쪽에 궤도·하늘, 오른쪽에 큰 지구.
  // 세로 화면이면 위에 궤도·하늘을 나란히, 아래에 큰 지구. 퀴즈(하늘이 낮음)에서는 하늘을 뺍니다.
  function layout() {
    var g = 8;
    rects = {};
    if (state.act === 'quiz' && state.playing) {
      var hw = (W - g) / 2;
      rects.orbit = { x: 0, y: 0, w: hw, h: H };
      rects.globe = { x: hw + g, y: 0, w: hw, h: H };
      return;
    }
    if (W >= H * 1.25) {
      var lw = Math.round(W * 0.4), hh = (H - g) / 2;
      rects.orbit = { x: 0, y: 0, w: lw, h: hh };
      rects.sky = { x: 0, y: hh + g, w: lw, h: hh };
      rects.globe = { x: lw + g, y: 0, w: W - lw - g, h: H };
    } else {
      var th = Math.round(H * 0.42), hw2 = (W - g) / 2;
      rects.orbit = { x: 0, y: 0, w: hw2, h: th };
      rects.sky = { x: hw2 + g, y: 0, w: hw2, h: th };
      rects.globe = { x: 0, y: th + g, w: W, h: H - th - g };
    }
  }

  var bgStars = (function () {
    var out = [];
    for (var i = 0; i < 140; i++) {
      out.push({ x: Math.random(), y: Math.random(), a: 0.15 + Math.random() * 0.6,
                 s: (Math.random() < 0.1) ? 2 : 1, tw: Math.random() * 6 });
    }
    return out;
  })();

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);   // 맨 앞에서 예약합니다 — 한 장 그리다 탈이 나도 멈추지 않게
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    advance(dt);
    draw();
    if (state.act === 'explore' && state.playing) updateExploreLabel();
  }

  function advance(dt) {
    if (state.dayTarget !== null) {
      // 앞으로만 돕니다 — 지구는 거꾸로 공전하지 않으니까요
      var left = state.dayTarget - state.day;
      while (left < 0) left += 365;
      var step = Math.max(40, left * 2.2) * dt;
      if (step >= left) { state.day = state.dayTarget; state.dayTarget = null; }
      else state.day = wrapDay(state.day + step);
    } else if (state.year) {
      state.day = wrapDay(state.day + state.year * dt);
    }
    if (state.spin) state.time = (state.time + state.spin * dt) % 24;
  }

  function draw() {
    if (!W) return;
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < bgStars.length; i++) {
      var s = bgStars[i];
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(clock * 1.5 + s.tw));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    var sun = solar(state.day);
    if (rects.orbit) drawOrbit(rects.orbit);
    if (rects.globe) drawGlobe(rects.globe, sun);
    if (rects.sky) drawSky(rects.sky, sun);
  }

  function panel(r, title) {
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    roundRect(r.x, r.y, r.w, r.h, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#9fabd4';
    ctx.font = '700 ' + (r.w < 220 ? 11 : 13) + 'px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 10, r.y + 9);
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

  /* ---------- ① 해 둘레를 도는 지구 ----------
   * 공전면의 X(오른쪽)·Y(안쪽)·Z(위) 를 비스듬히 내려다봅니다. 자전축은 늘 (sin23.4°, 0, cos23.4°) —
   * 화면에서 언제나 오른쪽으로 기운 막대입니다. 6월엔 지구가 해의 왼쪽이라 막대 윗끝이 해를 향하고,
   * 12월엔 해의 오른쪽이라 윗끝이 해에서 멀어집니다. */

  var FLAT = 0.42;     // 궤도면이 납작해 보이는 정도

  function orbitGeom(r) {
    var top = 26;
    var s = Math.min(r.w * 0.34, (r.h - top) * 0.62);
    return { cx: r.x + r.w / 2, cy: r.y + top + (r.h - top) / 2 + 4, s: s };
  }

  function drawOrbit(r) {
    panel(r, '☀️ 해 둘레를 도는 지구');
    var g = orbitGeom(r);
    var th = orbitAngle(state.day);
    var ex = g.cx + Math.cos(th) * g.s;
    var ey = g.cy - Math.sin(th) * g.s * FLAT;
    var er = Math.max(7, g.s * 0.11);
    var sr = Math.max(10, g.s * 0.17);

    // 궤도
    ctx.strokeStyle = 'rgba(160,180,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy, g.s, g.s * FLAT, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 계절 자리 (우리나라 기준)
    var fs = r.w < 220 ? 10 : 12;
    ctx.font = '700 ' + fs + 'px "Nanum Gothic", sans-serif';
    ctx.textBaseline = 'middle';
    var marks = [
      { a: Math.PI, t: '☀️ 6월', dx: -1 },
      { a: 0, t: '⛄ 12월', dx: 1 },
      { a: Math.PI / 2, t: '🌸 3월', dy: -1 },
      { a: Math.PI * 1.5, t: '🍂 9월', dy: 1 }
    ];
    marks.forEach(function (m) {
      var mx = g.cx + Math.cos(m.a) * g.s, my = g.cy - Math.sin(m.a) * g.s * FLAT;
      ctx.fillStyle = 'rgba(200,210,255,0.55)';
      ctx.beginPath();
      ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8f9cc8';
      if (m.dx) {
        ctx.textAlign = 'center';
        ctx.fillText(m.t, mx, my + er + 16);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(m.t, mx, my + m.dy * (er + 14));
      }
    });

    var behind = Math.sin(th) > 0;    // 지구가 해 뒤쪽(안쪽)에 있나
    if (!behind) drawSunBall(g.cx, g.cy, sr);
    drawSmallEarth(ex, ey, er, g.cx - ex, (g.cy - ey));
    if (behind) drawSunBall(g.cx, g.cy, sr);
  }

  function drawSunBall(x, y, r) {
    var glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6);
    glow.addColorStop(0, 'rgba(255,200,80,0.45)');
    glow.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#fffbe0');
    g.addColorStop(0.5, '#ffd34d');
    g.addColorStop(1, '#ff9d2e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 작은 지구 — 해 쪽 반만 밝고, 오른쪽으로 기운 막대가 꽂혀 있습니다 (귤에 꽂은 이쑤시개처럼)
  function drawSmallEarth(x, y, r, toSunX, toSunY) {
    var ang = Math.atan2(toSunY, toSunX);
    ctx.fillStyle = '#16264f';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#4b9cf0';
    ctx.beginPath();
    ctx.arc(x, y, r, ang - Math.PI / 2, ang + Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 막대 — 늘 같은 쪽으로
    var ax = Math.sin(TILT), ay = -Math.cos(TILT);
    var len = r * 1.9;
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - ax * len, y - ay * len);
    ctx.lineTo(x + ax * len, y + ay * len);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '700 ' + Math.max(9, Math.round(r * 0.9)) + 'px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('⭐', x + ax * (len + 6), y + ay * (len + 4));
  }

  /* ---------- ② 가까이서 본 지구 ----------
   * 해가 오른쪽에 오도록 옆에서 본 지구입니다. 좌표는 (s: 해 쪽, v, z: 공전면 위쪽)의 오른손 좌표이고,
   * 보는 사람은 -v 쪽에 있습니다 — 화면에는 x = s(해가 오른쪽), y = z 로 찍고 v < 0 인 점이 앞면입니다.
   * 이쪽에서 봐야 **아침이 앞면**이라, 우리나라가 깜깜한 왼쪽에서 밝은 오른쪽으로 나오는 '해 뜨는 순간' 이 보입니다
   * (반대쪽에서 보면 해 뜨는 곳이 지구 뒤로 숨습니다). 빛이 정확히 오른쪽에서 오므로 낮과 밤의 경계는 가운데 세로줄입니다.
   *
   * 자전축 a 의 해 쪽 성분은 sin(적위)이고 위쪽 성분은 cos(23.44°)로 늘 같습니다. 나머지(보는 쪽 성분)는
   * 공전 자리에 따라 앞이나 뒤로 — 봄·가을엔 막대가 앞이나 뒤로 기울고 여름·겨울엔 해 쪽·반대쪽으로 기웁니다.
   * 여름에 막대 윗끝이 오른쪽(해 쪽)으로 기우는 것이 궤도 그림(6월 지구가 해의 왼쪽)과 같은 모습입니다. */

  function globeFrame(sun) {
    var sd = Math.sin(sun.dec);
    var th = orbitAngle(state.day);
    var w = Math.sqrt(Math.max(0, 1 - sd * sd - Math.cos(TILT) * Math.cos(TILT)));
    if (Math.sin(th) < 0) w = -w;
    var a = { s: sd, v: w, z: Math.cos(TILT) };
    // e1: 한낮 쪽 (해 방향에서 축 성분을 뺀 것), e2: 저녁 쪽 (a × e1)
    var e1 = { s: 1 - sd * a.s, v: -sd * a.v, z: -sd * a.z };
    var n = Math.sqrt(e1.s * e1.s + e1.v * e1.v + e1.z * e1.z) || 1;
    e1 = { s: e1.s / n, v: e1.v / n, z: e1.z / n };
    var e2 = {
      s: a.v * e1.z - a.z * e1.v,
      v: a.z * e1.s - a.s * e1.z,
      z: a.s * e1.v - a.v * e1.s
    };
    return { a: a, e1: e1, e2: e2 };
  }

  // 위도 lat(도), 시간각 h(라디안)인 땅 위의 점
  function surf(f, lat, h) {
    var p = lat * RAD, c = Math.cos(p), sp = Math.sin(p);
    var ch = Math.cos(h), sh = Math.sin(h);
    return {
      s: c * (ch * f.e1.s + sh * f.e2.s) + sp * f.a.s,
      v: c * (ch * f.e1.v + sh * f.e2.v) + sp * f.a.v,
      z: c * (ch * f.e1.z + sh * f.e2.z) + sp * f.a.z
    };
  }

  function drawGlobe(r, sun) {
    panel(r, '🌍 가까이서 본 지구');
    var f = globeFrame(sun);
    var R = Math.min(r.w * 0.30, (r.h - 64) * 0.40);
    var cx = r.x + r.w / 2 - R * 0.12, cy = r.y + r.h / 2 + 10;
    var P = function (p) { return { x: cx + p.s * R, y: cy - p.z * R }; };

    // 햇빛 — 오른쪽에서 오는 줄
    ctx.strokeStyle = 'rgba(255,214,110,0.28)';
    ctx.lineWidth = 2;
    for (var k = -2; k <= 2; k++) {
      var ly = cy + k * R * 0.42;
      var lx0 = r.x + r.w - 12, lx1 = cx + Math.sqrt(Math.max(0, R * R - (ly - cy) * (ly - cy))) + 6;
      if (lx0 - lx1 < 20) continue;
      ctx.beginPath();
      ctx.moveTo(lx0, ly);
      ctx.lineTo(lx1, ly);
      ctx.lineTo(lx1 + 7, ly - 4);
      ctx.moveTo(lx1, ly);
      ctx.lineTo(lx1 + 7, ly + 4);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd56b';
    ctx.font = '700 12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('햇빛 ☀️', r.x + r.w - 12, cy - R * 0.84 - 6);

    // 자전축 — 뒤로 간 끝은 지구에 가려집니다
    drawAxis(f, P, R, cx, cy, false);

    // 바다
    var g = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.35, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#6cc0ff');
    g.addColorStop(0.6, '#2f7fd6');
    g.addColorStop(1, '#174a8f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 위도·경도 줄 — 자전하는 것이 보이게
    ctx.lineWidth = 1;
    var lats = [-60, -30, 0, 30, 60];
    lats.forEach(function (lat) {
      ctx.strokeStyle = lat === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.16)';
      strokeCurve(function (u) { return surf(f, lat, u * Math.PI * 2); }, P, true);
    });
    var base = hourAngle(state.time, LON, sun);
    for (var lo = 0; lo < 360; lo += 30) {
      (function (lo) {
        ctx.strokeStyle = 'rgba(255,255,255,0.13)';
        strokeCurve(function (u) { return surf(f, -90 + u * 180, base + lo * RAD); }, P, true);
      })(lo);
    }

    // 밤 — 왼쪽 반
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    var night = ctx.createLinearGradient(cx + R * 0.05, 0, cx - R * 0.1, 0);
    night.addColorStop(0, 'rgba(3,6,22,0)');
    night.addColorStop(1, 'rgba(3,6,22,0.74)');
    ctx.fillStyle = night;
    ctx.fillRect(cx - R * 1.05, cy - R, R * 1.1, R * 2);
    ctx.restore();

    // 우리나라가 하루 동안 지나가는 길 — 밝은 쪽은 노랑, 깜깜한 쪽은 파랑. 뒤쪽은 비쳐 보이게 흐리게.
    drawDayPath(f, P, LAT, 3);
    if (state.aus) drawDayPath(f, P, AUS_LAT, 2);

    // 앞으로 나온 막대 끝
    drawAxis(f, P, R, cx, cy, true);

    // 낮·밤 글씨와 시각
    ctx.font = '700 13px "Nanum Gothic", sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    // 지구 안쪽 아래에 적습니다 — 바깥에 두면 자전축 끝과 부딪칩니다 (지구가 작으면 안 적습니다)
    if (R >= 70) ctx.fillStyle = 'rgba(190,205,255,0.85)';
    if (R >= 70) {
      ctx.fillText('🌙 밤', cx - R * 0.5, cy + R * 0.5);
      ctx.fillStyle = '#fff1b8';
      ctx.fillText('낮 ☀️', cx + R * 0.5, cy + R * 0.5);
    }

    // 핀
    drawPin(f, P, LAT, hourAngle(state.time, LON, sun), '우리나라');
    if (state.aus) drawPin(f, P, AUS_LAT, hourAngle(state.time, AUS_LON, sun), '호주');

    ctx.fillStyle = '#e8edff';
    ctx.font = '700 ' + (r.w < 320 ? 13 : 15) + 'px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    // 좁으면 제목과 부딪쳐서 한 줄 아래로 내립니다
    ctx.fillText('🕒 ' + clockText(state.time), r.x + r.w - 10, r.y + (r.w < 360 ? 26 : 8));
  }

  function drawAxis(f, P, R, cx, cy, front) {
    var n = 40;
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (var end = -1; end <= 1; end += 2) {
      for (var i = 0; i < n; i++) {
        var t0 = 1 + 0.32 * i / n, t1 = 1 + 0.32 * (i + 1) / n;
        var p0 = { s: f.a.s * t0 * end, v: f.a.v * t0 * end, z: f.a.z * t0 * end };
        var p1 = { s: f.a.s * t1 * end, v: f.a.v * t1 * end, z: f.a.z * t1 * end };
        var q0 = P(p0), q1 = P(p1);
        // 지구 뒤에 있고 화면에서 지구와 겹치면 가려집니다
        var hidden = p0.v > 0 && Math.hypot(q0.x - cx, q0.y - cy) < R;
        var isFront = p0.v <= 0;
        if (front !== isFront) continue;
        if (hidden) continue;
        ctx.beginPath();
        ctx.moveTo(q0.x, q0.y);
        ctx.lineTo(q1.x, q1.y);
        ctx.stroke();
      }
      if (end === 1) {
        var tip = P({ s: f.a.s * 1.4, v: f.a.v * 1.4, z: f.a.z * 1.4 });
        var tipHidden = f.a.v > 0 && Math.hypot(tip.x - cx, tip.y - cy) < R;
        if (front === (f.a.v <= 0) && !tipHidden) {
          ctx.fillStyle = '#ffe9a8';
          ctx.font = '700 12px "Nanum Gothic", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('북극', tip.x, tip.y);
        }
      }
    }
    ctx.lineCap = 'butt';
  }

  // 곡선을 앞쪽만(frontOnly) 또는 전부 그립니다
  function strokeCurve(fn, P, frontOnly) {
    var n = 72, open = false;
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var p = fn(i / n);
      var q = P(p);
      if (frontOnly && p.v > 0) { open = false; continue; }
      if (!open) { ctx.moveTo(q.x, q.y); open = true; }
      else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
  }

  function drawDayPath(f, P, lat, width) {
    var n = 120;
    for (var i = 0; i < n; i++) {
      var h0 = i / n * Math.PI * 2, h1 = (i + 1) / n * Math.PI * 2;
      var p0 = surf(f, lat, h0), p1 = surf(f, lat, h1);
      var lit = (p0.s + p1.s) > 0;
      var front = (p0.v + p1.v) < 0;
      var q0 = P(p0), q1 = P(p1);
      ctx.strokeStyle = lit ? (front ? '#ffd23f' : 'rgba(255,210,63,0.30)')
                            : (front ? '#7f9cff' : 'rgba(127,156,255,0.28)');
      ctx.lineWidth = front ? width : Math.max(1, width - 1.5);
      ctx.setLineDash(front ? [] : [3, 4]);
      ctx.beginPath();
      ctx.moveTo(q0.x, q0.y);
      ctx.lineTo(q1.x, q1.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawPin(f, P, lat, h, name) {
    var p = surf(f, lat, h);
    var q = P(p);
    var front = p.v <= 0;
    var lit = p.s > 0;
    ctx.globalAlpha = front ? 1 : 0.45;
    ctx.fillStyle = '#ff5d7a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    var label = name + ' ' + (lit ? '☀️' : '🌙') + (front ? '' : ' (뒤쪽)');
    ctx.font = '800 13px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var tw = ctx.measureText(label).width;
    var lx = q.x - 11 - tw, ly = q.y - 14;     // 해가 오른쪽이라 이름표는 왼쪽에 — 햇빛 줄을 안 가립니다
    ctx.fillStyle = 'rgba(4,6,16,0.7)';
    roundRect(lx - 5, ly - 10, tw + 10, 20, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, lx, ly);
    ctx.globalAlpha = 1;
  }

  /* ---------- ③ 우리 동네 하늘 ----------
   * 남쪽을 보고 섰을 때의 하늘입니다 — 왼쪽이 동쪽, 오른쪽이 서쪽. 가로는 방위, 세로는 해의 높이(도). */

  function drawSky(r, sun) {
    var top = r.y + 26, pad = 12;
    var hy = r.y + r.h * 0.66;              // 땅의 높이
    var H0 = hourAngle(state.time, LON, sun);
    var pos = sunPos(H0, sun.dec, LAT);
    var alt = pos.alt;

    // 하늘 색 — 해의 높이에 따라 낮·노을·밤
    var dayT = clamp((alt + 6) / 12, 0, 1);
    var dusk = clamp(1 - Math.abs(alt) / 8, 0, 1);
    var topC = mixRGB([11, 18, 48], [61, 142, 224], dayT);
    var botC = mixRGB([28, 37, 80], [168, 216, 255], dayT);
    botC = mixRGB(botC, [246, 162, 90], dusk * 0.7);
    ctx.save();
    roundRect(r.x, r.y, r.w, r.h, 16);
    ctx.clip();
    var sg = ctx.createLinearGradient(0, r.y, 0, hy);
    sg.addColorStop(0, rgb(topC));
    sg.addColorStop(1, rgb(botC));
    ctx.fillStyle = sg;
    ctx.fillRect(r.x, r.y, r.w, hy - r.y);

    if (dayT < 0.5) {
      ctx.fillStyle = '#ffffff';
      for (var i = 0; i < 30; i++) {
        var st = bgStars[i];
        ctx.globalAlpha = (0.5 - dayT) * 2 * st.a;
        ctx.fillRect(r.x + st.x * r.w, r.y + st.y * (hy - r.y), 1.5, 1.5);
      }
      ctx.globalAlpha = 1;
    }

    var X = function (az) { return r.x + pad + (az - 40) / 280 * (r.w - pad * 2); };
    var Y = function (a) { return hy - a / 90 * (hy - top - 8); };

    // 해가 지나가는 길 (점선)
    var cosH = -Math.tan(LAT * RAD) * Math.tan(sun.dec);
    var hMax = Math.acos(clamp(cosH, -1, 1));
    ctx.strokeStyle = 'rgba(255,230,140,0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (var k = 0; k <= 60; k++) {
      var hh = -hMax + 2 * hMax * k / 60;
      var sp = sunPos(hh, sun.dec, LAT);
      var px = X(sp.az), py = Y(Math.max(0, sp.alt));
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 해
    if (alt > -1.5) {
      var sx = X(pos.az), sy = Y(alt);
      var gl = ctx.createRadialGradient(sx, sy, 2, sx, sy, 26);
      gl.addColorStop(0, 'rgba(255,220,120,0.7)');
      gl.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(sx, sy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 땅
    ctx.fillStyle = mix('#173a22', '#3f8a4c', dayT);
    ctx.fillRect(r.x, hy, r.w, r.y + r.h - hy);
    ctx.font = Math.round(Math.min(26, r.h * 0.13)) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🏠', r.x + r.w * 0.5, hy + 4);
    ctx.fillText('🌳', r.x + r.w * 0.66, hy + 3);

    ctx.font = '700 11px "Nanum Gothic", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    ctx.fillText('동', X(90), hy + 3);
    ctx.fillText('남', X(180), hy + 3);
    ctx.fillText('서', X(270), hy + 3);

    // 하루 24시간 띠 — 노란 곳이 낮
    var times = sunTimes(state.day);
    var bx = r.x + pad, bw = r.w - pad * 2, by = r.y + r.h - 22, bh = 9;
    ctx.fillStyle = '#1b2350';
    roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(bx + bw * times.rise / 24, by, bw * (times.set - times.rise) / 24, bh);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + bw * (state.time / 24) - 1.5, by - 3, 3, bh + 6);
    ctx.restore();

    panel(r, '🏠 우리 동네 하늘');

    // 해 뜨고 지는 시각
    ctx.font = '800 ' + (r.w < 220 ? 11 : 13) + 'px "Nanum Gothic", sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🌅 ' + shortClock(times.rise), bx, by - 4);
    ctx.textAlign = 'right';
    ctx.fillText(shortClock(times.set) + ' 🌇', bx + bw, by - 4);
    // 좁으면 해 뜨고 지는 시각과 부딪쳐서, 낮의 길이를 제목 오른쪽으로 올립니다
    ctx.fillStyle = '#ffe08a';
    if (r.w < 300) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('낮 ' + lengthText(times.set - times.rise), r.x + r.w - 10, r.y + 28);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText('낮 ' + lengthText(times.set - times.rise), bx + bw / 2, by - 4);
    }
  }

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function mixRGB(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function mix(a, b, t) {
    var x = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    var y = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    return rgb(mixRGB(x, y, t));
  }

  /* ---------- 끌기 (돌려 보기에서만) ---------- */

  var drag = null;

  function inRect(r, x, y) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

  el.canvas.addEventListener('pointerdown', function (e) {
    if (state.act !== 'explore' || !state.playing) return;
    var b = el.canvas.getBoundingClientRect();
    var x = e.clientX - b.left, y = e.clientY - b.top;
    var which = inRect(rects.orbit, x, y) ? 'orbit' : (inRect(rects.sky, x, y) ? 'sky' : (inRect(rects.globe, x, y) ? 'globe' : null));
    if (!which) return;
    drag = { which: which, x: x, time: state.time };
    stopAuto();
    if (!state.touched) { state.touched = true; el.hint.hidden = true; }
    try { el.canvas.setPointerCapture(e.pointerId); } catch (err) {}
    moveDrag(x, y);
  });

  el.canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var b = el.canvas.getBoundingClientRect();
    moveDrag(e.clientX - b.left, e.clientY - b.top);
  });

  function endDrag() { drag = null; }
  el.canvas.addEventListener('pointerup', endDrag);
  el.canvas.addEventListener('pointercancel', endDrag);

  function moveDrag(x, y) {
    if (drag.which === 'orbit') {
      var g = orbitGeom(rects.orbit);
      var th = Math.atan2(-(y - g.cy) / FLAT, x - g.cx);
      var d = SOLSTICE + (th - Math.PI) / (2 * Math.PI) * YEAR;
      state.day = wrapDay(d);
      state.dayTarget = null;
    } else {
      // 오른쪽으로 밀면 시간이 흐릅니다 (지구 앞면은 왼쪽→오른쪽으로 돌고, 해는 동→서로 갑니다)
      var span = (drag.which === 'globe') ? Math.min(rects.globe.w, rects.globe.h) * 0.9 : rects.sky.w;
      var t = drag.time + (x - drag.x) / span * 12;
      state.time = ((t % 24) + 24) % 24;
    }
    updateExploreLabel();
  }

  /* ---------- 📖 이야기 ---------- */

  function startStory() {
    el.story.hidden = false;
    el.steps.hidden = false;
    el.ctrl.hidden = true;
    el.cards.hidden = true;
    el.hint.hidden = true;
    buildSteps();
    showStep(0);
  }

  function buildSteps() {
    el.steps.innerHTML = '';
    STEPS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'step-chip';
      b.innerHTML = '<span class="sc-art">' + s.emoji + '</span><span class="sc-name">' + s.name + '</span>';
      b.addEventListener('click', function () { if (window.SFX) SFX.tap(); showStep(i); });
      el.steps.appendChild(b);
    });
  }

  function showStep(i) {
    state.step = i;
    var s = STEPS[i];
    var lastStep = (i === STEPS.length - 1);

    state.dayTarget = (Math.abs(s.day - state.day) < 0.5) ? null : s.day;
    if (s.year) state.dayTarget = null;
    state.time = s.time;
    state.spin = s.spin || 0;
    state.year = s.year || 0;
    state.aus = !!s.aus;

    Array.prototype.forEach.call(el.steps.children, function (c, k) {
      c.classList.toggle('on', k === i);
      c.classList.toggle('done', k < i);
    });

    el.photo.innerHTML = '<div class="star-emoji">' + s.emoji + '</div>';
    el.storyTitle.textContent = s.title;
    el.storyText.textContent = s.text;
    el.nextBtn.textContent = lastStep ? '끝 🎉' : '다음 ▶';
    el.bar.style.width = Math.round(((i + 1) / STEPS.length) * 100) + '%';
    el.score.textContent = '📖 ' + (i + 1) + '/' + STEPS.length;
    setLabel(s.emoji + ' ' + s.name + ' (' + (i + 1) + '/' + STEPS.length + ')');

    state.prompt = s.title + '. ' + s.text;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);

    // 다 읽으면 저절로 다음 — 목소리가 없는 기기에서도 글자 수만큼은 머뭅니다 (별의 일생과 같은 규칙)
    var startedAt = Date.now();
    var dwell = 3000 + state.prompt.length * 45;
    speak(state.prompt, function () {
      if (state.act !== 'story' || state.step !== i || !state.playing) return;
      var wait = Math.max(1600, dwell - (Date.now() - startedAt));
      setTimeout(function () {
        if (state.act !== 'story' || state.step !== i || !state.playing) return;
        if (lastStep) finishStory(); else showStep(i + 1);
      }, wait);
    });
  }

  el.nextBtn.addEventListener('click', function () {
    if (state.act !== 'story') return;
    if (window.SFX) SFX.tap();
    if (state.step >= STEPS.length - 1) return finishStory();
    showStep(state.step + 1);
  });

  function finishStory() {
    state.playing = false;
    state.read = true;
    UI.saveValue(READ_KEY, '1');
    if (window.SFX) SFX.finish();
    if (window.TTS) TTS.cancel();
    el.endTitle.textContent = '🌍 끝까지 다 봤어요!';
    el.endStars.textContent = STEPS.map(function (s) { return s.emoji; }).join(' ');
    el.endText.textContent = '이제 「돌려 보기」에서 지구를 직접 돌려 보세요. 오늘 우리 동네는 해가 몇 시에 뜰까요?';
    el.endOverlay.hidden = false;
  }

  /* ---------- 🌍 돌려 보기 ---------- */

  function startExplore() {
    el.story.hidden = true;
    el.steps.hidden = true;
    el.cards.hidden = true;
    el.ctrl.hidden = false;
    el.hint.hidden = state.touched;
    var today = new Date();
    state.day = dayOfYear(today);
    state.time = today.getHours() + today.getMinutes() / 60;
    state.dayTarget = null;
    state.spin = 0;
    state.year = 0;
    state.aus = false;
    el.bar.style.width = '0%';
    el.score.textContent = '🌍';
    buildCtrl();
    updateExploreLabel();
    state.prompt = '오늘 우리 동네는 ' + clockText(sunTimes(state.day).rise) + '에 해가 떴어요. 지구를 옆으로 밀어서 시간을 바꾸고, 해 둘레의 지구를 끌어서 계절을 바꿔 보세요.';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function buildCtrl() {
    el.ctrl.innerHTML = '';
    SEASONS.forEach(function (s) {
      addCtrl(s.icon + ' ' + s.name, function () {
        stopAuto();
        state.dayTarget = s.day;
        var t = sunTimes(s.day);
        var d = dateOf(s.day);
        state.prompt = d.month + '월 ' + d.date + '일, ' + s.name + '이에요. 해는 ' + clockText(t.rise) +
                       '에 뜨고 ' + clockText(t.set) + '에 져요. 낮이 ' + lengthText(t.set - t.rise) + '이에요.';
        speak(state.prompt);
      });
    });
    addCtrl('📍 오늘', function () {
      stopAuto();
      var today = new Date();
      state.dayTarget = dayOfYear(today);
      state.time = today.getHours() + today.getMinutes() / 60;
    });
    addCtrl('⏩ 하루 흐르기', function (b) {
      var on = !state.spin;
      stopAuto();
      if (on) { state.spin = 2; b.classList.add('on'); }
    }, 'spin');
    addCtrl('🔄 1년 돌기', function (b) {
      var on = !state.year;
      stopAuto();
      if (on) { state.year = 30; b.classList.add('on'); }
    }, 'year');
  }

  function addCtrl(text, fn, id) {
    var b = document.createElement('button');
    b.className = 'chip';
    if (id) b.setAttribute('data-auto', id);
    b.textContent = text;
    b.addEventListener('click', function () {
      if (window.SFX) SFX.tap();
      fn(b);
      updateExploreLabel();
    });
    el.ctrl.appendChild(b);
  }

  function stopAuto() {
    state.spin = 0;
    state.year = 0;
    Array.prototype.forEach.call(el.ctrl.querySelectorAll('[data-auto]'), function (b) {
      b.classList.remove('on');
    });
  }

  var lastLabel = '';
  function updateExploreLabel() {
    if (state.act !== 'explore') return;
    var d = dateOf(state.day);
    var s = seasonOf(d.month);
    var text = s.icon + ' ' + d.month + '월 ' + d.date + '일 · ' + clockText(state.time);
    if (text !== lastLabel) { lastLabel = text; setLabel(text); }
  }

  /* ---------- ❓ 퀴즈 ---------- */

  function askQuiz(q) {
    el.cards.className = 'cards star-cards ans-cards';
    el.cards.innerHTML = '';
    var options = q.choices.map(function (c, i) { return { text: c, right: (i === 0) }; });
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

  function nextRound() {
    if (state.round >= state.deck.length) return finishQuiz();
    state.firstTry = true;
    state.locked = false;
    askQuiz(state.deck[state.round]);
  }

  function finishQuiz() {
    state.locked = true;
    state.playing = false;
    el.bar.style.width = '100%';
    var total = state.deck.length;
    UI.saveBest(BEST_KEY + '.quiz', state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);
    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
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
    el.sky.classList.toggle('small-sky', state.act === 'quiz');
    fit();

    if (state.act === 'story') return startStory();
    if (state.act === 'explore') return startExplore();

    el.story.hidden = true;
    el.steps.hidden = true;
    el.ctrl.hidden = true;
    el.hint.hidden = true;
    el.cards.hidden = false;
    // 퀴즈 동안 위 그림은 천천히 1년을 돕니다
    state.dayTarget = null;
    state.year = 20;
    state.spin = 1;
    state.time = 6;
    state.aus = false;
    el.score.textContent = '⭐ 0';
    state.deck = UI.shuffle((window.EARTH_QUIZ || []).slice()).slice(0, QUIZ_ROUNDS);
    nextRound();
  }

  function setLabel(text) { el.label.textContent = text; }

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
        Array.prototype.forEach.call(el.modeRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
        showAct();
      });
      el.modeRow.appendChild(b);
    });
    showAct();
  }

  function bestText(act) {
    if (act === 'story') return state.read ? '📖 다 봤어요' : '';
    if (act === 'quiz') {
      var best = UI.readBest(BEST_KEY + '.quiz');
      return best ? ('⭐ ' + best.stars + '/' + best.total) : '';
    }
    return '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
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

  el.endModes.addEventListener('click', function () {
    if (window.TTS) TTS.cancel();
    el.endOverlay.hidden = true;
    state.playing = false;
    buildModeRow();
    el.startOverlay.hidden = false;
  });

  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '지구는 하루에 한 바퀴 돌아요.'; } });
  });

  var back = Catalog.backHref('earth.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  /* ---------- 소리 ---------- */

  // 새 말이 시작되면 먼저 하던 말의 then 은 부르지 않습니다 (태양계·별의 일생과 같은 규칙)
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
  // 이야기 판·단추 줄이 나타나고 사라지면 캔버스 칸의 높이가 바뀝니다 — 그때도 다시 맞춥니다
  if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(el.sky);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  buildModeRow();
  fit();
  state.spin = 0.6;      // 시작 화면 뒤에서 천천히 돕니다
  setLabel('지구는 돌고, 해 둘레도 돌아요');
  requestAnimationFrame(frame);
})();
