import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ChartData, PlanetPos, PeriodKey } from '../lib/types'
import { localToDate, ascendant, eclipticLongitude, isRetrograde } from '../lib/astro'
import { COUNTRIES, countryByCode, countryName, detectDefaultCountry } from '../lib/countries'
import { PREFECTURES, prefectureByCode, prefectureName, DEFAULT_PREFECTURE } from '../lib/prefectures'
import { PERIODS, periodLabel } from '../lib/fortune'
import { getPlanet, PRO_PLANETS } from '../lib/planets'
import { useLang } from '../lib/i18n'
import { useUI, formatBirthDate } from '../lib/ui'

interface Props {
  onBack: () => void
  onResult: (data: ChartData) => void
}

interface SavedInput {
  name: string
  date: string
  time: string
  countryCode?: string
  prefectureCode?: string
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
  const { lang } = useLang()
  const t = useUI()
  const saved = loadSaved()
  const [name, setName] = useState(saved?.name ?? '')
  const [date, setDate] = useState(saved?.date ?? '')
  const [time, setTime] = useState(saved?.time ?? '')
  const [countryCode, setCountryCode] = useState(saved?.countryCode ?? detectDefaultCountry())
  const [prefectureCode, setPrefectureCode] = useState(saved?.prefectureCode ?? DEFAULT_PREFECTURE)
  const [period, setPeriod] = useState<PeriodKey>(saved?.period ?? 'today')
  const [error, setError] = useState('')

  const sortedCountries = [...COUNTRIES].sort((a, b) =>
    countryName(a, lang).localeCompare(countryName(b, lang), lang),
  )

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, date, time, countryCode, prefectureCode, period } satisfies SavedInput),
      )
    } catch {
      /* 保存できない環境では無視 */
    }
  }, [name, date, time, countryCode, prefectureCode, period])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!date) {
      setError(t.birth.errNoDate)
      return
    }

    const country = countryByCode(countryCode)
    const isJapan = countryCode === 'JP'
    const pref = isJapan ? prefectureByCode(prefectureCode) : null
    // 日本は都道府県の緯度経度を使う(上昇星座の精度が少し上がる)。時差は全国 +9。
    const lat = pref ? pref.lat : country.lat
    const lon = pref ? pref.lon : country.lon
    // 時刻不明でも占えるように正午で近似(その場合、上昇星座は省略)
    const hasTime = time !== ''
    const d = localToDate(date, hasTime ? time : '12:00', country.offset)
    if (Number.isNaN(d.getTime())) {
      setError(t.birth.errBadDate)
      return
    }

    const placeLabel = hasTime ? (pref ? prefectureName(pref) : countryName(country, lang)) : undefined

    // 常に10天体を計算(逆行判定つき)。時刻がわかる場合は上昇星座も
    const planets: PlanetPos[] = PRO_PLANETS.map((key) => {
      const body = getPlanet(key).body!
      return {
        key,
        lon: eclipticLongitude(body, d),
        retro: key !== 'sun' && key !== 'moon' && isRetrograde(body, d),
      }
    })
    if (hasTime) {
      planets.splice(2, 0, { key: 'asc', lon: ascendant(d, lat, lon) })
    }

    const dateLabel = formatBirthDate(date, hasTime ? time : undefined, lang)

    onResult({ name: name.trim(), dateLabel, placeLabel, planets, period })
  }

  return (
    <div className="form-screen">
      <button className="back-link" onClick={onBack}>
        {t.common.backToModes}
      </button>

      <h2 className="screen-title pop-title">{t.birth.title}</h2>
      <p className="screen-sub">{t.birth.sub}</p>

      <form className="birth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">{t.common.nameLabel}</span>
          <input
            type="text"
            value={name}
            placeholder={t.common.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">{t.common.birthdate}</span>
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
          <span className="field-label">{t.common.birthtime}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <span className="field-hint">{t.birth.timeHint}</span>
        </label>

        <label className="field">
          <span className="field-label">{t.birth.country}</span>
          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
            {sortedCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {countryName(c, lang)}
              </option>
            ))}
          </select>
          <span className="field-hint">{t.birth.countryHint}</span>
        </label>

        {countryCode === 'JP' && (
          <label className="field">
            <span className="field-label">{t.birth.prefecture}</span>
            <select value={prefectureCode} onChange={(e) => setPrefectureCode(e.target.value)}>
              {PREFECTURES.map((p) => (
                <option key={p.code} value={p.code}>
                  {prefectureName(p)}
                </option>
              ))}
            </select>
            <span className="field-hint">{t.birth.prefectureHint}</span>
          </label>
        )}

        <div className="field">
          <span className="field-label">{t.common.when}</span>
          <div className="period-row" role="radiogroup" aria-label={t.common.periodAria}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={period === p.key}
                className={`period-chip${period === p.key ? ' active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {periodLabel(p.key)}
              </button>
            ))}
          </div>
          <span className="field-hint">{t.birth.periodHint}</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="cta">
          {t.birth.submit}
        </button>
      </form>
    </div>
  )
}
