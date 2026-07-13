import { Body } from 'astronomy-engine'
import { signIndex } from './astro'
import type { PlanetKey } from './types'

export interface PlanetInfo {
  name: string
  symbol: string
  /** その天体があらわす領域(〜をあらわす、の形) */
  domain: string
  sub: string
  /** あなたの中のキャラとしての役割名 */
  role: string
  body?: Body
  /** 世代天体(動きが遅く、同世代で星座が共通しやすい) */
  generational?: boolean
}

export const PLANET_INFO: Record<PlanetKey, PlanetInfo> = {
  sun: { name: '太陽', symbol: '☉', domain: '基本性格・人生の目的', sub: 'あなたの核', role: '主人公', body: Body.Sun },
  moon: { name: '月', symbol: '☽', domain: '素顔の感情・安心のありか', sub: '心の充電方法', role: '癒し手', body: Body.Moon },
  asc: { name: '上昇星座', symbol: 'ASC', domain: '第一印象・生まれ持った雰囲気', sub: '人生の入り口', role: '見た目担当' },
  mercury: { name: '水星', symbol: '☿', domain: '考え方・言葉・学び方', sub: '知性とコミュニケーション', role: '軍師', body: Body.Mercury },
  venus: { name: '金星', symbol: '♀', domain: '恋愛の好み・美意識・楽しみ方', sub: '愛と喜び', role: '恋の案内人', body: Body.Venus },
  mars: { name: '火星', symbol: '♂', domain: 'やる気の出し方・戦い方', sub: '行動力と情熱', role: '戦士', body: Body.Mars },
  jupiter: { name: '木星', symbol: '♃', domain: '幸運の広がり方・チャンスの掴み方', sub: '発展と拡大', role: '幸運の運び屋', body: Body.Jupiter },
  saturn: { name: '土星', symbol: '♄', domain: '人生の課題・鍛えられる場所', sub: '試練と成熟', role: '鬼コーチ', body: Body.Saturn },
  uranus: { name: '天王星', symbol: '♅', domain: '変革を起こす場所・個性の突破口', sub: '革新(世代天体)', role: '革命児', body: Body.Uranus, generational: true },
  neptune: { name: '海王星', symbol: '♆', domain: '夢見る力・イマジネーション', sub: '幻想と霊感(世代天体)', role: '夢見る詩人', body: Body.Neptune, generational: true },
  pluto: { name: '冥王星', symbol: '♇', domain: '人生を根底から変える力', sub: '再生(世代天体)', role: '変身の達人', body: Body.Pluto, generational: true },
}

/** プロ級モードで計算する10天体(表示順) */
export const PRO_PLANETS: PlanetKey[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

/** 星座ごとの「やり方」の傾向 — 天体×星座の組み合わせ文の材料 */
const SIGN_MANNER: string[] = [
  '思い立ったら即、ストレートに突き進む',
  'じっくり確実に、五感で味わいながら進める',
  '軽やかにフットワークよく、言葉を武器にする',
  '気持ちに寄り添い、大切なものを守りながら動く',
  '堂々とドラマチックに、自分らしさを打ち出す',
  '丁寧に精密に、細部まで磨き上げる',
  'バランスよくエレガントに、相手と調和しながら進める',
  '深く一点集中で、とことん突き詰める',
  '大きな視野で自由に、楽観を燃料にする',
  '計画的に粘り強く、一段ずつ登っていく',
  '常識にとらわれず、独自の発想で切り開く',
  '直感と想像力を頼りに、流れに乗って進む',
]

/** その天体の星座に応じた「やり方」フレーズを返す */
export function signMannerOf(lon: number): string {
  return SIGN_MANNER[signIndex(lon)]
}
