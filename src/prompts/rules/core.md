<!-- Source: rules-core.md -->
# Core Rules (보편 규칙)

> **이 규칙은 모든 테스트에 라이브러리와 무관하게 적용됩니다.**

---

## 0. 목적

**테스트 코드 생성 시 준수해야 할 작성 규칙을 정의합니다.**

- Test runner 문법
- MSW handler 작성 패턴
- waitFor / Mock 사용 규칙

> 🎯 이 문서의 모든 규칙은 "AI가 생성하는 `.test.ts` 파일 내용"에 직접 영향을 줍니다.

---

## 1. 절대 금지 (Critical Anti-Patterns)

### 1.1 waitFor + Mock 호출 검증 금지

**waitFor는 비동기 UI 변화를 기다리는 도구입니다. Mock 호출은 동기적으로 발생합니다.**

```typescript
// ❌ 절대 금지
await waitFor(() => expect(mockFn).toHaveBeenCalled());

// ✅ 올바른 방법
// 1) UI 변화 대기
await waitFor(() =>
  expect(screen.queryByText('로딩중...')).not.toBeInTheDocument()
);
// 2) Mock 호출은 동기적으로 검증
expect(mockFn).toHaveBeenCalledWith({ id: 'user' });
```

### 1.2 비즈니스 로직 Mock 금지

**비즈니스 로직(service/utils)을 Mock하면 테스트가 무의미해집니다.**

```typescript
// ❌ 절대 금지: 순수 함수/유틸 Mock
vi.spyOn(utils, 'calculateTotal').mockReturnValue(100);

// ✅ 올바른 방법: 실제 로직 사용, 외부 IO만 Mock
vi.spyOn(api, 'fetchUser').mockResolvedValue({ id: 1 });
```

### 1.3 Weak Assertion 금지

**Void 함수는 인자가 곧 결과값입니다. 호출 여부만 검증하면 잘못된 인자로 호출되어도 통과합니다.**

```typescript
// ❌ 금지: 호출 여부만 검증
expect(saveFn).toHaveBeenCalled();
expect(saveFn).toHaveBeenCalledTimes(1);

// ✅ 올바른 방법: 인자까지 검증
expect(saveFn).toHaveBeenCalledWith({ id: 1, name: 'test' });
```

---

## 2. Element Selector 우선순위

**Testing Library의 우선순위를 반드시 준수하라:**

```
1순위: getByRole ⭐⭐⭐⭐⭐ (최우선)
2순위: getByLabelText ⭐⭐⭐⭐
3순위: getByPlaceholderText ⭐⭐⭐
4순위: getByText ⭐⭐
5순위: getByTestId (최후의 수단)
❌ 금지: querySelector, xpath, getByClassName
```

```typescript
// ✅ Good
screen.getByRole('button', { name: /제출/ });
screen.getByRole('textbox', { name: /아이디/ });
screen.getByLabelText('비밀번호');

// ❌ Bad
screen.getByTestId('submit-button'); // getByRole 사용 가능한데 testid 사용
container.querySelector('.submit-btn'); // 절대 금지
```

---

## 3. 렌더링 검증 필수

**모든 테스트는 렌더링 직후 기본 UI 존재를 확인합니다.**

```typescript
it('[S1] 로그인 성공', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);

  // ✅ 렌더링 검증 (필수)
  expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();

  // 이후 상호작용...
});
```

---

## 4. Safe Wait Strategy

**UI 앵커 기반 대기를 사용합니다. 네트워크 대기는 불안정합니다.**

```typescript
// ❌ Bad: 임의의 시간 대기
await new Promise(resolve => setTimeout(resolve, 1000));

// ❌ Bad: 네트워크 idle 대기
await page.waitForLoadState('networkidle');

// ✅ Good: UI 앵커 기반 대기
await waitFor(() =>
  expect(screen.queryByText('로딩중...')).not.toBeInTheDocument()
);
```

---

## 5. Mock 주석 필수

**모든 Mock에는 이유, 범위, 값을 주석으로 명시합니다.**

