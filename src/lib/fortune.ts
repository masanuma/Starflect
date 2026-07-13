import { Body } from 'astronomy-engine'
import { eclipticLongitude, signIndex } from './astro'
import { signName } from './signs'
import { getPlanet } from './planets'
import { getLang } from './i18n'
import type { Lang } from './i18n'
import type { PlanetPos, PlanetKey, PeriodKey } from './types'

type TransitKey = 'moon' | 'sun' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'

interface PeriodDef {
  key: PeriodKey
  /** 期間を代表する時点(現在からの日数) */
  offsetDays: number
  /** 期間の長さに合わせて見る天体(速い天体は短期間のみ) */
  bodies: TransitKey[]
}

export const PERIODS: PeriodDef[] = [
  { key: 'today', offsetDays: 0, bodies: ['moon', 'sun', 'mercury', 'venus', 'mars'] },
  { key: 'tomorrow', offsetDays: 1, bodies: ['moon', 'sun', 'mercury', 'venus', 'mars'] },
  { key: 'week', offsetDays: 3.5, bodies: ['sun', 'mercury', 'venus', 'mars', 'jupiter'] },
  { key: 'month', offsetDays: 15, bodies: ['sun', 'venus', 'mars', 'jupiter', 'saturn'] },
]

export const periodDef = (key: PeriodKey) => PERIODS.find((p) => p.key === key) ?? PERIODS[0]

const PERIOD_TEXT: Record<Lang, Record<PeriodKey, { label: string; noun: string }>> = {
  ja: {
    today: { label: '今日', noun: '今日' },
    tomorrow: { label: '明日', noun: '明日' },
    week: { label: '今週', noun: 'この1週間' },
    month: { label: '今月', noun: 'この1か月' },
  },
  en: {
    today: { label: 'Today', noun: 'today' },
    tomorrow: { label: 'Tomorrow', noun: 'tomorrow' },
    week: { label: 'This week', noun: 'this week' },
    month: { label: 'This month', noun: 'this month' },
  },
  es: {
    today: { label: 'Hoy', noun: 'hoy' },
    tomorrow: { label: 'Mañana', noun: 'mañana' },
    week: { label: 'Esta semana', noun: 'esta semana' },
    month: { label: 'Este mes', noun: 'este mes' },
  },
}

export const periodLabel = (key: PeriodKey): string => (PERIOD_TEXT[getLang()] ?? PERIOD_TEXT.ja)[key].label
export const periodNoun = (key: PeriodKey): string => (PERIOD_TEXT[getLang()] ?? PERIOD_TEXT.ja)[key].noun

interface TransitText {
  good: string
  hard: string
  conj: string
}

const TRANSIT_BODY: Record<TransitKey, Body> = {
  moon: Body.Moon,
  sun: Body.Sun,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
}

