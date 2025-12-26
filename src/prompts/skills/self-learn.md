---
name: self-learn
description: |
  테스트 구현 완료 후 반드시 실행합니다.
  검증 단계(TypeScript/Lint/Test)에서 발생한 수정 사항을 분석하고, 기록할 교훈이 있으면 project-test-lessons.md에 기록합니다.
---

<!--
⚠️ 동기화 필요: 이 규칙을 수정할 때
   src/prompts/feedback-analyzer-prompt.md도 함께 수정하세요.
-->

# self-learn

**이 skill은 /test-verify 전에 반드시 실행됩니다.**

---

## 실행 절차

### 1단계: 수정 발생 여부 분석

검증 단계에서 다음 중 하나라도 발생했는지 확인:

| 단계 | 수정 유형 |
|------|----------|
| TypeScript 검사 | 타입 에러 수정 후 통과 |
| Lint 검사 | Lint 에러/경고 수정 후 통과 |
| 테스트 실행 | 테스트 실패 수정 후 통과 |
| 테스트 실행 | 경고(warning) 해결 |

### 2단계: 기록 여부 판단

**수정이 없었다면** → "기록 불필요" 출력 후 종료

**수정이 있었다면** → 아래 기준으로 기록 여부 판단:

| 기록 O (환경/라이브러리 문제) | 기록 X (일회성 실수) |
|------------------------------|---------------------|
| JSDOM 미지원 API (window.alert 등) | 오타, 변수명 실수 |
| Node.js 환경 차이 (btoa → Buffer.from) | Import 경로 오류 |
| 라이브러리 사용법/구조 오류 | 단순 로직 버그 |
| Mock 패턴 문제 (vi.hoisted, store 구조) | 테스트 데이터 오류 |
| 비동기 처리 패턴 (waitFor + fake timer) | |

**⚠️ 판단 기준**:
- 환경/라이브러리 문제는 **"사소해도" 기록** (다음에 또 발생할 수 있음)
- 판단이 애매하면 **기록하는 쪽으로** 결정

### 3단계: project-test-lessons.md 수정

**섹션 구조 (절대 변경 금지)**:
```
## 0. 📋 Project Context & Team Rules  ← 🚫 수정 금지 (사용자 작성)
## 1. 🚨 Critical Environment Rules    ← ✅ 환경 문제 기록
## 2. 🛠 Library & Framework Specifics ← ✅ 라이브러리 문제 기록
## 3. ⚠️ Common Anti-Patterns          ← ✅ 반복 실수 패턴 기록
```

**작성 규칙**:
1. **중복 확인**: 기존 항목과 비교 → 동일하면 유지, 부족하면 보강
2. **범용 패턴화**: 특정 파일명/변수명 제거 (예: `Login.test.tsx` → `UI 컴포넌트 테스트 시`)
3. **코드 예시 필수**: 추상적 조언 금지
4. **병합 우선**: 유사 항목은 하나로 통합

---

## 출력 형식

**수정이 없었을 때:**
```
📚 Self-Learning Report
━━━━━━━━━━━━━━━━━━━━━━━
- 수정 발생: 없음
- 기록 여부: 아니오
- 사유: 검증 단계에서 코드 수정 없이 통과
```

**수정이 있었지만 기록하지 않을 때:**
```
📚 Self-Learning Report
━━━━━━━━━━━━━━━━━━━━━━━
- 수정 발생: 있음 (N회)
- 기록 여부: 아니오
- 사유: 일회성 실수 (오타/변수명/import 경로 등)
```

**기록할 때:**
```
📚 Self-Learning Report
━━━━━━━━━━━━━━━━━━━━━━━
- 수정 발생: 있음 (N회)
- 기록 여부: 예
- 추가된 교훈:
  - [섹션 1] Window Object Mocking - alert, scrollTo mock 추가
  - [섹션 2] Zustand Store 구조 - alerts: Alert[] 형태
```

---

## Self-Check

- [ ] 검증 단계(TypeScript/Lint/Test)에서 발생한 모든 수정 사항을 검토했는가?
- [ ] 환경/라이브러리 문제는 기록했는가?
- [ ] 섹션 0 (Team Rules)을 수정하지 않았는가?
- [ ] 기존 항목과 중복 확인했는가?
- [ ] 구체적인 코드 예시를 포함했는가?
