/* =========================================================================
 * 다니랜드 - 숫자 공부
 *
 * 주소 예) numbers.html?act=plus
 *
 * 놀이 4가지 (문제는 매번 새로 만들어집니다)
 *   count : 세어 보기     - 그림이 몇 개인지 숫자를 고릅니다
 *   group : 개수 만들기   - 숫자를 보고 그만큼 있는 묶음을 고릅니다
 *   plus  : 더하기        - 🍎🍎 ➕ 🍎 = ?
 *   more  : 더 많은 것    - 두 묶음 중 많은 쪽을 고릅니다
 *
 * 홈에서 네 가지가 각각 카드로 나오므로, 보통은 act 가 주소에 담겨 옵니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var EMOJIS = ['🍎', '🍓', '🐥', '⭐', '🍪', '🎈', '🐞', '🍇', '🐟', '🌸', '🚗', '🦋'];
  var KO_COUNT = ['한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  var ACTS = [
    { id: 'count', name: '세어 보기',   icon: '🔢' },
    { id: 'group', name: '개수 만들기', icon: '🍎' },
    { id: 'plus',  name: '더하기',      icon: '➕' },
    { id: 'more',  name: '더 많은 것',  icon: '⚖️' }
  ];

  var LEVELS = [
    { value: 5,  text: '쉬워요<br>1~5' },
    { value: 10, text: '조금 더<br>1~10' }
  ];

  var el = {
    cards: document.getElementById('cards'),
    stage: document.getElementById('stage'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    voiceBtn: document.getElementById('voiceBtn'),
    homeBtn: document.getElementById('homeBtn'),

    startOverlay: document.getElementById('startOverlay'),
    startTitle: document.getElementById('startTitle'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),
    actRow: document.getElementById('actRow'),
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
    act: UI.getParam('act') || UI.loadValue('daniland.numAct') || 'count',
    max: parseInt(UI.loadValue('daniland.numMax'), 10) || 5,
    round: 0,
    stars: 0,
    answer: 0,
    prompt: '',
    firstTry: true,
    locked: false
  };

  if (!findAct(state.act)) state.act = 'count';

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildActRow();
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

  el.endModes.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    el.startOverlay.hidden = false;
    resetBoard();
  });

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '하나 둘 셋'; } });
  });

  // 🏠 는 언제나 홈으로, '← 뒤로' 는 이 놀이가 들어 있는 과목 페이지로 갑니다.
  bindGo(el.homeBtn, 'index.html');
  bindGo(el.startHome, backHref());
  bindGo(el.endHome, backHref());

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

  // 고른 놀이를 시작 화면 제목과 브라우저 탭에 보여 줍니다.
  function showAct() {
    var a = findAct(state.act);
    if (!a) return;
    el.startTitle.textContent = a.icon + ' ' + a.name;
    document.title = a.name + ' · 다니랜드 🔢';
  }

  function buildActRow() {
    el.actRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
      b.innerHTML = '<span class="mi">' + a.icon + '</span><span class="mn">' + a.name + '</span>';
      b.addEventListener('click', function () {
        state.act = a.id;
        UI.saveValue('daniland.numAct', a.id);
        Array.prototype.forEach.call(el.actRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
        showAct();
      });
      el.actRow.appendChild(b);
    });
  }

  function buildLevelRow() {
    el.levelRow.innerHTML = '';
    LEVELS.forEach(function (lv) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (state.max === lv.value ? ' on' : '');
      b.innerHTML = lv.text;
      b.addEventListener('click', function () {
        state.max = lv.value;
        UI.saveValue('daniland.numMax', String(lv.value));
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
    else makeMore();

    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  // 🔢 세어 보기 — 그림을 보여주고 개수를 고릅니다.
  function makeCount() {
    var emoji = pick(EMOJIS);
    var n = UI.randInt(1, state.max);

    state.answer = n;
    state.prompt = '몇 개일까요?';
    el.questLabel.textContent = '몇 개인지 세어 볼까요? (' + (state.round + 1) + '/' + ROUNDS + ')';
    el.stage.appendChild(groupEl(n, emoji));
    el.stage.appendChild(listenBtn());

    renderNumberCards(n);
  }

  // 🍎 개수 만들기 — 숫자를 보여주고 그만큼 있는 묶음을 고릅니다.
  function makeGroup() {
    var emoji = pick(EMOJIS);
    var n = UI.randInt(1, state.max);

    state.answer = n;
    state.prompt = KO_COUNT[n - 1] + ' 개를 찾아요.';
    el.questLabel.textContent = '숫자만큼 있는 것을 찾아요 (' + (state.round + 1) + '/' + ROUNDS + ')';

    var num = document.createElement('div');
    num.className = 'big-num';
    num.textContent = n;
    el.stage.appendChild(num);
    el.stage.appendChild(listenBtn());

    var counts = nearNumbers(n, 3);
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
    state.prompt = KO_COUNT[a - 1] + ' 개 더하기 ' + KO_COUNT[b - 1] + ' 개는 몇 개일까요?';
    el.questLabel.textContent = '모두 몇 개일까요? (' + (state.round + 1) + '/' + ROUNDS + ')';

    var row = document.createElement('div');
    row.className = 'eq-row';

    var boxA = document.createElement('div');
    boxA.className = 'eq-box';
    boxA.appendChild(groupEl(a, emoji, true));

    var op = document.createElement('div');
    op.className = 'eq-op';
    op.textContent = '➕';

    var boxB = document.createElement('div');
    boxB.className = 'eq-box';
    boxB.appendChild(groupEl(b, emoji, true));

    var eq = document.createElement('div');
    eq.className = 'eq-op';
    eq.textContent = '=';

    var q = document.createElement('div');
    q.className = 'eq-op';
    q.textContent = '❓';

    [boxA, op, boxB, eq, q].forEach(function (x) { row.appendChild(x); });
    el.stage.appendChild(row);
    el.stage.appendChild(listenBtn());

    renderNumberCards(a + b);
  }

  // ⚖️ 더 많은 것 — 두 묶음 중 많은 쪽을 고릅니다.
  function makeMore() {
    var emoji = pick(EMOJIS);
    var a = UI.randInt(1, state.max);
    var b = UI.randInt(1, state.max);
    while (b === a) b = UI.randInt(1, state.max);

    state.answer = Math.max(a, b);
    state.prompt = '어느 쪽이 더 많을까요?';
    el.questLabel.textContent = '더 많은 쪽을 눌러요 (' + (state.round + 1) + '/' + ROUNDS + ')';
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

  /* ---------- 보기 만들기 ---------- */

  function renderNumberCards(answer) {
    var choices = nearNumbers(answer, Math.min(4, state.max));
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

  // 정답 주변의 숫자들로 보기를 만듭니다. (너무 동떨어진 숫자가 안 나오게)
  function nearNumbers(answer, count) {
    var top = Math.max(state.max, answer);
    var out = [answer];
    var offset = 1;

    while (out.length < count && offset <= top) {
      [answer - offset, answer + offset].forEach(function (n) {
        if (out.length < count && n >= 1 && n <= top && out.indexOf(n) < 0) out.push(n);
      });
      offset += 1;
    }
    return out;
  }

  function groupEl(count, emoji, small) {
    var g = document.createElement('div');
    g.className = 'group' + (small || count > 6 ? ' small' : '');
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.textContent = emoji;
      g.appendChild(s);
    }
    return g;
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

      speak(KO_COUNT[Math.min(state.answer, 10) - 1] + ' 개!');

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
