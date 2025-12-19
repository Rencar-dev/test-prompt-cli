# Unit Test Rules

> **이 규칙은 Unit 테스트(비즈니스 로직)에만 적용됩니다.**
> 순수 함수, Custom Hook, Store 테스트 패턴을 다룹니다.

---

## 1. Parameterized Test (test.each) 패턴

> **목적**: 유사한 테스트 케이스를 간결하게 작성하고 테스트 의도를 명확히 표현

### 1.1 라벨 포함 복합 파라미터 형태 (권장)

```typescript
test.each([
  ['주문 없음', '주문 내역이 없습니다', 0, /주문 내역이 없습니다/],
  ['배송 중', '배송 중인 상품이 있습니다', 3, /배송 중인 상품.*있습니다/],
  ['배송 완료', '모든 상품이 배송 완료되었습니다', 5, /배송 완료되었습니다/],
])(
  "'%s' 케이스: '%s' 문구가 출력됩니다.",
  async (caseLabel, expectedText, orderCount, regexPattern) => {
    // ...
  }
);
```

### 1.2 객체 형태 (타입 안전성 필요 시)

```typescript
test.each([
  { input: 17, expected: false, desc: '최솟값 - 1 (경계 밖)' },
  { input: 18, expected: true, desc: '최솟값 (경계)' },
  { input: 65, expected: true, desc: '최댓값 (경계)' },
  { input: 66, expected: false, desc: '최댓값 + 1 (경계 밖)' },
])('$desc: validateAge($input) → $expected', ({ input, expected }) => {
  expect(validateAge(input)).toBe(expected);
});
```

---

## 2. 경곗값 분석 (Boundary Value Analysis)

> **숫자 범위를 검증하는 함수는 반드시 경곗값 테스트를 포함해야 한다.**

### 2.1 필수 요구사항

숫자 범위 검증 함수: **최소 6개 케이스** 필수

| 케이스 | 설명 |
|--------|------|
| 최솟값 - 1 | 경계 밖 (실패 케이스) |
| 최솟값 | 경계 (성공 케이스) |
| 최솟값 + 1 | 경계 안 (성공 케이스) |
| 최댓값 - 1 | 경계 안 (성공 케이스) |
| 최댓값 | 경계 (성공 케이스) |
| 최댓값 + 1 | 경계 밖 (실패 케이스) |

### 2.2 예시

```typescript
describe('validateAge', () => {
  it.each([
    { input: 17, expected: false, desc: '최솟값 - 1 (경계 밖)' },
    { input: 18, expected: true, desc: '최솟값 (경계)' },
    { input: 19, expected: true, desc: '최솟값 + 1 (경계 안)' },
    { input: 64, expected: true, desc: '최댓값 - 1 (경계 안)' },
    { input: 65, expected: true, desc: '최댓값 (경계)' },
    { input: 66, expected: false, desc: '최댓값 + 1 (경계 밖)' },
  ])('$desc: $input → $expected', ({ input, expected }) => {
    expect(validateAge(input)).toBe(expected);
  });
});
```

---

## 3. 순수 함수(Unit) 테스트 규칙 — utils/lib

> 입력 → 출력만 검증하는 **Black-box Testing**

### 3.1 금지 사항

아래가 조금이라도 보이면 즉시 실패 처리:

- ❌ DOM API (`window`, `document`, `navigator`)
- ❌ React 렌더링 (`render`, `screen`)
- ❌ 이벤트 라이브러리 (`userEvent`)
- ❌ Snapshot test

### 3.2 필수 Edge Cases

```typescript
// 반드시 포함해야 할 Edge Cases
- null, undefined
- 빈 값: [], "", {}
- 경계 numeric:
  - 0
  - 음수
  - 소수점
  - MAX_SAFE_INTEGER
- 잘못된 타입
- 예외 throw
```

### 3.3 Red Team / Boundary Testing

```typescript
// 추가 검증 권장
- 초대형 입력값 (String length > 10,000)
- 특수문자 / 이모지
- SQL Injection 시도 문자열
- Integer Overflow
```

---

## 4. Custom Hook 테스트 규칙

> Hook이지만 "UI 없는 로직" 검증

### 4.1 도구

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
```

### 4.2 Wrapper 필요 시

```typescript
renderHook(() => useX(), { wrapper: Provider });
```

### 4.3 핵심 규칙

> 상태 변경을 유발하는 모든 코드는 반드시 `act()` 안에서 실행

### 4.4 props 변화 검증

```typescript
const { rerender, result } = renderHook(
  ({ v }) => useCalc(v),
  { initialProps: { v: 1 } }
);
rerender({ v: 2 });
expect(result.current).toBe(2);
```

---

## 5. Store (Zustand/Recoil/Vanilla) 테스트 규칙

> **Hook Mocking 금지** — Vanilla API만 사용

### 5.1 핵심 원칙

- **Hook(`useStore`)을 렌더링하지 말고, `useStore.getState()` / `setState()`를 사용해라.**
- **이유:** React 렌더링 사이클 없이 상태 로직만 검증하기 위함

### 5.2 초기화

```typescript
beforeEach(() => {
  store.setState(initialState, true);
});
```

### 5.3 검증 대상

- setter 호출
- 최종 state (`store.getState()`)
- selector 결과

### 5.4 예시

```typescript
describe('cartStore', () => {
  beforeEach(() => {
    cartStore.setState({ items: [], total: 0 });
  });

  it('상품 추가 시 total이 증가한다', () => {
    // Given
    const { addItem, getState } = cartStore;

    // When
    addItem({ id: 1, price: 1000 });

    // Then
    expect(getState().total).toBe(1000);
    expect(getState().items).toHaveLength(1);
  });
});
```

### 5.5 Anti-Pattern

```typescript
// ❌ Bad: renderHook으로 스토어 테스트
const { result } = renderHook(() => useCartStore());
// → React 렌더링 사이클이 개입되어 순수 로직 테스트가 아님

// ✅ Good: Vanilla API 직접 사용
const state = cartStore.getState();
cartStore.setState({ items: [] });
```

---

## 6. 테스트 고립성 (Isolation)

### 6.1 Store 초기화

```typescript
beforeEach(() => {
  // Store 초기화 (setState의 두 번째 인자 true 금지!)
  userStore.setState({ user: null, isLogin: null });
  loadingStore.setState({ isLoading: false });
});
```

**주의사항:**
- `setState`의 두 번째 인자로 `true`를 전달하면 전체 상태를 대체(replace)
- 부분 업데이트(partial update)로 필요한 필드만 초기화

### 6.2 Self-Check

- [ ] 각 테스트가 독립적으로 실행 가능한가?
- [ ] Store 상태가 테스트 간 공유되지 않는가?
- [ ] `afterEach`에서 Mock이 정리(cleanup)되는가?

---

## 7. Self-Check

- [ ] 3개 이상의 유사한 테스트 케이스를 `test.each`로 통합했는가?
- [ ] 숫자 범위 검증 함수에 최소 6개 경곗값 케이스를 포함했는가?
- [ ] 순수 함수 테스트에 `render`, `screen`이 없는가?
- [ ] Custom Hook 테스트에서 상태 변경을 `act()` 안에서 실행했는가?
- [ ] Store 테스트에서 `renderHook` 대신 Vanilla API를 사용했는가?
