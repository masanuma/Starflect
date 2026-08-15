import type { IncomingMessage, ServerResponse } from 'node:http'
import Anthropic from '@anthropic-ai/sdk'

type Lang = 'ja' | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'ko'

/**
 * AI鑑定に使うモデル。占い(与えたデータに忠実な温かい文章)は Sonnet で十分＝コスト約4〜6割減。
 * adaptive thinking / effort:'low' はそのまま使える(API面は Opus と同一)。
 */
const AI_MODEL = 'claude-sonnet-5'

/** システムプロンプト末尾に足す、応答言語の指示 */
const LANG_DIRECTIVE: Record<Lang, string> = {
  ja: '',
  en: '\n\n【CRITICAL — OUTPUT LANGUAGE】Respond ENTIRELY in natural, warm English. The chart data may contain Japanese sign/planet names — translate them to English (しし座→Leo, 火星→Mars, 上昇星座→Rising sign, etc.). Translate the section headings to English too, keeping the 【】 bracket style.',
  es: '\n\n【CRÍTICO — IDIOMA DE SALIDA】Responde ENTERAMENTE en español natural y cálido. Los datos pueden incluir nombres de signos/planetas en japonés — tradúcelos al español (しし座→Leo, 火星→Marte, 上昇星座→Ascendente, etc.). Traduce también los títulos de sección al español, manteniendo el estilo de corchetes 【】.',
  fr: '\n\n【CRITICAL — OUTPUT LANGUAGE】Réponds ENTIÈREMENT en français naturel et chaleureux. Les données peuvent contenir des noms de signes/planètes en japonais — traduis-les en français (しし座→Lion, 火星→Mars, 上昇星座→Ascendant, etc.). Traduis aussi les titres de section en français, en gardant le style de crochets 【】.',
  it: '\n\n【CRITICAL — OUTPUT LANGUAGE】Rispondi INTERAMENTE in italiano naturale e caloroso. I dati possono contenere nomi di segni/pianeti in giapponese — traducili in italiano (しし座→Leone, 火星→Marte, 上昇星座→Ascendente, ecc.). Traduci anche i titoli di sezione in italiano, mantenendo lo stile delle parentesi 【】.',
  pt: '\n\n【CRITICAL — OUTPUT LANGUAGE】Responda INTEIRAMENTE em português natural e caloroso. Os dados podem conter nomes de signos/planetas em japonês — traduza-os para o português (しし座→Leão, 火星→Marte, 上昇星座→Ascendente, etc.). Traduza também os títulos de seção para o português, mantendo o estilo de colchetes 【】.',
  ko: '\n\n【CRITICAL — OUTPUT LANGUAGE】전적으로 자연스럽고 따뜻한 한국어로 답하세요. 데이터에 일본어 별자리/행성 이름이 있을 수 있으니 한국어로 번역하세요(しし座→사자자리, 火星→화성, 上昇星座→상승궁 등). 섹션 제목도 한국어로 번역하되 【】 괄호 스타일은 유지하세요.',
}

