import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs-extra';
import { getManifestConfig, formatManifestConfig } from './manifest.js';

vi.mock('fs-extra');

describe('manifest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getManifestConfig', () => {
    it('manifest 파일이 없을 때 기본값을 반환한다', async () => {
      vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('ENOENT'));

      const config = await getManifestConfig();

      expect(config).toEqual({
        testRunner: 'vitest',
        stateManagement: 'none',
        queryLibrary: 'none',
        mockStrategy: 'module-mock',
        router: 'none',
      });
    });

    it('manifest 파일의 모든 필드를 정상적으로 파싱한다', async () => {
      const mockManifest = `
testRunner: Vitest
stateManagement: Zustand
queryLibrary: TanStack Query
mockStrategy: MSW
router: Next.js App Router
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockManifest as never);

      const config = await getManifestConfig();

      expect(config).toEqual({
        testRunner: 'vitest',
        stateManagement: 'zustand',
        queryLibrary: 'tanstack-query',
        mockStrategy: 'msw',
        router: 'nextjs-app-router',
      });
    });

    it('manifest에 일부 필드만 있을 때 나머지는 기본값을 사용한다', async () => {
      const mockManifest = `
testRunner: jest
stateManagement: redux
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockManifest as never);

      const config = await getManifestConfig();

      expect(config).toEqual({
        testRunner: 'jest',
        stateManagement: 'redux',
        queryLibrary: 'none',
        mockStrategy: 'module-mock',
        router: 'none',
      });
    });

    it('값을 소문자로 정규화한다', async () => {
      const mockManifest = `
testRunner: VITEST
stateManagement: ZUSTAND
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockManifest as never);

      const config = await getManifestConfig();

      expect(config.testRunner).toBe('vitest');
      expect(config.stateManagement).toBe('zustand');
    });

    it('공백을 하이픈으로 변환한다', async () => {
      const mockManifest = `
queryLibrary: TanStack Query
router: Next App Router
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockManifest as never);

      const config = await getManifestConfig();

      expect(config.queryLibrary).toBe('tanstack-query');
      expect(config.router).toBe('next-app-router');
    });

    it('특수문자를 제거한다', async () => {
      const mockManifest = `
router: "Next.js App Router"
queryLibrary: "@tanstack/query"
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockManifest as never);

      const config = await getManifestConfig();

      expect(config.router).toBe('nextjs-app-router');
      expect(config.queryLibrary).toBe('tanstackquery');
    });

    it('빈 문자열이나 null 값은 기본값으로 대체한다', async () => {
      const mockManifest = `
testRunner: ""
stateManagement:
queryLibrary: null
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockManifest as never);

      const config = await getManifestConfig();

      expect(config.testRunner).toBe('vitest');
      expect(config.stateManagement).toBe('none');
      expect(config.queryLibrary).toBe('none');
    });

    it('숫자 타입 값은 빈 문자열로 처리하여 기본값을 사용한다', async () => {
      const mockManifest = `
testRunner: 123
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockManifest as never);

      const config = await getManifestConfig();

      expect(config.testRunner).toBe('vitest');
    });
  });

  describe('formatManifestConfig', () => {
    it('ManifestConfig를 읽기 쉬운 형식으로 변환한다', () => {
      const config = {
        testRunner: 'vitest',
        stateManagement: 'zustand',
        queryLibrary: 'tanstack-query',
        mockStrategy: 'msw',
        router: 'next-app',
      };

      const result = formatManifestConfig(config);

      expect(result).toBe(
        'testRunner: vitest\n' +
          'stateManagement: zustand\n' +
          'queryLibrary: tanstack-query\n' +
          'mockStrategy: msw\n' +
          'router: next-app'
      );
    });
  });
});
