/* =========================================================================
 * 다니랜드 - 글자 쓰기 (따라 쓰기)
 *
 * 주소) write.html
 *
 * 연한 글자 위를 손가락으로 덧그립니다. 써 볼 것은 시작 화면에서 고릅니다.
 *   자음 · 모음 · 숫자 : 획을 하나씩 안내합니다 (①번 획부터 차례대로)
 *   낱말               : 글자 전체를 자유롭게 따라 씁니다 (획 안내 없음)
 *
 * 잘 썼는지는 '얼마나 덮었나' 로 봅니다. 눈에 안 보이는 캔버스 두 장에
 *   ① 안내 획   ② 아이가 그은 획
 * 을 각각 그린 뒤 점을 세어, 안내를 얼마나 덮었는지(covered)와
 * 안내 밖으로 얼마나 나갔는지(spill)를 견줍니다. 획 모양이 조금 삐뚤어도
 * 통과하도록 넉넉하게 잡아 두었습니다 (아래 OK_COVER / OK_SPILL).
 *
 * 획 좌표는 모두 0~1 사이의 비율입니다. 칸 크기가 달라져도 그대로 쓰입니다.
 * 손가락으로 그은 점도 같은 비율로 저장하므로 화면을 돌려도 그림이 안 깨집니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 8;          // 한 판에 쓸 글자(낱말) 수
  var LANG = 'ko-KR';
  var CELL_MIN = 120;      // 칸이 이보다 작아지면 손가락으로 못 씁니다
  var CELL_MAX = 420;
  var BORDER = 4;          // css 의 .write-cell 테두리 두께
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 썼어요!'];

  /* ---------- 동그란 획 만들기 (ㅇ ㅎ 8 9 0) ---------- */

  // 12시에서 시작해 왼쪽으로 도는 동그라미를 점 여러 개로 풉니다.
  function ring(cx, cy, rx, ry) {
    var pts = [];
    var from = -Math.PI / 2;
    var to = from - Math.PI * 2;
    for (var i = 0; i <= 28; i++) {
      var a = from + (to - from) * (i / 28);
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return pts;
  }

  /* =======================================================================
   * 쓸 글자와 획순
   *
   * strokes 안의 배열 하나가 획 하나입니다. 획 안의 [x, y] 는 칸을 1×1 로
   * 봤을 때의 자리(왼쪽 위가 0,0). 획을 긋는 방향도 이 차례를 따릅니다.
   *
   * 획순은 유아 쓰기 교재에서 흔히 쓰는 차례를 따랐습니다.
   * ===================================================================== */

  var CONSONANTS = [
    { ch: 'ㄱ', name: '기역', strokes: [ [[0.18, 0.22], [0.80, 0.22], [0.60, 0.82]] ] },
    { ch: 'ㄴ', name: '니은', strokes: [ [[0.25, 0.18], [0.25, 0.78], [0.80, 0.78]] ] },
    { ch: 'ㄷ', name: '디귿', strokes: [
      [[0.20, 0.20], [0.80, 0.20]],
      [[0.20, 0.20], [0.20, 0.78], [0.80, 0.78]]
    ] },
    { ch: 'ㄹ', name: '리을', strokes: [
      [[0.20, 0.20], [0.78, 0.20], [0.78, 0.48]],
      [[0.20, 0.48], [0.78, 0.48]],
      [[0.20, 0.48], [0.20, 0.76], [0.78, 0.76]]
    ] },
    { ch: 'ㅁ', name: '미음', strokes: [
      [[0.22, 0.20], [0.22, 0.78]],
      [[0.22, 0.20], [0.78, 0.20], [0.78, 0.78]],
      [[0.22, 0.78], [0.78, 0.78]]
    ] },
    { ch: 'ㅂ', name: '비읍', strokes: [
      [[0.22, 0.18], [0.22, 0.80]],
      [[0.78, 0.18], [0.78, 0.80]],
      [[0.22, 0.50], [0.78, 0.50]],
      [[0.22, 0.80], [0.78, 0.80]]
    ] },
    { ch: 'ㅅ', name: '시옷', strokes: [
      [[0.50, 0.20], [0.20, 0.82]],
      [[0.50, 0.42], [0.80, 0.82]]
    ] },
    { ch: 'ㅇ', name: '이응', strokes: [ ring(0.50, 0.50, 0.30, 0.30) ] },
    { ch: 'ㅈ', name: '지읒', strokes: [
      [[0.20, 0.26], [0.80, 0.26]],
      [[0.50, 0.26], [0.22, 0.80]],
      [[0.50, 0.26], [0.78, 0.80]]
    ] },
    { ch: 'ㅊ', name: '치읓', strokes: [
      [[0.50, 0.10], [0.50, 0.22]],
      [[0.20, 0.34], [0.80, 0.34]],
      [[0.50, 0.34], [0.22, 0.84]],
      [[0.50, 0.34], [0.78, 0.84]]
    ] },
    { ch: 'ㅋ', name: '키읔', strokes: [
      [[0.18, 0.22], [0.80, 0.22], [0.60, 0.82]],
      [[0.30, 0.50], [0.72, 0.50]]
    ] },
    { ch: 'ㅌ', name: '티읕', strokes: [
      [[0.20, 0.20], [0.80, 0.20]],
      [[0.20, 0.50], [0.80, 0.50]],
      [[0.20, 0.20], [0.20, 0.80], [0.80, 0.80]]
    ] },
    { ch: 'ㅍ', name: '피읖', strokes: [
      [[0.16, 0.26], [0.84, 0.26]],
      [[0.32, 0.26], [0.28, 0.76]],
      [[0.68, 0.26], [0.72, 0.76]],
      [[0.16, 0.76], [0.84, 0.76]]
    ] },
    { ch: 'ㅎ', name: '히읗', strokes: [
      [[0.50, 0.10], [0.50, 0.22]],
      [[0.22, 0.32], [0.78, 0.32]],
      ring(0.50, 0.62, 0.22, 0.22)
    ] }
  ];

  var VOWELS = [
    { ch: 'ㅏ', name: '아', strokes: [
      [[0.42, 0.10], [0.42, 0.90]],
      [[0.42, 0.50], [0.78, 0.50]]
    ] },
    { ch: 'ㅑ', name: '야', strokes: [
      [[0.44, 0.10], [0.44, 0.90]],
      [[0.44, 0.36], [0.80, 0.36]],
      [[0.44, 0.64], [0.80, 0.64]]
    ] },
    { ch: 'ㅓ', name: '어', strokes: [
      [[0.22, 0.50], [0.58, 0.50]],
      [[0.58, 0.10], [0.58, 0.90]]
    ] },
    { ch: 'ㅕ', name: '여', strokes: [
      [[0.20, 0.36], [0.56, 0.36]],
      [[0.20, 0.64], [0.56, 0.64]],
      [[0.56, 0.10], [0.56, 0.90]]
    ] },
    { ch: 'ㅗ', name: '오', strokes: [
      [[0.50, 0.22], [0.50, 0.62]],
      [[0.12, 0.62], [0.88, 0.62]]
    ] },
    { ch: 'ㅛ', name: '요', strokes: [
      [[0.34, 0.24], [0.34, 0.62]],
      [[0.66, 0.24], [0.66, 0.62]],
      [[0.12, 0.62], [0.88, 0.62]]
    ] },
    { ch: 'ㅜ', name: '우', strokes: [
      [[0.12, 0.40], [0.88, 0.40]],
      [[0.50, 0.40], [0.50, 0.80]]
    ] },
    { ch: 'ㅠ', name: '유', strokes: [
      [[0.12, 0.40], [0.88, 0.40]],
      [[0.34, 0.40], [0.34, 0.78]],
      [[0.66, 0.40], [0.66, 0.78]]
    ] },
    { ch: 'ㅡ', name: '으', strokes: [ [[0.10, 0.50], [0.90, 0.50]] ] },
    { ch: 'ㅣ', name: '이', strokes: [ [[0.50, 0.08], [0.50, 0.92]] ] }
  ];

  var NUMBERS = [
    { ch: '1', name: '일', strokes: [
      [[0.34, 0.28], [0.52, 0.12]],
      [[0.52, 0.12], [0.52, 0.88]]
    ] },
    { ch: '2', name: '이', strokes: [
      [[0.24, 0.30], [0.34, 0.18], [0.52, 0.14], [0.70, 0.24], [0.68, 0.42], [0.48, 0.60], [0.26, 0.82], [0.78, 0.82]]
    ] },
    { ch: '3', name: '삼', strokes: [
      [[0.26, 0.24], [0.44, 0.14], [0.66, 0.20], [0.68, 0.36], [0.48, 0.48], [0.70, 0.58], [0.70, 0.76], [0.48, 0.86], [0.26, 0.78]]
    ] },
    { ch: '4', name: '사', strokes: [
      [[0.62, 0.12], [0.20, 0.62], [0.84, 0.62]],
      [[0.62, 0.12], [0.62, 0.88]]
    ] },
    { ch: '5', name: '오', strokes: [
      [[0.34, 0.16], [0.32, 0.46], [0.52, 0.40], [0.72, 0.54], [0.68, 0.76], [0.46, 0.86], [0.28, 0.80]],
      [[0.34, 0.16], [0.72, 0.16]]
    ] },
    { ch: '6', name: '육', strokes: [
      [[0.68, 0.14], [0.44, 0.28], [0.32, 0.52], [0.30, 0.72], [0.44, 0.86], [0.64, 0.82], [0.70, 0.64], [0.58, 0.50], [0.38, 0.54], [0.32, 0.66]]
    ] },
    { ch: '7', name: '칠', strokes: [ [[0.24, 0.20], [0.78, 0.20], [0.44, 0.88]] ] },
    { ch: '8', name: '팔', strokes: [
      ring(0.50, 0.30, 0.18, 0.16),
      ring(0.50, 0.68, 0.24, 0.22)
    ] },
    { ch: '9', name: '구', strokes: [
      ring(0.48, 0.32, 0.20, 0.20),
      [[0.68, 0.32], [0.68, 0.88]]
    ] },
    { ch: '0', name: '영', strokes: [ ring(0.50, 0.50, 0.26, 0.38) ] }
  ];

  // 낱말은 획순 없이 글자 전체를 따라 씁니다. 받침이 없거나 쉬운 것만 골랐습니다.
  var WORDS = [
    { emoji: '🐾', word: '다니' },
    { emoji: '👩', word: '엄마' },
    { emoji: '👨', word: '아빠' },
    { emoji: '👶', word: '아기' },
    { emoji: '🍎', word: '사과' },
    { emoji: '🍇', word: '포도' },
    { emoji: '🥛', word: '우유' },
    { emoji: '🌳', word: '나무' },
    { emoji: '🦋', word: '나비' },
    { emoji: '🐰', word: '토끼' },
    { emoji: '🦆', word: '오리' },
    { emoji: '🦛', word: '하마' },
    { emoji: '🧢', word: '모자' },
    { emoji: '👖', word: '바지' },
    { emoji: '🌊', word: '바다' },
    { emoji: '🍚', word: '밥' },
    { emoji: '⭐', word: '별' },
    { emoji: '🌙', word: '달' },
    { emoji: '🏠', word: '집' },
    { emoji: '🌸', word: '꽃' },
    { emoji: '⛰️', word: '산' },
    { emoji: '🐻', word: '곰' }
  ];

  var SETS = [
    { id: 'cons',  name: '자음', icon: 'ㄱ',  hint: 'ㄱ 부터 ㅎ 까지 열네 자를 획순대로 써요', items: CONSONANTS },
    { id: 'vowel', name: '모음', icon: 'ㅏ',  hint: 'ㅏ 부터 ㅣ 까지 열 자를 획순대로 써요',   items: VOWELS },
    { id: 'num',   name: '숫자', icon: '1',   hint: '1 부터 0 까지 획순대로 써요',            items: NUMBERS },
    { id: 'word',  name: '낱말', icon: '✏️', hint: '그림을 보고 낱말을 따라 써요',            items: WORDS }
  ];

  /* ---------- 통과 기준 ----------
   * covered : 안내 획을 아이 획이 덮은 비율 (이만큼은 덮어야 통과)
   * spill   : 아이 획이 안내 밖으로 나간 비율 (이보다 많이 나가면 다시)
   * 낱말은 글자 전체가 안내라서 획보다 넉넉하게 봐 줍니다. */
  var OK_COVER = { stroke: 0.70, glyph: 0.62 };
  var OK_SPILL = { stroke: 0.34, glyph: 0.40 };

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var el = {
    cells: document.getElementById('cells'),
    stage: document.getElementById('stage'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    hint: document.getElementById('hint'),
    showBtn: document.getElementById('showBtn'),
    soundBtn: document.getElementById('soundBtn'),
    clearBtn: document.getElementById('clearBtn'),
    skipBtn: document.getElementById('skipBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

    startOverlay: document.getElementById('startOverlay'),
    setRow: document.getElementById('setRow'),
    setHint: document.getElementById('setHint'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endSets: document.getElementById('endSets'),
    endHome: document.getElementById('endHome')
  };

  var state = {
    set: UI.loadValue('daniland.writeSet') || 'cons',
    queue: [],
    round: 0,
    total: ROUNDS,
    stars: 0,
    item: null,
    cells: [],
    cellIndex: 0,
    firstTry: true,
    misses: 0,
    locked: true,
    busy: false,        // 획순을 보여주는 동안은 못 씁니다
    flash: false,       // 낱말에서 '어떻게 쓸까' 를 눌렀을 때 글자를 잠깐 진하게
    drawing: false,
    pointerId: null
  };

  if (!findSet(state.set)) state.set = 'cons';
  if (!window.TTS || !TTS.supported) { el.voiceBtn.hidden = true; el.soundBtn.hidden = true; }

  buildSetRow();
  bindHome();

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

  el.endSets.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    buildSetRow();
    el.startOverlay.hidden = false;
  });

  el.showBtn.addEventListener('click', showDemo);
  el.soundBtn.addEventListener('click', speakItem);
  el.clearBtn.addEventListener('click', clearCell);
  el.skipBtn.addEventListener('click', skipPart);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.item ? state.item.speak : '가나다'; } });
  });

  window.addEventListener('resize', function () {
    if (state.cells.length) fitCells();
  });

  /* ---------- 시작 화면 ---------- */

  function findSet(id) {
    for (var i = 0; i < SETS.length; i++) if (SETS[i].id === id) return SETS[i];
    return null;
  }

  function buildSetRow() {
    el.setRow.innerHTML = '';

    SETS.forEach(function (s) {
      var best = UI.readBest('daniland.best.write.' + s.id);
      var b = document.createElement('button');
      b.className = 'mode-btn' + (s.id === state.set ? ' on' : '');
      b.innerHTML = '<span class="mi">' + s.icon + '</span>' +
                    '<span class="mn">' + s.name + '</span>' +
                    '<span class="mb">' + (best ? '⭐ ' + best.stars + '/' + best.total : '') + '</span>';
      b.addEventListener('click', function () {
        state.set = s.id;
        UI.saveValue('daniland.writeSet', s.id);
        Array.prototype.forEach.call(el.setRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
        el.setHint.textContent = s.hint;
      });
      el.setRow.appendChild(b);
    });

    el.setHint.textContent = findSet(state.set).hint;
  }

  /* ---------- 한 판 ---------- */

  function startGame() {
    var items = UI.shuffle(findSet(state.set).items.slice());
    state.queue = items.slice(0, Math.min(ROUNDS, items.length));
    state.total = state.queue.length;
    state.round = 0;
    state.stars = 0;
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= state.queue.length) { finish(); return; }

    var raw = state.queue[state.round];
    state.round++;
    updateBar(state.round - 1);

    state.item = buildItem(raw);
    state.cells = state.item.cells;
    state.cellIndex = 0;
    state.firstTry = true;
    state.misses = 0;
    state.locked = false;
    state.flash = false;
    el.skipBtn.hidden = true;

    el.questLabel.textContent = state.item.label;
    el.stage.textContent = state.item.emoji;
    el.stage.className = state.item.emoji ? 'write-art' : '';
    el.hint.textContent = state.item.cells[0].parts[0].glyph
      ? '연한 글자를 따라 써 보세요'
      : '파란 ① 부터 차례대로 그어 보세요';

    renderCells();
    setTimeout(speakItem, 250);
  }

  // 문제 하나 = 칸 하나(자모·숫자) 또는 글자 수만큼의 칸(낱말)
  function buildItem(raw) {
    if (raw.strokes) {
      var parts = raw.strokes.map(function (pts) { return { pts: pts }; });
      return {
        label: raw.ch + ' · ' + raw.name,
        speak: raw.name,
        emoji: '',
        cells: [makeCell(raw.ch, parts)]
      };
    }

    var chars = raw.word.split('');
    return {
      label: raw.word,
      speak: raw.word,
      emoji: raw.emoji || '',
      cells: chars.map(function (ch) { return makeCell(ch, [{ glyph: ch }]); })
    };
  }

  function makeCell(ch, parts) {
    return { ch: ch, parts: parts, at: 0, ink: [], cur: null, size: 0, box: null, canvas: null, ctx: null };
  }

  function finish() {
    updateBar(state.total);

    // 묶음별 기록과, 그중 제일 잘한 기록(카드의 ⭐ 가 읽는 것)을 함께 남깁니다.
    UI.saveBest('daniland.best.write.' + state.set, state.stars, state.total);
    UI.saveBest('daniland.best.write', state.stars, state.total);

    el.endStars.textContent = UI.starLine(state.stars, state.total);
    el.endTitle.textContent = (state.stars === state.total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = state.total + '개 중에 ' + state.stars + '개를 한 번에 잘 썼어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 칸 만들기 · 크기 맞추기 ---------- */

  function renderCells() {
    el.cells.innerHTML = '';

    state.cells.forEach(function (cell) {
      var box = document.createElement('div');
      box.className = 'write-cell';

      var cv = document.createElement('canvas');
      box.appendChild(cv);
      el.cells.appendChild(box);

      cell.box = box;
      cell.canvas = cv;
      cell.ctx = cv.getContext('2d');
      bindPointer(cell);
    });

    fitCells();
    syncCells();
  }

  // 칸은 스크롤 없이 한 화면에 들어와야 합니다.
  // 가로는 칸 수로 나누고, 세로는 도구 줄까지 빼고 남는 만큼만 씁니다.
  function fitCells() {
    var n = state.cells.length || 1;
    var gap = 10;
    var wide = el.cells.clientWidth || (document.documentElement.clientWidth - 32);

    var top = el.cells.getBoundingClientRect().top;
    var below = outerHeight(el.hint) + outerHeight(document.querySelector('.tools')) + 28;
    var tall = window.innerHeight - top - below;

    var size = Math.floor(Math.min((wide - gap * (n - 1)) / n, tall, CELL_MAX));
    if (!(size > 0) || size < CELL_MIN) size = CELL_MIN;

    state.cells.forEach(function (cell) {
      // 칸 테두리(css 의 .write-cell) 두께만큼 캔버스가 작습니다.
      cell.size = size - BORDER * 2;
      cell.box.style.width = size + 'px';
      cell.box.style.height = size + 'px';
      cell.canvas.style.width = cell.size + 'px';
      cell.canvas.style.height = cell.size + 'px';
      cell.canvas.width = Math.round(cell.size * dpr);
      cell.canvas.height = Math.round(cell.size * dpr);
      cell.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintCell(cell);
    });
  }

  function outerHeight(node) {
    if (!node || node.hidden) return 0;
    var box = node.getBoundingClientRect();
    var css = window.getComputedStyle(node);
    return box.height + parseFloat(css.marginTop || 0) + parseFloat(css.marginBottom || 0);
  }

  // 지금 쓸 칸에 표시를 옮깁니다.
  function syncCells() {
    state.cells.forEach(function (cell, i) {
      cell.box.classList.toggle('on', i === state.cellIndex && !state.locked);
      cell.box.classList.toggle('done', cell.at >= cell.parts.length);
      paintCell(cell);
    });
  }

  /* ---------- 그리기 ---------- */

  function paintCell(cell) {
    if (!cell.ctx || !cell.size) return;

    var c = cell.ctx;
    var s = cell.size;
    var active = (state.cells[state.cellIndex] === cell) && !state.locked;

    c.clearRect(0, 0, s, s);
    drawGrid(c, s);

    // 아직 안 쓴 안내
    cell.parts.forEach(function (part, i) {
      if (i < cell.at) return;                 // 이미 쓴 획은 아이 잉크로 보입니다

      if (part.glyph) {
        c.save();
        c.fillStyle = state.flash && active ? 'rgba(64,50,58,0.34)' : 'rgba(64,50,58,0.14)';
        glyphFont(c, s);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(part.glyph, s / 2, s * 0.54);
        c.restore();
        return;
      }

      var now = active && i === cell.at;
      strokeLine(c, part.pts, s, s * 0.13, now ? '#bcd9ff' : 'rgba(64,50,58,0.13)');
    });

    // 아이가 쓴 것
    cell.ink.forEach(function (pts) { strokeLine(c, pts, s, s * 0.085, '#40323a'); });
    if (cell.cur) strokeLine(c, cell.cur, s, s * 0.085, '#40323a');

    // 지금 그을 획의 시작점과 번호
    if (active && cell.at < cell.parts.length && cell.parts[cell.at].pts) {
      drawStart(c, cell.parts[cell.at].pts, s, cell.at + 1);
    }
  }

  function drawGrid(c, s) {
    c.save();
    c.strokeStyle = 'rgba(94,177,255,0.32)';
    c.lineWidth = 1.5;
    c.setLineDash([6, 8]);
    c.beginPath();
    c.moveTo(s / 2, 8); c.lineTo(s / 2, s - 8);
    c.moveTo(8, s / 2); c.lineTo(s - 8, s / 2);
    c.stroke();
    c.restore();
  }

  function strokeLine(c, pts, s, width, color) {
    if (!pts || !pts.length) return;

    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    if (pts.length === 1) {
      c.beginPath();
      c.arc(pts[0][0] * s, pts[0][1] * s, width / 2, 0, Math.PI * 2);
      c.fill();
    } else {
      c.beginPath();
      c.moveTo(pts[0][0] * s, pts[0][1] * s);
      for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * s, pts[i][1] * s);
      c.stroke();
    }
    c.restore();
  }

  function drawStart(c, pts, s, no) {
    var x = pts[0][0] * s;
    var y = pts[0][1] * s;
    var r = s * 0.085;

    c.save();
    c.fillStyle = '#5eb1ff';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#fff';
    c.font = '800 ' + Math.round(r * 1.25) + 'px "Nanum Gothic", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(no), x, y);
    c.restore();
  }

  function glyphFont(c, s) {
    c.font = '700 ' + Math.round(s * 0.7) +
             'px "Nanum Gothic", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  }

  /* ---------- 손가락 ---------- */

  function bindPointer(cell) {
    var cv = cell.canvas;

    cv.addEventListener('pointerdown', function (e) {
      if (state.locked || state.busy) return;
      if (state.cells[state.cellIndex] !== cell) return;

      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      state.drawing = true;
      state.pointerId = e.pointerId;
      cell.cur = [pointAt(cv, e)];
      paintCell(cell);
    });

    cv.addEventListener('pointermove', function (e) {
      if (!state.drawing || e.pointerId !== state.pointerId) return;
      e.preventDefault();
      cell.cur.push(pointAt(cv, e));
      paintCell(cell);
    });

    ['pointerup', 'pointercancel'].forEach(function (type) {
      cv.addEventListener(type, function (e) {
        if (!state.drawing || e.pointerId !== state.pointerId) return;
        state.drawing = false;
        state.pointerId = null;
        endStroke(cell);
      });
    });
  }

  // 손가락 자리를 0~1 비율로 저장합니다 (칸 크기가 바뀌어도 그대로 씁니다).
  function pointAt(cv, e) {
    var box = cv.getBoundingClientRect();
    return [(e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height];
  }

  function endStroke(cell) {
    var pts = cell.cur || [];
    cell.cur = null;

    // 톡 찍기만 한 것은 획으로 세지 않습니다.
    if (pts.length < 2) { paintCell(cell); return; }

    var part = cell.parts[cell.at];
    if (!part) { paintCell(cell); return; }

    if (part.glyph) {
      // 낱말은 여러 번 그어도 됩니다. 그을 때마다 다 덮였는지만 봅니다.
      cell.ink.push(pts);
      if (check(cell, part, cell.ink).ok) { passPart(cell); return; }

      paintCell(cell);
      state.misses++;
      if (state.misses >= 3) el.skipBtn.hidden = false;
      return;
    }

    if (check(cell, part, [pts]).ok) {
      cell.ink.push(pts);
      passPart(cell);
      return;
    }

    // 틀려도 지우기만 하고 벌하지 않습니다. 다시 그으면 됩니다.
    paintCell(cell);
    state.firstTry = false;
    state.misses++;
    if (window.SFX) SFX.wrong();
    cell.box.classList.add('shake');
    setTimeout(function () { cell.box.classList.remove('shake'); }, 420);
    el.hint.textContent = '파란 ' + circled(cell.at + 1) + ' 에서 시작해 천천히 그어 보세요';
    if (state.misses >= 2) el.skipBtn.hidden = false;
  }

  function passPart(cell) {
    cell.at++;
    state.misses = 0;
    el.skipBtn.hidden = true;

    if (cell.at >= cell.parts.length) {
      cell.box.classList.add('done');
      finishCell(cell);
      return;
    }

    if (window.SFX) SFX.tap();
    el.hint.textContent = '이제 ' + circled(cell.at + 1) + ' 획이에요';
    paintCell(cell);
  }

  function finishCell(cell) {
    if (window.SFX) SFX.correct();
    state.cellIndex++;

    if (state.cellIndex < state.cells.length) {
      el.hint.textContent = '다음 글자도 써 볼까요?';
      syncCells();
      return;
    }

    // 글자(낱말)를 다 썼습니다.
    state.locked = true;
    syncCells();
    UI.confettiAt(cell.box);
    el.hint.textContent = '';

    if (state.firstTry) { state.stars++; updateScore(); }

    speakItem();
    setTimeout(nextRound, 1300);
  }

  function clearCell() {
    var cell = state.cells[state.cellIndex];
    if (!cell || state.locked) return;

    cell.ink = [];
    cell.cur = null;
    cell.at = 0;
    state.firstTry = false;
    state.misses = 0;
    el.skipBtn.hidden = true;
    el.hint.textContent = cell.parts[0].glyph
      ? '연한 글자를 따라 써 보세요'
      : '파란 ① 부터 차례대로 그어 보세요';
    syncCells();
  }

  // 아무리 해도 안 되면 여기서 넘어갑니다 (안내 획을 대신 그어 줍니다).
  function skipPart() {
    var cell = state.cells[state.cellIndex];
    if (!cell || state.locked) return;

    var part = cell.parts[cell.at];
    state.firstTry = false;
    state.misses = 0;
    el.skipBtn.hidden = true;

    if (part && part.pts) cell.ink.push(part.pts.slice());
    cell.at++;

    if (cell.at >= cell.parts.length) {
      cell.box.classList.add('done');
      finishCell(cell);
    } else {
      el.hint.textContent = '이제 ' + circled(cell.at + 1) + ' 획이에요';
      paintCell(cell);
    }
  }

  /* ---------- 얼마나 덮었나 (통과 판정) ----------
   * 눈에 안 보이는 캔버스 두 장에 안내와 아이 획을 각각 그리고 점을 세어 봅니다.
   * 기기 배율(dpr)은 쓰지 않습니다 — 점만 세면 되니 화면 크기 그대로가 빠릅니다. */

  var pads = {};

  function pad(key, s) {
    var p = pads[key];
    if (!p) {
      p = pads[key] = { cv: document.createElement('canvas') };
      p.ctx = p.cv.getContext('2d', { willReadFrequently: true });
    }
    if (p.cv.width !== s) { p.cv.width = s; p.cv.height = s; }
    return p;
  }

  function check(cell, part, inkList) {
    var s = Math.max(80, Math.round(cell.size));
    var kind = part.glyph ? 'glyph' : 'stroke';
    var a = pad('guide', s);
    var b = pad('ink', s);

    // ① 안내(가느다란 속심)를 아이 획(두툼하게)이 얼마나 덮었나
    paintGuide(a.ctx, s, part, false);
    paintInk(b.ctx, s, inkList, s * (part.glyph ? 0.20 : 0.24));
    var one = compare(a.ctx, b.ctx, s);
    var covered = one.a ? one.both / one.a : 0;

    // ② 아이 획(가느다랗게)이 안내(넉넉하게) 밖으로 얼마나 나갔나
    paintGuide(a.ctx, s, part, true);
    paintInk(b.ctx, s, inkList, s * 0.05);
    var two = compare(a.ctx, b.ctx, s);
    var spill = two.b ? (two.b - two.both) / two.b : 1;

    return { ok: covered >= OK_COVER[kind] && spill <= OK_SPILL[kind], covered: covered, spill: spill };
  }

  function paintGuide(c, s, part, fat) {
    c.clearRect(0, 0, s, s);
    c.fillStyle = '#000';
    c.strokeStyle = '#000';
    c.lineCap = 'round';
    c.lineJoin = 'round';

    if (part.glyph) {
      glyphFont(c, s);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      if (fat) {
        c.lineWidth = s * 0.16;
        c.strokeText(part.glyph, s / 2, s * 0.54);
      }
      c.fillText(part.glyph, s / 2, s * 0.54);
      return;
    }

    c.lineWidth = s * (fat ? 0.34 : 0.05);
    c.beginPath();
    c.moveTo(part.pts[0][0] * s, part.pts[0][1] * s);
    for (var i = 1; i < part.pts.length; i++) c.lineTo(part.pts[i][0] * s, part.pts[i][1] * s);
    c.stroke();
  }

  function paintInk(c, s, list, width) {
    c.clearRect(0, 0, s, s);
    c.fillStyle = '#000';
    c.strokeStyle = '#000';
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    list.forEach(function (pts) {
      if (!pts || !pts.length) return;
      if (pts.length === 1) {
        c.beginPath();
        c.arc(pts[0][0] * s, pts[0][1] * s, width / 2, 0, Math.PI * 2);
        c.fill();
        return;
      }
      c.beginPath();
      c.moveTo(pts[0][0] * s, pts[0][1] * s);
      for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * s, pts[i][1] * s);
      c.stroke();
    });
  }

  // 두 그림에서 칠해진 점의 개수와 겹친 개수 (두 칸에 한 번씩만 세어 빠르게)
  function compare(ca, cb, s) {
    var da = ca.getImageData(0, 0, s, s).data;
    var db = cb.getImageData(0, 0, s, s).data;
    var a = 0, b = 0, both = 0;

    for (var y = 0; y < s; y += 2) {
      for (var x = 0; x < s; x += 2) {
        var i = (y * s + x) * 4 + 3;
        var ia = da[i] > 60;
        var ib = db[i] > 60;
        if (ia) a++;
        if (ib) b++;
        if (ia && ib) both++;
      }
    }
    return { a: a, b: b, both: both };
  }

  /* ---------- 어떻게 쓸까 (획순 보여주기) ---------- */

  function showDemo() {
    var cell = state.cells[state.cellIndex];
    if (!cell || state.locked || state.busy) return;

    var part = cell.parts[cell.at];
    if (!part) return;

    // 낱말은 보여줄 획이 없으니 연한 글자를 잠깐 진하게 비춰 줍니다.
    if (part.glyph) {
      state.flash = true;
      paintCell(cell);
      setTimeout(function () { state.flash = false; paintCell(cell); }, 900);
      return;
    }

    state.busy = true;
    el.showBtn.classList.add('on');

    var pts = part.pts;
    var dur = Math.max(700, lengthOf(pts) * 1900);
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();

    function frame(now) {
      var f = Math.min(1, (now - t0) / dur);
      paintCell(cell);
      strokeLine(cell.ctx, upTo(pts, f), cell.size, cell.size * 0.11, '#ff8fab');
      if (f < 1) {
        requestAnimationFrame(frame);
      } else {
        state.busy = false;
        el.showBtn.classList.remove('on');
        setTimeout(function () { paintCell(cell); }, 260);
      }
    }
    requestAnimationFrame(frame);
  }

  function lengthOf(pts) {
    var total = 0;
    for (var i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i]);
    return total;
  }

  function dist(p, q) {
    var dx = p[0] - q[0];
    var dy = p[1] - q[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 획의 앞쪽 f 만큼만 잘라 냅니다 (0 ~ 1).
  function upTo(pts, f) {
    var total = lengthOf(pts);
    if (!total) return pts.slice();

    var want = total * f;
    var out = [pts[0]];
    var walked = 0;

    for (var i = 1; i < pts.length; i++) {
      var d = dist(pts[i - 1], pts[i]);
      if (walked + d >= want) {
        var k = d ? (want - walked) / d : 0;
        out.push([
          pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
          pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k
        ]);
        return out;
      }
      out.push(pts[i]);
      walked += d;
    }
    return out;
  }

  /* ---------- 소리 · 화면 ---------- */

  function speakItem() {
    if (!state.item || !window.TTS || !TTS.supported) return;
    el.soundBtn.classList.add('speaking');
    TTS.speak(state.item.speak, LANG, {
      onend: function () { el.soundBtn.classList.remove('speaking'); }
    });
    setTimeout(function () { el.soundBtn.classList.remove('speaking'); }, 2500);
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }

  function updateBar(done) {
    el.bar.style.width = Math.round((done / (state.total || 1)) * 100) + '%';
  }

  function circled(n) {
    var marks = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
    return marks[n - 1] || (n + '번');
  }

  // ← 는 한글 과목 페이지로 돌아갑니다.
  function bindHome() {
    var back = window.Catalog ? Catalog.href('한글') : 'index.html';

    [el.backBtn, el.startHome, el.endHome].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (window.TTS) TTS.cancel();
        window.location.href = back;
      });
    });
  }
})();
