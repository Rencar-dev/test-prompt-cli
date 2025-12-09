import fs from 'fs-extra';
import { logger } from '../utils/logger.js';

/**
 * project-test-lessons.md 파일이 없으면 기본 템플릿으로 생성합니다.
 */
export const ensureLessonsFile = async (): Promise<void> => {
  const lessonsPath = 'project-test-lessons.md';
  if (!(await fs.pathExists(lessonsPath))) {
    const defaultLessons = `# 🧪 Project Test Lessons & Rules

이 파일은 AI 에이전트가 테스트 생성 시 **반드시 준수해야 할 프로젝트별 규칙**을 정의합니다.
테스트 실패 경험을 통해 지속적으로 업데이트됩니다.

## 1. 🚨 Critical Environment Rules (환경 설정 필수)
> JSDOM, Node.js 환경 차이로 인해 발생하는 필수 Mocking 규칙입니다.

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
