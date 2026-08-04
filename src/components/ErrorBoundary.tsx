import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { getLang } from '../lib/i18n'

/**
 * 予期しない例外を受け止める最後の砦。
 *
 * React はレンダー中に例外が出るとツリー全体をアンマウントするため、
 * これが無いと**どこか1箇所の例外で画面が真っ白**になる（メッセージも出ない）。
 * 実際「診断を開始したら真っ白になる」という報告があった。
 *
 * ここは壊れた状態で動く場所なので、**依存を最小にする**：
 * - `useUI()` などのフックは使わない（クラスコンポーネント＋素の getLang）
 * - 文言はこのファイル内に持つ（ui.ts 側が壊れていても表示できるように）
 */
const TEXT: Record<string, { title: string; body: string; retry: string }> = {
  ja: {
    title: 'うまく星を読めませんでした',
    body: 'ごめんなさい、途中でつまずいてしまいました。もう一度ひらいてみてください。',
    retry: 'もう一度ひらく',
  },
  en: {
    title: 'I couldn’t read the stars',
    body: 'Sorry — something tripped me up along the way. Please try opening it again.',
    retry: 'Open again',
  },
  es: {
    title: 'No pude leer las estrellas',
    body: 'Lo siento, algo se atascó por el camino. Prueba a abrirlo de nuevo.',
    retry: 'Abrir de nuevo',
  },
  fr: {
    title: 'Je n’ai pas pu lire les astres',
    body: 'Désolé, quelque chose a coincé en chemin. Essaie de rouvrir.',
    retry: 'Rouvrir',
  },
  it: {
    title: 'Non sono riuscito a leggere le stelle',
    body: 'Scusa, qualcosa si è inceppato lungo la strada. Prova ad aprire di nuovo.',
    retry: 'Apri di nuovo',
  },
  pt: {
    title: 'Não consegui ler as estrelas',
    body: 'Desculpe, algo travou no caminho. Tente abrir novamente.',
    retry: 'Abrir de novo',
  },
  ko: {
    title: '별을 잘 읽지 못했어요',
    body: '미안해요, 도중에 걸려 넘어졌어요. 다시 한 번 열어 봐 주세요.',
    retry: '다시 열기',
  },
}

interface State {
  failed: boolean
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 本人には出さないが、開発時とブラウザのコンソールには残す
    console.error('[starflect] uncaught error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    let t = TEXT.ja
    try {
      t = TEXT[getLang()] ?? TEXT.ja
    } catch {
      /* i18n 側が壊れていても日本語で出す */
    }
    return (
      <div className="crash">
        <div className="crash-card">
          <div className="crash-star" aria-hidden="true">
            ✦
          </div>
          <p className="crash-title">{t.title}</p>
          <p className="crash-body">{t.body}</p>
          <button className="cta cta-pop" onClick={() => window.location.reload()}>
            {t.retry}
          </button>
        </div>
      </div>
    )
  }
}