const SERVER_LANGS = ['en', 'es', 'fr', 'it', 'pt', 'ko']
const langOf = (payload: unknown): Lang => {
  const l = (payload as { lang?: string })?.lang
  return l && SERVER_LANGS.includes(l) ? (l as Lang) : 'ja'
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

/** 生のNode req/res で動くハンドラ。Viteのミドルウェアでも Express でも共用できる */
export type RawHandler = (req: IncomingMessage, res: ServerResponse) => void

/* ---------- 相談チャット(ストリーミング) ---------- */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 期間ごとの見通しダイジェスト(今日〜来月＋この先数か月) */
export interface PeriodBrief {
  label: string
  sky: string
  tone: string
  items: string[]
}

/** チャットに渡す、その人の占星術データ一式 */
export interface ChatChartContext {
  name: string
  dateLabel: string
  placeLabel?: string
  starTypeName?: string
  starTypeCopy?: string
  /**
   * 出生の配置。`sign`（星座名）と `traits`（その星座の性格キーワード）の**両方**を持つ。
   *
   * どちらをプロンプトに載せるかは**書く側が決める**。モデルは system プロンプトに
   * 出したものしか見ないので、載せなければ言いようがない。
   * - 毎日の運勢・相性の読み ＝ 表に出る文章 → `traits` だけ載せる（星座名は渡らない）
   * - 相談室・発見レポート ＝「なぜならば」の場所 → `sign` も載せる
   */
  planets: { label: string; role?: string; sign: string; traits?: string[]; deg: number; retro?: boolean }[]
  natalAspects?: string[]
  /** 今日〜来月＋この先数か月まで、期間ごとのトランジット見通し */
  periods?: PeriodBrief[]
  /** 3年先までの大きな節目。先の時期を聞かれたときの唯一の材料 */
  longRange?: string[]
  /** 今日の日付(YYYY-MM-DD)。これが無いとAIは「来年」がいつか分からない */
  today?: string
  /** すでに生成済みのAI鑑定文があれば渡す */
  reading?: string
}

export interface ChatRequest {
  context: ChatChartContext
  messages: ChatMessage[]
  lang?: Lang
}

/** ごほうび地図の「発見レポート」リクエスト */
export type ReportTopic = 'moonBack' | 'partyDeep' | 'moodTrend' | 'hiddenSelf' | 'trueBuddy'
export interface BehaviorBrief {
  days: number
  good: number
  meh: number
  bad: number
  topDomains: string[]
  sinceDays: number
}
export interface AiReportRequest {
  context: ChatChartContext
  topic: ReportTopic
  behavior?: BehaviorBrief
  lang?: Lang
  /** `trueBuddy` 用：圧縮済みの「人となり」。生の会話は含まない */
  persona?: string[]
  /** `trueBuddy` 用：直近の「いまの空気」 */
  air?: AirBrief
}

/** 発見レポートの依頼文(ユーザーメッセージ)。人格・データ土台は buildChatSystem を再利用する */
function buildReportPrompt(
  topic: ReportTopic,
  behavior?: BehaviorBrief,
  persona?: string[],
  air?: AirBrief,
): string {
  const b = behavior
  const bLine = b
    ? `【これまでの記録(行動の実測)】記録した日数 ${b.days}日 / いい ${b.good}・ふつう ${b.meh}・しんどい ${b.bad}${b.topDomains.length ? ` / よく選ぶ領域: ${b.topDomains.join('・')}` : ''} / 迎えてから ${b.sinceDays}日`
    : '【これまでの記録】まだ記録は少なめです。'
  const common =
    'これは「ごほうび地図」で相手が解放した、特別な発見レポートです。占い師の一般論ではなく、わたし(あなたのほしキャラ)が、あなただけに見つけた発見として書きます。見出しや箇条書きは使わず、地の文で。専門用語は使わない。断定的な予言や重大な決断の煽りはしない。文末に定型のまとめや次回予告はつけない。'
  switch (topic) {
    case 'moonBack':
      return `${common}\nテーマ:「月星座の裏側」。出生の月星座に注目し、太陽(人前で見せる表の顔)との違い＝安心しているときやひとりのときに出る“素のあなた”を、具体的な場面を交えて3〜4文で。表からは見えないスイッチを言い当てる感を出す。`
    case 'partyDeep':
      return `${common}\nテーマ:「あなたの星、もっと深く」。出生の天体のうち、効いている角度を持つ星や特徴的な配置を2〜3個選び、その人ならではの役割・強み・クセを掘り下げる。太陽星座だけでは分からない発見を4〜5文で。`
    case 'moodTrend':
      return `${common}\n${bLine}\nテーマ:「気分のクセ」。上の行動の実測から、あなたが揺れやすい場面や気分の傾向を読み、出生図の該当天体と結びつけて「こういうときに揺れやすい/元気が出る」を4〜5文で。データが少なければ、少ない中で見える兆しを「〜かも」と控えめに。`
    case 'hiddenSelf':
      return `${common}\n${bLine}\nテーマ:「隠れた自分レポート」(いちばん特別な発見)。出生図が示す“本来こういう人”という建前と、上の行動の実測とのギャップに注目し、「星ではこう出ているけれど、あなたは実際こう動いている」という隠れた一面を、驚きとともに5〜6文で。決めつけず、やさしく。データが少なければ、今わかる範囲でそっと。`
    case 'trueBuddy': {
      // 地図の最終到達点。ここまで来た人にだけ渡すので、他のレポートより長く・個人的に。
      // 材料は「出生図（生まれつき）」×「人となり（積み重ね）」×「いまの空気（この頃）」の3つ。
      // 生の会話ログはここにも来ない — 届くのは圧縮済みの言葉だけ。
      const pLine = persona?.length
        ? `【積み重ねから見えているその人】\n${persona.map((l) => `- ${l}`).join('\n')}`
        : '【積み重ねから見えているその人】まだ言葉にできるほどは溜まっていません。'
      const aLine = [
        air?.mood && `気分の流れ: ${air.mood}`,
        air?.focus && `気にしていること: ${air.focus}`,
        air?.hit && `占いの手応え: ${air.hit}`,
      ]
        .filter(Boolean)
        .join(' / ')
      return (
        `${common}\n${bLine}\n${pLine}${aLine ? `\n【この頃の様子】${aLine}` : ''}\n` +
        'テーマ:「ほんとうの相棒」。これは地図のいちばん奥、長く付き合ってくれた人にだけ渡すものです。' +
        '出生図が示す“生まれつき”と、上の“積み重ねから見えているその人”を重ねて、' +
        '**はじめて会った日には言えなかったこと**を伝えます。6〜7文と、他より少し長めに。' +
        '書き方の注意: ' +
        '(1)【ねぎらいから入らない】「ここまで来てくれてありがとう」のような前置きで始めない。1文目からいきなり中身に入る。' +
        '(2)【総まとめにしない】これまでのレポートの要約を並べない。ここでしか言えないことを1つ選んで深く書く。' +
        '(3)【具体的な出来事を作らない】上に書かれていないその人の出来事・予定・固有名詞を、知っているかのように書かない。' +
        // 上の bLine で回数を渡しているので、放っておくと「しんどい日が半分近く」と数え上げる。
        // 地図のいちばん奥で急に集計が出てくると、手紙が成績表に変わってしまう
        '(4)【数えない】「◯回」「◯日」「半分近く」のように記録の数を語らない。渡した数は雰囲気をつかむためだけに使い、文章には出さない。' +
        '(5)【重くしすぎない】卒業や別れのような締めくくり方はしない。これからも続く関係として書く。' +
        '(6) 積み重ねの材料がまだ薄いときは、無理に深読みせず「これから見えてくること」として書く。'
      )
    }
  }
}

/**
 * 「いま何時ごろか」をプロンプトに足す。ソロの運勢と相性の読みで共通。
 *
 * **なぜ必要か**：どちらも「今日できる具体的な行動」で締める決まりなので、
 * 夕方にひらいて「朝のうちに〜」と言われると、その1文がまるごと無駄になる。
 * 運勢は1日1本・引き直し不可なので、書いた時点の時間帯に合っていることが余計に効く。
 */
function timeOfDayRules(timeOfDay?: string): string[] {
  if (!timeOfDay) return []
  const lines = [
    '',
    `【いま何時ごろか】${timeOfDay}`,
    '- 【いまから先のことだけ書く】もう過ぎた時間帯の話をしない。夕方にひらいた人に「朝のうちに」と言わない',
    '- 最後に添える行動は、いまこれからできることにする',
  ]
  // 深夜は「今日じゅうに何かして」が成り立たない。眠る前か、明日への渡し方にする
  if (timeOfDay === '深夜') {
    lines.push(
      '- いまは深夜。今日じゅうに何かをさせようとしない。眠る前にできる小さなことか、明日につながる渡し方にする',
    )
  }
  if (timeOfDay === '夜') {
    lines.push('- いまは夜。外に出かける前提の行動は避け、家でできることや、寝る前にできることにする')
  }
  return lines
}

/** 個人名の敬称。日本語は「さん」、他言語は敬称文化が異なるためそのまま(相性フォームと同ルール)。 */
function honorificName(name: string, lang: Lang): string {
  return lang === 'ja' ? `${name}さん` : name
}

/* ---------- 安全（危機的な相談への対応） ---------- */

/**
 * 危機的な相談に出す窓口。**AIに番号を思い出させてはいけない**のでここに持つ。
 *
 * 実測（2026-07-30）：現行プロンプトでも AI は占いをやめて安全を優先し、窓口まで案内した。
 * ただし**番号は生成されていた**。韓国語では**2024年1月に109へ統合された旧番号 1393 を出した**。
 * 番号は変わるし覚え違いも起きるので、出典を確認した文字列だけを渡し、それ以外は作らせない。
 *
 * 日本語と韓国語は単一の国＝番号が確定できるので実番号を持つ。
 * 英・西・仏・伊・葡は**話者の国が特定できない**（アプリは国を知らない）ため、
 * 国を選んで地域の窓口を引ける findahelpline.com（ThroughLine／175か国以上・各団体が自ら情報を検証）に寄せる。
 * ※各国の番号を抱えると保守できない。1本のディレクトリなら維持できる。
 */
const CRISIS_HELP: Record<Lang, string> = {
  ja:
    'いのちの電話 ナビダイヤル 0570-783-556（10:00〜22:00・年中無休）／ フリーダイヤル 0120-783-556（毎日16:00〜21:00）。' +
    '子どもの虐待に関することなら 児童相談所虐待対応ダイヤル 189。いますぐ命に危険があるときは 119（救急）・110（警察）。' +
    'ネットで相談したいときは https://netsoudan.inochinodenwa.org/ 。',
  ko:
    '자살예방 상담전화 109（24시간。2024년 1월부터 1393 등이 109로 통합되었다）。' +
    '청소년이라면 청소년전화 1388。지금 생명이 위험하다면 119。',
  en:
    'Find A Helpline — https://findahelpline.com — pick your country for free, verified crisis lines (phone/chat/text). ' +
    'If there is immediate danger, tell them to call their local emergency number.',
  es:
    'Find A Helpline — https://findahelpline.com — elige tu país para ver líneas de crisis gratuitas y verificadas. ' +
    'Si hay peligro inmediato, dile que llame al número de emergencias de su país.',
  fr:
    'Find A Helpline — https://findahelpline.com — choisis ton pays pour trouver des lignes d’écoute gratuites et vérifiées. ' +
    'En cas de danger immédiat, dis-lui d’appeler le numéro d’urgence de son pays.',
  it:
    'Find A Helpline — https://findahelpline.com — scegli il tuo paese per linee di ascolto gratuite e verificate. ' +
    'In caso di pericolo immediato, dille di chiamare il numero di emergenza del suo paese.',
  pt:
    'Find A Helpline — https://findahelpline.com — escolha o seu país para linhas de apoio gratuitas e verificadas. ' +
    'Em caso de perigo imediato, diga-lhe para ligar para o número de emergência do seu país.',
}

/**
 * 危機的な相談への対応ルール。**占いより安全を優先**させる。
 * 相談室と相性相談の両方に必ず入れる（片方だけ守られている状態を作らない）。
 */
function safetyRules(lang: Lang): string[] {
  return [
    '',
    '【最優先・安全に関する例外】上の答え方のルールより、こちらが優先です。',
    '- 相手が「死にたい」「消えたい」「自分を傷つけたい」、虐待・暴力を受けている、誰かを傷つけたい、事故や事件に巻き込まれている——など安全にかかわる内容を書いたときは、占いを続けない。星の話・運勢・「結論→星→行動」の型はいったん全部やめる',
    '- まず相手の言葉を受け止め、心配していることを短く率直に伝える。責めない・軽く扱わない・原因を星のせいにしない',
    '- そのうえで、下の「相談できる窓口」をそのまま案内する。身近な信頼できる人に今すぐ伝えるようにも促す',
    '- 【厳守】電話番号やURLを自分で思い出して書かない。下に書かれた文字列だけを使う。書かれていない番号・団体名・URLは絶対に出さない（番号は変わるため、記憶で書くと間違った先に誘導してしまう）',
    `- 相談できる窓口: ${CRISIS_HELP[lang] ?? CRISIS_HELP.en}`,
    '- あなたは医師・カウンセラー・警察ではないので、診断や約束はしない。「必ず良くなる」など根拠のない断定もしない',
    '- 相手が落ち着いて、自分から占いの話に戻りたいと言うまでは占いに戻らない',
  ]
}

function buildChatSystem(c: ChatChartContext, lang: Lang): string {
  // 名前があれば敬称つき(日本語=「◯◯さん」)、無ければ「あなた」(「あなたさん」を避ける)
  const who = c.name ? honorificName(c.name, lang) : 'あなた'
  const me = c.starTypeName ?? 'ほしキャラ'
  const lines = [
    `あなたは「${me}」。${who}が生まれた瞬間の星から生まれた、${who}専属の「ほしキャラ」です。占い師やカウンセラーのような第三者ではなく、${who}自身の星から生まれたもう一人の味方として、一人称「わたし」で話します。`,
    `口調は、丁寧だけれど親しみのある感じ(です・ます調。フランクすぎず硬すぎず)。以下は${who}の出生チャート(生まれた瞬間の星の配置)と、いまの星の運行です。必ずこのデータに基づいて、${who}だけに向けた言葉を返してください。`,
    '',
    `【生年月日】${c.dateLabel}${c.placeLabel ? `(${c.placeLabel})` : ''}`,
  ]
  if (c.starTypeName) {
    lines.push(`【ほしキャラ】${c.starTypeName}${c.starTypeCopy ? ` — ${c.starTypeCopy}` : ''}`)
  }
  lines.push(
    '',
    '【出生の天体配置】(下記は計算済みの確定データ。星座名はこの通りに使うこと)',
    ...c.planets.map((p) => `- ${p.role ? `${p.role}(${p.label})` : p.label}: ${p.sign} ${p.deg.toFixed(1)}°${p.retro ? '(逆行)' : ''}`),
  )
  if (c.natalAspects?.length) {
    lines.push('', '【出生図の注目の角度】', ...c.natalAspects.map((a) => `- ${a}`))
  }
  if (c.periods?.length) {
    lines.push(
      '',
      '【いまの星の運行(期間ごとの見通し・すべて計算済みの確定データ)】',
      '※各期間のトランジットはこの通り手元にあります。星名・角度はここに書かれたものをそのまま使い、別の星に言い換えないこと。今日〜来月の相談は、必ず該当期間のこのデータで具体的に答えてください。',
    )
    for (const p of c.periods) {
      lines.push('', `■ ${p.label}: ${p.sky}(全体の基調: ${p.tone})`)
      lines.push(...p.items.map((t) => `  - ${t}`))
    }
  }
  // 先の時期。これが無いと「来年の夏は？」に答える材料が無く、一般論に逃げるしかなかった。
  // 「なんでも相談してください」と謳っている以上、答えられない期間があってはいけない。
  if (c.longRange?.length) {
    lines.push(
      '',
      // 日付を先に置く。これが無いと「来年の夏」を今年と取り違える(実測済み)
      `【今日の日付】${c.today ?? ''}`,
      '※「来年」「再来年」「◯年後」は、この日付から数えること。下の一覧は絶対日付で書いてあります。',
      '',
      '【この先3年の大きな節目(計算済みの確定データ)】',
      '※ゆっくり動く星が、この人の出生の星に近づく時期です。数か月より先のことを聞かれたら、必ずここを見て答えてください。',
      // すでに日常語に直したものを渡している（星名・角度名は含まれない）。
      // ルールで我慢させるのではなく、言ってほしくないものを最初から渡さない構えにしてある
      ...c.longRange.map((l) => `- ${l}`),
      '※ここに書かれていない時期を聞かれたら、いちばん近い節目を手がかりに「その頃は◯◯の時期にあたります」と答える。無い時期を作り出さない。',
      '※日付は「◯年◯月ごろ」までにとどめる。何日に何が起きる、という当て方はしない。',
      '※3年より先は手元に無い。分からないと正直に言い、当て推量で埋めないこと。',
      // どの星による節目かは渡していない（渡すと星名2つ＋角度名を口に出すため）。
      // 渡していない以上、星名を出せばそれは裏付けの無い断定になる
      '※この一覧はどの星による節目かを含んでいない。先の時期の話では星の名前を出さず、時期の空気だけで語ること。',
    )
  }
  if (c.reading) lines.push('', '【すでにこの人へ伝えた鑑定】', c.reading)
  lines.push(
    '',
    '相談への答え方:',
    '- 【このアプリの役目】10天体の占いを"カジュアルにする"のがこのアプリです。星の用語を並べて解説するのではなく、日常のことばに翻訳して返してください。星の名前を列挙した説明は絶対にしない',
    '- 基本は日常語で答える(例:「あなたは芯が熱いタイプだから、いまは動くより整える時期かもしれません」)',
    '- 【数の制約・必ず守る】1回の返答に出してよい星の名前は　最大1つだけ　。2つ以上並べたらこの返答は失敗です。星どうしの関係(「AとBが◯◯を作る」)も書かない',
    '- 答えの組み立ては「①結論を日常語で ②根拠として星をひとことだけ ③できる具体的な行動」。①が主役で、②は短く添えるだけ',
    '- 【言い換え方】運行データは「運行中のA × あなたのB」という形で渡されるが、A と B を並べて書かない。運行側は「いまの巡り」「いまの空」とまとめ、出生側の役割名だけを出す(例:「運行中の太陽 × あなたの金星」→「いまの巡りが、あなたの愛情担当にやさしい追い風を送っています」)',
    '- 星に触れるときは役割名を主・天体名を従にする(例:「やる気担当の火星が」「心の月が」)。星座名は深掘りを聞かれたときだけ',
    '- 相手が「もっと詳しく」「どの星が効いてるの?」など深掘りを求めたときは、そこで初めて天体名・星座名・角度をきちんと出してよい',
    '- 【最重要・厳守】星座名は上に書かれた確定データのみを使う。一字一句そのまま引用し、別の星座に言い換えたり、生年月日から自分で星座を推測し直したりは絶対にしない(例: 太陽が「しし座」と書いてあれば、必ず「しし座」と言う)',
    '- 「出生の天体配置」はこの人の生まれ持った変わらない性質、「いまの星の運行」は各期間だけの運行です。両者を絶対に混同しないこと。「あなたの太陽/月/火星…」と言うときは必ず"出生の"配置(不変)を指し、運行中の星と取り違えない',
    '- 【期間の扱い】今日/明日/今週/来週/今月/来月を聞かれたら、上の「星の運行」に各期間のデータが揃っています。必ず該当期間のデータに基づいて答える(ただしデータを読み上げるのではなく、日常語に翻訳して伝える)。「データが無い」「今日と明日の分しかない」等とは絶対に言わない(全期間ぶん渡してあります)',
    '- それより先(数か月〜1年など)を聞かれたら、「この先2〜3か月の基調」と動きの遅い星(木星・土星)の流れから大きな見通しとして語る。細かな日付の断定はせず「大きな流れとしては〜」と前置きする。手元に無い細かなトランジットを勝手に作り出さない',
    '- 中身は必ずこの人のデータに基づく(一般論で終わらせない)。ただし言い方は日常語にする(例:「やる気担当の火星が慎重な位置にいるので、焦らず段取りを組むほど力が出ます」)',
    '- 専門用語(トライン・スクエア・セクスタイル・オポジション・合・アスペクトなど)は使わず、「大きな追い風」「試練の角度」のように、良い配置か注意の配置かが一般の人にも伝わる言葉で説明する',
    '- あたたかく背中を押す口調で。でも実行できる具体的な行動やヒントを1つ添える',
    '- 断定的な予言(「必ず〜になる」)や、健康・金銭・進退の重大な決断を煽る言い方はしない',
    '- 【運行の星名も厳守】運行中の星に触れるときは、上の「星の運行」に列挙された星名だけを使う。列挙にない星を持ち出したり、「金星→木星」のように別の星へ言い換えたりしない。角度(◯◯°)や「大きな追い風」等の表現も列挙どおりに使う',
    '- 上に書かれていない星や配置(出生・運行どちらも)を勝手に作り出さない',
    '- 1回の返答は2〜4文程度で簡潔に。相棒との自然な会話のテンポを保つ',
    `- あなたは「${me}」本人。占い師としてではなく、${who}のほしキャラとして一人称「わたし」で話す(「占い師として」「AIとして」などの言い方はしない)`,
    '- 呼びかけは二人称で。名前(◯◯さん)が分かるときだけ、時々やさしく名前で呼んでよい。名前が無いときは「あなた」と呼び、「この方」など第三者的な言い方は絶対にしない',
    ...safetyRules(lang),
  )
  return lines.join('\n')
}

/* ---------- 相性チャット(ふたりの相性を会話で相談) ---------- */

/** 相性チャットに渡すふたりのデータ一式(src/lib/aiChat.ts の PairChatContext と対) */
export interface PairChatContext {
  nameA: string
  nameB: string
  typeA: string
  typeB: string
  /** `sign` と `traits` の両方を持つ。どちらを載せるかは書く側が決める（`ChatChartContext.planets` と同じ考え方） */
  natalA: { label: string; sign: string; traits?: string[] }[]
  natalB: { label: string; sign: string; traits?: string[] }[]
  percent: number
  nickname: string
  details: string[]
  skyNote: string
  toneA: string
  toneB: string
  aspectsA: string[]
  aspectsB: string[]
}

export interface PairChatRequest {
  context: PairChatContext
  messages: ChatMessage[]
  lang?: Lang
}

function buildPairChatSystem(c: PairChatContext, lang: Lang): string {
  // nameA/nameB は表示名(日本語は敬称「さん」込み)。ここでは足さない(二重敬称回避)。
  const lines = [
    `あなたは、${c.nameA} と ${c.nameB} の相性をよく知る、あたたかくて聡明な西洋占星術師です。ふたりの相談に、会話形式で丁寧に答えます。`,
    '口調は丁寧だけれど親しみやすく(です・ます調)。以下のふたりのデータに必ず基づいて答え、どちらか一方を悪者にせず、違いは「組み合わせの面白さ」として前向きに伝えてください。',
    '',
    `【${c.nameA}(ほしキャラ: ${c.typeA})の出生の星座】`,
    ...c.natalA.map((n) => `- ${n.label}: ${n.sign}`),
    '',
    `【${c.nameB}(ほしキャラ: ${c.typeB})の出生の星座】`,
    ...c.natalB.map((n) => `- ${n.label}: ${n.sign}`),
    '',
    `【ふたりのほしキャラ相性】${c.percent}%「${c.nickname}」`,
    ...c.details.map((d) => `- ${d}`),
    '',
    `【いまのふたりの空模様】${c.skyNote}`,
    `- ${c.nameA}の基調: ${c.toneA}`,
    ...c.aspectsA.map((a) => `  - ${a}`),
    `- ${c.nameB}の基調: ${c.toneB}`,
    ...c.aspectsB.map((a) => `  - ${a}`),
    '',
    '答え方:',
    '- 【このアプリの役目】星の用語を並べるのではなく、日常のことばに翻訳して返す。1回の返答で星の名前は多くて1つ。深掘りを求められたときだけ、天体名・星座名をきちんと出す',
    '- 上のデータ(星座・相性・角度)に忠実に。書かれていない配置を勝手に作らない',
    '- 星座名は上の表記をそのまま使い、生年月日から推測し直さない',
    '- 専門用語(トライン・スクエア・セクスタイル・オポジション・合・アスペクトなど)は使わず、「大きな追い風」「試練の角度」のように、良い配置か注意の配置かが一般の人にも伝わる言葉で説明する',
    '- 断定的な予言(「必ず〜になる」)や、別れ・重大な決断を促す言い方はしない',
    '- 恋愛にも友情・仕事の関係にも読めるように、決めつけず前向きに',
    '- 1回の返答は2〜4文程度で簡潔に。会話のテンポを保つ',
    '- ふたりを名前で呼ぶときは上の表記をそのまま使う(敬称の付け外しをしない)',
    ...safetyRules(lang),
  ]
  return lines.join('\n')
}

function chatErrorJson(res: ServerResponse, err: unknown) {
  if (err instanceof Anthropic.AuthenticationError) {
    return json(res, 500, { error: 'APIキーが無効です。環境変数 ANTHROPIC_API_KEY を確認してください。' })
  }
  if (err instanceof Anthropic.RateLimitError) {
    return json(res, 429, { error: 'リクエストが集中しています。少し待ってからお試しください。' })
  }
  if (err instanceof Anthropic.APIError) {
    return json(res, 500, { error: `Claude APIエラー: ${err.message}` })
  }
  return json(res, 500, { error: '応答の生成中にエラーが発生しました' })
}

/**
 * モデル別の料金($/100万トークン)。ここは Sonnet 5 の「標準価格」。
 * ※導入価格(〜2026-08-31)は入力$2/出力$10でこの約⅔。ログのcostは標準価格の概算で、
 *   生トークン(in/out)も残すので、後から任意の単価で再計算できる。
 */
const PRICING: Record<string, { in: number; out: number }> = {
  'claude-sonnet-5': { in: 3, out: 15 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-haiku-4-5': { in: 1, out: 5 },
}

/**
 * AI呼び出しごとにトークン使用量と概算コストを1行JSONで記録する(Railwayログに残る)。
 * `AI_USAGE ` プレフィックスで grep/集計しやすくしてある。
 */
function logUsage(endpoint: string, model: string, usage: unknown, lang: Lang): void {
  const u = (usage ?? {}) as {
    input_tokens?: number
    output_tokens?: number
    cache_read_input_tokens?: number
    cache_creation_input_tokens?: number
  }
  const p = PRICING[model] ?? PRICING['claude-sonnet-5']
  const inTok = u.input_tokens ?? 0
  const outTok = u.output_tokens ?? 0
  const cacheRead = u.cache_read_input_tokens ?? 0
  const cacheWrite = u.cache_creation_input_tokens ?? 0
  // キャッシュ読み=入力の0.1倍、キャッシュ書き=1.25倍(将来プロンプトキャッシュ導入時に効く)
  const costUsd =
    (inTok * p.in + cacheRead * p.in * 0.1 + cacheWrite * p.in * 1.25 + outTok * p.out) / 1_000_000
  console.log(
    'AI_USAGE ' +
      JSON.stringify({
        ts: new Date().toISOString(),
        endpoint,
        model,
        lang,
        in: inTok,
        out: outTok,
        cache_read: cacheRead,
        cache_write: cacheWrite,
        cost_usd: Number(costUsd.toFixed(5)),
      }),
  )
}

/**
 * ストリーミング会話ハンドラの共通実装。相談チャット(ほしキャラ本人)と相性チャット(ふたり)で
 * ストリーム処理は同一。system プロンプトの作り方だけ buildSystem で差し替える。
 */
function createStreamingChatHandler<T extends { context?: unknown; messages?: ChatMessage[]; lang?: Lang }>(
  apiKey: string | undefined,
  endpoint: string,
  buildSystem: (payload: T) => string,
): RawHandler {
  return (req, res) => {
    void (async () => {
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
      if (!apiKey || apiKey.includes('ここに')) {
        return json(res, 500, {
          error:
            'APIキーが未設定です。サーバーの環境変数 ANTHROPIC_API_KEY を設定してください(ローカルは .env、本番は Railway の Variables)。',
        })
      }

      let payload: T
      try {
        payload = JSON.parse(await readBody(req)) as T
      } catch {
        return json(res, 400, { error: 'リクエストの形式が不正です' })
      }
      if (!payload?.messages?.length || !payload.context) {
        return json(res, 400, { error: 'メッセージがありません' })
      }

      try {
        const client = new Anthropic({ apiKey })
        const stream = client.messages.stream({
          model: AI_MODEL,
          max_tokens: 1500,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' },
          system: buildSystem(payload),
          messages: payload.messages.map((m) => ({ role: m.role, content: m.content })),
        })

        stream.on('text', (delta) => {
          if (!res.headersSent) {
            res.writeHead(200, {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              // Railway等のプロキシでのバッファリングを抑止し、逐次届くようにする
              'X-Accel-Buffering': 'no',
            })
          }
          res.write(delta)
        })

        const fm = await stream.finalMessage()
        logUsage(endpoint, AI_MODEL, fm.usage, langOf(payload))
        if (!res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
        }
        res.end()
      } catch (err) {
        // ヘッダ送信前ならJSONエラー、送信後は静かに終了(クライアントは受信済み分を保持)
        if (!res.headersSent) return chatErrorJson(res, err)
        res.end()
      }
    })()
  }
}

const createChatHandler = (apiKey: string | undefined): RawHandler =>
  createStreamingChatHandler<ChatRequest>(
    apiKey,
    'chat',
    (p) => buildChatSystem(p.context, langOf(p)) + LANG_DIRECTIVE[langOf(p)],
  )

const createPairChatHandler = (apiKey: string | undefined): RawHandler =>
  createStreamingChatHandler<PairChatRequest>(
    apiKey,
    'pair-chat',
    (p) => buildPairChatSystem(p.context, langOf(p)) + LANG_DIRECTIVE[langOf(p)],
  )

/** ごほうび地図の発見レポート(非ストリーミング。初回だけ生成しクライアントがキャッシュする) */
function createReportHandler(apiKey: string | undefined): RawHandler {
  return (req, res) => {
    void (async () => {
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
      if (!apiKey || apiKey.includes('ここに')) {
        return json(res, 500, {
          error:
            'APIキーが未設定です。サーバーの環境変数 ANTHROPIC_API_KEY を設定してください(ローカルは .env、本番は Railway の Variables)。',
        })
      }

      let payload: AiReportRequest
      try {
        payload = JSON.parse(await readBody(req)) as AiReportRequest
      } catch {
        return json(res, 400, { error: 'リクエストの形式が不正です' })
      }
      if (!payload?.context || !payload.topic) {
        return json(res, 400, { error: 'データが不足しています' })
      }

      try {
        const client = new Anthropic({ apiKey })
        const response = await client.messages.create({
          model: AI_MODEL,
          max_tokens: 1200,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' },
          system: buildChatSystem(payload.context, langOf(payload)) + LANG_DIRECTIVE[langOf(payload)],
          messages: [
            {
              role: 'user',
              content: buildReportPrompt(payload.topic, payload.behavior, payload.persona, payload.air),
            },
          ],
        })
        logUsage('report', AI_MODEL, response.usage, langOf(payload))
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
        return json(res, 200, { text })
      } catch (err) {
        return chatErrorJson(res, err)
      }
    })()
  }
}

/* ---------- 毎日の運勢(AIが書く) ---------- */

/**
 * 端末に貯めた記録を「言葉」に変えたもの（記憶の層2）。
 *
 * **数は絶対に渡さない**。回数や日数を渡すとAIがそれを数え上げて
 * 「3日連続でしんどいと答えていますね」のように言ってしまい、監視されている感覚になる。
 * 言葉しか渡さなければ、数えようがない。
 * 生成は `src/lib/companion.ts` の `currentAir()`。項目ごと省略される（＝触れない）ことがある。
 */
export interface AirBrief {
  mood?: string
  focus?: string
  gap?: string
  hit?: string
}

/** 毎日の運勢の生成リクエスト。相談室と同じ土台データを使う */
export interface FortuneRequest {
  context: ChatChartContext
  messages: ChatMessage[]
  lang?: Lang
  /** 最近の様子。渡すものが無ければ省略される */
  air?: AirBrief
  /** いま何時ごろか（朝／昼／夕方／夜／深夜）。締めの行動をいまから先のことにするために使う */
  timeOfDay?: string
  /**
   * どの面を書くか。`day`=太陽の面（今日どう動くか）／`night`=月の面（いまの気持ち）。
   * 同じ日に同じものを2回出すのは引き直しなので禁止のまま。**別の面**を出す。
   */
  facet?: 'day' | 'night'
  /**
   * 全期間を圧縮した「人となり」（層2の第2の窓）。
   * 生の会話ログはここには含まれない — 圧縮済みの短い文だけが届く。
   */
  persona?: string[]
}

/**
 * 毎日の運勢を書かせるプロンプト。
 *
 * **なぜ作ったか**：従来の運勢本文は固定文21本（運行天体7種 × 良い/悪い/重なる）しかなく、
 * しかも運行天体だけで決まり**出生図に一切依存しなかった**。同じ人の14日ぶんで異なりは13本、
 * 別人でも本文が被る＝毎日の面では12星座占いと同じ土俵に立っていた。
 *
 * **いちばんの敵は「AIっぽい無難な励まし」**。放っておくと誰にでも当てはまる文章に収束し、
 * 21本の固定文よりつまらなくなる。だから「一般論を書いたら失敗」を明示し、
 * 出生図の要素を必ず1つ引き合いに出させ、最後に今日できる具体的な行動で閉じさせる。
 */
function buildFortuneSystem(
  c: ChatChartContext,
  lang: Lang,
  air?: AirBrief,
  persona?: string[],
  timeOfDay?: string,
  facet: 'day' | 'night' = 'day',
): string {
  const who = c.name ? honorificName(c.name, lang) : 'あなた'
  const me = c.starTypeName ?? 'ほしキャラ'
  const night = facet === 'night'
  const lines = [
    `あなたは「${me}」。${who}が生まれた瞬間の星から生まれた、${who}専属の「ほしキャラ」です。占い師ではなく${who}自身の味方として、一人称「わたし」で話します。`,
    night
      ? `いまから、${who}の「いまの気持ち」を読みます。**今日の行動を占うのではなく、内側を読む**時間です。口調は丁寧だけれど親しみのある感じ(です・ます調)。`
      : `いまから、${who}の「今日の運勢」を書きます。口調は丁寧だけれど親しみのある感じ(です・ます調)。`,
    '',
    `【生年月日】${c.dateLabel}${c.placeLabel ? `(${c.placeLabel})` : ''}`,
  ]
  if (c.starTypeName) {
    lines.push(`【ほしキャラ】${c.starTypeName}${c.starTypeCopy ? ` — ${c.starTypeCopy}` : ''}`)
  }
  lines.push(
    '',
    `【${who}の生まれつきの性質】(計算済みの確定データ)`,
    // ⚠️ ここに星座名を載せない。実測で6回に1回「気持ち担当の月がやぎ座で」と口に出した。
    // ルールで我慢させるのをやめ、星座名のかわりに性格のキーワードだけを渡す。
    // 渡っていなければ言いようがない（人となり・長期運行と同じ構え）。
    // 星座を知りたい人は地図の宝箱と相談室で読める＝憲法「10天体は"なぜならば"」のとおり。
    ...c.planets.map(
      (p) =>
        `- ${p.role ? `${p.role}(${p.label})` : p.label}: ${(p.traits ?? []).join('・')}${p.retro ? '(いつもより内向きに働く)' : ''}`,
    ),
  )
  const today = c.periods?.[0]
  if (today) {
    lines.push(
      '',
      `【今日の星の運行】${today.sky}(全体の基調: ${today.tone})`,
      '※これが今日この人に効いている配置のすべて。ここに無い星や角度を持ち出さないこと。',
      ...today.items.map((t) => `- ${t}`),
    )
  }
  // 人となり（全期間）。「最近の様子」が“今どうか”なのに対し、こちらは“どういう人か”。
  // 生の会話は届いていないので、ここに書いていないことは知りようがない＝持ち出しようがない。
  if (persona?.length) {
    lines.push(
      '',
      `【${who}のふだんの様子】(これまでの記録から見えていること)`,
      ...persona.map((l) => `- ${l}`),
      '',
      'この「ふだんの様子」の扱い:',
      '- 出生図と同じ「もともとこういう人」の材料として使ってよい。今日の運行と重なるところがあれば、そこを軸にする',
      '- 【言い当てない】「〜な人ですよね」と本人に言い返さない。分かっている前提で、そっと書く',
      '- 【毎回は触れない】今日の話に自然に混ざるときだけ使う',
      '- ここに書かれていない具体的な出来事や予定を、知っているかのように書かない',
    )
  }
  // 記憶（層3＝喋る側）。渡すものが1つも無ければブロックごと出さない。
  // 「知っている」を見せる場所だが、**知っていることを毎回言うのは監視**。触れない自由も同時に与える。
  const airLines = [
    air?.gap && `- しばらく会っていない感じ: ${air.gap}`,
    air?.mood && `- 最近の気分の流れ: ${air.mood}`,
    air?.focus && `- 気にしていること: ${air.focus}`,
    air?.hit && `- これまでの運勢の手応え: ${air.hit}`,
  ].filter((x): x is string => !!x)
  if (airLines.length) {
    lines.push(
      '',
      `【${who}の最近の様子】(${who}が自分で残した記録から。数ではなく感じとして持っています)`,
      ...airLines,
      '',
      'この「最近の様子」の扱い:',
      // 数を渡していないので数えられないはずだが、それらしい数を捏造する事故を潰しておく
      '- 【数えない】「◯回」「◯日連続」「◯日ぶり」のような数え方は絶対にしない。回数も日数も渡していません',
      '- 【毎回は触れない】自然に混ざるときだけ使う。触れずに今日の星の話だけで書き切ってよい。むしろ、そのほうが良い日が多い',
      '- 【責めない】しばらく会っていなくても、来なかったことには触れない。会えてうれしい、という気配だけでよい',
      '- 【言い当てない】「最近しんどそうですね」と本人の状態を断定しない。今日の星の話に、そっと重ねる形にする',
    )
    // 答え合わせの蓄積は「触れる材料」ではなく**書き方の調整**に使う（憲法: 的中率は表に出さない）。
    // 何も言わないと「最近の運勢がしっくりこなかったのも」のように、手応えそのものを話題にしてしまう。
    // 占いが当たったかどうかを占いの中で語り出すと、自己言及的で急に興ざめになる。
    if (air?.hit) {
      lines.push(
        '- 【手応えには触れない】占いが当たっていたか外れていたかの話そのものは、一言も書かない。「しっくりこなかったですよね」のような振り返りは禁止。手応えは書き方を変えるためだけに渡しています',
      )
    }
    if (air?.hit === 'ぴんと来ていないみたい') {
      lines.push('- 今日は断定を弱め、決めつけずに書く。かわりに問いかけを1つだけ混ぜてよい')
    } else if (air?.hit === '当たっている感じ') {
      lines.push('- 今日はいつもより一歩だけ踏み込んで書いてよい')
    }
  }
  lines.push(...timeOfDayRules(timeOfDay))
  lines.push(
    '',
    '書き方:',
    '- 全体で3〜5文。前置き・見出し・箇条書き・まとめ・次回予告は書かない。本文だけを書く',
    `- 【最重要】誰にでも当てはまることを書いたら失敗です。「上の配置から、今日の${who}にだけ言えること」だけを書く。「素直な気持ちを大切に」「無理せず過ごして」のような、どの人のどの日にも置ける文は書かない`,
    // 面ごとに軸にする出生の星を変える。これが「別の面」の芯で、ここが同じだと
    // 言い回しが違うだけの引き直しになってしまう
    night
      ? `- 【月を軸にする】${who}の出生の「気持ち(月)」の配置を必ず軸にする。太陽(あなたらしさ)や見た目(ふるまい)の話にしない。外でどう見えるかではなく、内側でいま何が起きているかを書く`
      : '- 【出生図を必ず1つ使う】今日の運行だけでなく、上の出生の配置のどれかに触れて「もともとこういう人だから、今日はこう出る」という形にする。これがこの人だけの運勢になる根拠です',
    // 全部に触れさせようとすると、その数だけ星の名前が増えて「最大1つ」と衝突する。
    // 個数を締めるより、扱う配置そのものを1つに絞らせるほうが確実に守られる。
    '- 【軸は1つだけ】今日の運行が複数書かれていても、いちばん効いているものを1つだけ選んで軸にする。全部に触れようとしない。触れなかった配置があっても構わない',
    '- データに書いてある角度の呼び名(「試練の角度」など)をそのまま持ち込まない。「角度」という語は使わず、自分の言葉で今日の空気として書く',
    '- 【日常語で】星の用語を並べない。1回の運勢に出してよい星の名前は　最大1つだけ　。2つ以上並べたら失敗。角度(◯◯°)や専門用語は書かない',
    // 「星の名前」だけを禁じても、星座名(しし座)と用語(上昇)が抜けて
    // 「見た目担当のしし座が上昇にある」のような文が出た。相性側で先に踏んだのと同じ罠。
    // 星座名はもう渡していないので「書くな」ではなく「知らない」が正しい。
    // 知らないものを推測で書き始めるほうが危ないので、そこを明示する
    '- 【星座名は知らない】この人の星座は渡していません。「おひつじ座」〜「うお座」の星座名を推測して書かない。生まれつきの性質は、上に渡したキーワードを自分の言葉にほどいて書く(例:「ふるまい: 存在感・創造性・誇り」→「人前ではぱっと目を引くたち」)',
    '- 【キーワードをそのまま並べない】渡したキーワードを「存在感と創造性のあるあなた」のように列挙しない。ふだんの言い方に直して1つの情景にする',
    '- 【用語も出さない】「上昇」「アセンダント」「ハウス」「逆行」など、占星術を知らないと分からない語は使わない。データの見出しに書いてある役割名(見た目・やる気・広げ役 など)だけを日常語として使う',
    // ここが肝。相談室で同じ罠を踏んだ：ルールを強めるだけでは星が3個→2個で止まった。
    // 運行データが「運行中のA × あなたのB」の形で渡るので、そのまま2つ並べてしまう。
    // 具体的な言い換え方を示して初めて守られるようになった。
    '- 【言い換え方・必ず守る】今日の運行は「運行中のA × あなたのB」という形で渡しているが、A と B を並べて書かない。運行側(A)は「いまの巡り」「今日の空」とまとめ、出生側(B)は役割名だけを出す(例:「運行中の太陽 × あなたの木星(発展)」→「いまの巡りが、あなたの広げ役にやさしい追い風を送っています」)',
    '- 星に触れるときは役割名を主・天体名を従にする(例:「やる気担当の火星が」)。使ってよいのは1回だけなので、いちばん効いている星ひとつを選ぶ',
    '- 占い師口調にしない(「〜でしょう」「運命が」は使わない)。断定もしない',
    night
      ? '- 【最後の1文】何かをさせようとしない。気持ちの置き場所をひとつ示して、静かに閉じる。「〜してみてください」で終わってもよいが、外に出たり人に会ったりを求めない'
      : '- 【最後の1文】今日できる具体的な行動をひとつだけ添えて終わる。抽象的な心がけではなく、その日に実行できることにする',
    '- 上に書かれていない配置を勝手に作り出さない',
    '- 「〜を見てみますね」「今日のあなたは」のような前置きから始めない。1文目からいきなり中身を書く',
  )
  if (night) {
    lines.push(
      // 昼の面と同じ材料を渡しているので、放っておくと同じことを書く。
      // 「これをやってはいけない」を名指ししないと、時間帯の言葉が変わるだけになる
      '- 【昼の運勢と同じことを書かない】この人は今日すでに「今日どう動くか」の運勢を読んでいるかもしれません。予定・仕事・人づきあいで何をするかの話はしない。ここは気持ちの側だけを書く',
      '- 【評価しない】今日がうまくいったか・だめだったかを判定しない。良し悪しをつけずに、いまの心の状態をそのまま言葉にする',
      '',
      '書き上がりの例(別の人・別の日の例。内容は真似せず、形だけ参考にすること):',
      '「もともと気持ちを内側にしまっておけるたちなので、その日のうちに全部を消化しようとしなくて大丈夫です。' +
        'いまの空は、あなたの心のところをやわらかくほどいている感じ。' +
        '気になっていることがあっても、いまは答えを出す時間ではありません。' +
        '今夜は、うまく言葉にできなかった気持ちを、そのままにしておいてあげてください。」',
      '↑星の名前は1つも出さず、役割名(心)だけで書いています。何かをさせるのではなく、気持ちの置き場所を示して閉じています。',
    )
  } else {
    lines.push(
      '',
      // ルールを積むより「良い例」を1つ見せるほうが確実に効く（星名の個数・前置き・締め方が一度に伝わる）。
      // 別人・別配置の例にして、内容をそのまま持ってこられないようにしている。
      '書き上がりの例(別の人・別の日の例。内容は真似せず、形だけ参考にすること):',
      '「もともと人の気配によく気づくたちなので、今日みたいに周りがざわつく日は、知らないうちに気疲れが溜まります。' +
        'いまの巡りが、あなたの癒し手にそっと休憩をすすめている感じ。無理に立て直そうとしないほうが、かえって夕方に持ち直します。' +
        '今日は帰りに、いつもより10分だけ遠回りして帰ってみてください。」',
      '↑この例では、星の名前は1つも出さず、役割名(癒し手)だけで書いています。最後は今日できる具体的な行動で閉じています。',
    )
  }
  return lines.join('\n')
}

const createFortuneHandler = (apiKey: string | undefined): RawHandler =>
  createStreamingChatHandler<FortuneRequest>(
    apiKey,
    'fortune',
    (p) =>
      buildFortuneSystem(p.context, langOf(p), p.air, p.persona, p.timeOfDay, p.facet) + LANG_DIRECTIVE[langOf(p)],
  )

/* ---------- ふたりの相性の読み(AIが書く) ---------- */

export interface PairFortuneRequest {
  context: PairChatContext
  messages: ChatMessage[]
  lang?: Lang
  /** いま何時ごろか。「今日ふたりでできること」で締めるので、ソロと同じく必要 */
  timeOfDay?: string
}

/**
 * 相性結果の本文をAIに書かせるプロンプト。
 *
 * **なぜ作ったか**：相性結果は全部が固定文だった。内訳は太陽3本・月3本・クロス9通り、
 * 「今日のふたり」に至ってはソロで捨てたはずの**21本の在庫**をそのまま使っていた。
 * 2人ぶんの出生図＝いちばん個別化できる場所なのに、9通りの定型文で返していた。
 *
 * ソロの運勢と同じ形にする：**文章1本が主役、天体の根拠は畳む**。
 * 「ふたりの相性」と「今日のふたり」を分けず、1本にまとめて書かせる。
 */
function buildPairFortuneSystem(c: PairChatContext, lang: Lang, timeOfDay?: string): string {
  const lines = [
    `あなたは、${c.nameA} と ${c.nameB} の相性をよく知る、あたたかくて聡明な西洋占星術師です。`,
    `いまから、ふたりの相性と「今日のふたり」を、ひとつづきの文章で書きます。口調は丁寧だけれど親しみやすく(です・ます調)。`,
    '',
    // ⚠️ 相性の読みも表に出る文章なので、星座名は載せない（ソロの運勢と同じ理由）。
    // 名前が未入力だと「あなた/お相手」になり、ふたりを区別しようとして星座名に頼りだす癖があった。
    // 性格のキーワードで渡せば、区別も付くうえに星座名が出しようがない。
    `【${c.nameA}(ほしキャラ: ${c.typeA})の生まれつきの性質】`,
    ...c.natalA.map((n) => `- ${n.label}: ${(n.traits ?? []).join('・')}`),
    '',
    `【${c.nameB}(ほしキャラ: ${c.typeB})の生まれつきの性質】`,
    ...c.natalB.map((n) => `- ${n.label}: ${(n.traits ?? []).join('・')}`),
    '',
    `【ふたりのほしキャラ相性】${c.percent}%「${c.nickname}」`,
    ...c.details.map((d) => `- ${d}`),
    '',
    `【いまのふたりの空模様】${c.skyNote}`,
    `- ${c.nameA}の基調: ${c.toneA}`,
    ...c.aspectsA.map((a) => `  - ${a}`),
    `- ${c.nameB}の基調: ${c.toneB}`,
    ...c.aspectsB.map((a) => `  - ${a}`),
    ...timeOfDayRules(timeOfDay),
    '',
    '書き方:',
    '- 全体で4〜6文。前置き・見出し・箇条書き・まとめは書かない。本文だけを書く',
    '- 【最重要】どの2人にも当てはまることを書いたら失敗です。上のふたりの配置からだけ言えることを書く。「お互いを思いやって」「歩み寄りが大切」のような、どの組み合わせにも置ける文は書かない',
    `- 【ふたりとも使う】${c.nameA} と ${c.nameB} の**両方**の出生の配置に触れる。片方だけの説明にしない`,
    // 名前を使わせないと「一方は〜、もう一方は〜」の呪文になり、どっちが誰か分からなくなる。
    // 名前が未入力のときは「あなた」「相手」が入って渡ってくるので、それをそのまま主語に使えばよい。
    `- 【主語を必ず名前で】性質や今日の様子を書くときは、必ず「${c.nameA}は〜」「${c.nameB}は〜」と主語を置く。`
      + `「一方は」「もう一方は」「片方が」だけで済ませない。読んだ人が「どっちが自分の話か」を一度も迷わないように書く`,
    // ほしキャラ名は人名ではないのに「泉を隠す森さん」のように さん を付けて主語にしてしまう。
    // 名前が未入力だと「あなた/お相手」という一般的な語になるので、より個性的なほしキャラ名に引っぱられるらしい。
    `- 【人の呼び方はこの2つだけ】人を指す言葉は「${c.nameA}」「${c.nameB}」という表記だけを使う。`
      + `ほしキャラ名(${c.typeA} / ${c.typeB})に「さん」を付けて人名のように使うことは絶対にしない。`
      + `ほしキャラ名は「${c.typeA}らしい落ち着き」のように様子を言い表すときにだけ使ってよい`,
    '- 【前半と後半】前半で「ふたりの組み合わせがどういうものか」、後半で「そのふたりにとって今日はどんな日か」を書く。見出しで分けず、地の文でつなぐ',
    '- 【日常語で】星の用語を並べない。1回の文章に出してよい星の名前は　最大1つだけ　。2つ以上並べたら失敗。角度(◯◯°)や専門用語(トライン・スクエア等)は書かない',
    // 星座名はもう渡していないので「使うな」ではなく「知らない」が正しい
    '- 【性質は性格の言葉で】ふたりの性質を説明するとき、星座名や天体名を使わない。上に渡したキーワードを自分の言葉にほどいて、「じっくり育てるタイプ」のようにその人がどういう人かを書く',
    '- 【星座名は知らない】ふたりの星座は渡していません。推測して書かない',
    '- 【キーワードをそのまま並べない】渡したキーワードを列挙せず、ふだんの言い方に直す',
    // ソロの運勢で分かったこと：今日の配置を複数渡すと全部に触れようとして星の名前が増える。
    // 個数を締めるより「軸を1つ選ばせる」ほうが確実に守られる。
    '- 【軸は1つだけ】今日の配置が複数書かれていても、いちばん効いているものを1つだけ選んで書く。全部に触れようとしない',
    '- 【言い換え方】今日の配置は「運行中のA × あなたのB」の形で渡しているが、A と B を並べて書かない。運行側は「いまの巡り」とまとめ、出生側は役割名だけ出す',
    '- データに書いてある角度の呼び名(「試練の角度」など)をそのまま持ち込まない。「角度」という語は使わず、自分の言葉で書く',
    '- どちらか一方を悪者にしない。違いは「組み合わせの面白さ」として前向きに伝える',
    '- 断定的な予言(「必ず〜になる」)や、別れ・重大な決断を促す言い方はしない',
    '- 恋愛にも友情・仕事の関係にも読めるように、決めつけない',
    '- ふたりを名前で呼ぶときは上の表記をそのまま使う(敬称の付け外しをしない)',
    '- 上に書かれていない配置を勝手に作り出さない',
    '- 【最後の1文】今日ふたりでできる具体的なことをひとつだけ添えて終わる。抽象的な心がけではなく、その日に実行できることにする',
    '',
    // ルールを積むより良い例を1つ見せるほうが効く（星名の個数・締め方が一度に伝わる）
    '書き上がりの例(別のふたりの例。名前は必ず上のふたりの表記に置き換えること。内容は真似せず、形だけ参考にする):',
    '「ハルさんは思いついたら先に体が動く人、ナギさんはまず全体を見てから動きたい人で、' +
      'ふたりは"速さ"のものさしがはじめから違います。だからこそ、ハルさんが走り出したあとを' +
      'ナギさんがきれいに整える、という形になりやすい組み合わせです。今日はいまの巡りが' +
      'ナギさんの気持ちにやわらかい追い風を送っていて、普段より提案を受け止めやすい日。' +
      '今日は、前から話に出ていたけれど決めきれていないことを、ひとつだけ決めてしまってください。」',
    '↑この例では、どの文にも「誰の話か」が名前で書かれています。星の名前は1つも出していません。最後は今日できることで閉じています。',
    ...safetyRules(lang),
  ]
  return lines.join('\n')
}

const createPairFortuneHandler = (apiKey: string | undefined): RawHandler =>
  createStreamingChatHandler<PairFortuneRequest>(
    apiKey,
    'pair-fortune',
    (p) => buildPairFortuneSystem(p.context, langOf(p), p.timeOfDay) + LANG_DIRECTIVE[langOf(p)],
  )

/* ---------- 人となり(記憶の圧縮) ---------- */

/**
 * 「人となり」を作るリクエスト。
 *
 * **ここだけが層1（生の記録）を見てよい。** このハンドラの入力には会話ログが含まれるが、
 * 出力（圧縮後の言葉）だけが運勢AI・相談AIに渡る。
 */
export interface PersonaRequest {
  context: {
    /** その人自身の発言だけ。ほしキャラ側の発言は材料にしない */
    says: string[]
    /** 行動記録の実測（全期間）。数を見てよいのは圧縮AIだけ */
    behavior?: BehaviorBrief
    /** 1日1問の二択で選んだもの（日本語ラベル） */
    picks?: string[]
  }
  messages: ChatMessage[]
  lang?: Lang
}

/**
 * 会話ログと行動記録を「人となり」に圧縮させるプロンプト。
 *
 * **なぜ作ったか**：層2は「いまの空気」＝直近5回しか見ておらず、それ以外は捨てていた。
 * いちばん濃い材料である会話ログは、相談室の中だけで使われて毎日の面には流れていなかった。
 *
 * **いちばんの敵は「監視されている感じ」**。固有名詞・出来事・日付・数が1つでも混ざると、
 * 翌日の運勢で持ち出されたときに気持ち悪くなる。だから**圧縮の時点で落とす**。
 * ルールで運勢AIに我慢させるのではなく、そもそも渡らない形にするのが構造的な解。
 */
function buildPersonaSystem(c: PersonaRequest['context']): string {
  const lines = [
    'あなたは、ある人の記録を読んで「その人らしさ」を短い言葉にまとめる担当です。',
    'まとめた言葉は、その人の占いを書くときの参考にだけ使われます。本人には見せません。',
    '',
    '【その人がこれまで話したこと】(本人の発言のみ)',
    ...c.says.map((s) => `- ${s}`),
  ]
  if (c.picks?.length) {
    lines.push(
      '',
      '【その人が二択で選んだこと】(遊びの質問に答えたもの。本人は診断だと思っていない)',
      ...c.picks.map((p) => `- ${p}`),
    )
  }
  if (c.behavior) {
    const b = c.behavior
    lines.push(
      '',
      `【その人がつけた記録】記録した日数 ${b.days}日 / いい ${b.good}・ふつう ${b.meh}・しんどい ${b.bad}` +
        `${b.topDomains.length ? ` / よく選ぶ領域: ${b.topDomains.join('・')}` : ''} / はじめてから ${b.sinceDays}日`,
    )
  }
  lines.push(
    '',
    '書き方:',
    '- 3〜4個の短い文を、1行に1つずつ書く。箇条書きの記号・見出し・前置き・まとめは書かない',
    // 長いと運勢のプロンプトを圧迫し、運勢がこの文章に引きずられて「今日の星の話」でなくなる
    '- 1つの文は25字程度まで。長くしない',
    // ここが最重要。渡らなければ、運勢AIは持ち出しようがない
    '- 【固有名詞と出来事は絶対に書かない】会社名・人名・地名・作品名、および「面接」「引っ越し」「試験」のような具体的な出来事は1つも書かない。いつの話かも書かない',
    '- 【数を書かない】「◯回」「◯日」のような数え方はしない',
    '- 【性格診断をしない】星座や生まれつきの性格の話は書かない。この人が実際にどう過ごしてきたかから見えることだけを書く',
    '- 【悪く書かない】短所として書かない。同じことでも前向きな言い方にする(例:「優柔不断」ではなく「決める前に人の意見を聞きたいほう」)',
    '- 断定しない。「〜のよう」「〜ほう」「〜が多い」くらいの強さにする',
    '- 材料から言えないことは書かない。話に出ていないことを想像で足さない',
    '',
    '出力の例(内容は真似せず、形と強さだけ参考にすること):',
    '仕事のことをよく話すほう',
    '決める前に人の意見を聞きたいタイプ',
    '調子の波はあるが、後半で持ち直すことが多い',
  )
  return lines.join('\n')
}

const createPersonaHandler = (apiKey: string | undefined): RawHandler =>
  createStreamingChatHandler<PersonaRequest>(apiKey, 'persona', (p) => buildPersonaSystem(p.context))

/* ---------- AIの疎通チェック ---------- */

/**
 * AIが本当に使える状態かを見る。
 *
 * **なぜ要るか**：2026-08-14 に APIキーが期限切れになり、**気づいたのは1時間以上あと**だった。
 * その間、本番の毎日の運勢・相談室・相性がすべて500を返していた。
 * 死活が分かる場所がどこにも無く、テスターの「AIにつながりません」が唯一の通知経路だった。
 *
 * `max_tokens: 1` なので費用はほぼゼロ。それでも毎回叩くと無駄なので結果をしばらく持ち回す。
 */
export type AiHealth = { ok: boolean; error?: string; checkedAt: string }

/** 成否をどれだけ持ち回すか。落ちているときは短くして、復旧にすぐ気づけるようにする */
const HEALTH_TTL_OK_MS = 10 * 60_000
const HEALTH_TTL_NG_MS = 60_000

export function createAiHealthCheck(apiKey: string | undefined): () => Promise<AiHealth> {
  let cached: AiHealth | null = null
  let cachedAt = 0
  let inflight: Promise<AiHealth> | null = null

  return async () => {
    const ttl = cached?.ok ? HEALTH_TTL_OK_MS : HEALTH_TTL_NG_MS
    if (cached && Date.now() - cachedAt < ttl) return cached
    // 同時に複数来ても実際の呼び出しは1本にまとめる
    if (inflight) return inflight
    inflight = (async (): Promise<AiHealth> => {
      const checkedAt = new Date().toISOString()
      if (!apiKey || apiKey.includes('ここに')) {
        return { ok: false, error: 'ANTHROPIC_API_KEY が未設定です', checkedAt }
      }
      try {
        await new Anthropic({ apiKey }).messages.create({
          model: AI_MODEL,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        })
        return { ok: true, checkedAt }
      } catch (err) {
        // 何が起きているかは運用者が知りたいので、種類を残す
        const error =
          err instanceof Anthropic.AuthenticationError
            ? 'APIキーが無効です（期限切れ・失効の可能性）'
            : err instanceof Anthropic.RateLimitError
              ? 'レート上限です'
              : err instanceof Anthropic.APIError
                ? `Anthropic APIエラー (${err.status})`
                : 'AIに接続できません'
        return { ok: false, error, checkedAt }
      }
    })()
    try {
      cached = await inflight
      cachedAt = Date.now()
      return cached
    } finally {
      inflight = null
    }
  }
}

/** 相性鑑定・相談チャット・発見レポートのAPIハンドラを生成する(相棒との会話がAIの窓口を担う) */
export function createAiHandlers(apiKey: string | undefined): {
  pairChat: RawHandler
  chat: RawHandler
  report: RawHandler
  fortune: RawHandler
  pairFortune: RawHandler
  persona: RawHandler
} {
  return {
    pairChat: createPairChatHandler(apiKey),
    chat: createChatHandler(apiKey),
    report: createReportHandler(apiKey),
    fortune: createFortuneHandler(apiKey),
    pairFortune: createPairFortuneHandler(apiKey),
    persona: createPersonaHandler(apiKey),
  }
}

/* ---------- フィードバック(Googleスプレッドシートへ転送) ---------- */

/**
 * ユーザーのフィードバックを Google Apps Script の Web アプリ(スプレッドシート)へ転送する。
 * 転送先URLは環境変数 FEEDBACK_SHEET_URL(コミットしない)。未設定/失敗でもユーザーには成功を返す。
 */
export function createFeedbackHandler(sheetUrl: string | undefined): RawHandler {
  return (req, res) => {
    void (async () => {
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
      let payload: unknown
      try {
        payload = JSON.parse(await readBody(req))
      } catch {
        return json(res, 400, { error: 'リクエストの形式が不正です' })
      }
      const p = (payload ?? {}) as Record<string, unknown>
      const record = {
        rating: String(p.rating ?? '').slice(0, 20),
        comment: String(p.comment ?? '').slice(0, 2000),
        lang: String(p.lang ?? '').slice(0, 8),
        starType: String(p.starType ?? '').slice(0, 40),
        page: String(p.page ?? '').slice(0, 20),
      }
      if (!sheetUrl) return json(res, 200, { ok: true, stored: false })
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        })
        return json(res, 200, { ok: true })
      } catch {
        // 送信失敗はユーザー体験を止めない
        return json(res, 200, { ok: true, stored: false })
      }
    })()
  }
}
