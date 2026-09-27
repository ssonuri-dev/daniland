/* =========================================================================
 * 다니랜드 - 단어 퀴즈 (wordquiz.html)
 *
 * 영어 '단어 공부' 묶음의 수업(LESSONS)과 마을 지도의 장소(js/town-places.js)에서 낱말을 섞어 냅니다
 * — 여기에 낱말을 따로 적지 않습니다.
 * 수업에 낱말을 더하면 퀴즈도 같이 늘어납니다 (글자 만들기·단어 쓰기와 같은 규칙).
 * 화면 얼개는 수수께끼(riddle.js)와 같습니다: 위 판에 문제, 아래 보기 넉 장, 한 판 열 문제.
 *
 * 문제 모양은 네 가지이고 한 판에 섞여 나옵니다 (KINDS).
 *   listen : 영어를 듣고 그림 고르기       pic : 그림을 보고 영어 고르기
 *   ko     : 우리말을 보고 영어 고르기     en  : 영어를 보고 우리말 고르기
 * 앞의 둘은 그림이 한 개짜리인 낱말만 씁니다 — 요일은 그림이 없고, 숫자 세기는 사탕이 여러 개라
 * 보기 카드에 안 들어갑니다. 그런 낱말은 뒤의 둘로만 나옵니다.
 *
 * ⚠️ 틀린 보기는 **정답과 같은 수업에서만** 뽑습니다. 수업을 넘나들면 정답이 둘이 됩니다 —
 *   orange 는 과일(오렌지)에도 색깔(주황)에도 있고, '배' 는 과일(pear)에도 탈것(ship)에도 있고,
 *   🥵 는 날씨(hot)에도 기분(thirsty)에도 있습니다.
 * ========================================================================= */
