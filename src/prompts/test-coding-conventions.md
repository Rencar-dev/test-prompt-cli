# 📘 Test Coding Conventions & MSW Guide

> **이 문서는 AI가 테스트 코드를 작성할 때 준수해야 할 "구현 규칙"과 "MSW 패턴"을 정의합니다.**  
> 실행 환경(Node 버전, CI 설정) 관련 내용은 포함하지 않습니다.

---

## 0. 목적

**테스트 코드 생성 시 준수해야 할 작성 규칙을 정의합니다.**

- Test runner 문법
- MSW handler 작성 패턴
- waitFor / Mock / Fake Timer 사용 규칙
- 테스트 고립성(Isolation) 보장 방법

> 🎯 이 문서의 모든 규칙은 "AI가 생성하는 `.test.ts` 파일 내용"에 직접 영향을 줍니다.

---

## 1. Test Runner & Syntax

### 1.1 기본 구문
- **Runner**: Vitest (권장) 또는 Jest
- **Import 필수**: `import { describe, it, expect, vi } from 'vitest'`
- **Environment**:
  - UI Component Test: `jsdom`
  - Business Logic (Utils/Hooks/Store): `node` (기본)

### 1.2 Vitest vs Jest 차이 (핵심만)
```typescript
// Vitest
import { vi } from 'vitest';
vi.mock('./module');

// Jest
jest.mock('./module');
```

> 📘 **참고**: `project-manifest.yaml`의 `testRunner` 필드로 runner를 확인하세요.

---

## 2. MSW Handler Rules (핵심)

> **MSW는 절대 전역 fetch 막는 "proxy"가 아니다.**  
> **API Layer에 대한 명시적 Contract Provider다.**

### 2.1 Handler 작성 패턴

**폴더 구조** (필수):
```
mocks/
├── [domain]/
│   ├── handler.ts    # MSW 핸들러 정의
│   └── data.ts       # Mock 데이터 (순수 데이터만)
```

**URL 매칭 규칙** (Critical):
```typescript
// ❌ Bad: 상대 경로 (baseURL이 있으면 매칭 실패)
const loginHandler = http.post('/auth', () => HttpResponse.json({ ... }));

// ✅ Good: 환경변수로 절대 URL
const API_BASE_URL = process.env.BACKEND_URL || 'https://api.example.com';
const loginHandler = http.post(`${API_BASE_URL}/auth`, () =>
  HttpResponse.json({ accessToken: 'test-token' }),
);
```

**data.ts 패턴** (Mandatory):
```typescript
// mocks/auth/data.ts
import type { LoginResponse } from '@/network/apis/auth.type';

export const mockLoginSuccess: LoginResponse = {
  accessToken: 'test-access-token',
};

export const mockLoginError = {
  error_no: 101,
  message: '허용되지 않는 사용자 입니다.',
};
```

**규칙**:
- `data.ts`는 순수 데이터만 (핸들러 로직 금지)
- 타입을 import하여 타입 안전성 확보
- `mock[Entity][State]` 명명 규칙

### 2.2 Test 내부 사용 규칙

**기본 원칙**:
- **기본 handlers**: 성공/중립 시나리오만
- **실패/에러 응답**: 각 테스트 내부에서 `server.use()`로 override

```typescript
// ✅ Good Pattern
import { server } from '@/tests/server';
import { loginErrorHandler } from '@/mocks/auth/handler';

it('로그인 실패 시 에러 toast 노출', async () => {
  server.use(loginErrorHandler); // Override only for this test
  // ...
});
```

**절대 금지** ❌:
- 테스트 내부에서 `server.listen()` 호출
- 전역 server 기본 handlers에 에러 핸들러 섞기

### 2.3 Server Lifecycle (Setup 파일에서 처리됨)

```typescript
// tests/setup.ts (참고용, AI가 생성할 필요 없음)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

---

## 3. Async & waitFor Rules (Critical)

### 3.1 핵심 원칙

> "waitFor = 비동기 UI 상태 변화 기다림"  
> Mock 호출 검증을 기다리는 도구가 아님

### 3.2 올바른 패턴

```typescript
await userEvent.click(screen.getByRole('button', { name: /로그인/ }));

