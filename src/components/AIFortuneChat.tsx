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

  // 前回のモードに基づく提案質問の初期化
  useEffect(() => {
    console.log('🔍 提案質問useEffect実行: birthData =', birthData ? '存在します' : '存在しません');
    
    // previousModeを確認して適切な提案質問を表示
    const previousMode = localStorage.getItem('previousMode');
    console.log('🔍 提案質問useEffect: previousMode =', previousMode);
    
    let suggestions: SuggestionChip[] = [];
    
    if (previousMode === 'ten-planets') {
      // Level3からの遷移の場合
      const level3Suggestions = getLevel3FortuneSuggestions();
      console.log('🔍 提案質問useEffect: Level3提案数 =', level3Suggestions.length);
      if (level3Suggestions.length > 0) {
        console.log('🔍 提案質問useEffect: Level3提案を設定します');
        console.log('🔍 設定するLevel3提案:', level3Suggestions);
        suggestions = level3Suggestions;
      }
    } else {
      // Level1からの遷移またはその他の場合 (sun-sign等)
      const level1Suggestions = getLevel1FortuneSuggestions();
      console.log('🔍 提案質問useEffect: Level1提案数 =', level1Suggestions.length);
      if (level1Suggestions.length > 0) {
        console.log('🔍 提案質問useEffect: Level1提案を設定します');
        console.log('🔍 設定するLevel1提案:', level1Suggestions);
        suggestions = level1Suggestions;
      }
    }
    
    if (suggestions.length > 0) {
      setSuggestions(suggestions);
      console.log('🔍 setSuggestions実行完了');
    } else {
      console.log('🔍 提案質問useEffect: ランダム提案を設定します');
      // どちらの結果もない場合はランダム質問を表示
      setSuggestions(getRandomSuggestions());
    }
  }, [birthData]);

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
      
      // 質問に関連する占い結果を取得
      const fortuneContext = getFortuneContext(question);
      
      // プロンプトを構築
      let prompt = `あなたは経験豊富で心温かい占い師です。相談者に寄り添い、丁寧で思いやりのある回答をしてください。

【重要】毎回新しい視点で分析し、異なる角度からのアドバイスを提供してください。同じ内容の繰り返しは避け、新鮮な洞察を含めてください。

相談者の質問: ${question}

${getTimeContextForAI()}

分析ID: ${Math.random().toString(36).substr(2, 9)}

`;

      // 占い結果の文脈がある場合は追加
      if (fortuneContext) {
        prompt += `【今日の占い結果（詳細参考情報）】\n${fortuneContext}\n\n【重要な指示】上記の占い結果を基に、質問に対してより具体的で詳しい解釈とアドバイスを提供してください。
- 占い結果の内容を深く掘り下げて分析してください
- なぜそのような運勢になるのか占星術的な理由を詳しく説明してください  
- 占い結果に書かれている内容を更に具体化して、実生活でどう活用するかを詳しく説明してください
- 時間帯、場所、方法、注意点など具体的な要素を複数含めてください
- 占い結果では触れられていない新しい視点や深い洞察も追加してください\n\n`;
      }

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
- 占い結果を深く分析し、なぜそのような運勢になるのか詳細に説明してください
- 具体的で実践的なアドバイスを複数提供してください（例：「今日の午後2-4時頃」「明日の朝一番に」など時間帯も含む）
- 占星術的な観点を詳しく織り交ぜてください（天体の配置、星座の特徴、アスペクトの影響など）
- 前回とは異なる視点や新しい観点を必ず含めてください
- 抽象的な表現を避け、具体的な行動や状況を詳しく説明してください
- 文章の長さは400-600文字程度で、深掘りした詳しい内容にしてください
- 「なぜそうなるのか」という占星術的な理由や背景を詳しく説明してください
- 実際の生活で活用できる具体的なアドバイスを3-4個提供してください
- 数字や具体的な期間、時間帯、場所なども含めてください
- ユーザーが「なるほど！」と納得できる深い洞察を提供してください

【必須の深掘り要素】
- 占星術的な根拠（惑星の位置、星座の影響、アスペクトなど）
- 具体的な時間帯や期間の指定
- 実践的な行動指針（3-4個）
- 注意すべき具体的なポイント
- 期待できる具体的な結果や変化

