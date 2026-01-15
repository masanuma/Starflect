import React from 'react';
import { ZodiacInfo } from '../../utils/zodiacData';
import './ZodiacBasics.css';

interface ZodiacBasicsProps {
  sign: string;
  signInfo: ZodiacInfo;
  title?: string;
}

const ZodiacBasics: React.FC<ZodiacBasicsProps> = ({ sign, signInfo, title = 'あなたの星座' }) => {
  return (
    <div className="zodiac-basics-container">
      <div className="section-card zodiac-display-section">
        <h3 className="section-title">⭐ {title}</h3>
        <div className="zodiac-display">
          <div className="zodiac-icon">{signInfo.icon}</div>
          <div className="zodiac-name">{sign}</div>
        </div>
      </div>
      
      <div className="section-card personality-analysis-section">
        <h3 className="section-title">⭐ 12星座から見たあなた</h3>
        <p className="personality-text">{signInfo.description}</p>
      </div>
    </div>
  );
};

export default ZodiacBasics;
