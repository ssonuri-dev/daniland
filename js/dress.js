/* =========================================================================
 * 다니랜드 - 코디 놀이
 *
 * js/outfits.js 의 배경·옷·소품을 무대 위에 겹쳐서 보여 줍니다.
 * 점수 없는 자유 놀이라 정답도, 최고 기록도 없습니다 — 그림 그리기(draw.html)와 같은 성격입니다.
 *
 * 옷·배경·머리는 하나만 고르고(같은 자리를 바꿔 끼움), 소품은 여러 개를 동시에 걸칠 수 있습니다.
 * 머리는 안 골라도 됩니다 — 옷 그림의 다니가 원래 짧은 머리라 그게 '기본' 입니다.
 *
 * ★ 이모지 대체 그림을 쓰지 않습니다 — 전부 dress/ 폴더의 그림 파일로만 그립니다 (outfits.js 머리 주석의
 *   파일 자리 참고). 그림이 아직 없으면 이름 글자가 든 빈 칸(artBox 의 .dress-missing)으로 보이고,
 *   파일을 넣으면 다음에 열 때 자동으로 그 그림이 나옵니다.
 * ========================================================================= */

(function () {
  var DATA = window.OUTFITS || {};
  ['scenes', 'costumes', 'hairs', 'hairColors', 'accessories'].forEach(function (k) { if (!DATA[k]) DATA[k] = []; });

  var el = {
    scene: document.getElementById('scene'),
    tabs: document.getElementById('tabs'),
    choices: document.getElementById('choices'),
    colors: document.getElementById('colors'),
    backBtn: document.getElementById('backBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    resetBtn: document.getElementById('resetBtn')
  };

  var state = {
    tab: 'scene',
    sceneId: (DATA.scenes[0] || {}).id,
    costumeId: (DATA.costumes[0] || {}).id,
    hairId: null,   // null 이면 옷 그림의 짧은 머리 그대로
    hairColor: (DATA.hairColors[0] || {}).id,   // 첫 번째(갈색)는 그림 그대로
    acc: {}         // 소품 id → true
  };

  bindGo(el.backBtn, Catalog.backHref('dress.html'));

  el.shuffleBtn.addEventListener('click', function () {
    unlock();
    if (window.SFX) SFX.tap();
    state.sceneId = pickRandom(DATA.scenes).id;
    state.costumeId = pickRandom(DATA.costumes).id;
    state.hairId = Math.random() < 0.25 || !DATA.hairs.length ? null : pickRandom(DATA.hairs).id;
    state.hairColor = (Math.random() < 0.4 || !DATA.hairColors.length ? DATA.hairColors[0] || {} : pickRandom(DATA.hairColors)).id;
    state.acc = {};
    randomAccessories();
    render();
    renderChoices();
  });

  el.resetBtn.addEventListener('click', function () {
    unlock();
    if (window.SFX) SFX.tap();
    state.sceneId = (DATA.scenes[0] || {}).id;
    state.costumeId = (DATA.costumes[0] || {}).id;
    state.hairId = null;
    state.hairColor = (DATA.hairColors[0] || {}).id;
    state.acc = {};
    render();
    renderChoices();
  });

  Array.prototype.forEach.call(el.tabs.children, function (btn) {
    btn.addEventListener('click', function () {
      state.tab = btn.dataset.tab;
      Array.prototype.forEach.call(el.tabs.children, function (b) { b.classList.toggle('on', b === btn); });
      renderChoices();
    });
  });

  function unlock() { if (window.TTS) TTS.unlock(); if (window.SFX) SFX.unlock(); }
  function bindGo(btn, href) { btn.addEventListener('click', function () { window.location.href = href; }); }
  function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }
  function findById(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  // 소품 두어 개를 무작위로 걸쳐 줍니다 ('오늘의 코디' 를 재밌게 만드는 용도)
  function randomAccessories() {
    var pool = DATA.accessories.slice();
    var n = Math.min(2, pool.length);
    for (var i = 0; i < n; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      state.acc[pool[idx].id] = true;
      pool.splice(idx, 1);
    }
  }

  /* ---------- 그림 (배경 · 옷 · 소품 공용) ---------- */

  // kind: 'bg' | 'costume' | 'hair' | 'acc'  — 배경만 jpg, 나머지는 투명 png
  function artPath(kind, id) {
    return 'dress/' + kind + '-' + id + (kind === 'bg' ? '.jpg' : '.png');
  }

  // 무대에 놓을 그림 한 칸 — 파일이 없으면 이름이 든 빈 칸을 대신 보여 줍니다.
  // 옷·머리 그림은 고른 머리색으로 머리카락을 물들여서 보여 줍니다 (tintHair).
  function artBox(kind, id, name) {
    var box = document.createElement('div');
    box.className = 'dress-art ' + (kind === 'bg' ? 'dress-bg' : kind === 'costume' ? 'dress-actor' : 'dress-prop');

    var img = document.createElement('img');
    img.alt = name || '';
    img.draggable = false;
    img.addEventListener('error', function () {
      img.remove();
      var m = document.createElement('div');
      m.className = 'dress-missing';
      m.textContent = name || '';
      box.appendChild(m);
    });
    var color = (kind === 'costume' || kind === 'hair') ? hairColorOf(state.hairColor) : null;
    if (color && color.h !== undefined) {
      // 물들인 그림은 dataURL 로 기억해 두었다가 다시 씁니다 — 같은 옷·같은 색이면 두 번 계산하지 않게
      var key = kind + '/' + id + '/' + color.id;
      if (tintCache[key]) img.src = tintCache[key];
      else {
        var src = new Image();
        src.onload = function () {
          var url = tintHair(src, color, kind === 'costume');
          if (url) tintCache[key] = url;
          img.src = url || artPath(kind, id);
        };
        src.onerror = function () { img.src = artPath(kind, id); };   // 파일이 없으면 img 의 error 로 넘어가 빈 칸이 됩니다
        src.src = artPath(kind, id);
      }
    } else img.src = artPath(kind, id);
    box.appendChild(img);
    return box;
  }

  var tintCache = {};
  function hairColorOf(id) { return findById(DATA.hairColors, id); }

  /* ---------- 머리색 물들이기 ----------
   * 머리색마다 그림 파일을 따로 두면 옷 30벌 × 색 7가지가 되어 너무 많아서, 그림의 갈색 머리카락 픽셀을 찾아
   * 화면에서 바로 물들입니다. 색조(hue)·채도만 바꾸고 밝기(명암)는 원래 그림에서 가져오므로 머리결이 남습니다.
   *  - 머리카락 = 어둡고(v<0.62) 갈색 계열(hue 340~55°)이며 채도가 있는 픽셀. 가장자리는 부드럽게 섞습니다(weight).
   *  - 눈·눈썹도 짙은 갈색이라 같이 잡히는데, 머리카락 덩어리보다 훨씬 작아서 '큰 덩어리만' 남기는 것으로 거릅니다
   *    (costume 그림만 — 머리 그림은 머리카락뿐이라 그대로).
   *  - file:// 로 열면 canvas 가 그림을 못 읽습니다(SecurityError) — 그때는 null 을 돌려주고 원래 색으로 보입니다.
   */
  function tintHair(src, color, guardFace) {
    var w = src.naturalWidth, h = src.naturalHeight;
    if (!w || !h) return null;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    ctx.drawImage(src, 0, 0);
    var data;
    try { data = ctx.getImageData(0, 0, w, h); } catch (e) { return null; }
    var d = data.data, n = w * h;
    var weight = new Float32Array(n);
    var i, x, y, r, g, b, mx, mn, v, s, hue, dw, sw;

    for (i = 0; i < n; i++) {
      if (d[i * 4 + 3] < 8) continue;
      r = d[i * 4]; g = d[i * 4 + 1]; b = d[i * 4 + 2];
      mx = Math.max(r, g, b); mn = Math.min(r, g, b);
      if (mx === mn) continue;
      v = mx / 255; s = (mx - mn) / mx;
      hue = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
      hue = (hue * 60 + 360) % 360;
      if (hue > 55 && hue < 340) continue;             // 갈색 계열만 (붉은 갈색~노란 갈색)
      dw = (0.62 - v) / 0.17; sw = (s - 0.12) / 0.15;  // 어두울수록·채도 있을수록 머리카락
      if (dw <= 0 || sw <= 0) continue;
      weight[i] = Math.min(1, dw) * Math.min(1, sw);
    }

    // 옷 그림: 머리카락 덩어리(수만 픽셀)만 남기고 눈·눈썹·윤곽선 같은 작은 덩어리는 버립니다
    if (guardFace) {
      var seen = new Uint8Array(n), stack = [], comp, k, p, q, limit = n * 0.01;
      for (i = 0; i < n; i++) {
        if (weight[i] < 0.5 || seen[i]) continue;
        comp = []; stack.push(i); seen[i] = 1;
        while (stack.length) {
          p = stack.pop(); comp.push(p);
          x = p % w;
          for (k = 0; k < 4; k++) {
            if ((k === 0 && x === 0) || (k === 1 && x === w - 1)) continue;
            q = k === 0 ? p - 1 : k === 1 ? p + 1 : k === 2 ? p - w : p + w;
            if (q < 0 || q >= n || seen[q] || weight[q] < 0.5) continue;
            seen[q] = 1; stack.push(q);
          }
        }
        if (comp.length < limit) for (k = 0; k < comp.length; k++) { weight[comp[k]] = 0; seen[comp[k]] = 2; }
      }
      // 연한 가장자리(weight<0.5)는 남긴 덩어리 옆에 붙은 것만 물들입니다 — 버린 덩어리(눈) 둘레는 그대로
      for (i = 0; i < n; i++) {
        if (weight[i] <= 0 || weight[i] >= 0.5) continue;
        x = i % w;
        if (!((x > 0 && seen[i - 1] === 1) || (x < w - 1 && seen[i + 1] === 1) ||
              (i >= w && seen[i - w] === 1) || (i + w < n && seen[i + w] === 1))) weight[i] = 0;
      }
    }

    var lo = color.lo, hi = color.hi, t, l, rgb, wt;
    for (i = 0; i < n; i++) {
      wt = weight[i];
      if (wt <= 0) continue;
      r = d[i * 4]; g = d[i * 4 + 1]; b = d[i * 4 + 2];
      mx = Math.max(r, g, b); mn = Math.min(r, g, b);
      l = (mx + mn) / 510;                              // 원래 밝기(0~1) — 갈색 머리는 대략 0.08~0.42
      t = Math.max(0, Math.min(1, (l - 0.08) / 0.34));
      rgb = hslToRgb(color.h, color.s, lo + (hi - lo) * t);
      d[i * 4]     = Math.round(r + (rgb[0] - r) * wt);
      d[i * 4 + 1] = Math.round(g + (rgb[1] - g) * wt);
      d[i * 4 + 2] = Math.round(b + (rgb[2] - b) * wt);
    }
    ctx.putImageData(data, 0, 0);
    return cv.toDataURL('image/png');
  }

  function hslToRgb(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, hp = h / 60, xx = c * (1 - Math.abs(hp % 2 - 1)), m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (hp < 1) { r = c; g = xx; } else if (hp < 2) { r = xx; g = c; } else if (hp < 3) { g = c; b = xx; }
    else if (hp < 4) { g = xx; b = c; } else if (hp < 5) { r = xx; b = c; } else { r = c; b = xx; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }

  // 고르는 칸에 쓰는 작은 미리보기 — 무대 그림과 같은 파일을 작게 보여 줍니다
  function thumbEl(kind, id) {
    var box = document.createElement('div');
    box.className = 'dress-thumb';
    var img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.addEventListener('error', function () {
      img.remove();
      box.classList.add('missing');
    });
    img.src = artPath(kind, id);
    box.appendChild(img);
    return box;
  }

  /* ---------- 무대 ---------- */

  function render() {
    el.scene.innerHTML = '';
    var scene = findById(DATA.scenes, state.sceneId);
    var costume = findById(DATA.costumes, state.costumeId);

    if (scene) el.scene.appendChild(artBox('bg', scene.id, scene.name));

    if (costume) {
      var actor = artBox('costume', costume.id, costume.name);
      actor.style.setProperty('--w', 66);   // 무대 너비의 66% — 머리·소품 좌표(outfits.js)가 이 값 기준이라 바꾸면 같이 다시 재야 합니다
      el.scene.appendChild(actor);
    }

    // 모자 든 옷(noHair)은 머리 그림이 모자를 덮어 버려서 머리 층을 뺍니다 — 머리 탭에는 머리색만 남습니다 (renderChoices)
    var noHair = !!(costume && costume.noHair);
    var hair = noHair ? null : findById(DATA.hairs, state.hairId);
    if (hair) el.scene.appendChild(propBox('hair', hair));

    DATA.accessories.forEach(function (a) {
      if (state.acc[a.id]) el.scene.appendChild(propBox('acc', a));
    });
  }

  // 머리·소품처럼 무대 위 한 자리(x·y·size)에 얹는 그림
  function propBox(kind, item) {
    var prop = artBox(kind, item.id, item.name);
    prop.style.setProperty('--w', item.size || 16);
    prop.style.left = item.x + '%';
    prop.style.top = item.y + '%';
    return prop;
  }

  /* ---------- 고르는 칸 ---------- */

  function renderChoices() {
    el.choices.innerHTML = '';
    var tab = state.tab;
    renderColors(tab === 'hair');
    var kind = { scene: 'bg', costume: 'costume', hair: 'hair', accessory: 'acc' }[tab];
    var list = { scene: DATA.scenes, costume: DATA.costumes, hair: DATA.hairs, accessory: DATA.accessories }[tab];
    var multi = tab === 'accessory';

    // 모자 든 옷을 입고 있으면 머리 모양은 못 고릅니다 (모자에 가려서) — 색 단추 줄만 남깁니다
    if (tab === 'hair') {
      var costume = findById(DATA.costumes, state.costumeId);
      if (costume && costume.noHair) return;
    }

    // 머리는 '기본'(옷 그림의 짧은 머리)도 고를 수 있게 맨 앞에 한 칸
    if (tab === 'hair') el.choices.appendChild(choiceBtn(null, '기본', state.hairId === null, function () { state.hairId = null; }));

    list.forEach(function (item) {
      var on = multi ? !!state.acc[item.id]
             : tab === 'scene' ? state.sceneId === item.id
             : tab === 'hair' ? state.hairId === item.id
             : state.costumeId === item.id;
      el.choices.appendChild(choiceBtn(thumbEl(kind, item.id), item.name, on, function () {
        if (multi) state.acc[item.id] = !state.acc[item.id];
        else if (tab === 'scene') state.sceneId = item.id;
        else if (tab === 'hair') state.hairId = item.id;
        else state.costumeId = item.id;
      }));
    });
  }

  // 머리색 단추 줄 — 머리 탭에서만 보이고, 색 하나를 고르면 옷·머리 그림을 다시 물들입니다
  function renderColors(show) {
    el.colors.hidden = !show || !DATA.hairColors.length;
    el.colors.innerHTML = '';
    if (el.colors.hidden) return;
    DATA.hairColors.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'dress-color' + (state.hairColor === c.id ? ' on' : '');
      var dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = c.swatch;
      b.appendChild(dot);
      b.appendChild(document.createTextNode(c.name));
      b.addEventListener('click', function () {
        unlock();
        if (window.SFX) SFX.tap();
        state.hairColor = c.id;
        render();
        renderChoices();
        speak(c.name + ' 머리');
      });
      el.colors.appendChild(b);
    });
  }

  function choiceBtn(thumb, name, on, apply) {
    var b = document.createElement('button');
    b.className = 'book-choice dress-choice' + (on ? ' on' : '');
    if (thumb) b.appendChild(thumb);
    var word = document.createElement('span');
    word.className = 'word';
    word.textContent = name;
    b.appendChild(word);
    b.addEventListener('click', function () {
      unlock();
      if (window.SFX) SFX.tap();
      apply();
      render();
      renderChoices();
      speak(name);
    });
    return b;
  }

  function speak(name) {
    if (!window.TTS || !TTS.supported) return;
    TTS.speak(name, 'ko-KR');
  }

  render();
  renderChoices();
})();
