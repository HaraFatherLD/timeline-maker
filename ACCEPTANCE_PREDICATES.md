# Acceptance Predicates — Timeline Maker MVP v2
> 생성일: 2026-10-24 | 원본: SPEC.md v2 | 유형: Type A (새 프로젝트, 소규모)

**자동 AP 공통 통과 조건**: 지정 테스트 파일이 존재하고, `node --test <file>` 이 exit 0, 출력에 `# pass N`(N ≥ 1) 및 `# fail 0`.
파일이 없으면 node가 non-zero 종료 → 미통과. (실행 위치: `output/timeline-maker/`, reporter: `--test-reporter=tap`)

## 자동 검증 (Auto-verifiable)
- [x] `AP-001`: 시대 추가, 길이 +1, genId 주입 id (AC-1) — `node --test test/ap-001.test.js`
- [x] `AP-002`: 시대 수정/삭제, 대상 id만, 입력 불변 (AC-2) — `node --test test/ap-002.test.js`
- [x] `AP-003`: 사건 추가/수정/삭제, 해당 시대만 (AC-3) — `node --test test/ap-003.test.js`
- [x] `AP-004`: 시대·사건 이동 + 경계 무변화 (AC-4) — `node --test test/ap-004.test.js`
- [x] `AP-005`: 렌더 결과에 모든 필드 순서대로 (AC-5) — `node --test test/ap-005.test.js`
- [x] `AP-006`: 모든 문자열 필드 × 페이로드(`<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>`, `' onmouseover='x`)를 렌더·내보내기(본문+`<title>`)에서 검사, `<script>alert`·`<img` 미포함; JSON 경로로 id/theme에 `"><script>` 주입 시 재발급/classic (AC-6) — `node --test test/ap-006.test.js`
- [x] `AP-007`: 내보내기 문서 구조 + 금지 패턴 부재, fixture = `exampleTimeline` (AC-7) — `node --test test/ap-007.test.js`
- [x] `AP-008`: serialize→parse deepEqual (AC-8) — `node --test test/ap-008.test.js`
- [x] `AP-009`: 잘못된 입력 9종(① 파싱 불가 ② 1MB 초과 ③ 루트 비객체 ④ eras 누락 ⑤ eras 비배열 ⑥ 시대 요소 비객체 ⑦ 시대 필드 타입 오류 ⑧ events 비배열 ⑨ 사건 필드 타입 오류) `{ok:false}`·no throw, 중복/불량 id 재발급, 미지 theme→classic, 미지 키 제거, 길이 truncate (AC-9) — `node --test test/ap-009.test.js`
- [x] `AP-010`: 테마 3종 클래스 적용 (AC-11) — `node --test test/ap-010.test.js`
- [x] `AP-011`: 예제 유효 (normalize ok), 시대 ≥3, 각 사건 ≥1 (AC-14) — `node --test test/ap-011.test.js`
- [x] `AP-012`: safeFilename 규칙 전부 (AC-12) — `node --test test/ap-012.test.js`
- [x] `AP-013`: 전체 스위트 — `npm test` → `# fail 0`

## 반자동 검증 (Semi-auto) — 로컬 정적 서버 + chrome-devtools
- [x] `AP-014`: 입력 변경 → 미리보기 즉시 갱신 → reload 후 값 유지; localStorage에 `"{broken"` 주입 후 reload → 예제 표시·콘솔 error 0 (AC-10)
- [x] `AP-015`: 테마 select 변경 → 미리보기 루트에 `theme-<name>` (AC-11)
- [x] `AP-016`: HTML 다운로드 클릭 → 생성된 `<a download>` 파일명이 `safeFilename(title)`과 일치; 복사 클릭 → 상태 메시지가 "복사됨"(성공) 또는 "복사 실패"(권한 거부) 중 하나로 표시, 성공 시 클립보드 내용 = exportHtml 결과; 콘솔 error 0; 내보낸 HTML을 새 탭으로 열어 미리보기와 동일 텍스트 (AC-12, AC-13)
- [x] `AP-017`: 1280px → 2단, 400px → 1단, `document.documentElement.scrollWidth <= innerWidth` (AC-15)
- [x] `AP-018`: 전체 시나리오 중 콘솔 error 0
- [x] `AP-021`: 잘못된 JSON 파일 불러오기 → 에러 메시지 표시, 기존 시대 수·미리보기 텍스트 불변; 이어서 유효 JSON 불러오기 → 내용 교체 성공 (AC-16, AC-8)
- [ ] `AP-019`: `curl -s -o /dev/null -w "%{http_code}" https://harafatherld.github.io/timeline-maker/` → 200 (AC-17, 🔒 배포 승인 후)

## 수동 검증 (Manual)
- [x] `AP-020`: 원본 사이트 코드/문구/이름 미복제 — code-reviewer가 확인

## 비기능 검증 (NFR)
- [x] `AP-NFR-VALIDATION`: 외부 입력 경계(JSON 불러오기, localStorage 복원)가 모두 `normalizeTimeline` 경유 — AP-009 + AP-014 + code-reviewer 확인
- [x] `AP-NFR-SIZE`: 모든 소스 파일 ≤300줄 — `node scripts/check-size.mjs` → exit 0

