import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ChatChartContext, ChatMessage } from '../lib/aiChat'
import { streamAiChat } from '../lib/aiChat'
import { useLang } from '../lib/i18n'
import { useUI } from '../lib/ui'

interface Props {
  context: ChatChartContext
  /** 会話を保存するlocalStorageキー(人ごとに分ける) */
  storageKey: string
}

function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

export default function AiChat({ context, storageKey }: Props) {
  const { lang } = useLang()
  const t = useUI()
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey))
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [showLog, setShowLog] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    setError('')
    setInput('')
    setShowLog(true)
    const base: ChatMessage[] = [...messages, { role: 'user', content: q }]
    // 空のアシスタント吹き出しを置き、そこへストリームを流し込む
    setMessages([...base, { role: 'assistant', content: '' }])
    setStreaming(true)
    try {
      await streamAiChat(
        context,
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

  return (
    <section className="planet-card chat-card">
      <header className="planet-head">
        <div className="planet-symbol" aria-hidden="true">
          🔮
        </div>
        <div>
          <p className="planet-title">{t.chat.title}</p>
          <p className="planet-sub">{t.chat.sub}</p>
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

      {!hasChat && <p className="chat-intro">{t.chat.intro}</p>}

      <div className="chat-starters">
        {t.chat.starters.map((s) => (
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
        <p className="ai-note chat-note">{t.chat.note}</p>
        {hasChat && (
          <button className="chat-clear" onClick={clearChat}>
            {t.chat.clear}
          </button>
        )}
      </div>
    </section>
  )
}