(function () {
  var ROUNDS = 10;
  var EN = 'en-US';
  var KO = 'ko-KR';
  var BEST_KEY = 'daniland.best.wordquiz';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  var KINDS = {
    listen: { label: '잘 듣고 그림을 찾아요', pic: true },
    pic:    { label: '영어로 무엇일까요?',    pic: true },
    ko:     { label: '영어로 무엇일까요?',    pic: false },
    en:     { label: '무슨 뜻일까요?',        pic: false }
  };
  var KIND_IDS = ['listen', 'pic', 'ko', 'en'];

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

  // 수업마다 { lesson, items } — 퀴즈에 쓸 수 있는 낱말만 추립니다.
  // 마을 지도(town.html)의 장소 이름도 낱말이라 같이 냅니다 — js/town-places.js 를 수업 하나처럼 붙입니다.
  var LESSON_LIST = (window.LESSONS || []).filter(function (l) {
    return l.subject === '영어' && l.group === '단어 공부' && !l.wordKo;
  });
  if (window.TOWN_PLACES) {
    LESSON_LIST.push({
      icon: '🗺️', title: '마을 지도',
      items: TOWN_PLACES.map(function (p) { return { emoji: p.icon, word: p.word, ko: p.ko }; })
    });
  }

  var POOL = LESSON_LIST.map(function (l) {
    return {
      lesson: l,
      items: (l.items || []).filter(function (it) { return it.word && it.ko; })
    };
  }).filter(function (g) { return g.items.length >= 4; });   // 보기 넉 장이 안 되는 수업은 뺍니다

  // 그림 문제는 그 수업에 그림 낱말이 넉 개 이상일 때만 — 숫자 세기는 one(🍭 하나)만 그림이 한 개라 못 씁니다
  POOL.forEach(function (g) { g.pics = g.items.filter(hasPic).length >= 4; });

  var state = {
    round: 0,
    stars: 0,
    prompt: null,                      // 🔊 다시 를 누르면 읽어 줄 { text, lang }
    firstTry: true,
    locked: false,
    deck: []                           // 이번 판의 문제 열 개 — { group, item, kind }
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
    VoicePicker.open({ lang: EN, sample: function () {
      var q = state.deck[state.round];
      return q ? q.item.word : 'apple';
    } });
  });

  // 맨 위 ← 는 방금 지나온 묶음 페이지로, 결과 화면의 🏠 만 홈으로 갑니다.
  bindGo(el.backBtn, Catalog.backHref('wordquiz.html'));
  bindGo(el.startHome, Catalog.backHref('wordquiz.html'));
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  function showCount() {
    var words = 0;
    POOL.forEach(function (g) { words += g.items.length; });
    el.countText.textContent = POOL.length + '가지 수업 · 낱말 ' + words + '개에서 나와요';
  }

  /* ---------- 문제 뽑기 ---------- */

  // 그림 문제(listen·pic)는 그림이 딱 한 개인 낱말만 — 사탕 열 개는 보기 카드에 안 들어갑니다.
  function hasPic(item) {
    return !!item.emoji && UI.countEmoji(item.emoji) === 1;
  }

  // 수업은 고르게 돌아가며 뽑습니다 — 그냥 섞으면 낱말이 서른 개인 동물만 잔뜩 나옵니다.
  // 같은 수업이 두 번 잇따라 나오지 않게 하고, 문제 모양도 덜 나온 것부터 씁니다.
  function pickDeck() {
    var bags = POOL.map(function (g) { return UI.shuffle(g.items.slice()); });
    var used = { listen: 0, pic: 0, ko: 0, en: 0 };
    var deck = [];
    var order = [];
    var last = -1;

    while (deck.length < ROUNDS) {
      if (!order.length) {
        order = UI.shuffle(POOL.map(function (g, i) { return i; }));
        if (order.length > 1 && order[0] === last) order.push(order.shift());
      }
      var gi = order.shift();
      var item = bags[gi].pop();
      if (!item) { bags[gi] = UI.shuffle(POOL[gi].items.slice()); item = bags[gi].pop(); }
      last = gi;

      var kinds = UI.shuffle(KIND_IDS.filter(function (k) { return !KINDS[k].pic || (POOL[gi].pics && hasPic(item)); }));
      kinds.sort(function (a, b) { return used[a] - used[b]; });
      used[kinds[0]] += 1;
      deck.push({ group: POOL[gi], item: item, kind: kinds[0] });
    }
    return deck;
  }

  // 틀린 보기 셋 — 같은 수업에서, 정답과 영어·우리말·(그림 문제면)그림이 다른 것만
  function pickWrong(q) {
    var a = q.item;
    var pic = KINDS[q.kind].pic;
    var list = q.group.items.filter(function (it) {
      if (it === a || it.word === a.word || it.ko === a.ko) return false;
      if (pic && (!hasPic(it) || it.emoji === a.emoji)) return false;
      return true;
    });
    return UI.shuffle(list).slice(0, 3);
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    state.prompt = null;
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

  function ask(q) {
    var a = q.item;
    el.cards.innerHTML = '';

    var options = [a].concat(pickWrong(q));
    UI.shuffle(options);

    options.forEach(function (it) {
      var b = document.createElement('button');
      if (q.kind === 'listen') {
        b.className = 'choice ans-card art-only';
        b.innerHTML = '<div class="art">' + it.emoji + '</div>';
      } else {
        b.className = 'choice ans-card';
        b.innerHTML = '<div class="text"></div>';
        b.querySelector('.text').textContent = (q.kind === 'en') ? it.ko : it.word;
        if (q.kind !== 'en') b.lang = 'en';
      }
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (it !== a) return missed(b, it);
        score(b, q);
      });
      el.cards.appendChild(b);
    });

    el.label.textContent = '문제 ' + (state.round + 1) + ' / ' + state.deck.length
      + ' · ' + q.group.lesson.icon + ' ' + q.group.lesson.title;

    // 판에 보일 것과 읽어 줄 말 — 모양마다 다릅니다
    if (q.kind === 'listen') {
      showPanel('👂', KINDS.listen.label, '');
      state.prompt = { text: a.word, lang: EN };
    } else if (q.kind === 'pic') {
      showPanel(a.emoji, KINDS.pic.label, '');
      state.prompt = { text: '이건 영어로 무엇일까요?', lang: KO };
    } else if (q.kind === 'ko') {
      showPanel('💬', '‘' + a.ko + '’', KINDS.ko.label);
      state.prompt = { text: a.ko + ', 영어로 무엇일까요?', lang: KO };
    } else {
      showPanel('🔤', a.word, KINDS.en.label);
      state.prompt = { text: a.word, lang: EN };
    }

    el.panel.classList.toggle('word-q', q.kind === 'en');   // 판 제목이 영어 낱말 하나일 때는 크게
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(speakPrompt, 300);
  }

  // 맞혔을 때 — 별을 주고, 영어 = 우리말을 보여 주며 영어로 한 번 읽은 뒤 다음 문제로 갑니다.
  function score(card, q) {
    var a = q.item;
    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    showPanel(hasPic(a) ? a.emoji : '🎉', a.word, a.ko);
    el.panel.classList.add('word-q');
    el.speakBtn.hidden = true;   // 읽고 나면 바로 다음 문제라, 여기서 끊으면 흐름이 멈춥니다
    speak(a.word, EN, function () { setTimeout(nextRound, 800); });
  }

  // 틀렸을 때 — 카드를 흐리게 남기고, 고른 것이 무엇인지 알려 준 뒤 문제를 다시 들려줍니다.
  // 고른 낱말의 이름을 들려주는 것도 복습이라 '아니에요' 대신 그 낱말을 읽습니다.
  function missed(card, it) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    el.panelText.textContent = '그건 ' + it.word + ' (' + it.ko + ') 예요. 다시 골라 봐요.';
    fitCards();
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
    speak(it.word, EN, function () { setTimeout(speakPrompt, 400); });
  }

  function finish() {
    state.locked = true;
    el.bar.style.width = '100%';
    var total = state.deck.length;
    UI.saveBest(BEST_KEY, state.stars, total);

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
   * 수수께끼와 같습니다 — 보기 넉 장이 화면 아래로 넘치지 않게 높이를 정하고, 64px 아래로는 안 갑니다. */
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
    if (state.prompt) speak(state.prompt.text, state.prompt.lang);
  }

  // riddle.js 와 같습니다 — 최신 말만 then 을 부르고, 소리가 안 나는 기기에서도 흐름이 끊기지 않게
  // 읽는 데 걸릴 만한 시간 뒤에는 꼭 한 번 부릅니다.
  var speakSeq = 0;

  function speak(text, lang, then) {
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
    TTS.speak(text, lang, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }
})();
