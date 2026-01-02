# Apollo Client 테스트 규칙

## Meta

```yaml
scope: queryLibrary=apollo
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 queryLibrary가 apollo
> - 테스트 대상이 useQuery/useMutation (Apollo)을 사용

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [APO-001] MockedProvider 설정 규칙
- [APO-002] useQuery 테스트 규칙
- [APO-003] useMutation 테스트 규칙
- [APO-004] 캐시 테스트 규칙
- [APO-005] 에러 처리 규칙

---

## 3. 주제 특화 규칙

### 3.1 MockedProvider 설정 [APO-001]

<!-- TODO: mocks 배열, addTypename: false -->

### 3.2 useQuery 테스트 [APO-002]

<!-- TODO: 로딩→성공 흐름, variables 검증 -->

### 3.3 useMutation 테스트 [APO-003]

<!-- TODO: mutate 함수 호출, refetchQueries -->

### 3.4 캐시 테스트 [APO-004]

<!-- TODO: cache.writeQuery, cache.evict -->

### 3.5 에러 처리 [APO-005]

<!-- TODO: GraphQL errors vs Network errors -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [APO-001] MockedProvider로 컴포넌트를 래핑하는가?
□ [APO-002] mocks 배열에 필요한 쿼리가 모두 있는가?
□ [APO-003] 로딩/성공/에러 상태를 모두 테스트하는가?
□ [APO-004] GraphQL 에러와 네트워크 에러를 구분하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Apollo Client 테스트 자주 쓰는 패턴
```
