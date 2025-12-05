import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { findAtddFile } from './locator.js';

vi.mock('../utils/path.js', () => ({
  getPromptsPath: vi.fn(() => '/mock/prompts'),
}));

describe('locator', () => {
  const mockCwd = process.cwd();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findAtddFile', () => {
    // Helper to mock manifest for findAtddFile tests
    const mockManifestRead = (manifestData: any) => {
      vi.spyOn(fs, 'readFile').mockImplementation(async (filePath) => {
        if (String(filePath).endsWith('project-manifest.yaml')) {
          return yaml.dump(manifestData);
        }
        throw new Error(`ENOENT: ${filePath}`);
      });
    };

    it('같은 디렉토리에서 baseName 기반 ATDD 파일을 찾는다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const expectedAtddPath = path.join(mockCwd, 'src/app/login', 'page.atdd.md');

      mockManifestRead({
        testPaths: {
          dirName: '_tests',
          atddSuffix: '.atdd.md',
          mode: 'co-location',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });

    it('같은 디렉토리에서 dirName 기반 ATDD 파일을 찾는다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const expectedAtddPath = path.join(mockCwd, 'src/app/login', 'login.atdd.md');

      mockManifestRead({
        testPaths: {
          dirName: '_tests',
          atddSuffix: '.atdd.md',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });

    it('testPaths.dirName 폴더에서 baseName 기반 ATDD 파일을 찾는다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const expectedAtddPath = path.join(mockCwd, 'src/app/login', '_tests', 'page.atdd.md');

      mockManifestRead({
        testPaths: {
          dirName: '_tests',
          atddSuffix: '.atdd.md',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });

    it('testPaths.dirName 폴더에서 dirName 기반 ATDD 파일을 찾는다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const expectedAtddPath = path.join(mockCwd, 'src/app/login', '_tests', 'login.atdd.md');

      mockManifestRead({
        testPaths: {
          dirName: '_tests',
          atddSuffix: '.atdd.md',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });

    it('manifest가 없을 때 기본값을 사용한다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const expectedAtddPath = path.join(mockCwd, 'src/app/login', '_tests', 'page.atdd.md');

      vi.spyOn(fs, 'readFile').mockImplementation(async () => {
        throw new Error('File not found');
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });

    it('manifest에 testPaths가 없을 때 기본값을 사용한다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const expectedAtddPath = path.join(mockCwd, 'src/app/login', '_tests', 'page.atdd.md');

      mockManifestRead({});

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });

    it('모든 후보 파일이 없을 때 null을 반환한다', async () => {
      const sourcePath = 'src/app/login/page.tsx';

      mockManifestRead({
        testPaths: {
          dirName: '_tests',
          atddSuffix: '.atdd.md',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async () => false);

      const result = await findAtddFile(sourcePath);

      expect(result).toBeNull();
    });

    it('여러 후보 중 첫 번째로 발견된 파일을 반환한다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const firstCandidate = path.join(mockCwd, 'src/app/login', 'page.atdd.md');
      const secondCandidate = path.join(mockCwd, 'src/app/login', 'login.atdd.md');

      mockManifestRead({
        testPaths: {
          dirName: '_tests',
          atddSuffix: '.atdd.md',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === firstCandidate || filePath === secondCandidate;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(firstCandidate);
    });

    it('복잡한 경로 구조에서도 올바르게 동작한다', async () => {
      const sourcePath = 'app/(public)/user/login/page.tsx';
      const expectedAtddPath = path.join(
        mockCwd,
        'app/(public)/user/login',
        '_tests',
        'login.atdd.md'
      );

      mockManifestRead({
        testPaths: {
          dirName: '_tests',
          atddSuffix: '.atdd.md',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });

    it('사용자 정의 설정을 반영하여 파일을 찾는다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const expectedAtddPath = path.join(mockCwd, 'src/app/login', '__specs__', 'page.spec.md');

      mockManifestRead({
        testPaths: {
          dirName: '__specs__',
          atddSuffix: '.spec.md',
        },
      });

      vi.spyOn(fs, 'pathExists').mockImplementation(async (filePath: string) => {
        return filePath === expectedAtddPath;
      });

      const result = await findAtddFile(sourcePath);

      expect(result).toBe(expectedAtddPath);
    });
  });
});

