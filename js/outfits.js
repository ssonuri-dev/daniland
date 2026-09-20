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
    { id: 'basic',    name: '평상복' },
    // 드레스 — 옷만 그린 시트(3×4)를 잘라 맨어깨 다니(인어공주 그림의 머리·팔 + 공주 그림의 구두) 위에 얹은 것
    { id: 'blue',      name: '하늘색 드레스' },
    { id: 'yellow',    name: '노란 드레스' },
    { id: 'dot',       name: '물방울 드레스' },
    { id: 'snow',      name: '백설공주' },
    { id: 'snowflake', name: '눈꽃 드레스' },
    { id: 'ladybug',   name: '무당벌레' },
    { id: 'green',     name: '초록 드레스' },
    { id: 'rainbow',   name: '무지개 드레스' },
    { id: 'navy',      name: '남색 드레스' },
    // 아이돌 옷 — 윗옷·치마·부츠 시트를 잘라 다리 있는 다니(평상복 그림의 다리) 위에 얹은 것.
    // 시트에 같이 그려진 머리 장식은 옷에 붙이지 않고 소품(accessories 의 idol 묶음)으로 뺐습니다.
    { id: 'pinkidol',    name: '분홍 아이돌' },
    { id: 'sailor',      name: '세일러 아이돌' },
    { id: 'lavender',    name: '보라 아이돌' },
    { id: 'rock',        name: '빨강 체크 아이돌' },
    { id: 'yellowidol',  name: '노랑 아이돌' },
    { id: 'mint',        name: '민트 아이돌' },
    { id: 'pinkblack',   name: '핑크 블랙 아이돌' },
    { id: 'angel',       name: '천사 아이돌' },
    { id: 'violet',      name: '자주 아이돌' },
    { id: 'rainbowidol', name: '무지개 아이돌' },
    { id: 'navyidol',    name: '제복 아이돌' },
    { id: 'pinkplaid',   name: '분홍 체크 아이돌' }
  ],

  hairs: [
    { id: 'long',     name: '긴 생머리', x:  50.2, y:  49.9, size:  55.3 },
    { id: 'wave',     name: '웨이브',   x:  49.7, y:  50.3, size:  56.6 },
    { id: 'twin',     name: '양갈래',   x:  50.1, y:  49.0, size:  51.1 },
    { id: 'pony',     name: '포니테일',  x:  54.0, y:  42.8, size:  42.1 },
    { id: 'braid',    name: '땋은 머리', x:  50.1, y:  49.2, size:  52.8 },
    { id: 'bun',      name: '똥머리',   x:  49.9, y:  39.5, size:  43.1 }
  ],

  accessories: [
    { id: 'crown',    name: '왕관',    x:  50.0, y:  30.5, size:  19.5 },
    { id: 'bow',      name: '리본',    x:  61.3, y:  35.8, size:  10.7 },
    { id: 'glasses',  name: '선글라스',  x:  50.0, y:  48.6, size:  25.8 },
    { id: 'necklace', name: '목걸이',   x:  50.0, y:  58.9, size:  14.5 },
    { id: 'bag',      name: '가방',    x:  32.2, y:  75.5, size:  15.4 },
    { id: 'wand',     name: '요술봉',   x:  73.0, y:  64.7, size:  29.5 },
    { id: 'flower',   name: '꽃다발',   x:  32.8, y:  67.7, size:  17.4 },
    { id: 'balloon',  name: '풍선',    x:  67.8, y:  63.3, size:  24.5 },
    // 아이돌 시트의 머리 장식 — 머리띠·리본은 정수리(y 33.8), 모자는 조금 내려 머리에 씌움(y 36.4)
    { id: 'pinkidol',    name: '하트 리본 머리띠', x:  50.4, y:  33.8, size:  18.2 },
    { id: 'sailor',      name: '베레모',       x:  51.6, y:  36.4, size:  17.7 },
    { id: 'lavender',    name: '보라 리본',     x:  51.1, y:  33.8, size:  16.6 },
    { id: 'rock',        name: '검정 모자',     x:  52.5, y:  36.4, size:  16.6 },
    { id: 'yellowidol',  name: '노랑 리본',     x:  51.2, y:  33.8, size:  16.5 },
    { id: 'mint',        name: '꽃 머리띠',     x:  52.6, y:  33.8, size:  17.4 },
    { id: 'pinkblack',   name: '분홍 리본',     x:  48.9, y:  33.8, size:  17.0 },
    { id: 'angel',       name: '날개 머리핀',    x:  50.4, y:  33.8, size:  17.1 },
    { id: 'violet',      name: '장미 머리띠',    x:  49.9, y:  33.8, size:  17.5 },
    { id: 'rainbowidol', name: '무지개 리본',    x:  50.8, y:  33.8, size:  18.0 },
    { id: 'navyidol',    name: '제복 모자',     x:  52.6, y:  36.4, size:  17.5 },
    { id: 'pinkplaid',   name: '검정 리본',     x:  50.2, y:  33.8, size:  16.1 }
  ]
};
