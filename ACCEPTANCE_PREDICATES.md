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
