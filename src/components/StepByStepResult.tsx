import React, { useState, useEffect, useMemo } from 'react';
import { BirthData, HoroscopeData, PlanetPosition } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import { generateAIAnalysis, AIAnalysisResult, generateFuturePrediction, FuturePrediction, FutureTimeframe, chatWithAIAstrologer } from '../utils/aiAnalyzer';
import { useNavigate } from 'react-router-dom';
import './StepByStepResult.css';

// 表示レベルの定義
type DisplayLevel = 1 | 2 | 3;

// 期間選択のタイプ
type PeriodSelection = 'today' | 'thisWeek' | 'thisMonth' | 'tomorrow' | 'nextWeek' | 'nextMonth' | 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'twoYears' | 'threeYears' | 'fourYears' | 'fiveYears';

// 分析データの型定義
interface PersonalityAnalysis {
  threeSignAnalysis?: {
    combinedAnalysis: {
      overview: string;
      basicPersonality: string;
      innerEmotions: string;
      firstImpression: string;
      personalityBalance: string;
      relationshipAdvice: string;
    };
    sunElement: string;
    moonElement: string;
    risingElement: string;
    balanceType: string;
  };
  fourSectionAnalysis?: {
    basicPersonality: string;
    loveAndAction: string;
    workAndGrowth: string;
    deepPsyche: string;
  };
}

interface StepByStepResultProps {
  mode?: 'simple' | 'detailed';
  selectedMode?: 'sun-sign' | 'three-planets' | 'ten-planets';
}

