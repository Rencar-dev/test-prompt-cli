# MSW 테스트 규칙

## Meta

```yaml
scope: mockStrategy=msw
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 mockStrategy가 msw
> - 테스트 대상이 API 호출을 포함

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| MOCK-001 | 외부 경계만 Mock | MSW로 네트워크 레벨 모킹 | 실제 fetch 동작 보존 |

### Add

- [MSW-001] URL 매칭 규칙
- [MSW-002] 핸들러/데이터 분리 규칙
- [MSW-003] 에러 응답 Mock 규칙
- [MSW-004] 핸들러 오버라이드 규칙
- [MSW-005] Stateful Mock 패턴
- [MSW-006] Request 검증 규칙
- [MSW-007] JSDOM 환경 제약 규칙

---

## 3. 주제 특화 규칙

### 3.1 URL 매칭 [MSW-001]

**절대 URL을 사용하세요. 상대 경로는 baseURL 설정에 따라 매칭 실패할 수 있습니다.**

#### DO / DON'T

```
MUST: 환경변수로 절대 URL 구성
MUST: 프로젝트의 API baseURL과 일치시키기

MUST NOT: 상대 경로 사용 ('/api/user')
```

```typescript
// ❌ Bad: 상대 경로 (baseURL이 있으면 매칭 실패)
const loginHandler = http.post('/auth', () =>
  HttpResponse.json({ ... })
);

// ✅ Good: 환경변수로 절대 URL
const API_BASE_URL = process.env.BACKEND_URL || 'https://api.example.com';
const loginHandler = http.post(`${API_BASE_URL}/auth`, () =>
  HttpResponse.json({ accessToken: 'test-token' })
);
```

---

### 3.2 핸들러/데이터 분리 [MSW-002]

**Mock 데이터는 순수 데이터만 포함합니다. 핸들러 로직은 handler.ts에 작성합니다.**

#### 폴더 구조

```
mocks/
├── [domain]/
│   ├── handler.ts    # MSW 핸들러 정의
│   └── data.ts       # Mock 데이터 (순수 데이터만)
├── handlers.ts       # 모든 핸들러 통합
└── server.ts         # MSW 서버 설정
```

#### 데이터 파일 패턴

```typescript
// mocks/auth/data.ts
import type { LoginResponse } from '@/network/apis/auth.type';

export const mockLoginSuccess: LoginResponse = {
  accessToken: 'test-access-token',
};

export const mockLoginError = {
  error_no: 101,
  message: '허용되지 않는 사용자입니다.',
};
```

**명명 규칙**: `mock[Entity][State]`
- `mockUserSuccess`
- `mockLoginError`
- `mockOrderPending`

---

### 3.3 에러 응답 Mock [MSW-003]

**프로젝트의 에러 타입 구조를 정확히 따라야 합니다.**

#### DO / DON'T

```
MUST: 에러 타입 파일 확인 후 Mock 작성
MUST: 커스텀 에러 클래스가 접근하는 모든 필드 포함

MUST NOT: 최소한의 에러만 반환 (필드 누락)
```

```typescript
// ❌ Bad: 최소한의 에러만 반환 (필드 누락 가능)
server.use(
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json({ error_no: 101 }, { status: 401 })
  )
);

// ✅ Good: 프로젝트의 에러 구조를 정확히 따름
server.use(
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json(
      {
        error_no: 101,
        error: { data: null },
        message: '허용되지 않는 사용자',
      },
      { status: 401 }
    )
  )
);
```

#### 확인 체크리스트

```
□ 에러 타입 파일(error.type.ts)을 확인했는가?
□ 커스텀 에러 클래스가 어떤 필드에 접근하는지 확인했는가?
```

---

### 3.4 핸들러 오버라이드 [MSW-004]

**기본 handlers에는 성공/중립 시나리오만. 실패는 각 테스트에서 override.**

#### DO / DON'T

```
MUST: handlers.ts에는 성공 응답만
MUST: 실패 시나리오는 테스트 내부에서 server.use()로 override

MUST NOT: handlers.ts에 에러 핸들러 섞기
MUST NOT: 테스트 내부에서 server.listen() 호출
```

```typescript
// handlers.ts - 기본 성공 응답만
export const handlers = [
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json(mockLoginSuccess)
  ),
];

