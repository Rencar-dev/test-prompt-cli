/**
 * Interactive 파일 선택기
 * 인자가 없을 때 fuzzy search로 파일을 선택할 수 있게 합니다.
 */
import prompts from 'prompts';
import { logger } from './logger.js';
import {
  FileCandidate,
  scanForAtdd,
  scanForPlan,
  scanForGen,
  scanForLearn,
  scanForSync,
  filterCandidates,
} from './file-scanner.js';

export type CommandType = 'atdd' | 'plan' | 'gen' | 'learn' | 'sync';

/** Sync 명령어의 동기화 수준 */
export type SyncLevel = 'test-only' | 'full';

interface InteractiveResult {
  filePath: string;
  /** gen 명령어에서 자동 추론된 테스트 타입 */
  testType?: 'ui' | 'unit';
  /** sync 명령어에서 선택된 동기화 수준 */
  syncLevel?: SyncLevel;
}

/** 검색 결과 최대 표시 개수 */
const MAX_SUGGESTIONS = 15;

/**
 * 명령어별 스캐너 매핑
 */
const scanners: Record<CommandType, () => Promise<FileCandidate[]>> = {
  atdd: scanForAtdd,
  plan: scanForPlan,
  gen: scanForGen,
  learn: scanForLearn,
  sync: scanForSync,
};

/**
 * 명령어별 메시지
 */
const messages: Record<CommandType, { prompt: string; placeholder: string; empty: string }> = {
  atdd: {
    prompt: 'ATDD를 생성할 파일을 검색하세요',
    placeholder: '파일명 또는 경로를 입력하세요 (예: login, user, auth)',
    empty: 'UI 페이지/컴포넌트 파일을 찾을 수 없습니다.',
  },
  plan: {
    prompt: 'Plan을 생성할 파일을 선택하세요',
    placeholder: 'ATDD가 작성된 파일을 검색하세요',
    empty: 'ATDD 파일이 작성된 소스 파일이 없습니다. 먼저 `prompt atdd`를 실행하세요.',
  },
  gen: {
    prompt: '테스트를 생성할 파일을 검색하세요',
    placeholder: '파일명 또는 경로를 입력하세요 (예: login, useAuth, utils)',
    empty: '테스트 대상 파일을 찾을 수 없습니다.',
  },
  learn: {
    prompt: '학습할 테스트 파일을 선택하세요',
    placeholder: '테스트가 있는 파일을 검색하세요',
    empty: '테스트 파일이 존재하는 소스 파일이 없습니다.',
  },
  sync: {
    prompt: '동기화할 파일을 검색하세요',
    placeholder: '테스트가 있는 파일을 검색하세요 (예: login, user)',
    empty: '테스트 파일이 존재하는 소스 파일이 없습니다. 먼저 `prompt gen`을 실행하세요.',
  },
};

/**
 * Gen 명령어에서 파일 확장자로 테스트 타입 추론
 * - JSX/TSX → UI (렌더링 포함)
 * - JS/TS → Unit (순수 로직)
 */
export const inferTestType = (filePath: string): 'ui' | 'unit' => {
  // JSX/TSX 확장자면 UI
  if (/\.(tsx|jsx)$/.test(filePath)) {
    return 'ui';
  }
  // JS/TS 확장자면 Unit
  return 'unit';
};

/**
 * Interactive 파일 선택기 실행
 * - 초기에는 빈 리스트 + placeholder 표시
 * - 타이핑하면 실시간으로 필터링
 */
