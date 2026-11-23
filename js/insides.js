/* =========================================================================
 * 다니랜드 - 우리 몸 (insides.html)
 *
 * 몸 속을 들여다보는 과학 화면입니다. 사진·그림 파일 없이 **모두 캔버스에 그립니다** —
 * 몸 모양(drawBody) 위에 소화 기관(입·식도·위·작은창자·큰창자)과 허파·심장·핏줄을 얹습니다.
 * 좌표는 전부 '몸 단위'(머리 꼭대기 0 ~ 발끝 1, 가운데 0)이고 cam 이 화면에 맞춥니다.
 * 그림은 앞에서 본 모습이라 **몸의 왼쪽이 화면 오른쪽**입니다 — 심장·위가 화면 오른쪽에 있는 게 맞습니다.
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   food  : 음식의 여행 - 고른 음식이 입에서 똥까지 갑니다. 곳마다 단추를 눌러 직접 씹고·삼키고·섞습니다 (점수 없음, 🍽️ n/4)
 *   heart : 심장과 피  - 잘 때·쉴 때·달릴 때 심장이 진짜 빠르기(1분에 몇 번)로 뛰고, 피가 허파와 온몸을 돕니다.
 *                         '내가 심장' 은 누를 때만 피가 밀려 나갑니다 (점수 없음)
 *   quiz  : 퀴즈       - 보기 넉 장 (QUIZ, 첫 보기가 정답). 맞히면 그 기관에 이름표가 붙습니다 — 미리 붙이면 답이 보여서요.
 *
 * 피 색깔: 산소가 많은 피는 밝은 빨강, 산소를 나눠 준 피는 어두운 빨강입니다. **파랗게 그리지 마세요** —
 * 진짜 피는 늘 빨갛고, 그것을 퀴즈로도 묻습니다.
 *
 * 기록 키는 daniland.best.insides(카드의 ⭐)·daniland.best.insides.quiz,
 * 마지막 놀이·음식은 daniland.insidesAct · daniland.insidesFood, 끝까지 먹어 본 음식은 daniland.insides.ate.
 * ========================================================================= */

