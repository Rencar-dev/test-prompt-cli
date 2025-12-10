<!-- Source: ui-test-implementation-prompt.md -->
# ui-test-implementation-prompt.md
(Frontend UI Integration Test Prompt — React Testing Library 기반)

---

## 0. 역할 정의

당신은 **Frontend SDET (Software Development Engineer in Test)**이다.

목표는 **UI/사용자 상호작용/상태 변화/데이터 흐름**을 검증하는 것이다.  
**렌더링 + Interaction + Router 단위 통합 테스트**를 작성한다.

> ❗️단위 로직 테스트(순수 비즈니스 로직)는 이 프롬프트에서 금지
> → `business-logic-test-prompt.md` 사용

**📘 공통 규칙 참조**: 이 프롬프트는 `test-coding-conventions.md`와 함께 사용됩니다.
공통 규칙에 포함된 내용 (Mock 결정 플로우차트, waitFor 규칙, Element Selector Priority, Fake Timer 등)은
이 문서에서 중복 기술하지 않습니다. 아래는 **UI 테스트에 특화된 규칙**만 기술합니다.

---

## 1. 적용 범위

UI 테스트는 아래 범위를 포함한다:

- 사용자의 입력/클릭/탭/제출/포커스
- 화면에 보이는 상태(텍스트, 버튼 활성/비활성, 에러 메시지 등)
- Validation 에러 노출
- Router 이동/리다이렉트에 따른 화면 변화
- Form 동작 (submit, reset 등)
- API 응답 처리(성공/실패)에 따른 UI 변화
- Hook + UI 조합(페이지·컨테이너 컴포넌트)

### 1.1 ATDD 시나리오 100% 구현 원칙 (Critical)

- **모든 시나리오 구현 필수**: 제공된 ATDD 파일의 P0, P1, P2, P3 모든 시나리오를 빠짐없이 구현한다.
- **임의 생략 금지**: "시간 관계상 생략", "중요하지 않음" 등의 이유로 테스트를 건너뛰지 않는다.
- **예외**: `[Unit]`으로 명시된 시나리오는 이 프롬프트 범위가 아니므로 제외한다.

---

## 2. 절대 포함 금지 항목 정의

- ❌ Snapshot Test
- ❌ DOM 구조 자체 검증(`firstChild`, `innerHTML` 등)
- ❌ private 구현 검증(내부 변수, 내부 helper 직접 테스트)
- ❌ CSS/스타일/픽셀 비교 (className, style 등)
  - ATDD에 색상/여백/간격이 언급돼도 className/style 단언 금지. 상태/로직을 검증하거나 시나리오에서 제외하라.
- ❌ 순수 비즈니스 로직 검증(= utils 테스트)
- ❌ **Inline Type Import (`import()`)**:
  - `vi.importActual<typeof import('./store')>` 형태 금지 (ESLint 에러)
  - 대신 상단에 `import type`을 선언하고 사용한다.

### 2.1 UI 테스트 전용 Mocking 규칙 (Critical)

> **공통 Mock 규칙** (Mock 결정 플로우차트, Mock하지 말아야 하는 것, Vitest hoisting 등)은
> `test-coding-conventions.md`를 참조하세요. 아래는 **UI 테스트에서 추가로 필요한 Mock**입니다.

#### 2.1.1 Mock해야 하는 것 (UI 테스트 전용)

**브라우저 API (필수 Mock):**

```typescript
// ✅ localStorage / sessionStorage Mock (필수)
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
});

// ✅ window.location Mock (필수)
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

// ✅ window.open Mock (필수)
window.open = vi.fn();

// ✅ window.scrollTo Mock (필수)
window.scrollTo = vi.fn();
```

**라우터 훅 (필수 Mock):**

```typescript
// ✅ Next.js Router Mock
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ✅ React Router Mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
}));
```

#### 2.1.2 간접 의존성 체크리스트 (Critical)

**자식 컴포넌트의 의존성도 반드시 확인하라.**

**체크리스트:**
- [ ] 테스트 대상 컴포넌트가 직접 사용하는 모든 store/hook을 Mock에 포함했는가?
- [ ] 테스트 대상 컴포넌트가 렌더링하는 자식 컴포넌트들을 확인했는가?
- [ ] 각 자식 컴포넌트가 사용하는 store/hook을 확인하고 Mock에 포함했는가?
- [ ] `renderWithProviders`로 렌더링되는 모든 컴포넌트의 의존성을 확인했는가?
- [ ] Tailwind CSS 같은 스타일 라이브러리는 Mock하지 않았는가? (렌더링에 영향 없음)

**예시:**
```typescript
// LoginPage.tsx
<FullScreenContainer>  // ← 자식 컴포넌트
  <LoginForm />
</FullScreenContainer>

// FullScreenContainer.tsx (자식 컴포넌트)
const { setIsFullScreenContainerUsed } = useFullScreenContainerStore([...]);
// ↑ 이 store도 Mock에 포함해야 함!
```

---

### 2.2 Low ROI Testing (비용 대비 효과가 낮은 테스트 금지)

유지보수 비용 대비 효과가 낮은 다음 항목은 **절대 테스트하지 마시오**:

❌ **단순 정적 텍스트 존재 여부**:
- 변하지 않는 타이틀, 라벨, 버튼 텍스트가 화면에 있는지 `expect(getByText('제목'))` 하지 말 것
- **예외**: 사용자 행동에 따라 **동적으로 변하는 에러 메시지, 경고 메시지**는 검증 필수

❌ **렌더링 자체 성공 여부**:
- "컴포넌트가 에러 없이 렌더링된다" 같은 무의미한 Smoke Test 금지

❌ **단순 조건부 렌더링**:
- "로그인하면 A가 보이고, 로그아웃하면 B가 보인다" 같은 단순 `isLoggedIn ? A : B` 검증
- **이유**: 이런 건 컴파일 타임에 이미 검증됨

**핵심 원칙**:
👉 **오직 "사용자 행동(Interaction) → 상태 변화(State Change) → UI 결과(Outcome)"만 검증하시오.**

이 프롬프트는 어디까지나 **"사용자 관점의 UI 동작"**만 테스트한다.

---

### 2.3 Functional Page Object Model (POM) 패턴 (Critical)

> **목적**: UI 변경 시 테스트 유지보수 비용을 획기적으로 줄이고, 테스트 코드의 재사용성을 높인다.

#### 2.3.1 POM 패턴 핵심 원칙

**선택자(Selector)와 행위(Action)를 분리하라.**

- ❌ **Bad**: `test()` 블록 내부에 구현 세부사항(선택자, DOM 구조)이 노출됨
```typescript
test('로그인 성공 시나리오', async () => {
  const usernameInput = screen.getByRole('textbox', { name: /아이디/ });
  const passwordInput = screen.getByLabelText('비밀번호');
  const submitButton = screen.getByRole('button', { name: '로그인' });
  
  await user.type(usernameInput, 'testuser');
  await user.type(passwordInput, 'password123');
  await user.click(submitButton);
  
  expect(screen.getByText('환영합니다')).toBeInTheDocument();
});
```

- ✅ **Good**: `test()` 블록에는 비즈니스 행위만 드러나고, 구현은 Page Object로 분리됨
```typescript
// Page Object (테스트 파일 상단 또는 별도 파일)
const loginPage = {
  elements: {
    getUsernameInput: () => screen.getByRole('textbox', { name: /아이디/ }),
    getPasswordInput: () => screen.getByLabelText('비밀번호'),
    getSubmitButton: () => screen.getByRole('button', { name: '로그인' }),
    getWelcomeMessage: () => screen.getByText('환영합니다'),
  },
  
  actions: {
    async login(username: string, password: string) {
      await user.type(this.elements.getUsernameInput(), username);
      await user.type(this.elements.getPasswordInput(), password);
      await user.click(this.elements.getSubmitButton());
    },
  },
};

// Test
test('로그인 성공 시나리오', async () => {
  // Given
  render(<LoginPage />);
  
  // When
  await loginPage.actions.login('testuser', 'password123');
  
  // Then
  expect(loginPage.elements.getWelcomeMessage()).toBeInTheDocument();
});
```

#### 2.3.2 POM 구조 가이드

**1. Elements (요소 정의)**
```typescript
const somePage = {
  elements: {
    // ✅ Good: 함수로 정의 (매번 새로운 요소 찾기)
    getUsernameInput: () => screen.getByRole('textbox', { name: /아이디/ }),
    
    // ❌ Bad: 변수로 정의 (stale reference 위험)
    usernameInput: screen.getByRole('textbox', { name: /아이디/ }),
  },
};
```

**2. Actions (행위 정의)**
```typescript
const somePage = {
  elements: { /* ... */ },
  
  actions: {
    // ✅ 조립 가능한 액션 단위로 분리
    async fillUsername(username: string) {
      await user.type(this.elements.getUsernameInput(), username);
    },
    
    async fillPassword(password: string) {
      await user.type(this.elements.getPasswordInput(), password);
    },
    
    async clickSubmit() {
      await user.click(this.elements.getSubmitButton());
    },
    
    // ✅ 복합 액션 (재사용 가능)
    async login(username: string, password: string) {
      await this.fillUsername(username);
      await this.fillPassword(password);
      await this.clickSubmit();
    },
  },
};
```

**3. Assertions (검증 헬퍼) - 선택사항**
```typescript
const somePage = {
  elements: { /* ... */ },
  actions: { /* ... */ },
  
  assertions: {
    expectWelcomeMessage() {
      expect(this.elements.getWelcomeMessage()).toBeInTheDocument();
    },
    
    expectErrorMessage(message: string) {
      expect(screen.getByRole('alert')).toHaveTextContent(message);
    },
  },
};
```

#### 2.3.3 POM 적용 시 Self-Check

**구현 전 체크리스트:**
- [ ] `test()` 블록 내부에 `screen.getBy*`, `user.click` 등의 **직접 호출**이 없는가?
- [ ] 모든 선택자가 Page Object의 `elements`에 정의되어 있는가?
- [ ] 반복되는 액션(로그인, 폼 제출 등)이 `actions`으로 추출되어 있는가?
- [ ] 여러 테스트에서 동일한 Page Object를 재사용할 수 있는가?
- [ ] UI 텍스트가 변경되어도 **Page Object만 수정**하면 되는가?

