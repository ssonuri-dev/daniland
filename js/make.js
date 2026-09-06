/* =========================================================================
 * 다니랜드 - 글자 만들기
 *
 * 주소) make.html
 *
 * 그림과 낱말이 나오고 그중 한 글자가 빈칸입니다.
 * 첫소리(자음) → 가운뎃소리(모음) → 받침 차례로 골라 그 글자를 만듭니다.
 * 고를 때마다 빈칸에서 글자가 조립되는 것이 보입니다 (ㄱ → 가 → 강).
 *
 * 문제로 낼 낱말은 js/data.js 의 '한글' 과목 수업에서 그대로 가져옵니다.
 * 그러니 한글 수업에 낱말을 더 넣으면 이 놀이도 같이 늘어납니다.
 * (초성·중성·종성이 기본 자모인 글자만 문제로 씁니다 — ㄲ ㅘ 같은 것은 뺍니다)
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* ---------- 한글 조립 ----------
   * 한글 글자 하나는 (첫소리 × 21 + 가운뎃소리) × 28 + 받침 번호로 만들어집니다.
   * '가' 는 0xAC00 이고 거기서부터 순서대로 이어집니다. */
  var BASE = 0xAC00;

  var CHO  = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  var JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  var JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  // 5살에게 낼 것 — 쌍자음(ㄲ)과 이중모음(ㅘ), 겹받침(ㄳ)은 뺍니다.
  var EASY_CHO  = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  var EASY_JUNG = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'];
  var EASY_JONG = ['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'];

  function pull(ch) {
    var code = ch.charCodeAt(0) - BASE;
    if (code < 0 || code > 11171) return null;      // 한글 글자가 아닙니다
    return { ci: Math.floor(code / 588), ji: Math.floor((code % 588) / 28), ki: code % 28 };
  }

  function push(ci, ji, ki) {
    return String.fromCharCode(BASE + (ci * 21 + ji) * 28 + (ki || 0));
  }

  // 기본 자모로만 된 글자인지 (받침은 allowJong 일 때만 허용)
  function easy(ch, allowJong) {
    var p = pull(ch);
    if (!p) return false;
    if (EASY_CHO.indexOf(CHO[p.ci]) < 0) return false;
    if (EASY_JUNG.indexOf(JUNG[p.ji]) < 0) return false;
    if (p.ki === 0) return true;
    return allowJong && EASY_JONG.indexOf(JONG[p.ki]) >= 0;
  }

  /* ---------- 난이도 ---------- */

  var LEVELS = [
    { value: 1, text: '쉬워요<br>3개 중에',   choices: 3, jong: false },
    { value: 2, text: '보통<br>5개 중에',     choices: 5, jong: false },
    { value: 3, text: '어려워요<br>받침까지', choices: 5, jong: true }
  ];

  var el = {
    word: document.getElementById('word'),
    rows: document.getElementById('rows'),
    stage: document.getElementById('stage'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    soundBtn: document.getElementById('soundBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

    startOverlay: document.getElementById('startOverlay'),
    levelRow: document.getElementById('levelRow'),
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
    level: parseInt(UI.loadValue('daniland.makeLevel'), 10) || 1,
    queue: [],
    round: 0,
    total: ROUNDS,
    stars: 0,
    item: null,        // { emoji, word, syl }  syl = 빈칸으로 낼 글자 자리
    answer: null,      // { ci, ji, ki }
    picked: null,      // 지금까지 고른 것
    step: 0,           // 0 첫소리 · 1 가운뎃소리 · 2 받침
    firstTry: true,
    locked: true
  };

  if (!levelDef(state.level)) state.level = 1;
  if (!window.TTS || !TTS.supported) { el.voiceBtn.hidden = true; el.soundBtn.hidden = true; }

  buildLevelRow();
  bindHome();

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

  el.soundBtn.addEventListener('click', speakWord);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.item ? state.item.word : '가나다'; } });
  });

  /* ---------- 시작 화면 ---------- */

  function levelDef(value) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].value === value) return LEVELS[i];
    return null;
  }

  function buildLevelRow() {
    el.levelRow.innerHTML = '';

    LEVELS.forEach(function (lv) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (lv.value === state.level ? ' on' : '');
      b.innerHTML = lv.text;
      b.addEventListener('click', function () {
        state.level = lv.value;
        UI.saveValue('daniland.makeLevel', String(lv.value));
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 문제 만들기 ---------- */

  // '한글' 과목 수업에서 그림이 있는 낱말을 모읍니다 (같은 낱말은 한 번만).
  function wordPool() {
    var seen = {};
    var out = [];

    (window.LESSONS || []).forEach(function (lesson) {
      if (lesson.subject !== '한글') return;
      (lesson.items || []).forEach(function (it) {
        if (!it.emoji || !it.word || seen[it.word]) return;
        if (it.word.length > 4) return;
        seen[it.word] = true;
        out.push({ emoji: it.emoji, word: it.word });
      });
    });

    return out;
  }

  // 그 낱말에서 빈칸으로 낼 만한 글자 자리들
  function spots(word, allowJong) {
    var out = [];
    for (var i = 0; i < word.length; i++) if (easy(word.charAt(i), allowJong)) out.push(i);
    return out;
  }

  function buildQueue() {
    var def = levelDef(state.level);
    var list = [];

    wordPool().forEach(function (w) {
      var ok = spots(w.word, def.jong);
      if (ok.length) list.push({ emoji: w.emoji, word: w.word, spots: ok });
    });

    list = UI.shuffle(list).slice(0, ROUNDS);

    return list.map(function (w) {
      return { emoji: w.emoji, word: w.word, syl: w.spots[UI.randInt(0, w.spots.length - 1)] };
    });
  }

  /* ---------- 한 판 ---------- */

  function startGame() {
    state.queue = buildQueue();
    state.total = state.queue.length;
    state.round = 0;
    state.stars = 0;
    updateScore();

    if (!state.total) {                       // 한글 수업이 하나도 없을 때
      el.questLabel.textContent = '한글 수업에 낱말이 있어야 놀 수 있어요';
      return;
    }
    nextRound();
  }

  function nextRound() {
    if (state.round >= state.queue.length) { finish(); return; }

    state.item = state.queue[state.round];
    state.round++;
    updateBar(state.round - 1);

    state.answer = pull(state.item.word.charAt(state.item.syl));
    state.picked = { ci: null, ji: null, ki: null };
    state.step = 0;
    state.firstTry = true;
    state.locked = false;

    el.stage.textContent = state.item.emoji;
    renderWord();
    renderRows();
    setTimeout(speakWord, 250);
  }

  function finish() {
    updateBar(state.total);
    UI.saveBest('daniland.best.make', state.stars, state.total);

    el.endStars.textContent = UI.starLine(state.stars, state.total);
    el.endTitle.textContent = (state.stars === state.total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = state.total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 화면 ---------- */

  // 빈칸에는 지금까지 고른 것이 조립돼 보입니다 (? → ㄱ → 가 → 강)
  function partial() {
    if (state.picked.ci === null) return '?';
    if (state.picked.ji === null) return CHO[state.picked.ci];
    return push(state.picked.ci, state.picked.ji, state.picked.ki === null ? 0 : state.picked.ki);
  }

  function renderWord() {
    el.word.innerHTML = '';

    for (var i = 0; i < state.item.word.length; i++) {
      var box = document.createElement('div');
      var blank = (i === state.item.syl);
      box.className = 'make-syl' + (blank ? ' blank' : '');
      box.textContent = blank ? partial() : state.item.word.charAt(i);
      if (blank && state.locked) box.classList.add('done');
      el.word.appendChild(box);
    }
  }

  var STEPS = [
    { key: 'ci', label: '첫소리' },
    { key: 'ji', label: '가운뎃소리' },
    { key: 'ki', label: '받침' }
  ];

  function stepCount() { return (state.answer.ki || levelDef(state.level).jong) ? 3 : 2; }

  function renderRows() {
    el.rows.innerHTML = '';

    for (var s = 0; s < stepCount(); s++) buildRow(s);

    el.questLabel.textContent = state.locked
      ? '잘했어요!'
      : STEPS[state.step].label + '를 골라요';
  }

  function buildRow(s) {
    var row = document.createElement('div');
    row.className = 'make-row' + (s === state.step && !state.locked ? ' on' : '') +
                    (s < state.step || state.locked ? ' done' : '');

    var name = document.createElement('div');
    name.className = 'rk';
    name.textContent = STEPS[s].label;
    row.appendChild(name);

    var box = document.createElement('div');
    box.className = 'jamo-row';
    choicesFor(s).forEach(function (letter) {
      box.appendChild(makeButton(s, letter));
    });
    row.appendChild(box);

    el.rows.appendChild(row);
  }

  // 보기는 문제마다 한 번만 만들어 두고 다시 그릴 때 그대로 씁니다.
  function choicesFor(s) {
    if (!state.item.choices) state.item.choices = {};
    if (state.item.choices[s]) return state.item.choices[s];

    var count = levelDef(state.level).choices;
    var right, pool;

    if (s === 0)      { right = CHO[state.answer.ci];  pool = EASY_CHO; }
    else if (s === 1) { right = JUNG[state.answer.ji]; pool = EASY_JUNG; }
    else {
      // 받침이 없으면 정답이 '' ('없음' 단추)입니다.
      // '없음' 은 오답 보기에도 섞여야 합니다 — 안 그러면 '없음' 이 보이는 것만으로 답을 알게 됩니다.
      right = JONG[state.answer.ki];
      pool = EASY_JONG.concat(['']);
    }

    var others = pool.filter(function (x) { return x !== right; });
    var picked = UI.shuffle(others.slice()).slice(0, Math.max(0, count - 1));
    state.item.choices[s] = UI.shuffle([right].concat(picked));
    return state.item.choices[s];
  }

  function makeButton(s, letter) {
    var b = document.createElement('button');
    b.className = 'jamo-btn' + (letter === '' ? ' none' : '');
    b.textContent = letter === '' ? '없음' : letter;

    // 이미 고른 줄은 고른 것만 켜 두고 더 못 누르게 합니다.
    var chosen = state.picked[STEPS[s].key];
    if (s < state.step || state.locked) {
      var mine = (s === 0) ? CHO[chosen] : (s === 1) ? JUNG[chosen] : JONG[chosen || 0];
      if (letter === mine) b.classList.add('on');
      else b.classList.add('dim');
      b.disabled = true;
      return b;
    }
    if (s > state.step) { b.disabled = true; return b; }

    b.addEventListener('click', function () { choose(b, s, letter); });
    return b;
  }

  function choose(btn, s, letter) {
    if (state.locked || s !== state.step || btn.classList.contains('dim')) return;

    var right = (s === 0) ? CHO[state.answer.ci]
              : (s === 1) ? JUNG[state.answer.ji]
              : JONG[state.answer.ki];

    if (letter !== right) {
      // 오답은 지우지 않고 흐리게 남긴 뒤 다시 들려줍니다.
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      btn.classList.add('wrong');
      setTimeout(function () {
        btn.classList.remove('wrong');
        btn.classList.add('dim');
        btn.disabled = true;
      }, 400);
      setTimeout(speakWord, 700);
      return;
    }

    state.picked[STEPS[s].key] = (s === 0) ? state.answer.ci
                               : (s === 1) ? state.answer.ji
                               : state.answer.ki;
    state.step++;
    if (window.SFX) SFX.tap();

    if (state.step >= stepCount()) done();
    else { renderWord(); renderRows(); }
  }

  function done() {
    state.locked = true;
    if (state.picked.ki === null) state.picked.ki = 0;

    renderWord();
    renderRows();

    if (window.SFX) SFX.correct();
    var blank = el.word.querySelector('.blank');
    if (blank) UI.confettiAt(blank);

    if (state.firstTry) { state.stars++; updateScore(); }

    speakWord();
    setTimeout(nextRound, 1400);
  }

  /* ---------- 소리 · 화면 ---------- */

  function speakWord() {
    if (!state.item || !window.TTS || !TTS.supported) return;
    el.soundBtn.classList.add('speaking');
    TTS.speak(state.item.word, LANG, {
      onend: function () { el.soundBtn.classList.remove('speaking'); }
    });
    setTimeout(function () { el.soundBtn.classList.remove('speaking'); }, 2500);
  }

  function updateScore() { el.score.textContent = '⭐ ' + state.stars; }

  function updateBar(done) {
    el.bar.style.width = Math.round((done / (state.total || 1)) * 100) + '%';
  }

  // ← 는 한글 과목 페이지로 돌아갑니다.
  function bindHome() {
    var back = window.Catalog ? Catalog.href('한글') : 'index.html';

    [el.backBtn, el.startHome, el.endHome].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (window.TTS) TTS.cancel();
        window.location.href = back;
      });
    });
  }
})();
