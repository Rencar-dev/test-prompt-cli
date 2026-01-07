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
- [RTL-001] 자동 cleanup 전략
- [RTL-002] fireEvent 후 즉시 assertion
- [RTL-003] wrapper 옵션 Provider 주입
- [RTL-004] renderHook initialProps/rerender
- [RTL-005] configure 설정 복원
- [RTL-006] cleanup microtask 동작
- [RTL-007] unmount 후 DOM 검증
- [RTL-008] React 버전 조건부 테스트
- [RTL-009] hydrate SSR 검증
- [RTL-010] reactStrictMode 이중 렌더링

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

### 3.4 비동기 3가지 패턴: waitFor, waitForElementToBeRemoved, findBy [UI-003-EXT]

**비동기 UI 변경을 대기하는 3가지 패턴의 용도를 명확히 구분합니다.**

> 적용 조건: React Testing Library 사용 시

```
MUST: 요소 제거 대기 → waitForElementToBeRemoved
MUST: 상태 변화 대기 → waitFor
MUST: 요소 출현 대기 → findBy*

MUST NOT: findBy로 제거 대기 (불가능)
MUST NOT: waitFor 없이 비동기 결과 즉시 검증
```

```typescript
// ✅ Good: 요소 제거 대기
const loading = () => screen.getByText('Loading...')
await waitForElementToBeRemoved(loading)

// ✅ Good: 상태 변화 대기
await waitFor(() => screen.getByText(/Loaded this message:/))

// ✅ Good: 요소 찾기 + 대기
await expect(screen.findByTestId('message')).resolves.toHaveTextContent(/Hello World/)
```

```typescript
// ❌ Bad: findBy로 제거 대기
await screen.findByText('Loading...')  // 제거되면 에러 발생

// ❌ Bad: 즉시 검증
render(<AsyncComponent />)
expect(screen.getByText('Loaded')).toBeInTheDocument()  // 실패 가능
```

#### 출처
- 원본: react-testing-library
- 파일: `end-to-end.js:55-74`, `end-to-end.js:139-162`
- 채택 점수: 10/10

---

### 3.5 폼 테스트 [UI-004]

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
□ [RTL-001] 자동 cleanup을 신뢰하고 중복 호출을 피했는가?
□ [RTL-002] fireEvent를 불필요한 act()로 래핑하지 않았는가?
□ [RTL-003] Provider는 wrapper 옵션으로 주입했는가?
□ [RTL-005] configure 변경 시 afterEach에서 복원하는가?
□ [RTL-007] unmount 후 DOM 정리를 검증했는가?
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

---

## 7. React Testing Library 특화 규칙

### 7.1 자동 cleanup 전략 [RTL-001]

**RTL의 자동 cleanup을 신뢰하고, 환경변수로 제어합니다.**

```
MUST: 자동 cleanup에 의존 (수동 호출 불필요)
SHOULD: 자동 cleanup 동작을 테스트로 검증

MUST NOT: 자동 cleanup 환경에서 수동 cleanup() 중복 호출
```

```typescript
// ✅ Good: 자동 cleanup 신뢰
test('first', () => {
  render(<div>hi</div>)
})

test('second', () => {
  expect(document.body).toBeEmptyDOMElement()  // 자동 정리됨
})

// ✅ Good: 환경변수로 제어 (특수 케이스)
process.env.RTL_SKIP_AUTO_CLEANUP = 'true'
const rtl = require('../')
```

```typescript
// ❌ Bad: 자동 cleanup 환경에서 중복 호출
afterEach(() => {
  cleanup()  // 불필요
})
```

#### 출처
- 원본: react-testing-library
- 파일: `auto-cleanup.js:6-12`, `auto-cleanup-skip.js:5-17`
- 채택 점수: 10/10

---

### 7.2 fireEvent 후 즉시 assertion (act 불필요) [RTL-002]

**RTL의 fireEvent는 내부적으로 act를 처리하므로 명시적 act 래핑이 불필요합니다.**

```
MUST: fireEvent 후 바로 expect로 검증
MUST NOT: fireEvent를 act()로 래핑 (중복)
```

```typescript
// ✅ Good: fireEvent 후 직접 검증
fireEvent.click(buttonNode)
expect(buttonNode).toHaveTextContent('1')
expect(effectCb).toHaveBeenCalledTimes(1)

// ✅ Good: 이벤트 체인
fireEvent.change(input, {target: {value: 'a'}})
expect(handleChange).toHaveBeenCalledTimes(1)
```

```typescript
// ❌ Bad: 불필요한 act 래핑
act(() => {
  fireEvent.click(button)  // 이미 내부적으로 act 처리됨
})
expect(button).toHaveTextContent('clicked')
```

#### 출처
- 원본: react-testing-library
- 파일: `act.js:20-35`, `events.js:207-214`
- 채택 점수: 10/10

---

