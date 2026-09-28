/* =========================================================================
 * 다니랜드 - 모양 (shape.html)
 *
 * 수학의 '모양' 묶음 카드 석 장이 이 화면 하나를 ?act= 로 나눠 씁니다 (시계와 같은 얼개 —
 * 시작 화면에는 단계만 나옵니다). 모양은 전부 svg 글로 그리고 그림 파일은 없습니다.
 *
 * 놀이 3가지
 *   flat  : 평면 모양 - 이름을 듣고 모양을 찾습니다.
 *             1단계  세모·네모·동그라미 (초1 '여러 가지 모양' 의 이름)
 *             2단계  삼각형·사각형·오각형·육각형·원 (초2) — '변이 다섯 개인 도형', '꼭짓점이 없는 도형'
 *                    처럼 성질로 묻는 문제와, 닮았지만 아닌 것(선이 끊어진 세모, 굽은 선이 섞인 네모,
 *                    길쭉한 동그라미)이 보기에 섞입니다. 틀리면 왜 아닌지 읽어 줍니다.
 *   solid : 입체 모양 - 물건(🎁 🥫 ⚽)을 보고 상자·둥근기둥·공 모양 중 고르고, '어느 쪽으로도 잘
 *           굴러가는 모양은?' 처럼 성질을 묻습니다. 단계 없음.
 *   stack : 쌓기나무 - 쌓은 나무가 모두 몇 개인지 셉니다.
 *             1단계  한 줄 (다 보입니다)
 *             2단계  두 줄 — 앞줄에 가려 안 보이는 것도 셉니다. 맞히면 앞줄이 흐려져 숨은 것이 보입니다.
 *
 * ⚠️ 모양은 매번 돌리고 찌그러뜨려 그립니다 (flatShape). 늘 똑바로 선 정삼각형만 보면
 *    '뒤집힌 세모는 세모가 아니다' 로 배웁니다 — 반듯하게 고치지 마세요.
 * ⚠️ 2단계의 닮은 것(끊어짐·굽은 선·길쭉함)은 '이름으로 찾기' 에만 넣습니다. 성질로 묻는 문제에
 *    넣으면 '꼭짓점이 없는 도형' 에 원과 길쭉한 동그라미가 둘 다 맞아 정답이 둘이 됩니다.
 * ⚠️ 쌓기나무 두 줄은 '뒷줄이 앞줄보다 낮지 않게' 만 쌓습니다 (makeStack). 뒷줄이 더 낮으면
 *    통째로 가려서 있는지 없는지 그림으로 알 수 없습니다 — 교과서도 그런 그림은 안 냅니다.
 *    그리고 '쌓기나무는 공중에 떠 있지 않다' 가 숨은 것을 세는 근거라 틀리면 그 말을 해 줍니다.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];
  var KO_COUNT = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
                  '열한', '열두', '열세', '열네', '열다섯', '열여섯'];

  var ACTS = [
    { id: 'flat',  name: '평면 모양', icon: '🔺', desc: '이름을 듣고 모양을 찾아요',
      levels: [1, 2], names: ['세모·네모·동그라미', '삼각형·오각형·원 …'], def: 1 },
    { id: 'solid', name: '입체 모양', icon: '📦', desc: '물건은 어떤 모양일까요? 어떤 모양이 잘 굴러갈까요?',
      levels: [], names: [], def: 0 },
    { id: 'stack', name: '쌓기나무',  icon: '🧱', desc: '쌓기나무가 모두 몇 개인지 세어요',
      levels: [1, 2], names: ['한 줄', '두 줄 (숨은 것도)'], def: 1 }
  ];

  // 평면 모양. easy 는 1단계 이름(초1), name 은 2단계 이름(초2). sides 는 변(=꼭짓점) 수.
  var KINDS = {
    tri:    { sides: 3, easy: '세모',     name: '삼각형' },
    quad:   { sides: 4, easy: '네모',     name: '사각형' },
    pent:   { sides: 5, easy: null,       name: '오각형' },
    hex:    { sides: 6, easy: null,       name: '육각형' },
    circle: { sides: 0, easy: '동그라미', name: '원' }
  };
  var EASY_KINDS = ['tri', 'quad', 'circle'];
  var ALL_KINDS = ['tri', 'quad', 'pent', 'hex', 'circle'];
  var COLORS = ['#ff8fab', '#5eb1ff', '#ffb84d', '#6dd47e', '#b79bff', '#ff7b6b', '#3fc1c9'];

  // 입체 모양 (초1 '여러 가지 모양' 의 이름 그대로)
  var SOLIDS = [
    { id: 'box',  name: '상자 모양' },
    { id: 'cyl',  name: '둥근기둥 모양' },
    { id: 'ball', name: '공 모양' }
  ];

  // 물건 — 이모지가 기기마다 조금씩 달라도 모양이 헷갈리지 않는 것만 골랐습니다.
  var OBJECTS = [
    { emoji: '🎁', name: '선물 상자', solid: 'box' },
    { emoji: '📦', name: '택배 상자', solid: 'box' },
    { emoji: '🧊', name: '얼음',      solid: 'box' },
    { emoji: '🧱', name: '벽돌',      solid: 'box' },
    { emoji: '🎲', name: '주사위',    solid: 'box' },
    { emoji: '🥫', name: '통조림 캔', solid: 'cyl' },
    { emoji: '🥁', name: '북',        solid: 'cyl' },
    { emoji: '🧻', name: '두루마리 휴지', solid: 'cyl' },
    { emoji: '🕯️', name: '양초',      solid: 'cyl' },
    { emoji: '⚽', name: '축구공',    solid: 'ball' },
    { emoji: '🏀', name: '농구공',    solid: 'ball' },
    { emoji: '🎾', name: '테니스공',  solid: 'ball' },
    { emoji: '🔮', name: '구슬',      solid: 'ball' },
    { emoji: '🏐', name: '배구공',    solid: 'ball' }
  ];

  // 성질로 묻기 — 셋 중 하나만 맞는 것만 씁니다.
  // (둥근기둥도 눕히면 굴러가므로 '굴러가는 모양' 은 못 씁니다 — '어느 쪽으로 굴려도' 여야 공 하나)
  var PROPS = [
    { q: '어느 쪽으로 굴려도 잘 굴러가는 모양은?', solid: 'ball' },
    { q: '평평한 곳이 하나도 없는 모양은?', solid: 'ball' },
    { q: '잘 굴러가지 않는 모양은?', solid: 'box' },
    { q: '뾰족한 곳이 있는 모양은?', solid: 'box' },
    { q: '어느 쪽으로 놓아도 잘 쌓을 수 있는 모양은?', solid: 'box' },
    { q: '눕히면 굴러가고, 세우면 쌓을 수 있는 모양은?', solid: 'cyl' },
    { q: '평평한 곳과 둥근 곳이 둘 다 있는 모양은?', solid: 'cyl' }
  ];

  var act = findAct(UI.getParam('act')) || ACTS[0];
  var BEST_KEY = 'daniland.best.shape.' + act.id;
  var LEVEL_KEY = 'daniland.shape.' + act.id;

  var el = {
    stage: document.getElementById('stage'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    questLabel: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

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
    answer: null,
    prompt: '',
    say: '',            // 맞혔을 때 읽는 말
    hint: '',           // 틀렸을 때 덧붙이는 말 (쌓기나무 두 줄)
    plan: [],           // 입체 모양의 문제 차례
    last: null,         // 바로 앞 문제의 정답 (같은 것이 연달아 안 나오게)
    firstTry: true,
    locked: false
  };

  if (!window.TTS || !TTS.supported) {
    el.voiceBtn.hidden = true;
    el.speakBtn.hidden = true;
  }

  document.body.classList.add('act-' + act.id);
  document.title = act.name + ' · 다니랜드 🔺';
  el.startTitle.textContent = act.icon + ' ' + act.name;
  el.modeDesc.textContent = act.desc;
  buildLevelRow();

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
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '세모를 찾아요'; } });
  });

  var back = Catalog.backHref('shape.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endModes, back);
  bindGo(el.endHome, 'index.html');

  document.addEventListener('keydown', function (e) {
    if (!el.startOverlay.hidden || !el.endOverlay.hidden || VoicePicker.isOpen()) return;
    var n = parseInt(e.key, 10);
    if (!n || n < 1 || n > 4) return;
    var card = el.cards.children[n - 1];
    if (card) card.click();
  });

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
      b.textContent = act.names[i];
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

  /* ---------- 게임 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    state.last = null;
    if (act.id === 'solid') state.plan = solidPlan();
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    if (window.TTS) TTS.cancel();
    el.stage.innerHTML = '';
    el.cards.innerHTML = '';
    state.firstTry = true;
    state.locked = false;
    state.say = '';
    state.hint = '';

    if (act.id === 'flat') makeFlat();
    else if (act.id === 'solid') makeSolid();
    else makeStack();

    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  function step() { return ' (' + (state.round + 1) + '/' + ROUNDS + ')'; }

  /* ---------- 🔺 평면 모양 ---------- */

  function makeFlat() {
    var easy = state.level === 1;
    var kinds = easy ? EASY_KINDS : ALL_KINDS;
    var target = pickNew(kinds);
    var byProp = !easy && Math.random() < 0.4;
    var list;

    if (byProp) {
      // 성질로 묻기 — 보기는 서로 다른 모양 넷 (닮은 것은 안 넣습니다, 맨 위 주석)
      var others = UI.shuffle(kinds.filter(function (k) { return k !== target; })).slice(0, 3);
      list = [target].concat(others).map(function (k) { return shapeItem(k, null); });
      var n = KINDS[target].sides;
      var ask = target === 'circle' ? '꼭짓점이 없는 도형'
              : (Math.random() < 0.5 ? '변이 ' : '꼭짓점이 ') + KO_COUNT[n] + ' 개인 도형';
      state.prompt = ask + '을 찾아요.';
      el.questLabel.textContent = ask + '은?' + step();
    } else {
      list = [shapeItem(target, null)];
      // 2단계는 닮았지만 아닌 것을 하나 섞습니다 (셋에 둘꼴)
      if (!easy && Math.random() < 0.7) list.push(shapeItem(target, pick(fakesOf(target))));
      while (list.length < 4) {
        var k = pick(kinds.filter(function (x) { return x !== target; }));
        list.push(shapeItem(k, null));
      }
      var nm = kindName(target);
      state.prompt = nm + eul(nm) + ' 찾아요.';
      el.questLabel.textContent = nm + eul(nm) + ' 찾아요' + step();
    }

    state.answer = list[0];
    var K = KINDS[target];
    state.say = easy ? K.easy + '!'
              : target === 'circle' ? '원! 꼭짓점이 없어요.'
              : K.name + '! 변이 ' + KO_COUNT[K.sides] + ' 개, 꼭짓점이 ' + KO_COUNT[K.sides] + ' 개예요.';

    // 1단계는 색을 채우고, 2단계는 선으로만 그립니다 — 끊어진 모양은 색을 채울 수가 없어서
    // 그것만 비어 있으면 보자마자 티가 납니다.
    renderCards(list, function (it) { return flatSvg(it, !easy); }, 'shape-cards');
  }

  // 모양 하나 = { kind, fake } — fake 는 null(진짜) · 'open'(끊어짐) · 'curve'(굽은 선) · 'long'(길쭉한 원)
  function shapeItem(kind, fake) { return { kind: kind, fake: fake }; }

  function fakesOf(kind) { return kind === 'circle' ? ['long', 'open'] : ['open', 'curve']; }

  function kindName(k) { return state.level === 1 ? KINDS[k].easy : KINDS[k].name; }

  // 틀렸을 때 — 고른 것이 무엇인지 (닮은 것이면 왜 아닌지) 읽어 줍니다.
  function flatWhy(it) {
    var nm = kindName(it.kind);
    if (it.fake === 'open') return '선이 끊어져 있어서 ' + nm + ieoga(nm) + ' 아니에요.';
    if (it.fake === 'curve') return '굽은 선이 있어서 ' + nm + ieoga(nm) + ' 아니에요.';
    if (it.fake === 'long') return '길쭉해서 원이 아니에요. 원은 어느 쪽으로 보아도 똑같이 동그래요.';
    return '그건 ' + nm + ieyo(nm) + '.';
  }

  // 모양 그림 한 장. 꼭짓점은 타원 위에 돌아가며 놓되 간격을 흔들고 통째로 돌립니다 —
  // 그래야 볼록하면서도 매번 다른 모양이 나옵니다 (맨 위 주석).
  function flatSvg(it, outline) {
    var color = pick(COLORS);
    var paint = outline
      ? 'fill="none" stroke="' + color + '" stroke-width="6"'
      : 'fill="' + color + '" stroke="#40323a" stroke-width="3"';
    var s = '<svg class="shape-svg" viewBox="-60 -60 120 120" aria-hidden="true">';
    var turn = Math.random() * 360;

    if (it.kind === 'circle') {
      if (it.fake === 'long') {
        s += '<ellipse rx="50" ry="' + f(24 + Math.random() * 8) + '" transform="rotate(' + f(turn) + ')" ' + paint + ' stroke-linejoin="round"/>';
      } else if (it.fake === 'open') {
        // 한 군데가 끊어진 동그라미 (호)
        var a0 = turn * Math.PI / 180, a1 = a0 + Math.PI * 1.75;
        s += '<path d="M' + f(Math.cos(a0) * 44) + ' ' + f(Math.sin(a0) * 44) + ' A44 44 0 1 1 ' +
             f(Math.cos(a1) * 44) + ' ' + f(Math.sin(a1) * 44) + '" fill="none" stroke="' + color +
             '" stroke-width="' + (outline ? 6 : 5) + '" stroke-linecap="round"/>';
      } else {
        s += '<circle r="' + (outline ? 44 : 46) + '" ' + paint + '/>';
      }
      return s + '</svg>';
    }

    var pts = polygon(KINDS[it.kind].sides, turn);
    var d;
    if (it.fake === 'open') {
      // 마지막 변의 가운데가 비어 있습니다
      var p = pts[pts.length - 1], q = pts[0];
      var g1 = lerp(p, q, 0.3), g2 = lerp(p, q, 0.7);
      d = 'M' + pt(g2);
      for (var i = 0; i < pts.length; i++) d += ' L' + pt(pts[i]);
      d += ' L' + pt(g1);
      return s + '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    }
    d = 'M' + pt(pts[0]);
    for (var j = 1; j < pts.length; j++) d += ' L' + pt(pts[j]);
    if (it.fake === 'curve') {
      // 마지막 변을 바깥으로 불룩한 굽은 선으로
      var a = pts[pts.length - 1], b = pts[0], m = lerp(a, b, 0.5);
      var len = Math.sqrt(m[0] * m[0] + m[1] * m[1]) || 1;
      var c = [m[0] + m[0] / len * 26, m[1] + m[1] / len * 26];
      d += ' Q' + pt(c) + ' ' + pt(b);
    }
    d += ' Z';
    return s + '<path d="' + d + '" ' + paint + ' stroke-linejoin="round"/></svg>';
  }

  // k 각형의 꼭짓점을 만들고, 가로세로 -46~46 안에 들어오게 늘이거나 줄입니다.
  function polygon(k, turn) {
    var stepA = Math.PI * 2 / k;
    var ry = 0.6 + Math.random() * 0.4;          // 납작한 정도 (1 이면 반듯)
    var rot = turn * Math.PI / 180;
    var pts = [];
    for (var i = 0; i < k; i++) {
      var a = i * stepA + (Math.random() - 0.5) * stepA * 0.4;
      var x = Math.cos(a), y = Math.sin(a) * ry;
      pts.push([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    var minX = 9, maxX = -9, minY = 9, maxY = -9;
    pts.forEach(function (p) {
      minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
    });
    var scale = 88 / Math.max(maxX - minX, maxY - minY);
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return pts.map(function (p) { return [(p[0] - cx) * scale, (p[1] - cy) * scale]; });
  }

  function lerp(p, q, t) { return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; }
  function pt(p) { return f(p[0]) + ' ' + f(p[1]); }

  /* ---------- 📦 입체 모양 ---------- */

  // 열 문제 = 물건 여섯(모양마다 둘) + 성질 넷, 섞어서.
  function solidPlan() {
    var plan = [];
    SOLIDS.forEach(function (sd) {
      UI.shuffle(OBJECTS.filter(function (o) { return o.solid === sd.id; })).slice(0, 2)
        .forEach(function (o) { plan.push({ obj: o }); });
    });
    UI.shuffle(PROPS.slice()).slice(0, ROUNDS - plan.length)
      .forEach(function (p) { plan.push({ prop: p }); });
    return UI.shuffle(plan);
  }

  function makeSolid() {
    var q = state.plan[state.round];
    var ansId = q.obj ? q.obj.solid : q.prop.solid;
    state.answer = findSolid(ansId);

    var big = document.createElement('div');
    if (q.obj) {
      big.className = 'shape-object';
      big.textContent = q.obj.emoji;
      state.prompt = q.obj.name + eunneun(q.obj.name) + ' 어떤 모양일까요?';
      el.questLabel.textContent = q.obj.name + eunneun(q.obj.name) + ' 어떤 모양?' + step();
      state.say = q.obj.name + eunneun(q.obj.name) + ' ' + state.answer.name + '!';
    } else {
      big.className = 'shape-prop';
      big.textContent = q.prop.q;
      state.prompt = q.prop.q.replace(/\?$/, '') + '을 찾아요.';
      el.questLabel.textContent = '어떤 모양일까요?' + step();
      state.say = state.answer.name + '!';
    }
    el.stage.appendChild(big);

    renderCards(SOLIDS.slice(), function (sd) {
      return solidSvg(sd.id) + '<div class="shape-name">' + sd.name + '</div>';
    }, 'solid-cards');
  }

  function findSolid(id) {
    for (var i = 0; i < SOLIDS.length; i++) if (SOLIDS[i].id === id) return SOLIDS[i];
    return null;
  }

  // 상자·둥근기둥·공 그림 — 빛이 왼쪽 위에서 온다고 보고 면마다 밝기를 달리합니다.
  function solidSvg(id) {
    var s = '<svg class="solid-svg" viewBox="-50 -50 100 100" aria-hidden="true">';
    if (id === 'box') {
      s += '<polygon points="-34,-12 16,-12 16,38 -34,38" fill="#ffb84d" stroke="#8a5a2b" stroke-width="2" stroke-linejoin="round"/>' +
           '<polygon points="-34,-12 -14,-32 36,-32 16,-12" fill="#ffd79a" stroke="#8a5a2b" stroke-width="2" stroke-linejoin="round"/>' +
           '<polygon points="16,-12 36,-32 36,18 16,38" fill="#e0953a" stroke="#8a5a2b" stroke-width="2" stroke-linejoin="round"/>';
    } else if (id === 'cyl') {
      s += '<path d="M-26,-28 L-26,30 A26 9 0 0 0 26,30 L26,-28" fill="#5eb1ff" stroke="#2f6fa8" stroke-width="2"/>' +
           '<ellipse cx="0" cy="-28" rx="26" ry="9" fill="#a9d6ff" stroke="#2f6fa8" stroke-width="2"/>' +
           '<rect x="-18" y="-18" width="6" height="42" rx="3" fill="#fff" opacity="0.35"/>';
    } else {
      s += '<circle r="38" fill="#ff8fab" stroke="#c4506f" stroke-width="2"/>' +
           '<ellipse cx="-13" cy="-14" rx="11" ry="8" fill="#fff" opacity="0.55"/>';
    }
    return s + '</svg>';
  }

  /* ---------- 🧱 쌓기나무 ---------- */

  // 1단계: 한 줄에 2~4 기둥, 높이 1~3 (모두 3~9개)
  // 2단계: 두 줄 × 2~3 기둥. 뒷줄은 앞줄보다 낮지 않게 (맨 위 주석), 앞줄에 가려진 것이 적어도 하나. 모두 4~12개
  function makeStack() {
    var rows, total, hidden, guard = 0;
    do {
      rows = state.level === 1 ? oneRow() : twoRows();
      total = sum(rows);
      hidden = state.level === 1 ? 1 : hiddenCount(rows);
    } while ((total === state.last || hidden < 1 || total < 3 || total > 12) && ++guard < 50);

    state.last = total;
    state.answer = total;
    state.prompt = '쌓기나무가 모두 몇 개일까요?';
    el.questLabel.textContent = '쌓기나무는 모두 몇 개?' + step();
    state.say = '모두 ' + KO_COUNT[total] + ' 개!';
    if (state.level === 2) {
      state.hint = '앞에 가려서 안 보이는 것도 세어 봐요. 쌓기나무는 공중에 떠 있지 않아요.';
    }

    var box = document.createElement('div');
    box.className = 'stack-box';
    box.innerHTML = stackSvg(rows);
    el.stage.appendChild(box);

    var list = [total];
    [total - 1, total + 1, total - 2, total + 2, total - 3, total + 3].forEach(function (n) {
      if (list.length < 4 && n >= 1) list.push(n);
    });
    // 두 줄에서 가장 흔한 실수 — 보이는 것만 센 수 — 를 보기에 꼭 넣습니다
    if (state.level === 2) {
      var seen = total - hidden;
      if (list.indexOf(seen) < 0) list[3] = seen;
    }
    renderCards(list, function (n) { return '<div class="num">' + n + '</div>'; }, 'num-cards stack-cards');
  }

  // rows[0] = 앞줄, rows[1] = 뒷줄. 기둥마다 높이.
  function oneRow() {
    var n = UI.randInt(2, 4), row = [];
    for (var i = 0; i < n; i++) row.push(UI.randInt(1, 3));
    return [row];
  }

  function twoRows() {
    var n = UI.randInt(2, 3), front = [], backRow = [];
    for (var i = 0; i < n; i++) {
      var f0 = UI.randInt(0, 2);
      var b0 = UI.randInt(Math.max(1, f0), 3);
      front.push(f0);
      backRow.push(b0);
    }
    return [front, backRow];
  }

  // 통째로 가려 한 조각도 안 보이는 뒷줄 나무 수. 뒷줄 나무는 세 면(앞·위·오른쪽)이 다 막혀야 숨습니다 —
  //   앞면: 앞줄 기둥이 그 높이까지 있음    위: 바로 위에 나무가 있음 (기둥 맨 위는 윗면이 보입니다)
  //   오른쪽: 오른쪽 뒷기둥이 그 높이까지 있음 (맨 오른쪽 기둥은 옆면이 보입니다)
  // 보기에 '보이는 것만 센 수' 를 넣을 때 씁니다.
  function hiddenCount(rows) {
    var front = rows[0], backRow = rows[1], n = 0;
    for (var x = 0; x < front.length; x++) {
      for (var z = 0; z < front[x] && z < backRow[x] - 1; z++) {
        if (x + 1 < backRow.length && backRow[x + 1] > z) n += 1;
      }
    }
    return n;
  }

  function sum(rows) {
    var t = 0;
    rows.forEach(function (r) { r.forEach(function (h) { t += h; }); });
    return t;
  }

  // 비스듬히 본 그림(사투상) — 앞면은 정사각형, 깊이는 오른쪽 위로.
  // 뒷줄부터, 왼쪽부터, 아래부터 그리면 가까운 것이 먼 것을 덮습니다 (화가 알고리즘).
  // 앞줄은 <g class="front"> 로 묶어 두고, 맞히면 흐리게 해서 숨은 나무를 보여 줍니다.
  function stackSvg(rows) {
    var S = 40, DX = 26, DY = 22;          // 깊이를 반 칸보다 얕게 잡으면 뒷줄이 앞줄 위에 얹힌 것처럼 읽힙니다
    var cols = 0;
    rows.forEach(function (r) { cols = Math.max(cols, r.length); });
    var maxH = 0;
    rows.forEach(function (r) { r.forEach(function (h) { maxH = Math.max(maxH, h); }); });
    var depth = rows.length;

    var w = cols * S + depth * DX + 8, h = maxH * S + depth * DY + 8;
    var s = '<svg class="stack-svg" viewBox="-4 ' + f(-h + 4) + ' ' + f(w) + ' ' + f(h) + '" ' +
            'style="aspect-ratio:' + f(w) + '/' + f(h) + '" aria-hidden="true">';

    for (var y = depth - 1; y >= 0; y--) {
      s += '<g class="' + (y === 0 && depth > 1 ? 'front' : 'row') + '">';
      var row = rows[y];
      for (var x = 0; x < row.length; x++) {
        for (var z = 0; z < row[x]; z++) s += cube(x * S + y * DX, -z * S - y * DY, S, DX, DY, y > 0);
      }
      s += '</g>';
    }
    return s + '</svg>';
  }

  // (x0, y0) 는 앞면의 왼쪽 아래 꼭짓점. far 면 뒷줄 — 조금 어둡게 칠해 멀리 있는 것이 보이게 합니다.
  function cube(x0, y0, S, DX, DY, far) {
    var st = ' stroke="#8a5a2b" stroke-width="2" stroke-linejoin="round"';
    var front = [[x0, y0], [x0 + S, y0], [x0 + S, y0 - S], [x0, y0 - S]];
    var top = [[x0, y0 - S], [x0 + S, y0 - S], [x0 + S + DX, y0 - S - DY], [x0 + DX, y0 - S - DY]];
    var side = [[x0 + S, y0], [x0 + S + DX, y0 - DY], [x0 + S + DX, y0 - S - DY], [x0 + S, y0 - S]];
    return '<polygon points="' + poly(side) + '" fill="' + (far ? '#c98a42' : '#d99a4e') + '"' + st + '/>' +
           '<polygon points="' + poly(top) + '" fill="' + (far ? '#f5d396' : '#ffe0a8') + '"' + st + '/>' +
           '<polygon points="' + poly(front) + '" fill="' + (far ? '#e8b167' : '#f6c27a') + '"' + st + '/>';
  }

  function poly(ps) { return ps.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' '); }

  /* ---------- 보기 · 정답 ---------- */

  function renderCards(list, inner, kind) {
    el.cards.innerHTML = '';
    el.cards.className = 'cards shape-choices ' + kind;

    UI.shuffle(list.slice()).forEach(function (it) {
      var card = document.createElement('button');
      card.className = 'choice' + (typeof it === 'number' ? ' num-card' : '');
      card.innerHTML = inner(it);
      card.addEventListener('click', function () { choose(card, it); });
      el.cards.appendChild(card);
    });
  }

  function choose(card, it) {
    if (state.locked || card.classList.contains('dim')) return;

    if (it === state.answer) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      card.classList.add('correct');
      UI.addMark(card, '⭕');
      UI.confettiAt(card);
      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 쌓기나무 두 줄 — 앞줄을 흐리게 해서 숨어 있던 나무를 보여 줍니다
      var box = el.stage.querySelector('.stack-box');
      if (box) box.classList.add('peek');

      speak(state.say);
      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';
      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, box && state.level === 2 ? 2600 : 2000);

    } else {
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      card.classList.add('wrong');
      setTimeout(function () {
        card.classList.remove('wrong');
        card.classList.add('dim');
      }, 400);
      setTimeout(function () { speak(wrongSay(it)); }, 500);
    }
  }

  function wrongSay(it) {
    if (act.id === 'flat') return flatWhy(it) + ' 다시 찾아 봐요.';
    if (act.id === 'solid') return '그건 ' + it.name + ieyo(it.name) + '. 다시 골라 봐요.';
    return (state.hint || '다시 세어 봐요.');
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

  /* ---------- 글자 · 소리 ---------- */

  // 끝 글자 받침으로 조사를 고릅니다 ('삼각형을 · 세모를', '얼음은 · 주사위는').
  function hasBatchim(word) {
    var c = word.charCodeAt(word.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return false;
    return (c - 0xac00) % 28 !== 0;
  }
  function eul(w) { return hasBatchim(w) ? '을' : '를'; }
  function eunneun(w) { return hasBatchim(w) ? '은' : '는'; }
  function ieoga(w) { return hasBatchim(w) ? '이' : '가'; }
  function ieyo(w) { return hasBatchim(w) ? '이에요' : '예요'; }

  // 같은 정답이 연달아 나오지 않게
  function pickNew(list) {
    var k, guard = 0;
    do { k = pick(list); } while (k === state.last && ++guard < 20);
    state.last = k;
    return k;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function f(x) { return (Math.round(x * 10) / 10).toString(); }

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
