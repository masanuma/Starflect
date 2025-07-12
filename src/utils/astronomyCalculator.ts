import { BirthData, PlanetPosition, ZodiacSign, HoroscopeData } from '../types';

// 黄経から星座を取得
export function longitudeToZodiacSign(longitude: number): ZodiacSign {
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    console.warn('longitudeToZodiacSign: 無効な黄経値', longitude);
    return '不明' as ZodiacSign;
  }
  // 0～360度に正規化
  longitude = ((longitude % 360) + 360) % 360;
  const signs: ZodiacSign[] = [
    '牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座',
    '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座'
  ];
  const signIndex = Math.floor(longitude / 30);
  return signs[signIndex % 12];
}

// 黄経から星座内の度数を取得
export function longitudeToDegreeInSign(longitude: number): number {
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    console.warn('longitudeToDegreeInSign: 無効な黄経値', longitude);
    return 0;
  }
  // 0～30度に正規化
  return ((longitude % 30) + 30) % 30;
}

// ユリウス日を計算
function julianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  
  let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) +
           Math.floor(275 * month / 9) + day + 1721013.5 + hour / 24;
  
  return jd;
}

// 世紀数（J2000からの経過年数）
function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

// 太陽の平均黄経
function meanLongitudeSun(t: number): number {
  return 280.46645 + 36000.76983 * t + 0.0003032 * t * t;
}

// 太陽の平均近点角
function meanAnomalySun(t: number): number {
  return 357.52910 + 35999.05030 * t - 0.0001559 * t * t - 0.00000048 * t * t * t;
}

// 歳差を考慮した黄経の補正
function applyPrecession(longitude: number, date: Date): number {
  const jd = julianDay(date);
  const t = julianCentury(jd);
  
  // 歳差による黄経の変化（度/世紀）
  const precessionRate = 50.287 / 3600; // 度/年
  const precessionCorrection = precessionRate * t * 100; // 100年あたり
  
  return longitude + precessionCorrection;
}

// より正確なケプラー方程式の解法（ニュートン・ラフソン法）
function solveKeplerEquation(M: number, e: number): number {
  // 度をラジアンに変換
  const MRad = M * Math.PI / 180;
  let E = MRad; // 初期値
  
  // ニュートン・ラフソン法による反復計算
  for (let i = 0; i < 10; i++) {
    const dE = (E - e * Math.sin(E) - MRad) / (1 - e * Math.cos(E));
    E = E - dE;
    
    // 収束判定
    if (Math.abs(dE) < 1e-10) break;
  }
  
  // ラジアンを度に変換
  return E * 180 / Math.PI;
}

