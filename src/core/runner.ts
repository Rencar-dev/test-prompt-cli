import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger.js';

const DEFAULT_TEST_TIMEOUT_MS = 30 * 1000; // 30초 (유닛/통합 테스트 대상)

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
  const fullCommand = `${testCommand} "${relativeTestPath}"`;

  logger.info(`🚀 테스트 실행 중... (${fullCommand})`);

  /**
   * NOTE:
   * - 많은 테스트 러너(vitest/jest 등)는 TTY 환경에서 기본 watch 모드로 동작할 수 있습니다.
   * - 기존 exec()는 "프로세스 종료"까지 기다리고, stdout/stderr도 종료 후에만 반환합니다.
   *   → watch 모드면 영원히 resolve/reject되지 않아 learn 단계가 멈춥니다.
   * - 해결: spawn으로 스트리밍 캡처 + CI 환경 강제 + 타임아웃으로 무한 대기 방지
   */
  return await new Promise<TestResult>((resolve) => {
    const env = {
      ...process.env,
      /**
       * 테스트 러너가 interactive/watch 모드로 들어가는 것을 방지합니다.
       * - vitest: CI=1이면 기본적으로 watch를 끄고 run처럼 동작하는 경우가 많습니다.
       * - jest: CI=1이면 watch 프롬프트를 비활성화합니다.
       */
      CI: process.env.CI ?? '1',
      /**
       * 일부 vitest 환경에서 watch를 명시적으로 끄기 위한 힌트.
       * (프로젝트마다 다르지만 해가 되는 경우가 거의 없습니다.)
       */
      VITEST_WATCH: process.env.VITEST_WATCH ?? 'false',
    };

    const child = spawn(fullCommand, {
      shell: true,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      // learn 모드에서 "멈춘 것처럼" 보이는 문제를 줄이기 위해 로그를 스트리밍합니다.
      process.stdout.write(text);
    });
    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
    }, DEFAULT_TEST_TIMEOUT_MS);

    const finalize = (result: TestResult) => {
      clearTimeout(timeoutId);
      resolve(result);
    };

    child.on('error', (error) => {
      finalize({
        isSuccess: false,
        stdout,
        stderr: `${stderr}\n[runner error] ${error.message}`,
        command: fullCommand,
      });
    });

    child.on('close', (code, signal) => {
      if (didTimeout) {
        finalize({
          isSuccess: false,
          stdout,
          stderr:
            `${stderr}\n[timeout] 테스트가 ${DEFAULT_TEST_TIMEOUT_MS}ms 내에 종료되지 않아 중단했습니다.` +
            ` (code=${code ?? 'null'}, signal=${signal ?? 'null'})`,
          command: fullCommand,
        });
        return;
      }

      finalize({
        isSuccess: code === 0,
        stdout,
        stderr,
        command: fullCommand,
      });
    });
  });
};