// 테스트 파일 - 실패 시나리오는 override
it('로그인 실패 시 에러 메시지 표시', async () => {
  server.use(
    http.post(`${API_BASE_URL}/auth`, () =>
      HttpResponse.json(mockLoginError, { status: 401 })
    )
  );

  // ... 테스트 코드
});
```

---

### 3.5 Stateful Mock 패턴 [MSW-005]

**여러 API 호출 간 상태 연동이 필요한 경우 사용합니다.**

```typescript
it('상품 추가 시 총액이 업데이트된다', async () => {
  let totalAmount = 0;
  let cartItems: number[] = [];

  server.use(
    http.get(`${API_BASE_URL}/cart`, () =>
      HttpResponse.json({ totalAmount, items: cartItems })
    ),
    http.post(`${API_BASE_URL}/cart/:productId`, ({ params }) => {
      totalAmount += 15000;
      cartItems.push(Number(params.productId));
      return HttpResponse.json({ success: true });
    })
  );

  renderWithProviders(<ProductPage />);
  await screen.findByText('0원');

  await user.click(screen.getByRole('button', { name: '장바구니 담기' }));

  await screen.findByText('15,000원');
});
```

---

### 3.6 Request 검증 [MSW-006]

**API가 올바른 데이터로 호출되었는지 검증합니다.**

```typescript
it('올바른 데이터로 API를 호출한다', async () => {
  let requestBody: any;

  server.use(
    http.post(`${API_BASE_URL}/auth`, async ({ request }) => {
      requestBody = await request.json();
      return HttpResponse.json({ success: true });
    })
  );

  // ... 테스트 실행

  expect(requestBody).toEqual({
    username: 'testuser',
    password: 'password123',
  });
});
```

---

### 3.7 JSDOM 환경 제약 [MSW-007]

**MSW data.ts 파일은 JSDOM 환경에서 실행됩니다. Node.js 전용 패키지를 사용하면 테스트가 실패합니다.**

#### DO / DON'T

```
MUST: 하드코딩된 문자열 또는 순수 JavaScript 함수 사용
MUST: jwt.io 등에서 미리 생성한 토큰 사용

MUST NOT: jsonwebtoken, crypto 등 Node.js 전용 패키지 import
MUST NOT: fs, path 등 Node.js 내장 모듈 사용
```

```typescript
// ❌ Bad: Node.js 전용 패키지 import
import { sign } from 'jsonwebtoken';  // Node.js 전용
import crypto from 'crypto';           // Node.js 전용

const createToken = () => sign(payload, secret);  // 실행 시 에러

// ✅ Good: 하드코딩된 토큰 사용
// jwt.io에서 생성하거나, 실제 개발 서버에서 복사한 토큰

// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"useForm":true,"usePartner":false}
export const MOCK_JWT_FORM_USER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VGb3JtIjp0cnVlLCJ1c2VQYXJ0bmVyIjpmYWxzZX0.xxxxx';

export const MOCK_JWT_PARTNER_USER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VGb3JtIjpmYWxzZSwidXNlUGFydG5lciI6dHJ1ZX0.xxxxx';
```

#### 허용/금지 패턴

| 허용 | 금지 |
|------|------|
| 하드코딩된 문자열 (`const token = 'eyJ...'`) | `jsonwebtoken` (Node.js 전용, crypto 의존) |
| 순수 JavaScript 함수 (`btoa()`, `JSON.stringify()`) | `crypto` (Node.js 전용) |
| MSW 유틸리티 (`HttpResponse.json()`) | `fs`, `path` (Node.js 전용) |

---

## 4. Server Lifecycle

**setup.ts에서 처리됨. 테스트 파일에서 직접 호출 금지.**

```typescript
// tests/setup.ts
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

---

## 5. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| 상대 경로 URL | baseURL 설정 시 매칭 실패 | 절대 URL 사용 |
| fetch/axios 직접 모킹 | 실제 동작과 다름 | MSW 핸들러 사용 |
| 에러 필드 누락 | 에러 파싱 실패 | 에러 타입 구조 확인 |
| handlers.ts에 에러 핸들러 | 테스트 오염 | 테스트 내부 override |
| server.listen() 테스트 내 호출 | 설정 충돌 | setup.ts에서만 호출 |
| resetHandlers 누락 | 테스트 간 오염 | afterEach에서 호출 |

---

## 6. Self-Check

```
□ [MSW-001] 절대 URL을 사용했는가?
□ [MSW-002] Mock 데이터와 핸들러가 분리되어 있는가?
□ [MSW-003] 에러 응답이 프로젝트 에러 구조와 일치하는가?
□ [MSW-004] 기본 handlers는 성공 시나리오만 포함하는가?
□ [MSW-005] 복잡한 시나리오에서 Stateful Mock을 고려했는가?
□ [MSW-006] API 호출 인자를 검증했는가?
□ [MSW-007] Mock 데이터에서 Node.js 전용 패키지를 사용하지 않았는가?
□ 테스트 내부에서 server.listen()을 호출하지 않았는가?
□ afterEach에서 server.resetHandlers()가 호출되는가?
```

---

## 7. Quick Reference

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

const API_BASE_URL = process.env.BACKEND_URL || 'https://api.example.com';

// 성공 응답
http.get(`${API_BASE_URL}/users`, () =>
  HttpResponse.json([{ id: 1, name: '홍길동' }])
);

// 에러 응답
http.post(`${API_BASE_URL}/auth`, () =>
  HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
);

// 네트워크 에러
http.get(`${API_BASE_URL}/data`, () =>
  HttpResponse.error()
);

// 지연 응답
http.get(`${API_BASE_URL}/slow`, async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return HttpResponse.json({ data: 'delayed' });
});

// 테스트 내 override
it('에러 처리 테스트', async () => {
  server.use(
    http.get(`${API_BASE_URL}/users`, () =>
      HttpResponse.json({ message: '서버 에러' }, { status: 500 })
    )
  );
  // ...
});
```
