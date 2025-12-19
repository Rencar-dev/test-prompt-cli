# Zustand Rules

> **Zustand 상태 관리 라이브러리 사용 시 적용되는 규칙입니다.**

---

## 1. setState 규칙 (Critical)

**`setState`의 두 번째 인자 `true`는 전체 교체 모드로, 모든 메서드가 삭제됩니다.**

```typescript
// ❌ 절대 금지 (메서드 손실)
beforeEach(() => {
  userStore.setState({ user: null, isLogin: null }, true);
  // → TypeError: setUser is not a function
});

// ✅ Good: 두 번째 인자 생략 (병합 모드)
beforeEach(() => {
  userStore.setState({ user: null, isLogin: null, companyId: null });
  loadingStore.setState({ isLoading: false });
});

// ✅ Good: getState 활용 (더 안전)
beforeEach(() => {
  const currentState = userStore.getState();
  userStore.setState({
    ...currentState,
    user: null,
    isLogin: null,
  });
});
```

---

## 2. Store 초기화 패턴

**모든 테스트는 `beforeEach`에서 Store를 초기화합니다.**

```typescript
const resetStores = () => {
  userStore.setState({
    user: null,
    isLogin: null,
    companyId: null,
  });
  loadingStore.setState({
    isLoading: false,
  });
};

beforeEach(() => {
  resetStores();
});
```

---

## 3. Store 메서드 검증

**초기화 후 메서드가 정상 동작하는지 확인:**

```typescript
describe('LoginPage', () => {
  beforeEach(() => {
    resetStores();

    // ✅ 메서드가 함수인지 확인
    expect(typeof userStore.getState().setUser).toBe('function');
    expect(typeof userStore.getState().setCompanyId).toBe('function');
  });
});
```

---

## 4. Store 상태 검증

**UI에 직접 드러나지 않는 Store 상태 변화도 검증:**

```typescript
// Given: 스토어 액션 스파이
const setItemSpy = vi.spyOn(useCartStore.getState(), 'setItem');

// When: 사용자 액션
await userEvent.click(screen.getByRole('button', { name: /장바구니 추가/ }));

// Then: 스토어 액션 호출 검증
expect(setItemSpy).toHaveBeenCalledWith({ productId: 'P123', quantity: 1 });
```

---

## 5. Store Mock 완전성

**테스트 대상이 사용하는 모든 Store 메서드를 확인:**

```typescript
// LoginPage.tsx
import { useUserStore, useLoadingStore } from '@/stores';

// FullScreenContainer.tsx (자식 컴포넌트)
import { useFullScreenContainerStore } from '@/stores';

// ✅ 모든 store 초기화 필요
beforeEach(() => {
  userStore.setState({ ... });
  loadingStore.setState({ ... });
  fullScreenContainerStore.setState({ ... }); // 자식이 사용하는 store도 포함
});
```

---

## 6. Selector 테스트

```typescript
// Store에서 selector 사용 시
const userName = useUserStore((state) => state.user?.name);

// 테스트에서 상태 설정
beforeEach(() => {
  userStore.setState({
    user: { id: 1, name: '홍길동' },
  });
});

it('사용자 이름이 표시된다', () => {
  render(<UserProfile />);
  expect(screen.getByText('홍길동')).toBeInTheDocument();
});
```

---

## 7. Self-Check

- [ ] `setState`의 두 번째 인자를 사용하지 않았는가?
- [ ] `beforeEach`에서 store를 초기화했는가?
- [ ] 자식 컴포넌트가 사용하는 store도 초기화했는가?
- [ ] 초기화 후 store 메서드가 함수인지 확인했는가?
