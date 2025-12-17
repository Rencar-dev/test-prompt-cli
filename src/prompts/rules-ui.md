<!-- Source: rules-ui.md -->
# 📘 Test Coding Conventions - UI Test Rules

> **이 문서는 UI 컴포넌트 테스트에만 적용되는 규칙을 정의합니다.**
> Element 선택자, 클릭 전략, UI 대기 패턴 등을 다룹니다.

---

## 1. Element Selector Priority (Critical)

> **목적**: 접근성(Accessibility) 개선과 테스트 안정성을 동시에 향상한다.

### 1.1 선택자 우선순위 규칙

**Testing Library의 우선순위를 반드시 준수하라:**

```
1순위: getByRole ⭐⭐⭐⭐⭐ (최우선)
2순위: getByLabelText ⭐⭐⭐⭐
3순위: getByPlaceholderText ⭐⭐⭐
4순위: getByText ⭐⭐
5순위: getByTestId (최후의 수단)
❌ 금지: querySelector, xpath, getByClassName
```

**왜 이 순서를 따라야 하는가?**
- **getByRole**: 스크린 리더 사용자가 경험하는 방식과 동일하게 테스트
- **getByLabelText**: 폼 요소의 접근성 확보
- **getByTestId**: 코드 변경 시에만 깨지지만, 접근성 개선과는 무관

### 1.2 올바른 예시

```typescript
// ✅ 1순위: getByRole (최우선 사용)
const submitButton = screen.getByRole('button', { name: /제출/ });
const usernameInput = screen.getByRole('textbox', { name: /아이디/ });
const checkbox = screen.getByRole('checkbox', { name: /약관 동의/ });

// ✅ 2순위: getByLabelText (폼 요소)
const passwordInput = screen.getByLabelText('비밀번호');
const emailInput = screen.getByLabelText(/이메일/);

// ✅ 3순위: getByPlaceholderText (label이 없는 경우만)
const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');

// ✅ 4순위: getByText (버튼/링크가 아닌 텍스트 검증)
const errorMessage = screen.getByText('잘못된 입력입니다');

// ⚠️ 5순위: getByTestId (다른 방법이 없을 때만)
const complexWidget = screen.getByTestId('date-range-picker');
```

### 1.3 잘못된 예시 (Anti-Pattern)

```typescript
// ❌ Bad: data-testid 남발
const button = screen.getByTestId('submit-button'); // getByRole 사용 가능한데도 testid 사용
const input = screen.getByTestId('username-input'); // getByRole 또는 getByLabelText 사용 가능

// ❌ Bad: querySelector 사용 (절대 금지)
const button = container.querySelector('.submit-btn'); // Testing Library 철학 위배

// ❌ Bad: xpath 사용 (절대 금지)
const element = screen.getByXPath('//button[@class="submit"]');

// ❌ Bad: className으로 선택
const element = screen.getByClassName('btn-primary');
```

### 1.4 Role 사용 가이드

**자주 사용하는 Role 목록:**

| HTML 요소 | Role | 예시 |
|----------|------|------|
| `<button>` | `button` | `getByRole('button', { name: /클릭/ })` |
| `<input type="text">` | `textbox` | `getByRole('textbox', { name: /이름/ })` |
| `<input type="checkbox">` | `checkbox` | `getByRole('checkbox', { name: /동의/ })` |
| `<input type="radio">` | `radio` | `getByRole('radio', { name: /옵션/ })` |
| `<a>` | `link` | `getByRole('link', { name: /자세히/ })` |
| `<select>` | `combobox` | `getByRole('combobox', { name: /선택/ })` |
| `<h1> ~ <h6>` | `heading` | `getByRole('heading', { name: /제목/ })` |
| `<img>` | `img` | `getByRole('img', { name: /로고/ })` |

**Level 지정 (heading):**
```typescript
// ✅ h1
screen.getByRole('heading', { name: /페이지 제목/, level: 1 });

// ✅ h2
screen.getByRole('heading', { name: /섹션 제목/, level: 2 });
```

### 1.5 Self-Check

**테스트 작성 후 체크리스트:**
- [ ] `getByTestId`를 사용했다면, `getByRole`로 대체 가능한지 재검토했는가?
- [ ] `querySelector`나 `getByClassName`을 사용하지 않았는가?
- [ ] 모든 폼 요소가 적절한 `label` 또는 `aria-label`을 가지는가?
- [ ] 버튼/링크가 명확한 접근 가능한 이름(`name` 옵션)을 가지는가?

