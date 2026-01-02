# 규칙 문서 조합 지침

이 문서는 rules-loader.ts가 규칙 파일을 조합할 때 참조하는 런타임 지침입니다.

---

## 1. 우선순위 계층

```
Level 3 (최우선): 프로젝트 규칙
    ↓
Level 2: 주제별 규칙 (state/, mock/, query/, router/, runner/)
    ↓
Level 1: 테스트 유형 규칙 (test-type/)
    ↓
Level 0 (기본): 공통 규칙 (_common.md)
```

---

## 2. 로딩 순서

```
1. _common.md                     # 항상 로드
2. test-type/{testType}.md        # CLI --type 옵션 기반
3. runner/{testRunner}.md         # manifest.testRunner
4. state/{stateManagement}.md     # manifest.stateManagement
5. query/{queryLibrary}.md        # manifest.queryLibrary
6. mock/{mockStrategy}.md         # manifest.mockStrategy
7. router/{router}.md             # manifest.router
```

---

## 3. 충돌 해결 규칙

### 3.1 동일 Level 충돌

- 더 구체적인 scope를 가진 문서 우선
- 예: `zustand.md` > `state.md` (있다면)

### 3.2 다른 Level 충돌

- 상위 Level이 하위 Level을 완전히 Override
- Override 섹션에 명시된 Rule ID만 덮어씀

### 3.3 Override 적용 방식

```markdown
## Override
| Rule ID | 공통 규칙 | 본 문서 규칙 |
|---------|----------|-------------|
| CODE-003 | ... | ... |
```

- 명시된 Rule ID만 교체
- 나머지는 공통 규칙 유지

---

## 4. 조합 시 주의사항

### 4.1 none 값 처리

```yaml
stateManagement: none  # state/ 폴더에서 로드하지 않음
queryLibrary: none     # query/ 폴더에서 로드하지 않음
router: none           # router/ 폴더에서 로드하지 않음
```

### 4.2 파일 미존재 시

- 해당 규칙 파일이 없으면 skip
- 에러 발생시키지 않음
- 로그로 경고만 출력

### 4.3 Self-Check 병합

- 모든 로드된 파일의 Self-Check를 병합
- 중복 항목은 제거
- Rule ID 기준으로 그룹화

---

## 5. SKILL 파일 생성 규칙

### 5.1 test-implement SKILL

```
포함 규칙:
- _common.md (전체)
- test-type/{type}.md (전체)
- runner/{runner}.md (전체)
```

### 5.2 test-mock SKILL

```
포함 규칙:
- _common.md § Mock 원칙
- mock/{strategy}.md (전체)
- state/{state}.md § 스토어 모킹 (있다면)
- query/{query}.md § 쿼리 모킹 (있다면)
```

---

## 6. 디버그 모드

```bash
# 어떤 규칙이 로드되었는지 확인
npx @hsna/prompt gen --debug

# 출력 예시:
# [rules-loader] Loading: _common.md
# [rules-loader] Loading: test-type/ui.md
# [rules-loader] Loading: runner/vitest.md
# [rules-loader] Loading: state/zustand.md
# [rules-loader] Override: CODE-003 (from zustand.md)
```
