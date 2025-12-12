import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { runTest } from './runner.js';

// Mock child_process spawn
const { mockSpawn } = vi.hoisted(() => ({
  mockSpawn: vi.fn(),
}));

vi.mock('child_process', () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
}));

vi.mock('../utils/file.js');
vi.mock('../utils/logger.js');

type MockChildProcess = EventEmitter & {
  stdout?: EventEmitter;
  stderr?: EventEmitter;
  kill?: (signal?: NodeJS.Signals) => void;
};

const createMockChildProcess = (): MockChildProcess => {
  const child = new EventEmitter() as MockChildProcess;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
  return child;
};

describe('runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runTest', () => {
    it('테스트 성공 시 결과를 반환한다', async () => {
      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'npm test --';
      const mockStdout = 'Test Passed';
      const mockStderr = '';

      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child);

      const promise = runTest(testFilePath, mockCommand);
      child.stdout?.emit('data', Buffer.from(mockStdout));
      child.stderr?.emit('data', Buffer.from(mockStderr));
      child.emit('close', 0, null);
      const result = await promise;

      expect(result.isSuccess).toBe(true);
      expect(result.stdout).toBe(mockStdout);
      expect(result.stderr).toBe(mockStderr);
      expect(result.command).toContain(mockCommand);
    });

    it('테스트 실패 시 결과를 반환한다', async () => {
      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'npm test --';
      const mockStdout = 'Test Failed';
      const mockStderr = 'Error details';
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child);

      const promise = runTest(testFilePath, mockCommand);
      child.stdout?.emit('data', Buffer.from(mockStdout));
      child.stderr?.emit('data', Buffer.from(mockStderr));
      child.emit('close', 1, null);
      const result = await promise;

      expect(result.isSuccess).toBe(false);
      expect(result.stdout).toBe(mockStdout);
      expect(result.stderr).toBe(mockStderr);
    });

    it('커스텀 테스트 커맨드를 사용한다', async () => {
      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'vitest run';

      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child);

      const promise = runTest(testFilePath, mockCommand);
      child.emit('close', 0, null);
      const result = await promise;

      expect(result.command).toContain(mockCommand);
    });

    it('경로에 특수문자(괄호)가 있을 때 따옴표로 감싼다', async () => {
      const testFilePath = '/abs/app/(public)/user/login/_tests/login.test.tsx';
      const mockCommand = 'yarn test';

      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child);

      const promise = runTest(testFilePath, mockCommand);
      child.emit('close', 0, null);
      const result = await promise;

      // 경로가 따옴표로 감싸져야 함
      expect(result.command).toMatch(/yarn test ".*\(public\).*"/);
    });

    it('spawn 오류 시 에러 메시지를 stderr에 추가한다', async () => {
      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'npm test --';
      const mockError = new Error('spawn ENOENT');

      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child);

      const promise = runTest(testFilePath, mockCommand);
      child.emit('error', mockError);
      const result = await promise;

      expect(result.isSuccess).toBe(false);
      expect(result.stderr).toContain('[runner error]');
      expect(result.stderr).toContain('spawn ENOENT');
    });

    it('타임아웃 시 프로세스를 종료하고 실패 처리한다', async () => {
      vi.useFakeTimers();

      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'npm test --';

      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child);

      const promise = runTest(testFilePath, mockCommand);

      // 30초 경과
      vi.advanceTimersByTime(30000);

      // 타임아웃 후 close 이벤트 발생
      child.emit('close', null, 'SIGTERM');

      const result = await promise;

      expect(result.isSuccess).toBe(false);
      expect(result.stderr).toContain('[timeout]');
      expect(result.stderr).toContain('30000ms');
      expect(child.kill).toHaveBeenCalledWith('SIGTERM');

      vi.useRealTimers();
    });

    it('spawn 호출 시 CI 환경 변수를 전달한다', async () => {
      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'vitest run';

      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child);

      const promise = runTest(testFilePath, mockCommand);
      child.emit('close', 0, null);
      await promise;

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          env: expect.objectContaining({
            CI: '1',
            VITEST_WATCH: 'false',
          }),
        })
      );
    });
  });
});
