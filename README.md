# 🤖 TEST PROMPT CLI

**AI 기반 프론트엔드 테스트 자동화 파트너**

`@rencar-dev/prompt`는 프론트엔드 코드를 분석하여, AI(Claude, Cursor, ChatGPT)에게 테스트 작성을 요청하기 위한 **최적화된 프롬프트를 생성해주는 CLI 도구**입니다.

복잡한 컨텍스트 설정, 파일 읽기, 포맷팅을 자동화하여 **"명령어 입력 → AI에게 붙여넣기"** 만으로 테스트 코드를 생산할 수 있습니다.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## ✨ Features

- 📋 **Auto Copy**: 생성된 프롬프트를 시스템 클립보드에 즉시 복사합니다.
- 🧠 **Context Aware**: `project-manifest.yaml` 설정을 자동으로 읽어 프로젝트 컨벤션을 준수합니다.
- 🚀 **Zero Config**: `npx`로 즉시 실행 가능합니다.

## 🚀 Quick Start

설치할 필요 없이 `npx`로 바로 실행하세요.

```bash
# 1. 프로젝트 초기 설정 (최초 1회)
npx @rencar-dev/prompt init

# 2. ATDD 시나리오 생성 요청
npx @rencar-dev/prompt atdd src/app/login/page.tsx
```

---

## 🛠 Commands

### 1. `init`
프로젝트의 기술 스택(Framework, Testing Library, Path Alias 등)을 분석하기 위한 프롬프트를 생성합니다.

```bash
npx @rencar-dev/prompt init
```
- **Output**: `project-convention-scanner.md` 내용 복사
- **Action**: AI에게 붙여넣고, 결과물인 `project-manifest.yaml`을 루트에 저장하세요.

### 2. `atdd`
구현된 소스 코드를 분석하여 **수용 테스트(Acceptance Test) 시나리오** 설계를 요청합니다.

> **수용 테스트란?**
> 코드의 내부 구현 방식보다는 **"사용자가 어떤 행동을 했을 때 무엇이 보여야 하는가(Given-When-Then)"**에 집중하여 비즈니스 요구사항을 검증하는 테스트입니다.

```bash
npx @rencar-dev/prompt atdd <source_path>
```
- **Example**: `npx @rencar-dev/prompt atdd app/(auth)/login/page.tsx`
- **Output**: 소스 코드 + ATDD 생성 프롬프트 결합 후 복사

### 3. `plan`
작성된 ATDD 시나리오를 바탕으로 **테스트 라우팅(Unit vs UI vs E2E)** 계획을 수립합니다.

```bash
npx @rencar-dev/prompt plan <source_path>
```
- **Prerequisite**: 같은 경로(또는 `_tests`)에 `.atdd.md` 파일이 있어야 더 정확합니다.
- **Output**: ATDD 파일 + 소스 코드 + Routing 프롬프트 결합 후 복사

### 4. `gen`
실제 **테스트 코드(Spec)** 작성을 요청합니다. 설계된 Plan에 따라 UI 테스트와 Unit 테스트를 구분해 요청하세요.

```bash
npx @rencar-dev/prompt gen <source_path> [options]
```

**Options:**
- `--type ui` (Default): React Component, Hook(Integration) 테스트
- `--type unit`: 순수 함수, Utils, Store Logic 테스트

```bash
# UI 테스트 생성 (기본값)
npx @rencar-dev/prompt gen app/login/page.tsx

# Unit 테스트 생성
npx @rencar-dev/prompt gen libs/utils/date.ts --type unit
```

---

## 🔄 Workflow

AI와 함께하는 개발 사이클은 다음과 같습니다.

1.  **Code**: 기능을 구현합니다. (예: `Login.tsx`)
2.  **ATDD**: `npx @rencar-dev/prompt atdd Login.tsx` ➡️ AI에게 붙여넣기 ➡️ `Login.atdd.md` 저장
3.  **Plan**: `npx @rencar-dev/prompt plan Login.tsx` ➡️ AI에게 붙여넣기 ➡️ `Login.test-plan.md` 저장
4.  **Test**: `npx @rencar-dev/prompt gen Login.tsx` ➡️ AI에게 붙여넣기 ➡️ `Login.test.tsx` 저장 & 실행

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
rencar-prompt atdd ...
```

### Release Strategy (GitHub Flow)
1. `main` 브랜치에서 기능 브랜치(`feature/new-command`) 생성
2. 작업 완료 후 `main`으로 Pull Request
3. Merge 시 GitHub Actions를 통해 NPM Registry(또는 GitHub Packages)로 자동 배포

---

## 📝 License

This project is licensed under the MIT License.
