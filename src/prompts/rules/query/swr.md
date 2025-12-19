# SWR Rules

> **SWR 데이터 페칭 라이브러리 사용 시 적용되는 규칙입니다.**

---

## 1. SWR Hook Mocking 금지

**useSWR을 직접 Mock하면 실제 데이터 페칭 로직이 검증되지 않습니다.**

```typescript
// ❌ Bad: Hook 직접 mock
vi.mock('swr', () => ({
  default: () => ({ data: mockData, error: null }),
}));

// ✅ Good: API 응답 제어 (MSW 또는 fetch mock)
server.use(
  http.get(`${API_BASE_URL}/user`, () =>
    HttpResponse.json({ id: 1, name: '홍길동' })
  )
);
```

---

## 2. SWRConfig 설정

```typescript
import { SWRConfig } from 'swr';

const renderWithSWR = (ui: React.ReactElement) => {
  return render(
    <SWRConfig
      value={{
        dedupingInterval: 0, // 테스트에서 중복 제거 비활성화
        provider: () => new Map(), // 각 테스트마다 새 캐시
      }}
    >
      {ui}
    </SWRConfig>
  );
};
```

---

## 3. 캐시 초기화

```typescript
import { cache } from 'swr';

afterEach(() => {
  cache.clear(); // SWR 캐시 초기화
});
```

---

## 4. useSWR 테스트

```typescript
it('사용자 정보를 로드한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/user`, () =>
      HttpResponse.json({ id: 1, name: '홍길동' })
    )
  );

  renderWithSWR(<UserProfile />);

  await waitFor(() => {
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });
});
```

---

## 5. useSWRMutation 테스트

```typescript
it('데이터 저장 시 성공 메시지를 표시한다', async () => {
  server.use(
    http.post(`${API_BASE_URL}/user`, () =>
      HttpResponse.json({ success: true })
    )
  );

  renderWithSWR(<UserForm />);

  await userEvent.click(screen.getByRole('button', { name: '저장' }));

  await waitFor(() => {
    expect(screen.getByText('저장 완료')).toBeInTheDocument();
  });
});
```

---

## 6. Self-Check

- [ ] `useSWR`을 직접 mock하지 않았는가?
- [ ] `SWRConfig`로 컴포넌트를 감쌌는가?
- [ ] 각 테스트 후 캐시를 초기화했는가?
