# React Router Rules

> **React Router 사용 시 적용되는 규칙입니다.**

---

## 1. MemoryRouter 래핑

**테스트에서는 BrowserRouter 대신 MemoryRouter를 사용합니다.**

```typescript
import { MemoryRouter } from 'react-router-dom';

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
};
```

---

## 2. useNavigate Mock

```typescript
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

beforeEach(() => {
  mockNavigate.mockClear();
});
```

---

## 3. useLocation / useParams Mock

```typescript
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/users/123',
      search: '?tab=profile',
      hash: '',
      state: null,
    }),
    useParams: () => ({
      id: '123',
    }),
  };
});
```

---

## 4. 동적 라우트 파라미터

```typescript
const { setParams, getParams } = vi.hoisted(() => {
  let params: Record<string, string> = {};
  return {
    setParams: (p: Record<string, string>) => { params = p; },
    getParams: () => params,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => getParams(),
  };
});

// 테스트에서 사용
it('사용자 ID에 해당하는 정보를 표시한다', () => {
  setParams({ id: '456' });
  renderWithRouter(<UserProfile />);
  // ...
});
```

---

## 5. 네비게이션 검증

```typescript
it('로그인 성공 시 대시보드로 이동한다', async () => {
  renderWithRouter(<LoginPage />);

  await userEvent.type(screen.getByPlaceholderText('아이디'), 'testuser');
  await userEvent.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
```

---

## 6. Link 컴포넌트 테스트

```typescript
it('링크가 올바른 경로를 가리킨다', () => {
  renderWithRouter(<Navigation />);

  const link = screen.getByRole('link', { name: '홈' });
  expect(link).toHaveAttribute('href', '/');
});
```

---

## 7. 전체 라우트 테스트

```typescript
import { Routes, Route } from 'react-router-dom';

const renderWithRoutes = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </MemoryRouter>
  );
};

it('/dashboard 접근 시 Dashboard 페이지가 렌더링된다', () => {
  renderWithRoutes(['/dashboard']);
  expect(screen.getByText('대시보드')).toBeInTheDocument();
});
```

---

## 8. Self-Check

- [ ] `MemoryRouter`로 컴포넌트를 감쌌는가?
- [ ] `useNavigate` mock을 `beforeEach`에서 초기화했는가?
- [ ] `importActual`로 실제 구현을 유지했는가?
- [ ] 네비게이션 검증 시 `toHaveBeenCalledWith()`로 경로를 확인했는가?
