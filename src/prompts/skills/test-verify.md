---
name: test-verify
description: |
  테스트 코드 구현 완료 후 검증할 때 호출합니다.
  1) 실행 검증: TypeScript, Lint, 테스트 실행
  2) 코드 패턴 검증: P0/P1/P2 체크리스트 점검
---

# test-verify

테스트 코드가 실행되고 프로젝트 규칙을 준수하는지 검증합니다.

---

## 1. 실행 검증 (Execution Checks)

테스트 코드가 실제로 실행 가능한지 확인합니다.

> ⚠️ **필수**: 실행 검증 전에 반드시 `project-manifest.yaml` 파일을 읽고 명령어를 확인하세요.
> ❌ **금지**: 예시 명령어나 추론된 명령어 사용 (예: `next lint`, `npx tsc` 등)

### 1.1 TypeScript 검사

1. `project-manifest.yaml` 파일 읽기
2. `typeCheckCommand` 값 추출
3. 해당 명령어 **그대로** 실행

```bash
# project-manifest.yaml 예시:
# typeCheckCommand: yarn tsc --noEmit --skipLibCheck
```

**실패 시 처리**:
1. 에러 메시지 분석
2. 타입 오류 수정 (import 경로, 타입 불일치 등)
3. 재검사하여 통과 확인

### 1.2 Lint 검사

1. `project-manifest.yaml` 파일에서 `lintCommand` 값 확인
2. 해당 명령어에 테스트 파일 경로 추가하여 **그대로** 실행

```bash
# project-manifest.yaml 예시:
# lintCommand: yarn eslint --fix
# → 실행: yarn eslint --fix [테스트 파일 경로]
```

**실패 시 처리**:
1. 미사용 import/변수 **즉시 제거**
2. 포맷팅 오류 수정
3. 재검사하여 통과 확인

### 1.3 테스트 실행

1. `project-manifest.yaml` 파일에서 `testCommand` 값 확인
2. 해당 명령어에 테스트 파일 경로 추가하여 **그대로** 실행

```bash
# project-manifest.yaml 예시:
# testCommand: yarn vitest run
# → 실행: yarn vitest run [테스트 파일 경로]
```

**실패 시 처리**:
1. 에러 로그 분석 (assertion 실패, timeout, mock 오류 등)
2. 원인에 따라 테스트 코드 수정
3. 최대 **3회 재시도** 후에도 실패하면 원인 보고

### 실행 검증 체크리스트

```
□ TypeScript 컴파일 통과
□ Lint 에러 없음 (미사용 import/변수 포함)
□ 테스트 실행 통과
```

> **중요**: 실행 검증을 모두 통과해야 코드 패턴 검증으로 진행합니다.

---

## 2. 코드 패턴 검증 (Code Pattern Checks)

테스트 코드가 프로젝트의 Best Practice를 따르는지 검증합니다.

### P0 - 반드시 확인 (위반 시 즉시 수정)

### 1. vi.mock 호이스팅 규칙
```typescript
// ❌ Bad: 외부 변수 참조 → ReferenceError
const mockStorage = { getItem: vi.fn() };
vi.mock('@/utils', () => ({ storage: mockStorage }));

// ✅ Good: factory 내부에서 생성
vi.mock('@/utils', () => ({
  storage: { getItem: vi.fn() },
}));
```

### 2. vi.hoisted 패턴 적용
동적 상태 변경이 필요한 Mock에 `vi.hoisted` 사용 여부 확인:
```typescript
// ✅ Good
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));
```

### 3. waitFor 내부 expect만 사용
```typescript
// ❌ Bad: waitFor 내부에서 액션 수행
await waitFor(async () => {
  await user.click(button);
  expect(result).toBe(true);
});

// ✅ Good: waitFor는 expect만
await user.click(button);
await waitFor(() => {
  expect(result).toBe(true);
});
```

### 4. MSW URL 절대 경로
```typescript
// ❌ Bad
http.post('/auth', () => ...)

// ✅ Good
const API_BASE_URL = process.env.BACKEND_URL;
http.post(`${API_BASE_URL}/auth`, () => ...)
```

### 5. 렌더링 직후 기본 UI 검증
```typescript
// ✅ Good: render 직후 기본 요소 검증
renderWithProviders(<LoginPage />);
expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument();
```

### 6. 미사용 import/변수 없음
```bash
# 확인 명령어 (프로젝트 설정과 무관하게 강제)
yarn eslint --rule '@typescript-eslint/no-unused-vars: error' [테스트 파일 경로]
```
- 사용하지 않는 import **제거**
- 사용하지 않는 변수 (vi.hoisted 결과 포함) **제거**

---

## P1 - 권장 (누락 시 경고)

### 7. Promise pending 테스트 패턴
응답이 오지 않는 시나리오에 `new Promise(() => {})` 사용 여부:
```typescript
// ✅ Good
mockPayment.mockReturnValue(new Promise(() => {}));
```

### 8. Toast/Alert 메시지 내용 검증
```typescript
// ❌ Bad: 존재 여부만 확인
expect(toasts.length).toBeGreaterThan(0);

// ✅ Good: 메시지 내용까지 확인
expect(toasts.some(t => t.message === '반납이 완료되었습니다.')).toBe(true);
```

### 9. POM 패턴 추출 대상
3개 이상의 `it` 블록에서 동일한 selector/action 사용 시 추출 권장.