// 改良された惑星の黄経計算
function planetLongitude(planet: string, date: Date): number {
  const jd = julianDay(date);
  const t = julianCentury(jd);
  
  // 各惑星の軌道要素（J2000.0 epoch）
  const planetData: { [key: string]: { 
    L0: number; dL: number; 
    M0: number; dM: number; 
    e: number; de: number;
    a: number; da: number;
    perturbations?: Array<{ amplitude: number; period: number; phase: number }>;
  } } = {
    '水星': { 
      L0: 252.250906, dL: 149474.0722491,
      M0: 168.656222, dM: 149472.515866,
      e: 0.20563175, de: 0.000020406,
      a: 0.387098, da: -0.0000007,
      perturbations: [
        { amplitude: 0.00204, period: 5.0, phase: 0.0 },
        { amplitude: 0.00146, period: 2.0, phase: 0.0 }
      ]
    },
    '金星': { 
      L0: 181.979801, dL: 58517.8156760,
      M0: 48.005786, dM: 58517.803386,
      e: 0.00677188, de: -0.000047766,
      a: 0.723330, da: 0.0000002,
      perturbations: [
        { amplitude: 0.00077, period: 0.615, phase: 0.0 }
      ]
    },
    '火星': { 
      L0: 355.433275, dL: 19141.6964746,
      M0: 18.602161, dM: 19141.6964471,
      e: 0.09340530, de: 0.000090033,
      a: 1.523688, da: -0.0000001,
      perturbations: [
        { amplitude: 0.00705, period: 2.135, phase: 0.0 },
        { amplitude: 0.00607, period: 0.881, phase: 0.0 }
      ]
    },
    '木星': { 
      L0: 34.351519, dL: 3036.3027748,
      M0: 19.895302, dM: 3036.3027889,
      e: 0.04849820, de: 0.000163225,
      a: 5.202561, da: -0.0000002,
      perturbations: [
        { amplitude: 0.00557, period: 0.399, phase: 0.0 },
        { amplitude: 0.00166, period: 0.175, phase: 0.0 }
      ]
    },
    '土星': { 
      L0: 50.077471, dL: 1223.5110141,
      M0: 316.967065, dM: 1223.5110185,
      e: 0.05450880, de: -0.000346818,
      a: 9.554747, da: -0.0000021,
      perturbations: [
        { amplitude: 0.00793, period: 0.197, phase: 0.0 },
        { amplitude: 0.00499, period: 0.425, phase: 0.0 }
      ]
    },
    '天王星': { 
      L0: 314.055005, dL: 428.4669983,
      M0: 142.5905, dM: 428.4669983,
      e: 0.047318, de: -0.000001450,
      a: 19.218140, da: -0.0000000372,
      perturbations: [
        { amplitude: 0.00341, period: 0.111, phase: 0.0 }
      ]
    },
    '海王星': { 
      L0: 304.348665, dL: 218.4862002,
      M0: 260.2471, dM: 218.4862002,
      e: 0.008606, de: 0.000000215,
      a: 30.110387, da: -0.0000001663,
      perturbations: [
        { amplitude: 0.00077, period: 0.054, phase: 0.0 }
      ]
    },
    '冥王星': { 
      L0: 238.92903833, dL: 145.20780515,
      M0: 14.882, dM: 145.20780515,
      e: 0.24880766, de: 0.00000006,
      a: 39.482116, da: -0.0000000004,
      perturbations: [
        { amplitude: 0.00276, period: 0.006, phase: 0.0 }
      ]
    }
  };
  
  const data = planetData[planet];
  if (!data) return 0;
  
  // 時間による軌道要素の変化を考慮
  const L = data.L0 + data.dL * t;
  const M = data.M0 + data.dM * t;
  const e = data.e + data.de * t;
  
  // 正確なケプラー方程式の解
  const E = solveKeplerEquation(M % 360, e);
  
  // 真近点角の計算
  const f = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E * Math.PI / 360)) * 180 / Math.PI;
  
  // 黄経の基本値
  let longitude = L + f;
  
  // 摂動項の適用
  if (data.perturbations) {
    for (const perturbation of data.perturbations) {
      const angle = (t * perturbation.period + perturbation.phase) * Math.PI / 180;
      longitude += perturbation.amplitude * Math.sin(angle);
    }
  }
  
  // 歳差の考慮
  longitude = applyPrecession(longitude, date);
  
  // 0-360度に正規化
  longitude = ((longitude % 360) + 360) % 360;
  return longitude;
}

