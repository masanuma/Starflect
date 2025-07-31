# Level2 占い機能 技術仕様書

**最終更新日**: 2025年1月31日  
**バージョン**: v2.0.0（根本修正版）  
**対象機能**: Level2（3天体本格占い）  
**品質レベル**: Production Ready

## 📋 機能概要

Level2は3天体（太陽・月・上昇星座）の本格占いを提供する機能で、性格分析ではなく純粋な運勢予測に特化しています。

### 主要特徴
- **純粋占い**: 分析表現を完全排除した運勢予測
- **3要素統合**: 出生チャート + 現在天体 + 性格分析の統合
- **星評価システム**: 各運勢項目に★★★☆☆の5段階評価
- **文字数統一**: 全項目60-100文字で統一された品質
- **期間対応**: 今日・明日・今週・来週・今月・来月の6期間

## 🏗️ システム構成

### データフロー
```
1. ユーザー入力
   ↓
2. 出生データ + 3天体解析 + 現在天体取得
   ↓
3. プロンプト生成（3要素統合）
   ↓
4. OpenAI API直接呼び出し
   ↓
5. 文字列結果のparseAIFortune解析
   ↓
6. 星評価付きUI表示
```

### 主要コンポーネント
- **handleGenerateLevel2Fortune**: Level2占い生成メイン関数
- **parseAIFortune**: AI応答の解析・構造化
- **renderLevel2**: Level2専用UI描画
- **calculateTransitPositions**: 現在天体位置計算

## 🔧 技術実装詳細

### 1. API呼び出し仕様

```typescript
// OpenAI API直接呼び出し（プロンプト確実適用）
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: analysisPrompt }],
    max_tokens: 600,         // Level2に最適化
    temperature: 0.8         // 創造性と一貫性のバランス
  })
});
```

### 2. プロンプト構造

#### 基本構成
```typescript
const analysisPrompt = `
あなたは世界最高の占い師です。
3天体（太陽・月・上昇星座）と現在の天体配置を統合した本格的な占いを提供してください。

**3要素統合占いの方法**：
${3つの要素データ}

**超重要緊急指示**：これは「占い・運勢予測」です。「性格分析」は絶対禁止です。

**絶対に使用禁止の表現（違反すると即座に失格）**：
${禁止表現リスト}

**必須表現（これ以外は禁止）**：
${必須表現リスト}

**厳格な出力指示（違反は絶対禁止）**：
${出力例とセクション指定}

**最終確認事項（すべて必須）**：
${品質チェックポイント}
`;
```

#### 禁止表現リスト
```typescript
- 「表の自分」「裏の自分」「本音」「内面」
- 「〜な性格」「〜な特徴」「〜な傾向」「〜な側面」
- 「太陽・牡牛座」「月・蟹座」などの天体名直接表記
- 「特性により」「影響で」「〜を重視します」
- 性格説明・特徴解説・分析的表現
```

#### 必須表現パターン
```typescript
- 「${selectedPeriodLabel}は〜な運勢です」
- 「〜な運気が流れています」
- 「〜が期待できるでしょう」
- 「〜に注意が必要です」
- 「〜すると良い結果が生まれます」
```

### 3. 出力構造仕様

#### セクション構成
```typescript
interface Level2FortuneResult {
  innerChange: string;        // 総合運（60-100文字）
  emotionalFlow: string;      // 金銭運（60-100文字）
  unconsciousChange: string;  // 恋愛運（60-100文字）
  honneBalance: string;       // 仕事運（60-100文字）
  soulGrowth: string;         // 成長運（60-100文字）
  importantDays: string;      // 重要な日（期間により表示制御）
  innerChangeStars: number;      // 総合運星評価（1-5）
  emotionalFlowStars: number;    // 金銭運星評価（1-5）
  unconsciousChangeStars: number; // 恋愛運星評価（1-5）
  honneBalanceStars: number;     // 仕事運星評価（1-5）
  soulGrowthStars: number;       // 成長運星評価（1-5）
}
```

#### AI出力フォーマット
```
【総合運】
今日は安定した運勢が続くでしょう。周囲との調和を保ちつつ、新しいチャンスが訪れる可能性があります。柔軟な対応が運を引き寄せる鍵となります。
運勢評価: ★★★☆☆

【金銭運】
今日の金運は上昇傾向にあり、計画的な支出が功を奏します。無駄遣いを避けることで、予想以上の収入が期待できるでしょう。
運勢評価: ★★★★☆

【恋愛運】
今日の恋愛運は非常に良好です。素敵な出会いや進展が期待でき、自然体でいることが吉となります。積極的なアプローチが幸運を引き寄せるでしょう。
運勢評価: ★★★★★

【仕事運】
今日の仕事運は慎重さが求められる時期です。丁寧な取り組みが評価され、着実な成果が期待できます。他者との協力を大切にすると良い結果が生まれるでしょう。
運勢評価: ★★☆☆☆

【成長運】
今日は学びの機会に恵まれる成長運です。新しい挑戦を通じて自分を成長させるチャンスが訪れるでしょう。前向きな姿勢が運気をアップさせます。
運勢評価: ★★★☆☆
```

### 4. 星評価解析ロジック

