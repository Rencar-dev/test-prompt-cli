# 테스트 공통 규칙

---

## 1. 규칙 표기법

본 문서의 규칙은 다음 키워드로 강도를 표시한다:

| 키워드 | 의미 | 위반 시 |
|--------|------|---------|
| **MUST** | 반드시 준수 | 테스트 무효 |
| **MUST NOT** | 반드시 금지 | 테스트 무효 |
| **SHOULD** | 권장 | 예외 시 주석으로 사유 명시 |

---

## 2. 적용 가이드

| 단계 | 참고 섹션 | 체크 항목 |
|------|----------|----------|
| **작성 전** | §3 테스트 대상 판단 | 테스트 필요 여부 |
| **작성 중** | §4 코드 규칙, §5 Mock 원칙 | GWT 패턴, 격리, 모킹 범위 |
| **작성 후** | §7 Self-Check | 격리, 안정성, 가독성 |

---

## 3. 테스트 대상 판단 [SCOPE-001]

### 3.1 Decision Tree

```
Q1: 사용자 인터랙션이 있는가? (클릭, 입력, 제출 등)
├─ YES → 테스트 대상
└─ NO → Q2로 이동

Q2: 비즈니스 로직이 포함되어 있는가? (계산, 검증, 변환 등)
├─ YES → 테스트 대상
└─ NO → Q3로 이동

Q3: 외부 시스템과 연동하는가? (API 호출, 스토리지 등)
├─ YES → 테스트 대상
└─ NO → Q4로 이동

Q4: 상태 변화가 UI에 영향을 주는가?
├─ YES → 테스트 대상
└─ NO → 테스트 제외
```

### 3.2 DO / DON'T

```
MUST: 다음을 테스트한다
  - 사용자 인터랙션이 있는 컴포넌트
  - 비즈니스 로직이 포함된 함수/훅/Composable
  - 외부 API 연동 로직
  - 조건부 UI 표시 로직
  - 폼 유효성 검증

MUST NOT: 다음은 테스트하지 않는다
  - 외부 라이브러리 내부 동작
  - 단순 속성(props/attrs) 전달만 하는 래퍼 컴포넌트
  - CSS/스타일링 (시각적 회귀 테스트 도구 사용)
  - 상수/타입 정의 파일
  - 제3자 컴포넌트 라이브러리 동작
```

---

## 4. 코드 작성 규칙 [CODE-001]

### 4.1 GWT 패턴 (Given-When-Then)

```
MUST: 모든 테스트는 GWT 패턴으로 구조화한다

Given: 테스트에 필요한 사전 조건/상태 준비
When: 테스트 대상 동작 실행
Then: 결과 검증
```

```typescript
// 예시 (React + Testing Library)
it('should show error message when password is empty', async () => {
  // Given
  const onSubmit = mockFn();
  render(<LoginForm onSubmit={onSubmit} />);

  // When
  await user.click(getByRole('button', { name: /submit/i }));

  // Then
  expect(getByText(/password is required/i)).toBeVisible();
  expect(onSubmit).not.toHaveBeenCalled();
});
```

```typescript
// ❌ Bad: 구분 없이 혼합
it('should work', async () => {
  render(<LoginForm />);
  expect(getByText('Login')).toBeVisible();  // Then이 When 전에
  await user.click(getByRole('button'));
  expect(getByText('Error')).toBeVisible();
  await user.type(getByRole('textbox'), 'test');
  expect(queryByText('Error')).not.toBeVisible();
});
```

### 4.2 단일 책임 원칙 [CODE-002]

```
MUST: 하나의 테스트에서 하나의 동작만 검증
MUST: 하나의 논리적 시나리오 = 하나의 테스트

MUST NOT: 여러 시나리오를 하나의 테스트에 포함
MUST NOT: 관련 없는 assertion을 하나의 테스트에 묶기
```

