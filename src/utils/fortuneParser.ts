import { debugLog } from './aiAnalyzerUtils';

export interface FortuneSections {
  overall: string;
  love: string;
  work: string;
  health: string;
  money: string;
  advice: string;
  overallStars: number;
  loveStars: number;
  workStars: number;
  healthStars: number;
  moneyStars: number;
  importantDays: string;
  growth?: string;
  growthStars?: number;
}

// 星評価を抽出するヘルパー関数
export const extractStarRating = (text: string): number => {
  const starMatches = text.match(/★+/g);
  if (starMatches && starMatches.length > 0) {
    const starCount = starMatches[0].length;
    return Math.min(Math.max(starCount, 1), 5);
  }
  const numberMatch = text.match(/(?:評価|★)(\d)/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    return Math.min(Math.max(num, 1), 5);
  }
  return 3;
};

// 重要な日の期間バリデーション
export const validateImportantDaysDateRange = (importantDaysText: string, period: string): string => {
  if (!importantDaysText || period === 'today' || period === 'tomorrow') {
    return importantDaysText;
  }
  
  const today = new Date();
  let startDate = new Date(today);
  let endDate = new Date(today);
  
  switch (period) {
    case 'thisWeek':
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setDate(today.getDate() + (6 - today.getDay()));
      break;
    case 'nextWeek':
      startDate = new Date(today);
      startDate.setDate(today.getDate() + (7 - today.getDay()));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'nextMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      break;
    default:
      return importantDaysText;
  }
  
  const lines = importantDaysText.split('\n');
  const validatedLines: string[] = [];
  
  for (const line of lines) {
    const dateMatch = line.match(/(\d{1,2})月(\d{1,2})日/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      const targetDate = new Date(today.getFullYear(), month - 1, day);
      if (targetDate >= startDate && targetDate <= endDate) {
        validatedLines.push(line);
      }
    } else {
      validatedLines.push(line);
    }
  }
  
  return validatedLines.join('\n');
};

export const parseAIFortune = (fortuneText: string | null, period: string): FortuneSections => {
  if (!fortuneText) {
    return { 
      overall: '', love: '', work: '', health: '', money: '', advice: '',
      overallStars: 3, loveStars: 3, workStars: 3, healthStars: 3, moneyStars: 3,
      importantDays: ''
    };
  }
  
  const sections: FortuneSections = {
    overall: '', love: '', work: '', health: '', money: '', advice: '',
    overallStars: 3, loveStars: 3, workStars: 3, healthStars: 3, moneyStars: 3,
    importantDays: '',
    growth: '',
    growthStars: 3
  };
  
  const sectionMatches = fortuneText.match(/【[^】]*】[^【]*/g) || [];
  const markdownSections = fortuneText.match(/###[^#]*?(?=###|$)/g) || [];
  
  const processSection = (section: string) => {
    const cleaned = section.replace(/【[^】]*】|###[^#]*?運/, '').trim()
      .replace(/🍀.*?(?=⚠️|$)/gs, '').trim()
      .replace(/⚠️.*$/gs, '').trim()
      .replace(/(?:運勢評価|評価|スコア)\s*:[★☆\d\s\/]+/g, '').trim()
      .replace(/【?\s*(?:魂の肖像|Soul Portrait|魂の基調講演|光と影のダイナミクス|星々からの具体的な助言)\s*】?\s*/g, '')
      .replace(/【?\s*(?:あなたの本当の性格と、人生のテーマ|授かった才能と、気をつけるべき点|今、あなたへ伝えたいアドバイス)\s*】?\s*/g, '')
      .replace(/★+[☆★]*.*$/g, '').trim();

    if (section.includes('全体運') || section.includes('全体的') || section.includes('総合運')) {
      sections.overall = cleaned;
      sections.overallStars = extractStarRating(section);
    } else if (section.includes('恋愛運') || section.includes('恋愛')) {
      sections.love = cleaned;
      sections.loveStars = extractStarRating(section);
    } else if (section.includes('仕事運') || section.includes('仕事')) {
      sections.work = cleaned;
      sections.workStars = extractStarRating(section);
    } else if (section.includes('健康運') || section.includes('健康')) {
      sections.health = cleaned;
      sections.healthStars = extractStarRating(section);
    } else if (section.includes('金銭運') || section.includes('金運') || section.includes('財運')) {
      sections.money = cleaned;
      sections.moneyStars = extractStarRating(section);
      const importantDaysMatch = section.match(/(🍀.*?(?=⚠️|$))|(⚠️.*$)/gs);
      if (importantDaysMatch && !sections.importantDays) {
        sections.importantDays = importantDaysMatch.join('\n').trim();
      }
    } else if (section.includes('成長運') || section.includes('成長')) {
      sections.growth = cleaned;
      sections.growthStars = extractStarRating(section);
    } else if (section.includes('アドバイス')) {
      sections.advice = cleaned;
    } else if (section.includes('重要な日') || section.includes('重要日') || section.includes('ラッキーデー') || section.includes('注意日')) {
      sections.importantDays = cleaned;
    }
  };

  sectionMatches.forEach(processSection);
  markdownSections.forEach(processSection);
  
  if (sectionMatches.length === 0 && markdownSections.length === 0) {
    sections.overall = fortuneText.trim();
  }
  
  if (!sections.importantDays) {
    const directImportantDaysMatch = fortuneText.match(/(🍀.*?(?=⚠️|【|$))|(⚠️.*?(?=【|$))/gs);
    if (directImportantDaysMatch) {
      sections.importantDays = directImportantDaysMatch.map(match => match.trim()).join('\n');
    }
  }
  
  if (sections.importantDays) {
    sections.importantDays = validateImportantDaysDateRange(sections.importantDays, period);
  }
  
  return sections;
};
