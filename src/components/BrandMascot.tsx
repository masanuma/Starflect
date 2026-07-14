import { useId } from 'react'

const EYE = '#4a3a6e'

/** Starflect の看板キャラ — ぷっくりした星の子 */
export default function BrandMascot({ size = 84 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const grad = `${uid}g`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#F5C15E" />
          <stop offset="52%" stopColor="#EE7BA6" />
          <stop offset="100%" stopColor="#8A63DD" />
        </linearGradient>
      </defs>

      {/* 星の体(角を丸めるため太い同色ストローク) */}
      <path
        d="M32 6 L38.8 21.7 L55.8 23.3 L42.9 34.6 L46.7 51.2 L32 42.5 L17.3 51.2 L21.1 34.6 L8.2 23.3 L25.2 21.7 Z"
        fill={`url(#${grad})`}
        stroke={`url(#${grad})`}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* ハイライト */}
      <ellipse cx="24" cy="24" rx="6" ry="4" fill="#ffffff" opacity="0.3" />
      {/* ほっぺ */}
      <ellipse cx="24" cy="33" rx="3" ry="1.9" fill="#ffffff" opacity="0.35" />
      <ellipse cx="40" cy="33" rx="3" ry="1.9" fill="#ffffff" opacity="0.35" />
      {/* 目 */}
      <ellipse cx="27" cy="29" rx="2.7" ry="3.4" fill={EYE} />
      <ellipse cx="37" cy="29" rx="2.7" ry="3.4" fill={EYE} />
      <circle cx="28.1" cy="27.7" r="1.05" fill="#ffffff" />
      <circle cx="38.1" cy="27.7" r="1.05" fill="#ffffff" />
      {/* 口 */}
      <path d="M28.5 34.5 q3.5 3.6 7 0" stroke={EYE} strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* まわりのきらめき */}
      <path d="M55 12 l1 2.8 l2.8 1 l-2.8 1 l-1 2.8 l-1 -2.8 l-2.8 -1 l2.8 -1 z" fill="#F5C15E" />
      <path d="M9 45 l0.8 2.2 l2.2 0.8 l-2.2 0.8 l-0.8 2.2 l-0.8 -2.2 l-2.2 -0.8 l2.2 -0.8 z" fill="#EE7BA6" />
      <circle cx="52" cy="46" r="1.4" fill="#8A63DD" opacity="0.7" />
    </svg>
  )
}
