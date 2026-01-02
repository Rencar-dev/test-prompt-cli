# TanStack Query 테스트 규칙

## Meta

```yaml
scope: queryLibrary=tanstack-query
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 queryLibrary가 tanstack-query
> - 테스트 대상이 useQuery/useMutation을 사용

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [TQ-001] Mutation Hook Mocking 금지
- [TQ-002] QueryClient 설정 규칙
- [TQ-003] Query 캐시 초기화 규칙
- [TQ-004] useQuery 테스트 패턴
- [TQ-005] useMutation 테스트 패턴
- [TQ-006] 에러 상태 테스트 규칙

---

## 3. 주제 특화 규칙

### 3.1 Mutation Hook Mocking 금지 [TQ-001] ⚠️ Critical

**useMutation을 직접 Mock하면 onError, onSuccess 등 실제 에러 처리 로직이 실행되지 않습니다.**

#### DO / DON'T

```
MUST: MSW로 API 응답 제어
MUST: 실제 mutation 동작을 통한 테스트

MUST NOT: useMutation 직접 Mock
MUST NOT: 커스텀 mutation hook 직접 Mock
MUST NOT: @tanstack/react-query 자체를 Mock
```

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

#### 왜 금지인가?

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

#### 올바른 방법: API 응답 제어

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

---

### 3.2 QueryClient 설정 [TQ-002]

**테스트용 QueryClient를 생성하여 재시도를 비활성화합니다.**

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

### 3.3 Query 캐시 초기화 [TQ-003]

**테스트 간 캐시 오염을 방지합니다.**

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

### 3.4 useQuery 테스트 패턴 [TQ-004]

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

### 3.5 useMutation 테스트 패턴 [TQ-005]

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

  // Then: 성공 처리 확인 (onSuccess 콜백 실행)
  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});
```

---

### 3.6 에러 상태 테스트 [TQ-006]

```typescript
it('API 에러 시 에러 메시지를 표시한다', async () => {
  // Given: 에러 응답 설정
  server.use(
    http.get(`${API_BASE_URL}/user`, () =>
      HttpResponse.json({ message: '인증 실패' }, { status: 401 })
    )
  );

  renderWithQuery(<UserProfile />);

  // Then: 에러 UI 확인 (onError 콜백 실행 결과)
  await waitFor(() => {
    expect(screen.getByText('인증 실패')).toBeInTheDocument();
  });
});
```

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| useMutation Hook Mock | onSuccess/onError 미실행 | MSW로 API 응답 제어 |
| useQuery Hook Mock | 로딩/에러 상태 미검증 | MSW로 API 응답 제어 |
| @tanstack/react-query Mock | 라이브러리 동작 자체 무효화 | 실제 라이브러리 사용 |
| QueryClient 미초기화 | 테스트 간 캐시 오염 | afterEach에서 clear() |
| retry 미비활성화 | 테스트 속도 저하, 불안정 | retry: false 설정 |

---

## 5. Self-Check

```
□ [TQ-001] useMutation 또는 useQuery를 직접 mock하지 않았는가?
□ [TQ-002] 테스트용 QueryClient에서 retry: false로 설정했는가?
□ [TQ-003] afterEach에서 QueryClient를 clear()했는가?
□ [TQ-004] API 응답은 MSW로 제어했는가?
□ [TQ-005] onSuccess/onError 콜백의 실행 결과를 검증했는가?
□ [TQ-006] 로딩/성공/에러 상태를 모두 테스트했는가?
```

---

## 6. Quick Reference

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

// 테스트용 QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// 래퍼 함수
const wrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

// useQuery 테스트
it('fetches data', async () => {
  server.use(
    http.get('/api/data', () => HttpResponse.json({ value: 'test' }))
  );

  const { result } = renderHook(() => useData(), { wrapper });

  await waitFor(() => {
    expect(result.current.data).toEqual({ value: 'test' });
  });
});

// useMutation 테스트 - API 응답 제어로만!
it('handles mutation', async () => {
  server.use(
    http.post('/api/submit', () => HttpResponse.json({ success: true }))
  );

  render(<Form />, { wrapper });
  await user.click(screen.getByRole('button', { name: '제출' }));

  // onSuccess 콜백 결과 검증
  await waitFor(() => {
    expect(screen.getByText('성공!')).toBeInTheDocument();
  });
});
```
