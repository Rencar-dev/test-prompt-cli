<!-- Source: rules-ui.md -->
# 📘 Test Coding Conventions - UI Test Rules

> **이 문서는 UI 컴포넌트 테스트에만 적용되는 규칙을 정의합니다.**
> Element 선택자, 클릭 전략, UI 대기 패턴 등을 다룹니다.

---

## 1. Element Selector Priority

> **목적**: 접근성(Accessibility) 개선과 테스트 안정성을 동시에 향상한다.

### 1.1 선택자 우선순위 규칙

**Testing Library의 우선순위를 반드시 준수하라:**

```
1순위: getByRole ⭐⭐⭐⭐⭐ (최우선)
2순위: getByLabelText ⭐⭐⭐⭐
3순위: getByPlaceholderText ⭐⭐⭐
4순위: getByText ⭐⭐
5순위: getByTestId (최후의 수단)
❌ 금지: querySelector, xpath, getByClassName
```

**왜 이 순서를 따라야 하는가?**
- **getByRole**: 스크린 리더 사용자가 경험하는 방식과 동일하게 테스트
- **getByLabelText**: 폼 요소의 접근성 확보
- **getByTestId**: 코드 변경 시에만 깨지지만, 접근성 개선과는 무관

### 1.2 올바른 예시

```typescript
// ✅ 1순위: getByRole (최우선 사용)
const submitButton = screen.getByRole('button', { name: /제출/ });
const usernameInput = screen.getByRole('textbox', { name: /아이디/ });
const checkbox = screen.getByRole('checkbox', { name: /약관 동의/ });

// ✅ 2순위: getByLabelText (폼 요소)
const passwordInput = screen.getByLabelText('비밀번호');
const emailInput = screen.getByLabelText(/이메일/);

// ✅ 3순위: getByPlaceholderText (label이 없는 경우만)
const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');

// ✅ 4순위: getByText (버튼/링크가 아닌 텍스트 검증)
const errorMessage = screen.getByText('잘못된 입력입니다');

// ⚠️ 5순위: getByTestId (다른 방법이 없을 때만)
const complexWidget = screen.getByTestId('date-range-picker');
```

### 1.3 잘못된 예시 (Anti-Pattern)

```typescript
// ❌ Bad: data-testid 남발
const button = screen.getByTestId('submit-button'); // getByRole 사용 가능한데도 testid 사용
const input = screen.getByTestId('username-input'); // getByRole 또는 getByLabelText 사용 가능

// ❌ Bad: querySelector 사용 (절대 금지)
const button = container.querySelector('.submit-btn'); // Testing Library 철학 위배

// ❌ Bad: xpath 사용 (절대 금지)
const element = screen.getByXPath('//button[@class="submit"]');

// ❌ Bad: className으로 선택
const element = screen.getByClassName('btn-primary');
```

### 1.4 Role 사용 가이드

**자주 사용하는 Role 목록:**

| HTML 요소 | Role | 예시 |
|----------|------|------|
| `<button>` | `button` | `getByRole('button', { name: /클릭/ })` |
| `<input type="text">` | `textbox` | `getByRole('textbox', { name: /이름/ })` |
| `<input type="checkbox">` | `checkbox` | `getByRole('checkbox', { name: /동의/ })` |
| `<input type="radio">` | `radio` | `getByRole('radio', { name: /옵션/ })` |
| `<a>` | `link` | `getByRole('link', { name: /자세히/ })` |
| `<select>` | `combobox` | `getByRole('combobox', { name: /선택/ })` |
| `<h1> ~ <h6>` | `heading` | `getByRole('heading', { name: /제목/ })` |
| `<img>` | `img` | `getByRole('img', { name: /로고/ })` |

**Level 지정 (heading):**
```typescript
// ✅ h1
screen.getByRole('heading', { name: /페이지 제목/, level: 1 });

// ✅ h2
screen.getByRole('heading', { name: /섹션 제목/, level: 2 });
```

### 1.5 Self-Check

