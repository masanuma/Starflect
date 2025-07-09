import { BirthData, PlanetPosition } from "../types";
import { safeParseJSON, mapAIResponseToAIAnalysisResult } from './aiAnalyzerUtils';

// OpenAI API設定
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || null;

// エラーハンドリング用の設定
const API_CONFIG = {
  maxRetries: 3,
  timeout: 60000, // 60秒に延長
  retryDelay: 1000, // 1秒
};

// タイムアウト付きfetch関数
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API呼び出しがタイムアウトしました。しばらく待ってから再度お試しください。');
    }
    throw error;
  }
};

// リトライ機能付きAPI呼び出し
const callOpenAIWithRetry = async (prompt: string, systemMessage: string, maxTokens: number = 800): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= API_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: systemMessage
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: maxTokens
          })
        },
        API_CONFIG.timeout
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Unknown error';
        
        // 特定のエラーに対する処理
        if (response.status === 429) {
          throw new Error('API呼び出し制限に達しました。しばらく待ってから再度お試しください。');
        } else if (response.status === 401) {
          throw new Error('OpenAI APIキーが無効です。設定を確認してください。');
        } else if (response.status >= 500) {
          throw new Error('OpenAIサーバーエラーが発生しました。しばらく待ってから再度お試しください。');
        } else {
          throw new Error(`OpenAI API error: ${response.status} - ${errorMessage}`);
        }
      }

      const data = await response.json();
      return data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ OpenAI API呼び出し失敗（試行 ${attempt}）:`, lastError.message);
      
      if (attempt < API_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
      }
    }
  }
  
  throw lastError || new Error('すべてのリトライが失敗しました。');
};

// AI分析結果の型定義
export interface AIAnalysisResult {
  personalityInsights: {
    corePersonality: string;
    hiddenTraits: string;
    lifePhilosophy: string;
    relationshipStyle: string;
    careerTendencies: string;
  };
  detailedFortune: {
    overallTrend: string;
    loveLife: string;
    careerPath: string;
    healthWellness: string;
    financialProspects: string;
    personalGrowth: string;
  };
  lifePath: {
    majorThemes: string[];
    challengesToOvercome: string[];
    opportunitiesToSeize: string[];
    spiritualJourney: string;
  };
  practicalAdvice: {
    dailyHabits: string[];
    relationshipTips: string[];
    careerGuidance: string[];
    wellnessRecommendations: string[];
  };
  planetAnalysis: {
    [planetName: string]: {
      signCharacteristics: string;
      personalImpact: string;
      advice: string;
    };
  };
  aiPowered: boolean;
}

// 未来予測の型定義
export type FutureTimeframe = "今日" | "明日" | "今週" | "来週" | "今月" | "来月" | "1ヶ月" | "3ヶ月" | "6ヶ月" | "1年";
export interface FuturePrediction {
  timeframe: FutureTimeframe;
  predictions: {
    love: string;
    career: string;
    health: string;
    finance: string;
    spiritual: string;
  };
  keyDates?: Array<{
    date: string;
    event: string;
    advice: string;
  }>;
  overallMessage: string;
  shortTermAdvice?: string;
  transitInsights?: string;
}

// チャットメッセージの型定義
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  category?: "general" | "love" | "career" | "health" | "spiritual";
}

// プロンプト生成関数（厳格化）
const generateEnhancedAnalysisPrompt = (
  birthData: BirthData,
  planets: PlanetPosition[]
): string => {
  return `
【占星術分析のご依頼】

以下の出生データと天体配置をもとに、クライアント様の性格や運勢、アドバイスについて、
必ず丁寧語（「です・ます」調）で統一し、親しみやすく分かりやすく解説してください。
※重要：すべての文章は「です」「ます」「でしょう」「されます」などの丁寧語で終わらせてください。
「だ」「である」「だろう」などの断定調は絶対に使用しないでください。

【クライアント情報】
お名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}

【天体配置】
${planets.map(p => `${p.planet}: ${p.sign}座 ${p.degree.toFixed(1)}度`).join('\n')}

【出力形式】
必ず以下のJSON形式のみでご回答ください。キーは英語、値は日本語（必ずですます調）で記述してください。

{
  "personalityInsights": {
    "corePersonality": "太陽星座の特徴を50文字以上で、必ずですます調でやさしく解説してください。",
    "hiddenTraits": "月星座の隠れた特性を50文字以上で、必ずですます調でやさしく解説してください。",
    "lifePhilosophy": "人生哲学や価値観を50文字以上で、必ずですます調でやさしく解説してください。",
    "relationshipStyle": "人間関係のスタイルを50文字以上で、必ずですます調でやさしく解説してください。",
    "careerTendencies": "キャリア傾向を50文字以上で、必ずですます調でやさしく解説してください。"
  },
  "detailedFortune": {
    "overallTrend": "全体的な運勢傾向を50文字以上で、必ずですます調でやさしく解説してください。",
    "loveLife": "恋愛運を50文字以上で、必ずですます調でやさしく解説してください。",
    "careerPath": "仕事運を50文字以上で、必ずですます調でやさしく解説してください。",
    "healthWellness": "健康運を50文字以上で、必ずですます調でやさしく解説してください。",
    "financialProspects": "金運を50文字以上で、必ずですます調でやさしく解説してください。",
    "personalGrowth": "成長運を50文字以上で、必ずですます調でやさしく解説してください。"
  }
}

