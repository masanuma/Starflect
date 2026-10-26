# Railway へのデプロイ手順

Starflect は「静的フロント(Vite/React)+ AI鑑定API(Express)」を **1つのNodeサービス**として同一オリジンで配信します。Railway 1サービスで完結します。

## 仕組み

```
ブラウザ ──┬─ GET /            → Express が dist/(ビルド済みフロント)を配信
           └─ POST /api/ai-*   → Express が Claude API を呼び、鑑定文を返す
```

- APIキーはサーバー側(環境変数)だけで保持し、ブラウザには一切渡しません。
- 開発時(`npm run dev`)は Vite プラグインが、本番は `server/index.ts` の Express が、**同じ `createAiHandlers`**([server/handlers.ts](server/handlers.ts))を使います。ロジックは一元化されています。

## 事前準備

1. このプロジェクトを GitHub リポジトリに push する(`.env` は `.gitignore` 済みなので commit されません)。
2. [platform.claude.com](https://platform.claude.com) で API キーを発行し、Console の Billing でクレジットを購入しておく。

## Railway での設定

2026-10-26のセキュリティ対応で、ビルダーをDockerfileに変更しました（facd6fd、本番反映済み）。`Dockerfile` のビルド・実行ステージは両方Node.js 24.22.1を使用します。今後のセキュリティ更新では両ステージとpackage.jsonの最低バージョン、scripts/check-node.mjsを更新してください。

デプロイ後はRailwayのビルド成功、起動ログの `Node.js 24.22.1`、公開トップと `/app?lang=ja`、AI応答を確認してください。DockerビルドはRailwayで成功を確認済みです。吹き出し・特別便・多言語修正も同時公開しました。

1. Railway で **New Project → Deploy from GitHub repo** を選び、このリポジトリを指定。
2. **Variables** に環境変数を1つ追加:
   - `ANTHROPIC_API_KEY` = 発行した API キー(`sk-ant-...`)
   - ※ `PORT` は Railway が自動注入するので設定不要。
3. デプロイが始まる。[railway.json](railway.json) の設定により:
   - Build: Dockerfile内で `npm ci` → `npm run build`（実行ステージは本番依存のみ）
   - Start: `npm start`(= `tsx server/index.ts`)
4. 完了後、**Settings → Networking → Generate Domain** で公開URLを発行。

## ローカルで本番構成を確認する

Windowsのこの作業環境では、修正版の専用Nodeを選ぶ `./scripts/local.ps1` で開発サーバーを起動できます。ビルドは `./scripts/local.ps1 -Task build`、本番構成の起動は `./scripts/local.ps1 -Task start`。別のPCではNode.js 24.22.1以上の24系を先に導入してください。`.runtime` のバイナリは共有されません。

```bash
npm run build          # dist/ を生成
# PowerShell:
$env:ANTHROPIC_API_KEY="sk-ant-..."; $env:PORT="3000"; npm start
# → http://localhost:3000 で本番と同じ構成が立ち上がる
```

`npm run dev`(Vite開発サーバー)は従来どおり使えます。

## コスト

- 鑑定1回あたり数円〜10円程度(モデルは `claude-opus-4-8`)。安くしたい場合は [server/handlers.ts](server/handlers.ts) の `model` を `claude-haiku-4-5` に変更(約1/5)。
- Railway の Hobby プランは月$5クレジット込み。常時起動でも小規模なら収まる範囲です。
