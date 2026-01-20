import { BirthData, PlanetPosition } from "../types";
import { safeParseJSON, mapAIResponseToAIAnalysisResult } from './aiAnalyzerUtils';
import { getOpenAIApiKey, getGeminiApiKey, isApiKeyAvailable, isGeminiAvailable, debugEnvConfig, getApiBaseUrl } from '../config/env';
import { calculatePlanetsAtDate } from './astronomyCalculator';

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
  soulPortrait?: {
    keynote: string;     // あなたの本当の性格と、人生のテーマ
    dynamics: string;    // 授かった才能と、気をつけるべき点
    advice: string;      // 今、あなたへ伝えたいアドバイス
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
  sunSign: string,
  period: string = 'today',
  transitPlanets: PlanetPosition[] = []
): string => {
  const now = new Date();
  const targetDate = new Date(now);
  
  const periodLabels: any = {
    today: '今日', tomorrow: '明日', thisWeek: '今週', nextWeek: '来週',
    thisMonth: '今月', nextMonth: '来月', threeMonths: '3ヶ月間', sixMonths: '半年間', oneYear: '1年間'
  };

  if (period === 'tomorrow') targetDate.setDate(now.getDate() + 1);
  if (period === 'thisWeek') targetDate.setDate(now.getDate() + 7);
  
  const targetPeriod = periodLabels[period] || '今日';
  const dateStr = targetDate.toLocaleDateString('ja-JP');

  // トランジット（現在の空の星）の情報を文字列化
  const transitList = transitPlanets.length > 0 
    ? transitPlanets.map(p => p.planet + ": " + p.sign + "座 " + p.degree.toFixed(1) + "度").join('\n')
    : "（トランジットデータ取得中）";

  return `【至高の占星術鑑定：太陽の輝き】

あなたは30年以上の経験を持つ、魂を読み解く世界最高峰の占星術師であり、同時に優れた文学者です。
太陽星座を中心とした「魂の基本設計」と「${targetPeriod}（${dateStr}）の運命」を、深遠な知性を用いて多角的に分析してください。

【クライアント情報】
名前: ${birthData.name}
太陽星座: ${sunSign}
鑑定対象期間: ${targetPeriod}（${dateStr}を基準とした分析）
今日の日付: ${now.toLocaleDateString('ja-JP')}

【${targetPeriod}の天空の配置（トランジット）】
${transitList}

【鑑定の重要指針】
1. ${targetPeriod}の特定の星の動きを読み解く:
   上記の「トランジットの配置」が、クライアントの太陽星座にどのような具体的なエネルギーを投げかけているかを分析してください。例えば、トランジットの火星が太陽とどのような角度にあるか、といった具体的なアスペクトを考慮に入れ、${targetPeriod}にしか起こり得ない特別な変化を記述してください。
2. 辞書的な説明は厳禁です:
   「太陽が牡羊座だから行動的です」といった子供騙しの解説は絶対に避け、その配置が人生の葛藤や、秘められた渇望にどう影響しているのか、多層的な物語として綴ってください。
2. 星々の響き合いを重視して:
   単一の星座解説に留まらず、太陽が示す「生命の目的」が、今の宇宙のリズムとどう共鳴しているかを重視してください。
3. 文学的かつ具体的で心に刺さるトーン:
   格調高い表現を用いつつも、抽象的になりすぎず、読み手が「自分の今の状況や性格を言い当てられた」と実感できる具体的で明確な言葉を選んでください。詩的な美しさと、人生の指針となる実用性を両立させてください。

【出力形式】
必ず以下のJSON形式のみでご回答ください。値（Value）には、項目名や【】などの見出しを含めず、本文のみを記述してください。

{
  "soulPortrait": {
    "keynote": "太陽星座が示す、あなたの根本的な性質と人生で目指すべき方向性を200文字程度で分かりやすく説明してください。",
    "dynamics": "あなたが生まれ持った強みと、逆に注意が必要な落とし穴や克服すべき課題について、バランスよく150-200文字で説明してください。",
    "advice": "今の運勢を踏まえ、より良く過ごすために今日からすぐに実行できる具体的な行動を150文字程度で提案してください。"
  },
  "personalityInsights": {
    "corePersonality": "太陽が示す魂の核。200文字程度。",
    "hiddenTraits": "内面の神聖な特徴。120文字程度。",
    "lifePhilosophy": "守っている人生の美学。120文字程度。",
    "relationshipStyle": "他者との魂の交流。120文字程度。",
    "careerTendencies": "社会という舞台での天賦の才能。120文字程度。"
  },
  "todaysFortune": {
    "overallLuck": "${targetPeriod}の宇宙からのメッセージ。150文字程度。",
    "loveLuck": "${targetPeriod}の愛の運気。100文字程度。",
    "workLuck": "${targetPeriod}の創造的活動。100文字程度。",
    "healthLuck": "${targetPeriod}のセルフケア。100文字程度。",
    "moneyLuck": "${targetPeriod}の豊かさの循環。100文字程度。",
    "todaysAdvice": "【開運アクション】${targetPeriod}をより良く過ごすための具体的な一歩。100文字程度。"
  }
}

【厳守事項】
- JSON以外のテキストは絶対に出力しないでください。
- すべての文章を「です・ます」調で統一し、美しく洗練された言葉を選んでください。
- 読み手が「自分自身の物語」として深く納得できる洞察を含めてください。`;
};

