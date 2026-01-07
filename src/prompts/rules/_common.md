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

#### it 작성: 행동 중심 명세

```
MUST: "[동작] 시 [결과]" 또는 "[결과]한다" 형식 사용
MUST: 하나의 동작과 결과만 기술

MUST NOT: "테스트", "검증" 등 메타 용어 사용
MUST NOT: 구현 세부사항 언급
```

```typescript
// ✅ Good: 행동 중심 명세
it('두 숫자를 더한다', () => {
  expect(add(6, 4)).toBe(10);
});

it('문자열 인자는 숫자로 변환하지 않는다', () => {
  expect(add('6', '4')).toBe('64');
});

it('NaN 입력 시 NaN을 반환한다', () => {
  expect(clamp(NaN, -5, 5)).toBeNaN();
});

it('빈 이메일 입력 시 에러 메시지를 표시한다', () => {});
it('제출 버튼이 비활성화된다', () => {});
```

```typescript
// ❌ Bad: 불명확한 명세
it('숫자', () => {});
it('테스트 1', () => {});
it('더하기', () => {});  // 무엇을 검증하는지 불명확
```

```typescript
// ✅ Good: 계층적 명세
describe('LoginForm', () => {
  describe('이메일이 비어있을 때', () => {
    it('제출 버튼 클릭 시 에러 메시지를 표시한다', () => {});
    it('제출 버튼이 비활성화된다', () => {});
  });

  describe('유효한 입력일 때', () => {
    it('제출 시 onSubmit을 호출한다', () => {});
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

### 4.5 테스트 데이터 상수화 [CODE-005]

**테스트에서 재사용되는 값은 파일 상단에 상수로 정의하여 일관성과 가독성을 확보합니다.**

```
MUST: 여러 테스트에서 사용되는 값은 상수로 정의
MUST: 상수명은 용도를 명확히 표현
SHOULD: JSDoc 주석으로 용도 설명

MUST NOT: 테스트 내 매직 넘버/값 직접 사용
MUST NOT: 동일한 테스트 데이터를 여러 곳에서 중복 정의
```

```typescript
// ✅ Good: 파일 상단에 테스트 데이터 상수 정의

/** Used as the size to cover large array optimizations. */
const LARGE_ARRAY_SIZE = 200;

/** Used to provide falsey values to methods. */
const falsey = [, null, undefined, false, 0, NaN, ''];

/** Used to provide primitive values to methods. */
const primitives = [null, undefined, false, true, 1, NaN, 'a'];

/** Used to provide empty values to methods. */
const empties = [[], {}].concat(falsey.slice(1));

describe('array utilities', () => {
  it('should handle falsey values', () => {
    falsey.forEach(value => {
      expect(fn(value)).toBe(false);
    });
  });
});
```

```typescript
// ❌ Bad: 매직 넘버, 중복 정의
describe('array utilities', () => {
  it('should handle edge cases', () => {
    expect(fn(null)).toBe(false);
    expect(fn(undefined)).toBe(false);
    expect(fn(false)).toBe(false);
    expect(fn(0)).toBe(false);
    // 중복되고 유지보수 어려움
  });
});
```

#### 출처
- 원본: lodash
- 파일: `test.js:7-210`
- 채택 점수: 10/10

---

### 4.6 Stub 함수 재사용 [CODE-006]

**테스트에서 사용하는 stub 함수는 반환값 기준으로 네이밍하여 재사용합니다.**

```
MUST: stub 함수명은 반환값을 표현 (stubTrue, stubNull 등)
SHOULD: 파일 상단에 공통 stub 함수 정의
SHOULD: 익명 함수 대신 명명된 stub 사용

MUST NOT: 동일한 익명 함수를 여러 곳에서 중복 정의
```

```typescript
// ✅ Good: 재사용 가능한 stub 함수
const stubTrue = () => true;
const stubFalse = () => false;
const stubNull = () => null;
const stubNaN = () => NaN;
const stubZero = () => 0;
const stubOne = () => 1;
const stubArray = () => [];
const stubObject = () => ({});
const stubString = () => '';

