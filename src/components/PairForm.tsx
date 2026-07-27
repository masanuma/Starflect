import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { PlanetPos } from '../lib/types'
import type { PairData, PairPerson } from '../lib/compat'
import { localToDate, sunLongitude, moonLongitude } from '../lib/astro'
import { countryByCode, detectDefaultCountry } from '../lib/countries'
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
}

const STORAGE_KEY = 'starflect-pair'
const SELF_KEY = 'starflect-input'
const EMPTY: PersonInput = { name: '', date: '', time: '' }

function loadSaved(): SavedPair | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedPair) : null
  } catch {
    return null
  }
}

/** 診断で入力済みの「自分」の生年月日を、相性の1人目に引き継ぐ(再入力させない) */
function loadSelf(): PersonInput | null {
  try {
    const raw = localStorage.getItem(SELF_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as { name?: string; date?: string; time?: string }
    if (!s.date) return null
    return { name: s.name ?? '', date: s.date, time: s.time ?? '' }
  } catch {
    return null
  }
}

/** 入力された個人名に敬称を付ける。日本語は「さん」、他言語は敬称文化が異なるためそのまま。
 *  空欄時のフォールバック(「あなた」「相手」等)には付けない。 */
function withHonorific(name: string, lang: Lang): string {
  return lang === 'ja' ? `${name}さん` : name
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
  const entered = input.name.trim()
  return {
    name: entered ? withHonorific(entered, lang) : fallbackName,
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
  // 1人目=自分。前回の相性入力があればそれを、無ければ診断で入れた自分の情報を引き継ぐ。
  const [a, setA] = useState<PersonInput>(saved?.a?.date ? saved.a : (loadSelf() ?? saved?.a ?? EMPTY))
  const [b, setB] = useState<PersonInput>(saved?.b ?? EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ a, b } satisfies SavedPair))
    } catch {
      /* 保存できない環境では無視 */
    }
  }, [a, b])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // 相性は場所フィールドを持たないため、端末から推定した国の標準オフセットを既定に使う
    const offset = countryByCode(detectDefaultCountry()).offset
    const pa = buildPerson(a, t.pair.youName, offset, t, lang)
    if (typeof pa === 'string') return setError(pa)
    const pb = buildPerson(b, t.pair.partnerName, offset, t, lang)
    if (typeof pb === 'string') return setError(pb)

    // 期間は結果画面で切り替えられるので、初期値は「今日」で開く
    onResult({ a: pa, b: pb, period: 'today' })
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

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="cta cta-pop">
          {t.pair.submit}
        </button>
      </form>
    </div>
  )
}
