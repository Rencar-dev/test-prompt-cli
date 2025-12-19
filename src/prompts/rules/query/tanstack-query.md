# TanStack Query Rules

> **TanStack Query (React Query) 사용 시 적용되는 규칙입니다.**

---

## 1. Mutation Hook Mocking 금지 (Critical)

**useMutation을 직접 Mock하면 onError, onSuccess 등 실제 에러 처리 로직이 실행되지 않습니다.**

```typescript
// ❌ 절대 금지 (해고감)
vi.mock('@/hooks/useLoginMutation', () => ({
  useLoginMutation: () => ({ mutate: vi.fn() })
}));

// ❌ 절대 금지
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isLoading: false })
}));
```

### 올바른 방법: API 응답 제어

```typescript
// ✅ Good: MSW로 API 응답 제어
server.use(
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json({ accessToken: 'test-token' })
  )
);

// ✅ Good: 에러 응답
server.use(
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json({ error_no: 101 }, { status: 401 })
  )
);
```

### 왜 금지인가?

```typescript
// useLoginMutation 내부
const { mutate } = useMutation({
  mutationFn: loginApi,
  onSuccess: (data) => {
    setUser(data.user);        // ← Mock하면 실행 안 됨
    router.push('/dashboard'); // ← Mock하면 실행 안 됨
  },
  onError: (error) => {
    showToast(error.message);  // ← Mock하면 실행 안 됨
  },
});
```

---

## 2. QueryClient 설정

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 테스트에서 재시도 비활성화
      },
    },
  });

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};
```

---

## 3. Query 캐시 초기화

```typescript
let queryClient: QueryClient;

beforeEach(() => {
  queryClient = createTestQueryClient();
});

afterEach(() => {
  queryClient.clear(); // 캐시 초기화
});
```

---

## 4. useQuery 테스트

```typescript
it('사용자 정보를 로드한다', async () => {
  // Given: API 응답 설정
  server.use(
    http.get(`${API_BASE_URL}/user`, () =>
      HttpResponse.json({ id: 1, name: '홍길동' })
    )
  );

  // When: 컴포넌트 렌더링
  renderWithQuery(<UserProfile />);

  // Then: 데이터 표시 확인
  await waitFor(() => {
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });
});
```

---

## 5. useMutation 테스트

```typescript
it('로그인 성공 시 대시보드로 이동한다', async () => {
  const user = userEvent.setup();

  // Given: 성공 응답 설정
  server.use(
    http.post(`${API_BASE_URL}/auth`, () =>
      HttpResponse.json({ accessToken: 'token', user: { id: 1 } })
    )
  );

  renderWithQuery(<LoginPage />);

  // When: 로그인 실행
  await user.type(screen.getByPlaceholderText('아이디'), 'testuser');
  await user.type(screen.getByPlaceholderText('비밀번호'), 'password');
  await user.click(screen.getByRole('button', { name: '로그인' }));

  // Then: 성공 처리 확인
  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});
```

---

## 6. 에러 상태 테스트

```typescript
it('API 에러 시 에러 메시지를 표시한다', async () => {
  // Given: 에러 응답 설정
  server.use(
    http.get(`${API_BASE_URL}/user`, () =>
      HttpResponse.json({ message: '인증 실패' }, { status: 401 })
    )
  );

  renderWithQuery(<UserProfile />);

  // Then: 에러 UI 확인
  await waitFor(() => {
    expect(screen.getByText('인증 실패')).toBeInTheDocument();
  });
});
```

---

## 7. Self-Check

- [ ] `useMutation` 또는 `useQuery`를 직접 mock하지 않았는가?
- [ ] API 응답은 MSW (또는 mockStrategy에 맞는 도구)로 제어했는가?
- [ ] `QueryClientProvider`로 컴포넌트를 감쌌는가?
- [ ] `afterEach`에서 QueryClient를 초기화했는가?
