import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { copyToClipboard } from '../utils/clipboard.js';
import { logger } from '../utils/logger.js';
import { findTestFile } from '../core/locator.js';
import { generateLearnPrompt } from '../core/prompt.js';
import { readUserFile, getTestCommandConfig } from '../utils/file.js';
import { runTest } from '../core/runner.js';

export const learnCommand = new Command('learn')
  .description('테스트 실패 로그를 분석하여 프로젝트 전용 오답노트(Lessons Learned)를 갱신합니다.')
  .argument('<source_path>', '분석할 소스 파일 경로')
  .action(async (sourcePath: string) => {
    try {
      // 1. 테스트 파일 찾기
      const testFilePath = await findTestFile(sourcePath);
      if (!testFilePath) {
        logger.error(`❌ 테스트 파일을 찾을 수 없습니다.`);
        logger.hint(`소스 경로: ${sourcePath}`);
        logger.hint(`예상 위치: 같은 폴더 또는 __tests__ 폴더 내의 .test.tsx, .spec.tsx 등`);
        process.exit(1);
      }

      logger.info(`🔎 테스트 파일 발견: ${path.basename(testFilePath)}`);

      // 2. 테스트 실행
      const testCommand = await getTestCommandConfig();
      const { isSuccess, stdout, stderr } = await runTest(testFilePath, testCommand);

      // 3. 테스트 성공 시 종료
      if (isSuccess) {
        logger.success('✅ 테스트가 성공했습니다! 배울 내용이 없습니다.');
        process.exit(0);
      }

      logger.warn('❌ 테스트 실패! 에러 로그를 분석합니다...');

      // 4. 데이터 수집
      const failedCode = await readUserFile(testFilePath);
      const errorLog = stderr || stdout; // stderr가 비어있으면 stdout 사용

      // 기존 오답노트 읽기 (없으면 빈 문자열)
      const lessonsPath = path.resolve(process.cwd(), 'project-test-lessons.md');
      let existingLessons = '';
      if (await fs.pathExists(lessonsPath)) {
        existingLessons = await fs.readFile(lessonsPath, 'utf-8');
      } else {
        existingLessons = '(없음)';
      }

      // 5. 프롬프트 생성
      const prompt = await generateLearnPrompt(failedCode, errorLog, existingLessons);

      // 6. 클립보드 복사
      await copyToClipboard(prompt);

      logger.success('✅ 분석 프롬프트가 클립보드에 복사되었습니다!');
      logger.info('👉 AI에게 붙여넣어 오답노트를 갱신하세요.');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ 오류 발생: ${errorMessage}`);
      process.exit(1);
    }
  });
