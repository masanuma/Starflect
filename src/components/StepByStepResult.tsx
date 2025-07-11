import React, { useState, useEffect, useMemo } from 'react';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';

import './StepByStepResult.css';

// 表示レベルの定義
type DisplayLevel = 1 | 2 | 3;

// 期間選択のタイプ
type PeriodSelection = 'today' | 'thisWeek' | 'thisMonth' | 'tomorrow' | 'nextWeek' | 'nextMonth' | 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'twoYears' | 'threeYears' | 'fourYears' | 'fiveYears';

interface StepByStepResultProps {
  mode?: 'simple' | 'detailed';
  selectedMode?: 'sun-sign' | 'three-planets' | 'ten-planets';
}

const StepByStepResult: React.FC<StepByStepResultProps> = () => {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);
  const [currentLevel, setCurrentLevel] = useState<DisplayLevel>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 期間選択オプション
  const periodOptions = {
    level1: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'nextWeek', label: '来週' },
      { value: 'nextMonth', label: '来月' },
    ],
    level2: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'nextWeek', label: '来週' },
      { value: 'nextMonth', label: '来月' },
      { value: 'oneMonth', label: '1ヶ月' },
      { value: 'threeMonths', label: '3ヶ月' },
      { value: 'sixMonths', label: '6ヶ月' },
    ],
    level3: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'nextWeek', label: '来週' },
      { value: 'nextMonth', label: '来月' },
      { value: 'oneMonth', label: '1ヶ月' },
      { value: 'threeMonths', label: '3ヶ月' },
      { value: 'sixMonths', label: '6ヶ月' },
      { value: 'oneYear', label: '1年' },
      { value: 'twoYears', label: '2年' },
      { value: 'threeYears', label: '3年' },
      { value: 'fourYears', label: '4年' },
      { value: 'fiveYears', label: '5年' },
    ]
  };

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
      keywords: ['完璧主義', '分析力', '奉仕精神', '実用性']
    },
    '天秤座': { 
      icon: '♎', 
      element: '風', 
      quality: '活動', 
      ruling: '金星',
      keywords: ['調和', '美的感覚', '社交性', '公正さ']
    },
    '蠍座': { 
      icon: '♏', 
      element: '水', 
      quality: '固定', 
      ruling: '冥王星',
      keywords: ['深い感情', '洞察力', '変容力', '集中力']
    },
    '射手座': { 
      icon: '♐', 
      element: '火', 
      quality: '柔軟', 
      ruling: '木星',
      keywords: ['自由', '哲学', '冒険', '楽観主義']
    },
    '山羊座': { 
      icon: '♑', 
      element: '土', 
      quality: '活動', 
      ruling: '土星',
      keywords: ['責任感', '野心', '実用性', '忍耐力']
    },
    '水瓶座': { 
      icon: '♒', 
      element: '風', 
      quality: '固定', 
      ruling: '天王星',
      keywords: ['独立性', '革新', '人道主義', '知性']
    },
    '魚座': { 
      icon: '♓', 
      element: '水', 
      quality: '柔軟', 
      ruling: '海王星',
      keywords: ['感受性', '直感', '同情心', '創造性']
    }
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

  // 簡単な占い結果を生成
  const generateSimpleAIAnalysis = (sign: string, period: PeriodSelection = 'today') => {
    return `${sign}の運勢は良好です。`;
  };

  // 完全な占い結果を返す
  const renderLevelResult = () => {
    if (currentLevel === 1) {
      return renderLevel1();
    } else if (currentLevel === 2) {
      return renderLevel2();
    } else if (currentLevel === 3) {
      return renderLevel3();
    }
    return null;
  };

  const renderLevel1 = () => {
    if (!sunSign) return null;
    
    const signInfo = zodiacInfo[sunSign];
    if (!signInfo) return null;

    return (
      <div className="level-1">
        <h2>太陽星座の簡単占い</h2>
        <div className="zodiac-display">
          <div className="zodiac-icon">{signInfo.icon}</div>
          <div className="zodiac-name">{sunSign}</div>
        </div>
        <div className="fortune-content">
          <p>{generateSimpleAIAnalysis(sunSign, selectedPeriod)}</p>
        </div>
      </div>
    );
  };

  const renderLevel2 = () => {
    return (
      <div className="level-2">
        <h2>3天体の本格占い</h2>
        <p>3天体の分析結果を表示します。</p>
      </div>
    );
  };

  const renderLevel3 = () => {
    return (
      <div className="level-3">
        <h2>10天体の完全占い</h2>
        <p>10天体の詳細分析結果を表示します。</p>
      </div>
    );
  };

  // 初期化処理
  useEffect(() => {
    const loadData = async () => {
      const storedData = localStorage.getItem('birthData');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setBirthData(parsed);
          
          // 出生データから天体計算を実行
          const horoscope = await generateCompleteHoroscope(parsed);
          setHoroscopeData(horoscope);
          
          setLoading(false);
        } catch (error) {
          console.error('データの読み込みエラー:', error);
          setError('データの読み込みに失敗しました。');
          setLoading(false);
        }
      } else {
        setError('出生データが見つかりません。');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
  }

  return (
    <div className="step-by-step-result">
      {renderLevelResult()}
    </div>
  );
};

export default StepByStepResult; 