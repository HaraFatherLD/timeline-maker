# Feature Spec: Timeline Maker (MVP v2)

> 버전: v2 | 작성일: 2026-10-24 | 상태: Draft (v1 spec-reviewer BLOCK 반영)

## 목적
브라우저에서 시대(Era)/사건(Event) 정보를 입력하면 타임라인을 실시간으로 미리보고,
결과를 **외부 의존성 없는 단일 HTML 파일**로 내려받아 어디서든 열어볼 수 있게 한다.
GitHub Pages(`HaraFatherLD/timeline-maker`)로 배포한다.

> 참고 사이트의 **기능 구성만 참고**하며 코드·문구·이름은 독자 작성한다. [K] 원본 라이선스 미표기.

## 사용자 스토리
AS A 타임라인을 만들고 싶은 사용자
I WANT 폼에 시대와 사건을 입력하고 우측에서 바로 결과를 보며
SO THAT 완성된 타임라인을 HTML 파일로 받아 공유/보관할 수 있다

## 파일 레이아웃
```
output/timeline-maker/        ← 독립 git 저장소 루트 = Pages 루트 (main 브랜치, /)
  index.html  style.css  package.json ("type":"module", "scripts.test":"node --test --test-reporter=tap \"test/*.test.js\"")
  src/escape.js  src/model.js  src/schema.js  src/render.js  src/export.js  src/example.js  src/app.js
  test/ap-0NN.test.js          ← AP별 테스트 파일
  scripts/check-size.mjs       ← 파일 줄 수 검사
```

## 데이터 모델 & 스키마 규칙
```
Timeline { title: string(≤200), subtitle: string(≤500), theme: Theme, eras: Era[](≤200) }
Era      { id: string, name, period, description: string(≤5000), events: Event[](≤500) }
Event    { id: string, date, title, description: string(≤5000) }
Theme    = 'classic' | 'dark' | 'minimal'
```
`normalizeTimeline(raw, genId)` 규칙 (JSON 불러오기 · localStorage 복원 공통 경계):
- 루트가 객체가 아니거나 `eras`가 없거나 배열이 아니면 → `{ok:false, error}`
- `eras`/`events`의 요소가 (null 아닌, 배열 아닌) 객체가 아니면 → `{ok:false, error}`
- 문자열 필드: 누락/`undefined` → `''`, 문자열 아닌 값(숫자·객체 등) → `{ok:false, error}`
- 길이 상한 초과 → 잘라냄(truncate)
- `events` 누락 → `[]`, 배열 아님 → `{ok:false, error}`
- `theme`: 화이트리스트 외 값 → `'classic'`
- `id`: 문자열 아님/빈 값/형식 위반(`^[A-Za-z0-9_-]{1,64}$` 불일치)/전체 문서 내 중복(먼저 나온 것 유지) → `genId()`로 재발급, 재발급 값이 이미 쓰인 id면 재시도
- 화이트리스트 외 키는 제거(재구성)
- 성공 시 `{ok:true, value}`, **절대 throw하지 않음**
`parseTimelineJson(text, genId)`: 문자열 길이 > 1,000,000 → 에러, JSON.parse 실패 → 에러, 이후 normalize.

## 모듈 API (순수 함수, 입력 객체 불변 — 항상 새 객체 반환)
- `escape.js`: `escapeHtml(s)` — `& < > " '` → `&amp; &lt; &gt; &quot; &#39;`
- `model.js`: `createTimeline()`, `addEra(tl, data={}, genId)`, `updateEra(tl, eraId, patch)`, `removeEra(tl, eraId)`,
  `addEvent(tl, eraId, data={}, genId)`, `updateEvent(tl, eraId, eventId, patch)`, `removeEvent(tl, eraId, eventId)`,
  `moveEra(tl, eraId, dir)`, `moveEvent(tl, eraId, eventId, dir)` (dir: -1 위 / +1 아래). 존재하지 않는 id → 원본과 동일 내용 반환.
  `genId` 기본값: `crypto.randomUUID()` (없으면 `Date.now`+`Math.random` 기반 폴백, 항상 id 정규식 만족).