【厳守事項】
- JSON以外のテキストや説明文は絶対に出力しないでください
- JSONの前後に余計な文字や改行を入れないでください
- 各項目を50文字以上で、丁寧な日本語（です・ます調、敬語）でやさしく解説してください
- 「あなたの太陽は○○座にあり」のような表現は絶対に使用しないでください
- 必ず上記のJSON形式のみでご回答ください
`;
};

// 強化されたOpenAI API呼び出し関数
const callOpenAIAPI = async (prompt: string): Promise<AIAnalysisResult> => {
  const data = await callOpenAIWithRetry(
    prompt,
    "あなたは30年以上の経験を持つ世界最高の占星術師です。JSON以外のテキストや説明文は絶対に出力せず、必ずJSON形式のみで回答してください。",
    800
  );
  const content = data.choices[0].message.content;
  try {
    const aiResultRaw = safeParseJSON(content);
    return mapAIResponseToAIAnalysisResult(aiResultRaw);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw content:', content);
    throw new Error('AI応答の解析に失敗しました。再度お試しください。');
  }
};

// 天体ごと分割プロンプト
const generatePlanetAnalysisPrompt = (
  birthData: BirthData,
  planet: PlanetPosition
): string => {
  return `
【天体分析依頼】

以下の出生データと天体情報をもとに、必ずですます調で要点のみ簡潔に分析してください。
※重要：すべての文章は「です」「ます」「でしょう」「されます」などの丁寧語で終わらせてください。

【クライアント情報】
名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}

【天体情報】
${planet.planet}: ${planet.sign}座 ${planet.degree.toFixed(1)}度

【出力形式】
必ず以下のJSON形式のみで回答してください。キーは英語、値は日本語（必ずですます調）で記述してください。
{
  "signCharacteristics": "${planet.planet}星座の特徴を50文字以上で要点のみ簡潔に、必ずですます調で記述",
  "personalImpact": "あなたへの影響を50文字以上で要点のみ簡潔に、必ずですます調で記述",
  "advice": "具体的なアドバイスを50文字以上で要点のみ簡潔に、必ずですます調で記述"
}

【厳守事項】
- JSON以外のテキストや説明文は絶対に出力しないでください
- JSONの前後に余計な文字や改行を入れないでください
- 各項目を50文字以上で要点のみ簡潔に記述してください
- 「あなたの太陽は○○座にあり」のような表現は絶対に使用しないでください
- 必ず上記のJSON形式のみで回答してください
`;
};

// 天体ごとにAPIを呼び出してplanetAnalysisを合成
async function generatePlanetAnalysisAll(birthData: BirthData, planets: PlanetPosition[]): Promise<any> {
  const result: any = {};
  for (const planet of planets) {
    const prompt = generatePlanetAnalysisPrompt(birthData, planet);
    const data = await callOpenAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ世界最高の占星術師です。JSON以外のテキストや説明文は絶対に出力せず、必ずJSON形式のみで回答してください。",
      400
    );
    const content = data.choices[0].message.content;
    try {
      const parsed = safeParseJSON(content);
      result[planet.planet] = parsed;
    } catch (e) {
      result[planet.planet] = {
        signCharacteristics: 'AI応答エラー',
        personalImpact: 'AI応答エラー',
        advice: 'AI応答エラー'
      };
    }
  }
  return result;
}

// メインのAI分析関数
export const generateAIAnalysis = async (
  birthData: BirthData,
  planets: PlanetPosition[]
): Promise<AIAnalysisResult> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。OPENAI_SETUP.mdを参照して設定してください。');
  }

  // 全体分析（personalityInsights, detailedFortune）は一括
  const enhancedPrompt = generateEnhancedAnalysisPrompt(birthData, planets);
  const baseResult = await callOpenAIAPI(enhancedPrompt);

  // planetAnalysisは天体ごとに分割API呼び出し
  const planetAnalysis = await generatePlanetAnalysisAll(birthData, planets);

  return {
    ...baseResult,
    planetAnalysis,
    aiPowered: true
  };
};

// 未来予測プロンプト生成関数（期間を柔軟に対応）
function generateFuturePredictionPrompt(
  birthData: BirthData,
  planets: PlanetPosition[],
  timeframe: FutureTimeframe
): string {
  // 短期かどうか判定
  const isShortTerm = ["今日", "明日", "今週", "来週"].includes(timeframe);
  
  // 期間に応じた日付範囲を計算
  const startDate = new Date();
  let endDate = new Date();
  
  switch (timeframe) {
    case '今日':
      endDate = new Date();
      break;
    case '明日':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case '今週':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case '来週':
      startDate.setDate(startDate.getDate() + 7);
      endDate.setDate(endDate.getDate() + 14);
      break;
    case '今月':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '来月':
      startDate.setMonth(startDate.getMonth() + 1);
      endDate.setMonth(endDate.getMonth() + 2);
      break;
    case '1ヶ月':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '3ヶ月':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case '6ヶ月':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '1年':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  
  return `