// 改良された月の黄経計算
function moonLongitude(date: Date): number {
  const jd = julianDay(date);
  const t = julianCentury(jd);
  
  // 月の主要な軌道要素
  const Lm = 218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t * t * t / 538841 - t * t * t * t / 65194000;
  const Mm = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - t * t * t * t / 14712000;
  const Ms = meanAnomalySun(t);
  const D = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t * t * t / 545868 - t * t * t * t / 113065000;
  const F = 93.2720950 + 483202.0175233 * t - 0.0036539 * t * t - t * t * t / 3526000 + t * t * t * t / 863310000;
  
  // 主要な摂動項（ELP2000の主要項）
  const terms = [
    { coeff: 6.2886, arg: [0, 0, 1, 0] },        // Mm
    { coeff: 1.2740, arg: [0, 0, 0, 2] },        // 2D
    { coeff: 0.6583, arg: [0, 1, 0, 0] },        // Ms
    { coeff: 0.2136, arg: [0, 0, 2, 0] },        // 2Mm
    { coeff: -0.1851, arg: [0, 1, 1, 0] },       // Ms + Mm
    { coeff: -0.1143, arg: [0, 1, 0, 2] },       // Ms + 2D
    { coeff: 0.0588, arg: [0, 0, 1, 2] },        // Mm + 2D
    { coeff: 0.0572, arg: [0, 0, 1, -2] },       // Mm - 2D
    { coeff: 0.0533, arg: [0, 1, 2, 0] },        // Ms + 2Mm
    { coeff: -0.0459, arg: [0, 2, 1, 0] },       // 2Ms + Mm
    { coeff: -0.0410, arg: [0, 2, 0, 0] },       // 2Ms
    { coeff: -0.0348, arg: [0, 1, 0, -2] },      // Ms - 2D
    { coeff: -0.0204, arg: [0, 0, 3, 0] },       // 3Mm
    { coeff: 0.0180, arg: [0, 0, 1, -4] },       // Mm - 4D
    { coeff: 0.0161, arg: [0, 2, 1, -2] },       // 2Ms + Mm - 2D
    { coeff: -0.0147, arg: [0, 0, 0, 4] },       // 4D
    { coeff: -0.0097, arg: [0, 1, 1, -2] },      // Ms + Mm - 2D
    { coeff: -0.0073, arg: [0, 2, 0, 2] },       // 2Ms + 2D
    { coeff: 0.0067, arg: [0, 1, 2, -2] },       // Ms + 2Mm - 2D
    { coeff: 0.0063, arg: [0, 0, 2, 2] }         // 2Mm + 2D
  ];
  
  // 摂動項の計算
  let perturbation = 0;
  for (const term of terms) {
    const argument = term.arg[0] * Ms + term.arg[1] * Mm + term.arg[2] * D + term.arg[3] * F;
    perturbation += term.coeff * Math.sin(argument * Math.PI / 180);
  }
  
  // 最終的な月の黄経
  let longitude = Lm + perturbation;
  
  // 歳差の考慮
  longitude = applyPrecession(longitude, date);
  
  // 0-360度に正規化
  longitude = ((longitude % 360) + 360) % 360;
  return longitude;
}

// 改良された太陽の黄経計算
function sunLongitude(date: Date): number {
  const jd = julianDay(date);
  const t = julianCentury(jd);
  const L0 = meanLongitudeSun(t);
  const M = meanAnomalySun(t);
  
  // 太陽の中心差（より多くの項を含む）
  const C = (1.914600 - 0.004817 * t - 0.000014 * t * t) * Math.sin(M * Math.PI / 180) +
            (0.019993 - 0.000101 * t) * Math.sin(2 * M * Math.PI / 180) +
            0.000290 * Math.sin(3 * M * Math.PI / 180) +
            0.000015 * Math.sin(4 * M * Math.PI / 180) +
            0.000002 * Math.sin(5 * M * Math.PI / 180);
  
  // 光行差の補正
  const aberration = -0.00569;
  
  // 章動の補正（簡易版）
  const nutation = -0.00479 * Math.sin((125.04 - 1934.136 * t) * Math.PI / 180);
  
  let longitude = L0 + C + aberration + nutation;
  
  // 歳差の考慮
  longitude = applyPrecession(longitude, date);
  
  // 0-360度に正規化
  longitude = ((longitude % 360) + 360) % 360;
  return longitude;
}

// 天体の黄経を計算
function calculatePlanetLongitude(planetName: string, date: Date): number {
  try {
    let result = 0;
    switch (planetName) {
      case '太陽':
        result = sunLongitude(date);
        break;
      case '月':
        result = moonLongitude(date);
        break;
      case '水星':
      case '金星':
      case '火星':
      case '木星':
      case '土星':
      case '天王星':
      case '海王星':
      case '冥王星':
        result = planetLongitude(planetName, date);
        break;
      default:
        result = 0;
    }
    if (typeof result !== 'number' || isNaN(result)) {
      console.warn('calculatePlanetLongitude: 計算結果が無効', planetName, result);
      return 0;
    }
    return result;
  } catch (error) {
    console.error(`天体計算エラー (${planetName}):`, error);
    return 0;
  }
}