- `schema.js`: `THEMES`, `normalizeTimeline`, `parseTimelineJson`, `serializeTimeline(tl)` (JSON.stringify, 2-space)
- `render.js`: `renderTimeline(tl)` → `<div class="tl theme-<theme>">…</div>` HTML 문자열. 모든 사용자 값 escapeHtml. `TIMELINE_CSS` 문자열 export.
- `export.js`: `exportHtml(tl)` → 완전한 문서. `safeFilename(title)` → `<이름>.html`
- `example.js`: `exampleTimeline(genId)` → 유효한 Timeline(시대 ≥3, 각 사건 ≥1)
- `app.js`: DOM 바인딩 (유일한 DOM 의존 모듈)

## 수용 기준 (Acceptance Criteria)
- [ ] AC-1 GIVEN 빈 타임라인 WHEN 시대 추가 THEN eras 길이 +1, 주입된 genId로 고유 id 부여
- [ ] AC-2 GIVEN 시대 WHEN 수정/삭제 THEN 해당 id만 변경/제거, 입력 객체 불변
- [ ] AC-3 GIVEN 시대 WHEN 사건 추가/수정/삭제 THEN 해당 시대 events만 변경
- [ ] AC-4 GIVEN 시대 2+ WHEN 위/아래 이동 THEN 순서 교환, 경계에서는 무변화 (사건 동일)
- [ ] AC-5 GIVEN 타임라인 WHEN 렌더 THEN 제목·부제·시대명·기간·설명·사건 날짜/제목/설명이 입력 순서대로 출력
- [ ] AC-6 GIVEN 모든 문자열 필드(title, subtitle, era.name/period/description, event.date/title/description)와 id·theme에 XSS 페이로드 WHEN 렌더/내보내기(본문 + `<title>`) THEN 이스케이프되어 실행 가능한 태그/속성이 생기지 않음
- [ ] AC-7 GIVEN 타임라인 WHEN HTML 내보내기 THEN `<!doctype html>`로 시작, `<meta charset="utf-8">`·viewport 포함, `<style>` 인라인, `<script`·`<link`·`src=`·`href=`·`url(`·`@import` 없음
- [ ] AC-8 GIVEN 타임라인 WHEN serialize → parse THEN deepEqual 복원
- [ ] AC-9 GIVEN 잘못된 입력(파싱 불가, 1MB 초과, eras 누락/비배열, 시대/사건 필드 타입 오류, events 비배열) WHEN parse THEN `{ok:false}`·throw 없음; 중복/불량 id는 재발급; 미지 theme는 classic; 미지 키 제거
- [ ] AC-10 GIVEN 편집기 WHEN 입력 변경 THEN 미리보기 즉시 갱신 + localStorage 자동 저장, 새로고침 후 복원. 손상된 localStorage 값이면 예제로 폴백
- [ ] AC-11 GIVEN 테마 3종 WHEN 선택 THEN 미리보기·내보내기에 `theme-<name>` 적용
- [ ] AC-12 GIVEN 편집기 WHEN "HTML 다운로드" THEN `safeFilename(title)` 이름으로 다운로드, 단독으로 열어 동일 내용 표시. safeFilename: `\/:*?"<>|`·제어문자 제거, 앞뒤 공백/끝 점 제거, Windows 예약어(CON, PRN, AUX, NUL, COM1-9, LPT1-9)는 `_` 접미, 100자 상한, 빈 결과 → `timeline.html`
- [ ] AC-13 GIVEN 편집기 WHEN "HTML 복사" THEN 클립보드 복사, 실패 시 상태 메시지 표시
- [ ] AC-14 GIVEN 편집기 WHEN "기본 예제" THEN 예제 로드 (시대 ≥3)
- [ ] AC-15 GIVEN 폭 ≥900px THEN 좌 편집기/우 미리보기 2단, 미만은 1단, 가로 스크롤 없음
- [ ] AC-16 GIVEN 잘못된 JSON 파일 WHEN 편집기에서 불러오기 THEN 에러 메시지 표시, 기존 편집기·미리보기 내용 유지
- [ ] AC-17 GIVEN 배포 완료 WHEN `https://harafatherld.github.io/timeline-maker/` 접속 THEN HTTP 200

## 기술 제약
- 런타임 의존성 0, 빌드 단계 없음. 테스트는 Node 내장 `node:test` (Node ≥20).
- 폼 입력에는 스키마 상한과 같은 `maxlength` 지정 (복원 시 조용한 잘림 방지). localStorage 쓰기 실패 시 상태 표시줄에 안내.
- `innerHTML`에는 `renderTimeline` 결과만 사용. 편집기 폼은 DOM API(`textContent`/`value`)로 구성.
- 파일 ≤300줄, 함수 ≤50줄.