```typescript
// ✅ Good: 단일 동작 검증
it('should increment count when plus button clicked', async () => {
  // Given
  render(<Counter initialCount={0} />);

  // When
  await user.click(getByRole('button', { name: /plus/i }));

  // Then
  expect(getByText('1')).toBeVisible();
});
```

```typescript
// ❌ Bad: 여러 시나리오 혼합
it('should handle count changes', async () => {
  render(<Counter initialCount={0} />);

  await user.click(plusButton);
  expect(getByText('1')).toBeVisible();

  await user.click(plusButton);
  expect(getByText('2')).toBeVisible();

  await user.click(minusButton);
  expect(getByText('1')).toBeVisible();
});
```

### 4.3 테스트 격리 [CODE-003]

```
MUST: 각 테스트는 독립적으로 실행 가능해야 함
MUST: beforeEach에서 필요한 상태 초기화
MUST: afterEach에서 모든 mock/spy 정리

MUST NOT: 테스트 간 변수 공유
MUST NOT: 테스트 실행 순서에 의존
MUST NOT: 이전 테스트의 상태에 의존
```

```typescript
// ✅ Good: 각 테스트가 독립적
describe('UserProfile', () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it('should display user name Alice', () => {
    render(<UserProfile user={{ name: 'Alice' }} />);
    expect(getByText('Alice')).toBeVisible();
  });

  it('should display user name Bob', () => {
    render(<UserProfile user={{ name: 'Bob' }} />);
    expect(getByText('Bob')).toBeVisible();
  });
});
```

```typescript
// ❌ Bad: 테스트 간 상태 공유
describe('UserProfile', () => {
  let currentUser = { name: 'Alice' };  // 공유 상태

  it('should display user name', () => {
    render(<UserProfile user={currentUser} />);
    expect(getByText('Alice')).toBeVisible();
    currentUser.name = 'Modified';  // 다른 테스트에 영향
  });

  it('should work with modified user', () => {
    // currentUser가 이전 테스트에서 변경됨 - 순서 의존성
    render(<UserProfile user={currentUser} />);
  });
});
```

### 4.4 테스트 명세 작성 [CODE-004]

#### describe 작성

```
MUST: 첫 번째 describe는 테스트 대상(컴포넌트/함수명) 명시
MUST: 중첩 describe는 상황/컨텍스트 명시 ("~할 때", "~인 경우")

MUST NOT: 3단계 이상 중첩
```

#### it 작성

```
MUST: "[동작] 시 [결과]" 또는 "[결과]한다" 형식
MUST: 하나의 동작과 결과만 기술

MUST NOT: "테스트", "검증" 등 메타 용어 사용
MUST NOT: 구현 세부사항 언급
```

#### 표기 언어

```
SHOULD: 팀 컨벤션에 따라 한글 또는 영어 통일

MUST NOT: 한 프로젝트 내 혼용
```

```typescript
// ✅ Good: 계층적 명세 (한글)
describe('LoginForm', () => {
  describe('이메일이 비어있을 때', () => {
    it('제출 버튼 클릭 시 에러 메시지를 표시한다', () => {});
    it('제출 버튼이 비활성화된다', () => {});
  });

  describe('유효한 입력일 때', () => {
    it('제출 시 onSubmit을 호출한다', () => {});
  });
});

// ✅ Good: 계층적 명세 (영어)
describe('LoginForm', () => {
  describe('when email is empty', () => {
    it('shows error message on submit', () => {});
    it('disables submit button', () => {});
  });
});
```

```typescript
// ❌ Bad: 메타 용어 사용
it('에러 메시지 테스트', () => {});
it('onSubmit 호출 검증', () => {});

// ❌ Bad: 구현 세부사항 언급
it('setState가 호출된다', () => {});
it('useEffect가 실행된다', () => {});

// ❌ Bad: 3단계 이상 중첩
describe('LoginForm', () => {
  describe('이메일 필드', () => {
    describe('포커스 시', () => {
      describe('빈 값일 때', () => {  // 과도한 중첩
      });
    });
  });
});
```

---

## 5. Mock 원칙 [MOCK-001]

