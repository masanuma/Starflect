import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import ModeSelection from './components/ModeSelection'
import InputForm from './components/InputForm'
import StepByStepResult from './components/StepByStepResult'
import AIFortuneChat from './components/AIFortuneChat'
import { initializeDataManager } from './utils/dataManager';

type FortuneMode = 'sun-sign' | 'ten-planets' | 'ai-chat';

function App() {
  // アプリ初期化時にデータバージョンチェックを実行
  useEffect(() => {
    initializeDataManager();
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        {/* アクセシビリティ: スキップリンク */}
        <a href="#main-content" className="skip-link">
          メインコンテンツにスキップ
        </a>
        
        <header className="App-header" role="banner">
          <div className="header-logo-wrapper">
            <img src="/header-logo.svg" alt="Starflect" className="header-logo-image" />
          </div>
          <p className="subtitle">〜12星座から数百万分の１のあなただけの星占い〜</p>
        </header>
        
        <main id="main-content" role="main">
          <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/result" element={<StepByStepResultWrapper />} />
          </Routes>
        </main>
        
        <footer className="App-footer" role="contentinfo">
          <div className="footer-content">
            <div className="footer-links">
              <a href="/privacy-policy.html" className="footer-link">
                🔒 プライバシーポリシー
              </a>
              <a href="/terms-of-service.html" className="footer-link">
                📋 利用規約
              </a>
            </div>
            <div className="footer-note">
              <p>✨ Starflect - 12星座から数百万分の１のあなただけの星占い</p>
              <p className="disclaimer">
                &copy; 2026 Starflect All Rights Reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

// ホーム画面のラッパー（モード選択 + 条件分岐でInputForm）
function HomeWrapper() {
  const navigate = useNavigate();
  
  // データ不足によるモード選択フラグをチェック
  const missingDataMode = localStorage.getItem('starflect_missing_data_mode');
  
  const [selectedMode, setSelectedMode] = useState<FortuneMode | null>(() => {
    // データ不足によるモード選択が優先
    if (missingDataMode) {
      console.log('🔍 データ不足により自動モード選択:', missingDataMode);
      return missingDataMode as FortuneMode;
    }
    console.log('🔍 通常の初期化 - モード選択画面を表示');
    return null;
  });

  // データ不足から来たかどうかを記録
  const [isFromMissingData] = useState(!!missingDataMode);
  
  console.log('🔍 フラグ状態:');
  console.log('  isFromMissingData:', isFromMissingData);
  console.log('  selectedMode:', selectedMode);

  // フラグの削除はInputFormで行うため、ここでは削除しない
  // ただし、missingDataModeフラグは使用後に削除（useEffect内で削除）
  useEffect(() => {
    if (missingDataMode) {
      localStorage.removeItem('starflect_missing_data_mode');
    }
  }, [missingDataMode]);

  // selectedModeのリセットを監視するuseEffect
  useEffect(() => {
    const handleStorageChange = () => {
      const storedMode = localStorage.getItem('selectedMode');
      if (!storedMode && selectedMode !== null) {
        console.log('🔍 selectedModeがlocalStorageから削除されました。状態をリセットします。');
        setSelectedMode(null);
      }
    };

    // localStorageの変更を監視
    window.addEventListener('storage', handleStorageChange);
    
    // 定期的にlocalStorageをチェック（同一タブでの変更を検知）
    const interval = setInterval(() => {
      const storedMode = localStorage.getItem('selectedMode');
      if (!storedMode && selectedMode !== null) {
        console.log('🔍 selectedModeが削除されました。状態をリセットします。');
        setSelectedMode(null);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedMode]);

  const handleModeSelect = (mode: FortuneMode) => {
    // AI占い師の場合は特別処理
    if (mode === 'ai-chat') {
      console.log('🔍 AI占い師モードを選択しました');
      localStorage.setItem('selectedMode', mode);
      setSelectedMode(mode);
      return;
    }

    // データがそろっているかチェック
    const birthDataRaw = localStorage.getItem('birthData');
    let canSkipInput = false;
    
    if (birthDataRaw) {
      try {
        const birthData = JSON.parse(birthDataRaw);
        
        console.log('🔍 データチェック - モード:', mode);
        console.log('🔍 保存済みデータ:', birthData);
        
        // 各モードに必要なデータがあるかチェック
        switch (mode) {
          case 'sun-sign':
            // 簡単占い：名前と生年月日があればOK
            canSkipInput = birthData.name && birthData.birthDate;
            console.log('🔍 簡単占い - スキップ可能:', canSkipInput);
            break;
          case 'ten-planets':
            // 10天体占い：名前、生年月日、出生時刻、出生地があればOK
            canSkipInput = birthData.name && birthData.birthDate && 
                          birthData.birthTime && birthData.birthPlace && 
                          (birthData.birthPlace.city || birthData.birthPlace.country);
            console.log('🔍 10天体占い - スキップ可能:', canSkipInput);
            console.log('🔍 birthTime:', birthData.birthTime);
            console.log('🔍 birthPlace:', birthData.birthPlace);
            break;
        }
      } catch (error) {
        console.error('出生データの解析エラー:', error);
      }
    }
    
    if (canSkipInput) {
      // 必要なデータがある場合は、モードを設定して結果画面に遷移
      console.log('🔍 データがそろっているため、結果画面に遷移します');
      localStorage.setItem('selectedMode', mode);
      // ページトップに移動
      window.scrollTo(0, 0);
      navigate('/result');
    } else {
      // 必要なデータがない場合は、InputFormを表示
      console.log('🔍 データが不足しているため、InputFormを表示します');
      localStorage.setItem('selectedMode', mode);
      setSelectedMode(mode);
    }
  };

  const handleBackToModeSelection = () => {
    setSelectedMode(null);
    // ページトップに移動
    window.scrollTo(0, 0);
  };

  return (
    <div className="home-wrapper">
      {selectedMode === null ? (
        <ModeSelection onSelectMode={handleModeSelect} />
      ) : selectedMode === 'ai-chat' ? (
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
            {selectedMode === 'sun-sign' && (
              <div className="mode-info simple">
                <h3>⭐ お手軽12星座占い　～12星座から見たあなた</h3>
                <p>生年月日を入力するだけで、あなたの基本的な性格や運勢を占います。</p>
              </div>
            )}
            {selectedMode === 'ten-planets' && (
              <div className="mode-info detailed">
                <h3>🌌⭐ 10天体の完全占い</h3>
                <p>出生時刻と出生地も入力して、全10天体の最も詳細な占星術分析を行います。</p>
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

function StepByStepResultWrapper() {
  // localStorageから選択されたモードを取得
  const selectedMode = localStorage.getItem('selectedMode');
  
  console.log('🔍 【StepByStepResultWrapper】selectedMode:', selectedMode);
  
  return <StepByStepResult selectedMode={selectedMode as 'sun-sign' | 'ten-planets'} />;
}

export default App 