<!-- Source: rules-core.md -->
# 📘 Test Coding Conventions - Core Rules

> **이 문서는 AI가 테스트 코드를 작성할 때 준수해야 할 공통 규칙을 정의합니다.**
> UI 테스트와 Unit 테스트 모두에 적용됩니다.

---

## 0. 목적

**테스트 코드 생성 시 준수해야 할 작성 규칙을 정의합니다.**

- Test runner 문법
- MSW handler 작성 패턴
- waitFor / Mock 사용 규칙

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

**URL 매칭 규칙**:
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

### 2.2 에러 응답 Mock 규칙

> **원칙**: 프로젝트의 에러 타입 정의를 정확히 따른다.

**문제 상황:**
프로젝트의 커스텀 에러 클래스가 특정 필드 경로에 접근하는데, Mock 응답이 해당 구조를 포함하지 않으면 `TypeError: Cannot read properties of undefined`가 발생한다.

**체크리스트:**
- [ ] 에러 타입 파일(`error.type.ts`, `api.type.ts` 등)을 확인했는가?
- [ ] 커스텀 에러 클래스가 어떤 필드에 접근하는지 확인했는가?
- [ ] 에러 응답 Mock이 실제 API 응답 구조와 동일한가?

**Example:**

```typescript
// ❌ Bad: 최소한의 에러만 반환 (필드 누락 가능)
server.use(
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json({ error_no: 101 }, { status: 401 })
  )
);
// 만약 커스텀 에러 클래스가 error.response.data.error 접근 시 TypeError 발생

// ✅ Good: 프로젝트의 에러 구조를 정확히 따름
// (예: RencarError가 error.response.data.error 접근 시)
server.use(
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json(
      {
        error_no: 101,
        error: { data: null }, // 커스텀 에러 클래스가 접근하는 필드
        message: '허용되지 않는 사용자',
      },
      { status: 401 }
    )
  )
);
```

**디버깅 팁:**
- 에러 발생 시 커스텀 에러 클래스(`RencarError`, `ApiError` 등)의 소스 코드를 확인하라.
- `error.response.data.error`, `error.data.message` 등 중첩된 필드 접근 경로를 파악하라.
- 실제 API 응답 스펙 문서가 있다면 그대로 따르라.

### 2.3 Test 내부 사용 규칙

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

### 2.3.1 Stateful Mock 응답 패턴 (Advanced)

> **목적**: 여러 API 호출 간 상태 연동이 필요한 복잡한 시나리오 테스트

**사용 시점**:
- 장바구니 추가 → 총액 동기화
- 쿠폰 적용 → 할인 금액 반영
- 여러 단계의 상태 전이 테스트

```typescript
// ✅ Good: 클로저로 상태 관리
it('상품을 장바구니에 추가하면 총액이 동기화됩니다.', async () => {
  let totalAmount = 0;  // 클로저로 상태 추적
  let cartItems: number[] = [];

  mockServer.use(
    http.get('/api/cart', () =>
      HttpResponse.json({ totalAmount, items: cartItems })
    ),
    http.post('/api/cart/:productId', ({ params }) => {
      totalAmount += 15000;  // API 호출 시 상태 변경
      cartItems.push(Number(params.productId));
      return HttpResponse.json({ success: true });
    })
  );

  renderWithProviders(<ProductPage />);
  await screen.findByText('0원');

  const button = await screen.findByRole('button', { name: '장바구니 담기' });
  await user.click(button);

  await screen.findByText('15,000원');  // 변경된 상태가 UI에 반영됨
});
```

```typescript
// ✅ Good: 알림 설정 상태 변경 테스트
it('알림을 허용하면 설정 화면이 정상적으로 출력됩니다.', async () => {
  let notificationEnabled = false;  // 초기 알림 비활성화

  mockRequestNotification.mockImplementation(async () => {
    notificationEnabled = true;  // 알림 요청 시 상태 변경
    return true;
  });
  mockCheckNotification.mockImplementation(async () => notificationEnabled);

  renderWithProviders(<SettingsPage />);

  await user.click(await screen.findByText('알림 허용'));

  await screen.findByText(/알림이 활성화되었습니다/);  // 설정 변경 후 UI 업데이트
});
```

**핵심 원칙**:
- 상태 변수는 테스트 함수 스코프 내에서 선언 (클로저 활용)
- `afterEach`에서 `mockServer.resetHandlers()` 호출로 자동 정리됨
- 복잡한 상태 흐름도 단일 테스트 내에서 검증 가능

