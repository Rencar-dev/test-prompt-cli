/**
 * 규칙 모듈 로더
 *
 * project-manifest.yaml의 설정을 기반으로
 * 필요한 규칙 모듈만 선택적으로 로드합니다.
 */

import { readPromptTemplate } from '../utils/file.js';
import { logger } from '../utils/logger.js';
import { getManifestConfig, type ManifestConfig } from '../utils/manifest.js';
import { TestType } from './test-type.js';

/**
 * 규칙 모듈 매핑
 * manifest 필드값 → 규칙 파일 경로
 */
const RULE_MODULES: Record<string, Record<string, string>> = {
  testRunner: {
    vitest: 'rules/runner/vitest.md',
    jest: 'rules/runner/jest.md',
  },
  stateManagement: {
    zustand: 'rules/state/zustand.md',
    redux: 'rules/state/redux.md',
    'redux-toolkit': 'rules/state/redux.md', // redux와 동일한 규칙 사용
    recoil: 'rules/state/recoil.md',
    jotai: 'rules/state/jotai.md',
  },
  queryLibrary: {
    'tanstack-query': 'rules/query/tanstack-query.md',
    swr: 'rules/query/swr.md',
    'rtk-query': 'rules/query/rtk-query.md',
    apollo: 'rules/query/apollo.md',
  },
  mockStrategy: {
    msw: 'rules/mock/msw.md',
    nock: 'rules/mock/nock.md',
    'fetch-mock': 'rules/mock/fetch-mock.md',
    'module-mock': 'rules/mock/module-mock.md',
  },
  router: {
    'next-app': 'rules/router/next-router.md',
    'next-pages': 'rules/router/next-router.md',
    'react-router': 'rules/router/react-router.md',
  },
};

/**
 * 테스트 타입별 기본 규칙
 * - core.md: 모든 테스트에 공통 적용
 * - type/ui.md: UI 통합 테스트 전용 (RTL 패턴, POM, Toast/Alert 등)
 * - type/unit.md: Unit 테스트 전용 (경곗값 분석, renderHook, Store 테스트 등)
 */
const BASE_RULES: Record<TestType, string[]> = {
  ui: ['rules/core.md', 'rules/type/ui.md'],
  unit: ['rules/core.md', 'rules/type/unit.md'],
};

/**
 * manifest 설정 기반으로 필요한 규칙 모듈 파일 목록을 반환합니다.
 */
export const getRuleModulePaths = (manifest: ManifestConfig): string[] => {
  const modules: string[] = ['rules/core.md']; // 항상 포함

  // 각 필드에 대해 해당하는 모듈 추가
  const fields: (keyof ManifestConfig)[] = [
    'testRunner',
    'stateManagement',
    'queryLibrary',
    'mockStrategy',
    'router',
  ];

  for (const field of fields) {
    const value = manifest[field];
    if (value && RULE_MODULES[field]?.[value]) {
      modules.push(RULE_MODULES[field][value]);
    }
  }

  return modules;
};

/**
 * manifest 설정 기반으로 규칙 모듈을 로드하고 조합합니다.
 * @param testType - 테스트 타입 (ui | unit)
 * @returns 조합된 규칙 문자열
 */
export const loadRules = async (testType: TestType): Promise<string> => {
  const manifest = await getManifestConfig();

  // 테스트 타입별 기본 규칙 + manifest 기반 모듈 조합
  const modulePaths = [...(BASE_RULES[testType] || []), ...getRuleModulePaths(manifest)];

  const contents: string[] = [];
  const visited = new Set<string>();

  for (const modulePath of modulePaths) {
    if (visited.has(modulePath)) {
      continue;
    }

    visited.add(modulePath);
    try {
      const content = await readPromptTemplate(modulePath);
      contents.push(content);
    } catch {
      // 모듈 파일이 없으면 건너뜀 (아직 구현되지 않은 모듈)
      logger.warn(`규칙 모듈을 찾을 수 없습니다: ${modulePath}`);
    }
  }

  return contents.join('\n\n---\n\n');
};
