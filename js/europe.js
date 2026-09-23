/* =========================================================================
 * 다니랜드 - 유럽 (세계: 대륙 한 곳을 지도와 이야기로 알아보기)
 *
 * 세계 지도(world.js)와 나라 페이지(country.js)의 가운데쯤 되는 화면입니다 — 지도 한 장 위에서 나라 열여덟 곳을
 * 찾아가되, 나라마다 스웨덴처럼 이야기와 볼거리가 붙어 있습니다. 세계 지도가 그림 파일(world.jpg) 위에
 * 네모 단추를 얹는 것과 달리, 여기 지도는 **나라 모양 그대로 그린 svg** 입니다 (js/europe-map.js — Natural Earth
 * 자료로 만들어 낸 것이라 손으로 고치지 않습니다). 나라 땅 자체가 단추이고, 그 위에 국기 핀(.eu-pin)이
 * 하나씩 서 있습니다 — 스위스·덴마크처럼 작은 나라는 땅만으로는 손가락에 안 잡혀서요.
 *
 * 놀이 4가지 (시작 화면에서 고릅니다)
 *   look   : 구경하기      - 나라를 누르면 다니가 날아가고 이야기 판에 그 나라 이야기가 나옵니다 (점수 없음)
 *   listen : 찾아가기      - "프랑스로 날아가요!" 를 듣고 그 나라를 찾습니다
 *   find   : 무엇이 있을까 - "🗼 에펠탑이 있는 나라예요" 를 듣고 그 나라를 찾습니다
 *   flag   : 국기 찾기     - 국기를 보고 그 나라를 찾습니다 (이때만 핀의 국기가 ❓ 로 가려집니다 — 안 가리면 같은 그림 찾기가 됩니다)
 *
 * 이야기 판(.eu-panel)은 세로 화면에서는 지도 아래, 가로가 넉넉한 화면에서는 지도 오른쪽에 붙습니다
 * (fitMap 이 .eu-stage 에 wide 를 붙였다 뗐다 합니다). 좌표(x, y)는 모두 지도 그림 기준 백분율(%)입니다.
 *
 * 읽어 주는 말은 우리말(ko-KR)이고, 나라마다 그 나라 말 인사(hello)가 있습니다 — 기기에 그 말 목소리가 있을 때만
 * 우리말 뒤에 읽어 주고, 없으면 조용히 건너뜁니다 (읽는 법이 우리말로 같이 적혀 있어서 못 들어도 됩니다).
 *
 * 내용은 6~7살 수준이지만 사실은 정확하게 적었습니다 — 쉽게 한다고 틀리게 적지 마세요.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* -------------------------------------------------------------------------
   * 나라 열여덟 곳 — 서쪽에서 동쪽, 북쪽에서 남쪽 순서는 아니고 지도에서 찾기 쉬운 순서입니다.
   *   id        : js/europe-map.js 의 land 키와 같아야 합니다 (ISO 두 글자)
   *   ko / en   : 이름 · capital / capitalEn : 수도
   *   x, y      : 국기 핀이 서고 다니가 내리는 자리 (지도 기준 %) — 수도가 아니라 나라 한가운데쯤입니다.
   *               핀끼리 겹치지 않게 조금씩 옮겨 두었으니 (체코·오스트리아·스위스) 수도 좌표로 되돌리지 마세요.
   *   hello     : 그 나라 말 인사 — text(그 나라 글자) · ko(읽는 법) · lang(목소리 언어)
   *   intro     : 구경하기에서 읽어 주는 이야기 (우리말, 서너 문장)
   *   items     : 볼거리 셋 — emoji · label(짧은 이름) · say(문장, '무엇이 있을까' 의 문제이자 눌렀을 때 읽는 말)
   *               같은 그림·같은 볼거리가 두 나라에 있으면 '무엇이 있을까' 의 정답이 둘이 되니 나라마다 다른 것만 적습니다.
   *   img       : (없어도 됩니다) 이야기 판에 보여 줄 사진 — europe/ 폴더의 파일 이름 (가로 800px, 4:3).
 *               파일이 없으면 국기 이모지로 대신 그리므로 사진이 오기 전에도 돌아갑니다 (artEl). 출처는 europe/CREDITS.md 에.
 *   more      : (없어도 됩니다) 더 깊이 보는 나라 페이지 (country.html?country=<id>) — 스웨덴·그리스·독일·프랑스·노르웨이·스페인
   * ---------------------------------------------------------------------- */
  var COUNTRIES = [
    {
      id: 'IS', ko: '아이슬란드', en: 'Iceland', icon: '🇮🇸', capital: '레이캬비크', capitalEn: 'Reykjavik',
      img: 'geysir.jpg',
      x: 12, y: 11,
      hello: { text: 'Halló', ko: '할로', lang: 'is-IS' },
      intro: '유럽 맨 북서쪽, 바다 한가운데 있는 섬나라예요. "얼음과 불의 나라" 라고 불러요 — 커다란 빙하도 있고, ' +
             '불을 뿜는 화산도 있거든요. 땅속이 뜨거워서 따뜻한 온천물이 솟아나고, 뜨거운 물을 하늘로 뿜는 간헐천도 있어요.',
      items: [
        { emoji: '🌋', label: '화산',  say: '불을 뿜는 화산이 많은 나라예요.' },
        { emoji: '♨️', label: '온천',  say: '땅속에서 뜨거운 물이 솟아나서 밖에서도 온천을 해요.' },
        { emoji: '🧊', label: '빙하',  say: '산처럼 커다란 얼음 덩어리, 빙하가 있어요.' }
      ]
    },
    {
      id: 'IE', ko: '아일랜드', en: 'Ireland', icon: '🇮🇪', capital: '더블린', capitalEn: 'Dublin',
      img: 'moher.jpg',
      x: 15.5, y: 47,
      hello: { text: 'Dia duit', ko: '디아 귓', lang: 'ga-IE' },
      intro: '영국 옆에 있는 초록 섬나라예요. 비가 자주 와서 들판이 일 년 내내 초록빛이라 "에메랄드 섬" 이라고도 불러요. ' +
             '바다 앞에 깎아지른 모허 절벽이 있어요. ' +
             '세 잎 클로버 "샴록" 이 이 나라의 상징이고, 무지개 끝에 금단지를 숨겨 둔 요정 레프러콘 이야기가 있어요.',
      items: [
        { emoji: '☘️', label: '샴록',       say: '세 잎 클로버 샴록이 상징인 나라예요.' },
        { emoji: '🧝', label: '레프러콘',   say: '무지개 끝에 금단지를 숨겨 둔 요정, 레프러콘 이야기가 있는 나라예요.' },
        { emoji: '👞', label: '아이리시 댄스', say: '팔은 가만히 두고 발만 빠르게 구르는 춤, 아이리시 댄스가 있는 나라예요.' }
      ]
    },
    {
      id: 'GB', ko: '영국', en: 'the United Kingdom', icon: '🇬🇧', capital: '런던', capitalEn: 'London',
      img: 'bigben.jpg',
      x: 27, y: 50,
      hello: { text: 'Hello', ko: '헬로', lang: 'en-GB' },
      intro: '섬나라예요. 잉글랜드·스코틀랜드·웨일스·북아일랜드 네 나라가 모여 한 나라를 이뤄요. ' +
             '수도 런던에는 빨간 이층 버스가 다니고 큰 시계탑 빅 벤이 있어요. 왕이 사는 궁전은 곰털 모자를 쓴 근위병이 지켜요.',
      items: [
        { emoji: '🚌', label: '이층 버스', say: '빨간 이층 버스가 다니는 나라예요.' },
        { emoji: '🕰️', label: '빅 벤',    say: '커다란 시계탑 빅 벤이 있는 나라예요.' },
        { emoji: '💂', label: '근위병',   say: '곰털 모자를 쓴 근위병이 궁전을 지키는 나라예요.' }
      ]
    },
    {
      id: 'PT', ko: '포르투갈', en: 'Portugal', icon: '🇵🇹', capital: '리스본', capitalEn: 'Lisbon',
      img: 'tram.jpg',
      x: 6.5, y: 84,
      hello: { text: 'Olá', ko: '올라', lang: 'pt-PT' },
      intro: '유럽 맨 서쪽 끝, 바다를 바라보는 나라예요. 아주 오래전 이 나라의 배들이 바다 건너 멀리까지 탐험을 떠났어요. ' +
             '리스본에는 노란 전차가 언덕길을 오르내리고, 달콤한 에그타르트가 여기서 태어났어요.',
      items: [
        { emoji: '🚋', label: '노란 전차', say: '노란 전차가 언덕길을 오르내리는 나라예요.' },
        { emoji: '🥧', label: '에그타르트', say: '달콤한 에그타르트 "파스텔 드 나타" 가 태어난 나라예요.' },
        { emoji: '🐓', label: '행운의 수탉', say: '알록달록 수탉 인형이 행운을 가져다준다고 믿는 나라예요.' }
      ]
    },
    {
      id: 'ES', ko: '스페인', en: 'Spain', icon: '🇪🇸', capital: '마드리드', capitalEn: 'Madrid',
      img: 'guell.jpg',
      x: 17, y: 82,
      hello: { text: 'Hola', ko: '올라', lang: 'es-ES' },
      intro: '햇볕이 따뜻한 남쪽 나라예요. 손뼉을 치고 발을 구르며 추는 춤 플라멩코가 있고, ' +
             '커다란 팬에 쌀과 해산물을 넣어 만든 파에야를 먹어요. 여름에는 토마토를 던지며 노는 축제도 열려요. ' +
             '바르셀로나에는 건축가 가우디가 지은 과자집 같은 건물과 알록달록 타일 공원이 있어요.',
      items: [
        { emoji: '💃', label: '플라멩코',   say: '손뼉을 치고 발을 구르며 추는 춤, 플라멩코의 나라예요.' },
        { emoji: '🥘', label: '파에야',     say: '커다란 팬에 쌀과 해산물을 넣어 만든 파에야를 먹는 나라예요.' },
        { emoji: '🍅', label: '토마토 축제', say: '토마토를 던지며 노는 축제 "라 토마티나" 가 열리는 나라예요.' }
      ],
      more: 'country.html?country=spain'
    },
    {
      id: 'FR', ko: '프랑스', en: 'France', icon: '🇫🇷', capital: '파리', capitalEn: 'Paris',
      img: 'eiffel.jpg',
      x: 33, y: 66,
      hello: { text: 'Bonjour', ko: '봉주르', lang: 'fr-FR' },
      intro: '수도 파리에는 철로 만든 높은 탑, 에펠탑이 있어요. 아침에는 바삭한 크루아상과 긴 바게트 빵을 먹어요. ' +
             '그림으로 유명한 나라라서 세계에서 제일 큰 미술관, 루브르도 파리에 있어요.',
      items: [
        { emoji: '🗼', label: '에펠탑',     say: '철로 만든 높은 탑, 에펠탑이 있는 나라예요.' },
        { emoji: '🥐', label: '크루아상',   say: '바삭한 초승달 모양 빵, 크루아상의 나라예요.' },
        { emoji: '🎨', label: '루브르 미술관', say: '세계에서 제일 큰 미술관, 루브르가 있는 나라예요.' }
      ],
      more: 'country.html?country=france'
    },
    {
      id: 'NL', ko: '네덜란드', en: 'the Netherlands', icon: '🇳🇱', capital: '암스테르담', capitalEn: 'Amsterdam',
      img: 'kinderdijk.jpg',
      x: 39.5, y: 53.5,
      hello: { text: 'Hallo', ko: '할로', lang: 'nl-NL' },
      intro: '땅이 아주 평평하고 바다보다 낮은 곳도 많아요. 그래서 옛날부터 풍차로 물을 퍼내 땅을 만들었어요. ' +
             '봄이면 튤립이 들판을 알록달록 물들이고, 사람들은 어디든 자전거를 타고 다녀요. 동그란 치즈도 유명해요.',
      items: [
        { emoji: '🌷', label: '튤립',   say: '봄이면 튤립이 들판을 알록달록 물들이는 나라예요.' },
        { emoji: '🚲', label: '자전거', say: '사람보다 자전거가 더 많은 나라예요.' },
        { emoji: '🧀', label: '치즈',   say: '동그란 바퀴 모양 치즈를 만드는 나라예요.' }
      ]
    },
    {
      id: 'DE', ko: '독일', en: 'Germany', icon: '🇩🇪', capital: '베를린', capitalEn: 'Berlin',
      img: 'neuschwanstein.jpg',
      x: 49.5, y: 56,
      hello: { text: 'Hallo', ko: '할로', lang: 'de-DE' },
      intro: '유럽 한가운데 있는 큰 나라예요. 소시지와 꽈배기 모양 빵 프레첼을 먹고, 자동차를 아주 잘 만들어요. ' +
             '산 위에 있는 하얀 노이슈반슈타인 성은 동화 속 성처럼 예뻐서 디즈니 성의 모델이 됐어요.',
      items: [
        { emoji: '🌭', label: '소시지', say: '소시지 종류가 천 가지도 넘는 나라예요.' },
        { emoji: '🥨', label: '프레첼', say: '꽈배기 모양 빵 프레첼을 먹는 나라예요.' },
        { emoji: '🏰', label: '노이슈반슈타인 성', say: '디즈니 성의 모델이 된 하얀 성, 노이슈반슈타인이 있는 나라예요.' }
      ],
      more: 'country.html?country=germany'
    },
    {
      id: 'DK', ko: '덴마크', en: 'Denmark', icon: '🇩🇰', capital: '코펜하겐', capitalEn: 'Copenhagen',
      img: 'nyhavn.jpg',
      x: 47.5, y: 42.5,
      hello: { text: 'Hej', ko: '하이', lang: 'da-DK' },
      intro: '스웨덴 아래, 바다에 둘러싸인 작은 나라예요. 수도 코펜하겐의 옛 항구에는 알록달록한 집들이 줄지어 서 있어요. ' +
             '"인어공주" 와 "미운 오리 새끼" 를 쓴 동화 작가 안데르센이 이 나라 사람이에요. 알록달록 블록 장난감 레고도 여기서 만들었어요.',
      items: [
        { emoji: '🧜‍♀️', label: '인어공주 동상', say: '바닷가 바위에 앉은 인어공주 동상이 있는 나라예요.' },
        { emoji: '🧱', label: '레고',        say: '블록 장난감 레고를 만든 나라예요.' },
        { emoji: '📖', label: '안데르센 동화', say: '"인어공주" 를 쓴 동화 작가 안데르센의 나라예요.' }
      ]
    },
    {
      id: 'NO', ko: '노르웨이', en: 'Norway', icon: '🇳🇴', capital: '오슬로', capitalEn: 'Oslo',
      img: 'fjord.jpg',
      x: 48, y: 27,
      hello: { text: 'Hei', ko: '하이', lang: 'nb-NO' },
      intro: '높은 산과 바다가 만나는 나라예요. 바닷물이 산 사이로 깊이 들어온 좁고 긴 바다를 피오르라고 해요. ' +
             '겨울이 길어서 스키를 아주 잘 타고, 산에는 트롤이 산다는 옛이야기가 있어요.',
      items: [
        { emoji: '🏞️', label: '피오르', say: '산 사이로 바닷물이 깊이 들어온 피오르가 있는 나라예요.' },
        { emoji: '⛷️', label: '스키',   say: '스키를 세계에서 제일 잘 타는 나라예요.' },
        { emoji: '🧌', label: '트롤',   say: '산속에 트롤이 산다는 옛이야기가 있는 나라예요.' }
      ],
      more: 'country.html?country=norway'
    },
    {
      id: 'SE', ko: '스웨덴', en: 'Sweden', icon: '🇸🇪', capital: '스톡홀름', capitalEn: 'Stockholm',
      img: 'stockholm.jpg',
      x: 58, y: 30,
      hello: { text: 'Hej', ko: '헤이', lang: 'sv-SE' },
      intro: '숲과 호수가 많은 나라예요. 수도 스톡홀름은 열네 개의 섬 위에 세워졌어요. ' +
             '동글동글 미트볼을 먹고, 빨간 나무 말 달라 말이 유명해요. 더 알고 싶으면 스웨덴 카드로 가 보세요!',
      items: [
        { emoji: '🐴', label: '달라 말', say: '빨간 나무 말 달라 말을 만드는 나라예요.' },
        { emoji: '🧆', label: '미트볼', say: '동글동글 미트볼을 링곤베리 잼과 먹는 나라예요.' },
        { emoji: '🧦', label: '삐삐',   say: '힘센 빨간 머리 삐삐 롱스타킹이 태어난 나라예요.' }
      ],
      more: 'country.html?country=sweden'
    },
    {
      id: 'FI', ko: '핀란드', en: 'Finland', icon: '🇫🇮', capital: '헬싱키', capitalEn: 'Helsinki',
      img: 'santa.jpg',
      x: 68, y: 22,
      hello: { text: 'Hei', ko: '헤이', lang: 'fi-FI' },
      intro: '호수가 십팔만 개나 되는 "천 개의 호수의 나라" 예요. 북쪽 로바니에미에는 산타클로스 마을이 있어서 ' +
             '산타 할아버지를 일 년 내내 만날 수 있어요. 뜨거운 방에서 땀을 빼는 사우나도, 하마처럼 생긴 무민도 여기서 태어났어요.',
      items: [
        { emoji: '🎅', label: '산타 마을', say: '산타클로스 마을이 있어서 산타 할아버지를 일 년 내내 만날 수 있는 나라예요.' },
        { emoji: '🧖', label: '사우나',   say: '뜨거운 방에서 땀을 빼는 사우나가 태어난 나라예요.' },
        { emoji: '🦛', label: '무민',     say: '하마처럼 생긴 하얀 무민이 태어난 나라예요.' }
      ]
    },
    {
      id: 'PL', ko: '폴란드', en: 'Poland', icon: '🇵🇱', capital: '바르샤바', capitalEn: 'Warsaw',
      img: 'warsaw.jpg',
      x: 64.5, y: 54,
      hello: { text: 'Cześć', ko: '체시치', lang: 'pl-PL' },
      intro: '독일 오른쪽에 있는 나라예요. 수도 바르샤바의 옛 광장에는 알록달록한 집들이 둘러서 있어요. ' +
             '만두처럼 속을 채운 피에로기를 먹고, 아름다운 피아노곡을 지은 쇼팽이 이 나라 사람이에요. ' +
             '땅속 깊은 소금 광산에는 소금으로 만든 방과 조각이 있어요.',
      items: [
        { emoji: '🥟', label: '피에로기',  say: '만두처럼 속을 채운 피에로기를 먹는 나라예요.' },
        { emoji: '🎹', label: '쇼팽',      say: '피아노곡을 아름답게 지은 쇼팽의 나라예요.' },
        { emoji: '🧂', label: '소금 광산', say: '땅속 소금 광산에 소금으로 만든 방이 있는 나라예요.' }
      ]
    },
    {
      id: 'CZ', ko: '체코', en: 'Czechia', icon: '🇨🇿', capital: '프라하', capitalEn: 'Prague',
      img: 'prague.jpg',
      x: 58, y: 58.5,
      hello: { text: 'Ahoj', ko: '아호이', lang: 'cs-CZ' },
      intro: '수도 프라하는 오래된 성과 다리, 빨간 지붕이 가득한 동화 같은 도시예요. 광장에 있는 육백 년 된 천문시계는 ' +
             '시간마다 인형이 나와 인사해요. 줄로 움직이는 인형극 마리오네트가 유명해요.',
      items: [
        { emoji: '⏰', label: '천문시계', say: '시간마다 인형이 나와 인사하는 육백 년 된 천문시계가 있는 나라예요.' },
        { emoji: '🎭', label: '마리오네트', say: '줄로 움직이는 인형극 마리오네트가 유명한 나라예요.' },
        { emoji: '🌉', label: '카를교',   say: '강 위에 조각상이 늘어선 오래된 돌다리, 카를교가 있는 나라예요.' }
      ]
    },
    {
      id: 'AT', ko: '오스트리아', en: 'Austria', icon: '🇦🇹', capital: '빈', capitalEn: 'Vienna',
      img: 'riesenrad.jpg',
      x: 59.5, y: 67.5,
      hello: { text: 'Grüß Gott', ko: '그뤼스 곳', lang: 'de-AT' },
      intro: '알프스 산이 있는 나라예요. 어릴 때부터 피아노를 치고 곡을 지은 음악가 모차르트가 이 나라 사람이에요. ' +
             '수도 빈에서는 빙글빙글 도는 춤 왈츠가 태어났고, 초콜릿 케이크 자허토르테도 빈에서 왔어요.',
      items: [
        { emoji: '🎼', label: '모차르트',  say: '어릴 때부터 곡을 지은 음악가 모차르트의 나라예요.' },
        { emoji: '🍰', label: '자허토르테', say: '초콜릿 케이크 자허토르테가 태어난 나라예요.' },
        { emoji: '🎡', label: '대관람차',  say: '백 년도 더 된 커다란 대관람차가 수도에 있는 나라예요.' }
      ]
    },
    {
      id: 'CH', ko: '스위스', en: 'Switzerland', icon: '🇨🇭', capital: '베른', capitalEn: 'Bern',
      img: 'matterhorn.jpg',
      x: 43.5, y: 69,
      hello: { text: 'Grüezi', ko: '그뤼에치', lang: 'de-CH' },
      intro: '높은 알프스 산이 나라의 절반이 넘어요. 뾰족한 삼각형 산 마터호른이 제일 유명해요. 산에서 키운 젖소의 우유로 부드러운 초콜릿을 만들고, ' +
             '작은 톱니바퀴를 아주 정확하게 맞추는 시계가 유명해요. 알프스 소녀 하이디 이야기가 이 나라에서 나왔어요.',
      items: [
        { emoji: '🏔️', label: '알프스', say: '높은 알프스 산이 나라의 절반이 넘는 나라예요.' },
        { emoji: '🍫', label: '초콜릿', say: '부드러운 초콜릿을 제일 잘 만드는 나라예요.' },
        { emoji: '⌚', label: '시계',   say: '작은 톱니바퀴를 정확하게 맞춘 시계가 유명한 나라예요.' }
      ]
    },
    {
      id: 'IT', ko: '이탈리아', en: 'Italy', icon: '🇮🇹', capital: '로마', capitalEn: 'Rome',
      img: 'colosseum.jpg',
      x: 54, y: 79,
      hello: { text: 'Ciao', ko: '차오', lang: 'it-IT' },
      intro: '장화처럼 생긴 나라예요. 피자와 파스타, 젤라토가 모두 여기서 왔어요. 수도 로마에는 이천 년 된 커다란 경기장 ' +
             '콜로세움이 있고, 피사에는 기울어진 탑이, 베네치아에는 길 대신 물길이 있어서 곤돌라 배를 타고 다녀요.',
      items: [
        { emoji: '🍕', label: '피자',    say: '피자가 태어난 나라예요.' },
        { emoji: '🏟️', label: '콜로세움', say: '이천 년 된 커다란 경기장 콜로세움이 있는 나라예요.' },
        { emoji: '🛶', label: '곤돌라',  say: '길 대신 물길로 곤돌라 배를 타고 다니는 도시가 있는 나라예요.' }
      ]
    },
    {
      id: 'GR', ko: '그리스', en: 'Greece', icon: '🇬🇷', capital: '아테네', capitalEn: 'Athens',
      img: 'parthenon.jpg',
      x: 77, y: 87,
      hello: { text: 'Γεια σου', ko: '야 수', lang: 'el-GR' },
      intro: '유럽 남쪽 끝, 파란 바다에 섬이 많은 나라예요. 아주 옛날 사람들이 지은 돌기둥 신전 파르테논이 아테네 언덕 위에 있어요. ' +
             '올림픽이 처음 열린 곳이고, 제우스·헤라클레스 같은 신화 이야기가 여기서 나왔어요.',
      items: [
        { emoji: '🏛️', label: '파르테논 신전', say: '돌기둥이 늘어선 파르테논 신전이 있는 나라예요.' },
        { emoji: '🏅', label: '올림픽',      say: '올림픽이 맨 처음 열린 나라예요.' },
        { emoji: '🫒', label: '올리브',      say: '올리브 나무가 많아서 올리브 열매와 기름을 먹는 나라예요.' }
      ],
      more: 'country.html?country=greece'
    }
  ];

  var ACTS = [
    { id: 'look',   name: '구경하기',     icon: '🔎', desc: '나라를 누르면 다니가 날아가고 그 나라 이야기를 들려줘요' },
    { id: 'listen', name: '찾아가기',     icon: '👂', desc: '들려주는 나라로 날아가요' },
    { id: 'find',   name: '무엇이 있을까', icon: '🗼', desc: '에펠탑은 어느 나라에 있을까요? 지도에서 찾아요' },
    { id: 'flag',   name: '국기 찾기',    icon: '🏁', desc: '국기를 보고 어느 나라인지 찾아요' }
  ];

  var BEST_KEY = 'daniland.best.europe';     // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.europeAct';        // 마지막에 고른 놀이
  var MAP = window.EUROPE_MAP;
  var MAP_RATIO = MAP.w / MAP.h;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // 땅 색 (css 의 .eu-land.c0 ~ c5) — 이웃한 나라끼리 같은 색이 안 되게 손으로 맞춘 것입니다 (독일·체코, 스위스·오스트리아 …)
  var SHADE = { IS: 0, IE: 1, GB: 2, PT: 3, ES: 4, FR: 5, NL: 0, DE: 1, DK: 2, NO: 3, SE: 4, FI: 5,
                PL: 0, CZ: 2, AT: 0, CH: 3, IT: 4, GR: 5 };

  var el = {
    stage: document.getElementById('stage'),
    map: document.getElementById('map'),
    svg: document.getElementById('svg'),
    pins: document.getElementById('pins'),
    dani: document.getElementById('dani'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    banner: document.getElementById('banner'),
    questItem: document.getElementById('questItem'),
    questLabel: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

    panel: document.getElementById('panel'),
    panelArt: document.getElementById('panelArt'),
    panelTitle: document.getElementById('panelTitle'),
    panelSub: document.getElementById('panelSub'),
    panelText: document.getElementById('panelText'),
    panelChips: document.getElementById('panelChips'),

    startOverlay: document.getElementById('startOverlay'),
    modeRow: document.getElementById('modeRow'),
    modeDesc: document.getElementById('modeDesc'),
    startBtn: document.getElementById('startBtn'),
    startHome: document.getElementById('startHome'),

    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endStars: document.getElementById('endStars'),
    endText: document.getElementById('endText'),
    againBtn: document.getElementById('againBtn'),
    endModes: document.getElementById('endModes'),
    endHome: document.getElementById('endHome')
  };

  // 다니는 우리나라에서 날아와 지도 오른쪽 끝(흑해 위쯤)에서 출발합니다 — 한국은 이 지도 밖이라서요.
  var START = { x: 94, y: 62 };

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    round: 0,
    stars: 0,
    target: null,
    item: null,
    prompt: '',
    firstTry: true,
    locked: false,
    deck: [],                          // 이번 판에 아직 안 나온 나라들
    at: null,                          // 다니가 지금 있는 나라 (출발 자리면 null)
    pos: { x: START.x, y: START.y },
    visited: {},                       // 구경하기에서 눌러 본 나라
    country: null                      // 이야기 판에 나와 있는 나라 (🔊 다시 가 이것을 읽습니다)
  };

  if (!findAct(state.act)) state.act = 'look';

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildMap();
  buildModeRow();
  placeDani(START.x, START.y);
  fitMap();

  el.startBtn.addEventListener('click', function () {
    if (window.TTS) TTS.unlock();
    if (window.SFX) SFX.unlock();
    el.startOverlay.hidden = true;
    startGame();
  });

  el.againBtn.addEventListener('click', function () {
    el.endOverlay.hidden = true;
    startGame();
  });

  el.speakBtn.addEventListener('click', speakPrompt);

  el.voiceBtn.addEventListener('click', function () {
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '프랑스로 날아가요!'; } });
  });

  // 맨 위 ← 는 방금 지나온 과목 페이지로, 결과 화면의 🏠 만 홈으로 갑니다.
  bindGo(el.backBtn, Catalog.backHref('europe.html'));
  bindGo(el.endHome, 'index.html');
  bindGo(el.startHome, Catalog.backHref('europe.html'));
  bindGo(el.endModes, Catalog.backHref('europe.html'));

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
  }

  function findCountry(id) {
    for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].id === id) return COUNTRIES[i];
    return null;
  }

  function findAct(id) {
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i];
    return null;
  }

  /* ---------- 시작 화면 ---------- */

  function buildModeRow() {
    el.modeRow.innerHTML = '';

    ACTS.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (a.id === state.act ? ' on' : '');
      b.innerHTML = '<span class="mi">' + a.icon + '</span>' +
                    '<span class="mn">' + a.name + '</span>' +
                    '<span class="mb">' + bestText(a.id) + '</span>';

      b.addEventListener('click', function () {
        state.act = a.id;
        UI.saveValue(ACT_KEY, a.id);
        Array.prototype.forEach.call(el.modeRow.children, function (x) {
          x.classList.toggle('on', x === b);
        });
        showAct();
      });

      el.modeRow.appendChild(b);
    });

    showAct();
  }

  // 놀이마다 최고 기록을 단추 아래에 작게 보여 줍니다. (구경하기는 점수가 없습니다)
  function bestText(act) {
    if (act === 'look') return '';
    var best = UI.readBest('daniland.best.europe.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 지도 그리기 ----------
   * svg 에 땅을 그립니다 — 놀이에 안 나오는 땅(other)은 회색으로 먼저, 나라(land)는 색을 입혀 그 위에.
   * 나라 땅과 국기 핀은 둘 다 단추이고 같은 choose() 를 부릅니다. */
  function buildMap() {
    el.svg.setAttribute('viewBox', '0 0 ' + MAP.w + ' ' + MAP.h);

    MAP.other.forEach(function (d) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', 'eu-other');
      el.svg.appendChild(p);
    });

    COUNTRIES.forEach(function (c) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', MAP.land[c.id] || '');
      p.setAttribute('class', 'eu-land c' + (SHADE[c.id] || 0));
      p.addEventListener('click', function () { choose(c); });
      c.path = p;
      el.svg.appendChild(p);

      var b = document.createElement('button');
      b.className = 'eu-pin';
      b.style.left = c.x + '%';
      b.style.top = c.y + '%';
      b.innerHTML = '<span class="flag">' + c.icon + '</span><span class="name">' + c.ko + '</span>';
      b.addEventListener('click', function () { choose(c); });
      c.el = b;
      el.pins.appendChild(b);
    });
  }

  function clearSpots() {
    COUNTRIES.forEach(function (c) {
      c.el.className = 'eu-pin';
      c.path.setAttribute('class', c.path.getAttribute('class').replace(/ (correct|wrong|dim|seen|here)/g, ''));
      var mark = c.el.querySelector('.mark');
      if (mark) mark.remove();
    });
  }

  function setSpot(c, cls) {
    c.el.classList.add(cls);
    c.path.classList.add(cls);
  }

  /* 지도를 그림 비율 그대로, 남는 자리 안에 제일 크게 넣습니다. (스크롤이 생기면 안 됩니다)
   * 가로가 넉넉하면(wide) 이야기 판이 지도 오른쪽에 서고, 아니면 지도 아래에 눕습니다.
   * 핀·비행기 크기는 지도 글자 크기를 따라가므로 여기서 같이 정합니다. */
  function fitMap() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var screenW = document.documentElement.clientWidth || window.innerWidth;

    var wide = screenW >= 900 && screenW > screenH;
    el.stage.classList.toggle('wide', wide);

    var top = el.stage.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;
    var availH = screenH - top - toolsH - bottomPad - 6;

    var stageStyle = getComputedStyle(el.stage);
    var availW = el.stage.clientWidth - px(stageStyle.paddingLeft) - px(stageStyle.paddingRight);
    var gap = px(stageStyle.gap) || 12;

    var w;
    if (wide) {
      // 판이 옆에 서니 지도는 높이에 맞추고, 판은 남는 폭을 다 씁니다 (최소 300px 은 남겨 둡니다)
      w = Math.min(availW - 300 - gap, availH * MAP_RATIO);
      el.panel.style.height = Math.round(w / MAP_RATIO) + 'px';
    } else {
      // 판이 아래에 누우니 판 높이를 먼저 떼어 두고 지도는 남는 높이에 맞춥니다.
      // 판 높이는 글 길이와 상관없이 고정입니다 — 안 그러면 나라를 누를 때마다 지도가 들썩입니다 (글이 길면 판 안에서 넘깁니다).
      // 화면 높이의 25%(최대 250px — 사진·글 넉 줄·칩 한 줄이 들어가는 높이)가 기본인데,
      // 폰처럼 지도가 폭에 막혀 아래가 남으면 그 남는 높이를 판이 씁니다 (최대 260px).
      var leftover = availH - availW / MAP_RATIO - gap;
      var panelH = Math.round(Math.max(Math.min(250, screenH * 0.25), Math.min(260, leftover), 120));
      el.panel.style.height = panelH + 'px';
      w = Math.min(availW, (availH - panelH - gap) * MAP_RATIO);
    }
    w = Math.max(240, w);

    el.map.style.width = w + 'px';
    el.map.style.height = Math.round(w / MAP_RATIO) + 'px';
    el.map.style.fontSize = Math.round(w / 20) + 'px';
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitMap);
  window.addEventListener('orientationchange', function () { setTimeout(fitMap, 200); });

  /* ---------- 다니가 비행기를 타고 날아가기 (세계 지도와 같습니다) ---------- */

  // 다니는 핀 바로 위에 섭니다 — 핀 한가운데 내리면 국기와 이름을 가립니다 (핀 반지름이 지도 높이의 4% 쯤)
  function placeDani(x, y) {
    state.pos.x = x;
    state.pos.y = y;
    el.dani.style.left = x + '%';
    el.dani.style.top = (y - 4) + '%';
  }

  function flyTo(country, done) {
    if (country === state.at) {
      if (done) done();
      return;
    }

    var dur = flyTime(country);
    el.dani.classList.toggle('back', country.x < state.pos.x);
    el.dani.classList.add('flying');
    el.dani.style.transitionDuration = dur + 'ms';
    placeDani(country.x, country.y);

    setTimeout(function () {
      el.dani.classList.remove('flying');
      state.at = country;
      if (done) done();
    }, dur);
  }

  function flyTime(country) {
    if (country === state.at) return 0;
    var dx = country.x - state.pos.x;
    var dy = country.y - state.pos.y;
    return Math.max(500, Math.round(Math.sqrt(dx * dx + dy * dy) * 14));
  }

  /* ---------- 이야기 판 ---------- */

  // art 는 이모지, img 는 (있으면) 사진 파일 이름 — 사진을 못 읽으면 이모지로 돌아갑니다.
  function showPanel(art, title, sub, text, img) {
    el.panelArt.innerHTML = '';
    el.panelArt.appendChild(artEl(art, img));
    el.panel.classList.toggle('with-photo', !!img);
    el.panelTitle.textContent = title || '';
    el.panelSub.textContent = sub || '';
    el.panelSub.hidden = !sub;
    el.panelText.textContent = text || '';
    el.panelChips.innerHTML = '';
    el.panelChips.hidden = true;
    el.panel.scrollTop = 0;
    el.panel.classList.remove('pop');
    void el.panel.offsetWidth;
    el.panel.classList.add('pop');
  }

  function artEl(emoji, img) {
    if (!img) return document.createTextNode(emoji || '');
    var im = document.createElement('img');
    im.src = 'europe/' + img;
    im.alt = '';
    im.onerror = function () {
      im.replaceWith(document.createTextNode(emoji || ''));
      el.panel.classList.remove('with-photo');
    };
    im.addEventListener('click', function () { zoomPhoto(im.src); });
    return im;
  }

  // 사진을 누르면 화면 가득 크게 — 판의 사진이 작아서요. 아무 데나 누르면 닫힙니다. (스웨덴과 같은 .photo-zoom)
  function zoomPhoto(src) {
    var box = document.createElement('div');
    box.className = 'photo-zoom';
    var big = document.createElement('img');
    big.src = src;
    big.alt = '';
    box.appendChild(big);
    box.addEventListener('click', function () { box.remove(); });
    document.body.appendChild(box);
  }

  // 나라 하나를 판에 통째로 — 사진(없으면 국기)·이름·수도·이야기, 그리고 누르면 읽어 주는 볼거리 칩과 인사 칩
  function showCountry(c, withChips) {
    showPanel(c.icon, c.icon + ' ' + c.ko + ' · ' + c.en, '수도 ' + c.capital + ' · ' + c.capitalEn, c.intro, c.img);
    if (!withChips) return;

    c.items.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'eu-chip';
      b.innerHTML = '<span class="ce">' + it.emoji + '</span>' + it.label;
      b.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        state.prompt = it.say;
        speak(it.say);
      });
      el.panelChips.appendChild(b);
    });

    if (c.hello) {
      var h = document.createElement('button');
      h.className = 'eu-chip hello';
      h.innerHTML = '<span class="ce">👋</span>' + c.hello.text + ' · ' + c.hello.ko;
      h.addEventListener('click', function () {
        if (window.SFX) SFX.tap();
        var line = c.ko + ' 말로 안녕은 "' + c.hello.ko + '" 예요.';
        state.prompt = line;
        speak(line, function () { speakNative(c.hello.text, c.hello.lang); });
      });
      el.panelChips.appendChild(h);
    }

    if (c.more) {
      var m = document.createElement('a');
      m.className = 'eu-chip more';
      m.href = c.more;
      m.innerHTML = '<span class="ce">📖</span>' + c.ko + ' 더 알아보기 →';
      m.addEventListener('click', function () { if (window.TTS) TTS.cancel(); });
      el.panelChips.appendChild(m);
    }

    el.panelChips.hidden = false;
  }

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    clearSpots();
    // 국기 찾기에서는 핀의 국기를 가립니다 — 보이면 같은 그림 찾기가 되어 버립니다 (css 의 .eu-map.hide-flags)
    el.map.classList.toggle('hide-flags', state.act === 'flag');
    state.round = 0;
    state.stars = 0;
    state.visited = {};
    state.locked = false;
    state.target = null;
    state.item = null;
    state.deck = [];
    state.country = null;

    if (state.act === 'look') {
      el.bar.style.width = '0%';
      el.score.textContent = '🔎 0/' + COUNTRIES.length;
      el.questItem.hidden = true;
      el.questLabel.textContent = '나라를 눌러 보세요';
      showPanel('🇪🇺', '유럽', 'Europe', '나라가 오십 개 가까이 모여 있는 대륙이에요. 다니가 우리나라에서 날아왔어요 — ' +
                '국기를 누르면 그 나라로 날아가서 이야기를 들려줘요.');
      state.prompt = '여기는 유럽이에요. 국기를 누르면 그 나라로 날아가요.';
      el.speakBtn.hidden = !(window.TTS && TTS.supported);
      setTimeout(speakPrompt, 400);
      return;
    }

    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();

    clearSpots();
    state.firstTry = true;
    state.locked = false;

    var next = pickTarget();
    state.target = next;
    state.item = (state.act === 'find') ? pickItem(next) : null;
    var n = '(' + (state.round + 1) + '/' + ROUNDS + ')';

    if (state.act === 'find') {
      state.prompt = state.item.say + ' 어느 나라일까요?';
      el.questItem.hidden = false;
      el.questItem.textContent = state.item.emoji;
      el.questLabel.textContent = state.item.label + ' — 어느 나라일까요? ' + n;
      showPanel(state.item.emoji, state.item.label, '', state.item.say + ' 지도에서 그 나라를 찾아 보세요.');
    } else if (state.act === 'flag') {
      state.prompt = '이 국기는 어느 나라 것일까요?';
      el.questItem.hidden = false;
      el.questItem.textContent = next.icon;
      el.questLabel.textContent = '이 국기는 어느 나라 것일까요? ' + n;
      showPanel(next.icon, '어느 나라 국기일까요?', '', '지도에서 그 나라를 찾아 보세요.');
    } else {
      state.prompt = next.ko + '로 날아가요!';
      el.questItem.hidden = true;
      el.questLabel.textContent = '어디라고 했을까요? ' + n;
      showPanel('✈️', '어디로 갈까요?', '', '들려주는 나라를 지도에서 찾아 보세요.');
    }

    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    el.bar.style.width = Math.round((state.round / ROUNDS) * 100) + '%';
    setTimeout(speakPrompt, 400);
  }

  /* 열여덟 나라를 섞어 놓고 한 장씩 꺼내 씁니다 — 한 판(10문제)에 같은 나라가 두 번 나오지 않습니다. */
  function pickTarget() {
    if (!state.deck.length) {
      state.deck = UI.shuffle(COUNTRIES.slice());
      if (state.target && state.deck[0].id === state.target.id) {
        state.deck.push(state.deck.shift());
      }
    }
    return state.deck.shift();
  }

  /* 볼거리도 나라마다 섞어 놓고 차례로 씁니다 — 셋을 다 쓰기 전에는 같은 것이 다시 안 나옵니다. */
  function pickItem(country) {
    if (!country.bag || !country.bag.length) country.bag = UI.shuffle(country.items.slice());
    return country.bag.shift();
  }

  /* ---------- 눌렀을 때 ---------- */

  function choose(country) {
    if (state.locked || country.el.classList.contains('dim')) return;

    if (state.act === 'look') return look(country);

    if (country.id === state.target.id) {
      state.locked = true;
      if (window.SFX) SFX.correct();
      setSpot(country, 'correct');
      UI.addMark(country.el, '⭕');
      UI.confettiAt(country.el);

      if (state.firstTry) { state.stars += 1; updateScore(); }

      // 맞히는 즉시 막대를 채웁니다. (마지막 문제에서 다 찬 모습을 볼 수 있게)
      el.bar.style.width = Math.round(((state.round + 1) / ROUNDS) * 100) + '%';

      el.questItem.hidden = false;
      el.questItem.textContent = country.icon;
      el.questLabel.textContent = country.ko + ' · ' + country.en + ' · 수도 ' + country.capital;
      el.speakBtn.hidden = true;
      showCountry(country, false);

      var fly = flyTime(country);
      var line = country.ko + '에 왔어요! 수도는 ' + country.capital + '이에요.';
      state.prompt = line;
      flyTo(country, function () { speak(line); });

      setTimeout(function () {
        state.round += 1;
        nextRound();
      }, fly + 2800);

    } else {
      state.firstTry = false;
      if (window.SFX) SFX.wrong();
      setSpot(country, 'wrong');
      var why = '거기는 ' + country.ko + '이에요.';
      el.panelText.textContent = why + ' 다시 찾아 봐요.';
      setTimeout(function () {
        country.el.classList.remove('wrong');
        country.path.classList.remove('wrong');
        setSpot(country, 'dim');
        UI.addMark(country.el, '❌');
      }, 400);
      speak(why, function () { setTimeout(speakPrompt, 200); });
    }
  }

  // 🔎 유럽 구경하기 — 틀릴 것이 없습니다. 누른 나라로 날아가서 이야기를 들려줍니다.
  function look(country) {
    state.locked = true;
    if (window.SFX) SFX.tap();
    COUNTRIES.forEach(function (c) { c.el.classList.remove('here'); c.path.classList.remove('here'); });
    setSpot(country, 'here');

    el.questItem.hidden = false;
    el.questItem.textContent = country.icon;
    el.questLabel.textContent = country.ko + ' · ' + country.en + ' · 수도 ' + country.capital;
    state.country = country;
    showCountry(country, true);
    el.speakBtn.hidden = !(window.TTS && TTS.supported);

    flyTo(country, function () {
      state.locked = false;
      readCountry(country);
    });

    if (!state.visited[country.id]) {
      state.visited[country.id] = true;
      setSpot(country, 'seen');
      var n = countVisited();
      el.score.textContent = '🔎 ' + n + '/' + COUNTRIES.length;
      el.bar.style.width = Math.round((n / COUNTRIES.length) * 100) + '%';

      if (n === COUNTRIES.length) {
        if (window.SFX) SFX.finish();
        showBanner('유럽을 다 구경했어요! 🎉');
      }
    }
  }

  function readCountry(c) {
    var text = c.ko + '이에요. 수도는 ' + c.capital + '이에요. ' + c.intro;
    state.prompt = text;
    speak(text);
  }

  function countVisited() {
    var n = 0;
    for (var k in state.visited) if (state.visited.hasOwnProperty(k)) n++;
    return n;
  }

  function finish() {
    el.bar.style.width = '100%';
    UI.saveBest('daniland.best.europe.' + state.act, state.stars, ROUNDS);
    UI.saveBest(BEST_KEY, state.stars, ROUNDS);

    el.endStars.textContent = UI.starLine(state.stars, ROUNDS);
    el.endTitle.textContent = (state.stars === ROUNDS)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = ROUNDS + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 소리 · 화면 ---------- */

  function updateScore() {
    el.score.textContent = '⭐ ' + state.stars;
  }

  function speakPrompt() { speak(state.prompt); }

  // speak() 를 부를 때마다 하나씩 올라갑니다. 새 말이 시작되면 먼저 하던 말은 끊기는데(TTS 가 cancel),
  // 그때 먼저 말의 then 까지 불러 버리면 끊긴 말이 이어서 또 나옵니다 — 그래서 최신 것만 then 을 부릅니다.
  var speakSeq = 0;

  // 다 읽으면 then 을 부릅니다. 소리를 못 내는 기기에서도 흐름이 끊기지 않게
  // 읽는 데 걸릴 만한 시간 뒤에는 꼭 한 번 부릅니다.
  function speak(text, then, lang) {
    var seq = ++speakSeq;
    var called = false;
    function once() {
      if (called) return;
      called = true;
      if (seq !== speakSeq) return;
      el.speakBtn.classList.remove('speaking');
      if (then) then();
    }

    if (!text || !window.TTS || !TTS.supported) {
      setTimeout(once, 600);
      return;
    }

    el.speakBtn.classList.add('speaking');
    TTS.speak(text, lang || LANG, { onend: once });
    setTimeout(once, 1000 + text.length * 200);
  }

  // 그 나라 말은 그 목소리가 있는 기기에서만 읽어 줍니다 (없으면 조용히 건너뜁니다).
  function speakNative(text, lang) {
    if (!text || !lang || !window.TTS || !TTS.supported || !TTS.voicesFor(lang).length) return;
    speak(text, null, lang);
  }

  var bannerTimer = null;

  function showBanner(text) {
    el.banner.textContent = text;
    el.banner.hidden = false;
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.banner.hidden = true; }, 1800);
  }
})();
