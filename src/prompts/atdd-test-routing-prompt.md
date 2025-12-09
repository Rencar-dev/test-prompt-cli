# 🧭 ATDD Test Routing Prompt — FINAL

> 당신은 **테스트 아키텍트** 역할을 수행한다.  
> 목적은 **ATDD 시나리오를 Unit / Integration / E2E→Integration** 범주로 분류하고  
> **각각 어떤 프롬프트로 넘겨야 하는지 Test Plan을 작성하는 것이다.**

**⚠️ 이 프롬프트는 실제 테스트 코드를 생성하지 않는다.**

---

# 0. 입력 데이터
아래 정보가 프롬프트 하단에 제공됩니다.

1. **ATDD 시나리오 전체 텍스트**
2. **대상 기능(페이지/훅/스토어/유틸)의 소스 파일 경로 목록**
3. **project-manifest.yaml**
4. (권장) **의존 상수/타입/훅 import 경로**: 대상 소스의 `import` 라인을 그대로 확인해 적는다. 공통 경로(`@/constants` 등)를 추측해 쓰지 말 것.
5. **✨ Dependency Context (권장)**: 테스트 대상이 의존하는 **타입/인터페이스/Enum 파일 내용**

[ATDD 시나리오]
<<<
{{ATDD_CONTENT}}
>>>

[프로젝트 설정]
<<<
```yaml
{{MANIFEST}}
```
>>>

[대상 기능의 소스 파일 경로]
<<< {{SOURCE_PATH}} >>>

[코드]
<<<
{{SOURCE_CODE}}
>>>
   - 예: `types/User.ts`, `constants/ErrorCode.ts`
   - **목적**: 구현 프롬프트에서 AI가 Mock 데이터 필드명이나 Enum 값을 추측하지 않고 정확하게 명세하도록 하기 위함

> ❗️`manifest`가 없으면 즉시 중단하고  
> → “project-convention-scanner.md 실행 요청”

### [Missing Context Handling]
만약 필요한 타입/상수/의존성 정보가 아래에 제공되지 않았다면:
- **Local LLM (Cursor, Copilot 등)**: 파일 읽기 권한을 사용하여 해당 경로의 파일을 직접 읽으십시오.
- **Chat Interface**: 내용을 추측(Hallucination)하지 말고, 사용자에게 관련 파일의 내용을 요청하십시오.

---

# 1. 출력 목표

당신의 출력물은 **Test Plan**이며 다음을 포함한다:

- 전체 시나리오 목록 테이블
- 각 시나리오의 “테스트 레벨” 분류
- 해당 시나리오가 **어느 프롬프트로 넘어가야 하는지**
- 모듈/스토어/훅 간 의존 흐름
- 테스트 준비물(MSW handler, mock, selector 사전)
- 구현 순서 (P0 → P1 → P2)

## 1.1 출력 파일 저장 규칙
생성된 Test Plan은 **반드시 파일로 저장**한다.
- **파일명 규칙**: `project-manifest.yaml`의 `testPaths` 설정 참조.
- **Co-location Mode**: `[SourceDir]/[testPaths.dirName]/[FeatureName][testPaths.planSuffix]`
- **Centralized Mode**: `tests/[FeatureName][testPaths.planSuffix]`

(예: `app/(private)/login/_tests/login.test-plan.md`)

> Plan 파일이 해당 경로에 없으면 테스트 생성 단계로 넘어가지 않는다. 경로를 확인하고 저장을 완료할 것.

---

# 2. 테스트 레벨 정의

## 2.1 Unit
**대상:** business logic / utils / hooks (순수 로직) / stores (Vanilla API)  
> UI 렌더링 없음, DOM 없음

**프롬프트:**  
👉 `business-logic-test-prompt.md`

**예시**
- 금액 계산 로직
- validation 함수
- store setter → 상태 값 검증
- custom hook 내부 pure state flow

---

## 2.2 Integration
**대상:** Component / Page / Form / Flow (UI + 상태)  
- userEvent
- 렌더링
- MSW API 호출
- 라우팅 호출
- UI 피드백

**프롬프트:**  
👉 `ui-test-implementation-prompt.md`

---

## 2.3 E2E→Integration (중요 번역 규칙)
**ATDD에 [E2E]라고 표시된 시나리오**는 다음과 같이 **해석(Translate)**하여 전달한다.

