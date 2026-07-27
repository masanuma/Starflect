import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Element } from '../lib/starData'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI } from '../lib/ui'

/** タメ → ふたりのほしキャラが出会う → 相性が出る */
type Phase = 'reading' | 'meet' | 'score' | 'out'

interface Person {
  sunElement: Element
  moonElement: Element
  /** 表示名(敬称つき) */
  name: string
}

interface Props {
  a: Person
  b: Person
  percent: number
  nickname: string
  emoji: string
  /** ベールが薄れはじめるときに呼ばれる */
  onFadeStart: () => void
  /** 演出が終わった(またはスキップされた)ときに呼ばれる */
  onDone: () => void
}

const SPARK_ANGLES = [0, 60, 120, 180, 240, 300]

/**
 * 相性結果のリビール演出。ソロ版(ResultReveal)と同じ間合い・同じベールで、
 * 「ふたりのキャラが左右から出会い、相性の数字が立ち上がる」を見せる。
 * どこをタップしてもスキップできる。
 */
export default function PairReveal({ a, b, percent, nickname, emoji, onFadeStart, onDone }: Props) {
  const t = useUI()
  const [phase, setPhase] = useState<Phase>('reading')
  // 数字は0から数え上げる(結果が“出る”感じを出す)
  const [shown, setShown] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const fadeRef = useRef(onFadeStart)
  fadeRef.current = onFadeStart

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase('meet'), 1400),
      window.setTimeout(() => setPhase('score'), 2400),
      window.setTimeout(() => fadeRef.current(), 3320),
      window.setTimeout(() => setPhase('out'), 3600),
      window.setTimeout(() => doneRef.current(), 4000),
    ]
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      timers.forEach(window.clearTimeout)
      document.body.style.overflow = prevOverflow
    }
    // マウント時に1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 相性の数字を 0 → percent へ数え上げる
  useEffect(() => {
    if (phase !== 'score') return
    const dur = 850
    const start = performance.now()
    let raf = 0
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / dur)
      // 終盤ほどゆっくり止まる
      setShown(Math.round(percent * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase, percent])

  const scored = phase === 'score' || phase === 'out'

  return (
    <div className={`reveal is-${phase}`} onClick={onDone} role="presentation">
      <div className="reveal-inner">
        {phase === 'reading' ? (
          <>
            <div className="reveal-sparks" aria-hidden="true">
              {SPARK_ANGLES.map((deg) => (
                <span key={deg} className="reveal-spark" style={{ '--deg': `${deg}deg` } as CSSProperties}>
                  ✦
                </span>
              ))}
            </div>
            <p className="reveal-reading">{t.pairResult.revealReading}</p>
          </>
        ) : (
          <>
            <div className="reveal-pairstage">
              <div className="reveal-pair-side reveal-pair-a">
                <HoshiKyaraMascot sunElement={a.sunElement} moonElement={a.moonElement} size={88} />
                <span className="reveal-pair-name">{a.name}</span>
              </div>
              <span className="reveal-pair-x" aria-hidden="true">
                ×
              </span>
              <div className="reveal-pair-side reveal-pair-b">
                <HoshiKyaraMascot sunElement={b.sunElement} moonElement={b.moonElement} size={88} />
                <span className="reveal-pair-name">{b.name}</span>
              </div>
              {scored && <span className="reveal-burst is-center" aria-hidden="true" />}
            </div>

            {scored && (
              <div className="reveal-caption">
                <p className="reveal-intro">{t.pairResult.matchLabel}</p>
                <p className="reveal-score">
                  {shown}
                  <span className="reveal-score-unit">%</span>
                </p>
                <p className="reveal-nickname">
                  {emoji} {nickname}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
