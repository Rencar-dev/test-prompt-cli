import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRuleModulePaths,
  loadRules,
  loadCommonRules,
  loadTestTypeRules,
  loadRuleContent,
} from './rules-loader.js';
import * as fileUtils from '../utils/file.js';
import * as loggerUtils from '../utils/logger.js';
import * as manifestUtils from '../utils/manifest.js';
import type { ManifestConfig } from '../utils/manifest.js';

vi.mock('../utils/file.js');
vi.mock('../utils/logger.js');
vi.mock('../utils/manifest.js');

describe('rules-loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRuleModulePaths', () => {
    it('항상 _common.md를 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/_common.md');
    });

    it('vitest 설정 시 vitest 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'vitest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/runner/vitest.md');
    });

    it('jest 설정 시 jest 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'jest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/runner/jest.md');
    });

    it('zustand 설정 시 zustand 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'zustand',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/state/zustand.md');
    });

    it('redux-toolkit 설정 시 redux-toolkit 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'redux-toolkit',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/state/redux-toolkit.md');
    });

    it('tanstack-query 설정 시 tanstack-query 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'tanstack-query',
        mockStrategy: 'none',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/query/tanstack-query.md');
    });

    it('swr 설정 시 swr 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'swr',
        mockStrategy: 'none',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/query/swr.md');
    });

    it('msw 설정 시 msw 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'msw',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/mock/msw.md');
    });

    it('module-mock 설정 시 module-mock 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'module-mock',
        router: 'none',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/mock/module-mock.md');
    });

    it('next-app 설정 시 next-app 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'next-app',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/router/next-app.md');
    });

    it('next-pages 설정 시 next-pages 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'next-pages',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/router/next-pages.md');
    });

    it('react-router 설정 시 react-router 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'react-router',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/router/react-router.md');
    });

    it('모든 설정이 있을 때 모든 규칙을 포함한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'vitest',
        stateManagement: 'zustand',
        queryLibrary: 'tanstack-query',
        mockStrategy: 'msw',
        router: 'next-app',
      };

      const paths = getRuleModulePaths(manifest);

      expect(paths).toContain('rules/_common.md');
      expect(paths).toContain('rules/runner/vitest.md');
      expect(paths).toContain('rules/state/zustand.md');
      expect(paths).toContain('rules/query/tanstack-query.md');
      expect(paths).toContain('rules/mock/msw.md');
      expect(paths).toContain('rules/router/next-app.md');
      expect(paths).toHaveLength(6);
    });

    it('지원하지 않는 값은 무시한다', () => {
      const manifest: ManifestConfig = {
        testRunner: 'unknown-runner',
        stateManagement: 'unknown-state',
        queryLibrary: 'unknown-query',
        mockStrategy: 'unknown-mock',
        router: 'unknown-router',
      };

      const paths = getRuleModulePaths(manifest);

      // _common.md만 포함
      expect(paths).toEqual(['rules/_common.md']);
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
    it('유효한 필드와 값으로 규칙 내용을 반환한다', async () => {
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('# Vitest Rules');

      const result = await loadRuleContent('testRunner', 'vitest');

      expect(result).toBe('# Vitest Rules');
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
    it('ui 타입일 때 _common.md와 test-type/ui.md 및 manifest 기반 모듈을 조합한다', async () => {
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue({
        testRunner: 'vitest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      });

      const commonContent = '# Common Rules';
      const uiContent = '# UI Rules';
      const vitestContent = '# Vitest Rules';

      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(commonContent) // rules/_common.md
        .mockResolvedValueOnce(uiContent) // rules/test-type/ui.md
        .mockResolvedValueOnce(vitestContent); // rules/runner/vitest.md

      const result = await loadRules('ui');

      expect(result).toContain(commonContent);
      expect(result).toContain(uiContent);
      expect(result).toContain(vitestContent);
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/_common.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/test-type/ui.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/runner/vitest.md');
    });

    it('unit 타입일 때 _common.md와 test-type/unit.md 및 manifest 기반 모듈을 조합한다', async () => {
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue({
        testRunner: 'jest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      });

      const commonContent = '# Common Rules';
      const unitContent = '# Unit Rules';
      const jestContent = '# Jest Rules';

      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(commonContent) // rules/_common.md
        .mockResolvedValueOnce(unitContent) // rules/test-type/unit.md
        .mockResolvedValueOnce(jestContent); // rules/runner/jest.md

      const result = await loadRules('unit');

      expect(result).toContain(commonContent);
      expect(result).toContain(unitContent);
      expect(result).toContain(jestContent);
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/_common.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/test-type/unit.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/runner/jest.md');
    });

    it('중복 모듈 경로는 한 번만 로드한다', async () => {
      // BASE_RULES에 _common.md가 포함되어 있고, getRuleModulePaths도 _common.md를 반환
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue({
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      });

      const commonContent = '# Common Rules';
      const uiContent = '# UI Rules';

      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(commonContent)
        .mockResolvedValueOnce(uiContent);

      await loadRules('ui');

      // _common.md가 한 번만 호출되어야 함
      const calls = vi.mocked(fileUtils.readPromptTemplate).mock.calls;
      const commonCalls = calls.filter(([path]) => path === 'rules/_common.md');
      expect(commonCalls).toHaveLength(1);
    });

    it('모듈 파일이 없으면 건너뛰고 경고를 출력한다', async () => {
      const warnSpy = vi.spyOn(loggerUtils.logger, 'warn').mockImplementation(() => {});

      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue({
        testRunner: 'vitest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      });

      const commonContent = '# Common Rules';
      const uiContent = '# UI Rules';

      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(commonContent)
        .mockResolvedValueOnce(uiContent)
        .mockRejectedValueOnce(new Error('File not found')); // vitest.md 없음

      const result = await loadRules('ui');

      expect(result).toContain(commonContent);
      expect(result).toContain(uiContent);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('규칙 모듈을 찾을 수 없습니다')
      );

      warnSpy.mockRestore();
    });

    it('규칙 모듈들을 구분자로 연결한다', async () => {
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue({
        testRunner: 'none',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'none',
        router: 'none',
      });

      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce('Content A')
        .mockResolvedValueOnce('Content B');

      const result = await loadRules('ui');

      expect(result).toBe('Content A\n\n---\n\nContent B');
    });
  });
});
