/* =========================================================================
 * 다니랜드 - 백 판 놀이 (hundred.html)
 *
 * 1 부터 100 까지가 열 칸씩 열 줄로 놓인 '백 판' 위에서 노는 페이지입니다.
 * 낱말 카드에 담기지 않는 내용이라 town.html · world.html 처럼 따로 만들었습니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   skip  : 뛰어 세기  - 2·5·10 씩 뛰며 다음 수를 고릅니다. 지나온 칸이 계속 칠해져서
 *                        5씩 뛰면 두 줄, 10씩 뛰면 한 줄로 서는 것이 눈에 보입니다.
 *   where : 여기는 몇? - 깃발이 꽂힌 칸의 수를 맞힙니다. 어려운 단계에서는 줄 첫 수와
 *                        맨 윗줄만 남기고 지워서, 줄(십의 자리)과 칸(일의 자리)을 읽게 합니다.
 *   near  : 앞뒤 수    - 바로 앞·바로 뒤 수를 고릅니다. 49 → 50 처럼 줄이 바뀌는 자리가
 *                        일부러 자주 나오고, 맞히면 그 칸이 켜져서 줄바꿈이 보입니다.
 *
 * ⚠️ 백 판의 칸은 누르는 곳이 아닙니다. 폰에서 한 칸이 37px 밖에 안 되어
 *    손가락으로 못 누르기 때문에(카드 최소 64px), 판은 보여 주기만 하고
 *    답은 아래 큰 숫자 카드에서 고릅니다. 칸을 단추로 바꾸지 마세요.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var TOP = 100;
  var MAX_BOARD = 520;                       // 판 최대 폭 (css 의 .cards.hundred-cards 와 맞출 것)
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  var ACTS = [
    { id: 'skip',  name: '뛰어 세기', icon: '👟', desc: '몇씩 뛰어서 세어요',
      hint: '몇씩 뛸까요?', levels: [2, 5, 10], names: ['2씩', '5씩', '10씩'], def: 5 },
    { id: 'where', name: '여기는 몇?', icon: '📍', desc: '깃발이 꽂힌 칸이 몇인지 찾아요',
      hint: '얼마나 어렵게 할까요?', levels: [0, 1], names: ['수가 다 보여요', '줄 첫 수만 보여요'], def: 0 },
    { id: 'near',  name: '앞뒤 수',   icon: '↔️', desc: '바로 앞·바로 뒤에 오는 수를 찾아요',
      hint: '어디까지 할까요?', levels: [50, 100], names: ['1~50', '1~100'], def: 50 }
  ];

  var BEST_KEY = 'daniland.best.hundred';    // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.hundredAct';       // 마지막에 고른 놀이

  var el = {
    board: document.getElementById('board'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

    startOverlay: document.getElementById('startOverlay'),
    modeRow: document.getElementById('modeRow'),
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

  var cells = [];        // cells[1] ~ cells[100]

  var state = {
    act: UI.loadValue(ACT_KEY) || 'skip',
    level: 0,
    round: 0,
    stars: 0,
    answer: 0,
    given: 0,            // 앞뒤 수에서 문제로 보여 준 수
    prompt: '',
    firstTry: true,
    locked: false
  };

  if (!findAct(state.act)) state.act = 'skip';
  state.level = loadLevel(state.act);

  if (!window.TTS || !TTS.supported) {
    el.voiceBtn.hidden = true;
    el.speakBtn.hidden = true;
  }

  buildBoard();
  buildModeRow();
  fitBoard();

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    fitBoard();
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  el.speakBtn.addEventListener('click', speakPrompt);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '십, 이십, 삼십'; } });
  });

  bindGo(el.backBtn, backHref());
  bindGo(el.startHome, backHref());
  bindGo(el.endModes, backHref());
  bindGo(el.endHome, 'index.html');

  window.addEventListener('resize', fitBoard);
  window.addEventListener('orientationchange', function () { setTimeout(fitBoard, 200); });

  document.addEventListener('keydown', function (e) {
    if (!el.startOverlay.hidden || !el.endOverlay.hidden || VoicePicker.isOpen()) return;
    var n = parseInt(e.key, 10);
    if (!n || n < 1 || n > 4) return;
    var card = el.cards.children[n - 1];
    if (card) card.click();
  });

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
      if ((pages[i].href || '').indexOf('hundred.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
      }
    }
    return 'index.html';
  }

  /* ---------- 시작 화면 ---------- */

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  // 단계는 놀이마다 뜻이 달라서(뛰는 폭·숨김 정도·수 범위) 따로 기억합니다.
  function loadLevel(act) {
    var a = findAct(act);
    if (!a) return 0;
    var v = parseInt(UI.loadValue('daniland.hundred.' + act), 10);
    return (a.levels.indexOf(v) >= 0) ? v : a.def;
  }

  function buildModeRow() {
    el.modeRow.innerHTML = '';

    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
      b.innerHTML = '<span class="mi">' + a.icon + '</span>' +
                    '<span class="mn">' + a.name + '</span>' +
                    '<span class="mb">' + bestText(a.id) + '</span>';

      b.addEventListener('click', function () {
        state.act = a.id;
        state.level = loadLevel(a.id);
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
    var best = UI.readBest('daniland.best.hundred.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (!a) return;
    el.modeDesc.textContent = a.desc;
    el.levelHint.textContent = a.hint;
    document.title = a.name + ' · 다니랜드 💯';
    buildLevelRow(a);
  }

  function buildLevelRow(a) {
    el.levelRow.innerHTML = '';

    a.levels.forEach(function (value, i) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (state.level === value ? ' on' : '');
      b.textContent = a.names[i];
      b.addEventListener('click', function () {
        state.level = value;
        UI.saveValue('daniland.hundred.' + state.act, String(value));
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 백 판 ---------- */

  function buildBoard() {
    el.board.innerHTML = '';
    cells = [];

    for (var n = 1; n <= TOP; n++) {
      var c = document.createElement('div');
      c.className = 'hcell';
      c.textContent = n;
      el.board.appendChild(c);
      cells[n] = c;
    }
  }

  // 판 크기는 가로폭과 '아래 보기 카드를 놓고 남는 높이' 중 작은 쪽에 맞춥니다.
  // (스크롤 없이 판과 카드가 한 화면에 들어와야 합니다)
  function fitBoard() {
    var box = el.board.parentNode;
    var pad = getComputedStyle(box);
    // clientWidth 는 안쪽 여백까지 포함하므로 빼 줘야 판이 화면 밖으로 안 나갑니다
    var wide = box.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
    // 아래에 놓일 보기 카드(3:2 두 줄)와 목소리 단추 자리를 미리 빼 둡니다
    var cardW = (Math.min(wide, MAX_BOARD) - 10) / 2;
    var reserve = Math.round(cardW * 2 / 3) * 2 + 10 + 90;
    var top = el.board.getBoundingClientRect().top;
    var size = Math.min(wide, MAX_BOARD, Math.max(200, window.innerHeight - top - reserve));

    el.board.style.width = size + 'px';
    // 칸 글자 크기는 칸 폭에 물려 둡니다 (판이 작아지면 '100' 이 넘칩니다)
    el.board.style.setProperty('--hcell', ((size - 27) / 10).toFixed(1) + 'px');
  }

  // 판은 매번 state 로부터 다시 그립니다 (지난 문제의 표시가 남지 않게).
  function drawBoard() {
    for (var n = 1; n <= TOP; n++) {
      cells[n].className = 'hcell';
      cells[n].textContent = n;
    }

    if (state.act === 'skip') {
      // 지금까지 뛰어온 칸을 계속 칠해 둡니다 — 5씩·10씩의 줄이 보이는 것이 핵심입니다.
      for (var k = state.level; k <= state.level * state.round; k += state.level) {
        if (cells[k]) cells[k].classList.add('on');
      }

    } else if (state.act === 'where') {
      if (state.level === 1) hideExceptGuides();
      cells[state.answer].textContent = '📍';
      cells[state.answer].classList.add('mark');

    } else if (state.act === 'near') {
      // 앞뒤 수는 판을 비워 두고 문제로 낸 수만 켭니다.
      for (var m = 1; m <= TOP; m++) cells[m].classList.add('blank');
      cells[state.given].classList.remove('blank');
      cells[state.given].classList.add('mark');
    }
  }

  // 맨 윗줄(1~10)과 각 줄의 첫 수(1·11·21…)만 남깁니다.
  // 줄을 세면 십의 자리, 칸을 세면 일의 자리라는 것을 스스로 읽어 내게 하는 안내입니다.
  function hideExceptGuides() {
    for (var n = 1; n <= TOP; n++) {
      if (n <= 10 || n % 10 === 1) continue;
      cells[n].classList.add('blank');
    }
  }

  /* ---------- 게임 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    if (window.TTS) TTS.cancel();
    el.cards.innerHTML = '';
    state.firstTry = true;
    state.locked = false;

    if (state.act === 'skip') makeSkip();
    else if (state.act === 'where') makeWhere();
    else makeNear();

    drawBoard();
    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  function step() { return ' (' + (state.round + 1) + '/' + ROUNDS + ')'; }

  // 👟 뛰어 세기 — 2·5·10 씩. 열 번이면 10씩일 때 딱 100 에 닿습니다.
  function makeSkip() {
    var by = state.level;
    var target = by * (state.round + 1);

    state.answer = target;

    if (state.round === 0) {
      state.prompt = by + '씩 뛰어 세요. 처음은 몇일까요?';
      el.questLabel.textContent = by + '씩 뛰어 세기 — 처음은?' + step();
    } else {
      var said = [];
      for (var k = Math.max(by, target - by * 3); k < target; k += by) said.push(k);
      state.prompt = said.join(', ') + ' 다음은?';
      el.questLabel.textContent = by + '씩 뛰어 세기 — 다음은?' + step();
    }

    // 한 칸 차이(찍기)와 한 번 더 뛴 수를 보기로 섞습니다.
    // 이미 지나와 칠해진 수(target - by)는 보기로 두지 않습니다 — 판만 봐도 답이 아닌 게 보입니다.
    renderCards(pickChoices(target, [target + 1, target - 1, target + by, target + 2]));
  }

  // 📍 여기는 몇? — 깃발이 꽂힌 칸의 수를 맞힙니다.
  function makeWhere() {
    var n;
    do {
      n = UI.randInt(1, TOP);
      // 어려운 단계에서는 안내로 남겨 둔 칸(맨 윗줄·줄 첫 수)에는 깃발을 꽂지 않습니다.
    } while (state.level === 1 && (n <= 10 || n % 10 === 1));

    state.answer = n;
    state.prompt = '깃발이 꽂힌 칸은 몇일까요?';
    el.questLabel.textContent = '깃발이 있는 칸은 몇?' + step();

    // 한 칸 옆(일의 자리)과 한 줄 위아래(십의 자리)를 헷갈리게 섞습니다.
    renderCards(pickChoices(n, [n + 1, n - 1, n + 10, n - 10, n + 9, n - 9]));
  }

  // ↔️ 앞뒤 수 — 49 다음은 50 처럼 줄이 바뀌는 자리를 일부러 자주 냅니다.
  function makeNear() {
    var top = state.level;
    var next = Math.random() < 0.5;
    var n;

    if (Math.random() < 0.5) {
      // 십의 자리가 바뀌는 자리 (19 다음 / 20 앞)
      var tens = UI.randInt(1, Math.floor(top / 10) - 1);
      n = next ? tens * 10 + 9 : tens * 10;
    } else {
      n = UI.randInt(2, top - 1);
    }

    state.given = n;
    state.answer = next ? n + 1 : n - 1;
    state.prompt = n + (next ? ' 바로 다음 수는 무엇일까요?' : ' 바로 앞의 수는 무엇일까요?');
    el.questLabel.textContent = n + (next ? ' 바로 다음 수는?' : ' 바로 앞 수는?') + step();

    renderCards(pickChoices(state.answer, [n, state.answer + 1, state.answer - 1,
                                           state.answer + 10, state.answer - 10]));
  }

  /* ---------- 보기 ---------- */

  // 정답 + 후보들 중 판 안에 있는 것 셋을 골라 네 개짜리 보기를 만듭니다.
  function pickChoices(answer, candidates) {
    var out = [answer];

    UI.shuffle(candidates.slice()).forEach(function (n) {
      if (out.length < 4 && n >= 1 && n <= TOP && out.indexOf(n) < 0) out.push(n);
    });

    // 후보가 모자라면 가까운 수로 채웁니다.
    var offset = 1;
    while (out.length < 4 && offset <= TOP) {
      [answer - offset, answer + offset].forEach(function (n) {
        if (out.length < 4 && n >= 1 && n <= TOP && out.indexOf(n) < 0) out.push(n);
      });
      offset += 1;
    }
    return out;
  }

  function renderCards(list) {
    el.cards.innerHTML = '';

    UI.shuffle(list).forEach(function (n) {
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

      // 맞힌 칸을 판에서 켜 줍니다 — 여기가 이 놀이의 배우는 순간입니다.
      var hit = cells[state.answer];
      hit.classList.remove('blank', 'mark');
      hit.classList.add('on', 'pop');
      hit.textContent = state.answer;

      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';
      speak(String(state.answer));

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

  function finish() {
    el.bar.style.width = '100%';
    UI.saveBest('daniland.best.hundred.' + state.act, state.stars, ROUNDS);
    UI.saveBest(BEST_KEY, state.stars, ROUNDS);

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
    el.speakBtn.classList.add('speaking');

    TTS.speak(text, LANG, {
      onend: function () { el.speakBtn.classList.remove('speaking'); }
    });
    setTimeout(function () { el.speakBtn.classList.remove('speaking'); }, 3000);
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }
})();
