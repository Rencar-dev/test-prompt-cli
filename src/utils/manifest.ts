/**
 * Manifest 설정 파싱 유틸리티
 *
 * project-manifest.yaml에서 Rule Injection에 필요한 설정을 읽습니다.
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Rule Injection에 사용되는 Manifest 설정
 * (AI가 scope 판단에 사용, 규칙 선택은 하지 않음)
 */
export interface ManifestConfig {
  /** 테스트 러너: vitest | jest */
  testRunner: string;
  /** 상태 관리: zustand | redux | redux-toolkit | recoil | jotai | mobx | none */
  stateManagement: string;
  /** 서버 상태/데이터 페칭: tanstack-query | swr | rtk-query | apollo | none */
  queryLibrary: string;
  /** API Mocking 전략: msw | nock | fetch-mock | module-mock */
  mockStrategy: string;
  /** 라우터: next-app | next-pages | react-router | none */
  router: string;
}

/**
 * 기본 Manifest 설정
 */
const DEFAULT_MANIFEST_CONFIG: ManifestConfig = {
  testRunner: 'vitest',
  stateManagement: 'none',
  queryLibrary: 'none',
  mockStrategy: 'module-mock',
  router: 'none',
};

/**
 * project-manifest.yaml에서 Rule Injection 설정을 읽습니다.
 * @returns ManifestConfig 객체
 */
export const getManifestConfig = async (): Promise<ManifestConfig> => {
  const manifestPath = path.resolve(process.cwd(), 'project-manifest.yaml');

  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const manifest = yaml.load(content) as Record<string, unknown>;

    return {
      testRunner: normalizeValue(manifest.testRunner) || DEFAULT_MANIFEST_CONFIG.testRunner,
      stateManagement: normalizeValue(manifest.stateManagement) || DEFAULT_MANIFEST_CONFIG.stateManagement,
      queryLibrary: normalizeValue(manifest.queryLibrary) || DEFAULT_MANIFEST_CONFIG.queryLibrary,
      mockStrategy: normalizeValue(manifest.mockStrategy) || DEFAULT_MANIFEST_CONFIG.mockStrategy,
      router: normalizeValue(manifest.router) || DEFAULT_MANIFEST_CONFIG.router,
    };
  } catch {
    // manifest 파일이 없거나 파싱 실패 시 기본값 반환
    return DEFAULT_MANIFEST_CONFIG;
  }
};

/**
 * 값을 정규화합니다.
 * - 소문자로 변환
 * - 공백을 하이픈으로 변환
 * - 특수문자 제거
 */
const normalizeValue = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

/**
 * Manifest 설정을 사람이 읽기 쉬운 형태로 변환합니다. (디버깅/로깅용)
 */
export const formatManifestConfig = (config: ManifestConfig): string => {
  return [
    `testRunner: ${config.testRunner}`,
    `stateManagement: ${config.stateManagement}`,
    `queryLibrary: ${config.queryLibrary}`,
    `mockStrategy: ${config.mockStrategy}`,
    `router: ${config.router}`,
  ].join('\n');
};