## 배포 절차
`output/timeline-maker`가 독립 git 저장소 루트. GitHub REST API로 `HaraFatherLD/timeline-maker`(public) 생성 →
`git push origin main` → Pages API로 source `main` `/` 활성화. 🔒 사용자 승인 후 실행.

## 범위 제외 (v2 이후)
- 드래그 앤 드롭, 테마 10종, 사용자 색상, 웹폰트, HTML 붙여넣기 가져오기, 앱 UI 다크/라이트 토글

## 리스크
- [K] Fine-grained PAT 권한(Administration/Contents/Pages write) 부족 시 배포 실패 → 사용자 수동 조치
- [I] localStorage 차단 환경 → try/catch로 무시
- [I] Clipboard API 실패 → 상태 메시지 안내

---

# v3 — 색상 세부 편집 (2026-10-24, 사용자 승인: 시대별 색·빠른 색 조합 6종·리뷰 LOW 3건 포함, 대비 경고 제외, 완료 후 배포)

## 색상 토큰 (`src/palette.js`, 순수)
`PALETTE_TOKENS` (순서 고정, CSS 변수명 = `--<token>`):
| token | 의미 | 사용처 |
|---|---|---|
| bg | 바탕 | `.tl` 배경, 점 테두리 |
| title | 제목 글자 | `.tl-title` |
| subtitle | 부제 글자 | `.tl-subtitle` |
| fg | 본문 글자 | 본문·사건 제목 |
| muted | 보조 글자 | 사건 설명 |
| line | 세로 선 | `.tl-eras::before` |
| accent | 강조 | 시대 점, 시대 카드 왼쪽 테두리, 기간 글자 |
| dot | 사건 점 | `.tl-event::before` 테두리 |
| card | 시대 카드 배경 | `.tl-era-head` |
| edge | 시대 카드 테두리 | `.tl-era-head` 테두리 |
| eraName | 시대 제목 글자 | `.tl-era-name` (CSS 변수 `--era-name`) |
| date | 사건 날짜 글자 | `.tl-date` |
- CSS 변수명: camelCase 토큰은 kebab-case로(`eraName` → `--era-name`). `PALETTE_TOKENS`는 토큰명 배열, `cssVar(token)`이 변수명.
- `THEME_PALETTES`: classic/dark/minimal 각각 12토큰 모두 `#rrggbb`(minimal의 card·edge는 `#ffffff`; minimal 전용 CSS가 카드 배경·테두리를 계속 제거). v2의 기존 색은 그대로 유지(classic bg `#f6f1e7` 등), title·eraName 기본 = 해당 테마 fg, subtitle 기본 = muted, dot·date 기본 = accent.
- `PALETTE_PRESETS`: 정확히 6개 `{id, label, colors}` — id `ocean`·`forest`·`sunset`·`mono`·`pastel`·`parchment`, label `바다`·`숲`·`노을`·`흑백`·`파스텔`·`고문서`, colors는 12토큰 전부 유효 hex. (원작 색 조합)
- `resolvePalette(theme, overrides)` → 12토큰 완전한 객체: `THEME_PALETTES[theme]`(미지 테마 → classic) 위에 overrides의 유효 토큰만 덮어씀.

## 데이터 모델 추가 (`normalizeTimeline`, 모두 관대 — 무효 → 기본값, `ok:false` 아님)
- `palettes`: `{ [theme]: { [token]: '#rrggbb' } }`. 비객체 → `{}`. 키는 `THEMES`만 own-property로, 값 객체의 키는 `PALETTE_TOKENS`만, 값은 `^#[0-9a-fA-F]{6}$` → 소문자, 무효 제거, 빈 객체가 된 테마 키 제거. 프로토타입 오염 없음.
- `era.color`: `''` 또는 `#rrggbb`(소문자). 그 외(비문자열 포함) → `''`.
- 결과 객체 키: 루트 `title, subtitle, theme, palettes, eras` / 시대 `id, name, period, description, color, events`.
- v2 데이터(위 필드 없음)는 `palettes: {}`, `color: ''`로 마이그레이션.

