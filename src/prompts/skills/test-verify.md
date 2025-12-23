---
name: test-verify
description: |
  테스트 코드 구현 완료 후 규칙 준수 여부를 검증할 때 호출합니다.
  vi.mock 호이스팅, waitFor 패턴, MSW URL 등 P0/P1/P2 체크리스트를 점검합니다.
---

# test-verify

테스트 코드가 프로젝트 규칙을 준수하는지 검증합니다.

## 검증 절차

1. 생성된 테스트 파일을 읽습니다.
2. 아래 체크리스트를 P0 → P1 → P2 순서로 검증합니다.
3. 위반 항목을 리포트하고 수정 방법을 제안합니다.

---

## P0 - 반드시 확인 (위반 시 즉시 수정)

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

---

## P1 - 권장 (누락 시 경고)

### 6. Promise pending 테스트 패턴
응답이 오지 않는 시나리오에 `new Promise(() => {})` 사용 여부:
```typescript
// ✅ Good
mockPayment.mockReturnValue(new Promise(() => {}));
```

### 7. Toast/Alert 메시지 내용 검증
```typescript
// ❌ Bad: 존재 여부만 확인
expect(toasts.length).toBeGreaterThan(0);

// ✅ Good: 메시지 내용까지 확인
expect(toasts.some(t => t.message === '반납이 완료되었습니다.')).toBe(true);
```

### 8. POM 패턴 추출 대상
3개 이상의 `it` 블록에서 동일한 selector/action 사용 시 추출 권장.

---

## P2 - 선택 (참고용)

### 9. prettyDOM 설정
`tests/setup.ts`에 에러 메시지 개선 설정 여부.

### 10. Fake timers 정리
```typescript
// ✅ Good: 사용 후 반드시 해제
vi.useFakeTimers();
// ... 테스트 ...
vi.useRealTimers();
```

### 11. Module Path Mock
barrel export와 직접 import 경로 둘 다 mock 여부:
```typescript
vi.mock('@/hooks', () => ({ useCustomRouter: () => ({ push: mockPush }) }));
vi.mock('@/hooks/useCustomRouter', () => ({ useCustomRouter: () => ({ push: mockPush }) }));
```

---

## 출력 형식

```
## test-verify 검증 결과

### P0 (필수)
- ✅ vi.mock 호이스팅: 외부 변수 참조 없음
- ❌ vi.hoisted 패턴: line 45 - mockPush가 vi.hoisted 없이 사용됨
  → 수정: vi.hoisted로 감싸서 선언
- ✅ waitFor 사용: expect만 포함
- ✅ MSW URL: 절대 경로 사용
- ✅ 렌더링 검증: 기본 UI 확인 있음

### P1 (권장)
- ⚠️ Toast 검증: line 78 - 메시지 내용 검증 누락
  → 권장: 메시지 내용까지 검증 추가

### P2 (선택)
- ℹ️ Fake timers: 사용하지 않음

---
위반 항목: 1개 (P0)
경고 항목: 1개 (P1)
→ P0 항목 수정 후 다시 검증하세요.
```
