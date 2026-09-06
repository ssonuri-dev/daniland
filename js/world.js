/* =========================================================================
 * 다니랜드 - 세계 지도 (세계: 나라 이름과 그 나라에 있는 것)
 *
 * 그림 한 장(world.jpg) 위에 나라마다 보이지 않는 단추를 얹어 놓았습니다.
 * 나라를 누르면 다니가 비행기를 타고 그리로 날아갑니다.
 * 마을 지도(town.js)와 같은 얼개인데, 길이 없으니 곧장 날아가면 됩니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   look   : 구경하기     - 아무 나라나 누르면 이름·대륙·수도를 알려 줍니다 (점수 없음)
 *   listen : 찾아가기     - "Let's fly to Japan!" 을 듣고 그 나라를 찾습니다
 *   find   : 무엇이 있을까 - 그림을 보고 어느 나라인지 고릅니다
 *
 * 좌표는 모두 지도 그림 기준 백분율(%)입니다. 그림을 새로 바꾸면
 * COUNTRIES 의 box 와 x/y 만 다시 재면 되고, 나머지는 손댈 것이 없습니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'en-US';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* -------------------------------------------------------------------------
   * 나라 열두 곳
   *   box      : 누를 수 있는 칸 [왼쪽, 위, 너비, 높이]  (지도에서 그 나라가 칠해진 자리)
   *   x, y     : 비행기가 내리는 자리
   *   capital  : 수도 · continent : 대륙 (나라를 맞히면 화면과 소리로 같이 알려 줍니다)
   *   items    : '무엇이 있을까' 에 나오는 그림과 영어 문장
   *
   * box 는 서로 겹치면 안 됩니다 — 겹치면 위에 그려진 단추가 아래 것을 가립니다.
   * ---------------------------------------------------------------------- */
  var COUNTRIES = [
    {
      id: 'america', word: 'the United States', ko: '미국', icon: '🇺🇸',
      capital: 'Washington, D.C.', capitalKo: '워싱턴', continent: 'North America', continentKo: '북아메리카',
      box: [2, 34, 26, 17], x: 15, y: 44,
      items: [
        { emoji: '🗽', say: 'The Statue of Liberty is here.' },
        { emoji: '🍔', say: 'People eat big hamburgers here.' },
        { emoji: '🚀', say: 'Rockets fly to space from here.' }
      ]
    },
    {
      id: 'britain', word: 'the United Kingdom', ko: '영국', icon: '🇬🇧',
      capital: 'London', capitalKo: '런던', continent: 'Europe', continentKo: '유럽',
      box: [29, 15, 14.5, 15], x: 37, y: 23.5,
      items: [
        { emoji: '🚌', say: 'Big red buses drive here.' },
        { emoji: '👑', say: 'A king lives here.' },
        { emoji: '🕰️', say: 'A big clock tower is here.' }
      ]
    },
    {
      id: 'france', word: 'France', ko: '프랑스', icon: '🇫🇷',
      capital: 'Paris', capitalKo: '파리', continent: 'Europe', continentKo: '유럽',
      box: [30.5, 31, 13.5, 13], x: 38, y: 37,
      items: [
        { emoji: '🥐', say: 'People eat croissants here.' },
        { emoji: '🧀', say: 'People eat lots of cheese here.' },
        { emoji: '🎨', say: 'Many painters lived here.' }
      ]
    },
    {
      id: 'italy', word: 'Italy', ko: '이탈리아', icon: '🇮🇹',
      capital: 'Rome', capitalKo: '로마', continent: 'Europe', continentKo: '유럽',
      box: [45, 31, 11.5, 17], x: 50, y: 38.5,
      items: [
        { emoji: '🍕', say: 'Pizza comes from here.' },
        { emoji: '🍝', say: 'Pasta comes from here.' },
        { emoji: '🍦', say: 'People eat gelato here.' }
      ]
    },
    {
      id: 'egypt', word: 'Egypt', ko: '이집트', icon: '🇪🇬',
      capital: 'Cairo', capitalKo: '카이로', continent: 'Africa', continentKo: '아프리카',
      box: [38, 49, 18, 11], x: 47, y: 55,
      items: [
        { emoji: '🐫', say: 'A camel walks here.' },
        { emoji: '🏜️', say: 'There is a big desert here.' },
        { emoji: '🐊', say: 'A crocodile swims in the river here.' }
      ]
    },
    {
      id: 'kenya', word: 'Kenya', ko: '케냐', icon: '🇰🇪',
      capital: 'Nairobi', capitalKo: '나이로비', continent: 'Africa', continentKo: '아프리카',
      box: [47, 60.5, 14, 13], x: 55, y: 66.5,
      items: [
        { emoji: '🦁', say: 'A lion lives here.' },
        { emoji: '🦒', say: 'A giraffe lives here.' },
        { emoji: '🦓', say: 'A zebra runs here.' }
      ]
    },
    {
      id: 'brazil', word: 'Brazil', ko: '브라질', icon: '🇧🇷',
      capital: 'Brasilia', capitalKo: '브라질리아', continent: 'South America', continentKo: '남아메리카',
      box: [15, 58, 17, 17], x: 24, y: 67,
      items: [
        { emoji: '⚽', say: 'People love soccer here.' },
        { emoji: '🦜', say: 'A toucan sits in the trees here.' },
        { emoji: '🌴', say: 'There is a big rainforest here.' }
      ]
    },
    {
      id: 'china', word: 'China', ko: '중국', icon: '🇨🇳',
      capital: 'Beijing', capitalKo: '베이징', continent: 'Asia', continentKo: '아시아',
      box: [57.5, 26, 21.5, 17], x: 68.5, y: 36,
      items: [
        { emoji: '🐼', say: 'A panda lives here.' },
        { emoji: '🧱', say: 'The Great Wall is here.' },
        { emoji: '🥟', say: 'People eat dumplings here.' }
      ]
    },
    {
      id: 'india', word: 'India', ko: '인도', icon: '🇮🇳',
      capital: 'New Delhi', capitalKo: '뉴델리', continent: 'Asia', continentKo: '아시아',
      box: [56.5, 44, 19, 16], x: 66, y: 51,
      items: [
        { emoji: '🐘', say: 'An elephant walks here.' },
        { emoji: '🐅', say: 'A tiger lives here.' },
        { emoji: '🍛', say: 'People eat curry here.' }
      ]
    },
    {
      id: 'korea', word: 'South Korea', ko: '대한민국', icon: '🇰🇷',
      capital: 'Seoul', capitalKo: '서울', continent: 'Asia', continentKo: '아시아',
      box: [79.2, 32, 9.2, 18], x: 84, y: 41.5,
      items: [
        { emoji: '🥋', say: 'Taekwondo comes from here.' },
        { emoji: '🌶️', say: 'Spicy kimchi comes from here.' },
        { emoji: '🎤', say: 'People sing K-pop here.' }
      ]
    },
    {
      id: 'japan', word: 'Japan', ko: '일본', icon: '🇯🇵',
      capital: 'Tokyo', capitalKo: '도쿄', continent: 'Asia', continentKo: '아시아',
      box: [88.5, 28, 11.5, 27], x: 93, y: 41,
      items: [
        { emoji: '🗻', say: 'Mount Fuji is here.' },
        { emoji: '🌸', say: 'Cherry blossoms bloom here.' },
        { emoji: '🍣', say: 'People eat sushi here.' }
      ]
    },
    {
      id: 'australia', word: 'Australia', ko: '호주', icon: '🇦🇺',
      capital: 'Canberra', capitalKo: '캔버라', continent: 'Oceania', continentKo: '오세아니아',
      box: [66, 70, 24, 20], x: 78, y: 80,
      items: [
        { emoji: '🦘', say: 'A kangaroo hops here.' },
        { emoji: '🐨', say: 'A koala sleeps in the trees here.' },
        { emoji: '🪃', say: 'The boomerang comes from here.' }
      ]
    }
  ];

  var ACTS = [
    { id: 'look',   name: '구경하기',     icon: '🔎', desc: '나라를 누르면 대륙과 수도까지 알려줘요' },
    { id: 'listen', name: '찾아가기',     icon: '👂', desc: '들려주는 나라로 날아가요' },
    { id: 'find',   name: '무엇이 있을까', icon: '🐼', desc: '그림을 보고 어느 나라인지 찾아요' }
  ];

  var BEST_KEY = 'daniland.best.world';      // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.worldAct';         // 마지막에 고른 놀이

  var el = {
    map: document.getElementById('map'),
    spots: document.getElementById('spots'),
    dani: document.getElementById('dani'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    banner: document.getElementById('banner'),
    questItem: document.getElementById('questItem'),
    questLabel: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
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
    endHome: document.getElementById('endHome')
  };

  // 다니는 우리나라에서 출발합니다.
  var home = findCountry('korea');

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    round: 0,
    stars: 0,
    target: null,
    item: null,
    prompt: '',
    firstTry: true,
    locked: false,
    deck: [],                          // 이번 판에 아직 안 나온 나라들
    at: home,                          // 다니가 지금 있는 나라
    pos: { x: home.x, y: home.y },
    visited: {}                        // 구경하기에서 눌러 본 나라
  };

  if (!findAct(state.act)) state.act = 'look';

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildSpots();
  buildModeRow();
  placeDani(home.x, home.y);
  fitMap();

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
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || 'Where is Japan?'; } });
  });

  // 맨 위 ← 는 방금 지나온 과목 페이지로, 결과 화면의 🏠 만 홈으로 갑니다.
  bindGo(el.backBtn, backHref());
  bindGo(el.endHome, 'index.html');
  bindGo(el.startHome, backHref());
  bindGo(el.endModes, backHref());

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
      if ((pages[i].href || '').indexOf('world.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
      }
    }
    return 'index.html';
  }

  /* 나라 하나를 소개하는 한 줄과 한 마디.
   * 이름만 알려 주고 끝내지 않고 대륙과 수도까지 같이 붙입니다. */
  function label(c) {
    return c.word + ' · ' + c.ko + ' · ' + c.continentKo + ' · 수도 ' + c.capitalKo;
  }

  function intro(c) {
    return 'This is ' + c.word + '. It is in ' + c.continent + '. The capital is ' + c.capital + '.';
  }

  function findCountry(id) {
    for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].id === id) return COUNTRIES[i];
    return null;
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

  // 놀이마다 최고 기록을 단추 아래에 작게 보여 줍니다. (구경하기는 점수가 없습니다)
  function bestText(act) {
    if (act === 'look') return '';
    var best = UI.readBest('daniland.best.world.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 지도 그리기 ---------- */

  function buildSpots() {
    COUNTRIES.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'world-spot';
      b.style.left = c.box[0] + '%';
      b.style.top = c.box[1] + '%';
      b.style.width = c.box[2] + '%';
      b.style.height = c.box[3] + '%';
      b.addEventListener('click', function () { choose(b, c); });
      c.el = b;
      el.spots.appendChild(b);
    });
  }

  function clearSpots() {
    COUNTRIES.forEach(function (c) {
      c.el.className = 'world-spot';
      var mark = c.el.querySelector('.mark');
      if (mark) mark.remove();
    });
  }

  // 지도는 정사각형이라 가로·세로 중 좁은 쪽에 맞춥니다. (스크롤이 생기면 안 됩니다)
  // 비행기 크기는 지도 글자 크기를 따라가므로 여기서 같이 정합니다.
  function fitMap() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;

    var top = el.map.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;

    var availH = screenH - top - toolsH - bottomPad - 6;

    // clientWidth 는 좌우 여백을 포함하므로 그대로 쓰면 지도가 여백만큼 삐져나갑니다.
    var box = el.map.parentNode;
    var boxStyle = getComputedStyle(box);
    var availW = box.clientWidth - px(boxStyle.paddingLeft) - px(boxStyle.paddingRight);
    var size = Math.max(240, Math.min(availW, availH));

    el.map.style.width = size + 'px';
    el.map.style.height = size + 'px';
    el.map.style.fontSize = Math.round(size / 16) + 'px';
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitMap);
  window.addEventListener('orientationchange', function () { setTimeout(fitMap, 200); });

  /* ---------- 다니가 비행기를 타고 날아가기 ---------- */

  function placeDani(x, y) {
    state.pos.x = x;
    state.pos.y = y;
    el.dani.style.left = x + '%';
    el.dani.style.top = y + '%';
  }

  // 바다 위든 대륙 위든 곧장 날아갑니다 — 마을과 달리 지나갈 길이 없습니다.
  function flyTo(country, done) {
    // 이미 그 나라에 있으면 날아갈 것이 없습니다 (같은 곳을 다시 누른 경우)
    if (country === state.at) {
      if (done) done();
      return;
    }

    var dur = flyTime(country);

    // 왼쪽으로 갈 때는 비행기를 뒤집어 줍니다.
    el.dani.classList.toggle('back', country.x < state.pos.x);
    el.dani.classList.add('flying');
    el.dani.style.transitionDuration = dur + 'ms';
    placeDani(country.x, country.y);

    setTimeout(function () {
      el.dani.classList.remove('flying');
      state.at = country;
      if (done) done();
    }, dur);
  }

  // 날아갈 시간을 미리 알아야 다음 문제로 넘어갈 때를 정할 수 있습니다.
  function flyTime(country) {
    if (country === state.at) return 0;

    var dx = country.x - state.pos.x;
    var dy = country.y - state.pos.y;
    return Math.max(500, Math.round(Math.sqrt(dx * dx + dy * dy) * 14));
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    clearSpots();
    state.round = 0;
    state.stars = 0;
    state.visited = {};
    state.locked = false;
    state.target = null;
    state.item = null;
    state.deck = [];

    if (state.act === 'look') {
      el.bar.style.width = '0%';
      el.score.textContent = '🔎 0/' + COUNTRIES.length;
      el.speakBtn.hidden = true;
      el.questItem.hidden = true;
      el.questLabel.textContent = '나라를 눌러 보세요';
      return;
    }

    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    clearSpots();
    state.firstTry = true;
    state.locked = false;

    var next = pickTarget();
    state.target = next;
    state.item = (state.act === 'find') ? pickItem(next) : null;

    if (state.act === 'find') {
      state.prompt = state.item.say + ' Which country is it?';
      el.questItem.hidden = false;
      el.questItem.textContent = state.item.emoji;
      el.questLabel.textContent = '어느 나라일까요? (' + (state.round + 1) + '/' + ROUNDS + ')';
    } else {
      state.prompt = "Let's fly to " + next.word + '.';
      el.questItem.hidden = true;
      el.questLabel.textContent = '어디라고 했을까요? (' + (state.round + 1) + '/' + ROUNDS + ')';
    }

    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  /* 열두 나라를 섞어 놓고 한 장씩 꺼내 씁니다 — 한 판(10문제)에 같은 나라가 두 번 나오지 않습니다.
   * 매번 무작위로 고르면 같은 나라가 두세 번 나오고 아예 안 나오는 나라가 생깁니다. */
  function pickTarget() {
    if (!state.deck.length) {
      state.deck = UI.shuffle(COUNTRIES.slice());

      // 판이 넘어갈 때 같은 나라가 연달아 나오지 않게 한 장 밀어 둡니다.
      if (state.target && state.deck[0].id === state.target.id) {
        state.deck.push(state.deck.shift());
      }
    }
    return state.deck.shift();
  }

  /* 그림도 나라마다 섞어 놓고 차례로 씁니다.
   * 세 개를 다 쓰기 전에는 같은 그림이 다시 나오지 않습니다. */
  function pickItem(country) {
    if (!country.bag || !country.bag.length) country.bag = UI.shuffle(country.items.slice());
    return country.bag.shift();
  }

  /* ---------- 눌렀을 때 ---------- */

  function choose(spot, country) {
    if (state.locked || spot.classList.contains('dim')) return;

    // 구경하기 — 틀릴 것이 없습니다. 누른 나라로 날아가서 이름을 알려 줍니다.
    if (state.act === 'look') return look(spot, country);

    if (country.id === state.target.id) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      spot.classList.add('correct');
      UI.addMark(spot, '⭕');
      UI.confettiAt(spot);

      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 맞히는 즉시 막대를 채웁니다. (마지막 문제에서 다 찬 모습을 볼 수 있게)
      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';

      el.questItem.hidden = false;
      el.questItem.textContent = country.icon;
      el.questLabel.textContent = label(country);

      var fly = flyTime(country);
      flyTo(country, function () {
        speak('Welcome to ' + country.word + '! The capital is ' + country.capital + '.');
      });

      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, fly + 2600);

    } else {
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      spot.classList.add('wrong');
      setTimeout(function () {
        spot.classList.remove('wrong');
        spot.classList.add('dim');
        UI.addMark(spot, '❌');
      }, 400);
      setTimeout(speakPrompt, 700);
    }
  }

  // 🔎 세계 구경하기
  function look(spot, country) {
    state.locked = true;
    if (window.SFX) SFX.tap();
    spot.classList.add('correct');

    el.questItem.hidden = false;
    el.questItem.textContent = country.icon;
    el.questLabel.textContent = label(country);

    flyTo(country, function () {
      speak(intro(country));
      state.locked = false;
    });

    if (!state.visited[country.id]) {
      state.visited[country.id] = true;
      var n = countVisited();
      el.score.textContent = '🔎 ' + n + '/' + COUNTRIES.length;
      el.bar.style.width = Math.round((n / COUNTRIES.length) * 100) + '%';

      if (n === COUNTRIES.length) {
        if (window.SFX) SFX.finish();
        showBanner('온 세계를 다 구경했어요! 🎉');
      }
    }

    setTimeout(function () { spot.classList.remove('correct'); }, 900);
  }

  function countVisited() {
    var n = 0;
    for (var k in state.visited) if (state.visited.hasOwnProperty(k)) n++;
    return n;
  }

  function finish() {
    el.bar.style.width = '100%';
    UI.saveBest('daniland.best.world.' + state.act, state.stars, ROUNDS);
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

  function updateScore() {
    el.score.textContent = '⭐ ' + state.stars;
  }

  function speakPrompt() { speak(state.prompt); }

  function speak(text) {
    if (!text || !window.TTS || !TTS.supported) return;
    el.speakBtn.classList.add('speaking');

    TTS.speak(text, LANG, {
      onend: function () { el.speakBtn.classList.remove('speaking'); }
    });
    setTimeout(function () { el.speakBtn.classList.remove('speaking'); }, 3000);
  }

  var bannerTimer = null;

  function showBanner(text) {
    el.banner.textContent = text;
    el.banner.hidden = false;
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.banner.hidden = true; }, 1800);
  }
})();