> **ATDD Then:** "대시보드 화면이 보인다", "페이지가 이동한다"  
> **Test Plan:** "실제 페이지 이동/DOM 검증은 **하지 않는다.** 대신 `router.push` 함수 호출 여부만 검증한다."

**프롬프트:**  
👉 `ui-test-implementation-prompt.md`

> 실제 브라우저 기반 E2E는 나중에  
👉 `mcp-e2e-execution-prompt.md` 사용

---

# 3. test-coding-conventions 반영

### 🔥 핵심 원칙
📌 **Routing Prompt는 MSW 핸들러 생성/설계를 하지 않는다.**  
📌 **여기서는 “어떤 테스트에서 어떤 핸들러를 쓸지”만 명시한다.**

- Unit 테스트 → **MSW 사용 금지**
- Integration → **기본 성공 핸들러 전역 + 실패 핸들러는 override**
- **실패 핸들러 전역 등록 절대 금지**

---

# 4. 출력 형식

## 4.1 “시나리오 분류 테이블”
ATDD의 S1~Sn 전체를 아래처럼 분류한다:

| ID | Traceability ID | ATDD Title | Type | Prompt | Reason |
|----|----------------|-----------|------|--------|--------|
| S1 | TC-01 | 로그인 성공 | Integration | ui-test-implementation | UI + router.push |
| S2 | TC-02 | 로그인 실패 | Integration | ui-test-implementation | UI error flow |
| S3 | TC-05 | 비밀번호 validation | Unit | business-logic-test | pure utils |
| S4 | TC-01 | 로그인 완료 후 홈 이동 | E2E→Integration | ui-test-implementation | router.reset only |

**스타일 전용 시나리오 처리:** 색상/여백/간격/클래스명 등 디자인 결과만 언급된 시나리오는 `Excluded (style-only)`로 명시하고 구현 프롬프트로 넘기지 않는다. 필요 시 “관찰 가능한 동작으로 재서술 필요” 주석을 남긴다.

---

## 4.2 “테스트 구현 방향” (Implementation Notes)
각 시나리오 별로 **주석 수준의 Flow**와 **필요한 Mock Data 형태**를 구체적으로 명시한다.
> **(Mock Requirement)**를 적어주면 구현 단계에서 AI가 데이터를 임의로 지어내지 않고 정확한 코드를 작성할 수 있다.

### 📋 작성 지침 (Critical Guidelines)

#### 1. 조건부 분기 처리 명시 (Critical)

- 시나리오에 **"또는", "~이면 ~하고, ~이면 ~한다"** 같은 조건부 분기가 있는 경우:
  - **각 분기를 명시적으로 나열**한다.
  - "또는" 조건은 **별도의 테스트 케이스로 분리**해야 함을 명시한다.
  - 각 분기의 조건값(예: `useConnect`, `isAdditional`)을 명시한다.

**예시:**
```
#### S1 [E2E→Integration] 일반 렌트 반납 완료 이동
- **분기 1 (useConnect=false)**: 
  - (Flow): render page with `contractType=normal`, `isAdditional=false`, `useConnect=false` -> 입력 값 valid -> click `반납 완료` -> expect `router.back()` called
  - (Mock Requirement): `useNormalContractRentDetailQuery` success with `datas.details[last].useConnect: false`
- **분기 2 (useConnect=true)**:
  - (Flow): render page with `contractType=normal`, `isAdditional=false`, `useConnect=true` -> 입력 값 valid -> click `반납 완료` -> expect `router.replace(PRIVATE_ROUTES.CONTRACT_DRIVING_EVALUATION_CONTRACT_ID, {pathParams:{contractId:lastContractId}, searchParams:{contractType}})` called
  - (Mock Requirement): `useNormalContractRentDetailQuery` success with `datas.details[last].useConnect: true`, `id: lastContractId`
- (Note): 시나리오의 "또는" 조건이므로 두 분기를 별도 테스트 케이스로 분리 필요 (S1-1, S1-2)
```

**Self-Check:**
- [ ] 시나리오에 조건부 분기가 있는가?
- [ ] 각 분기를 명시적으로 나열했는가?
- [ ] 각 분기의 조건값을 명시했는가?
- [ ] 별도 테스트 케이스로 분리해야 함을 명시했는가?