const TRANSIT_TEXT: Record<Lang, Record<TransitKey, TransitText>> = {
  ja: {
    moon: {
      good: '気分が乗りやすく、直感が冴える流れ。感じたことを素直に行動に移すと吉です。',
      hard: '気分の浮き沈みが出やすいとき。予定を詰め込みすぎず、心の休憩時間を確保して。',
      conj: '感情のアンテナが敏感になります。心が動いたこと、それがこの期間のテーマです。',
    },
    sun: {
      good: '活力が高まり、あなたらしさが自然と評価される追い風です。',
      hard: '自分のペースと周囲の期待がぶつかりやすいとき。無理な背伸びは禁物です。',
      conj: 'スポットライトが当たる節目。新しいスタートを切るのに向いています。',
    },
    mercury: {
      good: '会話や連絡ごとがスムーズに進みます。学び・発信・交渉ごとに好機です。',
      hard: '言葉の行き違いが起きやすいとき。大事な連絡は一呼吸おいて読み返しを。',
      conj: '頭の回転が速まり、アイデアが湧きます。思いつきはメモに残すと吉。',
    },
    venus: {
      good: '人間関係や恋愛に甘い追い風。楽しみごとやおしゃれへの投資が運を呼びます。',
      hard: '楽しさへの誘惑が判断を鈍らせがち。衝動買いと甘い話にはご注意を。',
      conj: '魅力が高まるとき。人との出会い、美しいものとの出会いに恵まれます。',
    },
    mars: {
      good: '行動力とチャレンジ精神が湧き上がります。迷っていた一歩を踏み出すなら今。',
      hard: '焦りやイライラが表に出やすいとき。勢いだけの決断や衝突に注意です。',
      conj: 'エンジン全開のエネルギー期。運動や勝負ごとで発散すると好循環になります。',
    },
    jupiter: {
      good: 'チャンスが広がる幸運の角度。誘いには「はい」と答えてみる価値があります。',
      hard: '気が大きくなって広げすぎてしまいがち。約束と出費は身の丈を意識して。',
      conj: '約12年に一度の拡大期。将来につながる種まきに最適なタイミングです。',
    },
    saturn: {
      good: '努力がかたちになりやすい堅実な流れ。コツコツ系の作業がはかどります。',
      hard: '責任や制限を感じやすいとき。ただし、ここで固めた土台は裏切りません。',
      conj: '人生の骨組みを見直す節目。長期的な計画を立てるのに向いています。',
    },
  },
  en: {
    moon: {
      good: 'Your mood lifts and intuition sharpens. Acting honestly on what you feel works well.',
      hard: 'Feelings run up and down. Don’t overpack your schedule—make room to rest your heart.',
      conj: 'Your emotional antenna is sensitive. Whatever moves you is the theme of this period.',
    },
    sun: {
      good: 'Vitality rises and your true self earns natural recognition—a real tailwind.',
      hard: 'Your pace and others’ expectations clash easily. Don’t force yourself to stretch too far.',
      conj: 'A turning point in the spotlight. A good time to make a fresh start.',
    },
    mercury: {
      good: 'Talk and messages flow smoothly. A good window for learning, sharing and negotiating.',
      hard: 'Words get crossed easily. Pause and reread important messages before sending.',
      conj: 'Your mind speeds up and ideas bubble. Jot down what pops into your head.',
    },
    venus: {
      good: 'A sweet tailwind for relationships and love. Investing in fun and style draws luck.',
      hard: 'The lure of pleasure can dull your judgment. Watch for impulse buys and sweet talk.',
      conj: 'Your charm rises. You’re blessed with encounters—with people and with beautiful things.',
    },
    mars: {
      good: 'Drive and a taste for challenge well up. If you’ve been hesitating, now is the time to step out.',
      hard: 'Impatience and irritation surface easily. Beware of rushed decisions and clashes.',
      conj: 'An engine-at-full energy phase. Burn it off through exercise or competition for a good cycle.',
    },
    jupiter: {
      good: 'A lucky angle where chances widen. It’s worth answering “yes” to invitations.',
      hard: 'You feel expansive and can overreach. Keep promises and spending within your means.',
      conj: 'An expansion phase that comes about once every 12 years. Ideal for planting seeds for the future.',
    },
    saturn: {
      good: 'A solid flow where effort takes shape. Steady, step-by-step work makes good progress.',
      hard: 'You feel responsibility and limits. Still, the foundation you set here won’t betray you.',
      conj: 'A milestone for rethinking life’s framework. A good time to make long-term plans.',
    },
  },
  es: {
    moon: {
      good: 'El ánimo sube y la intuición se afina. Actuar con sinceridad sobre lo que sientes funciona bien.',
      hard: 'Los estados de ánimo suben y bajan. No llenes la agenda: reserva un descanso para el corazón.',
      conj: 'Tu antena emocional está sensible. Lo que te conmueve es el tema de este periodo.',
    },
    sun: {
      good: 'La vitalidad sube y tu autenticidad recibe reconocimiento natural: un verdadero viento a favor.',
      hard: 'Tu ritmo y las expectativas ajenas chocan con facilidad. No te fuerces a estirarte de más.',
      conj: 'Un punto de giro bajo los focos. Buen momento para empezar de nuevo.',
    },
    mercury: {
      good: 'Las conversaciones y los mensajes fluyen. Buena ventana para aprender, difundir y negociar.',
      hard: 'Los malentendidos surgen fácil. Haz una pausa y relee los mensajes importantes antes de enviarlos.',
      conj: 'La mente se acelera y brotan ideas. Anota lo que se te ocurra.',
    },
    venus: {
      good: 'Un viento dulce para las relaciones y el amor. Invertir en diversión y estilo atrae la suerte.',
      hard: 'La tentación del placer puede nublar el juicio. Cuidado con las compras impulsivas y las palabras dulces.',
      conj: 'Tu encanto aumenta. Te esperan buenos encuentros, con personas y con cosas bellas.',
    },
    mars: {
      good: 'Brotan el empuje y las ganas de retos. Si dudabas, ahora es el momento de dar el paso.',
      hard: 'La impaciencia y la irritación salen fácil. Cuidado con las decisiones apresuradas y los choques.',
      conj: 'Una fase de energía a todo motor. Descárgala con ejercicio o competición para un buen ciclo.',
    },
    jupiter: {
      good: 'Un ángulo afortunado donde se abren oportunidades. Vale la pena decir “sí” a las invitaciones.',
      hard: 'Te sientes expansivo y puedes excederte. Mantén promesas y gastos a tu medida.',
      conj: 'Una fase de expansión que llega una vez cada 12 años. Ideal para sembrar de cara al futuro.',
    },
    saturn: {
      good: 'Un flujo sólido donde el esfuerzo toma forma. El trabajo constante avanza bien.',
      hard: 'Sientes responsabilidad y límites. Aun así, la base que asientes aquí no te fallará.',
      conj: 'Un hito para repensar la estructura de tu vida. Buen momento para planes a largo plazo.',
    },
  },
}

