import { elementOf, elementLabel } from './signs'
import type { Element } from './signs'
import { getLang } from './i18n'
import type { Lang } from './i18n'
import type { PlanetPos, PeriodKey } from './types'

/** ひとり分の相性用チャート */
export interface PairPerson {
  name: string
  dateLabel: string
  /** 時刻未入力なら true(月星座は正午で近似) */
  approxTime: boolean
  planets: PlanetPos[]
}

export interface PairData {
  a: PairPerson
  b: PairPerson
  period: PeriodKey
}

/** エレメント同士の関係: 共鳴(同じ) / 好相性(火×風・地×水) / 化学反応(その他) */
export type ElementRel = 'same' | 'friend' | 'spark'

export function relOf(x: Element, y: Element): ElementRel {
  if (x === y) return 'same'
  const pair = [x, y].sort().join('')
  if (pair === '火風' || pair === '地水') return 'friend'
  return 'spark'
}

const REL_LABEL_L: Record<Lang, Record<ElementRel, string>> = {
  ja: { same: '共鳴', friend: '好相性', spark: '化学反応' },
  en: { same: 'Resonance', friend: 'Good Match', spark: 'Chemistry' },
  es: { same: 'Resonancia', friend: 'Buena Sintonía', spark: 'Química' },
  fr: { same: 'Résonance', friend: 'Belle Entente', spark: 'Alchimie' },
  it: { same: 'Risonanza', friend: 'Buona Intesa', spark: 'Chimica' },
  pt: { same: 'Ressonância', friend: 'Boa Sintonia', spark: 'Química' },
  ko: { same: '공명', friend: '찰떡궁합', spark: '케미' },
}

/** 関係ラベル(現在言語) */
export const relLabel = (rel: ElementRel): string => (REL_LABEL_L[getLang()] ?? REL_LABEL_L.ja)[rel]

const REL_SCORE: Record<ElementRel, number> = { same: 2.0, friend: 1.8, spark: 1.0 }

/** 表の顔どうし(太陽×太陽)の文 */
const SUN_TEXT: Record<Lang, Record<ElementRel, string>> = {
  ja: {
    same: 'ふるまいのテンポがそっくり。一緒にいて疲れない、素の距離感で付き合えるふたりです。',
    friend: 'ノリとテンポが自然に噛み合います。片方が動けばもう片方が乗る、心地よいリズムのふたり。',
    spark: 'ペースは正反対。だからこそ相手の動き方が新鮮で、自分にない世界を見せてくれます。',
  },
  en: {
    same: 'Your everyday tempos are alike. Easy to be around, you relate at your natural, unguarded distance.',
    friend: 'Your vibes and pace mesh naturally. One moves, the other follows—a comfortable rhythm.',
    spark: 'Your paces are opposite. That’s exactly why the other feels fresh, showing you a world you don’t have.',
  },
  es: {
    same: 'Vuestros ritmos cotidianos se parecen. Cómodos juntos, os tratáis con vuestra distancia natural y sin corazas.',
    friend: 'Vuestra onda y vuestro ritmo encajan solos. Uno se mueve, el otro le sigue: un ritmo agradable.',
    spark: 'Vuestros ritmos son opuestos. Justo por eso el otro resulta fresco y os muestra un mundo que no tenéis.',
  },
  fr: {
    same: 'Vos tempos du quotidien se ressemblent. On se sent bien ensemble, à sa juste distance, sans faux-semblants.',
    friend: 'Votre énergie et votre rythme s’accordent naturellement. L’un bouge, l’autre suit : un tempo agréable.',
    spark: 'Vos rythmes sont opposés. C’est justement ce qui rend l’autre si rafraîchissant : il vous ouvre un monde inconnu.',
  },
  it: {
    same: 'I vostri ritmi quotidiani si somigliano. Si sta bene insieme, alla giusta distanza, senza maschere.',
    friend: 'La vostra energia e il vostro ritmo si incastrano da soli. Uno si muove, l’altro segue: che bel ritmo.',
    spark: 'I vostri ritmi sono opposti. Proprio per questo l’altro sa di novità e vi mostra un mondo che non avete.',
  },
  pt: {
    same: 'Os ritmos do dia a dia se parecem. É fácil estar juntos, na distância natural de vocês, sem armaduras.',
    friend: 'A vibe e o ritmo de vocês se encaixam sozinhos. Um se move, o outro acompanha: um compasso gostoso.',
    spark: 'Os ritmos são opostos. É justamente por isso que o outro parece novo e mostra um mundo que você não tem.',
  },
  ko: {
    same: '일상의 템포가 쏙 닮았어요. 함께 있어도 지치지 않고, 꾸밈없는 거리감으로 지낼 수 있는 두 사람.',
    friend: '분위기와 템포가 자연스럽게 맞물려요. 한쪽이 움직이면 다른 쪽이 따라오는, 기분 좋은 리듬의 두 사람.',
    spark: '페이스가 정반대예요. 그래서 상대의 움직임이 늘 신선하고, 내게 없는 세계를 보여줘요.',
  },
}

