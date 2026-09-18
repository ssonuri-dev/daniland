/* =========================================================================
 * 다니랜드 - 스웨덴 (세계: 나라 한 곳을 깊이 알아보기)
 *
 * 세계 지도(world.js)가 나라 열두 곳을 얕게 훑는 것이라면, 이 화면은 스웨덴 한 나라만
 * 깊이 봅니다. 나라마다 페이지를 늘리는 대신 FACTS 와 QUIZ 를 바꿔 다른 나라도 같은 얼개로
 * 만들 수 있게 해 두었습니다 (그림 파일이 없고 전부 이모지·글입니다).
 *
 * 놀이 3가지 (시작 화면에서 고릅니다)
 *   look : 알아보기     - 카드를 누르면 그 이야기를 읽어 줍니다 (점수 없음, 다 보면 끝)
 *   find : 무엇이 있을까 - 넉 장 중 스웨덴에 있는 것을 고릅니다 (다른 나라 것 셋이 섞입니다)
 *   quiz : 퀴즈         - 알아보기에서 배운 것을 물어봅니다 (보기 넉 개)
 *
 * 읽어 주는 말은 우리말(ko-KR)입니다. 스웨덴 말(sv)이 붙은 카드는 우리말 뒤에 스웨덴 말로도
 * 한 번 읽어 주는데, 기기에 스웨덴어 목소리가 없으면 조용히 건너뜁니다 — 우리말 안에 이미
 * '스베리예' 처럼 읽는 법이 들어 있어서 못 들어도 배우는 데 지장이 없습니다.
 *
 * 내용은 6~7살 수준으로 골랐지만 사실은 정확하게 적었습니다 — 쉽게 한다고 틀리게 적지 마세요.
 * ========================================================================= */

