import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthData, HoroscopeData, PlanetPosition } from '../types';
import { generateCompleteHoroscope, calculateTransitPositions } from '../utils/astronomyCalculator';
import { chatWithAIAstrologer, generateAIAnalysis, AIAnalysisResult } from '../utils/aiAnalyzer';
import { getSunSignFortuneContext } from '../utils/sunSignTraits';
import { getTimeContextForAI } from '../utils/dateUtils';
import { confirmAndClearResultsOnly } from '../utils/dataManager';
import { getPlanetSignDetailWithMeaning } from '../utils/planetSignTraits';
import AdBanner from './AdBanner';
import LoadingSpinner from './LoadingSpinner';


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

// 運勢別アイコンマッピング
const fortuneIcons = {
  overall: '🌟',    // 全体運
  love: '❤️',       // 恋愛運
  work: '💼',       // 仕事運
  health: '💪',     // 健康運
  money: '💰',      // 金運
  growth: '🌱',     // 成長運
  default: '⭐'     // デフォルト
};

// 運勢別評価を表示用に変換するヘルパー関数（JSX形式で返す）
const renderFortuneRating = (rating: number, fortuneType: keyof typeof fortuneIcons = 'default') => {
  const icon = fortuneIcons[fortuneType];
  const filledIcons = icon.repeat(Math.max(0, Math.min(rating, 5)));
  const emptyDashes = '－'.repeat(Math.max(0, 5 - rating));
  
  return (
    <span>
      <span style={{ color: getStarColor(rating) }}>{filledIcons}</span>
      <span style={{ color: '#000000' }}>{emptyDashes}</span>
    </span>
  );
};

// 従来の星評価（後方互換性のため残す・JSX形式）
const renderStars = (rating: number) => {
  const filledStars = '⭐'.repeat(Math.max(0, Math.min(rating, 5)));
  const emptyDashes = '－'.repeat(Math.max(0, 5 - rating));
  
  return (
    <span>
      <span style={{ color: getStarColor(rating) }}>{filledStars}</span>
      <span style={{ color: '#000000' }}>{emptyDashes}</span>
    </span>
  );
};

// 星評価の色分けを取得
const getStarColor = (rating: number): string => {
  if (rating >= 4) return '#FFD700'; // 金色（良い）
  if (rating >= 3) return '#FFA500'; // オレンジ（普通）
  return '#FF6B6B'; // 赤色（注意）
};

// 表示レベルの定義
type DisplayLevel = 1 | 2 | 3;

// 期間選択のタイプ
type PeriodSelection = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'threeMonths' | 'sixMonths' | 'oneYear';

interface StepByStepResultProps {
  mode?: 'simple' | 'detailed';
  selectedMode?: 'sun-sign' | 'ten-planets'; // Level2削除済み
}

