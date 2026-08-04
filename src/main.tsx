import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { LangProvider } from './lib/i18n'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </LangProvider>
  </React.StrictMode>,
)