// 天体の逆行判定（簡易版）
function isPlanetRetrograde(planetName: string, date: Date): boolean {
  try {
    // 現在時刻と1日後の時刻で位置を比較
    const date1 = new Date(date);
    const date2 = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    
    const pos1 = calculatePlanetLongitude(planetName, date1);
    const pos2 = calculatePlanetLongitude(planetName, date2);
    
    // 1日で15度以上移動した場合は逆行の可能性
    let diff = pos2 - pos1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    return Math.abs(diff) > 15;
  } catch (error) {
    console.error(`逆行判定エラー (${planetName}):`, error);
    return false;
  }
}

// 地方恒星時を計算
function calculateLocalSiderealTime(date: Date, longitude: number): number {
  const jd = julianDay(date);
  const t = julianCentury(jd);
  
  // グリニッジ恒星時（度）
  const gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
              0.000387933 * t * t - t * t * t / 38710000.0;
  
  // 地方恒星時
  const lst = gst + longitude;
  
  // 0-360度に正規化
  return ((lst % 360) + 360) % 360;
}

// 黄道傾斜角を計算
function calculateObliquityOfEcliptic(date: Date): number {
  const jd = julianDay(date);
  const t = julianCentury(jd);
  
  // 黄道傾斜角（度）
  const obliquity = 23.4392794 - 0.0130125 * t - 0.00000164 * t * t + 0.000000503 * t * t * t;
  
  return obliquity;
}

// 正確な上昇星座計算
function calculateAscendant(birthData: BirthData): number {
  const date = birthData.birthDate instanceof Date ? birthData.birthDate : new Date(birthData.birthDate);
  const latitude = birthData.birthPlace?.latitude || 35.6762; // デフォルト：東京
  const longitude = birthData.birthPlace?.longitude || 139.6503; // デフォルト：東京
  
  // 地方恒星時を計算
  const lst = calculateLocalSiderealTime(date, longitude);
  
  // 黄道傾斜角を計算
  const obliquity = calculateObliquityOfEcliptic(date);
  
  // 上昇星座の計算
  const latRad = latitude * Math.PI / 180;
  const lstRad = lst * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  
  // 上昇星座の黄経を計算
  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
  
  let ascendant = Math.atan2(y, x) * 180 / Math.PI;
  
  // 0-360度に正規化
  ascendant = ((ascendant % 360) + 360) % 360;
  
  return ascendant;
}

// MC（中天）を計算
function calculateMidheaven(birthData: BirthData): number {
  const date = birthData.birthDate instanceof Date ? birthData.birthDate : new Date(birthData.birthDate);
  const longitude = birthData.birthPlace?.longitude || 139.6503; // デフォルト：東京
  
  // 地方恒星時を計算
  const lst = calculateLocalSiderealTime(date, longitude);
  
  // 黄道傾斜角を計算
  const obliquity = calculateObliquityOfEcliptic(date);
  
  // MC（中天）の黄経を計算
  const lstRad = lst * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  
  const y = Math.sin(lstRad);
  const x = Math.cos(lstRad) * Math.cos(oblRad);
  
  let mc = Math.atan2(y, x) * 180 / Math.PI;
  
  // 0-360度に正規化
  mc = ((mc % 360) + 360) % 360;
  
  return mc;
}

