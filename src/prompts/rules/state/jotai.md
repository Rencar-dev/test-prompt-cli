# Jotai 테스트 규칙

## Meta

```yaml
scope: stateManagement=jotai
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 stateManagement가 jotai
> - 테스트 대상이 Jotai atom을 import

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [JOT-001] Provider 래핑 규칙
- [JOT-002] Atom 테스트 규칙
- [JOT-003] 파생 Atom 테스트 규칙
- [JOT-004] 비동기 Atom 규칙
- [JOT-005] 스토어 직접 테스트 규칙

---

## 3. 주제 특화 규칙

### 3.1 Provider 래핑 [JOT-001]

<!-- TODO: Provider 사용 여부, Provider-less 모드 -->

### 3.2 Atom 테스트 [JOT-002]

<!-- TODO: atom 초기값, useAtom 테스트 -->

### 3.3 파생 Atom 테스트 [JOT-003]

<!-- TODO: 읽기 전용 atom, 쓰기 가능 atom -->

### 3.4 비동기 Atom [JOT-004]

<!-- TODO: async atom, Suspense 처리 -->

### 3.5 스토어 직접 테스트 [JOT-005]

<!-- TODO: createStore, store.get, store.set -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [JOT-001] 테스트 간 atom 상태가 격리되는가?
□ [JOT-002] 비동기 atom에 Suspense를 처리하는가?
□ [JOT-003] 파생 atom의 의존성을 테스트하는가?
□ [JOT-004] Provider 사용 여부가 일관적인가?
```

---

## 6. Quick Reference

```typescript
// TODO: Jotai 테스트 자주 쓰는 패턴
```