【未来予測依頼】

以下の出生データと天体配置をもとに、${timeframe}の運勢・アドバイスを、各分野200文字以上の丁寧な日本語で、できるだけ具体的に解説してください。

【クライアント情報】
お名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}

【天体配置】
${planets.map(p => `${p.planet}: ${p.sign}座 ${p.degree.toFixed(1)}度`).join('\n')}

【予測期間】
${timeframe} (${startDate.toLocaleDateString('ja-JP')} 〜 ${endDate.toLocaleDateString('ja-JP')})

【出力形式】
必ず以下のJSON形式のみでご回答ください。キーは英語、値は日本語（敬語・丁寧語）で記述してください。

{
  "timeframe": "${timeframe}",
  "predictions": {
    "love": "恋愛・人間関係の運勢を200文字以上で丁寧に具体的に",
    "career": "仕事・キャリアの運勢を200文字以上で丁寧に具体的に",
    "health": "健康・ウェルネスの運勢を200文字以上で丁寧に具体的に",
    "finance": "金運・財運の運勢を200文字以上で丁寧に具体的に",
    "spiritual": "スピリチュアル成長の運勢を200文字以上で丁寧に具体的に"
  },
  ${isShortTerm ? `"shortTermAdvice": "${timeframe}の過ごし方や注意点・ポイントを200文字以上で丁寧に具体的に"` : `"keyDates": [
    { "date": "期間内の日付（YYYY/MM/DD形式）", "event": "イベント内容", "advice": "アドバイス" }
  ]`},
  "overallMessage": "全体的なメッセージを200文字以上で丁寧に具体的に"
}

【最重要制約】
- keyDatesの日付は必ず${startDate.toLocaleDateString('ja-JP')}から${endDate.toLocaleDateString('ja-JP')}の期間内にしてください
- 期間外の日付は絶対に含めないでください
- 日付形式は「YYYY/MM/DD」または「MM月DD日」で正確に記述してください
- 存在しない日付（例：2月30日）は使用しないでください
- JSON以外のテキストや説明文は絶対に出力しないでください
- JSONの前後に余計な文字や改行を入れないでください
- 各項目を200文字以上で、丁寧な日本語（です・ます調、敬語）でやさしく具体的に解説してください
- 必ず上記のJSON形式のみでご回答ください
`;
}

// 未来予測生成関数
export const generateFuturePrediction = async (
  birthData: BirthData,
  planets: PlanetPosition[],
  timeframe: FutureTimeframe
): Promise<FuturePrediction> => {
  const prompt = generateFuturePredictionPrompt(birthData, planets, timeframe);
  const data = await callOpenAIWithRetry(
    prompt,
    "あなたは経験豊富な占星術師です。必ずfuturePredictionキーをルートに持つ英語キーのJSON形式のみで回答してください。JSON以外のテキストや説明文は絶対に出力しないでください。",
    4000
  );

  const content = data.choices[0].message.content;
  try {
    // JSON部分を抽出し、末尾カンマも除去
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      let aiResult = JSON.parse(jsonStr);
      // futurePredictionキーがなければラップ
      if (!('futurePrediction' in aiResult)) {
        aiResult = { futurePrediction: aiResult };
      }
      return {
        timeframe,
        ...aiResult.futurePrediction
      };
    } else {
      throw new Error('Valid JSON not found in response');
    }
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw content:', content);
    throw new Error('未来予測の解析に失敗しました。再度お試しください。');
  }
};

// AI占い師チャット機能（アスペクト情報追加版）
export const chatWithAIAstrologer = async (
  message: string,
  birthData: BirthData,
  planets: PlanetPosition[],
  chatHistory: ChatMessage[] = [],
  category: "general" | "love" | "career" | "health" | "spiritual" = "general",
  aspects?: any[],
  aspectPatterns?: string[]
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。OPENAI_SETUP.mdを参照して設定してください。');
  }

  // アスペクト情報の整理
  const aspectInfo = aspects && aspects.length > 0 
    ? aspects.filter(a => a.exactness >= 50)
        .map(a => `${a.planet1}と${a.planet2}: ${a.definition.nameJa}(${a.type}) - ${a.definition.meaning}`)
        .join('\n')
    : '基本的なアスペクト情報を参考にしています';

  const patternInfo = aspectPatterns && aspectPatterns.length > 0
    ? aspectPatterns.join('\n')
    : '特別なアスペクトパターンは検出されていません';

  const contextPrompt = `
【AI占い師チャット】

あなたは30年以上の経験を持つ世界最高の占星術師です。クライアントとの対話を通じて、深い洞察とアドバイスを提供します。

【クライアント情報】
名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}

【天体配置】
${planets.map(p => `${p.planet}: ${p.sign}座 ${p.degree.toFixed(1)}度`).join('\n')}

【アスペクト分析（天体間の関係性）】
${aspectInfo}

【特別なアスペクトパターン】
${patternInfo}

【会話のカテゴリ】${category}

