/* =========================================================================
 * 다니랜드 - 영어 그림책 (book.html 이 읽는 데이터)
 *
 * ★ 책 한 권 = 이 배열의 객체 하나 + 그림 폴더 books/<id>/ 하나.
 *   새 책을 더할 때 다른 파일은 고칠 필요가 없습니다.
 *
 * 한 책은 '읽는 책' 과 '만드는 책' 두 가지로 쓰입니다.
 *  - 읽는 책: 빈칸이 read 에 적힌 대로 채워진 완성본을 읽어 줍니다.
 *  - 만드는 책: 아이가 빈칸(blank)마다 그림 셋 중 하나를 골라 자기 책을 만듭니다.
 *    고른 낱말은 뒤 장의 글과 그림에도 그대로 들어갑니다 (4장에서 용을 고르면 6·7·8장도 용).
 *
 * 필드
 *  id       : 그림 폴더 이름 (books/<id>/) 이자 저장 키
 *  title    : 영어 제목 · titleKo: 우리말 제목
 *  cover    : 책장에서 표지로 쓸 그림 이름 (art 의 키)
 *  read     : 읽는 책에서 빈칸에 넣을 것 { 빈칸이름: 선택지 word }
 *  art      : 그림 이름 → 그림 파일이 아직 없을 때 대신 보일 것
 *             { emoji }             이모지 하나
 *             { src, badge }        사이트의 다른 그림(예: dani.png)에 이모지를 작게 붙임
 *             { emoji, sky, ground } 배경용 — 하늘색·땅색 위에 이모지
 *             그림 파일 books/<id>/<이름>.png (없으면 .jpg) 이 있으면 그것을 먼저 쓰고, 없으면 여기 것을 씁니다.
 *             배경처럼 투명이 필요 없는 그림은 .jpg 로 넣으면 훨씬 작습니다 (png 2.5MB → jpg 300KB).
 *  pages    : 펼침면 하나가 객체 하나
 *    text   : 영어 글. {빈칸이름} 자리에 고른 낱말(word)이 들어갑니다
 *    ko     : 우리말 뜻. {빈칸이름} 자리에 고른 낱말의 ko 가 들어갑니다.
 *             조사가 달라지면 {빈칸이름:이가} {빈칸이름:을를} {빈칸이름:은는} {빈칸이름:과와} {빈칸이름:으로}
 *             처럼 적으면 받침을 보고 알맞은 쪽을 고릅니다.
 *    bg     : 배경 그림 이름. {빈칸이름} 을 쓰면 고른 선택지의 img 가 들어갑니다
 *    actors : 배경 위에 얹는 인물들 [{ art, x, w, y }] — x 는 가운데 자리(%), w 는 너비(%),
 *             y 는 발 위치(%, 기본 96). art 에도 {빈칸이름} 을 쓸 수 있고 '{monster}-big' 처럼 이어 붙여도 됩니다
 *    props  : 말풍선·소품 [{ emoji, x, y, size, bubble }] — emoji 에 {빈칸이름.emoji} 를 쓰면 고른 선택지의 emoji
 *             emoji 대신 art: '{빈칸이름}' 을 쓰면 그림 파일(선택지의 img)을 얹습니다 — 파일이 없으면 art 의 이모지
 *    blank  : 이 장에서 고르는 빈칸 { key, options: [{ word, ko, emoji, img }] }
 *             word 는 글에 들어갈 영어(관사까지: 'an apple'), img 는 bg/actors 에 들어갈 그림 이름 조각
 * ========================================================================= */

