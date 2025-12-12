/**
 * interactive Unit Tests
 * Source: src/utils/interactive.ts
 */
import { describe, it, expect } from 'vitest';
import { inferTestType } from './interactive.js';

describe('inferTestType (확장자 기반 테스트 타입 추론)', () => {
  describe('UI 타입 반환 케이스', () => {
    it.each([
      { filePath: 'app/login/page.tsx', desc: '.tsx 파일' },
      { filePath: 'components/Button.jsx', desc: '.jsx 파일' },
      { filePath: 'hooks/useModal.tsx', desc: 'hooks 폴더의 .tsx (렌더링 포함 훅)' },
      { filePath: 'utils/renderIcon.tsx', desc: 'utils 폴더의 .tsx (JSX 반환 유틸)' },
      { filePath: 'src/features/auth/components/LoginForm.tsx', desc: '깊은 경로의 .tsx' },
    ])('$desc → UI 타입을 반환한다', ({ filePath }) => {
      // When
      const result = inferTestType(filePath);

      // Then
      expect(result).toBe('ui');
    });
  });

  describe('Unit 타입 반환 케이스', () => {
    it.each([
      { filePath: 'utils/formatDate.ts', desc: '.ts 파일' },
      { filePath: 'lib/helpers.js', desc: '.js 파일' },
      { filePath: 'hooks/useAuth.ts', desc: 'hooks 폴더의 .ts (로직만 있는 훅)' },
      { filePath: 'app/api/route.ts', desc: 'app 폴더의 .ts (API 라우트)' },
      { filePath: 'src/features/auth/utils/validate.ts', desc: '깊은 경로의 .ts' },
    ])('$desc → Unit 타입을 반환한다', ({ filePath }) => {
      // When
      const result = inferTestType(filePath);

      // Then
      expect(result).toBe('unit');
    });
  });

  describe('경계값 테스트', () => {
    it.each([
      { filePath: 'Button.TSX', expected: 'unit', desc: '대문자 확장자 (정규식 미매칭)' },
      { filePath: 'file.tsx.bak', expected: 'unit', desc: '.tsx가 중간에 있는 경우' },
      { filePath: 'tsxfile.ts', expected: 'unit', desc: 'tsx가 파일명에 포함된 .ts' },
      { filePath: '.tsx', expected: 'ui', desc: '확장자만 있는 파일' },
    ])('$desc ($filePath) → $expected 타입을 반환한다', ({ filePath, expected }) => {
      // When
      const result = inferTestType(filePath);

      // Then
      expect(result).toBe(expected);
    });
  });
});
