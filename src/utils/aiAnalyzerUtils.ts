// safeParseJSON: AI応答のJSON文字列を安全にパース
export function safeParseJSON(raw: string): any {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI応答が途中で切れました。再試行してください。');
    
    let jsonStr = jsonMatch[0];
    
    // 不完全なJSONを修復する処理
    // 1. 途中で切れた文字列を検出・修復
    const incompleteStringMatch = jsonStr.match(/:\s*"([^"]*[^"}])$/);
    if (incompleteStringMatch) {
      console.log('不完全な文字列を検出、修復を試行中...');
      jsonStr = jsonStr.replace(/:\s*"([^"]*[^"}])$/, ': "' + incompleteStringMatch[1] + '"');
    }
    
    // 2. 未閉じのオブジェクトや配列を修復
    const openBraces = (jsonStr.match(/\{/g) || []).length;
    const closeBraces = (jsonStr.match(/\}/g) || []).length;
    const missingCloseBraces = openBraces - closeBraces;
    
    if (missingCloseBraces > 0) {
      console.log(`${missingCloseBraces}個の閉じ括弧が不足、修復中...`);
      jsonStr += '}}'.repeat(missingCloseBraces);
    }
    
    // 3. 途中で切れたフィールドの前のカンマを削除
    jsonStr = jsonStr.replace(/,\s*}+$/, '}');
    
    // JSON清浄化処理
    jsonStr = jsonStr
      .replace(/\,\s*\}/g, '}')         // 末尾カンマを削除
      .replace(/\,\s*\]/g, ']')         // 配列の末尾カンマを削除
      .replace(/\n/g, '')               // 改行を削除
      .replace(/\r/g, '')               // キャリッジリターンを削除
      .replace(/\t/g, '')               // タブを削除
      .replace(/  +/g, ' ')             // 連続する空白を1つにまとめる
      .replace(/([,:])\s*(["\[])/g, '$1$2')  // 不要な空白を削除
      .replace(/(["}])\s*([,}])/g, '$1$2');  // 不要な空白を削除
    
    console.log('修復後JSON:', jsonStr.substring(0, 200) + '...');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('JSON解析エラー:', error);
    console.error('生のレスポンス:', raw);
    
    // フォールバック処理：基本的なデータ構造を返す
    return {
      personalityInsights: {
        corePersonality: "AI分析データの読み込みに失敗しました。再度お試しください。",
        hiddenTraits: "AI分析データの読み込みに失敗しました。",
        lifePhilosophy: "AI分析データの読み込みに失敗しました。",
        relationshipStyle: "AI分析データの読み込みに失敗しました。",
        careerTendencies: "AI分析データの読み込みに失敗しました。"
      },
      detailedFortune: {
        overallTrend: "AI分析データの読み込みに失敗しました。",
        loveLife: "AI分析データの読み込みに失敗しました。",
        careerPath: "AI分析データの読み込みに失敗しました。",
        healthWellness: "AI分析データの読み込みに失敗しました。",
        financialProspects: "AI分析データの読み込みに失敗しました。",
        personalGrowth: "AI分析データの読み込みに失敗しました。"
      },
      planetAnalysis: {}
    };
  }
}

// mapAIResponseToAIAnalysisResult: パース済みAI応答をAIAnalysisResult型に変換
export function mapAIResponseToAIAnalysisResult(raw: any): any {
  const personalityInsights = raw.personalityInsights || {};
  const detailedFortune = raw.detailedFortune || {};
  const todaysFortune = raw.todaysFortune || {};
  const planetAnalysis = raw.planetAnalysis || {};

  const result: any = {
    personalityInsights: {
      corePersonality: personalityInsights.corePersonality || "データなし",
      hiddenTraits: personalityInsights.hiddenTraits || "データなし",
      lifePhilosophy: personalityInsights.lifePhilosophy || "データなし",
      relationshipStyle: personalityInsights.relationshipStyle || "データなし",
      careerTendencies: personalityInsights.careerTendencies || "データなし"
    },
    detailedFortune: {
      overallTrend: detailedFortune.overallTrend || "データなし",
      loveLife: detailedFortune.loveLife || "データなし",
      careerPath: detailedFortune.careerPath || "データなし",
      healthWellness: detailedFortune.healthWellness || "データなし",
      financialProspects: detailedFortune.financialProspects || "データなし",
      personalGrowth: detailedFortune.personalGrowth || "データなし"
    },
    planetAnalysis: Object.fromEntries(
      Object.entries(planetAnalysis).map(([planet, info]: any) => [
        planet,
        {
          signCharacteristics: info?.signCharacteristics || "データなし",
          personalImpact: info?.personalImpact || "データなし",
          advice: info?.advice || "データなし"
        }
      ])
    ),
    aiPowered: true
  };

  // 今日の運勢データがある場合のみ追加
  if (todaysFortune.overallLuck || todaysFortune.loveLuck || 
      todaysFortune.workLuck || todaysFortune.healthLuck || 
      todaysFortune.moneyLuck || todaysFortune.todaysAdvice) {
    result.todaysFortune = {
      overallLuck: todaysFortune.overallLuck || "データなし",
      loveLuck: todaysFortune.loveLuck || "データなし",
      workLuck: todaysFortune.workLuck || "データなし",
      healthLuck: todaysFortune.healthLuck || "データなし",
      moneyLuck: todaysFortune.moneyLuck || "データなし",
      todaysAdvice: todaysFortune.todaysAdvice || "データなし"
    };
  }

  return result;
} 