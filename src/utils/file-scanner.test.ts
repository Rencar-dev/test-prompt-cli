/**
 * file-scanner Unit Tests
 * Source: src/utils/file-scanner.ts
 */
import { describe, it, expect } from 'vitest';
import { filterCandidates, FileCandidate } from './file-scanner.js';

describe('filterCandidates', () => {
  // Given: 테스트용 파일 후보 목록
  const mockCandidates: FileCandidate[] = [
    { title: '/login  (app/login/page.tsx)', value: 'app/login/page.tsx', group: 'UI' },
    { title: 'useAuth.ts  (hooks/useAuth.ts)', value: 'hooks/useAuth.ts', group: 'Unit' },
    { title: 'Button.tsx  (components/Button.tsx)', value: 'components/Button.tsx', group: 'UI' },
    { title: 'formatDate.ts  (utils/formatDate.ts)', value: 'utils/formatDate.ts', group: 'Unit' },
  ];

  describe('빈 키워드 처리 (Edge Cases)', () => {
    it.each([
      { keyword: '', desc: '빈 문자열' },
      { keyword: '   ', desc: '공백만 있는 문자열' },
      { keyword: '\t\n', desc: '탭/개행 문자' },
    ])('$desc 입력 시 전체 목록을 반환한다', ({ keyword }) => {
      // When
      const result = filterCandidates(mockCandidates, keyword);

      // Then
      expect(result).toHaveLength(4);
    });
  });

  describe('키워드 필터링', () => {
    it.each([
      { keyword: 'login', expectedValue: 'app/login/page.tsx', matchBy: 'title' },
      { keyword: 'hooks', expectedValue: 'hooks/useAuth.ts', matchBy: 'value(경로)' },
      { keyword: 'BUTTON', expectedValue: 'components/Button.tsx', matchBy: '대소문자 무시' },
      { keyword: 'format', expectedValue: 'utils/formatDate.ts', matchBy: '부분 매칭' },
    ])('$matchBy로 "$keyword" 검색 시 해당 파일을 반환한다', ({ keyword, expectedValue }) => {
      // When
      const result = filterCandidates(mockCandidates, keyword);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(expectedValue);
    });

    it('여러 파일이 매칭되면 모두 반환한다', () => {
      // Given: .ts 확장자는 모든 파일에 포함됨

      // When
      const result = filterCandidates(mockCandidates, '.ts');

      // Then
      expect(result).toHaveLength(4);
    });

    it('매칭되는 파일이 없으면 빈 배열을 반환한다', () => {
      // When
      const result = filterCandidates(mockCandidates, 'nonexistent');

      // Then
      expect(result).toHaveLength(0);
    });
  });

  describe('경계값 테스트', () => {
    it('빈 후보 목록에서 검색하면 빈 배열을 반환한다', () => {
      // Given
      const emptyCandidates: FileCandidate[] = [];

      // When
      const result = filterCandidates(emptyCandidates, 'test');

      // Then
      expect(result).toHaveLength(0);
    });

    it('특수문자가 포함된 키워드로 검색할 수 있다', () => {
      // Given
      const candidatesWithSpecialChars: FileCandidate[] = [
        { title: '[Button]  (components/[Button].tsx)', value: 'components/[Button].tsx', group: 'UI' },
      ];

      // When
      const result = filterCandidates(candidatesWithSpecialChars, '[Button]');

      // Then
      expect(result).toHaveLength(1);
    });
  });
});
