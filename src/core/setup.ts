import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';
import { readPromptTemplate } from '../utils/file.js';
import { getPromptsPath } from '../utils/path.js';
import { getManifestConfig, ManifestConfig } from '../utils/manifest.js';
import { TestType } from './test-type.js';
import { RULE_MODULES, CONTEXT_BASED_RULES } from './rules-loader.js';

/**
 * manifest 설정에 따라 적용할 규칙 파일 경로 목록을 생성합니다.
 */
export const getRuleFilePaths = (
  manifest: ManifestConfig,
  testType: TestType
): string[] => {
  const paths: string[] = [];

  // 1. 필수 규칙 (항상 포함)
  paths.push('_common.md');
  paths.push(`test-type/${testType}.md`);

  // 2. Manifest 기반 규칙
  const fields: Array<keyof typeof RULE_MODULES> = [
    'testRunner',
    'stateManagement',
    'queryLibrary',
    'mockStrategy',
    'router',
  ];

  for (const field of fields) {
    const value = manifest[field as keyof ManifestConfig];
    if (value && value !== 'none') {
      const modulePath = RULE_MODULES[field]?.[value];
      if (modulePath) {
        if (Array.isArray(modulePath)) {
          // 배열인 경우 (예: vitest → [_shared.md, vitest.md])
          paths.push(...modulePath.map((p) => p.replace('rules/', '')));
        } else {
          paths.push(modulePath.replace('rules/', ''));
        }
      }
    }
  }

  return [...new Set(paths)]; // 중복 제거
};

/**
 * project-test-lessons.md 파일이 없으면 기본 템플릿으로 생성합니다.
 *
 * ⚠️ 동기화 필요: 이 템플릿을 수정할 때
 *    src/prompts/feedback-analyzer-prompt.md의 "파일 구조 규칙" 섹션도 함께 수정하세요.
 */
export const ensureLessonsFile = async (): Promise<void> => {
  const lessonsPath = 'project-test-lessons.md';
  if (!(await fs.pathExists(lessonsPath))) {
    const defaultLessons = `# 🧪 Project Test Lessons & Rules

이 파일은 AI 에이전트가 테스트 생성 시 **반드시 준수해야 할 프로젝트별 규칙**을 정의합니다.

---

## 0. 📋 Project Context & Team Rules (프로젝트 맥락 및 팀 규칙) - 직접 작성

> AI가 테스트 생성 시 참고할 프로젝트 맥락과 규칙을 작성하세요.
> 이 섹션은 \`learn\` 명령어가 수정하지 않습니다.

### 프로젝트 맥락 (선택)
\`\`\`
예시:
- 도메인: 이커머스, 금융, 헬스케어 등
- 주요 용어: SKU = 재고 관리 단위, PDP = 상품 상세 페이지
- 아키텍처: Feature-Sliced Design, 모노레포 구조 등
\`\`\`

- (프로젝트 맥락을 여기에 추가하세요)

### 테스트 규칙 (선택)
\`\`\`
예시:
- Toast 메시지는 getByRole('alert') 대신 getByText 사용
- API Mock 파일은 src/mocks/handlers/ 디렉토리에 위치
- 테스트 ID 형식: data-testid="component-name-element"
\`\`\`

- (팀 테스트 규칙을 여기에 추가하세요)

---

## 1. 🚨 Critical Environment Rules (환경 설정 필수)

> JSDOM, Node.js 환경 차이로 인해 발생하는 필수 Mocking 규칙입니다.
> 이 섹션은 \`learn\` 명령어가 자동으로 업데이트합니다.

- (아직 기록된 내용 없음)

## 2. 🛠 Library & Framework Specifics (라이브러리 특이사항)

> 사용하는 라이브러리(Zustand, TanStack Query, MSW 등)의 특이사항을 기록합니다.

- (아직 기록된 내용 없음)

## 3. ⚠️ Common Anti-Patterns (자주 틀리는 패턴)

> 이 프로젝트에서 반복적으로 실패했던 패턴들입니다.

- (아직 기록된 내용 없음)
`;
    await fs.writeFile(lessonsPath, defaultLessons, 'utf-8');
    logger.success('✅ project-test-lessons.md 파일이 생성되었습니다.');
  }
};

/**
 * .claude/skills/test-verify/SKILL.md 파일을 생성하거나 갱신합니다.
 * CLI가 제공하는 규칙이므로 항상 최신 버전으로 유지합니다.
 */
