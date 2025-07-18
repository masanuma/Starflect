# Starflect 技術アーキテクチャ

## プロジェクト構造

```
Starflect/
├── Docs/                           # プロジェクトドキュメント
│   ├── project-specification.md    # プロジェクト仕様書
│   ├── development-phases.md       # 開発段階と進捗
│   ├── development-progress.md     # 開発進捗メモ
│   ├── esm-astro-library-migration.md # ESM対応ライブラリ調査
│   └── technical-architecture.md   # 技術アーキテクチャ
├── src/
│   ├── components/                 # Reactコンポーネント
│   │   ├── InputForm.tsx          # 入力フォーム
│   │   ├── ResultDisplay.tsx      # 結果表示
│   │   ├── HoroscopeChart.tsx     # ホロスコープチャート
│   │   ├── AIChat.tsx             # AI占い師チャット
│   │   ├── FuturePrediction.tsx   # 未来予測
│   │   └── LocationPicker.tsx     # 場所選択
│   ├── types/
│   │   ├── index.ts               # TypeScript型定義
│   │   └── google-maps.d.ts       # Google Maps型定義
│   ├── utils/
│   │   ├── astronomyCalculator.ts # 独自天体計算エンジン
│   │   ├── aiAnalyzer.ts          # AI分析エンジン
│   │   ├── aspectCalculator.ts    # アスペクト計算
│   │   ├── planetAnalyzer.ts      # 天体分析
│   │   └── __tests__/             # テストファイル
│   ├── App.tsx                    # メインアプリケーション
│   ├── App.css                    # スタイルシート
│   ├── main.tsx                   # エントリーポイント
│   └── index.css                  # グローバルスタイル
├── index.html                     # HTMLテンプレート
├── package.json                   # 依存関係とスクリプト
├── package-lock.json             # 依存関係のロック
├── tsconfig.json                 # TypeScript設定
├── tsconfig.node.json            # Node.js用TypeScript設定
├── vite.config.ts                # Vite設定
└── jest.config.cjs               # Jest設定
```

## アーキテクチャ概要