【これまでの会話履歴】
${chatHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'クライアント' : '占星術師'}: ${msg.content}`).join('\n')}

【現在の質問】
${message}

【重要な指示】
- 占星術の専門知識（天体配置、アスペクト、パターン）を活用して回答してください
- 天体間の関係性（アスペクト）を考慮した深い分析を含めてください
- 温かく親身になって答えてください
- 具体的で実践的なアドバイスを含めてください
- 希望と励ましを与える回答を心がけてください
- 200-400文字程度で、親しみやすい語調で答えてください
- 「あなたの太陽は○○座にあり」のような表現は避けてください
- 必ず「です」「ます」「でしょう」「されます」等の丁寧語で統一してください

クライアントの質問に対して、占星術師として必ずですます調で丁寧に回答してください。
`;

  const data = await callOpenAIWithRetry(
    contextPrompt,
    "あなたは経験豊富な占星術師です。天体配置とアスペクト分析を活用して、親身で具体的なアドバイスを提供してください。",
    600
  );

  return data.choices[0].message.content;
};

// 天体計算プロンプトも簡略化
const generatePlanetCalculationPrompt = (birthData: BirthData): string => {
  return `
【天体位置計算依頼】

以下の出生データから10天体の位置を計算し、JSON形式で返してください。

名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}
緯度: ${birthData.birthPlace.latitude}
経度: ${birthData.birthPlace.longitude}
`;
};

// 天体計算用のAI呼び出し
const callPlanetCalculationAPI = async (prompt: string): Promise<PlanetPosition[]> => {
  const data = await callOpenAIWithRetry(
    prompt,
    "あなたは天文学と占星術の専門家です。天体位置の計算において、正確で詳細な情報を提供してください。必ずJSON形式で回答し、10天体すべての情報を含めてください。",
    3000
  );

  const content = data.choices[0].message.content;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.planets || [];
    } else {
      throw new Error('Valid JSON not found in response');
    }
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw content:', content);
    throw new Error('天体計算の解析に失敗しました。再度お試しください。');
  }
};

// AI経由の天体計算関数
export const calculatePlanetsWithAI = async (birthData: BirthData): Promise<PlanetPosition[]> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。OPENAI_SETUP.mdを参照して設定してください。');
  }

  const prompt = generatePlanetCalculationPrompt(birthData);
  return await callPlanetCalculationAPI(prompt);
};

// 天体×星座ごとにAI分析を行う関数
export async function analyzePlanetSignWithAI(planet: string, sign: string): Promise<{ signCharacteristics: string, personalImpact: string, advice: string }> {
  const prompt = `
【天体分析依頼】
「${planet}」が「${sign}」にある場合の性格・運勢・アドバイスを、200文字以上の日本語で簡潔に教えてください。
必ずですます調で統一し、JSON形式で下記のように出力してください。
{
  "signCharacteristics": "...",
  "personalImpact": "...",
  "advice": "..."
}`;
  const data = await callOpenAIWithRetry(
    prompt,
    "あなたは経験豊富な占星術師です。必ずJSON形式で回答してください。",
    600
  );
  const content = data.choices[0].message.content;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(jsonStr);
    } else {
      throw new Error('Valid JSON not found in response');
    }
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw content:', content);
    throw new Error('天体分析の解析に失敗しました。再度お試しください。');
  }
}