describe('filter', () => {
  it('should work with predicate returning true', () => {
    expect(filter([1, 2, 3], stubTrue)).toEqual([1, 2, 3]);
  });

  it('should work with predicate returning false', () => {
    expect(filter([1, 2, 3], stubFalse)).toEqual([]);
  });
});
```

```typescript
// ❌ Bad: 익명 함수 중복
describe('filter', () => {
  it('should work with predicate returning true', () => {
    expect(filter([1, 2, 3], () => true)).toEqual([1, 2, 3]);
  });

  it('should work with predicate returning false', () => {
    expect(filter([1, 2, 3], () => false)).toEqual([]);
  });
});
```

#### 출처
- 원본: lodash
- 파일: `test.js:92-110`
- 채택 점수: 10/10

---

### 4.7 다수 케이스 일괄 테스트 (map 패턴) [CODE-007]

**여러 입력값에 대해 동일한 로직을 검증할 때는 map을 사용하여 중복을 제거합니다.**

```
MUST: 동일 로직의 다수 케이스는 map으로 일괄 테스트
MUST: 입력-출력 쌍을 명확히 매핑
SHOULD: 케이스 추가/제거가 용이한 구조로 작성

MUST NOT: 동일한 assertion을 여러 번 복붙
```

```typescript
// ✅ Good: map으로 다수 케이스 테스트
describe('ary', () => {
  it('should coerce n to an integer', () => {
    const values = ['1', 1.6, 'xyz'];
    const expected = [['a'], ['a'], []];

    const actual = values.map(n => {
      const capped = ary(fn, n);
      return capped('a', 'b');
    });

    expect(actual).toEqual(expected);
  });
});

describe('isIndex', () => {
  it('should return true for indexes', () => {
    const values = [[0], ['0'], ['1'], [3, 4], [MAX_SAFE_INTEGER - 1]];
    const expected = values.map(() => true);

    const actual = values.map(args => isIndex(...args));

    expect(actual).toEqual(expected);
  });
});
```

```typescript
// ❌ Bad: 중복된 테스트 케이스 나열
it('should coerce n to an integer', () => {
  const capped1 = ary(fn, '1');
  expect(capped1('a', 'b')).toEqual(['a']);

  const capped2 = ary(fn, 1.6);
  expect(capped2('a', 'b')).toEqual(['a']);

  const capped3 = ary(fn, 'xyz');
  expect(capped3('a', 'b')).toEqual([]);
  // 반복적이고 유지보수 어려움
});
```

#### 출처
- 원본: lodash
- 파일: `test.js:1267-1276`, `test.js:4918-4926`
- 채택 점수: 10/10

---

### 4.8 describe.each로 동일 시나리오 다중 조건 테스트 [CODE-008]

**동일한 테스트 로직을 여러 조건(환경, 파라미터)에서 실행해야 할 때 describe.each를 사용하여 중복을 제거합니다.**

```
MUST: 동일 로직을 3개 이상 조건에서 테스트할 때 describe.each 사용
MUST: beforeEach/afterEach로 각 조건별 환경 격리
SHOULD: 조건 레이블을 테스트 이름에 포함 (%s 사용)

MUST NOT: 동일 로직을 복사-붙여넣기하여 중복 작성
```

```typescript
// ✅ Good: describe.each로 타이머 환경별 테스트
describe.each([
  ['real timers', () => jest.useRealTimers()],
  ['fake legacy timers', () => jest.useFakeTimers('legacy')],
  ['fake modern timers', () => jest.useFakeTimers('modern')],
])(
  'it waits for the data to be loaded using %s',
  (label, useTimers) => {
    beforeEach(() => {
      useTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('waitForElementToBeRemoved', async () => {
      render(<ComponentWithLoader />)
      await waitForElementToBeRemoved(() => screen.getByText('Loading...'))
      expect(screen.getByTestId('message')).toHaveTextContent(/Hello World/)
    })
  }
)
```

```typescript
// ❌ Bad: 중복 코드
describe('real timers', () => {
  beforeEach(() => jest.useRealTimers())
  test('waitForElementToBeRemoved', async () => { /* ... */ })
})

describe('fake timers', () => {
  beforeEach(() => jest.useFakeTimers())
  test('waitForElementToBeRemoved', async () => { /* ... */ })  // 중복
})
```

#### 출처
- 원본: react-testing-library
- 파일: `end-to-end.js:4-76`, `events.js:147-170`
- 채택 점수: 10/10

---

### 4.9 beforeEach/afterEach 대칭 구조 [CODE-009]

**테스트 setup과 teardown은 반드시 대칭 구조를 유지합니다. beforeEach에서 설정한 것은 afterEach에서 복원합니다.**

```
MUST: beforeEach에서 변경한 전역 상태는 afterEach에서 복원
MUST: console spy, timer mock 등은 반드시 복원
MUST: 복합 setup(spy + timer)도 대칭 유지

MUST NOT: teardown 누락으로 다음 테스트에 영향
```

```typescript
// ✅ Good: 대칭 구조
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  console.log.mockRestore()
})

