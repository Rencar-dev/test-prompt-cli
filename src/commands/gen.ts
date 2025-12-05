import { Command } from 'commander';
import path from 'path';
import { copyToClipboard } from '../utils/clipboard.js';
import { resolveUserPath } from '../utils/path.js';
import { generateGenPrompt } from '../core/prompt.js';
import { logger } from '../utils/logger.js';
import {
  TestType,
  DEFAULT_TEST_TYPE,
  TEST_TYPES,
  isValidTestType,
  getTestTypeLabel,
} from '../core/test-type.js';

export const genCommand = new Command('gen')
  .description('실제 테스트 코드(Spec) 작성을 요청합니다. 설계된 Plan에 따라 UI 테스트와 Unit 테스트를 구분해 요청하세요.')
  .argument('<source_path>', '분석할 소스 파일 경로 (특수문자 포함 시 따옴표 사용: "app/(public)/login/page.tsx")')
  .option('--type <type>', '테스트 타입 (ui | unit)', DEFAULT_TEST_TYPE)
  .action(async (sourcePath: string, options: { type: string }) => {
    // 타입 검증
    const testTypeInput = options.type.toLowerCase();
    
    if (!isValidTestType(testTypeInput)) {
      logger.error(`❌ 잘못된 타입입니다: ${options.type}`);
      logger.hint(`사용 가능한 타입: ${Object.values(TEST_TYPES).join(', ')}`);
      process.exit(1);
    }

    const testType: TestType = testTypeInput;

    try {
      logger.info(`ℹ️  ${getTestTypeLabel(testType)} 테스트 프롬프트 생성 중...`);

      // Core 로직 호출
      const combinedPrompt = await generateGenPrompt(sourcePath, testType);

      // 결과 처리 (Side Effect)
      await copyToClipboard(combinedPrompt);

      logger.success('✅ 클립보드에 복사되었습니다!');
      logger.hint(`${getTestTypeLabel(testType)} 테스트 프롬프트가 생성되었습니다.`);
      logger.hint(`소스 코드(${sourcePath}) 분석 완료.`);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'MANIFEST_NOT_FOUND') {
        logger.error('\n❌ [Error] project-manifest.yaml 파일을 찾을 수 없습니다.');
        logger.warn('👉 먼저 다음 명령어를 실행하여 프로젝트 설정을 진행해주세요:');
        logger.tip('\n    rencar-prompt init\n');
      } else if (error instanceof Error && error.message === 'PLAN_FILE_NOT_FOUND') {
        const absoluteSourcePath = resolveUserPath(sourcePath);
        logger.error('\n❌ [Error] Test Plan 파일을 찾을 수 없습니다.');
        logger.warn('👉 먼저 다음 명령어를 실행하여 Test Plan을 생성해주세요:');
        logger.tip(`\n    rencar-prompt plan ${sourcePath}\n`);
        logger.hint(`   찾은 위치: ${path.dirname(absoluteSourcePath)}`);
        logger.hint('   예상 파일명: *.test-plan.md (같은 경로 또는 _tests 폴더)');
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ 오류 발생: ${errorMessage}`);
      }
      process.exit(1);
    }
  });