【回答の構成】
1. 占い結果の深い解釈と占星術的根拠
2. なぜそのような結果になるのかの詳細な理由
3. 具体的な行動アドバイス（時間帯・場所・方法を含む）
4. 注意すべき具体的なポイントと対策
5. 期待できる変化と前向きなメッセージ

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

  // 提案チップの定義（一般的な質問）
  const allSuggestionChips: SuggestionChip[] = [
    // 恋愛運関連
    { id: '1', text: '恋愛について', icon: '💕', category: 'love' },
    { id: '2', text: '出会いについて', icon: '💖', category: 'love' },
    { id: '3', text: '復縁について', icon: '💔', category: 'love' },
    { id: '4', text: '告白について', icon: '💌', category: 'love' },
    { id: '5', text: '結婚について', icon: '💍', category: 'love' },
    
    // 仕事運関連
    { id: '6', text: '昇進について', icon: '📈', category: 'career' },
    { id: '7', text: '転職について', icon: '🚀', category: 'career' },
    { id: '8', text: '起業について', icon: '💡', category: 'career' },
    { id: '9', text: '職場の人間関係について', icon: '👔', category: 'career' },
    { id: '10', text: '副業について', icon: '💻', category: 'career' },
    
    // 健康運関連
    { id: '11', text: '健康について', icon: '🍃', category: 'health' },
    { id: '12', text: 'ストレスについて', icon: '🧘', category: 'health' },
    { id: '13', text: '運動について', icon: '🏃', category: 'health' },
    { id: '14', text: '体調について', icon: '🤒', category: 'health' },
    
    // 全体運関連
    { id: '15', text: '今年の運勢について', icon: '🌟', category: 'fortune' },
    { id: '16', text: '注意すべき時期について', icon: '⚠️', category: 'fortune' },
    { id: '17', text: 'ラッキーアイテムについて', icon: '🍀', category: 'fortune' },
    { id: '18', text: '人間関係について', icon: '👥', category: 'general' },
    { id: '19', text: '引っ越しについて', icon: '🏠', category: 'general' },
    { id: '20', text: '新しいことについて', icon: '🌱', category: 'general' },
    
    // 金運関連
    { id: '21', text: '金運について', icon: '💰', category: 'fortune' },
    { id: '22', text: '投資について', icon: '📊', category: 'fortune' },
    { id: '23', text: '宝くじについて', icon: '🎰', category: 'fortune' },
    
    // 家族関連
    { id: '24', text: '家族関係について', icon: '👨‍👩‍👧‍👦', category: 'general' },
    { id: '25', text: '子育てについて', icon: '👶', category: 'general' },
  ];

  // Level1占い結果に基づく深掘り質問を生成
  const getLevel1FortuneSuggestions = (): SuggestionChip[] => {
    if (!birthData) {
      console.log('🔍 Level1深掘り質問: birthDataがありません');
      return [];
    }
    
    const today = new Date().toISOString().split('T')[0];
    const level1Key = `level1_fortune_${birthData.name}_${today}`;
    console.log('🔍 Level1深掘り質問: キー =', level1Key);
    
    try {
      const storedLevel1 = localStorage.getItem(level1Key);
      console.log('🔍 Level1深掘り質問: 保存データ =', storedLevel1 ? '見つかりました' : '見つかりません');
      if (!storedLevel1) return [];
      
      const fortuneData = JSON.parse(storedLevel1);
      console.log('🔍 Level1深掘り質問: 占い結果 =', fortuneData.result ? '存在します' : '存在しません');
      const suggestions: SuggestionChip[] = [];
      
      // 各運勢の深掘り質問を生成
      if (fortuneData.result) {
        // 全体運の深掘り
        if (fortuneData.result.includes('全体運') || fortuneData.result.includes('総合運')) {
          suggestions.push({
            id: 'level1-overall',
            text: '全体運をもっと詳しく',
            icon: '🌟',
            category: 'fortune'
          });
        }
        
        // 恋愛運の深掘り
        if (fortuneData.result.includes('恋愛運') || fortuneData.result.includes('恋愛')) {
          suggestions.push({
            id: 'level1-love',
            text: '恋愛運をもっと詳しく',
            icon: '❤️',
            category: 'love'
          });
        }
        
        // 仕事運の深掘り
        if (fortuneData.result.includes('仕事運') || fortuneData.result.includes('仕事')) {
          suggestions.push({
            id: 'level1-work',
            text: '仕事運をもっと詳しく',
            icon: '💼',
            category: 'career'
          });
        }
        
        // 健康運の深掘り
        if (fortuneData.result.includes('健康運') || fortuneData.result.includes('健康')) {
          suggestions.push({
            id: 'level1-health',
            text: '健康運をもっと詳しく',
            icon: '💪',
            category: 'health'
          });
        }
        
        // 金運の深掘り
        if (fortuneData.result.includes('金運') || fortuneData.result.includes('金銭運') || fortuneData.result.includes('財運')) {
          suggestions.push({
            id: 'level1-money',
            text: '金銭運をもっと詳しく',
            icon: '💰',
            category: 'fortune'
          });
        }
        
        // 重要な日の深掘り
        if (fortuneData.result.includes('重要な日') || fortuneData.result.includes('ラッキーデー') || fortuneData.result.includes('注意日')) {
          suggestions.push({
            id: 'level1-important-days',
            text: '重要な日をもっと詳しく',
            icon: '📅',
            category: 'fortune'
          });
        }
      }
      
      console.log('🔍 Level1深掘り質問: 生成された提案数 =', suggestions.length);
      console.log('🔍 Level1深掘り質問: 提案内容 =', suggestions.map(s => s.text));
      return suggestions.slice(0, 6); // 最大6個まで
    } catch (error) {
      console.warn('Level1占い結果の読み込みエラー:', error);
      return [];
    }
  };

  // 質問に関連する占い結果の文脈を取得する関数
  const getFortuneContext = (question: string): string | null => {
    if (!birthData) return null;
    
    const today = new Date().toISOString().split('T')[0];
    
    // previousModeに基づいて適切な占い結果を取得
    const previousMode = localStorage.getItem('previousMode');
    
    if (previousMode === 'ten-planets') {
      // Level3からの遷移の場合
      const level3Key = `level3_analysis_result_${birthData.name}_${today}`;
      try {
        const storedLevel3 = localStorage.getItem(level3Key);
        if (storedLevel3) {
          const analysisData = JSON.parse(storedLevel3);
          if (analysisData.tenPlanetSummary) {
            const summary = analysisData.tenPlanetSummary;
            
            // 質問内容に応じて関連する分析結果を詳しく返す
            if (question.includes('総合的な影響') || question.includes('総合')) {
              let context = `総合的な影響: ${summary.overallInfluence}`;
              // 関連する他の項目も参考として含める
              context += `\n\n関連情報：\n- 話し方の癖: ${summary.communicationStyle.substring(0, 150)}...\n- 恋愛や行動: ${summary.loveAndBehavior.substring(0, 150)}...`;
              return context;
            } else if (question.includes('話し方') || question.includes('コミュニケーション')) {
              let context = `話し方の癖: ${summary.communicationStyle}`;
              // 総合的な影響も参考として含める
              context += `\n\n総合的な影響（参考）: ${summary.overallInfluence.substring(0, 200)}...`;
              return context;
            } else if (question.includes('恋愛') || question.includes('行動')) {
              let context = `恋愛や行動: ${summary.loveAndBehavior}`;
              // 総合的な影響も参考として含める
              context += `\n\n総合的な影響（参考）: ${summary.overallInfluence.substring(0, 200)}...`;
              return context;
            } else if (question.includes('仕事') || question.includes('振る舞い')) {
              let context = `仕事での振る舞い: ${summary.workBehavior}`;
              // 総合的な影響も参考として含める
              context += `\n\n総合的な影響（参考）: ${summary.overallInfluence.substring(0, 200)}...`;
              return context;
            } else if (question.includes('変革') || question.includes('深層心理')) {
              let context = `変革と深層心理: ${summary.transformationAndDepth}`;
              // 総合的な影響も参考として含める
              context += `\n\n総合的な影響（参考）: ${summary.overallInfluence.substring(0, 200)}...`;
              return context;
            } else {
              // 全体的な文脈を詳しく提供
              return `あなたの印象診断結果（詳細）:\n\n- 総合的な影響: ${summary.overallInfluence}\n\n- 話し方の癖: ${summary.communicationStyle}\n\n- 恋愛や行動: ${summary.loveAndBehavior}\n\n- 仕事での振る舞い: ${summary.workBehavior}\n\n- 変革と深層心理: ${summary.transformationAndDepth}`;
            }
          }
        }
      } catch (error) {
        console.warn('Level3結果の読み込みエラー:', error);
      }
    } else if (previousMode === 'sun-sign') {
      // Level1からの遷移の場合
      const level1Key = `level1_fortune_${birthData.name}_${today}`;
      try {
        const storedLevel1 = localStorage.getItem(level1Key);
        if (storedLevel1) {
          const fortuneData = JSON.parse(storedLevel1);
          if (fortuneData.result) {
            // 質問内容に応じて関連する運勢を詳しく抽出
            if (question.includes('全体運') || question.includes('総合運')) {
              const match = fortuneData.result.match(/【全体運】[^【]*/);
              const baseContent = match ? match[0] : `今日の全体運について詳しくお答えします。`;
              // 関連する他の運勢も少し含める
              const loveMatch = fortuneData.result.match(/【恋愛運】[^【]*/);
              const workMatch = fortuneData.result.match(/【仕事運】[^【]*/);
              let context = baseContent;
              if (loveMatch) context += `\n\n参考：${loveMatch[0].substring(0, 100)}...`;
              if (workMatch) context += `\n\n参考：${workMatch[0].substring(0, 100)}...`;
              return context;
            } else if (question.includes('恋愛運') || question.includes('恋愛')) {
              const match = fortuneData.result.match(/【恋愛運】[^【]*/);
              const baseContent = match ? match[0] : `今日の恋愛運について詳しくお答えします。`;
              // 全体運も参考として含める
              const overallMatch = fortuneData.result.match(/【全体運】[^【]*/);
              let context = baseContent;
              if (overallMatch) context += `\n\n全体運の参考：${overallMatch[0].substring(0, 100)}...`;
              return context;
            } else if (question.includes('仕事運') || question.includes('仕事')) {
              const match = fortuneData.result.match(/【仕事運】[^【]*/);
              const baseContent = match ? match[0] : `今日の仕事運について詳しくお答えします。`;
              // 全体運も参考として含める
              const overallMatch = fortuneData.result.match(/【全体運】[^【]*/);
              let context = baseContent;
              if (overallMatch) context += `\n\n全体運の参考：${overallMatch[0].substring(0, 100)}...`;
              return context;
            } else if (question.includes('健康運') || question.includes('健康')) {
              const match = fortuneData.result.match(/【健康運】[^【]*/);
              const baseContent = match ? match[0] : `今日の健康運について詳しくお答えします。`;
              // 全体運も参考として含める
              const overallMatch = fortuneData.result.match(/【全体運】[^【]*/);
              let context = baseContent;
              if (overallMatch) context += `\n\n全体運の参考：${overallMatch[0].substring(0, 100)}...`;
              return context;
            } else if (question.includes('金運') || question.includes('金銭運')) {
              const match = fortuneData.result.match(/【金運】[^【]*/);
              const baseContent = match ? match[0] : `今日の金運について詳しくお答えします。`;
              // 全体運も参考として含める
              const overallMatch = fortuneData.result.match(/【全体運】[^【]*/);
              let context = baseContent;
              if (overallMatch) context += `\n\n全体運の参考：${overallMatch[0].substring(0, 100)}...`;
              return context;
            } else if (question.includes('重要な日') || question.includes('ラッキーデー')) {
              const match = fortuneData.result.match(/【重要な日】[^【]*/);
              const baseContent = match ? match[0] : `重要な日について詳しくお答えします。`;
              // 全体運も参考として含める
              const overallMatch = fortuneData.result.match(/【全体運】[^【]*/);
              let context = baseContent;
              if (overallMatch) context += `\n\n全体運の参考：${overallMatch[0].substring(0, 100)}...`;
              return context;
            } else {
              // 全体的な文脈を詳しく提供（文字数制限を緩和）
              return fortuneData.result.substring(0, 800) + (fortuneData.result.length > 800 ? '...' : '');
            }
          }
        }
      } catch (error) {
        console.warn('Level1結果の読み込みエラー:', error);
      }
    }
    
    return null;
  };

  // Level3の深掘り質問を生成する関数
  const getLevel3FortuneSuggestions = (): SuggestionChip[] => {
    if (!birthData) {
      console.log('🔍 Level3深掘り質問: birthDataがありません');
      return [];
    }
    
    const today = new Date().toISOString().split('T')[0];
    const level3Key = `level3_analysis_result_${birthData.name}_${today}`;
    console.log('🔍 Level3深掘り質問: キー =', level3Key);
    
    try {
      const storedLevel3 = localStorage.getItem(level3Key);
      console.log('🔍 Level3深掘り質問: 保存データ =', storedLevel3 ? '見つかりました' : '見つかりません');
      if (!storedLevel3) return [];
      
      const analysisData = JSON.parse(storedLevel3);
      console.log('🔍 Level3深掘り質問: 分析結果 =', analysisData.tenPlanetSummary ? '存在します' : '存在しません');
      const suggestions: SuggestionChip[] = [];
      
      // Level3の5つの分析項目に基づく深掘り質問を生成
      if (analysisData.tenPlanetSummary) {
        const summary = analysisData.tenPlanetSummary;
        
        // 総合的な影響の深掘り
        if (summary.overallInfluence) {
          suggestions.push({
            id: 'level3-overall-influence',
            text: '総合的な影響をもっと詳しく',
            icon: '🌟',
            category: 'fortune'
          });
        }
        
        // 話し方の癖の深掘り
        if (summary.communicationStyle) {
          suggestions.push({
            id: 'level3-communication',
            text: '話し方の癖をもっと詳しく',
            icon: '💬',
            category: 'general'
          });
        }
        
        // 恋愛や行動の深掘り
        if (summary.loveAndBehavior) {
          suggestions.push({
            id: 'level3-love-behavior',
            text: '恋愛や行動をもっと詳しく',
            icon: '💕',
            category: 'love'
          });
        }
        
        // 仕事での振る舞いの深掘り
        if (summary.workBehavior) {
          suggestions.push({
            id: 'level3-work-behavior',
            text: '仕事での振る舞いをもっと詳しく',
            icon: '💼',
            category: 'career'
          });
        }
        
        // 変革と深層心理の深掘り
        if (summary.transformationAndDepth) {
          suggestions.push({
            id: 'level3-transformation',
            text: '変革と深層心理をもっと詳しく',
            icon: '🔮',
            category: 'general'
          });
        }
        
        // Level3特有の追加質問
        suggestions.push({
          id: 'level3-personality-analysis',
          text: '性格分析をさらに深く',
          icon: '🧠',
          category: 'general'
        });
      }
      
      console.log('🔍 Level3深掘り質問: 生成された提案数 =', suggestions.length);
      console.log('🔍 Level3深掘り質問: 提案内容 =', suggestions.map(s => s.text));
      return suggestions.slice(0, 6); // 最大6個まで
    } catch (error) {
      console.warn('Level3分析結果の読み込みエラー:', error);
      return [];
    }
  };

  // ランダムに5つの質問を選択（Level1結果がない場合のフォールバック）
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
    // 提案質問は別のuseEffectで設定されるため、ここでは設定しない
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
    // AI応答後も占い結果に基づく提案質問を優先的に表示
    const previousMode = localStorage.getItem('previousMode');
    let fortuneBasedSuggestions: SuggestionChip[] = [];
    
    if (previousMode === 'ten-planets') {
      // Level3からの遷移の場合
      fortuneBasedSuggestions = getLevel3FortuneSuggestions();
    } else if (previousMode === 'sun-sign') {
      // Level1からの遷移の場合
      fortuneBasedSuggestions = getLevel1FortuneSuggestions();
    }
    
    if (fortuneBasedSuggestions.length > 0) {
      // 占い結果に基づく提案質問がある場合は、それを使用
      // ただし、既に使用済みの提案は除外
      const currentSuggestionIds = suggestions.map(s => s.id);
      const unusedFortuneSuggestions = fortuneBasedSuggestions.filter(
        s => !currentSuggestionIds.includes(s.id)
      );
      
      if (unusedFortuneSuggestions.length > 0) {
        setSuggestions(unusedFortuneSuggestions.slice(0, 5));
        return;
      } else {
        // 🔧 占い結果の提案質問がすべて使い切られた場合は、提案チップを非表示にする
        // 占い結果に基づく会話を継続するため、一般的な質問には切り替えない
        setSuggestions([]);
        return;
      }
    }
    
    // 占い結果に基づく提案がない場合は、質問カテゴリに基づく提案を表示
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
    
    // 🔧 占い結果に関連する質問の場合は、占い結果ベースの提案を継続
    if (lowerQuestion.includes('全体運') || lowerQuestion.includes('詳しく') || 
        lowerQuestion.includes('もっと') || lowerQuestion.includes('さらに')) {
      return 'fortune';
    }
    
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
    // 提案質問をクリックしたときは、簡潔な質問文のみを表示
    // （占い結果の詳細は内部的にAIに渡すが、ユーザーには表示しない）
    handleSendMessage(suggestion.text);
    
    // クリックされた提案を削除（一度使用した提案は非表示にする）
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
              const level1Key = `level1_fortune_${userName}_${today}`;
              
              let currentLevel = '';
              if (localStorage.getItem(level3Key)) {
                currentLevel = 'Level3: 星が伝える印象診断';
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
            
            // Level3 → Level1の順で確認（Level2削除済み）
            const level3Key = `level3_fortune_${userName}_${today}`;
            const level1Key = `level1_fortune_${userName}_${today}`;
            
            console.log('🔍 【レベル判定チェック】');
            console.log('  level3Key:', level3Key, '→', !!localStorage.getItem(level3Key));
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
          {(() => { console.log('🔍 レンダリング時のsuggestions:', suggestions.map(s => s.text)); return null; })()}
          <h4>💡 {suggestions.some(s => s.id.startsWith('level1-') || s.id.startsWith('level3-')) ? 'どの占い結果を詳しく知りたいですか？' : 'こんな質問はいかがですか？'}</h4>
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