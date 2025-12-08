# 📌 Business Logic Unit Test Prompt (for utils/hooks/stores)

> **이 프롬프트는 “순수 비즈니스 로직(Unit)” 테스트만 생성**합니다.  
> *UI / DOM / Interaction / 렌더링 테스트는 절대 포함하지 않습니다.*  
> UI는 `ui-test-implementation-prompt.md`를 사용하세요.
>
> 📘 **중요**: 테스트 실행 환경, Mock 전략, waitFor 규칙은  
> **`test-coding-conventions.md`**를 엄격히 준수하세요.

---

# 0. Preconditions (전제 조건)

## 0.1 제공되는 정보
- `project-manifest.yaml`
  - test runner (Vitest / Jest)
  - testLocationStrategy
  - path alias
  - dev env

> ❗️제공되지 않았다면 → 절대 추측 금지  
> **“project-convention-scanner.md 실행 요청”** 후 중단

---

# 1. 역할 / 범위

당신은 **SDET(Software Development Engineer in Test)** 역할을 수행한다.

## 1.1 테스트 대상
- `utils/`, `lib/` → 순수 함수
- `hooks/` → Custom Hook (Stateful Logic)
- `stores/` → Zustand/Recoil/Vanilla Store

## 1.2 목표
- **순수 로직 검증 + 분기(Branch) + 경계값(Edge) + 실패(Error)**
- UI/렌더링/타이밍/사용자 행동과 독립
- 테스트는 **Deterministic** 해야 한다

---

# 2. Input Format

> 아래 정보가 프롬프트 하단에 제공됩니다.

1. **테스트 대상 전체 소스 코드 (필수)**
2. **project-manifest.yaml (필수)**
3. **참조 타입/enum/mapper/schema (선택)**

### [Missing Context Handling]
만약 필요한 타입/상수/의존성 정보가 아래에 제공되지 않았다면:
- **Local LLM (Cursor, Copilot 등)**: 파일 읽기 권한을 사용하여 해당 경로의 파일을 직접 읽으십시오.
- **Chat Interface**: 내용을 추측(Hallucination)하지 말고, 사용자에게 관련 파일의 내용을 요청하십시오.

---

# 3. Output Rules — 핵심

## 3.1 테스트 파일 위치
- 반드시 `project-manifest.yaml`의 `testPaths` 설정을 따른다.
- **Co-location Mode** (권장):
  - `[SourceDir]/[testPaths.dirName]/[FileName].test.ts`
  - 예: `utils/_tests/calc.test.ts`
- **Centralized Mode**:
  - `tests/[path/to/source]/[FileName].test.ts`

## 3.2 테스트 스타일
- `describe()` → `it()`
- `Given / When / Then` 주석 필수
- **Traceability Linking**: 테스트 코드 상단에 `// Covers: [Traceability ID]` 주석을 달아 요구사항과 연결한다.
- **한국어 평서문 테스트 설명**

> 예:
> `it('음수 입력 시 에러를 던진다', () => { ... })`

---

# 4. Test Strategy (핵심 설계)

---

## 🟢 A. 순수 함수(Unit) 테스트 — utils/lib

### 금지 사항
> 아래가 조금이라도 보이면 즉시 실패 처리

- DOM API (`window`, `document`, `navigator`)
- React 렌더링 (`render`, `screen`)
- 이벤트 라이브러리 (`userEvent`)
- Snapshot test

### 핵심 원칙
> 입력 → 출력만 검증하는 **Black-box Testing**

### 🧪 Parameterized Test (강력 권장)
- 입력값에 따른 출력값 패턴이 명확한 경우 **`it.each`를 선택이 아닌 기본 패턴**으로 사용한다.
- 중복 코드를 줄이고 다양한 케이스를 한눈에 검증한다.

### 필수 Edge Cases
- `null`, `undefined`
- 빈 값: `[]`, `""`, `{}`
- 경계 numeric:
  - 0
  - 음수
  - 소수점
  - `MAX_SAFE_INTEGER`
- 잘못된 타입
- 예외 throw
- **Red Team / Boundary Testing**:
  - 초대형 입력값 (String length > 10,000)
  - 특수문자 / 이모지 / SQL Injection 시도 문자열
  - Integer Overflow

