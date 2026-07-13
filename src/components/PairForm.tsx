import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { PeriodKey, PlanetPos } from '../lib/types'
import type { PairData, PairPerson } from '../lib/compat'
import { localToDate, sunLongitude, moonLongitude } from '../lib/astro'
import { countryByCode, detectDefaultCountry } from '../lib/countries'
import { PERIODS, periodLabel } from '../lib/fortune'
import { useLang } from '../lib/i18n'
import type { Lang } from '../lib/i18n'
import { useUI, formatBirthDate } from '../lib/ui'
import type { UIStrings } from '../lib/ui'

interface Props {
  onBack: () => void
  onResult: (data: PairData) => void
}

interface PersonInput {
  name: string
  date: string
  time: string
}

interface SavedPair {
  a: PersonInput
  b: PersonInput
  period?: PeriodKey
}

const STORAGE_KEY = 'starflect-pair'
const EMPTY: PersonInput = { name: '', date: '', time: '' }

function loadSaved(): SavedPair | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedPair) : null
  } catch {
    return null
  }
}

function buildPerson(
  input: PersonInput,
  fallbackName: string,
  offset: number,
  t: UIStrings,
  lang: Lang,
): PairPerson | string {
  if (!input.date) return t.pair.errNoDate(fallbackName)
  const d = localToDate(input.date, input.time || '12:00', offset)
  if (Number.isNaN(d.getTime())) return t.pair.errBadDate(fallbackName)

  const planets: PlanetPos[] = [
    { key: 'sun', lon: sunLongitude(d) },
    { key: 'moon', lon: moonLongitude(d) },
  ]
  return {
    name: input.name.trim() || fallbackName,
    dateLabel: formatBirthDate(input.date, undefined, lang),
    approxTime: !input.time,
    planets,
  }
}

function PersonFields({
  label,
  value,
  onChange,
  t,
}: {
  label: string
  value: PersonInput
  onChange: (v: PersonInput) => void
  t: UIStrings
}) {
  return (
    <fieldset className="pair-person">
      <legend className="pair-legend">{label}</legend>
      <label className="field">
        <span className="field-label">{t.common.nameLabel}</span>
        <input
          type="text"
          value={value.name}
          placeholder={t.common.namePlaceholder}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <label className="field">
        <span className="field-label">{t.common.birthdate}</span>
        <input
          type="date"
          value={value.date}
          min="1900-01-01"
          max="2035-12-31"
          required
          onChange={(e) => onChange({ ...value, date: e.target.value })}
        />
      </label>
      <label className="field">
        <span className="field-label">{t.common.birthtime}</span>
        <input type="time" value={value.time} onChange={(e) => onChange({ ...value, time: e.target.value })} />
        <span className="field-hint">{t.pair.timeHint}</span>
      </label>
    </fieldset>
  )
}

export default function PairForm({ onBack, onResult }: Props) {
  const { lang } = useLang()
  const t = useUI()
  const saved = loadSaved()
  const [a, setA] = useState<PersonInput>(saved?.a ?? EMPTY)
  const [b, setB] = useState<PersonInput>(saved?.b ?? EMPTY)
  const [period, setPeriod] = useState<PeriodKey>(saved?.period ?? 'today')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ a, b, period } satisfies SavedPair))
    } catch {
      /* 保存できない環境では無視 */
    }
  }, [a, b, period])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // 相性は場所フィールドを持たないため、端末から推定した国の標準オフセットを既定に使う
    const offset = countryByCode(detectDefaultCountry()).offset
    const pa = buildPerson(a, t.pair.youName, offset, t, lang)
    if (typeof pa === 'string') return setError(pa)
    const pb = buildPerson(b, t.pair.partnerName, offset, t, lang)
    if (typeof pb === 'string') return setError(pb)

    onResult({ a: pa, b: pb, period })
  }

  return (
    <div className="form-screen pair-screen">
      <button className="back-link" onClick={onBack}>
        {t.common.backToModes}
      </button>

      <h2 className="screen-title pop-title">{t.pair.title}</h2>
      <p className="screen-sub">{t.pair.sub}</p>

      <form className="birth-form" onSubmit={handleSubmit}>
        <PersonFields label={t.pair.you} value={a} onChange={setA} t={t} />
        <PersonFields label={t.pair.partner} value={b} onChange={setB} t={t} />

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
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="cta cta-pop">
          {t.pair.submit}
        </button>
      </form>
    </div>
  )
}
