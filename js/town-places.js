/* =========================================================================
 * 다니랜드 - 마을 지도의 장소 데이터 (town.html · wordquiz.html 이 같이 읽습니다)
 *
 * 마을 지도(js/town.js)가 쓰던 PLACES 를 그대로 옮긴 것입니다. 단어 퀴즈(js/wordquiz.js)가
 * word · ko · icon 을 읽어 '마을 지도' 낱말 문제를 내므로, 여기서 장소를 더하면 퀴즈에도 나옵니다.
 * ========================================================================= */

/* -------------------------------------------------------------------------
 * 마을의 열 곳
 *   box  : 누를 수 있는 칸 [왼쪽, 위, 너비, 높이]  (그림의 한 블록 전체)
 *   x, y : 다니가 서는 자리
 *   row  : 몇 번째 줄인지 (길을 찾을 때 씁니다)
 *   items: 심부름 놀이에 나오는 물건과 영어 문장
 * ---------------------------------------------------------------------- */
window.TOWN_PLACES = [
  {
    id: 'hospital', word: 'hospital', ko: '병원', icon: '🏥',
    row: 1, box: [0.5, 1.5, 23.5, 28], x: 12, y: 26,
    items: [
      { emoji: '💊', say: 'I am sick. I need some medicine.' },
      { emoji: '🩹', say: 'I hurt my knee.' },
      { emoji: '🤒', say: 'I have a fever.' },
      { emoji: '🦷', say: 'My tooth hurts.' },
      { emoji: '🚑', say: 'We need an ambulance.' },
      { emoji: '🧑‍⚕️', say: 'I want to see the doctor.' },
      { emoji: '🤧', say: 'I have a bad cold.' },
      { emoji: '💉', say: 'It is time for my shot.' },
      { emoji: '🩺', say: 'The baby needs a check-up.' },
      { emoji: '🤕', say: 'I bumped my head.' }
    ]
  },
  {
    id: 'school', word: 'school', ko: '학교', icon: '🏫',
    row: 1, box: [27.5, 1.5, 24.5, 28], x: 40, y: 26,
    items: [
      { emoji: '🎒', say: 'It is time to study.' },
      { emoji: '👩‍🏫', say: 'I want to see my teacher.' },
      { emoji: '✏️', say: 'I forgot my pencil.' },
      { emoji: '📚', say: 'I want to read a new book.' },
      { emoji: '🔔', say: 'The bell is ringing.' },
      { emoji: '🖍️', say: 'I want to draw with crayons.' },
      { emoji: '🧮', say: 'I want to learn numbers.' },
      { emoji: '🧑‍🎓', say: 'I want to learn English.' },
      { emoji: '🎨', say: 'We have art class today.' },
      { emoji: '🍱', say: 'I want to eat lunch with my class.' }
    ]
  },
  {
    id: 'fire-station', word: 'fire station', ko: '소방서', icon: '🚒',
    row: 1, box: [53.5, 1.5, 20.5, 28], x: 63.5, y: 26,
    items: [
      { emoji: '🔥', say: 'There is a fire!' },
      { emoji: '🧑‍🚒', say: 'We need a fire fighter.' },
      { emoji: '🚒', say: 'I want to see the fire truck.' },
      { emoji: '🧯', say: 'We need a fire extinguisher.' },
      { emoji: '💧', say: 'They spray water on the fire.' },
      { emoji: '🪜', say: 'They have a very big ladder.' },
      { emoji: '🐈', say: 'A cat is stuck in a tree.' },
      { emoji: '⛑️', say: 'I want to try the red helmet.' },
      { emoji: '📞', say: 'We call 119 when there is a fire.' },
      { emoji: '🚨', say: 'The siren is very loud.' }
    ]
  },
  {
    id: 'police-station', word: 'police station', ko: '경찰서', icon: '🚓',
    row: 1, box: [77.5, 1.5, 22, 28], x: 88.5, y: 26,
    items: [
      { emoji: '👮', say: 'We need a police officer.' },
      { emoji: '🐶', say: 'I lost my puppy.' },
      { emoji: '🚓', say: 'I want to see the police car.' },
      { emoji: '👜', say: 'I lost my bag.' },
      { emoji: '🛴', say: 'Someone took my scooter.' },
      { emoji: '🆘', say: 'I need help right now.' },
      { emoji: '😰', say: 'I am lost. Where is my mom?' },
      { emoji: '👛', say: 'I found a wallet on the street.' },
      { emoji: '🚦', say: 'That car did not stop at the light.' },
      { emoji: '🐕‍🦺', say: 'I want to meet the police dog.' }
    ]
  },

  {
    id: 'bakery', word: 'bakery', ko: '빵집', icon: '🥐',
    row: 2, box: [0.5, 34, 21.5, 30.5], x: 11, y: 60,
    items: [
      { emoji: '🍞', say: 'I want some bread.' },
      { emoji: '🎂', say: 'I want a birthday cake.' },
      { emoji: '🥐', say: 'I want a croissant.' },
      { emoji: '🧁', say: 'I want a cupcake.' },
      { emoji: '🍪', say: 'I want some cookies.' },
      { emoji: '🥖', say: 'We need a long baguette.' },
      { emoji: '🍩', say: 'I want a doughnut.' },
      { emoji: '🥯', say: 'I want a bagel.' },
      { emoji: '🥧', say: 'I want a warm apple pie.' },
      { emoji: '👨‍🍳', say: 'The baker is making bread.' }
    ]
  },
  {
    id: 'park', word: 'park', ko: '공원', icon: '🌳',
    row: 2, box: [25.5, 34, 49.5, 30.5], x: 50, y: 60,
    items: [
      { emoji: '⚽', say: 'I want to play soccer.' },
      { emoji: '🦆', say: 'I want to see the ducks.' },
      { emoji: '🛝', say: 'I want to play on the slide.' },
      { emoji: '🌳', say: 'I want to sit under a big tree.' },
      { emoji: '🪁', say: 'I want to fly my kite.' },
      { emoji: '🚲', say: 'I want to ride my bike.' },
      { emoji: '🧺', say: 'We want to have a picnic.' },
      { emoji: '🌸', say: 'The flowers are so pretty.' },
      { emoji: '🏃', say: 'I want to run and run.' },
      { emoji: '🦋', say: 'I want to see the butterflies.' }
    ]
  },
  {
    id: 'market', word: 'market', ko: '가게', icon: '🍎',
    row: 2, box: [78, 34, 21.5, 30.5], x: 89, y: 60,
    items: [
      { emoji: '🍎', say: 'I want to buy some apples.' },
      { emoji: '🥕', say: 'We need carrots.' },
      { emoji: '🥛', say: 'We need some milk.' },
      { emoji: '🍌', say: 'I want bananas.' },
      { emoji: '🥚', say: 'We need eggs.' },
      { emoji: '🧀', say: 'I want some cheese.' },
      { emoji: '🍇', say: 'I want grapes.' },
      { emoji: '🥔', say: 'We need potatoes.' },
      { emoji: '🛒', say: 'Mom needs a shopping cart.' },
      { emoji: '🍉', say: 'I want a big watermelon.' }
    ]
  },

  {
    id: 'toy-store', word: 'toy store', ko: '장난감 가게', icon: '🧸',
    row: 3, box: [0.5, 70, 22, 29.5], x: 11.5, y: 95,
    items: [
      { emoji: '🧸', say: 'I want a teddy bear.' },
      { emoji: '🚗', say: 'I want a toy car.' },
      { emoji: '🧩', say: 'I want a puzzle.' },
      { emoji: '🪀', say: 'I want a yo-yo.' },
      { emoji: '🎈', say: 'I want a big balloon.' },
      { emoji: '🤖', say: 'I want a robot.' },
      { emoji: '🪆', say: 'I want a doll.' },
      { emoji: '🏀', say: 'I want a basketball.' },
      { emoji: '🧱', say: 'I want building blocks.' },
      { emoji: '🚂', say: 'I want a toy train.' }
    ]
  },
  {
    id: 'house', word: 'house', ko: '우리 집', icon: '🏠',
    row: 3, box: [26.5, 70, 48, 29.5], x: 50.5, y: 95,
    items: [
      { emoji: '😴', say: 'I am sleepy.' },
      { emoji: '🛏️', say: 'It is time for bed.' },
      { emoji: '🍽️', say: 'It is dinner time.' },
      { emoji: '🛁', say: 'I want to take a bath.' },
      { emoji: '📺', say: 'I want to watch TV.' },
      { emoji: '👵', say: 'Grandma is waiting for me.' },
      { emoji: '🚽', say: 'I need to use the bathroom.' },
      { emoji: '🌙', say: 'It is dark. Let us go home.' },
      { emoji: '🎮', say: 'I want to play at home.' },
      { emoji: '🏡', say: 'I want to go home now.' }
    ]
  },
  {
    id: 'clothing-store', word: 'clothing store', ko: '옷 가게', icon: '👕',
    row: 3, box: [77.5, 70, 22, 29.5], x: 88.5, y: 95,
    items: [
      { emoji: '👕', say: 'I need a new shirt.' },
      { emoji: '👗', say: 'I want a pretty dress.' },
      { emoji: '🧢', say: 'I need a cap.' },
      { emoji: '👟', say: 'I need new shoes.' },
      { emoji: '🧥', say: 'It is cold. I need a coat.' },
      { emoji: '🧤', say: 'I need warm gloves.' },
      { emoji: '🧣', say: 'I want a long scarf.' },
      { emoji: '👖', say: 'My pants are too small.' },
      { emoji: '🧦', say: 'I need new socks.' },
      { emoji: '👒', say: 'I want a summer hat.' }
    ]
  }
];
