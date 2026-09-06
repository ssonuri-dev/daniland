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
 *  wordKo  : (없어도 됩니다) true 면 모든 놀이에서 word 대신 우리말(ko)을 보여 주고
 *            우리말로 읽어 줍니다. 국기처럼 '그림을 보고 우리말 이름을 익히는' 수업에 씁니다.
 *            word 에 적은 영어 이름은 데이터에 남고 화면에만 안 나옵니다.
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
  { name: '세계', icon: '🌍', desc: '나라를 만나요' },
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
      { emoji: '🥝', word: 'kiwi',       ko: '키위' },
      { emoji: '🍒', word: 'cherry',     ko: '체리' },
      { emoji: '🥭', word: 'mango',      ko: '망고' },
      { emoji: '🍋', word: 'lemon',      ko: '레몬' },
      { emoji: '🫐', word: 'blueberry',  ko: '블루베리' },
      { emoji: '🍈', word: 'melon',      ko: '멜론' },
      { emoji: '🥥', word: 'coconut',    ko: '코코넛' }
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
      { emoji: '🍐', word: '배',       ko: '배' },
      { emoji: '🍊', word: '오렌지',   ko: '오렌지' },
      { emoji: '🥝', word: '키위',     ko: '키위' },
      { emoji: '🍒', word: '체리',     ko: '체리' },
      { emoji: '🥭', word: '망고',     ko: '망고' },
      { emoji: '🍋', word: '레몬',     ko: '레몬' },
      { emoji: '🫐', word: '블루베리', ko: '블루베리' },
      { emoji: '🍈', word: '멜론',     ko: '멜론' },
      { emoji: '🥥', word: '코코넛',   ko: '코코넛' }
    ]
  },

  {
    id: 'ko-vehicles',
    subject: '한글',
    title: '탈것',
    icon: '🚗',
    lang: 'ko-KR',
    items: [
      { emoji: '🚗', word: '자동차',   ko: '자동차' },
      { emoji: '🚌', word: '버스',     ko: '버스' },
      { emoji: '🚕', word: '택시',     ko: '택시' },
      { emoji: '🚂', word: '기차',     ko: '기차' },
      { emoji: '🚇', word: '지하철',   ko: '지하철' },
      { emoji: '✈️', word: '비행기',   ko: '비행기' },
      { emoji: '🚁', word: '헬기',     ko: '헬기' },
      { emoji: '🚢', word: '배',       ko: '배' },
      { emoji: '🚲', word: '자전거',   ko: '자전거' },
      { emoji: '🛴', word: '킥보드',   ko: '킥보드' },
      { emoji: '🏍️', word: '오토바이', ko: '오토바이' },
      { emoji: '🚒', word: '소방차',   ko: '소방차' },
      { emoji: '🚑', word: '구급차',   ko: '구급차' },
      { emoji: '🚓', word: '경찰차',   ko: '경찰차' },
      { emoji: '🚜', word: '트랙터',   ko: '트랙터' },
      { emoji: '🚀', word: '로켓',     ko: '로켓' }
    ]
  },

  {
    id: 'ko-body',
    subject: '한글',
    title: '우리 몸',
    icon: '👀',
    lang: 'ko-KR',
    items: [
      { emoji: '👁️', word: '눈',   ko: '눈' },
      { emoji: '👃', word: '코',   ko: '코' },
      { emoji: '👄', word: '입',   ko: '입' },
      { emoji: '👂', word: '귀',   ko: '귀' },
      { emoji: '🦷', word: '이',   ko: '이' },
      { emoji: '👅', word: '혀',   ko: '혀' },
      { emoji: '✋', word: '손',   ko: '손' },
      { emoji: '🦶', word: '발',   ko: '발' },
      { emoji: '💪', word: '팔',   ko: '팔' },
      { emoji: '🦵', word: '다리', ko: '다리' },
      { emoji: '🧠', word: '뇌',   ko: '뇌' },
      { emoji: '🫀', word: '심장', ko: '심장' }
    ]
  },

  {
    id: 'ko-family',
    subject: '한글',
    title: '가족',
    icon: '👨‍👩‍👧',
    lang: 'ko-KR',
    items: [
      { emoji: '👩',      word: '엄마',     ko: '엄마' },
      { emoji: '👨',      word: '아빠',     ko: '아빠' },
      { emoji: '👵',      word: '할머니',   ko: '할머니' },
      { emoji: '👴',      word: '할아버지', ko: '할아버지' },
      { emoji: '👧',      word: '언니',     ko: '언니' },
      { emoji: '👦',      word: '오빠',     ko: '오빠' },
      { emoji: '👶',      word: '아기',     ko: '아기' },
      { emoji: '👨‍👩‍👧', word: '가족',     ko: '가족' }
    ]
  },

  {
    id: 'ko-food',
    subject: '한글',
    title: '음식',
    icon: '🍚',
    lang: 'ko-KR',
    items: [
      { emoji: '🍚', word: '밥',         ko: '밥' },
      { emoji: '🍲', word: '국',         ko: '국' },
      { emoji: '🍞', word: '빵',         ko: '빵' },
      { emoji: '🍜', word: '라면',       ko: '라면' },
      { emoji: '🍙', word: '김밥',       ko: '김밥' },
      { emoji: '🥟', word: '만두',       ko: '만두' },
      { emoji: '🥚', word: '달걀',       ko: '달걀' },
      { emoji: '🥛', word: '우유',       ko: '우유' },
      { emoji: '🍖', word: '고기',       ko: '고기' },
      { emoji: '🧀', word: '치즈',       ko: '치즈' },
      { emoji: '🍕', word: '피자',       ko: '피자' },
      { emoji: '🍰', word: '케이크',     ko: '케이크' },
      { emoji: '🍦', word: '아이스크림', ko: '아이스크림' },
      { emoji: '🍬', word: '사탕',       ko: '사탕' },
      { emoji: '🍪', word: '과자',       ko: '과자' },
      { emoji: '🧃', word: '주스',       ko: '주스' }
    ]
  },

  {
    id: 'ko-nature',
    subject: '한글',
    title: '자연과 하늘',
    icon: '🌳',
    lang: 'ko-KR',
    items: [
      { emoji: '🌳', word: '나무',   ko: '나무' },
      { emoji: '🌸', word: '꽃',     ko: '꽃' },
      { emoji: '🌿', word: '풀',     ko: '풀' },
      { emoji: '⛰️', word: '산',     ko: '산' },
      { emoji: '🌊', word: '바다',   ko: '바다' },
      { emoji: '🪨', word: '돌',     ko: '돌' },
      { emoji: '💧', word: '물',     ko: '물' },
      { emoji: '🔥', word: '불',     ko: '불' },
      { emoji: '☀️', word: '해',     ko: '해' },
      { emoji: '🌙', word: '달',     ko: '달' },
      { emoji: '⭐', word: '별',     ko: '별' },
      { emoji: '☁️', word: '구름',   ko: '구름' },
      { emoji: '🌧️', word: '비',     ko: '비' },
      { emoji: '❄️', word: '눈',     ko: '눈' },
      { emoji: '🌈', word: '무지개', ko: '무지개' },
      { emoji: '🌬️', word: '바람',   ko: '바람' }
    ]
  },

  {
    id: 'ko-clothes',
    subject: '한글',
    title: '옷과 물건',
    icon: '👕',
    lang: 'ko-KR',
    items: [
      { emoji: '👕', word: '옷',     ko: '옷' },
      { emoji: '👖', word: '바지',   ko: '바지' },
      { emoji: '👗', word: '치마',   ko: '치마' },
      { emoji: '🧦', word: '양말',   ko: '양말' },
      { emoji: '👟', word: '신발',   ko: '신발' },
      { emoji: '🧢', word: '모자',   ko: '모자' },
      { emoji: '🧤', word: '장갑',   ko: '장갑' },
      { emoji: '🧣', word: '목도리', ko: '목도리' },
      { emoji: '👓', word: '안경',   ko: '안경' },
      { emoji: '☂️', word: '우산',   ko: '우산' },
      { emoji: '🎒', word: '가방',   ko: '가방' },
      { emoji: '💍', word: '반지',   ko: '반지' }
    ]
  },

  {
    id: 'ko-house',
    subject: '한글',
    title: '집 안',
    icon: '🏠',
    lang: 'ko-KR',
    items: [
      { emoji: '🏠', word: '집',       ko: '집' },
      { emoji: '🚪', word: '문',       ko: '문' },
      { emoji: '🪟', word: '창문',     ko: '창문' },
      { emoji: '🪑', word: '의자',     ko: '의자' },
      { emoji: '🛏️', word: '침대',     ko: '침대' },
      { emoji: '🛋️', word: '소파',     ko: '소파' },
      { emoji: '⏰', word: '시계',     ko: '시계' },
      { emoji: '📺', word: '텔레비전', ko: '텔레비전' },
      { emoji: '📞', word: '전화',     ko: '전화' },
      { emoji: '💡', word: '전등',     ko: '전등' },
      { emoji: '🪞', word: '거울',     ko: '거울' },
      { emoji: '🧼', word: '비누',     ko: '비누' },
      { emoji: '🪥', word: '칫솔',     ko: '칫솔' },
      { emoji: '🛁', word: '욕조',     ko: '욕조' }
    ]
  },

  {
    id: 'ko-school',
    subject: '한글',
    title: '유치원 물건',
    icon: '✏️',
    lang: 'ko-KR',
    items: [
      { emoji: '✏️', word: '연필',   ko: '연필' },
      { emoji: '🖍️', word: '크레용', ko: '크레용' },
      { emoji: '🖌️', word: '붓',     ko: '붓' },
      { emoji: '🎨', word: '물감',   ko: '물감' },
      { emoji: '✂️', word: '가위',   ko: '가위' },
      { emoji: '📏', word: '자',     ko: '자' },
      { emoji: '📓', word: '공책',   ko: '공책' },
      { emoji: '📚', word: '책',     ko: '책' },
      { emoji: '📄', word: '종이',   ko: '종이' },
      { emoji: '🧴', word: '풀',     ko: '풀' },
      { emoji: '🎵', word: '노래',   ko: '노래' },
      { emoji: '⚽', word: '공',     ko: '공' }
    ]
  },

  {
    id: 'ko-feeling',
    subject: '한글',
    title: '기분',
    icon: '😊',
    lang: 'ko-KR',
    items: [
      { emoji: '😀', word: '기뻐요',     ko: '기뻐요' },
      { emoji: '😢', word: '슬퍼요',     ko: '슬퍼요' },
      { emoji: '😠', word: '화나요',     ko: '화나요' },
      { emoji: '😲', word: '놀랐어요',   ko: '놀랐어요' },
      { emoji: '😨', word: '무서워요',   ko: '무서워요' },
      { emoji: '😴', word: '졸려요',     ko: '졸려요' },
      { emoji: '🤒', word: '아파요',     ko: '아파요' },
      { emoji: '😋', word: '맛있어요',   ko: '맛있어요' },
      { emoji: '🥰', word: '좋아요',     ko: '좋아요' },
      { emoji: '😅', word: '부끄러워요', ko: '부끄러워요' }
    ]
  },

  {
    id: 'world-flags',
    subject: '세계',
    title: '국기',
    icon: '🚩',
    lang: 'en-US',           // word 에 적힌 영어 이름의 언어 (wordKo 때문에 지금은 화면에 안 나옵니다)
    wordKo: true,            // 세 놀이 모두 우리말 나라 이름으로
    items: [
      /* 아시아 47 */
      { emoji: '🇦🇫', word: 'Afghanistan',              ko: '아프가니스탄' },
      { emoji: '🇦🇲', word: 'Armenia',                  ko: '아르메니아' },
      { emoji: '🇦🇿', word: 'Azerbaijan',               ko: '아제르바이잔' },
      { emoji: '🇧🇭', word: 'Bahrain',                  ko: '바레인' },
      { emoji: '🇧🇩', word: 'Bangladesh',               ko: '방글라데시' },
      { emoji: '🇧🇹', word: 'Bhutan',                   ko: '부탄' },
      { emoji: '🇧🇳', word: 'Brunei',                   ko: '브루나이' },
      { emoji: '🇰🇭', word: 'Cambodia',                 ko: '캄보디아' },
      { emoji: '🇨🇳', word: 'China',                    ko: '중국' },
      { emoji: '🇨🇾', word: 'Cyprus',                   ko: '키프로스' },
      { emoji: '🇬🇪', word: 'Georgia',                  ko: '조지아' },
      { emoji: '🇮🇳', word: 'India',                    ko: '인도' },
      { emoji: '🇮🇩', word: 'Indonesia',                ko: '인도네시아' },
      { emoji: '🇮🇷', word: 'Iran',                     ko: '이란' },
      { emoji: '🇮🇶', word: 'Iraq',                     ko: '이라크' },
      { emoji: '🇮🇱', word: 'Israel',                   ko: '이스라엘' },
      { emoji: '🇯🇵', word: 'Japan',                    ko: '일본' },
      { emoji: '🇯🇴', word: 'Jordan',                   ko: '요르단' },
      { emoji: '🇰🇿', word: 'Kazakhstan',               ko: '카자흐스탄' },
      { emoji: '🇰🇼', word: 'Kuwait',                   ko: '쿠웨이트' },
      { emoji: '🇰🇬', word: 'Kyrgyzstan',               ko: '키르기스스탄' },
      { emoji: '🇱🇦', word: 'Laos',                     ko: '라오스' },
      { emoji: '🇱🇧', word: 'Lebanon',                  ko: '레바논' },
      { emoji: '🇲🇾', word: 'Malaysia',                 ko: '말레이시아' },
      { emoji: '🇲🇻', word: 'the Maldives',             ko: '몰디브' },
      { emoji: '🇲🇳', word: 'Mongolia',                 ko: '몽골' },
      { emoji: '🇲🇲', word: 'Myanmar',                  ko: '미얀마' },
      { emoji: '🇳🇵', word: 'Nepal',                    ko: '네팔' },
      { emoji: '🇰🇵', word: 'North Korea',              ko: '북한' },
      { emoji: '🇴🇲', word: 'Oman',                     ko: '오만' },
      { emoji: '🇵🇰', word: 'Pakistan',                 ko: '파키스탄' },
      { emoji: '🇵🇭', word: 'the Philippines',          ko: '필리핀' },
      { emoji: '🇶🇦', word: 'Qatar',                    ko: '카타르' },
      { emoji: '🇸🇦', word: 'Saudi Arabia',             ko: '사우디아라비아' },
      { emoji: '🇸🇬', word: 'Singapore',                ko: '싱가포르' },
      { emoji: '🇰🇷', word: 'South Korea',              ko: '대한민국' },
      { emoji: '🇱🇰', word: 'Sri Lanka',                ko: '스리랑카' },
      { emoji: '🇸🇾', word: 'Syria',                    ko: '시리아' },
      { emoji: '🇹🇯', word: 'Tajikistan',               ko: '타지키스탄' },
      { emoji: '🇹🇭', word: 'Thailand',                 ko: '태국' },
      { emoji: '🇹🇱', word: 'Timor-Leste',              ko: '동티모르' },
      { emoji: '🇹🇷', word: 'Turkiye',                  ko: '튀르키예' },
      { emoji: '🇹🇲', word: 'Turkmenistan',             ko: '투르크메니스탄' },
      { emoji: '🇦🇪', word: 'the United Arab Emirates', ko: '아랍에미리트' },
      { emoji: '🇺🇿', word: 'Uzbekistan',               ko: '우즈베키스탄' },
      { emoji: '🇻🇳', word: 'Vietnam',                  ko: '베트남' },
      { emoji: '🇾🇪', word: 'Yemen',                    ko: '예멘' },

      /* 유럽 43 */
      { emoji: '🇦🇱', word: 'Albania',                ko: '알바니아' },
      { emoji: '🇦🇩', word: 'Andorra',                ko: '안도라' },
      { emoji: '🇦🇹', word: 'Austria',                ko: '오스트리아' },
      { emoji: '🇧🇾', word: 'Belarus',                ko: '벨라루스' },
      { emoji: '🇧🇪', word: 'Belgium',                ko: '벨기에' },
      { emoji: '🇧🇦', word: 'Bosnia and Herzegovina', ko: '보스니아 헤르체고비나' },
      { emoji: '🇧🇬', word: 'Bulgaria',               ko: '불가리아' },
      { emoji: '🇭🇷', word: 'Croatia',                ko: '크로아티아' },
      { emoji: '🇨🇿', word: 'Czechia',                ko: '체코' },
      { emoji: '🇩🇰', word: 'Denmark',                ko: '덴마크' },
      { emoji: '🇪🇪', word: 'Estonia',                ko: '에스토니아' },
      { emoji: '🇫🇮', word: 'Finland',                ko: '핀란드' },
      { emoji: '🇫🇷', word: 'France',                 ko: '프랑스' },
      { emoji: '🇩🇪', word: 'Germany',                ko: '독일' },
      { emoji: '🇬🇷', word: 'Greece',                 ko: '그리스' },
      { emoji: '🇭🇺', word: 'Hungary',                ko: '헝가리' },
      { emoji: '🇮🇸', word: 'Iceland',                ko: '아이슬란드' },
      { emoji: '🇮🇪', word: 'Ireland',                ko: '아일랜드' },
      { emoji: '🇮🇹', word: 'Italy',                  ko: '이탈리아' },
      { emoji: '🇱🇻', word: 'Latvia',                 ko: '라트비아' },
      { emoji: '🇱🇮', word: 'Liechtenstein',          ko: '리히텐슈타인' },
      { emoji: '🇱🇹', word: 'Lithuania',              ko: '리투아니아' },
      { emoji: '🇱🇺', word: 'Luxembourg',             ko: '룩셈부르크' },
      { emoji: '🇲🇹', word: 'Malta',                  ko: '몰타' },
      { emoji: '🇲🇩', word: 'Moldova',                ko: '몰도바' },
      { emoji: '🇲🇨', word: 'Monaco',                 ko: '모나코' },
      { emoji: '🇲🇪', word: 'Montenegro',             ko: '몬테네그로' },
      { emoji: '🇳🇱', word: 'the Netherlands',        ko: '네덜란드' },
      { emoji: '🇲🇰', word: 'North Macedonia',        ko: '북마케도니아' },
      { emoji: '🇳🇴', word: 'Norway',                 ko: '노르웨이' },
      { emoji: '🇵🇱', word: 'Poland',                 ko: '폴란드' },
      { emoji: '🇵🇹', word: 'Portugal',               ko: '포르투갈' },
      { emoji: '🇷🇴', word: 'Romania',                ko: '루마니아' },
      { emoji: '🇷🇺', word: 'Russia',                 ko: '러시아' },
      { emoji: '🇸🇲', word: 'San Marino',             ko: '산마리노' },
      { emoji: '🇷🇸', word: 'Serbia',                 ko: '세르비아' },
      { emoji: '🇸🇰', word: 'Slovakia',               ko: '슬로바키아' },
      { emoji: '🇸🇮', word: 'Slovenia',               ko: '슬로베니아' },
      { emoji: '🇪🇸', word: 'Spain',                  ko: '스페인' },
      { emoji: '🇸🇪', word: 'Sweden',                 ko: '스웨덴' },
      { emoji: '🇨🇭', word: 'Switzerland',            ko: '스위스' },
      { emoji: '🇺🇦', word: 'Ukraine',                ko: '우크라이나' },
      { emoji: '🇬🇧', word: 'the United Kingdom',     ko: '영국' },

      /* 아프리카 54 */
      { emoji: '🇩🇿', word: 'Algeria',                      ko: '알제리' },
      { emoji: '🇦🇴', word: 'Angola',                       ko: '앙골라' },
      { emoji: '🇧🇯', word: 'Benin',                        ko: '베냉' },
      { emoji: '🇧🇼', word: 'Botswana',                     ko: '보츠와나' },
      { emoji: '🇧🇫', word: 'Burkina Faso',                 ko: '부르키나파소' },
      { emoji: '🇧🇮', word: 'Burundi',                      ko: '부룬디' },
      { emoji: '🇨🇻', word: 'Cabo Verde',                   ko: '카보베르데' },
      { emoji: '🇨🇲', word: 'Cameroon',                     ko: '카메룬' },
      { emoji: '🇨🇫', word: 'the Central African Republic', ko: '중앙아프리카공화국' },
      { emoji: '🇹🇩', word: 'Chad',                         ko: '차드' },
      { emoji: '🇰🇲', word: 'the Comoros',                  ko: '코모로' },
      { emoji: '🇨🇬', word: 'the Republic of the Congo',    ko: '콩고공화국' },
      { emoji: '🇨🇩', word: 'DR Congo',                     ko: '콩고민주공화국' },
      { emoji: '🇨🇮', word: 'Ivory Coast',                  ko: '코트디부아르' },
      { emoji: '🇩🇯', word: 'Djibouti',                     ko: '지부티' },
      { emoji: '🇪🇬', word: 'Egypt',                        ko: '이집트' },
      { emoji: '🇬🇶', word: 'Equatorial Guinea',            ko: '적도기니' },
      { emoji: '🇪🇷', word: 'Eritrea',                      ko: '에리트레아' },
      { emoji: '🇸🇿', word: 'Eswatini',                     ko: '에스와티니' },
      { emoji: '🇪🇹', word: 'Ethiopia',                     ko: '에티오피아' },
      { emoji: '🇬🇦', word: 'Gabon',                        ko: '가봉' },
      { emoji: '🇬🇲', word: 'the Gambia',                   ko: '감비아' },
      { emoji: '🇬🇭', word: 'Ghana',                        ko: '가나' },
      { emoji: '🇬🇳', word: 'Guinea',                       ko: '기니' },
      { emoji: '🇬🇼', word: 'Guinea-Bissau',                ko: '기니비사우' },
      { emoji: '🇰🇪', word: 'Kenya',                        ko: '케냐' },
      { emoji: '🇱🇸', word: 'Lesotho',                      ko: '레소토' },
      { emoji: '🇱🇷', word: 'Liberia',                      ko: '라이베리아' },
      { emoji: '🇱🇾', word: 'Libya',                        ko: '리비아' },
      { emoji: '🇲🇬', word: 'Madagascar',                   ko: '마다가스카르' },
      { emoji: '🇲🇼', word: 'Malawi',                       ko: '말라위' },
      { emoji: '🇲🇱', word: 'Mali',                         ko: '말리' },
      { emoji: '🇲🇷', word: 'Mauritania',                   ko: '모리타니' },
      { emoji: '🇲🇺', word: 'Mauritius',                    ko: '모리셔스' },
      { emoji: '🇲🇦', word: 'Morocco',                      ko: '모로코' },
      { emoji: '🇲🇿', word: 'Mozambique',                   ko: '모잠비크' },
      { emoji: '🇳🇦', word: 'Namibia',                      ko: '나미비아' },
      { emoji: '🇳🇪', word: 'Niger',                        ko: '니제르' },
      { emoji: '🇳🇬', word: 'Nigeria',                      ko: '나이지리아' },
      { emoji: '🇷🇼', word: 'Rwanda',                       ko: '르완다' },
      { emoji: '🇸🇹', word: 'Sao Tome and Principe',        ko: '상투메 프린시페' },
      { emoji: '🇸🇳', word: 'Senegal',                      ko: '세네갈' },
      { emoji: '🇸🇨', word: 'the Seychelles',               ko: '세이셸' },
      { emoji: '🇸🇱', word: 'Sierra Leone',                 ko: '시에라리온' },
      { emoji: '🇸🇴', word: 'Somalia',                      ko: '소말리아' },
      { emoji: '🇿🇦', word: 'South Africa',                 ko: '남아프리카공화국' },
      { emoji: '🇸🇸', word: 'South Sudan',                  ko: '남수단' },
      { emoji: '🇸🇩', word: 'Sudan',                        ko: '수단' },
      { emoji: '🇹🇿', word: 'Tanzania',                     ko: '탄자니아' },
      { emoji: '🇹🇬', word: 'Togo',                         ko: '토고' },
      { emoji: '🇹🇳', word: 'Tunisia',                      ko: '튀니지' },
      { emoji: '🇺🇬', word: 'Uganda',                       ko: '우간다' },
      { emoji: '🇿🇲', word: 'Zambia',                       ko: '잠비아' },
      { emoji: '🇿🇼', word: 'Zimbabwe',                     ko: '짐바브웨' },

      /* 아메리카 35 */
      { emoji: '🇦🇬', word: 'Antigua and Barbuda',              ko: '앤티가 바부다' },
      { emoji: '🇦🇷', word: 'Argentina',                        ko: '아르헨티나' },
      { emoji: '🇧🇸', word: 'the Bahamas',                      ko: '바하마' },
      { emoji: '🇧🇧', word: 'Barbados',                         ko: '바베이도스' },
      { emoji: '🇧🇿', word: 'Belize',                           ko: '벨리즈' },
      { emoji: '🇧🇴', word: 'Bolivia',                          ko: '볼리비아' },
      { emoji: '🇧🇷', word: 'Brazil',                           ko: '브라질' },
      { emoji: '🇨🇦', word: 'Canada',                           ko: '캐나다' },
      { emoji: '🇨🇱', word: 'Chile',                            ko: '칠레' },
      { emoji: '🇨🇴', word: 'Colombia',                         ko: '콜롬비아' },
      { emoji: '🇨🇷', word: 'Costa Rica',                       ko: '코스타리카' },
      { emoji: '🇨🇺', word: 'Cuba',                             ko: '쿠바' },
      { emoji: '🇩🇲', word: 'Dominica',                         ko: '도미니카연방' },
      { emoji: '🇩🇴', word: 'the Dominican Republic',           ko: '도미니카공화국' },
      { emoji: '🇪🇨', word: 'Ecuador',                          ko: '에콰도르' },
      { emoji: '🇸🇻', word: 'El Salvador',                      ko: '엘살바도르' },
      { emoji: '🇬🇩', word: 'Grenada',                          ko: '그레나다' },
      { emoji: '🇬🇹', word: 'Guatemala',                        ko: '과테말라' },
      { emoji: '🇬🇾', word: 'Guyana',                           ko: '가이아나' },
      { emoji: '🇭🇹', word: 'Haiti',                            ko: '아이티' },
      { emoji: '🇭🇳', word: 'Honduras',                         ko: '온두라스' },
      { emoji: '🇯🇲', word: 'Jamaica',                          ko: '자메이카' },
      { emoji: '🇲🇽', word: 'Mexico',                           ko: '멕시코' },
      { emoji: '🇳🇮', word: 'Nicaragua',                        ko: '니카라과' },
      { emoji: '🇵🇦', word: 'Panama',                           ko: '파나마' },
      { emoji: '🇵🇾', word: 'Paraguay',                         ko: '파라과이' },
      { emoji: '🇵🇪', word: 'Peru',                             ko: '페루' },
      { emoji: '🇰🇳', word: 'Saint Kitts and Nevis',            ko: '세인트키츠 네비스' },
      { emoji: '🇱🇨', word: 'Saint Lucia',                      ko: '세인트루시아' },
      { emoji: '🇻🇨', word: 'Saint Vincent and the Grenadines', ko: '세인트빈센트 그레나딘' },
      { emoji: '🇸🇷', word: 'Suriname',                         ko: '수리남' },
      { emoji: '🇹🇹', word: 'Trinidad and Tobago',              ko: '트리니다드 토바고' },
      { emoji: '🇺🇸', word: 'the United States',                ko: '미국' },
      { emoji: '🇺🇾', word: 'Uruguay',                          ko: '우루과이' },
      { emoji: '🇻🇪', word: 'Venezuela',                        ko: '베네수엘라' },

      /* 오세아니아 14 */
      { emoji: '🇦🇺', word: 'Australia',            ko: '호주' },
      { emoji: '🇫🇯', word: 'Fiji',                 ko: '피지' },
      { emoji: '🇰🇮', word: 'Kiribati',             ko: '키리바시' },
      { emoji: '🇲🇭', word: 'the Marshall Islands', ko: '마셜제도' },
      { emoji: '🇫🇲', word: 'Micronesia',           ko: '미크로네시아' },
      { emoji: '🇳🇷', word: 'Nauru',                ko: '나우루' },
      { emoji: '🇳🇿', word: 'New Zealand',          ko: '뉴질랜드' },
      { emoji: '🇵🇼', word: 'Palau',                ko: '팔라우' },
      { emoji: '🇵🇬', word: 'Papua New Guinea',     ko: '파푸아뉴기니' },
      { emoji: '🇼🇸', word: 'Samoa',                ko: '사모아' },
      { emoji: '🇸🇧', word: 'the Solomon Islands',  ko: '솔로몬제도' },
      { emoji: '🇹🇴', word: 'Tonga',                ko: '통가' },
      { emoji: '🇹🇻', word: 'Tuvalu',               ko: '투발루' },
      { emoji: '🇻🇺', word: 'Vanuatu',              ko: '바누아투' }
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
    subject: '영어',
    title: '마을 지도',
    icon: '🗺️',
    meta: '마을 시설 이름을 익혀요',
    href: 'town.html',
    bestKey: 'daniland.best.town'
  },

  {
    subject: '세계',
    title: '세계 지도',
    icon: '🗺️',
    meta: '나라 이름과 그곳에 있는 것',
    href: 'world.html',
    bestKey: 'daniland.best.world'
  },

  {
    subject: '한글',
    title: '글자 쓰기',
    icon: '✏️',
    meta: '획순대로 따라 써요',
    href: 'write.html',
    bestKey: 'daniland.best.write'
  },

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