// ✅ Good: 복합 setup도 대칭 유지
beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.useFakeTimers()
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})
```

```typescript
// ❌ Bad: 비대칭 (teardown 누락)
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
})
// afterEach 없음 → 다음 테스트에 영향
```

#### 출처
- 원본: react-testing-library
- 파일: `debug.js:4-10`, `new-act.js:12-19`, `cleanup.js:46-55`
- 채택 점수: 10/10

---

### 4.10 테스트 내 컴포넌트/데이터 정의로 격리 [CODE-010]

**테스트에서만 사용하는 컴포넌트나 데이터는 테스트 내부 또는 describe 블록 내에 정의하여 테스트 간 의존성을 제거합니다.**

```
MUST: 테스트 특화 컴포넌트는 테스트 내부 또는 describe 내부에 정의
MUST: 각 테스트에서 필요한 모든 컨텍스트가 테스트 내에 존재하도록 작성

SHOULD: describe.each 내 공유 컴포넌트는 describe 블록 내 정의

MUST NOT: 파일 최상위에 테스트용 컴포넌트 정의 (테스트 간 결합 발생)
```

```typescript
// ✅ Good: 테스트 내 컴포넌트 정의
test('render calls useEffect immediately', () => {
  const effectCb = jest.fn()
  function MyUselessComponent() {
    React.useEffect(effectCb)
    return null
  }
  render(<MyUselessComponent />)
  expect(effectCb).toHaveBeenCalledTimes(1)
})

// ✅ Good: describe 내 공유 컴포넌트
describe.each([...])('...', (label, useTimers) => {
  function ComponentWithLoader() {
    // 해당 describe 그룹 전용 컴포넌트
  }

  test('test1', () => { render(<ComponentWithLoader />) })
  test('test2', () => { render(<ComponentWithLoader />) })
})
```

```typescript
// ❌ Bad: 파일 최상위 컴포넌트 (테스트 간 결합)
const SharedComponent = () => { /* ... */ }

test('test1', () => {
  render(<SharedComponent />)  // 다른 테스트 변경 영향
})
```

#### 출처
- 원본: react-testing-library
- 파일: `act.js:6-11`, `cleanup.js:8-17`, `end-to-end.js:29-53`
- 채택 점수: 9/10

---

### 4.11 jest.fn() spy 의미있는 네이밍 [CODE-011]

**jest.fn()으로 생성한 spy는 역할을 나타내는 의미있는 이름을 사용합니다.**

```
MUST: spy 이름은 역할/동작을 표현 (effectCb, handleChange, onSubmit 등)
SHOULD: 범용 spy는 spy 이름 사용 가능

MUST NOT: fn1, fn2 등 무의미한 이름
MUST NOT: jest.fn()을 익명으로 직접 전달
```

```typescript
// ✅ Good: 의미있는 이름
const effectCb = jest.fn()
const handleChange = jest.fn()
const onUncaughtError = jest.fn()

// ✅ Good: 범용 spy
const spy = jest.fn()
```

```typescript
// ❌ Bad: 무의미한 이름
const fn1 = jest.fn()
const fn2 = jest.fn()

// ❌ Bad: 익명 spy
React.useEffect(jest.fn())
```

#### 출처
- 원본: react-testing-library
- 파일: `act.js:5`, `events.js:208`, `cleanup.js:5`
- 채택 점수: 10/10

---

### 4.12 expect().toThrow() 에러 검증 [CODE-012]

**에러 발생을 검증할 때는 try-catch 대신 expect().toThrow()를 사용합니다.**

```
MUST: 동기 에러는 expect(() => fn()).toThrow() 사용
MUST: 비동기 에러는 expect(() => asyncFn()).rejects.toThrow() 사용
MUST: 에러 메시지 또는 타입 명시

