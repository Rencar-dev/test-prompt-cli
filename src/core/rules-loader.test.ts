import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllRulePaths,
  loadRules,
  loadCommonRules,
  loadTestTypeRules,
  loadRuleContent,
  RULE_MODULES,
  CONTEXT_BASED_RULES,
} from './rules-loader.js';
import * as fileUtils from '../utils/file.js';
import * as loggerUtils from '../utils/logger.js';

vi.mock('../utils/file.js');
vi.mock('../utils/logger.js');

describe('rules-loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllRulePaths', () => {
    it('RULE_MODULES의 모든 규칙 경로를 포함한다', () => {
      const paths = getAllRulePaths();

      // runner 규칙
      expect(paths).toContain('rules/runner/_shared.md');
      expect(paths).toContain('rules/runner/vitest.md');
      expect(paths).toContain('rules/runner/jest.md');

      // state 규칙
      expect(paths).toContain('rules/state/zustand.md');
      expect(paths).toContain('rules/state/redux-toolkit.md');
      expect(paths).toContain('rules/state/recoil.md');
      expect(paths).toContain('rules/state/jotai.md');

      // query 규칙
      expect(paths).toContain('rules/query/tanstack-query.md');
      expect(paths).toContain('rules/query/swr.md');
      expect(paths).toContain('rules/query/rtk-query.md');
      expect(paths).toContain('rules/query/apollo.md');

      // mock 규칙
      expect(paths).toContain('rules/mock/msw.md');
      expect(paths).toContain('rules/mock/nock.md');
      expect(paths).toContain('rules/mock/fetch-mock.md');
      expect(paths).toContain('rules/mock/module-mock.md');

      // router 규칙
      expect(paths).toContain('rules/router/next-app.md');
      expect(paths).toContain('rules/router/next-pages.md');
      expect(paths).toContain('rules/router/react-router.md');
    });

    it('CONTEXT_BASED_RULES의 모든 규칙 경로를 포함한다', () => {
      const paths = getAllRulePaths();

      for (const rule of CONTEXT_BASED_RULES) {
        expect(paths).toContain(`rules/${rule.path}`);
      }
    });

    it('중복 경로가 없다', () => {
      const paths = getAllRulePaths();
      const uniquePaths = [...new Set(paths)];

      expect(paths).toHaveLength(uniquePaths.length);
    });

    it('배열 경로(vitest, jest)를 개별 경로로 분리한다', () => {
      const paths = getAllRulePaths();

      // vitest는 ['rules/runner/_shared.md', 'rules/runner/vitest.md']
      // 둘 다 개별적으로 포함되어야 함
      expect(paths).toContain('rules/runner/_shared.md');
      expect(paths).toContain('rules/runner/vitest.md');
    });
  });

  describe('loadCommonRules', () => {
    it('_common.md 내용을 반환한다', async () => {
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('# Common Rules');

      const result = await loadCommonRules();

      expect(result).toBe('# Common Rules');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/_common.md');
    });

    it('파일이 없으면 빈 문자열을 반환한다', async () => {
      vi.spyOn(fileUtils, 'readPromptTemplate').mockRejectedValue(new Error('Not found'));

      const result = await loadCommonRules();

      expect(result).toBe('');
    });
  });

  describe('loadTestTypeRules', () => {
    it('ui 타입일 때 test-type/ui.md 내용을 반환한다', async () => {
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('# UI Rules');

      const result = await loadTestTypeRules('ui');

      expect(result).toBe('# UI Rules');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/test-type/ui.md');
    });

    it('unit 타입일 때 test-type/unit.md 내용을 반환한다', async () => {
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('# Unit Rules');

      const result = await loadTestTypeRules('unit');

      expect(result).toBe('# Unit Rules');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/test-type/unit.md');
    });

    it('파일이 없으면 빈 문자열을 반환한다', async () => {
      vi.spyOn(fileUtils, 'readPromptTemplate').mockRejectedValue(new Error('Not found'));

      const result = await loadTestTypeRules('ui');

      expect(result).toBe('');
    });
  });

  describe('loadRuleContent', () => {
    it('유효한 필드와 값으로 규칙 내용을 반환한다 (배열 경로)', async () => {
      const sharedContent = '# Shared Rules';
      const vitestContent = '# Vitest Rules';
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(sharedContent)
        .mockResolvedValueOnce(vitestContent);

      const result = await loadRuleContent('testRunner', 'vitest');

      expect(result).toContain(sharedContent);
      expect(result).toContain(vitestContent);
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/runner/_shared.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/runner/vitest.md');
    });

    it('지원하지 않는 값이면 빈 문자열을 반환한다', async () => {
      const result = await loadRuleContent('testRunner', 'unknown');

      expect(result).toBe('');
    });

    it('파일이 없으면 경고 후 빈 문자열을 반환한다', async () => {
      const warnSpy = vi.spyOn(loggerUtils.logger, 'warn').mockImplementation(() => {});
      vi.spyOn(fileUtils, 'readPromptTemplate').mockRejectedValue(new Error('Not found'));

      const result = await loadRuleContent('testRunner', 'vitest');

      expect(result).toBe('');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('loadRules', () => {
    it('ui 타입일 때 _common.md, test-type/ui.md 및 모든 규칙 모듈을 조합한다', async () => {
      const mockReadPromptTemplate = vi.spyOn(fileUtils, 'readPromptTemplate');
      mockReadPromptTemplate.mockImplementation(async (path: string) => {
        if (path === 'rules/_common.md') return '# Common Rules';
        if (path === 'rules/test-type/ui.md') return '# UI Rules';
        return `# ${path}`;
      });

      const result = await loadRules('ui');

      expect(result).toContain('# Common Rules');
      expect(result).toContain('# UI Rules');
      expect(mockReadPromptTemplate).toHaveBeenCalledWith('rules/_common.md');
      expect(mockReadPromptTemplate).toHaveBeenCalledWith('rules/test-type/ui.md');
    });

    it('unit 타입일 때 _common.md, test-type/unit.md 및 모든 규칙 모듈을 조합한다', async () => {
      const mockReadPromptTemplate = vi.spyOn(fileUtils, 'readPromptTemplate');
      mockReadPromptTemplate.mockImplementation(async (path: string) => {
        if (path === 'rules/_common.md') return '# Common Rules';
        if (path === 'rules/test-type/unit.md') return '# Unit Rules';
        return `# ${path}`;
      });

      const result = await loadRules('unit');

      expect(result).toContain('# Common Rules');
      expect(result).toContain('# Unit Rules');
      expect(mockReadPromptTemplate).toHaveBeenCalledWith('rules/_common.md');
      expect(mockReadPromptTemplate).toHaveBeenCalledWith('rules/test-type/unit.md');
    });

    it('모든 RULE_MODULES 규칙을 로드한다', async () => {
      const mockReadPromptTemplate = vi.spyOn(fileUtils, 'readPromptTemplate');
      mockReadPromptTemplate.mockResolvedValue('# Content');

      await loadRules('ui');

      // 모든 규칙 모듈이 로드되었는지 확인
      const calls = mockReadPromptTemplate.mock.calls.map(([path]) => path);

      // runner 규칙
      expect(calls).toContain('rules/runner/_shared.md');
      expect(calls).toContain('rules/runner/vitest.md');
      expect(calls).toContain('rules/runner/jest.md');

      // state 규칙
      expect(calls).toContain('rules/state/zustand.md');

      // mock 규칙
      expect(calls).toContain('rules/mock/msw.md');

      // CONTEXT_BASED_RULES
      for (const rule of CONTEXT_BASED_RULES) {
        expect(calls).toContain(`rules/${rule.path}`);
      }
    });

    it('중복 모듈 경로는 한 번만 로드한다', async () => {
      const mockReadPromptTemplate = vi.spyOn(fileUtils, 'readPromptTemplate');
      mockReadPromptTemplate.mockResolvedValue('# Content');

      await loadRules('ui');

      // _common.md가 한 번만 호출되어야 함
      const calls = mockReadPromptTemplate.mock.calls;
      const commonCalls = calls.filter(([path]) => path === 'rules/_common.md');
      expect(commonCalls).toHaveLength(1);

      // _shared.md도 한 번만 호출되어야 함 (vitest와 jest에 모두 포함되지만)
      const sharedCalls = calls.filter(([path]) => path === 'rules/runner/_shared.md');
      expect(sharedCalls).toHaveLength(1);
    });

    it('모듈 파일이 없으면 건너뛰고 경고를 출력한다', async () => {
      const warnSpy = vi.spyOn(loggerUtils.logger, 'warn').mockImplementation(() => {});
      const mockReadPromptTemplate = vi.spyOn(fileUtils, 'readPromptTemplate');

      mockReadPromptTemplate.mockImplementation(async (path: string) => {
        if (path === 'rules/_common.md') return '# Common Rules';
        if (path === 'rules/test-type/ui.md') return '# UI Rules';
        throw new Error('File not found');
      });

      const result = await loadRules('ui');

      expect(result).toContain('# Common Rules');
      expect(result).toContain('# UI Rules');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('규칙 모듈을 찾을 수 없습니다')
      );

      warnSpy.mockRestore();
    });

    it('규칙 모듈들을 구분자로 연결한다', async () => {
      const mockReadPromptTemplate = vi.spyOn(fileUtils, 'readPromptTemplate');
      mockReadPromptTemplate.mockImplementation(async (path: string) => {
        if (path === 'rules/_common.md') return 'Content A';
        if (path === 'rules/test-type/ui.md') return 'Content B';
        throw new Error('Skip others');
      });

      vi.spyOn(loggerUtils.logger, 'warn').mockImplementation(() => {});

      const result = await loadRules('ui');

      expect(result).toBe('Content A\n\n---\n\nContent B');
    });
  });
});
