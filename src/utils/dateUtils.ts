// 現在の日付と季節を取得するユーティリティ

export interface CurrentTimeInfo {
  currentDate: string;
  currentSeason: string;
  monthDay: string;
  seasonDescription: string;
}

// 季節を判定する関数
export const getCurrentSeason = (date: Date = new Date()): string => {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // 日本の季節区分
  if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day < 21)) {
    return '春';
  } else if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day < 23)) {
    return '夏';
  } else if ((month === 9 && day >= 23) || month === 10 || month === 11 || (month === 12 && day < 22)) {
    return '秋';
  } else {
    return '冬';
  }
};

// 季節の詳細説明を取得
export const getSeasonDescription = (season: string): string => {
  switch (season) {
    case '春':
      return '新緑の季節、新しい始まりの時期';
    case '夏':
      return '活発なエネルギーの季節、成長と発展の時期';
    case '秋':
      return '実りと収穫の季節、深まる思考の時期';
    case '冬':
      return '内省と準備の季節、静寂と集中の時期';
    default:
      return '移ろう季節の時期';
  }
};

// 現在の時期情報を完全に取得
export const getCurrentTimeInfo = (): CurrentTimeInfo => {
  const now = new Date();
  const season = getCurrentSeason(now);
  
  return {
    currentDate: now.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }),
    currentSeason: season,
    monthDay: `${now.getMonth() + 1}月${now.getDate()}日`,
    seasonDescription: getSeasonDescription(season)
  };
};

// AI占いプロンプト用の時期情報文字列を生成
export const getTimeContextForAI = (): string => {
  const timeInfo = getCurrentTimeInfo();
  return `現在の日時: ${timeInfo.currentDate}
現在の季節: ${timeInfo.currentSeason}（${timeInfo.seasonDescription}）

**重要**: 占い結果は必ず現在の時期（${timeInfo.currentSeason}・${timeInfo.monthDay}）を考慮した内容にしてください。季節感を大切にし、この時期にふさわしい運勢やアドバイスを提供してください。`;
}; 