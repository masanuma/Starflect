import { BirthData, PlanetPosition } from "../types";
import { safeParseJSON, mapAIResponseToAIAnalysisResult } from './aiAnalyzerUtils';

// OpenAI API設定（Railway環境変数から取得）
const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY || null;

// エラーハンドリング用の設定
const API_CONFIG = {
  maxRetries: 3,
  timeout: 60000, // Level3の詳細分析のため60秒に延長
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
const callOpenAIWithRetry = async (prompt: string, systemMessage: string, maxTokens: number = 1200): Promise<any> => {
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
            temperature: 0.9,
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
      
      // タイムアウトエラーの詳細ログ
      if (lastError.message.includes('タイムアウト')) {
        console.error('🔥 Level3分析でタイムアウト発生。大きなプロンプトによる処理時間超過の可能性があります。');
      }
      
      if (attempt < API_CONFIG.maxRetries) {
        const delay = API_CONFIG.retryDelay * attempt;
        console.log(`🔄 ${delay}ms後にリトライ（${attempt + 1}/${API_CONFIG.maxRetries}）`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
  todaysFortune?: {
    overallLuck: string;
    loveLuck: string;
    workLuck: string;
    healthLuck: string;
    moneyLuck: string;
    todaysAdvice: string;
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
  tenPlanetSummary?: {
    overallInfluence: string;
    communicationStyle: string;
    loveAndBehavior: string;
    workBehavior: string;
    transformationAndDepth: string;
  };
  aiPowered: boolean;
  isTimeout?: boolean; // タイムアウト時のフラグを追加
}



// チャットメッセージの型定義
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  category?: "general" | "love" | "career" | "health" | "spiritual";
}

// プロンプト生成関数（モード対応）
const generateSimpleAnalysisPrompt = (
  birthData: BirthData,
  sunSign: string
): string => {
  return `
【簡単占い分析のご依頼】

太陽星座を中心とした基本的な性格分析と今日の運勢をお願いします。
初心者の方にも分かりやすく、親しみやすい内容でお願いします。

【重要】毎回新しい視点で分析し、異なる角度からのアドバイスを提供してください。同じ内容の繰り返しは避け、新鮮な洞察を含めてください。

【クライアント情報】
お名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
太陽星座: ${sunSign}
今日の日付: ${new Date().toLocaleDateString('ja-JP')}

【分析実行時刻】
${new Date().toLocaleString('ja-JP')} - 分析ID: ${Math.random().toString(36).substr(2, 9)}

【出力形式】
必ず以下のJSON形式のみでご回答ください。簡潔で分かりやすい内容にしてください。

{
  "personalityInsights": {
    "corePersonality": "太陽星座から見たあなたの基本性格を80-100文字で、ですます調で簡潔に。強みと注意点を含めて。",
    "hiddenTraits": "内面の特徴を40-60文字で、ですます調で簡潔に。",
    "lifePhilosophy": "人生で大切にしていることを40-60文字で、ですます調で簡潔に。",
    "relationshipStyle": "人間関係の特徴を40-60文字で、ですます調で簡潔に。",
    "careerTendencies": "お仕事での特徴を40-60文字で、ですます調で簡潔に。"
  },
  "detailedFortune": {
    "overallTrend": "全体的な運勢を40-60文字で、ですます調で簡潔に。",
    "loveLife": "恋愛運を40-60文字で、ですます調で簡潔に。",
    "careerPath": "仕事運を40-60文字で、ですます調で簡潔に。",
    "healthWellness": "健康運を40-60文字で、ですます調で簡潔に。",
    "financialProspects": "金運を40-60文字で、ですます調で簡潔に。",
    "personalGrowth": "成長運を40-60文字で、ですます調で簡潔に。"
  },
  "todaysFortune": {
    "overallLuck": "今日の全体運を40-60文字で、ですます調で簡潔に。",
    "loveLuck": "今日の恋愛運を40-60文字で、ですます調で簡潔に。",
    "workLuck": "今日の仕事運を40-60文字で、ですます調で簡潔に。",
    "healthLuck": "今日の健康運を40-60文字で、ですます調で簡潔に。",
    "moneyLuck": "今日の金運を40-60文字で、ですます調で簡潔に。",
    "todaysAdvice": "今日のアドバイスを40-60文字で、ですます調で簡潔に。"
  }
}

【厳守事項】
- JSON以外のテキストは絶対に出力しないでください
- 指定文字数を守って簡潔に書いてください
- 必ずですます調で統一してください
- 必要最小限の情報で分かりやすく表現してください
`;
};

// プロンプト生成関数（Level3詳細分析専用）
const generateLevel3DetailedAnalysisPrompt = (
  birthData: BirthData,
  planets: PlanetPosition[]
): string => {
  return `
【Level3: 星が伝えるあなたの印象診断 - 詳細分析】

あなたは30年以上の経験を持つ世界最高の占星術師です。10天体すべての配置を使って、クライアントの印象・行動パターンを深く分析してください。

【クライアント情報】
名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}

【天体配置】
${planets.map(p => `${p.planet}: ${p.sign}座 ${p.degree.toFixed(1)}度`).join('\n')}

【出力形式】
必ず以下のJSON形式のみでご回答ください。キーは英語、値は日本語（必ずですます調）で記述してください。

{
  "personalityInsights": {
    "corePersonality": "太陽星座の特徴を80-120文字で詳しく、必ずですます調で記述。性格の特徴と強み・注意点を含めて。",
    "hiddenTraits": "月星座の隠れた特性を80-120文字で詳しく、必ずですます調で記述。内面の感情と特徴を含めて。",
    "lifePhilosophy": "人生哲学や価値観を80-120文字で詳しく、必ずですます調で記述。何を重視するかを含めて。",
    "relationshipStyle": "人間関係のスタイルを80-120文字で詳しく、必ずですます調で記述。コミュニケーションの特徴を含めて。",
    "careerTendencies": "キャリア傾向を80-120文字で詳しく、必ずですます調で記述。適職と成功のポイントを含めて。"
  },
  "detailedFortune": {
    "overallTrend": "全体的な運勢傾向を80-120文字で詳しく、必ずですます調で記述。天体配置の影響を含めて。",
    "loveLife": "恋愛運を80-120文字で詳しく、必ずですます調で記述。金星・火星の影響を含めて。",
    "careerPath": "仕事運を80-120文字で詳しく、必ずですます調で記述。MC・太陽の影響を含めて。",
    "healthWellness": "健康運を80-120文字で詳しく、必ずですます調で記述。",
    "financialProspects": "金運を80-120文字で詳しく、必ずですます調で記述。",
    "personalGrowth": "成長運を80-120文字で詳しく、必ずですます調で記述。"
  },
  "tenPlanetSummary": {
    "overallInfluence": "10天体の総合的な影響について100-140文字で詳細に、必ずですます調で記述。主要な天体配置の特徴と性格への影響を具体的に。",
    "communicationStyle": "話し方の癖・表現方法について100-140文字で詳細に、必ずですます調で記述。水星・上昇星座の影響を含めて具体的に。",
    "loveAndBehavior": "恋愛での行動パターンについて100-140文字で詳細に、必ずですます調で記述。金星・火星・月の配置から見た愛情表現を具体的に。",
    "workBehavior": "仕事での振る舞い・行動様式について100-140文字で詳細に、必ずですます調で記述。太陽・MC・土星の影響を含めて具体的に。",
    "transformationAndDepth": "変革への姿勢・深層心理について100-140文字で詳細に、必ずですます調で記述。冥王星・天王星・海王星の影響を含めて具体的に。"
  }
}

【厳守事項】
- 必ずJSON形式のみで回答してください
- Level3詳細分析として、各項目を100-140文字程度で詳しく記述してください
- 占星術の専門知識を活用して、天体配置の具体的な影響を説明してください
- 丁寧な日本語（です・ます調）で記述してください
- 「あなたの太陽は○○座にあり」のような表現は避けてください
- まわりから見たあなたの印象・行動パターンに焦点を当ててください
- 上記のJSON形式を厳密に守ってください
`;
};

// プロンプト生成関数（簡単占いモード対応）
const generateEnhancedAnalysisPrompt = (
  birthData: BirthData,
  planets: PlanetPosition[]
): string => {
  return `
【詳細占星術分析のご依頼】

以下の出生データと天体配置をもとに、クライアント様の性格や運勢について、
必ず丁寧語（「です・ます」調）で統一し、簡潔で分かりやすく解説してください。

【重要】毎回新しい視点で分析し、異なる角度からのアドバイスを提供してください。同じ内容の繰り返しは避け、新鮮な洞察を含めてください。

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
    "corePersonality": "太陽星座の特徴を40-60文字で、必ずですます調で簡潔に。性格の特徴と強み・注意点を含めて。",
    "hiddenTraits": "月星座の隠れた特性を40-60文字で、必ずですます調で簡潔に。内面の感情と特徴を含めて。",
    "lifePhilosophy": "人生哲学や価値観を40-60文字で、必ずですます調で簡潔に。何を重視するかを含めて。",
    "relationshipStyle": "人間関係のスタイルを40-60文字で、必ずですます調で簡潔に。コミュニケーションの特徴を含めて。",
    "careerTendencies": "キャリア傾向を40-60文字で、必ずですます調で簡潔に。適職と成功のポイントを含めて。"
  },
  "detailedFortune": {
    "overallTrend": "全体的な運勢傾向を40-60文字で、必ずですます調で簡潔に。",
    "loveLife": "恋愛運を40-60文字で、必ずですます調で簡潔に。",
    "careerPath": "仕事運を40-60文字で、必ずですます調で簡潔に。",
    "healthWellness": "健康運を40-60文字で、必ずですます調で簡潔に。",
    "financialProspects": "金運を40-60文字で、必ずですます調で簡潔に。",
    "personalGrowth": "成長運を40-60文字で、必ずですます調で簡潔に。"
  },
  "tenPlanetSummary": {
    "overallInfluence": "総合的な影響について45-55文字で（適度な詳しさで）、必ずですます調で記述。",
    "communicationStyle": "話し方の癖について45-55文字で（適度な詳しさで）、必ずですます調で記述。",
    "loveAndBehavior": "恋愛や行動について45-55文字で（適度な詳しさで）、必ずですます調で記述。",
    "workBehavior": "仕事での振る舞いについて45-55文字で（適度な詳しさで）、必ずですます調で記述。",
    "transformationAndDepth": "変革と深層心理について45-55文字で（適度な詳しさで）、必ずですます調で記述。"
  }
}

【厳守事項】
- 必ずJSON形式のみで回答してください
- 各項目を45-55文字程度で記述してください
- 丁寧な日本語（です・ます調）で記述してください
- 上記のJSON形式を守ってください
`;
};

// 強化されたOpenAI API呼び出し関数
const callOpenAIAPI = async (prompt: string, maxTokens: number = 1500): Promise<AIAnalysisResult> => {
  try {
    const data = await callOpenAIWithRetry(
      prompt,
      "必ずJSON形式のみで回答してください。各項目を45-55文字程度で記述し、読みやすい内容にしてください。",
      maxTokens
    );
    const content = data.choices[0].message.content;
    console.log('🔍 【AI応答内容】:', content);
    
    const aiResultRaw = safeParseJSON(content);
    console.log('🔍 【JSON解析結果】:', aiResultRaw);
    const result = mapAIResponseToAIAnalysisResult(aiResultRaw);
    console.log('🔍 【最終マッピング結果】:', result);
    
    // tenPlanetSummaryの形式チェック＆フォールバック機能（緩和版）
    if (result.tenPlanetSummary) {
      console.log('🔍 【tenPlanetSummary確認】:', result.tenPlanetSummary);
      
      // 各フィールドが空でないかチェック（より緩やかに）
      const hasValidFields = result.tenPlanetSummary.overallInfluence && 
                           result.tenPlanetSummary.communicationStyle && 
                           result.tenPlanetSummary.loveAndBehavior && 
                           result.tenPlanetSummary.workBehavior && 
                           result.tenPlanetSummary.transformationAndDepth &&
                           result.tenPlanetSummary.overallInfluence.trim().length > 0;
      
      if (!hasValidFields) {
        console.log('🚨 【tenPlanetSummary形式エラー】空フィールドあり、フォールバック適用');
        result.tenPlanetSummary = {
          overallInfluence: "バランス感覚に優れ、周りから信頼される安定した存在として見られ、多くの人に安心感を与えます。",
          communicationStyle: "相手を思いやり、優しく丁寧な話し方で接する特徴があり、誰とでも調和を保てる人です。",
          loveAndBehavior: "時間をかけて深い信頼関係を築き、誠実な愛情を示すタイプで、パートナーを大切にします。",
          workBehavior: "責任感が強く、チームワークを大切にする協調性のある人で、職場の雰囲気作りも得意です。",
          transformationAndDepth: "内面で常に成長を求める探究心と向上心を持ち、困難も前向きに乗り越えていきます。"
        };
      } else {
        console.log('✅ 【tenPlanetSummary形式OK】AIの結果を使用');
      }
    }
    
    return result;
  } catch (error) {
    console.error('🚨 【AI分析エラー】:', error);
    console.error('🚨 【エラー詳細】:', error instanceof Error ? error.message : error);
    
    // フォールバック処理：デフォルトの分析結果を返す
    const defaultResult: AIAnalysisResult = {
      personalityInsights: {
        corePersonality: "現在AI分析が利用できません。基本的な占星術データをご覧ください。",
        hiddenTraits: "現在AI分析が利用できません。",
        lifePhilosophy: "現在AI分析が利用できません。",
        relationshipStyle: "現在AI分析が利用できません。",
        careerTendencies: "現在AI分析が利用できません。"
      },
      detailedFortune: {
        overallTrend: "現在AI分析が利用できません。",
        loveLife: "現在AI分析が利用できません。",
        careerPath: "現在AI分析が利用できません。",
        healthWellness: "現在AI分析が利用できません。",
        financialProspects: "現在AI分析が利用できません。",
        personalGrowth: "現在AI分析が利用できません。"
      },
      todaysFortune: {
        overallLuck: "現在AI分析が利用できません。",
        loveLuck: "現在AI分析が利用できません。",
        workLuck: "現在AI分析が利用できません。",
        healthLuck: "現在AI分析が利用できません。",
        moneyLuck: "現在AI分析が利用できません。",
        todaysAdvice: "現在AI分析が利用できません。"
      },
      lifePath: {
        majorThemes: [],
        challengesToOvercome: [],
        opportunitiesToSeize: [],
        spiritualJourney: "現在AI分析が利用できません。"
      },
      practicalAdvice: {
        dailyHabits: [],
        relationshipTips: [],
        careerGuidance: [],
        wellnessRecommendations: []
      },
      planetAnalysis: {},
      aiPowered: false
    };
    
    return defaultResult;
  }
};

// 天体ごと分割プロンプト
const generatePlanetAnalysisPrompt = (
  birthData: BirthData,
  planet: PlanetPosition
): string => {
  return `
【天体分析依頼】

以下の出生データと天体情報をもとに、必ずですます調で簡潔に分析してください。
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
  "signCharacteristics": "${planet.planet}星座の特徴を40-60文字で簡潔に、必ずですます調で記述",
  "personalImpact": "あなたへの影響を40-60文字で簡潔に、必ずですます調で記述",
  "advice": "具体的なアドバイスを40-60文字で簡潔に、必ずですます調で記述"
}

【厳守事項】
- JSON以外のテキストや説明文は絶対に出力しないでください
- JSONの前後に余計な文字や改行を入れないでください
- 各項目を50-70文字で簡潔に記述してください
- 「あなたの太陽は○○座にあり」のような表現は絶対に使用しないでください
- 必ず上記のJSON形式のみで回答してください
`;
};

// 天体ごとにAPIを呼び出してplanetAnalysisを合成
async function generatePlanetAnalysisAll(birthData: BirthData, planets: PlanetPosition[]): Promise<any> {
  const result: any = {};
  
  // 🔥 パフォーマンス最適化: 順次実行から並列実行に変更
  const analysisPromises = planets.map(async (planet) => {
    try {
      const prompt = generatePlanetAnalysisPrompt(birthData, planet);
      const data = await callOpenAIWithRetry(
        prompt,
        "あなたは30年以上の経験を持つ世界最高の占星術師です。JSON以外のテキストや説明文は絶対に出力せず、必ずJSON形式のみで回答してください。",
        400
      );
      const content = data.choices[0].message.content;
      
      const parsed = safeParseJSON(content);
      return { planet: planet.planet, analysis: parsed };
    } catch (e) {
      console.error(`天体分析エラー (${planet.planet}):`, e);
      return {
        planet: planet.planet,
        analysis: {
          signCharacteristics: `${planet.planet}の詳細な分析は現在利用できません。`,
          personalImpact: `${planet.planet}の影響については後ほど確認してください。`,
          advice: `${planet.planet}に関するアドバイスは現在利用できません。`
        }
      };
    }
  });

  // 並列実行ですべての天体分析を取得
  const analysisResults = await Promise.all(analysisPromises);
  
  // 結果をオブジェクトにマッピング
  analysisResults.forEach(({ planet, analysis }) => {
    result[planet] = analysis;
  });

  return result;
}

// メインのAI分析関数（モード対応）
export const generateAIAnalysis = async (
  birthData: BirthData,
  planets: PlanetPosition[],
  mode: 'simple' | 'detailed' | 'level3' = 'detailed'
): Promise<AIAnalysisResult> => {
  console.log('🔍 【generateAIAnalysis開始】モード:', mode, 'プラネット数:', planets.length);
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。環境変数OPENAI_API_KEYを設定してください。');
  }

  let baseResult: AIAnalysisResult;

  if (mode === 'simple') {
    // 簡単占い: 太陽星座中心の基本分析
    const sunPlanet = planets.find(p => p.planet === '太陽' || p.planet === 'Sun');
    const sunSign = sunPlanet?.sign || '牡羊座';
    
    const simplePrompt = generateSimpleAnalysisPrompt(birthData, sunSign);
    baseResult = await callOpenAIAPI(simplePrompt, 1500); // 短いトークン数
    
    // 簡単占いでは planetAnalysis は基本的な3天体のみ
    const mainPlanets = planets.filter(p => 
      ['太陽', 'Sun', '月', 'Moon', '上昇星座', 'Ascendant'].includes(p.planet)
    );
    const planetAnalysis = mainPlanets.length > 0 
      ? await generatePlanetAnalysisAll(birthData, mainPlanets.slice(0, 2)) // 太陽・月のみ
      : {};

    return {
      ...baseResult,
      planetAnalysis,
      aiPowered: true
    };
  } else if (mode === 'level3') {
    // Level3詳細分析: 印象診断専用の詳細プロンプト
    const level3Prompt = generateLevel3DetailedAnalysisPrompt(birthData, planets);
    baseResult = await callOpenAIAPI(level3Prompt, 3000); // より多くのトークン数

    // planetAnalysisは天体ごとに分割API呼び出し
    const planetAnalysis = await generatePlanetAnalysisAll(birthData, planets);

    console.log('🔍 【Level3詳細分析完了】結果:', baseResult);
    return {
      ...baseResult,
      planetAnalysis,
      aiPowered: true
    };
  } else {
    // 詳しい占い: 全天体の詳細分析
    const enhancedPrompt = generateEnhancedAnalysisPrompt(birthData, planets);
    baseResult = await callOpenAIAPI(enhancedPrompt, 2000); // トークン数を2500から2000に削減

    // planetAnalysisは天体ごとに分割API呼び出し
    const planetAnalysis = await generatePlanetAnalysisAll(birthData, planets);

    console.log('🔍 【generateAIAnalysis成功】結果:', baseResult);
    return {
      ...baseResult,
      planetAnalysis,
      aiPowered: true
    };
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
    throw new Error('OpenAI APIキーが設定されていません。環境変数OPENAI_API_KEYを設定してください。');
  }

  // 🔧 Level1占い結果の読み込み（AIチャット引き継ぎ用）
  const todayKey = `level1_fortune_${birthData.name}_${new Date().toISOString().split('T')[0]}`;
  let recentFortuneInfo = '';
  try {
    const storedFortune = localStorage.getItem(todayKey);
    if (storedFortune) {
      const fortuneData = JSON.parse(storedFortune);
      recentFortuneInfo = `
【本日のお手軽12星座占い結果】
星座: ${fortuneData.sunSign}
期間: ${fortuneData.period === 'today' ? '今日' : fortuneData.period === 'tomorrow' ? '明日' : fortuneData.period}
占い結果:
${fortuneData.result}
`;
    }
  } catch (error) {
    console.warn('Level1占い結果の読み込みエラー:', error);
  }

  // Level2関連処理は削除済み

  // 🔧 Level3星が伝えるあなたの印象診断結果の読み込み（AIチャット引き継ぎ用）
  const level3Key = `level3_analysis_result_${birthData.name}_${new Date().toISOString().split('T')[0]}`;
  let behaviorPatternInfo = '';
  try {
    const storedLevel3Analysis = localStorage.getItem(level3Key);
    if (storedLevel3Analysis) {
      const analysisData = JSON.parse(storedLevel3Analysis);
      if (analysisData.tenPlanetSummary) {
        const summary = analysisData.tenPlanetSummary;
        behaviorPatternInfo = `
【本日の星が伝えるあなたの印象診断結果（5つの項目）】
期間: ${analysisData.period === 'today' ? '今日' : analysisData.period === 'tomorrow' ? '明日' : analysisData.period}

🌟 総合的な影響:
${summary.overallInfluence}

💬 話し方の癖:
${summary.communicationStyle}

💕 恋愛や行動:
${summary.loveAndBehavior}

💼 仕事での振る舞い:
${summary.workBehavior}

🔮 変革と深層心理:
${summary.transformationAndDepth}
`;
      }
    } else {
      // 古い形式のフォールバック
      const oldKey = `level3_fortune_${birthData.name}_${new Date().toISOString().split('T')[0]}`;
      const storedLevel3Fortune = localStorage.getItem(oldKey);
      if (storedLevel3Fortune) {
        const fortuneData = JSON.parse(storedLevel3Fortune);
        behaviorPatternInfo = `
【本日の星が伝えるあなたの印象診断結果】
期間: ${fortuneData.period === 'today' ? '今日' : fortuneData.period === 'tomorrow' ? '明日' : fortuneData.period}
占い結果:
${fortuneData.result}
`;
      }
    }
  } catch (error) {
    console.warn('Level3占い結果の読み込みエラー:', error);
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
${recentFortuneInfo}
${behaviorPatternInfo}
【会話のカテゴリ】${category}

【これまでの会話履歴】
${chatHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'クライアント' : '占星術師'}: ${msg.content}`).join('\n')}

【現在の質問】
${message}

【重要な指示】
- 占星術の専門知識（天体配置、アスペクト、パターン）を活用して回答してください
- 天体間の関係性（アスペクト）を考慮した分析を含めてください
${recentFortuneInfo ? '- 上記の「本日のお手軽12星座占い結果」がある場合は、その具体的な内容を踏まえて深掘りしてください' : ''}

    ${behaviorPatternInfo ? '- 上記の「本日の星が伝えるあなたの印象診断結果」がある場合は、その具体的な内容を踏まえて深掘りしてください' : ''}
- 温かく親身になって答えてください
- 具体的で実践的なアドバイスを含めてください
- 希望と励ましを与える回答を心がけてください
- 400-600文字程度で、詳細で深掘りした内容を提供してください
- 「あなたの太陽は○○座にあり」のような表現は避けてください
- 具体的な時間帯、場所、方法、注意点を含めてください
- なぜそうなるのかという占星術的な理由も詳しく説明してください

【文章作成ルール（必ず守ること）】
- ですます調で丁寧に記載すること
- 具体的で詳細な内容を含めること
- チャットらしい親しみやすい表現を用いること
- 深掘りした分析と実践的なアドバイスを複数含めること

クライアントの質問に対して、占星術師として必ずですます調で丁寧に回答してください。
`

  const data = await callOpenAIWithRetry(
    contextPrompt,
    "あなたは経験豊富な占星術師です。天体配置とアスペクト分析を活用して、親身で具体的で詳細なアドバイスを400-600文字で深掘りして提供してください。",
                1200
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
    throw new Error('OpenAI APIキーが設定されていません。環境変数OPENAI_API_KEYを設定してください。');
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
 