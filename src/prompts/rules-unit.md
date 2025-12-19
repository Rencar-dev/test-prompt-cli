<!-- Source: rules-unit.md -->
# 📘 Test Coding Conventions - Unit Test Rules

> **이 문서는 Unit 테스트(비즈니스 로직)에만 적용되는 규칙을 정의합니다.**
> Fake Timer, Store 초기화, 테스트 고립성 등을 다룹니다.

---

## 1. Fake Timer

### 1.1 기본 세팅

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

### 1.2 Async 처리

```typescript
await vi.runAllTimersAsync();
// 또는
await vi.advanceTimersByTimeAsync(1000);
```

> 💡 Timer + Date = **Deterministic** 유지

### 1.2.1 주기적 동작(setInterval) 테스트 패턴

> **목적**: `setInterval` 기반의 주기적 API 호출, 폴링 등을 테스트

**핵심 옵션**: `shouldAdvanceTime: true`

```typescript
it('10초에 한번씩 서버에 주문 상태를 조회합니다.', async () => {
  const mockAPIRequested = vi.fn();

  // ✅ shouldAdvanceTime: true 옵션 필수
  vi.useFakeTimers({ shouldAdvanceTime: true });

  mockServer.use(
    http.get('/api/order/status', () => {
      mockAPIRequested();
      return HttpResponse.json({ status: 'processing' });
    })
  );

  renderWithProviders(<OrderTrackingPage />);

  // 1분(60초) 동안 시간 진행 → 10초 간격으로 6회 호출
  await vi.advanceTimersByTime(60_000);

  expect(mockAPIRequested).toHaveBeenCalledTimes(6);
});
```

**`shouldAdvanceTime` 옵션 설명**:
- `true`: 타이머가 진행될 때 `Date.now()`도 함께 증가
- `false` (기본값): 타이머만 진행, `Date.now()`는 고정

**사용 시점**:
- `setInterval` 기반 폴링/동기화 테스트
- 시간 경과에 따른 상태 변화 테스트
- 타임아웃 로직 테스트

### 1.3 MSW/Promise와의 충돌

> **절대 금지**: 서버 응답(MSW)이나 Promise 기반 비동기 작업이 포함된 경우
> fake timers를 사용하면 안 된다.

**문제 상황:**
- `vi.useFakeTimers()` 상태에서는 Promise의 `.then()`, `.catch()`, `async/await`가 제대로 진행되지 않음
- MSW의 네트워크 응답도 멈춤 → `waitFor`가 무한 대기 → 타임아웃 발생 (`Test timed out in 5000ms`)

**규칙:**

1. **포커스 이동만 테스트하는 경우**: fake timers 사용 가능
   - `vi.useFakeTimers()` → `runAllTimersAsync()` → `vi.useRealTimers()` → `waitFor`로 포커스 검증

2. **서버 응답이 필요한 경우(로그인 제출 등)**: fake timers **절대 사용하지 않는다**
   - 실시간 타이머로 테스트하거나, 포커스 이동과 로그인 제출을 **별도 테스트로 분리**

3. **fake timers 사용 후 `waitFor` 전에 반드시 `vi.useRealTimers()`로 복귀**

**올바른 예시:**

```typescript
// ✅ Case 1: 포커스 이동만 테스트 (서버 응답 없음)
it('Enter 키로 비밀번호 입력으로 포커스 이동', async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  renderLogin();

  await user.type(idInput, 'testid');
  await user.keyboard('{Enter}');
  await vi.runAllTimersAsync(); // setTimeout 기반 포커스 이동 실행
  vi.useRealTimers();           // ✅ waitFor 전 실시간 타이머 복귀

  await waitFor(() => {
    expect(document.activeElement).toBe(passwordInput);
  });
});

// ✅ Case 2: 로그인 제출 (MSW 응답 필요) - fake timers 사용 안 함
it('비밀번호 입력 후 Enter로 로그인 제출', async () => {
  // fake timers 사용하지 않음 (MSW 응답 필요)
  const user = userEvent.setup();
  renderLogin();

  await user.type(idInput, 'testid');
  await user.type(passwordInput, 'testpw');
  await user.keyboard('{Enter}');

  // MSW가 응답을 반환하고 router.reset이 호출될 때까지 대기
  await waitFor(() => expect(routerMocks.reset).toHaveBeenCalled());
});
```

**잘못된 예시:**

```typescript
// ❌ Wrong: API 호출 포함 시나리오에서 fake timers 재사용
it('포커스 이동 후 로그인 제출', async () => {
  // 첫 번째 fake timers (포커스 이동)
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  await user.type(idInput, 'testid');
  await user.keyboard('{Enter}');
  await vi.runAllTimersAsync();
  vi.useRealTimers();

  await waitFor(() => expect(document.activeElement).toBe(passwordInput));

  // ❌ 두 번째 fake timers (로그인 제출 - MSW 응답 필요)
  vi.useFakeTimers();           // 🚨 금지! MSW 응답이 멈춤
  await user.type(passwordInput, 'testpw');
  await user.keyboard('{Enter}');
  await vi.runAllTimersAsync(); // Promise/MSW는 진행되지 않음
  vi.useRealTimers();

  // ⏱️ 타임아웃! MSW 응답이 완료되지 않아 무한 대기
  await waitFor(() => expect(routerMocks.reset).toHaveBeenCalled());
});
```

