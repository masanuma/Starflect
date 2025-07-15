import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthData, PlanetPosition } from '../types';
import { chatWithAIAstrologer, getTransitInfoForChat, addTransitContextToChat, ChatMessage } from '../utils/aiAnalyzer';
import { calculateAllAspects, detectAspectPatterns } from '../utils/aspectCalculator';

interface Props {
  birthData: BirthData;
  planets: PlanetPosition[];
}

const AIChat: React.FC<Props> = React.memo(({ birthData, planets }) => {
  const navigate = useNavigate();
  
  // ストレージキーをメモ化
  const STORAGE_KEY = useMemo(() => `ai_chat_history_${birthData.name}`, [birthData.name]);
  
  // アスペクト情報を非同期で計算（AI動的生成対応）
  const [aspectsAndPatterns, setAspectsAndPatterns] = useState<{
    aspects: any[];
    patterns: string[];
  }>({ aspects: [], patterns: [] });

  useEffect(() => {
    const calculateAspectsAndPatterns = async () => {
      try {
        const aspects = calculateAllAspects(planets);
        const patterns = await detectAspectPatterns(aspects);
        setAspectsAndPatterns({ aspects, patterns });
      } catch (error) {
        console.error('アスペクト計算エラー:', error);
        setAspectsAndPatterns({ aspects: [], patterns: [] });
      }
    };

    calculateAspectsAndPatterns();
  }, [planets]);
  
  // デフォルトメッセージをメモ化
  const defaultMessage = useMemo(() => ({
    id: '1',
    role: 'assistant' as const,
    content: `こんにちは、${birthData.name}さん！私は占星術師のAIです。あなたの天体配置を拝見させていただきました。${aspectsAndPatterns.aspects.length > 0 ? `${aspectsAndPatterns.aspects.filter((a: any) => a.exactness >= 50).length}個の重要なアスペクト` : '基本的な天体配置'}と${aspectsAndPatterns.patterns.length > 0 ? '特別なアスペクトパターン' : '一般的な配置'}も分析済みです。何かお聞きになりたいことはございますか？恋愛、仕事、健康、スピリチュアルな成長など、どんなことでもお気軽にご相談ください。✨`,
    timestamp: new Date(),
    category: 'general' as const
  }), [birthData.name, aspectsAndPatterns.aspects.length, aspectsAndPatterns.patterns.length]);

  // 初期メッセージの復元をメモ化
  const initialMessages = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Date型を復元
        return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      } catch {
        return [defaultMessage];
      }
    }
    return [defaultMessage];
  }, [STORAGE_KEY, defaultMessage]);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'love' | 'career' | 'health' | 'spiritual'>('general');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // スクロール関数をメモ化
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 履歴保存をメモ化（デバウンス付き）
  const saveHistory = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, STORAGE_KEY]);

  useEffect(() => {
    const timeoutId = setTimeout(saveHistory, 500); // デバウンス
    return () => clearTimeout(timeoutId);
  }, [saveHistory]);

  // カテゴリ関連をメモ化
  const categoryLabels = useMemo(() => ({
    general: '全般',
    love: '恋愛',
    career: '仕事',
    health: '健康',
    spiritual: 'スピリチュアル'
  }), []);

  const categoryEmojis = useMemo(() => ({
    general: '💫',
    love: '💕',
    career: '💼',
    health: '💪',
    spiritual: '✨'
  }), []);

  const suggestedQuestions = useMemo(() => ({
    general: [
      '私の天体の特別な関係性について教えて',
      '今の私に必要なことは何ですか？',
      '人生の転機はいつ頃訪れますか？'
    ],
    love: [
      '私のアスペクトから見る恋愛の傾向は？',
      '理想のパートナーとの出会いはいつですか？',
      '今の恋愛関係についてアドバイスをください'
    ],
    career: [
      '私の才能を活かせる職業は何ですか？',
      '転職に適した時期はいつですか？',
      '仕事で成功するためのアドバイスをください'
    ],
    health: [
      'アスペクトから見る健康管理のポイントは？',
      'ストレス解消に効果的な方法は？',
      '体調管理のアドバイスをください'
    ],
    spiritual: [
      '私の魂の使命は何ですか？',
      'アスペクトパターンが示すスピリチュアルな意味は？',
      '直感力を高める方法を教えてください'
    ]
  }), []);

  // メッセージ送信関数をメモ化（アスペクト情報追加）
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !birthData || !planets) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // トランジット情報を取得
      const transitInfo = await getTransitInfoForChat(birthData, new Date());
      
      // トランジット情報を含むメッセージ履歴を作成
      const messagesWithTransit = addTransitContextToChat(messages, birthData);
      
      // 最新のメッセージにトランジット情報を追加
      const enhancedUserMessage = {
        ...userMessage,
        content: `${userMessage.content}\n\n${transitInfo}`
      };
      
      // アスペクト情報とパターンを追加してAI呼び出し
      const response = await chatWithAIAstrologer(
        enhancedUserMessage.content,
        birthData,
        planets,
        messagesWithTransit,
        selectedCategory,
        aspectsAndPatterns.aspects, // アスペクト情報を追加
        aspectsAndPatterns.patterns  // アスペクトパターンを追加
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        category: selectedCategory
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('チャットエラー:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '申し訳ございません。一時的なエラーが発生しました。しばらく時間をおいて再度お試しください。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputMessage, birthData, planets, messages, selectedCategory, aspectsAndPatterns]);

  // キー押下ハンドラーをメモ化
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // カテゴリ選択をメモ化
  const handleCategorySelect = useCallback((category: typeof selectedCategory) => {
    setSelectedCategory(category);
  }, []);

  // ナビゲーション関数をメモ化
  const handleBackNavigation = useCallback(() => {
    // ページトップに移動
    window.scrollTo(0, 0);
    navigate('/result');
  }, [navigate]);

  return (
    <div className="ai-chat">
      <div style={{textAlign: 'right', marginBottom: 8}}>
        <button className="btn-secondary" onClick={handleBackNavigation}>
          ← 分析結果に戻る
        </button>
      </div>
      <div className="chat-header">
        <h2>🤖 AI占い師との対話</h2>
        <p>あなた専用の占星術師AIがお答えします</p>
      </div>

      <div className="category-selector">
        <h3>相談カテゴリ</h3>
        <div className="category-buttons">
          {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category as typeof selectedCategory)}
            >
              {categoryEmojis[category as keyof typeof categoryEmojis]} {categoryLabels[category as keyof typeof categoryLabels]}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message ai-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="suggested-questions">
        <h4>💡 よくある質問例</h4>
        <div className="question-buttons">
          {suggestedQuestions[selectedCategory].map((question, index) => (
            <button
              key={index}
              className="suggested-question-btn"
              onClick={() => setInputMessage(question)}
              disabled={loading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`${categoryEmojis[selectedCategory as keyof typeof categoryEmojis]} ${categoryLabels[selectedCategory as keyof typeof categoryLabels]}について何でもお聞きください...`}
          rows={3}
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || loading}
          className="send-button"
        >
          {loading ? '💭 送信中...' : '📤 送信'}
        </button>
      </div>
    </div>
  );
});

export default AIChat; 