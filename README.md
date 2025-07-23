# 🌟 Starflect - AI占星術アプリ

生まれた瞬間の星の配置から、もっと詳しいあなたを発見する本格占星術アプリです。

## 🚀 新しい自動化ワークフロー

**APIキーエラーとデプロイ問題を根本解決！**

### ⚡ 簡単セットアップ（初回のみ）

```bash
# 1. 環境変数の自動セットアップ
npm run setup

# 2. 開発サーバー起動
npm run dev

# 3. 本番デプロイ（安全・自動）
npm run deploy
```

## 🔧 主要コマンド

| コマンド | 説明 | 用途 |
|----------|------|------|
| `npm run setup` | APIキー設定 | 初回セットアップ |
| `npm run dev` | 開発サーバー | ローカル開発 |
| `npm run deploy` | 安全デプロイ | 本番反映 |
| `npm run build` | ビルド確認 | エラーチェック |

## 🛡️ セキュリティ機能

- ✅ **自動APIキー保護**: `.env`ファイルが絶対にコミットされない
- ✅ **デプロイ前チェック**: ビルドエラーを事前検出
- ✅ **安全なGitプッシュ**: 秘密情報の漏洩を防止

## 🏗️ アーキテクチャ

### 技術スタック
- **フロントエンド**: React + TypeScript + Vite
- **API**: OpenAI GPT-4o-mini, Google Maps API
- **デプロイ**: Railway (自動デプロイ)
- **天体計算**: 自社開発エンジン

### 主要機能
- **3モード占い**: 簡単占い・詳しい占い・AIチャット
- **段階的結果**: Level 1→2→3の段階的情報開示
- **PWA対応**: ワンクリックアプリインストール
- **完全レスポンシブ**: モバイル・デスクトップ対応

## 📝 開発ワークフロー

### 新しい開発フロー（推奨）

```bash
# 1. 初期セットアップ（初回のみ）
git clone <リポジトリURL>
cd Starflect
npm install
npm run setup  # 👈 APIキーを安全に設定

# 2. 日常開発
npm run dev    # 開発サーバー起動
# コーディング...
npm run deploy # 👈 安全にデプロイ

# 完了！
```

### 従来の問題（解決済み）
- ❌ APIキーの手動設定でミス
- ❌ デプロイ時のAPIキー露出
- ❌ 複雑なRailway環境変数設定
- ❌ 手動コミット・プッシュでのエラー

## 🚨 緊急時の対応

### APIキーが無効化された場合

```bash
# 新しいAPIキーで即座復旧
npm run setup  # 新しいAPIキーを設定
npm run deploy # 本番環境に反映
```

### ビルドエラーが発生した場合

```bash
# エラー詳細確認
npm run build

# Lint問題をチェック
npm run lint

# 問題修正後にデプロイ
npm run deploy
```

## 🌐 本番環境

- **URL**: https://starflect-production.up.railway.app
- **自動デプロイ**: GitHub→Railway連携
- **モニタリング**: Railway Dashboard

## 📊 プロジェクト状況

- **技術的完成度**: 98%完成
- **全機能**: 正常動作確認済み
- **PWA**: 実装完了
- **セキュリティ**: 強化済み

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### Q: `npm run setup`でエラーが出る
```bash
# Node.jsのバージョン確認
node --version  # v18以上必要

# 権限エラーの場合
npm cache clean --force
npm install
```

#### Q: デプロイでエラーが発生
```bash
# ビルドテストを先に実行
npm run build

# エラー詳細を確認
npm run deploy:check
```

#### Q: Railway環境変数が反映されない
```bash
# ローカルで動作確認後
npm run setup  # APIキー再設定
npm run deploy # 再デプロイ
```

## 🎯 今後の予定

- **多言語対応** (英語・中国語)
- **アプリストア配信**
- **プッシュ通知機能**

---

## 💡 開発者向け情報

### ディレクトリ構造
```
Starflect/
├── src/                    # メインソースコード
│   ├── components/        # Reactコンポーネント
│   ├── utils/            # ユーティリティ関数
│   └── types/            # TypeScript型定義
├── scripts/              # 👈 NEW: 自動化スクリプト
│   ├── setup-env.js     # 環境変数設定
│   └── deploy.js        # 安全デプロイ
├── public/               # 静的ファイル
└── Docs/                 # プロジェクトドキュメント
```

### 重要ファイル
- `src/utils/aiAnalyzer.ts` - AI分析エンジン
- `src/components/StepByStepResult.tsx` - メイン占い機能
- `scripts/setup-env.js` - 👈 NEW: APIキー自動設定
- `scripts/deploy.js` - 👈 NEW: 安全デプロイ

---

**🎉 新しい自動化ワークフローで、快適な開発体験をお楽しみください！**

**問題が発生した場合は、まず `npm run setup` から試してください。** 