#### 2.3.4 POM 예외 사항

**다음의 경우 POM을 강제하지 않는다:**
- 한 번만 사용되는 단순한 단언문 (예: `expect(screen.getByText('저장 완료')).toBeInTheDocument()`)
- 테스트 파일이 매우 짧고 재사용 가능성이 낮은 경우

**그러나**, 3개 이상의 `test()` 블록에서 동일한 선택자/액션을 사용한다면 **반드시 POM으로 추출**해야 한다.

---

## 3. 입력 데이터 수집 (Input Data)

아래 정보가 프롬프트 하단에 제공됩니다.

### 3.1 필수 입력 확보
1. **ATDD 시나리오** 또는 **Test Plan**
2. **테스트 대상 소스 코드** (페이지/컴포넌트/폼)
3. **project-manifest.yaml**
4. **✨ Dependency Context (필수)**: 테스트 대상이 의존하는 **타입/인터페이스/Enum/상수 파일** 내용
   - 예: `types/User.ts`, `constants/ErrorCode.ts`, `hooks/useAuth/types.ts`
   - **목적**: AI가 필드명(`user.type` vs `user.userType`)이나 Enum 값(`'premium'` vs `'PREMIUM'`)을 추측(Hallucination)하지 않고 정확한 Mock 데이터를 생성하기 위함
   - **권장 형식**:
     ```markdown
     ## Dependency Context

     ### types/User.ts
     ```typescript
     export interface User {
       id: number;
       username: string;
       userType: 'PREMIUM' | 'BASIC'; // AI가 이 값을 정확히 사용
     }
     ```

     ### constants/ErrorCode.ts
     ```typescript
     export const ERROR_CODE = {
       AUTH_FAILED: 101,
       INVALID_USER: 102,
     } as const;
     ```
     ```

**⚠️ Dependency Context가 없으면**:
- AI가 `user.isVip` vs `user.is_vip` vs `user.vipStatus` 같은 필드명을 임의로 추측
- Mock 데이터 구조가 실제 타입과 불일치하여 TypeScript 에러 발생
- 테스트 실행 시 런타임 에러 발생 가능

[참조 문서: 실행 및 환경 가이드] (Critical)
<<<
{{EXECUTION_GUIDE}}
>>>

[Lessons Learned: 오답노트] (Critical - 반드시 준수)
<<<
{{LESSONS_LEARNED}}
>>>

[Test Plan]
<<<
{{PLAN_CONTENT}}
>>>

[프로젝트 설정]
<<<
```yaml
{{MANIFEST}}
```
>>>

[코드]
<<<
{{SOURCE_CODE}}
>>>

[대상 기능의 소스 파일 경로]
<<< {{SOURCE_PATH}} >>>

### 3.2 Missing Context Handling
만약 필요한 타입/상수/의존성 정보가 아래에 제공되지 않았다면:
- **Local LLM (Cursor, Copilot 등)**: 파일 읽기 권한을 사용하여 해당 경로의 파일을 직접 읽으십시오.
- **Chat Interface**: 내용을 추측(Hallucination)하지 말고, 사용자에게 관련 파일의 내용을 요청하십시오.

---

### 3.3 입력 데이터 상세

아래 규칙에 따라 데이터가 제공됩니다.

#### 3.3.1 대상 UI 컴포넌트 전체 코드

- 테스트할 페이지/뷰/컨테이너 컴포넌트의 전체 소스 코드
- 의존하는 hooks / stores / provider 코드 (또는 경로)
- **Import 경로 규칙 (Strict)**:
  - **Alias Import (`@/...`)**: 소스 코드의 경로를 **100% 그대로 복사**한다. (절대 경로이므로 수정 불필요)
  - **Relative Import (`./`, `../`)**:
    - 테스트 파일 위치(`__tests__`)에 맞춰 **깊이(Depth)를 조정**한다. (예: `../` → `../../`)
    - ❌ **절대 금지**: 상대 경로를 **임의로 Alias(`@/`)로 바꾸지 말 것.** (Hallucination의 주범)
    - **원칙**: "경로의 형태(Alias vs Relative)"는 소스 코드와 동일하게 유지하되, 상대 경로의 깊이만 맞춘다.

> **Note**: 간접 의존성(자식 컴포넌트가 사용하는 store/hook) 확인은 위 섹션 2.2.2 참조

#### 3.3.2 Zustand Store 초기화 규칙 (Critical)

**Zustand store를 `setState`로 초기화할 때, 두 번째 인자를 `true`로 전달하면 모든 메서드가 사라진다.**

**문제 이해**:
- Zustand의 `setState(state, true)`에서 두 번째 인자 `true`는 "전체 교체" 모드
- 기존 state를 완전히 덮어쓰므로 **store의 모든 메서드가 삭제됨**
- 결과: `TypeError: setUser is not a function`, `TypeError: setCompanyId is not a function`

**❌ Bad Pattern (메서드 손실)**:
```typescript
beforeEach(() => {
  userStore.setState({ user: null, isLogin: null }, true);
  // ← true = "전체 교체" → setUser, setIsLogin 등 모든 메서드 삭제됨!
  // 렌더링 시 useAuth가 setCompanyId 호출 → TypeError 발생
});

// 결과:
// TypeError: setUser is not a function
// TypeError: setCompanyId is not a function
// DOM 렌더링 실패 → <body><div /></body>
```

**✅ Good Pattern 1 (두 번째 인자 생략 - 권장)**:
```typescript
beforeEach(() => {
  // 두 번째 인자 생략 = 기본값 false = 병합 모드
  userStore.setState({ user: null, isLogin: null, companyId: null });
  loadingStore.setState({ isLoading: false });
  alertStore.setState({ alerts: [] });
  // 메서드는 그대로 유지됨 ✅
});
```

**✅ Good Pattern 2 (getState 활용 - 더 안전)**:
```typescript
beforeEach(() => {
  // 현재 state 가져오기 (메서드 포함)
  const currentState = userStore.getState();
  
  userStore.setState({
    ...currentState,
    user: null,
    isLogin: null,
    companyId: null,
  });
  // 메서드는 spread로 보존됨 ✅
});
```

**규칙**:
- `setState`의 **두 번째 인자는 절대 사용하지 않는다**
- Store 초기화는 **부분 업데이트**로만 수행
- 의심스러우면 beforeEach 후 `getState()`로 메서드 존재 확인

**Self-Check**:
- [ ] `setState`의 두 번째 인자를 사용하지 않았는가?
- [ ] beforeEach에서 store를 초기화했는가?
- [ ] 초기화 후 store 메서드가 정상 동작하는가?

#### 3.3.3 Test Helper 함수 규칙

**테스트에서 반복되는 패턴은 Helper 함수로 추출하되, 명확한 네이밍을 사용한다.**

**네이밍 컨벤션**:
- **동사로 시작**하여 행위를 명확히 표현
- **구체적인 동작**을 설명
- 모호한 동사 피하기

**✅ Good Naming**:
```typescript
// 명확한 동사 + 대상
const enterCredentials = async (user, { id, password }) => { ... };
const clickLoginButton = async (user) => { ... };
const waitForNavigation = async (route) => { ... };
const selectDropdownOption = async (user, optionName) => { ... };
```

**❌ Bad Naming**:
```typescript
// 모호한 동사
const fillCredentials = async (user, id, pw) => { ... };  // fill은 모호
const doLogin = async (user) => { ... };                  // do는 불명확
const testLogin = async () => { ... };                     // test는 중복
const handleSubmit = async () => { ... };                  // handle은 구현 용어
```

**매개변수 패턴**:
```typescript
// ✅ 옵션 객체 사용 (확장성)
const enterCredentials = async (
  user: ReturnType<typeof userEvent.setup>,
  { id = 'test-id', password = 'test-pw' } = {},
) => { ... };

// ❌ 위치 기반 매개변수 (확장 어려움)
const enterCredentials = async (user, id = 'default', pw = 'default') => { ... };
```

**Self-Check:**
- [ ] Helper 함수명이 동사로 시작하는가?
- [ ] 함수명만 보고 무엇을 하는지 명확한가?
- [ ] 옵션 객체를 사용하여 확장 가능한가?

#### 3.3.4 렌더링 검증 규칙 (Critical)

**모든 테스트는 Given 단계 직후 기본 UI가 렌더링되었는지 검증한다.**

**이유**:
- Mock 설정이 잘못되면 DOM이 렌더링되지 않음
- Store 초기화 오류로 컴포넌트가 에러를 발생시키면 빈 화면 렌더링
- 빈 화면 상태에서 `getByX` 호출 시 모든 테스트가 `Unable to find element` 에러*
- 이른 검증으로 문제를 빠르게 발견

**❌ Bad Pattern (렌더링 미검증)**:
```typescript
it('[S1] 로그인 성공', async () => {
  // Given
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);
  
  // When: 바로 상호작용 시도 (렌더링 확인 없음!)
  await user.type(screen.getByPlaceholderText('아이디'), 'test');
  // ← 여기서 에러: Unable to find element with placeholder "아이디"
  // ← 실제 원인: Store Mock 오류로 DOM이 <body><div /></body>만 렌더링됨
});
```

**✅ Good Pattern (렌더링 검증)**:
```typescript
it('[S1] 로그인 성공', async () => {
  // Given: 로그인 페이지를 연다
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);
  
  // ✅ 렌더링 검증: 기본 UI 확인
  expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  // ← 이 검증이 실패하면 즉시 Mock 설정을 의심
  
  // When: 검증 후 상호작용
  await user.type(screen.getByPlaceholderText('아이디'), 'test');
});
```

**렌더링 검증 위치**:
```typescript
it('[S1] 시나리오', async () => {
  // Given
  const user = userEvent.setup();
  renderWithProviders(<Page />);
  
  // ✅ 여기! renderWithProviders 직후
  expect(screen.getByRole('heading', { name: '제목' })).toBeInTheDocument();
  
  // When: 이제 안전하게 상호작용
  await user.click(...);
});
```

**규칙**:
- `renderWithProviders` 직후 **최소 1개 이상의 기본 요소** 검증
- Form 테스트: input, button 검증
- List 테스트: 제목, 빈 상태 또는 첫 항목 검증
- 검증 실패 시 beforeEach의 Store 초기화부터 확인

