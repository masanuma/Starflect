// Railway対応の緊急修正: 一時的に直接API呼び出し
export const getOpenAIApiKey = (): string | null => {
  // Railway環境変数から取得（ビルド時に埋め込まれる）
  return import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || null;
};

export const isApiKeyAvailable = (): boolean => {
  return !!getOpenAIApiKey();
};

// デバッグ用ログ
export const debugEnvConfig = () => {
  console.log('🔧 Railway API Configuration:', {
    isDev: import.meta.env.DEV,
    hasApiKey: isApiKeyAvailable(),
    keyLength: getOpenAIApiKey()?.length || 0,
    note: 'Railway環境変数から取得'
  });
};
