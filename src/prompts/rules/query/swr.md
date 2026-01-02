# SWR 테스트 규칙

## Meta

```yaml
scope: queryLibrary=swr
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 queryLibrary가 swr
> - 테스트 대상이 useSWR을 사용

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [SWR-001] SWRConfig 설정 규칙
- [SWR-002] useSWR 테스트 규칙
- [SWR-003] useSWRMutation 테스트 규칙
- [SWR-004] 캐시 테스트 규칙
- [SWR-005] 에러/로딩 상태 규칙

---

## 3. 주제 특화 규칙

### 3.1 SWRConfig 설정 [SWR-001]

<!-- TODO: provider 옵션, dedupingInterval: 0 -->

### 3.2 useSWR 테스트 [SWR-002]

<!-- TODO: 로딩→성공 흐름, 에러 케이스, revalidate -->

### 3.3 useSWRMutation 테스트 [SWR-003]

<!-- TODO: trigger 호출, 낙관적 업데이트 -->

### 3.4 캐시 테스트 [SWR-004]

<!-- TODO: mutate, cache.clear -->

### 3.5 에러/로딩 상태 [SWR-005]

<!-- TODO: isLoading, isValidating, error -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [SWR-001] SWRConfig로 테스트 환경을 설정하는가?
□ [SWR-002] dedupingInterval: 0으로 캐시 중복을 방지하는가?
□ [SWR-003] 로딩/성공/에러 상태를 모두 테스트하는가?
□ [SWR-004] MSW로 API 응답을 모킹하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: SWR 테스트 자주 쓰는 패턴
```
