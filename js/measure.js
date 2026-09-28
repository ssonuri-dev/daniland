/* =========================================================================
 * 다니랜드 - 재고 견주기 (measure.html)
 *
 * 수학의 '재고 견주기' 묶음 카드 넉 장이 이 화면 하나를 ?act= 로 나눠 씁니다 (시계·모양과 같은 얼개 —
 * 시작 화면에는 단계만 나옵니다). 그림은 전부 svg·css 로 그리고 그림 파일은 없습니다.
 *
 * 놀이 4가지 (초1 '비교하기' · 초2 '길이 재기')
 *   long   : 길이 견주기 - 끈 셋 중 가장 긴 것 / 가장 짧은 것을 누릅니다.
 *              1단계  왼쪽 끝이 맞춰져 있습니다 (끝을 맞추면 오른쪽 끝만 보면 됩니다)
 *              2단계  끝이 제각각이고 바탕에 칸이 있습니다 — 칸을 세어야 합니다.
 *                     일부러 '가장 오른쪽까지 간 끈' 이 가장 긴 끈이 아니게 자주 만듭니다.
 *   heavy  : 무게 견주기 - 시소에서 무거운 쪽이 내려갑니다.
 *              1단계  시소 하나에 물건 둘 (🎈 풍선과 🪨 돌처럼 크기와 무게가 거꾸로인 짝도)
 *              2단계  시소 둘에 상자 셋 — 두 시소를 이어서 가장 무거운(가벼운) 상자를 찾습니다.
 *   fill   : 들이 견주기 - 그릇 셋 중 물이 가장 많은(적은) 것.
 *              1단계  같은 컵, 물 높이만 다릅니다
 *              2단계  모양이 다른 그릇 — 같은 작은 컵으로 몇 번 부어 가득 찼는지(🥛 개수)로 견줍니다.
 *                     키 큰 그릇이 늘 많이 들어가는 게 아니게 만듭니다.
 *   ruler  : 자로 재기  - 자 위의 연필이 몇 cm 인지 고릅니다.
 *              1단계  0 에서 시작      2단계  중간 눈금(1~5)에서 시작
 *              2단계의 틀린 보기에는 '끝 눈금을 그대로 읽은 수' 가 꼭 들어갑니다 — 초2 가 제일 많이 하는 실수.
 *
 * ⚠️ 시소 둘(heavy 2단계)은 답이 그림으로 정해질 때만 묻습니다 (makeHeavy) — 두 시소에 같이 오른
 *    상자가 가장 무거우면 나머지 둘 중 누가 가벼운지는 알 수 없습니다. 그때는 '가장 무거운 것' 만 묻습니다.
 * ⚠️ 들이 2단계의 그릇 그림은 넓이가 들이에 비례하게 그립니다 — 그림과 🥛 개수가 어긋나면 안 됩니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];
  var KO_COUNT = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];

  var ACTS = [
    { id: 'long',  name: '길이 견주기', icon: '🎀', desc: '가장 긴 끈, 가장 짧은 끈을 찾아요',
      levels: [1, 2], names: ['끝이 맞춰져 있어요', '끝이 달라요 (칸 세기)'], def: 1 },
    { id: 'heavy', name: '무게 견주기', icon: '🐘', desc: '시소를 보고 무거운 것, 가벼운 것을 찾아요',
      levels: [1, 2], names: ['시소 하나', '시소 둘'], def: 1 },
    { id: 'fill',  name: '들이 견주기', icon: '🥛', desc: '물이 더 많이 들어가는 그릇을 찾아요',
      levels: [1, 2], names: ['물 높이 보기', '컵으로 세기'], def: 1 },
    { id: 'ruler', name: '자로 재기',   icon: '📏', desc: '자를 보고 몇 cm 인지 재어요',
      levels: [1, 2], names: ['0 에서 시작', '중간에서 시작'], def: 1 }
  ];

  var RIBBON_COLORS = ['#ff8fab', '#5eb1ff', '#ffb84d', '#6dd47e', '#b79bff'];
  var UNITS = 12;                              // 길이 2단계의 칸 수 · 자의 눈금 수

  // 무게 1단계 — w 는 무게 차례(같은 차례끼리는 안 붙이고, 2 넘게 차이 나는 것만 짝지웁니다)
  var THINGS = [
    { emoji: '🪶', name: '깃털', w: 1 },
    { emoji: '🎈', name: '풍선', w: 1 },
    { emoji: '🍓', name: '딸기', w: 2 },
    { emoji: '🐭', name: '생쥐', w: 3 },
    { emoji: '🍎', name: '사과', w: 4 },
    { emoji: '🪨', name: '돌', w: 6 },
    { emoji: '🍉', name: '수박', w: 8 },
    { emoji: '🐱', name: '고양이', w: 10 },
    { emoji: '🐷', name: '돼지', w: 14 },
    { emoji: '🐘', name: '코끼리', w: 20 }
  ];

  // 무게 2단계 — 모양이 같은 상자라 무게는 시소로만 알 수 있습니다
  var BOXES = [
    { emoji: '🟥', name: '빨간 상자' },
    { emoji: '🟦', name: '파란 상자' },
    { emoji: '🟨', name: '노란 상자' },
    { emoji: '🟩', name: '초록 상자' }
  ];

  var act = findAct(UI.getParam('act')) || ACTS[0];
  var BEST_KEY = 'daniland.best.measure.' + act.id;
  var LEVEL_KEY = 'daniland.measure.' + act.id;

  var el = {
    stage: document.getElementById('stage'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

    startOverlay: document.getElementById('startOverlay'),
    startTitle: document.getElementById('startTitle'),
    modeDesc: document.getElementById('modeDesc'),
    levelHint: document.getElementById('levelHint'),
    levelRow: document.getElementById('levelRow'),
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

  var state = {
    level: loadLevel(),
    round: 0,
    stars: 0,
    answer: null,
    prompt: '',
    say: '',            // 맞혔을 때 읽는 말
    hint: '',           // 틀렸을 때 읽는 말
    wrongSay: null,     // 고른 보기에 따라 틀린 말이 달라질 때 (자로 재기)
    last: null,
    firstTry: true,
    locked: false
  };

  if (!window.TTS || !TTS.supported) {
    el.voiceBtn.hidden = true;
    el.speakBtn.hidden = true;
  }

  document.body.classList.add('act-' + act.id);
  document.title = act.name + ' · 다니랜드 📏';
  el.startTitle.textContent = act.icon + ' ' + act.name;
  el.modeDesc.textContent = act.desc;
  buildLevelRow();

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

  el.speakBtn.addEventListener('click', speakPrompt);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '가장 긴 끈을 찾아요'; } });
  });

  var back = Catalog.backHref('measure.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);
  bindGo(el.endHome, 'index.html');

  document.addEventListener('keydown', function (e) {
    if (!el.startOverlay.hidden || !el.endOverlay.hidden || VoicePicker.isOpen()) return;
    var n = parseInt(e.key, 10);
    if (!n || n < 1 || n > 4) return;
    var card = el.cards.children[n - 1];
    if (card) card.click();
  });

  function bindGo(btn, href) {
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  /* ---------- 시작 화면 ---------- */

  function loadLevel() {
    var v = parseInt(UI.loadValue(LEVEL_KEY), 10);
    return (act.levels.indexOf(v) >= 0) ? v : act.def;
  }

  function buildLevelRow() {
    el.levelRow.innerHTML = '';
    act.levels.forEach(function (value, i) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (value === state.level ? ' on' : '');
      b.textContent = act.names[i];
      b.addEventListener('click', function () {
        state.level = value;
        UI.saveValue(LEVEL_KEY, String(value));
        if (window.SFX) SFX.tap();
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 게임 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    state.last = null;
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    if (window.TTS) TTS.cancel();
    el.stage.innerHTML = '';
    el.cards.innerHTML = '';
    state.firstTry = true;
    state.locked = false;
    state.say = '';
    state.hint = '';
    state.wrongSay = null;

    if (act.id === 'long') makeLong();
    else if (act.id === 'heavy') makeHeavy();
    else if (act.id === 'fill') makeFill();
    else makeRuler();

    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  function step() { return ' (' + (state.round + 1) + '/' + ROUNDS + ')'; }

  // 가장 큰 쪽을 물을지 작은 쪽을 물을지 — 반반
  function askMost() { return Math.random() < 0.5; }

  /* ---------- 🎀 길이 견주기 ---------- */

  function makeLong() {
    var most = askMost();
    var grid = state.level === 2;
    var list = grid ? gridRibbons(most) : alignedRibbons();

    var ans = list[0];
    list.forEach(function (r) { if (most ? r.len > ans.len : r.len < ans.len) ans = r; });
    state.answer = ans;

    var word = most ? '가장 긴' : '가장 짧은';
    state.prompt = word + ' 끈을 찾아요.';
    el.questLabel.textContent = word + ' 끈은?' + step();
    state.say = grid ? '칸이 ' + KO_COUNT[ans.len] + ' 개! ' + word + ' 끈이에요.'
                     : '맞아요! ' + word + ' 끈이에요.';
    state.hint = grid ? '끝이 맞춰져 있지 않아요. 칸을 세어 봐요.'
                      : '끝이 맞춰져 있으니까 반대쪽 끝을 봐요.';

    el.cards.className = 'cards ribbon-cards' + (grid ? ' grid' : '');
    UI.shuffle(list.slice()).forEach(function (r) {
      var card = document.createElement('button');
      card.className = 'choice ribbon-row';
      card.innerHTML = '<div class="ribbon" style="left:' + pct(r.s) + ';width:' + pct(r.w) +
                       ';background:' + r.color + '"></div>';
      card.addEventListener('click', function () { choose(card, r); });
      el.cards.appendChild(card);
    });
  }

  // 끈 하나 = { len: 견주는 길이, s: 왼쪽 끝, w: 그리는 폭, color } — s·w 는 줄 폭의 비율(0~1).

  // 1단계 — 왼쪽 끝을 맞춘 끈 셋. 길이는 줄 폭의 비율이고 서로 8% 넘게 차이 납니다.
  function alignedRibbons() {
    var lens, guard = 0;
    do {
      lens = [rand(0.25, 0.97), rand(0.25, 0.97), rand(0.25, 0.97)];
    } while (!apart(lens, 0.08) && ++guard < 50);
    var colors = UI.shuffle(RIBBON_COLORS.slice());
    return lens.map(function (l, i) { return { len: l, s: 0, w: l, color: colors[i] }; });
  }

  // 2단계 — 칸(UNITS) 위의 끈 셋. 길이 2~9칸, 서로 다르고, 시작이 제각각.
  // 열에 일곱은 '가장 멀리 간 끈(가장 짧은 걸 물으면 가장 먼저 끝난 끈)' 이 답이 아니게 만듭니다.
  function gridRibbons(most) {
    var list, guard = 0, trap = Math.random() < 0.7;
    do {
      var colors = UI.shuffle(RIBBON_COLORS.slice());
      list = UI.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).map(function (l, i) {
        return { len: l, s: UI.randInt(0, UNITS - l) / UNITS, w: l / UNITS, color: colors[i] };
      });
    } while (trap && !trapped(list, most) && ++guard < 80);
    return list;
  }

  function trapped(list, most) {
    var ans = list[0], far = list[0];
    list.forEach(function (r) {
      if (most ? r.len > ans.len : r.len < ans.len) ans = r;
      if (most ? r.s + r.w > far.s + far.w : r.s + r.w < far.s + far.w) far = r;
    });
    return ans !== far;
  }

  function pct(v) { return (Math.round(v * 1000) / 10) + '%'; }

  /* ---------- 🐘 무게 견주기 ---------- */

  function makeHeavy() {
    if (state.level === 1) heavyOne();
    else heavyTwo();
  }

  function heavyOne() {
    var a, b, guard = 0;
    do {
      a = pick(THINGS);
      b = pick(THINGS);
    } while ((Math.abs(a.w - b.w) < 2 || a === state.last) && ++guard < 50);
    state.last = a;

    var most = askMost();
    var heavy = a.w > b.w ? a : b, light = heavy === a ? b : a;
    state.answer = most ? heavy : light;

    var word = most ? '더 무거운' : '더 가벼운';
    state.prompt = '시소를 봐요. ' + word + ' 것은 무엇일까요?';
    el.questLabel.textContent = word + ' 것은?' + step();
    state.say = heavy.name + ieoga(heavy.name) + ' ' + light.name + '보다 더 무거워요.';
    state.hint = '시소는 무거운 쪽이 아래로 내려가요.';

    var left = Math.random() < 0.5 ? heavy : light;
    var right = left === heavy ? light : heavy;
    el.stage.appendChild(seesawEl(left, right, left === heavy ? -1 : 1));

    renderThings([a, b]);
  }

  // 시소 둘, 상자 셋. 두 시소에 같이 오르는 상자(shared)가
  //   가운데 무게면 → 두 시소를 이어야 가장 무거운 것·가벼운 것이 다 나옵니다 (반)
  //   가장 무겁거나 가벼우면 → 그쪽만 물을 수 있습니다 (맨 위 주석)
  function heavyTwo() {
    var boxes = UI.shuffle(BOXES.slice()).slice(0, 3);
    boxes.forEach(function (bx, i) { bx.w = i; });     // 섞은 차례가 곧 무게 (0 가벼움 ~ 2 무거움)
    var byW = boxes.slice().sort(function (p, q) { return p.w - q.w; });

    var mid = Math.random() < 0.5;
    var shared = mid ? byW[1] : (Math.random() < 0.5 ? byW[0] : byW[2]);
    var rest = boxes.filter(function (bx) { return bx !== shared; });
    var most = mid ? askMost() : shared === byW[2];

    state.answer = most ? byW[2] : byW[0];
    var word = most ? '가장 무거운' : '가장 가벼운';
    state.prompt = '두 시소를 봐요. ' + word + ' 상자는 무엇일까요?';
    el.questLabel.textContent = word + ' 상자는?' + step();
    state.say = state.answer.name + '! ' + word + ' 상자예요.';
    state.hint = '시소는 무거운 쪽이 내려가요. 두 시소를 같이 봐요.';

    var row = document.createElement('div');
    row.className = 'seesaw-row';
    rest.forEach(function (other) {
      var l = Math.random() < 0.5 ? shared : other, r = l === shared ? other : shared;
      row.appendChild(seesawEl(l, r, l.w > r.w ? -1 : 1));
    });
    el.stage.appendChild(row);

    renderThings(boxes);
  }

  // 시소 그림. down = -1 이면 왼쪽이, 1 이면 오른쪽이 내려갑니다.
  function seesawEl(left, right, down) {
    var box = document.createElement('div');
    box.className = 'seesaw';
    var tilt = down * 12;
    box.innerHTML =
      '<svg viewBox="0 0 220 120" aria-hidden="true">' +
        '<line x1="4" y1="112" x2="216" y2="112" class="ss-ground"/>' +
        '<polygon points="110,74 94,112 126,112" class="ss-stand"/>' +
        '<g transform="rotate(' + tilt + ' 110 74)">' +
          '<rect x="14" y="70" width="192" height="9" rx="4" class="ss-plank"/>' +
          '<text x="40" y="66" class="ss-thing">' + left.emoji + '</text>' +
          '<text x="180" y="66" class="ss-thing">' + right.emoji + '</text>' +
        '</g>' +
      '</svg>';
    return box;
  }

  function renderThings(list) {
    el.cards.className = 'cards thing-cards' + (list.length > 2 ? ' cols-3' : '');
    UI.shuffle(list.slice()).forEach(function (t) {
      var card = document.createElement('button');
      card.className = 'choice';
      card.innerHTML = '<div class="thing-emoji">' + t.emoji + '</div><div class="thing-name">' + t.name + '</div>';
      card.addEventListener('click', function () { choose(card, t); });
      el.cards.appendChild(card);
    });
  }

  /* ---------- 🥛 들이 견주기 ---------- */

  function makeFill() {
    var most = askMost();
    var list = state.level === 1 ? sameGlasses() : cupBowls(most);

    var ans = list[0];
    list.forEach(function (g) { if (most ? g.amount > ans.amount : g.amount < ans.amount) ans = g; });
    state.answer = ans;

    if (state.level === 1) {
      var w1 = most ? '가장 많이' : '가장 적게';
      state.prompt = '물이 ' + w1 + ' 담긴 컵을 찾아요.';
      el.questLabel.textContent = '물이 ' + w1 + ' 담긴 컵은?' + step();
      state.say = '맞아요! 물이 ' + w1 + ' 담겼어요.';
      state.hint = '컵이 똑같으니까 물 높이를 봐요.';
    } else {
      var w2 = most ? '가장 많이' : '가장 적게';
      state.prompt = '작은 컵으로 물을 부어서 가득 채웠어요. ' + w2 + ' 들어가는 그릇을 찾아요.';
      el.questLabel.textContent = w2 + ' 들어가는 그릇은?' + step();
      state.say = '작은 컵으로 ' + KO_COUNT[ans.amount] + ' 번! ' + w2 + ' 들어가요.';
      state.hint = '그릇 크기만 보지 말고, 작은 컵으로 몇 번 부었는지 세어 봐요.';
    }

    el.cards.className = 'cards fill-cards cols-3';
    list.forEach(function (g) {
      var card = document.createElement('button');
      card.className = 'choice';
      card.innerHTML = g.svg + (g.cups ? '<div class="fill-cups">' + cupsHtml(g.amount) + '</div>' : '');
      card.addEventListener('click', function () { choose(card, g); });
      el.cards.appendChild(card);
    });
  }

  // 1단계 — 같은 컵 셋, 물 높이만 다르게 (서로 15% 넘게)
  function sameGlasses() {
    var lv, guard = 0;
    do { lv = [rand(0.15, 0.92), rand(0.15, 0.92), rand(0.15, 0.92)]; } while (!apart(lv, 0.15) && ++guard < 50);
    return lv.map(function (v) { return { amount: v, svg: glassSvg(60, 90, v) }; });
  }

  // 2단계 — 들이 3~7 컵인 그릇 셋. 그림 넓이는 들이에 비례하게 (맨 위 주석),
  // 열에 일곱은 키가 가장 큰 그릇이 답이 아니게 합니다.
  function cupBowls(most) {
    var list, guard = 0, trap = Math.random() < 0.7;
    do {
      list = UI.shuffle([3, 4, 5, 6, 7]).slice(0, 3).map(function (c) {
        var w, h, g2 = 0;
        do { h = rand(30, 100); w = c * 900 / h; } while ((w < 26 || w > 110) && ++g2 < 50);
        return { amount: c, w: w, h: h };
      });
    } while (trap && tallestIsAnswer(list, most) && ++guard < 80);
    return list.map(function (b) { return { amount: b.amount, cups: true, svg: glassSvg(b.w, b.h, 1) }; });
  }

  function tallestIsAnswer(list, most) {
    var tall = list[0], ans = list[0];
    list.forEach(function (b) {
      if (b.h > tall.h) tall = b;
      if (most ? b.amount > ans.amount : b.amount < ans.amount) ans = b;
    });
    return most ? tall === ans : false;
  }

  // 투명한 그릇 하나 (w×h, 바닥이 둥근 사각형), level 은 물 높이 비율 (1 이면 가득)
  function glassSvg(w, h, level) {
    var W = 120, H = 110, x = (W - w) / 2, y = H - 6 - h;
    var wh = h * level;
    return '<svg class="glass-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
             '<rect x="' + f(x) + '" y="' + f(y + h - wh) + '" width="' + f(w) + '" height="' + f(wh) + '" rx="6" class="gl-water"/>' +
             '<path d="M' + f(x) + ' ' + f(y) + ' L' + f(x) + ' ' + f(y + h - 6) + ' Q' + f(x) + ' ' + f(y + h) + ' ' + f(x + 6) + ' ' + f(y + h) +
             ' L' + f(x + w - 6) + ' ' + f(y + h) + ' Q' + f(x + w) + ' ' + f(y + h) + ' ' + f(x + w) + ' ' + f(y + h - 6) +
             ' L' + f(x + w) + ' ' + f(y) + '" class="gl-glass"/>' +
           '</svg>';
  }

  function cupsHtml(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += '<span>🥛</span>';
    return s;
  }

  /* ---------- 📏 자로 재기 ---------- */

  function makeRuler() {
    var start = state.level === 1 ? 0 : UI.randInt(1, 5);
    var len, guard = 0;
    do { len = UI.randInt(2, Math.min(10, UNITS - start)); } while (len === state.last && ++guard < 20);
    state.last = len;
    var end = start + len;

    state.answer = len;
    state.prompt = '연필의 길이는 몇 센티미터일까요?';
    el.questLabel.textContent = '연필은 몇 cm?' + step();
    state.say = len + '센티미터!' + (start ? ' ' + start + '에서 ' + end + '까지 1센티미터가 ' + KO_COUNT[len] + ' 번이에요.' : '');
    state.wrongSay = function (n) {
      if (start && n === end) {
        return '연필 끝은 ' + end + '에 있지만, 0이 아니라 ' + start + '에서 시작했어요. 1센티미터가 몇 번인지 세어 봐요.';
      }
      return '1센티미터가 몇 번 들어가는지 세어 봐요.';
    };

    var box = document.createElement('div');
    box.className = 'ruler-box';
    box.innerHTML = rulerSvg(start, end);
    el.stage.appendChild(box);

    var list = [len];
    if (start) list.push(end);                              // 끝 눈금을 그대로 읽는 실수
    [len - 1, len + 1, len + 2, len - 2].forEach(function (n) {
      if (list.length < 4 && n >= 1 && list.indexOf(n) < 0) list.push(n);
    });

    el.cards.className = 'cards num-cards';
    UI.shuffle(list).forEach(function (n) {
      var card = document.createElement('button');
      card.className = 'choice num-card';
      card.innerHTML = '<div class="num">' + n + '<small> cm</small></div>';
      card.addEventListener('click', function () { choose(card, n); });
      el.cards.appendChild(card);
    });
  }

  // 0~12 cm 자와 그 위의 연필. 1cm = 40, 0.5cm 마다 작은 눈금.
  function rulerSvg(start, end) {
    var U = 40, L = 20, W = UNITS * U + L * 2;
    var s = '<svg class="ruler-svg" viewBox="0 0 ' + W + ' 150" aria-hidden="true">';

    // 연필 (몸통 + 깎은 끝 + 심) — 뒤 끝이 start, 심 끝이 end 에 딱 닿습니다
    var x0 = L + start * U, x1 = L + end * U, tip = Math.min(34, (x1 - x0) * 0.35);
    s += '<rect x="' + x0 + '" y="24" width="' + f(x1 - x0 - tip) + '" height="30" rx="3" class="pc-body"/>' +
         '<polygon points="' + f(x1 - tip) + ',24 ' + x1 + ',39 ' + f(x1 - tip) + ',54" class="pc-wood"/>' +
         '<polygon points="' + f(x1 - tip * 0.35) + ',33.5 ' + x1 + ',39 ' + f(x1 - tip * 0.35) + ',44.5" class="pc-lead"/>' +
         '<line x1="' + x0 + '" y1="58" x2="' + x0 + '" y2="72" class="pc-guide"/>' +
         '<line x1="' + x1 + '" y1="58" x2="' + x1 + '" y2="72" class="pc-guide"/>';

    s += '<rect x="2" y="72" width="' + (W - 4) + '" height="70" rx="8" class="rl-body"/>';
    for (var i = 0; i <= UNITS * 2; i++) {
      var x = L + i * U / 2, big = i % 2 === 0;
      s += '<line x1="' + x + '" y1="72" x2="' + x + '" y2="' + (big ? 100 : 88) + '" class="rl-tick"/>';
      if (big) s += '<text x="' + x + '" y="122" class="rl-num">' + (i / 2) + '</text>';
    }
    s += '<text x="' + (W - 10) + '" y="138" class="rl-cm">cm</text>';
    return s + '</svg>';
  }

  /* ---------- 정답 확인 ---------- */

  function choose(card, it) {
    if (state.locked || card.classList.contains('dim')) return;

    if (it === state.answer) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      card.classList.add('correct');
      UI.addMark(card, '⭕');
      UI.confettiAt(card);
      if (state.firstTry) { state.stars += 1; updateScore(); }

      speak(state.say);
      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';
      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, 2400);

    } else {
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      card.classList.add('wrong');
      setTimeout(function () {
        card.classList.remove('wrong');
        card.classList.add('dim');
      }, 400);
      var say = state.wrongSay ? state.wrongSay(it) : state.hint;
      setTimeout(function () { speak(say); }, 500);
    }
  }

  /* ---------- 끝 ---------- */

  function finish() {
    el.bar.style.width = '100%';
    UI.saveBest(BEST_KEY, state.stars, ROUNDS);

    el.endStars.textContent = UI.starLine(state.stars, ROUNDS);
    el.endTitle.textContent = (state.stars === ROUNDS)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = ROUNDS + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  /* ---------- 도우미 ---------- */

  // 모든 두 값이 gap 넘게 떨어져 있나
  function apart(vals, gap) {
    for (var i = 0; i < vals.length; i++) {
      for (var j = i + 1; j < vals.length; j++) if (Math.abs(vals[i] - vals[j]) < gap) return false;
    }
    return true;
  }

  function ieoga(w) {
    var c = w.charCodeAt(w.length - 1);
    return (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0) ? '이' : '가';
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function f(x) { return (Math.round(x * 10) / 10).toString(); }

  function speakPrompt() { speak(state.prompt); }

  function speak(text) {
    if (!text || !window.TTS || !TTS.supported) return;
    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, {
      onend: function () { el.speakBtn.classList.remove('speaking'); }
    });
    setTimeout(function () { el.speakBtn.classList.remove('speaking'); }, 3000);
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }
})();
