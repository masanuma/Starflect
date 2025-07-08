// 天体の基本情報
export interface PlanetMeaning {
  name: string;
  symbol: string;
  domain: string;
  description: string;
  keywords: string[];
}

// 天体と星座の組み合わせ分析
export interface PlanetSignAnalysis {
  description: string;
  traits: string[];
  strengths: string[];
  challenges: string[];
  advice: string;
}

// 運勢カテゴリ
export interface FortuneCategory {
  category: string;
  icon: string;
  description: string;
  score: number;
  advice: string;
}

// 天体の基本情報
export const planetMeanings: Record<string, PlanetMeaning> = {
  '太陽': {
    name: '太陽',
    symbol: '☀️',
    domain: '自我・生命力',
    description: 'あなたの核となる性格と人生の目的',
    keywords: ['自我', '生命力', '創造性', 'リーダーシップ']
  },
  '月': {
    name: '月',
    symbol: '🌙',
    domain: '感情・本能',
    description: '内面の感情と無意識の反応パターン',
    keywords: ['感情', '本能', '母性', '直感']
  }
};

// 天体の基本情報を取得する関数
export const getPlanetMeaning = (planet: string): PlanetMeaning | null => {
  return planetMeanings[planet] || null;
}; 