// 正確な天体計算（上昇星座・MCを含む）
export async function calculateAllPlanets(birthData: BirthData): Promise<PlanetPosition[]> {
  const date = birthData.birthDate instanceof Date ? birthData.birthDate : new Date(birthData.birthDate);
  
  const planetNames = ['太陽', '月', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];
  const planetPositions: PlanetPosition[] = [];

  // 通常の天体計算
  for (const planetName of planetNames) {
    try {
      const longitude = calculatePlanetLongitude(planetName, date);
      const sign = longitudeToZodiacSign(longitude);
      const degree = longitudeToDegreeInSign(longitude);
      const retrograde = isPlanetRetrograde(planetName, date);
      
      planetPositions.push({
        planet: planetName,
        sign,
        house: 1, // ハウス計算は後で実装
        degree: Math.round(degree * 10) / 10,
        retrograde
      });
      
    } catch (error) {
      console.error(`${planetName}の計算エラー:`, error);
      // エラー時はデフォルト値を設定
      planetPositions.push({
        planet: planetName,
        sign: '不明' as ZodiacSign,
        house: 1,
        degree: 0,
        retrograde: false
      });
    }
  }

  // 上昇星座を追加
  try {
    const ascendantLongitude = calculateAscendant(birthData);
    const ascendantSign = longitudeToZodiacSign(ascendantLongitude);
    const ascendantDegree = longitudeToDegreeInSign(ascendantLongitude);
    
    planetPositions.push({
      planet: '上昇星座',
      sign: ascendantSign,
      house: 1,
      degree: Math.round(ascendantDegree * 10) / 10,
      retrograde: false
    });
  } catch (error) {
    console.error('上昇星座計算エラー:', error);
    planetPositions.push({
      planet: '上昇星座',
      sign: '不明' as ZodiacSign,
      house: 1,
      degree: 0,
      retrograde: false
    });
  }

  // MC（中天）を追加
  try {
    const mcLongitude = calculateMidheaven(birthData);
    const mcSign = longitudeToZodiacSign(mcLongitude);
    const mcDegree = longitudeToDegreeInSign(mcLongitude);
    
    planetPositions.push({
      planet: 'MC',
      sign: mcSign,
      house: 10,
      degree: Math.round(mcDegree * 10) / 10,
      retrograde: false
    });
  } catch (error) {
    console.error('MC計算エラー:', error);
    planetPositions.push({
      planet: 'MC',
      sign: '不明' as ZodiacSign,
      house: 10,
      degree: 0,
      retrograde: false
    });
  }
  
  return planetPositions;
}

// ハウス計算（等分ハウスシステム）
function calculateHouses(birthData: BirthData): Array<{ house: number; sign: ZodiacSign; degree: number }> {
  const date = birthData.birthDate instanceof Date ? birthData.birthDate : new Date(birthData.birthDate);
  
  // 正確な上昇星座計算
  const ascendantLongitude = calculateAscendant(birthData);
  
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const houseLongitude = (ascendantLongitude + i * 30) % 360;
    const sign = longitudeToZodiacSign(houseLongitude);
    const degree = longitudeToDegreeInSign(houseLongitude);
    
    houses.push({
      house: i + 1,
      sign,
      degree: Math.round(degree * 10) / 10
    });
  }
  
  return houses;
}

// 完全なホロスコープ生成
export async function generateCompleteHoroscope(birthData: BirthData): Promise<HoroscopeData> {
  const planets = await calculateAllPlanets(birthData);
  const houses = calculateHouses(birthData);
  
  return {
    planets,
    aspects: [], // アスペクト計算は後で実装
    houses
  };
}

// ブラウザコンソール用デバッグ関数
export async function debugAstronomyCalculation() {
  const testData: BirthData = {
    birthDate: new Date('1990-01-01T12:00:00'),
    birthTime: '12:00',
    birthPlace: {
      city: '東京',
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo'
    }
  };
  
  try {
    const planets = await calculateAllPlanets(testData);
    const horoscope = await generateCompleteHoroscope(testData);
    return { planets, horoscope };
  } catch (error) {
    console.error('天体計算エラー:', error);
    throw error;
  }
}

// グローバルオブジェクトに追加（ブラウザコンソールから呼び出し可能）
if (typeof window !== 'undefined') {
  (window as any).debugAstronomy = debugAstronomyCalculation;
}

// トランジット計算用の型定義
export interface TransitData {
  date: Date;
  planets: PlanetPosition[];
  aspects: any[]; // 出生チャートとのアスペクト
}

