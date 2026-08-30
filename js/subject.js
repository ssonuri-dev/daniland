/* =========================================================================
 * 다니랜드 - 과목 페이지
 *
 * 주소 예) subject.html?name=영어
 * 그 과목에 들어 있는 수업·놀이 카드를 그려 줍니다.
 * ========================================================================= */

(function () {
  var el = {
    icon: document.getElementById('subjectIcon'),
    name: document.getElementById('subjectName'),
    desc: document.getElementById('subjectDesc'),
    host: document.getElementById('lessons')
  };

  var subject = Catalog.find(UI.getParam('name'));

  // 없는 과목 주소로 들어왔으면 홈으로 되돌립니다.
  if (!subject) {
    window.location.replace('index.html');
    return;
  }

  document.title = subject.name + ' · 다니랜드 🐾';
  el.icon.textContent = subject.icon;
  el.name.textContent = subject.name;
  el.desc.textContent = subject.desc;

  var grid = document.createElement('div');
  grid.className = 'lesson-grid';
  subject.cards.forEach(function (card) { grid.appendChild(makeCard(card)); });
  el.host.appendChild(grid);

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
