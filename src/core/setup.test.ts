import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import { ensureLessonsFile } from './setup.js';

vi.mock('fs-extra');
vi.mock('../utils/logger.js');

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
});