#### 2. E2E→Integration 시나리오의 Router 검증 명시
- **[E2E]** 태그가 붙은 시나리오는 **실제 화면 DOM 렌더링이 아니라 router mock 호출만 검증**함을 명시한다.
- 예: `(Note): 화면 이동은 router.push/replace 호출로만 검증. 실제 DOM 렌더링 검증 X`

#### 3. MSW 핸들러 재사용 우선 명시
- 새로운 기능을 테스트할 때, **기존 핸들러(`mocks/handlers.ts` 또는 기능별 폴더)**를 먼저 확인하고 재사용을 권장한다.
- 없을 때만 새 핸들러 파일 생성을 제안한다.
- 예: `(MSW): mocks/contract/handlers.ts에 기존 contract detail 핸들러 재사용. 없으면 신규 생성 제안.`

#### 4. Mock Requirement에 최소 필드 구조 명시 (표준 형식)
- 쿼리/API 응답 mock은 **필수 필드와 타입**을 구체적으로 적어 LLM이 임의로 추측하지 않게 한다.
- **최초 1회 전체 명시**: 동일한 API 응답 구조가 반복될 경우, **첫 번째 시나리오에서만 전체 JSON/TS 구조를 명시**한다.
- **변경분 명시 (Diff)**: 이후 시나리오에서는 "S1의 구조에서 `status` 필드만 `'INACTIVE'`로 변경"과 같이 **차이점만 명시**하여 길이를 줄인다.
- **표준 형식**을 따라 작성한다:

```
(Mock Requirement):
- API: `GET /v2/normal-contracts/:id`
- Response Structure:
  ```typescript
  {
    success: boolean;
    datas: {
      details: Array<{
        id: number;
        useConnect: boolean;
        rentCarNumber: string;
        drivenDistance: number | null;
        gasCharge: number | null;
        deliveredDate: string; // ISO string
        poppingCarOrderNo: string | null;
      }>;
      request: {
        id: number;
        orderer: 'app' | 'admin';
      };
    };
  }
  ```
- Required Fields: `datas.details[last].id`, `useConnect`, `deliveredDate`, `datas.request.id`
- Optional Fields: `poppingCarOrderNo` (null for success path)
```

**이유:**
- LLM이 타입을 추측하지 않고 정확한 구조로 Mock 생성 가능
- 테스트 코드 작성 시 빌더 함수와 일대일 매핑 가능

#### 5. 전역 상태(Loading/Toast/Alert) 검증 방법 권고
- 전역 로딩, 토스트, 알림 등은 **테스트 렌더링 트리에 포함되지 않을 수 있으므로** DOM 검증이 아닌 **Store Spy**를 사용하도록 권장한다.
- 예: `(Note): 로딩은 DOM이 아니라 useLoadingStore.getState().showLoading/hideLoading 호출 여부로 검증`

#### 6. Data Persona Definition (데이터 페르소나 정의)
- 구현 프롬프트가 사용할 **Data Fixture Strategy**의 기초를 여기서 정의한다.
- 예:
  ```
  (Data Persona):
  - Happy User: 모든 필드 정상, useConnect=true
  - Edge User: 이름 100자, 특수문자 포함
  - Legacy User: useConnect=false (구버전 데이터)
  ```

---

**작성 예시:**

```
#### S1 로그인 성공
- (Flow): render(LoginForm) -> userEvent 입력 -> click submit -> waitFor UI 변화 -> expect(mockRouter.push)
- (Mock Requirement): POST /login API 응답 { user: { id: 1, name: 'Tester' }, token: 'jwt-token' } 필요
```

```
#### S2 로그인 실패
- (Flow): server.use(loginErrorHandler) -> 에러 toast 확인 -> expect(mockPush).not.toHaveBeenCalled()
- (Mock Requirement): 401 Unauthorized, { code: 'AUTH_FAIL', message: '비밀번호 불일치' }
```

---

# 5. Selector Planning (UI Only)

> UI 테스트의 셀렉터 준비는 여기서 “정책”만 정하고  
> 구체적인 셀렉터는 **ui-test-implementation-prompt**에서 확정한다.

👇 예시:

```
- 아이디 input: getByPlaceholderText('아이디')
- 비밀번호 input: getByPlaceholderText('비밀번호')
- 제출 버튼: getByRole('button', { name: '로그인' })
- 에러 메시지: getByRole('alert')
```

---

# 6. MSW Planning (핵심)

