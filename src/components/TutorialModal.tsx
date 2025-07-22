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
      content: "普通の星座占いの12種類に対して、Starflectは数百万通りの精度！\nあなただけの詳しい占い結果が分かります。",
      image: "✨",
      highlight: ".mode-cards"
    },
    {
      title: "🌟 お手軽星座占い",
      content: "生年月日だけで30秒で占えます。\n普通の12星座占いと同じですが、AIが詳しく分析してくれます。\n迷ったらここから始めましょう！",
      image: "🌟",
      highlight: ".mode-card:first-child"
    },
    {
      title: "🌙 実は月星座もあるんです",
      content: "太陽星座以外に「月星座」もあります。\n月は約2時間で星座が変わるので、同じ日でも朝と夜で月星座が違います。\n\nこれが「本当の感情やプライベートな自分」を表します。",
      image: "🌙",
      highlight: ""
    },
    {
      title: "🌅 上昇星座で印象が決まる",
      content: "さらに「上昇星座」もあります。\n上昇星座は4分で1度変わるので、出生時刻で「人からの印象」が変わります。\n\nこれで3つの星座の組み合わせ分析ができます。",
      image: "🌅",
      highlight: ".mode-card:nth-child(2)"
    },
    {
      title: "🌌 10天体で数百万通り",
      content: "実は星は10個あります。太陽・月・水星・金星・火星・木星・土星・天王星・海王星・冥王星です。\n\nこれらすべての組み合わせで数百万通りの分析が可能になります。プロの占星術師レベルの精度です。",
      image: "🌌",
      highlight: ".mode-card:nth-child(3)"
    },
    {
      title: "🤖 AIチャットで深掘り",
      content: "どの占い結果でも「もっと詳しく知りたい？」ボタンからAI占い師とチャットできます。\n「恋愛運について詳しく」「仕事の悩み」など、何でも相談してみてください。",
      image: "🤖",
      highlight: ".mode-card:last-child"
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
      content: "これで準備は完了です。\n12種類から数百万通りの精度で、あなただけの詳しい星座占いを体験してみましょう！",
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