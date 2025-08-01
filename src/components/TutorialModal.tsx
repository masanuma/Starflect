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
      title: "🌟 あなたも知ってる12星座占い",
      content: "雑誌やテレビで見る星座占い。\n「4月1日生まれは牡羊座」みたいに、生年月日で12種類に分かれますよね。\n\nでも、ちょっと疑問に思いませんか？",
      image: "✨",
      highlight: ""
    },
    {
      title: "🤔 同じ星座の人はみんな同じ？",
      content: "同じ牡羊座でも、朝生まれの人と夜生まれの人。\n東京生まれの人と大阪生まれの人。\n\n本当にみんな同じ性格でしょうか？",
      image: "🤔",
      highlight: ""
    },
    {
      title: "🌙 衝撃の事実：月星座があった！",
      content: "実は「月星座」というものもあるんです！\n\n生まれた時に月がどの星座の位置にあったかで、あなたの感情や本音の部分が決まります。月は約2時間で星座が変わるので、同じ日に生まれても出生時刻が違えば月星座も違うんです。\n\nこれが「他人から見たあなたの印象や魅力」に大きく影響します。",
      image: "🌙",
      highlight: ""
    },
    {
      title: "🌅 さらに驚き：上昇星座まで！",
      content: "なんと「上昇星座」というものもあります！\n\n生まれた瞬間に東の地平線から昇っていた星座で、約4分で1度ずつ変わります。出生時刻と出生場所によって「あなたの印象や雰囲気、魅力」が決まるんです。\n\n同じ誕生日・同じ時刻でも、生まれた場所が違えば上昇星座も変わります。",
      image: "🌅",
      highlight: ""
    },
    {
      title: "🌌 もっと衝撃：星は10個もあった！",
      content: "実は占いで使う星は10個もあるんです！\n太陽・月・水星・金星・火星・木星・土星・天王星・海王星・冥王星。\n\n生まれた瞬間に、これら10個の天体がそれぞれどの星座の位置にあったかで、あなたの印象や魅力の違う面を表しています。時刻と場所が分かることで、正確な天体の位置が計算できるんです。",
      image: "🌌",
      highlight: ""
    },
    {
      title: "😲 だから数百万通りになる！",
      content: "これで謎が解けました！\n\n普通の星座占い：太陽星座だけ（12種類）\nStarflect：10個の星×12星座の組み合わせ（数百万通り）\n\n生まれた瞬間の星の配置があなただけの印象と魅力を作り出します。だからこんなに詳しい印象分析が分かるんです！",
      image: "💡",
      highlight: ""
    },
    {
      title: "🤖 AIでもっと深掘りできる",
      content: "さらに！どの占い結果でも、AI占い師とチャットできます。\n\n「恋愛運についてもっと詳しく」\n「仕事の悩みを相談したい」\n\n何でも聞いてみてください！",
      image: "🤖",
      highlight: ""
    },
    {
      title: "📱 使い方は簡単！",
      content: "2つのモードから選んでください：\n\n🌟 お手軽：生年月日だけで30秒（太陽星座占い）\n🌌 あなたの印象診断：時刻・場所も使って本格分析（10天体の詳細診断）\n\n迷ったら「お手軽」から始めて、気に入ったら「印象診断」にレベルアップしましょう！",
      image: "📊",
      highlight: ".mode-cards"
    },
    {
      title: "🔄 結果をやり直したい時は",
      content: "占い結果を最初からやり直したい場合は、\nトップページの「過去の占い結果をクリア」ボタンを押してください。\n\n基本情報は保持されるので、すぐに新しい占いを始められます！",
      image: "🔄",
      highlight: ""
    },
    {
      title: "✅ さあ、あなただけの占いを！",
      content: "普通の12種類から数百万通りの精度へ！\n\nあなただけの詳しい印象分析を体験してみましょう！",
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