### 5.1 Decision Tree

```
Q1: 외부 네트워크 요청인가? (API 호출)
├─ YES → API Mocking
└─ NO
    Q2: 비결정적 값인가? (Date, Math.random, UUID 등)
    ├─ YES → 고정값 반환하도록 Mock
    └─ NO
        Q3: 외부 모듈 의존성인가? (라이브러리 함수)
        ├─ YES → 경계에서만 Mock
        └─ NO
            Q4: 함수 호출 추적이 필요한가?
            ├─ YES → Spy 사용
            └─ NO → Mock 불필요
```

### 5.2 DO / DON'T

```
MUST: 외부 경계만 Mock (네트워크, 타이머, 랜덤)
MUST: Mock은 테스트 파일 상단에서 정의
MUST: beforeEach에서 mock 초기화
MUST: 실제 동작을 최대한 보존

MUST NOT: 내부 구현 세부사항 Mock
MUST NOT: 자식 컴포넌트 Mock (통합 테스트 원칙)
MUST NOT: 테스트 대상 모듈 자체를 Mock
MUST NOT: 단순히 테스트를 쉽게 만들기 위한 과도한 Mock
```

### 5.3 Mock 범위 기준

| 구분 | Mock 여부 | 이유 |
|------|----------|------|
| 외부 API 호출 | **MUST** | 네트워크 의존성 제거 |
| Date, Random | **MUST** | 결정적 테스트 보장 |
| 타이머 (setTimeout) | **SHOULD** | 테스트 속도 향상 |
| 외부 라이브러리 | **경계만** | 실제 동작 보존 |
| 내부 함수/모듈 | **MUST NOT** | 구현 결합도 증가 |
| 자식 컴포넌트 | **MUST NOT** | 통합 테스트 원칙 위반 |

### 5.4 Anti-patterns

```typescript
// ❌ Bad: 자식 컴포넌트 Mock
mock('./ChildComponent', () => ({
  ChildComponent: () => <div>Mocked</div>,  // 실제 동작 검증 불가
}));

// ❌ Bad: 테스트 대상 자체를 Mock
mock('./utils', () => ({
  calculateTotal: () => 100,  // 테스트 대상을 Mock하면 의미 없음
}));
```

---

## 6. Anti-patterns [ANTI-001]

### 6.1 금지 패턴 목록

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| 구현 세부사항 테스트 | 리팩토링에 취약 | 외부 동작으로 검증 |
| 스냅샷 과다 사용 | 변경에 취약, 의도 불명확 | 명시적 assertion |
| 내부 상태 직접 테스트 | 구현 결합도 증가 | 공개 API로 검증 |
| Mock 과다 사용 | 실제 동작 검증 불가 | 필요한 경계만 Mock |
| 테스트 간 상태 공유 | 순서 의존성, Flaky | 각 테스트 독립적으로 |
| 매직 넘버/문자열 | 의도 불명확 | 상수로 추출 |
| 타이밍 기반 assertion | Flaky 테스트 | 명시적 대기 |

### 6.2 구현 세부사항 테스트 금지

```
MUST NOT: 내부 상태나 private 메서드를 직접 테스트
MUST: 사용자/소비자 관점에서 외부로 노출된 동작만 검증
```

```typescript
// ❌ Bad: 내부 구현 테스트 (내부 상태 직접 접근)
expect(component._internalState).toBe(1);
expect(result.current._privateCount).toBe(1);

// ✅ Good: 외부 동작 테스트 (사용자가 보는 결과 확인)
expect(getByText('1')).toBeVisible();
expect(screen.getByRole('status')).toHaveTextContent('Complete');
```

### 6.3 Flaky 테스트 방지

```
MUST NOT: 타이밍에 의존하는 assertion
MUST NOT: 네트워크 상태에 의존
MUST NOT: 랜덤 값에 의존
MUST NOT: 실행 순서에 의존

MUST: 모든 비동기 작업 명시적 대기
MUST: 외부 의존성 완전히 격리
MUST: 결정적(deterministic) 테스트 작성
```

