import { useEffect, useState } from 'react'
import type { PairData, PairPerson } from '../lib/compat'
import { compatOf, pairTip, relLabel } from '../lib/compat'
import type { FortuneTab } from '../lib/fortune'
import { readFortune, periodLabel, FORTUNE_TABS, PERIOD_OF_TAB, fortuneTabDate } from '../lib/fortune'
import { starTypeOf } from '../lib/startypes'
import type { PairChatContext } from '../lib/aiChat'
import { streamAiPairChat } from '../lib/aiChat'
import { getPlanet } from '../lib/planets'
import { signName } from '../lib/signs'
import { signIndex } from '../lib/astro'
import { useUI } from '../lib/ui'
import AiChat from './AiChat'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import SectionIcon from './SectionIcon'
import Feedback from './Feedback'
import { track } from '../lib/analytics'

interface Props {
  data: PairData
  onRetry: () => void
  onHome: () => void
}

function personType(p: PairPerson) {
  const sun = p.planets.find((pp) => pp.key === 'sun')!
  const moon = p.planets.find((pp) => pp.key === 'moon')!
  return starTypeOf(sun.lon, moon.lon)
}

export default function PairResult({ data, onRetry, onHome }: Props) {
  const t = useUI()
  const { a, b } = data
  const typeA = personType(a)
  const typeB = personType(b)
  const compat = compatOf(a, b)

  // 期間は結果画面でも切り替えられる(今日/明日/今週/来週/今月/来月)。すべてローカル計算=AIコストなし。
  const [tab, setTab] = useState<FortuneTab>(data.period)
  const fortuneA = readFortune(a.planets, PERIOD_OF_TAB[tab], fortuneTabDate(tab))
  const fortuneB = readFortune(b.planets, PERIOD_OF_TAB[tab], fortuneTabDate(tab))
  const tip = pairTip(fortuneA.toneLevel, fortuneB.toneLevel, a.name, b.name)
  const tabLabel = (id: FortuneTab) =>
    id === 'nextweek' ? t.companion.tabNextWeek : id === 'nextmonth' ? t.companion.tabNextMonth : periodLabel(PERIOD_OF_TAB[id])

  const anyApprox = a.approxTime || b.approxTime

  useEffect(() => {
    track('pair_result')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 相性チャット(相談室)に渡すふたりのデータ。選択中の期間の空模様を反映する。
  const natalOf = (p: PairPerson) =>
    p.planets.map((pp) => ({ label: getPlanet(pp.key).name, sign: signName(signIndex(pp.lon)) }))
  const pairChatContext: PairChatContext = {
    nameA: a.name,
    nameB: b.name,
    typeA: typeA.type.name,
    typeB: typeB.type.name,
    natalA: natalOf(a),
    natalB: natalOf(b),
    percent: compat.percent,
    nickname: compat.nickname,
    details: compat.details.map((d) => `${d.title}: ${d.text}`),
    skyNote: fortuneA.skyNote,
    toneA: fortuneA.toneLabel,
    toneB: fortuneB.toneLabel,
    aspectsA: fortuneA.items.map((i) => i.title),
    aspectsB: fortuneB.items.map((i) => i.title),
  }

  return (
    <div className="result-screen pair-screen">
      <p className="result-lead">
        {a.name} × {b.name}
      </p>
      <h2 className="screen-title pop-title">{t.pairResult.title}</h2>
      <div className="ornament" aria-hidden="true">
        ✦ ✦ ✦
      </div>

      <section className="pair-hero">
        <div className="pair-types">
          <div className="pair-type">
            <span className="pair-type-mascot" aria-hidden="true">
              <HoshiKyaraMascot sunElement={typeA.sunElement} moonElement={typeA.moonElement} size={62} />
            </span>
            <span className="pair-type-name">{typeA.type.name}</span>
            <span className="pair-type-person">{a.name}</span>
          </div>
          <div className="pair-x" aria-hidden="true">
            ×
          </div>
          <div className="pair-type">
            <span className="pair-type-mascot" aria-hidden="true">
              <HoshiKyaraMascot sunElement={typeB.sunElement} moonElement={typeB.moonElement} size={62} />
            </span>
            <span className="pair-type-name">{typeB.type.name}</span>
            <span className="pair-type-person">{b.name}</span>
          </div>
        </div>
        <p className="pair-percent">
          {t.pairResult.matchLabel} <strong>{compat.percent}</strong>
          <span className="pair-percent-unit">%</span>
        </p>
        <p className="pair-nickname">
          {compat.emoji} {compat.nickname}
        </p>
      </section>

      <section className="planet-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            <SectionIcon name="breakdown" />
          </div>
          <div>
            <p className="planet-title">{t.pairResult.breakdownTitle}</p>
            <p className="planet-sub">{t.pairResult.breakdownSub}</p>
          </div>
        </header>
        <ul className="fortune-list">
          {compat.details.map((d) => (
            <li key={d.title} className={`fortune-item ${d.rel === 'spark' ? 'hard' : 'good'}`}>
              <p className="fortune-item-title">
                {d.title}
                <span className={`rel-badge rel-${d.rel}`}>{relLabel(d.rel)}</span>
              </p>
              <p className="fortune-item-text">{d.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="planet-card pair-today">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            <SectionIcon name="today" />
          </div>
          <div>
            <p className="planet-title">{t.pairResult.todayTitle(tabLabel(tab))}</p>
            <p className="planet-sub">{t.pairResult.todaySub(fortuneA.skyNote)}</p>
          </div>
        </header>

        <div className="reading-tabs" role="tablist">
          {FORTUNE_TABS.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={id === tab}
              className={`reading-tab ${id === tab ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {tabLabel(id)}
            </button>
          ))}
        </div>

        <div className="pair-tones">
          <div className="pair-tone">
            <p className="pair-tone-name">{a.name}</p>
            <span className="tone-badge">{fortuneA.toneLabel}</span>
            <p className="pair-tone-text">{fortuneA.items[0]?.text}</p>
          </div>
          <div className="pair-tone">
            <p className="pair-tone-name">{b.name}</p>
            <span className="tone-badge">{fortuneB.toneLabel}</span>
            <p className="pair-tone-text">{fortuneB.items[0]?.text}</p>
          </div>
        </div>

        <p className="pair-tip">{tip}</p>
      </section>

      <AiChat
        storageKey={`starflect-pairchat:${a.dateLabel}:${b.dateLabel}`}
        stream={(msgs, onDelta, l) => streamAiPairChat(pairChatContext, msgs, onDelta, l)}
        headerIcon={<SectionIcon name="pairReading" />}
        copy={t.pairChat}
      />

      <Feedback page="pair" />

      {anyApprox && (
        <div className="upsell">
          <p>{t.pairResult.upsell}</p>
        </div>
      )}

      <div className="result-actions">
        <button className="cta cta-pop" onClick={onRetry}>
          {t.pairResult.retry}
        </button>
        <button className="ghost" onClick={onHome}>
          {t.pairResult.home}
        </button>
      </div>
    </div>
  )
}
