import React from 'react';
import ResultHeader from './ResultHeader';
import ZodiacBasics from './ZodiacBasics';
import FortuneRating from './FortuneRating';
import LoadingSpinner from '../LoadingSpinner';
import { ZodiacInfo } from '../../utils/zodiacData';
import { parseAIFortune } from '../../utils/fortuneParser';
import { generateShareCard, shareImage } from '../../utils/shareCardGenerator';
import ShareModal from './ShareModal';
import './Level1Section.css';

interface Level1SectionProps {
  sunSign: string;
  signInfo: ZodiacInfo;
  selectedPeriod: string;
  setSelectedPeriod: (period: any) => void;
  periodOptions: any[];
  handleGenerateFortune: () => void;
  isGenerating: boolean;
  fortune: string | null;
  fortunePeriod: string;
  onLevelUp: () => void;
  onNewFortune: () => void;
  onAIChat: () => void;
}

const Level1Section: React.FC<Level1SectionProps> = ({
  sunSign,
  signInfo,
  selectedPeriod,
  setSelectedPeriod,
  periodOptions,
  handleGenerateFortune,
  isGenerating,
  fortune,
  fortunePeriod,
  onLevelUp,
  onNewFortune,
  onAIChat
}) => {
  const fortuneSections = parseAIFortune(fortune, fortunePeriod);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [shareImageUrl, setShareImageUrl] = React.useState('');

  const handleShare = async () => {
    // ローカルストレージから情報を補完
    const savedHoroscope = localStorage.getItem('horoscopeData');
    const savedBirth = localStorage.getItem('birthData');
    
    let moonSign = '不明';
    let ascSign = '不明';
    let name = 'ゲスト';

    if (savedHoroscope) {
      const horoscope = JSON.parse(savedHoroscope);
      moonSign = horoscope.planets.find((p: any) => p.planet === '月')?.sign || '不明';
      ascSign = horoscope.planets.find((p: any) => p.planet === '上昇星座')?.sign || '不明';
    }

    const sentences = fortuneSections.overall ? fortuneSections.overall.split(/[。！]/).filter(s => s.trim().length > 0) : [];
    const fortuneMessage = sentences.length > 0 
      ? sentences.slice(0, 2).join('。') + '。' 
      : `${sunSign}座の太陽が輝く、今日という日。`;
    
    // 星の数を抽出
    const rating = fortuneSections.overallStars || 5;

    const getPeriodLabel = (period: string) => {
      const labels: any = {
        today: '今日の運勢',
        tomorrow: '明日の運勢',
        thisWeek: '今週の運勢',
        nextWeek: '来週の運勢',
      };
      return labels[period] || '星の導き';
    };

    try {
      const dataUrl = await generateShareCard({
        sunSign,
        moonSign,
        ascSign,
        fortuneMessage: fortuneMessage.substring(0, 100),
        rating,
        periodLabel: getPeriodLabel(fortunePeriod),
        theme: 'gold'
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
    <div className="level-1-section">
      <ResultHeader title="太陽の輝き（基本性格）" />

      {isShareModalOpen && (
        <ShareModal 
          imageUrl={shareImageUrl} 
          onClose={() => setIsShareModalOpen(false)} 
          onDownload={executeDownload}
        />
      )}
      <ZodiacBasics sign={sunSign} signInfo={signInfo} />
      
      {/* 占い実行セクション */}
      <div className="section-card fortune-execution-section">
        <h3 className="section-title">🔮 今の運勢を占う</h3>
        
        <div className="fortune-selector">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-dropdown"
          >
            {periodOptions.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}の運勢
              </option>
            ))}
          </select>
          
          <button 
            className="generate-fortune-button"
            onClick={handleGenerateFortune}
            disabled={isGenerating}
          >
            {isGenerating ? '宇宙の智慧を解析中...' : 'この期間を占う'}
          </button>
        </div>
        
        {isGenerating && (
          <div className="generating-message">
            <LoadingSpinner size={50} color="var(--ethereal-blue)" />
            <p>星々の配置から運命を読み解いています...</p>
          </div>
        )}
        
        {fortune && !isGenerating && (
          <div className="fortune-results-container">
            <div className="five-fortunes-grid">
              {[
                { key: 'overall', label: '全体運' },
                { key: 'love', label: '恋愛運' },
                { key: 'work', label: '仕事運' },
                { key: 'health', label: '健康運' },
                { key: 'money', label: '金銭運' }
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
                    <div className="fortune-item-content">
                      <p>{content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 重要な日（もしあれば） */}
            {fortuneSections.importantDays && (
              <div className="important-days-section">
                <h4 className="important-days-title">🗓️ 注目すべき運命の日</h4>
                <div className="important-days-content">
                  {fortuneSections.importantDays.split('\n').map((line, index) => (
                    <p key={index} className="important-day-line">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="section-card actions-section">
        <h3 className="section-title">✨ 次のステップ</h3>
        <p className="section-intro">より深く、あなたの真実に触れてみませんか？</p>
        <div className="action-buttons-list">
          <button className="share-card-button theme-gold" onClick={handleShare}>
            📸 今日の結果をカードでシェア
          </button>
          <button className="level-up-button" onClick={onLevelUp}>
            星々の共鳴（完全分析）へ進む 🌌
          </button>
          <button className="ai-chat-button" onClick={onAIChat}>
            🤖 星の対話（AI相談）を始める
          </button>
          <button className="new-fortune-button" onClick={onNewFortune}>
            トップページへ戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default Level1Section;
