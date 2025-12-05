import chalk from 'chalk';

/**
 * CLI 로깅 유틸리티
 * 일관된 로깅 스타일을 제공하고, 향후 로깅 라이브러리로 교체하기 쉽도록 추상화합니다.
 */
export const logger = {
  /**
   * 정보 메시지 출력 (파란색)
   */
  info: (message: string) => {
    console.log(chalk.blue(message));
  },

  /**
   * 성공 메시지 출력 (초록색)
   */
  success: (message: string) => {
    console.log(chalk.green(message));
  },

  /**
   * 보조 메시지 출력 (회색)
   */
  hint: (message: string) => {
    console.log(chalk.gray(message));
  },

  /**
   * 에러 메시지 출력 (빨간색)
   */
  error: (message: string) => {
    console.error(chalk.red(message));
  },

  /**
   * 경고 메시지 출력 (노란색)
   */
  warn: (message: string) => {
    console.error(chalk.yellow(message));
  },

  /**
   * 안내 메시지 출력 (청록색)
   */
  tip: (message: string) => {
    console.error(chalk.cyan(message));
  },
};

