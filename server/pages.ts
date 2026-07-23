/**
 * 紹介LP( / ) と キャラ別ページ( /c/<slug> ) の静的HTMLを生成する。
 * SPAとは別の、クローラーが確実に読める軽量ページ(SEOの本体)。
 * マスコットはアプリのReactコンポーネントをSSRしてインライン埋め込み＝画面と一致。
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HoshiKyaraMascot from '../src/components/HoshiKyaraMascot'
import BrandMascot from '../src/components/BrandMascot'
import { CHARACTERS, CHAR_BY_SLUG, ELEMENT_WORD } from './characters'
import type { Character, Element } from './characters'

const ORIGIN = 'https://starflect.asanuma.works'

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap" rel="stylesheet" />`

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--pink:#EA6596;--violet:#8A63DD;--ink:#3a2f57;--ink-sub:#7a6f96;--bg:#F8F5FD;--card:#fff;--line:#ece4f7}
body{font-family:'Zen Kaku Gothic New','Hiragino Sans',sans-serif;color:var(--ink);background:var(--bg);line-height:1.8;-webkit-font-smoothing:antialiased}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
a{color:var(--violet);text-decoration:none}
h1,h2,h3{font-family:'Zen Maru Gothic',sans-serif}
.topbar{padding:16px 0}
.brand{display:inline-flex;align-items:center;gap:7px}
.brand-ic{flex:none;width:30px;height:30px}
.brand-ic svg{display:block}
.brand-tx{font-family:'Zen Maru Gothic';font-weight:800;font-size:18px;background:linear-gradient(120deg,var(--pink),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hero{text-align:center;padding:24px 0 28px}
.hero-mascot{width:116px;margin:0 auto 10px;filter:drop-shadow(0 10px 20px rgba(138,99,221,.28))}
.hero-mascot svg{display:block}
.hero h1{font-size:30px;font-weight:800;line-height:1.4;margin-bottom:12px}
.hero .grad{background:linear-gradient(120deg,var(--pink),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:var(--ink-sub);font-size:15px;margin-bottom:22px}
.cta{display:inline-block;padding:15px 34px;border-radius:999px;background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;font-family:'Zen Maru Gothic';font-weight:800;font-size:16px;box-shadow:0 10px 24px rgba(138,99,221,.28)}
.cta.small{padding:12px 26px;font-size:14px}
.note{font-size:12px;color:var(--ink-sub);margin-top:12px}
section{margin:36px 0}
section h2{font-size:20px;font-weight:800;text-align:center;margin-bottom:8px}
section .lead{text-align:center;color:var(--ink-sub);font-size:14px;margin-bottom:20px}
.prose{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px;font-size:15px}
.prose p{margin-bottom:12px}
.prose p:last-child{margin-bottom:0}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.ch{display:flex;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px;transition:transform .12s,box-shadow .12s}
.ch:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(138,99,221,.14)}
.ch .av{flex:none;width:56px;height:56px;border-radius:50%;background:#f3eefb;display:flex;align-items:center;justify-content:center}
.ch .nm{font-family:'Zen Maru Gothic';font-weight:800;font-size:14.5px;color:var(--ink)}
.ch .cp{font-size:11.5px;color:var(--ink-sub);line-height:1.5;margin-top:2px}
.steps{display:grid;gap:12px}
.step{display:flex;gap:14px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.step .n{flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px}
.step b{font-family:'Zen Maru Gothic'}
.faq details{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:10px}
.faq summary{font-family:'Zen Maru Gothic';font-weight:700;cursor:pointer;font-size:14.5px}
.faq p{margin-top:8px;font-size:13.5px;color:var(--ink-sub)}
.chero{text-align:center;padding:20px 0 8px}
.chero .av{width:150px;height:150px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center}
.chero h1{font-size:30px;font-weight:900}
.chero .cp{color:var(--ink-sub);font-size:15px;margin-top:6px}
.formula{display:flex;gap:10px;justify-content:center;margin:18px 0}
.fbox{flex:1;max-width:220px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;text-align:center}
.fbox .lb{font-size:11px;color:var(--ink-sub)}
.fbox .el{font-family:'Zen Maru Gothic';font-weight:800;font-size:16px;margin-top:2px}
.cta-block{text-align:center;margin:32px 0}
.footer{text-align:center;color:var(--ink-sub);font-size:12px;padding:32px 0;border-top:1px solid var(--line);margin-top:40px;line-height:1.9}
.back{display:inline-block;margin:8px 0;font-size:13px}
@media(max-width:520px){.grid{grid-template-columns:1fr}.hero h1{font-size:25px}}
`

function mascot(sun: Element, moon: Element, size: number): string {
  return renderToStaticMarkup(createElement(HoshiKyaraMascot, { sunElement: sun, moonElement: moon, size }))
}

function brand(size: number): string {
  return renderToStaticMarkup(createElement(BrandMascot, { size }))
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

interface LayoutOpts {
  title: string
  description: string
  canonical: string
  ogTitle: string
  ogImage: string
  body: string
  /** LP用: 相棒がいれば描画前に /app へ飛ばす */
  redirectIfCompanion?: boolean
}