**Self-Check**:
- [ ] renderWithProviders 직후 기본 UI를 검증했는가?
- [ ] `toBeInTheDocument()`로 존재 여부를 확인했는가?
- [ ] 검증 실패 시 즉시 Mock 설정을 의심할 수 있는가?

### 3.4 Store Mock 완전성 체크리스트

**테스트 대상이 사용하는 모든 Store 메서드를 확인한다.**

**절차**:
1. 테스트 대상 컴포넌트/Hook이 import하는 Store 확인
2. 각 Store에서 호출하는 메서드 목록 작성 (소스 코드 읽기)
3. beforeEach에서 resetStores 후 메서드 타입 확인

**예시 (LoginPage 테스트)**:
```typescript
// 1. LoginPage가 사용하는 Hook: useAuth
// 2. useAuth가 사용하는 Store 메서드:
//    - useUserStore: setUser, setIsLogin, setCompanyId
//    - useOrdererStore: setOrderers
//    - useLoadingStore: showLoading, hideLoading
//    - useAlertStore: showAlert

describe('LoginPage', () => {
  beforeEach(() => {
    resetStores();
    resetRouterMocks();
    
    // ✅ 메서드가 함수인지 확인
    expect(typeof userStore.getState().setCompanyId).toBe('function');
    expect(typeof userStore.getState().setUser).toBe('function');
    expect(typeof userStore.getState().setIsLogin).toBe('function');
    expect(typeof orderer Store.getState().setOrderers).toBe('function');
    // ← 만약 여기서 실패하면 resetStores 구현 확인
  });
  
  it('[S1] ...', () => { ... });
});
```

**메서드 확인이 중요한 이유**:
```typescript
// ❌ Bad: resetStores에서 메서드 손실
userStore.setState({ user: null }, true);  // 두 번째 인자 true!
// → setCompanyId가 undefined가 됨

// useAuth 내부에서:
useEffect(() => {
  setCompanyId(ordererInfo.defaultInfo?.companyId);  
  // TypeError: setCompanyId is not a function ❌
}, [ordererInfo]);

// 결과: 렌더링 실패 → DOM이 빈 상태
```

**규칙**:
- 테스트 대상이 사용하는 모든 Store를 나열
- 각 Store에서 호출하는 메서드를 모두 확인
- beforeEach 후 메서드 타입이 `'function'`인지 검증
- 검증 실패 시 resetStores에서 `setState(..., true)` 사용 여부 확인

**Self-Check**:
- [ ] 테스트 대상이 사용하는 모든 Store를 확인했는가?
- [ ] 각 Store에서 호출하는 메서드를 모두 나열했는가?
- [ ] beforeEach 후 메서드 타입이 'function'인지 검증했는가?
- [ ] resetStores에서 setState의 두 번째 인자를 사용하지 않았는가?

### 3.5 Hook 내부 구현 확인 (Critical)

**Mocking 여부를 결정하기 전에, 해당 Hook이 API 통신을 수행하는지 반드시 소스 코드를 읽어 확인하라.**

- **확인 절차**:
  1. 컴포넌트가 사용하는 Custom Hook의 파일을 연다. (예: `useAuth.ts`)
  2. 내부에서 `useMutation`, `useQuery`, `fetch`, `axios` 등을 사용하는지 검색한다.
  3. **API 통신이 포함된 경우**: 절대 Mocking 하지 말고, MSW를 사용한다.
  4. **순수 계산/로직인 경우**: **원칙적으로 Mocking 하지 않고 실제 코드를 사용한다.** (단, `timer`, `navigator` 등 제어 불가능한 요소가 있는 경우만 예외)

- **Self-Check**:
  - [ ] `useAuth` 내부 코드를 확인했는가? (`useMutation` 사용 여부)
  - [ ] `usePayment` 내부 코드를 확인했는가?

### 3.6 Store 상태 검증 (Critical)

**UI 상으로 직접 드러나지 않는 Store의 상태 변화도 검증해야 한다.**

- **목표**: 사용자 상호작용 후, UI에는 직접적인 변화가 없지만, 내부 Store의 상태가 올바르게 업데이트되었는지 확인한다.
- **방법**: `vi.spyOn` 또는 `vi.mock`을 사용하여 Store의 특정 액션 또는 셀렉터를 Mocking하고, 호출 여부 및 인자를 검증한다.

**예시:**
```typescript
// Given: 특정 스토어의 액션을 스파이
const setItemSpy = vi.spyOn(useCartStore.getState(), 'setItem');

// When: 사용자가 상품을 장바구니에 추가
await userEvent.click(screen.getByRole('button', { name: /장바구니 추가/i }));

// Then: 스토어의 setItem 액션이 올바른 인자와 함께 호출되었는지 검증
expect(setItemSpy).toHaveBeenCalledWith({ productId: 'P123', quantity: 1 });
```

**Self-Check:**
- [ ] 사용자 상호작용 후, UI에 직접적인 변화는 없지만 Store 상태가 변경되는 시나리오가 있는가?
- [ ] 해당 Store의 액션 또는 셀렉터를 스파이/모킹하여 상태 변화를 검증했는가?
- [ ] 스파이/모킹된 함수가 올바른 인자와 함께 호출되었는지 확인했는가?

### 3.7 초기값 처리 로직 검증 (Critical)

**시나리오와 실제 구현의 불일치를 반드시 확인하라.**

- **초기값 설정 로직 확인**: `useState`, `useEffect`, `useMemo` 등에서 초기값이 어떻게 처리되는지 **실제 소스 코드를 읽어 확인**한다.
- **변환/정규화 로직 확인**: 
  - `trim()`, `toLowerCase()`, `replace()` 등이 초기값에 적용되는가?
  - `onChange`에서만 적용되는가, 아니면 초기 렌더링 시에도 적용되는가?
- **불일치 감지 및 보고**:
  - ATDD 시나리오나 Test Plan에서 "공백 제거", "정규화" 등을 명시했는데 실제 코드에서 적용되지 않으면 **반드시 주석으로 명시**한다.
  - 테스트는 **실제 동작에 맞게 작성**하되, 시나리오와의 불일치를 명확히 표시한다.

**예시:**
```typescript
// ❌ Bad: 시나리오만 보고 추측
expect(screen.getByPlaceholderText('아이디')).toHaveValue('prefillUser');

// ✅ Good: 실제 코드 확인 후 작성
// NOTE: 실제 구현은 useState(initialId ?? '')로 초기값에 trim이 적용되지 않음
// 시나리오는 "공백 제거"를 명시하지만, 실제로는 onChange에서만 trim 적용됨
expect(screen.getByPlaceholderText('아이디')).toHaveValue('  prefillUser  ');
```

**체크리스트:**
- [ ] 초기값을 설정하는 모든 `useState` 호출을 확인했는가?
- [ ] 초기값에 `trim()`, `toLowerCase()` 등의 변환 로직이 적용되는가?
- [ ] `onChange`에서만 변환이 적용되는가, 아니면 초기 렌더링 시에도 적용되는가?
- [ ] ATDD 시나리오/Test Plan의 기대값과 실제 구현이 일치하는가?
- [ ] 불일치가 있다면 테스트 코드에 주석으로 명시했는가?

### 3.8 project-manifest.yaml (필수)

- 테스트 러너 (Vitest / Jest 등)
- 테스트 디렉토리 규칙 (예: `__tests__`, `_tests` 등)
- alias / tsconfig paths
- msw/jest-setup 경로
- next-testing setup 여부

> 제공되지 않았다면 → **임의 추측 금지**  
> 대신 `project-convention-scanner.md` 실행을 요청한다.

### 3.9 (선택) 기존 테스트 예시 1개

- 동일 프로젝트의 기존 RTL 테스트 한 파일을 제공하면
- import, mock, setup 패턴을 그대로 맞춘다.

---

## 4. 출력 요구사항 (테스트 코드 생성)

### 4.1 파일 이름 규칙

```txt
[SourceDir]/[testPaths.dirName]/[Component].test.tsx
```

(참고: `testPaths.dirName`은 `project-manifest.yaml`에서 확인. 예: `_tests`, `__tests__`)

예시 (`dirName: "_tests"`인 경우):

```txt
src/features/login/_tests/LoginView.test.tsx
```

### 4.2 테스트 코드 기본 문법 (Vitest 기준)

```ts
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
```

※ Jest일 경우 `project-manifest.yaml`에 맞춰 import 를 수정한다.

### 4.3 테스트 설명 규칙

- `describe`: 컴포넌트 이름
- `it`: **`[ID] 시나리오 제목`** 형식 준수 (문서 트래킹 목적)
  - **시나리오 제목 유지**: Test Plan에 적힌 제목을 **그대로 사용**하는 것을 원칙으로 한다. (임의로 요약하거나 어색하게 바꾸지 말 것)
  - 예: `it('[S1] 반납 일시와 유류/주행 값을 입력하고 반납 완료를 누르면 제출 요청이 발생한다', ...)`
- **G/W/T 주석 필수 (Zero Tolerance)**:
  - **모든 `it` 블록**에 반드시 `// Given`, `// When`, `// Then` 주석을 포함한다.
  - 각 주석은 **최소 1줄 이상의 한글 설명**을 포함해야 한다.
  - 단순히 "입력", "클릭"만 적지 말고, **상태/조건/의도**를 명확히 기술한다.
  - 예: `// Given: 일반 렌트 계약에서 반납 일시와 유류량·주행거리를 정상적으로 입력한 상태`
  - 예: `// When: 반납 완료 버튼을 클릭하여 제출 요청을 발생시킴`
  - 예: `// Then: 반납 성공 토스트가 표시되고 이전 화면으로 이동함`

```ts
it('[S1] 잘못된 패스워드 입력 시 오류 메시지가 렌더링된다', async () => {
  // Given: 로그인 페이지에 진입하여 초기 상태가 로드됨
  render(<LoginView />, { wrapper: AppProviders });

  // When: 사용자가 잘못된 비밀번호를 입력하고 로그인 버튼을 클릭함
  await userEvent.type(screen.getByLabelText(/비밀번호/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /로그인/i }));

  // Then: 화면에 에러 메시지가 노출됨
  await waitFor(() => expect(screen.getByText(/오류/)).toBeVisible());
});
```

