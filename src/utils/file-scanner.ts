/**
 * 파일 스캐너 유틸리티
 * 명령어별로 다른 필터링 전략을 적용하여 파일 목록을 반환합니다.
 */
import fg from 'fast-glob';
import path from 'path';

export interface FileCandidate {
  /** 표시용 라벨 (예: /login, useAuth.ts) */
  title: string;
  /** 실제 파일 경로 */
  value: string;
  /** 그룹 (예: 'UI Pages', 'Hooks / Utils') */
  group?: string;
}

/**
 * 파일 경로를 Next.js App Router 형태의 route로 변환
 * 예: app/(auth)/login/page.tsx → /login
 */
const filePathToRoute = (filePath: string): string => {
  // app/ 이후 부분 추출
  const match = filePath.match(/app\/(.+)\/page\.(tsx|ts|jsx|js)$/);
  if (!match) return filePath;

  const routePart = match[1];
  // (group) 패턴 제거 및 route 정리
  const route =
    '/' +
    routePart
      .split('/')
      .filter((segment) => !segment.startsWith('(') || !segment.endsWith(')'))
      .join('/');

  return route === '/' ? '/' : route;
};

/**
 * ATDD 명령어용 파일 스캔
 * - 모든 JSX/TSX 컴포넌트 반환
 * - Route 형태로 표시 (page 파일인 경우)
 */
export const scanForAtdd = async (): Promise<FileCandidate[]> => {
  const patterns = ['**/*.{tsx,jsx}'];

  const ignorePatterns = [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.stories.*',
    '**/_tests/**',
    '**/__tests__/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
  ];

  const files = await fg(patterns, {
    ignore: ignorePatterns,
    cwd: process.cwd(),
  });

  return files.map((file) => {
    const isPage = file.includes('/page.');
    const title = isPage ? filePathToRoute(file) : path.basename(file);

    return {
      title: `${title}  (${file})`,
      value: file,
      group: isPage ? 'UI Pages' : 'Components',
    };
  });
};

/**
 * Plan 명령어용 파일 스캔
 * - ATDD 파일이 존재하는 소스 파일만 반환
 */
export const scanForPlan = async (): Promise<FileCandidate[]> => {
  // .atdd.md 파일 찾기
  const atddFiles = await fg(['**/*.atdd.md'], {
    ignore: ['**/node_modules/**'],
    cwd: process.cwd(),
  });

  const candidates: FileCandidate[] = [];

  for (const atddFile of atddFiles) {
    // atdd 파일에서 원본 소스 파일 경로 추론
    // 예: app/login/_tests/login.atdd.md → app/login/page.tsx
    //     app/login/page.atdd.md → app/login/page.tsx
    const dir = path.dirname(atddFile);
    const baseName = path.basename(atddFile, '.atdd.md');

    // 가능한 소스 파일 경로들
    const possibleSources = [
      path.join(dir, `${baseName}.tsx`),
      path.join(dir, `${baseName}.ts`),
      path.join(dir, '..', `${baseName}.tsx`), // _tests 폴더인 경우
      path.join(dir, '..', `${baseName}.ts`),
      path.join(dir, '..', 'page.tsx'), // _tests/login.atdd.md → ../page.tsx
      path.join(dir, 'page.tsx'),
    ];

    // 실제 존재하는 소스 파일 찾기
    const existingSources = await fg(possibleSources, { cwd: process.cwd() });

    if (existingSources.length > 0) {
      const sourceFile = existingSources[0];
      const isPage = sourceFile.includes('/page.');
      const title = isPage ? filePathToRoute(sourceFile) : path.basename(sourceFile);

      candidates.push({
        title: `${title}  (ATDD 있음)`,
        value: sourceFile,
        group: 'ATDD 작성됨',
      });
    }
  }

  return candidates;
};

/**
 * Gen 명령어용 파일 스캔
 * - 확장자 기반으로 UI/Unit 구분
 * - JSX/TSX → UI (렌더링 포함)
 * - JS/TS → Unit (순수 로직)
 */
export const scanForGen = async (): Promise<FileCandidate[]> => {
  const ignorePatterns = [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.stories.*',
    '**/_tests/**',
    '**/__tests__/**',
    '**/*.d.ts',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
  ];

  // UI: JSX/TSX (렌더링 포함 파일)
  const uiFiles = await fg(['**/*.{tsx,jsx}'], {
    ignore: ignorePatterns,
    cwd: process.cwd(),
  });

  // Unit: JS/TS (순수 로직 파일)
  const unitFiles = await fg(['**/*.{ts,js}'], {
    ignore: ignorePatterns,
    cwd: process.cwd(),
  });

  const candidates: FileCandidate[] = [];

  // UI 그룹
  for (const file of uiFiles) {
    const isPage = file.includes('/page.');
    const title = isPage ? filePathToRoute(file) : path.basename(file);
    candidates.push({
      title: `${title}  (${file})`,
      value: file,
      group: 'UI (--type ui)',
    });
  }

  // Unit 그룹
  for (const file of unitFiles) {
    candidates.push({
      title: `${path.basename(file)}  (${file})`,
      value: file,
      group: 'Unit (--type unit)',
    });
  }

  return candidates;
};

/**
 * Learn 명령어용 파일 스캔
 * - 테스트 파일이 존재하는 소스 파일만 반환
 */
export const scanForLearn = async (): Promise<FileCandidate[]> => {
  // 테스트 파일 찾기
  const testFiles = await fg(['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'], {
    ignore: ['**/node_modules/**'],
    cwd: process.cwd(),
  });

  const candidates: FileCandidate[] = [];

  for (const testFile of testFiles) {
    // 테스트 파일에서 원본 소스 파일 경로 추론
    const dir = path.dirname(testFile);
    const testBaseName = path.basename(testFile).replace(/\.(test|spec)\.(ts|tsx)$/, '');

    // 가능한 소스 파일 경로들
    const possibleSources = [
      path.join(dir, `${testBaseName}.tsx`),
      path.join(dir, `${testBaseName}.ts`),
      path.join(dir, '..', `${testBaseName}.tsx`), // _tests 폴더인 경우
      path.join(dir, '..', `${testBaseName}.ts`),
      path.join(dir, '..', 'page.tsx'),
    ];

    const existingSources = await fg(possibleSources, { cwd: process.cwd() });

    if (existingSources.length > 0) {
      const sourceFile = existingSources[0];
      const isPage = sourceFile.includes('/page.');
      const title = isPage ? filePathToRoute(sourceFile) : path.basename(sourceFile);

      candidates.push({
        title: `${title}  (테스트 있음: ${path.basename(testFile)})`,
        value: sourceFile,
        group: '테스트 파일 존재',
      });
    }
  }

  return candidates;
};

/**
 * 키워드로 파일 후보 필터링
 */
export const filterCandidates = (candidates: FileCandidate[], keyword: string): FileCandidate[] => {
  if (!keyword.trim()) return candidates;

  const lowerKeyword = keyword.toLowerCase();
  return candidates.filter(
    (c) =>
      c.title.toLowerCase().includes(lowerKeyword) || c.value.toLowerCase().includes(lowerKeyword),
  );
};