window.BOOKS = [
  {
    id: 'princess',
    title: 'Princess Dani',
    titleKo: '다니 공주의 모험',
    cover: 'bg-castle',
    coverEmoji: '👑',

    // 읽는 책은 이렇게 채워진 이야기입니다
    read: { home: 'castle', dress: 'pink', place: 'forest', monster: 'dragon', say: 'Hello!', mood: 'hungry', gift: 'an apple' },

    // 그림 파일이 생기기 전까지 대신 보이는 것 (books/princess/<이름>.png 이 생기면 자동으로 그것을 씁니다)
    art: {
      'bg-castle':    { emoji: '🏰', sky: '#cfe8ff', ground: '#bfe3a0' },
      'bg-tower':     { emoji: '🗼', sky: '#ffe6f0', ground: '#bfe3a0' },
      'bg-treehouse': { emoji: '🌳', sky: '#e3f6ff', ground: '#a8d982' },
      'bg-forest':    { emoji: '🌲🌲', sky: '#d6f0e0', ground: '#7fc466' },
      'bg-sea':       { emoji: '⛵', sky: '#d9f1ff', ground: '#6fb9e8' },
      'bg-mountain':  { emoji: '⛰️', sky: '#e6ecff', ground: '#a9c78f' },
      'bg-sky':       { emoji: '☁️  ☁️', sky: '#bfe0ff', ground: '#dcefff' },
      // 다니 공주 — 마스코트 강아지(dani.png)가 아니라 사람 공주입니다. 그림 파일이 오기 전까지 👸 로 보이고,
      // 드레스 색은 치마 자리의 색 점(tint)으로만 구분합니다.
      'dani':         { emoji: '👸' },
      'dani-red':     { emoji: '👸', tint: '#ff5252' },
      'dani-blue':    { emoji: '👸', tint: '#4f8dff' },
      'dani-pink':    { emoji: '👸', tint: '#ff7eb6' },
      'dani-red-fly':  { emoji: '👸', tint: '#ff5252' },   // 8장에서 나는 모습 — 드레스 색을 따라갑니다
      'dani-blue-fly': { emoji: '👸', tint: '#4f8dff' },
      'dani-pink-fly': { emoji: '👸', tint: '#ff7eb6' },
      'dragon-big':   { emoji: '🐉' },
      'dragon-nice':  { emoji: '🐲' },
      'giant-big':    { emoji: '🧌' },
      'giant-nice':   { emoji: '🧌', badge: '😊' },
      'witch-big':    { emoji: '🧙‍♀️' },
      'witch-nice':   { emoji: '🧙‍♀️', badge: '😊' }
    },

    pages: [
      {
        text: 'This is Princess Dani. She lives in a {home}.',
        ko: '다니 공주예요. 공주는 {home}에 살아요.',
        bg: '{home}',
        actors: [{ art: 'dani', x: 30, w: 34 }],
        blank: {
          key: 'home',
          options: [
            { word: 'castle', ko: '성', emoji: '🏰', img: 'bg-castle' },
            { word: 'tower', ko: '탑', emoji: '🗼', img: 'bg-tower' },
            { word: 'tree house', ko: '나무 집', emoji: '🌳', img: 'bg-treehouse' }
          ]
        }
      },
      {
        text: 'Today she puts on her crown and her {dress} dress.',
        ko: '오늘 공주는 왕관을 쓰고 {dress} 드레스를 입어요.',
        bg: '{home}',
        actors: [{ art: '{dress}', x: 50, w: 46 }],
        blank: {
          key: 'dress',
          options: [
            { word: 'red', ko: '빨간', emoji: '🔴', img: 'dani-red' },
            { word: 'blue', ko: '파란', emoji: '🔵', img: 'dani-blue' },
            { word: 'pink', ko: '분홍', emoji: '🩷', img: 'dani-pink' }
          ]
        }
      },
      {
        text: '"Let\'s go on an adventure!" She goes to the {place}.',
        ko: '"모험을 떠나자!" 공주는 {place:으로} 가요.',
        bg: '{place}',
        actors: [{ art: '{dress}', x: 30, w: 40 }],
        blank: {
          key: 'place',
          options: [
            { word: 'forest', ko: '숲', emoji: '🌲', img: 'bg-forest' },
            { word: 'sea', ko: '바다', emoji: '🌊', img: 'bg-sea' },
            { word: 'mountain', ko: '산', emoji: '⛰️', img: 'bg-mountain' }
          ]
        }
      },
      {
        text: 'Oh no! A {monster}! It is scary!',
        ko: '어머나! {monster:이가} 나타났어요! 무서워요!',
        bg: '{place}',
        actors: [{ art: '{monster}-big', x: 68, w: 58 }, { art: '{dress}', x: 24, w: 36 }],
        blank: {
          key: 'monster',
          options: [
            { word: 'dragon', ko: '용', emoji: '🐉', img: 'dragon' },
            { word: 'giant', ko: '거인', emoji: '🧌', img: 'giant' },
            { word: 'witch', ko: '마녀', emoji: '🧙‍♀️', img: 'witch' }
          ]
        }
      },
      {
        text: 'Princess Dani is not scared. She says, "{say}"',
        ko: '다니 공주는 무섭지 않아요. 공주가 말해요. "{say}"',
        bg: '{place}',
        actors: [{ art: '{monster}-big', x: 68, w: 58 }, { art: '{dress}', x: 24, w: 36 }],
        props: [{ emoji: '{say.emoji}', x: 30, y: 34, size: 15, bubble: true }],
        blank: {
          key: 'say',
          options: [
            { word: 'Hello!', ko: '안녕!', emoji: '👋' },
            { word: 'Stop!', ko: '멈춰!', emoji: '✋' },
            { word: 'Who are you?', ko: '넌 누구니?', emoji: '🤔' }
          ]
        }
      },
      {
        text: 'The {monster} is not bad. The {monster} is {mood}.',
        ko: '{monster:은는} 나쁘지 않아요. {monster:은는} {mood}.',
        bg: '{place}',
        actors: [{ art: '{monster}-nice', x: 66, w: 54 }, { art: '{dress}', x: 24, w: 36 }],
        props: [{ emoji: '{mood.emoji}', x: 72, y: 26, size: 15, bubble: true }],
        blank: {
          key: 'mood',
          options: [
            { word: 'hungry', ko: '배가 고파요', emoji: '😋' },
            { word: 'sad', ko: '슬퍼요', emoji: '😢' },
            { word: 'sleepy', ko: '졸려요', emoji: '😴' }
          ]
        }
      },
      {
        text: 'Dani gives the {monster} {gift}. "Thank you, Princess!"',
        ko: '다니는 {monster}에게 {gift}. "고마워요, 공주님!"',
        bg: '{place}',
        actors: [{ art: '{monster}-nice', x: 66, w: 54 }, { art: '{dress}', x: 30, w: 36 }],
        props: [{ emoji: '{gift.emoji}', x: 47, y: 62, size: 14 }],
        blank: {
          key: 'gift',
          options: [
            { word: 'an apple', ko: '사과를 줘요', emoji: '🍎' },
            { word: 'a cake', ko: '케이크를 줘요', emoji: '🍰' },
            { word: 'a hug', ko: '꼭 안아 줘요', emoji: '🤗' }
          ]
        }
      },
      {
        text: 'Now they are friends. They fly home together. The end.',
        ko: '이제 둘은 친구예요. 함께 집으로 날아가요. 끝.',
        bg: 'bg-sky',
        actors: [{ art: '{monster}-nice', x: 62, w: 50, y: 78 }, { art: '{dress}-fly', x: 28, w: 44, y: 62 }],
        props: [{ emoji: '💕', x: 46, y: 30, size: 12 }] // 집은 bg-sky.jpg 오른쪽 아래에 그려져 있어 따로 안 띄웁니다
      }
    ]
  },

  // 2권 — 'I want ___.' 를 되풀이해 익히는 책 (마법 별이 "What do you want?" 하고 묻습니다).
  // 다니 공주와 배경은 1권 그림을 그대로 빌려 씁니다: books/wish/ 에 파일이 없으면 art 의 src 로 넘어가
  // books/princess/ 의 것을 보여 줍니다. 동물·로켓·간식은 books/wish/ 의 그림입니다 (한 장에 그려 온 것을 잘라 넣음).
  // 같은 w 에서 키가 맞도록 반려동물 셋은 320×420 캔버스에, 로켓은 유니콘과 같은 비율(0.79) 캔버스에
  // 발을 맞춰 얹었고, 말풍선에 들어가는 간식은 정사각형 가운데에 얹었습니다.
  {
    id: 'wish',
    title: "Princess Dani's Wish",
    titleKo: '다니 공주의 소원',
    cover: 'bg-castle',
    coverEmoji: '🌟',

    read: { dress: 'blue', pet: 'puppy', food: 'a cookie', place: 'forest', ride: 'unicorn' },

    art: {
      'bg-castle':    { src: 'books/princess/bg-castle.jpg' },
      'bg-forest':    { src: 'books/princess/bg-forest.jpg' },
      'bg-sea':       { src: 'books/princess/bg-sea.jpg' },
      'bg-mountain':  { src: 'books/princess/bg-mountain.jpg' },
      'bg-sky':       { src: 'books/princess/bg-sky.jpg' },
      'dani':          { src: 'books/princess/dani.png' },
      'dani-red':      { src: 'books/princess/dani-red.png' },
      'dani-blue':     { src: 'books/princess/dani-blue.png' },
      'dani-pink':     { src: 'books/princess/dani-pink.png' },
      'dani-red-fly':  { src: 'books/princess/dani-red-fly.png' },
      'dani-blue-fly': { src: 'books/princess/dani-blue-fly.png' },
      'dani-pink-fly': { src: 'books/princess/dani-pink-fly.png' },
      'puppy':        { emoji: '🐶' },
      'kitten':       { emoji: '🐱' },
      'bunny':        { emoji: '🐰' },
      'unicorn':      { emoji: '🦄' },
      'rocket':       { emoji: '🚀' },
      'milk':         { emoji: '🥛' },
      'carrot':       { emoji: '🥕' },
      'cookie':       { emoji: '🍪' },
      'dragon':       { src: 'books/princess/dragon-nice.png' }   // 1권의 착한 용
    },

    pages: [
      {
        text: 'Princess Dani finds a magic star. The star says, "What do you want, Princess?"',
        ko: '다니 공주가 마법 별을 찾았어요. 별이 말해요. "공주님, 무엇을 원해요?"',
        bg: 'bg-castle',
        actors: [{ art: 'dani', x: 32, w: 34 }],
        props: [{ emoji: '🌟', x: 66, y: 30, size: 16 }]
      },
      {
        text: '"I want a {dress} dress!" Pop! Here is a {dress} dress.',
        ko: '"{dress} 드레스를 갖고 싶어요!" 펑! {dress} 드레스가 생겼어요.',
        bg: 'bg-castle',
        actors: [{ art: '{dress}', x: 40, w: 44 }],
        props: [{ emoji: '🌟', x: 76, y: 24, size: 12 }],
        blank: {
          key: 'dress',
          options: [
            { word: 'red', ko: '빨간', emoji: '🔴', img: 'dani-red' },
            { word: 'blue', ko: '파란', emoji: '🔵', img: 'dani-blue' },
            { word: 'pink', ko: '분홍', emoji: '🩷', img: 'dani-pink' }
          ]
        }
      },
      {
        text: '"What do you want now?" "I want a {pet}!" Pop! Here is a {pet}.',
        ko: '"이제 무엇을 원해요?" "{pet:을를} 갖고 싶어요!" 펑! {pet:이가} 생겼어요.',
        bg: 'bg-castle',
        actors: [{ art: '{dress}', x: 30, w: 36 }, { art: '{pet}', x: 68, w: 22 }],
        props: [{ emoji: '🌟', x: 80, y: 20, size: 10 }],
        blank: {
          key: 'pet',
          options: [
            { word: 'puppy', ko: '강아지', emoji: '🐶', img: 'puppy' },
            { word: 'kitten', ko: '아기 고양이', emoji: '🐱', img: 'kitten' },
            { word: 'bunny', ko: '토끼', emoji: '🐰', img: 'bunny' }
          ]
        }
      },
      {
        text: 'The {pet} is hungry. "I want {food}!" Pop! Yum, yum!',
        ko: '{pet:은는} 배가 고파요. "{food}!" 펑! 냠냠!',
        bg: 'bg-castle',
        actors: [{ art: '{dress}', x: 30, w: 36 }, { art: '{pet}', x: 68, w: 22 }],
        props: [{ art: '{food}', x: 68, y: 38, size: 13, bubble: true }],
        blank: {
          key: 'food',
          options: [
            { word: 'some milk', ko: '우유를 마시고 싶어요', emoji: '🥛', img: 'milk' },
            { word: 'a carrot', ko: '당근을 먹고 싶어요', emoji: '🥕', img: 'carrot' },
            { word: 'a cookie', ko: '쿠키를 먹고 싶어요', emoji: '🍪', img: 'cookie' }
          ]
        }
      },
      {
        text: '"I want to go to the {place}!" Pop! "Hello, {place}!"',
        ko: '"{place:으로} 가고 싶어요!" 펑! "안녕, {place}!"',
        bg: '{place}',
        actors: [{ art: '{dress}', x: 30, w: 36 }, { art: '{pet}', x: 64, w: 20 }],
        blank: {
          key: 'place',
          options: [
            { word: 'forest', ko: '숲', emoji: '🌲', img: 'bg-forest' },
            { word: 'sea', ko: '바다', emoji: '🌊', img: 'bg-sea' },
            { word: 'mountain', ko: '산', emoji: '⛰️', img: 'bg-mountain' }
          ]
        }
      },
      {
        text: 'The {place} is so big! "I want a {ride}!" Pop! Here is a {ride}.',
        ko: '{place:은는} 정말 넓어요! "{ride:을를} 갖고 싶어요!" 펑! {ride:이가} 나타났어요.',
        bg: '{place}',
        actors: [{ art: '{ride}', x: 68, w: 46 }, { art: '{dress}', x: 26, w: 34 }, { art: '{pet}', x: 47, w: 17 }],
        blank: {
          key: 'ride',
          options: [
            { word: 'unicorn', ko: '유니콘', emoji: '🦄', img: 'unicorn' },
            { word: 'rocket', ko: '로켓', emoji: '🚀', img: 'rocket' },
            { word: 'dragon', ko: '용', emoji: '🐉', img: 'dragon' }
          ]
        }
      },
      {
        text: 'The {ride} flies up, up, up! "Whee! I want to fly more!"',
        ko: '{ride:이가} 높이높이 날아요! "야호! 더 날고 싶어요!"',
        bg: 'bg-sky',
        actors: [{ art: '{ride}', x: 62, w: 48, y: 80 }, { art: '{dress}-fly', x: 28, w: 42, y: 62 }, { art: '{pet}', x: 70, w: 14, y: 55 }]
      },
      {
        text: 'Dani is home. "Thank you, magic star! I want to play again tomorrow!" The end.',
        ko: '다니가 집에 왔어요. "고마워요, 마법 별! 내일 또 놀고 싶어요!" 끝.',
        bg: 'bg-castle',
        actors: [{ art: '{ride}', x: 74, w: 36 }, { art: '{dress}', x: 32, w: 36 }, { art: '{pet}', x: 53, w: 17 }],
        props: [{ emoji: '🌟', x: 56, y: 22, size: 12 }, { emoji: '💕', x: 40, y: 28, size: 9 }]
      }
    ]
  }
];
