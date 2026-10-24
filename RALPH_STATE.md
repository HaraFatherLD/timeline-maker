# Ralph Loop State — Timeline Maker MVP v2
> 시작: 2026-10-24 19:18 | 유형: Type A (소규모) | 종료 조건: 자동 AP 전체 + AP-NFR-SIZE 통과 | 결과: 달성 (Iteration 4)

## 판별식 상태 (루프 대상: Auto 13개 + AP-NFR-SIZE)
"시도" = 해당 AP를 겨냥해 코드를 작성한 iteration 수.

| AP ID | 설명 | 유형 | 상태 | 시도 | 최근 실패 사유 |
|-------|------|------|------|------|--------------|
| AP-001 | 시대 추가 | Auto | ✅ pass | 1 | — |
| AP-002 | 시대 수정/삭제 | Auto | ✅ pass | 1 | — |
| AP-003 | 사건 추가/수정/삭제 | Auto | ✅ pass | 1 | — |
| AP-004 | 시대·사건 이동 | Auto | ✅ pass | 1 | — |
| AP-005 | 렌더 필드 순서 | Auto | ✅ pass | 1 | — |
| AP-006 | XSS 이스케이프 | Auto | ✅ pass | 1 | — |
| AP-007 | 내보내기 구조/금지 패턴 | Auto | ✅ pass | 1 | — |
| AP-008 | serialize→parse 왕복 | Auto | ✅ pass | 1 | — |
| AP-009 | 잘못된 입력 9종 + 정규화 | Auto | ✅ pass | 1 | — |
| AP-010 | 테마 3종 | Auto | ✅ pass | 1 | — |
| AP-011 | 예제 유효성 | Auto | ✅ pass | 1 | — |
| AP-012 | safeFilename | Auto | ✅ pass | 1 | — |
| AP-013 | 전체 스위트 `npm test` | Auto | ✅ pass | 1 (집계) | — |
| AP-NFR-SIZE | 파일 ≤300줄 | NFR | ✅ pass | 1 (집계) | — |

루프 범위 밖 (메인 세션 담당): AP-014~018, AP-021 (Semi, 브라우저), AP-019 (배포 🔒), AP-020 (Manual, code-reviewer), AP-NFR-VALIDATION.

## 현재 상태
- Iteration: 4 완료 (한도 5회 이내)
- 통과율: 14/14 (100%)
- 에스컬레이션: 없음 (동일 AP 연속 미통과 없음, 통과율 정체 없음)
- 최종 `npm test`: `# tests 73` / `# pass 73` / `# fail 0` (AP 테스트 40 + 추가 테스트 33)
- AP-NFR-SIZE: exit 0 (최대 파일 src/model.js 212줄; 함수 길이 휴리스틱 검사상 전부 30줄 이하)

## 계획 (iteration 5회 한도 내) — 실행 결과
1. model.js + escape.js (AP-001~004) — 완료
2. schema.js + example.js (AP-008, 009, 011) — 완료
3. render.js + export.js (AP-005, 006, 007, 010, 012) — 완료
4. index.html + style.css + src/app.js + src/editor.js, 전체 스위트 + AP-NFR-SIZE — 완료
5. 예비 — 사용하지 않음

## 루프 히스토리
### Iteration 0 (RED 확인)
- `npm test`: tests 12, pass 0, fail 12 (모듈 부재). Node v25.6.0.

### Iteration 1
- 구현: `src/escape.js`, `src/model.js` (의존성 리프: LIMITS, ID_PATTERN, defaultGenId, uniqueId 포함), 추가 테스트 `test/extra-model.test.js` (9건).
- /verify: PASS (AP-001~004 각각 exit 0, `# fail 0`)
- AP 평가: AP-001~004 ✅, 나머지는 모듈 미작성으로 ❌ (계획된 단계적 구현)
- 통과율: 4/14 (29%)

### Iteration 2
- 구현: `src/schema.js` (THEMES, normalizeTimeline, parseTimelineJson, serializeTimeline; 유효 id를 먼저 예약하는 2패스 재발급; 최상위 try/catch로 never-throw 보장), `src/example.js` (고대 그리스 5시대/15사건, 원작), 추가 테스트 `test/extra-schema.test.js` (12건).
- /verify: PASS (AP-008/009/011 각각 exit 0, `# fail 0`)
- 통과율: 7/14 (50%)

