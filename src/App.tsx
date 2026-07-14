import { useState } from 'react'
import Stars from './components/Stars'
import Home from './components/Home'
import BirthForm from './components/BirthForm'
import Result from './components/Result'
import PairForm from './components/PairForm'
import PairResult from './components/PairResult'
import About from './components/About'
import LangSwitcher from './components/LangSwitcher'
import type { ChartData } from './lib/types'
import type { PairData } from './lib/compat'
import { useUI } from './lib/ui'

type Screen =
  | { page: 'home' }
  | { page: 'about' }
  | { page: 'form' }
  | { page: 'result'; data: ChartData }
  | { page: 'pairForm' }
  | { page: 'pairResult'; data: PairData }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ page: 'home' })
  const t = useUI()

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
      </footer>
    </div>
  )
}
