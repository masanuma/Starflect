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
  fr: { sun: 'Soleil', moon: 'Lune', asc: 'Ascendant', mercury: 'Mercure', venus: 'Vénus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturne', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluton' },
  it: { sun: 'Sole', moon: 'Luna', asc: 'Ascendente', mercury: 'Mercurio', venus: 'Venere', mars: 'Marte', jupiter: 'Giove', saturn: 'Saturno', uranus: 'Urano', neptune: 'Nettuno', pluto: 'Plutone' },
  pt: { sun: 'Sol', moon: 'Lua', asc: 'Ascendente', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão' },
  ko: { sun: '태양', moon: '달', asc: '상승궁', mercury: '수성', venus: '금성', mars: '화성', jupiter: '목성', saturn: '토성', uranus: '천왕성', neptune: '해왕성', pluto: '명왕성' },
}

/** パーティでの役割(クラス名・言語別) */
const ROLE: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '主人公', moon: '癒し手', asc: '見た目担当', mercury: '軍師', venus: '恋の案内人', mars: '戦士', jupiter: '幸運の運び屋', saturn: '鬼コーチ', uranus: '革命児', neptune: '夢見る詩人', pluto: '変身の達人' },
  en: { sun: 'Hero', moon: 'Healer', asc: 'First Impression', mercury: 'Strategist', venus: 'Love Guide', mars: 'Warrior', jupiter: 'Luck Bringer', saturn: 'Strict Coach', uranus: 'Rebel', neptune: 'Dreamer Poet', pluto: 'Master of Change' },
  es: { sun: 'Protagonista', moon: 'Sanador', asc: 'Imagen', mercury: 'Estratega', venus: 'Guía del Amor', mars: 'Guerrero', jupiter: 'Portador de Suerte', saturn: 'Entrenador Exigente', uranus: 'Rebelde', neptune: 'Poeta Soñador', pluto: 'Maestro del Cambio' },
  fr: { sun: 'Héros', moon: 'Guérisseur', asc: 'Première Impression', mercury: 'Stratège', venus: 'Guide de l\'Amour', mars: 'Guerrier', jupiter: 'Porte-Bonheur', saturn: 'Coach Sévère', uranus: 'Rebelle', neptune: 'Poète Rêveur', pluto: 'Maître du Changement' },
  it: { sun: 'Eroe', moon: 'Guaritore', asc: 'Prima Impressione', mercury: 'Stratega', venus: 'Guida dell\'Amore', mars: 'Guerriero', jupiter: 'Portafortuna', saturn: 'Coach Severo', uranus: 'Ribelle', neptune: 'Poeta Sognatore', pluto: 'Maestro del Cambiamento' },
  pt: { sun: 'Herói', moon: 'Curador', asc: 'Primeira Impressão', mercury: 'Estrategista', venus: 'Guia do Amor', mars: 'Guerreiro', jupiter: 'Portador da Sorte', saturn: 'Treinador Rígido', uranus: 'Rebelde', neptune: 'Poeta Sonhador', pluto: 'Mestre da Mudança' },
  ko: { sun: '주인공', moon: '치유사', asc: '첫인상', mercury: '전략가', venus: '사랑의 안내자', mars: '전사', jupiter: '행운의 전령', saturn: '엄격한 코치', uranus: '반항아', neptune: '몽상 시인', pluto: '변화의 달인' },
}

/** 担当領域(言語別) */
const DOMAIN: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '基本性格・人生の目的', moon: '素顔の感情・安心のありか', asc: '第一印象・生まれ持った雰囲気', mercury: '考え方・言葉・学び方', venus: '恋愛の好み・美意識・楽しみ方', mars: 'やる気の出し方・戦い方', jupiter: '幸運の広がり方・チャンスの掴み方', saturn: '人生の課題・鍛えられる場所', uranus: '変革を起こす場所・個性の突破口', neptune: '夢見る力・イマジネーション', pluto: '人生を根底から変える力' },
  en: { sun: 'Core self & life purpose', moon: 'True feelings & where you feel safe', asc: 'First impression & natural aura', mercury: 'Thinking, words & learning', venus: 'Love, beauty & pleasure', mars: 'Drive & how you fight', jupiter: 'Luck & seizing chances', saturn: "Life's lessons & discipline", uranus: 'Change & your breakthrough', neptune: 'Dreams & imagination', pluto: 'Power to transform your life' },
  es: { sun: 'Esencia y propósito de vida', moon: 'Emociones verdaderas y dónde te sientes seguro', asc: 'Primera impresión y aura natural', mercury: 'Pensamiento, palabras y aprendizaje', venus: 'Amor, belleza y placer', mars: 'Empuje y cómo luchas', jupiter: 'Suerte y aprovechar oportunidades', saturn: 'Retos de la vida y disciplina', uranus: 'Cambio y tu ruptura', neptune: 'Sueños e imaginación', pluto: 'Poder de transformar tu vida' },
  fr: { sun: 'Personnalité et but de la vie', moon: 'Vraies émotions et là où tu te sens en sécurité', asc: 'Première impression et aura naturelle', mercury: 'Pensée, mots et apprentissage', venus: 'Amour, beauté et plaisir', mars: 'Énergie et façon de te battre', jupiter: 'Chance et saisir les occasions', saturn: 'Défis de la vie et discipline', uranus: 'Changement et ta percée', neptune: 'Rêves et imagination', pluto: 'Pouvoir de transformer ta vie' },
  it: { sun: 'Personalità e scopo di vita', moon: 'Emozioni vere e dove ti senti al sicuro', asc: 'Prima impressione e aura naturale', mercury: 'Pensiero, parole e apprendimento', venus: 'Amore, bellezza e piacere', mars: 'Grinta e come combatti', jupiter: 'Fortuna e cogliere le occasioni', saturn: 'Sfide della vita e disciplina', uranus: 'Cambiamento e la tua svolta', neptune: 'Sogni e immaginazione', pluto: 'Potere di trasformare la tua vita' },
  pt: { sun: 'Personalidade e propósito de vida', moon: 'Emoções verdadeiras e onde você se sente seguro', asc: 'Primeira impressão e aura natural', mercury: 'Pensamento, palavras e aprendizado', venus: 'Amor, beleza e prazer', mars: 'Energia e como você luta', jupiter: 'Sorte e aproveitar oportunidades', saturn: 'Desafios da vida e disciplina', uranus: 'Mudança e sua virada', neptune: 'Sonhos e imaginação', pluto: 'Poder de transformar sua vida' },
  ko: { sun: '기본 성격과 인생의 목적', moon: '진짜 감정과 안심할 수 있는 곳', asc: '첫인상과 타고난 분위기', mercury: '사고방식, 말, 배우는 법', venus: '사랑, 아름다움, 즐기는 법', mars: '의욕과 싸우는 방식', jupiter: '행운이 퍼지는 법과 기회를 잡는 법', saturn: '인생의 과제와 단련되는 곳', uranus: '변화와 개성의 돌파구', neptune: '꿈꾸는 힘과 상상력', pluto: '인생을 근본부터 바꾸는 힘' },
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