### 2.4 Server Lifecycle (Setup 파일에서 처리됨)

```typescript
// tests/setup.ts (참고용, AI가 생성할 필요 없음)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

---

## 3. Async & waitFor Rules

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

## 4. Mocking Strategy

### 4.1 Mock 결정 플로우차트

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

### 4.4 Mock하지 말아야 하는 것 상세 예시

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

### 4.5 Mock 주석 필수 규칙

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

### 4.7 Weak Assertion 금지 (인자 검증 필수)

**Void 함수(리턴값 없는 함수)는 "인자(Argument)가 곧 결과값"이다.**

호출 여부만 검증하면 잘못된 인자로 호출되어도 테스트가 통과한다.

```typescript
// ❌ Bad: 호출 여부만 검증 - 잘못된 인자로 호출해도 통과
expect(saveFn).toHaveBeenCalled();
expect(saveFn).toHaveBeenCalledTimes(1);

// ✅ Good: 인자까지 검증 - 정확한 값 전달 확인
expect(saveFn).toHaveBeenCalledWith({ id: 1, name: 'test' });
```

**적용 대상 (Side-Effect 함수):**
- API 호출: `fetch`, `axios.post`
- Storage 저장: `localStorage.setItem`, `sessionStorage.setItem`
- Router 이동: `router.push`, `router.replace`
- Store 액션: `dispatch`, `setState`, `setItem`
- 외부 서비스: `analytics.track`, `logger.error`

**예외:**
- 호출 여부 자체가 중요한 경우 (예: `router.back()` - 인자 없음)
- `not.toHaveBeenCalled()` (호출되지 않아야 함을 검증)

### 4.8 Module Path Mock 주의사항

> **동일 모듈이라도 import 경로가 다르면 각각 mock해야 한다.**

**문제 상황:**
- `@/hooks`에서 re-export된 훅을 mock
- 하지만 다른 파일에서 직접 경로(`@/hooks/useCustomRouter`)로 import하면 mock 미적용
- 테스트 시 mock 함수가 호출되지 않음

**예시:**
```typescript
// LoginForm.tsx
import { useCustomRouter } from '@/hooks';  // ← @/hooks mock 적용됨

// useAuth.ts (간접 의존성)
import { useCustomRouter } from '../useCustomRouter';  // ← @/hooks mock 적용 안 됨!
```

**해결 패턴:**
```typescript
// ❌ Bad: 한 경로만 mock
vi.mock('@/hooks', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));

// ✅ Good: 가능한 모든 import 경로를 mock
vi.mock('@/hooks', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));
vi.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));
```

**디버깅 팁:**
- mock이 호출되지 않으면 **테스트 대상 파일의 import 경로**를 확인
- barrel export(`index.ts`)와 직접 import 경로가 다를 수 있음
- 상대 경로(`../useCustomRouter`)는 절대 경로(`@/hooks/useCustomRouter`)로 변환하여 mock

**Self-Check:**
- [ ] barrel export와 직접 import 경로 둘 다 mock했는가?
- [ ] 간접 의존성(테스트 대상이 사용하는 훅/유틸)의 import 경로를 확인했는가?

---

## 5. Anti-Patterns (즉시 중단)

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
- ❌ Weak Assertion (`toHaveBeenCalled()` 단독 사용 → `toHaveBeenCalledWith()` 필수)

발견 즉시 수정.

### 5.1 코드 생성 품질 규칙

#### 5.1.1 테스트 하드코딩 금지

**정의**: 테스트 통과만을 위해 소스 코드에 특정 입력값을 하드코딩하는 행위

```typescript
// ❌ Bad: 테스트 케이스별 하드코딩
function calculateDiscount(price: number): number {
  if (price === 1000) return 100;  // 테스트 통과용
  if (price === 5000) return 500;  // 테스트 통과용
  return price * 0.1;
}

