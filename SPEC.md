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
