// Railway対応の緊急修正: 一時的に直接API呼び出し
// APIのベースURLを取得（開発環境では3000ポート、本番では相対パス）
export const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  return '';
};

export const getOpenAIApiKey = (): string | null => {
  // Railway環境変数から取得（vite.config.tsのdefineで埋め込まれる）
  return import.meta.env.OPENAI_API_KEY || null;
};

export const getGeminiApiKey = (): string | null => {
  return import.meta.env.GEMINI_API_KEY || null;
};

export const isApiKeyAvailable = (): boolean => {
  return !!getOpenAIApiKey() || !!getGeminiApiKey();
};

export const isGeminiAvailable = (): boolean => {
  return !!getGeminiApiKey();
};

// デバッグ用ログ
export const debugEnvConfig = () => {
  console.log('🔧 Railway API Configuration:', {
    isDev: import.meta.env.DEV,
    hasOpenAIKey: !!getOpenAIApiKey(),
    hasGeminiKey: !!getGeminiApiKey(),
    openAIKeyLength: getOpenAIApiKey()?.length || 0,
    geminiKeyLength: getGeminiApiKey()?.length || 0,
    note: 'Railway環境変数から取得'
  });
};