// ✅ Good: 일반화된 로직
function calculateDiscount(price: number): number {
  return price * 0.1;
}
```

**Self-Check:**
- [ ] 특정 테스트 입력값에만 동작하는 조건문을 추가했는가?
- [ ] 테스트 실패 시 로직 수정 대신 하드코딩으로 해결하려 했는가?

#### 5.1.2 과도한 엔지니어링 금지

**정의**: 테스트 코드에 불필요한 추상화, 헬퍼, 유틸리티를 생성하는 행위

**판단 기준 (Concrete Rules):**

| 상황 | 판단 | 이유 |
|-----|------|-----|
| 헬퍼 함수가 **1회만** 사용됨 | ❌ 생성 금지 | 인라인으로 작성 |
| 데이터 객체가 **5개 이하** 필드 | ❌ Builder 금지 | 객체 리터럴 사용 |
| setup 코드가 **10줄 이하** | ❌ 추상화 금지 | beforeEach에 직접 작성 |
| Testing Library 함수 래핑 | ❌ 래퍼 금지 | 원본 함수 직접 사용 |

**예시:**

```typescript
// ❌ Bad: 1회 사용 헬퍼 + Builder 패턴
class UserBuilder {
  private data: Partial<User> = {};
  withName(n: string) { this.data.name = n; return this; }
  withEmail(e: string) { this.data.email = e; return this; }
  build() { return this.data as User; }
}
const user = new UserBuilder().withName('test').withEmail('a@b.com').build();

// ✅ Good: 객체 리터럴
const user: User = { name: 'test', email: 'a@b.com' };
```

```typescript
// ❌ Bad: Testing Library 래퍼
const clickButton = (name: string) =>
  userEvent.click(screen.getByRole('button', { name }));
await clickButton('제출');

// ✅ Good: 직접 사용
await userEvent.click(screen.getByRole('button', { name: '제출' }));
```

**예외 (허용되는 경우):**
- 3회 이상 반복되는 복잡한 setup 로직
- 프로젝트 전역에서 재사용되는 테스트 유틸리티 (`tests/utils/`)
- MSW 핸들러, Provider 래퍼 등 인프라성 코드

**Self-Check:**
- [ ] 이 헬퍼/유틸이 2회 이상 사용되는가?
- [ ] 객체 리터럴로 충분한데 Builder를 만들었는가?
- [ ] Testing Library 함수를 불필요하게 감쌌는가?

---

## 6. Self Checklist

- [ ] 테스트가 jsdom 필요한가? (UI만)
- [ ] waitFor는 DOM 변화에만 사용했는가?
- [ ] API mock 검증은 동기 처리했는가?
- [ ] Store 초기화를 beforeEach에서 했는가?
- [ ] 실패 핸들러를 server.use로 로컬에서만 사용했는가?
- [ ] Snapshot 사용하지 않았는가?
- [ ] Mock 내부 구현 검증하지 않았는가?
- [ ] 상수 파일을 importActual로 부분 Override했는가?
- [ ] Side-Effect 함수 검증 시 `toHaveBeenCalledWith()`로 인자까지 검증했는가?

---

## 7. 🚨 Critical Constraints (Safety Rules)

> **이 섹션은 AI가 테스트 코드를 생성할 때 반드시 지켜야 할 안전 규칙입니다.**
> UI 테스트와 Unit 테스트 모두에 적용됩니다.

### 7.1 Max Retries (최대 재시도 횟수)

- 수정 및 재실행은 **최대 3회**까지만 허용합니다.
- 3회 실패 시 "❌ 3회 실패" 메시지와 함께 마지막 에러 로그를 출력하고 멈추십시오.
- 무한 루프 방지를 위한 필수 규칙입니다.

### 7.2 Scope Limitation (수정 범위 제한)

- 오직 **테스트 파일**만 수정하십시오.
- 원본 소스 코드(`app/...`, `src/...`)나 설정 파일은 **절대 수정하지 마십시오.**
- 테스트 실패 시 테스트 코드를 수정해야지, 소스 코드를 수정하면 안 됩니다.

### 7.3 Execution Policy (실행 정책)

- **Agentic Mode** (터미널 실행 권한이 있는 경우):
  - 반드시 테스트를 실행하고 검증해야 합니다.
  - 단순히 코드를 출력하고 끝내지 마십시오.
- **Chat Mode** (터미널 권한이 없는 경우):
  - 이 단계를 건너뛰고 코드만 출력하십시오.

---

## 8. 최종 요약

📌 **business-logic / ui-test / routing 모두 이 문서를 따른다.**

**이 문서의 모든 규칙은 "코드 작성"에 직접 영향을 준다:**
- MSW handler 작성법 → `http.post(URL, ...)`
- waitFor 사용법 → `await waitFor(() => expect(ui).toBeVisible())`
- Mock 전략 → `vi.mock` vs `vi.importActual`
- Store 초기화 → `beforeEach(() => store.setState(...))`

> 실행 규칙 = 팀 표준
> 생성 프롬프트 = 언제든 업데이트 가능
