# Starflect

生まれた瞬間の星の配置から読み解く、あなただけの詳しい星座占い。

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー (http://localhost:5173)
npm run build    # 型チェック + 本番ビルド → dist/
node verify.mjs  # 天体計算の検証テスト
```

## 構成

- **スタック**: Vite + React + TypeScript(フロントのみ・DB不要)
- **天体計算**: astronomy-engine による完全ローカル計算(個人情報はサーバー送信なし)
- `src/lib/astro.ts` — 黄経・アセンダント計算
- `src/lib/signs.ts` — 12星座の解説テキスト(太陽/月/ASC別)
- `src/lib/places.ts` — 都道府県の座標

## 実装済み

- お手軽モード(生年月日 → 太陽星座)
- 詳しいモード(時刻・場所 → 太陽・月・上昇星座)
- 入力の自動保存(localStorage)

## 今後(第2段)

- プロ級モード(全10天体 + アスペクト)
- AI占い師チャット(サーバレス関数を1本追加)
- PWA対応・相性診断

デプロイは Vercel / Cloudflare Pages / Netlify にリポジトリを繋ぐだけです。
