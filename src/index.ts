#!/usr/bin/env node
import { Command } from 'commander';
import prompts from 'prompts';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import path from 'path';
import { initCommand } from './commands/init.js';
import { atddCommand } from './commands/atdd.js';
import { planCommand } from './commands/plan.js';
import { genCommand } from './commands/gen.js';
import { learnCommand } from './commands/learn.js';
import { logger } from './utils/logger.js';

// package.json 읽어서 버전 표시 (ESM 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
);

const program = new Command();

program
  .name('rencar-prompt')
  .description('Rencar Frontend SDET CLI')
  .version(pkg.version);

// 명령어 등록
program.addCommand(initCommand);
program.addCommand(atddCommand);
program.addCommand(planCommand);
program.addCommand(genCommand);
program.addCommand(learnCommand);

/**
 * 인자 없이 실행 시 명령어 선택 메뉴 표시
 */
const showCommandMenu = async (): Promise<void> => {
  const commands = [
    { title: 'atdd   - ATDD 시나리오 생성', value: 'atdd' },
    { title: 'plan   - 테스트 계획 수립', value: 'plan' },
    { title: 'gen    - 테스트 코드 생성', value: 'gen' },
    { title: 'learn  - 오답노트 갱신', value: 'learn' },
  ];

  let isCancelled = false;

  const { command } = await prompts(
    {
      type: 'select',
      name: 'command',
      message: '실행할 명령어를 선택하세요',
      choices: commands,
      onState: (state: { aborted?: boolean; exited?: boolean }) => {
        if (state.aborted || state.exited) {
          isCancelled = true;
        }
      },
    },
    {
      onCancel: () => {
        isCancelled = true;
      },
    },
  );

  if (isCancelled || !command) {
    logger.info('취소되었습니다.');
    process.exit(0);
  }

  // 선택된 명령어를 인자로 다시 실행 (Interactive 모드로 진입)
  process.argv = [process.argv[0], process.argv[1], command];
  program.parse(process.argv);
};

// 인자가 없으면 메뉴 표시, 있으면 일반 파싱
if (process.argv.length <= 2) {
  showCommandMenu();
} else {
  program.parse(process.argv);
}

