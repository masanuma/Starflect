/**
 * Google Analytics 4(同意ゲート付き)。
 * ユーザーが「許可」を押すまで gtag は読み込まず、Cookie も作らない。
 * 生年月日・名前・場所などの個人情報は一切送信しない。
 */
const GA_ID = 'G-LVX42BVCYG'
const KEY = 'starflect-analytics-consent'

export type Consent = 'granted' | 'denied'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __gaLoaded?: boolean
  }
}

/** 保存済みの同意状態(未選択なら null) */
export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

/** gtag を読み込んで初期化(許可時のみ) */
function loadGa() {
  if (window.__gaLoaded) return
  window.__gaLoaded = true
  window.dataLayer = window.dataLayer || []
  function gtag() {
    // GA は arguments オブジェクトをそのまま受け取る仕様
    window.dataLayer!.push(arguments)
  }
  window.gtag = gtag as (...args: unknown[]) => void
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { anonymize_ip: true })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

/** アプリ起動時に呼ぶ。すでに許可済みなら GA を読み込む */
export function initAnalytics() {
  if (getConsent() === 'granted') loadGa()
}

/** 同意状態を保存。許可なら即読み込み */
export function setConsent(consent: Consent) {
  try {
    localStorage.setItem(KEY, consent)
  } catch {
    /* 保存できない環境では無視 */
  }
  if (consent === 'granted') loadGa()
}

/** イベント送信(GA 未読込＝未同意なら何もしない) */
export function track(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params ?? {})
  }
}
