import { useEffect, useState } from 'react'
import Stars from './components/Stars'
import Home from './components/Home'
import BirthForm from './components/BirthForm'
import Result from './components/Result'
import PairForm from './components/PairForm'
import PairResult from './components/PairResult'
import About from './components/About'
import Companion from './components/Companion'
import LangSwitcher from './components/LangSwitcher'
import ConsentBanner from './components/ConsentBanner'
import type { ChartData } from './lib/types'
import type { PairData } from './lib/compat'
import { useUI } from './lib/ui'
import { hasCompanion, loadCompanion, createCompanion } from './lib/companion'
import type { CompanionState } from './lib/companion'
import { initAnalytics, getConsent, setConsent } from './lib/analytics'
import type { Consent } from './lib/analytics'

type Screen =
  | { page: 'home' }
  | { page: 'about' }
  | { page: 'form' }
  | { page: 'result'; data: ChartData }
  | { page: 'pairForm' }
  | { page: 'pairResult'; data: PairData }
  | { page: 'companion'; state: CompanionState }

export default function App() {
  // 2回目以降(相棒がいる)は相棒ホームを起点にする
  const [screen, setScreen] = useState<Screen>(() => {
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
            onAbout={() => setScreen({ page: 'about' })}
          />
        )}
        {screen.page === 'about' && (
          <About
            onBack={() => setScreen({ page: 'home' })}
            onStart={() => setScreen({ page: 'form' })}
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
            onRetry={() => setScreen({ page: 'form' })}
            onHome={() => setScreen({ page: 'home' })}
            onAdopt={(starType) => {
              const state = createCompanion((screen as { data: ChartData }).data, starType)
              setScreen({ page: 'companion', state })
            }}
          />
        )}
        {screen.page === 'companion' && (
          <Companion
            state={screen.state}
            onRetry={() => setScreen({ page: 'form' })}
            onHome={() => setScreen({ page: 'home' })}
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
      <footer className="footer">
        <span className="footer-star">✦</span>
        {t.footer}
        <button className="consent-link" onClick={() => setConsentState(null)}>
          {t.consent.settings}
        </button>
      </footer>
      {consent === null && <ConsentBanner onChoose={chooseConsent} />}
    </div>
  )
}