/** 心どうし(月×月)の文 */
const MOON_TEXT: Record<Lang, Record<ElementRel, string>> = {
  ja: {
    same: '心の充電方法が同じ。言葉にしなくても「わかる」が通じる、安心感の強い組み合わせです。',
    friend: '感情の波長が合いやすく、落ち込んだとき・嬉しいときの寄り添い方が自然に噛み合います。',
    spark: '心の動き方は別モノ。すれ違いも起きますが、理解し合えたときの絆は誰より深くなります。',
  },
  en: {
    same: 'You recharge the same way. A “you just get it” without words—a deeply reassuring match.',
    friend: 'Your emotional wavelengths align easily; how you comfort each other in lows and share the highs meshes naturally.',
    spark: 'Your hearts move differently. Misfires happen, but once you understand each other, the bond runs deeper than any.',
  },
  es: {
    same: 'Recargáis igual. Un “te entiendo” sin palabras: una combinación que da mucha seguridad.',
    friend: 'Vuestras longitudes de onda emocionales se alinean fácil; os arropáis en los bajones y compartís las alegrías con naturalidad.',
    spark: 'Vuestros corazones se mueven distinto. Habrá desencuentros, pero al entenderos el vínculo se hace más hondo que ninguno.',
  },
  fr: {
    same: 'Vous rechargez vos batteries de la même façon. Un « je te comprends » sans mots : une entente très rassurante.',
    friend: 'Vos longueurs d’onde émotionnelles s’accordent facilement ; vous vous soutenez dans les creux et partagez les joies avec naturel.',
    spark: 'Vos cœurs vibrent différemment. Il y aura des faux pas, mais une fois que vous vous comprenez, le lien devient plus profond que tout.',
  },
  it: {
    same: 'Vi ricaricate allo stesso modo. Un « ti capisco » senza parole: un’intesa che dà tanta sicurezza.',
    friend: 'Le vostre lunghezze d’onda emotive si allineano facilmente; vi consolate nei momenti no e condividete le gioie con naturalezza.',
    spark: 'I vostri cuori si muovono in modo diverso. Ci saranno incomprensioni, ma quando vi capite il legame diventa più profondo di ogni altro.',
  },
  pt: {
    same: 'Vocês recarregam do mesmo jeito. Um « eu te entendo » sem palavras: uma combinação que passa muita segurança.',
    friend: 'As frequências emocionais se alinham fácil; vocês se acolhem nas quedas e dividem as alegrias com naturalidade.',
    spark: 'Os corações se movem de forma diferente. Vai haver desencontros, mas quando se entendem o laço fica mais fundo que qualquer outro.',
  },
  ko: {
    same: '마음을 충전하는 방식이 같아요. 말하지 않아도 “알아”가 통하는, 안정감이 강한 조합이에요.',
    friend: '감정의 파장이 잘 맞아서, 우울할 때·기쁠 때 서로 다가가는 방식이 자연스럽게 맞물려요.',
    spark: '마음이 움직이는 방식은 서로 달라요. 엇갈림도 생기지만, 이해하고 나면 그 누구보다 깊은 유대가 돼요.',
  },
}

