# UI 테스트 규칙

## Meta

```yaml
scope: testType=ui
inherits: _common.md
priority: 1
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - CLI에서 `--type ui` 옵션 사용 (기본값)
> - 또는 대상 파일이 `.tsx`, `.jsx` 확장자

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [UI-001] Selector 우선순위 규칙
- [UI-002] 사용자 인터랙션 규칙
- [UI-003] 비동기 처리 규칙
- [UI-004] 폼 테스트 규칙
- [UI-005] 렌더링 검증 규칙

---

## 3. 주제 특화 규칙

### 3.1 Selector 우선순위 [UI-001]

#### Decision Tree

```
Q1: 요소가 interactive한가? (버튼, 입력, 링크, 체크박스 등)
├─ YES
│   Q1-1: getByRole로 유일하게 선택 가능한가?
│   ├─ YES → getByRole('button') 등 사용
│   └─ NO → getByRole('button', { name: /submit/i }) 옵션 추가
│
└─ NO (텍스트, 이미지, 컨테이너 등)
    Q2: 접근성 레이블이 있는가?
    ├─ YES
    │   Q2-1: form 요소인가?
    │   ├─ YES → getByLabelText 사용
    │   └─ NO → getByRole with name 옵션
    │
    └─ NO
        Q3: 고유한 텍스트 콘텐츠가 있는가?
        ├─ YES → getByText 사용
        └─ NO → getByTestId 사용 (최후 수단)
```

#### 우선순위 표

| 순위 | Selector | 사용 조건 | 예시 |
|------|----------|----------|------|
| 1 | `getByRole` | 항상 최우선 시도 | `getByRole('button', { name: /submit/i })` |
| 2 | `getByLabelText` | form 요소, label 연결됨 | `getByLabelText(/email/i)` |
| 3 | `getByPlaceholderText` | label 없는 input | `getByPlaceholderText(/enter email/i)` |
| 4 | `getByText` | 비-interactive 요소 | `getByText(/welcome/i)` |
| 5 | `getByDisplayValue` | input의 현재 값으로 선택 | `getByDisplayValue('current text')` |
| 6 | `getByAltText` | 이미지 alt 텍스트 | `getByAltText(/profile/i)` |
| 7 | `getByTitle` | title 속성 | `getByTitle(/close/i)` |
| 8 | `getByTestId` | 위 모두 불가 시만 | `getByTestId('custom-dropdown')` |

#### Role 참조표

| 요소 | 암시적 Role | 선택 방법 |
|------|------------|----------|
| `<button>` | button | `getByRole('button')` |
| `<a href>` | link | `getByRole('link')` |
| `<input type="text">` | textbox | `getByRole('textbox')` |
| `<input type="checkbox">` | checkbox | `getByRole('checkbox')` |
| `<input type="radio">` | radio | `getByRole('radio')` |
| `<select>` | combobox | `getByRole('combobox')` |
| `<textarea>` | textbox | `getByRole('textbox')` |
| `<img>` | img | `getByRole('img')` |
| `<h1>`-`<h6>` | heading | `getByRole('heading', { level: 1 })` |
| `<dialog>` | dialog | `getByRole('dialog')` |
| `<nav>` | navigation | `getByRole('navigation')` |

#### DO / DON'T

```
MUST: getByRole을 첫 번째 선택지로 시도
MUST: name 옵션에 정규표현식 사용 (대소문자 유연성)
MUST: 여러 요소 중 특정 요소 선택 시 within 사용

MUST NOT: getByTestId를 첫 번째 선택지로 사용
MUST NOT: container.querySelector 사용
MUST NOT: 클래스명/ID로 요소 선택
MUST NOT: DOM 구조에 의존하는 선택자 (nth-child, > 등)
```

```typescript
// ✅ Good: Role 기반 선택
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('link', { name: /learn more/i });
screen.getByRole('heading', { level: 1, name: /welcome/i });

// ✅ Good: within을 사용한 범위 한정
const dialog = screen.getByRole('dialog');
within(dialog).getByRole('button', { name: /confirm/i });

// ❌ Bad: 구현 세부사항에 의존
container.querySelector('.submit-btn');
screen.getByTestId('submit-button');  // role로 가능한데 testId 사용
document.getElementById('email-input');
```

---

### 3.2 사용자 인터랙션 [UI-002]

#### DO / DON'T

```
MUST: userEvent.setup()으로 user 인스턴스 생성
MUST: 모든 userEvent 호출에 await 사용
MUST: 실제 사용자 동작과 동일한 이벤트 사용