**테스트 작성 후 체크리스트:**
- [ ] `getByTestId`를 사용했다면, `getByRole`로 대체 가능한지 재검토했는가?
- [ ] `querySelector`나 `getByClassName`을 사용하지 않았는가?
- [ ] 모든 폼 요소가 적절한 `label` 또는 `aria-label`을 가지는가?
- [ ] 버튼/링크가 명확한 접근 가능한 이름(`name` 옵션)을 가지는가?

---

## 2. Robust Click Strategy

> **목적**: Playwright/Testing Library에서 간헐적 클릭 실패(Flaky)를 방지한다.

### 2.1 4단계 폴백 전략

**클릭이 실패할 경우 다음 순서로 시도하라:**

```typescript
/**
 * Robust Click: 4단계 폴백 전략
 * 1. Enter 키 시도
 * 2. 일반 클릭
 * 3. Force 클릭 (pointer-events 무시)
 * 4. JavaScript 직접 실행
 */
async function robustClick(element: HTMLElement) {
  try {
    // 1단계: Enter 키 (가장 안전)
    await user.type(element, '{Enter}');
    return;
  } catch (e1) {
    try {
      // 2단계: 일반 클릭
      await user.click(element);
      return;
    } catch (e2) {
      try {
        // 3단계: Force 클릭 (pointer-events 무시)
        await user.click(element, { pointerEventsCheck: 0 });
        return;
      } catch (e3) {
        // 4단계: JavaScript 직접 실행 (최후의 수단)
        element.click();
      }
    }
  }
}
```

### 2.2 언제 사용하는가?

**일반 클릭으로 충분한 경우:**
```typescript
// ✅ 대부분의 경우: 일반 클릭 사용
await user.click(screen.getByRole('button', { name: /제출/ }));
```

**Robust Click이 필요한 경우:**
- Modal overlay나 다른 요소에 의해 버튼이 가려진 경우
- CSS transition/animation이 진행 중인 요소
- 간헐적으로 "Element is not clickable" 에러가 발생하는 경우

```typescript
// ✅ 복잡한 UI: Robust Click 사용
const submitButton = screen.getByRole('button', { name: /제출/ });
await robustClick(submitButton);
```

### 2.3 재사용 가능한 유틸 함수로 추상화

**프로젝트에 `tests/utils/robustClick.ts` 파일 생성 권장:**

```typescript
// tests/utils/robustClick.ts
import { userEvent } from '@testing-library/user-event';

export async function robustClick(element: HTMLElement) {
  const user = userEvent.setup();
  // ... 위의 4단계 폴백 로직
}
```

---

## 3. Safe Wait Strategy

> **목적**: `networkidle` 대기의 불안정성을 해결하고 UI 앵커 기반 대기로 안정성을 향상한다.

### 3.1 기본 원칙

**❌ Bad: 네트워크 대기 (불안정)**
```typescript
// 네트워크 폴링, Lazy Loading 등으로 인해 자주 실패
await page.waitForLoadState('networkidle');
```

**✅ Good: UI 앵커 기반 대기**
```typescript
// 특정 UI 요소가 나타날 때까지 대기
await waitFor(() =>
  expect(screen.getByText('로딩 완료')).toBeInTheDocument()
);
```

### 3.2 올바른 대기 패턴

**1. 로딩 상태가 사라질 때까지 대기**
```typescript
// ✅ Good: 로딩 스피너가 사라질 때까지 대기
await waitFor(() =>
  expect(screen.queryByText('로딩중...')).not.toBeInTheDocument()
);
```

**2. 데이터가 렌더링될 때까지 대기**
```typescript
// ✅ Good: 사용자 이름이 나타날 때까지 대기
await waitFor(() =>
  expect(screen.getByText('홍길동')).toBeInTheDocument()
);
```

**3. 버튼 활성화를 대기**
```typescript
// ✅ Good: 제출 버튼이 활성화될 때까지 대기
await waitFor(() =>
  expect(screen.getByRole('button', { name: /제출/ })).toBeEnabled()
);
```