function layout(o: LayoutOpts): string {
  const redirect = o.redirectIfCompanion
    ? `<script>try{if(localStorage.getItem('starflect-companion:v1'))location.replace('/app'+location.search)}catch(e){}</script>`
    : ''
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#F8F5FD"/>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}"/>
<link rel="canonical" href="${o.canonical}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<meta property="og:type" content="website"/><meta property="og:site_name" content="ほしキャラ診断 〜Starflect〜"/>
<meta property="og:title" content="${esc(o.ogTitle)}"/><meta property="og:description" content="${esc(o.description)}"/>
<meta property="og:url" content="${o.canonical}"/><meta property="og:image" content="${o.ogImage}"/>
<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(o.ogTitle)}"/><meta name="twitter:image" content="${o.ogImage}"/>
${FONTS}${redirect}<style>${CSS}</style></head>
<body><div class="wrap"><div class="topbar"><a href="/" class="brand"><span class="brand-ic">${brand(30)}</span><span class="brand-tx">ほしキャラ診断</span></a></div>${o.body}
<div class="footer">星の計算はすべてお使いの端末内で行われます。<br/>© ほしキャラ診断 〜Starflect〜</div></div></body></html>`
}

function charCardHtml(c: Character): string {
  return `<a class="ch" href="/c/${c.slug}"><span class="av">${mascot(c.sun, c.moon, 46)}</span><span><span class="nm">「${esc(c.name)}」</span><span class="cp">${esc(c.copy)}</span></span></a>`
}

/** 紹介LP( / ) */
export function renderLP(): string {
  const grid = CHARACTERS.map(charCardHtml).join('')
  const body = `
<div class="hero">
  <div class="hero-mascot">${brand(116)}</div>
  <h1>あなたはどの<span class="grad">「ほしキャラ」</span>？</h1>
  <p>生まれた瞬間の星の配置でわかる、16キャラ×本格星占い。<br/>生年月日を入れるだけ・登録不要・無料。</p>
  <a class="cta" href="/app">無料で診断する →</a>
  <p class="note">所要30秒／太陽星座×月星座で16タイプに分類</p>
</div>

<section>
  <h2>ほしキャラ診断とは？</h2>
  <div class="prose">
    <p>雑誌の12星座占いは<b>太陽星座（表の顔）</b>だけを見ます。ほしキャラ診断は、そこに<b>月星座（心の中）</b>を掛け合わせ、あなたを16タイプの「ほしキャラ」に分類します。</p>
    <p>さらに、生まれた瞬間の<b>10天体（水星・金星・火星…）の配置</b>まで計算。太陽星座だけではわからない、あなただけの性格と運勢を読み解きます。生まれた時刻がわかれば<b>上昇星座（第一印象）</b>まで。</p>
    <p>計算はすべて西洋占星術（アストロロジー）に基づき、あなたの端末内で完結します。</p>
  </div>
</section>

<section>
  <h2>16のほしキャラ</h2>
  <p class="lead">太陽エレメント × 月エレメントの組み合わせで、全16タイプ。</p>
  <div class="grid">${grid}</div>
</section>

