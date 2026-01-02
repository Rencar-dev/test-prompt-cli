# Fetch Mock 테스트 규칙

## Meta

```yaml
scope: mockStrategy=fetch-mock
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 mockStrategy가 fetch-mock
> - fetch API 직접 모킹이 필요한 경우

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [FM-001] fetchMock 설정 규칙
- [FM-002] 라우트 정의 규칙
- [FM-003] 응답 설정 규칙
- [FM-004] 호출 검증 규칙
- [FM-005] 리셋 규칙

---

## 3. 주제 특화 규칙

### 3.1 fetchMock 설정 [FM-001]

<!-- TODO: fetchMock.enableMocks, fetchMock.dontMock -->

### 3.2 라우트 정의 [FM-002]

<!-- TODO: fetchMock.get, fetchMock.post, URL 매칭 -->

### 3.3 응답 설정 [FM-003]

<!-- TODO: response body, status, headers -->

### 3.4 호출 검증 [FM-004]

<!-- TODO: fetchMock.calls, fetchMock.lastCall -->

### 3.5 리셋 [FM-005]

<!-- TODO: fetchMock.resetMocks, fetchMock.restore -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [FM-001] fetchMock이 올바르게 활성화되었는가?
□ [FM-002] 모든 예상 라우트가 정의되었는가?
□ [FM-003] afterEach에서 resetMocks를 호출하는가?
□ [FM-004] 호출 여부와 인자를 검증하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Fetch Mock 자주 쓰는 패턴
```
