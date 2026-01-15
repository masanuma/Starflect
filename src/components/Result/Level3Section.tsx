import React from 'react';
import ResultHeader from './ResultHeader';
import FortuneRating from './FortuneRating';
import LoadingSpinner from '../LoadingSpinner';
import { zodiacInfo } from '../../utils/zodiacData';
import { parseAIFortune } from '../../utils/fortuneParser';
import { HoroscopeData, BirthData } from '../../types';
import { AIAnalysisResult } from '../../utils/aiAnalyzer';
import { generateShareCard, shareImage } from '../../utils/shareCardGenerator';
import ShareModal from './ShareModal';
import './Level3Section.css';

interface Level3SectionProps {
  horoscopeData: HoroscopeData;
  birthData: BirthData;
  selectedPeriod: string;
  setSelectedPeriod: (period: any) => void;
  periodOptions: any[];
  handleGenerateFortune: () => void;
  isGenerating: boolean;
  fortune: string | null;
  fortunePeriod: string;
  level3Analysis: AIAnalysisResult | null;
  isGeneratingAnalysis: boolean;
  handleGenerateAnalysis: () => void;
  openPlanets: Set<string>;
  planetDetails: Record<string, string>;
  handlePlanetClick: (planet: string, sign: string) => void;
  onNewFortune: () => void;
  onAIChat: () => void;
}

