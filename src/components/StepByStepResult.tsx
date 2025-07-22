import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import { chatWithAIAstrologer, generateAIAnalysis, AIAnalysisResult } from '../utils/aiAnalyzer';
import { getTimeContextForAI } from '../utils/dateUtils';
import { confirmAndClearData } from '../utils/dataManager';
import AdBanner from './AdBanner';
import './StepByStepResult.css';

// 🔥 パフォーマンス最適化: デバッグ出力の制御
const isDevelopment = import.meta.env.DEV;
const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};
const debugError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// 表示レベルの定義
type DisplayLevel = 1 | 2 | 3;

// 期間選択のタイプ
type PeriodSelection = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'twoYears' | 'threeYears' | 'fiveYears';

interface StepByStepResultProps {
  mode?: 'simple' | 'detailed';
  selectedMode?: 'sun-sign' | 'three-planets' | 'ten-planets';
}

const StepByStepResult: React.FC<StepByStepResultProps> = ({ selectedMode }) => {
  const navigate = useNavigate();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);

  // 新しい占いを始めるための関数
  const startNewFortune = () => {
    const confirmed = confirmAndClearData(
      '「新しい占いを始める」をクリックしたら、登録しているお名前、生年月日、時刻、生まれた場所、これまでのあなたの分析結果が消去されます。よろしいですか？分析はもう一度実行することができます。'
    );
    
    if (confirmed) {
      // ページトップに移動
      window.scrollTo(0, 0);
      
      // 入力フォームページに遷移
      navigate('/');
    }
  };
  
  // selectedModeに基づいて初期レベルを設定
  const getInitialLevel = useCallback((): DisplayLevel => {
    debugLog('🔍 getInitialLevel - selectedMode:', selectedMode);
    if (selectedMode === 'three-planets') {
      debugLog('🔍 3天体モードのため、レベル2に設定');
      return 2;
    } else if (selectedMode === 'ten-planets') {
      debugLog('🔍 10天体モードのため、レベル3に設定');
      return 3;
    } else {
      debugLog('🔍 太陽星座モードのため、レベル1に設定');
      return 1;
    }
  }, [selectedMode]);
  
  const [currentLevel, setCurrentLevel] = useState<DisplayLevel>(() => {
    debugLog('🔍 初期レベル設定 - selectedMode:', selectedMode);
    if (selectedMode === 'three-planets') {
      debugLog('🔍 3天体モードのため、レベル2に設定');
      return 2;
    } else if (selectedMode === 'ten-planets') {
      debugLog('🔍 10天体モードのため、レベル3に設定');
      return 3;
    } else {
      debugLog('🔍 太陽星座モードのため、レベル1に設定');
      return 1;
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level1Fortune, setLevel1Fortune] = useState<string | null>(null);
  const [level2Fortune, setLevel2Fortune] = useState<string | null>(null);
  const [level3Fortune, setLevel3Fortune] = useState<string | null>(null);
  const [isGeneratingLevel1, setIsGeneratingLevel1] = useState(false);
  const [isGeneratingLevel2, setIsGeneratingLevel2] = useState(false);
  const [isGeneratingLevel3, setIsGeneratingLevel3] = useState(false);
  const [level3Analysis, setLevel3Analysis] = useState<AIAnalysisResult | null>(null);
  const [isGeneratingLevel3Analysis, setIsGeneratingLevel3Analysis] = useState(false);
  const [threePlanetsPersonality, setThreePlanetsPersonality] = useState<any>(null);
  const [isGeneratingThreePlanetsPersonality, setIsGeneratingThreePlanetsPersonality] = useState(false);
  const [showDataMissingMessage, setShowDataMissingMessage] = useState(false);


  // 星座情報
  const zodiacInfo: Record<string, { icon: string; description: string }> = {
    '牡羊座': { 
      icon: '♈', 
      description: '牡羊座のあなたは、活発で勇敢な性格の持ち主です。新しいことに挑戦するのが得意で、情熱的で行動力があります。美的センスに優れ、質の良いものを好み、安定した生活を目指しています。恋愛では、一途でのめり込みやすく、仕事では責任感を持って取り組める結婚を望みます。' 
    },
    '牡牛座': { 
      icon: '♉', 
      description: '牡牛座のあなたは、安定と実堅を重視する現実主義者です。しっかりと物事を考えてから行動することが多く、信頼性があります。美的センスに優れ、質の良いものを好むため、持続的な取り組みが得意です。恋愛では、一途でのめり込みやすく、質の良い深い関係を築くことを目指しています。' 
    },
    '双子座': { 
      icon: '♊', 
      description: '双子座のあなたは、好奇心旺盛で多才な性格です。コミュニケーション能力が高く、新しい情報を素早く吸収するのが得意です。変化を好み、様々なことに興味を持ちます。社交的で明るく、多くの人との繋がりを大切にします。' 
    },
    '蟹座': { 
      icon: '♋', 
      description: '蟹座のあなたは、家族や親しい人を大切にする愛情深い性格です。感受性が豊かで、他人の気持ちを理解するのが得意です。安全で居心地の良い環境を好み、伝統や過去を大切にします。' 
    },
    '獅子座': { 
      icon: '♌', 
      description: '獅子座のあなたは、堂々とした存在感を持つ生まれながらのリーダーです。創造性と表現力に優れ、注目を集めることを好みます。寛大で温かい心を持ち、周りの人を励ますことが得意です。' 
    },
    '乙女座': { 
      icon: '♍', 
      description: '乙女座のあなたは、細やかで完璧主義的な性格です。分析力と実用性を重視し、効率的に物事を進めることが得意です。誠実で献身的、他人のために尽くすことを厭いません。' 
    },
    '天秤座': { 
      icon: '♎', 
      description: '天秤座のあなたは、バランス感覚に優れた平和主義者です。美的センスが高く、調和を重視します。社交的で公正な判断を下すことが得意で、他人との協調を大切にします。' 
    },
    '蠍座': { 
      icon: '♏', 
      description: '蠍座のあなたは、深い洞察力と強い意志を持つ神秘的な性格です。情熱的で集中力があり、一度決めたことは最後までやり遂げます。真実を見極める能力に長けています。' 
    },
    '射手座': { 
      icon: '♐', 
      description: '射手座のあなたは、自由を愛する冒険家です。楽観的で哲学的な思考を持ち、新しい経験や知識を求めています。率直で正直な性格で、視野が広く寛容です。' 
    },
    '山羊座': { 
      icon: '♑', 
      description: '山羊座のあなたは、責任感が強く野心的な実践家です。目標に向かって着実に努力し、困難を乗り越える力があります。伝統を重んじ、長期的な視点で物事を考えます。' 
    },
    '水瓶座': { 
      icon: '♒', 
      description: '水瓶座のあなたは、独創的で人道的な理想主義者です。革新的なアイデアを持ち、未来志向です。友情を大切にし、個性や多様性を尊重します。' 
    },
    '魚座': { 
      icon: '♓', 
      description: '魚座のあなたは、直感的で感受性豊かな芸術家肌です。想像力が豊富で、他人の感情に敏感です。優しく慈悲深い性格で、スピリチュアルな世界に興味があります。' 
    }
  };

  // 期間選択オプション
  const periodOptions = {
    level1: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'nextWeek', label: '来週' },
    ],
    level2: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'nextWeek', label: '来週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'nextMonth', label: '来月' },
    ],
    level3: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'nextWeek', label: '来週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'nextMonth', label: '来月' },
      { value: 'threeMonths', label: '3か月' },
      { value: 'sixMonths', label: '半年' },
      { value: 'oneYear', label: '1年' },
      { value: 'twoYears', label: '2年' },
      { value: 'threeYears', label: '3年' },
      { value: 'fiveYears', label: '5年' },
    ]
  };

  // 太陽星座を取得
  const sunSign = horoscopeData?.planets.find(p => p.planet === '太陽')?.sign;

  // 固定テンプレートは削除しました - AIのみが占い結果を生成します

  // レベル1の占い生成
  const handleGenerateLevel1Fortune = async () => {
    if (!sunSign) {
      debugError('🔍 【占いエラー】sunSignが見つかりません');
      return;
    }
    
    debugLog('🔍 【レベル1占い開始】sunSign:', sunSign, 'selectedPeriod:', selectedPeriod);
    debugLog('🔍 【データ確認】birthData:', birthData);
    debugLog('🔍 【データ確認】horoscopeData:', horoscopeData);
    
    setIsGeneratingLevel1(true);
    
    try {
      // 過去のLevel1占い結果を読み込み（占い機能引き継ぎ用）
      let previousLevel1Context = '';
      try {
        const level1Key = `level1_fortune_${birthData?.name || 'user'}_${new Date().toISOString().split('T')[0]}`;
        const storedLevel1 = localStorage.getItem(level1Key);
        if (storedLevel1) {
          const fortuneData = JSON.parse(storedLevel1);
          previousLevel1Context = `

【参考：今日の12星座占い結果】
※以下の結果を参考に、継続性のある占いを提供してください

星座: ${fortuneData.sunSign}
期間: ${fortuneData.period === 'today' ? '今日' : fortuneData.period === 'tomorrow' ? '明日' : fortuneData.period}
前回の占い結果:
${fortuneData.result}
`;
        }
      } catch (error) {
        console.warn('Level1結果の読み込みエラー（占い用）:', error);
      }

      // AI分析を実行
      const timeContext = getTimeContextForAI();
      const randomId = Math.random().toString(36).substring(2, 8);
      const analysisPrompt = `
        あなたは親しみやすい占い師です。12星座占いが初めての方でも安心して楽しめるよう、以下の条件で占いを行ってください：
        - 12星座: ${sunSign}
        - 期間: ${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}
        - ランダムID: ${randomId}
        ${previousLevel1Context}
        
        ${timeContext}
        
        **重要な文章作成ルール（必ず守ること）**：
        - 占い初心者でも安心して読めるよう、優しく親しみやすい表現で
        - 専門用語や難しい言葉はできるだけ避けて、分かりやすく
        - ですます調で丁寧に記載すること
        - 30代の方向けですが、誰でも理解できるような簡単な表現で
        - 可能な限り具体的で身近な例を用いて表現すること
        - **重要**: 「太陽星座」「アセンダント」「上昇星座」などの専門用語は使わず、「12星座」「あなたの星座」と記載すること
        
        **重要**: これは「お手軽12星座占い」として、まず占いに慣れ親しんでもらう内容です。親しみやすく、興味を持ってもらえるような占い結果にしてください。
        
        以下の5つの運勢について簡潔で分かりやすくアドバイスしてください：
        
        【全体運】
        (この期間の全体的な運勢と、気をつけると良いポイント)
        
        【恋愛運】
        (恋愛面での具体的で親しみやすいアドバイス)
        
        【仕事運】
        (仕事面での具体的で実用的なアドバイス)
        
        【健康運】
        (健康面での具体的で身近なアドバイス)
        
        【金銭運】
        (金銭面での具体的で分かりやすいアドバイス)
        
        各項目は1-2文で簡潔に書いてください。読みやすさを重視し、要点を絞って記載してください。
      `;
      
      debugLog('🔍 【AI占い呼び出し】プロンプト:', analysisPrompt);
      
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData!, horoscopeData!.planets);
      
      debugLog('🔍 【AI占い結果】aiResult:', aiResult);
      debugLog('🔍 【AI占い結果】文字数:', aiResult?.length || 0);
      
      if (aiResult && aiResult.trim()) {
        debugLog('🔍 【占い結果設定】有効な結果を受信:', aiResult.substring(0, 200) + '...');
        
        // Level1占い結果を設定
        setLevel1Fortune(aiResult);
        
        // 🔧 AIチャット用にLevel1結果をローカルストレージに保存
        const storageKey = `level1_fortune_${birthData?.name || 'user'}_${new Date().toISOString().split('T')[0]}`;
        const fortuneData = {
          mode: 'sun-sign',
          period: selectedPeriod,
          result: aiResult,
          timestamp: Date.now(),
          sunSign: sunSign
        };
        localStorage.setItem(storageKey, JSON.stringify(fortuneData));
        debugLog('🔍 【AIチャット用保存】Level1結果をローカルストレージに保存:', storageKey);
      } else {
        debugLog('🔍 【占いエラー】AIの応答が空またはnull');
        debugLog('🔍 【占いエラー】aiResult:', aiResult);
        // AI分析に失敗した場合はエラーメッセージを表示
        setLevel1Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
      }
    } catch (error) {
      debugError('占い生成エラー:', error);
      debugError('エラーの詳細:', error instanceof Error ? error.message : String(error));
      // エラーの場合もAI専用エラーメッセージを表示
      setLevel1Fortune('AI占い師との接続でエラーが発生しました。インターネット接続を確認の上、再度お試しください。');
    } finally {
      setIsGeneratingLevel1(false);
    }
  };

  // レベル2の占い生成（3天体本格占い）
  const handleGenerateLevel2Fortune = async () => {
    if (!horoscopeData || !birthData) return;
    
    setIsGeneratingLevel2(true);
    
    try {
      // 過去のLevel2占い結果を読み込み（占い機能引き継ぎ用）
      let previousLevel2Context = '';
      try {
        const level2Key = `level2_fortune_${birthData?.name || 'user'}_${new Date().toISOString().split('T')[0]}`;
        const storedLevel2 = localStorage.getItem(level2Key);
        if (storedLevel2) {
          const fortuneData = JSON.parse(storedLevel2);
          previousLevel2Context = `

        【参考：今日の星が伝える隠れた自分診断結果】
※以下の結果を参考に、継続性のある占いを提供してください

表の自分: ${fortuneData.sunSign}
裏の自分: ${fortuneData.moonSign}
自然な行動: ${fortuneData.ascendantSign}
期間: ${fortuneData.period === 'today' ? '今日' : fortuneData.period === 'tomorrow' ? '明日' : fortuneData.period}
前回の占い結果:
${fortuneData.result}
`;
        }
      } catch (error) {
        console.warn('Level2結果の読み込みエラー（占い用）:', error);
      }

      const sun = horoscopeData.planets.find(p => p.planet === '太陽');
      const moon = horoscopeData.planets.find(p => p.planet === '月');
      const ascendant = horoscopeData.planets.find(p => p.planet === '上昇星座');
      
      const currentDate = new Date();
      const timeContext = getTimeContextForAI();
      const randomId = Math.random().toString(36).substring(2, 8);
      const selectedPeriodLabel = periodOptions.level2.find(p => p.value === selectedPeriod)?.label;
      
      // 期間の範囲を計算する関数
      const calculatePeriodRange = (period: string) => {
        const today = new Date();
        let startDate = new Date(today);
        let endDate = new Date(today);
        
        switch (period) {
          case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
          case 'tomorrow':
            startDate = new Date(today);
            startDate.setDate(today.getDate() + 1);
            endDate = new Date(startDate);
            break;
          case 'thisWeek':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(today.getDate() + (6 - today.getDay()));
            break;
          case 'nextWeek':
            startDate = new Date(today);
            startDate.setDate(today.getDate() + (7 - today.getDay()));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
          case 'thisMonth':
            startDate = new Date(today);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
          case 'nextMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            break;
          case 'threeMonths':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setMonth(today.getMonth() + 3);
            break;
          case 'sixMonths':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setMonth(today.getMonth() + 6);
            break;
        }
        
        // 6か月の場合は年月で表示
        const isLongTermPeriod = period === 'sixMonths';
        const startStr = isLongTermPeriod 
          ? startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
          : startDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
        const endStr = isLongTermPeriod
          ? endDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
          : endDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
        
        return {
          start: startDate,
          end: endDate,
          startStr: startStr,
          endStr: endStr
        };
      };
      
      // 日付フォーマットを期間に応じて設定
      const getDateFormat = (period: string) => {
        if (period === 'sixMonths') {
          return '年月（例：2024年12月）';
        } else {
          return '具体的な日付（例：12月20日）';
        }
      };
      
      // 半年以上の期間かどうかを判定
      const isLongTerm = ['sixMonths'].includes(selectedPeriod);
      const importantDateTitle = isLongTerm ? '重要な月' : '重要な日';
      
      // 期間の範囲を取得
      const periodRange = calculatePeriodRange(selectedPeriod);
      
      // 3天体性格分析結果を含める
      const personalityContext = threePlanetsPersonality ? `
        【この人の性格分析結果】
        - 総合的な性格: ${threePlanetsPersonality.overall || '分析中'}
        - 人間関係のスタイル: ${threePlanetsPersonality.relationships || '分析中'}
        - 仕事への取り組み方: ${threePlanetsPersonality.work || '分析中'}
        - 恋愛・パートナーシップ: ${threePlanetsPersonality.love || '分析中'}
        - 成長のポイント: ${threePlanetsPersonality.growth || '分析中'}
      ` : '';
      
      // 今日・明日の占いでは重要な日を表示しない
      const includeImportantDays = selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow';
      
      let analysisPrompt = `
        あなたは「隠れた運勢」の専門家です。${selectedPeriodLabel}の運勢を、3天体の複合分析から読み解いてください：
        
        【隠れた運勢の3天体】
        - 価値観と意志: ${sun?.sign} ${sun?.degree}度 
        - 感情と直感: ${moon?.sign} ${moon?.degree}度
        - 無意識の行動: ${ascendant?.sign} ${ascendant?.degree}度
        ${personalityContext}
        ${previousLevel2Context}
        
        【占い期間】
        - 期間: ${selectedPeriodLabel}
        - ランダムID: ${randomId}
        
        **絶対に守るべき重要ルール**：
        - マークダウン記号（**、###、-など）は一切使用禁止
        - 季節や時期に関する表現（夏のエネルギー、今の時期、季節が〜など）は一切使用禁止
        - 「これらの要素」「上記の特徴」などの曖昧な参照は禁止。具体的に何を指すか必ず明記すること
        - 文章はですます調で親しみやすく記載
        - 「実は」「隠れた」「意外にも」を積極活用し、運勢の深い洞察を提供
        
        **隠れた運勢分析の視点**：
        - 表面的な占いでは分からない深い運勢の流れを発見すること
        - 価値観（${sun?.sign}）と感情（${moon?.sign}）の相克から生まれる運勢の変化
        - 無意識の行動（${ascendant?.sign}）が引き寄せる隠れたチャンスや注意点
        - 3天体の複合的な影響で生まれる特別な運勢のパターン
        - 普通の占いでは気づかない、この人だけの隠れた幸運や成長のタイミング
        
        以下の5項目で隠れた運勢を占ってください。各項目2-3文で具体的に：
        
        【総合運】
        太陽（${sun?.sign}）・月（${moon?.sign}）・上昇星座（${ascendant?.sign}）の複合的な流れから見える全体的な運気と隠れたチャンス。
        
        【金銭運】
        価値観（${sun?.sign}）と感情面（${moon?.sign}）の相互作用から導かれる金銭面での隠れた動きや注意点。
        
        【恋愛運】
        表の魅力（${sun?.sign}）と本音（${moon?.sign}）のギャップから生まれる恋愛・人間関係での隠れた展開。
        
        【仕事運】
        意志力（${sun?.sign}）と無意識の行動（${ascendant?.sign}）が織りなす仕事面での隠れた成功の鍵や課題。
        
        【成長運】
        3天体の調和から見える隠れた成長チャンス。今後意識すべき自己発展のポイントと方向性。`;
      
      // 今日の占い以外では重要な日/月を追加
      if (includeImportantDays) {
        analysisPrompt += `
        
        【${importantDateTitle}】
        この期間（${periodRange.startStr}〜${periodRange.endStr}）の中で特に重要な${isLongTerm ? '月' : '日'}を分析してください。
        必ず${periodRange.startStr}〜${periodRange.endStr}の期間内の日付のみを選択し、過去の日付や期間外の日付は絶対に選択しないでください。
        
        以下の形式で記載してください：
        
        🍀 ラッキー${isLongTerm ? '月' : 'デー'}：${getDateFormat(selectedPeriod)}
        その${isLongTerm ? '月' : '日'}が重要な理由を1-2文で説明
        
        ⚠️ 注意${isLongTerm ? '月' : '日'}：${getDateFormat(selectedPeriod)}
        注意が必要な理由を1-2文で説明
        
        注意：マークダウン記号（**、-など）は使用せず、全体的な感想やまとめ文は記載しないでください。`;
      }
      
      debugLog('🔍 【3天体占いAI呼び出し】プロンプト:', analysisPrompt);
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData, horoscopeData.planets);
      debugLog('🔍 【3天体占いAI応答】結果:', aiResult);
      debugLog('🔍 【3天体占いAI応答】文字数:', aiResult?.length || 0);
      
      if (aiResult && aiResult.trim()) {
        setLevel2Fortune(aiResult);

        debugLog('🔍 【3天体占い結果設定】level2Fortuneに設定完了（新規生成）');
        
        // AIチャット用にLevel2の占い結果をローカルストレージに保存
        const storageKey = `level2_fortune_${birthData?.name || 'user'}_${new Date().toISOString().split('T')[0]}`;
        const fortuneData = {
          mode: 'hidden-self-discovery',
          period: selectedPeriod,
          result: aiResult,
          timestamp: Date.now(),
          sunSign: sun?.sign,
          moonSign: moon?.sign,
          ascendantSign: ascendant?.sign
        };
        localStorage.setItem(storageKey, JSON.stringify(fortuneData));
        debugLog('🔍 【AIチャット用保存】Level2結果をローカルストレージに保存:', storageKey);
      } else {
        debugLog('🔍 【隠れた自分発見占いエラー】AIの応答が空またはnull');
        setLevel2Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
      }
    } catch (error) {
      debugError('3天体占い生成エラー:', error);
      debugError('エラーの詳細:', error instanceof Error ? error.message : String(error));
      setLevel2Fortune('3天体の占い中にエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
      setIsGeneratingLevel2(false);
    }
  };

  // レベル3の占い生成
  const handleGenerateLevel3Fortune = async () => {
    debugLog('🔍 【Level3占い生成開始】====================');
    debugLog('🔍 【Level3占い生成開始】selectedPeriod:', selectedPeriod);
    debugLog('🔍 【Level3占い生成開始】horoscopeData:', horoscopeData);
    
    if (!horoscopeData) {
      debugLog('🔍 【Level3占いエラー】horoscopeDataが見つかりません');
      return;
    }
    
    debugLog('🔍 【Level3占い生成】処理開始');
    setIsGeneratingLevel3(true);
    
    try {
      // 過去のLevel3占い結果を読み込み（占い機能引き継ぎ用）
      let previousLevel3Context = '';
      try {
        const level3Key = `level3_fortune_${birthData?.name || 'user'}_${new Date().toISOString().split('T')[0]}`;
        const storedLevel3 = localStorage.getItem(level3Key);
        if (storedLevel3) {
          const fortuneData = JSON.parse(storedLevel3);
          previousLevel3Context = `

        【参考：今日の星が伝えるあなたの印象診断結果】
※以下の結果を参考に、継続性のある占いを提供してください

期間: ${fortuneData.period === 'today' ? '今日' : fortuneData.period === 'tomorrow' ? '明日' : fortuneData.period}
前回の占い結果:
${fortuneData.result}
`;
        }
      } catch (error) {
        console.warn('Level3結果の読み込みエラー（占い用）:', error);
      }

      const planetsInfo = horoscopeData.planets.map(p => `${p.planet}: ${p.sign} ${p.degree}度`).join(', ');
      
      const currentDate = new Date();
      const timeContext = getTimeContextForAI();
      const randomId = Math.random().toString(36).substring(2, 8);
      let analysisPrompt = `
        あなたは経験豊富な西洋占星術師です。以下の10天体の配置を使って完全な占いを行ってください：
        ${planetsInfo}
        - 期間: ${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}
        - ランダムID: ${randomId}
        ${previousLevel3Context}
        ${timeContext}
        
        **重要な文章作成ルール（必ず守ること）**：
        - ですます調で丁寧に記載すること
        - 特徴と注意点をできるだけ記載すること
        - 難しい言い回しや難しい熟語はできるだけ用いないこと
        - 利用者ターゲットは30代であるが理解力は大学生レベルとすること
        - 可能な限り具体的な例を用いて表現すること
        - **重要**: 「アセンダント」という用語は絶対に使用せず、必ず「上昇星座」と記載すること
        
        **絶対に守るべき重要ルール**：
        - マークダウン記号（**、###、-など）は一切使用禁止
        - 季節や時期に関する表現（夏のエネルギー、今の時期、季節が〜など）は一切使用禁止
        - 「これらの要素」「上記の特徴」などの曖昧な参照は禁止。具体的に何を指すか必ず明記すること
        - 文章はですます調で親しみやすく記載
        
        **10天体の運勢分析の視点**：
        - 10天体すべての相互作用を考慮した包括的な運勢分析
        - 各天体の影響を具体的に明記してください（例：「太陽の○○座の影響で〜」）
        - 天体の組み合わせによる特別な効果も考慮してください
        - まわりから見えるあなたの行動パターンも運勢に反映させてください
        - 毎回新しい視点で分析を行い、異なる結果を提供してください
        
        以下の5項目で10天体の配置から運勢を占ってください。各項目2-3文で具体的に：
        
        【総合運】
        10天体の総合的な配置から見える全体的な運気の流れ。太陽・月・水星・金星・火星・木星・土星・天王星・海王星・冥王星の複合的な影響で生まれる運勢の変化とチャンス。
        
        【金銭運】
        太陽・木星・土星・金星などの金銭に関わる天体配置から導かれる金銭面での運勢と注意点。収入や支出、投資や貯蓄に関する運気の流れ。
        
        【恋愛運】
        金星・火星・月・太陽の恋愛に関わる天体配置から見える恋愛・人間関係での運勢展開。出会いや関係性の変化に関する運気。
        
        【仕事運】
        太陽・火星・土星・木星・水星の仕事に関わる天体配置から読み取れる仕事面での運勢と成功の鍵。キャリアや責任、成果に関する運気。
        
        【成長運】
        10天体の調和から見える成長チャンス。今後意識すべき自己発展のポイントと方向性。天王星・海王星・冥王星の変革的な影響も含めた成長の運気。`;
      
      // 今日の占い以外では重要な日/月を追加
      const includeImportantDays = selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow';
      
      if (includeImportantDays) {
        // 期間の範囲を計算する関数
        const calculatePeriodRange = (period: string) => {
          const today = new Date();
          let startDate = new Date(today);
          let endDate = new Date(today);
          
          switch (period) {
            case 'this_week':
              const dayOfWeek = today.getDay();
              startDate.setDate(today.getDate() - dayOfWeek);
              endDate.setDate(startDate.getDate() + 6);
              break;
            case 'this_month':
              startDate.setDate(1);
              endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              break;
            case 'next_month':
              startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
              endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
              break;
            case '1_month':
              endDate = new Date(today);
              endDate.setMonth(endDate.getMonth() + 1);
              break;
            case '3_months':
              endDate = new Date(today);
              endDate.setMonth(endDate.getMonth() + 3);
              break;
            case '6_months':
              endDate = new Date(today);
              endDate.setMonth(endDate.getMonth() + 6);
              break;
            case '1_year':
              endDate = new Date(today);
              endDate.setFullYear(endDate.getFullYear() + 1);
              break;
            default:
              endDate.setDate(endDate.getDate() + 7);
          }
          
          return {
            start: startDate,
            end: endDate,
            startStr: `${startDate.getFullYear()}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${String(startDate.getDate()).padStart(2, '0')}`,
            endStr: `${endDate.getFullYear()}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}`
          };
        };
        
        const periodRange = calculatePeriodRange(selectedPeriod);
        const isLongTerm = ['6_months', '1_year'].includes(selectedPeriod);
        const importantDateTitle = isLongTerm ? '重要な月' : '重要な日';
        
        const getDateFormat = (period: string) => {
          return isLongTerm ? 'YYYY年MM月' : 'MM月DD日';
        };
        
        analysisPrompt += `
        
        【${importantDateTitle}】
        この期間（${periodRange.startStr}〜${periodRange.endStr}）の中で特に重要な${isLongTerm ? '月' : '日'}を分析してください。
        必ず${periodRange.startStr}〜${periodRange.endStr}の期間内の日付のみを選択し、過去の日付や期間外の日付は絶対に選択しないでください。
        
        以下の形式で記載してください：
        
        🍀 ラッキー${isLongTerm ? '月' : 'デー'}：${getDateFormat(selectedPeriod)}
        その${isLongTerm ? '月' : '日'}が重要な理由を1-2文で説明
        
        ⚠️ 注意${isLongTerm ? '月' : '日'}：${getDateFormat(selectedPeriod)}
        注意が必要な理由を1-2文で説明
        
        注意：マークダウン記号（**、-など）は使用せず、全体的な感想やまとめ文は記載しないでください。`;
      }
      
      debugLog('🔍 【Level3占い】AI占い師呼び出し開始');
      debugLog('🔍 【Level3占い】analysisPrompt:', analysisPrompt);
      
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData!, horoscopeData!.planets);
      
      debugLog('🔍 【Level3占い】AI占い師結果:', aiResult);
      debugLog('🔍 【Level3占い】結果文字数:', aiResult?.length || 0);
      
      if (aiResult && aiResult.trim()) {
        debugLog('🔍 【Level3占い】有効な結果を受信:', aiResult.substring(0, 200) + '...');
        setLevel3Fortune(aiResult);
        debugLog('🔍 【Level3占い】level3Fortuneに設定完了');
        
        // AIチャット用にLevel3の占い結果をローカルストレージに保存
        const storageKey = `level3_fortune_${birthData?.name || 'user'}_${new Date().toISOString().split('T')[0]}`;
        const fortuneData = {
          mode: 'behavior-pattern-analysis',
          period: selectedPeriod,
          result: aiResult,
          timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(fortuneData));
        debugLog('🔍 【AIチャット用保存】Level3結果をローカルストレージに保存:', storageKey);
      } else {
        debugLog('🔍 【Level3占いエラー】AIの応答が空またはnull');
        setLevel3Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
      }
    } catch (error) {
      debugError('レベル3占い生成エラー:', error);
      debugError('エラーの詳細:', error instanceof Error ? error.message : String(error));
      setLevel3Fortune('星が伝える あなたの印象診断の分析中にエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
      setIsGeneratingLevel3(false);
    }
  };

  // レベル3のAI分析生成（自動実行・キャッシュ機能付き）
  const handleGenerateLevel3Analysis = useCallback(async () => {
    if (!horoscopeData || !birthData) return;
    
    // キャッシュキーを生成（v7: 5つの項目形式完全対応・無限ループ修正）
    const cacheKey = `level3_analysis_v7_${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
    
    // 古いバージョンのキャッシュを削除（既存ユーザー対応）
    const baseKey = `${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
    ['v2', 'v3', 'v4', 'v5', 'v6'].forEach(version => {
      const oldKey = `level3_analysis_${version}_${baseKey}`;
      if (localStorage.getItem(oldKey)) {
        localStorage.removeItem(oldKey);
        debugLog(`🧹 【古いキャッシュ削除】${version}キャッシュを削除しました`);
      }
    });
    
    // キャッシュからデータを確認
    const cachedAnalysis = localStorage.getItem(cacheKey);
    if (cachedAnalysis) {
      try {
        const cached = JSON.parse(cachedAnalysis);
        
        // キャッシュの有効期限をチェック
        const now = Date.now();
        const expiryTime = cached.timestamp + (cached.expiryDays * 24 * 60 * 60 * 1000);
        
        if (now < expiryTime) {
          debugLog('🔍 【キャッシュ有効】キャッシュからAI分析を読み込みます');
          const analysis = cached.analysis || cached;
          setLevel3Analysis(analysis);
          return;
        } else {
          debugLog('🔍 【キャッシュ期限切れ】キャッシュを削除します');
          localStorage.removeItem(cacheKey);
        }
      } catch (error) {
        debugError('キャッシュデータの解析エラー:', error);
        // キャッシュが壊れている場合は削除
        localStorage.removeItem(cacheKey);
      }
    }
    
    setIsGeneratingLevel3Analysis(true);
    
    try {
      debugLog('🔍 【AI分析開始】generateAIAnalysisを呼び出します');
      // Level3の詳細分析モードを使用（tenPlanetSummary生成のため）
      const analysis = await generateAIAnalysis(birthData, horoscopeData.planets, 'detailed');
      debugLog('🔍 【AI分析完了】結果:', analysis);
      setLevel3Analysis(analysis);
      
      // 結果をキャッシュに保存（7日間有効）
      const cacheData = {
        analysis,
        timestamp: Date.now(),
        expiryDays: 7
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      debugLog('🔍 【キャッシュ保存】AI分析結果を保存しました');
      
      // AIチャット用にLevel3の5つの項目をローカルストレージに保存
      if (analysis.tenPlanetSummary) {
        const aiChatKey = `level3_analysis_result_${birthData?.name || 'user'}_${new Date().toISOString().split('T')[0]}`;
        const aiChatData = {
          mode: 'behavior-pattern-analysis',
          period: selectedPeriod,
          tenPlanetSummary: analysis.tenPlanetSummary,
          timestamp: Date.now()
        };
        localStorage.setItem(aiChatKey, JSON.stringify(aiChatData));
        debugLog('🔍 【AIチャット用保存】Level3の5つの項目をローカルストレージに保存:', aiChatKey);
      }
    } catch (error) {
      debugError('レベル3AI分析エラー:', error);
      debugError('エラーの詳細:', error instanceof Error ? error.message : String(error));
      // エラーの場合はデフォルトの分析結果を設定（新しい5つの項目形式）
      const defaultAnalysis = {
        tenPlanetSummary: {
          overallInfluence: "現在AI分析が利用できません。10天体の総合的な配置から見える、あなたの全体的な性格や人生への影響を確認してください。",
          communicationStyle: "現在AI分析が利用できません。水星などの影響から見える、あなたのコミュニケーションスタイルや話し方の特徴を確認してください。",
          loveAndBehavior: "現在AI分析が利用できません。金星・火星などの影響から見える、恋愛での行動パターンや魅力の表現方法を確認してください。",
          workBehavior: "現在AI分析が利用できません。太陽・土星などの影響から見える、職場での振る舞い方や責任の取り方を確認してください。",
          transformationAndDepth: "現在AI分析が利用できません。冥王星・海王星・天王星などの影響から見える、人生の変化への対応や深層心理を確認してください。"
        },
        personalityInsights: {
          corePersonality: '現在AI分析が利用できません。',
          hiddenTraits: '現在AI分析が利用できません。',
          lifePhilosophy: '現在AI分析が利用できません。',
          relationshipStyle: '現在AI分析が利用できません。',
          careerTendencies: '現在AI分析が利用できません。'
        },
        detailedFortune: {
          overallTrend: '現在AI分析が利用できません。',
          loveLife: '現在AI分析が利用できません。',
          careerPath: '現在AI分析が利用できません。',
          healthWellness: '現在AI分析が利用できません。',
          financialProspects: '現在AI分析が利用できません。',
          personalGrowth: '現在AI分析が利用できません。'
        },
        lifePath: {
          majorThemes: [],
          challengesToOvercome: [],
          opportunitiesToSeize: [],
          spiritualJourney: '現在AI分析が利用できません。'
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
      setLevel3Analysis(defaultAnalysis);
    } finally {
      setIsGeneratingLevel3Analysis(false);
    }
  }, [horoscopeData, birthData]);

  // 3天体性格分析のローカルストレージキー生成
  const generateThreePlanetsKey = (birthData: BirthData, planets: any[]) => {
    const sun = planets.find(p => p.planet === '太陽');
    const moon = planets.find(p => p.planet === '月');
    const ascendant = planets.find(p => p.planet === '上昇星座');
    
    // 🔥 キャッシュ最適化: 期間情報を含めてより効率的なキャッシュ管理
    return `three_planets_personality_v2_${sun?.sign}_${moon?.sign}_${ascendant?.sign}`;
  };

  // ローカルストレージから3天体性格分析を読み込み
  const loadThreePlanetsPersonality = () => {
    if (!birthData || !horoscopeData) return null;
    
    const key = generateThreePlanetsKey(birthData, horoscopeData.planets);
    const saved = localStorage.getItem(key);
    
    debugLog('🔍 【キャッシュ確認】キー:', key);
    debugLog('🔍 【キャッシュ確認】保存データ:', saved ? '存在' : '未保存');
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        // 🔥 キャッシュ期間チェック: 3天体性格分析は90日間有効
        if (data.timestamp) {
          const now = Date.now();
          const expiryTime = data.timestamp + (90 * 24 * 60 * 60 * 1000); // 90日間
          
          if (now > expiryTime) {
            debugLog('🔍 【キャッシュ期限切れ】3天体性格分析キャッシュを削除');
            localStorage.removeItem(key);
            return null;
          }
        }
        
        return data.analysis || data;
      } catch (error) {
        debugError('3天体性格分析の読み込みエラー:', error);
      }
    }
    return null;
  };

  // ローカルストレージに3天体性格分析を保存
  const saveThreePlanetsPersonality = (analysis: any) => {
    if (!birthData || !horoscopeData) return;
    
    const key = generateThreePlanetsKey(birthData, horoscopeData.planets);
    
    try {
      // 🔥 キャッシュ最適化: タイムスタンプ付きで保存
      const cacheData = {
        analysis,
        timestamp: Date.now(),
        version: 'v2'
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      debugError('3天体性格分析の保存エラー:', error);
    }
  };

  // 開発者向け：3天体性格分析のキャッシュをクリア
  const clearThreePlanetsCache = () => {
    if (!birthData || !horoscopeData) return;
    
    const key = generateThreePlanetsKey(birthData, horoscopeData.planets);
    localStorage.removeItem(key);
    debugLog('🔍 【キャッシュクリア】3天体性格分析のキャッシュを削除しました');
    
    // 画面上の結果もクリア
    setThreePlanetsPersonality(null);
    
    // 新しい分析を生成
    generateThreePlanetsPersonality();
  };

  // 開発者ツール用：グローバルに関数を公開
  if (typeof window !== 'undefined') {
    (window as any).clearThreePlanetsCache = clearThreePlanetsCache;
    // デバッグ用：3天体性格分析の状態を確認
    (window as any).debug3PlanetsPersonality = () => {
      debugLog('🔍 【3天体性格分析デバッグ】');
      debugLog('  currentLevel:', currentLevel);
      debugLog('  selectedMode:', selectedMode);
      debugLog('  horoscopeData:', !!horoscopeData);
      debugLog('  birthData:', !!birthData);
      debugLog('  threePlanetsPersonality:', !!threePlanetsPersonality);
      debugLog('  isGeneratingThreePlanetsPersonality:', isGeneratingThreePlanetsPersonality);
      if (horoscopeData && birthData) {
        const key = generateThreePlanetsKey(birthData, horoscopeData.planets);
        debugLog('  cacheKey:', key);
        debugLog('  cachedData:', localStorage.getItem(key) ? '存在' : '未保存');
      }
    };
  }

  // 3天体性格分析を生成
  const generateThreePlanetsPersonality = async () => {
    if (!horoscopeData || !birthData) return;
    
    // まずローカルストレージから確認
    const saved = loadThreePlanetsPersonality();
    if (saved) {
      debugLog('🔍 【キャッシュ使用】保存済みの3天体性格分析を使用します');
      setThreePlanetsPersonality(saved);
      return;
    }
    
    debugLog('🔍 【AI生成開始】3天体性格分析を新規生成します');
    setIsGeneratingThreePlanetsPersonality(true);
    
          try {
        const sun = horoscopeData.planets.find(p => p.planet === '太陽');
        const moon = horoscopeData.planets.find(p => p.planet === '月');
        const ascendant = horoscopeData.planets.find(p => p.planet === '上昇星座');
        
        const currentDate = new Date();
        const timeContext = getTimeContextForAI();
        const randomId = Math.random().toString(36).substring(2, 8);
      
            const analysisPrompt = `
        以下の形式で必ず回答してください。【】記号を使って5つのセクションに分けて回答することが絶対条件です。
        
        天体: 太陽${sun?.sign}・月${moon?.sign}・上昇星座${ascendant?.sign}
        
        回答例（この通りの形式で回答）：
        
        【心の奥底にある性格】
        太陽${sun?.sign}の表向きとは違い、月${moon?.sign}の影響で意外な一面があります。普段は見せない隠れた性格を教えてください。
        
        【建前と本音の違い】
        表向きは太陽${sun?.sign}ですが、本音では月${moon?.sign}の違う気持ちです。周りが知らない本当の想いがあります。
        
        【無意識に現れる癖】
        上昇星座${ascendant?.sign}による、本人も気づかない行動パターンです。自動的に出る隠れた癖があります。
        
        【本当の感情の動き】
        月${moon?.sign}が示す、表面では見せない本当の感情です。心の奥の本当の気持ちがあります。
        
        【内面的な成長課題】
        この3天体の組み合わせから見える成長の道筋です。隠れた可能性や課題があります。
        
        上記の【】形式を絶対に守って回答してください。【】記号がないと回答が無効になります。
      `;
      
      debugLog('🔍 【AI呼び出し中】chatWithAIAstrologerを実行します...');
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData, horoscopeData.planets);
      debugLog('🔍 【AI呼び出し完了】結果:', aiResult ? '成功' : '失敗');
      
      if (aiResult && aiResult.trim()) {
        // AIの結果をパース
        const parsedAnalysis = parseThreePlanetsAnalysis(aiResult);
        
        // ローカルストレージに保存
        saveThreePlanetsPersonality(parsedAnalysis);
        debugLog('🔍 【キャッシュ保存】3天体性格分析をローカルストレージに保存しました');
        
        setThreePlanetsPersonality(parsedAnalysis);
      } else {
        setThreePlanetsPersonality({
          error: 'AI占い師が現在利用できません。しばらくしてから再度お試しください。'
        });
      }
    } catch (error) {
      debugError('3天体性格分析生成エラー:', error);
      setThreePlanetsPersonality({
        error: '3天体の性格分析中にエラーが発生しました。しばらくしてから再度お試しください。'
      });
    } finally {
      setIsGeneratingThreePlanetsPersonality(false);
    }
  };

  // AI分析結果をパース
  const parseThreePlanetsAnalysis = (analysisText: string) => {
    debugLog('🔍 【AI生成結果全体】:', analysisText);
    
    const sections = {
      innerChange: '',
      emotionalFlow: '',
      unconsciousChange: '',
      honneBalance: '',
      soulGrowth: '',
      importantDays: ''
    };
    
    const sectionMatches = analysisText.match(/【[^】]*】[^【]*/g) || [];
    debugLog('🔍 【セクション数】:', sectionMatches.length);
    debugLog('🔍 【抽出されたセクション一覧】:', sectionMatches);
    
    // 【】記号がない場合のフォールバック処理
    if (sectionMatches.length === 0) {
      debugLog('🔍 【フォールバック処理】【】記号がないため、キーワードベースでパース開始');
      
      // キーワードベースでセクションを分割
      const keywords = [
        { key: 'innerChange', patterns: ['心の奥底', '隠れた性格', '内面', '奥底', '隠れた一面'] },
        { key: 'emotionalFlow', patterns: ['建前と本音', '本音', '建前', '表向き', '本当の想い'] },
        { key: 'unconsciousChange', patterns: ['無意識', '行動パターン', '癖', '自動的'] },
        { key: 'honneBalance', patterns: ['感情の動き', '本当の感情', '心の奥', '感情'] },
        { key: 'soulGrowth', patterns: ['成長', '課題', '可能性', '道筋'] }
      ];
      
      keywords.forEach(({ key, patterns }) => {
        for (const pattern of patterns) {
          if (analysisText.includes(pattern)) {
            // パターンを含む段落を抽出
            const sentences = analysisText.split(/[。.]\s*/);
            const relevantSentences = sentences.filter(sentence => 
              sentence.includes(pattern) && sentence.length > 10
            );
            
            if (relevantSentences.length > 0) {
              const content = relevantSentences.slice(0, 2).join('。') + '。';
              // 型安全性のため個別に設定
              if (key === 'innerChange') sections.innerChange = content;
              else if (key === 'emotionalFlow') sections.emotionalFlow = content;
              else if (key === 'unconsciousChange') sections.unconsciousChange = content;
              else if (key === 'honneBalance') sections.honneBalance = content;
              else if (key === 'soulGrowth') sections.soulGrowth = content;
              debugLog(`🔍 【フォールバック】${key}設定:`, content);
              break;
            }
          }
        }
      });
      
      // キーワードベースでも何も取得できない場合の最終フォールバック
      const hasAnyContent = Object.values(sections).some(value => value.length > 0);
      if (!hasAnyContent) {
        debugLog('🔍 【最終フォールバック】段落分割でセクション作成');
        const paragraphs = analysisText.split(/\n\n+|。\s*\n/).filter(p => p.trim().length > 20);
        
        if (paragraphs.length >= 3) {
          sections.innerChange = paragraphs[0]?.trim() || '';
          sections.emotionalFlow = paragraphs[1]?.trim() || '';
          sections.unconsciousChange = paragraphs[2]?.trim() || '';
          sections.honneBalance = paragraphs[3]?.trim() || '';
          sections.soulGrowth = paragraphs[4]?.trim() || '';
          debugLog('🔍 【最終フォールバック】段落分割完了');
        }
      }
    }
    
    sectionMatches.forEach((section, index) => {
      debugLog(`🔍 【セクション${index}】内容:`, section);
      
      if (section.includes('心の奥底') || section.includes('隠れた性格') || section.includes('奥底にある性格')) {
        sections.innerChange = section.replace(/【[^】]*】/, '').trim();
        debugLog('🔍 【心の奥底にある性格設定】:', sections.innerChange);
      } else if (section.includes('建前と本音') || section.includes('本音の違い') || section.includes('表の顔')) {
        sections.emotionalFlow = section.replace(/【[^】]*】/, '').trim();
        debugLog('🔍 【建前と本音の違い設定】:', sections.emotionalFlow);
      } else if (section.includes('無意識に現れる癖') || section.includes('無意識') || section.includes('癖')) {
        sections.unconsciousChange = section.replace(/【[^】]*】/, '').trim();
        debugLog('🔍 【無意識に現れる癖設定】:', sections.unconsciousChange);
      } else if (section.includes('本当の感情') || section.includes('感情の動き') || section.includes('心の中')) {
        sections.honneBalance = section.replace(/【[^】]*】/, '').trim();
        debugLog('🔍 【本当の感情の動き設定】:', sections.honneBalance);
      } else if (section.includes('内面的') || section.includes('成長課題') || section.includes('精神的')) {
        sections.soulGrowth = section.replace(/【[^】]*】/, '').trim();
        debugLog('🔍 【内面的な成長課題設定】:', sections.soulGrowth);
      } else if (section.includes('重要な日') || section.includes('重要日') || section.includes('重要な月') || section.includes('ラッキーデー') || section.includes('注意日') || section.includes('ラッキー月') || section.includes('注意月')) {
        if (!sections.importantDays) {
          sections.importantDays = section.replace(/【[^】]*】/, '').trim();
          debugLog('🔍 【重要な日/月設定】:', sections.importantDays);
        }
      } else {
        debugLog('🔍 【未分類セクション】:', section);
      }
    });
    
    debugLog('🔍 【最終解析結果】:', sections);
    debugLog('🔍 【解析結果チェック】各プロパティの値:');
    debugLog('  innerChange:', sections.innerChange);
    debugLog('  emotionalFlow:', sections.emotionalFlow);
    debugLog('  unconsciousChange:', sections.unconsciousChange);
    debugLog('  honneBalance:', sections.honneBalance);
    debugLog('  soulGrowth:', sections.soulGrowth);
    
    return sections;
  };

  // レベルアップ処理
  const handleLevelUp = () => {
    if (currentLevel < 3) {
      // 3天体の本格占い（レベル2）に進む場合、データ不足チェック
      if (currentLevel === 1) {
        if (!birthData) {
          debugLog('🔍 出生データがありません。');
          setShowDataMissingMessage(true);
          return;
        }
        
        const missingBirthTime = !birthData.birthTime || birthData.birthTime === '12:00';
        const missingBirthPlace = !birthData.birthPlace || 
                                  !birthData.birthPlace.city || 
                                  birthData.birthPlace.city === '東京';
        
        debugLog('🔍 レベルアップ時のデータチェック:');
        debugLog('  missingBirthTime:', missingBirthTime);
        debugLog('  missingBirthPlace:', missingBirthPlace);
        
        if (missingBirthTime || missingBirthPlace) {
          debugLog('🔍 3天体の本格占いに必要なデータが不足しています。');
          setShowDataMissingMessage(true);
          return;
        }
      }
      
      const nextLevel = (currentLevel + 1) as DisplayLevel;
      setCurrentLevel(nextLevel);
      setSelectedPeriod('today'); // 期間をリセット
      
      // レベル2（3天体）に上がる時、3天体性格分析をリセット
      if (nextLevel === 2) {
        debugLog('🔍 【レベルアップ】3天体性格分析をリセット');
        setThreePlanetsPersonality(null);
        setIsGeneratingThreePlanetsPersonality(false);
      }
      
      // ページトップに移動
      window.scrollTo(0, 0);
    }
  };

  // 期間タイトルの取得
  const getPeriodTitle = () => {
    const optionsList = currentLevel === 1 ? periodOptions.level1 : 
                       currentLevel === 2 ? periodOptions.level2 : 
                       periodOptions.level3;
    const option = optionsList.find(opt => opt.value === selectedPeriod);
    return option ? `${option.label}の占い` : '占い';
  };

  // レベル結果の表示
  const renderLevelResult = () => {
    switch (currentLevel) {
      case 1:
        return renderLevel1();
      case 2:
        return renderLevel2();
      case 3:
        return renderLevel3();
      default:
        return renderLevel1();
    }
  };

  const renderLevel1 = () => {
    if (!sunSign) return null;
    
    const signInfo = zodiacInfo[sunSign];
    if (!signInfo) return null;

    return (
      <div className="level-1">
        {/* 占いモード選択に戻るボタン */}
        <div className="back-button-container">
          <button 
            className="back-button"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/');
            }}
            type="button"
          >
            ← 占いモード選択に戻る
          </button>
        </div>
        
        <div className="level-title">
          <h2 className="level-title-text">🌟 お手軽12星座占い</h2>
        </div>

        {/* 広告表示1: 12星座占いタイトルと結果の間 */}
        <AdBanner 
          position="level-transition" 
          size="medium" 
          demoMode={false} 
        />

        {/* あなたの星座 */}
        <div className="zodiac-section">
          <h3 className="section-title">⭐ あなたの星座</h3>
          <div className="zodiac-display">
            <div className="zodiac-icon">{signInfo.icon}</div>
            <div className="zodiac-name">{sunSign}</div>
          </div>
        </div>
        
        {/* 12星座から見たあなた */}
        <div className="personality-section">
          <h3 className="section-title">🌟 12星座から見たあなた</h3>
          <p className="personality-text">{signInfo.description}</p>
        </div>

        {/* 占い */}
        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い</h3>
          
          <div className="fortune-selector">
            <div className="selector-row">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodSelection)}
                className="period-dropdown"
              >
                {periodOptions.level1.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}の占い
                  </option>
                ))}
              </select>
              
              <button 
                className="generate-fortune-button"
                onClick={handleGenerateLevel1Fortune}
                disabled={isGeneratingLevel1}
              >
                {isGeneratingLevel1 ? '占い中...' : '占う'}
              </button>
            </div>
          </div>
          
          {isGeneratingLevel1 && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>占っています...お待ちください</p>
            </div>
          )}
          
          {(() => {
            debugLog('�� 【占い表示条件】level1Fortune:', !!level1Fortune, 'isGeneratingLevel1:', isGeneratingLevel1);
            debugLog('🔍 【占い表示条件】level1Fortune内容:', level1Fortune?.substring(0, 200) + '...');
            return level1Fortune && !isGeneratingLevel1;
          })() && (
            <div className="five-fortunes-section">
              <h3>🔮 AI占い結果 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  debugLog('🔍 【占い結果表示開始】====================');
                  debugLog('🔍 【占い結果表示開始】level1Fortune:', level1Fortune);
                  
                  // AI生成結果を【】セクションで分割
                  const parseAIFortune = (fortuneText: string | null) => {
                    debugLog('🔍 【parseAIFortune開始】====================');
                    if (!fortuneText) {
                      debugLog('🔍 【parseAIFortune】fortuneTextが空です');
                      return { overall: '', love: '', work: '', health: '', money: '', advice: '' };
                    }
                    
                    debugLog('🔍 【占い結果解析開始】入力テキスト:', fortuneText);
                    debugLog('🔍 【占い結果解析開始】テキスト長:', fortuneText?.length || 0);
                    
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
                      advice: ''
                    };
                    
                    // 【】でセクションを分割
                    const sectionMatches = fortuneText.match(/【[^】]*】[^【]*/g) || [];
                    const markdownSections = fortuneText.match(/###[^#]*?(?=###|$)/g) || [];
                    
                    debugLog('🔍 【セクション分割結果】【】形式:', sectionMatches);
                    debugLog('🔍 【セクション分割結果】### 形式:', markdownSections);
                    
                    // 【】形式の処理
                    sectionMatches.forEach(section => {
                      debugLog('🔍 【セクション解析中】:', section);
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
                        sections.overall = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【全体運設定】:', sections.overall);
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        sections.love = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【恋愛運設定】:', sections.love);
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        sections.work = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【仕事運設定】:', sections.work);
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        sections.health = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【健康運設定】:', sections.health);
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        sections.money = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【金銭運設定】:', sections.money);
                      } else if (section.includes('アドバイス') || section.includes('今日の') || section.includes('今週の') || section.includes('今月の')) {
                        sections.advice = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【アドバイス設定】:', sections.advice);
                      } else {
                        debugLog('🔍 【未分類セクション】:', section);
                      }
                    });
                    
                    // ### 形式の処理
                    markdownSections.forEach(section => {
                      debugLog('🔍 【### セクション解析中】:', section);
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
                        sections.overall = section.replace(/###[^#]*?運/, '').trim();
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        sections.love = section.replace(/###[^#]*?運/, '').trim();
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        sections.work = section.replace(/###[^#]*?運/, '').trim();
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        sections.health = section.replace(/###[^#]*?運/, '').trim();
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        sections.money = section.replace(/###[^#]*?運/, '').trim();
                      } else if (section.includes('アドバイス') || section.includes('今日の') || section.includes('今週の') || section.includes('今月の')) {
                        sections.advice = section.replace(/###[^#]*?/, '').trim();
                      }
                    });
                    
                    // どちらの形式でも解析できなかった場合は、全体を全体運として扱う
                    if (sectionMatches.length === 0 && markdownSections.length === 0) {
                      debugLog('🔍 【セクション分割失敗】全体運として扱います');
                      sections.overall = fortuneText.trim();
                    }
                    
                    debugLog('🔍 【解析結果】:', sections);
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level1Fortune);
                  
                  debugLog('🔍 【解析後の運勢セクション】:', fortuneSections);
                  debugLog('🔍 【各セクションの内容】:');
                  debugLog('  overall:', fortuneSections.overall);
                  debugLog('  love:', fortuneSections.love);
                  debugLog('  work:', fortuneSections.work);
                  debugLog('  health:', fortuneSections.health);
                  debugLog('  money:', fortuneSections.money);
                  
                  return (
                    <>
                      {fortuneSections.overall && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 全体運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.overall}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.love && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💕 恋愛運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.love}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.work && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💼 仕事運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.work}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.health && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌿 健康運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.health}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.money && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💰 金銭運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.money}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 占い結果の解析に失敗した場合のフォールバック */}
                      {!fortuneSections.overall && !fortuneSections.love && !fortuneSections.work && !fortuneSections.health && !fortuneSections.money && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🔮 占い結果</h4>
                          <div className="fortune-content">
                            <p>占い結果を正しく解析できませんでした。もう一度「占う」ボタンを押してください。</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* AIチャット誘導ボタン */}
              <div className="ai-chat-guidance" style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '0.95rem' }}>💬 もっと詳しく知りたいことがありますか？</p>
                <button 
                  onClick={() => window.location.href = '/ai-fortune'}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(0)'}
                >
                  🤖 AI占い師に相談する
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 隠れた自分発見占いの説明 */}
        <div className="three-planets-introduction">
                      <h3 className="section-title">🔮 星が伝える 隠れた自分診断とは</h3>
          <div className="intro-overview">
            <p>
              普通の12星座占いでは分からない、あなたの隠れた一面を発見！太陽・月・上昇星座の3天体分析で、表面的な性格の奥に潜む本当のあなたを診断します。「同じ星座なのになぜ性格が違うの？」その謎を解き明かします。
            </p>
          </div>
          
          <div className="three-planets-preview">
            <div className="planet-preview">
              <span className="planet-icon">🧠</span>
              <div className="planet-info">
                <h4>心の奥底にある性格</h4>
                <p>太陽・月・上昇星座から見える深層の性格</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">💭</span>
              <div className="planet-info">
                <h4>建前と本音の違い</h4>
                <p>表の顔と裏の顔のギャップを分析</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🔮</span>
              <div className="planet-info">
                <h4>無意識に現れる癖</h4>
                <p>気づかないうちに出てしまう行動パターン</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">⚖️</span>
              <div className="planet-info">
                <h4>本当の感情の動き</h4>
                <p>表面化しない内側の感情の流れ</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🌱</span>
              <div className="planet-info">
                <h4>内面的な成長課題</h4>
                <p>隠れた自分を受け入れるための成長ポイント</p>
              </div>
            </div>
          </div>
        </div>

        {/* レベルアップボタン */}
        <div className="level-up-section">
          <button 
            className="level-up-button"
            onClick={handleLevelUp}
          >
            星が伝える 隠れた自分診断へ 🔮
          </button>
        </div>

        {/* 広告表示2: AI相談ボタンの上 */}
        <AdBanner 
          position="result-bottom" 
          size="medium" 
          demoMode={false} 
        />

        {/* アクションボタン */}
        <div className="action-buttons">
          <a href="/ai-fortune" className="ai-chat-button">
            🤖 AI占い師に相談する
          </a>
          <button 
            className="new-fortune-button"
            onClick={startNewFortune}
          >
            新しい占いを始める
          </button>
        </div>
      </div>
    );
  };

  const renderLevel2 = () => {
    if (!horoscopeData) return null;
    
    const sun = horoscopeData.planets.find(p => p.planet === '太陽');
    const moon = horoscopeData.planets.find(p => p.planet === '月');
          const ascendant = horoscopeData.planets.find(p => p.planet === '上昇星座');

    return (
      <div className="level-2">
        {/* 占いモード選択に戻るボタン */}
        <div className="back-button-container">
          <button 
            className="back-button"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/');
            }}
            type="button"
          >
            ← 占いモード選択に戻る
          </button>
        </div>
        
        <div className="level-title">
          <h2 className="level-title-text">🔮 星が伝える 隠れた自分診断</h2>
        </div>

        {/* 広告表示3: 隠れた自分発見占いタイトルと結果の間 */}
        <AdBanner 
          position="level-transition" 
          size="medium" 
          demoMode={false} 
        />
        
        {/* あなたの内面を構成する３つの天体セクション */}
        <div className="zodiac-section">
          <h3 className="section-title">⭐ あなたの内面を構成する３つの天体</h3>
          <div className="three-planets-display">
            <div className="planet-card">
              <div className="planet-description">
                あなたの基本的な性格と表に出る自分を表します。<br/>
                普段から周囲に見せている、意識的な自己表現を示しています。<br/>
                <br/>
              </div>
              <div className="planet-title-line">
                <br/>
                <span className="planet-emoji">☀️</span>
                <span className="planet-name">太陽 (表の自分)</span>
                <span className="zodiac-emoji">{zodiacInfo[sun?.sign || '']?.icon}</span>
                <span className="zodiac-name">{sun?.sign}</span>
              </div>
            </div>
            <div className="planet-card">
              <div className="planet-description">
                内面の感情や本音、プライベートな場面での素の自分を表します。<br/>
                家族や親しい人の前で見せる、心の奥深くにある本当のあなたです。<br/>
                <br/>
              </div>
              <div className="planet-title-line">
                <br/>
                <span className="planet-emoji">🌙</span>
                <span className="planet-name">月 (裏の自分)</span>
                <span className="zodiac-emoji">{zodiacInfo[moon?.sign || '']?.icon}</span>
                <span className="zodiac-name">{moon?.sign}</span>
              </div>
            </div>
            <div className="planet-card">
              <div className="planet-description">
                無意識の行動パターンや本能的なアプローチ方法を表します。<br/>
                自然にとってしまう行動や、人生への取り組み方を示しています。<br/>
                <br/>
              </div>
              <div className="planet-title-line">
                <br/>
                <span className="planet-emoji">🌅</span>
                <span className="planet-name">上昇星座 (自然な行動)</span>
                <span className="zodiac-emoji">{zodiacInfo[ascendant?.sign || '']?.icon}</span>
                <span className="zodiac-name">{ascendant?.sign}</span>
              </div>
            </div>
          </div>
        </div>

        {/* あなたの隠れた一面を発見 */}
        <div className="personality-section">
          <h3 className="section-title">🔮 あなたの隠れた一面を発見</h3>
          
          {/* 概要説明 */}
          {!threePlanetsPersonality && !isGeneratingThreePlanetsPersonality && (
            <div className="analysis-overview">
              <p>
                太陽（{sun?.sign}）・月（{moon?.sign}）・上昇星座（{ascendant?.sign}）という３つの天体から、あなたの内面的な性格を詳しく読み解きます。
              </p>
            </div>
          )}
          
          {/* 分析生成中 */}
          {isGeneratingThreePlanetsPersonality && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>占い中です...お待ちください</p>
            </div>
          )}
          
          {/* 分析結果表示 */}
          {threePlanetsPersonality && !isGeneratingThreePlanetsPersonality && (
            <div className="three-planets-analysis-results">
              {threePlanetsPersonality.error ? (
                <div className="error-message">
                  <p>{threePlanetsPersonality.error}</p>
                  <button 
                    className="retry-button"
                    onClick={generateThreePlanetsPersonality}
                  >
                    再試行
                  </button>
                </div>
              ) : (
                <div className="personality-sections">
                  {/* 各セクションで空白チェックを追加 */}
                  {(threePlanetsPersonality.innerChange || threePlanetsPersonality.emotionalFlow || 
                    threePlanetsPersonality.unconsciousChange || threePlanetsPersonality.honneBalance || 
                    threePlanetsPersonality.soulGrowth) ? (
                    <>
                      {threePlanetsPersonality.innerChange && (
                        <div className="personality-card">
                          <h4 className="personality-title">🧠 心の奥底にある性格</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.innerChange}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.emotionalFlow && (
                        <div className="personality-card">
                          <h4 className="personality-title">💭 建前と本音の違い</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.emotionalFlow}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.unconsciousChange && (
                        <div className="personality-card">
                          <h4 className="personality-title">🔮 無意識に現れる癖</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.unconsciousChange}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.honneBalance && (
                        <div className="personality-card">
                          <h4 className="personality-title">⚖️ 本当の感情の動き</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.honneBalance}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.soulGrowth && (
                        <div className="personality-card">
                          <h4 className="personality-title">🌱 内面的な成長課題</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.soulGrowth}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="personality-card">
                      <h4 className="personality-title">💫 性格分析</h4>
                      <div className="personality-content">
                        <p>性格分析が生成できませんでした。もう一度お試しください。</p>
                        <button 
                          className="retry-button"
                          onClick={generateThreePlanetsPersonality}
                        >
                          再試行
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {!threePlanetsPersonality && !isGeneratingThreePlanetsPersonality && (
            <div className="three-planets-analysis-results">
              <div className="personality-card">
                <h4 className="personality-title">🌟 隠れた自分の発見</h4>
                <div className="personality-content">
                  <p>分析を開始する準備ができました。</p>
                  <button 
                    className="retry-button"
                    onClick={generateThreePlanetsPersonality}
                  >
                    分析を開始
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い</h3>
          
          <div className="fortune-selector">
            <div className="selector-row">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodSelection)}
                className="period-dropdown"
              >
                {periodOptions.level2.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}の占い
                  </option>
                ))}
              </select>
              
              <button 
                className="generate-fortune-button"
                onClick={handleGenerateLevel2Fortune}
                disabled={isGeneratingLevel2}
              >
                {isGeneratingLevel2 ? '占い中...' : '占う'}
              </button>
            </div>
          </div>
          
          {isGeneratingLevel2 && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>占い中です...お待ちください</p>
            </div>
          )}
          
          {level2Fortune && !isGeneratingLevel2 && (
            <div className="five-fortunes-section">
              <h3>🔮 あなたの隠れた運勢 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  const parseAIFortune = (fortuneText: string) => {
                    debugLog('🔍 【占い結果解析開始】入力テキスト:', fortuneText);
                    debugLog('🔍 【占い結果解析開始】テキスト長:', fortuneText?.length || 0);
                    
                    const sections = {
                      innerChange: '',
                      emotionalFlow: '',
                      unconsciousChange: '',
                      honneBalance: '',
                      soulGrowth: '',
                      importantDays: ''
                    };
                    
                    // まず重要な日の絵文字を含む行を抽出
                    const lines = fortuneText.split('\n');
                    const importantDaysLines: string[] = [];
                    const otherLines: string[] = [];
                    
                    lines.forEach((line, index) => {
                      // 絵文字を含む行とその次の行（説明文）を重要な日として抽出
                      if (line.includes('🍀') || line.includes('⚠️')) {
                        importantDaysLines.push(line);
                        // 次の行が説明文の場合も含める
                        if (index + 1 < lines.length && !lines[index + 1].includes('🍀') && !lines[index + 1].includes('⚠️') && !lines[index + 1].includes('【')) {
                          importantDaysLines.push(lines[index + 1]);
                        }
                      } else if (!importantDaysLines.includes(line)) {
                        otherLines.push(line);
                      }
                    });
                    
                    if (importantDaysLines.length > 0) {
                      sections.importantDays = importantDaysLines.join('\n').trim();
                      debugLog('🔍 【重要な日絵文字検出】:', sections.importantDays);
                      
                      // 重要な日の行を除去したテキストで以降の処理を続行
                      fortuneText = otherLines.join('\n').trim();
                    }
                    
                    const sectionMatches = fortuneText.match(/【[^】]*】[^【]*/g) || [];
                    const markdownSections = fortuneText.match(/###[^#]*?(?=###|$)/g) || [];
                    
                    debugLog('🔍 【セクション検出】マッチした【】セクション数:', sectionMatches.length);
                    debugLog('🔍 【セクション検出】マッチしたセクション:', sectionMatches);
                    debugLog('🔍 【セクション検出】マッチした### セクション数:', markdownSections.length);
                    debugLog('🔍 【セクション検出】マッチした### セクション:', markdownSections);
                    
                    // 【】形式の処理
                    sectionMatches.forEach((section, index) => {
                      debugLog(`🔍 【セクション${index}】内容:`, section);
                      
                      if (section.includes('総合運') || section.includes('全体運') || section.includes('全体的')) {
                        sections.innerChange = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【総合運設定】:', sections.innerChange);
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運') || section.includes('お金')) {
                        sections.emotionalFlow = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【金銭運設定】:', sections.emotionalFlow);
                      } else if (section.includes('恋愛運') || section.includes('恋愛') || section.includes('人間関係') || section.includes('愛情')) {
                        sections.unconsciousChange = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【恋愛運設定】:', sections.unconsciousChange);
                      } else if (section.includes('仕事運') || section.includes('仕事') || section.includes('キャリア') || section.includes('職業')) {
                        sections.honneBalance = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【仕事運設定】:', sections.honneBalance);
                      } else if (section.includes('成長運') || section.includes('成長') || section.includes('発展') || section.includes('向上')) {
                        sections.soulGrowth = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【成長運設定】:', sections.soulGrowth);
                      } else if (section.includes('重要な日') || section.includes('重要日') || section.includes('重要な月') || section.includes('ラッキーデー') || section.includes('注意日') || section.includes('ラッキー月') || section.includes('注意月')) {
                        if (!sections.importantDays) {
                          sections.importantDays = section.replace(/【[^】]*】/, '').trim();
                          debugLog('🔍 【重要な日/月設定】:', sections.importantDays);
                        }
                      } else {
                        debugLog('🔍 【未分類セクション】:', section);
                      }
                    });
                    
                    // ### 形式の処理
                    markdownSections.forEach((section, index) => {
                      debugLog(`🔍 【### セクション${index}】内容:`, section);
                      
                      if (section.includes('総合運') || section.includes('全体運') || section.includes('全体的')) {
                        sections.innerChange = section.replace(/###[^#]*/, '').trim();
                        debugLog('🔍 【### 総合運設定】:', sections.innerChange);
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運') || section.includes('お金')) {
                        sections.emotionalFlow = section.replace(/###[^#]*/, '').trim();
                        debugLog('🔍 【### 金銭運設定】:', sections.emotionalFlow);
                      } else if (section.includes('恋愛運') || section.includes('恋愛') || section.includes('人間関係') || section.includes('愛情')) {
                        sections.unconsciousChange = section.replace(/###[^#]*/, '').trim();
                        debugLog('🔍 【### 恋愛運設定】:', sections.unconsciousChange);
                      } else if (section.includes('仕事運') || section.includes('仕事') || section.includes('キャリア') || section.includes('職業')) {
                        sections.honneBalance = section.replace(/###[^#]*/, '').trim();
                        debugLog('🔍 【### 仕事運設定】:', sections.honneBalance);
                      } else if (section.includes('成長運') || section.includes('成長') || section.includes('発展') || section.includes('向上')) {
                        sections.soulGrowth = section.replace(/###[^#]*/, '').trim();
                        debugLog('🔍 【### 成長運設定】:', sections.soulGrowth);
                      } else {
                        debugLog('🔍 【### 未分類セクション】:', section);
                      }
                    });
                    
                    // 【】記号がない場合のフォールバック処理
                    if (sectionMatches.length === 0 && markdownSections.length === 0) {
                      debugLog('🔍 【フォールバック処理】【】記号と###記号がないため、正規表現ベースでパース開始');
                      
                      // 正規表現で運勢項目の開始を正確に検出
                      const fortunePatterns = [
                        { key: 'innerChange', regex: /(^|\n\n?)(総合運|全体運)(として|については|では|に関しては|について|に関して|の場合|において)?[、\s]*(.*?)(?=\n\n?(金銭運|金運|恋愛運|仕事運|成長運)|$)/s },
                        { key: 'emotionalFlow', regex: /(^|\n\n?)(金銭運|金運)(として|については|では|に関しては|について|に関して|の場合|において)?[、\s]*(.*?)(?=\n\n?(総合運|全体運|恋愛運|仕事運|成長運)|$)/s },
                        { key: 'unconsciousChange', regex: /(^|\n\n?)(恋愛運)(として|については|では|に関しては|について|に関して|の場合|において)?[、\s]*(.*?)(?=\n\n?(総合運|全体運|金銭運|金運|仕事運|成長運)|$)/s },
                        { key: 'honneBalance', regex: /(^|\n\n?)(仕事運)(として|については|では|に関しては|について|に関して|の場合|において)?[、\s]*(.*?)(?=\n\n?(総合運|全体運|金銭運|金運|恋愛運|成長運)|$)/s },
                        { key: 'soulGrowth', regex: /(^|\n\n?)(成長運)(として|については|では|に関しては|について|に関して|の場合|において)?[、\s]*(.*?)(?=\n\n?(総合運|全体運|金銭運|金運|恋愛運|仕事運)|$)/s }
                      ];
                      
                      fortunePatterns.forEach(({ key, regex }) => {
                        const match = fortuneText.match(regex);
                        if (match && match[4]) {
                          const content = match[4].trim().replace(/^[、。\s]+/, '').trim();
                          
                          if (content.length > 10) {
                            if (key === 'innerChange') sections.innerChange = content;
                            else if (key === 'emotionalFlow') sections.emotionalFlow = content;
                            else if (key === 'unconsciousChange') sections.unconsciousChange = content;
                            else if (key === 'honneBalance') sections.honneBalance = content;
                            else if (key === 'soulGrowth') sections.soulGrowth = content;
                            
                            debugLog(`🔍 【正規表現フォールバック】${key}設定:`, content);
                          }
                        }
                      });
                      
                      // キーワードベースでも何も取得できない場合の最終フォールバック
                      const hasAnyContent = Object.values(sections).some(value => value.length > 0);
                      if (!hasAnyContent) {
                        debugLog('🔍 【最終フォールバック】段落分割でセクション作成');
                        const paragraphs = fortuneText.split(/\n\n+/).filter(p => p.trim().length > 20);
                        
                        if (paragraphs.length >= 3) {
                          sections.innerChange = paragraphs[0]?.trim() || '';
                          sections.emotionalFlow = paragraphs[1]?.trim() || '';
                          sections.unconsciousChange = paragraphs[2]?.trim() || '';
                          sections.honneBalance = paragraphs[3]?.trim() || '';
                          sections.soulGrowth = paragraphs[4]?.trim() || '';
                          debugLog('🔍 【最終フォールバック】段落分割完了');
                        }
                      }
                    }
                    
                    debugLog('🔍 【最終解析結果】:', sections);
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level2Fortune);
                  
                  // セクションが空の場合のフォールバック表示
                  const hasAnySections = fortuneSections.innerChange || fortuneSections.emotionalFlow || 
                                       fortuneSections.unconsciousChange || fortuneSections.honneBalance || 
                                       fortuneSections.soulGrowth || fortuneSections.importantDays;
                  
                  debugLog('🔍 【表示判定】セクション存在チェック:', hasAnySections);
                  
                  if (!hasAnySections) {
                    debugLog('🔍 【フォールバック表示】解析失敗のため適切なメッセージを表示');
                    return (
                      <div className="fortune-card">
                        <h4 className="fortune-title">🔮 占い結果</h4>
                        <div className="fortune-content">
                          <p>占い結果を正しく解析できませんでした。もう一度「占う」ボタンを押してください。</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {fortuneSections.innerChange && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 総合運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.innerChange}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.emotionalFlow && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💰 金銭運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.emotionalFlow}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.unconsciousChange && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">❤️ 恋愛運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.unconsciousChange}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.honneBalance && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💼 仕事運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.honneBalance}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.soulGrowth && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 成長運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.soulGrowth}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.importantDays && selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow' && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">📅 重要な日</h4>
                          <div className="fortune-content">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{fortuneSections.importantDays}</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* AIチャット誘導ボタン */}
              <div className="ai-chat-guidance" style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '0.95rem' }}>💬 ３つの天体についてもっと詳しく聞きたいことがありますか？</p>
                <button 
                  onClick={() => window.location.href = '/ai-fortune'}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(0)'}
                >
                  🤖 AI占い師に相談する
                </button>
              </div>

            </div>
          )}
        </div>

                  {/* 星が伝える あなたの印象診断の説明 */}
        <div className="three-planets-introduction">
                      <h3 className="section-title">🌌 星が伝える あなたの印象診断とは</h3>
          <div className="intro-overview">
            <p>
              ３つの天体だけでは分からない、まわりから見たあなたの印象や振る舞いを大解剖！
              10天体すべての配置から、話し方・恋愛・仕事での行動パターンなど、
              周りが見ている「いつものあなた」の癖や特徴が詳しく明らかになります。
            </p>
          </div>
          
          <div className="three-planets-preview">
            <div className="planet-preview">
              <span className="planet-icon">🌟</span>
              <div className="planet-info">
                <h4>総合的な影響</h4>
                <p>10天体の配置から見える、あなたの全体的な性格や人生への影響、周りから見えるあなたの大まかな印象</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">💬</span>
              <div className="planet-info">
                <h4>話し方の癖</h4>
                <p>水星・太陽・上昇星座などの配置から見える、あなた特有の話し方やコミュニケーションの特徴</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">💕</span>
              <div className="planet-info">
                <h4>恋愛や行動</h4>
                <p>金星・火星・月などの配置から見える、恋愛での行動パターンや人間関係での振る舞い方</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">💼</span>
              <div className="planet-info">
                <h4>仕事での振る舞い</h4>
                <p>太陽・火星・土星などの配置から見える、職場でのあなたの行動パターンや働き方の特徴</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🔮</span>
              <div className="planet-info">
                <h4>変革と深層心理</h4>
                <p>冥王星・海王星・天王星などの外惑星から見える、内面的な変化や深層的な心理パターン</p>
              </div>
            </div>
          </div>
        </div>



        {/* レベルアップボタン */}
        <div className="level-up-section">
          <button 
            className="level-up-button"
            onClick={handleLevelUp}
          >
            星が伝える あなたの印象診断へ 🌌
          </button>
        </div>

        {/* 広告表示4: AI相談ボタンの上 */}
        <AdBanner 
          position="result-bottom" 
          size="medium" 
          demoMode={false} 
        />

        {/* アクションボタン */}
        <div className="action-buttons">
          <a href="/ai-fortune" className="ai-chat-button">
            🤖 AI占い師に相談する
          </a>
          <button 
            className="new-fortune-button"
            onClick={startNewFortune}
            type="button"
          >
            新しい占いを始める
          </button>
        </div>
      </div>
    );
  };

  const renderLevel3 = () => {
    if (!horoscopeData) return null;

    return (
      <div className="level-3">
        {/* 占いモード選択に戻るボタン */}
        <div className="back-button-container">
          <button 
            className="back-button"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/');
            }}
            type="button"
          >
            ← 占いモード選択に戻る
          </button>
        </div>
        
        <div className="level-title">
          <h2 className="level-title-text">🌌 星が伝える あなたの印象診断</h2>
        </div>

        {/* 広告表示5: まわりから見たあなたタイトルと結果の間 */}
        <AdBanner 
          position="level-transition" 
          size="medium" 
          demoMode={false} 
        />
        
        {/* あなたの天体配置 */}
        <div className="zodiac-section">
          <h3 className="section-title">⭐ あなたの天体配置</h3>
          <div className="four-sections-display">
            {/* セクション1: 基本的な性格 (太陽、月、上昇星座) */}
            <div className="section-card">
              <h4 className="section-title">🌟 基本的な性格</h4>
              <div className="section-description">あなたの根本的な性格、内面の感情、周囲に与える第一印象を示す基本的な天体です。太陽は外向きの性格、月は内面の感情、上昇星座は人に見せる顔を表します。</div>
              <div className="section-planets">
                {horoscopeData.planets.filter(p => ['太陽', '月', '上昇星座'].includes(p.planet)).map((planet, index) => {
                  const getPlanetEmoji = (planetName: string) => {
                    const planetEmojis: { [key: string]: string } = {
                                              '太陽': '☀️',
                        '月': '🌙',
                        '上昇星座': '🌅'
                    };
                    return planetEmojis[planetName] || '⭐';
                  };

                  return (
                    <div key={index} className="planet-item">
                      <div className="planet-title-line">
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* セクション2: 恋愛と行動力 (金星と火星) */}
            <div className="section-card">
              <h4 className="section-title">💕 恋愛と行動力</h4>
              <div className="section-description">恋愛での好みや美的センス、行動パターンやエネルギーの使い方を示す天体です。金星は恋愛観や美意識、火星は行動力や情熱を表します。</div>
              <div className="section-planets">
                {horoscopeData.planets.filter(p => ['金星', '火星'].includes(p.planet)).map((planet, index) => {
                  const getPlanetEmoji = (planetName: string) => {
                    const planetEmojis: { [key: string]: string } = {
                      '金星': '♀️',
                      '火星': '♂️'
                    };
                    return planetEmojis[planetName] || '⭐';
                  };

                  return (
                    <div key={index} className="planet-item">
                      <div className="planet-title-line">
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* セクション3: 知性と成長 (水星・木星・土星) */}
            <div className="section-card">
              <h4 className="section-title">🧠 知性と成長</h4>
              <div className="section-description">コミュニケーション能力、学習方法、成長のチャンス、責任感や制限を示す天体です。水星は思考力、木星は拡大発展、土星は試練や成長を表します。</div>
              <div className="section-planets">
                {horoscopeData.planets.filter(p => ['水星', '木星', '土星'].includes(p.planet)).map((planet, index) => {
                  const getPlanetEmoji = (planetName: string) => {
                    const planetEmojis: { [key: string]: string } = {
                      '水星': '☿️',
                      '木星': '♃',
                      '土星': '♄'
                    };
                    return planetEmojis[planetName] || '⭐';
                  };

                  return (
                    <div key={index} className="planet-item">
                      <div className="planet-title-line">
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* セクション4: 変革と深層心理 (外惑星) */}
            <div className="section-card">
              <h4 className="section-title">🌌 変革と深層心理</h4>
              <div className="section-description">人生の大きな変化、直感力、深層心理や潜在能力を示す天体です。天王星は変革・独創性、海王星は直感・想像力、冥王星は深層心理・再生を表します。</div>
              <div className="section-planets">
                {horoscopeData.planets.filter(p => ['天王星', '海王星', '冥王星'].includes(p.planet)).map((planet, index) => {
                  const getPlanetEmoji = (planetName: string) => {
                    const planetEmojis: { [key: string]: string } = {
                      '天王星': '♅',
                      '海王星': '♆',
                      '冥王星': '♇'
                    };
                    return planetEmojis[planetName] || '⭐';
                  };

                  return (
                    <div key={index} className="planet-item">
                      <div className="planet-title-line">
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* まわりから見たあなた */}
        <div className="personality-section">
          <h3 className="section-title">🌟 まわりから見たあなた</h3>
          <div className="analysis-overview">
            <p>
              天体の配置から、周りの人があなたをどのように見ているかを詳しく分析します。
              話し方・コミュニケーションの特徴、恋愛での行動パターン、仕事での振る舞い方など、
              外から見えるあなたの魅力や印象を徹底解析します。より魅力的に見せるコツもお教えします。
            </p>
          </div>
          
          {/* 自動分析中の表示 */}
          {isGeneratingLevel3Analysis && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>まわりから見たあなたの分析を生成中...お待ちください</p>
            </div>
          )}
          
          {/* AI分析結果の表示 */}
          {level3Analysis && !isGeneratingLevel3Analysis && (
            <div className="ai-analysis-results">
              {/* まわりから見たあなた - 5つの分析項目 */}
              {level3Analysis.tenPlanetSummary && (
                <>
                  <div className="analysis-category major-analysis">
                    <h4>🌟 総合的な影響</h4>
                    <p>{level3Analysis.tenPlanetSummary.overallInfluence || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                  
                  <div className="analysis-category major-analysis">
                    <h4>💬 話し方の癖</h4>
                    <p>{level3Analysis.tenPlanetSummary.communicationStyle || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                  
                  <div className="analysis-category major-analysis">
                    <h4>💕 恋愛や行動</h4>
                    <p>{level3Analysis.tenPlanetSummary.loveAndBehavior || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                  
                  <div className="analysis-category major-analysis">
                    <h4>💼 仕事での振る舞い</h4>
                    <p>{level3Analysis.tenPlanetSummary.workBehavior || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                  
                  <div className="analysis-category major-analysis">
                    <h4>🔮 変革と深層心理</h4>
                    <p>{level3Analysis.tenPlanetSummary.transformationAndDepth || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* AI分析が利用できない場合のメッセージ */}
          {!level3Analysis && !isGeneratingLevel3Analysis && (
            <div className="ai-analysis-error">
              <p>AI分析データの読み込みに失敗しました。</p>
              <div className="error-actions">
                <button 
                  className="retry-button"
                  onClick={handleGenerateLevel3Analysis}
                >
                  再試行
                </button>
                <button 
                  className="clear-cache-button"
                  onClick={() => {
                    if (birthData) {
                      const cacheKey = `level3_analysis_v5_${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
                      localStorage.removeItem(cacheKey);
                      handleGenerateLevel3Analysis();
                    }
                  }}
                >
                  キャッシュクリア後再試行
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い</h3>
          
          <div className="fortune-selector">
            <div className="selector-row">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodSelection)}
                className="period-dropdown"
              >
                {periodOptions.level3.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}の占い
                  </option>
                ))}
              </select>
              
              <button 
                className="generate-fortune-button"
                onClick={handleGenerateLevel3Fortune}
                disabled={isGeneratingLevel3}
              >
                {isGeneratingLevel3 ? '占い中...' : '占う'}
              </button>
            </div>
          </div>
          
          {isGeneratingLevel3 && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
                              <p>まわりから見たあなたを分析中...お待ちください</p>
            </div>
          )}
          
          {(() => {
            debugLog('🔍 【Level3占い表示条件】level3Fortune:', !!level3Fortune);
            debugLog('🔍 【Level3占い表示条件】isGeneratingLevel3:', isGeneratingLevel3);
            debugLog('🔍 【Level3占い表示条件】level3Fortune内容:', level3Fortune?.substring(0, 200) + '...');
            return level3Fortune && !isGeneratingLevel3;
          })() && (
            <div className="five-fortunes-section">
                              <h3>🔮 星が伝える あなたの印象診断 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  debugLog('🔍 【Level3占い結果表示開始】====================');
                  debugLog('🔍 【Level3占い結果表示開始】level3Fortune:', level3Fortune);
                  
                  const parseAIFortune = (fortuneText: string | null) => {
                    debugLog('🔍 【Level3parseAIFortune開始】====================');
                    debugLog('🔍 【Level3parseAIFortune開始】fortuneText:', fortuneText);
                    
                    if (!fortuneText) {
                      debugLog('🔍 【Level3parseAIFortune】fortuneTextが空です');
                      return { overall: '', love: '', work: '', money: '', growth: '', importantDays: '' };
                    }
                    
                    const sections = {
                      overall: '',    // 総合運
                      money: '',      // 金銭運
                      love: '',       // 恋愛運
                      work: '',       // 仕事運
                      growth: '',     // 成長運
                      importantDays: ''
                    };
                    
                    // まず重要な日の絵文字を含む行を抽出
                    const lines = fortuneText.split('\n');
                    const importantDaysLines: string[] = [];
                    const otherLines: string[] = [];
                    
                    lines.forEach((line, index) => {
                      // 絵文字を含む行とその次の行（説明文）を重要な日として抽出
                      if (line.includes('🍀') || line.includes('⚠️')) {
                        importantDaysLines.push(line);
                        // 次の行が説明文の場合も含める
                        if (index + 1 < lines.length && !lines[index + 1].includes('🍀') && !lines[index + 1].includes('⚠️') && !lines[index + 1].includes('【') && !lines[index + 1].includes('###')) {
                          importantDaysLines.push(lines[index + 1]);
                        }
                      } else if (!importantDaysLines.includes(line)) {
                        otherLines.push(line);
                      }
                    });
                    
                    if (importantDaysLines.length > 0) {
                      sections.importantDays = importantDaysLines.join('\n').trim();
                      debugLog('🔍 【Level3 重要な日絵文字検出】:', sections.importantDays);
                      
                      // 重要な日の行を除去したテキストで以降の処理を続行
                      fortuneText = otherLines.join('\n').trim();
                    }
                    
                    // 【】形式と### 形式の両方を処理
                    const sectionMatches = fortuneText.match(/【[^】]*】[^【]*/g) || [];
                    const markdownSections = fortuneText.match(/###[^#]*?(?=###|$)/g) || [];
                    
                    debugLog('🔍 【Level3セクション分割結果】【】形式:', sectionMatches);
                    debugLog('🔍 【Level3セクション分割結果】### 形式:', markdownSections);
                    
                    // 【】形式の処理
                    sectionMatches.forEach(section => {
                      // 重要な日を優先的にチェック
                      if (section.includes('重要な日') || section.includes('重要日') || section.includes('重要な月') || section.includes('ラッキーデー') || section.includes('注意日') || section.includes('ラッキー月') || section.includes('注意月')) {
                        if (!sections.importantDays) {
                          sections.importantDays = section.replace(/【[^】]*】/, '').trim();
                          debugLog('🔍 【Level3 重要な日/月設定】:', sections.importantDays);
                        }
                      } else if (section.includes('総合運') || section.includes('総合的な運') || section.includes('全体運') || section.includes('総合的な配置')) {
                        sections.overall = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運') || section.includes('金銭面')) {
                        sections.money = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('恋愛運') || section.includes('恋愛・人間関係') || section.includes('恋愛') && section.includes('運')) {
                        sections.love = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('仕事運') || section.includes('キャリア') || section.includes('仕事面')) {
                        sections.work = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('成長運') || section.includes('成長チャンス') || section.includes('自己発展')) {
                        sections.growth = section.replace(/【[^】]*】/, '').trim();
                      }
                    });
                    
                    // ### 形式の処理
                    markdownSections.forEach(section => {
                      debugLog('🔍 【Level3 ### セクション解析中】:', section);
                      // 重要な日を優先的にチェック
                      if (section.includes('重要な日') || section.includes('重要日') || section.includes('重要な月') || section.includes('ラッキーデー') || section.includes('注意日') || section.includes('ラッキー月') || section.includes('注意月')) {
                        if (!sections.importantDays) {
                          sections.importantDays = section.replace(/###[^#]*?/, '').trim();
                          debugLog('🔍 【Level3 ### 重要な日/月設定】:', sections.importantDays);
                        }
                      } else if (section.includes('総合運') || section.includes('総合的な運') || section.includes('全体運') || section.includes('総合的な配置')) {
                        sections.overall = section.replace(/###[^#]*?/, '').trim();
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運') || section.includes('金銭面')) {
                        sections.money = section.replace(/###[^#]*?/, '').trim();
                      } else if (section.includes('恋愛運') || section.includes('恋愛・人間関係') || section.includes('恋愛') && section.includes('運')) {
                        sections.love = section.replace(/###[^#]*?/, '').trim();
                      } else if (section.includes('仕事運') || section.includes('キャリア') || section.includes('仕事面')) {
                        sections.work = section.replace(/###[^#]*?/, '').trim();
                      } else if (section.includes('成長運') || section.includes('成長チャンス') || section.includes('自己発展')) {
                        sections.growth = section.replace(/###[^#]*?/, '').trim();
                      }
                    });
                    
                    debugLog('🔍 【Level3解析結果】:', sections);
                    
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level3Fortune);
                  
                  return (
                    <>
                      {fortuneSections.overall && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 総合運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.overall}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.money && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💰 金銭運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.money}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.love && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💕 恋愛運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.love}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.work && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💼 仕事運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.work}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.growth && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌱 成長運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.growth}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 重要な日/月の表示 */}
                      {(fortuneSections as any).importantDays && selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow' && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">📅 {selectedPeriod === 'sixMonths' || selectedPeriod === 'oneYear' || selectedPeriod === 'twoYears' || selectedPeriod === 'threeYears' || selectedPeriod === 'fiveYears' ? '重要な月' : '重要な日'}</h4>
                          <div className="fortune-content">
                            <p style={{ whiteSpace: 'pre-line' }}>{(fortuneSections as any).importantDays}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 占い結果の解析に失敗した場合のフォールバック */}
                      {!fortuneSections.overall && !fortuneSections.money && !fortuneSections.love && !fortuneSections.work && !fortuneSections.growth && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🔮 占い結果</h4>
                          <div className="fortune-content">
                            <p>占い結果を正しく解析できませんでした。もう一度「占う」ボタンを押してください。</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* AIチャット誘導ボタン */}
              <div className="ai-chat-guidance" style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '0.95rem' }}>💬 まわりから見たあなたについてさらに深く聞きたいことがありますか？</p>
                <button 
                  onClick={() => window.location.href = '/ai-fortune'}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(0)'}
                >
                  🤖 AI占い師に相談する
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 広告表示6: AI相談ボタンの上 */}
        <AdBanner 
          position="result-bottom" 
          size="medium" 
          demoMode={false} 
        />

        {/* アクションボタン */}
        <div className="action-buttons">
          <a href="/ai-fortune" className="ai-chat-button">
            🤖 AI占い師に相談する
          </a>
          <button 
            className="new-fortune-button"
            onClick={startNewFortune}
            type="button"
          >
            新しい占いを始める
          </button>
        </div>
      </div>
    );
  };

  // 初期化処理
  useEffect(() => {
    const loadData = async () => {
      const storedData = localStorage.getItem('birthData');
      const selectedMode = localStorage.getItem('selectedMode');
      
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          
          // birthDateを文字列からDateオブジェクトに変換
          if (parsed.birthDate && typeof parsed.birthDate === 'string') {
            parsed.birthDate = new Date(parsed.birthDate);
          }
          
          // 3天体または10天体モードの場合、出生時刻と出生場所をチェック
          if (selectedMode === 'three-planets' || selectedMode === 'ten-planets') {
            const missingBirthTime = !parsed.birthTime || parsed.birthTime === '12:00';
            const missingBirthPlace = !parsed.birthPlace || 
                                      !parsed.birthPlace.city || 
                                      parsed.birthPlace.city === '東京';
            
            debugLog('🔍 StepByStepResult - データチェック:');
            debugLog('  selectedMode:', selectedMode);
            debugLog('  missingBirthTime:', missingBirthTime);
            debugLog('  missingBirthPlace:', missingBirthPlace);
            
            if (missingBirthTime || missingBirthPlace) {
              debugLog('🔍 必要なデータが不足しています。メッセージを表示します。');
              setShowDataMissingMessage(true);
              setLoading(false);
              return;
            }
          }
          
          setBirthData(parsed);
          
          // 出生データから天体計算を実行
          const horoscope = await generateCompleteHoroscope(parsed);
          setHoroscopeData(horoscope);
          
          setLoading(false);
        } catch (error) {
          debugError('データの読み込みエラー:', error);
          // データ読み込みエラーの場合、トップページにリダイレクト
          debugLog('🔍 データ読み込みエラーのため、トップページにリダイレクトします');
          navigate('/');
          return;
        }
      } else {
        // 出生データがない場合、トップページにリダイレクト
        debugLog('🔍 出生データが見つからないため、トップページにリダイレクトします');
        navigate('/');
        return;
      }
    };
    
    loadData();
  }, [navigate]);

  // レベル3になった時に自動的に分析を実行
  useEffect(() => {
    debugLog('🔍 【Level3 useEffect】実行チェック:');
    debugLog('  currentLevel:', currentLevel);
    debugLog('  selectedMode:', selectedMode);
    debugLog('  horoscopeData:', !!horoscopeData);
    debugLog('  birthData:', !!birthData);
    debugLog('  level3Analysis:', !!level3Analysis);
    debugLog('  level3Analysis.tenPlanetSummary:', !!level3Analysis?.tenPlanetSummary);
    debugLog('  isGeneratingLevel3Analysis:', isGeneratingLevel3Analysis);
    
    // 古い形式のlevel3Analysisをチェック（tenPlanetSummaryがない場合）
    if (level3Analysis && !level3Analysis.tenPlanetSummary) {
      debugLog('🔍 【古い形式検出】level3Analysisを削除して新形式で再生成します');
      setLevel3Analysis(null);
      // 古いキャッシュも削除
      if (birthData) {
        const baseKey = `${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
        ['v2', 'v3', 'v4', 'v5'].forEach(version => {
          const oldKey = `level3_analysis_${version}_${baseKey}`;
          if (localStorage.getItem(oldKey)) {
            localStorage.removeItem(oldKey);
            debugLog(`🧹 【古いキャッシュ削除】${oldKey}を削除しました`);
          }
        });
      }
      return;
    }
    
    if (currentLevel === 3 && horoscopeData && birthData && !level3Analysis && !isGeneratingLevel3Analysis) {
      debugLog('🔍 【Level3 AI分析】実行条件満足、開始します');
      handleGenerateLevel3Analysis();
    } else {
      debugLog('🔍 【Level3 AI分析】実行条件を満たしていません');
    }
  }, [currentLevel, selectedMode, horoscopeData, birthData, level3Analysis, isGeneratingLevel3Analysis]);

  // selectedModeが変更された際にレベルを更新
  useEffect(() => {
    const newLevel = getInitialLevel();
    debugLog('🔍 selectedMode変更検出 - 新しいレベル:', newLevel);
    setCurrentLevel(newLevel);
  }, [getInitialLevel]);

  // 初期読み込み時のみページトップにスクロール
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  useEffect(() => {
    if (!loading && !error && !showDataMissingMessage && horoscopeData && birthData && !hasInitialScrolled) {
      debugLog('🔍 初期読み込み時のページトップスクロール');
      window.scrollTo(0, 0);
      setHasInitialScrolled(true);
    }
  }, [loading, error, showDataMissingMessage, horoscopeData, birthData, hasInitialScrolled]);

  // 3天体性格分析の実行管理用フラグ
  const [hasTriggeredGeneration, setHasTriggeredGeneration] = useState(false);
  
  // コンポーネントの初期化時に3天体性格分析を自動実行（レベル2でのみ）
  useEffect(() => {
    debugLog('🔍 【3天体性格分析useEffect】実行条件チェック');
    debugLog('  currentLevel:', currentLevel);
    debugLog('  horoscopeData:', !!horoscopeData);
    debugLog('  birthData:', !!birthData);
    debugLog('  threePlanetsPersonality:', !!threePlanetsPersonality);
    debugLog('  isGeneratingThreePlanetsPersonality:', isGeneratingThreePlanetsPersonality);
    debugLog('  hasTriggeredGeneration:', hasTriggeredGeneration);
    
    if (currentLevel === 2 && selectedMode === 'three-planets' && horoscopeData && birthData && !isGeneratingThreePlanetsPersonality && !hasTriggeredGeneration) {
      debugLog('🔍 【3天体性格分析】レベル2（3天体モード）で自動実行開始');
      setHasTriggeredGeneration(true);
      
      // 既存のthreePlanetsPersonalityが古い形式かチェック
      if (threePlanetsPersonality && !threePlanetsPersonality.innerChange) {
        debugLog('🔍 【古い形式検出】threePlanetsPersonalityを初期化して新形式で再生成');
        setThreePlanetsPersonality(null);
        // 古い形式のキャッシュを削除
        const key = generateThreePlanetsKey(birthData, horoscopeData.planets);
        localStorage.removeItem(key);
        debugLog('🔍 【古いキャッシュ削除】キー:', key);
        generateThreePlanetsPersonality();
        return;
      }
      
      if (!threePlanetsPersonality) {
        const saved = loadThreePlanetsPersonality();
        if (saved && saved.innerChange) {
          debugLog('🔍 【3天体性格分析】新形式の保存済みデータを使用');
          setThreePlanetsPersonality(saved);
        } else {
          debugLog('🔍 【3天体性格分析】新規生成を開始');
          // 古い形式のキャッシュを削除
          if (saved && !saved.innerChange) {
            const key = generateThreePlanetsKey(birthData, horoscopeData.planets);
            localStorage.removeItem(key);
            debugLog('🔍 【古いキャッシュ削除】キー:', key);
          }
          generateThreePlanetsPersonality();
        }
      }
    } else {
      debugLog('🔍 【3天体性格分析】実行条件を満たしていません');
    }
  }, [currentLevel, horoscopeData, birthData]);

  // selectedModeが変更された時の処理
  useEffect(() => {
    if (selectedMode === 'three-planets' && currentLevel === 2) {
      debugLog('🔍 【selectedMode変更】3天体モードに変更されました');
      // 3天体性格分析をリセットして新しい分析を開始
      setThreePlanetsPersonality(null);
      setIsGeneratingThreePlanetsPersonality(false);
      setHasTriggeredGeneration(false); // フラグもリセット
    }
  }, [selectedMode, currentLevel]);

  // データ不足時のメッセージ表示
  const renderDataMissingMessage = () => {
    const selectedMode = localStorage.getItem('selectedMode');
    // レベル1から2に上がる場合、またはselectedModeが'three-planets'の場合
    const isForThreePlanets = (currentLevel === 1) || (selectedMode === 'three-planets');
    const modeTitle = isForThreePlanets ? '3天体の本格占い' : '10天体の完全占い';
    
    const handleGoToRegistration = () => {
      // 適切なモードを設定してホーム画面に遷移
      const targetMode = isForThreePlanets ? 'three-planets' : 'ten-planets';
      localStorage.setItem('starflect_missing_data_mode', targetMode);
      localStorage.setItem('selectedMode', targetMode);
      // ページトップに移動
      window.scrollTo(0, 0);
      navigate('/');
    };
    
    return (
      <div className="data-missing-container">
        <div className="data-missing-card">
          <div className="data-missing-icon">🌟</div>
          <h2 className="data-missing-title">{modeTitle}で詳しく占うために</h2>
          <div className="data-missing-message">
            <p>出生時刻と出生場所を教えてください</p>
            <p>これらの情報で、あなたの星座をより正確に分析できます！</p>
          </div>
          <div className="data-missing-actions">
            <button 
              className="registration-button"
              onClick={handleGoToRegistration}
            >
              ✨ 出生時刻と出生場所を入力する
            </button>
            <button 
              className="back-button"
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/');
              }}
            >
              ← 占いモード選択に戻る
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 自動レベルアップは削除 - 各モードは独立して動作

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">エラー: {error}</div>;
  }

  if (showDataMissingMessage) {
    return renderDataMissingMessage();
  }

  return (
    <div className="step-by-step-result">
      {renderLevelResult()}
    </div>
  );
};

export default StepByStepResult; 