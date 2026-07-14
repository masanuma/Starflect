import { useUI } from '../lib/ui'
import { allStarTypes, ELEMENT_ORDER, elementWord } from '../lib/startypes'
import { elementLabel } from '../lib/signs'

interface Props {
  onBack: () => void
  onStart: () => void
}

export default function About({ onBack, onStart }: Props) {
  const t = useUI()
  const types = allStarTypes()

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
              <span className="about-el-mark">{elementLabel(el)}</span>
              <span className="about-el-body">
                <span className="about-el-word">{elementWord(el)}</span>
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
              <span className="type-mini-emoji">{r.type.emoji}</span>
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