MUST NOT: try-catch로 수동 에러 검증
```

```typescript
// ✅ Good: 동기 에러
expect(() => {
  render(<Thrower />)
}).toThrow('Boom!')

// ✅ Good: 비동기 에러
await expect(() =>
  act(async () => {
    throw new Error('thenable threw')
  })
).rejects.toThrow('thenable threw')

// ✅ Good: 쿼리 실패 검증
expect(() => getByTextInA('Hyde')).toThrow(
  'Unable to find an element with the text: Hyde.'
)
```

```typescript
// ❌ Bad: 수동 try-catch
let error
try {
  render(<Thrower />)
} catch (e) {
  error = e
}
expect(error.message).toBe('Boom!')
```

#### 출처
- 원본: react-testing-library
- 파일: `act.js:50-54`, `error-handlers.js:17-19`, `multi-base.js:26-31`
- 채택 점수: 10/10

---

### 4.13 Assertion 개수 선언 [CODE-013]

**복잡한 테스트나 비동기 테스트에서는 예상 assertion 개수를 선언하여 테스트 완전성을 보장합니다.**

```
SHOULD: 3개 이상 assertion이 있는 복잡한 테스트에서 expect.assertions(N) 사용
SHOULD: 비동기 테스트에서 assertion 누락 방지용으로 사용
SHOULD: 조건부 실행 테스트에서 사용

선택적: 단순한 테스트(assertion 1-2개)에서는 생략 가능
```

```typescript
// ✅ Good: 복잡한 테스트에서 assertion 개수 선언
describe('add', () => {
  it('should add two numbers', () => {
    expect.assertions(3);

    expect(add(6, 4)).toBe(10);
    expect(add(-6, 4)).toBe(-2);
    expect(add(-6, -4)).toBe(-10);
  });
});

// ✅ Good: 비동기 테스트에서 필수
describe('async operations', () => {
  it('should handle promise', async () => {
    expect.assertions(1);

    const result = await fetchData();
    expect(result).toBe('data');
  });
});
```

```typescript
// ⚠️ 선택적: 단순 케이스는 생략 가능
it('should return true', () => {
  expect(fn()).toBe(true);
});
```

#### 출처
- 원본: lodash (QUnit → Jest/Vitest 변환)
- 원본 패턴: `assert.expect(N)`
- 채택 점수: 9/10 (부분 채택)

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

### 6.4 waitFor + Mock 호출 검증 금지 [ANTI-002]

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

### 6.5 Weak Assertion 금지 [ANTI-003]

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

## 7. 데이터 타입별 규칙 [DATA-001]

### 7.1 Date 생성자 월 인덱스 주석 [DATA-001]

**JavaScript Date 객체의 월은 0-based(0=1월, 11=12월)입니다. 이는 흔한 버그의 원인이므로 주석으로 명시합니다.**

```
MUST: Date 생성자 사용 시 월 값에 주석으로 실제 월 명시
SHOULD: 주석 형식은 "// April (month index 3)" 또는 "// 4월 (month=3)"
```

```typescript
// ✅ Good: 월이 0-based임을 명확히 표현
const m = dayjs(new Date(2011, 3, 2, 3, 4, 5, 6)) // April (month index 3)
expect(m.isSame(dayjs(new Date(2011, 2, 2)))).toBe(false, 'month is earlier') // March

// ✅ Good: 테스트 케이스에서 경계값 명시
expect(m.isSame(dayjs(new Date(2011, 0, 1, 0, 0, 0, 0)), 'year'))
  .toBe(true, 'exact start of year') // January 1st
```

```typescript
// ❌ Bad: 3이 March인지 April인지 불명확
const m = dayjs(new Date(2011, 3, 2))
```

#### 출처
- 원본: dayjs
- 파일: `comparison.test.js:13-16`, `display.test.js:54-73`
- 채택 점수: 10/10

---

### 7.2 레퍼런스 구현 동치성 검증 [DATA-002]

**레퍼런스 구현(예: 원본 라이브러리)을 대체하거나 포팅하는 경우, 동일 입력에 동일 출력을 보장하는 테스트를 작성합니다.**

```
MUST: 레퍼런스 구현이 있으면 동일 입력으로 결과 비교
MUST: valueOf(), toString() 등 기본 출력 비교
SHOULD: 엣지 케이스에서도 동치성 검증
```

```typescript
// ✅ Good: moment.js와 동일한 결과 보장
it('Format Year YY YYYY', () => {
  expect(dayjs().format('YY')).toBe(moment().format('YY'))
  expect(dayjs().format('YYYY')).toBe(moment().format('YYYY'))
})