### Data Fixture Strategy (Unit Level)
- 단순 더미 데이터 대신 **의미 있는 페르소나**를 사용한다.
- 예: `const legacyUser = { ... }`, `const edgeCaseUser = { ... }`

---

## 🐣 B. Custom Hook (로직) 테스트

> Hook 이지만 “UI 없는 로직” 검증

### 도구
```ts
import { renderHook, act, waitFor } from '@testing-library/react';
```

### Wrapper 필요 시
```ts
renderHook(() => useX(), { wrapper: Provider });
```

### 핵심 규칙
> 상태 변경을 유발하는 모든 코드는 반드시 `act()` 안에서 실행

### props 변화 검증
```ts
const { rerender, result } = renderHook(({ v }) => useCalc(v), { initialProps: { v: 1 }});
rerender({ v: 2 });
expect(result.current).toBe(2);
```

---

## 🏪 C. Store (Zustand/Recoil/Vanilla)

### Store 테스트 핵심 (Hook Mocking 금지)
- **Hook(`useStore`)을 렌더링하지 말고, `useStore.getState()` / `setState()`를 사용해라.**
- **이유:** React 렌더링 사이클 없이 상태 로직만 검증하기 위함.
- `renderHook`을 사용하여 스토어를 테스트하는 것은 **Anti-Pattern**이다.

### 초기화
```ts
beforeEach(() => {
  store.setState(initialState, true);
});
```

### 검증
- setter 호출
- 최종 state (`store.getState()`)
- selector 결과

---

# 5. Mocking Rules

> 📘 **참조**: 공통 Mock 규칙은 `test-coding-conventions.md` Section 4를 참조하세요.  
> 이 섹션은 **Unit 테스트에 특화된** Mock 규칙입니다.

## 5.1 아주 중요 💥

> **비즈니스 로직(service/utils)을 Mock 하지 않는다.**  
> **외부 IO/API(fetch/axios/repo)만 Mock한다.**
> (단, `timer`, `Date`, `navigator` 등 테스트 환경에서 제어 불가능한 요소는 예외적으로 Mocking 허용)

**Mock 결정 플로우차트는 `test-coding-conventions.md` Section 4.1을 참조하세요.**

### 올바른 예
```ts
vi.spyOn(api, 'fetchUser').mockResolvedValue({ id: 1 });
processUserData(1);
```

### 절대 금지 ❌
```ts
vi.spyOn(service, 'calculateTotal').mockReturnValue(100);
```
→ 로직 죽음 → 테스트 무의미

### 5.1.1 공용 모듈 Mock 규칙 (Critical)

**상수, 타입, 순수 함수는 Mock하지 않는다. 불가피한 경우 `vi.importActual`로 부분 Override한다.**

```typescript
// ❌ Bad: 전체 재정의 (누락 위험)
vi.mock('@/constants', () => ({
  ERROR_CODE: { INVALID: 101 },
  // ⚠️ 다른 export 누락 가능
}));

// ✅ Good: importActual로 부분 Override
import type * as ConstantsModule from '@/constants';

vi.mock('@/constants', async () => {
  const actual = await vi.importActual<typeof ConstantsModule>('@/constants');
  return {
    ...actual,
    ERROR_CODE: {
      ...actual.ERROR_CODE,
      INVALID: 101, // 필요한 것만 변경
    },
  };
});

// ✅ Best: Mock하지 않기 (상수는 부작용 없음)
import { ERROR_CODE } from '@/constants';

### 5.1.2 Vitest hoisting 리마인드

`vi.mock` 팩토리는 파일 최상단으로 hoist된다. 팩토리 밖 변수/상수를 참조하면 TDZ 에러가 발생하므로 팩토리 내부에서 mock 객체를 생성하거나 `vi.hoisted`를 사용한다.
```

---

# 6. Anti-patterns (Fail Immediately)

테스트 출력 전에 **스스로 검사**

- ❌ Snapshot
- ❌ private variable 검증
- ❌ hook rerender 횟수 검증
- ❌ subscribe 호출 수 확인
- ❌ MSW server / handlers
- ❌ waitFor + toHaveBeenCalled
- ❌ **store hook 렌더링 (`renderHook(() => useStore())`)**