/** クロス(あなたの太陽×相手の月、あなたの月×相手の太陽)の文 */
function crossText(lang: Lang, r1: ElementRel, r2: ElementRel): string {
  const sparks = (r1 === 'spark' ? 1 : 0) + (r2 === 'spark' ? 1 : 0)
  const T = {
    ja: [
      '素の自分を見せ合える関係。あなたの外の顔と相手の心、その逆も、互いに心地よく噛み合います。',
      '片方が甘えて、片方が受け止める——自然と役割が生まれる関係。凸凹がちょうどいい組み合わせです。',
      'ミステリアスに惹かれ合う関係。「わからない」からこそ、もっと知りたくなるふたりです。',
    ],
    en: [
      'A relationship where you show your real selves. Your outer face and their heart—and vice versa—mesh comfortably.',
      'One leans in, the other holds space—roles arise naturally. The give-and-take fits just right.',
      'A mysteriously magnetic pull. Precisely because you “don’t get” each other, you want to know more.',
    ],
    es: [
      'Una relación donde os mostráis tal cual sois. Tu cara externa y su corazón —y al revés— encajan con comodidad.',
      'Uno se apoya, el otro sostiene: los roles surgen solos. El toma y daca encaja perfecto.',
      'Una atracción magnética y misteriosa. Justo porque no os “entendéis”, queréis saber más.',
    ],
    fr: [
      'Une relation où vous vous montrez tels que vous êtes. Votre visage extérieur et son cœur — et inversement — s’accordent en douceur.',
      'L’un se laisse aller, l’autre accueille : les rôles naissent d’eux-mêmes. Le donnant-donnant tombe pile.',
      'Une attirance magnétique et mystérieuse. Justement parce que vous ne vous « comprenez » pas, vous voulez en savoir plus.',
    ],
    it: [
      'Una relazione in cui vi mostrate per come siete. Il tuo lato esteriore e il suo cuore — e viceversa — si incastrano con comodità.',
      'Uno si appoggia, l’altro accoglie: i ruoli nascono da soli. Il dare e avere calza a pennello.',
      'Un’attrazione magnetica e misteriosa. Proprio perché non vi « capite », volete conoscervi di più.',
    ],
    pt: [
      'Uma relação em que vocês se mostram como são. Seu lado de fora e o coração do outro — e vice-versa — se encaixam com conforto.',
      'Um se apoia, o outro acolhe: os papéis surgem sozinhos. O toma lá dá cá encaixa perfeito.',
      'Uma atração magnética e misteriosa. Justamente porque não se « entendem », vocês querem saber mais.',
    ],
    ko: [
      '있는 그대로를 서로 보여줄 수 있는 관계. 당신의 겉모습과 상대의 마음, 그 반대도 서로 편하게 맞물려요.',
      '한쪽이 기대고 한쪽이 받아주는 — 자연스럽게 역할이 생기는 관계. 서로의 빈틈이 딱 알맞은 조합이에요.',
      '미스터리하게 끌리는 관계. “잘 모르겠으니까” 오히려 더 알고 싶어지는 두 사람이에요.',
    ],
  }[lang]
  return T[sparks]
}

/** タイプ相性のニックネーム(太陽の関係 × 月の関係)。emoji は言語非依存 */
const NICK_EMOJI: Record<ElementRel, Record<ElementRel, string>> = {
  same: { same: '👯', friend: '🤝', spark: '🎭' },
  friend: { same: '💞', friend: '🌈', spark: '🎢' },
  spark: { same: '🧲', friend: '☕', spark: '⚡' },
}

