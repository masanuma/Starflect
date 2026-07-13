import { getLang } from './i18n'

/** 日本の都道府県(上昇星座の緯度経度用)。時差は全国 +9 で一定なので持たない。 */
export interface Prefecture {
  code: string
  ja: string
  /** EN/ES 共通のローマ字表記 */
  romaji: string
  lat: number
  lon: number
}

/** 県庁所在地の座標。コードは JIS の都道府県コード。 */
export const PREFECTURES: Prefecture[] = [
  { code: '01', ja: '北海道', romaji: 'Hokkaido', lat: 43.06, lon: 141.35 },
  { code: '02', ja: '青森県', romaji: 'Aomori', lat: 40.82, lon: 140.74 },
  { code: '03', ja: '岩手県', romaji: 'Iwate', lat: 39.7, lon: 141.15 },
  { code: '04', ja: '宮城県', romaji: 'Miyagi', lat: 38.27, lon: 140.87 },
  { code: '05', ja: '秋田県', romaji: 'Akita', lat: 39.72, lon: 140.1 },
  { code: '06', ja: '山形県', romaji: 'Yamagata', lat: 38.24, lon: 140.36 },
  { code: '07', ja: '福島県', romaji: 'Fukushima', lat: 37.75, lon: 140.47 },
  { code: '08', ja: '茨城県', romaji: 'Ibaraki', lat: 36.34, lon: 140.45 },
  { code: '09', ja: '栃木県', romaji: 'Tochigi', lat: 36.57, lon: 139.88 },
  { code: '10', ja: '群馬県', romaji: 'Gunma', lat: 36.39, lon: 139.06 },
  { code: '11', ja: '埼玉県', romaji: 'Saitama', lat: 35.86, lon: 139.65 },
  { code: '12', ja: '千葉県', romaji: 'Chiba', lat: 35.61, lon: 140.12 },
  { code: '13', ja: '東京都', romaji: 'Tokyo', lat: 35.69, lon: 139.69 },
  { code: '14', ja: '神奈川県', romaji: 'Kanagawa', lat: 35.45, lon: 139.64 },
  { code: '15', ja: '新潟県', romaji: 'Niigata', lat: 37.9, lon: 139.02 },
  { code: '16', ja: '富山県', romaji: 'Toyama', lat: 36.7, lon: 137.21 },
  { code: '17', ja: '石川県', romaji: 'Ishikawa', lat: 36.59, lon: 136.63 },
  { code: '18', ja: '福井県', romaji: 'Fukui', lat: 36.07, lon: 136.22 },
  { code: '19', ja: '山梨県', romaji: 'Yamanashi', lat: 35.66, lon: 138.57 },
  { code: '20', ja: '長野県', romaji: 'Nagano', lat: 36.65, lon: 138.18 },
  { code: '21', ja: '岐阜県', romaji: 'Gifu', lat: 35.39, lon: 136.72 },
  { code: '22', ja: '静岡県', romaji: 'Shizuoka', lat: 34.98, lon: 138.38 },
  { code: '23', ja: '愛知県', romaji: 'Aichi', lat: 35.18, lon: 136.91 },
  { code: '24', ja: '三重県', romaji: 'Mie', lat: 34.73, lon: 136.51 },
  { code: '25', ja: '滋賀県', romaji: 'Shiga', lat: 35.0, lon: 135.87 },
  { code: '26', ja: '京都府', romaji: 'Kyoto', lat: 35.02, lon: 135.76 },
  { code: '27', ja: '大阪府', romaji: 'Osaka', lat: 34.69, lon: 135.52 },
  { code: '28', ja: '兵庫県', romaji: 'Hyogo', lat: 34.69, lon: 135.2 },
  { code: '29', ja: '奈良県', romaji: 'Nara', lat: 34.69, lon: 135.83 },
  { code: '30', ja: '和歌山県', romaji: 'Wakayama', lat: 34.23, lon: 135.17 },
  { code: '31', ja: '鳥取県', romaji: 'Tottori', lat: 35.5, lon: 134.24 },
  { code: '32', ja: '島根県', romaji: 'Shimane', lat: 35.47, lon: 133.05 },
  { code: '33', ja: '岡山県', romaji: 'Okayama', lat: 34.66, lon: 133.93 },
  { code: '34', ja: '広島県', romaji: 'Hiroshima', lat: 34.4, lon: 132.46 },
  { code: '35', ja: '山口県', romaji: 'Yamaguchi', lat: 34.19, lon: 131.47 },
  { code: '36', ja: '徳島県', romaji: 'Tokushima', lat: 34.07, lon: 134.56 },
  { code: '37', ja: '香川県', romaji: 'Kagawa', lat: 34.34, lon: 134.04 },
  { code: '38', ja: '愛媛県', romaji: 'Ehime', lat: 33.84, lon: 132.77 },
  { code: '39', ja: '高知県', romaji: 'Kochi', lat: 33.56, lon: 133.53 },
  { code: '40', ja: '福岡県', romaji: 'Fukuoka', lat: 33.61, lon: 130.42 },
  { code: '41', ja: '佐賀県', romaji: 'Saga', lat: 33.25, lon: 130.3 },
  { code: '42', ja: '長崎県', romaji: 'Nagasaki', lat: 32.74, lon: 129.87 },
  { code: '43', ja: '熊本県', romaji: 'Kumamoto', lat: 32.79, lon: 130.74 },
  { code: '44', ja: '大分県', romaji: 'Oita', lat: 33.24, lon: 131.61 },
  { code: '45', ja: '宮崎県', romaji: 'Miyazaki', lat: 31.91, lon: 131.42 },
  { code: '46', ja: '鹿児島県', romaji: 'Kagoshima', lat: 31.56, lon: 130.56 },
  { code: '47', ja: '沖縄県', romaji: 'Okinawa', lat: 26.21, lon: 127.68 },
]

/** 既定は東京 */
export const DEFAULT_PREFECTURE = '13'

export const prefectureByCode = (code: string): Prefecture =>
  PREFECTURES.find((p) => p.code === code) ?? PREFECTURES.find((p) => p.code === DEFAULT_PREFECTURE)!

/** 都道府県の表示名(現在言語)。ja は漢字、EN/ES はローマ字。 */
export const prefectureName = (p: Prefecture): string => (getLang() === 'ja' ? p.ja : p.romaji)
