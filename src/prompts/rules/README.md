# Test Rules Architecture

이 문서는 AI 테스트 규칙 시스템의 설계 명세입니다.
규칙 파일 구조, 조합 방식, 확장 가이드를 정의합니다.

---

## 1. 설계 원칙

### 1.1 왜 이 구조인가?

AI 코딩 어시스턴트가 테스트 코드를 생성할 때 가장 큰 문제는 **맥락 없는 패턴 적용**입니다.
이 규칙 시스템은 다음 원칙으로 설계되었습니다:

| 원칙 | 설명 | 효과 |
|------|------|------|
| **단일 해석** | 모든 규칙은 하나의 해석만 가능해야 함 | AI가 확률적 선택을 하지 않음 |
| **이진 판단** | DO/DON'T로 명확한 행동 지침 제공 | "~하는 것이 좋다" 같은 모호함 제거 |
| **결정 트리** | 상황별 분기 조건을 명시적으로 제공 | "상황에 따라 다르다"의 해석 여지 제거 |
| **계층적 조합** | 공통 → 주제별 순서로 규칙 적용 | 충돌 시 우선순위가 명확 |

### 1.2 DO/DON'T 이진 구조를 선택한 이유

| 대안 | 문제점 | DO/DON'T의 장점 |
|------|--------|----------------|
| 가이드라인 형식 | "~하는 것이 좋다"는 해석 여지가 있음 | 명확한 판단 기준 |
| 우선순위(P0/P1/P2) | "P2는 무시해도 되나?"라는 혼동 | 모든 규칙이 동등하게 필수 |
| 설명 중심 | AI가 핵심을 놓칠 수 있음 | 행동 지침이 명확 |

### 1.3 Decision Tree를 사용하는 이유

AI는 **조건부 판단**에서 자주 실수합니다:

```
// 모호한 설명 - AI가 임의로 선택
"스토어 모킹은 상황에 따라 전체 모킹 또는 부분 모킹을 선택한다"

// 명확한 결정 트리 - AI가 정확히 따름
IF 컴포넌트 렌더링만 테스트 → 전체 모킹
IF 스토어 로직 테스트 → 모킹 없이 직접 테스트
IF 통합 테스트 → 실제 스토어 + 초기화
```

### 1.4 Rule ID를 부여하는 이유

- **규칙 간 참조**: Override 시 원본 규칙을 명확히 지정
- **충돌 추적**: 어떤 규칙이 어떤 규칙을 덮어쓰는지 기록
- **디버깅**: 테스트 실패 시 어떤 규칙을 위반했는지 식별

```markdown
## Override
| Rule ID | 공통 규칙 | 본 문서 규칙 |
|---------|----------|-------------|
| CODE-003 | beforeEach에서 상태 초기화 | Zustand는 setState로 수동 리셋 |
```

---

## 2. 폴더 구조 및 역할

### 2.1 전체 구조

```
rules/
├── README.md                     # 본 문서 (설계 명세)
├── _common.md                    # 공통 규칙 (항상 로드)
├── _meta.md                      # 조합/우선순위 지침
│
├── runner/                       # testRunner 설정 기반
│   ├── vitest.md
│   └── jest.md
│
├── state/                        # stateManagement 설정 기반
│   ├── zustand.md
│   ├── redux-toolkit.md
│   ├── recoil.md
│   └── jotai.md
│
├── query/                        # queryLibrary 설정 기반
│   ├── tanstack-query.md
│   ├── swr.md
│   ├── rtk-query.md
│   └── apollo.md
│
├── mock/                         # mockStrategy 설정 기반
│   ├── msw.md
│   ├── nock.md
│   ├── fetch-mock.md
│   └── module-mock.md
│
├── router/                       # router 설정 기반
│   ├── next-app.md
│   ├── next-pages.md
│   └── react-router.md
│
├── test-type/                    # --type 옵션 기반
│   ├── ui.md
│   └── unit.md
│
└── component/                    # 선택적 참조 (SKILL에서 include)
    ├── form.md
    ├── modal.md
    └── async-boundary.md
```

### 2.2 Manifest 필드와 폴더 매핑

| Manifest 필드 | 폴더 | 파일 선택 예시 |
|--------------|------|---------------|
| `testRunner` | `runner/` | `vitest` → `runner/vitest.md` |
| `stateManagement` | `state/` | `zustand` → `state/zustand.md` |
| `queryLibrary` | `query/` | `tanstack-query` → `query/tanstack-query.md` |
| `mockStrategy` | `mock/` | `msw` → `mock/msw.md` |
| `router` | `router/` | `next-app` → `router/next-app.md` |
| CLI `--type` | `test-type/` | `ui` → `test-type/ui.md` |

### 2.3 파일별 역할

