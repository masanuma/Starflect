import { describe, it, expect } from 'vitest';
import { calculateAllPlanets, generateCompleteHoroscope, longitudeToZodiacSign, longitudeToDegreeInSign } from '../astronomyCalculator';
import { BirthData } from '../../types';

describe('天体計算エンジンテスト', () => {
  const testBirthData: BirthData = {
    birthDate: new Date('1990-01-01T12:00:00'),
    birthTime: '12:00',
    birthPlace: {
      city: '東京',
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo'
    }
  };

  describe('longitudeToZodiacSign', () => {
    it('0度は牡羊座を返す', () => {
      expect(longitudeToZodiacSign(0)).toBe('牡羊座');
    });

    it('30度は牡牛座を返す', () => {
      expect(longitudeToZodiacSign(30)).toBe('牡牛座');
    });

    it('360度は牡羊座を返す', () => {
      expect(longitudeToZodiacSign(360)).toBe('牡羊座');
    });

    it('各星座の境界値を正しく判定する', () => {
      expect(longitudeToZodiacSign(29.9)).toBe('牡羊座');
      expect(longitudeToZodiacSign(30.0)).toBe('牡牛座');
      expect(longitudeToZodiacSign(59.9)).toBe('牡牛座');
      expect(longitudeToZodiacSign(60.0)).toBe('双子座');
    });
  });

  describe('longitudeToDegreeInSign', () => {
    it('0度は0度を返す', () => {
      expect(longitudeToDegreeInSign(0)).toBe(0);
    });

    it('30度は0度を返す', () => {
      expect(longitudeToDegreeInSign(30)).toBe(0);
    });

    it('45度は15度を返す', () => {
      expect(longitudeToDegreeInSign(45)).toBe(15);
    });

    it('360度は0度を返す', () => {
      expect(longitudeToDegreeInSign(360)).toBe(0);
    });
  });

  describe('calculateAllPlanets', () => {
    it('10天体の位置を計算できる', async () => {
      const planets = await calculateAllPlanets(testBirthData);
      
      expect(planets).toHaveLength(10);
      expect(planets.map(p => p.planet)).toEqual([
        '太陽', '月', '水星', '金星', '火星', 
        '木星', '土星', '天王星', '海王星', '冥王星'
      ]);
    });

    it('各天体に必要なプロパティが含まれる', async () => {
      const planets = await calculateAllPlanets(testBirthData);
      
      planets.forEach(planet => {
        expect(planet).toHaveProperty('planet');
        expect(planet).toHaveProperty('sign');
        expect(planet).toHaveProperty('house');
        expect(planet).toHaveProperty('degree');
        expect(planet).toHaveProperty('retrograde');
        expect(typeof planet.planet).toBe('string');
        expect(typeof planet.sign).toBe('string');
        expect(typeof planet.house).toBe('number');
        expect(typeof planet.degree).toBe('number');
        expect(typeof planet.retrograde).toBe('boolean');
      });
    });

    it('度数は小数点以下1桁に丸められる', async () => {
      const planets = await calculateAllPlanets(testBirthData);
      
      planets.forEach(planet => {
        const decimalPlaces = planet.degree.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('generateCompleteHoroscope', () => {
    it('完全なホロスコープデータを生成できる', async () => {
      const horoscope = await generateCompleteHoroscope(testBirthData);
      
      expect(horoscope).toHaveProperty('planets');
      expect(horoscope).toHaveProperty('houses');
      expect(horoscope).toHaveProperty('aspects');
      expect(horoscope.planets).toHaveLength(10);
      expect(horoscope.houses).toHaveLength(12);
      expect(Array.isArray(horoscope.aspects)).toBe(true);
    });

    it('ハウスデータが正しい形式である', async () => {
      const horoscope = await generateCompleteHoroscope(testBirthData);
      
      horoscope.houses.forEach((house, index) => {
        expect(house).toHaveProperty('house');
        expect(house).toHaveProperty('sign');
        expect(house).toHaveProperty('degree');
        expect(house.house).toBe(index + 1);
        expect(typeof house.sign).toBe('string');
        expect(typeof house.degree).toBe('number');
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な日付でもエラーにならない', async () => {
      const invalidBirthData: BirthData = {
        birthDate: new Date('invalid-date'),
        birthTime: '12:00',
        birthPlace: {
          city: '東京',
          latitude: 35.6762,
          longitude: 139.6503,
          timezone: 'Asia/Tokyo'
        }
      };
      
      // エラーが発生しないことを確認
      await expect(calculateAllPlanets(invalidBirthData)).resolves.toBeDefined();
    });

    it('空のデータでもデフォルト値が設定される', async () => {
      const emptyBirthData: BirthData = {
        birthDate: new Date(),
        birthTime: '',
        birthPlace: {
          city: '',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC'
        }
      };
      
      const planets = await calculateAllPlanets(emptyBirthData);
      expect(planets).toHaveLength(10);
      planets.forEach(planet => {
        expect(planet.sign).toBeDefined();
        expect(planet.degree).toBeGreaterThanOrEqual(0);
        expect(planet.degree).toBeLessThan(30);
      });
    });
  });
}); 