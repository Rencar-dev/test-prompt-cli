# Unit 테스트 규칙

## Meta

```yaml
scope: testType=unit
inherits: _common.md
priority: 1
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - CLI에서 `--type unit` 옵션 사용
> - 또는 대상 파일이 `.ts`, `.js` 확장자 (비-컴포넌트)

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| SEL-001 | Selector 우선순위 | 적용 안 함 | DOM 요소 없음 |
| ASYNC-001 | findBy/waitFor 패턴 | 적용 안 함 | 렌더링 없음 |

### Add

- [UNIT-001] 순수 함수 테스트 규칙
- [UNIT-002] 훅 테스트 규칙
- [UNIT-003] 유틸리티 테스트 규칙
- [UNIT-004] 엣지 케이스 규칙
- [UNIT-005] 타입 테스트 규칙

---

## 3. 주제 특화 규칙

### 3.1 순수 함수 테스트 [UNIT-001]

<!-- TODO: 입력-출력 검증, 부작용 없음 확인 -->

### 3.2 훅 테스트 [UNIT-002]

<!-- TODO: renderHook 사용, act 래핑, 상태 변화 검증 -->

### 3.3 유틸리티 테스트 [UNIT-003]

<!-- TODO: 포맷터, 파서, 변환 함수 테스트 패턴 -->

### 3.4 엣지 케이스 [UNIT-004]

<!-- TODO: null/undefined, 빈 배열, 경계값, 예외 처리 -->

### 3.5 타입 테스트 [UNIT-005]

<!-- TODO: 타입 추론 검증, expectTypeOf 사용 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [UNIT-001] 함수의 모든 분기가 테스트되었는가?
□ [UNIT-002] 훅 테스트에 renderHook을 사용했는가?
□ [UNIT-003] 엣지 케이스(null, undefined, 빈값)가 포함되었는가?
□ [UNIT-004] 예외 발생 시나리오가 테스트되었는가?
□ [UNIT-005] 반환 타입이 올바른지 검증했는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Unit 테스트 자주 쓰는 패턴
```
