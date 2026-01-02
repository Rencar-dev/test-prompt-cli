# Next.js App Router 테스트 규칙

## Meta

```yaml
scope: router=next-app
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 router가 next-app
> - Next.js 13+ App Router 사용

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [NEXT-APP-001] next/navigation 모킹 규칙
- [NEXT-APP-002] Server Component 테스트 규칙
- [NEXT-APP-003] Client Component 테스트 규칙
- [NEXT-APP-004] Route Handler 테스트 규칙
- [NEXT-APP-005] Metadata 테스트 규칙

---

## 3. 주제 특화 규칙

### 3.1 next/navigation 모킹 [NEXT-APP-001]

<!-- TODO: useRouter, usePathname, useSearchParams 모킹 -->

### 3.2 Server Component 테스트 [NEXT-APP-002]

<!-- TODO: async component 테스트, 데이터 페칭 -->

### 3.3 Client Component 테스트 [NEXT-APP-003]

<!-- TODO: 'use client' 컴포넌트, 일반 RTL 테스트 -->

### 3.4 Route Handler 테스트 [NEXT-APP-004]

<!-- TODO: GET/POST 함수 직접 테스트 -->

### 3.5 Metadata 테스트 [NEXT-APP-005]

<!-- TODO: generateMetadata 함수 테스트 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [NEXT-APP-001] next/navigation을 올바르게 모킹하는가?
□ [NEXT-APP-002] Server Component를 async로 테스트하는가?
□ [NEXT-APP-003] Client Component에 필요한 Provider가 있는가?
□ [NEXT-APP-004] Route Handler의 Request/Response를 테스트하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Next.js App Router 테스트 자주 쓰는 패턴
```
