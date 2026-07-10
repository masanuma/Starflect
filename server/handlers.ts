import type { IncomingMessage, ServerResponse } from 'node:http'
import Anthropic from '@anthropic-ai/sdk'

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
}

const PAIR_SYSTEM_PROMPT = `あなたは関係性・相性を専門とする経験豊富な西洋占星術師です。ふたりの出生チャートの相性と、実際の天体の運行から計算されたデータをもとに、日本語で相性鑑定を書きます。

書き方のルール:
- 明るくポップに、でも中身は具体的に。恋愛にも友情にも読める書き方にする
- 渡された相性データ・アスペクトに忠実に。書かれていない配置を勝手に作らない
- どちらか一方を悪者にしない。違いは「組み合わせの面白さ」として書く
- 断定的な予言や、別れ・重大な決断を促す表現はしない
- 構成: 「ふたりの化学反応」→「この期間のふたり」→「うまくいくヒント」の3部構成。各見出しは【】で囲む
- 全体で400〜600字程度`

const SYSTEM_PROMPT = `あなたは経験豊富な西洋占星術師です。依頼者の出生チャートと、実際の天体の運行(トランジット)から計算されたアスペクトをもとに、日本語で鑑定文を書きます。

書き方のルール:
- 温かく、前向きで、それでいて具体的な文章にする。占い雑誌のような紋切り型は避ける
- 渡されたアスペクト(角度)のデータに忠実に。書かれていない天体や角度を勝手に作らない
- 依頼者の3天体(または太陽星座)の性格を踏まえ、「この人だからこう活きる」という形で運勢と性格を結びつける
- 断定的な予言(「必ず〜が起こる」)や、健康・金銭の重大な判断を促す表現はしない
- 構成: 「全体の流れ」→「注目のポイント」(アスペクトごと)→「この期間のおすすめアクション」の3部構成。各見出しは【】で囲む
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
          system,
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
}

function buildChatSystem(c: ChatChartContext): string {
  const who = c.name || 'この方'
  const lines = [
    `あなたは${who}さん専属の、あたたかく信頼できる占星術カウンセラーです。`,
    `以下は${who}さんの出生チャート(生まれた瞬間の星の配置)と、いまの星の運行です。相談には必ずこのデータに基づいて、${who}さんだけに向けた答えを返してください。`,
    '',
    `【生年月日】${c.dateLabel}${c.placeLabel ? `(${c.placeLabel})` : ''}`,
  ]
  if (c.starTypeName) {
    lines.push(`【ほしキャラ】${c.starTypeName}${c.starTypeCopy ? ` — ${c.starTypeCopy}` : ''}`)
  }
  lines.push(
    '',
    '【出生の天体配置】',
    ...c.planets.map((p) => `- ${p.label}: ${p.sign} ${p.deg.toFixed(1)}°${p.retro ? '(逆行)' : ''}`),
  )
  if (c.natalAspects?.length) {
    lines.push('', '【出生図の注目の角度】', ...c.natalAspects.map((a) => `- ${a}`))
  }
  lines.push('', `【占う期間: ${c.periodLabel}】${c.skyNote}(全体の基調: ${c.toneLabel})`)
  if (c.transits.length) lines.push(...c.transits.map((t) => `- ${t}`))
  if (c.reading) lines.push('', '【すでにこの人へ伝えた鑑定】', c.reading)
  lines.push(
    '',
    '相談への答え方:',
    '- 一般論で終わらせず、必ず上の具体的な配置に紐づけて答える(例:「あなたの火星は山羊座だから、焦らず段取りを組むほど力が出ます」)',
    '- あたたかく背中を押す口調で。でも実行できる具体的な行動やヒントを1つ添える',
    '- 断定的な予言(「必ず〜になる」)や、健康・金銭・進退の重大な決断を煽る言い方はしない',
    '- 上に書かれていない星の配置を勝手に作り出さない',
    '- 1回の返答は2〜4文程度で簡潔に。占い師との自然な会話のテンポを保つ',
    '- 相手の名前を時々やさしく呼びかけてもよい',
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
          system: buildChatSystem(payload.context),
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