export const selectFileInteractively = async (
  command: CommandType,
): Promise<InteractiveResult | null> => {
  const scanner = scanners[command];
  const message = messages[command];

  logger.info('파일 목록을 스캔 중...');

  // 1. 파일 스캔
  const allCandidates = await scanner();

  if (allCandidates.length === 0) {
    logger.warn(message.empty);
    return null;
  }

  // 2. 그룹별로 정렬
  const sortedCandidates = allCandidates.sort((a, b) => {
    if (a.group && b.group) {
      return a.group.localeCompare(b.group);
    }
    return 0;
  });

  // 3. choices 배열 생성
  const choices = sortedCandidates.map((c) => ({
    title: c.title,
    value: c.value,
  }));

  logger.hint(`총 ${allCandidates.length}개 파일 발견`);

  // 4. autocomplete로 실시간 검색 + 선택
  let isCancelled = false;

  const response = await prompts(
    {
      type: 'autocomplete',
      name: 'selected',
      message: message.prompt,
      choices,
      // 초기에는 빈 리스트, 타이핑하면 필터링 결과 표시
      suggest: (input, _choices) => {
        // 입력이 없으면 placeholder만 표시 (빈 배열 반환)
        if (!input.trim()) {
          return Promise.resolve([
            {
              title: `💡 ${message.placeholder}`,
              value: '__placeholder__',
              disabled: true,
            },
          ]);
        }

        // 실시간 필터링 (filterCandidates 활용)
        const filteredCandidates = filterCandidates(sortedCandidates, input);
        const filtered = filteredCandidates.map((c) => ({
          title: c.title,
          value: c.value,
        }));

        // 결과가 없으면 안내 메시지
        if (filtered.length === 0) {
          return Promise.resolve([
            {
              title: `😢 '${input}'와 일치하는 파일이 없습니다`,
              value: '__no_match__',
              disabled: true,
            },
          ]);
        }

        // 최대 개수 제한
        return Promise.resolve(filtered.slice(0, MAX_SUGGESTIONS));
      },
      /**
       * ESC 키 감지를 위한 onState 콜백
       *
       * NOTE: prompts의 autocomplete에서 ESC는 aborted=true가 아니라 exited=true로 종료됩니다.
       * (aborted는 보통 Ctrl+C / 강제 abort에 가깝습니다)
       */
      onState: (state: { aborted?: boolean; exited?: boolean }) => {
        if (state.aborted || state.exited) {
          isCancelled = true;
        }
      },
    },
    {
      // Ctrl+C 감지
      onCancel: () => {
        isCancelled = true;
      },
    },
  );

  const selected = response.selected;

  // ESC, Ctrl+C, placeholder 선택 처리
  if (isCancelled || !selected || selected === '__placeholder__' || selected === '__no_match__') {
    logger.info('취소되었습니다.');
    return null;
  }

  const result: InteractiveResult = {
    filePath: selected,
  };

  // Gen 명령어면 테스트 타입 추론
  if (command === 'gen') {
    result.testType = inferTestType(selected);
    logger.hint(`테스트 타입 자동 감지: --type ${result.testType}`);
  }

  // Sync 명령어면 동기화 수준 선택
  if (command === 'sync') {
    const syncLevel = await selectSyncLevel();
    if (!syncLevel) {
      return null;
    }
    result.syncLevel = syncLevel;
  }

  return result;
};

/**
 * Sync 명령어에서 동기화 수준 선택
 */
export const selectSyncLevel = async (): Promise<SyncLevel | null> => {
  const choices = [
    {
      title: '테스트만 수정 (권장)',
      description: 'UI/Selector 변경, 내부 리팩토링 등 Minor Change',
      value: 'test-only' as SyncLevel,
    },
    {
      title: '전체 업데이트 (ATDD → Plan → Test)',
      description: '기능 추가/삭제/변경 등 Major Change',
      value: 'full' as SyncLevel,
    },
  ];

  let isCancelled = false;

  const response = await prompts(
    {
      type: 'select',
      name: 'level',
      message: '동기화 수준을 선택하세요',
      choices,
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

  if (isCancelled || !response.level) {
    logger.info('취소되었습니다.');
    return null;
  }

  logger.hint(`동기화 수준: ${response.level === 'test-only' ? '테스트만 수정' : '전체 업데이트'}`);
  return response.level;
};
