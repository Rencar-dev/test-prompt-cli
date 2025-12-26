import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';
import { readPromptTemplate } from '../utils/file.js';
import { getManifestConfig } from '../utils/manifest.js';
import { TestType } from './test-type.js';

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
 * 규칙 모듈 매핑 (rules-loader.ts와 동기화)
 */
const RULE_MODULES: Record<string, Record<string, string>> = {
  testRunner: {
    vitest: 'rules/runner/vitest.md',
    jest: 'rules/runner/jest.md',
  },
  stateManagement: {
    zustand: 'rules/state/zustand.md',
    redux: 'rules/state/redux.md',
    'redux-toolkit': 'rules/state/redux.md',
  },
  queryLibrary: {
    'tanstack-query': 'rules/query/tanstack-query.md',
    swr: 'rules/query/swr.md',
  },
  mockStrategy: {
    msw: 'rules/mock/msw.md',
    'module-mock': 'rules/mock/module-mock.md',
  },
  router: {
    'next-app': 'rules/router/next-router.md',
    'next-pages': 'rules/router/next-router.md',
    'react-router': 'rules/router/react-router.md',
  },
};

/**
 * manifest 설정에서 규칙 내용을 읽어 반환합니다.
 */
const loadRuleContent = async (
  field: keyof typeof RULE_MODULES,
  value: string
): Promise<string> => {
  const modulePath = RULE_MODULES[field]?.[value];
  if (!modulePath) {
    return '';
  }

  try {
    return await readPromptTemplate(modulePath);
  } catch {
    return '';
  }
};

/**
 * test-implement SKILL을 생성합니다.
 * UI/Unit 테스트 타입에 따라 다른 규칙을 포함합니다.
 */
export const createTestImplementSkill = async (
  testType: TestType
): Promise<void> => {
  const skillDir = path.resolve(process.cwd(), '.claude/skills/test-implement');
  const skillPath = path.join(skillDir, 'SKILL.md');

  await fs.ensureDir(skillDir);

  // 기본 템플릿 읽기
  let skillContent = await readPromptTemplate('skills/test-implement.md');

  // 테스트 타입별 규칙 로드
  const typeRulePath = testType === 'ui' ? 'rules/type/ui.md' : 'rules/type/unit.md';
  let typeRules = '';

  try {
    typeRules = await readPromptTemplate(typeRulePath);
  } catch {
    typeRules = '';
  }

  // 플레이스홀더 치환
  skillContent = skillContent.replace(
    '{{TYPE_SPECIFIC_RULES}}',
    typeRules
      ? `## 테스트 타입별 규칙 (${testType.toUpperCase()})\n\n${typeRules}`
      : ''
  );

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
 * manifest 설정에 따라 필요한 규칙만 포함합니다.
 */
export const createTestMockSkill = async (): Promise<void> => {
  const skillDir = path.resolve(process.cwd(), '.claude/skills/test-mock');
  const skillPath = path.join(skillDir, 'SKILL.md');

  await fs.ensureDir(skillDir);

  // 기본 템플릿 읽기
  let skillContent = await readPromptTemplate('skills/test-mock.md');

  // manifest 설정 읽기
  const manifest = await getManifestConfig();

  // 각 규칙 로드
  const runnerRules = await loadRuleContent('testRunner', manifest.testRunner);
  const stateRules = await loadRuleContent('stateManagement', manifest.stateManagement);
  const queryRules = await loadRuleContent('queryLibrary', manifest.queryLibrary);
  const mockRules = await loadRuleContent('mockStrategy', manifest.mockStrategy);
  const routerRules = await loadRuleContent('router', manifest.router);

  // 플레이스홀더 치환
  skillContent = skillContent
    .replace(
      '{{RUNNER_RULES}}',
      runnerRules ? `## Test Runner 규칙 (${manifest.testRunner})\n\n${runnerRules}` : ''
    )
    .replace(
      '{{STATE_RULES}}',
      stateRules ? `## State Management 규칙 (${manifest.stateManagement})\n\n${stateRules}` : ''
    )
    .replace(
      '{{QUERY_RULES}}',
      queryRules ? `## Query Library 규칙 (${manifest.queryLibrary})\n\n${queryRules}` : ''
    )
    .replace(
      '{{MOCK_STRATEGY_RULES}}',
      mockRules ? `## Mock Strategy 규칙 (${manifest.mockStrategy})\n\n${mockRules}` : ''
    )
    .replace(
      '{{ROUTER_RULES}}',
      routerRules ? `## Router 규칙 (${manifest.router})\n\n${routerRules}` : ''
    );

  const isUpdate = await fs.pathExists(skillPath);
  await fs.writeFile(skillPath, skillContent, 'utf-8');

  const configSummary = [
    manifest.testRunner,
    manifest.stateManagement !== 'none' ? manifest.stateManagement : null,
    manifest.queryLibrary !== 'none' ? manifest.queryLibrary : null,
    manifest.mockStrategy,
    manifest.router !== 'none' ? manifest.router : null,
  ]
    .filter(Boolean)
    .join(', ');

  if (isUpdate) {
    logger.success(`✅ .claude/skills/test-mock/SKILL.md 파일이 갱신되었습니다. (${configSummary})`);
  } else {
    logger.success(`✅ .claude/skills/test-mock/SKILL.md 파일이 생성되었습니다. (${configSummary})`);
  }
};

/**
 * 동적 SKILL 파일을 생성/갱신합니다.
 * gen 명령에서 호출됩니다.
 *
 * - test-verify: init 시점에 생성 (정적)
 * - test-implement, test-mock, self-learn: gen 시점에 생성 (동적)
 */
export const syncAllSkills = async (testType: TestType): Promise<void> => {
  await createTestImplementSkill(testType);
  await createTestMockSkill();
  await createSelfLearnSkill();
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
