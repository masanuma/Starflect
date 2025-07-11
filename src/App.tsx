import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import ModeSelection from './components/ModeSelection'
import InputForm from './components/InputForm'
import StepByStepResult from './components/StepByStepResult'
import AIChat from './components/AIChat'
import AIFortuneChat from './components/AIFortuneChat'
import './App.css'

type FortuneMode = 'simple' | 'detailed' | 'ai';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>✨ Starflect</h1>
          <p>あなただけの星座占い - 生まれた瞬間の星の配置から、もっと詳しいあなたを発見</p>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/result" element={<StepByStepResultWrapper />} />
            <Route path="/chat" element={<AIChatWrapper />} />
            <Route path="/ai-fortune" element={<AIFortuneWrapper />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

// ホーム画面のラッパー（モード選択 + 条件分岐でInputForm）
function HomeWrapper() {
  const [selectedMode, setSelectedMode] = useState<FortuneMode | null>(null);

  const handleModeSelect = (mode: FortuneMode) => {
    setSelectedMode(mode);
  };

  const handleBackToModeSelection = () => {
    setSelectedMode(null);
  };

  return (
    <div className="home-wrapper">
      {selectedMode === null ? (
        <ModeSelection onSelectMode={handleModeSelect} />
      ) : selectedMode === 'ai' ? (
        <AIFortuneChat />
      ) : (
        <div className="input-form-wrapper">
          {/* 戻るボタン */}
          <div className="back-button-container">
            <button 
              className="back-button"
              onClick={handleBackToModeSelection}
              type="button"
            >
              ← 占いモード選択に戻る
            </button>
          </div>
          
          {/* モード別の説明 */}
          <div className="mode-explanation">
            {selectedMode === 'simple' && (
              <div className="mode-info simple">
                <h3>🌟 簡単占い</h3>
                <p>生年月日を入力するだけで、あなたの基本的な性格や運勢を占います。</p>
              </div>
            )}
            {selectedMode === 'detailed' && (
              <div className="mode-info detailed">
                <h3>🔮 詳しい占い</h3>
                <p>出生時刻と出生地も入力して、より詳細で正確な占い結果を得ましょう。</p>
              </div>
            )}
          </div>
          
          {/* 入力フォーム */}
          <InputForm 
            mode={selectedMode}
            onBackToModeSelection={handleBackToModeSelection}
          />
        </div>
      )}
    </div>
  );
}

// AI占い専用ページのラッパー
function AIFortuneWrapper() {
  return (
    <div className="ai-fortune-wrapper">
      <div className="ai-fortune-header">
        <h2>🤖 AI占い師との対話</h2>
        <p>何でも気軽に相談してください。星座の知識を活かして、あなたの質問にお答えします。</p>
      </div>
      
      <div className="ai-fortune-content">
        <div className="chat-introduction">
          <div className="intro-cards">
            <div className="intro-card">
              <h4>💫 今日の運勢</h4>
              <p>今日のあなたの運勢をお聞かせします</p>
            </div>
            <div className="intro-card">
              <h4>❤️ 恋愛運</h4>
              <p>恋愛に関するアドバイスをお聞かせします</p>
            </div>
            <div className="intro-card">
              <h4>💼 仕事運</h4>
              <p>仕事や キャリアについてご相談ください</p>
            </div>
            <div className="intro-card">
              <h4>💰 金運</h4>
              <p>お金に関する運勢をお聞かせします</p>
            </div>
          </div>
        </div>
        
        <div className="chat-placeholder">
          <p>🚧 AI占い機能は現在開発中です</p>
          <p>近日中にチャット機能を実装予定です。お楽しみに！</p>
          <a href="/" className="back-home-link">
            ← ホームに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

// 段階的結果表示のラッパー
function StepByStepResultWrapper() {
  // localStorageから選択されたモードを取得
  const birthDataRaw = localStorage.getItem('birthData');
  let mode: 'simple' | 'detailed' = 'detailed';
  
  if (birthDataRaw) {
    try {
      const birthData = JSON.parse(birthDataRaw);
      // 出生時刻や出生地が設定されていない場合は簡単占いとみなす
      if (!birthData.birthTime || birthData.birthTime === '12:00' || 
          !birthData.birthPlace || birthData.birthPlace.city === '東京') {
        mode = 'simple';
      }
    } catch {}
  }
  
  return <StepByStepResult mode={mode} />;
}

// 既存のAIチャットのラッパー（既存機能用）
function AIChatWrapper() {
  // birthData, planetsをlocalStorageから取得
  const birthDataRaw = localStorage.getItem('birthData');
  let birthData = null;
  if (birthDataRaw) {
    birthData = JSON.parse(birthDataRaw);
    if (birthData.birthDate) birthData.birthDate = new Date(birthData.birthDate);
  }
  const planetsRaw = localStorage.getItem('horoscopeData');
  let planets = [];
  if (planetsRaw) {
    try {
      const parsed = JSON.parse(planetsRaw);
      planets = parsed.planets || [];
    } catch {}
  }
  if (!birthData || !planets.length) {
    return <div style={{padding: 32}}>必要なデータがありません。最初からやり直してください。</div>;
  }
  return <AIChat birthData={birthData} planets={planets} />;
}

export default App 