import React, { useState } from 'react';
import { PlanetPosition, BirthData } from '../types';
import { generateFuturePrediction, FuturePrediction as FuturePredictionType } from '../utils/aiAnalyzer';

const timeframeOptions = [
  '今日', '明日', '今週', '来週', '今月', '来月',
  '1ヶ月', '3ヶ月', '6ヶ月', '1年'
] as const;
type Timeframe = typeof timeframeOptions[number];

interface Props {
  birthData: BirthData;
  planets: PlanetPosition[];
}

const FuturePrediction: React.FC<Props> = ({ birthData, planets }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('3ヶ月');
  const [prediction, setPrediction] = useState<FuturePredictionType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFuturePrediction(birthData, planets, selectedTimeframe);
      setPrediction(result);
    } catch (err) {
      setError('未来予測の生成に失敗しました。しばらく時間をおいて再度お試しください。');
      console.error('未来予測エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="future-prediction">
      <div className="prediction-header">
        <h2>🔮 未来予測</h2>
        <p>AIが天体配置から読み取る、あなたの未来の可能性</p>
      </div>

      <div className="timeframe-selector">
        <h3>予測期間を選択</h3>
        <div className="timeframe-buttons">
          {timeframeOptions.map((timeframe) => (
            <button
              key={timeframe}
              className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      <div className="generate-section">
        <button
          className="generate-prediction-btn"
          onClick={handleGeneratePrediction}
          disabled={loading}
        >
          {loading ? '🔮 未来を読み取り中...' : '🌟 未来を予測する'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {prediction && (
        <div className="prediction-results">
          {/* ここに予測結果の表示ロジック（元のまま） */}
        </div>
      )}
    </div>
  );
};

export default FuturePrediction; 