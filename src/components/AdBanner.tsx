import React, { useEffect, useRef } from 'react';
import './AdBanner.css';

interface AdBannerProps {
  position: 'level-transition' | 'result-bottom' | 'chat-inline' | 'sidebar';
  size?: 'small' | 'medium' | 'large';
  demoMode?: boolean; // サンプル表示用
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  position, 
  size = 'medium', 
  demoMode = false  // 本番モードで動作
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  
  // 本番環境での実際の広告表示を有効化
  const forceDemoMode = false;

  useEffect(() => {
    if (!forceDemoMode && !demoMode && adRef.current) {
      // Google AdSense初期化
      try {
        // 要素の存在と基本的な表示チェック
        const element = adRef.current;
        if (element) {
          // adsbygoogle要素を探す
          const adElement = element.querySelector('.adsbygoogle');
          if (adElement) {
            // 少し遅延を入れてからAdSenseを初期化
            setTimeout(() => {
              try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                console.log('✅ AdSense初期化完了:', position);
              } catch (error) {
                console.log('🚨 AdSense初期化エラー:', error);
              }
            }, 100);
          } else {
            console.log('⚠️ AdSense要素が見つかりません:', position);
          }
        }
      } catch (error) {
        console.log('🚨 AdSense読み込みエラー:', error);
      }
    } else {
      console.log('🔄 AdSense: デモモードで動作中');
    }
  }, [demoMode, forceDemoMode, position]);

  // サンプル用の広告コンテンツ
  const renderDemoAd = () => {
    const adContent = {
      'level-transition': {
        title: '🌟 星座をもっと深く知ろう',
        description: '占星術の本格的な学習サイト\n無料で基礎から学べます',
        button: '詳しく見る',
        image: '🔮'
      },
      'result-bottom': {
        title: '✨ あなたにおすすめの開運グッズ',
        description: 'パワーストーン・星座ジュエリー\n運気アップアイテム多数',
        button: 'ショップを見る',
        image: '💎'
      },
      'chat-inline': {
        title: '📚 占星術をもっと学ぶ',
        description: 'プロの占星術師によるオンライン講座\n初心者歓迎・無料体験あり',
        button: '無料体験する',
        image: '📖'
      },
      'sidebar': {
        title: '🌙 今日のラッキーアイテム',
        description: 'あなたの星座に合わせた\n開運アイテムをご紹介',
        button: 'チェック',
        image: '🍀'
      }
    };

    const content = adContent[position];

    return (
      <div className={`demo-ad demo-ad--${position} demo-ad--${size}`}>
        <div className="demo-ad__header">
          <span className="demo-ad__label">広告</span>
          <span className="demo-ad__close">×</span>
        </div>
        <div className="demo-ad__content">
          <div className="demo-ad__image">
            {content.image}
          </div>
          <div className="demo-ad__text">
            <h4 className="demo-ad__title">{content.title}</h4>
            <p className="demo-ad__description">{content.description}</p>
            <button className="demo-ad__button">{content.button}</button>
          </div>
        </div>
      </div>
    );
  };

  // 実際のGoogle AdSense
  const renderRealAd = () => {
    return (
      <div className={`adsense-container adsense-container--${position}`}>
        <ins
          className="adsbygoogle"
          style={{
            display: 'block'
          }}
          data-ad-client="ca-pub-6954675352016304"
          data-ad-slot="5109454854"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  };

  return (
    <div 
      ref={adRef}
      className={`ad-banner ad-banner--${position} ad-banner--${size}`}
      role="banner"
      aria-label="広告"
    >
      {forceDemoMode || demoMode ? renderDemoAd() : renderRealAd()}
    </div>
  );
};

export default AdBanner; 