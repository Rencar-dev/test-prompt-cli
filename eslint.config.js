import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 1. 기본 무시 설정 (dist 폴더 검사 제외)
  { ignores: ['dist/**'] },

  // 2. JS 및 TS 추천 규칙 적용
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. 커스텀 규칙 (CLI 도구 특성에 맞게 조정)
  {
    rules: {
      // CLI 도구에서는 console.log나 console.error를 써야 하므로 경고 끄기
      'no-console': 'off',
      
      // any 타입 사용은 경고하지만 에러까진 아님 (유연성)
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 사용하지 않는 변수는 에러 (버그 원인)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' } // _로 시작하는 변수는 무시
      ]
    },
  },

  // 4. Prettier와 충돌하는 ESLint 규칙 끄기 (맨 마지막에 위치해야 함)
  prettierConfig,
);