### 7.3 wrapper 옵션으로 Provider 주입 [RTL-003]

**Context Provider는 wrapper 옵션으로 주입하여 재사용성을 높입니다.**

```
MUST: render/renderHook에서 wrapper 옵션으로 Provider 주입
SHOULD: 재사용 가능한 wrapper 함수 정의

MUST NOT: 매번 수동으로 Provider 감싸기
```

```typescript
// ✅ Good: wrapper 옵션 활용
const WrapperComponent = ({children}) => (
  <div data-testid="wrapper">{children}</div>
)

const {container} = render(<div data-testid="inner" />, {
  wrapper: WrapperComponent,
})

// ✅ Good: renderHook에서 Context 주입
const Context = React.createContext('default')
function Wrapper({children}) {
  return <Context.Provider value="provided">{children}</Context.Provider>
}
const {result} = renderHook(() => React.useContext(Context), {
  wrapper: Wrapper,
})
```

```typescript
// ❌ Bad: 수동 래핑 (재사용 어려움)
render(
  <Context.Provider value="provided">
    <MyComponent />
  </Context.Provider>
)
```

#### 출처
- 원본: react-testing-library
- 파일: `render.js:93-112`, `renderHook.js:53-67`
- 채택 점수: 10/10

---

### 7.4 renderHook: initialProps와 rerender로 props 변경 테스트 [RTL-004]

**Hook의 props 변경 시나리오는 initialProps와 rerender를 조합합니다.**

```
MUST: props 변경 테스트 시 initialProps와 rerender 조합 사용
MUST: rerender로 props 변경 후 result.current 재검증

MUST NOT: props 변경 시나리오 누락
```

```typescript
// ✅ Good: props 변경 테스트
const {result, rerender} = renderHook(
  ({branch}) => {
    const [left, setLeft] = React.useState('left')
    const [right, setRight] = React.useState('right')

    switch (branch) {
      case 'left': return [left, setLeft]
      case 'right': return [right, setRight]
      default: throw new Error('No Props passed')
    }
  },
  {initialProps: {branch: 'left'}}
)

expect(result.current).toEqual(['left', expect.any(Function)])

rerender({branch: 'right'})

expect(result.current).toEqual(['right', expect.any(Function)])
```

#### 출처
- 원본: react-testing-library
- 파일: `renderHook.js:24-50`
- 채택 점수: 10/10

---

### 7.5 configure 설정 변경 시 복원 [RTL-005]

**RTL configure로 전역 설정을 변경하면 반드시 복원합니다.**

```
MUST: beforeEach에서 원본 설정 저장
MUST: afterEach에서 원본 설정으로 복원
```

```typescript
// ✅ Good: configure 변경 시 복원 보장
let originalConfig
beforeEach(() => {
  configure(existingConfig => {
    originalConfig = existingConfig
    return {}
  })
})

afterEach(() => {
  configure(originalConfig)
})

test('test with custom config', () => {
  configure({testIdAttribute: 'not-data-testid'})
  // 테스트 로직
})
```

```typescript
// ❌ Bad: 복원 없음
test('test1', () => {
  configure({reactStrictMode: true})
  // 다음 테스트에 영향
})
```

#### 출처
- 원본: react-testing-library
- 파일: `config.js:4-17`, `render.js:13-26`
- 채택 점수: 10/10

---

### 7.6 cleanup은 microtask를 flush하지 않음 [RTL-006]

**cleanup()은 비동기 작업(Promise, microtask)을 기다리지 않습니다.**

```
MUST: 비동기 정리는 useEffect cleanup으로 처리
MUST NOT: cleanup이 Promise를 flush한다고 가정
```

```typescript
// ✅ Good: useEffect cleanup으로 비동기 취소
function Test() {
  const [, setDeferredCounter] = React.useState(null)
  React.useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) {
        setDeferredCounter(counter)
      }
    })

    return () => {
      cancelled = true  // cleanup에서 취소
    }
  }, [counter])

  return null
}
```

```typescript
// ❌ Bad: cleanup 후 Promise 완료 기대
render(<AsyncComponent />)
cleanup()
// Promise는 여전히 pending 상태
```

#### 출처
- 원본: react-testing-library
- 파일: `cleanup.js:58-88`
- 채택 점수: 10/10

---

### 7.7 unmount 후 DOM 정리 검증 [RTL-007]

**unmount() 호출 후 DOM이 비어있는지 검증합니다.**

```
MUST: unmount 후 container/document.body 검증
SHOULD: toBeEmptyDOMElement() 사용
```

```typescript
// ✅ Good: unmount 후 정리 확인
const {unmount, container} = render(<MyComponent />)
unmount()
expect(container).toBeEmptyDOMElement()

// ✅ Good: cleanup 후 document.body 검증
render(<div>hi</div>)
cleanup()
expect(document.body).toBeEmptyDOMElement()
```

