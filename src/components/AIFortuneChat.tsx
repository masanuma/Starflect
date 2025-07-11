import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatWithAIAstrologer, ChatMessage as AIMessage } from '../utils/aiAnalyzer';
import './AIFortuneChat.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  typing?: boolean;
}

interface SuggestionChip {
  id: string;
  text: string;
  icon: string;
  category: 'fortune' | 'love' | 'career' | 'health' | 'general';
}

const AIFortuneChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // シンプルなAI応答生成関数
  const generateSimpleAIResponse = async (question: string): Promise<string> => {
    // 基本的な占いのテンプレート応答
    const responses = {
      '今日の運勢': '✨ 今日は新しい可能性が広がる日です。直感を信じて、積極的に行動することで良い結果が得られるでしょう。午後には嬉しい知らせが届くかもしれません。',
      '恋愛運': '💕 恋愛面では、自然体でいることが最も魅力的です。相手の気持ちを大切にし、思いやりを持って接することで、関係が深まるでしょう。',
      '仕事運': '💼 仕事では、チームワークを大切にすることで成果が上がります。新しいアイデアを積極的に提案し、周りの人とのコミュニケーションを心がけましょう。',
      '健康運': '🍃 健康面では、規則正しい生活を心がけることが大切です。特に睡眠の質を向上させることで、全体的なエネルギーが高まります。',
      '今週の注意点': '⚠️ 今週は、急な決断は避けて、じっくりと考える時間を取ることが重要です。感情的になりやすい時期なので、冷静さを保つことを心がけましょう。',
      '相性占い': '💑 相性については、お互いの違いを理解し、受け入れることが大切です。相手の長所に注目し、良い関係を築いていけるでしょう。',
      '転職時期': '📈 転職については、慎重に検討することをお勧めします。今は準備期間として、スキルアップや人脈作りに時間を使うと良いでしょう。',
      'ラッキーアイテム': '🍀 今日のラッキーアイテムは、青い色のものです。青いアクセサリーや小物を身に着けることで、運気がアップします。'
    };

    // 質問に対応する応答を探す
    for (const [keyword, response] of Object.entries(responses)) {
      if (question.includes(keyword)) {
        return response;
      }
    }

    // 一般的な応答
    return '🌟 星々からのメッセージをお伝えします。あなたの内なる声に耳を傾け、直感を大切にしてください。今は新しい可能性に向けて歩み始める時です。困難があっても、それは成長のための大切な経験となるでしょう。';
  };

  // 提案チップの定義
  const suggestionChips: SuggestionChip[] = [
    { id: '1', text: '今日の運勢', icon: '🌟', category: 'fortune' },
    { id: '2', text: '恋愛運', icon: '💕', category: 'love' },
    { id: '3', text: '仕事運', icon: '💼', category: 'career' },
    { id: '4', text: '健康運', icon: '🍃', category: 'health' },
    { id: '5', text: '今週の注意点', icon: '⚠️', category: 'fortune' },
    { id: '6', text: '相性占い', icon: '💑', category: 'love' },
    { id: '7', text: '転職時期', icon: '📈', category: 'career' },
    { id: '8', text: 'ラッキーアイテム', icon: '🍀', category: 'general' },
  ];

  // 初期メッセージ
  const initialMessage: Message = {
    id: 'initial',
    text: '🌟 こんにちは！AI占い師のステラです。星々の導きで、あなたの悩みにお答えします。何について占いましょうか？',
    isUser: false,
    timestamp: new Date()
  };

  // 初期化
  useEffect(() => {
    setMessages([initialMessage]);
    setSuggestions(suggestionChips);
    scrollToBottom();
  }, []);

  // メッセージが更新されたら自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // メッセージ送信
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // シンプルなAI応答を生成
      const response = await generateSimpleAIResponse(text);

      // タイピング効果のため少し待つ
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response,
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        setIsLoading(false);
        
        // 新しい提案チップを表示
        updateSuggestions(text);
      }, 1500);

    } catch (error) {
      console.error('AI分析エラー:', error);
      setTimeout(() => {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: '申し訳ございません。星々の声が聞こえにくくなっています。少し時間をおいてから再度お試しください。',
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        setIsLoading(false);
      }, 1500);
    }
  };

  // 提案チップの更新
  const updateSuggestions = (lastQuestion: string) => {
    const category = detectQuestionCategory(lastQuestion);
    const filteredSuggestions = suggestionChips.filter(chip => 
      chip.category === category || chip.category === 'general'
    );
    setSuggestions(filteredSuggestions.slice(0, 4));
  };

  // 質問カテゴリの検出
  const detectQuestionCategory = (question: string): SuggestionChip['category'] => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('恋愛') || lowerQuestion.includes('恋') || lowerQuestion.includes('愛') || lowerQuestion.includes('相性')) {
      return 'love';
    }
    if (lowerQuestion.includes('仕事') || lowerQuestion.includes('転職') || lowerQuestion.includes('キャリア') || lowerQuestion.includes('職場')) {
      return 'career';
    }
    if (lowerQuestion.includes('健康') || lowerQuestion.includes('体調') || lowerQuestion.includes('病気')) {
      return 'health';
    }
    if (lowerQuestion.includes('運勢') || lowerQuestion.includes('今日') || lowerQuestion.includes('明日') || lowerQuestion.includes('今週')) {
      return 'fortune';
    }
    
    return 'general';
  };

  // 提案チップクリック
  const handleSuggestionClick = (suggestion: SuggestionChip) => {
    handleSendMessage(suggestion.text);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // エンターキーでの送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  return (
    <div className="ai-fortune-container">
      {/* ヘッダー */}
      <div className="ai-chat-header">
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← 戻る
        </button>
        <div className="ai-info">
          <div className="ai-avatar">🔮</div>
          <div className="ai-details">
            <h1>AI占い師 ステラ</h1>
            <p>星々の導きであなたをサポート</p>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">
              {!message.isUser && (
                <div className="message-avatar">🔮</div>
              )}
              <div className="message-bubble">
                <p>{message.text}</p>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              {message.isUser && (
                <div className="message-avatar user-avatar">👤</div>
              )}
            </div>
          </div>
        ))}

        {/* タイピング表示 */}
        {isTyping && (
          <div className="message ai-message">
            <div className="message-content">
              <div className="message-avatar">🔮</div>
              <div className="message-bubble typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 提案チップ */}
      {suggestions.length > 0 && (
        <div className="suggestions-container">
          <h4>💡 こんな質問はいかがですか？</h4>
          <div className="suggestion-chips">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-chip"
              >
                <span className="chip-icon">{suggestion.icon}</span>
                <span className="chip-text">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 入力エリア */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="星々に聞きたいことを入力してください..."
            className="message-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '✨' : '🚀'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIFortuneChat; 