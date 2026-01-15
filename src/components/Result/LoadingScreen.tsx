import React from 'react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">宇宙の記録を読み込み中...</p>
    </div>
  );
};

export default LoadingScreen;