### 3.3 Anti-Pattern

```typescript
// ❌ Bad: 임의의 시간 대기
await new Promise(resolve => setTimeout(resolve, 1000));

// ❌ Bad: 네트워크 idle 대기
await page.waitForLoadState('networkidle');

// ❌ Bad: Mock 호출 대기 (이미 동기적으로 발생)
await waitFor(() => expect(mockFn).toHaveBeenCalled());
```

### 3.4 Self-Check

**테스트 작성 후 체크리스트:**
- [ ] `setTimeout`이나 `sleep`을 사용하지 않았는가?
- [ ] `networkidle` 대신 UI 앵커 기반 대기를 사용했는가?
- [ ] `waitFor`를 Mock 호출 검증에 사용하지 않았는가?
- [ ] 대기 조건이 명확하고 결정적(Deterministic)인가?

---

## 4. Promise 상태별 UI 테스트 패턴

> **목적**: 비동기 작업의 다양한 상태(pending, resolved, rejected)에 따른 UI 변화를 검증

### 4.1 Promise가 resolve되지 않는 경우 (Pending 상태)

**사용 시점**:
- 바텀시트/모달이 응답 대기 중 유지되어야 하는 경우
- 로딩 상태가 지속되어야 하는 경우
- 네트워크 지연 시나리오 테스트

```typescript
it('결제 응답이 오지 않으면 확인 모달이 유지됩니다.', async () => {
  const user = userEvent.setup();

  // ✅ 영원히 resolve되지 않는 Promise
  mockPayment.mockReturnValue(new Promise(() => {}));

  renderWithProviders(<CheckoutPage />);

  const payButton = await screen.findByText('결제하기');
  await user.click(payButton);

  const confirmButton = screen.getByText('확인');
  await user.click(confirmButton);

  // 모달이 여전히 존재함 (Promise가 pending 상태)
  expect(screen.getByText('확인')).toBeInTheDocument();
});
```

### 4.2 Promise가 resolve되는 경우 (Success 상태)

```typescript
it('결제 응답이 오면 확인 모달이 닫힙니다.', async () => {
  const user = userEvent.setup();

  // ✅ 즉시 resolve되는 Promise
  mockPayment.mockResolvedValue({ success: true });

  renderWithProviders(<CheckoutPage />);

  const payButton = await screen.findByText('결제하기');
  await user.click(payButton);

  const confirmButton = screen.getByText('확인');
  await user.click(confirmButton);

  // 모달이 닫힘 (Promise가 resolved)
  await waitFor(() => {
    expect(screen.queryByText('확인')).not.toBeInTheDocument();
  });
});
```

### 4.3 핵심 패턴 비교

| Mock 메서드 | Promise 상태 | UI 결과 |
|------------|-------------|---------|
| `mockReturnValue(new Promise(() => {}))` | Pending (영원히) | 로딩/모달 유지 |
| `mockResolvedValue(value)` | Fulfilled | 성공 UI 표시 |
| `mockRejectedValue(error)` | Rejected | 에러 UI 표시 |

### 4.4 Self-Check

- [ ] 비동기 작업의 pending 상태 UI를 테스트했는가?
- [ ] 성공/실패 각각의 UI 변화를 검증했는가?
- [ ] `new Promise(() => {})` 패턴으로 영구 pending 상태를 테스트했는가?

---

## 5. 테스트 에러 메시지 개선 (setup.ts)

> **목적**: 요소를 찾지 못했을 때 전체 DOM 구조를 출력하여 디버깅 시간을 단축

### 5.1 prettyDOM 에러 개선 설정

**`tests/setup.ts`에 추가:**

```typescript
import { cleanup, configure, prettyDOM } from '@testing-library/react';
import '@testing-library/jest-dom';

configure({
  getElementError: (message: string | null, container) => {
    const error = new Error();

    if (message && message.includes('<body>')) {
      // 이미 DOM이 포함된 경우 그대로 사용
      error.message = message;
    } else {
      // DOM 스냅샷 추가
      const prettifiedDOM = prettyDOM(container);
      error.message = `${message}\n\n${prettifiedDOM}`;
    }

    error.name = 'TestingLibraryElementError';
    return error;
  },
});
```

