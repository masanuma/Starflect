import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ResultHeader.css';

interface ResultHeaderProps {
  title: string;
}

const ResultHeader: React.FC<ResultHeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="back-button-wrapper">
        <button 
          className="back-button"
          onClick={() => {
            window.scrollTo(0, 0);
            navigate('/');
          }}
          type="button"
        >
          ← 占いモード選択に戻る
        </button>
      </div>
      
      <div className="result-header-container">
        <h2 className="result-title-text">{title}</h2>
      </div>
    </>
  );
};

export default ResultHeader;
