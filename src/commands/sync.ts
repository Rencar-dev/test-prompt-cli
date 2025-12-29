import { Command } from 'commander';
import { copyToClipboard } from '../utils/clipboard.js';
import { logger } from '../utils/logger.js';
import { findTestFile, findAtddFile, findPlanFile } from '../core/locator.js';
import { generateSyncPrompt } from '../core/prompt.js';
import { selectFileInteractively, SyncLevel } from '../utils/interactive.js';

/** 기본 동기화 수준 */
const DEFAULT_SYNC_LEVEL: SyncLevel = 'test-only';

export const syncCommand = new Command('sync')
  .description('코드 변경 후 테스트를 동기화합니다. 소스와 테스트 간 불일치를 분석하고 수정합니다.')
  .argument('[source_path]', '동기화할 소스 파일 경로 (생략 시 Interactive 모드)')
  .option('--full', '전체 업데이트 (ATDD → Plan → Test)', false)
  .action(async (sourcePath: string | undefined, options: { full: boolean }) => {
    let syncLevel: SyncLevel;

    // 인자가 없으면 Interactive 모드
    if (!sourcePath) {
      const result = await selectFileInteractively('sync');
      if (!result) {
        process.exit(0);
      }
      sourcePath = result.filePath;
      syncLevel = result.syncLevel || DEFAULT_SYNC_LEVEL;
    } else {
      // 인자가 있으면 --full 옵션으로 결정
      syncLevel = options.full ? 'full' : 'test-only';
    }

    await executeSync(sourcePath, syncLevel);
  });

/**
 * Sync 프롬프트 생성 실행
 */
const executeSync = async (
  sourcePath: string,
  syncLevel: SyncLevel
): Promise<void> => {
  try {
    const levelLabel = syncLevel === 'test-only' ? '테스트만 수정' : '전체 업데이트';
    logger.info(`ℹ️  동기화 프롬프트 생성 중... (${levelLabel})`);

    // 관련 파일 경로 수집
    const testPath = await findTestFile(sourcePath);
    const atddPath = await findAtddFile(sourcePath);
    const planPath = await findPlanFile(sourcePath);

    // 테스트 파일이 없으면 동기화 불가
    if (!testPath) {
      logger.error('❌ 테스트 파일을 찾을 수 없습니다.');
      logger.hint('먼저 `prompt gen`을 실행하여 테스트를 생성하세요.');
      process.exit(1);
    }

    // 파일 존재 여부 로그
    logger.info(`📁 소스: ${sourcePath}`);
    logger.info(`📁 테스트: ${testPath}`);
    if (atddPath) {
      logger.info(`📁 ATDD: ${atddPath}`);
    } else {
      logger.warn('⚠️  ATDD 파일 없음');
    }
    if (planPath) {
      logger.info(`📁 Plan: ${planPath}`);
    } else {
      logger.warn('⚠️  Plan 파일 없음');
    }

    // full 모드인데 ATDD/Plan이 없으면 경고
    if (syncLevel === 'full' && (!atddPath || !planPath)) {
      logger.warn('⚠️  전체 업데이트 모드이지만 ATDD 또는 Plan 파일이 없습니다.');
      logger.hint('테스트 파일만 수정됩니다.');
    }

    // 프롬프트 생성
    const prompt = await generateSyncPrompt(
      {
        sourcePath,
        testPath,
        atddPath,
        planPath,
      },
      syncLevel
    );

    // 결과 처리
    await copyToClipboard(prompt);

    logger.success('✅ 클립보드에 복사되었습니다!');
    logger.hint('AI에게 붙여넣어 테스트 동기화를 시작하세요.');
    logger.hint('AI가 파일을 직접 읽고 분석합니다.');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ 오류 발생: ${errorMessage}`);
    process.exit(1);
  }
};
