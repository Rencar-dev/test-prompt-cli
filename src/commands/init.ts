import { Command } from 'commander';
import { readPromptTemplate } from '../utils/file.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { logger } from '../utils/logger.js';
import { ensureLessonsFile, createTestVerifySkill } from '../core/setup.js';

export const initCommand = new Command('init')
  .description('프로젝트 초기 분석을 위한 프롬프트 생성')
  .action(async () => {
    try {
      logger.info('ℹ️  프롬프트 템플릿 로딩 중...');

      const prompt = await readPromptTemplate('project-convention-scanner.md');

      await copyToClipboard(prompt);

      // project-test-lessons.md 파일 생성
      await ensureLessonsFile();

      // Claude Code test-verify 스킬 생성
      await createTestVerifySkill();

      logger.success('✅ 클립보드에 복사되었습니다!');
      logger.hint('AI에게 붙여넣고 project-manifest.yaml을 생성하세요.');
      logger.hint('Claude Code 사용자: 테스트 구현 후 /test-verify로 규칙 준수 여부를 검증하세요.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ 오류 발생: ${errorMessage}`);
      process.exit(1);
    }
  });