### 4.4 시나리오 분기 처리 규칙 (Critical)

**"또는", "~이면 ~하고, ~이면 ~한다" 같은 조건부 시나리오 처리:**

- 시나리오에 **조건부 분기("또는", "~이면 ~하고")**가 포함된 경우:
  - **각 분기를 별도의 테스트 케이스로 분리**하는 것을 원칙으로 한다.
  - 단일 테스트에서 여러 분기를 검증하는 것은 **비권장**한다.
  - 각 테스트에서 조건값(예: `useConnect`, `isAdditional`)을 **명시적으로 설정**해야 한다.

**예시:**
```
ATDD: "연동 차량이면 주행 평가 페이지로 이동하고, 연동이 아니면 직전 화면으로 돌아간다"
→ S1-1: 연동 차량이 아닌 경우 직전 화면으로 돌아간다
→ S1-2: 연동 차량인 경우 주행 평가 페이지로 이동한다
```

**구현 예시:**
```typescript
// ✅ Good: 분기별로 별도 테스트
it('[S1-1] 연동 차량이 아닌 경우 직전 화면으로 돌아간다', async () => {
  server.use(
    normalContractDetailHandler(
      buildNormalContractDetailResponse({ useConnect: false }), // 명시적 설정
    ),
  );
  // ...
  expect(routerMocks.back).toHaveBeenCalledTimes(1);
});

it('[S1-2] 연동 차량인 경우 주행 평가 페이지로 이동한다', async () => {
  server.use(
    normalContractDetailHandler(
      buildNormalContractDetailResponse({ useConnect: true }), // 명시적 설정
    ),
  );
  // ...
  expect(routerMocks.replace).toHaveBeenCalledWith(...);
});

// ❌ Bad: 단일 테스트에서 여러 분기 검증
it('[S1] 일반 렌트 반납 정보를 제출하면...', async () => {
  // useConnect=false 케이스만 검증하고 useConnect=true 케이스 누락
});
```

**Self-Check:**
- [ ] 시나리오에 "또는", "~이면 ~하고" 같은 조건부 분기가 있는가?
- [ ] 각 분기를 별도 테스트 케이스로 분리했는가?
- [ ] 각 테스트에서 조건값(예: `useConnect`)을 명시적으로 설정했는가?
- [ ] 모든 분기 케이스를 빠짐없이 테스트했는가?

### 4.5 단일 책임 원칙 (Single Action per Test)

- **하나의 테스트에는 하나의 주요 액션만 존재해야 한다.**
- **Anti-Pattern**: "아이디 찾기 버튼 클릭 후 검증" -> "비밀번호 찾기 버튼 클릭 후 검증"을 하나의 `it` 블록에서 수행.
- **Rule**: 서로 독립적인 버튼 클릭이나 플로우는 **반드시 별도의 테스트 케이스(`it`)로 분리**한다.
- 예: `[S9-1] 아이디 찾기 이동`, `[S9-2] 비밀번호 찾기 이동`

---

## 5. UI 테스트 전략

---

### 5.1 초기 렌더 검증

- 필드/버튼/타이틀/placeholder 등이 **기획서/ATDD와 일치하는지** 확인
- 접근성 기반 selector만 사용

```ts
screen.getByRole('textbox', { name: /이메일/ });
screen.getByRole('button', { name: /로그인/ });
```

> ❗ querySelector / test-id / class 기반 selector는 **최후의 수단**  
> 되도록 `role` / `label` / `text` 우선 사용.

**⚠️ 줄바꿈(Multi-line) 텍스트 검증 규칙 (Critical):**

- HTML에서는 줄바꿈(`\n`)이 공백으로 치환되거나 무시될 수 있으므로, **단순 문자열 매칭(`'A\nB'`)은 실패할 확률이 높다.**
- **반드시 Regex(정규식)를 사용**하여 유연하게 검증한다.
- **패턴**: `/텍스트\..*텍스트/s` (문장 끝 마침표는 `\.`로 이스케이프하고, 줄바꿈은 `.*`로 처리)

**예시:**
```typescript
// ❌ Bad: 줄바꿈 문자열 직접 매칭 (HTML 렌더링 시 실패 가능성 높음)
screen.getByText('입력하신 정보와 일치하는 계정이 없습니다.\n로그인 정보를 확인해주세요.');

// ✅ Good: Regex 사용 (마침표는 유지하되, 줄바꿈과 공백에 유연함)
screen.getByText(/입력하신 정보와 일치하는 계정이 없습니다\..*로그인 정보를 확인해주세요/s);
```

**⚠️ 초기값 검증 시 주의사항 (Critical):**

- **실제 소스 코드 확인 필수**: 초기값이 `useState`, `useEffect`, `useMemo` 등에서 어떻게 설정되는지 **반드시 실제 코드를 읽어 확인**한다.
- **변환 로직 확인**: 
  - 초기값에 `trim()`, `toLowerCase()`, `replace()` 등이 적용되는가?
  - `onChange`에서만 적용되는가, 아니면 초기 렌더링 시에도 적용되는가?
- **시나리오와의 불일치 처리**:
  - ATDD 시나리오나 Test Plan에서 "공백 제거", "정규화" 등을 명시했는데 실제 코드에서 적용되지 않으면 **테스트는 실제 동작에 맞게 작성**하되, **주석으로 불일치를 명확히**한다.

**예시:**
```typescript
// Given: 쿼리 파라미터로 전달된 아이디 값을 설정함
routerMocks.searchParams = { id: '  prefillUser  ' };

// When: 로그인 페이지를 렌더링함
renderWithProviders(<LoginPage />);

// Then: 아이디 입력값이 쿼리 파라미터 값으로 자동 채워진다
// NOTE: 실제 구현은 useState(initialId ?? '')로 초기값에 trim이 적용되지 않음
// 시나리오는 "공백 제거"를 명시하지만, 실제로는 onChange에서만 trim 적용됨
expect(screen.getByPlaceholderText('아이디')).toHaveValue('  prefillUser  ');
```

---

### 5.2 Interaction 시나리오

- `userEvent.type` / `click` / `selectOptions` / `tab` 등
- **반드시 사용자 행동 기반으로 UI를 변화**시킨 후 검증한다.

흐름 예시:

1. render
2. userEvent로 입력/클릭
3. UI 변화 (버튼 활성/에러 메시지/다음 단계 표시 등) 검증

---

### 5.3 Form Validation

- blur 후 에러
- submit 후 에러
- valid → 에러 사라짐
- disabled → submit 불가

---

### 5.4 Router 이동

- `push/replace` 호출 여부 자체보다는  
  **이동 결과로 나타나는 UI**(타이틀, 텍스트, 버튼 등)를 검증한다.

> Router mock 호출 횟수/파라미터 검증은 보조 수단이며,  
> 가능하면 "결과 화면이 실제로 렌더되었는지"를 우선 검증한다.

**⚠️ E2E→Integration 시나리오 특별 규칙:**
- ATDD에 `[E2E]` 태그가 붙은 시나리오는 **실제 화면 DOM 렌더링 검증을 하지 않는다.**
- 대신 `router.push/replace/reset` 호출 여부와 파라미터만 검증한다.
- 테스트 코드에 다음 주석을 반드시 포함한다:
  ```tsx
  // (Note): E2E 시나리오이지만 실제 화면 DOM 렌더링 검증은 하지 않고 router 호출만 검증
  expect(routerMocks.replace).toHaveBeenCalledWith(...);
  ```

**⚠️ E2E→Integration 시나리오의 비동기 처리 (Critical):**
- **`waitFor` 사용 필수**: E2E→Integration 시나리오라고 해서 `waitFor`를 사용하지 않는 것은 **잘못된 접근**입니다.
- Router 호출은 **비동기 작업 완료 후** 발생하므로, 반드시 `waitFor`로 기다려야 합니다.
- `flushPromises()`만으로는 충분하지 않습니다. React Query, MSW, 비동기 함수 체인이 모두 완료될 때까지 기다려야 합니다.

**❌ Bad Pattern:**
```typescript
await user.click(loginButton);
await flushPromises();
await flushPromises();
// 비동기 작업이 완료되기 전에 검증 시도 → 실패 가능성 높음
expect(routerMocks.reset).toHaveBeenCalledWith(...);
```

**✅ Good Pattern:**
```typescript
await user.click(loginButton);
// waitFor로 비동기 작업 완료를 기다림
await waitFor(() => {
  expect(routerMocks.reset).toHaveBeenCalledWith(PRIVATE_ROUTES.USER_ONBOARDING, {
    webRouteType: 'replace',
  });
});
```

**비동기 체인 분석 필수:**
- 실제 코드에서 `login()` → `prepareNecessaryData()` → `checkOnboardingMutation.mutateAsync()` → `router.reset()` 같은 **비동기 체인**이 있는지 확인하라.
- 각 단계가 `await`로 연결되어 있다면, 테스트에서도 `waitFor`로 완료를 기다려야 한다.
  ```

---

### 5.5 Data Fixture Strategy (Context-Aware Mocking)

**테스트 코드를 작성하기 전, 이 컴포넌트가 처리해야 할 현실적인 데이터 페르소나 3가지를 먼저 정의하시오.** (Olive Young GMS QA Strategy 참조)

**Example Strategy:**
1. **Happy User:** 모든 필드가 완벽하게 입력된 상태 (정상 케이스)
2. **Edge User:** 이름이 100자이거나, 특수문자가 포함된 상태 (경계값)
3. **Legacy User:** 필수 값이 일부 누락되었으나(구 데이터) 렌더링되어야 하는 상태

**Action:**
- 위 3가지 케이스에 대한 Mock Data 객체(`fixture`)를 테스트 코드 상단에 먼저 선언하고, 이를 활용해 `it` 블록을 작성하시오.
- 단순 `foo`, `bar` 대신 도메인 맥락이 있는 데이터를 사용하시오.

### 5.6 Red Team / Negative Testing (Abuse)

**당신은 Red Team QA 엔지니어입니다.** 기능이 "작동하는지" 확인하는 것보다, **"어떻게 하면 망가뜨릴 수 있을지"**를 고민해야 합니다.

**필수 포함 시나리오:**
1. **Validation Attack:** 입력 필드에 스크립트(`<script>`), 초장문 텍스트, 이모지 등을 입력.
2. **Network Chaos:** API가 500 에러를 뱉거나, 응답이 10초 뒤에 오는(Loading) 상황.
3. **Interaction Spam:** 제출 버튼을 1초에 10번 클릭하는 따닥(Double Submit) 상황.

**검증 목표:**
- 위 상황에서도 UI가 깨지지 않고(Crash Free), 사용자에게 적절한 피드백(Toast/Alert)을 주는지 검증하시오.

---

## 6. async / waitFor 규칙 (Critical)

> 📘 **기본 규칙은 [참조 문서: 실행 및 환경 가이드]의 섹션 5 (waitFor 사용 규칙)을 엄격히 준수하세요.**

### 6.0 UI 테스트 특화 규칙

**핵심 원칙**: `waitFor`는 **UI 상태 변화**를 기다리는 도구이며, Mock 호출 검증용이 아닙니다.

```ts
// ❌ 절대 금지
await waitFor(() => expect(mockFn).toHaveBeenCalled());

