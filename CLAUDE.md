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

필드의 의미와 예시는 `js/data.js` 상단 주석과 README 의 "새 수업 추가하기"에 이미 정리돼 있습니다.

### 화면 흐름

```
index.html            과목 카드            home.js
 └ subject.html?name=영어   수업·놀이 카드   subject.js
      ├ play.html?lesson=en-fruits          game.js     (수업 데이터 기반, 놀이 5종)
      ├ numbers.html?act=plus               numbers.js  (문제를 매번 생성, 놀이 7종)
      ├ hundred.html                        hundred.js  (1~100 백 판, 놀이 3종)
      ├ town.html                           town.js     (지도 그림 town.jpg 위, 놀이 3종)
      ├ world.html                          world.js    (지도 그림 world.jpg 위, 놀이 3종)
      ├ trip.html                           trip.js     (풍경 그림 trip.jpg 위, 놀이 2종 — 영어 문장·대화)
      ├ write.html                          write.js    (글자 따라 쓰기, 묶음 4종)
      ├ make.html                           make.js     (자음+모음으로 글자 조립)
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
| `daniland.best.write.<set>` | 글자 쓰기 묶음별(자음·모음·숫자·낱말) 최고 별 |
| `daniland.best.write` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.make` | 글자 만들기 최고 별 |
| `daniland.best.hundred.<act>` | 백 판 놀이별(뛰어 세기·여기는 몇·앞뒤 수) 최고 별 |
| `daniland.best.hundred` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.trip.<act>` | 할머니 섬 여행 놀이별(탈것 여행·다니 돌보기) 최고 별 |
| `daniland.best.trip` | 그중 제일 잘한 기록 (카드의 ⭐ 는 이것을 읽습니다) |
| `daniland.best.balloon.level` | 풍선 터뜨리기에서 도달한 최고 단계 |
| `daniland.mode` `daniland.numMax.<act>` `daniland.showLabel` `daniland.balloonStart` `daniland.townAct` `daniland.worldAct` `daniland.tripAct` `daniland.writeSet` `daniland.makeLevel` `daniland.hundredAct` `daniland.hundred.<act>` | 마지막에 고른 설정 |
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
