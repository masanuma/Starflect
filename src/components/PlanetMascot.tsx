import type { ReactNode } from 'react'
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

/** 体の後ろに描く装飾(翼など) */
function backAccessory(key: PlanetKey): ReactNode {
  if (key === 'venus') {
    // 恋の案内人 — 天使の翼
    return (
      <g fill="#FFE3EE" stroke="#F4BBD1" strokeWidth="0.8">
        <path d="M15 25 q-11 -6 -13 3 q8 3 13 1 z" />
        <path d="M49 25 q11 -6 13 3 q-8 3 -13 1 z" />
      </g>
    )
  }
  return null
}

/** 役割を象徴する小物(体・顔の前に描く) */
function frontAccessory(key: PlanetKey): ReactNode {
  switch (key) {
    case 'sun': // 主人公 — 王冠
      return (
        <g>
          <path
            d="M19 17 l4.5 -11 l5 7.5 l3.5 -12 l3.5 12 l5 -7.5 l4.5 11 z"
            fill="#FFD873"
            stroke="#E0A835"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <circle cx="23.5" cy="7.5" r="1.4" fill="#FF9E5B" />
          <circle cx="40.5" cy="7.5" r="1.4" fill="#FF9E5B" />
          <circle cx="32" cy="4.5" r="1.6" fill="#FF7EA6" />
        </g>
      )
    case 'moon': // 癒し手 — 天使の輪 + ハート
      return (
        <g>
          <ellipse cx="32" cy="8" rx="10.5" ry="3.4" fill="none" stroke="#D2E2F6" strokeWidth="2.6" />
          <path
            d="M32 44 c-1.7 -3.2 -6.2 -2.6 -6.2 1.3 c0 2.4 3.1 3.9 6.2 6.1 c3.1 -2.2 6.2 -3.7 6.2 -6.1 c0 -3.9 -4.5 -4.5 -6.2 -1.3 z"
            fill="#FFAFCB"
            stroke="#EA83A8"
            strokeWidth="0.8"
          />
        </g>
      )
    case 'asc': // 見た目担当 — サングラス
      return (
        <g>
          <path d="M17 32.6 h30" stroke="#3a2f57" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="19" y="32" width="10.5" height="7.4" rx="3.4" fill="#3a2f57" />
          <rect x="34.5" y="32" width="10.5" height="7.4" rx="3.4" fill="#3a2f57" />
          <path d="M29.5 34.5 h5" stroke="#3a2f57" strokeWidth="2" />
          <path d="M21.5 34.4 h3" stroke="#8fa9d9" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          <path d="M37 34.4 h3" stroke="#8fa9d9" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
        </g>
      )
    case 'mercury': // 軍師 — 軍配
      return (
        <g transform="rotate(18 51 24)">
          <ellipse cx="51" cy="22" rx="6.2" ry="8.4" fill="#F5E8C8" stroke="#C9A24A" strokeWidth="1.2" />
          <path d="M51 14 v16 M45.3 19 l11.4 6 M45.3 25 l11.4 -6" stroke="#D8B871" strokeWidth="0.8" />
          <rect x="49.8" y="29" width="2.4" height="9" rx="1.2" fill="#9A6E44" />
          <circle cx="51" cy="39" r="1.6" fill="#E8574F" />
        </g>
      )
    case 'venus': // 恋の案内人 — ハート(翼は後ろ)
      return (
        <path
          d="M32 4 c-2 -3.6 -7 -3 -7 1.6 c0 2.8 3.5 4.4 7 7 c3.5 -2.6 7 -4.2 7 -7 c0 -4.6 -5 -5.2 -7 -1.6 z"
          fill="#FF9EC0"
          stroke="#E36F9C"
          strokeWidth="0.9"
        />
      )
    case 'mars': // 戦士 — 剣 + 盾
      return (
        <g>
          <g transform="rotate(20 52 24)">
            <rect x="50.5" y="6" width="3" height="24" rx="1.3" fill="#DCE2EC" stroke="#9AA6B8" strokeWidth="0.8" />
            <path d="M50.5 6 l1.5 -3.4 l1.5 3.4 z" fill="#DCE2EC" stroke="#9AA6B8" strokeWidth="0.7" />
            <rect x="46" y="29" width="12" height="3.2" rx="1.4" fill="#C99A4A" />
            <rect x="51" y="32" width="2" height="6" rx="1" fill="#8A5E38" />
          </g>
          <path
            d="M5 37.5 l6 -1.6 l6 1.6 l0 5.2 q-2.4 3.6 -6 4.6 q-3.6 -1 -6 -4.6 z"
            fill="#F0776F"
            stroke="#C9564E"
            strokeWidth="0.9"
          />
          <path d="M11 39 v6 M8 42 h6" stroke="#FFD6D1" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
        </g>
      )
    case 'jupiter': // 幸運の運び屋 — 四つ葉のクローバー
      return (
        <g>
          <g fill="#7FC46B" stroke="#5FA34E" strokeWidth="0.7">
            <circle cx="32" cy="7.5" r="3.6" />
            <circle cx="26.5" cy="11" r="3.6" />
            <circle cx="37.5" cy="11" r="3.6" />
            <circle cx="32" cy="14.5" r="3.6" />
          </g>
          <rect x="31.3" y="13.5" width="1.4" height="5" rx="0.7" fill="#5FA34E" />
        </g>
      )
    case 'saturn': // 鬼コーチ — ハチマキ + ホイッスル
      return (
        <g>
          <path d="M16.5 21 q15.5 -9.5 31 0" fill="none" stroke="#F0776F" strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="16.5" cy="21" r="1.9" fill="#F0776F" />
          <circle cx="14" cy="24" r="1.4" fill="#F0776F" />
          <rect x="49" y="41" width="6.6" height="4.6" rx="2.3" fill="#8D97BE" stroke="#5E6788" strokeWidth="0.8" />
          <rect x="52.4" y="38" width="3" height="3.6" rx="1" fill="#8D97BE" stroke="#5E6788" strokeWidth="0.8" />
          <circle cx="52" cy="43.3" r="1" fill="#5E6788" />
        </g>
      )
    case 'uranus': // 革命児 — 稲妻
      return (
        <g>
          <path
            d="M35 2 l-10 14 l6.5 0 l-5.5 12 l14 -17 l-6.5 0 l5.5 -9 z"
            fill="#FFE06B"
            stroke="#E8B93A"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="11" r="1.5" fill="#FFE06B" />
        </g>
      )
    case 'neptune': // 夢見る詩人 — 羽ペン + 音符
      return (
        <g>
          <g transform="rotate(24 52 22)">
            <path d="M52 6 q7 9 2.5 24 q-1.5 -3 -3 -5 q-1.5 -11 0.5 -19 z" fill="#B7CEF6" stroke="#88A8E2" strokeWidth="0.7" />
            <path d="M52.5 9 q3 8 1 19" stroke="#88A8E2" strokeWidth="0.6" fill="none" />
            <rect x="51.4" y="29" width="1.6" height="5.5" fill="#5E6788" />
          </g>
          <g fill="#7E88E0">
            <ellipse cx="19.5" cy="18.5" rx="2.7" ry="2.1" />
            <rect x="21.6" y="8" width="1.6" height="10.5" />
            <path d="M21.6 8 q4.4 1 4.4 4.2 q-2.2 -2.2 -4.4 -1.2 z" />
          </g>
        </g>
      )
    case 'pluto': // 変身の達人 — 蝶 + 仮面
      return (
        <g>
          <g fill="#C79BE0" stroke="#A06CB8" strokeWidth="0.7">
            <ellipse cx="27" cy="8.5" rx="5.2" ry="6.6" />
            <ellipse cx="37" cy="8.5" rx="5.2" ry="6.6" />
            <rect x="31.4" y="6" width="1.2" height="8" rx="0.6" fill="#8A5CA6" stroke="none" />
          </g>
          <path
            d="M19 33 q13 -4.5 26 0 q-2.4 6.5 -8.5 6.5 q-3.5 0 -4.5 -3 q-1 3 -4.5 3 q-6.1 0 -8.5 -6.5 z"
            fill="#5E4B86"
          />
          <ellipse cx="25.5" cy="35" rx="1.5" ry="1.9" fill="#241d38" />
          <ellipse cx="38.5" cy="35" rx="1.5" ry="1.9" fill="#241d38" />
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

/** 天体キャラのちびマスコット(役割を象徴する小物つき) */
export default function PlanetMascot({ planetKey, size = 60 }: Props) {
  const color = MASCOT_COLOR[planetKey] ?? '#C9B6E8'
  const line = shade(color, 0.66)
  const dark = shade(color, 0.82)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
      {backAccessory(planetKey)}
      {/* 足元の影 */}
      <ellipse cx="32" cy="57" rx="14" ry="3" fill="#000000" opacity="0.07" />
      {/* 手 */}
      <ellipse cx="13" cy="43" rx="4" ry="5.2" fill={color} stroke={line} strokeWidth="1.4" />
      <ellipse cx="51" cy="43" rx="4" ry="5.2" fill={color} stroke={line} strokeWidth="1.4" />
      {/* 体 */}
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
      {/* 役割の小物 */}
      {frontAccessory(planetKey)}
    </svg>
  )
}
