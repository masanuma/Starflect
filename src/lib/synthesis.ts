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
  fr: { 火: 'Feu', 地: 'Terre', 風: 'Air', 水: 'Eau' },
  it: { 火: 'Fuoco', 地: 'Terra', 風: 'Aria', 水: 'Acqua' },
  pt: { 火: 'Fogo', 地: 'Terra', 風: 'Ar', 水: 'Água' },
  ko: { 火: '불', 地: '흙', 風: '바람', 水: '물' },
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
  fr: {
    火: 'Une flamme pure qui se fie à son intuition et à son inspiration pour avancer : c\'est votre absence même d\'hésitation qui entraîne ceux qui vous entourent.',
    地: 'Une âme de terre stable qui façonne la réalité pas à pas : la solidité de ce que vous bâtissez inspire une confiance profonde.',
    風: 'Un communicant né qui relie au monde par l\'intelligence et les mots : votre ouverture est votre plus grande force.',
    水: 'Une âme d\'eau profonde et douce qui saisit le monde par l\'émotion et l\'empathie : personne ne lit les nuances du cœur comme vous.',
  },
  it: {
    火: 'Una fiamma pura che si affida all\'intuito e all\'ispirazione per andare avanti: è proprio la tua assenza di esitazione a mettere in moto chi ti circonda.',
    地: 'Un\'anima di terra salda che dà forma alla realtà un passo alla volta: la solidità di ciò che costruisci ispira fiducia profonda.',
    風: 'Un comunicatore nato che si lega al mondo con l\'intelletto e le parole: la tua apertura è la tua arma più grande.',
    水: 'Un\'anima d\'acqua profonda e gentile che coglie il mondo con emozione ed empatia: nessuno legge le sfumature del cuore come te.',
  },
  pt: {
    火: 'Uma chama pura que confia na intuição e na inspiração para seguir em frente: é a sua própria falta de hesitação que move quem está à sua volta.',
    地: 'Uma alma de terra firme que molda a realidade passo a passo: a solidez do que você constrói inspira profunda confiança.',
    風: 'Um comunicador nato que se conecta ao mundo pelo intelecto e pelas palavras: a sua abertura é a sua maior arma.',
    水: 'Uma alma de água profunda e gentil que capta o mundo pela emoção e pela empatia: ninguém lê as sutilezas do coração como você.',
  },
  ko: {
    火: '직관과 영감을 믿고 나아가는 순수한 불꽃 같은 사람. 망설임 없는 그 모습 자체가 주위를 움직이는 힘이 됩니다.',
    地: '현실을 한 걸음씩 형태로 만들어 가는 흔들림 없는 대지의 사람. 쌓아 올린 것의 단단함으로 깊은 신뢰를 모읍니다.',
    風: '지성과 말로 세상과 이어지는 타고난 커뮤니케이터. 트인 소통력이 당신의 가장 큰 무기입니다.',
    水: '감정과 공감으로 세상을 받아들이는 깊고 다정한 물의 사람. 마음의 미묘한 결을 읽어내는 힘은 누구도 흉내 낼 수 없습니다.',
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
  fr: {
    火: 'Au fond, c\'est la passion qui vous anime, portée par l\'élan de ce que votre cœur veut faire',
    地: 'Au fond, vous êtes réaliste, doté d\'un jugement ancré et de persévérance',
    風: 'Au fond, vous êtes un penseur, capable de prendre du recul et de mettre les choses en mots',
    水: 'Au fond, vous êtes empathique, sentant les émotions et l\'atmosphère d\'un lieu',
  },
  it: {
    火: 'Nel profondo ti muove la passione, spinta da ciò che il tuo cuore desidera fare',
    地: 'Nel profondo sei un realista, con un giudizio saldo e costanza',
    風: 'Nel profondo sei un pensatore, capace di fare un passo indietro e mettere in parole le cose',
    水: 'Nel profondo sei empatico, cogliendo i sentimenti e l\'atmosfera di un ambiente',
  },
  pt: {
    火: 'No fundo, é a paixão que o move, impulsionada por aquilo que o seu coração quer fazer',
    地: 'No fundo, você é realista, com um discernimento firme e persistência',
    風: 'No fundo, você é um pensador, capaz de recuar e colocar as coisas em palavras',
    水: 'No fundo, você é empático, sentindo as emoções e o clima de um ambiente',
  },
  ko: {
    火: '기본은 열정 중심. 마음이 "하고 싶다"고 말할 때의 추진력이 강점입니다',
    地: '기본은 현실주의. 땅에 발을 붙인 판단력과 지속력이 강점입니다',
    風: '기본은 사고형. 상황을 조망하고 말로 정리하는 힘이 강점입니다',
    水: '기본은 공감형. 사람의 마음에 다가가고 그 자리의 분위기를 느끼는 힘이 강점입니다',
  },
}

