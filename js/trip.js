/* =========================================================================
 * 다니랜드 - 할머니 섬 여행 (영어: Grandma's Island)
 *
 * 풍경 그림 한 장(trip.jpg) 위를 다니가 집 → 버스 정류장 → 기차역 → 부두 → 할머니 섬,
 * 그리고 하늘로 집까지 여행합니다. 구간마다 땅(길·철길·바다·하늘)이 다르니
 * 어떤 탈것을 타야 하는지는 그림을 보면 알 수 있습니다 — 찍는 놀이가 아닙니다.
 *
 * 놀이 2가지 (시작 화면에서 고릅니다)
 *   ride : 탈것 여행   - "How do you get there?" 를 듣고 그 구간에 맞는 탈것을 고릅니다 (4문제)
 *   care : 다니 돌보기 - 탈것 여행에 더해, 여행 중 다니가 목마르고 졸리고 배고파집니다.
 *                        "Are you thirsty?" 를 골라 물어보면 다니가 "Yes, I am!" 하고,
 *                        "Have a drink." 를 골라 주면 다니가 낫습니다 (4 + 3×2 = 10문제)
 *
 * 문장은 수업에서 배운 그대로입니다:
 *   How do you get there? / We go by ___.
 *   Are you thirsty? / Yes, I am. / Have a drink.   (sleepy → Get some sleep, hungry → Have some food)
 *
 * 좌표는 모두 그림 기준 백분율(%)입니다. 그림을 바꾸면 STOPS · LEGS 의 path 와
 * GRANDMA, 그리고 MAP_RATIO(가로÷세로)를 다시 재야 합니다.
 * ========================================================================= */

