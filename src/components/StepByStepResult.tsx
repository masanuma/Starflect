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
      // AI分析を実行
      const timeContext = getTimeContextForAI();
      const randomId = Math.random().toString(36).substring(2, 8);
      const analysisPrompt = `
        あなたは経験豊富な占い師です。以下の条件で占いを行ってください：
        - 星座: ${sunSign}
        - 期間: ${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}
        - ランダムID: ${randomId}
        
        ${timeContext}
        
        **重要な文章作成ルール（必ず守ること）**：
        - ですます調で丁寧に記載すること
        - 特徴と注意点をできるだけ記載すること
        - 難しい言い回しや難しい熟語はできるだけ用いないこと
        - 利用者ターゲットは30代であるが理解力は大学生レベルとすること
        - 可能な限り具体的な例を用いて表現すること
        - **重要**: 「アセンダント」という用語は絶対に使用せず、必ず「上昇星座」と記載すること
        
        **重要**: 毎回新しい視点で分析を行い、異なる結果を提供してください。この分析は一度きりのものなので、創造性と多様性を重視してください。
        
        以下の5つの運勢について簡潔にアドバイスしてください：
        
        【全体運】
        (この期間の全体的な運勢と注意点)
        
        【恋愛運】
        (恋愛面での具体的なアドバイス)
        
        【仕事運】
        (仕事面での具体的なアドバイス)
        
        【健康運】
        (健康面での具体的なアドバイス)
        
        【金銭運】
        (金銭面での具体的なアドバイス)
        
        各項目は1-2文で簡潔に書いてください。読みやすさを重視し、要点を絞って記載してください。
      `;
      
      debugLog('🔍 【AI占い呼び出し】プロンプト:', analysisPrompt);
      
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData!, horoscopeData!.planets);
      
      debugLog('🔍 【AI占い結果】aiResult:', aiResult);
      debugLog('🔍 【AI占い結果】文字数:', aiResult?.length || 0);
      
      if (aiResult && aiResult.trim()) {
        debugLog('🔍 【占い結果設定】有効な結果を受信:', aiResult.substring(0, 200) + '...');
        setLevel1Fortune(aiResult);
        debugLog('🔍 【占い結果設定】level1Fortuneに設定完了');
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
        あなたは経験豊富な西洋占星術師です。以下の3天体の情報と性格分析結果を基に、${selectedPeriodLabel}の運勢を詳しく占ってください：
        
        【3天体の配置】
        - 太陽: ${sun?.sign} ${sun?.degree}度
        - 月: ${moon?.sign} ${moon?.degree}度
        - 上昇星座: ${ascendant?.sign} ${ascendant?.degree}度
        ${personalityContext}
        
        【占い期間】
        - 期間: ${selectedPeriodLabel}
        - ランダムID: ${randomId}
        
        ${timeContext}
        
        **重要な文章作成ルール（必ず守ること）**：
        - 文章はですます調で丁寧に記載すること
        - 特徴と注意点をできるだけ記載すること
        - 難しい言い回しや難しい熟語はできるだけ用いないこと
        - 利用者ターゲットは30代であるが理解力は大学生レベルとすること
        - 可能な限り具体的な例を用いて表現すること
        - プロンプトは利用者には見えないようにすること
        - 利用者の生年月日や出生場所の情報をプロンプトとして画面に表示しないこと
        - 文章の最後に「###」などの記号は絶対に記載しないこと
        - **重要**: 「アセンダント」という用語は絶対に使用せず、必ず「上昇星座」と記載すること
        
        **占い要求事項**：
        - 3天体の配置（太陽・月・上昇星座）と性格分析結果を総合的に考慮してください
        - ${selectedPeriodLabel}の星の運行（現在の天体の動きと影響）も考慮してください
        - 必ず各セクションで「太陽の${sun?.sign}の影響で〜」「月の${moon?.sign}により〜」「上昇星座の${ascendant?.sign}から〜」のような具体的な3天体の影響を明記してください
        - 毎回新しい視点で分析を行い、異なる結果を提供してください
        - この分析は一度きりのものなので、創造性と多様性を重視してください
        
        以下の項目について簡潔に分析してください：
        
        【全体運】
        太陽の${sun?.sign}、月の${moon?.sign}、上昇星座の${ascendant?.sign}の影響を明記しながら、この期間の総合的な運勢と注意点を1-2文で記載。
        
        【恋愛運】
        太陽・月・上昇星座の影響を含めて、恋愛・パートナーシップの分析結果を踏まえた、この期間の恋愛運勢を1-2文で記載。
        
        【仕事運】
        3天体の影響を明記しながら、仕事への取り組み方の分析を基に、この期間の仕事運勢を1-2文で記載。
        
        【健康運】
        太陽・月・上昇星座の影響を考慮した、この期間の健康面での注意点とアドバイスを1-2文で記載。
        
        【金銭運】
        3天体の影響を含めて、性格分析結果から見える金銭管理の傾向を踏まえた、この期間の金銭運を1-2文で記載。`;
      
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
        debugLog('🔍 【3天体占い結果設定】level2Fortuneに設定完了');
      } else {
        debugLog('🔍 【3天体占いエラー】AIの応答が空またはnull');
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
      const planetsInfo = horoscopeData.planets.map(p => `${p.planet}: ${p.sign} ${p.degree}度`).join(', ');
      
      const currentDate = new Date();
      const timeContext = getTimeContextForAI();
      const randomId = Math.random().toString(36).substring(2, 8);
      const analysisPrompt = `
        あなたは経験豊富な西洋占星術師です。以下の10天体の配置を使って完全な占いを行ってください：
        ${planetsInfo}
        - 期間: ${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}
        - ランダムID: ${randomId}
        
        ${timeContext}
        
        **重要な文章作成ルール（必ず守ること）**：
        - ですます調で丁寧に記載すること
        - 特徴と注意点をできるだけ記載すること
        - 難しい言い回しや難しい熟語はできるだけ用いないこと
        - 利用者ターゲットは30代であるが理解力は大学生レベルとすること
        - 可能な限り具体的な例を用いて表現すること
        - **重要**: 「アセンダント」という用語は絶対に使用せず、必ず「上昇星座」と記載すること
        
        **10天体の占い要求事項**：
        - 10天体すべての相互作用を考慮して分析してください
        - 各天体の影響を具体的に明記してください（例：「太陽の○○座の影響で〜」）
        - 天体の組み合わせによる特別な効果も考慮してください
        - 毎回新しい視点で分析を行い、異なる結果を提供してください
        
        以下の5つの運勢について、10天体の配置を基に簡潔に分析してください：
        
        【全体運】
        10天体の総合的な配置から見たこの期間の全体的な運勢と注意点
        
        【恋愛運】
        金星・火星・月・上昇星座などの配置から見た恋愛面での具体的なアドバイス
        
        【仕事運】
        太陽・土星・木星・水星などの配置から見た仕事面での具体的なアドバイス
        
        【健康運】
        太陽・月・火星・土星などの配置から見た健康面での具体的なアドバイス
        
        【金銭運】
        木星・土星・金星・太陽などの配置から見た金銭面での具体的なアドバイス
        
        ${selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow' ? `
        【重要な日/月】
        この期間中の特に重要な日や月を10天体の配置から分析してください。
        - ${selectedPeriod === 'sixMonths' || selectedPeriod === 'oneYear' || selectedPeriod === 'twoYears' || selectedPeriod === 'threeYears' || selectedPeriod === 'fiveYears' ? '年月' : '日付'}で具体的に示してください
        - 🍀マークで良い日、⚠️マークで注意すべき日を表してください
        - 例：${selectedPeriod === 'sixMonths' || selectedPeriod === 'oneYear' || selectedPeriod === 'twoYears' || selectedPeriod === 'threeYears' || selectedPeriod === 'fiveYears' ? '🍀2025年3月 - 金星の影響で恋愛運が上昇' : '🍀2025年1月15日 - 金星の影響で恋愛運が上昇'}
        - 例：${selectedPeriod === 'sixMonths' || selectedPeriod === 'oneYear' || selectedPeriod === 'twoYears' || selectedPeriod === 'threeYears' || selectedPeriod === 'fiveYears' ? '⚠️2025年6月 - 土星の影響で仕事で注意が必要' : '⚠️2025年2月10日 - 土星の影響で仕事で注意が必要'}
        ` : ''}
        
        各項目は1-2文で簡潔に書き、どの天体の影響かを明記してください。読みやすさを重視し、要点を絞って記載してください。
      `;
      
      debugLog('🔍 【Level3占い】AI占い師呼び出し開始');
      debugLog('🔍 【Level3占い】analysisPrompt:', analysisPrompt);
      
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData!, horoscopeData!.planets);
      
      debugLog('🔍 【Level3占い】AI占い師結果:', aiResult);
      debugLog('�� 【Level3占い】結果文字数:', aiResult?.length || 0);
      
      if (aiResult && aiResult.trim()) {
        debugLog('🔍 【Level3占い】有効な結果を受信:', aiResult.substring(0, 200) + '...');
        setLevel3Fortune(aiResult);
        debugLog('🔍 【Level3占い】level3Fortuneに設定完了');
      } else {
        debugLog('🔍 【Level3占いエラー】AIの応答が空またはnull');
        setLevel3Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
      }
    } catch (error) {
      debugError('レベル3占い生成エラー:', error);
      debugError('エラーの詳細:', error instanceof Error ? error.message : String(error));
      setLevel3Fortune('10天体の分析中にエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
      setIsGeneratingLevel3(false);
    }
  };

  // レベル3のAI分析生成（自動実行・キャッシュ機能付き）
  const handleGenerateLevel3Analysis = useCallback(async () => {
    if (!horoscopeData || !birthData) return;
    
    // キャッシュキーを生成（v5: フォーマット厳守対応）
    const cacheKey = `level3_analysis_v5_${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
    
    // 古いバージョンのキャッシュを削除（既存ユーザー対応）
    const baseKey = `${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
    ['v2', 'v3', 'v4'].forEach(version => {
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
    } catch (error) {
      debugError('レベル3AI分析エラー:', error);
      debugError('エラーの詳細:', error instanceof Error ? error.message : String(error));
      // エラーの場合はデフォルトの分析結果を設定
      const defaultAnalysis = {
        personalityInsights: {
          corePersonality: '現在AI分析が利用できません。10天体の配置から基本的な性格を確認してください。',
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
        todaysFortune: {
          overallLuck: '現在AI分析が利用できません。',
          loveLuck: '現在AI分析が利用できません。',
          workLuck: '現在AI分析が利用できません。',
          healthLuck: '現在AI分析が利用できません。',
          moneyLuck: '現在AI分析が利用できません。',
          todaysAdvice: '現在AI分析が利用できません。'
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
        あなたは経験豊富な西洋占星術師です。以下の3天体の組み合わせから、この人の性格を詳しく分析してください：
        - 太陽: ${sun?.sign} ${sun?.degree}度
        - 月: ${moon?.sign} ${moon?.degree}度
        - 上昇星座: ${ascendant?.sign} ${ascendant?.degree}度
        
        ${timeContext}
        ランダムID: ${randomId}
        
        **重要な文章作成ルール（必ず守ること）**：
        - 文章はですます調で丁寧に記載すること
        - 特徴と注意点をできるだけ記載すること
        - 難しい言い回しや難しい熟語はできるだけ用いないこと
        - 利用者ターゲットは30代であるが理解力は大学生レベルとすること
        - 可能な限り具体的な例を用いて表現すること
        - プロンプトは利用者には見えないようにすること
        - 利用者の生年月日や出生場所の情報をプロンプトとして画面に表示しないこと
        - **重要**: 「アセンダント」という用語は絶対に使用せず、必ず「上昇星座」と記載すること
        
        **3天体の根拠を明記する重要なルール**：
        - 各セクションで、太陽・月・上昇星座のどの要素がその特徴に影響しているかを必ず明記すること
        - 例：「太陽の${sun?.sign}の影響で〜」「月の${moon?.sign}により〜」「上昇星座の${ascendant?.sign}から〜」
        - 各特徴について、どの天体のどの星座が根拠になっているかを具体的に説明すること
        
        以下の5つのセクションに分けて分析してください。各セクションは2-3文で具体的に記載してください：
        
        【総合的な性格】
        3天体の組み合わせから見える基本的な性格の特徴と注意点（どの天体のどの星座が影響しているかを明記）
        
        【人間関係のスタイル】
        友人や同僚との関係性の築き方の特徴と注意点（どの天体のどの星座が影響しているかを明記）
        
        【仕事への取り組み方】
        職場での行動パターンや仕事のスタイルの特徴と注意点（どの天体のどの星座が影響しているかを明記）
        
        【恋愛・パートナーシップ】
        恋愛関係やパートナーとの関係での特徴と注意点（どの天体のどの星座が影響しているかを明記）
        
        【成長のポイント】
        この3天体の組み合わせから見える成長の可能性とストレス対処法、意識すべき点（どの天体のどの星座が影響しているかを明記）
        
        各セクションは具体的で実用的なアドバイスを含めてください。例えば「太陽の${sun?.sign}の影響で職場では〜のような場面で力を発揮します」「月の${moon?.sign}により恋愛では〜に注意しましょう」といった具体例を使ってください。
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
    const sections = {
      overall: '',
      relationships: '',
      work: '',
      love: '',
      growth: ''
    };
    
    const sectionMatches = analysisText.match(/【[^】]*】[^【]*/g) || [];
    
    sectionMatches.forEach(section => {
      if (section.includes('総合的な性格') || section.includes('総合')) {
        sections.overall = section.replace(/【[^】]*】/, '').trim();
      } else if (section.includes('人間関係') || section.includes('人間関係のスタイル')) {
        sections.relationships = section.replace(/【[^】]*】/, '').trim();
      } else if (section.includes('仕事') || section.includes('仕事への取り組み方')) {
        sections.work = section.replace(/【[^】]*】/, '').trim();
      } else if (section.includes('恋愛') || section.includes('パートナーシップ')) {
        sections.love = section.replace(/【[^】]*】/, '').trim();
      } else if (section.includes('成長') || section.includes('成長のポイント')) {
        sections.growth = section.replace(/【[^】]*】/, '').trim();
      }
    });
    
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
          <h2 className="level-title-text">☀️ 太陽星座の簡単占い</h2>
        </div>

        {/* 広告表示1: 太陽星座タイトルと結果の間 */}
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
        
        {/* 星座から見たあなた */}
        <div className="personality-section">
          <h3 className="section-title">🌟 星座から見たあなた</h3>
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

        {/* 3天体の本格占いの説明 */}
        <div className="three-planets-introduction">
          <h3 className="section-title">🔮 3天体の本格占いとは</h3>
          <div className="intro-overview">
            <p>
              太陽星座だけでは分からない、あなたの隠れた無意識の行動パターン、上昇星座で「人から見られているあなたの印象」がわかります。月星座で「本当の感情やプライベートな自分」がわかります。この3つの組み合わせで、なぜ同じ星座でも人によって性格が違うのかが明確になります。
            </p>
          </div>
          
          <div className="three-planets-preview">
            <div className="planet-preview">
              <span className="planet-icon">🌙</span>
              <div className="planet-info">
                <h4>月星座：本当の感情・プライベートな自分</h4>
                <p>家族や親しい人前での本当のあなた</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🌅</span>
              <div className="planet-info">
                <h4>上昇星座：第一印象・見た目の特徴</h4>
                <p>初対面の人があなたに与える印象</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🎯</span>
              <div className="planet-info">
                <h4>3つの組み合わせによる詳細な性格分析</h4>
                <p>太陽・月・上昇星座の複合的な性格診断</p>
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
            3天体の本格占いへ 🔮
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
          <h2 className="level-title-text">🔮 3天体の本格占い</h2>
        </div>

        {/* 広告表示3: 3天体タイトルと結果の間 */}
        <AdBanner 
          position="level-transition" 
          size="medium" 
          demoMode={false} 
        />
        
        {/* あなたの3天体セクション */}
        <div className="zodiac-section">
          <h3 className="section-title">⭐ あなたの3天体</h3>
          <div className="three-planets-display">
            <div className="planet-card">
              <div className="planet-description">
                あなたの基本的な性格と人生の目的を表します。<br/>
                意識的な自己表現や、周囲に見せたい理想の自分を示しています。<br/>
                <br/>
              </div>
              <div className="planet-title-line">
                <br/>
                <span className="planet-emoji">☀️</span>
                <span className="planet-name">太陽星座</span>
                <span className="zodiac-emoji">{zodiacInfo[sun?.sign || '']?.icon}</span>
                <span className="zodiac-name">{sun?.sign}</span>
              </div>
            </div>
            <div className="planet-card">
              <div className="planet-description">
                内面の感情や本音、無意識の反応パターンを表します。<br/>
                プライベートな場面での素の感情や、心の奥深くにある欲求を示しています。<br/>
                <br/>
              </div>
              <div className="planet-title-line">
                <br/>
                <span className="planet-emoji">🌙</span>
                <span className="planet-name">月星座</span>
                <span className="zodiac-emoji">{zodiacInfo[moon?.sign || '']?.icon}</span>
                <span className="zodiac-name">{moon?.sign}</span>
              </div>
            </div>
            <div className="planet-card">
              <div className="planet-description">
                他人に与える第一印象や外見的な特徴を表します。<br/>
                初対面の人が感じるあなたの雰囲気や、自然な行動パターンを示しています。<br/>
                <br/>
              </div>
              <div className="planet-title-line">
                <br/>
                <span className="planet-emoji">🌅</span>
                <span className="planet-name">上昇星座</span>
                <span className="zodiac-emoji">{zodiacInfo[ascendant?.sign || '']?.icon}</span>
                <span className="zodiac-name">{ascendant?.sign}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3天体から見たあなた */}
        <div className="personality-section">
          <h3 className="section-title">🌟 3天体から見たあなた</h3>
          
          {/* 概要説明 */}
          {!threePlanetsPersonality && !isGeneratingThreePlanetsPersonality && (
            <div className="analysis-overview">
              <p>
                {sun?.sign}の太陽星座、{moon?.sign}の月星座、{ascendant?.sign}の上昇星座という3つの天体の組み合わせから、あなたの複層的な性格を詳しく分析します。
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
                  {(threePlanetsPersonality.overall || threePlanetsPersonality.relationships || 
                    threePlanetsPersonality.work || threePlanetsPersonality.love || 
                    threePlanetsPersonality.growth) ? (
                    <>
                      {threePlanetsPersonality.overall && (
                        <div className="personality-card">
                          <h4 className="personality-title">🌟 総合的な性格</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.overall}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.relationships && (
                        <div className="personality-card">
                          <h4 className="personality-title">👥 人間関係のスタイル</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.relationships}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.work && (
                        <div className="personality-card">
                          <h4 className="personality-title">💼 仕事への取り組み方</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.work}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.love && (
                        <div className="personality-card">
                          <h4 className="personality-title">💕 恋愛・パートナーシップ</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.love}</p>
                          </div>
                        </div>
                      )}
                      
                      {threePlanetsPersonality.growth && (
                        <div className="personality-card">
                          <h4 className="personality-title">🌱 成長のポイント</h4>
                          <div className="personality-content">
                            <p>{threePlanetsPersonality.growth}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="personality-card">
                      <h4 className="personality-title">🌟 3天体からみたあなた</h4>
                      <div className="personality-content">
                        <p>分析結果の読み込み中にエラーが発生しました。</p>
                        <button 
                          className="retry-button"
                          onClick={() => {
                            setThreePlanetsPersonality(null);
                            generateThreePlanetsPersonality();
                          }}
                        >
                          再度分析する
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 分析が開始されていない場合の初期状態表示 */}
          {!threePlanetsPersonality && !isGeneratingThreePlanetsPersonality && (
            <div className="three-planets-analysis-results">
              <div className="personality-card">
                <h4 className="personality-title">🌟 3天体からみたあなた</h4>
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
              <h3>🔮 3天体占い結果 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  const parseAIFortune = (fortuneText: string) => {
                    debugLog('🔍 【占い結果解析開始】入力テキスト:', fortuneText);
                    debugLog('🔍 【占い結果解析開始】テキスト長:', fortuneText?.length || 0);
                    
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
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
                    debugLog('�� 【セクション検出】マッチした### セクション数:', markdownSections.length);
                    debugLog('🔍 【セクション検出】マッチした### セクション:', markdownSections);
                    
                    // 【】形式の処理
                    sectionMatches.forEach((section, index) => {
                      debugLog(`🔍 【セクション${index}】内容:`, section);
                      
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
                      
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
                        sections.overall = section.replace(/###[^#]*?運/, '').trim();
                        debugLog('🔍 【### 全体運設定】:', sections.overall);
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        sections.love = section.replace(/###[^#]*?運/, '').trim();
                        debugLog('🔍 【### 恋愛運設定】:', sections.love);
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        sections.work = section.replace(/###[^#]*?運/, '').trim();
                        debugLog('🔍 【### 仕事運設定】:', sections.work);
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        sections.health = section.replace(/###[^#]*?運/, '').trim();
                        debugLog('🔍 【### 健康運設定】:', sections.health);
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        sections.money = section.replace(/###[^#]*?運/, '').trim();
                        debugLog('🔍 【### 金銭運設定】:', sections.money);
                      } else {
                        debugLog('🔍 【### 未分類セクション】:', section);
                      }
                    });
                    
                    debugLog('🔍 【最終解析結果】:', sections);
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level2Fortune);
                  
                  // セクションが空の場合のフォールバック表示
                  const hasAnySections = fortuneSections.overall || fortuneSections.love || 
                                       fortuneSections.work || fortuneSections.health || 
                                       fortuneSections.money || fortuneSections.importantDays;
                  
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
                          <h4 className="fortune-title">🏥 健康運</h4>
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
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '0.95rem' }}>💬 3天体についてもっと詳しく聞きたいことがありますか？</p>
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

        {/* 10天体の完全占いの説明 */}
        <div className="three-planets-introduction">
          <h3 className="section-title">🌌 10天体の完全占いとは</h3>
          <div className="intro-overview">
            <p>
              太陽・月・上昇星座だけでは分からない、あなたの深層心理、隠された才能、人生の使命まで完全に解明します。
              恋愛・結婚運の詳細、仕事での成功法則、人間関係の傾向など、10天体すべての配置から導き出される
              あなただけの人生攻略法が明らかになります。
            </p>
          </div>
          
          <div className="three-planets-preview">
            <div className="planet-preview">
              <span className="planet-icon">🌟</span>
              <div className="planet-info">
                <h4>基本的な性格（太陽・月・上昇星座）</h4>
                <p>あなたの根本的な性格、内面の感情、周囲に与える第一印象</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">💕</span>
              <div className="planet-info">
                <h4>恋愛と行動力（金星・火星）</h4>
                <p>恋愛での好みや美的センス、行動パターンやエネルギーの使い方</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🧠</span>
              <div className="planet-info">
                <h4>知性と成長（水星・木星・土星）</h4>
                <p>コミュニケーション能力、学習方法、成長のチャンス、責任感や制限</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🌌</span>
              <div className="planet-info">
                <h4>変革と深層心理（天王星・海王星・冥王星）</h4>
                <p>人生の大きな変化、直感力、深層心理や潜在能力</p>
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
            10天体の完全占いへ 🌌
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
          <h2 className="level-title-text">🌌 10天体の完全占い</h2>
        </div>

        {/* 広告表示5: 10天体タイトルと結果の間 */}
        <AdBanner 
          position="level-transition" 
          size="medium" 
          demoMode={false} 
        />
        
        {/* あなたの10天体 */}
        <div className="zodiac-section">
          <h3 className="section-title">⭐ あなたの10天体</h3>
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
        
        {/* 10天体から見たあなた */}
        <div className="personality-section">
          <h3 className="section-title">🌟 10天体から見たあなた</h3>
          <div className="analysis-overview">
            <p>
              10天体すべての配置と相互作用を徹底的に分析し、あなたの人生の設計図を読み解きます。
              表面的な性格だけでなく、深層心理、潜在能力、人生の使命、魂の成長方向まで、
              最も詳細で包括的な分析をお届けします。これはあなただけの特別な人生の指針です。
            </p>
          </div>
          
          {/* 自動分析中の表示 */}
          {isGeneratingLevel3Analysis && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>10天体の性格分析を生成中...お待ちください</p>
            </div>
          )}
          
          {/* AI分析結果の表示 */}
          {level3Analysis && !isGeneratingLevel3Analysis && (
            <div className="ai-analysis-results">
              {/* 10天体の総合分析 */}
              {level3Analysis.tenPlanetSummary && (
                <>
                  <div className="analysis-category major-analysis">
                    <h4>🌟 10天体の総合的な影響</h4>
                    <p>{level3Analysis.tenPlanetSummary.planetaryInfluences || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                  
                  <div className="analysis-category major-analysis">
                    <h4>📋 あなたの人生設計図</h4>
                    <p>{level3Analysis.tenPlanetSummary.lifeDesign || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                  
                  <div className="analysis-category major-analysis">
                    <h4>💡 実生活への活用アドバイス</h4>
                    <p>{level3Analysis.tenPlanetSummary.practicalAdvice || 'AI分析データの読み込みに失敗しました。'}</p>
                  </div>
                </>
              )}
              
              {/* 詳細な性格分析 */}
              <div className="personality-insights-section">
                <h4 className="section-subtitle">📊 詳細な性格分析</h4>
                
                <div className="analysis-category">
                  <h5>🌟 基本的な性格</h5>
                  <p>{level3Analysis.personalityInsights?.corePersonality || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>🌙 深層心理と感情パターン</h5>
                  <p>{level3Analysis.personalityInsights?.hiddenTraits || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>💫 人生観と価値観</h5>
                  <p>{level3Analysis.personalityInsights?.lifePhilosophy || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>💕 人間関係とコミュニケーション</h5>
                  <p>{level3Analysis.personalityInsights?.relationshipStyle || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>💼 キャリアと仕事への取り組み</h5>
                  <p>{level3Analysis.personalityInsights?.careerTendencies || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
              </div>
              
              {/* 詳細な運勢分析 */}
              <div className="fortune-insights-section">
                <h4 className="section-subtitle">🔮 詳細な運勢分析</h4>
                
                <div className="analysis-category">
                  <h5>🌈 総合的な人生の流れ</h5>
                  <p>{level3Analysis.detailedFortune?.overallTrend || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>💖 恋愛・結婚・パートナーシップ</h5>
                  <p>{level3Analysis.detailedFortune?.loveLife || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>🚀 仕事・キャリア・社会的成功</h5>
                  <p>{level3Analysis.detailedFortune?.careerPath || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>🌿 健康・体調・ライフスタイル</h5>
                  <p>{level3Analysis.detailedFortune?.healthWellness || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>💰 金運・財運・物質的豊かさ</h5>
                  <p>{level3Analysis.detailedFortune?.financialProspects || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
                
                <div className="analysis-category">
                  <h5>🌱 精神的成長・自己実現</h5>
                  <p>{level3Analysis.detailedFortune?.personalGrowth || 'AI分析データの読み込みに失敗しました。'}</p>
                </div>
              </div>
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
              <p>10天体を分析中...お待ちください</p>
            </div>
          )}
          
          {(() => {
            debugLog('🔍 【Level3占い表示条件】level3Fortune:', !!level3Fortune);
            debugLog('🔍 【Level3占い表示条件】isGeneratingLevel3:', isGeneratingLevel3);
            debugLog('🔍 【Level3占い表示条件】level3Fortune内容:', level3Fortune?.substring(0, 200) + '...');
            return level3Fortune && !isGeneratingLevel3;
          })() && (
            <div className="five-fortunes-section">
              <h3>🔮 10天体完全占い結果 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  debugLog('🔍 【Level3占い結果表示開始】====================');
                  debugLog('🔍 【Level3占い結果表示開始】level3Fortune:', level3Fortune);
                  
                  const parseAIFortune = (fortuneText: string | null) => {
                    debugLog('🔍 【Level3parseAIFortune開始】====================');
                    debugLog('🔍 【Level3parseAIFortune開始】fortuneText:', fortuneText);
                    
                    if (!fortuneText) {
                      debugLog('🔍 【Level3parseAIFortune】fortuneTextが空です');
                      return { overall: '', love: '', work: '', health: '', money: '', advice: '' };
                    }
                    
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
                      advice: '',
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
                      } else if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
                        sections.overall = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        sections.love = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        sections.work = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        sections.health = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        sections.money = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('アドバイス') || section.includes('今日の') || section.includes('今週の') || section.includes('今月の')) {
                        sections.advice = section.replace(/【[^】]*】/, '').trim();
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
                      } else if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
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
                    
                    debugLog('🔍 【Level3解析結果】:', sections);
                    
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level3Fortune);
                  
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
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '0.95rem' }}>💬 10天体についてさらに深く聞きたいことがありますか？</p>
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
    if (currentLevel === 3 && horoscopeData && birthData && !level3Analysis && !isGeneratingLevel3Analysis) {
      handleGenerateLevel3Analysis();
    }
  }, [currentLevel, horoscopeData, birthData, level3Analysis, isGeneratingLevel3Analysis]);

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

  // コンポーネントの初期化時に3天体性格分析を自動実行（レベル2でのみ）
  useEffect(() => {
    debugLog('🔍 【3天体性格分析useEffect】実行条件チェック');
    debugLog('  currentLevel:', currentLevel);
    debugLog('  horoscopeData:', !!horoscopeData);
    debugLog('  birthData:', !!birthData);
    debugLog('  threePlanetsPersonality:', !!threePlanetsPersonality);
    debugLog('  isGeneratingThreePlanetsPersonality:', isGeneratingThreePlanetsPersonality);
    
    if (currentLevel === 2 && horoscopeData && birthData && !threePlanetsPersonality && !isGeneratingThreePlanetsPersonality) {
      debugLog('🔍 【3天体性格分析】レベル2で自動実行開始');
      const saved = loadThreePlanetsPersonality();
      if (saved) {
        debugLog('🔍 【3天体性格分析】保存済みデータを使用');
        setThreePlanetsPersonality(saved);
      } else {
        debugLog('🔍 【3天体性格分析】新規生成を開始');
        // 保存されたデータがない場合は自動的に生成
        generateThreePlanetsPersonality();
      }
    } else {
      debugLog('🔍 【3天体性格分析】実行条件を満たしていません');
    }
  }, [currentLevel, horoscopeData, birthData, threePlanetsPersonality, isGeneratingThreePlanetsPersonality]);

  // selectedModeが変更された時の処理
  useEffect(() => {
    if (selectedMode === 'three-planets' && currentLevel === 2) {
      debugLog('🔍 【selectedMode変更】3天体モードに変更されました');
      // 3天体性格分析をリセットして新しい分析を開始
      setThreePlanetsPersonality(null);
      setIsGeneratingThreePlanetsPersonality(false);
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