const ACCENT: Record<Lang, Record<Element, string>> = {
  ja: { 火: 'ここぞという場面での勝負強さ', 地: '現実的な着地力', 風: '一歩引いた客観的な視点', 水: '細やかな共感力' },
  en: { 火: 'clutch strength when it matters', 地: 'a practical way of landing things', 風: 'a step-back, objective view', 水: 'a delicate, caring touch' },
  es: { 火: 'la fuerza en los momentos clave', 地: 'una manera práctica de aterrizar las cosas', 風: 'una mirada objetiva y distante', 水: 'un toque delicado y empático' },
  fr: { 火: 'la force dans les moments décisifs', 地: 'une manière concrète de faire aboutir les choses', 風: 'un regard objectif et distancié', 水: 'une délicatesse pleine d\'attention' },
  it: { 火: 'la forza nei momenti decisivi', 地: 'un modo concreto di far atterrare le cose', 風: 'uno sguardo obiettivo e distaccato', 水: 'un tocco delicato e premuroso' },
  pt: { 火: 'a força nos momentos decisivos', 地: 'um jeito prático de concretizar as coisas', 風: 'um olhar objetivo e distanciado', 水: 'um toque delicado e cuidadoso' },
  ko: { 火: '결정적인 순간에서의 승부욕', 地: '현실적으로 마무리하는 힘', 風: '한 걸음 물러선 객관적인 시선', 水: '섬세한 공감력' },
}