(function () {
  var LANG = 'en-US';
  var MAP_RATIO = 1951 / 806;   // trip.jpg 의 가로÷세로. 그림을 바꾸면 이 값도 바꿔야 합니다.
  var MAX_CARDS = 720;          // 보기 카드 줄의 최대 너비 (css 의 .trip-cards max-width 와 같은 값)
  var ZOOM = 1.5;               // 창보다 그림을 이만큼 크게 그리고, camera() 가 다니를 따라 움직입니다
  var MIN_VIEW_H = 280;         // 폰에서 창이 이보다 납작해지면 창을 이 높이로 세웁니다 (그림이 옆으로 더 넘칩니다)
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* -------------------------------------------------------------------------
   * 탈것 — kind 가 어느 땅을 다니는지입니다 (road 길 · rail 철길 · sea 바다 · sky 하늘).
   * 문제마다 네 땅에서 하나씩 뽑아 보기 넉 장을 만드니, 아이는 '여긴 바다니까 배!' 하고
   * 땅을 보고 고르게 됩니다. 같은 땅의 탈것은 한 문제에 하나만 나옵니다.
   * ---------------------------------------------------------------------- */
  var VEHICLES = [
    { emoji: '🚌', word: 'bus',        ko: '버스',     kind: 'road' },
    { emoji: '🚗', word: 'car',        ko: '자동차',   kind: 'road' },
    { emoji: '🚕', word: 'taxi',       ko: '택시',     kind: 'road' },
    { emoji: '🚲', word: 'bike',       ko: '자전거',   kind: 'road' },
    { emoji: '🚂', word: 'train',      ko: '기차',     kind: 'rail' },
    { emoji: '⛵', word: 'boat',       ko: '보트',     kind: 'sea'  },
    { emoji: '🚢', word: 'ship',       ko: '배',       kind: 'sea'  },
    { emoji: '✈️', word: 'plane',      ko: '비행기',   kind: 'sky'  },
    { emoji: '🚁', word: 'helicopter', ko: '헬리콥터', kind: 'sky'  }
  ];

  var KINDS = ['road', 'rail', 'sea', 'sky'];

  /* -------------------------------------------------------------------------
   * 다니가 서는 자리들 (그림 기준 %)
   * ---------------------------------------------------------------------- */
  var STOPS = {
    home:    { x: 9,    y: 85, word: 'home' },
    busStop: { x: 21.5, y: 80, word: 'the bus stop' },
    rail:    { x: 42.5, y: 93 },                          // 길이 끝나고 철길이 시작되는 곳
    station: { x: 49.5, y: 83, word: 'the train station' },
    pier:    { x: 61,   y: 84, word: 'the pier' },
    island:  { x: 83.5, y: 71.5, word: "Grandma's island" }   // 집을 가리지 않게 섬 왼쪽 모래밭에 섭니다
  };

  // 할머니가 서 계신 곳 (섬의 집 앞)
  var GRANDMA = { x: 92.5, y: 67.5 };

  /* -------------------------------------------------------------------------
   * 여행 구간 — 순서대로 갑니다.
   *   kind : 이 구간의 땅 (정답 탈것의 kind)
   *   to   : 도착하는 곳 (STOPS 의 이름) — "Let's go to ___." 에 씁니다
   *   path : 지나가는 자리들. 마지막이 도착 자리입니다.
   *   walk : 탈것에서 내려 걸어가는 자리들 (없어도 됩니다)
   *   say  : 도착지 대신 들려줄 말 (집으로 갈 때)
   * ---------------------------------------------------------------------- */
  var LEGS = [
    { kind: 'road', to: 'station',
      path: [[24, 86], [28, 91], [34, 94], [42.5, 93]] },
    { kind: 'rail', to: 'pier',
      path: [[45, 89], [47.5, 86], [49.5, 83]],
      walk: [[55, 84], [61, 84]] },
    { kind: 'sea',  to: 'island',
      path: [[66, 82], [72, 79], [79, 75], [83.5, 71.5]] },
    { kind: 'sky',  to: 'home', say: 'Time to go home!',
      path: [[76, 45], [60, 32], [30, 32], [12, 55], [9, 85]] }
  ];

  /* -------------------------------------------------------------------------
   * 다니 돌보기 — 여행 중 다니가 이렇게 됩니다.
   *   face : 다니 머리 위 말풍선에 뜨는 얼굴
   *   ask  : 아이가 골라서 물어보는 말        fix : 아이가 골라서 해 주는 말
   * ---------------------------------------------------------------------- */
  var NEEDS = [
    { id: 'thirsty', face: '🥵', ask: 'Are you thirsty?', askKo: '목말라?',  fix: 'Have a drink.',    fixKo: '마셔요',    item: '🥤' },
    { id: 'sleepy',  face: '😴', ask: 'Are you sleepy?',  askKo: '졸려?',    fix: 'Get some sleep.',  fixKo: '자요',      item: '🛏️' },
    { id: 'hungry',  face: '🤤', ask: 'Are you hungry?',  askKo: '배고파?',  fix: 'Have some food.',  fixKo: '먹어요',    item: '🍚' }
  ];

  var ACTS = [
    { id: 'ride', name: '탈것 여행',   icon: '🚌', desc: '어떻게 갈지 탈것을 골라요' },
    { id: 'care', name: '다니 돌보기', icon: '💛', desc: '가는 길에 목마르고 졸린 다니를 돌봐 줘요' }
  ];

  var BEST_KEY = 'daniland.best.trip';       // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.tripAct';          // 마지막에 고른 놀이

  var el = {
    map: document.getElementById('map'),
    scene: document.getElementById('scene'),
    dani: document.getElementById('dani'),
    daniImg: document.getElementById('daniImg'),
    bubble: document.getElementById('bubble'),
    ride: document.getElementById('ride'),
    grandma: document.getElementById('grandma'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    say: document.getElementById('say'),
    hint: document.getElementById('hint'),
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

  var state = {
    act: UI.loadValue(ACT_KEY) || 'ride',
    steps: [],                         // 이번 여행에서 할 일들 (차례대로)
    step: null,
    round: 0,                          // 몇 문제째인지
    total: 0,                          // 이번 판의 문제 수
    stars: 0,
    prompt: '',
    firstTry: true,
    locked: false,
    pos: { x: STOPS.home.x, y: STOPS.home.y }
  };

  if (!findAct(state.act)) state.act = 'ride';

  var view = { w: 0, h: 0, sceneW: 0, sceneH: 0 };   // 창과 그림의 크기 (fitMap 이 정하고 camera 가 씁니다)

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildModeRow();
  placeDani(STOPS.home.x, STOPS.home.y);
  el.grandma.style.left = GRANDMA.x + '%';
  el.grandma.style.top = GRANDMA.y + '%';
  fitMap();

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    fitMap();
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  el.speakBtn.addEventListener('click', speakPrompt);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || 'How do you get there?'; } });
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
      if ((pages[i].href || '').indexOf('trip.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
      }
    }
    return 'index.html';
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

  function bestText(act) {
    var best = UI.readBest('daniland.best.trip.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 창 크기 맞추기 ----------
   * 창(.trip-map)은 그림 비율(2.4:1)로 가로에 맞추고, 태블릿 가로처럼 낮은 화면에서는
   * 아래 보기 카드 자리를 뺀 세로에 맞춥니다. (스크롤이 생기면 안 됩니다)
   * 폰(390px)에서는 그 비율대로면 148px 짜리 띠가 되어, 창을 MIN_VIEW_H 높이로 세웁니다.
   * 그림(.trip-scene)은 창보다 ZOOM 배 크게 그리고 camera() 가 다니를 따라 가로·세로로 움직입니다 —
   * 땅에 있을 때는 하늘이 잘려 나가고, 비행기를 타면 카메라가 위로 올라갑니다. */
  function fitMap() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;

    var box = el.map.parentNode;
    var boxStyle = getComputedStyle(box);
    var availW = box.clientWidth - px(boxStyle.paddingLeft) - px(boxStyle.paddingRight);

    var top = el.map.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;

    var availH = screenH - top - cardsReserve(availW) - toolsH - bottomPad - 6;
    var w = Math.max(240, Math.min(availW, availH * MAP_RATIO));
    var h = Math.round(w / MAP_RATIO);

    // 폰: 창을 세워서 다니가 콩알만 해지지 않게 합니다
    if (h < MIN_VIEW_H) h = Math.round(Math.max(h, Math.min(MIN_VIEW_H, availH)));

    view.w = w;
    view.h = h;
    view.sceneH = Math.round(h * ZOOM);
    view.sceneW = Math.round(view.sceneH * MAP_RATIO);
    el.map.style.width = w + 'px';
    el.map.style.height = h + 'px';
    el.scene.style.width = view.sceneW + 'px';
    el.scene.style.height = view.sceneH + 'px';
    el.scene.style.fontSize = Math.round(view.sceneW / 22) + 'px';
    camera(0);
  }


  // 다니가 창 가운데(세로로는 조금 아래)에 오도록 그림을 밉니다. 그림 끝에서는 멈추고,
  // 다니와 같은 시간 동안 움직여 다니가 창 안에서 미끄러지지 않습니다.
  function camera(dur) {
    var daniX = view.sceneW * state.pos.x / 100;
    var daniY = view.sceneH * state.pos.y / 100;
    var offX = clamp(daniX - view.w / 2, 0, view.sceneW - view.w);
    var offY = clamp(daniY - view.h * 0.62, 0, view.sceneH - view.h);
    el.scene.style.transitionDuration = dur + 'ms';
    el.scene.style.transform = 'translate(' + (-Math.round(offX)) + 'px, ' + (-Math.round(offY)) + 'px)';
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // 보기 카드가 차지할 세로 길이를 미리 뺍니다 — 문제마다 카드 모양이 달라도
  // 그림 크기가 들썩이지 않게, 이 놀이에서 제일 큰 경우로 잡습니다.
  function cardsReserve(availW) {
    var wide = Math.min(availW, MAX_CARDS);
    var gap = 10;
    var cols = wide >= 600 ? 4 : 2;
    var cardW = (wide - gap * (cols - 1)) / cols;
    var vehicles = (4 / cols) * Math.round(cardW * 2 / 3) + (4 / cols - 1) * gap;

    var h = vehicles;
    if (state.act === 'care') {
      var rows = wide >= 600 ? 1 : 3;
      h = Math.max(h, rows * 72 + (rows - 1) * gap);
    }
    return h + 14;   // .trip-cards 의 margin-top
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitMap);
  window.addEventListener('orientationchange', function () { setTimeout(fitMap, 200); });

  /* ---------- 다니 움직이기 ---------- */

  function placeDani(x, y, dur) {
    state.pos.x = x;
    state.pos.y = y;
    el.dani.style.transitionDuration = (dur || 0) + 'ms';
    el.dani.style.left = x + '%';
    el.dani.style.top = y + '%';
    camera(dur || 0);
  }

  // 자리들을 차례로 지나갑니다. vehicle 이 있으면 타고, 없으면 걷습니다.
  function travel(pts, vehicle, done) {
    var i = 0;

    if (vehicle) {
      el.ride.textContent = vehicle.emoji;
      el.dani.classList.add('riding');
      if (vehicle.kind === 'sky') el.dani.classList.add('flying');
    } else {
      el.dani.classList.add('walking');
    }

    step(state.pos.x, state.pos.y);

    function step(fromX, fromY) {
      if (i >= pts.length) {
        el.dani.classList.remove('riding', 'flying', 'walking');
        el.ride.textContent = '';
        if (done) done();
        return;
      }

      var p = pts[i++];
      var dur = legTime(fromX, fromY, p[0], p[1], vehicle);
      placeDani(p[0], p[1], dur);
      setTimeout(function () { step(p[0], p[1]); }, dur);
    }
  }

  // 걸을 때보다 탈것이 빠르고, 하늘은 멀리 도니 조금 더 빠릅니다.
  function legTime(x1, y1, x2, y2, vehicle) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var per = !vehicle ? 60 : (vehicle.kind === 'sky' ? 28 : 55);
    return Math.max(150, Math.round(Math.sqrt(dx * dx + dy * dy) * per));
  }

  // 다니 머리 위 말풍선
  function bubble(text) {
    if (!text) {
      el.bubble.hidden = true;
      return;
    }
    el.bubble.textContent = text;
    el.bubble.hidden = false;
    el.bubble.classList.remove('pop');
    void el.bubble.offsetWidth;   // 애니메이션을 처음부터 다시 돌립니다
    el.bubble.classList.add('pop');
  }

  /* ---------- 여행 짜기 ----------
   * 한 판은 할 일의 차례입니다. 돌보기는 역에 내렸을 때 한 번, 할머니 댁에서 두 번 —
   * 세 가지(목마름·졸림·배고픔)가 한 판에 꼭 한 번씩, 순서는 매번 다르게 나옵니다. */
  function planTrip() {
    var steps = [];
    var needs = UI.shuffle(NEEDS.slice());
    var care = (state.act === 'care');

    steps.push({ type: 'walk', to: 'busStop', path: [[14, 86], [21.5, 80]], say: "Let's go to Grandma's island!" });
    steps.push({ type: 'leg', leg: LEGS[0] });
    steps.push({ type: 'leg', leg: LEGS[1] });
    if (care) pushCare(steps, needs[0]);
    steps.push({ type: 'leg', leg: LEGS[2] });
    steps.push({ type: 'greet' });
    if (care) { pushCare(steps, needs[1]); pushCare(steps, needs[2]); }
    steps.push({ type: 'leg', leg: LEGS[3] });
    steps.push({ type: 'end' });

    return steps;
  }

  function pushCare(steps, need) {
    steps.push({ type: 'ask', need: need });
    steps.push({ type: 'give', need: need });
  }

  function countQuestions(steps) {
    var n = 0;
    steps.forEach(function (s) { if (s.type === 'leg' || s.type === 'ask' || s.type === 'give') n++; });
    return n;
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.steps = planTrip();
    state.total = countQuestions(state.steps);
    state.round = 0;
    state.stars = 0;
    state.locked = true;
    state.prompt = '';

    el.cards.innerHTML = '';
    el.grandma.classList.remove('wave');
    bubble('');
    updateScore();
    el.bar.style.width = '0%';

    // 지난 판에 집이 아닌 곳에서 끝났을 리는 없지만, 혹시 몰라 집에서 시작합니다.
    placeDani(STOPS.home.x, STOPS.home.y);

    setTimeout(nextStep, 300);
  }

  function nextStep() {
    var s = state.steps.shift();
    state.step = s;
    if (!s) return;

    if (s.type === 'walk')  return doWalk(s);
    if (s.type === 'leg')   return askLeg(s);
    if (s.type === 'greet') return doGreet();
    if (s.type === 'ask')   return askNeed(s);
    if (s.type === 'give')  return askGive(s);
    if (s.type === 'end')   return finish();
  }

  // 문제가 나올 때마다 부릅니다.
  function beginQuestion(sayText, hintText) {
    state.firstTry = true;
    state.locked = false;
    state.prompt = sayText;
    el.say.textContent = sayText;
    el.hint.textContent = hintText + ' (' + (state.round + 1) + '/' + state.total + ')';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = Math.round((state.round / state.total) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  // 맞혔을 때 — 별을 주고 막대를 채웁니다.
  function scoreQuestion() {
    if (state.firstTry) { state.stars += 1; updateScore(); }
    el.bar.style.width = Math.round(((state.round + 1) / state.total) * 100) + '%';
    state.round += 1;
  }

  function missed(card) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
  }

  /* 🚶 집에서 정류장까지는 걸어갑니다 (문제 없음) */
  function doWalk(s) {
    state.locked = true;
    el.cards.innerHTML = '';
    el.speakBtn.hidden = true;
    el.say.textContent = s.say;
    el.hint.textContent = '할머니 섬으로 떠나요!';
    speak(s.say);
    travel(s.path, null, function () { setTimeout(nextStep, 400); });
  }

  /* 🚌 구간 — 탈것 고르기 */
  function askLeg(s) {
    var leg = s.leg;
    var to = STOPS[leg.to];
    var lead = leg.say || ("Let's go to " + to.word + '.');

    el.cards.innerHTML = '';
    el.cards.className = 'cards trip-cards';

    var picks = pickVehicles();
    picks.forEach(function (v) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = '<div class="art">' + v.emoji + '</div>' +
                    '<div class="word">' + v.word + '</div>';
      b.addEventListener('click', function () { chooseVehicle(b, v, leg); });
      el.cards.appendChild(b);
    });

    beginQuestion(lead + ' How do you get there?', '어떻게 갈까요?');
  }

  // 네 땅에서 하나씩 — 정답 땅의 탈것도 여럿 중 하나를 골라 매번 달라집니다.
  function pickVehicles() {
    var picks = KINDS.map(function (k) {
      var pool = VEHICLES.filter(function (v) { return v.kind === k; });
      return pool[Math.floor(Math.random() * pool.length)];
    });
    return UI.shuffle(picks);
  }

  function chooseVehicle(card, v, leg) {
    if (state.locked || card.classList.contains('dim')) return;

    if (v.kind !== leg.kind) {
      missed(card);
      setTimeout(speakPrompt, 700);
      return;
    }

    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    scoreQuestion();

    var line = 'We go by ' + v.word + '!';
    el.say.textContent = line;
    el.hint.textContent = v.ko + '를 타고 가요';
    state.prompt = line;
    speak(line);

    setTimeout(function () {
      travel(leg.path, v, function () {
        if (leg.walk) travel(leg.walk, null, function () { setTimeout(nextStep, 300); });
        else setTimeout(nextStep, 300);
      });
    }, 900);
  }

  /* 👵 할머니 댁에 도착 */
  function doGreet() {
    state.locked = true;
    el.cards.innerHTML = '';
    el.speakBtn.hidden = true;
    el.say.textContent = 'Hello, Grandma!';
    el.hint.textContent = '할머니 섬에 왔어요!';
    el.grandma.classList.add('wave');
    bubble('👋');
    if (window.SFX) SFX.correct();
    speak('Hello, Grandma!');
    setTimeout(function () { bubble(''); nextStep(); }, 2200);
  }

  /* 💛 다니가 어떤지 물어보기 — "Are you thirsty?" */
  function askNeed(s) {
    var need = s.need;
    bubble(need.face);

    el.cards.innerHTML = '';
    el.cards.className = 'cards trip-cards say-cards';

    UI.shuffle(NEEDS.slice()).forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = '<div class="art">' + n.face + '</div>' +
                    '<div class="text">' + n.ask + '</div>';
      b.addEventListener('click', function () { chooseAsk(b, n, need); });
      el.cards.appendChild(b);
    });

    beginQuestion('Look at Dani. Ask a question!', '다니한테 물어봐요');
  }

  function chooseAsk(card, n, need) {
    if (state.locked || card.classList.contains('dim')) return;

    state.locked = true;
    el.say.textContent = n.ask;
    state.prompt = n.ask;

    // 아이가 고른 말을 먼저 읽고, 다니가 대답합니다.
    speak(n.ask, function () {
      if (n.id === need.id) {
        if (window.SFX) SFX.correct();
        card.classList.add('correct');
        UI.addMark(card, '⭕');
        UI.confettiAt(card);
        scoreQuestion();
        el.say.textContent = 'Yes, I am!';
        el.hint.textContent = '응, ' + need.askKo.replace('?', '');
        state.prompt = 'Yes, I am!';
        speak('Yes, I am!');
        setTimeout(nextStep, 1800);
      } else {
        missed(card);
        el.say.textContent = "No, I'm not.";
        state.prompt = "No, I'm not.";
        speak("No, I'm not.", function () {
          state.locked = false;
          state.prompt = 'Look at Dani. Ask a question!';
          el.say.textContent = state.prompt;
        });
      }
    });
  }

  /* 💛 해 주기 — "Have a drink." */
  function askGive(s) {
    var need = s.need;

    el.cards.innerHTML = '';
    el.cards.className = 'cards trip-cards say-cards';

    UI.shuffle(NEEDS.slice()).forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = '<div class="art">' + n.item + '</div>' +
                    '<div class="text">' + n.fix + '</div>';
      b.addEventListener('click', function () { chooseGive(b, n, need); });
      el.cards.appendChild(b);
    });

    beginQuestion('What should Dani do?', '어떻게 해 줄까요?');
  }

  function chooseGive(card, n, need) {
    if (state.locked || card.classList.contains('dim')) return;

    state.locked = true;
    el.say.textContent = n.fix;
    state.prompt = n.fix;

    speak(n.fix, function () {
      if (n.id === need.id) {
        if (window.SFX) SFX.correct();
        card.classList.add('correct');
        UI.addMark(card, '⭕');
        UI.confettiAt(card);
        scoreQuestion();
        bubble(need.item);
        setTimeout(function () {
          bubble('😊');
          el.say.textContent = 'Thank you!';
          el.hint.textContent = '다니가 나았어요!';
          state.prompt = 'Thank you!';
          speak('Thank you!');
        }, 1200);
        setTimeout(function () { bubble(''); nextStep(); }, 3000);
      } else {
        missed(card);
        el.say.textContent = 'No, thank you.';
        state.prompt = 'No, thank you.';
        speak('No, thank you.', function () {
          state.locked = false;
          state.prompt = 'What should Dani do?';
          el.say.textContent = state.prompt;
        });
      }
    });
  }

  function finish() {
    state.locked = true;
    el.cards.innerHTML = '';
    el.bar.style.width = '100%';
    UI.saveBest('daniland.best.trip.' + state.act, state.stars, state.total);
    UI.saveBest(BEST_KEY, state.stars, state.total);

    el.endStars.textContent = UI.starLine(state.stars, state.total);
    el.endTitle.textContent = (state.stars === state.total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = state.total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 소리 · 화면 ---------- */

  function updateScore() {
    el.score.textContent = '⭐ ' + state.stars;
  }

  function speakPrompt() { speak(state.prompt); }

  // 다 읽으면 then 을 부릅니다. 소리를 못 내는 기기에서도 흐름이 끊기지 않게
  // 읽는 데 걸릴 만한 시간 뒤에는 꼭 한 번 부릅니다.
  function speak(text, then) {
    var called = false;
    function once() {
      if (called) return;
      called = true;
      el.speakBtn.classList.remove('speaking');
      if (then) then();
    }

    if (!text || !window.TTS || !TTS.supported) {
      setTimeout(once, 600);
      return;
    }

    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 900 + text.length * 90);
  }
})();
