import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ModeSelection from './components/ModeSelection'
import InputForm from './components/InputForm'
import StepByStepResult from './components/StepByStepResult'
import AIChat from './components/AIChat'
import AIFortuneChat from './components/AIFortuneChat'
import './App.css'

type FortuneMode = 'sun-sign' | 'three-planets' | 'ten-planets' | 'ai-chat';

function App() {
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
          <h1>✨ Starflect</h1>
          <p>あなただけの星占い</p>
          <div className="value-proposition">
            <p className="main-message">生まれた瞬間の星の配置から、もっと詳しいあなたを発見</p>
            <div className="comparison-box">
              <div className="comparison-item">
                <span className="comparison-label">雑誌の星座占い</span>
                <span className="comparison-desc">同じ誕生日 = 同じ結果</span>
              </div>
              <div className="comparison-arrow">→</div>
              <div className="comparison-item">
                <span className="comparison-label">Starflect</span>
                <span className="comparison-desc">時刻・場所も考慮 = あなただけの結果</span>
              </div>
            </div>
          </div>
        </header>
        
        <main id="main-content" role="main">
          <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/result" element={<StepByStepResultWrapper />} />
            <Route path="/chat" element={<AIChatWrapper />} />
            <Route path="/ai-fortune" element={<AIFortuneWrapper />} />
          </Routes>
        </main>
        
        <footer className="App-footer" role="contentinfo">
          <div className="footer-content">
            <div className="footer-links">
              <a href="/privacy-policy.html">
                🔒 プライバシーポリシー
              </a>
              <span className="footer-separator">|</span>
              <a href="/terms-of-service.html">
                📋 利用規約
              </a>
            </div>
            <div className="footer-note">
              <p>✨ Starflect - あなただけの星占い</p>
              <p className="disclaimer">※ 当サービスは娯楽目的です。重要な決定には専門家にご相談ください。</p>
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
  
  // レベルアップフラグを先にチェック（削除しない）
  const needThreePlanetsInput = localStorage.getItem('starflect_need_three_planets_input') === 'true';
  // データ不足によるモード選択フラグをチェック
  const missingDataMode = localStorage.getItem('starflect_missing_data_mode');
  
  console.log('🔍 HomeWrapper - フラグチェック:');
  console.log('  needThreePlanetsInput:', needThreePlanetsInput);
  console.log('  missingDataMode:', missingDataMode);
  
  const [selectedMode, setSelectedMode] = useState<FortuneMode | null>(() => {
    // データ不足によるモード選択が優先
    if (missingDataMode) {
      console.log('🔍 データ不足により自動モード選択:', missingDataMode);
      return missingDataMode as FortuneMode;
    }
    // レベルアップから3天体モードでの入力が必要な場合は自動的に3天体モードに設定
    if (needThreePlanetsInput) {
      console.log('🔍 レベルアップフラグが見つかりました。3天体モードに設定します。');
      return 'three-planets';
    }
    console.log('🔍 通常の初期化 - モード選択画面を表示');
    return null;
  });

  // レベルアップから来たかどうかを記録
  const [isFromLevelUp] = useState(needThreePlanetsInput);
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
          case 'three-planets':
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
                <h3>🌟 太陽星座の簡単占い</h3>
                <p>生年月日を入力するだけで、あなたの基本的な性格や運勢を占います。</p>
              </div>
            )}
            {selectedMode === 'three-planets' && (
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
  
  console.log('🔍 StepByStepResultWrapper - デバッグ情報:');
  console.log('  selectedMode:', selectedMode);
  console.log('  birthDataRaw:', birthDataRaw);
  
  // データ不足チェックはStepByStepResultコンポーネント内で行うため、ここでは削除
  
  if (selectedMode) {
    console.log('🔍 selectedModeが存在します:', selectedMode);
    // 選択されたモードに基づいて判定
    if (selectedMode === 'sun-sign') {
      mode = 'simple';
      console.log('🔍 sun-signのため簡単占いモードに設定');
    } else if (selectedMode === 'three-planets' || selectedMode === 'ten-planets') {
      mode = 'detailed';
      console.log('🔍 three-planets/ten-planetsのため詳細占いモードに設定');
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
  
  console.log('🔍 最終的なmode:', mode);
  
  return <StepByStepResult mode={mode} selectedMode={selectedMode as 'sun-sign' | 'three-planets' | 'ten-planets'} />;
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