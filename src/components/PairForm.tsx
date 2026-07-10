import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { PeriodKey, PlanetPos } from '../lib/types'
import type { PairData, PairPerson } from '../lib/compat'
import { jstDate, sunLongitude, moonLongitude } from '../lib/astro'
import { PERIODS } from '../lib/fortune'

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

function buildPerson(input: PersonInput, fallbackName: string): PairPerson | string {
  if (!input.date) return `${fallbackName}の生年月日を入力してください`
  const d = jstDate(input.date, input.time || '12:00')
  if (Number.isNaN(d.getTime())) return `${fallbackName}の日付の形式が正しくありません`

  const planets: PlanetPos[] = [
    { key: 'sun', lon: sunLongitude(d) },
    { key: 'moon', lon: moonLongitude(d) },
  ]
  const [y, m, day] = input.date.split('-')
  return {
    name: input.name.trim() || fallbackName,
    dateLabel: `${y}年${Number(m)}月${Number(day)}日`,
    approxTime: !input.time,
    planets,
  }
}

function PersonFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: PersonInput
  onChange: (v: PersonInput) => void
}) {
  return (
    <fieldset className="pair-person">
      <legend className="pair-legend">{label}</legend>
      <label className="field">
        <span className="field-label">お名前(任意)</span>
        <input
          type="text"
          value={value.name}
          placeholder="ニックネームでもOK"
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <label className="field">
        <span className="field-label">生年月日</span>
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
        <span className="field-label">生まれた時刻(任意)</span>
        <input type="time" value={value.time} onChange={(e) => onChange({ ...value, time: e.target.value })} />
        <span className="field-hint">不明でもOK(月星座をお昼の12時で近似します)</span>
      </label>
    </fieldset>
  )
}

export default function PairForm({ onBack, onResult }: Props) {
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

    const pa = buildPerson(a, 'あなた')
    if (typeof pa === 'string') return setError(pa)
    const pb = buildPerson(b, '相手')
    if (typeof pb === 'string') return setError(pb)

    onResult({ a: pa, b: pb, period })
  }

  return (
    <div className="form-screen pair-screen">
      <button className="back-link" onClick={onBack}>
        ← モード選択に戻る
      </button>

      <h2 className="screen-title pop-title">ふたりの相性</h2>
      <p className="screen-sub">ほしキャラの相性と、いまの星回りから「ふたりの今」を占います</p>

      <form className="birth-form" onSubmit={handleSubmit}>
        <PersonFields label="🌟 あなた" value={a} onChange={setA} />
        <PersonFields label="💫 相手" value={b} onChange={setB} />

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
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="cta cta-pop">
          ふたりの星を読む
        </button>
      </form>
    </div>
  )
}
