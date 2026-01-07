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
3. runner/_shared.md              # 테스트 러너 공통 규칙 (항상 로드)
4. runner/{testRunner}.md         # manifest.testRunner
5. state/{stateManagement}.md     # manifest.stateManagement
6. query/{queryLibrary}.md        # manifest.queryLibrary
7. mock/{mockStrategy}.md         # manifest.mockStrategy
8. router/{router}.md             # manifest.router
9. {optionalRules}                # manifest.optionalRules 배열의 각 항목
```

### 2.1 _shared.md 로딩 규칙

- `runner/_shared.md`는 `testRunner` 값에 관계없이 항상 로드
- `rules-loader.ts`의 `RULE_MODULES`에서 배열로 정의:
  ```typescript
  testRunner: {
    vitest: ['rules/runner/_shared.md', 'rules/runner/vitest.md'],
    jest: ['rules/runner/_shared.md', 'rules/runner/jest.md'],
  }
  ```
- 배열의 순서대로 로드 (공통 → 특정)

### 2.2 optionalRules 처리

- `OPTIONAL_RULES` 매핑에 정의된 규칙만 로드 가능:
  ```typescript
  export const OPTIONAL_RULES: Record<string, string> = {
    'time-mocking': 'rules/mock/time-mocking.md',
  };
  ```
- manifest의 `optionalRules` 배열에 포함된 항목만 선택적으로 로드
- 알 수 없는 규칙은 경고 로그 후 무시

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
