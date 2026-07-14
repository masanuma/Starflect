import type { ReactNode } from 'react'

interface Section {
  heading?: string
  paras: string[]
}

/** AI鑑定文を【見出し】+本文のセクションに分解する */
function parseReading(text: string): Section[] {
  const sections: Section[] = []
  let cur: Section = { paras: [] }
  let buf: string[] = []

  const flushPara = () => {
    const t = buf.join('\n').trim()
    if (t) cur.paras.push(t)
    buf = []
  }
  const flushSection = () => {
    flushPara()
    if (cur.heading || cur.paras.length) sections.push(cur)
    cur = { paras: [] }
  }

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    // 【見出し】(前後の ** は許容)。同じ行に本文が続く場合も拾う
    const m = line.match(/^\s*\*{0,2}【(.+?)】\*{0,2}\s*(.*)$/)
    if (m) {
      flushSection()
      cur = { heading: m[1].trim(), paras: [] }
      if (m[2]) buf.push(m[2])
    } else if (line.trim() === '') {
      flushPara()
    } else {
      buf.push(line)
    }
  }
  flushSection()
  return sections
}

/** **強調** を <strong> に */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const b = part.match(/^\*\*([^*]+)\*\*$/)
    return b ? <strong key={i}>{b[1]}</strong> : <span key={i}>{part}</span>
  })
}

/** AI鑑定文を、ほしキャラのテイストに合わせて整形表示する */
export default function AiReading({ text }: { text: string }) {
  const sections = parseReading(text)
  return (
    <div className="ai-reading">
      {sections.map((s, i) => (
        <div className="ai-section" key={i}>
          {s.heading && <p className="ai-heading">{s.heading}</p>}
          {s.paras.map((p, j) => (
            <p className="ai-para" key={j}>
              {renderInline(p)}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}
