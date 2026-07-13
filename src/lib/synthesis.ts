import { signIndex } from './astro'
import { signName, signKeywords, elementOf } from './signs'
import type { Element } from './signs'
import { getLang } from './i18n'
import type { Lang } from './i18n'

export interface Synthesis {
  intro: string
  balance: string
  relation: string
}

const ELEMENT_LABEL: Record<Lang, Record<Element, string>> = {
  ja: { 火: '火', 地: '地', 風: '風', 水: '水' },
  en: { 火: 'Fire', 地: 'Earth', 風: 'Air', 水: 'Water' },
  es: { 火: 'Fuego', 地: 'Tierra', 風: 'Aire', 水: 'Agua' },
}

const TRIPLE: Record<Lang, Record<Element, string>> = {
  ja: {
    火: '直感とひらめきを信じて突き進む、純度の高い炎の人。迷いのなさそれ自体が、周囲を動かす力になります。',
    地: '現実を一歩ずつ形にしていく、ぶれない大地の人。積み上げたものの確かさで信頼を集めます。',
    風: '知性と言葉で世界とつながる、生粋のコミュニケーター。風通しの良さがあなたの最大の武器です。',
    水: '感情と共感で世界を捉える、深くやさしい水の人。人の心の機微を汲み取る力は誰にも真似できません。',
  },
  en: {
    火: 'A pure flame who trusts intuition and inspiration to push forward—your very lack of hesitation moves those around you.',
    地: 'A steady earth soul who shapes reality one step at a time—the solidity of what you build earns deep trust.',
    風: 'A born communicator who connects to the world through intellect and words—your openness is your greatest weapon.',
    水: 'A deep, gentle water soul who grasps the world through emotion and empathy—no one reads the subtleties of the heart like you.',
  },
  es: {
    火: 'Un alma de fuego puro que confía en la intuición para avanzar: tu falta misma de dudas mueve a quienes te rodean.',
    地: 'Un alma de tierra firme que da forma a la realidad paso a paso: la solidez de lo que construyes inspira confianza.',
    風: 'Un comunicador nato que conecta con el mundo por el intelecto y las palabras: tu apertura es tu mayor arma.',
    水: 'Un alma de agua profunda y tierna que capta el mundo con emoción y empatía: nadie lee los matices del corazón como tú.',
  },
}

const DOMINANT: Record<Lang, Record<Element, string>> = {
  ja: {
    火: '基本は情熱ドリブン。心が「やりたい」と言ったときの推進力が持ち味です',
    地: '基本は現実主義。地に足のついた判断力と継続力が持ち味です',
    風: '基本は思考型。物事を俯瞰し、言葉にして整理する力が持ち味です',
    水: '基本は共感型。人の気持ちに寄り添い、場の空気を感じ取る力が持ち味です',
  },
  en: {
    火: 'At your core you are passion-driven, powered by whatever your heart wants to do',
    地: 'At your core you are a realist, with grounded judgment and staying power',
    風: 'At your core you are a thinker, able to step back and put things into words',
    水: 'At your core you are empathetic, sensing feelings and the mood of a room',
  },
  es: {
    火: 'En esencia te mueve la pasión, con el impulso de lo que tu corazón quiere hacer',
    地: 'En esencia eres realista, con criterio firme y constancia',
    風: 'En esencia eres pensador, capaz de ver el conjunto y ponerlo en palabras',
    水: 'En esencia eres empático, captando los sentimientos y el ambiente',
  },
}

const ACCENT: Record<Lang, Record<Element, string>> = {
  ja: { 火: 'ここぞという場面での勝負強さ', 地: '現実的な着地力', 風: '一歩引いた客観的な視点', 水: '細やかな共感力' },
  en: { 火: 'clutch strength when it matters', 地: 'a practical way of landing things', 風: 'a step-back, objective view', 水: 'a delicate, caring touch' },
  es: { 火: 'la fuerza en los momentos clave', 地: 'una manera práctica de aterrizar las cosas', 風: 'una mirada objetiva y distante', 水: 'un toque delicado y empático' },
}

function buildIntro(lang: Lang, ascN: string, ascK: string, sunN: string, sunK: string, moonN: string, moonK: string): string {
  if (lang === 'en')
    return `The first thing people meet in you is ${ascN}'s "${ascK}". The core that shows as they get closer is ${sunN}'s "${sunK}". And deep inside, where you recharge, lives ${moonN}'s "${moonK}".`
  if (lang === 'es')
    return `Lo primero que la gente percibe en ti es «${ascK}», de ${ascN}. El núcleo que se revela al conocerte es «${sunK}», de ${sunN}. Y en lo más hondo, donde recargas energía, vive «${moonK}», de ${moonN}.`
  return `人があなたに出会ってまず触れるのは、${ascN}の「${ascK}」。付き合いが深まるほど見えてくる核は、${sunN}の「${sunK}」。そして心の奥でエネルギーを充電しているのは、${moonN}の「${moonK}」です。`
}

