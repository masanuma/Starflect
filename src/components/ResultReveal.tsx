import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Element } from '../lib/starData'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import PlanetMascot from './PlanetMascot'
import { useUI } from '../lib/ui'

/** タメ → 太陽と月が寄る → ほしキャラ誕生 → 名前、の順に見せる */
type Phase = 'reading' | 'birth' | 'name' | 'out'

interface Props {
  sunElement: Element
  moonElement: Element
  /** 括弧つきのほしキャラ名 */
  name: string
  copy: string
  /** ベールが薄れはじめるときに呼ばれる。背面の結果カードを動かしはじめて“間”を作らない */
  onFadeStart: () => void
  /** 演出が終わった(またはスキップされた)ときに呼ばれる */
  onDone: () => void
}

/** タメの間に中心へ吸い込まれる星。角度だけ変えて使い回す */
const SPARK_ANGLES = [0, 60, 120, 180, 240, 300]

/**
 * 初回診断のリビール演出。診断＝このアプリの感情のピークなので、
 * 「間(タメ) → 太陽と月から生まれる → 名前」の順に一拍ずつ見せる。
 * どこをタップしてもスキップできる。2回目以降と prefers-reduced-motion では再生しない(呼び出し側で制御)。
 */
export default function ResultReveal({ sunElement, moonElement, name, copy, onFadeStart, onDone }: Props) {
  const t = useUI()
  const [phase, setPhase] = useState<Phase>('reading')
  // コールバックは毎レンダーで新しい関数になるため、ref 経由で参照してタイマーの貼り直しを防ぐ
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const fadeRef = useRef(onFadeStart)
  fadeRef.current = onFadeStart

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase('birth'), 1400),
      window.setTimeout(() => setPhase('name'), 2400),
      // ベールが薄れはじめる少し前から結果カードを立ち上げておく。
      // 同時に始めるとベールが透けきる頃にカードがまだ現れず、一瞬なにも無い画面になる
      window.setTimeout(() => fadeRef.current(), 3320),
      window.setTimeout(() => setPhase('out'), 3600),
      window.setTimeout(() => doneRef.current(), 4000),
    ]
    // 演出中は背面のスクロールを止める
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      timers.forEach(window.clearTimeout)
      document.body.style.overflow = prevOverflow
    }
    // マウント時に1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const born = phase === 'name' || phase === 'out'

  return (
    // 状態クラスは is-* を使う。reveal-* にすると中身の .reveal-reading / .reveal-name と
    // 名前が衝突し、オーバーレイ自身が点滅・移動してしまう
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
            <p className="reveal-reading">{t.result.revealReading}</p>
          </>
        ) : (
          <>
            <div className="reveal-stage">
              <div className="reveal-planet reveal-sun" aria-hidden="true">
                <PlanetMascot planetKey="sun" size={56} />
              </div>
              <div className="reveal-planet reveal-moon" aria-hidden="true">
                <PlanetMascot planetKey="moon" size={56} />
              </div>
              {born && (
                <>
                  <span className="reveal-burst" aria-hidden="true" />
                  <div className="reveal-mascot" aria-hidden="true">
                    <HoshiKyaraMascot sunElement={sunElement} moonElement={moonElement} size={160} />
                  </div>
                </>
              )}
            </div>

            {born && (
              <div className="reveal-caption">
                <p className="reveal-intro">{t.result.revealIntro}</p>
                <h2 className="reveal-name">{name}</h2>
                <p className="reveal-copy">{copy}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