const NATAL_LABEL: Record<Lang, Record<PlanetKey, string>> = {
  ja: {
    sun: '太陽(基本性格)', moon: '月(心)', asc: '上昇星座(ふるまい)', mercury: '水星(知性)',
    venus: '金星(愛情)', mars: '火星(行動力)', jupiter: '木星(発展)', saturn: '土星(課題)',
    uranus: '天王星(変革)', neptune: '海王星(想像力)', pluto: '冥王星(再生)',
  },
  en: {
    sun: 'Sun (core self)', moon: 'Moon (heart)', asc: 'Rising (behavior)', mercury: 'Mercury (intellect)',
    venus: 'Venus (love)', mars: 'Mars (drive)', jupiter: 'Jupiter (growth)', saturn: 'Saturn (challenge)',
    uranus: 'Uranus (change)', neptune: 'Neptune (imagination)', pluto: 'Pluto (rebirth)',
  },
  es: {
    sun: 'Sol (esencia)', moon: 'Luna (corazón)', asc: 'Ascendente (conducta)', mercury: 'Mercurio (intelecto)',
    venus: 'Venus (amor)', mars: 'Marte (empuje)', jupiter: 'Júpiter (expansión)', saturn: 'Saturno (reto)',
    uranus: 'Urano (cambio)', neptune: 'Neptuno (imaginación)', pluto: 'Plutón (renacimiento)',
  },
}

type Quality = 'good' | 'hard' | 'conj'

interface AspectDef {
  angle: number
  orb: number
  quality: Quality
}

const ASPECTS: AspectDef[] = [
  { angle: 0, orb: 6, quality: 'conj' },
  { angle: 60, orb: 4, quality: 'good' },
  { angle: 90, orb: 6, quality: 'hard' },
  { angle: 120, orb: 6, quality: 'good' },
  { angle: 180, orb: 6, quality: 'hard' },
]

