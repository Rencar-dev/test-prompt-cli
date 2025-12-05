#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import path from 'path';
import { initCommand } from './commands/init.js';
import { atddCommand } from './commands/atdd.js';
import { planCommand } from './commands/plan.js';
import { genCommand } from './commands/gen.js';

// package.json 읽어서 버전 표시 (ESM 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
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

program.parse(process.argv);

