import React, { useState, useEffect, useRef } from 'react';

interface WheelPickerProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  height?: number;
  itemHeight?: number;
  className?: string;
  placeholder?: string;
}

const WheelPicker: React.FC<WheelPickerProps> = ({
  options,
  value,
  onChange,
  height = 200,
  itemHeight = 40,
  className = '',
  placeholder = '選択してください'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [animationId, setAnimationId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 現在選択されているインデックスを計算
  const getCurrentIndex = () => {
    const index = options.findIndex(option => option.value === value);
    return index >= 0 ? index : 0;
  };

  // インデックスから変換量を計算
  const getTranslateFromIndex = (index: number) => {
    const centerOffset = (height - itemHeight) / 2;
    return centerOffset - (index * itemHeight);
  };

  // 初期位置を設定
  useEffect(() => {
    const index = getCurrentIndex();
    const translate = getTranslateFromIndex(index);
    setCurrentTranslate(translate);
  }, [value, options]);

  // タッチ/マウス開始
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    if (animationId) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }
  };

  // タッチ/マウス移動
  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - startY;
    const newTranslate = currentTranslate + deltaY;
    
    // 境界制限
    const maxTranslate = (height - itemHeight) / 2;
    const minTranslate = maxTranslate - ((options.length - 1) * itemHeight);
    
    if (newTranslate >= minTranslate && newTranslate <= maxTranslate) {
      setCurrentTranslate(newTranslate);
    }
  };

  // タッチ/マウス終了
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // 最も近いアイテムにスナップ
    const centerOffset = (height - itemHeight) / 2;
    const index = Math.round((centerOffset - currentTranslate) / itemHeight);
    const clampedIndex = Math.max(0, Math.min(options.length - 1, index));
    
    const targetTranslate = getTranslateFromIndex(clampedIndex);
    
    // アニメーション
    const startTranslate = currentTranslate;
    const distance = targetTranslate - startTranslate;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // イージング関数（ease-out）
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newTranslate = startTranslate + (distance * easeOut);
      
      setCurrentTranslate(newTranslate);
      
      if (progress < 1) {
        setAnimationId(requestAnimationFrame(animate));
      } else {
        setAnimationId(null);
        onChange(options[clampedIndex].value);
      }
    };

    setAnimationId(requestAnimationFrame(animate));
  };

  // マウスイベント
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientY);
  };

  // タッチイベント
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  // グローバルイベントリスナー
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMove(e.clientY);
      const handleGlobalMouseUp = () => handleEnd();
      const handleGlobalTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          handleMove(e.touches[0].clientY);
        }
      };
      const handleGlobalTouchEnd = () => handleEnd();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
      };
    }
  }, [isDragging, currentTranslate, startY]);

  // 上下ボタンのハンドラー
  const handleStepUp = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex > 0) {
      onChange(options[currentIndex - 1].value);
    }
  };

  const handleStepDown = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex < options.length - 1) {
      onChange(options[currentIndex + 1].value);
    }
  };

  return (
    <div className={`wheel-picker ${className}`}>
      {/* 上ボタン */}
      <button 
        className="wheel-picker-step-button wheel-picker-step-up"
        onClick={handleStepUp}
        disabled={getCurrentIndex() === 0}
        aria-label="前の項目を選択"
      >
        <span className="step-arrow">▲</span>
        <span className="step-text">上へ</span>
      </button>

      <div 
        ref={containerRef}
        className="wheel-picker-container"
        style={{ height }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div 
          className="wheel-picker-list"
          style={{ 
            transform: `translateY(${currentTranslate}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {options.map((option, index) => {
            const offset = Math.abs(index * itemHeight + currentTranslate - (height - itemHeight) / 2);
            const opacity = Math.max(0.3, 1 - offset / (itemHeight * 2));
            const scale = Math.max(0.8, 1 - offset / (itemHeight * 4));
            const isSelected = option.value === value;
            
            return (
              <div
                key={option.value}
                className={`wheel-picker-item ${isSelected ? 'selected' : ''}`}
                style={{
                  height: itemHeight,
                  opacity,
                  transform: `scale(${scale})`,
                  color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                  fontSize: isSelected ? '1.4rem' : '1.1rem',
                  fontWeight: isSelected ? '700' : '500'
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>
        
        {/* 選択インジケーター */}
        <div className="wheel-picker-indicator" />
      </div>

      {/* 下ボタン */}
      <button 
        className="wheel-picker-step-button wheel-picker-step-down"
        onClick={handleStepDown}
        disabled={getCurrentIndex() === options.length - 1}
        aria-label="次の項目を選択"
      >
        <span className="step-arrow">▼</span>
        <span className="step-text">下へ</span>
      </button>
    </div>
  );
};

export default WheelPicker; 