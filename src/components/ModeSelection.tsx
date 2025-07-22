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
      title: 'お手軽星座占い',
      icon: '🌟',
      duration: '30秒',
      description: '生年月日だけで占える！\n雑誌の星座占いより少し詳しく',
      features: ['生年月日のみ', '手軽で簡単', '星座の基本性格'],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      required: '生年月日のみ'
    },
    {
      id: 'three-planets',
      title: '詳しい星座占い',
      icon: '🌙✨',
      duration: '1分',
      description: '月は2時間、上昇星座は4分で変わる！\n時刻・場所でもっと詳しいあなたが判明',
      features: ['3つの星を分析', '詳細な性格分析', '時刻・場所で個別化'],
      gradient: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ten-planets',
      title: 'プロ級星座占い',
      icon: '🌌⭐',
      duration: '2分',
      description: '10天体で数百万通りの組み合わせ\n雑誌占いの12種類とは別次元の精度',
      features: ['全10個の星分析', '最高精度', 'プロレベル占星術'],
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ai-chat',
      title: 'AI占い師チャット',
      icon: '🤖',
      duration: '対話式',
      description: 'AI占い師とチャットしながら\nあなたの質問になんでも答えます',
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
          📖 なぜ数百万分の１なのか？使い方ガイド
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
      
      {/* なぜ詳しいのかの簡潔な説明 */}
      <div className="why-detailed-section">
        <h3 className="why-title">💫 なぜこんなに詳しく占えるの？</h3>
        <div className="why-content">
          <div className="why-item">
            <span className="why-step">1.</span>
            <span className="why-text">普通の星座占い = 太陽星座のみ（12種類）</span>
          </div>
          <div className="why-item">
            <span className="why-step">2.</span>
            <span className="why-text">実は月星座・上昇星座もある（時刻・場所で変わる）</span>
          </div>
          <div className="why-item">
            <span className="why-step">3.</span>
            <span className="why-text">さらに10天体の組み合わせで数百万通りの精度</span>
          </div>
          <div className="why-item">
            <span className="why-step">4.</span>
            <span className="why-text">AIチャットでどんな質問でも深掘り可能</span>
          </div>
        </div>
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