// 1) 비동기: UI 변화 기다리기
await waitFor(() =>
  expect(screen.queryByText('로딩중...')).not.toBeInTheDocument()
);

// 2) 동기: mock 호출 검증
expect(loginApi).toHaveBeenCalledWith({ id: 'user', password: 'pw' });
```

### 3.3 절대 금지 (Anti-Pattern)

```typescript
// ❌ Bad
await waitFor(() => expect(mockFn).toHaveBeenCalled());
```


---

## 3.4 Element Selector Priority (Critical)

> **목적**: 접근성(Accessibility) 개선과 테스트 안정성을 동시에 향상한다.

### 3.4.1 선택자 우선순위 규칙

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

### 3.4.2 올바른 예시

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

### 3.4.3 잘못된 예시 (Anti-Pattern)

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

### 3.4.4 Role 사용 가이드

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

### 3.4.5 Self-Check

**테스트 작성 후 체크리스트:**
- [ ] `getByTestId`를 사용했다면, `getByRole`로 대체 가능한지 재검토했는가?
- [ ] `querySelector`나 `getByClassName`을 사용하지 않았는가?
- [ ] 모든 폼 요소가 적절한 `label` 또는 `aria-label`을 가지는가?
- [ ] 버튼/링크가 명확한 접근 가능한 이름(`name` 옵션)을 가지는가?

---

## 3.5 Robust Click Strategy (Critical)

> **목적**: Playwright/Testing Library에서 간헐적 클릭 실패(Flaky)를 방지한다.

### 3.5.1 4단계 폴백 전략

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

### 3.5.2 언제 사용하는가?

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

### 3.5.3 재사용 가능한 유틸 함수로 추상화

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

## 3.6 Safe Wait Strategy (Critical)

> **목적**: `networkidle` 대기의 불안정성을 해결하고 UI 앵커 기반 대기로 안정성을 향상한다.

### 3.6.1 기본 원칙

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

### 3.6.2 올바른 대기 패턴

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

### 3.6.3 Anti-Pattern

```typescript
// ❌ Bad: 임의의 시간 대기
await new Promise(resolve => set Timeout(resolve, 1000));

// ❌ Bad: 네트워크 idle 대기
await page.waitForLoadState('networkidle');

// ❌ Bad: Mock 호출 대기 (이미 동기적으로 발생)
await waitFor(() => expect(mockFn).toHaveBeenCalled());
```

### 3.6.4 Self-Check

**테스트 작성 후 체크리스트:**
- [ ] `setTimeout`이나 `sleep`을 사용하지 않았는가?
- [ ] `networkidle` 대신 UI 앵커 기반 대기를 사용했는가?
- [ ] `waitFor`를 Mock 호출 검증에 사용하지 않았는가?
- [ ] 대기 조건이 명확하고 결정적(Deterministic)인가?

---

## 4. Mocking Strategy

### 4.1 Mock 결정 플로우차트 (Critical)

**Mocking 여부를 결정할 때 아래 플로우차트를 따라라:**

```
Q1: 외부 IO/API인가? (fetch, axios, localStorage, sessionStorage 등)
  ├─ YES → Q2로
  └─ NO → Q3로

Q2: 비즈니스 로직을 포함하는가?
  ├─ YES → ❌ Mock 금지 (MSW 사용)
  └─ NO → ✅ Mock 허용 (vi.spyOn 또는 vi.mock)

Q3: 테스트 환경에서 제어 불가능한가? (시간, 브라우저 API, 라우터 등)
  ├─ YES → ✅ Mock 허용
  └─ NO → ❌ Mock 금지 (실제 코드 사용)
```

**예시:**
- `fetchUser` API → Q1 YES → Q2 NO → ✅ Mock 허용
- `calculateTotal` 함수 → Q1 NO → Q3 NO → ❌ Mock 금지
- `Date.now()` → Q1 NO → Q3 YES → ✅ Mock 허용
- `useMutation` Hook → Q1 NO → Q3 NO → ❌ Mock 금지 (MSW 사용)

### 4.2 Mock해야 하는 것 (시간 API)

**시간 관련 API는 테스트 환경에서 제어 불가능하므로 반드시 Mock한다:**

```typescript
// ✅ 시간 API Mock (필수)
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// Mock 대상:
// - Date.now()
// - new Date()
// - setTimeout()
// - setInterval()
// - requestAnimationFrame()
```

**예시:**
```typescript
// ❌ Bad: 실제 시간 사용 (비결정적)
const now = Date.now(); // 매번 다른 값

