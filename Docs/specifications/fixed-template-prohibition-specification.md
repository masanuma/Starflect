# 固定例文使用絶対禁止 技術仕様書

## 📋 **仕様概要**

### **目的**
Starflectの占い機能において、固定例文の使用を完全に禁止し、期間差別化を徹底することで、ユーザーに真に価値のある個別化された占いコンテンツを提供する。

### **適用範囲**
- Level1（太陽星座占い）
- Level2（3天体本格占い）  
- Level3（10天体詳細占い）

### **重要度**
🚨 **最高** - 品質とユーザー体験に直結する根幹仕様

## 🚨 **絶対禁止事項**

### **1. 固定例文の完全禁止**

#### **禁止対象**
```typescript
// 以下のような固定文言は絶対使用禁止

❌ Level2・Level3共通禁止表現
- "安定した運勢が続きます"
- "上昇傾向にあります"  
- "絶好調です"
- "慎重さが必要な時期です"
- "学びの機会に恵まれる"
- "チームワークを大切にすると良い結果が生まれます"

❌ Level3専用禁止表現  
- "10天体の総合的な運勢が良好な流れにあります"
- "期間の特性を活かした運勢の展開が期待でき"
- "天体配置により新しいチャンスが訪れる時期となります"
- "積極的な行動が成功を引き寄せるでしょう"

❌ テンプレート型禁止表現
- "${期間}は[固定文言]です"のパターン
- "${期間}の[運勢種別]は[固定形容詞]です"のパターン
```

#### **検出方法**
```typescript
// コードレビュー時のチェックパターン
const prohibitedPatterns = [
  /安定した運勢が続きます/,
  /上昇傾向にあります/,
  /絶好調です/,
  /10天体の総合的な運勢が良好/,
  /期間の特性を活かした/
];

// AIプロンプト内の固定例文チェック
const checkFixedTemplates = (promptText: string) => {
  return prohibitedPatterns.some(pattern => pattern.test(promptText));
};
```

### **2. 期間差別化の必須実装**

#### **差別化レベル**
```typescript
type PeriodDifferentiation = {
  today: "短期即効型"; // 瞬間的・具体的タイミング重視
  tomorrow: "短期即効型"; // 当日特化・行動指針明確化
  thisWeek: "継続戦略型"; // 週間プロセス・段階的変化
  nextWeek: "継続戦略型"; // 週間リズム・継続的取り組み
  thisMonth: "計画達成型"; // 月間サイクル・目標設定
  nextMonth: "計画達成型"; // 月間戦略・持続的成果
  threeMonths: "変革推進型"; // 転換期・中期プロジェクト
  sixMonths: "ビジョン構築型"; // 半年戦略・基盤構築
  oneYear: "人生設計型"; // 長期ビジョン・人生戦略
};
```

#### **実装要求**
```typescript
// 期間別専用指示の必須含有
const generatePeriodSpecificInstructions = (period: string) => {
  const instructions = {
    short: "即効性・具体的タイミング・瞬間的変化に焦点",
    medium: "継続プロセス・段階的発展・リズム構築に焦点", 
    long: "戦略構築・基盤形成・人生設計に焦点"
  };
  
  return `**${period}専用指示**: ${instructions[getPeriodType(period)]}`;
};
```

## ✅ **必須実装仕様**

### **1. Level2仕様**

#### **プロンプト構造**
```typescript
const level2PromptStructure = {
  prohibitionSection: "🚨Level2固定例文使用絶対禁止🚨",
  differentiationSection: "Level2期間別差別化指示",
  outputInstructions: "Level2出力指示",
  validation: "固定表現使用チェック"
};
```

#### **期間別指示システム**
```typescript
const level2PeriodInstructions = {
  shortTerm: {
    type: "短期即効型",
    focus: ["当日の具体的タイミング", "瞬間的な幸運", "即座の収入機会"]
  },
  mediumTerm: {
    type: "継続戦略型", 
    focus: ["週間リズム", "段階的変化", "継続的取り組み"]
  },
  longTerm: {
    type: "計画達成型",
    focus: ["月間サイクル", "持続的成果", "新習慣定着"]
  }
};
```

### **2. Level3仕様**

#### **プロンプト構造**
```typescript
const level3PromptStructure = {
  prohibitionSection: "🚨Level3期間別差別化（固定例文使用禁止）🚨",
  periodSpecificSection: "期間専用指示",
  generationSection: "各セクション生成指示",
  finalProhibition: "🚨超重要：固定例文使用絶対禁止🚨"
};
```

#### **期間カテゴリ分類**
```typescript
const level3PeriodCategories = {
  shortTermIntensive: {
    periods: ["today", "tomorrow"],
    characteristics: "即効性のある運勢、具体的なタイミング重視"
  },
  weeklyStrategy: {
    periods: ["thisWeek", "nextWeek"], 
    characteristics: "プロセス重視、週を通した運勢の流れ"
  },
  monthlyPlanning: {
    periods: ["thisMonth", "nextMonth"],
    characteristics: "運勢サイクル、月初から月末への変化"
  },
  quarterlyTransformation: {
    periods: ["threeMonths"],
    characteristics: "大きな変化、人生の転換期として"
  },
  longTermVision: {
    periods: ["sixMonths", "oneYear"],
    characteristics: "人生の大きな節目、長期的な運命の流れ"
  }
};
```

