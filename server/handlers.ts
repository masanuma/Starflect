import type { IncomingMessage, ServerResponse } from 'node:http'
import Anthropic from '@anthropic-ai/sdk'

type Lang = 'ja' | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'ko'

/** システムプロンプト末尾に足す、応答言語の指示 */
const LANG_DIRECTIVE: Record<Lang, string> = {
  ja: '',
  en: '\n\n【CRITICAL — OUTPUT LANGUAGE】Respond ENTIRELY in natural, warm English. The chart data may contain Japanese sign/planet names — translate them to English (獅子座→Leo, 火星→Mars, 上昇星座→Rising sign, etc.). Translate the section headings to English too, keeping the 【】 bracket style.',
  es: '\n\n【CRÍTICO — IDIOMA DE SALIDA】Responde ENTERAMENTE en español natural y cálido. Los datos pueden incluir nombres de signos/planetas en japonés — tradúcelos al español (獅子座→Leo, 火星→Marte, 上昇星座→Ascendente, etc.). Traduce también los títulos de sección al español, manteniendo el estilo de corchetes 【】.',
  fr: '\n\n【CRITICAL — OUTPUT LANGUAGE】Réponds ENTIÈREMENT en français naturel et chaleureux. Les données peuvent contenir des noms de signes/planètes en japonais — traduis-les en français (獅子座→Lion, 火星→Mars, 上昇星座→Ascendant, etc.). Traduis aussi les titres de section en français, en gardant le style de crochets 【】.',
  it: '\n\n【CRITICAL — OUTPUT LANGUAGE】Rispondi INTERAMENTE in italiano naturale e caloroso. I dati possono contenere nomi di segni/pianeti in giapponese — traducili in italiano (獅子座→Leone, 火星→Marte, 上昇星座→Ascendente, ecc.). Traduci anche i titoli di sezione in italiano, mantenendo lo stile delle parentesi 【】.',
  pt: '\n\n【CRITICAL — OUTPUT LANGUAGE】Responda INTEIRAMENTE em português natural e caloroso. Os dados podem conter nomes de signos/planetas em japonês — traduza-os para o português (獅子座→Leão, 火星→Marte, 上昇星座→Ascendente, etc.). Traduza também os títulos de seção para o português, mantendo o estilo de colchetes 【】.',
  ko: '\n\n【CRITICAL — OUTPUT LANGUAGE】전적으로 자연스럽고 따뜻한 한국어로 답하세요. 데이터에 일본어 별자리/행성 이름이 있을 수 있으니 한국어로 번역하세요(獅子座→사자자리, 火星→화성, 上昇星座→상승궁 등). 섹션 제목도 한국어로 번역하되 【】 괄호 스타일은 유지하세요.',
}

const SERVER_LANGS = ['en', 'es', 'fr', 'it', 'pt', 'ko']
const langOf = (payload: unknown): Lang => {
  const l = (payload as { lang?: string })?.lang
  return l && SERVER_LANGS.includes(l) ? (l as Lang) : 'ja'
}

/** クライアントから送られてくる鑑定リクエスト(計算済みの占星術データ) */
export interface AiReadingRequest {
  name: string
  periodLabel: string
  dateLabel: string
  placeLabel?: string
  natal: { label: string; sign: string; deg: number }[]
  synthesis?: string[]
  /** 出生天体同士のアスペクト(プロ級のみ) */
  natalAspects?: string[]
  toneLabel: string
  skyNote: string
  aspects: string[]
  lang?: Lang
}

/** 相性鑑定リクエスト */
export interface AiPairRequest {
  nameA: string
  nameB: string
  typeA: string
  typeB: string
  percent: number
  nickname: string
  details: string[]
  natalA: { label: string; sign: string }[]
  natalB: { label: string; sign: string }[]
  periodLabel: string
  skyNote: string
  toneA: string
  toneB: string
  aspectsA: string[]
  aspectsB: string[]
  lang?: Lang
}

