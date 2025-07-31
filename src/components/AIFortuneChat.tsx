import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatWithAIAstrologer } from '../utils/aiAnalyzer';
import { getTimeContextForAI } from '../utils/dateUtils';
import { BirthData } from '../types';
import AdBanner from './AdBanner';
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
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // コンポーネントマウント時に画面の一番上にスクロール
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ウィンドウサイズ変更監視
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 出生データを取得
  useEffect(() => {
    const birthDataRaw = localStorage.getItem('birthData');
    if (birthDataRaw) {
      try {
        const parsedData = JSON.parse(birthDataRaw);
        // birthDateを適切にDateオブジェクトに変換
        if (parsedData.birthDate) {
          if (typeof parsedData.birthDate === 'string') {
            parsedData.birthDate = new Date(parsedData.birthDate);
          } else if (!(parsedData.birthDate instanceof Date)) {
            // DateオブジェクトでもStringでもない場合はStringとして扱ってからDate変換
            parsedData.birthDate = new Date(String(parsedData.birthDate));
          }
        }
        console.log('🔍 変換後のbirthData:', parsedData);
        setBirthData(parsedData);
      } catch (error) {
        console.error('出生データの解析エラー:', error);
      }
    }
  }, []);

  // AIを使った占い応答生成関数
  const generateAIResponse = async (question: string): Promise<string> => {
    console.log('🔍 AI応答生成開始:', question);
    
    try {
      // 占星術分析データを取得
      const astrologyData = getAstrologyData();
      
      // プロンプトを構築
      let prompt = `あなたは経験豊富で心温かい占い師です。相談者に寄り添い、丁寧で思いやりのある回答をしてください。

【重要】毎回新しい視点で分析し、異なる角度からのアドバイスを提供してください。同じ内容の繰り返しは避け、新鮮な洞察を含めてください。

相談者の質問: ${question}

${getTimeContextForAI()}

分析ID: ${Math.random().toString(36).substr(2, 9)}

`;

      // 占星術データがある場合は追加情報として付記
      if (astrologyData && birthData) {
        prompt += `【参考情報】\n`;
        prompt += `相談者: ${birthData.name}さん\n`;
        
        if (astrologyData.type === '10天体分析') {
          const data = astrologyData.data;
          prompt += `10天体分析結果:\n`;
          if (data.basicPersonality) prompt += `- 基本性格: ${data.basicPersonality.substring(0, 100)}...\n`;
          if (data.loveAndAction) prompt += `- 恋愛・行動: ${data.loveAndAction.substring(0, 100)}...\n`;
          if (data.workAndGrowth) prompt += `- 仕事・成長: ${data.workAndGrowth.substring(0, 100)}...\n`;
        } else if (astrologyData.type === '3天体分析') {
          const data = astrologyData.data;
          prompt += `3天体分析結果:\n`;
          if (data.combinedAnalysis?.overview) prompt += `- 全体像: ${data.combinedAnalysis.overview.substring(0, 100)}...\n`;
          if (data.combinedAnalysis?.basicPersonality) prompt += `- 基本性格: ${data.combinedAnalysis.basicPersonality.substring(0, 100)}...\n`;
        } else if (astrologyData.type === '太陽星座') {
          prompt += `太陽星座: ${astrologyData.data.sunSign}\n`;
        }
        
        prompt += `\n`;
      }

      prompt += `【回答方針】
- 相談者の気持ちに寄り添い、共感を示してください
- 具体的で実践的なアドバイスを含めてください  
- 希望と前向きな視点を提供してください
- 占星術的な観点を適度に織り交ぜてください
- 丁寧で温かい言葉遣いを心がけてください
- 前回とは異なる視点や新しい観点を必ず含めてください

回答:`;

      console.log('🔍 AI API呼び出し開始...');
      
      // 実際にAI APIを呼び出す
      const safeBirthData = birthData || { 
        name: 'ユーザー', 
        birthDate: new Date(), 
        birthTime: '12:00', 
        birthPlace: { city: '', latitude: 0, longitude: 0, timezone: 'Asia/Tokyo' } 
      };

      // birthDateがDateオブジェクトであることを確認
      if (safeBirthData.birthDate && !(safeBirthData.birthDate instanceof Date)) {
        safeBirthData.birthDate = new Date(safeBirthData.birthDate);
      }

      const response = await chatWithAIAstrologer(
        prompt,
        safeBirthData,
        [], // 惑星データは空配列（簡易版）
        [], // チャット履歴は空配列
        'general' // カテゴリは一般
      );
      
      console.log('✅ AI API呼び出し成功:', response.length, '文字');
      return response;
    } catch (error) {
      console.error('❌ AI占い師エラー:', error);
      console.log('🔄 フォールバック応答に切り替えます');
      return generateFallbackResponse(question);
    }
  };

  // フォールバック応答（AI APIエラー時）
  const generateFallbackResponse = (question: string): string => {
    const userName = birthData?.name || 'あなた';
    const astrologyData = getAstrologyData();
    
    // 毎回異なる応答を生成するための要素
    const timestamp = new Date().toLocaleString('ja-JP');
    const randomId = Math.random().toString(36).substr(2, 9);
    const variationSeed = Math.floor(Math.random() * 3) + 1; // 1-3の乱数
    
    const responses = {
      '恋愛': `💕 ${userName}さん、恋愛についてのご相談をお聞かせいただき、ありがとうございます。愛に関する悩みは、誰にとっても大切で繊細な問題ですね。お気持ちを深くお察しいたします。

恋愛において最も重要なのは、${userName}さんがありのままの自分でいることです。無理に自分を変えようとするのではなく、${userName}さんの持つ自然な魅力を大切にしてください。相手の方との関係では、お互いの気持ちを尊重し、思いやりを持って接することが、深い絆を築く基盤となります。

コミュニケーションでは、素直な気持ちを伝えることを恐れずに。時には勇気が必要かもしれませんが、真摯な想いは必ず相手に届きます。また、相手の立場に立って考える思いやりの心も、愛を育む大切な要素です。

${astrologyData ? `${astrologyData.type}の観点から見ると、` : '星々の配置から見ると、'}${userName}さんには人を惹きつける特別な魅力があります。その魅力は、${userName}さんが自信を持って自分らしくいるときに最も輝きを放ちます。

恋愛に迷いや不安を感じるのは自然なことです。そんな時は、深呼吸をして、${userName}さんの心の声に耳を傾けてみてください。きっと答えが見つかるはずです。愛は時に試練をもたらしますが、それは${userName}さんをより成長させるための大切なプロセスなのです。

お相手との幸せな未来を心より願っております。`,

      '仕事': `💼 ${userName}さん、お仕事に関するご相談をいただき、ありがとうございます。お仕事は人生の大きな部分を占める重要な要素ですから、真剣にお考えになるのは当然のことです。日々の努力、本当にお疲れ様です。

職場での${userName}さんの価値は、きっと周囲の方々にも伝わっているはずです。${userName}さんが持つ協調性や、チームワークを大切にする姿勢は、必ず良い結果をもたらします。新しいアイデアや提案がある時は、遠慮せずに積極的に発信してください。${userName}さんの視点は、組織にとって貴重な財産となるでしょう。

人間関係においては、同僚や上司の方々との丁寧なコミュニケーションを心がけてください。相手の立場を理解し、感謝の気持ちを表現することで、より働きやすい環境を築いていけます。時には困難な状況もあるかもしれませんが、それは${userName}さんの成長の機会でもあります。

${astrologyData ? `${astrologyData.type}からも読み取れるように、` : '星々の導きからも、'}${userName}さんには仕事で大きく飛躍する力が備わっています。特に、${userName}さんの持つ真面目さや責任感は、必ず評価される時が来ます。

今は種まきの時期かもしれません。一つ一つの努力が実を結ぶまで時間がかかることもありますが、継続することの大切さを信じて歩み続けてください。${userName}さんの才能が開花する日は必ず訪れます。

応援しております。自信を持って、${userName}さんらしい道を歩んでくださいね。`,

      '健康': `🍃 ${userName}さん、健康についてお気遣いいただき、本当に素晴らしいことですね。心と体の健康は、人生のあらゆる面で幸せを感じるための基盤となります。${userName}さんが健康を大切に思われるお心遣いに、深く敬意を表します。

健康管理においては、まず規則正しい生活リズムを整えることから始めましょう。特に睡眠は、心身の回復とエネルギーチャージにとって極めて重要です。質の良い睡眠を取ることで、翌日の活力が大きく変わります。就寝前のリラックスタイムを設けたり、寝室の環境を整えたりして、安眠できる環境作りを心がけてください。

食事においては、バランスの良い栄養摂取を意識してください。季節の食材を取り入れたり、温かい食べ物で体を内側から温めたりすることも大切です。また、適度な運動は血流を良くし、ストレス解消にも効果的です。激しい運動である必要はありません。散歩やストレッチなど、${userName}さんが続けやすいものから始めてみてください。

心の健康も同じように重要です。ストレスを感じた時は、一人で抱え込まず、信頼できる人に話を聞いてもらったり、好きなことをして気分転換を図ったりしてください。瞑想や深呼吸なども、心を落ち着かせる効果があります。

${astrologyData ? `${astrologyData.type}から見ると、` : '星々の配置から見ると、'}${userName}さんは自然治癒力に恵まれています。ご自身の体の声に耳を傾け、無理をせず、${userName}さんのペースで健康習慣を築いていってください。

体も心も、${userName}さんにとってかけがえのない宝物です。十分にいたわり、大切にしてあげてくださいね。健やかな毎日を心より願っております。`,

      '転職': `📈 ${userName}さん、転職についてのご相談をお聞かせいただき、ありがとうございます。人生の重要な選択について真剣にお考えになっている${userName}さんのお気持ち、とてもよく理解できます。新しい環境への挑戦は勇気の要ることですが、同時に大きな成長の機会でもありますね。

転職を考える際には、まず現在の状況を客観的に振り返ってみることが大切です。今の職場で得られた経験やスキル、そして改善したい点を整理してみてください。また、転職によって何を実現したいのか、具体的な目標を明確にすることも重要です。

準備期間としては、スキルアップや資格取得に時間を投資することをお勧めします。業界の動向を研究したり、人脈を広げたりすることも、転職成功の鍵となります。LinkedInなどのプロフェッショナルネットワークを活用したり、業界のセミナーに参加したりするのも良いでしょう。

転職活動では、${userName}さんの経験や能力を活かせる環境を見つけることが最も重要です。給与や待遇だけでなく、企業文化や将来性、成長の機会なども総合的に考慮してください。面接では、${userName}さんの熱意と真摯な姿勢を伝えることで、きっと良い印象を与えられるでしょう。

${astrologyData ? `${astrologyData.type}からも読み取れるように、` : '星々の導きからも、'}${userName}さんには新しい環境で輝く力があります。変化を恐れる必要はありません。${userName}さんの持つ柔軟性と向上心は、どのような職場でも大きな財産となるはずです。

焦らず、${userName}さんにとって最適なタイミングと機会を見極めてください。準備が整った時、自然と道は開けるものです。${userName}さんの新たな挑戦を心より応援しております。`,

      '金運': `💰 ${userName}さん、金運についてのご相談をいただき、ありがとうございます。お金は生活の基盤であり、将来への安心感にも直結する重要な要素ですから、しっかりと向き合われるのは賢明なことです。${userName}さんの堅実なお考えに敬意を表します。

金運を向上させるためには、まず現在の家計状況を正確に把握することから始めましょう。収入と支出を詳細に記録し、無駄な出費がないかを見直してみてください。小さな節約の積み重ねが、長期的には大きな資産形成につながります。

貯蓄においては、目標を設定することが大切です。短期的な目標（旅行資金など）と長期的な目標（老後資金など）を分けて考え、それぞれに適した貯蓄方法を選択してください。定期預金や積立投資など、${userName}さんのリスク許容度に合わせた選択肢を検討してみましょう。

投資を考える場合は、十分な知識を身につけてから始めることをお勧めします。書籍やセミナーで学習したり、信頼できるファイナンシャルアドバイザーに相談したりして、リスクを理解した上で判断してください。分散投資やドルコスト平均法など、リスクを抑える手法も学んでおくと良いでしょう。

副収入の獲得も金運向上の一つの方法です。${userName}さんのスキルや趣味を活かして、フリーランスの仕事やオンライン販売などに挑戦してみるのも良いかもしれません。ただし、本業に支障をきたさない範囲で行うことが重要です。

${astrologyData ? `${astrologyData.type}から見ると、` : '星々の配置から見ると、'}${userName}さんには堅実に富を築く力があります。一攫千金を狙うのではなく、コツコツと努力を重ねることで、着実に豊かさを手に入れることができるでしょう。

お金は大切ですが、${userName}さんの幸せと健康が何よりも重要です。金銭的な豊かさと心の豊かさのバランスを取りながら、充実した人生を歩んでいってくださいね。${userName}さんの金運向上を心より願っております。`,
    };

    // 質問に対応する応答を探す（毎回異なる内容を生成）
    for (const [keyword, response] of Object.entries(responses)) {
      if (question.includes(keyword)) {
        // 基本の応答に時間とランダム要素を追加
        const variation = variationSeed === 1 ? '新しい視点から見ると、' : 
                         variationSeed === 2 ? '星々の配置から判断すると、' : 
                         '今この瞬間の宇宙の流れを読み取ると、';
        
        const additionalInsight = variationSeed === 1 ? 
          `\n\n💫 今日は特に${keyword}に関して、積極的な行動を起こすのに適した日です。タイミングを大切にしてください。` :
          variationSeed === 2 ? 
          `\n\n⭐ 最近の星の動きから、${keyword}について新しい発見や気づきがありそうです。心を開いて受け入れてみてください。` :
          `\n\n🌙 ${keyword}に関して、直感を信じることが特に重要な時期です。論理よりも感情を優先してみてください。`;
        
        return variation + response + additionalInsight + `\n\n【相談時刻: ${timestamp}】`;
      }
    }

    // 一般的な応答（毎回異なる内容を生成）
    const generalResponses = [
      `🌟 ${userName}さん、ご相談いただきありがとうございます。

星々からのメッセージをお伝えしますね。今の${userName}さんは、新しい可能性に向けて歩み始める大切な時期にいらっしゃいます。どんな困難があっても、それは${userName}さんが成長するための貴重な経験となるでしょう。

${astrologyData ? `${astrologyData.type}からも、` : ''}${userName}さんには素晴らしい力が備わっています。ご自身の内なる声に耳を傾け、直感を大切にしてください。きっと良い方向に向かっていけますよ。

何か他にもご相談がありましたら、お気軽にお聞かせくださいね。`,

      `✨ ${userName}さん、お心を開いてご相談いただき、感謝しております。

宇宙の流れを読み取ると、${userName}さんには今、変化の風が吹いています。これまでの経験が実を結び、新たな扉が開かれようとしています。不安を感じることもあるかもしれませんが、それは成長の証です。

${astrologyData ? `${astrologyData.type}の示すところによると、` : '星の配置から見ると、'}${userName}さんは自分らしい道を歩む力を持っています。周囲の声に惑わされず、${userName}さんの心が示す方向を信じてください。

他にも気になることがございましたら、遠慮なくお聞かせください。`,

      `🔮 ${userName}さん、貴重なお時間をいただき、ありがとうございます。

星々の輝きが${userName}さんに特別なメッセージを送っています。現在の状況は、${userName}さんが持つ潜在的な才能を開花させる絶好の機会です。今感じている迷いや不安も、実は${userName}さんの感受性の豊かさの表れなのです。

${astrologyData ? `${astrologyData.type}が物語るように、` : '天体の動きから判断すると、'}${userName}さんには人を癒し、導く特別な力があります。その力を信じて、一歩一歩前進していけば、必ず明るい未来が開けるでしょう。

また何かお聞きになりたいことがありましたら、どうぞお気軽にお声がけください。`
    ];

    // 時間とランダム要素に基づいて応答を選択
    const responseIndex = (Math.floor(Date.now() / 1000) + randomId.charCodeAt(0)) % generalResponses.length;
    return generalResponses[responseIndex] + `\n\n【相談時刻: ${timestamp}】`;
  };

  // 提案チップの定義（より詳細な質問）
  const allSuggestionChips: SuggestionChip[] = [
    // 恋愛運関連
    { id: '1', text: '今の恋愛で気をつけることは？', icon: '💕', category: 'love' },
    { id: '2', text: '運命の人にいつ出会える？', icon: '💖', category: 'love' },
    { id: '3', text: '元カレとの復縁はうまくいく？', icon: '💔', category: 'love' },
    { id: '4', text: '告白するタイミングは？', icon: '💌', category: 'love' },
    { id: '5', text: '結婚に向いている時期は？', icon: '💍', category: 'love' },
    
    // 仕事運関連
    { id: '6', text: '今の職場で昇進できる？', icon: '📈', category: 'career' },
    { id: '7', text: '転職のベストタイミングは？', icon: '🚀', category: 'career' },
    { id: '8', text: '起業のチャンスはある？', icon: '💡', category: 'career' },
    { id: '9', text: '上司との関係を改善するには？', icon: '👔', category: 'career' },
    { id: '10', text: '副業を始めるべき？', icon: '💻', category: 'career' },
    
    // 健康運関連
    { id: '11', text: '今の体調で気をつけることは？', icon: '🍃', category: 'health' },
    { id: '12', text: 'ストレス解消法を教えて', icon: '🧘', category: 'health' },
    { id: '13', text: '運動を始めるタイミングは？', icon: '🏃', category: 'health' },
    { id: '14', text: '体調不良の原因は？', icon: '🤒', category: 'health' },
    
    // 全体運関連
    { id: '15', text: '今年の運勢のポイントは？', icon: '🌟', category: 'fortune' },
    { id: '16', text: '今月気をつけるべき日は？', icon: '⚠️', category: 'fortune' },
    { id: '17', text: '今週のラッキーアイテムは？', icon: '🍀', category: 'fortune' },
    { id: '18', text: '人間関係で注意すべき点は？', icon: '👥', category: 'general' },
    { id: '19', text: '引っ越しのタイミングは？', icon: '🏠', category: 'general' },
    { id: '20', text: '新しいことを始めるべき時期は？', icon: '🌱', category: 'general' },
    
    // 金運関連
    { id: '21', text: '今年の金運はどう？', icon: '💰', category: 'fortune' },
    { id: '22', text: '投資を始めるタイミングは？', icon: '📊', category: 'fortune' },
    { id: '23', text: '宝くじを買うべき日は？', icon: '🎰', category: 'fortune' },
    
    // 家族関連
    { id: '24', text: '家族との関係を改善するには？', icon: '👨‍👩‍👧‍👦', category: 'general' },
    { id: '25', text: '子供の教育で注意すべき点は？', icon: '👶', category: 'general' },
  ];

  // ランダムに5つの質問を選択
  const getRandomSuggestions = () => {
    const shuffled = [...allSuggestionChips].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  };

  // ローカルストレージキー生成
  const generateStorageKey = (type: 'three-signs' | 'four-sections') => {
    if (!birthData) return null;
    const key = `${birthData.name}-${birthData.birthDate}-${birthData.birthTime}-${birthData.birthPlace}`;
    return `personality-analysis-${type}-${encodeURIComponent(key)}`;
  };

  // 占星術分析データを取得する関数
  const getAstrologyData = () => {
    if (!birthData) return null;
    
    // 優先順位1: 10天体の分析データ
    const fourSectionKey = generateStorageKey('four-sections');
    if (fourSectionKey) {
      const fourSectionData = localStorage.getItem(fourSectionKey);
      if (fourSectionData) {
        try {
          const parsed = JSON.parse(fourSectionData);
          return {
            type: '10天体分析',
            data: parsed
          };
        } catch (e) {
          console.error('10天体分析データの解析エラー:', e);
        }
      }
    }
    
    // 優先順位2: 3天体の分析データ
    const threeSignKey = generateStorageKey('three-signs');
    if (threeSignKey) {
      const threeSignData = localStorage.getItem(threeSignKey);
      if (threeSignData) {
        try {
          const parsed = JSON.parse(threeSignData);
          return {
            type: '3天体分析',
            data: parsed
          };
        } catch (e) {
          console.error('3天体分析データの解析エラー:', e);
        }
      }
    }
    
    // 優先順位3: 太陽星座情報
    if (birthData.birthDate) {
      const birthDate = new Date(birthData.birthDate);
      const sunSign = getSunSign(birthDate);
      return {
        type: '太陽星座',
        data: { sunSign: sunSign }
      };
    }
    
    return null;
  };

  // 太陽星座を取得する簡単な関数
  const getSunSign = (birthDate: Date) => {
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return '牡羊座';
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return '牡牛座';
    if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) return '双子座';
    if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) return '蟹座';
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return '獅子座';
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return '乙女座';
    if ((month == 9 && day >= 23) || (month == 10 && day <= 23)) return '天秤座';
    if ((month == 10 && day >= 24) || (month == 11 && day <= 22)) return '蠍座';
    if ((month == 11 && day >= 23) || (month == 12 && day <= 21)) return '射手座';
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return '山羊座';
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return '水瓶座';
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return '魚座';
    return '不明';
  };

  // 初期メッセージ
  const getInitialMessage = (): Message => {
    let greeting = '🌟 こんにちは！AI占い師のステラです。星々の導きで、あなたの悩みにお答えします。';
    
    if (birthData) {
      const astrologyData = getAstrologyData();
      if (astrologyData) {
        greeting += `\n\n${birthData.name}さんの${astrologyData.type}の情報を確認しました。あなたの星座や天体の配置を踏まえて、より詳しく占わせていただきます。`;
      } else {
        greeting += `\n\n${birthData.name}さん、お気軽にご相談ください。`;
      }
    }
    
    greeting += '\n\n何について占いましょうか？どんな些細なことでも構いません。';
    
    return {
      id: 'initial',
      text: greeting,
      isUser: false,
      timestamp: new Date()
    };
  };

  // 初期化
  useEffect(() => {
    setMessages([getInitialMessage()]);
    setSuggestions(getRandomSuggestions());
    // 画面の一番上にスクロール
    window.scrollTo(0, 0);
  }, [birthData]);

  // メッセージが追加されたら最新メッセージにスクロール（初期表示は除く）
  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLatestMessage = () => {
    latestMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // AIを使った占い応答を生成
      const response = await generateAIResponse(text);

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
        
        // 新しい返答の文頭にスクロール
        setTimeout(() => {
          scrollToLatestMessage();
        }, 100);
        
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
        
        // エラーメッセージの文頭にスクロール
        setTimeout(() => {
          scrollToLatestMessage();
        }, 100);
      }, 1500);
    }
  };

  // 提案チップの更新
  const updateSuggestions = (lastQuestion: string) => {
    const category = detectQuestionCategory(lastQuestion);
    const filteredSuggestions = allSuggestionChips.filter((chip: SuggestionChip) => 
      chip.category === category || chip.category === 'general'
    );
    // フィルタリングされた結果からランダムに5つ選択
    const shuffled = [...filteredSuggestions].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 5));
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
        {/* 占いモード選択に戻るボタン */}
        <div className="back-button-container">
          <button 
            className="back-button"
            onClick={() => {
              // previousModeとselectedModeをクリア
              localStorage.removeItem('selectedMode');
              localStorage.removeItem('previousMode');
              window.scrollTo(0, 0);
              navigate('/');
            }}
            type="button"
          >
            ← 占いモード選択に戻る
          </button>
        </div>
 
        <div className="ai-info">
          <div className="ai-avatar">🔮</div>
          <div className="ai-details">
            <h1>AI占い師 ステラ</h1>
            <p>星々の導きであなたをサポート</p>
            {/* 現在のレベル表示 */}
            {(() => {
              const userName = birthData?.name || 'user';
              const today = new Date().toISOString().split('T')[0];
              const level3Key = `level3_fortune_${userName}_${today}`;
              const level2Key = `level2_fortune_${userName}_${today}`;
              const level1Key = `level1_fortune_${userName}_${today}`;
              
              let currentLevel = '';
              if (localStorage.getItem(level3Key)) {
                currentLevel = 'Level3: 星が伝える印象診断';
              } else if (localStorage.getItem(level2Key)) {
                currentLevel = 'Level2: 隠れた自分発見占い';
              } else if (localStorage.getItem(level1Key)) {
                currentLevel = 'Level1: 太陽星座の今日の運勢';
              }
              
              return currentLevel ? (
                <p style={{ 
                  fontSize: isMobile ? '0.75rem' : '0.8rem', 
                  color: '#6b7280', 
                  marginTop: '0.25rem',
                  fontWeight: '500',
                  lineHeight: '1.3',
                  wordBreak: 'break-all'
                }}>
                  📊 {currentLevel} の相談
                </p>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* 広告表示7: AI占い師タイトルとチャット欄の間 */}
      <AdBanner 
        position="level-transition" 
        size="medium" 
        demoMode={false} 
      />

      {/* メッセージエリア */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
            ref={!message.isUser && index === messages.length - 1 ? latestMessageRef : null}
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

      {/* 元のモードに戻るボタンエリア */}
      <div className="bottom-navigation single">
        <button 
          onClick={() => {
            // previousModeを復元
            const previousMode = localStorage.getItem('previousMode');
            console.log('🔍 【戻り処理開始】previousMode:', previousMode);
            if (previousMode) {
              localStorage.setItem('selectedMode', previousMode);
              localStorage.removeItem('previousMode');
              console.log('🔍 【selectedMode復元】:', previousMode);
            }
            
            // 復元されたselectedModeを確認
            const currentSelectedMode = localStorage.getItem('selectedMode');
            console.log('🔍 【復元後selectedMode確認】:', currentSelectedMode);
            
            // 最新の占い結果レベルを判定して適切な画面に戻る
            const userName = birthData?.name || 'user';
            const today = new Date().toISOString().split('T')[0];
            
            // Level3 → Level2 → Level1の順で確認
            const level3Key = `level3_fortune_${userName}_${today}`;
            const level2Key = `level2_fortune_${userName}_${today}`;
            const level1Key = `level1_fortune_${userName}_${today}`;
            
            console.log('🔍 【レベル判定チェック】');
            console.log('  level3Key:', level3Key, '→', !!localStorage.getItem(level3Key));
            console.log('  level2Key:', level2Key, '→', !!localStorage.getItem(level2Key));
            console.log('  level1Key:', level1Key, '→', !!localStorage.getItem(level1Key));
            
            // LocalStorageの内容を詳しく確認
            console.log('🔍 【localStorage詳細確認】');
            const allKeys = Object.keys(localStorage);
            const fortuneKeys = allKeys.filter(key => key.includes('fortune'));
            console.log('  全fortune関連キー:', fortuneKeys);
            fortuneKeys.forEach(key => {
              console.log(`  ${key}:`, !!localStorage.getItem(key));
            });
            
            let targetLevel = '';
            
            if (localStorage.getItem(level3Key)) {
              targetLevel = 'level3';
            } else if (localStorage.getItem(level2Key)) {
              targetLevel = 'level2';
            } else if (localStorage.getItem(level1Key)) {
              targetLevel = 'level1';
            }
            
            console.log('🔍 【決定されたtargetLevel】:', targetLevel);
            
            if (targetLevel) {
              // 占い結果画面に戻り、指定されたレベルまでスクロール
              console.log('🔍 【navigate実行】/result へ遷移');
              navigate('/result');
              setTimeout(() => {
                const element = document.getElementById(`${targetLevel}-section`);
                if (element) {
                  console.log('🔍 【スクロール実行】', targetLevel + '-section');
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  console.warn('🔍 【スクロール失敗】要素が見つかりません:', targetLevel + '-section');
                }
              }, 100);
            } else {
              // フォールバック: 占いモード選択に戻る
              console.log('🔍 【フォールバック】占いモード選択に戻る');
              localStorage.removeItem('selectedMode');
              window.scrollTo(0, 0);
              navigate('/');
            }
          }}
          className="bottom-back-button single"
          type="button"
        >
          🔙 元のモードに戻る
        </button>
      </div>

      {/* 広告表示8: フッターの上 */}
      <AdBanner 
        position="result-bottom" 
        size="medium" 
        demoMode={false} 
      />

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
    </div>
  );
};

export default AIFortuneChat; 