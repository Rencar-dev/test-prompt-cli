# RTK Query 테스트 규칙

## Meta

```yaml
scope: queryLibrary=rtk-query
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 queryLibrary가 rtk-query
> - 테스트 대상이 createApi 엔드포인트를 사용

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [RTKQ-001] API 슬라이스 테스트 규칙
- [RTKQ-002] useQuery 훅 테스트 규칙
- [RTKQ-003] useMutation 훅 테스트 규칙
- [RTKQ-004] 캐시 무효화 테스트 규칙
- [RTKQ-005] 스토어 설정 규칙

---

## 3. 주제 특화 규칙

### 3.1 API 슬라이스 테스트 [RTKQ-001]

<!-- TODO: createApi 테스트, endpoints 검증 -->

### 3.2 useQuery 훅 테스트 [RTKQ-002]

<!-- TODO: 자동 생성된 훅 테스트, 폴링 -->

### 3.3 useMutation 훅 테스트 [RTKQ-003]

<!-- TODO: mutation 트리거, 낙관적 업데이트 -->

### 3.4 캐시 무효화 테스트 [RTKQ-004]

<!-- TODO: invalidateTags, providesTags -->

### 3.5 스토어 설정 [RTKQ-005]

<!-- TODO: setupListeners, middleware 설정 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [RTKQ-001] API 미들웨어가 스토어에 추가되었는가?
□ [RTKQ-002] 테스트마다 API 상태를 리셋하는가?
□ [RTKQ-003] 로딩/성공/에러 상태를 모두 테스트하는가?
□ [RTKQ-004] MSW로 API 응답을 모킹하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: RTK Query 테스트 자주 쓰는 패턴
```
