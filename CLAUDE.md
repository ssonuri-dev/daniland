# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 이 저장소는

5살 아이가 그날 배운 것을 복습하는 웹사이트(다니랜드). **빌드 도구·의존성·테스트 프레임워크가 하나도 없는 순수 정적 사이트**입니다.
`package.json`, 번들러, npm 스크립트가 없는 것은 실수가 아니라 의도입니다 — 부모가 `js/data.js` 한 줄만 고쳐서
바로 배포할 수 있어야 하므로, 빌드 단계를 새로 들이지 마세요.

문서·UI 문구·주석·커밋 메시지는 모두 한국어입니다. README.md 는 비개발자(부모)를 독자로 쓰였으므로
동작을 바꾸면 README 의 해당 표·설명도 같이 고쳐야 합니다.

## 작업 방식 (사용자와의 약속)

- **커밋은 물어보지 말고 하세요.** 작업이 한 덩어리 끝나면 바로 커밋해도 됩니다.
- **`git push` 는 반드시 먼저 확인받으세요.** push 하는 순간 GitHub Pages 로 공개 배포되어
  아이가 쓰는 사이트가 바뀝니다. `.claude/settings.local.json` 의 `permissions.ask` 에도
  같은 규칙이 걸려 있으니 그 프롬프트를 우회하지 마세요.
- **애매하면 혼자 정하지 말고 물어보세요.** 해석이 갈리면 결과물이 달라지는 지점
  — 어느 과목에 넣을지, 난이도를 몇 단계로 할지, 기존 놀이를 고칠지 새로 만들지 —
  에서는 멈추고 확인합니다. 답과 상관없이 할 수 있는 일은 먼저 끝내놓고 묻습니다.

## 실행과 확인

```bash
# 실행 — index.html 을 브라우저로 열면 끝 (file:// 로도 동작합니다)
start index.html            # 또는 아래처럼 서버로
python -m http.server 8000

# 문법 확인 — 테스트 러너가 없으므로 이것이 유일한 자동 검증 수단입니다
node --check js/data.js
for f in js/*.js; do node --check "$f"; done
```

동작 검증은 브라우저에서 직접 눌러 보는 수밖에 없습니다. 로직만 확인하려면
임시 스크립트를 `node -e` 로 돌려 볼 수는 있지만(`window` 를 흉내 내야 함) 저장소에 남기지 마세요.

## 배포

