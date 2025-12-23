---
name: test-mock
description: |
  테스트의 Mock 코드 작성 시 호출합니다.
  MSW 핸들러, vi.mock 호이스팅, vi.hoisted 패턴, 상태관리 Mock을 안내합니다.
---

# test-mock

Mock 전략 및 패턴을 제공합니다.

---

## 1. Mock 결정 플로우차트

```
Q1: 외부 IO/API인가? (fetch, axios, localStorage 등)
  ├─ YES → Q2로
  └─ NO → Q3로

Q2: 비즈니스 로직을 포함하는가?
  ├─ YES → ❌ Mock 금지 (MSW 또는 실제 로직 사용)
  └─ NO → ✅ Mock 허용

Q3: 테스트 환경에서 제어 불가능한가? (시간, 브라우저 API 등)
  ├─ YES → ✅ Mock 허용
  └─ NO → ❌ Mock 금지 (실제 코드 사용)
```

---

## 2. Mock하지 말아야 하는 것

| 대상 | 이유 |
|-----|------|
| 상수 파일 | 부작용 없음, 누락 위험 |
| 타입 파일 | 런타임에 존재하지 않음 |
| 순수 함수 (Utils) | 로직 검증 불가 |
| 자체 UI 컴포넌트 | 실제 동작 검증 필요 |
| useMutation/useQuery | onError, onSuccess 로직이 실행 안 됨 |

---

## 3. Mock 주석 필수

```typescript
// Mock 이유: localStorage는 테스트 환경에서 제어 불가능
// Mock 범위: Storage.prototype.getItem, setItem
// Mock 값: getItem은 null 반환
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
});
```

---

## 4. vi.mock 호이스팅과 import 순서

**vi.mock은 파일 최상단으로 호이스팅됩니다.** 따라서 import 순서와 관계없이 mock이 먼저 적용됩니다.

### ❌ 잘못된 이해 (import를 vi.mock 이후에 배치)

```typescript
vi.mock('@/utils', () => ({...}));

// "mock이 적용되려면 import가 vi.mock 이후에 있어야 한다"
import { userStore } from '@/stores/user';  // ← 불필요한 패턴
```

### ✅ 올바른 구조 (모든 import를 상단에)

```typescript
// 모든 import를 파일 상단에 모음
import { screen, waitFor } from '@testing-library/react';
import { userStore } from '@/stores/user';
import { alertStore } from '@/stores/alert';
import LoginPage from '../page';

// vi.mock은 import 이후에 작성해도 호이스팅됨
vi.mock('@/utils', () => ({...}));
vi.mock('next/navigation', () => ({...}));
```

### 실제 동작 순서

```typescript
// 1. 작성한 코드
import { foo } from './moduleA';
vi.mock('./moduleB', () => ({ bar: vi.fn() }));

// 2. 실제 실행 순서 (호이스팅 적용)
vi.mock('./moduleB', () => ({ bar: vi.fn() }));  // ← 먼저 실행
import { foo } from './moduleA';                  // ← 그 다음 실행
```

### 핵심 원칙

- **모든 import는 파일 상단에 모음** (코드 가독성)
- vi.mock은 어디에 작성해도 호이스팅됨 (순서 무관)
- import를 vi.mock 사이에 끼워넣는 패턴은 **잘못된 이해**에서 비롯됨

---

{{RUNNER_RULES}}

---

{{STATE_RULES}}

---

{{QUERY_RULES}}

---

{{MOCK_STRATEGY_RULES}}

---

{{ROUTER_RULES}}

---

## Hook 내부 구현 확인

**Mocking 여부를 결정하기 전에, 해당 Hook이 API 통신을 수행하는지 반드시 소스 코드를 읽어 확인하라.**

### 확인 절차

1. 컴포넌트가 사용하는 Custom Hook 파일을 연다 (예: `useAuth.ts`)
2. 내부에서 `useMutation`, `useQuery`, `fetch`, `axios` 사용 여부 확인
3. **API 통신 포함**: 절대 Mocking 금지, MSW 사용
4. **순수 계산/로직**: 원칙적으로 Mocking 금지, 실제 코드 사용

```typescript
// ❌ Bad: Hook 내부를 확인하지 않고 무조건 Mock
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

// ✅ Good: Hook 내부에서 useMutation 사용 확인 → MSW로 API Mock
// useAuth.ts 내부: useMutation({ mutationFn: (data) => api.login(data) })
server.use(
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ token: 'abc123' });
  })
);
```

---

## 브라우저 API Mock

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
  assign: vi.fn(),
  replace: vi.fn(),
} as any;

// ✅ window.open / scrollTo Mock
window.open = vi.fn();
window.scrollTo = vi.fn();

// ✅ window.alert/confirm/prompt Mock
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('prompt', vi.fn(() => ''));
```

---

## Self-Check

- [ ] **모든 import가 파일 상단에 모여있는가?** (vi.mock 사이에 끼워넣지 않음)
- [ ] Hook 내부 코드를 확인했는가?
- [ ] `useMutation`, `useQuery` 사용 여부를 확인했는가?
- [ ] API 통신 포함 시 MSW를 사용하기로 결정했는가?
- [ ] 외부 IO/API 함수만 mock했는가?
- [ ] 비즈니스 로직 함수는 mock하지 않았는가?
- [ ] useMutation/useQuery를 직접 mock하지 않았는가?
- [ ] Mock에 주석(이유, 범위, 값)을 달았는가?
- [ ] `beforeEach`에서 mock을 초기화했는가?