```typescript
const extractStarRating = (text: string): number => {
  // ★記号による評価
  const starMatches = text.match(/★+/g);
  if (starMatches && starMatches.length > 0) {
    return Math.min(Math.max(starMatches[0].length, 1), 5);
  }
  
  // 数値による評価
  const numberMatch = text.match(/(?:評価|★)(\d)/);
  if (numberMatch) {
    return Math.min(Math.max(parseInt(numberMatch[1]), 1), 5);
  }
  
  // デフォルト値
  return 3;
};
```

### 5. 3要素統合データ構造

```typescript
// 1. 出生チャート（3天体）
const birthChart = {
  sun: { sign: '牡牛座', degree: 14.5 },
  moon: { sign: '蟹座', degree: 22.1 },
  ascendant: { sign: '牡牛座', degree: 8.3 }
};

// 2. 現在天体配置
const currentTransits = [
  { planet: '太陽', sign: '水瓶座' },
  { planet: '月', sign: '双子座' },
  { planet: '水星', sign: '水瓶座' },
  // ... 他の天体
];

// 3. 性格分析結果
const personalityData = {
  表の自分: '安定性を重視し、堅実な性格',
  裏の自分: '感情豊かで家庭的',
  自然な行動: '信頼される存在'
};
```

## 🎨 UI仕様

### Level2占い表示カード
```jsx
<div className="fortune-card">
  <div className="fortune-header">
    <h4 className="fortune-title">💰 金銭運</h4>
    <div className="star-rating">
      {renderStars(emotionalFlowStars)}
    </div>
  </div>
  <div className="fortune-content">
    <p>{fortuneSections.emotionalFlow}</p>
  </div>
</div>
```

### 星評価表示関数
```typescript
const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`star ${i < rating ? 'filled' : 'empty'}`}
      style={{ color: getStarColor(rating) }}
    >
      ★
    </span>
  ));
};

const getStarColor = (rating: number): string => {
  if (rating >= 4) return '#FFD700';      // ゴールド
  if (rating >= 3) return '#FFA500';      // オレンジ
  if (rating >= 2) return '#87CEEB';      // スカイブルー
  return '#D3D3D3';                       // ライトグレー
};
```

## 🔍 品質保証

### 文字数検証
```typescript
const validateCharacterCount = (text: string): boolean => {
  const charCount = text.length;
  return charCount >= 60 && charCount <= 100;
};
```

### 禁止表現チェック
```typescript
const forbiddenPhrases = [
  '表の自分', '裏の自分', '本音', '内面',
  '〜な性格', '〜な特徴', '〜な傾向',
  '特性により', '影響で', '〜を重視します'
];

const containsForbiddenPhrase = (text: string): boolean => {
  return forbiddenPhrases.some(phrase => text.includes(phrase));
};
```

### 期間言及チェック
```typescript
const validatePeriodMention = (text: string, period: string): boolean => {
  const periodLabels = {
    today: ['今日', '本日'],
    tomorrow: ['明日'],
    thisWeek: ['今週', '今週間'],
    nextWeek: ['来週', '来週間'],
    thisMonth: ['今月'],
    nextMonth: ['来月']
  };
  
  const labels = periodLabels[period] || [];
  return labels.some(label => text.includes(label));
};
```

## 🚀 パフォーマンス最適化

### API呼び出し最適化
- **max_tokens**: 600（過不足ない適切な長さ）
- **temperature**: 0.8（創造性と一貫性のバランス）
- **リクエスト間隔**: ユーザー操作時のみ（自動更新なし）

### メモリ管理
- **localStorage**: Level2結果をローカル保存（AIチャット用）
- **state管理**: 最新結果のみメモリ保持
- **キャッシュ**: 同一期間の重複生成防止

## 📊 エラーハンドリング

### API エラー
```typescript
try {
  const response = await fetch(/* API call */);
  if (!response.ok) {
    throw new Error(`Level2 OpenAI API error: ${response.status}`);
  }
} catch (error) {
  console.error('Level2占い生成エラー:', error);
  setLevel2Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
}
```

### 解析エラー
```typescript
const parseAIFortune = (fortuneText: string) => {
  try {
    // 解析処理
  } catch (error) {
    console.error('Level2解析エラー:', error);
    return getDefaultSections();
  }
};
```

## 🧪 テスト仕様

### 単体テスト項目
1. **プロンプト生成**: 3要素統合データの正確な組み込み
2. **API呼び出し**: レスポンスの正常性とエラーハンドリング
3. **解析機能**: セクション分割と星評価抽出の正確性
4. **文字数検証**: 60-100文字範囲の遵守
5. **禁止表現チェック**: 分析的表現の検出と排除

### 統合テスト項目
1. **E2Eフロー**: 占い生成から表示までの完全フロー
2. **期間切り替え**: 各期間での正常動作
3. **エラー復旧**: API エラー時の適切な表示
4. **星評価表示**: 各評価レベルでの正しい色表示

## 📈 監視・ログ

### デバッグログ項目
```typescript
debugLog('🔍 【Level2占い生成】OpenAI API直接呼び出し開始');
debugLog('🔍 【Level2占いOpenAI直接応答】結果:', aiResult);
debugLog('🔍 【Level2占いOpenAI直接応答】文字数:', aiResult?.length || 0);
debugLog('🔍 【Level2占い結果設定】文字列結果を設定完了（新規生成）');
```

### パフォーマンス指標
- **API レスポンス時間**: < 10秒（目標）
- **解析処理時間**: < 1秒
- **文字数達成率**: > 95%
- **禁止表現混入率**: 0%

---

**この技術仕様書により、Level2の高品質な占い機能が持続的に維持・改善されることを保証します。** 