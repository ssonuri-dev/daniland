/* =========================================================================
 * 다니랜드 - 코디 놀이 (dress.html 이 읽는 데이터)
 *
 * 배경 하나 + 옷(캐릭터) 하나 + 머리 하나 + 소품 여러 개를 겹쳐서 다니를 꾸밉니다. 점수 없는 자유 놀이라
 * 그림책(books.js)처럼 계속 늘어나도 되고, 늘려도 dress.js 는 고칠 필요가 없습니다.
 *
 * 겹치는 순서(아래→위): 배경 → 옷(짧은 커트머리의 기본 다니가 옷을 입은 전신) → 머리 → 소품.
 * 옷 그림의 다니는 일부러 짧은 머리라, 긴 머리·양갈래 같은 머리 그림을 위에 얹으면 그 머리가 됩니다.
 * 머리를 안 고르면(기본) 옷 그림의 커트머리 그대로입니다.
 *
 * ★ 이모지 대체 그림이 없습니다 — 전부 진짜 그림 파일로만 그립니다. 그림이 아직 없는 항목은
 *   이름 글자가 든 빈 칸으로 보입니다 (dress.js 의 artBox() 가 그립니다). 그림을 넣으면 자동으로 바뀝니다.
 *
 * 그림 파일 자리 (모두 dress/ 폴더)
 *   배경 : dress/bg-<scenes 의 id>.jpg        — 정사각형(1:1) 권장. 투명이 필요 없어 jpg 가 훨씬 작습니다.
 *   옷   : dress/costume-<costumes 의 id>.png — 투명 배경, 세로로 긴 비율(3:5) 권장, 발이 아래쪽에 오게
 *   머리 : dress/hair-<hairs 의 id>.png       — 투명 배경, 정사각형(1:1) 권장. 머리카락만(얼굴 없이)
 *   소품 : dress/acc-<accessories 의 id>.png  — 투명 배경, 정사각형(1:1) 권장
 *
 *  scenes      : 배경 목록 — 하나를 고릅니다 { id, name }
 *  costumes    : 옷(캐릭터 전체 모습) 목록 — 하나를 고릅니다 { id, name, noHair }
 *                noHair: true 면 그 옷을 입은 동안 머리 고르기를 숨깁니다 (모자가 든 옷 — 머리 그림이 모자 위에 덮여서)
 *                사람 캐릭터입니다 — 마스코트 강아지(dani.png) 아님. 모든 옷 그림의 다니는 같은 얼굴·같은 자세·
 *                같은 짧은 머리여야 머리·소품이 제자리에 얹힙니다.
 *  hairs       : 머리 목록 — 하나를 고르거나 안 고릅니다 { id, name, x, y, size }
 *  accessories : 소품 목록 — 여러 개를 동시에 걸칠 수 있습니다 { id, name, x, y, size }
 *                x·y 는 무대 기준 위치(%), size 는 무대 너비 대비 크기(%). 그림이 오면 자리를 다시 맞춥니다.
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
    { id: 'witch',    name: '마녀', noHair: true },   // 모자를 쓴 옷 — 머리 그림이 모자를 덮어서 머리 고르기를 숨깁니다
    { id: 'dancer',   name: '무용수' },
    { id: 'basic',    name: '평상복' }
  ],

  hairs: [
    { id: 'long',     name: '긴 생머리', x:  50.1, y:  55.3, size:  60.4 },
    { id: 'wave',     name: '웨이브',   x:  49.9, y:  56.3, size:  61.7 },
    { id: 'twin',     name: '양갈래',   x:  50.2, y:  56.9, size:  55.8 },
    { id: 'pony',     name: '포니테일',  x:  54.0, y:  47.1, size:  45.9 },
    { id: 'braid',    name: '땋은 머리', x:  49.9, y:  52.2, size:  57.7 },
    { id: 'bun',      name: '똥머리',   x:  50.1, y:  41.4, size:  47.0 }
  ],

  accessories: [
    { id: 'crown',    name: '왕관',    x:  50.0, y:  30.5, size:  19.5 },
    { id: 'bow',      name: '리본',    x:  61.3, y:  35.8, size:  10.7 },
    { id: 'glasses',  name: '선글라스',  x:  50.0, y:  48.6, size:  25.8 },
    { id: 'necklace', name: '목걸이',   x:  50.0, y:  58.9, size:  14.5 },
    { id: 'bag',      name: '가방',    x:  32.2, y:  75.5, size:  15.4 },
    { id: 'wand',     name: '요술봉',   x:  73.0, y:  64.7, size:  29.5 },
    { id: 'flower',   name: '꽃다발',   x:  32.8, y:  67.7, size:  17.4 },
    { id: 'balloon',  name: '풍선',    x:  67.8, y:  63.3, size:  24.5 }
  ]
};
