/* =========================================================================
 * 다니랜드 - 미로 찾기
 *
 * 매번 새로 만들어지는 미로에서 손가락으로 길을 그어 다니를 간식까지 데려갑니다.
 * 한 판은 미로 다섯 개. 되돌아가지 않고(막다른 길에 들어가지 않고) 한 번에 찾으면 ⭐ 하나 —
 * 손보다 눈이 먼저 가게 하려고 그렇게 정했습니다. 💡 힌트를 보면 그 미로의 별은 없습니다.
 *
 * 미로는 '완전 미로'(어느 두 칸 사이에도 길이 딱 하나)라 정답 길이 하나뿐이고,
 * 간식은 출발점에서 제일 먼 칸에 놓습니다 — 늘 오른쪽 아래에 있으면 안 보고도 가니까요.
 *
 * 난이도는 판의 칸 수입니다 (SIZES). 손가락으로 긋는 길이라 칸이 좀 작아도 괜찮지만,
 * 폰(358px)에서 11칸이면 한 칸이 32px 이라 그 위로는 늘리지 마세요.
 * ========================================================================= */

(function () {
  var ROUNDS = 5;
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '길 찾기 박사!'];
  var TREATS = ['🦴', '🍖', '🍎', '🍓', '🧁', '🍪', '🍩', '🍦'];

  var SIZES = [
    { n: 5,  name: '쉬워요' },
    { n: 7,  name: '보통' },
    { n: 9,  name: '어려워요' },
    { n: 11, name: '아주 어려워요' }
  ];

  var BEST_KEY = 'daniland.best.maze';
  var SIZE_KEY = 'daniland.mazeSize';

  // 색은 css/style.css 의 :root 와 맞춥니다
  var WALL = '#5a4a52';
  var TRAIL = 'rgba(255, 143, 171, 0.55)';
  var HINT = 'rgba(78, 163, 255, 0.35)';
  var FLOOR = '#fffdf7';

  var el = {
    board: document.getElementById('board'),
    canvas: document.getElementById('canvas'),
    dani: document.getElementById('dani'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    label: document.getElementById('questLabel'),
    hintBtn: document.getElementById('hintBtn'),
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
    endLevels: document.getElementById('endLevels'),
    endHome: document.getElementById('endHome')
  };

  var ctx = el.canvas.getContext('2d');

  var state = {
    n: parseInt(UI.loadValue(SIZE_KEY), 10) || 7,
    cells: [],          // 칸마다 { n, e, s, w } — true 면 그쪽에 벽
    goal: 0,
    treat: '🦴',
    solution: {},       // 정답 길에 있는 칸 (칸 번호 → true)
    path: [],           // 지금까지 그은 길 (칸 번호들, 마지막이 다니 자리)
    wrong: 0,           // 정답 길에서 벗어난 횟수
    hinted: false,
    round: 0,
    stars: 0,
    locked: true,
    size: 0,            // 판 한 변 px
    cell: 0             // 칸 한 변 px
  };

  if (!findSize(state.n)) state.n = 7;

  buildLevelRow();
  fitBoard();

  el.startBtn.addEventListener('click', function () {
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    fitBoard();
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  el.hintBtn.addEventListener('click', showHint);

  bindGo(el.backBtn, backHref());
  bindGo(el.startHome, backHref());
  bindGo(el.endLevels, backHref());
  bindGo(el.endHome, 'index.html');

  function bindGo(btn, href) {
    btn.addEventListener('click', function () { window.location.href = href; });
  }

  function backHref() {
    var pages = window.PAGES || [];
    for (var i = 0; i < pages.length; i++) {
      if ((pages[i].href || '').indexOf('maze.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
      }
    }
    return 'index.html';
  }

  function findSize(n) {
    for (var i = 0; i < SIZES.length; i++) if (SIZES[i].n === n) return SIZES[i];
    return null;
  }

  /* ---------- 시작 화면 ---------- */

  function buildLevelRow() {
    el.levelRow.innerHTML = '';

    SIZES.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'level-btn' + (s.n === state.n ? ' on' : '');
      var best = UI.readBest(BEST_KEY + '.' + s.n);
      b.innerHTML = s.name + '<span class="lb">' + s.n + '×' + s.n +
                    (best ? ' · ⭐ ' + best.stars + '/' + best.total : '') + '</span>';
      b.addEventListener('click', function () {
        state.n = s.n;
        UI.saveValue(SIZE_KEY, String(s.n));
        Array.prototype.forEach.call(el.levelRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
      });
      el.levelRow.appendChild(b);
    });
  }

  /* ---------- 판 크기 ----------
   * 정사각형이라 가로·세로 중 좁은 쪽에 맞춥니다. 아래 힌트 단추 자리는 빼 둡니다. */
  function fitBoard() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;

    var top = el.board.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;
    var availH = screenH - top - toolsH - bottomPad - 6;

    var box = el.board.parentNode;
    var boxStyle = getComputedStyle(box);
    var availW = box.clientWidth - px(boxStyle.paddingLeft) - px(boxStyle.paddingRight);

    var size = Math.floor(Math.max(240, Math.min(availW, availH, 640)));
    state.size = size;
    state.cell = size / state.n;

    el.board.style.width = size + 'px';
    el.board.style.height = size + 'px';

    // 또렷하게 그리려고 기기 픽셀 비율만큼 크게 잡습니다
    var dpr = window.devicePixelRatio || 1;
    el.canvas.width = Math.round(size * dpr);
    el.canvas.height = Math.round(size * dpr);
    el.canvas.style.width = size + 'px';
    el.canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    el.dani.style.width = Math.round(state.cell * 0.82) + 'px';
    if (state.cells.length) { draw(); placeDani(false); }
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitBoard);
  window.addEventListener('orientationchange', function () { setTimeout(fitBoard, 200); });

  /* ---------- 미로 만들기 ----------
   * 왼쪽 위에서 시작해 아무 이웃이나 골라 벽을 허물며 나아가고, 막히면 되돌아옵니다.
   * 모든 칸이 이어지고 갈래길이 없는(고리가 없는) 미로가 나옵니다. */
  function makeMaze(n) {
    var cells = [];
    for (var i = 0; i < n * n; i++) cells.push({ n: true, e: true, s: true, w: true, seen: false });

    var stack = [0];
    cells[0].seen = true;

    while (stack.length) {
      var cur = stack[stack.length - 1];
      var options = neighbors(cur, n).filter(function (nb) { return !cells[nb.i].seen; });

      if (!options.length) {
        stack.pop();
        continue;
      }

      var pick = options[Math.floor(Math.random() * options.length)];
      cells[cur][pick.dir] = false;
      cells[pick.i][pick.back] = false;
      cells[pick.i].seen = true;
      stack.push(pick.i);
    }

    return cells;
  }

  function neighbors(i, n) {
    var x = i % n, y = Math.floor(i / n), out = [];
    if (y > 0)     out.push({ i: i - n, dir: 'n', back: 's' });
    if (x < n - 1) out.push({ i: i + 1, dir: 'e', back: 'w' });
    if (y < n - 1) out.push({ i: i + n, dir: 's', back: 'n' });
    if (x > 0)     out.push({ i: i - 1, dir: 'w', back: 'e' });
    return out;
  }

  // 출발점에서 모든 칸까지의 거리와 '어디서 왔는지'를 구합니다 (제일 먼 칸이 간식 자리)
  function solve(cells, n, from) {
    var dist = [], prev = [], queue = [from];
    for (var i = 0; i < cells.length; i++) { dist.push(-1); prev.push(-1); }
    dist[from] = 0;

    while (queue.length) {
      var cur = queue.shift();
      neighbors(cur, n).forEach(function (nb) {
        if (cells[cur][nb.dir] || dist[nb.i] >= 0) return;
        dist[nb.i] = dist[cur] + 1;
        prev[nb.i] = cur;
        queue.push(nb.i);
      });
    }

    var far = 0;
    for (var k = 0; k < dist.length; k++) if (dist[k] > dist[far]) far = k;

    var onPath = {};
    for (var c = far; c >= 0; c = prev[c]) onPath[c] = true;

    return { goal: far, solution: onPath };
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    updateScore();
    fitBoard();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    state.cells = makeMaze(state.n);
    var s = solve(state.cells, state.n, 0);
    state.goal = s.goal;
    state.solution = s.solution;
    state.treat = TREATS[Math.floor(Math.random() * TREATS.length)];
    state.path = [0];
    state.wrong = 0;
    state.hinted = false;
    state.locked = false;

    el.label.textContent = state.treat + ' 까지 길을 찾아요 (' + (state.round + 1) + '/' + ROUNDS + ')';
    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    el.hintBtn.disabled = false;

    fitBoard();
    draw();
    placeDani(false);
  }

  // 지금 다니가 있는 칸
  function head() { return state.path[state.path.length - 1]; }

  // 손가락이 가리키는 칸으로 한 칸씩 가 봅니다. 되돌아가면 길을 지웁니다.
  function moveTo(target) {
    if (state.locked) return;
    var h = head();
    if (target === h) return;

    // 바로 전 칸으로 되돌아가기
    if (state.path.length > 1 && state.path[state.path.length - 2] === target) {
      state.path.pop();
      afterMove();
      return;
    }

    var n = state.n;
    var hx = h % n, hy = Math.floor(h / n);
    var tx = target % n, ty = Math.floor(target / n);

    // 같은 줄이 아니면(대각선) 모릅니다 — 손가락이 지나가는 칸을 차례로 받을 테니까요
    if (hx !== tx && hy !== ty) return;

    // 같은 줄이면 한 칸씩 벽이 없는 데까지 갑니다 (빨리 그어도 중간 칸이 빠지지 않게)
    var dir = hx === tx ? (ty > hy ? 's' : 'n') : (tx > hx ? 'e' : 'w');
    var step = { n: -n, s: n, e: 1, w: -1 }[dir];
    var cur = h;
    var moved = false;

    while (cur !== target) {
      if (state.cells[cur][dir]) break;                 // 벽
      var next = cur + step;
      if (state.path.length > 1 && state.path[state.path.length - 2] === next) {
        state.path.pop();                                 // 그은 길을 따라 되돌아가는 중
      } else if (state.path.indexOf(next) >= 0) {
        break;                                            // 이미 지나온 길을 건너뛰어 밟는 것은 막습니다
      } else {
        // 정답 길에 있다가 벗어나는 순간만 셉니다 (막다른 골목 안에서 더 가는 것은 같은 실수)
        if (state.solution[cur] && !state.solution[next]) state.wrong += 1;
        state.path.push(next);
      }
      cur = next;
      moved = true;
    }

    if (moved) afterMove();
  }

  function afterMove() {
    draw();
    placeDani(true);

    if (head() === state.goal) reach();
  }

  function reach() {
    state.locked = true;
    el.hintBtn.disabled = true;

    var star = !state.hinted && state.wrong === 0;
    if (star) state.stars += 1;
    updateScore();
    el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';

    if (window.SFX) SFX.correct();
    UI.confettiAt(el.dani);
    el.dani.classList.add('happy');
    el.label.textContent = star ? '한 번에 찾았어요! ⭐' : (state.hinted ? '힌트로 찾았어요!' : '찾았어요! (돌아간 길 ' + state.wrong + '번)');

    setTimeout(function () {
      el.dani.classList.remove('happy');
      state.round += 1;
      nextRound();
    }, 1500);
  }

  // 💡 정답 길을 잠깐 비춰 줍니다. 그 미로의 별은 없습니다.
  function showHint() {
    if (state.locked || state.hinted) return;
    state.hinted = true;
    el.hintBtn.disabled = true;
    if (window.SFX) SFX.tap();
    draw(true);
    setTimeout(function () { if (!state.locked) draw(); }, 1800);
  }

  function finish() {
    el.bar.style.width = '100%';
    UI.saveBest(BEST_KEY + '.' + state.n, state.stars, ROUNDS);
    UI.saveBest(BEST_KEY, state.stars, ROUNDS);
    buildLevelRow();

    el.endStars.textContent = UI.starLine(state.stars, ROUNDS);
    el.endTitle.textContent = (state.stars === ROUNDS)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = ROUNDS + '개 중에 ' + state.stars + '개를 한 번에 찾았어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  function updateScore() {
    el.score.textContent = '⭐ ' + state.stars;
  }

  /* ---------- 그리기 ---------- */

  function center(i) {
    var n = state.n, c = state.cell;
    return { x: (i % n) * c + c / 2, y: Math.floor(i / n) * c + c / 2 };
  }

  function draw(withHint) {
    var n = state.n, c = state.cell, size = state.size;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, 0, size, size);

    // 정답 길 (힌트)
    if (withHint) strokePath(Object.keys(state.solution).map(Number).sort(function (a, b) { return a - b; }), HINT, true);

    // 그은 길
    strokePath(state.path, TRAIL, false);

    // 간식
    var g = center(state.goal);
    ctx.font = Math.round(c * 0.6) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.treat, g.x, g.y + c * 0.03);

    // 벽 — 칸마다 위·왼쪽 벽만 그리고, 오른쪽·아래 바깥 벽은 판 테두리로 긋습니다
    var lw = Math.max(3, Math.round(c * 0.11));
    ctx.strokeStyle = WALL;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i < n * n; i++) {
      var x = (i % n) * c, y = Math.floor(i / n) * c;
      if (state.cells[i].n) { ctx.moveTo(x, y); ctx.lineTo(x + c, y); }
      if (state.cells[i].w) { ctx.moveTo(x, y); ctx.lineTo(x, y + c); }
      if (i % n === n - 1 && state.cells[i].e) { ctx.moveTo(x + c, y); ctx.lineTo(x + c, y + c); }
      if (i >= n * (n - 1) && state.cells[i].s) { ctx.moveTo(x, y + c); ctx.lineTo(x + c, y + c); }
    }
    ctx.stroke();
  }

  // 칸 번호 목록을 칸 가운데를 잇는 굵은 선으로 긋습니다.
  // 힌트는 정답 길이 순서대로 안 담겨 있어 이웃끼리 이어 그립니다.
  function strokePath(list, color, unordered) {
    if (list.length < 1) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = state.cell * 0.42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    if (unordered) {
      var n = state.n, on = {};
      list.forEach(function (i) { on[i] = true; });
      list.forEach(function (i) {
        var p = center(i);
        neighbors(i, n).forEach(function (nb) {
          if (!on[nb.i] || state.cells[i][nb.dir]) return;
          var q = center(nb.i);
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
        });
      });
    } else {
      var s = center(list[0]);
      ctx.moveTo(s.x, s.y);
      if (list.length === 1) ctx.lineTo(s.x, s.y);
      for (var k = 1; k < list.length; k++) {
        var p2 = center(list[k]);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();
  }

  function placeDani(animate) {
    var p = center(head());
    el.dani.style.transitionDuration = animate ? '110ms' : '0ms';
    el.dani.style.left = p.x + 'px';
    el.dani.style.top = p.y + 'px';
  }

  /* ---------- 손가락 · 키보드 ---------- */

  var dragging = false;

  // 손가락 자리를 칸 번호로. 칸 가장자리(테두리 15%)는 모른 척합니다 —
  // 그어 가다 옆 칸에 살짝 걸친 것을 '들어갔다' 로 치지 않으려고요.
  function cellAt(clientX, clientY) {
    var r = el.canvas.getBoundingClientRect();
    var x = clientX - r.left, y = clientY - r.top;
    if (x < 0 || y < 0 || x >= state.size || y >= state.size) return -1;
    var c = state.cell;
    var fx = (x % c) / c, fy = (y % c) / c;
    if (fx < 0.15 || fx > 0.85 || fy < 0.15 || fy > 0.85) return -1;
    return Math.floor(y / c) * state.n + Math.floor(x / c);
  }

  el.canvas.addEventListener('pointerdown', function (e) {
    if (state.locked) return;
    dragging = true;
    try { el.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    var i = cellAt(e.clientX, e.clientY);
    if (i >= 0) moveTo(i);
    e.preventDefault();
  });

  el.canvas.addEventListener('pointermove', function (e) {
    if (!dragging || state.locked) return;
    var i = cellAt(e.clientX, e.clientY);
    if (i >= 0) moveTo(i);
    e.preventDefault();
  });

  function stopDrag() { dragging = false; }
  el.canvas.addEventListener('pointerup', stopDrag);
  el.canvas.addEventListener('pointercancel', stopDrag);

  // 컴퓨터에서는 화살표로도 움직입니다
  document.addEventListener('keydown', function (e) {
    var step = { ArrowUp: -state.n, ArrowDown: state.n, ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step === undefined || state.locked) return;
    var h = head(), n = state.n;
    if (step === -1 && h % n === 0) return;
    if (step === 1 && h % n === n - 1) return;
    var t = h + step;
    if (t < 0 || t >= n * n) return;
    moveTo(t);
    e.preventDefault();
  });
})();