## 🔍 **品質保証仕様**

### **1. 自動検証システム**

#### **禁止表現検出**
```typescript
const validateProhibitedExpressions = (content: string): ValidationResult => {
  const prohibitedPatterns = [
    "安定した運勢が続きます",
    "上昇傾向にあります", 
    "絶好調です",
    "10天体の総合的な運勢が良好",
    "期間の特性を活かした"
  ];
  
  const violations = prohibitedPatterns.filter(pattern => 
    content.includes(pattern)
  );
  
  return {
    isValid: violations.length === 0,
    violations: violations,
    message: violations.length > 0 ? 
      `固定例文使用検出: ${violations.join(", ")}` : 
      "検証通過"
  };
};
```

#### **期間差別化検証**
```typescript
const validatePeriodDifferentiation = async (
  periods: string[], 
  generateFortune: (period: string) => Promise<string>
): Promise<DifferentiationResult> => {
  const results: Record<string, string> = {};
  
  for (const period of periods) {
    results[period] = await generateFortune(period);
  }
  
  // 内容重複チェック
  const duplicates = findDuplicateContent(results);
  
  return {
    isDifferentiated: duplicates.length === 0,
    duplicates: duplicates,
    uniquenessScore: calculateUniquenessScore(results)
  };
};
```

### **2. テスト仕様**

#### **必須テストケース**
```typescript
const mandatoryTestCases = [
  {
    name: "固定例文不使用テスト",
    target: ["Level2", "Level3"],
    method: "禁止表現の完全排除確認"
  },
  {
    name: "期間差別化テスト", 
    target: ["Level1", "Level2", "Level3"],
    method: "全期間での内容差別化確認"
  },
  {
    name: "表現独自性テスト",
    target: ["Level2", "Level3"], 
    method: "テンプレート表現の不使用確認"
  }
];
```

#### **合格基準**
```typescript
const passingCriteria = {
  prohibitedExpressions: 0, // 固定例文使用件数
  periodDifferentiation: 100, // 期間差別化率（%）
  templateExpressions: 0, // テンプレート表現使用件数
  uniquenessScore: 85 // 独自性スコア（%以上）
};
```

## 📊 **監視・運用仕様**

### **1. 継続的品質監視**

#### **監視項目**
```typescript
const monitoringMetrics = {
  fixedTemplateUsage: {
    threshold: 0,
    alertLevel: "CRITICAL"
  },
  periodDifferentiation: {
    threshold: 95, // 95%以上の差別化率
    alertLevel: "WARNING"
  },
  userSatisfaction: {
    threshold: 4.0, // 5点満点中4.0以上
    alertLevel: "INFO"
  }
};
```

#### **アラート仕様**
```typescript
const alertSystem = {
  critical: {
    condition: "固定例文使用検出",
    action: "即座修正・デプロイ停止"
  },
  warning: {
    condition: "期間差別化率低下",
    action: "プロンプト改善・再テスト"
  },
  info: {
    condition: "満足度低下傾向",
    action: "ユーザーフィードバック分析"
  }
};
```

### **2. 定期レビュー**

#### **レビュー頻度**
- **週次**: 新機能・修正内容の固定例文チェック
- **月次**: 全レベルでの期間差別化品質確認
- **四半期**: ユーザーフィードバック分析・仕様見直し

#### **レビュー項目**
```typescript
const reviewChecklist = [
  "新規追加プロンプトの固定例文チェック",
  "既存プロンプトの品質維持確認", 
  "期間差別化システムの正常動作確認",
  "ユーザー満足度指標の分析",
  "禁止表現リストの更新検討"
];
```

## 🚨 **緊急対応手順**

### **固定例文検出時の対応**
1. **即座停止**: 該当機能の一時停止
2. **緊急修正**: 固定例文の完全削除
3. **差別化実装**: 期間別指示システムの追加
4. **品質確認**: 全期間での動作テスト
5. **デプロイ**: 修正版のリリース
6. **事後対応**: 禁止リスト更新・引き継ぎ資料更新

### **エスカレーション基準**
- **Level1**: 1件の固定例文検出 → 即座修正
- **Level2**: 複数件の固定例文検出 → 緊急対応
- **Level3**: システム全体への影響 → プロジェクト緊急会議

## 📚 **関連資料**

### **技術資料**
- `src/components/StepByStepResult.tsx` - メイン実装ファイル
- `Docs/handovers/level2-level3-fixed-template-prohibition-handover.md` - 引き継ぎ資料
- `Docs/specifications/level2-fortune-technical-specification.md` - Level2技術仕様
- `Docs/specifications/level3-fortune-technical-specification.md` - Level3技術仕様

### **品質保証資料**
- テストケース定義書
- 品質監視ダッシュボード
- ユーザーフィードバック分析レポート

---

**作成日**: 2025年1月30日  
**最終更新**: 2025年1月30日
**承認者**: プロジェクト責任者
**重要度**: 🚨 最高（CRITICAL）
**版数**: v1.0
**次回見直し**: 2025年4月30日 