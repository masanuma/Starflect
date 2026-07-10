import type { PlanetPos } from './types'
import { PLANET_INFO } from './planets'

type Quality = 'good' | 'hard' | 'conj'

interface AspectDef {
  angle: number
  orb: number
  name: string
  quality: Quality
}

const ASPECTS: AspectDef[] = [
  { angle: 0, orb: 6, name: '合(0°)', quality: 'conj' },
  { angle: 60, orb: 4, name: 'セクスタイル(60°)', quality: 'good' },
  { angle: 90, orb: 6, name: 'スクエア(90°)', quality: 'hard' },
  { angle: 120, orb: 6, name: 'トライン(120°)', quality: 'good' },
  { angle: 180, orb: 6, name: 'オポジション(180°)', quality: 'hard' },
]

/** 関係のラベルと説明(キャラの言葉で) */
const REL_STYLE: Record<Quality, { emoji: string; label: string; text: (a: string, b: string) => string }> = {
  conj: {
    emoji: '🫂',
    label: '一心同体',
    text: (a, b) => `${a}と${b}は合体していて、いつもセットで発動します。互いの持ち味を強め合う、あなたの必殺コンビです。`,
  },
  good: {
    emoji: '🤝',
    label: '名コンビ',
    text: (a, b) => `${a}が動くと、${b}が自然と力を貸してくれる息の合った間柄。意識しなくても連携してくれます。`,
  },
  hard: {
    emoji: '⚔️',
    label: 'ライバル',
    text: (a, b) => `${a}と${b}はよくぶつかる2人。でもこのケンカこそが、あなたを成長させる原動力になります。`,
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
  const hits: NatalAspect[] = []

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = PLANET_INFO[planets[i].key]
      const b = PLANET_INFO[planets[j].key]
      if (a.generational && b.generational) continue

      const sep = separation(planets[i].lon, planets[j].lon)
      for (const asp of ASPECTS) {
        const off = Math.abs(sep - asp.angle)
        if (off > asp.orb) continue

        const style = REL_STYLE[asp.quality]
        hits.push({
          title: `${a.role} × ${b.role}`,
          emoji: style.emoji,
          label: style.label,
          quality: asp.quality,
          text: style.text(a.role, b.role),
          tech: `${a.name} × ${b.name} — ${asp.name}`,
          exactness: off,
        })
      }
    }
  }

  hits.sort((x, y) => x.exactness - y.exactness)
  return hits.slice(0, limit)
}