const NICK_NAME: Record<Lang, Record<ElementRel, Record<ElementRel, string>>> = {
  ja: {
    same: { same: 'まるで双子タイプ', friend: 'あうんの呼吸タイプ', spark: '似た者同士、心は別世界タイプ' },
    friend: { same: '深いところで通じ合うタイプ', friend: 'ベストパートナータイプ', spark: '楽しいけど時々嵐タイプ' },
    spark: { same: '見た目は正反対、心は同じタイプ', friend: '慣れるほど心地いいタイプ', spark: '化学反応MAXタイプ' },
  },
  en: {
    same: { same: 'Practically Twins', friend: 'In Perfect Sync', spark: 'Alike Outside, Worlds Apart Inside' },
    friend: { same: 'Connected Deep Down', friend: 'Best Partners', spark: 'Fun with Occasional Storms' },
    spark: { same: 'Opposite Looks, Same Heart', friend: 'Better the More You Get Used to It', spark: 'Maximum Chemistry' },
  },
  es: {
    same: { same: 'Casi gemelos', friend: 'En perfecta sintonía', spark: 'Iguales fuera, mundos aparte dentro' },
    friend: { same: 'Conectados en lo profundo', friend: 'Mejores compañeros', spark: 'Divertidos con tormentas ocasionales' },
    spark: { same: 'Opuestos por fuera, iguales de corazón', friend: 'Mejor cuanto más os acostumbráis', spark: 'Química al máximo' },
  },
  fr: {
    same: { same: 'Presque jumeaux', friend: 'En parfaite harmonie', spark: 'Pareils dehors, mondes à part dedans' },
    friend: { same: 'Reliés au plus profond', friend: 'Les partenaires idéaux', spark: 'Fun avec quelques orages' },
    spark: { same: 'Opposés dehors, un seul cœur', friend: 'De mieux en mieux avec le temps', spark: 'Alchimie à fond' },
  },
  it: {
    same: { same: 'Quasi gemelli', friend: 'In perfetta sintonia', spark: 'Uguali fuori, mondi a parte dentro' },
    friend: { same: 'Uniti nel profondo', friend: 'Partner perfetti', spark: 'Divertenti con qualche tempesta' },
    spark: { same: 'Opposti fuori, stesso cuore', friend: 'Meglio più ci si abitua', spark: 'Chimica al massimo' },
  },
  pt: {
    same: { same: 'Quase gêmeos', friend: 'Em perfeita sintonia', spark: 'Iguais por fora, mundos à parte por dentro' },
    friend: { same: 'Ligados lá no fundo', friend: 'Os melhores parceiros', spark: 'Divertidos com tempestades ocasionais' },
    spark: { same: 'Opostos por fora, mesmo coração', friend: 'Melhor quanto mais se acostumam', spark: 'Química no máximo' },
  },
  ko: {
    same: { same: '쌍둥이 같은 타입', friend: '척하면 척 타입', spark: '겉은 닮은꼴, 속은 딴 세상 타입' },
    friend: { same: '깊은 곳에서 통하는 타입', friend: '최고의 파트너 타입', spark: '즐겁지만 가끔 폭풍 타입' },
    spark: { same: '겉은 정반대, 속은 똑같은 타입', friend: '익숙해질수록 편안한 타입', spark: '케미 MAX 타입' },
  },
}

const DETAIL_TITLE: Record<Lang, (aSun: string, bSun: string, aMoon: string, bMoon: string) => [string, string, string]> = {
  ja: (aSun, bSun, aMoon, bMoon) => [
    `表の顔どうし(太陽 ${aSun}×${bSun})`,
    `心どうし(月 ${aMoon}×${bMoon})`,
    'クロス(あなたの表×相手の心)',
  ],
  en: (aSun, bSun, aMoon, bMoon) => [
    `Outer selves (Sun ${aSun} × ${bSun})`,
    `Inner hearts (Moon ${aMoon} × ${bMoon})`,
    'Cross (your outer × their heart)',
  ],
  es: (aSun, bSun, aMoon, bMoon) => [
    `Caras externas (Sol ${aSun} × ${bSun})`,
    `Corazones (Luna ${aMoon} × ${bMoon})`,
    'Cruce (tu cara × su corazón)',
  ],
  fr: (aSun, bSun, aMoon, bMoon) => [
    `Visages extérieurs (Soleil ${aSun} × ${bSun})`,
    `Cœurs (Lune ${aMoon} × ${bMoon})`,
    'Croisé (ton extérieur × son cœur)',
  ],
  it: (aSun, bSun, aMoon, bMoon) => [
    `Volti esteriori (Sole ${aSun} × ${bSun})`,
    `Cuori (Luna ${aMoon} × ${bMoon})`,
    'Incrocio (il tuo esterno × il suo cuore)',
  ],
  pt: (aSun, bSun, aMoon, bMoon) => [
    `Lados de fora (Sol ${aSun} × ${bSun})`,
    `Corações (Lua ${aMoon} × ${bMoon})`,
    'Cruzado (seu exterior × o coração do outro)',
  ],
  ko: (aSun, bSun, aMoon, bMoon) => [
    `겉모습끼리 (태양 ${aSun} × ${bSun})`,
    `마음끼리 (달 ${aMoon} × ${bMoon})`,
    '크로스 (당신의 겉 × 상대의 마음)',
  ],
}

export interface CompatDetail {
  title: string
  rel: ElementRel
  text: string
}

export interface Compat {
  /** 55〜98の相性スコア */
  percent: number
  emoji: string
  nickname: string
  details: CompatDetail[]
}

const elemOf = (planets: PlanetPos[], key: 'sun' | 'moon'): Element => {
  const p = planets.find((pp) => pp.key === key)
  if (!p) throw new Error(`missing ${key}`)
  return elementOf(p.lon)
}