// 度数ごとのアスペクト名(専門用語を避け、度数は残す)
const ASPECT_NAME: Record<Lang, Record<number, string>> = {
  ja: { 0: 'ぴったり重なる(0°)', 60: 'ゆるやかな追い風(60°)', 90: '試練の角度(90°)', 120: '大きな追い風(120°)', 180: 'ひっぱり合い(180°)' },
  en: { 0: 'right on top of each other (0°)', 60: 'a gentle tailwind (60°)', 90: 'a testing angle (90°)', 120: 'a strong tailwind (120°)', 180: 'a tug-of-war (180°)' },
  es: { 0: 'justo superpuestos (0°)', 60: 'un viento suave a favor (60°)', 90: 'un ángulo de desafío (90°)', 120: 'un fuerte viento a favor (120°)', 180: 'un tira y afloja (180°)' },
}

const ITEM_TITLE: Record<Lang, (transit: string, natal: string, aspect: string) => string> = {
  ja: (t, n, a) => `運行中の${t} × あなたの${n} — ${a}`,
  en: (t, n, a) => `Transiting ${t} × your ${n} — ${a}`,
  es: (t, n, a) => `${t} en tránsito × tu ${n} — ${a}`,
}

const EMPTY_ITEM: Record<Lang, { title: string; text: string }> = {
  ja: {
    title: '大きな角度のない、静かな星回り',
    text: '運行中の星々はあなたの星と目立った角度を作っていません。外からの波が少ないぶん、自分のペースを保つほど運が安定する期間です。',
  },
  en: {
    title: 'A quiet sky, no major angles',
    text: 'The transiting stars form no notable angles to your chart. With fewer waves from outside, keeping your own pace steadies your luck this period.',
  },
  es: {
    title: 'Un cielo tranquilo, sin ángulos marcados',
    text: 'Los astros en tránsito no forman ángulos notables con tu carta. Con menos olas externas, mantener tu ritmo estabiliza tu suerte este periodo.',
  },
}

export interface FortuneItem {
  symbol: string
  title: string
  quality: Quality
  text: string
}

export interface Fortune {
  toneLabel: string
  toneText: string
  /** 調子の数値(+2=絶好調 〜 -2=充電期間)。相性占いの組み合わせ判定に使う */
  toneLevel: number
  skyNote: string
  items: FortuneItem[]
}

