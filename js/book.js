/* =========================================================================
 * 다니랜드 - 영어 그림책
 *
 * js/books.js 의 BOOKS 를 펼친 책(book.jpg) 위에 보여 줍니다. 왼쪽은 그림, 오른쪽은 글.
 * 모든 책이 이 한 화면을 같이 쓰고, 책을 더할 때는 books.js 와 그림 폴더만 늘리면 됩니다.
 *
 * 세 가지로 봅니다 (state.mode)
 *  read : 읽는 책 — 빈칸이 book.read 대로 채워진 완성본. 장을 넘기면 읽어 주고, 낱말을 누르면 그 낱말만
 *         다시 읽어 줍니다. 빈칸이었던 낱말(분홍)을 누르면 그림 속 인물이 폴짝 뜁니다.
 *  make : 만드는 책 — 빈칸이 있는 장에서 그림 셋 중 하나를 고르면 글과 그림이 채워집니다.
 *         고른 것은 뒤 장에도 이어집니다. 다 만들면 daniland.book.<id>.made 에 남습니다.
 *  mine : 만든 책 — made 에 남긴 대로 채워서 read 처럼 읽습니다.
 *
 * 글 속의 {빈칸이름} 은 sub() 가 바꿔 넣습니다 — 영어 글에는 word, 우리말에는 ko, 그림 이름에는 img.
 * 우리말 조사는 {빈칸이름:이가} 처럼 적으면 josa() 가 받침을 보고 고릅니다.
 *
 * 그림은 books/<id>/<이름>.png 를 먼저 찾고, 없으면 book.art 에 적힌 이모지·dani.png 로 대신합니다
 * (artEl()) — 그래서 그림 파일이 오기 전에도 책이 돌아가고, 파일을 넣기만 하면 바뀝니다.
 * ========================================================================= */

