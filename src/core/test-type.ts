/**
 * 테스트 타입 정의 및 상수
 * 
 * 테스트 타입별 템플릿 파일명과 표시명을 중앙에서 관리합니다.
 * 새로운 테스트 타입(e2e 등) 추가 시 이 파일만 수정하면 됩니다.
 */

/**
 * 테스트 타입
 */
export type TestType = 'ui' | 'unit';

/**
 * 테스트 타입별 설정
 */
export const TEST_TYPES = {
  UI: 'ui' as const,
  UNIT: 'unit' as const,
} as const;

/**
 * 테스트 타입별 템플릿 파일명 매핑
 */
export const TEST_TYPE_TEMPLATES: Record<TestType, string> = {
  [TEST_TYPES.UI]: 'ui-test-implementation-prompt.md',
  [TEST_TYPES.UNIT]: 'business-logic-test-prompt.md',
};

/**
 * 테스트 타입별 표시명 매핑
 */
export const TEST_TYPE_LABELS: Record<TestType, string> = {
  [TEST_TYPES.UI]: 'UI',
  [TEST_TYPES.UNIT]: 'Unit',
};

/**
 * 기본 테스트 타입
 */
export const DEFAULT_TEST_TYPE: TestType = TEST_TYPES.UI;

/**
 * 유효한 테스트 타입인지 확인
 */
export const isValidTestType = (type: string): type is TestType => {
  return type === TEST_TYPES.UI || type === TEST_TYPES.UNIT;
};

/**
 * 테스트 타입별 템플릿 파일명 가져오기
 */
export const getTemplateFileName = (type: TestType): string => {
  return TEST_TYPE_TEMPLATES[type];
};

/**
 * 테스트 타입별 표시명 가져오기
 */
export const getTestTypeLabel = (type: TestType): string => {
  return TEST_TYPE_LABELS[type];
};
