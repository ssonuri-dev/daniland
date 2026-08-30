/* =========================================================================
 * 다니랜드 - 레슨 데이터
 *
 * 새 수업을 추가하려면 아래 LESSONS 배열에 객체 하나만 더 넣으면 됩니다.
 * 홈 화면 카드와 게임은 이 데이터를 보고 자동으로 만들어집니다.
 *
 *  id      : 다른 레슨과 겹치지 않는 영문 이름 (주소와 기록 저장에 쓰임)
 *  subject : 어느 과목에 넣을지 (아래 SUBJECTS 의 name 과 똑같이)
 *  title   : 카드에 보일 제목
 *  icon    : 카드 아이콘 이모지
 *  lang    : 읽어줄 언어 ('en-US' 영어 / 'ko-KR' 한국어)
 *  modes   : (없어도 됩니다) 이 수업에서 할 수 있는 놀이만 골라 적습니다.
 *            'listen' 듣고 찾기 · 'word' 글자 찾기 · 'memory' 짝 맞추기 (모두 그림이 필요)
 *            'sound'  듣고 단어 찾기 · 'order' 순서 맞추기 (그림 없이 소리와 글자로)
 *            안 적으면 그림이 있는 수업은 앞의 세 가지, 그림이 없으면 뒤의 것을 씁니다.
 *  cycle   : (없어도 됩니다) 요일·달처럼 끝나면 처음으로 돌아가는 차례일 때 true.
 *            '순서 맞추기' 가 아무 자리에서나 시작합니다 (금 · 토 · 일 · 월 …).
 *            1, 2, 3 처럼 되돌아가지 않는 말에는 적지 않습니다.
 *  items   : 문제 목록
 *      emoji : 화면에 보여줄 그림 (이모지). 여러 개 반복해도 됩니다.
 *              요일처럼 그림으로 나타내기 어려운 말은 비워 둡니다.
 *      word  : 소리로 읽어줄 말 (lang 언어로 발음됩니다)
 *      ko    : 정답을 맞췄을 때 보여줄 우리말 뜻
 * ========================================================================= */

/* =========================================================================
 * 과목 — 홈 화면에 큰 카드로 나오는 네 가지
 *
 * 여기 적힌 순서대로 홈에 놓입니다.
 * 아래 수업/학습 카드의 subject 에 이 name 을 똑같이 적으면 그 과목에 들어갑니다.
 * (SUBJECTS 에 없는 이름을 쓰면 맨 뒤에 과목이 하나 새로 생깁니다)
 * ========================================================================= */

window.SUBJECTS = [
  { name: '영어', icon: '🔤', desc: '듣고 찾고 짝 맞춰요' },
  { name: '수학', icon: '🔢', desc: '세고 더해요' },
  { name: '한글', icon: '🇰🇷', desc: '글자를 익혀요' },
  { name: '놀이', icon: '🎨', desc: '자유롭게 놀아요' }
];