### Iteration 3
- 구현: `src/render.js` (renderTimeline + TIMELINE_CSS 3테마, 왼쪽 강조선), `src/export.js` (exportHtml, safeFilename), `clipText`를 model.js로 이동해 schema.js와 공유, 추가 테스트 `test/extra-render.test.js` (12건).
- 발견·수정: 내보내기 결과를 헤드리스 Chrome으로 렌더해 확인하던 중 CSS 결함 발견. 리셋 규칙 `.tl ol{margin:0;padding:0}`의 특이도가 `.tl-eras`보다 높아 margin:auto/padding-left를 덮어씀 → 마커가 화면 밖으로 잘리고 선 위치가 어긋남. `:where()`로 리셋 특이도를 0으로 낮춰 수정, classic/minimal에서 재확인. (테스트로는 잡히지 않는 유형이라 시각 확인이 필요했음.)
- /verify: PASS (AP-005/006/007/010/012 각각 exit 0; npm test 73/73)
- 통과율: 14/14 (UI 파일 추가 전 파일 세트 기준)

### Iteration 4
- 구현: `index.html`, `style.css`, `src/editor.js` (폼 DOM 빌더), `src/app.js` (상태·미리보기·자동저장·툴바). app.js 300줄 한도를 위해 코디네이터 허용에 따라 editor.js로 분리.
- 설계: 구조 변경(추가/삭제/이동/불러오기)에서만 폼 재구성, 타이핑은 commit만 호출(포커스·IME 유지); 구조 변경 후 data-key로 포커스 복원; 모든 입력에 maxlength 200/500/5000; localStorage try/catch + JSON.parse → normalizeTimeline 복원, 누락/손상 시 예제 폴백; JSON 불러오기 실패 시 상태 메시지만 갱신하고 현재 상태 유지; 지속형 hidden `<a id="download-link" download>`로 파일명 검사 가능; 복사 상태 정확히 "복사됨"/"복사 실패"; `innerHTML`은 미리보기 1곳뿐.
- /verify: PASS (`node --check` 전 src 파일 ok, npm test 73/73, check-size exit 0)
- 브라우저 검증: 미수행. 헤드리스 부팅 점검 명령이 권한 시스템에서 거부되어 재시도하지 않았고, 스크린샷은 코디네이터 지시로 생략. app.js/editor.js는 정적 검사만 거침.
- 최종 AP 평가: AP-001~013 ✅, AP-NFR-SIZE ✅
- 통과율: 14/14 (100%)

## 미해결 사항 / 주의 (메인 세션 /verify·/code-review 참고)
1. UI 동작은 브라우저에서 확인되지 않음 → AP-014~018, 021은 chrome-devtools로 확인 필요. 헤드리스 Chrome은 최소 창 너비(~500px)가 있어 400px 레이아웃(AP-017)은 실제 뷰포트 리사이즈로 확인해야 함.
2. SPEC 표기 `name, period, description: string(≤5000)`을 세 필드 모두 5000자 상한으로 해석 (사건의 date/title도 동일). 의도가 다르면 LIMITS와 maxlength만 바꾸면 됨.
3. "초기화"는 `window.confirm`을 사용 (자동화 시 다이얼로그 처리 필요). 기본 예제/JSON 불러오기는 확인 없이 덮어씀 (SPEC 문구 그대로).
4. localStorage 복원은 `JSON.parse` + `normalizeTimeline` (1,000,000자 제한은 파일 불러오기에만 적용 — 정상적인 큰 자동저장이 예제로 대체되는 것을 방지).
5. 루프 중 code-reviewer는 호출하지 않음 (코디네이터의 턴 예산 지시). ⚡ 다음 단계: `/code-review` → `/verify`.
6. 주어진 테스트 파일은 수정하지 않았고, SPEC과 모순되는 테스트는 발견하지 못함. 설치·커밋·푸시 없음.