it('Add Time days', () => {
  expect(dayjs().add(1, 'days').valueOf()).toBe(moment().add(1, 'days').valueOf())
})
```

```typescript
// ❌ Bad: 하드코딩된 값만으로 검증 - 정확한 값인지 확신 어려움
it('Format Year', () => {
  expect(dayjs('2011-01-01').format('YYYY')).toBe('2011')
})
```

#### 출처
- 원본: dayjs
- 파일: `display.test.js:15-27`, `get-set.test.js:14-17`, `manipulate.test.js:46-65`
- 채택 점수: 10/10
- 적용 조건: 레퍼런스 구현을 대체/포팅하는 라이브러리

---

### 7.3 불변성(Immutability) 검증 [DATA-003]

**불변성을 보장해야 하는 메서드는 원본 객체가 변경되지 않았음을 명시적으로 검증합니다.**

```
MUST: 불변 메서드 호출 후 원본이 변경되지 않았는지 검증
MUST: valueOf() 또는 동등성 연산자로 원본 불변 확인
SHOULD: 연산 전 원본 복사본 생성하여 비교
```

```typescript
// ✅ Good: 불변성 명시적 검증
it('Immutable Set', () => {
  const dayjsA = dayjs()
  const dayjsB = dayjsA.set('year', 2011)
  expect(dayjsA.valueOf()).not.toBe(dayjsB.valueOf())
})

// ✅ Good: 비교 연산 후 원본 불변 확인
const m = dayjs(new Date(2011, 3, 2, 3, 4, 5, 10))
const mCopy = dayjs(m)
// ... 여러 연산 수행
expect(+m).toEqual(+mCopy, 'operations should not change original')
```

```typescript
// ❌ Bad: 불변성이 깨져도 감지 못함
it('Set year', () => {
  const d = dayjs()
  d.set('year', 2011)
  // 원본이 변경되었는지 확인 안 함
})
```

#### 출처
- 원본: dayjs
- 파일: `get-set.test.js:122-129`, `parse.test.js:126-131`
- 채택 점수: 10/10

---

### 7.4 단위 복수형/단수형 테스트 [DATA-004]

**API가 복수형('days')과 단수형('day')을 모두 지원해야 하는 경우, 두 형태 모두 동작함을 검증합니다.**

```
SHOULD: 복수형과 단수형 모두 테스트
SHOULD: 'plural should work' 등으로 의도 명시
```

```typescript
// ✅ Good: 두 형태 모두 동작 보장
expect(m.isSame(other, 'year')).toBe(true, 'year match')
expect(m.isSame(other, 'years')).toBe(true, 'plural should work')

expect(m.add(1, 'day').valueOf()).toBe(expected)
expect(m.add(1, 'days').valueOf()).toBe(expected, 'plural should work')
```

```typescript
// ❌ Bad: 복수형이 동작하는지 확인 안 됨
expect(m.isSame(other, 'year')).toBe(true)
```

#### 출처
- 원본: dayjs
- 파일: `comparison.test.js:38-40, 52-54, 67-69`
- 채택 점수: 9/10

---

### 7.5 Number: -0 (Negative Zero) 검증 [DATA-005]

**JavaScript에서 -0과 0은 `===`로 비교 시 같지만, 특정 연산에서 다르게 동작합니다. 숫자 연산 테스트 시 -0 케이스를 명시적으로 검증합니다.**

> **적용 조건**: 숫자 비교, 수학 연산, 배열 비교 함수 테스트 시

```
MUST: -0 검증이 필요한 경우 1/x === -Infinity 트릭 사용
MUST: 테스트명에 -0 케이스 명시
SHOULD: 주석으로 -0 검증 의도 설명

MUST NOT: === 비교로 -0 확인 (-0 === 0 은 true)
```

```typescript
// ✅ Good: -0 검증
describe('clamp', () => {
  it('should not alter -0 in range', () => {
    const result = clamp(-0, -5, 5);
    // -0 검증: 1/-0 === -Infinity
    expect(1 / result).toBe(-Infinity);
  });

  it('should clamp to -0', () => {
    const result = clamp(-10, -0, 5);
    expect(1 / result).toBe(-Infinity);
  });
});