/** ふたりのタイプ相性を判定する */
export function compatOf(a: PairPerson, b: PairPerson): Compat {
  const lang = getLang()
  const aSun = elemOf(a.planets, 'sun')
  const aMoon = elemOf(a.planets, 'moon')
  const bSun = elemOf(b.planets, 'sun')
  const bMoon = elemOf(b.planets, 'moon')

  const sunRel = relOf(aSun, bSun)
  const moonRel = relOf(aMoon, bMoon)
  const cross1 = relOf(aSun, bMoon)
  const cross2 = relOf(aMoon, bSun)

  // 心(月)の関係を最重視、次いで表の顔、クロスは補助
  const score =
    REL_SCORE[sunRel] * 1.0 + REL_SCORE[moonRel] * 1.4 + REL_SCORE[cross1] * 0.6 + REL_SCORE[cross2] * 0.6
  const max = 2.0 * 3.6
  const min = 1.0 * 3.6
  const percent = Math.round(55 + ((score - min) / (max - min)) * 43)

  const RANK: Record<ElementRel, number> = { spark: 0, friend: 1, same: 2 }
  const crossRel = RANK[cross1] <= RANK[cross2] ? cross1 : cross2

  const titles = DETAIL_TITLE[lang](
    elementLabel(aSun), elementLabel(bSun), elementLabel(aMoon), elementLabel(bMoon),
  )

  return {
    percent,
    emoji: NICK_EMOJI[sunRel][moonRel],
    nickname: NICK_NAME[lang][sunRel][moonRel],
    details: [
      { title: titles[0], rel: sunRel, text: SUN_TEXT[lang][sunRel] },
      { title: titles[1], rel: moonRel, text: MOON_TEXT[lang][moonRel] },
      { title: titles[2], rel: crossRel, text: crossText(lang, cross1, cross2) },
    ],
  }
}

/**
 * ふたりの調子(toneLevel)の組み合わせから、その期間の過ごし方のヒントを返す。
 * レベル: +1以上=好調 / 0=穏やか / -1以下=充電
 */
