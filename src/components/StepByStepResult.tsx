import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFortune, PeriodSelection } from '../hooks/useFortune';
import { zodiacInfo } from '../utils/zodiacData';

// 分割したコンポーネントのインポート
import Level1Section from './Result/Level1Section';
import Level3Section from './Result/Level3Section';
import LoadingScreen from './Result/LoadingScreen';
import ErrorScreen from './Result/ErrorScreen';
import DataMissingMessage from './Result/DataMissingMessage';

import './StepByStepResult.css';

interface StepByStepResultProps {
  selectedMode?: 'sun-sign' | 'ten-planets';
}

const StepByStepResult: React.FC<StepByStepResultProps> = ({ selectedMode: initialSelectedMode }) => {
  const navigate = useNavigate();
  const {
    birthData,
    horoscopeData,
    currentLevel: hookCurrentLevel,
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
    openPlanets,
    planetDetails,
    setSelectedPeriod,
    handleGenerateLevel1Fortune,
    handleGenerateLevel1Analysis,
    handleGenerateLevel3Fortune,
    handleGenerateLevel3Analysis,
    handlePlanetClick,
    selectedMode
  } = useFortune(initialSelectedMode);

  // 手動でのレベル管理（Level1からLevel3への遷移用）
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  
  useEffect(() => {
    if (!loading && hookCurrentLevel) {
      setCurrentLevel(hookCurrentLevel);
    }
  }, [loading, hookCurrentLevel]);

  // 期間選択オプション
  const periodOptions = {
    level1: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'nextWeek', label: '来週' },
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

  if (loading) {
    return <LoadingScreen message="宇宙の星々を計算中..." />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (showDataMissingMessage) {
    return <DataMissingMessage selectedMode={selectedMode as any} />;
  }

  // 太陽星座を取得
  const sunPlanet = horoscopeData?.planets.find(p => p.planet === '太陽');
  const sunSign = sunPlanet?.sign || '不明';
  const signInfo = (zodiacInfo as any)[sunSign];

  const handleLevelUp = () => {
    setCurrentLevel(3);
      window.scrollTo(0, 0);
  };

  const handleNewFortune = () => {
              navigate('/');
  };

  const handleAIChat = () => {
    // 現在のモードを保存してからAIチャットへ
    const currentMode = localStorage.getItem('selectedMode');
                    if (currentMode) {
                      localStorage.setItem('previousMode', currentMode);
    }
    localStorage.setItem('selectedMode', 'ai-chat');
              navigate('/');
  };

                  return (
    <div className="step-by-step-result">
      {currentLevel === 1 && (
        <Level1Section
          sunSign={sunSign}
          signInfo={signInfo}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          periodOptions={periodOptions.level1}
          handleGenerateFortune={() => handleGenerateLevel1Fortune(selectedPeriod as PeriodSelection)}
          isGenerating={isGeneratingLevel1}
          fortune={level1Fortune}
          fortunePeriod={fortunePeriod}
          level1Analysis={level1Analysis}
          isGeneratingAnalysis={isGeneratingLevel1Analysis}
          handleGenerateAnalysis={handleGenerateLevel1Analysis}
          onLevelUp={handleLevelUp}
          onNewFortune={handleNewFortune}
          onAIChat={handleAIChat}
        />
      )}

      {currentLevel === 3 && horoscopeData && birthData && (
        <Level3Section
          horoscopeData={horoscopeData}
          birthData={birthData}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          periodOptions={periodOptions.level3}
          handleGenerateFortune={() => handleGenerateLevel3Fortune(selectedPeriod as PeriodSelection)}
          isGenerating={isGeneratingLevel3}
          fortune={level3Fortune}
          fortunePeriod={fortunePeriod}
          level3Analysis={level3Analysis}
          isGeneratingAnalysis={isGeneratingLevel3Analysis}
          handleGenerateAnalysis={handleGenerateLevel3Analysis}
          openPlanets={openPlanets as any}
          planetDetails={planetDetails}
          handlePlanetClick={handlePlanetClick}
          onNewFortune={handleNewFortune}
          onAIChat={handleAIChat}
        />
      )}
    </div>
  );
};

export default StepByStepResult; 