window.LESSONS = [
  {
    id: 'en-fruits',
    subject: '영어',
    title: '과일',
    icon: '🍎',
    lang: 'en-US',
    items: [
      { emoji: '🍎', word: 'apple',      ko: '사과' },
      { emoji: '🍌', word: 'banana',     ko: '바나나' },
      { emoji: '🍇', word: 'grapes',     ko: '포도' },
      { emoji: '🍓', word: 'strawberry', ko: '딸기' },
      { emoji: '🍉', word: 'watermelon', ko: '수박' },
      { emoji: '🍊', word: 'orange',     ko: '오렌지' },
      { emoji: '🍑', word: 'peach',      ko: '복숭아' },
      { emoji: '🍍', word: 'pineapple',  ko: '파인애플' },
      { emoji: '🍐', word: 'pear',       ko: '배' },
      { emoji: '🥝', word: 'kiwi',       ko: '키위' }
    ]
  },

  {
    id: 'en-animals',
    subject: '영어',
    title: '동물',
    icon: '🐶',
    lang: 'en-US',
    items: [
      { emoji: '🐶', word: 'dog',      ko: '개' },
      { emoji: '🐱', word: 'cat',      ko: '고양이' },
      { emoji: '🐰', word: 'rabbit',   ko: '토끼' },
      { emoji: '🐻', word: 'bear',     ko: '곰' },
      { emoji: '🐯', word: 'tiger',    ko: '호랑이' },
      { emoji: '🐘', word: 'elephant', ko: '코끼리' },
      { emoji: '🐸', word: 'frog',     ko: '개구리' },
      { emoji: '🐵', word: 'monkey',   ko: '원숭이' },
      { emoji: '🐷', word: 'pig',      ko: '돼지' },
      { emoji: '🐔', word: 'chicken',  ko: '닭' }
    ]
  },

  {
    id: 'en-colors',
    subject: '영어',
    title: '색깔',
    icon: '🌈',
    lang: 'en-US',
    items: [
      { emoji: '🟥', word: 'red',    ko: '빨강' },
      { emoji: '🟦', word: 'blue',   ko: '파랑' },
      { emoji: '🟨', word: 'yellow', ko: '노랑' },
      { emoji: '🟩', word: 'green',  ko: '초록' },
      { emoji: '🟧', word: 'orange', ko: '주황' },
      { emoji: '🟪', word: 'purple', ko: '보라' },
      { emoji: '🟫', word: 'brown',  ko: '갈색' },
      { emoji: '⬛', word: 'black',  ko: '검정' },
      { emoji: '⬜', word: 'white',  ko: '하양' },
      { emoji: '🩷', word: 'pink',   ko: '분홍' }
    ]
  },

  {
    id: 'en-numbers',
    subject: '영어',
    title: '숫자 세기',
    icon: '1️⃣',
    lang: 'en-US',
    items: [
      { emoji: '🍭',                     word: 'one',   ko: '하나' },
      { emoji: '🍭🍭',                   word: 'two',   ko: '둘' },
      { emoji: '🍭🍭🍭',                 word: 'three', ko: '셋' },
      { emoji: '🍭🍭🍭🍭',               word: 'four',  ko: '넷' },
      { emoji: '🍭🍭🍭🍭🍭',             word: 'five',  ko: '다섯' },
      { emoji: '🍭🍭🍭🍭🍭🍭',           word: 'six',   ko: '여섯' },
      { emoji: '🍭🍭🍭🍭🍭🍭🍭',         word: 'seven', ko: '일곱' },
      { emoji: '🍭🍭🍭🍭🍭🍭🍭🍭',       word: 'eight', ko: '여덟' },
      { emoji: '🍭🍭🍭🍭🍭🍭🍭🍭🍭',     word: 'nine',  ko: '아홉' },
      { emoji: '🍭🍭🍭🍭🍭🍭🍭🍭🍭🍭',   word: 'ten',   ko: '열' }
    ]
  },

  {
    id: 'en-jobs',
    subject: '영어',
    title: '직업과 일터',
    icon: '👮',
    lang: 'en-US',
    items: [
      { emoji: '👮',   word: 'police officer', ko: '경찰관' },
      { emoji: '🧑‍🚒', word: 'fire fighter',   ko: '소방관' },
      { emoji: '👩‍🏫', word: 'teacher',        ko: '선생님' },
      { emoji: '🧑‍🔬', word: 'scientist',      ko: '과학자' },
      { emoji: '🧑‍⚕️', word: 'doctor',         ko: '의사' },
      { emoji: '⚽',   word: 'soccer player',  ko: '축구 선수' },
      { emoji: '🚓',   word: 'police station', ko: '경찰서' },
      { emoji: '🚒',   word: 'fire station',   ko: '소방서' },
      { emoji: '🏞️',   word: 'park',           ko: '공원' },
      { emoji: '🏥',   word: 'hospital',       ko: '병원' }
    ]
  },

  {
    id: 'en-weather',
    subject: '영어',
    title: '날씨',
    icon: '⛅',
    lang: 'en-US',
    items: [
      { emoji: '☀️',  word: 'sunny',   ko: '맑음' },
      { emoji: '🌧️',  word: 'rainy',   ko: '비' },
      { emoji: '☁️',  word: 'cloudy',  ko: '흐림' },
      { emoji: '❄️',  word: 'snowy',   ko: '눈' },
      { emoji: '🌬️',  word: 'windy',   ko: '바람' },
      { emoji: '🌈',  word: 'rainbow', ko: '무지개' },
      { emoji: '🥵',  word: 'hot',     ko: '더워요' },
      { emoji: '🥶',  word: 'cold',    ko: '추워요' }
    ]
  },

  {
    id: 'en-days',
    subject: '영어',
    title: '요일',
    icon: '📅',
    lang: 'en-US',

    // 요일은 그림으로 보여줄 수 없어서, 소리와 글자로만 하는 놀이를 씁니다.
    modes: ['sound', 'order'],

    // 일요일 다음은 다시 월요일 — 순서 맞추기가 아무 요일에서나 시작합니다.
    cycle: true,

    // 순서 맞추기는 여기 적힌 차례대로 놓게 됩니다.
    items: [
      { word: 'Monday',    ko: '월요일' },
      { word: 'Tuesday',   ko: '화요일' },
      { word: 'Wednesday', ko: '수요일' },
      { word: 'Thursday',  ko: '목요일' },
      { word: 'Friday',    ko: '금요일' },
      { word: 'Saturday',  ko: '토요일' },
      { word: 'Sunday',    ko: '일요일' }
    ]
  },

  {
    id: 'ko-fruits',
    subject: '한글',
    title: '과일 이름',
    icon: '🍓',
    lang: 'ko-KR',
    items: [
      { emoji: '🍎', word: '사과',     ko: '사과' },
      { emoji: '🍌', word: '바나나',   ko: '바나나' },
      { emoji: '🍇', word: '포도',     ko: '포도' },
      { emoji: '🍓', word: '딸기',     ko: '딸기' },
      { emoji: '🍉', word: '수박',     ko: '수박' },
      { emoji: '🍑', word: '복숭아',   ko: '복숭아' },
      { emoji: '🍍', word: '파인애플', ko: '파인애플' },
      { emoji: '🍐', word: '배',       ko: '배' }
    ]
  }
];


