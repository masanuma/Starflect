// セキュアなAPIプロキシエンドポイント設定
export const getOpenAIProxyUrl = (): string => {
  // 本番環境ではNetlify Functionsを使用
  if (import.meta.env.PROD) {
    return '/.netlify/functions/openai-proxy';
  }
  
  // 開発環境では開発サーバーのプロキシを使用
  return '/api/openai-proxy';
};

// セキュリティ確認: APIキーは使用しない
export const isSecureMode = (): boolean => {
  return true; // 常にセキュアモード（APIキーはサーバーサイドのみ）
};

// デバッグ用ログ
export const debugEnvConfig = () => {
  console.log('🔒 Secure API Proxy Mode:', {
    isDev: import.meta.env.DEV,
    proxyUrl: getOpenAIProxyUrl(),
    secureMode: isSecureMode(),
    note: 'APIキーはサーバーサイドでのみ管理'
  });
};
