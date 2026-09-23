/* =========================================================================
 * 다니랜드 - 행성 한 곳 (planet.html?planet=<id>)
 *
 * 태양계 화면(space.html)에서 행성을 누르면 오는 곳입니다. 화면은 하나이고 태양·행성 여덟·달이
 * 이 화면 하나를 같이 씁니다 — 어느 것인지는 주소의 ?planet= 으로 고릅니다 (데이터는 js/planets.js).
 * 나라 페이지(country.html?country=<id>)와 같은 생각입니다.
 *
 * 화면은 위에서부터 — 사진 한 장과 숫자 칩 · 지금 읽는 이야기 · 이야기 카드 · 앞뒤로 넘기는 단추.
 * 카드를 누르면 그 이야기를 우리말로 읽어 주고, 다 읽으면 폭죽이 터집니다.
 * 사진 파일(planet/<id>.jpg)이 없으면 이모지를 크게 대신 그립니다.
 *
 * 들어와 본 행성은 daniland.space.seen 에 쌓입니다 — 태양계 화면의 👀 와 이름 옆 ✓ 가 이것을 읽습니다.
 * 다 읽은 행성은 daniland.planet.read.<id> 에 남아 카드에 ✅ 로 보입니다.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var SEEN_KEY = 'daniland.space.seen';

  var LIST = window.PLANETS || [];
  if (!LIST.length) throw new Error('planet.html: js/planets.js 가 안 읽혔습니다');

  var idx = 0;
  var want = UI.getParam('planet');
  for (var i = 0; i < LIST.length; i++) if (LIST[i].id === want) idx = i;

  var P = LIST[idx];
  var READ_KEY = 'daniland.planet.read.' + P.id;

  document.title = P.name + ' · 다니랜드 ' + P.emoji;

  var el = {
    name: document.getElementById('planetName'),
    score: document.getElementById('score'),
    photo: document.getElementById('photo'),
    title: document.getElementById('title'),
    tagline: document.getElementById('tagline'),
    chips: document.getElementById('chips'),
    story: document.getElementById('story'),
    storyTitle: document.getElementById('storyTitle'),
    storyText: document.getElementById('storyText'),
    speakBtn: document.getElementById('speakBtn'),
    cards: document.getElementById('cards'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    mapBtn: document.getElementById('mapBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn')
  };

  // '지구예요' · '목성이에요' — 받침이 있으면 앞 것, 없으면 뒤 것
  function josa(word, a, b) {
    var ch = word.charCodeAt(word.length - 1);
    if (ch < 0xAC00 || ch > 0xD7A3) return word + b;
    return word + (((ch - 0xAC00) % 28) ? a : b);
  }

  function intro() {
    return josa(P.name, '이에요', '예요') + '. ' + P.tagline;
  }

  var state = {
    fact: null,        // 지금 읽고 있는 이야기 (🔊 다시 가 이것을 읽습니다)
    seen: {},          // 이번에 눌러 본 카드
    done: false
  };

  markVisited();
  build();

  // 이 화면은 시작 단추가 없어서, 처음 화면을 건드릴 때 소리를 열어 둡니다 (모바일은 제스처가 있어야 소리가 납니다)
  function unlockOnce() {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    document.removeEventListener('pointerdown', unlockOnce);
  }
  document.addEventListener('pointerdown', unlockOnce);

  /* ---------- 화면 만들기 ---------- */

  function build() {
    el.name.textContent = P.emoji + ' ' + P.name;
    el.title.textContent = P.name;
    el.tagline.textContent = P.tagline;

    el.photo.innerHTML = '';
    el.photo.appendChild(photoEl());

    el.chips.innerHTML = '';
    (P.chips || []).forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'p-chip';
      d.innerHTML = '<span class="k">' + c.k + '</span><span class="v">' + c.v + '</span>';
      el.chips.appendChild(d);
    });

    showStory({ title: P.name, text: P.tagline + '. 아래 카드를 하나씩 눌러 보세요.' }, false);

    el.cards.innerHTML = '';
    P.facts.forEach(function (f) {
      var b = document.createElement('button');
      b.className = 'planet-card';
      b.innerHTML = '<span class="pc-art">' + f.emoji + '</span>' +
                    '<span class="pc-label">' + f.label + '</span>';
      b.addEventListener('click', function () { readCard(b, f); });
      el.cards.appendChild(b);
    });

    updateScore();
    bindNav();

    if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;
    setTimeout(function () { speak(intro()); }, 400);
  }

  // 사진이 있으면 사진, 없거나 못 읽으면 이모지를 크게
  function photoEl() {
    if (!P.img) return bigEmoji();
    var im = document.createElement('img');
    im.src = 'planet/' + P.img;
    im.alt = P.name;
    im.onerror = function () { im.replaceWith(bigEmoji()); };
    return im;
  }

  function bigEmoji() {
    var d = document.createElement('div');
    d.className = 'planet-emoji';
    d.textContent = P.emoji;
    return d;
  }

  /* ---------- 이야기 ---------- */

  function readCard(card, f) {
    if (window.SFX) SFX.tap();

    if (!state.seen[f.label]) {
      state.seen[f.label] = true;
      card.classList.add('seen');
      updateScore();
    }

    state.fact = f;
    Array.prototype.forEach.call(el.cards.children, function (x) {
      x.classList.toggle('on', x === card);
    });
    showStory(f, true);

    speak(f.title + '. ' + f.text, function () {
      if (Object.keys(state.seen).length >= P.facts.length) finishAll(card);
    });
  }

  function showStory(f, pop) {
    el.storyTitle.textContent = f.title;
    el.storyText.textContent = f.text;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    if (!pop) return;
    el.story.classList.remove('pop');
    void el.story.offsetWidth;
    el.story.classList.add('pop');
  }

  function finishAll(card) {
    if (state.done) return;
    state.done = true;
    UI.saveValue(READ_KEY, '1');
    if (window.SFX) SFX.finish();
    UI.confettiAt(card);
    el.score.textContent = '🎉 다 읽었어요!';
  }

  function updateScore() {
    el.score.textContent = '📖 ' + Object.keys(state.seen).length + '/' + P.facts.length;
  }

  /* ---------- 앞뒤로 넘기기 ---------- */

  function bindNav() {
    var prev = LIST[(idx - 1 + LIST.length) % LIST.length];
    var next = LIST[(idx + 1) % LIST.length];

    el.prevBtn.innerHTML = '◀ ' + prev.emoji + ' ' + prev.name;
    el.nextBtn.innerHTML = next.emoji + ' ' + next.name + ' ▶';

    go(el.prevBtn, 'planet.html?planet=' + prev.id);
    go(el.nextBtn, 'planet.html?planet=' + next.id);
    go(el.mapBtn, 'space.html');
    go(el.backBtn, 'space.html');

    el.speakBtn.addEventListener('click', function () {
      if (state.fact) speak(state.fact.title + '. ' + state.fact.text);
      else speak(intro());
    });

    el.voiceBtn.addEventListener('click', function () {
      VoicePicker.open({ lang: LANG, sample: intro });
    });
  }

  function go(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  /* ---------- 들어와 본 행성 표시 ---------- */

  function markVisited() {
    var list = [];
    try { list = JSON.parse(UI.loadValue(SEEN_KEY) || '[]') || []; } catch (e) { list = []; }
    for (var i = 0; i < list.length; i++) if (list[i] === P.id) return;
    list.push(P.id);
    UI.saveValue(SEEN_KEY, JSON.stringify(list));
  }

  /* ---------- 소리 ----------
   * 태양계 화면과 같은 규칙입니다 — 읽는 중에 다른 카드를 누르면 앞 사슬은 조용히 끊깁니다. */

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
      setTimeout(once, 600);
      return;
    }

    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }
})();
