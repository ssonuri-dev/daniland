/* =========================================================================
 * 다니랜드 - 카드 목록 만들기
 *
 * js/data.js 의 수업(LESSONS)과 따로 만든 카드(PAGES)를 같은 모양으로 합쳐서
 * 과목별로 묶어 줍니다. 홈(home.js)과 과목 페이지(subject.js)가 함께 씁니다.
 * ========================================================================= */

(function () {
  // 놀이 방식별로 기록이 남습니다. 그중 가장 잘한 기록을 카드에 보여 줍니다.
  var MODE_IDS = ['listen', 'word', 'memory', 'sound', 'order'];

  function lessonBest(id) {
    var best = null;

    MODE_IDS.forEach(function (mode) {
      var v = UI.readBest('daniland.best.' + id + '.' + mode);
      if (!v) return;
      if (!best || (v.stars / v.total) > (best.stars / best.total)) best = v;
    });

    return best;
  }

  // 수업과 따로 만든 카드를 한 가지 모양으로 합칩니다.
  function allCards() {
    var out = [];

    (window.LESSONS || []).forEach(function (lesson) {
      out.push({
        subject: lesson.subject || '기타',
        group: lesson.group || '',
        icon: lesson.icon || '🎲',
        title: lesson.title,
        meta: (lesson.items || []).length + '개',
        href: 'play.html?lesson=' + encodeURIComponent(lesson.id),
        best: lessonBest(lesson.id)
      });
    });

    (window.PAGES || []).forEach(function (page) {
      out.push({
        subject: page.subject || '기타',
        group: page.group || '',
        icon: page.icon || '🎲',
        title: page.title,
        meta: page.meta || '',
        href: page.href,
        best: page.bestKey ? UI.readBest(page.bestKey) : null,
        bestUnit: page.bestUnit || ''
      });
    });

    return out;
  }

  window.Catalog = {

    // SUBJECTS 에 적힌 순서대로 과목을 돌려줍니다. 카드가 하나도 없는 과목은 빼고,
    // SUBJECTS 에 없는 이름이 카드에 쓰였으면 맨 뒤에 과목을 새로 만들어 붙입니다.
    subjects: function () {
      var cards = allCards();
      var list = [];
      var seen = {};

      (window.SUBJECTS || []).forEach(function (s) {
        if (seen[s.name]) return;
        seen[s.name] = true;
        list.push({ name: s.name, icon: s.icon || '🎲', desc: s.desc || '', cards: [] });
      });

      cards.forEach(function (card) {
        if (seen[card.subject]) return;
        seen[card.subject] = true;
        list.push({ name: card.subject, icon: card.icon, desc: '', cards: [] });
      });

      list.forEach(function (s) {
        s.cards = cards.filter(function (card) { return card.subject === s.name; });
        s.groups = groupsOf(s, s.cards);
      });

      return list.filter(function (s) { return s.cards.length > 0; });
    },

    // 과목 안의 묶음 하나를 이름으로 찾습니다. 없으면 null.
    findGroup: function (subjectName, groupName) {
      var s = this.find(subjectName);
      if (!s) return null;

      for (var i = 0; i < s.groups.length; i++) {
        if (s.groups[i].name === groupName) return s.groups[i];
      }
      return null;
    },

    // 과목 하나를 이름으로 찾습니다. 없으면 null.
    find: function (name) {
      var list = this.subjects();

      for (var i = 0; i < list.length; i++) {
        if (list[i].name === name) return list[i];
      }
      return null;
    },

    // 과목 페이지 주소. 묶음 이름까지 주면 그 묶음의 카드가 나오는 페이지입니다.
    href: function (name, group) {
      var url = 'subject.html?name=' + encodeURIComponent(name);
      if (group) url += '&group=' + encodeURIComponent(group);
      return url;
    },

    // 어떤 페이지(예: 'make.html')를 카드로 갖고 있는 과목·묶음 페이지 주소 —
    // 게임 화면의 ← 가 방금 지나온 목록으로 돌아가는 데 씁니다. 못 찾으면 홈.
    backHref: function (file) {
      var pages = window.PAGES || [];

      for (var i = 0; i < pages.length; i++) {
        if ((pages[i].href || '').indexOf(file) === 0 && pages[i].subject) {
          return this.href(pages[i].subject, pages[i].group);
        }
      }
      return 'index.html';
    }
  };

  /* 과목의 카드를 SUBJECTS[].groups 순서대로 묶습니다. groups 가 없는 과목은 빈 배열 —
   * 과목 페이지가 카드를 바로 보여 줍니다. groups 에 없는 이름을 쓴 카드는 맨 뒤에 묶음이
   * 새로 생기고, group 을 안 적은 카드는 '그 밖에' 로 갑니다 (과목이 없을 때와 같은 규칙). */
  function groupsOf(subject, cards) {
    var defs = null;
    (window.SUBJECTS || []).forEach(function (s) {
      if (s.name === subject.name && s.groups && s.groups.length) defs = s.groups;
    });
    if (!defs) return [];

    var list = [];
    var seen = {};

    defs.forEach(function (g) {
      if (seen[g.name]) return;
      seen[g.name] = true;
      list.push({ name: g.name, icon: g.icon || '🎲', desc: g.desc || '', cards: [] });
    });

    cards.forEach(function (card) {
      var name = card.group || '그 밖에';
      if (seen[name]) return;
      seen[name] = true;
      list.push({ name: name, icon: card.group ? card.icon : '🎲', desc: '', cards: [] });
    });

    list.forEach(function (g) {
      g.cards = cards.filter(function (card) { return (card.group || '그 밖에') === g.name; });
    });

    return list.filter(function (g) { return g.cards.length > 0; });
  }
})();
