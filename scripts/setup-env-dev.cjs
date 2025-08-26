#!/usr/bin/env node

/**
 * Starflect 開発環境専用 環境変数設定スクリプト
 * 検証・開発専用のAPIキー設定（本番とは分離）
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupDevelopmentEnvironment() {
  console.log('🛠️ Starflect 開発環境セットアップ');
  console.log('=====================================');
  console.log('⚠️ 注意: 開発専用のAPIキーを使用してください');
  console.log('📝 本番用とは異なるキーを推奨');
  console.log('');
  
  // 開発用APIキーの入力を求める
  const openaiKey = await new Promise((resolve) => {
    rl.question('開発用 OpenAI APIキーを入力してください: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  // APIキーの検証
  if (!openaiKey.startsWith('sk-')) {
    console.log('❌ 無効なAPIキー形式です（sk-で始まる必要があります）');
    process.exit(1);
  }
  
  const googleMapsKey = await new Promise((resolve) => {
    rl.question('開発用 Google Maps APIキー (オプション): ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  // .env.developmentファイルの内容を構築
  let envContent = `# Starflect 開発環境変数
# 自動生成日時: ${new Date().toISOString()}
# 環境: DEVELOPMENT ONLY

# OpenAI API Configuration (開発用)
VITE_OPENAI_API_KEY=${openaiKey}

# Google Maps API Configuration (開発用)
${googleMapsKey ? `VITE_GOOGLE_MAPS_API_KEY=${googleMapsKey}` : '# VITE_GOOGLE_MAPS_API_KEY=your_development_google_maps_key'}

# Development Configuration
NODE_ENV=development
VITE_APP_VERSION=${require('../package.json').version}
VITE_ENVIRONMENT=development

# セキュリティ設定
VITE_API_RATE_LIMIT=true
VITE_DEBUG_MODE=true
`;

  // .env.developmentファイルを作成
  const envPath = path.join(__dirname, '..', '.env.development');
  const envMainPath = path.join(__dirname, '..', '.env');
  
  try {
    // .env.developmentに保存
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.developmentファイルが正常に作成されました');
    
    // メインの.envにもコピー（ローカル開発用）
    fs.writeFileSync(envMainPath, envContent);
    console.log('✅ .envファイルも作成されました（ローカル開発用）');
    
    // 強化された.gitignore設定
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    const securityIgnores = [
      '# Environment variables (SECURITY CRITICAL)',
      '.env',
      '.env.*',
      '.env.local',
      '.env.development',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      '.env.backup',
      '*.env*',
      '*.key',
      '*.secret',
      'api-keys.txt',
      'config/secrets.json',
      'secrets/',
      '# API Keys (追加保護)',
      '*api*key*',
      '*secret*',
      '*token*'
    ].join('\n');
    
    if (!gitignoreContent.includes('SECURITY CRITICAL')) {
      fs.appendFileSync(gitignorePath, '\n' + securityIgnores + '\n');
      console.log('✅ .gitignoreに強化されたセキュリティ設定を追加しました');
    }
    
    console.log('🎉 開発環境設定完了！');
    console.log('');
    console.log('📋 設定内容:');
    console.log('- 開発専用APIキーを設定');
    console.log('- 本番環境とは分離された設定');
    console.log('- 強化されたGitセキュリティ');
    console.log('');
    console.log('🚀 次のステップ:');
    console.log('1. npm run dev でローカル開発サーバーを起動');
    console.log('2. 本番デプロイ時は別途 Railway Dashboard で本番用APIキーを設定');
    console.log('3. 動作確認を実行');
    console.log('');
    console.log('⚠️ 重要: 本番用APIキーとは必ず分離してください');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('');
    console.log('手動で以下の内容で .env.development ファイルを作成してください:');
    console.log('=====================================');
    console.log(envContent);
  }
  
  rl.close();
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('❌ 未処理エラー:', error);
  process.exit(1);
});

// スクリプト実行
setupDevelopmentEnvironment().catch((error) => {
  console.error('❌ セットアップエラー:', error);
  process.exit(1);
});

