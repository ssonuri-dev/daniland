/* =========================================================================
 * 다니랜드 - 달 (moon.html)
 *
 * '달은 왜 모양이 바뀌어?' 와 일식·월식을 그림으로 보여 주는 화면입니다 (2026-11-22). 우주 과목의 다른 화면처럼
 * 글은 이름표·한두 문장, 캔버스 한 장(라이브러리 없음)입니다.
 *
 * 놀이 3가지
 *   phase   : 달의 모양 - 왼쪽(세로 화면은 위)은 위에서 내려다본 해·지구·달, 오른쪽은 우리 눈에 보이는 달.
 *                         달을 끌거나 하루씩 넘기면 모양이 바뀝니다. '오늘' 의 달에서 시작하고 날짜가 같이 갑니다
 *   eclipse : 일식·월식 - 달이 해와 지구 사이에 딱 서면 해를 가리고(일식), 지구 그림자 속에 들어가면 붉어집니다(월식)
 *   quiz    : 퀴즈      - 달 모양 이름·일식·월식 열 문제 (보기 넉 장, 첫 보기가 정답)
 *
 * 진짜인 것
 *   - 달의 반쪽은 늘 해를 받아 밝고, 지구에서 그 밝은 쪽이 얼마나 보이느냐가 모양입니다 (`drawPhase()` 가 그 몫을 그대로 그림).
 *     우리나라(북반구)에서 보는 대로 차오를 때는 오른쪽이 밝습니다.
 *   - 오늘의 달: 2000-01-06 18:14(세계시) 삭에서 평균 삭망월 29.530589일로 셉니다 (`ageAt()`). 평균값이라 하루쯤 어긋날 수 있습니다.
 *     모양 이름의 경계(`PHASES`)는 그 오차보다 넓게 잡았습니다.
 *   - 월식 때 지구 그림자(본그림자)는 달 자리에서 달 반지름의 2.7배쯤입니다(`UMBRA`). 붉은 까닭은 지구 공기를 지나 휜 붉은 빛.
 *   - 일식은 맨눈으로 보면 안 됩니다 — 화면에서도 말합니다(퀴즈에도 있음).
 * 진짜가 아닌 것
 *   - 위에서 본 그림의 크기·거리 비율 (진짜 비율이면 달이 점이 됩니다). 해는 오른쪽 끝에 일부만 그립니다.
 *   - 달의 길은 진짜로 5도쯤 기울어서 일식·월식은 1년에 몇 번뿐인데, 그림은 납작하게 그려 매달 한 줄로 섭니다 — 화면에서 그렇게 말합니다.
 *
 * 기록 키는 daniland.best.moon(카드의 ⭐)·daniland.best.moon.quiz, 마지막에 고른 놀이는 daniland.moonAct.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.moon';
  var ACT_KEY = 'daniland.moonAct';
  var TWO_PI = Math.PI * 2;
  var SYNODIC = 29.530589;                       // 삭망월 (일)
  var EPOCH = Date.UTC(2000, 0, 6, 18, 14);      // 기준 삭
  var DAY_MS = 86400000;
  var UMBRA = 2.7;                               // 달 자리에서 지구 본그림자 반지름 ÷ 달 반지름
  var ECL = 0.32;                                // 일식·월식 그림을 보여 주는 각 범위 (라디안)
  var QUIZ_ROUNDS = 10;

  var ACTS = [
    { id: 'phase',   name: '달의 모양', icon: '🌙', desc: '달을 돌려 보면 모양이 바뀌어요 — 오늘 달부터' },
    { id: 'eclipse', name: '일식·월식', icon: '🌑', desc: '해·지구·달이 한 줄로 서면?' },
    { id: 'quiz',    name: '퀴즈',      icon: '❓', desc: '달 모양 이름과 일식·월식 열 문제' }
  ];

  // 모양 — 달의 나이(삭에서 지난 날) 범위
  var PHASES = [
    { lo: 0,    hi: 1.2,  name: '안 보이는 달', icon: '🌑', say: '해랑 같은 쪽에 있어서, 밝은 쪽이 저쪽을 봐요. 그래서 안 보여요.' },
    { lo: 1.2,  hi: 6.3,  name: '초승달',       icon: '🌒', say: '초승달이에요. 저녁에 서쪽 하늘에 잠깐 보여요.' },
    { lo: 6.3,  hi: 8.5,  name: '상현달',       icon: '🌓', say: '상현달이에요. 오른쪽 반이 밝은 반달이에요.' },
    { lo: 8.5,  hi: 13.8, name: '차오르는 달',  icon: '🌔', say: '점점 차올라요. 곧 보름달이 돼요.' },
    { lo: 13.8, hi: 15.8, name: '보름달',       icon: '🌕', say: '보름달이에요! 지구 뒤쪽에 있어서 밝은 쪽이 다 보여요.' },
    { lo: 15.8, hi: 21.0, name: '기우는 달',    icon: '🌖', say: '점점 줄어들어요.' },
    { lo: 21.0, hi: 23.2, name: '하현달',       icon: '🌗', say: '하현달이에요. 왼쪽 반이 밝은 반달이에요.' },
    { lo: 23.2, hi: 28.3, name: '그믐달',       icon: '🌘', say: '그믐달이에요. 새벽에 동쪽 하늘에 보여요.' },
    { lo: 28.3, hi: 30,   name: '안 보이는 달', icon: '🌑', say: '해랑 같은 쪽에 있어서, 밝은 쪽이 저쪽을 봐요. 그래서 안 보여요.' }
  ];

  // 퀴즈 — choices[0] 이 정답. art: 위 그림 (age 는 달의 나이, 'solar'·'lunar' 는 일식·월식)
  var QUIZ = [
    { q: '이 달의 이름은 무엇일까요?', art: { age: 14.8 }, choices: ['🌕 보름달', '🌓 상현달', '🌒 초승달', '🌗 하현달'],
      why: '동그랗게 다 밝은 보름달이에요.' },
    { q: '이 달의 이름은 무엇일까요?', art: { age: 7.4 }, choices: ['🌓 상현달', '🌗 하현달', '🌕 보름달', '🌘 그믐달'],
      why: '오른쪽 반이 밝은 반달, 상현달이에요.' },
    { q: '이 달의 이름은 무엇일까요?', art: { age: 3.5 }, choices: ['🌒 초승달', '🌘 그믐달', '🌓 상현달', '🌕 보름달'],
      why: '오른쪽이 가늘게 밝은 초승달이에요.' },
    { q: '이 달의 이름은 무엇일까요?', art: { age: 22.1 }, choices: ['🌗 하현달', '🌓 상현달', '🌒 초승달', '🌕 보름달'],
      why: '왼쪽 반이 밝은 반달, 하현달이에요.' },
    { q: '달은 스스로 빛날까요?', art: { age: 10 }, choices: ['☀️ 아니요, 햇빛을 받아 빛나요', '💡 네, 전등처럼 빛나요', '🔥 속이 불타서 빛나요', '⭐ 별이라서 빛나요'],
      why: '달은 스스로 못 빛나요. 햇빛을 받은 쪽만 밝아요.' },
    { q: '달의 모양이 다시 처음처럼 되려면 얼마나 걸릴까요?', art: { age: 18 }, choices: ['📅 한 달쯤', '🌞 하루', '🗓️ 일 년', '⏰ 한 시간'],
      why: '29일 반쯤, 거의 한 달이에요. 그래서 한 달을 달이라고 불러요.' },
    { q: '초승달 다음에는 어떤 달이 될까요?', art: { age: 3.5 }, choices: ['🌓 상현달', '🌘 그믐달', '🌗 하현달', '🌑 안 보이는 달'],
      why: '초승달이 점점 차올라 반달, 상현달이 돼요.' },
    { q: '일식은 무엇일까요?', art: 'solar', choices: ['🌑 달이 해를 가려요', '🌍 지구가 달을 가려요', '☁️ 구름이 해를 가려요', '🌞 해가 달을 가려요'],
      why: '달이 해와 지구 사이에 딱 서서 해를 가리는 게 일식이에요.' },
    { q: '월식 때 달은 무슨 색이 될까요?', art: 'lunar', choices: ['🔴 붉은색', '🟢 초록색', '🔵 파란색', '🌈 무지개색'],
      why: '지구 공기를 지나며 휜 붉은 빛만 달에 닿아서 붉어져요. 저녁노을처럼요.' },
    { q: '일식은 어떻게 봐야 할까요?', art: 'solar', choices: ['🕶️ 일식 안경을 써요', '👀 그냥 맨눈으로 봐요', '😎 선글라스면 돼요', '🔭 망원경으로 봐요'],
      why: '해를 그냥 보면 눈이 다쳐요. 꼭 일식 안경을 써야 해요.' },
    { q: '월식은 언제 생길까요?', art: 'lunar', choices: ['🌕 보름달일 때', '🌑 안 보이는 달일 때', '🌓 반달일 때', '🌒 초승달일 때'],
      why: '달이 지구 뒤 그림자 속에 들어갈 때라서, 늘 보름달 때예요.' },
    { q: '보름달일 때 달은 어디에 있을까요?', art: { age: 14.8, diag: true }, choices: ['🌍 지구 뒤, 해 반대쪽', '🌞 해와 지구 사이', '☀️ 해 바로 옆', '🌙 지구 바로 위'],
      why: '지구 뒤쪽에 있어서 해를 받은 쪽이 우리에게 다 보여요.' }
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
    act: UI.loadValue(ACT_KEY) || 'phase',
    playing: false,
    d: 0,              // 오늘에서 지난 날 (달의 모양)
    theta: 0,          // 달의 자리 (해 쪽이 0, 시계 반대로)
    anim: null,        // { from, to, t, dur }
    drag: false,
    phaseName: '',
    eclSaid: '',
    art: null,         // 퀴즈 그림
    deck: [],
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    prompt: ''
  };
  if (!findAct(state.act)) state.act = 'phase';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function wrap(a) { a %= TWO_PI; return a < 0 ? a + TWO_PI : a; }
  function sdiff(a) { a = wrap(a); return a > Math.PI ? a - TWO_PI : a; }

  var TODAY = Date.now();
  function ageAt(ms) { var a = ((ms - EPOCH) / DAY_MS) % SYNODIC; return a < 0 ? a + SYNODIC : a; }
  var TODAY_AGE = ageAt(TODAY);
  function phaseOf(age) {
    for (var i = 0; i < PHASES.length; i++) if (age >= PHASES[i].lo && age < PHASES[i].hi) return PHASES[i];
    return PHASES[0];
  }
  function dateText(d) {
    var t = new Date(TODAY + Math.round(d) * DAY_MS);
    return (t.getMonth() + 1) + '월 ' + t.getDate() + '일';
  }
  function curAge() { return wrap(state.theta) / TWO_PI * SYNODIC; }

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

  // 그림 둘의 칸 — 가로가 넉넉하면 나란히, 아니면 위아래
  function boxes() {
    if (state.act === 'quiz' && state.art && !state.art.diag) return { diag: null, view: { x: 0, y: 0, w: W, h: H } };
    if (state.act === 'quiz') return { diag: { x: 0, y: 0, w: W, h: H }, view: null };
    if (W >= H * 1.1) return { diag: { x: 0, y: 0, w: W * 0.56, h: H }, view: { x: W * 0.56, y: 0, w: W * 0.44, h: H } };
    return { diag: { x: 0, y: 0, w: W, h: H * 0.56 }, view: { x: 0, y: H * 0.56, w: W, h: H * 0.44 } };
  }

  // 위에서 본 그림의 자리 — 해(오른쪽 끝)와 달의 길이 안 겹치게
  function diagGeom(b) {
    var sunR = Math.min(b.h * 0.32, b.w * 0.2);
    var sx = b.x + b.w + sunR * 0.35;
    var cy = b.y + b.h * 0.52;
    var room = (sx - sunR - 10) - b.x;            // 해 앞까지의 폭
    var ro = Math.min(room * 0.4, b.h * 0.36);
    var cx = sx - sunR - 10 - ro * 1.18;
    return { cx: cx, cy: cy, ro: ro, re: ro * 0.24, rm: ro * 0.13, sx: sx, sunR: sunR };
  }

  var bgStars = (function () {
    var out = [];
    for (var i = 0; i < 150; i++) out.push({ x: Math.random(), y: Math.random(), a: 0.2 + Math.random() * 0.6, s: Math.random() < 0.1 ? 2 : 1, tw: Math.random() * 6 });
    return out;
  })();

  /* ---------- 움직임 ---------- */

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    if (state.anim) {
      var a = state.anim;
      a.t += dt;
      var k = clamp(a.t / a.dur, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      if (a.linear) e = k;
      setTheta(a.from + (a.to - a.from) * e, a.from + (a.to - a.from) * e - state.theta);
      if (k >= 1) { state.anim = null; if (a.done) a.done(); }
    }
    if (W) draw();
  }

  // 달 자리를 옮김 — 달의 모양에서는 날짜도 같이 (delta 만큼 앞으로/뒤로)
  function setTheta(th, delta) {
    if (state.act === 'phase') state.d += (delta / TWO_PI) * SYNODIC;
    state.theta = th;
    if (state.playing) changed();
  }

  // 모양·일식이 바뀌면 이름표와 말
  function changed() {
    if (state.act === 'phase') {
      var p = phaseOf(curAge());
      var text = p.icon + ' ' + p.name + ' · ' + dateText(state.d) + (Math.abs(state.d) < 0.5 ? ' (오늘)' : '');
      if (el.label.textContent !== text) el.label.textContent = text;
      if (p.name !== state.phaseName) {
        state.phaseName = p.name;
        state.prompt = p.say;
        if (!state.quiet && !(state.anim && state.anim.silent)) speak(p.say);
      }
    } else if (state.act === 'eclipse') {
      var kind = eclKind();
      if (kind !== state.eclSaid) {
        state.eclSaid = kind;
        if (kind === 'solar') say('일식이에요! 달이 해를 가렸어요. 진짜 일식은 꼭 일식 안경을 쓰고 봐요.');
        else if (kind === 'lunar') say('월식이에요! 달이 지구 그림자 속에 들어가서 붉어졌어요.');
      }
    }
  }

  function eclKind() {
    var dS = Math.abs(sdiff(state.theta)), dL = Math.abs(sdiff(state.theta - Math.PI));
    if (dS < 0.05) return 'solar';
    if (dL < 0.1) return 'lunar';
    return '';
  }

  /* ---------- 그리기 ---------- */

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, W, H);
    var B = boxes();
    if (state.act === 'quiz' && state.art) {
      if (state.art === 'solar' || state.art === 'lunar') return drawGroundView(B.view, state.art === 'solar' ? 0 : Math.PI, true);
      if (state.art.diag) return drawDiag(B.diag, state.art.age / SYNODIC * TWO_PI, false);
      return drawMoonView(B.view, state.art.age, true);
    }
    if (B.diag) drawDiag(B.diag, state.theta, state.act === 'eclipse');
    if (B.view) {
      if (state.act === 'eclipse') drawGroundView(B.view, state.theta, false);
      else drawMoonView(B.view, curAge(), false);
    }
    if (B.diag && B.view) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      if (B.view.x > 0) ctx.fillRect(B.view.x, 10, 1, H - 20);
      else ctx.fillRect(10, B.view.y, W - 20, 1);
    }
  }

  function drawStarsIn(b) {
    bgStars.forEach(function (s) {
      ctx.globalAlpha = s.a * (0.75 + 0.25 * Math.sin(clock * 1.2 + s.tw));
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x + s.x * b.w, b.y + s.y * b.h, s.s, s.s);
    });
    ctx.globalAlpha = 1;
  }

  // 위에서 본 해·지구·달 — 햇빛은 오른쪽에서
  function drawDiag(b, theta, shadows) {
    ctx.save();
    ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
    drawStarsIn(b);
    var g = diagGeom(b);
    // 해 — 오른쪽 끝에 일부만
    var sunR = g.sunR, sx = g.sx;
    var sg = ctx.createRadialGradient(sx, g.cy, sunR * 0.3, sx, g.cy, sunR * 1.25);
    sg.addColorStop(0, '#fff6c8');
    sg.addColorStop(0.7, '#ffcf4a');
    sg.addColorStop(0.8, 'rgba(255,180,50,0.5)');
    sg.addColorStop(1, 'rgba(255,170,40,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, g.cy, sunR * 1.25, 0, TWO_PI); ctx.fill();
    ctx.font = '800 13px "Nanum Gothic", sans-serif';
    ctx.fillStyle = '#7a4a00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('해', sx - sunR * 0.62, g.cy);
    // 햇빛 화살 — 달의 길 위아래로
    ctx.strokeStyle = 'rgba(255,220,120,0.3)';
    ctx.fillStyle = 'rgba(255,220,120,0.3)';
    ctx.lineWidth = 2;
    [-1.25, -0.6, 0.6, 1.25].forEach(function (k) {
      var y = g.cy + k * g.ro, x1 = sx - sunR * 1.1, x0 = x1 - 34;
      if (y < b.y + 24 || y > b.y + b.h - 10) return;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x0, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 - 6, y); ctx.lineTo(x0, y - 4); ctx.lineTo(x0, y + 4); ctx.fill();
    });
    // 지구 그림자 (일식·월식)
    if (shadows) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.moveTo(g.cx, g.cy - g.re);
      ctx.lineTo(b.x, g.cy - g.re * 0.7);
      ctx.lineTo(b.x, g.cy + g.re * 0.7);
      ctx.lineTo(g.cx, g.cy + g.re);
      ctx.fill();
    }
    // 달의 길
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.ro, 0, TWO_PI); ctx.stroke();
    ctx.setLineDash([]);
    // 지구
    drawLitBall(g.cx, g.cy, g.re, '#3d8ee8', '#0d2142', true);
    var mx = g.cx + Math.cos(theta) * g.ro, my = g.cy - Math.sin(theta) * g.ro;
    // 달 그림자 (일식) — 달에서 지구 쪽으로 가는 좁은 그늘
    if (shadows && Math.abs(sdiff(theta)) < 0.5) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.moveTo(mx, my - g.rm);
      ctx.lineTo(g.cx + g.re * 0.9, g.cy - g.rm * 0.15 + (my - g.cy) * 0.1);
      ctx.lineTo(g.cx + g.re * 0.9, g.cy + g.rm * 0.15 + (my - g.cy) * 0.1);
      ctx.lineTo(mx, my + g.rm);
      ctx.fill();
    }
    // 보는 쪽 — 지구에서 달로 점선
    ctx.strokeStyle = 'rgba(255,209,102,0.55)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(g.cx + Math.cos(theta) * g.re * 1.5, g.cy - Math.sin(theta) * g.re * 1.5);
    ctx.lineTo(mx - Math.cos(theta) * g.rm * 1.3, my + Math.sin(theta) * g.rm * 1.3);
    ctx.stroke();
    ctx.setLineDash([]);
    // 지구 위의 우리 — 달 쪽 땅 위 작은 집
    ctx.font = Math.round(clamp(g.re * 0.55, 11, 22)) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏠', g.cx + Math.cos(theta) * g.re * 1.05, g.cy - Math.sin(theta) * g.re * 1.05);
    // 달 — 해 쪽 반이 밝음
    var inShadow = shadows ? clamp(1 - Math.abs(sdiff(theta - Math.PI)) / 0.12, 0, 1) : 0;
    drawLitBall(mx, my, g.rm, '#e9e6dc', '#2b2b33', false, inShadow);
    // 끌기 안내 고리
    if (state.act !== 'quiz') {
      ctx.strokeStyle = 'rgba(255,209,102,' + (0.35 + 0.25 * Math.sin(clock * 3)) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, g.rm * 1.7, 0, TWO_PI); ctx.stroke();
    }
    // 이름표
    ctx.font = '12px "Nanum Gothic", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('지구', g.cx, g.cy + g.re + 4);
    ctx.textBaseline = 'bottom';
    ctx.fillText('달', mx, my - g.rm - 4);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,230,150,0.9)';
    ctx.fillText('햇빛 ←', b.x + b.w - 8, b.y + 8);
    ctx.restore();
  }

  // 오른쪽(해 쪽) 반이 밝은 공 — red 는 월식으로 붉어진 정도(0~1)
  function drawLitBall(x, y, r, lit, dark, earth, red) {
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
    ctx.fillStyle = lit;
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2); ctx.fill();
    if (earth) {
      ctx.fillStyle = 'rgba(80,180,100,0.8)';
      ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.25, r * 0.28, 0, TWO_PI); ctx.fill();
      ctx.beginPath(); ctx.arc(x + r * 0.5, y + r * 0.35, r * 0.2, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,30,0.6)';
      ctx.beginPath(); ctx.arc(x, y, r, Math.PI / 2, Math.PI * 1.5); ctx.fill();
    }
    if (red > 0) {
      ctx.fillStyle = 'rgba(150,40,20,' + (0.85 * red) + ')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
    }
  }

  // 우리 눈에 보이는 달 — 나이(age)에 따라 밝은 몫
  function drawMoonView(b, age, big) {
    ctx.save();
    ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
    var sky = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    sky.addColorStop(0, '#0b1230');
    sky.addColorStop(1, '#1b2350');
    ctx.fillStyle = sky;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    drawStarsIn(b);
    var r = Math.min(b.w * 0.3, b.h * (big ? 0.36 : 0.3));
    var x = b.x + b.w / 2, y = b.y + b.h * (big ? 0.5 : 0.45);
    drawPhase(x, y, r, age / SYNODIC * TWO_PI);
    if (!big) {
      var p = phaseOf(age);
      ctx.font = '800 ' + Math.round(clamp(r * 0.28, 14, 22)) + 'px "Nanum Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(p.name, x, y + r + 10);
      ctx.font = '12px "Nanum Gothic", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textBaseline = 'top';
      ctx.fillText('우리 눈에 보이는 달', x, b.y + 8);
    }
    ctx.restore();
  }

  // 달 모양 — phi 는 0(삭)~2π. 차오를 때(0~π) 오른쪽이 밝음
  function drawPhase(x, y, r, phi) {
    // 어두운 쪽도 아주 흐리게 (지구빛)
    ctx.fillStyle = '#23263a';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
    var c = Math.cos(phi), waxing = wrap(phi) < Math.PI;
    var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#fffbea');
    g.addColorStop(1, '#d9d3bf');
    ctx.fillStyle = g;
    ctx.beginPath();
    // 밝은 쪽 반원 + 경계 타원 (가로 반지름 r·|cos|)
    if (waxing) ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
    else ctx.arc(x, y, r, Math.PI / 2, Math.PI * 1.5, false);
    var k = r * Math.abs(c);
    // 반달 전(초승·그믐)이면 경계가 밝은 쪽으로 오목, 지나면(차오름·기욺) 볼록
    var bulge = c < 0;   // 보름에 가까움
    if (waxing) ctx.ellipse(x, y, k, r, 0, Math.PI / 2, -Math.PI / 2, !bulge ? true : false);
    else ctx.ellipse(x, y, k, r, 0, -Math.PI / 2, Math.PI / 2, !bulge ? true : false);
    ctx.fill();
    // 무늬 (바다)
    ctx.fillStyle = 'rgba(120,115,100,0.25)';
    [[-0.25, -0.2, 0.22], [0.2, -0.3, 0.15], [0.1, 0.15, 0.2], [-0.3, 0.3, 0.12]].forEach(function (m) {
      ctx.beginPath(); ctx.arc(x + m[0] * r, y + m[1] * r, m[2] * r, 0, TWO_PI); ctx.fill();
    });
    // 바다 무늬가 어두운 쪽에 진하게 나오지 않게 — 어두운 쪽을 다시 덮음
    ctx.fillStyle = 'rgba(35,38,58,0.75)';
    ctx.beginPath();
    if (waxing) ctx.arc(x, y, r, Math.PI / 2, Math.PI * 1.5, false);
    else ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
    if (waxing) ctx.ellipse(x, y, k, r, 0, -Math.PI / 2, Math.PI / 2, !bulge ? false : true);
    else ctx.ellipse(x, y, k, r, 0, Math.PI / 2, -Math.PI / 2, !bulge ? false : true);
    ctx.fill();
  }

  // 땅에서 본 하늘 — 해 쪽 가까우면 해와 달(일식), 반대쪽이면 보름달과 지구 그림자(월식)
  function drawGroundView(b, theta, big) {
    var dS = sdiff(theta), dL = sdiff(theta - Math.PI);
    var x = b.x + b.w / 2, y = b.y + b.h * 0.47, r = Math.min(b.w * 0.18, b.h * 0.24);
    ctx.save();
    ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
    if (Math.abs(dS) < ECL) {
      // 일식 — 달이 오른쪽(서쪽)에서 왼쪽으로 지나갑니다
      var off = -dS / ECL * r * 2.4;
      var cover = clamp(1 - Math.abs(off) / (2 * r), 0, 1);
      var dark = clamp((cover - 0.6) / 0.4, 0, 1);
      ctx.fillStyle = 'rgb(' + Math.round(110 - 95 * dark) + ',' + Math.round(180 - 160 * dark) + ',' + Math.round(240 - 200 * dark) + ')';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      if (dark > 0.5) { ctx.globalAlpha = (dark - 0.5) * 2; drawStarsIn(b); ctx.globalAlpha = 1; }
      if (cover > 0.97) {
        var cg = ctx.createRadialGradient(x, y, r, x, y, r * 2.2);
        cg.addColorStop(0, 'rgba(255,255,255,0.85)');
        cg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TWO_PI); ctx.fill();
      }
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = '#14161f';
      ctx.beginPath(); ctx.arc(x + off, y, r * 1.02, 0, TWO_PI); ctx.fill();
      tagIn(b, cover > 0.97 ? '🌑 일식! 해가 다 가려졌어요' : '해 앞으로 달이 지나가요');
    } else if (Math.abs(dL) < ECL) {
      // 월식 — 지구 그림자가 달을 덮습니다
      ctx.fillStyle = '#0a0f26';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      drawStarsIn(b);
      var so = dL / ECL * r * (UMBRA + 1.3);
      ctx.fillStyle = '#f4efdc';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.arc(x + so, y, r * (UMBRA + 1), 0, TWO_PI); ctx.fill();
      ctx.fillStyle = 'rgba(150,45,20,0.92)';
      ctx.beginPath(); ctx.arc(x + so, y, r * UMBRA, 0, TWO_PI); ctx.fill();
      ctx.restore();
      var inside = Math.abs(so) + r < r * UMBRA;
      tagIn(b, inside ? '🔴 월식! 달이 붉어졌어요' : '지구 그림자가 달로 다가가요');
    } else {
      // 그냥 하늘 — 그날의 달 모양
      ctx.restore();
      drawMoonView(b, wrap(theta) / TWO_PI * SYNODIC, big);
      if (!big) {
        ctx.font = '12px "Nanum Gothic", sans-serif';
        ctx.fillStyle = 'rgba(255,230,150,0.85)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('해·지구·달이 한 줄로 서면?', b.x + b.w / 2, b.y + b.h - 8);
      }
      return;
    }
    ctx.restore();
  }

  function tagIn(b, text) {
    ctx.font = '800 15px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    var w = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(10,14,32,0.75)';
    roundRect(b.x + b.w / 2 - w / 2, b.y + b.h - 36, w, 28, 9);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, b.x + b.w / 2, b.y + b.h - 13);
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

  /* ---------- 끌기 ---------- */

  function pointerTheta(e) {
    var B = boxes();
    if (!B.diag) return null;
    var rect = el.canvas.getBoundingClientRect();
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    var b = B.diag;
    if (px < b.x || px > b.x + b.w || py < b.y || py > b.y + b.h) return null;
    var g = diagGeom(b);
    return Math.atan2(-(py - g.cy), px - g.cx);
  }

  el.canvas.addEventListener('pointerdown', function (e) {
    if (!state.playing || state.act === 'quiz') return;
    var th = pointerTheta(e);
    if (th === null) return;
    state.drag = true;
    state.anim = null;
    el.hint.hidden = true;
    try { el.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 없어도 됨 */ }
    moveTo(th);
  });
  el.canvas.addEventListener('pointermove', function (e) {
    if (!state.drag) return;
    var th = pointerTheta(e);
    if (th !== null) moveTo(th);
  });
  function endDrag() { state.drag = false; }
  el.canvas.addEventListener('pointerup', endDrag);
  el.canvas.addEventListener('pointercancel', endDrag);

  function moveTo(th) {
    var delta = sdiff(th - state.theta);
    // 일식·월식 자리 가까이 오면 딱 붙여 줍니다 (손가락으로 정확히 맞추기 어려움)
    if (state.act === 'eclipse') {
      var t = state.theta + delta;
      if (Math.abs(sdiff(t)) < 0.06) delta -= sdiff(t);
      else if (Math.abs(sdiff(t - Math.PI)) < 0.08) delta -= sdiff(t - Math.PI);
    }
    setTheta(state.theta + delta, delta);
  }

  function animTo(target, dur, done, linear) {
    var to = state.theta + (linear ? target : sdiff(target - state.theta));
    if (!linear && to < state.theta) to += TWO_PI;    // 달은 앞으로만 돕니다
    state.anim = { from: state.theta, to: to, t: 0, dur: dur, done: done, linear: linear };
  }

  /* ---------- 놀이 ---------- */

  function startPhase() {
    el.score.textContent = '🌙';
    state.d = 0;
    state.theta = TODAY_AGE / SYNODIC * TWO_PI;
    state.phaseName = '';
    state.quiet = true;
    changed();
    state.quiet = false;
    el.ctrl.innerHTML = '';
    addCtrl('◀ 하루', function () { if (!state.anim) animTo(-TWO_PI / SYNODIC, 0.35, null, true); });
    addCtrl('하루 ▶', function () { if (!state.anim) animTo(TWO_PI / SYNODIC, 0.35, null, true); });
    addCtrl('📅 오늘', function () {
      state.anim = null;
      var delta = -state.d / SYNODIC * TWO_PI;
      setTheta(state.theta + delta, delta);
      state.d = 0;
      changed();
      speakPhase();
    });
    addCtrl('▶ 한 달 돌기', function () {
      if (state.anim) return;
      animTo(TWO_PI, 12, speakPhase, true);
      state.anim.silent = true;
    });
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 달을 끌어서 돌려 보세요';
    el.hint.hidden = false;
    var p = phaseOf(curAge());
    state.prompt = '오늘 달은 ' + p.name + '이에요. 달의 반쪽은 늘 해를 받아 밝아요. 달을 돌려 보세요.';
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function speakPhase() {
    var p = phaseOf(curAge());
    state.phaseName = p.name;
    state.prompt = p.say;
    speak(p.say);
  }

  function startEclipse() {
    el.score.textContent = '🌑';
    state.d = 0;
    state.theta = 1.2;
    state.eclSaid = '';
    el.ctrl.innerHTML = '';
    addCtrl('🌞 일식 만들기', function () { animTo(0, 1.6); });
    addCtrl('🌕 월식 만들기', function () { animTo(Math.PI, 1.6); });
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 달을 끌어서 한 줄로 세워 보세요';
    el.hint.hidden = false;
    setLabel('🌑 해·지구·달이 한 줄로 서면?');
    state.prompt = '달을 해와 지구 사이에 세우면 일식, 지구 뒤 그림자 속에 넣으면 월식이에요. 진짜로는 달의 길이 살짝 기울어서, 한 줄로 딱 서는 날은 1년에 몇 번뿐이에요.';
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
    state.art = q.art;
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
    el.endTitle.textContent = state.stars === total ? '달 박사!' : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  /* ---------- 놀이 진행 ---------- */

  function addCtrl(text, fn) {
    var b = document.createElement('button');
    b.className = 'chip';
    b.textContent = text;
    b.addEventListener('click', function () {
      if (window.SFX) SFX.tap();
      el.hint.hidden = true;
      fn(b);
    });
    el.ctrl.appendChild(b);
  }

  function say(text) {
    state.prompt = text;
    setLabel(text);
    speak(text);
  }

  function setLabel(text) { el.label.textContent = text; }

  function startGame() {
    state.playing = true;
    state.anim = null;
    state.art = null;
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
    if (state.act === 'phase') return startPhase();
    if (state.act === 'eclipse') return startEclipse();
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
    state.art = null;
    el.ctrl.hidden = true;
    el.cards.hidden = true;
    el.sky.classList.remove('small-sky', 'fill-sky');
    buildModeRow();
    el.startOverlay.hidden = false;
  });
  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '달의 반쪽은 늘 해를 받아 밝아요.'; } });
  });

  var back = Catalog.backHref('moon.html');
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

  state.theta = TODAY_AGE / SYNODIC * TWO_PI;
  buildModeRow();
  fit();
  setLabel('🌙 달');
  requestAnimationFrame(frame);
})();
