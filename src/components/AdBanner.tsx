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
                console.log('🔄 AdSense初期化開始:', position);
                console.log('📊 広告要素情報:', {
                  client: adElement.getAttribute('data-ad-client'),
                  slot: adElement.getAttribute('data-ad-slot'),
                  format: adElement.getAttribute('data-ad-format'),
                  test: adElement.getAttribute('data-adtest')
                });
                
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                console.log('✅ AdSense初期化完了:', position);
                
                // 5秒後に広告表示状況をチェック
                setTimeout(() => {
                  const rect = adElement.getBoundingClientRect();
                  const computedStyle = window.getComputedStyle(adElement);
                  console.log('📏 広告サイズ情報:', {
                    position: position,
                    width: rect.width,
                    height: rect.height,
                    hasContent: adElement.innerHTML.length > 100,
                    visible: rect.width > 0 && rect.height > 0,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    overflow: computedStyle.overflow
                  });
                  
                  // 実際の広告内容をチェック
                  const adContent = adElement.innerHTML;
                  console.log('📄 広告内容プレビュー:', adContent.substring(0, 200) + '...');
                  
                  // 広告が見えるかの最終判定
                  if (rect.width > 0 && rect.height > 0 && adContent.length > 100) {
                    console.log('✅ 広告が正常に表示されています！', position);
                  } else {
                    console.log('⚠️ 広告が見えない可能性があります:', position);
                  }
                }, 5000);
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
    // 位置別の広告設定
    const adConfig = {
      'level-transition': {
        style: { display: 'block', width: '100%', height: '90px' },
        format: 'rectangle',
        responsive: 'true'
      },
      'result-bottom': {
        style: { display: 'block', width: '100%', height: '90px' },
        format: 'rectangle', 
        responsive: 'true'
      },
      'chat-inline': {
        style: { display: 'block', width: '100%', height: '90px' },
        format: 'rectangle',
        responsive: 'true'
      },
      'sidebar': {
        style: { display: 'inline-block', width: '300px', height: '250px' },
        format: 'rectangle',
        responsive: 'false'
      }
    };

    const config = adConfig[position] || adConfig['level-transition'];

    return (
      <div className={`adsense-container adsense-container--${position}`}>
        <ins
          className="adsbygoogle"
          style={config.style}
          data-ad-client="ca-pub-6954675352016304"
          data-ad-slot="5109454854"
          data-ad-format={config.format}
          data-full-width-responsive={config.responsive}
          data-adtest="on"
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