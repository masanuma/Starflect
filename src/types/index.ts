// 仕様書で定義されたデータ型をTypeScriptで実装

export interface BirthData {
  name?: string;
  birthDate: Date;
  birthTime: string; // "HH:MM"
  timeType?: 'exact' | 'approximate'; // 時刻の精度
  timeRange?: 'morning' | 'afternoon' | 'evening' | 'midnight'; // 大体の時刻の場合の時間帯
  birthPlace: {
    city: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

export type ZodiacSign = '牡羊座' | '牡牛座' | '双子座' | '蟹座' | '獅子座' | '乙女座' | '天秤座' | '蠍座' | '射手座' | '山羊座' | '水瓶座' | '魚座';

export interface PlanetPosition {
  planet: string;
  sign: string; // 星座名
  house: number; // 1-12
  degree: number;
  retrograde: boolean;
}

// アスペクト関連の型は aspectCalculator.ts から再エクスポート
export type { AspectType, Aspect, AspectDefinition } from '../utils/aspectCalculator';

export interface HousePosition {
  house: number;
  sign: string;
  degree: number;
}

export interface HoroscopeData {
  planets: PlanetPosition[];
  aspects: any[]; // アスペクトは後で詳細実装
  houses: HousePosition[];
}
 