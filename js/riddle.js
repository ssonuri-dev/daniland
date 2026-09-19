/* =========================================================================
 * 다니랜드 - 수수께끼 · 넌센스 퀴즈 (riddle.html)
 *
 * 문제는 js/riddles.js 의 RIDDLES 에 있고 이 파일은 내는 일만 합니다 — 문제를 더할 때는 저 파일만.
 * 스웨덴 퀴즈(sweden.js 의 askQuiz)와 같은 얼개입니다: 위 판에 문제, 아래 보기 넉 장, 맞히면 풀이를 읽고 다음.
 *
 * 한 판은 열 문제. 풀어 본 문제는 DONE_KEY 에 문제 글(q)로 기억해 두고, 안 풀어 본 것부터 뽑습니다 —
 * 부모가 문제를 더하면 아이가 새 문제를 먼저 만나게 하려고요. 다 풀었으면 전부에서 섞어 냅니다.
 * ========================================================================= */
(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var BEST_KEY = 'daniland.best.riddle';
  var DONE_KEY = 'daniland.riddle.done';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  var el = {
    backBtn: document.getElementById('backBtn'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    label: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    panel: document.getElementById('panel'),
    panelArt: document.getElementById('panelArt'),
    panelTitle: document.getElementById('panelTitle'),
    panelText: document.getElementById('panelText'),
    cards: document.getElementById('cards'),
    voiceBtn: document.getElementById('voiceBtn'),

    startOverlay: document.getElementById('startOverlay'),
    countText: document.getElementById('countText'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endHome: document.getElementById('endHome')
  };

  var state = {
    round: 0,
    stars: 0,
    prompt: '',                        // 🔊 다시 를 누르면 읽어 줄 말
    firstTry: true,
    locked: false,
    deck: []                           // 이번 판의 문제 열 개
  };

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  showCount();

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
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '다리가 네 개인데 걷지 못하는 것은 무엇일까요?'; } });
  });

  // 맨 위 ← 는 방금 지나온 놀이 페이지로, 결과 화면의 🏠 만 홈으로 갑니다.
  bindGo(el.backBtn, Catalog.backHref('riddle.html'));
  bindGo(el.startHome, Catalog.backHref('riddle.html'));
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  /* ---------- 풀어 본 문제 기억하기 ---------- */

  function loadDone() {
    try {
      var v = JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function markDone(q) {
    var done = loadDone();
    if (done.indexOf(q) >= 0) return;
    done.push(q);
    try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch (e) { /* 무시 */ }
  }

  // 시작 화면의 '지금까지 n개 풀었어요' — 문제가 늘면 분모도 같이 늡니다
  function showCount() {
    var all = RIDDLES.length;
    var done = loadDone().filter(function (q) {
      return RIDDLES.some(function (r) { return r.q === q; });   // 지워진 문제는 안 셉니다
    }).length;
    el.countText.textContent = done
      ? '지금까지 ' + all + '개 중 ' + done + '개를 풀어 봤어요'
      : '문제가 ' + all + '개 기다리고 있어요';
  }

  // 안 풀어 본 것부터, 모자라면 풀어 본 것에서 채웁니다 (둘 다 섞어서)
  function pickDeck() {
    var done = loadDone();
    var fresh = [], seen = [];
    RIDDLES.forEach(function (r) {
      (done.indexOf(r.q) >= 0 ? seen : fresh).push(r);
    });
    UI.shuffle(fresh);
    UI.shuffle(seen);
    return fresh.concat(seen).slice(0, ROUNDS);
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    state.prompt = '';
    state.locked = false;
    state.deck = pickDeck();
    el.bar.style.width = '0%';
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= state.deck.length) return finish();
    state.firstTry = true;
    state.locked = false;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    ask(state.deck[state.round]);
  }

  // 보기 넉 개 — RIDDLES 의 첫 번째가 정답이고 여기서 섞습니다
  function ask(r) {
    el.cards.innerHTML = '';

    var options = r.choices.map(function (c, i) {
      var o = (typeof c === 'string') ? { text: c } : { text: c.text, emoji: c.emoji, why: c.why };
      o.right = (i === 0);
      return o;
    });
    UI.shuffle(options);

    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice ans-card' + (o.emoji ? ' with-art' : '');
      b.innerHTML = (o.emoji ? '<div class="art">' + o.emoji + '</div>' : '')
        + '<div class="text">' + o.text + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return missed(b, o.why);
        score(b, r);
      });
      el.cards.appendChild(b);
    });

    el.label.textContent = '문제 ' + (state.round + 1) + ' / ' + state.deck.length;
    showPanel(r.emoji || '🤔', r.q, '');
    state.prompt = r.q;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(speakPrompt, 300);
  }

  // 맞혔을 때 — 별을 주고 풀이를 읽어 준 뒤 다음 문제로 갑니다.
  function score(card, r) {
    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    markDone(r.q);
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    var answer = (typeof r.choices[0] === 'string') ? r.choices[0] : r.choices[0].text;
    showPanel('🎉', '정답은 ' + answer + '!', r.why);
    state.prompt = r.why;
    el.speakBtn.hidden = true;   // 풀이를 읽고 나면 바로 다음 문제라, 여기서 끊으면 흐름이 멈춥니다
    speak(r.why, function () { setTimeout(nextRound, 700); });
  }

  // 틀렸을 때 — 카드를 흐리게 남기고 문제를 다시 들려줍니다 (지우지 않습니다).
  function missed(card, why) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    var text = why || '아니에요. 다시 생각해 봐요.';
    el.panelText.textContent = text;
    fitCards();
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
    speak(text, function () { setTimeout(speakPrompt, 200); });
  }

  function finish() {
    state.locked = true;
    el.bar.style.width = '100%';
    var total = state.deck.length;
    UI.saveBest(BEST_KEY, state.stars, total);
    showCount();

    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 화면 ---------- */

  function showPanel(art, title, text) {
    el.panelArt.textContent = art;
    el.panelTitle.textContent = title || '';
    el.panelText.textContent = text || '';
    el.panel.classList.remove('pop');
    void el.panel.offsetWidth;
    el.panel.classList.add('pop');
    fitCards();
  }

  function updateScore() {
    el.score.textContent = '⭐ ' + state.stars;
  }

  /* ---------- 카드 크기 맞추기 ----------
   * 보기 넉 장이 화면 아래로 넘치지 않게 높이를 정합니다 (스크롤이 생기면 안 됩니다).
   * 문제가 길어 판이 커지면 카드가 그만큼 줄고, 손가락 최소 64px 아래로는 안 갑니다. */
  function fitCards() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var n = el.cards.children.length;
    if (!n) return;

    var cols = getComputedStyle(el.cards).gridTemplateColumns.split(' ').length || 2;
    var rows = Math.ceil(n / cols);
    var gap = px(getComputedStyle(el.cards).rowGap) || 10;

    var top = el.cards.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;
    var availH = screenH - top - toolsH - bottomPad - 6;

    var h = Math.round(Math.max(64, Math.min(240, (availH - gap * (rows - 1)) / rows)));
    el.cards.style.setProperty('--ch', h + 'px');
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitCards);
  window.addEventListener('orientationchange', function () { setTimeout(fitCards, 200); });

  /* ---------- 소리 ---------- */

  function speakPrompt() {
    speak(state.prompt);
  }

  // speak() 를 부를 때마다 하나씩 올라갑니다. 새 말이 시작되면 먼저 하던 말은 끊기는데(TTS 가 cancel),
  // 그때 먼저 말의 then 까지 불러 버리면 끊긴 말이 이어서 또 나옵니다 — 그래서 최신 것만 then 을 부릅니다.
  var speakSeq = 0;

  // 다 읽으면 then 을 부릅니다. 소리를 못 내는 기기에서도 흐름이 끊기지 않게
  // 읽는 데 걸릴 만한 시간 뒤에는 꼭 한 번 부릅니다.
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
      setTimeout(once, 600);
      return;
    }

    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }
})();