### 6.4 waitFor + Mock 호출 검증 금지 [ANTI-002] ⚠️ Critical

**waitFor는 비동기 UI 변화를 기다리는 도구입니다. Mock 호출은 동기적으로 발생합니다.**

```
MUST NOT: waitFor 안에서 mock 호출 검증
MUST: UI 변화 대기 후 Mock 호출을 동기적으로 검증
```

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

#### 예외: UI 앵커가 없는 경우

Mock이 UI 상태를 대체하여 **로딩 스피너 등 UI 앵커가 없는 경우**에 한해 예외 허용:

```typescript
// ⚠️ 예외적 허용: 비동기 완료 신호로만 사용
// Note: UI 앵커 없음 - mockHideLoading을 비동기 완료 신호로 사용
await waitFor(() => {
  expect(mockHideLoading).toHaveBeenCalled();
});
// 핵심 검증은 반드시 waitFor 밖에서
expect(mockRouter.reset).toHaveBeenCalledWith({ index: 0, routes: [...] });
```

**예외 필수 조건**:
1. `// Note: UI 앵커 없음` 주석 필수
2. 핵심 검증(router, API 호출 등)은 waitFor 밖에서 수행
3. waitFor 내부는 "비동기 완료 신호" 용도로만 사용

### 6.5 Weak Assertion 금지 [ANTI-003] ⚠️ Critical

**Void 함수는 인자가 곧 결과값입니다. 호출 여부만 검증하면 잘못된 인자로 호출되어도 통과합니다.**

```
MUST: 콜백/이벤트 핸들러 검증 시 toHaveBeenCalledWith 사용
MUST: 인자까지 검증

MUST NOT: toHaveBeenCalled()만 사용
MUST NOT: toHaveBeenCalledTimes(1)만 사용
```

```typescript
// ❌ 금지: 호출 여부만 검증
expect(saveFn).toHaveBeenCalled();
expect(saveFn).toHaveBeenCalledTimes(1);

// ✅ 올바른 방법: 인자까지 검증
expect(saveFn).toHaveBeenCalledWith({ id: 1, name: 'test' });
```

### 6.6 Hook 내부 구현 확인 [ANTI-004]

**Mocking 여부를 결정하기 전에, 해당 Hook이 API 통신을 수행하는지 반드시 소스 코드를 읽어 확인하라.**

#### 확인 절차

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
server.use(
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ token: 'abc123' });
  })
);
```

#### Self-Check

```
□ 테스트 대상 Hook 내부 코드를 확인했는가?
□ useMutation, useQuery 사용 여부를 확인했는가?
□ API 통신이 포함되면 MSW를 사용하기로 결정했는가?
```

---

## 7. Self-Check [CHECK-001]

테스트 코드 작성 완료 후 다음 항목을 검증한다:

### 7.1 구조 검증

```
□ GWT 패턴이 명확히 구분되어 있는가?
□ 각 테스트가 단일 동작만 검증하는가?
□ describe가 테스트 대상과 상황을 명시하는가?
□ it이 "[동작] 시 [결과]" 형식인가?
□ describe 중첩이 2단계 이하인가?
```

### 7.2 격리 검증

```
□ beforeEach에서 mock이 초기화되는가?
□ 테스트 간 변수 공유가 없는가?
□ 전역 상태 오염이 없는가?
□ 테스트 순서에 관계없이 통과하는가?
```

### 7.3 Mock 검증

```
□ 외부 경계만 Mock했는가?
□ 내부 구현을 Mock하지 않았는가?
□ 테스트 대상 자체를 Mock하지 않았는가?
□ Mock 호출 검증이 정확한가?
```

### 7.4 안정성 검증

```
□ 타이밍에 의존하지 않는가?
□ 랜덤/비결정적 값이 고정되어 있는가?
□ 네트워크 요청이 Mock되어 있는가?
□ 반복 실행해도 동일한 결과가 나오는가?
```