// プロンプト生成関数（Level3詳細分析専用）
const generateLevel3DetailedAnalysisPrompt = (
  birthData: BirthData,
  planets: PlanetPosition[],
  period: string = 'today',
  transitPlanets: PlanetPosition[] = []
): string => {
  const now = new Date();
  const targetDate = new Date(now);
  
  const periodLabels: any = {
    today: '今日', tomorrow: '明日', thisWeek: '今週', nextWeek: '来週',
    thisMonth: '今月', nextMonth: '来月', threeMonths: '3ヶ月間', sixMonths: '半年間', oneYear: '1年間'
  };

  if (period === 'tomorrow') targetDate.setDate(now.getDate() + 1);
  if (period === 'thisWeek') targetDate.setDate(now.getDate() + 7);
  
  const targetPeriod = periodLabels[period] || '今日';
  const dateStr = targetDate.toLocaleDateString('ja-JP');
  
  const planetList = planets.map(p => p.planet + ": " + p.sign + "座 " + p.degree.toFixed(1) + "度").join('\n');
  const transitList = transitPlanets.length > 0 
    ? transitPlanets.map(p => p.planet + ": " + p.sign + "座 " + p.degree.toFixed(1) + "度").join('\n')
    : "（トランジットデータ取得中）";

  return `【究極の占星術鑑定：星々の共鳴】

あなたは30年以上の経験を持つ、天体と魂の対話を読み解く世界最高の占星術師であり、同時に優れた文学者です。
10天体すべての配置を使い、クライアントの人生の設計図と${targetPeriod}（${dateStr}）の運勢を、究極の深度で一つの壮大な叙事詩として解読してください。

【クライアント情報】
名前: ${birthData.name}
鑑定対象期間: ${targetPeriod}（${dateStr}を基準とした分析）
生年月日: ${birthData.birthDate.toLocaleDateString('ja-JP')}
出生時刻: ${birthData.birthTime}
出生地: ${birthData.birthPlace.city}

【天体配置（出生チャート：ネイタル）】
${planetList}

【${targetPeriod}の天空の配置（トランジット）】
${transitList}

【鑑定の重要指針】
1. ネイタルとトランジットの「共鳴」を読み解く:
   出生チャート（ネイタル）の天体と、今の空の天体（トランジット）が形成するアスペクトを重視してください。例えば「運行中の木星が、出生の太陽に合となっているため、${targetPeriod}は大きな拡大の好機である」といった、占星術的に裏付けのある具体的な記述を行ってください。「今日」や「明日」の微細な変化を、この共鳴関係から導き出してください。
2. 辞書的な説明は厳禁です:
   「水星が双子座だからおしゃべりです」といった解釈は厳禁です。その配置が、その人の人生の葛藤や、秘められた渇望にどう影響しているのか、多層的な物語として綴ってください。
2. 10天体の「オーケストラ」を意識して:
   個別の天体解説で終わらず、天体同士がどう響き合っているかを重視してください。例えば、冷静な水星が情熱的な火星をどう制御しているか、あるいは土星の重圧が月をどう鍛え上げているか等。
3. 文学的かつ具体的で心に刺さるトーン:
   格調高い表現を用いつつも、抽象的になりすぎず、読み手が「自分の今の状況や性格を言い当てられた」と実感できる具体的で明確な言葉を選んでください。詩的な美しさと、人生の指針となる実用性を両立させてください。読み終わった後に「自分の人生を一本の映画のように感じられる」ような体験を提供してください。

【出力形式】
必ず以下のJSON形式のみでご回答ください。値（Value）には、項目名や【】などの見出しを含めず、本文のみを記述してください。

{
  "soulPortrait": {
    "keynote": "10天体の配置から読み取れる、あなたの根本的な資質と人生全体の大きなテーマを300文字程度で分かりやすく説明してください。",
    "dynamics": "あなたが星から授かった特別な才能と、陥りやすいパターンや注意すべき点について、250-300文字で具体的に説明してください。",
    "advice": "今の星の動きを味方につけ、より自分らしく輝くために今日からできる具体的なアクションを200文字程度で提示してください。"
  },
  "personalityInsights": {
    "corePersonality": "存在の根源的なテーマ。魂の遍歴を含めて300文字程度。",
    "hiddenTraits": "月星座が示す内面の感情と神聖な特徴を250文字程度で。",
    "lifePhilosophy": "木星・土星が示す道徳観と金字塔について250文字程度で。",
    "relationshipStyle": "金星・火星が示す愛の器と魂レベルの縁について250文字程度で。",
    "careerTendencies": "太陽・土星・MCが示す究極のキャリアパスを250文字程度で。"
  },
  "detailedFortune": {
    "overallTrend": "${targetPeriod}において、天空を巡る天体があなたに手渡している「運命の鍵」について300文字程度で。",
    "loveLife": "${targetPeriod}の愛の成就のための具体的なステップと内面の輝きを250文字程度で。",
    "careerPath": "${targetPeriod}の天体のリズムに同調し、成功を掴むための戦略を250文字程度で。",
    "healthWellness": "${targetPeriod}の心身の健やかさを保つための、あなただけの儀式について250文字程度で。",
    "financialProspects": "${targetPeriod}の豊かさと繋がるための意識変革と具体的な知恵を250文字程度で。",
    "personalGrowth": "${targetPeriod}において、どのような魂の脱皮を求められているかを300文字程度で。"
  },
  "tenPlanetSummary": {
    "overallInfluence": "10天体が奏でる「支配的な旋律」についての短い要約（150文字程度）。",
    "communicationStyle": "水星の智慧がもたらす知性の個性（150文字程度）。",
    "loveAndBehavior": "金星と月の共鳴が生む感性と情熱（150文字程度）。",
    "workBehavior": "火星と土星の均衡が生む実行力（150文字程度）。",
    "transformationAndDepth": "外惑星が刻んだ無意識の変革（150文字程度）。"
  }
}

【厳守事項】
- JSON以外のテキストは絶対に出力しないでください。
- マークダウン記号（**など）は使わず、美しく洗練された日本語（ですます調）を徹底してください。
- 圧倒的なボリュームと質で、読み手の魂を震わせる回答をしてください。`;
};

