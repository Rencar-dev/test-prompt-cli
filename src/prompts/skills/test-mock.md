---
name: test-mock
description: |
  테스트의 Mock 코드 작성 시 호출합니다.
  공통 Mock 원칙, MSW 핸들러, vi.mock 호이스팅, vi.hoisted 패턴을 안내합니다.
---

# test-mock

Mock 전략 및 패턴을 제공합니다.

---

{{COMMON_RULES}}

---

## vi.mock 호이스팅과 import 순서

**vi.mock은 파일 최상단으로 호이스팅됩니다.** 따라서 import 순서와 관계없이 mock이 먼저 적용됩니다.

### 잘못된 이해 (import를 vi.mock 이후에 배치)

```typescript
vi.mock('@/utils', () => ({...}));

// "mock이 적용되려면 import가 vi.mock 이후에 있어야 한다"
import { userStore } from '@/stores/user';  // ← 불필요한 패턴
```

### 올바른 구조 (모든 import를 상단에)

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

## Mock 주석 필수

```typescript
// Mock 이유: localStorage는 테스트 환경에서 제어 불가능
// Mock 범위: Storage.prototype.getItem, setItem
// Mock 값: getItem은 null 반환
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
});
```

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

{{ADDITIONAL_RULES}}

---

## MSW 데이터 파일 작성 규칙

> **필수**: MSW data.ts 파일은 JSDOM 환경에서 실행됩니다.
> Node.js 전용 패키지를 사용하면 테스트가 실패합니다.

### 금지 사항

```typescript
// ❌ Bad: Node.js 전용 패키지 import
import { sign } from 'jsonwebtoken';  // Node.js 전용
import crypto from 'crypto';           // Node.js 전용

const createToken = () => sign(payload, secret);  // 실행 시 에러
```

### JWT 토큰 Mock 방법

```typescript
// ✅ Good: 하드코딩된 토큰 사용
// jwt.io에서 생성하거나, 실제 개발 서버에서 복사한 토큰

// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"useForm":true,"usePartner":false}
export const MOCK_JWT_FORM_USER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VGb3JtIjp0cnVlLCJ1c2VQYXJ0bmVyIjpmYWxzZX0.xxxxx';

export const MOCK_JWT_PARTNER_USER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VGb3JtIjpmYWxzZSwidXNlUGFydG5lciI6dHJ1ZX0.xxxxx';
```

### 허용/금지 패턴

| 허용 | 금지 |
|------|------|
| 하드코딩된 문자열 | `jsonwebtoken` (crypto 의존) |
| 순수 JS 함수 (`btoa()`, `JSON.stringify()`) | `crypto`, `fs`, `path` |
| MSW 유틸리티 (`HttpResponse.json()`) | Node.js 전용 외부 패키지 |

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

- [ ] 모든 import가 파일 상단에 모여있는가?
- [ ] Mock에 주석(이유, 범위, 값)을 달았는가?
- [ ] MSW data.ts에 Node.js 전용 패키지를 import하지 않았는가?
- [ ] 브라우저 API Mock이 beforeEach에서 초기화되었는가?
