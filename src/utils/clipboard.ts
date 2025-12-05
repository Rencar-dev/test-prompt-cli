import clipboardy from 'clipboardy';

/**
 * 클립보드에 텍스트를 복사합니다.
 * @param text - 클립보드에 복사할 텍스트
 * @throws 클립보드 복사 실패 시 에러 발생
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await clipboardy.write(text);
  } catch (error) {
    throw new Error(`클립보드 복사에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
};