// 未来の日付での天体位置を計算
export const calculateTransitPositions = async (
  birthData: BirthData,
  targetDate: Date
): Promise<PlanetPosition[]> => {
  try {
    // 各天体の位置を計算
    const transitPlanets: PlanetPosition[] = [];
    
    const planetNames = ['太陽', '月', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];
    
    for (const planetName of planetNames) {
      try {
        const longitude = calculatePlanetLongitude(planetName, targetDate);
        const sign = longitudeToZodiacSign(longitude);
        const degree = longitudeToDegreeInSign(longitude);
        const retrograde = isPlanetRetrograde(planetName, targetDate);
        
        // ハウス計算（簡易版 - 等分ハウスシステム）
        const birthLongitude = calculatePlanetLongitude('太陽', birthData.birthDate);
        const houseNumber = Math.floor((longitude - birthLongitude + 360) % 360 / 30) + 1;
        
        transitPlanets.push({
          planet: planetName,
          sign: sign,
          house: houseNumber,
          degree: degree,
          retrograde: retrograde
        });
      } catch (error) {
        console.error(`トランジット計算エラー (${planetName}):`, error);
      }
    }
    
    return transitPlanets;
  } catch (error) {
    console.error('トランジット計算エラー:', error);
    throw new Error('トランジット計算に失敗しました');
  }
};

// トランジットアスペクトを計算（出生チャートとの関係）
export const calculateTransitAspects = (
  natalPlanets: PlanetPosition[],
  transitPlanets: PlanetPosition[]
): any[] => {
  const aspects: any[] = [];
  
  // 出生チャートの各天体とトランジット天体のアスペクトを計算
  for (const natalPlanet of natalPlanets) {
    for (const transitPlanet of transitPlanets) {
      // 同じ天体同士のアスペクト（太陽-太陽、月-月など）を計算
      if (natalPlanet.planet === transitPlanet.planet) {
        // 簡易的なアスペクト計算
        const natalLongitude = getAbsoluteDegree(natalPlanet.sign as ZodiacSign, natalPlanet.degree);
        const transitLongitude = getAbsoluteDegree(transitPlanet.sign as ZodiacSign, transitPlanet.degree);
        const distance = getAngularDistance(natalLongitude, transitLongitude);
        
        // 主要アスペクトの判定
        const aspectTypes = [
          { type: 'conjunction', angle: 0, orb: 8 },
          { type: 'opposition', angle: 180, orb: 8 },
          { type: 'trine', angle: 120, orb: 8 },
          { type: 'square', angle: 90, orb: 8 },
          { type: 'sextile', angle: 60, orb: 6 }
        ];
        
        for (const aspectType of aspectTypes) {
          const angleDiff = Math.abs(distance - aspectType.angle);
          if (angleDiff <= aspectType.orb) {
            const exactness = Math.max(0, 100 - (angleDiff / aspectType.orb) * 100);
            aspects.push({
              planet1: natalPlanet.planet,
              planet2: transitPlanet.planet,
              aspectType: aspectType.type,
              angle: distance,
              orb: angleDiff,
              exactness: exactness,
              transitType: 'transit',
              natalPlanet: natalPlanet.planet,
              transitPlanet: transitPlanet.planet
            });
            break;
          }
        }
      }
    }
  }
  
  return aspects;
};

// ヘルパー関数
function getAbsoluteDegree(sign: ZodiacSign, degree: number): number {
  const zodiacSigns: ZodiacSign[] = [
    '牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座',
    '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座'
  ];
  
  const signIndex = zodiacSigns.indexOf(sign);
  return signIndex * 30 + degree;
}

function getAngularDistance(degree1: number, degree2: number): number {
  let distance = Math.abs(degree1 - degree2);
  if (distance > 180) {
    distance = 360 - distance;
  }
  return distance;
}

