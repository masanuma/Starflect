import { useId } from 'react'
import type { ReactNode } from 'react'
import type { Element } from '../lib/signs'

type Key = `${Element}${Element}`

/** 4方向のきらめき星 */
function spark(x: number, y: number, r: number, c: string, key?: string): ReactNode {
  const a = r * 0.34
  const d = `M${x} ${y - r} L${x + a} ${y - a} L${x + r} ${y} L${x + a} ${y + a} L${x} ${y + r} L${x - a} ${y + a} L${x - r} ${y} L${x - a} ${y - a} Z`
  return <path key={key} d={d} fill={c} />
}

/** キャラごとのポップイラスト(顔なし・象徴を描く)。id はグラデ用の一意プレフィックス */
function scene(key: Key, id: string): ReactNode {
  const g = (s: string) => `${id}${s}`
  switch (key) {
    case '火火': // 疾走する彗星
      return (
        <>
          <defs>
            <radialGradient id={g('h')} cx="38%" cy="34%" r="70%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="45%" stopColor="#FFC65E" />
              <stop offset="100%" stopColor="#FF7EA6" />
            </radialGradient>
          </defs>
          <g stroke="#8FD9E6" strokeWidth="2.4" strokeLinecap="round" opacity="0.8">
            <path d="M50 12 L58 8" />
            <path d="M53 19 L61 16" />
          </g>
          <path d="M37 34 C25 39 15 47 6 56 C20 50 32 44 42 37 Z" fill="#FF8FB4" opacity="0.9" />
          <path d="M39 31 C30 35 20 41 12 50 C24 45 35 40 43 34 Z" fill="#FFB25C" opacity="0.9" />
          <path d="M41 28 C34 31 26 36 20 43 C30 38 38 34 44 30 Z" fill="#FFD96B" opacity="0.95" />
          <circle cx="44" cy="24" r="12" fill={`url(#${g('h')})`} stroke="#EE6E97" strokeWidth="1.5" />
          <ellipse cx="39" cy="19" rx="4.2" ry="3" fill="#ffffff" opacity="0.55" />
          {spark(58, 30, 4, '#FFD96B')}
          {spark(28, 14, 2.6, '#FF8FB4')}
        </>
      )
    case '火地': // 大地に立つ炎
      return (
        <>
          <defs>
            <linearGradient id={g('f')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE24A" />
              <stop offset="55%" stopColor="#FF8A2E" />
              <stop offset="100%" stopColor="#F0482E" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="52" rx="20" ry="6" fill="#B98A4E" />
          <path d="M14 50 h36 l-4 6 h-28 z" fill="#9A6E38" />
          <path
            d="M32 8 C40 20 44 26 44 36 A12 12 0 0 1 20 36 C20 30 24 26 27 21 C29 29 32 29 33 28 C31 21 30 15 32 8 Z"
            fill={`url(#${g('f')})`}
          />
          <path d="M32 24 C36 30 37 33 37 37 A5 5 0 0 1 27 37 C27 33 30 30 32 24 Z" fill="#FFE884" opacity="0.9" />
          {spark(48, 16, 3, '#FFCF4D')}
        </>
      )
    case '火風': // 舞い上がる花火
      return (
        <>
          <g stroke="#FF7AB0" strokeWidth="2" strokeLinecap="round" opacity="0.9">
            <path d="M32 26 V8 M32 26 L46 12 M32 26 L18 12 M32 26 L50 26 M32 26 L14 26 M32 26 L44 40 M32 26 L20 40" />
          </g>
          <g>
            <circle cx="32" cy="7" r="2" fill="#FFCF4D" />
            <circle cx="47" cy="11" r="1.9" fill="#7FC8E8" />
            <circle cx="17" cy="11" r="1.9" fill="#B58BE6" />
            <circle cx="51" cy="26" r="1.9" fill="#8FD6A0" />
            <circle cx="13" cy="26" r="1.9" fill="#FFCF4D" />
            <circle cx="45" cy="41" r="1.8" fill="#F5A0C6" />
            <circle cx="19" cy="41" r="1.8" fill="#7FC8E8" />
          </g>
          <circle cx="32" cy="26" r="3" fill="#FFF0B8" />
          <path d="M31 50 q1 -6 1 -14" stroke="#F5C24A" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
          {spark(52, 48, 2.4, '#FF8FB4')}
        </>
      )
    case '火水': // 内に海を抱く炎
      return (
        <>
          <defs>
            <linearGradient id={g('f')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF9B57" />
              <stop offset="100%" stopColor="#F0533A" />
            </linearGradient>
          </defs>
          <path
            d="M32 6 C42 20 47 27 47 38 A15 15 0 0 1 17 38 C17 30 22 25 26 18 C28 28 32 28 33 27 C31 19 30 13 32 6 Z"
            fill={`url(#${g('f')})`}
          />
          <path d="M22 38 q5 -5 10 0 t10 0 a10 10 0 0 1 -20 0 z" fill="#5FB3E8" />
          <path d="M22 39 q5 -4.5 10 0 t10 0" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          {spark(46, 14, 3, '#FFE29A')}
        </>
      )
    case '地火': // 静かな火山
      return (
        <>
          <g stroke="#B8B0C0" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.75">
            <path d="M30 12 q-4 -3 0 -6" />
            <path d="M36 10 q4 -3 0 -7" />
          </g>
          <path d="M12 52 L26 20 h12 L52 52 Z" fill="#8A7F94" />
          <path d="M26 20 h12 L44 34 q-12 5 -24 0 Z" fill="#75697F" opacity="0.6" />
          <ellipse cx="32" cy="20" rx="7" ry="2.4" fill="#FF7A3C" />
          <ellipse cx="32" cy="20" rx="3.4" ry="1.2" fill="#FFD34D" />
          <path d="M26 24 q6 3 12 0" stroke="#FF8A4B" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
          {spark(50, 16, 2.6, '#FFCF4D')}
        </>
      )
    case '地地': // 揺るがない山
      return (
        <>
          <path d="M4 54 L24 20 L38 40 L46 30 L60 54 Z" fill="#7E93A8" />
          <path d="M24 20 L31 32 q-7 3 -13 0 Z" fill="#ffffff" opacity="0.92" />
          <path d="M46 30 L50 36 q-5 2 -9 0 Z" fill="#ffffff" opacity="0.92" />
          <path d="M4 54 L24 20 L28 26 L14 54 Z" fill="#8FA3B6" opacity="0.5" />
          {spark(50, 14, 3.4, '#FFD96B')}
          {spark(14, 20, 2, '#BFD0E0')}
        </>
      )
    case '地風': // 風を聴く大樹
      return (
        <>
          <rect x="29.5" y="34" width="5" height="20" rx="2" fill="#9A6E44" />
          <circle cx="32" cy="26" r="15" fill="#8FC46B" />
          <circle cx="22" cy="30" r="8" fill="#7FB85E" />
          <circle cx="42" cy="30" r="8" fill="#7FB85E" />
          <circle cx="32" cy="20" r="8" fill="#A6D584" />
          <g stroke="#7FD0DE" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M48 18 q6 -2 9 2" />
            <path d="M50 24 q5 -1 8 2" />
          </g>
          <path d="M50 34 q3 3 0 6 q-3 -1 -2 -4" fill="#8FC46B" />
          {spark(14, 16, 2.6, '#FFE29A')}
        </>
      )
    case '地水': // 泉を隠す森
      return (
        <>
          <ellipse cx="32" cy="50" rx="15" ry="5" fill="#7FC0E8" />
          <ellipse cx="32" cy="49" rx="9" ry="2.6" fill="#B8E2F5" opacity="0.8" />
          <path d="M20 44 L14 30 L26 30 Z" fill="#6FA84E" />
          <path d="M20 36 L15 24 L25 24 Z" fill="#8CC46B" />
          <rect x="18.5" y="42" width="3" height="6" fill="#8A5E38" />
          <path d="M44 44 L38 28 L50 28 Z" fill="#6FA84E" />
          <path d="M44 36 L39 22 L49 22 Z" fill="#8CC46B" />
          <rect x="42.5" y="42" width="3" height="6" fill="#8A5E38" />
          <path d="M32 32 c2 3 3 4 3 6 a3 3 0 0 1 -6 0 c0 -2 1 -3 3 -6 z" fill="#5FB0E0" />
          {spark(31, 20, 2.4, '#CDEBFA')}
        </>
      )
    case '風火': // 熱を運ぶ風
      return (
        <>
          <g fill="none" stroke="#7FD0DE" strokeWidth="3" strokeLinecap="round">
            <path d="M8 24 h26 a5 5 0 1 0 -5 -5" />
            <path d="M10 34 h30 a5 5 0 1 1 -5 5" opacity="0.85" />
            <path d="M8 44 h18 a4 4 0 1 0 -4 -4" opacity="0.7" />
          </g>
          <g>
            <circle cx="46" cy="20" r="2.4" fill="#FF8A3C" />
            <circle cx="52" cy="34" r="2" fill="#FFB25C" />
            <circle cx="40" cy="46" r="1.8" fill="#FF7A5B" />
          </g>
          {spark(56, 12, 2.6, '#FFCF4D')}
        </>
      )
    case '風地': // 羅針盤を持つ旅人
      return (
        <>
          <circle cx="32" cy="32" r="20" fill="#F3E6C6" stroke="#D6A94A" strokeWidth="3" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#B8862F" strokeWidth="1" opacity="0.5" />
          <g stroke="#B08535" strokeWidth="1.4" strokeLinecap="round">
            <path d="M32 14 v3 M32 47 v3 M14 32 h3 M47 32 h3" />
          </g>
          <path d="M32 16 L37 32 L32 30 Z" fill="#E8574F" />
          <path d="M32 48 L27 32 L32 34 Z" fill="#5E6E86" />
          <circle cx="32" cy="32" r="2.4" fill="#3a2f57" />
          {spark(53, 14, 2.6, '#FFD96B')}
        </>
      )
    case '風風': // 自由な渡り鳥
      return (
        <>
          <defs>
            <linearGradient id={g('w')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8AD6EA" />
              <stop offset="100%" stopColor="#6FA6E8" />
            </linearGradient>
          </defs>
          <path d="M32 30 q-14 -12 -26 -6 q10 2 12 8 q-8 0 -12 6 q14 4 26 -2 Z" fill={`url(#${g('w')})`} />
          <path d="M32 30 q14 -12 26 -6 q-10 2 -12 8 q8 0 12 6 q-14 4 -26 -2 Z" fill={`url(#${g('w')})`} />
          <ellipse cx="32" cy="31" rx="5" ry="7" fill="#5E8FD8" />
          <circle cx="32" cy="25" r="3.4" fill="#6FA6E8" />
          {spark(52, 46, 2.6, '#BFE6F2')}
          {spark(14, 46, 2, '#BFE6F2')}
        </>
      )
    case '風水': // 月夜のそよ風
      return (
        <>
          <path d="M40 12 a16 16 0 1 0 6 24 a13 13 0 1 1 -6 -24 Z" fill="#F6E7A8" stroke="#E3CB6B" strokeWidth="1.2" />
          <g fill="none" stroke="#7FC8E0" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
            <path d="M8 44 h20 a4 4 0 1 0 -4 -4" />
            <path d="M12 52 h14 a3.4 3.4 0 1 1 -3 3" opacity="0.8" />
          </g>
          {spark(18, 16, 3, '#FFF0B8')}
          {spark(50, 50, 2, '#CDEBFA')}
        </>
      )
    case '水火': // 海底の火山
      return (
        <>
          <path d="M12 54 L26 24 h12 L52 54 Z" fill="#3C5A86" />
          <path d="M26 24 h12 L44 36 q-12 5 -24 0 Z" fill="#2E4870" opacity="0.7" />
          <ellipse cx="32" cy="24" rx="6.5" ry="2.2" fill="#FF7A3C" />
          <ellipse cx="32" cy="24" rx="3" ry="1" fill="#FFD34D" />
          <path d="M28 28 q4 4 8 0" stroke="#FF8A4B" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
          <g fill="#CDEBFA" opacity="0.9">
            <circle cx="46" cy="20" r="2.4" />
            <circle cx="50" cy="30" r="1.6" />
            <circle cx="43" cy="12" r="1.5" />
          </g>
          {spark(15, 18, 2.4, '#BFD8F0')}
        </>
      )
    case '水地': // 静かな入り江
      return (
        <>
          <circle cx="32" cy="15" r="5" fill="none" stroke="#5E7391" strokeWidth="3" />
          <path d="M32 18 V46" stroke="#5E7391" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M18 40 a14 14 0 0 0 28 0" fill="none" stroke="#5E7391" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M14 40 h8 M42 40 h8" stroke="#5E7391" strokeWidth="3.4" strokeLinecap="round" />
          <rect x="26" y="22" width="12" height="3.4" rx="1.7" fill="#5E7391" />
          <g stroke="#7FB6D8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M8 54 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0" />
          </g>
          {spark(52, 14, 2.6, '#CDEBFA')}
        </>
      )
    case '水風': // 風をうつす水面
      return (
        <>
          <g fill="none" stroke="#6FA6D8" strokeLinecap="round">
            <ellipse cx="32" cy="42" rx="24" ry="6" strokeWidth="2.4" />
            <ellipse cx="32" cy="42" rx="15" ry="3.6" strokeWidth="2" opacity="0.75" />
            <ellipse cx="32" cy="42" rx="7" ry="1.8" strokeWidth="1.6" opacity="0.55" />
          </g>
          <g fill="none" stroke="#9FD6E6" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
            <path d="M12 20 h22 a4 4 0 1 0 -4 -4" />
            <path d="M16 28 h16 a3.4 3.4 0 1 1 -3 3" opacity="0.8" />
          </g>
          {spark(50, 16, 2.6, '#CDEBFA')}
        </>
      )
    case '水水': // 深海の月
      return (
        <>
          <defs>
            <radialGradient id={g('m')} cx="40%" cy="36%" r="70%">
              <stop offset="0%" stopColor="#FBF6E0" />
              <stop offset="100%" stopColor="#C9D6EA" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="30" r="17" fill={`url(#${g('m')})`} />
          <g fill="#B6C6DE" opacity="0.7">
            <circle cx="26" cy="24" r="3" />
            <circle cx="38" cy="34" r="2.4" />
            <circle cx="30" cy="37" r="1.8" />
          </g>
          <g fill="#CDEBFA" opacity="0.85">
            <circle cx="48" cy="18" r="2.6" />
            <circle cx="52" cy="28" r="1.7" />
            <circle cx="14" cy="22" r="2" />
          </g>
          <path d="M6 56 q6 -4 12 0 t12 0 t12 0 t12 0" fill="none" stroke="#5E86B8" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
        </>
      )
  }
}

interface Props {
  sunElement: Element
  moonElement: Element
  size?: number
}

/** ほしキャラのマスコット(SVG)。16キャラそれぞれ固有のポップイラスト(顔なし)。 */
export default function HoshiKyaraMascot({ sunElement, moonElement, size = 72 }: Props) {
  const uid = useId().replace(/:/g, '')
  const key = `${sunElement}${moonElement}` as Key
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
      {scene(key, uid)}
    </svg>
  )
}