### 5.2 효과

**Before (기본 에러 메시지):**
```
Unable to find an element with the text: 홍길동
```

**After (prettyDOM 적용):**
```
Unable to find an element with the text: 홍길동

<body>
  <div>
    <header>
      <h1>사용자 정보</h1>
    </header>
    <main>
      <p>로딩중...</p>  <!-- 여기서 문제 원인 발견! -->
    </main>
  </div>
</body>
```

### 5.3 장점

- 실패 원인을 즉시 파악 가능
- "왜 요소를 찾지 못했는지" DOM 구조로 확인
- 비동기 타이밍 문제 (로딩 상태에서 검증 시도) 빠르게 발견
- 디버깅 시간 대폭 단축

---

## 6. 렌더링 검증 규칙

**모든 테스트는 Given 단계 직후 기본 UI가 렌더링되었는지 검증한다.**

### 6.1 이유

- Mock 설정이 잘못되면 DOM이 렌더링되지 않음
- Store 초기화 오류로 컴포넌트가 에러를 발생시키면 빈 화면 렌더링
- 빈 화면 상태에서 `getByX` 호출 시 모든 테스트가 `Unable to find element` 에러
- 이른 검증으로 문제를 빠르게 발견

### 6.2 올바른 패턴

**❌ Bad Pattern (렌더링 미검증)**:
```typescript
it('[S1] 로그인 성공', async () => {
  // Given
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  // When: 바로 상호작용 시도 (렌더링 확인 없음!)
  await user.type(screen.getByPlaceholderText('아이디'), 'test');
  // ← 여기서 에러: Unable to find element
});
```

**✅ Good Pattern (렌더링 검증)**:
```typescript
it('[S1] 로그인 성공', async () => {
  // Given: 로그인 페이지를 연다
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  // ✅ 렌더링 검증: 기본 UI 확인
  expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();

  // When: 검증 후 상호작용
  await user.type(screen.getByPlaceholderText('아이디'), 'test');
});
```

### 6.3 규칙

- `renderWithProviders` 직후 **최소 1개 이상의 기본 요소** 검증
- Form 테스트: input, button 검증
- List 테스트: 제목, 빈 상태 또는 첫 항목 검증
- 검증 실패 시 beforeEach의 Store 초기화부터 확인

**Self-Check**:
- [ ] renderWithProviders 직후 기본 UI를 검증했는가?
- [ ] `toBeInTheDocument()`로 존재 여부를 확인했는가?

---

## 7. UI 테스트 전용 Mocking 규칙

> **공통 Mock 규칙** (Mock 결정 플로우차트 등)은 `rules-core.md`를 참조하세요.
> 아래는 **UI 테스트에서 추가로 필요한 Mock**입니다.

### 7.1 브라우저 API Mock (필수)

```typescript
// ✅ localStorage / sessionStorage Mock
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
});

// ✅ window.location Mock
delete (window as any).location;
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
} as any;

// ✅ window.open / scrollTo Mock
window.open = vi.fn();
window.scrollTo = vi.fn();

// ✅ window.alert/confirm/prompt Mock (JSDOM 미구현)
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('prompt', vi.fn(() => ''));
```

### 7.2 라우터 훅 Mock (필수)

```typescript
// ✅ Next.js Router Mock
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ✅ React Router Mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
}));
```

---

## 8. 간접 의존성 체크리스트

**자식 컴포넌트의 의존성도 반드시 확인하라.**

### 8.1 체크리스트

- [ ] 테스트 대상 컴포넌트가 직접 사용하는 모든 store/hook을 Mock에 포함했는가?
- [ ] 테스트 대상 컴포넌트가 렌더링하는 자식 컴포넌트들을 확인했는가?
- [ ] 각 자식 컴포넌트가 사용하는 store/hook을 확인하고 Mock에 포함했는가?
- [ ] Tailwind CSS 같은 스타일 라이브러리는 Mock하지 않았는가?

