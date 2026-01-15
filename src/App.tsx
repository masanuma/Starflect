import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import ModeSelection from './components/ModeSelection'
import InputForm from './components/InputForm'
import StepByStepResult from './components/StepByStepResult'
import AIChat from './components/AIChat'
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
            <Route path="/chat" element={<AIChatWrapper />} />
            <Route path="/ai-fortune" element={<AIFortuneWrapper />} />
            {/* 将来的なSEOコンテンツページのルーティング */}
            <Route path="/zodiac/:sign" element={<ZodiacPageWrapper />} />
            <Route path="/guide/:topic" element={<GuidePageWrapper />} />
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
    // Level2削除により、3天体モードは無効
    console.log('🔍 通常の初期化 - モード選択画面を表示');
    return null;
  });

  // レベルアップから来たかどうかを記録
  const [isFromLevelUp] = useState(false); // Level2削除により常にfalse
  // データ不足から来たかどうかを記録
  const [isFromMissingData] = useState(!!missingDataMode);
  
  console.log('🔍 フラグ状態:');
  console.log('  isFromLevelUp:', isFromLevelUp);
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
          // case 'three-planets': // Level2削除済み
            // 3天体占い：名前、生年月日、出生時刻、出生地があればOK
            canSkipInput = birthData.name && birthData.birthDate && 
                          birthData.birthTime && birthData.birthPlace && 
                          (birthData.birthPlace.city || birthData.birthPlace.country);
            console.log('🔍 3天体占い - スキップ可能:', canSkipInput);
            console.log('🔍 birthTime:', birthData.birthTime);
            console.log('🔍 birthPlace:', birthData.birthPlace);
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
            {false && ( // Level2削除により無効化
              <div className="mode-info detailed">
                <h3>🌙✨ 3天体の本格占い</h3>
                {isFromLevelUp ? (
                  <>
                    <p style={{ color: '#0ea5e9', fontWeight: '600', fontSize: '1.1rem' }}>
                      🔮 3天体の本格占いにレベルアップしました！
                    </p>
                    <p>出生時刻と出生地を追加で入力することで、太陽・月・上昇星座の詳細分析が可能になります。</p>
                  </>
                ) : (
                  <p>出生時刻と出生地も入力して、太陽・月・上昇星座の詳細分析を行います。</p>
                )}
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

// AI占い専用ページのラッパー
function AIFortuneWrapper() {
  return (
    <div className="ai-fortune-wrapper">
      <AIFortuneChat />
    </div>
  );
}

// 段階的結果表示のラッパー
function StepByStepResultWrapper() {
  const navigate = useNavigate();
  
  // localStorageから選択されたモードを取得
  const selectedMode = localStorage.getItem('selectedMode');
  const birthDataRaw = localStorage.getItem('birthData');
  let mode: 'simple' | 'detailed' = 'detailed';
  
  console.log('🔍 【StepByStepResultWrapper】- デバッグ情報:');
  console.log('  selectedMode:', selectedMode);
  console.log('  birthDataRaw:', birthDataRaw);
  console.log('  localStorage全体:', Object.keys(localStorage));
  
  // データ不足チェックはStepByStepResultコンポーネント内で行うため、ここでは削除
  
  if (selectedMode) {
    console.log('🔍 selectedModeが存在します:', selectedMode);
    // 選択されたモードに基づいて判定
    if (selectedMode === 'sun-sign') {
      mode = 'simple';
      console.log('🔍 sun-signのため簡単占いモードに設定');
          } else if (selectedMode === 'ten-planets') {
      mode = 'detailed';
              console.log('🔍 ten-planetsのため詳細占いモードに設定');
    }
  } else {
    console.log('🔍 selectedModeがないため、フォールバック処理を実行');
    // フォールバック: 出生データの内容で判定
    if (birthDataRaw) {
      try {
        const birthData = JSON.parse(birthDataRaw);
        console.log('🔍 出生データ:', birthData);
        console.log('🔍 birthTime:', birthData.birthTime);
        console.log('🔍 birthPlace:', birthData.birthPlace);
        
        // 出生時刻や出生地が設定されていない場合は簡単占いとみなす
        if (!birthData.birthTime || birthData.birthTime === '12:00' || 
            !birthData.birthPlace || birthData.birthPlace.city === '東京') {
          mode = 'simple';
          console.log('🔍 フォールバック: 簡単占いモードに設定');
        } else {
          console.log('🔍 フォールバック: 詳細占いモードに設定');
        }
      } catch (e) {
        console.log('🔍 出生データの解析エラー:', e);
      }
    }
  }
  
  console.log('🔍 【StepByStepResultWrapper】最終的なmode:', mode);
  console.log('🔍 【StepByStepResultWrapper】propsとして渡すselectedMode:', selectedMode);
  
      return <StepByStepResult mode={mode} selectedMode={selectedMode as 'sun-sign' | 'ten-planets'} />;
}

// 将来的なSEOコンテンツページのプレースホルダー
function ZodiacPageWrapper() {
  const navigate = useNavigate();
  
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>🌟 星座別詳細ページ</h2>
      <p>将来的に各星座の詳細情報を掲載予定です。</p>
      <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        ← ホームに戻る
      </button>
    </div>
  );
}

function GuidePageWrapper() {
  const navigate = useNavigate();
  
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>📖 占い解説ページ</h2>
      <p>将来的に占星術の詳細解説を掲載予定です。</p>
      <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        ← ホームに戻る
      </button>
    </div>
  );
}

// 既存のAIチャットのラッパー（既存機能用）
function AIChatWrapper() {
  const navigate = useNavigate();
  const [birthData, setBirthData] = useState<any>(null);
  const [planets, setPlanets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // birthData, planetsをlocalStorageから取得
    const birthDataRaw = localStorage.getItem('birthData');
    let parsedBirthData = null;
    if (birthDataRaw) {
      parsedBirthData = JSON.parse(birthDataRaw);
      if (parsedBirthData.birthDate) parsedBirthData.birthDate = new Date(parsedBirthData.birthDate);
    }
    
    const planetsRaw = localStorage.getItem('horoscopeData');
    let parsedPlanets = [];
    if (planetsRaw) {
      try {
        const parsed = JSON.parse(planetsRaw);
        parsedPlanets = parsed.planets || [];
      } catch {}
    }
    
    // データがない場合は自動的にトップページにリダイレクト
    if (!parsedBirthData || !parsedPlanets.length) {
      console.log('🔍 AIチャット: 必要なデータがないため、トップページにリダイレクトします');
      navigate('/');
      return;
    }
    
    // データがある場合は状態を設定
    setBirthData(parsedBirthData);
    setPlanets(parsedPlanets);
    setIsLoading(false);
  }, [navigate]);
  
  // ローディング中または データがない場合は何も表示しない
  if (isLoading || !birthData || !planets.length) {
    return null;
  }
  
  return <AIChat birthData={birthData} planets={planets} />;
}

export default App 