## 렌더 (`renderTimeline`)
- 루트: `<div class="tl theme-<t>" style="<12개 --var:#hex를 PALETTE_TOKENS 순서로 ;로 연결>">` — 항상 12개 모두 출력(resolvePalette 결과).
- 시대에 color가 있으면 `<li class="tl-era" style="--accent:#c;--dot:#c;--date:#c">`, 없으면 style 속성 없음.
- `TIMELINE_CSS`: 테마 클래스는 폰트 등 비색상 규칙만 남기고, 모든 색은 위 변수 사용. `url(`·`@import` 금지 유지.

## 내보내기 (`exportHtml`)
- 같은 renderTimeline 결과 사용 → 사용자 색이 그대로 반영.
- `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">` 추가(리뷰 LOW).
- 기존 금지 패턴(`<script`, `<link`, `src=`, `href=`, `url(`, `@import`) 유지.

## 앱 UI
- **색상 패널**(테마 선택 아래): 12토큰 color input(한국어 라벨) + 각 [기본값], [모두 기본값], 빠른 색 조합 버튼 6개(현재 테마의 palettes 덮어쓰기). 현재 테마 기준으로 표시·저장 — 테마를 바꾸면 그 테마의 색으로 전환.
- **시대 편집기**: 시대마다 [색 input] + [테마 색] 버튼(color='' 로), 상태 문구 "테마 색 사용 중" 또는 색 코드.
- **리뷰 LOW 반영**: (1) 다운로드 objectURL은 클릭 직후 해제(`setTimeout(…,0)`), 전역 보관 없음 (2) 자동 저장 실패 시 별도 경고 영역(`#save-warning`)에 표시하고 다음 저장 성공 때까지 유지(다른 상태 메시지가 덮지 않음).
- 모든 색 값은 input → normalize 경유. DOM 구성은 기존처럼 createElement/textContent, 미리보기 innerHTML은 renderTimeline 결과만.

## v3 수용 기준
- AC-18 팔레트 정규화·마이그레이션·오염 방지
- AC-19 렌더 루트 12변수, 시대 색 변수, 테마 기본값
- AC-20 빠른 색 조합 6종 완전성
- AC-21 내보내기에 사용자 색·CSP 반영, 금지 패턴 없음
- AC-22 JSON 저장→불러오기 왕복 시 색 보존
- AC-23 색상 패널·시대 색·색 조합·테마 전환 UI 동작, 새로고침 유지
- AC-24 objectURL 즉시 해제, 저장 실패 경고 유지
- AC-25 배포 URL 200

## v3 rev.2 — spec-reviewer BLOCK 반영 (이 절이 v3 절보다 우선)
- **렌더 경계 재검증(보안)**: `palette.js`의 `isHex(v)` = 문자열이고 `^#[0-9a-fA-F]{6}$`. `resolvePalette`는 **토큰 이름이 PALETTE_TOKENS이고 값이 isHex인 경우에만** 덮어쓰며 결과는 소문자. `renderTimeline`은 시대 color도 `isHex`일 때만(소문자로) style을 출력. 정규화를 거치지 않은 객체가 들어와도 style 속성에는 `#rrggbb`만 들어간다.
- **편집 함수(순수, `src/palette-edit.js`)** — 모두 입력 불변, 새 객체 반환, 무효 입력이면 동일 내용 반환:
  - `setEraColor(tl, eraId, color)`: color가 `''`이면 해제, isHex면 소문자 저장, 그 외 무변화.
  - `setPaletteColor(tl, theme, token, color)`: theme∈THEMES, token∈PALETTE_TOKENS, isHex일 때만 `palettes[theme][token]` 저장.
  - `resetPaletteColor(tl, theme, token)`: 해당 키 삭제, 테마 객체가 비면 테마 키 삭제.
  - `resetPalette(tl, theme)`: `palettes[theme]` 삭제.
  - `applyPreset(tl, theme, presetId)`: 알려진 preset이면 `palettes[theme]` = preset colors 복사본, 아니면 무변화.
