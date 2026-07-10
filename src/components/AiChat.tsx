import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ChatChartContext, ChatMessage } from '../lib/aiChat'
import { streamAiChat } from '../lib/aiChat'

interface Props {
  context: ChatChartContext
  /** 会話を保存するlocalStorageキー(人ごとに分ける) */
  storageKey: string
}

const STARTERS: { label: string; q: string }[] = [
  { label: '💕 恋愛', q: 'いまの恋愛運と、恋愛で私が気をつけるといいことを教えて。' },
  { label: '💼 仕事', q: '仕事でいまの私が力を発揮するには、どう動くといい?' },
  { label: '🤝 人間関係', q: '人間関係で私が心地よくいるためのヒントがほしいな。' },
  { label: '🌱 性格', q: '星から見て、私って結局どういう性格の持ち主?' },
  { label: '🔮 この先', q: 'これからの私に、星はどんな流れを用意してる?' },
]

function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

export default function AiChat({ context, storageKey }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey))
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
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
    const base: ChatMessage[] = [...messages, { role: 'user', content: q }]
    // 空のアシスタント吹き出しを置き、そこへストリームを流し込む
    setMessages([...base, { role: 'assistant', content: '' }])
    setStreaming(true)
    try {
      await streamAiChat(context, base, (delta) => {
        setMessages((cur) => {
          const copy = cur.slice()
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = { ...last, content: last.content + delta }
          return copy
        })
      })
    } catch (e) {
      // 失敗したら空のアシスタント吹き出しを取り除き、ユーザー発言は残す
      setMessages((cur) => (cur.length && cur[cur.length - 1].role === 'assistant' && !cur[cur.length - 1].content ? cur.slice(0, -1) : cur))
      setError(e instanceof Error ? e.message : '不明なエラー')
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

  const hasChat = messages.length > 0

  return (
    <section className="planet-card chat-card">
      <header className="planet-head">
        <div className="planet-symbol" aria-hidden="true">
          🔮
        </div>
        <div>
          <p className="planet-title">星よみ相談室</p>
          <p className="planet-sub">あなたの星の配置をぜんぶ踏まえて、AIがなんでも相談にのります</p>
        </div>
      </header>

      {hasChat && (
        <div className="chat-log" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble chat-${m.role}`}>
              {m.content || (streaming && i === messages.length - 1 ? <span className="chat-typing">···</span> : '')}
            </div>
          ))}
        </div>
      )}

      {!hasChat && (
        <p className="chat-intro">
          気になることを聞いてみてください。恋愛・仕事・性格・これからの運勢——あなたの10天体といまの星回りをもとにお答えします。
        </p>
      )}

      <div className="chat-starters">
        {STARTERS.map((s) => (
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
          placeholder="メッセージを入力…"
          disabled={streaming}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          className="chat-send"
          disabled={streaming || !input.trim()}
          onClick={() => void send(input)}
          aria-label="送信"
        >
          {streaming ? '···' : '➤'}
        </button>
      </div>

      <div className="chat-foot-row">
        <p className="ai-note chat-note">
          送信するとあなたの星のデータがAI(Claude API)に送られます。1回ごとに少額の費用がかかります。
        </p>
        {hasChat && (
          <button className="chat-clear" onClick={clearChat}>
            会話を消す
          </button>
        )}
      </div>
    </section>
  )
}
