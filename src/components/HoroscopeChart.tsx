import React from 'react';
import { HoroscopeData, ZodiacSign } from '../types';
import { calculateAllAspects } from '../utils/aspectCalculator';

interface HoroscopeChartProps {
  horoscopeData: HoroscopeData;
  size?: number;
  showAspects?: boolean;
}

const HoroscopeChart: React.FC<HoroscopeChartProps> = ({ horoscopeData, size = 400, showAspects = false }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 20;
  const innerRadius = outerRadius - 40;
  const planetRadius = innerRadius - 30;

  // 12星座の配置（牡羊座0度から反時計回り）
  const zodiacSigns: ZodiacSign[] = [
    '牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座',
    '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座'
  ];

  // 星座記号
  const zodiacSymbols: Record<ZodiacSign, string> = {
    '牡羊座': '♈',
    '牡牛座': '♉',
    '双子座': '♊',
    '蟹座': '♋',
    '獅子座': '♌',
    '乙女座': '♍',
    '天秤座': '♎',
    '蠍座': '♏',
    '射手座': '♐',
    '山羊座': '♑',
    '水瓶座': '♒',
    '魚座': '♓'
  };

  // 天体記号
  const planetSymbols: Record<string, string> = {
    '太陽': '☉',
    '月': '☽',
    '水星': '☿',
    '金星': '♀',
    '火星': '♂',
    '木星': '♃',
    '土星': '♄',
    '天王星': '♅',
    '海王星': '♆',
    '冥王星': '♇'
  };

  // 星座の色
  const zodiacColors: Record<ZodiacSign, string> = {
    '牡羊座': '#FF6B6B',
    '牡牛座': '#4ECDC4',
    '双子座': '#45B7D1',
    '蟹座': '#96CEB4',
    '獅子座': '#FFEAA7',
    '乙女座': '#DDA0DD',
    '天秤座': '#98D8C8',
    '蠍座': '#F7DC6F',
    '射手座': '#BB8FCE',
    '山羊座': '#85C1E9',
    '水瓶座': '#F8C471',
    '魚座': '#82E0AA'
  };

  // 角度を計算（0度 = 牡羊座の開始点）
  const getAngle = (sign: ZodiacSign, degree: number): number => {
    const signIndex = zodiacSigns.indexOf(sign);
    return (signIndex * 30 + degree) * (Math.PI / 180);
  };

  // 座標を計算
  const getPosition = (angle: number, radius: number) => {
    return {
      x: centerX + Math.cos(angle - Math.PI / 2) * radius,
      y: centerY + Math.sin(angle - Math.PI / 2) * radius
    };
  };

  // パスを生成（星座セクション用）
  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number): string => {
    const start1 = getPosition(startAngle, outerR);
    const end1 = getPosition(endAngle, outerR);
    const start2 = getPosition(startAngle, innerR);
    const end2 = getPosition(endAngle, innerR);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

    return [
      "M", start1.x, start1.y,
      "A", outerR, outerR, 0, largeArcFlag, 1, end1.x, end1.y,
      "L", end2.x, end2.y,
      "A", innerR, innerR, 0, largeArcFlag, 0, start2.x, start2.y,
      "Z"
    ].join(" ");
  };

  return (
    <div className="horoscope-chart">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="ホロスコープチャート - 天体の配置と星座の関係を表示"
        aria-describedby="chart-description"
      >
        <title>ホロスコープチャート</title>
        <desc id="chart-description">
          12星座の円形チャートに生まれた時の天体配置を表示。
          太陽、月、惑星の位置と星座の関係、
          {showAspects ? 'および天体間の関係線（アスペクト）' : ''}
          を視覚的に表現したホロスコープ図です。
        </desc>

        {/* 背景円 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="rgba(255, 255, 255, 0.1)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          aria-hidden="true"
        />

        {/* 12星座セクション */}
        <g role="group" aria-label="12星座セクション">
          {zodiacSigns.map((sign, index) => {
            const startAngle = (index * 30) * (Math.PI / 180);
            const endAngle = ((index + 1) * 30) * (Math.PI / 180);
            const midAngle = (startAngle + endAngle) / 2;
            const symbolPos = getPosition(midAngle, (outerRadius + innerRadius) / 2);

            return (
              <g key={sign} role="group" aria-label={`${sign}セクション`}>
                {/* 星座セクション */}
                <path
                  d={createArcPath(startAngle, endAngle, outerRadius, innerRadius)}
                  fill={zodiacColors[sign]}
                  fillOpacity="0.2"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="1"
                  aria-label={`${sign}の領域`}
                />
                
                {/* 星座記号 */}
                <text
                  x={symbolPos.x}
                  y={symbolPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="18"
                  fill="white"
                  fontWeight="bold"
                  aria-label={`${sign}の記号`}
                >
                  {zodiacSymbols[sign]}
                </text>

                {/* 星座名 */}
                <text
                  x={symbolPos.x}
                  y={symbolPos.y + 20}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fill="rgba(255, 255, 255, 0.8)"
                  aria-hidden="true"
                >
                  {sign}
                </text>

                {/* セクション境界線 */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={getPosition(startAngle, outerRadius).x}
                  y2={getPosition(startAngle, outerRadius).y}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="1"
                  aria-hidden="true"
                />
              </g>
            );
          })}
        </g>

        {/* 12ハウス線 */}
        <g role="group" aria-label="12ハウスの境界線">
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const innerPos = getPosition(angle, innerRadius);
            const centerPos = getPosition(angle, planetRadius);
            
            return (
              <g key={`house-${i}`} role="group" aria-label={`第${i + 1}ハウス`}>
                <line
                  x1={innerPos.x}
                  y1={innerPos.y}
                  x2={centerPos.x}
                  y2={centerPos.y}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  aria-hidden="true"
                />
                
                {/* ハウス番号 */}
                <text
                  x={getPosition(angle + (15 * Math.PI / 180), planetRadius + 15).x}
                  y={getPosition(angle + (15 * Math.PI / 180), planetRadius + 15).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                  fill="rgba(255, 255, 255, 0.6)"
                  fontWeight="bold"
                  aria-label={`第${i + 1}ハウス`}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </g>

        {/* アスペクトライン */}
        {showAspects && (() => {
          const aspects = calculateAllAspects(horoscopeData.planets);
          const aspectRadius = planetRadius * 0.8; // 少し外側に移動
          
          return (
            <g role="group" aria-label="天体間の関係線（アスペクト）">
              {aspects.map((aspect, index) => {
                // 強度が40%以下のアスペクトは表示しない（より厳選）
                if (aspect.exactness < 40) return null;
                
                const planet1 = horoscopeData.planets.find(p => p.planet === aspect.planet1);
                const planet2 = horoscopeData.planets.find(p => p.planet === aspect.planet2);
                
                if (!planet1 || !planet2) return null;
                
                const angle1 = getAngle(planet1.sign as ZodiacSign, planet1.degree);
                const angle2 = getAngle(planet2.sign as ZodiacSign, planet2.degree);
                
                const pos1 = getPosition(angle1, aspectRadius);
                const pos2 = getPosition(angle2, aspectRadius);
                
                // 線の太さを調整（1-4の範囲）
                const lineWidth = Math.max(1, Math.min(4, aspect.exactness / 25));
                
                // 透明度を調整（強度に応じて）
                const opacity = Math.max(0.3, Math.min(0.8, aspect.exactness / 100));
                
                return (
                  <line
                    key={`aspect-${index}-${aspect.planet1}-${aspect.planet2}`}
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke={aspect.definition.color}
                    strokeWidth={lineWidth}
                    opacity={opacity}
                    strokeDasharray={aspect.definition.isHarmonious ? "none" : "4,4"}
                    className="aspect-line"
                    aria-label={`${aspect.planet1}と${aspect.planet2}の${aspect.type}（${aspect.definition.isHarmonious ? '調和的' : '挑戦的'}な関係）`}
                  />
                );
              }).filter(Boolean)}
            </g>
          );
        })()}

        {/* 天体配置 */}
        <g role="group" aria-label="天体の配置">
          {horoscopeData.planets.map((planet, _index) => {
            const angle = getAngle(planet.sign as ZodiacSign, planet.degree);
            const position = getPosition(angle, planetRadius);
            
            return (
              <g 
                key={planet.planet} 
                role="group" 
                aria-label={`${planet.planet} - ${planet.sign}座 ${planet.degree.toFixed(1)}度${planet.retrograde ? ' 逆行中' : ''}`}
              >
                {/* 天体記号 */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="15"
                  fill="rgba(255, 255, 255, 0.9)"
                  stroke="rgba(0, 0, 0, 0.3)"
                  strokeWidth="1"
                  aria-hidden="true"
                />
                
                <text
                  x={position.x}
                  y={position.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14"
                  fill="#333"
                  fontWeight="bold"
                  aria-label={`${planet.planet}の記号`}
                >
                  {planetSymbols[planet.planet] || planet.planet.charAt(0)}
                </text>

                {/* 逆行マーク */}
                {planet.retrograde && (
                  <text
                    x={position.x + 12}
                    y={position.y - 8}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fill="#ff4444"
                    fontWeight="bold"
                    aria-label="逆行マーク"
                  >
                    ℞
                  </text>
                )}

                {/* 天体から中心への線 */}
                <line
                  x1={position.x}
                  y1={position.y}
                  x2={centerX}
                  y2={centerY}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="1,1"
                  aria-hidden="true"
                />
              </g>
            );
          })}
        </g>

        {/* 中心円 */}
        <g role="group" aria-label="チャートの中心">
          <circle
            cx={centerX}
            cy={centerY}
            r="40"
            fill="rgba(255, 255, 255, 0.1)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
            aria-hidden="true"
          />

          {/* 中心テキスト */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12"
            fill="white"
            fontWeight="bold"
            aria-hidden="true"
          >
            ホロスコープ
          </text>
          
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fill="rgba(255, 255, 255, 0.7)"
            aria-hidden="true"
          >
            チャート
          </text>
        </g>
      </svg>
    </div>
  );
};

export default HoroscopeChart;
 