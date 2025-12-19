# Next.js Router Rules

> **Next.js 라우터 사용 시 적용되는 규칙입니다.**

---

## 1. App Router Mock (next/navigation)

**Next.js 13+ App Router 사용 시:**

```typescript
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
```

---

## 2. Pages Router Mock (next/router)

**Next.js 12 이하 Pages Router 사용 시:**

```typescript
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
}));
```

---

## 3. 커스텀 라우터 + 프레임워크 라우터 (Critical)

**커스텀 라우터 훅을 mock해도 반드시 프레임워크 라우터도 함께 mock하세요.**

```typescript
// 문제 상황
// useCustomRouter 내부에서 next/navigation의 useRouter 호출
// → Error: invariant expected app router to be mounted

// ✅ 반드시 둘 다 mock

// 1. 프레임워크 라우터 (하위 의존성)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/current-path',
  useSearchParams: () => new URLSearchParams(),
}));

// 2. 커스텀 라우터 훅 (테스트에서 검증할 mock)
const mockPush = vi.fn();
vi.mock('@/hooks/useCustomRouter', () => ({
  useCustomRouter: () => ({ push: mockPush }),
}));
```

---

## 4. SearchParams 동적 변경

```typescript
const { setSearchParams, getSearchParams } = vi.hoisted(() => {
  let searchParams = new URLSearchParams();
  return {
    setSearchParams: (params: Record<string, string>) => {
      searchParams = new URLSearchParams(params);
    },
    getSearchParams: () => searchParams,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => getSearchParams(),
}));

// 테스트에서 동적 변경
it('URL 파라미터로 초기값 설정', () => {
  setSearchParams({ id: 'prefilled-id' });
  render(<LoginPage />);
  expect(screen.getByPlaceholderText('아이디')).toHaveValue('prefilled-id');
});
```

---

## 5. 라우팅 검증

```typescript
it('로그인 성공 시 대시보드로 이동한다', async () => {
  const user = userEvent.setup();

  render(<LoginPage />);

  await user.type(screen.getByPlaceholderText('아이디'), 'testuser');
  await user.type(screen.getByPlaceholderText('비밀번호'), 'password');
  await user.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
```

---

## 6. Link 컴포넌트 테스트

```typescript
// next/link는 mock 불필요 - 실제 동작 확인
it('링크가 올바른 경로를 가리킨다', () => {
  render(<Navigation />);

  const link = screen.getByRole('link', { name: '홈' });
  expect(link).toHaveAttribute('href', '/');
});
```

---

## 7. redirect 함수 테스트

```typescript
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    redirect: vi.fn(),
  };
});

import { redirect } from 'next/navigation';

it('비인증 시 로그인 페이지로 리다이렉트', async () => {
  render(<ProtectedPage />);

  expect(redirect).toHaveBeenCalledWith('/login');
});
```

---

## 8. Self-Check

- [ ] `next/navigation` 또는 `next/router`를 mock했는가?
- [ ] 커스텀 라우터 사용 시 프레임워크 라우터도 mock했는가?
- [ ] `mockPush`를 `beforeEach`에서 `mockClear()`했는가?
- [ ] 라우팅 검증 시 `toHaveBeenCalledWith()`로 경로를 확인했는가?
