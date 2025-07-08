# ESM対応天文計算ライブラリ調査・導入方針（引き継ぎ資料）

## 背景
- 既存の`astronomy-bundle`はCommonJS形式のみでVite/フロントエンド（ESM）環境で利用不可。
- Viteでimportエラーが発生し、設定調整でも解決できなかった。

## 調査結果
- ESM（モダンJS/フロントエンド）対応の天文計算ライブラリを調査。
- 有力候補：
  - **Moshier-Ephemeris-JS**（ES6/ESM対応、太陽・月・水星～冥王星・キロン等の計算可、npm導入可）
  - ephem.js（VSOP87等、ESM対応、やや上級者向け）
- Swiss Ephemeris系（sweph, swisseph等）はNode.js専用でVite/ブラウザ不可。

## 次回作業方針
1. **Moshier-Ephemeris-JS**をnpmで導入し、天体計算ロジックを組み直す
2. 必要に応じてephem.jsも検証
3. 既存の`astronomy-bundle`依存コードを新ライブラリに置換
4. 画面・AI連携も新ロジックで動作確認

### 参考URL
- https://github.com/0xStarcat/Moshier-Ephemeris-JS
- https://github.com/THRASTRO/ephem.js

---

※この方針・調査内容は必ず引き継ぐこと 