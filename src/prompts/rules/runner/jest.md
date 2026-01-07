# Jest 테스트 규칙

## Meta

```yaml
scope: testRunner=jest
inherits:
  - _common.md
  - runner/_shared.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 testRunner가 jest

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [JEST-001] Jest 설정 규칙
- [JEST-002] jest.mock 사용 규칙
- [JEST-003] jest.spyOn 사용 규칙
- [JEST-004] jest.fn 사용 규칙
- [JEST-005] 타이머 Mock 규칙
- [JEST-008] jest.resetModules로 모듈 캐시 초기화

> 공통 규칙은 `runner/_shared.md` 참조:
> - [RUNNER-001] expect 실패 메시지 제공
> - [RUNNER-002] mockClear로 단계별 호출 검증
> - [RUNNER-003] expect.any(Type)으로 타입 검증
> - [RUNNER-004] toMatchInlineSnapshot 제한적 사용

---

## 3. 주제 특화 규칙

### 3.1 Jest 설정 [JEST-001]

<!-- TODO: jest.config.js 설정, testEnvironment, setupFilesAfterEnv -->

### 3.2 jest.mock 사용 [JEST-002]

<!-- TODO: 모듈 모킹, 호이스팅, __mocks__ 폴더 -->

### 3.3 jest.spyOn 사용 [JEST-003]

<!-- TODO: 메서드 스파이, mockImplementation, mockRestore -->

### 3.4 jest.fn 사용 [JEST-004]

<!-- TODO: mock 함수 생성, mockReturnValue, mockResolvedValue -->

### 3.5 타이머 Mock [JEST-005]

<!-- TODO: useFakeTimers, advanceTimersByTime, useRealTimers -->

---

### 3.6 jest.resetModules로 모듈 캐시 초기화 [JEST-008]

**테스트 간 모듈 모킹을 다르게 해야 할 때 resetModules로 캐시를 초기화합니다.**

> 적용 조건: 테스트 간 동일 모듈의 모킹을 다르게 설정해야 할 때

```
MUST: 모듈 모킹 변경 필요 시 beforeEach에서 jest.resetModules() 호출
MUST: resetModules 후 require()로 모듈 재로드
```

```typescript
// ✅ Good: 모듈 캐시 초기화
let asyncAct
beforeEach(() => {
  jest.resetModules()
  asyncAct = require('../act-compat').default
})
```

```typescript
// ❌ Bad: 모듈 캐시 재사용
const asyncAct = require('../act-compat').default
// 이전 테스트의 모듈 상태가 유지됨
```

#### 출처
- 원본: react-testing-library
- 파일: `new-act.js:12-14`
- 채택 점수: 8/10

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [JEST-001] jest.mock이 파일 최상단에 위치하는가?
□ [JEST-002] afterEach에서 jest.clearAllMocks()를 호출하는가?
□ [JEST-003] 타이머 Mock 후 useRealTimers로 복원하는가?
□ [JEST-004] spyOn 후 mockRestore로 복원하는가?
□ [JEST-008] 모듈 모킹 변경 시 resetModules를 사용하는가?

# 공통 규칙 (runner/_shared.md)
□ [RUNNER-001] 유사한 assertion에 실패 메시지를 제공하는가?
□ [RUNNER-002] 단계별 호출 검증 시 mockClear를 사용하는가?
□ [RUNNER-003] 함수 타입 검증 시 expect.any(Function)을 사용하는가?
□ [RUNNER-004] 스냅샷을 복잡한 구조에만 제한적으로 사용하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Jest 자주 쓰는 패턴
```
