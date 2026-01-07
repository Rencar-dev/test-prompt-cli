import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import {
  ensureLessonsFile,
  createTestVerifySkill,
  createTestImplementSkill,
  createTestMockSkill,
  syncAllSkills,
  syncRuleFiles,
} from './setup.js';
import * as fileUtils from '../utils/file.js';
import * as pathUtils from '../utils/path.js';

vi.mock('fs-extra');
vi.mock('../utils/logger.js');
vi.mock('../utils/file.js');
vi.mock('../utils/path.js');

describe('setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pathUtils, 'getPromptsPath').mockReturnValue('/mock/prompts');
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
      const mockTemplate = '# test-implement\n\n테스트 타입: {{TEST_TYPE}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);

      await createTestImplementSkill('ui');

      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('skills/test-implement.md');
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/test-implement/SKILL.md'),
        expect.stringContaining('테스트 타입: ui'),
        'utf-8'
      );
    });

    it('Unit 타입으로 스킬 파일을 생성한다', async () => {
      const mockTemplate = '# test-implement\n\n{{TEST_TYPE}}.md 파일 참조';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);

      await createTestImplementSkill('unit');

      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md'),
        expect.stringContaining('unit.md 파일 참조'),
        'utf-8'
      );
    });

    it('{{TEST_TYPE}} 플레이스홀더를 테스트 타입으로 치환한다', async () => {
      const mockTemplate = '규칙 파일: {{TEST_TYPE}}.md, 참조: {{TEST_TYPE}}';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);

      await createTestImplementSkill('ui');

      const writtenContent = writeFileSpy.mock.calls[0][1] as string;
      expect(writtenContent).toBe('규칙 파일: ui.md, 참조: ui');
      expect(writtenContent).not.toContain('{{TEST_TYPE}}');
    });
  });

  describe('createTestMockSkill', () => {
    it('스킬 파일을 생성한다', async () => {
      const mockTemplate = '# test-mock\n\n규칙 파일 참조 섹션';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);

      await createTestMockSkill();

      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('skills/test-mock.md');
      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/test-mock/SKILL.md'),
        mockTemplate,
        'utf-8'
      );
    });

    it('스킬 파일이 이미 존재하면 갱신한다', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('# test-mock');

      await createTestMockSkill();

      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('syncRuleFiles', () => {
    it('규칙 파일을 .claude/rules/로 복사한다', async () => {
      const removeSpy = vi.spyOn(fs, 'remove').mockResolvedValue(undefined);
      const copySpy = vi.spyOn(fs, 'copy').mockResolvedValue(undefined);

      await syncRuleFiles();

      expect(removeSpy).toHaveBeenCalledWith(expect.stringContaining('.claude/rules'));
      expect(copySpy).toHaveBeenCalledWith(
        '/mock/prompts/rules',
        expect.stringContaining('.claude/rules'),
        expect.objectContaining({ filter: expect.any(Function) })
      );
    });

    it('README.md와 _meta.md는 복사에서 제외한다', async () => {
      vi.spyOn(fs, 'remove').mockResolvedValue(undefined);
      const copySpy = vi.spyOn(fs, 'copy').mockResolvedValue(undefined);

      await syncRuleFiles();

      // filter 함수 검증
      const filterFn = copySpy.mock.calls[0][2]?.filter as (src: string) => boolean;
      expect(filterFn('/path/to/README.md')).toBe(false);
      expect(filterFn('/path/to/_meta.md')).toBe(false);
      expect(filterFn('/path/to/_common.md')).toBe(true);
      expect(filterFn('/path/to/vitest.md')).toBe(true);
    });
  });

  describe('syncAllSkills', () => {
    it('규칙 파일과 모든 스킬을 동기화한다', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      vi.spyOn(fs, 'remove').mockResolvedValue(undefined);
      vi.spyOn(fs, 'copy').mockResolvedValue(undefined);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
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
    });

    it('syncRuleFiles를 먼저 호출한다', async () => {
      const removeSpy = vi.spyOn(fs, 'remove').mockResolvedValue(undefined);
      vi.spyOn(fs, 'copy').mockResolvedValue(undefined);
      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue('mock template');

      await syncAllSkills('ui');

      // syncRuleFiles가 호출되었는지 확인 (fs.remove가 호출됨)
      expect(removeSpy).toHaveBeenCalledWith(expect.stringContaining('.claude/rules'));
    });
  });
});
