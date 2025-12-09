import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export interface TestResult {
  isSuccess: boolean;
  stdout: string;
  stderr: string;
  command: string;
}

/**
 * 특정 테스트 파일을 실행하고 결과를 반환합니다.
 * @param testFilePath - 실행할 테스트 파일의 절대 경로
 * @param testCommand - 실행할 테스트 커맨드 (예: 'npm test --')
 */
export const runTest = async (testFilePath: string, testCommand: string): Promise<TestResult> => {
  const relativeTestPath = path.relative(process.cwd(), testFilePath);
  const fullCommand = `${testCommand} ${relativeTestPath}`;

  logger.info(`🚀 테스트 실행 중... (${fullCommand})`);

  try {
    const result = await execAsync(fullCommand);
    return {
      isSuccess: true,
      stdout: result.stdout,
      stderr: result.stderr,
      command: fullCommand,
    };
  } catch (error: any) {
    return {
      isSuccess: false,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      command: fullCommand,
    };
  }
};