// トランジット情報を含む未来予測
export const generateTransitBasedPrediction = async (
  birthData: BirthData,
  natalPlanets: PlanetPosition[],
  timeframe: FutureTimeframe,
  transitData?: any[]
): Promise<FuturePrediction> => {
  try {
    // 期間に応じた日付範囲を計算
    const startDate = new Date();
    let endDate = new Date();
    
    switch (timeframe) {
      case '今日':
        endDate = new Date();
        break;
      case '明日':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case '今週':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case '来週':
        startDate.setDate(startDate.getDate() + 7);
        endDate.setDate(endDate.getDate() + 14);
        break;
      case '今月':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '来月':
        startDate.setMonth(startDate.getMonth() + 1);
        endDate.setMonth(endDate.getMonth() + 2);
        break;
      case '1ヶ月':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3ヶ月':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6ヶ月':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '1年':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const prompt = `
あなたは経験豊富な占星術師です。以下の情報を基に、${timeframe}の詳細な運勢予測を行ってください。

【基本情報】
- 出生データ: ${birthData.name}様
- 出生日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
- 出生時刻: ${birthData.birthTime}
- 出生地: ${birthData.birthPlace.city}

【出生チャート（天体配置）】
${natalPlanets.map(planet => 
  `- ${planet.planet}: ${planet.sign} ${planet.degree}度 (ハウス${planet.house})${planet.retrograde ? ' (逆行中)' : ''}`
).join('\n')}

${transitData && transitData.length > 0 ? `
【トランジット情報（${timeframe}期間中の重要な星の動き）】
${transitData.map(transit => 
  `- ${transit.date.toLocaleDateString('ja-JP')}: ${transit.natalPlanet}と${transit.transitPlanet}が${transit.aspectType}アスペクト（強度${Math.round(transit.strength)}%）`
).join('\n')}
` : ''}

【予測期間】
${timeframe} (${startDate.toLocaleDateString('ja-JP')} 〜 ${endDate.toLocaleDateString('ja-JP')})

【出力形式】
以下のJSON形式で回答してください：

{
  "timeframe": "${timeframe}",
  "overallMessage": "全体メッセージ（100文字程度）",
  "predictions": {
    "love": "恋愛運（150文字程度）",
    "career": "仕事運（150文字程度）", 
    "health": "健康運（150文字程度）",
    "finance": "金運（150文字程度）",
    "spiritual": "スピリチュアル運（150文字程度）"
  },
  ${["今日", "明日", "今週", "来週"].includes(timeframe) ? `
  "shortTermAdvice": "具体的なアドバイス（200文字程度）",
  ` : `
  "keyDates": [
    {
      "date": "期間内の日付（YYYY/MM/DD形式）",
      "event": "その日に起こりそうな出来事",
      "advice": "その日へのアドバイス"
    }
  ],
  `}
  "transitInsights": "トランジットからの洞察（200文字程度）"
}

【最重要制約】
- keyDatesの日付は必ず${startDate.toLocaleDateString('ja-JP')}から${endDate.toLocaleDateString('ja-JP')}の期間内にしてください
- 期間外の日付は絶対に含めないでください
- 日付形式は「YYYY/MM/DD」または「MM月DD日」で正確に記述してください
- 存在しない日付（例：2月30日）は使用しないでください
トランジット情報がある場合は、それを重視した予測を行ってください。ない場合は、出生チャートの特徴を基にした一般的な予測を行ってください。
`;

    const response = await callOpenAIWithRetry(
      prompt,
      "あなたは経験豊富な占星術師です。必ずfuturePredictionキーをルートに持つ英語キーのJSON形式のみで回答してください。JSON以外のテキストや説明文は絶対に出力しないでください。",
      4000
    );
    
    if (!response) {
      throw new Error('AI応答が取得できませんでした');
    }

    const prediction: FuturePrediction = JSON.parse(response.choices[0].message.content);
    
    // トランジット情報を追加
    if (transitData && transitData.length > 0) {
      prediction.transitInsights = prediction.transitInsights || 'トランジット情報を基にした予測です。';
    }

    return prediction;
  } catch (error) {
    console.error('トランジット予測生成エラー:', error);
    throw new Error('トランジット予測の生成に失敗しました');
  }
};

// AIチャット用のトランジット情報取得
export const getTransitInfoForChat = async (
  birthData: BirthData,
  targetDate: Date
): Promise<string> => {
  try {
    const { calculateTransitPositions } = await import('./astronomyCalculator');
    const transitPlanets = await calculateTransitPositions(birthData, targetDate);
    
    const transitInfo = transitPlanets.map(planet => 
      `${planet.planet}: ${planet.sign} ${planet.degree}度${planet.retrograde ? ' (逆行中)' : ''}`
    ).join(', ');
    
    return `【${targetDate.toLocaleDateString('ja-JP')}のトランジット情報】\n${transitInfo}`;
  } catch (error) {
    console.error('トランジット情報取得エラー:', error);
    return 'トランジット情報の取得に失敗しました。';
  }
};

// チャット履歴にトランジット情報を追加
export const addTransitContextToChat = (
  messages: ChatMessage[],
  birthData: BirthData,
  currentDate: Date = new Date()
): ChatMessage[] => {
  try {
    // 最新のメッセージにトランジット情報を追加
    const updatedMessages = [...messages];
    
    if (updatedMessages.length > 0) {
      // ユーザーメッセージとしてトランジット情報を追加
      const transitContextMessage: ChatMessage = {
        id: `transit-${Date.now()}`,
        role: 'user',
        content: `現在の日付: ${currentDate.toLocaleDateString('ja-JP')}\n出生データ: ${birthData.name}様 (${birthData.birthDate.toLocaleDateString('ja-JP')} ${birthData.birthTime} ${birthData.birthPlace.city})`,
        timestamp: new Date()
      };
      
      updatedMessages.splice(-1, 0, transitContextMessage);
    }
    
    return updatedMessages;
  } catch (error) {
    console.error('チャットコンテキスト追加エラー:', error);
    return messages;
  }
};

// 強化されたトランジット分析機能
export const getEnhancedTransitAnalysis = async (
  birthData: BirthData,
  targetDate: Date,
  analysisDepth: 'basic' | 'detailed' = 'detailed'
): Promise<{
  transitPlanets: PlanetPosition[];
  transitAspects: any[];
  keyInsights: string[];
  dailyGuidance: string;
}> => {
  try {
    const { calculateTransitPositions, calculateTransitAspects } = await import('./astronomyCalculator');
    const { generateCompleteHoroscope } = await import('./astronomyCalculator');
    
    // 出生チャートの取得
    const natalChart = await generateCompleteHoroscope(birthData);
    
    // トランジット天体位置の計算
    const transitPlanets = await calculateTransitPositions(birthData, targetDate);
    
    // トランジットアスペクトの計算
    const transitAspects = calculateTransitAspects(natalChart.planets, transitPlanets);
    
    // 重要なトランジットアスペクトのフィルタリング
    const significantTransits = transitAspects.filter(t => t.exactness >= 60);
    
    // キーインサイトの生成
    const keyInsights = await generateTransitInsights(significantTransits, analysisDepth);
    
    // 日々のガイダンス生成
    const dailyGuidance = await generateDailyGuidance(birthData, significantTransits, targetDate);
    
    return {
      transitPlanets,
      transitAspects: significantTransits,
      keyInsights,
      dailyGuidance
    };
    
  } catch (error) {
    console.error('強化トランジット分析エラー:', error);
    throw new Error('トランジット分析に失敗しました。');
  }
};

// トランジットインサイト生成（AI動的生成対応）
const generateTransitInsights = async (
  transitAspects: any[],
  depth: 'basic' | 'detailed'
): Promise<string[]> => {
  const insights: string[] = [];
  
  for (const transit of transitAspects.slice(0, depth === 'detailed' ? 5 : 3)) {
    try {
      const aspectMeaning = await getTransitAspectMeaning(transit);
      insights.push(`【${transit.natalPlanet}×${transit.transitPlanet}】${aspectMeaning}`);
    } catch (error) {
      console.error('トランジットインサイト生成エラー:', error);
      insights.push(`【${transit.natalPlanet}×${transit.transitPlanet}】星からの特別なメッセージがあります。`);
    }
  }
  
  return insights;
};

// 星と星の関係の意味解釈（AI動的生成対応）
const getTransitAspectMeaning = async (transit: any): Promise<string> => {
  try {
    // AI動的生成でアスペクト説明を作成
    const description = await generateTransitAspectDescription(
      transit.natalPlanet || '天体',
      transit.transitPlanet || '天体',
      transit.aspectType
    );
    return description;
  } catch (error) {
    console.error('トランジットアスペクト説明AI生成エラー:', error);
    
    // フォールバック：基本的な説明を返す
    const meanings: { [key: string]: string } = {
      'conjunction': '新しいことを始めるのにぴったりな時期。星からの特別なエネルギーを受けています。',
      'opposition': '自分自身を見つめ直すタイミング。バランスを取ることで成長できます。',
      'trine': '何をやってもうまくいきやすい幸運な時期。自然な流れに身を任せましょう。',
      'square': '少し頑張りが必要な時期ですが、その分成長できるチャンスです。',
      'sextile': 'チャンスを掴みやすい時期。積極的に行動すると良い結果が期待できます。'
    };
    
    return meanings[transit.aspectType] || '星があなたに特別なメッセージを送っています。';
  }
};

// トランジットアスペクト説明をAI動的生成する新機能
export const generateTransitAspectDescription = async (
  natalPlanet: string,
  transitPlanet: string,
  aspectType: string
): Promise<string> => {
  try {
    const prompt = `
以下のトランジットアスペクトについて、その時期の運勢や行動指針を60文字以上80文字以内で、親しみやすい日本語で説明してください。

【出生天体】: ${natalPlanet}
【トランジット天体】: ${transitPlanet}
【アスペクト】: ${aspectType}

【回答形式】
- 親しみやすく前向きな表現を使用
- 具体的で実践的な内容
- 60文字以上80文字以内
- 「〜です。〜ます。」調で記述
- 天体名は含めず、その時期の傾向のみを記述

【アスペクト別の方向性】
- conjunction: 新しいスタート、統合、エネルギーの集中
- opposition: バランス、見直し、対立からの学び
- trine: 幸運、自然な流れ、才能の開花
- square: 挑戦、成長、努力の必要性
- sextile: チャンス、協力、積極的行動

上記を参考に${aspectType}の時期について説明してください。`;

    const data = await callOpenAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ世界最高の占星術師です。トランジットアスペクトがその時期に与える影響を、親しみやすく具体的に説明してください。",
      150
    );

    const description = data.choices[0].message.content.trim();
    
    // AIの回答から不要な部分を除去
    const cleanDescription = description
      .replace(/^.*?:/, '') // コロンより前を削除
      .replace(/【.*?】.*/, '') // 【】付きの説明を削除
      .replace(/^[「『]/, '') // 開始の括弧を削除
      .replace(/[」』]$/, '') // 終了の括弧を削除
      .trim();
    
    return cleanDescription || 'この時期は星からの特別なエネルギーを受けています。前向きに過ごすことで良い結果が期待できます。';
    
  } catch (error) {
    console.error('AIトランジットアスペクト説明生成エラー:', error);
    
    // フォールバック：基本的な説明を返す
    const meanings: { [key: string]: string } = {
      'conjunction': '新しいことを始めるのにぴったりな時期です。',
      'opposition': 'バランスを取ることが大切な時期です。',
      'trine': '何をやってもうまくいきやすい幸運な時期です。',
      'square': '努力が実る成長の時期です。',
      'sextile': 'チャンスを掴みやすい時期です。'
    };
    
    return meanings[aspectType] || '星があなたに特別なメッセージを送っています。';
  }
};

