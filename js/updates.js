/* =========================================================================
 * 다니랜드 - 업데이트 내역 (updates.html)
 *
 * 홈 맨 아래의 아주 작은 '업데이트 내역' 글씨를 누르면 나오는 페이지입니다.
 * 읽는 사람은 아이가 아니라 어른(가족·지인)이라 일반 사람이 알아듣는 말로 적습니다.
 *
 * 무엇을 적나
 *   - 새 놀이·새 수업·새 과목, 눈에 띄는 새 기능 (예: 카메라로 손 인식)
 * 무엇을 안 적나 (사용자와 정한 것, 2026-09-28)
 *   - 문제·낱말 개수만 늘린 것 (수수께끼 100개 추가 등), 버그 수정, 자잘한 손질
 *
 * 새 내역은 맨 위에 넣습니다. 같은 날이면 그 날짜의 items 에 한 줄 더.
 *   { date: '2026-09-28', items: [ { tag: '수학', text: '…' } ] }
 * tag 는 과목 이름(data.js 의 SUBJECTS) 또는 '다니랜드' 입니다.
 * ========================================================================= */

window.UPDATES = [
  { date: '2026-10-01', items: [
    { tag: '세계', text: '덴마크 — 안데르센 동화·레고·자전거의 나라, 사진과 이야기 카드 18장과 퀴즈' },
    { tag: '세계', text: '일본 — 후지산·신칸센·초밥·종이접기, 유럽 밖의 첫 나라 페이지' }
  ] },
  { date: '2026-09-29', items: [
    { tag: '영어', text: "그림책 2권 「Princess Dani's Wish」 — 마법 별에게 'I want ___!' 하고 소원을 말하는 책" },
    { tag: '놀이', text: '활쏘기 — 위아래로 오르락내리락하는 사과를 때맞춰 화살로 맞히기' }
  ] },
  { date: '2026-09-28', items: [
    { tag: '수학', text: '가르기·모으기 — 7은 3과 몇? 10 만들기와 "14는 10과 4" 까지' },
    { tag: '수학', text: '모양 — 세모·네모·동그라미부터 오각형·육각형, 상자·둥근기둥·공 모양, 쌓기나무 세기' },
    { tag: '수학', text: '재고 견주기 — 끈 길이, 시소로 무게, 그릇의 들이 견주기와 자로 cm 재기' },
    { tag: '수학', text: '시계 공부 — 시계 읽기, 바늘 돌려 맞추기, 디지털 시계 짝 찾기, 하루 일과' }
  ] },
  { date: '2026-09-27', items: [
    { tag: '영어', text: '단어 퀴즈 — 그동안 배운 영어 낱말을 섞어서 복습' }
  ] },
  { date: '2026-09-25', items: [
    { tag: '놀이', text: '부수기 — 카메라 앞에서 손을 휘둘러 젤리 괴물 터뜨리기' },
    { tag: '놀이', text: '풍선 터뜨리기를 카메라로 손을 움직여서도 할 수 있어요' }
  ] },
  { date: '2026-09-24', items: [
    { tag: '영어', text: '몸 이름 — 몸 그림을 눌러 눈·코·입 같은 영어 이름 익히기' },
    { tag: '영어', text: '단어 쓰기 — 배운 영어 낱말을 획순대로 따라 쓰기' }
  ] },
  { date: '2026-09-23', items: [
    { tag: '우주', text: '새 과목 우주 — 3D 로 도는 태양계와 행성 이야기' },
    { tag: '우주', text: '별의 일생 — 별이 태어나서 블랙홀이 되기까지' },
    { tag: '세계', text: '노르웨이 · 스페인 나라 이야기' }
  ] },
  { date: '2026-09-22', items: [
    { tag: '세계', text: '그리스 · 독일 · 프랑스 나라 이야기' }
  ] },
  { date: '2026-09-20', items: [
    { tag: '놀이', text: '낚시 — 배를 몰고 낚싯바늘을 내려 물고기 잡기' }
  ] },
  { date: '2026-09-19', items: [
    { tag: '세계', text: '유럽 지도 — 열여덟 나라를 찾아가고 국기 맞히기' },
    { tag: '놀이', text: '수수께끼 · 넌센스 퀴즈' },
    { tag: '놀이', text: '코디 놀이 — 옷·머리·소품을 골라 다니 꾸미기' }
  ] },
  { date: '2026-09-18', items: [
    { tag: '세계', text: '스웨덴 나라 이야기 — 사진 카드와 퀴즈' },
    { tag: '영어', text: '탈것 타기 — get on / get in 배우기' },
    { tag: '영어', text: '알파벳 쓰기 — 대문자·소문자 따라 쓰기' }
  ] },
  { date: '2026-09-15', items: [
    { tag: '영어', text: '영어 그림책 — 읽어 주는 책과 내가 고르는 대로 바뀌는 책 (1권 Princess Dani)' },
    { tag: '수학', text: '곱하기' },
    { tag: '놀이', text: '그림 그리기에서 사진을 불러와 그 위에 그리기' }
  ] },
  { date: '2026-09-13', items: [
    { tag: '놀이', text: '미로 찾기' },
    { tag: '놀이', text: '장애물 피하기 달리기' }
  ] },
  { date: '2026-09-12', items: [
    { tag: '영어', text: '할머니 섬 여행 — 탈것을 골라 섬까지 가는 영어 대화' },
    { tag: '영어', text: '탈것 · 기분 낱말' }
  ] },
  { date: '2026-09-07', items: [
    { tag: '한글', text: '글자 쓰기 — 자음·모음·낱말을 획순대로 따라 쓰기' },
    { tag: '한글', text: '글자 만들기 — 자음과 모음을 붙여 글자 만들기' },
    { tag: '한글', text: '탈것·가족·음식 등 한글 낱말 공부 아홉 가지' },
    { tag: '수학', text: '빼기 · 수 순서 · 패턴 잇기 · 1부터 100까지 백 판 놀이' }
  ] },
  { date: '2026-09-06', items: [
    { tag: '세계', text: '새 과목 세계 — 전 세계 193개 나라 국기, 세계 지도' }
  ] },
  { date: '2026-09-05', items: [
    { tag: '영어', text: '마을 지도 — 병원·빵집 같은 마을 장소 영어 이름' }
  ] },
  { date: '2026-08-26', items: [
    { tag: '영어', text: '날씨 낱말' },
    { tag: '놀이', text: '실로폰 · 풍선 터뜨리기' }
  ] },
  { date: '2026-08-25', items: [
    { tag: '다니랜드', text: '다니랜드 문을 열었어요 — 영어·수학·한글 복습과 놀이' }
  ] }
];

(function () {
  var list = document.getElementById('updates');
  if (!list) return;

  var icons = { '다니랜드': '🐶' };
  (window.SUBJECTS || []).forEach(function (s) { icons[s.name] = s.icon; });

  window.UPDATES.forEach(function (day) {
    var sec = document.createElement('section');
    sec.className = 'update-day';

    var d = day.date.split('-');
    var h = document.createElement('h2');
    h.textContent = d[0] + '년 ' + parseInt(d[1], 10) + '월 ' + parseInt(d[2], 10) + '일';
    sec.appendChild(h);

    var ul = document.createElement('ul');
    day.items.forEach(function (it) {
      var li = document.createElement('li');
      var tag = document.createElement('span');
      tag.className = 'update-tag';
      tag.textContent = (icons[it.tag] || '✨') + ' ' + it.tag;
      li.appendChild(tag);
      li.appendChild(document.createTextNode(it.text));
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    list.appendChild(sec);
  });
})();
