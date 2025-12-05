import { Command } from 'commander';
import path from 'path';
import { copyToClipboard } from '../utils/clipboard.js';
import { resolveUserPath } from '../utils/path.js';
import { generatePlanPrompt } from '../core/prompt.js';
import { logger } from '../utils/logger.js';

export const planCommand = new Command('plan')
  .description('작성된 ATDD 시나리오를 바탕으로 테스트 라우팅(Unit vs UI vs E2E) 계획을 수립')
  .argument('<source_path>', '분석할 소스 파일 경로 (특수문자 포함 시 따옴표 사용: "app/(public)/login/page.tsx")')
  .action(async (sourcePath: string) => {
    try {
      logger.info('ℹ️  ATDD 파일 추적 및 프롬프트 생성 중...');

      // Core 로직 호출
      const combinedPrompt = await generatePlanPrompt(sourcePath);

      await copyToClipboard(combinedPrompt);

      logger.success('✅ 클립보드에 복사되었습니다!');
      logger.hint(`ATDD 시나리오, 프로젝트 설정, 소스 코드(${sourcePath})와 Test Routing 프롬프트가 결합되어 AI에게 붙여넣을 준비가 되었습니다.`);
    } catch (error: unknown) {
      // 에러 핸들링 세분화
      if (error instanceof Error && error.message === 'MANIFEST_NOT_FOUND') {
        logger.error('\n❌ [Error] project-manifest.yaml 파일을 찾을 수 없습니다.');
        logger.warn('👉 먼저 다음 명령어를 실행하여 프로젝트 설정을 진행해주세요:');
        logger.tip('\n    rencar-prompt init\n');
      } else if (error instanceof Error && error.message === 'ATDD_FILE_NOT_FOUND') {
        const absoluteSourcePath = resolveUserPath(sourcePath);
        logger.error('\n❌ [Error] ATDD 시나리오 파일을 찾을 수 없습니다.');
        logger.warn('👉 먼저 다음 명령어를 실행하여 ATDD 시나리오를 생성해주세요:');
        logger.tip(`\n    rencar-prompt atdd ${sourcePath}\n`);
        logger.hint(`   찾은 위치: ${path.dirname(absoluteSourcePath)}`);
        logger.hint('   예상 파일명: *.atdd.md (같은 경로 또는 _tests 폴더)');
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ 오류 발생: ${errorMessage}`);
      }
      process.exit(1);
    }
  });