## 메타데이터
- 총 AP 수: 23 (AP-021 신규)
- 자동: 13 | 반자동: 7 | 수동: 1 | NFR: 2
- 전체 통과 조건: 자동 100% + 반자동 100% + 수동 승인 + NFR 100%

---

# v3 Acceptance Predicates (SPEC v3)
> 공통 통과 조건 v1과 동일. 기존 AP-001~013은 회귀 AP로 계속 통과(ap-008/009/011 기대값은 v3 필드 포함으로 갱신).

## 자동
- [x] `AP-022` (≥5): palette 정규화 — 비객체·미지 테마·미지 토큰·무효 hex 제거, 대문자 → 소문자, 빈 테마 제거, JSON `__proto__` 입력 오염 없음, era.color 규칙(유효/대문자/무효/비문자열), v2 데이터 마이그레이션, 결과 키 목록 (AC-18) — `test/ap-022.test.js`
- [x] `AP-023` (≥4): 렌더 — 루트 style에 12변수가 PALETTE_TOKENS 순서로 모두 존재, override 반영·미override는 테마 기본, 미지 테마 classic, 시대 color → 해당 li에만 `--accent/--dot/--date`, color 없는 시대 style 없음, TIMELINE_CSS가 12변수를 모두 사용하고 테마 클래스에 hex 색 없음 (AC-19) — `test/ap-023.test.js`
- [x] `AP-024` (≥2): THEME_PALETTES 3종·PALETTE_PRESETS 6종 12토큰 전부 유효 hex, preset id/label 고정 목록, resolvePalette 리터럴 (AC-20) — `test/ap-024.test.js`
- [x] `AP-025` (≥3): exportHtml — 사용자 색·시대 색 포함, CSP meta 정확히 1개, 금지 패턴 없음, palette 값에 주입 시도(`red;}</style><script>`) 무효 처리 (AC-21) — `test/ap-025.test.js`
- [x] `AP-026` (≥1): serialize → parse 왕복 시 palettes·era.color deepEqual (AC-22) — `test/ap-026.test.js`
- [x] `AP-027`: 전체 `npm test` fail 0, `check-size` 통과

## 반자동 (격리 브라우저 컨텍스트)
- [x] `AP-028`: 색상 패널 12개 변경 → 미리보기 computed 색 반영, [기본값]/[모두 기본값], 테마 전환 시 테마별 색 유지, 새로고침 후 유지 (AC-23)
- [x] `AP-029`: 시대 색 지정 → 그 시대 점·기간·사건 날짜 색 변경, 다른 시대 불변, [테마 색]으로 복귀 (AC-23)
- [x] `AP-030`: 빠른 색 조합 6종 클릭 → 12변수 모두 해당 preset 값 (AC-23)
- [x] `AP-031`: localStorage 쓰기 실패 주입 → `#save-warning` 표시, HTML 복사 등 다른 상태 메시지 후에도 유지, 성공 저장 후 사라짐; 다운로드 후 objectURL 해제 확인 (AC-24)
- [x] `AP-032`: 내보낸 HTML을 열어 사용자 색 적용·콘솔 error 0 (AC-21)
- [ ] `AP-033`: 배포 URL 200 (AC-25, 승인됨: 완료 후 배포)

- [x] `AP-034` (≥4): 편집 함수(setEraColor·setPaletteColor·resetPaletteColor·resetPalette·applyPreset)·createTimeline/addEra 형태·MINIMAL_HIDDEN_TOKENS — `test/ap-034.test.js` (rev.2)

---
# v4 Acceptance Predicates — 구조 테마 8종
- [x] `AP-035` (≥4): 테마 레지스트리 — THEMES 11종 순서, THEME_LABELS 11종 고유 한국어, THEME_PALETTES 11×12 유효 소문자 hex·테마끼리 bg/accent 조합 고유, THEME_UNUSED_TOKENS 규칙, 미지 테마 → classic 렌더, 신규 8종 각각 TIMELINE_CSS에 `.theme-<id> .tl-era::before`와 `.theme-<id> .tl-event::before` 규칙 존재, zigzag의 `@container (max-width:600px)` 한 줄 전환 규칙 + `@supports not` 안의 `@media (max-width:640px)` 폴백 존재 — `test/ap-035.test.js`
- [x] `AP-036` (Semi): 11종 스크린샷 시트 — 시대 표시 모양이 테마별로 구분(■ ◆ ◎ ☐ 번호 등), 지그재그 좌우 배치, 카드 배지 선 없음
- [x] `AP-037` (Semi): 각 테마에서 바탕·강조 변경 반영, 빠른 색 조합 적용, 미사용 토큰 행 숨김(minimal 2, cards 1)
- [x] `AP-038` (Semi): 390px 폭 11종 가로 스크롤 없음, zigzag 한 줄 배치, 내보낸 HTML이 미리보기와 같은 구조
- [ ] `AP-039` (Semi): 배포 URL에 11종 반영
- 회귀: ap-010·ap-024의 테마 수 단언을 11종으로 갱신
