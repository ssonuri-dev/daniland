/* =========================================================================
 * 다니랜드 - 몸 이름의 부위 데이터 (body.html · wordquiz.html 이 같이 읽습니다)
 *
 * 몸 이름(js/body.js)이 쓰던 PARTS 를 그대로 옮긴 것입니다. 단어 퀴즈(js/wordquiz.js)가
 * word · ko 를 읽어 '몸 이름' 낱말 문제를 냅니다 (icon 은 🎒 어깨·🧣 목처럼 빗댄 그림이라 퀴즈에서는 글자 문제로만).
 * ========================================================================= */

/* -------------------------------------------------------------------------
 * 몸의 열세 곳
 *   word  : 영어 이름 (한 개일 때)
 *   many  : 둘일 때의 이름 (eye → eyes, foot → feet). 없으면 하나뿐인 곳입니다.
 *   boxes : 누를 수 있는 칸 [왼쪽, 위, 너비, 높이] — 눈·귀·손처럼 둘인 곳은 두 칸입니다.
 *   hint  : '무엇을 할까' 에서 내는 말 (이름을 말하지 않습니다)
 *   use   : 맞혔을 때 읽어 주는, 이름이 든 문장
 * ---------------------------------------------------------------------- */
window.BODY_PARTS = [
  { id: 'hair', word: 'hair', ko: '머리카락', icon: '💇',
    hint: 'I brush this every morning.', use: 'I brush my hair.',
    boxes: [[24, 8, 52, 19]] },

  { id: 'eye', word: 'eye', many: 'eyes', ko: '눈', icon: '👁️',
    hint: 'I see with these.', use: 'I see with my eyes.',
    boxes: [[31, 27, 14, 9], [55, 27, 14, 9]] },

  { id: 'ear', word: 'ear', many: 'ears', ko: '귀', icon: '👂',
    hint: 'I hear with these.', use: 'I hear with my ears.',
    boxes: [[15, 27, 16, 11], [69, 27, 16, 11]] },

  { id: 'nose', word: 'nose', ko: '코', icon: '👃',
    hint: 'I smell flowers with this.', use: 'I smell with my nose.',
    boxes: [[45, 27, 10, 9]] },

  { id: 'mouth', word: 'mouth', ko: '입', icon: '👄',
    hint: 'I eat and talk with this.', use: 'I eat with my mouth.',
    boxes: [[31, 36, 38, 5]] },

  { id: 'neck', word: 'neck', ko: '목', icon: '🧣',
    hint: 'My scarf goes around this.', use: 'My scarf goes around my neck.',
    boxes: [[44, 41, 12, 5.5]] },

  { id: 'shoulder', word: 'shoulder', many: 'shoulders', ko: '어깨', icon: '🎒',
    hint: 'My bag hangs on these.', use: 'My bag is on my shoulders.',
    boxes: [[28, 42, 16, 5.5], [56, 42, 16, 5.5]] },

  { id: 'arm', word: 'arm', many: 'arms', ko: '팔', icon: '💪',
    hint: 'I hug you with these.', use: 'I hug you with my arms.',
    boxes: [[24, 47.5, 11, 11.5], [65, 47.5, 11, 11.5]] },

  { id: 'tummy', word: 'tummy', ko: '배', icon: '😋',
    hint: 'This is full after lunch.', use: 'My tummy is full.',
    boxes: [[35, 47.5, 30, 15.5]] },

  { id: 'hand', word: 'hand', many: 'hands', ko: '손', icon: '✋',
    hint: 'I clap with these.', use: 'I clap my hands.',
    boxes: [[17, 59, 18, 9], [65, 59, 18, 9]] },

  { id: 'knee', word: 'knee', many: 'knees', ko: '무릎', icon: '🧎',
    hint: 'I bend these when I sit down.', use: 'I bend my knees.',
    boxes: [[36, 73.5, 14, 6], [50, 73.5, 14, 6]] },

  // 다리는 반바지 아래(허벅지)와 무릎 아래(정강이) 두 군데씩 — 무릎 칸을 피해 갈라 두었습니다.
  { id: 'leg', word: 'leg', many: 'legs', ko: '다리', icon: '🦵',
    hint: 'I run with these.', use: 'I run with my legs.',
    boxes: [[35, 63.5, 15, 10], [50, 63.5, 15, 10], [35, 79.5, 15, 8], [50, 79.5, 15, 8]] },

  { id: 'foot', word: 'foot', many: 'feet', ko: '발', icon: '🦶',
    hint: 'I wear socks and shoes on these.', use: 'I wear shoes on my feet.',
    boxes: [[34, 87.5, 16, 9.5], [50, 87.5, 16, 9.5]] }
];