// ✅ Good: Fake Timer 사용
vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
const now = Date.now(); // 항상 동일한 값
```

### 4.3 비즈니스 로직 Mocking 금지

> **비즈니스 로직(service/utils)을 Mock 하지 않는다.**  
> **외부 IO/API(fetch/axios/repo)만 Mock한다.**

```typescript
// ✅ 올바른 예
vi.spyOn(api, 'fetchUser').mockResolvedValue({ id: 1 });
processUserData(1);

// ❌ 절대 금지
vi.spyOn(service, 'calculateTotal').mockReturnValue(100);
// → 로직 죽음 → 테스트 무의미
```

### 4.4 Mock하지 말아야 하는 것 상세 예시 (Critical)

#### 4.4.1 상수 파일

**상수는 부작용이 없으므로 Mock하지 않는다.**

```typescript
// ❌ Bad: 상수 파일 전체 재정의 (누락 위험)
vi.mock('@/constants', () => ({
  ERROR_CODE: { INVALID: 101 },
  // ⚠️ 다른 export 누락 가능
}));

// ✅ Good: importActual로 부분 Override (불가피한 경우만)
import type * as ConstantsModule from '@/constants';

vi.mock('@/constants', async () => {
  const actual = await vi.importActual<typeof ConstantsModule>('@/constants');
  return {
    ...actual,
    ERROR_CODE: {
      ...actual.ERROR_CODE,
      INVALID: 101, // 필요한 것만 변경
    },
  };
});

// ✅ Best: Mock하지 않기 (권장)
import { ERROR_CODE } from '@/constants';
```

#### 4.4.2 타입 파일

**타입은 런타임에 존재하지 않으므로 Mock할 수 없고, Mock할 필요도 없다.**

```typescript
// ❌ Bad: 타입 파일 Mock 시도 (의미 없음)
vi.mock('@/types/user', () => ({
  User: { id: number, name: string }
}));

// ✅ Good: 타입은 그냥 import
import type { User } from '@/types/user';
```

#### 4.4.3 순수 함수 (Utils)

**순수 함수는 부작용이 없으므로 Mock하지 않는다.**

```typescript
// ❌ Bad: 순수 함수 Mock (테스트 무의미)
vi.spyOn(utils, 'formatPrice').mockReturnValue('1,000원');
expect(formatPrice(1000)).toBe('1,000원'); // 로직 검증 안 됨

// ✅ Good: 실제 함수 사용
import { formatPrice } from '@/utils/format';
expect(formatPrice(1000)).toBe('1,000원'); // 실제 로직 검증
```

#### 4.4.4 UI 컴포넌트

**일반 UI 컴포넌트는 Mock하지 않는다. (서드파티 예외)**

```typescript
// ❌ Bad: 자체 컴포넌트 Mock
vi.mock('@/components/Button', () => ({
  Button: () => <div>Mock Button</div>
}));

// ✅ Good: 실제 컴포넌트 사용
import { Button } from '@/components/Button';
render(<Button>Click</Button>);

// ⚠️ 예외: 서드파티 컴포넌트 (복잡한 의존성)
// 예: Chart.js, DatePicker 등 복잡한 라이브러리
vi.mock('react-datepicker', () => ({
  default: ({ onChange }: any) => <input onChange={onChange} />
}));
```

**Self-Check:**
- [ ] 상수 파일을 전체 재정의하지 않았는가?
- [ ] 타입 파일을 Mock하려고 시도하지 않았는가?
- [ ] 순수 함수를 Mock하지 않았는가?
- [ ] 자체 UI 컴포넌트를 Mock하지 않았는가?

### 4.4.5 Vitest hoisting 주의

`vi.mock` 팩토리는 파일 최상단으로 hoist된다. 팩토리 밖 변수/상수를 참조하면 TDZ 에러가 발생한다. 반드시 팩토리 내부에서 mock 객체를 생성하거나 `vi.hoisted` 블록을 사용한다.

- ❌ Bad:
```typescript
const mockStorage = { getItem: vi.fn() };
vi.mock('@/utils', () => ({ storage: mockStorage }));
```
- ✅ Good:
```typescript
vi.mock('@/utils', () => {
  const mockStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
  return { storage: mockStorage };
});
```

### 4.5 Mock 주석 필수 규칙 (Critical)

**모든 Mock에는 반드시 주석을 달아야 한다.**

**주석 필수 항목:**
1. **Mock 이유**: 왜 Mock하는가?
2. **Mock 범위**: 무엇을 Mock하는가?
3. **Mock 값**: 어떤 값을 반환하는가?

```typescript
// ✅ Good: 상세한 주석
// Mock 이유: localStorage는 테스트 환경에서 제어 불가능
// Mock 범위: Storage.prototype.getItem, setItem
// Mock 값: getItem은 null 반환, setItem은 무시
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});

