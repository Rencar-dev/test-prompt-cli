# UI Integration Test Rules

> **이 규칙은 UI 컴포넌트 테스트에만 적용됩니다.**
> React Testing Library 기반의 렌더링, 상호작용, 상태 검증 패턴을 다룹니다.

---

## 1. Robust Click Strategy

> **목적**: 간헐적 클릭 실패(Flaky)를 방지한다.

### 1.1 4단계 폴백 전략

**클릭이 실패할 경우 다음 순서로 시도하라:**

```typescript
async function robustClick(element: HTMLElement) {
  const user = userEvent.setup();
  try {
    // 1단계: Enter 키 (가장 안전)
    await user.type(element, '{Enter}');
  } catch (e1) {
    try {
      // 2단계: 일반 클릭
      await user.click(element);
    } catch (e2) {
      try {
        // 3단계: Force 클릭 (pointer-events 무시)
        await user.click(element, { pointerEventsCheck: 0 });
      } catch (e3) {
        // 4단계: JavaScript 직접 실행 (최후의 수단)
        element.click();
      }
    }
  }
}
```

### 1.2 언제 사용하는가?

- Modal overlay에 의해 버튼이 가려진 경우
- CSS transition/animation이 진행 중인 경우
- 간헐적으로 "Element is not clickable" 에러가 발생하는 경우

---

## 2. Promise 상태별 UI 테스트 패턴

### 2.1 Promise가 resolve되지 않는 경우 (Pending 상태)

```typescript
it('결제 응답이 오지 않으면 확인 모달이 유지됩니다.', async () => {
  // ✅ 영원히 resolve되지 않는 Promise
  mockPayment.mockReturnValue(new Promise(() => {}));

  renderWithProviders(<CheckoutPage />);
  await user.click(screen.getByText('결제하기'));

  // 모달이 여전히 존재함 (Promise가 pending 상태)
  expect(screen.getByText('확인')).toBeInTheDocument();
});
```

### 2.2 핵심 패턴 비교

| Mock 메서드 | Promise 상태 | UI 결과 |
|------------|-------------|---------|
| `mockReturnValue(new Promise(() => {}))` | Pending (영원히) | 로딩/모달 유지 |
| `mockResolvedValue(value)` | Fulfilled | 성공 UI 표시 |
| `mockRejectedValue(error)` | Rejected | 에러 UI 표시 |

---

## 3. 테스트 에러 메시지 개선 (prettyDOM)

**`tests/setup.ts`에 추가하여 디버깅 시간을 단축:**

```typescript
import { configure, prettyDOM } from '@testing-library/react';

configure({
  getElementError: (message: string | null, container) => {
    const error = new Error();
    if (message && message.includes('<body>')) {
      error.message = message;
    } else {
      const prettifiedDOM = prettyDOM(container);
      error.message = `${message}\n\n${prettifiedDOM}`;
    }
    error.name = 'TestingLibraryElementError';
    return error;
  },
});
```

---

## 4. 렌더링 검증 규칙

**모든 테스트는 Given 단계 직후 기본 UI가 렌더링되었는지 검증한다.**

```typescript
it('[S1] 로그인 성공', async () => {
  // Given
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  // ✅ 렌더링 검증: 기본 UI 확인
  expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();

  // When: 검증 후 상호작용
  await user.type(screen.getByPlaceholderText('아이디'), 'test');
});
```

**규칙:**
- `renderWithProviders` 직후 **최소 1개 이상의 기본 요소** 검증
- Form 테스트: input, button 검증
- List 테스트: 제목, 빈 상태 또는 첫 항목 검증

---

## 5. Page Object Model (POM) 패턴

> **목적**: UI 변경 시 테스트 유지보수 비용을 줄인다.

### 5.1 핵심 원칙

**선택자(Selector)와 행위(Action)를 분리하라.**

```typescript
const loginPage = {
  elements: {
    getUsernameInput: () => screen.getByRole('textbox', { name: /아이디/ }),
    getSubmitButton: () => screen.getByRole('button', { name: '로그인' }),
  },
  actions: {
    async login(username: string, password: string) {
      const user = userEvent.setup();
      await user.type(this.elements.getUsernameInput(), username);
      await user.click(this.elements.getSubmitButton());
    },
  },
};

test('로그인 성공', async () => {
  render(<LoginPage />);
  await loginPage.actions.login('testuser', 'password123');
});
```

### 5.2 예외

