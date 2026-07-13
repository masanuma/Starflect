import { Body } from 'astronomy-engine'
import { signIndex } from './astro'
import { getLang } from './i18n'
import type { Lang } from './i18n'
import type { PlanetKey } from './types'

/** 言語非依存の天体情報(記号・天体・世代フラグ) */
interface PlanetBase {
  symbol: string
  body?: Body
  generational?: boolean
}

const PLANET_BASE: Record<PlanetKey, PlanetBase> = {
  sun: { symbol: '☉', body: Body.Sun },
  moon: { symbol: '☽', body: Body.Moon },
  asc: { symbol: 'ASC' },
  mercury: { symbol: '☿', body: Body.Mercury },
  venus: { symbol: '♀', body: Body.Venus },
  mars: { symbol: '♂', body: Body.Mars },
  jupiter: { symbol: '♃', body: Body.Jupiter },
  saturn: { symbol: '♄', body: Body.Saturn },
  uranus: { symbol: '♅', body: Body.Uranus, generational: true },
  neptune: { symbol: '♆', body: Body.Neptune, generational: true },
  pluto: { symbol: '♇', body: Body.Pluto, generational: true },
}

/** 天体名(言語別) */
const NAME: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '太陽', moon: '月', asc: '上昇星座', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' },
  en: { sun: 'Sun', moon: 'Moon', asc: 'Rising', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' },
  es: { sun: 'Sol', moon: 'Luna', asc: 'Ascendente', mercury: 'Mercurio', venus: 'Venus', mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Neptuno', pluto: 'Plutón' },
}

/** パーティでの役割(クラス名・言語別) */
const ROLE: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '主人公', moon: '癒し手', asc: '見た目担当', mercury: '軍師', venus: '恋の案内人', mars: '戦士', jupiter: '幸運の運び屋', saturn: '鬼コーチ', uranus: '革命児', neptune: '夢見る詩人', pluto: '変身の達人' },
  en: { sun: 'Hero', moon: 'Healer', asc: 'First Impression', mercury: 'Strategist', venus: 'Love Guide', mars: 'Warrior', jupiter: 'Luck Bringer', saturn: 'Strict Coach', uranus: 'Rebel', neptune: 'Dreamer Poet', pluto: 'Master of Change' },
  es: { sun: 'Protagonista', moon: 'Sanador', asc: 'Imagen', mercury: 'Estratega', venus: 'Guía del Amor', mars: 'Guerrero', jupiter: 'Portador de Suerte', saturn: 'Entrenador Exigente', uranus: 'Rebelde', neptune: 'Poeta Soñador', pluto: 'Maestro del Cambio' },
}

/** 担当領域(言語別) */
const DOMAIN: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '基本性格・人生の目的', moon: '素顔の感情・安心のありか', asc: '第一印象・生まれ持った雰囲気', mercury: '考え方・言葉・学び方', venus: '恋愛の好み・美意識・楽しみ方', mars: 'やる気の出し方・戦い方', jupiter: '幸運の広がり方・チャンスの掴み方', saturn: '人生の課題・鍛えられる場所', uranus: '変革を起こす場所・個性の突破口', neptune: '夢見る力・イマジネーション', pluto: '人生を根底から変える力' },
  en: { sun: 'Core self & life purpose', moon: 'True feelings & where you feel safe', asc: 'First impression & natural aura', mercury: 'Thinking, words & learning', venus: 'Love, beauty & pleasure', mars: 'Drive & how you fight', jupiter: 'Luck & seizing chances', saturn: "Life's lessons & discipline", uranus: 'Change & your breakthrough', neptune: 'Dreams & imagination', pluto: 'Power to transform your life' },
  es: { sun: 'Esencia y propósito de vida', moon: 'Emociones verdaderas y dónde te sientes seguro', asc: 'Primera impresión y aura natural', mercury: 'Pensamiento, palabras y aprendizaje', venus: 'Amor, belleza y placer', mars: 'Empuje y cómo luchas', jupiter: 'Suerte y aprovechar oportunidades', saturn: 'Retos de la vida y disciplina', uranus: 'Cambio y tu ruptura', neptune: 'Sueños e imaginación', pluto: 'Poder de transformar tu vida' },
}

export interface PlanetInfo extends PlanetBase {
  name: string
  role: string
  domain: string
}

/** 現在言語での天体情報を取得 */
export function getPlanet(key: PlanetKey): PlanetInfo {
  const lang = getLang()
  return {
    ...PLANET_BASE[key],
    name: (NAME[lang] ?? NAME.ja)[key],
    role: (ROLE[lang] ?? ROLE.ja)[key],
    domain: (DOMAIN[lang] ?? DOMAIN.ja)[key],
  }
}

/** プロ級モードで計算する10天体(表示順) */
export const PRO_PLANETS: PlanetKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

/** 星座ごとの「やり方(クセ)」— 言語別、牡羊→魚の順 */
const SIGN_MANNER: Record<Lang, string[]> = {
  ja: [
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
  ],
  en: [
    'charge straight ahead the moment you decide',
    'move slowly and surely, savoring the senses',
    'stay nimble and light, with words as your weapon',
    'move while protecting what matters, tuned to feelings',
    'put yourself out there boldly and dramatically',
    'refine every detail with careful precision',
    'move elegantly and in balance, in harmony with others',
    'focus deeply on one point and dig all the way in',
    'move freely with a wide view, fueled by optimism',
    'climb step by step, planned and persistent',
    'break through with original ideas, free of convention',
    'ride the flow, trusting intuition and imagination',
  ],
  es: [
    'lanzarte al instante, directo y sin rodeos',
    'avanzar con calma y firmeza, disfrutando los sentidos',
    'moverte ágil y ligero, con las palabras como arma',
    'avanzar protegiendo lo que importa, atento a los sentimientos',
    'mostrarte con audacia y dramatismo, siendo tú mismo',
    'pulir cada detalle con cuidado y precisión',
    'avanzar con elegancia y equilibrio, en armonía con los demás',
    'concentrarte a fondo en un punto y llegar hasta el final',
    'moverte libre y con amplia mirada, con el optimismo como motor',
    'subir paso a paso, con plan y constancia',
    'abrir camino con ideas originales, sin atarte a lo común',
    'seguir la corriente, guiado por la intuición y la imaginación',
  ],
}

/** その天体の星座に応じた「やり方」フレーズ(現在言語) */
export function signMannerOf(lon: number): string {
  const lang = getLang()
  return (SIGN_MANNER[lang] ?? SIGN_MANNER.ja)[signIndex(lon)]
}