(function () {
  var LANG = 'ko-KR';
  var QUIZ_ROUNDS = 10;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '꼬마 과학자!'];

  var BEST_KEY = 'daniland.best.insides';
  var ACT_KEY = 'daniland.insidesAct';
  var FOOD_KEY = 'daniland.insidesFood';
  var ATE_KEY = 'daniland.insides.ate';

  var ACTS = [
    { id: 'food',  name: '음식의 여행', icon: '🍽️', desc: '먹은 음식이 입에서 똥이 될 때까지 따라가요' },
    { id: 'heart', name: '심장과 피',   icon: '❤️', desc: '심장이 쿵쿵 뛰면 피가 온몸을 돌아요' },
    { id: 'quiz',  name: '퀴즈',        icon: '❓', desc: '우리 몸에 대해 물어봐요' }
  ];

  // 음식 — c 는 씹은 덩어리 색, nutri 는 작은창자에서 읽는 말(그 음식에서 나오는 영양분)
  var FOODS = [
    { id: 'rice', name: '밥', icon: '🍚', c: '#f3ecd9',
      chew: ' 밥을 오래 씹으면 단맛이 나요. 침이 밥을 녹이기 시작해서요.',
      nutri: '밥에서는 힘을 내는 영양분이 나와요. 그래서 밥을 먹으면 뛰어놀 힘이 생겨요.' },
    { id: 'apple', name: '사과', icon: '🍎', c: '#f2d98a', chew: '',
      nutri: '사과에서는 몸을 튼튼하게 하는 비타민이 나와요. 껍질 같은 섬유질은 녹지 않고 큰창자로 가서 똥을 부드럽게 해 줘요.' },
    { id: 'egg', name: '달걀', icon: '🥚', c: '#f6d35a', chew: '',
      nutri: '달걀에서는 몸을 자라게 하는 단백질이 나와요. 키가 크고 근육이 생겨요.' },
    { id: 'carrot', name: '당근', icon: '🥕', c: '#f39a3a', chew: '',
      nutri: '당근에서는 눈을 건강하게 하는 비타민 A 가 되는 영양분이 나와요.' }
  ];

  // 음식이 지나가는 곳 — seg 는 아래 ROUTE 의 이름, taps 가 있으면 그만큼 눌러야 하고 없으면 dur 초 동안 흘러갑니다
  var STEPS = [
    { id: 'mouth', name: '입', seg: 'mouth', focus: 'mouth', taps: 4, btn: '😋 꼭꼭 씹기',
      title: '👄 입 — 꼭꼭 씹어요',
      text: '이로 음식을 잘게 부숴요. 침이 나와서 촉촉하게 만들어요.',
      done: '잘게 부서졌어요!' },
    { id: 'eso', name: '식도', seg: 'eso', focus: 'eso', dur: 2.4, btn: '😮 꿀꺽',
      title: '식도 — 꿀꺽 내려가요',
      text: '삼키면 식도라는 길로 내려가요. 식도가 꾹꾹 밀어 내려 줘요.',
      doing: '꾹꾹 밀어 내려요',
      done: '식도가 밀어 주니까 물구나무를 서서 삼켜도 음식이 위로 가요.' },
    { id: 'stomach', name: '위', seg: 'stomach', focus: 'stomach', taps: 3, btn: '🤲 조물조물',
      title: '위 — 조물조물 섞어요',
      text: '위는 주머니예요. 조물조물 움직이며 시큼한 위액과 섞어요.',
      doing: '죽처럼 되어 가요',
      done: '죽처럼 됐어요! 위에서는 몇 시간쯤 머물러요.' },
    { id: 'small', name: '작은창자', seg: 'small', focus: 'small', dur: 6, btn: '✨ 쏙쏙',
      title: '작은창자 — 영양분을 빨아들여요',
      text: '구불구불 아주 긴 길이에요. 어른은 몇 미터나 돼서 접혀 있어요. 몸에 좋은 영양분을 쏙쏙 빨아들여 피로 보내요.',
      doing: '✨ 영양분이 피로 쏙쏙',
      done: '' },
    { id: 'large', name: '큰창자', seg: 'large', focus: 'large', dur: 4.5, btn: '💧 쭈욱',
      title: '큰창자 — 물을 빨아들여요',
      text: '남은 것에서 물을 빨아들여요. 그러면 점점 단단해져요.',
      doing: '💧 물을 쭈욱',
      done: '단단해져서 똥이 됐어요!' },
    { id: 'out', name: '똥', seg: 'out', focus: 'out', dur: 1.8, btn: '🚽 뿡!',
      title: '💩 똥 — 밖으로 나가요',
      text: '다 쓰고 남은 것은 똥이 되어 항문으로 나와요.',
      doing: '뿡! 💩',
      done: '먹은 것이 똥이 되어 나오기까지 하루쯤, 길면 이삼일 걸려요.' }
  ];

  // 심장과 피 — bpm·br 은 다섯 살 아이의 보통 빠르기(1분에 몇 번)입니다
  var MODES = [
    { id: 'rest',  name: '😌 쉴 때',   bpm: 95,  br: 24, title: '😌 쉴 때',
      text: '심장은 내 주먹만 해요. 쉬지 않고 쿵쿵 뛰면서 피를 온몸으로 보내요. 가슴 가운데에서 조금 왼쪽에 손을 대 보세요!' },
    { id: 'sleep', name: '😴 잘 때',   bpm: 75,  br: 20, title: '😴 잘 때',
      text: '잘 때는 몸이 쉬어서 심장도 숨도 천천히 해요. 그래도 멈추지는 않아요.' },
    { id: 'run',   name: '🏃 달릴 때', bpm: 160, br: 45, title: '🏃 달릴 때',
      text: '뛰면 근육이 산소를 많이 달라고 해요. 그래서 심장이 빨리 뛰고 숨도 헉헉 빨라져요.' },
    { id: 'pump',  name: '✋ 내가 심장', bpm: 0, br: 24, title: '✋ 내가 심장',
      text: '심장을 꾹꾹 눌러 보세요! 누를 때마다 피가 밀려 나가요. 안 누르면 피가 멈춰요 — 그래서 심장은 하루 종일 쉬지 않아요.' }
  ];

  // 퀴즈 — 첫 보기가 정답, o 는 맞힌 뒤 이름표를 붙일 곳
  var QUIZ = [
    { q: '이로 꼭꼭 씹어서 음식을 잘게 부수는 곳은?', choices: ['입', '위', '작은창자', '큰창자'], o: 'mouth',
      why: '입에서 이가 음식을 부수고 침이 촉촉하게 해요.' },
    { q: '입과 위를 잇는 길은?', choices: ['식도', '작은창자', '큰창자', '핏줄'], o: 'eso',
      why: '식도예요. 음식을 꾹꾹 밀어서 위로 내려보내요.' },
    { q: '음식을 위액과 섞어서 죽처럼 만드는 주머니는?', choices: ['위', '입', '심장', '허파'], o: 'stomach',
      why: '위가 조물조물 움직여서 죽처럼 만들어요.' },
    { q: '영양분을 빨아들이는 구불구불 아주 긴 길은?', choices: ['작은창자', '식도', '위', '심장'], o: 'small',
      why: '작은창자예요. 길어서 몸 속에 접혀 들어가 있어요.' },
    { q: '남은 물을 빨아들여 똥을 단단하게 만드는 곳은?', choices: ['큰창자', '위', '식도', '입'], o: 'large',
      why: '큰창자가 물을 빨아들여서 똥이 단단해져요.' },
    { q: '물구나무를 서서 삼켜도 음식이 위로 갈까요?', choices: ['네, 식도가 밀어 줘요', '아니요, 입으로 나와요', '아니요, 목에 멈춰요', '머리로 가요'], o: 'eso',
      why: '식도가 꾹꾹 밀어 내려서 거꾸로 있어도 위로 가요.' },
    { q: '밥을 오래 씹으면 어떤 맛이 날까요?', choices: ['단맛', '짠맛', '신맛', '쓴맛'], o: 'mouth',
      why: '침이 밥을 녹여서 단맛이 나요.' },
    { q: '먹은 것이 똥이 되어 나오기까지 얼마나 걸릴까요?', choices: ['하루쯤', '1분', '10분', '1년'], o: 'large',
      why: '하루쯤, 길면 이삼일 걸려요.' },
    { q: '작은창자가 빨아들인 영양분은 어디로 갈까요?', choices: ['피', '허파', '똥', '침'], o: 'small',
      why: '영양분은 피를 타고 온몸으로 가요.' },
    { q: '피를 온몸으로 밀어 보내는 펌프는?', choices: ['심장', '위', '허파', '큰창자'], o: 'heart',
      why: '심장이 쿵쿵 뛰면서 피를 밀어 보내요.' },
    { q: '심장은 얼마만 할까요?', choices: ['내 주먹만 해요', '수박만 해요', '콩알만 해요', '내 머리만 해요'], o: 'heart',
      why: '심장은 내 주먹만 해요. 몸이 크면 심장도 같이 커요.' },
    { q: '달리기를 하면 심장은 어떻게 될까요?', choices: ['더 빨리 뛰어요', '멈춰요', '더 느려져요', '그대로예요'], o: 'heart',
      why: '근육이 산소를 많이 달라고 해서 심장이 빨리 뛰어요.' },
    { q: '잘 때 심장은 어떻게 될까요?', choices: ['천천히 뛰어요', '멈춰요', '아주 빨리 뛰어요', '아침까지 쉬어요'], o: 'heart',
      why: '잘 때도 심장은 천천히 계속 뛰어요.' },
    { q: '피가 산소를 받아 오는 곳은?', choices: ['허파', '위', '큰창자', '입'], o: 'lungs',
      why: '숨을 들이쉬면 허파에서 피가 산소를 받아요.' },
    { q: '산소를 나눠 주고 돌아오는 피는 무슨 색일까요?', choices: ['어두운 빨간색', '파란색', '초록색', '노란색'], o: 'vessels',
      why: '그림에서 파랗게 그리기도 하지만 진짜 피는 늘 빨개요. 산소가 적으면 어두운 빨간색이에요.' },
    { q: '피가 지나가는 길을 무엇이라고 할까요?', choices: ['핏줄', '식도', '창자', '허파'], o: 'vessels',
      why: '핏줄이 온몸 구석구석까지 뻗어 있어요.' },
    { q: '달리면 숨은 어떻게 될까요?', choices: ['빨라져요', '멈춰요', '느려져요', '그대로예요'], o: 'lungs',
      why: '산소가 많이 필요해서 숨을 헉헉 빨리 쉬어요.' }
  ];

  var el = {
    stage: document.getElementById('stage'),
    canvas: document.getElementById('canvas'),
    say: document.getElementById('say'),
    steps: document.getElementById('steps'),
    ctrl: document.getElementById('ctrl'),
    story: document.getElementById('story'),
    storyTitle: document.getElementById('storyTitle'),
    storyText: document.getElementById('storyText'),
    nextBtn: document.getElementById('nextBtn'),
    label: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    backBtn: document.getElementById('backBtn'),
    voiceBtn: document.getElementById('voiceBtn'),

    startOverlay: document.getElementById('startOverlay'),
    modeRow: document.getElementById('modeRow'),
    modeDesc: document.getElementById('modeDesc'),
    kindHint: document.getElementById('kindHint'),
    kindRow: document.getElementById('kindRow'),
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

  var ctx = el.canvas.getContext('2d');

  /* ---------- 상태 ---------- */

  var state = {
    act: UI.loadValue(ACT_KEY) || 'food',
    food: UI.loadValue(FOOD_KEY) || 'rice',
    view: 'idle',          // 지금 그리는 화면 — idle·food·heart·quiz
    playing: false,
    round: 0,
    stars: 0,
    firstTry: true,
    locked: false,
    deck: [],
    prompt: '',
    reveal: null,          // 퀴즈에서 맞힌 뒤 이름표를 붙일 곳
    ate: loadList(ATE_KEY)
  };

  if (!findById(ACTS, state.act)) state.act = 'food';
  if (!findById(FOODS, state.food)) state.food = 'rice';

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function loadList(key) {
    try {
      var v = JSON.parse(UI.loadValue(key) || '[]');
      return (v && v.length) ? v : [];
    } catch (e) { return []; }
  }

  function markAte(id) {
    if (state.ate.indexOf(id) >= 0) return;
    state.ate.push(id);
    UI.saveValue(ATE_KEY, JSON.stringify(state.ate));
  }

  /* ---------- 길 (몸 단위) ---------- */

  function mkPath(pts) {
    var L = [0];
    for (var i = 1; i < pts.length; i++) {
      L.push(L[i - 1] + Math.sqrt(Math.pow(pts[i][0] - pts[i - 1][0], 2) + Math.pow(pts[i][1] - pts[i - 1][1], 2)));
    }
    return { p: pts, L: L, len: L[L.length - 1] };
  }

  function at(path, s) {
    var p = path.p, L = path.L;
    if (s <= 0) return p[0];
    if (s >= path.len) return p[p.length - 1];
    for (var i = 1; i < p.length; i++) {
      if (L[i] >= s) {
        var k = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
        return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k];
      }
    }
    return p[p.length - 1];
  }

  function atF(path, f) { return at(path, f * path.len); }

  // 길의 일부(f0~f1)만 점으로 — 식도가 조이는 자리처럼 조금만 칠할 때
  function subPts(path, f0, f1) {
    var out = [], n = 10;
    for (var i = 0; i <= n; i++) out.push(atF(path, f0 + (f1 - f0) * i / n));
    return out;
  }

  // 옆으로 d 만큼 비킨 길 — 동맥과 정맥을 나란히 그립니다
  function offsetPts(pts, d) {
    return pts.map(function (q, i) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
      return [q[0] - dy / l * d, q[1] + dx / l * d];
    });
  }

  // 작은창자 — 다섯 줄로 구불구불 접힙니다
  function smallIntestinePts() {
    var pts = [[0, 0.433], [0.022, 0.443], [0.045, 0.456], [0.058, 0.474]];
    var rows = [0.474, 0.49, 0.506, 0.522, 0.538];
    var x0 = -0.058, x1 = 0.058, dir = -1, r = 0.008;
    rows.forEach(function (y, ri) {
      var from = (dir < 0) ? x1 : x0, to = (dir < 0) ? x0 : x1;
      for (var k = 1; k <= 6; k++) pts.push([from + (to - from) * k / 6, y]);
      if (ri < rows.length - 1) {
        var side = (dir < 0) ? -1 : 1, ym = y + r;
        for (var t = 1; t < 6; t++) {
          var th = Math.PI * t / 6;
          pts.push([to + side * r * Math.sin(th), ym - r * Math.cos(th)]);
        }
      }
      dir = -dir;
    });
    pts.push([-0.074, 0.543], [-0.088, 0.545]);
    return pts;
  }

  var ROUTE = {
    mouth:   mkPath([[0, 0.152], [0, 0.19]]),
    eso:     mkPath([[0, 0.19], [0, 0.2], [0.004, 0.3], [0.012, 0.35], [0.03, 0.383]]),
    stomach: mkPath([[0.03, 0.383], [0.062, 0.386], [0.086, 0.4], [0.08, 0.421], [0.05, 0.429], [0.018, 0.428], [0, 0.433]]),
    small:   mkPath(smallIntestinePts()),
    large:   mkPath([[-0.088, 0.545], [-0.095, 0.52], [-0.097, 0.47], [-0.09, 0.455], [-0.06, 0.452], [0.06, 0.452],
                     [0.09, 0.455], [0.097, 0.47], [0.097, 0.53], [0.085, 0.555], [0.05, 0.562], [0.018, 0.566],
                     [0.004, 0.578], [0, 0.6]]),
    out:     mkPath([[0, 0.6], [0, 0.75]])
  };

  // 위 주머니 모양 — 길보다 조금 짧게(날문 앞에서 끊김)
  var STOMACH_SHAPE = [[0.03, 0.383], [0.062, 0.386], [0.086, 0.4], [0.08, 0.421], [0.05, 0.429], [0.02, 0.428]];

  var HEART = [0.018, 0.33];

  // 핏줄 — 심장에서 나가는 길(가운데 선). 동맥과 정맥은 이 선 양옆으로 나란히 그립니다.
  // lung 이 true 면 허파로 가는 길(나갈 때 어두운 피, 돌아올 때 밝은 피), 아니면 온몸(반대)
  var BRANCHES = [
    { id: 'lungL', lung: true, pts: [[0.004, 0.318], [-0.03, 0.302], [-0.062, 0.296], [-0.085, 0.31]] },
    { id: 'lungR', lung: true, pts: [[0.03, 0.315], [0.055, 0.3], [0.08, 0.296], [0.092, 0.312]] },
    { id: 'head', pts: [[0.008, 0.31], [0.0, 0.27], [-0.014, 0.22], [-0.016, 0.17], [-0.01, 0.11], [0, 0.055]] },
    { id: 'armL', pts: [[0.004, 0.31], [-0.04, 0.268], [-0.1, 0.255], [-0.135, 0.27], [-0.18, 0.41], [-0.205, 0.54]] },
    { id: 'armR', pts: [[0.03, 0.31], [0.062, 0.268], [0.11, 0.258], [0.14, 0.272], [0.18, 0.41], [0.205, 0.54]] },
    { id: 'belly', pts: [[0.014, 0.352], [0.006, 0.42], [0.0, 0.47], [-0.02, 0.5]] },
    { id: 'legL', pts: [[0.012, 0.355], [0.004, 0.45], [-0.004, 0.56], [-0.05, 0.6], [-0.068, 0.77], [-0.08, 0.95]] },
    { id: 'legR', pts: [[0.022, 0.355], [0.014, 0.45], [0.008, 0.56], [0.05, 0.6], [0.07, 0.77], [0.082, 0.95]] }
  ];

  var VESSEL_GAP = 0.0055;
  BRANCHES.forEach(function (b) {
    b.out = mkPath(offsetPts(b.pts, -VESSEL_GAP));
    b.back = mkPath(offsetPts(b.pts, VESSEL_GAP).slice().reverse());
  });

  var RED = '#e8303f';       // 산소가 많은 피
  var DARK = '#7d1f3c';      // 산소를 나눠 준 피 (파랗지 않습니다)

  /* ---------- 캔버스 ---------- */

  var W = 0, H = 0, dpr = 1;
  var pageEl = document.querySelector('.sci-page');

  function fit() {
    if (pageEl) pageEl.style.height = (document.documentElement.clientHeight || window.innerHeight) + 'px';
    var w = el.stage.clientWidth, h = el.stage.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h;
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.width = w + 'px';
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 무엇을 얼마나 보여 줄지(몸 단위 y0~y1) — 화면이 바뀌면 스르르 따라갑니다
  var cam = { y0: 0, y1: 0.68 };

  function camGoal() {
    if (state.view === 'heart') return { y0: -0.08, y1: 1.0 };   // 위에 말풍선 자리
    return { y0: 0.0, y1: 0.68 };
  }

  function frameFor(w, h) {
    var span = cam.y1 - cam.y0;
    var s = Math.min(h * 0.94 / span, w * 0.94 / 0.62);
    return { s: s, cx: w / 2, cy: h / 2 - ((cam.y0 + cam.y1) / 2) * s, w: w, h: h };
  }

  function X(f, x) { return f.cx + x * f.s; }
  function Y(f, y) { return f.cy + y * f.s; }

  function linePts(c, f, pts) {
    c.beginPath();
    pts.forEach(function (q, i) {
      if (i) c.lineTo(X(f, q[0]), Y(f, q[1]));
      else c.moveTo(X(f, q[0]), Y(f, q[1]));
    });
  }

  // 관 하나 — 테두리 색으로 조금 굵게, 그 위에 속 색
  function tube(c, f, pts, width, fill, edge) {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    linePts(c, f, pts);
    c.strokeStyle = edge;
    c.lineWidth = width * f.s + Math.max(2, f.s * 0.004);
    c.stroke();
    c.strokeStyle = fill;
    c.lineWidth = width * f.s;
    c.stroke();
  }

  function hexRgb(h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }

  function mix(a, b, t) {
    var A = hexRgb(a), B = hexRgb(b);
    t = Math.max(0, Math.min(1, t));
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
           Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }

  function emoji(c, ch, x, y, px) {
    c.save();
    c.font = Math.round(px) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(ch, x, y);
    c.restore();
  }

  /* =========================================================================
   * 그림
   * ========================================================================= */

  var SKIN = '#ffdcc4', SKIN_EDGE = '#e7b28f';

  function drawBackground(c, w, h) {
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fff3f4');
    g.addColorStop(1, '#eef7ff');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  function drawBody(c, f) {
    var s = f.s;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // 다리 · 팔 — 테두리 색으로 한 번, 살색으로 한 번
    function limb(pts, wd) {
      linePts(c, f, pts);
      c.strokeStyle = SKIN_EDGE; c.lineWidth = (wd + 0.008) * s; c.stroke();
      c.strokeStyle = SKIN; c.lineWidth = wd * s; c.stroke();
    }
    [-1, 1].forEach(function (k) {
      limb([[k * 0.062, 0.58], [k * 0.07, 0.77], [k * 0.078, 0.95]], 0.082);
      c.fillStyle = SKIN; c.strokeStyle = SKIN_EDGE; c.lineWidth = 0.004 * s;
      c.beginPath(); c.ellipse(X(f, k * 0.095), Y(f, 0.968), 0.042 * s, 0.022 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    });
    [-1, 1].forEach(function (k) {
      limb([[k * 0.13, 0.262], [k * 0.18, 0.41], [k * 0.205, 0.535]], 0.058);
      c.fillStyle = SKIN; c.strokeStyle = SKIN_EDGE; c.lineWidth = 0.004 * s;
      c.beginPath(); c.arc(X(f, k * 0.21), Y(f, 0.555), 0.033 * s, 0, Math.PI * 2); c.fill(); c.stroke();
    });

    // 목 · 몸통
    c.fillStyle = SKIN;
    c.fillRect(X(f, -0.032), Y(f, 0.18), 0.064 * s, 0.05 * s);
    c.beginPath();
    c.moveTo(X(f, -0.034), Y(f, 0.214));
    c.quadraticCurveTo(X(f, -0.125), Y(f, 0.22), X(f, -0.148), Y(f, 0.262));
    c.lineTo(X(f, -0.128), Y(f, 0.47));
    c.quadraticCurveTo(X(f, -0.142), Y(f, 0.56), X(f, -0.122), Y(f, 0.612));
    c.quadraticCurveTo(X(f, 0), Y(f, 0.64), X(f, 0.122), Y(f, 0.612));
    c.quadraticCurveTo(X(f, 0.142), Y(f, 0.56), X(f, 0.128), Y(f, 0.47));
    c.lineTo(X(f, 0.148), Y(f, 0.262));
    c.quadraticCurveTo(X(f, 0.125), Y(f, 0.22), X(f, 0.034), Y(f, 0.214));
    c.closePath();
    c.fillStyle = SKIN; c.fill();
    c.strokeStyle = SKIN_EDGE; c.lineWidth = 0.004 * s; c.stroke();
    // 몸 속이 보이는 창 — 살색보다 조금 연하게
    c.beginPath();
    c.ellipse(X(f, 0), Y(f, 0.42), 0.118 * s, 0.17 * s, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,248,242,0.75)';
    c.fill();

    // 머리
    [-1, 1].forEach(function (k) {
      c.beginPath(); c.arc(X(f, k * 0.088), Y(f, 0.115), 0.018 * s, 0, Math.PI * 2);
      c.fillStyle = SKIN; c.fill(); c.strokeStyle = SKIN_EDGE; c.stroke();
    });
    c.beginPath(); c.arc(X(f, 0), Y(f, 0.105), 0.088 * s, 0, Math.PI * 2);
    c.fillStyle = SKIN; c.fill(); c.strokeStyle = SKIN_EDGE; c.lineWidth = 0.004 * s; c.stroke();
    // 머리카락
    c.beginPath();
    c.arc(X(f, 0), Y(f, 0.1), 0.093 * s, Math.PI, Math.PI * 2);
    c.lineTo(X(f, 0.093), Y(f, 0.1));
    c.quadraticCurveTo(X(f, 0.06), Y(f, 0.045), X(f, 0), Y(f, 0.062));
    c.quadraticCurveTo(X(f, -0.06), Y(f, 0.045), X(f, -0.093), Y(f, 0.1));
    c.closePath();
    c.fillStyle = '#5b3a29';
    c.fill();
    // 눈 · 볼
    c.fillStyle = '#3a2a26';
    [-1, 1].forEach(function (k) {
      c.beginPath(); c.arc(X(f, k * 0.032), Y(f, 0.112), 0.009 * s, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = 'rgba(255,128,140,0.35)';
    [-1, 1].forEach(function (k) {
      c.beginPath(); c.arc(X(f, k * 0.052), Y(f, 0.138), 0.014 * s, 0, Math.PI * 2); c.fill();
    });
  }

  // 입 — open 0(웃는 입)~1(크게 벌린 입)
  function drawMouth(c, f, open, glow) {
    var s = f.s, x = X(f, 0), y = Y(f, 0.152);
    c.save();
    if (glow) { c.shadowColor = '#ffd23f'; c.shadowBlur = 16; }
    if (open < 0.05) {
      c.beginPath();
      c.arc(x, y - 0.006 * s, 0.018 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      c.strokeStyle = '#b5524f'; c.lineWidth = 0.005 * s; c.lineCap = 'round'; c.stroke();
    } else {
      c.beginPath();
      c.ellipse(x, y, 0.022 * s, (0.006 + 0.014 * open) * s, 0, 0, Math.PI * 2);
      c.fillStyle = '#9c2f3a'; c.fill();
      c.shadowBlur = 0;
      // 이 · 혀
      c.save();
      c.clip();
      c.fillStyle = '#fff';
      c.fillRect(x - 0.02 * s, y - (0.006 + 0.014 * open) * s, 0.04 * s, 0.006 * s);
      c.fillStyle = '#ef7d8a';
      c.beginPath(); c.ellipse(x, y + 0.012 * open * s, 0.014 * s, 0.007 * s, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    c.restore();
  }

  function drawLungs(c, f, a, breath) {
    var s = f.s;
    c.save();
    c.globalAlpha *= a;
    // 숨관 · 갈래
    tube(c, f, [[0, 0.195], [0, 0.262]], 0.011, '#f3d7d9', '#d8aeb3');
    tube(c, f, [[0, 0.26], [-0.03, 0.282]], 0.009, '#f3d7d9', '#d8aeb3');
    tube(c, f, [[0, 0.26], [0.03, 0.282]], 0.009, '#f3d7d9', '#d8aeb3');
    [[-0.066, 0.052, 0.078], [0.07, 0.046, 0.072]].forEach(function (L) {
      var rx = L[1] * (1 + 0.1 * breath), ry = L[2] * (1 + 0.07 * breath);
      var g = c.createRadialGradient(X(f, L[0]), Y(f, 0.29), 2, X(f, L[0]), Y(f, 0.305), ry * s);
      g.addColorStop(0, '#ffc6d0');
      g.addColorStop(1, '#f08da2');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(X(f, L[0]), Y(f, 0.305 + 0.01 * breath * 0.5), rx * s, ry * s, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#d9738a'; c.lineWidth = 0.003 * s; c.stroke();
    });
    c.restore();
  }

  // 심장 — 끝이 몸의 왼쪽 아래(화면 오른쪽 아래)를 향합니다. squeeze 는 뛸 때 오므라드는 정도
  function drawHeart(c, f, a, squeeze, glow) {
    var s = f.s, r = 0.04 * s * (1 - 0.13 * squeeze);
    c.save();
    c.globalAlpha *= a;
    c.translate(X(f, HEART[0]), Y(f, HEART[1]));
    // 굵은 핏줄 (대동맥 활)
    c.lineCap = 'round';
    c.strokeStyle = '#c92a3a'; c.lineWidth = 0.014 * s;
    c.beginPath(); c.moveTo(-0.004 * s, -0.02 * s); c.quadraticCurveTo(-0.01 * s, -0.06 * s, 0.022 * s, -0.052 * s);
    c.quadraticCurveTo(0.036 * s, -0.045 * s, 0.03 * s, -0.025 * s); c.stroke();
    c.rotate(-0.5);
    if (glow) { c.shadowColor = '#ffd23f'; c.shadowBlur = 18; }
    c.beginPath();
    c.moveTo(0, r * 1.05);
    c.bezierCurveTo(-r * 1.05, r * 0.45, -r * 1.15, -r * 0.55, -r * 0.5, -r * 0.8);
    c.bezierCurveTo(-r * 0.15, -r * 0.95, 0, -r * 0.7, 0, -r * 0.6);
    c.bezierCurveTo(0, -r * 0.7, r * 0.2, -r * 0.98, r * 0.55, -r * 0.8);
    c.bezierCurveTo(r * 1.15, -r * 0.5, r * 1.0, r * 0.45, 0, r * 1.05);
    var g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.2);
    g.addColorStop(0, '#ff6b78');
    g.addColorStop(1, '#c41f34');
    c.fillStyle = g;
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = '#931628'; c.lineWidth = Math.max(1.5, 0.003 * s); c.stroke();
    // 반짝
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath(); c.ellipse(-r * 0.45, -r * 0.4, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function drawVessels(c, f, a) {
    c.save();
    c.globalAlpha *= a;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    var w = Math.max(1.5, 0.007 * f.s);
    BRANCHES.forEach(function (b) {
      linePts(c, f, b.back.p);
      c.strokeStyle = b.lung ? RED : DARK; c.lineWidth = w; c.stroke();
      linePts(c, f, b.out.p);
      c.strokeStyle = b.lung ? DARK : RED; c.lineWidth = w; c.stroke();
    });
    c.restore();
  }

  // 소화 기관 — focus 가 있으면 그곳만 또렷하고 나머지는 흐립니다. squish 는 위가 조물조물하는 정도
  function drawGut(c, f, a, focus, squish) {
    function alphaOf(id) { return (!focus || focus === id || (focus === 'out' && id === 'large')) ? 1 : 0.45; }
    function glowOn(id) {
      if (focus === id || (focus === 'out' && id === 'large')) { c.shadowColor = '#ffd23f'; c.shadowBlur = 16; }
    }
    var s = f.s;

    // 큰창자 — 굵은 관에 마디 무늬
    c.save();
    c.globalAlpha = a * alphaOf('large');
    glowOn('large');
    tube(c, f, ROUTE.large.p, 0.026, '#eba584', '#c97a5b');
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(176,96,70,0.55)';
    c.lineWidth = Math.max(1, 0.0025 * s);
    for (var d = 0.012; d < ROUTE.large.len - 0.03; d += 0.016) {
      var p = at(ROUTE.large, d), q = at(ROUTE.large, d + 0.002);
      var dx = q[0] - p[0], dy = q[1] - p[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / l * 0.012, ny = dx / l * 0.012;
      c.beginPath();
      c.moveTo(X(f, p[0] + nx), Y(f, p[1] + ny));
      c.lineTo(X(f, p[0] - nx), Y(f, p[1] - ny));
      c.stroke();
    }
    c.restore();

    // 작은창자
    c.save();
    c.globalAlpha = a * alphaOf('small');
    glowOn('small');
    tube(c, f, ROUTE.small.p, 0.012, '#f7bdb0', '#d88d80');
    c.restore();

    // 위
    c.save();
    c.globalAlpha = a * alphaOf('stomach');
    glowOn('stomach');
    tube(c, f, STOMACH_SHAPE, 0.044 * (1 + 0.12 * squish), '#f3a39b', '#cf726c');
    c.restore();

    // 식도
    c.save();
    c.globalAlpha = a * alphaOf('eso');
    glowOn('eso');
    tube(c, f, ROUTE.eso.p, 0.015, '#efaaa4', '#cf7f78');
    c.restore();
  }

  // 이름표 — 기관에서 선을 그어 흰 상자에 이름
  var LABELS = {
    mouth:   { a: [0.022, 0.152], t: [0.2, 0.14],  n: '입' },
    eso:     { a: [0.002, 0.235], t: [-0.2, 0.215], n: '식도' },
    stomach: { a: [0.085, 0.405], t: [0.23, 0.385], n: '위' },
    small:   { a: [-0.035, 0.506], t: [-0.25, 0.5],  n: '작은창자' },
    large:   { a: [0.097, 0.5],   t: [0.25, 0.5],   n: '큰창자' },
    out:     { a: [0.012, 0.6],   t: [0.22, 0.6],   n: '항문' },
    heart:   { a: [0.04, 0.335],  t: [0.24, 0.33],  n: '심장' },
    lungs:   { a: [-0.09, 0.28],  t: [-0.25, 0.26], n: '허파' },
    vessels: { a: [-0.183, 0.42], t: [-0.29, 0.44], n: '핏줄' }
  };

  function drawLabel(c, f, id) {
    var L = LABELS[id];
    if (!L) return;
    var px = Math.max(13, Math.min(20, f.s * 0.032));
    c.save();
    c.font = '800 ' + px + 'px "Nanum Gothic", sans-serif';
    var tw = c.measureText(L.n).width + px * 1.1, th = px * 1.7;
    var tx = X(f, L.t[0]), ty = Y(f, L.t[1]);
    tx = Math.max(tw / 2 + 4, Math.min(f.w - tw / 2 - 4, tx));
    ty = Math.max(th / 2 + 4, Math.min(f.h - th / 2 - 4, ty));
    var ax = X(f, L.a[0]), ay = Y(f, L.a[1]);
    c.strokeStyle = '#40323a'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(tx, ty); c.stroke();
    c.fillStyle = '#40323a';
    c.beginPath(); c.arc(ax, ay, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.strokeStyle = '#ffb347'; c.lineWidth = 2;
    roundRect(c, tx - tw / 2, ty - th / 2, tw, th, th / 2);
    c.fill(); c.stroke();
    c.fillStyle = '#40323a';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(L.n, tx, ty + 1);
    c.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* =========================================================================
   * 🍽️ 음식의 여행
   * ========================================================================= */

  var trip = {
    step: 0,
    phase: 'wait',        // wait(누르기 기다림) · doing(흘러가는 중) · done(다 함)
    taps: 0,
    f: 0, fGoal: 0, speed: 0.6,
    mush: 0,              // 위에서 죽이 된 정도 (0~1)
    dry: 0,               // 큰창자에서 물이 빠진 정도 (0~1)
    chew: 0,              // 입에서 씹은 정도 (0~1)
    jaw: 0,               // 입 벌림 (씹을 때 오르내림)
    squish: 0,
    fx: [],               // 영양분 반짝이 · 물방울
    fxClock: 0,
    gone: false
  };

  function foodNow() { return findById(FOODS, state.food) || FOODS[0]; }

  function startFood() {
    state.view = 'food';
    el.steps.hidden = false;
    el.story.hidden = false;
    el.ctrl.hidden = true;
    el.cards.hidden = true;
    el.nextBtn.hidden = false;    // 심장과 피에서 숨겼을 수 있습니다
    el.stage.classList.remove('small');
    buildSteps();
    updateScore();
    setTimeout(fit, 0);
    showStep(0);
  }

  function buildSteps() {
    el.steps.innerHTML = '';
    STEPS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'step-chip';
      b.innerHTML = '<span class="sc-art">' + (i + 1) + '</span><span class="sc-name">' + s.name + '</span>';
      b.addEventListener('click', function () {
        if (!state.playing || state.view !== 'food') return;
        if (window.SFX) SFX.tap();
        showStep(i);
      });
      el.steps.appendChild(b);
    });
  }

  function showStep(i) {
    var st = STEPS[i];
    trip.step = i;
    trip.phase = 'wait';
    trip.taps = 0;
    trip.f = 0; trip.fGoal = 0;
    trip.fx = [];
    trip.gone = false;
    // 앞 걸음에서 일어난 일은 이미 된 것으로 (띠에서 건너뛰어도 모습이 맞게)
    trip.chew = (i > 0) ? 1 : 0;
    trip.mush = (i > 2) ? 1 : 0;
    trip.dry = (i > 4) ? 1 : 0;

    Array.prototype.forEach.call(el.steps.children, function (c, k) {
      c.classList.toggle('on', k === i);
      c.classList.toggle('done', k < i);
    });

    var food = foodNow();
    el.storyTitle.textContent = st.title;
    el.storyText.textContent = st.text;
    setButton();
    el.bar.style.width = Math.round((i / STEPS.length) * 100) + '%';
    setLabel(food.icon + ' ' + food.name + '의 여행 · ' + st.name + ' (' + (i + 1) + '/' + STEPS.length + ')');
    hideSay();
    state.prompt = st.title.replace(/^[^가-힣]+/, '') + '. ' + st.text;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    speak(state.prompt);
  }

  function setButton() {
    var st = STEPS[trip.step];
    var last = (trip.step === STEPS.length - 1);
    if (trip.phase === 'done') el.nextBtn.textContent = last ? '끝 🎉' : '다음 ▶';
    else if (st.taps) el.nextBtn.textContent = st.btn + (trip.taps ? ' (' + trip.taps + '/' + st.taps + ')' : '');
    else el.nextBtn.textContent = st.btn;
    el.nextBtn.disabled = (trip.phase === 'doing');
    el.nextBtn.style.opacity = (trip.phase === 'doing') ? 0.5 : '';
  }

  // 해 보기 — 단추를 누르거나 그림을 누르면
  function foodAction() {
    if (!state.playing || state.view !== 'food') return;
    var st = STEPS[trip.step];
    if (trip.phase === 'doing') return;
    if (trip.phase === 'done') {
      if (window.SFX) SFX.tap();
      if (trip.step >= STEPS.length - 1) return finishFood();
      return showStep(trip.step + 1);
    }

    if (st.taps) {
      trip.taps += 1;
      if (st.id === 'mouth') {
        if (window.SFX) SFX.pop();
        trip.jaw = 1;
        trip.chew = trip.taps / st.taps;
        if (trip.taps >= st.taps) return stepDone();
      } else {
        if (window.SFX) SFX.smash(trip.taps);
        trip.squish = 1;
        trip.mush = trip.taps / st.taps;
        trip.fGoal = Math.min(0.55, trip.taps * 0.2);
        trip.speed = 0.8;
        if (trip.taps >= st.taps) {
          trip.phase = 'doing';
          trip.fGoal = 1;
          trip.speed = 1 / 1.6;
          showSay(st.doing);
        }
      }
      setButton();
      return;
    }

    if (window.SFX) SFX.tap();
    trip.phase = 'doing';
    trip.fGoal = 1;
    trip.speed = 1 / st.dur;
    if (st.id === 'out' && window.SFX) SFX.thud();
    showSay(st.doing);
    setButton();
  }

  function stepDone() {
    var st = STEPS[trip.step];
    var food = foodNow();
    trip.phase = 'done';
    if (window.SFX) SFX.correct();
    var line = st.done;
    if (st.id === 'mouth') line += food.chew;
    if (st.id === 'small') line = food.nutri;
    el.storyText.textContent = line;
    el.bar.style.width = Math.round(((trip.step + 1) / STEPS.length) * 100) + '%';
    var chip = el.steps.children[trip.step];
    if (chip) chip.classList.add('done');
    setButton();
    hideSay();
    state.prompt = line;
    speak(line);
  }

  function finishFood() {
    var food = foodNow();
    state.playing = false;
    markAte(food.id);
    updateScore();
    if (window.SFX) SFX.finish();
    if (window.TTS) TTS.cancel();
    el.endTitle.textContent = food.name + '의 여행 끝!';
    el.endStars.textContent = '';
    var line = '입 → 식도 → 위 → 작은창자 → 큰창자 → 똥. 다른 음식도 먹어 볼까요?';
    el.endText.textContent = line + ' (🍽️ ' + state.ate.length + '/' + FOODS.length + ')';
    el.endOverlay.hidden = false;
    speak('입, 식도, 위, 작은창자, 큰창자를 지나 똥이 됐어요. 다른 음식도 먹어 볼까요?');
  }

  function tripTick(dt) {
    var st = STEPS[trip.step];
    trip.jaw = Math.max(0, trip.jaw - dt * 3.5);
    trip.squish = Math.max(0, trip.squish - dt * 2.2);
    if (trip.f < trip.fGoal) trip.f = Math.min(trip.fGoal, trip.f + trip.speed * dt);
    if (st.id === 'large' && trip.phase === 'doing') trip.dry = trip.f;

    // 반짝이 · 물방울
    if (trip.phase === 'doing' && (st.id === 'small' || st.id === 'large')) {
      trip.fxClock += dt;
      while (trip.fxClock > 0.11) {
        trip.fxClock -= 0.11;
        var p = atF(ROUTE[st.seg], trip.f);
        var ang = Math.random() * Math.PI * 2;
        trip.fx.push({ x: p[0], y: p[1], vx: Math.cos(ang) * 0.03, vy: Math.sin(ang) * 0.03 - 0.01,
                       life: 0, max: 1.1, kind: (st.id === 'small') ? 'nut' : 'water' });
      }
    }
    trip.fx = trip.fx.filter(function (q) {
      q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt;
      return q.life < q.max;
    });

    if (trip.phase === 'doing' && trip.f >= 1) {
      if (st.id === 'out') trip.gone = true;
      stepDone();
    }
  }

  function drawTrip(c, f) {
    var st = STEPS[trip.step];
    var food = foodNow();
    var s = f.s;

    drawLungs(c, f, 0.2, 0);
    drawHeart(c, f, 0.2, 0, false);
    drawGut(c, f, 1, st.focus, trip.squish);

    // 식도가 조이는 자리 — 덩어리 바로 뒤가 꾹
    if (st.id === 'eso' && trip.phase === 'doing') {
      var f0 = Math.max(0, trip.f - 0.14), f1 = Math.max(0, trip.f - 0.05);
      if (f1 > f0) tube(c, f, subPts(ROUTE.eso, f0, f1), 0.008, '#c7605a', '#a8463f');
    }

    drawMouth(c, f, (st.id === 'mouth') ? (0.35 + 0.65 * trip.jaw) : 0, st.focus === 'mouth');

    // 덩어리
    var pos = atF(ROUTE[st.seg], trip.f);
    var bx = X(f, pos[0]), by = Y(f, pos[1]);
    if (st.id === 'mouth') {
      // 씹을수록 그림이 작아지고 부스러기가 늘어납니다
      if (trip.chew < 1) emoji(c, food.icon, bx, by + 0.012 * s, 0.1 * s * (1 - 0.65 * trip.chew));
      var n = Math.round(trip.chew * 9);
      c.fillStyle = food.c;
      c.strokeStyle = 'rgba(80,60,40,0.35)';
      for (var i = 0; i < n; i++) {
        var a = i * 2.4 + 0.5, rr = (0.01 + (i % 3) * 0.006) * s;
        c.beginPath();
        c.arc(bx + Math.cos(a) * rr, by + Math.sin(a) * rr * 0.6, Math.max(2, 0.005 * s), 0, Math.PI * 2);
        c.fill(); c.stroke();
      }
      if (trip.chew > 0) {
        c.fillStyle = 'rgba(120,190,255,0.7)';
        for (var k = 0; k < 3; k++) {
          c.beginPath();
          c.arc(bx + (k - 1) * 0.014 * s, by + 0.02 * s + Math.sin(clock * 4 + k) * 0.003 * s, Math.max(1.5, 0.003 * s), 0, Math.PI * 2);
          c.fill();
        }
      }
    } else if (st.id === 'out' || (st.id === 'large' && trip.phase === 'done')) {
      if (!(st.id === 'out' && trip.gone)) emoji(c, '💩', bx, by, 0.07 * s);
    } else {
      var col = mix(food.c, '#d9b46a', trip.mush * 0.6);
      col = trip.dry > 0 ? mixRgb(col, '#8a5a2b', trip.dry) : col;
      var rad = (st.id === 'small' ? 0.009 : st.id === 'large' ? 0.012 - 0.002 * trip.dry : 0.013) * s;
      if (st.id === 'stomach') rad *= (1 + 0.15 * trip.squish);
      c.beginPath();
      c.ellipse(bx, by, rad * (st.id === 'eso' ? 0.8 : 1), rad * (st.id === 'eso' ? 1.25 : 1), 0, 0, Math.PI * 2);
      c.fillStyle = col; c.fill();
      c.strokeStyle = 'rgba(80,50,30,0.45)'; c.lineWidth = Math.max(1, 0.002 * s); c.stroke();
      if (st.id === 'stomach' && trip.taps > 0 && trip.phase !== 'done') {
        // 위액 거품
        c.fillStyle = 'rgba(190,230,120,0.75)';
        for (var b = 0; b < 4; b++) {
          var ba = clock * 2 + b * 1.6;
          c.beginPath();
          c.arc(bx + Math.cos(ba) * rad * 1.6, by + Math.sin(ba) * rad * 1.2, Math.max(1.5, 0.004 * s), 0, Math.PI * 2);
          c.fill();
        }
      }
    }

    trip.fx.forEach(function (q) {
      var k = 1 - q.life / q.max;
      c.globalAlpha = k;
      if (q.kind === 'nut') {
        c.fillStyle = '#ffcf33';
        c.shadowColor = '#ffe680'; c.shadowBlur = 8;
        c.beginPath(); c.arc(X(f, q.x), Y(f, q.y), Math.max(2, 0.005 * s), 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
      } else {
        c.fillStyle = '#5fb4ff';
        var x = X(f, q.x), y = Y(f, q.y), r = Math.max(2, 0.005 * s);
        c.beginPath();
        c.moveTo(x, y - r * 1.8);
        c.quadraticCurveTo(x + r * 1.2, y, x, y + r);
        c.quadraticCurveTo(x - r * 1.2, y, x, y - r * 1.8);
        c.fill();
      }
      c.globalAlpha = 1;
    });

    drawLabel(c, f, st.focus);
  }

  function mixRgb(rgb, hex, t) {
    var m = /rgb\((\d+),(\d+),(\d+)\)/.exec(rgb);
    if (!m) return mix(rgb, hex, t);
    var B = hexRgb(hex);
    t = Math.max(0, Math.min(1, t));
    return 'rgb(' + Math.round(+m[1] + (B[0] - m[1]) * t) + ',' + Math.round(+m[2] + (B[1] - m[2]) * t) + ',' +
           Math.round(+m[3] + (B[2] - m[3]) * t) + ')';
  }

  /* =========================================================================
   * ❤️ 심장과 피
   * ========================================================================= */

  var blood = {
    mode: 'rest',
    lastBeat: -10,
    nextBeat: 0,
    breath: 0,
    taps: [],
    dots: [],
    tried: [],
    warned: false
  };

  var LUNGS = BRANCHES.filter(function (b) { return b.lung; });
  var BODY = BRANCHES.filter(function (b) { return !b.lung; });

  // 피 알갱이 — 허파 한 바퀴, 온몸 한 바퀴를 번갈아 돕니다
  function makeDots() {
    blood.dots = [];
    for (var i = 0; i < 70; i++) {
      var lung = (i % 2 === 0);
      var br = lung ? LUNGS[i % LUNGS.length] : BODY[Math.floor(Math.random() * BODY.length)];
      var leg = (Math.random() < 0.5) ? 'out' : 'back';
      blood.dots.push({ br: br, leg: leg, s: Math.random() * br[leg].len });
    }
  }

  function dotColor(d) {
    // 허파로 가는 피와 온몸에서 돌아오는 피는 어둡고, 그 반대는 밝습니다
    var dark = d.br.lung ? (d.leg === 'out') : (d.leg === 'back');
    return dark ? DARK : RED;
  }

  function startHeart() {
    state.view = 'heart';
    el.steps.hidden = true;
    el.story.hidden = false;
    el.ctrl.hidden = false;
    el.cards.hidden = true;
    el.stage.classList.remove('small');
    blood.tried = [];
    if (!blood.dots.length) makeDots();
    buildModes();
    setTimeout(fit, 0);
    setMode('rest');
  }

  function buildModes() {
    el.ctrl.innerHTML = '';
    MODES.forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.textContent = m.name;
      b.setAttribute('data-mode', m.id);
      b.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        setMode(m.id);
      });
      el.ctrl.appendChild(b);
    });
  }

  function setMode(id) {
    var m = findById(MODES, id);
    blood.mode = id;
    blood.warned = false;
    blood.taps = [];
    if (blood.tried.indexOf(id) < 0) blood.tried.push(id);
    el.bar.style.width = Math.round((blood.tried.length / MODES.length) * 100) + '%';
    Array.prototype.forEach.call(el.ctrl.children, function (b) {
      b.classList.toggle('on', b.getAttribute('data-mode') === id);
    });
    el.storyTitle.textContent = m.title;
    el.storyText.textContent = m.text;
    // '내가 심장' 에서만 이야기 판의 단추가 '꾹!' 이 됩니다
    el.nextBtn.hidden = (id !== 'pump');
    el.nextBtn.disabled = false;
    el.nextBtn.style.opacity = '';
    el.nextBtn.textContent = '💗 꾹!';
    if (id === 'pump') blood.lastBeat = clock - 10;
    else blood.nextBeat = clock + 0.2;
    setLabel('❤️ 심장과 피 · ' + m.name);
    updateHeartSay();
    updateScore();
    state.prompt = m.title.replace(/^[^가-힣]+/, '') + '. ' + m.text;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    speak(state.prompt);
  }

  function pumpBeat() {
    if (!state.playing || state.view !== 'heart' || blood.mode !== 'pump') return;
    blood.lastBeat = clock;
    blood.taps.push(clock);
    if (blood.taps.length > 5) blood.taps.shift();
    if (window.SFX) SFX.thud();
    blood.warned = false;
    updateHeartSay();
    updateScore();
  }

  function pumpBpm() {
    var t = blood.taps;
    if (t.length < 2 || clock - t[t.length - 1] > 2.5) return 0;
    return Math.round(60 / ((t[t.length - 1] - t[0]) / (t.length - 1)));
  }

  function updateHeartSay() {
    var m = findById(MODES, blood.mode);
    if (blood.mode === 'pump') {
      var bpm = pumpBpm();
      if (clock - blood.lastBeat > 2.5) showSay(blood.taps.length ? '피가 멈췄어요! 심장을 꾹 눌러요' : '심장을 꾹 눌러 보세요', true);
      else showSay(bpm ? ('💗 지금 빠르기: 1분에 ' + bpm + '번') : '💗 쿵! 한 번 더!');
      return;
    }
    showSay('❤️ 1분에 ' + m.bpm + '번쯤 · 🌬️ 숨 ' + m.br + '번쯤');
  }

  var heartSayClock = 0;

  function bloodTick(dt) {
    var m = findById(MODES, blood.mode);
    if (blood.mode !== 'pump' && clock >= blood.nextBeat) {
      blood.lastBeat = clock;
      blood.nextBeat = clock + 60 / m.bpm;
    }
    var since = clock - blood.lastBeat;
    var pulse = Math.exp(-since * 6);
    var flow = (blood.mode === 'pump')
      ? (1.5 * pulse + 0.4 * Math.exp(-since * 1.2))
      : (0.35 + 1.1 * pulse) * (0.6 + 0.4 * m.bpm / 95);
    var v = 0.16 * flow;

    blood.breath += dt * (m.br / 60) * Math.PI * 2;

    blood.dots.forEach(function (d) {
      d.s += v * dt;
      var path = d.br[d.leg];
      if (d.s < path.len) return;
      d.s -= path.len;
      if (d.leg === 'out') { d.leg = 'back'; return; }
      // 심장으로 돌아왔으면 다음 바퀴 — 허파였으면 온몸으로, 온몸이었으면 허파로
      d.br = d.br.lung ? BODY[Math.floor(Math.random() * BODY.length)] : LUNGS[Math.floor(Math.random() * LUNGS.length)];
      d.leg = 'out';
      d.s = Math.min(d.s, d.br.out.len * 0.5);
    });

    // '내가 심장' 의 말풍선은 손을 떼면 바뀌어야 해서 가끔 다시 씁니다
    heartSayClock += dt;
    if (blood.mode === 'pump' && heartSayClock > 0.4) {
      heartSayClock = 0;
      var stopped = clock - blood.lastBeat > 2.5;
      if (stopped && !blood.warned && blood.taps.length) {
        blood.warned = true;
        if (window.SFX) SFX.wrong();
      }
      updateHeartSay();
    }
    return pulse;
  }

  function drawBlood(c, f, pulse) {
    var s = f.s;
    var breath = (1 - Math.cos(blood.breath)) / 2;
    drawLungs(c, f, 1, breath);
    drawVessels(c, f, 0.5);
    var r = Math.max(2, 0.0062 * s);
    blood.dots.forEach(function (d) {
      var p = at(d.br[d.leg], d.s);
      c.fillStyle = dotColor(d);
      c.beginPath(); c.arc(X(f, p[0]), Y(f, p[1]), r, 0, Math.PI * 2); c.fill();
    });
    drawHeart(c, f, 1, pulse, blood.mode === 'pump' && clock - blood.lastBeat > 2.5);
    drawLabel(c, f, 'heart');
    drawLabel(c, f, 'lungs');
    drawLegend(c, f);
  }

  // 피 색 알림 — 아래 왼쪽 구석
  function drawLegend(c, f) {
    var px = Math.max(12, Math.min(16, f.s * 0.024));
    c.save();
    c.font = '700 ' + px + 'px "Nanum Gothic", sans-serif';
    var lines = [[RED, '산소가 많은 피'], [DARK, '산소를 나눠 준 피']];
    var w = 0;
    lines.forEach(function (L) { w = Math.max(w, c.measureText(L[1]).width); });
    var bw = w + px * 2.6, bh = px * 3.6, x = 10, y = f.h - bh - 10;
    c.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(c, x, y, bw, bh, 12);
    c.fill();
    c.textBaseline = 'middle';
    lines.forEach(function (L, i) {
      var ly = y + px * (1.1 + i * 1.5);
      c.fillStyle = L[0];
      c.beginPath(); c.arc(x + px * 0.9, ly, px * 0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#40323a';
      c.fillText(L[1], x + px * 1.7, ly);
    });
    c.restore();
  }

  /* =========================================================================
   * ❓ 퀴즈
   * ========================================================================= */

  function askQuiz(q) {
    state.view = 'quiz';
    state.reveal = null;
    el.steps.hidden = true;
    el.story.hidden = true;
    el.ctrl.hidden = true;
    el.cards.hidden = false;
    el.stage.classList.add('small');
    el.cards.className = 'cards sci-cards ans-cards';
    el.cards.innerHTML = '';
    hideSay();

    var options = q.choices.map(function (c, i) { return { text: c, right: (i === 0) }; });
    UI.shuffle(options);

    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = '<div class="text">' + o.text + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return quizMissed(b);
        quizCorrect(b, q);
      });
      el.cards.appendChild(b);
    });

    setLabel(q.q + ' (' + (state.round + 1) + '/' + state.deck.length + ')');
    setTimeout(fit, 0);
    beginQuestion(q.q);
  }

  function quizCorrect(card, q) {
    state.locked = true;
    state.reveal = q.o;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    setLabel(q.why);
    state.prompt = q.why;
    el.speakBtn.hidden = true;
    speak(q.why, function () { setTimeout(nextRound, 500); });
  }

  function quizMissed(card) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
    speak('아니에요. 다시 골라 봐요.', function () {
      setTimeout(function () { speak(state.prompt); }, 150);
    });
  }

  function drawQuiz(c, f) {
    var o = state.reveal;
    drawLungs(c, f, 1, (1 - Math.cos(clock * 2.4)) / 2);
    drawVessels(c, f, o === 'vessels' ? 0.9 : 0.3);
    drawGut(c, f, 1, (o && o !== 'heart' && o !== 'lungs' && o !== 'vessels') ? o : null, 0);
    drawHeart(c, f, 1, Math.exp(-((clock % 0.63) * 6)), o === 'heart');
    drawMouth(c, f, o === 'mouth' ? 0.6 : 0, o === 'mouth');
    if (o) drawLabel(c, f, o);
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.playing = true;
    state.round = 0;
    state.stars = 0;
    state.locked = false;
    state.prompt = '';
    state.reveal = null;
    el.bar.style.width = '0%';
    el.speakBtn.hidden = true;
    el.cards.innerHTML = '';
    if (window.TTS) TTS.cancel();

    if (state.act === 'food') return startFood();
    if (state.act === 'heart') return startHeart();

    state.deck = UI.shuffle(QUIZ.slice()).slice(0, QUIZ_ROUNDS);
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= state.deck.length) return finish();
    state.firstTry = true;
    state.locked = false;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';
    askQuiz(state.deck[state.round]);
  }

  function finish() {
    state.locked = true;
    state.playing = false;
    el.bar.style.width = '100%';
    var total = state.deck.length;
    UI.saveBest(BEST_KEY + '.quiz', state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);
    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;
    if (window.SFX) SFX.finish();
  }

  function beginQuestion(spoken) {
    state.prompt = spoken;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(function () { speak(state.prompt); }, 300);
  }

  function setLabel(text) { el.label.textContent = text; }

  function showSay(text, warn) {
    el.say.textContent = text;
    el.say.classList.toggle('warn', !!warn);
    el.say.hidden = false;
  }

  function hideSay() { el.say.hidden = true; }

  function updateScore() {
    if (state.act === 'food') el.score.textContent = '🍽️ ' + state.ate.length + '/' + FOODS.length;
    else if (state.act === 'heart') {
      var m = findById(MODES, blood.mode);
      var bpm = (blood.mode === 'pump') ? pumpBpm() : m.bpm;
      el.score.textContent = '❤️ ' + (bpm || '—');
    } else el.score.textContent = '⭐ ' + state.stars;
  }

  /* ---------- 그리기 고리 ---------- */

  var clock = 0, last = 0;

  function frame(now) {
    requestAnimationFrame(frame);   // 맨 앞에서 예약 — 한 장 그리다 탈이 나도 멈추지 않게
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    clock += dt;

    var g = camGoal();
    var k = Math.min(1, dt * 3);
    cam.y0 += (g.y0 - cam.y0) * k;
    cam.y1 += (g.y1 - cam.y1) * k;

    var pulse = 0;
    if (state.view === 'food') tripTick(dt);
    if (state.view === 'heart') pulse = bloodTick(dt);

    if (!W) return;
    var f = frameFor(W, H);
    drawBackground(ctx, W, H);
    drawBody(ctx, f);
    if (state.view === 'food') drawTrip(ctx, f);
    else if (state.view === 'heart') drawBlood(ctx, f, pulse);
    else drawQuiz(ctx, f);
  }

  /* ---------- 누르기 ---------- */

  el.nextBtn.addEventListener('click', function () {
    if (state.view === 'food') foodAction();
    else if (state.view === 'heart') pumpBeat();
  });

  el.stage.addEventListener('pointerdown', function (e) {
    if (!state.playing) return;
    if (state.view === 'food') {
      if (trip.phase !== 'done') foodAction();
    } else if (state.view === 'heart' && blood.mode === 'pump') {
      e.preventDefault();
      pumpBeat();
    }
  });

  /* ---------- 시작 화면 ---------- */

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  function buildModeRow() {
    el.modeRow.innerHTML = '';
    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + ((a.id === state.act) ? ' on' : '');
      b.innerHTML = '<span class="mi">' + a.icon + '</span>' +
                    '<span class="mn">' + a.name + '</span>' +
                    '<span class="mb">' + bestText(a.id) + '</span>';
      b.addEventListener('click', function () {
        state.act = a.id;
        UI.saveValue(ACT_KEY, a.id);
        Array.prototype.forEach.call(el.modeRow.children, function (x) { x.classList.toggle('on', x === b); });
        showAct();
      });
      el.modeRow.appendChild(b);
    });
    showAct();
  }

  function buildKindRow() {
    el.kindRow.innerHTML = '';
    FOODS.forEach(function (fd) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + ((fd.id === state.food) ? ' on' : '');
      b.innerHTML = '<span class="mi">' + fd.icon + '</span>' +
                    '<span class="mn">' + fd.name + '</span>' +
                    '<span class="mb">' + (state.ate.indexOf(fd.id) >= 0 ? '✓' : '') + '</span>';
      b.addEventListener('click', function () {
        state.food = fd.id;
        UI.saveValue(FOOD_KEY, fd.id);
        Array.prototype.forEach.call(el.kindRow.children, function (x) { x.classList.toggle('on', x === b); });
      });
      el.kindRow.appendChild(b);
    });
  }

  function bestText(act) {
    if (act === 'food') return state.ate.length ? ('🍽️ ' + state.ate.length + '/' + FOODS.length) : '';
    if (act === 'heart') return '';
    var best = UI.readBest(BEST_KEY + '.' + act);
    return best ? ('⭐ ' + best.stars + '/' + best.total) : '';
  }

  function showAct() {
    var a = findById(ACTS, state.act);
    if (a) el.modeDesc.textContent = a.desc;
    var food = (state.act === 'food');
    el.kindHint.hidden = !food;
    el.kindRow.hidden = !food;
  }

  buildModeRow();
  buildKindRow();

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

  // '다른 놀이 고르기' 는 시작 화면으로 — 다른 음식을 바로 고를 수 있게
  el.endModes.addEventListener('click', function () {
    if (window.TTS) TTS.cancel();
    el.endOverlay.hidden = true;
    buildModeRow();
    buildKindRow();
    el.startOverlay.hidden = false;
  });

  el.speakBtn.addEventListener('click', function () { speak(state.prompt); });

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '우리 몸을 들여다봐요.'; } });
  });

  var back = Catalog.backHref('insides.html');
  bindGo(el.backBtn, back);
  bindGo(el.startHome, back);
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  /* ---------- 소리 ---------- */

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
      setTimeout(once, Math.min(16000, 900 + (text || '').length * 110));
      return;
    }
    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }

  /* ---------- 시작 ---------- */

  window.addEventListener('resize', fit);
  // 이야기 판·단추 줄이 나타나고 사라지면 그림 칸 높이가 바뀝니다 — 그때마다 다시 잽니다
  if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(el.stage);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  fit();
  el.story.hidden = true;
  el.steps.hidden = true;
  updateScore();
  setLabel('🫀 몸 속을 들여다봐요');
  requestAnimationFrame(frame);
})();
