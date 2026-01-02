# React Router 테스트 규칙

## Meta

```yaml
scope: router=react-router
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 router가 react-router
> - React Router v6+ 사용

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [RR-001] MemoryRouter 래핑 규칙
- [RR-002] 라우트 파라미터 테스트 규칙
- [RR-003] 네비게이션 테스트 규칙
- [RR-004] Loader/Action 테스트 규칙
- [RR-005] 보호된 라우트 테스트 규칙

---

## 3. 주제 특화 규칙

### 3.1 MemoryRouter 래핑 [RR-001]

<!-- TODO: MemoryRouter, initialEntries 설정 -->

### 3.2 라우트 파라미터 테스트 [RR-002]

<!-- TODO: useParams, 동적 라우트 테스트 -->

### 3.3 네비게이션 테스트 [RR-003]

<!-- TODO: useNavigate, Link 클릭 후 URL 변경 확인 -->

### 3.4 Loader/Action 테스트 [RR-004]

<!-- TODO: createMemoryRouter, loader/action 함수 테스트 -->

### 3.5 보호된 라우트 테스트 [RR-005]

<!-- TODO: 인증 상태에 따른 리다이렉트 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| BrowserRouter 사용 | 테스트에서 history 제어 불가 | MemoryRouter 사용 |

---

## 5. Self-Check

```
□ [RR-001] MemoryRouter로 컴포넌트를 래핑하는가?
□ [RR-002] initialEntries로 초기 경로를 설정하는가?
□ [RR-003] 네비게이션 후 URL 변경을 검증하는가?
□ [RR-004] Loader/Action을 독립적으로 테스트하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: React Router 테스트 자주 쓰는 패턴
```
