# Jest 테스트 규칙

## Meta

```yaml
scope: testRunner=jest
inherits: _common.md
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
```

---

## 6. Quick Reference

```typescript
// TODO: Jest 자주 쓰는 패턴
```
