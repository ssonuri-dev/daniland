/* =========================================================================
 * 다니랜드 - 전기 회로 (circuit.html)
 *
 * 판 위에 전지·전구·스위치가 놓여 있고, **단자(동그란 쇠)에서 단자로 끌면 전선이 생깁니다**
 * (눌렀다 떼고 다른 단자를 눌러도 됩니다). 전선을 누르면 떨어지고, 스위치는 누르면 켜졌다 꺼집니다.
 *
 * 불이 켜지는지는 손으로 정하지 않고 **진짜로 계산합니다** — 전선·전구·스위치를 저항으로,
 * 전지를 1.5V 와 속저항으로 두고 마디 전압을 풉니다(`solve()`, 가우스 소거). 그래서
 *   - 전지 둘을 + 와 - 끼리 이으면 두 배로 밀어 더 밝고, 거꾸로 이으면 서로 막아 꺼집니다.
 *   - 전구 둘을 한 줄로 이으면(직렬) 둘 다 어둡고, 갈래로 이으면(병렬) 둘 다 밝습니다.
 *   - 전구 없이 전선만 전지에 이으면 전기가 왈칵 흘러 '합선' 이 됩니다 (전지가 빨갛게).
 *   - 연필심(흑연)은 금속보다 저항이 커서 불이 흐리게 켜집니다.
 * 이 결과를 임무 문장에 맞춰 손으로 고치지 마세요 — 숫자(저항 값)를 고치세요.
 *
 * 전선 위의 노란 알갱이는 전기가 흐르는 방향(+ 에서 나와 - 로)과 세기를 보여 줍니다.
 * 읽어 주는 글에는 + - 기호 대신 '플러스'·'마이너스' 를 씁니다 — 목소리에 따라 기호를 건너뜁니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   build : 불 켜기  - 임무 넷 (MISSIONS). 합선 없이 해내면 ⭐
 *   test  : 통할까?  - 끊긴 자리에 끼울 물건이 켜질지 먼저 맞혀 보고 끼워 봅니다 (ITEMS, 열 문제)
 *   free  : 마음대로 - 전지 둘·전구 둘·스위치로 아무렇게나 (점수 없음)
 *
 * 기록 키는 daniland.best.circuit(카드의 ⭐)·daniland.best.circuit.<act>, 마지막 놀이는 daniland.circuitAct.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var TEST_ROUNDS = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '꼬마 과학자!'];

  var BEST_KEY = 'daniland.best.circuit';
  var ACT_KEY = 'daniland.circuitAct';

  var ACTS = [
    { id: 'build', name: '불 켜기', icon: '💡', desc: '전선을 이어서 임무 넷을 해결해요' },
    { id: 'test',  name: '통할까?', icon: '🔎', desc: '끊긴 자리에 물건을 끼우면 불이 켜질까요? 먼저 맞혀 봐요' },
    { id: 'free',  name: '마음대로', icon: '🔧', desc: '전지 둘·전구 둘·스위치를 마음대로 이어 봐요' }
  ];

  /* ---------- 전기 숫자 ----------
   * 전지 1.5V · 속저항 0.5Ω, 전구 10Ω, 전선·닫힌 스위치·쇠 0.01Ω, 연필심 10Ω.
   * 전지 하나에 전구 하나면 전구 힘(P = I²R)이 0.2W 쯤이고, 이것을 '밝기 1' 로 잡습니다. */
  var V_BATT = 1.5, R_BATT = 0.5, R_BULB = 10, G_WIRE = 100, R_LEAD = 10;
  var P_ONE = 0.2;           // 밝기 1
  var LIT_P = 0.01;          // 이보다 작으면 꺼진 것으로 봅니다
  var SHORT_I = 1.0;         // 전지에서 이보다 많이 흐르면 합선 (전구 하나일 때 0.14A)

  /* ---------- 임무 ----------
   * x, y 는 판의 가로·세로 비율(0~1)이고, 세로로 긴 화면(폰)에서는 p 의 자리를 씁니다.
   * steps 는 차례대로 풀어야 하는 목표이고, r 은 solve() 의 결과입니다. */
  var MISSIONS = [
    {
      id: 'one', icon: '💡',
      parts: [
        { id: 'B1', type: 'battery', x: 0.3, y: 0.62, p: [0.5, 0.75] },
        { id: 'L1', type: 'bulb', x: 0.68, y: 0.42, p: [0.5, 0.32] }
      ],
      steps: [
        { say: '전구에 불을 켜 봐요! 동그란 쇠에서 쇠로 끌어서 전선을 이어요.',
          goal: function (r) { return r.lit.L1; } }
      ],
      hint: '전기는 빙 돌아 다시 전지로 돌아올 길이 있어야 흘러요. 전지의 두 끝이 모두 전구에 이어졌나 봐요.',
      done: '불이 켜졌어요! 전기가 전지의 플러스 쪽에서 나와 전구를 지나 마이너스 쪽으로 빙 돌아왔어요. 이렇게 빙 도는 길을 회로라고 해요.'
    },
    {
      id: 'switch', icon: '🔘',
      parts: [
        { id: 'B1', type: 'battery', x: 0.25, y: 0.66, p: [0.32, 0.78] },
        { id: 'L1', type: 'bulb', x: 0.5, y: 0.34, p: [0.5, 0.3] },
        { id: 'S1', type: 'switch', x: 0.76, y: 0.66, p: [0.7, 0.62], on: false }
      ],
      steps: [
        { say: '스위치도 길에 넣어서 불을 켜 봐요. 스위치는 누르면 붙고 떨어져요.',
          goal: function (r) { return r.lit.L1 && r.flow.S1; } },
        { say: '이제 스위치를 눌러서 불을 꺼 봐요.',
          goal: function (r, m) { return !r.lit.L1 && !part('S1').on && wired('S1'); } }
      ],
      hint: '스위치의 두 끝도 전선으로 이어야 해요. 전지 → 전구 → 스위치 → 전지, 한 바퀴!',
      done: '스위치는 길을 끊었다 이었다 하는 문이에요. 길이 끊기면 전기가 못 돌아서 불이 꺼져요. 집의 전등 스위치도 똑같아요.'
    },
    {
      id: 'two', icon: '🔋',
      parts: [
        { id: 'B1', type: 'battery', x: 0.27, y: 0.4, p: [0.3, 0.6] },
        { id: 'B2', type: 'battery', x: 0.27, y: 0.75, p: [0.3, 0.84] },
        { id: 'L1', type: 'bulb', x: 0.7, y: 0.45, p: [0.62, 0.28] }
      ],
      steps: [
        { say: '전지 두 개를 다 써서 전구를 더 밝게 켜 봐요.',
          goal: function (r) { return r.bright.L1 > 1.5; } }
      ],
      hint: '한 전지의 플러스를 다른 전지의 마이너스에 이어서 전지를 한 줄로 세워 봐요.',
      done: '전지 둘을 플러스와 마이너스끼리 이어 한 줄로 세우면 전기를 미는 힘이 두 배가 돼서 훨씬 밝아요.'
    },
    {
      id: 'twobulb', icon: '💡💡',
      parts: [
        { id: 'B1', type: 'battery', x: 0.25, y: 0.7, p: [0.5, 0.84] },
        { id: 'L1', type: 'bulb', x: 0.5, y: 0.36, p: [0.27, 0.36] },
        { id: 'L2', type: 'bulb', x: 0.78, y: 0.36, p: [0.73, 0.36] }
      ],
      steps: [
        { say: '전지 하나로 전구 두 개를 다 켜 봐요.',
          goal: function (r) { return r.lit.L1 && r.lit.L2; } }
      ],
      hint: '전기가 두 전구를 다 지나서 전지로 돌아와야 해요.',
      done: function (r) {
        if (r.bright.L1 < 0.7 && r.bright.L2 < 0.7) {
          return '전구 둘을 한 줄로 이었네요(직렬). 전기가 두 전구를 차례로 지나느라 둘 다 조금 어두워요. 갈래 길로 따로따로 이으면 어떨까요?';
        }
        return '전구 둘을 갈래 길로 따로따로 이었네요(병렬). 둘 다 밝아요! 그 대신 전지가 더 빨리 닳아요.';
      }
    }
  ];

  /* ---------- 통할까? 물건 ----------
   * c: 'metal' 쇠붙이(잘 통함) · 'lead' 연필심(조금 통함 — 흐리게 켜짐) · 'none' 안 통함.
   * 물기·소금이 있어 애매한 것(과일·젖은 것·물)은 넣지 않습니다 — 정답이 둘이 됩니다. */
  var ITEMS = [
    { e: '📎', n: '클립', c: 'metal', why: '클립은 쇠로 만들어서 전기가 잘 지나가요.' },
    { e: '🪙', n: '동전', c: 'metal', why: '동전은 구리 같은 금속이라 전기가 잘 지나가요.' },
    { e: '🔑', n: '열쇠', c: 'metal', why: '열쇠는 금속이라 전기가 잘 지나가요.' },
    { e: '🥄', n: '쇠숟가락', c: 'metal', why: '쇠숟가락은 금속이라 전기가 잘 지나가요.' },
    { e: '🔩', n: '나사', c: 'metal', why: '나사는 쇠라서 전기가 잘 지나가요.' },
    { e: '💍', n: '반지', c: 'metal', why: '금속 반지라서 전기가 잘 지나가요.' },
    { e: '✂️', n: '가위 날', c: 'metal', why: '가위의 쇠 날을 끼웠어요. 쇠는 전기가 잘 지나가요.' },
    { e: '✏️', n: '연필심', c: 'lead', why: '연필심(흑연)은 금속이 아닌데도 전기가 조금 지나가요. 그래서 불이 흐리게 켜졌어요.' },
    { e: '🥢', n: '나무젓가락', c: 'none', why: '나무는 전기가 지나가지 못해요.' },
    { e: '📄', n: '종이', c: 'none', why: '종이는 전기가 지나가지 못해요.' },
    { e: '🎈', n: '풍선', c: 'none', why: '풍선은 고무라서 전기가 지나가지 못해요. 그래서 전선 겉을 고무나 비닐로 감싸요.' },
    { e: '🧶', n: '털실', c: 'none', why: '털실은 전기가 지나가지 못해요.' },
    { e: '🖍️', n: '크레파스', c: 'none', why: '크레파스는 전기가 지나가지 못해요.' },
    { e: '🪨', n: '돌멩이', c: 'none', why: '마른 돌은 전기가 지나가지 못해요.' },
    { e: '🔮', n: '유리구슬', c: 'none', why: '유리는 전기가 지나가지 못해요.' },
    { e: '🧦', n: '양말', c: 'none', why: '천은 전기가 지나가지 못해요.' },
    { e: '🪵', n: '나무토막', c: 'none', why: '나무는 전기가 지나가지 못해요.' }
  ];

  var TEST_PARTS = [
    { id: 'B1', type: 'battery', x: 0.27, y: 0.7, p: [0.3, 0.8] },
    { id: 'L1', type: 'bulb', x: 0.5, y: 0.33, p: [0.5, 0.3] },
    { id: 'G1', type: 'gap', x: 0.74, y: 0.7, p: [0.7, 0.62] }
  ];
  // 전선이 서로 엇갈리지 않게 — 전지 왼쪽(-)은 전구 왼쪽으로, 전지 오른쪽(+)은 끊긴 자리 왼쪽으로
  var TEST_WIRES = [['B1:a', 'L1:a'], ['L1:b', 'G1:b'], ['G1:a', 'B1:b']];

  var FREE_PARTS = [
    { id: 'B1', type: 'battery', x: 0.16, y: 0.36, p: [0.25, 0.56] },
    { id: 'B2', type: 'battery', x: 0.16, y: 0.76, p: [0.25, 0.82] },
    { id: 'L1', type: 'bulb', x: 0.48, y: 0.32, p: [0.27, 0.22] },
    { id: 'L2', type: 'bulb', x: 0.8, y: 0.32, p: [0.73, 0.22] },
    { id: 'S1', type: 'switch', x: 0.64, y: 0.75, p: [0.73, 0.62], on: true }
  ];

  var el = {
    stage: document.getElementById('stage'),
    canvas: document.getElementById('canvas'),
    say: document.getElementById('say'),
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

  /* ---------- 상태 ---------- */

  var state = {
    act: UI.loadValue(ACT_KEY) || 'build',
    playing: false,
    parts: [],
    wires: [],
    result: null,
    // 임무
    mission: 0,
    step: 0,
    shorted: false,      // 이번 임무에서 합선을 낸 적 있나 (있으면 ⭐ 없음)
    solved: false,
    // 통할까?
    deck: [],
    round: 0,
    stars: 0,
    locked: false,
    item: null,          // 지금 판 위에 기다리는 물건
    slide: 0,            // 0 이면 쟁반 위, 1 이면 끊긴 자리에 쏙
    guess: null,
    prompt: ''
  };

  if (!findAct(state.act)) state.act = 'build';

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  function part(id) {
    for (var i = 0; i < state.parts.length; i++) if (state.parts[i].id === id) return state.parts[i];
    return null;
  }

  // 그 부품의 두 단자에 모두 전선이 붙었나
  function wired(id) {
    var a = false, b = false;
    state.wires.forEach(function (w) {
      if (w.a === id + ':a' || w.b === id + ':a') a = true;
      if (w.a === id + ':b' || w.b === id + ':b') b = true;
    });
    return a && b;
  }

  function setParts(list) {
    state.parts = list.map(function (p) {
      return { id: p.id, type: p.type, x: p.x, y: p.y, p: p.p, on: (p.on !== false), item: null };
    });
    state.wires = [];
    state.sel = null;
    state.drag = null;
    recompute();
  }

  /* ---------- 계산 ---------- */

  function terms() {
    var out = [];
    state.parts.forEach(function (p) { out.push(p.id + ':a'); out.push(p.id + ':b'); });
    return out;
  }

  function gapG(p) {
    if (!p.item || state.slide < 1) return 0;
    if (p.item.c === 'metal') return G_WIRE;
    if (p.item.c === 'lead') return 1 / R_LEAD;
    return 0;
  }

  /* 마디 전압 풀기 — 전지는 '전류원 + 속저항' 으로 바꿔 넣고(노턴 등가),
     모든 마디에 아주 작은 새는 길을 달아 어디에도 안 이어진 마디가 있어도 식이 풀리게 합니다. */
  function solve() {
    var names = terms();
    var idx = {};
    names.forEach(function (n, i) { idx[n] = i; });
    var n = names.length;
    var A = [], z = [];
    for (var i = 0; i < n; i++) {
      A.push([]);
      for (var j = 0; j < n; j++) A[i].push(0);
      A[i][i] = 1e-6;
      z.push(0);
    }

    function addG(a, b, g) {
      if (!g) return;
      var i = idx[a], j = idx[b];
      A[i][i] += g; A[j][j] += g; A[i][j] -= g; A[j][i] -= g;
    }

    state.wires.forEach(function (w) { addG(w.a, w.b, G_WIRE); });
    state.parts.forEach(function (p) {
      var a = p.id + ':a', b = p.id + ':b';
      if (p.type === 'bulb') addG(a, b, 1 / R_BULB);
      else if (p.type === 'switch') addG(a, b, p.on ? G_WIRE : 0);
      else if (p.type === 'gap') addG(a, b, gapG(p));
      else if (p.type === 'battery') {
        // a 가 -, b 가 + 입니다
        addG(a, b, 1 / R_BATT);
        z[idx[b]] += V_BATT / R_BATT;
        z[idx[a]] -= V_BATT / R_BATT;
      }
    });

    var V = gauss(A, z);
    function v(name) { return V[idx[name]] || 0; }

    var r = { lit: {}, bright: {}, flow: {}, wireI: [], battI: {}, shorted: false, anyLit: 0 };

    state.parts.forEach(function (p) {
      var da = v(p.id + ':a'), db = v(p.id + ':b');
      if (p.type === 'bulb') {
        var I = (da - db) / R_BULB;
        var P = I * I * R_BULB;
        r.bright[p.id] = Math.min(1.8, Math.sqrt(P / P_ONE));
        r.lit[p.id] = P > LIT_P;
        if (r.lit[p.id]) r.anyLit += 1;
      } else if (p.type === 'switch') {
        r.flow[p.id] = p.on && Math.abs((da - db) * G_WIRE) > 0.02;
      } else if (p.type === 'battery') {
        var Ib = V_BATT / R_BATT - (db - da) / R_BATT;   // 전지 안에서 - → + 로 흐르는 전기
        r.battI[p.id] = Ib;
        if (Math.abs(Ib) > SHORT_I) r.shorted = true;
      }
    });

    state.wires.forEach(function (w, k) {
      r.wireI[k] = (v(w.a) - v(w.b)) * G_WIRE;
    });
    return r;
  }

  function gauss(A, z) {
    var n = z.length;
    for (var c = 0; c < n; c++) {
      var best = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[best][c])) best = r;
      var t = A[c]; A[c] = A[best]; A[best] = t;
      var tz = z[c]; z[c] = z[best]; z[best] = tz;
      var piv = A[c][c];
      if (Math.abs(piv) < 1e-12) continue;
      for (var r2 = c + 1; r2 < n; r2++) {
        var f = A[r2][c] / piv;
        if (!f) continue;
        for (var k = c; k < n; k++) A[r2][k] -= f * A[c][k];
        z[r2] -= f * z[c];
      }
    }
    var x = [];
    for (var i = n - 1; i >= 0; i--) {
      var s = z[i];
      for (var j = i + 1; j < n; j++) s -= A[i][j] * x[j];
      x[i] = Math.abs(A[i][i]) < 1e-12 ? 0 : s / A[i][i];
    }
    return x;
  }

  var wasLit = 0, wasShort = false;

  function recompute() {
    state.result = solve();
    var r = state.result;

    if (r.anyLit > wasLit && window.SFX) SFX.pop();
    wasLit = r.anyLit;

    if (r.shorted && !wasShort) {
      if (window.SFX) SFX.wrong();
      if (state.act === 'build' && state.playing) state.shorted = true;
      showSay('⚠️ 합선! 전구 없이 전선만 이으면 전기가 왈칵 흘러 전지가 뜨거워져요. 전선을 눌러 떼요.', true);
      speak('합선! 전구 없이 전선만 이으면 전기가 너무 많이 흘러서 전지가 뜨거워져요. 진짜 전지로는 하면 안 돼요. 전선을 눌러서 떼어 봐요.');
    } else if (!r.shorted && wasShort) {
      hideSay();
    }
    wasShort = r.shorted;

    if (state.playing && state.act === 'build') checkMission();
    if (state.playing && state.act === 'free') freeSay();
  }

  /* ---------- 판 그리기 ---------- */

  var W = 0, H = 0, S = 80, dpr = 1;
  var pageEl = document.querySelector('.sci-page');

  function fit() {
    if (pageEl) pageEl.style.height = (document.documentElement.clientHeight || window.innerHeight) + 'px';
    var w = el.stage.clientWidth, h = el.stage.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h;
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.width = w + 'px';
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.max(46, Math.min(130, w / 5.4, h / 3.5));
  }

  function tall() { return H > W * 1.05; }

  function center(p) {
    var x = p.x, y = p.y;
    if (tall() && p.p) { x = p.p[0]; y = p.p[1]; }
    return { x: x * W, y: y * H };
  }

  // 단자 자리 — a 는 왼쪽(전지는 -), b 는 오른쪽(전지는 +)
  function termPos(name) {
    var bits = name.split(':');
    var p = part(bits[0]);
    var c = center(p);
    var s = (bits[1] === 'a') ? -1 : 1;
    if (p.type === 'battery') return { x: c.x + s * S * 0.98, y: c.y };
    if (p.type === 'bulb') return { x: c.x + s * S * 0.46, y: c.y + S * 0.62 };
    if (p.type === 'switch') return { x: c.x + s * S * 0.78, y: c.y + S * 0.08 };
    return { x: c.x + s * S * 0.92, y: c.y };   // gap
  }

  function termR() { return Math.max(11, S * 0.13); }
  function hitR() { return Math.max(28, S * 0.3); }

  var clock = 0, last = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    clock += dt;
    if (state.slideTo != null) {
      var d = state.slideTo - state.slide;
      if (Math.abs(d) < 0.02) {
        state.slide = state.slideTo;
        state.slideTo = null;
        recompute();
        if (state.onSlid) { var f = state.onSlid; state.onSlid = null; f(); }
      } else {
        state.slide += Math.sign(d) * Math.min(Math.abs(d), dt * 1.8);
      }
    }
    draw();
  }

  function draw() {
    if (!W) return;
    // 나무 책상 판
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f8efe0');
    g.addColorStop(1, '#efe0c6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(160,120,70,0.10)';
    ctx.lineWidth = 1;
    for (var y = 18; y < H; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(W * 0.3, y + 5, W * 0.6, y - 5, W, y + 2);
      ctx.stroke();
    }

    var r = state.result || { lit: {}, bright: {}, wireI: [], battI: {} };

    // 전구 빛은 맨 아래에 깔아 전선·부품이 그 위로 보이게 합니다
    state.parts.forEach(function (p) { if (p.type === 'bulb') drawGlow(p, r.bright[p.id] || 0); });

    state.parts.forEach(function (p) {
      if (p.type === 'battery') drawBattery(p, r);
      else if (p.type === 'bulb') drawBulb(p, r.bright[p.id] || 0);
      else if (p.type === 'switch') drawSwitch(p);
      else drawGap(p);
    });

    state.wires.forEach(function (w, k) { drawWire(w, k, r.wireI[k] || 0); });

    // 끌고 있는 전선
    if (state.drag && state.drag.moved) {
      var a = termPos(state.drag.from);
      ctx.strokeStyle = 'rgba(94,177,255,0.8)';
      ctx.lineWidth = Math.max(5, S * 0.07);
      ctx.lineCap = 'round';
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(state.drag.x, state.drag.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    terms().forEach(function (t) { drawTerm(t); });

    if (state.act === 'test' && state.item) drawTestItem();
  }

  var WIRE_COLORS = ['#e8524a', '#3b82d6', '#f29a2e', '#3fa65a', '#9a63d6', '#e0559a'];

  function wireCurve(w) {
    var a = termPos(w.a), b = termPos(w.b);
    var len = Math.hypot(b.x - a.x, b.y - a.y);
    // 늘어진 전선처럼 가운데가 조금 아래로 처집니다
    return { a: a, b: b, c: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + Math.min(60, len * 0.18) } };
  }

  function curveAt(cv, t) {
    var u = 1 - t;
    return { x: u * u * cv.a.x + 2 * u * t * cv.c.x + t * t * cv.b.x,
             y: u * u * cv.a.y + 2 * u * t * cv.c.y + t * t * cv.b.y };
  }

  function drawWire(w, k, I) {
    var cv = wireCurve(w);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = Math.max(7, S * 0.1);
    ctx.beginPath();
    ctx.moveTo(cv.a.x, cv.a.y + 3);
    ctx.quadraticCurveTo(cv.c.x, cv.c.y + 3, cv.b.x, cv.b.y + 3);
    ctx.stroke();
    ctx.strokeStyle = w.fixed ? '#7d8796' : WIRE_COLORS[k % WIRE_COLORS.length];
    ctx.lineWidth = Math.max(6, S * 0.085);
    ctx.beginPath();
    ctx.moveTo(cv.a.x, cv.a.y);
    ctx.quadraticCurveTo(cv.c.x, cv.c.y, cv.b.x, cv.b.y);
    ctx.stroke();

    // 흐르는 전기 — 알갱이가 + 쪽에서 - 쪽으로, 많이 흐를수록 빠르게
    var amp = Math.abs(I);
    if (amp < 0.02) return;
    var len = Math.hypot(cv.b.x - cv.a.x, cv.b.y - cv.a.y) + 1;
    var speed = Math.min(260, 60 + amp * 500);
    var gap = 26;
    var off = (clock * speed) % gap;
    var dotR = Math.max(3, S * 0.04);
    ctx.fillStyle = (amp > SHORT_I) ? '#ff4d4d' : '#ffd23a';
    for (var d = off; d < len; d += gap) {
      var t = d / len;
      if (I < 0) t = 1 - t;
      var q = curveAt(cv, t);
      ctx.beginPath();
      ctx.arc(q.x, q.y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTerm(name) {
    var q = termPos(name);
    var R = termR();
    var on = (state.sel === name) || (state.drag && state.drag.from === name);
    if (on) {
      ctx.fillStyle = 'rgba(94,177,255,0.35)';
      ctx.beginPath();
      ctx.arc(q.x, q.y, R * 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    var g = ctx.createRadialGradient(q.x - R * 0.3, q.y - R * 0.3, R * 0.1, q.x, q.y, R);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#cfd5dd');
    g.addColorStop(1, '#8a93a0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(q.x, q.y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7380';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 나사 홈
    ctx.beginPath();
    ctx.moveTo(q.x - R * 0.5, q.y);
    ctx.lineTo(q.x + R * 0.5, q.y);
    ctx.stroke();
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

  // 전지 — 가로로 누운 건전지. 오른쪽(+)에 꼭지가 있습니다
  function drawBattery(p, r) {
    var c = center(p);
    var w = S * 1.5, h = S * 0.52;
    var x = c.x - w / 2, y = c.y - h / 2;
    var hot = Math.abs(r.battI[p.id] || 0) > SHORT_I;

    // 단자까지 이어지는 짧은 쇠
    ctx.strokeStyle = '#8a93a0';
    ctx.lineWidth = Math.max(4, S * 0.06);
    ctx.beginPath();
    ctx.moveTo(c.x - S * 0.98, c.y); ctx.lineTo(x, c.y);
    ctx.moveTo(x + w, c.y); ctx.lineTo(c.x + S * 0.98, c.y);
    ctx.stroke();

    if (hot) {
      var heat = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, S * 1.3);
      heat.addColorStop(0, 'rgba(255,80,40,' + (0.35 + 0.15 * Math.sin(clock * 10)).toFixed(2) + ')');
      heat.addColorStop(1, 'rgba(255,80,40,0)');
      ctx.fillStyle = heat;
      ctx.beginPath();
      ctx.arc(c.x, c.y, S * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 몸통: 왼쪽 2/3 는 까만색, 오른쪽은 금색
    roundRect(x, y, w, h, h * 0.22);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = hot ? '#7a1d12' : '#2c2f36';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = hot ? '#e0692e' : '#e6b23a';
    ctx.fillRect(x + w * 0.62, y, w * 0.38, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y + h * 0.12, w, h * 0.16);
    ctx.restore();
    // + 꼭지
    ctx.fillStyle = '#c9ced6';
    ctx.fillRect(x + w, c.y - h * 0.18, S * 0.08, h * 0.36);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(h * 0.62) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('−', x + w * 0.16, c.y + 1);
    ctx.fillStyle = '#2c2f36';
    ctx.fillText('+', x + w * 0.83, c.y + 1);
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold ' + Math.round(h * 0.3) + 'px sans-serif';
    ctx.fillText('1.5V', x + w * 0.4, c.y + 1);
  }

  function drawGlow(p, b) {
    if (b < 0.05) return;
    var c = center(p);
    var gy = c.y - S * 0.2;
    var R = S * (0.6 + b * 0.9);
    var g = ctx.createRadialGradient(c.x, gy, S * 0.2, c.x, gy, R);
    g.addColorStop(0, 'rgba(255,230,120,' + Math.min(0.85, 0.35 + b * 0.35).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, gy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  // 꼬마전구 — 유리알 · 필라멘트 · 쇠 꼭지 · 받침
  function drawBulb(p, b) {
    var c = center(p);
    var gr = S * 0.4;
    var gy = c.y - S * 0.2;

    // 받침과 단자까지의 쇠
    ctx.fillStyle = '#b98a52';
    roundRect(c.x - S * 0.62, c.y + S * 0.42, S * 1.24, S * 0.22, S * 0.06);
    ctx.fill();
    ctx.strokeStyle = '#8a93a0';
    ctx.lineWidth = Math.max(3, S * 0.05);
    ctx.beginPath();
    ctx.moveTo(c.x - S * 0.2, c.y + S * 0.38); ctx.lineTo(c.x - S * 0.46, c.y + S * 0.62);
    ctx.moveTo(c.x + S * 0.2, c.y + S * 0.38); ctx.lineTo(c.x + S * 0.46, c.y + S * 0.62);
    ctx.stroke();

    // 쇠 꼭지 (나사 홈)
    ctx.fillStyle = '#b8bec8';
    ctx.fillRect(c.x - gr * 0.5, gy + gr * 0.72, gr, S * 0.3);
    ctx.strokeStyle = '#8a93a0';
    ctx.lineWidth = 1.5;
    for (var i = 1; i <= 3; i++) {
      var yy = gy + gr * 0.72 + i * S * 0.075;
      ctx.beginPath(); ctx.moveTo(c.x - gr * 0.5, yy); ctx.lineTo(c.x + gr * 0.5, yy); ctx.stroke();
    }

    // 유리알
    var on = b > 0.05;
    var glass = ctx.createRadialGradient(c.x - gr * 0.3, gy - gr * 0.3, gr * 0.1, c.x, gy, gr);
    if (on) {
      var a = Math.min(1, 0.45 + b * 0.4);
      glass.addColorStop(0, 'rgba(255,255,240,' + a + ')');
      glass.addColorStop(1, 'rgba(255,214,90,' + a + ')');
    } else {
      glass.addColorStop(0, 'rgba(255,255,255,0.95)');
      glass.addColorStop(1, 'rgba(200,215,230,0.7)');
    }
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.arc(c.x, gy, gr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,135,150,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 필라멘트
    ctx.strokeStyle = on ? '#ff8a00' : '#6b5a48';
    ctx.lineWidth = on ? 2.5 : 1.6;
    ctx.beginPath();
    ctx.moveTo(c.x - gr * 0.3, gy + gr * 0.75);
    ctx.lineTo(c.x - gr * 0.3, gy);
    for (var k = 0; k <= 6; k++) {
      ctx.lineTo(c.x - gr * 0.3 + k * gr * 0.1, gy + ((k % 2) ? -gr * 0.14 : 0));
    }
    ctx.lineTo(c.x + gr * 0.3, gy + gr * 0.75);
    ctx.stroke();
  }

  // 스위치 — 쇠 막대가 내려와 두 쇠를 이으면 켜진 것
  function drawSwitch(p) {
    var c = center(p);
    ctx.fillStyle = '#5b8ed6';
    roundRect(c.x - S * 0.85, c.y - S * 0.08, S * 1.7, S * 0.32, S * 0.08);
    ctx.fill();
    var ax = c.x - S * 0.5, bx = c.x + S * 0.5, y = c.y;
    ctx.strokeStyle = '#8a93a0';
    ctx.lineWidth = Math.max(4, S * 0.06);
    ctx.beginPath();
    ctx.moveTo(c.x - S * 0.78, c.y + S * 0.08); ctx.lineTo(ax, y);
    ctx.moveTo(c.x + S * 0.78, c.y + S * 0.08); ctx.lineTo(bx, y);
    ctx.stroke();
    // 막대
    var ang = p.on ? 0 : -0.7;
    var len = bx - ax;
    ctx.strokeStyle = '#c9ced6';
    ctx.lineWidth = Math.max(6, S * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, y);
    ctx.lineTo(ax + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
    // 손잡이
    ctx.fillStyle = '#e8524a';
    ctx.beginPath();
    ctx.arc(ax + Math.cos(ang) * len * 0.7, y + Math.sin(ang) * len * 0.7, S * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(S * 0.18) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.on ? '켜짐' : '꺼짐', c.x, c.y + S * 0.42);
  }

  // 끊긴 자리 — 집게 둘 사이에 물건을 끼웁니다
  function drawGap(p) {
    var c = center(p);
    ctx.strokeStyle = '#8a93a0';
    ctx.lineWidth = Math.max(4, S * 0.06);
    ctx.beginPath();
    ctx.moveTo(c.x - S * 0.92, c.y); ctx.lineTo(c.x - S * 0.42, c.y);
    ctx.moveTo(c.x + S * 0.92, c.y); ctx.lineTo(c.x + S * 0.42, c.y);
    ctx.stroke();
    // 집게
    ctx.fillStyle = '#d64a4a';
    [-1, 1].forEach(function (s) {
      ctx.save();
      ctx.translate(c.x + s * S * 0.38, c.y);
      ctx.beginPath();
      ctx.moveTo(-s * S * 0.04, -S * 0.14);
      ctx.lineTo(s * S * 0.1, -S * 0.1);
      ctx.lineTo(s * S * 0.1, S * 0.1);
      ctx.lineTo(-s * S * 0.04, S * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    if (!p.item || state.slide <= 0.001) {
      ctx.fillStyle = 'rgba(64,50,58,0.35)';
      ctx.font = 'bold ' + Math.round(S * 0.2) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', c.x, c.y);
    }
  }

  // 통할까? 의 물건 — 판 위쪽에서 기다리다가 끊긴 자리로 미끄러져 들어갑니다
  function drawTestItem() {
    var gp = part('G1');
    if (!gp) return;
    var c = center(gp);
    // 기다리는 자리 — 넓은 화면은 끊긴 자리 위, 세로 화면은 아래 (위로는 전선이 지나갑니다)
    var from = tall() ? { x: c.x, y: Math.min(H - S * 0.7, c.y + S * 1.4) }
                      : { x: c.x, y: Math.max(S * 0.55, c.y - S * 1.4) };
    var t = state.slide;
    var e = t * t * (3 - 2 * t);
    var x = from.x + (c.x - from.x) * e;
    var y = from.y + (c.y - from.y) * e;
    var size = S * 0.62;
    ctx.font = Math.round(size) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.item.e, x, y);
    if (t < 0.5) {
      ctx.fillStyle = 'rgba(64,50,58,0.85)';
      ctx.font = 'bold ' + Math.round(Math.max(13, S * 0.2)) + 'px sans-serif';
      ctx.fillText(state.item.n, x, y + size * 0.72);
    }
  }

  /* ---------- 손으로 잇기 ---------- */

  function pointAt(ev) {
    var b = el.canvas.getBoundingClientRect();
    return { x: ev.clientX - b.left, y: ev.clientY - b.top };
  }

  function termAt(q) {
    var best = null, bd = hitR();
    terms().forEach(function (t) {
      var p = termPos(t);
      var d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < bd) { bd = d; best = t; }
    });
    return best;
  }

  function wireAt(q) {
    for (var k = state.wires.length - 1; k >= 0; k--) {
      var cv = wireCurve(state.wires[k]);
      for (var i = 1; i < 20; i++) {
        var p = curveAt(cv, i / 20);
        if (Math.hypot(p.x - q.x, p.y - q.y) < 20) return k;
      }
    }
    return -1;
  }

  function switchAt(q) {
    for (var i = 0; i < state.parts.length; i++) {
      var p = state.parts[i];
      if (p.type !== 'switch') continue;
      var c = center(p);
      if (Math.abs(q.x - c.x) < S * 0.62 && q.y > c.y - S * 0.6 && q.y < c.y + S * 0.55) return p;
    }
    return null;
  }

  function canEdit() {
    return state.playing && state.act !== 'test' && !state.solved;
  }

  el.canvas.addEventListener('pointerdown', function (ev) {
    if (!canEdit()) return;
    var q = pointAt(ev);
    var t = termAt(q);
    if (t) {
      state.drag = { from: t, x: q.x, y: q.y, moved: false, id: ev.pointerId };
      try { el.canvas.setPointerCapture(ev.pointerId); } catch (e) { /* 무시 */ }
      return;
    }
    var sw = switchAt(q);
    if (sw) {
      sw.on = !sw.on;
      if (window.SFX) SFX.tap();
      recompute();
      return;
    }
    var k = wireAt(q);
    if (k >= 0 && !state.wires[k].fixed) {
      state.wires.splice(k, 1);
      if (window.SFX) SFX.tap();
      recompute();
      return;
    }
    state.sel = null;
  });

  el.canvas.addEventListener('pointermove', function (ev) {
    if (!state.drag || state.drag.id !== ev.pointerId) return;
    var q = pointAt(ev);
    state.drag.x = q.x;
    state.drag.y = q.y;
    var a = termPos(state.drag.from);
    if (Math.hypot(q.x - a.x, q.y - a.y) > 14) state.drag.moved = true;
  });

  function endDrag(ev) {
    if (!state.drag || state.drag.id !== ev.pointerId) return;
    var d = state.drag;
    state.drag = null;
    var q = pointAt(ev);
    var t = termAt(q);
    if (d.moved) {
      if (t && t !== d.from) connect(d.from, t);
      state.sel = null;
      return;
    }
    // 끌지 않고 눌렀다 뗐으면 — 고른 단자가 있으면 그것과 잇고, 없으면 이것을 고릅니다
    if (state.sel && state.sel !== d.from) {
      connect(state.sel, d.from);
      state.sel = null;
    } else {
      state.sel = (state.sel === d.from) ? null : d.from;
      if (state.sel && window.SFX) SFX.tap();
    }
  }

  el.canvas.addEventListener('pointerup', endDrag);
  el.canvas.addEventListener('pointercancel', function () { state.drag = null; });

  function connect(a, b) {
    for (var i = 0; i < state.wires.length; i++) {
      var w = state.wires[i];
      if ((w.a === a && w.b === b) || (w.a === b && w.b === a)) return;
    }
    state.wires.push({ a: a, b: b });
    if (window.SFX) SFX.tap();
    recompute();
  }

  /* ---------- 💡 불 켜기 (임무) ---------- */

  function startBuild() {
    state.mission = 0;
    state.stars = 0;
    showMission();
  }

  function showMission() {
    var m = MISSIONS[state.mission];
    state.step = 0;
    state.shorted = false;
    state.solved = false;
    state.hinted = false;
    wasLit = 0; wasShort = false;
    hideSay();
    setParts(m.parts);
    buildCtrl([
      { text: '🧹 전선 다 떼기', fn: clearWires },
      { text: '💬 힌트', fn: function () { showSay(m.hint); speak(m.hint); } }
    ]);
    el.bar.style.width = Math.round((state.mission / MISSIONS.length) * 100) + '%';
    askStep();
  }

  function askStep() {
    var m = MISSIONS[state.mission];
    var s = m.steps[state.step];
    setLabel(m.icon + ' 임무 ' + (state.mission + 1) + '/' + MISSIONS.length + ' · ' + s.say);
    state.prompt = s.say;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
    checkMission();
  }

  function checkMission() {
    if (state.solved) return;
    var m = MISSIONS[state.mission];
    if (!m) return;
    var s = m.steps[state.step];
    var r = state.result;
    if (r.shorted) return;
    if (!s.goal(r, m)) return;

    if (state.step < m.steps.length - 1) {
      if (window.SFX) SFX.correct();
      state.step += 1;
      askStep();
      return;
    }

    state.solved = true;
    if (window.SFX) SFX.correct();
    UI.confettiAt(el.stage);
    var got = !state.shorted;
    if (got) state.stars += 1;
    updateScore();
    var text = (typeof m.done === 'function') ? m.done(r) : m.done;
    setLabel('⭕ ' + text);
    showSay('⭕ 해냈어요!');
    state.prompt = text;
    var lastOne = (state.mission === MISSIONS.length - 1);
    buildCtrl([
      { text: lastOne ? '끝 🎉' : '다음 임무 ▶', go: true, fn: nextMission }
    ]);
    speak(text);
  }

  function nextMission() {
    if (window.TTS) TTS.cancel();
    if (state.mission >= MISSIONS.length - 1) return finish(MISSIONS.length);
    state.mission += 1;
    showMission();
  }

  function clearWires() {
    state.wires = state.wires.filter(function (w) { return w.fixed; });
    state.sel = null;
    if (window.SFX) SFX.tap();
    recompute();
  }

  // 막힌 것 같으면 한 번은 저절로 힌트 — 단자마다 전선이 다 붙었는데도 못 풀었을 때
  setInterval(function () {
    if (!state.playing || state.act !== 'build' || state.solved || state.hinted) return;
    var all = state.parts.every(function (p) { return wired(p.id); });
    if (!all || (state.result && state.result.shorted)) return;
    var m = MISSIONS[state.mission];
    if (m.id === 'switch' && state.step === 1) return;
    state.hinted = true;
    var text = m.hint;
    if (m.id === 'two' && state.result.lit.L1) text = '불은 켜졌어요! 그런데 전지 하나 몫만큼만 밝아요. 전지 방향을 봐요. 플러스는 마이너스와 이어야 해요.';
    showSay('💬 ' + text);
    speak(text);
  }, 6000);

  /* ---------- 🔎 통할까? ---------- */

  function startTest() {
    var yes = UI.shuffle(ITEMS.filter(function (i) { return i.c !== 'none'; }));
    var no = UI.shuffle(ITEMS.filter(function (i) { return i.c === 'none'; }));
    state.deck = UI.shuffle(yes.slice(0, TEST_ROUNDS / 2).concat(no.slice(0, TEST_ROUNDS / 2)));
    state.round = 0;
    state.stars = 0;
    setParts(TEST_PARTS);
    state.wires = TEST_WIRES.map(function (w) { return { a: w[0], b: w[1], fixed: true }; });
    nextTest();
  }

  function nextTest() {
    if (state.round >= state.deck.length) return finish(state.deck.length);
    state.locked = false;
    state.guess = null;
    state.item = state.deck[state.round];
    part('G1').item = state.item;
    state.slide = 0;
    state.slideTo = null;
    wasLit = 0;
    hideSay();
    recompute();
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    buildCtrl([
      { text: '💡 켜진다', big: true, fn: function (b) { pick(true, b); } },
      { text: '🌑 안 켜진다', big: true, fn: function (b) { pick(false, b); } }
    ]);
    var ask = josa(state.item.n, '을', '를') + ' 끼우면 불이 켜질까요?';
    setLabel(state.item.e + ' ' + ask + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
    state.prompt = ask;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function pick(yes, btn) {
    if (state.locked) return;
    state.locked = true;
    state.guess = yes;
    if (window.SFX) SFX.tap();
    btn.classList.add('picked');
    Array.prototype.forEach.call(el.ctrl.children, function (b) { b.disabled = (b !== btn); });
    if (window.TTS) TTS.cancel();
    state.slideTo = 1;
    state.onSlid = function () { showTestResult(); };
  }

  function showTestResult() {
    var lit = state.result.lit.L1;
    var right = (lit === state.guess);
    if (right) {
      state.stars += 1;
      if (window.SFX) SFX.correct();
      UI.confettiAt(el.stage);
    }
    updateScore();
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    var head = lit ? '💡 켜졌어요!' : '🌑 안 켜져요.';
    showSay((right ? '⭕ ' : '') + head);
    var text = (right ? '맞았어요! ' : '') + state.item.why;
    setLabel(text);
    state.prompt = text;
    el.speakBtn.hidden = true;
    speak((lit ? '켜졌어요! ' : '안 켜져요. ') + text, function () { setTimeout(nextTest, 700); });
  }

  /* ---------- 🔧 마음대로 ---------- */

  function startFree() {
    setParts(FREE_PARTS);
    buildCtrl([{ text: '🧹 전선 다 떼기', fn: clearWires }]);
    setLabel('🔧 마음대로 이어 봐요 — 전지 둘을 겹치면? 전구 둘을 갈래로 이으면?');
    state.prompt = '마음대로 이어 봐요. 전지 둘을 한 줄로 이으면 어떻게 될까요? 전구 둘을 갈래 길로 이으면요?';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = '100%';
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function freeSay() {
    var r = state.result;
    if (r.shorted) return;
    if (!r.anyLit) return hideSay();
    var parts = [];
    ['L1', 'L2'].forEach(function (id, i) {
      if (!r.lit[id]) return;
      var b = r.bright[id];
      parts.push('전구 ' + (i + 1) + ' ' + (b > 1.4 ? '아주 밝아요 ✨' : b > 0.7 ? '켜졌어요' : '조금 어두워요'));
    });
    showSay('💡 ' + parts.join(' · '));
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    state.stars = 0;
    state.item = null;
    state.slide = 0;
    state.slideTo = null;
    el.bar.style.width = '0%';
    el.speakBtn.hidden = true;
    hideSay();
    fit();
    updateScore();
    if (state.act === 'build') return startBuild();
    if (state.act === 'test') return startTest();
    startFree();
  }

  function finish(total) {
    state.playing = false;
    el.bar.style.width = '100%';
    UI.saveBest(BEST_KEY + '.' + state.act, state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);
    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = (state.act === 'build')
      ? '임무 ' + total + '개를 다 해냈어요! (합선 없이 해낸 임무마다 ⭐)'
      : total + '개 중에 ' + state.stars + '개를 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  function buildCtrl(list) {
    el.ctrl.innerHTML = '';
    list.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'chip' + (o.big ? ' big' : '') + (o.go ? ' go' : '');
      b.textContent = o.text;
      b.addEventListener('click', function () { o.fn(b); });
      el.ctrl.appendChild(b);
    });
    // 단추 줄 높이가 바뀌면 판 크기도 다시 잽니다
    setTimeout(fit, 0);
  }

  function showSay(text, warn) {
    el.say.textContent = text;
    el.say.classList.toggle('warn', !!warn);
    el.say.hidden = false;
  }

  function hideSay() { el.say.hidden = true; }

  function setLabel(text) { el.label.textContent = text; }

  function updateScore() {
    if (state.act === 'free') el.score.textContent = '🔧';
    else el.score.textContent = '⭐ ' + state.stars;
  }

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + ((a.id === state.act) ? ' on' : '');
      var best = (a.id === 'free') ? null : UI.readBest(BEST_KEY + '.' + a.id);
      b.innerHTML = '<span class="mi">' + a.icon + '</span>' +
                    '<span class="mn">' + a.name + '</span>' +
                    '<span class="mb">' + (best ? ('⭐ ' + best.stars + '/' + best.total) : '') + '</span>';
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

  buildModeRow();

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
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '전기 회로예요.'; } });
  });

  var back = Catalog.backHref('circuit.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
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

  // 새 말이 시작되면 먼저 하던 말의 then 은 부르지 않습니다 (별의 일생과 같은 규칙)
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
      setTimeout(once, Math.min(12000, 900 + (text || '').length * 90));
      return;
    }
    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }

  /* ---------- 시작 ---------- */

  window.addEventListener('resize', fit);
  // 이야기 판·단추 줄이 나타나고 사라지면 그림 칸 높이가 바뀝니다 — 그때마다 다시 잽니다
  if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(el.stage);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  fit();
  setParts(MISSIONS[0].parts);
  updateScore();
  setLabel('💡 전기가 빙 돌아야 불이 켜져요');
  requestAnimationFrame(frame);
})();
