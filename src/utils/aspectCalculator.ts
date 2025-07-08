import { PlanetPosition, ZodiacSign } from '../types';

// アスペクトの種類
export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx';

// アスペクトの定義
export interface AspectDefinition {
  name: string;
  nameJa: string;
  angle: number;
  orb: number;
  color: string;
  meaning: string;
  isHarmonious: boolean;
}

// アスペクト情報
export interface Aspect {
  planet1: string;
  planet2: string;
  type: AspectType;
  angle: number;
  orb: number;
  exactness: number; // 正確さ（0-100%）
  definition: AspectDefinition;
}

// アスペクトの定義データ
export const aspectDefinitions: Record<AspectType, AspectDefinition> = {
  conjunction: {
    name: 'Conjunction',
    nameJa: 'ベストフレンド',
    angle: 0,
    orb: 8,
    color: '#FF6B6B',
    meaning: '一心同体の関係',
    isHarmonious: true
  },
  opposition: {
    name: 'Opposition',
    nameJa: 'ライバル同士',
    angle: 180,
    orb: 8,
    color: '#FF8E53',
    meaning: '緊張と成長の関係',
    isHarmonious: false
  },
  trine: {
    name: 'Trine',
    nameJa: '最強コンビ',
    angle: 120,
    orb: 8,
    color: '#4ECDC4',
    meaning: '天然の才能',
    isHarmonious: true
  },
  square: {
    name: 'Square',
    nameJa: '成長のライバル',
    angle: 90,
    orb: 8,
    color: '#E74C3C',
    meaning: '努力で強くなる関係',
    isHarmonious: false
  },
  sextile: {
    name: 'Sextile',
    nameJa: '良い仲間',
    angle: 60,
    orb: 6,
    color: '#45B7D1',
    meaning: 'チャンスの関係',
    isHarmonious: true
  },
  quincunx: {
    name: 'Quincunx',
    nameJa: '不思議な関係',
    angle: 150,
    orb: 3,
    color: '#9B59B6',
    meaning: '個性を作る関係',
    isHarmonious: false
  }
};

// 星座から度数を計算
const getAbsoluteDegree = (sign: ZodiacSign, degree: number): number => {
  const zodiacSigns: ZodiacSign[] = [
    '牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座',
    '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座'
  ];
  
  const signIndex = zodiacSigns.indexOf(sign);
  return signIndex * 30 + degree;
};

// 二つの角度間の最短距離を計算
const getAngularDistance = (degree1: number, degree2: number): number => {
  let distance = Math.abs(degree1 - degree2);
  if (distance > 180) {
    distance = 360 - distance;
  }
  return distance;
};

// アスペクトを計算
export const calculateAspect = (planet1: PlanetPosition, planet2: PlanetPosition): Aspect | null => {
  if (planet1.planet === planet2.planet) return null;

  const degree1 = getAbsoluteDegree(planet1.sign as ZodiacSign, planet1.degree);
  const degree2 = getAbsoluteDegree(planet2.sign as ZodiacSign, planet2.degree);
  const distance = getAngularDistance(degree1, degree2);

  // 各アスペクトをチェック
  for (const [aspectType, definition] of Object.entries(aspectDefinitions)) {
    const targetAngle = definition.angle;
    const orb = definition.orb;
    
    const angleDiff = Math.abs(distance - targetAngle);
    
    if (angleDiff <= orb) {
      const exactness = Math.max(0, 100 - (angleDiff / orb) * 100);
      
      return {
        planet1: planet1.planet,
        planet2: planet2.planet,
        type: aspectType as AspectType,
        angle: distance,
        orb: angleDiff,
        exactness: exactness,
        definition: definition
      };
    }
  }

  return null;
};

// すべてのアスペクトを計算
export const calculateAllAspects = (planets: PlanetPosition[]): Aspect[] => {
  const aspects: Aspect[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const aspect = calculateAspect(planets[i], planets[j]);
      if (aspect) {
        aspects.push(aspect);
      }
    }
  }

  // 正確さでソート（正確なものから順に）
  return aspects.sort((a, b) => b.exactness - a.exactness);
};

// アスペクトの強度を計算（0-100）
export const getAspectStrength = (aspect: Aspect): number => {
  const baseStrength = aspect.exactness;
  
  // 重要な天体（太陽、月、アセンダント）は強度を上げる
  const importantPlanets = ['太陽', '月'];
  const hasImportantPlanet = importantPlanets.includes(aspect.planet1) || 
                           importantPlanets.includes(aspect.planet2);
  
  const strengthMultiplier = hasImportantPlanet ? 1.2 : 1.0;
  
  return Math.min(100, baseStrength * strengthMultiplier);
};

