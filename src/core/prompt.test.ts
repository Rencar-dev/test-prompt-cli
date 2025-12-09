import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import { generateAtddPrompt, generatePlanPrompt, generateGenPrompt } from './prompt.js';
import * as fileUtils from '../utils/file.js';
import * as pathUtils from '../utils/path.js';
import * as locator from './locator.js';

vi.mock('../utils/file.js');
vi.mock('../utils/path.js');
vi.mock('./locator.js');
vi.mock('fs-extra');

describe('prompt core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAtddPrompt', () => {
    it('모든 파일이 정상적으로 읽혔을 때 올바른 포맷의 문자열 반환', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockTemplate = 'mock template';
      const mockAbsolutePath = '/abs/src/app/login/page.tsx';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile').mockResolvedValue(mockSourceCode);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);

      const result = await generateAtddPrompt(sourcePath);

      expect(result).toContain(mockTemplate);
      expect(result).toContain('## 입력 데이터');
      expect(result).toContain('[프로젝트 설정]');
      expect(result).toContain(mockManifest);
      expect(result).toContain('[코드]');
      expect(result).toContain(mockSourceCode);
      expect(result).toContain('[기능명 또는 파일 경로]');
      expect(result).toContain(`<<< ${sourcePath} >>>`);
    });

    it('Manifest 파일이 없을 때 MANIFEST_NOT_FOUND 에러 발생', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);

      await expect(generateAtddPrompt(sourcePath)).rejects.toThrow('MANIFEST_NOT_FOUND');
    });

    it('파일 읽기 실패 시 에러를 전파한다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockRejectedValue(new Error('Manifest Error'));

      await expect(generateAtddPrompt(sourcePath)).rejects.toThrow('Manifest Error');
    });
  });

  describe('generatePlanPrompt', () => {
    it('ATDD 파일이 있을 때 올바른 포맷의 문자열 반환', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockAtddContent = 'mock atdd content';
      const mockTemplate = 'mock template';
      const mockAbsolutePath = '/abs/src/app/login/page.tsx';
      const mockAtddPath = '/abs/src/app/login/page.atdd.md';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile')
        .mockResolvedValueOnce(mockSourceCode) // first call for source code
        .mockResolvedValueOnce(mockAtddContent); // second call for atdd content
      vi.spyOn(locator, 'findAtddFile').mockResolvedValue(mockAtddPath);
      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);

      const result = await generatePlanPrompt(sourcePath);

      expect(result).toContain(mockTemplate);
      expect(result).toContain('## 입력 데이터');
      expect(result).toContain('[ATDD 시나리오]');
      expect(result).toContain(mockAtddContent);
      expect(result).toContain('[프로젝트 설정]');
      expect(result).toContain(mockManifest);
      expect(result).toContain('[대상 기능의 소스 파일 경로]');
      expect(result).toContain(`<<< ${sourcePath} >>>`);
      expect(result).toContain('[코드]');
      expect(result).toContain(mockSourceCode);

      // Verify arguments passed to mocks
      expect(fileUtils.readUserFile).toHaveBeenCalledWith(mockAbsolutePath);
      expect(fileUtils.readUserFile).toHaveBeenCalledWith(mockAtddPath);
    });

    it('ATDD 파일이 없을 때 ATDD_FILE_NOT_FOUND 에러 발생', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockAbsolutePath = '/abs/src/app/login/page.tsx';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile').mockResolvedValue(mockSourceCode);
      vi.spyOn(locator, 'findAtddFile').mockResolvedValue(null);

      await expect(generatePlanPrompt(sourcePath)).rejects.toThrow('ATDD_FILE_NOT_FOUND');
    });
  });

  describe('generateGenPrompt', () => {
    it('UI 타입일 때 올바른 템플릿과 포맷의 문자열 반환', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockPlanContent = 'mock plan content';
      const mockTemplate = 'mock ui template';
      const mockExecutionGuide = 'mock execution guide';
      const mockAbsolutePath = '/abs/src/app/login/page.tsx';
      const mockPlanPath = '/abs/src/app/login/page.test-plan.md';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile')
        .mockResolvedValueOnce(mockSourceCode) // first call for source code
        .mockResolvedValueOnce(mockPlanContent); // second call for plan content
      vi.spyOn(locator, 'findPlanFile').mockResolvedValue(mockPlanPath);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate) // first call for ui template
        .mockResolvedValueOnce(mockExecutionGuide); // second call for execution guide

      const result = await generateGenPrompt(sourcePath, 'ui');

      // 올바른 템플릿 파일명으로 호출되었는지 확인
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('ui-test-implementation-prompt.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('test-coding-conventions.md');

      // 프롬프트 구조 검증
      expect(result).toContain(mockTemplate);
      expect(result).toContain('## 입력 데이터');
      expect(result).toContain('[참조 문서: 실행 및 환경 가이드]');
      expect(result).toContain(mockExecutionGuide);
      expect(result).toContain('[Test Plan]');
      expect(result).toContain(mockPlanContent);
      expect(result).toContain('[프로젝트 설정]');
      expect(result).toContain(mockManifest);
      expect(result).toContain('[코드]');
      expect(result).toContain(mockSourceCode);
      expect(result).toContain('[대상 기능의 소스 파일 경로]');
      expect(result).toContain(`<<< ${sourcePath} >>>`);
    });

    it('Unit 타입일 때 올바른 템플릿과 포맷의 문자열 반환', async () => {
      const sourcePath = 'src/utils/date.ts';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockPlanContent = 'mock plan content';
      const mockTemplate = 'mock unit template';
      const mockExecutionGuide = 'mock execution guide';
      const mockAbsolutePath = '/abs/src/utils/date.ts';
      const mockPlanPath = '/abs/src/utils/date.test-plan.md';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile')
        .mockResolvedValueOnce(mockSourceCode) // first call for source code
        .mockResolvedValueOnce(mockPlanContent); // second call for plan content
      vi.spyOn(locator, 'findPlanFile').mockResolvedValue(mockPlanPath);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate) // first call for unit template
        .mockResolvedValueOnce(mockExecutionGuide); // second call for execution guide

      const result = await generateGenPrompt(sourcePath, 'unit');

      // 올바른 템플릿 파일명으로 호출되었는지 확인
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('business-logic-test-prompt.md');
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('test-coding-conventions.md');

      // 프롬프트 구조 검증
      expect(result).toContain(mockTemplate);
      expect(result).toContain('## 입력 데이터');
      expect(result).toContain('[참조 문서: 실행 및 환경 가이드]');
      expect(result).toContain(mockExecutionGuide);
      expect(result).toContain('[Test Plan]');
      expect(result).toContain(mockPlanContent);
      expect(result).toContain('[프로젝트 설정]');
      expect(result).toContain(mockManifest);
      expect(result).toContain('[코드]');
      expect(result).toContain(mockSourceCode);
      expect(result).toContain('[대상 기능의 소스 파일 경로]');
      expect(result).toContain(`<<< ${sourcePath} >>>`);
    });

    it('기본값이 ui일 때 UI 템플릿 사용', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockPlanContent = 'mock plan content';
      const mockTemplate = 'mock ui template';
      const mockExecutionGuide = 'mock execution guide';
      const mockAbsolutePath = '/abs/src/app/login/page.tsx';
      const mockPlanPath = '/abs/src/app/login/page.test-plan.md';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile')
        .mockResolvedValueOnce(mockSourceCode) // first call for source code
        .mockResolvedValueOnce(mockPlanContent); // second call for plan content
      vi.spyOn(locator, 'findPlanFile').mockResolvedValue(mockPlanPath);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate) // first call for ui template
        .mockResolvedValueOnce(mockExecutionGuide); // second call for execution guide

      const result = await generateGenPrompt(sourcePath);

      // 기본값으로 UI 템플릿 사용 확인
      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('ui-test-implementation-prompt.md');
      expect(result).toContain(mockTemplate);
    });

    it('Plan 파일이 없을 때 PLAN_FILE_NOT_FOUND 에러 발생', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockAbsolutePath = '/abs/src/app/login/page.tsx';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile').mockResolvedValue(mockSourceCode);
      vi.spyOn(locator, 'findPlanFile').mockResolvedValue(null);

      await expect(generateGenPrompt(sourcePath, 'ui')).rejects.toThrow('PLAN_FILE_NOT_FOUND');
    });

    it('파일 읽기 실패 시 에러를 전파한다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockRejectedValue(new Error('Manifest Error'));

      await expect(generateGenPrompt(sourcePath, 'ui')).rejects.toThrow('Manifest Error');
    });

    it('project-test-lessons.md 파일이 있을 때 내용을 포함한다', async () => {
      const sourcePath = 'src/app/login/page.tsx';
      const mockManifest = 'mock manifest content';
      const mockSourceCode = 'mock source code';
      const mockPlanContent = 'mock plan content';
      const mockTemplate = 'mock ui template';
      const mockExecutionGuide = 'mock execution guide';
      const mockLessons = '## Lessons Learned Content';
      const mockAbsolutePath = '/abs/src/app/login/page.tsx';
      const mockPlanPath = '/abs/src/app/login/page.test-plan.md';

      vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
      vi.spyOn(fileUtils, 'readManifest').mockResolvedValue(mockManifest);
      vi.spyOn(pathUtils, 'resolveUserPath').mockReturnValue(mockAbsolutePath);
      vi.spyOn(fileUtils, 'readUserFile')
        .mockResolvedValueOnce(mockSourceCode)
        .mockResolvedValueOnce(mockPlanContent);
      vi.spyOn(locator, 'findPlanFile').mockResolvedValue(mockPlanPath);
      vi.spyOn(fileUtils, 'readPromptTemplate')
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce(mockExecutionGuide);
      
      // fs.readFile 모킹 (lessons 파일 읽기)
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockLessons as never);

      const result = await generateGenPrompt(sourcePath, 'ui');

      expect(result).toContain('[Lessons Learned: 오답노트]');
      expect(result).toContain(mockLessons);
    });
  });

  describe('generateLearnPrompt', () => {
    it('실패한 코드, 에러 로그, 기존 교훈을 템플릿에 주입하여 반환', async () => {
      const failedCode = 'const a = 1;';
      const errorLog = 'Error: a is not defined';
      const existingLessons = '- Lesson 1';
      const mockTemplate = 'Template: {{FAILED_CODE}} / {{ERROR_LOG}} / {{EXISTING_LESSONS}}';

      vi.spyOn(fileUtils, 'readPromptTemplate').mockResolvedValue(mockTemplate);

      const { generateLearnPrompt } = await import('./prompt.js');
      const result = await generateLearnPrompt(failedCode, errorLog, existingLessons);

      expect(fileUtils.readPromptTemplate).toHaveBeenCalledWith('feedback-analyzer-prompt.md');
      expect(result).toBe('Template: const a = 1; / Error: a is not defined / - Lesson 1');
    });
  });
});