`main` 브랜치 최상위 폴더가 그대로 GitHub Pages(https://ssonuri-dev.github.io/daniland/)로 나갑니다.
`git push` 하면 1~2분 뒤 반영되고, 그 외 배포 절차는 없습니다.

`.gitignore` 로 막아 둔 것은 반드시 유지하세요 — `wednesday_*.png` 는 선생님이 보낸 수업 안내 캡처라
공개 저장소에 올라가면 안 됩니다. `.gitattributes` 가 줄바꿈을 LF 로 강제합니다.

## 구조의 핵심

### 모듈 시스템이 없다 — 스크립트 순서가 곧 의존성 그래프

ES5 IIFE 로 감싸 `window` 에 전역을 붙이는 방식입니다. `import`/`export`, `const`/`let`, 화살표 함수를
쓰지 않습니다(주변 코드와 맞추세요). 각 HTML 의 `<script>` 나열 순서가 로드 순서이고,
`ui.js` → `data.js` → `catalog.js` → 페이지 스크립트 순서를 어기면 조용히 깨집니다.

| 전역 | 파일 | 하는 일 |
|---|---|---|
| `SUBJECTS` `LESSONS` `PAGES` | `js/data.js` | 콘텐츠 전부 (평소 손댈 파일은 여기뿐) |
| `BOOKS` | `js/books.js` | 영어 그림책 — 책 한 권이 객체 하나, 그림은 `books/<id>/` (전집처럼 계속 늘어납니다). 목록 페이지도 읽습니다(책마다 카드) |
| `RIDDLES` | `js/riddles.js` | 수수께끼·넌센스 문제 — 문제 하나가 객체 하나 (계속 늘어납니다). `riddle.html` 만 읽습니다 |
| `Catalog` | `js/catalog.js` | LESSONS+PAGES 를 과목별로 묶고 최고 기록을 붙임 |
| `UI` | `js/ui.js` | 섞기·이모지 개수 세기·URL 파라미터·폭죽·localStorage |
| `TTS` | `js/tts.js` | 브라우저 speechSynthesis 래퍼 (목소리 순위 매기기 포함) |
| `SFX` | `js/sfx.js` | WebAudio 로 만든 효과음 (오디오 파일 없음) |
| `VoicePicker` | `js/voicepicker.js` | 목소리·속도 고르는 패널 (게임 화면 공용) |

`js/gate.js` 는 이 표에 없습니다 — 전역을 만들지 않고 `<body>` 맨 위에서 혼자 도는
비밀번호 가림막이라 로드 순서와 상관없습니다. **새 HTML 페이지를 만들면 `<body>` 첫 줄에 이것부터
넣으세요.** 진짜 인증이 아니라 문패라는 점도 그 파일 주석에 적혀 있습니다.

### 글꼴

제목은 **Jua**, 나머지는 **나눔고딕** — 둘 다 구글 웹폰트입니다. 각 HTML `<head>` 의
`fonts.googleapis.com` `<link>` 세 줄로 받아 오고, `css/style.css` 맨 위에서 `body` 와
제목용 선택자 목록에 물려 둡니다. **새 HTML 페이지를 만들면 그 `<link>` 세 줄도 같이 넣으세요.**
웹폰트를 못 받으면 조용히 맑은 고딕으로 떨어집니다 (글자는 다 보입니다). 배포된 사이트는
인터넷이 있어야 열리니 이 폴백이 쓰이는 건 `file://` 로 열 때나 구글 폰트만 막힌 망에서입니다.
Jua 는 굵기가 400 하나뿐이라 제목 규칙에서 `font-weight: 400` 으로 고정했습니다 —
제목에 `font-weight` 를 다시 얹으면 가짜 굵게가 걸려 뭉개집니다.

### 데이터가 화면을 만든다

`js/data.js` 의 `LESSONS` 에 객체 하나를 넣으면 홈 카드·과목 카드·게임 화면이 자동으로 생깁니다.
다른 파일을 고칠 필요가 없어야 정상입니다. `catalog.js` 가 `LESSONS`(게임 데이터)와
`PAGES`(따로 만든 페이지 카드)를 같은 모양으로 합쳐 과목 페이지에서 **같은 층**으로 보여 줍니다.
`SUBJECTS` 에 없는 `subject` 이름을 쓰면 과목이 맨 뒤에 자동 생성됩니다.

**과목 안에 한 층이 더 있습니다 (2026-09-18).** 카드가 많아진 영어·수학·한글은 `SUBJECTS[].groups` 로
묶음을 정의하고, 카드마다 `group` 을 적습니다. `catalog.js` 의 `groupsOf()` 가 과목과 같은 규칙으로 묶습니다
(정의 순서대로, 없는 이름은 맨 뒤에 자동 생성, `group` 을 안 적은 카드는 '그 밖에'). 묶음이 없는 과목(세계·놀이)은
카드가 바로 나옵니다. **게임 페이지 주소는 안 바뀌고** 목록 주소만 `subject.html?name=영어&group=…` 가 됩니다.
게임 화면의 ← 는 `Catalog.href(subject, group)` 또는 `Catalog.backHref('make.html')` 로 **묶음 페이지**로 돌아갑니다 —
새 페이지를 만들면 이 둘 중 하나를 쓰세요. `numbers.html` 은 놀이(`?act=`)마다 묶음이 달라 `href` 를 통째로 맞춥니다.
카드에 `top: true` 를 적으면 묶음에 안 들어가고 **묶음 카드 옆**에 바로 놓입니다 (영어의 '알파벳 쓰기' — 낱말도 문장도
아니라 어느 묶음에도 안 어울림). `catalog.js` 가 `subject.top` 으로 모으고 `subject.js` 가 묶음 카드 뒤에 붙입니다.
'책 읽기' 묶음은 카드가 '영어 그림책' 한 장이 아니라 **책마다 한 장**입니다 — `PAGES` 의 그 카드에 `books: true` 가 있어
`catalog.js` 가 `BOOKS` 로 펼칩니다(`book.html?book=<id>`). 그래서 `index.html`·`subject.html` 도 `books.js` 를 읽습니다.

필드의 의미와 예시는 `js/data.js` 상단 주석과 README 의 "새 수업 추가하기"에 이미 정리돼 있습니다.

### 화면 흐름

```
index.html            과목 카드            home.js
 └ subject.html?name=영어   묶음 카드        subject.js  (SUBJECTS[].groups 가 있는 과목만 — 없으면 바로 아래 층)
   └ subject.html?name=영어&group=단어 공부   수업·놀이 카드   subject.js
      ├ play.html?lesson=en-fruits          game.js     (수업 데이터 기반, 놀이 5종)
      ├ numbers.html?act=plus               numbers.js  (문제를 매번 생성, 놀이 8종)
      ├ hundred.html                        hundred.js  (1~100 백 판, 놀이 3종)
      ├ town.html                           town.js     (지도 그림 town.jpg 위, 놀이 3종)
      ├ world.html                          world.js    (지도 그림 world.jpg 위, 놀이 3종)
      ├ trip.html                           trip.js     (풍경 그림 trip.jpg 위, 놀이 2종 — 영어 문장·대화)
      ├ write.html                          write.js    (글자 따라 쓰기, 묶음 6종 — 한글 자음·모음·숫자·낱말 + 영어 대문자·소문자. 영어 카드는 ?lang=en)
      ├ make.html                           make.js     (자음+모음으로 글자 조립)
      ├ maze.html                           maze.js     (미로를 매번 생성, 캔버스에 그림)
      ├ dodge.html                          dodge.js    (장애물 피하기 — 흐르는 길을 캔버스에 그림, 단계·하트)
      ├ book.html                           book.js     (영어 그림책 — js/books.js 의 책을 book.jpg 위에, 읽기·만들기)
      ├ country.html?country=sweden         country.js  (나라 한 곳 깊이 — 이야기 카드 18장·퀴즈. 데이터는 js/countries/<id>.js: 스웨덴·그리스·독일. sweden.html 은 옛 주소 → 넘김)
      ├ europe.html                         europe.js   (유럽 — 나라 모양 svg 지도(europe-map.js) 위 국기 핀 18개, 놀이 4종)
      ├ riddle.html                         riddle.js   (수수께끼·넌센스 — js/riddles.js 의 문제를 열 개씩, 보기 넉 장)
      ├ fish.html                           fish.js     (낚시 — 하늘·바다·배·물고기를 캔버스에 그림, 단계·하트. 장애물 피하기와 같은 얼개)
      └ draw.html                           draw.js     (독립 — 다른 js 를 전혀 안 씀)
```

`play.html` 과 `numbers.html` 은 **모든 수업·모든 놀이가 함께 쓰는 한 개의 화면**입니다.
놀이별로 HTML 을 늘리지 마세요. 수학 놀이를 더할 때도 `numbers.js` 의 `ACTS` 에 한 줄,
`make<이름>()` 하나, `PAGES` 에 카드 하나면 끝나야 정상입니다.

- **놀이 선택 위치가 둘이 다릅니다.** `game.js` 는 시작 오버레이에서 놀이+난이도를 고르고,
  `numbers.js` 는 과목 페이지의 카드(`?act=`)가 곧 놀이라 시작 화면에 숫자 범위만 나옵니다.
  (`hundred.js` 는 town/world 처럼 시작 화면에서 놀이를 고릅니다.)
- **`numbers.js` 의 난이도는 놀이마다 다릅니다** — `ACTS[].levels` 에 있습니다. 세는 놀이는
  `[5,10,20]`, 수 순서는 `[20,50,100]`, 패턴 잇기는 `[]`(단계가 없어 시작 화면에서 숨깁니다).
  저장 키도 `daniland.numMax.<act>` 로 갈라 두었습니다 — 한 키로 묶으면 수 순서의 100 이
  세어 보기로 새어 들어갑니다.
- **놀이 가능 여부는 데이터에서 유도됩니다.** `lesson.modes` 가 있으면 그대로,
  없으면 `items` 에 `emoji` 가 있는지 보고 그림 놀이 3종(`listen`/`word`/`memory`) 또는
  그림 없는 놀이 2종(`sound`/`order`)을 씁니다 (`game.js` 의 `lessonModes()`).
- **`listen`·`word`·`memory` 는 영어 단어·한글 단어 공부 전용입니다.** 그림과 낱말을 짝지어
  외우는 놀이라 어휘 학습에서만 뜻이 있습니다. 수학처럼 낱말을 외우는 수업이 아니면 이 세 가지를
  쓰지 마세요 — 그런 내용은 `numbers.js` 처럼 페이지를 따로 만들어 `PAGES` 에 카드로 얹습니다.
  (`sound`·`order` 는 요일·달처럼 그림이 없는 어휘에 쓰는 것이라 이 제한과 별개입니다.)
- **`items` 모양에 안 맞는 콘텐츠는 `LESSONS` 를 늘리지 마세요.** `items` 의 단위는
  `{ emoji, word, ko }` — 낱말 하나입니다. 문장이나 주고받는 대화는 여기에 담기지 않습니다.
  앞으로 붙일 **영어 대화 수업**이 그 경우라, `LESSONS` 를 확장하는 대신 `numbers.html` ·
  `draw.html` 처럼 페이지를 따로 만들고 `PAGES` 에 카드로 얹기로 정해 두었습니다.
  **마을 시설 이름(`town.html`)이 그 첫 사례입니다** — 위치가 뜻을 갖는 어휘라 낱말 카드 대신
  지도 그림 한 장 위에 건물 단추를 얹었습니다. 좌표는 `js/town.js` 의 `PLACES` 에 백분율로 있습니다.
  **나라 이름(`world.html`)이 두 번째**로, 같은 얼개를 그대로 씁니다 (`js/world.js` 의 `COUNTRIES`).
  다른 점은 길이 없어 다니가 곧장 날아간다는 것과, 지도가 정사각형이 아니라 3:2 라는 것입니다.
  지도 그림을 새로 바꾸면 `box` 와 `x`/`y`, 그리고 **`MAP_RATIO`(가로÷세로)** 를 다시 맞춰야 합니다.
  **`box` 끼리 겹치면 위에 그려진 단추가 아래 것을 가립니다.**
  **글자 쓰기(`write.html`)와 글자 만들기(`make.html`)가 세 번째·네 번째 사례**입니다 —
  '쓰는 것' 과 '자모를 조립하는 것' 은 낱말 카드에 담기지 않아 페이지를 따로 만들었습니다.
  `make.js` 는 문제를 `LESSONS` 의 **'한글' 과목 수업에서 그대로 읽어 옵니다** — 한글 수업에
  낱말을 더 넣으면 그 놀이도 같이 늘어나니, 거기에 새 데이터 배열을 만들지 마세요.
  **백 판(`hundred.html`)이 다섯 번째 사례**입니다 — 1~100 이 열 칸씩 열 줄로 놓인 판 자체가
  교구라서(줄=십의 자리, 칸=일의 자리) 낱말 카드에도 `numbers.html` 의 보기 넉 장에도 안 담깁니다.
  **할머니 섬 여행(`trip.html`)이 여섯 번째이자, 위에서 말한 영어 대화 수업의 첫 사례**입니다 (2026-09-12).
  수업 책 *Grandma's Island* 의 문장(`How do you get there? / We go by ___.`,
  `Are you thirsty? / Yes, I am. / Have a drink.`)을 풍경 그림 한 장 위의 여행으로 엮었습니다.
  구간의 땅(길·철길·바다·하늘)이 정답 탈것을 정하므로 보기 넉 장은 **네 땅에서 하나씩** 뽑습니다 —
  같은 땅의 탈것 둘을 한 문제에 넣으면 정답이 둘이 됩니다. 탈것 낱말 자체는 `LESSONS` 의
  `en-transport` 에 따로 있고, `trip.js` 의 `VEHICLES` 는 여행에 쓰는 것만 추려 kind 를 붙인 것입니다.
  그림은 창보다 `ZOOM`(1.5)배 크게 그리고 `camera()` 가 다니를 따라 가로·세로로 밉니다 (땅에서는 하늘이
  잘리고 비행기를 타면 위로 올라갑니다) — `.trip-map`(창) 안에 `.trip-scene`(그림)이 따로 있는 이유입니다.
  폰에서는 창 자체가 148px 띠가 되어 `MIN_VIEW_H`(280px)로 세웁니다. 좌표는 모두 그림 기준 % 입니다.
  카메라와 다니가 같은 박자로 움직여야 다니가 창 안에서 미끄러지지 않으니 둘 다 `linear` 입니다.
  **영어 그림책(`book.html`)이 일곱 번째**입니다 (2026-09-15). 부모가 전집처럼 계속 책을 더할 것이라
  책 데이터를 `js/books.js` 로 따로 뺐고, 화면은 한 개가 모든 책을 씁니다. 읽는 책과 만드는 책이
  **같은 뼈대**라 빈칸(`{home}`)이 든 글 하나로 둘 다 됩니다 — `book.js` 의 `sub()` 가 영어에는 `word`,
  우리말에는 `ko`, 그림 이름에는 `img` 를 넣습니다. 장면은 통그림이 아니라 **배경 + 투명 png 인물 + 이모지
  소품을 겹치는 것**이라 선택지 조합만큼 그림이 필요하지 않습니다 (1권: 그림 20장으로 729가지 책).
  그림 파일이 없으면 `art` 의 이모지로 대신 그리므로 그림이 오기 전에도 돌아갑니다 (`artEl()`).
  아이가 영어를 싫어해서 만든 것이라 **고른 낱말이 다음 장을 바꾸는 것**이 핵심이니, 빈칸을 장식으로 두지 마세요.
  **탈것 타기(`ride.html`)가 여덟 번째**입니다 (2026-09-18) — `Get on the bus / Get in the car` 전치사 수업.
  탈것 낱말은 `en-transport` 에 있지만 전치사는 낱말이 아니라 **탈것마다 붙는 규칙**이라 `js/ride.js` 의 `RIDES` 에
  `prep` 을 붙여 따로 두었습니다. 그림 파일 없이 css 로 길가를 그렸고, 맞히면 **다니가 그 전치사대로 탑니다**
  (on 은 지붕 위 `.aboard-on`, in 은 안에 들어가 머리만 `.aboard-in`) — 전치사 뜻이 그림으로 보이는 것이 핵심이니
  두 자세를 같게 만들지 마세요. boat 는 크기에 따라 on/in 이 갈려 일부러 뺐고, 한 판은 on·in 을 넉 대씩 뽑습니다
  (in 이 드물어 그냥 섞으면 on 만 눌러도 거의 맞습니다).
  **스웨덴(`sweden.html` → 지금은 `country.html?country=sweden`)이 아홉 번째**입니다 (2026-09-18) — 세계 과목에서 **나라 한 곳을 깊이** 보는 첫 사례.
  **2026-09-22 그리스가 더해지면서 화면(`js/country.js`)과 데이터(`js/countries/<id>.js`, `window.COUNTRY_PAGES[id]`)를 갈랐습니다** —
  화면 하나가 모든 나라를 쓰고 주소의 `?country=` 로 고릅니다. 나라를 더할 땐 데이터 파일 하나 + `country.html` 의 `<script>` 한 줄 +
  `PAGES` 카드 한 장. 기록 키는 `daniland.best.<id>`(스웨덴은 옛 키 그대로), 사진 폴더는 `<id>/`. 우리말 조사는 `josa()` 가 받침을 보고
  붙입니다('스웨덴을'·'그리스를'). 아래 스웨덴 설명의 `js/sweden.js`·`FACTS` 등은 이제 `js/countries/sweden.js` 안에 있습니다.
  세계 지도(`world.js`)가 열두 나라를 얕게 훑는 것과 달리 이야기 카드 18장(`FACTS`)·다른 나라 것(`OTHERS`)·퀴즈(`QUIZ`)가
  `js/sweden.js` 위쪽에 있습니다. 위 판의 사진은 `sweden/<id>.jpg`(800px, 4:3) 이고 `FACTS[].img` 로 잇습니다 — 파일이 없으면
  이모지로 대신 그립니다(`artEl`). **사진은 전부 위키미디어 공용(CC BY / CC BY-SA / PD)이고 `sweden/CREDITS.md` 가 출처 표입니다.
  사진을 바꾸면 그 표도 같이 고치고, 출처를 못 적는 사진은 넣지 마세요.** 고를 때 피한 것: 캐릭터 그림(삐삐), 노벨 메달 도안,
  조각·공공 미술(스웨덴은 건물만 파노라마 자유), 아이 얼굴 클로즈업. **폰(600px 미만)의 알아보기는 위 판이 없고 카드를 누르면
  팝업(`openStory`)이 뜹니다** — 판 옆 사진이 112px 로 너무 작았고, 판을 키우면 카드 18장이 밀려 스크롤이 생기며 아래 카드를
  눌렀을 때 판이 안 보였습니다. 태블릿은 위 판 그대로. 읽어 주는 말은 **우리말**(ko-KR)이고 스웨덴 말은
  `sv-SE` 목소리가 있을 때만 뒤에 한 번 더 읽습니다 (없으면 조용히 건너뜀 — 읽는 법 `svKo` 가 우리말 안에 있어서 괜찮습니다).
  내용은 6~7살 수준이지만 **사실은 정확하게** — 쉽게 한다고 틀리게 적지 마세요. 다른 나라를 더하려면 이 파일을 복사해
  세 배열만 바꾸는 것이 의도입니다 (한 화면에 여러 나라를 넣는 것은 아직 안 정했습니다).
  읽기는 `speak()` 의 `seq` 로 최신 것만 이어집니다 — 읽는 중에 다른 카드를 누르면 앞 사슬(우리말→스웨덴 말→끝 확인)이
  조용히 끊깁니다. 이게 없으면 TTS 가 cancel 될 때 앞 말의 onend 가 불려 끊긴 말이 이어서 또 나옵니다.
  **유럽(`europe.html`)이 열 번째**입니다 (2026-09-19) — 세계 지도와 스웨덴의 가운데: 지도 한 장 위에서 나라 열여덟 곳을
  찾아가되 나라마다 이야기·볼거리 셋·그 나라 말 인사가 붙어 있습니다 (`js/europe.js` 의 `COUNTRIES`). 지도는 그림 파일이 아니라
  **나라 모양 svg** 입니다 — `js/europe-map.js` 는 Natural Earth 1:50m(퍼블릭 도메인)을 람베르트 정적 방위 도법으로 투영해
  만들어 낸 것이라 **손으로 고치지 말고** 머리 주석대로 다시 만드세요 (생성 스크립트는 저장소에 없습니다 — 자료·투영·틀·단순화
  값이 주석에 있으니 그대로 다시 짜면 됩니다). 나라 땅(`.eu-land`)과 국기 핀(`.eu-pin`)이 둘 다 단추입니다 — 작은 나라는 땅만으로는
  손가락에 안 잡혀서요. 핀 좌표는 수도가 아니라 나라 가운데쯤이고 체코·오스트리아·노르웨이·스웨덴은 핀이 안 겹치게 손으로 옮긴
  것이니 되돌리지 마세요. 땅 색은 `SHADE` 가 이웃끼리 다르게 손으로 맞춘 것입니다. 이야기 판(`.eu-panel`)은 스웨덴의 `.fact-panel`
  을 그대로 쓰고, 세로 화면에서는 지도 아래(높이 고정 — 글이 길면 판 안에서 넘김), `fitMap()` 이 가로가 넉넉하다고 보면
  (`≥900px` 이고 가로>세로) `.eu-stage.wide` 로 지도 오른쪽에 섭니다. **'무엇이 있을까' 의 볼거리는 나라마다 다른 것만** —
  축구·왕·치즈처럼 두 나라에 있는 것을 넣으면 정답이 둘이 됩니다. **국기 찾기에서만 핀의 국기를 ❓ 로 가립니다**(`.hide-flags`)
  — 안 가리면 같은 그림 찾기가 됩니다. 폰에서도 돌아가지만(핀 31px) 세계 지도처럼 태블릿이 제격입니다.
  사진은 나라마다 한 장 `europe/<이름>.jpg`(800px, 4:3, `COUNTRIES[].img`)이고 스웨덴과 같은 규칙입니다 — **전부 위키미디어 공용
  (CC BY / CC BY-SA / CC0)이고 `europe/CREDITS.md` 가 출처 표, 바꾸면 그 표도 같이.** 고를 때 피한 것: 조각상(덴마크 인어공주 동상은
  조각이라 뉘하운으로), 밤의 에펠탑 조명(조명이 저작물), 사람 얼굴. 가로 화면(`.wide`)에서는 판이 세로로 쌓여 사진이 위에 280px,
  세로 화면에서는 사진이 왼쪽 160px(폰 112px)이고 판 높이는 화면의 25%(최대 250px) — 사진·글 넉 줄·칩 한 줄이 들어가는 높이입니다.
  **수수께끼(`riddle.html`)가 열한 번째**입니다 (2026-09-19) — 놀이 과목. 스웨덴 퀴즈(`askQuiz`)의 얼개를 그대로 떼어 온 것이고
  (위 판 `.fact-panel` 재사용, 보기 넉 장, 첫 보기가 정답), 다른 점은 **문제가 `js/riddles.js` 로 따로 있다**는 것입니다 — 그림책처럼
  부모가 계속 더할 것이라서요. 수수께끼와 넌센스를 나누지 않고 한 통에 섞습니다(정한 것). 풀어 본 문제는 `daniland.riddle.done` 에
  문제 글(`q`)로 기억해 두고 **안 풀어 본 것부터** 냅니다 — 문제에 id 가 없으니 `q` 를 고치면 그 문제는 새 문제가 됩니다 (의도된 것).
  문제는 소리로도 읽어 주므로 글로만 통하는 문제(글자 모양 말장난 등)는 안 됩니다. `why` 는 맞혔을 때 읽는 풀이라 넌센스에는 꼭 필요합니다.

  ⚠️ **세계 지도는 태블릿 전용입니다 — 이것은 버그가 아니라 정한 것입니다.** (2026-09-06)
  지리적으로 정확한 지도에서 한국은 가로의 4.5% 라서 폰(390px)에서는 16×18px 이 됩니다
  (손가락 최소 64px). 태블릿 세로 35×39px, 태블릿 가로 39×43px.
  **좌표를 넓히는 것으로는 못 고칩니다.** 확대·대륙→나라 2단계·국기 핀 같은 화면 설계를
  검토했지만, 지도를 정확하게 두는 쪽을 택하고 폰은 포기했습니다.
  고치겠다고 나라를 크게 그린 부정확한 지도로 되돌리지 마세요.

  ⚠️ **백 판의 칸은 누르는 곳이 아닙니다 — 이것도 정한 것입니다.** (2026-09-07)
  10열이라 폰(390px)에서 한 칸이 33px 이고, 태블릿에서도 46px 이라 손가락 최소 64px 에 못 미칩니다.
  그래서 판은 보여 주기만 하고 답은 **판 아래 숫자 카드 넉 장**에서 고릅니다.
  세계 지도와 달리 이건 잃는 게 없습니다 — '판에서 수를 찾는 것' 대신 '판의 자리를 읽는 것'
  으로 문제를 세우면 배우는 내용은 그대로입니다(`where` 놀이가 그렇습니다).
  **칸을 `<button>` 으로 바꾸지 마세요.**

