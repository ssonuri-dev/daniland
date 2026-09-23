/* =========================================================================
 * 다니랜드 - 별의 일생 (star.html)
 *
 * 핵심은 **별의 무게가 그 별의 끝을 정한다**는 것입니다. 무게를 고르면 그 별이 성운에서
 * 태어나 끝날 때까지 한 걸음씩 걸어가고, 그 모습을 캔버스에 직접 그립니다 (라이브러리 없음 —
 * 태양계 화면과 같은 규칙입니다).
 *
 * 크기가 곧 배우는 내용입니다
 *   별 → 적색거성 → 백색왜성 이 모두 같은 그림(art: 'star')이고 **반지름만 스르르 바뀝니다.**
 *   그래서 '부풀었다가 점만 하게 쪼그라든다' 가 글이 아니라 눈으로 보입니다.
 *   js/stars.js 의 r 값을 고칠 때는 이 비율이 깨지지 않는지 꼭 보세요.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   grow  : 별 키우기   - 무게를 고르면 그 별의 일생이 한 걸음씩 흘러갑니다 (점수 없음, 👀 4/4)
 *   order : 순서 맞추기 - 한 별의 일생 단계를 차례대로 누릅니다 (무게 네 가지 = 네 판)
 *   quiz  : 퀴즈       - 보기 넉 장 (js/stars.js 의 STAR_QUIZ)
 *
 * 기록 키는 daniland.best.star(카드의 ⭐)·daniland.best.star.<act>,
 * 마지막에 고른 놀이·무게는 daniland.starAct · daniland.starMass,
 * 끝까지 키워 본 별은 daniland.star.grown 입니다 (별 키우기의 👀 n/4).
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var QUIZ_ROUNDS = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '별 박사!'];

  var BEST_KEY = 'daniland.best.star';
  var ACT_KEY = 'daniland.starAct';
  var MASS_KEY = 'daniland.starMass';
  var GROWN_KEY = 'daniland.star.grown';

  var STAGES = window.STAR_STAGES || {};
  var PATHS = window.STAR_PATHS || [];

  var ACTS = [
    { id: 'grow',  name: '별 키우기',   icon: '🌱', desc: '무게를 고르면 그 별이 태어나서 끝날 때까지 보여 줘요' },
    { id: 'order', name: '순서 맞추기', icon: '🔢', desc: '별의 일생을 차례대로 눌러요' },
    { id: 'quiz',  name: '퀴즈',        icon: '❓', desc: '별에 대해 물어봐요' }
  ];

  var el = {
    sky: document.getElementById('sky'),
    canvas: document.getElementById('canvas'),
    steps: document.getElementById('steps'),
    story: document.getElementById('story'),
    photo: document.getElementById('photo'),
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
    massHint: document.getElementById('massHint'),
    massRow: document.getElementById('massRow'),
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
    mass: UI.loadValue(MASS_KEY) || 'sun',
    path: null,          // 지금 키우는 별
    step: 0,             // 그 별의 몇 번째 걸음인가
    playing: false,
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    deck: [],
    need: 0,             // 순서 맞추기에서 다음에 눌러야 할 자리
    prompt: '',
    grown: loadGrown()
  };

  if (!findAct(state.act)) state.act = 'grow';
  if (!findPath(state.mass)) state.mass = 'sun';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  function findPath(id) {
    for (var i = 0; i < PATHS.length; i++) if (PATHS[i].id === id) return PATHS[i];
    return null;
  }

  function loadGrown() {
    try {
      var v = JSON.parse(UI.loadValue(GROWN_KEY) || '[]');
      return (v && v.length) ? v : [];
    } catch (e) { return []; }
  }

  function markGrown(id) {
    for (var i = 0; i < state.grown.length; i++) if (state.grown[i] === id) return;
    state.grown.push(id);
    UI.saveValue(GROWN_KEY, JSON.stringify(state.grown));
  }

  // steps 의 한 칸을 { stage, title, text, ... } 한 덩어리로 펴 줍니다
  function stepOf(path, i) {
    var s = path.steps[i];
    var id = (typeof s === 'string') ? s : s.stage;
    var base = STAGES[id] || {};
    var out = {
      id: id,
      name: base.name, emoji: base.emoji, art: base.art, r: base.r, color: base.color,
      img: base.img, title: base.title, text: base.text
    };
    if (typeof s !== 'string') {
      if (s.title) out.title = s.title;
      if (s.text) out.text = s.text;
      if (s.img) out.img = s.img;
    }
    return out;
  }

  /* ---------- 캔버스 ---------- */

  var W = 0, H = 0, cx = 0, cy = 0, base = 200, dpr = 1;
  var pageEl = document.querySelector('.star-page');

  function fit() {
    if (pageEl) pageEl.style.height = (document.documentElement.clientHeight || window.innerHeight) + 'px';
    var w = el.sky.clientWidth, h = el.sky.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h; cx = w / 2; cy = h / 2;
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.width = w + 'px';
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    base = Math.min(w, h) / 2;
  }

  // 배경 별 — 화면에 고정입니다 (여기는 돌아다니는 화면이 아니라 한 별을 지켜보는 화면입니다)
  var bgStars = (function () {
    var out = [];
    for (var i = 0; i < 160; i++) {
      out.push({ x: Math.random(), y: Math.random(), a: 0.2 + Math.random() * 0.7,
                 s: (Math.random() < 0.1) ? 2 : 1, tw: Math.random() * 6 });
    }
    return out;
  })();

  // 지금 그리고 있는 모습 — 목표(target)를 향해 스르르 따라갑니다
  var shown = { r: 0.16, c1: '#fffbe8', c2: '#ffc93c', art: 'nebula' };
  var target = { r: 0.16, c1: '#fffbe8', c2: '#ffc93c', art: 'nebula' };
  var artAge = 0;      // 지금 그림으로 바뀐 지 얼마나 됐나 (폭발·껍데기가 이걸로 퍼집니다)

  function setArt(stage) {
    if (!stage) return;
    if (target.art !== stage.art) artAge = 0;
    target.art = stage.art;
    target.r = stage.r || 0;
    target.c1 = stage.color ? stage.color[0] : '#ffffff';
    target.c2 = stage.color ? stage.color[1] : '#ffc93c';
    shown.art = stage.art;
  }

  // '#ffc93c' 도 'rgb(255,201,60)' 도 읽습니다 — 한 번 섞고 나면 뒤엣것이 되기 때문입니다.
  // (이걸 안 하면 색이 NaN 이 되고, addColorStop 이 예외를 던져 그림이 통째로 멈춥니다)
  function hex(c) {
    if (c.indexOf('rgb') === 0) {
      var m = c.match(/-?\d+/g) || [0, 0, 0];
      return [parseInt(m[0], 10), parseInt(m[1], 10), parseInt(m[2], 10)];
    }
    var s = c.replace('#', '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }

  function mixColor(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' +
                    Math.round(x[1] + (y[1] - x[1]) * t) + ',' +
                    Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }

  var last = 0, clock = 0;

  function frame(now) {
    requestAnimationFrame(frame);   // 맨 앞에서 예약합니다 — 한 장 그리다 탈이 나도 멈추지 않게
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    clock += dt;
    artAge += dt;

    // 크기는 1.4초쯤에 걸쳐 따라갑니다 — 부풀고 쪼그라드는 것이 보여야 하니까요
    var k = Math.min(1, dt / 1.4 * 3);
    shown.r += (target.r - shown.r) * k;
    shown.c1 = mixColor(shown.c1, target.c1, k);
    shown.c2 = mixColor(shown.c2, target.c2, k);

    draw();
  }

  function draw() {
    if (!W) return;
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, W, H);

    var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    bg.addColorStop(0, 'rgba(46,56,120,0.20)');
    bg.addColorStop(1, 'rgba(4,5,12,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < bgStars.length; i++) {
      var s = bgStars[i];
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(clock * 1.6 + s.tw));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    var R = shown.r * base;
    if (shown.art === 'nebula') drawNebula();
    else if (shown.art === 'proto') drawProto(R);
    else if (shown.art === 'planetary') drawPlanetary(R);
    else if (shown.art === 'supernova') drawSupernova(R);
    else if (shown.art === 'neutron') drawNeutron(R);
    else if (shown.art === 'blackhole') drawBlackhole(R);
    else drawStarBall(R);
  }

  // 구름 — 큰 얼룩 여러 개를 겹쳐 놓고 아주 천천히 흔듭니다
  var blobs = (function () {
    var out = [];
    for (var i = 0; i < 9; i++) {
      out.push({ x: (Math.random() - 0.5) * 1.3, y: (Math.random() - 0.5) * 1.1,
                 r: 0.35 + Math.random() * 0.5, ph: Math.random() * 6 });
    }
    return out;
  })();

  function drawNebula() {
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var x = cx + (b.x + Math.sin(clock * 0.22 + b.ph) * 0.05) * base;
      var y = cy + (b.y + Math.cos(clock * 0.19 + b.ph) * 0.05) * base;
      var r = b.r * base;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(i % 2 ? shown.c1 : shown.c2, 0.30));
      g.addColorStop(1, 'rgba(10,8,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 아기별 — 구름 속에서 가운데가 빛나고 위아래로 가스를 뿜습니다
  function drawProto(R) {
    drawNebula();
    var jet = R * (5 + Math.sin(clock * 1.1) * 0.6);
    for (var s = -1; s <= 1; s += 2) {
      var g = ctx.createLinearGradient(cx, cy, cx, cy + s * jet);
      g.addColorStop(0, 'rgba(180,225,255,0.55)');
      g.addColorStop(1, 'rgba(160,210,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.5, cy);
      ctx.lineTo(cx + R * 0.5, cy);
      ctx.lineTo(cx + R * 2.2, cy + s * jet);
      ctx.lineTo(cx - R * 2.2, cy + s * jet);
      ctx.closePath();
      ctx.fill();
    }
    drawStarBall(R * (1 + Math.sin(clock * 2.2) * 0.05));
  }

  // 동그란 별 — 별 · 적색거성 · 백색왜성이 모두 이것이고 반지름만 다릅니다
  function drawStarBall(R) {
    if (R <= 0.4) return;
    var glow = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 3.6);
    glow.addColorStop(0, rgba(shown.c2, 0.30));
    glow.addColorStop(1, rgba(shown.c2, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 3.6, 0, Math.PI * 2);
    ctx.fill();

    var puff = 1 + Math.sin(clock * 0.9) * 0.012;
    var g = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, R * 0.08, cx, cy, R * puff);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, shown.c1);
    g.addColorStop(1, shown.c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * puff, 0, Math.PI * 2);
    ctx.fill();
  }

  // 껍데기 벗기 — 고리가 밖으로 퍼져 나가고 가운데에 작은 심지가 남습니다
  function drawPlanetary(R) {
    for (var i = 0; i < 3; i++) {
      var t = ((artAge * 0.32) + i / 3) % 1;
      var rr = (0.12 + t * 0.95) * base;
      ctx.strokeStyle = rgba(shown.c2, 0.45 * (1 - t));
      ctx.lineWidth = Math.max(2, base * 0.05 * (1 - t * 0.5));
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawStarBall(Math.max(R, 2.5));
  }

  // 초신성 — 번쩍한 뒤 충격파가 퍼지고 파편이 뻗어 나갑니다 (2.6초마다 되풀이)
  function drawSupernova(R) {
    var t = (artAge % 2.6) / 2.6;
    // 번쩍임은 처음 한 번만 — 되풀이하면 눈이 아픕니다. 그 뒤로는 충격파만 퍼집니다.
    var flash = (artAge < 2.6) ? Math.max(0, 1 - t * 4) : 0;

    if (flash > 0) {
      var f = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * (0.4 + flash * 1.4));
      f.addColorStop(0, 'rgba(255,255,255,' + (0.85 * flash).toFixed(2) + ')');
      f.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = f;
      ctx.fillRect(0, 0, W, H);
    }

    var rr = (0.1 + t * 1.15) * base;
    ctx.strokeStyle = rgba(shown.c2, 0.55 * (1 - t));
    ctx.lineWidth = Math.max(2, base * 0.09 * (1 - t));
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();

    for (var i = 0; i < 14; i++) {
      var a = (i / 14) * Math.PI * 2 + 0.3;
      ctx.strokeStyle = 'rgba(255,230,180,' + (0.4 * (1 - t)).toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * rr * 0.65, cy + Math.sin(a) * rr * 0.65);
      ctx.lineTo(cx + Math.cos(a) * rr * 1.05, cy + Math.sin(a) * rr * 1.05);
      ctx.stroke();
    }

    drawStarBall(Math.max(R * (1 - t) * 0.6, 2.5));
  }

  // 중성자별 — 아주 작고, 빠르게 돌면서 등대처럼 빛을 뿜습니다 (펄서)
  function drawNeutron(R) {
    var a = clock * 3.4;
    for (var s = 0; s < 2; s++) {
      var ang = a + s * Math.PI;
      var len = base * 1.3;
      var g = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      g.addColorStop(0, 'rgba(190,225,255,0.55)');
      g.addColorStop(1, 'rgba(150,200,255,0)');
      ctx.fillStyle = g;
      var w = 0.12;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang - w) * len, cy + Math.sin(ang - w) * len);
      ctx.lineTo(cx + Math.cos(ang + w) * len, cy + Math.sin(ang + w) * len);
      ctx.closePath();
      ctx.fill();
    }
    drawStarBall(Math.max(R, 3));
  }

  // 블랙홀 — 둘레를 도는 빛 고리 안쪽이 까맣게 뚫려 있습니다
  function drawBlackhole(R) {
    var ring = R * 2.6;
    var g = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, ring * 1.5);
    g.addColorStop(0, rgba(shown.c1, 0.0));
    g.addColorStop(0.42, rgba(shown.c1, 0.85));
    g.addColorStop(0.62, rgba(shown.c2, 0.55));
    g.addColorStop(1, rgba(shown.c2, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, ring * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 도는 느낌 — 고리 한쪽이 더 밝게 지나갑니다
    var a = clock * 0.8;
    var hot = ctx.createRadialGradient(cx + Math.cos(a) * ring, cy + Math.sin(a) * ring * 0.35, 0,
                                       cx + Math.cos(a) * ring, cy + Math.sin(a) * ring * 0.35, ring * 0.7);
    hot.addColorStop(0, 'rgba(255,255,230,0.45)');
    hot.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = hot;
    ctx.beginPath();
    ctx.arc(cx, cy, ring * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  function rgba(c, a) {
    if (c.indexOf('rgb') === 0) return c.replace('rgb(', 'rgba(').replace(')', ',' + a + ')');
    var v = hex(c);
    return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')';
  }

  /* ---------- 🌱 별 키우기 ---------- */

  function startGrow() {
    state.path = findPath(state.mass);
    state.step = 0;
    el.story.hidden = false;
    el.steps.hidden = false;
    el.cards.hidden = true;
    el.sky.classList.remove('small-sky');
    buildSteps();
    updateScore();
    showStep(0);
  }

  function buildSteps() {
    el.steps.innerHTML = '';
    for (var i = 0; i < state.path.steps.length; i++) {
      (function (i) {
        var s = stepOf(state.path, i);
        var b = document.createElement('button');
        b.className = 'step-chip';
        b.innerHTML = '<span class="sc-art">' + s.emoji + '</span><span class="sc-name">' + s.name + '</span>';
        b.addEventListener('click', function () { showStep(i); });
        el.steps.appendChild(b);
      })(i);
    }
  }

  function showStep(i) {
    state.step = i;
    var path = state.path;
    var s = stepOf(path, i);
    var lastStep = (i === path.steps.length - 1);

    setArt(s);

    Array.prototype.forEach.call(el.steps.children, function (c, k) {
      c.classList.toggle('on', k === i);
      c.classList.toggle('done', k < i);
    });

    el.storyTitle.textContent = s.title;
    el.storyText.textContent = s.text;
    el.photo.innerHTML = '';
    el.photo.appendChild(photoEl(s));
    el.nextBtn.textContent = lastStep ? '끝 🎉' : '다음 ▶';
    el.bar.style.width = Math.round(((i + 1) / path.steps.length) * 100) + '%';
    setLabel(path.icon + ' ' + path.name + ' · ' + s.name + ' (' + (i + 1) + '/' + path.steps.length + ')');

    state.prompt = s.title + '. ' + s.text;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);

    /* 다 읽으면 저절로 다음 걸음으로 — 일생이 이야기처럼 흘러갑니다 (단계 띠를 누르면 되돌아가요).
       그런데 기기에 우리말 목소리가 없으면 읽기가 곧바로 끝나 버려서 일생이 순식간에 지나갑니다.
       그래서 글자 수만큼은 무조건 머무르게 해 둡니다 — 소리가 없어도 글은 읽을 수 있어야 하니까요. */
    var startedAt = Date.now();
    var dwell = 2500 + state.prompt.length * 40;

    speak(state.prompt, function () {
      if (state.act !== 'grow' || state.step !== i) return;
      var wait = Math.max(1100, dwell - (Date.now() - startedAt));
      if (lastStep) setTimeout(function () { if (state.step === i) finishGrow(); }, wait);
      else setTimeout(function () { if (state.step === i) showStep(i + 1); }, wait);
    });
  }

  function photoEl(s) {
    if (!s.img) {
      var d = document.createElement('div');
      d.className = 'star-emoji';
      d.textContent = s.emoji;
      return d;
    }
    var im = document.createElement('img');
    im.src = s.img;
    im.alt = s.name;
    im.onerror = function () {
      var d = document.createElement('div');
      d.className = 'star-emoji';
      d.textContent = s.emoji;
      im.replaceWith(d);
    };
    return im;
  }

  el.nextBtn.addEventListener('click', function () {
    if (state.act !== 'grow') return;
    if (window.SFX) SFX.tap();
    if (state.step >= state.path.steps.length - 1) return finishGrow();
    showStep(state.step + 1);
  });

  function finishGrow() {
    markGrown(state.path.id);
    updateScore();
    if (window.SFX) SFX.finish();
    if (window.TTS) TTS.cancel();
    el.endTitle.textContent = state.path.icon + ' ' + state.path.name + '의 일생을 다 봤어요!';
    el.endStars.textContent = stepEmojis(state.path);
    el.endText.textContent = state.path.end + ' (별 키우기 ' + state.grown.length + '/' + PATHS.length + ')';
    el.endOverlay.hidden = false;
  }

  function stepEmojis(path) {
    var out = [];
    for (var i = 0; i < path.steps.length; i++) out.push(stepOf(path, i).emoji);
    return out.join(' ');
  }

  /* ---------- 🔢 순서 맞추기 ---------- */

  // 한 별의 일생에서 겹치는 단계를 뺀 차례 (작은 별은 같은 단계가 두 번 나옵니다)
  function orderOf(path) {
    var out = [], seen = {};
    for (var i = 0; i < path.steps.length; i++) {
      var s = stepOf(path, i);
      if (seen[s.id]) continue;
      seen[s.id] = true;
      out.push(s);
    }
    return out;
  }

  function askOrder(path) {
    state.path = path;
    state.need = 0;
    el.story.hidden = true;
    el.steps.hidden = true;
    el.cards.hidden = false;
    el.sky.classList.remove('small-sky');
    el.cards.className = 'cards star-cards order-cards';
    el.cards.innerHTML = '';

    var seq = orderOf(path);
    var mixed = UI.shuffle(seq.slice());

    mixed.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'choice star-card';
      b.innerHTML = '<div class="art">' + s.emoji + '</div><div class="lbl">' + s.name + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('done')) return;
        if (seq[state.need].id !== s.id) return orderMissed(b, seq[state.need]);
        orderHit(b, s, seq);
      });
      el.cards.appendChild(b);
    });

    setArt(STAGES.nebula);
    setLabel(path.icon + ' ' + path.name + ' 의 일생을 차례대로 눌러요 (' + (state.round + 1) + '/' + state.deck.length + ')');
    beginQuestion(orderAsk(path));
  }

  // '태양만 한 별이 태어나서 …' — 받침에 따라 조사가 달라집니다
  function orderAsk(path) {
    return josa(path.name, '이', '가') + ' 태어나서 끝날 때까지 차례대로 눌러 보세요.';
  }

  function orderHit(card, s, seq) {
    if (window.SFX) SFX.correct();
    card.classList.add('done');
    UI.addMark(card, String(state.need + 1));
    setArt(s);
    state.need += 1;

    if (state.need < seq.length) {
      el.bar.style.width = Math.round(((state.round + state.need / seq.length) / state.deck.length) * 100) + '%';
      return;
    }

    state.locked = true;
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    var why = state.path.end;
    setLabel('⭕ ' + state.path.name);
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
    el.sky.classList.add('small-sky');    // 보기 넉 장이 커야 해서 하늘을 줄입니다
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
    fit();

    if (state.act === 'grow') return startGrow();

    el.story.hidden = true;
    el.steps.hidden = true;
    state.deck = (state.act === 'order')
      ? UI.shuffle(PATHS.slice())
      : UI.shuffle((window.STAR_QUIZ || []).slice()).slice(0, QUIZ_ROUNDS);
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
    if (state.act === 'grow') el.score.textContent = '👀 ' + state.grown.length + '/' + PATHS.length;
    else el.score.textContent = '⭐ ' + state.stars;
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildModeRow();
  buildMassRow();

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

  function buildMassRow() {
    el.massRow.innerHTML = '';
    PATHS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + ((p.id === state.mass) ? ' on' : '');
      b.innerHTML = '<span class="mi">' + p.icon + '</span>' +
                    '<span class="mn">' + p.name + '</span>' +
                    '<span class="mb">' + p.sub + (isGrown(p.id) ? ' ✓' : '') + '</span>';
      b.addEventListener('click', function () {
        state.mass = p.id;
        UI.saveValue(MASS_KEY, p.id);
        Array.prototype.forEach.call(el.massRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.massRow.appendChild(b);
    });
  }

  function isGrown(id) {
    for (var i = 0; i < state.grown.length; i++) if (state.grown[i] === id) return true;
    return false;
  }

  function bestText(act) {
    if (act === 'grow') {
      return state.grown.length ? ('👀 ' + state.grown.length + '/' + PATHS.length) : '';
    }
    var best = UI.readBest(BEST_KEY + '.' + act);
    return best ? ('⭐ ' + best.stars + '/' + best.total) : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
    var grow = (state.act === 'grow');
    el.massHint.hidden = !grow;
    el.massRow.hidden = !grow;
  }

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    buildMassRow();
    startGame();
  });

  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '별의 일생이에요.'; } });
  });

  var back = Catalog.backHref('star.html');
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

  /* ---------- 소리 ---------- */

  function josa(word, a, b) {
    var ch = word.charCodeAt(word.length - 1);
    if (ch < 0xAC00 || ch > 0xD7A3) return word + b;
    return word + (((ch - 0xAC00) % 28) ? a : b);
  }

  // 태양계·나라 페이지와 같은 규칙 — 새 말이 시작되면 먼저 하던 말의 then 은 부르지 않습니다
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
      // 소리가 안 나는 기기에서는 글자 수만큼 읽을 시간을 줍니다 —
      // 그냥 짧게 두면 별 키우기가 순식간에 지나가 버립니다.
      setTimeout(once, Math.min(16000, 900 + text.length * 110));
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
  setArt(STAGES.nebula);
  updateScore();
  setLabel('별도 태어나고 나이를 먹어요');
  requestAnimationFrame(frame);
})();