(function () {
  var LANG = 'en-US';
  var KO_KEY = 'daniland.book.ko';       // 우리말 뜻을 보일지
  var LAST_KEY = 'daniland.book.last';   // 마지막에 고른 책

  var el = {
    spread: document.getElementById('spread'),
    scene: document.getElementById('scene'),
    text: document.getElementById('text'),
    ko: document.getElementById('ko'),
    choices: document.getElementById('choices'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    speakBtn: document.getElementById('speakBtn'),
    koBtn: document.getElementById('koBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

    startOverlay: document.getElementById('startOverlay'),
    shelf: document.getElementById('shelf'),
    shelfHint: document.getElementById('shelfHint'),
    readBtn: document.getElementById('readBtn'),
    makeBtn: document.getElementById('makeBtn'),
    mineBtn: document.getElementById('mineBtn'),
    startHome: document.getElementById('startHome'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endText: document.getElementById('endText'),
    endMain: document.getElementById('endMain'),
    endAgain: document.getElementById('endAgain'),
    endShelf: document.getElementById('endShelf')
  };

  var books = window.BOOKS || [];

  var state = {
    book: null,
    mode: 'read',
    page: 0,
    chosen: {},         // 빈칸이름 → 고른 선택지 객체
    showKo: UI.loadValue(KO_KEY) !== '0'
  };

  var artCache = {};    // 그림 이름 → 'png' | 'jpg' | 'fallback' (한 번 찾은 결과는 다시 안 찾습니다)

  if (!books.length) {
    el.shelfHint.textContent = 'js/books.js 에 책이 없어요';
    el.readBtn.hidden = el.makeBtn.hidden = true;
  }

  // 처음 고를 책 — 주소의 ?book= 이 있으면 그것, 아니면 마지막에 본 책
  var want = UI.getParam('book') || UI.loadValue(LAST_KEY);
  state.book = findBook(want) || books[0] || null;

  buildShelf();
  applyKo();
  fit();

  el.readBtn.addEventListener('click', function () { begin('read'); });
  el.makeBtn.addEventListener('click', function () { begin('make'); });
  el.mineBtn.addEventListener('click', function () { begin('mine'); });

  el.prevBtn.addEventListener('click', function () { if (state.page > 0) go(state.page - 1); });
  el.nextBtn.addEventListener('click', function () {
    if (!canLeave()) { nudgeChoices(); return; }
    if (state.page >= state.book.pages.length - 1) finish();
    else go(state.page + 1);
  });

  el.speakBtn.addEventListener('click', function () { readPage(true); });

  el.koBtn.addEventListener('click', function () {
    state.showKo = !state.showKo;
    UI.saveValue(KO_KEY, state.showKo ? '1' : '0');
    applyKo();
  });

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;
  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return currentText() || 'This is Princess Dani.'; } });
  });

  el.endAgain.addEventListener('click', function () { begin(state.mode); });
  el.endMain.addEventListener('click', function () { begin(el.endMain.dataset.mode); });
  el.endShelf.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    buildShelf();
    el.startOverlay.hidden = false;
  });

  bindGo(el.backBtn, backHref());
  bindGo(el.startHome, backHref());

  function bindGo(btn, href) {
    btn.addEventListener('click', function () { window.location.href = href; });
  }

  function backHref() {
    var pages = window.PAGES || [];
    for (var i = 0; i < pages.length; i++) {
      if ((pages[i].href || '').indexOf('book.html') === 0 && pages[i].subject) {
        return Catalog.href(pages[i].subject);
      }
    }
    return 'index.html';
  }

  function findBook(id) {
    for (var i = 0; i < books.length; i++) if (books[i].id === id) return books[i];
    return null;
  }

  function madeKey(book) { return 'daniland.book.' + book.id + '.made'; }
  function readKey(book) { return 'daniland.book.' + book.id + '.read'; }

  function loadMade(book) {
    try {
      var v = JSON.parse(UI.loadValue(madeKey(book)) || 'null');
      return v && typeof v === 'object' ? v : null;
    } catch (e) { return null; }
  }

  /* ---------- 책장 ---------- */

  function buildShelf() {
    el.shelf.innerHTML = '';
    el.shelfHint.textContent = books.length > 1 ? '어떤 책을 볼까요?' : '';

    books.forEach(function (book) {
      var card = document.createElement('button');
      card.className = 'book-cover' + (book === state.book ? ' on' : '');

      var art = artEl(book, book.cover, 'cover');
      card.appendChild(art);

      var badge = document.createElement('div');
      badge.className = 'book-cover-badge';
      badge.textContent = (UI.loadValue(readKey(book)) ? '📖' : '') + (loadMade(book) ? '✏️' : '');
      card.appendChild(badge);

      var t = document.createElement('div');
      t.className = 'book-cover-title';
      t.innerHTML = '<b>' + book.title + '</b><span>' + book.titleKo + '</span>';
      card.appendChild(t);

      card.addEventListener('click', function () {
        state.book = book;
        if (window.SFX) SFX.tap();
        Array.prototype.forEach.call(el.shelf.children, function (x) { x.classList.toggle('on', x === card); });
        el.mineBtn.hidden = !loadMade(book);
      });
      el.shelf.appendChild(card);
    });

    el.mineBtn.hidden = !(state.book && loadMade(state.book));
  }

  /* ---------- 시작 · 끝 ---------- */

  function begin(mode) {
    if (!state.book) return;
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    UI.saveValue(LAST_KEY, state.book.id);

    state.mode = mode;
    state.chosen = {};

    // 읽는 책·만든 책은 빈칸을 미리 채워 둡니다
    var preset = mode === 'read' ? state.book.read : (mode === 'mine' ? loadMade(state.book) : null);
    if (preset) {
      state.book.pages.forEach(function (p) {
        if (!p.blank) return;
        var opt = findOption(p.blank, preset[p.blank.key]);
        if (opt) state.chosen[p.blank.key] = opt;
      });
    }

    el.startOverlay.hidden = true;
    el.endOverlay.hidden = true;
    fit();
    go(0);
  }

  function findOption(blank, word) {
    for (var i = 0; i < blank.options.length; i++) {
      if (blank.options[i].word === word) return blank.options[i];
    }
    return null;
  }

  function finish() {
    if (window.TTS) TTS.cancel();
    var book = state.book;
    var made = {};

    if (state.mode === 'make') {
      book.pages.forEach(function (p) {
        if (p.blank && state.chosen[p.blank.key]) made[p.blank.key] = state.chosen[p.blank.key].word;
      });
      UI.saveValue(madeKey(book), JSON.stringify(made));

      el.endTitle.textContent = '다니의 책이 완성됐어요! 📚';
      el.endText.textContent = Object.keys(made).map(function (k) { return made[k]; }).join(' · ');
      el.endMain.textContent = '📚 내 책 읽기';
      el.endMain.dataset.mode = 'mine';
      el.endAgain.textContent = '✏️ 다시 만들기';
    } else {
      if (state.mode === 'read') UI.saveValue(readKey(book), '1');
      el.endTitle.textContent = '다 읽었어요!';
      el.endText.textContent = state.mode === 'read' ? '이번엔 내가 만들어 볼까요?' : '내가 만든 「' + book.title + '」 이에요';
      el.endMain.textContent = state.mode === 'read' ? '✏️ 내가 만들래요' : '✏️ 새로 만들기';
      el.endMain.dataset.mode = 'make';
      el.endAgain.textContent = '🔁 다시 읽기';
    }

    if (window.SFX) SFX.finish();
    UI.confettiAt(el.scene);
    setTimeout(function () { el.endOverlay.hidden = false; }, 500);
  }

  /* ---------- 장 넘기기 ---------- */

  function go(i) {
    if (window.TTS) TTS.cancel();
    state.page = i;

    el.spread.classList.remove('flip');
    void el.spread.offsetWidth;
    el.spread.classList.add('flip');

    render();
    updateNav();
    setTimeout(function () { if (state.page === i) readPage(false); }, 350);
  }

  function page() { return state.book.pages[state.page]; }

  // 만드는 책에서는 빈칸을 채워야 다음 장으로 갑니다
  function canLeave() {
    var p = page();
    return !(state.mode === 'make' && p.blank && !state.chosen[p.blank.key]);
  }

  function updateNav() {
    var n = state.book.pages.length;
    el.score.textContent = (state.page + 1) + ' / ' + n;
    el.bar.style.width = Math.round((state.page + 1) / n * 100) + '%';
    el.prevBtn.disabled = state.page === 0;
    el.nextBtn.classList.toggle('dim', !canLeave());
    el.nextBtn.textContent = state.page === n - 1 ? '끝 ✔' : '▶';
  }

  function nudgeChoices() {
    el.choices.classList.remove('nudge');
    void el.choices.offsetWidth;
    el.choices.classList.add('nudge');
    if (window.SFX) SFX.tap();
  }

  /* ---------- 글 ---------- */

  // {빈칸이름} {빈칸이름.emoji} {빈칸이름:이가} 를 고른 것으로 바꿉니다. 안 고른 빈칸은 빈 문자열.
  function sub(str, field) {
    return String(str || '').replace(/\{([a-zA-Z_]+)(?:\.([a-z]+))?(?::([^}]+))?\}/g, function (m, key, prop, particle) {
      var opt = state.chosen[key];
      if (!opt) return field === 'ko' ? '___' : '';   // 우리말에서는 빈칸이 보이게
      var v = prop ? opt[prop] : (opt[field] !== undefined ? opt[field] : opt.word);
      if (v === undefined || v === null) v = opt.word;
      return particle ? josa(v, particle) : v;
    });
  }

  // 받침을 보고 조사를 고릅니다: 이가 · 을를 · 은는 · 과와 · 으로
  function josa(word, pair) {
    var code = word.charCodeAt(word.length - 1);
    var hangul = code >= 0xAC00 && code <= 0xD7A3;
    var jong = hangul ? (code - 0xAC00) % 28 : 0;
    var tail = hangul && jong > 0;
    var pick;
    if (pair === '으로') pick = (tail && jong !== 8) ? '으로' : '로';   // ㄹ 받침은 '로'
    else if (pair.length === 2) pick = tail ? pair.charAt(0) : pair.charAt(1);
    else pick = pair;
    return word + pick;
  }

  function currentText() { return sub(page().text, 'word'); }

  function renderText() {
    var p = page();
    el.text.innerHTML = '';

    // {빈칸} 을 경계로 자르고, 나머지는 낱말과 띄어쓰기로 나눕니다
    var parts = p.text.split(/(\{[a-zA-Z_]+\})/);
    parts.forEach(function (part) {
      var m = /^\{([a-zA-Z_]+)\}$/.exec(part);
      if (m) {
        var key = m[1];
        var opt = state.chosen[key];
        var span = document.createElement('span');
        span.className = 'w blank' + (opt ? ' filled' : '');
        span.dataset.key = key;
        span.textContent = opt ? opt.word : '';
        span.addEventListener('click', function () {
          if (!opt) { nudgeChoices(); return; }
          say(opt.word);
          bounce(key);
        });
        el.text.appendChild(span);
        return;
      }
      part.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { el.text.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span');
        w.className = 'w';
        w.textContent = tok;
        var plain = tok.replace(/^[^A-Za-z']+|[^A-Za-z'!?]+$/g, '');
        if (plain) w.addEventListener('click', function () { say(plain); });
        el.text.appendChild(w);
      });
    });

    el.ko.textContent = sub(p.ko, 'ko').replace(/\s{2,}/g, ' ');
  }

  function applyKo() {
    el.ko.hidden = !state.showKo;
    el.koBtn.classList.toggle('on', state.showKo);
  }

  /* ---------- 빈칸 고르기 ---------- */

  function renderChoices() {
    var p = page();
    var show = state.mode === 'make' && !!p.blank;
    el.choices.hidden = !show;
    el.choices.innerHTML = '';
    if (!show) return;

    p.blank.options.forEach(function (opt) {
      var b = document.createElement('button');
      b.className = 'book-choice' + (state.chosen[p.blank.key] === opt ? ' on' : '');
      b.innerHTML = '<span class="art">' + opt.emoji + '</span>' +
                    '<span class="word">' + opt.word + '</span>' +
                    '<span class="ko">' + opt.ko + '</span>';
      b.addEventListener('click', function () { choose(p.blank.key, opt); });
      el.choices.appendChild(b);
    });
  }

  function choose(key, opt) {
    if (window.SFX) SFX.tap();
    state.chosen[key] = opt;
    renderScene();
    renderText();
    renderChoices();
    updateNav();
    say(currentText());
    bounce(key);
  }

  /* ---------- 그림 ---------- */

  function renderScene() {
    var p = page(), book = state.book;
    el.scene.innerHTML = '';

    // 만드는 책에서 아직 배경을 안 골랐으면 이름이 비어 하늘·땅만 그립니다
    el.scene.appendChild(artEl(book, sub(p.bg, 'img'), 'bg'));

    (p.actors || []).forEach(function (a) {
      var name = sub(a.art, 'img');
      if (!name) return;
      var node = artEl(book, name, 'actor');
      node.style.setProperty('--w', a.w || 40);
      node.style.left = (a.x || 50) + '%';
      node.style.bottom = (100 - (a.y || 96)) + '%';
      // 어느 빈칸에서 온 인물인지 적어 두면 낱말을 눌렀을 때 그 인물만 뛰게 할 수 있습니다
      var keys = [];
      String(a.art).replace(/\{([a-zA-Z_]+)\}/g, function (m, k) { keys.push(k); return m; });
      node.dataset.keys = keys.join(' ');
      el.scene.appendChild(node);
    });

    (p.props || []).forEach(function (pr) {
      var emoji = sub(pr.emoji, 'emoji');
      if (!emoji) return;
      var node = document.createElement('div');
      node.className = 'book-prop' + (pr.bubble ? ' bubble' : '');
      node.textContent = emoji;
      node.style.setProperty('--w', pr.size || 12);
      node.style.left = (pr.x || 50) + '%';
      node.style.top = (pr.y || 50) + '%';
      var keys = [];
      String(pr.emoji).replace(/\{([a-zA-Z_]+)/g, function (m, k) { keys.push(k); return m; });
      node.dataset.keys = keys.join(' ');
      el.scene.appendChild(node);
    });
  }

  // 그림 하나 — books/<id>/<이름>.png 이 있으면 그것, 없으면 book.art 의 대체물
  function artEl(book, name, kind) {
    var box = document.createElement('div');
    box.className = 'book-art ' + kind;
    var fb = (book.art && book.art[name]) || {};

    if (kind === 'bg' || kind === 'cover') {
      box.style.background = 'linear-gradient(180deg, ' + (fb.sky || '#e8f3ff') + ' 0%, ' +
                             (fb.sky || '#e8f3ff') + ' 62%, ' + (fb.ground || '#cde8b0') + ' 62%)';
    }

    // .png 를 먼저, 없으면 .jpg (배경은 투명이 필요 없어 jpg 가 훨씬 작습니다). 한 번 찾은 결과는 기억합니다.
    var found = artCache[name];
    if (name && found !== 'fallback') {
      var img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      var exts = found ? [found] : ['png', 'jpg'];
      var k = 0;
      img.addEventListener('load', function () { artCache[name] = exts[k]; box.classList.add('has-file'); });
      img.addEventListener('error', function () {
        k += 1;
        if (k < exts.length) { img.src = 'books/' + book.id + '/' + name + '.' + exts[k]; return; }
        artCache[name] = 'fallback';
        img.remove();
        fillFallback(box, fb, kind);
      });
      img.src = 'books/' + book.id + '/' + name + '.' + exts[0];
      box.appendChild(img);
    } else {
      fillFallback(box, fb, kind);
    }
    return box;
  }

  function fillFallback(box, fb, kind) {
    if (fb.src) {
      var img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      img.src = fb.src;
      box.appendChild(img);
    } else if (fb.emoji) {
      var e = document.createElement('div');
      e.className = 'emoji' + (kind === 'actor' ? '' : ' bg-emoji');
      e.textContent = fb.emoji;
      box.appendChild(e);
    }
    if (fb.badge) {
      var b = document.createElement('div');
      b.className = 'badge';
      b.textContent = fb.badge;
      box.appendChild(b);
    }
    if (fb.tint) {
      var t = document.createElement('div');
      t.className = 'tint';
      t.style.background = fb.tint;
      box.appendChild(t);
    }
  }

  // 그 빈칸에서 온 인물·소품이 폴짝 뜁니다
  function bounce(key) {
    Array.prototype.forEach.call(el.scene.querySelectorAll('[data-keys]'), function (node) {
      if ((' ' + node.dataset.keys + ' ').indexOf(' ' + key + ' ') < 0) return;
      node.classList.remove('hop');
      void node.offsetWidth;
      node.classList.add('hop');
    });
  }

  function render() {
    renderScene();
    renderText();
    renderChoices();
  }

  /* ---------- 소리 ---------- */

  function say(text) {
    if (!text || !window.TTS || !TTS.supported) return;
    el.speakBtn.classList.add('speaking');
    TTS.speak(text, LANG, { onend: function () { el.speakBtn.classList.remove('speaking'); } });
    setTimeout(function () { el.speakBtn.classList.remove('speaking'); }, 900 + text.length * 90);
  }

  // 장을 펼치면 읽어 줍니다. 만드는 책에서 아직 안 고른 빈칸이 든 문장은 건너뜁니다.
  function readPage(force) {
    var p = page();
    var text;
    if (state.mode === 'make' && p.blank && !state.chosen[p.blank.key]) {
      var sentences = p.text.match(/[^.!?]+[.!?]+["']?/g) || [p.text];
      text = sentences.filter(function (s) { return s.indexOf('{' + p.blank.key + '}') < 0; })
                      .map(function (s) { return sub(s, 'word'); }).join(' ').trim();
      if (!text && !force) return;
    } else {
      text = currentText();
    }
    say(text);
  }

  /* ---------- 화면에 맞추기 ----------
   * 넓은 화면: 펼친 책이 아래 단추 줄까지 스크롤 없이 들어오게 너비를 정합니다 (3:2).
   * 좁은 화면(639px 이하): CSS 가 위아래로 쌓고, 너비는 그대로 둡니다. */

  function px(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }

  function fit() {
    var narrow = window.matchMedia('(max-width: 639px)').matches;
    if (narrow) { el.spread.style.width = ''; return; }

    var top = el.spread.getBoundingClientRect().top;
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var wrapEl = document.querySelector('.wrap');
    var nav = document.querySelector('.book-nav');
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var navH = nav ? nav.offsetHeight + px(getComputedStyle(nav).marginTop) : 0;

    var availH = screenH - top - navH - bottomPad - 6;
    var availW = el.spread.parentNode.clientWidth;
    var w = Math.floor(Math.max(560, Math.min(availW, availH * 1.5)));
    el.spread.style.width = w + 'px';
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  // 컴퓨터에서는 화살표로 장을 넘깁니다
  document.addEventListener('keydown', function (e) {
    if (!el.startOverlay.hidden || !el.endOverlay.hidden) return;
    if (e.key === 'ArrowRight') { el.nextBtn.click(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { el.prevBtn.click(); e.preventDefault(); }
  });
})();
