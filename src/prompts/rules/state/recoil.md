# Recoil 테스트 규칙

## Meta

```yaml
scope: stateManagement=recoil
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 stateManagement가 recoil
> - 테스트 대상이 Recoil atom/selector를 import

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [REC-001] RecoilRoot 래핑 규칙
- [REC-002] Atom 테스트 규칙
- [REC-003] Selector 테스트 규칙
- [REC-004] 스냅샷 테스트 규칙
- [REC-005] 비동기 Selector 규칙

---

## 3. 주제 특화 규칙

### 3.1 RecoilRoot 래핑 [REC-001]

<!-- TODO: RecoilRoot 필수, initializeState 옵션 -->

### 3.2 Atom 테스트 [REC-002]

<!-- TODO: atom 초기값, useRecoilState 테스트 -->

### 3.3 Selector 테스트 [REC-003]

<!-- TODO: 파생 상태 테스트, get/set 검증 -->

### 3.4 스냅샷 테스트 [REC-004]

<!-- TODO: snapshot_UNSTABLE, 상태 검증 -->

### 3.5 비동기 Selector [REC-005]

<!-- TODO: Suspense 처리, 로딩 상태 테스트 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [REC-001] RecoilRoot로 컴포넌트를 래핑하는가?
□ [REC-002] Atom 초기 상태를 설정하는가?
□ [REC-003] 비동기 Selector에 Suspense를 처리하는가?
□ [REC-004] 테스트 간 상태가 격리되는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Recoil 테스트 자주 쓰는 패턴
```
