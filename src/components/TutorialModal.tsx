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
      content: "実は「月星座」というものもあるんです！\n\n生まれた時に月がどの星座の位置にあったかで、あなたの感情や本音の部分が決まります。月は約2時間で星座が変わるので、同じ日に生まれても出生時刻が違えば月星座も違うんです。\n\nこれが「隠れた感情やプライベートな自分」を表します。",
      image: "🌙",
      highlight: ""
    },
    {
      title: "🌅 さらに驚き：上昇星座まで！",
      content: "なんと「上昇星座」というものもあります！\n\n生まれた瞬間に東の地平線から昇っていた星座で、約4分で1度ずつ変わります。出生時刻と出生場所によって「人から見た第一印象や外見的な特徴」が決まるんです。\n\n同じ誕生日・同じ時刻でも、生まれた場所が違えば上昇星座も変わります。",
      image: "🌅",
      highlight: ""
    },
    {
      title: "🌌 もっと衝撃：星は10個もあった！",
      content: "実は占いで使う星は10個もあるんです！\n太陽・月・水星・金星・火星・木星・土星・天王星・海王星・冥王星。\n\n生まれた瞬間に、これら10個の天体がそれぞれどの星座の位置にあったかで、あなたの性格の違う面を表しています。時刻と場所が分かることで、正確な天体の位置が計算できるんです。",
      image: "🌌",
      highlight: ""
    },
    {
      title: "😲 だから数百万通りになる！",
      content: "これで謎が解けました！\n\n普通の星座占い：太陽星座だけ（12種類）\nStarflect：10個の星×12星座の組み合わせ（数百万通り）\n\n生まれた瞬間の星の配置があなただけの個性を作り出します。だからこんなに詳しい占い結果が分かるんです！",
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
      content: "3つのモードから選んでください：\n\n🌟 お手軽：生年月日だけで30秒\n🌙 詳しい：時刻・場所も使って1分\n🌌 プロ級：全部の星で最高精度\n\n迷ったら「お手軽」から始めましょう！",
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
      content: "普通の12種類から数百万通りの精度へ！\n\nあなただけの詳しい星座占いを体験してみましょう！",
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