- **model.js**: `createTimeline()` → `{title:'', subtitle:'', theme:'classic', palettes:{}, eras:[]}`, `addEra`의 새 시대는 `color:''` 포함(키 순서 id, name, period, description, color, events). `updateEra`는 color를 바꾸지 않는다(색은 setEraColor 전용).
- **정규화 결과 키 순서**: 루트 `title, subtitle, theme, palettes, eras` / 시대 `id, name, period, description, color, events`.
- **minimal 테마**: `MINIMAL_HIDDEN_TOKENS = ['card','edge']`(minimal은 카드 배경·테두리를 그리지 않음) — 색상 패널에서 minimal일 때 이 2개는 숨긴다. accent(기간 글자)·dot(사건 점)은 minimal에서도 사용된다.
- **CSS**: `TIMELINE_CSS` 전체에 hex 색 리터럴(`#[0-9a-fA-F]{3,8}`)이 없어야 한다(모든 색은 변수).
- **함께 갱신되는 기존 테스트**: ap-008, ap-009, ap-011(예제가 v3 필드 포함), `extra-schema.test.js`(키 목록·순서·재직렬화 비교), `extra-render.test.js`(루트 style 속성), `extra-model.test.js`(createTimeline·addEra 형태 단언이 있으면).
- **objectURL**: 클릭 후 1000ms 뒤 해제(즉시 해제는 일부 브라우저에서 다운로드 취소 가능 [A]). AP-031은 `URL.revokeObjectURL` 스파이로 확인.
- AP-028·AP-029의 색 반영 브라우저 확인은 classic·dark 테마에서 수행.
- 신규 자동 AP: `AP-034` (≥4) 편집 함수·모델 형태 — `test/ap-034.test.js`.
- (rev.3) `isHex`는 `typeof v === 'string'` 검사 후 정규식 적용(배열 등 비문자열 거부). 저장·출력 hex는 항상 소문자 `#rrggbb`.
- (rev.3) `applyPreset`·`resetPalette`·`resetPaletteColor`도 theme∈THEMES(배열 includes)가 아니면 무변화. `resolvePalette`의 테마 판정도 `THEMES.includes`.
- (rev.3) `serializeTimeline`은 정규화하지 않고 입력을 그대로 JSON화한다. AP-023의 hex 금지 검사는 `TIMELINE_CSS` 전체가 대상.

---

# v4 — 구조가 다른 테마 8종 추가 (2026-10-25, 사용자 승인: 목록대로, 완료 후 배포)

## 테마 목록
`THEMES` (순서 고정, 첫 값이 폴백):
`classic, dark, minimal, block, diamond, zigzag, metro, notebook, cards, newspaper, terminal`

`THEME_LABELS`(UI 표시): 클래식, 다크, 미니멀, 블록, 다이아, 지그재그, 노선도, 노트, 카드 배지, 신문, 터미널

| id | 시대 표시 (`.tl-era::before`) | 사건 표시 (`.tl-event::before`) | 선·배치 | 글꼴·카드 |
|---|---|---|---|---|
| block | 채운 정사각형 | 작은 채운 정사각형 | 굵은 실선(8px 내외) | 각진 카드(radius 0), 굵은 산세리프 |
| diamond | 45° 회전 정사각형(마름모) | 빈 마름모 | 점선(`repeating-linear-gradient`) | 세리프, 얇은 테두리 카드 |
| zigzag | 큰 원 | 작은 원 | **가운데 세로선**, 시대가 좌우 번갈아 배치(`nth-child`) — 타임라인 영역 폭 ≤ 600px이면 왼쪽 선 한 줄 배치로 전환(컨테이너 쿼리), 미지원 브라우저는 뷰포트 ≤ 640px 폴백 | 둥근 카드 |
| metro | 이중 원(두꺼운 테두리 + 안쪽 원, 정류장) | 작은 흰 원 정류장 | 매우 굵은 노선(10px 이상), 둥근 끝 | 산세리프, 카드 없이 이름 강조 (특정 회사 디자인 아님) |
| notebook | 체크박스(빈 정사각형 테두리) | 짧은 가로 대시 | 줄 노트 배경(`repeating-linear-gradient` 가로줄) + 왼쪽 여백선 | 손글씨 느낌 시스템 글꼴 스택(없으면 일반 글꼴), 카드 배경 투명 |
| cards | CSS counter 번호 배지(①처럼 원 안 숫자) | 작은 점 글머리 | **세로선 없음**, 그림자 카드 묶음 | 산세리프 |
| newspaper | 날짜 도장 박스(테두리 사각 + 기간 강조) | `▸` 글머리 | 이중 괘선(상하 border double) | 세리프, 칼럼 느낌 |
| terminal | `>` 프롬프트 문자 | `-` 문자 | ASCII 선 느낌(점선/`│` 문자) | 고정폭 글꼴, 카드 테두리 점선 |

