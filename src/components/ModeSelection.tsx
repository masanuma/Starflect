import React, { useState, useEffect } from 'react';
import TutorialModal from './TutorialModal';
import { confirmAndClearData } from '../utils/dataManager';
import './ModeSelection.css';

interface ModeSelectionProps {
  onSelectMode: (mode: 'sun-sign' | 'three-planets' | 'ten-planets' | 'ai-chat') => void;
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

  // ローカルDB削除（過去の占い結果をリセット）
  const handleResetData = () => {
    confirmAndClearData(
      '過去の占い結果をすべて削除しますか？\n入力した名前、生年月日、時刻、出生地の情報も削除されます。\nこの操作は取り消せません。'
    );
  };

  const modes = [
    {
      id: 'sun-sign',
      title: '太陽星座の簡単占い',
      icon: '🌟',
      duration: '30秒',
      description: '生年月日だけで基本的な性格を占います\n迷ったらこちら！',
      features: ['太陽星座', '星座から見たあなた', '星座占い'],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      required: '生年月日のみ'
    },
    {
      id: 'three-planets',
      title: '3天体の本格占い',
      icon: '🌙✨',
      duration: '1分',
      description: '太陽・月・上昇星座の組み合わせ分析',
      features: ['3天体', '詳細な性格分析', '3天体の星座占い'],
      gradient: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ten-planets',
      title: '10天体の完全占い',
      icon: '🌌⭐',
      duration: '2分',
      description: '全10天体で最も詳細な占星術分析',
      features: ['全10天体', '完全分析', '10天体の星座占い'],
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ai-chat',
      title: 'AIチャット',
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
      {/* チュートリアルボタンを太陽星座の簡単占いの上に配置 */}
      <div className="tutorial-info-box">
        <button 
          className="tutorial-button-banner"
          onClick={() => setShowTutorial(true)}
        >
          📖 使い方や10天体についてはこちら
        </button>
      </div>
      
      <div className="mode-cards">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className="mode-card"
            style={{ background: mode.gradient }}
            onClick={() => onSelectMode(mode.id as 'sun-sign' | 'three-planets' | 'ten-planets' | 'ai-chat')}
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
            </div>
          </div>
        ))}
      </div>
      

              
        {/* 過去の占い結果をリセットボタン */}
        <div className="reset-data-section">
          <button 
            className="reset-data-button"
            onClick={handleResetData}
          >
            🗑️ 過去の占い結果をリセット
          </button>
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