// 期間内のトランジットを計算
export const calculateTransitPeriod = async (
  birthData: BirthData,
  startDate: Date,
  endDate: Date,
  intervalDays: number = 1
): Promise<TransitData[]> => {
  const transitData: TransitData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    try {
      const transitPlanets = await calculateTransitPositions(birthData, currentDate);
      
      // 出生チャートを取得
      const natalChart = await generateCompleteHoroscope(birthData);
      const transitAspects = calculateTransitAspects(natalChart.planets, transitPlanets);
      
      transitData.push({
        date: new Date(currentDate),
        planets: transitPlanets,
        aspects: transitAspects
      });
      
      // 次の日付に進む
      currentDate.setDate(currentDate.getDate() + intervalDays);
    } catch (error) {
      console.error(`トランジット計算エラー (${currentDate.toISOString()}):`, error);
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
  }
  
  return transitData;
};

// 重要なトランジットを検出
export const detectImportantTransits = (
  transitData: TransitData[]
): any[] => {
  const importantTransits: any[] = [];
  
  for (const transit of transitData) {
    // 強度が70%以上のアスペクトのみを重要とみなす
    const strongAspects = transit.aspects.filter((aspect: any) => aspect.exactness >= 70);
    
    for (const aspect of strongAspects) {
      importantTransits.push({
        date: transit.date,
        aspect: aspect,
        natalPlanet: aspect.natalPlanet,
        transitPlanet: aspect.transitPlanet,
        type: aspect.type,
        strength: aspect.exactness
      });
    }
  }
  
  // 日付順にソート
  return importantTransits.sort((a, b) => a.date.getTime() - b.date.getTime());
};

// 特定の期間の運勢傾向を分析（AI動的生成対応）
export const analyzeTransitTrends = async (
  transitData: TransitData[]
): Promise<{
  overallTrend: string;
  keyTransits: any[];
  recommendations: string[];
}> => {
  const importantTransits = detectImportantTransits(transitData);
  
  // AI生成機能をインポート
  const { generateTransitTrendDescription, generateTransitRecommendations } = await import('./aiAnalyzer');
  
  // 調和的アスペクトと挑戦的アスペクトを分類
  const harmoniousTransits = importantTransits.filter(t => 
    ['conjunction', 'trine', 'sextile'].includes(t.aspect.aspectType)
  );
  const challengingTransits = importantTransits.filter(t => 
    ['opposition', 'square'].includes(t.aspect.aspectType)
  );
  
  // AI動的生成で全体的な傾向を作成
  let overallTrend = '';
  try {
    overallTrend = await generateTransitTrendDescription(
      harmoniousTransits.length, 
      challengingTransits.length,
      'この期間'
    );
  } catch (error) {
    console.error('運勢傾向AI生成エラー:', error);
    // フォールバック：基本的な傾向判断
    if (harmoniousTransits.length > challengingTransits.length * 2) {
      overallTrend = '非常に良い運勢の期間です。新しいことに挑戦するのに適しています。';
    } else if (harmoniousTransits.length > challengingTransits.length) {
      overallTrend = '比較的良い運勢の期間です。慎重に行動すれば良い結果が期待できます。';
    } else {
      overallTrend = 'バランスの取れた期間です。安定した行動が推奨されます。';
    }
  }
  
  // AI動的生成で推奨事項を作成
  let recommendations: string[] = [];
  try {
    recommendations = await generateTransitRecommendations(
      harmoniousTransits.length,
      challengingTransits.length,
      importantTransits.length
    );
  } catch (error) {
    console.error('推奨事項AI生成エラー:', error);
    // フォールバック：基本的な推奨事項
    recommendations = [];
    
    if (harmoniousTransits.length > 0) {
      recommendations.push('🌟 良い星の影響を受けている期間です。新しいことに挑戦しましょう。');
    }
    
    if (challengingTransits.length > 0) {
      recommendations.push('💪 困難な星の配置ですが、これらは成長の機会です。粘り強く取り組みましょう。');
    }
    
    if (importantTransits.length === 0) {
      recommendations.push('📅 この期間は特別な星の影響は少ないですが、安定した行動が推奨されます。');
    }
  }
  
  return {
    overallTrend,
    keyTransits: importantTransits,
    recommendations
  };
}; 