// ✅ 올바른 패턴
await userEvent.click(loginButton);

// 1) 비동기: UI 변화 기다리기
await waitFor(() =>
  expect(screen.queryByText('로딩중...')).not.toBeInTheDocument()
);

// 2) 동기: mock 호출 검증
expect(loginApi).toHaveBeenCalledWith({ id: 'user', password: 'pw' });
```

### 6.1 useEffect 데이터 의존성 검증
- `useEffect`로 데이터가 세팅되는 경우, 초기 렌더링 직후에는 값이 없을 수 있다.
- 반드시 `waitFor`를 사용하여 **"데이터가 UI에 반영될 때까지"** 기다린 후 검증한다.

---

## 7. MSW 사용 규칙 (UI 테스트 관점)

### 7.1 MSW Handler URL 규칙 (Critical)

**MSW 핸들러는 반드시 실제 API 요청 URL과 정확히 매칭되어야 한다.**

**문제 상황:**
- axios 인스턴스에 `baseURL`이 설정된 경우, 상대 경로 핸들러(`/auth`)는 절대 URL 요청(`https://api.com/auth`)을 가로채지 못함
- 테스트 실행 시 `[MSW] Warning: intercepted a request without a matching request handler` 경고 발생
- API 호출이 타임아웃되어 테스트 실패

**❌ Bad Pattern (핸들러 미적용)**:
```typescript
// baseURL이 설정된 axios 사용 시 매칭 실패
const loginHandler = http.post('/auth', () => HttpResponse.json({ ... }));
// 실제 요청: POST https://api.example.com/auth
// 핸들러 패턴: /auth
// 결과: 매칭 실패! ❌
```

**✅ Good Pattern (환경변수로 전체 URL 사용)**:
```typescript
// project-manifest.yaml의 apiBaseUrl 또는 환경변수 사용
const API_BASE_URL = process.env.BACKEND_URL || 'https://api.example.com';

const loginHandler = http.post(`${API_BASE_URL}/auth`, () =>
  HttpResponse.json({ accessToken: 'test-token' }),
);
// 실제 요청: POST https://api.example.com/auth
// 핸들러 패턴: https://api.example.com/auth
// 결과: 매칭 성공! ✅
```

**Self-Check:**
- [ ] MSW 핸들러 URL이 실제 API 요청 URL과 정확히 일치하는가?
- [ ] `process.env.BACKEND_URL` 또는 `project-manifest.yaml`의 `apiBaseUrl`을 사용했는가?
- [ ] 테스트 실행 시 `[MSW] Warning: intercepted a request without a matching request handler` 경고가 없는가?
- [ ] 모든 API 요청이 MSW 핸들러에 의해 가로채지는가?

### 7.2 기본 원칙

- **기본 handlers**: 성공/중립 시나리오만 포함  
  (성공 응답, 정상 데이터, 기본 페이지 로딩 등)
- **실패/에러 응답**:  
  → **각 테스트 내부에서 `server.use()`로 override**  
  → 또는 **에러 핸들러를 export 하는 모듈에서 import 해와서 `server.use()`로 적용**

즉:

- ✅ 에러용 handler 파일(`mocks/login/errorHandlers.ts`)은 **존재해도 된다.**
- ❌ 하지만 **전역 server 기본 handlers에 에러 핸들러를 섞어 넣지 않는다.**

### 7.3 Mutation(POST/PUT) 테스트 원칙 (Critical)

- **Mutation Hook 자체를 Mocking 하지 않는다. (절대 금지 🚫)**
  - `useMutation`을 mock하면 `onError`, `onSuccess`, `tryCustomErrorHandling` 등 **실제 에러 처리 로직이 실행되지 않는다.**
  - 대신 **MSW에서 4xx/5xx 에러 응답**을 내려주어, 컴포넌트/Hook이 이를 감지하고 알림을 띄우는지 검증해야 한다.
  - **Bad Case (이렇게 하면 해고감 ❌)**:
    ```ts
    // 절대 금지: Hook을 Mocking해서 mutate 호출만 검증하는 행위
    vi.mock('@/hooks/useCustomMutation', () => ({
      useCustomMutation: () => ({ mutate: vi.fn() })
    }));
    ```
  - 대신 **MSW에서 4xx/5xx 에러 응답**을 내려주어, 컴포넌트/Hook이 이를 감지하고 알림을 띄우는지 검증해야 한다.

- **Side-Effect 조작 절대 금지 (Zero Tolerance)**
  - Mock 구현 내부에서 `mockShowAlert`, `mockToast` 등을 **직접 호출하는 것은 절대 금지**다.
  - **Mock의 역할**: 오직 에러 객체를 던지거나(`throw`), 에러 응답을 반환(`return`)하는 것뿐이다.
  - **App의 역할**: 던져진 에러를 `catch`하거나 응답을 받아 `showAlert`를 호출하는 것은 **전적으로 앱 코드**의 몫이다.
  - ❌ **금지 패턴 (Direct Call Cheating)**:
    ```ts
    // 절대 금지: 테스트가 대신 알림을 띄워주는 행위
    await handler(error);
    mockShowAlert({ content: '중복' }); 
    ```
  - **원칙**: 실제 코드가 알림을 띄우지 않았다면 **테스트는 반드시 실패(Red)해야 한다.** 테스트를 억지로 통과시키지 마라.

- **Custom Error 객체 정밀 Mocking**
  - 에러 발생 시 `RencarError` 등 커스텀 에러 객체를 사용하는 경우, **소스 코드와 동일한 구조**로 Mocking 해야 한다.
  - 단순 `new Error()`가 아니라, 실제 핸들러가 기대하는 속성(status, errorNo, errorFromServer 등)을 정확히 포함시킨다.

---

### 7.4 공통 에러 핸들러 모듈 재사용 패턴

에러 핸들러를 공통 정의하고,  
**테스트 안에서만 가져다 쓰는 패턴**은 적극 권장한다.

```ts
// mocks/login/errorHandlers.ts
import { http, HttpResponse } from 'msw';

export const loginInvalidHandler = http.post('/api/login', async () => {
  return HttpResponse.json(
    { error: 'INVALID_CREDENTIAL' },
    { status: 400 }
  );
});
```

테스트 코드:

```ts
import { server } from '@/tests/server';
import { loginInvalidHandler } from '@/mocks/login/errorHandlers';
import LoginView from '../LoginView';

it('로그인 실패 시 에러 메시지를 노출한다', async () => {
  // 이 테스트에서만 실패 응답을 사용
  server.use(loginInvalidHandler);

  render(<LoginView />, { wrapper: AppProviders });

  // ...
});
```

### 7.5 테스트 내부 ad-hoc override 패턴

간단한 경우에는 테스트 파일 안에서 바로 handler를 정의해도 된다.

```ts
server.use(
  http.post('/api/login', () =>
    HttpResponse.json({ error: 'INVALID_CREDENTIAL' }, { status: 400 })
  )
);
```

두 방식 모두 허용이지만, **여러 테스트에서 같은 실패 케이스를 재사용한다면  
전용 errorHandlers 모듈로 분리하는 것을 권장**한다.

---

### 7.6 절대 금지 (MSW 관련)

- ❌ 성공/실패를 **하나의 전역 handler 배열**에 섞어서 등록
- ❌ 실패 상태를 전역 `setupServer` 기본 handlers 에 추가

> 실패는 **"특정 테스트의 intent"**이며,  
> "전역 기본 동작"이 아니다.

### 7.7 MSW 핸들러 생성 규칙 (신규 API의 경우)

**기존 MSW 핸들러가 없는 API를 테스트할 경우, 다음 규칙에 따라 핸들러를 생성한다.**

#### 7.7.1 디렉토리 구조 (필수)
**모든 MSW 핸들러는 다음 구조를 따른다:**

```
mocks/[domain]/
├── handler.ts    # MSW 핸들러 정의 (필수)
└── data.ts       # Mock 데이터 정의 (필수)
```

**❌ 금지**: 핸들러 내부에 직접 데이터 작성  
**✅ 필수**: 항상 `data.ts`로 분리

**예시:**
```
mocks/
├── auth/
│   ├── handler.ts
│   └── data.ts
├── users/
│   ├── handler.ts
│   └── data.ts
└── handlers.ts  # 모든 핸들러 통합
```

#### 7.7.2 data.ts 작성 규칙

**기본 패턴:**
```typescript
// mocks/auth/data.ts
import type { LoginResponse } from '@/network/apis/auth.type';

// 성공 케이스
export const mockLoginSuccess: LoginResponse = {
  accessToken: 'test-access-token',
};

// 에러 케이스
export const mockLoginError = {
  error_no: 101,
  message: '허용되지 않는 사용자 입니다.',
};

// 유저 픽스처
export const mockUser = {
  username: 'test-user',
  realname: '테스트유저',
  userType: 'rent_company_user',
  // ...
};
```

**명명 규칙:**
- `mock[Entity][State]` 형식 사용
- 예: `mockLoginSuccess`, `mockUserBlocked`, `mockContractPending`
- 타입을 import하여 타입 안전성 확보