### 글자 쓰기는 획 하나씩 본다 (write.js)

⚠️ **낱말도 글꼴 글자를 통째로 맞추는 게 아니라, 자모 획으로 조립해서 획 하나씩 봅니다.**
처음에는 연한 글꼴 글자 위에 덧그리고 '얼마나 덮었나'로 봤는데, 그러면 **'아' 를 '이' 라고 써도
통과**했습니다 — ㅏ 의 짧은 가로획은 글자 넓이의 4%쯤이라 덮은 비율로는 표가 안 납니다.
기준을 조이는 것으로는 못 고칩니다 (제대로 쓴 것까지 떨어집니다 — 실제로 재 봤습니다).

그래서 `syllableStrokes()` 가 글자를 초성·중성·종성으로 풀어 `JAMO` 의 획을 `BOXES` 의
제자리로 옮겨 붙입니다. 획이 하나라도 빠지면 그 칸은 끝나지 않습니다.
**글꼴 글자를 안내로 되돌리지 마세요.** 대신 자모 획 좌표(`CONSONANTS`/`VOWELS`)를 고치세요.

`BOXES` 는 중성이 세로(ㅏ ㅓ ㅣ …)냐 가로(ㅗ ㅜ ㅡ …)냐 × 받침 유무의 네 가지입니다.
획이 없는 자모(쌍자음 ㄲ, 이중모음 ㅘ, 겹받침 ㄳ)가 든 낱말은 `WORDS` 에 적어도 조용히 걸러집니다.

