import { Command } from 'commander';
import { copyToClipboard } from '../utils/clipboard.js';
import { generateAtddPrompt } from '../core/prompt.js';
import { logger } from '../utils/logger.js';

export const atddCommand = new Command('atdd')
  .description('구현된 소스 코드를 분석하여 수용 테스트(Acceptance Test) 시나리오 설계를 요청')
  .argument('<source_path>', '분석할 소스 파일 경로 (특수문자 포함 시 따옴표 사용: "app/(public)/login/page.tsx")')
  .action(async (sourcePath: string) => {
    try {
      logger.info('ℹ️  데이터 분석 및 프롬프트 생성 중...');

      // Core 로직 호출
      const combinedPrompt = await generateAtddPrompt(sourcePath);

      // 결과 처리 (Side Effect)
      await copyToClipboard(combinedPrompt);

      logger.success('✅ 클립보드에 복사되었습니다!');
      logger.hint(`소스 코드(${sourcePath}) 분석 완료.`);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'MANIFEST_NOT_FOUND') {
        logger.error('\n❌ [Error] project-manifest.yaml 파일을 찾을 수 없습니다.');
        logger.warn('👉 먼저 다음 명령어를 실행하여 프로젝트 설정을 진행해주세요:');
        logger.tip('\n    rencar-prompt init\n');
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ 오류 발생: ${errorMessage}`);
      }
      process.exit(1);
    }
  });