export const createTestVerifySkill = async (): Promise<void> => {
  const skillDir = path.resolve(process.cwd(), '.claude/skills/test-verify');
  const skillPath = path.join(skillDir, 'SKILL.md');

  // 디렉토리 생성
  await fs.ensureDir(skillDir);

  // 스킬 템플릿 읽기
  const skillContent = await readPromptTemplate('skills/test-verify.md');

  const isUpdate = await fs.pathExists(skillPath);

  // 파일 생성 또는 갱신
  await fs.writeFile(skillPath, skillContent, 'utf-8');

  if (isUpdate) {
    logger.success('✅ .claude/skills/test-verify/SKILL.md 파일이 갱신되었습니다.');
  } else {
    logger.success('✅ .claude/skills/test-verify/SKILL.md 파일이 생성되었습니다.');
  }
};

/**
 * .claude/skills/self-learn/SKILL.md 파일을 생성하거나 갱신합니다.
 * Verification 단계에서 수정 발생 시 교훈을 기록하는 규칙입니다.
 */
export const createSelfLearnSkill = async (): Promise<void> => {
  const skillDir = path.resolve(process.cwd(), '.claude/skills/self-learn');
  const skillPath = path.join(skillDir, 'SKILL.md');

  await fs.ensureDir(skillDir);

  const skillContent = await readPromptTemplate('skills/self-learn.md');

  const isUpdate = await fs.pathExists(skillPath);

  await fs.writeFile(skillPath, skillContent, 'utf-8');

  if (isUpdate) {
    logger.success('✅ .claude/skills/self-learn/SKILL.md 파일이 갱신되었습니다.');
  } else {
    logger.success('✅ .claude/skills/self-learn/SKILL.md 파일이 생성되었습니다.');
  }
};

/**
 * .claude/skills/test-coverage/SKILL.md 파일을 생성하거나 갱신합니다.
 * ATDD 시나리오와 테스트 간의 추적성을 검증합니다.
 */
export const createTestCoverageSkill = async (): Promise<void> => {
  const skillDir = path.resolve(process.cwd(), '.claude/skills/test-coverage');
  const skillPath = path.join(skillDir, 'SKILL.md');

  await fs.ensureDir(skillDir);

  const skillContent = await readPromptTemplate('skills/test-coverage.md');

  const isUpdate = await fs.pathExists(skillPath);

  await fs.writeFile(skillPath, skillContent, 'utf-8');

  if (isUpdate) {
    logger.success('✅ .claude/skills/test-coverage/SKILL.md 파일이 갱신되었습니다.');
  } else {
    logger.success('✅ .claude/skills/test-coverage/SKILL.md 파일이 생성되었습니다.');
  }
};

/**
 * 규칙 파일들을 .claude/rules/ 디렉토리로 복사합니다.
 * SKILL 파일에서 참조하는 규칙 파일들을 대상 프로젝트에 배치합니다.
 */
export const syncRuleFiles = async (): Promise<void> => {
  const sourceDir = path.join(getPromptsPath(), 'rules');
  const targetDir = path.resolve(process.cwd(), '.claude/test-rules');

  // 기존 규칙 디렉토리 삭제 후 새로 복사 (항상 최신 유지)
  await fs.remove(targetDir);
  await fs.copy(sourceDir, targetDir, {
    filter: (src) => {
      // README.md와 _meta.md는 제외 (개발용 문서)
      const basename = path.basename(src);
      return basename !== 'README.md' && basename !== '_meta.md';
    },
  });

  logger.success('✅ .claude/test-rules/ 규칙 파일이 동기화되었습니다.');
};

/**
 * test-implement SKILL을 생성합니다.
 * manifest 설정에 따라 필요한 규칙 파일 경로를 주입합니다.
 */