**영어 알파벳(`UPPER`/`LOWER`)도 같은 화면·같은 판정입니다** (2026-09-18). 묶음(`SETS`)에 `lang: 'en-US'` 와
`lines`(십자 대신 영어 공책 가로줄 0.14·0.46·0.78)가 붙고, `en: true` 인 묶음의 기록은 `daniland.best.write.en` 으로
갈라 영어 과목의 '알파벳 쓰기' 카드(`write.html?lang=en`)가 읽습니다. **시작 화면에는 들어온 카드의 묶음만 보입니다**
(`?lang=en` 이면 `en` 묶음만, 아니면 나머지만) — 아이가 '알파벳 쓰기' 를 눌렀는데 한글이 나오면 헷갈립니다. `PAGES` 에서 그 카드는 **한글 카드보다 뒤**에
있어야 합니다 — `Catalog.backHref()` 가 href 앞머리로 앞에서부터 찾기 때문입니다. 소문자는 `a` 로 읽히면 관사처럼
'어' 가 되는 목소리가 있어 `speak` 를 대문자로 둡니다. i·j 의 점은 `isDot()` 이 톡 찍기도 획으로 받습니다.

### 화면에 맞추는 배치는 JS 가 한다

`game.js` 의 `fitBoard()` 가 열 수와 카드 픽셀 크기를 계산해 `--card` CSS 변수로 넘깁니다.
어떤 놀이든 **스크롤 없이 한 화면에 들어오고, 줄이 고르게 채워지는 배치를 우선**하는 것이 규칙입니다.
CSS 에서 `.play-page .choice` 의 크기를 덮어쓰면 이 계산이 깨집니다 — `css/style.css` 에 그렇게 적힌
주석이 있으니 지키세요. 카드 아래 여백 계산에 `.tools` 줄 높이가 들어가므로 게임 화면에
요소를 새로 넣으면 `fitBoard()` 도 같이 봐야 합니다.

