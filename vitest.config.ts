import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // dist 폴더 제외 (빌드 결과물이므로 테스트 파일 포함 불필요)
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    // src 폴더만 포함
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});

