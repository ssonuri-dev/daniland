/* =========================================================================
 * 다니랜드 - 코디 놀이 (dress.html 이 읽는 데이터)
 *
 * 배경 하나 + 옷(캐릭터) 하나 + 소품 여러 개를 겹쳐서 다니를 꾸밉니다. 점수 없는 자유 놀이라
 * 그림책(books.js)처럼 계속 늘어나도 되고, 늘려도 dress.js 는 고칠 필요가 없습니다.
 *
 * ★ 이모지 대체 그림이 없습니다 — 전부 진짜 그림 파일로만 그립니다. 그림이 아직 없는 항목은
 *   이름 글자가 든 빈 칸으로 보입니다 (dress.js 의 artBox() 가 그립니다). 그림을 넣으면 자동으로 바뀝니다.
 *
 * 그림 파일 자리 (모두 dress/ 폴더)
 *   배경 : dress/bg-<scenes 의 id>.jpg        — 정사각형(1:1) 권장. 투명이 필요 없어 jpg 가 훨씬 작습니다.
 *   옷   : dress/costume-<costumes 의 id>.png — 투명 배경, 세로로 긴 비율(3:5) 권장, 발이 아래쪽에 오게
 *   소품 : dress/acc-<accessories 의 id>.png  — 투명 배경, 정사각형(1:1) 권장
 *
 *  scenes      : 배경 목록 — 하나를 고릅니다 { id, name }
 *  costumes    : 옷(캐릭터 전체 모습) 목록 — 하나를 고릅니다 { id, name }
 *                사람 공주(book.js 의 Princess Dani)처럼 사람 캐릭터입니다 — 마스코트 강아지(dani.png) 아님.
 *  accessories : 소품 목록 — 여러 개를 동시에 걸칠 수 있습니다 { id, name, x, y, size }
 *                x·y 는 무대 기준 위치(%), size 는 무대 너비 대비 크기(%)
 * ========================================================================= */

window.OUTFITS = {
  scenes: [
    { id: 'castle',  name: '성' },
    { id: 'beach',   name: '바다' },
    { id: 'park',    name: '공원' },
    { id: 'stage',   name: '무대' },
    { id: 'space',   name: '우주' },
    { id: 'rainbow', name: '구름' }
  ],

  costumes: [
    { id: 'princess', name: '공주' },
    { id: 'mermaid',  name: '인어공주' },
    { id: 'fairy',    name: '요정' },
    { id: 'hero',     name: '슈퍼히어로' },
    { id: 'astro',    name: '우주비행사' },
    { id: 'doctor',   name: '의사' },
    { id: 'witch',    name: '마녀' },
    { id: 'dancer',   name: '무용수' }
  ],

  accessories: [
    { id: 'crown',    name: '왕관',   x: 50, y: 8,  size: 20 },
    { id: 'bow',      name: '리본',   x: 28, y: 13, size: 15 },
    { id: 'glasses',  name: '선글라스', x: 50, y: 32, size: 18 },
    { id: 'necklace', name: '목걸이', x: 50, y: 46, size: 14 },
    { id: 'bag',      name: '가방',   x: 76, y: 64, size: 18 },
    { id: 'wand',     name: '요술봉', x: 20, y: 58, size: 16 },
    { id: 'flower',   name: '꽃다발', x: 24, y: 70, size: 16 },
    { id: 'balloon',  name: '풍선',   x: 84, y: 36, size: 18 }
  ]
};
