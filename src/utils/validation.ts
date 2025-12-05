import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * project-manifest.yaml 파일이 존재하는지 검증합니다.
 * @returns 파일이 존재하면 true, 없으면 false
 */
export const validateManifestExists = async (): Promise<boolean> => {
  const manifestPath = path.resolve(process.cwd(), 'project-manifest.yaml');

  const exists = await fs.pathExists(manifestPath);
  if (!exists) {
    console.error(chalk.red('\n❌ [Error] project-manifest.yaml 파일을 찾을 수 없습니다.'));
    console.error(chalk.yellow('👉 먼저 다음 명령어를 실행하여 프로젝트 설정을 진행해주세요:'));
    console.error(chalk.cyan('\n    rencar-prompt init\n'));
    return false; // 존재하지 않음
  }
  return true; // 존재함
};