// 日々のガイダンス生成
const generateDailyGuidance = async (
  birthData: BirthData,
  transitAspects: any[],
  targetDate: Date
): Promise<string> => {
  const prompt = `
【日々のガイダンス生成依頼】

以下の情報から、${targetDate.toLocaleDateString('ja-JP')}の具体的なアドバイスを150文字程度で生成してください。

【クライアント】${birthData.name}様
【重要なトランジット】
${transitAspects.map(t => 
  `${t.natalPlanet}×${t.transitPlanet}: ${t.aspectType} (強度${Math.round(t.exactness)}%)`
).join('\n')}

【出力】
親しみやすい語調で、具体的で実践的なアドバイスを150文字程度で記述してください。
`;

  try {
    const data = await callOpenAIWithRetry(
      prompt,
      "あなたは親身な占星術師です。具体的で実践的なアドバイスを簡潔に提供してください。",
      200
    );
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('日々のガイダンス生成エラー:', error);
    return `${targetDate.toLocaleDateString('ja-JP')}は、あなたの内なる力を信じて前向きに過ごしてください。小さな行動が大きな変化を生み出す日です。`;
  }
};

// 個別の天体組み合わせとアスペクトに基づいた説明をAIで生成
export const generateSpecificAspectDescription = async (
  planet1: string, 
  planet2: string, 
  aspectType: string,
  aspectMeaning: string
): Promise<string> => {
  try {
    const prompt = `
以下の天体組み合わせとアスペクトについて、その人への具体的な影響を60文字以上80文字以内で、丁寧な日本語（です・ます調）で説明してください。

【天体組み合わせ】: ${planet1} と ${planet2}
【アスペクトタイプ】: ${aspectType}
【アスペクトの性質】: ${aspectMeaning}

【回答形式】
- 「例えば」「一般的に」などの抽象的な表現は使わない
- その人の具体的な特徴や能力について言及する
- 丁寧語（です・ます調）で記述する
- 60文字以上80文字以内で簡潔に
- 天体名は含めず、影響の内容のみを記述

【出力例】
あなたの愛情は非常に深く、一度愛した人に対して強い献身を示します。恋愛や人間関係において変容的な体験を通じて成長します。

上記の形式で、${planet1}と${planet2}の${aspectType}の影響について回答してください。:`;

    const data = await callOpenAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ世界最高の占星術師です。個別の天体組み合わせに基づいて、その人への具体的で実践的な影響を説明してください。",
      150
    );

    const description = data.choices[0].message.content.trim();
    
    // AIの回答から不要な部分を除去
    const cleanDescription = description
      .replace(/^.*?:/, '') // コロンより前を削除
      .replace(/【.*?】.*/, '') // 【】付きの説明を削除
      .replace(/^[「『]/, '') // 開始の括弧を削除
      .replace(/[」』]$/, '') // 終了の括弧を削除
      .trim();
    
    return cleanDescription || `${planet1}と${planet2}の${aspectType}により、特別な影響を受けています。この組み合わせがあなたの個性を形作る重要な要素となっています。`;
    
  } catch (error) {
    console.error('AI天体組み合わせ説明生成エラー:', error);
    
    // フォールバック：基本的な説明を返す
    return `${planet1}と${planet2}の${aspectType}により、あなたの人格や能力に特別な影響を与えています。この組み合わせを理解することで、自分自身をより深く知ることができます。`;
  }
};

