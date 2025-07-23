import React, { useState, useEffect } from 'react';
import TutorialModal from './TutorialModal';
import { confirmAndClearData, confirmAndClearResultsOnly } from '../utils/dataManager';
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

  // 過去の結果のみクリア（基本情報は保持）
  const handleClearResultsOnly = () => {
    confirmAndClearResultsOnly();
  };

  // 全データクリア（従来の機能）
  const handleResetAllData = () => {
    confirmAndClearData(
      '全てのデータを削除しますか？\n\n入力した名前、生年月日、時刻、出生地の情報も削除されます。\nこの操作は取り消せません。'
    );
  };

  const modes = [
    {
      id: 'sun-sign',
      title: 'お手軽12星座占い',
      icon: '🌟',
      duration: '30秒',
      description: '占い初心者でも安心！\n生まれた日の太陽の位置から基本的な性格を分析\n気になることはAI占い師に相談',
      features: ['太陽星座による基本分析', 'AI占い師に相談'],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      required: '生年月日のみ'
    },
    {
      id: 'three-planets',
      title: '星が伝える 隠れた自分診断',
      icon: '🌙✨',
      duration: '1分',
      description: '時刻・場所で隠れた内面が分かる！\n太陽・月・上昇星座の3天体で本当の自分を発見\n生まれた瞬間の星の位置があなたの深層心理を明かします',
      features: ['月星座で隠れた感情', '上昇星座で第一印象', '3天体の複合診断'],
      gradient: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ten-planets',
      title: '星が伝える あなたの印象診断',
      icon: '🌌⭐',
      duration: '2分',
      description: '10天体で完全分析！\n生まれた瞬間の全ての天体位置から性格・行動・印象を徹底診断\n時刻・場所の情報で天体の正確な位置を計算します',
      features: ['10天体の完全分析', '話し方の特徴', '外面的な行動', '第一印象分析', '社交での振る舞い'],
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      required: '出生時刻・場所も必要'
    },
    {
      id: 'ai-chat',
      title: 'AI占い師チャット',
      icon: '🤖',
      duration: '対話式',
      description: 'AI占い師とチャットしながら\nあなたの質問になんでも答えます\n天体配置を元にしたパーソナライズ回答',
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
            <span className="why-text">実は月星座・上昇星座もある（時刻・場所で天体位置が変わる）</span>
          </div>
          <div className="why-item">
            <span className="why-step">3.</span>
            <span className="why-text">さらに10天体すべての組み合わせで数百万通りの精度</span>
          </div>
          <div className="why-item">
            <span className="why-step">4.</span>
            <span className="why-text">生まれた瞬間の星の配置があなただけの個性を作る</span>
          </div>
          <div className="why-item">
            <span className="why-step">5.</span>
            <span className="why-text">AIチャットでどんな質問でも深掘り可能</span>
          </div>
        </div>
        <div className="why-note">
          <p>
            <strong>💡 重要：</strong>生まれた時刻と場所が分かることで、月や上昇星座、10天体すべての正確な位置を計算できます。
            これにより「あなたがどこの星座の影響を受けているか」が精密に分析でき、より個人的で詳しい占い結果になるのです。
          </p>
        </div>
      </div>

      {/* データクリア機能（2つのボタン） */}
      <div className="reset-data-section">
        <div className="reset-buttons">
          <button 
            className="reset-data-button clear-results"
            onClick={handleClearResultsOnly}
            title="名前・生年月日・時刻・場所は保持して、占い結果のみクリア"
          >
            🔄 過去の占い結果をクリア
          </button>
          <button 
            className="reset-data-button clear-all"
            onClick={handleResetAllData}
            title="名前・生年月日・時刻・場所も含めて全てクリア"
          >
            🗑️ 全データをリセット
          </button>
        </div>
        <div className="reset-buttons-description">
          <p className="reset-note">
            <strong>🔄 占い結果をクリア</strong>：名前・生年月日・時刻・場所は保持して、占い結果のみ削除<br/>
            <strong>🗑️ 全データをリセット</strong>：名前・生年月日・時刻・場所も含めて全て削除
          </p>
        </div>
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