export const createTestImplementSkill = async (
  testType: TestType
): Promise<void> => {
  const skillDir = path.resolve(process.cwd(), '.claude/skills/test-implement');
  const skillPath = path.join(skillDir, 'SKILL.md');

  await fs.ensureDir(skillDir);

  // manifest 읽기
  const manifest = await getManifestConfig();

  // 규칙 파일 경로 생성
  const rulePaths = getRuleFilePaths(manifest, testType);
  const ruleFilesList = rulePaths
    .map((p) => `- \`.claude/test-rules/${p}\``)
    .join('\n');

  // 컨텍스트 기반 규칙 목록 생성
  const contextRulesList = CONTEXT_BASED_RULES.map(
    (r) => `- ${r.pattern} → \`.claude/test-rules/${r.path}\``
  ).join('\n');

  // 템플릿 읽기 및 플레이스홀더 치환
  let skillContent = await readPromptTemplate('skills/test-implement.md');
  skillContent = skillContent
    .replace(/\{\{TEST_TYPE\}\}/g, testType)
    .replace('{{RULE_FILES}}', ruleFilesList)
    .replace('{{CONTEXT_RULES}}', contextRulesList);

  const isUpdate = await fs.pathExists(skillPath);
  await fs.writeFile(skillPath, skillContent, 'utf-8');

  if (isUpdate) {
    logger.success(`✅ .claude/skills/test-implement/SKILL.md 파일이 갱신되었습니다. (${testType})`);
  } else {
    logger.success(`✅ .claude/skills/test-implement/SKILL.md 파일이 생성되었습니다. (${testType})`);
  }
};

/**
 * test-mock SKILL을 생성합니다.
 * manifest 설정에 따라 필요한 규칙 파일 경로를 주입합니다.
 */
export const createTestMockSkill = async (): Promise<void> => {
  const skillDir = path.resolve(process.cwd(), '.claude/skills/test-mock');
  const skillPath = path.join(skillDir, 'SKILL.md');

  await fs.ensureDir(skillDir);

  // manifest 읽기
  const manifest = await getManifestConfig();

  // Mock 관련 규칙 파일 경로 생성 (test-type은 제외, _common은 포함)
  const rulePaths = getRuleFilePaths(manifest, 'ui').filter(
    (p) => !p.startsWith('test-type/')
  );
  const ruleFilesList = rulePaths
    .map((p) => `- \`.claude/test-rules/${p}\``)
    .join('\n');

  // 컨텍스트 기반 규칙 목록 생성
  const contextRulesList = CONTEXT_BASED_RULES.map(
    (r) => `- ${r.pattern} → \`.claude/test-rules/${r.path}\``
  ).join('\n');

  // 템플릿 읽기 및 플레이스홀더 치환
  let skillContent = await readPromptTemplate('skills/test-mock.md');
  skillContent = skillContent
    .replace('{{RULE_FILES}}', ruleFilesList)
    .replace('{{CONTEXT_RULES}}', contextRulesList);

  const isUpdate = await fs.pathExists(skillPath);
  await fs.writeFile(skillPath, skillContent, 'utf-8');

  if (isUpdate) {
    logger.success('✅ .claude/skills/test-mock/SKILL.md 파일이 갱신되었습니다.');
  } else {
    logger.success('✅ .claude/skills/test-mock/SKILL.md 파일이 생성되었습니다.');
  }
};

/**
 * 동적 SKILL 파일과 규칙 파일을 생성/갱신합니다.
 * gen 명령에서 호출됩니다.
 *
 * - test-verify: init 시점에 생성 (정적)
 * - test-implement, test-mock, self-learn, test-coverage: gen 시점에 생성 (동적)
 * - rules/: 모든 규칙 파일을 .claude/rules/로 복사
 */
export const syncAllSkills = async (testType: TestType): Promise<void> => {
  // 규칙 파일 먼저 동기화 (SKILL에서 참조하므로)
  await syncRuleFiles();
  await createTestImplementSkill(testType);
  await createTestMockSkill();
  await createSelfLearnSkill();
  await createTestCoverageSkill();
};

/**
 * .claude/agents/test-implementer.md 파일을 생성하거나 갱신합니다.
 * Sub-agent 패턴 사용 시 테스트 구현을 위임받는 agent입니다.
 */
export const createTestImplementerAgent = async (): Promise<void> => {
  const agentDir = path.resolve(process.cwd(), '.claude/agents');
  const agentPath = path.join(agentDir, 'test-implementer.md');

  await fs.ensureDir(agentDir);

  const agentContent = await readPromptTemplate('agents/test-implementer.md');

  const isUpdate = await fs.pathExists(agentPath);

  await fs.writeFile(agentPath, agentContent, 'utf-8');

  if (isUpdate) {
    logger.success('✅ .claude/agents/test-implementer.md 파일이 갱신되었습니다.');
  } else {
    logger.success('✅ .claude/agents/test-implementer.md 파일이 생성되었습니다.');
  }
};

/**
 * 동적 Agent 파일을 생성/갱신합니다.
 * gen 명령에서 호출됩니다.
 */
export const syncAllAgents = async (): Promise<void> => {
  await createTestImplementerAgent();
};
