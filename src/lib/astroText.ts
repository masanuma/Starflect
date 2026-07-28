/**
 * 天体・星座の「表示用テキスト」だけを集めた、astronomy-engine に依存しないモジュール。
 *
 * planets.ts / signs.ts は astronomy-engine を読み込むため、サーバー(LP・静的ページ)から
 * import すると Railway の Node 18 で起動クラッシュする。表示に使う名前・記号・キーワードは
 * ここに置き、クライアントもサーバーもこのモジュールを参照する。
 * (starData.ts と同じ役割分担)
 */
import type { Lang } from './i18n'
import type { PlanetKey } from './types'
import type { Element } from './starData'

/** 説明ページなどで並べるときの天体の順番(太陽・月・上昇を先頭に) */
export const PLANET_ORDER: PlanetKey[] = [
  'sun', 'moon', 'asc', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
]

/** 天体の記号(言語非依存) */
export const PLANET_SYMBOL: Record<PlanetKey, string> = {
  sun: '☉', moon: '☽', asc: 'ASC', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
}

/** 12星座のエレメント(言語非依存)。牡羊→魚の順 */
export const SIGN_ELEMENTS: Element[] = ['火', '地', '風', '水', '火', '地', '風', '水', '火', '地', '風', '水']

/** 星座記号(言語非依存) */
export const SIGN_SYMBOLS: string[] = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