```typescript
// Mock 이유: localStorage는 테스트 환경에서 제어 불가능
// Mock 범위: Storage.prototype.getItem, setItem
// Mock 값: getItem은 null 반환
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});
```

---

## 6. Mock 결정 플로우차트

```
Q1: 외부 IO/API인가? (fetch, axios, localStorage 등)
  ├─ YES → Q2로
  └─ NO → Q3로

Q2: 비즈니스 로직을 포함하는가?
  ├─ YES → ❌ Mock 금지 (MSW 또는 실제 로직 사용)
  └─ NO → ✅ Mock 허용

Q3: 테스트 환경에서 제어 불가능한가? (시간, 브라우저 API 등)
  ├─ YES → ✅ Mock 허용
  └─ NO → ❌ Mock 금지 (실제 코드 사용)
```

---

## 7. Mock하지 말아야 하는 것

| 대상 | 이유 |
|-----|------|
| 상수 파일 | 부작용 없음, 누락 위험 |
| 타입 파일 | 런타임에 존재하지 않음 |
| 순수 함수 (Utils) | 로직 검증 불가 |
| 자체 UI 컴포넌트 | 실제 동작 검증 필요 |

---

## 8. Hook 내부 구현 확인

**Mocking 여부를 결정하기 전에, 해당 Hook이 API 통신을 수행하는지 반드시 소스 코드를 읽어 확인하라.**

### 8.1 확인 절차

1. 컴포넌트가 사용하는 Custom Hook의 파일을 연다. (예: `useAuth.ts`)
2. 내부에서 `useMutation`, `useQuery`, `fetch`, `axios` 등을 사용하는지 검색한다.
3. **API 통신이 포함된 경우**: 절대 Mocking 하지 말고, MSW를 사용한다.
4. **순수 계산/로직인 경우**: 원칙적으로 Mocking 하지 않고 실제 코드를 사용한다.

```typescript
// ❌ Bad: Hook 내부를 확인하지 않고 무조건 Mock
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

// ✅ Good: Hook 내부에서 useMutation 사용 확인 → MSW로 API Mock
// useAuth.ts 내부: useMutation({ mutationFn: (data) => api.login(data) })
mockServer.use(
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ token: 'abc123' });
  })
);
```

### 8.2 Self-Check

- [ ] 테스트 대상 Hook 내부 코드를 확인했는가?
- [ ] `useMutation`, `useQuery` 사용 여부를 확인했는가?
- [ ] API 통신이 포함되면 MSW를 사용하기로 결정했는가?

---

## 9. Anti-Patterns 체크리스트

**테스트 작성 후 반드시 확인:**

| Anti-Pattern | 설명 |
|-------------|------|
| ❌ Snapshot Test | 변경에 취약, 의도 불명확 |
| ❌ Private 변수 검증 | 내부 구현 의존 |
| ❌ className/style 단언 | 스타일 변경에 취약 |
| ❌ 테스트 하드코딩 | 특정 입력값에만 동작하는 조건문 |
| ❌ 과도한 엔지니어링 | 1회 사용 헬퍼, 불필요한 Builder |

---

## 10. Red Team / Negative Testing

**당신은 Red Team QA 엔지니어입니다.** 기능이 "작동하는지" 확인하는 것보다, **"어떻게 하면 망가뜨릴 수 있을지"**를 고민해야 합니다.

### 10.1 필수 포함 시나리오

1. **Validation Attack:** 입력 필드에 스크립트(`<script>`), 초장문 텍스트, 이모지 등을 입력.
2. **Network Chaos:** API가 500 에러를 뱉거나, 응답이 10초 뒤에 오는(Loading) 상황.
3. **Interaction Spam:** 제출 버튼을 1초에 10번 클릭하는 따닥(Double Submit) 상황.

### 10.2 검증 목표

- 위 상황에서도 UI가 깨지지 않고(Crash Free), 사용자에게 적절한 피드백(Toast/Alert)을 주는지 검증하시오.

