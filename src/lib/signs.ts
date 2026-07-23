import { signIndex } from './astro'
import { getLang } from './i18n'
import type { Lang } from './i18n'
import { ELEMENT_LABEL } from './starData'

export type Element = '火' | '地' | '風' | '水'

/** 12星座のエレメント(言語非依存)。牡羊→魚の順 */
export const SIGN_ELEMENTS: Element[] = ['火', '地', '風', '水', '火', '地', '風', '水', '火', '地', '風', '水']

/** 星座記号(言語非依存) */
export const SIGN_SYMBOLS: string[] = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

/** 星座名(言語別) */
const SIGN_NAMES: Record<Lang, string[]> = {
  ja: ['牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座', '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  es: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
  fr: ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'],
  it: ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'],
  pt: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
  ko: ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', '천칭자리', '전갈자리', '궁수자리', '염소자리', '물병자리', '물고기자리'],
}

/** 星座キーワード(言語別・各3語) */
const SIGN_KEYWORDS: Record<Lang, string[][]> = {
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

/** エレメント名(言語別) */
/** エレメントの表示名(現在言語) */
export const elementLabel = (el: Element): string => (ELEMENT_LABEL[getLang()] ?? ELEMENT_LABEL.ja)[el]

/** 黄経からエレメントを得る(言語非依存) */
export const elementOf = (lon: number): Element => SIGN_ELEMENTS[signIndex(lon)]

/** 星座インデックスの名前(現在言語) */
export const signName = (i: number): string => SIGN_NAMES[getLang()][i] ?? SIGN_NAMES.ja[i]
export const signSymbol = (i: number): string => SIGN_SYMBOLS[i]
export const signKeywords = (i: number): string[] => SIGN_KEYWORDS[getLang()][i] ?? SIGN_KEYWORDS.ja[i]
