import React, { useState, useEffect } from 'react';
import TutorialModal from './TutorialModal';
import './ModeSelection.css';

interface ModeSelectionProps {
  onSelectMode: (mode: 'simple' | 'detailed' | 'ai') => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  const [showTutorial, setShowTutorial] = useState(false);

  // 初回訪問時のチュートリアル表示判定
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('starflect_tutorial_completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  const modes = [
    {
      id: 'simple',
      title: '簡単占い',
      icon: '🌟',
      duration: '30秒',
      description: '生年月日だけで基本的な性格を占います',
      features: ['星座', '星座から見たあなた', '今日の占い'],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      required: '生年月日のみ'
    },
    {
      id: 'detailed',
      title: '詳しい占い',
      icon: '🔮',
      duration: '2分',
      description: '詳細な出生データで本格的な占星術分析',
      features: ['全10天体', 'AI分析', '詳しい運勢'],
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ai',
      title: 'AI占い',
      icon: '🤖',
      duration: '対話式',
      description: 'AIとチャットしながら、あなたの質問に答えます',
      features: ['対話形式', 'カスタム質問', 'リアルタイム回答'],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      required: '何でも聞いてみてください'
    }
  ];

  return (
    <div className="mode-selection-container">
      <div className="mode-selection-header">
        <h2 className="mode-title">占いモードを選択してください</h2>
        <p className="mode-subtitle">あなたに合った占い方法をお選びください</p>
      </div>
      
      <div className="mode-cards">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className="mode-card"
            style={{ background: mode.gradient }}
            onClick={() => onSelectMode(mode.id as 'simple' | 'detailed' | 'ai')}
          >
            <div className="mode-card-content">
              <div className="mode-icon">{mode.icon}</div>
              <h3 className="mode-card-title">{mode.title}</h3>
              <div className="mode-duration">{mode.duration}</div>
              <p className="mode-description">{mode.description}</p>
              
              <div className="mode-features">
                {mode.features.map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
              </div>
              
              <div className="mode-required">
                <span className="required-label">必要な情報:</span>
                <span className="required-text">{mode.required}</span>
              </div>
              
              <button className="mode-select-button">
                このモードで始める
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mode-help">
        <p>💡 迷ったら「簡単占い」からお試しください</p>
      </div>
      
      {/* チュートリアルモーダル */}
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={handleCloseTutorial} 
      />
    </div>
  );
};

export default ModeSelection; 