export function pairTip(levelA: number, levelB: number, nameA: string, nameB: string): string {
  const lang = getLang()
  const bucket = (n: number) => (n >= 1 ? 2 : n >= 0 ? 1 : 0)
  const a = bucket(levelA)
  const b = bucket(levelB)
  const [hi, lo, hiName, loName] = a >= b ? [a, b, nameA, nameB] : [b, a, nameB, nameA]

  const T = {
    ja: {
      hh: `🚀 ふたりそろって追い風!新しいこと・おでかけ・大事な話、この期間が狙い目です。`,
      hm: `🌤️ ${hiName}に勢いがある期間。${hiName}から誘うと、するっと楽しい流れになります。`,
      hl: `🤲 ${hiName}は好調、${loName}は充電中。${hiName}が聞き役・支え役に回ると、ぐっと絆が深まります。`,
      mm: `☕ 穏やかなふたり日和。頑張らない時間の共有(散歩・カフェ・のんびり)が正解です。`,
      ml: `🕯️ ${loName}は少しお疲れ気味の星回り。予定を詰めず、${hiName}がペースを合わせてあげると◎。`,
      ll: `🛋️ ふたりとも充電期間。無理に盛り上げず、静かに一緒にいるだけで十分な時期です。`,
    },
    en: {
      hh: `🚀 Both of you have a tailwind! New things, outings, big talks—this period is the sweet spot.`,
      hm: `🌤️ ${hiName} has momentum this period. If ${hiName} does the inviting, it slides into something fun.`,
      hl: `🤲 ${hiName} is on a roll while ${loName} recharges. If ${hiName} plays listener and supporter, the bond deepens.`,
      mm: `☕ A calm day for two. Sharing unhurried time (a walk, a café, taking it easy) is the answer.`,
      ml: `🕯️ ${loName} is under a slightly tired sky. Don’t overbook; it works best if ${hiName} matches the pace.`,
      ll: `🛋️ You’re both in a recharge period. No need to force the mood—just being quietly together is plenty.`,
    },
    es: {
      hh: `🚀 ¡Los dos con viento a favor! Cosas nuevas, salidas, conversaciones importantes: este periodo es el momento ideal.`,
      hm: `🌤️ ${hiName} tiene impulso este periodo. Si ${hiName} propone el plan, todo fluye hacia algo divertido.`,
      hl: `🤲 ${hiName} está en racha y ${loName} recarga. Si ${hiName} escucha y apoya, el vínculo se fortalece.`,
      mm: `☕ Un día tranquilo para dos. Compartir tiempo sin prisas (un paseo, un café, relajarse) es el acierto.`,
      ml: `🕯️ ${loName} está bajo un cielo algo cansado. Sin llenar la agenda; funciona mejor si ${hiName} adapta el ritmo.`,
      ll: `🛋️ Los dos en periodo de recarga. No hace falta forzar el ánimo: estar juntos en calma ya basta.`,
    },
    fr: {
      hh: `🚀 Vent en poupe pour vous deux ! Nouveautés, sorties, discussions importantes : cette période est le moment idéal.`,
      hm: `🌤️ ${hiName} a le vent en poupe cette période. Si c’est ${hiName} qui propose, tout glisse vers quelque chose de sympa.`,
      hl: `🤲 ${hiName} est sur sa lancée pendant que ${loName} recharge. Si ${hiName} écoute et soutient, le lien se renforce.`,
      mm: `☕ Une journée tranquille à deux. Partager un temps sans hâte (une balade, un café, se détendre) est la clé.`,
      ml: `🕯️ ${loName} est sous un ciel un peu fatigué. Ne surchargez pas l’agenda ; ça marche mieux si ${hiName} s’adapte au rythme.`,
      ll: `🛋️ Vous êtes tous les deux en période de recharge. Pas besoin de forcer l’ambiance : rester ensemble au calme suffit.`,
    },
    it: {
      hh: `🚀 Vento in poppa per entrambi! Cose nuove, uscite, discorsi importanti: questo periodo è il momento giusto.`,
      hm: `🌤️ ${hiName} ha lo slancio in questo periodo. Se è ${hiName} a proporre, tutto scivola verso qualcosa di divertente.`,
      hl: `🤲 ${hiName} è in forma mentre ${loName} ricarica. Se ${hiName} ascolta e sostiene, il legame si rafforza.`,
      mm: `☕ Una giornata tranquilla per due. Condividere del tempo senza fretta (una passeggiata, un caffè, rilassarsi) è la scelta giusta.`,
      ml: `🕯️ ${loName} è sotto un cielo un po’ stanco. Niente agenda piena; funziona meglio se ${hiName} si adatta al ritmo.`,
      ll: `🛋️ Siete entrambi in periodo di ricarica. Non serve forzare l’umore: stare insieme in tranquillità basta e avanza.`,
    },
    pt: {
      hh: `🚀 Vento a favor para os dois! Coisas novas, passeios, conversas importantes: este período é a hora certa.`,
      hm: `🌤️ ${hiName} está com gás neste período. Se ${hiName} fizer o convite, tudo desliza para algo divertido.`,
      hl: `🤲 ${hiName} está embalado enquanto ${loName} recarrega. Se ${hiName} escutar e apoiar, o laço se fortalece.`,
      mm: `☕ Um dia tranquilo a dois. Compartilhar um tempo sem pressa (um passeio, um café, relaxar) é o acerto.`,
      ml: `🕯️ ${loName} está sob um céu meio cansado. Sem lotar a agenda; funciona melhor se ${hiName} acompanhar o ritmo.`,
      ll: `🛋️ Os dois em período de recarga. Não precisa forçar o clima: ficar juntos na paz já basta.`,
    },
    ko: {
      hh: `🚀 두 사람 모두 순풍! 새로운 일·나들이·중요한 이야기, 이 시기가 딱 좋아요.`,
      hm: `🌤️ ${hiName}에게 기운이 넘치는 시기. ${hiName}가 먼저 이끌면 술술 즐거운 흐름이 돼요.`,
      hl: `🤲 ${hiName}는 컨디션 좋고, ${loName}는 충전 중. ${hiName}가 들어주고 받쳐주는 역할을 하면 유대가 훨씬 깊어져요.`,
      mm: `☕ 잔잔한 둘만의 날. 애쓰지 않는 시간(산책·카페·느긋하게)을 함께하는 게 정답이에요.`,
      ml: `🕯️ ${loName}는 조금 지친 별자리 흐름. 일정을 몰아넣지 말고 ${hiName}가 페이스를 맞춰주면 좋아요.`,
      ll: `🛋️ 둘 다 충전 기간. 억지로 띄우지 말고, 조용히 함께 있는 것만으로 충분한 시기예요.`,
    },
  }[lang]

  if (hi === 2 && lo === 2) return T.hh
  if (hi === 2 && lo === 1) return T.hm
  if (hi === 2 && lo === 0) return T.hl
  if (hi === 1 && lo === 1) return T.mm
  if (hi === 1 && lo === 0) return T.ml
  return T.ll
}