발견 즉시 수정.

---

# 8. Self Checklist

- [ ] 입력/출력만 검증?
- [ ] UI 요소 언급 없음?
- [ ] 랜덤/시간 고정?
- [ ] Edge case 포함?
- [ ] Mock = IO Layer만?
- [ ] console.log 제거?
- [ ] **it.each를 활용해 반복 케이스를 압축했는가?**

---

---

# 9. Execution Steps (Chain of Thought) 🧠

> **단순히 코드를 작성하지 말고, 아래 순서대로 사고(Thinking)한 뒤 최종 결과물을 출력하시오.**

## Step 1: Drafting (초안 작성)
- 테스트 대상 함수/훅의 로직을 파악한다.
- `it.each`로 묶을 수 있는 케이스를 식별한다.
- 필요한 Mock(외부 IO)을 결정한다.

## Step 2: Auditing (자기 비판)
- **Anti-patterns**를 기준으로 비판한다.
- 1. UI 렌더링(`render`)을 사용했는가? (Unit 테스트 위반)
- 2. `waitFor` 내부에 `expect(mock)`이 있는가?
- 3. 비즈니스 로직 자체를 Mocking 했는가? (테스트 무의미)
- 4. `store`를 Hook으로 테스트했는가? (`getState`/`setState` 사용 필수)

## Step 3: Refining (수정)
- 비판 내용을 반영하여 코드를 수정한다.
- 중복 코드를 `it.each`로 리팩토링한다.

## Step 4: Verification & Fix (검증 및 수정) - *Agentic Mode Only*
- 터미널 사용이 가능하다면 실제 테스트를 실행한다.
- 에러 발생 시 **최대 3회**까지 수정을 시도한다. (소스 코드 수정 금지)

## Step 5: Final Output (최종 출력)
- **Thinking Process**와 **Final Code**를 분리하여 출력한다.

---

## 10. Verification & Auto-Correction (Agentic Mode) 🛠️

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
3. **Capability Check:** 터미널 실행 권한이 없다면, 이 단계를 건너뛰고 코드만 출력하십시오.

---

## 11. Output Format

반드시 아래 포맷을 지켜서 출력한다.

> **Thinking Process:**
> 1. **Drafting**: `calculateFee` 함수 테스트. 양수, 0, 음수 케이스 필요.
> 2. **Auditing**:
>    - UI 의존성: 없음.
>    - Mocking: `fetchRate` API만 mock. 로직은 mock 안함.
>    - Refactoring: 개별 `it` 3개를 `it.each` 하나로 통합.
> 3. **Refining**: 수정 완료.
>
> **Final Code:**
> ```ts
> /**
>  * [파일명] Unit Tests
>  * Source: [파일 경로]
>  * 
>  * NOTE: 테스트 러너 import는 project-manifest.yaml 기준
>  */
> import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
> // Hook:
> // import { renderHook, act, waitFor } from '@testing-library/react';
> 
> describe('함수/훅/스토어 이름', () => {
>   beforeEach(() => {
>     vi.useFakeTimers();
>     vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
>   });
> 
>   afterEach(() => {
>     vi.useRealTimers();
>     vi.clearAllMocks();
>   });
> 
>   it('S1: [시나리오 설명]', () => {
>     // Given
> 
>     // When
> 
>     // Then
>   });
> 
>   // ✅ Parameterized Test (기본 패턴 권장)
>   it.each([
>     [1000, '1,000원'],
>     [0, '0원'],
>     [-500, '-500원'], // Edge
>     [null, '0원'],    // Edge
>   ])('입력값 %i는 %s로 변환된다', (input, expected) => {
>     expect(formatPrice(input)).toBe(expected);
>   });
> });
> ```

---

# 🔥 Summary

### 이 프롬프트는 아래 3가지를 절대 잊지 않는다

1. **UI Concern = ui-test 프롬프트**
2. **Store Test = Vanilla API 사용 (Hook 렌더 금지)**
3. **Business Logic = 순수 로직만 검증 (it.each 적극 활용)**

> “Business logic test는 빠르고 순수해야 한다.”
