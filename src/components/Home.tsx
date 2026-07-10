interface Props {
  onSelect: () => void
  onSelectPair: () => void
}

export default function Home({ onSelect, onSelectPair }: Props) {
  return (
    <div className="home">
      <div className="hero">
        <div className="hero-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
            <path
              d="M24 4c1.2 8.4 4.9 15.6 20 20-15.1 4.4-18.8 11.6-20 20-1.2-8.4-4.9-15.6-20-20 15.1-4.4 18.8-11.6 20-20Z"
              fill="#F2B25C"
            />
            <circle cx="38" cy="10" r="1.6" fill="#C9B8F0" />
            <circle cx="9" cy="37" r="1.2" fill="#C9B8F0" />
          </svg>
        </div>
        <h1 className="wordmark">Starflect</h1>
        <p className="tagline">
          あなたはどの「ほしキャラ」?
          <br />
          生まれた瞬間の星の配置でわかる、16キャラ×本格星占い。
        </p>
      </div>

      <div className="mode-list">
        <button className="mode-card mode-detailed" onClick={onSelect}>
          <div className="mode-head">
            <span className="mode-name">🌟 ほしキャラ診断</span>
            <span className="mode-time">30秒</span>
          </div>
          <p className="mode-desc">
            生年月日だけでOK。あなたのほしキャラ(全16キャラ)と、あなたの中に住む10天体キャラまで分析
          </p>
        </button>

        <button className="mode-card mode-pair" onClick={onSelectPair}>
          <div className="mode-head">
            <span className="mode-name">💞 ふたりの相性</span>
            <span className="mode-badge-new">NEW</span>
          </div>
          <p className="mode-desc">ほしキャラの相性と「今日のふたり」を診断。相手の生年月日だけでOK</p>
        </button>
      </div>

      <p className="home-note">計算は雑誌の12星座占いと同じ生年月日ベース。でも結果は、あなただけのもの。</p>
    </div>
  )
}