(function () {
  var ROUNDS = 10;
  var LANG = 'ko-KR';
  var SV = 'sv-SE';
  var PRAISE = ['참 잘했어요!', '멋져요!', '최고예요!', '대단해요!', '와, 다 맞혔어요!'];

  /* -------------------------------------------------------------------------
   * 알아보기 카드 — 한 장이 이야기 하나입니다.
   *   emoji / label : 카드에 보이는 그림과 짧은 이름
   *   title / text  : 누르면 위 판에 나오고 읽어 주는 제목과 이야기 (우리말)
   *   sv / svKo     : (없어도 됩니다) 스웨덴 말과 읽는 법 — 우리말 뒤에 붙여 읽어 줍니다
   *   find          : (없어도 됩니다) '무엇이 있을까' 에 보기로 나올 때의 이름
   *   img           : (없어도 됩니다) 위 판에 크게 보여 줄 사진 — sweden/ 폴더의 파일 이름.
   *                   파일이 없으면 emoji 로 대신 그리므로 사진이 오기 전에도 돌아갑니다 (artEl).
   *                   사진의 출처는 sweden/CREDITS.md 에 적습니다.
   * ---------------------------------------------------------------------- */
  var FACTS = [
    { id: 'flag', emoji: '🇸🇪', label: '국기', title: '스웨덴 국기',
      sv: 'Sverige', svKo: '스베리예',
      text: '파란 바탕에 노란 십자가예요. 파랑은 하늘과 호수, 노랑은 해를 뜻한다고 해요. ' +
            '이웃 나라 노르웨이·덴마크·핀란드 국기에도 십자가가 있어요. ' +
            '스웨덴 사람들은 자기 나라를 "스베리예" 라고 불러요.' },

    { id: 'where', emoji: '🧭', label: '어디일까', title: '유럽의 북쪽 끝',
      text: '스웨덴은 유럽의 북쪽, 스칸디나비아반도에 있어요. 왼쪽 이웃은 노르웨이, ' +
            '위쪽 이웃은 핀란드예요. 덴마크와는 바다 위 긴 다리로 이어져 있어요. ' +
            '우리나라에서는 비행기를 타고 열 시간 넘게 가야 해요.' },

    { id: 'stockholm', emoji: '🏰', label: '수도', title: '수도 스톡홀름',
      sv: 'Stockholm', svKo: '스톡홀름',
      text: '스톡홀름은 열네 개의 섬 위에 세워진 도시예요. 그래서 어디서나 물이 보이고, ' +
            '섬과 섬은 다리 쉰 개가 넘게 이어 줘요. 왕이 사는 궁전도 여기 있어요.' },

    { id: 'royal', emoji: '👑', label: '왕과 공주', title: '왕이 있는 나라',
      text: '스웨덴에는 왕이 있어요. 지금 왕은 칼 16세 구스타프예요. ' +
            '다음 왕이 될 사람은 왕의 딸 빅토리아 공주이고, ' +
            '그다음은 빅토리아 공주의 딸 에스텔 공주예요.' },

    { id: 'winter', emoji: '❄️', label: '긴 겨울', title: '길고 하얀 겨울', find: '눈 오는 긴 겨울',
      text: '북쪽에 있어서 겨울이 길고 눈이 많이 와요. 한겨울에는 해가 아주 잠깐만 떠요. ' +
            '제일 북쪽에서는 겨울에 해가 아예 안 뜨는 날도 있고, ' +
            '여름에는 밤에도 해가 안 지는 "백야" 가 돼요.' },

    { id: 'aurora', emoji: '🌌', label: '오로라', title: '겨울밤의 오로라', find: '오로라',
      text: '스웨덴 북쪽 하늘에서는 겨울밤에 초록빛·보랏빛 커튼 같은 오로라가 춤춰요. ' +
            '아비스코라는 마을은 오로라를 보러 세계에서 사람들이 찾아오는 곳이에요.' },

    { id: 'reindeer', emoji: '🦌', label: '순록', title: '순록과 사미 사람들', find: '순록',
      text: '스웨덴 북쪽 라플란드에는 순록이 살아요. 오래전부터 그곳에 살아온 사미 사람들이 ' +
            '순록을 키우며 함께 다녀요. 숲에는 커다란 사슴인 무스도 살아요.' },

    { id: 'forest', emoji: '🌲', label: '숲과 호수', title: '숲과 호수의 나라',
      text: '스웨덴은 땅의 3분의 2가 숲이에요. 호수는 십만 개 가까이 돼요. ' +
            '누구나 숲에 들어가 블루베리와 링곤베리를 따도 돼요 — "모두의 권리" 라는 법이에요.' },

    { id: 'pippi', emoji: '🧦', label: '삐삐', title: '삐삐 롱스타킹', find: '삐삐 롱스타킹',
      sv: 'Pippi Långstrump', svKo: '피피 롱스트룸프',
      text: '힘이 아주 센 빨간 머리 삐삐는 스웨덴 작가 아스트리드 린드그렌이 만들었어요. ' +
            '삐삐는 말을 번쩍 들어 올리고, 원숭이 닐슨 씨와 함께 살아요.' },

    { id: 'dala', emoji: '🐴', label: '달라 말', title: '빨간 나무 말, 달라 말', find: '달라 말',
      sv: 'Dalahäst', svKo: '달라헤스트',
      text: '빨간 나무 말에 알록달록 꽃무늬를 그린 장난감이에요. 달라르나 지방에서 ' +
            '오래전부터 만들어서 "달라 말" 이라고 해요. 스웨덴을 대표하는 물건이에요.' },

    { id: 'meatball', emoji: '🧆', label: '미트볼', title: '스웨덴 미트볼', find: '미트볼',
      sv: 'köttbullar', svKo: '셰트불라르',
      text: '스웨덴 사람들이 좋아하는 음식은 동글동글 미트볼이에요. ' +
            '으깬 감자, 새콤한 링곤베리 잼과 같이 먹어요.' },

    { id: 'fika', emoji: '☕', label: '피카', title: '피카 — 쉬는 시간', find: '피카',
      sv: 'fika', svKo: '피카',
      text: '스웨덴 사람들은 하루에 한두 번 하던 일을 멈추고 다 같이 차와 빵을 먹으며 쉬어요. ' +
            '이 시간을 "피카" 라고 해요. 피카에 제일 많이 먹는 건 달콤한 시나몬롤 "카넬불레" 예요.' },

    { id: 'candy', emoji: '🍬', label: '토요일 사탕', title: '토요일에만 사탕', find: '토요일 사탕',
      sv: 'lördagsgodis', svKo: '뢰르닥스구디스',
      text: '스웨덴 아이들은 토요일에만 사탕을 먹는 풍습이 있어요. "토요일 사탕" 이라는 뜻의 ' +
            '뢰르닥스구디스예요. 토요일이 되면 가게에서 좋아하는 사탕을 봉지에 골라 담아요.' },

    { id: 'nobel', emoji: '🏅', label: '노벨상', title: '노벨상', find: '노벨상',
      text: '세계에서 가장 유명한 상인 노벨상은 스웨덴 사람 알프레드 노벨이 만들었어요. ' +
            '해마다 12월 10일 스톡홀름에서 상을 줘요. 평화상만 이웃 나라 노르웨이에서 줘요.' },

    { id: 'lucia', emoji: '🕯️', label: '루시아', title: '루시아 축제', find: '루시아 축제',
      text: '12월 13일에는 하얀 옷을 입고 머리에 촛불 관을 쓴 "루시아" 가 앞장서고, ' +
            '아이들이 노래하며 줄지어 걸어요. 어두운 겨울에 빛을 가져다준다는 뜻이에요.' },

    { id: 'midsommar', emoji: '💐', label: '미드솜마르', title: '한여름 축제 미드솜마르', find: '미드솜마르',
      sv: 'midsommar', svKo: '미드솜마르',
      text: '6월, 해가 제일 긴 날 즈음에 하는 한여름 축제예요. 꽃과 잎으로 꾸민 기둥을 세우고 ' +
            '그 둘레에서 노래하며 춤춰요. 머리에는 꽃으로 만든 관을 쓰고, ' +
            '"작은 개구리" 노래에 맞춰 개구리처럼 폴짝폴짝 뛰어요.' },

    { id: 'viking', emoji: '⛵', label: '바이킹', title: '바이킹', find: '바이킹',
      text: '천 년쯤 전 스웨덴을 비롯한 북유럽에는 바이킹이 살았어요. 길고 날렵한 배를 타고 ' +
            '강과 바다를 건너 멀리까지 다녔어요. 뿔 달린 투구는 사실 안 썼대요.' },

    { id: 'hej', emoji: '👋', label: '스웨덴 말', title: '스웨덴 말로 인사해요',
      sv: 'Hej! Tack! Hej då!', svKo: '헤이, 탁, 헤이 도',
      text: '안녕은 "헤이", 고마워는 "탁", 잘 가는 "헤이 도" 예요. ' +
            '스웨덴 사람들은 어른한테도 이름을 부르며 "헤이!" 하고 인사해요.' }
  ];

  /* -------------------------------------------------------------------------
   * '무엇이 있을까' 에 섞어 넣는 다른 나라 것들 — 세계 지도(world.js)의 나라와 같습니다.
   * 틀리면 "🐼 판다는 중국에 살아요" 하고 알려 줍니다.
   * ---------------------------------------------------------------------- */
  var OTHERS = [
    { emoji: '🐼', label: '판다',         country: '중국',     why: '판다는 중국에 살아요' },
    { emoji: '🧱', label: '만리장성',     country: '중국',     why: '만리장성은 중국에 있어요' },
    { emoji: '🥟', label: '만두',         country: '중국',     why: '만두는 중국 음식이에요' },
    { emoji: '🍕', label: '피자',         country: '이탈리아', why: '피자는 이탈리아에서 왔어요' },
    { emoji: '🍝', label: '파스타',       country: '이탈리아', why: '파스타는 이탈리아 음식이에요' },
    { emoji: '🦘', label: '캥거루',       country: '호주',     why: '캥거루는 호주에 살아요' },
    { emoji: '🐨', label: '코알라',       country: '호주',     why: '코알라는 호주에 살아요' },
    { emoji: '🗽', label: '자유의 여신상', country: '미국',    why: '자유의 여신상은 미국에 있어요' },
    { emoji: '🚀', label: '우주 로켓',    country: '미국',     why: '로켓은 미국에서 많이 쏘아 올려요' },
    { emoji: '🐫', label: '낙타',         country: '이집트',   why: '낙타는 이집트 사막에 살아요' },
    { emoji: '🏜️', label: '사막',        country: '이집트',   why: '사막은 이집트에 있어요 — 스웨덴은 숲과 눈이에요' },
    { emoji: '🗻', label: '후지산',       country: '일본',     why: '후지산은 일본에 있어요' },
    { emoji: '🍣', label: '초밥',         country: '일본',     why: '초밥은 일본 음식이에요' },
    { emoji: '🦁', label: '사자',         country: '케냐',     why: '사자는 케냐에 살아요' },
    { emoji: '🦒', label: '기린',         country: '케냐',     why: '기린은 케냐에 살아요' },
    { emoji: '🥐', label: '크루아상',     country: '프랑스',   why: '크루아상은 프랑스 빵이에요' },
    { emoji: '🌶️', label: '김치',        country: '대한민국', why: '김치는 우리나라 음식이에요' },
    { emoji: '🥋', label: '태권도',       country: '대한민국', why: '태권도는 우리나라에서 왔어요' },
    { emoji: '🐘', label: '코끼리',       country: '인도',     why: '코끼리는 인도에 살아요' },
    { emoji: '🍛', label: '카레',         country: '인도',     why: '카레는 인도 음식이에요' },
    { emoji: '🦜', label: '큰부리새',     country: '브라질',   why: '큰부리새는 브라질 숲에 살아요' },
    { emoji: '🌴', label: '열대우림',     country: '브라질',   why: '열대우림은 브라질에 있어요 — 스웨덴은 추워서 야자나무가 못 자라요' }
  ];

  /* -------------------------------------------------------------------------
   * 퀴즈 — 알아보기에서 읽어 준 것만 물어봅니다. 한 판에 ROUNDS 개를 골라 냅니다.
   *   q       : 문제 (읽어 줍니다)
   *   emoji   : (없어도 됩니다) 문제 옆에 크게 보이는 그림
   *   choices : 보기 — 첫 번째가 정답이고 화면에서는 섞입니다.
   *             글자 대신 그림(국기)을 보기로 쓸 때는 { emoji, why } 로 적습니다.
   *   why     : 맞히면 읽어 주는 한 줄 설명
   * ---------------------------------------------------------------------- */
  var QUIZ = [
    { q: '스웨덴의 수도는 어디일까요?', emoji: '🏰',
      choices: ['스톡홀름', '런던', '파리', '도쿄'],
      why: '스웨덴의 수도는 스톡홀름이에요. 열네 개의 섬 위에 있는 도시예요.' },

    { q: '스웨덴 국기는 어느 것일까요?',
      choices: [
        { emoji: '🇸🇪' },
        { emoji: '🇳🇴', why: '그건 노르웨이 국기예요' },
        { emoji: '🇩🇰', why: '그건 덴마크 국기예요' },
        { emoji: '🇫🇮', why: '그건 핀란드 국기예요' }
      ],
      why: '파란 바탕에 노란 십자가가 스웨덴 국기예요.' },

    { q: '스웨덴은 어느 대륙에 있을까요?', emoji: '🧭',
      choices: ['유럽', '아시아', '아프리카', '남아메리카'],
      why: '스웨덴은 유럽의 북쪽 끝에 있어요.' },

    { q: '스웨덴 사람들은 자기 나라를 뭐라고 부를까요?', emoji: '🇸🇪',
      choices: ['스베리예', '스위스', '스코틀랜드', '스페인'],
      why: '스웨덴 말로 스웨덴은 "스베리예" 예요.' },

    { q: '스톡홀름은 무엇 위에 세워진 도시일까요?', emoji: '🏰',
      choices: ['열네 개의 섬', '높은 산', '넓은 사막', '커다란 얼음'],
      why: '스톡홀름은 열네 개의 섬을 다리로 이은 도시예요.' },

    { q: '다음에 스웨덴 왕이 될 사람은 누구일까요?', emoji: '👑',
      choices: ['빅토리아 공주', '엘사', '백설공주', '신데렐라'],
      why: '지금 왕의 딸인 빅토리아 공주가 다음 왕이 돼요.' },

    { q: '삐삐 롱스타킹을 만든 스웨덴 작가는 누구일까요?', emoji: '🧦',
      choices: ['아스트리드 린드그렌', '안데르센', '그림 형제', '이솝'],
      why: '아스트리드 린드그렌이 삐삐를 만들었어요. 안데르센은 이웃 나라 덴마크 사람이에요.' },

    { q: '스웨덴 아이들이 사탕을 먹는 날은 언제일까요?', emoji: '🍬',
      choices: ['토요일', '월요일', '매일', '생일에만'],
      why: '토요일에만 먹어요 — 뢰르닥스구디스, 토요일 사탕이에요.' },

    { q: '"피카" 는 무엇일까요?', emoji: '☕',
      choices: ['차와 빵을 먹으며 쉬는 시간', '눈싸움', '스웨덴의 강아지 이름', '커다란 배'],
      why: '피카는 하던 일을 멈추고 다 같이 차와 빵을 먹으며 쉬는 시간이에요.' },

    { q: '노벨상을 만든 알프레드 노벨은 어느 나라 사람일까요?', emoji: '🏅',
      choices: ['스웨덴', '미국', '중국', '프랑스'],
      why: '노벨은 스웨덴 사람이에요. 그래서 노벨상은 스톡홀름에서 줘요.' },

    { q: '달라 말은 무엇으로 만들까요?', emoji: '🐴',
      choices: ['나무', '얼음', '초콜릿', '유리'],
      why: '달라 말은 나무를 깎아 빨갛게 칠한 장난감이에요.' },

    { q: '스웨덴 말로 "안녕" 은 뭐라고 할까요?', emoji: '👋',
      choices: ['헤이', '봉주르', '니하오', '곤니치와'],
      why: '스웨덴 말로 안녕은 "헤이" 예요. 봉주르는 프랑스, 니하오는 중국, 곤니치와는 일본 말이에요.' },

    { q: '스웨덴 말로 "고마워" 는 뭐라고 할까요?', emoji: '👋',
      choices: ['탁', '땡큐', '메르시', '아리가토'],
      why: '스웨덴 말로 고마워는 "탁" 이에요.' },

    { q: '스웨덴 북쪽 하늘에서 겨울밤에 볼 수 있는 것은 무엇일까요?', emoji: '🌌',
      choices: ['오로라', '무지개', '야자나무', '모래 폭풍'],
      why: '북쪽 하늘에서 초록빛 오로라가 춤춰요.' },

    { q: '사미 사람들이 키우는 동물은 무엇일까요?', emoji: '🦌',
      choices: ['순록', '낙타', '코끼리', '캥거루'],
      why: '사미 사람들은 라플란드에서 순록을 키워요.' },

    { q: '루시아 축제에서 루시아가 머리에 쓰는 것은 무엇일까요?', emoji: '🕯️',
      choices: ['촛불 관', '꽃 관', '왕관', '털모자'],
      why: '루시아는 촛불을 꽂은 관을 써요. 꽃 관은 여름 축제 미드솜마르에서 써요.' },

    { q: '미드솜마르는 언제 하는 축제일까요?', emoji: '💐',
      choices: ['해가 제일 긴 여름날', '눈 오는 겨울날', '설날', '추석'],
      why: '미드솜마르는 6월, 해가 제일 긴 날 즈음에 하는 한여름 축제예요.' },

    { q: '스웨덴 미트볼과 같이 먹는 잼은 무엇일까요?', emoji: '🧆',
      choices: ['링곤베리 잼', '딸기 잼', '포도 잼', '땅콩버터'],
      why: '미트볼은 으깬 감자와 새콤한 링곤베리 잼과 같이 먹어요.' },

    { q: '스웨덴 겨울에 제일 북쪽에서는 어떤 일이 생길까요?', emoji: '❄️',
      choices: ['해가 안 뜨는 날이 있어요', '눈이 안 와요', '밤이 없어요', '바다가 끓어요'],
      why: '제일 북쪽에서는 한겨울에 해가 아예 안 뜨는 날이 있어요. 대신 여름에는 밤에도 환한 백야가 돼요.' },

    { q: '스웨덴 땅의 3분의 2는 무엇일까요?', emoji: '🌲',
      choices: ['숲', '사막', '도시', '얼음'],
      why: '스웨덴은 땅의 3분의 2가 숲이고, 호수가 십만 개 가까이 있어요.' }
  ];

  var ACTS = [
    { id: 'look', name: '알아보기',     icon: '🔎', desc: '카드를 누르면 스웨덴 이야기를 읽어 줘요' },
    { id: 'find', name: '무엇이 있을까', icon: '🦌', desc: '넉 장 중 스웨덴에 있는 것을 찾아요' },
    { id: 'quiz', name: '퀴즈',         icon: '❓', desc: '알아보기에서 배운 것을 물어봐요' }
  ];

  var BEST_KEY = 'daniland.best.sweden';      // 카드에 보여 줄 기록 (놀이 중 제일 잘한 것)
  var ACT_KEY = 'daniland.swedenAct';         // 마지막에 고른 놀이

  var el = {
    label: document.getElementById('questLabel'),
    speakBtn: document.getElementById('speakBtn'),
    panel: document.getElementById('panel'),
    panelArt: document.getElementById('panelArt'),
    panelTitle: document.getElementById('panelTitle'),
    panelSv: document.getElementById('panelSv'),
    panelText: document.getElementById('panelText'),
    cards: document.getElementById('cards'),
    bar: document.getElementById('bar'),
    score: document.getElementById('score'),
    voiceBtn: document.getElementById('voiceBtn'),
    backBtn: document.getElementById('backBtn'),

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

  var state = {
    act: UI.loadValue(ACT_KEY) || 'look',
    round: 0,
    stars: 0,
    prompt: '',                        // 🔊 다시 를 누르면 읽어 줄 말
    firstTry: true,
    locked: false,
    deck: [],                          // 이번 판에 아직 안 나온 문제들
    seen: {},                          // 알아보기에서 눌러 본 카드
    fact: null                         // 알아보기에서 지금 읽고 있는 카드 (🔊 다시 가 이것을 읽습니다)
  };

  if (!findAct(state.act)) state.act = 'look';

  if (!window.TTS || !TTS.supported) el.voiceBtn.hidden = true;

  buildModeRow();

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
    VoicePicker.open({ lang: LANG, sample: function () { return state.prompt || '스웨덴은 유럽의 북쪽에 있어요.'; } });
  });

  // 맨 위 ← 는 방금 지나온 과목 페이지로, 결과 화면의 🏠 만 홈으로 갑니다.
  bindGo(el.backBtn, Catalog.backHref('sweden.html'));
  bindGo(el.endHome, 'index.html');
  bindGo(el.startHome, Catalog.backHref('sweden.html'));
  bindGo(el.endModes, Catalog.backHref('sweden.html'));

  function bindGo(btn, href) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.TTS) TTS.cancel();
      window.location.href = href;
    });
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

  // 놀이마다 최고 기록을 단추 아래에 작게 보여 줍니다. (알아보기는 점수가 없습니다)
  function bestText(act) {
    if (act === 'look') return '';
    var best = UI.readBest('daniland.best.sweden.' + act);
    return best ? '⭐ ' + best.stars + '/' + best.total : '';
  }

  function showAct() {
    var a = findAct(state.act);
    if (a) el.modeDesc.textContent = a.desc;
  }

  /* ---------- 위 판 (이야기 · 문제) ---------- */

  // art 는 이모지, img 는 (있으면) 사진 파일 이름 — 사진을 못 읽으면 이모지로 돌아갑니다.
  function showPanel(art, title, text, sv, img) {
    el.panelArt.innerHTML = '';
    el.panelArt.appendChild(artEl(art, img));
    el.panel.classList.toggle('with-photo', !!img);
    el.panelTitle.textContent = title || '';
    el.panelText.textContent = text || '';
    el.panelSv.textContent = sv || '';
    el.panelSv.hidden = !sv;
    el.panel.classList.remove('pop');
    void el.panel.offsetWidth;
    el.panel.classList.add('pop');
    fitCards();
  }

  function artEl(emoji, img) {
    if (!img) return document.createTextNode(emoji || '');
    var im = document.createElement('img');
    im.src = 'sweden/' + img;
    im.alt = '';
    im.onerror = function () {
      im.replaceWith(document.createTextNode(emoji || ''));
      el.panel.classList.remove('with-photo');
      fitCards();
    };
    im.onload = fitCards;
    return im;
  }

  function setLabel(text) {
    el.label.textContent = text;
  }

  /* ---------- 카드 크기 맞추기 ----------
   * 카드 줄이 화면 아래로 넘치지 않게 높이를 정합니다 (스크롤이 생기면 안 됩니다).
   * 알아보기는 열여덟 장이라 넉 줄 넘게 서므로 여기서 줄여 주고, 손가락 최소 64px 아래로는 안 갑니다. */
  function fitCards() {
    var wrapEl = document.querySelector('.wrap');
    var toolsEl = document.querySelector('.tools');
    var screenH = document.documentElement.clientHeight || window.innerHeight;
    var n = el.cards.children.length;
    if (!n) return;

    var cols = parseInt(getComputedStyle(el.cards).gridTemplateColumns.split(' ').length, 10) || 2;
    var rows = Math.ceil(n / cols);
    var gap = px(getComputedStyle(el.cards).rowGap) || 10;

    var top = el.cards.getBoundingClientRect().top;
    var bottomPad = wrapEl ? px(getComputedStyle(wrapEl).paddingBottom) : 0;
    var toolsH = toolsEl ? toolsEl.offsetHeight + px(getComputedStyle(toolsEl).marginTop) : 0;
    var availH = screenH - top - toolsH - bottomPad - 6;

    var max = (state.act === 'look') ? 150 : 200;
    var h = Math.round(Math.max(64, Math.min(max, (availH - gap * (rows - 1)) / rows)));
    el.cards.style.setProperty('--ch', h + 'px');
  }

  function px(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  window.addEventListener('resize', fitCards);
  window.addEventListener('orientationchange', function () { setTimeout(fitCards, 200); });

  /* ---------- 놀이 진행 ---------- */

  function startGame() {
    state.round = 0;
    state.stars = 0;
    state.prompt = '';
    state.locked = false;
    state.seen = {};
    state.fact = null;
    el.bar.style.width = '0%';
    el.cards.innerHTML = '';
    el.speakBtn.hidden = true;

    if (state.act === 'look') return startLook();

    state.deck = UI.shuffle((state.act === 'find' ? findables() : QUIZ.slice()).slice()).slice(0, ROUNDS);
    updateScore();
    nextRound();
  }

  function nextRound() {
    if (state.round >= state.deck.length) return finish();

    state.firstTry = true;
    state.locked = false;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    var item = state.deck[state.round];
    if (state.act === 'find') askFind(item);
    else askQuiz(item);
  }

  // 문제를 낼 때마다 부릅니다 — 읽어 줄 말을 정하고 🔊 다시 를 켭니다.
  function beginQuestion(spoken) {
    state.prompt = spoken;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    setTimeout(speakPrompt, 300);
  }

  // 맞혔을 때 — 별을 주고 설명을 읽어 준 뒤 다음 문제로 갑니다.
  function scoreQuestion(card, art, title, why, img) {
    state.locked = true;
    if (window.SFX) SFX.correct();
    card.classList.add('correct');
    UI.addMark(card, '⭕');
    UI.confettiAt(card);
    if (state.firstTry) { state.stars += 1; updateScore(); }
    state.round += 1;
    el.bar.style.width = Math.round((state.round / state.deck.length) * 100) + '%';

    showPanel(art, title, why, '', img);
    state.prompt = why;
    el.speakBtn.hidden = true;   // 설명을 읽고 나면 바로 다음 문제라, 여기서 끊으면 흐름이 멈춥니다
    speak(why, function () { setTimeout(nextRound, 500); });
  }

  // 틀렸을 때 — 카드를 흐리게 남기고 까닭을 보여 준 뒤 문제를 다시 들려줍니다.
  function missed(card, why) {
    state.firstTry = false;
    if (window.SFX) SFX.wrong();
    card.classList.add('wrong');
    el.panelText.textContent = why || '아니에요. 다시 골라 봐요.';
    fitCards();   // 까닭이 들어가 판이 커지면 카드가 그만큼 줄어야 합니다
    setTimeout(function () {
      card.classList.remove('wrong');
      card.classList.add('dim');
      UI.addMark(card, '❌');
    }, 400);
    speak(el.panelText.textContent, function () { setTimeout(speakPrompt, 200); });
  }

  /* 🔎 알아보기 — 카드 열여덟 장. 누르면 이야기를 읽어 주고, 다 보면 끝납니다. */
  function startLook() {
    el.cards.className = 'cards sweden-cards look-cards';
    el.cards.innerHTML = '';

    FACTS.forEach(function (f) {
      var b = document.createElement('button');
      b.className = 'choice fact-card';
      b.innerHTML = '<div class="art">' + f.emoji + '</div>' +
                    '<div class="lbl">' + f.label + '</div>';
      b.addEventListener('click', function () { lookAt(b, f); });
      el.cards.appendChild(b);
    });

    updateScore();
    setLabel('카드를 눌러 스웨덴을 둘러봐요');
    showPanel('🇸🇪', '스웨덴', '유럽 북쪽에 있는 나라예요. 카드를 하나씩 눌러 보세요.', 'Sverige · 스베리예');
    beginQuestion('스웨덴이에요. 카드를 하나씩 눌러 보세요.');
  }

  function lookAt(card, f) {
    if (window.SFX) SFX.tap();

    if (!state.seen[f.id]) {
      state.seen[f.id] = true;
      card.classList.add('seen');
      UI.addMark(card, '✅');
      updateScore();
    }

    var svLine = f.sv ? f.sv + ' · ' + f.svKo : '';
    showPanel(f.emoji, f.title, f.text, svLine, f.img);
    state.fact = f;
    el.speakBtn.hidden = !(window.TTS && TTS.supported);
    readFact(f);
  }

  // 이야기를 우리말로 읽고, 스웨덴 말이 있으면 이어서 읽습니다. 다 읽었는데 카드를 다 봤으면 끝냅니다.
  // 읽는 중에 다른 카드를 누르면 그쪽 읽기가 시작되고 이 사슬은 조용히 끊깁니다 (speak 의 seq).
  function readFact(f) {
    speak(f.title + '. ' + f.text, function () {
      speakSwedish(f.sv, function () {
        if (Object.keys(state.seen).length >= FACTS.length) setTimeout(finishLook, 300);
      });
    });
  }

  function finishLook() {
    if (window.SFX) SFX.finish();
    el.endTitle.textContent = '스웨덴을 다 둘러봤어요!';
    el.endStars.textContent = '🇸🇪';
    el.endText.textContent = '이제 퀴즈도 풀어 볼까요?';
    el.endOverlay.hidden = false;
  }

  /* 🦌 무엇이 있을까 — 스웨덴 것 하나 + 다른 나라 것 셋 */
  function findables() {
    return FACTS.filter(function (f) { return f.find; });
  }

  function askFind(f) {
    el.cards.className = 'cards sweden-cards pick-cards';
    el.cards.innerHTML = '';

    var options = UI.shuffle(OTHERS.slice()).slice(0, 3).map(function (o) {
      return { emoji: o.emoji, label: o.label, why: o.emoji + ' ' + o.why, right: false };
    });
    options.push({ emoji: f.emoji, label: f.find, right: true });
    UI.shuffle(options);

    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice pick-card';
      b.innerHTML = '<div class="art">' + o.emoji + '</div>' +
                    '<div class="lbl">' + o.label + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return missed(b, o.why);
        scoreQuestion(b, f.emoji, f.title, f.text, f.img);
      });
      el.cards.appendChild(b);
    });

    setLabel('스웨덴에 있는 것은? (' + (state.round + 1) + '/' + state.deck.length + ')');
    showPanel('🇸🇪', '스웨덴에 있는 것은 무엇일까요?', '');
    beginQuestion('이 중에서 스웨덴에 있는 것은 무엇일까요?');
  }

  /* ❓ 퀴즈 — 보기 넉 개 (첫 번째가 정답, 화면에서는 섞습니다) */
  function askQuiz(q) {
    el.cards.className = 'cards sweden-cards ans-cards';
    el.cards.innerHTML = '';

    var options = q.choices.map(function (c, i) {
      var o = (typeof c === 'string') ? { text: c } : { emoji: c.emoji, text: c.text, why: c.why };
      o.right = (i === 0);
      return o;
    });
    UI.shuffle(options);

    options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'choice ans-card' + (o.emoji ? ' flag' : '');
      b.innerHTML = o.emoji
        ? '<div class="art">' + o.emoji + '</div>'
        : '<div class="text">' + o.text + '</div>';
      b.addEventListener('click', function () {
        if (state.locked || b.classList.contains('dim')) return;
        if (!o.right) return missed(b, o.why);
        scoreQuestion(b, q.emoji || o.emoji, '맞았어요!', q.why);
      });
      el.cards.appendChild(b);
    });

    setLabel('퀴즈 (' + (state.round + 1) + '/' + state.deck.length + ')');
    showPanel(q.emoji || '❓', q.q, '');
    beginQuestion(q.q);
  }

  function finish() {
    state.locked = true;
    el.bar.style.width = '100%';
    var total = state.deck.length;
    UI.saveBest('daniland.best.sweden.' + state.act, state.stars, total);
    UI.saveBest(BEST_KEY, state.stars, total);

    el.endStars.textContent = UI.starLine(state.stars, total);
    el.endTitle.textContent = (state.stars === total)
      ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
      : '잘했어요!';
    el.endText.textContent = total + '개 중에 ' + state.stars + '개를 한 번에 맞혔어요!';
    el.endOverlay.hidden = false;

    if (window.SFX) SFX.finish();
  }

  /* ---------- 소리 · 화면 ---------- */

  function updateScore() {
    if (state.act === 'look') {
      el.score.textContent = '👀 ' + Object.keys(state.seen).length + '/' + FACTS.length;
    } else {
      el.score.textContent = '⭐ ' + state.stars;
    }
  }

  function speakPrompt() {
    if (state.act === 'look' && state.fact) return readFact(state.fact);
    speak(state.prompt);
  }

  // speak() 를 부를 때마다 하나씩 올라갑니다. 새 말이 시작되면 먼저 하던 말은 끊기는데(TTS 가 cancel),
  // 그때 먼저 말의 then 까지 불러 버리면 끊긴 말이 이어서 또 나옵니다 — 그래서 최신 것만 then 을 부릅니다.
  var speakSeq = 0;

  // 다 읽으면 then 을 부릅니다. 소리를 못 내는 기기에서도 흐름이 끊기지 않게
  // 읽는 데 걸릴 만한 시간 뒤에는 꼭 한 번 부릅니다. (우리말은 영어보다 글자당 오래 걸립니다)
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

  // 스웨덴 말은 그 목소리가 있는 기기에서만 읽어 줍니다 (없으면 바로 then).
  function speakSwedish(text, then) {
    if (!text || !window.TTS || !TTS.supported || !TTS.voicesFor(SV).length) {
      if (then) then();
      return;
    }
    speak(text, then, SV);
  }
})();
