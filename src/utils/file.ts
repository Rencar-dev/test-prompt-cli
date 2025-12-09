import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { getPromptsPath } from './path.js';

export const readPromptTemplate = async (fileName: string): Promise<string> => {
  const promptPath = path.join(getPromptsPath(), fileName);
  try {
    return await fs.readFile(promptPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`프롬프트 템플릿을 찾을 수 없습니다: ${promptPath}\n원인: ${errorMessage}`);
  }
};

export const readUserFile = async (filePath: string): Promise<string> => {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`파일을 읽을 수 없습니다: ${filePath}\n원인: ${errorMessage}`);
  }
};

/**
 * project-manifest.yaml 파일을 읽습니다.
 * @returns manifest 파일 내용
 * @throws 파일이 없거나 읽을 수 없을 경우 에러 발생
 */
export const readManifest = async (): Promise<string> => {
  const manifestPath = path.resolve(process.cwd(), 'project-manifest.yaml');
  try {
    return await fs.readFile(manifestPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`project-manifest.yaml 파일을 읽을 수 없습니다: ${manifestPath}\n원인: ${errorMessage}`);
  }
};

/**
 * project-manifest.yaml에서 testPaths 설정을 읽어옵니다.
 * @returns testPaths 설정 객체 (없으면 기본값 반환)
 */
export const getTestPathsConfig = async (): Promise<{ dirName: string; atddSuffix: string; planSuffix: string; mode: string }> => {
  try {
    const manifestContent = await readManifest();
    const manifest = yaml.load(manifestContent) as {
      testPaths?: {
        dirName?: string;
        atddSuffix?: string;
        planSuffix?: string;
        mode?: string;
      };
    };

    // 기본값: _tests, .atdd.md, .test-plan.md, co-location
    return {
      dirName: manifest.testPaths?.dirName || '_tests',
      atddSuffix: manifest.testPaths?.atddSuffix || '.atdd.md',
      planSuffix: manifest.testPaths?.planSuffix || '.test-plan.md',
      mode: manifest.testPaths?.mode || 'co-location',
    };
  } catch {
    // manifest 파일이 없거나 파싱 실패 시 기본값 반환
    return {
      dirName: '_tests',
      atddSuffix: '.atdd.md',
      planSuffix: '.test-plan.md',
      mode: 'co-location',
    };
  }
};

/**
 * project-manifest.yaml에서 testCommand 설정을 읽어옵니다.
 * @returns testCommand 문자열 (없으면 기본값 'npm test --' 반환)
 */
export const getTestCommandConfig = async (): Promise<string> => {
  try {
    const manifestContent = await readManifest();
    const manifest = yaml.load(manifestContent) as {
      testCommand?: string;
    };

    return manifest.testCommand || 'npm test --';
  } catch {
    return 'npm test --';
  }
};


