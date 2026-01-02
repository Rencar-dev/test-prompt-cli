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

vi.mock('fs-extra');
vi.mock('../utils/logger.js');
vi.mock('../utils/file.js');
vi.mock('../utils/manifest.js');

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
      const mockTemplate = '# test-implement\n\n{{TYPE_SPECIFIC_RULES}}';
      const mockTypeRules = '## UI 전용 규칙';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate) // skills/test-implement.md
        .mockResolvedValueOnce(mockTypeRules); // rules/test-type/ui.md

      await createTestImplementSkill('ui');

      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('skills/test-implement.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/test-type/ui.md');
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/test-implement/SKILL.md'),
        expect.stringContaining('UI'),
        'utf-8'
      );
    });

    it('Unit 타입으로 스킬 파일을 생성한다', async () => {
      const mockTemplate = '# test-implement\n\n{{TYPE_SPECIFIC_RULES}}';
      const mockTypeRules = '## Unit 전용 규칙';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate) // skills/test-implement.md
        .mockResolvedValueOnce(mockTypeRules); // rules/test-type/unit.md

      await createTestImplementSkill('unit');

      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('skills/test-implement.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('rules/test-type/unit.md');
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md'),
        expect.stringContaining('Unit'),
        'utf-8'
      );
    });

    it('타입별 규칙 파일이 없으면 플레이스홀더를 빈 문자열로 치환한다', async () => {
      const mockTemplate = '# test-implement\n\n{{TYPE_SPECIFIC_RULES}}\n\n## 다음 섹션';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate)
        .mockRejectedValueOnce(new Error('File not found')); // 규칙 파일 없음

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
        '# test-mock\n\n{{RUNNER_RULES}}\n{{STATE_RULES}}\n{{QUERY_RULES}}\n{{MOCK_STRATEGY_RULES}}\n{{ROUTER_RULES}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue(mockManifest as never);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate) // skills/test-mock.md
        .mockResolvedValueOnce('vitest rules') // rules/runner/vitest.md
        .mockResolvedValueOnce('zustand rules') // rules/state/zustand.md
        .mockResolvedValueOnce('tanstack rules') // rules/query/tanstack-query.md
        .mockResolvedValueOnce('msw rules') // rules/mock/msw.md
        .mockResolvedValueOnce('next-router rules'); // rules/router/next-router.md

      await createTestMockSkill();

      expect(manifestUtils.getManifestConfig).toHaveBeenCalled();
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/test-mock/SKILL.md'),
        expect.stringContaining('vitest'),
        'utf-8'
      );
    });

    it('설정된 규칙이 없으면 해당 플레이스홀더를 빈 문자열로 치환한다', async () => {
      const mockTemplate = '# test-mock\n\n{{RUNNER_RULES}}\n{{STATE_RULES}}';
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
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce('vitest rules')
        .mockResolvedValue(''); // none인 경우 빈 문자열

      await createTestMockSkill();

      const writtenContent = writeFileSpy.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('{{STATE_RULES}}');
    });

    it('스킬 파일이 이미 존재하면 갱신한다', async () => {
      const mockTemplate = '# test-mock\n\n{{RUNNER_RULES}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(manifestUtils, 'getManifestConfig').mockResolvedValue(mockManifest as never);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValue('');

      await createTestMockSkill();

      expect(writeFileSpy).toHaveBeenCalled();
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