const Level3Section: React.FC<Level3SectionProps> = ({
  horoscopeData,
  birthData,
  selectedPeriod,
  setSelectedPeriod,
  periodOptions,
  handleGenerateFortune,
  isGenerating,
  fortune,
  fortunePeriod,
  level3Analysis,
  isGeneratingAnalysis,
  handleGenerateAnalysis,
  openPlanets,
  planetDetails,
  handlePlanetClick,
  onNewFortune,
  onAIChat
}) => {
  const fortuneSections = parseAIFortune(fortune, fortunePeriod);

  const getPlanetEmoji = (planetName: string) => {
    const planetEmojis: { [key: string]: string } = {
      '太陽': '☀️', '月': '🌙', '上昇星座': '🌅',
      '水星': '☿️', '金星': '♀️', '火星': '♂️',
      '木星': '♃', '土星': '♄', '天王星': '♅',
      '海王星': '♆', '冥王星': '♇'
    };
    return planetEmojis[planetName] || '⭐';
  };

  const renderPlanetItem = (planet: any) => {
    const planetKey = `${planet.planet}-${planet.sign}`;
    const isOpen = openPlanets.has(planetKey);
    const detail = planetDetails[planetKey] || '';
    
    return (
      <div key={planet.planet} className="planet-item">
        <div 
          className="planet-title-line clickable-planet" 
          onClick={() => handlePlanetClick(planet.planet, planet.sign)}
        >
          <span className="planet-emoji">{getPlanetEmoji(planet.planet)}</span>
          <span className="planet-name">{planet.planet}</span>
          <span className="zodiac-emoji">{zodiacInfo[planet.sign]?.icon}</span>
          <span className="zodiac-sign">{planet.sign}</span>
          <span className="detail-toggle">{isOpen ? '▲' : '▼'}</span>
        </div>
        {isOpen && (
          <div className="planet-detail-accordion">
            <div className="planet-detail-content">
              <div className="planet-detail-text">
                <p>{detail}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [shareImageUrl, setShareImageUrl] = React.useState('');

  const handleShare = async () => {
    if (!horoscopeData || !birthData) return;

    // シェア用のデータを収集
    const sunSign = horoscopeData.planets.find(p => p.planet === '太陽')?.sign || '不明';
    const moonSign = horoscopeData.planets.find(p => p.planet === '月')?.sign || '不明';
    const ascSign = horoscopeData.planets.find(p => p.planet === '上昇星座')?.sign || '不明';
    
    // AI分析（まわりから見たあなた）または 運勢占いの結果から要約を抽出
    let messageSource = "";
    if (fortuneSections.overall) {
      messageSource = fortuneSections.overall;
    } else if (level3Analysis?.tenPlanetSummary?.overallInfluence) {
      messageSource = level3Analysis.tenPlanetSummary.overallInfluence;
    }

    const sentences = messageSource ? messageSource.split(/[。！]/).filter(s => s.trim().length > 0) : [];
    const fortuneMessage = sentences.length > 0 
      ? sentences.slice(0, 2).join('。') + '。' 
      : `${sunSign}座の太陽が導く、あなたの物語。`;

    try {
      const dataUrl = await generateShareCard({
        sunSign,
        moonSign,
        ascSign,
        fortuneMessage: fortuneMessage.substring(0, 100),
        // Level 3は総合的な分析なので星5つ相当の輝きとして表示（または非表示も可）
        rating: fortuneSections.overallStars || 5 
      });
      
      setShareImageUrl(dataUrl);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error('Share failed:', error);
      alert('画像の生成に失敗しました。');
    }
  };

  const executeDownload = async () => {
    if (shareImageUrl) {
      await shareImage(shareImageUrl);
    }
  };

  return (
    <div className="level-3-section">
      <ResultHeader title="星々の共鳴（完全分析）" />
      
      {isShareModalOpen && (
        <ShareModal 
          imageUrl={shareImageUrl} 
          onClose={() => setIsShareModalOpen(false)} 
          onDownload={executeDownload}
        />
      )}
      <div className="section-card planets-configuration-section">
        <h3 className="section-title">🌌 あなたを構成する10の天体</h3>
        <p className="section-intro">出生の瞬間に刻まれた、宇宙の縮図。各天体がどの星座に位置しているかを詳しく読み解きます。</p>
        
        <div className="ten-planets-grid">
          {[
            { title: '核心と内面', planets: ['太陽', '月', '上昇星座'] },
            { title: '知性と交流', planets: ['水星', '金星', '火星'] },
            { title: '拡大と秩序', planets: ['木星', '土星'] },
            { title: '超越と変革', planets: ['天王星', '海王星', '冥王星'] }
          ].map(section => (
            <div key={section.title} className="planet-group">
              <h4 className="group-title">{section.title}</h4>
              <div className="group-planets">
                {horoscopeData.planets.filter(p => section.planets.includes(p.planet)).map(renderPlanetItem)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* まわりから見たあなた（AI分析） */}
      <div className="section-card personality-analysis-section">
        <h3 className="section-title">🌟 まわりから見たあなた</h3>
        {isGeneratingAnalysis && (
          <div className="generating-message">
            <LoadingSpinner size={50} color="var(--ethereal-blue)" />
            <p>10天体の共鳴から、あなたの魂の肖像を分析しています...</p>
          </div>
        )}
        
        {level3Analysis?.tenPlanetSummary && !isGeneratingAnalysis && (
          <div className="ai-analysis-results">
            <div className="analysis-grid">
              {[
                { label: '総合的な影響', text: level3Analysis.tenPlanetSummary.overallInfluence },
                { label: 'コミュニケーション', text: level3Analysis.tenPlanetSummary.communicationStyle },
                { label: '愛と情熱の形', text: level3Analysis.tenPlanetSummary.loveAndBehavior },
                { label: '社会での振る舞い', text: level3Analysis.tenPlanetSummary.workBehavior },
                { label: '魂の深淵', text: level3Analysis.tenPlanetSummary.transformationAndDepth }
              ].map(item => (
                <div key={item.label} className="analysis-item-card">
                  <h4 className="analysis-item-title">{item.label}</h4>
                  <p className="analysis-item-text">{item.text || '解析データを取得できませんでした。'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!level3Analysis && !isGeneratingAnalysis && (
          <div className="analysis-cta">
            <p className="cta-text">10天体の配置に基づいた、AIによる高度な魂の多面的分析を実行します。</p>
            <button className="generate-fortune-button theme-gold" onClick={handleGenerateAnalysis}>
              このモードの特別分析を開始する
            </button>
          </div>
        )}
      </div>

      {/* 占い実行セクション */}
      <div className="section-card period-fortune-section">
        <h3 className="section-title">🔮 今の運勢を占う</h3>
        <div className="fortune-selector">
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="period-dropdown">
            {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}の運勢</option>)}
          </select>
          <button className="generate-fortune-button theme-gold" onClick={handleGenerateFortune} disabled={isGenerating}>
            {isGenerating ? '運命の糸を辿っています...' : 'この期間を占う'}
          </button>
        </div>
        
        {isGenerating && (
          <div className="generating-message">
            <LoadingSpinner size={50} color="var(--ethereal-blue)" />
            <p>星々の動きから、今のあなたへのメッセージを聴いています...</p>
          </div>
        )}
        
        {fortune && !isGenerating && (
          <div className="fortune-results-container">
            <div className="five-fortunes-grid">
              {[
                { key: 'overall', label: '総合運' },
                { key: 'money', label: '金銭運' },
                { key: 'love', label: '恋愛運' },
                { key: 'work', label: '仕事運' },
                { key: 'growth', label: '成長のヒント' }
              ].map(item => {
                const content = (fortuneSections as any)[item.key];
                const stars = (fortuneSections as any)[`${item.key}Stars`];
                if (!content) return null;
                return (
                  <div key={item.key} className="fortune-item-card">
                    <div className="fortune-item-header">
                      <span className="fortune-item-label">{item.label}</span>
                      <FortuneRating rating={stars} />
                    </div>
                    <div className="fortune-item-content"><p>{content}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="section-card actions-section">
        <h3 className="section-title">✨ 次のステップ</h3>
        <div className="action-buttons-list">
          <button className="share-card-button theme-gold" onClick={handleShare}>📸 結果をカードでシェアする</button>
          <button className="ai-chat-button" onClick={onAIChat}>🤖 AI占い師に相談する</button>
          <button className="new-fortune-button" onClick={onNewFortune}>トップページへ戻る</button>
        </div>
      </div>
    </div>
  );
};

export default Level3Section;
