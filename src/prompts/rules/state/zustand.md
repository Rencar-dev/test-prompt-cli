# Zustand 테스트 규칙

## Meta

```yaml
scope: stateManagement=zustand
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 stateManagement가 zustand
> - 테스트 대상이 Zustand 스토어를 import

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| CODE-003 | beforeEach에서 상태 초기화 | setState로 수동 리셋 필수 | 모듈 레벨 싱글톤 |

### Add

- [ZUS-001] setState 두 번째 인자 금지
- [ZUS-002] 스토어 초기화 패턴
- [ZUS-003] 스토어 메서드 검증
- [ZUS-004] 스토어 상태 검증
- [ZUS-005] Store Mock 완전성

---

## 3. 주제 특화 규칙

### 3.1 setState 두 번째 인자 [ZUS-001]

**`setState`의 두 번째 인자 `true`는 전체 교체(replace) 모드로, 모든 메서드가 삭제됩니다.**

#### DO / DON'T

```
MUST: setState 두 번째 인자 생략 (병합 모드)
MUST: 병합 모드에서 필요한 상태만 업데이트

MUST NOT: setState(state, true) 사용 (메서드 손실)
```

```typescript
// ❌ 절대 금지 (메서드 손실)
beforeEach(() => {
  userStore.setState({ user: null, isLogin: null }, true);
  // → TypeError: setUser is not a function
});

// ✅ Good: 두 번째 인자 생략 (병합 모드)
beforeEach(() => {
  userStore.setState({ user: null, isLogin: null, companyId: null });
  loadingStore.setState({ isLoading: false });
});

// ✅ Good: getState 활용 (더 안전)
beforeEach(() => {
  const currentState = userStore.getState();
  userStore.setState({
    ...currentState,
    user: null,
    isLogin: null,
  });
});
```

---

### 3.2 스토어 초기화 패턴 [ZUS-002]

**모든 테스트는 `beforeEach`에서 Store를 초기화합니다.**

#### 기본 패턴

```typescript
const resetStores = () => {
  userStore.setState({
    user: null,
    isLogin: null,
    companyId: null,
  });
  loadingStore.setState({
    isLoading: false,
  });
};

beforeEach(() => {
  resetStores();
});
```

#### Decision Tree

```
Q1: 테스트에서 스토어 상태가 필요한가?
├─ YES
│   Q1-1: 초기 상태가 필요한가?
│   ├─ YES → beforeEach에서 setState로 초기화
│   └─ NO → beforeEach에서 원하는 상태로 설정
│
└─ NO
    Q2: 자식 컴포넌트가 스토어를 사용하는가?
    ├─ YES → 자식이 사용하는 스토어도 초기화 필요
    └─ NO → 초기화 불필요
```

---

### 3.3 스토어 메서드 검증 [ZUS-003]

**초기화 후 메서드가 정상 동작하는지 확인합니다.**

```typescript
describe('LoginPage', () => {
  beforeEach(() => {
    resetStores();

    // ✅ 메서드가 함수인지 확인
    expect(typeof userStore.getState().setUser).toBe('function');
    expect(typeof userStore.getState().setCompanyId).toBe('function');
  });
});
```

---

### 3.4 스토어 상태 검증 [ZUS-004]

**UI에 직접 드러나지 않는 Store 상태 변화도 검증합니다.**

#### DO / DON'T

```
MUST: 액션 호출 후 스토어 상태 변화 검증
MUST: vi.spyOn으로 액션 호출 검증
MUST: toHaveBeenCalledWith로 인자까지 검증

MUST NOT: 호출 여부만 검증 (Weak Assertion)
```

```typescript
// Given: 스토어 액션 스파이
const setItemSpy = vi.spyOn(useCartStore.getState(), 'setItem');

// When: 사용자 액션
await userEvent.click(screen.getByRole('button', { name: /장바구니 추가/ }));

// Then: 스토어 액션 호출 검증 (인자 포함)
expect(setItemSpy).toHaveBeenCalledWith({ productId: 'P123', quantity: 1 });
```

---

### 3.5 Store Mock 완전성 [ZUS-005]

**테스트 대상과 자식 컴포넌트가 사용하는 모든 Store를 확인합니다.**

#### DO / DON'T

```
MUST: 자식 컴포넌트가 사용하는 store도 초기화
MUST: 간접 의존성 체크리스트 확인

MUST NOT: 부모 컴포넌트의 store만 초기화
```

```typescript
// LoginPage.tsx
import { useUserStore, useLoadingStore } from '@/stores';

// FullScreenContainer.tsx (자식 컴포넌트)
import { useFullScreenContainerStore } from '@/stores';

// ✅ 모든 store 초기화 필요
beforeEach(() => {
  userStore.setState({ ... });
  loadingStore.setState({ ... });
  fullScreenContainerStore.setState({ ... }); // 자식이 사용하는 store도 포함
});
```

#### 간접 의존성 체크리스트

```
□ 테스트 대상 컴포넌트가 사용하는 모든 store/hook 확인
□ 자식 컴포넌트가 사용하는 store/hook 확인
□ 각 의존성을 beforeEach에서 초기화
```

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| `setState(state, true)` | 메서드 삭제됨 | 두 번째 인자 생략 |
| 초기화 없이 테스트 | 테스트 간 상태 오염 | beforeEach에서 setState |
| 부모 store만 초기화 | 자식 컴포넌트 에러 | 모든 의존 store 초기화 |
| 스토어 내부 구현 접근 | 리팩토링에 취약 | 공개 API만 테스트 |

---

## 5. Self-Check

```
□ [ZUS-001] setState의 두 번째 인자를 사용하지 않았는가?
□ [ZUS-002] beforeEach에서 store를 초기화했는가?
□ [ZUS-003] 초기화 후 store 메서드가 함수인지 확인했는가?
□ [ZUS-004] 액션 호출 시 인자까지 검증했는가? (toHaveBeenCalledWith)
□ [ZUS-005] 자식 컴포넌트가 사용하는 store도 초기화했는가?
```

---

## 6. Quick Reference

```typescript
import { useUserStore, useCartStore } from '@/stores';

// 스토어 참조 (테스트 파일에서)
const userStore = useUserStore;
const cartStore = useCartStore;

// 초기화 함수
const resetStores = () => {
  userStore.setState({
    user: null,
    isLogin: false,
  });
  cartStore.setState({
    items: [],
    total: 0,
  });
};

beforeEach(() => {
  resetStores();
});

// 액션 스파이
const setUserSpy = vi.spyOn(userStore.getState(), 'setUser');

// 상태 직접 설정 (테스트 시나리오용)
beforeEach(() => {
  userStore.setState({
    user: { id: 1, name: '홍길동' },
    isLogin: true,
  });
});

// 셀렉터 테스트
it('사용자 이름이 표시된다', () => {
  userStore.setState({ user: { id: 1, name: '홍길동' } });
  render(<UserProfile />);
  expect(screen.getByText('홍길동')).toBeInTheDocument();
});
```