- 한 번만 사용되는 단순한 단언문
- **단, 3개 이상의 `test()`에서 동일한 선택자/액션을 사용하면 반드시 POM으로 추출**

---

## 6. Store 상태 검증

**UI 상으로 직접 드러나지 않는 Store의 상태 변화도 검증한다.**

```typescript
// Given: 스토어 액션을 스파이
const setItemSpy = vi.spyOn(useCartStore.getState(), 'setItem');

// When: 사용자가 상품을 장바구니에 추가
await userEvent.click(screen.getByRole('button', { name: /장바구니 추가/ }));

// Then: 스토어의 setItem 액션이 올바른 인자와 함께 호출
expect(setItemSpy).toHaveBeenCalledWith({ productId: 'P123', quantity: 1 });
```

---

## 7. 초기값 처리 로직 검증

**시나리오와 실제 구현의 불일치를 반드시 확인하라.**

```typescript
// ✅ Good: 실제 코드 확인 후 작성
// NOTE: 실제 구현은 useState(initialId ?? '')로 초기값에 trim이 적용되지 않음
// 시나리오는 "공백 제거"를 명시하지만, 실제로는 onChange에서만 trim 적용됨
expect(screen.getByPlaceholderText('아이디')).toHaveValue('  prefillUser  ');
```

---

## 8. 줄바꿈(Multi-line) 텍스트 검증 규칙

**HTML에서는 줄바꿈(`\n`)이 공백으로 치환될 수 있으므로 Regex를 사용:**

```typescript
// ❌ Bad: 줄바꿈 문자열 직접 매칭
screen.getByText('첫 번째 줄입니다.\n두 번째 줄입니다.');

// ✅ Good: Regex 사용
screen.getByText(/첫 번째 줄입니다\..*두 번째 줄입니다/s);
```

---

## 9. Toast/Alert 검증 규칙

### 9.1 Toast 검증

```typescript
// ✅ Good: 메시지 내용까지 검증 (타입 가드 포함)
await waitFor(() => {
  const toasts = toastStore.getState().toasts;
  expect(
    toasts.some(
      (toast) => typeof toast.message === 'string' &&
                 toast.message === '반납이 완료되었습니다.'
    )
  ).toBe(true);
});
```

### 9.2 Alert 검증

```typescript
const showAlertSpy = vi.spyOn(alertStore.getState(), 'showAlert');
// ... 테스트 실행 ...
expect(showAlertSpy).toHaveBeenCalledWith({ content: '입력해 주세요.' });
```

---

## 10. 에러 처리 검증 전략

### 10.1 검증 방법 결정 플로우

1. **DOM에 렌더링되는 경우:**
   ```typescript
   expect(screen.getByRole('alert')).toHaveTextContent('오류 메시지');
   ```

2. **globalErrorHandler가 `window.alert()` 호출:**
   ```typescript
   const alertSpy = vi.spyOn(window, 'alert');
   await waitFor(() =>
     expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('오류'))
   );
   ```

3. **toastStore에 메시지 추가:**
   ```typescript
   await waitFor(() => {
     expect(toastStore.getState().toasts.length).toBeGreaterThan(0);
   });
   ```

---

## 11. Render Wrapper 규칙

**테스트는 실제 앱 환경과 최대한 비슷해야 한다.**

```typescript
render(<LoginView />, { wrapper: AppProviders });
```

`AppProviders` 안에는:
- ThemeProvider
- QueryClientProvider
- Router/Navigation provider
- Zustand/Recoil Provider 등

> 프로젝트에 `renderWithProviders` 같은 util이 있다면 **반드시 그것을 우선 사용**한다.

---

## 12. Mock Requirement 매핑

**Test Plan의 `(Mock Requirement)` 섹션을 테스트 코드에 주석으로 참조:**

```typescript
/**
 * Test Plan S1 Mock Requirement:
 * - useDetailQuery success with datas.details array
 * - datas.request with {id, orderer}
 */
const buildDetailResponse = (overrides?: Partial<{...}>) => ({
  success: true,
  datas: { ... }
});
```

---

## 13. Self-Check

- [ ] 렌더링 직후 기본 UI를 검증했는가?
- [ ] Promise pending 상태 테스트가 필요한가?
- [ ] POM 패턴으로 추출할 반복 코드가 있는가?
- [ ] Toast/Alert 메시지 내용까지 검증했는가?
- [ ] 에러 처리 방식을 소스 코드에서 확인했는가?