### 8.2 예시

```typescript
// LoginPage.tsx
<FullScreenContainer>  // ← 자식 컴포넌트
  <LoginForm />
</FullScreenContainer>

// FullScreenContainer.tsx (자식 컴포넌트)
const { setIsFullScreenContainerUsed } = useFullScreenContainerStore([...]);
// ↑ 이 store도 Mock에 포함해야 함!
```

---

## 9. Framework Router Mock 필수 규칙

> **커스텀 라우터 훅을 mock해도 반드시 프레임워크 라우터도 함께 mock하라.**

### 9.1 문제 상황

- `useCustomRouter`만 mock → 내부에서 `next/navigation`의 `useRouter` 호출 시 에러
- `Error: invariant expected app router to be mounted`

### 9.2 필수 패턴

```typescript
// ✅ 반드시 둘 다 mock

// 1. 프레임워크 라우터 (하위 의존성) - 먼저 mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/current-path',
  useSearchParams: () => ({ get: () => null }),
}));

// 2. 커스텀 라우터 훅 (직접 사용) - 테스트에서 검증할 mock
const mockPush = vi.fn();
vi.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));
```

**Self-Check:**
- [ ] Next.js 프로젝트에서 `next/navigation` mock을 추가했는가?
- [ ] 커스텀 라우터 훅과 프레임워크 라우터 **둘 다** mock했는가?

---

## 10. Functional Page Object Model (POM) 패턴

> **목적**: UI 변경 시 테스트 유지보수 비용을 줄이고, 재사용성을 높인다.

### 10.1 핵심 원칙

**선택자(Selector)와 행위(Action)를 분리하라.**

**❌ Bad**: `test()` 블록 내부에 구현 세부사항 노출
```typescript
test('로그인 성공', async () => {
  const usernameInput = screen.getByRole('textbox', { name: /아이디/ });
  await user.type(usernameInput, 'testuser');
  await user.click(screen.getByRole('button', { name: '로그인' }));
});
```

**✅ Good**: Page Object로 분리
```typescript
const loginPage = {
  elements: {
    getUsernameInput: () => screen.getByRole('textbox', { name: /아이디/ }),
    getSubmitButton: () => screen.getByRole('button', { name: '로그인' }),
  },
  actions: {
    async login(username: string, password: string) {
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

### 10.2 POM 구조

```typescript
const somePage = {
  elements: {
    // ✅ 함수로 정의 (매번 새로운 요소 찾기)
    getUsernameInput: () => screen.getByRole('textbox', { name: /아이디/ }),
  },
  actions: {
    async fillUsername(username: string) { ... },
    async clickSubmit() { ... },
  },
  assertions: {
    expectWelcomeMessage() { ... },
  },
};
```

### 10.3 예외

- 한 번만 사용되는 단순한 단언문
- 테스트 파일이 매우 짧고 재사용 가능성이 낮은 경우
- **단, 3개 이상의 `test()`에서 동일한 선택자/액션을 사용하면 반드시 POM으로 추출**

---

## 11. Store Mock 완전성 체크리스트

**테스트 대상이 사용하는 모든 Store 메서드를 확인한다.**

### 11.1 절차

1. 테스트 대상 컴포넌트/Hook이 import하는 Store 확인
2. 각 Store에서 호출하는 메서드 목록 작성
3. beforeEach에서 resetStores 후 메서드 타입 확인

### 11.2 예시

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

## 12. Store 상태 검증

**UI 상으로 직접 드러나지 않는 Store의 상태 변화도 검증해야 한다.**

### 12.1 방법

```typescript
// Given: 특정 스토어의 액션을 스파이
const setItemSpy = vi.spyOn(useCartStore.getState(), 'setItem');

// When: 사용자가 상품을 장바구니에 추가
await userEvent.click(screen.getByRole('button', { name: /장바구니 추가/ }));