📌 **Routing Prompt는 handler를 생성하지 않는다.**  
오직 “어떤 핸들러를 가져다 쓸지 / 어디에 둘지”만 기술한다.

## 6.1 프로젝트 MSW 지형도
- `mocks/initializeMsw.ts` → node(`mocks/server.ts`) / browser(`mocks/browser.ts`) 엔트리 확인
- 전역 기본 성공 핸들러 묶음: `mocks/handlers.ts` (기본 테스트는 여기만 사용)  
  → **새 기능 추가 시 이 파일에 성공 핸들러만 합쳐졌는지 확인**
- 기능별 핸들러: `mocks/<feature>/handler.ts` 혹은 `handlers.ts` 패턴 (성공 기본값 중심)  
  → 새 폴더가 생길 수 있으니 **매번 폴더 트리를 훑고 최신 상태를 반영**한다.
- **Test Path**: `project-manifest.yaml`의 `testPaths.dirName` (예: `_tests`)을 확인하여 테스트 위치를 파악한다.
- 기본 묶음에 없으면: 해당 기능 핸들러를 테스트에서 직접 `server.use`하거나 `createTestServer(customHandlers)`로 로드

## 6.2 실패/대체 핸들러 위치 (테스트 내부 override 전용)
- 실패/변형 핸들러는 **해당 기능 폴더** 안에 함께 두는 패턴(`handler.ts` 내 실패 배열, 또는 `errorHandlers.ts`)  
- 새 케이스가 필요하면 기능 폴더에 `errorHandlers.ts` 생성 제안(전역 `mocks/handlers.ts`에는 섞지 않음)  
- 테스트 작성 시: 기능 폴더를 열어 실패/edge 핸들러가 이미 있는지 확인 → 없으면 ad-hoc 정의 or `errorHandlers.ts`로 추가 제안

## 6.3 성공/실패 사용 규칙
- 기본 성공 플로우 = `mocks/handlers.ts`에 이미 정의된 핸들러 사용
- 실패/edge 플로우 = 해당 기능 폴더의 에러/변형 핸들러를 **server.use**로 테스트 안에서만 override
- `createTestServer(customHandlers)`로 특정 기능 성공 핸들러만 선택 로드 가능 (기본 묶음과 분리된 경우)
- **실패 핸들러 전역 등록 절대 금지**

---

# 7. Unit / Integration / Store 구분 핵심

## Unit
- utils
- hooks (without UI side effect)
- store.setState
- store.getState
- pure selector

👉 business-logic-test-prompt

---

## Integration
- render
- userEvent
- MSW API
- UI error
- router.push/reset

👉 ui-test-implementation-prompt

---

## Store
- Zustand / Recoil
- Hook 기반 접근 금지
- Vanilla store API
- pure derived values

👉 business-logic-test-prompt

---

# 8. Routing Prompt의 “금지 영역”

- 테스트 코드 직접 생성
- import / mock / server.use 작성
- 셀렉터 소스 코드 없이 추측
- MSW handler 구현
- waitFor 패턴 조작

---

---

# 9. Execution Steps (Chain of Thought) 🧠

> **단순히 Plan을 작성하지 말고, 아래 순서대로 사고(Thinking)한 뒤 최종 결과물을 출력하시오.**

## Step 1: Analyzing (분석)
- ATDD 시나리오를 읽고 Unit/Integration/E2E 범주를 파악한다.
- `project-manifest.yaml`의 `testPaths`와 `importAlias`를 확인한다.
- **제공된 소스 코드의 Import 구문을 정밀 분석한다.** (상수/타입 위치 파악)

## Step 2: Planning (설계)
- 시나리오별 적절한 프롬프트를 매핑한다.
- MSW 핸들러 전략(기본/Override)을 수립한다.

## Step 3: Auditing (검증)
- **Import Hallucination 체크**: 소스 코드에 없는 상수를 Plan에 적었는가?
- **E2E 번역 체크**: "화면이 보인다"를 `router.push` 검증으로 잘 변환했는가?
- **MSW 체크**: 핸들러를 직접 구현하라고 시키진 않았는가? (Planning만 해야 함)

## Step 4: Final Output (최종 출력)
- **Thinking Process**와 **Final Test Plan**을 분리하여 출력한다.

---

# 10. Output Format

반드시 아래 포맷을 지켜서 출력한다.

