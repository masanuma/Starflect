import React from 'react';
import './ShareModal.css';

interface ShareModalProps {
  imageUrl: string;
  onClose: () => void;
  onDownload: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ imageUrl, onClose, onDownload }) => {
  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="share-modal-title">✨ 鑑定結果カードの生成完了</h3>
        <p className="share-modal-instructions">
          画像を長押しまたは右クリックで保存して、SNSでシェアしましょう。
        </p>
        
        <img src={imageUrl} alt="Starflect Share Card" className="share-image-preview" />
        
        <div className="share-modal-actions">
          <button className="theme-gold" onClick={onDownload}>
            💾 画像を保存する
          </button>
          <button className="close-modal-button" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
