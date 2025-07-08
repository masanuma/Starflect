import { safeParseJSON, mapAIResponseToAIAnalysisResult } from '../aiAnalyzerUtils';
import { describe, it, expect } from 'vitest';

describe('AI応答パース・構造テスト', () => {
  const dummyAIResponse = `{
    "personalityInsights": {
      "corePersonality": "テスト太陽説明100文字以上...",
      "hiddenTraits": "テスト月説明100文字以上...",
      "lifePhilosophy": "テスト人生哲学...",
      "relationshipStyle": "テスト人間関係...",
      "careerTendencies": "テストキャリア..."
    },
    "detailedFortune": {
      "overallTrend": "全体運勢...",
      "loveLife": "恋愛運...",
      "careerPath": "仕事運...",
      "healthWellness": "健康運...",
      "financialProspects": "金運...",
      "personalGrowth": "成長運..."
    },
    "planetAnalysis": {
      "太陽": { "signCharacteristics": "太陽特徴...", "personalImpact": "太陽影響...", "advice": "太陽アドバイス..." },
      "月": { "signCharacteristics": "月特徴...", "personalImpact": "月影響...", "advice": "月アドバイス..." },
      "水星": { "signCharacteristics": "水星特徴...", "personalImpact": "水星影響...", "advice": "水星アドバイス..." },
      "金星": { "signCharacteristics": "金星特徴...", "personalImpact": "金星影響...", "advice": "金星アドバイス..." },
      "火星": { "signCharacteristics": "火星特徴...", "personalImpact": "火星影響...", "advice": "火星アドバイス..." },
      "木星": { "signCharacteristics": "木星特徴...", "personalImpact": "木星影響...", "advice": "木星アドバイス..." },
      "土星": { "signCharacteristics": "土星特徴...", "personalImpact": "土星影響...", "advice": "土星アドバイス..." },
      "天王星": { "signCharacteristics": "天王星特徴...", "personalImpact": "天王星影響...", "advice": "天王星アドバイス..." },
      "海王星": { "signCharacteristics": "海王星特徴...", "personalImpact": "海王星影響...", "advice": "海王星アドバイス..." },
      "冥王星": { "signCharacteristics": "冥王星特徴...", "personalImpact": "冥王星影響...", "advice": "冥王星アドバイス..." }
    }
  }`;

  it('safeParseJSONで正しくパースできる', () => {
    const parsed = safeParseJSON(dummyAIResponse);
    expect(parsed).toHaveProperty('personalityInsights');
    expect(parsed).toHaveProperty('detailedFortune');
    expect(parsed).toHaveProperty('planetAnalysis');
    expect(parsed.planetAnalysis).toHaveProperty('太陽');
    expect(parsed.planetAnalysis['太陽']).toHaveProperty('signCharacteristics');
  });

  it('mapAIResponseToAIAnalysisResultで型変換できる', () => {
    const parsed = safeParseJSON(dummyAIResponse);
    const result = mapAIResponseToAIAnalysisResult(parsed);
    expect(result.personalityInsights.corePersonality).toContain('太陽');
    expect(result.planetAnalysis['太陽'].signCharacteristics).toContain('太陽');
    expect(result.planetAnalysis['月'].advice).toContain('月');
  });

  it('途中で切れたJSONはエラーになる', () => {
    const broken = '{ "personalityInsights": { "corePersonality": "途中で切れた..."';
    expect(() => safeParseJSON(broken)).toThrow('AI応答が途中で切れました');
  });
}); 