// アスペクトパターンの検出（AI動的生成対応）
export const detectAspectPatterns = async (aspects: Aspect[]): Promise<string[]> => {
  const patterns: string[] = [];
  
  // AI生成機能をインポート
  const { generateAspectPatternDescription } = await import('./aiAnalyzer');
  
  // グランドトライン（3つの天体が120度ずつ形成する正三角形）
  const trines = aspects.filter(a => a.type === 'trine' && a.exactness >= 60);
  if (trines.length >= 3) {
    // 実際に3つの天体が三角形を形成しているかチェック
    for (const trine1 of trines) {
      for (const trine2 of trines) {
        if (trine1 === trine2) continue;
        
        // 共通の天体を見つける
        const commonPlanet = trine1.planet1 === trine2.planet1 || trine1.planet1 === trine2.planet2 
          ? trine1.planet1 
          : trine1.planet2 === trine2.planet1 || trine1.planet2 === trine2.planet2 
          ? trine1.planet2 
          : null;
          
        if (commonPlanet) {
          // 残りの2つの天体も120度の関係にあるかチェック
          const otherPlanets = [
            trine1.planet1 === commonPlanet ? trine1.planet2 : trine1.planet1,
            trine2.planet1 === commonPlanet ? trine2.planet2 : trine2.planet1
          ];
          
          const thirdTrine = aspects.find(a => 
            a.type === 'trine' && 
            a.exactness >= 60 &&
            ((a.planet1 === otherPlanets[0] && a.planet2 === otherPlanets[1]) ||
             (a.planet1 === otherPlanets[1] && a.planet2 === otherPlanets[0]))
          );
          
          if (thirdTrine) {
            // AI動的生成でパターン説明を作成
            try {
              const description = await generateAspectPatternDescription(
                'グランドトライン',
                [commonPlanet, ...otherPlanets],
                'ラッキートライアングル'
              );
              patterns.push(description);
            } catch (error) {
              console.error('グランドトライン説明生成エラー:', error);
              patterns.push(`🌟 ラッキートライアングル（${commonPlanet}-${otherPlanets[0]}-${otherPlanets[1]}）- あなたには特別な才能の組み合わせがあります。`);
            }
            break;
          }
        }
      }
    }
  }
  
  // Tスクエア（1つの天体が2つの天体とスクエアを形成し、その2つがオポジション）
  const squares = aspects.filter(a => a.type === 'square' && a.exactness >= 60);
  const oppositions = aspects.filter(a => a.type === 'opposition' && a.exactness >= 60);
  
  if (squares.length >= 2 && oppositions.length >= 1) {
    for (const opposition of oppositions) {
      // オポジションの両端とスクエアを形成する天体を探す
      const squaresWithOpp1 = squares.filter(s => 
        s.planet1 === opposition.planet1 || s.planet2 === opposition.planet1
      );
      const squaresWithOpp2 = squares.filter(s => 
        s.planet1 === opposition.planet2 || s.planet2 === opposition.planet2
      );
      
      // 同じ天体が両方の端とスクエアを形成しているかチェック
      for (const sq1 of squaresWithOpp1) {
        for (const sq2 of squaresWithOpp2) {
          const apexPlanet = sq1.planet1 === opposition.planet1 ? sq1.planet2 : sq1.planet1;
          const apexPlanet2 = sq2.planet1 === opposition.planet2 ? sq2.planet2 : sq2.planet1;
          
          if (apexPlanet === apexPlanet2) {
            // AI動的生成でパターン説明を作成
            try {
              const description = await generateAspectPatternDescription(
                'Tスクエア',
                [apexPlanet, opposition.planet1, opposition.planet2],
                '成長エンジン'
              );
              patterns.push(description);
            } catch (error) {
              console.error('Tスクエア説明生成エラー:', error);
              patterns.push(`💪 成長エンジン（${apexPlanet}がキーポイント）- あなたには困難を乗り越える特別な力があります。`);
            }
            break;
          }
        }
      }
    }
  }
  
  // ヨード（2つの天体が60度、そして150度で3つ目と関係）
  const sextiles = aspects.filter(a => a.type === 'sextile' && a.exactness >= 60);
  const quincunxes = aspects.filter(a => a.type === 'quincunx' && a.exactness >= 60);
  
  if (sextiles.length >= 1 && quincunxes.length >= 2) {
    for (const sextile of sextiles) {
      const quincunx1 = quincunxes.find(q => 
        q.planet1 === sextile.planet1 || q.planet2 === sextile.planet1
      );
      const quincunx2 = quincunxes.find(q => 
        q.planet1 === sextile.planet2 || q.planet2 === sextile.planet2
      );
      
      if (quincunx1 && quincunx2) {
        const apexPlanet = quincunx1.planet1 === sextile.planet1 ? quincunx1.planet2 : quincunx1.planet1;
        const apexPlanet2 = quincunx2.planet1 === sextile.planet2 ? quincunx2.planet2 : quincunx2.planet1;
        
        if (apexPlanet === apexPlanet2) {
          // AI動的生成でパターン説明を作成
          try {
            const description = await generateAspectPatternDescription(
              'ヨード',
              [apexPlanet, sextile.planet1, sextile.planet2],
              '運命の指'
            );
            patterns.push(description);
          } catch (error) {
            console.error('ヨード説明生成エラー:', error);
            patterns.push(`🔮 運命の指（${apexPlanet}がキーポイント）- あなたには特別な使命や才能があります。`);
          }
        }
      }
    }
  }
  
  // 多くの調和的アスペクト
  const harmoniousAspects = aspects.filter(a => a.definition.isHarmonious && a.exactness >= 50);
  if (harmoniousAspects.length >= 5) {
    try {
      const description = await generateAspectPatternDescription(
        '調和的パターン',
        harmoniousAspects.slice(0, 3).map(a => a.planet1), // 代表的な天体
        'ハッピーパーソン'
      );
      patterns.push(description);
    } catch (error) {
      console.error('調和的パターン説明生成エラー:', error);
      patterns.push('😊 ハッピーパーソン - あなたには自然に幸せを感じる特別な力があります。');
    }
  }
  
  // 多くの挑戦的アスペクト
  const challengingAspects = aspects.filter(a => !a.definition.isHarmonious && a.exactness >= 50);
  if (challengingAspects.length >= 5) {
    try {
      const description = await generateAspectPatternDescription(
        '挑戦的パターン',
        challengingAspects.slice(0, 3).map(a => a.planet1), // 代表的な天体
        'ファイター'
      );
      patterns.push(description);
    } catch (error) {
      console.error('挑戦的パターン説明生成エラー:', error);
      patterns.push('🔥 ファイター - あなたには困難を力に変える特別なエネルギーがあります。');
    }
  }
  
  return patterns;
};

