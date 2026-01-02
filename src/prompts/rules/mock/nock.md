# Nock 테스트 규칙

## Meta

```yaml
scope: mockStrategy=nock
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 mockStrategy가 nock
> - Node.js 환경에서 HTTP 요청 모킹

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [NOCK-001] Nock 설정 규칙
- [NOCK-002] 인터셉터 작성 규칙
- [NOCK-003] 스코프 정리 규칙
- [NOCK-004] 요청 검증 규칙
- [NOCK-005] 녹화/재생 규칙

---

## 3. 주제 특화 규칙

### 3.1 Nock 설정 [NOCK-001]

<!-- TODO: nock.disableNetConnect, nock.enableNetConnect -->

### 3.2 인터셉터 작성 [NOCK-002]

<!-- TODO: nock(baseUrl).get().reply() -->

### 3.3 스코프 정리 [NOCK-003]

<!-- TODO: nock.cleanAll, scope.done() -->

### 3.4 요청 검증 [NOCK-004]

<!-- TODO: reqheaders, body 매칭 -->

### 3.5 녹화/재생 [NOCK-005]

<!-- TODO: nock.recorder, nock.back -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [NOCK-001] disableNetConnect로 실제 요청을 차단하는가?
□ [NOCK-002] 모든 인터셉터가 소비되었는지 확인하는가?
□ [NOCK-003] afterEach에서 cleanAll을 호출하는가?
□ [NOCK-004] 요청 본문/헤더를 검증하는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Nock 자주 쓰는 패턴
```
