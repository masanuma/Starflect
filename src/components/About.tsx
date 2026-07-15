import { useEffect } from 'react'
import { useUI } from '../lib/ui'
import { allStarTypes, ELEMENT_ORDER } from '../lib/startypes'
import { elementLabel } from '../lib/signs'
import type { Element } from '../lib/signs'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { track } from '../lib/analytics'

interface Props {
  onBack: () => void
  onStart: () => void
}

/** エレメントの白アイコン(色丸の中に置く) */
function ElementIcon({ el }: { el: Element }) {
  const c = { fill: '#ffffff' }
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" role="img" aria-hidden="true">
      {el === '火' && (
        <path
          d="M12 3 C15 8 17 10.5 17 15 A5 5 0 0 1 7 15 C7 12 9 10 10.5 7.5 C11.3 11 12.5 11 13.5 10.5 C12 7.5 11.5 5.5 12 3 Z"
          {...c}
        />
      )}
      {el === '地' && <path d="M2.5 19 L9 7.5 L13 13.5 L16 9 L21.5 19 Z" {...c} />}
      {el === '風' && (
        <g fill="none" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round">
          <path d="M3 9 h10 a3 3 0 1 0 -3 -3" />
          <path d="M4 14.5 h12 a3 3 0 1 1 -3 3" />
        </g>
      )}
      {el === '水' && <path d="M12 3 C16 9 18 12 18 15.5 A6 6 0 0 1 6 15.5 C6 12 8 9 12 3 Z" {...c} />}
    </svg>
  )
}

export default function About({ onBack, onStart }: Props) {
  const t = useUI()
  const types = allStarTypes()

  useEffect(() => {
    track('about_view')
  }, [])

  return (
    <div className="about-screen">
      <button className="back-link" onClick={onBack}>
        {t.common.backToModes}
      </button>

      <h2 className="screen-title pop-title about-title">{t.about.title}</h2>
      <p className="about-lead">{t.about.lead}</p>

      <section className="party-card about-card">
        {t.about.what.map((p, i) => (
          <p className="about-p" key={i}>
            {p}
          </p>
        ))}
      </section>

      <section className="party-card about-card">
        <p className="about-h">{t.about.howTitle}</p>
        <div className="about-formula">
          <div className="about-formula-side">
            <span className="about-formula-label">☉ {t.about.outer}</span>
            <span className="about-formula-sub">{t.about.sunElement}</span>
          </div>
          <span className="about-formula-op">×</span>
          <div className="about-formula-side">
            <span className="about-formula-label">☽ {t.about.inner}</span>
            <span className="about-formula-sub">{t.about.moonElement}</span>
          </div>
          <span className="about-formula-op">=</span>
          <div className="about-formula-side">
            <span className="about-formula-num">16</span>
          </div>
        </div>

        <p className="about-sub-h">{t.about.elementsTitle}</p>
        <ul className="about-elements">
          {ELEMENT_ORDER.map((el) => (
            <li className={`about-el about-el-${el}`} key={el}>
              <span className="about-el-mark">
                <ElementIcon el={el} />
              </span>
              <span className="about-el-body">
                <span className="about-el-word">{elementLabel(el)}</span>
                <span className="about-el-desc">{t.about.elements[el]}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="party-card about-card">
        <div className="party-head">
          <p className="party-title">{t.about.listTitle}</p>
          <p className="party-sub">{t.about.listSub}</p>
        </div>
        <ul className="type-grid">
          {types.map((r, i) => (
            <li className="type-mini" key={i}>
              <span className="type-mini-mascot" aria-hidden="true">
                <HoshiKyaraMascot sunElement={r.sunElement} moonElement={r.moonElement} size={56} />
              </span>
              <span className="type-mini-combo">
                {elementLabel(r.sunElement)} × {elementLabel(r.moonElement)}
              </span>
              <span className="type-mini-name">{r.type.name}</span>
              <span className="type-mini-copy">{r.type.copy}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="result-actions">
        <button className="cta" onClick={onStart}>
          {t.about.cta}
        </button>
      </div>
    </div>
  )
}