MUST NOT: fireEvent 직접 사용 (userEvent 사용)
MUST NOT: await 없이 userEvent 호출
```

#### 인터랙션 패턴

```typescript
// ✅ Good: userEvent 사용
const user = userEvent.setup();

// 클릭
await user.click(screen.getByRole('button', { name: /submit/i }));
await user.dblClick(element);

// 입력
await user.type(screen.getByRole('textbox'), 'hello');
await user.clear(screen.getByRole('textbox'));

// 키보드
await user.keyboard('{Enter}');
await user.keyboard('{Tab}');

// 선택
await user.selectOptions(screen.getByRole('combobox'), 'optionValue');

// 호버
await user.hover(element);
await user.unhover(element);
```

```typescript
// ❌ Bad: fireEvent 사용
fireEvent.click(button);  // 실제 사용자 동작과 다름
fireEvent.change(input, { target: { value: 'test' } });
```

---

### 3.3 비동기 처리 [UI-003]

#### Decision Tree

```
Q1: 요소가 비동기적으로 나타나는가? (API 응답 후, 지연 렌더링 등)
├─ YES → findBy* 사용 (Promise 반환, 자동 대기)
└─ NO
    Q2: 상태 변화를 기다려야 하는가? (mock 호출 확인, 상태 업데이트 등)
    ├─ YES → waitFor 사용
    └─ NO
        Q3: 요소가 존재하지 않을 수 있는가?
        ├─ YES → queryBy* 사용 (null 반환 가능)
        └─ NO → getBy* 사용 (즉시 선택)
```

#### 쿼리 유형별 용도

| 쿼리 유형 | 반환값 | 대기 | 용도 |
|----------|--------|------|------|
| `getBy*` | Element | 없음 | 요소가 반드시 존재할 때 |
| `queryBy*` | Element \| null | 없음 | 요소 비존재 확인 |
| `findBy*` | Promise\<Element\> | 있음 | 비동기 요소 출현 대기 |
| `getAllBy*` | Element[] | 없음 | 여러 요소 선택 |
| `queryAllBy*` | Element[] | 없음 | 여러 요소 (빈 배열 가능) |
| `findAllBy*` | Promise\<Element[]\> | 있음 | 비동기 여러 요소 대기 |

#### DO / DON'T

```
MUST: 요소 출현 대기 시 findBy* 사용
MUST: 상태 변화 대기 시 waitFor 사용
MUST: userEvent는 항상 await
MUST: 요소 비존재 확인 시 queryBy* 사용

MUST NOT: setTimeout/sleep 사용
MUST NOT: act() 직접 호출 (Testing Library가 자동 처리)
MUST NOT: waitFor 안에서 side effect 발생
MUST NOT: waitFor(() => getBy*) 패턴 (findBy* 사용)
```

#### 패턴 예시

```typescript
// ✅ 요소 출현 대기 (findBy)
it('should show user data after loading', async () => {
  // Given
  render(<UserProfile userId="123" />);

  // Then (비동기 대기 포함)
  expect(await screen.findByText(/john doe/i)).toBeInTheDocument();
});

// ✅ 상태 변화 대기 (waitFor)
it('should call API when form submitted', async () => {
  // Given
  const mockSubmit = vi.fn();
  const user = userEvent.setup();
  render(<ContactForm onSubmit={mockSubmit} />);

  // When
  await user.type(screen.getByRole('textbox', { name: /message/i }), 'Hello');
  await user.click(screen.getByRole('button', { name: /send/i }));

  // Then
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({ message: 'Hello' });
  });
});

// ✅ 요소 소멸 대기
it('should hide loading spinner after data loaded', async () => {
  // Given
  render(<DataList />);
  expect(screen.getByRole('status')).toBeInTheDocument();

  // Then (상태 변화 대기)
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

// ✅ 요소 비존재 확인 (queryBy)
it('should not show error initially', () => {
  // Given
  render(<LoginForm />);

  // Then
  expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
});
```

```typescript
// ❌ Bad: setTimeout 사용
it('should show message', async () => {
  render(<AsyncComponent />);
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(screen.getByText('Done')).toBeInTheDocument();
});

// ❌ Bad: waitFor + findBy 중복
await waitFor(async () => {
  expect(await screen.findByText('Done')).toBeInTheDocument();
});

// ❌ Bad: act 직접 사용
await act(async () => {
  await user.click(button);
});
```

#### waitFor 옵션

```typescript
// 기본 타임아웃: 1000ms
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});

