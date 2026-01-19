import React, { useState, useEffect } from 'react';
import TutorialModal from './TutorialModal';
import { confirmAndClearData, confirmAndClearResultsOnly } from '../utils/dataManager';
import './ModeSelection.css';

interface ModeSelectionProps {
  onSelectMode: (mode: 'sun-sign' | 'ten-planets' | 'ai-chat') => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('starflect_tutorial_completed');
    if (!tutorialCompleted) setShowTutorial(true);
  }, []);

  const modes = [
    {
      id: 'sun-sign',
      title: '太陽の輝き',
      subtitle: '基本性格・運勢',
      icon: '☀️',
      duration: '30秒',
      description: '太陽が司る「表向きの性質」と基本運勢を、AIの智慧とともに読み解きます。',
      gradient: 'linear-gradient(135deg, rgba(253, 224, 71, 0.25) 0%, rgba(234, 179, 8, 0.5) 100%)',
      border: 'rgba(253, 224, 71, 0.5)',
      glow: 'rgba(253, 224, 71, 0.2)'
    },
    {
      id: 'ten-planets',
      title: '星々の共鳴',
      subtitle: '完全ホロスコープ',
      icon: '🌌',
      duration: '2分',
      description: '10天体の配置から、あなたの内面、才能、そして真実の姿を完全解読。',
      gradient: 'linear-gradient(135deg, rgba(125, 211, 252, 0.25) 0%, rgba(14, 165, 233, 0.5) 100%)',
      border: 'rgba(125, 211, 252, 0.5)',
      glow: 'rgba(125, 211, 252, 0.2)'
    },
    {
      id: 'ai-chat',
      title: '星の対話',
      subtitle: 'AI相談',
      icon: '✨',
      duration: '自由形式',
      description: '専属のAI占星術師が、あなたの星の配置に基づき、個別の悩みにお答えします。',
      gradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.25) 0%, rgba(126, 34, 206, 0.5) 100%)',
      border: 'rgba(192, 132, 252, 0.5)',
      glow: 'rgba(192, 132, 252, 0.2)'
    }
  ];

  return (
    <div className="mode-selection-container">
      <div className="tutorial-info-box">
        <button className="tutorial-button-banner theme-gold" onClick={() => setShowTutorial(true)}>
          📖 悠久の星が教える、あなたの真実<br />（使い方ガイド）
        </button>
      </div>
      
      <div className="mode-cards">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className="mode-card"
            style={{ 
              background: mode.gradient, 
              borderColor: mode.border,
              boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${mode.glow}` 
            }}
            onClick={() => onSelectMode(mode.id as 'sun-sign' | 'ten-planets' | 'ai-chat')}
          >
            <div className="mode-icon">{mode.icon}</div>
            <div className="mode-header">
              <h2 className="mode-title">{mode.title}</h2>
              <p className="mode-subtitle">{mode.subtitle}</p>
            </div>
            <p className="mode-description">{mode.description}</p>
            <div className="mode-footer">
              <span className="mode-duration">⏱️ {mode.duration}</span>
              <span className="mode-required">📍 {mode.id === 'sun-sign' ? '生年月日のみ' : '出生時刻・場所が必要'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="reset-data-section section-card">
        <div className="reset-buttons">
          <button className="reset-data-button clear-results theme-gold" onClick={() => confirmAndClearResultsOnly()}>
            🔄 占い結果をクリア
          </button>
          <button className="reset-data-button clear-all theme-gold" onClick={() => confirmAndClearData('全データを削除しますか？')}>
            🗑️ 全データをリセット
          </button>
        </div>
      </div>
        
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default ModeSelection; 
