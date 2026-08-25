/* =========================================================================
 * 다니랜드 - 홈 화면
 * 과목(영어 · 수학 · 한글 · 놀이)을 큰 카드로 보여 줍니다.
 * 카드를 누르면 그 과목의 수업 목록(subject.html)으로 갑니다.
 * ========================================================================= */

(function () {
  var host = document.getElementById('subjects');
  var list = Catalog.subjects();

  if (!list.length) {
    host.innerHTML = '<p class="notice">아직 등록된 수업이 없어요. js/data.js 에 수업을 추가해 주세요.</p>';
    return;
  }

  var grid = document.createElement('div');
  grid.className = 'subject-grid';
  list.forEach(function (subject) { grid.appendChild(makeCard(subject)); });
  host.appendChild(grid);

  function makeCard(subject) {
    var a = document.createElement('a');
    a.className = 'subject-card';
    a.href = Catalog.href(subject.name);

    add(a, 'icon', subject.icon);
    add(a, 'name', subject.name);
    if (subject.desc) add(a, 'desc', subject.desc);
    add(a, 'count', subject.cards.length + '가지');

    return a;
  }

  function add(parent, className, text) {
    var d = document.createElement('div');
    d.className = className;
    d.textContent = text;
    parent.appendChild(d);
  }
})();
