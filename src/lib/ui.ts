import { useLang, getLang } from './i18n'
import type { Lang } from './i18n'
import type { Element } from './signs'

/** 生年月日ラベルを言語別に整形 */
const MONTHS: Record<Lang, string[]> = {
  ja: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  ko: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
}

/** 'YYYY-MM-DD' を現在言語の日付ラベルに(時刻があれば付加) */
export function formatBirthDate(dateStr: string, time?: string, lang: Lang = getLang()): string {
  const [y, m, d] = dateStr.split('-')
  const mi = Number(m) - 1
  const day = Number(d)
  let base: string
  if (lang === 'en') base = `${MONTHS.en[mi]} ${day}, ${y}`
  else if (lang === 'es') base = `${day} de ${MONTHS.es[mi]} de ${y}`
  else if (lang === 'fr') base = `${day} ${MONTHS.fr[mi]} ${y}`
  else if (lang === 'it') base = `${day} ${MONTHS.it[mi]} ${y}`
  else if (lang === 'pt') base = `${day} de ${MONTHS.pt[mi]} de ${y}`
  else if (lang === 'ko') base = `${y}년 ${Number(m)}월 ${day}일`
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
    appTitle: string
    tagline1: string
    tagline2: string
    greetNew: string
    greetBack: string
    aboutLink: string
    soloName: string
    soloTime: string
    soloDesc: string
    pairName: string
    pairDesc: string
    note: string
    seeCompanion: (name: string) => string
    companionDesc: string
    changeInfo: string
  }
  faq: {
    title: string
    items: { q: string; a: string }[]
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
    partyTitle: (n: number) => string
    partySub: string
    partyMore: (hidden: number) => string
    partyLess: string
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
    adoptLead: string
    adoptCta: string
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
  consent: {
    message: string
    allow: string
    deny: string
    settings: string
  }
  feedback: {
    title: string
    sub: string
    bad: string
    good: string
    great: string
    placeholder: string
    send: string
    thanks: string
  }
  companion: {
    greetToday: string
    greetDay: string
    greetBack: string
    cardTitle: string
    cardIntro: string
    colorLabel: string
    keywordLabel: string
    qualGood: string
    qualHard: string
    qualConj: string
    tabNextWeek: string
    tabNextMonth: string
    tapQuestion: string
    moodGood: string
    moodMeh: string
    moodBad: string
    domainQuestion: string
    domWork: string
    domLove: string
    domPeople: string
    domOther: string
    tapSkip: string
    reactGood: string
    reactMeh: string
    reactBad: string
    weekendTitle: string
    recapNone: string
    recapGood: string
    recapCalm: string
    recapTough: (domain: string) => string
    forecastTitle: string
    tailwindLabel: string
    cautionLabel: string
    readsTitle: (name: string, period: string) => string
    readingHeading: string
    readsIntro: (name: string) => string
    readingVoice: string
    otherPerson: string
    toMenu: string
    toPair: string
    toChat: string
    seeYouTomorrow: string
  }
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
      appTitle: 'ほしキャラ診断',
      tagline1: 'あなたはどの「ほしキャラ」?',
      tagline2: '生まれた瞬間の星の配置でわかる、16キャラ×本格星占い。',
      greetNew: 'はじめまして、ほしキャラ診断です。',
      greetBack: 'おかえりなさい。',
      aboutLink: 'ほしキャラとは？',
      soloName: '🌟 ほしキャラ診断',
      soloTime: '30秒',
      soloDesc: '生年月日だけでOK。あなたのほしキャラ(全16キャラ)と、あなたの中に住む星のキャラたちまで分析',
      pairName: '💞 ふたりの相性',
      pairDesc: 'ほしキャラの相性と「今日のふたり」を診断。相手の生年月日だけでOK',
      note: '計算は雑誌の12星座占いと同じ生年月日ベース。でも結果は、あなただけのもの。',
      seeCompanion: (name) => `あなたのほしキャラ「${name}」と会話する`,
      companionDesc: '今日の運勢や気分、ちょっとした相談まで。毎日ここで会えます。',
      changeInfo: '自分の情報を変更する',
    },
    faq: {
      title: 'よくある質問',
      items: [
        {
          q: 'ほしキャラ診断とは何ですか？',
          a: '生まれた瞬間の星の配置から、太陽星座(表の顔)と月星座(心の中)を掛け合わせて、あなたを16タイプの「ほしキャラ」に分類する無料の星占いです。さらに10天体の配置から性格や運勢も読み解きます。',
        },
        {
          q: '無料で使えますか？',
          a: 'はい。生年月日を入力するだけで、登録不要・無料で診断できます。',
        },
        {
          q: '生年月日だけで診断できますか？生まれた時刻は必要ですか？',
          a: '生年月日だけで診断できます。生まれた時刻を入れると上昇星座(アセンダント)まで計算され、より詳しい結果になります。分からなければ省略してかまいません。',
        },
        {
          q: 'ふつうの12星座占いと何が違いますか？',
          a: '雑誌の12星座占いは太陽星座だけを見ます。ほしキャラ診断は太陽星座に月星座を掛け合わせ、さらに10天体まで計算するので、あなただけの結果になります。',
        },
        {
          q: '上昇星座(アセンダント)とは何ですか？',
          a: '生まれた瞬間に東の地平線から昇っていた星座で、第一印象や生まれ持った雰囲気を表します。計算には生まれた時刻と場所が必要です。',
        },
        {
          q: '相性診断もできますか？',
          a: 'はい。相手の生年月日を入れると、ふたりのほしキャラ相性と「今日のふたり」を診断できます。',
        },
      ],
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
      partyTitle: (n) => `生まれた瞬間の、あなたの${n}の星`,
      partySub: 'この星たちが、あなたを動かすキャラになりました。それぞれの担当と特徴です。',
      partyMore: (hidden) => `実はあと${hidden}人いる。ぜんぶ見る`,
      partyLess: '畳む',
      domain: '担当',
      quirk: '特徴',
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
      adoptLead: 'このほしキャラを、毎日そばに。',
      adoptCta: 'この子と毎日、星を見る',
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
      sub: 'あなたのほしキャラがなんでも相談にのります',
      historyCount: (n) => `これまでの相談 ${n}件`,
      hide: '非表示にする',
      show: '表示する',
      intro: '気になることを聞いてみてください。恋愛・仕事・性格・これからの運勢——あなたの星の配置といまの星回りをもとにお答えします。',
      inputPlaceholder: 'メッセージを入力…',
      note: '送信するとあなたのほしキャラのデータがAIに送られます。',
      clear: '会話を消す',
      delAria: 'この質問と回答を削除',
      sendAria: '送信',
      starters: [
        { label: '🌌 じっくり占って', q: 'いまの私を、星からじっくり占ってほしいな。' },
        { label: '💕 恋愛', q: 'いまの恋愛運と、恋愛で私が気をつけるといいことを教えて。' },
        { label: '💼 仕事', q: '仕事でいまの私が力を発揮するには、どう動くといい?' },
        { label: '🤝 人間関係', q: '人間関係で私が心地よくいるためのヒントがほしいな。' },
        { label: '🌱 性格', q: '星から見て、私って結局どういう性格の持ち主?' },
        { label: '🔮 この先', q: 'これからの私に、星はどんな流れを用意してる?' },
      ],
    },
    footer: '星の計算はすべてお使いの端末内で行われます。相談室でほしキャラに相談したときだけ、計算結果が送信されます。',
    consent: {
      message: '匿名の利用状況を計測してもよいですか？(個人情報・生年月日は送信しません)',
      allow: '許可する',
      deny: 'しない',
      settings: '計測設定',
    },
    feedback: {
      title: 'この診断はどうでしたか？',
      sub: '感想や「ここ変」など、ひとことあると嬉しいです',
      bad: 'いまひとつ',
      good: 'よかった',
      great: '最高',
      placeholder: 'コメント(任意)',
      send: '送信',
      thanks: 'ありがとうございました！',
    },
    companion: {
      greetToday: 'また来てくれましたね。',
      greetDay: 'おかえりなさい。今日の星を、見ていきますか？',
      greetBack: 'おかえりなさい。おひさしぶりですね。',
      cardTitle: '今日の星',
      cardIntro: '今日の星、見てみたよ。',
      colorLabel: '今日のラッキーカラー',
      keywordLabel: 'キーワード',
      qualGood: 'ラッキー',
      qualHard: '注意',
      qualConj: '注目',
      tabNextWeek: '来週',
      tabNextMonth: '来月',
      tapQuestion: '今日はいかがでしたか？',
      moodGood: 'いいことあった',
      moodMeh: 'ふつう',
      moodBad: 'しんどかった',
      domainQuestion: 'どのあたりでしたか？',
      domWork: '仕事',
      domLove: '恋愛',
      domPeople: '人間関係',
      domOther: 'なんとなく',
      tapSkip: 'スキップ',
      reactGood: 'いい表情をしていますね。その調子、ちゃんと見ていますよ。',
      reactMeh: 'そういう日もいいものです。何もない日をちゃんと過ごせるのも、実は強さですよ。',
      reactBad: '教えてくださって、ありがとうございます。今日はもう、ゆっくり休んでくださいね。明日また星を読みます。',
      weekendTitle: '今週のふりかえり',
      recapNone: '今週は静かでしたね。また気が向いたら教えてください。',
      recapGood: '今週はいい調子でしたね。その流れ、来週も。',
      recapCalm: '今週もおつかれさまでした。よく続けていますね。',
      recapTough: (domain) => `今週は「${domain}」の日に、しんどい日が多かったようです。無理をしすぎていませんか。`,
      forecastTitle: '来週の星',
      tailwindLabel: '追い風',
      cautionLabel: '注意',
      readsTitle: (name, period) => `${name}が読む、${period}`,
      readingHeading: 'ほしキャラが読む、運勢',
      readsIntro: (name) => `あなたのほしキャラ「${name}」です。今の星の巡りを読みました。`,
      readingVoice: '星の巡り、見ておいたよ。',
      otherPerson: '別の人を占う',
      toMenu: 'メインメニューへ',
      toPair: 'ふたりの相性を占う',
      toChat: 'ほしキャラに相談する',
      seeYouTomorrow: 'また明日も、ここで星を読んでいますね。',
    },
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
      appTitle: 'Hoshi-Kyara',
      tagline1: 'Which “Hoshi-Kyara” (star character) are you?',
      tagline2: '16 characters × real astrology, from the sky at the moment you were born.',
      greetNew: 'Hi, welcome to Hoshi-Kyara.',
      greetBack: 'Welcome back.',
      aboutLink: 'What is Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 sec',
      soloDesc: 'Just your birth date. We analyze your Hoshi-Kyara (1 of 16) and the planet-characters living inside you.',
      pairName: '💞 Compatibility',
      pairDesc: 'Hoshi-Kyara compatibility plus “the two of you today.” Just their birth date needed.',
      note: 'The math uses the same birth date as magazine horoscopes—but the result is yours alone.',
      seeCompanion: (name) => `Talk with your Hoshi-Kyara, “${name}”`,
      companionDesc: 'Today’s stars, your mood, a little chat—here for you every day.',
      changeInfo: 'Edit your info',
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'What is Hoshi-Kyara diagnosis?',
          a: 'It’s a free astrology reading that blends your Sun sign (outer face) and Moon sign (inner heart) to sort you into one of 16 “star characters,” then reads your personality and fortune from all 10 planets.',
        },
        {
          q: 'Is it free?',
          a: 'Yes. Just enter your birth date—no sign-up, completely free.',
        },
        {
          q: 'Can I get a reading with only my birth date? Is birth time needed?',
          a: 'Your birth date alone is enough. Adding your birth time also computes your Rising sign (Ascendant) for a more detailed result. If you don’t know it, you can leave it out.',
        },
        {
          q: 'How is it different from ordinary 12-sign horoscopes?',
          a: 'Magazine horoscopes look only at your Sun sign. Hoshi-Kyara blends in your Moon sign and calculates all 10 planets, so the result is yours alone.',
        },
        {
          q: 'What is the Rising sign (Ascendant)?',
          a: 'It’s the sign that was rising on the eastern horizon the moment you were born, reflecting your first impression and natural vibe. It needs your birth time and place to calculate.',
        },
        {
          q: 'Can I check compatibility with someone?',
          a: 'Yes. Enter their birth date to see your star-character compatibility and “the two of you today.”',
        },
      ],
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
      partyTitle: (n) => `Your ${n} stars from the moment you were born`,
      partySub: 'These stars became the characters that move you—here’s what each one handles, and what it’s like.',
      partyMore: (hidden) => `${hidden} more are hiding—see them all`,
      partyLess: 'Collapse',
      domain: 'Domain',
      quirk: 'Trait',
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
      adoptLead: 'Keep this Hoshi-Kyara close, every day.',
      adoptCta: 'Watch the stars together, daily',
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
      sub: 'Your Hoshi-Kyara is here for any question.',
      historyCount: (n) => `${n} past ${n === 1 ? 'question' : 'questions'}`,
      hide: 'Hide',
      show: 'Show',
      intro: 'Ask whatever’s on your mind. Love, work, personality, what’s ahead—answered from your birth chart and the current sky.',
      inputPlaceholder: 'Type a message…',
      note: 'Sending shares your Hoshi-Kyara data with the AI.',
      clear: 'Clear chat',
      delAria: 'Delete this question and answer',
      sendAria: 'Send',
      starters: [
        { label: '🌌 Full reading', q: 'Give me a proper reading of where I am right now, from my stars.' },
        { label: '💕 Love', q: 'What’s my love outlook right now, and what should I watch out for in love?' },
        { label: '💼 Work', q: 'How should I move to do my best at work right now?' },
        { label: '🤝 Relationships', q: 'I’d love some tips for feeling at ease in my relationships.' },
        { label: '🌱 Personality', q: 'From the stars, what kind of personality do I really have?' },
        { label: '🔮 What’s ahead', q: 'What kind of flow do the stars have in store for me ahead?' },
      ],
    },
    footer: 'All star calculations happen on your own device. Results are sent only when you talk to your Hoshi-Kyara in the chat room.',
    consent: {
      message: 'May we measure anonymous usage? (No personal data or birth dates are sent.)',
      allow: 'Allow',
      deny: 'No thanks',
      settings: 'Analytics settings',
    },
    feedback: {
      title: 'How was your reading?',
      sub: 'A quick word — what you liked or what felt off — means a lot.',
      bad: 'Meh',
      good: 'Good',
      great: 'Loved it',
      placeholder: 'Comment (optional)',
      send: 'Send',
      thanks: 'Thank you!',
    },
    companion: {
      greetToday: 'Good to see you again',
      greetDay: 'Welcome back. Here to see today’s sky?',
      greetBack: 'Welcome back—it’s been a while',
      cardTitle: 'Today’s sky',
      cardIntro: 'I took a look at today’s sky for you.',
      colorLabel: 'Today’s lucky color',
      keywordLabel: 'Keyword',
      qualGood: 'Lucky',
      qualHard: 'Caution',
      qualConj: 'Notable',
      tabNextWeek: 'Next week',
      tabNextMonth: 'Next month',
      tapQuestion: 'How was today?',
      moodGood: 'Something good',
      moodMeh: 'So-so',
      moodBad: 'It was rough',
      domainQuestion: 'Which part?',
      domWork: 'Work',
      domLove: 'Love',
      domPeople: 'People',
      domOther: 'Just a feeling',
      tapSkip: 'Skip',
      reactGood: 'Love that. Keep it up—I see you.',
      reactMeh: 'Those days count too. Getting through a quiet day is its own kind of strength.',
      reactBad: 'Thanks for telling me. Rest easy tonight—I’ll read the stars again tomorrow.',
      weekendTitle: 'This week, looking back',
      recapNone: 'A quiet week. Tell me anytime you feel like it.',
      recapGood: 'A good week. Let’s carry that into the next one.',
      recapCalm: 'Nice work this week. You’re keeping it up.',
      recapTough: (domain) => `The tough days this week clustered around ${domain}. Hope you’re not pushing too hard.`,
      forecastTitle: 'Next week’s stars',
      tailwindLabel: 'Tailwind',
      cautionLabel: 'Heads-up',
      readsTitle: (name, period) => `${period}, read by ${name}`,
      readingHeading: 'Your Hoshi-Kyara reads the stars',
      readsIntro: (name) => `I’m your Hoshi-Kyara, “${name}.” I’ve read the current stars for you.`,
      readingVoice: 'I’ve looked over the stars for you.',
      otherPerson: 'Read someone else',
      toMenu: 'Main menu',
      toPair: 'Check compatibility',
      toChat: 'Talk to your companion',
      seeYouTomorrow: 'I’ll be here reading the stars tomorrow too.',
    },
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
      appTitle: 'Hoshi-Kyara',
      tagline1: '¿Qué “Hoshi-Kyara” (personaje estelar) eres?',
      tagline2: '16 personajes × astrología real, según el cielo del momento en que naciste.',
      greetNew: 'Hola, te damos la bienvenida a Hoshi-Kyara.',
      greetBack: 'Bienvenida de nuevo.',
      aboutLink: '¿Qué es Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Solo tu fecha de nacimiento. Analizamos tu Hoshi-Kyara (1 de 16) y los planetas-personaje que viven en ti.',
      pairName: '💞 Compatibilidad',
      pairDesc: 'Compatibilidad de Hoshi-Kyara y “vosotros dos hoy”. Solo hace falta su fecha de nacimiento.',
      note: 'El cálculo usa la misma fecha que los horóscopos de revista, pero el resultado es solo tuyo.',
      seeCompanion: (name) => `Habla con tu Hoshi-Kyara, «${name}»`,
      companionDesc: 'El cielo de hoy, tu ánimo o una charla: aquí cada día.',
      changeInfo: 'Editar tus datos',
    },
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        {
          q: '¿Qué es el diagnóstico Hoshi-Kyara?',
          a: 'Es un horóscopo gratuito que combina tu signo solar (tu cara externa) y tu signo lunar (tu interior) para clasificarte en uno de 16 “personajes estelares”, y luego lee tu personalidad y tu fortuna a partir de los 10 planetas.',
        },
        {
          q: '¿Es gratis?',
          a: 'Sí. Solo introduce tu fecha de nacimiento: sin registro y totalmente gratis.',
        },
        {
          q: '¿Basta con la fecha de nacimiento? ¿Hace falta la hora?',
          a: 'Con la fecha de nacimiento es suficiente. Si añades la hora, también se calcula tu ascendente para un resultado más detallado. Si no la sabes, puedes omitirla.',
        },
        {
          q: '¿En qué se diferencia de los horóscopos de 12 signos?',
          a: 'Los horóscopos de revista solo miran el signo solar. Hoshi-Kyara suma tu signo lunar y calcula los 10 planetas, así que el resultado es solo tuyo.',
        },
        {
          q: '¿Qué es el ascendente?',
          a: 'Es el signo que ascendía por el horizonte este en el momento de tu nacimiento; refleja tu primera impresión y tu aura natural. Para calcularlo se necesitan la hora y el lugar de nacimiento.',
        },
        {
          q: '¿También puedo ver la compatibilidad con alguien?',
          a: 'Sí. Introduce la fecha de nacimiento de la otra persona para ver la compatibilidad de vuestros personajes estelares y “vosotros dos hoy”.',
        },
      ],
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
      partyTitle: (n) => `Tus ${n} astros del momento en que naciste`,
      partySub: 'Estos astros se volvieron los personajes que te mueven: de qué se encarga cada uno y cómo es.',
      partyMore: (hidden) => `Hay ${hidden} más escondidos: verlos todos`,
      partyLess: 'Contraer',
      domain: 'Área',
      quirk: 'Rasgo',
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
      adoptLead: 'Lleva a este Hoshi-Kyara contigo cada día.',
      adoptCta: 'Mirar las estrellas juntos cada día',
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
      sub: 'Tu Hoshi-Kyara responde lo que quieras.',
      historyCount: (n) => `${n} ${n === 1 ? 'consulta' : 'consultas'} anteriores`,
      hide: 'Ocultar',
      show: 'Mostrar',
      intro: 'Pregunta lo que te inquiete. Amor, trabajo, personalidad, lo que viene: respondemos desde tu carta natal y el cielo actual.',
      inputPlaceholder: 'Escribe un mensaje…',
      note: 'Al enviar, compartes los datos de tu Hoshi-Kyara con la IA.',
      clear: 'Borrar conversación',
      delAria: 'Eliminar esta pregunta y su respuesta',
      sendAria: 'Enviar',
      starters: [
        { label: '🌌 Lectura completa', q: 'Hazme una lectura completa de cómo estoy ahora, según mis estrellas.' },
        { label: '💕 Amor', q: '¿Cómo está mi panorama amoroso ahora y qué debería cuidar en el amor?' },
        { label: '💼 Trabajo', q: '¿Cómo debería moverme para dar lo mejor en el trabajo ahora mismo?' },
        { label: '🤝 Relaciones', q: 'Me vendrían bien consejos para sentirme a gusto en mis relaciones.' },
        { label: '🌱 Personalidad', q: 'Según las estrellas, ¿qué tipo de personalidad tengo en realidad?' },
        { label: '🔮 Lo que viene', q: '¿Qué clase de corriente me preparan las estrellas de cara al futuro?' },
      ],
    },
    footer: 'Todos los cálculos astrales ocurren en tu propio dispositivo. Los resultados solo se envían cuando hablas con tu Hoshi-Kyara en la sala de consulta.',
    consent: {
      message: '¿Podemos medir el uso de forma anónima? (No se envían datos personales ni fechas de nacimiento.)',
      allow: 'Permitir',
      deny: 'No, gracias',
      settings: 'Ajustes de medición',
    },
    feedback: {
      title: '¿Qué te pareció?',
      sub: 'Un comentario —lo que te gustó o lo que chirría— nos ayuda mucho.',
      bad: 'Regular',
      good: 'Bien',
      great: 'Me encantó',
      placeholder: 'Comentario (opcional)',
      send: 'Enviar',
      thanks: '¡Gracias!',
    },
    companion: {
      greetToday: 'Qué bueno verte otra vez',
      greetDay: 'Hola de nuevo. ¿Vienes a ver el cielo de hoy?',
      greetBack: 'Bienvenida de nuevo, cuánto tiempo',
      cardTitle: 'El cielo de hoy',
      cardIntro: 'Miré el cielo de hoy por ti.',
      colorLabel: 'Color de la suerte de hoy',
      keywordLabel: 'Palabra clave',
      qualGood: 'Suerte',
      qualHard: 'Atención',
      qualConj: 'A destacar',
      tabNextWeek: 'Próx. semana',
      tabNextMonth: 'Próx. mes',
      tapQuestion: '¿Qué tal hoy?',
      moodGood: 'Algo bueno',
      moodMeh: 'Normal',
      moodBad: 'Fue duro',
      domainQuestion: '¿En qué parte?',
      domWork: 'Trabajo',
      domLove: 'Amor',
      domPeople: 'Relaciones',
      domOther: 'Sin más',
      tapSkip: 'Saltar',
      reactGood: 'Me encanta. Sigue así, te veo.',
      reactMeh: 'Esos días también cuentan. Pasar un día tranquilo es una fortaleza en sí.',
      reactBad: 'Gracias por contármelo. Descansa esta noche; mañana volveré a leer las estrellas.',
      weekendTitle: 'Repaso de la semana',
      recapNone: 'Semana tranquila. Cuéntame cuando quieras.',
      recapGood: 'Buena semana. Sigamos así la próxima.',
      recapCalm: 'Buen trabajo esta semana. Vas manteniéndolo.',
      recapTough: (domain) => `Los días difíciles de esta semana se juntaron en «${domain}». Ojalá no te estés exigiendo de más.`,
      forecastTitle: 'Las estrellas de la próxima semana',
      tailwindLabel: 'Viento a favor',
      cautionLabel: 'Atención',
      readsTitle: (name, period) => `${period}, leído por ${name}`,
      readingHeading: 'Tu Hoshi-Kyara lee las estrellas',
      readsIntro: (name) => `Soy tu Hoshi-Kyara, «${name}». He leído las estrellas de ahora para ti.`,
      readingVoice: 'Ya miré cómo van las estrellas por ti.',
      otherPerson: 'Consultar a otra persona',
      toMenu: 'Menú principal',
      toPair: 'Ver compatibilidad',
      toChat: 'Hablar con tu compañero',
      seeYouTomorrow: 'Mañana también estaré aquí leyendo las estrellas.',
    },
  },
  fr: {
    common: {
      back: 'Retour',
      nameLabel: 'Nom (facultatif)',
      namePlaceholder: 'Un surnom convient',
      birthdate: 'Date de naissance',
      birthtime: 'Heure de naissance (facultatif)',
      when: 'Quelle période ?',
      periodAria: 'Période de lecture',
      tryAgain: 'Réessayer',
      unknownError: 'Erreur inconnue',
      backToModes: '← Retour aux modes',
    },
    home: {
      appTitle: 'Hoshi-Kyara',
      tagline1: 'Quel « Hoshi-Kyara » (personnage stellaire) es-tu ?',
      tagline2: '16 personnages × vraie astrologie, d’après le ciel de l’instant de ta naissance.',
      greetNew: 'Bonjour, bienvenue sur Hoshi-Kyara.',
      greetBack: 'Bon retour.',
      aboutLink: 'C’est quoi Hoshi-Kyara ?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Juste ta date de naissance. On analyse ton Hoshi-Kyara (1 sur 16) et les planètes-personnages qui vivent en toi.',
      pairName: '💞 Compatibilité',
      pairDesc: 'La compatibilité des Hoshi-Kyara et « vous deux aujourd’hui ». Il suffit de sa date de naissance.',
      note: 'Le calcul part de la même date que les horoscopes de magazine, mais le résultat n’appartient qu’à toi.',
      seeCompanion: (name) => `Parle avec ton Hoshi-Kyara, « ${name} »`,
      companionDesc: 'Le ciel du jour, ton humeur, un petit échange : ici chaque jour.',
      changeInfo: 'Modifier mes infos',
    },
    faq: {
      title: 'Questions fréquentes',
      items: [
        {
          q: 'Qu’est-ce que le diagnostic Hoshi-Kyara ?',
          a: 'C’est un horoscope gratuit qui combine ton signe solaire (ta face visible) et ton signe lunaire (ton for intérieur) pour te classer parmi 16 « personnages stellaires », puis lit ta personnalité et ta destinée à partir des 10 planètes.',
        },
        {
          q: 'Est-ce gratuit ?',
          a: 'Oui. Il suffit d’indiquer ta date de naissance : sans inscription et entièrement gratuit.',
        },
        {
          q: 'La date de naissance suffit-elle ? L’heure est-elle nécessaire ?',
          a: 'La date de naissance suffit. En ajoutant l’heure, on calcule aussi ton ascendant pour un résultat plus détaillé. Si tu ne la connais pas, tu peux l’omettre.',
        },
        {
          q: 'Quelle différence avec les horoscopes à 12 signes ?',
          a: 'Les horoscopes de magazine ne regardent que le signe solaire. Hoshi-Kyara y ajoute ton signe lunaire et calcule les 10 planètes : le résultat n’appartient qu’à toi.',
        },
        {
          q: 'Qu’est-ce que l’ascendant ?',
          a: 'C’est le signe qui se levait à l’horizon est au moment de ta naissance ; il reflète ta première impression et ton aura naturelle. Son calcul nécessite l’heure et le lieu de naissance.',
        },
        {
          q: 'Peut-on aussi tester la compatibilité avec quelqu’un ?',
          a: 'Oui. Saisis la date de naissance de l’autre personne pour découvrir la compatibilité de vos personnages stellaires et « vous deux aujourd’hui ».',
        },
      ],
    },
    about: {
      title: 'C’est quoi Hoshi-Kyara ?',
      lead: 'Ton propre personnage, né des astres à l’instant où tu es arrivé·e.',
      what: [
        '« Hoshi-Kyara », c’est ton propre personnage, né de la position des astres au moment de ta naissance.',
        'Au signe solaire (ton visage extérieur) utilisé par les horoscopes de magazine, on ajoute le signe lunaire (ton cœur intérieur) pour refléter à la fois « toi vu·e par les autres » et « toi à l’intérieur ».',
        'Les signes se répartissent en quatre éléments (Feu, Terre, Air, Eau). Quatre éléments solaires × quatre éléments lunaires = 16 personnages en tout. Tu es exactement l’un d’eux.',
      ],
      howTitle: 'Comment se décident les 16',
      outer: 'Visage extérieur',
      inner: 'Cœur intérieur',
      sunElement: 'Élément du Soleil',
      moonElement: 'Élément de la Lune',
      elementsTitle: 'Les quatre éléments',
      elements: {
        火: 'Passion, action, énergie',
        地: 'Réalité, stabilité, constance',
        風: 'Intellect, mots, liberté',
        水: 'Émotion, empathie, imagination',
      },
      listTitle: 'Les 16 Hoshi-Kyara',
      listSub: 'Ton personnage, défini par les éléments Soleil × Lune',
      cta: 'Trouve ton Hoshi-Kyara',
    },
    birth: {
      title: 'Hoshi-Kyara',
      sub: 'Juste ta date de naissance. On analyse ton Hoshi-Kyara et tout le ciel de l’instant de ta naissance.',
      timeHint: 'Elle figure sur ton acte de naissance. Inconnue, ce n’est pas grave (on approxime à midi et on omet l’Ascendant).',
      country: 'Pays de naissance',
      countryHint: 'Sélectionné automatiquement depuis ton appareil. Sert à calculer ton Ascendant (ignoré si aucune heure n’est saisie).',
      prefecture: 'Département de naissance',
      prefectureHint: 'Améliore légèrement la précision de l’Ascendant (ignoré si aucune heure n’est saisie).',
      periodHint: 'On lit la fortune de cette période à partir des transits au moment de la lecture.',
      submit: 'Lire les étoiles',
      errNoDate: 'Saisis une date de naissance',
      errBadDate: 'Le format de la date est invalide',
    },
    pair: {
      title: 'Compatibilité',
      sub: 'On lit « vous deux maintenant » à partir de votre affinité de personnages et du ciel actuel.',
      you: '🌟 Toi',
      partner: '💫 L’autre personne',
      youName: 'Toi',
      partnerName: 'L’autre personne',
      timeHint: 'Inconnue, ce n’est pas grave (on approxime le signe lunaire à midi).',
      submit: 'Lire vos étoiles',
      errNoDate: (name) => `Saisis la date de naissance de ${name}`,
      errBadDate: (name) => `Le format de la date de ${name} est invalide`,
    },
    result: {
      born: (date) => `Né·e le ${date}`,
      title: (name) => (name ? `Le Hoshi-Kyara de ${name}` : 'Ton Hoshi-Kyara'),
      synthLabel: '✦ Ton Hoshi-Kyara, en détail ✦',
      outerFace: 'Visage extérieur',
      innerHeart: 'Cœur intérieur',
      typeCount: 'L’un des 16 personnages',
      partyTitle: (n) => `Tes ${n} astres de l’instant de ta naissance`,
      partySub: 'Ces astres sont devenus les personnages qui te font avancer : ce dont chacun s’occupe et son caractère.',
      partyMore: (hidden) => `${hidden} autres se cachent — tout voir`,
      partyLess: 'Réduire',
      domain: 'Domaine',
      quirk: 'Trait',
      genBadge: 'Génér.',
      partyFoot: '« Génér. » = planètes lentes qui reflètent aussi l’air du temps de toute ta génération.',
      fortuneTitle: (period) => `Fortune : ${period}`,
      fortuneSub: (name) => `Lu à partir des transits actuels et ${name ? `du Hoshi-Kyara de ${name}` : 'de ton Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `D’après les angles entre les astres qui traversent le ciel (${noun}) et ton thème de naissance.`,
      aiTitle: 'Lecture Hoshi-Kyara détaillée de l’astrologue IA',
      aiSub: (name) => `L’IA lit ${name ? `le thème de ${name}` : 'ton thème'} et les transits actuels`,
      aiCta: 'Obtenir une lecture IA détaillée',
      aiNote: 'Les résultats ci-dessus (signes et angles) sont envoyés à l’IA. La lecture prend environ 10–30 secondes.',
      aiLoading: 'Lecture des étoiles… (patiente environ 10–30 secondes)',
      upsell: 'Avec ton heure de naissance, on peut ajouter l’Ascendant et une synthèse complète de trois astres (et le signe lunaire gagne en précision). Vérifie ton acte de naissance.',
      adoptLead: 'Garde ce Hoshi-Kyara près de toi, chaque jour.',
      adoptCta: 'Regarder les étoiles ensemble, chaque jour',
      retry: 'Lire à nouveau',
      home: 'Retour aux modes',
    },
    pairResult: {
      title: 'Compatibilité',
      matchLabel: 'Affinité',
      breakdownTitle: 'Détail de l’affinité',
      breakdownSub: 'À partir de quatre combinaisons de Soleil (visage extérieur) et Lune (cœur)',
      todayTitle: (period) => `Vous deux : ${period}`,
      todaySub: (skyNote) => `${skyNote} — quel vent cela souffle-t-il sur vous deux ?`,
      aiTitle: 'Lecture de couple de l’astrologue IA',
      aiSub: (a, b) => `L’IA lit les étoiles de ${a} et ${b}`,
      aiCta: 'Obtenir une lecture IA détaillée pour deux',
      aiNote: 'Les résultats ci-dessus (signes, affinité et angles) sont envoyés à l’IA. La lecture prend environ 10–30 secondes.',
      aiLoading: 'Lecture des étoiles de vous deux… (patiente environ 10–30 secondes)',
      upsell: 'Avec les heures de naissance, les signes lunaires gagnent en précision et l’affinité s’affine (actuellement approximée à midi).',
      retry: 'Changer les détails et recommencer',
      home: 'Retour aux modes',
    },
    chat: {
      title: 'Salon Hoshi-Kyara',
      sub: 'Ton Hoshi-Kyara répond à tout.',
      historyCount: (n) => `${n} ${n === 1 ? 'question' : 'questions'} déjà posée${n === 1 ? '' : 's'}`,
      hide: 'Masquer',
      show: 'Afficher',
      intro: 'Demande ce qui te préoccupe. Amour, travail, personnalité, l’avenir — on répond à partir de ton thème natal et du ciel actuel.',
      inputPlaceholder: 'Écris un message…',
      note: 'En envoyant, tu partages les données de ton Hoshi-Kyara avec l’IA.',
      clear: 'Effacer la conversation',
      delAria: 'Supprimer cette question et sa réponse',
      sendAria: 'Envoyer',
      starters: [
        { label: '🌌 Lecture complète', q: 'Fais-moi une vraie lecture de là où j’en suis, d’après mes étoiles.' },
        { label: '💕 Amour', q: 'Comment se présente ma vie amoureuse en ce moment, et à quoi devrais-je faire attention en amour ?' },
        { label: '💼 Travail', q: 'Comment devrais-je agir pour donner le meilleur au travail en ce moment ?' },
        { label: '🤝 Relations', q: 'J’aimerais des conseils pour me sentir à l’aise dans mes relations.' },
        { label: '🌱 Personnalité', q: 'D’après les étoiles, quel genre de personnalité ai-je vraiment ?' },
        { label: '🔮 L’avenir', q: 'Quel genre de courant les étoiles me réservent-elles pour la suite ?' },
      ],
    },
    footer: 'Tous les calculs astraux se font sur ton propre appareil. Les résultats ne sont envoyés que lorsque tu parles à ton Hoshi-Kyara dans le salon.',
    consent: {
      message: 'Pouvons-nous mesurer l’usage de façon anonyme ? (Aucune donnée personnelle ni date de naissance n’est envoyée.)',
      allow: 'Autoriser',
      deny: 'Non merci',
      settings: 'Paramètres de mesure',
    },
    feedback: {
      title: 'Alors, ce résultat ?',
      sub: 'Un petit mot — ce qui t’a plu ou ce qui cloche — nous aide beaucoup.',
      bad: 'Bof',
      good: 'Bien',
      great: 'Adoré',
      placeholder: 'Commentaire (facultatif)',
      send: 'Envoyer',
      thanks: 'Merci !',
    },
    companion: {
      greetToday: 'Contente de te revoir',
      greetDay: 'Re-bonjour. Tu viens voir le ciel du jour ?',
      greetBack: 'Re-bonjour, ça faisait longtemps',
      cardTitle: 'Le ciel du jour',
      cardIntro: 'J’ai regardé le ciel du jour pour toi.',
      colorLabel: 'Couleur porte-bonheur du jour',
      keywordLabel: 'Mot-clé',
      qualGood: 'Chance',
      qualHard: 'Attention',
      qualConj: 'À noter',
      tabNextWeek: 'Sem. proch.',
      tabNextMonth: 'Mois proch.',
      tapQuestion: 'Ça a été, aujourd’hui ?',
      moodGood: 'Un bon moment',
      moodMeh: 'Bof',
      moodBad: 'Dur',
      domainQuestion: 'Côté quoi ?',
      domWork: 'Travail',
      domLove: 'Amour',
      domPeople: 'Relations',
      domOther: 'Comme ça',
      tapSkip: 'Passer',
      reactGood: 'J’adore. Continue comme ça, je te vois.',
      reactMeh: 'Ces jours-là comptent aussi. Traverser un jour calme, c’est déjà une force.',
      reactBad: 'Merci de me l’avoir dit. Repose-toi ce soir ; je relirai les étoiles demain.',
      weekendTitle: 'Le bilan de la semaine',
      recapNone: 'Une semaine calme. Dis-moi quand tu veux.',
      recapGood: 'Une bonne semaine. Gardons cet élan la prochaine.',
      recapCalm: 'Beau travail cette semaine. Tu tiens bon.',
      recapTough: (domain) => `Les jours durs de la semaine se sont concentrés côté « ${domain} ». J’espère que tu ne forces pas trop.`,
      forecastTitle: 'Les étoiles de la semaine prochaine',
      tailwindLabel: 'Vent porteur',
      cautionLabel: 'Vigilance',
      readsTitle: (name, period) => `${period}, lu par ${name}`,
      readingHeading: 'Ton Hoshi-Kyara lit les étoiles',
      readsIntro: (name) => `Je suis ton Hoshi-Kyara, « ${name} ». J’ai lu les étoiles du moment pour toi.`,
      readingVoice: 'J’ai jeté un œil aux étoiles pour toi.',
      otherPerson: 'Consulter une autre personne',
      toMenu: 'Menu principal',
      toPair: 'Tester la compatibilité',
      toChat: 'Parler à ton compagnon',
      seeYouTomorrow: 'Je serai là demain aussi, à lire les étoiles.',
    },
  },
  it: {
    common: {
      back: 'Indietro',
      nameLabel: 'Nome (facoltativo)',
      namePlaceholder: 'Va bene anche un soprannome',
      birthdate: 'Data di nascita',
      birthtime: 'Ora di nascita (facoltativo)',
      when: 'Quale periodo?',
      periodAria: 'Periodo di lettura',
      tryAgain: 'Riprova',
      unknownError: 'Errore sconosciuto',
      backToModes: '← Torna ai modi',
    },
    home: {
      appTitle: 'Hoshi-Kyara',
      tagline1: 'Quale « Hoshi-Kyara » (personaggio stellare) sei?',
      tagline2: '16 personaggi × astrologia vera, dal cielo dell’istante in cui sei nato/a.',
      greetNew: 'Ciao, benvenuto/a su Hoshi-Kyara.',
      greetBack: 'Bentornato/a.',
      aboutLink: 'Cos’è Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Basta la tua data di nascita. Analizziamo il tuo Hoshi-Kyara (1 su 16) e i pianeti-personaggio che vivono in te.',
      pairName: '💞 Compatibilità',
      pairDesc: 'La compatibilità degli Hoshi-Kyara e « voi due oggi ». Basta la sua data di nascita.',
      note: 'Il calcolo usa la stessa data degli oroscopi delle riviste, ma il risultato è solo tuo.',
      seeCompanion: (name) => `Parla con il tuo Hoshi-Kyara, «${name}»`,
      companionDesc: 'Il cielo di oggi, il tuo umore, due parole: qui ogni giorno.',
      changeInfo: 'Modifica i tuoi dati',
    },
    faq: {
      title: 'Domande frequenti',
      items: [
        {
          q: 'Che cos’è la diagnosi Hoshi-Kyara?',
          a: 'È un oroscopo gratuito che combina il tuo segno solare (il volto esterno) e il segno lunare (il tuo interiore) per collocarti in uno dei 16 “personaggi stellari”, poi legge personalità e fortuna a partire dai 10 pianeti.',
        },
        {
          q: 'È gratis?',
          a: 'Sì. Basta inserire la data di nascita: senza registrazione e completamente gratis.',
        },
        {
          q: 'Basta la data di nascita? Serve l’ora?',
          a: 'La data di nascita è sufficiente. Aggiungendo l’ora si calcola anche l’ascendente per un risultato più dettagliato. Se non la conosci, puoi ometterla.',
        },
        {
          q: 'In che cosa differisce dagli oroscopi a 12 segni?',
          a: 'Gli oroscopi delle riviste guardano solo al segno solare. Hoshi-Kyara aggiunge il segno lunare e calcola tutti e 10 i pianeti, così il risultato è solo tuo.',
        },
        {
          q: 'Che cos’è l’ascendente?',
          a: 'È il segno che sorgeva sull’orizzonte est nel momento della tua nascita; riflette la prima impressione e l’aura naturale. Per calcolarlo servono ora e luogo di nascita.',
        },
        {
          q: 'Posso vedere anche l’affinità con qualcuno?',
          a: 'Sì. Inserisci la data di nascita dell’altra persona per scoprire l’affinità dei vostri personaggi stellari e “voi due oggi”.',
        },
      ],
    },
    about: {
      title: 'Cos’è Hoshi-Kyara?',
      lead: 'Il tuo personaggio, nato dagli astri nell’istante in cui sei arrivato/a.',
      what: [
        '« Hoshi-Kyara » è il tuo personaggio, nato dalla disposizione degli astri nel momento della tua nascita.',
        'Al segno solare (il tuo volto esterno) usato dagli oroscopi delle riviste aggiungiamo il segno lunare (il tuo cuore interiore) per riflettere sia « te come ti vedono gli altri » sia « te dentro ».',
        'I segni si dividono in quattro elementi (Fuoco, Terra, Aria, Acqua). Quattro elementi solari × quattro lunari = 16 personaggi in tutto. Tu sei esattamente uno di loro.',
      ],
      howTitle: 'Come si decidono i 16',
      outer: 'Volto esterno',
      inner: 'Cuore interiore',
      sunElement: 'Elemento del Sole',
      moonElement: 'Elemento della Luna',
      elementsTitle: 'I quattro elementi',
      elements: {
        火: 'Passione, azione, energia',
        地: 'Realtà, stabilità, costanza',
        風: 'Intelletto, parole, libertà',
        水: 'Emozione, empatia, immaginazione',
      },
      listTitle: 'I 16 Hoshi-Kyara',
      listSub: 'Il tuo personaggio, definito dagli elementi Sole × Luna',
      cta: 'Scopri il tuo Hoshi-Kyara',
    },
    birth: {
      title: 'Hoshi-Kyara',
      sub: 'Basta la tua data di nascita. Analizziamo il tuo Hoshi-Kyara e tutto il cielo dell’istante in cui sei nato/a.',
      timeHint: 'È riportata sul tuo certificato di nascita. Se non la sai, va bene lo stesso (approssimiamo a mezzogiorno e omettiamo l’Ascendente).',
      country: 'Paese di nascita',
      countryHint: 'Selezionato automaticamente dal tuo dispositivo. Serve a calcolare l’Ascendente (ignorato se non indichi l’ora).',
      prefecture: 'Provincia di nascita',
      prefectureHint: 'Migliora leggermente la precisione dell’Ascendente (ignorato se non indichi l’ora).',
      periodHint: 'Leggiamo la fortuna di questo periodo dai transiti al momento della lettura.',
      submit: 'Leggere le stelle',
      errNoDate: 'Inserisci una data di nascita',
      errBadDate: 'Il formato della data non è valido',
    },
    pair: {
      title: 'Compatibilità',
      sub: 'Leggiamo « voi due adesso » dalla vostra affinità di personaggi e dal cielo attuale.',
      you: '🌟 Tu',
      partner: '💫 L’altra persona',
      youName: 'Tu',
      partnerName: 'L’altra persona',
      timeHint: 'Se non la sai, va bene lo stesso (approssimiamo il segno lunare a mezzogiorno).',
      submit: 'Leggere le vostre stelle',
      errNoDate: (name) => `Inserisci la data di nascita di ${name}`,
      errBadDate: (name) => `Il formato della data di ${name} non è valido`,
    },
    result: {
      born: (date) => `Nato/a il ${date}`,
      title: (name) => (name ? `L’Hoshi-Kyara di ${name}` : 'Il tuo Hoshi-Kyara'),
      synthLabel: '✦ Il tuo Hoshi-Kyara, in dettaglio ✦',
      outerFace: 'Volto esterno',
      innerHeart: 'Cuore interiore',
      typeCount: 'Uno dei 16 personaggi',
      partyTitle: (n) => `I tuoi ${n} astri dell’istante in cui sei nato`,
      partySub: 'Questi astri sono diventati i personaggi che ti muovono: di cosa si occupa ognuno e com’è fatto.',
      partyMore: (hidden) => `Ce ne sono altri ${hidden} nascosti: vedili tutti`,
      partyLess: 'Comprimi',
      domain: 'Ambito',
      quirk: 'Tratto',
      genBadge: 'Gen',
      partyFoot: '« Gen » = pianeti lenti che riflettono anche l’aria di tutta la tua generazione.',
      fortuneTitle: (period) => `Fortuna: ${period}`,
      fortuneSub: (name) => `Letto dai transiti attuali e ${name ? `dall’Hoshi-Kyara di ${name}` : 'dal tuo Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `Basato sugli angoli tra gli astri che attraversano il cielo (${noun}) e il tuo tema natale.`,
      aiTitle: 'Lettura Hoshi-Kyara dettagliata dell’astrologo IA',
      aiSub: (name) => `L’IA legge ${name ? `il tema di ${name}` : 'il tuo tema'} e i transiti attuali`,
      aiCta: 'Ottieni una lettura IA dettagliata',
      aiNote: 'I risultati qui sopra (segni e angoli) vengono inviati all’IA. La lettura richiede circa 10–30 secondi.',
      aiLoading: 'Sto leggendo le stelle… (attendi circa 10–30 secondi)',
      upsell: 'Con la tua ora di nascita possiamo aggiungere l’Ascendente e una sintesi completa di tre astri (e il segno lunare guadagna precisione). Controlla il tuo certificato di nascita.',
      adoptLead: 'Tieni questo Hoshi-Kyara vicino, ogni giorno.',
      adoptCta: 'Guardare le stelle insieme, ogni giorno',
      retry: 'Leggere di nuovo',
      home: 'Torna ai modi',
    },
    pairResult: {
      title: 'Compatibilità',
      matchLabel: 'Affinità',
      breakdownTitle: 'Dettaglio dell’affinità',
      breakdownSub: 'Da quattro combinazioni di Sole (volto esterno) e Luna (cuore)',
      todayTitle: (period) => `Voi due: ${period}`,
      todaySub: (skyNote) => `${skyNote} — che vento fa soffiare questo su di voi due?`,
      aiTitle: 'Lettura di coppia dell’astrologo IA',
      aiSub: (a, b) => `L’IA legge le stelle di ${a} e ${b}`,
      aiCta: 'Ottieni una lettura IA dettagliata per due',
      aiNote: 'I risultati qui sopra (segni, affinità e angoli) vengono inviati all’IA. La lettura richiede circa 10–30 secondi.',
      aiLoading: 'Sto leggendo le stelle di voi due… (attendi circa 10–30 secondi)',
      upsell: 'Con le ore di nascita i segni lunari guadagnano precisione e l’affinità si affina (ora approssimata a mezzogiorno).',
      retry: 'Cambia i dati e riprova',
      home: 'Torna ai modi',
    },
    chat: {
      title: 'Sala Hoshi-Kyara',
      sub: 'Il tuo Hoshi-Kyara risponde a qualsiasi cosa.',
      historyCount: (n) => `${n} ${n === 1 ? 'domanda' : 'domande'} finora`,
      hide: 'Nascondi',
      show: 'Mostra',
      intro: 'Chiedi ciò che ti sta a cuore. Amore, lavoro, personalità, il futuro — rispondiamo dal tuo tema natale e dal cielo attuale.',
      inputPlaceholder: 'Scrivi un messaggio…',
      note: 'Inviando, condividi i dati del tuo Hoshi-Kyara con l’IA.',
      clear: 'Cancella la conversazione',
      delAria: 'Elimina questa domanda e la risposta',
      sendAria: 'Invia',
      starters: [
        { label: '🌌 Lettura completa', q: 'Fammi una lettura completa di come sto adesso, dalle mie stelle.' },
        { label: '💕 Amore', q: 'Com’è il mio momento in amore adesso e a cosa dovrei fare attenzione?' },
        { label: '💼 Lavoro', q: 'Come dovrei muovermi per dare il meglio sul lavoro in questo momento?' },
        { label: '🤝 Relazioni', q: 'Mi servirebbero consigli per stare a mio agio nelle relazioni.' },
        { label: '🌱 Personalità', q: 'Secondo le stelle, che tipo di personalità ho davvero?' },
        { label: '🔮 Il futuro', q: 'Che tipo di corrente mi preparano le stelle per il futuro?' },
      ],
    },
    footer: 'Tutti i calcoli astrali avvengono sul tuo dispositivo. I risultati vengono inviati solo quando parli con il tuo Hoshi-Kyara nella sala consulti.',
    consent: {
      message: 'Possiamo misurare l’uso in forma anonima? (Non vengono inviati dati personali né date di nascita.)',
      allow: 'Consenti',
      deny: 'No, grazie',
      settings: 'Impostazioni di misurazione',
    },
    feedback: {
      title: 'Com’è andata?',
      sub: 'Due parole — cosa ti è piaciuto o cosa stona — ci aiutano molto.',
      bad: 'Così così',
      good: 'Bene',
      great: 'Adorato',
      placeholder: 'Commento (facoltativo)',
      send: 'Invia',
      thanks: 'Grazie!',
    },
    companion: {
      greetToday: 'Bello rivederti',
      greetDay: 'Bentornata. Vieni a vedere il cielo di oggi?',
      greetBack: 'Bentornata, era un po’ che non ci vedevamo',
      cardTitle: 'Il cielo di oggi',
      cardIntro: 'Ho dato un’occhiata al cielo di oggi per te.',
      colorLabel: 'Colore fortunato di oggi',
      keywordLabel: 'Parola chiave',
      qualGood: 'Fortuna',
      qualHard: 'Attenzione',
      qualConj: 'Da notare',
      tabNextWeek: 'Pross. sett.',
      tabNextMonth: 'Pross. mese',
      tapQuestion: 'Com’è andata oggi?',
      moodGood: 'Qualcosa di bello',
      moodMeh: 'Così così',
      moodBad: 'Pesante',
      domainQuestion: 'In che ambito?',
      domWork: 'Lavoro',
      domLove: 'Amore',
      domPeople: 'Relazioni',
      domOther: 'Così',
      tapSkip: 'Salta',
      reactGood: 'Mi piace. Continua così, ti vedo.',
      reactMeh: 'Anche quei giorni contano. Attraversare un giorno tranquillo è già una forza.',
      reactBad: 'Grazie di avermelo detto. Stasera riposati; domani rileggerò le stelle.',
      weekendTitle: 'Il riepilogo della settimana',
      recapNone: 'Settimana tranquilla. Dimmelo quando ti va.',
      recapGood: 'Bella settimana. Portiamo questo slancio anche alla prossima.',
      recapCalm: 'Bel lavoro questa settimana. Stai tenendo duro.',
      recapTough: (domain) => `I giorni pesanti di questa settimana si sono concentrati su «${domain}». Spero tu non ti stia sforzando troppo.`,
      forecastTitle: 'Le stelle della prossima settimana',
      tailwindLabel: 'Vento a favore',
      cautionLabel: 'Attenzione',
      readsTitle: (name, period) => `${period}, letto da ${name}`,
      readingHeading: 'Il tuo Hoshi-Kyara legge le stelle',
      readsIntro: (name) => `Sono il tuo Hoshi-Kyara, «${name}». Ho letto le stelle di adesso per te.`,
      readingVoice: 'Ho dato un’occhiata alle stelle per te.',
      otherPerson: 'Consultare un’altra persona',
      toMenu: 'Menu principale',
      toPair: 'Vedi l’affinità',
      toChat: 'Parla con il tuo compagno',
      seeYouTomorrow: 'Domani sarò qui a leggere le stelle, come sempre.',
    },
  },
  pt: {
    common: {
      back: 'Voltar',
      nameLabel: 'Nome (opcional)',
      namePlaceholder: 'Um apelido serve',
      birthdate: 'Data de nascimento',
      birthtime: 'Hora de nascimento (opcional)',
      when: 'Qual período?',
      periodAria: 'Período de leitura',
      tryAgain: 'Tentar de novo',
      unknownError: 'Erro desconhecido',
      backToModes: '← Voltar aos modos',
    },
    home: {
      appTitle: 'Hoshi-Kyara',
      tagline1: 'Qual « Hoshi-Kyara » (personagem estelar) é você?',
      tagline2: '16 personagens × astrologia de verdade, a partir do céu no instante em que você nasceu.',
      greetNew: 'Olá, boas-vindas ao Hoshi-Kyara.',
      greetBack: 'Bem-vindo/a de volta.',
      aboutLink: 'O que é Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Só a sua data de nascimento. Analisamos o seu Hoshi-Kyara (1 de 16) e os planetas-personagem que vivem em você.',
      pairName: '💞 Compatibilidade',
      pairDesc: 'A compatibilidade dos Hoshi-Kyara e « vocês dois hoje ». Basta a data de nascimento da outra pessoa.',
      note: 'O cálculo usa a mesma data dos horóscopos de revista, mas o resultado é só seu.',
      seeCompanion: (name) => `Converse com o seu Hoshi-Kyara, «${name}»`,
      companionDesc: 'O céu de hoje, seu humor, um bate-papo: aqui todo dia.',
      changeInfo: 'Editar seus dados',
    },
    faq: {
      title: 'Perguntas frequentes',
      items: [
        {
          q: 'O que é o diagnóstico Hoshi-Kyara?',
          a: 'É um horóscopo gratuito que combina o seu signo solar (a face externa) e o signo lunar (o seu interior) para classificá-lo em um dos 16 “personagens estelares”, e depois lê a personalidade e a sorte a partir dos 10 planetas.',
        },
        {
          q: 'É grátis?',
          a: 'Sim. Basta informar a data de nascimento: sem cadastro e totalmente grátis.',
        },
        {
          q: 'Só a data de nascimento basta? Precisa da hora?',
          a: 'A data de nascimento já basta. Ao adicionar a hora, calcula-se também o ascendente para um resultado mais detalhado. Se não souber, pode omitir.',
        },
        {
          q: 'Qual a diferença dos horóscopos de 12 signos?',
          a: 'Os horóscopos de revista olham apenas o signo solar. O Hoshi-Kyara soma o signo lunar e calcula os 10 planetas, então o resultado é só seu.',
        },
        {
          q: 'O que é o ascendente?',
          a: 'É o signo que surgia no horizonte leste no momento do seu nascimento; reflete a primeira impressão e a aura natural. Para calcular, são necessários a hora e o local de nascimento.',
        },
        {
          q: 'Também dá para ver a compatibilidade com alguém?',
          a: 'Sim. Informe a data de nascimento da outra pessoa para ver a compatibilidade dos personagens estelares e “vocês dois hoje”.',
        },
      ],
    },
    about: {
      title: 'O que é Hoshi-Kyara?',
      lead: 'O seu próprio personagem, nascido dos astros no instante em que você chegou.',
      what: [
        '« Hoshi-Kyara » é o seu próprio personagem, nascido da disposição dos astros no momento em que você nasceu.',
        'Sobre o signo solar (o seu rosto externo) usado pelos horóscopos de revista, somamos o signo lunar (o seu coração interior) para refletir tanto « você como os outros veem » quanto « você por dentro ».',
        'Os signos se dividem em quatro elementos (Fogo, Terra, Ar, Água). Quatro elementos solares × quatro lunares = 16 personagens no total. Você é exatamente um deles.',
      ],
      howTitle: 'Como os 16 são definidos',
      outer: 'Rosto externo',
      inner: 'Coração interior',
      sunElement: 'Elemento do Sol',
      moonElement: 'Elemento da Lua',
      elementsTitle: 'Os quatro elementos',
      elements: {
        火: 'Paixão, ação, energia',
        地: 'Realidade, estabilidade, constância',
        風: 'Intelecto, palavras, liberdade',
        水: 'Emoção, empatia, imaginação',
      },
      listTitle: 'Os 16 Hoshi-Kyara',
      listSub: 'O seu personagem, definido pelos elementos Sol × Lua',
      cta: 'Descubra o seu Hoshi-Kyara',
    },
    birth: {
      title: 'Hoshi-Kyara',
      sub: 'Só a sua data de nascimento. Analisamos o seu Hoshi-Kyara e todo o céu do instante em que você nasceu.',
      timeHint: 'Consta na sua certidão de nascimento. Se não souber, tudo bem (aproximamos ao meio-dia e omitimos o Ascendente).',
      country: 'País de nascimento',
      countryHint: 'Selecionado automaticamente pelo seu dispositivo. Usado para calcular o Ascendente (ignorado se a hora não for informada).',
      prefecture: 'Estado de nascimento',
      prefectureHint: 'Melhora um pouco a precisão do Ascendente (ignorado se a hora não for informada).',
      periodHint: 'Lemos a fortuna deste período a partir dos trânsitos no momento da leitura.',
      submit: 'Ler as estrelas',
      errNoDate: 'Informe uma data de nascimento',
      errBadDate: 'O formato da data é inválido',
    },
    pair: {
      title: 'Compatibilidade',
      sub: 'Lemos « vocês dois agora » a partir da afinidade de personagens e do céu atual.',
      you: '🌟 Você',
      partner: '💫 A outra pessoa',
      youName: 'Você',
      partnerName: 'A outra pessoa',
      timeHint: 'Se não souber, tudo bem (aproximamos o signo lunar ao meio-dia).',
      submit: 'Ler as estrelas de vocês',
      errNoDate: (name) => `Informe a data de nascimento de ${name}`,
      errBadDate: (name) => `O formato da data de ${name} é inválido`,
    },
    result: {
      born: (date) => `Nascimento: ${date}`,
      title: (name) => (name ? `O Hoshi-Kyara de ${name}` : 'O seu Hoshi-Kyara'),
      synthLabel: '✦ O seu Hoshi-Kyara, em detalhe ✦',
      outerFace: 'Rosto externo',
      innerHeart: 'Coração interior',
      typeCount: 'Um dos 16 personagens',
      partyTitle: (n) => `Os seus ${n} astros do instante em que você nasceu`,
      partySub: 'Estes astros viraram os personagens que movem você: do que cada um cuida e como ele é.',
      partyMore: (hidden) => `Há mais ${hidden} escondidos: ver todos`,
      partyLess: 'Recolher',
      domain: 'Área',
      quirk: 'Rasgo',
      genBadge: 'Ger.',
      partyFoot: '« Ger. » = planetas lentos que também refletem o clima de toda a sua geração.',
      fortuneTitle: (period) => `Fortuna: ${period}`,
      fortuneSub: (name) => `Lido a partir dos trânsitos atuais e ${name ? `do Hoshi-Kyara de ${name}` : 'do seu Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `Baseado nos ângulos entre os astros que cruzam o céu (${noun}) e o seu mapa natal.`,
      aiTitle: 'Leitura Hoshi-Kyara detalhada do astrólogo IA',
      aiSub: (name) => `A IA lê ${name ? `o mapa de ${name}` : 'o seu mapa'} e os trânsitos atuais`,
      aiCta: 'Obter uma leitura IA detalhada',
      aiNote: 'Os resultados acima (signos e ângulos) são enviados à IA. A leitura leva cerca de 10–30 segundos.',
      aiLoading: 'Lendo as estrelas… (aguarde cerca de 10–30 segundos)',
      upsell: 'Com a sua hora de nascimento, podemos acrescentar o Ascendente e uma síntese completa de três astros (e o signo lunar fica mais preciso). Confira a sua certidão de nascimento.',
      adoptLead: 'Leve este Hoshi-Kyara com você todos os dias.',
      adoptCta: 'Ver as estrelas juntos, todo dia',
      retry: 'Ler de novo',
      home: 'Voltar aos modos',
    },
    pairResult: {
      title: 'Compatibilidade',
      matchLabel: 'Afinidade',
      breakdownTitle: 'Detalhe da afinidade',
      breakdownSub: 'A partir de quatro combinações de Sol (rosto externo) e Lua (coração)',
      todayTitle: (period) => `Vocês dois: ${period}`,
      todaySub: (skyNote) => `${skyNote} — que vento isso sopra para vocês dois?`,
      aiTitle: 'Leitura de casal do astrólogo IA',
      aiSub: (a, b) => `A IA lê as estrelas de ${a} e ${b}`,
      aiCta: 'Obter uma leitura IA detalhada para dois',
      aiNote: 'Os resultados acima (signos, afinidade e ângulos) são enviados à IA. A leitura leva cerca de 10–30 segundos.',
      aiLoading: 'Lendo as estrelas de vocês dois… (aguarde cerca de 10–30 segundos)',
      upsell: 'Com as horas de nascimento, os signos lunares ficam mais precisos e a afinidade se afina (agora aproximada ao meio-dia).',
      retry: 'Mudar os dados e repetir',
      home: 'Voltar aos modos',
    },
    chat: {
      title: 'Sala Hoshi-Kyara',
      sub: 'O seu Hoshi-Kyara responde a qualquer coisa.',
      historyCount: (n) => `${n} ${n === 1 ? 'consulta' : 'consultas'} até agora`,
      hide: 'Ocultar',
      show: 'Mostrar',
      intro: 'Pergunte o que quiser. Amor, trabalho, personalidade, o que vem aí — respondemos a partir do seu mapa natal e do céu atual.',
      inputPlaceholder: 'Escreva uma mensagem…',
      note: 'Ao enviar, você compartilha os dados do seu Hoshi-Kyara com a IA.',
      clear: 'Limpar conversa',
      delAria: 'Excluir esta pergunta e resposta',
      sendAria: 'Enviar',
      starters: [
        { label: '🌌 Leitura completa', q: 'Me faça uma leitura completa de como estou agora, pelas minhas estrelas.' },
        { label: '💕 Amor', q: 'Como está a minha vida amorosa agora e com o que devo ter cuidado no amor?' },
        { label: '💼 Trabalho', q: 'Como devo agir para dar o meu melhor no trabalho neste momento?' },
        { label: '🤝 Relações', q: 'Eu queria umas dicas para me sentir à vontade nas minhas relações.' },
        { label: '🌱 Personalidade', q: 'Pelas estrelas, que tipo de personalidade eu tenho de verdade?' },
        { label: '🔮 O que vem', q: 'Que tipo de fluxo as estrelas têm reservado para mim daqui para frente?' },
      ],
    },
    footer: 'Todos os cálculos astrais acontecem no seu próprio dispositivo. Os resultados só são enviados quando você conversa com o seu Hoshi-Kyara na sala de consulta.',
    consent: {
      message: 'Podemos medir o uso de forma anônima? (Nenhum dado pessoal ou data de nascimento é enviado.)',
      allow: 'Permitir',
      deny: 'Não, obrigado',
      settings: 'Configurações de medição',
    },
    feedback: {
      title: 'O que achou?',
      sub: 'Um comentário — o que gostou ou o que estranhou — ajuda muito.',
      bad: 'Mais ou menos',
      good: 'Gostei',
      great: 'Amei',
      placeholder: 'Comentário (opcional)',
      send: 'Enviar',
      thanks: 'Obrigado!',
    },
    companion: {
      greetToday: 'Que bom te ver de novo',
      greetDay: 'Bem-vinda de volta. Veio ver o céu de hoje?',
      greetBack: 'Bem-vinda de volta, quanto tempo',
      cardTitle: 'O céu de hoje',
      cardIntro: 'Dei uma olhada no céu de hoje para você.',
      colorLabel: 'Cor da sorte de hoje',
      keywordLabel: 'Palavra-chave',
      qualGood: 'Sorte',
      qualHard: 'Atenção',
      qualConj: 'Destaque',
      tabNextWeek: 'Próx. sem.',
      tabNextMonth: 'Próx. mês',
      tapQuestion: 'Como foi hoje?',
      moodGood: 'Algo bom',
      moodMeh: 'Mais ou menos',
      moodBad: 'Foi pesado',
      domainQuestion: 'Em qual parte?',
      domWork: 'Trabalho',
      domLove: 'Amor',
      domPeople: 'Relações',
      domOther: 'Sei lá',
      tapSkip: 'Pular',
      reactGood: 'Adorei. Continua assim, eu te vejo.',
      reactMeh: 'Esses dias também contam. Atravessar um dia calmo já é uma força.',
      reactBad: 'Obrigado por me contar. Descanse hoje; amanhã leio as estrelas de novo.',
      weekendTitle: 'A retrospectiva da semana',
      recapNone: 'Uma semana tranquila. Me conta quando quiser.',
      recapGood: 'Boa semana. Vamos levar esse ritmo para a próxima.',
      recapCalm: 'Bom trabalho nesta semana. Você está mantendo.',
      recapTough: (domain) => `Os dias difíceis desta semana se concentraram em «${domain}». Espero que não esteja se cobrando demais.`,
      forecastTitle: 'As estrelas da próxima semana',
      tailwindLabel: 'Vento a favor',
      cautionLabel: 'Atenção',
      readsTitle: (name, period) => `${period}, lido por ${name}`,
      readingHeading: 'Seu Hoshi-Kyara lê as estrelas',
      readsIntro: (name) => `Sou o seu Hoshi-Kyara, «${name}». Li as estrelas de agora para você.`,
      readingVoice: 'Já dei uma olhada nas estrelas para você.',
      otherPerson: 'Consultar outra pessoa',
      toMenu: 'Menu principal',
      toPair: 'Ver compatibilidade',
      toChat: 'Conversar com seu companheiro',
      seeYouTomorrow: 'Amanhã também estarei aqui lendo as estrelas.',
    },
  },
  ko: {
    common: {
      back: '뒤로',
      nameLabel: '이름 (선택)',
      namePlaceholder: '별명도 괜찮아요',
      birthdate: '생년월일',
      birthtime: '태어난 시각 (선택)',
      when: '어느 시기를 볼까요?',
      periodAria: '점치는 기간',
      tryAgain: '다시 시도',
      unknownError: '알 수 없는 오류',
      backToModes: '← 모드 선택으로',
    },
    home: {
      appTitle: 'Hoshi-Kyara',
      tagline1: '당신은 어떤 「Hoshi-Kyara」(별 캐릭터)인가요?',
      tagline2: '태어난 순간의 별자리로 보는, 16캐릭터 × 정통 별점.',
      greetNew: '처음 뵙겠습니다, 호시캐릭터 진단이에요.',
      greetBack: '어서 오세요.',
      aboutLink: 'Hoshi-Kyara란?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30초',
      soloDesc: '생년월일만 있으면 OK. 당신의 Hoshi-Kyara(16종 중 하나)와 당신 안에 사는 행성 캐릭터까지 분석해요.',
      pairName: '💞 궁합',
      pairDesc: 'Hoshi-Kyara 궁합과 「오늘의 두 사람」을 봐요. 상대의 생년월일만 있으면 OK.',
      note: '계산은 잡지 별자리 운세와 같은 생년월일 기반. 하지만 결과는 오직 당신만의 것.',
      seeCompanion: (name) => `당신의 호시캐릭터 「${name}」와 대화하기`,
      companionDesc: '오늘의 운세와 기분, 가벼운 상담까지. 매일 여기서 만나요.',
      changeInfo: '내 정보 변경하기',
    },
    faq: {
      title: '자주 묻는 질문',
      items: [
        {
          q: '호시캐릭터 진단이란 무엇인가요?',
          a: '태어난 순간의 별자리 배치에서 태양 별자리(겉모습)와 달 별자리(마음속)를 곱해 당신을 16가지 ‘호시캐릭터’로 분류하는 무료 별점입니다. 나아가 10개 행성 배치로 성격과 운세까지 풀이합니다.',
        },
        {
          q: '무료인가요?',
          a: '네. 생년월일만 입력하면 가입 없이 무료로 진단할 수 있습니다.',
        },
        {
          q: '생년월일만으로 진단되나요? 태어난 시각이 필요한가요?',
          a: '생년월일만으로 진단됩니다. 태어난 시각을 넣으면 상승궁(어센던트)까지 계산되어 더 자세해집니다. 모르면 생략해도 됩니다.',
        },
        {
          q: '보통 12별자리 운세와 무엇이 다른가요?',
          a: '잡지 별자리 운세는 태양 별자리만 봅니다. 호시캐릭터는 태양 별자리에 달 별자리를 곱하고 10개 행성까지 계산해 오직 당신만의 결과가 됩니다.',
        },
        {
          q: '상승궁(어센던트)이란 무엇인가요?',
          a: '태어난 순간 동쪽 지평선에서 떠오르던 별자리로, 첫인상과 타고난 분위기를 나타냅니다. 계산에는 태어난 시각과 장소가 필요합니다.',
        },
        {
          q: '궁합도 볼 수 있나요?',
          a: '네. 상대의 생년월일을 입력하면 두 사람의 호시캐릭터 궁합과 ‘오늘의 두 사람’을 진단할 수 있습니다.',
        },
      ],
    },
    about: {
      title: 'Hoshi-Kyara란?',
      lead: '태어난 순간의 별에서 태어난, 당신만의 캐릭터.',
      what: [
        '「Hoshi-Kyara」는 당신이 태어난 순간의 별자리 배치에서 태어난, 당신만의 캐릭터예요.',
        '잡지 별자리 운세가 쓰는 태양 별자리(겉모습)에 달 별자리(속마음)를 더해, 「남이 보는 당신」과 「내면의 당신」을 함께 비춰요.',
        '별자리는 네 가지 원소(불·흙·바람·물)로 나뉘어요. 태양 원소 4종 × 달 원소 4종 = 모두 16종. 당신은 그중 딱 하나예요.',
      ],
      howTitle: '16캐릭터가 정해지는 방식',
      outer: '겉모습',
      inner: '속마음',
      sunElement: '태양의 원소',
      moonElement: '달의 원소',
      elementsTitle: '네 가지 원소',
      elements: {
        火: '열정·행동·에너지',
        地: '현실·안정·꾸준함',
        風: '지성·언어·자유',
        水: '감정·공감·상상',
      },
      listTitle: '16가지 Hoshi-Kyara',
      listSub: '태양 × 달의 원소로 정해지는 당신의 캐릭터',
      cta: '내 Hoshi-Kyara 진단하기',
    },
    birth: {
      title: 'Hoshi-Kyara',
      sub: '생년월일만 있으면 OK. 당신의 Hoshi-Kyara와 태어난 순간의 별자리 배치를 통째로 분석해요.',
      timeHint: '출생 기록에 적혀 있어요. 몰라도 OK(정오로 근사하고 상승 별자리는 생략해요).',
      country: '태어난 나라',
      countryHint: '기기에서 자동으로 선택했어요. 상승 별자리 계산에 써요(시각을 입력하지 않으면 사용하지 않아요).',
      prefecture: '태어난 지역',
      prefectureHint: '상승 별자리 정확도가 살짝 올라가요(시각을 입력하지 않으면 사용하지 않아요).',
      periodHint: '점치는 시점의 별의 운행으로 그 기간의 운세를 읽어요.',
      submit: '별 읽기',
      errNoDate: '생년월일을 입력해 주세요',
      errBadDate: '날짜 형식이 올바르지 않아요',
    },
    pair: {
      title: '궁합',
      sub: 'Hoshi-Kyara 궁합과 지금의 별자리로 「두 사람의 지금」을 봐요.',
      you: '🌟 당신',
      partner: '💫 상대',
      youName: '당신',
      partnerName: '상대',
      timeHint: '몰라도 OK(달 별자리를 정오로 근사해요).',
      submit: '두 사람의 별 읽기',
      errNoDate: (name) => `${name}의 생년월일을 입력해 주세요`,
      errBadDate: (name) => `${name}의 날짜 형식이 올바르지 않아요`,
    },
    result: {
      born: (date) => `${date} 출생`,
      title: (name) => (name ? `${name}님의 Hoshi-Kyara` : '당신의 Hoshi-Kyara'),
      synthLabel: '✦ 더 자세한 당신의 Hoshi-Kyara ✦',
      outerFace: '겉모습',
      innerHeart: '속마음',
      typeCount: '이 조합으로, 모두 16캐릭터',
      partyTitle: (n) => `태어난 순간의, 당신의 별 ${n}개`,
      partySub: '이 별들이 당신을 움직이는 캐릭터가 되었어요. 각자의 담당과 특징이에요.',
      partyMore: (hidden) => `사실 ${hidden}명 더 있어요. 모두 보기`,
      partyLess: '접기',
      domain: '담당',
      quirk: '특징',
      genBadge: '세대',
      partyFoot: '「세대」 = 움직임이 느리고, 같은 세대가 공유하는 시대 분위기도 비추는 행성이에요.',
      fortuneTitle: (period) => `${period}의 운세`,
      fortuneSub: (name) => `지금의 별 운행과 ${name ? `${name}님의` : '당신의'} Hoshi-Kyara로 읽고 있어요`,
      fortuneFoot: (noun) => `${noun}의 하늘을 지나는 별들과 태어난 순간의 별자리 배치 사이의 각도를 바탕으로 해요.`,
      aiTitle: 'AI 점성술사의 자세한 Hoshi-Kyara 감정',
      aiSub: (name) => `AI가 ${name ? `${name}님의` : '당신의'} 차트와 별의 운행을 읽어 드려요`,
      aiCta: 'AI에게 자세히 점쳐 보기',
      aiNote: '위 계산 결과(별자리·각도)가 AI로 전송돼요. 감정에는 10~30초 정도 걸려요.',
      aiLoading: '별을 읽고 있어요…… (10~30초 정도 기다려 주세요)',
      upsell: '태어난 시각을 알면 상승 별자리와 3천체 종합 분석까지 볼 수 있어요(달 별자리 정확도도 올라가요). 출생 기록을 확인해 보세요.',
      adoptLead: '이 호시캐릭터와 매일 함께.',
      adoptCta: '이 아이와 매일 별 보기',
      retry: '다시 점치기',
      home: '모드 선택으로',
    },
    pairResult: {
      title: '궁합',
      matchLabel: '궁합',
      breakdownTitle: '궁합 내역',
      breakdownSub: '태양(겉모습)과 달(마음), 네 가지 조합에서',
      todayTitle: (period) => `${period}의 두 사람`,
      todaySub: (skyNote) => `${skyNote} — 그 별이 두 사람에게 부는 바람은?`,
      aiTitle: 'AI 점성술사의 두 사람 감정',
      aiSub: (a, b) => `AI가 ${a}와 ${b}의 별을 읽어 드려요`,
      aiCta: 'AI에게 두 사람을 자세히 점쳐 보기',
      aiNote: '위 계산 결과(별자리·궁합·각도)가 AI로 전송돼요. 감정에는 10~30초 정도 걸려요.',
      aiLoading: '두 사람의 별을 읽고 있어요…… (10~30초 정도 기다려 주세요)',
      upsell: '태어난 시각을 알면 달 별자리 정확도가 올라가 궁합 판정도 더 정확해져요(현재는 정오로 근사하고 있어요).',
      retry: '조건 바꿔 다시 점치기',
      home: '모드 선택으로',
    },
    chat: {
      title: 'Hoshi-Kyara 상담실',
      sub: '당신의 호시캐릭터가 무엇이든 상담해 드려요.',
      historyCount: (n) => `지금까지 상담 ${n}건`,
      hide: '숨기기',
      show: '보기',
      intro: '궁금한 걸 물어보세요. 연애·일·성격·앞으로의 운세——당신의 출생 차트와 지금의 별자리를 바탕으로 답해 드려요.',
      inputPlaceholder: '메시지를 입력…',
      note: '보내면 당신의 Hoshi-Kyara 데이터가 AI로 전송돼요.',
      clear: '대화 지우기',
      delAria: '이 질문과 답변 삭제',
      sendAria: '보내기',
      starters: [
        { label: '🌌 자세히 봐줘', q: '지금의 저를 별로 자세히 봐 주세요.' },
        { label: '💕 연애', q: '지금의 연애운과 연애에서 제가 주의하면 좋을 점을 알려 주세요.' },
        { label: '💼 일', q: '지금의 제가 일에서 힘을 발휘하려면 어떻게 움직이면 좋을까요?' },
        { label: '🤝 인간관계', q: '인간관계에서 제가 편안하게 지낼 수 있는 힌트가 필요해요.' },
        { label: '🌱 성격', q: '별로 보면 저는 결국 어떤 성격의 사람인가요?' },
        { label: '🔮 앞날', q: '앞으로의 저에게 별은 어떤 흐름을 준비해 두었나요?' },
      ],
    },
    footer: '별 계산은 모두 사용 중인 기기 안에서 이루어져요. 상담실에서 호시캐릭터에게 상담할 때만 계산 결과가 전송돼요.',
    consent: {
      message: '익명 사용 현황을 측정해도 될까요? (개인정보·생년월일은 전송하지 않아요.)',
      allow: '허용',
      deny: '아니요',
      settings: '측정 설정',
    },
    feedback: {
      title: '진단은 어땠나요?',
      sub: '감상이나 "여기 이상해요" 같은 한마디를 남겨 주시면 큰 힘이 돼요.',
      bad: '그냥 그래요',
      good: '좋았어요',
      great: '최고예요',
      placeholder: '코멘트(선택)',
      send: '보내기',
      thanks: '감사합니다!',
    },
    companion: {
      greetToday: '또 와 주셨네요.',
      greetDay: '어서 오세요. 오늘의 별, 보고 가실래요?',
      greetBack: '어서 오세요. 오랜만이에요.',
      cardTitle: '오늘의 별',
      cardIntro: '오늘 하늘을 살펴봤어.',
      colorLabel: '오늘의 행운 색',
      keywordLabel: '키워드',
      qualGood: '행운',
      qualHard: '주의',
      qualConj: '주목',
      tabNextWeek: '다음 주',
      tabNextMonth: '다음 달',
      tapQuestion: '오늘은 어떠셨어요?',
      moodGood: '좋은 일 있었어',
      moodMeh: '그냥 그래',
      moodBad: '힘들었어',
      domainQuestion: '어느 쪽이었어요?',
      domWork: '일',
      domLove: '연애',
      domPeople: '인간관계',
      domOther: '그냥',
      tapSkip: '건너뛰기',
      reactGood: '좋아 보여요. 그 느낌 그대로, 제가 보고 있어요.',
      reactMeh: '그런 날도 좋아요. 아무 일 없는 날을 잘 보내는 것도 사실 강함이에요.',
      reactBad: '말해 주셔서 고마워요. 오늘은 푹 쉬어요. 내일 또 별을 읽을게요.',
      weekendTitle: '이번 주 돌아보기',
      recapNone: '조용한 한 주였네요. 마음 내킬 때 또 알려 주세요.',
      recapGood: '이번 주 좋았어요. 다음 주에도 그 흐름으로.',
      recapCalm: '이번 주도 수고하셨어요. 잘 이어가고 있어요.',
      recapTough: (domain) => `이번 주 힘든 날은 «${domain}» 쪽에 몰려 있었어요. 너무 무리하는 건 아니죠?`,
      forecastTitle: '다음 주의 별',
      tailwindLabel: '순풍',
      cautionLabel: '주의',
      readsTitle: (name, period) => `${name}의 ${period}`,
      readingHeading: '당신의 호시캐릭터가 읽는 운세',
      readsIntro: (name) => `당신의 호시캐릭터 「${name}」입니다. 지금의 별의 흐름을 읽어 봤어요.`,
      readingVoice: '별의 흐름, 미리 봐 뒀어.',
      otherPerson: '다른 사람 점치기',
      toMenu: '메인 메뉴로',
      toPair: '궁합 보기',
      toChat: '상담하기',
      seeYouTomorrow: '내일도 여기서 별을 읽고 있을게요.',
    },
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

/** ほしキャラ名を言語別の括弧で囲む(名前表示は必ず括弧付きに) */
const NAME_QUOTES: Record<Lang, [string, string]> = {
  ja: ['「', '」'],
  en: ['“', '”'],
  es: ['«', '»'],
  fr: ['« ', ' »'],
  it: ['«', '»'],
  pt: ['«', '»'],
  ko: ['「', '」'],
}
export function quoted(name: string, lang: Lang = getLang()): string {
  const [l, r] = NAME_QUOTES[lang] ?? NAME_QUOTES.ja
  return `${l}${name}${r}`
}
