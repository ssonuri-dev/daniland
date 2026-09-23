/* =========================================================================
 * 다니랜드 - 몸 이름 (영어: 몸의 부위)
 *
 * 주소) body.html
 *
 * 그림 한 장(dress/costume-basic.png — 코디 놀이의 평상복 다니) 위에 부위마다
 * 보이지 않는 단추를 얹어 놓았습니다. 마을 지도(town.html)·세계 지도(world.html)와 같은 얼개이고,
 * 다른 점은 **다니가 움직이지 않는다**는 것뿐입니다 (누를 곳이 곧 다니 자신이라 걸어갈 데가 없습니다).
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   look   : 구경하기    - 아무 데나 누르면 이름을 읽어 줍니다 (점수 없음)
 *   listen : 듣고 찾기   - "Touch your nose!" 를 듣고 그 자리를 누릅니다
 *   use    : 무엇을 할까 - "I smell flowers with this." 를 듣고 어디인지 고릅니다
 *
 * ★ 'use' 의 hint 는 **부위 이름을 말하지 않습니다.** 이름을 말해 버리면 듣고 찾기와 똑같아지고,
 *   '무엇을 하는 곳인지' 로 찾는 재미가 사라집니다. 맞히면 그때 이름이 든 문장(use)을 읽어 줍니다.
 *   hint 는 **한 부위에만 맞아야 합니다** — 'I run with these' 는 다리와 발 둘 다라 쓸 수 없어
 *   발은 'I wear socks and shoes on these.' 로 두었습니다.
 *
 * 좌표는 모두 그림 기준 백분율(%)입니다. 그림을 새로 바꾸면 PARTS 의 boxes 와
 * 아래 FIG_RATIO(가로÷세로)를 다시 재면 됩니다.
 * ⚠️ boxes 끼리 겹치면 위에 그려진 단추가 아래 것을 가립니다. 얼굴처럼 좁은 데는
 *    그린 것보다 **넓게** 잡아 두었습니다 — 손가락이 닿아야 하니까요.
 *    얼굴은 위아래로 쌓으면 한 칸이 손가락보다 얇아져서(코는 그림에서 세로 2%뿐입니다)
 *    **눈·코·눈을 옆으로 나란히** 두고(y 27~36) 그 바깥에 귀를, 아래에 입을 두었습니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'en-US';
  var FIG_RATIO = 600 / 1000;                // 그림 가로 ÷ 세로
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* -------------------------------------------------------------------------
   * 몸의 열세 곳
   *   word  : 영어 이름 (한 개일 때)
   *   many  : 둘일 때의 이름 (eye → eyes, foot → feet). 없으면 하나뿐인 곳입니다.
   *   boxes : 누를 수 있는 칸 [왼쪽, 위, 너비, 높이] — 눈·귀·손처럼 둘인 곳은 두 칸입니다.
   *   hint  : '무엇을 할까' 에서 내는 말 (이름을 말하지 않습니다)
   *   use   : 맞혔을 때 읽어 주는, 이름이 든 문장
   * ---------------------------------------------------------------------- */
  var PARTS = [
    { id: 'hair', word: 'hair', ko: '머리카락', icon: '💇',
      hint: 'I brush this every morning.', use: 'I brush my hair.',
      boxes: [[24, 8, 52, 19]] },

    { id: 'eye', word: 'eye', many: 'eyes', ko: '눈', icon: '👁️',
      hint: 'I see with these.', use: 'I see with my eyes.',
      boxes: [[31, 27, 14, 9], [55, 27, 14, 9]] },

    { id: 'ear', word: 'ear', many: 'ears', ko: '귀', icon: '👂',
      hint: 'I hear with these.', use: 'I hear with my ears.',
      boxes: [[15, 27, 16, 11], [69, 27, 16, 11]] },

    { id: 'nose', word: 'nose', ko: '코', icon: '👃',
      hint: 'I smell flowers with this.', use: 'I smell with my nose.',
      boxes: [[45, 27, 10, 9]] },

    { id: 'mouth', word: 'mouth', ko: '입', icon: '👄',
      hint: 'I eat and talk with this.', use: 'I eat with my mouth.',
      boxes: [[31, 36, 38, 5]] },

    { id: 'neck', word: 'neck', ko: '목', icon: '🧣',
      hint: 'My scarf goes around this.', use: 'My scarf goes around my neck.',
      boxes: [[44, 41, 12, 5.5]] },

    { id: 'shoulder', word: 'shoulder', many: 'shoulders', ko: '어깨', icon: '🎒',
      hint: 'My bag hangs on these.', use: 'My bag is on my shoulders.',
      boxes: [[28, 42, 16, 5.5], [56, 42, 16, 5.5]] },

    { id: 'arm', word: 'arm', many: 'arms', ko: '팔', icon: '💪',
      hint: 'I hug you with these.', use: 'I hug you with my arms.',
      boxes: [[24, 47.5, 11, 11.5], [65, 47.5, 11, 11.5]] },

    { id: 'tummy', word: 'tummy', ko: '배', icon: '😋',
      hint: 'This is full after lunch.', use: 'My tummy is full.',
      boxes: [[35, 47.5, 30, 15.5]] },

    { id: 'hand', word: 'hand', many: 'hands', ko: '손', icon: '✋',
      hint: 'I clap with these.', use: 'I clap my hands.',
      boxes: [[17, 59, 18, 9], [65, 59, 18, 9]] },

    { id: 'knee', word: 'knee', many: 'knees', ko: '무릎', icon: '🧎',
      hint: 'I bend these when I sit down.', use: 'I bend my knees.',
      boxes: [[36, 73.5, 14, 6], [50, 73.5, 14, 6]] },

    // 다리는 반바지 아래(허벅지)와 무릎 아래(정강이) 두 군데씩 — 무릎 칸을 피해 갈라 두었습니다.
    { id: 'leg', word: 'leg', many: 'legs', ko: '다리', icon: '🦵',
      hint: 'I run with these.', use: 'I run with my legs.',
      boxes: [[35, 63.5, 15, 10], [50, 63.5, 15, 10], [35, 79.5, 15, 8], [50, 79.5, 15, 8]] },

    { id: 'foot', word: 'foot', many: 'feet', ko: '발', icon: '🦶',
      hint: 'I wear socks and shoes on these.', use: 'I wear shoes on my feet.',
      boxes: [[34, 87.5, 16, 9.5], [50, 87.5, 16, 9.5]] }
  ];

  var ACTS = [
    { id: 'look',   name: '구경하기',   icon: '🔎', desc: '아무 데나 눌러 보세요 — 이름을 알려 줘요' },
    { id: 'listen', name: '듣고 찾기',   icon: '👂', desc: '"Touch your nose!" 를 듣고 그 자리를 눌러요' },
    { id: 'use',    name: '무엇을 할까', icon: '🤔', desc: '무엇을 하는 곳인지 듣고 찾아요' }
  ];

  var BEST_KEY = 'daniland.best.body';       // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.bodyAct';          // 마지막에 고른 놀이

  var el = {
    fig: document.getElementById('fig'),
    spots: document.getElementById('spots'),
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

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    round: 0,
    stars: 0,
    target: null,
    prompt: '',
    firstTry: true,
    locked: false,
    deck: [],          // 이번 판에 아직 안 나온 곳들
    visited: {}        // 구경하기에서 눌러 본 곳
  };

  if (!findAct(state.act)) state.act = 'look';
  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildSpots();
  buildModeRow();
  fitFig();

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    fitFig();
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  el.speakBtn.addEventListener('click', speakPrompt);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || 'Touch your nose!'; } });
  });

  // 맨 위 ← 는 방금 지나온 과목 페이지로, 결과 화면의 🏠 만 홈으로 갑니다.
  var back = window.Catalog ? Catalog.backHref('body.html') : 'index.html';
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);
  bindGo(el.endHome, 'index.html');

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

  // 둘인 곳은 둘 이름으로 말합니다 (eye → eyes, foot → feet).
  function name(part) { return part.many || part.word; }

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
    var best = UI.readBest('daniland.best.body.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 그림 위의 단추 ---------- */

  function buildSpots() {
    PARTS.forEach(function (p) {
      p.els = p.boxes.map(function (box) {
        var b = document.createElement('button');
        b.className = 'body-spot';
        b.style.left = box[0] + '%';
        b.style.top = box[1] + '%';
        b.style.width = box[2] + '%';
        b.style.height = box[3] + '%';
        b.addEventListener('click', function () { choose(b, p); });
        el.spots.appendChild(b);
        return b;
      });
    });
  }

  function clearSpots() {
    PARTS.forEach(function (p) {
      p.els.forEach(function (b) {
        b.className = 'body-spot';
        var mark = b.querySelector('.mark');
        if (mark) mark.remove();
      });
    });
  }

  // 그림을 비율 그대로, 남는 자리 안에 제일 크게 넣습니다. (스크롤이 생기면 안 됩니다)
  function fitFig() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;

    var top = el.fig.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;

    var availH = screenH - top - toolsH - bottomPad - 6;

    // clientWidth 는 좌우 여백을 포함하므로 그대로 쓰면 그림이 여백만큼 삐져나갑니다.
    var box = el.fig.parentNode;
    var boxStyle = getComputedStyle(box);
    var availW = box.clientWidth - px(boxStyle.paddingLeft) - px(boxStyle.paddingRight);

    // 가로에 맞춘 크기와 세로에 맞춘 크기 중 작은 쪽 — 그래야 양쪽 다 안 넘칩니다.
    var w = Math.max(200, Math.min(availW, availH * FIG_RATIO));

    el.fig.style.width = Math.round(w) + 'px';
    el.fig.style.height = Math.round(w / FIG_RATIO) + 'px';
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitFig);
  window.addEventListener('orientationchange', function () { setTimeout(fitFig, 200); });

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    clearSpots();
    state.round = 0;
    state.stars = 0;
    state.visited = {};
    state.locked = false;
    state.target = null;
    state.deck = [];

    if (state.act === 'look') {
      el.bar.style.width = '0%';
      el.score.textContent = '🔎 0/' + PARTS.length;
      el.speakBtn.hidden = true;
      el.questItem.hidden = true;
      el.questLabel.textContent = '몸을 눌러 보세요';
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

    if (state.act === 'use') {
      state.prompt = next.hint;
      el.questLabel.textContent = '어디일까요? (' + (state.round + 1) + '/' + ROUNDS + ')';
    } else {
      state.prompt = 'Touch your ' + name(next) + '!';
      el.questLabel.textContent = '어디라고 했을까요? (' + (state.round + 1) + '/' + ROUNDS + ')';
    }

    el.questItem.hidden = true;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  /* 열세 곳을 섞어 놓고 한 장씩 꺼내 씁니다 — 같은 곳이 두세 번 나오고 아예 안 나오는 곳이
   * 생기는 것을 막습니다 (한 판은 열 문제라 열세 곳 중 열 곳이 나옵니다). */
  function pickTarget() {
    if (!state.deck.length) {
      state.deck = UI.shuffle(PARTS.slice());

      // 판이 넘어갈 때 같은 곳이 연달아 나오지 않게 한 장 밀어 둡니다.
      if (state.target && state.deck[0].id === state.target.id) {
        state.deck.push(state.deck.shift());
      }
    }
    return state.deck.shift();
  }

  /* ---------- 눌렀을 때 ---------- */

  function choose(spot, part) {
    if (state.locked || spot.classList.contains('dim')) return;

    // 구경하기 — 틀릴 것이 없습니다. 누른 곳의 이름을 알려 줍니다.
    if (state.act === 'look') return look(spot, part);

    if (part.id === state.target.id) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      markAll(part, 'correct', '⭕');
      UI.confettiAt(spot);

      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 맞히는 즉시 막대를 채웁니다. (마지막 문제에서 다 찬 모습을 볼 수 있게)
      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';

      showName(part);
      speak(state.act === 'use' ? part.use : 'This is my ' + name(part) + '.');

      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, 2600);

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

  // 눈·손처럼 둘인 곳은 한 쪽을 눌러도 양쪽이 같이 표시됩니다 (같은 이름이니까요).
  function markAll(part, cls, mark) {
    part.els.forEach(function (b) {
      b.classList.add(cls);
      if (mark) UI.addMark(b, mark);
    });
  }

  function showName(part) {
    el.questItem.hidden = false;
    el.questItem.textContent = part.icon;
    el.questLabel.textContent = name(part) + ' · ' + part.ko;
  }

  // 🔎 구경하기
  function look(spot, part) {
    state.locked = true;
    if (window.SFX) SFX.tap();
    markAll(part, 'correct');

    showName(part);
    speak(part.many ? 'These are my ' + part.many + '.' : 'This is my ' + part.word + '.');

    if (!state.visited[part.id]) {
      state.visited[part.id] = true;
      var n = countVisited();
      el.score.textContent = '🔎 ' + n + '/' + PARTS.length;
      el.bar.style.width = Math.round((n / PARTS.length) * 100) + '%';

      if (n === PARTS.length) {
        if (window.SFX) SFX.finish();
        showBanner('몸 이름을 다 알아봤어요! 🎉');
      }
    }

    setTimeout(function () {
      markOff(part);
      state.locked = false;
    }, 900);
  }

  function markOff(part) {
    part.els.forEach(function (b) { b.classList.remove('correct'); });
  }

  function countVisited() {
    var n = 0;
    for (var k in state.visited) if (state.visited.hasOwnProperty(k)) n++;
    return n;
  }

  function finish() {
    el.bar.style.width = '100%';
    UI.saveBest('daniland.best.body.' + state.act, state.stars, ROUNDS);
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

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }

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
