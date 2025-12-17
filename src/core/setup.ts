import fs from 'fs-extra';
import { logger } from '../utils/logger.js';

/**
 * project-test-lessons.md 파일이 없으면 기본 템플릿으로 생성합니다.
 *
 * ⚠️ 동기화 필요: 이 템플릿을 수정할 때
 *    src/prompts/feedback-analyzer-prompt.md의 "파일 구조 규칙" 섹션도 함께 수정하세요.
 */
export const ensureLessonsFile = async (): Promise<void> => {
  const lessonsPath = 'project-test-lessons.md';
  if (!(await fs.pathExists(lessonsPath))) {
    const defaultLessons = `# 🧪 Project Test Lessons & Rules

이 파일은 AI 에이전트가 테스트 생성 시 **반드시 준수해야 할 프로젝트별 규칙**을 정의합니다.

---

## 0. 📋 Project Context & Team Rules (프로젝트 맥락 및 팀 규칙) - 직접 작성

> AI가 테스트 생성 시 참고할 프로젝트 맥락과 규칙을 작성하세요.
> 이 섹션은 \`learn\` 명령어가 수정하지 않습니다.

### 프로젝트 맥락 (선택)
\`\`\`
예시:
- 도메인: 이커머스, 금융, 헬스케어 등
- 주요 용어: SKU = 재고 관리 단위, PDP = 상품 상세 페이지
- 아키텍처: Feature-Sliced Design, 모노레포 구조 등
\`\`\`

- (프로젝트 맥락을 여기에 추가하세요)

### 테스트 규칙 (선택)
\`\`\`
예시:
- Toast 메시지는 getByRole('alert') 대신 getByText 사용
- API Mock 파일은 src/mocks/handlers/ 디렉토리에 위치
- 테스트 ID 형식: data-testid="component-name-element"
\`\`\`

- (팀 테스트 규칙을 여기에 추가하세요)

---

## 1. 🚨 Critical Environment Rules (환경 설정 필수)

> JSDOM, Node.js 환경 차이로 인해 발생하는 필수 Mocking 규칙입니다.
> 이 섹션은 \`learn\` 명령어가 자동으로 업데이트합니다.

- (아직 기록된 내용 없음)

## 2. 🛠 Library & Framework Specifics (라이브러리 특이사항)

> 사용하는 라이브러리(Zustand, TanStack Query, MSW 등)의 특이사항을 기록합니다.

- (아직 기록된 내용 없음)

## 3. ⚠️ Common Anti-Patterns (자주 틀리는 패턴)

> 이 프로젝트에서 반복적으로 실패했던 패턴들입니다.

- (아직 기록된 내용 없음)
`;
    await fs.writeFile(lessonsPath, defaultLessons, 'utf-8');
    logger.success('✅ project-test-lessons.md 파일이 생성되었습니다.');
  }
};
