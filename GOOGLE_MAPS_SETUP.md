# Google Maps API 設定ガイド

## 概要

Starflectアプリでは、出生地の正確な位置（緯度・経度）を取得するためにGoogle Maps APIを使用しています。この機能により、ユーザーは以下のことができます：

- 🏥 **病院検索**: 生まれた病院を検索して正確な出生地を指定
- 🗺️ **地図表示**: インタラクティブな地図で位置を確認・調整
- 📍 **住所検索**: 住所や地名から自動的に座標を取得
- 🎯 **精密な計算**: 正確な座標による高精度な占星術計算

## Google Maps API キーの取得手順

### 1. Google Cloud Consoleにアクセス
[Google Cloud Console](https://console.cloud.google.com/) にアクセスしてログインします。

### 2. プロジェクトの作成または選択
- 新しいプロジェクトを作成するか、既存のプロジェクトを選択します
- プロジェクト名は「Starflect」などわかりやすい名前にしてください

### 3. Google Maps Platform APIの有効化
以下のAPIを有効にしてください：
- **Maps JavaScript API**: 地図表示用
- **Places API**: 場所検索・詳細情報取得用
- **Geocoding API**: 住所⇔座標変換用

### 4. APIキーの作成
1. 「認証情報」ページに移動
2. 「認証情報を作成」→「APIキー」を選択
3. 作成されたAPIキーをコピー

### 5. APIキーの制限設定（推奨）
セキュリティのため、以下の制限を設定することを推奨します：

#### アプリケーションの制限
- **HTTPリファラー（ウェブサイト）**を選択
- 許可するリファラーを追加：
  - `http://localhost:*/*` （開発環境用）
  - `https://yourdomain.com/*` （本番環境用）

#### API の制限
- 「キーを制限」を選択
- 以下のAPIを選択：
  - Maps JavaScript API
  - Places API
  - Geocoding API

## アプリケーションへの設定

### 方法1: 環境変数を使用（推奨）
1. プロジェクトルートに `.env` ファイルを作成
2. 以下の内容を追加：
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

3. `src/components/LocationPicker.tsx` を更新：
```typescript
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
```

### 方法2: 直接設定
`src/components/LocationPicker.tsx` の以下の行を更新：
```typescript
const GOOGLE_MAPS_API_KEY = 'your_actual_api_key_here';
```

⚠️ **注意**: 直接設定する場合は、APIキーがソースコードに含まれるため、公開リポジトリにコミットしないよう注意してください。

## 使用料金について

Google Maps Platformは従量課金制ですが、以下の無料枠があります：

### 月間無料使用量
- **Maps JavaScript API**: 28,000回のマップロード
- **Places API**: 検索・詳細情報取得それぞれ月間無料枠あり
- **Geocoding API**: 40,000回のリクエスト

### 個人使用での想定コスト
Starflectを個人で使用する場合、通常は無料枠内で収まります：
- 1日数回の占星術計算 = 月間100回程度のAPI使用
- 無料枠の1%未満の使用量

## トラブルシューティング

### よくある問題と解決方法

#### 1. 地図が表示されない
- APIキーが正しく設定されているか確認
- Maps JavaScript APIが有効になっているか確認
- ブラウザの開発者ツールでエラーメッセージを確認

#### 2. 検索候補が表示されない
- Places APIが有効になっているか確認
- APIキーの制限設定を確認
- ネットワーク接続を確認

#### 3. 「For development purposes only」の透かし
- 請求先アカウントが設定されていない場合に表示されます
- Google Cloud Consoleで請求先アカウントを設定してください（無料枠内なら課金されません）

## セキュリティのベストプラクティス

1. **APIキーの制限**: 必ずリファラー制限とAPI制限を設定
2. **環境変数の使用**: APIキーをソースコードに直接書かない
3. **定期的な監視**: Google Cloud Consoleで使用量を定期的に確認
4. **不要な権限の削除**: 使用しないAPIへのアクセス権限は削除

## サポート

Google Maps APIの設定で問題が発生した場合：
1. [Google Maps Platform ドキュメント](https://developers.google.com/maps/documentation)を参照
2. [Google Cloud Console](https://console.cloud.google.com/)で使用量とエラーログを確認
3. APIキーの制限設定を見直し

---

**注意**: Google Maps APIキーは機密情報です。他人と共有したり、公開リポジトリにコミットしたりしないよう十分注意してください。 