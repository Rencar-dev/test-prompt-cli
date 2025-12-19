# MSW Rules

> **MSW (Mock Service Worker) 사용 시 적용되는 규칙입니다.**

---

## 1. Handler 폴더 구조

```
mocks/
├── [domain]/
│   ├── handler.ts    # MSW 핸들러 정의
│   └── data.ts       # Mock 데이터 (순수 데이터만)
├── handlers.ts       # 모든 핸들러 통합
└── server.ts         # MSW 서버 설정
```

---

## 2. URL 매칭 규칙

**절대 URL을 사용하세요. 상대 경로는 baseURL 설정에 따라 매칭 실패할 수 있습니다.**

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

## 3. data.ts 패턴

**Mock 데이터는 순수 데이터만 포함합니다. 핸들러 로직은 handler.ts에 작성합니다.**

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

## 4. 에러 응답 Mock 규칙

**프로젝트의 에러 타입 구조를 정확히 따라야 합니다.**

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

**체크리스트:**
- [ ] 에러 타입 파일(`error.type.ts`)을 확인했는가?
- [ ] 커스텀 에러 클래스가 어떤 필드에 접근하는지 확인했는가?

---

## 5. Test 내부 사용 규칙

**기본 handlers에는 성공/중립 시나리오만. 실패는 각 테스트에서 override.**

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

## 6. 금지 사항

```typescript
// ❌ 테스트 내부에서 server.listen() 호출 금지
it('테스트', () => {
  server.listen(); // ❌ setup.ts에서만 호출
});

// ❌ 전역 handlers에 에러 핸들러 섞기 금지
export const handlers = [
  loginSuccessHandler,
  loginErrorHandler, // ❌ 기본은 성공만
];
```

---

## 7. Stateful Mock 패턴

**여러 API 호출 간 상태 연동이 필요한 경우:**

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

## 8. Server Lifecycle

**setup.ts에서 처리됨. 테스트 파일에서 직접 호출 금지.**

```typescript
// tests/setup.ts
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

---

## 9. Request 검증

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

## 10. Self-Check

- [ ] 절대 URL을 사용했는가?
- [ ] 에러 응답이 프로젝트 에러 구조와 일치하는가?
- [ ] 기본 handlers는 성공 시나리오만 포함하는가?
- [ ] 테스트 내부에서 `server.listen()`을 호출하지 않았는가?
- [ ] `afterEach`에서 `server.resetHandlers()`가 호출되는가?
