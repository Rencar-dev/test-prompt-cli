---
name: test-implement
description: |
  테스트 코드 작성 시 호출합니다.
  공통 규칙, 테스트 타입별 규칙, ATDD 시나리오 구현 규칙을 안내합니다.
---

# test-implement

테스트 코드 작성 시 필요한 규칙을 제공합니다.

---

## 규칙 파일 참조

> **중요**: 아래 규칙 파일들을 읽고 적용하세요.

### 프로젝트 규칙 (project-manifest.yaml 기반)

다음 파일을 읽고 적용하세요:

{{RULE_FILES}}

### 컨텍스트 기반 규칙 (필요시)

테스트 대상 코드에서 다음 패턴 발견 시 해당 규칙도 확인하세요:

{{CONTEXT_RULES}}

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

```typescript
// (Note): E2E 시나리오이지만 실제 화면 DOM 렌더링 검증은 하지 않고 router 호출만 검증
await waitFor(() =>
  expect(screen.queryByText('로딩중')).not.toBeInTheDocument()
);
expect(routerMocks.replace).toHaveBeenCalledWith('/dashboard');
```

---

### 3. 시나리오 분기 처리

조건부 분기가 있는 시나리오는 각 분기를 별도 테스트로 분리:

```typescript
it('[S1-1] 연동 차량이 아닌 경우 직전 화면으로 돌아간다', async () => {
  server.use(handler({ useConnect: false }));
  expect(routerMocks.back).toHaveBeenCalledTimes(1);
});

it('[S1-2] 연동 차량인 경우 주행 평가 페이지로 이동한다', async () => {
  server.use(handler({ useConnect: true }));
  expect(routerMocks.replace).toHaveBeenCalledWith(...);
});
```

---

## Red Team / Negative Testing

**당신은 Red Team QA 엔지니어입니다.** 기능이 "작동하는지"보다 **"어떻게 하면 망가뜨릴 수 있을지"**를 고민하세요.

### 필수 포함 시나리오

| 유형 | 설명 |
|-----|------|
| Validation Attack | `<script>`, 초장문 텍스트, 이모지 입력 |
| Network Chaos | API 500 에러, 10초 지연 (Loading) |
| Interaction Spam | 버튼 연타 (Double Submit) |

---

## Data Fixture Strategy

테스트 코드 작성 전 **3가지 데이터 페르소나**를 정의하세요:

| 페르소나 | 설명 |
|---------|------|
| Happy User | 모든 필드 완벽 (정상 케이스) |
| Edge User | 경계값 (100자 이름, 특수문자) |
| Legacy User | 필수값 일부 누락 (구 데이터) |

---

## Self-Check

- [ ] 위에 나열된 규칙 파일을 모두 읽고 적용했는가?
- [ ] 시나리오 ID/제목을 원문 그대로 유지했는가?
- [ ] Red Team 관점의 테스트를 포함했는가?