```typescript
// 예시: Double Submit 방어 테스트
it('제출 버튼을 연타해도 API가 1회만 호출된다', async () => {
  const user = userEvent.setup();
  renderWithProviders(<SubmitForm />);

  const submitBtn = screen.getByRole('button', { name: '제출' });

  // 빠르게 3번 클릭
  await user.click(submitBtn);
  await user.click(submitBtn);
  await user.click(submitBtn);

  // API는 1회만 호출
  expect(mockSubmitApi).toHaveBeenCalledTimes(1);
});
```

---

## 11. Test Helper 함수 규칙

**반복 패턴은 Helper로 추출하되, 명확한 네이밍 사용:**

```typescript
// ✅ Good: 동사로 시작, 구체적 동작
const enterCredentials = async (user, { id, password }) => { ... };
const clickLoginButton = async (user) => { ... };

// ❌ Bad: 모호한 동사
const fillCredentials = async (...) => { ... };  // fill은 모호
const doLogin = async (...) => { ... };          // do는 불명확
```

---

## 12. Data Fixture Strategy

**테스트 코드 작성 전 3가지 데이터 페르소나 정의:**

1. **Happy User**: 모든 필드 완벽 (정상 케이스)
2. **Edge User**: 경계값 (100자 이름, 특수문자)
3. **Legacy User**: 필수값 일부 누락 (구 데이터)

```typescript
// ✅ Good: 도메인 맥락 있는 fixture
const happyUser = { name: '홍길동', email: 'hong@example.com' };
const edgeUser = { name: 'A'.repeat(100), email: 'edge@test.com' };

// ❌ Bad: 의미 없는 더미 데이터
const user1 = { name: 'foo', email: 'bar' };
```

---

## 13. 간접 의존성 체크리스트

**자식 컴포넌트의 의존성도 반드시 확인:**

- [ ] 테스트 대상 컴포넌트가 사용하는 모든 store/hook 확인
- [ ] 자식 컴포넌트가 사용하는 store/hook 확인
- [ ] 각 의존성을 Mock에 포함

---

## 14. 브라우저 API Mock (UI 테스트 전용)

### 14.1 필수 Mock 패턴

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
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
} as any;

// ✅ window.open / scrollTo Mock
window.open = vi.fn();
window.scrollTo = vi.fn();

// ✅ window.alert/confirm/prompt Mock (JSDOM 미구현)
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('prompt', vi.fn(() => ''));
```

### 14.2 Self-Check

- [ ] localStorage/sessionStorage 접근 시 Mock을 설정했는가?
- [ ] window.location 변경 로직 테스트 시 Mock을 설정했는가?
- [ ] alert/confirm 사용 시 stubGlobal로 Mock했는가?

---

## 15. Safety Rules

### 15.1 수정 범위 제한

- ✅ 테스트 파일만 수정
- ❌ 소스 코드(app/, src/) 수정 금지
- ❌ 설정 파일 수정 금지

### 15.2 최대 재시도 횟수

- 수정 및 재실행: **최대 3회**
- 3회 실패 시: "❌ 3회 실패" 메시지와 마지막 에러 로그 출력 후 중단

### 15.3 실행 정책

- **Agentic Mode**: 반드시 테스트 실행 및 검증
- **Chat Mode**: 코드만 출력

---

## 16. GATE 체크포인트

### GATE 1: 시나리오별 검증 (각 테스트 작성 후)

```
□ describe 제목이 Plan의 시나리오 제목과 일치하는가?
□ Given/When/Then이 Plan과 일치하는가?
□ Mock이 필요한 경우 주석을 달았는가?
□ 절대 금지 항목을 위반하지 않았는가?
```

### GATE 2: 최종 검증 (모든 테스트 완료 후)

```
□ 모든 시나리오가 구현되었는가?
□ Anti-Pattern 체크리스트를 통과했는가?
□ 테스트가 실행되고 통과하는가? (Agentic Mode)
```

---

## 17. Self Checklist

- [ ] waitFor는 DOM 변화에만 사용했는가?
- [ ] API mock 검증은 동기 처리했는가?
- [ ] getByRole을 최우선으로 사용했는가?
- [ ] 렌더링 직후 기본 UI를 검증했는가?
- [ ] Mock에 주석을 달았는가?
- [ ] Side-Effect 함수는 `toHaveBeenCalledWith()`로 검증했는가?
