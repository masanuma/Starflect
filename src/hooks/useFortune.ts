import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import { generateAIAnalysis, AIAnalysisResult } from '../utils/aiAnalyzer';
import { analyzePlanetSignWithAI } from '../utils/aiAnalyzer';

// 保存された古いデータから不要な見出しを削除する関数
const cleanSavedData = (data: any) => {
  if (!data) return data;
  const cleanStr = (s: string) => s.replace(/【?\s*(?:魂の肖像|Soul Portrait|魂の基調講演|光と影のダイナミクス|星々からの具体的な助言|あなたの本当の性格と、人生のテーマ|授かった才能と、気をつけるべき点|今、あなたへ伝えたいアドバイス)\s*】?\s*/g, '').trim();
  
  if (data.soulPortrait) {
    if (data.soulPortrait.keynote) data.soulPortrait.keynote = cleanStr(data.soulPortrait.keynote);
    if (data.soulPortrait.dynamics) data.soulPortrait.dynamics = cleanStr(data.soulPortrait.dynamics);
    if (data.soulPortrait.advice) data.soulPortrait.advice = cleanStr(data.soulPortrait.advice);
  }
  return data;
};

export type PeriodSelection = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'threeMonths' | 'sixMonths' | 'oneYear';

export const useFortune = (initialSelectedMode?: 'sun-sign' | 'ten-planets') => {
  const navigate = useNavigate();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>('today');
  const [fortunePeriod, setFortunePeriod] = useState<PeriodSelection>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [level1Fortune, setLevel1Fortune] = useState<string | null>(null);
  const [level3Fortune, setLevel3Fortune] = useState<string | null>(null);
  const [isGeneratingLevel1, setIsGeneratingLevel1] = useState(false);
  const [isGeneratingLevel3, setIsGeneratingLevel3] = useState(false);
  
  const [level1Analysis, setLevel1Analysis] = useState<AIAnalysisResult | null>(null);
  const [isGeneratingLevel1Analysis, setIsGeneratingLevel1Analysis] = useState(false);
  const [level3Analysis, setLevel3Analysis] = useState<AIAnalysisResult | null>(null);
  const [isGeneratingLevel3Analysis, setIsGeneratingLevel3Analysis] = useState(false);
  
  const [showDataMissingMessage, setShowDataMissingMessage] = useState(false);
  const [planetDetails, setPlanetDetails] = useState<Record<string, string>>({});
  const [openPlanets, setOpenPlanets] = useState<Set<string>>(new Set());
  
  const [selectedMode, setSelectedMode] = useState<'sun-sign' | 'ten-planets' | undefined>(initialSelectedMode);

  // 期間が変更されたらキャッシュから復元を試みる
  useEffect(() => {
    if (birthData) {
      const todayStr = new Date().toISOString().split('T')[0];
      const l1Key = `level1_fortune_${birthData.name}_${selectedPeriod}_${todayStr}`;
      const savedL1 = localStorage.getItem(l1Key);
      if (savedL1) {
        const parsed = JSON.parse(savedL1);
        setLevel1Fortune(parsed.result);
        setFortunePeriod(parsed.period);
      }
    }
  }, [selectedPeriod, birthData]);

  // データ初期化
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const savedBirthData = localStorage.getItem('birthData');
        const savedHoroscopeData = localStorage.getItem('horoscopeData');
        const savedMode = localStorage.getItem('selectedMode');
        
        const mode = (initialSelectedMode || savedMode) as 'sun-sign' | 'ten-planets';
        setSelectedMode(mode);
        
        if (mode === 'ten-planets') {
          setCurrentLevel(3);
        } else {
          setCurrentLevel(1);
        }

        if (!savedBirthData) {
          setShowDataMissingMessage(true);
          setLoading(false);
          return;
        }

        const birthDataObj: BirthData = JSON.parse(savedBirthData);
        if (birthDataObj.birthDate) birthDataObj.birthDate = new Date(birthDataObj.birthDate);
        setBirthData(birthDataObj);

        let horoscope: HoroscopeData;
        if (savedHoroscopeData) {
          horoscope = JSON.parse(savedHoroscopeData);
        } else {
          horoscope = await generateCompleteHoroscope(birthDataObj);
          localStorage.setItem('horoscopeData', JSON.stringify(horoscope));
        }
        setHoroscopeData(horoscope);
        
        // 保存された占い結果があれば復元（現在の期間に合わせて）
        const todayStr = new Date().toISOString().split('T')[0];
        const period = (initialSelectedMode === 'ten-planets' ? 'today' : selectedPeriod) as PeriodSelection;
        const l1Key = `level1_fortune_${birthDataObj.name}_${period}_${todayStr}`;
        const savedL1 = localStorage.getItem(l1Key);
        if (savedL1) {
          const parsed = JSON.parse(savedL1);
          setLevel1Fortune(parsed.result);
          setFortunePeriod(parsed.period);
        } else {
          // 期間指定なしの古いキーも一応チェック
          const oldL1Key = `level1_fortune_${birthDataObj.name}_${todayStr}`;
          const oldSavedL1 = localStorage.getItem(oldL1Key);
          if (oldSavedL1) {
            const parsed = JSON.parse(oldSavedL1);
            setLevel1Fortune(parsed.result);
            setFortunePeriod(parsed.period);
          }
        }

        const l1AnalysisKey = `level1_analysis_result_${birthDataObj.name}_${todayStr}`;
        const savedL1Analysis = localStorage.getItem(l1AnalysisKey);
        if (savedL1Analysis) {
          setLevel1Analysis(cleanSavedData(JSON.parse(savedL1Analysis)));
        }

        if (mode === 'ten-planets') {
          const l3Key = `level3_analysis_result_${birthDataObj.name}_${todayStr}`;
          const savedL3 = localStorage.getItem(l3Key);
          if (savedL3) {
            setLevel3Analysis(cleanSavedData(JSON.parse(savedL3)));
          }
        }

      } catch (err) {
        console.error('Initialization error:', err);
        setError('データの読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [initialSelectedMode]);

  const handleGenerateLevel1Fortune = useCallback(async (period: PeriodSelection) => {
    if (!birthData || !horoscopeData) return;
    
    setIsGeneratingLevel1(true);
    setFortunePeriod(period);
    
    try {
      const sunSign = horoscopeData.planets.find(p => p.planet === '太陽')?.sign || '牡羊座';
      const result = await generateAIAnalysis(birthData, horoscopeData.planets, 'simple', period);
      
      // AI分析結果からテキストを抽出（rawTextが優先、なければ生成）
      const fortuneText = (result as any).rawText || (
        result.todaysFortune ? [
          `【全体運】\n${result.todaysFortune.overallLuck}`,
          `【恋愛運】\n${result.todaysFortune.loveLuck}`,
          `【仕事運】\n${result.todaysFortune.workLuck}`,
          `【健康運】\n${result.todaysFortune.healthLuck}`,
          `【金銭運】\n${result.todaysFortune.moneyLuck}`,
          `【アドバイス】\n${result.todaysFortune.todaysAdvice}`
        ].join('\n\n') : '分析結果の生成に失敗しました。'
      );
      
      setLevel1Fortune(fortuneText);
      
      // もしsoulPortraitが含まれていれば分析結果としても保存
      if (result.soulPortrait?.keynote) {
        setLevel1Analysis(result);
        const todayStr = new Date().toISOString().split('T')[0];
        const l1AnalysisKey = `level1_analysis_result_${birthData.name}_${todayStr}`;
        localStorage.setItem(l1AnalysisKey, JSON.stringify(result));
      }
      
      // ローカルストレージに保存（期間ごとにキーを分ける）
      const todayStr = new Date().toISOString().split('T')[0];
      const l1Key = `level1_fortune_${birthData.name}_${period}_${todayStr}`;
      localStorage.setItem(l1Key, JSON.stringify({
        result: fortuneText,
        period,
        sunSign,
        timestamp: new Date().getTime()
      }));

    } catch (err) {
      console.error('Level 1 generation error:', err);
      setError('占いの生成に失敗しました。再度お試しください。');
    } finally {
      setIsGeneratingLevel1(false);
    }
  }, [birthData, horoscopeData]);

  const handleGenerateLevel1Analysis = useCallback(async () => {
    if (!birthData || !horoscopeData) return;
    
    setIsGeneratingLevel1Analysis(true);
    try {
      const result = await generateAIAnalysis(birthData, horoscopeData.planets, 'simple');
      setLevel1Analysis(result);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const l1AnalysisKey = `level1_analysis_result_${birthData.name}_${todayStr}`;
      localStorage.setItem(l1AnalysisKey, JSON.stringify(result));
    } catch (err) {
      console.error('Level 1 analysis error:', err);
    } finally {
      setIsGeneratingLevel1Analysis(false);
    }
  }, [birthData, horoscopeData]);

  const handleGenerateLevel3Fortune = useCallback(async (period: PeriodSelection) => {
    if (!birthData || !horoscopeData) return;
    
    setIsGeneratingLevel3(true);
    setFortunePeriod(period);
    
    try {
      const result = await generateAIAnalysis(birthData, horoscopeData.planets, 'level3', period);
      
      // AI分析結果からテキストを抽出（rawTextが優先、なければ生成）
      let fortuneText = (result as any).rawText;

      if (!fortuneText) {
        fortuneText = `
【総合運】
${result.detailedFortune.overallTrend}

【恋愛運】
${result.detailedFortune.loveLife}

【仕事運】
${result.detailedFortune.careerPath}

【健康運】
${result.detailedFortune.healthWellness}

【金銭運】
${result.detailedFortune.financialProspects}

【成長運】
${result.detailedFortune.personalGrowth}
        `;
      }
      
      setLevel3Fortune(fortuneText);
    } catch (err) {
      console.error('Level 3 generation error:', err);
      setError('占いの生成に失敗しました。');
    } finally {
      setIsGeneratingLevel3(false);
    }
  }, [birthData, horoscopeData]);

  const handleGenerateLevel3Analysis = useCallback(async () => {
    if (!birthData || !horoscopeData) return;
    
    setIsGeneratingLevel3Analysis(true);
    try {
      const result = await generateAIAnalysis(birthData, horoscopeData.planets, 'level3');
      setLevel3Analysis(result);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const l3Key = `level3_analysis_result_${birthData.name}_${todayStr}`;
      localStorage.setItem(l3Key, JSON.stringify(result));
    } catch (err) {
      console.error('Level 3 analysis error:', err);
    } finally {
      setIsGeneratingLevel3Analysis(false);
    }
  }, [birthData, horoscopeData]);

  const handlePlanetClick = async (planet: string, sign: string) => {
    const key = `${planet}-${sign}`;
    
    // すでに開いている場合は閉じる
    if (openPlanets.has(key)) {
      const newOpenPlanets = new Set(openPlanets);
      newOpenPlanets.delete(key);
      setOpenPlanets(newOpenPlanets);
      return;
    }
    
    // 新しく開く
    const newOpenPlanets = new Set(openPlanets);
    newOpenPlanets.add(key);
    setOpenPlanets(newOpenPlanets);
    
    // すでにデータがある場合は再取得しない
    if (planetDetails[key]) return;
    
    setPlanetDetails(prev => ({ ...prev, [key]: '星のささやきを読み解いています...' }));
    
    try {
      const result = await analyzePlanetSignWithAI(planet, sign);
      // 説明を簡潔にまとめる
      const combinedDetail = `${result.signCharacteristics} ${result.personalImpact} ${result.advice}`;
      setPlanetDetails(prev => ({ ...prev, [key]: combinedDetail }));
    } catch (err) {
      setPlanetDetails(prev => ({ ...prev, [key]: 'データの取得に失敗しました。' }));
    }
  };

  const getPeriodTitle = (period: PeriodSelection) => {
    const titles: Record<string, string> = {
      today: '今日',
      tomorrow: '明日',
      thisWeek: '今週',
      nextWeek: '来週',
      thisMonth: '今月',
      nextMonth: '来月',
      threeMonths: '3か月',
      sixMonths: '半年',
      oneYear: '1年'
    };
    return titles[period] || period;
  };

  return {
    birthData,
    horoscopeData,
    currentLevel,
    selectedPeriod,
    fortunePeriod,
    loading,
    error,
    level1Fortune,
    level3Fortune,
    isGeneratingLevel1,
    isGeneratingLevel3,
    level1Analysis,
    isGeneratingLevel1Analysis,
    level3Analysis,
    isGeneratingLevel3Analysis,
    showDataMissingMessage,
    planetDetails,
    openPlanets,
    setSelectedPeriod,
    handleGenerateLevel1Fortune,
    handleGenerateLevel1Analysis,
    handleGenerateLevel3Fortune,
    handleGenerateLevel3Analysis,
    handlePlanetClick,
    getPeriodTitle,
    selectedMode
  };
};
