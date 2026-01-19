import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import { generateAIAnalysis, AIAnalysisResult } from '../utils/aiAnalyzer';
import { analyzePlanetSignWithAI } from '../utils/aiAnalyzer';

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
  
  const [level3Analysis, setLevel3Analysis] = useState<AIAnalysisResult | null>(null);
  const [isGeneratingLevel3Analysis, setIsGeneratingLevel3Analysis] = useState(false);
  
  const [showDataMissingMessage, setShowDataMissingMessage] = useState(false);
  const [planetDetails, setPlanetDetails] = useState<Record<string, string>>({});
  const [openPlanets, setOpenPlanets] = useState<Set<string>>(new Set());
  
  const [selectedMode, setSelectedMode] = useState<'sun-sign' | 'ten-planets' | undefined>(initialSelectedMode);

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
        
        // 保存された占い結果があれば復元
        const todayStr = new Date().toISOString().split('T')[0];
        const l1Key = `level1_fortune_${birthDataObj.name}_${todayStr}`;
        const savedL1 = localStorage.getItem(l1Key);
        if (savedL1) {
          const parsed = JSON.parse(savedL1);
          setLevel1Fortune(parsed.result);
          setFortunePeriod(parsed.period);
        }

        if (mode === 'ten-planets') {
          const l3Key = `level3_analysis_result_${birthDataObj.name}_${todayStr}`;
          const savedL3 = localStorage.getItem(l3Key);
          if (savedL3) {
            setLevel3Analysis(JSON.parse(savedL3));
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
      const result = await generateAIAnalysis(birthData, horoscopeData.planets, 'simple');
      
      // AI分析結果からテキストを抽出（rawTextが優先、なければ生成）
      const fortuneText = (result as any).rawText || (
        result.todaysFortune ? [
          `【全体運】\n${result.todaysFortune.overallLuck} 評価: ★★★★☆`,
          `【恋愛運】\n${result.todaysFortune.loveLuck} 評価: ★★★★☆`,
          `【仕事運】\n${result.todaysFortune.workLuck} 評価: ★★★★★`,
          `【健康運】\n${result.todaysFortune.healthLuck} 評価: ★★★★☆`,
          `【金銭運】\n${result.todaysFortune.moneyLuck} 評価: ★★★★☆`,
          `【アドバイス】\n${result.todaysFortune.todaysAdvice}`
        ].join('\n\n') : '分析結果の生成に失敗しました。'
      );
      
      setLevel1Fortune(fortuneText);
      
      // ローカルストレージに保存
      const todayStr = new Date().toISOString().split('T')[0];
      const l1Key = `level1_fortune_${birthData.name}_${todayStr}`;
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

  const handleGenerateLevel3Fortune = useCallback(async (period: PeriodSelection) => {
    if (!birthData || !horoscopeData) return;
    
    setIsGeneratingLevel3(true);
    setFortunePeriod(period);
    
    try {
      const result = await generateAIAnalysis(birthData, horoscopeData.planets, 'level3');
      
      // AI分析結果からテキストを抽出（rawTextが優先、なければ生成）
      let fortuneText = (result as any).rawText;

      if (!fortuneText) {
        fortuneText = `
【総合運】
${result.detailedFortune.overallTrend}
評価: ★★★★☆

【恋愛運】
${result.detailedFortune.loveLife}
評価: ★★★☆☆

【仕事運】
${result.detailedFortune.careerPath}
評価: ★★★★★

【健康運】
${result.detailedFortune.healthWellness}
評価: ★★★★☆

【金銭運】
${result.detailedFortune.financialProspects}
評価: ★★★☆☆

【成長運】
${result.detailedFortune.personalGrowth}
評価: ★★★★☆
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
    level3Analysis,
    isGeneratingLevel3Analysis,
    showDataMissingMessage,
    planetDetails,
    openPlanets,
    setSelectedPeriod,
    handleGenerateLevel1Fortune,
    handleGenerateLevel3Fortune,
    handleGenerateLevel3Analysis,
    handlePlanetClick,
    getPeriodTitle,
    selectedMode
  };
};
