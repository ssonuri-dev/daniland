/* =========================================================================
 * 다니랜드 - 마을 지도 (영어: 마을 시설 이름)
 *
 * 그림 한 장(town.jpg) 위에 건물마다 보이지 않는 단추를 얹어 놓았습니다.
 * 건물을 누르면 다니가 길을 따라 그 앞까지 걸어갑니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   look   : 마을 구경하기 - 아무 건물이나 누르면 이름을 읽어 줍니다 (점수 없음)
 *   listen : 듣고 찾아가기 - "Let's go to the bakery!" 를 듣고 그 건물을 찾습니다
 *   errand : 심부름 가기   - 필요한 물건을 보고 어디로 갈지 고릅니다
 *
 * 좌표는 모두 지도 그림 기준 백분율(%)입니다. 그림을 새로 바꾸면
 * PLACES 의 box/x/y 와 아래 ROAD_X · ROAD_Y 만 다시 재면 됩니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'en-US';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  // 지도를 가로지르는 길 — 다니가 이 위로만 다닙니다.
  var ROAD_Y = [31.8, 67.2];   // 가로 길 두 줄
  var ROAD_X = [24, 76.4];     // 위아래를 잇는 세로 길 두 줄 (가운데 길은 공원에서 끊깁니다)

  /* -------------------------------------------------------------------------
   * 마을의 열 곳
   *   box  : 누를 수 있는 칸 [왼쪽, 위, 너비, 높이]  (그림의 한 블록 전체)
   *   x, y : 다니가 서는 자리
   *   row  : 몇 번째 줄인지 (길을 찾을 때 씁니다)
   *   items: 심부름 놀이에 나오는 물건과 영어 문장
   * ---------------------------------------------------------------------- */
  var PLACES = [
    {
      id: 'hospital', word: 'hospital', ko: '병원', icon: '🏥',
      row: 1, box: [0.5, 1.5, 23.5, 28], x: 12, y: 26,
      items: [
        { emoji: '💊', say: 'I am sick. I need some medicine.' },
        { emoji: '🩹', say: 'I hurt my knee.' }
      ]
    },
    {
      id: 'school', word: 'school', ko: '학교', icon: '🏫',
      row: 1, box: [27.5, 1.5, 24.5, 28], x: 40, y: 26,
      items: [
        { emoji: '🎒', say: 'It is time to study.' },
        { emoji: '👩‍🏫', say: 'I want to see my teacher.' }
      ]
    },
    {
      id: 'fire-station', word: 'fire station', ko: '소방서', icon: '🚒',
      row: 1, box: [53.5, 1.5, 20.5, 28], x: 63.5, y: 26,
      items: [
        { emoji: '🔥', say: 'There is a fire!' },
        { emoji: '🧑‍🚒', say: 'We need a fire fighter.' }
      ]
    },
    {
      id: 'police-station', word: 'police station', ko: '경찰서', icon: '🚓',
      row: 1, box: [77.5, 1.5, 22, 28], x: 88.5, y: 26,
      items: [
        { emoji: '👮', say: 'We need a police officer.' },
        { emoji: '🐶', say: 'I lost my puppy.' }
      ]
    },

    {
      id: 'bakery', word: 'bakery', ko: '빵집', icon: '🥐',
      row: 2, box: [0.5, 34, 21.5, 30.5], x: 11, y: 60,
      items: [
        { emoji: '🍞', say: 'I want some bread.' },
        { emoji: '🎂', say: 'I want a birthday cake.' },
        { emoji: '🥐', say: 'I want a croissant.' }
      ]
    },
    {
      id: 'park', word: 'park', ko: '공원', icon: '🌳',
      row: 2, box: [25.5, 34, 49.5, 30.5], x: 50, y: 60,
      items: [
        { emoji: '⚽', say: 'I want to play soccer.' },
        { emoji: '🦆', say: 'I want to see the ducks.' },
        { emoji: '🛝', say: 'I want to play on the slide.' }
      ]
    },
    {
      id: 'market', word: 'market', ko: '가게', icon: '🍎',
      row: 2, box: [78, 34, 21.5, 30.5], x: 89, y: 60,
      items: [
        { emoji: '🍎', say: 'I want to buy some apples.' },
        { emoji: '🥕', say: 'We need carrots.' },
        { emoji: '🥛', say: 'We need some milk.' }
      ]
    },

    {
      id: 'toy-store', word: 'toy store', ko: '장난감 가게', icon: '🧸',
      row: 3, box: [0.5, 70, 22, 29.5], x: 11.5, y: 95,
      items: [
        { emoji: '🧸', say: 'I want a teddy bear.' },
        { emoji: '🚗', say: 'I want a toy car.' },
        { emoji: '🧩', say: 'I want a puzzle.' }
      ]
    },
    {
      id: 'house', word: 'house', ko: '우리 집', icon: '🏠',
      row: 3, box: [26.5, 70, 48, 29.5], x: 50.5, y: 95,
      items: [
        { emoji: '😴', say: 'I am sleepy.' },
        { emoji: '🛏️', say: 'It is time for bed.' }
      ]
    },
    {
      id: 'clothing-store', word: 'clothing store', ko: '옷 가게', icon: '👕',
      row: 3, box: [77.5, 70, 22, 29.5], x: 88.5, y: 95,
      items: [
        { emoji: '👕', say: 'I need a new shirt.' },
        { emoji: '👗', say: 'I want a pretty dress.' },
        { emoji: '🧢', say: 'I need a cap.' }
      ]
    }
  ];

  var ACTS = [
    { id: 'look',   name: '구경하기',   icon: '🔎', desc: '건물을 누르면 이름을 알려줘요' },
    { id: 'listen', name: '찾아가기',   icon: '👂', desc: '들려주는 곳을 찾아가요' },
    { id: 'errand', name: '심부름',     icon: '🧺', desc: '무엇이 필요한지 듣고 그곳을 찾아가요' }
  ];

  var BEST_KEY = 'daniland.best.town';       // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.townAct';          // 마지막에 고른 놀이

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
    homeBtn: document.getElementById('homeBtn'),

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

  var home = findPlace('house');

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    round: 0,
    stars: 0,
    target: null,
    item: null,
    prompt: '',
    firstTry: true,
    locked: false,
    at: home,                          // 다니가 지금 서 있는 곳
    pos: { x: home.x, y: home.y },
    visited: {}                        // 구경하기에서 눌러 본 곳
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
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || 'Where is the bakery?'; } });
  });

  // 🏠 는 언제나 홈으로, '다른 놀이 고르기' 는 이 놀이가 들어 있는 과목 페이지로 갑니다.
  bindGo(el.homeBtn, 'index.html');
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
      if ((pages[i].href || '').indexOf('town.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
      }
    }
    return 'index.html';
  }

  function findPlace(id) {
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === id) return PLACES[i];
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
    var best = UI.readBest('daniland.best.town.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 지도 그리기 ---------- */

  function buildSpots() {
    PLACES.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'town-spot';
      b.style.left = p.box[0] + '%';
      b.style.top = p.box[1] + '%';
      b.style.width = p.box[2] + '%';
      b.style.height = p.box[3] + '%';
      b.addEventListener('click', function () { choose(b, p); });
      p.el = b;
      el.spots.appendChild(b);
    });
  }

  function clearSpots() {
    PLACES.forEach(function (p) {
      p.el.className = 'town-spot';
      var mark = p.el.querySelector('.mark');
      if (mark) mark.remove();
    });
  }

  // 지도는 정사각형이라 가로·세로 중 좁은 쪽에 맞춥니다. (스크롤이 생기면 안 됩니다)
  function fitMap() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;

    var top = el.map.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;

    var availH = screenH - top - toolsH - bottomPad - 6;
    var availW = el.map.parentNode.clientWidth;
    var size = Math.max(240, Math.min(availW, availH));

    el.map.style.width = size + 'px';
    el.map.style.height = size + 'px';
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitMap);
  window.addEventListener('orientationchange', function () { setTimeout(fitMap, 200); });

  /* ---------- 다니가 길을 따라 걷기 ---------- */

  function placeDani(x, y) {
    state.pos.x = x;
    state.pos.y = y;
    el.dani.style.left = x + '%';
    el.dani.style.top = y + '%';
  }

  // 지금 있는 곳에서 목적지까지 지나갈 자리들을 만듭니다.
  // 건물에서 옆 길로 나온 뒤, 길 위로만 다니다가 마지막에 건물 앞으로 들어갑니다.
  function route(from, to) {
    var pts = [];
    var yA = exitY(from.row, to.row);
    var yB = exitY(to.row, from.row);

    pts.push({ x: from.x, y: yA });

    // 줄이 멀리 떨어져 있으면(맨 윗줄 ↔ 맨 아랫줄) 세로 길로 갈아탑니다.
    if (yA !== yB) {
      var vx = nearRoadX((from.x + to.x) / 2);
      pts.push({ x: vx, y: yA });
      pts.push({ x: vx, y: yB });
    }

    pts.push({ x: to.x, y: yB });
    pts.push({ x: to.x, y: to.y });
    return pts;
  }

  // 그 줄의 건물이 나올 수 있는 가로 길
  function exitY(row, otherRow) {
    if (row === 1) return ROAD_Y[0];
    if (row === 3) return ROAD_Y[1];
    return otherRow >= 3 ? ROAD_Y[1] : ROAD_Y[0];
  }

  function nearRoadX(x) {
    var best = ROAD_X[0];
    for (var i = 1; i < ROAD_X.length; i++) {
      if (Math.abs(ROAD_X[i] - x) < Math.abs(best - x)) best = ROAD_X[i];
    }
    return best;
  }

  // 걸어가고, 다 걸으면 done 을 부릅니다.
  function walkTo(place, done) {
    // 이미 그 앞에 서 있으면 걸을 것이 없습니다 (같은 곳을 다시 누른 경우)
    if (place === state.at) {
      if (done) done();
      return;
    }

    var pts = route(state.at, place);
    var i = 0;

    el.dani.classList.add('walking');
    step(state.pos.x, state.pos.y);

    function step(fromX, fromY) {
      if (i >= pts.length) {
        el.dani.classList.remove('walking');
        state.at = place;
        if (done) done();
        return;
      }

      var p = pts[i++];
      var dx = p.x - fromX;
      var dy = p.y - fromY;
      var dur = Math.max(150, Math.round(Math.sqrt(dx * dx + dy * dy) * 9));

      el.dani.style.transitionDuration = dur + 'ms';
      placeDani(p.x, p.y);
      setTimeout(function () { step(p.x, p.y); }, dur);
    }
  }

  // 걸어갈 시간을 미리 알아야 다음 문제로 넘어갈 때를 정할 수 있습니다.
  function walkTime(place) {
    if (place === state.at) return 0;

    var pts = route(state.at, place);
    var x = state.pos.x;
    var y = state.pos.y;
    var total = 0;

    pts.forEach(function (p) {
      var dx = p.x - x;
      var dy = p.y - y;
      total += Math.max(150, Math.round(Math.sqrt(dx * dx + dy * dy) * 9));
      x = p.x;
      y = p.y;
    });
    return total;
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

    if (state.act === 'look') {
      el.bar.style.width = '0%';
      el.score.textContent = '🔎 0/' + PLACES.length;
      el.speakBtn.hidden = true;
      el.questItem.hidden = true;
      el.questLabel.textContent = '건물을 눌러 보세요';
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
    state.item = (state.act === 'errand') ? pick(next.items) : null;

    if (state.act === 'errand') {
      state.prompt = state.item.say + ' Where do we go?';
      el.questItem.hidden = false;
      el.questItem.textContent = state.item.emoji;
      el.questLabel.textContent = '어디로 갈까요? (' + (state.round + 1) + '/' + ROUNDS + ')';
    } else {
      state.prompt = "Let's go to the " + next.word + '.';
      el.questItem.hidden = true;
      el.questLabel.textContent = '어디라고 했을까요? (' + (state.round + 1) + '/' + ROUNDS + ')';
    }

    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  // 같은 곳이 연달아 나오지 않게 합니다.
  function pickTarget() {
    var p = pick(PLACES);
    while (state.target && p.id === state.target.id) p = pick(PLACES);
    return p;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ---------- 눌렀을 때 ---------- */

  function choose(spot, place) {
    if (state.locked || spot.classList.contains('dim')) return;

    // 구경하기 — 틀릴 것이 없습니다. 누른 곳으로 걸어가서 이름을 알려 줍니다.
    if (state.act === 'look') return look(spot, place);

    if (place.id === state.target.id) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      spot.classList.add('correct');
      UI.addMark(spot, '⭕');
      UI.confettiAt(spot);

      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 맞히는 즉시 막대를 채웁니다. (마지막 문제에서 다 찬 모습을 볼 수 있게)
      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';

      el.questItem.hidden = false;
      el.questItem.textContent = place.icon;
      el.questLabel.textContent = place.word + ' · ' + place.ko;

      var walk = walkTime(place);
      walkTo(place, function () { speak("Let's go to the " + place.word + '!'); });

      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, walk + 1800);

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

  // 🔎 마을 구경하기
  function look(spot, place) {
    state.locked = true;
    if (window.SFX) SFX.tap();
    spot.classList.add('correct');

    el.questItem.hidden = false;
    el.questItem.textContent = place.icon;
    el.questLabel.textContent = place.word + ' · ' + place.ko;

    walkTo(place, function () {
      speak('This is the ' + place.word + '.');
      state.locked = false;
    });

    if (!state.visited[place.id]) {
      state.visited[place.id] = true;
      var n = countVisited();
      el.score.textContent = '🔎 ' + n + '/' + PLACES.length;
      el.bar.style.width = Math.round((n / PLACES.length) * 100) + '%';

      if (n === PLACES.length) {
        if (window.SFX) SFX.finish();
        showBanner('마을을 다 구경했어요! 🎉');
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
    UI.saveBest('daniland.best.town.' + state.act, state.stars, ROUNDS);
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