> **Thinking Process:**
> 1. **Analyzing**: ATDD 4개 시나리오 확인. 소스 코드에서 `CONTRACT_TYPE` 상수 확인 불가 -> 하드코딩 전략 선택.
> 2. **Planning**: S1, S2는 Integration, S3는 Unit으로 분류.
> 3. **Auditing**:
>    - Import: `PRIVATE_ROUTES`는 type import임. Value로 쓰지 않도록 주의 메모 추가.
>    - E2E: S4 "홈 이동" -> `router.push` 검증으로 변환 확인.
>
> **Final Output:**
> (아래 Markdown 내용)

---

# 11. 최종 출력 예시 (실제 UX)

> 아래는 ChatGPT가 출력해야 하는 **최종 포맷 예시**이다.

---

## 📌 Test Routing Plan — [FeatureName].test-plan.md

### 1. Scenario Table

| ID | Title | Level | Prompt | Why |
|----|------|------|--------|-----|
| S1 | [Integration] 로그인 성공 | Integration | ui-test-implementation | UI+API+router |
| S2 | [Integration] 잘못된 정보 → 에러 | Integration | ui-test-implementation | 실패 핸들링 |
| S3 | [Unit] 비밀번호 유효성 | Unit | business-logic | pure utils |
| S4 | [E2E] 로그인 후 홈 이동 | E2E→Integration | ui-test-implementation | router.reset only |

---

### 2. Implementation Notes

#### S1
- (Flow): render(LoginForm) -> 입력 -> 제출 -> waitFor UI 변화 -> expect(mockRouter.push)
- (Mock Requirement): POST /login -> { user: { id: 1 }, token: 'abc' }

#### S2
- (Flow): server.use(loginErrorHandler) -> 에러 toast 확인 -> expect(mockPush).not.toHaveBeenCalled()
- (Mock Requirement): 400 Bad Request, { error: 'INVALID' }

#### S3
- (Flow): utils/validatePassword 호출 -> edge case 확인
- (Mock Requirement): None (Pure Function)

#### S4 (E2E 변환 케이스)
- **ATDD Then:** "홈 화면이 보인다"
- **Translate to:** `expect(router.push).toHaveBeenCalledWith('/home')` (홈 화면 DOM 렌더링 검증 X)
- (Note): localStorage.setItem 검증 가능

---

### 3. Selector Policy
- 아이디 input: getByPlaceholderText('아이디')
- 비밀번호 input: getByPlaceholderText('비밀번호')
- 제출 버튼: getByRole('button', { name: '로그인' })

### 4. MSW Plan
- Success defaults: `mocks/handlers.ts` 사용
- Error overrides: `mocks/login/errorHandlers.ts` 사용 (S2)
- Queries: `useUserQuery` success handler

### 5. Execution Order
- P0: S1, S4 (핵심 플로우)
- P1: S2 (에러 처리)
- P2: S3 (Unit)

---

# 10. Routing Prompt = 컨트롤타워

> ATDD → 실 구현 프롬프트에 전달될 “작업 단위”를 설계한다.

- Unit 시나리오 묶음 → business-logic-test-prompt.md
- Integration 묶음 → ui-test-implementation-prompt.md
- E2E→Integration 묶음 → ui-test-implementation-prompt.md

---

# 11. 최종 Self-check

- [ ] test 코드 생성하지 않았는가?
- [ ] MSW handler 직접 만들지 않았는가?
- [ ] router 결과 = 호출 검증?
- [ ] UI selector = 정책만?
- [ ] Unit / Integration 혼재 없음?
- [ ] **E2E 시나리오를 올바르게 Integration 동작으로 번역했는가?**
- [ ] **시나리오에 조건부 분기("또는", "~이면 ~하고")가 있는가?**
- [ ] **각 분기를 Implementation Notes에 명시적으로 나열했는가?**
- [ ] **별도 테스트 케이스로 분리해야 함을 명시했는가?**

---

# 12. 산출물 전달 방식

**ChatGPT 결과를 파일로 저장하는 것을 가정.**

- 지정된 경로에 `.md` 파일로 저장.

- Markdown 표 유지
- 한글 설명 그대로
- 시나리오 ID와 Prompt 매핑 명확히

---

> 이 문서는 **AI 테스트 작성 workflow의 “오케스트레이터”**이다.  
> 실제 코드 생성은 **business-logic-test-prompt.md** or **ui-test-implementation-prompt.md**에서 진행된다.
