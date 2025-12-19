# Module Mock Rules

> **MSW 미사용 시 vi.mock/jest.mock으로 API 함수를 직접 Mock하는 규칙입니다.**

---

## 1. API 함수 Mock 패턴

```typescript
// API 모듈 mock
vi.mock('@/api/user', () => ({
  fetchUser: vi.fn(),
  updateUser: vi.fn(),
}));

// 테스트에서 반환값 설정
import { fetchUser, updateUser } from '@/api/user';

beforeEach(() => {
  vi.mocked(fetchUser).mockResolvedValue({ id: 1, name: '홍길동' });
});
```

---

## 2. Mock 대상 결정

**외부 IO만 Mock. 비즈니스 로직은 Mock 금지.**

```typescript
// ✅ Mock 허용: 외부 API 함수
vi.mock('@/api/user', () => ({
  fetchUser: vi.fn(),
}));

// ✅ Mock 허용: HTTP 클라이언트
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ❌ Mock 금지: 비즈니스 로직 함수
vi.mock('@/utils/calculate', () => ({
  calculateTotal: vi.fn(), // ❌ 로직 검증 불가
}));
```

---

## 3. 호이스팅 주의

**vi.mock은 파일 최상단으로 호이스팅됩니다.**

```typescript
// ❌ Bad: 외부 변수 참조
const mockFetchUser = vi.fn();
vi.mock('@/api/user', () => ({
  fetchUser: mockFetchUser, // ReferenceError
}));

// ✅ Good: factory 내부에서 생성
vi.mock('@/api/user', () => ({
  fetchUser: vi.fn(),
}));

// 테스트에서 설정
import { fetchUser } from '@/api/user';
beforeEach(() => {
  vi.mocked(fetchUser).mockResolvedValue({ id: 1 });
});
```

---

## 4. vi.mocked 사용

**타입 안전한 Mock 설정:**

```typescript
import { fetchUser } from '@/api/user';

// vi.mocked로 타입 추론
vi.mocked(fetchUser).mockResolvedValue({ id: 1, name: '홍길동' });
vi.mocked(fetchUser).mockRejectedValue(new Error('Network Error'));
```

---

## 5. 부분 Mock (importActual)

```typescript
vi.mock('@/api/user', async () => {
  const actual = await vi.importActual('@/api/user');
  return {
    ...actual,
    fetchUser: vi.fn(), // 이것만 mock
  };
});
```

---

## 6. axios/fetch Mock 패턴

### axios Mock

```typescript
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

// 테스트에서 설정
import axios from 'axios';
vi.mocked(axios.get).mockResolvedValue({ data: { id: 1 } });
```

### fetch Mock

```typescript
beforeEach(() => {
  global.fetch = vi.fn();
});

it('데이터를 가져온다', async () => {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, name: '홍길동' }),
  } as Response);

  // ... 테스트
});
```

---

## 7. 에러 응답 Mock

```typescript
// 네트워크 에러
vi.mocked(fetchUser).mockRejectedValue(new Error('Network Error'));

// API 에러 응답
vi.mocked(fetchUser).mockRejectedValue({
  response: {
    status: 401,
    data: { message: '인증 실패' },
  },
});
```

---

## 8. Mock 초기화

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // 호출 기록 초기화
});

afterEach(() => {
  vi.restoreAllMocks(); // 원래 구현 복원
});
```

---

## 9. 호출 검증

```typescript
it('올바른 파라미터로 API를 호출한다', async () => {
  vi.mocked(fetchUser).mockResolvedValue({ id: 1 });

  // ... 테스트 실행

  expect(fetchUser).toHaveBeenCalledWith({ id: 'user123' });
  expect(fetchUser).toHaveBeenCalledTimes(1);
});
```

---

## 10. Self-Check

- [ ] 외부 IO/API 함수만 mock했는가?
- [ ] 비즈니스 로직 함수는 mock하지 않았는가?
- [ ] 호이스팅을 고려하여 factory를 작성했는가?
- [ ] `beforeEach`에서 mock을 초기화했는가?
- [ ] `vi.mocked()`로 타입 안전하게 설정했는가?
