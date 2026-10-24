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

---

# Ralph Loop State — Timeline Maker v3 (색상 세부 편집)
> 시작: 2026-10-24 | 유형: Type B (기능 추가, 기존 배포본 위) | 종료 조건: `npm test` `# fail 0` + `check-size` exit 0 + 파일 ≤300줄·함수 ≤50줄 + export JSDoc | 결과: 달성 (Iteration 2)

## 판별식 상태 (루프 대상)
| AP ID | 설명 | 유형 | 상태 | 시도 | 최근 실패 사유 |
|-------|------|------|------|------|--------------|
| AP-022 | palette/era.color 정규화·마이그레이션·오염 방지 (5 tests) | Auto | ✅ pass | 1 | — |
| AP-023 | 렌더 루트 12변수·시대 색·CSS hex 금지·경계 재검증 (7 tests) | Auto | ✅ pass | 1 | — |
| AP-024 | THEME_PALETTES·PALETTE_PRESETS·resolvePalette (3 tests) | Auto | ✅ pass | 1 | — |
| AP-025 | 내보내기 색·CSP 1개·금지 패턴·주입 무효 (4 tests) | Auto | ✅ pass | 1 | — |
| AP-026 | serialize→parse 왕복 색 보존 (1 test) | Auto | ✅ pass | 1 | — |
| AP-034 | 편집 함수·모델 형태·MINIMAL_HIDDEN_TOKENS (5 tests) | Auto | ✅ pass | 1 | — |
| AP-027 | 전체 `npm test` fail 0 + check-size | Auto | ✅ pass | 1 (집계) | — |
| 회귀 | AP-001~013 (ap-008/009/011 포함), extra-* | Auto | ✅ pass | 1 | — |
| AP-NFR-SIZE | 파일 ≤300줄(최대 model.js 216), 함수 ≤50줄(최대 22), export JSDoc | NFR | ✅ pass | 1 | — |

루프 범위 밖 (메인 세션, 브라우저 필요): AP-028~032 (Semi), AP-033 (배포 🔒). 에이전트는 브라우저를 쓰지 않음.

## 현재 상태
- Iteration: 2 완료 (한도 5회 이내) | 통과율: 9/9 (100%) | 에스컬레이션: 없음
- 최종 `npm test`: `# tests 98` / `# pass 98` / `# fail 0` (시작 시 86 tests / 68 pass / 18 fail; 증가분은 import 실패로 1건으로만 집계되던 파일이 실제 테스트로 실행된 결과)
- `node scripts/check-size.mjs`: exit 0 (37개 파일 전부 ≤300줄)

## 루프 히스토리
### Iteration 0 (RED 확인)
- 86 tests / 68 pass / 18 fail (ap-008, 009, 022~026, 034, extra-schema, extra-render). 제공된 테스트는 수정하지 않음. SPEC과 모순되는 테스트 없음.

### Iteration 1 — 코어 모듈
- 구현: `src/palette.js`(PALETTE_TOKENS, cssVar, isHex, THEME_PALETTES, PALETTE_PRESETS 6종, resolvePalette, paletteOf, MINIMAL_HIDDEN_TOKENS), `src/palette-edit.js`(setEraColor, setPaletteColor, resetPaletteColor, resetPalette, applyPreset), `schema.js`(palettes·era.color 관대 정규화, own-property만 읽기, 키 순서 고정), `model.js`(createTimeline.palettes, addEra.color), `render.js`(루트 12변수, 시대 li 3변수, TIMELINE_CSS 전면 변수화·hex 0개), `export.js`(CSP meta), `example.js`(palettes/color 포함, 고전기 시대에 `#2a7f8e` 시연).
- 설계: THEMES를 model.js(의존성 리프)로 이동하고 schema.js에서 재export → schema↔palette 순환 import 방지. 테마·토큰은 `THEMES.includes`/`Set`으로만 판정(사용자 키로 객체 조회 없음). withThemeColors는 palettes를 THEMES 순서로 재구성하고 빈 테마를 제거.
- /verify: PASS — `npm test` 98/98, fail 0. 프리셋 가독성(WCAG 대비) 스크래치 점검: 본문류 최소 4.68:1(파스텔), 나머지 ≥4.95.
- 통과율: 9/9

### Iteration 2 — 앱 UI
- 구현: `src/dom.js`(h, button, THEME_LABELS 공용화), `src/color-controls.js`(색상 패널 12행·[기본값]·[모두 기본값]·프리셋 6, 시대 색 input+상태 문구+[테마 색]), `editor.js`(패널·시대 색 삽입, 테마 변경 시 폼 재구성+중복 이벤트 가드), `app.js`(`#save-warning` 지속 경고, objectURL 1000ms 후 해제·전역 보관 제거, 부팅 시 저장소 읽기 실패도 경고로), `index.html`, `style.css`(`[hidden]` 강제, 패널 반응형 그리드).
- /verify: PASS — `node --check` 전 파일, npm test 98/98, check-size exit 0, 함수·JSDoc 점검 OK, `innerHTML`은 미리보기 1곳뿐, TIMELINE_CSS hex 리터럴 0.
- 페이크 DOM 스모크(스크래치, 저장소 밖) 13항목 통과: 패널 12행/라벨/값, 입력 시 재구성 없음, 리셋·프리셋·테마 전환(minimal card/edge 숨김, 커밋 1회), 시대 색 설정/해제, `#save-warning` 유지·해소, objectURL 해제 시점(≈1005ms), 새로고침 복원, 읽기 실패 경고. 실제 브라우저 검증은 아님.
- 통과율: 9/9 (100%)

## 미해결 사항 / 주의 (메인 세션 /code-review·/verify 참고)
1. AP-028~032는 실제 브라우저(classic·dark)에서 확인 필요. 특히 색 input 연속 입력, 테마 select 전환 후 포커스, 모바일 폭 레이아웃.
2. 예제의 고전기 시대(4번째)에 `#2a7f8e`가 지정됨(밝은/어두운 테마 모두 약 4:1). AP-029에서 "다른 시대 불변" 확인 시 이 시대는 처음부터 테마 색이 아님.
3. 시대 색 미지정 시대의 색 input은 빌드 시점의 테마 강조색을 보여 준다. 패널에서 강조를 바꾸면 다음 재구성 전까지 그 견본이 이전 색일 수 있음(미리보기·내보내기는 정상, 표시용 견본만).
4. 루프 중 code-reviewer는 호출하지 않음(턴 예산 지시). ⚡ 다음 단계: `/code-review` → `/verify`. 설치·커밋·푸시 없음.
