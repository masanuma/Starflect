import type { PlanetPos } from './types'
import { getPlanet } from './planets'
import { getLang } from './i18n'
import type { Lang } from './i18n'

type Quality = 'good' | 'hard' | 'conj'

interface AspectDef {
  angle: number
  orb: number
  quality: Quality
}

const ASPECTS: AspectDef[] = [
  { angle: 0, orb: 6, quality: 'conj' },
  { angle: 60, orb: 4, quality: 'good' },
  { angle: 90, orb: 6, quality: 'hard' },
  { angle: 120, orb: 6, quality: 'good' },
  { angle: 180, orb: 6, quality: 'hard' },
]

const ASPECT_NAME: Record<Lang, Record<number, string>> = {
  ja: { 0: '合(0°)', 60: 'セクスタイル(60°)', 90: 'スクエア(90°)', 120: 'トライン(120°)', 180: 'オポジション(180°)' },
  en: { 0: 'conjunction (0°)', 60: 'sextile (60°)', 90: 'square (90°)', 120: 'trine (120°)', 180: 'opposition (180°)' },
  es: { 0: 'conjunción (0°)', 60: 'sextil (60°)', 90: 'cuadratura (90°)', 120: 'trígono (120°)', 180: 'oposición (180°)' },
}

/** 関係のラベルと説明(キャラの言葉で)。emoji は言語非依存 */
const REL_EMOJI: Record<Quality, string> = { conj: '🫂', good: '🤝', hard: '⚔️' }

const REL_STYLE: Record<Lang, Record<Quality, { label: string; text: (a: string, b: string) => string }>> = {
  ja: {
    conj: {
      label: '一心同体',
      text: (a, b) => `${a}と${b}は合体していて、いつもセットで発動します。互いの持ち味を強め合う、あなたの必殺コンビです。`,
    },
    good: {
      label: '名コンビ',
      text: (a, b) => `${a}が動くと、${b}が自然と力を貸してくれる息の合った間柄。意識しなくても連携してくれます。`,
    },
    hard: {
      label: 'ライバル',
      text: (a, b) => `${a}と${b}はよくぶつかる2人。でもこのケンカこそが、あなたを成長させる原動力になります。`,
    },
  },
  en: {
    conj: {
      label: 'As One',
      text: (a, b) => `${a} and ${b} fuse and always fire together. A killer combo that amplifies each other’s strengths.`,
    },
    good: {
      label: 'Great Duo',
      text: (a, b) => `When ${a} moves, ${b} naturally lends a hand—an in-sync pair that cooperates without even trying.`,
    },
    hard: {
      label: 'Rivals',
      text: (a, b) => `${a} and ${b} often clash. But that very friction is what drives your growth.`,
    },
  },
  es: {
    conj: {
      label: 'Como uno solo',
      text: (a, b) => `${a} y ${b} se fusionan y siempre se activan juntos. Un dúo letal que potencia las fortalezas de cada uno.`,
    },
    good: {
      label: 'Gran dúo',
      text: (a, b) => `Cuando ${a} se mueve, ${b} le echa una mano con naturalidad: una pareja compenetrada que coopera sin esfuerzo.`,
    },
    hard: {
      label: 'Rivales',
      text: (a, b) => `${a} y ${b} chocan a menudo. Pero justo esa fricción es lo que impulsa tu crecimiento.`,
    },
  },
}

export interface NatalAspect {
  /** 役割ベースの見出し(例: 恋の案内人 × 革命児) */
  title: string
  emoji: string
  label: string
  quality: Quality
  text: string
  /** 専門情報(例: 金星 × 天王星 — オポジション(180°)) */
  tech: string
  exactness: number
}

function separation(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * 出生天体同士のアスペクトを検出する。
 * 世代天体同士(天王星×海王星など)は同世代に共通のため除外。
 */
export function findNatalAspects(planets: PlanetPos[], limit = 6): NatalAspect[] {
  const lang = getLang()
  const hits: NatalAspect[] = []

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = getPlanet(planets[i].key)
      const b = getPlanet(planets[j].key)
      if (a.generational && b.generational) continue

      const sep = separation(planets[i].lon, planets[j].lon)
      for (const asp of ASPECTS) {
        const off = Math.abs(sep - asp.angle)
        if (off > asp.orb) continue

        const style = REL_STYLE[lang][asp.quality]
        hits.push({
          title: `${a.role} × ${b.role}`,
          emoji: REL_EMOJI[asp.quality],
          label: style.label,
          quality: asp.quality,
          text: style.text(a.role, b.role),
          tech: `${a.name} × ${b.name} — ${ASPECT_NAME[lang][asp.angle]}`,
          exactness: off,
        })
      }
    }
  }

  hits.sort((x, y) => x.exactness - y.exactness)
  return hits.slice(0, limit)
}
