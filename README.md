# 🤖 TEST PROMPT CLI

**AI 기반 프론트엔드 테스트 자동화 파트너**

`@hsna/prompt`는 프론트엔드 코드를 분석하여, AI(Claude, Cursor, ChatGPT)에게 테스트 작성을 요청하기 위한 **최적화된 프롬프트를 생성해주는 CLI 도구**입니다.

복잡한 컨텍스트 설정, 파일 읽기, 포맷팅을 자동화하여 **"명령어 입력 → AI에게 붙여넣기"** 만으로 테스트 코드를 생산할 수 있습니다.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.4.0-green.svg)

## ✨ Features

- 📋 **Auto Copy**: 생성된 프롬프트를 시스템 클립보드에 즉시 복사합니다.
- 🧠 **Context Aware**: `project-manifest.yaml` 설정을 자동으로 읽어 프로젝트 컨벤션을 준수합니다.
- 🚀 **Zero Config**: `npx`로 즉시 실행 가능합니다.

## 🚀 Quick Start

설치할 필요 없이 `npx`로 바로 실행하세요.

```bash
# 1. 프로젝트 초기 설정 (최초 1회)
npx @hsna/prompt init

# 2. Interactive 모드로 시작 (권장)
npx @hsna/prompt

# 3. 또는 직접 명령어 실행
npx @hsna/prompt atdd src/app/login/page.tsx
```

### Interactive 모드

파일 경로 없이 실행하면 Interactive 모드가 활성화됩니다.

```bash
# 명령어 선택 메뉴
npx @hsna/prompt
? 실행할 명령어를 선택하세요
❯ atdd   - ATDD 시나리오 생성
  plan   - 테스트 계획 수립
  gen    - 테스트 코드 생성
  learn  - 오답노트 갱신

# 파일 선택 (실시간 검색)
npx @hsna/prompt atdd
? ATDD를 생성할 파일을 검색하세요
💡 파일명 또는 경로를 입력하세요 (예: login, user, auth)
```

> **💡 경로에 특수문자(괄호, 공백 등)가 포함된 경우 따옴표로 감싸세요:**
> ```bash
> npx @hsna/prompt atdd "app/(public)/user/login/page.tsx"
> npx @hsna/prompt plan "src/components/My Component.tsx"
> ```

---

## 🛠 Commands

### 1. `init`
프로젝트의 기술 스택(Framework, Testing Library, Path Alias 등)을 분석하기 위한 프롬프트를 생성합니다.

```bash
npx @hsna/prompt init
```
- **Output**: `project-convention-scanner.md` 내용 복사
- **Action**: 
  1. AI에게 붙여넣고, 결과물인 `project-manifest.yaml`을 루트에 저장하세요.
  2. 자동으로 생성된 `project-test-lessons.md` 파일을 확인하세요. (AI 오답노트)

### 2. `atdd`
구현된 소스 코드를 분석하여 **수용 테스트(Acceptance Test) 시나리오** 설계를 요청합니다.

> **수용 테스트란?**
> 코드의 내부 구현 방식보다는 **"사용자가 어떤 행동을 했을 때 무엇이 보여야 하는가(Given-When-Then)"**에 집중하여 비즈니스 요구사항을 검증하는 테스트입니다.

```bash
npx @hsna/prompt atdd [source_path]
```
- **Interactive**: 경로 생략 시 파일 선택 UI 표시
- **Example**:
  ```bash
  npx @hsna/prompt atdd                              # Interactive 모드
  npx @hsna/prompt atdd app/login/page.tsx
  npx @hsna/prompt atdd "app/(auth)/login/page.tsx"  # 특수문자 포함 시 따옴표 사용
  ```
- **Output**: 소스 코드 + ATDD 생성 프롬프트 결합 후 복사

### 3. `plan`
작성된 ATDD 시나리오를 바탕으로 **테스트 라우팅(Unit vs UI vs E2E)** 계획을 수립합니다.

```bash
npx @hsna/prompt plan [source_path]
```
- **Interactive**: 경로 생략 시 ATDD가 작성된 파일만 표시
- **Example**:
  ```bash
  npx @hsna/prompt plan                                     # Interactive 모드
  npx @hsna/prompt plan app/login/page.tsx
  npx @hsna/prompt plan "app/(public)/user/login/page.tsx"  # 특수문자 포함 시 따옴표 사용
  ```
- **Prerequisite**: 같은 경로(또는 `project-manifest.yaml`의 `testPaths.dirName` 설정)에 `.atdd.md` 파일이 있어야 합니다.
- **Output**: ATDD 파일 + 소스 코드 + Routing 프롬프트 결합 후 복사

### 4. `gen`
실제 **테스트 코드(Spec)** 작성을 요청합니다. 설계된 Plan에 따라 UI 테스트와 Unit 테스트를 구분해 요청하세요.

```bash
npx @hsna/prompt gen [source_path] [options]
```

