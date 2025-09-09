#!/usr/bin/env node

/**
 * Starflect 環境変数自動設定スクリプト
 * APIキーの安全な設定と管理を自動化
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupEnvironment() {
  console.log('🚀 Starflect 環境変数セットアップ');
  console.log('=====================================');
  
  // APIキーの入力を求める
  const openaiKey = await new Promise((resolve) => {
    rl.question('OpenAI APIキーを入力してください: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  const googleMapsKey = await new Promise((resolve) => {
    rl.question('Google Maps APIキー (オプション): ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  // .envファイルの内容を構築
  let envContent = `# Starflect Environment Variables
# 自動生成日時: ${new Date().toISOString()}

# OpenAI API Configuration (Server-side only, secure)
OPENAI_API_KEY=${openaiKey}

# Google Maps API Configuration
${googleMapsKey ? `VITE_GOOGLE_MAPS_API_KEY=${googleMapsKey}` : '# VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key'}

# Development Configuration
NODE_ENV=development
VITE_APP_VERSION=${require('../package.json').version}
`;

  // .envファイルを作成
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .envファイルが正常に作成されました');
    
    // .gitignoreに.envが含まれているか確認
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    if (!gitignoreContent.includes('.env')) {
      fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n.env.*\n');
      console.log('✅ .gitignoreに.envを追加しました');
    }
    
    console.log('🎉 環境変数設定完了！');
    console.log('');
    console.log('次のステップ:');
    console.log('1. npm run dev でローカル開発サーバーを起動');
    console.log('2. Railway Dashboard で同じAPIキーを設定');
    console.log('3. 動作確認を実行');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('');
    console.log('手動で以下の内容で .env ファイルを作成してください:');
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
setupEnvironment().catch((error) => {
  console.error('❌ セットアップエラー:', error);
  process.exit(1);
}); 