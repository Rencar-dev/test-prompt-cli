import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { getTestPathsConfig } from './file.js';

vi.mock('./path.js', () => ({
  getPromptsPath: vi.fn(() => '/mock/prompts'),
}));

describe('file utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTestPathsConfig', () => {
    it('manifest의 설정을 올바르게 파싱한다', async () => {
      const mockManifest = {
        testPaths: {
          dirName: '__specs__',
          atddSuffix: '.spec.md',
          planSuffix: '.plan.md',
          mode: 'separation',
        },
      };

      vi.spyOn(fs, 'readFile').mockImplementation(async (filePath) => {
        if (String(filePath).endsWith('project-manifest.yaml')) {
          return yaml.dump(mockManifest);
        }
        throw new Error(`ENOENT: ${filePath}`);
      });

      const config = await getTestPathsConfig();

      expect(config).toEqual({
        dirName: '__specs__',
        atddSuffix: '.spec.md',
        planSuffix: '.plan.md',
        mode: 'separation',
      });
    });

    it('manifest에 일부 설정만 있을 경우 기본값을 사용한다', async () => {
      const mockManifest = {
        testPaths: {
          dirName: 'custom_tests',
        },
      };

      vi.spyOn(fs, 'readFile').mockImplementation(async (filePath) => {
        if (String(filePath).endsWith('project-manifest.yaml')) {
          return yaml.dump(mockManifest);
        }
        throw new Error(`ENOENT: ${filePath}`);
      });

      const config = await getTestPathsConfig();

      expect(config).toEqual({
        dirName: 'custom_tests', // 사용자 설정
        atddSuffix: '.atdd.md', // 기본값
        planSuffix: '.test-plan.md', // 기본값
        mode: 'co-location', // 기본값
      });
    });

    it('manifest 읽기 실패 시 전체 기본값을 반환한다', async () => {
      vi.spyOn(fs, 'readFile').mockImplementation(async () => {
        throw new Error('No manifest');
      });

      const config = await getTestPathsConfig();

      expect(config).toEqual({
        dirName: '_tests',
        atddSuffix: '.atdd.md',
        planSuffix: '.test-plan.md',
        mode: 'co-location',
      });
    });
  });
});