| 파일 | 역할 | 로드 시점 |
|------|------|----------|
| `_common.md` | 모든 테스트에 적용되는 기본 규칙 | 항상 (Level 0) |
| `_meta.md` | 규칙 조합 방법, 우선순위, 충돌 해결 | rules-loader.ts 참조용 |
| `runner/*.md` | 테스트 러너별 설정, API 차이 | manifest 기반 (Level 2) |
| `state/*.md` | 상태 관리 라이브러리별 테스트 패턴 | manifest 기반 (Level 2) |
| `query/*.md` | 데이터 페칭 라이브러리별 테스트 패턴 | manifest 기반 (Level 2) |
| `mock/*.md` | 모킹 전략별 패턴 (MSW, vi.mock 등) | manifest 기반 (Level 2) |
| `router/*.md` | 라우터별 네비게이션 테스트 패턴 | manifest 기반 (Level 2) |
| `test-type/*.md` | UI/Unit 테스트 유형별 규칙 | CLI --type 기반 (Level 1) |
| `component/*.md` | 특정 컴포넌트 유형별 패턴 | 선택적 include |

### 2.4 우선순위 계층 (Level)

```
Level 0: _common.md (기본, 항상 로드)
    ↓
Level 1: test-type/*.md (테스트 유형)
    ↓
Level 2: state/*.md, mock/*.md, query/*.md, router/*.md, runner/*.md (주제별)
    ↓
Level 3: 프로젝트별 커스텀 규칙 (project-test-lessons.md)
```

**충돌 시**: 상위 Level이 하위 Level을 Override

---

## 3. 규칙 파일 템플릿

### 3.1 공통 규칙 파일 (`_common.md`)

```markdown
# 테스트 공통 규칙

## Meta
- version: x.x.x
- priority: 0
- scope: all

## 1. 규칙 표기법
MUST / MUST NOT / SHOULD / MAY 정의

## 2. 적용 가이드
단계별 참조 섹션 테이블

## 3~N. 규칙 섹션들
각 섹션은 [CATEGORY-NNN] Rule ID 포함

## Self-Check
체크리스트

## Quick Reference
자주 쓰는 코드 스니펫
```

### 3.2 주제별 규칙 파일 템플릿

모든 주제별 파일은 다음 구조를 따릅니다:

```markdown
# {주제명} 테스트 규칙

## Meta
- scope: {manifest 필드}={값}
- inherits: _common.md
- priority: {1 또는 2}

---

## 1. 적용 조건

> 다음 조건을 **모두** 만족할 때 본 문서 적용:
> - 조건 1
> - 조건 2

---

## 2. 공통 규칙 관계

### Override (덮어쓰기)
| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|

### Add (추가)
- [NEW-001] 새로운 규칙 설명

### Restrict (제한)
- [COMMON-XXX] 규칙을 본 주제에서는 적용하지 않음

---

## 3. 주제 특화 규칙

### 3.1 {카테고리}

#### Decision Tree
상황별 분기 조건

#### DO / DON'T
MUST: ...
MUST NOT: ...

#### 코드 예시
// ✅ Good
// ❌ Bad

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|

---

## 5. Self-Check

□ 체크 항목 1
□ 체크 항목 2

---

## 6. Quick Reference

자주 쓰는 코드 스니펫
```

### 3.3 필수 섹션 vs 선택 섹션

| 섹션 | 필수 여부 | 설명 |
|------|----------|------|
| Meta | **필수** | scope, inherits, priority |
| 적용 조건 | **필수** | 언제 이 문서가 적용되는지 |
| 공통 규칙 관계 | **필수** | Override/Add/Restrict 중 해당 항목 |
| 주제 특화 규칙 | **필수** | 이 주제의 핵심 규칙 |
| Decision Tree | 권장 | 상황별 판단이 필요한 경우 |
| Anti-patterns | 권장 | 자주 발생하는 실수가 있는 경우 |
| Self-Check | **필수** | 최소 3개 이상 |
| Quick Reference | 권장 | 자주 쓰는 패턴이 있는 경우 |

---

## 4. rules-loader.ts 연동 스펙

### 4.1 로딩 알고리즘

```typescript
function loadRules(manifest: ManifestConfig, testType: TestType): string[] {
  const rules: string[] = [];

  // Step 1: 공통 규칙 (항상)
  rules.push('rules/_common.md');

  // Step 2: 테스트 유형 규칙 (Level 1)
  rules.push(`rules/test-type/${testType}.md`);

  // Step 3: 테스트 러너 규칙 (Level 2)
  if (manifest.testRunner) {
    rules.push(`rules/runner/${manifest.testRunner}.md`);
  }

  // Step 4: 상태 관리 규칙 (Level 2)
  if (manifest.stateManagement && manifest.stateManagement !== 'none') {
    rules.push(`rules/state/${manifest.stateManagement}.md`);
  }

  // Step 5: 쿼리 라이브러리 규칙 (Level 2)
  if (manifest.queryLibrary && manifest.queryLibrary !== 'none') {
    rules.push(`rules/query/${manifest.queryLibrary}.md`);
  }

  // Step 6: 모킹 전략 규칙 (Level 2)
  if (manifest.mockStrategy) {
    rules.push(`rules/mock/${manifest.mockStrategy}.md`);
  }

  // Step 7: 라우터 규칙 (Level 2)
  if (manifest.router && manifest.router !== 'none') {
    rules.push(`rules/router/${manifest.router}.md`);
  }

  return rules;
}
```