function buildIntro(lang: Lang, ascN: string, ascK: string, sunN: string, sunK: string, moonN: string, moonK: string): string {
  if (lang === 'en')
    return `The first thing people meet in you is ${ascN}'s "${ascK}". The core that shows as they get closer is ${sunN}'s "${sunK}". And deep inside, where you recharge, lives ${moonN}'s "${moonK}".`
  if (lang === 'es')
    return `Lo primero que la gente percibe en ti es «${ascK}», de ${ascN}. El núcleo que se revela al conocerte es «${sunK}», de ${sunN}. Y en lo más hondo, donde recargas energía, vive «${moonK}», de ${moonN}.`
  if (lang === 'fr')
    return `La première chose que les gens rencontrent en vous, c'est le « ${ascK} » de ${ascN}. Le noyau qui se révèle à mesure qu'on s'approche, c'est le « ${sunK} » de ${sunN}. Et tout au fond, là où vous rechargez votre énergie, vit le « ${moonK} » de ${moonN}.`
  if (lang === 'it')
    return `La prima cosa che le persone incontrano in te è il «${ascK}» di ${ascN}. Il nucleo che si rivela man mano che ci si avvicina è il «${sunK}» di ${sunN}. E nel profondo, dove ricarichi le energie, vive il «${moonK}» di ${moonN}.`
  if (lang === 'pt')
    return `A primeira coisa que as pessoas encontram em você é o «${ascK}» de ${ascN}. O núcleo que se revela à medida que se aproximam é o «${sunK}» de ${sunN}. E lá no fundo, onde você recarrega as energias, vive o «${moonK}» de ${moonN}.`
  if (lang === 'ko')
    return `사람들이 당신을 만나 처음 접하는 것은 ${ascN}의 「${ascK}」. 가까워질수록 드러나는 핵심은 ${sunN}의 「${sunK}」. 그리고 마음 깊은 곳에서 에너지를 충전하는 것은 ${moonN}의 「${moonK}」입니다.`
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
    else if (lang === 'fr') balance = `Les trois — Soleil, Lune et Ascendant — se réunissent dans l'élément ${L[e]}. ${TRIPLE.fr[e]}`
    else if (lang === 'it') balance = `Tutti e tre — Sole, Luna e Ascendente — si riuniscono nell'elemento ${L[e]}. ${TRIPLE.it[e]}`
    else if (lang === 'pt') balance = `Os três — Sol, Lua e Ascendente — reúnem-se no elemento ${L[e]}. ${TRIPLE.pt[e]}`
    else if (lang === 'ko') balance = `세 천체 — 태양, 달, 상승 별자리 — 가 모두 「${L[e]}」 원소에 모여 있습니다. ${TRIPLE.ko[e]}`
    else balance = `3天体すべてが「${L[e]}」のエレメントに集まっています。${TRIPLE.ja[e]}`
  } else if (counts.size === 2) {
    const [domEl] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    const otherEl = elements.find((el) => el !== domEl)!
    if (lang === 'en')
      balance = `The ${L[domEl]} element holds two of the three, with one ${L[otherEl]} added. ${DOMINANT.en[domEl]}, with ${ACCENT.en[otherEl]} adding a nice accent.`
    else if (lang === 'es')
      balance = `El elemento ${L[domEl]} ocupa dos de los tres, con un toque de ${L[otherEl]}. ${DOMINANT.es[domEl]}, y ${ACCENT.es[otherEl]} añade un matiz especial.`
    else if (lang === 'fr')
      balance = `L'élément ${L[domEl]} occupe deux des trois, avec une touche de ${L[otherEl]}. ${DOMINANT.fr[domEl]}, et ${ACCENT.fr[otherEl]} apporte une belle nuance.`
    else if (lang === 'it')
      balance = `L'elemento ${L[domEl]} occupa due dei tre, con un tocco di ${L[otherEl]}. ${DOMINANT.it[domEl]}, e ${ACCENT.it[otherEl]} aggiunge una sfumatura speciale.`
    else if (lang === 'pt')
      balance = `O elemento ${L[domEl]} ocupa dois dos três, com um toque de ${L[otherEl]}. ${DOMINANT.pt[domEl]}, e ${ACCENT.pt[otherEl]} acrescenta um matiz especial.`
    else if (lang === 'ko')
      balance = `「${L[domEl]}」 원소가 두 천체를 차지하고, 거기에 「${L[otherEl]}」이 하나 더해진 조합입니다. ${DOMINANT.ko[domEl]}. 거기에 ${ACCENT.ko[otherEl]}이 악센트로 작용합니다.`
    else
      balance = `「${L[domEl]}」のエレメントが2天体を占め、そこに「${L[otherEl]}」がひとつ加わる配合。${DOMINANT.ja[domEl]}。そこへ${ACCENT.ja[otherEl]}がアクセントとして効いています。`
  } else {
    const labels = elements.map((e) => L[e])
    if (lang === 'en')
      balance = `Sun, Moon and Rising scatter across three different elements (${labels.join(', ')})—a many-sided blend. You naturally show a different face for each situation, with a wide range to draw on.`
    else if (lang === 'es')
      balance = `Sol, Luna y Ascendente se reparten en tres elementos distintos (${labels.join(', ')}): una mezcla polifacética. Muestras con naturalidad una cara distinta según la situación, con muchos recursos.`
    else if (lang === 'fr')
      balance = `Soleil, Lune et Ascendant se répartissent sur trois éléments différents (${labels.join(', ')}) : un mélange aux multiples facettes. Vous montrez naturellement un visage différent selon la situation, avec de nombreuses ressources.`
    else if (lang === 'it')
      balance = `Sole, Luna e Ascendente si distribuiscono su tre elementi diversi (${labels.join(', ')}): una miscela poliedrica. Mostri con naturalezza un volto diverso a seconda della situazione, con molte risorse.`
    else if (lang === 'pt')
      balance = `Sol, Lua e Ascendente distribuem-se por três elementos diferentes (${labels.join(', ')}): uma mistura multifacetada. Você mostra naturalmente um rosto diferente conforme a situação, com muitos recursos.`
    else if (lang === 'ko')
      balance = `태양, 달, 상승 별자리가 「${labels.join('」 「')}」의 세 가지 서로 다른 원소로 흩어진 다면적인 조합입니다. 상황에 따라 자연스럽게 다른 얼굴을 보여줄 수 있는, 서랍이 많은 사람입니다.`
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
    fr: {
      allSame: `Le Soleil, la Lune et l'Ascendant sont tous en ${sunN}. Visage extérieur, vrai moi et première impression s'alignent : un ${sunN} franc et pur.`,
      sunMoon: 'Le Soleil et la Lune partagent le même signe : vous êtes né autour d\'une nouvelle lune. Votre visage extérieur et votre vrai moi coïncident, si bien que vos sentiments et vos actes ne vacillent jamais.',
      sunAsc: 'Le Soleil et l\'Ascendant partagent le même signe. Ce que les gens voient est ce qu\'ils obtiennent : votre première impression ne se révèle jamais trompeuse.',
      moonAsc: 'La Lune et l\'Ascendant partagent le même signe. Vos vrais sentiments affleurent naturellement en surface : votre allure sincère et sans façon est votre charme.',
      other: `La première impression est ${ascN} ; à mesure qu'on vous connaît, votre côté ${sunN} émerge ; et ce n'est qu'à ceux en qui vous avez confiance que vous montrez votre vrai moi ${moonN} — une personne pleine de profondeur, riche de découvertes à mesure qu'on l'approche.`,
    },
    it: {
      allSame: `Sole, Luna e Ascendente sono tutti in ${sunN}. Volto esteriore, vero sé e prima impressione si allineano: un ${sunN} schietto e puro.`,
      sunMoon: 'Sole e Luna condividono il segno: sei nato intorno a una luna nuova. Il tuo volto esteriore e il tuo vero sé coincidono, così sentimenti e azioni non vacillano mai.',
      sunAsc: 'Sole e Ascendente condividono il segno. Ciò che le persone vedono è ciò che ottengono: la tua prima impressione non si rivela mai ingannevole.',
      moonAsc: 'Luna e Ascendente condividono il segno. I tuoi veri sentimenti affiorano naturalmente in superficie: la tua aria genuina e senza fronzoli è il tuo fascino.',
      other: `La prima impressione è ${ascN}; conoscendoti emerge il tuo lato ${sunN}; e solo a chi ti fidi mostri il tuo vero sé ${moonN} — una persona ricca di profondità, piena di scoperte man mano che la si conosce.`,
    },
    pt: {
      allSame: `Sol, Lua e Ascendente estão todos em ${sunN}. Rosto exterior, verdadeiro eu e primeira impressão se alinham: um ${sunN} franco e puro.`,
      sunMoon: 'Sol e Lua compartilham o signo: você nasceu por volta de uma lua nova. Seu rosto exterior e seu verdadeiro eu coincidem, de modo que sentimentos e ações nunca vacilam.',
      sunAsc: 'Sol e Ascendente compartilham o signo. O que as pessoas veem é o que recebem: sua primeira impressão nunca se revela enganosa.',
      moonAsc: 'Lua e Ascendente compartilham o signo. Seus verdadeiros sentimentos afloram naturalmente à superfície: seu ar genuíno e sem rodeios é o seu encanto.',
      other: `A primeira impressão é ${ascN}; à medida que o conhecem, seu lado ${sunN} surge; e só a quem você confia mostra seu verdadeiro eu ${moonN} — alguém com profundidade, cheio de descobertas quanto mais o conhecem.`,
    },
    ko: {
      allSame: `태양, 달, 상승 별자리가 모두 ${sunN}. 겉모습도, 본모습도, 첫인상도 일관된, 곧고 순도 높은 ${sunN}입니다.`,
      sunMoon: '태양과 달이 같은 별자리 — 신월 무렵에 태어났습니다. 겉모습과 본모습이 일치하여, 마음과 행동이 흔들리지 않는 심지 곧은 유형입니다.',
      sunAsc: '태양과 상승 별자리가 같은 별자리. 겉보기 인상과 속마음이 일치하는 "있는 그대로"의 사람으로, 첫인상이 나중에 뒤집히는 일이 없습니다.',
      moonAsc: '달과 상승 별자리가 같은 별자리. 본모습의 감정이 자연스럽게 겉으로 배어 나오는 유형으로, 꾸밈없는 있는 그대로의 분위기가 매력입니다.',
      other: `첫인상은 ${ascN}, 사귀는 동안 ${sunN}다움이 보이기 시작하고, 마음을 연 상대에게만 ${moonN}의 본모습을 내비치는 — 알수록 발견이 있는, 깊이를 지닌 사람입니다.`,
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
