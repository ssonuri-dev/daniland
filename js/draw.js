/* =========================================================================
 * 다니랜드 - 그림 그리기
 * 손가락(터치), 마우스, 펜 모두 됩니다.
 * ========================================================================= */

(function () {
  var COLORS = [
    // 검정 · 회색 · 흰색
    '#000000', '#4a4a4a', '#9e9e9e', '#d7d7d7', '#ffffff',
    // 빨강 · 분홍
    '#8b0000', '#d40000', '#ff3b30', '#ff6b6b', '#ff8fab', '#ffc2d1',
    // 주황 · 갈색 · 살구
    '#ff6f00', '#ff9500', '#ffb340', '#8b5e3c', '#c68642', '#ffdfc4',
    // 노랑 · 연두 · 초록
    '#ffd60a', '#f7e967', '#b5e61d', '#6dd47e', '#34c759', '#0f7a3d',
    // 청록 · 파랑 · 남색
    '#00c7be', '#2ec4b6', '#7fd8ff', '#5eb1ff', '#0a84ff', '#1e3fd8', '#0b2a8a',
    // 보라 · 자주
    '#af52de', '#b79bff', '#7a3fd8', '#e056fd', '#ff5fa2'
  ];

  // 펜 종류 — 보통 붓, 반짝이 펜 다섯 가지, 그리고 지우개
  var PENS = [
    { id: 'normal',  name: '보통 붓', icon: '🖌️' },
    { id: 'rainbow', name: '무지개',  icon: '🌈' },
    { id: 'glitter', name: '반짝이',  icon: '✨' },
    { id: 'galaxy',  name: '은하수',  icon: '🌌' },
    { id: 'neon',    name: '네온',    icon: '💡' },
    { id: 'candy',   name: '솜사탕',  icon: '🍬' },
    { id: 'eraser',  name: '지우개',  icon: '🧽' }
  ];

  var STAMPS = [
    '🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐸', '🐵', '🦁', '🐯',
    '🦄', '🦋', '🐞', '🐝', '🐟', '🐢', '🐧', '🐥',
    '⭐', '🌟', '✨', '🌈', '☀️', '🌙', '☁️', '⚡',
    '🌸', '🌻', '🌷', '🍀', '🌳', '🍄',
    '❤️', '💖', '💎', '👑', '🎈', '🎁', '🎵', '🎀',
    '🍎', '🍓', '🍉', '🍪', '🍭', '🍦', '🎂',
    '🚗', '🚌', '🚂', '✈️', '🚀', '⛵', '🏠', '⚽', '🎨', '😀'
  ];

  // 무지개 펜이 한 번에 함께 그리는 일곱 색
  var RAINBOW = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#00c7be', '#0a84ff', '#af52de'];

  var LINE_SIZES  = [4, 9, 16, 26, 40];      // 붓 굵기 5단계
  var STAMP_SIZES = [32, 52, 78, 108, 145];  // 도장 크기 5단계

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var pad = document.getElementById('pad');

  var state = {
    color: '#000000',
    pen: 'normal',
    sizeIndex: 2,
    erasing: false,
    stamp: null,        // 도장 모드일 때 이모지, 아니면 null
    drawing: false,
    pointerId: null,    // 지금 그리고 있는 손가락(또는 마우스) 번호
    hue: 0,             // 솜사탕 펜이 쓰는 색상 값
    last: { x: 0, y: 0 },
    lastStamp: { x: 0, y: 0 },
    stampPage: 0,
    perPage: 24,
    drawerOpen: localStorage.getItem('daniland.drawer') !== '0'
  };

  var undoStack = [];
  var redoStack = [];
  var HISTORY_MAX = 25;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- 색 고르기 ---------- */

  var paletteEl = document.getElementById('palette');

  COLORS.forEach(function (color) {
    var b = document.createElement('button');
    b.className = 'swatch' + (color === state.color ? ' on' : '');
    b.style.background = color;
    if (color === '#ffffff') b.title = '흰색';
    b.addEventListener('click', function () { chooseColor(color, b); });
    paletteEl.appendChild(b);
  });

  // 🎨 여기에 없는 색은 직접 만들어 쓸 수 있어요.
  var custom = document.createElement('label');
  custom.className = 'swatch custom';
  custom.title = '내가 만든 색';
  custom.innerHTML = '<span>🎨</span><input type="color" value="#ff8fab">';
  paletteEl.appendChild(custom);

  custom.querySelector('input').addEventListener('input', function () {
    custom.style.background = this.value;
    custom.classList.add('picked');
    chooseColor(this.value, custom);
  });

  function chooseColor(color, button) {
    state.color = color;
    state.stamp = null;
    if (state.erasing) {           // 색을 고르면 지우개에서 빠져나옵니다.
      state.erasing = false;
      if (state.pen === 'eraser') state.pen = 'normal';
    }
    syncTools();
    Array.prototype.forEach.call(paletteEl.children, function (x) {
      x.classList.toggle('on', x === button);
    });
  }

  /* ---------- 펜 고르기 (지우개도 여기에 있습니다) ---------- */

  var penRow = document.getElementById('penRow');

  PENS.forEach(function (pen) {
    var b = document.createElement('button');
    b.className = 'pen-btn';
    b.innerHTML = '<span class="pi">' + pen.icon + '</span><span>' + pen.name + '</span>';
    b.addEventListener('click', function () {
      state.pen = pen.id;
      state.erasing = (pen.id === 'eraser');
      state.stamp = null;          // 펜을 고르면 도장 모드가 풀립니다.
      syncTools();
    });
    penRow.appendChild(b);
  });

  /* ---------- 굵기 고르기 ---------- */

  var sizeRow = document.getElementById('sizeRow');

  LINE_SIZES.forEach(function (size, i) {
    var b = document.createElement('button');
    b.className = 'tool size-btn' + (i === state.sizeIndex ? ' on' : '');
    b.title = '굵기 ' + (i + 1);
    var d = Math.round(size * 0.6 + 4);
    b.innerHTML = '<span class="dot" style="width:' + d + 'px;height:' + d + 'px"></span>';
    b.addEventListener('click', function () {
      state.sizeIndex = i;
      Array.prototype.forEach.call(sizeRow.children, function (x) {
        x.classList.toggle('on', x === b);
      });
    });
    sizeRow.appendChild(b);
  });

  /* ---------- 도장 서랍 ---------- */

  var stampPanel = document.getElementById('stampPanel');
  var stampBody = document.getElementById('stampBody');
  var stampGrid = document.getElementById('stampRow');
  var stampNav = document.getElementById('stampNav');
  var stampPageLabel = document.getElementById('stampPage');

  document.getElementById('stampToggle').addEventListener('click', function () {
    state.drawerOpen = !state.drawerOpen;
    try { localStorage.setItem('daniland.drawer', state.drawerOpen ? '1' : '0'); } catch (e) { /* 무시 */ }
    layout();
  });

  document.getElementById('stampPrev').addEventListener('click', function () { turnPage(-1); });
  document.getElementById('stampNext').addEventListener('click', function () { turnPage(1); });

  function pageCount() {
    return Math.max(1, Math.ceil(STAMPS.length / state.perPage));
  }

  function turnPage(step) {
    var total = pageCount();
    state.stampPage = (state.stampPage + step + total) % total;   // 끝에서 처음으로 이어집니다.
    renderStamps();
  }

  function renderStamps() {
    var total = pageCount();
    if (state.stampPage >= total) state.stampPage = total - 1;

    var start = state.stampPage * state.perPage;
    var page = STAMPS.slice(start, start + state.perPage);

    stampGrid.innerHTML = '';
    page.forEach(function (emoji) {
      var b = document.createElement('button');
      b.className = 'stamp-btn' + (emoji === state.stamp ? ' on' : '');
      b.textContent = emoji;
      b.addEventListener('click', function () {
        state.stamp = emoji;
        state.erasing = false;
        syncTools();
      });
      stampGrid.appendChild(b);
    });

    stampPageLabel.textContent = (state.stampPage + 1) + ' / ' + total;
    stampNav.hidden = (total <= 1);
  }

  function syncTools() {
    // 도장을 쓰는 동안에는 펜 선택 표시를 꺼 둡니다.
    Array.prototype.forEach.call(penRow.children, function (x, i) {
      x.classList.toggle('on', !state.stamp && PENS[i].id === state.pen);
    });

    Array.prototype.forEach.call(stampGrid.children, function (x) {
      x.classList.toggle('on', x.textContent === state.stamp);
    });
  }

  /* ---------- 화면에 맞춰 자리 잡기 ----------
   * 도장 서랍은 3열로 고정하고 남는 도장은 다음 페이지로 넘깁니다.
   * 그래서 서랍 폭이 화면을 벗어나는 일이 없습니다.
   * -------------------------------------------------------------------- */

  var drawMain = document.getElementById('drawMain');

  var STAMP_BTN = 46;    // 도장 버튼 한 변
  var STAMP_GAP = 6;     // 도장 사이 간격
  var STAMP_CELL = STAMP_BTN + STAMP_GAP;

  function layout() {
    var wide = window.innerWidth > 700;
    var height;

    stampPanel.classList.toggle('collapsed', !state.drawerOpen);

    if (wide) {
      // 창에서 위아래 도구들이 쓰고 남은 높이를 캔버스가 씁니다.
      var top = drawMain.getBoundingClientRect().top;
      var controls = document.getElementById('controls').offsetHeight;
      var avail = Math.max(240, window.innerHeight - top - controls - 24);
      height = Math.round(Math.min(avail, 820));

      // 서랍 폭은 css(.stamp-panel) 가 정합니다. 여기서는 '실제로 몇 px 인지' 재기만 합니다.
      // 숫자를 양쪽에 적어 두면 한쪽만 바뀌었을 때 도장이 잘리기 때문입니다.
      stampPanel.style.height = height + 'px';
      pad.style.maxWidth = Math.round(height * 2) + 'px';

      if (state.drawerOpen) {
        // 도장 수가 바뀌면 페이지 줄이 나타나거나 사라져 높이가 또 달라지므로 두 번 재서 맞춥니다.
        for (var pass = 0; pass < 2; pass++) {
          var cols = Math.max(2, Math.floor((stampGrid.clientWidth + STAMP_GAP) / STAMP_CELL));
          stampGrid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

          var used = stampGrid.getBoundingClientRect().top - stampPanel.getBoundingClientRect().top;
          var space = height - used - 10;   // 10 = 서랍 아래쪽 여백
          var rows = Math.max(2, Math.floor((space + STAMP_GAP) / STAMP_CELL));

          if (!setPerPage(cols * rows)) break;   // 더 바뀔 게 없으면 그만
        }
      }

    } else {
      // 좁은 화면에서는 서랍이 캔버스 아래로 내려가고, 도장을 한 번에 다 보여 줍니다.
      stampPanel.style.width = '';
      stampPanel.style.height = '';
      stampGrid.style.gridTemplateColumns = '';
      pad.style.maxWidth = '';
      setPerPage(STAMPS.length);
      height = Math.round(Math.min(pad.clientWidth * 0.72, window.innerHeight * 0.5));
    }

    fit(Math.round(pad.clientWidth), height);
  }

  // 한 쪽에 몇 개를 놓을지 정합니다. 실제로 바뀌었으면 true 를 돌려줍니다.
  function setPerPage(n) {
    n = Math.max(4, n);
    if (n === state.perPage && stampGrid.children.length) return false;
    state.perPage = n;
    renderStamps();
    syncTools();
    return true;
  }

  function fit(width, height) {
    if (!width || !height) return;
    if (canvas.width === width * dpr && canvas.height === height * dpr) return;

    var before = canvas.width ? canvas.toDataURL() : null;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 크기가 바뀌어도 그리던 그림은 남겨 둡니다.
    if (before) {
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, width, height); };
      img.src = before;
    }
  }

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', function () { setTimeout(layout, 200); });

  /* ---------- 되돌리기 · 다시 하기 ---------- */

  var undoBtn = document.getElementById('undoBtn');
  var redoBtn = document.getElementById('redoBtn');

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  function snapshot() {
    try { return canvas.toDataURL(); } catch (e) { return null; }
  }

  function pushUndo() {
    var data = snapshot();
    if (!data) return;
    undoStack.push(data);
    if (undoStack.length > HISTORY_MAX) undoStack.shift();
    redoStack.length = 0;   // 새로 그리면 '다시 하기'는 사라집니다.
    syncHistory();
  }

  function undo() {
    if (!undoStack.length) return;
    var current = snapshot();
    restore(undoStack.pop(), function () {
      if (current) redoStack.push(current);
      syncHistory();
    });
  }

  function redo() {
    if (!redoStack.length) return;
    var current = snapshot();
    restore(redoStack.pop(), function () {
      if (current) undoStack.push(current);
      syncHistory();
    });
  }

  function restore(data, done) {
    var img = new Image();
    img.onload = function () {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      if (done) done();
    };
    img.src = data;
  }

  function syncHistory() {
    undoBtn.disabled = !undoStack.length;
    redoBtn.disabled = !redoStack.length;
  }

  /* ---------- 저장 · 지우기 · 홈 ---------- */

  document.getElementById('clearBtn').addEventListener('click', function () {
    if (!window.confirm('그림을 다 지울까요?')) return;
    pushUndo();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  });

  document.getElementById('saveBtn').addEventListener('click', function () {
    var a = document.createElement('a');
    a.download = 'daniland-' + timeStamp() + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  document.getElementById('homeBtn').addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  /* ---------- 그리기 ---------- */

  canvas.addEventListener('pointerdown', function (e) {
    // 이미 그리는 중이면 다른 손가락은 무시합니다.
    // (안 그러면 두 번째 손가락 쪽으로 직선이 쭉 그어집니다)
    if (state.drawing) return;

    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }

    pushUndo();

    var p = point(e);
    state.drawing = true;
    state.pointerId = e.pointerId;
    state.last = p;
    state.hue = Math.floor(Math.random() * 360);

    if (state.stamp) { putStamp(p.x, p.y); return; }

    // 점 하나만 콕 찍어도 보이게
    drawSegment(p, { x: p.x + 0.1, y: p.y + 0.1 });
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!state.drawing || e.pointerId !== state.pointerId) return;

    // 캔버스 밖에서 버튼을 뗀 경우 — 다시 들어올 때 직선이 그어지지 않게 여기서 끊습니다.
    if (e.pointerType === 'mouse' && e.buttons === 0) { state.drawing = false; return; }

    e.preventDefault();
    var p = point(e);

    if (state.stamp) {
      var dx = p.x - state.lastStamp.x;
      var dy = p.y - state.lastStamp.y;
      // 끌면 일정 간격마다 도장이 찍힙니다.
      if (Math.sqrt(dx * dx + dy * dy) > STAMP_SIZES[state.sizeIndex] * 0.9) putStamp(p.x, p.y);
      return;
    }

    // 빠르게 그을 때 브라우저가 모아 둔 중간 점들까지 이어 그려 선이 매끄러워집니다.
    var moves = [e];
    if (typeof e.getCoalescedEvents === 'function') {
      try {
        var got = e.getCoalescedEvents();
        if (got && got.length) moves = got;
      } catch (err) { /* 무시 */ }
    }

    moves.forEach(function (m) {
      var q = point(m);
      drawSegment(state.last, q);
      state.last = q;
    });
  });

  // 캔버스 밖에서 손을 떼도 그리기가 멈추도록 창 전체에서 받습니다.
  ['pointerup', 'pointercancel'].forEach(function (type) {
    window.addEventListener(type, function (e) {
      if (state.pointerId === null || e.pointerId === state.pointerId) {
        state.drawing = false;
        state.pointerId = null;
      }
    });
  });

  // 다른 창을 다녀오는 동안 버튼을 뗐을 수도 있으니 여기서도 끊어 줍니다.
  window.addEventListener('blur', function () {
    state.drawing = false;
    state.pointerId = null;
  });

  function point(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  /* ---------- 펜 종류별로 선 그리기 ---------- */

  function drawSegment(from, to) {
    var size = LINE_SIZES[state.sizeIndex];

    if (state.erasing) return stroke(from, to, '#ffffff', size * 2.2);

    switch (state.pen) {
      case 'rainbow': return penRainbow(from, to, size);
      case 'glitter': return penGlitter(from, to, size);
      case 'galaxy':  return penGalaxy(from, to, size);
      case 'neon':    return penNeon(from, to, size);
      case 'candy':   return penCandy(from, to, size);
      default:        return stroke(from, to, state.color, size);
    }
  }

  function stroke(from, to, color, width) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  // 🌈 한 번 그으면 일곱 색이 나란히 따라옵니다.
  function penRainbow(from, to, size) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var len = Math.sqrt(dx * dx + dy * dy);

    // 선에 직각인 방향 — 이쪽으로 색을 한 줄씩 밀어서 무지개 띠를 만듭니다.
    var nx, ny;
    if (len < 0.01) { nx = 0; ny = 1; }        // 콕 찍은 점은 위아래로 펼칩니다.
    else { nx = -dy / len; ny = dx / len; }

    var band = Math.max(1.2, size / RAINBOW.length);
    var half = (RAINBOW.length - 1) / 2;

    RAINBOW.forEach(function (color, i) {
      var off = (i - half) * band;
      stroke(
        { x: from.x + nx * off, y: from.y + ny * off },
        { x: to.x + nx * off, y: to.y + ny * off },
        color,
        band * 1.6   // 살짝 겹치게 그려서 띠 사이에 틈이 생기지 않게
      );
    });
  }

  // ✨ 고른 색으로 선을 긋고, 그 위에 반짝이를 흩뿌립니다.
  function penGlitter(from, to, size) {
    stroke(from, to, state.color, size);

    ctx.save();
    for (var i = 0; i < 4; i++) {
      var t = Math.random();
      var x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * size * 2.4;
      var y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * size * 2.4;
      var r = size * (0.10 + Math.random() * 0.22);

      ctx.globalAlpha = 0.45 + Math.random() * 0.55;
      ctx.fillStyle = (i % 2) ? '#ffffff' : '#ffe680';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 🌌 밤하늘처럼 번지는 선 + 작은 별들
  function penGalaxy(from, to, size) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = state.color;
    ctx.shadowBlur = size * 1.2;
    ctx.strokeStyle = state.color;
    ctx.lineWidth = size * 1.3;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    for (var i = 0; i < 3; i++) {
      var t = Math.random();
      var x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * size * 3;
      var y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * size * 3;

      ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.8 + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 💡 빛나는 네온 선
  function penNeon(from, to, size) {
    ctx.save();
    ctx.shadowColor = state.color;
    ctx.shadowBlur = size * 2;
    ctx.strokeStyle = state.color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.stroke();   // 두 번 겹쳐 더 환하게

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, size * 0.28);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  // 🍬 파스텔 방울이 몽글몽글
  function penCandy(from, to, size) {
    ctx.save();
    for (var i = 0; i < 5; i++) {
      var t = Math.random();
      var x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * size * 1.8;
      var y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * size * 1.8;

      state.hue = (state.hue + 11) % 360;
      ctx.globalAlpha = 0.30 + Math.random() * 0.35;
      ctx.fillStyle = 'hsl(' + state.hue + ', 100%, 80%)';
      ctx.beginPath();
      ctx.arc(x, y, size * (0.25 + Math.random() * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function putStamp(x, y) {
    var size = STAMP_SIZES[state.sizeIndex];
    ctx.font = size + 'px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.fillText(state.stamp, x, y);
    state.lastStamp = { x: x, y: y };
  }

  /* ---------- 도우미 ---------- */

  function timeStamp() {
    var d = new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) +
      '-' + two(d.getHours()) + two(d.getMinutes());
  }

  renderStamps();
  syncTools();
  syncHistory();
  layout();   // 도구를 다 만든 뒤에 크기를 잡아야 정확합니다.
})();
