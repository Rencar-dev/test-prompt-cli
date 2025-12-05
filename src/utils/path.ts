import path from 'path';
import { fileURLToPath } from 'url';

// ESM 환경에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 패키지 내부의 prompts 폴더 경로 (배포 후 dist/prompts 기준)
// 개발 중(src)일 때와 배포 후(dist)일 때의 경로 차이를 고려해야 함
export const getPromptsPath = () => {
  return path.resolve(__dirname, '../prompts');
};

// 2. 사용자의 현재 실행 위치 (CWD) 기준 절대 경로 변환
export const resolveUserPath = (relativePath: string) => {
  return path.resolve(process.cwd(), relativePath);
};

