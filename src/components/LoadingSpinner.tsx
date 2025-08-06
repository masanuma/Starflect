import React, { useEffect, useRef } from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  speed?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 50,
  color = '#667eea',
  speed = 50
}) => {
  const spinnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const rotationRef = useRef<number>(0);

  useEffect(() => {
    const spinner = spinnerRef.current;
    if (!spinner) return;

    const animate = () => {
      rotationRef.current += 10;
      if (rotationRef.current >= 360) {
        rotationRef.current = 0;
      }
      
      spinner.style.transform = `rotate(${rotationRef.current}deg)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    // アニメーション開始
    animationRef.current = requestAnimationFrame(animate);

    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={spinnerRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `5px solid #e2e8f0`,
        borderTop: `5px solid ${color}`,
        borderRadius: '50%',
        display: 'block',
        margin: '0 auto',
        willChange: 'transform'
      }}
    />
  );
};

export default LoadingSpinner;
