const V = '#8a63dd'
const P = '#EA6596'
const G = '#E8A93A'

export type SectionIconName = 'fortune' | 'reading' | 'chat' | 'breakdown' | 'today' | 'pairReading' | 'feedback'

/** セクション見出しの丸アイコン(統一SVG)。ブランド配色。 */
export default function SectionIcon({ name, size = 26 }: { name: SectionIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-hidden="true">
      {icon(name)}
    </svg>
  )
}

function icon(name: SectionIconName) {
  switch (name) {
    case 'fortune': // 運勢 — 流れ星
      return (
        <>
          <path d="M3 21 L10 14" stroke={P} strokeWidth="2" strokeLinecap="round" opacity="0.75" />
          <path d="M6.5 21.5 L12 16" stroke={G} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
          <path d="M16 3.4 l1.9 4.6 l4.6 1.9 l-4.6 1.9 l-1.9 4.6 l-1.9 -4.6 l-4.6 -1.9 l4.6 -1.9 z" fill={V} />
        </>
      )
    case 'reading': // AI鑑定 — きらめき
      return (
        <>
          <path d="M12 2.6 l2.3 6.1 l6.1 2.3 l-6.1 2.3 l-2.3 6.1 l-2.3 -6.1 l-6.1 -2.3 l6.1 -2.3 z" fill={V} />
          <path d="M19.6 3 l0.9 2.3 l2.3 0.9 l-2.3 0.9 l-0.9 2.3 l-0.9 -2.3 l-2.3 -0.9 l2.3 -0.9 z" fill={P} />
          <path d="M4.4 16 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8 z" fill={G} />
        </>
      )
    case 'chat': // 相談室 — 吹き出し
      return (
        <>
          <path
            d="M4 4 h16 a2.6 2.6 0 0 1 2.6 2.6 v7 a2.6 2.6 0 0 1 -2.6 2.6 h-7.5 l-4.5 3.4 v-3.4 h-1.5 a2.6 2.6 0 0 1 -2.6 -2.6 v-7 a2.6 2.6 0 0 1 2.6 -2.6 z"
            fill={V}
          />
          <path d="M11.5 8.4 l1 2.5 l2.5 1 l-2.5 1 l-1 2.5 l-1 -2.5 l-2.5 -1 l2.5 -1 z" fill="#ffffff" />
        </>
      )
    case 'breakdown': // 相性の内訳 — ふたつのハート
      return (
        <>
          <path d="M15 17 C10 13 10 9 12.5 9 C14 9 15 10.5 15 11.5 C15 10.5 16 9 17.5 9 C20 9 20 13 15 17 Z" fill={V} opacity="0.9" />
          <path d="M9 14.5 C4 10.5 4 6.5 6.5 6.5 C8 6.5 9 8 9 9 C9 8 10 6.5 11.5 6.5 C14 6.5 14 10.5 9 14.5 Z" fill={P} />
        </>
      )
    case 'today': // ふたりの今日 — カレンダー
      return (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke={V} strokeWidth="1.8" />
          <path d="M3.5 9.5 h17" stroke={V} strokeWidth="1.8" />
          <path d="M8 3.2 v3.4 M16 3.2 v3.4" stroke={V} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 12 l0.9 2.2 l2.2 0.9 l-2.2 0.9 l-0.9 2.2 l-0.9 -2.2 l-2.2 -0.9 l2.2 -0.9 z" fill={P} />
        </>
      )
    case 'pairReading': // ふたり鑑定 — ラブレター
      return (
        <>
          <rect x="3" y="5.5" width="18" height="13" rx="2.2" fill="none" stroke={V} strokeWidth="1.8" />
          <path d="M3.6 6.5 L12 12.4 L20.4 6.5" fill="none" stroke={V} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 16.6 C8.6 14.1 8.6 11.4 10.3 11.4 C11.3 11.4 12 12.4 12 13.1 C12 12.4 12.7 11.4 13.7 11.4 C15.4 11.4 15.4 14.1 12 16.6 Z" fill={P} />
        </>
      )
    case 'feedback': // フィードバック — ハート＋きらめき(気持ちを伝える)
      return (
        <>
          <path d="M12 19.5 C5 14 5 8.5 8.2 8.5 C10 8.5 11.4 10 12 11 C12.6 10 14 8.5 15.8 8.5 C19 8.5 19 14 12 19.5 Z" fill={P} />
          <path d="M19 3.2 l0.9 2.3 l2.3 0.9 l-2.3 0.9 l-0.9 2.3 l-0.9 -2.3 l-2.3 -0.9 l2.3 -0.9 z" fill={G} />
          <path d="M4.6 5 l0.6 1.6 l1.6 0.6 l-1.6 0.6 l-0.6 1.6 l-0.6 -1.6 l-1.6 -0.6 l1.6 -0.6 z" fill={V} />
        </>
      )
  }
}
