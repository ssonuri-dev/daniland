/* =========================================================================
 * 다니랜드 - 나라 페이지 (세계: 나라 한 곳을 깊이 알아보기 — country.html?country=<id>)
 *
 * 세계 지도(world.js)가 나라 열두 곳을, 유럽(europe.js)이 열여덟 곳을 얕게 훑는 것이라면, 이 화면은 나라 하나만
 * 깊이 봅니다. 화면은 하나이고 나라마다 데이터 파일이 있습니다 — js/countries/<id>.js 가 window.COUNTRY_PAGES[id] 에
 * 이름·인사말·이야기 카드(FACTS)·다른 나라 것(OTHERS)·퀴즈(QUIZ)를 넣어 두면, 여기서 주소의 ?country= 로 골라 씁니다.
 * (처음에는 스웨덴 전용 sweden.js 였는데 그리스가 더해지면서 화면과 데이터를 갈랐습니다 — 2026-09-22)
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   look : 알아보기     - 카드를 누르면 그 이야기를 읽어 줍니다 (점수 없음, 다 보면 끝)
 *   find : 무엇이 있을까 - 넉 장 중 이 나라에 있는 것을 고릅니다 (다른 나라 것 셋이 섞입니다)
 *   quiz : 퀴즈         - 알아보기에서 배운 것을 물어봅니다 (보기 넉 개)
 *
 * 폰(가로 600px 미만)에서는 알아보기가 다릅니다 — 위 판이 없고, 카드를 누르면 사진과 이야기가
 * 화면 가득 뜹니다(openStory). 폰 폭에서는 판 옆의 사진이 112px 로 너무 작고, 판을 키우면 카드 18장이
 * 밀려 스크롤이 생기며 아래 카드를 눌렀을 때 판이 안 보이기 때문입니다. 태블릿은 위 판 그대로입니다.
 *
 * 읽어 주는 말은 우리말(ko-KR)입니다. 그 나라 말(native)이 붙은 카드는 우리말 뒤에 그 나라 말로도
 * 한 번 읽어 주는데, 기기에 그 말 목소리가 없으면 조용히 건너뜁니다 — 우리말 안에 이미
 * '스베리예' 처럼 읽는 법이 들어 있어서 못 들어도 배우는 데 지장이 없습니다.
 *
 * 기록 키는 daniland.best.<id>(카드의 ⭐)·daniland.best.<id>.<act>, 마지막에 고른 놀이는 daniland.<id>Act 입니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* ---------- 어느 나라인지 ---------- */

  var pages = window.COUNTRY_PAGES || {};
  var C = pages[UI.getParam('country')] || pages[Object.keys(pages)[0]];
  if (!C) throw new Error('country.html: js/countries/ 의 나라 데이터가 하나도 없습니다');

  var FACTS = C.FACTS;
  var OTHERS = C.OTHERS;
  var QUIZ = C.QUIZ;
  var NAME = C.name;
  var NATIVE = C.nativeLang;

  document.title = NAME + ' · 다니랜드 ' + C.icon;

  // 받침이 있으면 앞 것(을·은·이에요), 없으면 뒤 것(를·는·예요) — '스웨덴을' · '그리스를'
  function josa(word, a, b) {
    var ch = word.charCodeAt(word.length - 1);
    if (ch < 0xAC00 || ch > 0xD7A3) return word + b;
    return word + (((ch - 0xAC00) % 28) ? a : b);
  }

  var ACTS = [
    { id: 'look', name: '알아보기',     icon: '🔎', desc: '카드를 누르면 ' + NAME + ' 이야기를 읽어 줘요' },
    { id: 'find', name: '무엇이 있을까', icon: C.findIcon || '🔍', desc: '넉 장 중 ' + NAME + '에 있는 것을 찾아요' },
    { id: 'quiz', name: '퀴즈',         icon: '❓', desc: '알아보기에서 배운 것을 물어봐요' }
  ];

  // 폰이면 알아보기를 팝업 방식으로 (css 의 @media (max-width: 599px) 와 같은 기준)
  var narrowMQ = window.matchMedia ? window.matchMedia('(max-width: 599px)') : null;
  function isNarrow() { return narrowMQ ? narrowMQ.matches : window.innerWidth < 600; }

  var BEST_KEY = 'daniland.best.' + C.id;     // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.' + C.id + 'Act';   // 마지막에 고른 놀이

  var el = {
    label: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    panel: document.getElementById('panel'),
    panelArt: document.getElementById('panelArt'),
    panelTitle: document.getElementById('panelTitle'),
    panelSv: document.getElementById('panelSv'),
    panelText: document.getElementById('panelText'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

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
    endHome: document.getElementById('endHome'),

    startTitle: document.getElementById('startTitle'),
    startTagline: document.getElementById('startTagline'),
    creditLink: document.getElementById('creditLink')
  };

  // 나라 이름·한 줄 소개·출처 링크·판 색을 데이터에서 채웁니다
  el.startTitle.textContent = C.icon + ' ' + NAME;
  el.startTagline.textContent = C.tagline || '';
  if (el.creditLink) el.creditLink.href = 'https://github.com/ssonuri-dev/daniland/blob/main/' + C.id + '/CREDITS.md';
  if (C.panel) el.panel.style.background = C.panel;

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    round: 0,
    stars: 0,
    prompt: '',                        // 🔊 다시 를 누르면 읽어 줄 말
    firstTry: true,
    locked: false,
    deck: [],                          // 이번 판에 아직 안 나온 문제들
    seen: {},                          // 알아보기에서 눌러 본 카드
    fact: null,                        // 알아보기에서 지금 읽고 있는 카드 (🔊 다시 가 이것을 읽습니다)
    story: null                        // 폰의 이야기 팝업 (열려 있으면 그 요소)
  };

  if (!findAct(state.act)) state.act = 'look';

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

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

  el.speakBtn.addEventListener('click', speakPrompt);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || C.sample || NAME + '예요.'; } });
  });

  // 맨 위 ← 는 방금 지나온 과목 페이지로, 결과 화면의 🏠 만 홈으로 갑니다.
  var back = Catalog.backHref('country.html?country=' + C.id);
  bindGo(el.backBtn, back);
  bindGo(el.endHome, 'index.html');
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);

  function bindGo(btn, href) {
    if (!btn) return;
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

  // 놀이마다 최고 기록을 단추 아래에 작게 보여 줍니다. (알아보기는 점수가 없습니다)
  function bestText(act) {
    if (act === 'look') return '';
    var best = UI.readBest(BEST_KEY + '.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 위 판 (이야기 · 문제) ---------- */

  // art 는 이모지, img 는 (있으면) 사진 파일 이름 — 사진을 못 읽으면 이모지로 돌아갑니다.
  function showPanel(art, title, text, sv, img) {   // sv: 그 나라 말 한 줄 (제목 아래 작게)
    el.panelArt.innerHTML = '';
    el.panelArt.appendChild(artEl(art, img));
    el.panel.classList.toggle('with-photo', !!img);
    el.panelTitle.textContent = title || '';
    el.panelText.textContent = text || '';
    el.panelSv.textContent = sv || '';
    el.panelSv.hidden = !sv;
    el.panel.classList.remove('pop');
    void el.panel.offsetWidth;
    el.panel.classList.add('pop');
    fitCards();
  }

  function artEl(emoji, img) {
    if (!img) return document.createTextNode(emoji || '');
    var im = document.createElement('img');
    im.src = C.id + '/' + img;
    im.alt = '';
    im.onerror = function () {
      im.replaceWith(document.createTextNode(emoji || ''));
      el.panel.classList.remove('with-photo');
      fitCards();
    };
    im.onload = fitCards;
    im.addEventListener('click', function () { if (!state.story) zoomPhoto(im.src); });
    return im;
  }

  // 사진을 누르면 화면 가득 크게 — 폰에서는 판의 사진이 작아서요. 아무 데나 누르면 닫힙니다.
  function zoomPhoto(src) {
    var box = document.createElement('div');
    box.className = 'photo-zoom';
    var big = document.createElement('img');
    big.src = src;
    big.alt = '';
    box.appendChild(big);
    box.addEventListener('click', function () { box.remove(); });
    document.body.appendChild(box);
  }

  function setLabel(text) {
    el.label.textContent = text;
  }

  /* ---------- 카드 크기 맞추기 ----------
   * 카드 줄이 화면 아래로 넘치지 않게 높이를 정합니다 (스크롤이 생기면 안 됩니다).
   * 알아보기는 열여덟 장이라 넉 줄 넘게 서므로 여기서 줄여 주고, 손가락 최소 64px 아래로는 안 갑니다. */
  function fitCards() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var n = el.cards.children.length;
    if (!n) return;

    var cols = parseInt(getComputedStyle(el.cards).gridTemplateColumns.split(' ').length, 10) || 2;
    var rows = Math.ceil(n / cols);
    var gap = px(getComputedStyle(el.cards).rowGap) || 10;

    var top = el.cards.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;
    var availH = screenH - top - toolsH - bottomPad - 6;

    var max = (state.act === 'look') ? 150 : 200;
    var h = Math.round(Math.max(64, Math.min(max, (availH - gap * (rows - 1)) / rows)));
    el.cards.style.setProperty('--ch', h + 'px');
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitCards);
  window.addEventListener('orientationchange', function () { setTimeout(fitCards, 200); });

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    state.prompt = '';
    state.locked = false;
    state.seen = {};
    state.fact = null;
    closeStory();
    el.bar.style.width = '0%';
    el.cards.innerHTML = '';
    el.speakBtn.hidden = true;

    if (state.act === 'look') return startLook();

    state.deck = UI.shuffle((state.act === 'find' ? findables() : QUIZ.slice()).slice()).slice(0, ROUNDS);
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= state.deck.length) return finish();

    state.firstTry = true;
    state.locked = false;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    var item = state.deck[state.round];
    if (state.act === 'find') askFind(item);
    else askQuiz(item);
  }

  // 문제를 낼 때마다 부릅니다 — 읽어 줄 말을 정하고 🔊 다시 를 켭니다.
  function beginQuestion(spoken) {
    state.prompt = spoken;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(speakPrompt, 300);
  }

  // 맞혔을 때 — 별을 주고 설명을 읽어 준 뒤 다음 문제로 갑니다.
  function scoreQuestion(card, art, title, why, img) {
    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    showPanel(art, title, why, '', img);
    state.prompt = why;
    el.speakBtn.hidden = true;   // 설명을 읽고 나면 바로 다음 문제라, 여기서 끊으면 흐름이 멈춥니다
    speak(why, function () { setTimeout(nextRound, 500); });
  }

  // 틀렸을 때 — 카드를 흐리게 남기고 까닭을 보여 준 뒤 문제를 다시 들려줍니다.
  function missed(card, why) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    el.panelText.textContent = why || '아니에요. 다시 골라 봐요.';
    fitCards();   // 까닭이 들어가 판이 커지면 카드가 그만큼 줄어야 합니다
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
    speak(el.panelText.textContent, function () { setTimeout(speakPrompt, 200); });
  }

  /* 🔎 알아보기 — 카드 열여덟 장. 누르면 이야기를 읽어 주고, 다 보면 끝납니다. */
  function startLook() {
    el.cards.className = 'cards country-cards look-cards';
    el.cards.innerHTML = '';

    FACTS.forEach(function (f) {
      var b = document.createElement('button');
      b.className = 'choice fact-card';
      b.innerHTML = '<div class="art">' + f.emoji + '</div>' +
                    '<div class="lbl">' + f.label + '</div>';
      b.addEventListener('click', function () { lookAt(b, f); });
      el.cards.appendChild(b);
    });

    updateScore();
    setLabel('카드를 눌러 ' + josa(NAME, '을', '를') + ' 둘러봐요');
    showPanel(C.icon, NAME, C.intro || '카드를 하나씩 눌러 보세요.', C.nativeName || '');
    layoutLook();
    beginQuestion(josa(NAME, '이에요', '예요') + '. ' + (C.intro || '카드를 하나씩 눌러 보세요.'));
    if (isNarrow()) el.speakBtn.hidden = true;   // 폰은 팝업 안에 🔊 가 있습니다
  }

  // 폰이면 위 판을 감추고 카드가 화면을 다 씁니다. 창 크기가 바뀌어도 맞춥니다.
  function layoutLook() {
    if (state.act !== 'look') return;
    el.panel.hidden = isNarrow();
    fitCards();
  }

  window.addEventListener('resize', layoutLook);

  function lookAt(card, f) {
    if (window.SFX) SFX.tap();

    if (!state.seen[f.id]) {
      state.seen[f.id] = true;
      card.classList.add('seen');
      UI.addMark(card, '✅');
      updateScore();
    }

    var svLine = f.native ? f.native + ' · ' + f.nativeKo : '';
    state.fact = f;
    if (isNarrow()) {
      openStory(f, svLine);
    } else {
      showPanel(f.emoji, f.title, f.text, svLine, f.img);
      el.speakBtn.hidden = !(window.TTS && TTS.supported);
    }
    readFact(f);
  }

  /* 폰의 이야기 팝업 — 사진이 화면 폭 전체로 나오고, ✕ 를 누르면 카드로 돌아갑니다. */
  function openStory(f, svLine) {
    closeStory();
    var box = document.createElement('div');
    box.className = 'story-pop';

    var art = document.createElement('div');
    art.className = 'sp-art';
    art.appendChild(artEl(f.emoji, f.img));
    box.appendChild(art);

    var title = document.createElement('div');
    title.className = 'sp-title';
    title.textContent = f.title;
    box.appendChild(title);

    if (svLine) {
      var sv = document.createElement('div');
      sv.className = 'sp-sv';
      sv.textContent = svLine;
      box.appendChild(sv);
    }

    var text = document.createElement('div');
    text.className = 'sp-text';
    text.textContent = f.text;
    box.appendChild(text);

    var btns = document.createElement('div');
    btns.className = 'sp-btns';
    if (window.TTS && TTS.supported) {
      var again = document.createElement('button');
      again.className = 'speak-btn small';
      again.textContent = '🔊 다시';
      again.addEventListener('click', function () { readFact(f); });
      btns.appendChild(again);
    }
    var close = document.createElement('button');
    close.className = 'big-btn ghost sp-close';
    close.textContent = '✕ 닫기';
    close.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      closeStory();
    });
    btns.appendChild(close);
    box.appendChild(btns);

    document.body.appendChild(box);
    state.story = box;
  }

  function closeStory() {
    if (state.story) { state.story.remove(); state.story = null; }
  }

  // 이야기를 우리말로 읽고, 그 나라 말이 있으면 이어서 읽습니다. 다 읽었는데 카드를 다 봤으면 끝냅니다.
  // 읽는 중에 다른 카드를 누르면 그쪽 읽기가 시작되고 이 사슬은 조용히 끊깁니다 (speak 의 seq).
  function readFact(f) {
    speak(f.title + '. ' + f.text, function () {
      speakNative(f.native, function () {
        if (Object.keys(state.seen).length >= FACTS.length) setTimeout(finishLook, 300);
      });
    });
  }

  function finishLook() {
    closeStory();
    if (window.SFX) SFX.finish();
    el.endTitle.textContent = josa(NAME, '을', '를') + ' 다 둘러봤어요!';
    el.endStars.textContent = C.icon;
    el.endText.textContent = '이제 퀴즈도 풀어 볼까요?';
    el.endOverlay.hidden = false;
  }

  /* 🦌 무엇이 있을까 — 이 나라 것 하나 + 다른 나라 것 셋 */
  function findables() {
    return FACTS.filter(function (f) { return f.find; });
  }

  function askFind(f) {
    el.cards.className = 'cards country-cards pick-cards';
    el.cards.innerHTML = '';

    var options = UI.shuffle(OTHERS.slice()).slice(0, 3).map(function (o) {
      return { emoji: o.emoji, label: o.label, why: o.emoji + ' ' + o.why, right: false };
    });
    options.push({ emoji: f.emoji, label: f.find, right: true });
    UI.shuffle(options);

    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice pick-card';
      b.innerHTML = '<div class="art">' + o.emoji + '</div>' +
                    '<div class="lbl">' + o.label + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return missed(b, o.why);
        scoreQuestion(b, f.emoji, f.title, f.text, f.img);
      });
      el.cards.appendChild(b);
    });

    setLabel(NAME + '에 있는 것은? (' + (state.round + 1) + '/' + state.deck.length + ')');
    showPanel(C.icon, NAME + '에 있는 것은 무엇일까요?', '');
    beginQuestion('이 중에서 ' + NAME + '에 있는 것은 무엇일까요?');
  }

  /* ❓ 퀴즈 — 보기 넉 개 (첫 번째가 정답, 화면에서는 섞습니다) */
  function askQuiz(q) {
    el.cards.className = 'cards country-cards ans-cards';
    el.cards.innerHTML = '';

    var options = q.choices.map(function (c, i) {
      var o = (typeof c === 'string') ? { text: c } : { emoji: c.emoji, text: c.text, why: c.why };
      o.right = (i === 0);
      return o;
    });
    UI.shuffle(options);

    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice ans-card' + (o.emoji ? ' flag' : '');
      b.innerHTML = o.emoji
        ? '<div class="art">' + o.emoji + '</div>'
        : '<div class="text">' + o.text + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return missed(b, o.why);
        scoreQuestion(b, q.emoji || o.emoji, '맞았어요!', q.why);
      });
      el.cards.appendChild(b);
    });

    setLabel('퀴즈 (' + (state.round + 1) + '/' + state.deck.length + ')');
    showPanel(q.emoji || '❓', q.q, '');
    beginQuestion(q.q);
  }

  function finish() {
    state.locked = true;
    el.bar.style.width = '100%';
    var total = state.deck.length;
    UI.saveBest(BEST_KEY + '.' + state.act, state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);

    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 소리 · 화면 ---------- */

  function updateScore() {
    if (state.act === 'look') {
      el.score.textContent = '👀 ' + Object.keys(state.seen).length + '/' + FACTS.length;
    } else {
      el.score.textContent = '⭐ ' + state.stars;
    }
  }

  function speakPrompt() {
    if (state.act === 'look' && state.fact) return readFact(state.fact);
    speak(state.prompt);
  }

  // speak() 를 부를 때마다 하나씩 올라갑니다. 새 말이 시작되면 먼저 하던 말은 끊기는데(TTS 가 cancel),
  // 그때 먼저 말의 then 까지 불러 버리면 끊긴 말이 이어서 또 나옵니다 — 그래서 최신 것만 then 을 부릅니다.
  var speakSeq = 0;

  // 다 읽으면 then 을 부릅니다. 소리를 못 내는 기기에서도 흐름이 끊기지 않게
  // 읽는 데 걸릴 만한 시간 뒤에는 꼭 한 번 부릅니다. (우리말은 영어보다 글자당 오래 걸립니다)
  function speak(text, then, lang) {
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
    TTS.speak(text, lang || LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }

  // 그 나라 말은 그 목소리가 있는 기기에서만 읽어 줍니다 (없으면 바로 then).
  function speakNative(text, then) {
    if (!text || !NATIVE || !window.TTS || !TTS.supported || !TTS.voicesFor(NATIVE).length) {
      if (then) then();
      return;
    }
    speak(text, then, NATIVE);
  }
})();
