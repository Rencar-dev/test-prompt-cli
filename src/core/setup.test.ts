import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import {
  ensureLessonsFile,
  createTestVerifySkill,
  createTestImplementSkill,
  createTestMockSkill,
  syncAllSkills,
} from './setup.js';
import * as fileUtils from '../utils/file.js';
import * as manifestUtils from '../utils/manifest.js';
import * as rulesLoader from './rules-loader.js';

vi.mock('fs-extra');
vi.mock('../utils/logger.js');
vi.mock('../utils/file.js');
vi.mock('../utils/manifest.js');
vi.mock('./rules-loader.js');

describe('setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ensureLessonsFile', () => {
    it('파일이 존재하지 않으면 기본 템플릿으로 생성한다', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      await ensureLessonsFile();

      expect(writeFileSpy).toHaveBeenCalledWith(
        'project-test-lessons.md',
        expect.stringContaining('# 🧪 Project Test Lessons & Rules'),
        'utf-8'
      );
    });

    it('파일이 이미 존재하면 생성하지 않는다', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      const writeFileSpy = vi.spyOn(fs, 'writeFile');

      await ensureLessonsFile();

      expect(writeFileSpy).not.toHaveBeenCalled();
    });
  });

  describe('createTestVerifySkill', () => {
    it('스킬 파일이 존재하지 않으면 생성한다', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      const ensureDirSpy = vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('# test-verify skill content');

      await createTestVerifySkill();

      expect(ensureDirSpy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/test-verify')
      );
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md'),
        expect.any(String),
        'utf-8'
      );
    });

    it('스킬 파일이 이미 존재하면 최신 버전으로 갱신한다', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('# test-verify skill content');

      await createTestVerifySkill();

      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md'),
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('createTestImplementSkill', () => {
    it('UI 타입으로 스킬 파일을 생성한다', async () => {
      const mockTemplate = '# test-implement\n\n{{COMMON_RULES}}\n\n{{TYPE_SPECIFIC_RULES}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue('## 공통 규칙');
      vi.spyOn(rulesLoader, 'loadTestTypeRules').mockResolvedValue('## UI 전용 규칙');

      await createTestImplementSkill('ui');

      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('skills/test-implement.md');
      expect(rulesLoader.loadCommonRules).toHaveBeenCalled();
      expect(rulesLoader.loadTestTypeRules).toHaveBeenCalledWith('ui');
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/test-implement/SKILL.md'),
        expect.stringContaining('UI'),
        'utf-8'
      );
    });

    it('Unit 타입으로 스킬 파일을 생성한다', async () => {
      const mockTemplate = '# test-implement\n\n{{COMMON_RULES}}\n\n{{TYPE_SPECIFIC_RULES}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue('## 공통 규칙');
      vi.spyOn(rulesLoader, 'loadTestTypeRules').mockResolvedValue('## Unit 전용 규칙');

      await createTestImplementSkill('unit');

      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('skills/test-implement.md');
      expect(rulesLoader.loadCommonRules).toHaveBeenCalled();
      expect(rulesLoader.loadTestTypeRules).toHaveBeenCalledWith('unit');
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md'),
        expect.stringContaining('Unit'),
        'utf-8'
      );
    });

    it('타입별 규칙 파일이 없으면 플레이스홀더를 빈 문자열로 치환한다', async () => {
      const mockTemplate = '# test-implement\n\n{{COMMON_RULES}}\n\n{{TYPE_SPECIFIC_RULES}}\n\n## 다음 섹션';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue(''); // 규칙 없음
      vi.spyOn(rulesLoader, 'loadTestTypeRules').mockResolvedValue(''); // 규칙 없음

      await createTestImplementSkill('ui');

      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md'),
        expect.not.stringContaining('{{TYPE_SPECIFIC_RULES}}'),
        'utf-8'
      );
    });
  });

  describe('createTestMockSkill', () => {
    const mockManifest = {
      testRunner: 'vitest',
      stateManagement: 'zustand',
      queryLibrary: 'tanstack-query',
      mockStrategy: 'msw',
      router: 'next-app',
    };

    it('manifest 설정에 따라 스킬 파일을 생성한다', async () => {
      const mockTemplate =
        '# test-mock\n\n{{COMMON_RULES}}\n\n{{RUNNER_RULES}}\n{{STATE_RULES}}\n{{QUERY_RULES}}\n{{MOCK_STRATEGY_RULES}}\n{{ROUTER_RULES}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue(mockManifest as never);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue('common rules');
      vi.spyOn(rulesLoader, 'loadRuleContent')
        .mockResolvedValueOnce('vitest rules') // testRunner
        .mockResolvedValueOnce('zustand rules') // stateManagement
        .mockResolvedValueOnce('tanstack rules') // queryLibrary
        .mockResolvedValueOnce('msw rules') // mockStrategy
        .mockResolvedValueOnce('next-app rules'); // router

      await createTestMockSkill();

      expect(manifestUtils.getManifestConfig).toHaveBeenCalled();
      expect(rulesLoader.loadCommonRules).toHaveBeenCalled();
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/test-mock/SKILL.md'),
        expect.stringContaining('vitest'),
        'utf-8'
      );
    });

    it('설정된 규칙이 없으면 해당 플레이스홀더를 빈 문자열로 치환한다', async () => {
      const mockTemplate = '# test-mock\n\n{{COMMON_RULES}}\n\n{{RUNNER_RULES}}\n{{STATE_RULES}}';
      const manifestWithNone = {
        testRunner: 'vitest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'msw',
        router: 'none',
      };

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue(manifestWithNone as never);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue('common rules');
      vi.spyOn(rulesLoader, 'loadRuleContent')
        .mockResolvedValueOnce('vitest rules') // testRunner
        .mockResolvedValueOnce('') // stateManagement: none
        .mockResolvedValueOnce('') // queryLibrary: none
        .mockResolvedValueOnce('msw rules') // mockStrategy
        .mockResolvedValueOnce(''); // router: none

      await createTestMockSkill();

      const writtenContent = writeFileSpy.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('{{STATE_RULES}}');
    });

    it('스킬 파일이 이미 존재하면 갱신한다', async () => {
      const mockTemplate = '# test-mock\n\n{{COMMON_RULES}}\n\n{{RUNNER_RULES}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue(mockManifest as never);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue('');
      vi.spyOn(rulesLoader, 'loadRuleContent').mockResolvedValue('');

      await createTestMockSkill();

      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('ADDITIONAL_RULES를 로드하여 추가 규칙 섹션에 포함한다', async () => {
      const mockTemplate =
        '# test-mock\n\n{{COMMON_RULES}}\n\n{{RUNNER_RULES}}\n\n{{ADDITIONAL_RULES}}';

      // ADDITIONAL_RULES 배열을 mock
      vi.spyOn(rulesLoader, 'ADDITIONAL_RULES', 'get').mockReturnValue([
        'rules/mock/time-mocking.md',
      ]);

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue(mockManifest as never);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockImplementation(async (path: string) => {
        if (path === 'skills/test-mock.md') return mockTemplate;
        if (path === 'rules/mock/time-mocking.md') return '## Time Mocking 규칙';
        return '';
      });
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue('common rules');
      vi.spyOn(rulesLoader, 'loadRuleContent').mockResolvedValue('');

      await createTestMockSkill();

      const writtenContent = writeFileSpy.mock.calls[0][1] as string;
      expect(writtenContent).toContain('Time Mocking');
      expect(writtenContent).not.toContain('{{ADDITIONAL_RULES}}');
    });
  });

  describe('syncAllSkills', () => {
    it('test-implement와 test-mock 스킬을 모두 생성한다', async () => {
      const mockManifest = {
        testRunner: 'vitest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'msw',
        router: 'none',
      };

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue(mockManifest as never);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('mock template');
      vi.spyOn(rulesLoader, 'loadCommonRules').mockResolvedValue('');
      vi.spyOn(rulesLoader, 'loadTestTypeRules').mockResolvedValue('');
      vi.spyOn(rulesLoader, 'loadRuleContent').mockResolvedValue('');

      await syncAllSkills('ui');

      // test-implement, test-mock, self-learn, test-coverage 네 파일이 생성되어야 함
      expect(writeFileSpy).toHaveBeenCalledTimes(4);
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-implement/SKILL.md'),
        expect.any(String),
        'utf-8'
      );
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-mock/SKILL.md'),
        expect.any(String),
        'utf-8'
      );
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('self-learn/SKILL.md'),
        expect.any(String),
        'utf-8'
      );
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-coverage/SKILL.md'),
        expect.any(String),
        'utf-8'
      );
    });
  });
});
