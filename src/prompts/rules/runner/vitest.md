# Vitest 테스트 규칙

## Meta

```yaml
scope: testRunner=vitest
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 testRunner가 vitest

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [VIT-001] vi.mock 호이스팅 규칙
- [VIT-002] vi.hoisted 패턴
- [VIT-003] Module Path Mock 규칙
- [VIT-004] vi.importActual 패턴
- [VIT-005] Fake Timers 규칙
- [VIT-006] Import 순서 규칙

---

## 3. 주제 특화 규칙

### 3.1 vi.mock 호이스팅 [VIT-001] ⚠️ Critical

**`vi.mock`은 파일 최상단으로 호이스팅됩니다. factory 내부에서 외부 변수를 참조하면 TDZ 에러가 발생합니다.**

#### DO / DON'T

```
MUST: vi.mock factory 내부에서 mock 객체 직접 생성
MUST: vi.mock을 파일 최상단에 배치

MUST NOT: factory 외부에서 정의한 변수를 factory 내부에서 참조
```

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

### 3.2 vi.hoisted 패턴 [VIT-002]

**테스트별로 Mock 상태를 동적으로 변경해야 할 때 사용합니다.**

#### Decision Tree

```
Q1: 테스트별로 Mock 반환값이 달라야 하는가?
├─ YES → vi.hoisted 사용
└─ NO → 일반 vi.mock 사용
```

#### 기본 패턴

```typescript
// ✅ Good: vi.hoisted로 상태 관리
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

it('로그인 성공 시 대시보드로 이동', async () => {
  // ...
  expect(mockPush).toHaveBeenCalledWith('/dashboard');
});
```

#### 고급 패턴: 클로저 기반 동적 상태

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

### 3.3 Module Path Mock [VIT-003]

**동일 모듈이라도 import 경로가 다르면 각각 mock해야 합니다.**

#### DO / DON'T

```
MUST: barrel export와 직접 import 경로 모두 mock
MUST: 모듈이 여러 경로로 import되는지 확인

MUST NOT: 한 경로만 mock하고 테스트 실패 시 당황
```

```typescript
// 문제 상황:
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

### 3.4 vi.importActual 패턴 [VIT-004]

**일부만 mock하고 나머지는 실제 구현을 사용합니다.**

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

### 3.5 Fake Timers [VIT-005] ⚠️ Critical

#### 기본 사용법

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

it('타이머 테스트', async () => {
  vi.advanceTimersByTime(1000);
  // 또는 모든 타이머 즉시 실행
  vi.runAllTimers();
});
```

#### setInterval 테스트 패턴

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

#### MSW/Promise와의 충돌 ⚠️ 절대 금지

```
MUST NOT: vi.useFakeTimers() 상태에서 MSW 응답이나 Promise 기반 비동기 작업 대기
MUST: fake timers 사용 후 waitFor 전에 반드시 vi.useRealTimers()로 복귀
MUST: 포커스 이동과 서버 응답 테스트를 분리
```

**문제 상황:**
- `vi.useFakeTimers()` 상태에서는 Promise의 `.then()`, `.catch()`, `async/await`가 진행되지 않음
- MSW의 네트워크 응답도 멈춤 → `waitFor`가 무한 대기 → `Test timed out in 5000ms`

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

---

### 3.6 Import 순서 규칙 [VIT-006]

**vi.mock은 파일 최상단으로 호이스팅됩니다.** 따라서 import 순서와 관계없이 mock이 먼저 적용됩니다.

#### DO / DON'T

```
MUST: 모든 import를 파일 상단에 모아서 작성
MUST: vi.mock은 import 블록 이후에 작성 (가독성)

MUST NOT: vi.mock 사이에 import를 끼워넣기
MUST NOT: "mock이 먼저 적용되려면 import가 뒤에 있어야 한다"는 잘못된 이해
```

#### 잘못된 이해 (import를 vi.mock 이후에 배치)

```typescript
// ❌ Bad: 잘못된 이해에서 비롯된 패턴
vi.mock('@/utils', () => ({...}));

// "mock이 적용되려면 import가 vi.mock 이후에 있어야 한다"
import { userStore } from '@/stores/user';  // ← 불필요한 패턴
```

#### 올바른 구조 (모든 import를 상단에)

```typescript
// ✅ Good: 모든 import를 파일 상단에 모음
import { screen, waitFor } from '@testing-library/react';
import { userStore } from '@/stores/user';
import { alertStore } from '@/stores/alert';
import LoginPage from '../page';

// vi.mock은 import 이후에 작성해도 호이스팅됨
vi.mock('@/utils', () => ({...}));
vi.mock('next/navigation', () => ({...}));
```

#### 실제 동작 순서

```typescript
// 1. 작성한 코드
import { foo } from './moduleA';
vi.mock('./moduleB', () => ({ bar: vi.fn() }));

// 2. 실제 실행 순서 (호이스팅 적용)
vi.mock('./moduleB', () => ({ bar: vi.fn() }));  // ← 먼저 실행
import { foo } from './moduleA';                  // ← 그 다음 실행
```

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| vi.mock factory에서 외부 변수 참조 | TDZ ReferenceError | factory 내부에서 생성 또는 vi.hoisted |
| barrel export만 mock | 다른 경로 import는 mock 안 됨 | 모든 가능한 경로 mock |
| fake timers + MSW 동시 사용 | Promise 멈춤, 타임아웃 | 분리하거나 useRealTimers 후 waitFor |
| mock 정리 누락 | 테스트 간 오염 | afterEach에서 vi.restoreAllMocks() |
| vi.mock 사이에 import 끼워넣기 | 가독성 저하, 잘못된 이해 유발 | 모든 import를 상단에 모음 |

---

## 5. Self-Check

```
□ [VIT-001] vi.mock factory에서 외부 변수를 참조하지 않았는가?
□ [VIT-002] 동적 상태가 필요하면 vi.hoisted를 사용했는가?
□ [VIT-003] barrel export와 직접 import 경로 둘 다 mock했는가?
□ [VIT-005] fake timers 사용 후 waitFor 전에 vi.useRealTimers()를 호출했는가?
□ [VIT-005] fake timers 사용 시 MSW 응답이 필요한 테스트를 분리했는가?
□ [VIT-006] 모든 import가 파일 상단에 모여있는가? (vi.mock 사이에 끼워넣지 않음)
□ afterEach에서 mock을 정리(vi.restoreAllMocks)했는가?
```

---

## 6. Quick Reference

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// vi.hoisted 패턴
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));

vi.mock('@/module', () => ({
  someFunction: mockFn,
}));

// 정리
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers(); // 타이머 복원
});

// vi.spyOn 패턴
const fetchSpy = vi.spyOn(api, 'fetchUser').mockResolvedValue({ id: 1 });

// fake timers 패턴
vi.useFakeTimers({ shouldAdvanceTime: true });
vi.setSystemTime(new Date('2024-01-01'));
vi.advanceTimersByTime(1000);
vi.runAllTimersAsync();
vi.useRealTimers();
```
