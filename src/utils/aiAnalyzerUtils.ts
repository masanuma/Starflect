// safeParseJSON: AI応答のJSON文字列を安全にパース
export function safeParseJSON(raw: string): any {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI応答が途中で切れました。再試行してください。');
  let jsonStr = jsonMatch[0];
  jsonStr = jsonStr.replace(/\,\s*\}/g, '}').replace(/\,\s*\]/g, ']');
  return JSON.parse(jsonStr);
}

// mapAIResponseToAIAnalysisResult: パース済みAI応答をAIAnalysisResult型に変換
export function mapAIResponseToAIAnalysisResult(raw: any): any {
  const personalityInsights = raw.personalityInsights || {};
  const detailedFortune = raw.detailedFortune || {};
  const planetAnalysis = raw.planetAnalysis || {};

  return {
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
} 