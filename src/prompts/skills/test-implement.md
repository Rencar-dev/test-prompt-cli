---
name: test-implement
description: |
  테스트 코드 작성 시 호출합니다.
  공통 규칙, 테스트 타입별 규칙, ATDD 시나리오 구현 규칙을 안내합니다.
---

# test-implement

테스트 코드 작성 시 필요한 규칙을 제공합니다.

---

{{COMMON_RULES}}

---

{{TYPE_SPECIFIC_RULES}}

---

## ATDD 시나리오 구현 규칙

### 1. 시나리오 ID/제목 원문 유지

- `it` 제목은 ATDD/Plan의 **원문 그대로** 사용
- 임의로 요약하거나 의역 금지
- 예: `it('[S1] 반납 일시와 유류/주행 값을 입력하고 반납 완료를 누르면 제출 요청이 발생한다', ...)`

---

### 2. E2E→Integration 변환 규칙

ATDD에 `[E2E]` 태그가 붙은 시나리오는:
- 실제 화면 DOM 렌더링 검증을 하지 않음
- `router.push/replace/reset` 호출 여부와 파라미터만 검증
- 반드시 주석 추가: `// E2E→Integration: router 호출만 검증`

```typescript
// (Note): E2E 시나리오이지만 실제 화면 DOM 렌더링 검증은 하지 않고 router 호출만 검증
// P0 규칙: Mock 검증은 waitFor 밖에서 동기 처리
await waitFor(() =>
  expect(screen.queryByText('로딩중')).not.toBeInTheDocument()
);
expect(routerMocks.replace).toHaveBeenCalledWith('/dashboard');
```

---

### 3. 시나리오 분기 처리

**조건부 분기가 있는 시나리오는 각 분기를 별도 테스트로 분리:**

```typescript
// ✅ Good: 분기별로 별도 테스트
it('[S1-1] 연동 차량이 아닌 경우 직전 화면으로 돌아간다', async () => {
  server.use(handler({ useConnect: false }));
  // ...
  expect(routerMocks.back).toHaveBeenCalledTimes(1);
});

it('[S1-2] 연동 차량인 경우 주행 평가 페이지로 이동한다', async () => {
  server.use(handler({ useConnect: true }));
  // ...
  expect(routerMocks.replace).toHaveBeenCalledWith(...);
});
```

---

### 4. 초기값 검증 주의사항

- 실제 소스 코드(useState, useEffect)를 확인
- 변환 로직(trim, toLowerCase 등) 적용 여부 확인
- 시나리오와 불일치 시 주석으로 명시

```typescript
// NOTE: 실제 구현은 useState(initialId ?? '')로 초기값에 trim이 적용되지 않음
// 시나리오는 "공백 제거"를 명시하지만, 실제로는 onChange에서만 trim 적용됨
expect(screen.getByPlaceholderText('아이디')).toHaveValue('  prefillUser  ');
```

---

### 5. Import 경로 규칙

- **Alias Import (`@/...`)**: 소스 코드 경로를 100% 그대로 복사
- **Relative Import (`./`, `../`)**: 테스트 파일 위치에 맞춰 깊이 조정
- 상대 경로를 임의로 Alias로 바꾸지 말 것

---

## Red Team / Negative Testing

**당신은 Red Team QA 엔지니어입니다.** 기능이 "작동하는지"보다 **"어떻게 하면 망가뜨릴 수 있을지"**를 고민하세요.

### 필수 포함 시나리오

| 유형 | 설명 |
|-----|------|
| Validation Attack | `<script>`, 초장문 텍스트, 이모지 입력 |
| Network Chaos | API 500 에러, 10초 지연 (Loading) |
| Interaction Spam | 버튼 연타 (Double Submit) |

### 예시: Double Submit 방어

```typescript
it('제출 버튼을 연타해도 API가 1회만 호출된다', async () => {
  const user = userEvent.setup();
  renderWithProviders(<SubmitForm />);

  const submitBtn = screen.getByRole('button', { name: '제출' });

  // 빠르게 3번 클릭
  await user.click(submitBtn);
  await user.click(submitBtn);
  await user.click(submitBtn);

  // API는 1회만 호출
  expect(mockSubmitApi).toHaveBeenCalledTimes(1);
});
```

---

## Data Fixture Strategy

테스트 코드 작성 전 **3가지 데이터 페르소나**를 정의하세요:

| 페르소나 | 설명 |
|---------|------|
| Happy User | 모든 필드 완벽 (정상 케이스) |
| Edge User | 경계값 (100자 이름, 특수문자) |
| Legacy User | 필수값 일부 누락 (구 데이터) |

```typescript
// ✅ Good: 도메인 맥락 있는 fixture
const happyUser = { name: '홍길동', email: 'hong@example.com' };
const edgeUser = { name: 'A'.repeat(100), email: 'edge@test.com' };

// ❌ Bad: 의미 없는 더미 데이터
const user1 = { name: 'foo', email: 'bar' };
```

---

## 간접 의존성 체크리스트

자식 컴포넌트의 의존성도 반드시 확인:

- [ ] 테스트 대상 컴포넌트가 사용하는 모든 store/hook 확인
- [ ] 자식 컴포넌트가 사용하는 store/hook 확인
- [ ] 각 의존성을 Mock에 포함