const StepByStepResult: React.FC<StepByStepResultProps> = ({ selectedMode }) => {
  const navigate = useNavigate();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);

  // 新しい占いを始めるための関数
  const startNewFortune = () => {
    const confirmed = confirmAndClearResultsOnly(
      '新しい占いを始めますか？\n\n過去の占い結果はクリアされますが、お名前、生年月日、時刻、生まれた場所の情報は保持されます。\n同じ情報で新しい占いを実行できます。'
    );
    
    if (confirmed) {
      // 占い実行時の期間をリセット
      setFortunePeriod('today');
      
      // ページトップに移動
      window.scrollTo(0, 0);
      
      // トップページに遷移（モード選択画面）
      navigate('/');
    }
  };
  
  // selectedModeに基づいて初期レベルを設定
  const getInitialLevel = useCallback((): DisplayLevel => {
    debugLog('🔍 getInitialLevel - selectedMode:', selectedMode);
    if (false) { // Level2削除: selectedMode === 'three-planets'
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
    if (false) { // Level2削除: selectedMode === 'three-planets'
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
  const [fortunePeriod, setFortunePeriod] = useState<PeriodSelection>('today'); // 占い実行時の期間を保存
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
  
  // 🌟 個別天体詳細表示用の状態（定型文データベース使用）
  const [selectedPlanet, setSelectedPlanet] = useState<{planet: string, sign: string} | null>(null);
  const [planetDetailVisible, setPlanetDetailVisible] = useState<string | null>(null);
  const [planetDetail, setPlanetDetail] = useState<string>('');


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
    
    setFortunePeriod(selectedPeriod); // 占い実行時の期間を保存
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

      // 3要素統合占いの準備
      let analysisPrompt = '';
      try {
        // sunSignの型チェック
        if (!sunSign) {
          throw new Error('太陽星座が取得できません');
        }
        
        // 1. 現在の天体位置を取得
        const todayTransits = await calculateTransitPositions(
          {
            birthDate: new Date(),
            birthTime: '12:00',
            birthPlace: { city: '東京', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' }
          },
          new Date()
        );
        
        // 2. 太陽星座の基本特徴を取得
        const sunSignTraits = getSunSignFortuneContext(sunSign as any);
        
        // 3. 3要素統合プロンプトの作成
      const timeContext = getTimeContextForAI();
      const randomId = Math.random().toString(36).substring(2, 8);
        analysisPrompt = `
          あなたは親しみやすい占い師です。以下の3つの情報を統合して、12星座占いを行ってください：

          【1. あなたの星座情報】
          太陽星座: ${sunSign}
          
          【2. 現在の天体配置】
          ${todayTransits.map(p => `${p.planet}: ${p.sign}座`).join(', ')}
          
          【3. ${sunSign}座の基本的な特徴】
          ${sunSignTraits}
          
          **占いの方法**：
          1. あなたの${sunSign}座の特徴をベースに
          2. 現在の天体配置があなたに与える影響を分析し
          3. あなたの性格傾向を考慮した具体的なアドバイスを提供してください
          
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
        
          **重要**: これは「お手軽12星座占い」として、必ず3つの情報を統合した個人的な占い結果を提供してください。
          
          **必須要件**:
          - 各項目で必ず60-100文字程度で記述すること
          - ${sunSign}座の特徴を具体的に言及すること
          - 現在の天体配置の影響を明記すること
          - 期間「${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}」の特徴を反映すること
          
          以下の5つの運勢について、必ず上記3要素を統合し、各項目に5段階の星評価を付けて記述してください：
          
          **星評価について**：
          - ★★★★★ (5点): 非常に良い運勢
          - ★★★★☆ (4点): 良い運勢  
          - ★★★☆☆ (3点): 普通の運勢
          - ★★☆☆☆ (2点): やや注意が必要
          - ★☆☆☆☆ (1点): 注意が必要
        
        【全体運】
          ${sunSign}座のあなたの性格的特徴と、現在の天体配置（特に太陽と月の影響）を踏まえて、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の全体的な運勢と具体的なアドバイスを**絶対に60-100文字以内**で記述。
          運勢評価: ★★★☆☆
        
        【恋愛運】
          ${sunSign}座の恋愛傾向と現在の金星・火星の配置を考慮して、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の恋愛運と具体的な行動指針を**絶対に60-100文字以内**で記述。
          運勢評価: ★★★★☆
        
        【仕事運】
          ${sunSign}座の仕事への取り組み方と現在の太陽・水星の位置から、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の仕事運と成功のポイントを**絶対に60-100文字以内**で記述。
          運勢評価: ★★★★★
        
        【健康運】
          ${sunSign}座の体質的特徴と現在の天体の影響を考慮して、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の健康面での注意点と改善方法を**絶対に60-100文字以内**で記述。
          運勢評価: ★★☆☆☆
        
        【金銭運】
          ${sunSign}座の金銭感覚と現在の木星・土星の配置から、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の金運と具体的なアドバイスを**絶対に60-100文字以内**で記述。
          運勢評価: ★★★☆☆
          
          **絶対に守るべき厳守事項**: 
          - **重要**：各項目は絶対に60-100文字以内（これを超えることは絶対禁止）
          - 必ず${sunSign}座の特徴に言及
          - 必ず現在の天体配置の影響を明記
          - 必ず期間の特徴を反映
          - 必ず各項目に星評価（★★★☆☆形式）を付ける
          - **期間制御**：今日・明日の占いでは重要な日は絶対に表示しない
          - **期間制御**：今週・来週の場合のみラッキーデー・注意日を【重要な日】として独立したセクションで追加する
          - **金銭運とラッキーデー/注意日は絶対に分離する**
          - 長い説明や追加コメントは一切禁止
          - 指定された形式以外の追加テキストは禁止
          
                     **出力形式の例（今週・来週の場合）**：
           【全体運】
           内容...
           運勢評価: ★★★☆☆
           
           【恋愛運】
           内容...
           運勢評価: ★★★★☆
           
           【仕事運】
           内容...
           運勢評価: ★★★★★
           
           【健康運】
           内容...
           運勢評価: ★★☆☆☆
           
           【金銭運】
           内容...
           運勢評価: ★★★☆☆
           
           【重要な日】
           🍀 ラッキーデー：○月○日
           理由...
           
           ⚠️ 注意日：○月○日
           理由...
           
           **注意**：今日・明日の占いでは【重要な日】セクションは記載しない
        `;
        
        // 今日・明日以外の場合はラッキーデー/注意する日を追加
        const includeImportantDays = selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow';
        
        debugLog('🔍 【期間判定】selectedPeriod:', selectedPeriod, 'includeImportantDays:', includeImportantDays);
        
        if (includeImportantDays) {
          // 期間の範囲を計算
          const calculatePeriodRange = (period: string) => {
            const today = new Date();
            let startDate = new Date(today);
            let endDate = new Date(today);
            
            switch (period) {
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
              default:
                endDate.setDate(endDate.getDate() + 7);
            }
            
            return {
              start: startDate,
              end: endDate,
              startStr: startDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }),
              endStr: endDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
            };
          };
          
          const periodRange = calculatePeriodRange(selectedPeriod);
          
          analysisPrompt += `
          
          【重要な日】
          **必ず金銭運とは完全に分離した独立のセクションとして記載してください**
          
          **期間の厳守**：
          - 対象期間：${periodRange.startStr}〜${periodRange.endStr}
          - この期間外の日付は絶対に選択禁止
          - 過去の日付は絶対に選択禁止
          - 未来すぎる日付も選択禁止
          
          **必須条件**：
          - ラッキーデーは必ず${periodRange.startStr}〜${periodRange.endStr}の間の日付
          - 注意日も必ず${periodRange.startStr}〜${periodRange.endStr}の間の日付
          - 日付形式：「○月○日」（例：8月5日）
          - 曜日や年は記載しない
          
          以下の形式で記載してください：
          
          🍀 ラッキーデー：${periodRange.startStr}〜${periodRange.endStr}期間内の具体的な日付
          その日が重要な理由を1-2文で説明
          
          ⚠️ 注意日：${periodRange.startStr}〜${periodRange.endStr}期間内の具体的な日付
          注意が必要な理由を1-2文で説明
          
          **絶対禁止事項**：
          - ${periodRange.startStr}より前の日付を選択すること
          - ${periodRange.endStr}より後の日付を選択すること
          - 曖昧な期間表現（「来週後半」など）を使用すること
          
          **重要**：この【重要な日】セクションは金銭運や他の項目とは完全に分離し、独立した項目として記載してください。
          注意：マークダウン記号（**、-など）は使用せず、全体的な感想やまとめ文は記載しないでください。`;
          
          debugLog('🔍 【重要な日追加】期間:', periodRange.startStr, '〜', periodRange.endStr);
        }
             } catch (transitError) {
         console.warn('トランジット計算エラー:', transitError);
         // フォールバック: 従来の方式
         const timeContext = getTimeContextForAI();
         const randomId = Math.random().toString(36).substring(2, 8);
                  // フォールバック用に太陽星座の特徴を取得
         const sunSignTraitsFallback = getSunSignFortuneContext(sunSign as any);
         
         analysisPrompt = `
           あなたは親しみやすい占い師です。${sunSign}座の特徴を活かした12星座占いを行ってください：
           - 12星座: ${sunSign}
           - 期間: ${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}
           - ランダムID: ${randomId}
           ${previousLevel1Context}
           ${timeContext}
           
           【${sunSign}座の特徴】
           ${sunSignTraitsFallback}
           
           **必須要件**:
           - 各項目で必ず60-100文字程度で記述すること
           - ${sunSign}座の特徴を具体的に言及すること
           - 期間「${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}」の特徴を反映すること
           
           以下の5つの運勢について、必ず${sunSign}座の特徴と期間を考慮し、各項目に5段階の星評価を付けて記述してください：
           
           **星評価について**：
           - ★★★★★ (5点): 非常に良い運勢
           - ★★★★☆ (4点): 良い運勢  
           - ★★★☆☆ (3点): 普通の運勢
           - ★★☆☆☆ (2点): やや注意が必要
           - ★☆☆☆☆ (1点): 注意が必要
           
           【全体運】
           ${sunSign}座のあなたの性格的特徴を踏まえて、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の全体的な運勢と具体的なアドバイスを**絶対に60-100文字以内**で記述。
           運勢評価: ★★★☆☆

【恋愛運】  
           ${sunSign}座の恋愛傾向を考慮して、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の恋愛運と具体的な行動指針を**絶対に60-100文字以内**で記述。
           運勢評価: ★★★★☆

【仕事運】
           ${sunSign}座の仕事への取り組み方から、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の仕事運と成功のポイントを**絶対に60-100文字以内**で記述。
           運勢評価: ★★★★★

【健康運】
           ${sunSign}座の体質的特徴を考慮して、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の健康面での注意点と改善方法を**絶対に60-100文字以内**で記述。
           運勢評価: ★★☆☆☆

【金銭運】
           ${sunSign}座の金銭感覚から、${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}の金運と具体的なアドバイスを**絶対に60-100文字以内**で記述。
           運勢評価: ★★★☆☆
           
           **絶対に守るべき厳守事項**: 
           - **重要**：各項目は絶対に60-100文字以内（これを超えることは絶対禁止）
           - 必ず${sunSign}座の特徴に言及
           - 必ず期間の特徴を反映
           - 必ず各項目に星評価（★★★☆☆形式）を付ける
           - **期間制御**：今日・明日の占いでは重要な日は絶対に表示しない
           - **期間制御**：今週・来週の場合のみラッキーデー・注意日を【重要な日】として独立したセクションで追加する
           - **金銭運とラッキーデー/注意日は絶対に分離する**
           - 長い説明や追加コメントは一切禁止
           - 指定された形式以外の追加テキストは禁止
           
           **出力形式の例（今週・来週の場合）**：
           【全体運】
           内容...
           運勢評価: ★★★☆☆
           
           【恋愛運】
           内容...
           運勢評価: ★★★★☆
           
           【仕事運】
           内容...
           運勢評価: ★★★★★
           
           【健康運】
           内容...
           運勢評価: ★★☆☆☆
           
           【金銭運】
           内容...
           運勢評価: ★★★☆☆
           
           【重要な日】
           🍀 ラッキーデー：○月○日
           理由...
           
           ⚠️ 注意日：○月○日
           理由...
           
           **注意**：今日・明日の占いでは【重要な日】セクションは記載しない
         `;
         
         // フォールバック版でも今日・明日以外の場合はラッキーデー/注意する日を追加
         const includeImportantDaysFallback = selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow';
         
         if (includeImportantDaysFallback) {
           // 期間の範囲を計算
           const calculatePeriodRangeFallback = (period: string) => {
             const today = new Date();
             let startDate = new Date(today);
             let endDate = new Date(today);
             
             switch (period) {
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
               default:
                 endDate.setDate(endDate.getDate() + 7);
             }
             
             return {
               start: startDate,
               end: endDate,
               startStr: startDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }),
               endStr: endDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
             };
           };
           
           const periodRangeFallback = calculatePeriodRangeFallback(selectedPeriod);
           
           analysisPrompt += `
           
           【重要な日】
           **必ず金銭運とは完全に分離した独立のセクションとして記載してください**
           
           **期間の厳守**：
           - 対象期間：${periodRangeFallback.startStr}〜${periodRangeFallback.endStr}
           - この期間外の日付は絶対に選択禁止
           - 過去の日付は絶対に選択禁止
           - 未来すぎる日付も選択禁止
           
           **必須条件**：
           - ラッキーデーは必ず${periodRangeFallback.startStr}〜${periodRangeFallback.endStr}の間の日付
           - 注意日も必ず${periodRangeFallback.startStr}〜${periodRangeFallback.endStr}の間の日付
           - 日付形式：「○月○日」（例：8月5日）
           - 曜日や年は記載しない
           
           以下の形式で記載してください：
           
           🍀 ラッキーデー：${periodRangeFallback.startStr}〜${periodRangeFallback.endStr}期間内の具体的な日付
           その日が重要な理由を1-2文で説明
           
           ⚠️ 注意日：${periodRangeFallback.startStr}〜${periodRangeFallback.endStr}期間内の具体的な日付
           注意が必要な理由を1-2文で説明
           
           **絶対禁止事項**：
           - ${periodRangeFallback.startStr}より前の日付を選択すること
           - ${periodRangeFallback.endStr}より後の日付を選択すること
           - 曖昧な期間表現（「来週後半」など）を使用すること
           
           **重要**：この【重要な日】セクションは金銭運や他の項目とは完全に分離し、独立した項目として記載してください。
           注意：マークダウン記号（**、-など）は使用せず、全体的な感想やまとめ文は記載しないでください。`;
         }
      }
      
      debugLog('🔍 【AI占い呼び出し】プロンプト:', analysisPrompt);
      
      // Level1用にRailway環境変数を使用
      const { getOpenAIApiKey, isApiKeyAvailable, debugEnvConfig } = await import('../config/env');
      
      if (!isApiKeyAvailable()) {
        debugEnvConfig();
        throw new Error('OpenAI APIキーが設定されていません。');
      }
      
      const OPENAI_API_KEY = getOpenAIApiKey();

      const response = await fetch("/api/openai-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "あなたは親しみやすい占い師です。初心者向けの12星座占いを提供します。"
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.9,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API呼び出しに失敗しました');
      }

      const data = await response.json();
      const aiResult = data.choices[0]?.message?.content || '';
      
      debugLog('🔍 【AI占い結果】aiResult:', aiResult);
      debugLog('🔍 【AI占い結果】文字数:', aiResult.length);
      debugLog('🔍 【AI占い結果】重要な日含有チェック:', aiResult.includes('重要な日') || aiResult.includes('ラッキーデー') || aiResult.includes('🍀'));
      
      if (aiResult && aiResult.trim()) {
        debugLog('🔍 【占い結果設定】有効な結果を受信:', aiResult.substring(0, 200) + '...');
        
        // Level1占い結果を設定（解析済み形式で）
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
    debugLog('🔍 【Level2占い生成開始】====================');
    debugLog('🔍 【Level2占い生成開始】horoscopeData:', !!horoscopeData);
    debugLog('🔍 【Level2占い生成開始】birthData:', !!birthData);
    debugLog('🔍 【Level2占い生成開始】selectedPeriod:', selectedPeriod);
    
    if (!horoscopeData || !birthData) {
      debugLog('🔍 【Level2占い生成】必要なデータが不足しています');
      return;
    }
    
    setFortunePeriod(selectedPeriod); // 占い実行時の期間を保存
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
      
      // 【追加】現在の天体位置を取得（3要素統合）
      const currentTransits = await calculateTransitPositions(
        {
          birthDate: new Date(),
          birthTime: '12:00',
          birthPlace: { city: '東京', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' }
        },
        new Date()
      );
      
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
        あなたは「隠れた運勢」の専門家です。${selectedPeriodLabel}の運勢を、以下の3要素を統合して読み解いてください：
        
        【1. あなたの3天体（出生チャート）】
        - 価値観と意志: ${sun?.sign} ${sun?.degree}度 
        - 感情と直感: ${moon?.sign} ${moon?.degree}度
        - 無意識の行動: ${ascendant?.sign} ${ascendant?.degree}度
        
        【2. 現在の天体配置】
        ${currentTransits.map(p => `${p.planet}: ${p.sign}座 ${p.degree.toFixed(1)}度`).join(', ')}
        
        【3. あなたの性格分析結果】
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
        
        **3要素統合占いの方法**：
        - 【出生チャート】×【現在の天体】×【性格分析】の3要素を必ず統合すること
        - 出生時の3天体と現在の天体配置の相互作用から運勢を読み解くこと
        - 性格分析結果を踏まえた個人に特化した占いを提供すること
        
        **超重要緊急指示**：これは「占い・運勢予測」です。「性格分析」は絶対禁止です。
        
        **絶対に使用禁止の表現（違反すると即座に失格）**：
        - 「表の自分」「裏の自分」「本音」「内面」
        - 「〜な性格」「〜な特徴」「〜な傾向」「〜な側面」
        - 「太陽・牡牛座」「月・蟹座」などの天体名直接表記
        - 「特性により」「影響で」「〜を重視します」
        - 性格説明・特徴解説・分析的表現
        
        **必須表現（これ以外は禁止）**：
        - 「${selectedPeriodLabel}は〜な運勢です」
        - 「〜な運気が流れています」
        - 「〜が期待できるでしょう」
        - 「〜に注意が必要です」
        - 「〜すると良い結果が生まれます」
        
        **絶対に出力してはいけないセクション**：
        - 【3天体の影響】（完全禁止）
        - 【性格分析】（完全禁止）
        - 【特徴】（完全禁止）
        
        **隠れた運勢の視点**：
        - ${selectedPeriodLabel}の運勢の流れと変化
        - この期間に訪れる隠れたチャンスや注意点
        - 3天体の複合的な影響で生まれる特別な運勢のパターン
        - 普通の占いでは気づかない、この人だけの隠れた幸運や成長のタイミング
        
        **必須要件（占い・運勢特化）**:
        - 各項目で必ず60-100文字程度で記述すること
        - 3天体の影響による運勢の変化を記述すること（分析・特徴説明は禁止）
        - 現在の天体配置による運勢への影響を明記すること
        - 期間「${selectedPeriodLabel}」の運勢の特徴と予測を反映すること
        - 全ての項目で「〜な運勢です」「〜が期待できます」「〜でしょう」などの占い表現を使用
        
        以下の5つの運勢について、必ず上記3要素を統合し、各項目に5段階の星評価を付けて記述してください：
        
        **星評価について**：
        - ★★★★★ (5点): 非常に良い運勢
        - ★★★★☆ (4点): 良い運勢  
        - ★★★☆☆ (3点): 普通の運勢
        - ★★☆☆☆ (2点): やや注意が必要
        - ★☆☆☆☆ (1点): 注意が必要
        
        **厳格な出力指示（違反は絶対禁止）**：
        以下の5つのセクションのみ出力してください。他のセクションは一切出力禁止。
        
        【総合運】
        ${selectedPeriodLabel}は安定した運勢が続きそうです。新しいチャンスに恵まれる可能性が高く、積極的な行動が幸運を引き寄せるでしょう。前向きな気持ちで過ごすことが開運の鍵となります。
        運勢評価: ★★★☆☆
        
        【金銭運】
        ${selectedPeriodLabel}の金運は上昇傾向にあります。計画的な支出を心がけることで、予想以上の収入が期待できそうです。無駄遣いを控えめにするとより良い結果が生まれます。
        運勢評価: ★★★★☆
        
        【恋愛運】
        ${selectedPeriodLabel}の恋愛運は絶好調です。素敵な出会いや関係の進展が期待でき、積極的なアプローチが成功の鍵となります。自然体で接することで良い縁に恵まれるでしょう。
        運勢評価: ★★★★★
        
        【仕事運】
        ${selectedPeriodLabel}の仕事運は慎重さが必要な時期です。丁寧な取り組みが評価につながり、着実な成果が期待できます。チームワークを大切にすると良い結果が生まれます。
        運勢評価: ★★☆☆☆
        
        【成長運】
        ${selectedPeriodLabel}は学びの機会に恵まれる成長運です。新しいスキル習得により、将来への道筋が見えてくるでしょう。挑戦する気持ちが運気アップにつながります。
        運勢評価: ★★★☆☆
        
        **絶対禁止**：上記5つ以外のセクション（【3天体の影響】など）は一切出力しないでください。
        
        **最終確認事項（すべて必須）**: 
        - 各項目は絶対に60-100文字程度（短すぎる30-40文字は絶対禁止）
        - 占い・運勢表現のみ使用（分析・性格説明は完全禁止）
        - 「表の自分」「裏の自分」「〜な性格」「〜な特徴」「〜な傾向」は絶対使用禁止
        - 「太陽・牡牛座」「月・蟹座」などの天体名直接表記は禁止
        - 【3天体の影響】【性格分析】【特徴】セクションは絶対に出力禁止
        - 上記の例文と同じ長さと形式で出力する
        - 各項目に必ず星評価（★★★☆☆形式）を付ける
        - 期間（${selectedPeriodLabel}）を必ず各項目で言及する
        
        **最重要警告**：
        分析的な表現や性格説明を一切使わず、純粋な占い・運勢予測のみを出力してください。
        上記の例文を参考に、同様の文字数と占い表現で記述してください。
        
        **🚨Level2固定例文使用絶対禁止🚨**：
        - 「安定した運勢が続きます」のような固定文言は絶対使用禁止
        - 「上昇傾向にあります」「絶好調です」等の決まり文句も禁止
        - 「学びの機会に恵まれる」等のテンプレート表現も禁止
        - 期間ごとに完全に異なる独自の占い内容を生成すること
        
        **Level2期間別差別化指示**：
        ${(() => {
          const periodLabel = selectedPeriodLabel || '期間';
          
          if (periodLabel === '今日' || periodLabel === '明日') {
            return `**今日・明日専用（短期即効型）**：
            - 【総合運】：当日の具体的なタイミングや瞬間的な幸運に焦点
            - 【金銭運】：今日・明日の金銭チャンス、即座の収入機会
            - 【恋愛運】：当日のアプローチタイミング、瞬間的な出会い
            - 【仕事運】：今日・明日の成果、短期的な評価
            - 【成長運】：当日得られる気づき、瞬間的な学び`;
          } else if (periodLabel.includes('週')) {
            return `**週間専用（継続戦略型）**：
            - 【総合運】：1週間のリズムと流れ、段階的な変化
            - 【金銭運】：週間での金銭計画、継続的な収入増加
            - 【恋愛運】：週を通した関係発展、継続的なアプローチ
            - 【仕事運】：週単位のプロジェクト、継続的な取り組み
            - 【成長運】：週間学習計画、継続的なスキルアップ`;
          } else {
            return `**月間専用（計画達成型）**：
            - 【総合運】：月全体の運勢サイクル、月末への変化
            - 【金銭運】：月間予算計画、持続的な財運向上
            - 【恋愛運】：月を通した関係深化、長期的な恋愛戦略
            - 【仕事運】：月間目標達成、持続的な成果積み重ね
            - 【成長運】：月単位の成長計画、新習慣の定着`;
          }
        })()}
        
        **Level2出力指示**：
        上記の期間特性に完全に従い、${selectedPeriodLabel}専用の独自占い内容を各セクションで生成してください。
        固定的な表現は一切使用せず、60-100文字程度で具体的な運勢を記載してください。
        各セクション独自の星評価（★1〜5個）を設定してください。`;
      
      // 今日の占い以外では重要な日/月を追加
      if (includeImportantDays) {
        // 期間内の日付例を事前計算（Level2用）
        const availableDatesList: string[] = [];
        const current = new Date(periodRange.start);
        while (current <= periodRange.end) {
          availableDatesList.push(`${current.getMonth() + 1}月${current.getDate()}日`);
          current.setDate(current.getDate() + 1);
        }
        
        // ランダムに日付を選択（Level2用）
        const randomIndex1 = Math.floor(Math.random() * availableDatesList.length);
        let randomIndex2 = Math.floor(Math.random() * availableDatesList.length);
        while (randomIndex2 === randomIndex1 && availableDatesList.length > 1) {
          randomIndex2 = Math.floor(Math.random() * availableDatesList.length);
        }
        
        const luckyExample = availableDatesList[randomIndex1];
        const cautionExample = availableDatesList[randomIndex2] || availableDatesList[0];
        
        debugLog('🔍 【Level2日付生成】availableDatesList:', availableDatesList.slice(0, 5).join('、'));
        debugLog('🔍 【Level2日付生成】luckyExample:', luckyExample);
        debugLog('🔍 【Level2日付生成】cautionExample:', cautionExample);
        analysisPrompt += `
        
        【${importantDateTitle}】
        **期間の厳守**：
        - 対象期間：${periodRange.startStr}〜${periodRange.endStr}
        - この期間外の日付は絶対に選択禁止
        - 過去の日付は絶対に選択禁止
        - 未来すぎる日付も選択禁止
        
        **必須条件**：
        - ラッキー${isLongTerm ? '月' : 'デー'}は必ず${periodRange.startStr}〜${periodRange.endStr}の間の${isLongTerm ? '月' : '日付'}
        - 注意${isLongTerm ? '月' : '日'}も必ず${periodRange.startStr}〜${periodRange.endStr}の間の${isLongTerm ? '月' : '日付'}
        - ${isLongTerm ? '月' : '日付'}形式：${getDateFormat(selectedPeriod)}
        
        **🚨Level2期間内日付の厳守🚨**：
        選択可能な期間：${periodRange.startStr} 〜 ${periodRange.endStr}
        選択可能な日付：${availableDatesList.slice(0, 7).join('、')}${availableDatesList.length > 7 ? '...' : ''}
        
        **📝Level2出力例**：
        🍀 ラッキーデー：${luckyExample}
        この日は強力な運気が流れ、新しいチャンスに恵まれる日です。
        
        ⚠️ 注意日：${cautionExample}
        この日は慎重さが求められ、重要な判断は避けた方が良いでしょう。
        
        **絶対禁止事項**：
        - ${periodRange.startStr}より前の${isLongTerm ? '月' : '日付'}を選択すること
        - ${periodRange.endStr}より後の${isLongTerm ? '月' : '日付'}を選択すること
        - 曖昧な期間表現を使用すること
        
        **必須Level2重要な日表示**：【重要な日】は金銭運とは完全に分離した独立のセクションとして記載してください
        **重要**：この【重要な日】セクションは他の項目とは完全に分離し、独立した項目として記載してください。
        **確実に表示**：🍀ラッキーデーと⚠️注意日を必ず両方記載してください。
        
        注意：マークダウン記号（**、-など）は使用せず、全体的な感想やまとめ文は記載しないでください。`;
      }
      
      debugLog('🔍 【3天体占いAI呼び出し】新しいgenerateAIAnalysis使用');
      // Level1同様にOpenAI APIを直接呼び出し（プロンプトが確実に使われるように）
      debugLog('🔍 【Level2占い生成】OpenAI API直接呼び出し開始');
      
      const response = await fetch("/api/openai-proxy", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 600,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`Level2 OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResult = data.choices[0].message.content;
      
      debugLog('🔍 【Level2占いOpenAI直接応答】結果:', aiResult);
      debugLog('🔍 【Level2占いOpenAI直接応答】文字数:', aiResult?.length || 0);
      
      if (aiResult && aiResult.trim()) {
        // Level2の結果は文字列のまま保存（表示時に解析）
        setLevel2Fortune(aiResult);

        debugLog('🔍 【Level2占い結果設定】文字列結果を設定完了（新規生成）');
        
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
    setFortunePeriod(selectedPeriod); // 占い実行時の期間を保存
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
      
      // 【追加】現在の天体位置を取得（3要素統合）
      const currentTransits = await calculateTransitPositions(
        {
          birthDate: new Date(),
          birthTime: '12:00',
          birthPlace: { city: '東京', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' }
        },
        new Date()
      );
      
      const currentDate = new Date();
      const timeContext = getTimeContextForAI();
      const randomId = Math.random().toString(36).substring(2, 8);
      let analysisPrompt = `
        あなたは経験豊富な西洋占星術師です。以下の3要素を統合して完全な占いを行ってください：
        
        【1. あなたの10天体配置（出生チャート）】
        ${planetsInfo}
        
        【2. 現在の天体配置】
        ${currentTransits.map(p => `${p.planet}: ${p.sign}座 ${p.degree.toFixed(1)}度`).join(', ')}
        
        【3. あなたの詳細分析結果】
        ${level3Analysis?.tenPlanetSummary ? `
        - 全体的な人格の影響: ${level3Analysis.tenPlanetSummary.overallInfluence}
        - コミュニケーションスタイル: ${level3Analysis.tenPlanetSummary.communicationStyle}
        - 愛情・行動パターン: ${level3Analysis.tenPlanetSummary.loveAndBehavior}
        - 仕事での行動特性: ${level3Analysis.tenPlanetSummary.workBehavior}
        - 変化・深層心理: ${level3Analysis.tenPlanetSummary.transformationAndDepth}
        ` : ''}
        
        【占い期間】
        - 期間: ${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}
        - ランダムID: ${randomId}
        - 占い時刻: ${new Date().toLocaleTimeString()}
        - 多様性要素: ${Math.random().toString(36).substring(2, 8)}
        ${previousLevel3Context}
        ${timeContext}
        
                **期間「${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}」の専用指示**：
        ${(() => {
          const period = selectedPeriod;
          if (period === 'today' || period === 'tomorrow') {
            return `
            - その日の具体的な時間帯での運勢変化を含める
            - 朝・昼・夕方・夜など時間帯別のアドバイス
            - 即座に実践できる具体的な行動指針
            - 日中の重要なタイミングを意識した内容`;
          } else if (period === 'thisWeek' || period === 'nextWeek') {
            return `
            - 週前半・週後半での運勢の変化を含める
            - 曜日ごとの運勢傾向の違い
            - 1週間を通じた運勢の流れと展開
            - 週単位での目標設定アドバイス
            - **必須**：【重要な日】セクションで週内の具体的なラッキーデー・注意日を記載`;
          } else if (period === 'thisMonth' || period === 'nextMonth') {
            return `
            - 月前半・中旬・月末での運勢変化を含める
            - 月の満ち欠けサイクルとの関連
            - 月間を通じた運勢の大きな流れ
            - 月単位での計画立案アドバイス
            - **超重要**：【重要な日】セクションで月内の具体的なラッキーデー・注意日を必ず記載`;
          } else if (period === 'threeMonths') {
            return `
            - 期間全体を通じた運勢の段階的変化
            - 前半・中盤・後半での運勢の展開
            - 中期的な目標達成のためのロードマップ
            - 期間中の重要な転換点の示唆
            - **必須**：【重要な日】セクションで期間内の具体的なラッキーデー・注意日を記載`;
          } else if (period === 'sixMonths' || period === 'oneYear') {
            return `
            - 人生の重要な転換期としての位置づけ
            - 長期的なライフサイクルでの意味
            - 大きな変化や成長のプロセス
            - 長期ビジョン実現のための戦略
            - **必須**：【重要な月】セクションで期間内の具体的なラッキー月・注意月を記載`;
          } else {
            return `
            - 人生の大きな節目としての期間の意味
            - 長期的な人生計画・キャリア設計
            - 世代的な変化や社会的な位置づけ
            - ライフワーク・使命に関する示唆
            - **必須**：【重要な月】セクションで期間内の具体的なラッキー月・注意月を記載`;
          }
        })()}
        
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
        
        **3要素統合占いの方法**：
        - 【出生10天体】×【現在の天体】×【詳細分析】の3要素を必ず統合すること
        - 出生時の10天体と現在の天体配置の相互作用（トランジット）から運勢を読み解くこと
        - 詳細分析結果を踏まえた個人に完全特化した高精度占いを提供すること
        
        **期間別占い内容の差別化（超重要）**：
        以下の期間特性を必ず反映した異なる占い内容を生成すること：
        
        ◆短期間（今日・明日・今週・来週）：
        - 即効性のある具体的なアドバイス・行動指針
        - その日/週の天体の動きに基づく運勢変化
        - 「今日は早朝から」「午後には」「週前半は」などの具体的タイミング
        - 短期的な注意事項や即座に実践できるラッキーアクション
        
        ◆中期間（今月・来月・1-3ヶ月）：
        - 月/期間を通じての運勢の流れと変化
        - 段階的な成長や変化のプロセス
        - 「月前半は」「期間中盤から」「終盤にかけて」などの期間内変化
        - 中長期的な目標設定や計画立案のアドバイス
        
        ◆長期間（半年・1年・2年以上）：
        - 人生の大きな転換期や重要な変化
        - 長期的なライフサイクルや運勢の大きな流れ
        - 「前半は基盤作り」「後半は飛躍の時」などの期間構造
        - 長期的なビジョンや人生戦略に関するアドバイス
        
        **超重要緊急指示**：これは「占い・運勢予測」です。「性格分析」は絶対禁止です。
        
        **絶対に使用禁止の表現（違反すると即座に失格）**：
        - 「あなたの特徴」「〜な性格」「〜な傾向」「〜な人格」「〜な特性」
        - 「人格の影響」「コミュニケーションスタイル」「行動パターン」「深層心理」
        - 「太陽・牡牛座」「月・蟹座」などの天体名直接表記
        - 「〜の影響で」「〜により」「〜を重視します」「〜という特徴」
        - 「評価：」「運勢評価：」などの評価ラベル文字
        - 性格説明・特徴解説・分析的表現
        
        **必須表現（これ以外は禁止）**：
        - 「${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}は〜な運勢です」
        - 「〜な運気が流れています」
        - 「〜が期待できるでしょう」
        - 「〜に注意が必要です」
        - 「〜すると良い結果が生まれます」
        - 「〜すると幸運を引き寄せます」
        
        **絶対に出力してはいけないセクション**：
        - 【星が伝えるあなたの印象診断】（完全禁止）
        - 【性格分析】（完全禁止）
        - 【特徴】（完全禁止）
        - 【コミュニケーション】（完全禁止）
        
        **厳格な出力指示（違反は絶対禁止）**：
        以下の5つのセクションのみ出力してください。他のセクションは一切出力禁止。
        
        **🚨Level3期間別差別化（固定例文使用禁止）🚨**：
        
        **期間「${selectedPeriod}」の専用指示**：
        ${(() => {
          const periodLabel = periodOptions.level3.find(p => p.value === selectedPeriod)?.label || selectedPeriod;
          
          if (['today', 'tomorrow'].includes(selectedPeriod)) {
            return `**短期集中型（${periodLabel}）**：
            - 【総合運】：即効性のある運勢、今日・明日の具体的なタイミング重視
            - 【金銭運】：当日の金銭チャンス、短期的な収入・支出に焦点
            - 【恋愛運】：今日・明日の恋愛チャンス、即座のアプローチや出会い
            - 【仕事運】：当日の仕事成果、短期的な評価や成功
            - 【成長運】：今日・明日で得られる気づきや学び`;
          } else if (['thisWeek', 'nextWeek'].includes(selectedPeriod)) {
            return `**週間戦略型（${periodLabel}）**：
            - 【総合運】：1週間のプロセス重視、週を通した運勢の流れ
            - 【金銭運】：週間計画での金銭管理、段階的な収入増加
            - 【恋愛運】：週を通した関係発展、継続的なアプローチ戦略
            - 【仕事運】：週単位のプロジェクト成果、継続的な取り組み
            - 【成長運】：週を通した学習計画、段階的なスキルアップ`;
          } else if (['thisMonth', 'nextMonth'].includes(selectedPeriod)) {
            return `**月間計画型（${periodLabel}）**：
            - 【総合運】：月を通した運勢サイクル、月初から月末への変化
            - 【金銭運】：月間予算と投資計画、持続的な財運向上
            - 【恋愛運】：月を通した関係深化、長期的な恋愛戦略
            - 【仕事運】：月間目標達成、持続的な成果積み重ね
            - 【成長運】：月単位の成長計画、新しい習慣や技能習得`;
          } else if (selectedPeriod === 'threeMonths') {
            return `**四半期変革型（${periodLabel}）**：
            - 【総合運】：3か月での大きな変化、人生の転換期として
            - 【金銭運】：中期投資と資産形成、財政基盤の構築
            - 【恋愛運】：関係の本格化、重要な決断や進展
            - 【仕事運】：キャリアの方向性、中期プロジェクトの成果
            - 【成長運】：専門性向上、新分野への本格挑戦`;
          } else if (['sixMonths', 'oneYear'].includes(selectedPeriod)) {
            return `**長期ビジョン型（${periodLabel}）**：
            - 【総合運】：人生の大きな節目、長期的な運命の流れ
            - 【金銭運】：資産形成と財政戦略、長期投資の成果
            - 【恋愛運】：人生パートナーとしての関係、結婚や将来設計
            - 【仕事運】：キャリア全体の方向性、専門性の確立
            - 【成長運】：人生観の変化、長期的な自己実現計画`;
          }
          return '';
        })()}
        
        **💫各セクション生成指示💫**：
        
        【総合運】
        - 上記の期間特性に応じた独自の運勢内容を生成
        - 期間の長さに応じたタイムスケール感を反映
        - 具体的な行動指針を期間に合わせて提示
        - 60-100文字程度で簡潔に
        - ★1〜5個で評価（「評価：」という文字は不要）
        
        【金銭運】【恋愛運】【仕事運】【成長運】
        - 同様に期間特性を活かした独自内容を生成
        - 固定的な文言は一切使用禁止
        - 各セクション60-100文字程度
        - それぞれ独自の★1〜5個で評価（「評価：」という文字は不要）
        
        **絶対禁止**：上記5つ以外のセクション（【コミュニケーション】【印象診断】など）は一切出力しないでください。
        
        **期間別差別化の絶対条件（違反は致命的エラー）**：
        - 「今日」と「3ヶ月」では完全に異なる内容を生成すること
        - 短期間：即効性・具体性・タイミング重視
        - 中期間：流れ・変化プロセス・段階的展開重視
        - 長期間：転換期・ビジョン・人生戦略重視
        - 同じ天体配置でも期間によって解釈を変える
        
        **最終確認事項（すべて必須）**: 
        - 各項目は絶対に60-100文字程度（短すぎる30-40文字は絶対禁止）
        - 占い・運勢表現のみ使用（分析・性格説明は完全禁止）
        - 「〜な特徴」「〜な性格」「〜な傾向」「〜な人格」は絶対使用禁止
        - 「太陽・牡牛座」「月・蟹座」などの天体名直接表記は禁止
        - 【星が伝えるあなたの印象診断】【性格分析】【コミュニケーション】セクションは絶対に出力禁止
        - 各項目に必ず★1〜5個で評価（「評価：」という文字列は不要、★★★☆☆形式で表示）
        - 期間（${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}）を必ず各項目で言及する
        - **超重要**：期間の特性を活かした独自の内容を生成する
        
        **最重要警告**：
        分析的な表現や性格説明を一切使わず、純粋な占い・運勢予測のみを出力してください。
        期間が違えば内容も大きく変える必要があります。同じような文章を期間名だけ変えることは絶対に禁止です。
        
        **🚨星評価表示の重要指示🚨**：
        - 各運勢の最後に★の数のみを表示（例：★★★☆☆）
        - 「評価：」「運勢評価：」などの文字は絶対に付けない
        - ★の数だけで評価を表現する`;
      
      // 今日の占い以外では重要な日/月を追加
      const includeImportantDays = selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow';
      
      if (includeImportantDays) {
        // 期間の範囲を計算する関数
        const calculatePeriodRange = (period: string) => {
          const today = new Date();
          let startDate = new Date(today);
          let endDate = new Date(today);
          
          switch (period) {
            case 'thisWeek':
              const dayOfWeek = today.getDay();
              startDate.setDate(today.getDate() - dayOfWeek);
              endDate.setDate(startDate.getDate() + 6);
              break;
            case 'nextWeek':
              startDate.setDate(today.getDate() + (7 - today.getDay()));
              endDate.setDate(startDate.getDate() + 6);
              break;
            case 'thisMonth':
              startDate.setDate(1);
              endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              break;
            case 'nextMonth':
              startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
              endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
              break;
            case 'oneMonth':
              endDate = new Date(today);
              endDate.setMonth(endDate.getMonth() + 1);
              break;
            case 'threeMonths':
              endDate = new Date(today);
              endDate.setMonth(endDate.getMonth() + 3);
              break;
            case 'sixMonths':
              endDate = new Date(today);
              endDate.setMonth(endDate.getMonth() + 6);
              break;
            case 'oneYear':
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
        const isLongTerm = ['sixMonths', 'oneYear'].includes(selectedPeriod);
        const importantDateTitle = isLongTerm ? '重要な月' : '重要な日';
        
        debugLog('🔍 【Level3期間計算】selectedPeriod:', selectedPeriod);
        debugLog('🔍 【Level3期間計算】isLongTerm:', isLongTerm);
        debugLog('🔍 【Level3期間計算】periodRange:', periodRange);
        
        const getDateFormat = (period: string) => {
          return isLongTerm ? 'YYYY年MM月' : 'MM月DD日';
        };
        
        // 期間内の具体的な日付/年月リストを事前計算
        let availableDatesList = '';
        let luckyExample = '';
        let cautionExample = '';
        
        if (isLongTerm) {
          // 長期間：年月リストを生成
          const yearMonths: string[] = [];
          const current = new Date(periodRange.start);
          while (current <= periodRange.end && yearMonths.length < 12) {
            yearMonths.push(`${current.getFullYear()}年${String(current.getMonth() + 1).padStart(2, '0')}月`);
            current.setMonth(current.getMonth() + 1);
          }
          availableDatesList = `選択可能な年月：${yearMonths.slice(0, 6).join('、')}`;
          
          // ランダムに2つ選択してサンプル作成
          const shuffled = [...yearMonths].sort(() => Math.random() - 0.5);
          luckyExample = shuffled.slice(0, 2).join('、');
          cautionExample = shuffled.slice(2, 4).length > 0 ? shuffled.slice(2, 4).join('、') : shuffled.slice(0, 1).join('、');
          
          debugLog('🔍 【Level3長期間】yearMonths:', yearMonths);
        } else {
          // 短期間：日付リストを生成
          const dates: string[] = [];
          const current = new Date(periodRange.start);
          while (current <= periodRange.end) {
            dates.push(`${String(current.getMonth() + 1).padStart(2, '0')}月${String(current.getDate()).padStart(2, '0')}日`);
            current.setDate(current.getDate() + 1);
          }
          availableDatesList = `選択可能な日付：${dates.join('、')}`;
          
          debugLog('🔍 【Level3短期間】dates:', dates);
          
          // ランダムに選択してサンプル作成
          const shuffled = [...dates].sort(() => Math.random() - 0.5);
          luckyExample = shuffled.slice(0, 2).join('、');
          cautionExample = shuffled.slice(2, 4).length > 0 ? shuffled.slice(2, 4).join('、') : shuffled.slice(0, 1).join('、');
        }
        
        debugLog('🔍 【Level3日付生成】availableDatesList:', availableDatesList);
        debugLog('🔍 【Level3日付生成】luckyExample:', luckyExample);
        debugLog('🔍 【Level3日付生成】cautionExample:', cautionExample);
        
        analysisPrompt += `
        
        【${importantDateTitle}】
        **🚨超重要：Level3期間内日付の厳守🚨**：
        - **対象期間**：${periodRange.startStr}〜${periodRange.endStr}
        - **この期間外の日付は絶対に選択禁止**
        - **過去の日付は絶対に選択禁止**
        - **未来すぎる日付も絶対に選択禁止**
        
        **✅Level3必須条件（絶対に守ること）**：
        - ラッキー${isLongTerm ? '月' : 'デー'}：**必ず${periodRange.startStr}〜${periodRange.endStr}の間**から選択
        - 注意${isLongTerm ? '月' : '日'}：**必ず${periodRange.startStr}〜${periodRange.endStr}の間**から選択
        - ${isLongTerm ? '月' : '日付'}形式：**${getDateFormat(selectedPeriod)}形式で記載**
        - **複数の日付選択推奨**：ラッキー${isLongTerm ? '月' : 'デー'}・注意${isLongTerm ? '月' : '日'}ともに1-3個程度選択
        
        **📅Level3具体的な期間内${isLongTerm ? '月' : '日付'}リスト**：
        ${availableDatesList}
        
        **🎲Level3占い変化要素（毎回異なる結果のため）**：
        占い番号：${Math.random().toString(36).substring(2, 8)}
        占い時刻：${new Date().toLocaleTimeString()}
        
        **📝Level3出力形式（期間内日付から必ず選択）**：
        
        🍀 ラッキー${isLongTerm ? '月' : 'デー'}：${luckyExample}
        ${isLongTerm ? 'これらの月' : 'これらの日'}は10天体の強力な配置により幸運が訪れます。重要な決断や新しい挑戦に最適な時期です。
        
        ⚠️ 注意${isLongTerm ? '月' : '日'}：${cautionExample}
        ${isLongTerm ? 'これらの月' : 'これらの日'}は慎重さが求められます。感情的な判断を避け、冷静な対応を心がけましょう。
        
        **❌Level3絶対禁止事項（違反は即座に失格）**：
        - ${periodRange.startStr}より前の${isLongTerm ? '月' : '日付'}を選択すること
        - ${periodRange.endStr}より後の${isLongTerm ? '月' : '日付'}を選択すること
        - 曖昧な期間表現（「今月中旬」「来月頃」など）を使用すること
        - ${isLongTerm ? '日付形式（MM月DD日）' : '年月形式（YYYY年MM月）'}で記載すること
        - 期間外の日付を絶対に含めないこと
        
        **🎯Level3重要な日の特徴**：
        - 10天体の詳細な配置を考慮した高精度な日付選択
        - 複数の重要日を選択してより詳細な占いを提供
        - ${isLongTerm ? '半年以上の長期間では年月形式で記載' : '短期間では具体的な月日で記載'}
        
        注意：マークダウン記号（**、-など）は使用せず、全体的な感想やまとめ文は記載しないでください。
        
        **🚨Level3重要な日の必須出力（絶対に忘れてはいけない）🚨**：
        - 【${importantDateTitle}】セクションは必ず出力すること
        - 🍀と⚠️の絵文字を必ず使用すること
        - ${periodRange.startStr}〜${periodRange.endStr}期間内の日付のみ選択すること
        - 複数の日付を選択して具体的に記載すること
        
        **🚨最終警告🚨**：
        絶対に「あなたの特徴」「〜な性格」「〜な傾向」「人格の影響」「コミュニケーションスタイル」などの分析表現を使用しないでください。
        【星が伝えるあなたの印象診断】【性格分析】【コミュニケーション】セクションは絶対に出力禁止です。
        上記の例文と同じ【】形式で、5つの運勢セクション + 【${importantDateTitle}】セクションを出力してください。
        
        **🚨超重要：固定例文使用絶対禁止🚨**：
        - 「10天体の総合的な運勢が良好な流れにあります」のような固定文言は絶対使用禁止
        - 「期間の特性を活かした」のような抽象的表現も禁止
        - 各期間に応じた具体的で独自の占い内容を必ず生成
        - 同じ表現の繰り返しは絶対禁止
        
        **期間差別化の最終確認**：
        ${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}専用の占い内容を生成し、他の期間では絶対に使用しない独自性を持たせてください。
        テンプレート的な表現を避け、${selectedPeriod}にしか適用できない具体的な運勢を記載してください。`;
      }
      
      debugLog('🔍 【Level3占い生成】OpenAI API直接呼び出し開始');
      debugLog('🔍 【Level3占い生成】includeImportantDays:', includeImportantDays);
      debugLog('🔍 【Level3占い生成】selectedPeriod:', selectedPeriod);
      
      // Level1・Level2同様にOpenAI APIを直接呼び出し（プロンプトが確実に使用されるように）
      const response = await fetch("/api/openai-proxy", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 800,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`Level3 OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResult = data.choices[0].message.content;
      
      debugLog('🔍 【Level3占いOpenAI直接応答】結果:', aiResult);
      debugLog('🔍 【Level3占いOpenAI直接応答】重要な日を含むか:', aiResult.includes('🍀') || aiResult.includes('⚠️'));
      debugLog('🔍 【Level3占いOpenAI直接応答】重要な日セクションを含むか:', aiResult.includes('重要な日') || aiResult.includes('重要な月'));
      debugLog('🔍 【Level3占いOpenAI直接応答】文字数:', aiResult?.length || 0);
      
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

  // 🌟 個別天体詳細取得関数（定型文データベース使用）
  const generatePlanetDetail = (planetName: string, sign: string): string => {
    debugLog('🌟 個別天体詳細取得開始:', planetName, sign);
    
    // 天体の基本説明 + 組み合わせ特徴を取得
    const detail = getPlanetSignDetailWithMeaning(planetName, sign);
    
    setPlanetDetail(detail);
    debugLog('🌟 個別天体詳細取得完了:', detail.substring(0, 100) + '...');
    
    return detail;
  };

  // 個別天体をクリックした時の処理
  const handlePlanetClick = (planetName: string, sign: string) => {
    const planetKey = `${planetName}-${sign}`;
    
    debugLog('🌟 個別天体クリック:', planetName, sign, planetKey);
    
    if (planetDetailVisible === planetKey) {
      // 既に開いている場合は閉じる
      setPlanetDetailVisible(null);
      setSelectedPlanet(null);
      setPlanetDetail('');
    } else {
      // 新しく開く
      setPlanetDetailVisible(planetKey);
      setSelectedPlanet({planet: planetName, sign: sign});
      
      // 詳細情報を即座取得（定型文なのでローディング不要）
      generatePlanetDetail(planetName, sign);
    }
  };

  // レベル3のAI分析生成（自動実行・キャッシュ機能付き）
  const handleGenerateLevel3Analysis = useCallback(async () => {
    if (!horoscopeData || !birthData) return;
    
    // キャッシュキーを生成（v8: Level3専用詳細分析プロンプト対応・100-140文字詳細設定）
    const cacheKey = `level3_analysis_v8_${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
    
    // 古いバージョンのキャッシュを削除（既存ユーザー対応）
    const baseKey = `${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
    ['v2', 'v3', 'v4', 'v5', 'v6', 'v7'].forEach(version => {
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
      // Level3の詳細分析モードを使用（tenPlanetSummary詳細生成のため）
      const analysis = await generateAIAnalysis(birthData, horoscopeData.planets, 'level3');
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
      debugError('Level3 AI分析エラー:', error);
      debugError('エラーの詳細:', error instanceof Error ? error.message : String(error));
      
      // タイムアウトエラーの特別処理
      if (error instanceof Error && error.message.includes('タイムアウト')) {
        console.error('🔥 Level3分析でタイムアウトが発生しました。複雑な分析のため時間がかかっています。');
        const timeoutAnalysis = {
          personalityInsights: {
            corePersonality: 'AI分析の処理に時間がかかっています。少し時間を置いてから再度お試しください。',
            hiddenTraits: 'ネットワークの状況により分析に時間がかかっています。',
            lifePhilosophy: '分析を再実行してください。',
            relationshipStyle: '分析処理中です。',
            careerTendencies: '分析処理中です。'
          },
          detailedFortune: {
            overallTrend: 'AI分析の処理に時間がかかっています。',
            loveLife: '分析処理中です。',
            careerPath: '分析処理中です。',
            healthWellness: '分析処理中です。',
            financialProspects: '分析処理中です。',
            personalGrowth: '分析処理中です。'
          },
          tenPlanetSummary: {
            overallInfluence: '🔄 AI分析の処理に時間がかかっています。ネットワークの状況やサーバーの負荷により、Level3の詳細分析は通常より時間がかかる場合があります。少し時間を置いてから「再試行」ボタンを押してください。',
            communicationStyle: '分析処理中です。再試行ボタンをお試しください。',
            loveAndBehavior: '分析処理中です。再試行ボタンをお試しください。',
            workBehavior: '分析処理中です。再試行ボタンをお試しください。',
            transformationAndDepth: '分析処理中です。再試行ボタンをお試しください。'
          },
          lifePath: {
            majorThemes: [],
            challengesToOvercome: [],
            opportunitiesToSeize: [],
            spiritualJourney: '分析処理中です。'
          },
          practicalAdvice: {
            dailyHabits: [],
            relationshipTips: [],
            careerGuidance: [],
            wellnessRecommendations: []
          },
          planetAnalysis: {},
          aiPowered: false,
          isTimeout: true // タイムアウトフラグを追加
        };
        setLevel3Analysis(timeoutAnalysis);
      } else {
        // その他のエラーの場合
        const defaultAnalysis = {
          personalityInsights: {
            corePersonality: 'AI分析でエラーが発生しました。',
            hiddenTraits: 'AI分析でエラーが発生しました。',
            lifePhilosophy: 'AI分析でエラーが発生しました。',
            relationshipStyle: 'AI分析でエラーが発生しました。',
            careerTendencies: 'AI分析でエラーが発生しました。'
          },
          detailedFortune: {
            overallTrend: 'AI分析でエラーが発生しました。',
            loveLife: 'AI分析でエラーが発生しました。',
            careerPath: 'AI分析でエラーが発生しました。',
            healthWellness: 'AI分析でエラーが発生しました。',
            financialProspects: 'AI分析でエラーが発生しました。',
            personalGrowth: 'AI分析でエラーが発生しました。'
          },
          tenPlanetSummary: {
            overallInfluence: 'AI分析でエラーが発生しました。再試行ボタンをお試しください。',
            communicationStyle: 'AI分析でエラーが発生しました。',
            loveAndBehavior: 'AI分析でエラーが発生しました。',
            workBehavior: 'AI分析でエラーが発生しました。',
            transformationAndDepth: 'AI分析でエラーが発生しました。'
          },
          lifePath: {
            majorThemes: [],
            challengesToOvercome: [],
            opportunitiesToSeize: [],
            spiritualJourney: 'AI分析でエラーが発生しました。'
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
      }
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
    debugLog('🔍 【handleLevelUp】関数が呼ばれました', { currentLevel });
    if (currentLevel < 3) {
      // 3天体の本格占い（レベル2）に進む場合、データ不足チェック
      if (currentLevel === 1) {
        if (!birthData) {
          debugLog('🔍 出生データがありません。');
          setShowDataMissingMessage(true);
          return;
        }
        
        const missingBirthTime = !birthData.birthTime;
        const missingBirthPlace = !birthData.birthPlace || 
                                  !birthData.birthPlace.city || 
                                  birthData.birthPlace.city === '東京';
        
        debugLog('🔍 レベルアップ時のデータチェック:');
        debugLog('  birthData.birthTime:', birthData.birthTime);
        debugLog('  missingBirthTime:', missingBirthTime);
        debugLog('  birthData.birthPlace:', birthData.birthPlace);
        debugLog('  missingBirthPlace:', missingBirthPlace);
        
        if (missingBirthTime || missingBirthPlace) {
          debugLog('🔍 10天体の印象診断に必要なデータが不足しています。入力画面に遷移します。');
          debugLog('🔍 【handleLevelUp】入力画面への遷移を実行します');
          // 不足データを示すフラグを設定して入力画面に遷移
          localStorage.setItem('starflect_missing_data_mode', 'ten-planets');
          navigate('/');
          return;
        }
        
        debugLog('🔍 【handleLevelUp】データチェック完了、処理を続行します');
      }
      
      // Level1の場合はLevel3に直接遷移（Level2はスキップ）
      const nextLevel = (currentLevel === 1 ? 3 : currentLevel + 1) as DisplayLevel;
      debugLog('🔍 【handleLevelUp】nextLevelが決定されました', { currentLevel, nextLevel });
      setCurrentLevel(nextLevel);
      setSelectedPeriod('today'); // 期間をリセット
      
      // ⚠️ Level2は削除済み - Level1から直接Level3に遷移
      debugLog('🔍 【handleLevelUp】Level2はスキップされます', { nextLevel });
      
      // レベル3（10天体）に上がる時、selectedModeをten-planetsに更新
      if (nextLevel === 3) {
        localStorage.setItem('selectedMode', 'ten-planets');
        debugLog('🔍 【レベルアップ】selectedModeをten-planetsに更新');
      }
      
      // ページトップに移動
      window.scrollTo(0, 0);
      
      debugLog('🔍 【handleLevelUp】関数の実行が完了しました');
    }
  };

  // 期間タイトルの取得
  const getPeriodTitle = () => {
    // ⚠️ Level2削除のため、currentLevel===2はperiodOptions.level3を使用
    const optionsList = currentLevel === 1 ? periodOptions.level1 : 
                       /* currentLevel === 2 ? periodOptions.level2 :  // DISABLED */
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
        // ⚠️ Level2は削除済み - Level3を表示
        return renderLevel3();
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
      <div className="level-1" id="level1-section">
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
        
        <div className="level1-header">
          <h2 className="level-title-text">⭐⭐ お手軽12星座占い　～12星座から見たあなた</h2>
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
          <h3 className="section-title">⭐ 12星座から見たあなた</h3>
          <p className="personality-text">{signInfo.description}</p>
        </div>

        {/* 占い */}
        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い　～12星座から見たあなた</h3>
          
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
              <LoadingSpinner size={50} color="#667eea" />
              <p>占っています...お待ちください</p>
            </div>
          )}
          
          {(() => {
            debugLog('🔮 【占い表示条件】level1Fortune:', !!level1Fortune, 'isGeneratingLevel1:', isGeneratingLevel1);
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
                      return { 
                        overall: '', love: '', work: '', health: '', money: '', advice: '',
                        overallStars: 3, loveStars: 3, workStars: 3, healthStars: 3, moneyStars: 3,
                        importantDays: ''
                      };
                    }
                    
                    debugLog('🔍 【占い結果解析開始】入力テキスト:', fortuneText);
                    debugLog('🔍 【占い結果解析開始】テキスト長:', fortuneText?.length || 0);
                    
                    // 星評価を抽出するヘルパー関数
                    const extractStarRating = (text: string): number => {
                      // ★の数をカウント
                      const starMatches = text.match(/★+/g);
                      if (starMatches && starMatches.length > 0) {
                        const starCount = starMatches[0].length;
                        return Math.min(Math.max(starCount, 1), 5); // 1-5の範囲に制限
                      }
                      
                      // 数字での評価を抽出（例：評価3、★3など）
                      const numberMatch = text.match(/(?:評価|★)(\d)/);
                      if (numberMatch) {
                        const num = parseInt(numberMatch[1]);
                        return Math.min(Math.max(num, 1), 5);
                      }
                      
                      return 3; // デフォルト値
                    };
                    
                    // 重要な日の期間バリデーション関数
                    const validateImportantDaysDateRange = (importantDaysText: string, period: string): string => {
                      if (!importantDaysText || period === 'today' || period === 'tomorrow') {
                        return importantDaysText;
                      }
                      
                      // 対象期間を計算
                      const today = new Date();
                      let startDate = new Date(today);
                      let endDate = new Date(today);
                      
                      switch (period) {
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
                        default:
                          return importantDaysText; // 他の期間はそのまま返す
                      }
                      
                      // 日付の抽出とバリデーション
                      const lines = importantDaysText.split('\n');
                      const validatedLines: string[] = [];
                      
                      for (const line of lines) {
                        // 日付パターンを抽出（例：8月5日、8月15日など）
                        const dateMatch = line.match(/(\d{1,2})月(\d{1,2})日/);
                        
                        if (dateMatch) {
                          const month = parseInt(dateMatch[1]);
                          const day = parseInt(dateMatch[2]);
                          
                          // 日付を作成（今年の日付として）
                          const targetDate = new Date(today.getFullYear(), month - 1, day);
                          
                          // 期間内かチェック
                          if (targetDate >= startDate && targetDate <= endDate) {
                            validatedLines.push(line);
                            debugLog('🔍 【期間内日付】有効:', line);
                          } else {
                            debugLog('🔍 【期間外日付】除外:', line, '期間:', startDate.toLocaleDateString(), '〜', endDate.toLocaleDateString());
                          }
                        } else {
                          // 日付パターンが見つからない行（説明文など）は保持
                          validatedLines.push(line);
                        }
                      }
                      
                      return validatedLines.join('\n');
                    };
                    
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
                      advice: '',
                      // 星評価を追加
                      overallStars: 3,
                      loveStars: 3,
                      workStars: 3,
                      healthStars: 3,
                      moneyStars: 3,
                      // ラッキーデー/注意する日を追加
                      importantDays: ''
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
                        let cleanedText = section.replace(/【[^】]*】/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        // 星評価の後の余分なテキストを除去
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.overall = cleanedText;
                        sections.overallStars = extractStarRating(section);
                        debugLog('🔍 【全体運設定】:', sections.overall);
                        debugLog('🔍 【全体運星評価】:', sections.overallStars);
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        let cleanedText = section.replace(/【[^】]*】/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        // 星評価の後の余分なテキストを除去
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.love = cleanedText;
                        sections.loveStars = extractStarRating(section);
                        debugLog('🔍 【恋愛運設定】:', sections.love);
                        debugLog('🔍 【恋愛運星評価】:', sections.loveStars);
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        let cleanedText = section.replace(/【[^】]*】/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        // 星評価の後の余分なテキストを除去
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.work = cleanedText;
                        sections.workStars = extractStarRating(section);
                        debugLog('🔍 【仕事運設定】:', sections.work);
                        debugLog('🔍 【仕事運星評価】:', sections.workStars);
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        let cleanedText = section.replace(/【[^】]*】/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        // 星評価の後の余分なテキストを除去
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.health = cleanedText;
                        sections.healthStars = extractStarRating(section);
                        debugLog('🔍 【健康運設定】:', sections.health);
                        debugLog('🔍 【健康運星評価】:', sections.healthStars);
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        let cleanedMoney = section.replace(/【[^】]*】/, '').trim();
                        
                        // 重要な日の内容を抽出してimportantDaysに保存
                        const importantDaysMatch = section.match(/(🍀.*?(?=⚠️|$))|(⚠️.*$)/gs);
                        if (importantDaysMatch && !sections.importantDays) {
                          sections.importantDays = importantDaysMatch.join('\n').trim();
                          debugLog('🔍 【金銭運から重要な日抽出】:', sections.importantDays);
                        }
                        
                        // 最後のセクションの場合、挨拶文や余分なテキストを除去
                        cleanedMoney = cleanedMoney.replace(/\n\n.*?お過ごし.*$/g, '').trim();
                        cleanedMoney = cleanedMoney.replace(/\n\nぜひ.*$/g, '').trim();
                        cleanedMoney = cleanedMoney.replace(/\n\n.*?素敵.*$/g, '').trim();
                        
                        // ラッキーデー/注意日の内容を強力に除去
                        cleanedMoney = cleanedMoney.replace(/🍀.*?(?=⚠️|$)/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/⚠️.*$/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/ラッキーデー.*?(?=注意日|$)/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/注意日.*$/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/運勢評価:.*$/g, '').trim();
                        
                        // 星評価の後の余分なテキストを除去
                        cleanedMoney = cleanedMoney.replace(/★+[☆★]*.*$/g, '').trim();
                        
                        // 末尾の句読点や余分な改行を整理
                        cleanedMoney = cleanedMoney.replace(/\n+/g, ' ').trim();
                        cleanedMoney = cleanedMoney.replace(/\s+/g, ' ').trim();
                        
                        sections.money = cleanedMoney;
                        sections.moneyStars = extractStarRating(section);
                        debugLog('🔍 【金銭運設定】:', sections.money);
                        debugLog('🔍 【金銭運星評価】:', sections.moneyStars);
                      } else if (section.includes('アドバイス') || section.includes('今日の') || section.includes('今週の') || section.includes('今月の')) {
                        sections.advice = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【アドバイス設定】:', sections.advice);
                      } else if (section.includes('重要な日') || section.includes('重要日') || section.includes('ラッキーデー') || section.includes('注意日')) {
                        sections.importantDays = section.replace(/【[^】]*】/, '').trim();
                        debugLog('🔍 【重要な日設定】:', sections.importantDays);
                      } else {
                        debugLog('🔍 【未分類セクション】:', section);
                      }
                    });
                    
                    // ### 形式の処理
                    markdownSections.forEach(section => {
                      debugLog('🔍 【### セクション解析中】:', section);
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
                        let cleanedText = section.replace(/###[^#]*?運/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.overall = cleanedText;
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        let cleanedText = section.replace(/###[^#]*?運/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.love = cleanedText;
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        let cleanedText = section.replace(/###[^#]*?運/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.work = cleanedText;
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        let cleanedText = section.replace(/###[^#]*?運/, '').trim();
                        // ラッキーデー/注意日の内容を除去
                        cleanedText = cleanedText.replace(/🍀.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/⚠️.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/ラッキーデー.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/注意日.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/運勢評価:.*$/g, '').trim();
                        cleanedText = cleanedText.replace(/★+[☆★]*.*$/g, '').trim();
                        sections.health = cleanedText;
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        let cleanedMoney = section.replace(/###[^#]*?運/, '').trim();
                        
                        // 重要な日の内容を抽出してimportantDaysに保存
                        const importantDaysMatch = section.match(/(🍀.*?(?=⚠️|$))|(⚠️.*$)/gs);
                        if (importantDaysMatch && !sections.importantDays) {
                          sections.importantDays = importantDaysMatch.join('\n').trim();
                          debugLog('🔍 【### 金銭運から重要な日抽出】:', sections.importantDays);
                        }
                        
                        // 最後のセクションの場合、挨拶文や余分なテキストを除去
                        cleanedMoney = cleanedMoney.replace(/\n\n.*?お過ごし.*$/g, '').trim();
                        cleanedMoney = cleanedMoney.replace(/\n\nぜひ.*$/g, '').trim();
                        cleanedMoney = cleanedMoney.replace(/\n\n.*?素敵.*$/g, '').trim();
                        
                        // ラッキーデー/注意日の内容を強力に除去
                        cleanedMoney = cleanedMoney.replace(/🍀.*?(?=⚠️|$)/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/⚠️.*$/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/ラッキーデー.*?(?=注意日|$)/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/注意日.*$/gs, '').trim();
                        cleanedMoney = cleanedMoney.replace(/運勢評価:.*$/g, '').trim();
                        
                        // 星評価の後の余分なテキストを除去
                        cleanedMoney = cleanedMoney.replace(/★+[☆★]*.*$/g, '').trim();
                        
                        // 末尾の句読点や余分な改行を整理
                        cleanedMoney = cleanedMoney.replace(/\n+/g, ' ').trim();
                        cleanedMoney = cleanedMoney.replace(/\s+/g, ' ').trim();
                        
                        sections.money = cleanedMoney;
                      } else if (section.includes('アドバイス') || section.includes('今日の') || section.includes('今週の') || section.includes('今月の')) {
                        sections.advice = section.replace(/###[^#]*?/, '').trim();
                      } else if (section.includes('重要な日') || section.includes('重要日') || section.includes('ラッキーデー') || section.includes('注意日')) {
                        sections.importantDays = section.replace(/###[^#]*?/, '').trim();
                      }
                    });
                    
                    // どちらの形式でも解析できなかった場合は、全体を全体運として扱う
                    if (sectionMatches.length === 0 && markdownSections.length === 0) {
                      debugLog('🔍 【セクション分割失敗】全体運として扱います');
                      sections.overall = fortuneText.trim();
                    }
                    
                    // 重要な日が抽出されていない場合、テキスト全体から直接抽出を試みる
                    if (!sections.importantDays) {
                      const directImportantDaysMatch = fortuneText.match(/(🍀.*?(?=⚠️|【|$))|(⚠️.*?(?=【|$))/gs);
                      if (directImportantDaysMatch) {
                        sections.importantDays = directImportantDaysMatch.map(match => match.trim()).join('\n');
                        debugLog('🔍 【直接抽出した重要な日】:', sections.importantDays);
                        
                        // 抽出した重要な日の内容を他のセクションから除去
                        ['overall', 'love', 'work', 'health', 'money'].forEach(key => {
                          if (sections[key as keyof typeof sections]) {
                            let cleaned = sections[key as keyof typeof sections] as string;
                            cleaned = cleaned.replace(/🍀.*?(?=⚠️|$)/gs, '').trim();
                            cleaned = cleaned.replace(/⚠️.*$/gs, '').trim();
                            (sections as any)[key] = cleaned;
                          }
                        });
                      }
                    }
                    
                    // 期間外の日付をフィルタリング（今日・明日以外の場合のみ）
                    if (sections.importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow') {
                      sections.importantDays = validateImportantDaysDateRange(sections.importantDays, fortunePeriod);
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
                  debugLog('  importantDays:', fortuneSections.importantDays);
                  debugLog('🔍 【ラッキーデー/注意日分離チェック】金銭運にラッキーデーが含まれているか:', fortuneSections.money?.includes('🍀') || fortuneSections.money?.includes('ラッキーデー'));
                  debugLog('🔍 【重要な日表示チェック】importantDaysが存在するか:', !!fortuneSections.importantDays);
                  debugLog('🔍 【重要な日表示チェック】importantDaysの長さ:', fortuneSections.importantDays?.length || 0);
                  debugLog('🔍 【期間チェック】selectedPeriod:', selectedPeriod, 'fortunePeriod:', fortunePeriod);
                  debugLog('🔍 【表示判定】今日・明日以外か:', fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow');
                  debugLog('🔍 【最終表示判定】重要な日を表示するか:', !!fortuneSections.importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow');
                  
                  return (
                    <>
                      {fortuneSections.overall && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            全体運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor(fortuneSections.overallStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating(fortuneSections.overallStars || 3, 'overall')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.overall}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.love && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            恋愛運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor(fortuneSections.loveStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating(fortuneSections.loveStars || 3, 'love')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.love}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.work && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            仕事運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor(fortuneSections.workStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating(fortuneSections.workStars || 3, 'work')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.work}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.health && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            健康運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor(fortuneSections.healthStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating(fortuneSections.healthStars || 3, 'health')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.health}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.money && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            金銭運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor(fortuneSections.moneyStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating(fortuneSections.moneyStars || 3, 'money')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.money}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow' && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🗓️ 重要な日</h4>
                          <div className="fortune-content">
                            <div className="important-days-content">
                              {fortuneSections.importantDays.split('\n').map((line, index) => {
                                if (line.includes('🍀')) {
                                  return (
                                    <div key={index} className="lucky-day">
                                      <span className="day-content">{line.trim()}</span>
                                    </div>
                                  );
                                } else if (line.includes('⚠️')) {
                                  return (
                                    <div key={index} className="caution-day">
                                      <span className="day-content">{line.trim()}</span>
                                    </div>
                                  );
                                } else if (line.trim()) {
                                  return (
                                    <div key={index} className="day-description">
                                      {line.trim()}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
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
                  onClick={() => {
                    // 現在のモードをpreviousModeとして保存
                    if (selectedMode) {
                      localStorage.setItem('previousMode', selectedMode);
                      console.log('🔍 Level1: previousModeを保存:', selectedMode);
                    }
                    navigate('/ai-fortune');
                  }}
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

        {/* あなたの印象診断の説明 */}
        <div className="three-planets-introduction">
          <h3 className="section-title">🌌 星が伝える あなたの印象診断とは</h3>
          <div className="intro-overview">
            <p>
              10天体すべての位置から、あなたの完全な性格・印象・行動パターンを徹底分析！
              太陽・月・水星・金星・火星・木星・土星・天王星・海王星・冥王星の全てが
              「あなたがどんな人に見えるか」「どんな印象を与えるか」を詳しく解き明かします。
              出生時刻と場所から正確な天体位置を計算し、他の人があなたに感じる印象を完全解析します。
            </p>
          </div>
          
          <div className="three-planets-preview">
            <div className="planet-preview">
              <span className="planet-icon">👥</span>
              <div className="planet-info">
                <h4>他人があなたに感じる印象</h4>
                <p>10天体から見える総合的な人物像</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">💬</span>
              <div className="planet-info">
                <h4>話し方・コミュニケーション</h4>
                <p>水星の位置から分かる話し方の特徴</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">⭐</span>
              <div className="planet-info">
                <h4>第一印象・見た目の雰囲気</h4>
                <p>上昇星座が作り出すオーラや印象</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🎯</span>
              <div className="planet-info">
                <h4>行動パターン・エネルギー</h4>
                <p>火星から見える積極性や行動の特徴</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">💎</span>
              <div className="planet-info">
                <h4>価値観・美的センス</h4>
                <p>金星が示すあなたの好みと魅力</p>
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

        {/* 広告表示2: AI相談ボタンの上 */}
        <AdBanner 
          position="result-bottom" 
          size="medium" 
          demoMode={false} 
        />

        {/* アクションボタン */}
        <div className="action-buttons">
          <button 
            className="ai-chat-button"
            onClick={() => {
              // 現在のモードをpreviousModeとして保存
              if (selectedMode) {
                localStorage.setItem('previousMode', selectedMode);
                console.log('🔍 Level1 ActionButton: previousModeを保存:', selectedMode);
              }
              navigate('/ai-fortune');
            }}
          >
            🤖 AI占い師に相談する
          </button>
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
    debugLog('🔍 【renderLevel2実行】====================');
    debugLog('🔍 【renderLevel2実行】horoscopeData:', !!horoscopeData);
    debugLog('🔍 【renderLevel2実行】currentLevel:', currentLevel);
    debugLog('🔍 【renderLevel2実行】selectedMode:', selectedMode);
    
    if (!horoscopeData) {
      debugLog('🔍 【renderLevel2】horoscopeDataが存在しないためnullを返します');
      return null;
    }
    
    const sun = horoscopeData.planets.find(p => p.planet === '太陽');
    const moon = horoscopeData.planets.find(p => p.planet === '月');
          const ascendant = horoscopeData.planets.find(p => p.planet === '上昇星座');

    return (
      <div className="level-2" id="level2-section">
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
                      <h2 className="level-title-text">🔮 星が伝える 隠れた自分診断　～あなたの隠れた一面</h2>
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
              <LoadingSpinner size={50} color="#667eea" />
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
          <h3 className="section-title">🔮 占い　～あなたの隠れた一面</h3>
          
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
                onClick={() => {
                  debugLog('🔍 【Level2占いボタンクリック】====================');
                  debugLog('🔍 【Level2占いボタンクリック】isGeneratingLevel2:', isGeneratingLevel2);
                  debugLog('🔍 【Level2占いボタンクリック】horoscopeData:', !!horoscopeData);
                  debugLog('🔍 【Level2占いボタンクリック】birthData:', !!birthData);
                  handleGenerateLevel2Fortune();
                }}
                disabled={isGeneratingLevel2}
              >
                {isGeneratingLevel2 ? '占い中...' : '占う'}
              </button>
            </div>
          </div>
          
          {isGeneratingLevel2 && (
            <div className="generating-message">
              <LoadingSpinner size={50} color="#667eea" />
              <p>占い中です...お待ちください</p>
            </div>
          )}
          
          {(() => {
            debugLog('🔍 【Level2表示条件チェック】level2Fortune:', !!level2Fortune);
            debugLog('🔍 【Level2表示条件チェック】isGeneratingLevel2:', isGeneratingLevel2);
            debugLog('🔍 【Level2表示条件チェック】表示するか:', !!(level2Fortune && !isGeneratingLevel2));
            return null;
          })()}
          
          {level2Fortune && !isGeneratingLevel2 && (
            <div className="five-fortunes-section">
              <h3>🔮 あなたの隠れた運勢 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  const parseAIFortune = (fortuneText: string) => {
                    debugLog('🔍 【占い結果解析開始】入力テキスト:', fortuneText);
                    debugLog('🔍 【占い結果解析開始】テキスト長:', fortuneText?.length || 0);
                    
                    // 星評価を抽出するヘルパー関数
                    const extractStarRating = (text: string): number => {
                      // ★の数をカウント
                      const starMatches = text.match(/★+/g);
                      if (starMatches && starMatches.length > 0) {
                        const starCount = starMatches[0].length;
                        return Math.min(Math.max(starCount, 1), 5); // 1-5の範囲に制限
                      }
                      
                      // 数字での評価を抽出（例：評価3、★3など）
                      const numberMatch = text.match(/(?:評価|★)(\d)/);
                      if (numberMatch) {
                        const num = parseInt(numberMatch[1]);
                        return Math.min(Math.max(num, 1), 5);
                      }
                      
                      return 3; // デフォルト値
                    };
                    
                    const sections = {
                      innerChange: '',
                      emotionalFlow: '',
                      unconsciousChange: '',
                      honneBalance: '',
                      soulGrowth: '',
                      importantDays: '',
                      // 星評価
                      innerChangeStars: 3,
                      emotionalFlowStars: 3,
                      unconsciousChangeStars: 3,
                      honneBalanceStars: 3,
                      soulGrowthStars: 3
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
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.innerChangeStars = extractStarRating(cleanText);
                        sections.innerChange = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【総合運設定】:', sections.innerChange, '星評価:', sections.innerChangeStars);
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運') || section.includes('お金')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.emotionalFlowStars = extractStarRating(cleanText);
                        sections.emotionalFlow = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【金銭運設定】:', sections.emotionalFlow, '星評価:', sections.emotionalFlowStars);
                      } else if (section.includes('恋愛運') || section.includes('恋愛') || section.includes('人間関係') || section.includes('愛情')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.unconsciousChangeStars = extractStarRating(cleanText);
                        sections.unconsciousChange = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【恋愛運設定】:', sections.unconsciousChange, '星評価:', sections.unconsciousChangeStars);
                      } else if (section.includes('仕事運') || section.includes('仕事') || section.includes('キャリア') || section.includes('職業')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.honneBalanceStars = extractStarRating(cleanText);
                        sections.honneBalance = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【仕事運設定】:', sections.honneBalance, '星評価:', sections.honneBalanceStars);
                      } else if (section.includes('成長運') || section.includes('成長') || section.includes('発展') || section.includes('向上')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.soulGrowthStars = extractStarRating(cleanText);
                        sections.soulGrowth = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【成長運設定】:', sections.soulGrowth, '星評価:', sections.soulGrowthStars);
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
                        const cleanText = section.replace(/###[^#]*/, '').trim();
                        sections.innerChangeStars = extractStarRating(cleanText);
                        sections.innerChange = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【### 総合運設定】:', sections.innerChange, '星評価:', sections.innerChangeStars);
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運') || section.includes('お金')) {
                        const cleanText = section.replace(/###[^#]*/, '').trim();
                        sections.emotionalFlowStars = extractStarRating(cleanText);
                        sections.emotionalFlow = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【### 金銭運設定】:', sections.emotionalFlow, '星評価:', sections.emotionalFlowStars);
                      } else if (section.includes('恋愛運') || section.includes('恋愛') || section.includes('人間関係') || section.includes('愛情')) {
                        const cleanText = section.replace(/###[^#]*/, '').trim();
                        sections.unconsciousChangeStars = extractStarRating(cleanText);
                        sections.unconsciousChange = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【### 恋愛運設定】:', sections.unconsciousChange, '星評価:', sections.unconsciousChangeStars);
                      } else if (section.includes('仕事運') || section.includes('仕事') || section.includes('キャリア') || section.includes('職業')) {
                        const cleanText = section.replace(/###[^#]*/, '').trim();
                        sections.honneBalanceStars = extractStarRating(cleanText);
                        sections.honneBalance = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【### 仕事運設定】:', sections.honneBalance, '星評価:', sections.honneBalanceStars);
                      } else if (section.includes('成長運') || section.includes('成長') || section.includes('発展') || section.includes('向上')) {
                        const cleanText = section.replace(/###[^#]*/, '').trim();
                        sections.soulGrowthStars = extractStarRating(cleanText);
                        sections.soulGrowth = cleanText.replace(/運勢評価:.*?[★☆]+/g, '').replace(/[★☆]+/g, '').trim();
                        debugLog('🔍 【### 成長運設定】:', sections.soulGrowth, '星評価:', sections.soulGrowthStars);
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
                      const hasAnyContent = Object.values(sections).some(value => typeof value === 'string' && value.length > 0);
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
                    
                                         // 期間外の日付をフィルタリング（今日・明日以外の場合のみ）
                     if (sections.importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow') {
                       // Level2用の期間範囲を再計算
                       const calculatePeriodRangeLevel2 = (period: string) => {
                         const today = new Date();
                         let startDate = new Date(today);
                         let endDate = new Date(today);
                         
                         switch (period) {
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
                             startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                             endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                             break;
                           case 'nextMonth':
                             startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                             endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                             break;
                           default:
                             break;
                         }
                         
                         return {
                           start: startDate,
                           end: endDate,
                           startStr: `${startDate.getFullYear()}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${String(startDate.getDate()).padStart(2, '0')}`,
                           endStr: `${endDate.getFullYear()}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}`
                         };
                       };
                       
                       const periodRange = calculatePeriodRangeLevel2(fortunePeriod);
                       
                       // Level2用の期間バリデーション（periodRange使用）
                       const validateImportantDaysDateRangeLevel2 = (importantDaysText: string, period: string, periodRange: { start: Date; end: Date; startStr: string; endStr: string }): string => {
                        if (!importantDaysText || period === 'today' || period === 'tomorrow') {
                          return importantDaysText;
                        }
                        
                        // 期間範囲を使用（既に計算済み）
                        
                        // 日付の抽出とバリデーション
                        const lines = importantDaysText.split('\n');
                        const validatedLines: string[] = [];
                        
                        for (const line of lines) {
                          // 日付パターンを抽出（例：8月5日、8月15日など）
                          const dateMatch = line.match(/(\d{1,2})月(\d{1,2})日/);
                          
                          if (dateMatch) {
                            const month = parseInt(dateMatch[1]);
                            const day = parseInt(dateMatch[2]);
                            
                            // 日付を作成（今年の日付として）
                            const targetDate = new Date(new Date().getFullYear(), month - 1, day);
                            
                            // 期間内かチェック
                            if (targetDate >= periodRange.start && targetDate <= periodRange.end) {
                              validatedLines.push(line);
                              debugLog('🔍 【Level2期間内日付】有効:', line);
                            } else {
                              debugLog('🔍 【Level2期間外日付】除外:', line, '期間:', periodRange.start.toLocaleDateString(), '〜', periodRange.end.toLocaleDateString());
                            }
                          } else {
                            // 日付パターンが見つからない行（説明文など）は保持
                            validatedLines.push(line);
                          }
                        }
                        
                        return validatedLines.join('\n');
                      };
                      
                      sections.importantDays = validateImportantDaysDateRangeLevel2(sections.importantDays, fortunePeriod, periodRange);
                      debugLog('🔍 【Level2期間バリデーション後】:', sections.importantDays);
                    }
                    
                    debugLog('🔍 【最終解析結果】:', sections);
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level2Fortune);
                  
                  // セクションが空の場合のフォールバック表示
                  const hasAnySections = fortuneSections.innerChange || fortuneSections.emotionalFlow || 
                                       fortuneSections.unconsciousChange || fortuneSections.honneBalance || 
                                       fortuneSections.soulGrowth || fortuneSections.importantDays;
                  
                  debugLog('🔍 【Level2期間チェック】selectedPeriod:', selectedPeriod, 'fortunePeriod:', fortunePeriod);
                  debugLog('🔍 【Level2表示判定】今日・明日以外か:', fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow');
                  debugLog('🔍 【Level2最終表示判定】重要な日を表示するか:', !!fortuneSections.importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow');
                  
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
                          <h4 className="fortune-title">
                            🌟 総合運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).innerChangeStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).innerChangeStars || 3, 'overall')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.innerChange}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.emotionalFlow && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            💰 金銭運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).emotionalFlowStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).emotionalFlowStars || 3, 'money')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.emotionalFlow}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.unconsciousChange && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            💕 恋愛運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).unconsciousChangeStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).unconsciousChangeStars || 3, 'love')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.unconsciousChange}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.honneBalance && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            💼 仕事運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).honneBalanceStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).honneBalanceStars || 3, 'work')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.honneBalance}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.soulGrowth && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            🌱 成長運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).soulGrowthStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).soulGrowthStars || 3, 'growth')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.soulGrowth}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow' && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🗓️ 重要な日</h4>
                          <div className="fortune-content">
                            <div className="important-days-content">
                              {fortuneSections.importantDays.split('\n').map((line: string, index: number) => {
                                if (line.includes('🍀')) {
                                  return (
                                    <div key={index} className="lucky-day">
                                      <span className="day-content">{line.trim()}</span>
                                    </div>
                                  );
                                } else if (line.includes('⚠️')) {
                                  return (
                                    <div key={index} className="caution-day">
                                      <span className="day-content">{line.trim()}</span>
                                    </div>
                                  );
                                } else if (line.trim()) {
                                  return (
                                    <div key={index} className="day-description">
                                      {line.trim()}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
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
                  onClick={() => {
                    // 🔧 【修正】localStorageから最新のselectedModeを取得
                    const currentMode = localStorage.getItem('selectedMode') || selectedMode;
                    if (currentMode) {
                      localStorage.setItem('previousMode', currentMode);
                      console.log('🔍 Level2: previousModeを保存:', currentMode);
                      console.log('🔍 Level2: (参考)propsのselectedMode:', selectedMode);
                    }
                    navigate('/ai-fortune');
                  }}
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
              3つの天体だけでは分からない、まわりから見たあなたの印象や振る舞いを大解剖！
              生まれた瞬間の10天体すべての配置から、話し方・恋愛・仕事での行動パターンなど、
              周りが見ている「いつものあなた」の癖や特徴が詳しく明らかになります。
              出生時刻と場所の情報により、10天体それぞれがどの星座の位置にあったかを正確に計算し、
              より個人的で詳細な分析を行います。
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
          <button 
            className="ai-chat-button"
            onClick={() => {
              // 現在のモードをpreviousModeとして保存
              if (selectedMode) {
                localStorage.setItem('previousMode', selectedMode);
                console.log('🔍 Level2 ActionButton: previousModeを保存:', selectedMode);
              }
              navigate('/ai-fortune');
            }}
          >
            🤖 AI占い師に相談する
          </button>
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
      <div className="level-3" id="level3-section">
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
                      <h2 className="level-title-text">🌌 星が伝える あなたの印象診断　～まわりから見たあなた</h2>
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

                  const planetKey = `${planet.planet}-${planet.sign}`;
                  const isDetailVisible = planetDetailVisible === planetKey;

                  return (
                    <div key={index} className="planet-item">
                      <div 
                        className="planet-title-line clickable-planet" 
                        onClick={() => handlePlanetClick(planet.planet, planet.sign)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                        <span className="detail-toggle" style={{ marginLeft: '8px', fontSize: '12px' }}>
                          {isDetailVisible ? '▲' : '▼'}
                        </span>
                      </div>
                      
                      {/* 🌟 個別天体詳細表示（アコーディオン形式）*/}
                      {isDetailVisible && (
                        <div className="planet-detail-accordion">
                          <div className="planet-detail-content">
                            <h5>🌟 {planet.planet}×{planet.sign}座の特徴</h5>
                            <div className="planet-detail-text">
                              {planetDetail.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
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

                  const planetKey = `${planet.planet}-${planet.sign}`;
                  const isDetailVisible = planetDetailVisible === planetKey;

                  return (
                    <div key={index} className="planet-item">
                      <div 
                        className="planet-title-line clickable-planet" 
                        onClick={() => handlePlanetClick(planet.planet, planet.sign)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                        <span className="detail-toggle" style={{ marginLeft: '8px', fontSize: '12px' }}>
                          {isDetailVisible ? '▲' : '▼'}
                        </span>
                      </div>
                      
                      {/* 🌟 個別天体詳細表示（アコーディオン形式）*/}
                      {isDetailVisible && (
                        <div className="planet-detail-accordion">
                          <div className="planet-detail-content">
                            <h5>🌟 {planet.planet}×{planet.sign}座の特徴</h5>
                            <div className="planet-detail-text">
                              {planetDetail.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
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

                  const planetKey = `${planet.planet}-${planet.sign}`;
                  const isDetailVisible = planetDetailVisible === planetKey;

                  return (
                    <div key={index} className="planet-item">
                      <div 
                        className="planet-title-line clickable-planet" 
                        onClick={() => handlePlanetClick(planet.planet, planet.sign)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                        <span className="detail-toggle" style={{ marginLeft: '8px', fontSize: '12px' }}>
                          {isDetailVisible ? '▲' : '▼'}
                        </span>
                      </div>
                      
                      {/* 🌟 個別天体詳細表示（アコーディオン形式）*/}
                      {isDetailVisible && (
                        <div className="planet-detail-accordion">
                          <div className="planet-detail-content">
                            <h5>🌟 {planet.planet}×{planet.sign}座の特徴</h5>
                            <div className="planet-detail-text">
                              {planetDetail.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
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

                  const planetKey = `${planet.planet}-${planet.sign}`;
                  const isDetailVisible = planetDetailVisible === planetKey;

                  return (
                    <div key={index} className="planet-item">
                      <div 
                        className="planet-title-line clickable-planet" 
                        onClick={() => handlePlanetClick(planet.planet, planet.sign)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
                        <span className="planet-name">{planet.planet}</span>
                        <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
                        <span className="zodiac-name">{planet.sign}</span>
                        <span className="detail-toggle" style={{ marginLeft: '8px', fontSize: '12px' }}>
                          {isDetailVisible ? '▲' : '▼'}
                        </span>
                      </div>
                      
                      {/* 🌟 個別天体詳細表示（アコーディオン形式）*/}
                      {isDetailVisible && (
                        <div className="planet-detail-accordion">
                          <div className="planet-detail-content">
                            <h5>🌟 {planet.planet}×{planet.sign}座の特徴</h5>
                            <div className="planet-detail-text">
                              {planetDetail.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
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
              <LoadingSpinner size={50} color="#667eea" />
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
              <p>🔄 まわりから見たあなたの分析データの読み込みに失敗しました。</p>
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
                      const cacheKey = `level3_analysis_v7_${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
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
          
          {/* タイムアウト時の特別メッセージ */}
          {level3Analysis && level3Analysis.isTimeout && (
            <div className="timeout-message">
              <h4>⏰ 分析処理について</h4>
              <p>
                Level3の「星が伝えるあなたの印象診断」は10天体すべてを使った高度な運勢分析のため、
                通常より処理に時間がかかる場合があります。<br/>
                ネットワークの状況やサーバーの負荷により、一時的にタイムアウトが発生することがあります。
              </p>
              <div className="timeout-actions">
                <button 
                  className="retry-button primary"
                  onClick={() => {
                    // キャッシュをクリアしてから再試行
                    if (birthData) {
                      const cacheKey = `level3_analysis_v7_${birthData.name}_${birthData.birthDate?.toISOString().split('T')[0]}`;
                      localStorage.removeItem(cacheKey);
                    }
                    handleGenerateLevel3Analysis();
                  }}
                >
                  🔄 もう一度分析する
                </button>
                <p className="timeout-note">
                  ※ 再試行は1-2分間隔で行うことをお勧めします
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い　～まわりから見たあなた</h3>
          
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
              <LoadingSpinner size={50} color="#667eea" />
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
                              <h3>🌌 星が伝える あなたの印象診断　～まわりから見たあなた - {getPeriodTitle()}</h3>
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
                    
                    // Level3用の期間バリデーション関数（注意日説明文除去対応）
                    const validateImportantDaysDateRangeLevel3 = (importantDaysText: string, period: string, periodRange: { start: Date; end: Date; startStr: string; endStr: string }): string => {
                      if (!importantDaysText || period === 'today' || period === 'tomorrow') {
                        return importantDaysText;
                      }
                      
                      // 長期間（6か月以上）の場合は月単位なのでバリデーションを簡易化
                      if (['sixMonths', 'oneYear'].includes(period)) {
                        return importantDaysText; // 月単位は複雑すぎるのでそのまま通す
                      }
                      
                      // 対象期間を使用（既に計算済みのperiodRangeを使用）
                      const startDate = new Date(periodRange.start);
                      const endDate = new Date(periodRange.end);
                      
                      // 日付の抽出とバリデーション
                      const lines = importantDaysText.split('\n');
                      const luckyLines: string[] = [];
                      const cautionLines: string[] = [];
                      const otherLines: string[] = [];
                      
                      let currentCategory = '';
                      
                      for (const line of lines) {
                        // カテゴリを判定
                        if (line.includes('🍀')) {
                          currentCategory = 'lucky';
                        } else if (line.includes('⚠️')) {
                          currentCategory = 'caution';
                        }
                        
                        // 日付パターンを抽出（例：8月5日、8月15日など）
                        const dateMatch = line.match(/(\d{1,2})月(\d{1,2})日/);
                        
                        if (dateMatch) {
                          const month = parseInt(dateMatch[1]);
                          const day = parseInt(dateMatch[2]);
                          
                          // 日付を作成（今年の日付として）
                          const targetDate = new Date(new Date().getFullYear(), month - 1, day);
                          
                          // 期間内かチェック
                          if (targetDate >= periodRange.start && targetDate <= periodRange.end) {
                            if (currentCategory === 'lucky') {
                              luckyLines.push(line);
                            } else if (currentCategory === 'caution') {
                              cautionLines.push(line);
                            } else {
                              otherLines.push(line);
                            }
                            debugLog('🔍 【Level3期間内日付】有効:', line);
                          } else {
                            debugLog('🔍 【Level3期間外日付】除外:', line, '期間:', periodRange.start.toLocaleDateString(), '〜', periodRange.end.toLocaleDateString());
                          }
                        } else if (line.includes('🍀') || line.includes('⚠️')) {
                          // 絵文字行は、対応する日付がある場合のみ含める
                          if (currentCategory === 'lucky') {
                            luckyLines.push(line);
                          } else if (currentCategory === 'caution') {
                            cautionLines.push(line);
                          }
                        } else if (line.trim() && !line.includes('これらの日は') && !line.includes('これらの月は')) {
                          // 説明文以外の一般的な行
                          otherLines.push(line);
                        } else if (line.trim() && (line.includes('これらの日は') || line.includes('これらの月は'))) {
                          // 説明文は、対応するカテゴリに日付がある場合のみ含める
                          if (currentCategory === 'lucky' && luckyLines.some(l => l.match(/\d{1,2}月\d{1,2}日/))) {
                            luckyLines.push(line);
                          } else if (currentCategory === 'caution' && cautionLines.some(l => l.match(/\d{1,2}月\d{1,2}日/))) {
                            cautionLines.push(line);
                          }
                        }
                      }
                      
                      // 最終的に日付が存在するカテゴリのみを結合
                      const finalLines: string[] = [];
                      
                      // ラッキーデーに日付があれば全て追加
                      if (luckyLines.some(line => line.match(/\d{1,2}月\d{1,2}日/))) {
                        finalLines.push(...luckyLines);
                      }
                      
                      // 注意日に日付があれば全て追加
                      if (cautionLines.some(line => line.match(/\d{1,2}月\d{1,2}日/))) {
                        finalLines.push(...cautionLines);
                      }
                      
                      // その他の行を追加
                      finalLines.push(...otherLines);
                      
                      return finalLines.join('\n');
                    };
                    
                    // 星評価を抽出するヘルパー関数
                    const extractStarRating = (text: string): number => {
                      // ★の数をカウント
                      const starMatches = text.match(/★+/g);
                      if (starMatches && starMatches.length > 0) {
                        const starCount = starMatches[0].length;
                        return Math.min(Math.max(starCount, 1), 5); // 1-5の範囲に制限
                      }
                      
                      // 数字での評価を抽出（例：評価3、★3など）
                      const numberMatch = text.match(/(?:評価|★)(\d)/);
                      if (numberMatch) {
                        const num = parseInt(numberMatch[1]);
                        return Math.min(Math.max(num, 1), 5);
                      }
                      
                      return 3; // デフォルト値
                    };
                    
                    const sections = {
                      overall: '',    // 総合運
                      money: '',      // 金銭運
                      love: '',       // 恋愛運
                      work: '',       // 仕事運
                      growth: '',     // 成長運
                      importantDays: '',
                      // 星評価
                      overallStars: 3,
                      moneyStars: 3,
                      loveStars: 3,
                      workStars: 3,
                      growthStars: 3
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
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.overallStars = extractStarRating(cleanText);
                        sections.overall = cleanText.replace(/運勢評価[:：].*?[★☆]+/g, '').replace(/[★☆]+/g, '').replace(/運勢評価[:：]/g, '').trim();
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運') || section.includes('金銭面')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.moneyStars = extractStarRating(cleanText);
                        sections.money = cleanText.replace(/運勢評価[:：].*?[★☆]+/g, '').replace(/[★☆]+/g, '').replace(/運勢評価[:：]/g, '').trim();
                      } else if (section.includes('恋愛運') || section.includes('恋愛・人間関係') || section.includes('恋愛') && section.includes('運')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.loveStars = extractStarRating(cleanText);
                        sections.love = cleanText.replace(/運勢評価[:：].*?[★☆]+/g, '').replace(/[★☆]+/g, '').replace(/運勢評価[:：]/g, '').trim();
                      } else if (section.includes('仕事運') || section.includes('キャリア') || section.includes('仕事面')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.workStars = extractStarRating(cleanText);
                        sections.work = cleanText.replace(/運勢評価[:：].*?[★☆]+/g, '').replace(/[★☆]+/g, '').replace(/運勢評価[:：]/g, '').trim();
                      } else if (section.includes('成長運') || section.includes('成長チャンス') || section.includes('自己発展')) {
                        const cleanText = section.replace(/【[^】]*】/, '').trim();
                        sections.growthStars = extractStarRating(cleanText);
                        sections.growth = cleanText.replace(/運勢評価[:：].*?[★☆]+/g, '').replace(/[★☆]+/g, '').replace(/運勢評価[:：]/g, '').trim();
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
                    
                     // 期間外の日付をフィルタリング（今日・明日以外の場合のみ）
                     if (sections.importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow') {
                       // Level3用の期間範囲を計算
                       const calculatePeriodRangeLevel3 = (period: string) => {
                         const today = new Date();
                         let startDate = new Date(today);
                         let endDate = new Date(today);
                         
                         switch (period) {
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
                             startDate = new Date(today.getFullYear(), today.getMonth(), 1);
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
                           case 'oneYear':
                             startDate = new Date(today);
                             endDate = new Date(today);
                             endDate.setFullYear(today.getFullYear() + 1);
                             break;
                           default:
                             break;
                         }
                         
                         return {
                           start: startDate,
                           end: endDate,
                           startStr: `${startDate.getFullYear()}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${String(startDate.getDate()).padStart(2, '0')}`,
                           endStr: `${endDate.getFullYear()}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}`
                         };
                       };
                       
                       const periodRange = calculatePeriodRangeLevel3(fortunePeriod);
                       
                       sections.importantDays = validateImportantDaysDateRangeLevel3(sections.importantDays, fortunePeriod, periodRange);
                       debugLog('🔍 【Level3期間バリデーション後】:', sections.importantDays);
                     }
                    
                    debugLog('🔍 【Level3解析結果】:', sections);
                    
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level3Fortune);
                  
                  debugLog('🔍 【Level3期間チェック】selectedPeriod:', selectedPeriod, 'fortunePeriod:', fortunePeriod);
                  debugLog('🔍 【Level3表示判定】今日・明日以外か:', fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow');
                  debugLog('🔍 【Level3最終表示判定】重要な日を表示するか:', !!(fortuneSections as any).importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow');
                  
                  return (
                    <>
                      {fortuneSections.overall && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            総合運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).overallStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).overallStars || 3, 'overall')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.overall}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.money && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            金銭運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).moneyStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).moneyStars || 3, 'money')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.money}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.love && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            恋愛運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).loveStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).loveStars || 3, 'love')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.love}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.work && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            仕事運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).workStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).workStars || 3, 'work')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.work}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.growth && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">
                            成長運
                            <span 
                              className="star-rating" 
                              style={{ color: getStarColor((fortuneSections as any).growthStars || 3), marginLeft: '10px' }}
                            >
                              {renderFortuneRating((fortuneSections as any).growthStars || 3, 'growth')}
                            </span>
                          </h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.growth}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 重要な日/月の表示 */}
                      {(fortuneSections as any).importantDays && fortunePeriod !== 'today' && fortunePeriod !== 'tomorrow' && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🗓️ {fortunePeriod === 'sixMonths' || fortunePeriod === 'oneYear' ? '重要な月' : '重要な日'}</h4>
                          <div className="fortune-content">
                            <div className="important-days-content">
                              {(fortuneSections as any).importantDays.split('\n').map((line: string, index: number) => {
                                if (line.includes('🍀')) {
                                  return (
                                    <div key={index} className="lucky-day">
                                      <span className="day-content">{line.trim()}</span>
                                    </div>
                                  );
                                } else if (line.includes('⚠️')) {
                                  return (
                                    <div key={index} className="caution-day">
                                      <span className="day-content">{line.trim()}</span>
                                    </div>
                                  );
                                } else if (line.trim()) {
                                  return (
                                    <div key={index} className="day-description">
                                      {line.trim()}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
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
                  onClick={() => {
                    // 🔧 【修正】localStorageから最新のselectedModeを取得
                    const currentMode = localStorage.getItem('selectedMode') || selectedMode;
                    if (currentMode) {
                      localStorage.setItem('previousMode', currentMode);
                      console.log('🔍 Level3: previousModeを保存:', currentMode);
                      console.log('🔍 Level3: (参考)propsのselectedMode:', selectedMode);
                    }
                    navigate('/ai-fortune');
                  }}
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
          <button 
            className="ai-chat-button"
            onClick={() => {
              // 🔧 【修正】localStorageから最新のselectedModeを取得
              const currentMode = localStorage.getItem('selectedMode') || selectedMode;
              if (currentMode) {
                localStorage.setItem('previousMode', currentMode);
                console.log('🔍 Level3 ActionButton: previousModeを保存:', currentMode);
                console.log('🔍 Level3 ActionButton: (参考)propsのselectedMode:', selectedMode);
              }
              navigate('/ai-fortune');
            }}
          >
            🤖 AI占い師に相談する
          </button>
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
            // 出生時刻のチェック：実際に選択されたかをチェック
            // 12:00は有効な時刻なので、単純に存在チェックのみ行う
            const missingBirthTime = !parsed.birthTime;
            const missingBirthPlace = !parsed.birthPlace || 
                                      !parsed.birthPlace.city || 
                                      parsed.birthPlace.city === '東京';
            
            debugLog('🔍 StepByStepResult - データチェック:');
            debugLog('  selectedMode:', selectedMode);
            debugLog('  parsed.birthTime:', parsed.birthTime);
            debugLog('  missingBirthTime:', missingBirthTime);
            debugLog('  parsed.birthPlace:', parsed.birthPlace);
            debugLog('  missingBirthPlace:', missingBirthPlace);
            
            if (missingBirthTime || missingBirthPlace) {
              debugLog('🔍 必要なデータが不足しています。メッセージを表示します。');
              setShowDataMissingMessage(true);
              setLoading(false);
              return;
            } else {
              debugLog('🔍 必要なデータは全て揃っています。');
            }
          }
          
          setBirthData(parsed);
          
          // 出生データから天体計算を実行
          const horoscope = await generateCompleteHoroscope(parsed);
          setHoroscopeData(horoscope);
          
          // 既存の占い結果をlocalStorageから復元
          const today = new Date().toISOString().split('T')[0];
          const userName = parsed.name || 'user';
          
          // Level1占い結果の復元
          try {
            const level1Key = `level1_fortune_${userName}_${today}`;
            const storedLevel1 = localStorage.getItem(level1Key);
            if (storedLevel1) {
              const fortuneData = JSON.parse(storedLevel1);
              setLevel1Fortune(fortuneData.result);
              setFortunePeriod(fortuneData.period || 'today');
              console.log('🔍 Level1占い結果を復元しました:', fortuneData.period);
            }
          } catch (error) {
            console.warn('Level1占い結果の復元エラー:', error);
          }
          
          // Level2占い結果の復元
          try {
            const level2Key = `level2_fortune_${userName}_${today}`;
            const storedLevel2 = localStorage.getItem(level2Key);
            if (storedLevel2) {
              const fortuneData = JSON.parse(storedLevel2);
              setLevel2Fortune(fortuneData.result);
              console.log('🔍 Level2占い結果を復元しました');
            }
          } catch (error) {
            console.warn('Level2占い結果の復元エラー:', error);
          }
          
          // Level3占い結果の復元
          try {
            const level3Key = `level3_fortune_${userName}_${today}`;
            const storedLevel3 = localStorage.getItem(level3Key);
            if (storedLevel3) {
              const fortuneData = JSON.parse(storedLevel3);
              setLevel3Fortune(fortuneData.result);
              console.log('🔍 Level3占い結果を復元しました');
            }
          } catch (error) {
            console.warn('Level3占い結果の復元エラー:', error);
          }
          
          // 復元されたselectedModeに基づいてcurrentLevelを更新
          const restoredSelectedMode = localStorage.getItem('selectedMode');
          if (restoredSelectedMode) {
            let newLevel: DisplayLevel = 1;
            if (restoredSelectedMode === 'three-planets') {
              newLevel = 2;
            } else if (restoredSelectedMode === 'ten-planets') {
              newLevel = 3;
            }
            console.log('🔍 復元されたselectedModeに基づいてcurrentLevelを設定:', restoredSelectedMode, '->', newLevel);
            setCurrentLevel(newLevel);
          }
          
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
    
    if (false) { // Level2削除: currentLevel === 2 && selectedMode === 'three-planets'
      debugLog('🔍 【3天体性格分析】レベル2（3天体モード）で自動実行開始');
      setHasTriggeredGeneration(true);
      
      // 既存のthreePlanetsPersonalityが古い形式かチェック
      if (threePlanetsPersonality && !threePlanetsPersonality.innerChange) {
        debugLog('🔍 【古い形式検出】threePlanetsPersonalityを初期化して新形式で再生成');
        setThreePlanetsPersonality(null);
        // 古い形式のキャッシュを削除
        const key = generateThreePlanetsKey(birthData!, horoscopeData!.planets);
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
            const key = generateThreePlanetsKey(birthData!, horoscopeData!.planets);
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
    if (false) { // Level2削除: selectedMode === 'three-planets'
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