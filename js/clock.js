/* =========================================================================
 * 다니랜드 - 시계 공부 (clock.html)
 *
 * 바늘 시계 하나가 곧 교구라서(짧은 바늘=시, 긴 바늘=분) 낱말 카드에도 numbers.html 의
 * 보기 넉 장에도 안 담깁니다. 백 판처럼 따로 만든 화면이고, 수학의 '시계' 묶음 카드 넉 장이
 * 이 화면 하나를 ?act= 로 나눠 씁니다 (numbers.html 과 같은 얼개 — 시작 화면에는 단계만 나옵니다).
 *
 * 놀이 4가지
 *   read    : 시계 읽기     - 바늘 시계를 보고 '3시 30분' 글자 카드 넉 장에서 고릅니다.
 *   set     : 바늘 맞추기   - '4시 30분' 을 듣고 바늘을 손가락으로 돌려 맞춘 뒤 ✔ 를 누릅니다.
 *   digital : 디지털 짝     - 바늘 시계 ↔ 디지털 시계(4:30)의 짝을 찾습니다. 문제마다 방향이 바뀝니다
 *                             (바늘 시계를 보고 디지털 카드 고르기 / 디지털을 보고 바늘 시계 카드 고르기).
 *   routine : 하루 일과     - 시계와 '아침·낮·저녁·밤' 을 보고 그때 무엇을 하는지 고릅니다.
 *                             같은 7시라도 아침이면 일어나고 저녁이면 목욕해요 — 바늘은 하루에 두 바퀴 돕니다.
 *
 * 단계 (읽기·맞추기·디지털) : 정각 → 30분 → 5분 단위.  하루 일과는 단계가 없습니다.
 *
 * ⚠️ 짧은 바늘은 분에 따라 같이 움직입니다 — 3시 30분이면 3 과 4 사이 한가운데입니다.
 *    진짜 시계가 그렇고, '3시 55분을 4시 55분으로 읽는' 흔한 실수가 여기서 나옵니다.
 *    보기 좋으라고 짧은 바늘을 숫자에 딱 붙이지 마세요. 바늘 맞추기도 같은 이유로
 *    긴 바늘을 돌리면 짧은 바늘이 따라 돕니다 (톱니로 이어진 교구 시계처럼).
 *
 * ⚠️ 틀린 보기는 아이가 실제로 헷갈리는 쪽에서 고릅니다 (confusions()) — 짧은 바늘을 다음
 *    숫자로 읽기, 긴 바늘이 가리키는 숫자를 그대로 분으로 읽기(3시 25분 → 3시 5분),
 *    두 바늘 바꿔 읽기. 그리고 모두 그 단계의 눈금(정각·30분·5분)에 맞춥니다 — 정각 단계에
 *    '3시 30분' 이 보기로 나오면 읽지 않아도 지울 수 있습니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var MAX_CLOCK = 560;                       // 시계 최대 크기
  var MIN_CLOCK = 180;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  // 단계 값은 '분 눈금' 입니다 (60 = 정각만, 30 = 정각·30분, 5 = 5분마다).
  var LEVELS = [60, 30, 5];
  var LEVEL_NAMES = ['정각', '30분', '5분 단위'];

  var ACTS = [
    { id: 'read',    name: '시계 읽기',   icon: '🕒', desc: '시계를 보고 몇 시인지 골라요', levels: LEVELS, def: 60 },
    { id: 'set',     name: '바늘 맞추기', icon: '👆', desc: '바늘을 돌려서 시각을 맞춰요', levels: LEVELS, def: 60 },
    { id: 'digital', name: '디지털 짝',   icon: '📟', desc: '바늘 시계와 디지털 시계의 짝을 찾아요', levels: LEVELS, def: 60 },
    { id: 'routine', name: '하루 일과',   icon: '🌞', desc: '시계를 보고 그때 무엇을 하는지 골라요', levels: [], def: 0 }
  ];

  // 하루 일과 — h 는 24시간(하루 중 언제인지 가르려고), 시계에는 12시간으로 그립니다.
  // 같은 시계 모양이 아침·저녁에 한 번씩 오는 짝(7시 일어나기 ↔ 7시 목욕, 8시 아침 ↔ 8시 책,
  // 9시 유치원 ↔ 9시 잠)을 일부러 넣었습니다 — 보기에 짝이 같이 나오면 '아침·밤' 을 봐야 풉니다.
  var ROUTINE = [
    { h: 7,  m: 0,  emoji: '🥱', label: '일어나요',       say: '일어나요' },
    { h: 7,  m: 30, emoji: '🪥', label: '이를 닦아요',    say: '이를 닦아요' },
    { h: 8,  m: 0,  emoji: '🍚', label: '아침을 먹어요',  say: '아침을 먹어요' },
    { h: 9,  m: 0,  emoji: '🎒', label: '유치원에 가요',  say: '유치원에 가요' },
    { h: 12, m: 0,  emoji: '🍱', label: '점심을 먹어요',  say: '점심을 먹어요' },
    { h: 15, m: 0,  emoji: '🍪', label: '간식을 먹어요',  say: '간식을 먹어요' },
    { h: 16, m: 0,  emoji: '🛝', label: '놀이터에서 놀아요', say: '놀이터에서 놀아요' },
    { h: 18, m: 0,  emoji: '🍝', label: '저녁을 먹어요',  say: '저녁을 먹어요' },
    { h: 19, m: 0,  emoji: '🛁', label: '목욕해요',       say: '목욕해요' },
    { h: 20, m: 0,  emoji: '📚', label: '책을 읽어요',    say: '책을 읽어요' },
    { h: 21, m: 0,  emoji: '😴', label: '잠을 자요',      say: '잠을 자요' }
  ];

  var act = findAct(UI.getParam('act')) || ACTS[0];
  var BEST_KEY = 'daniland.best.clock.' + act.id;
  var LEVEL_KEY = 'daniland.clock.' + act.id;

  var el = {
    stage: document.getElementById('stage'),
    face: document.getElementById('face'),
    digital: document.getElementById('digital'),
    period: document.getElementById('period'),
    cards: document.getElementById('cards'),
    setRow: document.getElementById('setRow'),
    checkBtn: document.getElementById('checkBtn'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),
    tools: document.getElementById('tools'),

    startOverlay: document.getElementById('startOverlay'),
    startTitle: document.getElementById('startTitle'),
    modeDesc: document.getElementById('modeDesc'),
    levelHint: document.getElementById('levelHint'),
    levelRow: document.getElementById('levelRow'),
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
    level: loadLevel(),
    round: 0,
    stars: 0,
    answer: null,        // { h, m } — h 는 1~12 (하루 일과만 0~23)
    shown: null,         // 큰 시계에 지금 그려진 시각 (바늘 맞추기에서는 아이가 돌린 것)
    reverse: false,      // 디지털 짝에서 '디지털을 보고 바늘 시계 고르기' 인 문제
    order: [],           // 하루 일과의 문제 순서
    prompt: '',
    misses: 0,
    firstTry: true,
    locked: false
  };

  if (!window.TTS || !TTS.supported) {
    el.voiceBtn.hidden = true;
    el.speakBtn.hidden = true;
  }

  document.body.classList.add('act-' + act.id);
  document.title = act.name + ' · 다니랜드 🕒';
  el.startTitle.textContent = act.icon + ' ' + act.name;
  el.modeDesc.textContent = act.desc;
  buildLevelRow();
  drawFace({ h: 10, m: 10 });
  fitClock();

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
  el.checkBtn.addEventListener('click', checkSet);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '세 시 삼십 분'; } });
  });

  var back = Catalog.backHref('clock.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);
  bindGo(el.endHome, 'index.html');

  window.addEventListener('resize', fitClock);
  window.addEventListener('orientationchange', function () { setTimeout(fitClock, 200); });

  document.addEventListener('keydown', function (e) {
    if (!el.startOverlay.hidden || !el.endOverlay.hidden || VoicePicker.isOpen()) return;
    var n = parseInt(e.key, 10);
    if (!n || n < 1 || n > 4) return;
    var card = el.cards.children[n - 1];
    if (card) card.click();
  });

  bindDrag();

  function bindGo(btn, href) {
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

  function loadLevel() {
    if (!act.levels.length) return 0;
    var v = parseInt(UI.loadValue(LEVEL_KEY), 10);
    return (act.levels.indexOf(v) >= 0) ? v : act.def;
  }

  function buildLevelRow() {
    el.levelRow.innerHTML = '';
    if (!act.levels.length) {
      el.levelRow.hidden = true;
      el.levelHint.hidden = true;
      return;
    }

    act.levels.forEach(function (value, i) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (value === state.level ? ' on' : '');
      b.textContent = LEVEL_NAMES[i];
      b.addEventListener('click', function () {
        state.level = value;
        UI.saveValue(LEVEL_KEY, String(value));
        if (window.SFX) SFX.tap();
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 시계 그리기 ---------- */

  // 바늘 시계 한 개를 svg 글로 만듭니다. 큰 시계와 보기 카드의 작은 시계가 같이 씁니다.
  // o.ring : 바깥에 분 숫자(5·10·…·55)를 적을지 — 30분·5분 단계의 안내입니다.
  // o.knobs: 바늘 끝에 잡는 동그라미 (바늘 맞추기)
  // o.ghost: 흐린 정답 바늘 (바늘 맞추기에서 두 번 틀리면)
  function clockSvg(t, o) {
    o = o || {};
    var s = '<svg class="clock-svg" viewBox="-116 -116 232 232" aria-hidden="true">';
    s += '<circle class="ck-rim" r="100"/>';
    s += '<circle class="ck-bg" r="94"/>';

    for (var i = 0; i < 60; i++) {
      var big = (i % 5 === 0);
      var a = i * 6 * Math.PI / 180;
      var r1 = big ? 80 : 86, r2 = 91;
      s += '<line class="' + (big ? 'ck-tick big' : 'ck-tick') + '" x1="' + f(Math.sin(a) * r1) +
           '" y1="' + f(-Math.cos(a) * r1) + '" x2="' + f(Math.sin(a) * r2) + '" y2="' + f(-Math.cos(a) * r2) + '"/>';
    }

    for (var n = 1; n <= 12; n++) {
      var b = n * 30 * Math.PI / 180;
      s += '<text class="ck-num" x="' + f(Math.sin(b) * 66) + '" y="' + f(-Math.cos(b) * 66) + '">' + n + '</text>';
      if (o.ring) {
        s += '<text class="ck-min" x="' + f(Math.sin(b) * 108) + '" y="' + f(-Math.cos(b) * 108) + '">' +
             (n === 12 ? '0' : n * 5) + '</text>';
      }
    }

    if (o.ghost) s += hands(o.ghost, 'ghost', false);
    s += hands(t, '', o.knobs);
    s += '<circle class="ck-pin" r="6"/>';
    return s + '</svg>';
  }

  function hands(t, extra, knobs) {
    var ha = hourAngle(t), ma = t.m * 6;
    var s = '<g class="ck-hand hour ' + extra + '" transform="rotate(' + f(ha) + ')">' +
            '<line x1="0" y1="10" x2="0" y2="-48"/>' + (knobs ? '<circle cy="-48" r="9"/>' : '') + '</g>';
    s += '<g class="ck-hand minute ' + extra + '" transform="rotate(' + f(ma) + ')">' +
         '<line x1="0" y1="12" x2="0" y2="-80"/>' + (knobs ? '<circle cy="-80" r="9"/>' : '') + '</g>';
    return s;
  }

  // 짧은 바늘은 분만큼 다음 숫자 쪽으로 갑니다 (맨 위 주석).
  function hourAngle(t) { return ((t.h % 12) + t.m / 60) * 30; }

  function f(x) { return (Math.round(x * 10) / 10).toString(); }

  function drawFace(t, o) {
    state.shown = { h: t.h, m: t.m };
    o = o || {};
    if (o.ring === undefined) o.ring = state.level > 0 && state.level < 60;
    el.face.innerHTML = clockSvg(t, o);
  }

  /* ---------- 시각 글 ---------- */

  function h12(h) { var x = h % 12; return x === 0 ? 12 : x; }

  function timeText(t) { return h12(t.h) + '시' + (t.m ? ' ' + t.m + '분' : ''); }

  // 조사는 끝 글자로 갈립니다 — '3시를 · 3시예요' / '3시 30분을 · 3시 30분이에요'.
  function eul(t) { return timeText(t) + (t.m ? '을' : '를'); }
  function ieyo(t) { return timeText(t) + (t.m ? '이에요' : '예요'); }

  function digitalText(t) { return h12(t.h) + ':' + (t.m < 10 ? '0' : '') + t.m; }

  // 읽어 줄 때 30분이면 '반' 도 같이 말합니다 — 아이가 어른들한테 듣는 말이 그쪽이라서요.
  function timeSay(t) {
    var s = timeText(t);
    if (t.m === 30) s += ', ' + h12(t.h) + '시 반';
    return s;
  }

  // 하루 중 언제인지 (하루 일과).
  function periodOf(h) {
    if (h < 12) return { icon: '🌅', name: '아침' };
    if (h < 18) return { icon: '☀️', name: '낮' };
    if (h < 20) return { icon: '🌆', name: '저녁' };
    return { icon: '🌙', name: '밤' };
  }

  /* ---------- 문제 만들기 ---------- */

  function randomTime() {
    var step = state.level || 60;
    return { h: UI.randInt(1, 12), m: UI.randInt(0, 60 / step - 1) * step };
  }

  function same(a, b) { return h12(a.h) === h12(b.h) && a.m === b.m; }

  // 아이가 실제로 헷갈리는 시각들 (맨 위 주석).
  function confusions(t) {
    var h = t.h, m = t.m, out = [];
    function add(hh, mm) {
      hh = ((hh - 1) % 12 + 12) % 12 + 1;
      if (mm < 0 || mm >= 60) return;
      out.push({ h: hh, m: mm });
    }

    add(h + 1, m);                          // 짧은 바늘을 다음 숫자로
    add(h - 1, m);
    if (m) add(h, m / 5);                   // 긴 바늘 숫자를 그대로 분으로 (3시 25분 → 3시 5분)
    if (m) add(m / 5, (h % 12) * 5);        // 두 바늘 바꿔 읽기 (3시 25분 → 5시 15분)
    else add(12, (h % 12) * 5);             // 정각의 긴 바늘(12)을 시로 (3시 → 12시 15분)
    add(h, (m + 30) % 60);                  // 긴 바늘 반대쪽
    add(h, m + 5);
    add(h, m - 5);
    add(h + 1, 0);
    add(h, 0);
    add(h + 2, m);
    add(h - 2, m);
    return out;
  }

  // 정답 + 그 단계 눈금에 맞는 헷갈리는 시각 셋.
  function pickTimes(answer) {
    var step = state.level || 60;
    var list = [answer];

    function tryAdd(t) {
      if (list.length >= 4 || t.m % step !== 0) return;
      for (var i = 0; i < list.length; i++) if (same(list[i], t)) return;
      list.push(t);
    }

    UI.shuffle(confusions(answer)).forEach(tryAdd);
    while (list.length < 4) tryAdd(randomTime());
    return list;
  }

  /* ---------- 게임 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    state.order = UI.shuffle(ROUTINE.slice());
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    if (window.TTS) TTS.cancel();
    el.cards.innerHTML = '';
    el.face.classList.remove('pop', 'wrong');
    state.firstTry = true;
    state.misses = 0;
    state.locked = false;

    if (act.id === 'read') makeRead();
    else if (act.id === 'set') makeSet();
    else if (act.id === 'digital') makeDigital();
    else makeRoutine();

    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    fitClock();
    setTimeout(speakPrompt, 400);
  }

  function step() { return ' (' + (state.round + 1) + '/' + ROUNDS + ')'; }

  // 같은 시각이 연달아 나오지 않게.
  function newTime() {
    var t, guard = 0;
    do { t = randomTime(); } while (state.answer && same(t, state.answer) && ++guard < 20);
    return t;
  }

  // 🕒 시계 읽기
  function makeRead() {
    state.answer = newTime();
    drawFace(state.answer);
    state.prompt = '시계를 봐요. 몇 시일까요?';
    el.questLabel.textContent = '몇 시일까요?' + step();

    renderCards(pickTimes(state.answer), function (t) {
      return '<div class="ck-text">' + timeText(t) + '</div>';
    });
  }

  // 👆 바늘 맞추기 — 시작 바늘은 정답이 아닌 아무 시각.
  function makeSet() {
    state.answer = newTime();
    var start;
    do { start = randomTime(); } while (same(start, state.answer));
    drawFace(start, { knobs: true });
    state.prompt = eul(state.answer) + ' 만들어요.';
    el.questLabel.textContent = '🕒 ' + timeText(state.answer) + step();
  }

  // 📟 디지털 짝 — 짝수 문제는 바늘 시계를 보고 디지털, 홀수 문제는 디지털을 보고 바늘 시계.
  function makeDigital() {
    state.answer = newTime();
    state.reverse = (state.round % 2 === 1);
    var list = pickTimes(state.answer);

    if (!state.reverse) {
      drawFace(state.answer);
      state.prompt = '이 시계와 같은 디지털 시계를 찾아요.';
      el.questLabel.textContent = '같은 디지털 시계는?' + step();
      renderCards(list, function (t) {
        return '<div class="ck-lcd">' + digitalText(t) + '</div>';
      });
    } else {
      el.digital.textContent = digitalText(state.answer);
      state.prompt = '이 디지털 시계와 같은 바늘 시계를 찾아요.';
      el.questLabel.textContent = '같은 바늘 시계는?' + step();
      var ring = state.level < 60;
      renderCards(list, function (t) { return clockSvg(t, { ring: ring }); }, 'mini');
    }
  }

  // 🌞 하루 일과 — 보기에는 되도록 '같은 시계 모양, 다른 때' 짝을 하나 넣습니다.
  function makeRoutine() {
    var ans = state.order[state.round % state.order.length];
    state.answer = ans;
    drawFace(ans, { ring: false });

    var p = periodOf(ans.h);
    el.period.textContent = p.icon + ' ' + p.name;
    // 시각은 글로도 소리로도 말하지 않습니다 — 시계를 읽는 놀이라서요 (맞히면 읽어 줍니다).
    state.prompt = '시계를 봐요. ' + p.name + '이에요. 다니는 무엇을 할까요?';
    el.questLabel.textContent = '다니는 무엇을 할까요?' + step();

    var others = ROUTINE.filter(function (r) { return r !== ans; });
    var twin = others.filter(function (r) { return h12(r.h) === h12(ans.h) && r.m === ans.m; });
    var list = [ans];
    if (twin.length) list.push(twin[0]);
    UI.shuffle(others).forEach(function (r) {
      if (list.length < 4 && list.indexOf(r) < 0) list.push(r);
    });

    renderCards(list, function (r) {
      return '<div class="ck-emoji">' + r.emoji + '</div><div class="ck-label">' + r.label + '</div>';
    }, 'routine');
  }

  /* ---------- 보기 ---------- */

  function renderCards(list, inner, kind) {
    el.cards.innerHTML = '';
    el.cards.className = 'cards clock-cards' + (kind ? ' ' + kind : '');

    UI.shuffle(list.slice()).forEach(function (t) {
      var card = document.createElement('button');
      card.className = 'choice clock-card';
      card.innerHTML = inner(t);
      card.addEventListener('click', function () { choose(card, t); });
      el.cards.appendChild(card);
    });
  }

  function choose(card, t) {
    if (state.locked || card.classList.contains('dim')) return;

    if (t === state.answer || (act.id !== 'routine' && same(t, state.answer))) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      card.classList.add('correct');
      UI.addMark(card, '⭕');
      UI.confettiAt(card);
      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 디지털을 보고 고른 문제는 맞힌 바늘 시계를 큰 시계에도 보여 줍니다.
      if (act.id === 'digital' && state.reverse) {
        document.body.classList.remove('show-digital');
        drawFace(state.answer);
        fitClock();
      }
      el.face.classList.add('pop');

      speak(act.id === 'routine' ? routineSay(state.answer) : timeSay(state.answer));
      goNext();

    } else {
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      card.classList.add('wrong');
      setTimeout(function () {
        card.classList.remove('wrong');
        card.classList.add('dim');
      }, 400);
      // 틀리면 고른 것이 무엇인지 읽어 줍니다 — 그것도 시계 읽기 연습이라서요.
      setTimeout(function () {
        speak(act.id === 'routine' ? routineSay(t) : '그건 ' + ieyo(t) + '. 다시 찾아 봐요');
      }, 500);
    }
  }

  function routineSay(r) {
    return periodOf(r.h).name + ' ' + timeText(r) + '에 ' + r.say;
  }

  function goNext() {
    el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';
    setTimeout(function () {
      state.round += 1;
      nextRound();
    }, 2200);
  }

  /* ---------- 바늘 맞추기: 끌기 ---------- */

  // 손가락이 닿은 곳에서 더 가까운 바늘을 잡습니다. 두 바늘이 겹쳐 있으면(12시 등)
  // 가운데 쪽(반지름 55% 안)을 누르면 짧은 바늘, 바깥이면 긴 바늘입니다.
  // 긴 바늘은 5분 눈금에 붙고, 12 를 넘어가면 짧은 바늘이 한 칸 따라갑니다.
  function bindDrag() {
    var grab = null;

    el.face.addEventListener('pointerdown', function (e) {
      if (act.id !== 'set' || state.locked || !el.startOverlay.hidden) return;
      var p = polar(e);
      if (p.r < 0.12 || p.r > 1.15) return;

      var dm = angleGap(p.a, state.shown.m * 6);
      var dh = angleGap(p.a, hourAngle(state.shown));
      if (Math.abs(dm - dh) < 25) grab = (p.r < 0.55) ? 'hour' : 'minute';
      else grab = (dh < dm) ? 'hour' : 'minute';

      el.face.setPointerCapture(e.pointerId);
      el.face.classList.add('dragging');
      move(p);
      e.preventDefault();
    });

    el.face.addEventListener('pointermove', function (e) {
      if (!grab) return;
      move(polar(e));
      e.preventDefault();
    });

    function end() {
      if (!grab) return;
      grab = null;
      el.face.classList.remove('dragging');
    }
    el.face.addEventListener('pointerup', end);
    el.face.addEventListener('pointercancel', end);

    function move(p) {
      var t = { h: state.shown.h, m: state.shown.m };

      if (grab === 'minute') {
        var m = (Math.round(p.a / 30) * 5) % 60;
        if (t.m >= 45 && m < 15) t.h += 1;            // 12 를 시계 방향으로 넘음
        else if (t.m < 15 && m >= 45) t.h -= 1;       // 거꾸로 넘음
        t.m = m;
      } else {
        // 짧은 바늘 자리에서 분만큼 간 몫을 빼고 가장 가까운 시를 고릅니다.
        t.h = Math.round(p.a / 30 - t.m / 60);
      }
      t.h = ((t.h - 1) % 12 + 12) % 12 + 1;

      if (t.h !== state.shown.h || t.m !== state.shown.m) {
        if (window.SFX) SFX.tap();
        drawFace(t, { knobs: true, ghost: state.misses >= 2 ? state.answer : null });
      }
    }
  }

  // 시계 가운데에서 본 각도(12시 = 0, 시계 방향)와 반지름 비율.
  function polar(e) {
    var box = el.face.getBoundingClientRect();
    var x = e.clientX - (box.left + box.width / 2);
    var y = e.clientY - (box.top + box.height / 2);
    var a = Math.atan2(x, -y) * 180 / Math.PI;
    if (a < 0) a += 360;
    // svg 안의 테두리(반지름 100)는 viewBox 232 중 200 입니다.
    return { a: a, r: Math.sqrt(x * x + y * y) / (box.width / 2 * 200 / 232) };
  }

  function angleGap(a, b) {
    var d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function checkSet() {
    if (state.locked) return;

    if (same(state.shown, state.answer)) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      if (state.firstTry) { state.stars += 1; updateScore(); }
      drawFace(state.answer);
      el.face.classList.add('pop');
      UI.confettiAt(el.face);
      speak(timeSay(state.answer) + '. 잘했어요!');
      goNext();
      return;
    }

    state.firstTry = false;
    state.misses += 1;
    if (window.SFX) SFX.wrong();
    el.face.classList.remove('wrong');
    void el.face.offsetWidth;
    el.face.classList.add('wrong');

    // 어느 바늘이 틀렸는지만 알려 줍니다. 두 번 틀리면 흐린 정답 바늘을 깔아 줍니다.
    var hourOk = h12(state.shown.h) === h12(state.answer.h);
    var minOk = state.shown.m === state.answer.m;
    var tip = !minOk && !hourOk ? '긴 바늘과 짧은 바늘을 다시 봐요.'
            : !minOk ? '긴 바늘을 다시 봐요. 긴 바늘은 분이에요.'
            : '짧은 바늘을 다시 봐요. 짧은 바늘은 시예요.';
    if (state.misses >= 2) {
      tip = '흐린 바늘처럼 맞춰 봐요.';
      drawFace(state.shown, { knobs: true, ghost: state.answer });
    }
    speak('지금은 ' + ieyo(state.shown) + '. ' + tip);
  }

  /* ---------- 끝 ---------- */

  function finish() {
    el.bar.style.width = '100%';
    UI.saveBest(BEST_KEY, state.stars, ROUNDS);

    el.endStars.textContent = UI.starLine(state.stars, ROUNDS);
    el.endTitle.textContent = (state.stars === ROUNDS)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = ROUNDS + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  /* ---------- 화면 맞추기 ---------- */

  // 시계는 가로폭과 '아래 보기·단추를 놓고 남는 높이' 중 작은 쪽에 맞춥니다 — 스크롤 없이 한 화면.
  // 아래 보기의 높이는 시계 크기와 상관없으므로(판 폭을 따름) 그려 놓고 재면 됩니다.
  function fitClock() {
    var showDigital = act.id === 'digital' && state.reverse && !state.locked && el.startOverlay.hidden;
    document.body.classList.toggle('show-digital', showDigital);
    el.period.hidden = act.id !== 'routine';

    var box = el.stage.parentNode;
    var pad = getComputedStyle(box);
    var wide = box.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
    var below = (act.id === 'set' ? el.setRow.offsetHeight : el.cards.offsetHeight) +
                el.tools.offsetHeight + 40;
    var top = el.stage.getBoundingClientRect().top + window.scrollY;
    var extra = act.id === 'routine' ? el.period.offsetHeight + 6 : 0;
    var size = Math.min(wide, MAX_CLOCK, window.innerHeight - top - below - extra);
    size = Math.max(MIN_CLOCK, Math.floor(size));

    el.face.style.width = size + 'px';
    el.face.style.height = size + 'px';
    el.digital.style.fontSize = Math.min(96, Math.round(size * 0.3)) + 'px';
  }

  /* ---------- 소리 · 점수 ---------- */

  function speakPrompt() { speak(state.prompt); }

  function speak(text) {
    if (!text || !window.TTS || !TTS.supported) return;
    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, {
      onend: function () { el.speakBtn.classList.remove('speaking'); }
    });
    setTimeout(function () { el.speakBtn.classList.remove('speaking'); }, 3000);
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }
})();