⚠️ **`--card` 는 화면마다 뜻이 다릅니다.** `:root` 에서는 카드 **색**(`#ffffff`)이고,
`game.js` 가 `play.html` 의 카드에 **픽셀 크기**로 덮어씁니다. 그래서 `calc(var(--card, …) * 0.46)`
같은 규칙(`.choice .art`)은 **`play.html` 밖에서는 조용히 깨집니다** — `calc(#ffffff * 0.46)` 이
되어 글자 크기가 기본값으로 떨어집니다. `numbers.html` 의 패턴 카드가 여기 걸려서
`.choice.emoji-card .art` 로 크기를 직접 적었습니다.

`numbers.js` 의 `groupEl()` 은 **그림을 다섯 개씩 `.grow` 줄로 끊습니다** — 스무 개도 한눈에
세이고 5의 배수 감각이 붙습니다. `flex-wrap` 으로 알아서 접게 두면 화면 폭에 따라 묶음 수가
달라져 이 효과가 사라지니 되돌리지 마세요. 대신 줄이 다섯 칸으로 차면(`.w5`) 카드 안에서
그림을 더 줄여야 합니다 — 폰의 카드 속은 142px 뿐이라 26px 짜리 다섯 개는 넘칩니다.
`.cards` 격자에 `minmax(0, 1fr)` 이 붙어 있는 것도 같은 이유입니다 (없으면 카드가 칸을 밀어 넓혀
화면 밖으로 나갑니다).