**중복 감지 시 추출 코드 제안**:
```typescript
// ❌ Bad: 동일 selector 반복 (17회)
screen.getByPlaceholderText('아이디');
screen.getByPlaceholderText('비밀번호');
screen.getByRole('button', { name: '로그인' });

// ✅ Good: 헬퍼 객체로 추출
const elements = {
  idInput: () => screen.getByPlaceholderText('아이디'),
  passwordInput: () => screen.getByPlaceholderText('비밀번호'),
  loginButton: () => screen.getByRole('button', { name: '로그인' }),
};

// 사용
await user.type(elements.idInput(), 'testuser');
```

### 10. Assertion 품질
테스트의 신뢰성을 위해 Assertion이 충분히 구체적인지 확인:

```typescript
// ❌ Bad: 약한 assertion
expect(mockReset).toHaveBeenCalled();
expect(screen.getByText('완료')).toBeInTheDocument();

// ✅ Good: 강한 assertion (인자, 상태까지 검증)
expect(mockReset).toHaveBeenCalledWith(PRIVATE_ROUTES.HOME, {
  webRouteType: 'replace',
});
expect(screen.getByText('로그인이 완료되었습니다.')).toBeVisible();
```

**체크 항목**:
- [ ] Mock 함수 호출 검증에 **인자까지** 검증하는가?
- [ ] `toBeInTheDocument()` 외에 `toBeVisible()`, `toHaveValue()` 등 구체적 matcher 사용하는가?
- [ ] 단일 테스트에 assertion이 최소 1개 이상 있는가?

### 11. 테스트 독립성
테스트 간 순서 의존성은 flaky test의 주요 원인:

```typescript
// ❌ Bad: 전역 상태 오염
let sharedState = {};
it('테스트 1', () => { sharedState.value = 1; });
it('테스트 2', () => { expect(sharedState.value).toBe(1); }); // 순서 의존

// ✅ Good: 각 테스트에서 상태 초기화
beforeEach(() => {
  vi.clearAllMocks();
  server.resetHandlers();
  userStore.setState({ user: null });
});
```

**체크 항목**:
- [ ] `beforeEach`에서 Mock/Store 상태 초기화하는가?
- [ ] `server.use()` override 후 `server.resetHandlers()` 호출하는가?
- [ ] 테스트 간 공유 변수를 수정하지 않는가?

---

## P2 - 선택 (참고용)

### 12. prettyDOM 설정
`tests/setup.ts`에 에러 메시지 개선 설정 여부.

### 13. Fake timers 정리
```typescript
// ✅ Good: 사용 후 반드시 해제
vi.useFakeTimers();
// ... 테스트 ...
vi.useRealTimers();
```

### 14. Module Path Mock
barrel export와 직접 import 경로 둘 다 mock 여부:
```typescript
vi.mock('@/hooks', () => ({ useCustomRouter: () => ({ push: mockPush }) }));
vi.mock('@/hooks/useCustomRouter', () => ({ useCustomRouter: () => ({ push: mockPush }) }));
```

### 15. 테스트 성능
느린 테스트는 개발 생산성을 저하시킴.

`project-manifest.yaml`의 `testCommand`에 verbose 옵션 추가하여 실행 시간 확인:

```bash
# 예시 (vitest)
yarn vitest run --reporter=verbose [테스트 파일 경로]

# 예시 (jest)
yarn jest --verbose [테스트 파일 경로]
```

**체크 항목**:
- [ ] 단일 테스트 실행 시간이 5초를 초과하지 않는가?
- [ ] 불필요한 `waitFor` timeout이 없는가? (기본값 1000ms 권장)
- [ ] `waitFor` 내부에서 불필요하게 긴 polling interval을 사용하지 않는가?

```typescript
// ❌ Bad: 불필요하게 긴 timeout
await waitFor(() => expect(...), { timeout: 10000 });

// ✅ Good: 적절한 timeout (기본값 사용 또는 명시)
await waitFor(() => expect(...)); // 기본 1000ms
```

---

## 출력 형식

> **중요**: 실행 검증 결과에 **사용한 명령어**를 반드시 포함하세요.
> 이를 통해 Main Agent가 올바른 명령어 사용 여부를 확인할 수 있습니다.

```
## test-verify 검증 결과

### 1. 실행 검증
- ✅ TypeScript (`yarn tsc --noEmit --skipLibCheck`): 컴파일 통과
- ✅ Lint (`yarn eslint --fix [경로]`): 에러 없음
- ✅ 테스트 (`yarn vitest run [경로]`): 15/15 통과 (0.8초)

### 2. 코드 패턴 검증

#### P0 (필수)
- ✅ vi.mock 호이스팅: 외부 변수 참조 없음
- ❌ vi.hoisted 패턴: line 45 - mockPush가 vi.hoisted 없이 사용됨
  → 수정: vi.hoisted로 감싸서 선언
- ✅ waitFor 사용: expect만 포함
- ✅ MSW URL: 절대 경로 사용
- ✅ 렌더링 검증: 기본 UI 확인 있음
- ✅ 미사용 import: 없음

#### P1 (권장)
- ⚠️ Toast 검증: line 78 - 메시지 내용 검증 누락
  → 권장: 메시지 내용까지 검증 추가
- ⚠️ POM 패턴: screen.getByPlaceholderText('아이디') 17회 반복
  → 권장: elements 객체로 추출
- ✅ Assertion 품질: Mock 호출에 인자 검증 포함
- ✅ 테스트 독립성: beforeEach에서 상태 초기화 있음

#### P2 (선택)
- ℹ️ Fake timers: 사용하지 않음
- ℹ️ 테스트 성능: 평균 0.5초 (양호)

---
위반 항목: 1개 (P0)
경고 항목: 2개 (P1)
→ P0 항목 수정 후 다시 검증하세요.
```
