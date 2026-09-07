/* =========================================================================
 * 다니랜드 - 숫자 공부
 *
 * 주소 예) numbers.html?act=plus
 *
 * 놀이 7가지 (문제는 매번 새로 만들어집니다)
 *   count   : 세어 보기     - 그림이 몇 개인지 숫자를 고릅니다
 *   group   : 같은 개수 찾기 - 숫자를 보고 그만큼 있는 묶음을 고릅니다
 *   more    : 더 많은 것    - 두 묶음 중 많은 쪽을 고릅니다
 *   plus    : 더하기        - 🍎🍎 ➕ 🍎 = ?
 *   minus   : 빼기          - 🍎🍎🍎 중에 두 개를 먹으면 몇 개?
 *   order   : 수 순서       - 6 7 ❓ 9 에서 빠진 수를 찾습니다
 *   pattern : 패턴 잇기     - 🍎🍌🍎🍌🍎 다음에 올 그림을 찾습니다
 *
 * 놀이는 수학 과목 페이지에서 카드로 고릅니다. 그래서 어떤 놀이를 할지는
 * 주소(act)로 정해져 오고, 이 페이지에서는 다시 고르지 않습니다.
 * 다른 놀이를 하려면 '← 다른 놀이 고르기' 로 과목 페이지에 돌아갑니다.
 *
 * 난이도(숫자를 어디까지 쓸지)는 놀이마다 다릅니다 — ACTS 의 levels 를 보세요.
 * 세는 놀이는 1~20, 수 순서는 1~100 까지 가고, 패턴 잇기는 숫자를 안 써서
 * 시작 화면에 단계가 아예 안 나옵니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var EMOJIS = ['🍎', '🍓', '🐥', '⭐', '🍪', '🎈', '🐞', '🍇', '🐟', '🌸', '🚗', '🦋'];
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  // 하나·둘 세는 말 (스무 개까지). 목록에 없는 수는 그냥 숫자로 읽힙니다.
  var KO_COUNT = [
    '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
    '열한', '열두', '열세', '열네', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스무'
  ];

  // 단계 이름은 값이 아니라 순서로 붙입니다 (놀이마다 숫자 범위가 다르므로)
  var LEVEL_NAMES = ['쉬워요', '조금 더', '더 어렵게'];

  var ACTS = [
    { id: 'count',   name: '세어 보기',     icon: '🔢', desc: '그림이 몇 개인지 세어요',
      levels: [5, 10, 20], def: 10 },
    { id: 'group',   name: '같은 개수 찾기', icon: '🍎', desc: '숫자만큼 있는 그림을 찾아요',
      levels: [5, 10, 20], def: 10 },
    { id: 'more',    name: '더 많은 것',    icon: '⚖️', desc: '어느 쪽이 더 많은지 골라요',
      levels: [5, 10, 20], def: 10 },
    { id: 'plus',    name: '더하기',        icon: '➕', desc: '두 묶음을 합치면 몇 개일까요',
      levels: [5, 10, 20], def: 10 },
    { id: 'minus',   name: '빼기',          icon: '➖', desc: '먹고 나면 몇 개가 남을까요',
      levels: [5, 10, 20], def: 10 },
    { id: 'order',   name: '수 순서',       icon: '🪜', desc: '빠진 수를 찾아요',
      levels: [20, 50, 100], def: 20 },
    { id: 'pattern', name: '패턴 잇기',     icon: '🔁', desc: '다음에 올 그림을 찾아요',
      levels: [], def: 0 }
  ];

  // 패턴 잇기에서 쓰는 규칙. 숫자는 '몇 번째 그림인지' 를 뜻합니다.
  //   [0,1]     🍎🍌🍎🍌…      [0,0,1]  🍎🍎🍌🍎🍎🍌…
  //   [0,1,1]   🍎🍌🍌…        [0,1,2]  🍎🍌🍇…        [0,1,0,2] 🍎🍌🍎🍇…
  var PATTERNS = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 1, 0, 2]];

  var el = {
    cards: document.getElementById('cards'),
    stage: document.getElementById('stage'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

    startOverlay: document.getElementById('startOverlay'),
    startTitle: document.getElementById('startTitle'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),
    startDesc: document.getElementById('startDesc'),
    levelHint: document.getElementById('levelHint'),
    levelRow: document.getElementById('levelRow'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endModes: document.getElementById('endModes'),
    endHome: document.getElementById('endHome')
  };

  var state = {
    act: UI.getParam('act') || 'count',
    max: 0,
    round: 0,
    stars: 0,
    answer: 0,
    prompt: '',
    firstTry: true,
    locked: false
  };

  if (!findAct(state.act)) state.act = 'count';
  state.max = loadMax(state.act);

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildLevelRow();
  showAct();

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

  // '다른 놀이' 는 놀이들이 카드로 놓여 있는 수학 페이지로 돌아갑니다.
  bindGo(el.endModes, backHref());

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '하나 둘 셋'; } });
  });

  // 맨 위 ← 와 '다른 놀이 고르기' 는 이 놀이가 들어 있는 과목 페이지로, 🏠 만 홈으로 갑니다.
  bindGo(el.backBtn, backHref());
  bindGo(el.endHome, 'index.html');
  bindGo(el.startHome, backHref());

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  // 이 페이지를 카드로 갖고 있는 과목을 data.js 에서 찾습니다.
  function backHref() {
    var pages = window.PAGES || [];

    for (var i = 0; i < pages.length; i++) {
      if ((pages[i].href || '').indexOf('numbers.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
      }
    }
    return 'index.html';
  }

  document.addEventListener('keydown', function (e) {
    if (!el.startOverlay.hidden || !el.endOverlay.hidden || VoicePicker.isOpen()) return;
    var n = parseInt(e.key, 10);
    if (!n || n < 1 || n > 4) return;
    var card = el.cards.children[n - 1];
    if (card) card.click();
  });

  /* ---------- 시작 화면 ---------- */

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  // 고른 놀이를 시작 화면과 브라우저 탭에 보여 줍니다.
  function showAct() {
    var a = findAct(state.act);
    if (!a) return;
    el.startTitle.textContent = a.icon + ' ' + a.name;
    el.startDesc.textContent = a.desc;
    document.title = a.name + ' · 다니랜드 🔢';
  }

  // 난이도는 놀이마다 따로 기억합니다. (수 순서의 1~100 이 세어 보기로 새면 안 되니까)
  // 놀이가 넷뿐이던 시절의 daniland.numMax 도 값이 맞으면 그대로 씁니다.
  function loadMax(act) {
    var a = findAct(act);
    if (!a || !a.levels.length) return 0;

    var v = parseInt(UI.loadValue('daniland.numMax.' + act), 10);
    if (a.levels.indexOf(v) >= 0) return v;

    v = parseInt(UI.loadValue('daniland.numMax'), 10);
    if (a.levels.indexOf(v) >= 0) return v;

    return a.def;
  }

  function buildLevelRow() {
    var a = findAct(state.act);
    el.levelRow.innerHTML = '';

    // 패턴 잇기는 숫자를 안 쓰므로 단계를 아예 묻지 않습니다.
    if (!a || !a.levels.length) {
      el.levelRow.hidden = true;
      if (el.levelHint) el.levelHint.hidden = true;
      return;
    }

    el.levelRow.hidden = false;
    if (el.levelHint) el.levelHint.hidden = false;

    a.levels.forEach(function (value, i) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (state.max === value ? ' on' : '');
      b.innerHTML = LEVEL_NAMES[i] + '<br>1~' + value;
      b.addEventListener('click', function () {
        state.max = value;
        UI.saveValue('daniland.numMax.' + state.act, String(value));
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 게임 진행 ---------- */

  function resetBoard() {
    if (window.TTS) TTS.cancel();
    el.cards.innerHTML = '';
    el.stage.innerHTML = '';
    el.cards.className = 'cards';
    state.locked = false;
  }

  function startGame() {
    resetBoard();
    state.round = 0;
    state.stars = 0;
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    resetBoard();
    state.firstTry = true;
    state.locked = false;

    if (state.act === 'count') makeCount();
    else if (state.act === 'group') makeGroup();
    else if (state.act === 'plus') makePlus();
    else if (state.act === 'minus') makeMinus();
    else if (state.act === 'order') makeOrder();
    else if (state.act === 'pattern') makePattern();
    else makeMore();

    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  function step() { return ' (' + (state.round + 1) + '/' + ROUNDS + ')'; }

  // 🔢 세어 보기 — 그림을 보여주고 개수를 고릅니다.
  function makeCount() {
    var emoji = pick(EMOJIS);
    var n = UI.randInt(1, state.max);

    state.answer = n;
    state.prompt = '몇 개일까요?';
    el.questLabel.textContent = '몇 개인지 세어 볼까요?' + step();
    el.stage.appendChild(groupEl(n, emoji));
    el.stage.appendChild(listenBtn());

    renderNumberCards(n, 1);
  }

  // 🍎 같은 개수 찾기 — 숫자를 보여주고 그만큼 있는 묶음을 고릅니다.
  function makeGroup() {
    var emoji = pick(EMOJIS);
    var n = UI.randInt(1, state.max);

    state.answer = n;
    state.prompt = koCount(n) + ' 개를 찾아요.';
    el.questLabel.textContent = '숫자만큼 있는 그림을 찾아요' + step();

    var num = document.createElement('div');
    num.className = 'big-num';
    num.textContent = n;
    el.stage.appendChild(num);
    el.stage.appendChild(listenBtn());

    var counts = nearNumbers(n, 3, 1);
    el.cards.className = 'cards cols-3';

    UI.shuffle(counts).forEach(function (c) {
      var card = document.createElement('button');
      card.className = 'choice';
      card.appendChild(groupEl(c, emoji, true));
      card.addEventListener('click', function () { choose(card, c); });
      el.cards.appendChild(card);
    });
  }

  // ➕ 더하기 — 두 묶음을 합치면 몇 개일까요?
  function makePlus() {
    var emoji = pick(EMOJIS);
    var a = UI.randInt(1, Math.max(1, state.max - 1));
    var b = UI.randInt(1, Math.max(1, state.max - a));

    state.answer = a + b;
    state.prompt = koCount(a) + ' 개 더하기 ' + koCount(b) + ' 개는 몇 개일까요?';
    el.questLabel.textContent = '모두 몇 개일까요?' + step();

    el.stage.appendChild(eqRow([
      boxEl(groupEl(a, emoji, true)),
      opEl('➕'),
      boxEl(groupEl(b, emoji, true)),
      opEl('= ❓')
    ], true));
    el.stage.appendChild(listenBtn());

    renderNumberCards(a + b, 1);
  }

  // ➖ 빼기 — 한 묶음에서 몇 개를 덜어냅니다.
  // 두 묶음을 나란히 놓는 대신 '먹은 것' 에 ✖ 를 씌워 흐리게 둡니다 —
  // 다섯 살에게는 덜어내는 그림이 두 묶음보다 훨씬 잘 읽힙니다.
  function makeMinus() {
    var emoji = pick(EMOJIS);
    var a = UI.randInt(2, Math.max(2, state.max));
    var b = UI.randInt(1, a);

    state.answer = a - b;
    state.prompt = koCount(a) + ' 개에서 ' + koCount(b) + ' 개를 빼면 몇 개일까요?';
    el.questLabel.textContent = '몇 개가 남았을까요?' + step();

    el.stage.appendChild(eqRow([
      boxEl(groupEl(a, emoji, true, a - b)),
      opEl('= ❓')
    ]));
    el.stage.appendChild(listenBtn());

    // 하나도 안 남는 경우가 있으니 보기에 0 도 나올 수 있게 합니다.
    renderNumberCards(a - b, 0);
  }

  // ⚖️ 더 많은 것 — 두 묶음 중 많은 쪽을 고릅니다.
  function makeMore() {
    var emoji = pick(EMOJIS);
    var a = UI.randInt(1, state.max);
    var b = UI.randInt(1, state.max);
    while (b === a) b = UI.randInt(1, state.max);

    state.answer = Math.max(a, b);
    state.prompt = '어느 쪽이 더 많을까요?';
    el.questLabel.textContent = '더 많은 쪽을 눌러요' + step();
    el.stage.appendChild(listenBtn());

    el.cards.className = 'cards';

    [a, b].forEach(function (c) {
      var card = document.createElement('button');
      card.className = 'choice';
      card.appendChild(groupEl(c, emoji, true));
      card.addEventListener('click', function () { choose(card, c); });
      el.cards.appendChild(card);
    });
  }

  // 🪜 수 순서 — 이어지는 네 수 가운데 하나를 가리고 찾게 합니다.
  // 셋에 한 번쯤은 거꾸로 세기가 나옵니다 (9 8 ❓ 6).
  function makeOrder() {
    var len = 4;
    var down = Math.random() < 0.35;
    var start = down ? UI.randInt(len, state.max) : UI.randInt(1, state.max - len + 1);
    var hole = UI.randInt(0, len - 1);
    var seq = [];

    for (var i = 0; i < len; i++) seq.push(down ? start - i : start + i);

    state.answer = seq[hole];
    state.prompt = seq.map(function (n, k) { return k === hole ? '몇' : String(n); }).join(', ');
    el.questLabel.textContent = (down ? '거꾸로 세다가 빠진 수는?' : '빠진 수는 무엇일까요?') + step();

    var row = document.createElement('div');
    row.className = 'seq-row';

    seq.forEach(function (n, k) {
      var box = document.createElement('div');
      box.className = 'seq-num' + (k === hole ? ' blank' : '');
      box.textContent = (k === hole) ? '❓' : n;
      row.appendChild(box);
    });

    el.stage.appendChild(row);
    el.stage.appendChild(listenBtn());

    // 이미 줄에 보이는 수는 보기에서 뺍니다 — 빤히 보이는 오답은 보기 하나를 버리는 셈입니다.
    renderNumberCards(state.answer, 1, seq);
  }

  // 🔁 패턴 잇기 — 규칙대로 늘어놓은 그림의 다음 칸을 맞힙니다.
  function makePattern() {
    var rule = pick(PATTERNS);
    var kinds = 0;
    rule.forEach(function (k) { if (k + 1 > kinds) kinds = k + 1; });

    // 규칙에 쓸 그림 + 보기에만 나오는 딴 그림 하나
    var picks = UI.shuffle(EMOJIS.slice()).slice(0, kinds + 1);
    var shown = rule.length * 2;                       // 규칙이 적어도 두 번은 보이게
    if (shown < 5) shown += rule.length;

    state.answer = picks[rule[shown % rule.length]];
    state.prompt = '다음에 올 그림은 무엇일까요?';
    el.questLabel.textContent = '규칙을 찾아 다음 그림을 골라요' + step();

    var row = document.createElement('div');
    row.className = 'seq-row pattern-row';

    // 칸이 아홉 개까지 늘어나므로 줄이 접히지 않게 크기를 화면 폭에서 재서 넘깁니다.
    // (규칙은 왼쪽에서 오른쪽으로 읽는 것이라 줄이 접히면 안 읽힙니다)
    var wide = Math.min(el.stage.clientWidth || 460, 460);
    var cell = Math.max(28, Math.floor((wide - shown * 6) / (shown + 1)));
    row.style.setProperty('--pcell', Math.min(cell, 56) + 'px');

    for (var i = 0; i < shown; i++) {
      var box = document.createElement('div');
      box.className = 'seq-num';
      box.textContent = picks[rule[i % rule.length]];
      row.appendChild(box);
    }

    var q = document.createElement('div');
    q.className = 'seq-num blank';
    q.textContent = '❓';
    row.appendChild(q);

    el.stage.appendChild(row);
    el.stage.appendChild(listenBtn());

    renderEmojiCards(picks);
  }

  /* ---------- 보기 만들기 ---------- */

  function renderNumberCards(answer, min, avoid) {
    var choices = nearNumbers(answer, 4, min, avoid);
    el.cards.className = 'cards' + (choices.length > 4 ? ' cols-3' : '');

    UI.shuffle(choices).forEach(function (n) {
      var card = document.createElement('button');
      card.className = 'choice num-card';

      var num = document.createElement('div');
      num.className = 'num';
      num.textContent = n;

      card.appendChild(num);
      card.addEventListener('click', function () { choose(card, n); });
      el.cards.appendChild(card);
    });
  }

  function renderEmojiCards(list) {
    el.cards.className = 'cards' + (list.length > 2 ? ' cols-3' : '');

    UI.shuffle(list.slice()).forEach(function (emoji) {
      var card = document.createElement('button');
      card.className = 'choice emoji-card';

      var art = document.createElement('div');
      art.className = 'art';
      art.textContent = emoji;

      card.appendChild(art);
      card.addEventListener('click', function () { choose(card, emoji); });
      el.cards.appendChild(card);
    });
  }

  // 정답 주변의 숫자들로 보기를 만듭니다. (너무 동떨어진 숫자가 안 나오게)
  // min 은 보기에 나와도 되는 가장 작은 수 — 빼기만 0 을 씁니다.
  // avoid 에 든 수는 오답 보기로 쓰지 않습니다 (수 순서에서 화면에 이미 보이는 수).
  function nearNumbers(answer, count, min, avoid) {
    if (min !== 0) min = 1;
    var skip = avoid || [];
    var top = Math.max(state.max, answer);
    var out = [answer];
    var offset = 1;

    while (out.length < count && offset <= top) {
      [answer - offset, answer + offset].forEach(function (n) {
        if (out.length >= count || n < min || n > top) return;
        if (out.indexOf(n) >= 0 || skip.indexOf(n) >= 0) return;
        out.push(n);
      });
      offset += 1;
    }
    return out;
  }

  /* ---------- 그림 묶음 ---------- */

  // 그림은 다섯 개씩 줄을 맞춰 놓습니다 — 스무 개도 한눈에 세이고,
  // 5·10·15 로 뛰어 세는 감각이 저절로 붙습니다.
  // goneFrom 이 있으면 그 번째부터는 '먹은 것' 으로 흐리게 그립니다 (빼기).
  function groupEl(count, emoji, small, goneFrom) {
    var g = document.createElement('div');
    // w5 = 한 줄이 다섯 칸으로 꽉 차는 크기 (카드 안에서 그림을 더 줄여야 하는 기준)
    g.className = 'group' + (small || count > 6 ? ' small' : '') +
                  (count >= 5 ? ' w5' : '') + (count > 10 ? ' tiny' : '');
    var row = null;

    for (var i = 0; i < count; i++) {
      if (i % 5 === 0) {
        row = document.createElement('div');
        row.className = 'grow';
        g.appendChild(row);
      }
      var s = document.createElement('span');
      s.textContent = emoji;
      if (typeof goneFrom === 'number' && i >= goneFrom) s.className = 'gone';
      row.appendChild(s);
    }
    return g;
  }

  // column 을 주면 세로로 쌓습니다 (더하기 — CSS 의 .eq-col 주석 참고)
  function eqRow(parts, column) {
    var row = document.createElement('div');
    row.className = 'eq-row' + (column ? ' eq-col' : '');
    parts.forEach(function (x) { row.appendChild(x); });
    return row;
  }

  function boxEl(child) {
    var box = document.createElement('div');
    box.className = 'eq-box';
    box.appendChild(child);
    return box;
  }

  function opEl(text) {
    var op = document.createElement('div');
    op.className = 'eq-op';
    op.textContent = text;
    return op;
  }

  function listenBtn() {
    var b = document.createElement('button');
    b.className = 'speak-btn small';
    b.id = 'speakBtn';
    b.textContent = '🔊 다시 듣기';
    b.addEventListener('click', speakPrompt);
    return b;
  }

  /* ---------- 정답 확인 ---------- */

  function choose(card, value) {
    if (state.locked || card.classList.contains('dim')) return;

    if (value === state.answer) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      card.classList.add('correct');
      UI.addMark(card, '⭕');
      UI.confettiAt(card);

      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 맞히는 즉시 막대를 채웁니다. (마지막 문제에서 다 찬 모습을 볼 수 있게)
      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';

      speak(answerSay());

      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, 1400);

    } else {
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      card.classList.add('wrong');
      setTimeout(function () {
        card.classList.remove('wrong');
        card.classList.add('dim');
      }, 400);
      setTimeout(speakPrompt, 700);
    }
  }

  // 맞혔을 때 들려주는 말은 놀이마다 다릅니다.
  // (수 순서는 '스물세 개' 가 아니라 '23' 이라고 읽어야 맞습니다)
  function answerSay() {
    if (state.act === 'pattern') return '맞았어요!';
    if (state.act === 'order') return String(state.answer);
    if (state.answer === 0) return '하나도 안 남았어요!';
    return koCount(state.answer) + ' 개!';
  }

  function koCount(n) { return KO_COUNT[n - 1] || String(n); }

  function finish() {
    el.bar.style.width = '100%';
    // 난이도는 이름에 넣지 않습니다. (수업 쪽 기록과 규칙을 맞춰 홈 카드가 하나만 읽게)
    UI.saveBest('daniland.best.numbers.' + state.act, state.stars, ROUNDS);

    el.endStars.textContent = UI.starLine(state.stars, ROUNDS);
    el.endTitle.textContent = (state.stars === ROUNDS)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = ROUNDS + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 소리 · 화면 ---------- */

  function speakPrompt() { speak(state.prompt); }

  function speak(text) {
    if (!text || !window.TTS || !TTS.supported) return;
    var btn = document.getElementById('speakBtn');
    if (btn) btn.classList.add('speaking');

    TTS.speak(text, LANG, {
      onend: function () { if (btn) btn.classList.remove('speaking'); }
    });
    setTimeout(function () { if (btn) btn.classList.remove('speaking'); }, 3000);
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
})();