// AIの出力からマークダウン（**）や不要な評価文言を除去または変換するユーティリティ
const cleanAIOutput = (text: any): any => {
  if (typeof text === 'string') {
    // **テキスト** を 【テキスト】 に変換
    let cleaned = text.replace(/\*\*(.*?)\*\*/g, '【$1】');
    // 「評価: ★★★★☆」のような文言、および新旧のセクションタイトルを完全に削除（前後の空行やスペースも含む）
    cleaned = cleaned.replace(/(?:運勢評価|評価|スコア)\s*:[★☆\d\s\/]+/g, '')
      .replace(/【?\s*(?:魂の肖像|Soul Portrait|魂の基調講演|光と影のダイナミクス|星々からの具体的な助言)\s*】?\s*/g, '')
      .replace(/【?\s*(?:あなたの本当の性格と、人生のテーマ|授かった才能と、気をつけるべき点|今、あなたへ伝えたいアドバイス)\s*】?\s*/g, '');
    return cleaned.trim();
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
const callAIAPI = async (prompt: string, period: string = 'today', maxTokens: number = 1500): Promise<AIAnalysisResult> => {
  try {
    const data = await callAIWithRetry(
      prompt,
      "あなたは30年以上の経験を持つ、世界最高峰の占星術師であり、優れた文学者です。クライアントの魂を震わせるような深く洗練された言葉を用いつつ、かつ具体的で納得感のある鑑定を行ってください。抽象的な詩的表現に終始せず、その人の人生の現実（性格、葛藤、指針）に即した明確な洞察を提供してください。マークダウン（**など）は絶対に使わず、また「評価: ★★★★☆」のような運勢評価文言も一切含めないでください。JSON形式のみで回答してください。",
      maxTokens
    );
    const content = data.choices[0].message.content;
    console.log('🔍 【AI応答内容】:', content);
    
    // JSONを解析する前にマークダウンを除去（文字列内にある場合に対応）
    const aiResultRaw = cleanAIOutput(safeParseJSON(content));
    console.log('🔍 【JSON解析結果（クリーン後）】:', aiResultRaw);
    
    // 構造化データ（JSON）を、UIが表示可能なテキスト形式（【全体運】...）に変換して保持する
    const result = mapAIResponseToAIAnalysisResult(aiResultRaw);
    
    // 期間ラベルの準備
    const periodLabels: any = {
      today: '今日', tomorrow: '明日', thisWeek: '今週', nextWeek: '来週',
      thisMonth: '今月', nextMonth: '来月', threeMonths: '3ヶ月間', sixMonths: '半年間', oneYear: '1年間'
    };
    const targetPeriod = periodLabels[period] || '今日';

    // 既存の FortuneParser が期待する形式（【項目名】内容）の文字列を生成
    let legacyFormatString = "";
    
    // 確実に各セクションを文字列として結合する
    if (aiResultRaw.todaysFortune) {
      const tf = aiResultRaw.todaysFortune;
      const fortuneParts = [];
      fortuneParts.push(`【${targetPeriod}の全体運】\n` + (tf.overallLuck || "星々の配置を詳しく分析しています。"));
      fortuneParts.push(`【${targetPeriod}の恋愛運】\n` + (tf.loveLuck || "感情のバイオリズムを読み解いています。"));
      fortuneParts.push(`【${targetPeriod}の仕事運】\n` + (tf.workLuck || "創造的なエネルギーの流れを確認しています。"));
      fortuneParts.push(`【${targetPeriod}の健康運】\n` + (tf.healthLuck || "心身のバランスの状態を抽出しています。"));
      fortuneParts.push(`【${targetPeriod}の金銭運】\n` + (tf.moneyLuck || "豊かさの循環の兆しを読み取っています。"));
      fortuneParts.push(`【${targetPeriod}のアドバイス】\n` + (tf.todaysAdvice || "星々の囁きから具体的な助言をまとめています。"));
      legacyFormatString = fortuneParts.join("\n\n");
    } else if (aiResultRaw.detailedFortune) {
      const df = aiResultRaw.detailedFortune;
      const fortuneParts = [];
      fortuneParts.push(`【${targetPeriod}の全体運】\n` + (df.overallTrend || "運命のうねりを深く解読しています。"));
      fortuneParts.push(`【${targetPeriod}の恋愛運】\n` + (df.loveLife || "愛の星が綴る物語を紐解いています。"));
      fortuneParts.push(`【${targetPeriod}の仕事運】\n` + (df.careerPath || "成功への道筋を天体から読み解いています。"));
      fortuneParts.push(`【${targetPeriod}の健康運】\n` + (df.healthWellness || "エネルギーの調和状態を詳しく見ています。"));
      fortuneParts.push(`【${targetPeriod}の金銭運】\n` + (df.financialProspects || "豊かさの源泉との繋がりを分析しています。"));
      fortuneParts.push(`【${targetPeriod}の成長運】\n` + (df.personalGrowth || "魂の進化のプロセスを読み解いています。"));
      legacyFormatString = fortuneParts.join("\n\n");
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
  let prompt = "【天体分析依頼】\n\n";
  prompt += "以下の出生データと天体情報をもとに、必ずですます調で簡潔に分析してください。\n";
  prompt += "※重要：すべての文章は「です」「ます」「でしょう」「されます」などの丁寧語で終わらせてください。\n\n";
  prompt += "【クライアント情報】\n";
  prompt += "名前: " + birthData.name + "\n";
  prompt += "生年月日: " + birthData.birthDate.toLocaleDateString('ja-JP') + "\n";
  prompt += "出生時刻: " + birthData.birthTime + "\n";
  prompt += "出生地: " + birthData.birthPlace.city + "\n\n";
  prompt += "【天体情報】\n";
  prompt += planet.planet + ": " + planet.sign + "座 " + planet.degree.toFixed(1) + "度\n\n";
  prompt += "【出力形式】\n";
  prompt += "必ず以下のJSON形式のみで回答してください。キーは英語、値は日本語（必ずですます調）で記述してください。\n";
  prompt += "{\n";
  prompt += '  "signCharacteristics": "' + planet.planet + '星座の特徴を40-60文字で簡潔に、必ずですます調で記述",\n';
  prompt += '  "personalImpact": "あなたへの影響を40-60文字で簡潔に、必ずですます調で記述",\n';
  prompt += '  "advice": "具体的なアドバイスを40-60文字で簡潔に、必ずですます調で記述"\n';
  prompt += "}\n\n";
  prompt += "【厳守事項】\n";
  prompt += "- JSON以外のテキストや説明文は絶対に出力しないでください\n";
  prompt += "- JSONの前後に余計な文字や改行を入れないでください\n";
  prompt += "- 各項目を50-70文字で簡潔に記述してください\n";
  prompt += "- 「あなたの太陽は○○座にあり」のような表現は絶対に使用しないでください\n";
  prompt += "- 必ず上記のJSON形式のみで回答してください\n";
  return prompt;
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
  mode: 'simple' | 'level3' = 'level3',
  period: string = 'today'
): Promise<AIAnalysisResult> => {
  console.log('🔍 【generateAIAnalysis開始】モード:', mode, '期間:', period, 'プラネット数:', planets.length);
  
  if (!isApiKeyAvailable()) {
    debugEnvConfig();
    throw new Error('APIキーが設定されていません。環境変数を確認してください。');
  }

  // 指定された期間のトランジット（現在の空の星）を計算
  const now = new Date();
  const targetDate = new Date(now);
  if (period === 'tomorrow') targetDate.setDate(now.getDate() + 1);
  if (period === 'thisWeek') targetDate.setDate(now.getDate() + 7);
  // 他の期間も必要に応じて
  
  const transitPlanets = await calculatePlanetsAtDate(targetDate);

  let baseResult: AIAnalysisResult;

  if (mode === 'simple') {
    // 簡単占い: 太陽星座中心の基本分析
    const sunPlanet = planets.find(p => p.planet === '太陽' || p.planet === 'Sun');
    const sunSign = sunPlanet?.sign || '牡羊座';
    
    const simplePrompt = generateSimpleAnalysisPrompt(birthData, sunSign, period, transitPlanets);
    baseResult = await callAIAPI(simplePrompt, period, 1500);
    
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
    const level3Prompt = generateLevel3DetailedAnalysisPrompt(birthData, planets, period, transitPlanets);
    baseResult = await callAIAPI(level3Prompt, period, 3500);

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
      recentFortuneInfo = `\n【本日のお手軽12星座占い結果】\n星座: ${fortuneData.sunSign}\n期間: ${fortuneData.period === 'today' ? '今日' : fortuneData.period === 'tomorrow' ? '明日' : fortuneData.period}\n占い結果:\n${fortuneData.result}\n`;
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
        behaviorPatternInfo = `\n【本日の星が伝えるあなたの印象診断結果（5つの項目）】\n期間: ${analysisData.period === 'today' ? '今日' : analysisData.period === 'tomorrow' ? '明日' : analysisData.period}\n\n🌟 総合的な影響:\n${summary.overallInfluence}\n\n💬 話し方の癖:\n${summary.communicationStyle}\n\n💕 恋愛や行動:\n${summary.loveAndBehavior}\n\n💼 仕事での振る舞い:\n${summary.workBehavior}\n\n🔮 変革と深層心理:\n${summary.transformationAndDepth}\n`;
      }
    } else {
      // 古い形式のフォールバック
      const oldKey = `level3_fortune_${birthData.name}_${new Date().toISOString().split('T')[0]}`;
      const storedLevel3Fortune = localStorage.getItem(oldKey);
      if (storedLevel3Fortune) {
        const fortuneData = JSON.parse(storedLevel3Fortune);
        behaviorPatternInfo = `\n【本日の星が伝えるあなたの印象診断結果】\n期間: ${fortuneData.period === 'today' ? '今日' : fortuneData.period === 'tomorrow' ? '明日' : fortuneData.period}\n占い結果:\n${fortuneData.result}\n`;
      }
    }
  } catch (error) {
    console.warn('Level3占い結果の読み込みエラー:', error);
  }

  // アスペクト情報の整理
  const aspectInfo = aspects && aspects.length > 0 
    ? aspects.filter(a => a.exactness >= 50)
        .map(a => a.planet1 + "と" + a.planet2 + ": " + a.definition.nameJa + "(" + a.type + ") - " + a.definition.meaning)
        .join('\n')
    : '基本的なアスペクト情報を参考にしています';

  const patternInfo = aspectPatterns && aspectPatterns.length > 0
    ? aspectPatterns.join('\n')
    : '特別なアスペクトパターンは検出されていません';

  const planetList = planets.map(p => p.planet + ": " + p.sign + "座 " + p.degree.toFixed(1) + "度").join('\n');
  const historyText = chatHistory.slice(-5).map(msg => (msg.role === 'user' ? 'クライアント' : '占星術師') + ": " + msg.content).join('\n');

  let contextPrompt = "【AI占い師チャット】\n\n";
  contextPrompt += "あなたは30年以上の経験を持つ世界最高の占星術師です。クライアントとの対話を通じて、深い洞察とアドバイスを提供します。\n\n";
  contextPrompt += "【クライアント情報】\n";
  contextPrompt += "名前: " + birthData.name + "\n";
  contextPrompt += "生年月日: " + birthData.birthDate.toLocaleDateString('ja-JP') + "\n";
  contextPrompt += "出生時刻: " + birthData.birthTime + "\n";
  contextPrompt += "出生地: " + birthData.birthPlace.city + "\n\n";
  contextPrompt += "【天体配置】\n" + planetList + "\n\n";
  contextPrompt += "【アスペクト分析（天体間の関係性）】\n" + aspectInfo + "\n\n";
  contextPrompt += "【特別なアスペクトパターン】\n" + patternInfo + "\n";
  contextPrompt += recentFortuneInfo + behaviorPatternInfo + "\n";
  contextPrompt += "【会話のカテゴリ】" + category + "\n\n";
  contextPrompt += "【これまでの会話履歴】\n" + historyText + "\n\n";
  contextPrompt += "【現在の質問】\n" + message + "\n\n";
  contextPrompt += "【重要な指示】\n";
  contextPrompt += "- 占星術の専門知識（天体配置、アスペクト、パターン）を活用して回答してください\n";
  contextPrompt += "- 天体間の関係性（アスペクト）を考慮した分析を含めてください\n";
  if (recentFortuneInfo) contextPrompt += "- 上記の「本日のお手軽12星座占い結果」がある場合は、その具体的な内容を踏まえて深掘りしてください\n";
  if (behaviorPatternInfo) contextPrompt += "- 上記の「本日の星が伝えるあなたの印象診断結果」がある場合は、その具体的な内容を踏まえて深掘りしてください\n";
  contextPrompt += "- 温かく親身になって答えてください\n";
  contextPrompt += "- 具体的で実践的なアドバイスを含めてください\n";
  contextPrompt += "- 希望と励ましを与える回答を心がけてください\n";
  contextPrompt += "- 400-600文字程度で、詳細で深掘りした内容を提供してください\n";
  contextPrompt += "- 「あなたの太陽は○○座にあり」のような表現は避けてください\n";
  contextPrompt += "- 具体的な時間帯、場所、方法、注意点を含めてください\n";
  contextPrompt += "- なぜそうなるのかという占星術的な理由も詳しく説明してください\n\n";
  contextPrompt += "【文章作成ルール（必ず守ること）】\n";
  contextPrompt += "- ですます調で丁寧に記載すること\n";
  contextPrompt += "- 具体的で詳細な内容を含めること\n";
  contextPrompt += "- チャットらしい親しみやすい表現を用いること\n";
  contextPrompt += "- 深掘りした分析と実践的なアドバイスを複数含めること\n\n";
  contextPrompt += "クライアントの質問に対して、占星術師として必ずですます調で丁寧に回答してください。\n";

  const data = await callAIWithRetry(
    contextPrompt,
    "あなたは、クライアントの人生の旅路に寄り添う賢明な導き手です。星々の言葉を借りて、魂の深淵に触れるような、慈愛と洞察に満ちた対話を行ってください。マークダウン（**など）は一切使わず、400-600文字程度で、具体的かつ心に刻まれるアドバイスを提供してください。",
    1200
  );

  return cleanAIOutput(data.choices[0].message.content);
};

// 天体×星座ごとにAI分析を行う関数
export async function analyzePlanetSignWithAI(planet: string, sign: string): Promise<{ signCharacteristics: string, personalImpact: string, advice: string }> {
  let prompt = "【天体分析依頼】\n";
  prompt += "「" + planet + "」が「" + sign + "」にある場合の性格・運勢・アドバイスを、宇宙の深淵を感じさせる言葉で200文字以上の日本語で教えてください。\n";
  prompt += "必ずですます調で統一し、JSON形式で下記のように出力してください。\n";
  prompt += "{\n";
  prompt += '  "signCharacteristics": "...",\n';
  prompt += '  "personalImpact": "...",\n';
  prompt += '  "advice": "..."\n';
  prompt += "}";

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
    let prompt = "以下の天体組み合わせとアスペクトについて、その人の内なる響きを60文字以上100文字以内で、美しい日本語（です・ます調）で説明してください。\n\n";
    prompt += "【天体組み合わせ】: " + planet1 + " と " + planet2 + "\n";
    prompt += "【アスペクトタイプ】: " + aspectType + "\n";
    prompt += "【アスペクトの性質】: " + aspectMeaning + "\n\n";
    prompt += "【回答形式】\n";
    prompt += "- 詩的でありながら、その人の魂の具体的な特徴を突いた表現にする\n";
    prompt += "- 丁寧語（です・ます調）で記述する\n";
    prompt += "- 60文字以上100文字以内で\n";
    prompt += "- 天体名は含めず、影響の内容のみを記述\n\n";
    prompt += "上記の形式で、" + planet1 + "と" + planet2 + "の" + aspectType + "の影響について回答してください。:";

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
    
    return cleanDescription || (planet1 + "と" + planet2 + "の" + aspectType + "により、特別な光があなたに宿っています。");
    
  } catch (error) {
    console.error('AI天体組み合わせ説明生成エラー:', error);
    return planet1 + "と" + planet2 + "の響き合いが、あなたの物語に深みを与えています。";
  }
};

// アスペクトパターン説明をAI動的生成する新機能
export const generateAspectPatternDescription = async (
  patternType: string,
  keyPlanets: string[],
  patternName: string
): Promise<string> => {
  try {
    let prompt = "以下のアスペクトパターンについて、その人が持つ特別なギフトを100文字以上180文字以内で、心に響く日本語で説明してください。\n\n";
    prompt += "【パターンタイプ】: " + patternType + "\n";
    prompt += "【関与する天体】: " + keyPlanets.join('、') + "\n";
    prompt += "【パターン名】: " + patternName + "\n\n";
    prompt += "【回答形式】\n";
    prompt += "- 神秘的な絵文字から始める（✨、🌌、💎、📜、☄️のいずれか適切なもの）\n";
    prompt += "- パターン名を印象的に含める\n";
    prompt += "- その人が持つ、この配置ならではの「魂の使命」や「天賦の才」に触れる\n";
    prompt += "- 100文字以上180文字以内\n\n";
    prompt += "上記の要件で" + patternType + "について説明してください。";

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
    
    return cleanDescription || (patternName + "のパターンがあなたの特別な個性を形作っています。この組み合わせを活かすことで、人生がより豊かになります。");
    
  } catch (error) {
    console.error('AIアスペクトパターン説明生成エラー:', error);
    
    // フォールバック：基本的な説明を返す
    return patternName + "のパターンにより、あなたには特別な才能や特徴があります。この組み合わせを理解し活用することで、より充実した人生を送ることができます。";
  }
};
