# 모듈 Mock 테스트 규칙

## Meta

```yaml
scope: mockStrategy=module-mock
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 mockStrategy가 module-mock
> - 또는 MSW 없이 모듈 레벨 모킹이 필요한 경우

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [MOD-001] vi.mock/jest.mock 위치 규칙
- [MOD-002] 부분 모킹 규칙
- [MOD-003] 모킹 해제 규칙
- [MOD-004] 타입 안전 모킹 규칙
- [MOD-005] 동적 모킹 규칙

---

## 3. 주제 특화 규칙

### 3.1 mock 위치 [MOD-001]

<!-- TODO: 파일 최상단, 호이스팅 동작 -->

### 3.2 부분 모킹 [MOD-002]

<!-- TODO: importOriginal, 특정 함수만 모킹 -->

### 3.3 모킹 해제 [MOD-003]

<!-- TODO: mockRestore, mockReset, mockClear 차이 -->

### 3.4 타입 안전 모킹 [MOD-004]

<!-- TODO: vi.mocked, MockedFunction 타입 -->

### 3.5 동적 모킹 [MOD-005]

<!-- TODO: mockImplementation, mockReturnValue -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| 테스트 내부에서 mock 선언 | 호이스팅 안 됨 | 파일 최상단에 선언 |
| 과도한 모듈 모킹 | 실제 동작 검증 불가 | 경계만 모킹 |

---

## 5. Self-Check

```
□ [MOD-001] vi.mock/jest.mock이 파일 최상단에 있는가?
□ [MOD-002] 필요한 함수만 부분 모킹하는가?
□ [MOD-003] afterEach에서 mock을 정리하는가?
□ [MOD-004] 타입 안전하게 모킹하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: 모듈 Mock 자주 쓰는 패턴
```
