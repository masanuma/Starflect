import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import { generateAIAnalysis, AIAnalysisResult, getEnhancedTransitAnalysis, generateFuturePrediction, FuturePrediction, FutureTimeframe } from '../utils/aiAnalyzer';
import { calculateAllAspects, getSpecificAspectDescription, getSpecificAspectDescriptionSync } from '../utils/aspectCalculator';
import HoroscopeChart from './HoroscopeChart';
import { useNavigate } from 'react-router-dom';

const ResultDisplay: React.FC = React.memo(() => {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [transitAnalysis, setTransitAnalysis] = useState<any>(null);
  const [futurePrediction, setFuturePrediction] = useState<FuturePrediction | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<FutureTimeframe>('今週');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('初期化中...');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [aspectDescriptions, setAspectDescriptions] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  // アスペクト計算をメモ化
  const aspects = useMemo(() => {
    if (!horoscopeData?.planets) return [];
    return calculateAllAspects(horoscopeData.planets);
  }, [horoscopeData?.planets]);

  // 重要なアスペクトをメモ化
  const significantAspects = useMemo(() => {
    return aspects.filter((a: any) => a.exactness >= 50);
  }, [aspects]);

  // アスペクト説明をAIで生成
  useEffect(() => {
    const loadAspectDescriptions = async () => {
      if (significantAspects.length === 0) return;
      
      const descriptions: Record<string, string> = {};
      
      for (const aspect of significantAspects) {
        const key = `${aspect.planet1}-${aspect.planet2}-${aspect.type}`;
        try {
          const description = await getSpecificAspectDescription(
            aspect.planet1, 
            aspect.planet2, 
            aspect.type
          );
          descriptions[key] = description;
        } catch (error) {
          console.error('アスペクト説明生成エラー:', error);
          descriptions[key] = getSpecificAspectDescriptionSync(
            aspect.planet1, 
            aspect.planet2, 
            aspect.type
          );
        }
      }
      
      setAspectDescriptions(descriptions);
    };

    if (significantAspects.length > 0) {
      loadAspectDescriptions();
    }
  }, [significantAspects]);

  // タイムフレームオプション
  const timeframeOptions: FutureTimeframe[] = [
    '今日', '明日', '今週', '来週', '今月', '来月', '1ヶ月', '3ヶ月', '6ヶ月', '1年'
  ];

  // 未来予測生成
  const handleGeneratePrediction = useCallback(async () => {
    if (!birthData || !horoscopeData) return;
    
    setIsPredicting(true);
    try {
      const prediction = await generateFuturePrediction(birthData, horoscopeData.planets, selectedTimeframe);
      setFuturePrediction(prediction);
    } catch (error) {
      console.error('未来予測エラー:', error);
    } finally {
      setIsPredicting(false);
    }
  }, [birthData, horoscopeData, selectedTimeframe]);

  // 初期化関数をメモ化
  const initializeApp = useCallback(async () => {
    try {
      setCurrentStep('出生データを読み込んでいます...');
      
      // データ読み込み確認
      const storedData = localStorage.getItem('birthData');
      
      if (!storedData) {
        throw new Error('出生データが見つかりません。入力画面に戻って情報を入力してください。');
      }

      const data = JSON.parse(storedData);
      if (data.birthDate) {
        data.birthDate = new Date(data.birthDate);
      }
      setBirthData(data);

      setCurrentStep('天体計算を実行中...');
      const horoscope = await generateCompleteHoroscope(data);
      setHoroscopeData(horoscope);

      // 占星術計算結果をlocalStorageに保存（AIチャット用）
      localStorage.setItem('horoscopeData', JSON.stringify(horoscope));

      // AI分析のキャッシュチェック
      const analysisKey = `ai_analysis_${data.name}_${data.birthDate.toISOString().split('T')[0]}`;
      const cachedAnalysis = localStorage.getItem(analysisKey);
      
      if (cachedAnalysis) {
        setCurrentStep('AI分析をキャッシュから読み込み中...');
        const cached = JSON.parse(cachedAnalysis);
        // キャッシュからanalysisオブジェクトを取得
        const analysis = cached.analysis || cached;
        setAiAnalysis(analysis);
        await new Promise(resolve => setTimeout(resolve, 500)); // 体感速度調整
      } else {
        setCurrentStep('AI分析を実行中... (初回は時間がかかります)');
        setIsAiAnalyzing(true);
        
        const analysis = await generateAIAnalysis(data, horoscope.planets);
        
        // キャッシュに保存（analysisオブジェクトのみ）
        const cacheData = {
          analysis: analysis,
          timestamp: Date.now(),
          expiryDays: 7
        };
        localStorage.setItem(analysisKey, JSON.stringify(cacheData));
        setAiAnalysis(analysis);
        setIsAiAnalyzing(false);
      }

      // トランジット分析の実行
      setCurrentStep('今日のトランジット分析中...');
      try {
        const transitData = await getEnhancedTransitAnalysis(data, new Date(), 'detailed');
        setTransitAnalysis(transitData);
      } catch (transitError) {
        console.error('⚠️ トランジット分析エラー:', transitError);
        // トランジット分析が失敗しても、メイン機能は継続
      }

      setCurrentStep('完了');
      setLoading(false);

    } catch (error) {
      console.error('❌ 初期化エラー:', error);
      setError(error instanceof Error ? error.message : '予期しないエラーが発生しました。');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // ナビゲーション関数をメモ化
  const handleChatNavigation = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  const handleNewAnalysis = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // エラー表示
  if (error) {
    return (
      <div className="result-container">
        <div className="result-content">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <h2>エラーが発生しました</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={handleNewAnalysis} className="btn-primary">
                入力画面に戻る
              </button>
              <button onClick={initializeApp} className="btn-secondary">
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ローディング表示（詳細な進行状況付き）
  if (loading || !birthData || !horoscopeData || !aiAnalysis) {
    return (
      <div className="result-container">
        <div className="result-content">
          <div className="loading-message">
            <div className="loading-spinner">🔮</div>
            <h2>{currentStep}</h2>
            <div className="loading-progress">
              <div className="progress-step">
                <span className={birthData ? 'completed' : 'active'}>📊 データ読み込み</span>
              </div>
              <div className="progress-step">
                <span className={horoscopeData ? 'completed' : birthData ? 'active' : 'pending'}>🔮 天体計算</span>
              </div>
              <div className="progress-step">
                <span className={aiAnalysis ? 'completed' : isAiAnalyzing ? 'active' : horoscopeData ? 'active' : 'pending'}>
                  🤖 AI分析 {isAiAnalyzing ? '(実行中...)' : ''}
                </span>
              </div>
            </div>
            
            {isAiAnalyzing && (
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
                🤖 初回のAI分析は1-2分程度かかります。しばらくお待ちください...
              </p>
            )}
            
            {!isAiAnalyzing && aiAnalysis && (
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
                💡 過去の分析結果を読み込みました
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="result-content">
        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <button className="btn-primary" onClick={handleChatNavigation}>
            🤖 AIチャット占い師と話す
          </button>
        </div>
        

        
        <div className="basic-info">
          <h2>📊 基本情報</h2>
          <p><strong>名前:</strong> {birthData.name}</p>
          <p><strong>生年月日:</strong> {birthData.birthDate.toLocaleDateString('ja-JP')}</p>
          <p><strong>出生時刻:</strong> {birthData.birthTime}</p>
          <p><strong>出生地:</strong> {birthData.birthPlace.city}</p>
        </div>

        {/* 太陽星座の詳細表示 */}
        <div className="analysis-section">
          <h2 className="section-title">🌟 10天体から読み解くあなた</h2>
          <div 
            className="planets-list"
            role="region"
            aria-labelledby="personality-section"
            aria-describedby="personality-description"
          >
            <h3 id="personality-section" className="sr-only">性格分析セクション</h3>
            <span id="personality-description" className="sr-only">あなたの太陽星座に基づく性格の特徴を表示しています</span>
            
            {/* AI分析結果表示 */}
            {!isAiAnalyzing && aiAnalysis ? (
              <>
                <div className="planet-list-item">
                  <div className="planet-list-title">✨ あなたの素晴らしい特徴</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section good-traits">
                      <p role="text" aria-label="あなたの良い特徴">{aiAnalysis.personalityInsights?.corePersonality}</p>
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">🎯 注意すべきポイント</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section attention-points">
                      <p role="text" aria-label="注意すべきポイント">{aiAnalysis.personalityInsights?.hiddenTraits}</p>
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">💕 恋愛</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section fortune-love">
                      <p role="text" aria-label="恋愛運">{aiAnalysis.detailedFortune?.loveLife}</p>
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">💼 仕事</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section fortune-career">
                      <p role="text" aria-label="仕事運">{aiAnalysis.detailedFortune?.careerPath}</p>
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">🌈 人間関係</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section fortune-relationships">
                      <p role="text" aria-label="人間関係運">{aiAnalysis.personalityInsights?.relationshipStyle}</p>
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">🎨 あなたへのアドバイス</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section advice">
                      <p role="text" aria-label="あなたへのアドバイス">{aiAnalysis.detailedFortune?.personalGrowth}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="planet-list-item">
                <div className="planet-list-title">🤖 AI分析中...</div>
                <div className="planet-list-analysis">
                  <div className="planet-list-section">
                    <p 
                      role="status" 
                      aria-live="polite" 
                      aria-label="AI分析を実行中です。しばらくお待ちください"
                    >
                      AIがあなたの運勢を詳しく分析しています...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 天体配置セクション */}
        <div className="analysis-section">
          <h2 className="section-title">🌟 あなたの天体配置</h2>
          <div 
            className="planets-list"
            role="region"
            aria-labelledby="planets-section"
            aria-describedby="planets-description"
          >
            <h3 id="planets-section" className="sr-only">天体配置セクション</h3>
            <span id="planets-description" className="sr-only">生まれた時の天体の位置と意味を表示しています</span>

            <div className="planet-list-item">
              <div className="planet-list-title">🌟 あなたの10天体星座とその影響</div>
              <div className="planet-list-analysis">
                {horoscopeData.planets.map((planet, index) => (
                  <div className="planet-list-section" key={index}>
                    <strong>✨ {planet.planet}星座は {planet.sign} です ({planet.degree.toFixed(1)}度)</strong><br/>
                    <strong>星座の特徴:</strong> {aiAnalysis?.planetAnalysis?.[planet.planet]?.signCharacteristics ?? 'データなし'}<br/>
                    <strong>あなたへの影響:</strong> {aiAnalysis?.planetAnalysis?.[planet.planet]?.personalImpact ?? 'データなし'}<br/>
                    <strong>アドバイス:</strong> {aiAnalysis?.planetAnalysis?.[planet.planet]?.advice ?? 'データなし'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* アスペクト分析セクション */}
        <div className="analysis-section">
          <h2 className="section-title">🌟 あなたの天体の関係性</h2>
          <div 
            className="planets-list"
            role="region"
            aria-labelledby="aspects-section"
            aria-describedby="aspects-description"
          >
            <h3 id="aspects-section" className="sr-only">アスペクト分析セクション</h3>
            <span id="aspects-description" className="sr-only">天体同士の角度関係とその意味を表示しています</span>

            <div className="planet-list-item">
              <div className="planet-list-title">⭐ アスペクト分析</div>
              <div className="planet-list-analysis">
                <div className="planet-list-section">
                  <strong>アスペクトとは？</strong><br/>
                  あなたの心の中にある10個の天体同士の関係性のことです。
                  例えば、「やる気（火星）」と「愛情（金星）」がどんな関係にあるかで、
                  あなたの恋愛スタイルや人間関係の特徴が分かります。
                </div>
                <div className="planet-list-section">
                  <strong>🎨 色の見方</strong><br/>
                  <span className="aspect-icon-green">🟢 緑色（ベストフレンド・良い仲間）</span>: 
                  天体同士が協力し合い、あなたの才能を引き出す関係<br/>
                  <span className="aspect-icon-red">🔴 赤色（成長のライバル）</span>: 
                  天体同士が切磋琢磨し、あなたを成長させる関係
                </div>
              </div>
            </div>

            {significantAspects.length > 0 ? (
              <div className="planet-list-item">
                <div className="planet-list-title">💫 重要な天体の関係</div>
                <div className="planet-list-analysis">
                  {significantAspects.map((aspect, index) => (
                    <div key={index} className={`planet-list-section ${aspect.definition.isHarmonious ? 'harmonious' : 'challenging'}`}>
                      <strong>{aspect.planet1} ↔ {aspect.planet2} ({aspect.definition.nameJa}):</strong><br/>
                      関係性: {aspect.definition.meaning}<br/>
                      <strong>あなたへの影響:</strong> {
                        aspectDescriptions[`${aspect.planet1}-${aspect.planet2}-${aspect.type}`] || 
                        getSpecificAspectDescriptionSync(aspect.planet1, aspect.planet2, aspect.type)
                      }
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="planet-list-item">
                <div className="planet-list-title">💫 重要な天体の関係</div>
                <div className="planet-list-analysis">
                  <div className="planet-list-section">
                    現在、重要な天体の関係性は検出されませんでした。
                  </div>
                </div>
              </div>
            )}

            <div className="planet-list-item">
              <div className="planet-list-title">📊 アスペクトチャート</div>
              <div className="planet-list-analysis">
                <div className="planet-list-section">
                  <div className="chart-container">
                    <HoroscopeChart 
                      horoscopeData={horoscopeData} 
                      size={400} 
                      showAspects={true} 
                    />
                  </div>
                  <p className="chart-note">
                    ※ 線の太さは関係性の強さを表しています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* トランジット分析セクション */}
        {transitAnalysis && (
          <div className="analysis-section">
            <h2 className="section-title">🌟 今日の星からのメッセージ</h2>
            <div className="planets-list">
              {/* 今日のガイダンス */}
              <div className="planet-list-item">
                <div className="planet-list-title">💫 今日のあなたへのメッセージ</div>
                <div className="planet-list-analysis">
                  <div className="planet-list-section">
                    <div className="daily-guidance">
                      {transitAnalysis.dailyGuidance}
                    </div>
                  </div>
                </div>
              </div>

              {/* 重要なトランジット */}
              {transitAnalysis.keyInsights && transitAnalysis.keyInsights.length > 0 && (
                <div className="planet-list-item">
                  <div className="planet-list-title">✨ 今日の特別な星の動き</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section">
                      <strong>星の動きって何？</strong><br/>
                      あなたが生まれた時の星の配置と、今日の星の配置を比べることで、今日のあなたに影響する特別なエネルギーが分かります。まるで星があなたに「今日はこんな日ですよ」と教えてくれているようなものです。
                    </div>
                    {transitAnalysis.keyInsights.map((insight: string, index: number) => (
                      <div key={index} className="planet-list-section">
                        <div className="transit-insight">
                          {insight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 未来予測セクション */}
        <div className="analysis-section">
          <h2 className="section-title">🔮 未来予測</h2>
          <div 
            className="planets-list"
            role="region"
            aria-labelledby="prediction-section"
            aria-describedby="prediction-description"
          >
            <h3 id="prediction-section" className="sr-only">未来予測セクション</h3>
            <span id="prediction-description" className="sr-only">選択した期間の運勢予測を表示しています</span>
            
            {/* 期間選択 */}
            <div className="planet-list-item">
              <div className="planet-list-title">📅 予測期間を選択</div>
              <div className="planet-list-analysis">
                <div className="planet-list-section">
                  <div 
                    className="timeframe-selector"
                    role="radiogroup"
                    aria-labelledby="timeframe-label"
                    aria-describedby="timeframe-hint"
                  >
                    <span id="timeframe-label" className="sr-only">予測期間を選択してください</span>
                    <span id="timeframe-hint" className="sr-only">期間を選択後、予測ボタンをクリックしてください</span>
                    {timeframeOptions.map((timeframe) => (
                      <button
                        key={timeframe}
                        className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
                        onClick={() => setSelectedTimeframe(timeframe)}
                        role="radio"
                        aria-checked={selectedTimeframe === timeframe}
                        aria-label={`${timeframe}の運勢を予測`}
                        tabIndex={selectedTimeframe === timeframe ? 0 : -1}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            e.preventDefault();
                            const currentIndex = timeframeOptions.indexOf(selectedTimeframe);
                            const nextIndex = e.key === 'ArrowLeft' 
                              ? (currentIndex - 1 + timeframeOptions.length) % timeframeOptions.length
                              : (currentIndex + 1) % timeframeOptions.length;
                            setSelectedTimeframe(timeframeOptions[nextIndex]);
                          }
                        }}
                      >
                        {timeframe}
                      </button>
                    ))}
                  </div>
                  <div className="generate-section" style={{ marginTop: '16px' }}>
                    <button
                      className="generate-prediction-btn"
                      onClick={handleGeneratePrediction}
                      disabled={isPredicting}
                      aria-label={isPredicting ? "予測を生成中です。しばらくお待ちください" : `${selectedTimeframe}の運勢予測を生成します`}
                      aria-describedby="prediction-btn-hint"
                    >
                      {isPredicting ? '🔮 未来を読み取り中...' : `🌟 ${selectedTimeframe}の運勢を予測する`}
                    </button>
                    <span id="prediction-btn-hint" className="sr-only">期間を選択してからこのボタンをクリックしてください</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 未来予測結果 */}
            {futurePrediction && (
              <>
                <div className="planet-list-item">
                  <div className="planet-list-title">🌟 {futurePrediction.timeframe}の全体運勢</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section">
                      <div className="overall-message">
                        {futurePrediction.overallMessage}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">💕 恋愛運</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section">
                      {futurePrediction.predictions.love}
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">💼 仕事運</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section">
                      {futurePrediction.predictions.career}
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">💪 健康運</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section">
                      {futurePrediction.predictions.health}
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">💰 金運</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section">
                      {futurePrediction.predictions.finance}
                    </div>
                  </div>
                </div>

                <div className="planet-list-item">
                  <div className="planet-list-title">✨ スピリチュアル運</div>
                  <div className="planet-list-analysis">
                    <div className="planet-list-section">
                      {futurePrediction.predictions.spiritual}
                    </div>
                  </div>
                </div>

                {/* 短期間のアドバイス */}
                {futurePrediction.shortTermAdvice && (
                  <div className="planet-list-item">
                    <div className="planet-list-title">🎯 具体的なアドバイス</div>
                    <div className="planet-list-analysis">
                      <div className="planet-list-section">
                        <div className="short-term-advice">
                          {futurePrediction.shortTermAdvice}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 重要な日付 */}
                {futurePrediction.keyDates && futurePrediction.keyDates.length > 0 && (
                  <div className="planet-list-item">
                    <div className="planet-list-title">📆 重要な日付</div>
                    <div className="planet-list-analysis">
                      {futurePrediction.keyDates.map((keyDate, index) => (
                        <div key={index} className="planet-list-section">
                          <div className="key-date-item">
                            <div className="key-date-date">{keyDate.date}</div>
                            <div className="key-date-event">{keyDate.event}</div>
                            <div className="key-date-advice">{keyDate.advice}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div 
          className="action-buttons"
          role="group"
          aria-label="アクション操作"
        >
          <button 
            onClick={handleNewAnalysis} 
            className="btn-primary"
            aria-label="新しい分析を開始します。入力画面に戻ります"
            tabIndex={0}
          >
            新しい分析を開始
          </button>
          <button 
            onClick={handlePrint} 
            className="btn-secondary"
            aria-label="現在の分析結果を印刷します"
            tabIndex={0}
          >
            結果を印刷
          </button>
        </div>
      </div>
    </div>
  );
});

export default ResultDisplay; 