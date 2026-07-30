import { useEffect, useState } from 'react'
import Stars from './components/Stars'
import Home from './components/Home'
import BirthForm from './components/BirthForm'
import Result from './components/Result'
import PairForm from './components/PairForm'
import PairResult from './components/PairResult'
import Companion from './components/Companion'
import LangSwitcher from './components/LangSwitcher'
import ConsentBanner from './components/ConsentBanner'
import type { ChartData } from './lib/types'
import type { PairData } from './lib/compat'
import { useUI } from './lib/ui'
import { getLang } from './lib/i18n'
import { hasCompanion, loadCompanion } from './lib/companion'
import type { CompanionState } from './lib/companion'
import { initAnalytics, getConsent, setConsent } from './lib/analytics'
import type { Consent } from './lib/analytics'

type Screen =
  | { page: 'home' }
  | { page: 'form' }
  | { page: 'result'; data: ChartData }
  | { page: 'pairForm' }
  | { page: 'pairResult'; data: PairData }
  | { page: 'companion'; state: CompanionState }

/** LP のパス。日本語は `/`、他言語は `/<lang>`（静的ページ側の lpHref と同じ規則） */
const lpPath = () => (getLang() === 'ja' ? '/' : `/${getLang()}`)

export default function App() {
  // 2回目以降(相棒がいる)は相棒ホームを起点にする
  const [screen, setScreen] = useState<Screen>(() => {
    // 相性ページ(/pair)のCTAから来た人は相性フォームを直接ひらく。
    // 相性を見たくて来ているので、相棒がいても相棒ホームには寄せない。
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'pair') {
      return { page: 'pairForm' }
    }
    const saved = hasCompanion() ? loadCompanion() : null
    return saved ? { page: 'companion', state: saved } : { page: 'home' }
  })
  const [consent, setConsentState] = useState<Consent | null>(() => getConsent())
  const t = useUI()

  // 起動時、すでに許可済みなら解析を読み込む
  useEffect(() => {
    initAnalytics()
  }, [])

  // 画面が切り替わったら常に一番上から表示する
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen.page])

  function chooseConsent(c: Consent) {
    setConsent(c)
    setConsentState(c)
  }

  return (
    <div className="app">
      <Stars />
      <LangSwitcher />
      <main className="container">
        {screen.page === 'home' && (
          <Home
            onSelect={() => setScreen({ page: 'form' })}
            onSelectPair={() => setScreen({ page: 'pairForm' })}
            onAbout={() => {
              // 「ほしキャラとは」は紹介LPに一本化。現在の言語のLPへ。相棒があってもリダイレクトされないよう ?stay
              const l = getLang()
              window.location.href = (l === 'ja' ? '/' : `/${l}`) + '?stay=1'
            }}
            onCompanion={() => {
              const state = loadCompanion()
              if (state) setScreen({ page: 'companion', state })
            }}
          />
        )}
        {screen.page === 'form' && (
          <BirthForm
            onBack={() => setScreen({ page: 'home' })}
            onResult={(data) => setScreen({ page: 'result', data })}
          />
        )}
        {screen.page === 'result' && (
          <Result
            data={screen.data}
            onHome={() => setScreen({ page: 'home' })}
            onPair={() => setScreen({ page: 'pairForm' })}
          />
        )}
        {screen.page === 'companion' && (
          <Companion
            state={screen.state}
            onHome={() => setScreen({ page: 'home' })}
            onPair={() => setScreen({ page: 'pairForm' })}
          />
        )}
        {screen.page === 'pairForm' && (
          <PairForm
            onBack={() => setScreen({ page: 'home' })}
            onResult={(data) => setScreen({ page: 'pairResult', data })}
          />
        )}
        {screen.page === 'pairResult' && (
          <PairResult
            data={screen.data}
            onRetry={() => setScreen({ page: 'pairForm' })}
            onHome={() => setScreen({ page: 'home' })}
          />
        )}
      </main>
      {/*
        注記はここに寄せる。データの扱い・AI相談の位置づけ・占いの位置づけの詳細は
        LP下部の「このアプリについて」(#about-app)に集約し、ここからは1本のリンクで飛ばす。
        画面のあちこちに但し書きを置くと世界観が壊れるため。
      */}
      <footer className="footer">
        <span className="footer-star">✦</span>
        {t.footer}
        {/* ?stay=1 が無いと、相棒がいる人はLPから /app へ即リダイレクトされて戻ってきてしまう */}
        <a className="consent-link" href={`${lpPath()}?stay=1#about-app`}>
          {t.aboutLink}
        </a>
        <button className="consent-link" onClick={() => setConsentState(null)}>
          {t.consent.settings}
        </button>
      </footer>
      {consent === null && <ConsentBanner onChoose={chooseConsent} />}
    </div>
  )
}
