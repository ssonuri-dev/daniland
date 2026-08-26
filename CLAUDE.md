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
      ├ numbers.html?act=plus               numbers.js  (문제를 매번 생성, 놀이 4종)
      └ draw.html                           draw.js     (독립 — 다른 js 를 전혀 안 씀)
```

`play.html` 과 `numbers.html` 은 **모든 수업·모든 놀이가 함께 쓰는 한 개의 화면**입니다.
놀이별로 HTML 을 늘리지 마세요.

- **놀이 선택 위치가 둘이 다릅니다.** `game.js` 는 시작 오버레이에서 놀이+난이도를 고르고,
  `numbers.js` 는 과목 페이지의 카드(`?act=`)가 곧 놀이라 시작 화면에 숫자 범위만 나옵니다.
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

### 화면에 맞추는 배치는 JS 가 한다

`game.js` 의 `fitBoard()` 가 열 수와 카드 픽셀 크기를 계산해 `--card` CSS 변수로 넘깁니다.
어떤 놀이든 **스크롤 없이 한 화면에 들어오고, 줄이 고르게 채워지는 배치를 우선**하는 것이 규칙입니다.
CSS 에서 `.play-page .choice` 의 크기를 덮어쓰면 이 계산이 깨집니다 — `css/style.css` 에 그렇게 적힌
주석이 있으니 지키세요. 카드 아래 여백 계산에 `.tools` 줄 높이가 들어가므로 게임 화면에
요소를 새로 넣으면 `fitBoard()` 도 같이 봐야 합니다.

### 저장은 전부 localStorage (기기 한정, 서버 없음)

| 키 | 내용 |
|---|---|
| `daniland.best.<lessonId>.<mode>` | 수업별·놀이별 최고 별 |
| `daniland.best.numbers.<act>` | 수학 놀이별 최고 별 |
| `daniland.mode` `daniland.numMax` `daniland.showLabel` | 마지막에 고른 설정 |
| `daniland.rate` `daniland.voice.<lang>` | 목소리·속도 |
| `daniland.drawer` | 그림 그리기 도장 서랍 접힘 상태 |

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
