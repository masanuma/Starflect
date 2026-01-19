import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ErrorScreen.css';

interface ErrorScreenProps {
  message: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">通信エラーが発生しました</h2>
        <p className="error-message">{message}</p>
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          トップへ戻る
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;