// Then: 스토어의 setItem 액션이 올바른 인자와 함께 호출되었는지 검증
expect(setItemSpy).toHaveBeenCalledWith({ productId: 'P123', quantity: 1 });
```

**Self-Check:**
- [ ] UI에 직접적인 변화는 없지만 Store 상태가 변경되는 시나리오가 있는가?
- [ ] 해당 Store의 액션을 스파이하여 상태 변화를 검증했는가?

---

## 13. 초기값 처리 로직 검증

**시나리오와 실제 구현의 불일치를 반드시 확인하라.**

### 13.1 확인 사항

- **초기값 설정 로직 확인**: `useState`, `useEffect`에서 초기값이 어떻게 처리되는지 확인
- **변환/정규화 로직 확인**: `trim()`, `toLowerCase()` 등이 초기값에 적용되는가?

### 13.2 예시

```typescript
// ✅ Good: 실제 코드 확인 후 작성
// NOTE: 실제 구현은 useState(initialId ?? '')로 초기값에 trim이 적용되지 않음
// 시나리오는 "공백 제거"를 명시하지만, 실제로는 onChange에서만 trim 적용됨
expect(screen.getByPlaceholderText('아이디')).toHaveValue('  prefillUser  ');
```

**체크리스트:**
- [ ] 초기값을 설정하는 모든 `useState` 호출을 확인했는가?
- [ ] 불일치가 있다면 테스트 코드에 주석으로 명시했는가?

---

## 14. 줄바꿈(Multi-line) 텍스트 검증 규칙

HTML에서는 줄바꿈(`\n`)이 공백으로 치환되거나 무시될 수 있으므로, **Regex를 사용**하여 유연하게 검증한다.

### 14.1 패턴

```typescript
// ❌ Bad: 줄바꿈 문자열 직접 매칭 (실패 가능성 높음)
screen.getByText('첫 번째 줄입니다.\n두 번째 줄입니다.');

// ✅ Good: Regex 사용 (마침표 이스케이프, 줄바꿈은 .*로 처리)
screen.getByText(/첫 번째 줄입니다\..*두 번째 줄입니다/s);
```

**규칙:**
- 마침표는 `\.`로 이스케이프
- 줄바꿈은 `.*` 또는 `[\s\S]*`로 처리
- `s` 플래그 사용 시 `.`이 줄바꿈도 매칭

---

## 15. Mock Requirement 매핑

Test Plan의 `(Mock Requirement)` 섹션에 명시된 필드 구조를 **테스트 코드에 주석으로 참조**한다.

### 15.1 빌더 함수 주석 패턴

```tsx
/**
 * Test Plan S1 Mock Requirement:
 * - useNormalContractRentDetailQuery success with datas.details array last item containing
 *   {id, useConnect: boolean, rentCarNumber, drivenDistance, gasCharge, deliveredDate}
 * - datas.request with {id, orderer}
 */
const buildNormalContractDetailResponse = (overrides?: Partial<{...}>) => ({
  success: true,
  datas: { ... }
});
```

---

## 16. Toast/Alert 검증 규칙

### 16.1 Toast 검증

- **비즈니스적으로 중요한 메시지**는 메시지 내용까지 검증한다.
- Store 상태(`toastStore.getState().toasts`)를 사용하여 실제 사용자가 보는 메시지를 검증한다.
- 메시지 검증 시 `includes()`보다는 `===`를 사용하여 정확한 매칭을 권장한다.

```typescript
// ✅ Good: 메시지 내용까지 검증 (타입 가드 포함)
await waitFor(() => {
  const toasts = toastStore.getState().toasts;

  expect(
    toasts.some(
      (toast) => typeof toast.message === 'string' && toast.message === '반납이 완료되었습니다.',
    ),
  ).toBe(true);
});

// ❌ Bad: 타입 가드 없이 includes 사용 (타입 에러 발생)
await waitFor(() => {
  expect(toastStore.getState().toasts.some((toast) => toast.message.includes('반납이 완료'))).toBe(true);
});

