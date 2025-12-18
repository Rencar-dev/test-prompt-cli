import fs from 'fs-extra';
import nodeFs from 'fs';
import path from 'path';
import { getTestPathsConfig } from '../utils/file.js';
import { logger } from '../utils/logger.js';
import { resolveUserPath } from '../utils/path.js';

/**
 * 소스 파일 경로를 기반으로 ATDD 파일 경로를 찾습니다.
 * project-manifest.yaml의 testPaths 설정을 참고합니다.
 * 1. 같은 디렉토리에서 `.atdd.md` 파일 찾기
 * 2. testPaths.dirName 폴더에서 `.atdd.md` 파일 찾기
 * @param sourcePath - 소스 파일 경로
 * @returns ATDD 파일 경로 (존재하지 않으면 null)
 */
export const findAtddFile = async (sourcePath: string): Promise<string | null> => {
  const absolutePath = resolveUserPath(sourcePath);
  const dir = path.dirname(absolutePath);
  const baseName = path.basename(absolutePath, path.extname(absolutePath));
  const dirName = path.basename(dir);

  // project-manifest.yaml에서 testPaths 설정 읽기
  const testPaths = await getTestPathsConfig();

  // 가능한 ATDD 파일 경로들
  const candidates = [
    // 같은 디렉토리: page.tsx -> page.atdd.md 또는 login.atdd.md
    path.join(dir, `${baseName}${testPaths.atddSuffix}`),
    path.join(dir, `${dirName}${testPaths.atddSuffix}`),
    // testPaths.dirName 폴더: _tests/page.atdd.md 또는 _tests/login.atdd.md
    path.join(dir, testPaths.dirName, `${baseName}${testPaths.atddSuffix}`),
    path.join(dir, testPaths.dirName, `${dirName}${testPaths.atddSuffix}`),
  ];

  // 첫 번째로 존재하는 파일 반환
  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  // Fallback: testPaths.dirName 폴더에서 *.atdd.md 파일 검색
  // AI가 생성한 파일명이 규칙과 다를 수 있으므로 유연하게 검색
  const testDir = path.join(dir, testPaths.dirName);
  if (nodeFs.existsSync(testDir)) {
    const files = nodeFs.readdirSync(testDir);
    const atddFile = files.find((f) => f.endsWith(testPaths.atddSuffix));
    if (atddFile) {
      const foundPath = path.join(testDir, atddFile);
      logger.warn(`파일명 규칙과 다른 ATDD 파일 발견: ${atddFile}`);
      logger.hint(`권장 파일명: ${baseName}${testPaths.atddSuffix} 또는 ${dirName}${testPaths.atddSuffix}`);
      return foundPath;
    }
  }

  return null;
};

/**
 * 소스 파일 경로를 기반으로 Test Plan 파일 경로를 찾습니다.
 * project-manifest.yaml의 testPaths 설정을 참고합니다.
 * 1. 같은 디렉토리에서 `.test-plan.md` 파일 찾기
 * 2. testPaths.dirName 폴더에서 `.test-plan.md` 파일 찾기
 * @param sourcePath - 소스 파일 경로
 * @returns Test Plan 파일 경로 (존재하지 않으면 null)
 */
export const findPlanFile = async (sourcePath: string): Promise<string | null> => {
  const absolutePath = resolveUserPath(sourcePath);
  const dir = path.dirname(absolutePath);
  const baseName = path.basename(absolutePath, path.extname(absolutePath));
  const dirName = path.basename(dir);

  // project-manifest.yaml에서 testPaths 설정 읽기
  const testPaths = await getTestPathsConfig();

  // 가능한 Plan 파일 경로들
  const candidates = [
    // 같은 디렉토리: page.tsx -> page.test-plan.md 또는 login.test-plan.md
    path.join(dir, `${baseName}${testPaths.planSuffix}`),
    path.join(dir, `${dirName}${testPaths.planSuffix}`),
    // testPaths.dirName 폴더: _tests/page.test-plan.md 또는 _tests/login.test-plan.md
    path.join(dir, testPaths.dirName, `${baseName}${testPaths.planSuffix}`),
    path.join(dir, testPaths.dirName, `${dirName}${testPaths.planSuffix}`),
  ];

  // 첫 번째로 존재하는 파일 반환
  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  // Fallback: testPaths.dirName 폴더에서 *.test-plan.md 파일 검색
  // AI가 생성한 파일명이 규칙과 다를 수 있으므로 유연하게 검색
  const testDir = path.join(dir, testPaths.dirName);
  if (nodeFs.existsSync(testDir)) {
    const files = nodeFs.readdirSync(testDir);
    const planFile = files.find((f) => f.endsWith(testPaths.planSuffix));
    if (planFile) {
      const foundPath = path.join(testDir, planFile);
      logger.warn(`파일명 규칙과 다른 Plan 파일 발견: ${planFile}`);
      logger.hint(`권장 파일명: ${baseName}${testPaths.planSuffix} 또는 ${dirName}${testPaths.planSuffix}`);
      return foundPath;
    }
  }

  return null;
};

/**
 * 소스 파일 경로를 기반으로 테스트 파일 경로를 찾습니다.
 * 1. 같은 디렉토리에서 테스트 파일 찾기
 * 2. project-manifest.yaml에 설정된 testPaths.dirName 폴더에서 찾기
 * @param sourcePath - 소스 파일 경로
 * @returns 테스트 파일 경로 (존재하지 않으면 null)
 */
export const findTestFile = async (sourcePath: string): Promise<string | null> => {
  const absolutePath = resolveUserPath(sourcePath);
  const dir = path.dirname(absolutePath);
  const baseName = path.basename(absolutePath, path.extname(absolutePath));
  const dirName = path.basename(dir);

  // project-manifest.yaml에서 testPaths 설정 읽기
  const testPaths = await getTestPathsConfig();

  // testSuffix 기반 확장자 생성 (예: .test → .test.tsx, .test.ts)
  const extensions = [`${testPaths.testSuffix}.tsx`, `${testPaths.testSuffix}.ts`];

  // 가능한 경로들
  const candidates: string[] = [];

  // 1. Co-location (같은 폴더)
  extensions.forEach(ext => {
    candidates.push(path.join(dir, `${baseName}${ext}`));
    candidates.push(path.join(dir, `${dirName}${ext}`));
  });

  // 2. Configured Test Directory (예: _tests, __tests__)
  extensions.forEach(ext => {
    candidates.push(path.join(dir, testPaths.dirName, `${baseName}${ext}`));
    candidates.push(path.join(dir, testPaths.dirName, `${dirName}${ext}`));
  });

  // 첫 번째로 존재하는 파일 반환
  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  // Fallback: testPaths.dirName 폴더에서 테스트 파일 검색
  // AI가 생성한 파일명이 규칙과 다를 수 있으므로 유연하게 검색
  const testDir = path.join(dir, testPaths.dirName);
  if (nodeFs.existsSync(testDir)) {
    const files = nodeFs.readdirSync(testDir);
    const testFile = files.find((f) =>
      extensions.some((ext) => f.endsWith(ext)),
    );
    if (testFile) {
      const foundPath = path.join(testDir, testFile);
      logger.warn(`파일명 규칙과 다른 테스트 파일 발견: ${testFile}`);
      logger.hint(`권장 파일명: ${baseName}${testPaths.testSuffix}.tsx 또는 ${dirName}${testPaths.testSuffix}.tsx`);
      return foundPath;
    }
  }

  return null;
};