export function synthesize(sunLon: number, moonLon: number, ascLon: number): Synthesis {
  const lang = getLang()
  const sunIdx = signIndex(sunLon)
  const moonIdx = signIndex(moonLon)
  const ascIdx = signIndex(ascLon)
  const sunN = signName(sunIdx)
  const moonN = signName(moonIdx)
  const ascN = signName(ascIdx)
  const L = ELEMENT_LABEL[lang]

  const intro = buildIntro(lang, ascN, signKeywords(ascIdx)[0], sunN, signKeywords(sunIdx)[0], moonN, signKeywords(moonIdx)[0])

  const elements: Element[] = [elementOf(sunLon), elementOf(moonLon), elementOf(ascLon)]
  const counts = new Map<Element, number>()
  for (const el of elements) counts.set(el, (counts.get(el) ?? 0) + 1)

  let balance: string
  if (counts.size === 1) {
    const e = elements[0]
    if (lang === 'en') balance = `All three—Sun, Moon and Rising—gather in the ${L[e]} element. ${TRIPLE.en[e]}`
    else if (lang === 'es') balance = `Los tres —Sol, Luna y Ascendente— se reúnen en el elemento ${L[e]}. ${TRIPLE.es[e]}`
    else balance = `3天体すべてが「${L[e]}」のエレメントに集まっています。${TRIPLE.ja[e]}`
  } else if (counts.size === 2) {
    const [domEl] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    const otherEl = elements.find((el) => el !== domEl)!
    if (lang === 'en')
      balance = `The ${L[domEl]} element holds two of the three, with one ${L[otherEl]} added. ${DOMINANT.en[domEl]}, with ${ACCENT.en[otherEl]} adding a nice accent.`
    else if (lang === 'es')
      balance = `El elemento ${L[domEl]} ocupa dos de los tres, con un toque de ${L[otherEl]}. ${DOMINANT.es[domEl]}, y ${ACCENT.es[otherEl]} añade un matiz especial.`
    else
      balance = `「${L[domEl]}」のエレメントが2天体を占め、そこに「${L[otherEl]}」がひとつ加わる配合。${DOMINANT.ja[domEl]}。そこへ${ACCENT.ja[otherEl]}がアクセントとして効いています。`
  } else {
    const labels = elements.map((e) => L[e])
    if (lang === 'en')
      balance = `Sun, Moon and Rising scatter across three different elements (${labels.join(', ')})—a many-sided blend. You naturally show a different face for each situation, with a wide range to draw on.`
    else if (lang === 'es')
      balance = `Sol, Luna y Ascendente se reparten en tres elementos distintos (${labels.join(', ')}): una mezcla polifacética. Muestras con naturalidad una cara distinta según la situación, con muchos recursos.`
    else
      balance = `太陽・月・上昇星座が「${labels.join('」「')}」と、3つの異なるエレメントに散らばる多面的な配合。場面によって自然と違う顔を出せる、引き出しの多い人です。`
  }

  const R = {
    en: {
      allSame: `Sun, Moon and Rising are all ${sunN}. Outer face, true self and first impression all align—a straightforward, pure ${sunN}.`,
      sunMoon: 'Sun and Moon share a sign—you were born around a new moon. Your outer face and true self match, so your feelings and actions never waver.',
      sunAsc: 'Sun and Rising share a sign. What people see is what they get—your first impression never turns out to be misleading.',
      moonAsc: 'Moon and Rising share a sign. Your true feelings show naturally on the surface—your unpretentious, down-to-earth vibe is your charm.',
      other: `First impression is ${ascN}; as people get to know you, your ${sunN} side emerges; and only to those you trust do you show your ${moonN} true self—someone with depth, full of discoveries the more one knows you.`,
    },
    es: {
      allSame: `Sol, Luna y Ascendente son todos ${sunN}. Tu cara externa, tu yo real y tu primera impresión coinciden: un ${sunN} puro y directo.`,
      sunMoon: 'El Sol y la Luna comparten signo: naciste cerca de una luna nueva. Tu cara externa y tu yo real coinciden, así que sentimiento y acción no titubean.',
      sunAsc: 'El Sol y el Ascendente comparten signo. Lo que se ve es lo que hay: tu primera impresión nunca resulta engañosa.',
      moonAsc: 'La Luna y el Ascendente comparten signo. Tus emociones reales asoman con naturalidad: tu aire genuino y sin adornos es tu encanto.',
      other: `La primera impresión es ${ascN}; al conocerte aparece tu lado ${sunN}; y solo a quien confías le muestras tu yo real de ${moonN}: alguien con profundidad, lleno de descubrimientos.`,
    },
    ja: {
      allSame: `太陽・月・上昇星座がすべて${sunN}。表の顔も素顔も第一印象も一貫した、まっすぐで純度の高い${sunN}です。`,
      sunMoon: '太陽と月が同じ星座 — 新月の頃の生まれです。表の顔と素顔が一致していて、思いと行動がぶれない一本芯の通ったタイプです。',
      sunAsc: '太陽と上昇星座が同じ星座。見た目の印象と中身が一致する「そのまんま」の人で、初対面の印象が後から裏切られることがありません。',
      moonAsc: '月と上昇星座が同じ星座。素顔の感情が自然と表ににじみ出るタイプで、飾らない等身大の雰囲気が魅力です。',
      other: `第一印象は${ascN}、付き合ううちに${sunN}らしさが見えてきて、心を許した相手にだけ${moonN}の素顔をのぞかせる — 知るほどに発見のある、奥行きをもった人です。`,
    },
  }[lang]

  let relation: string
  if (sunIdx === moonIdx && moonIdx === ascIdx) relation = R.allSame
  else if (sunIdx === moonIdx) relation = R.sunMoon
  else if (sunIdx === ascIdx) relation = R.sunAsc
  else if (moonIdx === ascIdx) relation = R.moonAsc
  else relation = R.other

  return { intro, balance, relation }
}