const StepByStepResult: React.FC<StepByStepResultProps> = ({ mode = 'detailed', selectedMode }) => {
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
  const [level1Fortune, setLevel1Fortune] = useState<string | null>(null);
  const [isGeneratingLevel1, setIsGeneratingLevel1] = useState(false);
  const [level2Fortune, setLevel2Fortune] = useState<string | null>(null);
  const [isGeneratingLevel2, setIsGeneratingLevel2] = useState(false);
  const [level3Fortune, setLevel3Fortune] = useState<string | null>(null);
  const [isGeneratingLevel3, setIsGeneratingLevel3] = useState(false);
  
  // 新しい状態: 天体分析関連
  const [personalityAnalysis, setPersonalityAnalysis] = useState<PersonalityAnalysis | null>(null);
  const [isGeneratingPersonalityAnalysis, setIsGeneratingPersonalityAnalysis] = useState(false);

  const navigate = useNavigate();

  // ローカルDBの管理
  const getStorageKey = (type: 'three-signs' | 'four-sections') => {
    if (!birthData) return null;
    const key = `${birthData.name}-${birthData.birthDate}-${birthData.birthTime}-${birthData.birthPlace}`;
    // 日本語対応のためencodeURIComponentを使用
    return `personality-analysis-${type}-${encodeURIComponent(key)}`;
  };

  const savePersonalityAnalysis = (analysis: PersonalityAnalysis) => {
    if (!birthData) return;
    
    if (analysis.threeSignAnalysis) {
      const key = getStorageKey('three-signs');
      if (key) {
        localStorage.setItem(key, JSON.stringify(analysis.threeSignAnalysis));
      }
    }
    
    if (analysis.fourSectionAnalysis) {
      const key = getStorageKey('four-sections');
      if (key) {
        localStorage.setItem(key, JSON.stringify(analysis.fourSectionAnalysis));
      }
    }
  };

  const loadPersonalityAnalysis = (): PersonalityAnalysis | null => {
    if (!birthData) return null;
    
    const threeSignKey = getStorageKey('three-signs');
    const fourSectionKey = getStorageKey('four-sections');
    
    let threeSignAnalysis = null;
    let fourSectionAnalysis = null;
    
    if (threeSignKey) {
      const stored = localStorage.getItem(threeSignKey);
      if (stored) {
        try {
          threeSignAnalysis = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing three-sign analysis:', e);
        }
      }
    }
    
    if (fourSectionKey) {
      const stored = localStorage.getItem(fourSectionKey);
      if (stored) {
        try {
          fourSectionAnalysis = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing four-section analysis:', e);
        }
      }
    }
    
    if (threeSignAnalysis || fourSectionAnalysis) {
      return { threeSignAnalysis, fourSectionAnalysis };
    }
    
    return null;
  };

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

  // 【】セクションタイトルを強調表示する関数
  const formatSectionTitles = (text: string) => {
    // 【】で囲まれた部分を検出してspanでラップ
    const parts = text.split(/(\【[^】]+】)/g);
    
    return parts.map((part, index) => {
      if (part.match(/^【[^】]+】$/)) {
        // 【】で囲まれた部分
        return (
          <span key={index} className="section-highlight">
            {part}
          </span>
        );
      } else {
        // 通常のテキスト部分
        return part;
      }
    });
  };

  // 文字列版のフォーマット関数（表示用）
  const formatSectionTitlesForDisplay = (text: string) => {
    return (
      <span dangerouslySetInnerHTML={{
        __html: text
          .replace(/【([^】]+)】/g, '<strong class="section-highlight">【$1】</strong>')
          .replace(/\n/g, '<br/>')
      }} />
    );
  };

  // 期間選択のオプション
  const periodOptions = {
    level1: [
      { value: 'today' as PeriodSelection, label: '今日', timeframe: '今日' as FutureTimeframe },
      { value: 'tomorrow' as PeriodSelection, label: '明日', timeframe: '明日' as FutureTimeframe },
      { value: 'thisWeek' as PeriodSelection, label: '今週', timeframe: '今週' as FutureTimeframe }
    ],
    level2: [
      { value: 'today' as PeriodSelection, label: '今日', timeframe: '今日' as FutureTimeframe },
      { value: 'tomorrow' as PeriodSelection, label: '明日', timeframe: '明日' as FutureTimeframe },
      { value: 'thisWeek' as PeriodSelection, label: '今週', timeframe: '今週' as FutureTimeframe },
      { value: 'nextWeek' as PeriodSelection, label: '来週', timeframe: '来週' as FutureTimeframe },
      { value: 'thisMonth' as PeriodSelection, label: '今月', timeframe: '今月' as FutureTimeframe },
      { value: 'nextMonth' as PeriodSelection, label: '来月', timeframe: '来月' as FutureTimeframe }
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
      { value: 'oneYear' as PeriodSelection, label: '1年', timeframe: '1年' as FutureTimeframe },
      { value: 'twoYears' as PeriodSelection, label: '2年', timeframe: '2年' as FutureTimeframe },
      { value: 'threeYears' as PeriodSelection, label: '3年', timeframe: '3年' as FutureTimeframe },
      { value: 'fourYears' as PeriodSelection, label: '4年', timeframe: '4年' as FutureTimeframe },
      { value: 'fiveYears' as PeriodSelection, label: '5年', timeframe: '5年' as FutureTimeframe }
    ]
  };

  // 詳細な次レベル説明
  const nextLevelDescriptions = {
    level1: {
      title: "「本格占い」で解き明かされるあなたの「内面」と「第一印象」",
      description: "太陽星座だけでは分からない、あなたの隠れた一面を発見できます。月星座で「本当の感情や無意識の行動パターン」、上昇星座で「人があなたに抱く第一印象や外見的特徴」が分かります。この3つの組み合わせで、なぜ同じ星座でも人によって性格が違うのかが明確になります。",
      benefits: [
        { icon: "🌙", text: "月星座：本当の感情・プライベートな自分", detail: "家族や恋人の前での本当のあなた" },
        { icon: "🌅", text: "上昇星座：第一印象・見た目の特徴", detail: "初対面の人があなたに感じる印象" },
        { icon: "🎯", text: "3つの組み合わせによる詳細な性格分析", detail: "太陽・月・上昇の複合的な性格診断" }
      ]
    },
    level2: {
      title: "10天体の完全占いとは",
      description: "10天体すべての配置から、あなたの人生の全体像が明らかになります。恋愛運（金星）、行動パターン（火星）、コミュニケーション（水星）、成長の方向性（木星）、人生の課題（土星）など、人生のあらゆる側面を網羅的に分析。さらに長期運勢（1年間）も詳細に予測できます。",
      benefits: [
        { icon: "💕", text: "金星・火星：恋愛・行動パターンの詳細分析", detail: "どんな人を好きになりやすいか、どう行動するか" },
        { icon: "💼", text: "水星・木星・土星：仕事・成長・責任の傾向", detail: "向いている職業、成長の方向性、人生の課題" },
        { icon: "🌌", text: "外惑星：深層心理・世代的特徴・変革の力", detail: "無意識の行動パターンと人生の大きな変化" }
      ]
    }
  };

  // AI分析を生成する関数（データを直接渡す）
  const generateAIPersonalityAnalysisWithData = async (
    analysisType: 'three-signs' | 'four-sections', 
    targetBirthData: BirthData, 
    targetHoroscopeData: HoroscopeData
  ) => {
    console.log('🔍 generateAIPersonalityAnalysisWithData開始:', analysisType);
    console.log('🔍 targetHoroscopeData:', targetHoroscopeData);
    console.log('🔍 targetBirthData:', targetBirthData);
    
    if (!targetHoroscopeData?.planets || !targetBirthData) {
      console.log('❌ 必要なデータが不足しています');
      return null;
    }

    try {
      if (analysisType === 'three-signs') {
        console.log('🔍 3天体分析を実行中...');
        const sunPlanet = targetHoroscopeData.planets.find(p => p.planet === '太陽');
        const moonPlanet = targetHoroscopeData.planets.find(p => p.planet === '月');
        const risingPlanet = targetHoroscopeData.planets.find(p => p.planet === '上昇星座') || 
                           (targetHoroscopeData.houses && targetHoroscopeData.houses[0] ? {
                             planet: '上昇星座',
                             sign: targetHoroscopeData.houses[0].sign,
                             house: 1,
                             degree: targetHoroscopeData.houses[0].degree,
                             retrograde: false
                           } : null);

        console.log('🔍 天体データ:', { sunPlanet, moonPlanet, risingPlanet });

        if (!sunPlanet || !moonPlanet || !risingPlanet) {
          console.log('❌ 必要な天体データが不足しています');
          return null;
        }

        const prompt = `【重要指示】以下の3天体の情報を基に、6つのセクションすべてを必ず作成してください。途中で終わらず、最後まで完成させてください。

【出生情報】
名前: ${targetBirthData.name}
生年月日: ${targetBirthData.birthDate}
出生時刻: ${targetBirthData.birthTime}
出生地: ${targetBirthData.birthPlace}

【天体情報】
太陽: ${sunPlanet.sign} ${sunPlanet.degree}度
月: ${moonPlanet.sign} ${moonPlanet.degree}度
上昇星座: ${risingPlanet.sign} ${risingPlanet.degree}度

【分析指示】
以下の6つのセクションを【タイトル】形式で必ずすべて作成してください。各セクションは150-200文字で、よいところと注意すべきところも含めて分析してください。

1. 【全体的な概要】
太陽${sunPlanet.sign}・月${moonPlanet.sign}・上昇${risingPlanet.sign}の組み合わせから見える全体像を、よいところと注意すべきところも含めて150-200文字で説明してください。

2. 【基本性格】
太陽${sunPlanet.sign}から見える核となる性格を、よいところと注意すべきところも含めて150-200文字で説明してください。

3. 【内面・感情】
月${moonPlanet.sign}から見える内面的な特徴を、よいところと注意すべきところも含めて150-200文字で説明してください。

4. 【第一印象・外見】
上昇${risingPlanet.sign}から見える外見的な特徴を、よいところと注意すべきところも含めて150-200文字で説明してください。

5. 【性格のバランス】
3つの星座の相互作用と調和を、よいところと注意すべきところも含めて150-200文字で説明してください。

6. 【人間関係のアドバイス】
対人関係での活かし方を、よいところと注意すべきところも含めて150-200文字で説明してください。

【厳守事項】
- 必ず6つのセクションすべてを作成してください
- 各セクションは【タイトル】で始めてください
- 各セクションは150-200文字で詳しく説明してください
- 必ずですます調で統一してください
- 途中で終わらず最後まで完成させてください
- よいところと注意すべきところを必ず含めてください`;

        console.log('🔍 3天体AI分析プロンプト:', prompt.substring(0, 200) + '...');
        const analysisResult = await chatWithAIAstrologer(prompt, targetBirthData, targetHoroscopeData.planets, [], "general");
        console.log('🔍 3天体AI分析レスポンス長さ:', analysisResult.length);
        console.log('🔍 3天体AI分析レスポンス全文:');
        console.log('================================');
        console.log(analysisResult);
        console.log('================================');
        
        // AIの回答を構造化（【】形式のタイトルで分割）
        console.log('🔍 3天体AI分析レスポンス全文:', analysisResult);
        const sections = {
          overview: '',
          basicPersonality: '',
          innerEmotions: '',
          firstImpression: '',
          personalityBalance: '',
          relationshipAdvice: ''
        };

        // 【】形式のセクションを抽出（より柔軟な正規表現）
        const sectionPatterns = {
          overview: [
            /【全体的?な?概要】([\s\S]*?)(?=【|$)/,
            /【概要】([\s\S]*?)(?=【|$)/,
            /【全体像】([\s\S]*?)(?=【|$)/
          ],
          basicPersonality: [
            /【基本性格】([\s\S]*?)(?=【|$)/,
            /【基本的?な?性格】([\s\S]*?)(?=【|$)/
          ],
          innerEmotions: [
            /【内面[・・]感情】([\s\S]*?)(?=【|$)/,
            /【内面】([\s\S]*?)(?=【|$)/,
            /【感情】([\s\S]*?)(?=【|$)/
          ],
          firstImpression: [
            /【第一印象[・・]外見】([\s\S]*?)(?=【|$)/,
            /【第一印象】([\s\S]*?)(?=【|$)/,
            /【外見】([\s\S]*?)(?=【|$)/
          ],
          personalityBalance: [
            /【性格の?バランス】([\s\S]*?)(?=【|$)/,
            /【バランス】([\s\S]*?)(?=【|$)/,
            /【調和】([\s\S]*?)(?=【|$)/
          ],
          relationshipAdvice: [
            /【人間関係の?アドバイス】([\s\S]*?)(?=【|$)/,
            /【人間関係】([\s\S]*?)(?=【|$)/,
            /【アドバイス】([\s\S]*?)(?=【|$)/
          ]
        };

        console.log('🔍 セクション抽出開始...');
        
        // 各セクションをパターンマッチングで抽出
        Object.keys(sectionPatterns).forEach(key => {
          const patterns = sectionPatterns[key as keyof typeof sectionPatterns];
          let matched = false;
          
          for (const pattern of patterns) {
            const match = analysisResult.match(pattern);
            if (match && match[1]) {
              const content = match[1].trim().replace(/^\n+|\n+$/g, '');
              sections[key as keyof typeof sections] = content;
              console.log(`✅ ${key}セクション抽出成功 (パターン: ${pattern.source}):`, content.substring(0, 150) + '...');
              console.log(`📏 ${key}セクション文字数: ${content.length}`);
              matched = true;
              break;
            }
          }
          
          if (!matched) {
            console.log(`❌ ${key}セクション: すべてのパターンでマッチしませんでした`);
            // デバッグ用：該当キーワードが含まれているかチェック
            const keywordChecks = {
              overview: ['概要', '全体'],
              basicPersonality: ['基本性格', '基本'],
              innerEmotions: ['内面', '感情'],
              firstImpression: ['第一印象', '外見'],
              personalityBalance: ['バランス', '調和'],
              relationshipAdvice: ['人間関係', 'アドバイス']
            };
            
            const keywords = keywordChecks[key as keyof typeof keywordChecks];
            const hasKeywords = keywords.some(keyword => analysisResult.includes(keyword));
            console.log(`🔍 ${key}関連キーワード (${keywords.join(', ')}) 存在チェック: ${hasKeywords}`);
          }
        });
        
        console.log('🔍 最終的なセクション内容:', sections);

        return {
          threeSignAnalysis: {
            combinedAnalysis: {
              overview: sections.overview.trim() || `あなたは${sunPlanet.sign}の太陽、${moonPlanet.sign}の月、${risingPlanet.sign}の上昇星座という組み合わせを持っています。`,
              basicPersonality: sections.basicPersonality.trim() || `太陽が${sunPlanet.sign}にあることで、積極的で行動力のある性格を持っています。`,
              innerEmotions: sections.innerEmotions.trim() || `月が${moonPlanet.sign}にあることで、内面的には感情豊かで直感的な面があります。`,
              firstImpression: sections.firstImpression.trim() || `上昇星座が${risingPlanet.sign}なので、第一印象では魅力的で親しみやすい雰囲気を与えます。`,
              personalityBalance: sections.personalityBalance.trim() || '3つの星座が調和することで、バランスの取れた魅力的な性格を形成しています。',
              relationshipAdvice: sections.relationshipAdvice.trim() || '相手の気持ちを理解し、自分らしさを大切にしながら関係を築くことが大切です。'
            },
            sunElement: zodiacInfo[sunPlanet.sign]?.element || '不明',
            moonElement: zodiacInfo[moonPlanet.sign]?.element || '不明',
            risingElement: zodiacInfo[risingPlanet.sign]?.element || '不明',
            balanceType: sunPlanet.sign === moonPlanet.sign ? "一致型" : "複合型"
          }
        };

      } else if (analysisType === 'four-sections') {
        const relevantPlanets = targetHoroscopeData.planets.filter(p => 
          ['太陽', '月', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'].includes(p.planet)
        );

        const planetList = relevantPlanets.map(p => `${p.planet}: ${p.sign} ${p.degree}度`).join('\n');

        const prompt = `以下の10天体の情報を基に、4つの観点から詳細で深い性格分析を行ってください。各項目は【タイトル】形式で始めて、ですます調で200-250文字程度で説明してください。必ずよいところと注意すべきところも含めて分析してください。

【出生情報】
名前: ${targetBirthData.name}
生年月日: ${targetBirthData.birthDate}
出生時刻: ${targetBirthData.birthTime}
出生地: ${targetBirthData.birthPlace}

【天体情報】
${planetList}

以下の4つの観点から詳細に分析してください：

【基本性格分析】
太陽・月の配置から見える核となる性格と内面的な特徴を200-250文字で、よいところと注意すべきところも含めて説明してください。

【恋愛・行動分析】
金星・火星の配置から見える恋愛傾向と行動パターンを200-250文字で、よいところと注意すべきところも含めて説明してください。

【仕事・成長分析】
水星・木星・土星の配置から見えるコミュニケーション、成長、責任感を200-250文字で、よいところと注意すべきところも含めて説明してください。

【深層心理分析】
天王星・海王星・冥王星の配置から見える潜在的な可能性と変革力を200-250文字で、よいところと注意すべきところも含めて説明してください。

各項目は【タイトル】で始めて、具体的で実用的な内容にし、占星術的な洞察を含めながらも分かりやすく説明してください。必ずですます調で統一してください。`;

        console.log('🔍 10天体AI分析プロンプト:', prompt.substring(0, 200) + '...');
        const analysisResult = await chatWithAIAstrologer(prompt, targetBirthData, targetHoroscopeData.planets, [], "general");
        console.log('🔍 10天体AI分析レスポンス:', analysisResult);
        
        // AIの回答を構造化（【】形式のタイトルで分割）
        console.log('🔍 10天体AI分析レスポンス全文:', analysisResult);
        const sections = {
          basicPersonality: '',
          loveAndAction: '',
          workAndGrowth: '',
          deepPsyche: ''
        };

        // 【】形式のセクションを抽出
        const sectionMatches = {
          basicPersonality: analysisResult.match(/【基本性格分析】([\s\S]*?)(?=【|$)/),
          loveAndAction: analysisResult.match(/【恋愛[・・]行動分析】([\s\S]*?)(?=【|$)/),
          workAndGrowth: analysisResult.match(/【仕事[・・]成長分析】([\s\S]*?)(?=【|$)/),
          deepPsyche: analysisResult.match(/【深層心理分析】([\s\S]*?)(?=【|$)/)
        };

        // マッチした内容を格納
        Object.keys(sectionMatches).forEach(key => {
          const match = sectionMatches[key as keyof typeof sectionMatches];
          if (match && match[1]) {
            const content = match[1].trim().replace(/^\n+|\n+$/g, '');
            sections[key as keyof typeof sections] = content;
            console.log(`🔍 ${key}セクション抽出:`, content.substring(0, 100) + '...');
          } else {
            console.log(`🔍 ${key}セクション: マッチしませんでした`);
          }
        });

        return {
          fourSectionAnalysis: {
            basicPersonality: sections.basicPersonality.trim() || '太陽と月の組み合わせから、バランスの取れた性格を持っています。',
            loveAndAction: sections.loveAndAction.trim() || '金星と火星の影響で、魅力的で行動力のある恋愛スタイルを持っています。',
            workAndGrowth: sections.workAndGrowth.trim() || '水星、木星、土星の配置により、コミュニケーション能力と成長意欲に優れています。',
            deepPsyche: sections.deepPsyche.trim() || '外惑星の影響により、深い洞察力と変革への意欲を持っています。'
          }
        };
      }

    } catch (error) {
      console.error('❌ AI分析生成エラー:', error);
      console.error('❌ エラーの詳細:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ スタックトレース:', error instanceof Error ? error.stack : 'No stack trace');
      return null;
    }

    console.log('❌ 予期しない終了: analysisTypeが認識されませんでした');
    return null;
  };

  // この関数は使用されなくなったため削除
  // 実際の分析は初期化処理内で直接実行されています

  // 初期化処理（重複実行を防ぐためのフラグ）
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // 既に初期化済みの場合はスキップ
    if (isInitialized) {
      console.log('🔍 既に初期化済みのためスキップします');
      return;
    }
    
    const initializeData = async () => {
      try {
        console.log('🔍 StepByStepResult初期化開始 - mode:', mode, 'selectedMode:', selectedMode);
        setIsInitialized(true);
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

        // 保存された天体分析をチェック
        const savedAnalysis = loadPersonalityAnalysis();
        if (savedAnalysis) {
          console.log('🔍 保存された天体分析を読み込み:', savedAnalysis);
          setPersonalityAnalysis(savedAnalysis);
        } else {
          console.log('🔍 保存された天体分析はありません');
        }

        // 選択されたモードに応じて適切なレベルを設定
        let targetLevel: DisplayLevel = 1;
        if (selectedMode === 'three-planets') {
          targetLevel = 2;
        } else if (selectedMode === 'ten-planets') {
          targetLevel = 3;
        } else if (mode === 'detailed' && !selectedMode) {
          // フォールバック: 詳細モードで選択モード不明の場合
          targetLevel = 2;
        }
        
        console.log(`🔍 選択モード: ${selectedMode}, 最終モード: ${mode}, 設定レベル: ${targetLevel}`);
        setCurrentLevel(targetLevel);

        // 天体分析の初期化（レベル2以上の場合のみ）
        if (!savedAnalysis && (targetLevel === 2 || targetLevel === 3)) {
          console.log('🔍 天体分析を開始します...');
          setIsGeneratingPersonalityAnalysis(true);
          setTimeout(async () => {
            try {
              if (targetLevel === 2) {
                setCurrentStep('3天体の性格分析を生成中...');
                                 // 一時的にhoroscopeDataとbirthDataを設定
                 const originalHoroscope = horoscopeData;
                 const originalBirth = birthData;
                 setHoroscopeData(horoscope);
                 setBirthData(data);
                 
                 const threeSignAnalysis = await generateAIPersonalityAnalysisWithData('three-signs', data, horoscope);
                 if (threeSignAnalysis) {
                   setPersonalityAnalysis(threeSignAnalysis);
                   savePersonalityAnalysis(threeSignAnalysis);
                 }
               } else if (targetLevel === 3) {
                 setCurrentStep('10天体の性格分析を生成中...');
                 
                 // 一時的にhoroscopeDataとbirthDataを設定
                 const originalHoroscope = horoscopeData;
                 const originalBirth = birthData;
                 setHoroscopeData(horoscope);
                 setBirthData(data);
                 
                 const fourSectionAnalysis = await generateAIPersonalityAnalysisWithData('four-sections', data, horoscope);
                if (fourSectionAnalysis) {
                  setPersonalityAnalysis(fourSectionAnalysis);
                  savePersonalityAnalysis(fourSectionAnalysis);
                }
              }
              setCurrentStep('分析完了');
            } catch (error) {
              console.error('天体分析エラー:', error);
              setCurrentStep('分析エラー');
            } finally {
              setIsGeneratingPersonalityAnalysis(false);
            }
          }, 100);
        }

        // AI分析を一時的に無効化（基本的な占星術データのみ表示）
        setCurrentStep('基本データの準備完了');
        setIsAnalyzing(false);
        setLoading(false);
        
        // 全てのモードで「占う」ボタンを押した時のみAI分析を実行
        // 10天体の完全占いの場合のみ自動でAI分析を実行
        if (mode === 'detailed' && selectedMode === 'ten-planets') {
          // 10天体の完全占いのみ自動AI分析
          setTimeout(async () => {
            try {
              const analysisMessage = 'AI詳細占星術分析を実行中...';
              setCurrentStep(analysisMessage);
              setIsAnalyzing(true);
              console.log('🔍 10天体完全占いのAI分析を開始します...');
              
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
        } else {
          // 簡単占いと3天体占いは占うボタンを押すまで待機
          const modeMessage = mode === 'simple' ? '簡単占い' : '3天体の本格占い';
          setCurrentStep(`${modeMessage}の準備完了 - 「占う」ボタンを押してください`);
          console.log(`🔍 ${modeMessage}モード：ユーザーが占うボタンを押すまで待機します`);
        }
        

        
        // レベル設定後に画面トップにスクロール
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          console.log('🔍 画面トップにスクロールしました');
        }, 100);
        
      } catch (error) {
        console.error('初期化エラー:', error);
        setError(error instanceof Error ? error.message : '予期しないエラーが発生しました。');
        setLoading(false);
      }
    };

    initializeData();
  }, []); // 初回マウント時のみ実行（重複実行を防ぐ）

  // レベルアップ処理
  const handleLevelUp = () => {
    if (currentLevel < 3) {
      // Level 1 から Level 2 への遷移時、出生時刻と出生地の情報をチェック
      if (currentLevel === 1) {
        // 出生時刻と出生地の情報が不足している場合は入力フォームに戻す
        const needsMoreInfo = !birthData?.birthTime || 
                             birthData.birthTime === '12:00' || 
                             !birthData?.birthPlace || 
                             birthData.birthPlace.city === '東京' ||
                             birthData.birthPlace.latitude === 35.6762;
        
        if (needsMoreInfo) {
          if (window.confirm('3天体の本格占いには出生時刻と出生地の情報が必要です。\n追加で入力しますか？')) {
            // 3天体モードでの入力が必要であることを記録
            localStorage.setItem('starflect_need_three_planets_input', 'true');
            console.log('🔍 フラグを設定しました:', localStorage.getItem('starflect_need_three_planets_input'));
            // ホームに戻る
            navigate('/');
          }
          return;
        }
      }
      
      const newLevel = (currentLevel + 1) as DisplayLevel;
      setCurrentLevel(newLevel);
      
      // レベルアップ時に必要なAI分析を実行
      if (newLevel === 2 && !personalityAnalysis?.threeSignAnalysis) {
        console.log('🔍 レベルアップでLevel 2に移行 - 3天体分析を実行');
        if (birthData && horoscopeData) {
          setIsGeneratingPersonalityAnalysis(true);
          setTimeout(async () => {
            try {
              const threeSignAnalysis = await generateAIPersonalityAnalysisWithData('three-signs', birthData, horoscopeData);
              if (threeSignAnalysis) {
                setPersonalityAnalysis(threeSignAnalysis);
                savePersonalityAnalysis(threeSignAnalysis);
                console.log('🔍 レベルアップでの3天体分析が完了');
              }
            } catch (error) {
              console.error('レベルアップでの3天体分析エラー:', error);
            } finally {
              setIsGeneratingPersonalityAnalysis(false);
            }
          }, 100);
        }
      } else if (newLevel === 3 && !personalityAnalysis?.fourSectionAnalysis) {
        console.log('🔍 レベルアップでLevel 3に移行 - 10天体分析を実行');
        if (birthData && horoscopeData) {
          setIsGeneratingPersonalityAnalysis(true);
          setTimeout(async () => {
            try {
              const fourSectionAnalysis = await generateAIPersonalityAnalysisWithData('four-sections', birthData, horoscopeData);
              if (fourSectionAnalysis) {
                setPersonalityAnalysis(fourSectionAnalysis);
                savePersonalityAnalysis(fourSectionAnalysis);
                console.log('🔍 レベルアップでの10天体分析が完了');
              }
            } catch (error) {
              console.error('レベルアップでの10天体分析エラー:', error);
            } finally {
              setIsGeneratingPersonalityAnalysis(false);
            }
          }, 100);
        }
      }
      
      // レベルアップ後、画面トップにスクロール
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100); // レンダリング完了を待ってからスクロール
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

  // レベル1占い生成（AI分析結果を再利用）
  const handleGenerateLevel1Fortune = async () => {
    if (!sunSign || !birthData) return;
    
    setIsGeneratingLevel1(true);
    try {
      console.log('🔍 レベル1占い - 「占う」ボタン押下でAI分析を実行します');
      
      // AI分析を実行（プルダウンをパラメータとして使用）
      const aiResult = await generateAIAnalysis(
        birthData,
        horoscopeData?.planets || [],
        'simple'
      );
      
      if (aiResult && aiResult.todaysFortune) {
        const todaysFortune = aiResult.todaysFortune;
        // AI分析結果をそのまま表示（要約・編集禁止）
        const fortuneText = `
【全体運】
${todaysFortune.overallLuck}

【恋愛運】
${todaysFortune.loveLuck}

【仕事運】
${todaysFortune.workLuck}

【健康運】
${todaysFortune.healthLuck}

【金銭運】
${todaysFortune.moneyLuck}

【今日のアドバイス】
${todaysFortune.todaysAdvice}
        `.trim();
        setLevel1Fortune(fortuneText);
      } else {
        // AI分析結果がない場合は未来予測を使用
        const timeframeMap: Record<PeriodSelection, '今日' | '明日' | '今週' | '来週' | '今月' | '来月' | '1ヶ月' | '3ヶ月' | '6ヶ月' | '1年'> = {
          'today': '今日',
          'tomorrow': '明日',
          'thisWeek': '今週',
          'nextWeek': '来週',
          'thisMonth': '今月',
          'nextMonth': '来月',
          'oneMonth': '1ヶ月',
          'threeMonths': '3ヶ月',
          'sixMonths': '6ヶ月',
          'oneYear': '1年',
          'twoYears': '1年',
          'threeYears': '1年',
          'fourYears': '1年',
          'fiveYears': '1年'
        };
        
        const timeframe = timeframeMap[selectedPeriod] || '今日';
        
        const basicPlanets: PlanetPosition[] = [{
          planet: '太陽',
          sign: sunSign,
          degree: 15,
          house: 1,
          retrograde: false
        }];
        
        const prediction = await generateFuturePrediction(birthData, basicPlanets, timeframe);
        
        const fortuneText = `
【全体運】
${prediction.overallMessage}

【恋愛運】
${prediction.predictions.love}

【仕事運】
${prediction.predictions.career}

【健康運】
${prediction.predictions.health}

【金銭運】
${prediction.predictions.finance}

【AI占い】
${prediction.predictions.spiritual}
        `.trim();
        
        setLevel1Fortune(fortuneText);
      }
    } catch (error) {
      console.error('🚨 レベル1占い生成エラー:', error);
      // エラーの場合でも簡単なメッセージを表示
      setLevel1Fortune('申し訳ございません。AI占い分析中にエラーが発生しました。しばらくお待ちいただいてから再度お試しください。');
    } finally {
      setIsGeneratingLevel1(false);
    }
  };

  // レベル2占い生成（「占う」ボタン押下でAI実行）
  const handleGenerateLevel2Fortune = async () => {
    if (!sunSign || !birthData) return;
    
    setIsGeneratingLevel2(true);
    try {
      console.log('🔍 レベル2占い - 「占う」ボタン押下でAI分析を実行します');
      
      // AIによる運勢分析を実行（プルダウンをパラメータとして使用）
      const timeframeMap: Record<PeriodSelection, '今日' | '明日' | '今週' | '来週' | '今月' | '来月' | '1ヶ月' | '3ヶ月' | '6ヶ月' | '1年'> = {
        'today': '今日',
        'tomorrow': '明日',
        'thisWeek': '今週',
        'nextWeek': '来週',
        'thisMonth': '今月',
        'nextMonth': '来月',
        'oneMonth': '1ヶ月',
        'threeMonths': '3ヶ月',
        'sixMonths': '6ヶ月',
        'oneYear': '1年',
        'twoYears': '1年',
        'threeYears': '1年',
        'fourYears': '1年',
        'fiveYears': '1年'
      };
      
      const timeframe = timeframeMap[selectedPeriod] || '今日';
      
      // 基本的な惑星データを作成（太陽星座ベース）
      const basicPlanets: PlanetPosition[] = [{
        planet: '太陽',
        sign: sunSign,
        degree: 15, // 仮の値
        house: 1,
        retrograde: false
      }];
      
      const prediction = await generateFuturePrediction(birthData, basicPlanets, timeframe);
      
      // AI生成結果をそのまま表示（編集・要約禁止）
      const fortuneText = `
【全体運】
${prediction.overallMessage}

【恋愛運】
${prediction.predictions.love}

【仕事運】
${prediction.predictions.career}

【健康運】
${prediction.predictions.health}

【金銭運】
${prediction.predictions.finance}

【運勢分析】
${prediction.predictions.spiritual}
      `.trim();
      
      setLevel2Fortune(fortuneText);
    } catch (error) {
      console.error('🚨 レベル2占い生成エラー:', error);
      // エラーの場合でも簡単なメッセージを表示
      setLevel2Fortune('申し訳ございません。占い分析中にエラーが発生しました。しばらくお待ちいただいてから再度お試しください。');
    } finally {
      setIsGeneratingLevel2(false);
    }
  };

  // レベル3占い生成（「占う」ボタン押下でAI実行）
  const handleGenerateLevel3Fortune = async () => {
    if (!sunSign || !birthData) return;
    
    setIsGeneratingLevel3(true);
    try {
      console.log('🔍 レベル3占い - 「占う」ボタン押下でAI分析を実行します');
      
      // AIによる運勢分析を実行（プルダウンをパラメータとして使用）
      const timeframeMap: Record<PeriodSelection, '今日' | '明日' | '今週' | '来週' | '今月' | '来月' | '1ヶ月' | '3ヶ月' | '6ヶ月' | '1年'> = {
        'today': '今日',
        'tomorrow': '明日',
        'thisWeek': '今週',
        'nextWeek': '来週',
        'thisMonth': '今月',
        'nextMonth': '来月',
        'oneMonth': '1ヶ月',
        'threeMonths': '3ヶ月',
        'sixMonths': '6ヶ月',
        'oneYear': '1年',
        'twoYears': '1年',
        'threeYears': '1年',
        'fourYears': '1年',
        'fiveYears': '1年'
      };
      
      const timeframe = timeframeMap[selectedPeriod] || '今日';
      
      // 基本的な惑星データを作成（太陽星座ベース）
      const basicPlanets: PlanetPosition[] = [{
        planet: '太陽',
        sign: sunSign,
        degree: 15, // 仮の値
        house: 1,
        retrograde: false
      }];
      
      const prediction = await generateFuturePrediction(birthData, basicPlanets, timeframe);
      
      // AI生成結果をそのまま表示（編集・要約禁止）
      const fortuneText = `
【全体運】
${prediction.overallMessage}

【恋愛運】
${prediction.predictions.love}

【仕事運】
${prediction.predictions.career}

【健康運】
${prediction.predictions.health}

【金銭運】
${prediction.predictions.finance}

【スピリチュアル運】
${prediction.predictions.spiritual}

【AI専用占い】
このAI分析は、あなたの太陽星座と生年月日から算出された個人専用の運勢です。
      `.trim();
      
      setLevel3Fortune(fortuneText);
    } catch (error) {
      console.error('🚨 レベル3占い生成エラー:', error);
      // エラーの場合でも簡単なメッセージを表示
      setLevel3Fortune('申し訳ございません。占い分析中にエラーが発生しました。しばらくお待ちいただいてから再度お試しください。');
    } finally {
      setIsGeneratingLevel3(false);
    }
  };

  // シンプルなAI分析生成（簡単占い用）
  const generateSimpleAIAnalysis = (sign: string, period: PeriodSelection = 'today') => {
    if (!sign) return null;

    // 星座別の基本的な分析テンプレート
    const signAnalysis: Record<string, { personality: string; today: string; tomorrow: string; thisWeek: string }> = {
      '牡羊座': {
        personality: '牡羊座のあなたは、生まれながらのリーダーです。エネルギッシュで情熱的、何事にも積極的に取り組む姿勢を持っています。新しいことを始めるのが得意で、困難な状況でも前向きに立ち向かう勇気があります。時として性急になりがちですが、その行動力と決断力は多くの人を魅力に感じさせます。',
        today: '今日は新しいスタートに最適な日です。積極的な行動が良い結果を招きます。午後には嬉しいニュースが舞い込む可能性があります。恋愛面では、自分から声をかけることで良い展開が期待できそうです。',
        tomorrow: '明日はクリエイティブなエネルギーが高まります。新しいアイデアが浮かんだら迷わず行動に移しましょう。人間関係では、率直なコミュニケーションが良い結果をもたらします。健康面では、活動的に過ごすことで運気がアップします。',
        thisWeek: '今週は積極的なチャレンジ精神が幸運の鍵となります。前半は仕事や学業で大きな進展があり、後半は人間関係に良い変化が期待できます。週末には特別な出会いや嬉しいサプライズがありそうです。'
      },
      '牡牛座': {
        personality: '牡牛座のあなたは、安定と美を愛する現実主義者です。じっくりと物事を考え、確実に進めていく慎重さがあります。美的センスに優れ、質の良いものを見極める目を持っています。忍耐強く、一度決めたことは最後までやり遂げる粘り強さがあります。',
        today: '今日は落ち着いた一日を過ごせそうです。金銭面で良いニュースがありそう。美しいものに触れると運気がアップします。恋愛では、ゆっくりとした関係の進展が期待できます。健康面では、美味しい食事を楽しむと良いでしょう。',
        tomorrow: '明日は安定感のあるエネルギーに包まれます。計画的な行動が成功につながりそうです。お金に関することで良い知らせがありそう。美容や健康に投資すると、長期的な効果が期待できます。',
        thisWeek: '今週は着実な進歩が期待できる週です。前半は仕事や金銭面で安定した成果が得られ、後半は美的センスが光る場面がありそうです。週末には心地よいリラックスタイムを過ごせるでしょう。'
      },
      '双子座': {
        personality: '双子座のあなたは、知的好奇心旺盛なコミュニケーターです。様々なことに興味を持ち、新しい情報を素早く吸収する能力があります。話術に長け、多くの人との繋がりを築くのが得意です。変化を好み、常に新しい刺激を求める性格です。',
        today: '今日は情報収集に適した日です。新しい人との出会いが幸運をもたらします。SNSやメッセージから良いニュースが届きそう。学習や読書に時間を使うと運気が上昇します。軽快なコミュニケーションが鍵となりそうです。',
        tomorrow: '明日は新しい情報や知識があなたの扉を開くでしょう。多方面にアンテナを張っていると思わぬチャンスが。コミュニケーション能力が活かされる場面があります。',
        thisWeek: '今週は知的な好奇心が満たされる週です。新しい学びや出会いが豊富で、コミュニケーション能力が光る場面が多くあります。情報を活かした決断が良い結果をもたらします。'
      },
      '蟹座': {
        personality: '蟹座のあなたは、深い愛情と保護本能を持つ感受性豊かな人です。家族や親しい人を大切にし、安心できる環境を作ることを重視します。直感力に優れ、人の気持ちを敏感に察知する能力があります。記憶力が良く、過去の経験を大切にします。',
        today: '今日は家族や親しい人との時間を大切にすると良い日です。直感を信じて行動すると良い結果につながります。料理や家事に力を入れると運気アップ。感情的な絆が深まる出来事がありそうです。',
        tomorrow: '明日は感情的な繋がりが深まる日です。家族や友人との時間を大切にしましょう。直感を信じて行動すると良い方向に進みます。',
        thisWeek: '今週は感情的な満足度が高い週です。家族や親しい人との関係が深まり、安心できる環境が整います。直感的な判断が良い結果をもたらします。'
      },
      '獅子座': {
        personality: '獅子座のあなたは、自信に満ちた表現力豊かな人です。創造性に富み、人々の注目を集めることを楽しみます。寛大で温かい心を持ち、周りの人を明るくする力があります。リーダーシップを発揮し、人を導くことに喜びを感じます。',
        today: '今日は自己表現に最適な日です。創造的な活動に取り組むと素晴らしい成果が期待できます。人前に出る機会があれば積極的に参加しましょう。恋愛では、あなたの魅力が輝く日になりそうです。',
        tomorrow: '明日は創造力が最高潮に達します。芸術的な活動や自己表現に力を入れると素晴らしい成果が期待できます。リーダーシップを発揮する機会がありそうです。',
        thisWeek: '今週は自己表現とリーダーシップが光る週です。創造的なプロジェクトで注目を集め、周りの人を明るくする力が発揮されます。恋愛運も上昇中です。'
      },
      '乙女座': {
        personality: '乙女座のあなたは、細やかな配慮と実用性を重視する完璧主義者です。分析力に優れ、物事を論理的に整理する能力があります。他人への奉仕精神が強く、陰で支える役割を好みます。健康や清潔さにも気を配る傾向があります。',
        today: '今日は整理整頓や計画立てに適した日です。細やかな作業が良い成果をもたらします。健康管理に注意を払うと運気が向上。誰かの役に立つ行動が幸運を引き寄せそうです。実用的な買い物をするのにも良い日です。',
        tomorrow: '明日は分析力と実用性が活かされる日です。細かい作業や計画立てに集中すると良い成果が得られます。健康面への配慮も忘れずに。',
        thisWeek: '今週は完璧主義的な性格が良い方向に働く週です。細やかな配慮と実用性が評価され、健康管理にも良い結果が現れます。奉仕的な行動が幸運を招きます。'
      },
      '天秤座': {
        personality: '天秤座のあなたは、調和とバランスを愛する外交的な人です。美的センスに優れ、平和で美しい環境を好みます。人との関係において公平性を重視し、争いを避ける傾向があります。社交的で、多くの人との良好な関係を築くのが得意です。',
        today: '今日は人間関係において良いバランスが取れる日です。美しいものに触れると運気がアップします。パートナーシップに関して良いニュースがありそう。芸術や音楽を楽しむと心が豊かになります。',
        tomorrow: '明日は調和とバランスを重視した行動が成功につながります。美的センスを活かした活動や人間関係の調整に良い結果が期待できます。',
        thisWeek: '今週は人間関係と美的センスが光る週です。調和を大切にする姿勢が周りから評価され、美しいものに囲まれる機会が増えます。パートナーシップに良い変化が期待できます。'
      },
      '蠍座': {
        personality: '蠍座のあなたは、深い洞察力と集中力を持つ神秘的な人です。物事の本質を見抜く能力に長け、一度興味を持ったことには徹底的に取り組みます。秘密を守ることができ、信頼される存在です。変革を恐れず、困難な状況でも立ち向かう強さがあります。',
        today: '今日は深く集中して取り組むことで大きな成果が得られる日です。直感を信じて行動すると良い方向に進みます。秘密や隠れた情報が幸運をもたらしそう。変化を恐れずに受け入れることが鍵となります。',
        tomorrow: '明日は深い洞察力が活かされる日です。物事の本質を見抜く能力を活かして、重要な決断を下すのに適しています。変革のチャンスが訪れそうです。',
        thisWeek: '今週は深い洞察力と集中力が発揮される週です。物事の本質を見抜く能力が重要な場面で活かされ、変革的な出来事が起こる可能性があります。直感を信じて行動しましょう。'
      },
      '射手座': {
        personality: '射手座のあなたは、自由を愛する冒険家です。哲学的で楽観的な考え方を持ち、常に新しい経験や知識を求めています。率直で正直な性格で、遠い目標に向かって突き進む情熱があります。異文化や外国に興味を持つことも多いでしょう。',
        today: '今日は新しい冒険や学習に最適な日です。遠出や旅行の計画を立てると良いことがありそう。外国や異文化に関する情報が幸運をもたらします。楽観的な姿勢を保つことで、思わぬチャンスが訪れるかもしれません。',
        tomorrow: '明日は冒険心と楽観性が活かされる日です。新しい経験や学びの機会が現れ、遠い目標に向かって前進できそうです。',
        thisWeek: '今週は冒険心と哲学的な思考が光る週です。新しい経験や知識の習得が充実し、遠い目標に向かって大きく前進できます。異文化交流の機会もありそうです。'
      },
      '山羊座': {
        personality: '山羊座のあなたは、責任感が強く実務的な努力家です。長期的な目標に向かって着実に歩み続ける忍耐力があります。伝統や社会的地位を重視し、確実な成功を求める傾向があります。信頼できる存在として、多くの人に頼りにされています。',
        today: '今日は計画的な行動が成功につながる日です。責任ある行動が周りから評価されそう。仕事や学習において着実な進歩が期待できます。目上の人からの良いアドバイスがありそうです。長期的な投資を考えるのにも良い日です。',
        tomorrow: '明日は責任感と実務的な能力が評価される日です。長期的な目標に向かって着実に進歩し、社会的な地位の向上につながる出来事がありそうです。',
        thisWeek: '今週は責任感と実務的な能力が光る週です。長期的な目標に向かって着実に進歩し、社会的な信頼を得る機会が増えます。伝統的な価値観を大切にする姿勢が評価されます。'
      },
      '水瓶座': {
        personality: '水瓶座のあなたは、独創的で人道主義的な革新者です。常識にとらわれない自由な発想を持ち、未来志向で進歩的な考え方をします。友情を大切にし、グループや社会全体の利益を考える傾向があります。個性的で、他の人とは違う独自の道を歩みます。',
        today: '今日は独創的なアイデアが形になる日です。友人関係において良い発展がありそう。新しい技術やトレンドに注目すると幸運が訪れます。グループ活動や社会貢献に参加すると運気がアップします。',
        tomorrow: '明日は独創性と革新性が活かされる日です。友人関係が発展し、グループでの活動が成功する可能性があります。未来志向の計画を立てるのに適した日です。',
        thisWeek: '今週は独創性と人道主義が光る週です。友人関係が充実し、グループでの活動や社会貢献が成功します。革新的なアイデアが形になる機会があります。'
      },
      '魚座': {
        personality: '魚座のあなたは、豊かな想像力と深い共感性を持つ芸術的な人です。直感力に優れ、人の感情や雰囲気を敏感に感じ取ります。優しく思いやりがあり、困っている人を放っておけない性格です。夢見がちで、スピリチュアルなことにも興味を持ちます。',
        today: '今日は直感を大切にすると良い日です。芸術的な活動や創作に取り組むと素晴らしいインスピレーションが得られそう。人への思いやりが良い結果をもたらします。夢や瞑想の時間を持つと心が癒されます。',
        tomorrow: '明日は想像力と共感性が活かされる日です。芸術的な創作や人への思いやりが良い結果をもたらし、スピリチュアルな体験があるかもしれません。',
        thisWeek: '今週は豊かな想像力と共感性が光る週です。芸術的な活動が充実し、人への思いやりが深まります。直感力を活かした判断が良い結果をもたらします。'
      }
    };

    const analysis = signAnalysis[sign];
    if (!analysis) return null;

    // 期間に応じたメッセージを取得
    let fortuneMessage = '';
    switch (period) {
      case 'today':
        fortuneMessage = analysis.today || '今日は良い一日になりそうです。';
        break;
      case 'tomorrow':
        fortuneMessage = analysis.tomorrow || '明日も素晴らしい一日になるでしょう。';
        break;
      case 'thisWeek':
        fortuneMessage = analysis.thisWeek || '今週は充実した週になりそうです。';
        break;
      default:
        fortuneMessage = analysis.today || '良い一日になりそうです。';
    }

    return {
      personalityAnalysis: analysis.personality,
      fortuneMessage: fortuneMessage,
      period: period,
      isLoading: false,
      error: null
    };
  };

  // 5つの運勢を生成（全体運、恋愛運、仕事運、健康運、金銭運）+ 注意する日
  const generateFiveFortunes = (sign: string, period: PeriodSelection = 'today') => {
    if (!sign) return null;

    // 現在の日付を取得
    const today = new Date();
    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    };

    // 注意する日を生成（今日・明日以外）- 具体的な日付で表示
    const generateCautionDay = (period: PeriodSelection, sign: string) => {
      if (period === 'today' || period === 'tomorrow') return null;
      
      let cautionDate = new Date(today);
      let reason = '';
      
      // 期間に基づいて注意する日を計算
      switch (period) {
        case 'thisWeek':
          cautionDate.setDate(today.getDate() + 2); // 2日後
          reason = '感情的になりやすく、慎重な判断が必要な日';
          break;
        case 'nextWeek':
          cautionDate.setDate(today.getDate() + 9); // 来週の同じ曜日
          reason = '人間関係でのトラブルに注意が必要な日';
          break;
        case 'thisMonth':
          cautionDate.setDate(15); // 今月の15日
          if (cautionDate < today) {
            cautionDate.setMonth(cautionDate.getMonth() + 1);
          }
          reason = '金銭管理や重要な決断に慎重さが必要な時期';
          break;
        case 'nextMonth':
          cautionDate.setMonth(today.getMonth() + 1);
          cautionDate.setDate(8); // 来月の8日
          reason = '新しい環境での判断に注意が必要な時期';
          break;
        default:
          return null;
      }
      
      return {
        date: formatDate(cautionDate),
        reason: reason
      };
    };

    // ラッキーデーを生成
    const generateLuckyDay = (period: PeriodSelection, sign: string) => {
      if (period === 'today' || period === 'tomorrow') return null;
      
      let luckyDate = new Date(today);
      let fortune = '';
      
      // 期間に基づいてラッキーデーを計算
      switch (period) {
        case 'thisWeek':
          luckyDate.setDate(today.getDate() + 5); // 5日後
          fortune = '新しいチャンスが訪れる幸運な日。積極的な行動が成功を招きます。';
          break;
        case 'nextWeek':
          luckyDate.setDate(today.getDate() + 12); // 来週の金曜日頃
          fortune = '創造力と直感が冴える日。芸術的な活動や新しいアイデアが生まれやすい。';
          break;
        case 'thisMonth':
          luckyDate.setDate(22); // 今月の22日
          if (luckyDate < today) {
            luckyDate.setMonth(luckyDate.getMonth() + 1);
          }
          fortune = '人間関係が好転し、重要な出会いや良いニュースが期待できる日。';
          break;
        case 'nextMonth':
          luckyDate.setMonth(today.getMonth() + 1);
          luckyDate.setDate(18); // 来月の18日
          fortune = '金運が上昇し、投資や新しい事業に良い結果をもたらす幸運な時期。';
          break;
        default:
          return null;
      }
      
      return {
        date: formatDate(luckyDate),
        fortune: fortune
      };
    };

    // 星座別の5つの運勢テンプレート
    const fortuneTemplates: Record<string, { 
      overall: { [key in PeriodSelection]?: string }; 
      love: { [key in PeriodSelection]?: string }; 
      work: { [key in PeriodSelection]?: string }; 
      health: { [key in PeriodSelection]?: string }; 
      money: { [key in PeriodSelection]?: string }; 
    }> = {
      '牡羊座': {
        overall: {
          today: '今日は行動力が高まり、新しいことにチャレンジするのに最適な日です。積極的な姿勢が幸運を招きます。',
          tomorrow: '明日はリーダーシップを発揮する機会が訪れます。自信を持って前に進みましょう。',
          thisWeek: '今週は活動的なエネルギーに満ちています。新しいプロジェクトを始めるのに良い週です。'
        },
        love: {
          today: '恋愛では積極的なアプローチが効果的です。自分から行動を起こすことで良い展開が期待できます。',
          tomorrow: '明日は恋愛運が上昇します。直感を信じて行動すると良い出会いがあるかもしれません。',
          thisWeek: '今週は恋愛面で大きな変化が期待できます。新しい出会いや関係の進展がありそうです。'
        },
        work: {
          today: '仕事では新しいプロジェクトに積極的に取り組むと良い結果が得られます。リーダーシップを発揮しましょう。',
          tomorrow: '明日は仕事で重要な決断を下すのに適した日です。迅速な判断が成功につながります。',
          thisWeek: '今週は仕事運が絶好調です。新しい挑戦や昇進の機会が訪れる可能性があります。'
        },
        health: {
          today: '健康面では活発な運動が効果的です。エネルギーを発散させることで体調が良くなります。',
          tomorrow: '明日は体力が充実しています。スポーツや運動に最適な日です。',
          thisWeek: '今週は健康運が良好です。新しい運動やトレーニングを始めるのに良い週です。'
        },
        money: {
          today: '金銭面では積極的な投資や支出が良い結果をもたらします。思い切った決断が成功の鍵です。',
          tomorrow: '明日は金銭運が上昇します。新しい収入源や投資機会が現れるかもしれません。',
          thisWeek: '今週は金銭面で活発な動きがあります。新しい投資や事業展開に良い週です。'
        }
      },
      '牡牛座': {
        overall: {
          today: '今日は安定感のある一日を過ごせます。着実な歩みが幸運を呼び込みます。',
          tomorrow: '明日は実用的な判断が成功につながります。慎重な行動を心がけましょう。',
          thisWeek: '今週は着実な進歩が期待できます。忍耐強く取り組むことで良い結果が得られます。'
        },
        love: {
          today: '恋愛では安定した関係を築くことに重点を置きましょう。深い愛情が育まれます。',
          tomorrow: '明日は恋愛面で安定感のある展開が期待できます。長期的な関係を考えるのに良い日です。',
          thisWeek: '今週は恋愛運が安定しています。既存の関係がより深まり、新しい出会いも期待できます。'
        },
        work: {
          today: '仕事では実務的な能力が評価されます。着実な作業が良い成果をもたらします。',
          tomorrow: '明日は仕事で堅実な成果を上げることができます。計画的な行動が成功の鍵です。',
          thisWeek: '今週は仕事運が堅調です。継続的な努力が認められ、安定した成果が期待できます。'
        },
        health: {
          today: '健康面では規則正しい生活が効果的です。バランスの取れた食事と適度な運動を心がけましょう。',
          tomorrow: '明日は健康管理に力を入れると良い日です。美容や健康に投資すると長期的な効果が期待できます。',
          thisWeek: '今週は健康運が良好です。規則正しい生活習慣を身につけるのに良い週です。'
        },
        money: {
          today: '金銭面では堅実な管理が重要です。計画的な支出と貯蓄が安定をもたらします。',
          tomorrow: '明日は金銭運が安定しています。長期的な投資や貯蓄計画を立てるのに良い日です。',
          thisWeek: '今週は金銭面で安定した状況が続きます。着実な資産形成に取り組むのに良い週です。'
        }
      },
      '双子座': {
        overall: {
          today: '今日は好奇心旺盛なあなたの性格が活かされます。新しい情報や出会いが幸運をもたらします。',
          tomorrow: '明日はコミュニケーション能力が光る日です。多くの人との交流が良い結果をもたらします。',
          thisWeek: '今週は知的好奇心が満たされる週です。学習や情報収集に最適な時期です。'
        },
        love: {
          today: '恋愛では軽快なコミュニケーションが効果的です。楽しい会話が関係を深めます。',
          tomorrow: '明日は恋愛面で新しい発見があります。興味深い相手との出会いが期待できます。',
          thisWeek: '今週は恋愛運が活発です。多様な出会いや楽しい交流が期待できます。'
        },
        work: {
          today: '仕事では情報収集能力が活かされます。新しいアイデアや企画が成功につながります。',
          tomorrow: '明日は仕事でコミュニケーション能力が評価されます。チームワークが良い結果をもたらします。',
          thisWeek: '今週は仕事運が好調です。新しい知識やスキルの習得が成功につながります。'
        },
        health: {
          today: '健康面では適度な運動と脳の活性化が効果的です。読書や学習で心身のバランスを保ちましょう。',
          tomorrow: '明日は健康管理に新しいアプローチを取り入れると良い日です。多様な方法を試してみましょう。',
          thisWeek: '今週は健康運が良好です。新しい健康法や運動を始めるのに良い週です。'
        },
        money: {
          today: '金銭面では情報収集が重要です。新しい投資情報や収入源に注目しましょう。',
          tomorrow: '明日は金銭運が活発です。複数の収入源や投資機会を検討するのに良い日です。',
          thisWeek: '今週は金銭面で多様な動きがあります。情報を活かした投資や副業に良い週です。'
        }
      },
      '蟹座': {
        overall: {
          today: '今日は感情的な満足度が高い一日です。家族や親しい人との時間を大切にしましょう。',
          tomorrow: '明日は直感力が冴える日です。心の声に耳を傾けることで良い方向に進めます。',
          thisWeek: '今週は感情面で充実した週です。安心できる環境を整えることで運気が向上します。'
        },
        love: {
          today: '恋愛では深い愛情が育まれます。相手への思いやりが関係を深めます。',
          tomorrow: '明日は恋愛面で感情的な繋がりが強まります。心を開いて相手と向き合いましょう。',
          thisWeek: '今週は恋愛運が温かな雰囲気に包まれています。家族的な愛情が育まれます。'
        },
        work: {
          today: '仕事では協調性と思いやりが評価されます。チームの支援役として活躍できます。',
          tomorrow: '明日は仕事で直感力が活かされます。人の気持ちを理解することで良い結果が得られます。',
          thisWeek: '今週は仕事運が安定しています。チームワークを大切にすることで成功につながります。'
        },
        health: {
          today: '健康面では心の健康を重視しましょう。リラックスできる時間を作ることが大切です。',
          tomorrow: '明日は健康管理に感情面のケアを取り入れると良い日です。心身のバランスを保ちましょう。',
          thisWeek: '今週は健康運が良好です。家族や友人との時間が心の健康に良い影響を与えます。'
        },
        money: {
          today: '金銭面では家族や生活基盤への投資が効果的です。安定した生活を重視しましょう。',
          tomorrow: '明日は金銭運が安定しています。家計管理や貯蓄に力を入れるのに良い日です。',
          thisWeek: '今週は金銭面で安定した状況が続きます。家族のための投資や保険の見直しに良い週です。'
        }
      },
      '獅子座': {
        overall: {
          today: '今日は自己表現力が光る一日です。あなたの魅力が周りの人を惹きつけます。',
          tomorrow: '明日は創造性が発揮される日です。芸術的な活動や表現に取り組むと良い結果が得られます。',
          thisWeek: '今週は自信に満ちた週です。リーダーシップを発揮することで大きな成果が期待できます。'
        },
        love: {
          today: '恋愛では華やかな魅力が発揮されます。自信を持って相手にアプローチしましょう。',
          tomorrow: '明日は恋愛面で注目を集める日です。あなたの魅力が最大限に発揮されます。',
          thisWeek: '今週は恋愛運が絶好調です。ドラマチックな展開や素敵な出会いが期待できます。'
        },
        work: {
          today: '仕事では創造性とリーダーシップが評価されます。大胆なアイデアで成功を掴みましょう。',
          tomorrow: '明日は仕事で注目を集める機会があります。あなたの才能が認められる日です。',
          thisWeek: '今週は仕事運が華やかです。重要なプロジェクトでリーダーシップを発揮できます。'
        },
        health: {
          today: '健康面では活力に満ちています。楽しい活動や運動で体調を維持しましょう。',
          tomorrow: '明日は健康運が良好です。自信を持って活動することで体調も向上します。',
          thisWeek: '今週は健康運が輝いています。積極的な運動や健康管理で体調を整えましょう。'
        },
        money: {
          today: '金銭面では大胆な投資や支出が良い結果をもたらします。自信を持って決断しましょう。',
          tomorrow: '明日は金銭運が華やかです。新しい収入源や投資機会が現れる可能性があります。',
          thisWeek: '今週は金銭面で大きな動きがあります。創造性を活かした収入源に注目しましょう。'
        }
      },
      '乙女座': {
        overall: {
          today: '今日は細やかな配慮が評価される一日です。丁寧な作業が良い成果をもたらします。',
          tomorrow: '明日は分析力が活かされる日です。問題解決能力を発揮することで成功につながります。',
          thisWeek: '今週は実用性と効率性が光る週です。計画的な行動で着実に目標に近づけます。'
        },
        love: {
          today: '恋愛では細やかな気配りが相手の心を打ちます。真摯な態度で関係を深めましょう。',
          tomorrow: '明日は恋愛面で実用的なアプローチが効果的です。相手のことを深く理解することが大切です。',
          thisWeek: '今週は恋愛運が堅実です。時間をかけて相手との信頼関係を築いていきましょう。'
        },
        work: {
          today: '仕事では完璧主義的な性格が活かされます。品質の高い仕事で評価を得られます。',
          tomorrow: '明日は仕事で分析力と実務能力が評価されます。効率的な作業で成果を上げましょう。',
          thisWeek: '今週は仕事運が安定しています。継続的な努力と品質向上で大きな成果が期待できます。'
        },
        health: {
          today: '健康面では規則正しい生活習慣が効果的です。栄養バランスと適度な運動を心がけましょう。',
          tomorrow: '明日は健康管理に細やかな注意を払うと良い日です。予防医学的なアプローチが有効です。',
          thisWeek: '今週は健康運が良好です。生活習慣の改善や健康チェックに取り組むのに良い週です。'
        },
        money: {
          today: '金銭面では細かな管理が重要です。家計簿をつけて支出を把握しましょう。',
          tomorrow: '明日は金銭運が安定しています。実用的な投資や節約方法を検討するのに良い日です。',
          thisWeek: '今週は金銭面で効率的な管理が求められます。計画的な資産形成に取り組みましょう。'
        }
      },
      '天秤座': {
        overall: {
          today: '今日は調和とバランスを重視することで幸運が訪れます。周りとの協調を大切にしましょう。',
          tomorrow: '明日は美的センスが活かされる日です。美しいものに触れることで運気が向上します。',
          thisWeek: '今週は人間関係が充実する週です。協力関係を築くことで大きな成果が期待できます。'
        },
        love: {
          today: '恋愛では調和のとれた関係が築けます。相手との バランスを大切にしましょう。',
          tomorrow: '明日は恋愛面で美的な魅力が発揮されます。ロマンチックな雰囲気を演出しましょう。',
          thisWeek: '今週は恋愛運が優雅です。美しい場所でのデートや文化的な活動が関係を深めます。'
        },
        work: {
          today: '仕事では協調性と公平性が評価されます。チームの調整役として活躍できます。',
          tomorrow: '明日は仕事で美的センスが活かされます。デザインや企画の分野で成功が期待できます。',
          thisWeek: '今週は仕事運が調和的です。パートナーシップを活かした協力関係で成果を上げられます。'
        },
        health: {
          today: '健康面ではバランスの取れた生活が効果的です。心身の調和を保つことが大切です。',
          tomorrow: '明日は健康管理に美的な要素を取り入れると良い日です。美容や健康に投資しましょう。',
          thisWeek: '今週は健康運が調和的です。美容と健康のバランスを取った生活を心がけましょう。'
        },
        money: {
          today: '金銭面では美的な投資が効果的です。質の高いものに投資することで価値が向上します。',
          tomorrow: '明日は金銭運が調和的です。パートナーシップを活かした投資や事業に注目しましょう。',
          thisWeek: '今週は金銭面で美的価値のある投資が成功します。芸術や美容関連の分野に注目しましょう。'
        }
      },
      '蠍座': {
        overall: {
          today: '今日は深い洞察力が活かされる一日です。物事の本質を見抜く力で成功を掴みましょう。',
          tomorrow: '明日は集中力が最高潮に達します。重要な決断や変革に取り組むのに最適な日です。',
          thisWeek: '今週は変革的な週です。深い変化を恐れずに受け入れることで大きな成長が期待できます。'
        },
        love: {
          today: '恋愛では深い絆が築かれます。相手との心の繋がりを大切にしましょう。',
          tomorrow: '明日は恋愛面で情熱的な展開が期待できます。深い愛情を表現することが大切です。',
          thisWeek: '今週は恋愛運が濃密です。運命的な出会いや関係の深化が期待できます。'
        },
        work: {
          today: '仕事では洞察力と集中力が評価されます。複雑な問題の解決に取り組みましょう。',
          tomorrow: '明日は仕事で変革的な力が発揮されます。古い体制を刷新することで成功につながります。',
          thisWeek: '今週は仕事運が変革的です。重要なプロジェクトで深い専門性を発揮できます。'
        },
        health: {
          today: '健康面では内面的な健康に注目しましょう。心の健康が身体の健康につながります。',
          tomorrow: '明日は健康管理に深いアプローチを取り入れると良い日です。根本的な改善に取り組みましょう。',
          thisWeek: '今週は健康運が変革的です。生活習慣の根本的な見直しが効果的です。'
        },
        money: {
          today: '金銭面では深い分析が重要です。投資や資産運用で慎重な判断を行いましょう。',
          tomorrow: '明日は金銭運が変革的です。新しい投資戦略や資産形成方法を検討するのに良い日です。',
          thisWeek: '今週は金銭面で大きな変化があります。長期的な視点で資産を見直しましょう。'
        }
      },
      '射手座': {
        overall: {
          today: '今日は冒険心が幸運を呼び込む一日です。新しい経験や挑戦に積極的に取り組みましょう。',
          tomorrow: '明日は楽観的な姿勢が成功につながります。遠い目標に向かって前進しましょう。',
          thisWeek: '今週は拡大と成長の週です。新しい分野への挑戦が大きな成果をもたらします。'
        },
        love: {
          today: '恋愛では自由で開放的な関係が築けます。相手との新しい体験を楽しみましょう。',
          tomorrow: '明日は恋愛面で冒険的な展開が期待できます。新しい出会いや異文化交流に注目しましょう。',
          thisWeek: '今週は恋愛運が冒険的です。旅行や新しい場所での出会いが期待できます。'
        },
        work: {
          today: '仕事では冒険心と楽観性が評価されます。新しい分野への挑戦で成功を掴みましょう。',
          tomorrow: '明日は仕事で哲学的な思考が活かされます。長期的な視点で戦略を立てましょう。',
          thisWeek: '今週は仕事運が拡大的です。国際的な展開や新しい市場への参入が成功につながります。'
        },
        health: {
          today: '健康面では活発な運動が効果的です。アウトドア活動や旅行で心身をリフレッシュしましょう。',
          tomorrow: '明日は健康管理に冒険的なアプローチを取り入れると良い日です。新しい運動やトレーニングに挑戦しましょう。',
          thisWeek: '今週は健康運が活発です。スポーツや outdoor活動で体力を向上させましょう。'
        },
        money: {
          today: '金銭面では冒険的な投資が効果的です。新しい市場や分野への投資を検討しましょう。',
          tomorrow: '明日は金銭運が拡大的です。国際的な投資や外国通貨に注目するのに良い日です。',
          thisWeek: '今週は金銭面で大きな拡大が期待できます。新しい収入源や投資機会を積極的に探しましょう。'
        }
      },
      '山羊座': {
        overall: {
          today: '今日は責任感と実務能力が評価される一日です。計画的な行動で着実に目標に近づけます。',
          tomorrow: '明日は社会的な地位向上につながる機会が訪れます。真面目な取り組みが報われます。',
          thisWeek: '今週は着実な成長の週です。長期的な目標に向かって確実に前進できます。'
        },
        love: {
          today: '恋愛では真剣な関係が築けます。将来を見据えた長期的な関係を重視しましょう。',
          tomorrow: '明日は恋愛面で安定した関係が築けます。責任感のある態度が相手の信頼を得ます。',
          thisWeek: '今週は恋愛運が堅実です。結婚や将来の計画について話し合うのに良い週です。'
        },
        work: {
          today: '仕事では実務能力と責任感が高く評価されます。重要な役割を任される可能性があります。',
          tomorrow: '明日は仕事で社会的な成功につながる機会があります。長期的な視点で取り組みましょう。',
          thisWeek: '今週は仕事運が上昇傾向です。昇進や重要なプロジェクトのリーダーに抜擢される可能性があります。'
        },
        health: {
          today: '健康面では規律正しい生活が効果的です。継続的な健康管理で体調を維持しましょう。',
          tomorrow: '明日は健康管理に長期的なアプローチを取り入れると良い日です。予防医学に注目しましょう。',
          thisWeek: '今週は健康運が安定しています。継続的な運動や健康チェックで体調を整えましょう。'
        },
        money: {
          today: '金銭面では堅実な管理が重要です。長期的な資産形成に取り組みましょう。',
          tomorrow: '明日は金銭運が堅調です。不動産や保険などの長期投資を検討するのに良い日です。',
          thisWeek: '今週は金銭面で堅実な成長が期待できます。安定した投資や貯蓄に力を入れましょう。'
        }
      },
      '水瓶座': {
        overall: {
          today: '今日は独創性が光る一日です。革新的なアイデアで周りの人を驚かせましょう。',
          tomorrow: '明日は友人関係が発展する日です。グループ活動や社会貢献に参加すると良いでしょう。',
          thisWeek: '今週は革新と友情の週です。新しい技術や人道主義的な活動で成果を上げられます。'
        },
        love: {
          today: '恋愛では独創的なアプローチが効果的です。従来の常識にとらわれない関係を築きましょう。',
          tomorrow: '明日は恋愛面で友情から愛情へと発展する可能性があります。友人関係を大切にしましょう。',
          thisWeek: '今週は恋愛運が革新的です。オンラインでの出会いや新しい形の関係が期待できます。'
        },
        work: {
          today: '仕事では革新性と独創性が評価されます。新しい技術やアイデアで成功を掴みましょう。',
          tomorrow: '明日は仕事で人道主義的な活動が評価されます。社会貢献につながる仕事に注目しましょう。',
          thisWeek: '今週は仕事運が未来志向です。IT技術や環境問題などの分野で活躍できます。'
        },
        health: {
          today: '健康面では新しい健康法を試すのに良い日です。革新的なアプローチで体調を改善しましょう。',
          tomorrow: '明日は健康管理に科学的なアプローチを取り入れると良い日です。データを活用した健康管理に注目しましょう。',
          thisWeek: '今週は健康運が革新的です。新しい健康技術や治療法に関心を向けましょう。'
        },
        money: {
          today: '金銭面では革新的な投資が効果的です。新しい技術や環境関連の投資に注目しましょう。',
          tomorrow: '明日は金銭運が未来志向です。暗号通貨や新しい金融商品を検討するのに良い日です。',
          thisWeek: '今週は金銭面で革新的な動きがあります。テクノロジー関連の投資や収入源に注目しましょう。'
        }
      },
      '魚座': {
        overall: {
          today: '今日は直感力が冴える一日です。心の声に耳を傾けることで正しい道筋が見えてきます。',
          tomorrow: '明日は芸術的な感性が活かされる日です。創造的な活動に取り組むと良い結果が得られます。',
          thisWeek: '今週は感性と直感の週です。芸術活動やスピリチュアルな体験で心が豊かになります。'
        },
        love: {
          today: '恋愛では深い共感性が相手の心を打ちます。思いやりのある態度で関係を深めましょう。',
          tomorrow: '明日は恋愛面でロマンチックな展開が期待できます。詩的な表現や芸術的な演出が効果的です。',
          thisWeek: '今週は恋愛運が夢的です。理想的な関係や運命的な出会いが期待できます。'
        },
        work: {
          today: '仕事では直感力と創造性が評価されます。芸術やクリエイティブな分野で成功を掴みましょう。',
          tomorrow: '明日は仕事で共感性が活かされます。人を癒す職業や奉仕的な仕事で成果を上げられます。',
          thisWeek: '今週は仕事運が感性的です。芸術、医療、福祉の分野で大きな成果が期待できます。'
        },
        health: {
          today: '健康面では心の健康を重視しましょう。瞑想やヨガなどで心身のバランスを保ちましょう。',
          tomorrow: '明日は健康管理にホリスティックなアプローチを取り入れると良い日です。代替医療にも注目しましょう。',
          thisWeek: '今週は健康運が癒し的です。心身の調和を重視した健康法が効果的です。'
        },
        money: {
          today: '金銭面では直感を信じた判断が効果的です。芸術やスピリチュアルな分野への投資を検討しましょう。',
          tomorrow: '明日は金銭運が感性的です。美術品や音楽などの文化的な投資が価値を持つ可能性があります。',
          thisWeek: '今週は金銭面で感性を活かした投資が成功します。芸術作品や癒し関連の分野に注目しましょう。'
        }
      }
    };

    const template = fortuneTemplates[sign];
    if (!template) return null;

    const cautionDay = generateCautionDay(period, sign);
    const luckyDay = generateLuckyDay(period, sign);

    return {
      overall: template.overall[period] || template.overall.today || '全体的に良い運気に恵まれています。',
      love: template.love[period] || template.love.today || '恋愛面で良い展開が期待できます。',
      work: template.work[period] || template.work.today || '仕事で成果を上げることができます。',
      health: template.health[period] || template.health.today || '健康面で良い状態を保てます。',
      money: template.money[period] || template.money.today || '金銭面で安定した状況が続きます。',
      cautionDay: cautionDay,
      luckyDay: luckyDay
    };
  };

  // 3天体専用の詳細占い生成（レベル2用）
  const generateThreePlanetsFortune = (sunSign: string, moonSign: string, risingSign: string, period: PeriodSelection = 'today') => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    };

    const getTimeContext = (period: PeriodSelection) => {
      switch (period) {
        case 'today': return '今日';
        case 'tomorrow': return '明日';
        case 'thisWeek': return '今週';
        case 'nextWeek': return '来週';
        case 'thisMonth': return '今月';
        case 'nextMonth': return '来月';
        default: return '近日';
      }
    };

    const timeContext = getTimeContext(period);
    const sunTraits = zodiacInfo[sunSign];
    const moonTraits = zodiacInfo[moonSign];
    const risingTraits = zodiacInfo[risingSign];

    const generateDetailedFortune = () => {
      return {
        overall: `【${timeContext}の全体運】あなたの太陽星座${sunSign}と月星座${moonSign}、上昇星座${risingSign}の組み合わせから見ると、${timeContext}は特に調和の取れた運気の流れとなります。

【三つの星座の調和】太陽星座${sunSign}の${sunTraits?.element}の性質が、あなたの基本的な行動パターンを決定し、月星座${moonSign}の${moonTraits?.element}の要素が内面的な感情と直感をサポートします。さらに、上昇星座${risingSign}の${risingTraits?.element}の影響により、対人関係や第一印象において特別な魅力が輝きます。

【今日のアドバイス】三つの星座のエネルギーが調和することで、普段以上の力を発揮できる素晴らしい時期です。直感を大切にしながらも、論理的な判断を忘れないようにしましょう。自分らしさを大切にして、自然体で過ごすことが最高の運気を呼び込みます。`,
        
        love: `【${timeContext}の恋愛運】太陽星座${sunSign}の情熱と月星座${moonSign}の感情が美しく調和し、恋愛面では非常に魅力的な時期を迎えています。

【恋愛での輝き】${sunTraits?.element}の太陽があなたの恋愛に積極性と魅力をもたらし、${moonTraits?.element}の月があなたの内面の深い魅力を引き出します。上昇星座${risingSign}の${risingTraits?.element}の影響により、第一印象や外見的な魅力も最高潮に達します。

【恋愛のポイント】既にパートナーがいる方は、相手との深い絆を感じられる特別な出来事があるでしょう。お互いの価値観を尊重し合い、心を開いて話し合うことで、関係がより深まります。シングルの方は、三つの星座の魅力が存分に発揮され、素敵な出会いのチャンスが巡ってきます。自然体でいることが、最高の魅力となるでしょう。`,
        
        work: `【${timeContext}の仕事運】太陽星座${sunSign}の行動力と月星座${moonSign}の洞察力が組み合わさり、職場での評価が高まる時期です。

【職場での活躍】${sunTraits?.element}の太陽の性質により、新しいプロジェクトや責任のある仕事を任される可能性があります。${moonTraits?.element}の月の直感力が、複雑な状況でも最適な判断を下す助けとなります。上昇星座${risingSign}の影響で、同僚や上司との関係が良好になり、チームワークが向上します。

【キャリアアップのチャンス】この時期に積極的にコミュニケーションを取ることで、将来的なキャリアアップの基盤を築くことができるでしょう。創造性と実践力のバランスが取れた、理想的な仕事運の時期です。新しいスキルを身につけたり、資格取得に挑戦するのにも最適な時期です。`,
        
        health: `【${timeContext}の健康運】三つの星座のバランスが取れている今、心身の調和も良好な状態にあります。

【心身の調和】太陽星座${sunSign}からのエネルギーが体力を高め、月星座${moonSign}が精神的な安定をもたらします。上昇星座${risingSign}の影響により、外見的な魅力も内面から輝いて見えるでしょう。

【健康管理のポイント】${sunTraits?.element}の性質を活かした運動や活動が、特に効果的です。また、${moonTraits?.element}の月の影響により、リラックスできる時間を作ることも大切です。規則正しい生活リズムを心がけ、バランスの取れた食事を意識すると、さらに運気が向上するでしょう。瞑想やヨガなど、心を落ち着かせる活動もおすすめです。`,
        
        money: `【${timeContext}の金銭運】太陽星座${sunSign}の計画性と月星座${moonSign}の直感力が、金銭面でのバランス感覚を高めています。

【金運の流れ】${sunTraits?.element}の太陽の性質により、収入につながる新しいアイデアや機会が生まれる可能性があります。${moonTraits?.element}の月の直感が、投資や支出のタイミングを教えてくれるでしょう。上昇星座${risingSign}の影響で、人脈を通じた収入機会が増えるかもしれません。

【金運アップのコツ】投資や大きな買い物を検討している場合は、三つの星座のバランスを考慮して判断しましょう。節約と投資のバランスが、長期的な金運向上につながります。また、他者との協力や共同事業にも良い時期です。`
      };
    };

    const generateImportantDates = () => {
      const today = new Date();
      
      // 三つの星座の要素を組み合わせて特別な日を算出
      const cautionDay = (() => {
        const cautionDate = new Date(today);
        cautionDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
        
        return {
          date: formatDate(cautionDate),
          reason: `太陽星座${sunSign}と月星座${moonSign}のエネルギーが少し不調和になる可能性があります。焦らずに、上昇星座${risingSign}の冷静さを活かして行動しましょう。重要な決断は避け、リラックスできる時間を作ることが大切です。`
        };
      })();

      const luckyDay = (() => {
        const luckyDate = new Date(today);
        luckyDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
        
        return {
          date: formatDate(luckyDate),
          fortune: `三つの星座のエネルギーが最高に調和する特別な日です。太陽星座${sunSign}の積極性、月星座${moonSign}の直感力、上昇星座${risingSign}の魅力が全て輝く、素晴らしい一日となるでしょう。新しいことに挑戦するには最適な日です。`
        };
      })();

      return { cautionDay, luckyDay };
    };

    const fortuneData = generateDetailedFortune();
    const { cautionDay, luckyDay } = generateImportantDates();

    return {
      ...fortuneData,
      cautionDay,
      luckyDay
    };
  };

  // 3つの星座の組み合わせ分析（レベル2用）
  const generateThreeSignAnalysis = (sunSign: string, moonSign: string, risingSign: string) => {
    if (!sunSign || !moonSign || !risingSign) return null;

    // 星座の特性を取得
    const getSignTraits = (sign: string) => {
      const traits: Record<string, { element: string; quality: string; keywords: string[] }> = {
        '牡羊座': { element: '火', quality: '活動', keywords: ['リーダーシップ', '積極性', '冒険心'] },
        '牡牛座': { element: '土', quality: '固定', keywords: ['安定性', '忍耐力', '美的感覚'] },
        '双子座': { element: '風', quality: '柔軟', keywords: ['好奇心', 'コミュニケーション', '適応性'] },
        '蟹座': { element: '水', quality: '活動', keywords: ['感情豊か', '保護的', '家族愛'] },
        '獅子座': { element: '火', quality: '固定', keywords: ['創造性', '自己表現', '寛大さ'] },
        '乙女座': { element: '土', quality: '柔軟', keywords: ['分析力', '完璧主義', '奉仕精神'] },
        '天秤座': { element: '風', quality: '活動', keywords: ['バランス', '調和', '美的感覚'] },
        '蠍座': { element: '水', quality: '固定', keywords: ['深い洞察', '変革力', '集中力'] },
        '射手座': { element: '火', quality: '柔軟', keywords: ['冒険心', '哲学的', '楽観性'] },
        '山羊座': { element: '土', quality: '活動', keywords: ['責任感', '野心', '実務的'] },
        '水瓶座': { element: '風', quality: '固定', keywords: ['独創性', '人道主義', '革新性'] },
        '魚座': { element: '水', quality: '柔軟', keywords: ['共感性', '直感力', '芸術性'] }
      };
      return traits[sign] || { element: '不明', quality: '不明', keywords: [] };
    };

    const sunTraits = getSignTraits(sunSign);
    const moonTraits = getSignTraits(moonSign);
    const risingTraits = getSignTraits(risingSign);

    // より詳細な分析を構造化して生成
    const generateDetailedAnalysis = () => {
      // 性格のバランス分析
      let balanceAnalysis = '';
      if (sunSign === moonSign && moonSign === risingSign) {
        balanceAnalysis = '3つの星座が同じため、非常に一貫性のある性格で、迷いが少なく、自分らしさを貫けるタイプです。';
      } else if (sunSign === moonSign) {
        balanceAnalysis = `太陽と月が同じ星座なので、内面と外面が一致しており、素直で純粋な性格です。ただし、第一印象では${risingSign}の要素が強く現れます。`;
      } else if (sunSign === risingSign) {
        balanceAnalysis = `太陽と上昇星座が同じなので、第一印象と本来の性格が一致しており、誤解されることが少ないタイプです。内面では${moonSign}の感情を持っています。`;
      } else if (moonSign === risingSign) {
        balanceAnalysis = '月と上昇星座が同じなので、第一印象と内面の感情が一致しており、感情表現が自然で素直なタイプです。';
      } else {
        balanceAnalysis = '3つの星座がすべて異なるため、多面的で複雑な性格です。場面に応じて異なる一面を見せることができ、適応力に長けています。';
      }
      
      // 人間関係のアドバイス
      let relationshipAdvice = '';
      if (sunTraits.element === moonTraits.element) {
        relationshipAdvice = `太陽と月が同じ${sunTraits.element}の星座なので、感情と行動が一致しやすく、人との関係でも一貫性があります。`;
      } else {
        relationshipAdvice = `太陽は${sunTraits.element}、月は${moonTraits.element}の性質を持つため、公私で異なる面を見せることがあります。親しい人にはより深い一面を見せることができます。`;
      }

      return {
        overview: `あなたは${sunSign}の太陽、${moonSign}の月、${risingSign}の上昇星座という組み合わせを持っています。`,
        basicPersonality: `太陽が${sunSign}にあることで、${sunTraits.keywords.join('、')}といった特徴があります。`,
        innerEmotions: `月が${moonSign}にあることで、プライベートでは${moonTraits.keywords.join('、')}な面を持ちます。`,
        firstImpression: `上昇星座が${risingSign}なので、初対面の人には${risingTraits.keywords.join('、')}な印象を与えます。`,
        personalityBalance: balanceAnalysis,
        relationshipAdvice: relationshipAdvice
      };
    };

    return {
      combinedAnalysis: generateDetailedAnalysis(),
      sunElement: sunTraits.element,
      moonElement: moonTraits.element,
      risingElement: risingTraits.element,
      balanceType: sunSign === moonSign ? "一致型" : "複合型"
    };
  };

  // 4セクション専門分析（レベル3用）
  const generateFourSectionAnalysis = (planets: any[]) => {
    if (!planets || planets.length === 0) return null;

    // 各セクションの天体を抽出
    const sun = planets.find(p => p.planet === '太陽');
    const moon = planets.find(p => p.planet === '月');
    const venus = planets.find(p => p.planet === '金星');
    const mars = planets.find(p => p.planet === '火星');
    const mercury = planets.find(p => p.planet === '水星');
    const jupiter = planets.find(p => p.planet === '木星');
    const saturn = planets.find(p => p.planet === '土星');
    const uranus = planets.find(p => p.planet === '天王星');
    const neptune = planets.find(p => p.planet === '海王星');
    const pluto = planets.find(p => p.planet === '冥王星');

    // 1. 基本性格分析（太陽・月）
    const basicPersonality = (() => {
      let analysis = '';
      
      if (sun && moon) {
        const sunTraits = zodiacInfo[sun.sign];
        const moonTraits = zodiacInfo[moon.sign];
        
        // 良いところ
        analysis += `【あなたの素晴らしいところ】`;
        analysis += `太陽が${sun.sign}にあるあなたは、${sunTraits?.keywords.join('、')}といった魅力的な特徴を持っています。`;
        
        if (sunTraits?.element === '火') {
          analysis += 'いつもエネルギッシュで、やる気に満ちています。困難な状況でも前向きに挑戦することができ、周囲を引っ張っていくリーダーの素質を持っています。';
        } else if (sunTraits?.element === '土') {
          analysis += '真面目で信頼性が高く、周囲から安心して頼られる存在です。決めたことはコツコツと続けることができ、時間をかけても必ず目標を達成する力があります。';
        } else if (sunTraits?.element === '風') {
          analysis += 'コミュニケーション能力が高く、様々な人と良好な関係を築くことができます。興味を持ったことを素早く理解し、それを周囲と共有する優しさがあります。';
        } else if (sunTraits?.element === '水') {
          analysis += '人の気持ちをよく理解する、心優しい人です。相手が言葉にしなくても、その感情を察知することができる、とても貴重な才能を持っています。';
        }

        analysis += `月が${moon.sign}にあることで、プライベートでは${moonTraits?.keywords.join('、')}な魅力があり、`;
        
        if (moonTraits?.element === '火') {
          analysis += '感情表現が豊かで、周囲の人を温かい気持ちにさせることができます。';
        } else if (moonTraits?.element === '土') {
          analysis += '落ち着いていて安定感があり、家族や親しい人にとって心の支えとなります。';
        } else if (moonTraits?.element === '風') {
          analysis += '知的な話題を楽しみ、親しい人との会話を通じて深いつながりを築くことができます。';
        } else if (moonTraits?.element === '水') {
          analysis += '深い愛情を持って人と接し、心の奥深くでつながることができます。';
        }

        // 注意点
        analysis += `【気をつけたいこと】`;
        
        if (sun.sign === moon.sign) {
          analysis += '表に見せる自分と心の中の自分が同じなので、感情が高ぶった時にそのまま表に出てしまうことがあります。深呼吸をして一度落ち着く時間を作ると、より魅力的な自分でいられるでしょう。';
        } else if (sunTraits?.element === moonTraits?.element) {
          analysis += '基本的にはバランスが取れていますが、時々同じタイプの性格が強く出すぎることもあります。いつもと違う考え方を意識することで、より魅力的になれます。';
        } else {
          analysis += '職場での自分と、家族や親しい友人といる時の自分が異なることがあります。しかし、それはどちらも本当のあなたです。状況に応じて使い分けられるようになると素晴らしいですね。';
        }
      }
      
      return analysis;
    })();

    // 2. 恋愛・行動分析（金星・火星）
    const loveAndAction = (() => {
      let analysis = '';
      
      if (venus && mars) {
        const venusTraits = zodiacInfo[venus.sign];
        const marsTraits = zodiacInfo[mars.sign];
        
        // 良いところ
        analysis += `【恋愛での魅力と行動力】`;
        analysis += `金星が${venus.sign}にあるあなたは、恋愛で`;
        
        if (venusTraits?.element === '火') {
          analysis += '情熱的で魅力的な存在です。好きな人にはストレートに気持ちを伝えることができ、相手を元気づける力があります。デートでも積極的に提案して、楽しい時間を作ることが得意です。';
        } else if (venusTraits?.element === '土') {
          analysis += '一緒にいると安心感を与える存在です。相手のことをよく観察し理解してくれるため、お付き合いが長続きしやすいです。';
        } else if (venusTraits?.element === '風') {
          analysis += '会話が上手で、知的な魅力があります。相手と共通の趣味を見つけることが得意で、お互いを尊重し合える素晴らしい関係を築けます。';
        } else if (venusTraits?.element === '水') {
          analysis += '相手の気持ちをよく理解してくれる、心優しいタイプです。言葉にしなくても相手の感情を察知することができ、ロマンチックで心温まる恋愛ができます。';
        }

        analysis += `火星が${mars.sign}にあることで、行動では`;
        
        if (marsTraits?.element === '火') {
          analysis += 'エネルギッシュで決断力があります。やりたいことがあれば迷わず行動し、困難な状況でも諦めずに挑戦し続けることができます。';
        } else if (marsTraits?.element === '土') {
          analysis += '着実で信頼できる行動力があります。計画的に物事を進め、約束を必ず守る責任感があります。';
        } else if (marsTraits?.element === '風') {
          analysis += '知的で効率的な行動力があります。情報を集めて最適な方法を見つけ、スマートに目標を達成することができます。';
        } else if (marsTraits?.element === '水') {
          analysis += '感情に寄り添った行動力があります。相手の気持ちを考慮し、思いやりのある行動を取ることができます。';
        }

        // 注意点
        analysis += `【気をつけたいポイント】`;
        
        if (venusTraits?.element === marsTraits?.element) {
          analysis += '恋愛の理想と行動が一致しているため、時に一つの方向に偏りすぎることがあります。相手の立場や異なる価値観も受け入れる柔軟性を持つことが大切です。';
        } else {
          analysis += '恋愛の理想と実際の行動にギャップがあることがあります。相手に混乱を与えないよう、自分の気持ちや行動の理由を言葉で説明することが重要です。';
        }
      }
      
      return analysis;
    })();

    // 3. 仕事・成長分析（水星・木星・土星）
    const workAndGrowth = (() => {
      let analysis = '';
      
      if (mercury && jupiter && saturn) {
        const mercuryTraits = zodiacInfo[mercury.sign];
        const jupiterTraits = zodiacInfo[jupiter.sign];
        const saturnTraits = zodiacInfo[saturn.sign];
        
        // 良いところ
        analysis += `【仕事での強みと成長の可能性】`;
        analysis += `水星が${mercury.sign}にあることで、`;
        
        if (mercuryTraits?.element === '火') {
          analysis += '素早い判断力と決断力が仕事での大きな武器になります。営業、企画、マネジメント分野で力を発揮できます。';
        } else if (mercuryTraits?.element === '土') {
          analysis += '細かい分析と継続的な作業が得意で、経理、研究、技術職で信頼される存在になれます。';
        } else if (mercuryTraits?.element === '風') {
          analysis += 'コミュニケーション能力と情報処理能力が高く、メディア、教育、コンサルティング分野で才能を発揮できます。';
        } else if (mercuryTraits?.element === '水') {
          analysis += '相手の気持ちを理解する能力が高く、カウンセリング、看護、クリエイティブ分野で重宝されます。';
        }

        analysis += `木星が${jupiter.sign}にあることで、`;
        
        if (jupiterTraits?.element === '火') {
          analysis += '新しい挑戦を通じて大きく成長し、海外進出や革新的プロジェクトで成功する可能性があります。';
        } else if (jupiterTraits?.element === '土') {
          analysis += '着実なスキルアップを通じて、伝統的な業界で確固たる地位を築くことができます。';
        } else if (jupiterTraits?.element === '風') {
          analysis += '学習と人脈形成を通じて、教育や国際的な分野で大きな成果を上げることができます。';
        } else if (jupiterTraits?.element === '水') {
          analysis += '人への奉仕を通じて成長し、ヒーリングやスピリチュアル分野で意義のある成果を上げられます。';
        }

        // 注意点
        analysis += `【克服すべき課題】`;
        analysis += `土星が${saturn.sign}にあることで、`;
        
        if (saturnTraits?.element === '火') {
          analysis += '時に性急になりがちなので、計画性と忍耐力を身につけることで更なる成功を手にできます。深呼吸をして、長期的な視点を持つことが大切です。';
        } else if (saturnTraits?.element === '土') {
          analysis += '完璧主義になりがちなので、時には柔軟性を持って他者と協力することで、より大きな成果を得られます。';
        } else if (saturnTraits?.element === '風') {
          analysis += '理論に偏りがちなので、実践的な行動力を養うことで理想を現実化できます。小さなステップから始めることを心がけましょう。';
        } else if (saturnTraits?.element === '水') {
          analysis += '感情的になりがちなので、客観的な視点を持つことでより良い判断ができるようになります。一度冷静になって考える時間を作ることが重要です。';
        }
      }
      
      return analysis;
    })();

    // 4. 深層心理分析（天王星・海王星・冥王星）
    const deepPsyche = (() => {
      let analysis = '';
      
      if (uranus && neptune && pluto) {
        // 良いところ
        analysis += `【深層の力と可能性】`;
        analysis += `天王星が${uranus.sign}にあることで、`;
        
        // 天王星の影響
        const uranusTraits = zodiacInfo[uranus.sign];
        if (uranusTraits?.element === '火') {
          analysis += '革新的で先進的な発想力があり、社会の変革に積極的に参加する力があります。';
        } else if (uranusTraits?.element === '土') {
          analysis += '伝統的な価値観を実用的に革新し、安定した変化を生み出す力があります。';
        } else if (uranusTraits?.element === '風') {
          analysis += '知的な革新と情報技術の発展に強い関心を持ち、新しいコミュニケーション方法を創造する力があります。';
        } else if (uranusTraits?.element === '水') {
          analysis += '感情的な解放と精神的な革新を求め、従来の価値観に新しい視点をもたらす力があります。';
        }

        // 海王星の影響
        const neptuneTraits = zodiacInfo[neptune.sign];
        analysis += `海王星が${neptune.sign}にあることで、`;
        if (neptuneTraits?.element === '火') {
          analysis += 'スピリチュアルな情熱と理想主義的な夢を追求する力があります。';
        } else if (neptuneTraits?.element === '土') {
          analysis += '現実的な理想を追求し、実用的なスピリチュアリティを体現する力があります。';
        } else if (neptuneTraits?.element === '風') {
          analysis += '知的な探求とコミュニケーションを通じて精神的な成長を目指す力があります。';
        } else if (neptuneTraits?.element === '水') {
          analysis += '深い感情的な体験と直感的な理解を重視し、人々の心に寄り添う力があります。';
        }

        // 冥王星の影響
        const plutoTraits = zodiacInfo[pluto.sign];
        analysis += `冥王星が${pluto.sign}にあることで、困難な状況からでも立ち上がり、根本的な変革を起こす強い再生力があります。`;

        // 注意点
        analysis += `【注意すべき点】`;
        analysis += 'これらの深層の力は強大ですが、時にコントロールが難しいことがあります。変化を求めすぎて周囲と摩擦が生じたり、理想が高すぎて現実とのギャップに苦しむことがあります。これらの力を建設的に使うために、小さな変化から始めて、周囲の理解を得ながら進めることが大切です。感情的になりすぎた時は、一度立ち止まって冷静になる時間を作ることも重要です。';
      }
      
      return analysis;
    })();

    return {
      basicPersonality,
      loveAndAction, 
      workAndGrowth,
      deepPsyche
    };
  };

  // 10天体の包括的分析（レベル3用）
  const generateTenPlanetsAnalysis = (planets: any[]) => {
    if (!planets || planets.length === 0) return null;

    // 天体の定義と分類
    const innerPlanets = ['太陽', '月', '水星', '金星', '火星'];
    const outerPlanets = ['木星', '土星', '天王星', '海王星', '冥王星'];
    
    // 4元素と3性質の集計
    const elementCount = { '火': 0, '土': 0, '風': 0, '水': 0 };
    const qualityCount = { '活動': 0, '固定': 0, '柔軟': 0 };

    // 内惑星と外惑星の分析
    const innerPlanetSigns: string[] = [];
    const outerPlanetSigns: string[] = [];

    planets.forEach(planet => {
      const signTraits = zodiacInfo[planet.sign];
      if (signTraits) {
        // 元素の集計
        if (signTraits.element === '火') elementCount['火']++;
        else if (signTraits.element === '土') elementCount['土']++;
        else if (signTraits.element === '風') elementCount['風']++;
        else if (signTraits.element === '水') elementCount['水']++;

        // 性質の集計
        if (signTraits.quality === '活動') qualityCount['活動']++;
        else if (signTraits.quality === '固定') qualityCount['固定']++;
        else if (signTraits.quality === '柔軟') qualityCount['柔軟']++;

        // 内惑星と外惑星の分類
        if (innerPlanets.includes(planet.planet)) {
          innerPlanetSigns.push(planet.sign);
        } else if (outerPlanets.includes(planet.planet)) {
          outerPlanetSigns.push(planet.sign);
        }
      }
    });

    // 最も多い元素と性質を特定
    const dominantElement = Object.entries(elementCount).reduce((a, b) => 
      elementCount[a[0] as keyof typeof elementCount] > elementCount[b[0] as keyof typeof elementCount] ? a : b
    )[0];
    
    const dominantQuality = Object.entries(qualityCount).reduce((a, b) => 
      qualityCount[a[0] as keyof typeof qualityCount] > qualityCount[b[0] as keyof typeof qualityCount] ? a : b
    )[0];

    // 詳細分析の生成
    const generateComprehensiveAnalysis = () => {
      // 内惑星の影響分析
      const innerInfluence = (() => {
        const fireCount = innerPlanetSigns.filter(sign => zodiacInfo[sign]?.element === '火').length;
        const earthCount = innerPlanetSigns.filter(sign => zodiacInfo[sign]?.element === '土').length;
        const airCount = innerPlanetSigns.filter(sign => zodiacInfo[sign]?.element === '風').length;
        const waterCount = innerPlanetSigns.filter(sign => zodiacInfo[sign]?.element === '水').length;

        if (fireCount >= 2) {
          return '内惑星に火の星座が多く、エネルギッシュで積極的、情熱的な性格の基盤があります。新しいことに挑戦する勇気と行動力を持っています。';
        } else if (earthCount >= 2) {
          return '内惑星に土の星座が多く、現実的で安定志向、着実に物事を進める性格の基盤があります。信頼性が高く、責任感の強い人です。';
        } else if (airCount >= 2) {
          return '内惑星に風の星座が多く、知的で社交的、コミュニケーション能力に長けた性格の基盤があります。情報を素早く処理し、人とのつながりを大切にします。';
        } else if (waterCount >= 2) {
          return '内惑星に水の星座が多く、感情豊かで直感的、共感性の高い性格の基盤があります。人の気持ちを理解し、深い絆を築くことができます。';
        } else {
          return '内惑星がバランス良く配置されており、多面的で適応力の高い性格の基盤があります。状況に応じて異なる面を活かすことができます。';
        }
      })();

      // 外惑星の影響分析
      const outerInfluence = (() => {
        const hasJupiter = planets.find(p => p.planet === '木星');
        const hasSaturn = planets.find(p => p.planet === '土星');
        const hasUranus = planets.find(p => p.planet === '天王星');
        const hasNeptune = planets.find(p => p.planet === '海王星');
        const hasPluto = planets.find(p => p.planet === '冥王星');

        let analysis = '外惑星からは、';
        
        if (hasJupiter && zodiacInfo[hasJupiter.sign]?.element === '火') {
          analysis += '拡張と成長への強い意欲、';
        } else if (hasJupiter && zodiacInfo[hasJupiter.sign]?.element === '土') {
          analysis += '着実な成長と実用的な拡張、';
        }

        if (hasSaturn && zodiacInfo[hasSaturn.sign]?.element === '土') {
          analysis += '強い責任感と忍耐力、';
        } else if (hasSaturn && zodiacInfo[hasSaturn.sign]?.element === '水') {
          analysis += '感情面での成熟と深い責任感、';
        }

        analysis += 'そして世代的な特徴として革新性や深層心理の影響を受けています。人生の大きな方向性や深い価値観の形成に影響を与えています。';
        
        return analysis;
      })();

      // 天体バランス分析
      const balanceAnalysis = (() => {
        const totalPlanets = planets.length;
        const elementPercentages = {
          '火': Math.round((elementCount['火'] / totalPlanets) * 100),
          '土': Math.round((elementCount['土'] / totalPlanets) * 100),
          '風': Math.round((elementCount['風'] / totalPlanets) * 100),
          '水': Math.round((elementCount['水'] / totalPlanets) * 100)
        };

        let analysis = `4元素のバランスでは、${dominantElement}の星座が${dominantElement === '火' ? elementCount['火'] : dominantElement === '土' ? elementCount['土'] : dominantElement === '風' ? elementCount['風'] : elementCount['水']}個（${elementPercentages[dominantElement as keyof typeof elementPercentages]}%）と最も多く、`;
        
        if (dominantElement === '火') {
          analysis += '情熱的で行動的な性質が強く現れます。';
        } else if (dominantElement === '土') {
          analysis += '現実的で安定志向の性質が強く現れます。';
        } else if (dominantElement === '風') {
          analysis += '知的で社交的な性質が強く現れます。';
        } else if (dominantElement === '水') {
          analysis += '感情的で直感的な性質が強く現れます。';
        }

        analysis += ` また、3性質では${dominantQuality}星座が多く、`;
        
        if (dominantQuality === '活動') {
          analysis += '物事を始める力と積極性に優れています。';
        } else if (dominantQuality === '固定') {
          analysis += '継続力と安定性に優れています。';
        } else if (dominantQuality === '柔軟') {
          analysis += '適応力と変化への対応力に優れています。';
        }

        return analysis;
      })();

      // 総合的な人生の方向性
      const lifeDirection = (() => {
        const sun = planets.find(p => p.planet === '太陽');
        const moon = planets.find(p => p.planet === '月');
        const mercury = planets.find(p => p.planet === '水星');
        const venus = planets.find(p => p.planet === '金星');
        const mars = planets.find(p => p.planet === '火星');

        let direction = '10天体の総合的な配置から、あなたの人生は';

        if (sun && zodiacInfo[sun.sign]?.element === dominantElement) {
          direction += `基本的な性格と全体的な傾向が一致しており、一貫性のある${dominantElement === '火' ? '情熱的' : dominantElement === '土' ? '現実的' : dominantElement === '風' ? '知的' : '感情的'}な生き方が向いています。`;
        } else {
          direction += '多面的な要素を持ち、様々な分野で才能を発揮できる可能性があります。';
        }

        direction += ` 特に${dominantElement}の性質を活かした分野での成功が期待でき、${dominantQuality}の行動パターンで物事を進めると良い結果が得られるでしょう。`;

        return direction;
      })();

      return {
        innerInfluence,
        outerInfluence,
        balanceAnalysis,
        lifeDirection
      };
    };

    return {
      analysis: generateComprehensiveAnalysis(),
      dominantElement,
      dominantQuality,
      elementDistribution: elementCount,
      qualityDistribution: qualityCount,
      innerPlanetCount: innerPlanetSigns.length,
      outerPlanetCount: outerPlanetSigns.length
         };
   };

  // 10天体完全占い生成（レベル3専用）
  const generateTenPlanetsFortune = (planets: any[], period: PeriodSelection = 'today') => {
    if (!planets || planets.length === 0) return null;

    // 期間に応じた時間軸設定
    const getTimeContext = (period: PeriodSelection) => {
      switch (period) {
        case 'today': return { timeframe: '今日', context: '一日', advice: '今日は', isLongTerm: false };
        case 'tomorrow': return { timeframe: '明日', context: '一日', advice: '明日は', isLongTerm: false };
        case 'thisWeek': return { timeframe: '今週', context: '週間', advice: '今週は', isLongTerm: false };
        case 'nextWeek': return { timeframe: '来週', context: '週間', advice: '来週は', isLongTerm: false };
        case 'thisMonth': return { timeframe: '今月', context: '月間', advice: '今月は', isLongTerm: false };
        case 'nextMonth': return { timeframe: '来月', context: '月間', advice: '来月は', isLongTerm: false };
        case 'oneMonth': return { timeframe: '1ヶ月', context: '月間', advice: '今後1ヶ月は', isLongTerm: false };
        case 'threeMonths': return { timeframe: '3ヶ月', context: '期間', advice: '今後3ヶ月は', isLongTerm: false };
        case 'sixMonths': return { timeframe: '6ヶ月', context: '期間', advice: '今後6ヶ月は', isLongTerm: false };
        case 'oneYear': return { timeframe: '1年', context: '年間', advice: '今後1年は', isLongTerm: true };
        case 'twoYears': return { timeframe: '2年', context: '期間', advice: '今後2年は', isLongTerm: true };
        case 'threeYears': return { timeframe: '3年', context: '期間', advice: '今後3年は', isLongTerm: true };
        case 'fourYears': return { timeframe: '4年', context: '期間', advice: '今後4年は', isLongTerm: true };
        case 'fiveYears': return { timeframe: '5年', context: '期間', advice: '今後5年は', isLongTerm: true };
        default: return { timeframe: '今日', context: '一日', advice: '今日は', isLongTerm: false };
      }
    };

    const timeCtx = getTimeContext(period);

    // 各天体の影響を分析
    const analyzePlanetInfluences = () => {
      const influences: Record<string, any> = {};
      
      planets.forEach(planet => {
        const signTraits = zodiacInfo[planet.sign];
        if (!signTraits) return;

        // 天体別の影響計算
        switch (planet.planet) {
          case '太陽':
            influences.sun = {
              element: signTraits.element,
              energy: signTraits.element === '火' ? 'high' : signTraits.element === '土' ? 'stable' : signTraits.element === '風' ? 'flexible' : 'intuitive',
              house: planet.house
            };
            break;
          case '月':
            influences.moon = {
              element: signTraits.element,
              emotional: signTraits.element === '水' ? 'deep' : signTraits.element === '火' ? 'passionate' : signTraits.element === '風' ? 'changeable' : 'practical',
              house: planet.house
            };
            break;
          case '水星':
            influences.mercury = {
              element: signTraits.element,
              communication: signTraits.element === '風' ? 'excellent' : signTraits.element === '火' ? 'direct' : signTraits.element === '土' ? 'practical' : 'intuitive',
              retrograde: planet.retrograde,
              house: planet.house
            };
            break;
          case '金星':
            influences.venus = {
              element: signTraits.element,
              love: signTraits.element === '水' ? 'romantic' : signTraits.element === '土' ? 'stable' : signTraits.element === '風' ? 'social' : 'passionate',
              house: planet.house
            };
            break;
          case '火星':
            influences.mars = {
              element: signTraits.element,
              action: signTraits.element === '火' ? 'aggressive' : signTraits.element === '土' ? 'persistent' : signTraits.element === '風' ? 'strategic' : 'intuitive',
              house: planet.house
            };
            break;
          case '木星':
            influences.jupiter = {
              element: signTraits.element,
              expansion: signTraits.element === '火' ? 'adventurous' : signTraits.element === '土' ? 'practical' : signTraits.element === '風' ? 'intellectual' : 'spiritual',
              house: planet.house
            };
            break;
          case '土星':
            influences.saturn = {
              element: signTraits.element,
              discipline: signTraits.element === '土' ? 'strong' : signTraits.element === '風' ? 'mental' : signTraits.element === '水' ? 'emotional' : 'creative',
              house: planet.house
            };
            break;
        }
      });

      return influences;
    };

    const influences = analyzePlanetInfluences();

    // 詳細運勢の生成
    const generateDetailedFortune = () => {
      // 全体運（太陽+木星の影響）
      const overall = (() => {
        let fortune = `${timeCtx.advice}`;
        
        if (influences.sun) {
          if (influences.sun.energy === 'high') {
            fortune += '太陽のエネルギーが高まり、積極的な行動が良い結果をもたらす時期です。【良いこと】新しいことに挑戦すると、予想以上にうまくいく可能性があります。周囲からも頼りにされ、様々な機会が舞い込んできます。【注意点】自信過剰になりすぎず、感謝の気持ちを忘れずに行動しましょう。';
          } else if (influences.sun.energy === 'stable') {
            fortune += '太陽の安定したエネルギーで、着実に成果を積み上げられる時期です。【良いこと】急がず自分のペースで進めることで、確実な結果を得られます。日々の小さな努力が、将来大きな成果となって返ってきます。【注意点】安定しているからといって油断せず、継続することが重要です。';
          } else if (influences.sun.energy === 'flexible') {
            fortune += '太陽の柔軟なエネルギーで、変化にも上手に対応できる時期です。【良いこと】予定が変わったり、予期しないことが起きても、前向きに乗り切ることができます。複数の選択肢を持てるため、最適なタイミングで決断できるでしょう。【注意点】柔軟すぎて優柔不断にならないよう、決断すべき時は迷わず決めることが大切です。';
          } else {
            fortune += '太陽の直感的なエネルギーで、感覚的な判断が当たりやすい時期です。【良いこと】論理的に考えるより、直感で感じた方を選ぶと、良い結果につながります。一人の時間を作って、自分の気持ちと向き合うことをおすすめします。【注意点】直感も大切ですが、重要な判断は一度立ち止まって考えることも必要です。';
          }
        }

        if (influences.jupiter) {
          if (influences.jupiter.expansion === 'adventurous') {
            fortune += ' 木星の冒険的な影響で、新しいことに挑戦すると幸運が舞い込みます。【良いこと】今まで知らなかった分野や、海外に関わることで、思いがけない出会いや機会に恵まれます。勇気を出して挑戦することが成功の鍵となります。【注意点】冒険心は大切ですが、無謀にならないよう、準備をしっかりと整えることが重要です。';
          } else if (influences.jupiter.expansion === 'practical') {
            fortune += ' 木星の実用的な影響で、現実的な計画が大きな成果をもたらす時期です。【良いこと】将来に役立つことに時間やお金を投資すると、後で大きな恩恵を受けることができます。勉強や資格取得に最適なタイミングです。【注意点】堅実すぎて新しいことを避けないよう、時には冒険心も大切にしましょう。';
          } else if (influences.jupiter.expansion === 'intellectual') {
            fortune += ' 木星の知的な影響で、学習に対する意欲が高まる時期です。【良いこと】新しい知識を身につけることで、多くの発見があります。それが将来の仕事や人生の選択肢を広げてくれるでしょう。得意分野をさらに深めるのもおすすめです。【注意点】知識を蓄積するだけでなく、実際に活用することも忘れずに。';
          } else {
            fortune += ' 木星の精神的な影響で、内面の成長が幸福につながる時期です。【良いこと】人生の意味や本当に大切なことについて考える時間を作ると、今まで見えなかった答えが見つかります。心が豊かになることで、外側の世界も変わってきます。【注意点】考えすぎて現実逃避にならないよう、日常生活とのバランスを大切にしましょう。';
          }
        }

        // 長期的な占いの場合、重要な時期を追加
        if (timeCtx.isLongTerm) {
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();
          const importantPeriods = [];
          
          if (influences.sun?.energy === 'high') {
            const luckyMonth = (currentMonth + 3) % 12 + 1;
            const luckyYear = currentMonth + 3 >= 12 ? currentYear + 1 : currentYear;
            importantPeriods.push(`${luckyYear}年${luckyMonth}月はエネルギーが最高潮に達し、重要な決断や新しい挑戦に最適な時期`);
          }
          if (influences.jupiter?.expansion === 'adventurous') {
            const expansionMonth = (currentMonth + 8) % 12 + 1;
            const expansionYear = currentMonth + 8 >= 12 ? currentYear + 1 : currentYear;
            importantPeriods.push(`${expansionYear}年${expansionMonth}月は成長と拡張の大きなチャンスが訪れる時期`);
          }
          if (influences.venus?.love === 'romantic') {
            const loveMonth = (currentMonth + 5) % 12 + 1;
            const loveYear = currentMonth + 5 >= 12 ? currentYear + 1 : currentYear;
            importantPeriods.push(`${loveYear}年${loveMonth}月は恋愛や人間関係で特別な出会いや進展が期待できる時期`);
          }
          
          if (importantPeriods.length > 0) {
            fortune += ` 【重要な時期】${importantPeriods.join('。')}となるでしょう。`;
          }
          
          // 注意すべき時期も追加
          const cautionPeriods = [];
          if (influences.mercury?.retrograde) {
            const cautionMonth = (currentMonth + 2) % 12 + 1;
            const cautionYear = currentMonth + 2 >= 12 ? currentYear + 1 : currentYear;
            cautionPeriods.push(`${cautionYear}年${cautionMonth}月は慎重なコミュニケーションを心がけ、重要な契約や決定は避けた方が良い時期`);
          }
          if (influences.saturn?.discipline === 'strong') {
            const disciplineMonth = (currentMonth + 6) % 12 + 1;
            const disciplineYear = currentMonth + 6 >= 12 ? currentYear + 1 : currentYear;
            cautionPeriods.push(`${disciplineYear}年${disciplineMonth}月は責任が重くなりがちなので、無理をせず計画的に進めることが大切な時期`);
          }
          
          if (cautionPeriods.length > 0) {
            fortune += ` 【注意すべき時期】${cautionPeriods.join('。')}です。`;
          }
        }

        return fortune;
      })();

      // 恋愛運（金星+月の影響）
      const love = (() => {
        let fortune = `${timeCtx.timeframe}の恋愛運は、`;

        if (influences.venus) {
          if (influences.venus.love === 'romantic') {
            fortune += '金星のロマンチックな影響で、深い感情的なつながりが期待できる時期です。【良いこと】夕景を一緒に眺めたり、美しい場所で会話することで、相手との距離が縮まります。相手の気持ちを大切にすることで、より深い関係を築けるでしょう。【注意点】相手への想いが強すぎて束縛的にならないよう、相手の時間も尊重することが大切です。';
          } else if (influences.venus.love === 'stable') {
            fortune += '金星の安定した影響で、信頼関係を深められる時期です。【良いこと】日常の会話や、一緒に料理をするなどの共通の時間が関係を深めます。安心感を与えることで、長期的な関係を築くことができます。【注意点】平穏すぎて物足りなさを感じるかもしれませんが、そのような関係こそ本物の愛情です。';
          } else if (influences.venus.love === 'social') {
            fortune += '金星の社交的な影響で、多くの出会いに恵まれる時期です。【良いこと】友人からの紹介や、イベントやパーティーで素敵な人と出会える可能性があります。楽しい時間を共有することで、自然と恋愛に発展するでしょう。【注意点】多くの人と親しくなるのは良いですが、本当に大切な人を見逃さないよう注意が必要です。';
          } else {
            fortune += '金星の情熱的な影響で、激しい恋愛感情が湧き上がる時期です。【良いこと】運命的な出会いを感じた時は、素直に気持ちを伝えることが大切です。あなたの正直な気持ちが、相手の心を動かすでしょう。【注意点】情熱的になりすぎて相手を圧倒しないよう、少しずつ距離を縮めることが重要です。';
          }
        }

        if (influences.moon && influences.moon.emotional === 'deep') {
          fortune += ' 月の深い感情の影響で、相手との心の距離が縮まるでしょう。お互いの内面を理解し合うことで、より深い絆を築くことができます。';
        } else if (influences.moon && influences.moon.emotional === 'passionate') {
          fortune += ' 月の情熱的な影響で、恋愛に積極的になれる時期です。自分の気持ちを素直に表現することで、相手との関係が進展します。';
        }

        // 長期的な占いの場合、恋愛の時期も追加
        if (timeCtx.isLongTerm && influences.venus?.love) {
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();
          const loveMonth = (currentMonth + 4) % 12 + 1;
          const loveYear = currentMonth + 4 >= 12 ? currentYear + 1 : currentYear;
          fortune += ` 【恋愛の特別な時期】${loveYear}年${loveMonth}月頃は恋愛運が最高潮に達し、新しい出会いや関係の進展が期待できる時期です。`;
        }

        return fortune;
      })();

      // 仕事運（火星+土星の影響）
      const work = (() => {
        let fortune = `${timeCtx.timeframe}の仕事運は、`;

        if (influences.mars) {
          if (influences.mars.action === 'aggressive') {
            fortune += '火星の積極的な影響で、リーダーシップを発揮して大きな成果を上げられます。【良いこと】新しいプロジェクトの立ち上げや営業活動、プレゼンテーションなどで優れた成果を発揮できます。チームを率いる役割を任される可能性も高いです。【注意点】積極的すぎて周囲との協調を忘れがちになるので、チームワークを大切にしましょう。';
          } else if (influences.mars.action === 'persistent') {
            fortune += '火星の持続的な影響で、粘り強い取り組みが評価されます。【良いこと】長期的なプロジェクトや継続的な努力が必要な業務で力を発揮できます。困難な課題も諦めずに取り組むことで、大きな成果につながります。【注意点】頑固になりすぎず、時には柔軟な対応も必要です。';
          } else if (influences.mars.action === 'strategic') {
            fortune += '火星の戦略的な影響で、計画的なアプローチが成功を導きます。【良いこと】データ分析や戦略立案、効率的な業務改善などで才能を発揮できます。論理的な思考と実行力の組み合わせが成功の鍵となります。【注意点】計画に固執しすぎず、状況に応じて調整する柔軟性も大切です。';
          } else {
            fortune += '火星の直感的な影響で、ひらめきから生まれるアイデアが重要な突破口となります。【良いこと】クリエイティブな発想や革新的なアイデアが評価され、新しい価値を生み出すことができます。創造性を活かした仕事で成功を収めるでしょう。【注意点】直感を信じつつも、実現可能性も考慮して進めることが大切です。';
          }
        }

        if (influences.saturn) {
          if (influences.saturn.discipline === 'strong') {
            fortune += ' 土星の強い規律の影響で、責任ある行動が信頼を築きます。規則正しい業務執行と高い品質の維持により、上司や同僚からの信頼を得ることができます。';
          } else {
            fortune += ' 土星の成熟した影響で、長期的な視点での判断が成功につながります。将来を見据えた投資や決断が良い結果をもたらすでしょう。';
          }
        }

        // 長期的な占いの場合、仕事の重要時期も追加
        if (timeCtx.isLongTerm && influences.mars?.action) {
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();
          const workMonth = (currentMonth + 7) % 12 + 1;
          const workYear = currentMonth + 7 >= 12 ? currentYear + 1 : currentYear;
          fortune += ` 【仕事での重要時期】${workYear}年${workMonth}月頃は昇進や転職、重要プロジェクトの成功など、キャリアにとって大きな転機となる時期です。`;
        }

        return fortune;
      })();

      // 健康運（月+土星+火星+太陽の影響）
      const health = (() => {
        let fortune = `${timeCtx.timeframe}の健康運は、`;

        // 基本的な体力・エネルギー（太陽）
        if (influences.sun) {
          if (influences.sun.energy === 'high') {
            fortune += '太陽のエネルギーで体力が充実している時期です。【良いこと】運動を始めるのに最適なタイミングです。新しいスポーツに挑戦したり、朝のジョギングを始めることをおすすめします。【注意点】元気だからといって無理をしすぎないよう注意が必要です。';
          } else if (influences.sun.energy === 'stable') {
            fortune += '太陽の安定したエネルギーで、体調も穏やかです。【良いこと】毎日の習慣を大切にすることで、健康が長続きします。早寝早起きや規則正しい食事を心がけましょう。【注意点】安定しているからこそ、時には体を動かすことも忘れずに。';
          }
        }

        // 感情・睡眠・生活リズム（月）
        if (influences.moon) {
          if (influences.moon.emotional === 'deep') {
            fortune += ' 月の影響で心の健康がとても大切な時期です。【良いこと】好きな音楽を聞いたり、お風呂にゆっくり入ったりして、リラックスタイムを作りましょう。【注意点】考えすぎて眠れなくなったりしないよう、寝る前のスマホは控えめにすることが大切です。';
          } else if (influences.moon.emotional === 'changeable') {
            fortune += ' 月の影響で体調に波がある可能性があります。【良いこと】自分の体の声を聞いて、調子が良い日と休む日を使い分けることが重要です。【注意点】無理して頑張りすぎず、疲れた時は休むことも大切にしましょう。';
          }
        }

        // 行動力・運動（火星）
        if (influences.mars) {
          if (influences.mars.action === 'aggressive') {
            fortune += ' 火星のエネルギーで運動欲が高まる時期です。【良いこと】ダンスやテニスなど、楽しく体を動かすことで、心も体もリフレッシュできます。【注意点】張り切りすぎてケガをしないよう、準備運動は忘れずに行いましょう。';
          } else if (influences.mars.action === 'persistent') {
            fortune += ' 火星の持続力で、健康習慣が続けやすい時期です。【良いこと】筋トレやウォーキングなど、継続的な運動がおすすめです。【注意点】同じことばかりだと飽きてしまうので、時には違う運動も試してみることが大切です。';
          }
        }

        // 長期的な健康管理（土星）
        if (influences.saturn && influences.saturn.discipline === 'strong') {
          fortune += ' 土星の影響で、将来の健康を考える良いタイミングです。【良いこと】定期検診を受けたり、栄養バランスを考えた食事を心がけることが効果的です。【注意点】完璧を求めすぎず、継続可能な範囲で取り組むことが重要です。';
        }

        return fortune;
      })();

      // 金銭運（金星+木星+土星+太陽+水星の影響）
      const money = (() => {
        let fortune = `${timeCtx.timeframe}の金銭運は、`;

        // 価値観・お金の使い方（金星）
        if (influences.venus) {
          if (influences.venus.love === 'stable') {
            fortune += '金星の安定した影響で、お金の管理が上手になれる時期です。【良いこと】家計簿をつけたり、貯金目標を立てたりすることが効果的です。欲しいものと必要なものを区別して買い物できるようになります。【注意点】「安いから」という理由だけで購入するのは避けましょう。';
          } else if (influences.venus.love === 'romantic') {
            fortune += '金星のロマンチックな影響で、美しいものにお金を使いたくなる時期です。【良いこと】本当に気に入ったものを購入すると、長く大切に使えて結果的にお得になります。【注意点】見た目だけで衝動買いしないよう注意が必要です。';
          }
        }

        // 成長・拡大・幸運（木星）
        if (influences.jupiter) {
          if (influences.jupiter.expansion === 'practical') {
            fortune += ' 木星の実用的な影響で、賢いお金の使い方を学べる時期です。【良いこと】将来のためのスキルアップや資格取得にお金を使うと、後で収入アップにつながる可能性があります。【注意点】「投資」と「浪費」を間違えないよう注意が必要です。';
          } else if (influences.jupiter.expansion === 'adventurous') {
            fortune += ' 木星の冒険的な影響で、新しい収入源を見つけるチャンスです。【良いこと】副業や新しい仕事にチャレンジすると思わぬ収入が得られるかもしれません。【注意点】「絶対に儲かる」という甘い話には十分注意しましょう。';
          }
        }

        // 責任・長期計画（土星）
        if (influences.saturn && influences.saturn.discipline === 'strong') {
          fortune += ' 土星の影響で、将来のお金について真剣に考える良い時期です。【良いこと】少額でも毎月貯金する習慣をつけると、将来大きな差になります。【注意点】節約ばかりで楽しみを削りすぎると続かないので、適度なご褒美も大切にしましょう。';
        }

        // 収入・自己価値（太陽）
        if (influences.sun && influences.sun.energy === 'high') {
          fortune += ' 太陽のエネルギーで、自分の価値を正しく評価できる時期です。【良いこと】頑張った分はきちんと評価してもらいましょう。給与アップの交渉なども良いタイミングです。【注意点】自信過剰になって散財しないよう注意が必要です。';
        }

        // 情報・計画・取引（水星）
        if (influences.mercury && influences.mercury.communication === 'excellent') {
          fortune += ' 水星の影響で、お金の情報収集が得意になる時期です。【良いこと】セール情報をチェックしたり、お得なサービスを見つけたりするのが上手になります。【注意点】情報に振り回されて、本当に必要でないものまで買わないよう気をつけましょう。';
        }

        return fortune;
      })();

      // コミュニケーション運（水星の影響）
      const communication = (() => {
        let fortune = `${timeCtx.timeframe}のコミュニケーション運は、`;

        if (influences.mercury) {
          if (influences.mercury.retrograde) {
            fortune += '水星逆行の時期なので、会話は慎重に行いましょう。【良いこと】いつもより丁寧に話すことで、相手との関係がより深くなります。【注意点】大切な話や約束事は、できれば後回しにした方が無難です。メールやメッセージも送信前に見直すことが大切です。';
          } else if (influences.mercury.communication === 'excellent') {
            fortune += '水星の影響で、コミュニケーション能力が高まる時期です。【良いこと】プレゼンや面接、大切な人との会話で、思った通りに気持ちを伝えられます。【注意点】調子に乗って話しすぎないよう、相手の話もしっかりと聞くことが大切です。';
          } else if (influences.mercury.communication === 'direct') {
            fortune += '水星の影響で、ストレートに気持ちを伝えられる時期です。【良いこと】「ありがとう」や「ごめんなさい」を素直に言えて、人間関係がスムーズになります。【注意点】正直すぎて相手を傷つけないよう、優しい言葉選びを心がけましょう。';
          } else if (influences.mercury.communication === 'practical') {
            fortune += '水星の実用的な影響で、役に立つ話ができる時期です。【良いこと】相手が納得するような、具体的でわかりやすい説明ができます。【注意点】理屈っぽくなりすぎないよう、感情も大切にしましょう。';
          } else {
            fortune += '水星の直感的な影響で、言葉以外でも気持ちが伝わる時期です。【良いこと】表情やジェスチャーで、相手に温かい気持ちを伝えられます。【注意点】「言わなくてもわかるだろう」は禁物です。大切なことはきちんと言葉にしましょう。';
          }
        }

        return fortune;
      })();

      // 成長・学習運（木星+水星の影響）
      const learning = (() => {
        let fortune = `${timeCtx.timeframe}の成長・学習運は、`;

        if (influences.jupiter && influences.mercury) {
          if (influences.jupiter.expansion === 'intellectual' && influences.mercury.communication === 'excellent') {
            fortune += '木星と水星の相乗効果で、学習能力が大幅に向上する時期です。【良いこと】新しいことをどんどん吸収でき、理解する瞬間が多く訪れます。今まで苦手だった分野にもチャレンジしてみましょう。【注意点】学習が楽しくて夜更かしをしてしまうかもしれません。適度に休憩を取ることが大切です。';
          } else if (influences.jupiter.expansion === 'practical') {
            fortune += '木星の実用的な影響で、将来に役立つスキルを身につけられる時期です。【良いこと】資格の勉強や、趣味のスキルアップなど、後で価値を感じられることを始めるチャンスです。【注意点】「これは役に立つだろうか」と迷いすぎず、興味があることは試してみましょう。';
          } else {
            fortune += '木星の影響で、様々なことに興味が湧く時期です。【良いこと】今まで知らなかった世界を知って、視野が広がります。教育番組や本を読むのもおすすめです。【注意点】あれもこれもと手を出しすぎると続かないので、一つずつ楽しんでいきましょう。';
          }
        }

        return fortune;
      })();

      return {
        overall,
        love,
        work,
        health,
        money,
        communication,
        learning
      };
    };

    // 重要な日付の生成（10天体の配置を考慮）
    const generateImportantDates = () => {
      const today = new Date();
      const isRetrograde = planets.some(p => p.retrograde);
      const dominantElement = influences.sun?.element || '火';

      // 今日・明日の占いでは重要な日は表示しない
      if (period === 'today' || period === 'tomorrow') {
        return { cautionDay: null, luckyDay: null };
      }

      // 長期的な占いの場合、重要な年月を生成
      if (timeCtx.isLongTerm) {
        const importantYearMonths = [];
        
        // 太陽の影響による重要な時期
        if (influences.sun?.energy === 'high') {
          const month1 = (today.getMonth() + 4) % 12 + 1;
          const year1 = today.getFullYear() + Math.floor((today.getMonth() + 4) / 12);
          importantYearMonths.push({
            date: `${year1}年${month1}月`,
            reason: '太陽の活発なエネルギーによる転機の時期。新しいスタートや重要な決断に最適です。'
          });
        }
        
        // 木星の影響による重要な時期
        if (influences.jupiter) {
          const month2 = (today.getMonth() + 9) % 12 + 1;
          const year2 = today.getFullYear() + Math.floor((today.getMonth() + 9) / 12);
          importantYearMonths.push({
            date: `${year2}年${month2}月`,
            reason: '木星の拡大の影響で、成長や発展に関する重要な機会が訪れます。'
          });
        }
        
        // 土星の影響による重要な時期
        if (influences.saturn) {
          const month3 = (today.getMonth() + 15) % 12 + 1;
          const year3 = today.getFullYear() + Math.floor((today.getMonth() + 15) / 12);
          importantYearMonths.push({
            date: `${year3}年${month3}月`,
            reason: '土星の影響で人生の重要な節目を迎えます。責任ある決断が求められる時期です。'
          });
        }
        
        return { 
          cautionDay: null, 
          luckyDay: null,
          importantYearMonths: importantYearMonths.slice(0, 2) // 最大2つまで
        };
      }

      // 中期的な占いの場合の注意日・ラッキーデーの生成
      let cautionDay = null;
      let luckyDay = null;
      
      if (period === 'thisWeek' || period === 'nextWeek' || period === 'thisMonth' || period === 'nextMonth') {
        const cautionDate = new Date(today);
        if (isRetrograde) {
          cautionDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 3);
          cautionDay = {
            date: `${cautionDate.getMonth() + 1}月${cautionDate.getDate()}日`,
            reason: '水星逆行の影響で、重要な決断や契約は避けることをお勧めします。'
          };
        } else if (dominantElement === '水') {
          cautionDate.setDate(today.getDate() + Math.floor(Math.random() * 10) + 5);
          cautionDay = {
            date: `${cautionDate.getMonth() + 1}月${cautionDate.getDate()}日`,
            reason: '感情的になりやすい日です。冷静な判断を心がけましょう。'
          };
        }

        if (influences.jupiter) {
          const luckyDate = new Date(today);
          luckyDate.setDate(today.getDate() + Math.floor(Math.random() * 20) + 7);
          luckyDay = {
            date: `${luckyDate.getMonth() + 1}月${luckyDate.getDate()}日`,
            fortune: '木星の幸運な影響で、新しいチャンスや良いニュースが期待できます。'
          };
        }
      }

      return { cautionDay, luckyDay };
    };

    const fortune = generateDetailedFortune();
    const importantDates = generateImportantDates();

    return {
      ...fortune,
      cautionDay: importantDates.cautionDay,
      luckyDay: importantDates.luckyDay,
      importantYearMonths: importantDates.importantYearMonths,
      period,
      timeContext: timeCtx
    };
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

    // AI分析を生成（選択された期間に応じて）
    const aiAnalysisResult = generateSimpleAIAnalysis(sunSign, selectedPeriod);

    // 期間に応じたタイトルを取得
    const getPeriodTitle = () => {
      const option = periodOptions.level1.find(opt => opt.value === selectedPeriod);
      return option ? `${option.label}の占い` : '占い';
    };

    return (
      <div className="level-1">
        <div className="level-title">
          <h2 className="level-title-text">☀️ 太陽星座の簡単占い</h2>
        </div>
        <div className="main-result-card">
          <div className="zodiac-card">
            <h3 className="section-title">⭐ あなたの星座</h3>
            <div className="zodiac-display">
              <div className="zodiac-icon">{signInfo.icon}</div>
              <div className="zodiac-name">{sunSign}</div>
            </div>
          </div>
        </div>

        {/* 星座から見たあなた */}
        {personalityAnalysis?.threeSignAnalysis && (
          <div className="ai-analysis-section">
            <h3 className="section-title">🌟 AI星座分析</h3>
            <div className="analysis-content">
              <p className="analysis-text">{formatSectionTitles(personalityAnalysis.threeSignAnalysis.combinedAnalysis.overview)}</p>
            </div>
          </div>
        )}

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
          
          {level1Fortune && !isGeneratingLevel1 && (
            <div className="five-fortunes-section">
              <h3>🔮 AI占い結果 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  // AI生成結果を【】セクションで分割
                  const parseAIFortune = (fortuneText: string) => {
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
                    
                    sectionMatches.forEach(section => {
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
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
                    
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level1Fortune);
                  
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
                      
                      {fortuneSections.advice && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 今日のアドバイス</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.advice}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow' && (() => {
                        // 期間に応じて重要な日/月を生成
                        const isLongTerm = ['sixMonths', 'oneYear', 'twoYears', 'threeYears', 'fourYears', 'fiveYears'].includes(selectedPeriod);
                        
                        const generateSpecialPeriods = () => {
                          const today = new Date();
                          
                          if (isLongTerm) {
                            // 長期間は月単位で表示
                            const formatMonth = (date: Date) => {
                              return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                            };
                            
                            const cautionMonth = new Date(today);
                            cautionMonth.setMonth(today.getMonth() + Math.floor(Math.random() * 6) + 1);
                            
                            const luckyMonth = new Date(today);
                            luckyMonth.setMonth(today.getMonth() + Math.floor(Math.random() * 6) + 1);
                            
                            return {
                              cautionPeriod: {
                                period: formatMonth(cautionMonth),
                                reason: '星座の配置により、慎重な判断が求められる月です。重要な決断は避け、内省の時間を持つことが大切です。'
                              },
                              luckyPeriod: {
                                period: formatMonth(luckyMonth),
                                fortune: '星座のエネルギーが調和する特別な月です。新しいことに挑戦したり、大きな変化を迎えるのに最適な時期となるでしょう。'
                              },
                              title: '📅 重要な月'
                            };
                          } else {
                            // 短期間は日単位で表示
                            const formatDate = (date: Date) => {
                              return date.toLocaleDateString('ja-JP', {
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                              });
                            };
                            
                            const cautionDate = new Date(today);
                            cautionDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
                            
                            const luckyDate = new Date(today);
                            luckyDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
                            
                            return {
                              cautionPeriod: {
                                period: formatDate(cautionDate),
                                reason: '星座の配置により、焦らずに慎重な行動を心がける日です。重要な決断は避け、リラックスできる時間を作ることが大切です。'
                              },
                              luckyPeriod: {
                                period: formatDate(luckyDate),
                                fortune: '星座のエネルギーが調和する特別な日です。新しいことに挑戦したり、大切な人との時間を過ごすのに最適な日となるでしょう。'
                              },
                              title: '📅 重要な日'
                            };
                          }
                        };
                        
                        const specialPeriods = generateSpecialPeriods();
                        
                        return (
                          <div className="fortune-card special-days-card">
                            <h4 className="fortune-title">{specialPeriods.title}</h4>
                            <div className="fortune-content">
                              <div className="special-day-item">
                                <p className="day-line">🌟 {specialPeriods.luckyPeriod.period}</p>
                                <p className="day-message">{specialPeriods.luckyPeriod.fortune}</p>
                              </div>
                              <div className="special-day-item">
                                <p className="day-line">⚠️ {specialPeriods.cautionPeriod.period}</p>
                                <p className="day-message">{specialPeriods.cautionPeriod.reason}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* 次のレベル予告 */}
        <div className="next-level-preview">
          <h4>🔮 「3天体の本格占い」とは</h4>
          <p className="next-level-description">{nextLevelDescriptions.level1.description}</p>
          <div className="next-level-benefits">
            {nextLevelDescriptions.level1.benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <span className="benefit-icon">{benefit.icon}</span>
                <div className="benefit-content">
                  <span className="benefit-text">{benefit.text}</span>
                  <span className="benefit-detail">{benefit.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // レベル2の表示
  const renderLevel2 = () => {
    if (mainPlanets.length === 0) return null;

    // 3つの星座の組み合わせ分析を生成
    const sunPlanet = mainPlanets.find(p => p.planet === '太陽');
    const moonPlanet = mainPlanets.find(p => p.planet === '月');
    const risingPlanet = mainPlanets.find(p => p.planet === '上昇星座');
    
    const threeSignAnalysis = sunPlanet && moonPlanet && risingPlanet 
      ? generateThreeSignAnalysis(sunPlanet.sign, moonPlanet.sign, risingPlanet.sign)
      : null;

    // 天体名を日本語タイトルに変換（絵文字付き）
    const getPlanetTitle = (planetName: string) => {
      switch(planetName) {
        case '太陽': return '☀️あなたの太陽星座';
        case '月': return '🌙あなたの月星座';
        case '上昇星座': return '🔺あなたの上昇星座';
        default: return `あなたの${planetName}`;
      }
    };

    // 詳細な説明に変更（短縮版）
    const getSimpleDescription = (planetName: string) => {
      switch(planetName) {
        case '太陽': return 'あなたの基本的な性格や人生の目標を表します。';
        case '月': return 'あなたの内面的な感情やプライベートな自分を表します。';
        case '上昇星座': return 'あなたの第一印象や外見的特徴、人との接し方を表します。';
        default: return planetDescriptions[planetName]?.description || '';
      }
    };

    return (
      <div className="level-2">
        <div className="level-title">
          <h2 className="level-title-text">🌙✨ ３天体の本格占い</h2>
        </div>

        {/* あなたの3天体 - 外側のボックスのみ使用 */}
        <div className="main-result-card">
          <h3 className="section-title">🌟 あなたの3天体</h3>
          <div className="three-planets-display">
            {mainPlanets.map((planet, index) => (
              <div key={index} className="single-planet-info">
                <h4 className="planet-subtitle">{getPlanetTitle(planet.planet)}</h4>
                <div className="planet-sign">
                  <div className="sign-display">
                    <span className="sign-icon">{zodiacInfo[planet.sign]?.icon}</span>
                    <span className="sign-name">{planet.sign}</span>
                  </div>
                </div>
                <div className="planet-description">
                  <p>{getSimpleDescription(planet.planet)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3天体からみたあなた */}
        {isGeneratingPersonalityAnalysis && (
          <div className="three-signs-analysis">
            <h3>🌟 3天体からみたあなた</h3>
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>AI分析を生成中...お待ちください</p>
            </div>
          </div>
        )}
        
        {!isGeneratingPersonalityAnalysis && personalityAnalysis?.threeSignAnalysis && (
          <div className="three-signs-analysis">
            <h3>🌟 3天体からみたあなた</h3>
            <div className="combined-analysis-content">
              <div className="analysis-overview">
                <div>{formatSectionTitlesForDisplay(personalityAnalysis.threeSignAnalysis.combinedAnalysis.overview)}</div>
              </div>
              
              <div className="analysis-section">
                <h4 className="analysis-title">☀️ 基本性格</h4>
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.threeSignAnalysis.combinedAnalysis.basicPersonality)}</div>
              </div>
              
              <div className="analysis-section">
                <h4 className="analysis-title">🌙 内面・感情</h4>
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.threeSignAnalysis.combinedAnalysis.innerEmotions)}</div>
              </div>
              
              <div className="analysis-section">
                <h4 className="analysis-title">🔺 第一印象・外見</h4>
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.threeSignAnalysis.combinedAnalysis.firstImpression)}</div>
              </div>
              
              <div className="analysis-section">
                <h4 className="analysis-title">⚖️ 性格のバランス</h4>
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.threeSignAnalysis.combinedAnalysis.personalityBalance)}</div>
              </div>
              
              <div className="analysis-section">
                <h4 className="analysis-title">🤝 人間関係のアドバイス</h4>
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.threeSignAnalysis.combinedAnalysis.relationshipAdvice)}</div>
              </div>
            </div>
          </div>
        )}
        
        {!isGeneratingPersonalityAnalysis && !personalityAnalysis?.threeSignAnalysis && (
          <div className="three-signs-analysis">
            <h3>🌟 3天体からみたあなた</h3>
            <div className="combined-analysis-content">
              <div className="analysis-overview">
                <p>AI分析を準備中です。しばらくお待ちください...</p>
              </div>
            </div>
          </div>
        )}

        {/* 期間選択運勢 - レベル1と同じUIに統一 */}
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
              <p>占っています...お待ちください</p>
            </div>
          )}
          
          {level2Fortune && !isGeneratingLevel2 && (
            <div className="five-fortunes-section">
              <h3>🔮 AI占い結果 - {periodOptions.level2.find(opt => opt.value === selectedPeriod)?.label}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  // AI生成結果を【】セクションで分割
                  const parseAIFortune = (fortuneText: string) => {
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
                    
                    sectionMatches.forEach(section => {
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
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
                      } else if (section.includes('運勢分析') || section.includes('AI占い')) {
                        sections.advice = section.replace(/【[^】]*】/, '').trim();
                      }
                    });
                    
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level2Fortune);
                  
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
                      
                      {fortuneSections.advice && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 運勢分析</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.advice}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow' && (() => {
                        // 期間に応じて重要な日/月を生成
                        const isLongTerm = ['sixMonths', 'oneYear', 'twoYears', 'threeYears', 'fourYears', 'fiveYears'].includes(selectedPeriod);
                        
                        const generateSpecialPeriods = () => {
                          const today = new Date();
                          
                          if (isLongTerm) {
                            // 長期間は月単位で表示
                            const formatMonth = (date: Date) => {
                              return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                            };
                            
                            const cautionMonth = new Date(today);
                            cautionMonth.setMonth(today.getMonth() + Math.floor(Math.random() * 6) + 1);
                            
                            const luckyMonth = new Date(today);
                            luckyMonth.setMonth(today.getMonth() + Math.floor(Math.random() * 6) + 1);
                            
                            return {
                              cautionPeriod: {
                                period: formatMonth(cautionMonth),
                                reason: '3つの星座のエネルギーが少し不調和になる可能性がある月です。焦らずに冷静さを保ちながら行動しましょう。'
                              },
                              luckyPeriod: {
                                period: formatMonth(luckyMonth),
                                fortune: '3つの星座のエネルギーが最高に調和する特別な月です。積極的な行動が良い結果をもたらすでしょう。'
                              },
                              title: '📅 重要な月'
                            };
                          } else {
                            // 短期間は日単位で表示
                            const formatDate = (date: Date) => {
                              return date.toLocaleDateString('ja-JP', {
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                              });
                            };
                            
                            const cautionDate = new Date(today);
                            cautionDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
                            
                            const luckyDate = new Date(today);
                            luckyDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
                            
                            return {
                              cautionPeriod: {
                                period: formatDate(cautionDate),
                                reason: '3つの星座のエネルギーが少し不調和になる可能性があります。焦らずに冷静さを保ちながら行動しましょう。'
                              },
                              luckyPeriod: {
                                period: formatDate(luckyDate),
                                fortune: '3つの星座のエネルギーが最高に調和する特別な日です。積極的な行動が良い結果をもたらすでしょう。'
                              },
                              title: '📅 重要な日'
                            };
                          }
                        };
                        
                        const specialPeriods = generateSpecialPeriods();
                        
                        return (
                          <div className="fortune-card special-days-card">
                            <h4 className="fortune-title">{specialPeriods.title}</h4>
                            <div className="fortune-content">
                              <div className="special-day-item">
                                <p className="day-line">⚠️ {specialPeriods.cautionPeriod.period}</p>
                                <p className="day-message">{specialPeriods.cautionPeriod.reason}</p>
                              </div>
                              <div className="special-day-item">
                                <p className="day-line">🌟 {specialPeriods.luckyPeriod.period}</p>
                                <p className="day-message">{specialPeriods.luckyPeriod.fortune}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* 次のレベル予告 */}
        <div className="next-level-preview">
          <h4>🔮 {nextLevelDescriptions.level2.title}</h4>
          <p className="next-level-description">{nextLevelDescriptions.level2.description}</p>
          <div className="next-level-benefits">
            {nextLevelDescriptions.level2.benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <span className="benefit-icon">{benefit.icon}</span>
                <div className="benefit-content">
                  <span className="benefit-text">{benefit.text}</span>
                  <span className="benefit-detail">{benefit.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // レベル3の表示
  const renderLevel3 = () => {
    if (!horoscopeData?.planets) return null;

    return (
      <div className="level-3">
        <div className="level-title">
          <h2 className="level-title-text">🌌⭐ 10天体の完全占い</h2>
        </div>

        {/* あなたの10天体 */}
        <div className="main-result-card">
          <h3 className="section-title">🌌 あなたの10天体</h3>
          
          {/* 1. 基本性格（太陽・月） */}
          <div className="planet-category-section">
            <h4 className="category-title">🌞 基本性格</h4>
            <div className="planets-section-display">
              {horoscopeData.planets.filter(p => p.planet === '太陽' || p.planet === '月').map((planet, index) => (
                <div key={index} className="single-planet-info">
                  <div className="planet-with-description">
                    <div className="planet-line">
                      {planetDescriptions[planet.planet]?.icon} {planet.planet} {zodiacInfo[planet.sign]?.icon}{planet.sign}
                      {planet.retrograde && <span className="retrograde">℞</span>}
                    </div>
                    <div className="planet-description-text">
                      {planetDescriptions[planet.planet]?.meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 恋愛・行動パターン（金星・火星） */}
          <div className="planet-category-section">
            <h4 className="category-title">💕 恋愛・行動パターン</h4>
            <div className="planets-section-display">
              {horoscopeData.planets.filter(p => p.planet === '金星' || p.planet === '火星').map((planet, index) => (
                <div key={index} className="single-planet-info">
                  <div className="planet-with-description">
                    <div className="planet-line">
                      {planetDescriptions[planet.planet]?.icon} {planet.planet} {zodiacInfo[planet.sign]?.icon}{planet.sign}
                      {planet.retrograde && <span className="retrograde">℞</span>}
                    </div>
                    <div className="planet-description-text">
                      {planetDescriptions[planet.planet]?.meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 仕事・成長・責任（水星・木星・土星） */}
          <div className="planet-category-section">
            <h4 className="category-title">💼 仕事・成長・責任</h4>
            <div className="planets-section-display">
              {horoscopeData.planets.filter(p => p.planet === '水星' || p.planet === '木星' || p.planet === '土星').map((planet, index) => (
                <div key={index} className="single-planet-info">
                  <div className="planet-with-description">
                    <div className="planet-line">
                      {planetDescriptions[planet.planet]?.icon} {planet.planet} {zodiacInfo[planet.sign]?.icon}{planet.sign}
                      {planet.retrograde && <span className="retrograde">℞</span>}
                    </div>
                    <div className="planet-description-text">
                      {planetDescriptions[planet.planet]?.meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 深層心理・世代的特徴（天王星・海王星・冥王星） */}
          <div className="planet-category-section">
            <h4 className="category-title">🌌 深層心理・世代的特徴</h4>
            <div className="planets-section-display">
              {horoscopeData.planets.filter(p => p.planet === '天王星' || p.planet === '海王星' || p.planet === '冥王星').map((planet, index) => (
                <div key={index} className="single-planet-info">
                  <div className="planet-with-description">
                    <div className="planet-line">
                      {planetDescriptions[planet.planet]?.icon} {planet.planet} {zodiacInfo[planet.sign]?.icon}{planet.sign}
                      {planet.retrograde && <span className="retrograde">℞</span>}
                    </div>
                    <div className="planet-description-text">
                      {planetDescriptions[planet.planet]?.meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 10天体からみたあなた */}
        {isGeneratingPersonalityAnalysis && (
          <div className="main-result-card">
            <h3 className="section-title">🌟 10天体からみたあなた</h3>
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>AI分析を生成中...お待ちください</p>
            </div>
          </div>
        )}
        
        {!isGeneratingPersonalityAnalysis && personalityAnalysis?.fourSectionAnalysis && (
          <div className="main-result-card">
            <h3 className="section-title">🌟 10天体からみたあなた</h3>
            
            {/* 1. 基本性格分析 */}
            <div className="analysis-category-section">
              <h4 className="category-title">🌞 基本性格分析</h4>
              <div className="analysis-content">
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.fourSectionAnalysis.basicPersonality)}</div>
              </div>
            </div>

            {/* 2. 恋愛・行動分析 */}
            <div className="analysis-category-section">
              <h4 className="category-title">💕 恋愛・行動分析</h4>
              <div className="analysis-content">
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.fourSectionAnalysis.loveAndAction)}</div>
              </div>
            </div>

            {/* 3. 仕事・成長分析 */}
            <div className="analysis-category-section">
              <h4 className="category-title">💼 仕事・成長分析</h4>
              <div className="analysis-content">
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.fourSectionAnalysis.workAndGrowth)}</div>
              </div>
            </div>

            {/* 4. 深層心理分析 */}
            <div className="analysis-category-section">
              <h4 className="category-title">🌌 深層心理分析</h4>
              <div className="analysis-content">
                <div className="analysis-text">{formatSectionTitlesForDisplay(personalityAnalysis.fourSectionAnalysis.deepPsyche)}</div>
              </div>
            </div>
          </div>
        )}
        
        {!isGeneratingPersonalityAnalysis && !personalityAnalysis?.fourSectionAnalysis && (
          <div className="main-result-card">
            <h3 className="section-title">🌟 10天体からみたあなた</h3>
            <div className="analysis-category-section">
              <div className="analysis-content">
                <p>AI分析を準備中です。しばらくお待ちください...</p>
              </div>
            </div>
          </div>
        )}

        {/* 10天体から見た占い */}
        <div className="period-fortune-section">
          <h3 className="section-title">🔮 10天体から見た占い</h3>
          
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
              <p>占っています...お待ちください</p>
            </div>
          )}
          
          {level3Fortune && !isGeneratingLevel3 && (
            <div className="complete-fortune-section">
              <h3>🌌 AI占い結果 - {periodOptions.level3.find(opt => opt.value === selectedPeriod)?.label}</h3>
              <div className="complete-fortune-grid">
                {(() => {
                  // AI生成結果を【】セクションで分割
                  const parseAIFortune = (fortuneText: string) => {
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
                      communication: '',
                      learning: '',
                      advice: ''
                    };
                    
                    // 【】でセクションを分割
                    const sectionMatches = fortuneText.match(/【[^】]*】[^【]*/g) || [];
                    
                    sectionMatches.forEach(section => {
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
                        sections.overall = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        sections.love = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        sections.work = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        sections.health = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        sections.money = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('コミュニケーション') || section.includes('人間関係')) {
                        sections.communication = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('学習') || section.includes('成長') || section.includes('勉強')) {
                        sections.learning = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('アドバイス') || section.includes('今日の') || section.includes('今週の') || section.includes('今月の')) {
                        sections.advice = section.replace(/【[^】]*】/, '').trim();
                      }
                    });
                    
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
                      
                      {fortuneSections.communication && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💬 コミュニケーション運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.communication}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.learning && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">📚 成長・学習運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.learning}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.advice && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 アドバイス</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.advice}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedPeriod !== 'today' && selectedPeriod !== 'tomorrow' && (() => {
                        // 期間に応じて重要な日/月を生成
                        const isLongTerm = ['sixMonths', 'oneYear', 'twoYears', 'threeYears', 'fourYears', 'fiveYears'].includes(selectedPeriod);
                        
                        const generateSpecialPeriods = () => {
                          const today = new Date();
                          
                          if (isLongTerm) {
                            // 長期間は月単位で表示
                            const formatMonth = (date: Date) => {
                              return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                            };
                            
                            const cautionMonth = new Date(today);
                            cautionMonth.setMonth(today.getMonth() + Math.floor(Math.random() * 6) + 1);
                            
                            const luckyMonth = new Date(today);
                            luckyMonth.setMonth(today.getMonth() + Math.floor(Math.random() * 6) + 1);
                            
                            const importantMonth = new Date(today);
                            importantMonth.setMonth(today.getMonth() + Math.floor(Math.random() * 12) + 1);
                            
                            return {
                              cautionPeriod: {
                                period: formatMonth(cautionMonth),
                                reason: '10天体の配置により、慎重な判断が求められる月です。重要な決断は避け、内省の時間を持つことが大切です。'
                              },
                              luckyPeriod: {
                                period: formatMonth(luckyMonth),
                                fortune: '10天体のエネルギーが調和する特別な月です。創造性と直感が高まり、素晴らしい成果を期待できるでしょう。'
                              },
                              importantPeriod: {
                                period: formatMonth(importantMonth),
                                reason: '天体の配置から重要な変化や気づきがある可能性がある月です。新しい展開に向けて準備を整えましょう。'
                              },
                              title: '📅 重要な月'
                            };
                          } else {
                            // 短期間は日単位で表示
                            const formatDate = (date: Date) => {
                              return date.toLocaleDateString('ja-JP', {
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                              });
                            };
                            
                            const cautionDate = new Date(today);
                            cautionDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
                            
                            const luckyDate = new Date(today);
                            luckyDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
                            
                            const importantDate = new Date(today);
                            importantDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1);
                            
                            return {
                              cautionPeriod: {
                                period: formatDate(cautionDate),
                                reason: '10天体の配置により、慎重な判断が求められる日です。重要な決断は避け、内省の時間を持つことが大切です。'
                              },
                              luckyPeriod: {
                                period: formatDate(luckyDate),
                                fortune: '10天体のエネルギーが調和する特別な日です。創造性と直感が高まり、素晴らしい成果を期待できるでしょう。'
                              },
                              importantPeriod: {
                                period: formatDate(importantDate),
                                reason: '天体の配置から重要な変化や気づきがある可能性があります。新しい展開に向けて準備を整えましょう。'
                              },
                              title: '📅 重要な時期'
                            };
                          }
                        };
                        
                        const specialPeriods = generateSpecialPeriods();
                        
                        return (
                          <div className="fortune-card special-days-card">
                            <h4 className="fortune-title">{specialPeriods.title}</h4>
                            <div className="fortune-content">
                              <div className="special-day-item">
                                <p className="day-line">⚠️ {specialPeriods.cautionPeriod.period}</p>
                                <p className="day-message">{specialPeriods.cautionPeriod.reason}</p>
                              </div>
                              <div className="special-day-item">
                                <p className="day-line">🌟 {specialPeriods.luckyPeriod.period}</p>
                                <p className="day-message">{specialPeriods.luckyPeriod.fortune}</p>
                              </div>
                              <div className="special-day-item">
                                <p className="day-line">🎯 {specialPeriods.importantPeriod.period}</p>
                                <p className="day-message">{specialPeriods.importantPeriod.reason}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>




      </div>
    );
  };

  return (
    <div className="step-result-container">


      {/* レベル別結果表示 */}
      {renderLevelResult()}

      {/* レベルアップボタン */}
      {currentLevel < 3 && (
        <div className="level-up-section">
          <p className="level-up-description">
            {currentLevel === 1 
              ? '太陽・月・上昇星座の組み合わせを見る'
              : '全10天体の完全分析を見る'
            }
          </p>
          <button 
            className="level-up-button"
            onClick={handleLevelUp}
          >
            {currentLevel === 1 ? '3天体の本格占いへ 🔮' : '10天体の完全占い 🌌'}
          </button>
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
          onClick={() => {
            // 占いモード選択に戻る（出生データは保持）
            navigate('/');
          }}
          className="back-button"
          style={{ marginBottom: '0.5rem' }}
        >
          占いモード選択に戻る
        </button>
        <button 
          onClick={() => {
            // 新しい占いを始める（全データリセット）
            localStorage.removeItem('birthData');
            localStorage.removeItem('horoscopeData');
            localStorage.removeItem('selectedMode');
            localStorage.removeItem('starflect_need_three_planets_input');
            // 天体分析データもリセット
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('personality-analysis-')) {
                localStorage.removeItem(key);
              }
            });
            navigate('/');
          }}
          className="back-button"
        >
          新しい占いを始める
        </button>
      </div>
    </div>
  );
};

export default StepByStepResult; 