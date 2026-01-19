import { BirthData, PlanetPosition } from "../types";
import { safeParseJSON, mapAIResponseToAIAnalysisResult } from './aiAnalyzerUtils';
import { getOpenAIApiKey, getGeminiApiKey, isApiKeyAvailable, isGeminiAvailable, debugEnvConfig, getApiBaseUrl } from '../config/env';

// Railway対応のAPI設定
const getApiKey = () => getGeminiApiKey() || getOpenAIApiKey();

// エラーハンドリング用の設定
const API_CONFIG = {
  maxRetries: 1, // ユーザー体験向上のためリトライを最小限に
  timeout: 60000,
  retryDelay: 1000,
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
const callAIWithRetry = async (prompt: string, systemMessage: string, maxTokens: number = 1200): Promise<any> => {
  let lastError: Error | null = null;
  const baseUrl = ""; // プロキシ経由のため空にする
  // プロキシ（/api）経由で呼び出す
  const endpoint = "/api/gemini-proxy";
  const model = "gemini-pro";
  
  for (let attempt = 1; attempt <= API_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
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
        
        if (response.status === 429) {
          throw new Error('API呼び出し制限に達しました。しばらく待ってから再度お試しください。');
        } else if (response.status === 401) {
          throw new Error('APIキーが無効です。設定を確認してください。');
        } else if (response.status >= 500) {
          throw new Error('サーバーエラーが発生しました。しばらく待ってから再度お試しください。');
        } else {
          throw new Error(`API error: ${response.status} - ${errorMessage}`);
        }
      }

      const data = await response.json();
      return data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ API呼び出し失敗（${isGeminiAvailable() ? 'Gemini' : 'OpenAI'} 試行 ${attempt}）:`, lastError.message);
      
      if (attempt < API_CONFIG.maxRetries) {
        const delay = API_CONFIG.retryDelay * attempt;
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
  isError?: boolean; // エラー時のフラグを追加
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
【本格占星術分析：太陽の輝き】

あなたは30年以上の経験を持つ、魂を読み解く占星術師です。
太陽星座を中心とした「魂の基本設計」と「今日の運命」を、Geminiの高度な知能を用いて多角的に分析してください。

【クライアント情報】
名前: ${birthData.name}
太陽星座: ${sunSign}
今日の日付: ${new Date().toLocaleDateString('ja-JP')}

【分析の指針】
1. 表面的な言葉ではなく、クライアントの深層心理に届く、詩的で格調高い日本語を用いてください。
2. 各項目の文字数は150文字〜200文字程度を目標に、たっぷりと記述してください。
3. 抽象的な「運の良し悪し」ではなく、「なぜそう感じるのか」「どう行動すべきか」を具体的に示してください。

【出力形式】
必ず以下のJSON形式のみでご回答ください。

{
  "personalityInsights": {
    "corePersonality": "太陽星座が示す魂の核となる性質。強み、課題、そしてこの人生で果たすべき使命を150-200文字で深く考察してください。",
    "hiddenTraits": "自分でも気づいていない内面の神聖な特徴を100-120文字で。",
    "lifePhilosophy": "あなたが無意識に守っている人生の美学や哲学を100-120文字で。",
    "relationshipStyle": "他者との魂の交流において、あなたが放つ独特の光と調和の取り方を100-120文字で。",
    "careerTendencies": "社会という舞台であなたが最も輝くための、天賦の才能と働き方を100-120文字で。"
  },
  "detailedFortune": {
    "overallTrend": "今の宇宙の星々があなたに送っている主要なメッセージ。現在の運気の波と乗りこなし方を150-200文字で。",
    "loveLife": "愛の星がもたらす調べ。パートナーや大切な人との絆を深めるための秘訣を120-150文字で。",
    "careerPath": "現時点での社会的なチャンスと、取り組むべき具体的な課題を120-150文字で。",
    "healthWellness": "心と体の調和を保つためのスピリチュアルな視点からのアドバイスを100-120文字で。",
    "financialProspects": "豊かさを引き寄せるためのマインドセットと、具体的な金銭管理の知恵を100-120文字で。",
    "personalGrowth": "今、あなたが魂のレベルで進化するために必要な学びを100-120文字で。"
  },
  "todaysFortune": {
    "overallLuck": "今日という一日を最高のものにするための、宇宙からのエールを120-150文字で。",
    "loveLuck": "今日の愛の運気。一言の魔法や、小さな気遣いがもたらす奇跡を100文字程度で。",
    "workLuck": "今日の創造的活動。最高のパフォーマンスを出すための集中ポイントを100文字程度で。",
    "healthLuck": "今日の心身のリフレッシュ方法。五感を満たす具体的なセルフケアを100文字程度で。",
    "moneyLuck": "今日の豊かさの循環。幸運を呼ぶお金の使い方や意識を100文字程度で。",
    "todaysAdvice": "【開運アクション】今日行うべき具体的な一歩と、ラッキーアイテムを100文字程度で。"
  }
}

【厳守事項】
- JSON以外のテキストは絶対に出力しないでください。
- すべての文章を「です・ます」調で統一し、美しく洗練された言葉を選んでください。
- 指定された文字数を目安に、Geminiならではの深い洞察を含めてください。
`;
};

// プロンプト生成関数（Level3詳細分析専用）
const generateLevel3DetailedAnalysisPrompt = (
  birthData: BirthData,
  planets: PlanetPosition[]
): string => {
  return `
【至高の占星術鑑定：星々の共鳴】

あなたは30年以上の経験を持つ、天体と魂の対話を読み解く世界最高の占星術師です。
10天体すべての配置（星座と度数）を使い、クライアントの人生の設計図を究極の深度で解読してください。

【クライアント情報】
名前: ${birthData.name}
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}

【天体配置（出生チャート）】
${planets.map(p => `${p.planet}: ${p.sign}座 ${p.degree.toFixed(1)}度`).join('\n')}

【分析の重要指針】
1. 各天体の役割を統合し、人生の多層的な構造を明らかにしてください。
2. 「〇〇座の〇〇星と、〇〇座の〇〇星の配置から〜」といった、技術的な根拠を必ず文章の要所に含めてください。
3. 各項目の文字数は250文字〜300文字程度を目標に、圧倒的なボリュームと質で回答してください。
4. マークダウン記号は一切使わず、読みやすく美しい日本語（ですます調）を徹底してください。

【出力形式】
必ず以下のJSON形式のみでご回答ください。

{
  "personalityInsights": {
    "corePersonality": "太陽・月・上昇星座の3つの柱が織りなす、あなたの存在の根源的なテーマ。なぜ今この性格として現れているのか、魂の遍歴を含めて300文字程度で解説してください。",
    "hiddenTraits": "月星座がどの星座にあるかの影響を詳しく記述。内面の感情の動きと、それが周囲に与える印象を含めて250文字程度で。",
    "lifePhilosophy": "木星・土星・社会天体が示す、あなたの道徳観と試練。この社会であなたが築き上げるべき金字塔について250文字程度で。",
    "relationshipStyle": "金星・火星・月の配置から導き出される、あなたの愛の器と他者との境界線。魂レベルで惹かれ合う縁の形を250文字程度で。",
    "careerTendencies": "MCや10ハウス、太陽・土星の配置から導き出される究極のキャリアパス。社会的な顔と成功へのアプローチ方法を具体的に250文字程度で。"
  },
  "detailedFortune": {
    "overallTrend": "現在、天空を巡る天体（トランジット）があなたの出生図に与えている決定的な影響。今、宇宙からあなたに手渡されている「運命の鍵」について300文字程度で。",
    "loveLife": "現在の金星と火星の状態から見た、愛の成就のための具体的なステップ。今この瞬間に磨くべき内面の輝きを250文字程度で。",
    "careerPath": "今の天体のリズムに同調し、社会的な成功を掴むための戦略的なアドバイス。どのタイミングで動き、何を控えるべきか250文字程度で。",
    "healthWellness": "天体のエレメントバランス（火・地・風・水）から見た、あなたのエネルギー管理術。心身の健やかさを保つための、あなただけの儀式について250文字程度で。",
    "financialProspects": "宇宙の豊かさ（アバンダンス）と繋がるための、現在の金運の波。投資すべき対象や、手放すべき執着を250文字程度で。",
    "personalGrowth": "外惑星（天王星・海王星・冥王星）がもたらす、あなたの魂の変容の物語。今、どのような脱皮を求められているかを300文字程度で。"
  },
  "tenPlanetSummary": {
    "overallInfluence": "10天体の配置から導き出される、あなたの人生の「支配的な旋律」。どのような星のエネルギーが、あなたの物語を動かしているかを250文字程度で。",
    "communicationStyle": "水星の智慧がもたらす、あなたの言葉と知性の個性。世界とどのように繋がり、理解し合うのかを250文字程度で。",
    "loveAndBehavior": "金星と月の共鳴が生み出す、あなたの感性と情熱の源泉。何に感動し、どう愛を表現するのかを250文字程度で。",
    "workBehavior": "火星と土星の厳格な均衡が生む、あなたの実行力と忍耐の形。困難を突破し、現実を変えるための力について250文字程度で。",
    "transformationAndDepth": "外惑星があなたの無意識に刻んだ、神秘的な探究心と変革の種。時代を超えてあなたが追求すべき真実について250文字程度で。"
  }
}
`;
};

// AIの出力からマークダウン（**）を除去または変換するユーティリティ
const cleanAIOutput = (text: any): any => {
  if (typeof text === 'string') {
    // **テキスト** を 【テキスト】 に変換
    return text.replace(/\*\*(.*?)\*\*/g, '【$1】');
  } else if (Array.isArray(text)) {
    return text.map(item => cleanAIOutput(item));
  } else if (text !== null && typeof text === 'object') {
    const cleaned: any = {};
    for (const key in text) {
      cleaned[key] = cleanAIOutput(text[key]);
    }
    return cleaned;
  }
  return text;
};

// 強化されたAI API呼び出し関数
const callAIAPI = async (prompt: string, maxTokens: number = 1500): Promise<AIAnalysisResult> => {
  try {
    const data = await callAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ、世界最高峰の占星術師であり、同時に詩人でもあります。クライアントの魂を震わせるような、深く印象的な言葉で占ってください。マークダウン（**など）は絶対に使わず、JSON形式のみで回答してください。",
      maxTokens
    );
    const content = data.choices[0].message.content;
    console.log('🔍 【AI応答内容】:', content);
    
    // JSONを解析する前にマークダウンを除去（文字列内にある場合に対応）
    const aiResultRaw = cleanAIOutput(safeParseJSON(content));
    console.log('🔍 【JSON解析結果（クリーン後）】:', aiResultRaw);
    
    // 構造化データ（JSON）を、UIが表示可能なテキスト形式（【全体運】...）に変換して保持する
    const result = mapAIResponseToAIAnalysisResult(aiResultRaw);
    
    // 既存の FortuneParser が期待する形式（【項目名】内容）の文字列を生成
    let legacyFormatString = "";
    
    // 確実に各セクションを文字列として結合する
    if (aiResultRaw.todaysFortune) {
      const tf = aiResultRaw.todaysFortune;
      legacyFormatString = [
        `【全体運】\n${tf.overallLuck || '良好です。'} 評価: ★★★★☆`,
        `【恋愛運】\n${tf.loveLuck || '安定しています。'} 評価: ★★★★☆`,
        `【仕事運】\n${tf.workLuck || '順調です。'} 評価: ★★★★★`,
        `【健康運】\n${tf.healthLuck || '問題ありません。'} 評価: ★★★★☆`,
        `【金銭運】\n${tf.moneyLuck || '堅実です。'} 評価: ★★★★☆`,
        `【アドバイス】\n${tf.todaysAdvice || '落ち着いて行動しましょう。'}`
      ].join('\n\n');
    } else if (aiResultRaw.detailedFortune) {
      const df = aiResultRaw.detailedFortune;
      legacyFormatString = [
        `【全体運】\n${df.overallTrend || '良好です。'} 評価: ★★★★☆`,
        `【恋愛運】\n${df.loveLife || '安定しています。'} 評価: ★★★★☆`,
        `【仕事運】\n${df.careerPath || '順調です。'} 評価: ★★★★★`,
        `【健康運】\n${df.healthWellness || '問題ありません。'} 評価: ★★★★☆`,
        `【金銭運】\n${df.financialProspects || '堅実です。'} 評価: ★★★★☆`,
        `【成長運】\n${df.personalGrowth || '上昇傾向です。'} 評価: ★★★★☆`
      ].join('\n\n');
    }
    
    // マッピング結果にこの文字列を付与（hooks側でこれを使用する）
    (result as any).rawText = legacyFormatString || content;
    
    console.log('🔍 【生成されたlegacyFormatString】:', (result as any).rawText);
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
      tenPlanetSummary: {
        overallInfluence: "現在AI分析が利用できません。基本的な占星術データをご覧ください。",
        communicationStyle: "現在AI分析が利用できません。",
        loveAndBehavior: "現在AI分析が利用できません。",
        workBehavior: "現在AI分析が利用できません。",
        transformationAndDepth: "現在AI分析が利用できません。"
      },
      planetAnalysis: {},
      aiPowered: false,
      isError: true
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
      const data = await callAIWithRetry(
        prompt,
        "あなたは宇宙の神秘を解き明かす賢者です。天体の動きが個人の魂に刻む唯一無二のメッセージを、美しく印象的な日本語で伝えてください。マークダウン（**など）は使わず、JSON形式のみで回答してください。",
        400
      );
      const content = data.choices[0].message.content;
      
      const parsed = cleanAIOutput(safeParseJSON(content));
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
  mode: 'simple' | 'level3' = 'level3'
): Promise<AIAnalysisResult> => {
  console.log('🔍 【generateAIAnalysis開始】モード:', mode, 'プラネット数:', planets.length);
  
  if (!isApiKeyAvailable()) {
    debugEnvConfig();
    throw new Error('APIキーが設定されていません。環境変数を確認してください。');
  }

  let baseResult: AIAnalysisResult;

  if (mode === 'simple') {
    // 簡単占い: 太陽星座中心の基本分析
    const sunPlanet = planets.find(p => p.planet === '太陽' || p.planet === 'Sun');
    const sunSign = sunPlanet?.sign || '牡羊座';
    
    const simplePrompt = generateSimpleAnalysisPrompt(birthData, sunSign);
    baseResult = await callAIAPI(simplePrompt, 1500);
    
    // 簡単占いでは主要な天体のみ分析
    const mainPlanets = planets.filter(p => 
      ['太陽', 'Sun', '月', 'Moon', '上昇星座', 'Ascendant'].includes(p.planet)
    );
    const planetAnalysis = mainPlanets.length > 0 
      ? await generatePlanetAnalysisAll(birthData, mainPlanets.slice(0, 2))
      : {};

    return {
      ...baseResult,
      planetAnalysis,
      aiPowered: true
    };
  } else {
    // Level3詳細分析
    const level3Prompt = generateLevel3DetailedAnalysisPrompt(birthData, planets);
    baseResult = await callAIAPI(level3Prompt, 3500);

    // 全天体の分析を並列取得
    const planetAnalysis = await generatePlanetAnalysisAll(birthData, planets);

    console.log('🔍 【Level3分析完了】');
    return {
      ...baseResult,
      planetAnalysis,
      aiPowered: true
    };
  }
};

// ... existing code ...

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
  if (!isApiKeyAvailable()) {
    debugEnvConfig();
    throw new Error('OpenAI APIキーが設定されていません。環境変数を確認してください。');
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

  const data = await callAIWithRetry(
    contextPrompt,
    "あなたは、クライアントの人生の旅路に寄り添う賢明な導き手です。星々の言葉を借りて、魂の深淵に触れるような、慈愛と洞察に満ちた対話を行ってください。マークダウン（**など）は一切使わず、400-600文字程度で、具体的かつ心に刻まれるアドバイスを提供してください。",
                1200
  );

  return cleanAIOutput(data.choices[0].message.content);
};

// 天体×星座ごとにAI分析を行う関数
export async function analyzePlanetSignWithAI(planet: string, sign: string): Promise<{ signCharacteristics: string, personalImpact: string, advice: string }> {
  const prompt = `
【天体分析依頼】
「${planet}」が「${sign}」にある場合の性格・運勢・アドバイスを、宇宙の深淵を感じさせる言葉で200文字以上の日本語で教えてください。
必ずですます調で統一し、JSON形式で下記のように出力してください。
{
  "signCharacteristics": "...",
  "personalImpact": "...",
  "advice": "..."
}`;
  const data = await callAIWithRetry(
    prompt,
    "あなたは数千年の歴史を持つ星の知恵の継承者です。深い洞察を持って回答してください。",
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
以下の天体組み合わせとアスペクトについて、その人の内なる響きを60文字以上100文字以内で、美しい日本語（です・ます調）で説明してください。

【天体組み合わせ】: ${planet1} と ${planet2}
【アスペクトタイプ】: ${aspectType}
【アスペクトの性質】: ${aspectMeaning}

【回答形式】
- 詩的でありながら、その人の魂の具体的な特徴を突いた表現にする
- 丁寧語（です・ます調）で記述する
- 60文字以上100文字以内で
- 天体名は含めず、影響の内容のみを記述

上記の形式で、${planet1}と${planet2}の${aspectType}の影響について回答してください。:`;

    const data = await callAIWithRetry(
      prompt,
      "あなたは魂の旋律を読み解く音楽家のような占星術師です。天体間の対話が奏でる、その人だけの美しい個性を説明してください。マークダウン（**など）は絶対に使用しないでください。",
      150
    );

    const description = cleanAIOutput(data.choices[0].message.content.trim());
    
    // AIの回答から不要な部分を除去
    const cleanDescription = description
      .replace(/^.*?:/, '') // コロンより前を削除
      .replace(/【.*?】.*/, '') // 【】付きの説明を削除
      .replace(/^[「『]/, '') // 開始の括弧を削除
      .replace(/[」』]$/, '') // 終了の括弧を削除
      .trim();
    
    return cleanDescription || `${planet1}と${planet2}の${aspectType}により、特別な光があなたに宿っています。`;
    
  } catch (error) {
    console.error('AI天体組み合わせ説明生成エラー:', error);
    return `${planet1}と${planet2}の響き合いが、あなたの物語に深みを与えています。`;
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
以下のアスペクトパターンについて、その人が持つ特別なギフトを100文字以上180文字以内で、心に響く日本語で説明してください。

【パターンタイプ】: ${patternType}
【関与する天体】: ${keyPlanets.join('、')}
【パターン名】: ${patternName}

【回答形式】
- 神秘的な絵文字から始める（✨、🌌、💎、📜、☄️のいずれか適切なもの）
- パターン名を印象的に含める
- その人が持つ、この配置ならではの「魂の使命」や「天賦の才」に触れる
- 100文字以上180文字以内

上記の要件で${patternType}について説明してください。`;

    const data = await callAIWithRetry(
      prompt,
      "あなたは運命の糸を紡ぐ賢者です。複雑な星の図形が描く、その人だけの特別な運命の形を解き明かしてください。マークダウン（**など）は絶対に使用しないでください。",
      200
    );

    const description = cleanAIOutput(data.choices[0].message.content.trim());
    
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
