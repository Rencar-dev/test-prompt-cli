import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runTest } from './runner.js';

// Mock child_process exec
const { mockExec } = vi.hoisted(() => ({
  mockExec: vi.fn(),
}));

vi.mock('child_process', () => ({
  exec: (cmd: string, cb: any) => mockExec(cmd, cb),
}));

// Mock util.promisify to return our mockExec
vi.mock('util', () => ({
  promisify: () => mockExec,
}));

vi.mock('../utils/file.js');
vi.mock('../utils/logger.js');

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

      mockExec.mockResolvedValue({ stdout: mockStdout, stderr: mockStderr });

      const result = await runTest(testFilePath, mockCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.stdout).toBe(mockStdout);
      expect(result.stderr).toBe(mockStderr);
      expect(result.command).toContain(mockCommand);
    });

    it('테스트 실패 시 결과를 반환한다', async () => {
      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'npm test --';
      const mockError = { stdout: 'Test Failed', stderr: 'Error details' };

      mockExec.mockRejectedValue(mockError);

      const result = await runTest(testFilePath, mockCommand);

      expect(result.isSuccess).toBe(false);
      expect(result.stdout).toBe(mockError.stdout);
      expect(result.stderr).toBe(mockError.stderr);
    });

    it('커스텀 테스트 커맨드를 사용한다', async () => {
      const testFilePath = '/abs/src/app/login/page.test.tsx';
      const mockCommand = 'vitest run';
      
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await runTest(testFilePath, mockCommand);

      expect(result.command).toContain(mockCommand);
    });

    it('경로에 특수문자(괄호)가 있을 때 따옴표로 감싼다', async () => {
      const testFilePath = '/abs/app/(public)/user/login/_tests/login.test.tsx';
      const mockCommand = 'yarn test';
      
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await runTest(testFilePath, mockCommand);

      // 경로가 따옴표로 감싸져야 함
      expect(result.command).toMatch(/yarn test ".*\(public\).*"/);
    });
  });
});
