import { ZodiacSign } from '../types';

// 太陽星座の基本特徴定義
interface SunSignTraits {
  personality: string;
  behavior: string;
  strengths: string;
  challenges: string;
}

const SUN_SIGN_TRAITS: { [key in ZodiacSign]: SunSignTraits } = {
  '牡羊座': {
    personality: '積極的で行動力があり、新しいことに挑戦するのが得意です。リーダーシップを発揮し、情熱的に物事に取り組みます。',
    behavior: '直感的に行動し、思い立ったらすぐに実行に移します。競争心が強く、目標に向かって真っすぐ進んでいきます。',
    strengths: '決断力、勇気、開拓精神',
    challenges: 'せっかち、短気になりやすい'
  },
  '牡牛座': {
    personality: '安定志向で実用的、着実に物事を進める力があります。美的感覚に優れ、心地よい環境を大切にします。',
    behavior: 'じっくりと考えてから行動し、一度決めたことは最後まで貫き通します。物質的な豊かさや安心感を重視します。',
    strengths: '忍耐力、現実性、審美眼',
    challenges: '頑固さ、変化への抵抗'
  },
  '双子座': {
    personality: '好奇心旺盛で知的、コミュニケーション能力に長けています。多才で様々なことに興味を持ちます。',
    behavior: '情報収集が得意で、人とのつながりを大切にします。柔軟性があり、状況に応じて対応を変えることができます。',
    strengths: '適応力、コミュニケーション力、機転',
    challenges: '飽きっぽさ、一貫性の欠如'
  },
  '蟹座': {
    personality: '感受性が豊かで、家庭や仲間を大切にします。思いやりがあり、人の気持ちを理解するのが得意です。',
    behavior: '安全で安心できる環境を求め、大切な人を守ろうとします。感情を重視し、直感的な判断をすることが多いです。',
    strengths: '共感力、保護本能、直感力',
    challenges: '感情的になりやすい、心配性'
  },
  '獅子座': {
    personality: '自信に満ち、創造性と表現力に優れています。人を引きつける魅力があり、注目されることを好みます。',
    behavior: '堂々とした態度で、自分らしさを表現します。人を楽しませることが得意で、リーダーとして周りを引っ張っていきます。',
    strengths: '表現力、自信、創造性',
    challenges: 'プライドの高さ、目立ちたがり'
  },
  '乙女座': {
    personality: '完璧主義で分析力があり、細かいところまで気を配ります。実用的で、人の役に立つことを重視します。',
    behavior: '計画的に物事を進め、効率性を求めます。批判的な視点で物事を見つめ、改善点を見つけるのが得意です。',
    strengths: '分析力、几帳面さ、奉仕精神',
    challenges: '完璧主義、批判的思考'
  },
  '天秤座': {
    personality: 'バランス感覚に優れ、調和を重視します。美的センスがあり、人との関係を大切にします。',
    behavior: '公平性を求め、対立を避けて平和的な解決を目指します。社交的で、人とのつながりを通じて成長していきます。',
    strengths: '協調性、美的センス、公平性',
    challenges: '優柔不断、人に合わせすぎる'
  },
  '蠍座': {
    personality: '深く集中力があり、物事の本質を見抜く力があります。情熱的で、一度興味を持ったことにはとことん取り組みます。',
    behavior: '秘密主義的で、自分の感情を内に秘めがちです。変化や変革を通じて成長し、困難な状況でも粘り強く取り組みます。',
    strengths: '洞察力、集中力、変革力',
    challenges: '秘密主義、執着心'
  },
  '射手座': {
    personality: '自由奔放で冒険好き、新しい経験や知識を求めます。楽観的で、広い視野を持っています。',
    behavior: '束縛を嫌い、自分のペースで行動します。哲学的な思考を好み、真理や意味を探求することに興味があります。',
    strengths: '楽観性、自由性、探究心',
    challenges: '無責任さ、飽きやすさ'
  },
  '山羊座': {
    personality: '責任感が強く、目標達成に向けて着実に努力します。現実的で、長期的な視点で物事を考えます。',
    behavior: '規律正しく、計画的に行動します。社会的な地位や成功を重視し、コツコツと積み重ねることで結果を出します。',
    strengths: '責任感、忍耐力、計画性',
    challenges: '頑固さ、悲観的思考'
  },
  '水瓶座': {
    personality: '独創的で革新的、既存の枠にとらわれない発想をします。人道的で、社会全体の利益を考えます。',
    behavior: '個性を大切にし、独自の道を歩みます。友情を重視し、グループや組織の中で独特な存在感を発揮します。',
    strengths: '独創性、人道性、友情',
    challenges: '変わり者扱い、感情の希薄さ'
  },
  '魚座': {
    personality: '想像力豊かで直感的、人の気持ちに敏感です。芸術的な才能があり、精神的なものを大切にします。',
    behavior: '流れに身を任せ、状況に合わせて柔軟に対応します。人を助けることを好み、自己犠牲的な面もあります。',
    strengths: '想像力、共感力、直感',
    challenges: '現実逃避、境界の曖昧さ'
  }
};

// デフォルトの特徴（星座が不明な場合）
const DEFAULT_TRAITS: SunSignTraits = {
  personality: '星座の特徴を分析できませんが、それぞれに個性的な魅力があります。',
  behavior: '人それぞれ異なる行動パターンを持っています。',
  strengths: '個性',
  challenges: '不明'
};

// 太陽星座の基本特徴を取得する関数
export function getSunSignTraits(zodiacSign: ZodiacSign): SunSignTraits {
  return SUN_SIGN_TRAITS[zodiacSign] || DEFAULT_TRAITS;
}

// 占い用の簡潔な特徴文を生成する関数
export function getSunSignFortuneContext(zodiacSign: ZodiacSign): string {
  const traits = getSunSignTraits(zodiacSign);
  return `
【${zodiacSign}座の基本的な特徴】
性格: ${traits.personality}
行動パターン: ${traits.behavior}
得意なこと: ${traits.strengths}
注意点: ${traits.challenges}
  `.trim();
}

// Level1占い用の簡潔バージョン
export function getSunSignBriefTraits(zodiacSign: ZodiacSign): string {
  const traits = getSunSignTraits(zodiacSign);
  return `${zodiacSign}座のあなたは${traits.personality.substring(0, 50)}...という特徴があり、${traits.behavior.substring(0, 40)}...という行動パターンを持っています。`;
} 