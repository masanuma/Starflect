import { useLang, getLang } from './i18n'
import type { Lang } from './i18n'
import type { Element } from './signs'

/** 生年月日ラベルを言語別に整形 */
const MONTHS: Record<Lang, string[]> = {
  ja: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
}

/** 'YYYY-MM-DD' を現在言語の日付ラベルに(時刻があれば付加) */
export function formatBirthDate(dateStr: string, time?: string, lang: Lang = getLang()): string {
  const [y, m, d] = dateStr.split('-')
  const mi = Number(m) - 1
  const day = Number(d)
  let base: string
  if (lang === 'en') base = `${MONTHS.en[mi]} ${day}, ${y}`
  else if (lang === 'es') base = `${day} de ${MONTHS.es[mi]} de ${y}`
  else base = `${y}年${Number(m)}月${day}日`
  return time ? `${base} ${time}` : base
}

export interface Starter {
  label: string
  q: string
}

export interface UIStrings {
  common: {
    back: string
    nameLabel: string
    namePlaceholder: string
    birthdate: string
    birthtime: string
    when: string
    periodAria: string
    tryAgain: string
    unknownError: string
    backToModes: string
  }
  home: {
    tagline1: string
    tagline2: string
    aboutLink: string
    soloName: string
    soloTime: string
    soloDesc: string
    pairName: string
    pairDesc: string
    note: string
  }
  about: {
    title: string
    lead: string
    what: string[]
    howTitle: string
    outer: string
    inner: string
    sunElement: string
    moonElement: string
    elementsTitle: string
    elements: Record<Element, string>
    listTitle: string
    listSub: string
    cta: string
  }
  birth: {
    title: string
    sub: string
    timeHint: string
    country: string
    countryHint: string
    prefecture: string
    prefectureHint: string
    periodHint: string
    submit: string
    errNoDate: string
    errBadDate: string
  }
  pair: {
    title: string
    sub: string
    you: string
    partner: string
    youName: string
    partnerName: string
    timeHint: string
    submit: string
    errNoDate: (name: string) => string
    errBadDate: (name: string) => string
  }
  result: {
    born: (date: string) => string
    title: (name: string) => string
    synthLabel: string
    outerFace: string
    innerHeart: string
    typeCount: string
    partyTitle: string
    partySub: string
    domain: string
    quirk: string
    genBadge: string
    partyFoot: string
    fortuneTitle: (period: string) => string
    fortuneSub: (name: string) => string
    fortuneFoot: (noun: string) => string
    aiTitle: string
    aiSub: (name: string) => string
    aiCta: string
    aiNote: string
    aiLoading: string
    upsell: string
    retry: string
    home: string
  }
  pairResult: {
    title: string
    matchLabel: string
    breakdownTitle: string
    breakdownSub: string
    todayTitle: (period: string) => string
    todaySub: (skyNote: string) => string
    aiTitle: string
    aiSub: (a: string, b: string) => string
    aiCta: string
    aiNote: string
    aiLoading: string
    upsell: string
    retry: string
    home: string
  }
  chat: {
    title: string
    sub: string
    historyCount: (n: number) => string
    hide: string
    show: string
    intro: string
    inputPlaceholder: string
    note: string
    clear: string
    delAria: string
    sendAria: string
    starters: Starter[]
  }
  footer: string
}