/** 黄経差を0〜180°に正規化 */
function separation(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

interface ToneDef {
  min: number
  level: number
}

const TONE_DEFS: ToneDef[] = [
  { min: 2, level: 2 },
  { min: 1, level: 1 },
  { min: -0.5, level: 0 },
  { min: -1.5, level: -1 },
  { min: -Infinity, level: -2 },
]

const TONE_TEXT: Record<Lang, Record<number, { label: string; text: string }>> = {
  ja: {
    2: { label: '絶好調', text: '星々が力強く味方する期間。攻めの選択が吉と出ます。' },
    1: { label: '追い風', text: '流れは味方。気になっていたことを進めるチャンスです。' },
    0: { label: '穏やか', text: '大きな波のない安定した星回り。足元を整えるのに向いています。' },
    [-1]: { label: '足場固め', text: 'やや緊張感のある配置。丁寧さを心がければ実りに変わります。' },
    [-2]: { label: '充電期間', text: '星からの宿題が多めの期間。無理せず、休息と準備を優先して。' },
  },
  en: {
    2: { label: 'Peak form', text: 'The stars strongly back you—bold choices pay off.' },
    1: { label: 'Tailwind', text: 'The flow favors you. A chance to push ahead on what’s been on your mind.' },
    0: { label: 'Calm', text: 'A steady sky with no big waves. Good for tending to the basics.' },
    [-1]: { label: 'Steady footing', text: 'A slightly tense layout. Care and diligence turn it into fruit.' },
    [-2]: { label: 'Recharge', text: 'The stars hand you plenty of homework. Don’t overdo it—rest and prepare.' },
  },
  es: {
    2: { label: 'En plena forma', text: 'Los astros te respaldan con fuerza: las decisiones audaces salen bien.' },
    1: { label: 'Viento a favor', text: 'La corriente te favorece. Buen momento para avanzar en lo que te rondaba.' },
    0: { label: 'Tranquilo', text: 'Un cielo estable sin grandes olas. Ideal para cuidar lo básico.' },
    [-1]: { label: 'Afianzar la base', text: 'Una configuración algo tensa. El cuidado la convierte en fruto.' },
    [-2]: { label: 'Recargar', text: 'Los astros te dejan bastante tarea. Sin forzar: prioriza descanso y preparación.' },
  },
}

function skyNoteText(lang: Lang, period: PeriodKey, sunSign: string, moonSign: string): string {
  const short = period === 'today' || period === 'tomorrow'
  if (lang === 'en') return short ? `Sun in ${sunSign}, Moon in ${moonSign}` : `Sun transiting through ${sunSign}`
  if (lang === 'es') return short ? `Sol en ${sunSign}, Luna en ${moonSign}` : `Sol en tránsito por ${sunSign}`
  return short ? `太陽は${sunSign}、月は${moonSign}を運行中` : `太陽は${sunSign}のエリアを運行中`
}

export function readFortune(natal: PlanetPos[], period: PeriodKey, now = new Date()): Fortune {
  const lang = getLang()
  const def = periodDef(period)
  const when = new Date(now.getTime() + def.offsetDays * 86400_000)

  const transitLons = new Map<TransitKey, number>()
  for (const key of def.bodies) {
    transitLons.set(key, eclipticLongitude(TRANSIT_BODY[key], when))
  }

  interface Hit {
    transit: TransitKey
    natalKey: PlanetKey
    aspect: AspectDef
    exactness: number
  }
  const hits: Hit[] = []
  for (const [tKey, tLon] of transitLons) {
    for (const n of natal) {
      const sep = separation(tLon, n.lon)
      for (const a of ASPECTS) {
        const off = Math.abs(sep - a.angle)
        if (off <= a.orb) {
          hits.push({ transit: tKey, natalKey: n.key, aspect: a, exactness: off })
        }
      }
    }
  }
  hits.sort((x, y) => x.exactness - y.exactness)
  const top = hits.slice(0, 4)

  const items: FortuneItem[] = top.map((h) => {
    const info = getPlanet(h.transit)
    return {
      symbol: info.symbol,
      title: ITEM_TITLE[lang](info.name, NATAL_LABEL[lang][h.natalKey], ASPECT_NAME[lang][h.aspect.angle]),
      quality: h.aspect.quality,
      text: TRANSIT_TEXT[lang][h.transit][h.aspect.quality],
    }
  })

  if (items.length === 0) {
    items.push({ symbol: '✦', title: EMPTY_ITEM[lang].title, quality: 'good', text: EMPTY_ITEM[lang].text })
  }

  const score = top.reduce(
    (s, h) => s + (h.aspect.quality === 'good' ? 1 : h.aspect.quality === 'hard' ? -1 : 0.3),
    0,
  )
  const tone = TONE_DEFS.find((t) => score >= t.min) ?? TONE_DEFS[2]
  const toneText = TONE_TEXT[lang][tone.level]

  const sunSign = signName(signIndex(eclipticLongitude(Body.Sun, when)))
  const moonSign = signName(signIndex(eclipticLongitude(Body.Moon, when)))
  const skyNote = skyNoteText(lang, period, sunSign, moonSign)

  return { toneLabel: toneText.label, toneText: toneText.text, toneLevel: tone.level, skyNote, items }
}
