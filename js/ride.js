/* =========================================================================
 * 다니랜드 - 탈것 타기 (영어: Get on the ___ / Get in the ___)
 *
 * 탈것 낱말(en-transport)을 배운 뒤 이어진 수업 — 탈것마다 '타다' 의 전치사가 다릅니다.
 *   get on  the bus / train / plane / ship / subway / bike …  올라타는 것
 *            (서서 걸어 다닐 만큼 큰 것, 또는 자전거·오토바이처럼 걸터앉는 것)
 *   get in  the car / taxi / truck / helicopter                 몸을 숙여 들어가 앉는 것
 * 내릴 때는 짝이 정해져 있습니다 — on ↔ off, in ↔ out of.
 *   get off the bus / get out of the car
 *
 * 길가 풍경(css 로 그림) 위에서 탈것이 오른쪽에서 와서 다니 옆에 서면, 아이가 on 인지 in 인지
 * 고릅니다. 맞히면 다니가 진짜로 그렇게 탑니다 — on 이면 위에 올라타고, in 이면 안에 들어가
 * 머리만 내밉니다 — 그리고 탈것이 왼쪽으로 떠납니다. 전치사의 뜻이 그림으로 보이는 것이 핵심입니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   prep : 타기        - "Get ___ the bus." 를 보고 on / in 두 장 중 고릅니다 (8문제)
 *   say  : 문장 고르기 - 탈것이 오면 문장 넉 장 중 맞는 것을 고릅니다
 *                        (Get on the bus. / Get in the bus. / Get on the car. / Get in the car.) (8문제)
 *   both : 타고 내리기 - on / in 으로 타고, 도착하면 off / out of 로 내립니다 (4대 × 2 = 8문제)
 *
 * 한 판에는 on 탈것과 in 탈것이 반씩(4 + 4) 나오도록 뽑습니다 — in 이 훨씬 드물어서
 * 그냥 섞으면 'on 만 누르면 거의 맞는' 놀이가 됩니다.
 * ========================================================================= */