const UI: Record<Lang, UIStrings> = {
  ja: {
    common: {
      back: '戻る',
      nameLabel: 'お名前(任意)',
      namePlaceholder: 'ニックネームでもOK',
      birthdate: '生年月日',
      birthtime: '生まれた時刻(任意)',
      when: 'いつを占う?',
      periodAria: '占う期間',
      tryAgain: 'もう一度試す',
      unknownError: '不明なエラー',
      backToModes: '← モード選択に戻る',
    },
    home: {
      tagline1: 'あなたはどの「ほしキャラ」?',
      tagline2: '生まれた瞬間の星の配置でわかる、16キャラ×本格星占い。',
      aboutLink: 'ほしキャラとは？',
      soloName: '🌟 ほしキャラ診断',
      soloTime: '30秒',
      soloDesc: '生年月日だけでOK。あなたのほしキャラ(全16キャラ)と、あなたの中に住む10天体キャラまで分析',
      pairName: '💞 ふたりの相性',
      pairDesc: 'ほしキャラの相性と「今日のふたり」を診断。相手の生年月日だけでOK',
      note: '計算は雑誌の12星座占いと同じ生年月日ベース。でも結果は、あなただけのもの。',
    },
    about: {
      title: 'ほしキャラとは？',
      lead: '生まれた瞬間の星から生まれる、あなただけのキャラクター。',
      what: [
        '「ほしキャラ」は、あなたが生まれた瞬間の星の配置から生まれる、あなただけのキャラクターです。',
        '雑誌の12星座占いが使う太陽星座(表の顔)に、月星座(心の中)を掛け合わせることで、「外から見たあなた」と「内側のあなた」の両方を映し出します。',
        '星座は4つのエレメント(火・地・風・水)に分けられます。太陽のエレメント4種 × 月のエレメント4種 = 全16種類。あなたはそのどれか1つです。',
      ],
      howTitle: '16キャラの決まり方',
      outer: '表の顔',
      inner: '心の中',
      sunElement: '太陽のエレメント',
      moonElement: '月のエレメント',
      elementsTitle: '4つのエレメント',
      elements: {
        火: '情熱・行動・エネルギー',
        地: '現実・安定・継続',
        風: '知性・言葉・自由',
        水: '感情・共感・想像',
      },
      listTitle: '16のほしキャラ',
      listSub: '太陽 × 月 のエレメントで決まる、あなたのキャラ',
      cta: '自分のほしキャラを診断する',
    },
    birth: {
      title: 'ほしキャラ診断',
      sub: '生年月日だけでOK。あなたのほしキャラと、生まれた瞬間の星の配置をまるごと分析します',
      timeHint: '母子手帳に記載があります。不明でもOK(お昼の12時で近似し、上昇星座は省略します)',
      country: '生まれた国',
      countryHint: 'お使いの端末から自動で選んでいます。上昇星座の計算に使います(時刻が未入力のときは使いません)',
      prefecture: '生まれた都道府県',
      prefectureHint: '上昇星座の精度が少し上がります(時刻が未入力のときは使いません)',
      periodHint: '占った時点の星の運行から、その期間の運勢を読みます',
      submit: '星を読む',
      errNoDate: '生年月日を入力してください',
      errBadDate: '日付の形式が正しくありません',
    },
    pair: {
      title: 'ふたりの相性',
      sub: 'ほしキャラの相性と、いまの星回りから「ふたりの今」を占います',
      you: '🌟 あなた',
      partner: '💫 相手',
      youName: 'あなた',
      partnerName: '相手',
      timeHint: '不明でもOK(月星座をお昼の12時で近似します)',
      submit: 'ふたりの星を読む',
      errNoDate: (name) => `${name}の生年月日を入力してください`,
      errBadDate: (name) => `${name}の日付の形式が正しくありません`,
    },
    result: {
      born: (date) => `${date} 生まれ`,
      title: (name) => `${name ? `${name}さん` : 'あなた'}のほしキャラ`,
      synthLabel: '✦ もっと詳しく、あなたのほしキャラ ✦',
      outerFace: '表の顔',
      innerHeart: '心の中',
      typeCount: 'この組み合わせで、全16キャラ',
      partyTitle: 'ほしキャラを構成するパーティ',
      partySub: '生まれた瞬間の星たちが、あなたを動かすキャラになりました。担当と、いまの発揮のしかたです',
      domain: '担当',
      quirk: 'クセ',
      genBadge: '世代',
      partyFoot: '「世代」= 動きがゆっくりで、同世代に共通する時代の空気も映す天体です',
      fortuneTitle: (period) => `${period}の運勢`,
      fortuneSub: (name) => `いまの星の運行と${name ? `${name}さん` : 'あなた'}のほしキャラから読んでいます`,
      fortuneFoot: (noun) => `${noun}の空をゆく星々と、生まれた瞬間の星の配置との角度をもとにしています。`,
      aiTitle: 'AI占星術師の詳しいほしキャラ鑑定',
      aiSub: (name) => `AIが${name ? `${name}さん` : 'あなた'}のチャートと星の運行を読み解きます`,
      aiCta: 'AIに詳しく占ってもらう',
      aiNote: '上記の計算結果(星座・角度)がAIに送信されます。鑑定には10〜30秒ほどかかります。',
      aiLoading: '星を読んでいます……(10〜30秒ほどお待ちください)',
      upsell: '生まれた時刻が分かると、上昇星座と3天体の総合分析まで占えます(月星座の精度も上がります)。母子手帳をチェックしてみて。',
      retry: 'もう一度占う',
      home: 'モード選択に戻る',
    },
    pairResult: {
      title: 'ふたりの相性',
      matchLabel: '相性',
      breakdownTitle: '相性の内訳',
      breakdownSub: '太陽(表の顔)と月(心)、4つの組み合わせから',
      todayTitle: (period) => `${period}のふたり`,
      todaySub: (skyNote) => `${skyNote} — その星がふたりに吹かせる風は?`,
      aiTitle: 'AI占星術師のふたり鑑定',
      aiSub: (a, b) => `AIが${a}と${b}の星を読み解きます`,
      aiCta: 'AIにふたりを詳しく占ってもらう',
      aiNote: '上記の計算結果(星座・相性・角度)がAIに送信されます。鑑定には10〜30秒ほどかかります。',
      aiLoading: 'ふたりの星を読んでいます……(10〜30秒ほどお待ちください)',
      upsell: '生まれた時刻が分かると月星座の精度が上がり、相性の判定もより正確になります(現在は正午で近似しています)。',
      retry: '条件を変えて占う',
      home: 'モード選択に戻る',
    },
    chat: {
      title: 'ほしキャラ相談室',
      sub: 'あなたのほしキャラパーティをぜんぶ踏まえて、AIがなんでも相談にのります',
      historyCount: (n) => `これまでの相談 ${n}件`,
      hide: '非表示にする',
      show: '表示する',
      intro: '気になることを聞いてみてください。恋愛・仕事・性格・これからの運勢——あなたの10天体といまの星回りをもとにお答えします。',
      inputPlaceholder: 'メッセージを入力…',
      note: '送信するとあなたのほしキャラのデータがAIに送られます。',
      clear: '会話を消す',
      delAria: 'この質問と回答を削除',
      sendAria: '送信',
      starters: [
        { label: '💕 恋愛', q: 'いまの恋愛運と、恋愛で私が気をつけるといいことを教えて。' },
        { label: '💼 仕事', q: '仕事でいまの私が力を発揮するには、どう動くといい?' },
        { label: '🤝 人間関係', q: '人間関係で私が心地よくいるためのヒントがほしいな。' },
        { label: '🌱 性格', q: '星から見て、私って結局どういう性格の持ち主?' },
        { label: '🔮 この先', q: 'これからの私に、星はどんな流れを用意してる?' },
      ],
    },
    footer: '星の計算はすべてお使いの端末内で行われます。「AIに詳しく占ってもらう」を選んだときのみ、計算結果がAIに送信されます。',
  },
  en: {
    common: {
      back: 'Back',
      nameLabel: 'Name (optional)',
      namePlaceholder: 'A nickname is fine',
      birthdate: 'Date of birth',
      birthtime: 'Time of birth (optional)',
      when: 'Which period?',
      periodAria: 'Reading period',
      tryAgain: 'Try again',
      unknownError: 'Unknown error',
      backToModes: '← Back to modes',
    },
    home: {
      tagline1: 'Which “Hoshi-Kyara” (star character) are you?',
      tagline2: '16 characters × real astrology, from the sky at the moment you were born.',
      aboutLink: 'What is Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 sec',
      soloDesc: 'Just your birth date. We analyze your Hoshi-Kyara (1 of 16) and the 10 planet-characters living inside you.',
      pairName: '💞 Compatibility',
      pairDesc: 'Hoshi-Kyara compatibility plus “the two of you today.” Just their birth date needed.',
      note: 'The math uses the same birth date as magazine horoscopes—but the result is yours alone.',
    },
    about: {
      title: 'What is Hoshi-Kyara?',
      lead: 'Your very own character, born from the stars at the moment you arrived.',
      what: [
        '“Hoshi-Kyara” is your very own character, born from the arrangement of the stars at the moment you were born.',
        'On top of the Sun sign (your outer face) used by magazine horoscopes, we blend in the Moon sign (your inner heart) to reflect both “you as others see you” and “you on the inside.”',
        'The zodiac signs fall into four elements (Fire, Earth, Air, Water). Four Sun elements × four Moon elements = 16 characters in all. You are exactly one of them.',
      ],
      howTitle: 'How the 16 are decided',
      outer: 'Outer face',
      inner: 'Inner heart',
      sunElement: 'Sun’s element',
      moonElement: 'Moon’s element',
      elementsTitle: 'The four elements',
      elements: {
        火: 'Passion, action, energy',
        地: 'Reality, stability, persistence',
        風: 'Intellect, words, freedom',
        水: 'Emotion, empathy, imagination',
      },
      listTitle: 'The 16 Hoshi-Kyara',
      listSub: 'Your character, set by the Sun × Moon elements',
      cta: 'Find your Hoshi-Kyara',
    },
    birth: {
      title: 'Hoshi-Kyara',
      sub: 'Just your birth date. We analyze your Hoshi-Kyara and the full sky at the moment you were born.',
      timeHint: 'It’s on your birth record. Unknown is fine (we approximate at noon and skip the Rising sign).',
      country: 'Country of birth',
      countryHint: 'Auto-selected from your device. Used to compute your Rising sign (ignored if no time is entered).',
      prefecture: 'Prefecture of birth',
      prefectureHint: 'Slightly improves Rising-sign accuracy (ignored if no time is entered).',
      periodHint: 'We read this period’s fortune from the transits at the time of reading.',
      submit: 'Read the stars',
      errNoDate: 'Please enter a date of birth',
      errBadDate: 'The date format is invalid',
    },
    pair: {
      title: 'Compatibility',
      sub: 'We read “the two of you now” from your star-character match and the current sky.',
      you: '🌟 You',
      partner: '💫 Partner',
      youName: 'You',
      partnerName: 'Partner',
      timeHint: 'Unknown is fine (we approximate the Moon sign at noon).',
      submit: 'Read your stars',
      errNoDate: (name) => `Please enter ${name}’s date of birth`,
      errBadDate: (name) => `${name}’s date format is invalid`,
    },
    result: {
      born: (date) => `Born ${date}`,
      title: (name) => (name ? `${name}’s Hoshi-Kyara` : 'Your Hoshi-Kyara'),
      synthLabel: '✦ Your Hoshi-Kyara, in depth ✦',
      outerFace: 'Outer face',
      innerHeart: 'Inner heart',
      typeCount: 'One of 16 characters',
      partyTitle: 'The party behind your Hoshi-Kyara',
      partySub: 'The stars at the moment you were born became the characters that move you. Here’s each one’s domain and how it shows now.',
      domain: 'Domain',
      quirk: 'Style',
      genBadge: 'Gen',
      partyFoot: '“Gen” = slow-moving planets that also reflect the mood of your whole generation.',
      fortuneTitle: (period) => `${period}’s fortune`,
      fortuneSub: (name) => `Read from the current transits and ${name ? `${name}’s` : 'your'} Hoshi-Kyara`,
      fortuneFoot: (noun) => `Based on the angles between the stars moving across the sky ${noun} and your birth chart.`,
      aiTitle: 'AI astrologer’s in-depth Hoshi-Kyara reading',
      aiSub: (name) => `The AI reads ${name ? `${name}’s` : 'your'} chart and the current transits`,
      aiCta: 'Get a detailed AI reading',
      aiNote: 'The results above (signs and angles) are sent to the AI. A reading takes about 10–30 seconds.',
      aiLoading: 'Reading the stars… (please wait about 10–30 seconds)',
      upsell: 'With your birth time, we can add the Rising sign and a full three-body synthesis (and the Moon sign gets more accurate). Check your birth record.',
      retry: 'Read again',
      home: 'Back to modes',
    },
    pairResult: {
      title: 'Compatibility',
      matchLabel: 'Match',
      breakdownTitle: 'Compatibility breakdown',
      breakdownSub: 'From four combinations of Sun (outer face) and Moon (heart)',
      todayTitle: (period) => `The two of you: ${period}`,
      todaySub: (skyNote) => `${skyNote} — what wind does that stir up for you two?`,
      aiTitle: 'AI astrologer’s couple reading',
      aiSub: (a, b) => `The AI reads the stars of ${a} and ${b}`,
      aiCta: 'Get a detailed AI reading for two',
      aiNote: 'The results above (signs, match and angles) are sent to the AI. A reading takes about 10–30 seconds.',
      aiLoading: 'Reading the stars of you two… (please wait about 10–30 seconds)',
      upsell: 'With birth times, the Moon signs get more accurate and the match becomes more precise (currently approximated at noon).',
      retry: 'Change details and retry',
      home: 'Back to modes',
    },
    chat: {
      title: 'Hoshi-Kyara Room',
      sub: 'With your whole Hoshi-Kyara party in mind, the AI is here for any question.',
      historyCount: (n) => `${n} past ${n === 1 ? 'question' : 'questions'}`,
      hide: 'Hide',
      show: 'Show',
      intro: 'Ask whatever’s on your mind. Love, work, personality, what’s ahead—answered from your 10 planets and the current sky.',
      inputPlaceholder: 'Type a message…',
      note: 'Sending shares your Hoshi-Kyara data with the AI.',
      clear: 'Clear chat',
      delAria: 'Delete this question and answer',
      sendAria: 'Send',
      starters: [
        { label: '💕 Love', q: 'What’s my love outlook right now, and what should I watch out for in love?' },
        { label: '💼 Work', q: 'How should I move to do my best at work right now?' },
        { label: '🤝 Relationships', q: 'I’d love some tips for feeling at ease in my relationships.' },
        { label: '🌱 Personality', q: 'From the stars, what kind of personality do I really have?' },
        { label: '🔮 What’s ahead', q: 'What kind of flow do the stars have in store for me ahead?' },
      ],
    },
    footer: 'All star calculations happen on your own device. Only when you choose “Get a detailed AI reading” are the results sent to the AI.',
  },
  es: {
    common: {
      back: 'Volver',
      nameLabel: 'Nombre (opcional)',
      namePlaceholder: 'Un apodo vale',
      birthdate: 'Fecha de nacimiento',
      birthtime: 'Hora de nacimiento (opcional)',
      when: '¿Qué periodo?',
      periodAria: 'Periodo de lectura',
      tryAgain: 'Intentar de nuevo',
      unknownError: 'Error desconocido',
      backToModes: '← Volver a los modos',
    },
    home: {
      tagline1: '¿Qué “Hoshi-Kyara” (personaje estelar) eres?',
      tagline2: '16 personajes × astrología real, según el cielo del momento en que naciste.',
      aboutLink: '¿Qué es Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Solo tu fecha de nacimiento. Analizamos tu Hoshi-Kyara (1 de 16) y los 10 planetas-personaje que viven en ti.',
      pairName: '💞 Compatibilidad',
      pairDesc: 'Compatibilidad de Hoshi-Kyara y “vosotros dos hoy”. Solo hace falta su fecha de nacimiento.',
      note: 'El cálculo usa la misma fecha que los horóscopos de revista, pero el resultado es solo tuyo.',
    },
    about: {
      title: '¿Qué es Hoshi-Kyara?',
      lead: 'Tu propio personaje, nacido de los astros del momento en que llegaste.',
      what: [
        '«Hoshi-Kyara» es tu propio personaje, nacido de la disposición de los astros en el momento en que naciste.',
        'Sobre el signo solar (tu cara externa) que usan los horóscopos de revista, sumamos el signo lunar (tu interior) para reflejar tanto «tú como te ven los demás» como «tú por dentro».',
        'Los signos se agrupan en cuatro elementos (Fuego, Tierra, Aire, Agua). Cuatro elementos solares × cuatro lunares = 16 personajes en total. Tú eres exactamente uno de ellos.',
      ],
      howTitle: 'Cómo se deciden los 16',
      outer: 'Cara externa',
      inner: 'Interior',
      sunElement: 'Elemento solar',
      moonElement: 'Elemento lunar',
      elementsTitle: 'Los cuatro elementos',
      elements: {
        火: 'Pasión, acción, energía',
        地: 'Realidad, estabilidad, constancia',
        風: 'Intelecto, palabras, libertad',
        水: 'Emoción, empatía, imaginación',
      },
      listTitle: 'Los 16 Hoshi-Kyara',
      listSub: 'Tu personaje, según los elementos Sol × Luna',
      cta: 'Descubre tu Hoshi-Kyara',
    },
    birth: {
      title: 'Hoshi-Kyara',
      sub: 'Solo tu fecha de nacimiento. Analizamos tu Hoshi-Kyara y todo el cielo del momento en que naciste.',
      timeHint: 'Suele constar en tu partida de nacimiento. Si no la sabes, no pasa nada (aproximamos al mediodía y omitimos el Ascendente).',
      country: 'País de nacimiento',
      countryHint: 'Elegido automáticamente desde tu dispositivo. Se usa para calcular tu Ascendente (se ignora si no indicas la hora).',
      prefecture: 'Prefectura de nacimiento',
      prefectureHint: 'Mejora ligeramente la precisión del Ascendente (se ignora si no indicas la hora).',
      periodHint: 'Leemos la fortuna de este periodo a partir de los tránsitos en el momento de la lectura.',
      submit: 'Leer las estrellas',
      errNoDate: 'Introduce una fecha de nacimiento',
      errBadDate: 'El formato de la fecha no es válido',
    },
    pair: {
      title: 'Compatibilidad',
      sub: 'Leemos “vosotros dos ahora” a partir de vuestra afinidad de personajes y el cielo actual.',
      you: '🌟 Tú',
      partner: '💫 La otra persona',
      youName: 'Tú',
      partnerName: 'La otra persona',
      timeHint: 'Si no la sabes, no pasa nada (aproximamos el signo lunar al mediodía).',
      submit: 'Leer vuestras estrellas',
      errNoDate: (name) => `Introduce la fecha de nacimiento de ${name}`,
      errBadDate: (name) => `El formato de la fecha de ${name} no es válido`,
    },
    result: {
      born: (date) => `Nacimiento: ${date}`,
      title: (name) => (name ? `El Hoshi-Kyara de ${name}` : 'Tu Hoshi-Kyara'),
      synthLabel: '✦ Tu Hoshi-Kyara, en detalle ✦',
      outerFace: 'Cara externa',
      innerHeart: 'Interior',
      typeCount: 'Uno de 16 personajes',
      partyTitle: 'El grupo tras tu Hoshi-Kyara',
      partySub: 'Los astros del momento de tu nacimiento se volvieron los personajes que te mueven. Aquí va el área de cada uno y cómo se manifiesta ahora.',
      domain: 'Área',
      quirk: 'Estilo',
      genBadge: 'Gen',
      partyFoot: '“Gen” = planetas de movimiento lento que también reflejan el aire de toda tu generación.',
      fortuneTitle: (period) => `Fortuna: ${period}`,
      fortuneSub: (name) => `Leído a partir de los tránsitos actuales y ${name ? `el Hoshi-Kyara de ${name}` : 'tu Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `Basado en los ángulos entre los astros que cruzan el cielo (${noun}) y tu carta natal.`,
      aiTitle: 'Lectura Hoshi-Kyara detallada del astrólogo IA',
      aiSub: (name) => `La IA lee ${name ? `la carta de ${name}` : 'tu carta'} y los tránsitos actuales`,
      aiCta: 'Obtener una lectura IA detallada',
      aiNote: 'Los resultados de arriba (signos y ángulos) se envían a la IA. La lectura tarda unos 10–30 segundos.',
      aiLoading: 'Leyendo las estrellas… (espera unos 10–30 segundos)',
      upsell: 'Con tu hora de nacimiento podemos añadir el Ascendente y una síntesis completa de tres astros (y el signo lunar gana precisión). Revisa tu partida de nacimiento.',
      retry: 'Leer de nuevo',
      home: 'Volver a los modos',
    },
    pairResult: {
      title: 'Compatibilidad',
      matchLabel: 'Afinidad',
      breakdownTitle: 'Desglose de la afinidad',
      breakdownSub: 'A partir de cuatro combinaciones de Sol (cara externa) y Luna (corazón)',
      todayTitle: (period) => `Vosotros dos: ${period}`,
      todaySub: (skyNote) => `${skyNote} — ¿qué viento sopla eso para vosotros dos?`,
      aiTitle: 'Lectura de pareja del astrólogo IA',
      aiSub: (a, b) => `La IA lee las estrellas de ${a} y ${b}`,
      aiCta: 'Obtener una lectura IA detallada para dos',
      aiNote: 'Los resultados de arriba (signos, afinidad y ángulos) se envían a la IA. La lectura tarda unos 10–30 segundos.',
      aiLoading: 'Leyendo las estrellas de vosotros dos… (espera unos 10–30 segundos)',
      upsell: 'Con las horas de nacimiento, los signos lunares ganan precisión y la afinidad se afina (ahora se aproxima al mediodía).',
      retry: 'Cambiar datos y repetir',
      home: 'Volver a los modos',
    },
    chat: {
      title: 'Sala Hoshi-Kyara',
      sub: 'Con todo tu grupo Hoshi-Kyara en mente, la IA responde lo que quieras.',
      historyCount: (n) => `${n} ${n === 1 ? 'consulta' : 'consultas'} anteriores`,
      hide: 'Ocultar',
      show: 'Mostrar',
      intro: 'Pregunta lo que te inquiete. Amor, trabajo, personalidad, lo que viene: respondemos desde tus 10 planetas y el cielo actual.',
      inputPlaceholder: 'Escribe un mensaje…',
      note: 'Al enviar, compartes los datos de tu Hoshi-Kyara con la IA.',
      clear: 'Borrar conversación',
      delAria: 'Eliminar esta pregunta y su respuesta',
      sendAria: 'Enviar',
      starters: [
        { label: '💕 Amor', q: '¿Cómo está mi panorama amoroso ahora y qué debería cuidar en el amor?' },
        { label: '💼 Trabajo', q: '¿Cómo debería moverme para dar lo mejor en el trabajo ahora mismo?' },
        { label: '🤝 Relaciones', q: 'Me vendrían bien consejos para sentirme a gusto en mis relaciones.' },
        { label: '🌱 Personalidad', q: 'Según las estrellas, ¿qué tipo de personalidad tengo en realidad?' },
        { label: '🔮 Lo que viene', q: '¿Qué clase de corriente me preparan las estrellas de cara al futuro?' },
      ],
    },
    footer: 'Todos los cálculos astrales ocurren en tu propio dispositivo. Solo al elegir “Obtener una lectura IA detallada” se envían los resultados a la IA.',
  },
}

/** 現在言語のUI文字列(コンポーネント用フック) */
export function useUI(): UIStrings {
  const { lang } = useLang()
  return UI[lang]
}

/** 現在言語のUI文字列(非フック用) */
export function ui(): UIStrings {
  return UI[getLang()]
}
