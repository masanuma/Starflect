import { useLang, getLang } from './i18n'
import type { Lang } from './i18n'
import type { Element } from './signs'
import type { PickId } from './companion'

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

/** 星の行の見出し「主人公 の 太陽星座 は 牡牛座」を色分け・強調するためのパーツ */
export interface RoleSignParts {
  role: string
  sep1: string
  planetLabel: string
  sep2: string
  sign: string
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
    /** 初回の診断カードに出す誘導ラベル(初めての人向け) */
    soloFirstHint: string
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
    /**
     * 出会いの一行。ほしキャラは生まれた瞬間の空から作られる＝**その人と誕生の瞬間を共有している**。
     * 「診断される」ではなく「出会う」に変えるための一文で、記憶が育つ前から
     * 初日から嘘なく言える関係の根拠（憲法: 支えになる占い）。
     */
    meetingLine: (date: string) => string
    /** 初回診断のリビール演出。星を読んでいる「タメ」の文言 */
    revealReading: string
    /** リビール演出でキャラ名の直前に出る一言 */
    revealIntro: string
    /** 初回だけ出す「この画面の歩き方」案内。見出し・本文(星の数)・相談室へ飛ぶボタン */
    guideTitle: string
    guideBody: (partyCount: number) => string
    guideCta: string
    partyTitle: (n: number) => string
    partySub: string
    partyMore: (hidden: number) => string
    partyLess: string
    /** 完全に畳んだ状態から全員を開くボタン(相棒ホーム用) */
    partyReveal: (total: number) => string
    /** 星の分類(自分→周り→時代)。アプリと説明ページ /stars で共有する */
    /** 太陽×月＝ほしキャラの生成理由。なじみのある太陽星座から入り、混乱を減らす */
    partyPairNote: string
    partyGroup1: string
    partyGroup2: string
    partyGroup3: string
    /** グループ行に出す星の数(例: 5つの星) */
    partyGroupCount: (n: number) => string
    /** 星のカードから /stars(10天体と12星座の説明)へ誘導するリンク */
    partyLearn: string
    /** 「主人公の太陽星座は牡牛座」を色分け表示するためのパーツ。isAsc は上昇星座(名前に既に星座を含む)判定 */
    roleSign: (role: string, planet: string, sign: string, isAsc: boolean) => RoleSignParts
    domain: string
    quirk: string
    retro: string
    genBadge: string
    partyFoot: string
    fortuneTitle: (period: string) => string
    fortuneSub: (name: string) => string
    fortuneFoot: (noun: string) => string
    upsell: string
    adoptLead: string
    adoptCta: string
    retry: string
    home: string
  }
  pairResult: {
    title: string
    matchLabel: string
    /** 相性のリビール演出。ふたりの星を読んでいる「タメ」の文言 */
    revealReading: string
    breakdownTitle: string
    breakdownSub: string
    todayTitle: (period: string) => string
    todaySub: (sky: string) => string
    /** ふたりの相性をAIが書いているあいだの表示 */
    fortuneWaiting: string
    /** 先の期間は出さず、相棒に聞いてもらう(ソロの運勢カードと同じ方針) */
    askAheadTitle: string
    askAhead: { label: string; q: string }[]
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
    clear: string
    delAria: string
    sendAria: string
    starters: Starter[]
  }
  /** 相性チャット(ふたりの相談室)の見出し・導入・スターター。それ以外の文言は chat を流用 */
  pairChat: {
    title: string
    sub: string
    intro: string
    starters: Starter[]
  }
  /** LP下部の「このアプリについて」への導線。注記はそこへ集約している */
  aboutLink: string
  /**
   * 引き継ぎ（機種変え対策）。クラウドではなくファイル＝
   * 「入力した生年月日そのものを送信することはありません」という公開済みの約束を守るため。
   */
  backup: {
    title: string
    note: string
    save: string
    load: string
    confirm: string
    done: string
    fail: string
  }
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
    /**
     * 夜〜深夜に出す「月の面」。同じ内容を出し直すのではなく、別の面を読む。
     * ほしキャラ自体が「太陽 × 月」なので、朝は太陽側・夜は月側が出てくる。
     */
    readingHeadingNight: string
    readsIntroNight: (name: string) => string
    fortuneWaitingNight: string
    /** 夜に、その日の朝ぶんを畳んで置いておく見出し */
    daytimeFortune: string
    /** 運勢は今日だけ出し、先の期間は相棒に聞いてもらう(毎日ひらく理由とAI利用を両取り) */
    askAheadTitle: string
    askAhead: { label: string; q: string }[]
    readsIntro: (name: string) => string
    /** 毎日の運勢をAIが書いているあいだの表示。待ち時間は「パーソナライズしている証拠」として見せる */
    fortuneWaiting: string
    fortuneError: string
    fortuneRetry: string
    /** 天体の根拠を畳んでおく見出し(憲法: 10天体は「なぜならば」＝見たい人だけ) */
    fortuneWhy: string
    /**
     * 答え合わせ。前に書いた運勢がどうだったかを、ほしキャラが後日1回だけ聞く。
     * 集めた手応えは書き方の調整にだけ使い、**的中率などの数字は表に出さない**
     * (嘘くさいうえ、外れが続くと自滅する)
     */
    hitAsk: (daysAgo: number) => string
    hitYes: string
    hitSoso: string
    hitNo: string
    hitDunno: string
    hitSkip: string
    hitThanks: string
    /**
     * 相棒ホームで聞く感想。診断結果の「この診断はどうでしたか？」とは別の聞き方にする
     * （聞きたいのは毎日の運勢・答え合わせ・1日1問といった、使い続けた先の体験）。
     * 数日使ってから1回だけ聞き、送ったら二度と出さない。
     */
    feedbackTitle: string
    feedbackSub: string
    /**
     * 1日1問の遊びの二択。気分タップの2問目として、領域の代わりに数日に1度だけ出す。
     * `PickId` で型付けしているので、どれか1問でも訳が抜けると型チェックで落ちる。
     */
    picks: Record<PickId, { q: string; a: [string, string] }>
    readingVoice: string
    otherPerson: string
    toMenu: string
    toPair: string
    toChat: string
    seeYouTomorrow: string
  }
  map: {
    title: string
    sub: string
    progressLead: (name: string, level: number) => string
    toNext: (n: number, nextName: string) => string
    earnHint: string
    allDone: string
    open: string
    close: string
    /** 相棒ホームで一覧を畳んでいるときに出す、手紙一覧をひらくボタン */
    expandMap: string
    /** 開いた地図を畳むボタン */
    collapseMap: string
    lockedHint: (n: number) => string
    /** 次ではない、まだ先の手紙のラベル（旧: Lv.25 のような数字の表示をやめた） */
    lockedFar: string
    soonNote: string
    generating: string
    reportError: string
    reportRetry: string
    tiers: Record<string, { name: string; teaser: string }>
    bornBody: (name: string) => string
    moonBackBody: (moonSign: string, manner: string) => string
  }
  share: {
    heading: string
    text: (name: string) => string
    hashtags: string[]
    native: string
    copy: string
    copied: string
    /** 相性結果の共有。個人名は入れない(公開SNSに他人の名前を出さないため)。キャラ名同士で語る */
    pairHeading: string
    pairText: (a: string, b: string, percent: number, nickname: string) => string
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
      tagline1: '同じ星座でも、ひとりずつ違う。',
      tagline2: '生まれた日と時間から生まれる、あなただけの「ほしキャラ」。',
      greetNew: 'はじめまして、ほしキャラ診断です。',
      greetBack: 'おかえりなさい。',
      aboutLink: 'ほしキャラとは？',
      soloName: '🌟 ほしキャラ診断',
      soloTime: '30秒',
      soloDesc: '生年月日だけでOK。あなたのほしキャラ(全16キャラ)と、あなたの中に住む星のキャラたちまで分析',
      soloFirstHint: '初めての方はこちらから！',
      pairName: '💞 ふたりの相性',
      pairDesc: 'ほしキャラの相性と「今日のふたり」を診断。お相手の生年月日だけでOK',
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
          a: '生まれた瞬間の星の配置から、太陽星座(表の顔)と月星座(心の中)を掛け合わせて、あなたを16タイプの「ほしキャラ」に分類する星占いです。さらに10天体の配置から性格や運勢も読み解きます。',
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
          a: 'はい。お相手の生年月日を入れると、ふたりのほしキャラ相性と「今日のふたり」を診断できます。',
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
        '診断では、太陽と月だけでなく、水星・金星・火星…と全部で10の天体が、それぞれどの星座にあるかを計算しています。あなたのほしキャラは、その全部を踏まえてあなたを占います。',
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
      prefectureHint: '上昇星座の精度が少し上がります',
      periodHint: '占った時点の星の運行から、その期間の運勢を読みます',
      submit: '星を読む',
      errNoDate: '生年月日を入力してください',
      errBadDate: '日付の形式が正しくありません',
    },
    pair: {
      title: 'ふたりの相性',
      sub: 'ほしキャラの相性と、いまの星回りから「ふたりの今」を占います',
      you: '🌟 あなた',
      partner: '💫 お相手',
      youName: 'あなた',
      partnerName: 'お相手',
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
      meetingLine: (d) => `わたしは、${d}、あなたと同じ空から生まれました。だから、あなたのことが少しだけ分かります。`,
      revealReading: '星を読んでいます…',
      revealIntro: 'あなたのほしキャラは',
      guideTitle: 'この先の楽しみ方',
      guideBody: (n) => `ほしキャラができました。このあと、あなたをかたちづくる${n}の星・今日の運勢と続きます。いちばんのおすすめは「ほしキャラ相談室」。あなたの星をもとに、恋愛も仕事もこの先の運勢も答えてくれます。`,
      guideCta: '相談室で話しかける',
      partyTitle: (n) => `あなたをかたちづくる、${n}の星`,
      partySub: 'ほしキャラの精度のもとになっている、生まれた瞬間の星の配置です。気になる人だけ、のぞいてみてください。',
      partyMore: (hidden) => `のこりの${hidden}つも見てみて！`,
      partyLess: '畳む',
      partyReveal: (total) => `あなたの${total}の星をくわしく見る`,
      partyPairNote: '雑誌やテレビでいう「あなたの星座」は、いちばん上の太陽のこと。この太陽（表の顔）と月（心）の組み合わせで、あなたのほしキャラが決まりました。',
      partyGroup1: '自分のこと',
      partyGroup2: '人とのこと',
      partyGroup3: '時代のこと',
      partyGroupCount: (n) => `${n}つの星`,
      partyLearn: '10天体と12星座って？',
      domain: '担当',
      roleSign: (role, planet, sign, isAsc) => ({ role, sep1: 'の', planetLabel: isAsc ? planet : `${planet}星座`, sep2: 'は', sign }),
      quirk: '特徴',
      retro: '逆行',
      genBadge: '世代',
      partyFoot: '「世代」= 動きがゆっくりで、同世代に共通する時代の空気も映す天体です',
      fortuneTitle: (period) => `${period}の運勢`,
      fortuneSub: (name) => `いまの星の運行と${name ? `${name}さん` : 'あなた'}のほしキャラから読んでいます`,
      fortuneFoot: (noun) => `${noun}の空をゆく星々と、生まれた瞬間の星の配置との角度をもとにしています。`,
      upsell: '生まれた時刻が分かると、上昇星座と3天体の総合分析まで占えます(月星座の精度も上がります)。母子手帳をチェックしてみて。',
      adoptLead: 'このほしキャラを、毎日そばに。',
      adoptCta: 'この子と毎日、星を見る',
      retry: 'もう一度占う',
      home: 'モード選択に戻る',
    },
    pairResult: {
      title: 'ふたりの相性',
      matchLabel: '相性',
      revealReading: 'ふたりの星を読んでいます…',
      breakdownTitle: '相性の内訳',
      breakdownSub: '太陽(表の顔)と月(心)、4つの組み合わせから',
      todayTitle: (period) => `${period}のふたり`,
      todaySub: (sky) => `${sky}。ふたりには、どんな風が吹く?`,
      fortuneWaiting: 'いま、ふたりの星を読んでいます',
      askAheadTitle: 'この先のふたりが気になったら、聞いてみて',
      askAhead: [{ label: '明日は？', q: '明日のふたりはどんな感じ？' }, { label: '今週は？', q: '今週のふたりはどんな流れ？' }, { label: '来月は？', q: '来月のふたりはどんな時期になりそう？' }],
      upsell: '生まれた時刻が分かると月星座の精度が上がり、相性の判定もより正確になります(現在は正午で近似しています)。',
      retry: '条件を変えて占う',
      home: 'モード選択に戻る',
    },
    chat: {
      title: 'ほしキャラ相談室',
      sub: 'あなたの星を全部知っている、あなただけの相談相手',
      historyCount: (n) => `これまでの相談 ${n}件`,
      hide: '非表示にする',
      show: '表示する',
      intro: '生まれた瞬間の星ぜんぶと、いまの星の巡り。そのすべてを踏まえて、あなただけに答えます。恋愛・仕事・性格・これからのこと——なんでも聞いてみてください。話した内容は、星の配置といっしょにAIへ届きます。',
      inputPlaceholder: 'メッセージを入力…',
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
    pairChat: {
      title: 'ふたりの相談室',
      sub: 'ふたりの相性について、なんでも聞いてください',
      intro: '気になることを聞いてみてください。相性のコツ・すれ違いの理由・この先のふたり——ふたりの星の配置と相性から、いっしょに考えます。',
      starters: [
        { label: '💞 相性のコツ', q: 'ふたりがうまくいくコツを教えて' },
        { label: '⚡ すれ違い', q: 'ふたりがすれ違いやすいのはどんなとき？' },
        { label: '🔮 この先', q: 'この先のふたりの関係はどうなりそう？' },
      ],
    },
    aboutLink: 'このアプリについて',
    consent: {
      message: '匿名の利用状況を計測してもよいですか？(個人情報・生年月日は送信しません)',
      allow: '許可する',
      deny: 'しない',
      settings: '計測設定',
    },
    backup: {
      title: 'データの引き継ぎ',
      note: '機種変更や、ブラウザのデータを消す前に。ファイルは端末に保存されます（サーバーには送られません）。',
      save: 'ファイルに保存',
      load: 'ファイルから復元',
      confirm: 'いまの記録を、選んだファイルの内容に置きかえます。よろしいですか？',
      done: '復元しました。',
      fail: 'このファイルは読み込めませんでした。',
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
      readingHeading: 'ほしキャラが読む、今日の運勢',
      readingHeadingNight: 'ほしキャラが読む、いまの心もよう',
      readsIntroNight: (name) => `あなたのほしキャラ「${name}」です。いまのあなたの内側を読みました。`,
      fortuneWaitingNight: 'いま、あなたの心もようを読んでいます',
      daytimeFortune: '今日の運勢を読み返す',
      askAheadTitle: 'この先が気になったら、聞いてみて',
      askAhead: [{ label: '明日は？', q: '明日はどんな一日になりそう？' }, { label: '今週は？', q: '今週はどんな流れ？' }, { label: '来月は？', q: '来月はどんな時期になりそう？' }],
      readsIntro: (name) => `あなたのほしキャラ「${name}」です。今の星の巡りを読みました。`,
      fortuneWaiting: 'いま、あなたの星を読んでいます',
      fortuneError: 'AIにつながりませんでした',
      fortuneRetry: 'もう一度読む',
      fortuneWhy: 'なぜこう出たの？',
      hitAsk: (d) => (d === 1 ? '昨日はこんなふうにお伝えしましたが、どうでしたか？' : 'このあいだはこんなふうにお伝えしましたが、どうでしたか？'),
      hitYes: 'あってた',
      hitSoso: 'ぼちぼち',
      hitNo: 'あってなかった',
      hitDunno: 'わかんない',
      hitSkip: '答えない',
      hitThanks: '教えてくれてありがとうございます。次に生かしますね。',
      feedbackTitle: 'ここまで使ってみて、どうですか？',
      feedbackSub: '毎日の運勢のこと、気になるところ、なんでも聞かせてください',
      picks: {
        alone: { q: 'もし今日、1時間だけ自由になったら？', a: ['ひとりで過ごす', '誰かと過ごす'] },
        decide: { q: '何かを決めるとき、どっち？', a: ['ぴんときたほう', '調べてから'] },
        holiday: { q: 'お休みの日は？', a: ['予定を決めておく', '気分で動く'] },
        newplace: { q: 'お店を選ぶなら？', a: ['はじめてのお店', 'いつものお店'] },
        advice: { q: '相談されたら、まずどっち？', a: ['気持ちを聞く', '解決策を考える'] },
        matter: { q: 'いま大事にしたいのは？', a: ['手にあるもの', 'これから起きること'] },
      },
      readingVoice: '星の巡り、見ておいたよ。',
      otherPerson: '別の人を占う',
      toMenu: 'メインメニューへ',
      toPair: 'ふたりの相性を占う',
      toChat: 'ほしキャラに相談する',
      seeYouTomorrow: 'また明日も、ここで星を読んでいますね。',
    },
    map: {
      title: 'ほしキャラからの手紙',
      sub: 'いっしょに過ごすうちに気づいたことを、ほしキャラが手紙に書いています。',
      progressLead: (name, n) => `${name}が、あなたに気づいたこと：${n}`,
      toNext: (n, nm) => `あと ${n} で「${nm}」の手紙が書き上がります`,
      earnHint: '今日の運勢を見る・気分を残す・話す。そのたびに、ほしキャラはあなたに気づいていきます。',
      allDone: 'いまある手紙は、ぜんぶ開きました。ここまで、よく続けましたね。',
      open: '手紙を開く',
      close: '閉じる',
      expandMap: '手紙の一覧をひらく',
      collapseMap: '一覧を畳む',
      lockedHint: (n) => `あと ${n} で書き上がります`,
      lockedFar: 'このさき書く手紙',
      soonNote: 'この手紙は、まだ書いている途中です。',
      generating: 'そっと封を開けています…',
      reportError: 'うまく開けませんでした。少し時間をおいて、もう一度ためしてね。',
      reportRetry: 'もう一度',
      tiers: {
        birth: { name: 'ほしキャラ誕生', teaser: '太陽と月から生まれた、あなたのほしキャラ。ここが物語の出発点。' },
        moonBack: { name: '月星座の裏側', teaser: '表の顔(太陽)とは別の、安心しているときの素のあなた。' },
        partyDeep: { name: 'あなたの星、もっと深く', teaser: '10の星たちの、もう一歩踏み込んだ役割と読み。' },
        moodTrend: { name: '気分のクセ', teaser: '記録がたまると見えてくる、あなたが揺れやすい曜日と場面。' },
        hiddenSelf: { name: '隠れた自分', teaser: '本来の星(出生図)と、実際の毎日とのギャップ。いちばんの発見。' },
        trueBuddy: { name: 'ほんとうの相棒', teaser: 'あなたのすべてを踏まえて話す、ほしキャラの最終形。' },
      },
      bornBody: (name) => `${name}として、あなたの物語がはじまりました。この地図の出発点です。`,
      moonBackBody: (moonSign, manner) =>
        `あなたの月星座は「${moonSign}」。人前で見せる顔(太陽)とは別に、ひとりで安心しているときのあなたは「${manner}」。表からは見えない、素のスイッチです。`,
    },
    share: {
      heading: '結果を友だちにもシェア',
      text: (name) => `私のほしキャラは${name}でした✨ あなたは16キャラのどれ？`,
      hashtags: ['ほしキャラ診断'],
      native: 'シェアする',
      copy: 'リンクをコピー',
      copied: 'コピーしました ✓',
      pairHeading: '結果をシェアする',
      pairText: (a, b, percent, nickname) =>
        `「${a}」×「${b}」の相性は${percent}%、${nickname}でした✨ あなたたちの相性も占えます`,
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
      tagline1: 'Same star sign, and still no two people alike.',
      tagline2: 'Your birth date and time make a “Hoshi-Kyara” that is only yours.',
      greetNew: 'Hi, welcome to Hoshi-Kyara.',
      greetBack: 'Welcome back.',
      aboutLink: 'What is Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 sec',
      soloDesc: 'Just your birth date. We analyze your Hoshi-Kyara (1 of 16) and the planet-characters living inside you.',
      soloFirstHint: 'New here? Start with this!',
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
          a: 'It’s an astrology reading that blends your Sun sign (outer face) and Moon sign (inner heart) to sort you into one of 16 “star characters,” then reads your personality and fortune from all 10 planets.',
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
        'The reading calculates not just the Sun and Moon but all ten planets — Mercury, Venus, Mars and the rest — and which sign each one falls in. Your Hoshi-Kyara reads you with all of that behind it.',
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
      prefectureHint: 'Slightly improves Rising-sign accuracy.',
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
      meetingLine: (d) => `I come from the same sky you were born under — ${d}. That's why I already know you, a little.`,
      revealReading: 'Reading the stars…',
      revealIntro: 'Your Hoshi-Kyara is',
      guideTitle: 'What comes next',
      guideBody: (n) => `Your Hoshi-Kyara is ready. Below you'll find the ${n} stars that shape you, plus today's reading. The best part is the Hoshi-Kyara consultation room — it answers anything about love, work or what lies ahead, based on your own stars.`,
      guideCta: 'Talk in the consultation room',
      partyTitle: (n) => `The ${n} stars that shape you`,
      partySub: 'The stars at the moment you were born became the characters that make you who you are—here’s what each one handles, and what it’s like.',
      partyMore: (hidden) => `See your other ${hidden} characters too!`,
      partyLess: 'Collapse',
      partyReveal: (total) => `See the ${total} stars that shape you`,
      partyPairNote: 'When a horoscope says "your sign", it means the Sun at the top. Your Hoshi-Kyara comes from this Sun (your outer face) combined with the Moon (your heart).',
      partyGroup1: 'About you',
      partyGroup2: 'About others',
      partyGroup3: 'About your era',
      partyGroupCount: (n) => `${n} stars`,
      partyLearn: 'What are the 10 planets and 12 signs?',
      domain: 'Domain',
      roleSign: (role, planet, sign) => ({ role, sep1: ' — ', planetLabel: planet, sep2: ' in ', sign }),
      quirk: 'Trait',
      retro: 'Retrograde',
      genBadge: 'Gen',
      partyFoot: '“Gen” = slow-moving planets that also reflect the mood of your whole generation.',
      fortuneTitle: (period) => `${period}’s fortune`,
      fortuneSub: (name) => `Read from the current transits and ${name ? `${name}’s` : 'your'} Hoshi-Kyara`,
      fortuneFoot: (noun) => `Based on the angles between the stars moving across the sky ${noun} and your birth chart.`,
      upsell: 'With your birth time, we can add the Rising sign and a full three-body synthesis (and the Moon sign gets more accurate). Check your birth record.',
      adoptLead: 'Keep this Hoshi-Kyara close, every day.',
      adoptCta: 'Watch the stars together, daily',
      retry: 'Read again',
      home: 'Back to modes',
    },
    pairResult: {
      title: 'Compatibility',
      matchLabel: 'Match',
      revealReading: 'Reading both your stars…',
      breakdownTitle: 'Compatibility breakdown',
      breakdownSub: 'From four combinations of Sun (outer face) and Moon (heart)',
      todayTitle: (period) => `The two of you: ${period}`,
      todaySub: (sky) => `${sky}. What wind does that stir up for you two?`,
      fortuneWaiting: 'Reading both your charts right now',
      askAheadTitle: 'Curious about the two of you ahead? Just ask.',
      askAhead: [{ label: 'Tomorrow?', q: 'What are the two of us like tomorrow?' }, { label: 'This week?', q: 'How is this week looking for the two of us?' }, { label: 'Next month?', q: 'What kind of month is next month for the two of us?' }],
      upsell: 'With birth times, the Moon signs get more accurate and the match becomes more precise (currently approximated at noon).',
      retry: 'Change details and retry',
      home: 'Back to modes',
    },
    chat: {
      title: 'Hoshi-Kyara Room',
      sub: 'Your Hoshi-Kyara knows every star you were born under. This room is yours alone.',
      historyCount: (n) => `${n} past ${n === 1 ? 'question' : 'questions'}`,
      hide: 'Hide',
      show: 'Show',
      intro: 'Every star you were born under, plus the sky as it is right now — all of it goes into an answer meant only for you. Love, work, personality, what lies ahead: ask anything. What you write is sent to the AI along with your chart.',
      inputPlaceholder: 'Type a message…',
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
    pairChat: {
      title: 'Your two-person chat',
      sub: 'Ask anything about the two of you',
      intro: 'Ask whatever’s on your mind — tips for getting along, why you clash, where things are headed. We’ll think it through from both charts and your compatibility.',
      starters: [
        { label: '💞 What works', q: 'What’s the secret to us getting along?' },
        { label: '⚡ Friction', q: 'When are we most likely to clash?' },
        { label: '🔮 Ahead', q: 'Where is our relationship headed?' },
      ],
    },
    aboutLink: 'About this app',
    consent: {
      message: 'May we measure anonymous usage? (No personal data or birth dates are sent.)',
      allow: 'Allow',
      deny: 'No thanks',
      settings: 'Analytics settings',
    },
    backup: {
      title: 'Move your data',
      note: 'For a new phone, or before clearing your browser data. The file is saved on your device — nothing is sent to a server.',
      save: 'Save to a file',
      load: 'Restore from a file',
      confirm: 'This will replace your current records with the contents of the file you choose. Continue?',
      done: 'Restored.',
      fail: 'That file couldn’t be read.',
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
      readingHeading: 'Your Hoshi-Kyara reads today’s stars',
      readingHeadingNight: 'Your Hoshi-Kyara reads how you’re feeling',
      readsIntroNight: (name) => `I’m “${name}”, your Hoshi-Kyara. Here’s what I see inside you right now.`,
      fortuneWaitingNight: 'Reading how you’re feeling right now',
      daytimeFortune: 'Read today’s reading again',
      askAheadTitle: 'Curious about what’s next? Just ask.',
      askAhead: [{ label: 'Tomorrow?', q: 'What’s tomorrow going to be like?' }, { label: 'This week?', q: 'How is this week shaping up?' }, { label: 'Next month?', q: 'What kind of month is next month going to be?' }],
      readsIntro: (name) => `I’m your Hoshi-Kyara, “${name}.” I’ve read the current stars for you.`,
      fortuneWaiting: 'Reading your stars right now',
      fortuneError: 'Couldn’t reach the AI',
      fortuneRetry: 'Read again',
      fortuneWhy: 'Why did it come out this way?',
      hitAsk: (d) => (d === 1 ? 'This is what I told you yesterday. How did it go?' : 'This is what I told you the other day. How did it go?'),
      hitYes: 'Spot on',
      hitSoso: 'Sort of',
      hitNo: 'Not really',
      hitDunno: 'Not sure',
      hitSkip: 'Skip',
      hitThanks: 'Thank you for telling me. I’ll keep it in mind.',
      feedbackTitle: 'How is it going so far?',
      feedbackSub: 'Anything about the daily readings, or anything that feels off — I’d love to hear it',
      picks: {
        alone: { q: 'If you had one free hour today?', a: ['Spend it alone', 'Spend it with someone'] },
        decide: { q: 'When you decide something, which is it?', a: ['Go with my gut', 'Look into it first'] },
        holiday: { q: 'On a day off?', a: ['Plan it out', 'Go with the flow'] },
        newplace: { q: 'Picking a place to eat?', a: ['Somewhere new', 'The usual spot'] },
        advice: { q: 'When someone asks for advice, first you…', a: ['Ask how they feel', 'Look for a fix'] },
        matter: { q: 'What matters most right now?', a: ['What I already have', 'What’s coming next'] },
      },
      readingVoice: 'I’ve looked over the stars for you.',
      otherPerson: 'Read someone else',
      toMenu: 'Main menu',
      toPair: 'Check compatibility',
      toChat: 'Talk to your companion',
      seeYouTomorrow: 'I’ll be here reading the stars tomorrow too.',
    },
    map: {
      title: 'Letters from your Hoshi-Kyara',
      sub: 'As you spend time together, your Hoshi-Kyara writes down what it notices about you — as letters.',
      progressLead: (name, n) => `Things ${name} has noticed about you: ${n}`,
      toNext: (n, nm) => `${n} more until “${nm}” is written`,
      earnHint: 'Check today’s reading, log how you feel, talk a little. Each time, your Hoshi-Kyara notices you a bit more.',
      allDone: 'You’ve opened every letter there is. What a journey.',
      open: 'Open the letter',
      close: 'Close',
      expandMap: 'See the letters',
      collapseMap: 'Fold the list',
      lockedHint: (n) => `${n} more until it’s written`,
      lockedFar: 'A letter for later',
      soonNote: 'This letter is still being written.',
      generating: 'Gently opening the seal…',
      reportError: 'It wouldn’t open this time. Give it a moment and try again.',
      reportRetry: 'Try again',
      tiers: {
        birth: { name: 'Your Hoshi-Kyara is born', teaser: 'Born from your Sun and Moon — the starting point of your story.' },
        moonBack: { name: 'The other side of your Moon', teaser: 'The unguarded you when you feel safe, apart from your public face (the Sun).' },
        partyDeep: { name: 'Your stars, in depth', teaser: 'A closer read on the roles of all ten star characters.' },
        moodTrend: { name: 'Your mood patterns', teaser: 'As records add up: the days and places where you tend to wobble.' },
        hiddenSelf: { name: 'Your hidden self', teaser: 'The gap between your birth chart and your real days. The big one.' },
        trueBuddy: { name: 'Your true companion', teaser: 'The final form of your Hoshi-Kyara, speaking with everything about you in mind.' },
      },
      bornBody: (name) => `Your story began as ${name}. This is where the map starts.`,
      moonBackBody: (moonSign, manner) =>
        `Your Moon sign is ${moonSign}. Apart from the face you show others (the Sun), the you that feels at ease alone is “${manner}.” It’s your quiet, off-stage switch.`,
    },
    share: {
      heading: 'Share your result with friends',
      text: (name) => `My Hoshi-Kyara is ${name} ✨ Which of the 16 are you?`,
      hashtags: ['HoshiKyara'],
      native: 'Share',
      copy: 'Copy link',
      copied: 'Copied ✓',
      pairHeading: 'Share the result',
      pairText: (a, b, percent, nickname) => `${a} × ${b} scored ${percent}% — ${nickname}✨ Check your own match too`,
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
      tagline1: 'El mismo signo, y aun así nadie igual a ti.',
      tagline2: 'Tu fecha y hora de nacimiento crean un «Hoshi-Kyara» que es solo tuyo.',
      greetNew: 'Hola, te damos la bienvenida a Hoshi-Kyara.',
      greetBack: 'Bienvenida de nuevo.',
      aboutLink: '¿Qué es Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Solo tu fecha de nacimiento. Analizamos tu Hoshi-Kyara (1 de 16) y los planetas-personaje que viven en ti.',
      soloFirstHint: '¿Es tu primera vez? ¡Empieza aquí!',
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
          a: 'Es un horóscopo que combina tu signo solar (tu cara externa) y tu signo lunar (tu interior) para clasificarte en uno de 16 “personajes estelares”, y luego lee tu personalidad y tu fortuna a partir de los 10 planetas.',
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
        'La lectura calcula no solo el Sol y la Luna, sino los diez astros —Mercurio, Venus, Marte y los demás— y en qué signo está cada uno. Tu Hoshi-Kyara te interpreta teniendo todo eso en cuenta.',
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
      prefectureHint: 'Mejora ligeramente la precisión del Ascendente.',
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
      meetingLine: (d) => `Yo también vengo del cielo de ${d} — el mismo que el tuyo. Por eso ya te conozco un poco.`,
      revealReading: 'Leyendo las estrellas…',
      revealIntro: 'Tu Hoshi-Kyara es',
      guideTitle: 'Lo que viene ahora',
      guideBody: (n) => `Tu Hoshi-Kyara ya está aquí. Más abajo verás los ${n} astros que te forman y la lectura de hoy. Lo mejor es la sala de consulta: responde sobre amor, trabajo o lo que viene, a partir de tus propios astros.`,
      guideCta: 'Hablar en la sala de consulta',
      partyTitle: (n) => `Los ${n} astros que te forman`,
      partySub: 'Los astros del momento de tu nacimiento se volvieron los personajes que te componen: de qué se encarga cada uno y cómo es.',
      partyMore: (hidden) => `¡Mira también tus otros ${hidden} personajes!`,
      partyLess: 'Contraer',
      partyReveal: (total) => `Ver los ${total} astros que te forman`,
      partyPairNote: 'Cuando un horóscopo dice "tu signo", se refiere al Sol de arriba. Tu Hoshi-Kyara nace de ese Sol (tu cara externa) unido a la Luna (tu corazón).',
      partyGroup1: 'Sobre ti',
      partyGroup2: 'Sobre los demás',
      partyGroup3: 'Sobre tu época',
      partyGroupCount: (n) => `${n} astros`,
      partyLearn: '¿Qué son los 10 planetas y 12 signos?',
      domain: 'Área',
      roleSign: (role, planet, sign) => ({ role, sep1: ' — ', planetLabel: planet, sep2: ' en ', sign }),
      quirk: 'Rasgo',
      retro: 'Retrógrado',
      genBadge: 'Gen',
      partyFoot: '“Gen” = planetas de movimiento lento que también reflejan el aire de toda tu generación.',
      fortuneTitle: (period) => `Fortuna: ${period}`,
      fortuneSub: (name) => `Leído a partir de los tránsitos actuales y ${name ? `el Hoshi-Kyara de ${name}` : 'tu Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `Basado en los ángulos entre los astros que cruzan el cielo (${noun}) y tu carta natal.`,
      upsell: 'Con tu hora de nacimiento podemos añadir el Ascendente y una síntesis completa de tres astros (y el signo lunar gana precisión). Revisa tu partida de nacimiento.',
      adoptLead: 'Lleva a este Hoshi-Kyara contigo cada día.',
      adoptCta: 'Mirar las estrellas juntos cada día',
      retry: 'Leer de nuevo',
      home: 'Volver a los modos',
    },
    pairResult: {
      title: 'Compatibilidad',
      matchLabel: 'Afinidad',
      revealReading: 'Leyendo las estrellas de ambos…',
      breakdownTitle: 'Desglose de la afinidad',
      breakdownSub: 'A partir de cuatro combinaciones de Sol (cara externa) y Luna (corazón)',
      todayTitle: (period) => `Vosotros dos: ${period}`,
      todaySub: (sky) => `${sky}. ¿Qué viento sopla eso para vosotros dos?`,
      fortuneWaiting: 'Estoy leyendo los astros de los dos',
      askAheadTitle: '¿Te intriga cómo seguirán? Pregúntame.',
      askAhead: [{ label: '¿Mañana?', q: '¿Cómo estaremos mañana los dos?' }, { label: '¿Esta semana?', q: '¿Cómo se presenta esta semana para nosotros dos?' }, { label: '¿El mes que viene?', q: '¿Qué tal el mes que viene para nosotros dos?' }],
      upsell: 'Con las horas de nacimiento, los signos lunares ganan precisión y la afinidad se afina (ahora se aproxima al mediodía).',
      retry: 'Cambiar datos y repetir',
      home: 'Volver a los modos',
    },
    chat: {
      title: 'Sala Hoshi-Kyara',
      sub: 'Tu Hoshi-Kyara conoce todos tus astros. Esta sala es solo tuya.',
      historyCount: (n) => `${n} ${n === 1 ? 'consulta' : 'consultas'} anteriores`,
      hide: 'Ocultar',
      show: 'Mostrar',
      intro: 'Todos los astros bajo los que naciste, más el cielo de ahora mismo: todo eso entra en una respuesta pensada solo para ti. Amor, trabajo, personalidad, lo que viene: pregunta lo que quieras. Lo que escribes se envía a la IA junto con tu carta.',
      inputPlaceholder: 'Escribe un mensaje…',
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
    pairChat: {
      title: 'La sala de los dos',
      sub: 'Pregunta lo que quieras sobre ustedes dos',
      intro: 'Pregunta lo que tengas en mente: claves para llevarse bien, por qué chocan, hacia dónde va la relación. Lo pensamos desde ambas cartas y su compatibilidad.',
      starters: [
        { label: '💞 Claves', q: '¿Cuál es la clave para que nos llevemos bien?' },
        { label: '⚡ Roces', q: '¿Cuándo es más probable que choquemos?' },
        { label: '🔮 El futuro', q: '¿Hacia dónde va nuestra relación?' },
      ],
    },
    aboutLink: 'Sobre esta app',
    consent: {
      message: '¿Podemos medir el uso de forma anónima? (No se envían datos personales ni fechas de nacimiento.)',
      allow: 'Permitir',
      deny: 'No, gracias',
      settings: 'Ajustes de medición',
    },
    backup: {
      title: 'Llevarte tus datos',
      note: 'Para un móvil nuevo, o antes de borrar los datos del navegador. El archivo se guarda en tu dispositivo: no se envía a ningún servidor.',
      save: 'Guardar en un archivo',
      load: 'Restaurar desde un archivo',
      confirm: 'Esto reemplazará tus registros actuales por el contenido del archivo elegido. ¿Continuar?',
      done: 'Restaurado.',
      fail: 'No se ha podido leer ese archivo.',
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
      readingHeading: 'Tu Hoshi-Kyara lee las estrellas de hoy',
      readingHeadingNight: 'Tu Hoshi-Kyara lee cómo te sientes',
      readsIntroNight: (name) => `Soy «${name}», tu Hoshi-Kyara. Esto es lo que veo dentro de ti ahora.`,
      fortuneWaitingNight: 'Estoy leyendo cómo te sientes ahora',
      daytimeFortune: 'Volver a leer lo de hoy',
      askAheadTitle: '¿Te pica la curiosidad? Pregúntame.',
      askAhead: [{ label: '¿Mañana?', q: '¿Cómo va a ser mañana?' }, { label: '¿Esta semana?', q: '¿Cómo se presenta esta semana?' }, { label: '¿El mes que viene?', q: '¿Qué tal va a ser el mes que viene?' }],
      readsIntro: (name) => `Soy tu Hoshi-Kyara, «${name}». He leído las estrellas de ahora para ti.`,
      fortuneWaiting: 'Estoy leyendo tus astros ahora mismo',
      fortuneError: 'No se pudo conectar con la IA',
      fortuneRetry: 'Leer otra vez',
      fortuneWhy: '¿Por qué ha salido así?',
      hitAsk: (d) => (d === 1 ? 'Esto es lo que te dije ayer. ¿Qué tal fue?' : 'Esto es lo que te dije el otro día. ¿Qué tal fue?'),
      hitYes: 'Acertado',
      hitSoso: 'Más o menos',
      hitNo: 'No mucho',
      hitDunno: 'No sabría decir',
      hitSkip: 'Ahora no',
      hitThanks: 'Gracias por contármelo. Lo tendré en cuenta.',
      feedbackTitle: '¿Qué tal te va hasta ahora?',
      feedbackSub: 'Lo que sea sobre las lecturas diarias, o algo que no encaje: me encantaría saberlo',
      picks: {
        alone: { q: 'Si hoy tuvieras una hora libre…', a: ['Pasarla a solas', 'Pasarla con alguien'] },
        decide: { q: 'Cuando decides algo, ¿qué haces?', a: ['Seguir la intuición', 'Informarme antes'] },
        holiday: { q: 'En un día libre…', a: ['Planearlo', 'Dejarme llevar'] },
        newplace: { q: 'Al elegir un sitio…', a: ['Uno nuevo', 'El de siempre'] },
        advice: { q: 'Si te piden consejo, primero…', a: ['Pregunto cómo se siente', 'Busco una solución'] },
        matter: { q: '¿Qué importa más ahora?', a: ['Lo que ya tengo', 'Lo que está por venir'] },
      },
      readingVoice: 'Ya miré cómo van las estrellas por ti.',
      otherPerson: 'Consultar a otra persona',
      toMenu: 'Menú principal',
      toPair: 'Ver compatibilidad',
      toChat: 'Hablar con tu compañero',
      seeYouTomorrow: 'Mañana también estaré aquí leyendo las estrellas.',
    },
    map: {
      title: 'Cartas de tu Hoshi-Kyara',
      sub: 'Con el tiempo que pasáis juntos, tu Hoshi-Kyara va escribiendo en cartas lo que nota de ti.',
      progressLead: (name, n) => `Cosas que ${name} ha notado de ti: ${n}`,
      toNext: (n, nm) => `${n} más y «${nm}» estará escrita`,
      earnHint: 'Ver la lectura de hoy, registrar tu ánimo, hablar un poco. Cada vez, tu Hoshi-Kyara te nota un poco más.',
      allDone: 'Has abierto todas las cartas que hay. Qué viaje.',
      open: 'Abrir la carta',
      close: 'Cerrar',
      expandMap: 'Ver las cartas',
      collapseMap: 'Plegar la lista',
      lockedHint: (n) => `${n} más y estará escrita`,
      lockedFar: 'Una carta para más adelante',
      soonNote: 'Esta carta aún se está escribiendo.',
      generating: 'Abriendo el sobre con cuidado…',
      reportError: 'No se abrió esta vez. Espera un momento y vuelve a intentarlo.',
      reportRetry: 'Reintentar',
      tiers: {
        birth: { name: 'Nace tu Hoshi-Kyara', teaser: 'Nacido de tu Sol y tu Luna: el punto de partida de tu historia.' },
        moonBack: { name: 'El otro lado de tu Luna', teaser: 'El tú sin guardia cuando te sientes a salvo, aparte de tu cara pública (el Sol).' },
        partyDeep: { name: 'Tus astros, a fondo', teaser: 'Una lectura más cercana del papel de los diez personajes estelares.' },
        moodTrend: { name: 'Tus patrones de ánimo', teaser: 'Cuando se acumulan los registros: los días y lugares donde sueles tambalear.' },
        hiddenSelf: { name: 'Tu yo oculto', teaser: 'La brecha entre tu carta natal y tus días reales. El descubrimiento clave.' },
        trueBuddy: { name: 'Tu verdadero compañero', teaser: 'La forma final de tu Hoshi-Kyara: habla teniendo en cuenta todo sobre ti.' },
      },
      bornBody: (name) => `Tu historia comenzó como ${name}. Aquí empieza el mapa.`,
      moonBackBody: (moonSign, manner) =>
        `Tu signo lunar es ${moonSign}. Aparte de la cara que muestras a los demás (el Sol), el tú que está tranquilo a solas es «${manner}». Es tu interruptor discreto, fuera de escena.`,
    },
    share: {
      heading: 'Comparte tu resultado con amigos',
      text: (name) => `Mi Hoshi-Kyara es ${name} ✨ ¿Cuál de los 16 eres tú?`,
      hashtags: ['HoshiKyara'],
      native: 'Compartir',
      copy: 'Copiar enlace',
      copied: 'Copiado ✓',
      pairHeading: 'Comparte el resultado',
      pairText: (a, b, percent, nickname) => `${a} × ${b}: ${percent}% de compatibilidad, ${nickname}✨ Descubre también la vuestra`,
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
      tagline1: 'Même signe, et pourtant personne ne te ressemble.',
      tagline2: 'Ta date et ton heure de naissance donnent un « Hoshi-Kyara » rien qu’à toi.',
      greetNew: 'Bonjour, bienvenue sur Hoshi-Kyara.',
      greetBack: 'Bon retour.',
      aboutLink: 'C’est quoi Hoshi-Kyara ?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Juste ta date de naissance. On analyse ton Hoshi-Kyara (1 sur 16) et les planètes-personnages qui vivent en toi.',
      soloFirstHint: 'Première fois ? Commence ici !',
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
          a: 'C’est un horoscope qui combine ton signe solaire (ta face visible) et ton signe lunaire (ton for intérieur) pour te classer parmi 16 « personnages stellaires », puis lit ta personnalité et ta destinée à partir des 10 planètes.',
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
        'La lecture calcule non seulement le Soleil et la Lune, mais les dix astres — Mercure, Vénus, Mars et les autres — et le signe dans lequel chacun se trouve. Ton Hoshi-Kyara te lit en tenant compte de tout cela.',
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
      prefectureHint: 'Améliore légèrement la précision de l’Ascendant.',
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
      meetingLine: (d) => `Moi aussi, je viens du ciel du ${d} — le même que le tien. C'est pour ça que je te connais déjà un peu.`,
      revealReading: 'Lecture des étoiles…',
      revealIntro: 'Ton Hoshi-Kyara est',
      guideTitle: 'La suite',
      guideBody: (n) => `Ton Hoshi-Kyara est né. Plus bas, tu trouveras les ${n} astres qui te façonnent et la lecture du jour. Le meilleur, c'est le salon de consultation : il répond sur l'amour, le travail ou la suite, à partir de tes propres astres.`,
      guideCta: 'Discuter au salon',
      partyTitle: (n) => `Les ${n} astres qui te façonnent`,
      partySub: 'Les astres de l’instant de ta naissance sont devenus les personnages qui te composent : ce dont chacun s’occupe et son caractère.',
      partyMore: (hidden) => `Découvre aussi tes ${hidden} autres personnages !`,
      partyLess: 'Réduire',
      partyReveal: (total) => `Voir les ${total} astres qui te façonnent`,
      partyPairNote: 'Quand un horoscope parle de « ton signe », il s’agit du Soleil ci-dessus. Ton Hoshi-Kyara naît de ce Soleil (ton visage extérieur) associé à la Lune (ton cœur).',
      partyGroup1: 'À propos de toi',
      partyGroup2: 'À propos des autres',
      partyGroup3: 'À propos de ton époque',
      partyGroupCount: (n) => `${n} astres`,
      partyLearn: 'Les 10 planètes et 12 signes, c’est quoi ?',
      domain: 'Domaine',
      roleSign: (role, planet, sign) => ({ role, sep1: ' — ', planetLabel: planet, sep2: ' en ', sign }),
      quirk: 'Trait',
      retro: 'Rétrograde',
      genBadge: 'Génér.',
      partyFoot: '« Génér. » = planètes lentes qui reflètent aussi l’air du temps de toute ta génération.',
      fortuneTitle: (period) => `Fortune : ${period}`,
      fortuneSub: (name) => `Lu à partir des transits actuels et ${name ? `du Hoshi-Kyara de ${name}` : 'de ton Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `D’après les angles entre les astres qui traversent le ciel (${noun}) et ton thème de naissance.`,
      upsell: 'Avec ton heure de naissance, on peut ajouter l’Ascendant et une synthèse complète de trois astres (et le signe lunaire gagne en précision). Vérifie ton acte de naissance.',
      adoptLead: 'Garde ce Hoshi-Kyara près de toi, chaque jour.',
      adoptCta: 'Regarder les étoiles ensemble, chaque jour',
      retry: 'Lire à nouveau',
      home: 'Retour aux modes',
    },
    pairResult: {
      title: 'Compatibilité',
      matchLabel: 'Affinité',
      revealReading: 'Lecture de vos étoiles à tous les deux…',
      breakdownTitle: 'Détail de l’affinité',
      breakdownSub: 'À partir de quatre combinaisons de Soleil (visage extérieur) et Lune (cœur)',
      todayTitle: (period) => `Vous deux : ${period}`,
      todaySub: (sky) => `${sky}. Quel vent cela souffle-t-il sur vous deux ?`,
      fortuneWaiting: 'Je lis vos deux thèmes en ce moment',
      askAheadTitle: 'Curieux de la suite pour vous deux ? Demande-moi.',
      askAhead: [{ label: 'Demain ?', q: 'Comment ça se présente pour nous deux demain ?' }, { label: 'Cette semaine ?', q: 'Comment se présente cette semaine pour nous deux ?' }, { label: 'Le mois prochain ?', q: 'Ça donne quoi le mois prochain pour nous deux ?' }],
      upsell: 'Avec les heures de naissance, les signes lunaires gagnent en précision et l’affinité s’affine (actuellement approximée à midi).',
      retry: 'Changer les détails et recommencer',
      home: 'Retour aux modes',
    },
    chat: {
      title: 'Salon Hoshi-Kyara',
      sub: 'Ton Hoshi-Kyara connaît tous tes astres. Ce salon n’est qu’à toi.',
      historyCount: (n) => `${n} ${n === 1 ? 'question' : 'questions'} déjà posée${n === 1 ? '' : 's'}`,
      hide: 'Masquer',
      show: 'Afficher',
      intro: 'Tous les astres sous lesquels tu es né, plus le ciel de cet instant : tout cela nourrit une réponse rien que pour toi. Amour, travail, personnalité, l’avenir — demande ce que tu veux. Ce que tu écris est envoyé à l’IA avec ton thème.',
      inputPlaceholder: 'Écris un message…',
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
    pairChat: {
      title: 'Le salon à deux',
      sub: 'Pose toutes tes questions sur vous deux',
      intro: 'Pose ce qui te préoccupe : les clés pour bien vous entendre, pourquoi vous vous heurtez, où va votre relation. On y réfléchit à partir des deux thèmes et de votre compatibilité.',
      starters: [
        { label: '💞 Les clés', q: 'Quelle est la clé pour bien nous entendre ?' },
        { label: '⚡ Frictions', q: 'Quand risque-t-on le plus de se heurter ?' },
        { label: '🔮 L’avenir', q: 'Où va notre relation ?' },
      ],
    },
    aboutLink: 'À propos de cette application',
    consent: {
      message: 'Pouvons-nous mesurer l’usage de façon anonyme ? (Aucune donnée personnelle ni date de naissance n’est envoyée.)',
      allow: 'Autoriser',
      deny: 'Non merci',
      settings: 'Paramètres de mesure',
    },
    backup: {
      title: 'Emporter tes données',
      note: 'Pour un nouveau téléphone, ou avant d’effacer les données du navigateur. Le fichier reste sur ton appareil : rien n’est envoyé à un serveur.',
      save: 'Enregistrer dans un fichier',
      load: 'Restaurer depuis un fichier',
      confirm: 'Cela remplacera tes données actuelles par le contenu du fichier choisi. Continuer ?',
      done: 'Restauré.',
      fail: 'Ce fichier n’a pas pu être lu.',
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
      readingHeading: 'Ton Hoshi-Kyara lit les étoiles du jour',
      readingHeadingNight: 'Ton Hoshi-Kyara lit ce que tu ressens',
      readsIntroNight: (name) => `Je suis « ${name} », ton Hoshi-Kyara. Voici ce que je vois en toi maintenant.`,
      fortuneWaitingNight: 'Je lis ce que tu ressens en ce moment',
      daytimeFortune: 'Relire celle du jour',
      askAheadTitle: 'Curieux de la suite ? Demande-moi.',
      askAhead: [{ label: 'Demain ?', q: 'Ça va donner quoi, demain ?' }, { label: 'Cette semaine ?', q: 'Comment se présente cette semaine ?' }, { label: 'Le mois prochain ?', q: 'Ça va ressembler à quoi, le mois prochain ?' }],
      readsIntro: (name) => `Je suis ton Hoshi-Kyara, « ${name} ». J’ai lu les étoiles du moment pour toi.`,
      fortuneWaiting: 'Je lis tes astres en ce moment',
      fortuneError: 'Impossible de joindre l’IA',
      fortuneRetry: 'Relire',
      fortuneWhy: 'Pourquoi ce résultat ?',
      hitAsk: (d) => (d === 1 ? 'Voici ce que je t’avais dit hier. Ça s’est passé comment ?' : 'Voici ce que je t’avais dit l’autre jour. Ça s’est passé comment ?'),
      hitYes: 'Juste',
      hitSoso: 'À peu près',
      hitNo: 'Pas vraiment',
      hitDunno: 'Je ne sais pas',
      hitSkip: 'Passer',
      hitThanks: 'Merci de me le dire. J’en tiendrai compte.',
      feedbackTitle: 'Comment ça se passe jusqu’ici ?',
      feedbackSub: 'Tout ce qui concerne les lectures quotidiennes, ou ce qui te gêne : dis-le-moi',
      picks: {
        alone: { q: 'Si tu avais une heure libre aujourd’hui ?', a: ['La passer seul·e', 'La passer avec quelqu’un'] },
        decide: { q: 'Pour décider, tu fais comment ?', a: ['Au feeling', 'Après avoir cherché'] },
        holiday: { q: 'Un jour de congé ?', a: ['Je prévois', 'Je vois sur le moment'] },
        newplace: { q: 'Pour choisir un endroit ?', a: ['Un nouveau', 'Le même que d’habitude'] },
        advice: { q: 'Si on te demande conseil, d’abord…', a: ['J’écoute le ressenti', 'Je cherche une solution'] },
        matter: { q: 'Ce qui compte le plus en ce moment ?', a: ['Ce que j’ai déjà', 'Ce qui vient'] },
      },
      readingVoice: 'J’ai jeté un œil aux étoiles pour toi.',
      otherPerson: 'Consulter une autre personne',
      toMenu: 'Menu principal',
      toPair: 'Tester la compatibilité',
      toChat: 'Parler à ton compagnon',
      seeYouTomorrow: 'Je serai là demain aussi, à lire les étoiles.',
    },
    map: {
      title: 'Les lettres de ton Hoshi-Kyara',
      sub: 'Au fil du temps passé ensemble, ton Hoshi-Kyara note ce qu’il remarque chez toi — dans des lettres.',
      progressLead: (name, n) => `Ce que ${name} a remarqué chez toi : ${n}`,
      toNext: (n, nm) => `encore ${n} et « ${nm} » sera écrite`,
      earnHint: 'Lire la lecture du jour, noter ton humeur, discuter un peu. À chaque fois, ton Hoshi-Kyara te remarque un peu plus.',
      allDone: 'Tu as ouvert toutes les lettres. Quel parcours.',
      open: 'Ouvrir la lettre',
      close: 'Fermer',
      expandMap: 'Voir les lettres',
      collapseMap: 'Replier la liste',
      lockedHint: (n) => `encore ${n} et elle sera écrite`,
      lockedFar: 'Une lettre pour plus tard',
      soonNote: 'Cette lettre est encore en train de s’écrire.',
      generating: 'J’ouvre l’enveloppe tout doucement…',
      reportError: 'Elle n’a pas voulu s’ouvrir cette fois. Attends un instant et réessaie.',
      reportRetry: 'Réessayer',
      tiers: {
        birth: { name: 'Ton Hoshi-Kyara naît', teaser: 'Né de ton Soleil et de ta Lune : le point de départ de ton histoire.' },
        moonBack: { name: 'L’autre face de ta Lune', teaser: 'Le toi sans défense quand tu te sens en sécurité, à part ton visage public (le Soleil).' },
        partyDeep: { name: 'Tes astres, en détail', teaser: 'Une lecture plus fine du rôle des dix personnages stellaires.' },
        moodTrend: { name: 'Tes habitudes d’humeur', teaser: 'À mesure que les notes s’accumulent : les jours et lieux où tu vacilles.' },
        hiddenSelf: { name: 'Ton toi caché', teaser: 'L’écart entre ton thème natal et tes journées réelles. La grande découverte.' },
        trueBuddy: { name: 'Ton vrai compagnon', teaser: 'La forme ultime de ton Hoshi-Kyara : il parle en tenant compte de tout sur toi.' },
      },
      bornBody: (name) => `Ton histoire a commencé en tant que ${name}. C’est ici que la carte débute.`,
      moonBackBody: (moonSign, manner) =>
        `Ton signe lunaire est ${moonSign}. À part le visage que tu montres aux autres (le Soleil), le toi apaisé quand tu es seul est « ${manner} ». C’est ton interrupteur discret, en coulisses.`,
    },
    share: {
      heading: 'Partage ton résultat avec tes amis',
      text: (name) => `Mon Hoshi-Kyara est ${name} ✨ Lequel des 16 es-tu ?`,
      hashtags: ['HoshiKyara'],
      native: 'Partager',
      copy: 'Copier le lien',
      copied: 'Copié ✓',
      pairHeading: 'Partager le résultat',
      pairText: (a, b, percent, nickname) => `${a} × ${b} : ${percent}% de compatibilité, ${nickname}✨ Découvrez la vôtre aussi`,
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
      tagline1: 'Stesso segno, eppure nessuno è uguale a te.',
      tagline2: 'La tua data e ora di nascita creano un «Hoshi-Kyara» solo tuo.',
      greetNew: 'Ciao, benvenuto/a su Hoshi-Kyara.',
      greetBack: 'Bentornato/a.',
      aboutLink: 'Cos’è Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Basta la tua data di nascita. Analizziamo il tuo Hoshi-Kyara (1 su 16) e i pianeti-personaggio che vivono in te.',
      soloFirstHint: 'È la prima volta? Inizia da qui!',
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
          a: 'È un oroscopo che combina il tuo segno solare (il volto esterno) e il segno lunare (il tuo interiore) per collocarti in uno dei 16 “personaggi stellari”, poi legge personalità e fortuna a partire dai 10 pianeti.',
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
        'La lettura calcola non solo il Sole e la Luna, ma tutti e dieci gli astri — Mercurio, Venere, Marte e gli altri — e in quale segno si trova ciascuno. Il tuo Hoshi-Kyara ti legge tenendo conto di tutto questo.',
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
      prefectureHint: 'Migliora leggermente la precisione dell’Ascendente.',
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
      meetingLine: (d) => `Anch'io vengo dal cielo del ${d} — lo stesso tuo. Per questo ti conosco già un po'.`,
      revealReading: 'Sto leggendo le stelle…',
      revealIntro: 'Il tuo Hoshi-Kyara è',
      guideTitle: 'Cosa viene dopo',
      guideBody: (n) => `Il tuo Hoshi-Kyara è nato. Più sotto trovi i ${n} astri che ti formano e la lettura di oggi. Il meglio è la sala consulti: risponde su amore, lavoro o ciò che verrà, partendo dai tuoi astri.`,
      guideCta: 'Parla nella sala consulti',
      partyTitle: (n) => `I ${n} astri che ti formano`,
      partySub: 'Gli astri dell’istante della tua nascita sono diventati i personaggi che ti compongono: di cosa si occupa ognuno e com’è fatto.',
      partyMore: (hidden) => `Scopri anche gli altri tuoi ${hidden} personaggi!`,
      partyLess: 'Comprimi',
      partyReveal: (total) => `Vedi i ${total} astri che ti formano`,
      partyPairNote: 'Quando un oroscopo dice "il tuo segno", intende il Sole qui sopra. Il tuo Hoshi-Kyara nasce da questo Sole (il volto esterno) unito alla Luna (il cuore).',
      partyGroup1: 'Su di te',
      partyGroup2: 'Sugli altri',
      partyGroup3: 'Sulla tua epoca',
      partyGroupCount: (n) => `${n} astri`,
      partyLearn: 'Cosa sono i 10 pianeti e i 12 segni?',
      domain: 'Ambito',
      roleSign: (role, planet, sign) => ({ role, sep1: ' — ', planetLabel: planet, sep2: ' in ', sign }),
      quirk: 'Tratto',
      retro: 'Retrogrado',
      genBadge: 'Gen',
      partyFoot: '« Gen » = pianeti lenti che riflettono anche l’aria di tutta la tua generazione.',
      fortuneTitle: (period) => `Fortuna: ${period}`,
      fortuneSub: (name) => `Letto dai transiti attuali e ${name ? `dall’Hoshi-Kyara di ${name}` : 'dal tuo Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `Basato sugli angoli tra gli astri che attraversano il cielo (${noun}) e il tuo tema natale.`,
      upsell: 'Con la tua ora di nascita possiamo aggiungere l’Ascendente e una sintesi completa di tre astri (e il segno lunare guadagna precisione). Controlla il tuo certificato di nascita.',
      adoptLead: 'Tieni questo Hoshi-Kyara vicino, ogni giorno.',
      adoptCta: 'Guardare le stelle insieme, ogni giorno',
      retry: 'Leggere di nuovo',
      home: 'Torna ai modi',
    },
    pairResult: {
      title: 'Compatibilità',
      matchLabel: 'Affinità',
      revealReading: 'Sto leggendo le stelle di entrambi…',
      breakdownTitle: 'Dettaglio dell’affinità',
      breakdownSub: 'Da quattro combinazioni di Sole (volto esterno) e Luna (cuore)',
      todayTitle: (period) => `Voi due: ${period}`,
      todaySub: (sky) => `${sky}. Che vento fa soffiare questo su di voi due?`,
      fortuneWaiting: 'Sto leggendo gli astri di entrambi',
      askAheadTitle: 'Curioso/a di come andrà tra voi? Chiedimelo.',
      askAhead: [{ label: 'Domani?', q: 'Come saremo noi due domani?' }, { label: 'Questa settimana?', q: 'Come si prospetta questa settimana per noi due?' }, { label: 'Il mese prossimo?', q: 'Che mese sarà il prossimo per noi due?' }],
      upsell: 'Con le ore di nascita i segni lunari guadagnano precisione e l’affinità si affina (ora approssimata a mezzogiorno).',
      retry: 'Cambia i dati e riprova',
      home: 'Torna ai modi',
    },
    chat: {
      title: 'Sala Hoshi-Kyara',
      sub: 'Il tuo Hoshi-Kyara conosce tutti i tuoi astri. Questa sala è solo tua.',
      historyCount: (n) => `${n} ${n === 1 ? 'domanda' : 'domande'} finora`,
      hide: 'Nascondi',
      show: 'Mostra',
      intro: 'Tutti gli astri sotto cui sei nato/a, più il cielo di adesso: tutto questo entra in una risposta pensata solo per te. Amore, lavoro, personalità, il futuro — chiedi quello che vuoi. Quello che scrivi viene inviato all’IA insieme al tuo tema.',
      inputPlaceholder: 'Scrivi un messaggio…',
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
    pairChat: {
      title: 'Il salotto in due',
      sub: 'Chiedi tutto quello che vuoi su voi due',
      intro: 'Chiedi ciò che ti sta a cuore: come andare d’accordo, perché vi scontrate, dove sta andando la relazione. Ci ragioniamo dai due temi e dalla vostra affinità.',
      starters: [
        { label: '💞 Le chiavi', q: 'Qual è il segreto per andare d’accordo?' },
        { label: '⚡ Attriti', q: 'Quando è più probabile che ci scontriamo?' },
        { label: '🔮 Il futuro', q: 'Dove sta andando la nostra relazione?' },
      ],
    },
    aboutLink: 'Su questa app',
    consent: {
      message: 'Possiamo misurare l’uso in forma anonima? (Non vengono inviati dati personali né date di nascita.)',
      allow: 'Consenti',
      deny: 'No, grazie',
      settings: 'Impostazioni di misurazione',
    },
    backup: {
      title: 'Porta con te i tuoi dati',
      note: 'Per un telefono nuovo, o prima di cancellare i dati del browser. Il file resta sul tuo dispositivo: non viene inviato a nessun server.',
      save: 'Salva su file',
      load: 'Ripristina da file',
      confirm: 'Questo sostituirà i dati attuali con il contenuto del file scelto. Vuoi continuare?',
      done: 'Ripristinato.',
      fail: 'Non è stato possibile leggere questo file.',
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
      readingHeading: 'Il tuo Hoshi-Kyara legge le stelle di oggi',
      readingHeadingNight: 'Il tuo Hoshi-Kyara legge come ti senti',
      readsIntroNight: (name) => `Sono «${name}», il tuo Hoshi-Kyara. Ecco cosa vedo dentro di te adesso.`,
      fortuneWaitingNight: 'Sto leggendo come ti senti adesso',
      daytimeFortune: 'Rileggi quella di oggi',
      askAheadTitle: 'Curioso/a di quel che viene? Chiedimelo.',
      askAhead: [{ label: 'Domani?', q: 'Come sarà domani?' }, { label: 'Questa settimana?', q: 'Come si prospetta questa settimana?' }, { label: 'Il mese prossimo?', q: 'Che mese sarà il prossimo?' }],
      readsIntro: (name) => `Sono il tuo Hoshi-Kyara, «${name}». Ho letto le stelle di adesso per te.`,
      fortuneWaiting: 'Sto leggendo i tuoi astri in questo momento',
      fortuneError: 'Impossibile raggiungere l’IA',
      fortuneRetry: 'Rileggi',
      fortuneWhy: 'Perché è uscito così?',
      hitAsk: (d) => (d === 1 ? 'Ieri ti avevo detto così. Com’è andata?' : 'L’altro giorno ti avevo detto così. Com’è andata?'),
      hitYes: 'Ci hai preso',
      hitSoso: 'Più o meno',
      hitNo: 'Non proprio',
      hitDunno: 'Non saprei',
      hitSkip: 'Salta',
      hitThanks: 'Grazie per avermelo detto. Ne terrò conto.',
      feedbackTitle: 'Come sta andando finora?',
      feedbackSub: 'Qualsiasi cosa sulle letture quotidiane, o qualcosa che non torna: raccontamelo',
      picks: {
        alone: { q: 'Se oggi avessi un’ora libera?', a: ['La passo da solo/a', 'La passo con qualcuno'] },
        decide: { q: 'Quando decidi, come fai?', a: ['Vado d’istinto', 'Prima mi informo'] },
        holiday: { q: 'In un giorno libero?', a: ['Programmo', 'Vado a sensazione'] },
        newplace: { q: 'Per scegliere un posto?', a: ['Uno nuovo', 'Quello di sempre'] },
        advice: { q: 'Se ti chiedono consiglio, prima…', a: ['Ascolto come si sente', 'Cerco una soluzione'] },
        matter: { q: 'Cosa conta di più adesso?', a: ['Quello che ho già', 'Quello che verrà'] },
      },
      readingVoice: 'Ho dato un’occhiata alle stelle per te.',
      otherPerson: 'Consultare un’altra persona',
      toMenu: 'Menu principale',
      toPair: 'Vedi l’affinità',
      toChat: 'Parla con il tuo compagno',
      seeYouTomorrow: 'Domani sarò qui a leggere le stelle, come sempre.',
    },
    map: {
      title: 'Le lettere del tuo Hoshi-Kyara',
      sub: 'Col tempo passato insieme, il tuo Hoshi-Kyara scrive in lettere ciò che nota di te.',
      progressLead: (name, n) => `Cose che ${name} ha notato di te: ${n}`,
      toNext: (n, nm) => `ancora ${n} e «${nm}» sarà scritta`,
      earnHint: 'Guardare la lettura di oggi, registrare come ti senti, parlare un po’. Ogni volta, il tuo Hoshi-Kyara ti nota un po’ di più.',
      allDone: 'Hai aperto tutte le lettere. Che viaggio.',
      open: 'Apri la lettera',
      close: 'Chiudi',
      expandMap: 'Vedi le lettere',
      collapseMap: 'Richiudi l’elenco',
      lockedHint: (n) => `ancora ${n} e sarà scritta`,
      lockedFar: 'Una lettera per più avanti',
      soonNote: 'Questa lettera è ancora in scrittura.',
      generating: 'Sto aprendo la busta con delicatezza…',
      reportError: 'Stavolta non si è aperta. Aspetta un attimo e riprova.',
      reportRetry: 'Riprova',
      tiers: {
        birth: { name: 'Nasce il tuo Hoshi-Kyara', teaser: 'Nato dal tuo Sole e dalla tua Luna: il punto di partenza della tua storia.' },
        moonBack: { name: 'L’altro lato della tua Luna', teaser: 'Il te senza difese quando ti senti al sicuro, oltre la tua faccia pubblica (il Sole).' },
        partyDeep: { name: 'I tuoi astri, in profondità', teaser: 'Una lettura più ravvicinata del ruolo dei dieci personaggi stellari.' },
        moodTrend: { name: 'Le tue tendenze d’umore', teaser: 'Man mano che i segni si accumulano: i giorni e i momenti in cui vacilli.' },
        hiddenSelf: { name: 'Il tuo io nascosto', teaser: 'Il divario tra il tuo tema natale e le tue giornate reali. La scoperta più grande.' },
        trueBuddy: { name: 'Il tuo vero compagno', teaser: 'La forma finale del tuo Hoshi-Kyara: parla tenendo conto di tutto su di te.' },
      },
      bornBody: (name) => `La tua storia è iniziata come ${name}. È qui che comincia la mappa.`,
      moonBackBody: (moonSign, manner) =>
        `Il tuo segno lunare è ${moonSign}. Oltre alla faccia che mostri agli altri (il Sole), il te sereno quando sei solo è «${manner}». È il tuo interruttore silenzioso, dietro le quinte.`,
    },
    share: {
      heading: 'Condividi il risultato con gli amici',
      text: (name) => `Il mio Hoshi-Kyara è ${name} ✨ Quale dei 16 sei tu?`,
      hashtags: ['HoshiKyara'],
      native: 'Condividi',
      copy: 'Copia link',
      copied: 'Copiato ✓',
      pairHeading: 'Condividi il risultato',
      pairText: (a, b, percent, nickname) => `${a} × ${b}: ${percent}% di affinità, ${nickname}✨ Scoprite anche la vostra`,
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
      tagline1: 'Mesmo signo, e ainda assim ninguém igual a você.',
      tagline2: 'A sua data e hora de nascimento criam um «Hoshi-Kyara» só seu.',
      greetNew: 'Olá, boas-vindas ao Hoshi-Kyara.',
      greetBack: 'Bem-vindo/a de volta.',
      aboutLink: 'O que é Hoshi-Kyara?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30 s',
      soloDesc: 'Só a sua data de nascimento. Analisamos o seu Hoshi-Kyara (1 de 16) e os planetas-personagem que vivem em você.',
      soloFirstHint: 'Primeira vez? Comece por aqui!',
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
          a: 'É um horóscopo que combina o seu signo solar (a face externa) e o signo lunar (o seu interior) para classificá-lo em um dos 16 “personagens estelares”, e depois lê a personalidade e a sorte a partir dos 10 planetas.',
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
        'A leitura calcula não só o Sol e a Lua, mas os dez astros — Mercúrio, Vênus, Marte e os demais — e em que signo cada um está. O seu Hoshi-Kyara interpreta você levando tudo isso em conta.',
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
      prefectureHint: 'Melhora um pouco a precisão do Ascendente.',
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
      meetingLine: (d) => `Eu também venho do céu de ${d} — o mesmo que o seu. Por isso já conheço você um pouquinho.`,
      revealReading: 'Lendo as estrelas…',
      revealIntro: 'O seu Hoshi-Kyara é',
      guideTitle: 'O que vem a seguir',
      guideBody: (n) => `O seu Hoshi-Kyara nasceu. Abaixo você encontra os ${n} astros que formam você e a leitura de hoje. O melhor é a sala de consulta: responde sobre amor, trabalho ou o que vem pela frente, a partir dos seus astros.`,
      guideCta: 'Conversar na sala de consulta',
      partyTitle: (n) => `Os ${n} astros que formam você`,
      partySub: 'Os astros do instante do seu nascimento viraram os personagens que compõem você: do que cada um cuida e como ele é.',
      partyMore: (hidden) => `Veja também os seus outros ${hidden} personagens!`,
      partyLess: 'Recolher',
      partyReveal: (total) => `Ver os ${total} astros que formam você`,
      partyPairNote: 'Quando um horóscopo fala do "seu signo", é o Sol aí em cima. O seu Hoshi-Kyara nasce desse Sol (a face externa) somado à Lua (o coração).',
      partyGroup1: 'Sobre você',
      partyGroup2: 'Sobre os outros',
      partyGroup3: 'Sobre a sua época',
      partyGroupCount: (n) => `${n} astros`,
      partyLearn: 'O que são os 10 planetas e 12 signos?',
      roleSign: (role, planet, sign) => ({ role, sep1: ' — ', planetLabel: planet, sep2: ' em ', sign }),
      domain: 'Área',
      quirk: 'Traço',
      retro: 'Retrógrado',
      genBadge: 'Ger.',
      partyFoot: '« Ger. » = planetas lentos que também refletem o clima de toda a sua geração.',
      fortuneTitle: (period) => `Fortuna: ${period}`,
      fortuneSub: (name) => `Lido a partir dos trânsitos atuais e ${name ? `do Hoshi-Kyara de ${name}` : 'do seu Hoshi-Kyara'}`,
      fortuneFoot: (noun) => `Baseado nos ângulos entre os astros que cruzam o céu (${noun}) e o seu mapa natal.`,
      upsell: 'Com a sua hora de nascimento, podemos acrescentar o Ascendente e uma síntese completa de três astros (e o signo lunar fica mais preciso). Confira a sua certidão de nascimento.',
      adoptLead: 'Leve este Hoshi-Kyara com você todos os dias.',
      adoptCta: 'Ver as estrelas juntos, todo dia',
      retry: 'Ler de novo',
      home: 'Voltar aos modos',
    },
    pairResult: {
      title: 'Compatibilidade',
      matchLabel: 'Afinidade',
      revealReading: 'Lendo as estrelas de vocês dois…',
      breakdownTitle: 'Detalhe da afinidade',
      breakdownSub: 'A partir de quatro combinações de Sol (rosto externo) e Lua (coração)',
      todayTitle: (period) => `Vocês dois: ${period}`,
      todaySub: (sky) => `${sky}. Que vento isso sopra para vocês dois?`,
      fortuneWaiting: 'Estou lendo os astros de vocês dois',
      askAheadTitle: 'Curioso sobre vocês dois daqui pra frente? Pergunte.',
      askAhead: [{ label: 'Amanhã?', q: 'Como vamos estar nós dois amanhã?' }, { label: 'Esta semana?', q: 'Como está esta semana para nós dois?' }, { label: 'Mês que vem?', q: 'Que mês vai ser o próximo para nós dois?' }],
      upsell: 'Com as horas de nascimento, os signos lunares ficam mais precisos e a afinidade se afina (agora aproximada ao meio-dia).',
      retry: 'Mudar os dados e repetir',
      home: 'Voltar aos modos',
    },
    chat: {
      title: 'Sala Hoshi-Kyara',
      sub: 'O seu Hoshi-Kyara conhece todos os seus astros. Esta sala é só sua.',
      historyCount: (n) => `${n} ${n === 1 ? 'consulta' : 'consultas'} até agora`,
      hide: 'Ocultar',
      show: 'Mostrar',
      intro: 'Todos os astros sob os quais você nasceu, mais o céu de agora: tudo isso entra numa resposta feita só para você. Amor, trabalho, personalidade, o que vem aí — pergunte o que quiser. O que você escreve é enviado à IA junto com o seu mapa.',
      inputPlaceholder: 'Escreva uma mensagem…',
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
    pairChat: {
      title: 'A sala dos dois',
      sub: 'Pergunte o que quiser sobre vocês dois',
      intro: 'Pergunte o que estiver na sua mente: dicas para se darem bem, por que vocês se desentendem, para onde a relação vai. Pensamos a partir dos dois mapas e da compatibilidade de vocês.',
      starters: [
        { label: '💞 Dicas', q: 'Qual é o segredo para nos darmos bem?' },
        { label: '⚡ Atritos', q: 'Quando é mais provável que a gente se desentenda?' },
        { label: '🔮 O futuro', q: 'Para onde vai a nossa relação?' },
      ],
    },
    aboutLink: 'Sobre este app',
    consent: {
      message: 'Podemos medir o uso de forma anônima? (Nenhum dado pessoal ou data de nascimento é enviado.)',
      allow: 'Permitir',
      deny: 'Não, obrigado',
      settings: 'Configurações de medição',
    },
    backup: {
      title: 'Leve seus dados',
      note: 'Para um celular novo, ou antes de limpar os dados do navegador. O arquivo fica no seu aparelho — nada é enviado para um servidor.',
      save: 'Salvar em um arquivo',
      load: 'Restaurar de um arquivo',
      confirm: 'Isto vai substituir seus registros atuais pelo conteúdo do arquivo escolhido. Continuar?',
      done: 'Restaurado.',
      fail: 'Não foi possível ler esse arquivo.',
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
      readingHeading: 'Seu Hoshi-Kyara lê as estrelas de hoje',
      readingHeadingNight: 'Seu Hoshi-Kyara lê como você está se sentindo',
      readsIntroNight: (name) => `Sou “${name}”, seu Hoshi-Kyara. Isto é o que vejo dentro de você agora.`,
      fortuneWaitingNight: 'Estou lendo como você está se sentindo agora',
      daytimeFortune: 'Reler a de hoje',
      askAheadTitle: 'Curioso sobre o que vem? É só perguntar.',
      askAhead: [{ label: 'Amanhã?', q: 'Como vai ser o amanhã?' }, { label: 'Esta semana?', q: 'Como está esta semana?' }, { label: 'Mês que vem?', q: 'Que mês vai ser o próximo?' }],
      readsIntro: (name) => `Sou o seu Hoshi-Kyara, «${name}». Li as estrelas de agora para você.`,
      fortuneWaiting: 'Estou lendo os seus astros agora',
      fortuneError: 'Não foi possível conectar à IA',
      fortuneRetry: 'Ler de novo',
      fortuneWhy: 'Por que saiu assim?',
      hitAsk: (d) => (d === 1 ? 'Foi isto que te disse ontem. Como foi?' : 'Foi isto que te disse no outro dia. Como foi?'),
      hitYes: 'Acertou',
      hitSoso: 'Mais ou menos',
      hitNo: 'Nem tanto',
      hitDunno: 'Não sei dizer',
      hitSkip: 'Agora não',
      hitThanks: 'Obrigada por contar. Vou levar isso em conta.',
      feedbackTitle: 'Como está sendo até agora?',
      feedbackSub: 'Qualquer coisa sobre as leituras diárias, ou algo que não encaixe: quero saber',
      picks: {
        alone: { q: 'Se hoje tivesse uma hora livre?', a: ['Ficar sozinho/a', 'Ficar com alguém'] },
        decide: { q: 'Na hora de decidir, como é?', a: ['Vou na intuição', 'Pesquiso antes'] },
        holiday: { q: 'Num dia de folga?', a: ['Planejo', 'Vou no clima'] },
        newplace: { q: 'Para escolher um lugar?', a: ['Um novo', 'O de sempre'] },
        advice: { q: 'Se te pedem conselho, primeiro…', a: ['Escuto o sentimento', 'Busco uma solução'] },
        matter: { q: 'O que mais importa agora?', a: ['O que já tenho', 'O que está por vir'] },
      },
      readingVoice: 'Já dei uma olhada nas estrelas para você.',
      otherPerson: 'Consultar outra pessoa',
      toMenu: 'Menu principal',
      toPair: 'Ver compatibilidade',
      toChat: 'Conversar com seu companheiro',
      seeYouTomorrow: 'Amanhã também estarei aqui lendo as estrelas.',
    },
    map: {
      title: 'Cartas do seu Hoshi-Kyara',
      sub: 'Com o tempo que vocês passam juntos, seu Hoshi-Kyara vai escrevendo em cartas o que percebe de você.',
      progressLead: (name, n) => `Coisas que ${name} percebeu de você: ${n}`,
      toNext: (n, nm) => `mais ${n} e «${nm}» estará escrita`,
      earnHint: 'Ver a leitura de hoje, registrar o ânimo, conversar um pouco. A cada vez, seu Hoshi-Kyara percebe você um pouco mais.',
      allDone: 'Você abriu todas as cartas que há. Que jornada.',
      open: 'Abrir a carta',
      close: 'Fechar',
      expandMap: 'Ver as cartas',
      collapseMap: 'Recolher a lista',
      lockedHint: (n) => `mais ${n} e estará escrita`,
      lockedFar: 'Uma carta para depois',
      soonNote: 'Esta carta ainda está sendo escrita.',
      generating: 'Abrindo o envelope com cuidado…',
      reportError: 'Não abriu desta vez. Espere um momento e tente de novo.',
      reportRetry: 'Tentar de novo',
      tiers: {
        birth: { name: 'Seu Hoshi-Kyara nasce', teaser: 'Nascido do seu Sol e da sua Lua: o ponto de partida da sua história.' },
        moonBack: { name: 'O outro lado da sua Lua', teaser: 'O você sem defesas quando se sente seguro, além da sua face pública (o Sol).' },
        partyDeep: { name: 'Seus astros, a fundo', teaser: 'Uma leitura mais próxima do papel dos dez personagens estelares.' },
        moodTrend: { name: 'Seus padrões de humor', teaser: 'Conforme os registros se acumulam: os dias e lugares em que você oscila.' },
        hiddenSelf: { name: 'Seu eu oculto', teaser: 'A lacuna entre seu mapa natal e seus dias reais. A grande descoberta.' },
        trueBuddy: { name: 'Seu verdadeiro companheiro', teaser: 'A forma final do seu Hoshi-Kyara: fala levando em conta tudo sobre você.' },
      },
      bornBody: (name) => `Sua história começou como ${name}. É aqui que o mapa começa.`,
      moonBackBody: (moonSign, manner) =>
        `Seu signo lunar é ${moonSign}. Além da face que você mostra aos outros (o Sol), o você tranquilo quando está sozinho é «${manner}». É seu interruptor discreto, fora dos holofotes.`,
    },
    share: {
      heading: 'Compartilhe seu resultado com amigos',
      text: (name) => `Meu Hoshi-Kyara é ${name} ✨ Qual dos 16 é você?`,
      hashtags: ['HoshiKyara'],
      native: 'Compartilhar',
      copy: 'Copiar link',
      copied: 'Copiado ✓',
      pairHeading: 'Compartilhar o resultado',
      pairText: (a, b, percent, nickname) => `${a} × ${b}: ${percent}% de combinação, ${nickname}✨ Descubram a de vocês também`,
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
      tagline1: '같은 별자리라도, 한 사람 한 사람 다릅니다.',
      tagline2: '태어난 날과 시간으로 만들어지는, 당신만의 「호시캐릭터」.',
      greetNew: '처음 뵙겠습니다, 호시캐릭터 진단이에요.',
      greetBack: '어서 오세요.',
      aboutLink: 'Hoshi-Kyara란?',
      soloName: '🌟 Hoshi-Kyara',
      soloTime: '30초',
      soloDesc: '생년월일만 있으면 OK. 당신의 Hoshi-Kyara(16종 중 하나)와 당신 안에 사는 행성 캐릭터까지 분석해요.',
      soloFirstHint: '처음이신가요? 여기서 시작하세요!',
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
          a: '태어난 순간의 별자리 배치에서 태양 별자리(겉모습)와 달 별자리(마음속)를 곱해 당신을 16가지 ‘호시캐릭터’로 분류하는 별점입니다. 나아가 10개 행성 배치로 성격과 운세까지 풀이합니다.',
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
        '진단에서는 태양과 달뿐 아니라 수성·금성·화성… 모두 10개 천체가 각각 어느 별자리에 있는지 계산해요. 당신의 호시캐릭터는 그 전부를 바탕으로 당신을 풀이해요.',
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
      prefectureHint: '상승 별자리 정확도가 살짝 올라가요.',
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
      meetingLine: (d) => `저는 ${d}, 당신과 같은 하늘에서 태어났어요. 그래서 당신을 조금은 알고 있어요.`,
      revealReading: '별을 읽고 있어요…',
      revealIntro: '당신의 호시캐릭터는',
      guideTitle: '이다음 즐기는 법',
      guideBody: (n) => `호시캐릭터가 완성됐어요. 아래에는 당신을 이루는 ${n}개의 별과 오늘의 운세가 이어져요. 가장 추천하는 건 「호시캐릭터 상담실」. 당신의 별을 바탕으로 연애도 일도 앞으로의 운세도 답해 줘요.`,
      guideCta: '상담실에서 말 걸기',
      partyTitle: (n) => `당신을 이루는 ${n}개의 별`,
      partySub: '태어난 순간의 별들이 당신을 이루는 캐릭터가 되었어요. 각자의 담당과 특징이에요.',
      partyMore: (hidden) => `나머지 ${hidden} 캐릭터도 봐 봐요!`,
      partyLess: '접기',
      partyReveal: (total) => `당신을 이루는 ${total}개의 별 보기`,
      partyPairNote: '운세에서 말하는 "당신의 별자리"는 맨 위의 태양이에요. 이 태양(겉모습)과 달(마음)의 조합으로 당신의 호시캐릭터가 정해졌어요.',
      partyGroup1: '나에 대한 것',
      partyGroup2: '사람에 대한 것',
      partyGroup3: '시대에 대한 것',
      partyGroupCount: (n) => `별 ${n}개`,
      partyLearn: '10행성과 12별자리란?',
      domain: '담당',
      roleSign: (role, planet, sign, isAsc) => ({ role, sep1: '의 ', planetLabel: isAsc ? planet : `${planet} 별자리`, sep2: isAsc ? '은 ' : '는 ', sign }),
      quirk: '특징',
      retro: '역행',
      genBadge: '세대',
      partyFoot: '「세대」 = 움직임이 느리고, 같은 세대가 공유하는 시대 분위기도 비추는 행성이에요.',
      fortuneTitle: (period) => `${period}의 운세`,
      fortuneSub: (name) => `지금의 별 운행과 ${name ? `${name}님의` : '당신의'} Hoshi-Kyara로 읽고 있어요`,
      fortuneFoot: (noun) => `${noun}의 하늘을 지나는 별들과 태어난 순간의 별자리 배치 사이의 각도를 바탕으로 해요.`,
      upsell: '태어난 시각을 알면 상승 별자리와 3천체 종합 분석까지 볼 수 있어요(달 별자리 정확도도 올라가요). 출생 기록을 확인해 보세요.',
      adoptLead: '이 호시캐릭터와 매일 함께.',
      adoptCta: '이 아이와 매일 별 보기',
      retry: '다시 점치기',
      home: '모드 선택으로',
    },
    pairResult: {
      title: '궁합',
      matchLabel: '궁합',
      revealReading: '두 사람의 별을 읽고 있어요…',
      breakdownTitle: '궁합 내역',
      breakdownSub: '태양(겉모습)과 달(마음), 네 가지 조합에서',
      todayTitle: (period) => `${period}의 두 사람`,
      todaySub: (sky) => `${sky}. 두 사람에게는 어떤 바람이 불까요?`,
      fortuneWaiting: '지금 두 사람의 별을 읽고 있어요',
      askAheadTitle: '앞으로의 두 사람이 궁금하면, 물어보세요',
      askAhead: [{ label: '내일은?', q: '내일 두 사람은 어떤 느낌이야?' }, { label: '이번 주는?', q: '이번 주 두 사람은 어떤 흐름이야?' }, { label: '다음 달은?', q: '다음 달 두 사람은 어떤 시기가 될까?' }],
      upsell: '태어난 시각을 알면 달 별자리 정확도가 올라가 궁합 판정도 더 정확해져요(현재는 정오로 근사하고 있어요).',
      retry: '조건 바꿔 다시 점치기',
      home: '모드 선택으로',
    },
    chat: {
      title: 'Hoshi-Kyara 상담실',
      sub: '당신의 별을 전부 아는 호시캐릭터. 당신만의 상담실이에요.',
      historyCount: (n) => `지금까지 상담 ${n}건`,
      hide: '숨기기',
      show: '보기',
      intro: '태어난 순간의 별 전부와, 지금의 별의 흐름. 그 모두를 바탕으로 당신에게만 답해 드려요. 연애·일·성격·앞으로의 일——무엇이든 물어보세요. 쓰신 내용은 별자리 배치와 함께 AI에게 전달돼요.',
      inputPlaceholder: '메시지를 입력…',
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
    pairChat: {
      title: '둘의 상담실',
      sub: '두 사람의 궁합에 대해 무엇이든 물어보세요',
      intro: '궁금한 걸 물어보세요. 잘 지내는 비결, 부딪히는 이유, 앞으로의 두 사람——두 사람의 별자리 배치와 궁합을 바탕으로 함께 생각해요.',
      starters: [
        { label: '💞 잘 지내는 비결', q: '두 사람이 잘 지내는 비결을 알려줘요' },
        { label: '⚡ 엇갈림', q: '두 사람이 엇갈리기 쉬운 건 어떤 때예요?' },
        { label: '🔮 앞으로', q: '앞으로 두 사람 관계는 어떻게 될까요?' },
      ],
    },
    aboutLink: '이 앱에 대해',
    consent: {
      message: '익명 사용 현황을 측정해도 될까요? (개인정보·생년월일은 전송하지 않아요.)',
      allow: '허용',
      deny: '아니요',
      settings: '측정 설정',
    },
    backup: {
      title: '데이터 옮기기',
      note: '기기를 바꾸거나 브라우저 데이터를 지우기 전에. 파일은 기기에 저장되며 서버로 보내지 않습니다.',
      save: '파일로 저장',
      load: '파일에서 복원',
      confirm: '지금의 기록을 선택한 파일의 내용으로 바꿉니다. 계속할까요?',
      done: '복원했어요.',
      fail: '이 파일은 읽을 수 없었어요.',
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
      readingHeading: '당신의 호시캐릭터가 읽는 오늘의 운세',
      readingHeadingNight: '당신의 호시캐릭터가 읽는 지금의 마음',
      readsIntroNight: (name) => `당신의 호시캐릭터 「${name}」이에요. 지금 당신의 안쪽을 읽었어요.`,
      fortuneWaitingNight: '지금 당신의 마음을 읽고 있어요',
      daytimeFortune: '오늘의 운세 다시 보기',
      askAheadTitle: '앞으로가 궁금하면, 물어보세요',
      askAhead: [{ label: '내일은?', q: '내일은 어떤 하루가 될까?' }, { label: '이번 주는?', q: '이번 주는 어떤 흐름이야?' }, { label: '다음 달은?', q: '다음 달은 어떤 시기가 될까?' }],
      readsIntro: (name) => `당신의 호시캐릭터 「${name}」입니다. 지금의 별의 흐름을 읽어 봤어요.`,
      fortuneWaiting: '지금 당신의 별을 읽고 있어요',
      fortuneError: 'AI에 연결하지 못했어요',
      fortuneRetry: '다시 읽기',
      fortuneWhy: '왜 이렇게 나왔나요?',
      hitAsk: (d) => (d === 1 ? '어제는 이렇게 전해 드렸는데, 어떠셨어요?' : '지난번에는 이렇게 전해 드렸는데, 어떠셨어요?'),
      hitYes: '맞았어요',
      hitSoso: '그럭저럭',
      hitNo: '안 맞았어요',
      hitDunno: '잘 모르겠어요',
      hitSkip: '나중에',
      hitThanks: '알려 주셔서 고마워요. 다음에 참고할게요.',
      feedbackTitle: '지금까지 어떠세요?',
      feedbackSub: '매일의 운세에 대해서든, 마음에 걸리는 점이든 무엇이든 들려주세요',
      picks: {
        alone: { q: '오늘 한 시간이 생긴다면?', a: ['혼자 보내기', '누군가와 보내기'] },
        decide: { q: '뭔가 정할 때는 어느 쪽?', a: ['느낌이 오는 쪽', '알아보고 나서'] },
        holiday: { q: '쉬는 날에는?', a: ['미리 정해 두기', '그때 기분대로'] },
        newplace: { q: '가게를 고른다면?', a: ['처음 가는 곳', '늘 가던 곳'] },
        advice: { q: '고민 상담을 받으면 먼저?', a: ['마음을 물어보기', '해결책을 찾기'] },
        matter: { q: '지금 더 소중한 건?', a: ['지금 가진 것', '앞으로 올 것'] },
      },
      readingVoice: '별의 흐름, 미리 봐 뒀어.',
      otherPerson: '다른 사람 점치기',
      toMenu: '메인 메뉴로',
      toPair: '궁합 보기',
      toChat: '상담하기',
      seeYouTomorrow: '내일도 여기서 별을 읽고 있을게요.',
    },
    map: {
      title: '호시캐릭터의 편지',
      sub: '함께 지내는 동안 알게 된 것들을, 호시캐릭터가 편지에 적어 두고 있어요.',
      progressLead: (name, n) => `${name}이(가) 당신에 대해 알게 된 것: ${n}`,
      toNext: (n, nm) => `앞으로 ${n}이면 「${nm}」 편지가 완성돼요`,
      earnHint: '오늘의 운세를 보고, 기분을 남기고, 이야기를 나누고. 그때마다 호시캐릭터는 당신을 알아가요.',
      allDone: '지금 있는 편지는 전부 열어 봤어요. 여기까지 정말 잘 이어왔네요.',
      open: '편지 열기',
      close: '닫기',
      expandMap: '편지 목록 보기',
      collapseMap: '목록 접기',
      lockedHint: (n) => `앞으로 ${n}이면 완성돼요`,
      lockedFar: '나중에 쓸 편지',
      soonNote: '이 편지는 아직 쓰는 중이에요.',
      generating: '살며시 봉투를 열고 있어요…',
      reportError: '이번엔 잘 열리지 않았어요. 잠시 뒤에 다시 시도해 주세요.',
      reportRetry: '다시 시도',
      tiers: {
        birth: { name: '호시캐릭터 탄생', teaser: '태양과 달에서 태어난 당신의 호시캐릭터. 이야기의 출발점.' },
        moonBack: { name: '달 별자리의 이면', teaser: '겉으로 보이는 얼굴(태양)과는 다른, 안심할 때의 본래의 당신.' },
        partyDeep: { name: '별들 깊이 보기', teaser: '열 별 캐릭터의 한 걸음 더 들어간 역할과 해석.' },
        moodTrend: { name: '기분의 버릇', teaser: '기록이 쌓이면 보이는, 당신이 흔들리기 쉬운 요일과 상황.' },
        hiddenSelf: { name: '숨은 나', teaser: '본래의 별(출생 차트)과 실제 하루의 간극. 가장 큰 발견.' },
        trueBuddy: { name: '진짜 단짝', teaser: '당신의 모든 것을 바탕으로 이야기하는 호시캐릭터의 최종형.' },
      },
      bornBody: (name) => `${name}(으)로 당신의 이야기가 시작됐어요. 이 지도의 출발점이에요.`,
      moonBackBody: (moonSign, manner) =>
        `당신의 달 별자리는 「${moonSign}」. 남에게 보이는 얼굴(태양)과는 별개로, 혼자 안심하고 있을 때의 당신은 「${manner}」. 겉에서는 보이지 않는 본래의 스위치예요.`,
    },
    share: {
      heading: '결과를 친구에게 공유',
      text: (name) => `내 호시캐릭터는 ${name} ✨ 당신은 16캐릭터 중 누구?`,
      hashtags: ['호시캐릭터진단'],
      native: '공유하기',
      copy: '링크 복사',
      copied: '복사됨 ✓',
      pairHeading: '결과 공유하기',
      pairText: (a, b, percent, nickname) => `${a} × ${b} 궁합은 ${percent}%, ${nickname}였어요✨ 두 사람의 궁합도 볼 수 있어요`,
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