#### 7.7.3 handler.ts 작성 규칙

```typescript
// mocks/auth/handler.ts
import { HttpResponse, http } from 'msw';
import { mockLoginSuccess } from './data';

const API_BASE_URL = process.env.BACKEND_URL || 'https://api.example.com';

export const authHandlers = [
  http.post(`${API_BASE_URL}/auth`, async () => {
    return HttpResponse.json(mockLoginSuccess);
  }),
  
  http.post(`${API_BASE_URL}/v2/onboarding`, async () => {
    return HttpResponse.json({ enabled: true });
  }),
];

// 에러 핸들러는 함수로 export
export const buildLoginErrorHandler = (errorNo: number) =>
  http.post(`${API_BASE_URL}/auth`, () =>
    HttpResponse.json({ error_no: errorNo }, { status: 400 }),
  );
```

**핸들러 작성 규칙:**
- **반드시 `${process.env.BACKEND_URL}` 또는 `API_BASE_URL` 상수 사용**
- 상대 경로(`/auth`) 절대 금지
- `data.ts`에서 import하여 사용
- 배열로 export하여 `mocks/handlers.ts`에서 통합

#### 7.7.4 핸들러 등록

생성한 핸들러를 `mocks/handlers.ts`에 추가:

```typescript
// mocks/handlers.ts
import { authHandlers } from './auth/handler';
import { comprehensiveHandlers } from './insurances/handler';
// ... 기존 핸들러들

export const handlers = [
  ...authHandlers,  // 새로 추가
  ...comprehensiveHandlers,
  // ... 기존 핸들러들
];
```

#### 7.7.5 테스트 파일에서 사용

```typescript
// login.test.tsx
import { createTestServer } from '@/tests/createTestServer';
import { authHandlers, buildLoginErrorHandler } from '@/mocks/auth/handler';

const server = createTestServer(authHandlers);

it('로그인 실패 시 에러 메시지 노출', async () => {
  // 특정 테스트에서만 에러 핸들러로 오버라이드
  server.use(buildLoginErrorHandler(101));
  
  // ... 테스트 로직
});
```

**Self-Check:**
- [ ] `data.ts` 파일을 생성했는가?
- [ ] 모든 Mock 데이터를 `data.ts`로 분리했는가?
- [ ] `handler.ts`에서 `data.ts`를 import하여 사용했는가?
- [ ] `${process.env.BACKEND_URL}` 사용했는가?
- [ ] 타입을 import하여 타입 안전성을 확보했는가?
- [ ] 핸들러를 `mocks/handlers.ts`에 등록했는가?
- [ ] 테스트 실행 시 MSW 경고가 없는가?

### 7.8 Store 상태 검증 규칙 (Zustand/Recoil)

**Integration 테스트에서는 Store 상태를 직접 검증하거나 UI 렌더링을 확인한다.**

**Store Spy는 Unit Test 관점이며, Integration Test는 결과(UI/State)를 검증해야 한다.**

**❌ Bad Pattern (Spy 남발 - 간접 검증)**:
```typescript
// 테스트마다 spy 생성
const showAlertSpy = vi.spyOn(alertStore.getState(), 'showAlert');
await user.click(loginButton);

// 함수 호출 여부만 확인 (결과는 확인 안 함)
await waitFor(() => {
  expect(showAlertSpy).toHaveBeenCalledWith({
    content: expect.stringContaining('실패'),
  });
});
// 문제: Alert가 실제로 렌더링되는지 검증하지 않음
```

**✅ Good Pattern 1 (Store 상태 직접 검증)**:
```typescript
await user.click(loginButton);

// Store 상태를 직접 검증
await waitFor(() => {
  const alerts = alertStore.getState().alerts;
  expect(alerts).toHaveLength(1);
  expect(alerts[0].content).toContain('로그인에 실패');
  expect(alerts[0].type).toBe('error');
});
```

**✅ Good Pattern 2 (UI 렌더링 검증 - Integration의 본질)**:
```typescript
await user.click(loginButton);

// DOM에 Alert가 실제로 렌더링되었는지 확인
expect(await screen.findByRole('alert')).toHaveTextContent('로그인에 실패');
```

**규칙**:
- Store 함수 호출을 spy하는 것은 **Unit Test** 관점 (비즈니스 로직 테스트)
- **Integration Test**는 **결과(UI 렌더링 또는 Store State)**를 검증
- Spy는 "API 호출 여부" 등 **외부 의존성 검증**에만 사용
  - 예: `expect(requestLoginSpy).toHaveBeenCalled()` ✅
  - 예: `expect(showAlertSpy).toHaveBeenCalled()` ❌

**Self-Check:**
- [ ] Store 함수를 spy하지 않고 상태를 직접 검증했는가?
- [ ] 또는 UI에 렌더링된 결과를 확인했는가?
- [ ] Spy는 API 호출 등 외부 의존성에만 사용했는가?

### 7.9 Mock Requirement 매핑

- Test Plan의 `(Mock Requirement)` 섹션에 명시된 필드 구조를 **테스트 코드에 주석으로 참조**한다.
- 빌더 함수를 사용하는 경우, 함수 위에 Test Plan의 Mock Requirement를 주석으로 명시한다.

**예시:**
```tsx
/**
 * Test Plan S1 Mock Requirement:
 * - useNormalContractRentDetailQuery success with datas.details array last item containing
 *   {id, useConnect: boolean, rentCarNumber, drivenDistance, gasCharge, deliveredDate}
 * - datas.request with {id, orderer}
 */
const buildNormalContractDetailResponse = (overrides?: Partial<{...}>) => ({
  success: true,
  datas: { ... }
});
```

### 7.10 Toast/Alert 검증 규칙

**Toast 검증:**
- **비즈니스적으로 중요한 메시지**는 메시지 내용까지 검증한다.
- Store 상태(`toastStore.getState().toasts`)를 사용하여 실제 사용자가 보는 메시지를 검증한다.
- 메시지 검증 시 `includes()`보다는 `===`를 사용하여 정확한 매칭을 권장한다. (메시지가 동적으로 변하는 경우에만 `includes()` 사용)

**예시:**
```typescript
// ✅ Good: 메시지 내용까지 검증 (타입 가드 포함)
await waitFor(() => {
  const toasts = toastStore.getState().toasts;

  expect(
    toasts.some(
      (toast) => typeof toast.message === 'string' && toast.message === '반납이 완료되었습니다.',
    ),
  ).toBe(true);
});

// ✅ Acceptable: 부분 문자열 매칭 (메시지가 동적으로 변하는 경우)
await waitFor(() => {
  const toasts = toastStore.getState().toasts;

  expect(
    toasts.some(
      (toast) => typeof toast.message === 'string' && toast.message.includes('반납이 완료'),
    ),
  ).toBe(true);
});

// ❌ Bad: 타입 가드 없이 includes 사용 (타입 에러 발생)
await waitFor(() => {
  expect(toastStore.getState().toasts.some((toast) => toast.message.includes('반납이 완료'))).toBe(true);
  // Error: 'number' 형식에 'includes' 속성이 없습니다.
});

// ❌ Bad: 토스트 존재만 확인 (메시지 내용 검증 없음)
await waitFor(() => {
  expect(toastStore.getState().toasts.length).toBeGreaterThan(0);
});
```

**타입 가드 필수:**
- `toast.message`는 `string | number` 타입이므로, `includes()` 또는 `===` 사용 전에 **반드시 타입 가드(`typeof toast.message === 'string'`)를 추가**해야 한다.

**Alert 검증:**
- Alert는 `showAlert` spy를 사용하여 호출과 파라미터를 검증한다.
- 메시지 내용이 중요한 경우 `toHaveBeenCalledWith`로 정확한 내용을 검증한다.

**예시:**
```typescript
// ✅ Good: Alert spy로 메시지 내용까지 검증
const showAlertSpy = vi.spyOn(alertStore.getState(), 'showAlert');
// ... 테스트 실행 ...
expect(showAlertSpy).toHaveBeenCalledWith({ content: '반납 유류량을 입력해 주세요.' });
```

**Self-Check:**
- [ ] 비즈니스적으로 중요한 Toast 메시지는 내용까지 검증했는가?
- [ ] Store 상태를 사용하여 실제 사용자가 보는 메시지를 검증했는가?
- [ ] 메시지 검증 시 `===` 또는 `includes()`를 적절히 사용했는가?

---

## 8. Business Logic & Hook Mocking (중요)

UI 테스트는 **"복잡한 내부 로직의 정합성"**을 검증하지 않는다.
UI 컴포넌트가 **"데이터 상태에 따라 올바르게 렌더링되는지"**만 본다.

따라서, 계산 로직이나 복잡한 State를 가진 Custom Hook은 **과감하게 Mocking**하여 **고정된 UI State**를 주입한다.

### 8.1 Store/Hook Mocking 체크리스트 (Critical)

**Mock 작성 전 반드시 확인:**

1. **직접 의존성 확인**:
   - 테스트 대상 컴포넌트가 직접 import하여 사용하는 모든 store/hook
   - 예: `LoginPage`가 직접 사용하는 `useAuth`, `useCustomRouter` 등

2. **간접 의존성 확인**:
   - 테스트 대상 컴포넌트가 렌더링하는 **모든 자식 컴포넌트** 확인
   - 각 자식 컴포넌트가 사용하는 store/hook 확인
   - 예: `LoginPage` → `FullScreenContainer` → `useFullScreenContainerStore`

3. **Provider 체인 확인**:
   - `renderWithProviders`가 제공하는 모든 Provider 확인
   - 각 Provider가 사용하는 store/hook 확인

4. **실행 시점 확인**:
   - 테스트 실행 시 실제로 어떤 컴포넌트가 렌더링되는지 확인
   - 렌더링되는 모든 컴포넌트의 의존성을 Mock에 포함

**❌ Bad Pattern:**
```typescript
// LoginPage만 확인하고 FullScreenContainer는 확인 안 함
vi.mock('@/stores', () => ({
  useAppStore: vi.fn(),
  useLoadingStore: vi.fn(),
  // useFullScreenContainerStore 누락! → 테스트 실패
}));
```