const PAIR_SYSTEM_PROMPT = `あなたは関係性・相性を専門とする経験豊富な西洋占星術師です。ふたりの出生チャートの相性と、実際の天体の運行から計算されたデータをもとに、日本語で相性鑑定を書きます。

書き方のルール:
- 明るくポップに、でも中身は具体的に。恋愛にも友情にも読める書き方にする
- 渡された相性データ・角度に忠実に。書かれていない配置を勝手に作らない
- 専門用語(トライン・スクエア・セクスタイル・オポジション・合・アスペクトなど)は使わず、「大きな追い風」「試練の角度」のように、良い配置か注意の配置かが一般の人にも伝わる言葉で説明する
- どちらか一方を悪者にしない。違いは「組み合わせの面白さ」として書く
- 断定的な予言や、別れ・重大な決断を促す表現はしない
- 構成: 「ふたりの化学反応」→「この期間のふたり」→「うまくいくヒント」の3部構成。各見出しは【】で囲む
- 全体で400〜600字程度`

const SYSTEM_PROMPT = `あなたは経験豊富な西洋占星術師です。依頼者の出生チャートと、実際の天体の運行から計算された角度をもとに、日本語で鑑定文を書きます。

書き方のルール:
- 温かく、前向きで、それでいて具体的な文章にする。占い雑誌のような紋切り型は避ける
- 渡された角度のデータに忠実に。書かれていない天体や角度を勝手に作らない
- 専門用語(トライン・スクエア・セクスタイル・オポジション・合・アスペクトなど)は使わず、「大きな追い風」「試練の角度」のように、良い配置か注意の配置かが一般の人にも伝わる言葉で説明する
- 依頼者の3天体(または太陽星座)の性格を踏まえ、「この人だからこう活きる」という形で運勢と性格を結びつける
- 断定的な予言(「必ず〜が起こる」)や、健康・金銭の重大な判断を促す表現はしない
- 構成: 「全体の流れ」→「注目のポイント」(注目の配置ごと)→「この期間のおすすめアクション」の3部構成。各見出しは【】で囲む
- 全体で400〜600字程度`

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function buildUserPrompt(r: AiReadingRequest): string {
  const who = r.name ? `${r.name}さん` : '依頼者'
  const lines = [
    `依頼者: ${who}(${r.dateLabel} 生まれ${r.placeLabel ? `・${r.placeLabel}` : ''})`,
    '',
    '■ 出生チャート',
    ...r.natal.map((n) => `- ${n.label}: ${n.sign} ${n.deg.toFixed(1)}°`),
  ]
  if (r.synthesis?.length) {
    lines.push('', '■ 3天体の総合分析(参考)', ...r.synthesis.map((s) => `- ${s}`))
  }
  if (r.natalAspects?.length) {
    lines.push('', '■ 出生チャート内のアスペクト', ...r.natalAspects.map((a) => `- ${a}`))
  }
  lines.push(
    '',
    `■ 占う期間: ${r.periodLabel}`,
    `■ 現在の空模様: ${r.skyNote}`,
    `■ 検出されたトランジットのアスペクト(基調: ${r.toneLabel})`,
    ...(r.aspects.length ? r.aspects.map((a) => `- ${a}`) : ['- 目立ったアスペクトなし(穏やかな星回り)']),
    '',
    `以上のデータをもとに、${who}の${r.periodLabel}の運勢を鑑定してください。`,
  )
  return lines.join('\n')
}

