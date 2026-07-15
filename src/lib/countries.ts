import type { Lang } from './i18n'

/** 国データ。lat/lon は首都のおおよその座標(上昇星座の近似用)、offset は標準時のUTCオフセット(時刻→UTC変換用) */
export interface Country {
  code: string
  ja: string
  en: string
  es: string
  fr: string
  it: string
  pt: string
  ko: string
  lat: number
  lon: number
  offset: number
}

/** 主要国リスト(v1)。上昇星座は近似なので座標・オフセットは代表値でよい。順次拡張可 */
export const COUNTRIES: Country[] = [
  { code: 'JP', ja: '日本', en: 'Japan', es: 'Japón', fr: 'Japon', it: 'Giappone', pt: 'Japão', ko: '일본', lat: 35.68, lon: 139.69, offset: 9 },
  { code: 'KR', ja: '韓国', en: 'South Korea', es: 'Corea del Sur', fr: 'Corée du Sud', it: 'Corea del Sud', pt: 'Coreia do Sul', ko: '대한민국', lat: 37.57, lon: 126.98, offset: 9 },
  { code: 'CN', ja: '中国', en: 'China', es: 'China', fr: 'Chine', it: 'Cina', pt: 'China', ko: '중국', lat: 39.9, lon: 116.4, offset: 8 },
  { code: 'TW', ja: '台湾', en: 'Taiwan', es: 'Taiwán', fr: 'Taïwan', it: 'Taiwan', pt: 'Taiwan', ko: '대만', lat: 25.03, lon: 121.57, offset: 8 },
  { code: 'HK', ja: '香港', en: 'Hong Kong', es: 'Hong Kong', fr: 'Hong Kong', it: 'Hong Kong', pt: 'Hong Kong', ko: '홍콩', lat: 22.32, lon: 114.17, offset: 8 },
  { code: 'TH', ja: 'タイ', en: 'Thailand', es: 'Tailandia', fr: 'Thaïlande', it: 'Thailandia', pt: 'Tailândia', ko: '태국', lat: 13.75, lon: 100.5, offset: 7 },
  { code: 'VN', ja: 'ベトナム', en: 'Vietnam', es: 'Vietnam', fr: 'Viêt Nam', it: 'Vietnam', pt: 'Vietnã', ko: '베트남', lat: 21.03, lon: 105.85, offset: 7 },
  { code: 'PH', ja: 'フィリピン', en: 'Philippines', es: 'Filipinas', fr: 'Philippines', it: 'Filippine', pt: 'Filipinas', ko: '필리핀', lat: 14.6, lon: 120.98, offset: 8 },
  { code: 'ID', ja: 'インドネシア', en: 'Indonesia', es: 'Indonesia', fr: 'Indonésie', it: 'Indonesia', pt: 'Indonésia', ko: '인도네시아', lat: -6.2, lon: 106.85, offset: 7 },
  { code: 'MY', ja: 'マレーシア', en: 'Malaysia', es: 'Malasia', fr: 'Malaisie', it: 'Malaysia', pt: 'Malásia', ko: '말레이시아', lat: 3.14, lon: 101.69, offset: 8 },
  { code: 'SG', ja: 'シンガポール', en: 'Singapore', es: 'Singapur', fr: 'Singapour', it: 'Singapore', pt: 'Singapura', ko: '싱가포르', lat: 1.35, lon: 103.82, offset: 8 },
  { code: 'IN', ja: 'インド', en: 'India', es: 'India', fr: 'Inde', it: 'India', pt: 'Índia', ko: '인도', lat: 28.61, lon: 77.21, offset: 5.5 },
  { code: 'AE', ja: 'アラブ首長国連邦', en: 'United Arab Emirates', es: 'Emiratos Árabes Unidos', fr: 'Émirats arabes unis', it: 'Emirati Arabi Uniti', pt: 'Emirados Árabes Unidos', ko: '아랍에미리트', lat: 24.47, lon: 54.37, offset: 4 },
  { code: 'SA', ja: 'サウジアラビア', en: 'Saudi Arabia', es: 'Arabia Saudita', fr: 'Arabie saoudite', it: 'Arabia Saudita', pt: 'Arábia Saudita', ko: '사우디아라비아', lat: 24.71, lon: 46.68, offset: 3 },
  { code: 'IL', ja: 'イスラエル', en: 'Israel', es: 'Israel', fr: 'Israël', it: 'Israele', pt: 'Israel', ko: '이스라엘', lat: 31.77, lon: 35.22, offset: 2 },
  { code: 'TR', ja: 'トルコ', en: 'Turkey', es: 'Turquía', fr: 'Turquie', it: 'Turchia', pt: 'Turquia', ko: '튀르키예', lat: 39.93, lon: 32.86, offset: 3 },
  { code: 'GB', ja: 'イギリス', en: 'United Kingdom', es: 'Reino Unido', fr: 'Royaume-Uni', it: 'Regno Unito', pt: 'Reino Unido', ko: '영국', lat: 51.51, lon: -0.13, offset: 0 },
  { code: 'IE', ja: 'アイルランド', en: 'Ireland', es: 'Irlanda', fr: 'Irlande', it: 'Irlanda', pt: 'Irlanda', ko: '아일랜드', lat: 53.35, lon: -6.26, offset: 0 },
  { code: 'FR', ja: 'フランス', en: 'France', es: 'Francia', fr: 'France', it: 'Francia', pt: 'França', ko: '프랑스', lat: 48.85, lon: 2.35, offset: 1 },
  { code: 'ES', ja: 'スペイン', en: 'Spain', es: 'España', fr: 'Espagne', it: 'Spagna', pt: 'Espanha', ko: '스페인', lat: 40.42, lon: -3.7, offset: 1 },
  { code: 'PT', ja: 'ポルトガル', en: 'Portugal', es: 'Portugal', fr: 'Portugal', it: 'Portogallo', pt: 'Portugal', ko: '포르투갈', lat: 38.72, lon: -9.14, offset: 0 },
  { code: 'IT', ja: 'イタリア', en: 'Italy', es: 'Italia', fr: 'Italie', it: 'Italia', pt: 'Itália', ko: '이탈리아', lat: 41.9, lon: 12.5, offset: 1 },
  { code: 'DE', ja: 'ドイツ', en: 'Germany', es: 'Alemania', fr: 'Allemagne', it: 'Germania', pt: 'Alemanha', ko: '독일', lat: 52.52, lon: 13.4, offset: 1 },
  { code: 'NL', ja: 'オランダ', en: 'Netherlands', es: 'Países Bajos', fr: 'Pays-Bas', it: 'Paesi Bassi', pt: 'Países Baixos', ko: '네덜란드', lat: 52.37, lon: 4.9, offset: 1 },
  { code: 'BE', ja: 'ベルギー', en: 'Belgium', es: 'Bélgica', fr: 'Belgique', it: 'Belgio', pt: 'Bélgica', ko: '벨기에', lat: 50.85, lon: 4.35, offset: 1 },
  { code: 'CH', ja: 'スイス', en: 'Switzerland', es: 'Suiza', fr: 'Suisse', it: 'Svizzera', pt: 'Suíça', ko: '스위스', lat: 46.95, lon: 7.45, offset: 1 },
  { code: 'AT', ja: 'オーストリア', en: 'Austria', es: 'Austria', fr: 'Autriche', it: 'Austria', pt: 'Áustria', ko: '오스트리아', lat: 48.21, lon: 16.37, offset: 1 },
  { code: 'SE', ja: 'スウェーデン', en: 'Sweden', es: 'Suecia', fr: 'Suède', it: 'Svezia', pt: 'Suécia', ko: '스웨덴', lat: 59.33, lon: 18.07, offset: 1 },
  { code: 'NO', ja: 'ノルウェー', en: 'Norway', es: 'Noruega', fr: 'Norvège', it: 'Norvegia', pt: 'Noruega', ko: '노르웨이', lat: 59.91, lon: 10.75, offset: 1 },
  { code: 'DK', ja: 'デンマーク', en: 'Denmark', es: 'Dinamarca', fr: 'Danemark', it: 'Danimarca', pt: 'Dinamarca', ko: '덴마크', lat: 55.68, lon: 12.57, offset: 1 },
  { code: 'FI', ja: 'フィンランド', en: 'Finland', es: 'Finlandia', fr: 'Finlande', it: 'Finlandia', pt: 'Finlândia', ko: '핀란드', lat: 60.17, lon: 24.94, offset: 2 },
  { code: 'PL', ja: 'ポーランド', en: 'Poland', es: 'Polonia', fr: 'Pologne', it: 'Polonia', pt: 'Polônia', ko: '폴란드', lat: 52.23, lon: 21.01, offset: 1 },
  { code: 'CZ', ja: 'チェコ', en: 'Czechia', es: 'Chequia', fr: 'Tchéquie', it: 'Cechia', pt: 'Tchéquia', ko: '체코', lat: 50.08, lon: 14.44, offset: 1 },
  { code: 'GR', ja: 'ギリシャ', en: 'Greece', es: 'Grecia', fr: 'Grèce', it: 'Grecia', pt: 'Grécia', ko: '그리스', lat: 37.98, lon: 23.73, offset: 2 },
  { code: 'RU', ja: 'ロシア', en: 'Russia', es: 'Rusia', fr: 'Russie', it: 'Russia', pt: 'Rússia', ko: '러시아', lat: 55.76, lon: 37.62, offset: 3 },
  { code: 'UA', ja: 'ウクライナ', en: 'Ukraine', es: 'Ucrania', fr: 'Ukraine', it: 'Ucraina', pt: 'Ucrânia', ko: '우크라이나', lat: 50.45, lon: 30.52, offset: 2 },
  { code: 'RO', ja: 'ルーマニア', en: 'Romania', es: 'Rumanía', fr: 'Roumanie', it: 'Romania', pt: 'Romênia', ko: '루마니아', lat: 44.43, lon: 26.1, offset: 2 },
  { code: 'HU', ja: 'ハンガリー', en: 'Hungary', es: 'Hungría', fr: 'Hongrie', it: 'Ungheria', pt: 'Hungria', ko: '헝가리', lat: 47.5, lon: 19.04, offset: 1 },
  { code: 'US', ja: 'アメリカ合衆国', en: 'United States', es: 'Estados Unidos', fr: 'États-Unis', it: 'Stati Uniti', pt: 'Estados Unidos', ko: '미국', lat: 38.9, lon: -77.04, offset: -5 },
  { code: 'CA', ja: 'カナダ', en: 'Canada', es: 'Canadá', fr: 'Canada', it: 'Canada', pt: 'Canadá', ko: '캐나다', lat: 45.42, lon: -75.7, offset: -5 },
  { code: 'MX', ja: 'メキシコ', en: 'Mexico', es: 'México', fr: 'Mexique', it: 'Messico', pt: 'México', ko: '멕시코', lat: 19.43, lon: -99.13, offset: -6 },
  { code: 'BR', ja: 'ブラジル', en: 'Brazil', es: 'Brasil', fr: 'Brésil', it: 'Brasile', pt: 'Brasil', ko: '브라질', lat: -15.79, lon: -47.88, offset: -3 },
  { code: 'AR', ja: 'アルゼンチン', en: 'Argentina', es: 'Argentina', fr: 'Argentine', it: 'Argentina', pt: 'Argentina', ko: '아르헨티나', lat: -34.6, lon: -58.38, offset: -3 },
  { code: 'CL', ja: 'チリ', en: 'Chile', es: 'Chile', fr: 'Chili', it: 'Cile', pt: 'Chile', ko: '칠레', lat: -33.45, lon: -70.67, offset: -3 },
  { code: 'CO', ja: 'コロンビア', en: 'Colombia', es: 'Colombia', fr: 'Colombie', it: 'Colombia', pt: 'Colômbia', ko: '콜롬비아', lat: 4.71, lon: -74.07, offset: -5 },
  { code: 'PE', ja: 'ペルー', en: 'Peru', es: 'Perú', fr: 'Pérou', it: 'Perù', pt: 'Peru', ko: '페루', lat: -12.05, lon: -77.04, offset: -5 },
  { code: 'VE', ja: 'ベネズエラ', en: 'Venezuela', es: 'Venezuela', fr: 'Venezuela', it: 'Venezuela', pt: 'Venezuela', ko: '베네수엘라', lat: 10.49, lon: -66.88, offset: -4 },
  { code: 'EC', ja: 'エクアドル', en: 'Ecuador', es: 'Ecuador', fr: 'Équateur', it: 'Ecuador', pt: 'Equador', ko: '에콰도르', lat: -0.18, lon: -78.47, offset: -5 },
  { code: 'PA', ja: 'パナマ', en: 'Panama', es: 'Panamá', fr: 'Panama', it: 'Panama', pt: 'Panamá', ko: '파나마', lat: 8.98, lon: -79.52, offset: -5 },
  { code: 'UY', ja: 'ウルグアイ', en: 'Uruguay', es: 'Uruguay', fr: 'Uruguay', it: 'Uruguay', pt: 'Uruguai', ko: '우루과이', lat: -34.9, lon: -56.16, offset: -3 },
  { code: 'AU', ja: 'オーストラリア', en: 'Australia', es: 'Australia', fr: 'Australie', it: 'Australia', pt: 'Austrália', ko: '호주', lat: -33.87, lon: 151.21, offset: 10 },
  { code: 'NZ', ja: 'ニュージーランド', en: 'New Zealand', es: 'Nueva Zelanda', fr: 'Nouvelle-Zélande', it: 'Nuova Zelanda', pt: 'Nova Zelândia', ko: '뉴질랜드', lat: -41.29, lon: 174.78, offset: 12 },
  { code: 'ZA', ja: '南アフリカ', en: 'South Africa', es: 'Sudáfrica', fr: 'Afrique du Sud', it: 'Sudafrica', pt: 'África do Sul', ko: '남아프리카 공화국', lat: -25.75, lon: 28.19, offset: 2 },
  { code: 'EG', ja: 'エジプト', en: 'Egypt', es: 'Egipto', fr: 'Égypte', it: 'Egitto', pt: 'Egito', ko: '이집트', lat: 30.04, lon: 31.24, offset: 2 },
  { code: 'NG', ja: 'ナイジェリア', en: 'Nigeria', es: 'Nigeria', fr: 'Nigéria', it: 'Nigeria', pt: 'Nigéria', ko: '나이지리아', lat: 9.08, lon: 7.4, offset: 1 },
  { code: 'KE', ja: 'ケニア', en: 'Kenya', es: 'Kenia', fr: 'Kenya', it: 'Kenya', pt: 'Quênia', ko: '케냐', lat: -1.29, lon: 36.82, offset: 3 },
  { code: 'MA', ja: 'モロッコ', en: 'Morocco', es: 'Marruecos', fr: 'Maroc', it: 'Marocco', pt: 'Marrocos', ko: '모로코', lat: 34.02, lon: -6.83, offset: 1 },
]

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]))

export function countryByCode(code: string): Country {
  return byCode.get(code) ?? byCode.get('JP')!
}

export const countryName = (c: Country, lang: Lang): string => c[lang] ?? c.en

/** 端末のロケールから居住国を推定(位置情報の許可は不要)。無ければ言語からフォールバック */
export function detectDefaultCountry(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    if (region && byCode.has(region)) return region
  } catch {
    /* 無視 */
  }
  const lang = (typeof navigator !== 'undefined' ? navigator.language : 'ja').slice(0, 2)
  if (lang === 'ja') return 'JP'
  if (lang === 'es') return 'ES'
  if (lang === 'en') return 'US'
  return 'JP'
}