---

## 2. Robust Click Strategy (Critical)

> **목적**: Playwright/Testing Library에서 간헐적 클릭 실패(Flaky)를 방지한다.

### 2.1 4단계 폴백 전략

**클릭이 실패할 경우 다음 순서로 시도하라:**

```typescript
/**
 * Robust Click: 4단계 폴백 전략
 * 1. Enter 키 시도
 * 2. 일반 클릭
 * 3. Force 클릭 (pointer-events 무시)
 * 4. JavaScript 직접 실행
 */
async function robustClick(element: HTMLElement) {
  try {
    // 1단계: Enter 키 (가장 안전)
    await user.type(element, '{Enter}');
    return;
  } catch (e1) {
    try {
      // 2단계: 일반 클릭
      await user.click(element);
      return;
    } catch (e2) {
      try {
        // 3단계: Force 클릭 (pointer-events 무시)
        await user.click(element, { pointerEventsCheck: 0 });
        return;
      } catch (e3) {
        // 4단계: JavaScript 직접 실행 (최후의 수단)
        element.click();
      }
    }
  }
}
```

### 2.2 언제 사용하는가?

**일반 클릭으로 충분한 경우:**
```typescript
// ✅ 대부분의 경우: 일반 클릭 사용
await user.click(screen.getByRole('button', { name: /제출/ }));
```

**Robust Click이 필요한 경우:**
- Modal overlay나 다른 요소에 의해 버튼이 가려진 경우
- CSS transition/animation이 진행 중인 요소
- 간헐적으로 "Element is not clickable" 에러가 발생하는 경우

```typescript
// ✅ 복잡한 UI: Robust Click 사용
const submitButton = screen.getByRole('button', { name: /제출/ });
await robustClick(submitButton);
```

### 2.3 재사용 가능한 유틸 함수로 추상화

**프로젝트에 `tests/utils/robustClick.ts` 파일 생성 권장:**

```typescript
// tests/utils/robustClick.ts
import { userEvent } from '@testing-library/user-event';

export async function robustClick(element: HTMLElement) {
  const user = userEvent.setup();
  // ... 위의 4단계 폴백 로직
}
```

---

## 3. Safe Wait Strategy (Critical)

> **목적**: `networkidle` 대기의 불안정성을 해결하고 UI 앵커 기반 대기로 안정성을 향상한다.

### 3.1 기본 원칙

**❌ Bad: 네트워크 대기 (불안정)**
```typescript
// 네트워크 폴링, Lazy Loading 등으로 인해 자주 실패
await page.waitForLoadState('networkidle');
```

**✅ Good: UI 앵커 기반 대기**
```typescript
// 특정 UI 요소가 나타날 때까지 대기
await waitFor(() =>
  expect(screen.getByText('로딩 완료')).toBeInTheDocument()
);
```

### 3.2 올바른 대기 패턴

**1. 로딩 상태가 사라질 때까지 대기**
```typescript
// ✅ Good: 로딩 스피너가 사라질 때까지 대기
await waitFor(() =>
  expect(screen.queryByText('로딩중...')).not.toBeInTheDocument()
);
```

**2. 데이터가 렌더링될 때까지 대기**
```typescript
// ✅ Good: 사용자 이름이 나타날 때까지 대기
await waitFor(() =>
  expect(screen.getByText('홍길동')).toBeInTheDocument()
);
```

**3. 버튼 활성화를 대기**
```typescript
// ✅ Good: 제출 버튼이 활성화될 때까지 대기
await waitFor(() =>
  expect(screen.getByRole('button', { name: /제출/ })).toBeEnabled()
);
```

### 3.3 Anti-Pattern

```typescript
// ❌ Bad: 임의의 시간 대기
await new Promise(resolve => setTimeout(resolve, 1000));

// ❌ Bad: 네트워크 idle 대기
await page.waitForLoadState('networkidle');

// ❌ Bad: Mock 호출 대기 (이미 동기적으로 발생)
await waitFor(() => expect(mockFn).toHaveBeenCalled());
```

### 3.4 Self-Check

**테스트 작성 후 체크리스트:**
- [ ] `setTimeout`이나 `sleep`을 사용하지 않았는가?
- [ ] `networkidle` 대신 UI 앵커 기반 대기를 사용했는가?
- [ ] `waitFor`를 Mock 호출 검증에 사용하지 않았는가?
- [ ] 대기 조건이 명확하고 결정적(Deterministic)인가?