// 타임아웃 커스텀
await waitFor(
  () => {
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  },
  { timeout: 3000 }
);
```

---

### 3.4 폼 테스트 [UI-004]

#### DO / DON'T

```
MUST: 유효성 검증 에러 메시지 테스트
MUST: 폼 제출 시 콜백 호출 검증
MUST: 필수 필드 누락 시나리오 테스트

SHOULD: 각 필드별 유효성 검증 개별 테스트
SHOULD: 제출 버튼 비활성화 상태 테스트
```

#### 패턴 예시

```typescript
// ✅ 폼 유효성 검증 테스트
it('should show error when email is invalid', async () => {
  // Given
  const user = userEvent.setup();
  render(<LoginForm />);

  // When
  await user.type(screen.getByRole('textbox', { name: /email/i }), 'invalid');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Then
  expect(screen.getByText(/valid email required/i)).toBeInTheDocument();
});

// ✅ 폼 제출 테스트
it('should call onSubmit with form data', async () => {
  // Given
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<LoginForm onSubmit={onSubmit} />);

  // When
  await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Then
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
});
```

---

### 3.5 렌더링 검증 [UI-005]

#### DO / DON'T

```
MUST: 초기 렌더링 상태 검증
MUST: 조건부 렌더링 시나리오 테스트
MUST: 로딩/에러 상태 테스트

MUST NOT: 스냅샷 테스트에 과도하게 의존
MUST NOT: 내부 컴포넌트 구조 테스트
```

#### 패턴 예시

```typescript
// ✅ 조건부 렌더링 테스트
it('should show login button when not authenticated', () => {
  // Given
  render(<Header isAuthenticated={false} />);

  // Then
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
});

it('should show logout button when authenticated', () => {
  // Given
  render(<Header isAuthenticated={true} />);

  // Then
  expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
});

// ✅ 로딩/에러 상태 테스트
it('should show loading state initially', () => {
  // Given
  render(<UserList />);

  // Then
  expect(screen.getByRole('status')).toBeInTheDocument();
});

it('should show error message on fetch failure', async () => {
  // Given
  server.use(
    http.get('/api/users', () => HttpResponse.error())
  );
  render(<UserList />);

  // Then
  expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
});
```

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| `container.querySelector` | DOM 구조 의존, 접근성 무시 | `getByRole`, `getByText` |
| `fireEvent` 직접 사용 | 실제 사용자 동작과 다름 | `userEvent` 사용 |
| `setTimeout`으로 대기 | 불안정, 느림 | `findBy*`, `waitFor` |
| `waitFor(() => getBy*)` | 중복 대기, 비효율 | `findBy*` 사용 |
| `act()` 직접 호출 | Testing Library가 처리 | `userEvent`, `waitFor` |
| 스냅샷 과다 사용 | 변경에 취약, 의도 불명확 | 명시적 assertion |

---

## 5. Self-Check

```
□ [UI-001] getByRole을 최우선으로 시도했는가?
□ [UI-001] name 옵션에 정규표현식을 사용했는가?
□ [UI-001] getByTestId 사용 시 불가피한 사유가 있는가?
□ [UI-002] 모든 userEvent에 await가 있는가?
□ [UI-002] userEvent.setup()을 사용했는가?
□ [UI-003] 비동기 요소 출현에 findBy*를 사용했는가?
□ [UI-003] setTimeout/sleep을 사용하지 않았는가?
□ [UI-004] 폼 유효성 검증 시나리오가 포함되었는가?
□ [UI-005] 로딩/에러 상태 테스트가 포함되었는가?
```

---

## 6. Quick Reference

### 필수 Import

```typescript
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

### Setup 패턴

```typescript
function setup(props: Partial<Props> = {}) {
  const user = userEvent.setup();
  const defaultProps: Props = {
    onSubmit: vi.fn(),
    ...props,
  };

  render(<Component {...defaultProps} />);

  return { user, ...defaultProps };
}
```

### 자주 쓰는 쿼리

```typescript
// Role 기반 (최우선)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('heading', { level: 1 });

// Label/Text 기반
screen.getByLabelText(/password/i);
screen.getByText(/welcome/i);

// 비동기 대기
await screen.findByText(/loaded/i);
```

### 자주 쓰는 Assertion

```typescript
// 존재 확인
expect(element).toBeInTheDocument();
expect(element).toBeVisible();

// 비존재 확인
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();

// 상태 확인
expect(button).toBeDisabled();
expect(input).toHaveValue('text');
expect(checkbox).toBeChecked();
```
