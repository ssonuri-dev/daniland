/* =========================================================================
 * 다니랜드 - 과목 페이지
 *
 * 주소 예) subject.html?name=영어              과목의 카드 (묶음이 있으면 묶음 카드)
 *         subject.html?name=영어&group=단어 공부   그 묶음 안의 수업·놀이 카드
 *
 * 카드가 많은 과목은 js/data.js 의 SUBJECTS[].groups 로 한 층 더 나뉩니다 —
 * 과목 카드를 누르면 먼저 묶음 카드가 나오고, 묶음을 누르면 그 안의 카드가 나옵니다.
 * 묶음이 없는 과목(세계 · 놀이)은 카드가 바로 나옵니다.
 * ========================================================================= */

(function () {
  var el = {
    icon: document.getElementById('subjectIcon'),
    name: document.getElementById('subjectName'),
    desc: document.getElementById('subjectDesc'),
    up: document.getElementById('upBtn'),
    host: document.getElementById('lessons')
  };

  var subject = Catalog.find(UI.getParam('name'));

  // 없는 과목 주소로 들어왔으면 홈으로 되돌립니다.
  if (!subject) {
    window.location.replace('index.html');
    return;
  }

  var groupName = UI.getParam('group');
  var group = groupName ? Catalog.findGroup(subject.name, groupName) : null;

  // 없는 묶음 주소면 과목 페이지로 되돌립니다.
  if (groupName && !group) {
    window.location.replace(Catalog.href(subject.name));
    return;
  }

  var grid = document.createElement('div');
  grid.className = 'lesson-grid';

  if (group) {
    // 묶음 안의 카드 — ← 는 과목 페이지로
    document.title = group.name + ' · ' + subject.name + ' · 다니랜드 🐾';
    el.icon.textContent = group.icon;
    el.name.textContent = group.name;
    el.desc.textContent = group.desc || subject.name;
    el.up.href = Catalog.href(subject.name);
    el.up.textContent = '←';
    el.up.title = subject.name;
    group.cards.forEach(function (card) { grid.appendChild(makeCard(card)); });
  } else {
    document.title = subject.name + ' · 다니랜드 🐾';
    el.icon.textContent = subject.icon;
    el.name.textContent = subject.name;
    el.desc.textContent = subject.desc;

    if (subject.groups.length) {
      // 묶음 카드 — 누르면 그 묶음의 카드가 나옵니다
      subject.groups.forEach(function (g) { grid.appendChild(makeGroupCard(g)); });
    } else {
      subject.cards.forEach(function (card) { grid.appendChild(makeCard(card)); });
    }
  }

  el.host.appendChild(grid);

  function makeGroupCard(g) {
    var a = document.createElement('a');
    a.className = 'lesson-card group-card';
    a.href = Catalog.href(subject.name, g.name);

    add(a, 'icon', g.icon);
    add(a, 'name', g.name);
    if (g.desc) add(a, 'meta', g.desc);
    add(a, 'count', g.cards.length + '가지');

    return a;
  }

  function makeCard(card) {
    var a = document.createElement('a');
    a.className = 'lesson-card';
    a.href = card.href;

    add(a, 'icon', card.icon);
    add(a, 'name', card.title);
    if (card.meta) add(a, 'meta', card.meta);
    if (card.best) {
      // 단위가 있으면 '⭐ 최고 5단계', 없으면 '⭐ 최고 8/10'
      add(a, 'best', '⭐ 최고 ' + card.best.stars + (card.bestUnit || ('/' + card.best.total)));
    }

    return a;
  }

  function add(parent, className, text) {
    var d = document.createElement('div');
    d.className = className;
    d.textContent = text;
    parent.appendChild(d);
  }
})();
