/* =========================================================================
 * 다니랜드 - 로켓 쏘기 (orbit.html)
 *
 * 우주 쓰레기·대기권을 본 아이에게 '왜 인공위성은 안 떨어져?' 를 그림으로 보여 주는 화면입니다 (2026-11-22).
 * 뉴턴의 대포 그대로 — 우주정거장 높이(400km)에서 옆으로 쏘는데, 빠르기를 아이가 정합니다.
 *   느리면 → 떨어집니다 (빠를수록 멀리)
 *   1초에 7.6km 쯤 → 떨어지는 동안 땅이 둥글게 비켜 가서 계속 돕니다 (= 인공위성)
 *   더 빠르면 → 길쭉하게 돌고, 1초에 10.9km 를 넘으면 → 지구가 못 붙잡아 멀리 날아갑니다
 * 글은 이름표·한두 문장뿐이고(아이가 '설명보다 그림' 을 좋아함) 캔버스 한 장에 그립니다 (라이브러리 없음).
 *
 * 놀이 2가지
 *   free    : 쏘아 보기 - 빠르기를 골라 마음대로 쏩니다. 지나간 길이 남아 견줘 볼 수 있습니다
 *   mission : 임무      - '빙글빙글 돌게' '멀리 날아가게' 같은 임무 여섯. 한 번에 맞히면 ⭐
 *
 * 진짜인 것
 *   - 지구 크기(반지름 6371km)·출발 높이(400km)·중력(GM = 398600 km³/s²) 그대로 뉴턴 법칙으로 날립니다(`step()`, 립프로그).
 *     그래서 도는 빠르기 7.67km/s · 떨어지지 않는 가장 느린 빠르기 7.56km/s · 날아가는 빠르기 10.85km/s 가 저절로 나옵니다.
 *     임무의 범위(`MISSIONS[].lo/hi`)는 이 숫자에서 정한 것이니 물리를 고치면 같이 보세요.
 *   - 그림의 지구와 길의 크기 비율도 진짜입니다 (화면이 멀어지며 길 전체가 들어오게 맞춥니다).
 * 진짜가 아닌 것
 *   - 공기는 없는 셈 칩니다 (400km 에서는 거의 없음 — 대기권 화면 참고). 땅에 닿으면 멈춥니다.
 *   - 시간은 수백 배 빠르게, 멀리 갈수록 더 빠르게 흐릅니다(`simRate`). 로켓 그림 크기도 진짜가 아닙니다.
 *
 * 기록 키는 daniland.best.orbit(카드의 ⭐)·daniland.best.orbit.mission, 마지막에 고른 놀이는 daniland.orbitAct.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.orbit';
  var ACT_KEY = 'daniland.orbitAct';
  var SPEED_KEY = 'daniland.orbitSpeed';
  var TWO_PI = Math.PI * 2;

  var GM = 398600;          // 지구 중력 (km³/s²)
  var R = 6371;             // 지구 반지름 (km)
  var R0 = R + 400;         // 출발 높이 — 우주정거장 높이
  var V_MAX = 13;
  var FAR = 16 * R;         // 이보다 멀어지면 '날아갔다'

  var ACTS = [
    { id: 'free',    name: '쏘아 보기', icon: '🚀', desc: '빠르기를 골라 쏘아 봐요' },
    { id: 'mission', name: '임무',      icon: '🎯', desc: '임무 여섯 개 — 알맞은 빠르기를 찾아요' }
  ];

  // 임무 — lo~hi 는 맞는 빠르기(1초에 km). 바깥이면 '더 빠르게/느리게' 로 알려 줍니다
  var MISSIONS = [
    { icon: '💥', q: '가까운 곳에 떨어뜨려 봐요', lo: 0, hi: 6.9,
      ok: '쿵! 느리면 금방 떨어져요.' },
    { icon: '🌏', q: '지구를 한참 돌아간 먼 곳에 떨어지게 해 봐요', lo: 7.3, hi: 7.55,
      ok: '와, 아주 멀리 가서 떨어졌어요! 빠를수록 멀리 가요.' },
    { icon: '🔄', q: '땅에 안 떨어지고 빙글빙글 돌게 해 봐요', lo: 7.6, hi: 10.8,
      ok: '빙글빙글! 이게 인공위성이에요.' },
    { icon: '⭕', q: '동그랗게 돌게 해 봐요', lo: 7.6, hi: 8.1,
      ok: '동그랗게 돌아요! 우주정거장이 이렇게 돌아요.' },
    { icon: '🥚', q: '길쭉하게 멀리까지 돌게 해 봐요', lo: 9.3, hi: 10.5,
      ok: '길쭉하게 돌아요! 멀리 갔다가 다시 돌아와요.' },
    { icon: '🌌', q: '지구를 떠나 멀리 날아가게 해 봐요', lo: 10.9, hi: V_MAX,
      ok: '슝! 지구가 못 붙잡을 만큼 빨라요.' }
  ];

  var TRAIL_COLORS = ['#ffd166', '#7fd8ff', '#ff8fab', '#9be15d', '#c9a7ff'];

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

  var savedSpeed = parseFloat(UI.loadValue(SPEED_KEY));
  var state = {
    act: UI.loadValue(ACT_KEY) || 'free',
    playing: false,
    speed: isFinite(savedSpeed) ? clamp(savedSpeed, 0, V_MAX) : 5,
    shot: null,          // 날고 있는 것 { x, y, vx, vy, path, turned, done, result }
    trails: [],          // 지난 길들 { path, color }
    shots: 0,
    view: 1.7 * R,       // 화면 반 폭에 들어갈 거리 (km)
    viewTarget: 1.7 * R,
    fx: [],
    mi: 0,
    stars: 0,
    firstTry: true,
    prompt: ''
  };
  if (!findAct(state.act)) state.act = 'free';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }

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

  // 지구 가운데 — 출발점(지구 위쪽)과 위 글이 안 겹치게 조금 아래로
  function center() { return { x: W / 2, y: H / 2 + Math.min(20, H * 0.04) }; }
  function scale() { return (Math.min(W, H) / 2 - 18) / state.view; }
  function toScreen(x, y) {
    var c = center(), s = scale();
    return { x: c.x + x * s, y: c.y - y * s };
  }

  var bgStars = (function () {
    var out = [];
    for (var i = 0; i < 160; i++) out.push({ x: Math.random(), y: Math.random(), a: 0.2 + Math.random() * 0.6, s: Math.random() < 0.1 ? 2 : 1, tw: Math.random() * 6 });
    return out;
  })();

  // 땅 무늬 — 지구 안의 둥근 덩어리 (가운데 기준 몫 x, y, 반지름)
  var LANDS = [[-0.42, -0.35, 0.22], [-0.25, -0.5, 0.18], [-0.5, -0.1, 0.14], [-0.3, 0.12, 0.16], [-0.22, 0.35, 0.12],
               [0.3, -0.42, 0.2], [0.5, -0.25, 0.16], [0.42, 0.05, 0.12], [0.2, 0.45, 0.17], [0.38, 0.55, 0.12], [0.02, -0.1, 0.07]];

  /* ---------- 날리기 ---------- */

  function launch() {
    var v = state.speed;
    if (state.shot && !state.shot.done) retire(state.shot);
    else if (state.shot) retire(state.shot);
    state.shot = {
      x: 0, y: R0, vx: v, vy: 0, v0: v,
      path: [[0, R0]], angle: 0, turned: 0, maxR: R0,
      done: false, result: null, t: 0, said: false,
      color: TRAIL_COLORS[state.shots % TRAIL_COLORS.length]
    };
    state.shots += 1;
    state.viewTarget = 1.7 * R;
    if (window.SFX) SFX.tap();
    if (window.TTS) TTS.cancel();
    state.fx.push({ kind: 'puff', x: 0, y: R0, t: 0 });
  }

  function retire(s) {
    state.trails.push({ path: s.path, color: s.color, result: s.result });
    if (state.trails.length > 4) state.trails.shift();
  }

  // 립프로그 한 걸음 (dt 초)
  function step(s, dt) {
    var r2 = s.x * s.x + s.y * s.y, r = Math.sqrt(r2), a = -GM / (r2 * r);
    s.vx += a * s.x * dt * 0.5; s.vy += a * s.y * dt * 0.5;
    s.x += s.vx * dt; s.y += s.vy * dt;
    r2 = s.x * s.x + s.y * s.y; r = Math.sqrt(r2); a = -GM / (r2 * r);
    s.vx += a * s.x * dt * 0.5; s.vy += a * s.y * dt * 0.5;
  }

  function advanceShot(dt) {
    var s = state.shot;
    if (!s || s.done) return;
    var r = Math.sqrt(s.x * s.x + s.y * s.y);
    // 멀리 갈수록 시간을 빨리 — 각속도가 비슷하게 보이도록
    var simRate = 650 * Math.pow(Math.max(r, R0) / R0, 1.5);
    var total = dt * simRate, n = Math.max(1, Math.ceil(total / 4)), h = total / n;
    for (var i = 0; i < n; i++) {
      var pa = Math.atan2(s.x, s.y);
      step(s, h);
      s.t += h;
      var na = Math.atan2(s.x, s.y), da = na - pa;
      if (da < -Math.PI) da += TWO_PI;
      if (da > Math.PI) da -= TWO_PI;
      s.turned += da;
      r = Math.sqrt(s.x * s.x + s.y * s.y);
      if (r > s.maxR) s.maxR = r;
      if (r <= R) {
        // 땅에 닿은 자리 — 지구 겉에 붙여 둡니다
        s.x *= R / r; s.y *= R / r;
        s.path.push([s.x, s.y]);
        finishShot(s, 'crash');
        return;
      }
      if (r > FAR && (s.vx * s.vx + s.vy * s.vy) / 2 - GM / r >= 0) { finishShot(s, 'escape'); return; }
    }
    var last = s.path[s.path.length - 1];
    var dx = s.x - last[0], dy = s.y - last[1];
    if (dx * dx + dy * dy > Math.pow(state.view * 0.006, 2)) s.path.push([s.x, s.y]);
    if (s.path.length > 2400) s.path.splice(1, 1);
    // 반 바퀴를 넘게 가고도 안 떨어지면 '돈다' 로 정합니다 (떨어지는 것은 다 반 바퀴 안에 떨어집니다 — 7.55km/s 가 156도)
    if (!s.result && s.turned >= Math.PI) {
      s.result = 'orbit';
      onResult(s);
    }
    // 화면이 길 전체를 담도록
    state.viewTarget = Math.max(state.viewTarget, Math.min(FAR, r * 1.12));
  }

  function finishShot(s, result) {
    s.done = true;
    if (!s.result) s.result = result;
    if (result === 'crash') {
      state.fx.push({ kind: 'boom', x: s.x, y: s.y, t: 0 });
      if (window.SFX) SFX.wrong();
    }
    if (!s.said) onResult(s);
  }

  /* ---------- 결과 ---------- */

  function landWord(s) {
    var deg = Math.abs(s.turned) * 180 / Math.PI;
    if (deg < 3) return '바로 아래로 떨어졌어요.';
    if (deg < 30) return '조금 가서 떨어졌어요.';
    if (deg < 90) return '멀리 가서 떨어졌어요.';
    return '아주아주 멀리 가서 떨어졌어요!';
  }

  function resultText(s) {
    if (s.result === 'crash') return '쿵! ' + landWord(s);
    if (s.result === 'escape') return '슝! 너무 빨라서 지구가 못 붙잡아요. 우주로 날아갔어요.';
    var e = s.v0 * s.v0 * R0 / GM - 1;
    if (e < 0.12) return '빙글빙글! 계속 떨어지는데, 땅이 둥글게 비켜 가서 안 닿아요. 이게 인공위성이에요.';
    return '빙글빙글! 길쭉하게 돌아요. 멀리 갔다가 다시 돌아와요.';
  }

  function onResult(s) {
    s.said = true;
    if (state.act === 'mission') return missionResult(s);
    if (s.result !== 'crash' && window.SFX) SFX.correct();
    say(resultText(s));
  }

  /* ---------- 임무 ---------- */

  function startMission() {
    state.mi = 0;
    state.stars = 0;
    el.score.textContent = '⭐ 0';
    askMission();
  }

  function askMission() {
    var m = MISSIONS[state.mi];
    state.firstTry = true;
    state.busy = false;
    state.trails = [];
    state.shot = null;
    state.viewTarget = 1.7 * R;
    setLabel(m.icon + ' ' + m.q + '  (' + (state.mi + 1) + '/' + MISSIONS.length + ')');
    state.prompt = m.q;
    setTimeout(function () { speak(m.q); }, 250);
  }

  function missionResult(s) {
    var m = MISSIONS[state.mi], v = s.v0;
    if (v >= m.lo - 1e-6 && v <= m.hi + 1e-6) {
      state.busy = true;
      if (window.SFX) SFX.correct();
      if (state.firstTry) { state.stars += 1; el.score.textContent = '⭐ ' + state.stars; }
      el.bar.style.width = Math.round((state.mi + 1) / MISSIONS.length * 100) + '%';
      state.prompt = '성공! ' + m.ok;
      setLabel('✅ ' + m.ok);
      // 도는 것은 한 바퀴 더 보여 주고 넘어갑니다
      speak(state.prompt, function () {
        setTimeout(function () {
          state.mi += 1;
          if (state.mi >= MISSIONS.length) finishMission();
          else askMission();
        }, 900);
      });
      return;
    }
    state.firstTry = false;
    if (window.SFX && s.result !== 'crash') SFX.wrong();
    var more = v < m.lo ? '조금 더 빠르게 쏘아 봐요.' : '조금 더 느리게 쏘아 봐요.';
    say(resultText(s) + ' ' + more);
  }

  function finishMission() {
    if (!state.playing || state.act !== 'mission') return;
    state.playing = false;
    var total = MISSIONS.length;
    UI.saveBest(BEST_KEY + '.mission', state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);
    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = state.stars === total ? '로켓 박사!' : '잘했어요!';
    el.endText.textContent = '임무 ' + total + '개를 다 해냈어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  /* ---------- 움직임·그리기 ---------- */

  var last = 0, clock = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    clock += dt;
    if (state.playing) advanceShot(dt);
    state.view += (state.viewTarget - state.view) * Math.min(1, dt * 2.5);
    state.fx = state.fx.filter(function (f) { f.t += dt; return f.t < 1.4; });
    if (W) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, W, H);
    bgStars.forEach(function (st) {
      ctx.globalAlpha = st.a * (0.75 + 0.25 * Math.sin(clock * 1.3 + st.tw));
      ctx.fillStyle = '#fff';
      ctx.fillRect(st.x * W, st.y * H, st.s, st.s);
    });
    ctx.globalAlpha = 1;

    drawGhostLine();
    drawEarth();
    state.trails.forEach(function (tr, i) {
      drawPath(tr.path, tr.color, 0.35 + 0.1 * i, 2);
    });
    var s = state.shot;
    if (s) drawPath(s.path.concat([[s.x, s.y]]), s.color, 0.95, 3);
    drawPad();
    if (s && !s.done) drawRocket(s);
    state.fx.forEach(drawFx);
    drawSpeedTag();
  }

  // 중력이 없으면 곧장 — 쏘는 쪽으로 점선
  function drawGhostLine() {
    if (state.act !== 'free') return;
    var a = toScreen(0, R0), b = toScreen(state.view * 3, R0);
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.restore();
    var lx = Math.min(W - 8, a.x + 90);
    ctx.font = '12px "Nanum Gothic", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    if (lx - a.x > 60) ctx.fillText('끌어당기지 않으면 →', lx, a.y - 6);
  }

  function drawEarth() {
    var c = toScreen(0, 0), r = R * scale();
    // 공기 — 100km
    var air = (R + 100) * scale();
    var g = ctx.createRadialGradient(c.x, c.y, r * 0.98, c.x, c.y, Math.max(air, r + 3));
    g.addColorStop(0, 'rgba(120,190,255,0.55)');
    g.addColorStop(1, 'rgba(120,190,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(air, r + 3), 0, TWO_PI); ctx.fill();
    // 바다
    var sea = ctx.createRadialGradient(c.x - r * 0.35, c.y - r * 0.35, r * 0.1, c.x, c.y, r);
    sea.addColorStop(0, '#4aa8ff');
    sea.addColorStop(1, '#1b4f9c');
    ctx.fillStyle = sea;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TWO_PI); ctx.fill();
    // 땅
    ctx.save();
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TWO_PI); ctx.clip();
    ctx.fillStyle = '#4fb36a';
    LANDS.forEach(function (L) {
      ctx.beginPath(); ctx.arc(c.x + L[0] * r, c.y + L[1] * r, L[2] * r, 0, TWO_PI); ctx.fill();
    });
    // 그늘
    var sh = ctx.createLinearGradient(c.x - r, c.y - r, c.x + r, c.y + r);
    sh.addColorStop(0.45, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,20,0.45)');
    ctx.fillStyle = sh;
    ctx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
    ctx.restore();
  }

  function drawPath(path, color, alpha, width) {
    if (path.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var i = 0; i < path.length; i++) {
      var p = toScreen(path[i][0], path[i][1]);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 출발점 — 우주정거장 높이의 작은 발사대 표시
  function drawPad() {
    var p = toScreen(0, R0), g = toScreen(0, R);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.setLineDash([]);
    if (!state.shot || state.shot.done) drawRocketAt(p.x, p.y, 0, 1);
    ctx.font = '11px "Nanum Gothic", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('400km', p.x - 14, p.y);
  }

  function drawRocket(s) {
    var p = toScreen(s.x, s.y);
    var ang = Math.atan2(-s.vy, s.vx);   // 화면 각
    drawRocketAt(p.x, p.y, ang, 1);
  }

  // 오른쪽(+x)을 보는 로켓을 ang 만큼 돌려 그립니다
  function drawRocketAt(x, y, ang, k) {
    var L = 18 * k;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (state.shot && !state.shot.done) {
      ctx.fillStyle = 'rgba(255,170,60,' + (0.6 + 0.4 * Math.random()) + ')';
      ctx.beginPath();
      ctx.moveTo(-L * 0.45, -L * 0.16);
      ctx.lineTo(-L * (0.85 + Math.random() * 0.3), 0);
      ctx.lineTo(-L * 0.45, L * 0.16);
      ctx.fill();
    }
    ctx.fillStyle = '#f2f4f8';
    ctx.beginPath();
    ctx.moveTo(L * 0.6, 0);
    ctx.quadraticCurveTo(L * 0.3, -L * 0.22, -L * 0.45, -L * 0.18);
    ctx.lineTo(-L * 0.45, L * 0.18);
    ctx.quadraticCurveTo(L * 0.3, L * 0.22, L * 0.6, 0);
    ctx.fill();
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.moveTo(-L * 0.2, -L * 0.18); ctx.lineTo(-L * 0.5, -L * 0.38); ctx.lineTo(-L * 0.45, -L * 0.12); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-L * 0.2, L * 0.18); ctx.lineTo(-L * 0.5, L * 0.38); ctx.lineTo(-L * 0.45, L * 0.12); ctx.fill();
    ctx.fillStyle = '#5ec8ff';
    ctx.beginPath(); ctx.arc(L * 0.15, 0, L * 0.08, 0, TWO_PI); ctx.fill();
    ctx.restore();
  }

  function drawFx(f) {
    var p = toScreen(f.x, f.y), k = f.t / 1.4;
    if (f.kind === 'boom') {
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.arc(p.x, p.y, 6 + k * 22, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 + k * 10, 0, TWO_PI); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = (1 - k) * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(p.x - 8 - k * 18, p.y, 3 + k * 8, 0, TWO_PI); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // 왼쪽 위 — 지금 고른 빠르기 (날고 있으면 지금 빠르기)
  function drawSpeedTag() {
    var s = state.shot, flying = s && !s.done;
    var v = flying ? Math.sqrt(s.vx * s.vx + s.vy * s.vy) : state.speed;
    var text = '1초에 ' + fmt(v) + 'km';
    ctx.font = '700 17px "Nanum Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    var w = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(10,14,32,0.75)';
    roundRect(8, 8, w, 30, 10);
    ctx.fill();
    ctx.fillStyle = flying ? s.color : '#ffd166';
    ctx.fillText(text, 18, 14);
    if (flying) {
      ctx.font = '12px "Nanum Gothic", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('지금 빠르기', 12, 44);
    }
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

  /* ---------- 단추 ---------- */

  var speedInput = null, speedText = null;

  function buildCtrl() {
    el.ctrl.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'orbit-speed';
    var minus = document.createElement('button');
    minus.className = 'chip';
    minus.textContent = '🐢';
    minus.title = '느리게';
    var plus = document.createElement('button');
    plus.className = 'chip';
    plus.textContent = '🐇';
    plus.title = '빠르게';
    speedInput = document.createElement('input');
    speedInput.type = 'range';
    speedInput.min = 0; speedInput.max = V_MAX; speedInput.step = 0.1;
    speedInput.value = state.speed;
    speedInput.setAttribute('aria-label', '빠르기');
    minus.addEventListener('click', function () { setSpeed(state.speed - 0.1); });
    plus.addEventListener('click', function () { setSpeed(state.speed + 0.1); });
    speedInput.addEventListener('input', function () { setSpeed(parseFloat(speedInput.value)); });
    box.appendChild(minus);
    box.appendChild(speedInput);
    box.appendChild(plus);
    el.ctrl.appendChild(box);

    var go = document.createElement('button');
    go.className = 'chip orbit-go';
    go.textContent = '🚀 쏘기';
    go.addEventListener('click', function () {
      if (!state.playing || state.busy) return;
      el.hint.hidden = true;
      launch();
    });
    el.ctrl.appendChild(go);
    if (state.act === 'free') {
      var clear = document.createElement('button');
      clear.className = 'chip';
      clear.textContent = '🧽 지우기';
      clear.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        state.trails = [];
        if (state.shot && state.shot.done) state.shot = null;
        state.viewTarget = 1.7 * R;
      });
      el.ctrl.appendChild(clear);
    }
    el.ctrl.hidden = false;
  }

  function setSpeed(v) {
    state.speed = clamp(Math.round(v * 10) / 10, 0, V_MAX);
    if (speedInput) speedInput.value = state.speed;
    UI.saveValue(SPEED_KEY, String(state.speed));
  }

  function say(text) {
    state.prompt = text;
    setLabel(text);
    speak(text);
  }

  function setLabel(text) { el.label.textContent = text; }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    state.shot = null;
    state.trails = [];
    state.fx = [];
    state.shots = 0;
    state.busy = false;
    state.view = state.viewTarget = 1.7 * R;
    el.bar.style.width = '0%';
    el.endOverlay.hidden = true;
    fit();
    buildCtrl();
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.hint.textContent = '👇 빠르기를 고르고 🚀 쏘기';
    el.hint.hidden = false;
    if (state.act === 'mission') return startMission();
    el.score.textContent = '🚀';
    setLabel('🚀 옆으로 쏘면 어떻게 될까?');
    state.prompt = '우주정거장 높이에서 로켓을 옆으로 쏘아요. 느리게도, 빠르게도 쏘아 봐요.';
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
      var best = a.id === 'mission' ? UI.readBest(BEST_KEY + '.mission') : null;
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
    state.shot = null;
    el.ctrl.hidden = true;
    buildModeRow();
    el.startOverlay.hidden = false;
  });
  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '로켓을 옆으로 쏘아요.'; } });
  });

  var back = Catalog.backHref('orbit.html');
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
  setLabel('🚀 로켓 쏘기');
  requestAnimationFrame(frame);
})();
