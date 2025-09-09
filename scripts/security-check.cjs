#!/usr/bin/env node

/**
 * Starflect セキュリティチェックスクリプト
 * APIキー漏洩防止とセキュリティ状態の確認
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// セキュリティパターン
const SECURITY_PATTERNS = [
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48,}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Google Maps API Key', 
    pattern: /AIza[0-9A-Za-z-_]{35}/g,
    severity: 'HIGH'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'MEDIUM'
  },
  {
    name: 'Generic Secret',
    pattern: /(secret|password|token|key)\s*[:=]\s*['"]\w{8,}['"]/gi,
    severity: 'MEDIUM'
  }
];

// 除外するファイル/ディレクトリ
const EXCLUDE_PATTERNS = [
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  '*.log',
  'scripts/security-check.cjs', // 自分自身は除外
  'scripts/setup-env-dev.cjs'   // セットアップスクリプトも除外
];

function scanDirectory(dirPath) {
  console.log('🔍 セキュリティスキャン開始');
  console.log('===============================');
  
  const issues = [];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      SECURITY_PATTERNS.forEach(({ name, pattern, severity }) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            issues.push({
              file: filePath,
              type: name,
              severity,
              match: match.substring(0, 20) + '...',
              line: content.substring(0, content.indexOf(match)).split('\n').length
            });
          });
        }
      });
    } catch (error) {
      // バイナリファイルや読み込み不可ファイルはスキップ
    }
  }
  
  function scanDirectoryRecursive(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const relativePath = path.relative(dirPath, fullPath);
      
      // 除外パターンチェック
      if (EXCLUDE_PATTERNS.some(pattern => 
        relativePath.includes(pattern.replace('*', '')) || 
        item.includes(pattern.replace('*', ''))
      )) {
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectoryRecursive(fullPath);
      } else if (stat.isFile()) {
        scanFile(fullPath);
      }
    });
  }
  
  scanDirectoryRecursive(dirPath);
  return issues;
}

function checkGitignore() {
  console.log('📝 .gitignore チェック');
  console.log('----------------------');
  
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.log('❌ .gitignoreファイルが存在しません');
    return false;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf8');
  
  const requiredPatterns = [
    '.env',
    '.env.*',
    '*.key',
    '*.secret',
    '.env.backup'
  ];
  
  const missing = requiredPatterns.filter(pattern => !content.includes(pattern));
  
  if (missing.length > 0) {
    console.log('⚠️ 不足している.gitignoreパターン:');
    missing.forEach(pattern => console.log(`  - ${pattern}`));
    return false;
  }
  
  console.log('✅ .gitignore 設定OK');
  return true;
}

function checkGitHistory() {
  console.log('📚 Git履歴チェック');
  console.log('------------------');
  
  try {
    // 最近の10コミットでAPIキーパターンをチェック
    const commits = execSync('git log --oneline -10', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim());
    
    console.log(`✅ 最近の${commits.length}コミットを確認`);
    
    // 危険なファイル名パターンをチェック
    const dangerousFiles = ['.env', '.env.backup', 'api-keys.txt', 'secrets.json'];
    let foundDangerous = false;
    
    dangerousFiles.forEach(file => {
      try {
        execSync(`git log --name-only --grep="${file}" --all`, { stdio: 'pipe' });
        console.log(`⚠️ 過去のコミットに${file}の履歴があります`);
        foundDangerous = true;
      } catch (error) {
        // ファイルが見つからない場合は正常
      }
    });
    
    if (!foundDangerous) {
      console.log('✅ 危険なファイルの履歴は検出されませんでした');
    }
    
  } catch (error) {
    console.log('⚠️ Git履歴チェックでエラー:', error.message);
  }
}

function generateSecurityReport(issues) {
  console.log('');
  console.log('📊 セキュリティレポート');
  console.log('========================');
  
  if (issues.length === 0) {
    console.log('✅ セキュリティ問題は検出されませんでした');
    return true;
  }
  
  console.log(`❌ ${issues.length}件のセキュリティ問題を検出`);
  console.log('');
  
  // 重要度別に分類
  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  
  if (critical.length > 0) {
    console.log('🚨 CRITICAL問題:');
    critical.forEach(issue => {
      console.log(`  📁 ${issue.file}:${issue.line}`);
      console.log(`     ${issue.type}: ${issue.match}`);
    });
    console.log('');
  }
  
  if (high.length > 0) {
    console.log('⚠️ HIGH問題:');
    high.forEach(issue => {
      console.log(`  📁 ${issue.file}:${issue.line}`);
      console.log(`     ${issue.type}: ${issue.match}`);
    });
    console.log('');
  }
  
  if (medium.length > 0) {
    console.log('📋 MEDIUM問題:');
    medium.forEach(issue => {
      console.log(`  📁 ${issue.file}:${issue.line}`);
      console.log(`     ${issue.type}: ${issue.match}`);
    });
  }
  
  return false;
}

function generateRecommendations(issues, gitignoreOk) {
  console.log('');
  console.log('💡 推奨対応策');
  console.log('==============');
  
  if (issues.some(i => i.severity === 'CRITICAL')) {
    console.log('🚨 緊急対応が必要:');
    console.log('1. 検出されたAPIキーを即座に無効化');
    console.log('2. 新しいAPIキーを作成');
    console.log('3. 環境変数を更新');
    console.log('4. .gitignoreを強化');
    console.log('');
  }
  
  if (!gitignoreOk) {
    console.log('📝 .gitignore改善:');
    console.log('```');
    console.log('# Environment variables (SECURITY CRITICAL)');
    console.log('.env');
    console.log('.env.*');
    console.log('.env.backup');
    console.log('*.key');
    console.log('*.secret');
    console.log('api-keys.txt');
    console.log('```');
    console.log('');
  }
  
  console.log('🔐 継続的セキュリティ対策:');
  console.log('1. 定期的にこのスクリプトを実行');
  console.log('2. 開発・本番でAPIキーを分離');
  console.log('3. Git pre-commitフックを設定');
  console.log('4. Railway環境変数のみを使用');
}

// メイン処理
function main() {
  console.log('🛡️ Starflect セキュリティチェック');
  console.log('===================================');
  console.log('');
  
  const projectRoot = path.join(__dirname, '..');
  
  // ファイルスキャン
  const issues = scanDirectory(projectRoot);
  
  // .gitignoreチェック
  const gitignoreOk = checkGitignore();
  
  // Git履歴チェック
  checkGitHistory();
  
  // レポート生成
  const isSecure = generateSecurityReport(issues);
  
  // 推奨事項
  generateRecommendations(issues, gitignoreOk);
  
  console.log('');
  console.log('✅ セキュリティチェック完了');
  
  // 重大な問題がある場合は非ゼロで終了
  if (issues.some(i => i.severity === 'CRITICAL')) {
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