**✅ Good Pattern:**
```typescript
// LoginPage + 자식 컴포넌트(FullScreenContainer) 모두 확인
vi.mock('@/stores', () => ({
  useAppStore: vi.fn(),
  useLoadingStore: vi.fn(),
  useFullScreenContainerStore: vi.fn(() => ({
    setIsFullScreenContainerUsed: vi.fn(),
  })),
}));
```

### 8.2 언제 Hook을 Mocking 하는가?
- 로직이 복잡해서 테스트 셋업이 어려운 경우 (예: 장바구니 계산, 결제 프로세스)
- `useEffect`나 내부 타이머가 UI 테스트를 방해하는 경우
- **Unit Test(`business-logic-test-prompt`)에서 이미 검증된 로직일 경우** (✅ 핵심)

> ⚠️ **주의: Network Mutation Hook 및 이를 감싸는 핸들러 Hook은 Mocking 금지**  
> - `useMutation`을 직접 사용하는 Hook 뿐만 아니라, **API 통신을 담당하는 Custom Hook(예: `useAuth`, `usePayment`)도 Mocking 금지 대상**이다.
> - 이러한 Hook을 Mocking하면 실제 에러 핸들링(try-catch, onError)과 상태 변화 로직이 누락된다.
> - **원칙**: API 호출이 포함된 로직은 **무조건 MSW**를 통해 네트워크 계층에서 Mocking하며, Hook 자체는 실제 코드를 실행해야 한다.

### 8.3 Mocking 예시 (Vitest)

**❌ Bad Pattern (실제 로직 실행)**
```ts
// 실제 hook이 복잡한 계산을 수행하여 테스트가 느려지고 깨지기 쉬움
const { result } = renderHook(() => useCartLogic());
```

**⭕ Good Pattern (UI 상태 주입)**
```ts
// 1. Hook 경로 Mocking
vi.mock('@/hooks/useCartLogic', () => ({
  useCartLogic: vi.fn(() => ({
    // 2. UI 렌더링에 필요한 "결과값"만 주입
    cartItems: [{ id: 1, name: '테스트 상품', price: 10000 }],
    totalPrice: 10000,
    isLoading: false,
    // 3. Interaction 확인용 Spy 함수
    addToCart: vi.fn(),
  }))
}));
```

### 8.4 UI Component Stubbing Rules

### 8.5 Vitest Mocking & Hoisting Rules (Critical)

**`vi.mock`은 파일의 최상단으로 hoisting 되므로, mock factory 내부에서 외부 변수를 참조하면 `ReferenceError`가 발생한다.**

- **❌ Bad Pattern (ReferenceError 발생)**:
  ```typescript
  const myMock = vi.fn(); // 2. 실행됨 (늦음)
  
  vi.mock('my-module', () => ({ // 1. 호이스팅되어 먼저 실행됨
    myMethod: myMock, // Error: myMock is not initialized
  }));
  ```

- **✅ Good Pattern (`vi.hoisted` 사용)**:
  ```typescript
  // vi.hoisted는 vi.mock보다도 먼저 실행됨
  const { myMock } = vi.hoisted(() => ({
    myMock: vi.fn(),
  }));
  
  vi.mock('my-module', () => ({
    myMethod: myMock,
  }));
  ```

- **규칙**:
  - `vi.mock` 내부에서 사용할 변수는 반드시 `vi.hoisted`로 생성한다.
  - 또는 `vi.mock` 내부에서 직접 `vi.fn()`을 정의한다 (변수 공유가 필요 없는 경우).

- **Meaningful Stubs**: 복잡한 컴포넌트(DatePicker, AddressSearch 등)를 Stubbing 할 때는 **최소한의 상호작용(onChange, validation)**이 가능하도록 만든다.
- ❌ `div`나 `button`으로 퉁치기 금지 (입력 제약 테스트가 불가능해짐)
- ✅ `input`을 렌더링하고 `props`를 연결하여 `userEvent.type`이 동작하도록 구현
- **예시**:
  ```tsx
  // ✅ Good Stub
  vi.mock('@/components/MyInput', () => ({
    MyInput: ({ value, onChange }) => <input value={value} onChange={e => onChange(e.target.value)} />
  }));
  ```

---

## 9. Render Wrapper 규칙

테스트는 실제 앱 환경과 최대한 비슷해야 한다.

### 9.1 AppProviders 패턴

```ts
render(<LoginView />, {
  wrapper: AppProviders
});
```

`AppProviders` 안에는 다음이 들어간다 (프로젝트에 따라 다름):

- ThemeProvider
- QueryClientProvider
- Router/Navigation provider
- Recoil/Zustand Provider (필요 시)
- i18n Provider 등

> 이미 프로젝트에 `renderWithProviders` 같은 util 이 있다면  
> **반드시 그것을 우선 사용**한다.

---

## 10. MSW + UI 통합 흐름 템플릿

1. `beforeEach`에서 `server.resetHandlers()`
2. 필요 시 `server.use(successHandler)` 또는 `server.use(errorHandler)`
3. Hook Mocking 필요 시 `vi.mock` 설정
4. `render` + `userEvent`로 상호작용
5. `waitFor`로 UI 변화 기다리기
6. mock 호출/라우팅/스토어 업데이트 등 동기 검증

---

## 11. Execution Steps (Chain of Thought) 🧠

> **단순히 코드를 작성하지 말고, 아래 순서대로 사고(Thinking)한 뒤 최종 결과물을 출력하시오.**

### Step 1: Drafting (초안 작성)
- 테스트 대상의 로직을 파악하고 시나리오별 필요한 Mock을 결정하다
- selector 전략(placeholder, role, text)을 결정한다

### Step 2: Mocking Strategy (Mock 전략 수립)

**코드를 작성하기 전, 필요한 Mocking 대상을 아래 표로 먼저 정리하시오.**

| 의존성 (Hook/Store/API) | 함수/메서드 | 시나리오별 Return 값 | 비고 |
| :--- | :--- | :--- | :--- |
| useAuth | login(id, pw) | `Promise<void>` (S1: 성공) <br/> `Promise<{warningMessage: string}>` (S3: 실패) | Dependency Context의 `AuthResult` 타입 참조 |
| useCustomRouter | reset(route, options) | `void` | S1, S2에서 호출 여부만 검증 |
| useUserStore | setIsLogin(boolean) | `void` | Spy 필요 |

**자기 점검**:
- [ ] 모든 Mock의 리턴 타입이 실제 소스 코드와 일치하는가?
- [ ] Enum 값은 Dependency Context에서 확인했는가?
- [ ] Mock 데이터의 필드명(예: `user.type` vs `user.userType`)이 소스 코드와 정확히 일치하는가?

### Step 3: Auditing (자기 비판)
- **Zero Tolerance Criteria**를 기준으로 초안을 매섭게 비판한다.
- 1. `waitFor` 내부에 `expect(mock)`이 있는가? (있다면 동기 검증으로 분리)
- 2. Mutation Hook을 직접 Mocking 했는가? (MSW로 대체)
- 3. `useState` 로직을 Mock 내부에 복사했는가? (Shadow Logic 제거)
- 4. 소스 코드에 없는 상수를 추측했는가? (Import Hallucination 제거)
- 5. `[ID]` 태그와 원문 제목을 유지했는가?

### Step 4: Refining (수정)
- 비판 내용을 반영하여 코드를 수정한다.
- 불확실한 Import는 제거하거나 하드코딩으로 대체한다.

### Step 5: Verification & Fix (검증 및 수정) - *Agentic Mode Only*
- 터미널 사용이 가능하다면 실제 테스트를 실행한다.
- 에러 발생 시 **최대 3회**까지 수정을 시도한다. (소스 코드 수정 금지)

### Step 6: Final Output (최종 출력)
- **Thinking Process**와 **Final Code**를 분리하여 출력한다.

---

## 12. Verification & Auto-Correction (Agentic Mode)

> **당신이 터미널 명령어 실행 권한이 있는 도구(Cursor, Claude Code 등)라면, 코드를 작성한 후 다음 절차를 반드시 따르십시오.**

### Step 1: Run Test
작성된 파일에 대해 테스트 러너를 실행하십시오.
- 명령어: `project-manifest.yaml`의 `runner` 설정 참조 (예: `npm test [path]`, `yarn vitest [path]`)

### Step 2: Analyze & Fix
- **Pass:** "✅ 테스트 통과" 메시지와 함께 최종 코드를 출력하고 종료하십시오.
- **Fail:** 에러 메시지를 분석하여 **테스트 코드만** 수정하십시오.

### 🚨 Critical Constraints (For Safety)
1. **Max Retries:** 수정 및 재실행은 **최대 3회**까지만 허용합니다. 3회 실패 시 "❌ 3회 실패" 메시지와 함께 마지막 에러 로그를 출력하고 멈추십시오.
2. **Scope Limitation:** 오직 **테스트 파일**만 수정하십시오. 원본 소스 코드(`app/...`, `src/...`)나 설정 파일은 **절대 수정하지 마십시오.**
3. **Mandatory Execution:** 당신이 **Agentic Mode**이거나 터미널 도구를 사용할 수 있다면, **반드시** 테스트를 실행하고 검증해야 합니다. 단순히 코드를 출력하고 끝내지 마십시오.

---

## 13. Output Format (Thinking + Code)

반드시 아래 포맷을 지켜서 출력한다.

> **Thinking Process:**
> 1. **Drafting**: 로그인 성공 시나리오 구상. `useAuth` 훅과 `router` 모킹 필요.
> 2. **Auditing**:
>    - `waitFor` 체크: Pass.
>    - Mutation Mocking: `useLoginMutation`을 mock 하려다 발견 -> MSW 핸들러로 변경.
>    - Import: `AUTH_TYPE` 상수가 확실하지 않음 -> 리터럴 문자열로 변경.
> 3. **Refining**: 수정 완료.
>
> **Final Code:**
> ```tsx
> ...
> ```

---

