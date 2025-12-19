# Vitest Rules

> **Vitest 테스트 러너 사용 시 적용되는 규칙입니다.**

---

## 1. 기본 Import

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

---

## 2. vi.mock 호이스팅 주의

**`vi.mock`은 파일 최상단으로 호이스팅됩니다. factory 내부에서 외부 변수를 참조하면 TDZ 에러가 발생합니다.**

```typescript
// ❌ Bad: 외부 변수 참조 → ReferenceError
const mockStorage = { getItem: vi.fn() };
vi.mock('@/utils', () => ({ storage: mockStorage }));

// ✅ Good: factory 내부에서 생성
vi.mock('@/utils', () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));
```

---

## 3. vi.hoisted 패턴

**테스트별로 Mock 상태를 동적으로 변경해야 할 때 사용:**

```typescript
// ✅ Good: vi.hoisted로 상태 관리
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));

// 테스트에서 사용
beforeEach(() => {
  mockPush.mockClear();
});

it('로그인 성공 시 대시보드로 이동', async () => {
  // ...
  expect(mockPush).toHaveBeenCalledWith('/dashboard');
});
```

### 고급 패턴: 클로저 기반 동적 상태

```typescript
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

// 테스트에서 동적 변경
it('초기 아이디가 미리 채워진다', () => {
  setSearchParams({ id: 'prefilled' });
  renderLogin();
  expect(idInput).toHaveValue('prefilled');
});
```

---

## 4. vi.spyOn 패턴

```typescript
// 기본 사용
const fetchSpy = vi.spyOn(api, 'fetchUser').mockResolvedValue({ id: 1 });

// 테스트 후 복원
afterEach(() => {
  fetchSpy.mockRestore();
});

// 또는 전역 복원
afterEach(() => {
  vi.restoreAllMocks();
});
```

---

## 5. Module Path Mock 주의

**동일 모듈이라도 import 경로가 다르면 각각 mock해야 합니다.**

```typescript
// 문제: barrel export와 직접 import 경로가 다름
// LoginForm.tsx → import { useCustomRouter } from '@/hooks';
// useAuth.ts → import { useCustomRouter } from '../useCustomRouter';

// ❌ Bad: 한 경로만 mock
vi.mock('@/hooks', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));

// ✅ Good: 가능한 모든 경로를 mock
vi.mock('@/hooks', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));
vi.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));
```

---

## 6. vi.importActual 패턴

**일부만 mock하고 나머지는 실제 구현 사용:**

```typescript
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
```

---

## 7. Fake Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

it('타이머 테스트', async () => {
  // 타이머 진행
  vi.advanceTimersByTime(1000);

  // 또는 모든 타이머 즉시 실행
  vi.runAllTimers();
});
```

### 7.1 setInterval 테스트 패턴

> **목적**: `setInterval` 기반의 주기적 API 호출, 폴링 등을 테스트

**핵심 옵션**: `shouldAdvanceTime: true`

```typescript
it('10초에 한번씩 서버에 주문 상태를 조회합니다.', async () => {
  const mockAPIRequested = vi.fn();

  // ✅ shouldAdvanceTime: true 옵션 필수
  vi.useFakeTimers({ shouldAdvanceTime: true });

  mockServer.use(
    http.get('/api/order/status', () => {
      mockAPIRequested();
      return HttpResponse.json({ status: 'processing' });
    })
  );

  renderWithProviders(<OrderTrackingPage />);

  // 1분(60초) 동안 시간 진행 → 10초 간격으로 6회 호출
  await vi.advanceTimersByTime(60_000);

  expect(mockAPIRequested).toHaveBeenCalledTimes(6);
});
```

**`shouldAdvanceTime` 옵션 설명**:
- `true`: 타이머가 진행될 때 `Date.now()`도 함께 증가
- `false` (기본값): 타이머만 진행, `Date.now()`는 고정

### 7.2 MSW/Promise와의 충돌

> **절대 금지**: 서버 응답(MSW)이나 Promise 기반 비동기 작업이 포함된 경우 fake timers를 사용하면 안 된다.

**문제 상황:**
- `vi.useFakeTimers()` 상태에서는 Promise의 `.then()`, `.catch()`, `async/await`가 제대로 진행되지 않음
- MSW의 네트워크 응답도 멈춤 → `waitFor`가 무한 대기 → 타임아웃 발생 (`Test timed out in 5000ms`)

**규칙:**

1. **포커스 이동만 테스트하는 경우**: fake timers 사용 가능
   - `vi.useFakeTimers()` → `runAllTimersAsync()` → `vi.useRealTimers()` → `waitFor`로 포커스 검증

2. **서버 응답이 필요한 경우(로그인 제출 등)**: fake timers **절대 사용하지 않는다**
   - 실시간 타이머로 테스트하거나, 포커스 이동과 로그인 제출을 **별도 테스트로 분리**

3. **fake timers 사용 후 `waitFor` 전에 반드시 `vi.useRealTimers()`로 복귀**

```typescript
// ❌ Bad: fake timers + MSW 응답 대기 → 타임아웃
it('로그인 후 대시보드로 이동', async () => {
  vi.useFakeTimers();
  mockServer.use(http.post('/api/login', () => HttpResponse.json({ ok: true })));

  renderLogin();
  await user.click(submitBtn);

  // ⚠️ fake timers 상태에서 waitFor → 무한 대기
  await waitFor(() => expect(screen.getByText('대시보드')).toBeInTheDocument());
});

// ✅ Good: fake timers 해제 후 waitFor
it('포커스 이동 테스트 (서버 응답 없음)', async () => {
  vi.useFakeTimers();

  renderLogin();
  await user.click(idInput);
  await vi.runAllTimersAsync(); // debounce 등 타이머 처리

  vi.useRealTimers(); // ✅ 반드시 해제

  await waitFor(() => expect(passwordInput).toHaveFocus());
});
```

**Self-Check:**
- [ ] `vi.useFakeTimers()` 사용 후 MSW 응답이나 API 호출이 필요한가?
- [ ] fake timers 사용 후 `waitFor` 전에 `vi.useRealTimers()`를 호출했는가?
- [ ] 포커스 이동과 서버 응답 테스트를 분리했는가?

---

## 8. Self-Check

- [ ] `vi.mock` factory에서 외부 변수를 참조하지 않았는가?
- [ ] 동적 상태가 필요하면 `vi.hoisted`를 사용했는가?
- [ ] barrel export와 직접 import 경로 둘 다 mock했는가?
- [ ] `afterEach`에서 mock을 정리했는가?
