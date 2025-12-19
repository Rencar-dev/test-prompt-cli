import fs from 'fs-extra';
import path from 'path';
import { readManifest, readPromptTemplate, readUserFile } from '../utils/file.js';
import { resolveUserPath } from '../utils/path.js';
import { findAtddFile, findPlanFile } from './locator.js';
import { TestType, DEFAULT_TEST_TYPE, getTemplateFileName } from './test-type.js';
import { loadRules } from './rules-loader.js';

/**
 * Manifest 파일 존재 여부를 검증합니다.
 * @throws {Error} Manifest 파일이 없을 경우 'MANIFEST_NOT_FOUND' 에러 발생
 */
const validateManifest = async (): Promise<void> => {
  const manifestPath = path.resolve(process.cwd(), 'project-manifest.yaml');
  const exists = await fs.pathExists(manifestPath);
  if (!exists) {
    throw new Error('MANIFEST_NOT_FOUND');
  }
};

/**
 * ATDD 프롬프트 생성 로직
 * - Manifest, Source Code, Template을 조합하여 문자열 반환
 * @throws {Error} Manifest 파일이 없을 경우 'MANIFEST_NOT_FOUND' 에러 발생
 */
export const generateAtddPrompt = async (sourcePath: string): Promise<string> => {
  await validateManifest();
  const manifestContent = await readManifest();

  const absolutePath = resolveUserPath(sourcePath);
  const sourceCode = await readUserFile(absolutePath);

  const promptTemplate = await readPromptTemplate('atdd-scenario-generator-prompt.md');

  return promptTemplate
    .replace('{{MANIFEST}}', manifestContent)
    .replace('{{SOURCE_CODE}}', sourceCode)
    .replace('{{SOURCE_PATH}}', sourcePath);
};

/**
 * Plan 프롬프트 생성 로직
 * - ATDD 파일 찾기 로직 포함
 * @throws {Error} Manifest 파일이 없을 경우 'MANIFEST_NOT_FOUND' 에러 발생
 * @throws {Error} ATDD 파일을 찾을 수 없을 경우 'ATDD_FILE_NOT_FOUND' 에러 발생
 */
export const generatePlanPrompt = async (sourcePath: string): Promise<string> => {
  await validateManifest();
  const manifestContent = await readManifest();

  const absoluteSourcePath = resolveUserPath(sourcePath);
  const sourceCode = await readUserFile(absoluteSourcePath);

  // 🔥 핵심 로직 분리: ATDD 파일 찾기
  const atddFilePath = await findAtddFile(sourcePath);
  if (!atddFilePath) {
    // UI 로직(console.error)은 제거하고, 명확한 에러를 던져서 호출자가 처리하게 함
    throw new Error('ATDD_FILE_NOT_FOUND');
  }

  const atddContent = await readUserFile(atddFilePath);
  const promptTemplate = await readPromptTemplate('atdd-test-routing-prompt.md');

  return promptTemplate
    .replace('{{ATDD_CONTENT}}', atddContent)
    .replace('{{MANIFEST}}', manifestContent)
    .replace('{{SOURCE_PATH}}', sourcePath)
    .replace('{{SOURCE_CODE}}', sourceCode);
};

/**
 * Gen 프롬프트 생성 결과
 */
export interface GenPromptResult {
  prompt: string;
  hasPlan: boolean;
}

/**
 * Gen 프롬프트 생성 로직
 * - UI 테스트 또는 Unit 테스트 프롬프트 생성
 * @param sourcePath - 소스 파일 경로
 * @param type - 테스트 타입
 * @returns {GenPromptResult} 프롬프트와 Plan 존재 여부
 * @throws {Error} Manifest 파일이 없을 경우 'MANIFEST_NOT_FOUND' 에러 발생
 * @throws {Error} UI 테스트에서 Plan 파일을 찾을 수 없을 경우 'PLAN_FILE_NOT_FOUND' 에러 발생
 */
export const generateGenPrompt = async (
  sourcePath: string,
  type: TestType = DEFAULT_TEST_TYPE
): Promise<GenPromptResult> => {
  await validateManifest();
  const manifestContent = await readManifest();

  const absolutePath = resolveUserPath(sourcePath);
  const sourceCode = await readUserFile(absolutePath);

  // Plan 파일 찾기
  const planFilePath = await findPlanFile(sourcePath);
  const hasPlan = !!planFilePath;

  // UI 테스트는 Plan 필수, Unit 테스트는 Plan 선택적
  if (!hasPlan && type === 'ui') {
    throw new Error('PLAN_FILE_NOT_FOUND');
  }

  // Plan이 있으면 읽고, 없으면 빈 문자열 (Unit 테스트의 경우)
  const planContent = planFilePath ? await readUserFile(planFilePath) : '';

  // 타입에 따라 다른 템플릿 사용
  const templateFileName = getTemplateFileName(type);

  const promptTemplate = await readPromptTemplate(templateFileName);

  // manifest 기반 모듈식 규칙 로드
  const rules = await loadRules(type);

  // Lessons Learned 파일 읽기 (선택적)
  const lessonsPath = 'project-test-lessons.md';
  let lessonsContent = '';
  if (await fs.pathExists(lessonsPath)) {
    lessonsContent = await fs.readFile(lessonsPath, 'utf-8');
  }

  // Plan 없는 Unit 테스트를 위한 placeholder
  const planPlaceholder = planContent || '(Plan 없음 - 소스 코드를 분석하여 테스트 케이스를 직접 도출하세요)';

  const prompt = promptTemplate
    .replace('{{RULES}}', rules)
    .replace('{{LESSONS_LEARNED}}', lessonsContent || '(아직 기록된 교훈이 없습니다)')
    .replace('{{PLAN_CONTENT}}', planPlaceholder)
    .replace('{{MANIFEST}}', manifestContent)
    .replace('{{SOURCE_CODE}}', sourceCode)
    .replace('{{SOURCE_PATH}}', sourcePath);

  return { prompt, hasPlan };
};

/**
 * Learn 프롬프트 생성 로직
 * - 실패한 코드, 에러 로그, 기존 오답노트를 조합하여 분석 프롬프트 생성
 */
export const generateLearnPrompt = async (
  failedCode: string,
  errorLog: string,
  existingLessons: string
): Promise<string> => {
  const template = await readPromptTemplate('feedback-analyzer-prompt.md');
  return template
    .replace('{{FAILED_CODE}}', failedCode)
    .replace('{{ERROR_LOG}}', errorLog)
    .replace('{{EXISTING_LESSONS}}', existingLessons);
};

