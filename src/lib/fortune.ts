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
  fr: {
    today: { label: "Aujourd'hui", noun: "aujourd'hui" },
    tomorrow: { label: 'Demain', noun: 'demain' },
    week: { label: 'Cette semaine', noun: 'cette semaine' },
    month: { label: 'Ce mois-ci', noun: 'ce mois-ci' },
  },
  it: {
    today: { label: 'Oggi', noun: 'oggi' },
    tomorrow: { label: 'Domani', noun: 'domani' },
    week: { label: 'Questa settimana', noun: 'questa settimana' },
    month: { label: 'Questo mese', noun: 'questo mese' },
  },
  pt: {
    today: { label: 'Hoje', noun: 'hoje' },
    tomorrow: { label: 'Amanhã', noun: 'amanhã' },
    week: { label: 'Esta semana', noun: 'esta semana' },
    month: { label: 'Este mês', noun: 'este mês' },
  },
  ko: {
    today: { label: '오늘', noun: '오늘' },
    tomorrow: { label: '내일', noun: '내일' },
    week: { label: '이번 주', noun: '이번 주' },
    month: { label: '이번 달', noun: '이번 달' },
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
  fr: {
    moon: {
      good: "Votre humeur s'allège et l'intuition s'affine. Agir sincèrement selon votre ressenti porte ses fruits.",
      hard: 'Les émotions font le yo-yo. Ne surchargez pas votre agenda : ménagez du temps pour reposer votre cœur.',
      conj: 'Votre antenne émotionnelle est sensible. Ce qui vous touche est le thème de cette période.',
    },
    sun: {
      good: "La vitalité monte et votre vraie nature reçoit une reconnaissance naturelle : un véritable vent porteur.",
      hard: "Votre rythme et les attentes des autres se heurtent facilement. Ne vous forcez pas à en faire trop.",
      conj: 'Un tournant sous les projecteurs. Un bon moment pour prendre un nouveau départ.',
    },
    mercury: {
      good: "Les échanges et les messages passent en douceur. Une belle fenêtre pour apprendre, partager et négocier.",
      hard: 'Les mots se croisent facilement. Faites une pause et relisez les messages importants avant de les envoyer.',
      conj: 'Votre esprit accélère et les idées jaillissent. Notez ce qui vous vient à l’esprit.',
    },
    venus: {
      good: "Un vent doux pour les relations et l'amour. Investir dans le plaisir et le style attire la chance.",
      hard: "L'attrait du plaisir peut brouiller votre jugement. Attention aux achats impulsifs et aux belles paroles.",
      conj: 'Votre charme grandit. De belles rencontres vous attendent, avec les gens et avec les belles choses.',
    },
    mars: {
      good: "L'élan et le goût du défi montent en vous. Si vous hésitiez, c'est le moment de vous lancer.",
      hard: "L'impatience et l'irritation ressortent facilement. Méfiez-vous des décisions précipitées et des conflits.",
      conj: 'Une phase d’énergie à plein régime. Défoulez-vous par le sport ou la compétition pour un bon cycle.',
    },
    jupiter: {
      good: 'Un angle chanceux où les occasions s’élargissent. Cela vaut la peine de dire « oui » aux invitations.',
      hard: 'Vous vous sentez expansif et pouvez voir trop grand. Gardez promesses et dépenses à votre mesure.',
      conj: 'Une phase d’expansion qui revient une fois tous les 12 ans. Idéale pour semer pour l’avenir.',
    },
    saturn: {
      good: "Un flux solide où l'effort prend forme. Le travail régulier, pas à pas, avance bien.",
      hard: 'Vous ressentez responsabilités et limites. Pourtant, les fondations posées ici ne vous trahiront pas.',
      conj: 'Un jalon pour repenser la structure de votre vie. Un bon moment pour des projets à long terme.',
    },
  },
  it: {
    moon: {
      good: "L'umore si solleva e l'intuito si affina. Agire con sincerità su ciò che senti funziona bene.",
      hard: 'Gli stati d’animo vanno su e giù. Non riempire troppo l’agenda: lascia spazio per riposare il cuore.',
      conj: 'La tua antenna emotiva è sensibile. Ciò che ti tocca è il tema di questo periodo.',
    },
    sun: {
      good: 'La vitalità sale e la tua autenticità riceve un riconoscimento naturale: un vero vento in poppa.',
      hard: 'Il tuo ritmo e le aspettative altrui si scontrano con facilità. Non sforzarti di strafare.',
      conj: 'Una svolta sotto i riflettori. Un buon momento per un nuovo inizio.',
    },
    mercury: {
      good: 'Conversazioni e messaggi scorrono lisci. Una buona finestra per imparare, comunicare e negoziare.',
      hard: 'I fraintendimenti nascono facilmente. Fermati e rileggi i messaggi importanti prima di inviarli.',
      conj: 'La mente accelera e le idee sgorgano. Annota ciò che ti viene in mente.',
    },
    venus: {
      good: "Un vento dolce per le relazioni e l'amore. Investire nel piacere e nello stile attira fortuna.",
      hard: "Il richiamo del piacere può annebbiare il giudizio. Attenzione agli acquisti impulsivi e alle belle parole.",
      conj: 'Il tuo fascino cresce. Ti aspettano begli incontri, con le persone e con le cose belle.',
    },
    mars: {
      good: 'Slancio e voglia di sfida sgorgano dentro di te. Se esitavi, ora è il momento di fare il passo.',
      hard: "L'impazienza e l'irritazione affiorano facilmente. Attenzione alle decisioni affrettate e agli scontri.",
      conj: 'Una fase di energia a pieno motore. Scaricala con sport o competizione per un buon ciclo.',
    },
    jupiter: {
      good: 'Un angolo fortunato in cui le occasioni si ampliano. Vale la pena dire “sì” agli inviti.',
      hard: 'Ti senti espansivo e puoi esagerare. Mantieni promesse e spese alla tua misura.',
      conj: 'Una fase di espansione che torna una volta ogni 12 anni. Ideale per seminare per il futuro.',
    },
    saturn: {
      good: "Un flusso solido dove l'impegno prende forma. Il lavoro costante, passo dopo passo, procede bene.",
      hard: 'Senti responsabilità e limiti. Eppure le fondamenta che poni qui non ti tradiranno.',
      conj: 'Una tappa per ripensare la struttura della tua vita. Un buon momento per piani a lungo termine.',
    },
  },
  pt: {
    moon: {
      good: 'O ânimo sobe e a intuição se aguça. Agir com sinceridade sobre o que você sente funciona bem.',
      hard: 'O humor sobe e desce. Não lote a agenda: reserve um tempo para descansar o coração.',
      conj: 'Sua antena emocional está sensível. O que o comove é o tema deste período.',
    },
    sun: {
      good: 'A vitalidade sobe e a sua autenticidade recebe reconhecimento natural: um verdadeiro vento a favor.',
      hard: 'Seu ritmo e as expectativas dos outros se chocam com facilidade. Não se force a esticar demais.',
      conj: 'Um ponto de virada sob os holofotes. Um bom momento para recomeçar.',
    },
    mercury: {
      good: 'Conversas e mensagens fluem com facilidade. Uma boa janela para aprender, divulgar e negociar.',
      hard: 'Os mal-entendidos surgem com facilidade. Faça uma pausa e releia as mensagens importantes antes de enviar.',
      conj: 'A mente acelera e as ideias brotam. Anote o que lhe vier à cabeça.',
    },
    venus: {
      good: 'Um vento doce para os relacionamentos e o amor. Investir em diversão e estilo atrai sorte.',
      hard: 'A tentação do prazer pode turvar o julgamento. Cuidado com as compras por impulso e as palavras doces.',
      conj: 'Seu charme aumenta. Bons encontros o esperam, com pessoas e com coisas belas.',
    },
    mars: {
      good: 'A garra e a vontade de desafios brotam em você. Se você hesitava, agora é a hora de dar o passo.',
      hard: 'A impaciência e a irritação vêm à tona com facilidade. Cuidado com decisões apressadas e conflitos.',
      conj: 'Uma fase de energia a todo vapor. Descarregue-a com exercício ou competição para um bom ciclo.',
    },
    jupiter: {
      good: 'Um ângulo de sorte em que as oportunidades se ampliam. Vale a pena dizer “sim” aos convites.',
      hard: 'Você se sente expansivo e pode exagerar. Mantenha promessas e gastos à sua medida.',
      conj: 'Uma fase de expansão que volta uma vez a cada 12 anos. Ideal para semear para o futuro.',
    },
    saturn: {
      good: 'Um fluxo sólido em que o esforço toma forma. O trabalho constante, passo a passo, avança bem.',
      hard: 'Você sente responsabilidade e limites. Ainda assim, a base que assenta aqui não vai traí-lo.',
      conj: 'Um marco para repensar a estrutura da sua vida. Um bom momento para planos de longo prazo.',
    },
  },
  ko: {
    moon: {
      good: '기분이 살아나고 직감이 예리해지는 흐름. 느낀 것을 솔직하게 행동으로 옮기면 좋습니다.',
      hard: '감정의 기복이 나타나기 쉬운 때. 일정을 너무 채우지 말고 마음이 쉴 시간을 확보하세요.',
      conj: '감정의 안테나가 예민해집니다. 마음이 움직인 것, 그것이 이 시기의 주제입니다.',
    },
    sun: {
      good: '활력이 오르고 당신다움이 자연스럽게 인정받는 순풍입니다.',
      hard: '자신의 페이스와 주변의 기대가 부딪히기 쉬운 때. 무리하게 애쓰는 것은 금물입니다.',
      conj: '스포트라이트가 비치는 전환점. 새로운 출발을 하기에 좋습니다.',
    },
    mercury: {
      good: '대화와 연락이 매끄럽게 진행됩니다. 배움·발신·협상에 좋은 기회입니다.',
      hard: '말의 어긋남이 생기기 쉬운 때. 중요한 연락은 한 박자 쉬고 다시 읽어 보세요.',
      conj: '머리 회전이 빨라지고 아이디어가 샘솟습니다. 떠오른 생각은 메모로 남기면 좋습니다.',
    },
    venus: {
      good: '인간관계와 연애에 달콤한 순풍. 즐거움과 멋내기에 대한 투자가 운을 부릅니다.',
      hard: '즐거움의 유혹이 판단을 무디게 하기 쉽습니다. 충동구매와 달콤한 이야기에 주의하세요.',
      conj: '매력이 높아지는 때. 사람과의 만남, 아름다운 것과의 만남에 축복이 있습니다.',
    },
    mars: {
      good: '행동력과 도전 정신이 솟아오릅니다. 망설이던 한 걸음을 내딛는다면 지금입니다.',
      hard: '조급함과 짜증이 겉으로 드러나기 쉬운 때. 기세만 앞선 결정과 충돌에 주의하세요.',
      conj: '엔진 풀가동의 에너지 시기. 운동이나 승부로 발산하면 선순환이 됩니다.',
    },
    jupiter: {
      good: '기회가 넓어지는 행운의 각도. 초대에는 “네”라고 답해 볼 가치가 있습니다.',
      hard: '마음이 커져 너무 벌여 놓기 쉽습니다. 약속과 지출은 분수에 맞게 의식하세요.',
      conj: '약 12년에 한 번의 확장기. 미래로 이어지는 씨앗을 뿌리기에 최적의 타이밍입니다.',
    },
    saturn: {
      good: '노력이 형태로 나타나기 쉬운 견실한 흐름. 꾸준한 작업이 잘 진척됩니다.',
      hard: '책임과 제약을 느끼기 쉬운 때. 다만 여기서 다진 토대는 배신하지 않습니다.',
      conj: '인생의 뼈대를 재점검하는 전환점. 장기적인 계획을 세우기에 좋습니다.',
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
  fr: {
    sun: 'Soleil (nature profonde)', moon: 'Lune (cœur)', asc: 'Ascendant (comportement)', mercury: 'Mercure (intellect)',
    venus: 'Vénus (amour)', mars: 'Mars (élan)', jupiter: 'Jupiter (expansion)', saturn: 'Saturne (défi)',
    uranus: 'Uranus (changement)', neptune: 'Neptune (imagination)', pluto: 'Pluton (renaissance)',
  },
  it: {
    sun: 'Sole (essenza)', moon: 'Luna (cuore)', asc: 'Ascendente (comportamento)', mercury: 'Mercurio (intelletto)',
    venus: 'Venere (amore)', mars: 'Marte (slancio)', jupiter: 'Giove (espansione)', saturn: 'Saturno (sfida)',
    uranus: 'Urano (cambiamento)', neptune: 'Nettuno (immaginazione)', pluto: 'Plutone (rinascita)',
  },
  pt: {
    sun: 'Sol (essência)', moon: 'Lua (coração)', asc: 'Ascendente (comportamento)', mercury: 'Mercúrio (intelecto)',
    venus: 'Vênus (amor)', mars: 'Marte (garra)', jupiter: 'Júpiter (expansão)', saturn: 'Saturno (desafio)',
    uranus: 'Urano (mudança)', neptune: 'Netuno (imaginação)', pluto: 'Plutão (renascimento)',
  },
  ko: {
    sun: '태양(기본 성격)', moon: '달(마음)', asc: '상승 별자리(태도)', mercury: '수성(지성)',
    venus: '금성(애정)', mars: '화성(행동력)', jupiter: '목성(발전)', saturn: '토성(과제)',
    uranus: '천왕성(변혁)', neptune: '해왕성(상상력)', pluto: '명왕성(재생)',
  },
}

export type Quality = 'good' | 'hard' | 'conj'

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
  fr: { 0: 'pile l’un sur l’autre (0°)', 60: 'un vent porteur léger (60°)', 90: 'un angle qui met à l’épreuve (90°)', 120: 'un fort vent porteur (120°)', 180: 'un bras de fer (180°)' },
  it: { 0: 'esattamente sovrapposti (0°)', 60: 'un leggero vento in poppa (60°)', 90: 'un angolo che mette alla prova (90°)', 120: 'un forte vento in poppa (120°)', 180: 'un tira e molla (180°)' },
  pt: { 0: 'bem sobrepostos (0°)', 60: 'um vento leve a favor (60°)', 90: 'um ângulo que põe à prova (90°)', 120: 'um forte vento a favor (120°)', 180: 'um cabo de guerra (180°)' },
  ko: { 0: '딱 겹쳐 있는 상태(0°)', 60: '부드러운 순풍(60°)', 90: '시험대에 오르는 각도(90°)', 120: '강한 순풍(120°)', 180: '서로 잡아당기는 힘(180°)' },
}

const ITEM_TITLE: Record<Lang, (transit: string, natal: string, aspect: string) => string> = {
  ja: (t, n, a) => `運行中の${t} × あなたの${n} — ${a}`,
  en: (t, n, a) => `Transiting ${t} × your ${n} — ${a}`,
  es: (t, n, a) => `${t} en tránsito × tu ${n} — ${a}`,
  fr: (t, n, a) => `${t} en transit × votre ${n} — ${a}`,
  it: (t, n, a) => `${t} in transito × il tuo ${n} — ${a}`,
  pt: (t, n, a) => `${t} em trânsito × seu ${n} — ${a}`,
  ko: (t, n, a) => `운행 중인 ${t} × 당신의 ${n} — ${a}`,
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
  fr: {
    title: 'Un ciel calme, sans angles marqués',
    text: 'Les astres en transit ne forment aucun angle notable avec votre thème. Avec moins de vagues venues de l’extérieur, garder votre propre rythme stabilise votre chance cette période.',
  },
  it: {
    title: 'Un cielo tranquillo, senza angoli marcati',
    text: 'Gli astri in transito non formano angoli rilevanti con il tuo tema. Con meno onde dall’esterno, mantenere il tuo ritmo stabilizza la tua fortuna in questo periodo.',
  },
  pt: {
    title: 'Um céu tranquilo, sem ângulos marcantes',
    text: 'Os astros em trânsito não formam ângulos notáveis com o seu mapa. Com menos ondas externas, manter o seu ritmo estabiliza a sua sorte neste período.',
  },
  ko: {
    title: '큰 각도가 없는 고요한 별자리 흐름',
    text: '운행 중인 별들이 당신의 별과 뚜렷한 각도를 이루지 않습니다. 외부의 파도가 적은 만큼, 자신의 페이스를 지킬수록 운이 안정되는 시기입니다.',
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
  fr: {
    2: { label: 'Grande forme', text: 'Les astres vous soutiennent avec force : les choix audacieux paient.' },
    1: { label: 'Vent porteur', text: 'Le courant vous favorise. Le bon moment pour avancer sur ce qui vous trottait dans la tête.' },
    0: { label: 'Serein', text: 'Un ciel stable, sans grosses vagues. Idéal pour soigner l’essentiel.' },
    [-1]: { label: 'Consolider les bases', text: 'Une configuration un peu tendue. Le soin et la rigueur la transforment en fruits.' },
    [-2]: { label: 'Recharger', text: 'Les astres vous confient pas mal de devoirs. Sans forcer : priorité au repos et à la préparation.' },
  },
  it: {
    2: { label: 'In gran forma', text: 'Gli astri ti sostengono con forza: le scelte audaci pagano.' },
    1: { label: 'Vento in poppa', text: 'La corrente ti favorisce. Un buon momento per portare avanti ciò che avevi in mente.' },
    0: { label: 'Sereno', text: 'Un cielo stabile, senza grandi onde. Ideale per curare le cose essenziali.' },
    [-1]: { label: 'Consolidare le basi', text: 'Una configurazione un po’ tesa. La cura la trasforma in frutti.' },
    [-2]: { label: 'Ricaricare', text: 'Gli astri ti lasciano parecchi compiti. Senza forzare: priorità a riposo e preparazione.' },
  },
  pt: {
    2: { label: 'Em plena forma', text: 'Os astros o apoiam com força: as escolhas ousadas dão certo.' },
    1: { label: 'Vento a favor', text: 'A corrente o favorece. Um bom momento para avançar no que rondava a sua mente.' },
    0: { label: 'Tranquilo', text: 'Um céu estável, sem grandes ondas. Ideal para cuidar do básico.' },
    [-1]: { label: 'Firmar a base', text: 'Uma configuração um tanto tensa. O cuidado a transforma em frutos.' },
    [-2]: { label: 'Recarregar', text: 'Os astros lhe deixam bastante tarefa. Sem forçar: priorize descanso e preparação.' },
  },
  ko: {
    2: { label: '절호조', text: '별들이 강력하게 편이 되어 주는 시기. 적극적인 선택이 좋은 결과로 이어집니다.' },
    1: { label: '순풍', text: '흐름은 당신 편입니다. 마음에 두고 있던 일을 진행할 기회입니다.' },
    0: { label: '평온', text: '큰 파도 없는 안정된 별자리 흐름. 기반을 다지기에 좋습니다.' },
    [-1]: { label: '발판 다지기', text: '다소 긴장감이 있는 배치. 정성을 기울이면 결실로 바뀝니다.' },
    [-2]: { label: '충전 기간', text: '별로부터의 숙제가 다소 많은 시기. 무리하지 말고 휴식과 준비를 우선하세요.' },
  },
}

function skyNoteText(lang: Lang, period: PeriodKey, sunSign: string, moonSign: string): string {
  const short = period === 'today' || period === 'tomorrow'
  if (lang === 'en') return short ? `Sun in ${sunSign}, Moon in ${moonSign}` : `Sun transiting through ${sunSign}`
  if (lang === 'es') return short ? `Sol en ${sunSign}, Luna en ${moonSign}` : `Sol en tránsito por ${sunSign}`
  if (lang === 'fr') return short ? `Soleil en ${sunSign}, Lune en ${moonSign}` : `Soleil en transit dans ${sunSign}`
  if (lang === 'it') return short ? `Sole in ${sunSign}, Luna in ${moonSign}` : `Sole in transito nel ${sunSign}`
  if (lang === 'pt') return short ? `Sol em ${sunSign}, Lua em ${moonSign}` : `Sol em trânsito por ${sunSign}`
  if (lang === 'ko') return short ? `태양은 ${sunSign}, 달은 ${moonSign} 운행 중` : `태양은 ${sunSign} 영역을 운행 중`
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
