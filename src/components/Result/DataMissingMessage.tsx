import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DataMissingMessageProps {
  currentLevel: number;
}

const DataMissingMessage: React.FC<DataMissingMessageProps> = ({ currentLevel }) => {
  const navigate = useNavigate();
  const selectedMode = localStorage.getItem('selectedMode');
  const isForThreePlanets = (currentLevel === 1) || (selectedMode === 'three-planets');
  const modeTitle = isForThreePlanets ? '3天体の本格占い' : '10天体の完全占い';
  
  const handleGoToRegistration = () => {
    const targetMode = isForThreePlanets ? 'three-planets' : 'ten-planets';
    localStorage.setItem('starflect_missing_data_mode', targetMode);
    localStorage.setItem('selectedMode', targetMode);
    window.scrollTo(0, 0);
    navigate('/');
  };

  return (
    <div className="data-missing-container">
      <div className="data-missing-card">
        <div className="data-missing-icon">🌟</div>
        <h2 className="data-missing-title">{modeTitle}で詳しく占うために</h2>
        <div className="data-missing-message">
          <p>出生時刻と出生場所を教えてください</p>
          <p>これらの情報で、あなたの星座をより正確に分析できます！</p>
        </div>
        <div className="data-missing-actions">
          <button 
            className="registration-button"
            onClick={handleGoToRegistration}
          >
            ✨ 出生時刻と出生場所を入力する
          </button>
          <button 
            className="back-button"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/');
            }}
          >
            ← 占いモード選択に戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataMissingMessage;