describe('difference', () => {
  it('should treat -0 as 0', () => {
    const array = [-0, 0];

    const actual = array.map(value =>
      difference(array, [value])
    );

    // -0과 0은 동일하게 처리
    expect(actual).toEqual([[], []]);
  });
});
```

```typescript
// ❌ Bad: === 비교로 -0 확인
expect(clamp(-0, -5, 5)).toBe(-0); // -0 === 0 이므로 실패
```

#### 출처
- 원본: lodash
- 파일: `test.js:2651-2661`, `test.js:4913-4926`
- 채택 점수: 9/10

---

### 7.6 Number: NaN 검증 [DATA-006]

**NaN은 자기 자신과 같지 않으므로(`NaN !== NaN`) 특수한 검증 방법이 필요합니다.**

> **적용 조건**: 숫자 연산, 타입 변환, 배열 비교 함수 테스트 시

```
MUST: NaN 검증 시 toBeNaN() 사용
MUST: NaN 동작을 테스트하는 케이스 포함
SHOULD: 배열에서 NaN 매칭 동작 검증

MUST NOT: toBe(NaN) 사용 (항상 실패)
```

```typescript
// ✅ Good: NaN 검증
describe('clamp', () => {
  it('should return NaN when number is NaN', () => {
    expect(clamp(NaN, -5, 5)).toBeNaN();
  });

  it('should coerce min and max of NaN to 0', () => {
    expect(clamp(1, -5, NaN)).toBe(0);
    expect(clamp(-1, NaN, 5)).toBe(0);
  });
});

describe('difference', () => {
  it('should match NaN', () => {
    // NaN은 자기 자신과 같지 않지만 배열에서 매칭되어야 함
    expect(difference([1, NaN, 3], [NaN, 5, NaN])).toEqual([1, 3]);
  });
});

describe('divide', () => {
  it('should return NaN for non-numeric values', () => {
    expect(divide('x', 'y')).toBeNaN();
  });
});
```

```typescript
// ❌ Bad: toBe(NaN) 사용
expect(divide('x', 'y')).toBe(NaN); // NaN !== NaN 이므로 항상 실패
```

#### 출처
- 원본: lodash
- 파일: `test.js:2663-2674`, `test.js:4928-4932`
- 채택 점수: 10/10

---

### 7.7 Number: Infinity 경계값 테스트 [DATA-007]

**숫자 범위를 다루는 함수는 Infinity와 -Infinity 경계값을 테스트합니다.**

> **적용 조건**: 숫자 범위, 크기, 인덱스를 다루는 함수 테스트 시

```
MUST: 숫자 범위 함수에서 Infinity, -Infinity 케이스 테스트
MUST: 경계값 처리 동작 명시적 검증
SHOULD: Infinity와 유한 값을 함께 테스트하는 배열 사용

MUST NOT: Infinity 케이스 누락
```

```typescript
// ✅ Good: Infinity 경계값 테스트
describe('clamp', () => {
  it('should clamp -Infinity to lower bound', () => {
    expect(clamp(-Infinity, -5, 5)).toBe(-5);
  });

  it('should clamp Infinity to upper bound', () => {
    expect(clamp(Infinity, -5, 5)).toBe(5);
  });
});

describe('drop', () => {
  it('should return full array for negative or zero n', () => {
    [0, -1, -Infinity].forEach(n => {
      expect(drop([1, 2, 3], n)).toEqual([1, 2, 3]);
    });
  });

  it('should return empty array for large n', () => {
    [3, 4, Math.pow(2, 32), Infinity].forEach(n => {
      expect(drop([1, 2, 3], n)).toEqual([]);
    });
  });
});
```

```typescript
// ❌ Bad: Infinity 케이스 누락
describe('clamp', () => {
  it('should clamp numbers', () => {
    expect(clamp(10, -5, 5)).toBe(5);
    // Infinity 케이스 누락
  });
});
```

#### 출처
- 원본: lodash
- 파일: `test.js:2612-2620`, `test.js:5103-5111`
- 채택 점수: 10/10

---

### 7.8 Number: Large Array 최적화 경계 테스트 [DATA-008]

**배열이나 컬렉션을 다루는 함수는 대용량 데이터에서의 동작을 테스트합니다.**

> **적용 조건**: 배열, 컬렉션, 반복 연산을 다루는 함수 테스트 시

```
MUST: 대용량 배열 크기를 상수로 정의 (예: LARGE_ARRAY_SIZE = 200)
SHOULD: 대용량 배열에서 엣지 케이스(-0, NaN) 동작 검증
SHOULD: Array.fill(), Array.from() 등 네이티브 메서드로 테스트 데이터 생성