/** 天体名(言語別) */
export const PLANET_NAME: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '太陽', moon: '月', asc: '上昇星座', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' },
  en: { sun: 'Sun', moon: 'Moon', asc: 'Rising', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' },
  es: { sun: 'Sol', moon: 'Luna', asc: 'Ascendente', mercury: 'Mercurio', venus: 'Venus', mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Neptuno', pluto: 'Plutón' },
  fr: { sun: 'Soleil', moon: 'Lune', asc: 'Ascendant', mercury: 'Mercure', venus: 'Vénus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturne', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluton' },
  it: { sun: 'Sole', moon: 'Luna', asc: 'Ascendente', mercury: 'Mercurio', venus: 'Venere', mars: 'Marte', jupiter: 'Giove', saturn: 'Saturno', uranus: 'Urano', neptune: 'Nettuno', pluto: 'Plutone' },
  pt: { sun: 'Sol', moon: 'Lua', asc: 'Ascendente', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão' },
  ko: { sun: '태양', moon: '달', asc: '상승궁', mercury: '수성', venus: '금성', mars: '화성', jupiter: '목성', saturn: '토성', uranus: '천왕성', neptune: '해왕성', pluto: '명왕성' },
}

/** 天体の役割名(言語別) */
export const PLANET_ROLE: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '主人公', moon: '癒し手', asc: '見た目担当', mercury: '軍師', venus: '恋の案内人', mars: '戦士', jupiter: '幸運の運び屋', saturn: '鬼コーチ', uranus: '革命児', neptune: '夢見る詩人', pluto: '変身の達人' },
  en: { sun: 'Hero', moon: 'Healer', asc: 'First Impression', mercury: 'Strategist', venus: 'Love Guide', mars: 'Warrior', jupiter: 'Luck Bringer', saturn: 'Strict Coach', uranus: 'Rebel', neptune: 'Dreamer Poet', pluto: 'Master of Change' },
  es: { sun: 'Protagonista', moon: 'Sanador', asc: 'Imagen', mercury: 'Estratega', venus: 'Guía del Amor', mars: 'Guerrero', jupiter: 'Portador de Suerte', saturn: 'Entrenador Exigente', uranus: 'Rebelde', neptune: 'Poeta Soñador', pluto: 'Maestro del Cambio' },
  fr: { sun: 'Héros', moon: 'Guérisseur', asc: 'Première Impression', mercury: 'Stratège', venus: 'Guide de l\'Amour', mars: 'Guerrier', jupiter: 'Porte-Bonheur', saturn: 'Coach Sévère', uranus: 'Rebelle', neptune: 'Poète Rêveur', pluto: 'Maître du Changement' },
  it: { sun: 'Eroe', moon: 'Guaritore', asc: 'Prima Impressione', mercury: 'Stratega', venus: 'Guida dell\'Amore', mars: 'Guerriero', jupiter: 'Portafortuna', saturn: 'Coach Severo', uranus: 'Ribelle', neptune: 'Poeta Sognatore', pluto: 'Maestro del Cambiamento' },
  pt: { sun: 'Herói', moon: 'Curador', asc: 'Primeira Impressão', mercury: 'Estrategista', venus: 'Guia do Amor', mars: 'Guerreiro', jupiter: 'Portador da Sorte', saturn: 'Treinador Rígido', uranus: 'Rebelde', neptune: 'Poeta Sonhador', pluto: 'Mestre da Mudança' },
  ko: { sun: '주인공', moon: '치유사', asc: '첫인상', mercury: '전략가', venus: '사랑의 안내자', mars: '전사', jupiter: '행운의 전령', saturn: '엄격한 코치', uranus: '반항아', neptune: '몽상 시인', pluto: '변화의 달인' },
}

/** 天体の担当領域(言語別) */
export const PLANET_DOMAIN: Record<Lang, Record<PlanetKey, string>> = {
  ja: { sun: '基本性格・人生の目的', moon: '素顔の感情・安心のありか', asc: '第一印象・生まれ持った雰囲気', mercury: '考え方・言葉・学び方', venus: '恋愛の好み・美意識・楽しみ方', mars: 'やる気の出し方・戦い方', jupiter: '幸運の広がり方・チャンスの掴み方', saturn: '人生の課題・鍛えられる場所', uranus: '変革を起こす場所・個性の突破口', neptune: '夢見る力・イマジネーション', pluto: '人生を根底から変える力' },
  en: { sun: 'Core self & life purpose', moon: 'True feelings & where you feel safe', asc: 'First impression & natural aura', mercury: 'Thinking, words & learning', venus: 'Love, beauty & pleasure', mars: 'Drive & how you fight', jupiter: 'Luck & seizing chances', saturn: "Life's lessons & discipline", uranus: 'Change & your breakthrough', neptune: 'Dreams & imagination', pluto: 'Power to transform your life' },
  es: { sun: 'Esencia y propósito de vida', moon: 'Emociones verdaderas y dónde te sientes seguro', asc: 'Primera impresión y aura natural', mercury: 'Pensamiento, palabras y aprendizaje', venus: 'Amor, belleza y placer', mars: 'Empuje y cómo luchas', jupiter: 'Suerte y aprovechar oportunidades', saturn: 'Retos de la vida y disciplina', uranus: 'Cambio y tu ruptura', neptune: 'Sueños e imaginación', pluto: 'Poder de transformar tu vida' },
  fr: { sun: 'Personnalité et but de la vie', moon: 'Vraies émotions et là où tu te sens en sécurité', asc: 'Première impression et aura naturelle', mercury: 'Pensée, mots et apprentissage', venus: 'Amour, beauté et plaisir', mars: 'Énergie et façon de te battre', jupiter: 'Chance et saisir les occasions', saturn: 'Défis de la vie et discipline', uranus: 'Changement et ta percée', neptune: 'Rêves et imagination', pluto: 'Pouvoir de transformer ta vie' },
  it: { sun: 'Personalità e scopo di vita', moon: 'Emozioni vere e dove ti senti al sicuro', asc: 'Prima impressione e aura naturale', mercury: 'Pensiero, parole e apprendimento', venus: 'Amore, bellezza e piacere', mars: 'Grinta e come combatti', jupiter: 'Fortuna e cogliere le occasioni', saturn: 'Sfide della vita e disciplina', uranus: 'Cambiamento e la tua svolta', neptune: 'Sogni e immaginazione', pluto: 'Potere di trasformare la tua vita' },
  pt: { sun: 'Personalidade e propósito de vida', moon: 'Emoções verdadeiras e onde você se sente seguro', asc: 'Primeira impressão e aura natural', mercury: 'Pensamento, palavras e aprendizado', venus: 'Amor, beleza e prazer', mars: 'Energia e como você luta', jupiter: 'Sorte e aproveitar oportunidades', saturn: 'Desafios da vida e disciplina', uranus: 'Mudança e sua virada', neptune: 'Sonhos e imaginação', pluto: 'Poder de transformar sua vida' },
  ko: { sun: '기본 성격과 인생의 목적', moon: '진짜 감정과 안심할 수 있는 곳', asc: '첫인상과 타고난 분위기', mercury: '사고방식, 말, 배우는 법', venus: '사랑, 아름다움, 즐기는 법', mars: '의욕과 싸우는 방식', jupiter: '행운이 퍼지는 법과 기회를 잡는 법', saturn: '인생의 과제와 단련되는 곳', uranus: '변화와 개성의 돌파구', neptune: '꿈꾸는 힘과 상상력', pluto: '인생을 근본부터 바꾸는 힘' },
}

/** 星座名(言語別) */
export const SIGN_NAMES: Record<Lang, string[]> = {
  // 「蠍」「牡羊」などは読めない人が一定数いるため、日本語はひらがな表記で統一する
  ja: ['おひつじ座', 'おうし座', 'ふたご座', 'かに座', 'しし座', 'おとめ座', 'てんびん座', 'さそり座', 'いて座', 'やぎ座', 'みずがめ座', 'うお座'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  es: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
  fr: ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'],
  it: ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'],
  pt: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
  ko: ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', '천칭자리', '전갈자리', '궁수자리', '염소자리', '물병자리', '물고기자리'],
}

/** 星座キーワード(言語別・各3語) */
export const SIGN_KEYWORDS: Record<Lang, string[][]> = {
  ja: [
    ['情熱', '行動力', '開拓者'],
    ['安定', '審美眼', '粘り強さ'],
    ['好奇心', '言葉', '軽やかさ'],
    ['共感力', '家族', '守る力'],
    ['存在感', '創造性', '誇り'],
    ['分析力', '誠実', '気配り'],
    ['調和', '社交性', '美意識'],
    ['洞察力', '集中', '深い絆'],
    ['自由', '冒険', '楽観'],
    ['責任感', '達成', '忍耐'],
    ['独創性', '博愛', '自由'],
    ['想像力', '共感', '癒やし'],
  ],
  en: [
    ['Passion', 'Drive', 'Pioneer'],
    ['Stability', 'Aesthetics', 'Persistence'],
    ['Curiosity', 'Words', 'Lightness'],
    ['Empathy', 'Family', 'Protection'],
    ['Presence', 'Creativity', 'Pride'],
    ['Analysis', 'Sincerity', 'Care'],
    ['Harmony', 'Sociability', 'Beauty'],
    ['Insight', 'Focus', 'Deep bonds'],
    ['Freedom', 'Adventure', 'Optimism'],
    ['Responsibility', 'Achievement', 'Patience'],
    ['Originality', 'Compassion', 'Freedom'],
    ['Imagination', 'Empathy', 'Healing'],
  ],
  es: [
    ['Pasión', 'Impulso', 'Pionero'],
    ['Estabilidad', 'Estética', 'Constancia'],
    ['Curiosidad', 'Palabras', 'Ligereza'],
    ['Empatía', 'Familia', 'Protección'],
    ['Presencia', 'Creatividad', 'Orgullo'],
    ['Análisis', 'Sinceridad', 'Cuidado'],
    ['Armonía', 'Sociabilidad', 'Belleza'],
    ['Perspicacia', 'Concentración', 'Vínculos'],
    ['Libertad', 'Aventura', 'Optimismo'],
    ['Responsabilidad', 'Logro', 'Paciencia'],
    ['Originalidad', 'Altruismo', 'Libertad'],
    ['Imaginación', 'Empatía', 'Sanación'],
  ],
  fr: [
    ['Passion', 'Élan', 'Pionnier'],
    ['Stabilité', 'Esthétique', 'Persévérance'],
    ['Curiosité', 'Mots', 'Légèreté'],
    ['Empathie', 'Famille', 'Protection'],
    ['Présence', 'Créativité', 'Fierté'],
    ['Analyse', 'Sincérité', 'Attention'],
    ['Harmonie', 'Sociabilité', 'Beauté'],
    ['Perspicacité', 'Concentration', 'Liens profonds'],
    ['Liberté', 'Aventure', 'Optimisme'],
    ['Responsabilité', 'Réussite', 'Patience'],
    ['Originalité', 'Altruisme', 'Liberté'],
    ['Imagination', 'Empathie', 'Guérison'],
  ],
  it: [
    ['Passione', 'Slancio', 'Pioniere'],
    ['Stabilità', 'Estetica', 'Perseveranza'],
    ['Curiosità', 'Parole', 'Leggerezza'],
    ['Empatia', 'Famiglia', 'Protezione'],
    ['Presenza', 'Creatività', 'Orgoglio'],
    ['Analisi', 'Sincerità', 'Cura'],
    ['Armonia', 'Socievolezza', 'Bellezza'],
    ['Intuito', 'Concentrazione', 'Legami profondi'],
    ['Libertà', 'Avventura', 'Ottimismo'],
    ['Responsabilità', 'Realizzazione', 'Pazienza'],
    ['Originalità', 'Altruismo', 'Libertà'],
    ['Immaginazione', 'Empatia', 'Guarigione'],
  ],
  pt: [
    ['Paixão', 'Impulso', 'Pioneiro'],
    ['Estabilidade', 'Estética', 'Persistência'],
    ['Curiosidade', 'Palavras', 'Leveza'],
    ['Empatia', 'Família', 'Proteção'],
    ['Presença', 'Criatividade', 'Orgulho'],
    ['Análise', 'Sinceridade', 'Cuidado'],
    ['Harmonia', 'Sociabilidade', 'Beleza'],
    ['Perspicácia', 'Concentração', 'Vínculos profundos'],
    ['Liberdade', 'Aventura', 'Otimismo'],
    ['Responsabilidade', 'Realização', 'Paciência'],
    ['Originalidade', 'Compaixão', 'Liberdade'],
    ['Imaginação', 'Empatia', 'Cura'],
  ],
  ko: [
    ['열정', '추진력', '개척자'],
    ['안정', '심미안', '끈기'],
    ['호기심', '언어', '경쾌함'],
    ['공감', '가족', '보호'],
    ['존재감', '창의성', '자부심'],
    ['분석력', '성실', '배려'],
    ['조화', '사교성', '미의식'],
    ['통찰', '집중', '깊은 유대'],
    ['자유', '모험', '낙관'],
    ['책임감', '성취', '인내'],
    ['독창성', '박애', '자유'],
    ['상상력', '공감', '치유'],
  ],
}