(function () {
  var LANG = 'en-US';
  var STAND = 30;       // 다니가 서서 기다리는 자리 (풍경 가로의 %)
  var STOP = 62;        // 탈것이 와서 서는 자리
  var PER_PREP = 4;     // 한 판에 on · in 탈것을 몇 대씩 뽑는지 (타고 내리기는 절반)
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* -------------------------------------------------------------------------
   * 탈것 — prep 이 정답입니다. 낱말은 js/data.js 의 en-transport 와 같습니다.
   * 여기 없는 탈것: boat(작은 배는 in, 큰 배는 on 이라 갈립니다), rocket(수업에 안 나옴).
   * 수업에서 다른 탈것을 더 배우면 한 줄 더하면 됩니다.
   * ---------------------------------------------------------------------- */
  var RIDES = [
    { emoji: '🚌', word: 'bus',        ko: '버스',     prep: 'on' },
    { emoji: '🚂', word: 'train',      ko: '기차',     prep: 'on' },
    { emoji: '✈️', word: 'plane',      ko: '비행기',   prep: 'on' },
    { emoji: '🚢', word: 'ship',       ko: '배',       prep: 'on' },
    { emoji: '🚇', word: 'subway',     ko: '지하철',   prep: 'on' },
    { emoji: '🚲', word: 'bike',       ko: '자전거',   prep: 'on' },
    { emoji: '🏍️', word: 'motorcycle', ko: '오토바이', prep: 'on' },
    { emoji: '🛴', word: 'scooter',    ko: '킥보드',   prep: 'on' },
    { emoji: '🚗', word: 'car',        ko: '자동차',   prep: 'in' },
    { emoji: '🚕', word: 'taxi',       ko: '택시',     prep: 'in' },
    { emoji: '🚚', word: 'truck',      ko: '트럭',     prep: 'in' },
    { emoji: '🚁', word: 'helicopter', ko: '헬리콥터', prep: 'in' }
  ];

  /* -------------------------------------------------------------------------
   * 전치사 짝 — 탈 때(get)와 내릴 때(leave). why 는 틀렸을 때 보여 주는 까닭입니다.
   * ---------------------------------------------------------------------- */
  var PREPS = [
    { id: 'on', get: 'on', getKo: '올라타요',      leave: 'off',    leaveKo: '내려요',
      why: '서서 탈 만큼 크거나 걸터앉는 탈것은 올라타요 — on' },
    { id: 'in', get: 'in', getKo: '들어가 앉아요', leave: 'out of', leaveKo: '나와요',
      why: '몸을 숙여 들어가 앉는 탈것은 in' }
  ];

  var ACTS = [
    { id: 'prep', name: '타기',        icon: '🚏', desc: 'on 인지 in 인지 골라서 타요' },
    { id: 'say',  name: '문장 고르기', icon: '💬', desc: '탈것이 오면 맞는 문장을 골라요' },
    { id: 'both', name: '타고 내리기', icon: '🔁', desc: 'on · in 으로 타고, off · out of 로 내려요' }
  ];

  var BEST_KEY = 'daniland.best.ride';       // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.rideAct';          // 마지막에 고른 놀이

  var el = {
    scene: document.getElementById('scene'),
    trees: document.getElementById('trees'),
    car: document.getElementById('car'),
    dani: document.getElementById('dani'),
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
    act: UI.loadValue(ACT_KEY) || 'prep',
    steps: [],                         // 이번 판에서 할 일들 (차례대로)
    round: 0,                          // 몇 문제째인지
    total: 0,                          // 이번 판의 문제 수
    stars: 0,
    prompt: '',
    firstTry: true,
    locked: false,
    aboard: null                       // 다니가 타고 있으면 그 전치사('on' / 'in')
  };

  if (!findAct(state.act)) state.act = 'prep';

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildModeRow();
  buildTrees();
  placeDani(STAND, 0);
  placeCar(118, 0);
  fitScene();

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    fitScene();
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  el.speakBtn.addEventListener('click', speakPrompt);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || 'Get on the bus!'; } });
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

  // 이 페이지를 카드로 갖고 있는 과목·묶음을 data.js 에서 찾습니다.
  function backHref() {
    var pages = window.PAGES || [];

    for (var i = 0; i < pages.length; i++) {
      if ((pages[i].href || '').indexOf('ride.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject, pages[i].group);
      }
    }
    return 'index.html';
  }

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  function findPrep(id) {
    for (var i = 0; i < PREPS.length; i++) if (PREPS[i].id === id) return PREPS[i];
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
    var best = UI.readBest('daniland.best.ride.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 풍경 크기 맞추기 ----------
   * 풍경 높이는 화면에서 문장·카드·도구 줄을 뺀 나머지입니다 (스크롤이 생기면 안 됩니다).
   * 탈것 이모지·다니 크기는 풍경의 글자 크기(em)를 따라가므로 여기서 같이 정합니다. */
  function fitScene() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;

    var top = el.scene.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;

    var availH = screenH - top - cardsReserve() - toolsH - bottomPad - 6;
    var h = Math.round(Math.max(170, Math.min(360, availH)));
    el.scene.style.height = h + 'px';

    var w = el.scene.clientWidth;
    el.scene.style.fontSize = Math.round(Math.min(h * 0.38, w * 0.15)) + 'px';
  }

  // 보기 카드가 차지할 세로 길이를 미리 뺍니다 — 문제마다 카드 모양이 달라도
  // 풍경이 들썩이지 않게, 이 놀이에서 제일 큰 경우로 잡습니다.
  // (css 의 .prep-cards / .say-cards 카드 높이와 같은 값 — 폰에서는 문장 카드가 한 줄에 하나씩입니다)
  function cardsReserve() {
    var narrow = window.innerWidth < 600;
    var h = 104;
    if (state.act === 'say') h = narrow ? 4 * 64 + 3 * 10 : 2 * 76 + 10;
    return h + 14;   // .ride-cards 의 margin-top
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitScene);
  window.addEventListener('orientationchange', function () { setTimeout(fitScene, 200); });

  // 길가 나무·집 — 두 벌을 이어 붙여 두고 달릴 때 왼쪽으로 흘려보냅니다 (.moving)
  function buildTrees() {
    var row = '🌳🏠🌲🌳🏫🌳🌲🏪🌳🌲';
    el.trees.innerHTML = '<span>' + row + '</span><span>' + row + '</span>';
  }

  /* ---------- 다니 · 탈것 움직이기 ---------- */

  function placeDani(x, dur) {
    el.dani.style.transitionDuration = (dur || 0) + 'ms';
    el.dani.style.left = x + '%';
  }

  function placeCar(x, dur) {
    el.car.style.transitionDuration = (dur || 0) + 'ms';
    el.car.style.left = x + '%';
  }

  // 탈것이 오른쪽 밖에서 와서 다니 옆에 섭니다.
  function arrive(ride, done) {
    el.car.textContent = ride.emoji;
    placeCar(118, 0);
    void el.car.offsetWidth;   // 자리를 먼저 옮기고 나서 움직이게 합니다
    placeCar(STOP, 1000);
    setTimeout(done, 1100);
  }

  // 다니가 탑니다 — on 이면 위에 올라타고, in 이면 안에 들어가 머리만 내밉니다.
  function board(prep, done) {
    state.aboard = prep;
    el.dani.classList.add('hop');
    placeDani(STOP, 350);
    setTimeout(function () {
      el.dani.classList.remove('hop');
      el.dani.classList.add('aboard-' + prep);
      done();
    }, 380);
  }

  // 다니가 내려서 기다리던 자리로 갑니다.
  function alight(done) {
    state.aboard = null;
    el.dani.classList.remove('aboard-on', 'aboard-in');
    el.dani.classList.add('hop');
    placeDani(STAND, 350);
    setTimeout(function () {
      el.dani.classList.remove('hop');
      done();
    }, 380);
  }

  // 달립니다 — 길가가 흘러갑니다. away 면 탈것이 왼쪽으로 사라지고, 아니면 제자리에서 달립니다.
  function drive(away, done) {
    var dur = away ? 1200 : 1500;
    el.scene.classList.add('moving');
    if (away) {
      placeCar(-30, dur);
      if (state.aboard) placeDani(-30, dur);
    }
    setTimeout(function () {
      el.scene.classList.remove('moving');
      done();
    }, dur + 100);
  }

  // 탈것과 함께 사라진 다니를 기다리던 자리에 다시 세웁니다.
  function resetDani() {
    state.aboard = null;
    el.dani.classList.remove('aboard-on', 'aboard-in');
    placeDani(STAND, 0);
    el.dani.classList.remove('pop');
    void el.dani.offsetWidth;
    el.dani.classList.add('pop');
  }

  /* ---------- 한 판 짜기 ----------
   * on 탈것과 in 탈것을 같은 수만큼 뽑아 섞습니다. 타고 내리기는 탈것마다 문제가 둘이라 절반만 뽑습니다. */
  function planGame() {
    var both = (state.act === 'both');
    var n = both ? PER_PREP / 2 : PER_PREP;
    var rides = [];

    PREPS.forEach(function (p) {
      var pool = UI.shuffle(RIDES.filter(function (r) { return r.prep === p.id; }));
      rides = rides.concat(pool.slice(0, n));
    });
    UI.shuffle(rides);

    var steps = [];
    rides.forEach(function (r) {
      steps.push({ type: 'board', ride: r });
      if (both) steps.push({ type: 'alight', ride: r });
    });
    steps.push({ type: 'end' });
    return steps;
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.steps = planGame();
    state.total = state.steps.length - 1;
    state.round = 0;
    state.stars = 0;
    state.locked = true;
    state.prompt = '';

    el.cards.innerHTML = '';
    el.say.textContent = '';
    el.hint.textContent = '';
    updateScore();
    el.bar.style.width = '0%';

    resetDani();
    placeCar(118, 0);

    setTimeout(nextStep, 300);
  }

  function nextStep() {
    var s = state.steps.shift();
    if (!s) return;

    if (s.type === 'board')  return doArrive(s);
    if (s.type === 'alight') return askAlight(s);
    if (s.type === 'end')    return finish();
  }

  // 문제가 나올 때마다 부릅니다. shown 은 화면에 쓰는 글(빈칸), spoken 은 읽어 주는 말입니다.
  function beginQuestion(shown, spoken, hintText) {
    state.firstTry = true;
    state.locked = false;
    state.prompt = spoken;
    el.say.textContent = shown;
    el.hint.textContent = hintText + ' (' + (state.round + 1) + '/' + state.total + ')';
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = Math.round((state.round / state.total) * 100) + '%';
    setTimeout(speakPrompt, 300);
  }

  // 맞혔을 때 — 별을 주고 막대를 채웁니다.
  function scoreQuestion(card) {
    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    el.bar.style.width = Math.round(((state.round + 1) / state.total) * 100) + '%';
    state.round += 1;
  }

  // 틀렸을 때 — 카드를 흐리게 남기고 까닭을 보여 준 뒤 다시 들려줍니다.
  function missed(card, why) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    if (why) el.hint.textContent = why;
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
    setTimeout(speakPrompt, 700);
  }

  /* 🚏 탈것이 옵니다 */
  function doArrive(s) {
    state.locked = true;
    el.cards.innerHTML = '';
    el.speakBtn.hidden = true;
    el.say.textContent = 'Here comes the ' + s.ride.word + '!';
    el.hint.textContent = s.ride.ko + '가 와요';
    speak('Here comes the ' + s.ride.word + '!');
    arrive(s.ride, function () {
      if (state.act === 'say') askSay(s.ride);
      else askPrep(s.ride);
    });
  }

  /* 🚏 타기 — on / in 두 장 */
  function askPrep(ride) {
    el.cards.innerHTML = '';
    el.cards.className = 'cards ride-cards prep-cards';

    PREPS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'choice prep-card';
      b.innerHTML = '<div class="big">' + p.get + '</div>' +
                    '<div class="ko">' + p.getKo + '</div>';
      b.addEventListener('click', function () { choosePrep(b, p, ride); });
      el.cards.appendChild(b);
    });

    beginQuestion('Get ___ the ' + ride.word + '.', 'Get on, or get in?', ride.ko + '에 어떻게 탈까요?');
  }

  function choosePrep(card, p, ride) {
    if (state.locked || card.classList.contains('dim')) return;

    if (p.id !== ride.prep) {
      missed(card, ride.emoji + ' ' + findPrep(ride.prep).why);
      return;
    }

    scoreQuestion(card);
    afterBoard(ride, p);
  }

  /* 💬 문장 고르기 — 이 탈것과 반대쪽 탈것 하나로 문장 넉 장을 만듭니다 (맞는 건 하나) */
  function askSay(ride) {
    el.cards.innerHTML = '';
    el.cards.className = 'cards ride-cards say-cards';

    var others = RIDES.filter(function (r) { return r.prep !== ride.prep; });
    var other = others[Math.floor(Math.random() * others.length)];
    var options = [];

    [ride, other].forEach(function (r) {
      PREPS.forEach(function (p) {
        options.push({ ride: r, prep: p, text: 'Get ' + p.get + ' the ' + r.word + '.' });
      });
    });

    UI.shuffle(options).forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice say-card';
      b.innerHTML = '<div class="text">' + o.text + '</div>';
      b.addEventListener('click', function () { chooseSay(b, o, ride); });
      el.cards.appendChild(b);
    });

    beginQuestion('Here comes the ' + ride.word + '!',
                  'Here comes the ' + ride.word + '! What do you say?',
                  '뭐라고 말할까요?');
  }

  function chooseSay(card, o, ride) {
    if (state.locked || card.classList.contains('dim')) return;

    if (o.ride !== ride) {
      missed(card, '온 건 ' + ride.emoji + ' ' + ride.word + ' 예요');
      return;
    }
    if (o.prep.id !== ride.prep) {
      missed(card, ride.emoji + ' ' + findPrep(ride.prep).why);
      return;
    }

    scoreQuestion(card);
    afterBoard(ride, o.prep);
  }

  // 맞혔으면 문장을 들려주고 다니가 탑니다. 내리기가 이어지면 제자리에서 달리고, 아니면 떠납니다.
  function afterBoard(ride, p) {
    var line = 'Get ' + p.get + ' the ' + ride.word + '!';
    el.say.textContent = line;
    el.hint.textContent = ride.ko + '에 ' + p.getKo;
    state.prompt = line;
    speak(line);

    setTimeout(function () {
      board(p.id, function () {
        var next = state.steps[0];
        setTimeout(function () {
          if (next && next.type === 'alight') {
            drive(false, nextStep);
          } else {
            drive(true, function () { resetDani(); setTimeout(nextStep, 300); });
          }
        }, 700);
      });
    }, 700);
  }

  /* 🔁 내리기 — off / out of 두 장 */
  function askAlight(s) {
    var ride = s.ride;
    el.cards.innerHTML = '';
    el.cards.className = 'cards ride-cards prep-cards';

    PREPS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'choice prep-card';
      b.innerHTML = '<div class="big">' + p.leave + '</div>' +
                    '<div class="ko">' + p.leaveKo + '</div>';
      b.addEventListener('click', function () { chooseAlight(b, p, ride); });
      el.cards.appendChild(b);
    });

    beginQuestion('Get ___ the ' + ride.word + '.',
                  "We're here! Get off, or get out of?",
                  '다 왔어요! 어떻게 내릴까요?');
  }

  function chooseAlight(card, p, ride) {
    if (state.locked || card.classList.contains('dim')) return;

    if (p.id !== ride.prep) {
      var right = findPrep(ride.prep);
      missed(card, ride.emoji + ' ' + right.get + ' 으로 탔으니 ' + right.leave + ' 로 내려요');
      return;
    }

    scoreQuestion(card);

    var line = 'Get ' + p.leave + ' the ' + ride.word + '!';
    el.say.textContent = line;
    el.hint.textContent = ride.ko + '에서 ' + p.leaveKo;
    state.prompt = line;
    speak(line);

    setTimeout(function () {
      alight(function () {
        setTimeout(function () {
          drive(true, function () { setTimeout(nextStep, 300); });
        }, 500);
      });
    }, 700);
  }

  function finish() {
    state.locked = true;
    el.cards.innerHTML = '';
    el.bar.style.width = '100%';
    UI.saveBest('daniland.best.ride.' + state.act, state.stars, state.total);
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