// ❌ Bad: 토스트 존재만 확인 (메시지 내용 검증 없음)
await waitFor(() => {
  expect(toastStore.getState().toasts.length).toBeGreaterThan(0);
});
```

### 16.2 타입 가드 필수

`toast.message`는 `string | number` 타입이므로, `includes()` 또는 `===` 사용 전에 **반드시 타입 가드**를 추가해야 한다.

### 16.3 Alert 검증

```typescript
// ✅ Good: Alert spy로 메시지 내용까지 검증
const showAlertSpy = vi.spyOn(alertStore.getState(), 'showAlert');
// ... 테스트 실행 ...
expect(showAlertSpy).toHaveBeenCalledWith({ content: '반납 유류량을 입력해 주세요.' });
```

---

## 17. 에러 처리 검증 전략

> **원칙**: 소스 코드에서 에러 처리 방식을 먼저 파악한 후 적절한 검증 방법을 선택한다.

### 17.1 검증 방법 결정 플로우

1. **에러 메시지가 컴포넌트 state로 관리되고 DOM에 렌더링되는가?**
   ```typescript
   expect(screen.getByText('허용되지 않는 사용자입니다')).toBeVisible();
   expect(screen.getByRole('alert')).toHaveTextContent('허용되지 않는 사용자');
   ```

2. **globalErrorHandler가 `window.alert()`를 호출하는가?**
   ```typescript
   const alertSpy = vi.spyOn(window, 'alert');
   // ... 테스트 실행 ...
   await waitFor(() =>
     expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('오류가 발생했습니다'))
   );
   ```

3. **alertStore/toastStore에 메시지를 추가하는가?**
   ```typescript
   await waitFor(() => {
     const alerts = alertStore.getState().alerts;
     expect(
       alerts.some(alert =>
         typeof alert.content === 'string' &&
         alert.content.includes('고객센터')
       )
     ).toBe(true);
   });
   ```

4. **`console.error`만 출력하는가?**
   ```typescript
   const consoleErrorSpy = vi.spyOn(console, 'error');
   // ... 테스트 실행 ...
   expect(consoleErrorSpy).toHaveBeenCalled();
   consoleErrorSpy.mockRestore();
   ```

### 17.2 소스 코드 분석 방법

1. **에러 핸들러 확인**: `globalErrorHandler.ts`, `errorBoundary.tsx` 등
2. **컴포넌트 내부 확인**: `catch` 블록에서 `setError(message)` 같은 state 업데이트 여부
3. **일관성 유지**: 같은 컴포넌트 내에서는 동일한 검증 방식 사용

### 17.3 체크리스트

- [ ] 소스 코드에서 에러 처리 로직을 확인했는가?
- [ ] globalErrorHandler가 있다면 내부 구현을 확인했는가?
- [ ] `window.alert` spy를 사용했다면 테스트 종료 전 `mockRestore()`를 호출했는가?

---

## 18. Business Logic & Hook Mocking 규칙

UI 테스트는 **"복잡한 내부 로직의 정합성"**을 검증하지 않는다.
UI 컴포넌트가 **"데이터 상태에 따라 올바르게 렌더링되는지"**만 본다.

### 18.1 Store/Hook Mocking 체크리스트

**Mock 작성 전 반드시 확인:**

1. **직접 의존성 확인**: 테스트 대상 컴포넌트가 직접 import하여 사용하는 모든 store/hook
2. **간접 의존성 확인**: 자식 컴포넌트가 사용하는 store/hook
3. **Provider 체인 확인**: `renderWithProviders`가 제공하는 모든 Provider
4. **실행 시점 확인**: 렌더링되는 모든 컴포넌트의 의존성을 Mock에 포함

```typescript
// ❌ Bad: LoginPage만 확인하고 FullScreenContainer는 확인 안 함
vi.mock('@/stores', () => ({
  useAppStore: vi.fn(),
  useLoadingStore: vi.fn(),
  // useFullScreenContainerStore 누락! → 테스트 실패
}));

