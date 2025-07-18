import React, { useState } from 'react';
import './TutorialModal.css';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const tutorialSteps = [
    {
      title: "🌟 Starflectへようこそ！",
      content: "あなただけの星座占いを体験できます。まずは、4つの占いモードから選んでみましょう。",
      image: "✨",
      highlight: ".mode-cards"
    },
    {
      title: "🌟 太陽星座の簡単占い",
      content: "生年月日だけで30秒で占えます。\n迷ったらここから！\n占星術が初めての方におすすめです。",
      image: "🌟",
      highlight: ".mode-card:first-child"
    },
    {
      title: "🌙✨ 3天体の本格占い",
      content: "太陽・月・上昇星座の3天体を分析します。出生時刻と出生地も入力して、より詳細で正確な占い結果を得られます。",
      image: "🌙✨",
      highlight: ".mode-card:nth-child(2)"
    },
    {
      title: "🌌 10天体の完全占い",
      content: "全10天体を使った最も詳細な占星術分析です。最高精度の占い結果を得られます。",
      image: "🌌",
      highlight: ".mode-card:nth-child(3)"
    },
    {
      title: "🤖 AI占い",
      content: "チャット形式でAI占い師に何でも相談できます。対話しながら占いを楽しめます。",
      image: "🤖",
      highlight: ".mode-card:last-child"
    },
    {
      title: "🌌 10天体とは？",
      content: "占星術では太陽・月・水星・金星・火星・木星・土星・天王星・海王星・冥王星の10個の天体の位置を見ます。それぞれが異なる性格や人生の側面を表現しています。",
      image: "🪐",
      highlight: ""
    },
    {
      title: "🎯 段階的な結果表示",
      content: "占い結果は3段階で表示されます。「3天体の本格占いへ🔮」「10天体の完全占い🌌」ボタンを押すと、より詳細な分析が見られます。",
      image: "📊",
      highlight: ""
    },
    {
      title: "🔄 結果のリセット",
      content: "「天体からみたあなた」の結果をリセットしたい場合は、トップページの「過去の占い結果をリセット」ボタンを押してください。新しい分析結果を生成できます。",
      image: "🔄",
      highlight: ""
    },
    {
      title: "✅ 準備完了！",
      content: "これで準備は完了です。あなたの運命を占ってみましょう！",
      image: "🚀",
      highlight: ""
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    localStorage.setItem('starflect_tutorial_completed', 'true');
    onClose();
  };

  const skipTutorial = () => {
    localStorage.setItem('starflect_tutorial_completed', 'true');
    onClose();
  };

  // モーダルの外側をクリックした時の処理
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="tutorial-modal-overlay" onClick={handleModalClick}>
      <div className="tutorial-modal">
        {/* プログレス表示 */}
        <div className="tutorial-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            {currentStep + 1} / {tutorialSteps.length}
          </span>
        </div>

        {/* モーダルヘッダー */}
        <div className="tutorial-header">
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="チュートリアルを閉じる"
          >
            ×
          </button>
        </div>

        {/* チュートリアル内容 */}
        <div className="tutorial-content">
          <div className="tutorial-image">
            <span className="tutorial-icon">{currentTutorialStep.image}</span>
          </div>
          
          <div className="tutorial-text">
            <h3>{currentTutorialStep.title}</h3>
            <p>{currentTutorialStep.content}</p>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="tutorial-navigation">
          <button 
            className="nav-button secondary"
            onClick={skipTutorial}
          >
            スキップ
          </button>
          
          <div className="nav-buttons">
            {currentStep > 0 && (
              <button 
                className="nav-button secondary"
                onClick={prevStep}
              >
                戻る
              </button>
            )}
            
            <button 
              className="nav-button primary"
              onClick={nextStep}
            >
              {currentStep < tutorialSteps.length - 1 ? '次へ' : '始める'}
            </button>
          </div>
        </div>

        {/* ドットインジケーター */}
        <div className="tutorial-dots">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
              aria-label={`ステップ ${index + 1} に移動`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TutorialModal; 