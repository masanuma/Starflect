import React, { useState, useEffect } from 'react';
import { BirthData, HoroscopeData } from '../types';
import { generateCompleteHoroscope } from '../utils/astronomyCalculator';
import { chatWithAIAstrologer } from '../utils/aiAnalyzer';
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
  const [level2Fortune, setLevel2Fortune] = useState<string | null>(null);
  const [level3Fortune, setLevel3Fortune] = useState<string | null>(null);
  const [isGeneratingLevel1, setIsGeneratingLevel1] = useState(false);
  const [isGeneratingLevel2, setIsGeneratingLevel2] = useState(false);
  const [isGeneratingLevel3, setIsGeneratingLevel3] = useState(false);

  // 星座情報
  const zodiacInfo: Record<string, { icon: string; description: string }> = {
    '牡羊座': { 
      icon: '♈', 
      description: '牡羊座のあなたは、活発で勇敢な性格の持ち主です。新しいことに挑戦するのが得意で、情熱的で行動力があります。美的センスに優れ、質の良いものを好み、安定した生活を目指しています。恋愛では、一途でのめり込みやすく、仕事では責任感を持って取り組める結婚を望みます。' 
    },
    '牡牛座': { 
      icon: '♉', 
      description: '牡牛座のあなたは、安定と実堅を重視する現実主義者です。しっかりと物事を考えてから行動することが多く、信頼性があります。美的センスに優れ、質の良いものを好むため、持続的な取り組みが得意です。恋愛では、一途でのめり込みやすく、質の良い深い関係を築くことを目指しています。' 
    },
    '双子座': { 
      icon: '♊', 
      description: '双子座のあなたは、好奇心旺盛で多才な性格です。コミュニケーション能力が高く、新しい情報を素早く吸収するのが得意です。変化を好み、様々なことに興味を持ちます。社交的で明るく、多くの人との繋がりを大切にします。' 
    },
    '蟹座': { 
      icon: '♋', 
      description: '蟹座のあなたは、家族や親しい人を大切にする愛情深い性格です。感受性が豊かで、他人の気持ちを理解するのが得意です。安全で居心地の良い環境を好み、伝統や過去を大切にします。' 
    },
    '獅子座': { 
      icon: '♌', 
      description: '獅子座のあなたは、堂々とした存在感を持つ生まれながらのリーダーです。創造性と表現力に優れ、注目を集めることを好みます。寛大で温かい心を持ち、周りの人を励ますことが得意です。' 
    },
    '乙女座': { 
      icon: '♍', 
      description: '乙女座のあなたは、細やかで完璧主義的な性格です。分析力と実用性を重視し、効率的に物事を進めることが得意です。誠実で献身的、他人のために尽くすことを厭いません。' 
    },
    '天秤座': { 
      icon: '♎', 
      description: '天秤座のあなたは、バランス感覚に優れた平和主義者です。美的センスが高く、調和を重視します。社交的で公正な判断を下すことが得意で、他人との協調を大切にします。' 
    },
    '蠍座': { 
      icon: '♏', 
      description: '蠍座のあなたは、深い洞察力と強い意志を持つ神秘的な性格です。情熱的で集中力があり、一度決めたことは最後までやり遂げます。真実を見極める能力に長けています。' 
    },
    '射手座': { 
      icon: '♐', 
      description: '射手座のあなたは、自由を愛する冒険家です。楽観的で哲学的な思考を持ち、新しい経験や知識を求めています。率直で正直な性格で、視野が広く寛容です。' 
    },
    '山羊座': { 
      icon: '♑', 
      description: '山羊座のあなたは、責任感が強く野心的な実践家です。目標に向かって着実に努力し、困難を乗り越える力があります。伝統を重んじ、長期的な視点で物事を考えます。' 
    },
    '水瓶座': { 
      icon: '♒', 
      description: '水瓶座のあなたは、独創的で人道的な理想主義者です。革新的なアイデアを持ち、未来志向です。友情を大切にし、個性や多様性を尊重します。' 
    },
    '魚座': { 
      icon: '♓', 
      description: '魚座のあなたは、直感的で感受性豊かな芸術家肌です。想像力が豊富で、他人の感情に敏感です。優しく慈悲深い性格で、スピリチュアルな世界に興味があります。' 
    }
  };

  // 期間選択オプション
  const periodOptions = {
    level1: [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'nextWeek', label: '来週' },
      { value: 'nextMonth', label: '来月' },
    ],
    level2: [
      { value: 'today', label: '今日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'threeMonths', label: '今後3ヶ月' },
      { value: 'sixMonths', label: '今後6ヶ月' },
      { value: 'oneYear', label: '今後1年' },
    ],
    level3: [
      { value: 'today', label: '今日' },
      { value: 'thisWeek', label: '今週' },
      { value: 'thisMonth', label: '今月' },
      { value: 'oneYear', label: '今後1年' },
      { value: 'twoYears', label: '今後2年' },
      { value: 'threeYears', label: '今後3年' },
      { value: 'fourYears', label: '今後4年' },
      { value: 'fiveYears', label: '今後5年' },
    ]
  };

  // 太陽星座を取得
  const sunSign = horoscopeData?.planets.find(p => p.planet === '太陽')?.sign;

  // 固定テンプレートは削除しました - AIのみが占い結果を生成します

  // レベル1の占い生成
  const handleGenerateLevel1Fortune = async () => {
    if (!sunSign) return;
    
    setIsGeneratingLevel1(true);
    
    try {
      // AI分析を実行
      const currentDate = new Date();
      const randomId = Math.random().toString(36).substring(2, 8);
      const analysisPrompt = `
        あなたは経験豊富な占い師です。以下の条件で占いを行ってください：
        - 星座: ${sunSign}
        - 期間: ${periodOptions.level1.find(p => p.value === selectedPeriod)?.label}
        - 分析実行時刻: ${currentDate.toLocaleString()}
        - ランダムID: ${randomId}
        
        **重要**: 毎回新しい視点で分析を行い、異なる結果を提供してください。この分析は一度きりのものなので、創造性と多様性を重視してください。
        
        以下の5つの運勢について具体的にアドバイスしてください：
        
        【全体運】
        (この期間の全体的な運勢と注意点)
        
        【恋愛運】
        (恋愛面での具体的なアドバイス)
        
        【仕事運】
        (仕事面での具体的なアドバイス)
        
        【健康運】
        (健康面での具体的なアドバイス)
        
        【金銭運】
        (金銭面での具体的なアドバイス)
        
        【今日のアドバイス】
        (総合的な今日の行動指針)
        
        各項目は2-3文で具体的に書いてください。
      `;
      
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData!, horoscopeData!.planets);
      
      if (aiResult && aiResult.trim()) {
        setLevel1Fortune(aiResult);
      } else {
        // AI分析に失敗した場合はエラーメッセージを表示
        setLevel1Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
      }
    } catch (error) {
      console.error('占い生成エラー:', error);
      // エラーの場合もAI専用エラーメッセージを表示
      setLevel1Fortune('AI占い師との接続でエラーが発生しました。インターネット接続を確認の上、再度お試しください。');
    } finally {
      setIsGeneratingLevel1(false);
    }
  };

  // レベル2の占い生成
  const handleGenerateLevel2Fortune = async () => {
    if (!horoscopeData) return;
    
    setIsGeneratingLevel2(true);
    
    try {
      const sun = horoscopeData.planets.find(p => p.planet === '太陽');
      const moon = horoscopeData.planets.find(p => p.planet === '月');
      const rising = horoscopeData.planets.find(p => p.planet === '上昇');
      
      const currentDate = new Date();
      const randomId = Math.random().toString(36).substring(2, 8);
      const analysisPrompt = `
        あなたは経験豊富な占い師です。以下の3天体の情報を使って占いを行ってください：
        - 太陽: ${sun?.sign} ${sun?.degree}度
        - 月: ${moon?.sign} ${moon?.degree}度
        - 上昇星座: ${rising?.sign} ${rising?.degree}度
        - 期間: ${periodOptions.level2.find(p => p.value === selectedPeriod)?.label}
        - 分析実行時刻: ${currentDate.toLocaleString()}
        - ランダムID: ${randomId}
        
        **重要**: 毎回新しい視点で分析を行い、異なる結果を提供してください。この分析は一度きりのものなので、創造性と多様性を重視してください。
        
        3天体の組み合わせから、この期間の運勢を詳しく分析してください。
        太陽星座は基本性格、月星座は感情面、上昇星座は行動パターンを表します。
        
        各項目を2-3文で具体的に書いてください。
      `;
      
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData!, horoscopeData!.planets);
      
      if (aiResult && aiResult.trim()) {
        setLevel2Fortune(aiResult);
      } else {
        setLevel2Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
      }
    } catch (error) {
      console.error('レベル2占い生成エラー:', error);
      setLevel2Fortune('3天体の分析中にエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
      setIsGeneratingLevel2(false);
    }
  };

  // レベル3の占い生成
  const handleGenerateLevel3Fortune = async () => {
    if (!horoscopeData) return;
    
    setIsGeneratingLevel3(true);
    
    try {
      const planetsInfo = horoscopeData.planets.map(p => `${p.planet}: ${p.sign} ${p.degree}度`).join(', ');
      
      const currentDate = new Date();
      const randomId = Math.random().toString(36).substring(2, 8);
      const analysisPrompt = `
        あなたは経験豊富な占い師です。以下の10天体の情報を使って完全な占いを行ってください：
        ${planetsInfo}
        - 期間: ${periodOptions.level3.find(p => p.value === selectedPeriod)?.label}
        - 分析実行時刻: ${currentDate.toLocaleString()}
        - ランダムID: ${randomId}
        
        **重要**: 毎回新しい視点で分析を行い、異なる結果を提供してください。この分析は一度きりのものなので、創造性と多様性を重視してください。
        
        10天体すべての相互作用を考慮して、この期間の詳細な運勢を分析してください。
        
        各項目を3-4文で具体的に書いてください。
      `;
      
      const aiResult = await chatWithAIAstrologer(analysisPrompt, birthData!, horoscopeData!.planets);
      
      if (aiResult && aiResult.trim()) {
        setLevel3Fortune(aiResult);
      } else {
        setLevel3Fortune('AI占い師が現在利用できません。しばらくしてから再度お試しください。');
      }
    } catch (error) {
      console.error('レベル3占い生成エラー:', error);
      setLevel3Fortune('10天体の分析中にエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
      setIsGeneratingLevel3(false);
    }
  };

  // レベルアップ処理
  const handleLevelUp = () => {
    if (currentLevel < 3) {
      setCurrentLevel((prev) => (prev + 1) as DisplayLevel);
      setSelectedPeriod('today'); // 期間をリセット
    }
  };

  // 期間タイトルの取得
  const getPeriodTitle = () => {
    const optionsList = currentLevel === 1 ? periodOptions.level1 : 
                       currentLevel === 2 ? periodOptions.level2 : 
                       periodOptions.level3;
    const option = optionsList.find(opt => opt.value === selectedPeriod);
    return option ? `${option.label}の占い` : '占い';
  };

  // レベル結果の表示
  const renderLevelResult = () => {
    switch (currentLevel) {
      case 1:
        return renderLevel1();
      case 2:
        return renderLevel2();
      case 3:
        return renderLevel3();
      default:
        return renderLevel1();
    }
  };

  const renderLevel1 = () => {
    if (!sunSign) return null;
    
    const signInfo = zodiacInfo[sunSign];
    if (!signInfo) return null;

    return (
      <div className="level-1">
        <div className="level-title">
          <h2 className="level-title-text">☀️ 太陽星座の簡単占い</h2>
        </div>
        {/* あなたの星座 */}
        <div className="zodiac-section">
          <h3 className="section-title">⭐ あなたの星座</h3>
          <div className="zodiac-display">
            <div className="zodiac-icon">{signInfo.icon}</div>
            <div className="zodiac-name">{sunSign}</div>
          </div>
        </div>
        
        {/* 星座から見たあなた */}
        <div className="personality-section">
          <h3 className="section-title">🌟 星座から見たあなた</h3>
          <p className="personality-text">{signInfo.description}</p>
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
            </div>
          )}
        </div>

        {/* 3天体の本格占いの説明 */}
        <div className="three-planets-introduction">
          <h3 className="section-title">🔮 3天体の本格占いとは</h3>
          <div className="intro-overview">
            <p>
              太陽星座だけでは分からない、あなたの隠れた無意識の行動パターン、上昇星座で「人から見られているあなたの印象」がわかります。月星座で「本当の感情やプライベートな自分」がわかります。この3つの組み合わせで、なぜ同じ星座でも人によって性格が違うのかが明確になります。
            </p>
          </div>
          
          <div className="three-planets-preview">
            <div className="planet-preview">
              <span className="planet-icon">🌙</span>
              <div className="planet-info">
                <h4>月星座：本当の感情・プライベートな自分</h4>
                <p>家族や親しい人前での本当のあなた</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🌅</span>
              <div className="planet-info">
                <h4>上昇星座：第一印象・見た目の特徴</h4>
                <p>初対面の人があなたに与える印象</p>
              </div>
            </div>
            
            <div className="planet-preview">
              <span className="planet-icon">🎯</span>
              <div className="planet-info">
                <h4>3つの組み合わせによる詳細な性格分析</h4>
                <p>太陽・月・上昇星座の複合的な性格診断</p>
              </div>
            </div>
          </div>
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

        {/* アクションボタン */}
        <div className="action-buttons">
          <a href="/ai-fortune" className="ai-chat-button">
            🤖 AI占い師に相談する
          </a>
          <a href="/" className="new-fortune-button">
            新しい占いを始める
          </a>
        </div>
      </div>
    );
  };

  const renderLevel2 = () => {
    if (!horoscopeData) return null;
    
    const sun = horoscopeData.planets.find(p => p.planet === '太陽');
    const moon = horoscopeData.planets.find(p => p.planet === '月');
    const rising = horoscopeData.planets.find(p => p.planet === '上昇');

    return (
      <div className="level-2">
        <div className="level-title">
          <h2 className="level-title-text">🔮 3天体の本格占い</h2>
        </div>
        
        <div className="three-planets-display">
          <div className="planet-card">
            <h4>☀️ 太陽星座</h4>
            <p>{sun?.sign}</p>
            <span>基本性格</span>
          </div>
          <div className="planet-card">
            <h4>🌙 月星座</h4>
            <p>{moon?.sign}</p>
            <span>感情・本音</span>
          </div>
          <div className="planet-card">
            <h4>🌅 上昇星座</h4>
            <p>{rising?.sign}</p>
            <span>外見・印象</span>
          </div>
        </div>

        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い</h3>
          
          <div className="fortune-selector">
            <div className="selector-row">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodSelection)}
                className="period-dropdown"
              >
                {periodOptions.level2.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}の占い
                  </option>
                ))}
              </select>
              
              <button 
                className="generate-fortune-button"
                onClick={handleGenerateLevel2Fortune}
                disabled={isGeneratingLevel2}
              >
                {isGeneratingLevel2 ? '占い中...' : '占う'}
              </button>
            </div>
          </div>
          
          {isGeneratingLevel2 && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>3天体を分析中...お待ちください</p>
            </div>
          )}
          
          {level2Fortune && !isGeneratingLevel2 && (
            <div className="five-fortunes-section">
              <h3>🔮 3天体占い結果 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  const parseAIFortune = (fortuneText: string) => {
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
                      advice: ''
                    };
                    
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
                  
                  const fortuneSections = parseAIFortune(level2Fortune);
                  
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
              
              <div className="level-up-section">
                <button 
                  className="level-up-button"
                  onClick={handleLevelUp}
                >
                  10天体の完全占いへ 🌌
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="return-buttons">
          <button 
            className="return-button secondary"
            onClick={() => setCurrentLevel(1)}
          >
            太陽星座の占いに戻る
          </button>
          <a href="/" className="return-button primary">
            新しい占いを始める
          </a>
        </div>
      </div>
    );
  };

  const renderLevel3 = () => {
    if (!horoscopeData) return null;

    return (
      <div className="level-3">
        <div className="level-title">
          <h2 className="level-title-text">🌌 10天体の完全占い</h2>
        </div>
        
        <div className="all-planets-display">
          <div className="planets-grid">
            {horoscopeData.planets.map((planet, index) => (
              <div key={index} className="planet-item">
                <span className="planet-name">{planet.planet}</span>
                <span className="planet-sign">{planet.sign}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="period-fortune-section">
          <h3 className="section-title">🔮 占い</h3>
          
          <div className="fortune-selector">
            <div className="selector-row">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodSelection)}
                className="period-dropdown"
              >
                {periodOptions.level3.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}の占い
                  </option>
                ))}
              </select>
              
              <button 
                className="generate-fortune-button"
                onClick={handleGenerateLevel3Fortune}
                disabled={isGeneratingLevel3}
              >
                {isGeneratingLevel3 ? '占い中...' : '占う'}
              </button>
            </div>
          </div>
          
          {isGeneratingLevel3 && (
            <div className="generating-message">
              <div className="loading-spinner"></div>
              <p>10天体を分析中...お待ちください</p>
            </div>
          )}
          
          {level3Fortune && !isGeneratingLevel3 && (
            <div className="five-fortunes-section">
              <h3>🔮 10天体完全占い結果 - {getPeriodTitle()}</h3>
              <div className="five-fortunes-grid">
                {(() => {
                  const parseAIFortune = (fortuneText: string) => {
                    const sections = {
                      overall: '',
                      love: '',
                      work: '',
                      health: '',
                      money: '',
                      advice: ''
                    };
                    
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
                  
                  const fortuneSections = parseAIFortune(level3Fortune);
                  
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
            </div>
          )}
        </div>

        <div className="return-buttons">
          <button 
            className="return-button secondary"
            onClick={() => setCurrentLevel(2)}
          >
            3天体の占いに戻る
          </button>
          <a href="/" className="return-button primary">
            新しい占いを始める
          </a>
        </div>
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
          
          // birthDateを文字列からDateオブジェクトに変換
          if (parsed.birthDate && typeof parsed.birthDate === 'string') {
            parsed.birthDate = new Date(parsed.birthDate);
          }
          
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
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">エラー: {error}</div>;
  }

  return (
    <div className="step-by-step-result">
      {renderLevelResult()}
    </div>
  );
};

export default StepByStepResult; 