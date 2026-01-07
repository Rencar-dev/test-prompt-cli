/**
 * 규칙 모듈 로더
 *
 * 모든 규칙 모듈을 로드하여 SKILL 파일에 주입합니다.
 * AI가 각 규칙의 scope를 보고 적용 가능한 규칙만 선택합니다.
 */

import { readPromptTemplate } from '../utils/file.js';
import { logger } from '../utils/logger.js';
import { TestType } from './test-type.js';

/**
 * 규칙 모듈 매핑
 * manifest 필드값 → 규칙 파일 경로 (단일 또는 배열)
 *
 * 배열인 경우: [_shared.md, specific.md] 순서로 로드
 * - _shared.md: 해당 카테고리의 공통 규칙
 * - specific.md: 특정 도구/라이브러리 규칙
 */
export type RuleModulePath = string | string[];
export const RULE_MODULES: Record<string, Record<string, RuleModulePath>> = {
  testRunner: {
    vitest: ['rules/runner/_shared.md', 'rules/runner/vitest.md'],
    jest: ['rules/runner/_shared.md', 'rules/runner/jest.md'],
  },
  stateManagement: {
    zustand: 'rules/state/zustand.md',
    'redux-toolkit': 'rules/state/redux-toolkit.md',
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
    'next-app': 'rules/router/next-app.md',
    'next-pages': 'rules/router/next-pages.md',
    'react-router': 'rules/router/react-router.md',
  },
};

/**
 * 컨텍스트 기반 규칙 (코드 패턴으로 감지)
 * manifest에 없는 규칙들을 코드 패턴과 함께 정의
 *
 * - pattern: AI에게 제공할 힌트 (자연어 설명)
 * - path: 규칙 파일 경로 (rules/ 제외)
 */
export const CONTEXT_BASED_RULES: Array<{ pattern: string; path: string }> = [
  { pattern: 'Date, setTimeout, setInterval, dayjs, moment', path: 'mock/time-mocking.md' },
  // 향후 추가 예시:
  // { pattern: 'IntersectionObserver, useInView', path: 'mock/intersection-observer.md' },
  // { pattern: 'next/image, Image component', path: 'mock/next-image.md' },
];

/**
 * 테스트 타입별 기본 규칙
 * - _common.md: 모든 테스트에 공통 적용 (Level 0)
 * - test-type/ui.md: UI 통합 테스트 전용 (Level 1)
 * - test-type/unit.md: Unit 테스트 전용 (Level 1)
 */
const BASE_RULES: Record<TestType, string[]> = {
  ui: ['rules/_common.md', 'rules/test-type/ui.md'],
  unit: ['rules/_common.md', 'rules/test-type/unit.md'],
};

/**
 * 공통 규칙(_common.md)을 로드합니다.
 * @returns 공통 규칙 내용 (없으면 빈 문자열)
 */
export const loadCommonRules = async (): Promise<string> => {
  try {
    return await readPromptTemplate('rules/_common.md');
  } catch {
    return '';
  }
};

/**
 * 테스트 타입별 규칙을 로드합니다.
 * @param testType - 테스트 타입 (ui | unit)
 * @returns 타입별 규칙 내용 (없으면 빈 문자열)
 */
export const loadTestTypeRules = async (testType: TestType): Promise<string> => {
  const paths = BASE_RULES[testType];
  if (!paths || paths.length < 2) return '';

  // BASE_RULES[testType][0]은 _common.md, [1]은 test-type/{ui,unit}.md
  try {
    return await readPromptTemplate(paths[1]);
  } catch {
    return '';
  }
};

/**
 * 개별 규칙 내용을 읽어 반환합니다.
 * @param field - manifest 필드명 (testRunner, stateManagement 등)
 * @param value - 필드 값 (vitest, zustand 등)
 * @returns 규칙 내용 문자열 (없으면 빈 문자열)
 */
export const loadRuleContent = async (
  field: keyof typeof RULE_MODULES,
  value: string
): Promise<string> => {
  const modulePath = RULE_MODULES[field]?.[value];
  if (!modulePath) {
    return '';
  }

  // 배열인 경우 모든 파일 내용을 합쳐서 반환
  const paths = Array.isArray(modulePath) ? modulePath : [modulePath];
  const contents: string[] = [];

  for (const path of paths) {
    try {
      const content = await readPromptTemplate(path);
      contents.push(content);
    } catch {
      logger.warn(`규칙 모듈을 찾을 수 없습니다: ${path}`);
    }
  }

  return contents.join('\n\n---\n\n');
};

/**
 * 모든 규칙 모듈 파일 경로를 반환합니다.
 * RULE_MODULES의 모든 규칙 + CONTEXT_BASED_RULES를 포함합니다.
 */
export const getAllRulePaths = (): string[] => {
  const paths: string[] = [];

  // RULE_MODULES의 모든 규칙 수집
  for (const field of Object.values(RULE_MODULES)) {
    for (const modulePath of Object.values(field)) {
      if (Array.isArray(modulePath)) {
        paths.push(...modulePath);
      } else {
        paths.push(modulePath);
      }
    }
  }

  // CONTEXT_BASED_RULES 추가
  for (const rule of CONTEXT_BASED_RULES) {
    paths.push(`rules/${rule.path}`);
  }

  // 중복 제거
  return [...new Set(paths)];
};

/**
 * 모든 규칙 모듈을 로드하고 조합합니다.
 * AI가 각 규칙의 scope를 확인하여 적용 가능한 규칙만 선택합니다.
 *
 * @param testType - 테스트 타입 (ui | unit)
 * @returns 조합된 규칙 문자열
 */
export const loadRules = async (testType: TestType): Promise<string> => {
  // 테스트 타입별 기본 규칙 + 모든 규칙 모듈
  const modulePaths = [...(BASE_RULES[testType] || []), ...getAllRulePaths()];

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
