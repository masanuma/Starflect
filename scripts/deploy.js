#!/usr/bin/env node

/**
 * Starflect 自動デプロイスクリプト
 * APIキー露出を防いだ安全なデプロイ
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starflect 安全デプロイ開始');
console.log('===============================');

// 環境チェック
function checkEnvironment() {
  console.log('🔍 環境チェック中...');
  
  // .envファイルの存在確認
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .envファイルが見つかりません');
    console.log('📝 npm run setup でAPIキーを設定してください');
    process.exit(1);
  }
  
  // .gitignoreチェック
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  if (!gitignoreContent.includes('.env')) {
    console.log('⚠️ .gitignoreに.envが含まれていません');
    fs.appendFileSync(gitignorePath, '\n# Environment variables (SECURITY)\n.env\n.env.*\n*.key\n*.secret\n');
    console.log('✅ .gitignoreに安全設定を追加しました');
  }
  
  console.log('✅ 環境チェック完了');
}

// ビルドテスト
function buildTest() {
  console.log('🔨 ビルドテスト実行中...');
  
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ ビルド成功');
  } catch (error) {
    console.log('❌ ビルド失敗:');
    console.log(error.stdout?.toString() || error.message);
    process.exit(1);
  }
}

// Git状態確認
function checkGitStatus() {
  console.log('📊 Git状態確認中...');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim()) {
      console.log('📝 未コミットの変更があります:');
      console.log(status);
      
      // .envファイルがstageされていないか確認
      if (status.includes('.env')) {
        console.log('⚠️ .envファイルを除外してコミットします');
        execSync('git reset HEAD .env', { stdio: 'inherit' });
      }
    }
    
    console.log('✅ Git状態確認完了');
  } catch (error) {
    console.log('⚠️ Git状態確認でエラー:', error.message);
  }
}

// 安全なコミット&プッシュ
function safeDeploy() {
  console.log('🚀 安全デプロイ実行中...');
  
  try {
    // 現在の変更をコミット（.envは除外）
    execSync('git add .', { stdio: 'inherit' });
    execSync('git reset HEAD .env .env.*', { stdio: 'pipe' }); // .envを明示的に除外
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const commitMessage = `🚀 自動デプロイ: ${timestamp}`;
    
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ デプロイ完了');
    console.log('');
    console.log('🎯 次のステップ:');
    console.log('1. Railway Dashboard で環境変数を確認');
    console.log('2. 本番環境での動作確認');
    console.log('3. https://starflect-production.up.railway.app でテスト');
    
  } catch (error) {
    console.log('❌ デプロイエラー:', error.message);
    
    if (error.message.includes('nothing to commit')) {
      console.log('✅ コミットする変更がありません - すでに最新状態です');
    } else {
      process.exit(1);
    }
  }
}

// メイン処理
async function main() {
  try {
    checkEnvironment();
    buildTest();
    checkGitStatus();
    safeDeploy();
    
    console.log('');
    console.log('🎉 デプロイプロセス完了！');
    console.log('📊 Railway Dashboard でデプロイ状況を確認してください');
    
  } catch (error) {
    console.error('❌ デプロイプロセスでエラー:', error.message);
    process.exit(1);
  }
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('❌ 未処理エラー:', error);
  process.exit(1);
});

// スクリプト実行
main(); 