### 저장은 전부 localStorage (기기 한정, 서버 없음)

| 키 | 내용 |
|---|---|
| `daniland.best.<lessonId>.<mode>` | 수업별·놀이별 최고 별 |
| `daniland.best.numbers.<act>` | 수학 놀이별 최고 별 |
| `daniland.best.town.<act>` | 마을 지도 놀이별 최고 별 (시작 화면 단추에 표시) |
| `daniland.best.town` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.world.<act>` | 세계 지도 놀이별 최고 별 |
| `daniland.best.world` | 그중 제일 잘한 기록 |
| `daniland.best.write.<set>` | 글자 쓰기 묶음별(자음·모음·숫자·낱말·대문자·소문자) 최고 별 |
| `daniland.best.write` | 한글 묶음 중 제일 잘한 기록 (한글 카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.write.en` | 알파벳 묶음(대문자·소문자) 중 제일 잘한 기록 (영어의 '알파벳 쓰기' 카드가 읽습니다) |
| `daniland.best.make` | 글자 만들기 최고 별 |
| `daniland.best.hundred.<act>` | 백 판 놀이별(뛰어 세기·여기는 몇·앞뒤 수) 최고 별 |
| `daniland.best.hundred` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.trip.<act>` | 할머니 섬 여행 놀이별(탈것 여행·다니 돌보기) 최고 별 |
| `daniland.best.trip` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.ride.<act>` | 탈것 타기 놀이별(타기·문장 고르기·타고 내리기) 최고 별 |
| `daniland.best.ride` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.sweden.<act>` | 스웨덴 놀이별(무엇이 있을까·퀴즈) 최고 별 (알아보기는 점수가 없습니다) |
| `daniland.best.sweden` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.greece.<act>` `daniland.best.greece` `daniland.best.germany.<act>` `daniland.best.germany` | 그리스·독일 — 스웨덴과 같은 규칙 (나라 페이지는 `daniland.best.<id>`) |
| `daniland.best.europe.<act>` | 유럽 놀이별(찾아가기·무엇이 있을까·국기 찾기) 최고 별 (구경하기는 점수가 없습니다) |
| `daniland.best.europe` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.riddle` | 수수께끼 최고 별 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.riddle.done` | 수수께끼에서 맞혀 본 문제의 `q` 목록 — 안 풀어 본 문제부터 내는 데 씁니다 |
| `daniland.best.balloon.level` | 풍선 터뜨리기에서 도달한 최고 단계 |
| `daniland.book.<id>.made` | 영어 그림책에서 아이가 만든 책 — `{ 빈칸이름: word }` (책마다 마지막 것 하나) |
| `daniland.book.<id>.read` | 그 책을 끝까지 읽은 적 있음 (책장의 📖) |
| `daniland.book.last` `daniland.book.ko` | 마지막에 본 책 · 우리말 뜻 보이기 |
| `daniland.best.fish.level` | 낚시에서 도달한 최고 단계 (카드의 ⭐ 는 이것을 `bestUnit: '단계'` 로 읽습니다 — 풍선 터뜨리기와 같은 얼개) |
| `daniland.best.dodge.level` | 장애물 피하기에서 도달한 최고 단계 — 시작 단계 고르기에만 씁니다 (풍선 터뜨리기와 같은 얼개) |
| `daniland.best.dodge.m` | 장애물 피하기에서 제일 멀리 간 거리 — stars 가 m 입니다 (카드의 ⭐ 는 이것을 `bestUnit: 'm'` 으로 읽습니다) |
| `daniland.rank.dodge` | 장애물 피하기 순위표 — `[{ m, level, treats }, …]` 먼 순서로 다섯 개 (시작·결과 화면) |
| `daniland.best.maze.<n>` | 미로 찾기 판 크기별(5·7·9·11) 한 번에 찾은 적 있음 (1/1) |
| `daniland.best.maze` | 한 번에 찾은 것 중 제일 큰 판 — stars 가 칸 수(5~11)입니다 (카드의 ⭐ 는 이것을 `bestUnit: '칸 미로'` 로 읽습니다) |
| `daniland.mode` `daniland.numMax.<act>` `daniland.showLabel` `daniland.balloonStart` `daniland.dodgeStart` `daniland.fishStart` `daniland.townAct` `daniland.worldAct` `daniland.tripAct` `daniland.rideAct` `daniland.swedenAct` `daniland.greeceAct` `daniland.germanyAct` `daniland.europeAct` `daniland.numShow`(더하기·빼기·곱하기의 그림/식/둘 다) `daniland.writeSet` `daniland.makeLevel` `daniland.hundredAct` `daniland.hundred.<act>` `daniland.mazeSize` | 마지막에 고른 설정 |
| `daniland.numMax` | 수학 놀이가 넷뿐이던 시절의 숫자 범위 — 읽기만 합니다 (`numbers.js` 의 `loadMax()`) |
| `daniland.rate` `daniland.voice.<lang>` | 목소리·속도 |
| `daniland.drawer` | 그림 그리기 도장 서랍 접힘 상태 |
| `daniland.pass` | 비밀번호를 맞힌 기기 표시 (`js/gate.js`) |

