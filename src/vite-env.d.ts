/// <reference types="vite/client" />

interface ImportMetaEnv {
  // OpenAI APIキーはサーバーサイドプロキシで管理するため削除
  // readonly VITE_OPENAI_API_KEY: string  // セキュリティ上削除
  // 他の環境変数もここに追加
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 