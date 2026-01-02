# Redux Toolkit 테스트 규칙

## Meta

```yaml
scope: stateManagement=redux-toolkit
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 stateManagement가 redux-toolkit
> - 테스트 대상이 Redux slice/store를 import

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [RTK-001] 스토어 설정 규칙
- [RTK-002] Slice 테스트 규칙
- [RTK-003] Selector 테스트 규칙
- [RTK-004] Async Thunk 테스트 규칙
- [RTK-005] Provider 래핑 규칙

---

## 3. 주제 특화 규칙

### 3.1 스토어 설정 [RTK-001]

<!-- TODO: 테스트용 스토어 생성, preloadedState -->

### 3.2 Slice 테스트 [RTK-002]

<!-- TODO: reducer 단위 테스트, action creator 검증 -->

### 3.3 Selector 테스트 [RTK-003]

<!-- TODO: createSelector 테스트, 메모이제이션 -->

### 3.4 Async Thunk 테스트 [RTK-004]

<!-- TODO: createAsyncThunk 테스트, pending/fulfilled/rejected -->

### 3.5 Provider 래핑 [RTK-005]

<!-- TODO: renderWithProviders 헬퍼, 커스텀 스토어 주입 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [RTK-001] 테스트마다 새로운 스토어를 생성하는가?
□ [RTK-002] Slice reducer를 독립적으로 테스트하는가?
□ [RTK-003] Async Thunk의 모든 상태를 테스트하는가?
□ [RTK-004] Provider로 컴포넌트를 래핑하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Redux Toolkit 테스트 자주 쓰는 패턴
```
