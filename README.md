# Starflect

あなたはどの「ほしキャラ」? 生まれた瞬間の星の配置でわかる、16キャラ×本格星占い。

## セットアップ(ローカル開発)

```bash
npm install

# APIキーを設定(AI鑑定・相談チャットに必要)
cp .env.example .env
# → .env を開いて ANTHROPIC_API_KEY に自分のキーを貼る
#   キー発行: https://platform.claude.com → API Keys
#   .env は .gitignore 済みなので GitHub には上がりません

npm run dev        # 開発サーバー (http://localhost:5173)
npm run build      # 本番ビルド → dist/
npm run typecheck  # 型チェック(フロント + サーバー)
node verify.mjs    # 天体計算の検証テスト
```

> AIを使わない占い(ほしキャラ判定・天体配置・運勢のテンプレ表示)は**キー無しでも動きます**。
> 「AIに詳しく占ってもらう」「ほしキャラ相談室」だけがキーを必要とします。

## 構成

- **フロント**: Vite + React + TypeScript
- **天体計算**: astronomy-engine による完全ローカル計算(生年月日はサーバー送信なし)
- **AI鑑定/相談**: Claude API(`claude-opus-4-8`)をサーバー側プロキシ経由で呼ぶ。APIキーはサーバーだけが持ち、ブラウザには渡さない
  - 開発時: Vite プラグイン([server/aiReading.ts](server/aiReading.ts))
  - 本番: Express サーバー([server/index.ts](server/index.ts))が `dist/` 配信 + API を兼ねる
  - ロジックは [server/handlers.ts](server/handlers.ts) に一元化(dev/prod 共用)

### 主なファイル

- `src/lib/astro.ts` — 黄経・アセンダント・逆行の計算
- `src/lib/planets.ts` — 10天体の意味とキャラ役割
- `src/lib/startypes.ts` — 16ほしキャラの判定と説明文
- `src/lib/compat.ts` — ふたりの相性(エレメント合成)
- `src/lib/fortune.ts` — 期間の運勢(トランジット)
- `src/components/AiChat.tsx` — ほしキャラ相談室(ストリーミングチャット)

## 機能

- **ほしキャラ診断** — 生年月日から16ほしキャラ + 10天体を分析(時刻は任意)
- **ふたりの相性** — ほしキャラ相性 + 今日のふたり
- **AI鑑定** / **ほしキャラ相談室** — 星の配置を全部踏まえた Claude の鑑定・相談

## デプロイ

Railway に GitHub リポジトリを繋ぎ、環境変数 `ANTHROPIC_API_KEY` を設定するだけ。
詳細は [DEPLOY.md](DEPLOY.md)。