**Self-Check:**
- [ ] `vi.useFakeTimers()` 사용 후 MSW 응답이나 API 호출이 필요한가?
- [ ] fake timers 사용 후 `waitFor` 전에 `vi.useRealTimers()`를 호출했는가?
- [ ] 포커스 이동과 서버 응답 테스트를 분리했는가?

---

## 2. 테스트 고립성 (Isolation)

### 2.1 Store 초기화

```typescript
beforeEach(() => {
  // Store 초기화 (setState의 두 번째 인자 true 금지!)
  userStore.setState({ user: null, isLogin: null });
  loadingStore.setState({ isLoading: false });
});
```

**주의사항:**
- `setState`의 두 번째 인자로 `true`를 전달하면 전체 상태를 대체(replace)하므로 사용 금지
- 부분 업데이트(partial update)로 필요한 필드만 초기화

### 2.2 Browser APIs

```typescript
// localStorage / sessionStorage는 mock
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});
```

**Mock해야 하는 Browser API 목록:**
- `localStorage.getItem`, `localStorage.setItem`
- `sessionStorage.getItem`, `sessionStorage.setItem`
- `window.location` (읽기 전용이므로 주의)
- `navigator.userAgent`
- `document.cookie`

### 2.3 Self-Check

**테스트 작성 후 체크리스트:**
- [ ] 각 테스트가 독립적으로 실행 가능한가?
- [ ] Store 상태가 테스트 간 공유되지 않는가?
- [ ] Browser API Mock이 `beforeEach`에서 초기화되는가?
- [ ] `afterEach`에서 Mock이 정리(cleanup)되는가?

---

## 3. Parameterized Test (test.each) 패턴

> **목적**: 유사한 테스트 케이스를 간결하게 작성하고 테스트 의도를 명확히 표현

### 3.1 기본 형태

```typescript
// 단순 배열 형태
test.each([1000, 5000, 10000])(
  '%s 걸음을 걸었으면 보상 받기 버튼이 활성화됩니다.',
  async (steps) => {
    mockStepCount.mockResolvedValue({ stepCount: steps });
    // ...
  }
);
```

### 3.2 라벨 포함 복합 파라미터 형태 (권장)

> **목적**: 테스트 케이스의 의도를 명확히 표현하고 가독성을 높임

```typescript
// ✅ Good: 라벨과 설명을 포함한 복합 파라미터
test.each([
  ['주문 없음', '주문 내역이 없습니다', 0, /주문 내역이 없습니다/],
  ['배송 중', '배송 중인 상품이 있습니다', 3, /배송 중인 상품.*있습니다/],
  ['배송 완료', '모든 상품이 배송 완료되었습니다', 5, /배송 완료되었습니다/],
])(
  "'주문 현황' 섹션에 '%s' 케이스의 '%s' 문구가 출력됩니다.",
  async (caseLabel, expectedText, orderCount, regexPattern) => {
    const today = new Date().toISOString().split('T')[0];
    mockServer.use(
      mockAPI.get('/api/orders', {
        orders: Array(orderCount).fill({ date: today, status: 'delivered' }),
      })
    );

    renderWithProviders(<OrderHistoryPage />);

    const text = await screen.findByText(regexPattern);
    expect(text).toBeInTheDocument();
  }
);
```

**복합 파라미터 구조**:
```
[라벨, 설명, 입력값, 기대값]
```

**장점**:
- 테스트 실행 시 `'주문 없음' 케이스의 '주문 내역이 없습니다' 문구가 출력됩니다.`처럼 읽기 쉬운 로그
- 각 케이스의 의도가 명확히 드러남
- 실패 시 어떤 케이스가 실패했는지 즉시 파악 가능

### 3.3 객체 형태 (타입 안전성 필요 시)

```typescript
test.each([
  { input: 17, expected: false, desc: '최솟값 - 1 (경계 밖)' },
  { input: 18, expected: true, desc: '최솟값 (경계)' },
  { input: 65, expected: true, desc: '최댓값 (경계)' },
  { input: 66, expected: false, desc: '최댓값 + 1 (경계 밖)' },
])('$desc: validateAge($input) → $expected', ({ input, expected }) => {
  expect(validateAge(input)).toBe(expected);
});
```

### 3.4 Self-Check

- [ ] 3개 이상의 유사한 테스트 케이스를 `test.each`로 통합했는가?
- [ ] 각 케이스에 의미 있는 라벨/설명을 포함했는가?
- [ ] 테스트 제목 템플릿이 케이스 내용을 잘 설명하는가?
