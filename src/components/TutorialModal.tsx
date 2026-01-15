import React, { useState, useRef, useEffect } from 'react';
import './TutorialModal.css';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const tutorialSteps = [
    {
      title: "漆黒に刻まれた、あなたという星の軌跡",
      content: "あなたが産声をあげたその瞬間、宇宙の時計は止まり、天上の星々は唯一無二の配置を描きました。それは、一生涯変わることのない、あなただけの「魂の設計図」です。",
      image: "🌌",
      highlight: ""
    },
    {
      title: "12星座の物語、その深淵へ",
      content: "太陽の星座は、あなたの輝きの一片に過ぎません。Starflectは、一般的な占いが触れることのできない、より深層にある「個の真実」を浮き彫りにします。",
      image: "✨",
      highlight: ""
    },
    {
      title: "10天体が織りなす、多層的な自己",
      content: "思考の水星、愛の金星、情熱の火星。10の天体が12の星座と交差するとき、数百万通りの個性が生まれます。出生時刻と場所が、その深淵への扉を開く鍵となります。",
      image: "🪐",
      highlight: ""
    },
    {
      title: "解析を超え、自己の深淵と対峙する",
      content: "膨大な天体データの相関関係を、現代の叡智であるAIが精密に分析。断片的な知識ではなく、あなたの人生を貫く一貫したメッセージを、鮮やかな物語として紡ぎ出します。",
      image: "💎",
      highlight: ""
    },
    {
      title: "専属AI占星術師との、静かな対話",
      content: "星々のささやきを、確かな言葉へと翻訳。疑問を投げかけ、対話を重ねることで、運命の細部はより鮮明に、より美しく解き明かされていくでしょう。",
      image: "📜",
      highlight: ""
    },
    {
      title: "運命を解き放つ、旅の始まり",
      content: "誰かの言葉ではなく、あなたという宇宙が語る真実。本来の輝きを取り戻し、確かな意志で未来を歩むための旅を、ここから始めましょう。",
      image: "✨",
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

  // スクロール位置監視でフェードアウト効果制御
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    // 初期状態で確実にクラスを削除
    contentElement.classList.remove('has-more-content');

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      
      // 実際のテキスト内容をチェック
      const textContent = contentElement.textContent || '';
      const hasActualContent = textContent.trim().length > 0;
      
      // スクロールが必要かどうかをより厳密にチェック
      const isScrollable = scrollHeight > clientHeight + 2; // 2pxの余裕に変更
      
      // 現在のスクロール位置で下にまだコンテンツがあるか
      const canScrollMore = scrollTop + clientHeight < scrollHeight - 5;
      
      // 全ての条件を満たす場合のみ表示
      const hasMoreContent = hasActualContent && isScrollable && canScrollMore;
      
      if (hasMoreContent) {
        contentElement.classList.add('has-more-content');
      } else {
        contentElement.classList.remove('has-more-content');
      }
    };

    // 初期チェック（より長い遅延でレンダリング完了を確実に待つ）
    setTimeout(handleScroll, 200);
    
    // スクロールイベントリスナー追加
    contentElement.addEventListener('scroll', handleScroll);
    
    // リサイズイベントでも再チェック
    const handleResize = () => {
      setTimeout(() => {
        contentElement.classList.remove('has-more-content');
        handleScroll();
      }, 200);
    };
    window.addEventListener('resize', handleResize);
    
    // クリーンアップ
    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentStep]); // currentStepが変わったら再チェック

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
        <div className="tutorial-content" ref={contentRef}>
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