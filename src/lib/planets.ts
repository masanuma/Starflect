import { Body } from 'astronomy-engine'
import { signIndex } from './astro'
import { getLang } from './i18n'
import type { Lang } from './i18n'
import type { PlanetKey } from './types'
import { PLANET_NAME, PLANET_ROLE, PLANET_DOMAIN } from './astroText'

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


/** パーティでの役割(クラス名・言語別) */

/** 担当領域(言語別) */

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
    name: (PLANET_NAME[lang] ?? PLANET_NAME.ja)[key],
    role: (PLANET_ROLE[lang] ?? PLANET_ROLE.ja)[key],
    domain: (PLANET_DOMAIN[lang] ?? PLANET_DOMAIN.ja)[key],
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
  fr: [
    'foncer tout droit dès que tu décides',
    'avancer lentement et sûrement, en savourant les sens',
    'rester vif et léger, les mots comme arme',
    'avancer en protégeant ce qui compte, à l\'écoute des émotions',
    't\'affirmer avec audace et panache, en restant toi-même',
    'peaufiner chaque détail avec soin et précision',
    'avancer avec élégance et équilibre, en harmonie avec les autres',
    'te concentrer à fond sur un point et aller jusqu\'au bout',
    'avancer librement avec du recul, porté par l\'optimisme',
    'gravir marche après marche, avec méthode et persévérance',
    'ouvrir la voie avec des idées originales, sans te plier aux conventions',
    'suivre le courant, guidé par l\'intuition et l\'imagination',
  ],
  it: [
    'lanciarti subito, dritto e senza esitazioni',
    'procedere con calma e sicurezza, assaporando i sensi',
    'restare agile e leggero, con le parole come arma',
    'avanzare proteggendo ciò che conta, in sintonia con le emozioni',
    'metterti in gioco con audacia e teatralità, restando te stesso',
    'rifinire ogni dettaglio con cura e precisione',
    'procedere con eleganza ed equilibrio, in armonia con gli altri',
    'concentrarti a fondo su un punto e arrivare fino in fondo',
    'muoverti libero e con ampia visione, spinto dall\'ottimismo',
    'salire un gradino alla volta, con metodo e costanza',
    'aprire la strada con idee originali, senza legarti alle convenzioni',
    'seguire il flusso, guidato da intuito e immaginazione',
  ],
  pt: [
    'partir na hora, direto e sem rodeios',
    'avançar com calma e firmeza, saboreando os sentidos',
    'manter-se ágil e leve, com as palavras como arma',
    'avançar protegendo o que importa, atento aos sentimentos',
    'mostrar-se com ousadia e dramaticidade, sendo você mesmo',
    'lapidar cada detalhe com cuidado e precisão',
    'avançar com elegância e equilíbrio, em harmonia com os outros',
    'concentrar-se a fundo num ponto e ir até o fim',
    'mover-se livre e com visão ampla, movido pelo otimismo',
    'subir passo a passo, com plano e persistência',
    'abrir caminho com ideias originais, sem se prender ao convencional',
    'seguir a corrente, guiado pela intuição e imaginação',
  ],
  ko: [
    '마음먹으면 곧바로 똑바로 밀고 나간다',
    '천천히 확실하게, 오감으로 음미하며 나아간다',
    '가볍고 발 빠르게, 말을 무기로 삼는다',
    '마음에 다가가, 소중한 것을 지키며 움직인다',
    '당당하고 드라마틱하게, 자신다움을 내세운다',
    '꼼꼼하고 정밀하게, 세부까지 갈고닦는다',
    '균형 있고 우아하게, 상대와 조화를 이루며 나아간다',
    '한 점에 깊이 집중해, 끝까지 파고든다',
    '넓은 시야로 자유롭게, 낙천을 연료로 삼는다',
    '계획적으로 끈기 있게, 한 계단씩 올라간다',
    '상식에 얽매이지 않고, 독창적인 발상으로 개척한다',
    '직감과 상상력에 기대어, 흐름을 타고 나아간다',
  ],
}

/** その天体の星座に応じた「やり方」フレーズ(現在言語) */
export function signMannerOf(lon: number): string {
  const lang = getLang()
  return (SIGN_MANNER[lang] ?? SIGN_MANNER.ja)[signIndex(lon)]
}