```typescript
// ❌ Bad: unmount만 호출하고 검증 안함
const {unmount} = render(<MyComponent />)
unmount()
// 정리되었는지 확인 안함
```

#### 출처
- 원본: react-testing-library
- 파일: `cleanup.js:20-22`, `render.js:174-176`
- 채택 점수: 10/10

---

### 7.8 React 버전 조건부 테스트 (testGate 패턴) [RTL-008]

**React 버전에 따라 동작이 다른 기능은 조건부 테스트를 작성합니다.**

```
MUST: 버전별 동작 차이 시 testGate 패턴 사용
SHOULD: React.version으로 버전 확인
```

```typescript
// ✅ Good: 버전 조건 명시
const isReact19 = React.version.startsWith('19.')
const testGateReact19 = isReact19 ? test : test.skip

testGateReact19('onCaughtError is supported in render', () => {
  // React 19 전용 기능 테스트
})

// ✅ Good: 테스트 내 버전별 분기
test('render errors', () => {
  if (isReact19) {
    expect(() => render(<Thrower />)).toThrow('Boom!')
  } else {
    expect(() => {
      expect(() => render(<Thrower />)).toThrow('Boom!')
    }).toErrorDev([...])
  }
})
```

#### 출처
- 원본: react-testing-library
- 파일: `error-handlers.js:7-9`, `render.js:6-10`
- 채택 점수: 10/10

---

### 7.9 hydrate 옵션으로 SSR 검증 [RTL-009]

**SSR/hydration 테스트는 hydrate 옵션을 사용합니다.**

> 적용 조건: SSR/hydration 테스트 시

```
MUST: SSR 결과에 render 시 hydrate: true 옵션 사용
MUST: hydration 후 interactive 동작 검증
```

```typescript
// ✅ Good: SSR → hydrate → interactive 검증
const ui = <App />
const container = document.createElement('div')
document.body.appendChild(container)
container.innerHTML = ReactDOMServer.renderToString(ui)

expect(container).toHaveTextContent('clicked:0')

render(ui, {container, hydrate: true})

fireEvent.click(container.querySelector('button'))
expect(container).toHaveTextContent('clicked:1')
```

```typescript
// ❌ Bad: hydrate 누락
container.innerHTML = ReactDOMServer.renderToString(ui)
render(ui, {container})  // hydration mismatch 발생
```

#### 출처
- 원본: react-testing-library
- 파일: `render.js:179-201`, `render.js:203-220`
- 채택 점수: 10/10

---

### 7.10 reactStrictMode로 이중 렌더링 검증 [RTL-010]

**React StrictMode 환경에서의 이중 렌더링 동작을 검증합니다.**

```
SHOULD: StrictMode 환경에서 부작용 함수 2번 호출 검증
SHOULD: configure 또는 renderOptions로 reactStrictMode 설정
```

```typescript
// ✅ Good: StrictMode 이중 렌더링 검증
configure({reactStrictMode: true})

const spy = jest.fn()
function Component() {
  spy()
  return null
}

render(<Component />)
expect(spy).toHaveBeenCalledTimes(2)

// ✅ Good: renderOptions로 개별 설정
render(<Component />, {reactStrictMode: true})
expect(spy).toHaveBeenCalledTimes(2)
```

```typescript
// ⚠️ 주의: StrictMode 고려 없는 호출 횟수 검증
render(<Component />)
expect(spy).toHaveBeenCalledTimes(1)  // StrictMode 활성화 시 실패
```

#### 출처
- 원본: react-testing-library
- 파일: `render.js:136-147`, `renderHook.js:131-140`
- 채택 점수: 10/10

---

### 7.11 baseElement로 다중 render 격리 [RTL-011]

**동일 테스트에서 여러 React 트리를 독립적으로 테스트할 때 baseElement를 사용합니다.**

> 적용 조건: 동일 테스트에서 여러 React 트리 필요 시

```
SHOULD: baseElement로 각 트리 격리
SHOULD: beforeAll/afterAll로 DOM 요소 관리
```

```typescript
// ✅ Good: baseElement로 격리
let treeA, treeB
beforeAll(() => {
  treeA = document.createElement('div')
  treeB = document.createElement('div')
  document.body.appendChild(treeA)
  document.body.appendChild(treeB)
})

afterAll(() => {
  treeA.parentNode.removeChild(treeA)
  treeB.parentNode.removeChild(treeB)
})

test('baseElement isolates trees', () => {
  const {getByText: getByTextInA} = render(<div>Jekyll</div>, {
    baseElement: treeA,
  })
  const {getByText: getByTextInB} = render(<div>Hyde</div>, {
    baseElement: treeB,
  })

  expect(() => getByTextInA('Jekyll')).not.toThrow()
  expect(() => getByTextInB('Jekyll')).toThrow()
})
```

#### 출처
- 원본: react-testing-library
- 파일: `multi-base.js:6-39`
- 채택 점수: 8/10