// アスペクトパターン説明をAI動的生成する新機能
export const generateAspectPatternDescription = async (
  patternType: string,
  keyPlanets: string[],
  patternName: string
): Promise<string> => {
  try {
    const prompt = `
以下のアスペクトパターンについて、その人への具体的な影響を100文字以上150文字以内で、親しみやすい日本語で説明してください。

【パターンタイプ】: ${patternType}
【関与する天体】: ${keyPlanets.join('、')}
【パターン名】: ${patternName}

【回答形式】
- 絵文字から始める（🌟、💪、🔮、😊、🔥のいずれか適切なもの）
- パターン名を含める（例：「ラッキートライアングル」「成長エンジン」など）
- 「あなたは」「あなたの」で始める個人への具体的な説明
- 抽象的でなく、具体的で実践的な影響を記述
- 親しみやすく前向きな表現を使用
- 100文字以上150文字以内

【パターン別の説明方向性】
- グランドトライン: 才能、運、自然な成功
- Tスクエア: 成長、努力、困難からの強さ
- ヨード: 使命、才能、独特なアプローチ
- 調和的パターン: 幸せ、人間関係、自然体
- 挑戦的パターン: エネルギー、粘り強さ、成果

上記の要件で${patternType}について説明してください。`;

    const data = await callOpenAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ世界最高の占星術師です。アスペクトパターンがその人に与える具体的で実践的な影響を、親しみやすく説明してください。",
      200
    );

    const description = data.choices[0].message.content.trim();
    
    // AIの回答から不要な部分を除去
    const cleanDescription = description
      .replace(/^.*?:/, '') // コロンより前を削除
      .replace(/【.*?】.*/, '') // 【】付きの説明を削除
      .replace(/^[「『]/, '') // 開始の括弧を削除
      .replace(/[」』]$/, '') // 終了の括弧を削除
      .trim();
    
    return cleanDescription || `${patternName}のパターンがあなたの特別な個性を形作っています。この組み合わせを活かすことで、人生がより豊かになります。`;
    
  } catch (error) {
    console.error('AIアスペクトパターン説明生成エラー:', error);
    
    // フォールバック：基本的な説明を返す
    return `${patternName}のパターンにより、あなたには特別な才能や特徴があります。この組み合わせを理解し活用することで、より充実した人生を送ることができます。`;
  }
};