// ✅ Good: LoginPage + 자식 컴포넌트 모두 확인
vi.mock('@/stores', () => ({
  useAppStore: vi.fn(),
  useLoadingStore: vi.fn(),
  useFullScreenContainerStore: vi.fn(() => ({
    setIsFullScreenContainerUsed: vi.fn(),
  })),
}));
```

### 18.2 언제 Hook을 Mocking 하는가?

- 로직이 복잡해서 테스트 셋업이 어려운 경우
- `useEffect`나 내부 타이머가 UI 테스트를 방해하는 경우
- **Unit Test에서 이미 검증된 로직일 경우**

> ⚠️ **주의: Network Mutation Hook은 Mocking 금지**
> API 통신을 담당하는 Custom Hook은 **무조건 MSW**를 통해 네트워크 계층에서 Mocking한다.

### 18.3 Mocking 예시

```ts
// ❌ Bad: 실제 로직 실행 (느리고 깨지기 쉬움)
const { result } = renderHook(() => useCartLogic());

// ✅ Good: UI 상태 주입
vi.mock('@/hooks/useCartLogic', () => ({
  useCartLogic: vi.fn(() => ({
    cartItems: [{ id: 1, name: '테스트 상품', price: 10000 }],
    totalPrice: 10000,
    isLoading: false,
    addToCart: vi.fn(),
  }))
}));
```

### 18.4 Vitest Mocking & Hoisting Rules

`vi.mock`은 파일의 최상단으로 hoisting 되므로, mock factory 내부에서 외부 변수를 참조하면 `ReferenceError`가 발생한다.

```typescript
// ❌ Bad: ReferenceError 발생
const myMock = vi.fn();
vi.mock('my-module', () => ({
  myMethod: myMock, // Error: myMock is not initialized
}));

// ✅ Good: vi.hoisted 사용
const { myMock } = vi.hoisted(() => ({
  myMock: vi.fn(),
}));
vi.mock('my-module', () => ({
  myMethod: myMock,
}));
```

### 18.5 고급 vi.hoisted 패턴 (동적 Mock 상태 관리)

Mock 상태를 테스트별로 동적으로 변경해야 할 때 클로저 기반 상태 관리를 사용한다.

```typescript
// ✅ Good: 클로저로 상태 관리 (테스트별 변경 가능)
const { setSearchParams, getSearchParams } = vi.hoisted(() => {
  let searchParams: Record<string, string | undefined> = {};
  return {
    setSearchParams: (params: Record<string, string | undefined>) => {
      searchParams = params;
    },
    getSearchParams: () => searchParams,
  };
});

vi.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({
    searchParams: getSearchParams(),
  }),
}));

// 테스트에서 사용
beforeEach(() => {
  setSearchParams({});
});

it('초기 아이디가 미리 채워진다', () => {
  setSearchParams({ id: 'prefilled' });
  renderLogin();
  expect(idInput).toHaveValue('prefilled');
});
```

### 18.6 UI Component Stubbing Rules

- **Meaningful Stubs**: 복잡한 컴포넌트는 최소한의 상호작용이 가능하도록 만든다.
- ❌ `div`나 `button`으로 퉁치기 금지
- ✅ `input`을 렌더링하고 `props`를 연결

```tsx
// ✅ Good Stub
vi.mock('@/components/MyInput', () => ({
  MyInput: ({ value, onChange }) => <input value={value} onChange={e => onChange(e.target.value)} />
}));
```

---

## 19. Render Wrapper 규칙

테스트는 실제 앱 환경과 최대한 비슷해야 한다.

### 19.1 AppProviders 패턴

```ts
render(<LoginView />, {
  wrapper: AppProviders
});
```

`AppProviders` 안에는 다음이 들어간다 (프로젝트에 따라 다름):
- ThemeProvider
- QueryClientProvider
- Router/Navigation provider
- Recoil/Zustand Provider
- i18n Provider 등

> 이미 프로젝트에 `renderWithProviders` 같은 util이 있다면 **반드시 그것을 우선 사용**한다.