/* =========================================================================
 * 수업 데이터를 쓰지 않고 따로 만든 카드
 *
 * 위 수업들과 똑같이 과목 페이지에 나옵니다.
 * 수업 카드와 같은 층이므로 '무엇을 배우나' 를 제목으로 씁니다.
 *
 *  subject : 어느 과목에 넣을지
 *  meta    : 카드 아래 한 줄 설명
 *  href    : 눌렀을 때 갈 주소
 *  bestKey : 최고 기록을 저장해 둔 이름 (없으면 ⭐ 를 안 보여줍니다)
 *  bestUnit: 최고 기록을 '3/5' 가 아니라 '3단계' 처럼 보여 주고 싶을 때의 단위
 * ========================================================================= */

window.PAGES = [
  {
    subject: '수학',
    title: '세어 보기',
    icon: '🔢',
    meta: '그림을 세어요',
    href: 'numbers.html?act=count',
    bestKey: 'daniland.best.numbers.count'
  },
  {
    subject: '수학',
    title: '같은 개수 찾기',
    icon: '🍎',
    meta: '숫자만큼 찾아요',
    href: 'numbers.html?act=group',
    bestKey: 'daniland.best.numbers.group'
  },
  {
    subject: '수학',
    title: '더하기',
    icon: '➕',
    meta: '모두 몇 개?',
    href: 'numbers.html?act=plus',
    bestKey: 'daniland.best.numbers.plus'
  },
  {
    subject: '수학',
    title: '더 많은 것',
    icon: '⚖️',
    meta: '어느 쪽이 많을까',
    href: 'numbers.html?act=more',
    bestKey: 'daniland.best.numbers.more'
  },

  {
    subject: '놀이',
    title: '그림 그리기',
    icon: '🎨',
    meta: '자유롭게 그려요',
    href: 'draw.html'
  },

  {
    subject: '놀이',
    title: '실로폰',
    icon: '🎹',
    meta: '도레미를 쳐요',
    href: 'xylo.html'
  },

  {
    subject: '놀이',
    title: '풍선 터뜨리기',
    icon: '🎈',
    meta: '올라오는 풍선을 눌러요',
    href: 'balloon.html',
    bestKey: 'daniland.best.balloon.level',
    bestUnit: '단계'
  }
];
