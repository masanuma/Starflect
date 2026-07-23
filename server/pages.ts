/**
 * 紹介LP と キャラ別ページ の静的HTMLを、7言語で生成する。
 * setLang(lang) を呼んでから ui()/allStarTypes()/elementLabel()/elementPhrase() を使うと、
 * その言語のデータで返る(アプリと同じ翻訳資産をそのまま流用)。
 * URL: ja は / と /c/<slug>、他言語は /<lang> と /<lang>/c/<slug>。
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HoshiKyaraMascot from '../src/components/HoshiKyaraMascot'
import BrandMascot from '../src/components/BrandMascot'
import { setLang, LANGS } from '../src/lib/i18n'
import type { Lang } from '../src/lib/i18n'
import { ui, quoted } from '../src/lib/ui'
import { allStarTypes, elementPhrase } from '../src/lib/startypes'
import { elementLabel } from '../src/lib/signs'
import type { Element } from '../src/lib/signs'
import { PAGE_STRINGS, ELEMENT_ICON, ELEMENT_COLOR } from './pageStrings'
import { SLUG, ELEMENT_ORDER } from './characters'

const ORIGIN = 'https://starflect.asanuma.works'
export const CONTENT_LANGS: Lang[] = ['ja', 'en', 'es', 'fr', 'it', 'pt', 'ko']

const slugOf = (sun: Element, moon: Element) => `${SLUG[sun]}_${SLUG[moon]}`
const lpHref = (l: Lang) => (l === 'ja' ? '/' : `/${l}`)
const charHref = (l: Lang, slug: string) => (l === 'ja' ? `/c/${slug}` : `/${l}/c/${slug}`)
const lpUrl = (l: Lang) => ORIGIN + (l === 'ja' ? '/' : `/${l}`)
const charUrl = (l: Lang, slug: string) => ORIGIN + (l === 'ja' ? `/c/${slug}` : `/${l}/c/${slug}`)

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap" rel="stylesheet" />`

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--pink:#EA6596;--violet:#8A63DD;--ink:#3a2f57;--ink-sub:#7a6f96;--bg:#F8F5FD;--card:#fff;--line:#ece4f7}
body{font-family:'Zen Kaku Gothic New','Hiragino Sans',sans-serif;color:var(--ink);background:var(--bg);line-height:1.8;-webkit-font-smoothing:antialiased}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
a{color:var(--violet);text-decoration:none}
h1,h2,h3{font-family:'Zen Maru Gothic',sans-serif}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 0;flex-wrap:wrap}
.brand{display:inline-flex;align-items:center;gap:7px}
.brand-ic{flex:none;width:30px;height:30px}
.brand-ic svg{display:block}
.brand-tx{font-family:'Zen Maru Gothic';font-weight:800;font-size:18px;background:linear-gradient(120deg,var(--pink),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.langsw{display:flex;flex-wrap:wrap;gap:3px}
.langsw a{font-size:11.5px;font-weight:700;color:var(--ink-sub);padding:4px 8px;border-radius:999px;border:1px solid var(--line)}
.langsw a[aria-current]{background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;border-color:transparent}
.hero{text-align:center;padding:24px 0 28px}
.hero-mascot{width:116px;margin:0 auto 10px;filter:drop-shadow(0 10px 20px rgba(138,99,221,.28))}
.hero-mascot svg{display:block}
.hero h1{font-size:30px;font-weight:800;line-height:1.4;margin-bottom:12px}
.hero .grad{background:linear-gradient(120deg,var(--pink),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:var(--ink-sub);font-size:15px;margin-bottom:22px}
.cta{display:inline-block;padding:15px 30px;border-radius:999px;background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;font-family:'Zen Maru Gothic';font-weight:800;font-size:16px;box-shadow:0 10px 24px rgba(138,99,221,.28)}
.note{font-size:12px;color:var(--ink-sub);margin-top:12px}
section{margin:36px 0}
section h2{font-size:20px;font-weight:800;text-align:center;margin-bottom:8px}
section .lead{text-align:center;color:var(--ink-sub);font-size:14px;margin-bottom:20px}
.prose{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px;font-size:15px}
.prose p{margin-bottom:12px}.prose p:last-child{margin-bottom:0}
.tgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.tcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 12px;transition:transform .12s,box-shadow .12s}
.tcard:hover{transform:translateY(-3px);box-shadow:0 10px 22px rgba(138,99,221,.16)}
.tav{width:64px;height:64px;border-radius:50%;background:#f3eefb;display:flex;align-items:center;justify-content:center;margin-bottom:3px}
.tcombo{font-size:11px;color:var(--ink-sub)}
.tname{font-family:'Zen Maru Gothic';font-weight:800;font-size:14.5px;color:var(--ink)}
.tcopy{font-size:11.5px;color:var(--ink-sub);line-height:1.55}
.formula{display:flex;gap:10px;justify-content:center;margin:18px 0}
.fbox{flex:1;max-width:240px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;text-align:center}
.fbox .lb{font-size:11px;color:var(--ink-sub)}
.fbox .el{font-family:'Zen Maru Gothic';font-weight:800;font-size:15px;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:6px}
.els{display:grid;gap:8px;margin-top:14px}
.elrow{display:flex;align-items:center;gap:11px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-size:13px;color:var(--ink-sub)}
.elrow b{font-family:'Zen Maru Gothic';color:var(--ink);margin-right:6px}
.elmark{flex:none;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.steps{display:grid;gap:12px}
.step{display:flex;gap:14px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.step .n{flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(120deg,var(--pink),var(--violet));color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px}
.step b{font-family:'Zen Maru Gothic'}
.cta-block{text-align:center;margin:32px 0}
.faq details{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:10px}
.faq summary{font-family:'Zen Maru Gothic';font-weight:700;cursor:pointer;font-size:14.5px}
.faq p{margin-top:8px;font-size:13.5px;color:var(--ink-sub)}
.chero{text-align:center;padding:20px 0 8px}
.chero .av{width:150px;height:150px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center}
.chero h1{font-size:30px;font-weight:900}
.chero .cp{color:var(--ink-sub);font-size:15px;margin-top:6px}
.back{display:inline-block;margin:8px 0;font-size:13px}
.footer{text-align:center;color:var(--ink-sub);font-size:12px;padding:32px 0;border-top:1px solid var(--line);margin-top:40px;line-height:1.9}
@media(max-width:400px){.tgrid{grid-template-columns:1fr}}
`

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const mascot = (sun: Element, moon: Element, size: number) =>
  renderToStaticMarkup(createElement(HoshiKyaraMascot, { sunElement: sun, moonElement: moon, size }))
const brand = (size: number) => renderToStaticMarkup(createElement(BrandMascot, { size }))
const elMark = (el: Element) =>
  `<span class="elmark" style="background:${ELEMENT_COLOR[el]}"><svg width="18" height="18" viewBox="0 0 24 24">${ELEMENT_ICON[el]}</svg></span>`

interface LayoutOpts {
  lang: Lang
  title: string
  description: string
  ogTitle: string
  ogImage: string
  body: string
  kind: 'lp' | 'char'
  slug?: string
  redirectIfCompanion?: boolean
}

function layout(o: LayoutOpts): string {
  const canonical = o.kind === 'lp' ? lpUrl(o.lang) : charUrl(o.lang, o.slug!)
  const alt = (l: Lang) => (o.kind === 'lp' ? lpUrl(l) : charUrl(l, o.slug!))
  const href = (l: Lang) => (o.kind === 'lp' ? lpHref(l) : charHref(l, o.slug!))
  const alternates =
    CONTENT_LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${alt(l)}"/>`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${alt('ja')}"/>`
  const switcher = LANGS.map(
    (x) => `<a href="${href(x.code)}"${x.code === o.lang ? ' aria-current="true"' : ''}>${x.label}</a>`,
  ).join('')
  const redirect = o.redirectIfCompanion
    ? `<script>try{if(localStorage.getItem('starflect-companion:v1')&&!/[?&]stay/.test(location.search))location.replace('/app')}catch(e){}</script>`
    : ''
  const t = ui()
  return `<!doctype html><html lang="${o.lang}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#F8F5FD"/>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
${alternates}
<meta property="og:type" content="website"/><meta property="og:site_name" content="ほしキャラ診断 〜Starflect〜"/>
<meta property="og:title" content="${esc(o.ogTitle)}"/><meta property="og:description" content="${esc(o.description)}"/>
<meta property="og:url" content="${canonical}"/><meta property="og:image" content="${o.ogImage}"/>
<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(o.ogTitle)}"/><meta name="twitter:image" content="${o.ogImage}"/>
${FONTS}${redirect}<style>${CSS}</style></head>
<body><div class="wrap">
<div class="topbar"><a href="${lpHref(o.lang)}" class="brand"><span class="brand-ic">${brand(30)}</span><span class="brand-tx">${esc(t.home.appTitle)}</span></a><nav class="langsw">${switcher}</nav></div>
${o.body}
<div class="footer">© ${esc(t.home.appTitle)} 〜Starflect〜</div></div></body></html>`
}

type ST = ReturnType<typeof allStarTypes>[number]
function tcard(lang: Lang, r: ST): string {
  const slug = slugOf(r.sunElement, r.moonElement)
  return `<a class="tcard" href="${charHref(lang, slug)}"><span class="tav">${mascot(r.sunElement, r.moonElement, 58)}</span><span class="tcombo">${elementLabel(r.sunElement)} × ${elementLabel(r.moonElement)}</span><span class="tname">${esc(quoted(r.type.name))}</span><span class="tcopy">${esc(r.type.copy)}</span></a>`
}

/** 紹介LP */
export function renderLP(lang: Lang): string {
  setLang(lang)
  const t = ui()
  const P = PAGE_STRINGS[lang]
  const types = allStarTypes()
  const grid = types.map((r) => tcard(lang, r)).join('')
  const elements = ELEMENT_ORDER.map(
    (el) => `<div class="elrow">${elMark(el)}<span><b>${esc(elementLabel(el))}</b>${esc(t.about.elements[el])}</span></div>`,
  ).join('')
  const steps = P.steps
    .map((s, i) => `<div class="step"><span class="n">${i + 1}</span><span><b>${esc(s.t)}</b><br/>${esc(s.d)}</span></div>`)
    .join('')
  const faq = t.faq.items
    .map((q) => `<details><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`)
    .join('')

  const body = `
<div class="hero">
  <div class="hero-mascot">${brand(116)}</div>
  <h1>${esc(t.home.tagline1)}</h1>
  <p>${esc(t.home.tagline2)}</p>
  <a class="cta" href="/app?lang=${lang}">${esc(P.cta)}</a>
  <p class="note">${esc(P.heroNote)}</p>
</div>

<section>
  <h2>${esc(t.about.title)}</h2>
  <div class="prose">${t.about.what.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  <div class="formula">
    <div class="fbox"><div class="lb">☉ ${esc(t.about.sunElement)}</div><div class="el">4</div></div>
    <div class="fbox"><div class="lb">☽ ${esc(t.about.moonElement)}</div><div class="el">4</div></div>
  </div>
  <p class="lead">${esc(t.about.howTitle)} — 4 × 4 = 16</p>
  <p class="lead" style="font-weight:700;color:var(--ink);margin-bottom:8px">${esc(t.about.elementsTitle)}</p>
  <div class="els">${elements}</div>
</section>

<section>
  <h2>${esc(t.about.listTitle)}</h2>
  <p class="lead">${esc(t.about.listSub)}</p>
  <div class="tgrid">${grid}</div>
</section>

<section>
  <h2>${esc(P.howTo)}</h2>
  <div class="steps">${steps}</div>
  <div class="cta-block"><a class="cta" href="/app?lang=${lang}">${esc(P.cta)}</a></div>
</section>

<section class="faq">
  <h2>${esc(t.faq.title)}</h2>
  ${faq}
</section>
`
  return layout({
    lang,
    title: `${t.home.appTitle}｜${t.home.tagline2}`,
    description: `${t.home.tagline1} ${t.home.tagline2}`,
    ogTitle: `${t.home.appTitle} 〜Starflect〜`,
    ogImage: `${ORIGIN}/ogp/default.png`,
    body,
    kind: 'lp',
    redirectIfCompanion: true,
  })
}