`lesson.wordKo` 를 켜면 **놀이 세 가지 모두** `word`(영어) 대신 우리말(`ko`)을 보여 주고
우리말로 읽습니다 (`game.js` 의 `koCards()`). 국기 수업(193개국)이 이것을 씁니다 — 나라 이름을
우리말로 익히는 것이 목적이라, 영어로 하면 5살에게 너무 어려웠습니다.
`items` 의 영어 이름(`word`)은 데이터에 남아 있고 화면에만 안 나옵니다.
`setWordLength()` 는 **한글을 두 칸으로 세어** 긴 이름도 칸에 맞춥니다.

⚠️ **놀이(mode)를 새로 추가하면 `catalog.js` 의 `MODE_IDS` 배열에도 추가**해야 합니다.
안 그러면 새 놀이 기록이 카드의 ⭐ 최고 기록 계산에서 조용히 빠집니다.

### 소리

TTS 는 브라우저 내장 `speechSynthesis` 뿐이고 오디오 자산이 없습니다. `tts.js` 의 `score()` 가
`Natural`/`Neural`/`Online`/`Google` 이 붙은 목소리를 위로 올리고, 재생에 실패하면 다음 후보로
자동 폴백합니다. 첫 사용자 제스처에서 `TTS.unlock()`/`SFX.unlock()` 을 호출해야 모바일에서 소리가 납니다.

## 아이가 쓰는 화면이라는 제약

- 카드는 `CARD_MIN = 64px` 아래로 내려가지 않습니다 (손가락으로 못 누름).
- 정답 보기 숫자는 정답 근처에서 고릅니다 (`numbers.js` 의 `nearNumbers()`) — 찍어서 맞히기 어렵게.
- 👩‍🏫 처럼 결합 이모지는 `UI.countEmoji()` 로 **한 개**로 세야 그림이 작아지지 않습니다.
- 오답은 지우지 않고 흐리게 남긴 뒤 다시 들려줍니다. 실패를 벌하는 UI 를 넣지 마세요.
