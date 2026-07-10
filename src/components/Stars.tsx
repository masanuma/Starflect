import { useMemo } from 'react'

interface Star {
  top: number
  left: number
  size: number
  delay: number
  duration: number
  gold: boolean
}

export default function Stars() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 110 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1 + Math.random() * 1.6,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 5,
        gold: Math.random() < 0.18,
      })),
    [],
  )

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className={s.gold ? 'star star-gold' : 'star'}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
