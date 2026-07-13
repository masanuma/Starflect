import type { PlanetKey } from '../lib/types'

/** 各天体キャラの体の色(役割・個性ベースのビビッドパステル) */
export const MASCOT_COLOR: Record<PlanetKey, string> = {
  sun: '#F5B63D',
  moon: '#9FC0EA',
  asc: '#C9B6E8',
  mercury: '#74C489',
  venus: '#F28CB1',
  mars: '#F0776F',
  jupiter: '#B58BE6',
  saturn: '#8D97BE',
  uranus: '#5FC8D6',
  neptune: '#7E88E0',
  pluto: '#A06CB8',
}

const EYE = '#41355e'

/** 16進カラーを暗くする(輪郭線・陰影用) */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/** 天体ごとの「持ち物」= キャラ性を出すアクセサリ */
function accessory(key: PlanetKey) {
  switch (key) {
    case 'sun': // 王冠
      return (
        <path
          d="M22 17 l3.5 -8 l4 6 l2.5 -9 l2.5 9 l4 -6 l3.5 8 z"
          fill="#FFD873"
          stroke="#E0A835"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      )
    case 'moon': // 三日月
      return (
        <g transform="translate(40 7)">
          <circle cx="0" cy="6" r="7" fill="#EAF1FB" />
          <circle cx="3" cy="4" r="6" fill="#F3EDFA" />
        </g>
      )
    case 'mercury': // 羽根(頭の両サイド)
      return (
        <g fill="#BFE8C6" stroke="#8FCF9C" strokeWidth="0.6">
          <path d="M13 20 q-8 -2 -10 3 q6 2 10 0 z" />
          <path d="M51 20 q8 -2 10 3 q-6 2 -10 0 z" />
        </g>
      )
    case 'venus': // ハート
      return (
        <path
          d="M32 9 c-2 -4 -8 -3 -8 2 c0 3 4 5 8 8 c4 -3 8 -5 8 -8 c0 -5 -6 -6 -8 -2 z"
          fill="#FF9EC0"
          stroke="#E36F9C"
          strokeWidth="0.9"
        />
      )
    case 'mars': // 炎
      return (
        <path
          d="M32 5 c4 4 6 7 6 11 a6 6 0 0 1 -12 0 c0 -3 2 -5 3 -7 c1 3 2 3 3 3 c-1 -3 -1 -5 0 -7 z"
          fill="#FF8A5B"
          stroke="#EA5F3A"
          strokeWidth="0.9"
        />
      )
    case 'jupiter': // きらめき(4方向星)
      return (
        <path
          d="M32 5 l2.4 6.4 l6.4 2.4 l-6.4 2.4 l-2.4 6.4 l-2.4 -6.4 l-6.4 -2.4 l6.4 -2.4 z"
          fill="#F5D06B"
          stroke="#E0B341"
          strokeWidth="0.6"
        />
      )
    case 'saturn': // 環
      return (
        <ellipse
          cx="32"
          cy="37"
          rx="28"
          ry="8.5"
          fill="none"
          stroke="#C6B6E6"
          strokeWidth="3"
          transform="rotate(-16 32 37)"
        />
      )
    case 'uranus': // 稲妻
      return (
        <path d="M34 5 l-8 12 l5 0 l-4 10 l11 -14 l-5 0 l4 -8 z" fill="#FFE06B" stroke="#E8B93A" strokeWidth="0.7" />
      )
    case 'neptune': // しずく
      return (
        <path d="M32 5 c4 6 6 8 6 11 a6 6 0 0 1 -12 0 c0 -3 2 -5 6 -11 z" fill="#A9C6F5" stroke="#7CA0E0" strokeWidth="0.9" />
      )
    case 'pluto': // 蝶
      return (
        <g fill="#C79BE0" stroke="#A06CB8" strokeWidth="0.7">
          <ellipse cx="27" cy="11" rx="5" ry="6.2" />
          <ellipse cx="37" cy="11" rx="5" ry="6.2" />
        </g>
      )
    default:
      return null
  }
}

interface Props {
  planetKey: PlanetKey
  size?: number
}

/** 天体キャラのちびマスコット(SVG・イラスト強化版) */
export default function PlanetMascot({ planetKey, size = 60 }: Props) {
  const color = MASCOT_COLOR[planetKey] ?? '#C9B6E8'
  const line = shade(color, 0.66)
  const dark = shade(color, 0.82)
  const isSaturn = planetKey === 'saturn'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
      {isSaturn && accessory(planetKey)}
      {/* 足元の影 */}
      <ellipse cx="32" cy="57" rx="14" ry="3" fill="#000000" opacity="0.07" />
      {/* 手 */}
      <ellipse cx="13" cy="43" rx="4" ry="5.2" fill={color} stroke={line} strokeWidth="1.4" />
      <ellipse cx="51" cy="43" rx="4" ry="5.2" fill={color} stroke={line} strokeWidth="1.4" />
      {/* 体(輪郭線つき) */}
      <path
        d="M32 16 C45 16 52 26 52 37 C52 50 43 56 32 56 C21 56 12 50 12 37 C12 26 19 16 32 16 Z"
        fill={color}
        stroke={line}
        strokeWidth="1.6"
      />
      {/* 下側の陰影 */}
      <path
        d="M14 42 C18 52 26 55 32 55 C38 55 46 52 50 42 C46 49 39 51 32 51 C25 51 18 49 14 42 Z"
        fill={dark}
        opacity="0.55"
      />
      {/* 上のハイライト */}
      <ellipse cx="25" cy="27" rx="9" ry="6" fill="#ffffff" opacity="0.35" />
      {/* ほっぺ */}
      <ellipse cx="21" cy="40" rx="3.2" ry="2" fill="#FF8FB8" opacity="0.45" />
      <ellipse cx="43" cy="40" rx="3.2" ry="2" fill="#FF8FB8" opacity="0.45" />
      {/* 目 */}
      <ellipse cx="25.5" cy="35" rx="3.1" ry="3.9" fill={EYE} />
      <ellipse cx="38.5" cy="35" rx="3.1" ry="3.9" fill={EYE} />
      <circle cx="26.7" cy="33.5" r="1.2" fill="#ffffff" />
      <circle cx="39.7" cy="33.5" r="1.2" fill="#ffffff" />
      <circle cx="24.6" cy="36.4" r="0.7" fill="#ffffff" opacity="0.8" />
      <circle cx="37.6" cy="36.4" r="0.7" fill="#ffffff" opacity="0.8" />
      {/* 口 */}
      <path d="M28 41 q4 4 8 0" stroke={EYE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* きらめき */}
      <path d="M50 22 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" fill="#ffffff" opacity="0.9" />
      {/* アクセサリ(環以外は体の前) */}
      {!isSaturn && accessory(planetKey)}
    </svg>
  )
}
