import fs from 'fs-extra';
import path from 'path';
import { readManifest, readPromptTemplate, readUserFile } from '../utils/file.js';
import { resolveUserPath } from '../utils/path.js';
import { findAtddFile, findPlanFile } from './locator.js';
import { TestType, DEFAULT_TEST_TYPE, getTemplateFileName } from './test-type.js';

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

  return `${promptTemplate}

---

## 입력 데이터

[프로젝트 설정]
<<<
\`\`\`yaml
${manifestContent}
\`\`\`
>>>

[코드]
<<<
${sourceCode}
>>>

[기능명 또는 파일 경로] (필수)
<<< ${sourcePath} >>>
`;
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

  return `${promptTemplate}

---

## 입력 데이터

[ATDD 시나리오]
<<<
${atddContent}
>>>

[프로젝트 설정]
<<<
\`\`\`yaml
${manifestContent}
\`\`\`
>>>

[대상 기능의 소스 파일 경로]
<<< ${sourcePath} >>>

[코드]
<<<
${sourceCode}
>>>
`;
};

/**
 * Gen 프롬프트 생성 로직
 * - UI 테스트 또는 Unit 테스트 프롬프트 생성
 * @param sourcePath - 소스 파일 경로
 * @param type - 테스트 타입
 * @throws {Error} Manifest 파일이 없을 경우 'MANIFEST_NOT_FOUND' 에러 발생
 * @throws {Error} Plan 파일을 찾을 수 없을 경우 'PLAN_FILE_NOT_FOUND' 에러 발생
 */
export const generateGenPrompt = async (
  sourcePath: string,
  type: TestType = DEFAULT_TEST_TYPE
): Promise<string> => {
  await validateManifest();
  const manifestContent = await readManifest();

  const absolutePath = resolveUserPath(sourcePath);
  const sourceCode = await readUserFile(absolutePath);

  // Plan 파일 찾기
  const planFilePath = await findPlanFile(sourcePath);
  if (!planFilePath) {
    throw new Error('PLAN_FILE_NOT_FOUND');
  }

  const planContent = await readUserFile(planFilePath);

  // 타입에 따라 다른 템플릿 사용
  const templateFileName = getTemplateFileName(type);

  const promptTemplate = await readPromptTemplate(templateFileName);
  const executionGuide = await readPromptTemplate('test-coding-conventions.md');

  // Lessons Learned 파일 읽기 (선택적)
  const lessonsPath = 'project-test-lessons.md';
  let lessonsContent = '';
  if (await fs.pathExists(lessonsPath)) {
    lessonsContent = await fs.readFile(lessonsPath, 'utf-8');
  }

  return `${promptTemplate}

---

## 입력 데이터

[참조 문서: 실행 및 환경 가이드] (Critical)
<<<
${executionGuide}
>>>

[Lessons Learned: 오답노트] (Critical - 반드시 준수)
<<<
${lessonsContent || '(아직 기록된 교훈이 없습니다)'}
>>>

[Test Plan]
<<<
${planContent}
>>>

[프로젝트 설정]
<<<
\`\`\`yaml
${manifestContent}
\`\`\`
>>>

[코드]
<<<
${sourceCode}
>>>

[대상 기능의 소스 파일 경로]
<<< ${sourcePath} >>>
`;
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

