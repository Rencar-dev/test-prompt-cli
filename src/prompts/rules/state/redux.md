# Redux Rules

> **Redux 상태 관리 라이브러리 사용 시 적용되는 규칙입니다.**

---

## 1. Store 설정

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

const renderWithRedux = (ui: React.ReactElement, preloadedState = {}) => {
  const store = createTestStore(preloadedState);
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
};
```

---

## 2. Dispatch 검증

```typescript
it('버튼 클릭 시 액션이 dispatch된다', async () => {
  const store = createTestStore();
  const dispatchSpy = vi.spyOn(store, 'dispatch');

  render(
    <Provider store={store}>
      <Counter />
    </Provider>
  );

  await userEvent.click(screen.getByRole('button', { name: /증가/ }));

  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'counter/increment' })
  );
});
```

---

## 3. Selector Mock

```typescript
// ❌ Bad: selector 직접 mock
vi.mock('@/store/selectors', () => ({
  selectUser: () => mockUser,
}));

// ✅ Good: preloadedState로 상태 주입
const { store } = renderWithRedux(<UserProfile />, {
  user: { id: 1, name: '홍길동' },
});
```

---

## 4. Self-Check

- [ ] `Provider`로 컴포넌트를 감쌌는가?
- [ ] `preloadedState`로 초기 상태를 설정했는가?
- [ ] dispatch 검증 시 action type을 확인했는가?
