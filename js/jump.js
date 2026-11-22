/* =========================================================================
 * 다니랜드 - 행성에서 점프 (jump.html)
 *
 * '다른 행성에 가면 어떻게 될까' 를 몸으로 느끼게 하는 화면입니다 (2026-11-22). 다니(코디 놀이의 평상복 그림)가
 * 똑같은 힘으로 폴짝 뛰는데, 끌어당기는 힘(중력)이 약한 곳일수록 높이·오래 뜹니다. 저울 숫자도 같이 바뀝니다.
 * 글은 이름표·한두 문장뿐입니다 (아이가 '설명보다 그림' 을 좋아함). 캔버스 한 장, 라이브러리 없음.
 *
 * 놀이 3가지
 *   one  : 뛰어 보기 - 한 곳을 골라 뛰어요. 화면이 다니를 따라 올라가고 왼쪽에 m 눈금이 있습니다
 *   side : 나란히 뛰기 - 다섯 곳(지구·달·화성·목성·명왕성)에서 한꺼번에 뛰어 견줘요
 *   quiz : 퀴즈 - 네 곳 중 '가장 높이' '가장 낮게' '저울이 가장 가볍게' 를 골라요 (여덟 문제). 맞히면 넷이 같이 뜁니다
 *
 * 진짜인 것
 *   - 표면 중력(`WORLDS[].g`, m/s²) — 거대 행성(목성·토성·천왕성·해왕성)은 땅이 없어서 구름 꼭대기 값이고, 화면에도 그렇게 말합니다.
 *   - 뛰는 힘(처음 빠르기)은 어디서나 같고, 지구에서 30cm 뛰는 아이 기준입니다(`V0`). 그래서 높이는 g 에 반비례하고
 *     (달 1.8m · 명왕성 4.7m · 목성 12cm), 떠 있는 시간도 진짜 시간 그대로입니다 (명왕성에서는 8초 가까이 떠 있습니다).
 *   - 저울 숫자는 지구에서 20kg 인 아이가 그곳 저울에 올라섰을 때 나오는 값입니다 (몸은 그대로, 누르는 힘만 바뀜).
 * 진짜가 아닌 것
 *   - 다니 그림의 키는 1.1m 로 칩니다. 하늘·땅 색은 그곳 느낌만 낸 것입니다. 금성은 너무 뜨거워 진짜로는 못 서 있습니다(화면에서 말함).
 *
 * 퀴즈의 보기는 정답과 바로 옆 값이 1.3배 넘게 차이 날 때만 냅니다 — 수성(3.70)·화성(3.72)처럼 거의 같으면 정답이 둘이 됩니다.
 * 기록 키는 daniland.best.jump(카드의 ⭐)·daniland.best.jump.quiz, 마지막에 고른 놀이·곳은 daniland.jumpAct·daniland.jumpWorld.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.jump';
  var ACT_KEY = 'daniland.jumpAct';
  var WORLD_KEY = 'daniland.jumpWorld';
  var TWO_PI = Math.PI * 2;

  var G_EARTH = 9.81;
  var EARTH_JUMP = 0.3;                          // 지구에서 뛰는 높이 (m)
  var V0 = Math.sqrt(2 * G_EARTH * EARTH_JUMP);  // 뛰는 처음 빠르기 — 어디서나 같음
  var KID_H = 1.1;                               // 다니 키 (m)
  var KID_KG = 20;                               // 지구 저울 숫자
  var QUIZ_ROUNDS = 8;

  var ACTS = [
    { id: 'one',  name: '뛰어 보기',   icon: '🦘', desc: '한 곳을 골라 폴짝 뛰어 봐요' },
    { id: 'side', name: '나란히 뛰기', icon: '🏁', desc: '다섯 곳에서 한꺼번에 뛰어 봐요' },
    { id: 'quiz', name: '퀴즈',        icon: '❓', desc: '어디서 가장 높이 뛸까? 여덟 문제' }
  ];

  // 곳 — g 는 표면 중력(m/s²). gas 는 땅이 없는 곳(구름 꼭대기 값)
  var WORLDS = [
    { id: 'earth',   name: '지구',   icon: '🌍', g: 9.81,  sky: '#8fd3ff', ground: '#5cb85c', dark: false },
    { id: 'moon',    name: '달',     icon: '🌕', g: 1.62,  sky: '#05060f', ground: '#a8a8a8', dark: true },
    { id: 'mars',    name: '화성',   icon: '🔴', g: 3.72,  sky: '#d9a37a', ground: '#b5532e', dark: false },
    { id: 'jupiter', name: '목성',   icon: '🟠', g: 24.79, sky: '#d8b48a', ground: '#f0dcb8', dark: false, gas: true },
    { id: 'pluto',   name: '명왕성', icon: '⚪', g: 0.62,  sky: '#05060f', ground: '#e6d8c3', dark: true },
    { id: 'mercury', name: '수성',   icon: '🟤', g: 3.70,  sky: '#05060f', ground: '#8a7d72', dark: true },
    { id: 'venus',   name: '금성',   icon: '🟡', g: 8.87,  sky: '#d9b26a', ground: '#b07a3c', dark: false, hot: true },
    { id: 'saturn',  name: '토성',   icon: '🪐', g: 10.44, sky: '#e8d3a0', ground: '#f6e9c8', dark: false, gas: true },
    { id: 'uranus',  name: '천왕성', icon: '🔵', g: 8.69,  sky: '#9fe3e8', ground: '#d4f4f6', dark: false, gas: true },
    { id: 'neptune', name: '해왕성', icon: '🔷', g: 11.15, sky: '#3f6fd8', ground: '#a9c4f5', dark: false, gas: true }
  ];
  var SIDE = ['earth', 'moon', 'mars', 'jupiter', 'pluto'];

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

  var kid = new Image();
  kid.src = 'dress/costume-basic.png';
  var KID_SRC = { x: 100, y: 100, w: 400, h: 885 };   // 그림에서 아이가 있는 칸

  var state = {
    act: UI.loadValue(ACT_KEY) || 'one',
    world: UI.loadValue(WORLD_KEY) || 'moon',
    playing: false,
    cols: [],          // 뛰는 칸들 { w, y, v, air, t, peak, best, squash }
    cam: 0,            // 뛰어 보기 — 화면이 올라간 높이 (m)
    deck: [],
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    prompt: ''
  };
  if (!findAct(state.act)) state.act = 'one';
  if (!findWorld(state.world)) state.world = 'moon';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }
  function findWorld(id) {
    for (var i = 0; i < WORLDS.length; i++) if (WORLDS[i].id === id) return WORLDS[i];
    return null;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function peakOf(w) { return V0 * V0 / (2 * w.g); }
  function airOf(w) { return 2 * V0 / w.g; }
  function kgOf(w) { return KID_KG * w.g / G_EARTH; }
  function lenText(m) { return m < 1 ? Math.round(m * 100) + 'cm' : (Math.round(m * 10) / 10) + 'm'; }
  function lenSay(m) { return m < 1 ? Math.round(m * 100) + '센티미터' : (Math.round(m * 10) / 10) + '미터'; }
  function kgText(w) { var k = kgOf(w); return (k < 10 ? Math.round(k * 10) / 10 : Math.round(k)) + 'kg'; }
  function kgSay(w) { var k = kgOf(w); return (k < 10 ? Math.round(k * 10) / 10 : Math.round(k)) + '킬로그램'; }
  // 우리말 조사 — 받침이 있으면 a, 없으면 b
  function josa(word, a, b) {
    var c = word.charCodeAt(word.length - 1) - 0xac00;
    return word + (c >= 0 && c <= 11171 && c % 28 ? a : b);
  }

  function makeCol(w) { return { w: w, y: 0, v: 0, air: false, t: 0, best: 0, squash: 0 }; }

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
    for (var i = 0; i < 120; i++) out.push({ x: Math.random(), y: Math.random(), a: 0.25 + Math.random() * 0.6, s: Math.random() < 0.1 ? 2 : 1 });
    return out;
  })();

  /* ---------- 뛰기 ---------- */

  function jump(c) {
    if (c.air) return false;
    c.air = true;
    c.v = V0;
    c.t = 0;
    c.squash = 1;
    return true;
  }

  function advance(dt) {
    state.cols.forEach(function (c) {
      if (c.squash > 0) c.squash = Math.max(0, c.squash - dt * 4);
      if (!c.air) return;
      c.t += dt;
      // 진짜 시간 그대로 — 포물선 공식으로 (프레임이 끊겨도 높이가 정확)
      c.y = V0 * c.t - 0.5 * c.w.g * c.t * c.t;
      if (c.y > c.best) c.best = c.y;
      if (c.y <= 0 && c.t > 0.05) {
        c.y = 0;
        c.air = false;
        c.squash = 0.8;
        c.best = peakOf(c.w);
        if (c.onLand) { var f = c.onLand; c.onLand = null; f(c); }
      }
    });
    if (state.act === 'one' && state.cols[0]) {
      // 화면이 다니를 따라 올라감 — 머리가 화면 위 25% 를 넘으면
      var c = state.cols[0], ppm = onePpm(), ground = H - 54;
      var target = Math.max(0, (c.y + KID_H) - (ground - H * 0.22) / ppm);
      state.cam += ((c.air ? target : 0) - state.cam) * Math.min(1, dt * (c.air ? 12 : 4));
    }
  }

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    advance(dt);
    if (W) draw();
  }

  /* ---------- 그리기 ---------- */

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!state.cols.length) {
      ctx.fillStyle = '#05060f';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (state.act === 'one') drawOne();
    else drawSide();
  }

  function onePpm() { return clamp(H * 0.3, 70, 170) / KID_H; }

  function drawOne() {
    var c = state.cols[0], w = c.w, ppm = onePpm();
    var ground = H - 54 + state.cam * ppm;
    drawSky(w, 0, 0, W, H, ground);
    // m 눈금 — 왼쪽
    ctx.font = '12px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (var m = 0.5; m < 12; m += 0.5) {
      var y = ground - m * ppm;
      if (y < -10) break;
      if (y > ground - 2) continue;
      var whole = Math.abs(m - Math.round(m)) < 0.01;
      ctx.strokeStyle = w.dark ? 'rgba(255,255,255,0.35)' : 'rgba(20,30,60,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(whole ? 22 : 12, y); ctx.stroke();
      if (whole) {
        ctx.fillStyle = w.dark ? 'rgba(255,255,255,0.75)' : 'rgba(20,30,60,0.75)';
        ctx.fillText(m + 'm', 26, y);
      }
    }
    drawGround(w, 0, W, ground);
    var x = W / 2;
    drawPeak(c, x, ground, ppm, Math.min(W * 0.36, 160));
    drawKid(x, ground - c.y * ppm, KID_H * ppm, c, ground);
    // 이름 · 저울 · 떠 있는 시간
    drawTag(w.icon + ' ' + w.name, W - 10, 12, 'right', 17);
    drawScale(W - 12, H - 12, w);
    if (c.air) drawTag('⏱ ' + c.t.toFixed(1) + '초', 10, 12, 'left', 15);
  }

  function drawSide() {
    var n = state.cols.length, cw = W / n;
    var maxPeak = 0;
    state.cols.forEach(function (c) { maxPeak = Math.max(maxPeak, peakOf(c.w)); });
    var top = 26, bottom = H - 38;
    var ppm = (bottom - top) / (maxPeak + KID_H * 1.05);
    var kidPx = KID_H * ppm;
    state.cols.forEach(function (c, i) {
      var x0 = i * cw, w = c.w;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, 0, cw, H); ctx.clip();
      drawSky(w, x0, 0, cw, H, bottom);
      drawGround(w, x0, cw, bottom);
      drawPeak(c, x0 + cw / 2, bottom, ppm, cw * 0.42);
      drawKid(x0 + cw / 2, bottom - c.y * ppm, kidPx, c, bottom);
      ctx.restore();
      // 이름
      ctx.font = '800 ' + (cw < 80 ? 12 : 14) + 'px "Nanum Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#10131f';
      ctx.fillText(w.icon + ' ' + w.name, x0 + cw / 2, bottom + 19);
      if (i > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x0 - 1, 0, 2, H);
      }
    });
  }

  function drawSky(w, x, y, ww, hh, ground) {
    ctx.fillStyle = w.sky;
    ctx.fillRect(x, y, ww, hh);
    if (w.dark) {
      bgStars.forEach(function (s) {
        var sx = x + s.x * ww, sy = s.y * hh;
        if (sy > ground) return;
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx, sy, s.s, s.s);
      });
      ctx.globalAlpha = 1;
    } else {
      // 위로 갈수록 조금 짙게
      var g = ctx.createLinearGradient(0, 0, 0, hh);
      g.addColorStop(0, 'rgba(0,0,40,0.22)');
      g.addColorStop(1, 'rgba(255,255,255,0.12)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, ww, hh);
    }
  }

  function drawGround(w, x, ww, ground) {
    if (ground > H + 2) return;
    ctx.fillStyle = w.ground;
    ctx.fillRect(x, ground, ww, H - ground + 2);
    if (w.gas) {
      // 구름 꼭대기 — 둥글둥글한 띠
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (var i = 0; i < ww / 26 + 1; i++) {
        ctx.beginPath(); ctx.arc(x + i * 26 + 8, ground + 2, 15, Math.PI, 0); ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (var j = 0; j < ww / 40 + 1; j++) {
        ctx.beginPath(); ctx.ellipse(x + j * 40 + 14, ground + 14 + (j % 2) * 8, 9, 3, 0, 0, TWO_PI); ctx.fill();
      }
    }
  }

  // 가장 높이 간 자리 — 발이 닿은 높이에 점선 (왼쪽 m 눈금과 같은 기준), 글은 오른쪽 끝
  function drawPeak(c, x, ground, ppm, half) {
    if (c.best <= 0.005) return;
    var y = ground - c.best * ppm;
    var dark = c.w.dark;
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = dark ? 'rgba(255,209,102,0.8)' : 'rgba(150,60,0,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - half, y); ctx.lineTo(x + half, y); ctx.stroke();
    ctx.restore();
    ctx.font = '800 14px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = dark ? '#ffd166' : '#8a3a00';
    ctx.fillText('↑ ' + lenText(c.best), x + half, y - 3);
  }

  function drawKid(x, footY, hPx, c, ground) {
    var sq = c.squash * (c.air ? -0.08 : 0.12);    // 땅에서 눌리고, 뛰어오를 때 늘어남
    var h = hPx * (1 - sq), w = hPx * (KID_SRC.w / KID_SRC.h) * (1 + sq * 0.7);
    // 그림자 — 땅에 남아 높이 뜰수록 작아짐
    var k = clamp(1 - c.y / 3, 0.35, 1);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.2 * k) + ')';
    ctx.beginPath(); ctx.ellipse(x, ground + 2, w * 0.32 * k, 4 * k, 0, 0, TWO_PI); ctx.fill();
    if (kid.complete && kid.naturalWidth) {
      ctx.drawImage(kid, KID_SRC.x, KID_SRC.y, KID_SRC.w, KID_SRC.h, x - w / 2, footY - h, w, h);
    } else {
      ctx.font = Math.round(h * 0.6) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🧒', x, footY);
    }
  }

  function drawTag(text, x, y, align, size) {
    ctx.font = '800 ' + size + 'px "Nanum Gothic", sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    var w = ctx.measureText(text).width + 18;
    var bx = align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(10,14,32,0.72)';
    roundRect(bx, y - 4, w, size + 14, 9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, align === 'right' ? x - 9 : x + 9, y + 3);
  }

  // 저울 — 오른쪽 아래
  function drawScale(x, y, w) {
    var bw = 112, bh = 44, bx = x - bw, by = y - bh;
    ctx.fillStyle = '#f4f6fb';
    roundRect(bx, by, bw, bh, 10); ctx.fill();
    ctx.strokeStyle = '#9aa3b8';
    ctx.lineWidth = 2;
    roundRect(bx, by, bw, bh, 10); ctx.stroke();
    ctx.fillStyle = '#1d2a44';
    roundRect(bx + 10, by + 8, bw - 20, bh - 16, 6); ctx.fill();
    ctx.font = '800 17px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7dffb0';
    ctx.fillText('⚖️ ' + kgText(w), bx + bw / 2, by + bh / 2 + 1);
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

  /* ---------- 누르기 ---------- */

  el.canvas.addEventListener('pointerdown', function () {
    if (!state.playing || state.act === 'quiz') return;
    el.hint.hidden = true;
    jumpAll();
  });

  function jumpAll() {
    var any = false;
    state.cols.forEach(function (c) { if (jump(c)) any = true; });
    if (!any) return;
    if (window.SFX) SFX.tap();
    if (state.act === 'one') {
      var c = state.cols[0];
      c.onLand = function () { landSay(c.w); };
    } else if (state.act === 'side') {
      var lastCol = null;
      state.cols.forEach(function (c) { if (!lastCol || airOf(c.w) > airOf(lastCol.w)) lastCol = c; });
      lastCol.onLand = function () {
        say('명왕성에서 가장 높이, 가장 오래 떠 있었어요. 목성에서는 거의 못 뛰어요.');
      };
    }
  }

  function landSay(w) {
    var h = peakOf(w), k = h / EARTH_JUMP, text = lenSay(h) + ' 뛰었어요!';
    if (w.id === 'earth') text += ' 지구에서는 이만큼이에요.';
    else if (k >= 1.5) text += ' 지구보다 ' + Math.round(k) + '배나 높아요.';
    else if (k <= 0.7) text += ' 지구보다 낮아요. 꽉 끌어당겨서 무거워요.';
    else text += ' 지구랑 비슷해요.';
    say(text);
  }

  /* ---------- 놀이: 뛰어 보기 ---------- */

  function startOne() {
    el.score.textContent = '🦘';
    el.ctrl.innerHTML = '';
    WORLDS.forEach(function (w) {
      var b = document.createElement('button');
      b.className = 'chip' + (w.id === state.world ? ' on' : '');
      b.textContent = w.icon + ' ' + w.name;
      b.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        state.world = w.id;
        UI.saveValue(WORLD_KEY, w.id);
        Array.prototype.forEach.call(el.ctrl.querySelectorAll('.chip.world'), function (x) { x.classList.toggle('on', x === b); });
        goWorld(w);
      });
      b.classList.add('world');
      el.ctrl.appendChild(b);
    });
    var go = document.createElement('button');
    go.className = 'chip jump-go';
    go.textContent = '🦘 뛰기';
    go.addEventListener('click', function () { el.hint.hidden = true; jumpAll(); });
    el.ctrl.appendChild(go);
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 화면을 누르면 폴짝!';
    el.hint.hidden = false;
    goWorld(findWorld(state.world), true);
  }

  function goWorld(w, first) {
    state.cols = [makeCol(w)];
    state.cam = 0;
    setLabel(w.icon + ' ' + w.name + ' — 저울 ' + kgText(w));
    var text = w.name + '에 왔어요. 저울에 올라가면 ' + kgSay(w) + '이에요.';
    if (w.gas) text += ' ' + josa(w.name, '은', '는') + ' 땅이 없어서, 구름 꼭대기에 섰다고 쳐요.';
    if (w.hot) text += ' 금성은 너무 뜨거워서 진짜로는 못 가요.';
    if (first) text = '똑같은 힘으로 뛰어 봐요. ' + text;
    state.prompt = text;
    setTimeout(function () { speak(text); }, first ? 300 : 0);
  }

  /* ---------- 놀이: 나란히 뛰기 ---------- */

  function startSide() {
    el.score.textContent = '🏁';
    state.cols = SIDE.map(function (id) { return makeCol(findWorld(id)); });
    el.ctrl.innerHTML = '';
    var go = document.createElement('button');
    go.className = 'chip jump-go';
    go.textContent = '🦘 다 같이 뛰기';
    go.addEventListener('click', function () { el.hint.hidden = true; jumpAll(); });
    el.ctrl.appendChild(go);
    el.ctrl.hidden = false;
    el.hint.textContent = '👉 화면을 누르면 다 같이 폴짝!';
    el.hint.hidden = false;
    setLabel('🏁 똑같은 힘으로 다 같이 뛰어요');
    state.prompt = '다섯 곳에서 똑같은 힘으로 다 같이 뛰어 봐요. 어디가 가장 높을까요?';
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  /* ---------- 놀이: 퀴즈 ---------- */

  var KINDS = [
    { q: '어디에서 가장 높이 뛸까요?',          pick: 'low',  why: function (w) { return josa(w.name, '은', '는') + ' 끌어당기는 힘이 가장 약해서 가장 높이 뛰어요.'; } },
    { q: '어디에서 가장 낮게 뛸까요?',          pick: 'high', why: function (w) { return josa(w.name, '은', '는') + ' 끌어당기는 힘이 가장 세서 조금밖에 못 뛰어요.'; } },
    { q: '저울에 올라가면 어디가 가장 가볍게 나올까요?', pick: 'low', why: function (w) { return w.name + '에서는 저울이 ' + kgSay(w) + '이에요. 몸은 그대로인데 덜 끌어당겨요.'; } },
    { q: '저울에 올라가면 어디가 가장 무겁게 나올까요?', pick: 'high', why: function (w) { return w.name + '에서는 저울이 ' + kgSay(w) + '이에요. 꽉 끌어당겨요.'; } },
    { q: '어디에서 가장 오래 떠 있을까요?',      pick: 'low',  why: function (w) { return w.name + '에서는 ' + Math.round(airOf(w) * 10) / 10 + '초나 떠 있어요.'; } }
  ];

  function makeQuestion(kind) {
    for (var tries = 0; tries < 200; tries++) {
      var four = UI.shuffle(WORLDS.slice()).slice(0, 4);
      var sorted = four.slice().sort(function (a, b) { return a.g - b.g; });
      var ans, near;
      if (kind.pick === 'low') { ans = sorted[0]; near = sorted[1]; }
      else { ans = sorted[3]; near = sorted[2]; }
      var ratio = Math.max(ans.g, near.g) / Math.min(ans.g, near.g);
      if (ratio >= 1.3) return { kind: kind, worlds: four, ans: ans };
    }
    return null;
  }

  function startQuiz() {
    el.ctrl.hidden = true;
    el.ctrl.innerHTML = '';
    el.hint.hidden = true;
    el.cards.hidden = false;
    el.sky.classList.add('small-sky', 'fill-sky');
    el.score.textContent = '⭐ 0';
    state.round = 0;
    state.deck = [];
    for (var i = 0; i < QUIZ_ROUNDS; i++) {
      var q = makeQuestion(KINDS[i % KINDS.length]);
      if (q) state.deck.push(q);
    }
    state.deck = UI.shuffle(state.deck);
    setTimeout(fit, 0);
    nextRound();
  }

  function askQuiz(q) {
    state.cols = q.worlds.map(function (w) { return makeCol(w); });
    el.cards.className = 'cards star-cards ans-cards';
    el.cards.innerHTML = '';
    q.worlds.forEach(function (w) {
      var b = document.createElement('button');
      b.className = 'choice space-card';
      b.innerHTML = '<div class="text">' + w.icon + ' ' + w.name + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (w !== q.ans) return quizMissed(b);
        quizCorrect(b, q);
      });
      el.cards.appendChild(b);
    });
    setLabel(q.kind.q + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
    state.prompt = q.kind.q;
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
    // 넷이 다 같이 뛰어 보여 줍니다
    state.cols.forEach(function (c) { jump(c); });
    var why = q.kind.why(q.ans);
    setLabel(why);
    state.prompt = why;
    var landed = false, spoke = false;
    function go() { if (landed && spoke) setTimeout(nextRound, 300); }
    var slowest = null;
    state.cols.forEach(function (c) { if (!slowest || airOf(c.w) > airOf(slowest.w)) slowest = c; });
    // 아주 오래 뜨는 곳(명왕성 8초)은 다 기다리지 않습니다
    var wait = Math.min(airOf(slowest.w), 4.5);
    setTimeout(function () { landed = true; go(); }, wait * 1000);
    speak(why, function () { spoke = true; go(); });
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
    el.endTitle.textContent = state.stars === total ? '점프 박사!' : '잘했어요!';
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
    state.cols = [];
    state.cam = 0;
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
    if (state.act === 'one') return startOne();
    if (state.act === 'side') return startSide();
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
    state.cols = [];
    el.ctrl.hidden = true;
    el.cards.hidden = true;
    el.sky.classList.remove('small-sky', 'fill-sky');
    buildModeRow();
    el.startOverlay.hidden = false;
  });
  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '달에서 폴짝 뛰어 봐요.'; } });
  });

  var back = Catalog.backHref('jump.html');
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
  setLabel('🦘 행성에서 점프');
  requestAnimationFrame(frame);
})();