- **Interactive**: 경로 생략 시 파일 선택 UI 표시 (테스트 타입 자동 추론)
  - `.tsx`, `.jsx` → UI 테스트
  - `.ts`, `.js` → Unit 테스트

**Options:**
- `--type ui` (Default): React Component, Hook(Integration) 테스트
- `--type unit`: 순수 함수, Utils, Store Logic 테스트

**Plan 파일 요구사항:**
| 타입 | Plan 파일 | 설명 |
|------|----------|------|
| `--type ui` | 필수 | ATDD → Plan 워크플로우 필요 |
| `--type unit` | 선택적 | Plan 없이 소스 코드만으로 테스트 생성 가능 |

```bash
# Interactive 모드 (테스트 타입 자동 추론)
npx @hsna/prompt gen

# UI 테스트 생성 (기본값) - Plan 파일 필요
npx @hsna/prompt gen app/login/page.tsx
npx @hsna/prompt gen "app/(public)/user/login/page.tsx"  # 특수문자 포함 시 따옴표 사용

# Unit 테스트 생성 - Plan 파일 선택적
npx @hsna/prompt gen libs/utils/date.ts --type unit      # Plan 없이 바로 실행 가능
npx @hsna/prompt gen src/hooks/useAuth.ts --type unit
```

> **💡 순수 함수/유틸 테스트**: `--type unit`은 Plan 파일 없이도 소스 코드를 분석하여 테스트 케이스를 자동 도출합니다.

### 5. `learn`
테스트 실패 로그를 분석하여 **"오답노트(Lessons Learned)"**를 갱신합니다.
AI가 스스로 실수를 교정하고, 다음 테스트 생성 시 더 높은 정확도를 갖게 합니다.

```bash
npx @hsna/prompt learn [source_path]
```
- **Interactive**: 경로 생략 시 테스트 파일이 존재하는 소스 파일만 표시
- **Process**:
  1. 해당 소스 파일의 테스트(`npm test ...`)를 자동으로 실행합니다.
  2. 테스트가 **실패**하면, 에러 로그와 소스 코드를 분석하는 프롬프트를 생성합니다.
  3. AI에게 붙여넣으면, AI가 `project-test-lessons.md`에 교훈을 추가합니다.
- **Example**:
  ```bash
  npx @hsna/prompt learn                         # Interactive 모드
  npx @hsna/prompt learn src/app/login/page.tsx
  ```

---

## 🔄 Workflow

### 페이지/컴포넌트 (Full ATDD Workflow)

복잡한 UI 컴포넌트는 전체 워크플로우를 따릅니다.

1.  **Code**: 기능을 구현합니다. (예: `Login.tsx`)
2.  **ATDD**: `npx @hsna/prompt atdd Login.tsx` ➡️ AI에게 붙여넣기 ➡️ `Login.atdd.md` 저장
3.  **Plan**: `npx @hsna/prompt plan Login.tsx` ➡️ AI에게 붙여넣기 ➡️ `Login.test-plan.md` 저장
4.  **Test**: `npx @hsna/prompt gen Login.tsx` ➡️ AI에게 붙여넣기 ➡️ `Login.test.tsx` 저장 & 실행
5.  **Learn (If Failed)**: `npx @hsna/prompt learn Login.tsx` ➡️ AI에게 붙여넣기 ➡️ `project-test-lessons.md` 업데이트 ➡️ **Retry Step 4**

### 순수 함수/유틸 (Simplified Workflow)

순수 함수, 유틸, Hook 등은 ATDD/Plan 없이 바로 테스트를 생성할 수 있습니다.

1.  **Code**: 유틸 함수를 구현합니다. (예: `formatDate.ts`)
2.  **Test**: `npx @hsna/prompt gen formatDate.ts --type unit` ➡️ AI에게 붙여넣기 ➡️ `formatDate.test.ts` 저장 & 실행
3.  **Learn (If Failed)**: `npx @hsna/prompt learn formatDate.ts` ➡️ **Retry Step 2**

---

## 📦 Development

이 프로젝트에 기여하거나 로컬에서 수정하여 사용하고 싶다면 아래 절차를 따르세요.

### Setup
```bash
# 저장소 클론
git clone https://github.com/Rencar-dev/test-prompt-cli.git
cd test-prompt-cli

# 의존성 설치 (npm 권장)
npm install
```

### Local Testing
개발 중인 명령어를 로컬에서 테스트해볼 수 있습니다.

```bash
# 로컬 링크 연결
npm link

# 아무 경로에서나 실행 가능
prompt atdd ...
```

### Release Strategy (GitHub Flow)
1. `main` 브랜치에서 기능 브랜치(`feature/new-command`) 생성
2. 작업 완료 후 `main`으로 Pull Request
3. Merge 시 GitHub Actions를 통해 NPM Registry(또는 GitHub Packages)로 자동 배포

---

## 📝 License

This project is licensed under the MIT License.