// 個別の天体組み合わせに基づいたアスペクト説明をAIで動的に生成
export const getSpecificAspectDescription = async (planet1: string, planet2: string, aspectType: AspectType): Promise<string> => {
  // AI生成機能を使用（aiAnalyzer.tsから）
  const { generateSpecificAspectDescription } = await import('./aiAnalyzer');
  
  // アスペクトの基本的な意味を取得
  const aspectMeaning = aspectDefinitions[aspectType]?.meaning || 'アスペクトの関係';
  
  try {
    // AIで個別の説明を生成
    const aiDescription = await generateSpecificAspectDescription(
      planet1, 
      planet2, 
      aspectDefinitions[aspectType]?.nameJa || aspectType,
      aspectMeaning
    );
    
    return aiDescription;
  } catch (error) {
    console.error('AI説明生成エラー:', error);
    
    // フォールバック：基本的なメッセージを返す（ハードコード削除によりAI生成のみに依存）
    const aspectName = aspectDefinitions[aspectType]?.nameJa || aspectType;
    return `${planet1}と${planet2}の${aspectName}により、特別な影響を受けています。この組み合わせがあなたの個性を形作る重要な要素となっています。`;
  }
};

// 同期版のフォールバック関数（AI生成失敗時のシンプルなフォールバック）
export const getSpecificAspectDescriptionSync = (planet1: string, planet2: string, aspectType: AspectType): string => {
  // AIが失敗した場合のシンプルなフォールバック
  const aspectName = aspectDefinitions[aspectType]?.nameJa || aspectType;
  const aspectMeaning = aspectDefinitions[aspectType]?.meaning || 'アスペクトの関係';
  
  return `${planet1}と${planet2}の${aspectName}により、${aspectMeaning}の影響を受けています。この組み合わせがあなたの個性を形作る重要な要素となっています。`;
}; 