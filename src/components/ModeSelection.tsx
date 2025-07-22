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
      title: 'お手軽12星座占い',
      icon: '🌟',
      duration: '30秒',
      description: '占い初心者でも安心！まずはここから\n気になることはAI占い師に相談',
      features: ['まずは生年月日から', 'AI占い師に相談'],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      required: '生年月日のみ'
    },
    {
      id: 'three-planets',
      title: '星が伝える 隠れた自分診断',
      icon: '🌙✨',
      duration: '1分',
      description: '時刻・場所で隠れた運勢が分かる！\n総合・金銭・恋愛・仕事・成長運を発見',
      features: ['隠れた運勢を発見', '5つの運勢分析', '3天体の複合占い'],
      gradient: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ten-planets',
      title: '星が伝える あなたの印象診断',
      icon: '🌌⭐',
      duration: '2分',
      description: '10天体の完全運勢占い！\n総合・金銭・恋愛・仕事・成長の5つの運勢を詳しく分析',
              features: ['総合運', '金銭運', '恋愛運', '仕事運', '成長運'],
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