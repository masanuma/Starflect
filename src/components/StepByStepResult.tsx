import React, { useState, useEffect, useMemo } from 'react';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import './StepByStepResult.css';

// 表示レベルの定義
type DisplayLevel = 1 | 2 | 3;

// 期間選択のタイプ
type PeriodSelection = 'today' | 'thisWeek' | 'thisMonth' | 'tomorrow' | 'nextWeek' | 'nextMonth' | 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'twoYears' | 'threeYears' | 'fourYears' | 'fiveYears';

interface StepByStepResultProps {
  mode?: 'simple' | 'detailed';
  selectedMode?: 'sun-sign' | 'three-planets' | 'ten-planets';
}

const StepByStepResult: React.FC<StepByStepResultProps> = () => {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);
  const [currentLevel, setCurrentLevel] = useState<DisplayLevel>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level1Fortune, setLevel1Fortune] = useState<string | null>(null);
  const [isGeneratingLevel1, setIsGeneratingLevel1] = useState(false);

  // 期間選択オプション
  const periodOptions = {
    level1: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'nextWeek', label: '来週' },
      { value: 'nextMonth', label: '来月' },
    ]
  };

  // 星座情報の定義
  const zodiacInfo: Record<string, { icon: string; element: string; quality: string; ruling: string; keywords: string[] }> = {
    '牡羊座': { 
      icon: '♈', 
      element: '火', 
      quality: '活動', 
      ruling: '火星',
      keywords: ['リーダーシップ', '積極性', '冒険心', '独立心']
    },
    '牡牛座': { 
      icon: '♉', 
      element: '土', 
      quality: '固定', 
      ruling: '金星',
      keywords: ['安定性', '忍耐力', '美的感覚', '実用性']
    },
    '双子座': { 
      icon: '♊', 
      element: '風', 
      quality: '柔軟', 
      ruling: '水星',
      keywords: ['コミュニケーション', '好奇心', '適応性', '知識欲']
    },
    '蟹座': { 
      icon: '♋', 
      element: '水', 
      quality: '活動', 
      ruling: '月',
      keywords: ['感情豊か', '保護的', '家族愛', '直感力']
    },
    '獅子座': { 
      icon: '♌', 
      element: '火', 
      quality: '固定', 
      ruling: '太陽',
      keywords: ['創造性', '自己表現', '尊厳', '寛大さ']
    },
    '乙女座': { 
      icon: '♍', 
      element: '土', 
      quality: '柔軟', 
      ruling: '水星',
      keywords: ['完璧主義', '分析力', '奉仕精神', '実用性']
    },
    '天秤座': { 
      icon: '♎', 
      element: '風', 
      quality: '活動', 
      ruling: '金星',
      keywords: ['調和', '美的感覚', '社交性', '公正さ']
    },
    '蠍座': { 
      icon: '♏', 
      element: '水', 
      quality: '固定', 
      ruling: '冥王星',
      keywords: ['深い感情', '洞察力', '変容力', '集中力']
    },
    '射手座': { 
      icon: '♐', 
      element: '火', 
      quality: '柔軟', 
      ruling: '木星',
      keywords: ['自由', '哲学', '冒険', '楽観主義']
    },
    '山羊座': { 
      icon: '♑', 
      element: '土', 
      quality: '活動', 
      ruling: '土星',
      keywords: ['責任感', '野心', '実用性', '忍耐力']
    },
    '水瓶座': { 
      icon: '♒', 
      element: '風', 
      quality: '固定', 
      ruling: '天王星',
      keywords: ['独立性', '革新', '人道主義', '知性']
    },
    '魚座': { 
      icon: '♓', 
      element: '水', 
      quality: '柔軟', 
      ruling: '海王星',
      keywords: ['感受性', '直感', '同情心', '創造性']
    }
  };

  // 太陽星座の取得
  const sunSign = useMemo(() => {
    if (!horoscopeData?.planets) return null;
    const sun = horoscopeData.planets.find(p => p.planet === '太陽' || p.planet === 'Sun');
    return sun?.sign || null;
  }, [horoscopeData]);

  // 5つの運勢を生成する関数
  const generateFiveFortunes = (sign: string, period: PeriodSelection = 'today') => {
    const signInfo = zodiacInfo[sign];
    if (!signInfo) return null;

    const timeContext = period === 'today' ? '今日' : period === 'tomorrow' ? '明日' : period === 'thisWeek' ? '今週' : period === 'thisMonth' ? '今月' : period === 'nextWeek' ? '来週' : '来月';

    return {
      overall: `${timeContext}の全体運は、${signInfo.element}の星座らしく${signInfo.element === '火' ? 'エネルギッシュ' : signInfo.element === '土' ? '安定' : signInfo.element === '風' ? 'フレキシブル' : '感情豊か'}な一日になりそうです。${signInfo.keywords[0]}を活かして行動すると良い結果が期待できます。`,
      love: `恋愛運では、${signInfo.ruling}の影響を受けて、${signInfo.element === '火' ? '積極的なアプローチ' : signInfo.element === '土' ? '安定した関係構築' : signInfo.element === '風' ? 'コミュニケーション重視' : '感情を大切にする'}ことがポイントです。`,
      work: `仕事運は、${signInfo.quality}星座の特性を活かして、${signInfo.quality === '活動' ? '新しいプロジェクトに挑戦' : signInfo.quality === '固定' ? '継続的な努力を重視' : '柔軟な対応'}することで成果が得られるでしょう。`,
      health: `健康運では、${signInfo.element}の性質に合わせて、${signInfo.element === '火' ? '適度な運動でエネルギー発散' : signInfo.element === '土' ? '規則正しい生活リズム' : signInfo.element === '風' ? 'ストレス発散と深呼吸' : 'リラックスタイムの確保'}を心がけましょう。`,
      money: `金銭運は、${sign}らしい${signInfo.keywords[1]}を活かして、${signInfo.element === '火' ? '投資や新しい収入源' : signInfo.element === '土' ? '堅実な貯蓄' : signInfo.element === '風' ? '情報収集と賢い買い物' : '直感を信じた判断'}に良い時期です。`
    };
  };

  // AI占い結果を生成する関数
  const handleGenerateLevel1Fortune = async () => {
    if (!sunSign) return;
    
    setIsGeneratingLevel1(true);
    
    try {
      // シミュレートされたAI応答
      const fortunes = generateFiveFortunes(sunSign, selectedPeriod);
      if (fortunes) {
        const aiResult = `【全体運】${fortunes.overall}

【恋愛運】${fortunes.love}

【仕事運】${fortunes.work}

【健康運】${fortunes.health}

【金銭運】${fortunes.money}

【今日のアドバイス】${sunSign}のあなたは、持前の${zodiacInfo[sunSign]?.keywords[0]}を活かして、前向きに行動することで素晴らしい一日になるでしょう。`;
        
        setLevel1Fortune(aiResult);
      }
    } catch (error) {
      console.error('占い生成エラー:', error);
      setLevel1Fortune('申し訳ありません。占いの生成中にエラーが発生しました。');
    } finally {
      setIsGeneratingLevel1(false);
    }
  };

  // レベルアップ処理
  const handleLevelUp = () => {
    if (currentLevel < 3) {
      setCurrentLevel((prev) => (prev + 1) as DisplayLevel);
    }
  };

  // 完全な占い結果を返す
  const renderLevelResult = () => {
    if (currentLevel === 1) {
      return renderLevel1();
    } else if (currentLevel === 2) {
      return renderLevel2();
    } else if (currentLevel === 3) {
      return renderLevel3();
    }
    return null;
  };

  const renderLevel1 = () => {
    if (!sunSign) return null;
    
    const signInfo = zodiacInfo[sunSign];
    if (!signInfo) return null;

    const getPeriodTitle = () => {
      const option = periodOptions.level1.find(opt => opt.value === selectedPeriod);
      return option ? `${option.label}の占い` : '占い';
    };

    return (
      <div className="level-1">
        <div className="level-title">
          <h2 className="level-title-text">☀️ 太陽星座の簡単占い</h2>
        </div>
        <div className="main-result-card">
          <div className="zodiac-card">
            <h3 className="section-title">⭐ あなたの星座</h3>
            <div className="zodiac-display">
              <div className="zodiac-icon">{signInfo.icon}</div>
              <div className="zodiac-name">{sunSign}</div>
            </div>
          </div>
        </div>

        {/* 占い */}
        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い</h3>
          
          <div className="fortune-selector">
            <div className="selector-row">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodSelection)}
                className="period-dropdown"
              >
                {periodOptions.level1.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}の占い
                  </option>
                ))}
              </select>
              
              <button 
                className="generate-fortune-button"
                onClick={handleGenerateLevel1Fortune}
                disabled={isGeneratingLevel1}
              >
                {isGeneratingLevel1 ? '占い中...' : '占う'}
              </button>
            </div>
          </div>
          
          {isGeneratingLevel1 && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>占っています...お待ちください</p>
            </div>
          )}
          
          {level1Fortune && !isGeneratingLevel1 && (
            <div className="five-fortunes-section">
              <h3>🔮 AI占い結果 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  // AI生成結果を【】セクションで分割
                  const parseAIFortune = (fortuneText: string) => {
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
                      advice: ''
                    };
                    
                    // 【】でセクションを分割
                    const sectionMatches = fortuneText.match(/【[^】]*】[^【]*/g) || [];
                    
                    sectionMatches.forEach(section => {
                      if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
                        sections.overall = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('恋愛運') || section.includes('恋愛')) {
                        sections.love = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('仕事運') || section.includes('仕事')) {
                        sections.work = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('健康運') || section.includes('健康')) {
                        sections.health = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
                        sections.money = section.replace(/【[^】]*】/, '').trim();
                      } else if (section.includes('アドバイス') || section.includes('今日の') || section.includes('今週の') || section.includes('今月の')) {
                        sections.advice = section.replace(/【[^】]*】/, '').trim();
                      }
                    });
                    
                    return sections;
                  };
                  
                  const fortuneSections = parseAIFortune(level1Fortune);
                  
                  return (
                    <>
                      {fortuneSections.overall && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 全体運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.overall}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.love && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💕 恋愛運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.love}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.work && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💼 仕事運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.work}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.health && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🏥 健康運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.health}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.money && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">💰 金銭運</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.money}</p>
                          </div>
                        </div>
                      )}
                      
                      {fortuneSections.advice && (
                        <div className="fortune-card">
                          <h4 className="fortune-title">🌟 今日のアドバイス</h4>
                          <div className="fortune-content">
                            <p>{fortuneSections.advice}</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* レベルアップボタン */}
              <div className="level-up-section">
                <button 
                  className="level-up-button"
                  onClick={handleLevelUp}
                >
                  3天体の本格占いへ 🔮
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 戻るボタン */}
        <div className="return-buttons">
          <a href="/" className="return-button secondary">
            占いモード選択に戻る
          </a>
          <a href="/" className="return-button primary">
            新しい占いを始める
          </a>
        </div>
      </div>
    );
  };

  const renderLevel2 = () => {
    return (
      <div className="level-2">
        <h2>3天体の本格占い</h2>
        <p>3天体の分析結果を表示します。</p>
        <button onClick={handleLevelUp}>10天体の完全占いへ 🌌</button>
      </div>
    );
  };

  const renderLevel3 = () => {
    return (
      <div className="level-3">
        <h2>10天体の完全占い</h2>
        <p>10天体の詳細分析結果を表示します。</p>
      </div>
    );
  };

  // 初期化処理
  useEffect(() => {
    const loadData = async () => {
      const storedData = localStorage.getItem('birthData');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setBirthData(parsed);
          
          // 出生データから天体計算を実行
          const horoscope = await generateCompleteHoroscope(parsed);
          setHoroscopeData(horoscope);
          
          setLoading(false);
        } catch (error) {
          console.error('データの読み込みエラー:', error);
          setError('データの読み込みに失敗しました。');
          setLoading(false);
        }
      } else {
        setError('出生データが見つかりません。');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
  }

  return (
    <div className="step-by-step-result">
      {renderLevelResult()}
    </div>
  );
};

export default StepByStepResult; 