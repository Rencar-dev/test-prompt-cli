/**
 * interactive Unit Tests
 * Source: src/utils/interactive.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('prompts', () => ({
  default: vi.fn(),
}));

vi.mock('./file-scanner.js', () => ({
  scanForAtdd: vi.fn(),
  scanForPlan: vi.fn(),
  scanForGen: vi.fn(),
  scanForLearn: vi.fn(),
}));

vi.mock('./logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    hint: vi.fn(),
    tip: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { inferTestType, selectFileInteractively } from './interactive.js';

describe('inferTestType (확장자 기반 테스트 타입 추론)', () => {
  describe('UI 타입 반환 케이스', () => {
    it.each([
      { filePath: 'app/login/page.tsx', desc: '.tsx 파일' },
      { filePath: 'components/Button.jsx', desc: '.jsx 파일' },
      { filePath: 'hooks/useModal.tsx', desc: 'hooks 폴더의 .tsx (렌더링 포함 훅)' },
      { filePath: 'utils/renderIcon.tsx', desc: 'utils 폴더의 .tsx (JSX 반환 유틸)' },
      { filePath: 'src/features/auth/components/LoginForm.tsx', desc: '깊은 경로의 .tsx' },
    ])('$desc → UI 타입을 반환한다', ({ filePath }) => {
      // When
      const result = inferTestType(filePath);

      // Then
      expect(result).toBe('ui');
    });
  });

  describe('Unit 타입 반환 케이스', () => {
    it.each([
      { filePath: 'utils/formatDate.ts', desc: '.ts 파일' },
      { filePath: 'lib/helpers.js', desc: '.js 파일' },
      { filePath: 'hooks/useAuth.ts', desc: 'hooks 폴더의 .ts (로직만 있는 훅)' },
      { filePath: 'app/api/route.ts', desc: 'app 폴더의 .ts (API 라우트)' },
      { filePath: 'src/features/auth/utils/validate.ts', desc: '깊은 경로의 .ts' },
    ])('$desc → Unit 타입을 반환한다', ({ filePath }) => {
      // When
      const result = inferTestType(filePath);

      // Then
      expect(result).toBe('unit');
    });
  });

  describe('경계값 테스트', () => {
    it.each([
      { filePath: 'Button.TSX', expected: 'unit', desc: '대문자 확장자 (정규식 미매칭)' },
      { filePath: 'file.tsx.bak', expected: 'unit', desc: '.tsx가 중간에 있는 경우' },
      { filePath: 'tsxfile.ts', expected: 'unit', desc: 'tsx가 파일명에 포함된 .ts' },
      { filePath: '.tsx', expected: 'ui', desc: '확장자만 있는 파일' },
    ])('$desc ($filePath) → $expected 타입을 반환한다', ({ filePath, expected }) => {
      // When
      const result = inferTestType(filePath);

      // Then
      expect(result).toBe(expected);
    });
  });
});

describe('selectFileInteractively (ESC 취소 처리)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ESC(exited=true)로 종료되면 선택값이 있어도 null을 반환한다', async () => {
    const promptsModule = await import('prompts');
    const promptsMock = promptsModule.default as unknown as ReturnType<typeof vi.fn>;

    const scanners = await import('./file-scanner.js');
    const scanForAtddMock = scanners.scanForAtdd as unknown as ReturnType<typeof vi.fn>;
    scanForAtddMock.mockResolvedValue([{ title: 'login page', value: 'app/login/page.tsx' }]);

    promptsMock.mockImplementation(async (question: any) => {
      question.onState?.({ value: 'app/login/page.tsx', aborted: false, exited: true });
      return { selected: 'app/login/page.tsx' };
    });

    const result = await selectFileInteractively('atdd');
    expect(result).toBeNull();
  });

  it('정상 submit(exited=false, aborted=false)이면 선택된 filePath를 반환한다', async () => {
    const promptsModule = await import('prompts');
    const promptsMock = promptsModule.default as unknown as ReturnType<typeof vi.fn>;

    const scanners = await import('./file-scanner.js');
    const scanForAtddMock = scanners.scanForAtdd as unknown as ReturnType<typeof vi.fn>;
    scanForAtddMock.mockResolvedValue([{ title: 'login page', value: 'app/login/page.tsx' }]);

    promptsMock.mockImplementation(async (question: any) => {
      question.onState?.({ value: 'app/login/page.tsx', aborted: false, exited: false });
      return { selected: 'app/login/page.tsx' };
    });

    const result = await selectFileInteractively('atdd');
    expect(result).toEqual({ filePath: 'app/login/page.tsx' });
  });
});
