/* =========================================================================
 * 다니랜드 - 게임 화면
 *
 * 주소 예) play.html?lesson=en-fruits&mode=listen
 *
 * 놀이 방식 3가지 (모두 같은 수업 데이터를 씁니다)
 *   listen : 듣고 찾기   - 소리를 듣고 맞는 그림을 누릅니다
 *   word   : 글자 찾기   - 그림을 보고 맞는 글자를 누릅니다
 *   memory : 짝 맞추기   - 같은 그림 두 장을 찾습니다
 * ========================================================================= */

(function () {
  var ROUNDS_MAX = 10;   // 한 판에 낼 문제 수 (듣고 찾기 / 글자 찾기)
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  var MODES = [
    {
      id: 'listen', name: '듣고 찾기', icon: '👂',
      levelLabel: '몇 개 중에서 고를까요?',
      levels: [
        { value: 2, text: '쉬워요<br>2개' },
        { value: 4, text: '보통<br>4개' },
        { value: 6, text: '어려워요<br>6개' }
      ]
    },
    {
      id: 'word', name: '글자 찾기', icon: '🔤',
      levelLabel: '몇 개 중에서 고를까요?',
      levels: [
        { value: 2, text: '쉬워요<br>2개' },
        { value: 3, text: '보통<br>3개' },
        { value: 4, text: '어려워요<br>4개' }
      ]
    },
    {
      id: 'memory', name: '짝 맞추기', icon: '🃏',
      levelLabel: '몇 짝을 맞출까요?',
      levels: [
        { value: 3, text: '쉬워요<br>3짝' },
        { value: 5, text: '보통<br>5짝' },
        { value: 8, text: '어려워요<br>8짝' }
      ]
    }
  ];

  var el = {
    cards: document.getElementById('cards'),
    stage: document.getElementById('stage'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    labelToggle: document.getElementById('labelToggle'),
    voiceBtn: document.getElementById('voiceBtn'),
    notice: document.getElementById('notice'),
    homeBtn: document.getElementById('homeBtn'),

    startOverlay: document.getElementById('startOverlay'),
    startTitle: document.getElementById('startTitle'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),
    modeRow: document.getElementById('modeRow'),
    levelRow: document.getElementById('levelRow'),
    levelHint: document.getElementById('levelHint'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endModes: document.getElementById('endModes'),
    endHome: document.getElementById('endHome')
  };

  var lesson = findLesson(getParam('lesson'));

  var state = {
    mode: 'listen',
    level: { listen: 4, word: 3, memory: 5 },
    showLabel: loadFlag('daniland.showLabel'),

    // 듣고 찾기 / 글자 찾기
    queue: [], round: 0, target: null, firstTry: true,

    // 짝 맞추기
    deck: [], flipped: [], matched: 0, pairs: 0, mistakes: 0,

    stars: 0,
    locked: false,

    // 틀렸을 때 다시 들려주려고 잡아 둔 시간 (겹치지 않게 하나만 씁니다)
    repeatTimer: null
  };

  /* ---------- 시작 준비 ---------- */

  if (!lesson) {
    el.startOverlay.hidden = true;
    el.notice.innerHTML = '<p class="notice">수업을 찾을 수 없어요. 홈에서 다시 골라 주세요.</p>';
    bindHome();
    return;
  }

  document.title = lesson.title + ' · 다니랜드';
  el.startTitle.textContent = (lesson.icon || '🎲') + ' ' + lesson.title;

  state.mode = pickMode(getParam('mode') || loadValue('daniland.mode') || 'listen');

  if (!window.TTS || !TTS.supported) {
    state.showLabel = true;
    el.voiceBtn.hidden = true;
    el.notice.innerHTML =
      '<p class="notice">이 브라우저는 소리 읽어주기를 지원하지 않아요. 대신 글자를 보여 드릴게요.</p>';
  }

  buildModeRow();
  buildLevelRow();
  syncLabelToggle();
  bindHome();

  el.startBtn.addEventListener('click', function () {
    // 첫 소리는 반드시 사용자의 터치 안에서 시작해야 태블릿에서도 잘 나옵니다.
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

  el.labelToggle.addEventListener('click', function () {
    state.showLabel = !state.showLabel;
    saveValue('daniland.showLabel', state.showLabel ? '1' : '0');
    syncLabelToggle();
    Array.prototype.forEach.call(el.cards.children, function (card) {
      var w = card.querySelector('.word');
      if (w && !card.classList.contains('correct')) {
        w.textContent = state.showLabel ? (card.dataset.word || '') : '';
      }
    });
  });

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: lesson.lang || 'en-US', sample: sampleWord });
  });

  // PC에서는 1~8 숫자키로도 고를 수 있어요.
  document.addEventListener('keydown', function (e) {
    if (!el.startOverlay.hidden || !el.endOverlay.hidden || VoicePicker.isOpen()) return;
    var n = parseInt(e.key, 10);
    if (!n || n < 1 || n > 8) return;
    var card = el.cards.children[n - 1];
    if (card) card.click();
  });

  /* ---------- 시작 화면 구성 ---------- */

  function pickMode(id) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return id;
    return 'listen';
  }

  function modeDef(id) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return MODES[i];
    return MODES[0];
  }

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    MODES.forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (m.id === state.mode ? ' on' : '');
      b.innerHTML = '<span class="mi">' + m.icon + '</span><span class="mn">' + m.name + '</span>';
      b.addEventListener('click', function () {
        state.mode = m.id;
        saveValue('daniland.mode', m.id);
        Array.prototype.forEach.call(el.modeRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
        buildLevelRow();
      });
      el.modeRow.appendChild(b);
    });
  }

  function buildLevelRow() {
    var def = modeDef(state.mode);
    el.levelHint.textContent = def.levelLabel;
    el.levelRow.innerHTML = '';

    def.levels.forEach(function (lv) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (state.level[state.mode] === lv.value ? ' on' : '');
      b.innerHTML = lv.text;
      b.addEventListener('click', function () {
        state.level[state.mode] = lv.value;
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 게임 시작 ---------- */

  function resetBoard() {
    if (window.TTS) TTS.cancel();
    el.cards.innerHTML = '';
    el.stage.innerHTML = '';
    el.cards.className = 'cards';
    el.cards.style.gridTemplateColumns = '';
    el.cards.style.justifyContent = '';
    el.cards.style.removeProperty('--card');
    state.locked = false;
  }

  function startGame() {
    resetBoard();
    state.stars = 0;
    updateScore();

    // 글자 찾기와 짝 맞추기는 그림 옆에 글자가 늘 보이므로 토글이 필요 없습니다.
    el.labelToggle.hidden = (state.mode !== 'listen');

    if (state.mode === 'memory') startMemory();
    else startQuiz();
  }

  /* =======================================================================
   * 듣고 찾기 / 글자 찾기
   * ===================================================================== */

  function startQuiz() {
    var items = shuffle((lesson.items || []).slice());
    state.queue = items.slice(0, Math.min(ROUNDS_MAX, items.length));
    state.round = 0;
    buildQuizStage();
    nextRound();
  }

  function buildQuizStage() {
    el.stage.innerHTML = '';

    if (state.mode === 'word') {
      var art = document.createElement('div');
      art.className = 'big-art';
      art.id = 'bigArt';
      el.stage.appendChild(art);
    }

    var btn = document.createElement('button');
    btn.className = 'speak-btn' + (state.mode === 'word' ? ' small' : '');
    btn.id = 'speakBtn';
    btn.textContent = state.mode === 'word' ? '🔊 들어보기' : '🔊 다시 듣기';
    btn.addEventListener('click', speakTarget);
    el.stage.appendChild(btn);
  }

  function nextRound() {
    if (state.round >= state.queue.length) return finishQuiz();

    state.target = state.queue[state.round];
    state.locked = false;
    state.firstTry = true;
    clearTimeout(state.repeatTimer);

    if (state.mode === 'word') {
      var big = document.getElementById('bigArt');
      if (big) {
        big.className = 'big-art ' + sizeClass(state.target.emoji);
        big.textContent = state.target.emoji;
      }
    }

    renderChoices(buildChoices(state.target));
    updateBar(state.round, state.queue.length);
    el.questLabel.textContent = (state.mode === 'word'
      ? '그림에 맞는 글자를 눌러요  '
      : '잘 듣고 그림을 눌러요  ')
      + '(' + (state.round + 1) + '/' + state.queue.length + ')';

    setTimeout(speakTarget, 350);
  }

  // 정답 1개 + 나머지 보기들
  function buildChoices(target) {
    var others = (lesson.items || []).filter(function (it) { return it !== target; });
    var count = state.level[state.mode] || 4;
    var picked = shuffle(others).slice(0, Math.max(0, count - 1));
    return shuffle([target].concat(picked));
  }

  function renderChoices(choices) {
    el.cards.innerHTML = '';
    el.cards.className = 'cards';

    choices.forEach(function (item) {
      var card = document.createElement('button');
      card.className = 'choice' + (state.mode === 'word' ? ' word-card' : '');
      card.dataset.word = item.word;

      if (state.mode === 'word') {
        var t = document.createElement('div');
        t.className = 'text';
        t.textContent = item.word;
        card.appendChild(t);
      } else {
        var art = document.createElement('div');
        art.className = 'art ' + sizeClass(item.emoji);
        art.textContent = item.emoji;

        var word = document.createElement('div');
        word.className = 'word';
        word.textContent = state.showLabel ? item.word : '';
        setWordLength(word, item.word);

        card.appendChild(art);
        card.appendChild(word);
      }

      card.addEventListener('click', function () { chooseQuiz(card, item); });
      el.cards.appendChild(card);
    });

    fitBoard();
  }

  function chooseQuiz(card, item) {
    if (state.locked || card.classList.contains('dim')) return;

    if (item === state.target) {
      state.locked = true;
      clearTimeout(state.repeatTimer);
      if (window.SFX) SFX.correct();

      card.classList.add('correct');
      addMark(card, '⭕');
      confettiAt(card);

      if (state.mode === 'word') {
        // 맞힌 글자를 한 번 더 읽어 줍니다.
        setTimeout(function () { speakTarget(); }, 250);
      } else {
        card.querySelector('.word').textContent =
          item.word + (item.ko && item.ko !== item.word ? ' · ' + item.ko : '');
      }

      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 맞히는 즉시 막대를 채웁니다. (다음 문제로 넘어갈 때까지 기다리면
      // 마지막 문제에서는 결과 화면이 덮어버려 다 찬 모습을 못 봅니다)
      updateBar(state.round + 1, state.queue.length);

      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, 1300);

    } else {
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      card.classList.add('wrong');
      setTimeout(function () {
        card.classList.remove('wrong');
        card.classList.add('dim');
      }, 400);
      // 한 번 더 들려주고 다시 고르게 합니다.
      // 연달아 틀려도 마지막 한 번만 들려줍니다. (소리가 겹치지 않게)
      clearTimeout(state.repeatTimer);
      state.repeatTimer = setTimeout(speakTarget, 700);
    }
  }

  function finishQuiz() {
    var total = state.queue.length;
    updateBar(total, total);
    showResult(state.stars, total, total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!');
  }

  /* =======================================================================
   * 짝 맞추기
   * ===================================================================== */

  function startMemory() {
    var want = state.level.memory || 5;
    state.pairs = Math.min(want, (lesson.items || []).length);
    state.matched = 0;
    state.mistakes = 0;
    state.flipped = [];
    state.locked = false;

    var picked = shuffle((lesson.items || []).slice()).slice(0, state.pairs);
    state.deck = shuffle(picked.concat(picked));

    el.stage.innerHTML = '<div class="hint">카드를 눌러 같은 그림 두 장을 찾아요</div>';
    el.questLabel.textContent = '짝을 맞춰요  (0/' + state.pairs + ')';
    updateBar(0, state.pairs);

    el.cards.innerHTML = '';
    el.cards.className = 'cards mem-board';

    state.deck.forEach(function (item) {
      var card = document.createElement('button');
      card.className = 'choice mem';

      var back = document.createElement('div');
      back.className = 'back';
      back.textContent = '🐾';

      var front = document.createElement('div');
      front.className = 'front';

      var art = document.createElement('div');
      art.className = 'art ' + sizeClass(item.emoji);
      art.textContent = item.emoji;

      var word = document.createElement('div');
      word.className = 'word';
      word.textContent = item.word;
      setWordLength(word, item.word);

      front.appendChild(art);
      front.appendChild(word);
      card.appendChild(back);
      card.appendChild(front);

      card.addEventListener('click', function () { flipCard(card, item); });
      el.cards.appendChild(card);
    });

    fitBoard();
  }

  /* ---------- 카드 판 크기 맞추기 ----------
   * 어떤 놀이든 카드가 스크롤 없이 한 화면에 들어오도록
   * 열 수와 카드 크기를 화면에 맞춰 정합니다.
   * -------------------------------------------------------------------- */

  var GAP = 10;
  var CARD_MIN = 64;    // 이보다 작으면 아이가 누르기 어려워요
  var CARD_MAX = 240;   // 이보다 크면 화면이 휑해 보여요

  function fitBoard() {
    var count = el.cards.children.length;
    if (!count) return;

    var ratio = (state.mode === 'word') ? 2 : 1;   // 글자 카드는 가로로 넓적합니다
    var availW = el.cards.clientWidth;
    if (!availW) return;

    // 카드 아래로 얼마나 남는지 정확히 잽니다.
    // (도구 줄의 바깥 여백과 화면 맨 아래 여백까지 빼야 스크롤이 안 생깁니다)
    var top = el.cards.getBoundingClientRect().top;
    var wrapEl = document.querySelector('.wrap');
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var availH = screenH - top - outerHeight(document.querySelector('.tools')) - bottomPad - 6;

    // 열 수를 바꿔 보며 카드가 가장 커지는 배치를 고릅니다.
    var best = { w: 0, cols: 1 };
    var tidy = { w: 0, cols: 1 };   // 줄이 고르게 채워지는(딱 나누어떨어지는) 배치

    for (var cols = 1; cols <= 6; cols++) {
      if (cols > count) break;
      var rows = Math.ceil(count / cols);
      var cw = (availW - GAP * (cols - 1)) / cols;
      var ch = (availH - GAP * (rows - 1)) / rows;
      var w = Math.min(cw, ch * ratio);        // 세로에 맞춰 가로도 줄입니다

      if (w > best.w) best = { w: w, cols: cols };
      if (count % cols === 0 && w > tidy.w) tidy = { w: w, cols: cols };
    }

    // 카드가 크게 줄지 않는다면, 마지막 줄이 비지 않는 쪽이 보기 좋습니다.
    if (tidy.w >= best.w * 0.75) best = tidy;

    var card = Math.min(CARD_MAX * ratio, Math.max(CARD_MIN, Math.floor(best.w)));
    el.cards.style.gridTemplateColumns = 'repeat(' + best.cols + ', ' + card + 'px)';
    el.cards.style.justifyContent = 'center';
    el.cards.style.setProperty('--card', card + 'px');
  }

  // 바깥 여백까지 포함한 높이
  function outerHeight(node) {
    if (!node || !node.offsetHeight) return 0;
    var cs = getComputedStyle(node);
    return node.offsetHeight + px(cs.marginTop) + px(cs.marginBottom);
  }

  function px(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', function () {
    if (el.cards.children.length) fitBoard();
  });

  function flipCard(card, item) {
    if (state.locked) return;
    if (card.classList.contains('flipped') || card.classList.contains('done')) return;

    // 뒤집는 동안에는 아무 말도 하지 않습니다. 짝을 맞췄을 때만 읽어 줍니다.
    card.classList.add('flipped');
    if (window.SFX) SFX.tap();

    state.flipped.push({ card: card, item: item });
    if (state.flipped.length < 2) return;

    var a = state.flipped[0];
    var b = state.flipped[1];
    state.flipped = [];
    state.locked = true;

    if (a.item === b.item) {
      setTimeout(function () {
        [a, b].forEach(function (x) {
          x.card.classList.add('done', 'correct');
          addMark(x.card, '⭕');
        });
        if (window.SFX) SFX.correct();
        confettiAt(b.card);

        // 짝을 맞췄을 때만 단어를 읽어 줍니다.
        if (window.TTS && TTS.supported) TTS.speak(a.item.word, lesson.lang || 'en-US');

        state.matched += 1;
        state.stars = state.matched;   // 진행 중에는 찾은 짝 수를 보여 줍니다.
        updateScore();
        updateBar(state.matched, state.pairs);
        el.questLabel.textContent = '짝을 맞춰요  (' + state.matched + '/' + state.pairs + ')';

        state.locked = false;
        if (state.matched >= state.pairs) setTimeout(finishMemory, 800);
      }, 450);

    } else {
      state.mistakes += 1;
      if (window.TTS) TTS.cancel();   // 아직 안 끝난 소리가 뒤늦게 나오지 않게
      setTimeout(function () {
        if (window.SFX) SFX.wrong();
        [a, b].forEach(function (x) { x.card.classList.add('wrong'); });
      }, 450);
      setTimeout(function () {
        [a, b].forEach(function (x) {
          x.card.classList.remove('wrong', 'flipped');
        });
        state.locked = false;
      }, 1100);
    }
  }

  function finishMemory() {
    var stars = Math.max(0, state.pairs - Math.floor(state.mistakes / 2));
    var msg = state.pairs + '짝을 모두 찾았어요!' +
      (state.mistakes ? ' (다시 뒤집기 ' + state.mistakes + '번)' : ' 한 번도 안 틀렸어요!');
    showResult(stars, state.pairs, msg);
  }

  /* ---------- 결과 ---------- */

  function showResult(stars, total, text) {
    state.stars = stars;
    updateScore();
    saveBest(lesson.id, state.mode, stars, total);

    el.endStars.textContent = starLine(stars, total);
    el.endTitle.textContent = (stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = text;
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 소리 ---------- */

  function speakTarget() {
    if (!state.target || !window.TTS || !TTS.supported) return;
    var btn = document.getElementById('speakBtn');
    if (btn) btn.classList.add('speaking');

    TTS.speak(state.target.word, lesson.lang || 'en-US', {
      onend: function () { if (btn) btn.classList.remove('speaking'); }
    });
    // 혹시 끝 신호가 오지 않는 브라우저를 위한 안전장치
    setTimeout(function () { if (btn) btn.classList.remove('speaking'); }, 2500);
  }

  function sampleWord() {
    if (state.target) return state.target.word;
    var items = lesson.items || [];
    return items.length ? items[0].word : 'hello';
  }

  /* ---------- 화면 갱신 ---------- */

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }

  function updateBar(done, total) {
    el.bar.style.width = Math.round((done / (total || 1)) * 100) + '%';
  }

  function syncLabelToggle() {
    el.labelToggle.classList.toggle('on', state.showLabel);
    el.labelToggle.textContent = state.showLabel ? '글자 숨기기' : '글자 보기';
  }

  /* ---------- 도우미 (여러 페이지가 함께 쓰는 것은 js/ui.js 에 있습니다) ---------- */

  function addMark(card, text) { UI.addMark(card, text); }
  function confettiAt(card) { UI.confettiAt(card); }
  function starLine(stars, total) { return UI.starLine(stars, total); }
  function sizeClass(emoji) { return UI.sizeClass(emoji); }

  // 글자 수를 카드에 알려 줍니다.
  // css/style.css 가 이 값으로 긴 단어(police station)의 글자를 줄여 잘리지 않게 합니다.
  function setWordLength(node, text) {
    node.style.setProperty('--len', String((text || '').length));
  }
  function shuffle(arr) { return UI.shuffle(arr); }
  function getParam(name) { return UI.getParam(name); }

  function findLesson(id) {
    var list = window.LESSONS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // 🏠 는 언제나 홈으로, '← 뒤로' 는 방금 지나온 과목 페이지로 갑니다.
  function bindHome() {
    var back = (lesson && window.Catalog) ? Catalog.href(lesson.subject) : 'index.html';

    go(el.homeBtn, 'index.html');
    go(el.startHome, back);
    go(el.endHome, back);

    function go(btn, href) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (window.TTS) TTS.cancel();
        window.location.href = href;
      });
    }
  }

  function loadValue(key) { return UI.loadValue(key); }
  function saveValue(key, value) { UI.saveValue(key, value); }
  function loadFlag(key) { return UI.loadValue(key) === '1'; }

  function saveBest(lessonId, mode, stars, total) {
    UI.saveBest('daniland.best.' + lessonId + '.' + mode, stars, total);
  }
})();
