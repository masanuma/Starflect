import { signIndex } from './astro'
import { SIGNS } from './signs'
import type { SignInfo } from './signs'

export interface Synthesis {
  intro: string
  balance: string
  relation: string
}

const TRIPLE_ELEMENT: Record<SignInfo['element'], string> = {
  火: '直感とひらめきを信じて突き進む、純度の高い炎の人。迷いのなさそれ自体が、周囲を動かす力になります。',
  地: '現実を一歩ずつ形にしていく、ぶれない大地の人。積み上げたものの確かさで信頼を集めます。',
  風: '知性と言葉で世界とつながる、生粋のコミュニケーター。風通しの良さがあなたの最大の武器です。',
  水: '感情と共感で世界を捉える、深くやさしい水の人。人の心の機微を汲み取る力は誰にも真似できません。',
}

const DOMINANT_ELEMENT: Record<SignInfo['element'], string> = {
  火: '基本は情熱ドリブン。心が「やりたい」と言ったときの推進力が持ち味です',
  地: '基本は現実主義。地に足のついた判断力と継続力が持ち味です',
  風: '基本は思考型。物事を俯瞰し、言葉にして整理する力が持ち味です',
  水: '基本は共感型。人の気持ちに寄り添い、場の空気を感じ取る力が持ち味です',
}

const ACCENT_ELEMENT: Record<SignInfo['element'], string> = {
  火: 'ここぞという場面での勝負強さ',
  地: '現実的な着地力',
  風: '一歩引いた客観的な視点',
  水: '細やかな共感力',
}

/**
 * 太陽・月・上昇星座の3天体から総合分析文を生成する。
 */
export function synthesize(sunLon: number, moonLon: number, ascLon: number): Synthesis {
  const sunIdx = signIndex(sunLon)
  const moonIdx = signIndex(moonLon)
  const ascIdx = signIndex(ascLon)
  const sun = SIGNS[sunIdx]
  const moon = SIGNS[moonIdx]
  const asc = SIGNS[ascIdx]

  const intro =
    `人があなたに出会ってまず触れるのは、${asc.name}の「${asc.keywords[0]}」。` +
    `付き合いが深まるほど見えてくる核は、${sun.name}の「${sun.keywords[0]}」。` +
    `そして心の奥でエネルギーを充電しているのは、${moon.name}の「${moon.keywords[0]}」です。`

  const elements = [sun.element, moon.element, asc.element]
  const counts = new Map<SignInfo['element'], number>()
  for (const el of elements) counts.set(el, (counts.get(el) ?? 0) + 1)

  let balance: string
  if (counts.size === 1) {
    balance = `3天体すべてが「${sun.element}」のエレメントに集まっています。${TRIPLE_ELEMENT[sun.element]}`
  } else if (counts.size === 2) {
    const [domEl] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    const otherEl = elements.find((el) => el !== domEl)!
    balance =
      `「${domEl}」のエレメントが2天体を占め、そこに「${otherEl}」がひとつ加わる配合。` +
      `${DOMINANT_ELEMENT[domEl]}。そこへ${ACCENT_ELEMENT[otherEl]}がアクセントとして効いています。`
  } else {
    balance =
      `太陽・月・上昇星座が「${elements.join('」「')}」と、3つの異なるエレメントに散らばる多面的な配合。` +
      `場面によって自然と違う顔を出せる、引き出しの多い人です。`
  }

  let relation: string
  if (sunIdx === moonIdx && moonIdx === ascIdx) {
    relation = `太陽・月・上昇星座がすべて${sun.name}。表の顔も素顔も第一印象も一貫した、まっすぐで純度の高い${sun.name}です。`
  } else if (sunIdx === moonIdx) {
    relation =
      '太陽と月が同じ星座 — 新月の頃の生まれです。表の顔と素顔が一致していて、思いと行動がぶれない一本芯の通ったタイプです。'
  } else if (sunIdx === ascIdx) {
    relation =
      '太陽と上昇星座が同じ星座。見た目の印象と中身が一致する「そのまんま」の人で、初対面の印象が後から裏切られることがありません。'
  } else if (moonIdx === ascIdx) {
    relation =
      '月と上昇星座が同じ星座。素顔の感情が自然と表ににじみ出るタイプで、飾らない等身大の雰囲気が魅力です。'
  } else {
    relation =
      `第一印象は${asc.name}、付き合ううちに${sun.name}らしさが見えてきて、心を許した相手にだけ${moon.name}の素顔をのぞかせる — 知るほどに発見のある、奥行きをもった人です。`
  }

  return { intro, balance, relation }
}
