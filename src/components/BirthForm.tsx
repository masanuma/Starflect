import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ChartData, PlanetPos, PeriodKey } from '../lib/types'
import { jstDate, ascendant, eclipticLongitude, isRetrograde } from '../lib/astro'
import { PLACES } from '../lib/places'
import { PERIODS } from '../lib/fortune'
import { PLANET_INFO, PRO_PLANETS } from '../lib/planets'

interface Props {
  onBack: () => void
  onResult: (data: ChartData) => void
}

interface SavedInput {
  name: string
  date: string
  time: string
  placeIdx: number
  period?: PeriodKey
}

const STORAGE_KEY = 'starflect-input'

function loadSaved(): SavedInput | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedInput) : null
  } catch {
    return null
  }
}

export default function BirthForm({ onBack, onResult }: Props) {
  const saved = loadSaved()
  const [name, setName] = useState(saved?.name ?? '')
  const [date, setDate] = useState(saved?.date ?? '')
  const [time, setTime] = useState(saved?.time ?? '')
  const [placeIdx, setPlaceIdx] = useState(saved?.placeIdx ?? 12)
  const [period, setPeriod] = useState<PeriodKey>(saved?.period ?? 'today')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, date, time, placeIdx, period } satisfies SavedInput),
      )
    } catch {
      /* 保存できない環境では無視 */
    }
  }, [name, date, time, placeIdx, period])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!date) {
      setError('生年月日を入力してください')
      return
    }

    // 時刻不明でも占えるように正午で近似(その場合、上昇星座は省略)
    const hasTime = time !== ''
    const d = jstDate(date, hasTime ? time : '12:00')
    if (Number.isNaN(d.getTime())) {
      setError('日付の形式が正しくありません')
      return
    }

    const place = PLACES[placeIdx]
    const placeLabel = hasTime ? place.name : undefined

    // 常に10天体を計算(逆行判定つき)。時刻がわかる場合は上昇星座も
    const planets: PlanetPos[] = PRO_PLANETS.map((key) => {
      const body = PLANET_INFO[key].body!
      return {
        key,
        lon: eclipticLongitude(body, d),
        retro: key !== 'sun' && key !== 'moon' && isRetrograde(body, d),
      }
    })
    if (hasTime) {
      planets.splice(2, 0, { key: 'asc', lon: ascendant(d, place.lat, place.lon) })
    }

    const [y, m, day] = date.split('-')
    const dateLabel = `${y}年${Number(m)}月${Number(day)}日` + (hasTime ? ` ${time}` : '')

    onResult({ name: name.trim(), dateLabel, placeLabel, planets, period })
  }

  return (
    <div className="form-screen">
      <button className="back-link" onClick={onBack}>
        ← モード選択に戻る
      </button>

      <h2 className="screen-title pop-title">ほしキャラ診断</h2>
      <p className="screen-sub">
        生年月日だけでOK。あなたのほしキャラと、生まれた瞬間の星の配置をまるごと分析します
      </p>

      <form className="birth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">お名前(任意)</span>
          <input
            type="text"
            value={name}
            placeholder="ニックネームでもOK"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">生年月日</span>
          <input
            type="date"
            value={date}
            min="1900-01-01"
            max="2035-12-31"
            required
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">生まれた時刻(任意)</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <span className="field-hint">
            母子手帳に記載があります。不明でもOK(お昼の12時で近似し、上昇星座は省略します)
          </span>
        </label>

        <label className="field">
          <span className="field-label">生まれた場所</span>
          <select value={placeIdx} onChange={(e) => setPlaceIdx(Number(e.target.value))}>
            {PLACES.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="field-hint">上昇星座の計算に使います(時刻が未入力のときは使いません)</span>
        </label>

        <div className="field">
          <span className="field-label">いつを占う?</span>
          <div className="period-row" role="radiogroup" aria-label="占う期間">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={period === p.key}
                className={`period-chip${period === p.key ? ' active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span className="field-hint">占った時点の星の運行から、その期間の運勢を読みます</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="cta">
          星を読む
        </button>
      </form>
    </div>
  )
}