### フロントエンド アーキテクチャ
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │   Calculation   │    │   Display       │
│   (InputForm)   │───▶│   Engine        │───▶│   (ResultDisplay│
│                 │    │   (独自実装)     │    │                 │
│   - 生年月日    │    │                 │    │   - 太陽星座    │
│   - 出生時刻    │    │   - 10天体計算  │    │   - 天体配置    │
│   - 出生地      │    │   - ハウス計算  │    │   - ハウス配置  │
└─────────────────┘    │   - 逆行判定    │    └─────────────────┘
                       │   - アスペクト  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  LocalStorage   │
                       │   Data Store    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AI Analysis   │
                       │   (OpenAI API)  │
                       └─────────────────┘
```

## 技術スタック詳細

### フロントエンド
- **React 18**: コンポーネントベースUI
- **TypeScript**: 型安全性とコード品質
- **Vite**: 高速ビルドツール
- **React Router**: SPA ルーティング
- **CSS3**: カスタムスタイリング（ガラスモルフィズム）

### 天体計算エンジン（独自実装）
- **数学的計算**: 天文学的精度（小数点以下1度まで）
- **対応天体**: 太陽、月、水星、金星、火星、木星、土星、天王星、海王星、冥王星
- **計算方式**:
  - 太陽: 平均黄経 + 中心差計算
  - 月: 平均黄経 + 主要項の中心差
  - 惑星: ケプラー方程式による軌道計算
  - 逆行判定: 1日後の位置比較
  - ハウス: 等分ハウスシステム

### AI分析システム
- **OpenAI API**: GPT-4/3.5-turbo連携
- **分析機能**:
  - 性格分析（personalityInsights）
  - 詳細運勢（detailedFortune）
  - 天体個別分析（planetAnalysis）
  - 未来予測（期間別予測）
  - 占い師チャット

### データ管理
- **LocalStorage**: クライアントサイドデータ永続化
- **JSON**: データシリアライゼーション
- **型安全**: TypeScriptインターフェース

## コンポーネント設計

### InputForm.tsx
```typescript
// 主要機能
- 入力フォームの管理
- バリデーション
- 自動保存・復元
- エラーハンドリング
- Google Maps連携

// 状態管理
const [formData, setFormData] = useState<FormData>()
const [errors, setErrors] = useState<ValidationErrors>()
const [isLoading, setIsLoading] = useState<boolean>()

// 主要メソッド
- validateForm(): boolean
- handleSubmit(): void
- handleInputChange(): void
- handleClearForm(): void
```

### ResultDisplay.tsx
```typescript
// 主要機能
- ホロスコープデータ表示
- AI分析結果表示
- 天体配置表示
- ハウス配置表示
- 未来予測表示

// 状態管理
const [birthData, setBirthData] = useState<BirthData>()
const [horoscopeData, setHoroscopeData] = useState<HoroscopeData>()
const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult>()
const [loading, setLoading] = useState<boolean>()
const [error, setError] = useState<string>()

// 主要メソッド
- generateCompleteHoroscope(): Promise<void>
- generateAIAnalysis(): Promise<void>
- handleTestEngine(): Promise<void>
```

### HoroscopeChart.tsx
```typescript
// 主要機能
- SVGベースの円形ホロスコープチャート
- 天体配置の視覚化
- アスペクトライン表示
- 12星座の色分け表示
- レスポンシブ対応

// プロパティ
interface HoroscopeChartProps {
  horoscopeData: HoroscopeData;
  size?: number;
  showAspects?: boolean;
}
```

### AIChat.tsx
```typescript
// 主要機能
- AI占い師チャット
- カテゴリ別質問
- チャット履歴管理
- ローカルストレージ保存

// 状態管理
const [messages, setMessages] = useState<ChatMessage[]>()
const [isLoading, setIsLoading] = useState<boolean>()
const [selectedCategory, setSelectedCategory] = useState<string>()
```

## 天体計算エンジン

### astronomyCalculator.ts
```typescript
// 主要関数
export async function generateCompleteHoroscope(birthData: BirthData): Promise<HoroscopeData>
export async function calculateAllPlanets(birthData: BirthData): Promise<PlanetPosition[]>

// 計算プロセス
1. ユリウス日計算
2. 各天体の黄経計算
3. 星座変換
4. 逆行判定
5. ハウス計算
6. 結果統合
```

### 計算精度
- **時刻精度**: 分単位
- **位置精度**: 度数小数点以下1桁
- **逆行判定**: 1日後との位置比較
- **ハウス**: 等分ハウスシステム

## AI分析エンジン

### aiAnalyzer.ts
```typescript
// 主要関数
export const generateAIAnalysis = async (birthData: BirthData, planets: PlanetPosition[]): Promise<AIAnalysisResult>
export const generateFuturePrediction = async (birthData: BirthData, period: string): Promise<FuturePrediction>
export const chatWithAI = async (message: string, category: string): Promise<string>

// 分析プロセス
1. OpenAI API呼び出し
2. JSON応答の解析
3. 型安全なデータ変換
4. エラーハンドリング
```

## アスペクト計算エンジン

### aspectCalculator.ts
```typescript
// 主要関数
export const calculateAllAspects = (planets: PlanetPosition[]): Aspect[]
export const getAspectStrength = (aspect: Aspect): number
export const detectAspectPatterns = (aspects: Aspect[]): string[]

// アスペクト種類
- Conjunction (0度): ベストフレンド
- Opposition (180度): ライバル同士
- Trine (120度): 最強コンビ
- Square (90度): 成長のライバル
- Sextile (60度): 良い仲間
- Quincunx (150度): 不思議な関係
```

## データフロー

### 1. 入力フェーズ
```
User Input → Validation → LocalStorage → Navigation
```

### 2. 計算フェーズ
```
LocalStorage → BirthData → 独自天体計算エンジン → HoroscopeData
```

### 3. AI分析フェーズ
```
HoroscopeData → OpenAI API → AI分析結果 → UI表示
```

### 4. 表示フェーズ
```
HoroscopeData + AI分析結果 → Component State → UI Rendering
```

## エラーハンドリング

### 入力エラー
- 必須項目チェック
- 日付・時刻形式バリデーション
- リアルタイムエラー表示

### 計算エラー
- 独自計算エンジンエラーキャッチ
- フォールバックモックデータ
- ユーザーフレンドリーなエラーメッセージ

### AI分析エラー
- OpenAI APIエラーキャッチ
- ネットワークエラーハンドリング
- JSON解析エラー処理

### システムエラー
- LocalStorageアクセスエラー
- ネットワークエラー
- ブラウザ互換性問題

## パフォーマンス最適化

### 計算最適化
- 非同期処理による UI ブロック防止
- 計算結果のキャッシュ
- 段階的レンダリング

### UI最適化
- CSS-in-JS回避（パフォーマンス重視）
- 最小限のDOM操作
- レスポンシブ画像最適化

### AI最適化
- API呼び出しの最適化
- レスポンスキャッシュ
- エラー時の再試行機能

### メモリ最適化
- 不要なstate削除
- useEffectクリーンアップ
- イベントリスナー管理

## セキュリティ考慮事項

### データプライバシー
- サーバー送信なし（OpenAI API除く）
- ローカルストレージのみ
- 個人情報の最小化

### APIセキュリティ
- OpenAI APIキーの安全な管理
- 環境変数での設定
- クライアントサイドでの適切な処理

### XSS対策
- React自動エスケープ
- 動的HTML生成回避
- 入力値サニタイゼーション

## テスト戦略

### 単体テスト
- **Jest/Vitest**: テストフレームワーク
- **天体計算**: 数学的精度の検証
- **AI分析**: API呼び出しの検証
- **コンポーネント**: UI動作の検証

### 統合テスト
- **データフロー**: 入力から表示までの統合
- **API連携**: OpenAI APIとの連携
- **エラーハンドリング**: 各種エラーケース

### E2Eテスト
- **ユーザーフロー**: 完全なユーザー体験
- **レスポンシブ**: 全デバイスでの動作
- **パフォーマンス**: 実際の使用環境での性能

## ブラウザ対応

### 対応ブラウザ
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

### 使用API
- LocalStorage API
- Date API
- Fetch API（将来的）
- Canvas/SVG API（Phase 4）

## 将来的な拡張性

### Phase 4: チャート視覚化
```typescript
// 新規コンポーネント
- HoroscopeChart.tsx
- ChartSVG.tsx
- AspectLines.tsx

// 新規ユーティリティ
- chartCalculator.ts
- svgRenderer.ts
- aspectCalculator.ts
```

### Phase 5: 詳細分析
```typescript
// 新規機能
- アスペクト計算
- 相性診断
- トランジット計算

// 新規データ構造
interface Aspect {
  planet1: string;
  planet2: string;
  angle: number;
  type: AspectType;
  orb: number;
}
```

## 開発ツール

### 開発環境
- **Vite Dev Server**: 高速ホットリロード
- **TypeScript Compiler**: 型チェック
- **ESLint**: コード品質
- **Prettier**: コード整形

### デバッグツール
- React Developer Tools
- Chrome DevTools
- TypeScript エラー表示
- カスタムテスト機能

## デプロイメント

### 本番ビルド
```bash
npm run build
```

### 出力ファイル
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other-assets]
└── [static-files]
```

### ホスティング対応
- 静的サイトホスティング対応
- SPA ルーティング対応
- HTTPS 対応
- CDN 配信対応 