import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import type { ChatChartContext, ChatMessage } from '../lib/aiChat'
import { streamAiChat } from '../lib/aiChat'
import { earnChatSignal } from '../lib/companion'
import type { ChartData, PlanetKey } from '../lib/types'
import type { Lang } from '../lib/i18n'
import { starTypeOf } from '../lib/startypes'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useLang } from '../lib/i18n'
import { useUI } from '../lib/ui'
import { track } from '../lib/analytics'

/** 見出し・導入・スターター(質問チップ)の上書き。相性チャットなど別用途で差し替える。 */
export interface ChatCopy {
  title: string
  sub: string
  intro: string
  starters: { label: string; q: string }[]
}

interface Props {
  /** 会話を保存するlocalStorageキー(会話ごとに分ける) */
  storageKey: string
  /** 既定(ほしキャラ相談室): context を渡すと streamAiChat を使う */
  context?: ChatChartContext
  /** 相談相手＝自分のほしキャラのマスコットを出すためのチャート */
  chart?: ChartData
  /** カスタムのストリーム関数(相性チャット等)。渡すと context の代わりにこれを使う */
  stream?: (messages: ChatMessage[], onDelta: (text: string) => void, lang: Lang) => Promise<void>
  /** ヘッダーに出すアイコン(未指定なら chart のほしキャラマスコット) */
  headerIcon?: ReactNode
  /** 見出し・導入・スターターの上書き(未指定なら相談室の文言) */
  copy?: ChatCopy
  /** 1往復ごとに呼ばれる(ごほうび地図のシグナル更新など)。任意 */
  onExchange?: () => void
  /** 外から質問を投げ込む(運勢カードの「この先を聞く」など)。値が変わるたびに送信する */
  autoAsk?: { q: string; n: number }
}

function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

export default function AiChat({ context, storageKey, chart, stream, headerIcon, copy, onExchange, autoAsk }: Props) {
  const { lang } = useLang()
  const t = useUI()
  // 相談相手は自分のほしキャラ。ヘッダーにそのマスコットを出す
  const lonOf = (key: PlanetKey) => chart?.planets.find((p) => p.key === key)?.lon
  const cSun = lonOf('sun')
  const cMoon = lonOf('moon')
  const chatStar = cSun !== undefined && cMoon !== undefined ? starTypeOf(cSun, cMoon) : null
  // 見出し等は copy 上書き優先、無ければ相談室の既定文言
  const cp: ChatCopy = copy ?? { title: t.chat.title, sub: t.chat.sub, intro: t.chat.intro, starters: t.chat.starters }
  // ストリームは stream 上書き優先、無ければ context を使う既定チャット
  const runStream = stream ?? ((msgs: ChatMessage[], onDelta: (t: string) => void, l: Lang) => streamAiChat(context as ChatChartContext, msgs, onDelta, l))
  // ヘッダーアイコン: 上書き優先、無ければ自分のほしキャラマスコット
  const icon: ReactNode = headerIcon ?? (chatStar ? <HoshiKyaraMascot sunElement={chatStar.sunElement} moonElement={chatStar.moonElement} size={52} /> : null)
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey))
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [showLog, setShowLog] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const askedRef = useRef(0)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch {
      /* 保存できない環境では無視 */
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, storageKey])

  async function send(text: string) {
    const q = text.trim()
    if (!q || streaming) return
    track('chat_send')
    setError('')
    setInput('')
    setShowLog(true)
    const base: ChatMessage[] = [...messages, { role: 'user', content: q }]
    // 空のアシスタント吹き出しを置き、そこへストリームを流し込む
    setMessages([...base, { role: 'assistant', content: '' }])
    setStreaming(true)
    try {
      await runStream(
        base,
        (delta) => {
          setMessages((cur) => {
            const copy = cur.slice()
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = { ...last, content: last.content + delta }
            return copy
          })
        },
        lang,
      )
      // 会話が成立したら、ごほうび地図のシグナルを +1(端末に加算して画面を更新)
      earnChatSignal()
      onExchange?.()
    } catch (e) {
      // 失敗したら空のアシスタント吹き出しを取り除き、ユーザー発言は残す
      setMessages((cur) => (cur.length && cur[cur.length - 1].role === 'assistant' && !cur[cur.length - 1].content ? cur.slice(0, -1) : cur))
      setError(e instanceof Error ? e.message : t.common.unknownError)
    } finally {
      setStreaming(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send(input)
    }
  }

  function clearChat() {
    setMessages([])
    setError('')
  }

  /** 質問(ユーザー発言)と、その直後の回答をペアで削除する */
  function deleteExchange(index: number) {
    if (streaming) return
    setMessages((cur) => {
      const copy = cur.slice()
      const removeCount = copy[index + 1]?.role === 'assistant' ? 2 : 1
      copy.splice(index, removeCount)
      return copy
    })
  }

  const hasChat = messages.length > 0
  const questionCount = messages.filter((m) => m.role === 'user').length

  // 運勢カードなど外から投げられた質問を、この相談室で受けて送る
  useEffect(() => {
    if (!autoAsk || autoAsk.n === askedRef.current) return
    askedRef.current = autoAsk.n
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    void send(autoAsk.q)
    // send は毎レンダー作り直されるので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAsk])

  return (
    <section className="planet-card chat-card" ref={cardRef}>
      <header className="card-head">
        {icon && (
          <div className="card-head-icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <div>
          <p className="card-title">{cp.title}</p>
          <p className="card-sub">{cp.sub}</p>
        </div>
      </header>

      {hasChat && (
        <div className="chat-loghead">
          <span>{t.chat.historyCount(questionCount)}</span>
          <button className="chat-toggle" onClick={() => setShowLog((v) => !v)}>
            {showLog ? t.chat.hide : t.chat.show}
          </button>
        </div>
      )}

      {hasChat && showLog && (
        <div className="chat-log" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble chat-${m.role}`}>
              {m.content || (streaming && i === messages.length - 1 ? <span className="chat-typing">···</span> : '')}
              {m.role === 'user' && !streaming && (
                <button
                  className="chat-del"
                  onClick={() => deleteExchange(i)}
                  aria-label={t.chat.delAria}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasChat && <p className="chat-intro">{cp.intro}</p>}

      <div className="chat-starters">
        {cp.starters.map((s) => (
          <button key={s.label} className="chat-chip" disabled={streaming} onClick={() => void send(s.q)}>
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="form-error chat-error">{error}</p>}

      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          value={input}
          placeholder={t.chat.inputPlaceholder}
          disabled={streaming}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          className="chat-send"
          disabled={streaming || !input.trim()}
          onClick={() => void send(input)}
          aria-label={t.chat.sendAria}
        >
          {streaming ? '···' : '➤'}
        </button>
      </div>

      <div className="chat-foot-row">
        {/*
          入力欄の下の注記は世界観を壊すのでやめた。
          「書いた内容がAIに届く」ことは相談室の説明文(t.chat.intro)に織り込んであり、
          詳細はLP下部の「このアプリについて」(#about-app)に集約している。
        */}
        {hasChat && (
          <button className="chat-clear" onClick={clearChat}>
            {t.chat.clear}
          </button>
        )}
      </div>
    </section>
  )
}
