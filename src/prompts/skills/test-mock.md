---
name: test-mock
description: |
  테스트의 Mock 코드 작성 시 호출합니다.
  공통 Mock 원칙, MSW 핸들러, vi.mock 호이스팅, vi.hoisted 패턴을 안내합니다.
---

# test-mock

Mock 전략 및 패턴을 제공합니다.

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

## vi.mock 호이스팅과 import 순서

**vi.mock은 파일 최상단으로 호이스팅됩니다.** 따라서 import 순서와 관계없이 mock이 먼저 적용됩니다.

### 올바른 구조 (모든 import를 상단에)

```typescript
// 모든 import를 파일 상단에 모음
import { screen, waitFor } from '@testing-library/react';
import { userStore } from '@/stores/user';
import LoginPage from '../page';

// vi.mock은 import 이후에 작성해도 호이스팅됨
vi.mock('@/utils', () => ({...}));
vi.mock('next/navigation', () => ({...}));
```

### 핵심 원칙

- **모든 import는 파일 상단에 모음** (코드 가독성)
- vi.mock은 어디에 작성해도 호이스팅됨 (순서 무관)

---

## Mock 주석 필수

```typescript
// Mock 이유: localStorage는 테스트 환경에서 제어 불가능
// Mock 범위: Storage.prototype.getItem, setItem
// Mock 값: getItem은 null 반환
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
});
```

---

## 브라우저 API Mock

```typescript
// localStorage / sessionStorage Mock
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});

// window.location Mock
delete (window as any).location;
window.location = { href: 'http://localhost:3000', pathname: '/' } as any;

// window.alert/confirm Mock
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('confirm', vi.fn(() => true));
```

---

## Self-Check

- [ ] 위에 나열된 규칙 파일을 모두 읽고 적용했는가?
- [ ] 모든 import가 파일 상단에 모여있는가?
- [ ] Mock에 주석(이유, 범위, 값)을 달았는가?
- [ ] 브라우저 API Mock이 beforeEach에서 초기화되었는가?
