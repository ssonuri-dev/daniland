/* =========================================================================
 * 다니랜드 - 별자리 (constellation.html)
 *
 * 별을 차례로 눌러 이으면 별자리 그림이 나타나고, 오늘 밤 서울 하늘에 어느 별자리가 떠 있는지 보는 화면입니다 (2026-11-22).
 * 우주 과목의 다른 화면처럼 글은 이름표·한두 문장, 캔버스 한 장(라이브러리 없음)입니다.
 *
 * 놀이 3가지
 *   draw  : 별 잇기     - 반짝이는 다음 별을 눌러 이어요. 다 이으면 그림(이모지)이 나타나고 이야기 한 줄
 *   tonight : 오늘 밤 하늘 - 서울에서 올려다본 오늘 밤 하늘(저녁 8시·밤 11시·새벽 4시). 떠 있는 별자리만 보이고 누르면 이름
 *   quiz  : 퀴즈        - 별 모양만 보고 이름 맞히기 + 별자리 이야기 (여덟 문제)
 *
 * 진짜인 것
 *   - 별의 자리(적경·적위, J2000)와 밝기(등급)는 진짜 값입니다 (`SKY[].stars`). 별 잇기는 별자리 가운데에서 본 그대로
 *     (심사 도법, 동쪽이 왼쪽 — 하늘을 올려다본 모습) 그립니다.
 *   - 오늘 밤 하늘은 서울(북위 37.57°, 동경 126.98°)에서 그 시각의 진짜 높이·방위를 계산합니다(`altAz()`, 항성시).
 *     세차(별자리가 아주 천천히 밀리는 것)는 넣지 않았습니다 — 2000년 값과 지금의 차이는 그림에서 안 보입니다.
 *   - 별자리 별들은 실제로는 거리가 제각각이라는 것을 퀴즈에서 말합니다 (가까이 붙어 있는 게 아님).
 * 진짜가 아닌 것
 *   - 별 크기는 밝기를 보기 좋게 키운 것이고, 그림(이모지)은 별자리 이름을 떠올리게 하는 표시일 뿐입니다.
 *   - 북두칠성은 큰곰자리의 일부(꼬리와 엉덩이)인데, 아이에게 익숙한 이름이라 그대로 한 장으로 씁니다 (이야기에서 그렇게 말함).
 *
 * 기록 키는 daniland.best.sky(카드의 ⭐)·daniland.best.sky.quiz, 마지막에 고른 놀이는 daniland.skyAct,
 * 별 잇기에서 다 이어 본 별자리는 daniland.sky.drawn.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.sky';
  var ACT_KEY = 'daniland.skyAct';
  var DRAWN_KEY = 'daniland.sky.drawn';
  var TWO_PI = Math.PI * 2;
  var DEG = Math.PI / 180;
  var LAT = 37.57, LON = 126.98;     // 서울
  var QUIZ_ROUNDS = 8;

  var ACTS = [
    { id: 'draw',    name: '별 잇기',      icon: '✏️', desc: '반짝이는 별을 차례로 눌러 이어요' },
    { id: 'tonight', name: '오늘 밤 하늘', icon: '🔭', desc: '서울에서 올려다본 오늘 밤 하늘' },
    { id: 'quiz',    name: '퀴즈',         icon: '❓', desc: '별 모양을 보고 이름을 맞혀요' }
  ];

  // 별자리 — stars: [이름, 적경(시), 적위(도), 등급], strokes: 잇는 차례(별 번호), 같은 별을 다시 지나도 됩니다
  function hm(h, m) { return h + m / 60; }
  function dm(d, m) { return d < 0 || (d === 0 && m < 0) ? d - Math.abs(m) / 60 : d + m / 60; }
  var SKY = [
    { id: 'dipper', name: '북두칠성', art: '🥄', season: '봄',
      say: '국자 모양 일곱 별, 북두칠성이에요. 큰곰자리의 꼬리와 엉덩이예요.',
      stars: [['알카이드', hm(13, 47.5), dm(49, 19), 1.9], ['미자르', hm(13, 23.9), dm(54, 56), 2.2], ['알리오스', hm(12, 54.0), dm(55, 58), 1.8],
              ['메그레즈', hm(12, 15.4), dm(57, 2), 3.3], ['두베', hm(11, 3.7), dm(61, 45), 1.8], ['메라크', hm(11, 1.8), dm(56, 23), 2.4],
              ['페크다', hm(11, 53.8), dm(53, 42), 2.4]],
      strokes: [[0, 1, 2, 3, 4, 5, 6, 3]] },
    { id: 'cassiopeia', name: '카시오페이아자리', art: '👑', season: '가을',
      say: 'W 모양, 카시오페이아자리예요. 의자에 앉은 왕비 이야기가 있어요. 북쪽 하늘에서 늘 보여요.',
      stars: [['카프', hm(0, 9.2), dm(59, 9), 2.3], ['셰다르', hm(0, 40.5), dm(56, 32), 2.2], ['감마', hm(0, 56.7), dm(60, 43), 2.4],
              ['루크바', hm(1, 25.8), dm(60, 14), 2.7], ['세긴', hm(1, 54.4), dm(63, 40), 3.4]],
      strokes: [[0, 1, 2, 3, 4]] },
    { id: 'orion', name: '오리온자리', art: '🏹', season: '겨울',
      say: '사냥꾼 오리온이에요. 가운데 나란한 별 셋이 허리띠예요. 겨울밤에 잘 보여요.',
      stars: [['베텔게우스', hm(5, 55.2), dm(7, 24), 0.5], ['벨라트릭스', hm(5, 25.1), dm(6, 21), 1.6], ['민타카', hm(5, 32.0), dm(0, -18), 2.2],
              ['알닐람', hm(5, 36.2), dm(-1, 12), 1.7], ['알니타크', hm(5, 40.8), dm(-1, 57), 1.8], ['사이프', hm(5, 47.8), dm(-9, 40), 2.1],
              ['리겔', hm(5, 14.5), dm(-8, 12), 0.1]],
      strokes: [[0, 1, 2, 3, 4, 0], [2, 6], [4, 5]] },
    { id: 'cygnus', name: '백조자리', art: '🦢', season: '여름',
      say: '날개를 편 백조예요. 십자가 모양이라 북십자성이라고도 해요. 여름밤 머리 위에 보여요.',
      stars: [['데네브', hm(20, 41.4), dm(45, 17), 1.3], ['사드르', hm(20, 22.2), dm(40, 15), 2.2], ['알비레오', hm(19, 30.7), dm(27, 58), 3.1],
              ['델타', hm(19, 45.0), dm(45, 8), 2.9], ['기에나', hm(20, 46.2), dm(33, 58), 2.5]],
      strokes: [[0, 1, 2], [3, 1, 4]] },
    { id: 'scorpius', name: '전갈자리', art: '🦂', season: '여름',
      say: '전갈자리예요. 빨간 별 안타레스가 전갈의 심장이에요. 여름밤 남쪽 하늘 낮게 보여요.',
      stars: [['아크라브', hm(16, 5.4), dm(-19, 48), 2.6], ['주바', hm(16, 0.3), dm(-22, 37), 2.3], ['파이', hm(15, 58.9), dm(-26, 7), 2.9],
              ['시그마', hm(16, 21.2), dm(-25, 36), 2.9], ['안타레스', hm(16, 29.4), dm(-26, 26), 1.0], ['타우', hm(16, 35.9), dm(-28, 13), 2.8],
              ['엡실론', hm(16, 50.2), dm(-34, 18), 2.3], ['뮤', hm(16, 51.9), dm(-38, 3), 3.0], ['제타', hm(16, 54.6), dm(-42, 22), 3.6],
              ['에타', hm(17, 12.2), dm(-43, 14), 3.3], ['사르가스', hm(17, 37.3), dm(-43, 0), 1.9], ['이오타', hm(17, 47.6), dm(-40, 8), 3.0],
              ['카파', hm(17, 42.5), dm(-39, 2), 2.4], ['샤울라', hm(17, 33.6), dm(-37, 6), 1.6], ['레사트', hm(17, 30.8), dm(-37, 18), 2.7]],
      strokes: [[0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [1, 2]] },
    { id: 'leo', name: '사자자리', art: '🦁', season: '봄',
      say: '사자자리예요. 거꾸로 된 물음표 모양이 사자 머리예요. 봄밤에 잘 보여요.',
      stars: [['엡실론', hm(9, 45.9), dm(23, 46), 3.0], ['뮤', hm(9, 52.8), dm(26, 0), 3.9], ['아다페라', hm(10, 16.7), dm(23, 25), 3.4],
              ['알기에바', hm(10, 20.0), dm(19, 50), 2.0], ['에타', hm(10, 7.3), dm(16, 46), 3.5], ['레굴루스', hm(10, 8.4), dm(11, 58), 1.4],
              ['카페', hm(11, 14.2), dm(15, 26), 3.3], ['데네볼라', hm(11, 49.1), dm(14, 34), 2.1], ['조스마', hm(11, 14.1), dm(20, 31), 2.6]],
      strokes: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 3]] },
    { id: 'ursaminor', name: '작은곰자리', art: '🐻', season: '언제나',
      say: '작은곰자리예요. 꼬리 끝 별이 북극성이에요. 북극성은 늘 북쪽 하늘 그 자리에 있어요.',
      stars: [['북극성', hm(2, 31.8), dm(89, 15), 2.0], ['델타', hm(17, 32.2), dm(86, 35), 4.4], ['엡실론', hm(16, 46.0), dm(82, 2), 4.2],
              ['제타', hm(15, 44.1), dm(77, 48), 4.3], ['코카브', hm(14, 50.7), dm(74, 9), 2.1], ['페르카드', hm(15, 20.7), dm(71, 50), 3.0],
              ['에타', hm(16, 17.5), dm(75, 45), 5.0]],
      strokes: [[0, 1, 2, 3, 4, 5, 6, 3]] }
  ];

  var TIMES = [
    { id: 20, name: '🌆 저녁 8시' },
    { id: 23, name: '🌙 밤 11시' },
    { id: 4,  name: '🌅 새벽 4시' }
  ];

  var FACTS = [
    { q: '별자리의 별들은 정말 서로 가까이 붙어 있을까요?', choices: ['🔭 아니요, 거리가 다 달라요', '🤝 네, 꼭 붙어 있어요', '🧵 줄로 이어져 있어요', '🎨 누가 그려 놓았어요'],
      why: '우리 눈에 가까워 보일 뿐, 별마다 거리가 아주 달라요. 사람들이 이어서 그림을 떠올린 거예요.' },
    { q: '북극성은 어느 쪽 하늘에 있을까요?', choices: ['🧭 북쪽', '🌅 동쪽', '☀️ 남쪽', '🌇 서쪽'],
      why: '북극성은 늘 북쪽 하늘 그 자리에 있어서, 옛날 사람들이 길을 찾을 때 썼어요.' },
    { q: '오리온자리는 언제 잘 보일까요?', choices: ['⛄ 겨울밤', '🏖️ 여름밤', '🌞 한낮', '🌧️ 비 오는 밤'],
      why: '오리온자리는 겨울밤 하늘의 사냥꾼이에요.' },
    { q: '낮에는 왜 별이 안 보일까요?', choices: ['☀️ 햇빛이 너무 밝아서', '😴 별이 자러 가서', '🌍 별이 없어져서', '☁️ 늘 구름이 있어서'],
      why: '별은 낮에도 그 자리에 있어요. 햇빛이 너무 밝아서 안 보일 뿐이에요.' },
    { q: '밤하늘의 별은 무엇일까요?', choices: ['☀️ 아주 멀리 있는 해', '💡 하늘에 단 전등', '🪨 반짝이는 돌', '❄️ 얼음 조각'],
      why: '별은 해처럼 스스로 빛나는 커다란 공이에요. 아주 멀어서 작게 보여요.' }
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
    act: UI.loadValue(ACT_KEY) || 'draw',
    playing: false,
    con: null,          // 별 잇기 — 지금 별자리
    si: 0, pi: 0,       // 몇째 획의 몇째 별
    lines: [],          // 이은 선 [a, b]
    done: false,
    reveal: 0,          // 그림이 나타나는 정도
    taps: [],           // 누른 자리 반짝
    hour: 20,
    picked: null,       // 오늘 밤 하늘 — 누른 별자리
    qcon: null,         // 퀴즈 그림 — 별 모양
    qrot: 0,
    deck: [],
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    prompt: ''
  };
  if (!findAct(state.act)) state.act = 'draw';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }
  function findCon(id) {
    for (var i = 0; i < SKY.length; i++) if (SKY[i].id === id) return SKY[i];
    return null;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function josa(word, a, b) {
    var c = word.charCodeAt(word.length - 1) - 0xac00;
    return word + (c >= 0 && c <= 11171 && c % 28 ? a : b);
  }

  function loadDrawn() {
    var v = UI.loadValue(DRAWN_KEY);
    try { v = v ? JSON.parse(v) : []; } catch (e) { v = []; }
    return Array.isArray(v) ? v : [];
  }

  /* ---------- 별 자리 계산 ---------- */

  // 심사 도법 — 별자리 가운데(ra0, dec0)에서 본 평면 자리. 동쪽이 왼쪽(하늘을 올려다본 모습)
  function project(con) {
    var ra0 = 0, dec0 = 0, sx = 0, sy = 0, sz = 0;
    con.stars.forEach(function (s) {
      var a = s[1] * 15 * DEG, d = s[2] * DEG;
      sx += Math.cos(d) * Math.cos(a); sy += Math.cos(d) * Math.sin(a); sz += Math.sin(d);
    });
    ra0 = Math.atan2(sy, sx); dec0 = Math.atan2(sz, Math.sqrt(sx * sx + sy * sy));
    return con.stars.map(function (s) {
      var a = s[1] * 15 * DEG, d = s[2] * DEG, da = a - ra0;
      var cosc = Math.sin(dec0) * Math.sin(d) + Math.cos(dec0) * Math.cos(d) * Math.cos(da);
      var x = Math.cos(d) * Math.sin(da) / cosc;
      var y = (Math.cos(dec0) * Math.sin(d) - Math.sin(dec0) * Math.cos(d) * Math.cos(da)) / cosc;
      return { x: -x, y: y, mag: s[3], name: s[0] };
    });
  }

  // 평면 자리를 칸에 맞춤 — rot 만큼 돌려서
  function placeIn(pts, b, pad, rot) {
    var c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    var q = pts.map(function (p) { return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, mag: p.mag, name: p.name }; });
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    q.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    var k = Math.min((b.w - pad * 2) / Math.max(maxX - minX, 1e-6), (b.h - pad * 2) / Math.max(maxY - minY, 1e-6));
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
    return q.map(function (p) { return { x: cx + (p.x - mx) * k, y: cy - (p.y - my) * k, mag: p.mag, name: p.name }; });
  }

  // 서울에서 본 높이·방위 (도) — 방위는 북쪽 0, 동쪽 90
  function altAz(raH, decD, ms) {
    var jd = ms / 86400000 + 2440587.5;
    var gmst = 280.46061837 + 360.98564736629 * (jd - 2451545);
    var H = ((gmst + LON - raH * 15) % 360) * DEG;
    var d = decD * DEG, phi = LAT * DEG;
    var alt = Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H));
    var az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(phi) - Math.cos(d) * Math.cos(H) * Math.sin(phi));
    return { alt: alt / DEG, az: ((az / DEG) + 360) % 360 };
  }

  // 오늘 밤 그 시각 (한국 시각) — 새벽 시각이면 다음 날 새벽
  function tonightMs(hour) {
    var kst = new Date(Date.now() + 9 * 3600000);
    var y = kst.getUTCFullYear(), m = kst.getUTCMonth(), d = kst.getUTCDate();
    if (kst.getUTCHours() < 6) d -= 1;      // 새벽에 열면 '어젯밤'
    if (hour < 12) d += 1;
    return Date.UTC(y, m, d, hour - 9, 0);
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

  var bgStars = (function () {
    var out = [];
    for (var i = 0; i < 220; i++) out.push({ x: Math.random(), y: Math.random(), a: 0.1 + Math.random() * 0.35, s: Math.random() < 0.08 ? 1.6 : 0.9, tw: Math.random() * 6 });
    return out;
  })();

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    if (state.done && state.reveal < 1) state.reveal = Math.min(1, state.reveal + dt * 0.8);
    state.taps = state.taps.filter(function (p) { p.t += dt; return p.t < 0.6; });
    if (W) draw();
  }

  /* ---------- 그리기 ---------- */

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#03050f');
    g.addColorStop(1, '#0d1638');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    bgStars.forEach(function (s) {
      ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(clock * 1.1 + s.tw));
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
    });
    ctx.globalAlpha = 1;
    if (state.act === 'draw' && state.con) drawConnect();
    else if (state.act === 'tonight') drawTonight();
    else if (state.act === 'quiz' && state.qcon) drawPattern(state.qcon, state.qrot);
    state.taps.forEach(function (p) {
      ctx.strokeStyle = 'rgba(255,209,102,' + (1 - p.t / 0.6) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 10 + p.t * 40, 0, TWO_PI); ctx.stroke();
    });
  }

  function starR(mag, k) { return clamp((4.6 - mag) * 1.5 + 1.6, 1.6, 8) * (k || 1); }

  function drawStar(x, y, r, color) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.3, color || 'rgba(200,220,255,0.45)');
    g.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TWO_PI); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
  }

  function conBox() { return { x: 0, y: 0, w: W, h: H }; }

  function connectPts() {
    return placeIn(project(state.con), conBox(), Math.max(40, Math.min(W, H) * 0.12), 0);
  }

  function nextStar() {
    if (state.done) return -1;
    return state.con.strokes[state.si][state.pi];
  }

  function drawConnect() {
    var pts = connectPts(), con = state.con;
    // 그림 — 다 이으면 별자리 뒤에 흐릿하게
    if (state.reveal > 0) {
      var cx = 0, cy = 0;
      pts.forEach(function (p) { cx += p.x; cy += p.y; });
      cx /= pts.length; cy /= pts.length;
      ctx.globalAlpha = state.reveal * 0.32;
      ctx.font = Math.round(Math.min(W, H) * 0.55) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(con.art, cx, cy);
      ctx.globalAlpha = 1;
    }
    // 이은 선
    ctx.strokeStyle = state.done ? 'rgba(255,209,102,0.9)' : 'rgba(140,200,255,0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    state.lines.forEach(function (l) {
      ctx.beginPath(); ctx.moveTo(pts[l[0]].x, pts[l[0]].y); ctx.lineTo(pts[l[1]].x, pts[l[1]].y); ctx.stroke();
    });
    var nx = nextStar();
    pts.forEach(function (p, i) {
      var red = con.id === 'scorpius' && p.name === '안타레스' || con.id === 'orion' && p.name === '베텔게우스';
      drawStar(p.x, p.y, starR(p.mag), red ? 'rgba(255,140,100,0.6)' : null);
      if (i === nx) {
        ctx.strokeStyle = 'rgba(255,209,102,' + (0.5 + 0.5 * Math.sin(clock * 5)) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 18 + 3 * Math.sin(clock * 5), 0, TWO_PI); ctx.stroke();
      }
    });
    if (state.done) {
      ctx.font = '800 20px "Nanum Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(con.art + ' ' + con.name, W / 2, H - 12);
    }
  }

  // 퀴즈 — 선 없이 별만
  function drawPattern(con, rot) {
    var pts = placeIn(project(con), conBox(), Math.max(30, Math.min(W, H) * 0.14), rot);
    pts.forEach(function (p) { drawStar(p.x, p.y, starR(p.mag, 1.1)); });
  }

  /* 오늘 밤 하늘 — 머리 위가 가운데, 둘레가 땅 끝(지평선). 위가 북쪽, 왼쪽이 동쪽 (누워서 올려다본 모습) */
  function domeGeom() {
    var r = Math.min(W, H) / 2 - 34;
    return { cx: W / 2, cy: H / 2 + 4, r: r };
  }
  function domeXY(alt, az, g) {
    var rr = (90 - alt) / 90 * g.r, a = az * DEG;
    return { x: g.cx - rr * Math.sin(a), y: g.cy - rr * Math.cos(a) };
  }

  var tonightCache = null;
  function tonightData() {
    if (tonightCache && tonightCache.hour === state.hour && tonightCache.W === W && tonightCache.H === H) return tonightCache;
    var ms = tonightMs(state.hour), g = domeGeom();
    var cons = SKY.map(function (con) {
      var pts = con.stars.map(function (s) {
        var h = altAz(s[1], s[2], ms), p = domeXY(h.alt, h.az, g);
        return { x: p.x, y: p.y, alt: h.alt, mag: s[3], name: s[0] };
      });
      var up = pts.filter(function (p) { return p.alt > 0; });
      var cx = 0, cy = 0;
      up.forEach(function (p) { cx += p.x; cy += p.y; });
      return { con: con, pts: pts, up: up.length >= Math.ceil(pts.length / 2), cx: up.length ? cx / up.length : 0, cy: up.length ? cy / up.length : 0 };
    });
    tonightCache = { hour: state.hour, W: W, H: H, g: g, cons: cons };
    return tonightCache;
  }

  function drawTonight() {
    var T = tonightData(), g = T.g;
    // 하늘 둥근 판
    var sky = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r);
    sky.addColorStop(0, '#071033');
    sky.addColorStop(1, '#16255a');
    ctx.fillStyle = sky;
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.r, 0, TWO_PI); ctx.fill();
    ctx.strokeStyle = 'rgba(160,200,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,200,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.r * 2 / 3, 0, TWO_PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.r / 3, 0, TWO_PI); ctx.stroke();
    // 방위
    ctx.font = '800 14px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd166';
    [['북', 0], ['동', 90], ['남', 180], ['서', 270]].forEach(function (d) {
      var p = domeXY(-9, d[1], g);
      ctx.fillText(d[0], p.x, p.y);
    });
    ctx.save();
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.r, 0, TWO_PI); ctx.clip();
    T.cons.forEach(function (c) {
      if (!c.up) return;
      var on = state.picked === c.con.id;
      ctx.strokeStyle = on ? 'rgba(255,209,102,0.95)' : 'rgba(140,200,255,0.55)';
      ctx.lineWidth = on ? 3 : 1.6;
      c.con.strokes.forEach(function (st) {
        ctx.beginPath();
        st.forEach(function (i, k) {
          var p = c.pts[i];
          if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      });
      c.pts.forEach(function (p) { if (p.alt > -2) drawStar(p.x, p.y, starR(p.mag, 0.7)); });
    });
    ctx.restore();
    // 이름표
    T.cons.forEach(function (c) {
      if (!c.up) return;
      var on = state.picked === c.con.id;
      ctx.font = (on ? '800 14px' : '700 12px') + ' "Nanum Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = on ? '#ffe9a8' : 'rgba(255,255,255,0.8)';
      ctx.fillText(c.con.art + ' ' + c.con.name, c.cx, c.cy + 12);
    });
    // 머리 위
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px "Nanum Gothic", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('+ 머리 위', g.cx + 22, g.cy);
  }

  /* ---------- 누르기 ---------- */

  el.canvas.addEventListener('pointerdown', function (e) {
    if (!state.playing) return;
    var rect = el.canvas.getBoundingClientRect();
    var x = e.clientX - rect.left, y = e.clientY - rect.top;
    el.hint.hidden = true;
    if (state.act === 'draw') return tapConnect(x, y);
    if (state.act === 'tonight') return tapTonight(x, y);
  });

  function tapConnect(x, y) {
    if (!state.con || state.done) return;
    var pts = connectPts(), want = nextStar(), p = pts[want];
    var dx = p.x - x, dy = p.y - y;
    if (dx * dx + dy * dy > 40 * 40) {
      // 다른 별을 눌렀으면 다음 별을 한 번 더 반짝여 줌
      state.taps.push({ x: p.x, y: p.y, t: 0 });
      return;
    }
    state.taps.push({ x: p.x, y: p.y, t: 0 });
    if (window.SFX) SFX.tap();
    var stroke = state.con.strokes[state.si];
    if (state.pi > 0) state.lines.push([stroke[state.pi - 1], want]);
    state.pi += 1;
    if (state.pi >= stroke.length) { state.si += 1; state.pi = 0; }
    if (state.si >= state.con.strokes.length) finishConnect();
  }

  function finishConnect() {
    state.done = true;
    state.reveal = 0;
    var con = state.con;
    var drawn = loadDrawn();
    if (drawn.indexOf(con.id) < 0) { drawn.push(con.id); UI.saveValue(DRAWN_KEY, JSON.stringify(drawn)); }
    el.score.textContent = '✨ ' + drawn.length + '/' + SKY.length;
    markChips();
    if (window.SFX) SFX.correct();
    setLabel(con.art + ' ' + con.name);
    state.prompt = con.say;
    speak(con.say);
  }

  function tapTonight(x, y) {
    var T = tonightData(), best = null, bd = 60 * 60;
    T.cons.forEach(function (c) {
      if (!c.up) return;
      c.pts.forEach(function (p) {
        if (p.alt < 0) return;
        var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
        if (d < bd) { bd = d; best = c; }
      });
    });
    if (!best) return;
    state.picked = best.con.id;
    if (window.SFX) SFX.tap();
    setLabel(best.con.art + ' ' + best.con.name);
    state.prompt = best.con.say;
    speak(best.con.say);
  }

  /* ---------- 놀이: 별 잇기 ---------- */

  function startDraw() {
    var drawn = loadDrawn();
    el.score.textContent = '✨ ' + drawn.length + '/' + SKY.length;
    el.ctrl.innerHTML = '';
    SKY.forEach(function (con) {
      var b = document.createElement('button');
      b.className = 'chip con-chip';
      b.dataset.id = con.id;
      b.textContent = con.art + ' ' + con.name.replace('자리', '');
      b.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        pickCon(con);
      });
      el.ctrl.appendChild(b);
    });
    el.ctrl.hidden = false;
    // 아직 안 이어 본 것부터
    var first = null;
    SKY.forEach(function (c) { if (!first && drawn.indexOf(c.id) < 0) first = c; });
    pickCon(first || SKY[0], true);
  }

  function markChips() {
    var drawn = loadDrawn();
    Array.prototype.forEach.call(el.ctrl.querySelectorAll('.con-chip'), function (b) {
      b.classList.toggle('on', state.con && b.dataset.id === state.con.id);
      b.classList.toggle('done', drawn.indexOf(b.dataset.id) >= 0);
    });
  }

  function pickCon(con, first) {
    state.con = con;
    state.si = 0; state.pi = 0;
    state.lines = [];
    state.done = false;
    state.reveal = 0;
    markChips();
    el.hint.textContent = '👉 반짝이는 별을 차례로 눌러요';
    el.hint.hidden = false;
    setLabel('✏️ 별을 이어 보세요');
    state.prompt = first ? '반짝이는 별을 차례로 눌러서 이어 보세요. 무엇이 나올까요?' : '반짝이는 별을 차례로 눌러 보세요.';
    speak(state.prompt);
  }

  /* ---------- 놀이: 오늘 밤 하늘 ---------- */

  function startTonight() {
    el.score.textContent = '🔭';
    state.picked = null;
    tonightCache = null;
    var h = new Date(Date.now() + 9 * 3600000).getUTCHours();
    state.hour = h >= 22 || h < 2 ? 23 : (h >= 2 && h < 12 ? 4 : 20);
    el.ctrl.innerHTML = '';
    TIMES.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'chip' + (t.id === state.hour ? ' on' : '');
      b.textContent = t.name;
      b.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        state.hour = t.id;
        state.picked = null;
        Array.prototype.forEach.call(el.ctrl.children, function (x) { x.classList.toggle('on', x === b); });
        tellTonight();
      });
      el.ctrl.appendChild(b);
    });
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 별자리를 눌러 보세요';
    el.hint.hidden = false;
    tellTonight(true);
  }

  function tellTonight(first) {
    tonightCache = null;
    var T = tonightData();
    var up = T.cons.filter(function (c) { return c.up; }).map(function (c) { return c.con.name; });
    var t = TIMES.filter(function (x) { return x.id === state.hour; })[0];
    setLabel(t.name + ' 서울 하늘');
    var text = (first ? '오늘 밤 서울 하늘이에요. 누워서 올려다본 모습이라 위가 북쪽이에요. ' : '') +
      (up.length ? josa(up.join(', '), '이', '가') + ' 떠 있어요.' : '아는 별자리가 다 땅 아래에 있어요.');
    state.prompt = text;
    speak(text);
  }

  /* ---------- 놀이: 퀴즈 ---------- */

  function startQuiz() {
    el.ctrl.hidden = true;
    el.ctrl.innerHTML = '';
    el.hint.hidden = true;
    el.cards.hidden = false;
    el.sky.classList.add('small-sky', 'fill-sky');
    el.score.textContent = '⭐ 0';
    state.round = 0;
    var shapes = UI.shuffle(SKY.slice()).slice(0, 5).map(function (con) {
      var others = UI.shuffle(SKY.filter(function (c) { return c !== con; })).slice(0, 3);
      return { con: con, q: '이 별들은 어떤 별자리일까요?',
               choices: [con.art + ' ' + con.name].concat(others.map(function (c) { return c.art + ' ' + c.name; })),
               why: con.say };
    });
    var facts = UI.shuffle(FACTS.slice()).slice(0, QUIZ_ROUNDS - shapes.length);
    state.deck = UI.shuffle(shapes.concat(facts));
    setTimeout(fit, 0);
    nextRound();
  }

  function askQuiz(q) {
    state.qcon = q.con || null;
    state.qrot = q.con ? (Math.random() - 0.5) * 0.5 : 0;
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
    el.endTitle.textContent = state.stars === total ? '별자리 박사!' : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  /* ---------- 놀이 진행 ---------- */

  function setLabel(text) { el.label.textContent = text; }

  function startGame() {
    state.playing = true;
    state.con = null;
    state.qcon = null;
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
    if (state.act === 'draw') return startDraw();
    if (state.act === 'tonight') return startTonight();
    startQuiz();
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
      var mb = '';
      if (a.id === 'quiz') { var best = UI.readBest(BEST_KEY + '.quiz'); if (best) mb = '⭐ ' + best.stars + '/' + best.total; }
      if (a.id === 'draw') { var n = loadDrawn().length; if (n) mb = '✨ ' + n + '/' + SKY.length; }
      b.innerHTML = '<span class="mi">' + a.icon + '</span><span class="mn">' + a.name + '</span><span class="mb">' + mb + '</span>';
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
    state.qcon = null;
    el.ctrl.hidden = true;
    el.cards.hidden = true;
    el.sky.classList.remove('small-sky', 'fill-sky');
    buildModeRow();
    el.startOverlay.hidden = false;
  });
  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '반짝이는 별을 이어 보세요.'; } });
  });

  var back = Catalog.backHref('constellation.html');
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
  if (window.ResizeObserver) new ResizeObserver(function () { fit(); tonightCache = null; }).observe(el.sky);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  buildModeRow();
  fit();
  setLabel('✨ 별자리');
  requestAnimationFrame(frame);
})();
