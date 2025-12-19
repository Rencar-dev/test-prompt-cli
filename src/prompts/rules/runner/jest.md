# Jest Rules

> **Jest 테스트 러너 사용 시 적용되는 규칙입니다.**

---

## 1. 기본 Import

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Jest globals는 자동 제공 (describe, it, expect, jest)
```

---

## 2. jest.mock 호이스팅

**`jest.mock`은 파일 최상단으로 호이스팅됩니다.**

```typescript
// ❌ Bad: 외부 변수 참조
const mockFn = jest.fn();
jest.mock('@/utils', () => ({ myFn: mockFn }));

// ✅ Good: factory 내부에서 생성
jest.mock('@/utils', () => ({
  myFn: jest.fn(),
}));

// ✅ Good: jest.requireActual 사용
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils'),
  myFn: jest.fn(),
}));
```

---

## 3. jest.spyOn 패턴

```typescript
// 기본 사용
const fetchSpy = jest.spyOn(api, 'fetchUser').mockResolvedValue({ id: 1 });

// 테스트 후 복원
afterEach(() => {
  fetchSpy.mockRestore();
});

// 또는 전역 복원
afterEach(() => {
  jest.restoreAllMocks();
});
```

---

## 4. Module Path Mock

```typescript
// barrel export와 직접 import 경로 둘 다 mock
jest.mock('@/hooks', () => ({
  useCustomRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({ push: jest.fn() }),
}));
```

---

## 5. jest.requireActual 패턴

**일부만 mock하고 나머지는 실제 구현 사용:**

```typescript
jest.mock('@/constants', () => ({
  ...jest.requireActual('@/constants'),
  ERROR_CODE: {
    ...jest.requireActual('@/constants').ERROR_CODE,
    INVALID: 101,
  },
}));
```

---

## 6. Fake Timers

```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

it('타이머 테스트', () => {
  // 타이머 진행
  jest.advanceTimersByTime(1000);

  // 또는 모든 타이머 즉시 실행
  jest.runAllTimers();
});
```

---

## 7. Mock 초기화

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // 호출 기록만 초기화
});

afterEach(() => {
  jest.restoreAllMocks(); // 원래 구현으로 복원
});
```

---

## 8. Self-Check

- [ ] `jest.mock` factory에서 외부 변수를 참조하지 않았는가?
- [ ] barrel export와 직접 import 경로 둘 다 mock했는가?
- [ ] `afterEach`에서 mock을 정리했는가?