/** キャラ別ページ。無効な slug は null */
export function renderCharPage(lang: Lang, slug: string): string | null {
  setLang(lang)
  const t = ui()
  const P = PAGE_STRINGS[lang]
  const types = allStarTypes()
  const r = types.find((x) => slugOf(x.sunElement, x.moonElement) === slug)
  if (!r) return null
  const others = types.filter((x) => x !== r).map((x) => tcard(lang, x)).join('')
  const qname = quoted(r.type.name)
  const body = `
<div class="chero">
  <div class="av" style="background:#f3eefb">${mascot(r.sunElement, r.moonElement, 118)}</div>
  <h1><span class="grad">${esc(qname)}</span></h1>
  <p class="cp">${esc(r.type.copy)}</p>
</div>

<div class="prose"><p>${esc(r.type.text)}</p></div>

<div class="formula">
  <div class="fbox"><div class="lb">☉ ${esc(t.about.outer)}</div><div class="el">${elMark(r.sunElement)} ${esc(elementPhrase(r.sunElement))}</div></div>
  <div class="fbox"><div class="lb">☽ ${esc(t.about.inner)}</div><div class="el">${elMark(r.moonElement)} ${esc(elementPhrase(r.moonElement))}</div></div>
</div>

<div class="cta-block">
  <a class="cta" href="/app?lang=${lang}">${esc(P.cta)}</a>
  <p class="note">${esc(P.heroNote)}</p>
</div>

<section>
  <h2>${esc(P.otherTitle)}</h2>
  <p class="lead">${esc(t.about.listSub)}</p>
  <div class="tgrid">${others}</div>
</section>

<a class="back" href="${lpHref(lang)}">${esc(P.backToTop)}</a>
`
  return layout({
    lang,
    title: `${P.charTitle(r.type.name)}｜${t.home.appTitle}`,
    description: `${qname}: ${r.type.copy} ${r.type.text}`,
    ogTitle: `${qname}｜${t.home.appTitle}`,
    ogImage: `${ORIGIN}/ogp/${slug}.png`,
    body,
    kind: 'char',
    slug,
  })
}
