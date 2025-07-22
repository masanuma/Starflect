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
      content: "普通の星座占いより詳しく、あなただけの占い結果が分かります。\n4つの占いモードから選んでみましょう。",
      image: "✨",
      highlight: ".mode-cards"
    },
    {
      title: "🌟 お手軽星座占い",
      content: "生年月日だけで30秒で占えます。\n雑誌の星座占いより少し詳しく分かります。\n迷ったらここから始めましょう！",
      image: "🌟",
      highlight: ".mode-card:first-child"
    },
    {
      title: "🌙✨ 詳しい星座占い",
      content: "時刻と場所も使って3倍詳しく占います。\n同じ誕生日でも、朝生まれと夜生まれで結果が変わる精密占いです。",
      image: "🌙✨",
      highlight: ".mode-card:nth-child(2)"
    },
    {
      title: "🌌 プロ級星座占い",
      content: "全部の星を使った最高精度の占いです。\nプロの占星術師レベルの詳細分析が受けられます。",
      image: "🌌",
      highlight: ".mode-card:nth-child(3)"
    },
    {
      title: "🤖 AI占い師チャット",
      content: "AI占い師とチャット形式で会話できます。\n「恋愛運について詳しく」「仕事の悩み」など、何でも相談してみてください。",
      image: "🤖",
      highlight: ".mode-card:last-child"
    },
    {
      title: "🌌 なぜ詳しく占えるの？",
      content: "雑誌の星座占いは「生年月日」だけですが、実際の星の位置は「時刻」と「場所」でも変わります。\nStarflectは、あなたが生まれた瞬間の星の配置を正確に計算します。",
      image: "🪐",
      highlight: ""
    },
    {
      title: "🎯 段階的に詳しくなる",
      content: "最初は簡単な結果を見て、もっと詳しく知りたくなったら\n「詳しい星座占いへ🔮」「プロ級星座占い🌌」ボタンを押してみてください。",
      image: "📊",
      highlight: ""
    },
    {
      title: "🔄 結果をリセットしたい時",
      content: "占い結果を最初からやり直したい場合は、\nトップページの「過去の占い結果をリセット」ボタンを押してください。",
      image: "🔄",
      highlight: ""
    },
    {
      title: "✅ 準備完了！",
      content: "これで準備は完了です。\nあなただけの詳しい星座占いを体験してみましょう！",
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