### 4.2 SKILL 파일 생성 시 규칙 조합

```typescript
function assembleSkillContent(rules: string[]): string {
  let content = '';

  for (const rulePath of rules) {
    const ruleContent = readFile(rulePath);
    content += `\n\n<!-- From: ${rulePath} -->\n`;
    content += ruleContent;
  }

  return content;
}
```

### 4.3 예상 로딩 시나리오

**시나리오**: Vitest + Zustand + TanStack Query + MSW + Next.js App Router

```yaml
# project-manifest.yaml
testRunner: vitest
stateManagement: zustand
queryLibrary: tanstack-query
mockStrategy: msw
router: next-app
```

**로드되는 파일** (순서대로):
1. `rules/_common.md` (Level 0)
2. `rules/test-type/ui.md` (Level 1, --type ui인 경우)
3. `rules/runner/vitest.md` (Level 2)
4. `rules/state/zustand.md` (Level 2)
5. `rules/query/tanstack-query.md` (Level 2)
6. `rules/mock/msw.md` (Level 2)
7. `rules/router/next-app.md` (Level 2)

**충돌 해결**:
- `zustand.md`의 Override가 `_common.md`의 CODE-003을 덮어씀
- `msw.md`의 Add가 새로운 MSW 관련 규칙 추가

---

## 5. 확장 가이드

### 5.1 새로운 상태 관리 라이브러리 추가

예: Valtio 추가

1. **파일 생성**: `rules/state/valtio.md`

2. **템플릿 작성**:
```markdown
# Valtio 테스트 규칙

## Meta
- scope: stateManagement=valtio
- inherits: _common.md
- priority: 2

## 1. 적용 조건
> - project-manifest.yaml의 stateManagement가 valtio

## 2. 공통 규칙 관계
### Override
| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| CODE-003 | beforeEach에서 상태 초기화 | Valtio snapshot으로 리셋 | Proxy 기반 상태 |

## 3. Valtio 특화 규칙
...
```

3. **Manifest 옵션 추가** (rules-loader.ts):
```typescript
// stateManagement 타입에 'valtio' 추가
type StateManagement = 'zustand' | 'redux-toolkit' | ... | 'valtio';
```

4. **테스트**: 해당 설정으로 규칙이 제대로 로드되는지 확인

### 5.2 새로운 테스트 유형 추가

예: E2E 테스트 타입 추가

1. **파일 생성**: `rules/test-type/e2e.md`

2. **CLI 옵션 확장**: `--type e2e` 지원

3. **로더 수정**: testType enum에 'e2e' 추가

### 5.3 새로운 컴포넌트 유형 추가

예: Drag & Drop 컴포넌트

1. **파일 생성**: `rules/component/drag-drop.md`

2. **SKILL에서 선택적 include**:
```markdown
<!-- SKILL.md -->
{{#if hasDragDrop}}
{{include rules/component/drag-drop.md}}
{{/if}}
```

### 5.4 기존 규칙 수정 시 체크리스트

```
□ Rule ID가 변경되었는가? → 참조하는 Override 섹션 모두 업데이트
□ 새로운 MUST/MUST NOT이 추가되었는가? → Self-Check에 반영
□ Decision Tree가 변경되었는가? → 관련 코드 예시 업데이트
□ 다른 규칙과 충돌 가능성이 있는가? → _meta.md에 충돌 해결 규칙 추가
```

---

## 6. 버전 관리

### 6.1 버전 체계

```
MAJOR.MINOR.PATCH

MAJOR: 구조 변경 (폴더 추가/삭제, 필수 섹션 변경)
MINOR: 규칙 추가/수정 (새로운 라이브러리 지원)
PATCH: 오타 수정, 예시 개선
```

### 6.2 변경 이력 관리

각 규칙 파일의 Meta 섹션에 버전 명시:
```yaml
## Meta
- version: 1.2.0
- last_updated: 2025-01-XX
```

---

## 7. 참고 자료

### 7.1 관련 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| 공통 규칙 | `rules/_common.md` | 모든 테스트의 기본 규칙 |
| 조합 지침 | `rules/_meta.md` | 런타임 조합 규칙 |
| CLI 문서 | 프로젝트 README | 명령어 사용법 |

### 7.2 설계 결정 배경

이 규칙 시스템은 다음 3가지 제안을 분석하여 최적의 구조로 취합되었습니다:

- **제안 A**: 결정 트리 기반 접근, 적용 시점 테이블, 공통 규칙 재정의 섹션
- **제안 B**: MUST/MUST NOT 명세 스타일, Rule ID 시스템, ADD/OVERRIDE/RESTRICT 관계
- **제안 C**: 토큰 효율성, AI 컨텍스트 주입 시나리오, Level 기반 우선순위

각 제안의 강점을 조합하여:
- 제안 A의 **Decision Tree**와 **셀프체크**
- 제안 B의 **MUST/MUST NOT**과 **Rule ID**
- 제안 C의 **Level 우선순위**와 **토큰 효율성**

을 채택했습니다.