// 運勢傾向をAI動的生成する新機能
export const generateTransitTrendDescription = async (
  harmoniousCount: number,
  challengingCount: number,
  period: string = '現在の期間'
): Promise<string> => {
  try {
    const prompt = `
以下の情報を基に、${period}の全体的な運勢傾向を50文字以上100文字以内で、親しみやすい日本語で説明してください。

【調和的なトランジット数】: ${harmoniousCount}個
【挑戦的なトランジット数】: ${challengingCount}個

【回答形式】
- 親しみやすく前向きな表現を使用
- 具体的で実践的な内容
- 50文字以上100文字以内
- 「〜です。〜ます。」調で記述

【傾向の判断基準】
- 調和的が挑戦的の2倍以上：非常に良い時期
- 調和的が挑戦的より多い：比較的良い時期  
- 挑戦的が調和的の2倍以上：挑戦的な時期
- 挑戦的が調和的より多い：やや困難だが成長の時期
- 同程度：バランスの取れた時期

上記を参考に運勢傾向を説明してください。`;

    const data = await callOpenAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ世界最高の占星術師です。トランジット分析に基づいて、親しみやすく具体的な運勢傾向を説明してください。",
      150
    );

    const description = data.choices[0].message.content.trim();
    
    // AIの回答から不要な部分を除去
    const cleanDescription = description
      .replace(/^.*?:/, '') // コロンより前を削除
      .replace(/【.*?】.*/, '') // 【】付きの説明を削除
      .replace(/^[「『]/, '') // 開始の括弧を削除
      .replace(/[」』]$/, '') // 終了の括弧を削除
      .trim();
    
    return cleanDescription || `${period}は星の配置がバランス良く、安定した行動が推奨される時期です。`;
    
  } catch (error) {
    console.error('AI運勢傾向説明生成エラー:', error);
    
    // フォールバック：基本的な説明を返す
    if (harmoniousCount > challengingCount * 2) {
      return '非常に良い運勢の時期です。新しいことに挑戦するのに適しています。';
    } else if (harmoniousCount > challengingCount) {
      return '比較的良い運勢の時期です。前向きに行動すると良い結果が期待できます。';
    } else {
      return 'バランスの取れた時期です。安定した行動を心がけましょう。';
    }
  }
};

// 運勢推奨事項をAI動的生成する新機能
export const generateTransitRecommendations = async (
  harmoniousCount: number,
  challengingCount: number,
  totalTransits: number
): Promise<string[]> => {
  try {
    const prompt = `
以下の情報を基に、具体的な行動推奨事項を3つ以内で、親しみやすい日本語で生成してください。

【調和的なトランジット数】: ${harmoniousCount}個
【挑戦的なトランジット数】: ${challengingCount}個
【総トランジット数】: ${totalTransits}個

【回答形式】
- 絵文字から始める（🌟、💪、📅、✨、🎯など）
- 具体的で実践的なアドバイス
- 各項目30文字以上60文字以内
- 親しみやすい表現を使用
- 配列形式で3つ以内の項目を出力

【推奨事項の方向性】
- 調和的トランジットが多い場合：チャレンジ、新しい取り組み、積極的行動
- 挑戦的トランジットが多い場合：成長機会、粘り強さ、困難への対処
- トランジットが少ない場合：安定した行動、基盤作り、準備期間

JSON配列形式で出力してください（例：["🌟 項目1", "💪 項目2", "📅 項目3"]）`;

    const data = await callOpenAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ世界最高の占星術師です。トランジット分析に基づいて、具体的で実践的な推奨事項を生成してください。",
      200
    );

    const response = data.choices[0].message.content.trim();
    
    try {
      // JSON配列として解析を試行
      const recommendations = JSON.parse(response);
      if (Array.isArray(recommendations)) {
        return recommendations.slice(0, 3); // 最大3つまで
      }
    } catch (parseError) {
      console.warn('JSON解析失敗、テキスト解析を試行:', parseError);
    }
    
    // JSON解析失敗時はテキストから推奨事項を抽出
    const lines = response.split('\n').filter((line: string) => line.trim().length > 0);
    const recommendations = lines
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line: string) => line.length > 10)
      .slice(0, 3);
    
    return recommendations.length > 0 ? recommendations : [
      '🌟 今日は新しいことにチャレンジしてみましょう',
      '💪 困難があっても諦めず、成長の機会として活用しましょう',
      '📅 計画的な行動で安定した結果を目指しましょう'
    ];
    
  } catch (error) {
    console.error('AI運勢推奨事項生成エラー:', error);
    
    // フォールバック：基本的な推奨事項を返す
    const fallbackRecommendations = [];
    
    if (harmoniousCount > 0) {
      fallbackRecommendations.push('🌟 良い星の影響を受けている時期です。積極的に行動しましょう。');
    }
    
    if (challengingCount > 0) {
      fallbackRecommendations.push('💪 困難な配置もありますが、成長の機会として活用しましょう。');
    }
    
    if (totalTransits === 0) {
      fallbackRecommendations.push('📅 安定した時期です。基盤作りに集中しましょう。');
    }
    
    return fallbackRecommendations.length > 0 ? fallbackRecommendations : [
      '✨ 星の導きを信じて、前向きに過ごしましょう。'
    ];
  }
};
 