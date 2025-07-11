import React, { useState, useEffect, useMemo } from 'react';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import { generateAIAnalysis, AIAnalysisResult, generateFuturePrediction, FuturePrediction, FutureTimeframe } from '../utils/aiAnalyzer';
import { useNavigate } from 'react-router-dom';
import './StepByStepResult.css';

// 表示レベルの定義
type DisplayLevel = 1 | 2 | 3;

// 期間選択のタイプ
type PeriodSelection = 'today' | 'thisWeek' | 'thisMonth' | 'tomorrow' | 'nextWeek' | 'nextMonth' | 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear';

interface StepByStepResultProps {
  mode?: 'simple' | 'detailed';
}

const StepByStepResult: React.FC<StepByStepResultProps> = ({ mode = 'detailed' }) => {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [futurePrediction, setFuturePrediction] = useState<FuturePrediction | null>(null);
  const [currentLevel, setCurrentLevel] = useState<DisplayLevel>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('初期化中...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  const navigate = useNavigate();

  // 太陽星座の取得
  const sunSign = useMemo(() => {
    if (!horoscopeData?.planets) return null;
    const sun = horoscopeData.planets.find(p => p.planet === '太陽' || p.planet === 'Sun');
    return sun?.sign || null;
  }, [horoscopeData]);

  // 主要3天体の取得
  const mainPlanets = useMemo(() => {
    if (!horoscopeData?.planets) return [];
    const sun = horoscopeData.planets.find(p => p.planet === '太陽' || p.planet === 'Sun');
    const moon = horoscopeData.planets.find(p => p.planet === '月' || p.planet === 'Moon');
    
    // 上昇星座を取得
    const ascendant = horoscopeData.houses && horoscopeData.houses[0] ? {
      planet: '上昇星座',
      sign: horoscopeData.houses[0].sign,
      house: 1,
      degree: horoscopeData.houses[0].degree,
      retrograde: false
    } : null;
    
    const planets = [];
    if (sun) planets.push(sun);
    if (moon) planets.push(moon);
    if (ascendant) planets.push(ascendant);
    
    return planets;
  }, [horoscopeData]);

  // 星座情報の定義
  const zodiacInfo: Record<string, { icon: string; element: string; quality: string; ruling: string; keywords: string[] }> = {
    '牡羊座': { 
      icon: '♈', 
      element: '火', 
      quality: '活動', 
      ruling: '火星',
      keywords: ['リーダーシップ', '積極性', '冒険心', '独立心']
    },
    '牡牛座': { 
      icon: '♉', 
      element: '土', 
      quality: '固定', 
      ruling: '金星',
      keywords: ['安定性', '忍耐力', '美的感覚', '実用性']
    },
    '双子座': { 
      icon: '♊', 
      element: '風', 
      quality: '柔軟', 
      ruling: '水星',
      keywords: ['コミュニケーション', '好奇心', '適応性', '知識欲']
    },
    '蟹座': { 
      icon: '♋', 
      element: '水', 
      quality: '活動', 
      ruling: '月',
      keywords: ['感情豊か', '保護的', '家族愛', '直感力']
    },
    '獅子座': { 
      icon: '♌', 
      element: '火', 
      quality: '固定', 
      ruling: '太陽',
      keywords: ['創造性', '自己表現', '尊厳', '寛大さ']
    },
    '乙女座': { 
      icon: '♍', 
      element: '土', 
      quality: '柔軟', 
      ruling: '水星',
      keywords: ['分析力', '完璧主義', '奉仕精神', '実践性']
    },
    '天秤座': { 
      icon: '♎', 
      element: '風', 
      quality: '活動', 
      ruling: '金星',
      keywords: ['バランス', '調和', '公平性', '美的感覚']
    },
    '蠍座': { 
      icon: '♏', 
      element: '水', 
      quality: '固定', 
      ruling: '冥王星',
      keywords: ['深い洞察', '変革力', '集中力', '神秘性']
    },
    '射手座': { 
      icon: '♐', 
      element: '火', 
      quality: '柔軟', 
      ruling: '木星',
      keywords: ['冒険心', '哲学的', '楽観性', '自由愛']
    },
    '山羊座': { 
      icon: '♑', 
      element: '土', 
      quality: '活動', 
      ruling: '土星',
      keywords: ['責任感', '野心', '実務的', '忍耐力']
    },
    '水瓶座': { 
      icon: '♒', 
      element: '風', 
      quality: '固定', 
      ruling: '天王星',
      keywords: ['独創性', '人道主義', '革新性', '友情']
    },
    '魚座': { 
      icon: '♓', 
      element: '水', 
      quality: '柔軟', 
      ruling: '海王星',
      keywords: ['共感性', '直感力', '芸術性', 'スピリチュアル']
    }
  };

  // 天体の日本語名マッピング
  const planetNames = {
    '太陽': '太陽', '月': '月', '水星': '水星', '金星': '金星', '火星': '火星',
    '木星': '木星', '土星': '土星', '天王星': '天王星', '海王星': '海王星', '冥王星': '冥王星',
    '上昇星座': '上昇星座'
  };

  // 天体の説明
  const planetDescriptions: Record<string, { icon: string; meaning: string; description: string }> = {
    '太陽': {
      icon: '☀️',
      meaning: '基本的な性格・行動パターン',
      description: 'あなたの核となる性格です。人生の目的や基本的な価値観を表します。'
    },
    '月': {
      icon: '🌙',
      meaning: '内面・感情・プライベートな面',
      description: 'リラックスしている時の本当のあなたです。感情的な反応や無意識的な行動パターンを表します。'
    },
    '水星': {
      icon: '☿️',
      meaning: 'コミュニケーション・思考パターン',
      description: '考え方や話し方、学習スタイルを表します。情報処理の仕方がわかります。'
    },
    '金星': {
      icon: '♀️',
      meaning: '恋愛・美的感覚・価値観',
      description: '恋愛傾向や美的感覚、何に価値を置くかを表します。'
    },
    '火星': {
      icon: '♂️',
      meaning: '行動力・エネルギー・競争心',
      description: 'エネルギーの使い方や怒りの表現、競争に対する姿勢を表します。'
    },
    '木星': {
      icon: '♃',
      meaning: '成長・発展・楽観性',
      description: '成長の方向性や幸運の源、価値観の拡大を表します。'
    },
    '土星': {
      icon: '♄',
      meaning: '責任・制限・人生の課題',
      description: '人生の課題や制限、責任感の現れ方を表します。'
    },
    '天王星': {
      icon: '♅',
      meaning: '革新・独創性・変化',
      description: '変化を求める気持ちや独創性、革新的な面を表します。'
    },
    '海王星': {
      icon: '♆',
      meaning: '直感・夢・スピリチュアル',
      description: '直感力や夢見がちな面、スピリチュアルな感性を表します。'
    },
    '冥王星': {
      icon: '♇',
      meaning: '変革・深層心理・再生',
      description: '深層心理や変革の力、人生の根本的な変化を表します。'
    },
    '上昇星座': {
      icon: '🌅',
      meaning: '第一印象・外見・人との接し方',
      description: '人があなたに抱く第一印象や、あなたの外見的な特徴を表します。'
    }
  };

  // 期間選択のオプション
  const periodOptions = {
    level2: [
      { value: 'today' as PeriodSelection, label: '今日', timeframe: '今日' as FutureTimeframe },
      { value: 'thisWeek' as PeriodSelection, label: '今週', timeframe: '今週' as FutureTimeframe },
      { value: 'thisMonth' as PeriodSelection, label: '今月', timeframe: '今月' as FutureTimeframe }
    ],
    level3: [
      { value: 'today' as PeriodSelection, label: '今日', timeframe: '今日' as FutureTimeframe },
      { value: 'tomorrow' as PeriodSelection, label: '明日', timeframe: '明日' as FutureTimeframe },
      { value: 'thisWeek' as PeriodSelection, label: '今週', timeframe: '今週' as FutureTimeframe },
      { value: 'nextWeek' as PeriodSelection, label: '来週', timeframe: '来週' as FutureTimeframe },
      { value: 'thisMonth' as PeriodSelection, label: '今月', timeframe: '今月' as FutureTimeframe },
      { value: 'nextMonth' as PeriodSelection, label: '来月', timeframe: '来月' as FutureTimeframe },
      { value: 'oneMonth' as PeriodSelection, label: '1ヶ月', timeframe: '1ヶ月' as FutureTimeframe },
      { value: 'threeMonths' as PeriodSelection, label: '3ヶ月', timeframe: '3ヶ月' as FutureTimeframe },
      { value: 'sixMonths' as PeriodSelection, label: '6ヶ月', timeframe: '6ヶ月' as FutureTimeframe },
      { value: 'oneYear' as PeriodSelection, label: '1年', timeframe: '1年' as FutureTimeframe }
    ]
  };

  // 教育コンテンツの定義（詳細版）
  const educationalContent = {
    level1: {
      title: "🌟 占星術ミニ講座: 太陽星座について",
      content: [
        "太陽星座は、あなたが生まれた時に太陽がどの星座にあったかを示します。",
        "これは一般的に「星座占い」として知られている部分で、あなたの基本的な性格や行動パターンを表します。",
        "太陽星座は「外向きの自分」「人生の目標」「自分らしさ」を象徴します。",
        "",
        "🎯 太陽星座が表すもの：",
        "• 基本的な性格・価値観",
        "• 人生の目標・方向性",
        "• 外向きの自分・社会での顔",
        "• 創造性・表現力の源",
        "• 自信・プライドの在り方",
        "",
        "太陽星座を理解することで、あなたの「コア」となる部分を知ることができます。これは占星術学習の第一歩です。"
      ],
      nextLevel: "レベル2では、内面的な感情（月星座）と第一印象（上昇星座）について学べます。太陽・月・上昇星座の組み合わせで、より複雑で正確な性格分析が可能になります。",
      tips: [
        "💡 太陽星座だけで全てが決まるわけではありません。あくまで「基本的な傾向」です。",
        "💡 同じ太陽星座でも、月星座や上昇星座によって性格は大きく変わります。",
        "💡 太陽星座は「理想の自分」を表すこともあります。"
      ]
    },
    level2: {
      title: "🌙 占星術ミニ講座: 主要3天体の意味",
      content: [
        "占星術の基本となる3つの天体について詳しく学びましょう。",
        "",
        "🌞 太陽星座（外向きの自分）",
        "• 社会に見せる顔・公的な性格",
        "• 人生の目標・価値観",
        "• 創造性・表現力",
        "• 自信・リーダーシップ",
        "",
        "🌙 月星座（内面の自分）",
        "• 本当の感情・無意識の反応",
        "• プライベートな時の性格",
        "• 安心感・心の支え",
        "• 幼児期の記憶・母性との関係",
        "",
        "🌅 上昇星座（第一印象）",
        "• 初対面の人に与える印象",
        "• 外見・雰囲気・服装の好み",
        "• 人生のアプローチ方法",
        "• 新しい環境での振る舞い"
      ],
      tips: [
        "💡 太陽星座と月星座が同じ場合、内面と外面が一致しやすく、純粋な性格になります。",
        "💡 太陽星座と月星座が違うと、「外向きの自分」と「内面の自分」にギャップを感じることがあります。",
        "💡 上昇星座は、初対面の人があなたに抱く印象を表します。",
        "💡 この3つを組み合わせることで、より詳しい性格分析ができます。",
        "💡 月星座は感情的な反応パターンを表すので、ストレス時の行動予測に役立ちます。"
      ],
      nextLevel: "レベル3では、さらに7つの天体（水星、金星、火星、木星、土星、天王星、海王星、冥王星）とその関係性について学べます。10天体すべてを理解することで、あなたの人生の全体像が見えてきます。",
      practicalUse: [
        "📝 恋愛関係：太陽星座で相手との基本的な相性、月星座で感情的な相性を判断",
        "📝 仕事選び：太陽星座で向いている職業、上昇星座で職場での印象を予測",
        "📝 人間関係：月星座で相手の本音を理解、上昇星座で第一印象を改善"
      ]
    },
    level3: {
      title: "🪐 占星術ミニ講座: 10天体の世界",
      content: [
        "10天体それぞれが、あなたの人生の異なる側面を表します。",
        "",
        "🌍 個人天体（日常生活に直接影響）",
        "• 太陽：基本的な性格・人生の目標",
        "• 月：感情・無意識・プライベート",
        "• 水星：コミュニケーション・思考・学習",
        "• 金星：恋愛・美的感覚・価値観",
        "• 火星：行動力・エネルギー・競争心",
        "",
        "🏛️ 社会天体（社会での成長と責任）",
        "• 木星：成長・拡大・幸運・哲学",
        "• 土星：責任・制限・試練・成熟",
        "",
        "🌌 トランスパーソナル天体（世代的特徴と変革）",
        "• 天王星：革新・独創性・変化・自由",
        "• 海王星：直感・想像力・スピリチュアル",
        "• 冥王星：変革・再生・深層心理",
        "",
        "これらの天体が織りなす複雑な関係性が、あなたの個性を作り上げています。"
      ],
      tips: [
        "💡 天体同士の角度（アスペクト）が、あなたの才能や課題を表します。",
        "💡 各天体がどの星座・ハウスにあるかで、エネルギーの表れ方が変わります。",
        "💡 これらの情報を組み合わせることで、より深い自己理解が可能になります。",
        "💡 個人天体は意識的にコントロールしやすく、外惑星は無意識的な影響を与えます。",
        "💡 トランスパーソナル天体は世代的な特徴も表すので、同世代の人との共通点が見つかります。"
      ],
      practicalUse: [
        "📝 恋愛：金星星座で恋愛傾向を知る、火星星座で相手への積極性を判断",
        "📝 仕事：水星星座でコミュニケーションスタイルを活かす、土星星座で責任の取り方を学ぶ",
        "📝 人間関係：月星座で感情の扱い方を理解、木星星座で相手の価値観を把握",
        "📝 自己成長：天王星星座で変化への対応力を高める、冥王星星座で深層心理を探る",
        "📝 ライフプラン：土星星座で人生の課題を知る、木星星座で成長の方向性を見つける"
      ],
      advanced: {
        title: "🎓 上級者向け: アスペクト（天体間の関係）",
        content: [
          "アスペクトとは、天体同士が作る角度のことです。",
          "• 0°（合）：強い結びつき・才能の融合",
          "• 60°（セクスタイル）：調和・サポート",
          "• 90°（スクエア）：緊張・試練・成長",
          "• 120°（トライン）：自然な才能・幸運",
          "• 180°（オポジション）：対立・バランス"
        ]
      }
    }
  };

  // 初期化処理
  useEffect(() => {
    const initializeData = async () => {
      try {
        setCurrentStep('出生データを読み込んでいます...');
        
        const storedData = localStorage.getItem('birthData');
        if (!storedData) {
          throw new Error('出生データが見つかりません。入力画面に戻って情報を入力してください。');
        }

        const data = JSON.parse(storedData);
        if (data.birthDate) {
          data.birthDate = new Date(data.birthDate);
        }
        setBirthData(data);

        setCurrentStep('天体計算を実行中...');
        const horoscope = await generateCompleteHoroscope(data);
        setHoroscopeData(horoscope);

        // AI分析を一時的に無効化（基本的な占星術データのみ表示）
        setCurrentStep('基本データの準備完了');
        setIsAnalyzing(false);
        setLoading(false);
        
        // AI分析は後で実行（非同期）
        setTimeout(async () => {
          try {
            const analysisMessage = mode === 'simple' 
              ? 'AI簡単占い分析を実行中...' 
              : 'AI詳細占星術分析を実行中...';
            setCurrentStep(analysisMessage);
            setIsAnalyzing(true);
            console.log(`🔍 ${mode === 'simple' ? '簡単占い' : '詳細占い'}のAI分析を開始します...`);
            
            const analysis = await generateAIAnalysis(data, horoscope.planets, mode);
            console.log('✅ AI分析結果:', analysis);
            
            setAiAnalysis(analysis);
            setCurrentStep('AI分析完了');
            setIsAnalyzing(false);
            console.log('🎉 AI分析が完了し、状態に設定されました');
          } catch (aiError) {
            console.error('❌ AI分析エラー:', aiError);
            setIsAnalyzing(false);
            setCurrentStep('AI分析に失敗しました');
            // AI分析が失敗しても基本データは表示される
          }
        }, 1000);
      } catch (error) {
        console.error('初期化エラー:', error);
        setError(error instanceof Error ? error.message : '予期しないエラーが発生しました。');
        setLoading(false);
      }
    };

    initializeData();
  }, [mode]);

  // レベルアップ処理
  const handleLevelUp = () => {
    if (currentLevel < 3) {
      setCurrentLevel(prev => (prev + 1) as DisplayLevel);
    }
  };

  // 未来予測生成
  const handleGeneratePrediction = async () => {
    if (!birthData || !horoscopeData) return;
    
    setIsPredicting(true);
    try {
      const options = currentLevel === 2 ? periodOptions.level2 : periodOptions.level3;
      const selectedOption = options.find(opt => opt.value === selectedPeriod);
      const timeframe = selectedOption?.timeframe || '今日';
      
      const prediction = await generateFuturePrediction(birthData, horoscopeData.planets, timeframe);
      setFuturePrediction(prediction);
    } catch (error) {
      console.error('未来予測エラー:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="step-result-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h3>占い結果を計算中...</h3>
          <p className="loading-step">{currentStep}</p>
          {isAnalyzing && (
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="step-result-container">
        <div className="error-section">
          <div className="error-icon">⚠️</div>
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="back-button"
          >
            入力画面に戻る
          </button>
        </div>
      </div>
    );
  }

  // レベル別の結果表示
  const renderLevelResult = () => {
    switch (currentLevel) {
      case 1:
        return renderLevel1();
      case 2:
        return renderLevel2();
      case 3:
        return renderLevel3();
      default:
        return null;
    }
  };

  // レベル1の表示
  const renderLevel1 = () => {
    if (!sunSign) return null;
    
    const signInfo = zodiacInfo[sunSign];
    if (!signInfo) return null;

    return (
      <div className="level-1">
        <div className="main-result-card">
          <div className="zodiac-display">
            <div className="zodiac-icon">{signInfo.icon}</div>
            <div className="zodiac-name">{sunSign}</div>
          </div>
          
          <div className="zodiac-details">
            <div className="zodiac-element">
              <span className="label">エレメント:</span>
              <span className="value">{signInfo.element}</span>
            </div>
            <div className="zodiac-element">
              <span className="label">クオリティ:</span>
              <span className="value">{signInfo.quality}</span>
            </div>
            <div className="zodiac-element">
              <span className="label">支配星:</span>
              <span className="value">{signInfo.ruling}</span>
            </div>
          </div>
          
          <div className="personality-keywords">
            <h4>あなたの特徴</h4>
            <div className="keywords">
              {signInfo.keywords.map((keyword, index) => (
                <span key={index} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 教育コンテンツ */}
        <div className="educational-content">
          <h3>{educationalContent.level1.title}</h3>
          <div className="content-text">
            {educationalContent.level1.content.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
          <div className="tips-section">
            <h4>💡 豆知識</h4>
            {educationalContent.level1.tips.map((tip, index) => (
              <p key={index}>{tip}</p>
            ))}
          </div>
        </div>

        {/* 次のレベル予告 */}
        <div className="next-level-preview">
          <h4>🔮 次のレベルで分かること</h4>
          <p>{educationalContent.level1.nextLevel}</p>
        </div>
      </div>
    );
  };

  // レベル2の表示
  const renderLevel2 = () => {
    if (mainPlanets.length === 0) return null;

    return (
      <div className="level-2">
        <div className="planets-grid">
          {mainPlanets.map((planet, index) => (
            <div key={index} className="planet-card">
              <div className="planet-header">
                <div className="planet-icon">{planetDescriptions[planet.planet]?.icon}</div>
                <div className="planet-info">
                  <h4>{planet.planet}</h4>
                  <p className="planet-meaning">{planetDescriptions[planet.planet]?.meaning}</p>
                </div>
              </div>
              
              <div className="planet-sign">
                <div className="sign-display">
                  <span className="sign-icon">{zodiacInfo[planet.sign]?.icon}</span>
                  <span className="sign-name">{planet.sign}</span>
                </div>
              </div>
              
              <div className="planet-description">
                <p>{planetDescriptions[planet.planet]?.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 期間選択運勢 */}
        <div className="period-fortune-section">
          <h3>🔮 期間選択運勢</h3>
          <div className="period-selector">
            {periodOptions.level2.map((option) => (
              <button
                key={option.value}
                className={`period-button ${selectedPeriod === option.value ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button 
            className="generate-prediction-button"
            onClick={handleGeneratePrediction}
            disabled={isPredicting}
          >
            {isPredicting ? '生成中...' : '運勢を見る'}
          </button>
          
          {futurePrediction && (
            <div className="prediction-result">
              <h4>🌟 {periodOptions.level2.find(opt => opt.value === selectedPeriod)?.label}の運勢</h4>
              <p>{futurePrediction.overallMessage}</p>
              <div className="prediction-details">
                <div className="prediction-item">
                  <span className="prediction-label">全体運:</span>
                  <span className="prediction-text">{futurePrediction.shortTermAdvice || '総合的な運勢は良好です'}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">恋愛運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.love}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">仕事運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.career}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">金運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.finance}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">健康運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.health}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 教育コンテンツ */}
        <div className="educational-content">
          <h3>{educationalContent.level2.title}</h3>
          <div className="content-text">
            {educationalContent.level2.content.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
          <div className="tips-section">
            <h4>💡 豆知識</h4>
            {educationalContent.level2.tips.map((tip, index) => (
              <p key={index}>{tip}</p>
            ))}
          </div>
          <div className="practical-use">
            <h4>📝 実生活での活用方法</h4>
            {educationalContent.level2.practicalUse.map((use, index) => (
              <p key={index}>{use}</p>
            ))}
          </div>
        </div>

        {/* 次のレベル予告 */}
        <div className="next-level-preview">
          <h4>🔮 次のレベルで分かること</h4>
          <p>{educationalContent.level2.nextLevel}</p>
        </div>
      </div>
    );
  };

  // レベル3の表示
  const renderLevel3 = () => {
    if (!horoscopeData?.planets) return null;

    return (
      <div className="level-3">
        <div className="all-planets-grid">
          {horoscopeData.planets.map((planet, index) => (
            <div key={index} className="detailed-planet-card">
              <div className="planet-header">
                <div className="planet-icon">{planetDescriptions[planet.planet]?.icon}</div>
                <div className="planet-info">
                  <h4>{planet.planet}</h4>
                  <p className="planet-meaning">{planetDescriptions[planet.planet]?.meaning}</p>
                </div>
              </div>
              
              <div className="sign-house-info">
                <div className="sign-info">
                  <span className="sign-icon">{zodiacInfo[planet.sign]?.icon}</span>
                  <span className="sign-name">{planet.sign}</span>
                </div>
                <div className="house-info">
                  <span className="house-label">第{planet.house}ハウス</span>
                  {planet.retrograde && <span className="retrograde">℞</span>}
                </div>
              </div>
              
              <div className="planet-description">
                <p>{planetDescriptions[planet.planet]?.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 期間選択運勢（全期間対応） */}
        <div className="period-fortune-section">
          <h3>🔮 期間選択運勢（全期間対応）</h3>
          <div className="period-selector">
            {periodOptions.level3.map((option) => (
              <button
                key={option.value}
                className={`period-button ${selectedPeriod === option.value ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button 
            className="generate-prediction-button"
            onClick={handleGeneratePrediction}
            disabled={isPredicting}
          >
            {isPredicting ? '生成中...' : '運勢を見る'}
          </button>
          
          {futurePrediction && (
            <div className="prediction-result">
              <h4>🌟 {periodOptions.level3.find(opt => opt.value === selectedPeriod)?.label}の運勢</h4>
              <p>{futurePrediction.overallMessage}</p>
              <div className="prediction-details">
                <div className="prediction-item">
                  <span className="prediction-label">全体運:</span>
                  <span className="prediction-text">{futurePrediction.shortTermAdvice || '総合的な運勢は良好です'}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">恋愛運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.love}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">仕事運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.career}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">金運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.finance}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">健康運:</span>
                  <span className="prediction-text">{futurePrediction.predictions.health}</span>
                </div>
              </div>
              {futurePrediction.keyDates && futurePrediction.keyDates.length > 0 && (
                <div className="important-dates">
                  <h5>🗓️ 重要な日付</h5>
                  <ul>
                    {futurePrediction.keyDates.map((dateItem, index) => (
                      <li key={index}>{dateItem.date}: {dateItem.event}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 教育コンテンツ */}
        <div className="educational-content">
          <h3>{educationalContent.level3.title}</h3>
          <div className="content-text">
            {educationalContent.level3.content.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
          <div className="tips-section">
            <h4>💡 豆知識</h4>
            {educationalContent.level3.tips.map((tip, index) => (
              <p key={index}>{tip}</p>
            ))}
          </div>
          <div className="practical-use">
            <h4>📝 実生活での活用方法</h4>
            {educationalContent.level3.practicalUse.map((use, index) => (
              <p key={index}>{use}</p>
            ))}
          </div>
          <div className="advanced-content">
            <h4>{educationalContent.level3.advanced.title}</h4>
            <div className="advanced-text">
              {educationalContent.level3.advanced.content.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="step-result-container">
      {/* プログレス表示 */}
      <div className="progress-header">
        <div className="progress-steps">
          <div className={`step ${currentLevel >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">基本占い</div>
          </div>
          <div className={`step ${currentLevel >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">内面分析</div>
          </div>
          <div className={`step ${currentLevel >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">完全分析</div>
          </div>
        </div>
      </div>

      {/* レベル別結果表示 */}
      {renderLevelResult()}

      {/* レベルアップボタン */}
      {currentLevel < 3 && (
        <div className="level-up-section">
          <button 
            className="level-up-button"
            onClick={handleLevelUp}
          >
            {currentLevel === 1 ? 'もっと詳しく 🔮' : 'さらに詳しく 🌌'}
          </button>
          <p className="level-up-description">
            {currentLevel === 1 
              ? '太陽・月・上昇星座の組み合わせを見る'
              : '全10天体の完全分析を見る'
            }
          </p>
        </div>
      )}

      {/* アクションボタン */}
      <div className="level-up-section">
        <button 
          onClick={() => navigate('/ai-fortune')}
          className="level-up-button"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', marginBottom: '1rem' }}
        >
          🤖 AI占い師に相談する
        </button>
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          新しい占いを始める
        </button>
      </div>
    </div>
  );
};

export default StepByStepResult; 