## 14. Final Self-Check (마지막 관문)
(코드 출력 전 마지막 확인)
- [ ] **모든 `it` 블록에 G/W/T 주석이 있는가?**
- [ ] **각 G/W/T 주석이 1줄 이상의 의미 있는 설명을 포함하는가?**
- [ ] **시나리오에 조건부 분기("또는", "~이면 ~하고")가 있는가?**
- [ ] **각 분기를 별도 테스트 케이스로 분리했는가?**
- [ ] **각 테스트에서 조건값을 명시적으로 설정했는가?**
- [ ] **초기값 처리 로직을 실제 소스 코드에서 확인했는가?** (useState, useEffect 등)
- [ ] **초기값에 변환 로직(trim, toLowerCase 등)이 적용되는지 확인했는가?**
- [ ] **ATDD 시나리오/Test Plan의 기대값과 실제 구현이 일치하는가?** (불일치 시 주석 명시)
- [ ] **직접 의존성뿐만 아니라 간접 의존성(자식 컴포넌트의 store/hook)도 Mock에 포함했는가?**
- [ ] **테스트 대상 컴포넌트가 렌더링하는 모든 자식 컴포넌트의 의존성을 확인했는가?**
- [ ] **메시지에 줄바꿈 문자(`\n`)가 포함된 경우 정규식이나 부분 매칭을 사용했는가?**
- [ ] **E2E→Integration 시나리오에서도 비동기 작업 완료를 `waitFor`로 기다렸는가?** (`flushPromises()`만으로는 부족)
- [ ] **비동기 체인(예: login → prepareNecessaryData → router.reset)이 완료될 때까지 기다렸는가?**
- [ ] **비즈니스적으로 중요한 Toast 메시지는 내용까지 검증했는가?**
- [ ] `waitFor` 오용 없음?
- [ ] Mutation Mocking 없음?
- [ ] Shadow Logic 없음?
- [ ] Import Hallucination 없음?
- [ ] ID/제목 유지?
- [ ] E2E→Integration 시나리오에 router 검증 주석이 있는가?

---

## 15. 실제 코드 템플릿 (복사용)

```ts
/**
 * LoginView UI Integration Tests
 * Source: src/features/login/LoginView.tsx
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/tests/server';
import { http, HttpResponse } from 'msw';
import { AppProviders } from '@/tests/AppProviders';
import LoginView from '../LoginView';

describe('LoginView', () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it('올바른 자격 증명으로 로그인 시 성공 메시지를 노출한다', async () => {
    // Given: 앱 프로바이더와 함께 로그인 화면이 렌더링됨
    render(<LoginView />, { wrapper: AppProviders });

    // When: 유효한 이메일과 비밀번호를 입력하고 로그인 버튼을 클릭함
    await userEvent.type(
      screen.getByRole('textbox', { name: /이메일/i }),
      'user@test.com'
    );
    await userEvent.type(
      screen.getByLabelText(/비밀번호/i),
      'correct-password'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /로그인/i })
    );

    // Then: (비동기) 로그인 성공 메시지가 화면에 나타남
    await waitFor(() =>
      expect(
        screen.getByText(/로그인에 성공했습니다/i)
      ).toBeVisible()
    );
  });

  it('잘못된 비밀번호로 로그인하면 에러 메시지를 노출한다', async () => {
    // Given: 로그인 실패 응답을 설정하고 화면을 렌더링함
    server.use(
      http.post('/api/login', () =>
        HttpResponse.json(
          { error: 'INVALID_CREDENTIAL' },
          { status: 400 }
        )
      )
    );

    render(<LoginView />, { wrapper: AppProviders });

    // When: 잘못된 비밀번호를 입력하고 로그인을 시도함
    await userEvent.type(
      screen.getByRole('textbox', { name: /이메일/i }),
      'user@test.com'
    );
    await userEvent.type(
      screen.getByLabelText(/비밀번호/i),
      'wrong-password'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /로그인/i })
    );

    // Then: (비동기) 에러 메시지가 화면에 표시됨
    await waitFor(() =>
      expect(
        screen.getByText(/아이디 혹은 비밀번호가 올바르지 않습니다/i)
      ).toBeVisible()
    );
  });
});
```

---

## 16. Selector Rules (강력)

### 16.0 셀렉터 우선 순위

1. `getByRole` + 접근성 이름
2. `getByLabelText`
3. `getByText`
4. `getByPlaceholderText`
5. `getByTestId` (최후의 수단)

CSS selector, className 기반 탐색은 가능한 한 피한다.

### 16.1 다중 매칭 처리 (Ambiguous Text)
- `getByText` 등이 여러 요소를 반환하여 에러가 나는 경우:
  1. `getAllByText`를 사용하여 배열 길이를 검증하거나,
  2. `within` 또는 `name`/`role` 옵션을 사용하여 **대상을 명확히 좁힌다.**
- ❌ 무작정 `.getAllByText(...)[0]` 인덱스로 접근 금지 (순서 의존성)

### 16.2 줄바꿈 문자(`\n`)가 포함된 텍스트 검증 (Critical)

**문제 상황:**
- 메시지에 줄바꿈 문자(`\n`)가 포함된 경우, `findByText`나 `getByText`로 정확한 텍스트 매칭이 실패할 수 있음
- React Testing Library는 줄바꿈을 공백으로 정규화하거나, 실제 DOM에서는 줄바꿈이 그대로 유지되어 매칭 실패

**해결 방법:**

1. **정규식 사용 (권장)**:
   ```typescript
   // ❌ Bad: 정확한 텍스트 매칭 (줄바꿈으로 인한 실패 가능)
   await screen.findByText('입력하신 정보와 일치하는 계정이 없습니다.\n로그인 정보를 확인해주세요.');
   
   // ✅ Good: 정규식으로 유연하게 매칭
   await screen.findByText(/입력하신 정보와 일치하는 계정이 없습니다[\s\S]*로그인 정보를 확인해주세요/);
   ```

2. **부분 텍스트 매칭**:
   ```typescript
   // ✅ Good: 메시지의 핵심 부분만 검증
   await screen.findByText(/입력하신 정보와 일치하는 계정이 없습니다/);
   ```

3. **함수 매처 사용**:
   ```typescript
   // ✅ Good: 커스텀 매칭 함수 사용
   await screen.findByText((content, element) => {
     return content.includes('입력하신 정보와 일치하는 계정이 없습니다') &&
            content.includes('로그인 정보를 확인해주세요');
   });
   ```

**체크리스트:**
- [ ] 메시지에 줄바꿈 문자(`\n`)가 포함되어 있는가?
- [ ] 정확한 텍스트 매칭이 실패하는 경우 정규식이나 부분 매칭을 사용했는가?
- [ ] 메시지의 핵심 내용은 검증했는가?

---

## 17. Router 검증

가능하면 **Router 호출 자체**보다,  
라우팅 결과로 나타나는 **UI 요소**를 검증한다.

예시:

```ts
await waitFor(() =>
  expect(
    screen.getByRole('heading', { name: /대시보드/i })
  ).toBeVisible()
);
```

필요하다면 mock Router 의 `push`/`replace` 호출도 보조적으로 검증한다.

---

## 18. Anti-Pattern 목록 (Fail Immediately)

- ❌ Snapshot 테스트
- ❌ mock 내부 구현/파생 로직 검증
- ❌ CSS/px 기준 테스트
- ❌ 렌더 횟수/성능 측정 테스트
- ❌ `waitFor(() => expect(mock).toHaveBeenCalled())` (Mock 검증은 동기적으로!)
- ❌ **Weak Assertion**: `toHaveBeenCalled()`나 `toHaveBeenCalledTimes()`만 사용하여 호출 여부만 확인하는 행위 금지. **반드시 `toHaveBeenCalledWith(...)`를 사용하여 전달된 인자(Arguments)까지 검증**한다. (특히 API/Storage 호출 시 필수)
- ❌ **Mutation Hook Mocking** (`vi.mock('...useMutation')` 금지 → MSW 사용)
- ❌ `setTimeout` / 실제 sleep 기반 지연
- ❌ **Mock Cheating**: Mock 함수 내부에서 `alert/toast`를 직접 호출하여 테스트를 통과시키는 행위 (예: `mockFn.mockImplementation(() => showAlert())`)
- ❌ **Shadow Logic**: Mock 내부에서 `useState` 등을 사용하여 로직을 재구현하는 행위
- ❌ **Import Hallucination**: 소스 코드에 없는 상수를 추측하거나, `type` import를 `value`로 착각하여 사용하는 행위
- ❌ **Fallback Cheating**: `if (!handled) mockFn()` 형태로 테스트가 대신 동작을 수행하는 행위 (실제 코드가 실패하면 테스트도 실패해야 함)
- ❌ **Data Dependency 무시**: `useEffect`가 의존하는 데이터(예: `fuelPct`)를 `null`로 Mocking하여 로직 실행 자체를 누락시키는 행위
- ❌ **Over-simplified Stubs**: 입력 컴포넌트를 `div`로 만들어 `type`/`change` 이벤트를 막아버리는 행위
- ❌ **Import Hallucination**:
  - 소스 코드의 `../../_constants`를 `@/constants`로 **임의로 바꿔서 import** 하는 행위 금지.
  - 없는 Alias를 추측하지 말고, 상대 경로는 **깊이만 조절(`../../../`)**하여 사용한다.

---

## 19. 테스트 완료 후 Self Checklist

- [ ] selector는 접근성 기준(getByRole, getByLabelText)을 우선 사용했는가?
- [ ] 실패 응답은 전역 handler가 아니라 `server.use()`로 override 했는가?
- [ ] 비즈니스 로직(Hook)이 너무 복잡하다면 Mocking 했는가?
- [ ] mock 호출 검증에 `waitFor`를 사용하지 않았는가?
- [ ] `waitFor`는 오직 UI 상태 변화(텍스트/요소 존재/부재)에만 사용했는가?
- [ ] Router 이동 검증은 UI 기준으로 수행했는가?
- [ ] `console.log`, `screen.debug` 등 디버깅 코드를 제거했는가?

---

## 20. 출력 형태 요약

- TypeScript 기반 RTL 테스트 코드
- 파일명: `[컴포넌트명].test.tsx`
- 구조: `describe` + `it` + G/W/T 주석
- 비동기: `waitFor`는 UI 변화 기준, mock 검증은 동기

---

## 21. 실행/환경 관련 내용

이 프롬프트는 **“테스트 코드를 생성”**하는 역할만 담당한다.  
테스트 실행/Node 버전/패키지 매니저/명령어 가이드는  
`test-execution-and-msw-guide.md`를 따른다.
