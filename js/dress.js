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
  ['scenes', 'costumes', 'hairs', 'accessories'].forEach(function (k) { if (!DATA[k]) DATA[k] = []; });

  var el = {
    scene: document.getElementById('scene'),
    tabs: document.getElementById('tabs'),
    choices: document.getElementById('choices'),
    backBtn: document.getElementById('backBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    resetBtn: document.getElementById('resetBtn')
  };

  var state = {
    tab: 'scene',
    sceneId: (DATA.scenes[0] || {}).id,
    costumeId: (DATA.costumes[0] || {}).id,
    hairId: null,   // null 이면 옷 그림의 짧은 머리 그대로
    acc: {}         // 소품 id → true
  };

  bindGo(el.backBtn, Catalog.backHref('dress.html'));

  el.shuffleBtn.addEventListener('click', function () {
    unlock();
    if (window.SFX) SFX.tap();
    state.sceneId = pickRandom(DATA.scenes).id;
    state.costumeId = pickRandom(DATA.costumes).id;
    state.hairId = Math.random() < 0.25 || !DATA.hairs.length ? null : pickRandom(DATA.hairs).id;
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

  // 무대에 놓을 그림 한 칸 — 파일이 없으면 이름이 든 빈 칸을 대신 보여 줍니다
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
    img.src = artPath(kind, id);
    box.appendChild(img);
    return box;
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

    // 모자 든 옷(noHair)은 머리 그림이 모자를 덮어 버려서 머리 층을 빼고 탭도 숨깁니다
    var noHair = !!(costume && costume.noHair);
    var hairTab = el.tabs.querySelector('[data-tab="hair"]');
    hairTab.hidden = noHair;
    if (noHair && state.tab === 'hair') {
      state.tab = 'costume';
      Array.prototype.forEach.call(el.tabs.children, function (b) { b.classList.toggle('on', b.dataset.tab === 'costume'); });
    }
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
    var kind = { scene: 'bg', costume: 'costume', hair: 'hair', accessory: 'acc' }[tab];
    var list = { scene: DATA.scenes, costume: DATA.costumes, hair: DATA.hairs, accessory: DATA.accessories }[tab];
    var multi = tab === 'accessory';

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