- 모든 모양은 CSS만으로(`clip-path`, `border`, `transform`, `::before`/`::after`, `content`, `counter`). **마크업(renderTimeline)은 변경하지 않는다** — 테마는 루트 클래스 `theme-<id>`로만 달라진다.
- 모든 색은 기존 12 토큰 변수 사용(hex 리터럴 금지 유지). 각 테마는 `THEME_PALETTES`에 고유 기본 12색을 가진다(원작 색 조합).
- `THEME_UNUSED_TOKENS`(palette.js): 테마별로 화면에 쓰이지 않는 토큰 목록 — `minimal: ['card','edge']`, `cards: ['line']`, 그 외 `[]`. 색상 패널은 현재 테마의 미사용 토큰 행을 숨긴다. `MINIMAL_HIDDEN_TOKENS`는 `THEME_UNUSED_TOKENS.minimal`과 같은 값으로 유지(하위 호환).
- 빠른 색 조합·시대별 색·테마별 팔레트 저장은 11종 모두에서 동작.
- 반응형: 모든 테마가 폭 360px에서 가로 스크롤 없음. zigzag는 타임라인 영역 폭이 ≤600px일 때 한 줄 배치(컨테이너 쿼리 `@container`, 편집기 2단 레이아웃의 좁은 미리보기 칸에서도 전환), 컨테이너 쿼리 미지원 브라우저는 `@supports not` 안의 뷰포트 ≤640px `@media`로 폴백.
- 인쇄(`@media print`)에서 모든 테마 내용이 잘리지 않음.

## v4 수용 기준
- AC-26 테마 11종 등록·라벨·폴백
- AC-27 11종 × 12토큰 기본 색 완전·유효, 미사용 토큰 목록
- AC-28 테마별 구조 CSS 존재(시대/사건 표시 규칙), CSS hex 금지 유지
- AC-29 브라우저: 11종 스크린샷이 서로 구조적으로 구분, 색 변경 반영, 390px·zigzag 한 줄 전환, 내보낸 HTML 동일
- AC-30 배포 URL 반영
- (v4 rev.2) `THEME_UNUSED_TOKENS`: `minimal: ['card','edge']`, `metro: ['card','edge']`(카드 없음), `notebook: ['card']`(카드 투명, 테두리는 여백선으로 사용), `cards: ['line']`, 나머지 `[]`.
- (v4 rev.2) 테마 CSS는 `src/theme-css.js`(테마별 문자열을 모아 export)로 분리하고 `render.js`가 조합해 `TIMELINE_CSS`로 재export. 파일당 300줄 이하. CSS 이스케이프(`\2460` 등) 대신 글리프를 직접 쓴다(JS 템플릿 리터럴 SyntaxError 방지). zigzag의 한 줄 전환 규칙(`@container` 및 폴백 `@media`)은 해당 테마 기본 규칙보다 뒤에 둔다. newspaper 도장은 `.tl-era-period` 테두리로 구현.
- (v4 rev.3, code-review 반영) **zigzag 한 줄 전환 기준**: zigzag 루트에만 `.theme-zigzag{container-type:inline-size}`를 두고(다른 테마 CSS는 불변), 한 줄 배치 규칙을 `@container (max-width:600px){…}`에 둔다 — 타임라인 영역 폭이 ≤600px이면 전환(내보낸 페이지에서 600px는 뷰포트 640px − 좌우 패딩 40px과 같음). 컨테이너 쿼리 미지원 브라우저용으로 같은 규칙 본문을 `@supports not (container-type:inline-size){@media (max-width:640px){…}}`에도 둔다(폴백 필수). 뷰포트 기준 단독 `@media`는 편집기 2단 레이아웃의 좁은 미리보기 칸(약 420~640px)에서 전환되지 않아 쓰지 않는다.
- (v4 rev.3) **글꼴 스택**: 모든 글꼴 스택은 마지막 일반 글꼴(`serif`/`sans-serif`/`monospace`) 앞에 한글 글꼴(`Malgun Gothic`, `Apple SD Gothic Neo`, `Noto Sans KR` 등)을 둔다. terminal은 `… "Courier New","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",monospace`.
- (v4 rev.3) zigzag 카드(`.tl-era-head`)는 padding을 덮어쓰지 않아 기본값과 ≤520px 모바일 padding이 그대로 적용된다. classic·dark·minimal은 v3와 동일해야 하며 `test/extra-base-theme.test.js`(스냅샷 `test/pre-v4-snapshot.js`)가 이를 지킨다.