function buildPairPrompt(r: AiPairRequest): string {
  const lines = [
    `ふたり: ${r.nameA}さん × ${r.nameB}さん`,
    '',
    `■ ${r.nameA}さんのチャート(ほしキャラ: ${r.typeA})`,
    ...r.natalA.map((n) => `- ${n.label}: ${n.sign}`),
    '',
    `■ ${r.nameB}さんのチャート(ほしキャラ: ${r.typeB})`,
    ...r.natalB.map((n) => `- ${n.label}: ${n.sign}`),
    '',
    `■ ほしキャラ相性: ${r.percent}%「${r.nickname}」`,
    ...r.details.map((d) => `- ${d}`),
    '',
    `■ 占う期間: ${r.periodLabel}(${r.skyNote})`,
    `■ ${r.nameA}さんの基調: ${r.toneA}`,
    ...r.aspectsA.map((a) => `  - ${a}`),
    `■ ${r.nameB}さんの基調: ${r.toneB}`,
    ...r.aspectsB.map((a) => `  - ${a}`),
    '',
    `以上のデータをもとに、ふたりの${r.periodLabel}の相性を鑑定してください。`,
  ]
  return lines.join('\n')
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

/** 生のNode req/res で動くハンドラ。Viteのミドルウェアでも Express でも共用できる */
export type RawHandler = (req: IncomingMessage, res: ServerResponse) => void

function makeHandler<T>(
  apiKey: string | undefined,
  system: string,
  buildPrompt: (payload: T) => string,
): RawHandler {
  return (req, res) => {
    void (async () => {
      if (req.method !== 'POST') {
        return json(res, 405, { error: 'POST only' })
      }
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

      try {
        const client = new Anthropic({ apiKey })
        const response = await client.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 2000,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' },
          system: system + LANG_DIRECTIVE[langOf(payload)],
          messages: [{ role: 'user', content: buildPrompt(payload) }],
        })
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
        return json(res, 200, { text })
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) {
          return json(res, 500, { error: 'APIキーが無効です。環境変数 ANTHROPIC_API_KEY を確認してください。' })
        }
        if (err instanceof Anthropic.RateLimitError) {
          return json(res, 429, { error: 'リクエストが集中しています。少し待ってからお試しください。' })
        }
        if (err instanceof Anthropic.APIError) {
          return json(res, 500, { error: `Claude APIエラー: ${err.message}` })
        }
        return json(res, 500, { error: '鑑定の生成中にエラーが発生しました' })
      }
    })()
  }
}

/* ---------- 相談チャット(ストリーミング) ---------- */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** チャットに渡す、その人の占星術データ一式 */
export interface ChatChartContext {
  name: string
  dateLabel: string
  placeLabel?: string
  starTypeName?: string
  starTypeCopy?: string
  planets: { label: string; sign: string; deg: number; retro?: boolean }[]
  natalAspects?: string[]
  periodLabel: string
  skyNote: string
  toneLabel: string
  transits: string[]
  /** すでに生成済みのAI鑑定文があれば渡す */
  reading?: string
}

export interface ChatRequest {
  context: ChatChartContext
  messages: ChatMessage[]
  lang?: Lang
}