<section>
  <h2>使い方</h2>
  <div class="steps">
    <div class="step"><span class="n">1</span><span><b>生年月日を入力</b><br/>ニックネームと生年月日だけ。生まれた時刻・場所は任意（入れるとより詳しく）。</span></div>
    <div class="step"><span class="n">2</span><span><b>あなたのほしキャラが判明</b><br/>16キャラのどれか＋あなたを構成する10天体のキャラたちを表示。</span></div>
    <div class="step"><span class="n">3</span><span><b>毎日の運勢＆相談</b><br/>今日〜来月の運勢、そしてあなたのほしキャラ本人にチャットで相談できます。</span></div>
  </div>
  <div class="cta-block"><a class="cta" href="/app">さっそく診断する →</a></div>
</section>

<section class="faq">
  <h2>よくある質問</h2>
  <details><summary>無料で使えますか？</summary><p>はい。生年月日を入力するだけで、登録不要・無料で診断できます。</p></details>
  <details><summary>生まれた時刻は必要ですか？</summary><p>生年月日だけで診断できます。生まれた時刻を入れると上昇星座（アセンダント）まで計算され、より詳しい結果になります。分からなければ省略してかまいません。</p></details>
  <details><summary>ふつうの12星座占いと何が違いますか？</summary><p>12星座占いは太陽星座だけを見ます。ほしキャラ診断は太陽星座に月星座を掛け合わせ、さらに10天体まで計算するので、あなただけの結果になります。</p></details>
  <details><summary>個人情報は送信されますか？</summary><p>星の計算はすべて端末内で行われ、生年月日が外部に送られることはありません。ほしキャラに相談したときだけ、計算結果（星の配置）が送信されます。</p></details>
</section>
`
  return layout({
    title: 'ほしキャラ診断 〜Starflect〜｜生まれた瞬間の星でわかる16キャラ占い',
    description: 'あなたはどの「ほしキャラ」? 生年月日を入れるだけ、生まれた瞬間の星の配置から太陽星座×月星座×10天体で16キャラに分類。性格と運勢を無料診断する本格西洋占星術アプリ。',
    canonical: `${ORIGIN}/`,
    ogTitle: 'ほしキャラ診断 〜Starflect〜',
    ogImage: `${ORIGIN}/ogp/default.png`,
    body,
    redirectIfCompanion: true,
  })
}

/** キャラ別ページ( /c/<slug> )。無効なslugは null */
export function renderCharPage(slug: string): string | null {
  const c = CHAR_BY_SLUG[slug]
  if (!c) return null
  const others = CHARACTERS.filter((x) => x.slug !== c.slug).map(charCardHtml).join('')
  const el = (e: Element) => `${e}（${ELEMENT_WORD[e]}）`
  const body = `
<div class="chero">
  <div class="av" style="background:#f3eefb">${mascot(c.sun, c.moon, 118)}</div>
  <h1><span class="grad">「${esc(c.name)}」</span></h1>
  <p class="cp">${esc(c.copy)}</p>
</div>

<div class="prose"><p>${esc(c.text)}</p></div>

<div class="formula">
  <div class="fbox"><div class="lb">太陽星座（表の顔）</div><div class="el">${el(c.sun)}</div></div>
  <div class="fbox"><div class="lb">月星座（心の中）</div><div class="el">${el(c.moon)}</div></div>
</div>
<p class="lead">この「${esc(c.name)}」は、<b>太陽星座が${el(c.sun)}のエレメント</b>、<b>月星座が${el(c.moon)}のエレメント</b>の組み合わせで生まれるほしキャラです。生まれた瞬間の星の配置で決まります。</p>

<div class="cta-block">
  <a class="cta" href="/app">あなたのほしキャラを無料で診断する →</a>
  <p class="note">生年月日だけ・登録不要・30秒</p>
</div>

<section>
  <h2>ほかのほしキャラ</h2>
  <p class="lead">全16キャラ。あなたはどれ？</p>
  <div class="grid">${others}</div>
</section>

<a class="back" href="/">← ほしキャラ診断トップへ</a>
`
  return layout({
    title: `「${c.name}」ってどんな人？｜ほしキャラ診断`,
    description: `ほしキャラ「${c.name}」の性格：${c.copy}。${c.text} 太陽星座×月星座であなたのほしキャラも無料診断。`,
    canonical: `${ORIGIN}/c/${c.slug}`,
    ogTitle: `私のほしキャラは「${c.name}」｜ほしキャラ診断`,
    ogImage: `${ORIGIN}/ogp/${c.slug}.png`,
    body,
  })
}