MUST NOT: 매직 넘버로 배열 크기 지정
```

```typescript
// ✅ Good: 대용량 배열 테스트
const LARGE_ARRAY_SIZE = 200;

describe('difference', () => {
  it('should work with large arrays', () => {
    const array1 = Array.from({ length: LARGE_ARRAY_SIZE + 1 }, (_, i) => i);
    const array2 = Array.from({ length: LARGE_ARRAY_SIZE }, (_, i) => i);
    const a = {}, b = {}, c = {};

    array1.push(a, b, c);
    array2.push(b, c, a);

    expect(difference(array1, array2)).toEqual([LARGE_ARRAY_SIZE]);
  });

  it('should work with large arrays of -0 as 0', () => {
    const array = [-0, 0];

    const actual = array.map(value => {
      const largeArray = Array(LARGE_ARRAY_SIZE).fill(value);
      return difference(array, largeArray);
    });

    expect(actual).toEqual([[], []]);
  });

  it('should work with large arrays of NaN', () => {
    const largeArray = Array(LARGE_ARRAY_SIZE).fill(NaN);
    expect(difference([1, NaN, 3], largeArray)).toEqual([1, 3]);
  });
});
```

```typescript
// ❌ Bad: 매직 넘버 사용
it('should work with large arrays', () => {
  const largeArray = Array(200).fill(value); // 200이 뭔지?
});
```

#### 출처
- 원본: lodash
- 파일: `test.js:10`, `test.js:4934-4971`
- 채택 점수: 10/10

---

## 8. Self-Check [CHECK-001]

테스트 코드 작성 완료 후 다음 항목을 검증한다:

### 8.1 구조 검증

```
□ GWT 패턴이 명확히 구분되어 있는가?
□ 각 테스트가 단일 동작만 검증하는가?
□ describe가 테스트 대상과 상황을 명시하는가?
□ it이 "[동작] 시 [결과]" 형식인가?
□ describe 중첩이 2단계 이하인가?
□ 테스트 데이터가 상수로 정의되어 있는가?
□ 중복되는 케이스는 map 패턴으로 처리했는가?
□ 동일 로직 다중 조건 테스트 시 describe.each를 사용했는가?
□ 테스트 특화 컴포넌트가 테스트 내부에 정의되어 있는가?
```

### 8.2 격리 검증

```
□ beforeEach에서 mock이 초기화되는가?
□ 테스트 간 변수 공유가 없는가?
□ 전역 상태 오염이 없는가?
□ 테스트 순서에 관계없이 통과하는가?
□ beforeEach/afterEach가 대칭 구조를 유지하는가?
□ console spy, timer mock이 복원되는가?
```

### 8.3 Mock 검증

```
□ 외부 경계만 Mock했는가?
□ 내부 구현을 Mock하지 않았는가?
□ 테스트 대상 자체를 Mock하지 않았는가?
□ Mock 호출 검증이 정확한가?
□ jest.fn() spy에 의미있는 이름을 부여했는가?
□ 에러 검증 시 toThrow()를 사용했는가?
```

### 8.4 안정성 검증

```
□ 타이밍에 의존하지 않는가?
□ 랜덤/비결정적 값이 고정되어 있는가?
□ 네트워크 요청이 Mock되어 있는가?
□ 반복 실행해도 동일한 결과가 나오는가?
```

### 8.5 숫자/배열 함수 검증 (해당 시)

```
□ -0 케이스를 검증했는가? (1/x === -Infinity 트릭)
□ NaN 케이스를 검증했는가? (toBeNaN() 사용)
□ Infinity/-Infinity 경계값을 검증했는가?
□ 대용량 배열 케이스를 검증했는가? (LARGE_ARRAY_SIZE)
```
