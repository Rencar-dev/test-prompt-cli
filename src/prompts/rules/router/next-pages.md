# Next.js Pages Router 테스트 규칙

## Meta

```yaml
scope: router=next-pages
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 router가 next-pages
> - Next.js Pages Router 사용 (pages/ 디렉토리)

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [NEXT-PAGES-001] next/router 모킹 규칙
- [NEXT-PAGES-002] getServerSideProps 테스트 규칙
- [NEXT-PAGES-003] getStaticProps 테스트 규칙
- [NEXT-PAGES-004] API Routes 테스트 규칙
- [NEXT-PAGES-005] 페이지 컴포넌트 테스트 규칙

---

## 3. 주제 특화 규칙

### 3.1 next/router 모킹 [NEXT-PAGES-001]

<!-- TODO: useRouter, push, replace, query 모킹 -->

### 3.2 getServerSideProps 테스트 [NEXT-PAGES-002]

<!-- TODO: context 객체 생성, 반환값 검증 -->

### 3.3 getStaticProps 테스트 [NEXT-PAGES-003]

<!-- TODO: 빌드 타임 데이터 페칭 테스트 -->

### 3.4 API Routes 테스트 [NEXT-PAGES-004]

<!-- TODO: req/res 객체 모킹, next-test-api-route-handler -->

### 3.5 페이지 컴포넌트 테스트 [NEXT-PAGES-005]

<!-- TODO: props 주입, 라우터 의존성 모킹 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [NEXT-PAGES-001] next/router를 올바르게 모킹하는가?
□ [NEXT-PAGES-002] getServerSideProps를 독립적으로 테스트하는가?
□ [NEXT-PAGES-003] API Routes의 req/res를 올바르게 모킹하는가?
□ [NEXT-PAGES-004] 페이지에 필요한 props를 주입하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Next.js Pages Router 테스트 자주 쓰는 패턴
```