// ✅ Good: API Mock 주석
// Mock 이유: 외부 API 호출 방지 및 응답 제어
// Mock 범위: fetchUser API
// Mock 값: 성공 응답 (id: 1, name: 'Test User')
vi.spyOn(api, 'fetchUser').mockResolvedValue({ id: 1, name: 'Test User' });

// ❌ Bad: 주석 없음
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  // ← 왜 Mock하는지, 무엇을 Mock하는지 불명확
});
```

**Self-Check:**
- [ ] 모든 Mock에 주석을 달았는가?
- [ ] Mock 이유를 명시했는가?
- [ ] Mock 범위를 명시했는가?
- [ ] Mock 값을 명시했는가?

### 4.6 Mutation Hook Mocking 금지

**Mutation Hook 자체를 Mocking 하지 않는다. (절대 금지 🚫)**

- `useMutation`을 mock하면 `onError`, `onSuccess` 등 **실제 에러 처리 로직이 실행되지 않는다.**
- 대신 **MSW에서 4xx/5xx 에러 응답**을 내려주어 검증한다.

```typescript
// ❌ Bad (해고감)
vi.mock('@/hooks/useCustomMutation', () => ({
  useCustomMutation: () => ({ mutate: vi.fn() })
}));

// ✅ Good: MSW로 에러 응답 제어
server.use(
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json({ error_no: 101 }, { status: 401 })
  )
);
```

---

## 5. Fake Timer

### 5.1 기본 세팅

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

### 5.2 Async 처리

```typescript
await vi.runAllTimersAsync();
// 또는
await vi.advanceTimersByTimeAsync(1000);
```

> 💡 Timer + Date = **Deterministic** 유지

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

### 6.2 Browser APIs

```typescript
// localStorage / sessionStorage는 mock
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});
```

---

## 7. Anti-Patterns (즉시 중단)

테스트 출력 전에 **스스로 검사**:

- ❌ Snapshot Test
- ❌ Private variable 검증
- ❌ Subscribe/middleware 호출 검증
- ❌ waitFor + toHaveBeenCalled
- ❌ 테스트 내부에서 server.listen
- ❌ Mutation Hook Mocking
- ❌ 비즈니스 로직 Mocking
- ❌ 상수 파일 전체 재정의
- ❌ className/style 등 스타일 단언

발견 즉시 수정.

---

## 8. Self Checklist

- [ ] 테스트가 jsdom 필요한가? (UI만)
- [ ] waitFor는 DOM 변화에만 사용했는가?
- [ ] API mock 검증은 동기 처리했는가?
- [ ] Store 초기화를 beforeEach에서 했는가?
- [ ] 실패 핸들러를 server.use로 로컬에서만 사용했는가?
- [ ] Snapshot 사용하지 않았는가?
- [ ] Mock 내부 구현 검증하지 않았는가?
- [ ] 상수 파일을 importActual로 부분 Override했는가?

---

## 9. 최종 요약

📌 **business-logic / ui-test / routing 모두 이 문서를 따른다.**

**이 문서의 모든 규칙은 "코드 작성"에 직접 영향을 준다:**
- MSW handler 작성법 → `http.post(URL, ...)`
- waitFor 사용법 → `await waitFor(() => expect(ui).toBeVisible())`
- Mock 전략 → `vi.mock` vs `vi.importActual`
- Store 초기화 → `beforeEach(() => store.setState(...))`

> 실행 규칙 = 팀 표준  
> 생성 프롬프트 = 언제든 업데이트 가능