function buildChatSystem(c: ChatChartContext): string {
  // 名前があれば「◯◯さん」、無ければ「あなた」(「あなたさん」を避ける)
  const who = c.name ? `${c.name}さん` : 'あなた'
  const lines = [
    'あなたは、相談者に寄り添うあたたかく信頼できる占星術カウンセラーです。',
    `相談者は${who}。以下は${who}の出生チャート(生まれた瞬間の星の配置)と、いまの星の運行です。相談には必ずこのデータに基づいて、${who}だけに向けた答えを返してください。`,
    '',
    `【生年月日】${c.dateLabel}${c.placeLabel ? `(${c.placeLabel})` : ''}`,
  ]
  if (c.starTypeName) {
    lines.push(`【ほしキャラ】${c.starTypeName}${c.starTypeCopy ? ` — ${c.starTypeCopy}` : ''}`)
  }
  lines.push(
    '',
    '【出生の天体配置】(下記は計算済みの確定データ。星座名はこの通りに使うこと)',
    ...c.planets.map((p) => `- ${p.label}: ${p.sign} ${p.deg.toFixed(1)}°${p.retro ? '(逆行)' : ''}`),
  )
  if (c.natalAspects?.length) {
    lines.push('', '【出生図の注目の角度】', ...c.natalAspects.map((a) => `- ${a}`))
  }
  lines.push('', `【いまの空の動き(${c.periodLabel}のトランジット)】`, `${c.skyNote}(全体の基調: ${c.toneLabel})`)
  if (c.transits.length) lines.push(...c.transits.map((t) => `- ${t}`))
  if (c.reading) lines.push('', '【すでにこの人へ伝えた鑑定】', c.reading)
  lines.push(
    '',
    '相談への答え方:',
    '- 【最重要・厳守】星座名は上に書かれた確定データのみを使う。一字一句そのまま引用し、別の星座に言い換えたり、生年月日から自分で星座を推測し直したりは絶対にしない(例: 太陽が「獅子座」と書いてあれば、必ず「獅子座」と言う)',
    '- 「出生の天体配置」はこの人の生まれ持った変わらない性質、「いまの空の動き」は今この時期だけの運行です。両者を絶対に混同しないこと。「あなたの太陽/月/火星…」と言うときは必ず"出生の"配置(不変)を指し、運行中の星と取り違えない',
    '- 一般論で終わらせず、必ず上の具体的な配置に紐づけて答える(例:「あなたの火星は山羊座だから、焦らず段取りを組むほど力が出ます」)',
    '- 専門用語(トライン・スクエア・セクスタイル・オポジション・合・アスペクトなど)は使わず、「大きな追い風」「試練の角度」のように、良い配置か注意の配置かが一般の人にも伝わる言葉で説明する',
    '- あたたかく背中を押す口調で。でも実行できる具体的な行動やヒントを1つ添える',
    '- 断定的な予言(「必ず〜になる」)や、健康・金銭・進退の重大な決断を煽る言い方はしない',
    '- 上に書かれていない星の配置を勝手に作り出さない',
    '- 1回の返答は2〜4文程度で簡潔に。占い師との自然な会話のテンポを保つ',
    '- 呼びかけは二人称で。名前(◯◯さん)が分かるときだけ、時々やさしく名前で呼んでよい。名前が無いときは「あなた」と呼び、「この方」など第三者的な言い方は絶対にしない',
  )
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

function createChatHandler(apiKey: string | undefined): RawHandler {
  return (req, res) => {
    void (async () => {
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
      if (!apiKey || apiKey.includes('ここに')) {
        return json(res, 500, {
          error:
            'APIキーが未設定です。サーバーの環境変数 ANTHROPIC_API_KEY を設定してください(ローカルは .env、本番は Railway の Variables)。',
        })
      }

      let payload: ChatRequest
      try {
        payload = JSON.parse(await readBody(req)) as ChatRequest
      } catch {
        return json(res, 400, { error: 'リクエストの形式が不正です' })
      }
      if (!payload?.messages?.length || !payload.context) {
        return json(res, 400, { error: 'メッセージがありません' })
      }

      try {
        const client = new Anthropic({ apiKey })
        const stream = client.messages.stream({
          model: 'claude-opus-4-8',
          max_tokens: 1500,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' },
          system: buildChatSystem(payload.context) + LANG_DIRECTIVE[langOf(payload)],
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

        await stream.finalMessage()
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

/** 鑑定・相性・相談チャットのAPIハンドラを生成する */
export function createAiHandlers(apiKey: string | undefined): {
  reading: RawHandler
  pair: RawHandler
  chat: RawHandler
} {
  return {
    reading: makeHandler<AiReadingRequest>(apiKey, SYSTEM_PROMPT, buildUserPrompt),
    pair: makeHandler<AiPairRequest>(apiKey, PAIR_SYSTEM_PROMPT, buildPairPrompt),
    chat: createChatHandler(apiKey),
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
